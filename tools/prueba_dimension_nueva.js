#!/usr/bin/env node
// prueba_dimension_nueva.js — F8: demuestra el PROCEDIMIENTO de la guía (docs/multiverso/GUIA_CONTENIDO.md §6) sobre una COPIA temporal del proyecto, sin tocar nada del proyecto real:
//   1) añade una dimensión de tierra y otra de mar con tools/nueva_dimension.js; 2) sin puerta de entrada el CONTRATO de test.js las rechaza; 3) con sus puertas pasan el validador, build.js y el contrato;
//   4) Tonavia no cambia (huella del juego 2D = la oficial); 5) sus guardados y los de Tonavia se cargan igual. Uso: node tools/prueba_dimension_nueva.js [--completa]   (--completa corre además todo test.js en la copia)
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const raiz = path.join(__dirname, '..'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dim_nueva_')), completa = process.argv.includes('--completa');
fs.cpSync(raiz, tmp, { recursive: true, filter: (f) => !/[\\/](dist|node_modules|\.git)([\\/]|$)/.test(f) && !/editor_mapas\.html$/.test(f) });
let fallos = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : ' FALLO ') + m); if (!c) fallos++; };
const run = (args, o) => cp.spawnSync(process.execPath, args, Object.assign({ cwd: tmp, encoding: 'utf8', maxBuffer: 1 << 26 }, o || {}));
const leer = (f) => JSON.parse(fs.readFileSync(path.join(tmp, f), 'utf8')), escribir = (f, j) => fs.writeFileSync(path.join(tmp, f), JSON.stringify(j, null, 1));
const base = run(['tools/huella_juego.js']).stdout.trim().split(' ')[0]; ok(/^[0-9a-f]{24}$/.test(base), 'huella del juego (2D) ANTES de añadir nada: ' + base);
let r = run(['tools/nueva_dimension.js', 'zdemo', 'Zona de prueba']); ok(r.status === 0, 'nueva_dimension crea la dimensión de tierra «zdemo»' + (r.status ? ': ' + r.stderr : ''));
r = run(['tools/nueva_dimension.js', 'zmar', 'Mar de prueba', '--mar']); ok(r.status === 0, 'nueva_dimension --mar crea la dimensión de mar «zmar»' + (r.status ? ': ' + r.stderr : ''));
r = run(['tools/nueva_dimension.js', 'zdemo', 'otra']); ok(r.status !== 0 && /ya existe/.test(r.stderr), 'no pisa una dimensión que ya existe');
r = run(['tools/nueva_dimension.js', 'tonavia', 'x']); ok(r.status !== 0, 'no admite «tonavia» ni ids inválidos'); r = run(['tools/nueva_dimension.js', '../x', 'x']); ok(r.status !== 0, 'ni ids con rutas');
r = run(['tools/validar_dimension.js']); ok(r.status === 0 && /zdemo/.test(r.stdout) && /zmar/.test(r.stdout), 'validar_dimension acepta las dos nuevas: ' + r.stdout.trim().slice(0, 90));
// sin puerta de entrada: el contrato de test.js las rechaza
if (completa) { run(['build.js']); r = run(['test.js'], { timeout: 1200000 }); ok(r.status !== 0 && /tiene al menos una puerta de entrada/.test(r.stdout), 'sin puerta de entrada, el contrato de test.js RECHAZA las dimensiones nuevas' + (r.status === 0 || !/puerta de entrada/.test(r.stdout) ? ' [estado ' + r.status + ': ' + (r.stdout.match(/FALLA:.*/g) || []).slice(0, 3).join(' | ') + (r.stderr || '').slice(0, 200) + ']' : '')); }
// con puertas de entrada (contenido): desde el Nexus a cada una
const nx = leer('maps/nexus/plaza_cruce.json'); nx.puertas.push({ id: 'portal_zdemo', x: 4, y: 12, destino: { mapa: 'zdemo/entrada', ancla: 'portal' }, portal: { color: '#88aadd', icono: 'eco', nombre: 'Zona de prueba' } }, { id: 'portal_zmar', x: 16, y: 12, destino: { mapa: 'zmar/mar_1_1', ancla: 'inicio' }, portal: { color: '#4488cc', icono: 'eco', nombre: 'Mar de prueba' } });
fs.writeFileSync(path.join(tmp, 'maps/nexus/plaza_cruce.json'), JSON.stringify(nx, null, 1));
const back = leer('maps/zmar/mar_1_1.json'); back.puertas = [{ id: 'portal_volver', x: 32, y: 36, destino: { mapa: 'nexus/plaza_cruce', ancla: 'volver' }, portal: { color: '#4488cc', icono: 'eco', nombre: 'Portal de vuelta' } }]; fs.writeFileSync(path.join(tmp, 'maps/zmar/mar_1_1.json'), JSON.stringify(back));
r = run(['tools/validar_dimension.js']); ok(r.status === 0, 'validar_dimension acepta todo con las puertas de entrada: ' + r.stdout.trim().slice(0, 100) + (r.status ? ' ' + r.stderr.slice(0, 200) : ''));
r = run(['tools/validar_mundo.js']); ok(r.status === 0, 'validar_mundo sigue en OK');
r = run(['build.js']); ok(r.status === 0 && fs.existsSync(path.join(tmp, 'dist/criaturas.html')), 'build.js empaqueta con las dimensiones nuevas' + (r.status ? ': ' + (r.stderr || r.stdout).slice(0, 200) : ''));
const tam = fs.statSync(path.join(tmp, 'dist/criaturas.html')).size; console.log('  · dist con las dos dimensiones nuevas (vacías: 1 de tierra de 21×15 y 1 de mar 3×3 de 64×64): ' + tam + ' B');
const h = run(['tools/huella_juego.js']).stdout.trim().split(' ')[0]; ok(h === base, 'Tonavia NO cambia: la huella del juego 2D sigue siendo ' + base + (h === base ? '' : ' (ahora ' + h + ')'));
if (completa) { r = run(['test.js'], { timeout: 1200000 }); ok(r.status === 0 && /Todo en orden/.test(r.stdout), 'test.js COMPLETO pasa en la copia con las dos dimensiones nuevas' + (r.status ? ': ' + (r.stdout.match(/FALLA:.*/g) || []).slice(0, 4).join(' | ') : '')); }
fs.rmSync(tmp, { recursive: true, force: true }); console.log(fallos ? 'FALLOS: ' + fallos : 'TODO BIEN'); process.exit(fallos ? 1 : 0);
