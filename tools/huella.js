// huella.js — hash (sha256) de TODOS los sprites del juego: cada forma × 4 direcciones × frames 0-3. Paso 1.2: prueba de que mover dibujos de archivo no cambia ni un píxel.
// Uso:  node tools/huella.js        -> imprime «hash · N sprites». Los sprites se recorren ordenados por id (el orden de G.CREATURES no entra en la huella).
// Opción --cache N (v2.9, paso 1.5): limita la caché de sprites a N y recorre todos los sprites DOS veces (la segunda, todos descartados y vueltos a dibujar); el hash es el de la segunda vuelta y debe ser idéntico al normal.
// Opción --sombreado (v2.21): calcula la huella con el sombreado encendido (sin la opción se apaga: es la huella de la v2.19, que no debe cambiar).
// Usa el lienzo falso con píxeles (como tools/equilibrio.js) y la lista única de archivos src/orden.json.
const path = require('path'), crypto = require('crypto');
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
const G = window.G, h = crypto.createHash('sha256'); let n = 0;
G.SOMBREADO.ACTIVO = process.argv.includes('--sombreado'); // v2.21: por defecto SIN sombreado (la huella de siempre debe salir idéntica); --sombreado da la huella de los sprites sombreados
const ia = process.argv.indexOf('--cache'), LIM = ia > 0 ? Number(process.argv[ia + 1]) : 0;
const ids = Object.keys(G.CREATURES).sort(), pasada = (hash) => ids.forEach((id) => ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2, 3].forEach((f) => { const s = G.creatureSprite(id, d, f); if (hash) { hash.update(id + d + f + s.w + 'x' + s.h); hash.update(Buffer.from(s.c._data)); n++; } })));
if (LIM) { G.SPRITE_LIMIT = LIM; pasada(null); G.spriteCacheClear(); G.SPRITE_LIMIT = LIM; pasada(null); G.spriteStats().evictions; }
pasada(h);
console.log(h.digest('hex'), '·', n, 'sprites' + (LIM ? ' (caché limitada a ' + LIM + ': ' + G.spriteStats().evictions + ' descartes, ' + G.spriteStats().size + ' guardados al final)' : ''));
