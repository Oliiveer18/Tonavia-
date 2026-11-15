// arboles_prueba_html.js — v2.34: genera una copia JUGABLE del juego con una zona de prueba LIMPIA para ver los 4 árboles (arbol_pequeno, arbol_mediano, abeto, roble_hito).
// No toca maps/ ni dist/criaturas.html: parte de la misma lista de archivos (src/orden.json), cambia solo EN MEMORIA el mapa pueblo_inicial (claro de hierba en x 20-28, y 3-12 sin árboles ni flores,
// 7 árboles colocados, inicio en el claro) y oculta las criaturas. Uso: node tools/arboles_prueba_html.js [salida.html]   (por defecto dist/arboles_prueba.html)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), leer = (f) => fs.readFileSync(path.join(root, f), 'utf8'), salida = process.argv[2] || path.join(root, 'dist', 'arboles_prueba.html');
const orden = require(path.join(root, 'src/orden.json')), MAPAS = {};
fs.readdirSync(path.join(root, 'maps')).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { const j = JSON.parse(leer('maps/' + f)); MAPAS[j.id] = j; });
const m = MAPAS.pueblo_inicial, suelo = m.capas.suelo.map((f) => f.split(''));
for (let y = 3; y <= 12; y++) for (let x = 20; x <= 28; x++) suelo[y][x] = '.'; // claro limpio: solo hierba lisa
m.capas.suelo = suelo.map((f) => f.join(''));
m.objetos = [['arbol_pequeno', 21, 6], ['arbol_mediano', 23, 6], ['abeto', 25, 6], ['roble_hito', 27, 6], ['abeto', 21, 10], ['arbol_mediano', 23, 10], ['arbol_pequeno', 25, 10]].map(([tipo, x, y]) => ({ tipo, x, y }));
m.anclas.inicio = [24, 8]; // Oli aquí; Lali dos casillas a la derecha
const js = orden.datos.map(leer).concat(['window.G.MAPAS = ' + JSON.stringify(MAPAS) + ';'], orden.juego.map(leer), ['window.G.aparicion.AJUSTES.VISIBLES = false; // prueba: sin criaturas']).join('\n');
fs.writeFileSync(salida, leer('index.html').replace('<!--SRC-->', () => '<script>\n' + js + '\n</script>'));
console.log(salida, fs.statSync(salida).size, 'bytes');
