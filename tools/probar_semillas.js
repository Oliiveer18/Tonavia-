// probar_semillas.js — banco de semillas de las Profundidades. Uso: node tools/probar_semillas.js [n=2000] [--detalle]
// Genera n pisos (5 biomas × pisos 1-30 × semillas) y comprueba: transitable al 100 %, bajada alcanzable, sin objetos aislados, puzles con solución que exige a los dos, mismo resultado al repetir.
// Salida de UNA línea: «OK …métricas» o «FALLA: motivo».
const G = require('./_cargar.js')(), P = G.profundidades, n = Math.max(1, parseInt(process.argv[2], 10) || 2000), detalle = process.argv.includes('--detalle');
let fallo = null, largo = 0, seg = 0, maxInt = 0, rectos = 0, reint = 0, tMax = 0, tSum = 0, minSeg = 1e9, maxSeg = 0; const firmas = new Set(), tipos = {}, porBioma = {}, puz = {};
try {
  for (let s = 0; s < n && !fallo; s++) {
    const bioma0 = P.BIOMAS[s % P.BIOMAS.length], piso = 1 + (s * 7) % 30, sem = P.hash('banco|' + s), id = P.idMapa(bioma0, sem, piso);
    const t0 = process.hrtime.bigint(), j = P.generar(id), ms = Number(process.hrtime.bigint() - t0) / 1e6; tSum += ms; if (ms > tMax) tMax = ms;
    const e = P.verificar(j); if (e.length) { fallo = id + ': ' + e[0]; break; }
    if (!j.prof.salida) { fallo = id + ': sin escalera de bajada'; break; }
    for (const sa of j.prof.salas) if (sa.tipo === 'puzle') { const r = P.comprobarPuzle(sa.id, sa.fh, sa.fv); if (!r.ok) { fallo = id + ': puzle ' + sa.id + ' ' + r.motivo; break; } puz[sa.id] = (puz[sa.id] || 0) + 1; }
    const m = P.medir(j); if (!(m.largo > 0)) { fallo = id + ': recorrido de longitud 0'; break; }
    largo += m.largo; seg += m.segundos; minSeg = Math.min(minSeg, m.segundos); maxSeg = Math.max(maxSeg, m.segundos); firmas.add(m.firma); tipos[j.prof.tipo] = (tipos[j.prof.tipo] || 0) + 1; porBioma[j.prof.bioma] = (porBioma[j.prof.bioma] || 0) + 1;
    if (j.prof.intento > maxInt) maxInt = j.prof.intento; if (j.prof.intento >= 30) rectos++; if (j.prof.intento > 0) reint++;
    if (s % 97 === 0) { const a = JSON.stringify(j); const mod = require.cache[require.resolve('../src/profundidades.js')]; delete require.cache[require.resolve('../src/profundidades.js')]; const G0 = global.G.profundidades; require('../src/profundidades.js'); const b = JSON.stringify(global.G.profundidades.generar(id)); global.G.profundidades = G0; if (a !== b) { fallo = id + ': dos generaciones distintas (no determinista)'; break; } }
  }
} catch (e) { fallo = e.message; }
if (fallo) { console.log('FALLA: ' + fallo); process.exit(1); }
console.log('OK ' + n + ' pisos · variedad ' + Math.round(100 * firmas.size / n) + ' % · recorrido medio ' + Math.round(largo / n) + ' casillas · tiempo estimado medio ' + Math.round(seg / n) + ' s (mín ' + minSeg + ', máx ' + maxSeg + ') · reintentos ' + Math.round(100 * reint / n) + ' % (máx ' + maxInt + ') · pisos de emergencia ' + rectos + ' · generación ' + (tSum / n).toFixed(1) + ' ms/piso (máx ' + tMax.toFixed(0) + ')');
if (detalle) console.log(JSON.stringify({ tipos, porBioma, puzles: puz }));
