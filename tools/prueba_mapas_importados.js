// prueba_mapas_importados.js — ayuda de test.js (grupo 45): arranca el juego hasta src/mapas.js con un «navegador» falso y dice qué mapas quedaron.
// Uso: node tools/prueba_mapas_importados.js <escenario>   (valido | invalido | prueba | oficiales | vacio). Escribe un JSON con el resultado.
const path = require('path'), fs = require('fs'), root = path.join(__dirname, '..'), esc = process.argv[2] || 'vacio';
const noop = () => {}, mk = () => { const ctx = new Proxy({ getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), measureText: () => ({ width: 40 }) }, { get: (t, p) => (p in t ? t[p] : noop), set: () => true }); return { width: 0, height: 0, getContext: () => ctx, style: {} }; };
global.window = global; global.document = { createElement: mk, getElementById: () => undefined, querySelectorAll: () => [] };
const J = (n) => JSON.parse(fs.readFileSync(path.join(root, 'maps', n + '.json'), 'utf8')), alb = J('albanota'), pue = J('pueblo_inicial');
alb.nombre = 'Albanota (editor)'; alb.objetos = alb.objetos.slice(0, -1); // edición válida: un objeto menos y otro nombre
const bueno = JSON.stringify({ paquete: 'mapas_editor', version: 1, formato: 2, maps: [alb, pue] });
const malo = JSON.stringify({ paquete: 'mapas_editor', version: 1, formato: 2, maps: [Object.assign({}, alb, { puertas: [{ id: 'p', x: 24, y: 24, destino: { mapa: 'no_existe', ancla: 'a' } }] })] });
const guardado = { valido: bueno, prueba: bueno, oficiales: bueno, invalido: malo, vacio: null }[esc], almacen = {}; if (guardado) almacen['criaturas.mapas_editor.v1'] = guardado;
global.localStorage = { getItem: (k) => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v); }, removeItem: (k) => { delete almacen[k]; } };
if (esc === 'prueba') global.__MAPA_PRUEBA = 'albanota'; // el juego abierto desde «Probar» del editor ignora lo guardado
if (esc === 'oficiales') global.location = { search: '?oficiales=1' };
const orden = require('../src/orden.json');
for (const f of orden.datos.concat(orden.juego)) { require(path.join(root, f)); if (f === 'src/mapas.js') break; }
const G = window.G, m = G.mundo.mapas.albanota;
console.log(JSON.stringify({ activo: G.mapasEditor.activo, ids: G.mapasEditor.ids, error: G.mapasEditor.error, nombre: m.nombre, objetos: m.objetos.length, pueblo: !!G.mundo.mapas.pueblo_inicial, oficialesIntactos: G.mundo.oficiales.albanota.objetos.length }));
