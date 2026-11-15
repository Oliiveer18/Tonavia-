#!/usr/bin/env node
// crear_mar.js — FN: crea el MOSAICO de mar de una dimensión (3×3 mapas de 64×64, solo agua) en maps/<dim>/mar_<fila>_<col>.json.
// Uso: node tools/crear_mar.js <dim> [--forzar]      (no pisa mapas que ya existen —ahí puede haber islas dibujadas— salvo con --forzar)
// Cada mapa lleva «mar: true», los bordes conectados con sus vecinos del mosaico (sin desplazamiento) y el ancla «inicio» en el centro. Las islas, muelles y costas se dibujan después sobre estos archivos (contenido).
const fs = require('fs'), path = require('path');
const dim = process.argv[2], forzar = process.argv.includes('--forzar'), N = 3, L = 64;
if (!dim || !/^[a-z][a-z0-9_]{0,23}$/.test(dim)) { console.error('Uso: node tools/crear_mar.js <dim> [--forzar]  (dim: minúsculas, dígitos y _)'); process.exit(1); }
const dir = path.join(__dirname, '..', 'maps', dim); fs.mkdirSync(dir, { recursive: true });
const id = (f, c) => dim + '/mar_' + f + '_' + c, fila = '~'.repeat(L); let n = 0;
for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) {
  const ruta = path.join(dir, 'mar_' + f + '_' + c + '.json');
  if (fs.existsSync(ruta) && !forzar) { console.log('existe, no se toca: ' + path.relative(process.cwd(), ruta)); continue; }
  const con = (ok, f2, c2) => (ok ? { mapa: id(f2, c2), desplazamiento: 0 } : null);
  const m = { formato: 2, id: id(f, c), nombre: 'Mar ' + (f * N + c + 1), region: null, mar: true, ancho: L, alto: L, capas: { suelo: Array(L).fill(fila) }, objetos: [], animar: true, anclas: { inicio: [32, 32], entrada: [32, 32] }, puertas: [], conexiones: { norte: con(f > 0, f - 1, c), sur: con(f < N - 1, f + 1, c), este: con(c < N - 1, f, c + 1), oeste: con(c > 0, f, c - 1) }, zonas: [], npcs: [], pesca: [] };
  fs.writeFileSync(ruta, JSON.stringify(m, null, 1)); n++;
}
console.log('maps/' + dim + ': ' + n + ' mapa(s) de mar creados');
