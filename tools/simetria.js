// simetria.js — v2.23 (B1): busca criaturas cuyo estirado de 16 a otro tamaño (G.creatureSprite) mete una asimetría que el dibujo original no tenía (el fallo del ojo de Aguacato).
// Uso: node tools/simetria.js [--sombreado]   (sin opción: con el sombreado apagado, como la v2.20; con --sombreado: con el sistema nuevo, donde las criaturas piloto llevan el estirado simétrico).
// Cómo: por cada forma de dibujo a 16, se dibuja de frente y de espaldas (frames 0 y 1) a su tamaño real y otra vez a 16×16; se compara cada una con su espejo (clase de píxel: vacío · contorno · blanco · color).
// Si la versión estirada tiene MÁS píxeles distintos que la de 16, el estirado ha metido asimetría: se avisa. Las formas dibujadas a su tamaño (native) no se estiran y solo se listan aparte.
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
const G = window.G, CON = process.argv.includes('--sombreado');
G.SOMBREADO.ACTIVO = CON; G.SOMBREADO.VOLUMEN = CON;

const clase = (d, i) => (d[i + 3] === 0 ? 0 : d[i] === 0x2a && d[i + 1] === 0x1b && d[i + 2] === 0x30 ? 1 : d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235 ? 2 : 3);
function asim(s) { const w = s.c.width, h = s.c.height, d = s.c._data; let n = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w >> 1; x++) if (clase(d, (y * w + x) * 4) !== clase(d, (y * w + (w - 1 - x)) * 4)) n++; return n; }
const dibujar = (id, dir, f) => { G.spriteCacheClear(); return G.creatureSprite(id, dir, f); };

const ids = Object.keys(G.CREATURES).sort(), avisos = [], nativas = [], ok = [];
ids.forEach((id) => {
  const def = G.CREATURES[id], tr = G.TRAITS[id], [tw, th] = G.traits(id).size;
  if (def.native) { nativas.push(id); return; }
  if (tw === 16 && th === 16) { ok.push(id + ' (16)'); return; }
  let peor = 0, final = 0, fuente = 0;
  ['down', 'up'].forEach((dir) => [0, 1].forEach((f) => { final += asim(dibujar(id, dir, f)); }));
  const guardado = tr.size; tr.size = [16, 16];
  try { ['down', 'up'].forEach((dir) => [0, 1].forEach((f) => { fuente += asim(dibujar(id, dir, f)); })); } finally { tr.size = guardado; G.spriteCacheClear(); }
  const extra = final - fuente;
  (extra > 0 ? avisos : ok).push(extra > 0 ? { id, tam: tw + '×' + th, final, fuente, extra } : id + ' (' + tw + '×' + th + ')');
});
console.log((CON ? 'Con sistema nuevo (sombreado + volumen)' : 'Con sombreado apagado') + ' · ' + ids.length + ' formas · ' + nativas.length + ' dibujadas a su tamaño (sin estirar) · ' + (ids.length - nativas.length) + ' estiradas o de 16');
if (!avisos.length) console.log('TODO BIEN: ningún estirado mete asimetría nueva.');
else { console.log('AVISO: el estirado mete asimetría (píxeles distintos frente al espejo, de frente y de espaldas, frames 0-1):'); avisos.sort((a, b) => b.extra - a.extra).forEach((a) => console.log('  ' + a.id.padEnd(12) + a.tam.padEnd(7) + 'estirada ' + a.final + ' · dibujo a 16: ' + a.fuente + ' · extra +' + a.extra)); }
process.exitCode = avisos.length ? 1 : 0;
