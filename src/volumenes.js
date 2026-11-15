// volumenes.js — MOTOR DE VOLÚMENES del HD-2D (v2.67, paso B 1.ª mitad de docs/FICHAS_EDIFICIOS_3D.md). PURO: sin Three.js, sin DOM, sin azar; se prueba en node (grupo 49 de test.js, tools/volumenes.js).
// Dado la HUELLA de una pieza del catálogo (G.OBJETOS[tipo].huella, las casillas que bloquean en el motor) y su campo `vol`, saca la geometría de un edificio: muros, tejado y losa de entrada.
// Regla de oro (ficha, regla 2): la huella 3D ES la colisión. Los muros salen de los bordes entre una casilla sólida y una que no lo es, así que el volumen cubre EXACTAMENTE las casillas sólidas y el nicho de entrada queda libre por construcción.
// Medidas: 1 u = 1 casilla = 16 px. x, z en casillas desde la esquina noroeste de la huella (la casilla (x, y) de la pieza en el mapa); y = altura sobre el suelo. Este archivo NO dibuja: el pintor (src/hd2d_pintor.js) lo usará en la 2.ª mitad del paso B.
//
// Campo `vol` de una pieza (se escribe en src/albanota_objetos.js; una pieza sin `vol` sigue como lámina):
//   { muros: alto de los muros (u),
//     tejado: { tipo: 'dosaguas', cumbrera: 'eo' | 'ns', alto: lo que sube la cumbrera sobre el alero (u), vuelo: lo que sobresale el alero (u) }
//           | { tipo: 'plano', peto: alto del peto (u), grosor?: grosor del peto (u, 0,15) },
//     chimenea?: { x, z, w, d, sobre, vuelo?, boca? }  (v2.69) caja de piedra con corona: esquina noroeste (x, z) en casillas desde la esquina de la huella, ancho w y fondo d, y `sobre` = lo que sube por encima de la cumbrera (u); v2.72: `vuelo` = lo que sobresale la corona (0,08) y `boca` = margen de la boca oscura dentro de la corona (0,12; menos = boca más ancha),
//     variante?: 'lali' | 'oli' | 'lab'  (v2.72) pequeñas diferencias de textura sobre el mismo volumen (postigos, flores, pizarra…; ver G.volTex.VARIANTES),
//     veleta?: { x, z, poste }          (v2.69) poste fino en el centro (x, z) y, encima, la campana de dos mitades en una placa vertical; `poste` = alto del poste sobre la cumbrera (u) }
//   (v2.92) o, en vez de muros y tejado, `torno: { x, z, piezas: [...] }`: piezas de revolución de 16 caras (la fuente redonda); ver más abajo.
// Caras (cara): 's' sur · 'n' norte · 'e' este · 'o' oeste (hacia dónde mira el muro). Tono de luz FIJO arriba-izquierda (ficha, regla 5): oeste = 'luz', sur = 'base' (el dibujo de hoy), este y norte = 'sombra'.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const TONO = { o: 'luz', s: 'base', e: 'sombra', n: 'sombra' };
  const NORMAL = { s: [0, 0, 1], n: [0, 0, -1], e: [1, 0, 0], o: [-1, 0, 0] };
  const LOSA_Y = 0.02;           // la losa de entrada va pintada casi a nivel del suelo
  const MAX_TRIANGULOS = 2000;   // presupuesto técnico por edificio (ficha, sección 3)

  const clave = (x, z) => x + ',' + z;
  // casillas sólidas de una huella [[dx, dy, ancho, alto], …] → Set 'x,z'
  function celdas(huella) { const s = new Set(); huella.forEach(([dx, dy, w, h]) => { for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) s.add(clave(dx + a, dy + b)); }); return s; }
  function rectDe(S) { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; S.forEach((k) => { const [x, z] = k.split(',').map(Number); x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x + 1); z1 = Math.max(z1, z + 1); }); return { x0, z0, x1, z1, w: x1 - x0, d: z1 - z0 }; }

  // altura de la superficie del tejado sobre un punto (x, z) del rectángulo (sin vuelo): el alero está a `muros` y la cumbrera sube `alto`
  function techoY(vol, R, x, z) {
    const t = vol.tejado, H = vol.muros;
    if (t.tipo !== 'dosaguas') return H;
    const eo = t.cumbrera === 'eo', mitad = (eo ? R.d : R.w) / 2, c = eo ? (R.z0 + R.z1) / 2 : (R.x0 + R.x1) / 2, p = eo ? z : x;
    return H + (t.alto / mitad) * Math.max(0, mitad - Math.abs(p - c));
  }

  // Un polígono: { parte, cara?, tono, v: [[x, y, z], …] (3 o 4), n: normal esperada (el orden de los vértices se corrige para que mire hacia ella), uv: [[u, v], …] }
  function muros(S, R, vol) {
    const out = [], bordes = [];
    S.forEach((k) => {
      const [cx, cz] = k.split(',').map(Number);
      [['s', cx, cz + 1, 0, 1], ['n', cx, cz - 1, 0, -1], ['e', cx + 1, cz, 1, 0], ['o', cx - 1, cz, -1, 0]].forEach(([cara, vx, vz]) => {
        if (S.has(clave(vx, vz))) return;
        const horiz = cara === 's' || cara === 'n', linea = cara === 's' ? cz + 1 : cara === 'n' ? cz : cara === 'e' ? cx + 1 : cx, pos = horiz ? cx : cz;
        const borde = horiz ? (linea === R.z0 || linea === R.z1) : (linea === R.x0 || linea === R.x1); // en el borde del rectángulo: muro exterior; si no, es del nicho (por dentro del rectángulo)
        bordes.push({ cara, horiz, linea, pos, borde });
      });
    });
    // une las casillas contiguas de una misma pared en un solo tramo (menos triángulos y una textura continua por pared)
    const grupos = new Map(); bordes.forEach((b) => { const k = b.cara + '|' + b.linea + '|' + b.borde; (grupos.get(k) || grupos.set(k, []).get(k)).push(b); });
    grupos.forEach((lista) => {
      lista.sort((a, b) => a.pos - b.pos);
      let ini = lista[0].pos, fin = ini + 1;
      const cierra = (b) => { out.push({ cara: b.cara, horiz: b.horiz, linea: b.linea, borde: b.borde, a: ini, b: fin }); };
      for (let i = 1; i < lista.length; i++) { if (lista[i].pos === fin) fin++; else { cierra(lista[i - 1]); ini = lista[i].pos; fin = ini + 1; } }
      cierra(lista[lista.length - 1]);
    });
    return out.map((m) => {
      const H = vol.muros, pA = m.horiz ? [m.a, m.linea] : [m.linea, m.a], pB = m.horiz ? [m.b, m.linea] : [m.linea, m.b];
      // muro exterior: de altura fija (el hastial va aparte, encima); muro del nicho: sube hasta el tejado que tiene encima, para que no quede hueco bajo el alero
      const yA = m.borde ? H : techoY(vol, R, pA[0], pA[1]), yB = m.borde ? H : techoY(vol, R, pB[0], pB[1]), L = m.b - m.a;
      return { parte: m.borde ? 'muro' : 'nicho', cara: m.cara, tono: TONO[m.cara], largo: L, n: NORMAL[m.cara], v: [[pA[0], 0, pA[1]], [pB[0], 0, pB[1]], [pB[0], yB, pB[1]], [pA[0], yA, pA[1]]], uv: [[0, 0], [L, 0], [L, yB], [0, yA]] };
    });
  }

  function tejado(R, vol) {
    const t = vol.tejado, H = vol.muros, out = [];
    if (t.tipo === 'plano') { // plano con peto: cubierta a la altura del muro y un borde que la rodea (cara de fuera, cara de dentro y canto)
      const p = t.peto, g = t.grosor || 0.15, top = H + p, { x0, z0, x1, z1 } = R;
      out.push({ parte: 'cubierta', tono: 'base', n: [0, 1, 0], v: [[x0 + g, H, z0 + g], [x1 - g, H, z0 + g], [x1 - g, H, z1 - g], [x0 + g, H, z1 - g]], uv: [[0, 0], [R.w - 2 * g, 0], [R.w - 2 * g, R.d - 2 * g], [0, R.d - 2 * g]] }); // v2.82: el uv cubre solo lo que hay dentro del peto (sin estirar la textura)
      [['s', [[x0, z1], [x1, z1]], [[x1 - g, z1 - g], [x0 + g, z1 - g]]], ['n', [[x1, z0], [x0, z0]], [[x0 + g, z0 + g], [x1 - g, z0 + g]]], ['e', [[x1, z1], [x1, z0]], [[x1 - g, z0 + g], [x1 - g, z1 - g]]], ['o', [[x0, z0], [x0, z1]], [[x0 + g, z1 - g], [x0 + g, z0 + g]]]].forEach(([cara, fuera, dentro]) => {
        const nf = NORMAL[cara], ni = nf.map((q) => -q), L = cara === 's' || cara === 'n' ? R.w : R.d;
        out.push({ parte: 'peto', cara, tono: TONO[cara], n: nf, v: [[fuera[0][0], H, fuera[0][1]], [fuera[1][0], H, fuera[1][1]], [fuera[1][0], top, fuera[1][1]], [fuera[0][0], top, fuera[0][1]]], uv: [[0, 0], [L, 0], [L, p], [0, p]] });
        out.push({ parte: 'peto_dentro', cara, tono: 'sombra', n: ni, v: [[dentro[0][0], H, dentro[0][1]], [dentro[1][0], H, dentro[1][1]], [dentro[1][0], top, dentro[1][1]], [dentro[0][0], top, dentro[0][1]]], uv: [[0, 0], [L, 0], [L, p], [0, p]] });
        const a = fuera[0], b = fuera[1], c = dentro[0], d = dentro[1]; // canto de arriba, entre la cara de fuera y la de dentro
        out.push({ parte: 'peto_canto', cara, tono: 'luz', n: [0, 1, 0], v: [[a[0], top, a[1]], [b[0], top, b[1]], [d[0], top, d[1]], [c[0], top, c[1]]], uv: [[0, 0], [L, 0], [L, g], [0, g]] });
      });
      return out;
    }
    const eo = t.cumbrera === 'eo', v = t.vuelo, alto = t.alto, yC = H + alto;
    const { x0, z0, x1, z1 } = R, zm = (z0 + z1) / 2, xm = (x0 + x1) / 2, mitad = (eo ? R.d : R.w) / 2, pend = alto / mitad, yA = H - v * pend; // yA: el alero baja al vuelo para seguir la pendiente
    if (eo) { // cumbrera este-oeste: faldones norte y sur; hastiales oeste y este
      const L = R.w + 2 * v, F = Math.hypot(mitad + v, alto + v * pend);
      out.push({ parte: 'faldon', cara: 'n', tono: 'sombra', n: [0, mitad, -alto], v: [[x0 - v, yA, z0 - v], [x1 + v, yA, z0 - v], [x1 + v, yC, zm], [x0 - v, yC, zm]], uv: [[0, 0], [L, 0], [L, F], [0, F]] });
      out.push({ parte: 'faldon', cara: 's', tono: 'base', n: [0, mitad, alto], v: [[x1 + v, yA, z1 + v], [x0 - v, yA, z1 + v], [x0 - v, yC, zm], [x1 + v, yC, zm]], uv: [[0, 0], [L, 0], [L, F], [0, F]] });
      out.push({ parte: 'hastial', cara: 'o', tono: 'luz', n: NORMAL.o, v: [[x0, H, z1], [x0, H, z0], [x0, yC, zm]], uv: [[0, 0], [R.d, 0], [R.d / 2, alto]] });
      out.push({ parte: 'hastial', cara: 'e', tono: 'sombra', n: NORMAL.e, v: [[x1, H, z0], [x1, H, z1], [x1, yC, zm]], uv: [[0, 0], [R.d, 0], [R.d / 2, alto]] });
    } else { // cumbrera norte-sur: faldones oeste y este; hastiales sur y norte (el frontón mira al sur)
      const L = R.d + 2 * v, F = Math.hypot(mitad + v, alto + v * pend);
      out.push({ parte: 'faldon', cara: 'o', tono: 'luz', n: [-alto, mitad, 0], v: [[x0 - v, yA, z1 + v], [x0 - v, yA, z0 - v], [xm, yC, z0 - v], [xm, yC, z1 + v]], uv: [[0, 0], [L, 0], [L, F], [0, F]] });
      out.push({ parte: 'faldon', cara: 'e', tono: 'sombra', n: [alto, mitad, 0], v: [[x1 + v, yA, z0 - v], [x1 + v, yA, z1 + v], [xm, yC, z1 + v], [xm, yC, z0 - v]], uv: [[0, 0], [L, 0], [L, F], [0, F]] });
      out.push({ parte: 'hastial', cara: 's', tono: 'base', n: NORMAL.s, v: [[x1, H, z1], [x0, H, z1], [xm, yC, z1]], uv: [[0, 0], [R.w, 0], [R.w / 2, alto]] });
      out.push({ parte: 'hastial', cara: 'n', tono: 'sombra', n: NORMAL.n, v: [[x0, H, z0], [x1, H, z0], [xm, yC, z0]], uv: [[0, 0], [R.w, 0], [R.w / 2, alto]] });
    }
    return out;
  }

  // losa de entrada: las casillas del rectángulo que NO son sólidas (el nicho) se pintan planas a nivel del suelo
  function losa(S, R) {
    const out = [];
    for (let z = R.z0; z < R.z1; z++) for (let x = R.x0; x < R.x1; x++) if (!S.has(clave(x, z))) out.push({ parte: 'losa', tono: 'base', n: [0, 1, 0], v: [[x, LOSA_Y, z], [x + 1, LOSA_Y, z], [x + 1, LOSA_Y, z + 1], [x, LOSA_Y, z + 1]], uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
    return out;
  }

  // ── Piezas sueltas sobre el tejado (v2.69, paso B2b): chimenea (cuerpo + corona + boca) y veleta (poste + campana en placa vertical) ──
  const CORONA = 0.2, CORONA_VUELO = 0.08, BOCA_MARGEN = 0.12, POSTE_R = 0.0625, VELETA_ANCHO = 0.5, VELETA_ALTO = 0.5625, VELETA_GROSOR = 0.01;
  const techoMax = (vol) => vol.muros + (vol.tejado.tipo === 'dosaguas' ? vol.tejado.alto : 0);
  // cuatro caras de una caja entre (x0, z0) y (x1, z1); fb(x, z) = y de abajo en cada esquina (puede ser inclinada), yt = y de arriba. El uv de cada cara cuenta u a lo ancho y v desde su punto más bajo.
  function lados(x0, z0, x1, z1, fb, yt, parte) {
    return [['s', [x1, z1], [x0, z1]], ['n', [x0, z0], [x1, z0]], ['e', [x1, z0], [x1, z1]], ['o', [x0, z1], [x0, z0]]].map(([cara, A, B]) => {
      const yA = fb(A[0], A[1]), yB = fb(B[0], B[1]), ym = Math.min(yA, yB), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
      return { parte, cara, tono: TONO[cara], n: NORMAL[cara], v: [[A[0], yA, A[1]], [B[0], yB, B[1]], [B[0], yt, B[1]], [A[0], yt, A[1]]], uv: [[0, yA - ym], [L, yB - ym], [L, yt - ym], [0, yt - ym]] };
    });
  }
  function chimenea(R, vol) {
    const c = vol.chimenea; if (!c) return [];
    const x0 = R.x0 + c.x, z0 = R.z0 + c.z, x1 = x0 + c.w, z1 = z0 + c.d, yt = techoMax(vol) + c.sobre, ym = yt - CORONA, cv = c.vuelo !== undefined ? c.vuelo : CORONA_VUELO;
    const a = x0 - cv, b = z0 - cv, c2 = x1 + cv, d = z1 + cv, g = c.boca !== undefined ? c.boca : BOCA_MARGEN, W = c2 - a, D = d - b;
    return lados(x0, z0, x1, z1, (x, z) => techoY(vol, R, x, z), ym, 'chimenea')   // el cuerpo nace en el tejado (su base queda tapada por el faldón)
      .concat(lados(a, b, c2, d, () => ym, yt, 'corona'),
        [{ parte: 'corona_tapa', tono: 'luz', n: [0, 1, 0], v: [[a, yt, b], [c2, yt, b], [c2, yt, d], [a, yt, d]], uv: [[0, 0], [W, 0], [W, D], [0, D]] },
         { parte: 'boca', tono: 'sombra', n: [0, 1, 0], v: [[a + g, yt + 0.004, b + g], [c2 - g, yt + 0.004, b + g], [c2 - g, yt + 0.004, d - g], [a + g, yt + 0.004, d - g]], uv: [[0, 0], [W - 2 * g, 0], [W - 2 * g, D - 2 * g], [0, D - 2 * g]] }]);
  }
  function veleta(R, vol) {
    const t = vol.veleta; if (!t) return [];
    // v2.86: `y` = altura de la base del poste (por defecto la cumbrera); la fuente la pone sobre su taza
    const cx = R.x0 + t.x, cz = R.z0 + t.z, yC = t.y !== undefined ? t.y : techoMax(vol), yt = yC + t.poste, r = POSTE_R, a = VELETA_ANCHO / 2, h = VELETA_ALTO, e = VELETA_GROSOR;
    return lados(cx - r, cz - r, cx + r, cz + r, () => yC - 0.05, yt, 'poste').concat([ // el poste nace un poco bajo la cumbrera; la campana va encima, en dos placas pegadas espalda con espalda (cada una se ve por un solo lado)
      { parte: 'veleta', cara: 's', tono: 'base', n: NORMAL.s, v: [[cx - a, yt, cz + e], [cx + a, yt, cz + e], [cx + a, yt + h, cz + e], [cx - a, yt + h, cz + e]], uv: [[0, 0], [VELETA_ANCHO, 0], [VELETA_ANCHO, h], [0, h]] },
      { parte: 'veleta', cara: 'n', tono: 'sombra', n: NORMAL.n, v: [[cx + a, yt, cz - e], [cx - a, yt, cz - e], [cx - a, yt + h, cz - e], [cx + a, yt + h, cz - e]], uv: [[0, 0], [VELETA_ANCHO, 0], [VELETA_ANCHO, h], [0, h]] }]);
  }
  // v2.83 · L3 (2.ª mitad, parte 1): CÚPULA sobre una azotea plana. vol.domo = { x, z, r, base, vuelo? }: centro (x, z) en casillas desde la esquina de la huella, radio r (u), `base` = alto del tambor (aro) que la levanta sobre el peto, `vuelo` = lo que el aro sobresale de la cúpula (0,1). Tambor de 16 caras + media esfera de 4 anillos (16 × 3 cuadriláteros + 16 triángulos arriba).
  // El uv de la cúpula es ABSOLUTO sobre UNA textura de toda la cúpula: u = longitud de arco a lo largo del ecuador (0 … 2πr), v = longitud de arco hacia arriba (0 … πr/2).
  const DOMO_N = 16, DOMO_M = 4, DOMO_VUELO = 0.1;
  function domo(R, vol) {
    const d = vol.domo; if (!d) return [];
    const cx = R.x0 + d.x, cz = R.z0 + d.z, r = d.r, yb = vol.muros, yd = yb + d.base, ra = r + (d.vuelo !== undefined ? d.vuelo : DOMO_VUELO), circ = 2 * Math.PI * r, out = [];
    const P = (th, ph) => [cx + r * Math.cos(ph) * Math.cos(th), yd + r * Math.sin(ph), cz + r * Math.cos(ph) * Math.sin(th)];
    for (let i = 0; i < DOMO_N; i++) {
      const t0 = 2 * Math.PI * i / DOMO_N, t1 = 2 * Math.PI * (i + 1) / DOMO_N, tm = (t0 + t1) / 2, L = ra * (t1 - t0);
      out.push({ parte: 'anillo', tono: 'base', n: [Math.cos(tm), 0, Math.sin(tm)], v: [[cx + ra * Math.cos(t0), yb, cz + ra * Math.sin(t0)], [cx + ra * Math.cos(t1), yb, cz + ra * Math.sin(t1)], [cx + ra * Math.cos(t1), yd, cz + ra * Math.sin(t1)], [cx + ra * Math.cos(t0), yd, cz + ra * Math.sin(t0)]], uv: [[0, 0], [L, 0], [L, d.base], [0, d.base]] });
      for (let k = 0; k < DOMO_M; k++) {
        const f0 = Math.PI / 2 * k / DOMO_M, f1 = Math.PI / 2 * (k + 1) / DOMO_M, fm = (f0 + f1) / 2, n = [Math.cos(fm) * Math.cos(tm), Math.sin(fm), Math.cos(fm) * Math.sin(tm)], u0 = circ * i / DOMO_N, u1 = circ * (i + 1) / DOMO_N;
        if (k < DOMO_M - 1) out.push({ parte: 'domo', tono: 'base', n, v: [P(t0, f0), P(t1, f0), P(t1, f1), P(t0, f1)], uv: [[u0, r * f0], [u1, r * f0], [u1, r * f1], [u0, r * f1]] });
        else out.push({ parte: 'domo', tono: 'base', n, v: [P(t0, f0), P(t1, f0), [cx, yd + r, cz]], uv: [[u0, r * f0], [u1, r * f0], [(u0 + u1) / 2, r * f1]] });
      }
    }
    return out;
  }
  // v2.84 · L3 (2.ª mitad, parte 2): CRISTALES ELEMENTALES y ESCÁNER sobre la azotea.
  // vol.cristales = [{ x, z, w, h, c, y? }]: centro (x, z) en casillas desde la esquina de la huella, ancho w (u), alto total h (u), color c (hex del elemento) e `y` = altura de la base (por defecto la azotea). Cuerpo de 4 caras y punta de pirámide (el 40 % del alto).
  // vol.escaner = { x, z, mastil, r }: mástil fino, plato de 8 trozos (cono poco profundo, r = radio) y una punta dorada encima.
  const CRISTAL_PUNTA = 0.4, PLATO_N = 8, PLATO_HONDO = 0.14;
  function cristales(R, vol) {
    const out = [];
    (vol.cristales || []).forEach((c) => {
      const x0 = R.x0 + c.x - c.w / 2, x1 = x0 + c.w, z0 = R.z0 + c.z - c.w / 2, z1 = z0 + c.w, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, y0 = c.y !== undefined ? c.y : vol.muros, ht = c.h * CRISTAL_PUNTA, yb = y0 + c.h - ht, yt = y0 + c.h;
      lados(x0, z0, x1, z1, () => y0, yb, 'cristal').forEach((q) => { q.col = c.c; out.push(q); });
      [['s', [[x1, yb, z1], [x0, yb, z1]]], ['n', [[x0, yb, z0], [x1, yb, z0]]], ['e', [[x1, yb, z0], [x1, yb, z1]]], ['o', [[x0, yb, z1], [x0, yb, z0]]]].forEach(([cara, b]) => {
        out.push({ parte: 'cristal_punta', cara, tono: TONO[cara], col: c.c, n: [NORMAL[cara][0], 0.5, NORMAL[cara][2]], v: [b[0], b[1], [xm, yt, zm]], uv: [[0, 0], [c.w, 0], [c.w / 2, ht]] });
      });
    });
    return out;
  }
  function escaner(R, vol) {
    const e = vol.escaner; if (!e) return [];
    const sx = R.x0 + e.x, sz = R.z0 + e.z, y0 = vol.muros, ym = y0 + e.mastil, r = POSTE_R, rp = e.r, out = [];
    lados(sx - r, sz - r, sx + r, sz + r, () => y0, ym, 'poste').forEach((q) => out.push(q));
    for (let i = 0; i < PLATO_N; i++) {
      const t0 = 2 * Math.PI * i / PLATO_N, t1 = 2 * Math.PI * (i + 1) / PLATO_N, tm = (t0 + t1) / 2, L = 2 * rp * Math.sin(Math.PI / PLATO_N), c = Math.cos(tm), tono = c > 0.38 ? 'luz' : c < -0.38 ? 'sombra' : 'base'; // el borde del lado este mira hacia el oeste (la luz)
      out.push({ parte: 'plato', tono, n: [-0.6 * c, 1, -0.6 * Math.sin(tm)], v: [[sx + rp * Math.cos(t0), ym + PLATO_HONDO, sz + rp * Math.sin(t0)], [sx + rp * Math.cos(t1), ym + PLATO_HONDO, sz + rp * Math.sin(t1)], [sx, ym, sz]], uv: [[0, 0], [L, 0], [L / 2, PLATO_HONDO]] });
    }
    lados(sx - 0.03, sz - 0.03, sx + 0.03, sz + 0.03, () => ym, ym + 0.28, 'punta').forEach((q) => out.push(q));
    return out;
  }
  // v2.86 · paso D · TOLDO de la Tienda: vol.toldo = { x, w, y, caida, vuelo, fleco? }: pegado a la pared sur del cuerpo (la fila de arriba del nicho), desde x (casillas desde la esquina de la huella) a lo ancho w; arranca a la altura `y` en la pared y baja `caida` mientras sale `vuelo` hacia el sur; el fleco (0,2 u) cuelga del borde de fuera. Dos polígonos: la tela inclinada y el fleco.
  const FLECO = 0.2;
  function toldo(R, vol) {
    if (!vol.toldo) return []; return [].concat(vol.toldo).reduce((acc, t) => acc.concat(toldo1(R, t)), []);   // v2.253: `vol.toldo` puede ser un solo toldo o una lista (la Tienda lleva uno sobre cada escaparate)
  }
  function toldo1(R, t) {
    const xa = R.x0 + t.x, xb = xa + t.w, zs = R.z1 - (t.retiro !== undefined ? t.retiro : 1), zf = zs + t.vuelo, yf = t.y - t.caida, L = Math.hypot(t.vuelo, t.caida), fl = t.fleco !== undefined ? t.fleco : FLECO;
    return [{ parte: 'toldo', cara: 's', tono: 'base', n: [0, t.vuelo, t.caida], v: [[xa, t.y, zs], [xb, t.y, zs], [xb, yf, zf], [xa, yf, zf]], uv: [[0, 0], [t.w, 0], [t.w, L], [0, L]] },
      { parte: 'toldo_fleco', cara: 's', tono: 'base', n: NORMAL.s, v: [[xa, yf - fl, zf], [xb, yf - fl, zf], [xb, yf, zf], [xa, yf, zf]], uv: [[0, 0], [t.w, 0], [t.w, fl], [0, fl]] }];
  }
  // v2.254 · RÓTULO de la Tienda: vol.rotulo = { x, w, y, alto, grosor?, retiro?, texto }: una placa de madera con el nombre, pegada a la pared sur (retiro 0 = a la altura del muro de fuera; por defecto 1 = la del nicho), de x a x + w (casillas desde la esquina de la huella) y de y a y + alto. Cara con textura propia («rotulo») y cuatro cantos finos.
  function rotulo(R, vol) {
    const r = vol.rotulo; if (!r) return [];
    const g = r.grosor !== undefined ? r.grosor : 0.0625, z0 = R.z1 - (r.retiro !== undefined ? r.retiro : 1), zf = z0 + g, x0 = R.x0 + r.x, x1 = x0 + r.w, y0 = r.y, y1 = y0 + r.alto;
    return [{ parte: 'rotulo', cara: 's', tono: 'base', n: NORMAL.s, v: [[x0, y0, zf], [x1, y0, zf], [x1, y1, zf], [x0, y1, zf]], uv: [[0, 0], [r.w, 0], [r.w, r.alto], [0, r.alto]] },
      { parte: 'rotulo_canto', cara: 'a', tono: 'luz', n: [0, 1, 0], v: [[x0, y1, z0], [x1, y1, z0], [x1, y1, zf], [x0, y1, zf]], uv: [[0, 0], [r.w, 0], [r.w, g], [0, g]] },
      { parte: 'rotulo_canto', cara: 'o', tono: 'luz', n: NORMAL.o, v: [[x0, y0, z0], [x0, y0, zf], [x0, y1, zf], [x0, y1, z0]], uv: [[0, 0], [g, 0], [g, r.alto], [0, r.alto]] },
      { parte: 'rotulo_canto', cara: 'e', tono: 'sombra', n: NORMAL.e, v: [[x1, y0, z0], [x1, y0, zf], [x1, y1, zf], [x1, y1, z0]], uv: [[0, 0], [g, 0], [g, r.alto], [0, r.alto]] }];
  }
  // v2.256 · ADORNOS: vol.adornos = [{ x0, x1, y0, y1, z0, z1, mat? }] cajas de piedra (o `mat`) pegadas a la fachada: peldaños, arco de la puerta, dinteles, alféizares, cornisas. Medidas en casillas (x, z desde la esquina de la huella) y unidades (y). Se dibujan sus 4 caras visibles (sur, oeste, este y arriba). Las que no pasan de la altura de los muros son «adorno» (fijas); las más altas, «adorno_alto» (se atenúan con el tejado).
  function adornos(R, vol) {
    const out = []; (vol.adornos || []).forEach((b) => {
      const x0 = R.x0 + b.x0, x1 = R.x0 + b.x1, z0 = R.z0 + b.z0, z1 = R.z0 + b.z1, dx = b.x1 - b.x0, dy = b.y1 - b.y0, dz = b.z1 - b.z0, parte = b.y1 <= vol.muros + 1e-9 ? 'adorno' : 'adorno_alto', base = { parte, mat: b.mat || 'piedra' };
      out.push(Object.assign({ cara: 's', tono: 'base', n: NORMAL.s, v: [[x0, b.y0, z1], [x1, b.y0, z1], [x1, b.y1, z1], [x0, b.y1, z1]], uv: [[0, 0], [dx, 0], [dx, dy], [0, dy]] }, base),
        Object.assign({ cara: 'o', tono: 'luz', n: NORMAL.o, v: [[x0, b.y0, z0], [x0, b.y0, z1], [x0, b.y1, z1], [x0, b.y1, z0]], uv: [[0, 0], [dz, 0], [dz, dy], [0, dy]] }, base),
        Object.assign({ cara: 'e', tono: 'sombra', n: NORMAL.e, v: [[x1, b.y0, z0], [x1, b.y0, z1], [x1, b.y1, z1], [x1, b.y1, z0]], uv: [[0, 0], [dz, 0], [dz, dy], [0, dy]] }, base),
        Object.assign({ cara: 'a', tono: 'luz', n: [0, 1, 0], v: [[x0, b.y1, z0], [x1, b.y1, z0], [x1, b.y1, z1], [x0, b.y1, z1]], uv: [[0, 0], [dx, 0], [dx, dz], [0, dz]] }, base));
    });
    return out;
  }
  // v2.92 · F2 · TORNO: piezas de REVOLUCIÓN (la fuente redonda de dos niveles). vol.torno = { x, z, piezas: [ { pz, mat, y0, r0, y1, r1, ri?, agua?, tapa?, filete?, rc?, oro? } ] }.
  //   (x, z) = centro en casillas desde la esquina de la huella; cada pieza es un tronco de cono de TORNO_N = 16 caras: radio r0 a la altura y0 y radio r1 a la altura y1 (r1 > r0 = se abre hacia arriba, como una taza).
  //   `ri` (radio interior en la boca) la convierte en recipiente: borde plano de la boca (de r1 a ri), pared interior que baja hasta `agua` (altura del agua) y el disco de agua. `tapa: true` cierra la parte de arriba con un disco liso.
  //   `mat` = material de la textura (ver G.volTex.CADENAS), `filete: true` = filete dorado en el borde, `rc` = radio de lo que sube por el centro (para las ondas del agua), `oro: true` = tapa dorada.
  // La luz va pintada en la textura según el ángulo de cada cara (una textura por anillo, no una por cara): el uv de los anillos es ABSOLUTO (u = arco recorrido a lo largo del radio mayor, v = lo que sube por la pared) y el de los discos es PLANO (u, v = x, z desde la esquina del cuadrado que los envuelve). Cada polígono lleva `tex: [ancho, alto]` en píxeles de su textura única, `pz` y `sub` (anillo, borde, dentro, agua o tapa).
  // v2.102 (objetos pequeños, paso 2): el torno admite `lados` (12 en la farola; 16 por defecto), `centrado: true` (una cara mira justo al sur, al este, al norte y al oeste) y `luz: true` (cada cara lleva su tono según hacia dónde mira: oeste = luz, sur = base, este y norte = sombra, en vez del único tono «base» de la fuente, que pinta la luz dentro de la textura).
  const TORNO_N = 16, PX_U = 16;
  function tonoTorno(am) { const s = -Math.cos(am) + 0.5 * Math.sin(am); return s >= 0.75 ? 'luz' : s >= -0.25 ? 'base' : 'sombra'; }
  function torno(R, vol) {
    const T = vol.torno; if (!T) return [];
    const cx = R.x0 + T.x, cz = R.z0 + T.z, out = [], N = T.lados || TORNO_N, off = T.centrado ? 0.5 : 0, th = (i) => 2 * Math.PI * (i + off) / N, tpx = (u) => Math.max(1, Math.ceil(u * PX_U - 1e-9));
    const P = (a, r, y) => [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
    T.piezas.forEach((z) => {
      const rM = Math.max(z.r0, z.r1), circ = 2 * Math.PI * rM, dr = z.r1 - z.r0, dy = z.y1 - z.y0, L = Math.hypot(dr, dy), base = { pz: z.pz, mat: z.mat, filete: !!z.filete, oro: !!z.oro, rc: z.rc || 0, rM };
      for (let i = 0; i < N; i++) { // pared de fuera
        const a0 = th(i), a1 = th(i + 1), am = (a0 + a1) / 2, u0 = circ * i / N, u1 = circ * (i + 1) / N;
        out.push(Object.assign({ parte: 'torno', sub: 'lado', tono: T.luz ? tonoTorno(am) : 'base', tex: [tpx(circ), tpx(L)], n: [dy * Math.cos(am), -dr, dy * Math.sin(am)], v: [P(a0, z.r0, z.y0), P(a1, z.r0, z.y0), P(a1, z.r1, z.y1), P(a0, z.r1, z.y1)], uv: [[u0, 0], [u1, 0], [u1, L], [u0, L]] }, base));
      }
      if (z.ri !== undefined) { // recipiente: borde plano de la boca, pared interior y agua
        const ri = z.ri, ra = z.r1, S = 2 * ra, Q = (a, r) => { const p = P(a, r, z.y1); return [p[0] - (cx - ra), p[2] - (cz - ra)]; };
        for (let i = 0; i < N; i++) {
          const a0 = th(i), a1 = th(i + 1);
          out.push(Object.assign({ parte: 'torno', sub: 'borde', tono: 'base', tex: [tpx(S), tpx(S)], n: [0, 1, 0], R: ra, ri, v: [P(a0, ra, z.y1), P(a1, ra, z.y1), P(a1, ri, z.y1), P(a0, ri, z.y1)], uv: [Q(a0, ra), Q(a1, ra), Q(a1, ri), Q(a0, ri)] }, base));
        }
        if (z.agua !== undefined) {
          const circI = 2 * Math.PI * ri, h = z.y1 - z.agua;
          for (let i = 0; i < N; i++) {
            const a0 = th(i), a1 = th(i + 1), am = (a0 + a1) / 2, u0 = circI * i / N, u1 = circI * (i + 1) / N;
            out.push(Object.assign({ parte: 'torno', sub: 'dentro', tono: 'sombra', tex: [tpx(circI), tpx(h)], n: [-Math.cos(am), 0, -Math.sin(am)], ri, v: [P(a0, ri, z.agua), P(a1, ri, z.agua), P(a1, ri, z.y1), P(a0, ri, z.y1)], uv: [[u0, 0], [u1, 0], [u1, h], [u0, h]] }, base));
          }
          const Sa = 2 * ri, Qa = (a, r) => { const p = P(a, r, z.agua); return [p[0] - (cx - ri), p[2] - (cz - ri)]; };
          for (let i = 0; i < N; i++) {
            const a0 = th(i), a1 = th(i + 1);
            out.push(Object.assign({ parte: 'torno', sub: 'agua', tono: 'base', tex: [tpx(Sa), tpx(Sa)], n: [0, 1, 0], ri, v: [[cx, z.agua, cz], P(a0, ri, z.agua), P(a1, ri, z.agua)], uv: [Qa(a0, 0), Qa(a0, ri), Qa(a1, ri)] }, base));
          }
        }
      } else if (z.tapa) { // tapa lisa (la punta de la campana)
        const S = 2 * z.r1, Qt = (a, r) => { const p = P(a, r, z.y1); return [p[0] - (cx - z.r1), p[2] - (cz - z.r1)]; };
        for (let i = 0; i < N; i++) { const a0 = th(i), a1 = th(i + 1); out.push(Object.assign({ parte: 'torno', sub: 'tapa', tono: T.luz ? 'luz' : 'base', tex: [tpx(S), tpx(S)], n: [0, 1, 0], R: z.r1, v: [[cx, z.y1, cz], P(a0, z.r1, z.y1), P(a1, z.r1, z.y1)], uv: [Qt(a0, 0), Qt(a0, z.r1), Qt(a1, z.r1)] }, base)); }
      }
    });
    return out;
  }
  // v2.102 · objetos pequeños, paso 2 · CAJAS y TRONCOS de pirámide para piezas de revolución con partes cuadradas (la farola: plato, cuerpo de cristal y tejadillo).
  //   vol.cajas   = [ { pz, mat, x, z, w, d?, y0, y1, tapa?, fijo? } ]: caja centrada en (x, z) (casillas desde la esquina de la huella), ancho w y fondo d (= w), de y0 a y1; `tapa` cierra arriba (tono luz); `fijo` = las cuatro caras llevan siempre el tono «base» (el cristal encendido no se oscurece).
  //   vol.troncos = [ { pz, mat, x, z, w0, w1, y0, y1 } ]: pirámide truncada de cuatro caras, de lado w0 abajo (y0) a w1 arriba (y1); sin tapa de arriba (la tapa el remate).
  function solidos(R, vol) {
    const out = [], CARAS = [['s', [1, 1], [-1, 1]], ['n', [-1, -1], [1, -1]], ['e', [1, -1], [1, 1]], ['o', [-1, 1], [-1, -1]]];
    (vol.cajas || []).forEach((c) => {
      const d = c.d !== undefined ? c.d : c.w, x0 = R.x0 + c.x - c.w / 2, x1 = x0 + c.w, z0 = R.z0 + c.z - d / 2, z1 = z0 + d;
      lados(x0, z0, x1, z1, () => c.y0, c.y1, 'caja').forEach((q) => { q.pz = c.pz; q.mat = c.mat; if (c.fijo) q.tono = 'base'; out.push(q); });
      if (c.tapa) out.push({ parte: 'caja_tapa', pz: c.pz, mat: c.mat, tono: 'luz', n: [0, 1, 0], v: [[x0, c.y1, z0], [x1, c.y1, z0], [x1, c.y1, z1], [x0, c.y1, z1]], uv: [[0, 0], [c.w, 0], [c.w, d], [0, d]] });
    });
    (vol.troncos || []).forEach((c) => {
      const a0 = c.w0 / 2, a1 = c.w1 / 2, dy = c.y1 - c.y0, da = a0 - a1, cx = R.x0 + c.x, cz = R.z0 + c.z, L = Math.hypot(da, dy), dd = (c.w0 - c.w1) / 2, pt = (s, a, y) => [cx + s[0] * a, y, cz + s[1] * a];
      CARAS.forEach(([cara, A, B]) => out.push({ parte: 'tronco', cara, pz: c.pz, mat: c.mat, tono: TONO[cara], n: [NORMAL[cara][0] * dy, da, NORMAL[cara][2] * dy], v: [pt(A, a0, c.y0), pt(B, a0, c.y0), pt(B, a1, c.y1), pt(A, a1, c.y1)], uv: [[0, 0], [c.w0, 0], [c.w0 - dd, L], [dd, L]] }));
    });
    return out;
  }
  const piezas = (R, vol) => chimenea(R, vol).concat(veleta(R, vol), domo(R, vol), cristales(R, vol), escaner(R, vol), toldo(R, vol), rotulo(R, vol), adornos(R, vol));

  // Empaqueta rectángulos (texturas de un edificio) en filas de un atlas de `ancho` px, con `sep` px de hueco. items: [{ k, w, h }] → { pos: { k: [x, y] }, ancho, alto, ok } (ok = cabe en un cuadrado ancho × ancho). Puro y estable: mismo resultado siempre.
  function empaquetar(items, ancho, sep) {
    const orden = items.slice().sort((p, q) => q.h - p.h || q.w - p.w || (p.k < q.k ? -1 : p.k > q.k ? 1 : 0)), pos = {}; let x = 0, y = 0, fila = 0, ok = true;
    orden.forEach((it) => { if (it.w > ancho) ok = false; if (x + it.w > ancho) { x = 0; y += fila + sep; fila = 0; } pos[it.k] = [x, y]; x += it.w + sep; fila = Math.max(fila, it.h); });
    const alto = y + fila; return { pos, ancho, alto, ok: ok && alto <= ancho };
  }
  // Sombra suave en el suelo (ficha, regla 6): luz arriba-izquierda, así que cae hacia el sur y el este. Devuelve rectángulos [xa, za, xb, zb] (casillas del mapa) = el rectángulo del edificio ensanchado, partido por casillas, SIN las del propio edificio (rectángulo, nicho incluido) y SOLO donde `permite(x, z)` (el pintor no deja sombra sobre árboles, agua ni puente: «nunca junto a árboles»).
  const SOMBRA = { oeste: 0.1, norte: 0.05, este: 0.55, sur: 0.55 };
  // v2.92: con `redonda` = { x, z, r } (el torno de la fuente: centro en casillas desde la esquina de la huella y radio) la sombra es un disco empujado hacia el sur-este, hecho de cuadritos de 0,25 u (4 px), en vez del rectángulo ensanchado
  function sombraSuelo(R, cx, cz, permite, redonda) {
    if (redonda && redonda.anillos) {
      // v2.167 (fuente): sombra de CONTACTO en bandas concéntricas alrededor de toda la base: `anillos` = [[r0, r1, k], …] (radios en u desde el centro de la pieza, k = intensidad de la banda), cuadritos de `q` (0,125 u), centrada con un empuje mínimo (dx, dz) al sureste. Cada cuadrito devuelto lleva su k en la 5.ª posición.
      const out = [], q = redonda.q || 0.125, X = cx + R.x0 + redonda.x + (redonda.dx || 0), Z = cz + R.z0 + redonda.z + (redonda.dz || 0), rM = Math.max(...redonda.anillos.map((a) => a[1]));
      for (let z = Math.floor((Z - rM) / q); z < Math.ceil((Z + rM) / q); z++) for (let x = Math.floor((X - rM) / q); x < Math.ceil((X + rM) / q); x++) {
        const mx = (x + 0.5) * q, mz = (z + 0.5) * q, d = Math.hypot(mx - X, mz - Z), an = redonda.anillos.find((a) => d >= a[0] && d < a[1]); if (!an) continue;
        if (!permite(Math.floor(mx), Math.floor(mz))) continue; out.push([x * q, z * q, (x + 1) * q, (z + 1) * q, an[2]]);
      }
      return out;
    }
    if (redonda && redonda.rw !== undefined) {
      // v2.109 (banco, paso 4): con `rw` y `rd` la sombra es un RECTÁNGULO suave (el banco: 1,75 × 0,55 u, empujado 0,10 al este y 0,12 al sur, cuadritos de 0,125 u). Se reparte en cuadritos de la rejilla `q`; solo entran los que tienen su centro dentro y donde `permite`.
      const out = [], q = redonda.q || 0.125, X = cx + R.x0 + redonda.x + redonda.dx, Z = cz + R.z0 + redonda.z + redonda.dz, xa = X - redonda.rw / 2, xb = X + redonda.rw / 2, za = Z - redonda.rd / 2, zb = Z + redonda.rd / 2;
      for (let z = Math.floor(za / q); z < Math.ceil(zb / q); z++) for (let x = Math.floor(xa / q); x < Math.ceil(xb / q); x++) {
        const mx = (x + 0.5) * q, mz = (z + 0.5) * q; if (mx < xa || mx > xb || mz < za || mz > zb) continue;
        if (!permite(Math.floor(mx), Math.floor(mz))) continue; out.push([x * q, z * q, (x + 1) * q, (z + 1) * q]);
      }
      return out;
    }
    if (redonda) {
      // v2.102 (objetos 3D, paso 4): con `rx` y `rz` la sombra es un ÓVALO pequeño (la farola: radios 0,30 × 0,17 u, empujado 0,10 al este y 0,12 al sur, cuadritos de 0,125 u); sin ellos, el disco de la fuente
      const ov = redonda.rx !== undefined, out = [], X = cx + R.x0 + redonda.x + (ov ? redonda.dx : 0.3), Z = cz + R.z0 + redonda.z + (ov ? redonda.dz : 0.3), r = ov ? Math.max(redonda.rx, redonda.rz) : redonda.r + 0.08, q = ov ? (redonda.q || 0.125) : 0.25;
      for (let z = Math.floor((Z - r) / q); z < Math.ceil((Z + r) / q); z++) for (let x = Math.floor((X - r) / q); x < Math.ceil((X + r) / q); x++) {
        const mx = (x + 0.5) * q, mz = (z + 0.5) * q; if (ov ? ((mx - X) / redonda.rx) ** 2 + ((mz - Z) / redonda.rz) ** 2 > 1 : (mx - X) * (mx - X) + (mz - Z) * (mz - Z) > r * r) continue;
        if (!permite(Math.floor(mx), Math.floor(mz))) continue; out.push([x * q, z * q, (x + 1) * q, (z + 1) * q]);
      }
      return out;
    }
    const X0 = cx + R.x0 - SOMBRA.oeste, Z0 = cz + R.z0 - SOMBRA.norte, X1 = cx + R.x1 + SOMBRA.este, Z1 = cz + R.z1 + SOMBRA.sur, out = [];
    for (let z = Math.floor(Z0); z < Math.ceil(Z1); z++) for (let x = Math.floor(X0); x < Math.ceil(X1); x++) {
      if (x >= cx + R.x0 && x < cx + R.x1 && z >= cz + R.z0 && z < cz + R.z1) continue; // dentro del rectángulo del edificio (lo tapa él)
      if (!permite(x, z)) continue;
      const xa = Math.max(X0, x), za = Math.max(Z0, z), xb = Math.min(X1, x + 1), zb = Math.min(Z1, z + 1); if (xb > xa && zb > za) out.push([xa, za, xb, zb]);
    }
    return out;
  }

  // v2.92: la forma de la sombra redonda de una pieza con torno (centro y radio mayor), o null
  const redonda = (vol) => vol && vol.torno ? Object.assign({ x: vol.torno.x, z: vol.torno.z, r: Math.max(...vol.torno.piezas.map((z) => Math.max(z.r0, z.r1))) }, vol.sombra || {}) : vol && vol.sombra && vol.sombra.rw !== undefined ? Object.assign({}, vol.sombra) : null;   // v2.109: `vol.sombra` = { x, z, rw, rd, dx, dz, q?, k? } (sin torno) = sombra RECTANGULAR centrada en (x, z) desde la esquina de la huella   // v2.102: `vol.sombra` = { rx, rz, dx, dz, q?, k? } vuelve la sombra un óvalo (k = intensidad respecto a la de siempre)

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function unit(n) { const l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l]; }
  // endereza el orden de los vértices para que la cara mire hacia su normal esperada (la geometría se dibuja por un solo lado)
  function orientar(p) {
    const c = cruz(sub(p.v[1], p.v[0]), sub(p.v[2], p.v[0]));
    if (punto(c, p.n) < 0) { p.v = p.v.slice().reverse(); p.uv = p.uv.slice().reverse(); }
    p.n = unit(p.n); return p;
  }

  // v2.105 · objetos 3D, banco, paso 2 · VOLUMEN SOLO DE CAJAS (el banco): sin torno, sin muros y sin tejado; solo `vol.cajas` (con fondo `d`, cajas rectangulares). Las medidas de las cajas son las de la ficha (docs/FICHA_BANCO_3D.md); el origen es la esquina de la huella.
  const esDeCajas = (vol) => !!vol && !vol.torno && vol.muros === undefined && Array.isArray(vol.cajas) && vol.cajas.length > 0;
  const MIN_PIEZA = 0.125;   // v2.105: ninguna pieza de un volumen de cajas mide menos de 2 px (0,125 u) en ninguna dirección (si no, parpadea al girar la cámara)
  // Geometría completa de una pieza. huella: la de G.OBJETOS[tipo]; vol: su campo `vol`.
  // → { huella: Set 'x,z', rect, poligonos: [...], triangulos, altoTotal }
  function geometria(huella, vol) {
    const S = celdas(huella), R = rectDe(S);
    if (!S.size) throw new Error('volumen: la huella está vacía');
    const poligonos = (vol.torno ? torno(R, vol).concat(solidos(R, vol)) : esDeCajas(vol) ? solidos(R, vol) : muros(S, R, vol).concat(tejado(R, vol), losa(S, R), piezas(R, vol))).map(orientar);   // v2.92: una pieza de revolución (la fuente) no tiene muros ni tejado
    const triangulos = poligonos.reduce((n, p) => n + (p.v.length === 4 ? 2 : 1), 0);
    const altoTotal = poligonos.reduce((m, p) => p.parte === 'losa' ? m : Math.max(m, ...p.v.map((q) => q[1])), 0);
    return { huella: S, rect: R, poligonos, triangulos, altoTotal };
  }

  // Búferes planos para el pintor: posición, normal, uv, índices; con el edificio colocado en la casilla (cx, cz) del mapa y sobre el suelo y0. `grupos` guarda de qué polígono sale cada tramo de índices (para asignar textura y tono).
  function buferes(geo, cx, cz, y0) {
    const b = { p: [], n: [], u: [], i: [], grupos: [] };
    geo.poligonos.forEach((q, idx) => {
      const o = b.p.length / 3, desde = b.i.length;
      q.v.forEach((v, k) => { b.p.push(v[0] + cx, v[1] + y0, v[2] + cz); b.n.push(q.n[0], q.n[1], q.n[2]); b.u.push(q.uv[k][0], q.uv[k][1]); });
      b.i.push(o, o + 1, o + 2); if (q.v.length === 4) b.i.push(o, o + 2, o + 3);
      b.grupos.push({ poligono: idx, parte: q.parte, cara: q.cara || null, tono: q.tono, desde, hasta: b.i.length });
    });
    return b;
  }

  // Comprueba el campo `vol` de una pieza; devuelve la lista de problemas (vacía = bien)
  function validar(tipo, d) {
    const out = [], v = d.vol; if (!v) return out;
    if (v.torno !== undefined) { // v2.92 (F2): pieza de revolución; no pide muros ni tejado
      const T = v.torno, ok = T && Array.isArray(T.piezas) && T.piezas.length > 0 && [T.x, T.z].every((n) => typeof n === 'number' && isFinite(n) && n >= 0);
      if (!ok) { out.push(tipo + ': vol.torno debe ser { x, z, piezas: [...] } con al menos una pieza'); return out; }
      T.piezas.forEach((z, i) => { const m = tipo + ': vol.torno.piezas[' + i + ']';
        if (!z || typeof z.pz !== 'string' || typeof z.mat !== 'string' || ![z.y0, z.r0, z.y1, z.r1].every((n) => typeof n === 'number' && isFinite(n))) { out.push(m + ' debe llevar pz, mat, y0, r0, y1 y r1'); return; }
        if (!(z.y1 > z.y0) || !(z.r0 >= 0) || !(z.r1 >= 0) || !(Math.max(z.r0, z.r1) > 0)) out.push(m + ': y1 debe ser mayor que y0 y los radios no pueden ser negativos');
        if (z.ri !== undefined && !(z.ri > 0 && z.ri < z.r1)) out.push(m + ': ri (radio interior) debe ser mayor que 0 y menor que r1');
        if (z.agua !== undefined && (z.ri === undefined || !(z.agua >= z.y0 && z.agua < z.y1))) out.push(m + ': agua necesita ri y una altura entre y0 e y1');
        if (z.ri !== undefined && z.tapa) out.push(m + ': un recipiente (ri) no lleva tapa'); });
      if (T.lados !== undefined && !(Number.isInteger(T.lados) && T.lados >= 3 && T.lados <= 32)) out.push(tipo + ': vol.torno.lados debe ser un entero entre 3 y 32');
      (v.cajas || []).forEach((c, i) => { const m = tipo + ': vol.cajas[' + i + ']';   // v2.102: cajas y troncos de pirámide
        if (!c || typeof c.pz !== 'string' || typeof c.mat !== 'string' || ![c.x, c.z, c.w, c.y0, c.y1].every((n) => typeof n === 'number' && isFinite(n))) out.push(m + ' debe llevar pz, mat, x, z, w, y0 e y1');
        else if (!(c.w > 0) || !(c.y1 > c.y0) || (c.d !== undefined && !(c.d > 0))) out.push(m + ': w (y d) deben ser mayores que 0 e y1 mayor que y0'); });
      (v.troncos || []).forEach((c, i) => { const m = tipo + ': vol.troncos[' + i + ']';
        if (!c || typeof c.pz !== 'string' || typeof c.mat !== 'string' || ![c.x, c.z, c.w0, c.w1, c.y0, c.y1].every((n) => typeof n === 'number' && isFinite(n))) out.push(m + ' debe llevar pz, mat, x, z, w0, w1, y0 e y1');
        else if (!(c.w0 > 0) || !(c.w1 >= 0) || !(c.y1 > c.y0)) out.push(m + ': w0 debe ser mayor que 0, w1 no negativo e y1 mayor que y0'); });
      if (!d.huella || !d.huella.length) out.push(tipo + ': una pieza con vol necesita huella');
      if (v.estilo !== undefined && !(G.volTex && G.volTex.ESTILOS.includes(v.estilo))) out.push(tipo + ': vol.estilo «' + v.estilo + '» no existe en G.volTex.ESTILOS');
      return out;
    }
    if (esDeCajas(v)) { // v2.105 (banco, paso 2): volumen solo de cajas; todo cabe en la huella y nada mide menos de 0,125 u
      const hu = d.huella && d.huella.length ? rectDe(celdas(d.huella)) : null;
      if (!hu) { out.push(tipo + ': una pieza con vol necesita huella'); return out; }
      v.cajas.forEach((c, i) => { const m = tipo + ': vol.cajas[' + i + ']';
        if (!c || typeof c.pz !== 'string' || typeof c.mat !== 'string' || ![c.x, c.z, c.w, c.y0, c.y1].every((n) => typeof n === 'number' && isFinite(n))) { out.push(m + ' debe llevar pz, mat, x, z, w, y0 e y1'); return; }
        const dd = c.d !== undefined ? c.d : c.w, e = 1e-9;
        if (!(c.w > 0) || !(dd > 0) || !(c.y1 > c.y0)) { out.push(m + ': w, d e y1 - y0 deben ser mayores que 0'); return; }
        if (c.w < MIN_PIEZA - e || dd < MIN_PIEZA - e || c.y1 - c.y0 < MIN_PIEZA - e) out.push(m + ': ninguna medida puede ser menor que 0,125 u (2 px)');
        if (c.x - c.w / 2 < hu.x0 - e || c.x + c.w / 2 > hu.x1 + e || c.z - dd / 2 < hu.z0 - e || c.z + dd / 2 > hu.z1 + e) out.push(m + ': se sale de la huella'); });
      if (v.estilo !== undefined && !(G.volTex && G.volTex.ESTILOS.includes(v.estilo))) out.push(tipo + ': vol.estilo «' + v.estilo + '» no existe en G.volTex.ESTILOS');
      return out;
    }
    if (!(v.muros > 0)) out.push(tipo + ': vol.muros debe ser un número mayor que 0');
    const t = v.tejado; if (!t) { out.push(tipo + ': falta vol.tejado'); return out; }
    if (t.tipo === 'dosaguas') { if (!['eo', 'ns'].includes(t.cumbrera)) out.push(tipo + ': vol.tejado.cumbrera debe ser «eo» o «ns»'); if (!(t.alto > 0)) out.push(tipo + ': vol.tejado.alto debe ser mayor que 0'); if (!(t.vuelo >= 0)) out.push(tipo + ': vol.tejado.vuelo no puede ser negativo'); }
    else if (t.tipo === 'plano') { if (!(t.peto > 0)) out.push(tipo + ': vol.tejado.peto debe ser mayor que 0'); }
    else out.push(tipo + ': vol.tejado.tipo debe ser «dosaguas» o «plano»');
    if (!d.huella || !d.huella.length) out.push(tipo + ': una pieza con vol necesita huella');
    if (v.estilo !== undefined) { // v2.68: texturas por cara (src/volumenes_tex.js)
      if (!(G.volTex && G.volTex.ESTILOS.includes(v.estilo))) out.push(tipo + ': vol.estilo «' + v.estilo + '» no existe en G.volTex.ESTILOS');
      if (G.volTex && G.volTex.SIN_FACHADA.includes(v.estilo)) { /* v2.86: la fuente no recorta ninguna fachada del 2D */ }
      else if (!Array.isArray(v.fachada) || v.fachada.length !== 4 || !v.fachada.every((n) => Number.isInteger(n) && n >= 0) || v.fachada[2] <= 0 || v.fachada[3] <= 0) out.push(tipo + ': vol.fachada debe ser [x, y, ancho, alto] en píxeles del dibujo 2D');
      else if (v.fachada[0] + v.fachada[2] > d.w || v.fachada[1] + v.fachada[3] > d.h) out.push(tipo + ': vol.fachada se sale del dibujo 2D');
    }
    if (v.chimenea !== undefined) { const c = v.chimenea, ok = c && [c.x, c.z, c.w, c.d, c.sobre].every((n) => typeof n === 'number' && isFinite(n)); if (!ok || !(c.w > 0) || !(c.d > 0) || !(c.sobre > 0) || c.x < 0 || c.z < 0) out.push(tipo + ': vol.chimenea debe ser { x, z, w, d, sobre } con medidas positivas'); }
    if (v.chimenea !== undefined && v.chimenea) { const c = v.chimenea; if ((c.vuelo !== undefined && !(c.vuelo >= 0 && c.vuelo < 1)) || (c.boca !== undefined && !(c.boca >= 0 && c.boca * 2 < Math.min(c.w, c.d) + 2 * (c.vuelo !== undefined ? c.vuelo : CORONA_VUELO)))) out.push(tipo + ': vol.chimenea.vuelo y vol.chimenea.boca deben ser números razonables (la boca cabe dentro de la corona)'); }
    if (v.variante !== undefined && !(G.volTex && G.volTex.VARIANTES && Object.prototype.hasOwnProperty.call(G.volTex.VARIANTES, v.variante))) out.push(tipo + ': vol.variante «' + v.variante + '» no existe en G.volTex.VARIANTES');
    if (v.domo !== undefined) { const c = v.domo, ok = c && [c.x, c.z, c.r, c.base].every((n) => typeof n === 'number' && isFinite(n)); if (!ok || !(c.r > 0) || !(c.base >= 0) || c.x < 0 || c.z < 0 || (c.vuelo !== undefined && !(c.vuelo >= 0))) out.push(tipo + ': vol.domo debe ser { x, z, r, base } con r mayor que 0'); if (v.tejado.tipo !== 'plano') out.push(tipo + ': vol.domo solo va sobre un tejado plano'); }
    if (v.cristales !== undefined) { if (!Array.isArray(v.cristales) || !v.cristales.every((c) => c && [c.x, c.z, c.w, c.h].every((n) => typeof n === 'number' && isFinite(n)) && c.w > 0 && c.h > 0 && c.x >= 0 && c.z >= 0 && /^#[0-9a-fA-F]{6}$/.test(c.c || ''))) out.push(tipo + ': vol.cristales debe ser una lista de { x, z, w, h, c: "#rrggbb" } con medidas positivas'); if (v.tejado.tipo !== 'plano') out.push(tipo + ': vol.cristales solo va sobre un tejado plano'); }
    if (v.escaner !== undefined) { const c = v.escaner, ok = c && [c.x, c.z, c.mastil, c.r].every((n) => typeof n === 'number' && isFinite(n)); if (!ok || !(c.mastil > 0) || !(c.r > 0) || c.x < 0 || c.z < 0) out.push(tipo + ': vol.escaner debe ser { x, z, mastil, r } con medidas positivas'); }
    if (v.adornos !== undefined) { if (!Array.isArray(v.adornos) || !v.adornos.every((c) => c && ['x0', 'x1', 'y0', 'y1', 'z0', 'z1'].every((k) => typeof c[k] === 'number' && isFinite(c[k])) && c.x1 > c.x0 && c.y1 > c.y0 && c.z1 > c.z0 && c.y0 >= 0)) out.push(tipo + ': vol.adornos debe ser una lista de cajas { x0, x1, y0, y1, z0, z1 } con x1 > x0, y1 > y0 y z1 > z0'); }
    if (v.rotulo !== undefined) { const c = v.rotulo, ok = c && [c.x, c.w, c.y, c.alto].every((n) => typeof n === 'number' && isFinite(n)) && typeof c.texto === 'string' && c.texto.length > 0; if (!ok || !(c.w > 0) || !(c.alto > 0) || c.x < 0 || c.y < 0) out.push(tipo + ': vol.rotulo debe ser { x, w, y, alto, texto } con medidas positivas'); }
    if (v.toldo !== undefined) { [].concat(v.toldo).forEach((c) => { const ok = c && [c.x, c.w, c.y, c.caida, c.vuelo].every((n) => typeof n === 'number' && isFinite(n)); if (!ok || !(c.w > 0) || !(c.caida > 0) || !(c.vuelo > 0) || c.x < 0 || !(c.y > c.caida)) out.push(tipo + ': vol.toldo debe ser { x, w, y, caida, vuelo } con medidas positivas'); }); }
    if (v.veleta !== undefined) { const c = v.veleta, ok = c && [c.x, c.z, c.poste].every((n) => typeof n === 'number' && isFinite(n)); if (!ok || !(c.poste > 0) || c.x < 0 || c.z < 0) out.push(tipo + ': vol.veleta debe ser { x, z, poste } con poste mayor que 0'); }
    return out;
  }


  // ── v2.88 (paso E1, oclusión): qué partes del edificio se atenúan y cuándo tapa a alguien ──
  // FIJAS = lo que nunca se atenúa del todo (muros, nicho, losa, toldo); el resto (tejado, hastiales, cubierta, peto, cúpula, chimenea, veleta, cristales, escáner…) es «alto» y se atenúa entero. De los muros solo se atenúa el tercio alto (lo decide el pintor con `corteMuros`).
  const FIJAS = new Set(['muro', 'nicho', 'losa', 'toldo', 'toldo_fleco', 'rotulo', 'rotulo_canto', 'adorno']), TECHO = new Set(['faldon', 'hastial', 'cubierta']), ESTRUCTURA = new Set(['muro', 'nicho', 'faldon', 'hastial', 'cubierta', 'peto', 'peto_dentro', 'peto_canto', 'domo']);
  const esFija = (parte) => FIJAS.has(parte);
  const tieneTecho = (geo) => geo.poligonos.some((p) => TECHO.has(p.parte)) && geo.poligonos.some((p) => p.parte === 'muro' && Math.max(...p.v.map((q) => q[1])) >= 1.5); // un edificio: tejado Y muros de al menos 1,5 u; la fuente (borde de 0,5 u con su «cubierta» de agua) no se atenúa
  // Índices (desde, hasta) de un búfer de `buferes()` repartidos en fijos y altos: { fijos: [i…], altos: [i…] }
  function repartirIndices(b) {
    const fijos = [], altos = [];
    b.grupos.forEach((g) => { const dst = esFija(g.parte) ? fijos : altos; for (let k = g.desde; k < g.hasta; k++) dst.push(b.i[k]); });
    return { fijos, altos };
  }
  // Segmento A→B contra un triángulo (Möller–Trumbore, sin mirar de qué lado): devuelve t en (0,1) o -1
  function cruce(A, B, p0, p1, p2) {
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], e2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    const h = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]], a = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
    if (Math.abs(a) < 1e-9) return -1;
    const f = 1 / a, s = [A[0] - p0[0], A[1] - p0[1], A[2] - p0[2]], u = f * (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]); if (u < 0 || u > 1) return -1;
    const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]], v = f * (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]); if (v < 0 || u + v > 1) return -1;
    const t = f * (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]); return t > 1e-4 && t < 1 - 0.02 ? t : -1; // el 0,02 final evita contar la pared contra la que está apoyado el punto
  }
  // ¿El segmento A→B (cámara → punto) cruza la estructura (muros, nicho, tejado) del edificio colocado en (cx, y0, cz)? Puro: A y B son [x, y, z] en unidades del mapa.
  function tapa(geo, cx, cz, y0, A, B) {
    const R = geo.rect, x0 = cx + R.x0 - 1, x1 = cx + R.x1 + 1, z0 = cz + R.z0 - 1, z1 = cz + R.z1 + 1, y1 = y0 + geo.altoTotal + 0.5;
    if (Math.max(A[0], B[0]) < x0 || Math.min(A[0], B[0]) > x1 || Math.max(A[2], B[2]) < z0 || Math.min(A[2], B[2]) > z1 || Math.min(A[1], B[1]) > y1) return false; // el segmento no pasa ni cerca
    const mover = (v) => [v[0] + cx, v[1] + y0, v[2] + cz];
    for (const p of geo.poligonos) {
      if (!ESTRUCTURA.has(p.parte)) continue;
      const w = p.v.map(mover);
      if (cruce(A, B, w[0], w[1], w[2]) > 0) return true;
      if (w.length === 4 && cruce(A, B, w[0], w[2], w[3]) > 0) return true;
    }
    return false;
  }

  G.volumenes = { TONO, MAX_TRIANGULOS, LOSA_Y, CORONA, VELETA_ANCHO, VELETA_ALTO, SOMBRA, celdas, rectDe, techoY, techoMax, geometria, buferes, validar, empaquetar, sombraSuelo, redonda, esDeCajas, MIN_PIEZA, esFija, tieneTecho, repartirIndices, tapa };
})(typeof window !== 'undefined' ? window : globalThis);
