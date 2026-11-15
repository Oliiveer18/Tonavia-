#!/usr/bin/env node
// prueba_cruce_mar.js — FN: prueba de INTEGRACIÓN del cruce tierra↔mar por el sistema REAL de puertas (motor.cruzar), sin muelles definitivos.
// Copia el proyecto a una carpeta temporal y allí añade un mapa de tierra de PRUEBA (pirata/muelle_prueba) y una puerta de agua en pirata/mar_1_1. NO toca maps/ ni datos/ del proyecto.
// Uso: node tools/prueba_cruce_mar.js      (código 0 = todo bien)
const fs = require('fs'), path = require('path'), os = require('os');
const raiz = path.join(__dirname, '..'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cruce_mar_'));
['src', 'datos', 'maps', 'modelos', 'plantillas'].forEach((d) => { if (fs.existsSync(path.join(raiz, d))) fs.cpSync(path.join(raiz, d), path.join(tmp, d), { recursive: true }); });
fs.mkdirSync(path.join(tmp, 'tools')); fs.copyFileSync(path.join(__dirname, '_cargar.js'), path.join(tmp, 'tools/_cargar.js'));
// — fixture —
const suelo = []; for (let y = 0; y < 8; y++) { let f = ''; for (let x = 0; x < 12; x++) f += y === 0 || y === 7 || x === 0 || x === 11 ? '#' : '_'; suelo.push(f); }
suelo[7] = suelo[7].slice(0, 6) + 'd' + suelo[7].slice(7);
const tierra = { formato: 2, id: 'pirata/muelle_prueba', nombre: 'Muelle de prueba', region: null, tema: 'casa', ancho: 12, alto: 8, capas: { suelo }, objetos: [], animar: false, anclas: { inicio: [6, 4], entrada: [6, 4], desembarco: [6, 6] },
  puertas: [{ id: 'al_barco', x: 6, y: 7, destino: { mapa: 'pirata/mar_1_1', ancla: 'muelle' } }], conexiones: { norte: null, sur: null, este: null, oeste: null }, zonas: [], npcs: [] };
fs.writeFileSync(path.join(tmp, 'maps/pirata/muelle_prueba.json'), JSON.stringify(tierra));
const mp = path.join(tmp, 'maps/pirata/mar_1_1.json'), mar = JSON.parse(fs.readFileSync(mp, 'utf8'));
mar.anclas.muelle = [32, 35]; mar.puertas = [{ id: 'a_tierra', x: 32, y: 36, destino: { mapa: 'pirata/muelle_prueba', ancla: 'desembarco' } }]; fs.writeFileSync(mp, JSON.stringify(mar));
// — prueba —
let fallos = 0; const ok = (c, m) => { console.log((c ? '  ok  ' : ' FALLO ') + m); if (!c) fallos++; };
const G = require(path.join(tmp, 'tools/_cargar.js'))(), motor = G.motor, N = G.navegacion, T = 16;
const val = G.mundo.validarDimension('pirata'); ok(val.length === 0, 'la dimensión con el muelle de prueba valida (' + (val[0] || '0 problemas') + ')');
const x = motor.crear(11), j = x.jugadores.oli, hoy = JSON.stringify(x.rnd), av = () => x.avisos.map((a) => a.texto).join('|');
const hasta = (f, max) => { for (let i = 0; i < Math.round((max || 3) * 30) && !f(); i++) motor.moverJugadores(x, 1 / 30); }, teclas = (o) => motor.aplicar(x, Object.assign({ j: 'oli', t: 'teclas', up: 0, down: 0, left: 0, right: 0 }, o)), paso = (s) => { for (let i = 0; i < Math.round(s * 30); i++) motor.moverJugadores(x, 1 / 30); };
motor.aplicar(x, { j: 'oli', t: 'colocar', mapa: 'pirata/muelle_prueba', ancla: 'entrada' }); ok(j.mapa === 'pirata/muelle_prueba' && !N.navegando(j), 'a pie en el muelle de prueba');
// 1) sin barco: la puerta real NO deja subir
teclas({ down: 1 }); paso(2); teclas({});
ok(j.mapa === 'pirata/muelle_prueba' && /Aún no tienes barco/.test(av()), 'sin barco, la puerta real avisa y no se cruza («Aún no tienes barco»)');
// 2) barco amarrado en otro sitio
N.amarrar(x, j, { mapa: 'pirata/mar_0_0', tx: 5, ty: 5 }); j.x = 6 * T + 8; j.y = 5 * T + 14; j.enPuerta = null; x.avisos.length = 0; teclas({ down: 1 }); paso(1.5); teclas({});
ok(j.mapa === 'pirata/muelle_prueba' && /no está aquí/.test(av()), 'con el barco amarrado lejos, la puerta avisa y no se cruza');
// 3) barco amarrado junto al muelle: embarca
N.amarrar(x, j, { mapa: 'pirata/mar_1_1', tx: 32, ty: 35 }); j.x = 6 * T + 8; j.y = 5 * T + 14; j.enPuerta = null; x.avisos.length = 0; teclas({ down: 1 }); paso(1.5); teclas({});
ok(j.mapa === 'pirata/mar_1_1' && N.navegando(j) && j.nav && /Subes al barco/.test(av()), 'con el barco amarrado junto al muelle, la puerta real embarca («Subes al barco»)');
ok(Math.abs(j.x / T - 32.5) < 1.2 && Math.abs(j.y / T - 35.9) < 1.2, 'aparece en el ancla del muelle del mar (' + (j.x / T).toFixed(1) + ',' + (j.y / T).toFixed(1) + ')');
// 4) navegando: velocidad de barco y no vuelve a saltar a tierra por la puerta de agua al llegar
const x0 = j.x; teclas({ right: 1 }); paso(1); teclas({}); ok(Math.abs(j.x - x0 - 80) < 1, 'ya navegando a 80 px/s tras embarcar');
// 5) desembarcar por la puerta de agua: amarra donde estaba la puerta
j.x = 32 * T + 8; j.y = 34 * T + 14; j.enPuerta = null; x.avisos.length = 0; const m0 = j.mapa; teclas({ down: 1 }); hasta(() => j.mapa !== m0); teclas({});
const am = x.dim.pirata.jugadores.oli.amarre;
ok(j.mapa === 'pirata/muelle_prueba' && !N.navegando(j) && !j.nav && /Amarras el barco/.test(av()), 'la puerta de agua desembarca al muelle y ya no navega («Amarras el barco»)');
ok(am && am.mapa === 'pirata/mar_1_1' && am.tx === 32 && am.ty === 36, 'el barco queda amarrado en la casilla de la puerta de agua (' + JSON.stringify(am) + ')');
ok(Math.abs(j.x / T - 6.5) < 1.2 && Math.abs(j.y / T - 6.9) < 1.2, 'aparece en el ancla de desembarco de tierra (' + (j.x / T).toFixed(1) + ',' + (j.y / T).toFixed(1) + ')');
// 6) vuelve a embarcar con el barco que dejó amarrado (ida y vuelta) y el estado del barco se conserva
N.mejorar(x, j, 'casco', 1); x.avisos.length = 0; j.x = 6 * T + 8; j.y = 5 * T + 14; j.enPuerta = null; teclas({ down: 1 }); paso(1.5); teclas({});
ok(j.mapa === 'pirata/mar_1_1' && N.navegando(j), 'ida y vuelta: embarca otra vez con el barco que dejó amarrado');
const b = N.barco(x, j); ok(b && b.casco === 1 && b.amarre && b.amarre.tx === 32, 'el estado del barco (nivel, amarre) se conserva entre cruces');
// 7) guardado a mitad: a pie en tierra con el barco amarrado → recarga y vuelve a poder embarcar
j.x = 32 * T + 8; j.y = 34 * T + 14; j.enPuerta = null; { const m1 = j.mapa; teclas({ down: 1 }); hasta(() => j.mapa !== m1); teclas({}); } const d = JSON.parse(JSON.stringify(G.guardado.serializar(x))), y = motor.crear(11); G.guardado.restaurar(y, d);
const jy = y.jugadores.oli; ok(jy.mapa === 'pirata/muelle_prueba' && y.dim.pirata.jugadores.oli.amarre.tx === 32, 'guardar/cargar a pie con el barco amarrado conserva ambos');
// 8) azar intacto
ok(JSON.stringify(x.rnd) === hoy, 'embarcar, navegar y desembarcar no consumen el azar de la partida');
// 9) los mapas oficiales no cambian
ok(!fs.readFileSync(path.join(raiz, 'maps/pirata/mar_1_1.json'), 'utf8').includes('a_tierra') && !fs.existsSync(path.join(raiz, 'maps/pirata/muelle_prueba.json')), 'el proyecto real no se ha tocado (fixture solo en la copia temporal)');
fs.rmSync(tmp, { recursive: true, force: true }); console.log(fallos ? fallos + ' FALLO(S)' : 'Todo en orden'); process.exit(fallos ? 1 : 0);
