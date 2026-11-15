// build.js — une index.html + src/*.js en dist/criaturas.html (un solo archivo, sin dependencias). Uso: node build.js
const fs = require('fs'), path = require('path');
const root = __dirname, html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const orden = require('./src/orden.json'), leer = (f) => fs.readFileSync(path.join(root, f), 'utf8');
// Los mapas de maps/*.json viajan dentro del HTML como G.MAPAS (justo antes de src/mapas.js, que los lee).
// F4 · el resto de dimensiones: maps/<dim>/*.json → G.PAQUETES[dim] = UN texto JSON { id: mapa } (no se analiza hasta que un jugador entra). El id de cada mapa debe ser «<dim>/…».
const PAQUETES = {}; fs.readdirSync(path.join(root, 'maps'), { withFileTypes: true }).filter((d) => d.isDirectory()).forEach((d) => {
  const o = {}; fs.readdirSync(path.join(root, 'maps', d.name)).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { const j = JSON.parse(leer('maps/' + d.name + '/' + f)); if (typeof j.id !== 'string' || j.id.indexOf(d.name + '/') !== 0 || j.id.length <= d.name.length + 1) throw new Error('maps/' + d.name + '/' + f + ': el id debe empezar por «' + d.name + '/»'); if (o[j.id]) throw new Error('id repetido: ' + j.id); o[j.id] = j; });
  if (Object.keys(o).length) PAQUETES[d.name] = JSON.stringify(o);
});
const MAPAS = {}; fs.readdirSync(path.join(root, 'maps')).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { const j = JSON.parse(leer('maps/' + f)); MAPAS[j.id] = j; });
// v2.320: los datos de datos/*.json y datos/crias/*.json viajan como G.DATOS (profundidades, crianza y las fichas de cría). Las claves que empiezan por _ son comentarios y no viajan.
const sinNotas = (v) => (Array.isArray(v) ? v.map(sinNotas) : v && typeof v === 'object' ? Object.keys(v).filter((k) => k[0] !== '_').reduce((o, k) => { o[k] = sinNotas(v[k]); return o; }, {}) : v);
const DATOS = { crias: {} }; fs.readdirSync(path.join(root, 'datos')).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { DATOS[f.replace(/\.json$/, '')] = sinNotas(JSON.parse(leer('datos/' + f))); });
fs.readdirSync(path.join(root, 'datos/crias')).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { const j = sinNotas(JSON.parse(leer('datos/crias/' + f))); DATOS.crias[j.linea] = j; });
// F3: dimensiones (datos/dimensiones/*.json, como { archivo: definición }). Se validan AQUÍ con el mismo esquema que usa el juego: una dimensión rota no se empaqueta.
DATOS.dimensiones = {}; fs.readdirSync(path.join(root, 'datos/dimensiones')).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { DATOS.dimensiones[f.replace(/\.json$/, '')] = sinNotas(JSON.parse(leer('datos/dimensiones/' + f))); });
{ const sb = { G: { DATOS } }; sb.window = sb; require('vm').runInNewContext(leer('src/dimensiones.js'), sb); const er = sb.G.dimensiones.errores; if (Object.keys(er).length || !sb.G.dimensiones.existe('tonavia')) { console.error('build: dimensiones inválidas: ' + JSON.stringify(er)); process.exit(1); } }
const js = orden.datos.map(leer).concat(['window.G.DATOS = ' + JSON.stringify(DATOS) + ';', 'window.G.MAPAS = ' + JSON.stringify(MAPAS) + ';', 'window.G.PAQUETES = ' + JSON.stringify(PAQUETES) + ';'], orden.juego.map(leer)).join('\n');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
// v2.62: el editor de mapas viaja dentro del juego (botón «Editar mapa»), como texto que solo se abre al pulsarlo. Sin el juego dentro, para no repetirlo.
const editor = JSON.stringify(require('./tools/editor_mapas.js').lite).replace(/</g, '\\u003c');
fs.writeFileSync(path.join(root, 'dist/criaturas.html'), html.replace('<!--SRC-->', () => '<script>\n' + js + '\n</script>\n<script type="application/json" id="editorSrc">' + editor + '</script>'));
console.log('dist/criaturas.html', fs.statSync(path.join(root, 'dist/criaturas.html')).size, 'bytes');
