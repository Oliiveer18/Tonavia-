// generar_fx_pro.js — construye src/combate_fx_pro.js a partir del prototipo de efectos (tools/prototipo_fx: nucleo.js + moves*.js), SIN cambiarlo.
// Uso: node tools/generar_fx_pro.js     (repetir si se toca el prototipo)
const fs = require('fs'), path = require('path'), d = path.join(__dirname, 'prototipo_fx');
const src = ['nucleo', 'moves', 'moves2', 'moves3', 'moves4', 'moves5', 'moves6', 'moves7', 'moves8'].map((f) => fs.readFileSync(path.join(d, f + '.js'), 'utf8')).join('\n');
const out = `// combate_fx_pro.js — GENERADO por tools/generar_fx_pro.js desde tools/prototipo_fx (no editar a mano). Los 56 efectos de movimiento diseñados (núcleo de píxeles determinista: sin Math.random ni relojes).
// G.fxPro = { W, H, GY, tiene(id), crear(id, { semilla, from:{x,w,h}, to:{x,w,h}, sprites }) → instancia { update(dt), draw(p, capa), actor(rol), stop, shake, dur, timeNow() }, Painter, Rng, STEP }
// Escena de 128×80 px (1 px = 1 px del juego); el lanzador va a la izquierda y el objetivo a la derecha (el pintor refleja la escena cuando lanza el bando derecho).
(function (__root) {
${src}
  const __porId = {}; MOVES.forEach((m) => { __porId[m.id] = m; });
  __root.G.fxPro = { W, H, GY, STEP: 1 / 120, Painter, Rng, ids: MOVES.map((m) => m.id), tiene: (id) => !!__porId[id], crear(id, o) { const m = __porId[id]; return m.make({ R: new Rng(o.semilla >>> 0), from: { x: o.from.x, y: GY, w: o.from.w, h: o.from.h }, to: { x: o.to.x, y: GY, w: o.to.w, h: o.to.h }, sprites: o.sprites }); } };
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'combate_fx_pro.js'), out); console.log('src/combate_fx_pro.js', out.length, 'bytes');
