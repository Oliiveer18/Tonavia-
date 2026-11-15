// huella_juego.js — huella (sha256) de TODO lo que el juego dibuja durante una partida simulada y determinista (v2.51b, paso A2).
// Sirve para demostrar que reorganizar game.js no cambia ni una llamada de dibujo ni el estado de la partida.
// Uso:  node tools/huella_juego.js [carpeta]   -> imprime «hash · N llamadas · estado»   (carpeta = raíz del juego; por defecto, esta)
//       node tools/huella_juego.js --comprobar -> compara con docs/HUELLA_JUEGO.txt (lo usa test.js). Si cambias A PROPÓSITO lo que se ve: node tools/huella_juego.js --escribir
// Lienzo falso con píxeles; cada lienzo lleva un número de serie, así que también se nota qué sprite se dibuja. Fecha y azar fijos.
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const arg = process.argv.slice(2).find((a) => !a.startsWith('--')), root = path.resolve(arg || path.join(__dirname, '..'));
const hex = (s) => { const m = /^#([0-9a-f]{6})$/i.exec(s); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : [0, 0, 0]; };
let serie = 0; const hash = crypto.createHash('sha256'); let llamadas = 0;
const noop = () => {};
function mk(w, h, grabar) {
  w = w || 1; h = h || 1; const data = new Uint8ClampedArray(w * h * 4); let tx = 0, ty = 0; const st = [];
  const base = { fillStyle: '#000', imageSmoothingEnabled: false, save() { st.push([tx, ty]); }, restore() { [tx, ty] = st.pop() || [0, 0]; }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, ww, hh) { const [r, g, b] = hex(this.fillStyle); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i + tx, Y = y + j + ty; if (X < 0 || Y < 0 || X >= cv.width || Y >= cv.height) continue; const o = (Y * cv.width + X) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; } },
    getImageData(x, y, ww, hh) { const out = new Uint8ClampedArray(ww * hh * 4); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= cv.width || Y >= cv.height) continue; const o = (Y * cv.width + X) * 4, p = (j * ww + i) * 4; for (let k = 0; k < 4; k++) out[p + k] = data[o + k]; } return { data: out, width: ww, height: hh }; },
    putImageData(id) { data.set(id.data.subarray(0, data.length)); }, createImageData(ww, hh) { return { data: new Uint8ClampedArray(ww * hh * 4), width: ww, height: hh }; }, measureText: () => ({ width: 40 }) };
  const cv = { _id: ++serie, width: w, height: h, style: {}, offsetHeight: 80 };
  Object.defineProperty(cv, '_data', { get: () => data, enumerable: false });
  const ctx = grabar ? new Proxy(base, { get: (t, p) => { const v = t[p]; if (typeof v === 'function') return (...a) => { rec(String(p), a); return v.apply(t, a); }; return p in t ? v : (...a) => { rec(String(p), a); }; }, set: (t, p, v) => { rec('=' + String(p), [v]); t[p] = v; return true; } })
    : new Proxy(base, { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } });
  cv.getContext = () => ctx; return cv;
}
function rec(nombre, args) { llamadas++; hash.update(nombre + '(' + args.map((a) => (a && typeof a === 'object' && a._id ? '#' + a._id : JSON.stringify(a))).join(',') + ')'); }
const els = { game: mk(10, 10, true), ui: mk(10, 10, true), pad: { offsetHeight: 80 }, menu: { hidden: false }, who: { offsetHeight: 20 } };
let tick = null; global.window = global;
global.document = { createElement: () => mk(1, 1), getElementById: (id) => els[id], querySelectorAll: () => [] };
global.__makeCanvas = (w, h) => mk(w, h);
global.addEventListener = noop; global.requestAnimationFrame = (f) => { tick = f; }; global.innerWidth = 390; global.innerHeight = 800; global.devicePixelRatio = 2;
global.setTimeout = () => 0; global.clearTimeout = noop; Date.now = () => 1234567;
{ let a = 20260 >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const orden = require(path.join(root, 'src/orden.json')); orden.datos.concat(orden.juego).forEach((f) => { require(path.join(root, f)); if (f === 'src/clasico2d.js' && !process.argv.includes('--clasico')) window.G.clasico.ACTIVO = false; }); // v2.112: apagado ANTES de cargar game.js (que ya hornea el suelo al arrancar)
const G = window.G; // v2.112: la huella de siempre mide el 2D anterior (= ?clasico=0); con --clasico se mide el 2D clásico (src/clasico2d.js)
G.aparicion.AJUSTES.VISIBLES = true; G.sombrasp.AJUSTES.ACTIVO = false; // v2.100: la huella se mide con las sombras proyectadas apagadas (= ?sombrasp=0): así demuestra que con la capa apagada el juego dibuja exactamente lo de antes
const J = window.__juego; J.S.me = 'oli';
const guion = (n) => (n < 40 ? { right: 1 } : n < 80 ? { down: 1 } : n < 100 ? {} : n < 140 ? { left: 1 } : n < 180 ? { up: 1, right: 1 } : n < 190 ? {} : n < 260 ? { down: 1, left: 1 } : n < 300 ? { right: 1 } : {});
let ts = 1000; tick(ts);
for (let n = 0; n < 360; n++) {
  const g = guion(n); ['up', 'down', 'left', 'right'].forEach((k) => { J.keys[k] = g[k] || 0; });
  if (n === 100 || n === 270) J.talk(); if (n === 190) J.evolve();
  if (n === 200) { J.S.me = 'lali'; } if (n === 230) { J.S.me = 'oli'; }
  ts += 50; tick(ts);
}
const estado = crypto.createHash('sha256').update(JSON.stringify(J.est.jugadores) + JSON.stringify(Object.keys(J.est.mapas).map((id) => J.est.mapas[id].criaturas.map((c) => [c.id, c.x, c.y, c.dir, c.moving, c.tm, c.talk])))).digest('hex').slice(0, 16);
const huella = hash.digest('hex').slice(0, 24) + ' · ' + llamadas + ' llamadas · estado ' + estado;
const fich = path.join(root, process.argv.includes('--clasico') ? 'docs/HUELLA_JUEGO_CLASICO.txt' : 'docs/HUELLA_JUEGO.txt'); // v2.112: cada estilo 2D tiene su línea base
if (process.argv.includes('--escribir')) { fs.writeFileSync(fich, huella + '\n'); console.log('escrito: ' + huella); }
else if (process.argv.includes('--comprobar')) { const esp = fs.existsSync(fich) ? fs.readFileSync(fich, 'utf8').trim() : ''; if (esp !== huella) { console.log('el dibujo o el estado del juego ha cambiado.\n  esperado: ' + esp + '\n  actual:   ' + huella); process.exit(1); } console.log('huella del juego igual: ' + huella); }
else console.log(huella);
