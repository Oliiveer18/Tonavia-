// validar_dimension.js — valida dimensiones (datos/dimensiones/<id>.json) con el MISMO esquema que usa el juego y las cruza con los mapas reales.
// Uso: node tools/validar_dimension.js [id ...]   (sin ids: todas + que todo mapa pertenezca a una dimensión registrada). Salida de UNA línea: «OK …» o «FALLA: …» (código 1).
const fs = require('fs'), path = require('path'), raiz = path.join(__dirname, '..');
const G = require('./_cargar.js')(), D = G.dimensiones, dir = path.join(raiz, 'datos', 'dimensiones');
const archivos = fs.readdirSync(dir).filter((f) => /\.json$/.test(f)).map((f) => f.replace(/\.json$/, '')).sort(), pedidas = process.argv.slice(2), e = [];
const ids = pedidas.length ? pedidas : archivos;
ids.forEach((id) => {
  if (!/^[a-z][a-z0-9_]*$/.test(id) || archivos.indexOf(id) < 0) { e.push(id + ': no existe datos/dimensiones/' + id + '.json'); return; }
  let def = null; try { def = JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8')); } catch (x) { e.push(id + ': JSON ilegible (' + x.message + ')'); return; }
  const er = D.validar(def, id); if (er.length) { er.forEach((m) => e.push(id + ': ' + m)); return; }
  if (id !== D.DEFECTO) { const pm = G.mundo.validarDimension(id); pm.forEach((m) => e.push(id + ': ' + m)); return; }   // F4: las demás dimensiones se cargan bajo demanda desde maps/<id>/ y se validan enteras sin dejarlas en memoria
  const R = D.registro({ [id]: def }), propios = {}; Object.keys(G.mundo.mapas).forEach((m) => { if (D.espacioDe(m) === (id === D.DEFECTO ? null : id)) propios[m] = G.mundo.mapas[m]; });
  R.comprobar(propios).forEach((m) => e.push(m));
  if (id === D.DEFECTO) { const plan = Object.keys(JSON.parse(fs.readFileSync(path.join(raiz, 'datos', 'mundo.json'), 'utf8')).regiones).sort().join(); if ((def.regiones || []).slice().sort().join() !== plan) e.push(id + ': sus regiones no coinciden con las de datos/mundo.json'); }
});
if (!pedidas.length) { if (D.lista().length !== archivos.length) e.push('hay dimensiones que el juego no registra: ' + JSON.stringify(D.errores)); D.comprobar(G.mundo.mapas).filter((m) => /no pertenece/.test(m)).forEach((m) => e.push(m)); }
if (e.length) { console.log('FALLA: ' + e.slice(0, 6).join(' · ') + (e.length > 6 ? ' (+' + (e.length - 6) + ' más)' : '')); process.exit(1); }
console.log('OK ' + ids.length + ' dimensión(es): ' + ids.join(', ') + ' · esquema v' + D.ESQUEMA + ' · ' + Object.keys(G.mundo.mapas).length + ' mapas comprobados');
