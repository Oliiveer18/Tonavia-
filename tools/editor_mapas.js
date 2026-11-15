// editor_mapas.js — une tools/editor_mapas.plantilla.html + maps/*.json en tools/editor_mapas.html (un solo archivo, sin dependencias).
// Uso: node tools/editor_mapas.js   y abre tools/editor_mapas.html en el navegador (móvil u ordenador).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'maps');
const mapas = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
// F8: los mapas de otras dimensiones (maps/<dim>/*.json, id «dim/mapa») van después de los de Tonavia; el editor los abre, edita y prueba sin tocar Tonavia.
fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().forEach((d) => { fs.readdirSync(path.join(dir, d)).filter((f) => f.endsWith('.json')).sort().forEach((f) => mapas.push(JSON.parse(fs.readFileSync(path.join(dir, d, f), 'utf8')))); });
const plantilla = fs.readFileSync(path.join(__dirname, 'editor_mapas.plantilla.html'), 'utf8');
if (!plantilla.includes('/*__MAPAS__*/[]')) throw new Error('La plantilla no tiene el marcador /*__MAPAS__*/[]');
// v2.59 (ED-1): el editor lleva dentro el MISMO motor de dibujo del juego (G.capas + las piezas de Albanota) para ver los objetos con sus dibujos reales.
const MOTOR = ['src/chars.js', 'src/rampas.js', 'src/sombreado.js', 'src/capas.js', 'src/arboles.js', 'src/font.js', 'src/albanota_objetos.js'];
const orden = require('../src/orden.json');
MOTOR.forEach((f) => { if (!orden.datos.concat(orden.juego).includes(f)) throw new Error(f + ' no está en src/orden.json'); });
if (!plantilla.includes('/*__MOTOR__*/')) throw new Error('La plantilla no tiene el marcador /*__MOTOR__*/');
const motor = MOTOR.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n').replace(/<\/script/gi, '<\\/script');
// v2.60 (ED-2): el editor lleva también el JUEGO ENTERO (el mismo que build.js arma en dist/criaturas.html) para «Probar en el juego» con el mapa editado, sin exportar.
if (!plantilla.includes('/*__JUEGO__*/null')) throw new Error('La plantilla no tiene el marcador /*__JUEGO__*/null');
const indice = fs.readFileSync(path.join(root, 'index.html'), 'utf8').split('<!--SRC-->');
if (indice.length !== 2) throw new Error('index.html debe tener un solo marcador <!--SRC-->');
const leer = (f) => fs.readFileSync(path.join(root, f), 'utf8');
// «Probar en el juego» necesita los mismos G.DATOS y G.PAQUETES que arma build.js (sin ellos el juego no encuentra la dimensión «tonavia» ni las profundidades; defecto desde la v2.320/F3). Misma lógica que build.js.
const sinNotas = (v) => (Array.isArray(v) ? v.map(sinNotas) : v && typeof v === 'object' ? Object.keys(v).filter((k) => k[0] !== '_').reduce((o, k) => { o[k] = sinNotas(v[k]); return o; }, {}) : v);
const jsonsDe = (d) => fs.readdirSync(path.join(root, d)).filter((f) => /\.json$/.test(f)).sort();
const DATOS = { crias: {} }; jsonsDe('datos').forEach((f) => { DATOS[f.replace(/\.json$/, '')] = sinNotas(JSON.parse(leer('datos/' + f))); });
jsonsDe('datos/crias').forEach((f) => { const j = sinNotas(JSON.parse(leer('datos/crias/' + f))); DATOS.crias[j.linea] = j; });
DATOS.dimensiones = {}; jsonsDe('datos/dimensiones').forEach((f) => { DATOS.dimensiones[f.replace(/\.json$/, '')] = sinNotas(JSON.parse(leer('datos/dimensiones/' + f))); });
const PAQUETES = {}; fs.readdirSync(path.join(root, 'maps'), { withFileTypes: true }).filter((d) => d.isDirectory()).forEach((d) => { const o = {}; jsonsDe('maps/' + d.name).forEach((f) => { const j = JSON.parse(leer('maps/' + d.name + '/' + f)); o[j.id] = j; }); if (Object.keys(o).length) PAQUETES[d.name] = JSON.stringify(o); });
const juego = JSON.stringify({ antes: indice[0], datos: orden.datos.map(leer).concat(['window.G.DATOS = ' + JSON.stringify(DATOS) + ';', 'window.G.PAQUETES = ' + JSON.stringify(PAQUETES) + ';']).join('\n'), juego: orden.juego.map(leer).join('\n'), despues: indice[1] }).replace(/</g, '\\u003c');
// v2.62: versión «para el juego» (sin el juego dentro, sin mapas y sin mapa inicial: los pone src/mapas_ui.js al abrirla). build.js la mete en dist/criaturas.html.
const lite = plantilla.replace('/*__MOTOR__*/', () => motor);
if (require.main !== module) { module.exports = { lite }; return; }
const out = plantilla.replace('/*__MOTOR__*/', () => motor).replace('/*__MAPAS__*/[]', () => JSON.stringify(mapas).replace(/</g, '\\u003c')).replace('/*__JUEGO__*/null', () => juego); // ojo: los mapas ANTES que el juego (el código del juego, src/mapas_ui.js, nombra estos marcadores y se colaría el primero)
fs.writeFileSync(path.join(__dirname, 'editor_mapas.html'), out);
console.log('tools/editor_mapas.html', out.length, 'bytes,', mapas.length, 'mapa(s) incluido(s)');
