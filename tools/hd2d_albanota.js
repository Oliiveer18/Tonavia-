#!/usr/bin/env node
// hd2d_albanota.js — HD-B1 (primera mitad, v2.63): genera hd2d/albanota_hd2d.html, el TERRENO de Albanota en 3D (Three.js) a partir del mapa REAL.
// El suelo que se ve es el MISMO píxel-art que pinta el 2D: aquí se arranca el juego sin pantalla, se hornea el suelo de Albanota con su propio dibujo de casillas
// (el drawTile de src/game.js, capturado al pasar por G.capas.fondo) y se mete como PNG en hd2d/plantilla_albanota.html. Los datos (casillas y relieve) salen de maps/albanota.json vía G.mundo.
// No toca el juego. Edificios y objetos (segunda mitad de HD-B1) todavía no están.
// Uso:  node tools/hd2d_albanota.js              -> reescribe hd2d/albanota_hd2d.html
//       node tools/hd2d_albanota.js --comprobar  -> no escribe; sale con código 1 si el HTML no coincide con el mapa y el suelo actuales (lo usa test.js)
const path = require('path'), fs = require('fs'), zlib = require('zlib');
const root = path.resolve(__dirname, '..'), noop = () => {};
const hex = (s) => { const m = /^#([0-9a-f]{6})$/i.exec(s); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : [0, 0, 0]; };
function mk(w, h) { // lienzo falso con píxeles; cambia de tamaño al asignar width/height, como uno de verdad
  let W = w || 1, H = h || 1, data = new Uint8ClampedArray(W * H * 4), tx = 0, ty = 0; const st = [], cv = { style: {}, offsetHeight: 80 };
  Object.defineProperty(cv, 'width', { get: () => W, set: (v) => { W = v; data = new Uint8ClampedArray(W * H * 4); } });
  Object.defineProperty(cv, 'height', { get: () => H, set: (v) => { H = v; data = new Uint8ClampedArray(W * H * 4); } });
  const base = { fillStyle: '#000', imageSmoothingEnabled: false, save() { st.push([tx, ty]); }, restore() { [tx, ty] = st.pop() || [0, 0]; }, translate(x, y) { tx += x; ty += y; },
    fillRect(x, y, ww, hh) { const [r, g, b] = hex(this.fillStyle); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i + tx, Y = y + j + ty; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const o = (Y * W + X) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; } },
    getImageData(x, y, ww, hh) { const out = new Uint8ClampedArray(ww * hh * 4); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) { const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const o = (Y * W + X) * 4, p = (j * ww + i) * 4; for (let k = 0; k < 4; k++) out[p + k] = data[o + k]; } return { data: out, width: ww, height: hh }; },
    putImageData(id) { data.set(id.data.subarray(0, data.length)); }, createImageData(ww, hh) { return { data: new Uint8ClampedArray(ww * hh * 4), width: ww, height: hh }; }, measureText: () => ({ width: 40 }) };
  Object.defineProperty(cv, '_data', { get: () => data });
  cv.getContext = () => new Proxy(base, { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } }); return cv;
}
const els = { game: mk(10, 10), ui: mk(10, 10), pad: { offsetHeight: 80 }, menu: { hidden: false }, who: { offsetHeight: 20 } };
global.window = global; global.document = { createElement: () => mk(1, 1), getElementById: (id) => els[id], querySelectorAll: () => [] }; global.__makeCanvas = (w, h) => mk(w, h);
global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800; global.devicePixelRatio = 2; global.setTimeout = () => 0; global.clearTimeout = noop;
const orden = require(path.join(root, 'src/orden.json')), iGame = orden.juego.indexOf('src/game.js');
orden.datos.concat(orden.juego.slice(0, iGame)).forEach((f) => require(path.join(root, f)));
const G = window.G, fondoReal = G.capas.fondo; let dibujaCasilla = null;
if (G.clasico) G.clasico.ACTIVO = false; // v2.112: el terreno del HD-2D sale del suelo del 2D de SIEMPRE (el 2D clásico, src/clasico2d.js, no lo cambia)
G.capas.fondo = (m, d) => { dibujaCasilla = d; return fondoReal(m, d); }; // se captura el drawTile del 2D la primera vez que game.js hornea un suelo
orden.juego.slice(iGame).forEach((f) => require(path.join(root, f)));
if (!dibujaCasilla) throw new Error('No se pudo capturar el dibujo de casillas del 2D (G.capas.fondo no se llamó al arrancar game.js)');
const M = G.mundo.mapa('albanota'); if (!M) throw new Error('El juego no tiene el mapa albanota');
// suelo real y, aparte, el mismo suelo con hierba donde hay bosque de borde («t»): en 3D el bosque es un relieve y sus árboles llegarán con los objetos (2.ª mitad)
const bake = (m) => { const c = fondoReal(m, dibujaCasilla); return { w: c.width, h: c.height, d: Uint8Array.from(c._data) }; };
const real = bake(M), sinArboles = bake(Object.assign({}, M, { suelo: M.suelo.map((r) => r.replace(/t/g, '.')) }));
if (real.w !== M.W * 16 || real.h !== M.H * 16) throw new Error('El suelo horneado no mide lo esperado');
// PNG sin dependencias: la parte «t» del suelo sin árboles se pega sobre una copia del real (dos PNG en el HTML)
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png({ w, h, d }) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(d.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]).toString('base64'); }
const datos = { id: 'albanota', nombre: M.nombre || 'Albanota', W: M.W, H: M.H, suelo: M.suelo, png: png(real), pngSinArboles: png(sinArboles) };
const plantilla = fs.readFileSync(path.join(root, 'hd2d/plantilla_albanota.html'), 'utf8');
if (!plantilla.includes('/*ALBANOTA*/null')) throw new Error('La plantilla no tiene el marcador /*ALBANOTA*/null');
const out = path.join(root, 'hd2d/albanota_hd2d.html'), html = plantilla.replace('/*ALBANOTA*/null', () => JSON.stringify(datos).replace(/</g, '\\u003c'));
if (process.argv.includes('--comprobar')) { const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : ''; if (cur !== html) { console.log('hd2d/albanota_hd2d.html no coincide con maps/albanota.json y el suelo del juego: ejecuta node tools/hd2d_albanota.js'); process.exit(1); } console.log('hd2d/albanota_hd2d.html al día'); }
else { fs.writeFileSync(out, html); console.log('hd2d/albanota_hd2d.html escrito (' + M.W + '×' + M.H + ' casillas, ' + Math.round(html.length / 1024) + ' KB)'); }
