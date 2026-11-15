// pesca3d.js — geometría 3D de la pesca (v2.181, Pesca 2-4): caña, hilo, corcho, ondas, pez que salta y «!» del pique. PURO: no toca Three, el DOM ni el estado.
// build(lista, agua) → { pos, col, idx, n }  con pos/col en coordenadas de mundo (1 u = 1 casilla). lista = [{ x, y, z (pies del jugador, u), v (G.vista.pesca) }]; agua = altura absoluta de la superficie.
// Todo son cintas cruzadas y cajas pequeñas con color liso (se ven desde cualquier ángulo de cámara). MAX_QUADS caras por jugador.
(function (root) {
  'use strict';
  const G = root.G, T = 16, MAX = 160;
  const CANA = [0.769, 0.545, 0.322], PUNTA = [0.769, 0.545, 0.322], EMPUNADURA = [0.561, 0.361, 0.200], HILO = [1, 1, 1], ROJO = [0.90, 0.28, 0.30], BLANCO = [0.97, 0.97, 0.97], ONDA = [0.80, 0.93, 1.0], PEZ = [0.62, 0.82, 0.92], VIENTRE = [0.95, 0.97, 0.98], ALETA = [0.30, 0.55, 0.80], AMARILLO = [1.0, 0.85, 0.2];
  const hex = (h) => (typeof h === 'string' && /^#[0-9a-f]{6}$/i.test(h) ? [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255] : null);
  function constructor() {
    const pos = [], col = [], idx = [], decals = [], sprites = [];   // decals (v2.194): manchas y ondas translúcidas sobre el agua; las dibuja el pintor con textura suave (no son caras sólidas)
    const quad = (a, b, c, d, color) => { const i = pos.length / 3; pos.push(...a, ...b, ...c, ...d); for (let k = 0; k < 4; k++) col.push(...color); idx.push(i, i + 1, i + 2, i, i + 2, i + 3); };
    const caja = (cx, cy, cz, w, h, d, color) => { const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], color); quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], color); quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], color);
      quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], color); quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], color); quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], color); };
    const cinta = (a, b, w, color) => { // dos cintas cruzadas (vertical y horizontal) de ancho w entre a y b
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1, hz = Math.hypot(dx, dz) || 1, px = -dz / hz * w / 2, pz = dx / hz * w / 2;
      quad([a[0] - px, a[1], a[2] - pz], [a[0] + px, a[1], a[2] + pz], [b[0] + px, b[1], b[2] + pz], [b[0] - px, b[1], b[2] - pz], color);
      quad([a[0], a[1] - w / 2, a[2]], [a[0], a[1] + w / 2, a[2]], [b[0], b[1] + w / 2, b[2]], [b[0], b[1] - w / 2, b[2]], color); void l; };
    const onda = (cx, y, cz, r0, ancho, color) => { const N = 12; for (let i = 0; i < N; i++) { const a = i / N * 2 * Math.PI, b = (i + 1) / N * 2 * Math.PI, c = Math.cos, s = Math.sin, r1 = r0 + ancho;
      quad([cx + c(a) * r0, y, cz + s(a) * r0], [cx + c(a) * r1, y, cz + s(a) * r1], [cx + c(b) * r1, y, cz + s(b) * r1], [cx + c(b) * r0, y, cz + s(b) * r0], color); } };
    const decal = (x, z, hx, hz, k, a, c) => { if (a > 0.004 && hx > 0 && hz > 0) decals.push({ x, z, hx, hz, k, a: Math.min(1, a), c }); };   // k: 0 = mancha (degradado), 1 = anillo de onda
    const varilla = (a, b, r0, r1, color) => {   // v2.206: tramo de caña con VOLUMEN: prisma de 6 caras que se estrecha de r0 a r1; un tono liso por tramo (el sombreado entre caras es mínimo, como el dibujo 2D)
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, f = [d[0] / l, d[1] / l, d[2] / l];
      let u = [-f[2], 0, f[0]]; let ul = Math.hypot(u[0], u[1], u[2]); if (ul < 1e-3) { u = [1, 0, 0]; ul = 1; } u = u.map((q) => q / ul);
      const v = [f[1] * u[2] - f[2] * u[1], f[2] * u[0] - f[0] * u[2], f[0] * u[1] - f[1] * u[0]], N = 6, LZ = [-0.45, 0.8, 0.4];
      const P = (c, r, k) => { const t = k * 2 * Math.PI / N; return [c[0] + (u[0] * Math.cos(t) + v[0] * Math.sin(t)) * r, c[1] + (u[1] * Math.cos(t) + v[1] * Math.sin(t)) * r, c[2] + (u[2] * Math.cos(t) + v[2] * Math.sin(t)) * r]; };
      for (let k = 0; k < N; k++) { const t = (k + 0.5) * 2 * Math.PI / N, n = [u[0] * Math.cos(t) + v[0] * Math.sin(t), u[1] * Math.cos(t) + v[1] * Math.sin(t), u[2] * Math.cos(t) + v[2] * Math.sin(t)], sh = 0.9 + 0.1 * Math.max(0, n[0] * LZ[0] + n[1] * LZ[1] + n[2] * LZ[2]);
        quad(P(a, r0, k), P(a, r0, k + 1), P(b, r1, k + 1), P(b, r1, k), color.map((q) => Math.min(1, q * sh))); } };
    return { pos, col, idx, decals, sprites, varilla, decal, quad, caja, cinta, onda, n: () => pos.length / 12 };
  }
  // v2.192: un pez de docs/FICHA_PECES.md (largo, alto y paleta de G.PECES): segmentos en cajas con el perfil del cuerpo, vientre, aleta dorsal, cola, ojo y barbillas; la anguila ondula entera. Centro (x, y, z), rumbo (dx, dz) unitario, pitch = cabeceo (rad), fase = aleteo.
  const rgb = (h) => hex(h) || [0.6, 0.6, 0.6];
  function pezModelo(B, id, x, y, z, dx, dz, pitch, fase) {
    const E = G.PECES[id]; if (!E) return; const F = E.forma, P = E.pal, Lu = F.L * 0.026, Hu = F.H * 0.026 * 1.25, n = F.ondula ? 8 : 5, hx = Math.abs(dx) >= Math.abs(dz), px = -dz, pz = dx, sp = Math.sin(pitch);
    const cj = (cx, cy, cz, len, alto, ancho, col) => (hx ? B.caja(cx, cy, cz, len, alto, ancho, col) : B.caja(cx, cy, cz, ancho, alto, len, col));
    const at = (t, lat, up) => { const sd = (t - 0.5) * Lu; return [x + dx * sd + px * lat, y + sd * sp + up, z + dz * sd + pz * lat]; };
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, perf = Math.pow(Math.sin(Math.PI * (0.12 + 0.82 * t)), 0.75), hh = Math.max(0.025, Hu * perf), lat = (F.ondula ? 0.05 : 0.02 * (1 - t)) * Math.sin(i * 0.9 + fase), c = at(t, lat, 0);
      cj(c[0], c[1], c[2], Lu / n * 1.1, hh, hh * 0.85, t < 0.5 ? rgb(P.sombra) : rgb(P.base));
      if (t > 0.2 && t < 0.8) { const b = at(t, lat, -hh * 0.32); cj(b[0], b[1], b[2], Lu / n * 1.05, hh * 0.3, hh * 0.6, rgb(P.vientre)); } }
    if (F.dorsal) { const c = at(0.5, 0, Hu * 0.65); cj(c[0], c[1], c[2], Lu * 0.28, Hu * 0.4, 0.015, rgb(P.aleta)); }
    const colaX = at(0.02, 0.025 * Math.sin(fase), 0); if (F.cola === 'horq') { cj(colaX[0], colaX[1] + Hu * 0.35, colaX[2], Lu * 0.12, Hu * 0.5, 0.015, rgb(P.aleta)); cj(colaX[0], colaX[1] - Hu * 0.35, colaX[2], Lu * 0.12, Hu * 0.5, 0.015, rgb(P.aleta)); } else cj(colaX[0], colaX[1], colaX[2], Lu * 0.12, Hu * 0.9, 0.015, rgb(P.aleta));
    const o = at(0.9, Hu * 0.3, Hu * 0.12); B.caja(o[0], o[1], o[2], 0.02, 0.02, 0.02, rgb(P.ojo));
    if (F.barbas) { const b = at(1.0, 0, -Hu * 0.1); cj(b[0], b[1], b[2], 0.03, 0.015, 0.015, rgb(P.sombra)); }
  }
  // Una pesca (un jugador). Pies en (x, y, z); v = G.vista.pesca(...)
  function una(B, p, agua) {
    const v = p.v, M = v.M, n0 = B.n(), L = Math.hypot(M[0], M[1]) || 1, fx = M[0] / L, fz = M[1] / L;
    const m0 = p.mano ? [p.x + p.mano[0], p.y + p.mano[1], p.z + p.mano[2]] : [p.x + fx * 0.32, p.y + 0.52, p.z + fz * 0.32], ar = v.brazo[0] + 0.9, lc = 0.95;   // v2.184: la caña arranca en la mano real (si no hay malla 3D, un punto aproximado)
    const mano = [m0[0] - fx * 0.05 * Math.sin(ar), m0[1] + 0.05 * Math.cos(ar), m0[2] - fz * 0.05 * Math.sin(ar)];   // el puño asoma un poco por detrás de la mano
    const real = [p.x + v.cx / T, agua, p.z + v.cy / T], lev = Math.max(-0.25, Math.min(0.4, (ar - 2.0) * 0.3));   // v2.203: la caña es una recta hacia ARRIBA y hacia el agua desde la mano real; el hilo CUELGA en vertical desde la punta (como en el 2D); al lanzar o forcejear la punta se levanta/tiembla
    const lat = Math.abs(fz) >= Math.abs(fx) ? (m0[0] - p.x >= 0 ? 1 : -1) * 0.4 : 0, fw = Math.abs(fz) >= Math.abs(fx) ? 0.4 : 0.9;   // v2.206: mirando al norte/sur la caña sube hacia delante y hacia el lado de la mano (así se ve desde la cámara y el pez cuelga fuera de la silueta); mirando de lado, recta hacia delante   // v2.205: mirando al norte/sur la punta se separa hacia el lado de la mano para que el pez colgado no tape a Oli
    const punta = [m0[0] + fx * fw + lat, m0[1] + 1.05 + lev, m0[2] + fz * fw], medio = [mano[0] + (punta[0] - mano[0]) * 0.75, mano[1] + (punta[1] - mano[1]) * 0.75, mano[2] + (punta[2] - mano[2]) * 0.75];   // v2.206: la caña apunta hacia DELANTE y hacia ARRIBA (~50°, unos 1,4 u); la punta queda sobre el agua, delante del personaje
    { const at = (t) => [mano[0] + (punta[0] - mano[0]) * t, mano[1] + (punta[1] - mano[1]) * t, mano[2] + (punta[2] - mano[2]) * t];   // v2.206: la caña 3D con los tres tramos y colores de la 2D (empuñadura oscura 35 %, cuerpo 40 %, punta clara 25 %), recta y fina
      B.varilla(at(0), at(0.22), 0.048, 0.043, EMPUNADURA); B.varilla(at(0.22), at(0.75), 0.043, 0.026, CANA); B.varilla(at(0.75), at(1), 0.026, 0.012, PUNTA); }
    const dest = [punta[0], agua, punta[2]];   // el corcho, las ondas y el pez quedan justo debajo de la punta
    let cork = dest.slice(); const arco = Math.sin(Math.PI * v.s) * 0.55;
    if (v.s < 1) cork = [punta[0] + (dest[0] - punta[0]) * v.s, punta[1] + (dest[1] - punta[1]) * v.s + arco, punta[2] + (dest[2] - punta[2]) * v.s];
    else cork[1] = agua + 0.02 * v.bob * (1 - v.hund) - 0.06 * v.hund;
    if (v.vuelta > 0) cork = [dest[0] + (punta[0] - dest[0]) * v.vuelta, dest[1] + (punta[1] - dest[1]) * v.vuelta + Math.sin(Math.PI * v.vuelta) * 0.4, dest[2] + (punta[2] - dest[2]) * v.vuelta];
    const visible = v.hund < 0.9 && !v.pez && !v.hook;
    let gancho = null;   // v2.203: boca del pez enganchado (forcejeo: bajo el agua; al sacarlo: sube por el hilo hasta la punta)
    if (v.pez) { const s = v.pez.s; gancho = [punta[0] + 0.03 * Math.sin(s * 9) * (1 - s), agua + 0.8 * s, punta[2]]; }   // v2.206: sube por el hilo y se queda colgando justo sobre el agua, por delante del personaje (no hasta la punta: así no lo tapa)
    else if (v.hook) gancho = [dest[0] + 0.04 * Math.sin(p.reloj * 14), agua - 0.04, dest[2]];
    B.varilla(punta, gancho || cork, 0.016, 0.016, HILO);   // v2.207: el hilo es blanco normal pero con volumen (prisma de 6 caras): las cintas finas casi no se veían
    if (visible) { B.caja(cork[0], cork[1] + 0.045, cork[2], 0.07, 0.05, 0.07, ROJO); B.caja(cork[0], cork[1], cork[2], 0.07, 0.04, 0.07, BLANCO); }
    if (v.s >= 1 && !v.vuelta) v.anillos.forEach((a) => { const r0 = 0.07 + 0.36 * (a.entra ? 1 - a.r : a.r), h = r0 / 0.8; B.decal(dest[0], dest[2], h, h, 1, (a.entra ? 0.30 + 0.45 * a.r : 0.62 * (1 - a.r)) * 0.55, ONDA); });   // v2.194: ondas como anillos suaves que se abren y se desvanecen (antes aros finos opacos)
    if (v.sombra) { const S = v.sombra, q = 0.78 * S.resp; B.decal(dest[0], dest[2], S.rx * q, S.ry * q * 1.25, 0, S.a * 0.62, [0.02, 0.10, 0.26]); }   // v2.194: mancha translúcida de bordes suaves, más pequeña y ligera, que se funde con el agua
    if (gancho) { const idp = v.pez ? (v.pez.id || 'pez_plateado') : v.hook.id, fase = v.pez ? (v.pez.fase || 0) : v.hook.fase;   // el pez cuelga del hilo con la cabeza hacia arriba (lámina girada 90°, lo dibuja el pintor)
      if (G.PECES[idp] && G.PECES[idp].sprite3d) B.sprites.push({ id: idp, x: gancho[0], y: gancho[1], z: gancho[2], colgado: true, sumergido: !v.pez, fase, pitch: 0, rx: 1, rz: 0 });
      else pezModelo(B, idp, gancho[0], gancho[1] - 0.1, gancho[2], fx, fz, 0, fase); }
    if (v.senal && Math.floor(p.reloj * 8) % 2 === 0) { B.caja(p.x, p.y + 1.62, p.z, 0.07, 0.2, 0.07, AMARILLO); B.caja(p.x, p.y + 1.45, p.z, 0.07, 0.06, 0.07, AMARILLO); }
    if (B.n() - n0 > MAX) throw new Error('pesca3d: demasiadas caras');
  }
  // v2.184: marca de los puntos de pesca cercanos (igual que el 2D): un corcho con flecha amarilla flotando sobre la casilla. marcas = [{ x, y, z (centro de la casilla y suelo, u), k (0-1: tamaño según cercanía), reloj }]
  const MARCA_QUADS = 30;
  function marca(B, m) { const k = m.k, f = m.y + 0.62 + 0.03 * Math.sin(m.reloj * 2.4);
    B.caja(m.x, f + 0.27 * k, m.z, 0.12 * k, 0.09 * k, 0.12 * k, ROJO); B.caja(m.x, f + 0.19 * k, m.z, 0.12 * k, 0.07 * k, 0.12 * k, BLANCO);
    B.caja(m.x, f + 0.10 * k, m.z, 0.20 * k, 0.07 * k, 0.20 * k, AMARILLO); B.caja(m.x, f + 0.03 * k, m.z, 0.14 * k, 0.07 * k, 0.14 * k, AMARILLO); B.caja(m.x, f - 0.04 * k, m.z, 0.08 * k, 0.07 * k, 0.08 * k, AMARILLO); }
  function build(lista, agua, marcas) { const B = constructor(); lista.forEach((p) => una(B, p, agua)); (marcas || []).forEach((m) => marca(B, m)); return { pos: Float32Array.from(B.pos), col: Float32Array.from(B.col), idx: B.idx, n: B.n(), decals: B.decals, sprites: B.sprites }; }
  G.pesca3d = { build, // build(lista, agua, marcas): cada jugador de la lista puede traer `mano` = centro de su mano respecto a los pies (u)
    MAX_POR_JUGADOR: MAX, MAX_MARCAS: 4, MARCA_QUADS };
})(typeof window !== 'undefined' ? window : globalThis);
