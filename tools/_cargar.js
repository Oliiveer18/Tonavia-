// _cargar.js — carga el juego en node con un lienzo falso (lo mismo que test.js) para las herramientas de una línea. Uso: const G = require('./_cargar.js')(); (sin game.js ni interfaz)
module.exports = function (conJuego) {
  const noop = () => {}, mk = () => { const base = { getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), measureText: () => ({ width: 40 }) }; const ctx = new Proxy(base, { get: (t, p) => (p in t ? t[p] : noop), set: () => true }); return { width: 0, height: 0, getContext: () => ctx, style: {}, offsetHeight: 80 }; };
  const els = { game: mk(), ui: mk(), pad: mk(), menu: { hidden: false }, who: {} };
  global.window = global; global.document = { createElement: mk, getElementById: (id) => els[id], querySelectorAll: () => [] };
  global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800;
  const orden = require('../src/orden.json'), fuera = /_ui\.js$|game\.js$|cueva2d\.js$|red_peer\.js$|hd2d_pintor\.js$|galeria\.js$/;
  orden.datos.concat(orden.juego).forEach((f) => { if (conJuego || !fuera.test(f)) require('../' + f); });
  return global.G;
};
