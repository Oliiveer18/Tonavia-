// criatura3d.js — CRIATURAS 3D del HD-2D (v2.169 · ZEFIRAX 3D, pasos 2-5 de docs/FICHA_ZEFIRAX_3D.md). PURO: sin Three.js, sin DOM, sin Math.random; se prueba en node.
// Misma interfaz que G.personaje3d para que el pintor use el mismo código: de('zefirax') → { id, BRILLO, TONO_TEX, YAW, MAX_TRIANGULOS, pose(fase, yaw), girar, velocidad(moving), geometria(pose), atlas(), uvPoligono(poligono, atlas) }.
// Cuerpo: tubo hexagonal de 16 tramos sobre una hélice aplastada (la «S»); la onda viaja por la fase (la lleva el pintor) y se apaga hacia la cabeza para que esta casi no se mueva. Cabeza: caja con las texturas RECORTADAS del dibujo 2D
// (G.ZEFIRAX_CABEZAS) + 2 cuernos. Crin y jirones: láminas cruzadas con textura de nube y recorte duro (alphaTest; el pintor las dibuja a doble cara).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const AJUSTES = { INCLINACION: 0.05 };   // INCLINACION = cuánto baja la cabeza hacia delante (rad)
  const U = 1 / 16, TR = 16, LADOS = 6, MAX_TRIANGULOS = 500;
  const BRILLO = 1.12, TONO_TEX = { arriba: 1, luz: 0.95, base: 0.89, sombra: 0.72 };
  const Y_COL = '#ffe433';
  const COL_CARA = ['#e6f2ff', '#7ec8f2', '#b3b0e6', '#26337f', '#b3b0e6', '#7ec8f2'];   // lomo W · C · w · vientre N · w · C
  const BANDAS = [1, 3, 5, 7, 9, 11], CARAS_BANDA = [0, 1, 5];
  const RADIOS = [[0, 0.2], [0.08, 0.19], [0.55, 0.18], [0.8, 0.125], [1, 0.05]];
  const rotY = (p, a) => { const co = Math.cos(a), si = Math.sin(a); return [p[0] * co + p[2] * si, p[1], -p[0] * si + p[2] * co]; };
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const radio = (t) => { for (let i = 1; i < RADIOS.length; i++) if (t <= RADIOS[i][0]) { const a = RADIOS[i - 1], b = RADIOS[i]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); } return RADIOS[RADIOS.length - 1][1]; };
  const OMEGA = { quieto: (2 * Math.PI) / 3.0, anda: (2 * Math.PI) / 2.0 };
  const velocidad = (moving) => (moving ? OMEGA.anda : OMEGA.quieto);   // rad/s de la fase de la onda (el pintor la acumula para que no dé saltos al arrancar o parar)
  function curva(t, fase) {
    const s = Math.min(1, t / 0.3), env = s * s * (3 - 2 * s), w = (2 * Math.PI * t) / 0.7 - fase;
    return [-0.68 * env * Math.sin(w) * (1 - 0.15 * t), 1.45 - 1.25 * t, 0.52 * env * Math.sin(w - 1.2) * (1 - 0.1 * t)];
  }
  const pose = (fase, yaw, cam) => ({ fase: typeof fase === 'number' ? fase : 0, yaw: typeof yaw === 'number' ? yaw : 0, cam: typeof cam === 'number' ? cam : 0 });   // cam = giro de la cámara (para que el nimbo mire siempre a ella)

  // ── texturas (cuadrículas de colores, sin azar) ──
  const crop = (map, y0, y1, Z, alto, relleno) => { const filas = []; for (let y = y0; y < y1; y++) { const r = map[y]; filas.push(r ? r.split('').map((ch) => (ch === '.' || ch === ' ' ? null : Z[ch])) : null); } const w = map[0].length; return filas.map((f) => f || Array(w).fill(relleno)); };
  function nube(w, h, lumpy) {   // elipse con borde ondulado: H blanco, W, w; fuera = transparente (recorte duro)
    const px = [];
    for (let y = 0; y < h; y++) { const fila = []; for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2), th = Math.atan2(dy, dx), d = (dx * dx + dy * dy) / Math.pow(1 + lumpy * Math.sin(3 * th), 2);
      fila.push(d < 0.42 ? '#ffffff' : d < 0.75 ? '#e6f2ff' : d < 1 ? '#b3b0e6' : null); } px.push(fila); }
    return px;
  }
  function celdasDe() {
    const C = G.ZEFIRAX_CABEZAS; if (!C) return null;
    return [
      { id: 'blanco', w: 1, h: 1, px: [['#ffffff']] },
      { id: 'cabeza_sur', px: crop(C.frente, 2, 10, C.paleta) },
      { id: 'cabeza_norte', px: crop(C.espalda, 2, 10, C.paleta, 8, C.paleta.C) },
      { id: 'cabeza_lado', px: crop(C.perfil, 2, 10, C.paleta) },
      { id: 'crin', px: nube(10, 8, 0.14) },
      { id: 'jiron', px: nube(8, 6, 0.12) },
    ].map((c) => { c.h = c.px.length; c.w = c.px[0].length; return c; });
  }
  let ATLAS = null;
  function atlas() {
    if (ATLAS) return ATLAS;
    const celdas = celdasDe(); if (!celdas) throw new Error('criatura3d: faltan las cabezas de Zefirax (G.ZEFIRAX_CABEZAS)');
    const AW = 64, rects = {}; let x = 0, y = 0, fila = 0;
    celdas.forEach((c) => { if (x + c.w > AW) { x = 0; y += fila + 1; fila = 0; } c.x = x; c.y = y; rects[c.id] = { x, y, w: c.w, h: c.h }; x += c.w + 1; fila = Math.max(fila, c.h); });
    return (ATLAS = { w: AW, h: y + fila, celdas, rects });
  }
  function uvPoligono(q, at) {
    const R = q.tex && at.rects[q.tex];
    if (!R) { const b = at.rects.blanco; return { tex: false, uv: [0, 1, 2, 3].map(() => [(b.x + 0.5) / at.w, 1 - (b.y + 0.5) / at.h]) }; }
    const e = 0.02, u0 = (R.x + e) / at.w, u1 = (R.x + R.w - e) / at.w, v0 = 1 - (R.y + e) / at.h, v1 = 1 - (R.y + R.h - e) / at.h;
    const uv = [[u0, v0], [u0, v1], [u1, v1], [u1, v0]];   // esquinas en orden: arriba-izq, abajo-izq, abajo-der, arriba-der
    if (q.espejo) { uv[0][0] = uv[1][0] = u1; uv[2][0] = uv[3][0] = u0; }
    return { tex: true, uv };
  }

  // ── color por tono con la rampa del juego (una rampa por color) ──
  const K = { arriba: 'l2', luz: 'l1', base: 'base', sombra: 's1' }, RAMPAS = {};
  const colorDe = (col, tn) => { if (!G.rampa) return col; return (RAMPAS[col] || (RAMPAS[col] = G.rampa(col)))[K[tn]]; };

  function geometria(po) {
    po = po || pose(0, 0);
    const tono = G.personaje3d.tono, poligonos = [];
    const add = (pieza, cara, col, v, nl, o) => {   // v en local; se gira por el yaw; nl = normal local
      o = o || {}; if (o.inc) { v = v.map(incl); nl = [nl[0], nl[1] * ci - nl[2] * si, nl[2] * ci + nl[1] * si]; } const n = rotY(nl, po.yaw), tn = o.tono || tono(n), vv = v.map((p) => rotY(p, po.yaw));
      poligonos.push({ pieza, cara, tono: tn, col, color: o.liso ? col : colorDe(col, tn), n, v: vv, tex: o.tex || null, espejo: !!o.espejo });
    };
    // cuerpo
    const anillos = [];
    for (let i = 0; i <= TR; i++) {
      const t = i / TR, P0 = curva(t, po.fase), a = curva(Math.max(0, t - 0.01), po.fase), b = curva(Math.min(1, t + 0.01), po.fase), T = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
      const ref = [0, 0, 1], d = ref[0] * T[0] + ref[1] * T[1] + ref[2] * T[2], Uu = norm([ref[0] - d * T[0], ref[1] - d * T[1], ref[2] - d * T[2]]), Rr = norm(cruz(Uu, T)), r = radio(t);
      const dir = [], vert = [];
      for (let k = 0; k < LADOS; k++) { const ac = (k * Math.PI) / 3; dir.push([Uu[0] * Math.cos(ac) + Rr[0] * Math.sin(ac), Uu[1] * Math.cos(ac) + Rr[1] * Math.sin(ac), Uu[2] * Math.cos(ac) + Rr[2] * Math.sin(ac)]); }
      for (let k = 0; k < LADOS; k++) { const av = (k * Math.PI) / 3 - Math.PI / 6; vert.push([P0[0] + r * (Uu[0] * Math.cos(av) + Rr[0] * Math.sin(av)), P0[1] + r * (Uu[1] * Math.cos(av) + Rr[1] * Math.sin(av)), P0[2] + r * (Uu[2] * Math.cos(av) + Rr[2] * Math.sin(av))]); }
      anillos.push({ P: P0, T, Uu, Rr, r, dir, vert });
    }
    for (let i = 0; i < TR; i++) for (let k = 0; k < LADOS; k++) {
      const A = anillos[i], B = anillos[i + 1], k2 = (k + 1) % LADOS, banda = BANDAS.indexOf(i) >= 0 && CARAS_BANDA.indexOf(k) >= 0;
      const dm = norm([A.dir[k][0] + B.dir[k][0], A.dir[k][1] + B.dir[k][1], A.dir[k][2] + B.dir[k][2]]);
      add('cuerpo_' + i, 'f' + k, banda ? Y_COL : COL_CARA[k], [A.vert[k], A.vert[k2], B.vert[k2], B.vert[k]], dm, banda ? { liso: true, tono: 'luz' } : null);
    }
    const CY = 1.64, inc = AJUSTES.INCLINACION, ci = Math.cos(inc), si = Math.sin(inc);
    let cabCz = 0;   // eje de giro de la cabeza (z del centro), se fija abajo
    const incl = (p) => { const dy = p[1] - CY, dz = p[2] - cabCz; return [p[0], CY + dy * ci - dz * si, cabCz + dz * ci + dy * si]; };   // la parte alta de la cabeza se adelanta: mirada baja y amenazante
    // cabeza: caja (x ±hw, y y0..y1, z ±hd) con el hocico hacia +z
    const hw = 0.27, hd = 0.28, y0 = 1.42, y1 = 1.86, zc = 0.04, C = anillos[0].P, cx = C[0], cz = C[2] + zc, _cz = (cabCz = cz), X0 = cx - hw, X1 = cx + hw, Z0 = cz - hd, Z1 = cz + hd;
    add('cabeza', 'sur', '#7ec8f2', [[X0, y1, Z1], [X0, y0, Z1], [X1, y0, Z1], [X1, y1, Z1]], [0, 0, 1], { tex: 'cabeza_sur', tono: 'arriba', inc: true });   // la cara brilla (ojos luminosos)
    add('cabeza', 'norte', '#7ec8f2', [[X1, y1, Z0], [X1, y0, Z0], [X0, y0, Z0], [X0, y1, Z0]], [0, 0, -1], { tex: 'cabeza_norte', inc: true });
    add('cabeza', 'este', '#7ec8f2', [[X1, y1, Z1], [X1, y0, Z1], [X1, y0, Z0], [X1, y1, Z0]], [1, 0, 0], { tex: 'cabeza_lado', inc: true });
    add('cabeza', 'oeste', '#7ec8f2', [[X0, y1, Z0], [X0, y0, Z0], [X0, y0, Z1], [X0, y1, Z1]], [-1, 0, 0], { tex: 'cabeza_lado', espejo: true, inc: true });
    add('cabeza', 'arriba', '#7ec8f2', [[X0, y1, Z0], [X0, y1, Z1], [X1, y1, Z1], [X1, y1, Z0]], [0, 1, 0], { inc: true });
    add('cabeza', 'abajo', '#b3b0e6', [[X0, y0, Z1], [X0, y0, Z0], [X1, y0, Z0], [X1, y0, Z1]], [0, -1, 0], { inc: true });
    // cuernos (dorados): tronco de pirámide que sube y se abre hacia fuera y atrás
    [-1, 1].forEach((sg) => {
      const bx = cx + sg * 0.22, bz = cz - 0.06, b = 0.06, ty = y1 + 0.36, tx = bx + sg * 0.12, tz = bz - 0.2, c = 0.02;
      const B = [[bx - b, y1, bz - b], [bx + b, y1, bz - b], [bx + b, y1, bz + b], [bx - b, y1, bz + b]], Tp = [[tx - c, ty, tz - c], [tx + c, ty, tz - c], [tx + c, ty, tz + c], [tx - c, ty, tz + c]];
      [[0, 1, [0, 0, -1]], [1, 2, [1, 0, 0]], [2, 3, [0, 0, 1]], [3, 0, [-1, 0, 0]]].forEach(([i, j, n]) => add('cuerno', 'l' + i, '#f2b632', [B[i], B[j], Tp[j], Tp[i]], n, { inc: true }));
    });
    // crin: 5 láminas cruzadas detrás de la cabeza (nube con recorte duro)
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI) / 9, ca = Math.cos(a), sa = Math.sin(a), px = cx, pz = cz - 0.2, w = 0.3, ya = 1.98, yb = 1.55;
      add('crin', 'l' + i, '#ffffff', [[px - ca * w, ya, pz + sa * w], [px - ca * w, yb, pz + sa * w], [px + ca * w, yb, pz - sa * w], [px + ca * w, ya, pz - sa * w]], [sa, 0, ca], { tex: 'crin', tono: 'luz', inc: true });
    }
    // jirones de nube pegados al cuerpo (2 láminas cruzadas cada uno)
    [[0.3, 1], [0.48, -1], [0.64, 1], [0.8, -1]].forEach(([t, sg], j) => {
      const P0 = curva(t, po.fase), r = radio(t), ox = P0[0] + sg * (r + 0.13), oz = P0[2] - 0.06, w = 0.15 - j * 0.015, h = 0.11 - j * 0.01, oy = P0[1];
      add('jiron' + j, 'a', '#ffffff', [[ox - w, oy + h, oz], [ox - w, oy - h, oz], [ox + w, oy - h, oz], [ox + w, oy + h, oz]], [0, 0, 1], { tex: 'jiron', tono: 'luz' });
      add('jiron' + j, 'b', '#ffffff', [[ox, oy + h, oz - w], [ox, oy - h, oz - w], [ox, oy - h, oz + w], [ox, oy + h, oz + w]], [1, 0, 0], { tex: 'jiron', tono: 'luz' });
    });
    return { poligonos, triangulos: poligonos.length * 2 };
  }
  // Chispas eléctricas (paso 6): cuadritos de 1/16 u para la malla de partículas del pintor (mismo formato que G.particulas3d.pixeles). Sin azar: salen del cuadro n del reloj visual y de la pose.
  function chispas(n, fase, yaw, o) {
    const out = [], ts = [0.14, 0.22, 0.32, 0.42, 0.52, 0.6, 0.7, 0.8, 0.88, 0.96];
    ts.forEach((t, i) => {
      const ph = (n + i * 3) % 8; if (ph > 3) return;   // cada chispa brilla 4 de cada 8 cuadros, desfasadas
      const c = curva(t, fase), r = radio(t) + 0.1 + 0.05 * ph, a = i * 2.1 + n * 0.9, p = rotY([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.8, c[2] + Math.sin(a * 1.3) * r], yaw), col = ph < 2 ? '#ffffff' : '#ffe433';
      out.push({ x: o[0] + p[0], y: o[1] + p[1], z: o[2] + p[2], dx: 0, dy: 0, c: col, k: 'v', t: 'destello' });
      if (i === 1 && n % 6 === 0) [[1, 1], [0, 2], [1, 3], [0, 4]].forEach(([a2, b2]) => out.push({ x: o[0] + p[0], y: o[1] + p[1], z: o[2] + p[2], dx: a2, dy: b2, c: '#ffffff', k: 'v', t: 'destello' }));   // rayo corto en zigzag
      if (ph === 0) out.push({ x: o[0] + p[0], y: o[1] + p[1], z: o[2] + p[2], dx: 1, dy: 1, c: '#ffe433', k: 'v', t: 'destello' });
    });
    return out;
  }
  // ── Registro (v2.225): cada criatura 3D se registra con su id y una fábrica que devuelve el módulo con la misma interfaz que G.personaje3d (o null si faltan sus datos). El pintor no conoce ids concretos. ──
  const REGISTRO = {}, PLANEADAS = ['nubecin', 'arenel'];   // PLANEADAS: criaturas con 3D previsto (docs/ROADMAP.md); siguen en 2D hasta que se registren
  function registrar(id, fabrica) { if (typeof id !== 'string' || typeof fabrica !== 'function') throw new Error('criatura3d.registrar(id, fabrica)'); REGISTRO[id] = fabrica; }
  const ids = () => Object.keys(REGISTRO);
  function de(id) { const f = Object.prototype.hasOwnProperty.call(REGISTRO, id) ? REGISTRO[id] : null; return f ? f() : null; }
  registrar('zefirax', () => (!G.personaje3d || !G.ZEFIRAX_CABEZAS ? null : { id: 'zefirax', BRILLO, TONO_TEX, MAX_TRIANGULOS, doble: true, YAW: G.personaje3d.YAW, girar: G.personaje3d.girar, velocidad, pose, geometria, atlas, uvPoligono, chispas }));
  G.criatura3d = { AJUSTES, chispas, registrar, ids, PLANEADAS, de, curva, radio, pose, geometria, atlas, uvPoligono, velocidad, MAX_TRIANGULOS, BRILLO, TONO_TEX, TR };
})(typeof window !== 'undefined' ? window : globalThis);
