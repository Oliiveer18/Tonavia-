// agentes_diag.js — DIAGNÓSTICO de los entrenadores autónomos (v2.324). Simula sin gráficos y enseña qué pasó. Uso (desde la carpeta del proyecto):
//   node tools/agentes_diag.js                      → UNA línea: «OK …» o «FALLA: motivo» (determinismo, guardado a medias, invariantes, rendimiento)
//   node tools/agentes_diag.js --resumen [--n 24] [--min 30] [--semilla 7]   → resumen de la población tras simular
//   node tools/agentes_diag.js --cronica 40         → últimos sucesos del mundo     ·   --ficha a3 (o un nombre) → biografía de un entrenador
//   node tools/agentes_diag.js --rendimiento        → tabla de coste con población creciente
const G = require('./_cargar.js')(), A = G.agentes, arg = process.argv.slice(2), val = (k, d) => (arg.includes(k) ? arg[arg.indexOf(k) + 1] : d);
if (arg.includes('--ayuda')) { console.log(require('fs').readFileSync(__filename, 'utf8').split('\n').slice(0, 6).join('\n')); process.exit(0); }
const N = +val('--n', A.cfg.POBLACION), MIN = +val('--min', 30), SEM = +val('--semilla', 7);
const mundo = (sem, n) => ({ semilla: sem, agentes: A.crear(sem, n), avisos: [], jugadores: {} });
const correr = (est, s) => { for (let i = 0; i < s; i++) A.avanzar(est, 1); };
const ms = (f) => { const t = process.hrtime.bigint(); f(); return Number(process.hrtime.bigint() - t) / 1e6; };
function invariantes(est) {   // nada imposible en el estado
  const w = A.W(), e = []; est.agentes.pob.forEach((a) => { if (!w.nodos[a.lug]) e.push(a.id + ' lugar'); if (!(a.brillos >= 0) || !Number.isInteger(a.brillos)) e.push(a.id + ' brillos'); if (a.esferas < 0) e.push(a.id + ' esferas'); if (!a.equipo.length || a.equipo.length > 6 || new Set(a.equipo).size !== a.equipo.length) e.push(a.id + ' equipo');
    a.equipo.forEach((f) => { if (!a.pos[f]) e.push(a.id + ' equipo sin poseer'); if (A.hp(a, f) < 0) e.push(a.id + ' vida'); }); if (a.mem.length > A.AJ.memoria) e.push(a.id + ' memoria'); if (Object.keys(a.rel).length > A.AJ.relaciones) e.push(a.id + ' relaciones');
    if (a.sig === null && !(a.paso && a.paso.bat)) e.push(a.id + ' dormido sin combate'); });
  const enBat = new Set(); est.agentes.bat.forEach((b) => [b.a, b.b].forEach((i) => { if (i >= 0) { if (enBat.has(i)) e.push('a' + i + ' en dos combates'); enBat.add(i); } }));
  return e;
}
if (arg.includes('--rendimiento')) {
  console.log('población · ms por segundo simulado · ms por cuadro (60/s) · sucesos/s · KB guardado');
  [25, 100, 400, 1600].forEach((n) => { const est = mundo(SEM, n); correr(est, 120); const s0 = est.agentes.cont.planes | 0, t = ms(() => correr(est, 600)); console.log([n, (t / 600).toFixed(3), (t / 600 / 60).toFixed(4), (((est.agentes.cont.planes | 0) - s0) / 600).toFixed(1), Math.round(JSON.stringify(A.serializar(est)).length / 1024)].join(' · ')); });
  process.exit(0);
}
const est = mundo(SEM, N), t = ms(() => correr(est, MIN * 60));
if (arg.includes('--resumen')) { console.log(JSON.stringify(A.resumen(est), null, 1)); console.log('simulado en', t.toFixed(0), 'ms'); process.exit(0); }
if (arg.includes('--cronica')) { console.log(A.cronica(est, +val('--cronica', 30) || 30).join('\n')); process.exit(0); }
if (arg.includes('--ficha')) { const id = val('--ficha', 'a0'); console.log(JSON.stringify(A.ficha(est, /^\d+$/.test(id) ? +id : id), null, 1)); process.exit(0); }
// por defecto: comprobación de una línea
const fallos = [], b = mundo(SEM, N); correr(b, MIN * 60); if (A.hash(b) !== A.hash(est)) fallos.push('no es determinista');
{ const c = mundo(SEM, N); correr(c, MIN * 30); const d = { semilla: SEM, avisos: [], jugadores: {} }; if (!A.restaurar(d, JSON.parse(JSON.stringify(A.serializar(c))))) fallos.push('no restaura'); else { correr(d, MIN * 30); if (A.hash(d) !== A.hash(est)) fallos.push('guardar y cargar a medias cambia el resultado'); } }
invariantes(est).slice(0, 3).forEach((e) => fallos.push(e));
const r = A.resumen(est), porCuadro = t / (MIN * 60) / 60; if (porCuadro > 0.5) fallos.push('lento: ' + porCuadro.toFixed(3) + ' ms/cuadro');
console.log(fallos.length ? 'FALLA: ' + fallos.join('; ') : 'OK agentes: ' + N + ' entrenadores, ' + MIN + ' min · nivel medio ' + r.nivelMedio + ' · ' + (r.sucesos.duelo | 0) + ' duelos, ' + (r.sucesos.captura | 0) + ' capturas, ' + (r.sucesos.hito | 0) + ' hitos · ' + porCuadro.toFixed(4) + ' ms/cuadro · huella ' + A.hash(est));
process.exit(fallos.length ? 1 : 0);
