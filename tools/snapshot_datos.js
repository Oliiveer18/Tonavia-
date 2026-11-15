// snapshot_datos.js — instantánea de los DATOS del juego (paso 1.1). Sirve para demostrar que una refactorización no cambia nada.
// Uso:  node tools/snapshot_datos.js                -> imprime el hash (sha256) de la instantánea
//       node tools/snapshot_datos.js --guardar f.json -> además guarda el JSON completo (para comparar con diff)
// Incluye: G.CREATURES sin la función draw (ordenado por id), G.PHASES_PLAN, G.LINE_PLAN, G.TRAITS, G.traits(id) y tamaño y peso por fase. Desde la v2.17 (paso 1.3b) ya no incluye SPAWN: dónde aparecen las criaturas lo deciden las zonas de maps/.
// No necesita navegador.
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const noop = () => {}, mk = () => { const base = { getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), measureText: () => ({ width: 40 }) }; const ctx = new Proxy(base, { get: (t, p) => (p in t ? t[p] : noop), set: () => true }); return { width: 0, height: 0, getContext: () => ctx, style: {}, offsetHeight: 80 }; };
global.window = global; global.document = { createElement: mk, getElementById: () => mk(), querySelectorAll: () => [] };
global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800; global.setTimeout = () => 0; global.clearTimeout = noop;
require(path.join(root, 'src/orden.json')).datos.forEach((f) => require(path.join(root, f))); // lista única: src/orden.json
const G = window.G;
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
const ids = Object.keys(G.CREATURES).sort(); // ordenado por id: el orden de G.CREATURES no es un dato (desde el 1.2 sale del orden del registro)
const snap = {
  ids,
  criaturas: Object.fromEntries(ids.map((id) => { const d = Object.assign({}, G.CREATURES[id]); delete d.draw; return [id, canon(d)]; })),
  PHASES_PLAN: canon(G.PHASES_PLAN), LINE_PLAN: canon(G.LINE_PLAN), TRAITS: canon(G.TRAITS),
  traits: Object.fromEntries(ids.map((id) => [id, canon(G.traits(id))])),
  tamanos: Object.fromEntries(ids.map((id) => [id, [G.stageSize(id, G.CREATURES[id].stage), G.stageWeight(id, G.CREATURES[id].stage)]])),
};
const json = JSON.stringify(snap, null, 1), hash = crypto.createHash('sha256').update(json).digest('hex');
const i = process.argv.indexOf('--guardar'); if (i > 0) fs.writeFileSync(process.argv[i + 1], json);
console.log(hash, '·', ids.length, 'formas ·', Object.keys(G.LINE_PLAN).length, 'líneas');
