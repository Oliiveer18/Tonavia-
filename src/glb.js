// glb.js — Cargador mínimo de GLB con malla animada (Three r128, sin GLTFLoader). Lee 1 malla con skin + animaciones por huesos (Mixamo/Meshy).
// G.glb.parsear(buffer, THREE) → Promise<{ mesh: SkinnedMesh, clips: { nombre: AnimationClip }, alto, ancho }>. Solo corre en el navegador (textura por Image/Blob). Sin estado de juego.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const limpio = (s) => String(s).replace(/[^A-Za-z0-9_]/g, '_');   // r128 no acepta ':' ni '.' en nombres de pistas

  function leer(j, bin, i) {   // accessor → TypedArray (copia alineada)
    const a = j.accessors[i], v = j.bufferViews[a.bufferView], T = CT[a.componentType], n = NC[a.type], off = (v.byteOffset || 0) + (a.byteOffset || 0), esp = v.byteStride || n * T.BYTES_PER_ELEMENT;
    const out = new T(a.count * n);
    if (esp === n * T.BYTES_PER_ELEMENT) out.set(new T(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + a.count * n * T.BYTES_PER_ELEMENT)));
    else { const dv = new DataView(bin.buffer, bin.byteOffset + off); for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) { const o = k * esp + c * T.BYTES_PER_ELEMENT; out[k * n + c] = T === Float32Array ? dv.getFloat32(o, true) : T === Uint16Array ? dv.getUint16(o, true) : T === Uint32Array ? dv.getUint32(o, true) : T === Uint8Array ? dv.getUint8(o) : T === Int16Array ? dv.getInt16(o, true) : dv.getInt8(o); } }
    return out;
  }

  function parsear(buffer, Th) {
    const dv = new DataView(buffer); if (dv.getUint32(0, true) !== 0x46546c67) return Promise.reject(new Error('glb: cabecera no válida'));
    const lj = dv.getUint32(12, true), j = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, lj))), ob = 20 + lj + 8, bin = new Uint8Array(buffer, ob, dv.getUint32(ob - 8, true));
    // 1 · nodos (huesos y malla)
    const juntas = new Set(j.skins[0].joints), nodos = j.nodes.map((n, i) => { if (n.mesh !== undefined) return null; const o = juntas.has(i) ? new Th.Bone() : new Th.Object3D();
      o.name = limpio(n.name); if (n.translation) o.position.fromArray(n.translation); if (n.rotation) o.quaternion.fromArray(n.rotation); if (n.scale) o.scale.fromArray(n.scale); return o; });
    // 2 · malla con skin
    const iN = j.nodes.findIndex((n) => n.mesh !== undefined), nm = j.nodes[iN], pr = j.meshes[nm.mesh].primitives[0], A = pr.attributes, sk = j.skins[nm.skin];
    const g = new Th.BufferGeometry();
    g.setAttribute('position', new Th.BufferAttribute(leer(j, bin, A.POSITION), 3)); g.setAttribute('normal', new Th.BufferAttribute(leer(j, bin, A.NORMAL), 3)); g.setAttribute('uv', new Th.BufferAttribute(leer(j, bin, A.TEXCOORD_0), 2));
    g.setAttribute('skinIndex', new Th.BufferAttribute(leer(j, bin, A.JOINTS_0), 4)); g.setAttribute('skinWeight', new Th.BufferAttribute(leer(j, bin, A.WEIGHTS_0), 4)); g.setIndex(new Th.BufferAttribute(leer(j, bin, pr.indices), 1));
    // 3 · jerarquía (hijos), esqueleto y textura
    j.nodes.forEach((n, i) => { if (nodos[i] && n.children) n.children.forEach((c) => { if (nodos[c]) nodos[i].add(nodos[c]); }); });
    const huesos = sk.joints.map((i) => nodos[i]), inv = leer(j, bin, sk.inverseBindMatrices), bi = huesos.map((_, i) => new Th.Matrix4().fromArray(inv, i * 16)), raiz = new Th.Group();
    j.scenes[0].nodes.forEach((i) => { if (nodos[i]) raiz.add(nodos[i]); });
    const img = j.images[0], vi = j.bufferViews[img.bufferView], blob = new Blob([bin.slice(vi.byteOffset || 0, (vi.byteOffset || 0) + vi.byteLength)], { type: img.mimeType });
    return new Promise((ok, no) => {
      const im = new Image(), url = URL.createObjectURL(blob);
      im.onload = () => {
        const tx = new Th.Texture(im); tx.flipY = false; tx.anisotropy = 4; tx.needsUpdate = true; URL.revokeObjectURL(url);
        const mat = new Th.MeshLambertMaterial({ map: tx, skinning: true, side: Th.DoubleSide }), mesh = new Th.SkinnedMesh(g, mat);
        mesh.frustumCulled = false; raiz.add(mesh); raiz.updateMatrixWorld(true); mesh.bind(new Th.Skeleton(huesos, bi), new Th.Matrix4());
        // 4 · animaciones
        const clips = {};
        (j.animations || []).forEach((an) => {
          const pistas = an.channels.map((ch) => { const s = an.samplers[ch.sampler], t = leer(j, bin, s.input), v = leer(j, bin, s.output), nom = limpio(j.nodes[ch.target.node].name), p = ch.target.path;
            return p === 'rotation' ? new Th.QuaternionKeyframeTrack(nom + '.quaternion', t, v) : new Th.VectorKeyframeTrack(nom + (p === 'translation' ? '.position' : '.scale'), t, v); });
          clips[an.name.replace(/_\d+$/, '')] = new Th.AnimationClip(an.name, -1, pistas);
        });
        const bb = new Th.Box3().setFromBufferAttribute(g.getAttribute('position'));
        ok({ raiz, mesh, clips, alto: bb.max.y - bb.min.y, ancho: bb.max.x - bb.min.x, fondo: bb.max.z - bb.min.z });
      };
      im.onerror = () => no(new Error('glb: textura no válida')); im.src = url;
    });
  }
  // Registro (datos): id de criatura → archivo. El GLB NO va dentro del juego (pesa MB): se pide una vez, bajo demanda, junto al HTML; si falta o falla, se usa la lámina 2D y no se vuelve a pedir.
  const REG = { fosforin: { url: 'ignel_glb.wasm', k: 1.3 } }, bufs = {}, roto = {};
  const tiene = (id) => !!REG[id] && !roto[id] && typeof fetch === 'function' && !(typeof location !== 'undefined' && location.protocol === 'file:');   // abierto desde un archivo no se puede pedir el modelo
  function instancia(id, Th) {   // Promise<resultado de parsear>; el archivo se baja una sola vez y cada instancia reparsea su malla (un esqueleto por criatura en pantalla)
    if (!tiene(id)) return Promise.reject(new Error('glb: sin modelo'));
    const b = bufs[id] || (bufs[id] = fetch(REG[id].url).then((r) => { if (!r.ok) throw new Error('glb: ' + r.status); return r.arrayBuffer(); }));
    return b.then((ab) => parsear(ab, Th)).catch((e) => { roto[id] = true; throw e; });
  }
  G.glb = { parsear, instancia, tiene, REG };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.glb;
})(typeof window !== 'undefined' ? window : globalThis);
