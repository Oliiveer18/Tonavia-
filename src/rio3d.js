// rio3d.js — PROPS DEL RÍO EN 3D (v2.172d, paso 4 del plan «agua en 3D»). PURO: sin Three, sin DOM, sin Math.random.
// Nenúfares (hoja redonda con muesca, y con flor) y juncos (tallos con espiga y hojas) como UNA malla de triángulos con color por vértice.
//   G.rio3d.modelo(props) → { pos, col, idx, base, partes }   props = [{ tipo: 'nenufar'|'nenufar_flor'|'juncos2'|'juncos3', x, z (centro, en casillas), y (altura de la base: la superficie del agua o el lecho) }]
//   G.rio3d.animar(modelo, t) recoloca los vértices para el instante t (segundos): los nenúfares flotan y giran despacio; los juncos se mecen con el viento. Determinista.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const TP = Math.PI * 2, T0 = { nenufar: 1, nenufar_flor: 1 }, hash = (a, b) => { let h = (Math.imul(a + 1, 374761393) + Math.imul(b + 1, 668265263)) >>> 0; h = (Math.imul(h ^ (h >>> 13), 1274126177)) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const VERDE = [0.27, 0.66, 0.34], VERDE2 = [0.19, 0.52, 0.30], VERDE3 = [0.40, 0.76, 0.38], ROSA = [0.98, 0.66, 0.80], ORO = [0.99, 0.84, 0.30], MARRON = [0.50, 0.30, 0.18], TALLO = [0.34, 0.66, 0.30], TALLO2 = [0.22, 0.50, 0.28];

  function constructor() {
    const pos = [], col = [], idx = [];
    const v = (p, c) => { pos.push(p[0], p[1], p[2]); col.push(c[0], c[1], c[2]); return pos.length / 3 - 1; };
    const tri = (a, b, c, ca, cb, cc) => { const i = v(a, ca), j = v(b, cb || ca), k = v(c, cc || ca); idx.push(i, j, k); };
    const quad = (a, b, c, d, col1) => { tri(a, b, c, col1); tri(a, c, d, col1); };
    return { pos, col, idx, tri, quad, n: () => pos.length / 3 };
  }

  // hoja de nenúfar: disco de 14 sectores con una muesca (1 sector sin cubrir), cara de arriba con el centro más claro y canto fino. Centro en (0, 0, 0).
  function hoja(B, r, flor, rot) {
    const N = 14, g = 0.03, ang = (i) => rot + (i / N) * TP, P = (i, rr, y) => [Math.cos(ang(i)) * rr, y, Math.sin(ang(i)) * rr];
    for (let i = 1; i < N; i++) { // el sector 0 es la muesca
      B.tri([0, g, 0], P(i, r, g), P(i + 1, r, g), VERDE3, VERDE, VERDE); // arriba
      B.tri([0, 0, 0], P(i + 1, r, 0), P(i, r, 0), VERDE2); // abajo
      B.quad(P(i, r, 0), P(i + 1, r, 0), P(i + 1, r, g), P(i, r, g), VERDE2); // canto
    }
    if (flor) { // 6 pétalos inclinados + centro dorado
      for (let k = 0; k < 6; k++) { const a = rot * 0.5 + (k / 6) * TP, a2 = a + 0.5, a3 = a - 0.5, c = [Math.cos(a) * 0.015, g, Math.sin(a) * 0.015]; B.tri(c, [Math.cos(a2) * 0.075, g + 0.03, Math.sin(a2) * 0.075], [Math.cos(a3) * 0.075, g + 0.03, Math.sin(a3) * 0.075], ORO, ROSA, ROSA); B.tri([Math.cos(a2) * 0.075, g + 0.03, Math.sin(a2) * 0.075], [Math.cos(a3) * 0.075, g + 0.03, Math.sin(a3) * 0.075], [Math.cos(a) * 0.11, g + 0.07, Math.sin(a) * 0.11], ROSA, ROSA, [1, 0.88, 0.94]); }
      B.quad([-0.02, g + 0.04, -0.02], [0.02, g + 0.04, -0.02], [0.02, g + 0.04, 0.02], [-0.02, g + 0.04, 0.02], ORO);
    }
  }
  // junco: tallo (prisma de 4 caras que se afina), espiga marrón y dos hojas finas. Base en (0, 0, 0); h = altura total.
  function junco(B, h, s, conEspiga, g) {
    g = g || 1;
    const w0 = 0.03 * g, w1 = 0.016 * g, seg = 4;
    for (let k = 0; k < seg; k++) { const y0 = (k / seg) * h, y1 = ((k + 1) / seg) * h, a = w0 + (w1 - w0) * (k / seg), b = w0 + (w1 - w0) * ((k + 1) / seg), c0 = k % 2 ? TALLO : TALLO2;
      B.quad([-a, y0, -a], [a, y0, -a], [b, y1, -b], [-b, y1, -b], c0); B.quad([a, y0, -a], [a, y0, a], [b, y1, b], [b, y1, -b], TALLO2); B.quad([a, y0, a], [-a, y0, a], [-b, y1, b], [b, y1, b], c0); B.quad([-a, y0, a], [-a, y0, -a], [-b, y1, -b], [-b, y1, b], TALLO2); }
    if (conEspiga) { const y0 = h * 0.82, y1 = h * 1.06 + 0.04, r = 0.05 * g; // espiga: prisma ancho con la punta afinada
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach((p, i, A) => { const q = A[(i + 1) % 4]; B.quad([p[0] * r, y0, p[1] * r], [q[0] * r, y0, q[1] * r], [q[0] * r * 0.8, y1 - 0.05, q[1] * r * 0.8], [p[0] * r * 0.8, y1 - 0.05, p[1] * r * 0.8], i % 2 ? MARRON : [0.60, 0.38, 0.22]); B.tri([p[0] * r * 0.8, y1 - 0.05, p[1] * r * 0.8], [q[0] * r * 0.8, y1 - 0.05, q[1] * r * 0.8], [0, y1, 0], MARRON); });
    }
    if (!s) return;
    [-1, 1].forEach((d) => { const hh = h * 0.62; B.tri([0, 0.02, 0], [0.05 * s * d, hh * 0.55, 0.02], [0.12 * s * d, hh, 0.03], TALLO2, TALLO, VERDE3); B.tri([0, 0.02, 0.01], [0.12 * s * d, hh, 0.03], [0.05 * s * d, hh * 0.55, -0.03], TALLO2, VERDE3, TALLO); });
  }

  // macolla de espadañas: hojas anchas y curvadas que caen hacia fuera + espigas marrones gruesas (+ flor amarilla opcional). Base en (0, 0, 0); H = altura de las hojas.
  const HOJA_B = [0.16, 0.42, 0.24], HOJA_T = [0.46, 0.78, 0.36], HOJA_M = [0.28, 0.60, 0.30], AMARILLO = [1.0, 0.84, 0.18], AMARILLO2 = [1.0, 0.94, 0.5];
  function macolla(B, nH, H, nE, flor, sem) {
    for (let i = 0; i < nH; i++) {
      const a = (i / nH) * TP + sem * 3.1, alt = H * (0.7 + 0.5 * hash(i, Math.round(sem * 97))), lean = 0.30 + 0.22 * hash(i + 11, Math.round(sem * 53)), ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca, wb = 0.07 + 0.025 * hash(i + 5, 7), S = 5;
      let prev = null;
      for (let k = 0; k <= S; k++) { const s = k / S, rad = lean * Math.pow(s, 1.6) * alt + 0.015, y = alt * (s - 0.38 * s * s * s), w = wb * (1 - 0.88 * s), c = k < 2 ? HOJA_B : k < 4 ? HOJA_M : HOJA_T;
        const cur = { L: [ca * rad - px * w, y, sa * rad - pz * w], R: [ca * rad + px * w, y, sa * rad + pz * w], c };
        if (prev) { B.tri(prev.L, prev.R, cur.R, prev.c, prev.c, cur.c); B.tri(prev.L, cur.R, cur.L, prev.c, cur.c, cur.c); } prev = cur; }
    }
    for (let e = 0; e < nE; e++) { const a = (e / nE) * TP + sem * 1.7 + 0.6, d = 0.07 + 0.05 * e, ox = Math.cos(a) * d, oz = Math.sin(a) * d, h = H * (1.05 + 0.1 * e);
      const sub = { n: () => B.n(), tri: (p1, p2, p3, c1, c2, c3) => B.tri([p1[0] + ox, p1[1], p1[2] + oz], [p2[0] + ox, p2[1], p2[2] + oz], [p3[0] + ox, p3[1], p3[2] + oz], c1, c2, c3), quad: (p1, p2, p3, p4, c) => B.quad([p1[0] + ox, p1[1], p1[2] + oz], [p2[0] + ox, p2[1], p2[2] + oz], [p3[0] + ox, p3[1], p3[2] + oz], [p4[0] + ox, p4[1], p4[2] + oz], c) };
      junco(sub, h, 0, true, 1.0); }
    if (flor) { const a = sem * 2.3, ox = Math.cos(a) * 0.16, oz = Math.sin(a) * 0.16, h = H * 1.0; // lirio: tallo + 5 pétalos
      const sub = { tri: (p1, p2, p3, c1, c2, c3) => B.tri([p1[0] + ox, p1[1], p1[2] + oz], [p2[0] + ox, p2[1], p2[2] + oz], [p3[0] + ox, p3[1], p3[2] + oz], c1, c2, c3), quad: (p1, p2, p3, p4, c) => B.quad([p1[0] + ox, p1[1], p1[2] + oz], [p2[0] + ox, p2[1], p2[2] + oz], [p3[0] + ox, p3[1], p3[2] + oz], [p4[0] + ox, p4[1], p4[2] + oz], c) };
      for (let k = 0; k < 5; k++) { const b1 = (k / 5) * TP, b2 = b1 + 0.9; sub.tri([0, h, 0], [Math.cos(b1) * 0.11, h + 0.07, Math.sin(b1) * 0.11], [Math.cos(b2) * 0.11, h + 0.05, Math.sin(b2) * 0.11], AMARILLO2, AMARILLO, AMARILLO); }
      sub.quad([-0.025, h + 0.03, -0.025], [0.025, h + 0.03, -0.025], [0.025, h + 0.03, 0.025], [-0.025, h + 0.03, 0.025], [0.9, 0.55, 0.1]);
      const w0 = 0.014; for (let q = 0; q < 4; q++) { const y0 = h * q / 4, y1 = h * (q + 1) / 4; sub.quad([-w0, y0, -w0], [w0, y0, -w0], [w0, y1, -w0], [-w0, y1, -w0], TALLO2); sub.quad([w0, y0, -w0], [w0, y0, w0], [w0, y1, w0], [w0, y1, -w0], TALLO); } }
  }

  // pilote del puente: poste cuadrado de madera (cuatro caras y tapa) desde el lecho hasta la cubierta; base en (0, 0, 0), altura h.
  const MAD1 = [0.66, 0.44, 0.25], MAD2 = [0.50, 0.32, 0.17], MAD3 = [0.78, 0.55, 0.33];
  function poste(B, h) { const w = 0.075;
    B.quad([-w, 0, w], [w, 0, w], [w, h, w], [-w, h, w], MAD1); B.quad([w, 0, w], [w, 0, -w], [w, h, -w], [w, h, w], MAD2); B.quad([w, 0, -w], [-w, 0, -w], [-w, h, -w], [w, h, -w], MAD1); B.quad([-w, 0, -w], [-w, 0, w], [-w, h, w], [-w, h, -w], MAD2); B.quad([-w, h, -w], [w, h, -w], [w, h, w], [-w, h, w], MAD3); }
  // anillo de onda: corona de 16 sectores (radio 1 ± 0,1 en reposo); animar() le da radio y grosor según la fase. Color de espuma.
  function anillo(B) { const N = 16, ESP = [0.66, 0.85, 1.0];
    for (let i = 0; i < N; i++) { const a = (i / N) * TP, b = ((i + 1) / N) * TP, c = Math.cos, s = Math.sin; B.quad([c(a) * 0.9, 0, s(a) * 0.9], [c(a) * 1.1, 0, s(a) * 1.1], [c(b) * 1.1, 0, s(b) * 1.1], [c(b) * 0.9, 0, s(b) * 0.9], ESP); } }
  // pilotes(suelo) → [{ x, z, bx, bz }]: uno en el centro de cada lado del puente ('b') que da al agua, un poco hacia fuera de la pared (bx, bz = casilla del puente, para saber su altura).
  function pilotes(suelo) {
    const H = suelo.length, W = H ? suelo[0].length : 0, at = (x, z) => (z >= 0 && z < H && x >= 0 && x < W ? suelo[z][x] : null), out = [];
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { if (at(x, z) !== 'b') continue;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => { if (at(x + dx, z + dz) !== '~') return; out.push({ x: dx ? x + (dx > 0 ? 1 : 0) + dx * 0.06 : x + 0.5, z: dz ? z + (dz > 0 ? 1 : 0) + dz * 0.06 : z + 0.5, bx: x, bz: z }); }); }
    return out;
  }

  function modelo(props) {
    const B = constructor(), partes = [];
    props.forEach((p, n) => {
      const i0 = B.n(), fase = hash(Math.round(p.x * 16), Math.round(p.z * 16)) * TP, q = { tipo: p.tipo, x: p.x, z: p.z, y: p.y, yw: p.yw, fase, i0, i1: 0, lista: [] };
      const m = p.tipo.match(/^juncos(\d)$/);
      if (T0[p.tipo]) { hoja(B, 0.30 * (p.s || 1), p.tipo === 'nenufar_flor', fase); q.i1 = B.n(); q.lista.push([0, 0, i0, q.i1, 0]); }
      else if (p.tipo === 'pilote') { const a1 = B.n(); poste(B, p.h); q.lista.push([0, 0, a1, B.n(), 0, 'p']); const a2 = B.n(); anillo(B); q.lista.push([0, 0, a2, B.n(), 0, 'a0']); q.i1 = B.n(); }
      else if (p.tipo === 'juncoSuelto') { const a2 = B.n(), h = 0.8 + 0.35 * hash(Math.round(p.x * 31), Math.round(p.z * 29)); junco(B, h, 1, true, 0.8); q.lista.push([0, 0, a2, B.n(), h]); q.i1 = B.n(); }
      else if (m) { const k = +m[1], a2 = B.n(); macolla(B, k === 3 ? 10 : 8, 1.0, 0, false, fase); q.lista.push([0, 0, a2, B.n(), 0.8]); q.i1 = B.n(); }
      partes.push(q);
    });
    const base = Float32Array.from(B.pos);
    return { pos: new Float32Array(B.pos), col: new Float32Array(B.col), idx: B.idx, base, partes };
  }

  function animar(mo, t) {
    mo.partes.forEach((q) => {
      const esN = !!T0[q.tipo];
      q.lista.forEach(([ox, oz, a, b, h, kind]) => {
        if (kind === 'p') { for (let i = a; i < b; i++) { const k = i * 3; mo.pos[k] = q.x + mo.base[k]; mo.pos[k + 1] = q.y + mo.base[k + 1]; mo.pos[k + 2] = q.z + mo.base[k + 2]; } return; }
        if (kind === 'a0' || kind === 'a1') { const ph = (t * 0.14 + q.fase / TP) % 1, R = 0.13 + 0.20 * ph, W = 0.024 * (1 - ph) * (ph < 0.15 ? ph / 0.15 : 1);   // el anillo crece y se afina hasta desaparecer
          for (let i = a; i < b; i++) { const k = i * 3, bx = mo.base[k], bz = mo.base[k + 2], l = Math.hypot(bx, bz) || 1, rr = R + (l > 1 ? W : -W); mo.pos[k] = q.x + (bx / l) * rr; mo.pos[k + 1] = q.yw; mo.pos[k + 2] = q.z + (bz / l) * rr; } return; }
        for (let i = a; i < b; i++) { const k = i * 3, bx = mo.base[k], by = mo.base[k + 1], bz = mo.base[k + 2];
          if (esN) { const rot = 0.18 * Math.sin(t * 0.45 + q.fase), c = Math.cos(rot), s = Math.sin(rot); mo.pos[k] = q.x + bx * c - bz * s; mo.pos[k + 1] = q.y + by + 0.012 * Math.sin(t * 1.3 + q.fase); mo.pos[k + 2] = q.z + bx * s + bz * c; }
          else { const f = by / (h || 1), bend = f * f * 0.07; mo.pos[k] = q.x + ox + bx + bend * Math.sin(t * 1.15 + q.fase + bx * 6 + bz * 4); mo.pos[k + 1] = q.y + by; mo.pos[k + 2] = q.z + oz + bz + bend * 0.5 * Math.cos(t * 0.9 + q.fase * 1.3 + bx * 4); }
        }
      });
    });
    return mo;
  }
  // extras(suelo, existentes) → props sueltas para dar variedad al agua sin tocar el mapa: juncos finos junto a la orilla y nenúfares en grupos de 2-3 (tamaños distintos, alguno con flor).
  // Reglas: solo casillas '~'; nada a menos de 1,2 casillas de un objeto ya puesto ni pegado al puente ('b'); los juncos van en la orilla y los nenúfares fuera de ella; reparto fijo por hash (determinista).
  function extras(suelo, existentes) {
    const out = [], H = suelo.length, W = H ? suelo[0].length : 0, at = (x, z) => (z >= 0 && z < H && x >= 0 && x < W ? suelo[z][x] : null), lejos = (x, z, d) => existentes.concat(out).every((e) => Math.hypot(e.x - x, e.z - z) >= d);
    for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
      if (at(x, z) !== '~') continue;
      let puente = false, tierra = false; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = at(x + dx, z + dz); if (c === 'b') puente = true; if (c !== null && c !== '~' && c !== 'b' && (!dx || !dz)) tierra = true; }
      if (puente) continue;
      const h1 = hash(x, z * 7 + 3), h2 = hash(x * 5 + 1, z), ox = 0.25 + 0.5 * hash(x + 9, z + 4), oz = 0.25 + 0.5 * hash(x + 2, z + 8);
      if (tierra && h1 < 0.30 && lejos(x + ox, z + oz, 1.2)) out.push({ tipo: 'juncoSuelto', x: x + ox, z: z + oz });
      else if (!tierra && h2 < 0.14 && lejos(x + 0.5, z + 0.5, 1.4)) { const n = 2 + (hash(x + 6, z + 1) < 0.5 ? 1 : 0); for (let k = 0; k < n; k++) out.push({ tipo: k === 0 && hash(x, z + 17) < 0.5 ? 'nenufar_flor' : 'nenufar', x: x + 0.5 + [-0.22, 0.2, 0.0][k], z: z + 0.5 + [0.12, -0.14, 0.24][k], s: [1.0, 0.7, 0.55][k] }); }
    }
    return out.slice(0, 40);
  }
  G.rio3d = { extras, pilotes, modelo, animar, TIPOS: ['nenufar', 'nenufar_flor', 'juncos2', 'juncos3'] };
})(typeof window !== 'undefined' ? window : globalThis);
