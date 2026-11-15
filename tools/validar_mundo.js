// validar_mundo.js — valida el plan del mundo (datos/mundo.json): ids, conexiones recíprocas, tamaños, alcanzabilidad, biomas de cueva y mapas ya hechos. Salida de UNA línea: «OK …» o «FALLA: motivo».
const fs = require('fs'), path = require('path'), raiz = path.join(__dirname, '..');
const W = JSON.parse(fs.readFileSync(path.join(raiz, 'datos/mundo.json'), 'utf8')), P = JSON.parse(fs.readFileSync(path.join(raiz, 'datos/profundidades.json'), 'utf8'));
const e = [], por = {}, opuesto = { norte: 'sur', sur: 'norte', este: 'oeste', oeste: 'este' };
W.mapas.forEach((m) => { if (por[m.id]) e.push('id repetido: ' + m.id); por[m.id] = m; });
const T = W.tamanos;
W.mapas.forEach((m) => {
  if (!W.regiones[m.region]) e.push(m.id + ': región desconocida ' + m.region);
  const ok = m.tipo === 'interior' ? m.ancho >= 8 && m.alto >= 6 : m.tipo === 'ruta' ? [T.ruta_h, T.ruta_v].some((t) => t[0] === m.ancho && t[1] === m.alto) : T[m.tipo] && T[m.tipo][0] === m.ancho && T[m.tipo][1] === m.alto;
  if (!ok) e.push(m.id + ': tamaño ' + m.ancho + '×' + m.alto + ' no es el de su tipo (' + m.tipo + ')');
  Object.entries(m.conexiones).forEach(([b, v]) => { const o = por[v]; if (!o) return e.push(m.id + ': conexión ' + b + ' a mapa inexistente ' + v); if (o.conexiones[opuesto[b]] !== m.id) e.push(m.id + '.' + b + ' → ' + v + ' no es recíproca'); });
  m.puertas.forEach((p) => { if (p.destino !== '@prof' && !por[p.destino]) e.push(m.id + ': puerta ' + p.id + ' a mapa inexistente ' + p.destino); });
  if (m.hecho && !fs.existsSync(path.join(raiz, 'maps', m.id + '.json'))) e.push(m.id + ': marcado hecho pero falta maps/' + m.id + '.json');
  else if (m.hecho) { const f = JSON.parse(fs.readFileSync(path.join(raiz, 'maps', m.id + '.json'), 'utf8')); if (f.ancho !== m.ancho || f.alto !== m.alto) e.push(m.id + ': el archivo mide ' + f.ancho + '×' + f.alto + ' y el plan ' + m.ancho + '×' + m.alto); }
});
Object.entries(W.regiones).forEach(([k, r]) => {
  if (!r.biomaNuevo && !P.biomas[r.cuevaBioma]) e.push('región ' + k + ': el bioma de cueva «' + r.cuevaBioma + '» no existe en profundidades.json');
  if (k !== 'albanota' && !['pueblo', 'gimnasio', 'santuario'].every((t) => W.mapas.some((m) => m.region === k && m.tipo === t))) e.push('región ' + k + ': le falta pueblo, gimnasio o santuario');
  if (!W.mapas.some((m) => m.region === k && m.puertas.some((p) => p.destino === '@prof')) && k !== 'albanota') e.push('región ' + k + ': sin entrada a su cueva');
});
const vis = new Set(['albanota']), cola = ['albanota'];
while (cola.length) { const m = por[cola.shift()]; [...Object.values(m.conexiones), ...m.puertas.map((p) => p.destino)].forEach((v) => { if (por[v] && !vis.has(v)) { vis.add(v); cola.push(v); } }); }
W.mapas.forEach((m) => { if (!vis.has(m.id)) e.push(m.id + ': inalcanzable desde albanota'); });
if (e.length) { console.log('FALLA: ' + e.slice(0, 6).join(' · ') + (e.length > 6 ? ' (+' + (e.length - 6) + ' más)' : '')); process.exit(1); }
const n = (t) => W.mapas.filter((m) => m.tipo === t).length, cas = W.mapas.reduce((s, m) => s + m.ancho * m.alto, 0), pend = W.mapas.filter((m) => !m.hecho).length;
console.log('OK ' + W.mapas.length + ' mapas (' + n('pueblo') + ' pueblos, ' + n('ruta') + ' rutas, ' + n('gimnasio') + ' gimnasios, ' + n('santuario') + ' santuarios, ' + n('interior') + ' interiores) · ' + cas + ' casillas · ' + pend + ' por hacer · ' + Object.keys(W.regiones).length + ' regiones · ' + Object.values(W.regiones).filter((r) => r.biomaNuevo).length + ' biomas de cueva nuevos');
