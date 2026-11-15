// volcar_personaje_tex.js — vuelca la geometría REAL de un personaje 3D con su atlas y sus uv (las que usará el pintor) para tools/texturado.py.
// Uso: node tools/volcar_personaje_tex.js [rex|luna] > /tmp/pers_tex.json   (sin argumento, Oli). v2.129 (Lali 3D, paso 3).
// Carga los sprites de verdad (src/chars.js): las texturas se recortan de ellos.
global.window = global; window.G = {};
global.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => ({ data: [] }), set: () => true }), width: 0, height: 0 }) };
['src/rampas.js', 'src/chars.js', 'src/personaje3d.js'].forEach((f) => require('../' + f));
const ID = process.argv[2] || 'rex', P = window.G.personaje3d.de(ID);
if (!P) { console.error('personaje desconocido: ' + ID + ' (rex | luna)'); process.exit(1); }
const at = P.atlas(), px = Array.from({ length: at.h }, () => Array(at.w).fill(null));
at.celdas.forEach((c) => c.px.forEach((fila, y) => fila.forEach((col, x) => { if (col) px[c.y + y][c.x + x] = col; })));   // el atlas ya compuesto (la celda `blanco` es 1×1 blanca)
const POSES = [['quieto', window.G.personaje3d.pose(0, false, 'down')], ['pie derecho arriba', window.G.personaje3d.pose(0.045, true, 'down')], ['pie izquierdo arriba', window.G.personaje3d.pose(0.225, true, 'down')]];
const DIRS = ['down', 'right', 'up', 'left'].map((d) => [d, window.G.personaje3d.pose(0.045, true, d)]);
const vuelca = (po) => { const g = P.geometria(po); return { poly: g.poligonos.map((q) => { const u = P.uvPoligono(q, at); return { v: q.v, n: q.n, c: q.color, tono: q.tono, tex: u.tex, uv: u.uv, pz: q.pieza, cara: q.cara }; }), tri: g.triangulos, alto: g.altoTotal, ancho: g.ancho }; };
process.stdout.write(JSON.stringify({ personaje: ID, brillo: P.BRILLO, tonoTex: P.TONO_TEX, atlas: { w: at.w, h: at.h, px }, poses: POSES.map(([n, po]) => Object.assign({ nombre: n }, vuelca(po))), dirs: DIRS.map(([n, po]) => Object.assign({ nombre: n }, vuelca(po))) }));
