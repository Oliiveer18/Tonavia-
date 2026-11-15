// tools/volumenes.js — mide los volúmenes 3D de los edificios (v2.67, paso B 1.ª mitad). Uso: node tools/volumenes.js [--detalle]
// Para cada pieza con `vol`: casillas sólidas, nicho, paredes, polígonos, triángulos (presupuesto 2.000) y alto total; y comprueba que el volumen = la colisión del motor.
const noop = () => {}, mk = () => { const base = { getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), measureText: () => ({ width: 40 }) }; const ctx = new Proxy(base, { get: (t, p) => (p in t ? t[p] : noop), set: () => true }); return { width: 0, height: 0, getContext: () => ctx, style: {}, offsetHeight: 80 }; };
const els = { game: mk(), ui: mk(), pad: mk(), menu: { hidden: false }, who: {} };
global.window = global; global.document = { createElement: mk, getElementById: (id) => els[id], querySelectorAll: () => [] }; global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800; global.setTimeout = () => 0; global.clearTimeout = noop;
const orden = require('../src/orden.json'); orden.datos.concat(orden.juego.filter((f) => f !== 'src/game.js')).forEach((f) => require('../' + f));
const G = window.G, V = G.volumenes, detalle = process.argv.includes('--detalle'); let mal = 0;
Object.keys(G.OBJETOS).filter((t) => G.OBJETOS[t].vol).forEach((t) => {
  const d = G.OBJETOS[t], g = V.geometria(d.huella, d.vol), cuenta = {}; g.poligonos.forEach((p) => { cuenta[p.parte] = (cuenta[p.parte] || 0) + 1; });
  const motor = [...G.capas.bloqueos({ objetos: [{ tipo: t, x: 0, y: 0 }] }, 40, 40)].sort().join(' '), igual = motor === [...g.huella].sort().join(' '), pasa = g.triangulos <= V.MAX_TRIANGULOS;
  if (!igual || !pasa) mal++;
  console.log(t.padEnd(10), g.rect.w + '×' + g.rect.d, 'casillas ' + g.huella.size, 'alto ' + g.altoTotal.toFixed(1) + ' u', 'polígonos ' + g.poligonos.length, 'triángulos ' + g.triangulos + '/' + V.MAX_TRIANGULOS, igual ? 'volumen = colisión' : 'NO COINCIDE CON LA COLISIÓN', pasa ? '' : 'SE PASA DEL PRESUPUESTO');
  if (detalle) console.log('   ', JSON.stringify(cuenta));
});
process.exit(mal ? 1 : 0);
