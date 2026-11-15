// bloques.js — v2.24.6 (paso 2a): mide cuántos píxeles de sombra de las criaturas con `limpio` quedan fuera de un bloque 2×2 de sombra (regla 4 del estándar). Uso: node tools/bloques.js (sale con código 1 si hay alguno).
const path = require('path');
const root = path.resolve(__dirname, '..');
function hex(s) { const m = /^#([0-9a-f]{6})$/i.exec(s); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : [0, 0, 0]; }
function mkCanvas(w, h) {
  const data = new Uint8ClampedArray(w * h * 4); let tx = 0, ty = 0; const st = [];
  const ctx = { fillStyle: '#000', imageSmoothingEnabled: false, save() { st.push([tx, ty]); }, restore() { [tx, ty] = st.pop(); }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, ww, hh) { const [r, g, b] = hex(this.fillStyle); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i + tx, Y = y + j + ty; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const o = (Y * w + X) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; } },
    getImageData(x, y, ww, hh) { const out = new Uint8ClampedArray(ww * hh * 4); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const o = ((y + j) * w + x + i) * 4, p = (j * ww + i) * 4; for (let k = 0; k < 4; k++) out[p + k] = data[o + k]; } return { data: out }; },
    putImageData(id) { data.set(id.data); }, createImageData(ww, hh) { return { data: new Uint8ClampedArray(ww * hh * 4) }; }, drawImage() {}, clearRect() {}, measureText: () => ({ width: 40 }) };
  return { width: w, height: h, getContext: () => ctx, _data: data };
}
const noop = () => {};
global.window = global; global.document = { getElementById: () => ({ getContext: () => mkCanvas(10, 10).getContext(), hidden: false }), querySelectorAll: () => [] };
global.document.createElement = () => { const c = mkCanvas(1, 1); return new Proxy(c, { set(t, p, v) { t[p] = v; if (p === 'height' || p === 'width') { const nc = mkCanvas(t.width || 1, t.height || 1); t._data = nc._data; t.getContext = nc.getContext; } return true; } }); };
global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800; global.setTimeout = () => 0; global.clearTimeout = noop;
require(path.join(root, 'src/orden.json')).datos.forEach((f) => require(path.join(root, f)));
const G = window.G, ids = Object.keys(G.LUZ_CRIATURAS || {}).filter((i) => G.LUZ_CRIATURAS[i].limpio).sort();
const sp = (id, dir, f, on) => { G.SOMBREADO.ACTIVO = on; G.SOMBREADO.VOLUMEN = on; G.spriteCacheClear(); const s = G.creatureSprite(id, dir, f); return { w: s.c.width, h: s.c.height, d: Uint8ClampedArray.from(s.c._data) }; };
let vistas = 0, sombra = 0, sueltos = 0; const peores = [];
ids.forEach((id) => { let n = 0; ['down', 'up', 'left', 'right'].forEach((dir) => [0, 1].forEach((f) => {
  const A = sp(id, dir, f, false), B = sp(id, dir, f, true); vistas++;
  const S = (x, y) => { if (x < 0 || y < 0 || x >= A.w || y >= A.h) return false; const i = (y * A.w + x) * 4; return !!A.d[i + 3] && (A.d[i] !== B.d[i] || A.d[i + 1] !== B.d[i + 1] || A.d[i + 2] !== B.d[i + 2]) && (0.2126 * B.d[i] + 0.7152 * B.d[i + 1] + 0.0722 * B.d[i + 2]) < (0.2126 * A.d[i] + 0.7152 * A.d[i + 1] + 0.0722 * A.d[i + 2]); };
  for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) { if (!S(x, y)) continue; sombra++; let ok = false; for (const [ox, oy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) if (S(x + ox, y + oy) && S(x + ox + 1, y + oy) && S(x + ox, y + oy + 1) && S(x + ox + 1, y + oy + 1)) ok = true; if (!ok) { sueltos++; n++; } }
})); if (n) peores.push(id + ' ' + n); });
console.log('Muestra: ' + ids.length + ' criaturas con limpio × 8 vistas (4 direcciones × frames 0-1) = ' + vistas + ' vistas · ' + sombra + ' px de sombra · ' + sueltos + ' fuera de un bloque 2×2' + (peores.length ? ' (' + peores.join(', ') + ')' : ''));
process.exitCode = sueltos ? 1 : 0;
