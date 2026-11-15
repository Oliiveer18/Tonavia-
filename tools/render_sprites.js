// render.js <srcdir> <out.json> <ids> [frames, p. ej. 0,1,2] : dibuja las 3 fases x 4 dirs x 2 pasos con un lienzo falso que guarda píxeles
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
const FR = (process.argv[5] || '0,1').split(',').map(Number);
const G = window.G, ids = (process.argv[4] || 'aguacato,aguacaton,aguacatigre').split(','), out = {};
ids.forEach(id => { out[id] = {};
  if (G.spr[id + '_down_0']) { // personaje jugable (rex = Oli, luna = Lali): sprites de chars.js; izquierda = sideL si existe
    ['down','up','left','right'].forEach(d => FR.forEach(f => { const v = d === 'left' ? (G.spr[id + '_sideL_0'] ? 'sideL' : 'side') : d === 'right' ? 'side' : d, s = G.spr[id + '_' + v + '_' + f]; let px = Array.from(s.c._data); if (d === 'left' && v === 'side') { const W = s.c.width, H = s.c.height, o = px.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) px[(y * W + x) * 4 + k] = o[(y * W + (W - 1 - x)) * 4 + k]; } // sin perfil izquierdo propio (Lali): espejo, como hace el juego
      out[id][d + f] = { w: s.c.width, h: s.c.height, d: px }; })); return; } ['down','up','left','right'].forEach(d => FR.forEach(f => { const s = G.creatureSprite(id, d, f); out[id][d + f] = { w: s.c.width, h: s.c.height, d: Array.from(s.c._data) }; })); });
fs.writeFileSync(process.argv[3], JSON.stringify(out));
