// validar_puzles.js — RESOLUTOR: cada puzle (y sus 4 espejos) tiene solución con dos jugadores y NO la tiene con uno solo. Uso: node tools/validar_puzles.js [--detalle]
// Salida de UNA línea: «OK …» o «FALLA: motivo». Con --detalle, una línea por puzle con los pasos mínimos.
const G = require('./_cargar.js')(), P = G.profundidades, det = process.argv.includes('--detalle'); let n = 0, min = 1e9, max = 0;
for (const s of P.D.salas.filter((q) => q.tipo === 'puzle')) for (const [h, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
  const r = P.comprobarPuzle(s.id, !!h, !!v); if (!r.ok) { console.log('FALLA: puzle «' + s.id + '»' + (h || v ? ' (espejo ' + (h ? 'H' : '') + (v ? 'V' : '') + ')' : '') + ': ' + r.motivo); process.exit(1); }
  if (!h && !v) { n++; min = Math.min(min, r.pasos); max = Math.max(max, r.pasos); if (det) console.log(s.id + ' · dif ' + s.dif + ' · ' + r.pasos + ' pasos'); }
}
console.log('OK ' + n + ' puzles × 4 espejos: todos tienen solución y exigen a los dos jugadores (de ' + min + ' a ' + max + ' pasos)');
