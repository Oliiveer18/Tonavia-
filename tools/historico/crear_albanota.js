#!/usr/bin/env node
// HISTÓRICO (v2.62d) · crear_albanota.js — reconstruye el PLANO ORIGINAL de Albanota (docs/PLANO_ALBANOTA.md, revisión v2.53: suelo + los 55 objetos de entonces).
// maps/albanota.json es la FUENTE ÚNICA y se edita DENTRO del juego («✏️ Editar mapa») o con tools/editor_mapas.html. Este script NO escribe nunca en maps/ (desde la v2.62d ya no existe --forzar):
// solo sirve para consultar o comparar el plano de partida (la prueba 40 de test.js comprueba que sigue produciendo el plano original).
// Uso: node tools/historico/crear_albanota.js --salida ruta.json   → escribe el plano original en ruta.json
//      node tools/historico/crear_albanota.js                      → muestra esta ayuda y sale con error (no toca nada)
// Los objetos son piezas de src/albanota_objetos.js y src/arboles.js; los rectángulos son los de tools/historico/plano_albanota.py (x, y, ancho, alto en casillas).
const fs = require('fs'), path = require('path');
const W = 48, H = 36;
const M = Array.from({ length: H }, () => Array(W).fill('.'));
const rect = (x, y, w, h, v) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (j >= 0 && j < H && i >= 0 && i < W) M[j][i] = v; };
// 1. bosque de borde: 2 casillas de árbol por todo el contorno (la casilla «t» que ya existe; no se añaden árboles sueltos)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 2 || x >= W - 2 || y < 2 || y >= H - 2) M[y][x] = 't';
// 2. arroyo recto de borde a borde
rect(0, 29, 48, 3, '~');
// 3. caminos y plaza (casilla «=» camino; no existe casilla de adoquín: la plaza usa el mismo camino)
const CAMINOS = [[23, 10, 3, 5], [26, 10, 18, 2], [33, 9, 3, 1], [0, 17, 20, 3], [29, 17, 16, 3], [42, 8, 3, 9], [3, 15, 3, 2], [12, 15, 3, 2], [12, 27, 11, 2], [23, 22, 3, 13], [35, 20, 3, 1], [43, 7, 1, 1]];
CAMINOS.forEach(([x, y, w, h]) => rect(x, y, w, h, '='));
rect(20, 15, 9, 7, '=');            // Plaza del Cascabel
rect(23, 29, 3, 3, 'b');            // puente sobre el arroyo
rect(0, 17, 3, 3, '=');             // entrada al bosque (borde oeste)
rect(23, 34, 3, 2, '=');            // salida a Ruta 1 (borde sur)
// 4. objetos que ya existen (paso C). [tipo, x, y] en casillas; las medidas de cada pieza (huella, pies) están en src/albanota_objetos.js. Sin árboles sueltos (decisión del usuario).
const OBJETOS = [];
const pon = (tipo, lista) => lista.forEach(([x, y]) => OBJETOS.push({ tipo, x, y }));
pon('huerto', [[33, 21]]); pon('puente_albanota', [[23, 29]]);                                              // piezas planas (se hornean con el suelo)
pon('nenufar', [[12, 30], [28, 30], [6, 30], [40, 30]]); pon('nenufar_flor', [[4, 30], [18, 30], [20, 30], [35, 30], [43, 30]]);
pon('juncos2', [[2, 29], [6, 29], [27, 29], [29, 29], [40, 29], [45, 29]]); pon('juncos3', [[10, 29], [35, 29]]);   // fuera de los caminos
pon('casa', [[2, 10], [11, 10], [11, 22]]);                                                                // Lali, Oli y laboratorio (puerta en la casilla x+2, y+4)
pon('centro_pc', [[21, 5]]); pon('tienda', [[32, 5]]); pon('ermita', [[41, 3]]);                              // volúmenes provisionales (paso D): puertas en (24,9), (34,8) y (43,7)
pon('fuente', [[24, 18]]);
pon('banco', [[20, 16], [27, 16], [8, 16]]);
pon('farola', [[22, 14], [26, 14], [22, 22], [26, 22], [22, 26], [26, 26], [19, 16], [19, 20], [29, 16], [29, 20], [7, 16], [10, 16]]); // simétricas respecto a cada avenida
pon('maceta', [[20, 21], [27, 21], [6, 15], [15, 15]]); pon('maceta_i', [[2, 15], [11, 15]]);
pon('cartel', [[20, 26]]);
pon('valla_ni', [[32, 20]]); pon('valla_nd', [[38, 20]]); pon('valla_9', [[32, 27]]); pon('valla_v', [[32, 21], [40, 21]]);       // valla del huerto con entrada de 3 casillas (x 35-37)
pon('espantapajaros', [[36, 25]]); pon('barril', [[41, 21]]);
const ZONAS = [['hoja', 1, 2, 6, 7], ['aire', 1, 20, 6, 6], ['electrico', 41, 22, 5, 5], ['agua', 41, 27, 5, 2], ['sombra', 9, 3, 8, 5], ['roca', 17, 22, 5, 5], ['fuego', 27, 22, 5, 6]];
// Sombra, Roca y Fuego NO están donde decía el plano (franja sur, y 32-34): con el bosque de borde de 2 casillas solo quedan 2 filas libres y una criatura necesita las 4 casillas vecinas libres (G.aparicion.libre). Se han movido a prado libre; son zonas de prueba temporales y ocultas.
const mapa = {
  formato: 2, id: 'albanota', nombre: 'Albanota', region: 'albanota', ancho: W, alto: H, base: '.',
  capas: { suelo: M.map((r) => r.join('')) }, objetos: OBJETOS, animar: true,
  anclas: { inicio: [24, 24], guarida_zefirax: [4, 22] },
  puertas: [], conexiones: { norte: null, sur: null, este: null, oeste: null },
  zonas: ZONAS.map(([e, x, y, w, h]) => ({ id: 'claro_' + e, x, y, w, h, elemento: e, nota: 'zona de prueba TEMPORAL (en el juego final Albanota no tiene criaturas salvajes)' })),
  npcs: [{ id: 'zefirax', x: 4, y: 22, tipo: 'guarida', texto: 'Guarida de Zefirax (prueba temporal)' }],
};
const args = process.argv.slice(2), iSal = args.indexOf('--salida');
const texto = JSON.stringify(mapa, null, 1) + '\n';
if (iSal >= 0 && args[iSal + 1]) { fs.writeFileSync(path.resolve(args[iSal + 1]), texto); console.log('Plano original escrito en', path.resolve(args[iSal + 1])); process.exit(0); }
console.error('Herramienta histórica: reconstruye el plano ORIGINAL de Albanota (v2.53); maps/albanota.json es la fuente única y este script no lo toca.\nUso: node tools/historico/crear_albanota.js --salida ruta.json');
process.exit(iSal >= 0 ? 2 : 1);
