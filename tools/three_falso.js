// three_falso.js — «Three.js de mentira» SOLO PARA PRUEBAS (v2.64). Sin internet no hay Three.js real (r128): esto imita únicamente las clases y métodos que usa src/hd2d_pintor.js, con la misma forma que la librería real,
// y se queda con lo que el pintor le pide (qué mallas hay, dónde, cuántas veces se dibuja). Sirve para probar la LÓGICA (botón, carga, vuelta al 2D, objetos del mapa, cámara, nombres, vigilante); NO dibuja nada,
// así que NO demuestra que el 3D se vea bien: eso hay que mirarlo con Three.js de verdad (tools/prueba_hd2d_albanota.py --three ruta o en el móvil). Si el pintor usa algo que no está aquí, la prueba falla (TypeError), que es lo que se quiere.
// Opciones (antes de cargar este archivo): window.__FALSO_OPC = { sinWebGL: true } hace que WebGLRenderer lance como un móvil sin WebGL; { msPorCuadro: 70 } hace que render() tarde ese tiempo (para probar el vigilante de velocidad).
(function () {
  'use strict';
  const opc = window.__FALSO_OPC || {}, reg = (window.__falso = { renders: 0, cuadros: [], desechadas: 0, escena: null, camara: null, luces: [] });
  class V3 { constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    project(cam) { // perspectiva de verdad con la cámara y su lookAt: x e y entre -1 y 1, z > 1 si está detrás
      const p = cam.position, t = cam.__mira || new V3(), sub = (a, b) => [a.x - b.x, a.y - b.y, a.z - b.z], nor = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const f = nor(sub(t, p)), r = nor(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(this, p), z = dot(d, f), x = dot(d, r), y = dot(d, u), k = 1 / Math.tan(cam.fov * Math.PI / 360);
      this.x = (x * k / cam.aspect) / (z || 1e-6); this.y = (y * k) / (z || 1e-6); this.z = z > 0 ? 0.5 : 2; return this; } }
  class Euler { constructor() { this.x = 0; this.y = 0; this.z = 0; } }
  class Color { constructor(c) { this.c = c; } set(c) { this.c = c; return this; } }
  class Object3D { constructor() { this.position = new V3(); this.rotation = new Euler(); this.scale = new V3(1, 1, 1); this.visible = true; this.renderOrder = 0; this.children = []; }
    add(...o) { o.forEach((x) => { if (!(x instanceof Object3D)) throw new TypeError('Scene.add: no es un Object3D'); this.children.push(x); }); return this; }
    remove(...o) { o.forEach((x) => { const i = this.children.indexOf(x); if (i >= 0) this.children.splice(i, 1); }); return this; } }
  class Scene extends Object3D {}
  class Group extends Object3D {}
  class Light extends Object3D { constructor(color, intensity) { super(); this.color = new Color(color); this.intensity = intensity; } }
  class AmbientLight extends Light {} class DirectionalLight extends Light {}
  class PerspectiveCamera extends Object3D { constructor(fov, aspect, near, far) { super(); this.fov = fov; this.aspect = aspect; this.near = near; this.far = far; } lookAt(x, y, z) { this.__mira = new V3(x, y, z); } updateProjectionMatrix() {} }
  class BufferAttribute { constructor(array, size) { this.array = Float32Array.from(array); this.itemSize = size; this.needsUpdate = false; } setXYZ(i, x, y, z) { this.array[i * 3] = x; this.array[i * 3 + 1] = y; this.array[i * 3 + 2] = z; return this; } }
  class Float32BufferAttribute extends BufferAttribute {}
  class BufferGeometry { constructor() { this.attributes = {}; this.index = null; this.disposed = false; }
    setAttribute(n, a) { if (!(a instanceof BufferAttribute)) throw new TypeError('setAttribute: no es un atributo'); this.attributes[n] = a; return this; }
    getAttribute(n) { return this.attributes[n]; } setIndex(i) { this.index = i; return this; } setDrawRange(a, b) { this.drawRange = { start: a, count: b }; return this; } translate() { return this; } rotateX() { return this; } dispose() { this.disposed = true; reg.desechadas++; } }
  class PlaneGeometry extends BufferGeometry { constructor(w, h) { super(); this.w = w; this.h = h; } }
  class CircleGeometry extends BufferGeometry { constructor(r, n) { super(); this.r = r; this.n = n; } }
  class Texture { constructor(image) { this.image = image; this.needsUpdate = false; this.magFilter = 0; this.minFilter = 0; this.generateMipmaps = true; this.disposed = false; } dispose() { this.disposed = true; reg.desechadas++; } }
  class CanvasTexture extends Texture { constructor(c) { super(c); if (!c || typeof c.getContext !== 'function') throw new TypeError('CanvasTexture: hace falta un lienzo'); this.needsUpdate = true; } }
  class Material { constructor(p) { p = p || {}; if (p.map !== undefined && p.map !== null && !(p.map instanceof Texture)) throw new TypeError('material: map no es una textura'); Object.assign(this, { map: null, color: new Color(0xffffff), transparent: false, opacity: 1, alphaTest: 0, side: 0, depthWrite: true, vertexColors: false }, p); if (typeof p.color === 'number') this.color = new Color(p.color); }
    dispose() { this.disposed = true; reg.desechadas++; } }
  class MeshBasicMaterial extends Material {} class MeshLambertMaterial extends Material {}
  class Mesh extends Object3D { constructor(g, m) { super(); if (!(g instanceof BufferGeometry)) throw new TypeError('Mesh: falta la geometría'); if (!(m instanceof Material)) throw new TypeError('Mesh: falta el material'); this.geometry = g; this.material = m; } }
  class WebGLRenderer { constructor(p) { if (opc.sinWebGL) throw new Error('Error creating WebGL context.'); this.domElement = p.canvas; this.pr = 1; }
    setPixelRatio(r) { this.pr = r; } getPixelRatio() { return this.pr; } setClearColor() {} dispose() { this.muerto = true; }
    setSize(w, h, estilo) { this.domElement.width = Math.floor(w * this.pr); this.domElement.height = Math.floor(h * this.pr); if (estilo !== false) { this.domElement.style.width = w + 'px'; this.domElement.style.height = h + 'px'; } }
    render(scene, cam) {
      if (this.muerto) throw new Error('render() tras dispose()'); if (opc.msPorCuadro) { const t = performance.now(); while (performance.now() - t < opc.msPorCuadro); }
      reg.renders++; reg.escena = scene; reg.camara = cam;
      const vis = scene.children.filter((o) => o instanceof Mesh && o.visible); // lo que «se vería»
      reg.cuadros = vis.map((o) => ({ x: o.position.x, y: o.position.y, z: o.position.z, sx: o.scale.x, sy: o.scale.y, sz: o.scale.z, ry: o.rotation.y, cuadrados: o.geometry.attributes.position ? o.geometry.attributes.position.array.length / 12 : 0, sombra: o.geometry instanceof CircleGeometry, plano: o.geometry instanceof PlaneGeometry, mapa: !!(o.material.map && o.material.map.image) }));
      for (const o of vis) { const mp = o.material.map; if (mp && mp.disposed) throw new Error('se dibuja con una textura ya liberada'); if (o.geometry.disposed) throw new Error('se dibuja con una geometría ya liberada'); }
    } }
  window.THREE = { Vector3: V3, Euler, Color, Object3D, Scene, Group, AmbientLight, DirectionalLight, PerspectiveCamera, BufferAttribute, Float32BufferAttribute, BufferGeometry, PlaneGeometry, CircleGeometry, Texture, CanvasTexture,
    MeshBasicMaterial, MeshLambertMaterial, Mesh, WebGLRenderer, NearestFilter: 1003, AdditiveBlending: 2, DoubleSide: 2, REVISION: 'falso' };
})();
