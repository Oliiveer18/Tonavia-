// calibrar_combate.js — CALIBRADOR del equilibrio de combate. Uso (desde la carpeta del proyecto):  node tools/calibrar_combate.js [--n 60] [--rondas 8] [--escribir]
// Dos pasos que se repiten hasta que dejan de moverse:
//  1) DENTRO de cada elemento, las variantes de un mismo hueco valen lo mismo: duelos espejo de la plantilla Rara f2 con un solo hueco distinto. Habilidad y especial se igualan por potencia (CAL[id][0]);
//     defensa y apoyo, por intensidad de su efecto (CAL[id][1]), de modo que cada uno aporte el mismo margen (OBJ) a su elemento.
//  2) ENTRE elementos, los 7 emparejamientos NEUTROS (sin ventaja de tipo) quedan al 50 %: coeficiente de daño AJUSTE por elemento (mínimos cuadrados sobre el ciclo de neutros), medido en Común f1 y en Rara f2.
// Reproducible (mismas semillas → mismos números). Con --escribir guarda CAL y AJUSTE en src/combate_datos.js.
const fs = require('fs'), path = require('path'), root = path.resolve(__dirname, '..'), args = process.argv.slice(2);
const SOLO = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null; // --solo epica: solo reajusta el coeficiente de ese nivel (no toca CAL ni KGPOT)
const arg = (k, d) => (args.includes(k) ? +args[args.indexOf(k) + 1] : d), N = arg('--n', 60), RONDAS = arg('--rondas', 8);
global.window = global; const noop = () => {}; window.G = { PAL: new Proxy({}, { get: () => '#000' }) };
global.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: () => noop, set: () => true }) }) };
['src/lineas.js', 'src/creatures.js', 'src/combate_datos.js', 'src/combate.js'].forEach((f) => require(path.join(root, f)));
const G = window.G, C = G.combate, D = G.COMBATE_DATOS, EL = Object.keys(D.PLANTILLAS), MOV = D.MOV, AJT = D.AJUSTE, OBJ = 0.1;
let N0 = 0; const CAL = {}, cal = (id) => (CAL[id] = CAL[id] || [1, 1]), base = {}; Object.keys(MOV).forEach((k) => { base[k] = MOV[k].pot; });
const aplica = (id) => { MOV[id].pot = base[id] * cal(id)[0]; MOV[id].k = cal(id)[1]; };
const lim = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const por = (el, hu) => Object.keys(MOV).filter((k) => MOV[k].el === el && MOV[k].hueco === hu);
const NIV = { comun: ['comun', 1, 3], rara: ['rara', 2, 5], epica: ['epica', 3, 8] };
const U = (id, el, niv, kit) => ({ id, el, rar: NIV[niv][0], fase: NIV[niv][1], kg: NIV[niv][2], kit });
function margen(sa, sb) { let t = 0; for (let s = 1; s <= N; s++) { const f = s % 2, c = C.nuevo(s * 7919, f ? [[sb], [sa]] : [[sa], [sb]]); while (!c.fin) C.paso(c); const a = c.u[f ? 1 : 0], b = c.u[f ? 0 : 1]; t += a.hp / a.hpMax - b.hp / b.hpMax; } return t / N; }
// Rara f2: el kit lleva defensa O apoyo según el id; se promedian las 4 combinaciones para no depender del azar del id
const kitR = (el, x) => { const [b0, b1] = por(el, 'b'), [h0] = por(el, 'h'), [e0] = por(el, 'e'); return [b0, h0, e0, b1, por(el, x)[0]]; };
function margenRara(a, b) { let t = 0; ['d', 'a'].forEach((xa) => ['d', 'a'].forEach((xb) => { t += margen(U('p_' + a, a, 'rara', kitR(a, xa)), U('q_' + b, b, 'rara', kitR(b, xb))); })); return t / 4; }
const KGS = D.KGPOT; const kgM = (el, kg, niv) => { let t = 0; const k = C.kitDe(el, NIV[niv][0], 'fijo'); const u = (id, w) => ({ id, el, rar: NIV[niv][0], fase: NIV[niv][1], kg: w, kit: k }); return margen(u('x_' + el, kg), u('y_' + el, 3)); };
const neutros = []; EL.forEach((a, i) => EL.slice(i + 1).forEach((b) => { if (G.elementEffect(a, b) === 1) neutros.push([a, b]); }));
for (let ronda = 0; ronda < RONDAS; ronda++) {
  const lr = 1 / (1 + ronda * 0.35), maxv = { v: 0 };
  if (!SOLO) KGS.forEach((q, i) => { if (q[0] === 3) return; const m = EL.reduce((t, e) => t + 0.5 * (kgM(e, q[0], 'comun') + kgM(e, q[0], 'rara')), 0) / EL.length; q[1] = lim(q[1] * Math.exp(-0.8 * lr * m), 0.5, 1.8); maxv.k = Math.max(maxv.k || 0, Math.abs(m)); });
  if (!SOLO) EL.forEach((el) => {
    const [b0, b1] = por(el, 'b'), [h0, h1] = por(el, 'h'), [e0, e1] = por(el, 'e'), [d] = por(el, 'd'), [a] = por(el, 'a'), ref = [b0, h0, e0, b1];
    for (let it = 0; it < 3; it++) {
      [[h0, h1, (x) => [b0, x, e0, b1]], [e0, e1, (x) => [b0, h0, x, b1]]].forEach(([v0, v1, mk]) => {
        const m = margen(U('x_' + el, el, 'rara', mk(v1)), U('y_' + el, el, 'rara', ref)); maxv.v = Math.max(maxv.v, Math.abs(m));
        cal(v1)[0] = lim(cal(v1)[0] * Math.exp(-0.6 * lr * m), 0.35, 2.2); cal(v0)[0] = lim(cal(v0)[0] * Math.exp(0.6 * lr * m), 0.35, 2.2); aplica(v1); aplica(v0);
      });
      [d, a].forEach((x) => { const m = margen(U('x_' + el, el, 'rara', ref.concat(x)), U('y_' + el, el, 'rara', ref)); maxv.v = Math.max(maxv.v, Math.abs(m - OBJ)); cal(x)[1] = lim(cal(x)[1] * Math.exp(-1.2 * lr * (m - OBJ)), 0.15, 2.5); aplica(x); });
    }
  });
  let peor = 0;
  ['comun', 'rara', 'epica'].filter((t) => !SOLO || t === SOLO).forEach((tier) => {
    const AJ = AJT[tier];
    for (let it = 0; it < 12; it++) {
      const g = {}; EL.forEach((e) => { g[e] = 0; });
      neutros.forEach(([a, b]) => { const m = tier === 'rara' ? margenRara(a, b) : margen(U('p_' + a, a, tier), U('q_' + b, b, tier)); g[a] += m; g[b] -= m; peor = Math.max(peor, Math.abs(m)); });
      EL.forEach((e) => { AJ[e] = lim(AJ[e] * Math.exp(-0.2 * lr * g[e]), 0.4, 2.5); }); const nrm = Math.exp(EL.reduce((s, e) => s + Math.log(AJ[e]), 0) / EL.length); EL.forEach((e) => { AJ[e] /= nrm; });
    }
  });
  console.log('ronda ' + (ronda + 1) + ': desvío por peso ' + (maxv.k || 0).toFixed(2) + ' · desvío máx. de variantes ' + maxv.v.toFixed(2) + ' · peor neutro ' + peor.toFixed(2) + ' · AJUSTE común ' + EL.map((e) => e.slice(0, 3) + ' ' + AJT.comun[e].toFixed(2)).join(' ') + ' | rara ' + EL.map((e) => AJT.rara[e].toFixed(2)).join(' '));
}
const kgl = KGS.map((q) => [q[0], Math.round(q[1] * 1000) / 1000]);
const lit = {}; Object.keys(CAL).forEach((k) => { const v = [Math.round(CAL[k][0] * 1000) / 1000, Math.round(CAL[k][1] * 1000) / 1000]; if (v[0] !== 1 || v[1] !== 1) lit[k] = v; });
const ajl = {}; Object.keys(AJT).forEach((t) => { ajl[t] = {}; EL.forEach((e) => { ajl[t][e] = Math.round(AJT[t][e] * 1000) / 1000; }); });
if (args.includes('--escribir')) {
  const f = path.join(root, 'src/combate_datos.js'); let s = fs.readFileSync(f, 'utf8');
  if (!SOLO) s = s.replace(/const CAL = \{[^\n]*\};/, 'const CAL = ' + JSON.stringify(lit) + ';'); s = s.replace(/const AJUSTE = \{[^\n]*\};/, 'const AJUSTE = ' + JSON.stringify(ajl) + ';'); if (!SOLO) s = s.replace(/const KGPOT = \[[^\n]*\];/, 'const KGPOT = ' + JSON.stringify(kgl) + ';'); fs.writeFileSync(f, s); console.log('escrito en src/combate_datos.js');
} else console.log('KGPOT = ' + JSON.stringify(kgl) + '\nCAL = ' + JSON.stringify(lit) + '\nAJUSTE = ' + JSON.stringify(ajl));
