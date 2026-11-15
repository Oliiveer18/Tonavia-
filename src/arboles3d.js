// arboles3d.js — ÁRBOLES 3D del HD-2D (v2.198, docs/FICHA_ARBOLES_3D.md). PURO: no toca Three, el DOM ni el estado; sin Math.random.
// Cada árbol = UN tronco de 8 lados + UNA copa limpia de caras planas (sólido de revolución de 8-10 lados; el abeto, tres conos), con luz arriba-izquierda y los 5 verdes del 2D (G.sombreado.COL.copa).
//   G.arboles3d.TIPOS            → medidas de cada tipo (u; 1 u = 1 casilla = 16 px): alto, tronco, copa
//   G.arboles3d.modelo(tipo)     → { pos, col, idx, n (triángulos), alto, troncoH, radio }  centrado en x/z = 0 y con los pies en y = 0 (caras sin compartir: cada cara lleva su tono)
//   G.arboles3d.build(lista)     → { pos, col, idx, n, items: [{ v0, nv, tipo, x, z, alto, troncoH }] }  lista = [{ tipo, x, y, z }] (centro del tronco, pies); una sola malla para todos
//   G.arboles3d.sombras(lista)   → { pos, idx }  discos planos bajo cada copa (el pintor los dibuja translúcidos)
(function (root) {
  'use strict';
  const G = root.G;
  const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  const TIPOS = {
    arbol_pequeno: { alto: 1.0, tronco: { h: 0.375, w: 0.25 }, lados: 8, anillos: [[0.30, 0.30], [0.50, 0.42], [0.50, 0.72], [0.36, 0.92], [0.14, 1.0]] },
    arbol_mediano: { alto: 1.5, tronco: { h: 0.5, w: 0.25 }, lados: 8, anillos: [[0.30, 0.45], [0.46, 0.60], [0.50, 0.95], [0.44, 1.25], [0.28, 1.42], [0.12, 1.5]] },
    abeto: { alto: 2.0, tronco: { h: 0.44, w: 0.19 }, lados: 8, oscuro: true, conos: [[0.46, 0.35, 1.05], [0.37, 0.80, 1.55], [0.27, 1.25, 2.0]] },
    roble_hito: { alto: 2.5, tronco: { h: 0.8, w: 0.375, raices: true }, lados: 10, anillos: [[0.45, 0.78], [0.78, 0.98], [0.90, 1.35], [0.90, 1.85], [0.76, 2.2], [0.44, 2.42], [0.16, 2.5]] },
  };
  // v2.251 · TAMAÑOS (pedido del usuario: un árbol siempre es más grande que una persona; Oli mide 1,44 u). Alto ×k y anchura de la copa ×0,8·k: pequeño 1→2,2 u · mediano 1,5→3,0 · abeto 2→3,8 · roble 2,5→5,0.
  { const K = { arbol_pequeno: 2.2, arbol_mediano: 2.0, abeto: 1.9, roble_hito: 2.0 };
    Object.keys(K).forEach((t) => { const T = TIPOS[t], k = K[t], kr = 0.8 * k; T.alto *= k; T.tronco.h *= k; T.tronco.w *= kr; if (T.anillos) T.anillos = T.anillos.map(([r, y]) => [r * kr, y * k]); if (T.conos) T.conos = T.conos.map(([r, y0, y1]) => [r * kr, y0 * k, y1 * k]); }); }

  const LUZ = (() => { const v = [-0.55, 0.75, 0.45], l = Math.hypot(v[0], v[1], v[2]); return v.map((q) => q / l); })();
  const colores = () => { const C = G.sombreado.COL; return { copa: [C.copa.c0, C.copa.c1, C.copa.c2, C.copa.c3, C.copa.c4].map(hex), tronco: { luz: hex(C.tronco.luz), base: hex(C.tronco.base), sombra: hex(C.tronco.sombra) } }; };
  const cache = {};
  function modelo(tipo) {
    if (cache[tipo]) return cache[tipo];
    const T = TIPOS[tipo]; if (!T) return null; const K = colores(), pos = [], col = [], idx = [], N = T.lados;
    const tri = (a, b, c, color) => { const i = pos.length / 3; pos.push(...a, ...b, ...c); for (let k = 0; k < 3; k++) col.push(...color); idx.push(i, i + 1, i + 2); };
    const quad = (a, b, c, d, color) => { tri(a, b, c, color); tri(a, c, d, color); };
    const tonoCopa = (n) => { const s = n[0] * LUZ[0] + n[1] * LUZ[1] + n[2] * LUZ[2]; let k = s > 0.72 ? 4 : s > 0.45 ? 3 : s > 0.15 ? 2 : s > -0.2 ? 1 : 0; if (T.oscuro) k = Math.max(0, k - 1); return K.copa[k]; };
    const normal = (a, b, c) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(n[0], n[1], n[2]) || 1; const g = [(a[0] + b[0] + c[0]) / 3, (a[2] + b[2] + c[2]) / 3], s = n[0] * g[0] + n[2] * g[1] < 0 ? -1 : 1; return [s * n[0] / l, s * n[1] / l, s * n[2] / l]; };
    const rot = Math.PI / N;   // las caras (no las aristas) miran de frente: el árbol no parece una «estrella» al girar la cámara
    const ang = (k) => rot + k * 2 * Math.PI / N, P = (r, y, a) => [Math.sin(a) * r, y, Math.cos(a) * r];
    // tronco: prisma de 8 lados (luz a la izquierda, sombra a la derecha)
    { const r = T.tronco.w / 2 / Math.cos(Math.PI / 8), h = T.tronco.h;
      for (let k = 0; k < 8; k++) { const a0 = Math.PI / 8 + k * Math.PI / 4, a1 = a0 + Math.PI / 4, am = (a0 + a1) / 2, nx = Math.sin(am), c = nx < -0.35 ? K.tronco.luz : nx > 0.35 ? K.tronco.sombra : K.tronco.base;
        quad(P(r, 0, a0), P(r, 0, a1), P(r, h, a1), P(r, h, a0), c); }
      if (T.tronco.raices) for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3 + 0.5, o = r + 0.17, w = 0.08, p = (rr, y, da) => P(rr, y, a + da); tri(p(o, 0, -w / o), p(o, 0, w / o), p(r * 0.92, 0.3, 0), k === 1 ? K.tronco.sombra : K.tronco.base); } }
    // copa: sólido de revolución (caras planas, un tono por cara)
    const revolucion = (anillos, lados) => { const n = lados;
      for (let i = 0; i < anillos.length - 1; i++) { const [r0, y0] = anillos[i], [r1, y1] = anillos[i + 1];
        for (let k = 0; k < n; k++) { const a0 = rot + k * 2 * Math.PI / n, a1 = rot + (k + 1) * 2 * Math.PI / n, A = P(r0, y0, a0), B = P(r0, y0, a1), C = P(r1, y1, a1), D = P(r1, y1, a0);
          if (r1 < 0.001) { tri(A, B, [0, y1, 0], tonoCopa(normal(A, B, [0, y1, 0]))); } else quad(A, B, C, D, tonoCopa(normal(A, B, C))); } }
      const [rb, yb] = anillos[0], [rt, yt] = anillos[anillos.length - 1];
      for (let k = 0; k < n; k++) { const a0 = rot + k * 2 * Math.PI / n, a1 = rot + (k + 1) * 2 * Math.PI / n; tri(P(rb, yb, a1), P(rb, yb, a0), [0, yb, 0], K.copa[0]); if (rt > 0.001) tri(P(rt, yt, a0), P(rt, yt, a1), [0, yt, 0], K.copa[T.oscuro ? 3 : 4]); } };
    if (T.conos) T.conos.forEach(([r, y0, y1]) => revolucion([[r, y0], [0, y1]], N)); else revolucion(T.anillos, N);
    let radio = 0; (T.conos ? T.conos.map((c) => c[0]) : T.anillos.map((a) => a[0])).forEach((r) => { if (r > radio) radio = r; });
    return (cache[tipo] = { pos: Float32Array.from(pos), col: Float32Array.from(col), idx: Uint16Array.from(idx), n: idx.length / 3, alto: T.alto, troncoH: T.tronco.h, radio });
  }
  function build(lista) {
    const pos = [], col = [], idx = [], items = [];
    lista.forEach((a) => { const m = modelo(a.tipo); if (!m) return; const v0 = pos.length / 3, nv = m.pos.length / 3;
      for (let i = 0; i < nv; i++) pos.push(m.pos[i * 3] + a.x, m.pos[i * 3 + 1] + a.y, m.pos[i * 3 + 2] + a.z);
      for (let i = 0; i < m.col.length; i++) col.push(m.col[i]); for (let i = 0; i < m.idx.length; i++) idx.push(m.idx[i] + v0);
      items.push({ v0, nv, tipo: a.tipo, x: a.x, z: a.z, y: a.y, alto: m.alto, troncoH: m.troncoH }); });
    return { pos: Float32Array.from(pos), col: Float32Array.from(col), idx: pos.length / 3 > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx), n: idx.length / 3, items };
  }
  function sombras(lista) {
    const pos = [], idx = [], N = 10;
    lista.forEach((a) => { const m = modelo(a.tipo); if (!m) return; const c = pos.length / 3, r = m.radio * 0.95; pos.push(a.x + 0.06, a.y + 0.012, a.z + 0.06);
      for (let k = 0; k < N; k++) { const t = k * 2 * Math.PI / N; pos.push(a.x + 0.06 + Math.sin(t) * r, a.y + 0.012, a.z + 0.06 + Math.cos(t) * r * 0.9); }
      for (let k = 0; k < N; k++) idx.push(c, c + 1 + k, c + 1 + (k + 1) % N); });
    return { pos: Float32Array.from(pos), idx: pos.length / 3 > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx) };
  }
  G.arboles3d = { TIPOS, modelo, build, sombras, LUZ };
})(typeof window !== 'undefined' ? window : globalThis);
