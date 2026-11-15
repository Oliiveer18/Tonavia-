// validar_salas.js — comprueba la forma de TODAS las salas prefabricadas y de los datos de las Profundidades (datos/profundidades.json). Uso: node tools/validar_salas.js [--ver <id>]
// Salida de UNA línea: «OK …» o «FALLA: motivo». Con --ver <id> dibuja además la sala en texto.
const G = require('./_cargar.js')(), P = G.profundidades, D = P.D, e = [];
D.salas.forEach((s) => P.validarSala(s).forEach((t) => e.push(t)));
const ids = {}; D.salas.forEach((s) => { if (ids[s.id]) e.push('sala repetida: ' + s.id); ids[s.id] = 1; });
D.pisosEspeciales.forEach((x) => { if (!ids[x.sala]) e.push('piso especial «' + x.id + '»: no existe la sala «' + x.sala + '»'); if (!(x.peso > 0)) e.push('piso especial «' + x.id + '»: peso debe ser > 0'); });
['arena_jefe', 'refugio', 'campamento'].forEach((id) => { if (!ids[id]) e.push('falta la sala obligatoria «' + id + '»'); });
P.BIOMAS.forEach((b) => { const B = D.biomas[b]; ['fondo', 'roca', 'roca2', 'cara', 'suelo', 'suelo2', 'borde', 'acento', 'acento2', 'luz', 'niebla'].forEach((c) => { if (!/^#[0-9a-f]{6}$/i.test((B.paleta || {})[c] || '')) e.push('bioma «' + b + '»: falta el color «' + c + '» (#rrggbb)'); });
  if (!B.nombre || !Array.isArray(B.elementos) || !B.elementos.every((x) => G.ELEMENTS[x])) e.push('bioma «' + b + '»: nombre o elementos inválidos'); if (!B.luz || !(B.luz.radio > 0) || !(B.luz.oscuridad >= 0 && B.luz.oscuridad < 1)) e.push('bioma «' + b + '»: luz inválida');
  if (!Array.isArray(B.deco) || !B.deco.length) e.push('bioma «' + b + '»: falta deco'); if (B.mecanica && ['revela', 'oscuridad', 'esporas', 'charcos', 'hielo'].indexOf(B.mecanica.tipo) < 0) e.push('bioma «' + b + '»: mecánica desconocida «' + B.mecanica.tipo + '»');
  try { G.audio.TEMAS['_p'] = B.musica; delete G.audio.TEMAS['_p']; const m = G.audio.parsear(B.musica.mel); if (m.total !== G.audio.BEATS) e.push('bioma «' + b + '»: la música dura ' + m.total + ' pulsos (deben ser ' + G.audio.BEATS + ')'); } catch (x) { e.push('bioma «' + b + '»: música inválida (' + x.message + ')'); } });
D.modificadores.forEach((m) => { if (!m.id || ['bendicion', 'maldicion'].indexOf(m.tipo) < 0 || !m.nombre || !m.desc || !m.efecto) e.push('modificador incompleto: ' + (m.id || '?')); });
['comun', 'rara', 'epica'].forEach((r) => { const c = D.cofres[r]; if (!c || !Array.isArray(c.brillos) || !Array.isArray(c.objetos)) { e.push('cofre «' + r + '» incompleto'); return; } c.objetos.forEach((o) => { if (o[0] !== null && o[0] !== 'huevo' && !G.tienda.OBJ[o[0]]) e.push('cofre «' + r + '»: objeto desconocido «' + o[0] + '»'); }); });
const ver = process.argv.indexOf('--ver'); if (ver > 0 && P.SALAS[process.argv[ver + 1]]) console.log(P.SALAS[process.argv[ver + 1]].filas.join('\n'));
if (e.length) { console.log('FALLA: ' + e[0] + (e.length > 1 ? ' (+' + (e.length - 1) + ' más)' : '')); process.exit(1); }
console.log('OK ' + D.salas.length + ' salas (' + D.salas.filter((s) => s.tipo === 'puzle').length + ' puzles) · ' + P.BIOMAS.length + ' biomas · ' + D.pisosEspeciales.length + ' pisos especiales · ' + D.modificadores.length + ' modificadores');
