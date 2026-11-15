// escena_albanota.js — ID-1b: imagen de prueba de un trozo de Albanota (solo dibujo; no toca el juego).
// Se ejecuta DENTRO de dist/criaturas.html (usa window.G: paleta, rampas, sprites reales) con tools/escena_albanota.py.
// Mundo de 144x288 px (9x18 casillas de 16 px); la vista de móvil 390x844 con zoom 3 recorta 130x281.
(function () {
  'use strict';
  const G = window.G, P = G.PAL, W = 144, H = 288, INK = P.ink;
  const cv = G.makeCanvas(W, H), ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const rp = {}; const R = (c) => rp[c] || (rp[c] = G.rampa(c));
  const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

  // ---------- capas pequeñas con contorno automático ----------
  function L(w, h) {
    const c = G.makeCanvas(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const o = { c, x, w, h,
      f(col, a, b, ww, hh) { x.fillStyle = col; x.fillRect(a, b, ww, hh); },
      p(col, a, b) { x.fillStyle = col; x.fillRect(a, b, 1, 1); },
      disc(col, cx, cy, r) { o.ell(col, cx, cy, r, r); },
      ell(col, cx, cy, rx, ry) { x.fillStyle = col; for (let yy = Math.floor(cy - ry); yy <= Math.ceil(cy + ry); yy++) for (let xx = Math.floor(cx - rx); xx <= Math.ceil(cx + rx); xx++) { const dx = (xx + 0.5 - cx) / rx, dy = (yy + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) x.fillRect(xx, yy, 1, 1); } },
      has(a, b) { return a >= 0 && b >= 0 && a < w && b < h && x.getImageData(a, b, 1, 1).data[3] > 0; },
      outline() { const id = x.getImageData(0, 0, w, h), d = id.data, s = new Uint8ClampedArray(d), k = hx(INK);
        const al = (a, b) => (a < 0 || b < 0 || a >= w || b >= h ? 0 : s[(b * w + a) * 4 + 3]);
        for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) { const i = (b * w + a) * 4; if (s[i + 3] === 0 && (al(a - 1, b) || al(a + 1, b) || al(a, b - 1) || al(a, b + 1))) { d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = 255; } }
        x.putImageData(id, 0, 0); return o; },
    };
    return o;
  }
  const items = []; // objetos que se ordenan por la Y de sus pies
  const put = (l, x, y, foot, extra) => items.push({ l, x, y, foot: foot === undefined ? y + l.h : foot, extra });
  const hash = (a, b, k) => { let h = (a * 374761393 + b * 668265263 + k * 2147483647) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };

  // ---------- paleta de Albanota ----------
  const GR = P.green, GR2 = P.green2, GR3 = '#7cc972', PI = '#2f6f45', PI2 = '#235636', PI3 = '#4f9a56';
  const SAND = '#e0c48c', SAND_S = '#c9a96c', SAND_L = '#f0d9a2', COB = '#b9b4c4', COB_J = '#9690a6', COB_L = '#d3cfdd';
  const WA = '#4d7fd6', WA_S = '#35559a', WA_L = '#8fb4f0', WA_D = '#2f4a86';
  const BELL_B = '#4d7fd6', BELL_BL = '#8fb4f0', BELL_P = '#f5a8bd', BELL_PS = '#e47a9a', GOLD = '#f7d54a', GOLD_S = '#d9a52e';

  // ---------- suelo por píxeles (sin contorno; bordes con bisel arriba-izquierda / abajo-derecha) ----------
  const FX = 56, FY = 198; // centro de la fuente (base del estanque)
  const K = new Array(W * H).fill('g');
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 'g' : K[y * W + x]);
  const setK = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) K[y * W + x] = v; };
  const rectK = (x0, y0, x1, y1, v) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) setK(x, y, v); };
  const PX0 = 17, PX1 = 95, PY0 = 142, PY1 = 226, CH = 9; // plaza: rectángulo con esquinas cortadas
  for (let y = PY0; y < PY1; y++) for (let x = PX0; x < PX1; x++) { const dx = Math.min(x - PX0, PX1 - 1 - x), dy = Math.min(y - PY0, PY1 - 1 - y); if (dx + dy >= CH - 1 || (dx >= CH || dy >= CH)) setK(x, y, 'c'); }
  rectK(42, 122, 70, 146, 'p'); // camino de la puerta a la plaza
  rectK(42, 224, 70, 234, 'p'); rectK(42, 254, 70, 288, 'p'); // camino al puente y tras el puente
  const bt = (x) => 232 + Math.round(2.2 * Math.sin(x * 0.085 + 0.6)), bb = (x) => 255 + Math.round(2.0 * Math.sin(x * 0.07 + 2.0)); // orillas norte y sur del arroyo
  for (let x = 0; x < W; x++) { for (let y = bt(x); y < bt(x) + 3; y++) setK(x, y, 'b'); for (let y = bt(x) + 3; y < bb(x); y++) setK(x, y, 'w'); for (let y = bb(x); y < bb(x) + 2; y++) setK(x, y, 's'); }
  rectK(42, 224, 70, 234, 'p'); // el camino pisa la orilla norte
  rectK(42, 256, 70, 258, 'p');
  // huerto (tierra) a la derecha de la plaza
  const GX0 = 104, GY0 = 154, GX1 = 148, GY1 = 212;

  function sueloColor(x, y) {
    const k = at(x, y);
    if (k === 'p') {
      const row = ((y - 122) / 4) | 0, off = (row % 2) * 4, lx = (x + off) % 8, ly = (y - 122) % 4;
      const L1 = at(x - 1, y) !== 'p' || at(x, y - 1) !== 'p', D1 = at(x + 1, y) !== 'p' || at(x, y + 1) !== 'p';
      if (D1 || ly === 3 || lx === 7) return SAND_S;
      if (L1) return SAND_L;
      return SAND;
    }
    if (k === 'c') {
      const edge = (at(x - 1, y) === 'g' ? 1 : 0) | (at(x, y - 1) === 'g' ? 2 : 0) | (at(x + 1, y) === 'g' ? 4 : 0) | (at(x, y + 1) === 'g' ? 8 : 0);
      const near = (d) => at(x - d, y) === 'g' || at(x, y - d) === 'g' || at(x + d, y) === 'g' || at(x, y + d) === 'g' || at(x - d, y - d) === 'g' || at(x + d, y + d) === 'g' || at(x - d, y + d) === 'g' || at(x + d, y - d) === 'g';
      if (near(1)) return (at(x + 1, y) === 'g' || at(x, y + 1) === 'g' || at(x + 1, y + 1) === 'g') ? P.stone3 : P.stone2; // reborde
      if (near(3)) return (at(x - 1, y) === 'g' || at(x, y - 1) === 'g' || at(x - 3, y) === 'g' || at(x, y - 3) === 'g' || at(x - 3, y - 3) === 'g') ? '#e4e0ec' : P.stone1; // bordillo
      const dx = x + 0.5 - FX, dy = (y + 0.5 - FY) / 0.62, d = Math.sqrt(dx * dx + dy * dy);
      const row = ((y - PY0) / 5) | 0, off = (row % 2) * 4, lx = (x + off) % 8, ly = (y - PY0) % 5;
      const joint = ly === 4 || lx === 7;
      if (d >= 29 && d < 32.5) { const ang = Math.atan2(dy, dx), sec = Math.floor(((ang + Math.PI) / (2 * Math.PI)) * 16); return joint ? '#c9a96c' : (sec % 2 ? '#ead7ae' : '#f0b9a0'); } // anillo de «reloj»: arena y rosa, como el cascabel
      return joint ? COB_J : COB;
    }
    if (k === 'b') { const t = y - bt(x); return t === 2 ? '#6b4226' : (t === 0 ? '#c48b52' : '#a96f46'); }
    if (k === 'w') { return aguaColor(x, y); }
    if (k === 's') return y === bb(x) ? '#ead7ae' : '#d3bb86';
    // hierba plana: sin manchas
    return GR;
  }
  function aguaColor(x, y) {
    const t = y - (bt(x) + 3), tb = bb(x) - y;
    if (t < 2) return WA_S; // sombra de la orilla norte
    if (tb <= 2) return WA; // franja clara junto a la arena sur
    const r = ((y - bt(x)) / 5) | 0, ph = (x + r * 11) % 26; // corriente: trazos horizontales largos y regulares
    if ((y - bt(x)) % 5 === 0 && ph < 7 && r > 0) return WA_L;
    return WA;
  }
  const id = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = hx(sueloColor(x, y)), i = (y * W + x) * 4; id.data[i] = c[0]; id.data[i + 1] = c[1]; id.data[i + 2] = c[2]; id.data[i + 3] = 255; }
  ctx.putImageData(id, 0, 0);

  window.__escena = { G, P, W, H, INK, L, items, put, hash, R, hx, ctx, cv, K, at, FX, FY, bt, bb, GX0, GY0, GX1, GY1, colores: { GR, GR2, GR3, PI, PI2, PI3, SAND, SAND_S, SAND_L, COB, COB_J, WA, WA_S, WA_L, WA_D, BELL_B, BELL_BL, BELL_P, BELL_PS, GOLD, GOLD_S } };
})();
