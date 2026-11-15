// medir_impactos.js — mide, en el prototipo de efectos, el instante (s) en que cada movimiento con daño golpea de verdad (la «parada de impacto» de su escena) y lo escribe en
// src/combate_datos.js (línea `const IMPACTO = {...};`). El motor retrasa el daño hasta ese instante, así que el número sale justo cuando el efecto impacta. Repetir si cambia algún efecto.
const fs = require('fs'), path = require('path'); global.window = global; global.G = {};
require('../src/combate_fx_pro.js'); require('../src/combate_datos.js'); const F = G.fxPro, D = G.COMBATE_DATOS, S = F.STEP, out = {};
const sp = { w: 16, h: 16, data: new Uint32Array(256) };
for (const id of F.ids) {
  if (!(D.MOV[id].pot > 0)) continue;
  const i = F.crear(id, { semilla: 5, from: { x: 20, w: 16, h: 16 }, to: { x: 82, w: 16, h: 16 }, sprites: { caster: sp, target: sp } }); let t = 0, fz = 0, hit = null, sh = null;
  for (let n = 0; n < 720 && hit === null; n++) { if (fz > 0) { fz -= S; continue; } i.update(S); t += S; if (i.stop > 0 && hit === null) hit = t; if (sh === null && i.shake > 2) sh = t; }
  out[id] = Math.round((hit !== null ? hit : sh !== null ? sh : 0.9) * 100) / 100;
}
const f = path.join(__dirname, '..', 'src', 'combate_datos.js'); let s = fs.readFileSync(f, 'utf8'); const lin = '  const IMPACTO = ' + JSON.stringify(out) + ';';
s = /\n  const IMPACTO = .*;/.test(s) ? s.replace(/\n  const IMPACTO = .*;/, '\n' + lin) : s.replace(/\n(  const CAL = )/, '\n' + lin + '\n$1');
fs.writeFileSync(f, s); console.log(Object.keys(out).length, 'impactos escritos');
