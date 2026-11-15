// volcar_oli_tex.js — escribe en la salida estándar las texturas de Oli 3D (hoy solo cabeza_sur) para tools/texturas_oli.py. Uso: node tools/volcar_oli_tex.js > /tmp/oli_tex.json
// v2.115 (Oli 3D, paso 3b-1). Carga el sprite de verdad (src/chars.js) porque la textura se recorta de él.
global.window = global; window.G = {};
global.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => ({ data: [] }), set: () => true }), width: 0, height: 0 }) };
['src/chars.js', 'src/personaje3d.js'].forEach((f) => require('../' + f));
const P = window.G.personaje3d;
process.stdout.write(JSON.stringify(P.ids().map((id) => P.textura(id))));
