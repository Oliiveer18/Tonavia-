// volcar_oli.js — escribe en la salida estándar la geometría real de Oli 3D (polígonos con color liso) para tools/formas_oli.py. Uso: node tools/volcar_oli.js [rex|luna] > /tmp/oli_geo.json (v2.128: sin argumento = Oli; `luna` = Lali)
// v2.113 (Oli 3D, paso 2): 3 poses (quieto, pie derecho arriba, pie izquierdo arriba) con Oli mirando al sur y, además, andando en las 4 direcciones.
const noop = () => {};
global.window = global; window.G = {};
['src/rampas.js', 'src/personaje3d.js'].forEach((f) => require('../' + f));
const ID = process.argv[2] || 'rex', P = window.G.personaje3d.de(ID);
if (!P) { console.error('personaje desconocido: ' + ID + ' (rex | luna)'); process.exit(1); }
const POSES = [['quieto', P.pose(0, false, 'down')], ['pie derecho arriba', P.pose(0.045, true, 'down')], ['pie izquierdo arriba', P.pose(0.225, true, 'down')]];
const DIRS = ['down', 'right', 'up', 'left'].map((d) => [d, P.pose(0.045, true, d)]);
const vuelca = (po) => { const g = P.geometria(po); return { poly: g.poligonos.map((p) => ({ v: p.v, n: p.n, c: p.color, pz: p.pieza })), tri: g.triangulos, alto: g.altoTotal, ancho: g.ancho }; };
process.stdout.write(JSON.stringify({ personaje: ID, poses: POSES.map(([n, po]) => Object.assign({ nombre: n }, vuelca(po))), dirs: DIRS.map(([n, po]) => Object.assign({ nombre: n }, vuelca(po))) }));
