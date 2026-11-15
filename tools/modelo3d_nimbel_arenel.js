// modelo3d_nimbel_arenel.js — vuelca a JSON los modelos 3D locales de Nimbel y Arenel (los MISMOS de src/criatura3d_modelos.js) para el render de revisión.
// Uso: node tools/modelo3d_nimbel_arenel.js > modelos.json && python3 tools/render_modelo3d.py modelos.json sprites.json nimbel.png arenel.png
global.window = global; global.G = {};
require('../src/criatura3d.js'); require('../src/criatura3d_modelos.js');
const M = global.G.criatura3dModelos, o = {};
Object.keys(M.MODELOS).forEach((id) => { o[id] = { cfg: M.MODELOS[id].cfg, quads: M.MODELOS[id].construir() }; });
process.stdout.write(JSON.stringify(o));
