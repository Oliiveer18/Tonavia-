// agentes_rutina_diag.js — v2.329: simula N días de juego (10 min reales cada uno) y cuenta, por franja horaria, qué objetivo lleva cada entrenador. Uso: node tools/agentes_rutina_diag.js [--dias 2] [--semilla 7]
const G = require('./_cargar.js')(), A = G.agentes, arg = process.argv.slice(2), val = (k, d) => (arg.includes(k) ? arg[arg.indexOf(k) + 1] : d);
const DIAS = +val('--dias', 2), SEM = +val('--semilla', 7), DT = 0.25, est = { semilla: SEM, agentes: A.crear(SEM, A.cfg.POBLACION), avisos: [], jugadores: {}, reloj: 0 };
const cuenta = {}, fr = (h) => (h >= 5 && h < 9 ? 'amanecer' : h >= 9 && h < 17 ? 'dia' : h >= 17 && h < 21 ? 'tarde' : 'noche'); let muestras = 0;
for (let s = 0; s < DIAS * G.ciclo.AJUSTES.DIA_S / DT; s++) {
  A.avanzar(est, DT); est.reloj += DT;
  if (s % 20 === 0) { const f = fr(G.ciclo.hora(est.reloj)), c = cuenta[f] = cuenta[f] || {}; est.agentes.pob.forEach((a) => { const k = a.obj ? a.obj.t : 'nada'; c[k] = (c[k] || 0) + 1; }); muestras++; }
}
Object.keys(cuenta).forEach((f) => { const c = cuenta[f], tot = Object.values(c).reduce((x, y) => x + y, 0); console.log(f.padEnd(9), Object.keys(c).sort((x, y) => c[y] - c[x]).map((k) => k + ' ' + Math.round(100 * c[k] / tot) + '%').join(' · ')); });
// v2.331: de noche, ¿cuántos están DENTRO de un edificio (durmiendo en el Centro PC)?
{ const A2 = G.agentes; let n = 0, d = 0; const e2 = { semilla: SEM, agentes: A2.crear(SEM, A2.cfg.POBLACION), avisos: [], jugadores: {}, reloj: 0 };
  for (let s = 0; s < DIAS * G.ciclo.AJUSTES.DIA_S / DT; s++) { A2.avanzar(e2, DT); e2.reloj += DT; const h = G.ciclo.hora(e2.reloj); if (s % 20 === 0 && (h >= 23 || h < 4)) { e2.agentes.pob.forEach((a) => { n++; if (a.paso && a.paso.dentro) d++; }); } }
  console.log('de noche (23-4 h) dentro de un edificio:', Math.round(100 * d / n) + '%'); }
