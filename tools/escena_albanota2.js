// escena_albanota2.js — ID-1d: base de la escena de prueba con las medidas del PLANO (48×36, casilla 16 px). Mundo = x 0-32, y 0-36 casillas. Solo dibujo; no toca el juego.
// Se ejecuta DENTRO de dist/criaturas.html (usa window.G: paleta, rampas, sprites reales) con tools/escena_albanota.py.

(function () {
  'use strict';
  const G = window.G, P = G.PAL, W = 512, H = 576, INK = P.ink;
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

  // ---------- suelo: mapa de casillas del plano (x en 0-31, y en 0-35) ----------
  const TW = 32, TH = 36;
  const M = Array.from({ length: TH }, () => Array(TW).fill('g'));
  const rect = (x, y, w, h, v) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < TH && i >= 0 && i < TW) M[j][i] = v; };
  rect(0, 29, 32, 3, 'w');            // arroyo recto (y 29-31)
  rect(20, 15, 9, 7, 'c');            // plaza del Cascabel 9×7
  rect(23, 10, 3, 5, 'p');            // avenida norte (x 23-25)
  rect(23, 22, 3, 14, 'p');           // avenida sur: plaza - puente - Ruta 1
  rect(0, 17, 20, 3, 'p'); rect(29, 17, 3, 3, 'p'); // avenida oeste y este (y 17-19)
  rect(26, 10, 6, 2, 'p');            // calle norte hacia la Tienda
  rect(3, 15, 3, 2, 'p'); rect(12, 15, 3, 2, 'p');  // ramales de las casas (3 de ancho)
  rect(9, 27, 14, 2, 'p');            // camino del laboratorio junto al arroyo
  const K = new Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) K[y * W + x] = M[y >> 4][x >> 4];
  const FX = 392, FY = 296, PX0 = 320, PX1 = 464, PY0 = 240, PY1 = 352, CH = 9; // fuente y plaza (px)
  for (let y = PY0; y < PY1; y++) for (let x = PX0; x < PX1; x++) { const dx = Math.min(x - PX0, PX1 - 1 - x), dy = Math.min(y - PY0, PY1 - 1 - y); if (dx < CH && dy < CH && dx + dy < CH - 1) K[y * W + x] = 'g'; } // esquinas cortadas
  const at = (x, y, d) => (x < 0 || y < 0 || x >= W || y >= H ? (d || 'g') : K[y * W + x]);
  const pav = (k) => k === 'p' || k === 'c';
  const RIO = 464; // primera fila del arroyo (px)

  function sueloColor(x, y) {
    const k = at(x, y);
    if (k === 'p') {
      const row = y >> 2, off = (row & 1) * 4, lx = (x + off) & 7, ly = y & 3;
      const Lb = !pav(at(x - 1, y, k)) || !pav(at(x, y - 1, k)), Db = !pav(at(x + 1, y, k)) || !pav(at(x, y + 1, k));
      if (Db || ly === 3 || lx === 7) return SAND_S;
      if (Lb) return SAND_L;
      return SAND;
    }
    if (k === 'c') {
      const near = (d) => at(x - d, y) === 'g' || at(x, y - d) === 'g' || at(x + d, y) === 'g' || at(x, y + d) === 'g' || at(x - d, y - d) === 'g' || at(x + d, y + d) === 'g' || at(x - d, y + d) === 'g' || at(x + d, y - d) === 'g';
      if (near(1)) return (at(x + 1, y) === 'g' || at(x, y + 1) === 'g' || at(x + 1, y + 1) === 'g') ? P.stone3 : P.stone2; // reborde
      if (near(3)) return (at(x - 1, y) === 'g' || at(x, y - 1) === 'g' || at(x - 3, y) === 'g' || at(x, y - 3) === 'g' || at(x - 3, y - 3) === 'g') ? '#e4e0ec' : P.stone1; // bordillo
      const dx = x + 0.5 - FX, dy = (y + 0.5 - FY) / 0.62, d = Math.sqrt(dx * dx + dy * dy);
      const row = ((y - PY0) / 5) | 0, off = (row % 2) * 4, lx = (x + off) % 8, ly = (y - PY0) % 5;
      const joint = ly === 4 || lx === 7;
      if (d >= 36 && d < 40.5) { const ang = Math.atan2(dy, dx), sec = Math.floor(((ang + Math.PI) / (2 * Math.PI)) * 16); return joint ? '#c9a96c' : (sec % 2 ? '#ead7ae' : '#f0b9a0'); } // anillo de «reloj»: arena y rosa
      return joint ? COB_J : COB;
    }
    if (k === 'w') {
      const t = y - RIO; // orilla norte de tierra, agua, orilla sur de arena (todo recto)
      if (t < 3) return t === 2 ? '#6b4226' : (t === 0 ? '#c48b52' : '#a96f46');
      if (t >= 46) return t === 46 ? '#ead7ae' : '#d3bb86';
      if (t < 5) return WA_S;
      if (t >= 44) return WA;
      const r = (t / 5) | 0, ph = (x + r * 13) % 30;
      if (t % 5 === 0 && ph < 6 && r % 2 === 0 && r > 0) return WA_L;
      return WA;
    }
    return GR; // hierba plana, sin manchas
  }
  const id = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = hx(sueloColor(x, y)), i = (y * W + x) * 4; id.data[i] = c[0]; id.data[i + 1] = c[1]; id.data[i + 2] = c[2]; id.data[i + 3] = 255; }
  ctx.putImageData(id, 0, 0);

  window.__escena = { G, P, W, H, INK, L, items, put, hash, R, hx, ctx, cv, K, at, FX, FY, RIO, colores: { GR, GR2, GR3, PI, PI2, PI3, SAND, SAND_S, SAND_L, COB, COB_J, WA, WA_S, WA_L, WA_D, BELL_B, BELL_BL, BELL_P, BELL_PS, GOLD, GOLD_S } };
})();
