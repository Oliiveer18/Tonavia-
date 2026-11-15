// brillo.js (v2.47): las criaturas con sombreado no pueden quedar demasiado más oscuras que su dibujo sin sombreado. Para las 41 formas (de frente, cuadro 0): la pérdida media de claridad ≤ 4 y la peor ≤ 8 (de 255), y el alfa (la silueta) no cambia. Uso: node tools/brillo.js [carpeta]. Sale con 1 si falla. (Antes de la v2.47 la media era 4,7 y la peor 11.)
const path = require('path'), fs = require('fs');
const root = path.resolve(process.argv[2] || '.');
function hex(s) { const m = /^#([0-9a-f]{6})$/i.exec(s); return m ? [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)] : [0,0,0]; }
function mkCanvas(w, h) {
  const data = new Uint8ClampedArray(w * h * 4); let tx = 0, ty = 0; const st = [];
  const ctx = { fillStyle: '#000', imageSmoothingEnabled: false,
    save() { st.push([tx, ty]); }, restore() { [tx, ty] = st.pop(); }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, ww, hh) { const [r, g, b] = hex(this.fillStyle); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i + tx, Y = y + j + ty; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const o = (Y * w + X) * 4; data[o] = r; data[o+1] = g; data[o+2] = b; data[o+3] = 255; } },
    getImageData(x, y, ww, hh) { const out = new Uint8ClampedArray(ww * hh * 4); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const o = ((y + j) * w + x + i) * 4, p = (j * ww + i) * 4; for (let k = 0; k < 4; k++) out[p + k] = data[o + k]; } return { data: out }; },
    putImageData(id) { data.set(id.data); }, createImageData(ww, hh) { return { data: new Uint8ClampedArray(ww * hh * 4) }; },
    drawImage() {}, clearRect() {}, measureText: () => ({ width: 40 }) };
  return { width: w, height: h, getContext: () => ctx, _data: data };
}
const noop = () => {};
global.window = global; global.document = { createElement: () => mkCanvas(1, 1), getElementById: () => ({ getContext: () => mkCanvas(10,10).getContext(), hidden: false }), querySelectorAll: () => [] };
global.__makeCanvas = mkCanvas; window.G = window.G || {};
const mc = (w, h) => mkCanvas(w, h); 
global.document.createElement = () => { const c = mkCanvas(1,1); return new Proxy(c, { set(t, p, v) { t[p] = v; if (p === 'height' || p === 'width') { const nc = mkCanvas(t.width || 1, t.height || 1); t._data = nc._data; t.getContext = nc.getContext; } return true; } }); };
global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800; global.setTimeout = () => 0; global.clearTimeout = noop;
require(path.join(root, 'src/orden.json')).datos.forEach(f => require(path.join(root, f))); // lista única: src/orden.json
const G = window.G, ids = Object.keys(G.CREATURES), lum = (d) => { let t = 0, c = 0; for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 0) { t += 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]; c++; } return t / c; };
const sprite = (id, act) => { G.SOMBREADO.ACTIVO = act; G.spriteCacheClear && G.spriteCacheClear(); const s = G.creatureSprite(id, 'down', 0); return Array.from(s.c._data); };
let suma = 0, peor = 0, peorId = '', alfa = [];
ids.forEach((id) => { const a = sprite(id, true), b = sprite(id, false), dif = lum(b) - lum(a); suma += dif; if (dif > peor) { peor = dif; peorId = id; } for (let k = 3; k < a.length; k += 4) if (a[k] !== b[k]) { alfa.push(id); break; } });
const media = suma / ids.length, ok = media <= 4 && peor <= 8 && !alfa.length;
console.log((ok ? 'OK' : 'FALLA') + ': ' + ids.length + ' formas · pérdida media de claridad ' + media.toFixed(1) + ' (≤ 4) · la peor ' + peor.toFixed(1) + ' en ' + peorId + ' (≤ 8) · siluetas cambiadas: ' + (alfa.join(', ') || 'ninguna'));
process.exit(ok ? 0 : 1);
