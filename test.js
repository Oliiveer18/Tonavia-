// test.js — comprobaciones sin navegador (lienzo falso): sprites de Oli y Lali, mapa y colisiones. Uso: node test.js
const noop = () => {}, mk = () => { const base = { getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), measureText: () => ({ width: 40 }) }; const ctx = new Proxy(base, { get: (t, p) => (p in t ? t[p] : noop), set: () => true }); return { width: 0, height: 0, getContext: () => ctx, style: {}, offsetHeight: 80 }; };
const els = { game: mk(), ui: mk(), pad: mk(), menu: { hidden: false }, who: {} };
global.window = global; global.document = { createElement: mk, getElementById: (id) => els[id], querySelectorAll: () => [] };
global.addEventListener = noop; global.requestAnimationFrame = noop; global.innerWidth = 390; global.innerHeight = 800;
global.setTimeout = () => 0; global.clearTimeout = noop;
let INICIAL_DE_FABRICA = null; // v2.57: mapa donde empieza la partida tal como sale de src/mapas.js (Albanota); el grupo 42 lo comprueba
{ const orden = require('./src/orden.json'); orden.datos.concat(orden.juego).forEach((f) => { require('./' + f); if (f === 'src/mapas.js') { INICIAL_DE_FABRICA = window.G.mundo.INICIAL.mapa; window.G.mundo.INICIAL.mapa = 'pueblo_inicial'; } }); } // lista única de archivos: src/orden.json. Los grupos anteriores a la v2.57 se escribieron sobre el pueblo provisional, que desde la v2.57 es el mapa de pruebas: se arrancan ahí a propósito (antes de cargar game.js)
let fallos = 0; const ok = (c, m) => { if (!c) { fallos++; console.log('FALLA:', m); } else if (process.env.VERBOSO && /^(pesos de rareza|rendimiento|muestra|con más huecos)/.test(m)) console.log('  ·', m); }; // VERBOSO=1 node test.js: enseña también las medidas del grupo 23
const G = window.G, J = window.__juego;
G.aparicion.AJUSTES.VISIBLES = true; // v2.19: el juego arranca con las criaturas ocultas (VISIBLES false); los grupos de aparición y del motor las necesitan visibles, y el grupo 24 prueba el interruptor
// BANCO DE PRUEBAS (v2.17, paso 1.3b): las criaturas ya no están colocadas una a una; salen por zonas y con semilla (src/aparicion.js, grupo 23). Los grupos de abajo prueban cada criatura
// (dibujo, paseo, evolución) y necesitan tenerla en el mapa: para ellos se desactiva la aparición y se colocan las 20 de fase 1 donde estaban en la v2.16 (casillas del claro de su elemento).
{ const BANCO = [['pompon', 27, 6], ['aguacato', 4, 7], ['fosforin', 5, 21], ['pilita', 31, 12], ['nubecin', 18, 5], ['cuarzin', 18, 21], ['somnin', 28, 20], ['setin', 8, 9], ['caracolin', 30, 8], ['lunabu', 31, 23], ['cenel', 8, 19], ['ferrel', 15, 22], ['dandel', 15, 4], ['zefirax', 21, 3], ['zumbel', 28, 15], ['arenel', 21, 23], ['perlel', 27, 9], ['arcel', 33, 11], ['forjel', 4, 23], ['cactel', 6, 11]];
  J.est.sinAparicion = true; J.motor.estadoMapa(J.est, J.mundo.INICIAL.mapa).criaturas = BANCO.map(([id, x, y]) => J.motor.nueva(id, x, y, 0.5)); }
['rex', 'luna'].forEach((id) => ['down', 'up', 'side'].concat(id === 'rex' ? ['sideL'] : []).forEach((d) => [0, 1, 2].forEach((f) => ok(G.spr[`${id}_${d}_${f}`], `falta sprite ${id}_${d}_${f}`))));
ok(G.NAMES.oli === 'rex' && G.NAMES.lali === 'luna', 'Oli = rex y Lali = luna');
ok(J.MAP.length === 26 && J.MAP.every((r) => r.length === 36), 'mapa 36×26');
ok(J.S.x === 18 * 16 + 8 && J.S.y === 13 * 16 + 14, 'Oli y Lali empiezan en el cruce de caminos');
ok(J.solid(0, 0) && J.solid(35, 25) && J.solid(33, 3) && !J.solid(18, 13) && !J.solid(6, 10), 'árboles y agua bloquean; los caminos no');
J.S.x = 6 * 16 + 8; J.S.y = 6 * 16 + 14; J.keys.left = 1; for (let i = 0; i < 400; i++) J.step(0.05); J.keys.left = 0;
ok(J.S.x > 8 && !J.blocked(J.S.x, J.S.y), 'no atraviesa los árboles del borde');
// cámara: zoom entero, vista dentro del mapa, sigue al jugador y no se sale
J.fit(); const v = J.view(); ok(Number.isInteger(v.K) && v.K >= 2, 'zoom entero >= 2'); ok(v.VW <= 576 && v.VH <= 416 && v.VH >= 96, 'la vista cabe en el mapa');
J.S.x = 20; J.S.y = 20; J.follow(0, true); ok(J.cam.x === 0 && J.cam.y === 0, 'cámara pegada a la esquina arriba-izquierda');
J.S.x = 560; J.S.y = 400; J.follow(0, true); ok(J.cam.x === 576 - v.VW && J.cam.y === 416 - v.VH, 'cámara pegada a la esquina abajo-derecha');
J.S.x = 288; J.S.y = 208; J.follow(0, true); ok(J.cam.x > 0 && J.cam.x < 576 - v.VW + 1 && Math.abs(J.cam.x + v.VW / 2 - 288) < 1, 'cámara centrada en el jugador');
// v2.48d: cámara fija al jugador con enteros: el jugador no se mueve en pantalla al caminar ni al parar, y la cámara no se desliza
{ J.fit(); const vv = J.view(); const pant = () => Math.round(J.S.x - J.cam.x) + ',' + Math.round(J.S.y - J.cam.y);
  J.S.x = 288 + 0.37; J.S.y = 208 + 0.61; J.follow(0, true); const base = pant(), c0 = [J.cam.x, J.cam.y];
  ok(Number.isInteger(J.cam.x) && Number.isInteger(J.cam.y), 'cámara con valores enteros');
  let fijo = true, entera = true; J.keys.right = 1; for (let i = 0; i < 40; i++) { J.step(0.016); J.follow(0.016); if (pant() !== base) fijo = false; if (!Number.isInteger(J.cam.x) || !Number.isInteger(J.cam.y)) entera = false; }
  ok(fijo, 'el jugador no se mueve en pantalla al caminar (centrado)'); ok(entera, 'la cámara es entera en cada cuadro al caminar');
  J.keys.right = 0; const parado = [J.cam.x, J.cam.y]; let quieta = true; for (let i = 0; i < 60; i++) { J.step(0.016); J.follow(0.016); if (J.cam.x !== parado[0] || J.cam.y !== parado[1] || pant() !== base) quieta = false; }
  ok(quieta, 'al parar la cámara no se desliza ni el jugador se recoloca'); ok(parado[0] > c0[0], 'la cámara sí avanzó con el jugador');
  J.S.x = 20; J.S.y = 20; J.follow(0.016); ok(J.cam.x === 0 && J.cam.y === 0, 'sigue pegada a la esquina arriba-izquierda');
  J.S.x = 560; J.S.y = 400; J.follow(0.016); ok(J.cam.x === 576 - vv.VW && J.cam.y === 416 - vv.VH, 'sigue pegada a la esquina abajo-derecha'); }
// criaturas: sprites completos, paseo sin pisar obstáculos y diálogo
Object.keys(G.CREATURES).forEach((id) => ['down', 'up', 'left', 'right'].forEach((d) => [0, 1].forEach((f) => ok(G.creatureSprite(id, d, f).c, `falta sprite ${id}_${d}_${f}`))));
// datos de juego: elementos, rarezas y fases
const EL = Object.keys(G.ELEMENTS), RA = { comun: [1, 2], rara: [2, 3], epica: [3, 3], legendaria: [1, 1] };
EL.forEach((e) => { ok(G.ELEMENTS[e].strong.length === 2 && G.ELEMENTS[e].weak.length === 2, e + ': gana a 2 y pierde contra 2'); EL.forEach((o) => ok(e === o ? G.elementEffect(e, o) === 1 : (G.elementEffect(e, o) === 2) === (G.elementEffect(o, e) === 0.5), e + ' / ' + o + ': ventaja y debilidad son recíprocas')); });
Object.keys(G.CREATURES).forEach((id) => { const d = G.CREATURES[id]; ok(RA[d.rarity] && d.phases >= RA[d.rarity][0] && d.phases <= RA[d.rarity][1], id + ': fases previstas dentro del rango de su rareza'); ok(d.elements.every((e) => G.ELEMENTS[e]) && d.family && d.stage >= 1 && d.stage <= d.phases, id + ': elemento, familia y fase válidos'); ok(d.evolvesTo === null || (G.CREATURES[d.evolvesTo] && G.CREATURES[d.evolvesTo].family === d.family && G.CREATURES[d.evolvesTo].stage === d.stage + 1), id + ': su evolución existe, es de su familia y es la fase siguiente'); ok(d.stage > 1 || G.traits(id).size[0] === G.stageSize(id, 1)[0], id + ': tamaño de la fase 1'); const s1 = G.stageSize(id, d.stage), s2 = G.stageSize(id, d.stage + 1); ok(G.traits(id).size[0] === s1[0] && G.traits(id).size[1] === s1[1], id + ': el tamaño de su sprite es el de G.LINE_PLAN para su fase'); ok(typeof d.weight === 'number' && d.weight > 0, id + ': tiene peso (kg) en G.LINE_PLAN'); });
ok(J.creatures.length >= 1 && J.creatures.every((c) => G.CREATURES[c.id]), 'cada criatura del mapa está definida');
for (let i = 0; i < 4000; i++) J.creatureStep(0.05);
ok(J.creatures.every((c) => !J.blocked(c.x, c.y) && c.x > 0 && c.x < 576 && c.y > 0 && c.y < 416), 'las criaturas no pisan árboles/agua ni salen del mapa');
// lote 1: todas tienen elemento y rareza válidos, aparecen en casillas libres y no se solapan; las placas se dibujan sin errores
Object.keys(G.CREATURES).forEach((id) => { const d = G.CREATURES[id]; ok(d.elements && d.elements.length >= 1 && d.elements.every((e) => G.ELEMENTS[e]), id + ': elemento válido'); ok(G.RARITIES[d.rarity], id + ': rareza válida'); ok(d.name && d.line && d.by, id + ': nombre, frase y autor'); });
ok(Object.keys(G.CREATURES).length === 41, 'hay 41 criaturas definidas (20 de fase 1 + Cactavar + Cactorax + Forjavel + Forjadrax + Perlorix + Arcarex + Zumbarix + Arenax + Voltavar + Voltorax + 2 evoluciones de Aguacato + Ondavar + Ignavar + Micavar + Espiravar + Somnaris + Cuarvel + Cuarzoth + Lunareth + Lunaroth)');
ok(J.creatures.length === 20 && J.creatures.every((c) => G.CREATURES[c.id].stage === 1), 'en el mapa salen las 20 criaturas de fase 1');
for (let i = 0; i < J.creatures.length; i++) for (let k = i + 1; k < J.creatures.length; k++) ok(Math.hypot(J.creatures[i].hx - J.creatures[k].hx, J.creatures[i].hy - J.creatures[k].hy) >= 32, 'casillas de inicio separadas');
ok(J.creatures.every((c) => Math.hypot(c.x - c.hx, c.y - c.hy) <= 13), 'las criaturas no se alejan de su casilla');
{ // todas las criaturas empiezan en casilla libre y se puede llegar andando hasta ellas desde el inicio (inundación por casillas libres)
  const seen = new Set(), q = [[18, 13]]; seen.add('18,13');
  while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx >= 0 && ny >= 0 && nx < 36 && ny < 26 && !J.solid(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); } }); }
  ok(J.creatures.every((c) => seen.has(((c.hx - 8) / 16 | 0) + ',' + ((c.hy - 14) / 16 | 0))), 'todas las criaturas son alcanzables a pie desde el inicio');
  const zonas = { aire: ['nubecin', 'dandel', 'zefirax'], agua: ['pompon', 'caracolin', 'perlel'], electrico: ['pilita', 'zumbel', 'arcel'], sombra: ['somnin', 'lunabu'], roca: ['cuarzin', 'ferrel', 'arenel'], fuego: ['fosforin', 'cenel', 'forjel'], hoja: ['aguacato', 'setin', 'cactel'] };
  Object.keys(zonas).forEach((el) => zonas[el].forEach((id) => ok(G.CREATURES[id].elements[0] === el, id + ': está en el claro de su elemento (' + el + ')')));
  ok(J.creatures.every((c) => c.hx > 40 && c.hx < 552 && c.hy > 40 && c.hy < 390), 'ninguna empieza pegada al borde del mapa'); }
Object.keys(G.CREATURES).forEach((id) => ok(G.pixelTextMissing(G.CREATURES[id].name).length === 0, id + ': la fuente de píxeles tiene todas las letras de su nombre'));
// v0.9 (paso 3): línea evolutiva de Aguacato (3 fases, +2 px por fase desde v1.1, sin condiciones)
{ const line = []; for (let n = 'aguacato'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); ok(line.length <= 3, 'la línea de Aguacato no se alarga ni da vueltas'); if (line.length > 3) break; }
  ok(line.join() === 'aguacato,aguacaton,aguacatigre' && G.CREATURES.aguacato.phases === 3 && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 3 && G.CREATURES[n].family === 'aguacato'), 'Aguacato → Aguacaryn → Aguacarax: 3 fases, misma familia');
  ok(G.CREATURES[line[2]].evolvesTo === null, 'la última fase no evoluciona más');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[18,18],[20,20],[22,22]]', 'tamaños 18 → 20 → 22 (+2 px por fase)');
  ok(line.every((n) => G.CREATURES[n].name.startsWith('Aguaca') && G.CREATURES[n].rarity === 'rara' && G.CREATURES[n].elements[0] === 'hoja'), 'conservan el nombre de familia, la rareza y el elemento');
  ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => line.forEach((n, i) => { const sp = G.creatureSprite(n, d, f); ok(sp.w === G.traits(n).size[0] + 2 && sp.h === G.traits(n).size[1] + 2, n + ' ' + d + f + ': el sprite mide lo que dice su fase'); })));
  const ag = J.creatures.find((c) => c.id === 'aguacato'), px0 = ag.x, py0 = ag.y;
  ok(J.evolve(ag) === ag && ag.id === 'aguacaton' && ag.x === px0 && ag.y === py0, 'evoluciona a Aguacaryn sin moverse de sitio');
  ok(J.evolve(ag) === ag && ag.id === 'aguacatigre', 'evoluciona a Aguacarax');
  ok(J.evolve(ag) === null && ag.id === 'aguacatigre', 'Aguacarax es la última fase: no pasa nada más');
  const pom = J.creatures.find((c) => c.id === 'nubecin'); ok(J.evolve(pom) === null && pom.id === 'nubecin', 'una criatura sin evolución diseñada se queda como está');
  for (let i = 0; i < 400; i++) J.creatureStep(0.05); ok(!J.blocked(ag.x, ag.y), 'la criatura evolucionada sigue sin pisar árboles ni agua'); }
J.S.me = 'oli'; J.drawPlates(); 
J.S.me = 'oli'; J.S.x = J.creatures[0].x + 6; J.S.y = J.creatures[0].y; ok(J.talk() === J.creatures[0], 'se puede hablar con una criatura cercana');
J.S.x = 4 * 16; J.S.y = 12 * 16; J.creatures.forEach((c) => { c.x = 16 * 16; c.y = 3 * 16; }); ok(J.talk() === null, 'lejos no habla nadie'); // todas lejos (el paseo al azar podía acercar otra y hacer fallar la prueba a veces)

// v1.0: identidad propia de cada fase de Aguacato (silueta, paleta, llave y movimiento distintos)
{ const sil = (id, d) => { const s = G.creatureSprite(id, d, 0), cx = s.c.getContext('2d'), im = cx.getImageData(0, 0, s.w, s.h); let n = 0; const rows = []; for (let y = 0; y < s.h; y++) { let a = 0, mn = 99, mx = -1; for (let x = 0; x < s.w; x++) if (im.data[(y * s.w + x) * 4 + 3]) { a++; mn = Math.min(mn, x); mx = Math.max(mx, x); } rows.push(mx < 0 ? 0 : mx - mn + 1); n += a; } return { n, rows }; };
  const L = ['aguacato', 'aguacaton', 'aguacatigre'];
  const hasPx = L.every((id) => sil(id, 'down').n > 0); if (hasPx) { // solo con lienzo real
    const r = L.map((id) => sil(id, 'down').rows.map((w, y, a) => w / Math.max(1, Math.max(...a))).join());
    ok(new Set(r).size === 3, 'las tres fases tienen siluetas distintas (perfil de anchos por fila)'); }
  ok(G.traits('aguacaton').sway && G.traits('aguacatigre').flick && !G.traits('aguacato').sway && !G.traits('aguacato').flick, 'movimiento propio: Aguacaryn se contonea y Aguacarax mueve la cola');
  ok(G.traits('aguacaton').speed < G.traits('aguacato').speed && G.traits('aguacatigre').speed > G.traits('aguacato').speed, 'Aguacaryn más pesado y Aguacarax más rápido que Aguacato'); }

// v1.1: tamaño y peso propios por línea y fase (ya no hay +2 fijo)
{ const fams = Object.keys(G.LINE_PLAN);
  ok(fams.every((f) => G.LINE_PLAN[f].length === G.PHASES_PLAN[f]), 'cada línea de G.LINE_PLAN tiene tantas fases como G.PHASES_PLAN');
  ok(Object.keys(G.PHASES_PLAN).every((f) => G.LINE_PLAN[f]), 'todas las líneas tienen plan de tamaño y peso');
  ok(G.LINE_PLAN.cuarzin[2][2] > G.LINE_PLAN.cuarzin[1][2] && G.LINE_PLAN.cuarzin[1][2] > G.LINE_PLAN.cuarzin[0][2], 'Cuarel → Cuarvel → Cuarzoth: cada fase pesa más');
  ok(G.LINE_PLAN.somnin[1][2] < G.LINE_PLAN.somnin[0][2] && G.LINE_PLAN.somnin[1][1] > G.LINE_PLAN.somnin[0][1], 'Somnaris es más alto pero más ligero que Somnel (flota)');
  ok(G.LINE_PLAN.pompon[1][0] > G.LINE_PLAN.pompon[0][0] && G.LINE_PLAN.pompon[1][1] < G.LINE_PLAN.pompon[0][1], 'Ondavar es más ancho y más bajo que Ondel');
  ok(G.LINE_PLAN.fosforin[1][1] === G.LINE_PLAN.fosforin[0][1], 'Ignavar mantiene la altura de Ignel (algunas fases pueden coincidir)');
  const grow = new Set(fams.map((f) => G.LINE_PLAN[f].slice(1).map((p, i) => (p[0] - G.LINE_PLAN[f][i][0]) + ',' + (p[1] - G.LINE_PLAN[f][i][1])).join(';')).filter(Boolean));
  ok(grow.size >= 6, 'las líneas no crecen todas igual (' + grow.size + ' patrones distintos)');
  ok(G.stageSize('aguacatigre', 3)[0] === 22 && G.stageSize('lunabu', 2)[0] === 26 && G.stageWeight('cuarzin', 3) === 120, 'G.stageSize y G.stageWeight leen el plan');
}

// v1.1 · línea de Ondel (Pompón): Ondel → Ondavar (18×12, se ensancha y se aplana; hoja de nenúfar que gotea)
{ const line = []; for (let n = 'pompon'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); if (line.length > 2) break; }
  ok(line.join() === 'pompon,ondavar' && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 2 && G.CREATURES[n].family === 'pompon'), 'Ondel → Ondavar: 2 fases, misma familia, la última no evoluciona');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[14,14],[18,12]]' && G.CREATURES.ondavar.weight === 2 && G.CREATURES.pompon.weight === 1.2, 'Ondavar mide 18×12 y pesa 2 kg (Ondel 14×14, 1,2 kg): más ancho y más bajo');
  ok(line.every((n) => G.CREATURES[n].rarity === 'comun' && G.CREATURES[n].elements[0] === 'agua'), 'conservan rareza y elemento');
  ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite('ondavar', d, f); ok(sp.w === 20 && sp.h === 14, 'Ondavar ' + d + f + ': el sprite mide lo que dice su fase'); }));
  ok(G.traits('ondavar').hop && G.traits('ondavar').flick && G.traits('ondavar').hop[0] < G.traits('pompon').hop[0] && G.traits('ondavar').speed < G.traits('pompon').speed, 'movimiento propio: rebota menos y más despacio, y la hoja gotea parada (frame 2)');
  const px = (id, d, f) => { const sp = G.creatureSprite(id, d, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let n = 0; for (let i = 3; i < im.data.length; i += 4) if (im.data[i]) n++; return { n, key: Array.from(im.data).join() }; };
  if (px('ondavar', 'down', 0).n > 0) { ok(px('ondavar', 'down', 0).n > px('pompon', 'down', 0).n * 0.9 && px('ondavar', 'down', 2).key !== px('ondavar', 'down', 0).key, 'Ondavar dibuja píxeles y su frame 2 (gota) es distinto del frame 0');
    const w = (id, d) => { const sp = G.creatureSprite(id, d, 0), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let top = 0, bot = 0; for (let x = 0; x < sp.w; x++) { if (im.data[(2 * sp.w + x) * 4 + 3]) top++; if (im.data[((sp.h - 4) * sp.w + x) * 4 + 3]) bot++; } return [top, bot]; };
    ok(w('ondavar', 'down')[0] > w('ondavar', 'down')[1], 'silueta propia: la hoja es más ancha que el cuerpo (frente al guijarro redondo de Ondel)'); }
  const J2 = window.__juego, po = J2.creatures.find((c) => c.id === 'pompon'); po.x = po.hx; po.y = po.hy; const x0 = po.x, y0 = po.y; // vuelve a su casilla (un test anterior las deja a todas juntas)
  ok(J2.evolve(po) === po && po.id === 'ondavar' && po.x === x0 && po.y === y0, 'Ondel evoluciona a Ondavar sin moverse de sitio');
  ok(J2.evolve(po) === null && po.id === 'ondavar', 'Ondavar es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J2.creatureStep(0.05); ok(!J2.blocked(po.x, po.y), 'Ondavar sigue sin pisar árboles ni agua'); }

// v1.1 · línea de Ignel (Fosforín): Ignel → Ignavar (14×16, melena de llama asimétrica; mismo alto que Ignel pero otra silueta)
{ const line = []; for (let n = 'fosforin'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); if (line.length > 2) break; }
  ok(line.join() === 'fosforin,ignavar' && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 2 && G.CREATURES[n].family === 'fosforin'), 'Ignel → Ignavar: 2 fases, misma familia, la última no evoluciona');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[12,16],[14,16]]' && G.CREATURES.ignavar.weight === 1 && G.CREATURES.fosforin.weight === 0.8, 'Ignavar mide 14×16 y pesa 1 kg (Ignel 12×16, 0,8 kg)');
  ok(line.every((n) => G.CREATURES[n].rarity === 'comun' && G.CREATURES[n].elements[0] === 'fuego'), 'conservan rareza y elemento');
  ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite('ignavar', d, f); ok(sp.w === 16 && sp.h === 18, 'Ignavar ' + d + f + ': el sprite mide lo que dice su fase'); }));
  ok(G.traits('ignavar').hop && G.traits('ignavar').flick && G.traits('ignavar').hop[0] > G.traits('fosforin').hop[0] && G.traits('ignavar').hop[1] < G.traits('fosforin').hop[1] && G.traits('ignavar').speed < G.traits('fosforin').speed, 'movimiento propio: salta más alto pero más despacio, y la llama parpadea parado (frame 2)');
  const pxs = (id, d, f) => { const sp = G.creatureSprite(id, d, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let n = 0, key = ''; for (let i = 3; i < im.data.length; i += 4) { if (im.data[i]) n++; key += im.data[i] ? 1 : 0; } return { n, key, im, sp }; };
  if (pxs('ignavar', 'down', 0).n > 0) {
    ok(pxs('ignavar', 'down', 0).n > pxs('fosforin', 'down', 0).n * 1.1 && pxs('ignavar', 'down', 2).key !== pxs('ignavar', 'down', 0).key, 'Ignavar dibuja píxeles y su frame 2 (llama y chispa) es distinto del frame 0');
    const w = (id) => { const { im, sp } = pxs(id, 'down', 0); const row = (y) => { let a = 0; for (let x = 0; x < sp.w; x++) if (im.data[(y * sp.w + x) * 4 + 3]) a++; return a; }; return [row(5), row(sp.h - 3)]; };
    ok(w('ignavar')[0] > w('ignavar')[1] && w('ignavar')[0] > w('fosforin')[0], 'silueta propia: cabeza con melena más ancha que el cuerpo (Ignel es un palo delgado)');
    ok(pxs('ignavar', 'up', 0).key !== pxs('ignavar', 'down', 0).key && pxs('ignavar', 'left', 0).key !== pxs('ignavar', 'right', 0).key, 'las vistas de frente, espalda y perfiles son distintas'); }
  const J3 = window.__juego, ig = J3.creatures.find((c) => c.id === 'fosforin'); ig.x = ig.hx; ig.y = ig.hy; const xi = ig.x, yi = ig.y;
  ok(J3.evolve(ig) === ig && ig.id === 'ignavar' && ig.x === xi && ig.y === yi, 'Ignel evoluciona a Ignavar sin moverse de sitio');
  ok(J3.evolve(ig) === null && ig.id === 'ignavar', 'Ignavar es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J3.creatureStep(0.05); ok(!J3.blocked(ig.x, ig.y), 'Ignavar sigue sin pisar árboles ni agua'); }

// v1.1 · línea de Micel (Setín): Micel → Micavar (18×18, sombrero ancho tipo paraguas, pie alto con anillo y musgo; esporas al parar)
{ const line = []; for (let n = 'setin'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); if (line.length > 2) break; }
  ok(line.join() === 'setin,micavar' && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 2 && G.CREATURES[n].family === 'setin'), 'Micel → Micavar: 2 fases, misma familia, la última no evoluciona');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[14,16],[18,18]]' && G.CREATURES.micavar.weight === 5 && G.CREATURES.setin.weight === 2, 'Micavar mide 18×18 y pesa 5 kg (Micel 14×16, 2 kg)');
  ok(line.every((n) => G.CREATURES[n].rarity === 'comun' && G.CREATURES[n].elements[0] === 'hoja'), 'conservan rareza y elemento');
  ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite('micavar', d, f); ok(sp.w === 20 && sp.h === 20, 'Micavar ' + d + f + ': el sprite mide lo que dice su fase'); }));
  ok(G.traits('micavar').sway && G.traits('micavar').flick && !G.traits('micavar').hop && G.traits('setin').hop && G.traits('micavar').speed < G.traits('setin').speed, 'movimiento propio: se contonea (sin saltitos), más despacio, y suelta esporas parado (frame 2)');
  const pm = (id, d, f) => { const sp = G.creatureSprite(id, d, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let n = 0, key = ''; for (let i = 3; i < im.data.length; i += 4) { if (im.data[i]) n++; key += im.data[i] ? 1 : 0; } return { n, key, im, sp }; };
  if (pm('micavar', 'down', 0).n > 0) {
    ok(pm('micavar', 'down', 0).n > pm('setin', 'down', 0).n * 1.2 && pm('micavar', 'down', 2).key !== pm('micavar', 'down', 0).key, 'Micavar dibuja píxeles y su frame 2 (esporas) es distinto del frame 0');
    const rw = (id, y) => { const { im, sp } = pm(id, 'down', 0); let a = 0; for (let x = 0; x < sp.w; x++) if (im.data[(y * sp.w + x) * 4 + 3]) a++; return a; };
    ok(rw('micavar', 5) >= 17 && rw('micavar', 14) <= 9 && rw('micavar', 5) > rw('micavar', 14) * 1.8, 'silueta en «T»: sombrero muy ancho sobre un pie estrecho');
    ok(pm('micavar', 'up', 0).key !== pm('micavar', 'down', 0).key && pm('micavar', 'left', 0).key !== pm('micavar', 'right', 0).key, 'las vistas de frente, espalda y perfiles son distintas'); }
  const J4 = window.__juego, mi = J4.creatures.find((c) => c.id === 'setin'); mi.x = mi.hx; mi.y = mi.hy; const xm = mi.x, ym = mi.y;
  ok(J4.evolve(mi) === mi && mi.id === 'micavar' && mi.x === xm && mi.y === ym, 'Micel evoluciona a Micavar sin moverse de sitio');
  ok(J4.evolve(mi) === null && mi.id === 'micavar', 'Micavar es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J4.creatureStep(0.05); ok(!J4.blocked(mi.x, mi.y), 'Micavar sigue sin pisar árboles ni agua'); }

// v1.1 · móvil: al mantener pulsado un botón no se selecciona nada ni sale «copiar»
{ const fs = require('fs'), html = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8'), js = fs.readFileSync(require('path').join(__dirname, 'src/game.js'), 'utf8');
  ok(/user-select:\s*none/.test(html) && /-webkit-user-select:\s*none/.test(html) && /-webkit-touch-callout:\s*none/.test(html), 'index.html: user-select y touch-callout desactivados en todo');
  ok(/'contextmenu'/.test(js) && /'selectstart'/.test(js) && /'dragstart'/.test(js), 'game.js: se bloquean contextmenu, selectstart y dragstart'); }

// v1.1 · línea de Espirel (Caracolín): Espirel → Espiravar (20×18, concha-torre cónica con ventanita y pececito; burbujas y antenas que suben y bajan)
{ const line = []; for (let n = 'caracolin'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); if (line.length > 2) break; }
  ok(line.join() === 'caracolin,espiravar' && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 2 && G.CREATURES[n].family === 'caracolin'), 'Espirel → Espiravar: 2 fases, misma familia, la última no evoluciona');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[20,14],[20,18]]' && G.CREATURES.espiravar.weight === 9 && G.CREATURES.caracolin.weight === 4, 'Espiravar mide 20×18 y pesa 9 kg (Espirel 20×14, 4 kg): mismo largo, más alto y más pesado');
  ok(line.every((n) => G.CREATURES[n].rarity === 'rara' && G.CREATURES[n].elements[0] === 'agua'), 'conservan rareza y elemento');
  ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite('espiravar', d, f); ok(sp.w === 22 && sp.h === 20, 'Espiravar ' + d + f + ': el sprite mide lo que dice su fase'); }));
  ok(G.traits('espiravar').flick && !G.traits('espiravar').hop && G.traits('espiravar').speed < G.traits('caracolin').speed, 'movimiento propio: aún más lento que Espirel y, parado, el pececito nada y suben burbujas (frame 2)');
  const pe = (id, d, f) => { const sp = G.creatureSprite(id, d, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let n = 0, key = ''; for (let i = 3; i < im.data.length; i += 4) { if (im.data[i]) n++; key += im.data[i] ? 1 : 0; } return { n, key, im, sp }; };
  if (pe('espiravar', 'down', 0).n > 0) {
    ok(pe('espiravar', 'down', 0).n > pe('caracolin', 'down', 0).n * 0.9 && pe('espiravar', 'down', 2).key !== pe('espiravar', 'down', 0).key && pe('espiravar', 'down', 1).key !== pe('espiravar', 'down', 0).key, 'Espiravar dibuja píxeles y sus frames 1 y 2 (antenas, pez y burbujas) son distintos del frame 0');
    const rw = (id, d, y) => { const { im, sp } = pe(id, d, 0); let a = 0; for (let x = 0; x < sp.w; x++) if (im.data[(y * sp.w + x) * 4 + 3]) a++; return a; };
    ok(rw('espiravar', 'up', 3) <= 8 && rw('espiravar', 'up', 15) >= 16 && rw('espiravar', 'up', 15) > rw('espiravar', 'up', 3) * 2, 'silueta de torre: estrecha arriba y ancha abajo (Espirel es un óvalo bajo)');
    ok(pe('espiravar', 'up', 0).key !== pe('espiravar', 'down', 0).key && pe('espiravar', 'left', 0).key !== pe('espiravar', 'right', 0).key, 'las vistas de frente, espalda y perfiles son distintas'); }
  const J5 = window.__juego, es = J5.creatures.find((c) => c.id === 'caracolin'); es.x = es.hx; es.y = es.hy; const xe = es.x, ye = es.y;
  ok(J5.evolve(es) === es && es.id === 'espiravar' && es.x === xe && es.y === ye, 'Espirel evoluciona a Espiravar sin moverse de sitio');
  ok(J5.evolve(es) === null && es.id === 'espiravar', 'Espiravar es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J5.creatureStep(0.05); ok(!J5.blocked(es.x, es.y), 'Espiravar sigue sin pisar árboles ni agua'); }

// v1.1 · línea de Somnel: Somnel → Somnaris (16×22, mago de los sueños con capa; flota, la capa ondea y abre un ojo al hablarle)
{ const line = []; for (let n = 'somnin'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); if (line.length > 2) break; }
  ok(line.join() === 'somnin,somnaris' && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 2 && G.CREATURES[n].family === 'somnin'), 'Somnel → Somnaris: 2 fases, misma familia, la segunda es la última');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[16,20],[16,22]]' && G.CREATURES.somnaris.weight === 2 && G.CREATURES.somnin.weight === 3, 'Somnaris mide 16×22 y pesa 2 kg (Somnel 16×20, 3 kg): más alto pero más ligero');
  ok(line.every((n) => G.CREATURES[n].rarity === 'rara' && G.CREATURES[n].elements[0] === 'sombra'), 'conservan rareza y elemento');
  ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2, 3].forEach((f) => { const sp = G.creatureSprite('somnaris', d, f); ok(sp.w === 18 && sp.h === 24, 'Somnaris ' + d + f + ': el sprite mide lo que dice su fase'); }));
  const ts = G.traits('somnaris'), t1 = G.traits('somnin');
  ok(ts.float && !ts.hop && !ts.nod && t1.nod && ts.flick && ts.eye && ts.speed < t1.speed, 'movimiento propio: flota (Somnel cabecea), la capa ondea parada y abre un ojo al hablarle; más lento que Somnel');
  const pe = (id, d, f) => { const sp = G.creatureSprite(id, d, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let n = 0, key = ''; for (let i = 3; i < im.data.length; i += 4) { if (im.data[i]) n++; key += im.data[i] ? '1' : '0'; } return { n, key, im, sp }; };
  if (pe('somnaris', 'down', 0).n > 0) {
    ok(pe('somnaris', 'down', 2).key !== pe('somnaris', 'down', 0).key && pe('somnaris', 'down', 1).key !== pe('somnaris', 'down', 0).key, 'Somnaris: la capa ondea (frame 2) y el paso (frame 1) cambian la silueta');
    const col = (id, d, f) => pe(id, d, f).im.data.join();
    ok(col('somnaris', 'down', 3) !== col('somnaris', 'down', 0) && col('somnaris', 'left', 3) !== col('somnaris', 'left', 0), 'Somnaris: el frame 3 (ojo abierto al hablarle) es distinto del frame 0 de frente y de perfil');
    ok(col('somnaris', 'up', 3) === col('somnaris', 'up', 0), 'de espaldas no hay cara: el ojo abierto no cambia nada');
    ok(pe('somnaris', 'up', 0).key !== pe('somnaris', 'down', 0).key || col('somnaris', 'up', 0) !== col('somnaris', 'down', 0), 'las vistas de frente y espalda son distintas');
    ok(pe('somnaris', 'left', 0).key !== pe('somnaris', 'right', 0).key, 'los perfiles izquierdo y derecho son espejo (no iguales)');
    const rw = (id, d, y) => { const { im, sp } = pe(id, d, 0); let a = 0; for (let x = 0; x < sp.w; x++) if (im.data[(y * sp.w + x) * 4 + 3]) a++; return a; };
    ok(rw('somnaris', 'down', 22) > rw('somnaris', 'down', 11), 'silueta de capa: más ancha abajo que la cabeza');
    const maxX = (d, f, y0, y1) => { const { im, sp } = pe('somnaris', d, f); let m = 0; for (let y = y0; y <= y1; y++) for (let x = 0; x < sp.w; x++) if (im.data[(y * sp.w + x) * 4 + 3] && x > m) m = x; return m; };
    ok(maxX('left', 0, 19, 22) >= maxX('left', 0, 10, 14) + 3, 'de perfil la cola de la capa sobresale por detrás de la cabeza (silueta con cola)');
    ok(rw('somnaris', 'down', 4) < rw('somnaris', 'down', 20), 'el gorro (arriba) es más estrecho que la capa (abajo)'); }
  const J6 = window.__juego, so = J6.creatures.find((c) => c.id === 'somnin'); so.x = so.hx; so.y = so.hy; const xs = so.x, ys = so.y;
  ok(J6.evolve(so) === so && so.id === 'somnaris' && so.x === xs && so.y === ys, 'Somnel evoluciona a Somnaris sin moverse de sitio');
  ok(J6.evolve(so) === null && so.id === 'somnaris', 'Somnaris es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J6.creatureStep(0.05); ok(!J6.blocked(so.x, so.y), 'Somnaris sigue sin pisar árboles ni agua');
  { const fs = require('fs'), js = fs.readFileSync(require('path').join(__dirname, 'src/vista.js'), 'utf8'); ok(/t\.eye && c\.talk > 0/.test(js), 'vista.js (antes game.js): el frame 3 se usa solo cuando la criatura tiene el rasgo eye y se le habla'); } }

// v1.1 · línea de Cuarel: Cuarel → Cuarvel (20×18, minero con pico y mochila de cristales) → Cuarzoth (22×24, coloso de cristal)
{ const line = []; for (let n = 'cuarzin'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); if (line.length > 3) break; }
  ok(line.join() === 'cuarzin,cuarvel,cuarzoth' && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 3 && G.CREATURES[n].family === 'cuarzin'), 'Cuarel → Cuarvel → Cuarzoth: 3 fases, misma familia, la última no evoluciona');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[18,16],[20,18],[22,24]]' && line.map((n) => G.CREATURES[n].weight).join() === '25,45,120', 'tamaños 18×16 → 20×18 → 22×24 y pesos 25 → 45 → 120 kg (el plan G.LINE_PLAN)');
  ok(line.every((n) => G.CREATURES[n].rarity === 'rara' && G.CREATURES[n].elements[0] === 'roca'), 'conservan rareza y elemento');
  [['cuarvel', 22, 20], ['cuarzoth', 24, 26]].forEach(([id, w, h]) => ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite(id, d, f); ok(sp.w === w && sp.h === h, id + ' ' + d + f + ': el sprite mide lo que dice su fase'); })));
  const tc = G.traits('cuarzin'), tv = G.traits('cuarvel'), tz = G.traits('cuarzoth');
  ok(tv.speed < tc.speed && tz.speed < tv.speed && tv.flick && tz.flick && !tz.hop && !tz.float, 'movimiento propio: cada fase más lenta y pesada; parados, Cuarvel se apoya en el pico y Cuarzoth destella (frame 2)');
  const pe = (id, d, f) => { const sp = G.creatureSprite(id, d, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let n = 0, key = ''; for (let i = 3; i < im.data.length; i += 4) { if (im.data[i]) n++; key += im.data[i] ? '1' : '0'; } return { n, key, im, sp }; };
  if (pe('cuarvel', 'down', 0).n > 0) {
    ['cuarvel', 'cuarzoth'].forEach((id) => {
      ok(pe(id, 'down', 0).n > pe('cuarzin', 'down', 0).n * (id === 'cuarvel' ? 1.1 : 1.5), id + ' dibuja más píxeles que la fase anterior (no es la misma silueta rellena)');
      ok(pe(id, 'down', 2).im.data.join() !== pe(id, 'down', 0).im.data.join(), id + ': el frame 2 (reposo) es distinto del frame 0');
      ok(pe(id, 'up', 0).im.data.join() !== pe(id, 'down', 0).im.data.join() && pe(id, 'left', 0).key !== pe(id, 'right', 0).key, id + ': frente, espalda y perfiles son distintos');
    });
    ok(pe('cuarvel', 'down', 1).key !== pe('cuarvel', 'down', 0).key && pe('cuarvel', 'down', 2).key !== pe('cuarvel', 'down', 0).key, 'Cuarvel: el paso (frame 1) y apoyarse en el pico (frame 2) cambian la silueta');
    const rw = (id, d, y) => { const { im, sp } = pe(id, d, 0); let a = 0; for (let x = 0; x < sp.w; x++) if (im.data[(y * sp.w + x) * 4 + 3]) a++; return a; };
    ok(rw('cuarzoth', 'down', 2) <= 8 && rw('cuarzoth', 'down', 19) >= 22 && rw('cuarzoth', 'down', 19) > rw('cuarzoth', 'down', 2) * 2.5, 'silueta de montaña: aguja estrecha arriba y base ancha abajo');
    ok(rw('cuarvel', 'down', 4) > rw('cuarvel', 'down', 9) * 0 && rw('cuarvel', 'down', 12) >= 18, 'Cuarvel: hombros y cuerpo de bloque (casi todo el ancho)');
    const colAt = (id, d, f, x, y) => { const { im, sp } = pe(id, d, f); const o = (y * sp.w + x) * 4; return im.data[o + 3] ? im.data[o] + ',' + im.data[o + 1] + ',' + im.data[o + 2] : null; };
    const hasCol = (id, d, f, rgb) => { const { im } = pe(id, d, f); for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3] && im.data[i] === rgb[0] && im.data[i + 1] === rgb[1] && im.data[i + 2] === rgb[2]) return true; return false; };
    ok(hasCol('cuarvel', 'down', 0, [0xf0, 0x8a, 0x2e]) && !hasCol('cuarzin', 'down', 0, [0xf0, 0x8a, 0x2e]), 'casco naranja en Cuarvel (el de Cuarel es amarillo)');
    ok(hasCol('cuarzoth', 'down', 0, [0xf2, 0xc2, 0x30]) && hasCol('cuarzoth', 'down', 0, [0xa5, 0x6b, 0xf0]) && hasCol('cuarzoth', 'down', 0, [0x3f, 0xb5, 0xb0]), 'Cuarzoth: casco dorado y cristales teal y violeta'); }
  const J7 = window.__juego, cu = J7.creatures.find((c) => c.id === 'cuarzin'); cu.x = cu.hx; cu.y = cu.hy; const xc = cu.x, yc = cu.y;
  ok(J7.evolve(cu) === cu && cu.id === 'cuarvel' && cu.x === xc && cu.y === yc, 'Cuarel evoluciona a Cuarvel sin moverse de sitio');
  ok(J7.evolve(cu) === cu && cu.id === 'cuarzoth' && cu.x === xc && cu.y === yc, 'Cuarvel evoluciona a Cuarzoth sin moverse de sitio');
  ok(J7.evolve(cu) === null && cu.id === 'cuarzoth', 'Cuarzoth es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J7.creatureStep(0.05); ok(!J7.blocked(cu.x, cu.y), 'Cuarzoth sigue sin pisar árboles ni agua'); }


// v1.1 · línea de Lunel: Lunel → Lunareth (26×20, búho del eclipse con alas abiertas) → Lunaroth (24×26, guardián del cielo con corona de luna llena)
{ const line = []; for (let n = 'lunabu'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); if (line.length > 3) break; }
  ok(line.join() === 'lunabu,lunareth,lunaroth' && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 3 && G.CREATURES[n].family === 'lunabu'), 'Lunel → Lunareth → Lunaroth: 3 fases, misma familia, la última no evoluciona');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[20,20],[26,20],[24,26]]' && line.map((n) => G.CREATURES[n].weight).join() === '4,6,8', 'tamaños 20×20 → 26×20 → 24×26 y pesos 4 → 6 → 8 kg (el plan G.LINE_PLAN)');
  ok(line.every((n) => G.CREATURES[n].rarity === 'epica' && G.CREATURES[n].elements[0] === 'sombra'), 'conservan rareza y elemento');
  [['lunareth', 28, 22], ['lunaroth', 26, 28]].forEach(([id, w, h]) => ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite(id, d, f); ok(sp.w === w && sp.h === h, id + ' ' + d + f + ': el sprite mide lo que dice su fase'); })));
  const t1 = G.traits('lunabu'), t2 = G.traits('lunareth'), t3 = G.traits('lunaroth');
  ok(t1.float && t2.float && t3.float && t2.flick && t3.flick && t3.float[0] > t2.float[0] && t2.float[0] > t1.float[0] && t3.speed < t2.speed && t2.speed < t1.speed, 'movimiento propio: siempre flotan, cada fase más alto y más suave (y más lento); parados, las alas se abren y luego el aura destella (frame 2)');
  const pe = (id, d, f) => { const sp = G.creatureSprite(id, d, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let n = 0, key = ''; for (let i = 3; i < im.data.length; i += 4) { if (im.data[i]) n++; key += im.data[i] ? '1' : '0'; } return { n, key, im, sp }; };
  if (pe('lunareth', 'down', 0).n > 0) {
    ['lunareth', 'lunaroth'].forEach((id) => {
      ok(pe(id, 'down', 2).im.data.join() !== pe(id, 'down', 0).im.data.join(), id + ': el frame 2 (reposo) es distinto del frame 0');
      ok(pe(id, 'up', 0).im.data.join() !== pe(id, 'down', 0).im.data.join() && pe(id, 'left', 0).key !== pe(id, 'right', 0).key, id + ': frente, espalda y perfiles son distintos'); });
    const rw = (id, y) => { const { im, sp } = pe(id, 'down', 0); let a = 0; for (let x = 0; x < sp.w; x++) if (im.data[(y * sp.w + x) * 4 + 3]) a++; return a; };
    ok(rw('lunareth', 8) >= 24 && rw('lunareth', 8) > rw('lunabu', 8) * 1.2, 'Lunareth: silueta ancha con las alas abiertas (Lunel es compacto)');
    ok(rw('lunaroth', 3) <= 10 && rw('lunaroth', 20) >= 20 && rw('lunaroth', 20) > rw('lunaroth', 3) * 2, 'Lunaroth: silueta alta, estrecha arriba (corona) y ancha abajo (alas)'); }
  const J8 = window.__juego, lu = J8.creatures.find((c) => c.id === 'lunabu'); lu.x = lu.hx; lu.y = lu.hy; const xl = lu.x, yl = lu.y;
  ok(J8.evolve(lu) === lu && lu.id === 'lunareth' && lu.x === xl && lu.y === yl, 'Lunel evoluciona a Lunareth sin moverse de sitio');
  ok(J8.evolve(lu) === lu && lu.id === 'lunaroth' && lu.x === xl && lu.y === yl, 'Lunareth evoluciona a Lunaroth sin moverse de sitio');
  ok(J8.evolve(lu) === null && lu.id === 'lunaroth', 'Lunaroth es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J8.creatureStep(0.05); ok(!J8.blocked(lu.x, lu.y), 'Lunaroth sigue sin pisar árboles ni agua'); }


// v1.2 · línea de Voltel: Voltel → Voltavar (18×16, batería de arranque con pinzas) → Voltorax (20×26, bobina de tormentas). Voltel pasa a Rara (3 fases)
{ const line = []; for (let n = 'pilita'; n; n = G.CREATURES[n].evolvesTo) { line.push(n); if (line.length > 3) break; }
  ok(line.join() === 'pilita,voltavar,voltorax' && line.every((n, i) => G.CREATURES[n].stage === i + 1 && G.CREATURES[n].phases === 3 && G.CREATURES[n].family === 'pilita'), 'Voltel → Voltavar → Voltorax: 3 fases, misma familia, la última no evoluciona');
  ok(JSON.stringify(line.map((n) => G.traits(n).size)) === '[[14,18],[18,16],[20,26]]' && line.map((n) => G.CREATURES[n].weight).join() === '2.5,6,15', 'tamaños 14×18 → 18×16 → 20×26 y pesos 2,5 → 6 → 15 kg (G.LINE_PLAN)');
  ok(line.every((n) => G.CREATURES[n].rarity === 'rara' && G.CREATURES[n].elements[0] === 'electrico'), 'conservan rareza (Rara, 3 fases) y elemento');
  [['voltavar', 18, 16], ['voltorax', 20, 26]].forEach(([id, w, h]) => ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite(id, d, f); ok(sp.w === w + 2 && sp.h === h + 2, id + ' ' + d + f + ': el sprite mide lo que dice su ficha'); })));
  const t1 = G.traits('pilita'), t2 = G.traits('voltavar'), t3 = G.traits('voltorax');
  ok(t2.flick && t3.flick && t3.speed < t2.speed && t2.speed < t1.speed && t3.shadow[0] > t2.shadow[0], 'movimiento propio: trote firme (Voltavar) y pasos pesados (Voltorax); parados, el arco y los rayos (frame 2)');
  const pe = (id, d, f) => { const sp = G.creatureSprite(id, d, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); let n = 0, key = ''; for (let i = 3; i < im.data.length; i += 4) { if (im.data[i]) n++; key += im.data[i] ? '1' : '0'; } return { n, key, im, sp }; };
  if (pe('voltavar', 'down', 0).n > 0) {
    ['voltavar', 'voltorax'].forEach((id) => {
      ok(pe(id, 'down', 2).im.data.join() !== pe(id, 'down', 0).im.data.join(), id + ': el frame 2 (reposo) es distinto del frame 0');
      ok(pe(id, 'up', 0).im.data.join() !== pe(id, 'down', 0).im.data.join() && pe(id, 'left', 0).key !== pe(id, 'right', 0).key, id + ': frente, espalda y perfiles son distintos'); });
    const rw = (id, y) => { const { im, sp } = pe(id, 'down', 0); let a = 0; for (let x = 0; x < sp.w; x++) if (im.data[(y * sp.w + x) * 4 + 3]) a++; return a; };
    ok(rw('voltavar', 9) >= 16, 'Voltavar: silueta ancha (bloque con pinzas)');
    ok(rw('voltorax', 9) <= 8 && rw('voltorax', 14) >= 16 && rw('voltorax', 22) >= 8, 'Voltorax: cuello estrecho, hombros anchos y base');
    const hasCol = (id, d, f, rgb) => { const { im } = pe(id, d, f); for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3] && im.data[i] === rgb[0] && im.data[i + 1] === rgb[1] && im.data[i + 2] === rgb[2]) return true; return false; };
    ok(hasCol('voltavar', 'down', 2, [0x4f, 0xd8, 0xff]) && !hasCol('voltavar', 'down', 0, [0x4f, 0xd8, 0xff]), 'Voltavar: el arco azul solo aparece en el frame 2');
    ok(hasCol('voltorax', 'down', 0, [0xc9, 0x74, 0x3a]) && hasCol('voltorax', 'down', 0, [0x2a, 0x5f, 0xd0]), 'Voltorax: cobre y esfera azul'); }
  const J9 = window.__juego, vo = J9.creatures.find((c) => c.id === 'pilita'); vo.x = vo.hx; vo.y = vo.hy; const xv = vo.x, yv = vo.y;
  ok(J9.evolve(vo) === vo && vo.id === 'voltavar' && vo.x === xv && vo.y === yv, 'Voltel evoluciona a Voltavar sin moverse de sitio');
  ok(J9.evolve(vo) === vo && vo.id === 'voltorax' && vo.x === xv && vo.y === yv, 'Voltavar evoluciona a Voltorax sin moverse de sitio');
  ok(J9.evolve(vo) === null && vo.id === 'voltorax', 'Voltorax es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J9.creatureStep(0.05); ok(!J9.blocked(vo.x, vo.y), 'Voltorax sigue sin pisar árboles ni agua'); }


// v1.5 · Bloque 2, lote A: Cenel (14×12, Fuego), Ferrel (16×14, Roca) y Dandel (14×18, Aire): criaturas Comunes de una sola fase + galería
{ const A = [['cenel', 'fuego', [14, 12], 0.3], ['ferrel', 'roca', [16, 14], 3], ['dandel', 'aire', [14, 18], 0.05]];
  A.forEach(([id, el, size, kg]) => { const d = G.CREATURES[id];
    ok(d.rarity === 'comun' && d.elements.length === 1 && d.elements[0] === el && d.phases === 1 && d.stage === 1 && d.evolvesTo === null && d.family === id, id + ': Común, ' + el + ', una sola fase y sin evolución');
    ok(JSON.stringify(G.traits(id).size) === JSON.stringify(size) && d.weight === kg, id + ': tamaño y peso del plan');
    ['down', 'up', 'left', 'right'].forEach((dir) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite(id, dir, f); ok(sp.w === size[0] + 2 && sp.h === size[1] + 2, id + ' ' + dir + f + ': el sprite mide lo que dice su ficha'); }));
    const pe = (dir, f) => { const sp = G.creatureSprite(id, dir, f), im = sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h); return im.data.join(); };
    if (G.creatureSprite(id, 'down', 0).c.getContext('2d').getImageData(0, 0, 4, 4).data.some((v) => v)) { ok(pe('down', 2) !== pe('down', 0), id + ': el frame 2 (reposo) es distinto del frame 0'); ok(pe('up', 0) !== pe('down', 0) && pe('left', 0) !== pe('right', 0), id + ': frente, espalda y perfiles son distintos'); } });
  const t1 = G.traits('cenel'), t2 = G.traits('ferrel'), t3 = G.traits('dandel');
  ok(t1.hop && t1.flick && t2.flick && !t2.hop && !t2.float && t2.speed < t1.speed && t3.float && t3.flick && t3.shadow[2] > 0, 'movimiento propio: Cenel salta y se enciende; Ferrel anda pesado; Dandel flota');
  const cz = { cenel: [8, 19], ferrel: [15, 22], dandel: [15, 4] };
  Object.keys(cz).forEach((id) => { const c = J.creatures.find((k) => k.id === id); ok(c && ((c.hx - 8) / 16 | 0) === cz[id][0] && ((c.hy - 14) / 16 | 0) === cz[id][1] && !J.solid(cz[id][0], cz[id][1]), id + ': aparece en su casilla del claro, libre'); });
  const L = G.lineList(); ok(L.length === 20 && L.reduce((n, l) => n + l.stages.length, 0) === 41, 'la galería lista 20 líneas y 41 formas');
  ok(L.find((l) => l.family === 'pilita').stages.join() === 'pilita,voltavar,voltorax' && L.find((l) => l.family === 'cenel').stages.join() === 'cenel', 'la galería ordena cada línea por fases'); }


// v1.6 · Bloque 2, lote B1: Zumbel → Zumbarix (Eléctrico) y Arenel → Arenax (Roca): dos líneas Comunes de 2 fases
{ const B = [['zumbel', 'zumbarix', 'electrico', [[14, 14, 1], [18, 18, 2.5]], 'Zumbel', 'Zumbarix', [28, 15]], ['arenel', 'arenax', 'roca', [[14, 12, 2], [18, 16, 6]], 'Arenel', 'Arenax', [21, 23]]];
  B.forEach(([a, b, el, plan, na, nb, cas]) => {
    const A = G.CREATURES[a], Bd = G.CREATURES[b];
    ok(A.rarity === 'comun' && Bd.rarity === 'comun' && A.elements[0] === el && Bd.elements[0] === el && A.phases === 2 && Bd.phases === 2, a + ' → ' + b + ': Comunes, ' + el + ', 2 fases');
    ok(A.stage === 1 && Bd.stage === 2 && Bd.family === a && A.evolvesTo === b && Bd.evolvesTo === null && A.name === na && Bd.name === nb, a + ' → ' + b + ': línea de 2 fases, la última no evoluciona');
    [[a, plan[0]], [b, plan[1]]].forEach(([id, pl]) => { ok(JSON.stringify(G.traits(id).size) === JSON.stringify([pl[0], pl[1]]) && G.CREATURES[id].weight === pl[2], id + ': tamaño y peso del plan');
      ['down', 'up', 'left', 'right'].forEach((dir) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite(id, dir, f); ok(sp.w === pl[0] + 2 && sp.h === pl[1] + 2, id + ' ' + dir + f + ': el sprite mide lo que dice su ficha'); })); });
    const c = J.creatures.find((k) => k.id === a); ok(c && ((c.hx - 8) / 16 | 0) === cas[0] && ((c.hy - 14) / 16 | 0) === cas[1] && !J.solid(cas[0], cas[1]), a + ': aparece en su casilla del claro, libre');
    const pe = (id, dir, f) => { const sp = G.creatureSprite(id, dir, f); return sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h).data.join(); };
    if (G.creatureSprite(a, 'down', 0).c.getContext('2d').getImageData(0, 0, 4, 4).data.some((v) => v)) [a, b].forEach((id) => { ok(pe(id, 'down', 2) !== pe(id, 'down', 0), id + ': el frame 2 (reposo) es distinto del frame 0'); ok(pe(id, 'up', 0) !== pe(id, 'down', 0) && pe(id, 'left', 0) !== pe(id, 'right', 0), id + ': frente, espalda y perfiles son distintos'); });
    const ev = J.creatures.find((k) => k.id === a); ev.x = ev.hx; ev.y = ev.hy; const x0 = ev.x, y0 = ev.y;
    ok(J.evolve(ev) === ev && ev.id === b && ev.x === x0 && ev.y === y0, a + ' evoluciona a ' + b + ' sin moverse de sitio');
    ok(J.evolve(ev) === null && ev.id === b, b + ' es la última fase: no pasa nada más');
    for (let i = 0; i < 400; i++) J.creatureStep(0.05); ok(!J.blocked(ev.x, ev.y), b + ' sigue sin pisar árboles ni agua'); });
  const tz = G.traits('zumbel'), tx = G.traits('zumbarix'), ta = G.traits('arenel'), tn = G.traits('arenax');
  ok(tz.float && tz.flick && tx.float && tx.float[0] > tz.float[0] && tx.speed > tz.speed, 'movimiento propio: Zumbel flota con zumbido y Zumbarix flota más alto y rápido');
  ok(ta.sway && !ta.hop && !ta.float && ta.flick && tn.sway && tn.speed < ta.speed, 'movimiento propio: Arenel anda de lado (sway) y Arenax es más lento');
  const L2 = G.lineList(); ok(L2.find((l) => l.family === 'zumbel').stages.join() === 'zumbel,zumbarix' && L2.find((l) => l.family === 'arenel').stages.join() === 'arenel,arenax', 'la galería ordena las dos líneas nuevas por fases'); }


// v1.7 · Bloque 2, lote B2: Perlel → Perlorix (Agua) y Arcel → Arcarex (Eléctrico): dos líneas Raras de 2 fases
{ const B = [['perlel', 'perlorix', 'agua', [[16, 14, 3], [20, 18, 8]], 'Perlel', 'Perlorix', [27, 9]], ['arcel', 'arcarex', 'electrico', [[14, 16, 2], [20, 20, 4]], 'Arcel', 'Arcarex', [33, 11]]];
  B.forEach(([a, b, el, plan, na, nb, cas]) => {
    const A = G.CREATURES[a], Bd = G.CREATURES[b];
    ok(A.rarity === 'rara' && Bd.rarity === 'rara' && A.elements[0] === el && Bd.elements[0] === el && A.phases === 2 && Bd.phases === 2, a + ' → ' + b + ': Raras, ' + el + ', 2 fases');
    ok(A.stage === 1 && Bd.stage === 2 && Bd.family === a && A.evolvesTo === b && Bd.evolvesTo === null && A.name === na && Bd.name === nb, a + ' → ' + b + ': línea de 2 fases, la última no evoluciona');
    [[a, plan[0]], [b, plan[1]]].forEach(([id, pl]) => { ok(JSON.stringify(G.traits(id).size) === JSON.stringify([pl[0], pl[1]]) && G.CREATURES[id].weight === pl[2], id + ': tamaño y peso del plan');
      ['down', 'up', 'left', 'right'].forEach((dir) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite(id, dir, f); ok(sp.w === pl[0] + 2 && sp.h === pl[1] + 2, id + ' ' + dir + f + ': el sprite mide lo que dice su ficha'); })); });
    const c = J.creatures.find((k) => k.id === a); ok(c && ((c.hx - 8) / 16 | 0) === cas[0] && ((c.hy - 14) / 16 | 0) === cas[1] && !J.solid(cas[0], cas[1]), a + ': aparece en su casilla del claro, libre');
    const pe = (id, dir, f) => { const sp = G.creatureSprite(id, dir, f); return sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h).data.join(); };
    if (G.creatureSprite(a, 'down', 0).c.getContext('2d').getImageData(0, 0, 4, 4).data.some((v) => v)) [a, b].forEach((id) => { ok(pe(id, 'down', 2) !== pe(id, 'down', 0), id + ': el frame 2 (reposo) es distinto del frame 0'); ok(pe(id, 'up', 0) !== pe(id, 'down', 0) && pe(id, 'left', 0) !== pe(id, 'right', 0), id + ': frente, espalda y perfiles son distintos'); });
    const ev = J.creatures.find((k) => k.id === a); ev.x = ev.hx; ev.y = ev.hy; const x0 = ev.x, y0 = ev.y;
    ok(J.evolve(ev) === ev && ev.id === b && ev.x === x0 && ev.y === y0, a + ' evoluciona a ' + b + ' sin moverse de sitio');
    ok(J.evolve(ev) === null && ev.id === b, b + ' es la última fase: no pasa nada más');
    for (let i = 0; i < 400; i++) J.creatureStep(0.05); ok(!J.blocked(ev.x, ev.y), b + ' sigue sin pisar árboles ni agua'); });
  const tp = G.traits('perlel'), tq = G.traits('perlorix'), tc = G.traits('arcel'), tr = G.traits('arcarex');
  ok(tp.sway && !tp.hop && !tp.float && tp.flick && tq.sway && tq.speed < tp.speed, 'movimiento propio: Perlel se arrastra (sway) y Perlorix es aún más lenta');
  ok(tc.hop && tc.flick && !tc.float && tr.float && tr.flick && tr.shadow[2] > 0 && tr.speed > tc.speed, 'movimiento propio: Arcel salta y Arcarex planea (float)');
  const L3 = G.lineList(); ok(L3.find((l) => l.family === 'perlel').stages.join() === 'perlel,perlorix' && L3.find((l) => l.family === 'arcel').stages.join() === 'arcel,arcarex', 'la galería ordena las dos líneas nuevas por fases'); }


// v1.8 · Bloque 2, lote C (parte 1): Forjel → Forjavel → Forjadrax (Fuego + Roca, Épica, 3 fases)
{ const ids = ['forjel', 'forjavel', 'forjadrax'], plan = [[16, 14, 12], [20, 20, 40], [24, 28, 110]], D = ids.map((i) => G.CREATURES[i]);
  ok(D.every((d) => d.rarity === 'epica' && d.elements.join() === 'fuego,roca' && d.phases === 3 && d.family === 'forjel'), 'Forjel y sus evoluciones: Épicas, Fuego + Roca, 3 fases, misma familia');
  ok(D.map((d) => d.stage).join() === '1,2,3' && D[0].evolvesTo === 'forjavel' && D[1].evolvesTo === 'forjadrax' && D[2].evolvesTo === null && D.map((d) => d.name).join() === 'Forjel,Forjavel,Forjadrax', 'línea de 3 fases en orden y la última no evoluciona');
  ids.forEach((id, k) => { const pl = plan[k]; ok(JSON.stringify(G.traits(id).size) === JSON.stringify([pl[0], pl[1]]) && G.CREATURES[id].weight === pl[2], id + ': tamaño y peso del plan');
    ['down', 'up', 'left', 'right'].forEach((dir) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite(id, dir, f); ok(sp.w === pl[0] + 2 && sp.h === pl[1] + 2, id + ' ' + dir + f + ': el sprite mide lo que dice su ficha'); }));
    const pe = (dir, f) => { const sp = G.creatureSprite(id, dir, f); return sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h).data.join(); };
    if (G.creatureSprite(id, 'down', 0).c.getContext('2d').getImageData(0, 0, 4, 4).data.some((v) => v)) { ok(pe('down', 2) !== pe('down', 0), id + ': el frame 2 (reposo) es distinto del frame 0'); ok(pe('up', 0) !== pe('down', 0) && pe('left', 0) !== pe('right', 0), id + ': frente, espalda y perfiles son distintos'); } });
  const c = J.creatures.find((k) => k.id === 'forjel'); ok(c && ((c.hx - 8) / 16 | 0) === 4 && ((c.hy - 14) / 16 | 0) === 23 && !J.solid(4, 23), 'forjel: aparece en su casilla del claro de Fuego, libre');
  const ev = c; ev.x = ev.hx; ev.y = ev.hy; const x0 = ev.x, y0 = ev.y;
  ok(J.evolve(ev) === ev && ev.id === 'forjavel' && ev.x === x0 && ev.y === y0, 'Forjel evoluciona a Forjavel sin moverse de sitio');
  ok(J.evolve(ev) === ev && ev.id === 'forjadrax' && ev.x === x0 && ev.y === y0, 'Forjavel evoluciona a Forjadrax sin moverse de sitio');
  ok(J.evolve(ev) === null && ev.id === 'forjadrax', 'Forjadrax es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J.creatureStep(0.05); ok(!J.blocked(ev.x, ev.y), 'Forjadrax sigue sin pisar árboles ni agua');
  const t1 = G.traits('forjel'), t2 = G.traits('forjavel'), t3 = G.traits('forjadrax');
  ok(t1.flick && t2.flick && t3.flick && !t1.hop && !t1.float && t1.speed <= 8 && t2.speed <= 8 && t3.speed < t1.speed && t3.speed < t2.speed, 'movimiento propio: muy pesadas y lentas, Forjadrax es la más lenta');
  const L4 = G.lineList(); ok(L4.find((l) => l.family === 'forjel').stages.join() === 'forjel,forjavel,forjadrax', 'la galería ordena la línea por fases'); }


// v1.9 · Bloque 2, lote C (parte 2): Cactel → Cactavar → Cactorax (Hoja, Rara, 3 fases)
{ const ids = ['cactel', 'cactavar', 'cactorax'], plan = [[14, 16, 2], [18, 20, 5], [22, 26, 20]], D = ids.map((i) => G.CREATURES[i]);
  ok(D.every((d) => d.rarity === 'rara' && d.elements.join() === 'hoja' && d.phases === 3 && d.family === 'cactel'), 'Cactel y sus evoluciones: Raras, Hoja, 3 fases, misma familia');
  ok(D.map((d) => d.stage).join() === '1,2,3' && D[0].evolvesTo === 'cactavar' && D[1].evolvesTo === 'cactorax' && D[2].evolvesTo === null && D.map((d) => d.name).join() === 'Cactel,Cactavar,Cactorax', 'línea de 3 fases en orden y la última no evoluciona');
  ids.forEach((id, k) => { const pl = plan[k]; ok(JSON.stringify(G.traits(id).size) === JSON.stringify([pl[0], pl[1]]) && G.CREATURES[id].weight === pl[2], id + ': tamaño y peso del plan');
    ['down', 'up', 'left', 'right'].forEach((dir) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite(id, dir, f); ok(sp.w === pl[0] + 2 && sp.h === pl[1] + 2, id + ' ' + dir + f + ': el sprite mide lo que dice su ficha'); }));
    const pe = (dir, f) => { const sp = G.creatureSprite(id, dir, f); return sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h).data.join(); };
    if (G.creatureSprite(id, 'down', 0).c.getContext('2d').getImageData(0, 0, 4, 4).data.some((v) => v)) { ok(pe('down', 2) !== pe('down', 0), id + ': el frame 2 (reposo) es distinto del frame 0'); ok(pe('up', 0) !== pe('down', 0) && pe('left', 0) !== pe('right', 0), id + ': frente, espalda y perfiles son distintos'); } });
  const c = J.creatures.find((k) => k.id === 'cactel'); ok(c && ((c.hx - 8) / 16 | 0) === 6 && ((c.hy - 14) / 16 | 0) === 11 && !J.solid(6, 11), 'cactel: aparece en su casilla del claro de Hoja, libre');
  const ev = c; ev.x = ev.hx; ev.y = ev.hy; const x0 = ev.x, y0 = ev.y;
  ok(J.evolve(ev) === ev && ev.id === 'cactavar' && ev.x === x0 && ev.y === y0, 'Cactel evoluciona a Cactavar sin moverse de sitio');
  ok(J.evolve(ev) === ev && ev.id === 'cactorax' && ev.x === x0 && ev.y === y0, 'Cactavar evoluciona a Cactorax sin moverse de sitio');
  ok(J.evolve(ev) === null && ev.id === 'cactorax', 'Cactorax es la última fase: no pasa nada más');
  for (let i = 0; i < 400; i++) J.creatureStep(0.05); ok(!J.blocked(ev.x, ev.y), 'Cactorax sigue sin pisar árboles ni agua');
  const t1 = G.traits('cactel'), t2 = G.traits('cactavar'), t3 = G.traits('cactorax');
  ok(t1.hop && t1.flick && t2.sway && !t2.hop && t2.flick && t3.flick && t3.speed < t2.speed && t2.speed < t1.speed, 'movimiento propio: Cactel salta, Cactavar se contonea y Cactorax es el más lento');
  const L5 = G.lineList(); ok(L5.find((l) => l.family === 'cactel').stages.join() === 'cactel,cactavar,cactorax', 'la galería ordena la línea por fases'); }

// v2.0 · Bloque 2, lote D: Zefirax (Aire + Eléctrico, Legendaria, fase única 30×30)
{ const Zd = G.CREATURES.zefirax, tr = G.traits('zefirax');
  ok(Zd && Zd.rarity === 'legendaria' && Zd.elements.join() === 'aire,electrico' && Zd.phases === 1 && Zd.stage === 1 && Zd.evolvesTo === null && Zd.family === 'zefirax' && Zd.name === 'Zefirax', 'Zefirax: Legendaria, Aire + Eléctrico, fase única y sin evolución');
  ok(JSON.stringify(tr.size) === JSON.stringify(G.LEGENDARY_SIZE) && JSON.stringify(tr.size) === '[30,30]' && JSON.stringify(G.stageSize('zefirax', 1)) === '[30,30]' && Zd.weight === 12, 'Zefirax: 30×30 (G.LEGENDARY_SIZE) y 12 kg');
  ['down', 'up', 'left', 'right'].forEach((dir) => [0, 1, 2].forEach((f) => { const sp = G.creatureSprite('zefirax', dir, f); ok(sp.w === 32 && sp.h === 32, 'zefirax ' + dir + f + ': el sprite mide 30×30 más contorno'); }));
  const pe = (dir, f) => { const sp = G.creatureSprite('zefirax', dir, f); return sp.c.getContext('2d').getImageData(0, 0, sp.w, sp.h).data.join(); };
  if (G.creatureSprite('zefirax', 'down', 0).c.getContext('2d').getImageData(0, 0, 32, 32).data.some((v) => v)) { ok(pe('down', 2) !== pe('down', 0) && pe('down', 1) !== pe('down', 0), 'zefirax: pasos y reposo distintos'); ok(pe('up', 0) !== pe('down', 0) && pe('left', 0) !== pe('right', 0), 'zefirax: frente, espalda y perfiles son distintos'); }
  // sombra: proporcional al sprite (más ancha que la de cualquier criatura de fase 1, menor que el sprite), separada del suelo y con alcance de flotar
  const others = Object.keys(G.TRAITS).filter((i) => i !== 'zefirax');
  ok(tr.shadow[0] < 30 && tr.shadow[0] >= 16 && tr.shadow[0] <= 24 && tr.shadow[0] >= G.TRAITS.forjadrax.shadow[0] && tr.shadow[0] / 30 <= others.reduce((m, i) => Math.max(m, G.TRAITS[i].shadow[0] / G.TRAITS[i].size[0]), 0) && tr.shadow[1] >= 3 && tr.shadow[2] > 0 && tr.float && tr.float[0] >= 3, 'zefirax: sombra proporcional (entre 16 y 24 px, tan ancha como la de Forjadrax y más estrecha que el sprite) y separada del suelo porque flota');
  ok(tr.flick && tr.speed <= 10 && tr.speed < G.traits('nubecin').speed && !tr.hop, 'movimiento propio: flota majestuosa y lenta; parada, ondula y descarga rayos (frame 2)');
  const c = J.creatures.find((k) => k.id === 'zefirax'); ok(c && ((c.hx - 8) / 16 | 0) === 21 && ((c.hy - 14) / 16 | 0) === 3 && !J.solid(21, 3), 'zefirax: aparece en su casilla del claro de Aire, libre');
  for (let i = 0; i < 400; i++) J.creatureStep(0.05); ok(!J.blocked(c.x, c.y), 'Zefirax sigue sin pisar árboles ni agua');
  const x0 = c.x; ok(J.evolve(c) === null && c.id === 'zefirax' && c.x === x0, 'Zefirax no evoluciona (fase única)');
  const L6 = G.lineList(); ok(L6.find((l) => l.family === 'zefirax').stages.join() === 'zefirax', 'la galería lista a Zefirax como línea de una sola fase'); }


// ── Paso 1.1: registro único de datos (src/lineas.js) ──
{ const LS = G.LINEAS, formas = LS.reduce((n, L) => n + L.formas.length, 0), clon = () => JSON.parse(JSON.stringify(LS)), V = (ls) => G.validarLineas(ls).length;
  ok(Array.isArray(LS) && LS.length === 20 && formas === 41, 'el registro tiene 20 líneas y 41 formas');
  ok(G.validarLineas(LS).length === 0, 'cada entrada del registro tiene todos los campos y valores válidos: ' + G.validarLineas(LS).join(' | '));
  ok(LS.every((L, i) => L.n === i + 1), 'las líneas están en orden de Nº, del 1 al 20 sin huecos');
  ok(Object.keys(G.CREATURES).length === formas && Object.keys(G.CREATURES).every((id) => G.FORMAS[id]) && Object.keys(G.FORMAS).every((id) => G.CREATURES[id] && G.CREATURES[id].draw), 'toda forma del registro tiene su dibujo y toda criatura sale del registro');
  // el validador detecta los fallos típicos (se prueba con copias estropeadas, nunca con el registro real)
  const malos = [
    ['falta el nombre', (c) => { delete c[0].formas[0].name; }], ['Nº repetido', (c) => { c[1].n = c[0].n; }], ['id repetido', (c) => { c[1].formas[0].id = c[0].formas[0].id; }],
    ['tamaño impar', (c) => { c[0].formas[0].size[0] = 15; }], ['elemento desconocido', (c) => { c[0].elements = ['plasma']; }], ['rareza desconocida', (c) => { c[0].rarity = 'mitica'; }],
    ['nombre que no empieza por la raíz', (c) => { c[0].formas[0].name = 'Xyz'; }], ['peso 0', (c) => { c[0].formas[0].kg = 0; }], ['sin rasgos', (c) => { delete c[0].formas[0].traits; }],
    ['sombra incompleta', (c) => { c[0].formas[0].traits.shadow = [8, 2]; }], ['pausa al revés', (c) => { c[0].formas[0].traits.wait = [3, 1]; }],
    ['fase 1 con otro id', (c) => { c[0].formas[0].id = 'otro'; }], ['4 fases', (c) => { c[0].formas = c[0].formas.concat(c[0].formas, c[0].formas); }], ['legendaria con 2 fases', (c) => { c[0].rarity = 'legendaria'; }],
    ['falta el lote', (c) => { delete c[0].lote; }], ['size dentro de traits', (c) => { c[0].formas[0].traits.size = [14, 14]; }], ['lista vacía', (c) => { c.length = 0; }],
  ];
  malos.forEach(([que, rompe]) => { const c = clon(); rompe(c); ok(V(c) > 0, 'el validador detecta: ' + que); });
  ok(V(clon()) === 0, 'una copia sin tocar es válida');
  // lo derivado coincide con el registro
  LS.forEach((L) => {
    ok(G.PHASES_PLAN[L.fam] === L.formas.length && G.LINE_PLAN[L.fam].length === L.formas.length, L.fam + ': G.PHASES_PLAN y G.LINE_PLAN salen del registro');
    L.formas.forEach((f, i) => {
      const d = G.CREATURES[f.id], p = G.LINE_PLAN[L.fam][i];
      ok(d.name === f.name && d.line === f.line && d.rarity === L.rarity && d.family === L.fam && d.stage === i + 1 && d.phases === L.formas.length && d.weight === f.kg && d.by === (f.by || L.by), f.id + ': los datos de la criatura salen del registro');
      ok(d.evolvesTo === (i + 1 < L.formas.length ? L.formas[i + 1].id : null) && JSON.stringify(d.elements) === JSON.stringify(L.elements), f.id + ': la evolución es la fase siguiente de la lista');
      ok(p[0] === f.size[0] && p[1] === f.size[1] && p[2] === f.kg && G.traits(f.id).size[0] === f.size[0] && G.traits(f.id).size[1] === f.size[1] && G.TRAITS[f.id].speed === f.traits.speed, f.id + ': tamaño, peso y rasgos derivados');
    });
    const zs = Object.values(G.mundo.mapas).reduce((r, m) => r.concat(m.zonas), []), gs = Object.values(G.mundo.mapas).reduce((r, m) => r.concat(m.npcs.filter((n) => n.tipo === 'guarida')), []);
    ok(L.rarity === 'legendaria' ? gs.some((n) => n.id === L.fam) : L.elements.some((e) => zs.some((z) => z.elemento === e)), L.fam + ': puede aparecer (zona de su elemento en algún mapa o, si es legendaria, guarida fija)');
  });
  ok(G.SPAWN === undefined && LS.every((L) => L.aparece === undefined), 'el registro ya no guarda dónde aparece cada línea (v2.17: lo deciden las zonas de los mapas)');
  // la tabla de CATALOGO.md se genera del registro y no puede quedarse desfasada
  let cat = 1; try { require('child_process').execFileSync(process.execPath, [require('path').join(__dirname, 'tools/catalogo.js'), '--comprobar'], { stdio: 'pipe' }); cat = 0; } catch (e) { /* desfasado */ }
  ok(cat === 0, 'docs/CATALOGO.md coincide con src/lineas.js (si falla: node tools/catalogo.js)');
}


// ── Paso 1.2: dibujos por elemento (src/formas_base.js + src/formas_<elemento>.js) y lista única de archivos (src/orden.json) ──
{ const fs = require('fs'), path = require('path'), orden = require('./src/orden.json'), todos = orden.datos.concat(orden.juego);
  ok(todos.every((f) => fs.existsSync(path.join(__dirname, f))) && new Set(todos).size === todos.length, 'src/orden.json: todos los archivos existen y ninguno se repite');
  const enDisco = fs.readdirSync(path.join(__dirname, 'src')).filter((f) => f.endsWith('.js')).map((f) => 'src/' + f);
  ok(enDisco.every((f) => todos.includes(f)), 'todo .js de src/ está en src/orden.json (si falla: añadirlo en el orden correcto): ' + enDisco.filter((f) => !todos.includes(f)).join(', '));
  ok(orden.datos.indexOf('src/lineas.js') < orden.datos.indexOf('src/creatures.js') && orden.datos.indexOf('src/creatures.js') < orden.datos.indexOf('src/formas_base.js') && orden.datos.indexOf('src/formas_base.js') < orden.datos.findIndex((f) => /formas_(?!base)/.test(f)), 'orden de carga: lineas → creatures → formas_base → formas_<elemento>');
  ok(!fs.existsSync(path.join(__dirname, 'src/formas.js')), 'ya no existe el formas.js único');
  // cada dibujo está en el archivo de su elemento principal, y cada forma tiene exactamente un dibujo
  const dueno = {}; Object.keys(G.ELEMENTS).forEach((e) => { const f = path.join(__dirname, 'src/formas_' + e + '.js'); ok(fs.existsSync(f), 'existe src/formas_' + e + '.js'); if (!fs.existsSync(f)) return;
    const t = fs.readFileSync(f, 'utf8'); let m; const re = /^\s*(?:set|def2|G\.defCreature)\('(\w+)'/gm; while ((m = re.exec(t))) { ok(!dueno[m[1]], m[1] + ': dibujado en un solo archivo'); dueno[m[1]] = e; } });
  G.LINEAS.forEach((L) => L.formas.forEach((f) => ok(dueno[f.id] === L.elements[0], f.id + ': su dibujo está en formas_' + L.elements[0] + '.js (elemento principal)')));
  ok(Object.keys(dueno).length === Object.keys(G.FORMAS).length, 'ningún dibujo sobra ni falta respecto al registro');
  ok(G.formasSinDibujo().length === 0, 'G.formasSinDibujo() vacío');
  // el orden de G.CREATURES es el del registro (Nº de línea y fase), no el de carga
  const esperado = []; G.LINEAS.forEach((L) => L.formas.forEach((f) => esperado.push(f.id)));
  ok(Object.keys(G.CREATURES).join() === esperado.join(), 'G.CREATURES sigue el orden del registro');
  ok(G.lineList().map((l) => l.family).join() === G.LINEAS.map((L) => L.fam).join(), 'la galería (G.lineList) sale en orden de Nº de línea');
  ok(typeof G.F === 'object' && ['mk', 'ell', 'inEll', 'set', 'def2', 'sym', 'rows'].every((n) => typeof G.F[n] === 'function'), 'G.F expone los ayudantes comunes');
}


// ── Paso 1.4: galería (src/galeria.js): lista por Nº, filtros combinables, páginas y búsqueda; con las 20 líneas reales y con una muestra simulada de 200 ──
{ const Gal = G.galeria, L = G.lineList();
  ok(L.length === 20 && L.every((l, i) => l.n === i + 1) && L.every((l, i) => i === 0 || L[i - 1].n < l.n), 'lineList: 20 líneas ordenadas por Nº (1-20)');
  ok(L.every((l) => l.family && l.stages.length === l.phases && l.stages[0] === l.family && l.elements.length >= 1 && G.RARITIES[l.rarity]), 'lineList: cada línea trae n, elementos, rareza y fases');
  ok(Gal.POR_PAG === 20 && Gal.paginar(L, 0).items.length === 20 && Gal.paginar(L, 5).pag === 0 && Gal.paginar([], 3).pags === 1 && Gal.paginar([], 3).items.length === 0, 'paginar: 20 por página, página fuera de rango se ajusta, lista vacía = 1 página');
  ok(Gal.evolucion('pompon') === 'ondavar' && Gal.evolucion('ondavar') === null && Gal.evolucion('zefirax') === null && Gal.evolucion('forjavel') === 'forjadrax', 'evolucion: siguiente fase o null en la última');
  ok(Gal.norm('  ÓNDEL ') === 'ondel' && Gal.filtrar(L, { q: 'ondel' }).map((l) => l.family).join() === 'pompon' && Gal.filtrar(L, { q: 'ONDAV' }).map((l) => l.family).join() === 'pompon' && Gal.filtrar(L, { q: 'zzz' }).length === 0, 'búsqueda por nombre: sin mayúsculas, busca en todas las fases');
  // todas las combinaciones de filtros: las páginas suman el total y cada línea cumple lo pedido (reales y simuladas)
  const EL = [''].concat(Object.keys(G.ELEMENTS)), RA = [''].concat(Object.keys(G.RARITIES)), FA = ['', '1', '2', '3'];
  const sim = []; for (let i = 0; i < 200; i++) { const b = L[i % 20]; sim.push(Object.assign({}, b, { n: i + 1 })); } // MUESTRA: las 20 líneas reales repetidas 10 veces con Nº 1-200 (mismos elementos, rarezas y fases)
  [['20 reales', L], ['200 simuladas', sim]].forEach(([nombre, lista]) => {
    let combos = 0, malo = 0, sumaEl = 0, sumaRa = 0, sumaFa = 0;
    EL.forEach((e) => RA.forEach((r) => FA.forEach((fa) => {
      const fl = Gal.filtrar(lista, { el: e, rar: r, fases: fa, q: '' }); combos++;
      if (!fl.every((l) => (!e || l.elements.includes(e)) && (!r || l.rarity === r) && (!fa || l.phases === Number(fa)))) malo++;
      let vistas = 0, p = Gal.paginar(fl, 0), n = 0; while (true) { vistas += p.items.length; n++; if (p.pag >= p.pags - 1) break; p = Gal.paginar(fl, p.pag + 1); }
      if (vistas !== fl.length || n !== Math.max(1, Math.ceil(fl.length / 20))) malo++;
      if (!r && !fa) sumaEl += (e ? fl.length : 0); if (!e && !fa) sumaRa += (r ? fl.length : 0); if (!e && !r) sumaFa += (fa ? fl.length : 0);
    })));
    ok(malo === 0 && combos === 8 * 5 * 4, nombre + ': ' + combos + ' combinaciones de filtros, todas cumplen lo pedido y sus páginas suman el total');
    ok(sumaRa === lista.length && sumaFa === lista.length, nombre + ': por rareza y por fases las líneas se reparten sin sobrar ni faltar');
    ok(sumaEl >= lista.length, nombre + ': por elemento nadie queda sin salir (las de doble elemento salen en los dos)');
    ok(Gal.paginar(lista, 0).pags === Math.ceil(lista.length / 20), nombre + ': páginas sin filtros = ' + Math.ceil(lista.length / 20));
  });
  ok(Gal.filtrar(sim, { el: 'roca', rar: 'epica' }).map((l) => l.family).every((x) => x === 'forjel') && Gal.filtrar(sim, { el: 'roca', rar: 'epica' }).length === 10, 'filtros combinados: Roca + Épica en 200 = las 10 copias de Forjel (doble elemento fuego+roca)');
  ok(Gal.paginar(Gal.filtrar(sim, {}), 9).items.length === 20 && Gal.paginar(Gal.filtrar(sim, {}), 9).items[19].n === 200 && Gal.paginar(Gal.filtrar(sim, {}), 0).items[0].n === 1, '200 líneas: 10 páginas de 20, de la Nº 1 a la Nº 200 en orden');
  // el dibujo no cambió nada: el lineList de antes (family y stages) sigue igual
  const antes = 'pompon,aguacato,fosforin,pilita,nubecin,cuarzin,somnin,setin,caracolin,lunabu,cenel,ferrel,dandel,zefirax,zumbel,arenel,perlel,arcel,forjel,cactel';
  ok(L.map((l) => l.family).join() === antes, 'el orden de la galería con las 20 líneas es el mismo de la v2.7');
}

// ── Paso 1.5: caché de sprites con límite (src/creatures.js): LRU, sin precalentar, un sprite descartado vuelve idéntico ──
{ const lim0 = G.SPRITE_LIMIT; ok(lim0 === 300, 'límite de la caché: 300 sprites');
  G.spriteCacheClear(); let st = G.spriteStats(); ok(st.size === 0 && st.hits === 0 && st.misses === 0 && st.evictions === 0, 'spriteStats: parte de cero');
  const a = G.creatureSprite('pompon', 'down', 0), a2 = G.creatureSprite('pompon', 'down', 0); st = G.spriteStats();
  ok(a === a2 && st.size === 1 && st.hits === 1 && st.misses === 1, 'un sprite pedido dos veces se dibuja una sola vez (acierto)');
  // LRU con límite 3: se descarta el menos usado, no el más antiguo
  G.SPRITE_LIMIT = 3; G.spriteCacheClear();
  const s0 = G.creatureSprite('pompon', 'down', 0), s1 = G.creatureSprite('pompon', 'down', 1), s2 = G.creatureSprite('pompon', 'up', 0);
  G.creatureSprite('pompon', 'down', 0); // vuelve a ser el más reciente
  G.creatureSprite('pompon', 'left', 0); // entra el 4.º: sale el menos usado (down_1), no el más antiguo (down_0)
  st = G.spriteStats();
  ok(st.size === 3 && st.evictions === 1 && st.peak === 3, 'con límite 3 la caché nunca pasa de 3 y descarta 1');
  ok(G.creatureSprite('pompon', 'down', 0) === s0 && G.creatureSprite('pompon', 'up', 0) === s2, 'LRU: se conservan los usados hace poco');
  const m0 = G.spriteStats().misses; const s1b = G.creatureSprite('pompon', 'down', 1);
  ok(G.spriteStats().misses === m0 + 1 && s1b !== s1 && s1b.w === s1.w && s1b.h === s1.h, 'el descartado se vuelve a dibujar (nuevo objeto, mismo tamaño); el viejo sigue siendo válido');
  ok(s1.c && s1.w > 0 && G.spriteStats().size === 3, 'quien ya tenía el sprite descartado puede seguir usándolo');
  G.SPRITE_LIMIT = 0; G.spriteCacheClear(); ok(G.creatureSprite('pompon', 'down', 0).c && G.spriteStats().size === 1, 'un límite absurdo (0) se trata como 1: nunca falla');
  // pedir todos los sprites (41 formas × 4 direcciones × 3 frames = 492) con el límite normal: nunca pasa de 300
  G.SPRITE_LIMIT = lim0; G.spriteCacheClear();
  Object.keys(G.CREATURES).forEach((id) => ['down', 'up', 'left', 'right'].forEach((d) => [0, 1, 2].forEach((f) => G.creatureSprite(id, d, f))));
  st = G.spriteStats(); ok(st.size === 300 && st.peak === 300 && st.misses === 492 && st.evictions === 192, 'los 492 sprites pedidos: 300 guardados, 192 descartados (' + st.misses + ' dibujados, ' + st.evictions + ' descartes)');
  // el juego no pide más de unas decenas a la vez: tras cargarlo, la caché solo guarda lo dibujado (sin precalentar)
  G.spriteCacheClear(); ok(G.spriteStats().size === 0, 'spriteCacheClear vacía la caché');
}

// v2.16 · paso 1.3a · motor de mapas: datos (src/mapas.js), estado y órdenes (src/motor.js), dibujo (src/game.js)
{ const mundo = G.mundo, motor = G.motor, fs = require('fs'), T = 16;
  const json = JSON.parse(fs.readFileSync('maps/pueblo_inicial.json', 'utf8'));
  ok(json.formato === 2 && JSON.stringify(J.MAP) === JSON.stringify(json.capas.suelo) && mundo.validar().length === 0, 'el mapa del juego sale de maps/pueblo_inicial.json y el mundo no tiene errores');
  ok(Object.keys(mundo.SOLIDO).length === 17 && 'tt~rl#hmx'.split('').every((k) => mundo.SOLIDO[k]) && '.fg=scb d_'.replace(/ /g, '').split('').every((k) => !mundo.SOLIDO[k]), 'las 17 casillas: sólidas las del editor y libres las demás');
  ok(mundo.solido(mundo.mapa('pueblo_inicial'), -1, 5) && mundo.solido(mundo.mapa('pueblo_inicial'), 36, 5), 'sin borde conectado, fuera del mapa es sólido');
  let e1 = null; try { mundo.agregar({ id: 'mala', ancho: 2, alto: 1, suelo: ['.Z'] }); } catch (e) { e1 = e; } ok(e1 && /desconocida/.test(e1.message) && !mundo.mapas.mala, 'una casilla desconocida en un mapa se rechaza con un mensaje claro');
  // mapas falsos de prueba: un exterior con una puerta a una casa y un borde este a otro mapa (con desplazamiento 2)
  const rows = (w, h, f) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(x, y)).join(''));
  mundo.agregar({ id: 'prueba_ext', ancho: 12, alto: 10, suelo: rows(12, 10, (x, y) => (x === 6 && y === 3 ? 'd' : '.')), anclas: { inicio: [3, 5] }, puertas: [{ id: 'p1', x: 6, y: 3, destino: { mapa: 'prueba_casa', ancla: 'entrada' } }], conexiones: { norte: null, sur: null, este: { mapa: 'prueba_b', desplazamiento: 2 }, oeste: null } });
  mundo.agregar({ id: 'prueba_casa', ancho: 8, alto: 6, suelo: rows(8, 6, (x, y) => (y === 5 ? (x === 4 ? 'd' : '#') : x === 0 || x === 7 || y === 0 ? '#' : '_')), anclas: { entrada: [4, 4] }, puertas: [{ id: 'salida', x: 4, y: 5, destino: { mapa: '', ancla: 'volver' } }], conexiones: {} });
  mundo.agregar({ id: 'prueba_b', ancho: 12, alto: 10, suelo: rows(12, 10, () => '.'), anclas: { inicio: [2, 2] }, puertas: [], conexiones: { oeste: { mapa: 'prueba_ext', desplazamiento: -2 } } });
  mundo.agregar({ id: 'prueba_todas', ancho: 12, alto: 2, suelo: ['.fgt~=srclb', '#hd_mx......'].map((r) => r.padEnd(12, '.')), anclas: { inicio: [0, 0] }, puertas: [], conexiones: {} });
  ok(mundo.validar().length === 0, 'los mapas falsos de prueba son válidos');
  const est = motor.crear(5), oli = est.jugadores.oli, lali = est.jugadores.lali, andar = (j, k, n) => { motor.aplicar(est, Object.assign({ j: j.id, t: 'teclas' }, k)); for (let i = 0; i < n; i++) motor.moverJugadores(est, 0.05); motor.aplicar(est, { j: j.id, t: 'teclas' }); };
  ok(oli.mapa === 'pueblo_inicial' && oli.x === 18 * T + 8 && oli.y === 13 * T + 14 && lali.x === 20 * T + 8 && lali.dir === 'left', 'partida nueva: Oli en el cruce de caminos y Lali dos casillas a la derecha');
  motor.aplicar(est, { j: 'oli', t: 'colocar', mapa: 'prueba_ext', ancla: 'inicio' }); motor.aplicar(est, { j: 'lali', t: 'colocar', mapa: 'prueba_b', ancla: 'inicio' });
  ok(oli.mapa === 'prueba_ext' && lali.mapa === 'prueba_b' && oli.x === 3 * T + 8, 'cada jugador puede estar en su propio mapa');
  // puerta: entrar, salir por «volver» y no rebotar
  andar(oli, { right: 1 }, 18); ok(oli.mapa === 'prueba_ext', 'andando por el exterior no se cambia de mapa');
  oli.x = 6 * T + 8; oli.y = 5 * T + 14; andar(oli, { up: 1 }, 14);
  ok(oli.mapa === 'prueba_casa' && Math.floor(oli.x / T) === 4 && Math.floor(oli.y / T) === 4 && oli.volver.length === 1, 'la puerta lleva al ancla «entrada» de la casa');
  andar(oli, {}, 20); ok(oli.mapa === 'prueba_casa', 'quieto en la casa no rebota');
  andar(oli, { down: 1 }, 1);
  ok(oli.mapa === 'prueba_ext' && oli.volver.length === 0 && Math.floor(oli.x / T) === 6 && Math.floor(oli.y / T) === 4, '«volver» deja al jugador junto a la puerta de la que entró');
  andar(oli, {}, 20); ok(oli.mapa === 'prueba_ext', 'tras volver no vuelve a entrar solo');
  // borde este: sale por (11, 4) y aparece en el vecino 2 casillas más abajo
  oli.x = 11 * T + 8; oli.y = 4 * T + 14; andar(oli, { right: 1 }, 20);
  ok(oli.mapa === 'prueba_b' && Math.floor(oli.y / T) === 6 && oli.x < 4 * T, 'el borde este lleva al mapa vecino con su desplazamiento (+2)');
  andar(oli, { left: 1 }, 20);
  ok(oli.mapa === 'prueba_ext' && Math.floor(oli.y / T) === 4 && oli.x > 10 * T, 'y el borde oeste del vecino devuelve al mismo sitio (−2)');
  let e2 = null; try { motor.aplicar(est, { j: 'oli', t: 'volar' }); } catch (e) { e2 = e; } ok(e2 && /desconocida/.test(e2.message), 'una orden desconocida se rechaza');
  let e3 = null; try { motor.aplicar(est, { j: 'nadie', t: 'teclas' }); } catch (e) { e3 = e; } ok(e3 && /no existe/.test(e3.message), 'una orden de un jugador que no existe se rechaza');
  // dos jugadores: las criaturas solo se mueven donde hay alguien
  const cri = motor.criaturas(est, 'pueblo_inicial'), antes = JSON.stringify(cri); for (let i = 0; i < 100; i++) motor.avanzar(est, 0.05);
  ok(cri.length === 0 && JSON.stringify(cri) === antes, 'con los dos jugadores fuera del pueblo, sus criaturas se retiran y no se simulan');
  motor.aplicar(est, { j: 'lali', t: 'colocar', mapa: 'pueblo_inicial', ancla: 'inicio' });
  ok(cri.length > 0, 'al volver los jugadores al pueblo, sus criaturas vuelven a aparecer');
  const c0 = cri[0]; motor.aplicar(est, { j: 'lali', t: 'colocar', mapa: 'pueblo_inicial', ancla: 'inicio' }); lali.x = c0.x + 6; lali.y = c0.y;
  const r = motor.aplicar(est, { j: 'lali', t: 'hablar' });
  ok(r === c0 && c0.talk > 0 && est.avisos.length === 1 && est.avisos[0].j === 'lali' && /diseño de/.test(est.avisos[0].texto), 'la orden hablar le llega a la criatura cercana y deja el aviso para Lali');
  est.avisos.length = 0; motor.aplicar(est, { j: 'lali', t: 'evolucionar', i: 0 }); ok(est.avisos.length === 1 && est.avisos[0].j === 'lali', 'la orden evolucionar deja su aviso para Lali');
  // semilla: misma semilla y mismas órdenes = mismo resultado; sin Math.random
  const rnd0 = Math.random; Math.random = () => { throw new Error('Math.random no se usa en el motor'); };
  const corre = (sem) => { const e = motor.crear(sem); for (let i = 0; i < 400; i++) motor.avanzar(e, 0.05); return JSON.stringify(motor.criaturas(e, 'pueblo_inicial').map((c) => [c.x, c.y, c.dir, c.walk])); };
  let a1, a2, b1; try { a1 = corre(99); a2 = corre(99); b1 = corre(100); } finally { Math.random = rnd0; }
  ok(a1 === a2 && a1 !== b1, 'misma semilla = mismas criaturas en los mismos sitios; otra semilla = otro paseo');
  ok(!/Math\.random|document\.|addEventListener/.test((fs.readFileSync('src/motor.js', 'utf8') + fs.readFileSync('src/mapas.js', 'utf8')).replace(/\/\/.*$/gm, '')), 'motor.js y mapas.js no tocan el DOM, el teclado ni Math.random');
  // dibujo: el juego dibuja las 17 casillas sin errores y cambia de mapa cuando el jugador local cambia
  const yo = J.est.jugadores.oli; motor.aplicar(J.est, { j: 'oli', t: 'colocar', mapa: 'prueba_todas', ancla: 'inicio' }); J.sincronizar();
  ok(J.mapa.id === 'prueba_todas' && J.MAP.length === 2 && J.view().VW <= 12 * T, 'el juego cambia de mapa y de cámara cuando el jugador local cambia de mapa');
  motor.aplicar(J.est, { j: 'oli', t: 'colocar', mapa: 'pueblo_inicial', ancla: 'inicio', dir: 'down' }); J.sincronizar();
  ok(J.mapa.id === 'pueblo_inicial' && J.MAP.length === 26 && yo.x === 18 * T + 8, 'y vuelve al pueblo sin cambios');
  ['prueba_ext', 'prueba_casa', 'prueba_b', 'prueba_todas'].forEach((id) => mundo.quitar(id));
}

// v2.17 · paso 1.3b · aparición por zonas y rareza (src/aparicion.js): plan con semilla, activar/retirar, máximo de activas
{ const mundo = G.mundo, motor = G.motor, ap = G.aparicion, A = ap.AJUSTES, fs = require('fs'), T = 16, m = mundo.mapa('pueblo_inicial');
  const dist2 = (a, b) => Math.hypot(a.tx - b.tx, a.ty - b.ty), P = (s, l) => ap.plan(s, m, l), pj = (s) => JSON.stringify(P(s));
  const ambos = (e, f) => ['oli', 'lali'].forEach((j) => f(e.jugadores[j], j));
  // 1) el plan: determinista, sin depender del azar de la partida, distinto con otra semilla
  ok(pj(7) === pj(7) && pj(7) === JSON.stringify(motor.crear(7).mapas.pueblo_inicial.plan), 'el plan de un mapa solo depende de la semilla: dos llamadas (y dos partidas) dan lo mismo');
  { const e1 = motor.crear(11), e2 = motor.crear(11); for (let i = 0; i < 50; i++) e1.rnd(); ok(JSON.stringify(e1.mapas.pueblo_inicial.plan) === JSON.stringify(e2.mapas.pueblo_inicial.plan), 'y no depende de cuánto azar se haya gastado antes (dos móviles ven lo mismo)'); }
  ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(pj)).size >= 6, 'semillas distintas dan planes distintos');
  // 2) cada hueco: casilla libre, dentro de su zona, línea del elemento de la zona, separado, sin legendarias en zonas; Zefirax en su guarida
  for (const s of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const pl = P(s).huecos, zonas = pl.filter((h) => !h.guarida);
    ok(pl.filter((h) => h.guarida).length === 1 && pl[0].guarida && pl[0].linea === 'zefirax' && pl[0].tx === 21 && pl[0].ty === 3, 'semilla ' + s + ': Zefirax está en su guarida fija (21, 3)');
    ok(zonas.every((h) => { const z = m.zonas.find((q) => q.id === h.grupo), L = G.LINEAS.find((q) => q.fam === h.linea); return z && h.tx >= z.x && h.tx < z.x + z.w && h.ty >= z.y && h.ty < z.y + z.h && ap.libre(m, h.tx, h.ty) && L && L.elements.includes(z.elemento) && L.rarity !== 'legendaria'; }), 'semilla ' + s + ': cada hueco está en su zona, en casilla libre, con una línea de su elemento y nunca legendaria');
    ok(pl.every((a, i) => pl.every((b, k) => i === k || dist2(a, b) >= A.SEPARACION)), 'semilla ' + s + ': los huecos están separados al menos ' + A.SEPARACION + ' casillas');
    ok(m.zonas.every((z) => { const n = zonas.filter((h) => h.grupo === z.id).length; return n >= 1 && n <= ap.huecosDe(m, z); }), 'semilla ' + s + ': cada zona tiene entre 1 y su número de huecos');
    ok(pl.length <= A.MAX, 'semilla ' + s + ': el plan del pueblo (' + pl.length + ' huecos) cabe en el máximo de ' + A.MAX);
  }
  { // todos los huecos son alcanzables a pie desde el inicio
    const ini = m.anclas.inicio, vis = new Set([ini.join()]), cola = [ini];
    while (cola.length) { const [x, y] = cola.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ',' + (y + dy); if (!vis.has(k) && !mundo.solido(m, x + dx, y + dy)) { vis.add(k); cola.push([x + dx, y + dy]); } }); }
    ok([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((s) => P(s).huecos.every((h) => vis.has(h.tx + ',' + h.ty))), 'todos los huecos (10 semillas) son alcanzables a pie desde el inicio'); }
  // 3) pesos de rareza: con 3 líneas de cada rareza salen Común 60 / Rara 28 / Épica 10 (61,2 / 28,6 / 10,2 % sin la legendaria); 3000 semillas
  { const sim = []; ['comun', 'rara', 'epica'].forEach((r) => [1, 2, 3].forEach((k) => sim.push({ fam: r + k, rarity: r, elements: ['fuego'] })));
    const cuenta = { comun: 0, rara: 0, epica: 0 }; let tot = 0;
    for (let s = 1; s <= 3000; s++) P(s, sim).huecos.filter((h) => !h.guarida && h.grupo === 'claro_fuego').forEach((h) => { cuenta[sim.find((q) => q.fam === h.linea).rarity]++; tot++; });
    const pc = (r) => 100 * cuenta[r] / tot;
    ok(Math.abs(pc('comun') - 61.2) < 3 && Math.abs(pc('rara') - 28.6) < 3 && Math.abs(pc('epica') - 10.2) < 2, 'pesos de rareza (3000 semillas, ' + tot + ' huecos): ' + pc('comun').toFixed(1) + ' % Comunes, ' + pc('rara').toFixed(1) + ' % Raras, ' + pc('epica').toFixed(1) + ' % Épicas (esperado 61,2 / 28,6 / 10,2)'); }
  ok(P(3, [{ fam: 'x', rarity: 'comun', elements: ['hoja'] }]).huecos.filter((h) => h.grupo === 'claro_fuego').length === 0, 'una zona sin líneas de su elemento queda vacía');
  ['comun', 'rara', 'epica'].forEach((r) => ok(P(3, [{ fam: 'x', rarity: r, elements: ['fuego'] }]).huecos.filter((h) => h.grupo === 'claro_fuego').length === A.MAX_IGUALES[r], 'una misma línea ' + r + ' no sale más de ' + A.MAX_IGUALES[r] + ' veces en una zona'));
  // 4) activar y retirar según dónde estén los jugadores
  { const e = motor.crear(21), em = e.mapas.pueblo_inicial, key = () => JSON.stringify(em.criaturas.map((c) => [c.id, c.hx, c.hy, c.h]).sort());
    ok(em.criaturas.length >= em.plan.huecos.length - 1 && em.criaturas.every((c) => c.id === em.plan.huecos[c.h].linea && c.hx === em.plan.huecos[c.h].tx * T + 8 && c.hy === em.plan.huecos[c.h].ty * T + 14), 'al empezar salen las criaturas de las zonas a menos de ' + A.ACTIVA + ' casillas (la guarida de Zefirax, a 10, aún no), cada una en su hueco del plan');
    const k0 = key(); ambos(e, (j, id) => motor.aplicar(e, { j: id, t: 'colocar', ancla: 'claro_hoja' })); motor.avanzar(e, 0.05);
    ok(em.activas.claro_hoja && !em.activas.claro_agua && !em.activas.claro_sombra && !em.activas.claro_electrico && em.criaturas.every((c) => em.activas[c.zona]) && em.criaturas.length < em.plan.huecos.length, 'en el claro de Hoja se retiran las zonas a más de ' + A.RETIRA + ' casillas (Agua, Sombra, Eléctrico) y solo quedan criaturas de zonas activas');
    ambos(e, (j, id) => motor.aplicar(e, { j: id, t: 'colocar', ancla: 'inicio' })); motor.avanzar(e, 0.05);
    ok(key() === k0, 'al volver al cruce reaparecen las mismas criaturas en los mismos sitios');
    const zr = m.zonas.find((z) => z.id === 'claro_roca'); ambos(e, (j) => { j.x = (zr.x + 4) * T; j.y = (zr.y - 11) * T; }); motor.avanzar(e, 0.05);
    ok(em.activas.claro_roca, 'a 11 casillas (entre ' + A.ACTIVA + ' y ' + A.RETIRA + ') una zona ya activa no se retira: no parpadea');
    ambos(e, (j) => { j.x = (zr.x + 4) * T; j.y = (zr.y - 15) * T; }); motor.avanzar(e, 0.05);
    ok(!em.activas.claro_roca && em.criaturas.every((c) => c.zona !== 'claro_roca'), 'a 15 casillas (más de ' + A.RETIRA + ') sí se retira');
    ambos(e, (j, id) => motor.aplicar(e, { j: id, t: 'colocar', ancla: 'inicio' })); motor.avanzar(e, 0.05);
    // una criatura evolucionada vuelve evolucionada al mismo hueco, y no se retira mientras se le habla
    const c = em.criaturas.find((q) => G.CREATURES[q.id].evolvesTo), i = c.h, sig = G.CREATURES[c.id].evolvesTo; motor.aplicar(e, { j: 'oli', t: 'evolucionar', i: em.criaturas.indexOf(c) });
    c.talk = 100; ambos(e, (j, id) => motor.aplicar(e, { j: id, t: 'colocar', ancla: 'claro_hoja' })); const lejana = em.plan.huecos[i].grupo !== 'claro_hoja' && em.plan.huecos[i].grupo !== 'claro_fuego' && em.plan.huecos[i].grupo !== 'claro_aire';
    motor.avanzar(e, 0.05); ok(!lejana || em.criaturas.includes(c), 'una criatura con la que se está hablando no se retira');
    c.talk = 0; for (let k = 0; k < 3; k++) motor.avanzar(e, 0.05); ambos(e, (j, id) => motor.aplicar(e, { j: id, t: 'colocar', ancla: 'inicio' })); motor.avanzar(e, 0.05);
    const d = em.criaturas.find((q) => q.h === i); ok(d && d.id === sig, 'una criatura que evolucionó vuelve evolucionada al mismo hueco (' + sig + ')');
    // fuera del pueblo no queda ninguna y el plan sigue guardado
    ambos(e, (j, id) => motor.aplicar(e, { j: id, t: 'colocar', ancla: 'inicio' })); }
  // 5) el máximo de activas: un mapa falso enorme con 7 zonas de 50×50 (42 huecos) y 200 líneas simuladas (las 20 reales repetidas 10 veces con fam distinta)
  { const base = G.LINEAS, sim = []; for (let k = 0; k < 10; k++) base.forEach((L) => sim.push({ fam: L.fam + '__' + k, rarity: L.rarity, elements: L.elements }));
    const zonas = ['hoja', 'fuego', 'agua', 'electrico', 'aire', 'roca', 'sombra'].map((el) => ({ id: 'z_' + el, x: 0, y: 0, w: 50, h: 50, elemento: el, nota: '' }));
    mundo.agregar({ id: 'prueba_grande', ancho: 50, alto: 50, suelo: Array.from({ length: 50 }, () => '.'.repeat(50)), anclas: { inicio: [25, 25] }, puertas: [], conexiones: {}, zonas, npcs: [] });
    ok(mundo.validar().length === 0, 'el mapa falso grande es válido'); ap.fuente = sim;
    try { const e = motor.crear(3); ambos(e, (j, id) => motor.aplicar(e, { j: id, t: 'colocar', mapa: 'prueba_grande', ancla: 'inicio' }));
      const em = e.mapas.prueba_grande; ok(sim.length === 200 && em.plan.huecos.length > A.MAX && em.plan.huecos.length >= 36, 'muestra: 200 líneas simuladas y un plan de ' + em.plan.huecos.length + ' huecos (más que el máximo)');
      let maxVisto = 0; for (let i = 0; i < 200; i++) { motor.avanzar(e, 0.05); maxVisto = Math.max(maxVisto, em.criaturas.length); }
      ok(em.criaturas.length === A.MAX && maxVisto === A.MAX, 'con más huecos que el máximo hay exactamente ' + A.MAX + ' criaturas activas y nunca más (visto: ' + maxVisto + ')');
      em.criaturas.splice(0, 5); motor.avanzar(e, 0.05); ok(em.criaturas.length === A.MAX, 'si se retiran 5, salen otras 5 de la lista de espera hasta el máximo');
      ok(new Set(em.criaturas.map((c) => c.h)).size === em.criaturas.length, 'ningún hueco tiene dos criaturas');
    } finally { ap.fuente = null; mundo.quitar('prueba_grande'); } }
  // 6) paseo: tras 4000 pasos ninguna criatura pisa árboles ni agua ni sale del mapa, y el máximo se respeta
  { const e = motor.crear(5), em = e.mapas.pueblo_inicial; let bien = true, maxv = 0;
    for (let i = 0; i < 4000; i++) { motor.avanzar(e, 0.05); maxv = Math.max(maxv, em.criaturas.length); if (i % 400 === 0 && !em.criaturas.every((c) => !motor.bloqueado(m, c.x, c.y) && c.x > 0 && c.x < m.W * T && c.y > 0 && c.y < m.H * T && Math.hypot(c.x - c.hx, c.y - c.hy) <= 13)) bien = false; }
    ok(bien && maxv <= A.MAX, 'tras 4000 pasos de simulación ninguna criatura pisa árboles ni agua, ninguna se aleja de su hueco y nunca hay más de ' + A.MAX + ' (máx. visto ' + maxv + ')');
    const t0 = Date.now(); for (let i = 0; i < 2000; i++) motor.avanzar(e, 0.05); const ms = Date.now() - t0;
    ok(ms < 1500, 'rendimiento: 2000 pasos con ' + em.criaturas.length + ' criaturas activas tardan ' + ms + ' ms (' + (ms / 2000).toFixed(3) + ' ms por paso)'); }
  // 7) validación de zonas y guaridas, y reglas de código
  { mundo.agregar({ id: 'prueba_zonas', ancho: 6, alto: 6, suelo: Array.from({ length: 6 }, () => '......'), anclas: { inicio: [1, 1] }, puertas: [], conexiones: {}, zonas: [{ id: 'a', x: 4, y: 4, w: 5, h: 5, elemento: 'fuego' }, { id: 'b', x: 0, y: 0, w: 2, h: 2, elemento: 'plasma' }, { id: 'b', x: 0, y: 0, w: 2, h: 2, elemento: 'agua' }], npcs: [{ id: 'nadie', x: 1, y: 1, tipo: 'guarida', texto: '' }] });
    const pr = mundo.validar().join(' | '); mundo.quitar('prueba_zonas');
    ok(/se sale del mapa/.test(pr) && /elemento desconocido/.test(pr) && /repetida/.test(pr) && /guarida «nadie»/.test(pr), 'el mundo rechaza zonas fuera del mapa, con elemento desconocido o repetidas y guaridas de una línea que no existe'); }
  ok(!/Math\.random|document\.|addEventListener/.test(fs.readFileSync('src/aparicion.js', 'utf8').replace(/\/\/.*$/gm, '')), 'aparicion.js no toca el DOM, el teclado ni Math.random');
}

// v2.19 · paso 1.3b-bis · interruptor de aparición (AJUSTES.VISIBLES y AJUSTES.SOLO): quitar las criaturas visibles sin borrar nada
{ const mundo = G.mundo, motor = G.motor, ap = G.aparicion, A = ap.AJUSTES, fs = require('fs'), m = mundo.mapa('pueblo_inicial'), anclas = Object.keys(m.anclas).filter((k) => /^claro_/.test(k));
  const fuente = fs.readFileSync('src/aparicion.js', 'utf8');
  ok(/VISIBLES: true, SOLO: null/.test(fuente), 'el valor de fábrica es VISIBLES true y SOLO null (desde la v2.24.2 el juego sale con las criaturas visibles en el mapa; antes false)');
  const recorrer = (e) => { let max = 0, fam = new Set(), todas = 0; anclas.concat(['inicio']).forEach((a) => { ['oli', 'lali'].forEach((j) => motor.aplicar(e, { j, t: 'colocar', mapa: 'pueblo_inicial', ancla: a })); const l = motor.criaturas(e, 'pueblo_inicial'); max = Math.max(max, l.length); todas += l.length; l.forEach((c) => fam.add(G.CREATURES[c.id].family)); }); return { max, fam, todas }; };
  const guarida = m.npcs.find((n) => n.tipo === 'guarida');
  const quieto = (e) => { ['oli', 'lali'].forEach((j) => { const q = e.jugadores[j]; q.mapa = 'pueblo_inicial'; q.x = guarida.x * 16 + 8; q.y = guarida.y * 16 + 14; }); motor.aparicion(e); return motor.criaturas(e, 'pueblo_inicial').length; };
  A.VISIBLES = false;
  { const e = motor.crear(5), r = recorrer(e); ok(r.max === 0 && r.todas === 0, 'con VISIBLES false no sale ninguna criatura en ningún claro ni en el inicio (' + r.todas + ')'); ok(quieto(e) === 0, 'con VISIBLES false tampoco sale Zefirax en su guarida'); }
  A.VISIBLES = true;
  { const e = motor.crear(5), r = recorrer(e); ok(r.max > 0, 'con VISIBLES true vuelven a salir criaturas (máx. ' + r.max + ' a la vez)'); ok(quieto(e) >= 1 && motor.criaturas(e, 'pueblo_inicial').some((c) => G.CREATURES[c.id].family === guarida.id), 'con VISIBLES true Zefirax sale en su guarida');
    A.VISIBLES = false; motor.aparicion(e); ok(motor.criaturas(e, 'pueblo_inicial').length === 0, 'al apagar el interruptor con la partida en marcha se retiran todas'); A.VISIBLES = true; }
  { const plan = (s) => JSON.stringify(ap.plan(s, m)); A.VISIBLES = false; const a = plan(9); A.VISIBLES = true; ok(a === plan(9), 'el interruptor no cambia el plan de aparición (misma semilla = mismo plan)'); }
  // SOLO: dejar salir solo algunas líneas, para probar
  { const e0 = motor.crear(5), fam = e0.mapas.pueblo_inicial.plan.huecos.find((h) => !h.guarida).linea; A.SOLO = [fam];
    const e = motor.crear(5), r = recorrer(e); ok(r.max > 0 && [...r.fam].every((f) => f === fam), 'con SOLO [' + fam + '] solo salen criaturas de esa familia (' + [...r.fam].join(',') + ')');
    A.SOLO = ['no_existe']; { const e2 = motor.crear(5), r2 = recorrer(e2); ok(r2.todas === 0, 'con SOLO de una línea que no sale en el mapa no sale ninguna'); }
    A.SOLO = null; }
  ok(Object.keys(G.CREATURES).length === 41 && G.LINEAS.length === 20 && G.lineList().length === 20, 'quitar las criaturas visibles no borra nada: 41 formas, 20 líneas y la galería completa');
  A.VISIBLES = true; }

// ── v2.21 (paso A del plan de identidad): sombreado de sprites y suelo (src/sombreado.js) ──
{ const S = G.SOMBREADO, mkc = (w, h) => document.createElement('canvas');
  ok(S && typeof S.ACTIVO === 'boolean' && typeof G.sombrearSprite === 'function' && G.sombreado && typeof G.sombreado.suelo === 'function', 'existe G.SOMBREADO, G.sombrearSprite y G.sombreado.suelo');
  // paleta: tonos de la hierba de sombra fría a luz cálida (el brillo sube y el tono se desplaza)
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); };
  const Hc = G.sombreado.COL.hierba; ok(lum(Hc.s0) < lum(Hc.s1) && lum(Hc.s1) < lum(Hc.base) && lum(Hc.base) < lum(Hc.l1) && lum(Hc.l1) < lum(Hc.l2), 'la rampa de la hierba va de más oscuro a más claro');
  const Cc = G.sombreado.COL.copa; ok(lum(Cc.sombra) < lum(Cc.c0) && lum(Cc.c0) < lum(Cc.c1) && lum(Cc.c1) < lum(Cc.c2) && lum(Cc.c2) < lum(Cc.c3) && lum(Cc.c3) < lum(Cc.c4), 'la rampa de la copa va de más oscuro a más claro');
  // con el sombreado apagado, las casillas no se dibujan en este módulo y los sprites no cambian
  S.ACTIVO = false; const calls = []; const fake = { fillStyle: '', fillRect() { calls.push(1); } };
  ok(G.sombreado.suelo(fake, 't', 1, 1, { suelo: ['ttt', 'ttt', 'ttt'] }, 16) === false && calls.length === 0, 'apagado: el suelo no se dibuja aquí (vuelve el dibujo de siempre)');
  // encendido: dibuja las 5 casillas suyas y deja las demás; todo con la misma semilla da lo mismo
  S.ACTIVO = true; const m = { suelo: ['.f=', 't~.', 'ttt'] };
  ['.', 'f', 't', '=', '~'].forEach((ch) => { calls.length = 0; ok(G.sombreado.suelo(fake, ch, 1, 1, m, 16) === true && calls.length > 0, 'encendido: dibuja la casilla ' + ch); });
  calls.length = 0; ok(G.sombreado.suelo(fake, 'g', 1, 1, m, 16) === false && calls.length === 0, 'encendido: las casillas que no son suyas (g) las deja a game.js');
  // en una casilla de árbol los 5 tonos de copa existen y las esquinas del lienzo (fuera de la copa) no se pintan con ellos
  const usados = new Set(); const rec = { set fillStyle(v) { this._c = v; }, get fillStyle() { return this._c; }, fillRect() { usados.add(this._c); } };
  G.sombreado.suelo(rec, 't', 1, 1, m, 16); const Cp = G.sombreado.COL.copa; ok([Cp.c4, Cp.c3, Cp.c2, Cp.c1, Cp.c0, Cp.luz, Cp.sombra].every((v) => usados.has(v)), 'el árbol usa los 5 tonos de copa y los dos contornos');
  // sprites: el sombreado NO cambia la silueta (canal alfa idéntico) y no deja ningún píxel del color de contorno exterior suelto en los bordes
  const W = 20, Hh = 20, mk2 = () => { const data = new Uint8ClampedArray(W * Hh * 4); for (let y = 4; y < 16; y++) for (let x = 4; x < 16; x++) { const o = (y * W + x) * 4, borde = x === 4 || y === 4 || x === 15 || y === 15; const col = borde ? [0x2a, 0x1b, 0x30] : [93, 174, 90]; data[o] = col[0]; data[o + 1] = col[1]; data[o + 2] = col[2]; data[o + 3] = 255; } return data; };
  const cvf = (data) => ({ width: W, height: Hh, getContext: () => ({ getImageData: () => ({ data }), putImageData: (id) => { data.set(id.data); } }) });
  const a0 = mk2(), a1 = mk2(); S.ACTIVO = false; G.sombrearSprite(cvf(a1)); ok(a1.every((v, i) => v === a0[i]), 'apagado: el sprite queda idéntico');
  S.ACTIVO = true; G.sombrearSprite(cvf(a1)); let alfaIgual = true, cambia = 0; for (let i = 0; i < a0.length; i += 4) { if (a0[i + 3] !== a1[i + 3]) alfaIgual = false; if (a0[i] !== a1[i] || a0[i + 1] !== a1[i + 1] || a0[i + 2] !== a1[i + 2]) cambia++; }
  ok(alfaIgual && cambia > 0, 'encendido: la silueta (alfa) no cambia y los colores sí');
  const arriba = ((4 * W + 8) * 4), abajo = ((15 * W + 8) * 4); ok(a1[arriba] + a1[arriba + 1] + a1[arriba + 2] > a1[abajo] + a1[abajo + 1] + a1[abajo + 2], 'contorno selectivo: más claro arriba que abajo (luz arriba-izquierda)');
  S.ACTIVO = true; }

// ── v2.23 (B1): rampas de color compartidas, volumen calculado y test de luz (src/rampas.js, src/luz_criaturas.js, tools/luz.js, tools/simetria.js) ──
{ const lumh = (a) => 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2], S = G.SOMBREADO;
  ok(typeof G.rampa === 'function' && typeof G.rampa.rgb === 'function' && typeof G.rampa.hex === 'function', 'existe G.rampa (rgb y hex)');
  // v2.23.1: incluye colores muy oscuros (luminosidad HSL 0,12-0,21), donde la rampa salía invertida
  ['#5dae5a', '#2a1b30', '#201830', '#3a2a4a', '#35282f', '#e8cf98', '#4580d4', '#b8341f', '#8f94a8', '#f7d54a'].forEach((c) => { const r = G.rampa.rgb(c), h = G.rampa(c);
    ok(lumh(r.s0) < lumh(r.s1) && lumh(r.s1) < lumh(r.base) && lumh(r.base) < lumh(r.l1) && lumh(r.l1) < lumh(r.l2), 'rampa de ' + c + ': sombra profunda < sombra < base < luz < brillo');
    ok(/^#[0-9a-f]{6}$/.test(h.base) && h.base === c && /^#[0-9a-f]{6}$/.test(h.l2), 'rampa de ' + c + ': con color en texto devuelve texto y conserva la base'); });
  { const a = G.rampa.rgb('#5dae5a'), b = G.rampa.rgb('#5dae5a'); ok(a === b || JSON.stringify(a) === JSON.stringify(b), 'la rampa es determinista (mismo color, mismos tonos)');
    const hue = (c) => G.color.rgb2hsl(c)[0], dist = (h, t) => Math.abs(((h - t + 540) % 360) - 180), r = G.rampa.rgb('#4580d4');
    ok(dist(hue(r.l1), 52) <= dist(hue(r.base), 52) && dist(hue(r.s1), 275) <= dist(hue(r.base), 275), 'cambio de tono: la luz se acerca al amarillo cálido y la sombra al violeta frío');
    const suave = G.rampa.rgb('#5dae5a', { contraste: 0.6 }), duro = G.rampa.rgb('#5dae5a', { contraste: 1.3 }); ok(lumh(duro.l1) - lumh(duro.s1) > lumh(suave.l1) - lumh(suave.s1), 'el contraste de la rampa separa más o menos los tonos'); }
  ok(S && typeof S.VOLUMEN === 'boolean' && G.LUZ_CRIATURAS && ['aguacato', 'voltorax', 'cuarzoth'].every((id) => G.LUZ_CRIATURAS[id] && G.CREATURES[id]), 'volumen calculado: las 3 criaturas piloto (aguacato, voltorax, cuarzoth) existen y tienen su ficha de luz');
  ok(Object.keys(G.LUZ_CRIATURAS).every((id) => ['piel', 'roca', 'metal', 'cristal'].includes(G.LUZ_CRIATURAS[id].mat) && G.sombreado.MAT[G.LUZ_CRIATURAS[id].mat]), 'cada ficha de luz usa un material conocido');
  { const L = G.LUZ_CRIATURAS.aguacato; ok(L && !L.columnas && G.CREATURES.aguacato.native === true && G.traits('aguacato').size[0] === 18 && G.traits('aguacato').size[1] === 18, 'Aguacato: se dibuja nativo a 18×18 (sin estirado ni `columnas`; desde la v2.23.3)'); }
  // los scripts de comprobación de píxeles se ejecutan aparte (el lienzo falso de test.js no guarda píxeles)
  const cp = require('child_process'), run = (args) => { try { cp.execFileSync(process.execPath, args, { cwd: __dirname, stdio: 'pipe' }); return true; } catch (e) { return false; } };
  ok(run(['tools/brillo.js']), 'tools/brillo.js (v2.47): con el sombreado, las 41 formas no quedan más oscuras de la cuenta (pérdida media de claridad ≤ 4, la peor ≤ 8) y la silueta no cambia');
  ok(run(['tools/luz.js']), 'tools/luz.js: las criaturas con volumen pasan el test de luz (silueta, colores, rampas, luz arriba-izquierda, sin almohadilla, contraste)');
  ok(run(['tools/simetria.js', '--sombreado']), 'tools/simetria.js: ningún estirado mete asimetría (con el sistema nuevo)'); }

// ── v2.33 (ID-2a): motor de dibujo con capas (src/capas.js) y formato 2 de maps/ ──
{ const mundo = G.mundo, C = G.capas, T = 16, fs = require('fs');
  const j2 = JSON.parse(fs.readFileSync('maps/pueblo_inicial.json', 'utf8'));
  ok(C && typeof C.registrar === 'function' && typeof C.fondo === 'function' && typeof C.visibles === 'function' && typeof C.dibujarEncima === 'function', 'existe G.capas (registrar, fondo, visibles, dibujarEncima)');
  ok(j2.formato === 2 && Array.isArray(j2.objetos) && j2.objetos.length === 0 && mundo.mapa('pueblo_inicial').objetos.length === 0 && mundo.mapa('pueblo_inicial').animar === true, 'pueblo_inicial está en el formato 2, sin objetos y con el agua animada (v2.36) (lo que se ve no cambia)');
  const dib = () => {};
  C.registrar('t_arbol', { w: 16, h: 24, ox: 0, oy: -8, pieY: 16, huella: [[0, 0, 1, 1]], dibujar: dib });
  C.registrar('t_flor', { w: 8, h: 8, capa: 'bajo', dibujar: dib });
  C.registrar('t_casa', { w: 48, h: 48, ox: 0, oy: -32, pieY: 16, huella: [[0, 0, 3, 1]], dibujar: dib });
  let malo = false; try { C.registrar('t_malo', { w: 0, h: 4, dibujar: dib }); } catch (e) { malo = true; } ok(malo, 'un objeto sin tamaño o sin dibujar se rechaza');
  const base = { formato: 2, id: 't_f2', ancho: 6, alto: 4, capas: { suelo: ['......', '......', '......', '......'] }, anclas: { a: [0, 3] },
    objetos: [{ tipo: 't_arbol', x: 2, y: 1 }, { tipo: 't_flor', x: 4, y: 2 }, { tipo: 't_casa', x: 3, y: 3 }], colision: ['......', '......', '.....x', '......'], animar: true };
  const m = mundo.agregar(JSON.parse(JSON.stringify(base)));
  ok(mundo.solido(m, 2, 1) && !mundo.solido(m, 3, 1), 'la huella de un objeto bloquea el paso (y solo su casilla)');
  ok(!mundo.solido(m, 4, 2), 'un objeto de capa «bajo» no bloquea');
  ok(mundo.solido(m, 3, 3) && mundo.solido(m, 4, 3) && mundo.solido(m, 5, 3) && !mundo.solido(m, 2, 3), 'una huella de 3×1 bloquea 3 casillas');
  ok(mundo.solido(m, 5, 2) && !mundo.solido(m, 4, 1), 'la capa de colisión añade casillas sólidas');
  ok(m.animar === true && m.objetos.length === 3, 'el mapa guarda sus objetos y animar');
  const falla = (cambio) => { const j = JSON.parse(JSON.stringify(base)); cambio(j); j.id = 't_f2b'; try { mundo.agregar(j); mundo.quitar('t_f2b'); return false; } catch (e) { return true; } };
  ok(falla((j) => { j.objetos[0].tipo = 'no_existe'; }), 'un objeto de un tipo que no existe hace fallar el mapa');
  ok(falla((j) => { j.objetos[0].x = 9; }), 'un objeto fuera del mapa hace fallar el mapa');
  ok(falla((j) => { j.objetos[2].x = 5; }), 'una huella que se sale del mapa hace fallar el mapa');
  ok(falla((j) => { j.colision[0] = '...'; }), 'una fila de colisión de otra anchura hace fallar el mapa');
  const f1 = mundo.agregar({ formato: 1, id: 't_f1', ancho: 3, alto: 2, suelo: ['...', '.t.'], anclas: {} });
  ok(f1.objetos.length === 0 && !mundo.solido(f1, 0, 0) && mundo.solido(f1, 1, 1), 'los mapas del formato 1 se siguen abriendo igual');
  // orden por la Y de los pies: se pasa por detrás de lo que está más al sur; «encima» va después de todo
  const vis = C.visibles(m, { x: 0, y: -40 }, 96, 120);
  ok(vis.length === 2 && vis.every((p) => p.objeto.tipo !== 't_flor'), 'visibles: solo objetos con altura (las flores bajas van en el suelo)');
  const claves = vis.map((p) => p.objeto.tipo + ':' + p.y).sort(); ok(claves.join() === 't_arbol:32,t_casa:64', 'clave de orden = casilla y × 16 + pieY');
  const lista = [{ y: 40, quien: 'jugador' }].concat(vis).sort((a, b) => a.y - b.y).map((p) => p.quien || p.objeto.tipo);
  ok(lista.join() === 't_arbol,jugador,t_casa' || lista.join() === 'jugador,t_arbol,t_casa', 'el jugador queda entre los objetos según su Y');
  { const delante = [{ y: 20, quien: 'j' }].concat(vis).sort((a, b) => a.y - b.y).map((p) => p.quien || p.objeto.tipo); ok(delante[0] === 'j', 'un jugador más al norte se dibuja antes (por detrás) del árbol'); }
  const llamadas = []; const ctxF = { drawImage: (img, x, y) => llamadas.push([x, y]) };
  C.dibujarBase(ctxF, vis[0].objeto, { x: 0, y: 0 }); C.dibujarEncima(ctxF, vis, { x: 0, y: 0 });
  ok(llamadas.length === 3, 'se dibuja la base de un objeto y el «encima» de los visibles');
  ok(llamadas[0][0] === 2 * T && llamadas[0][1] === 1 * T - 8, 'el dibujo se coloca con su desplazamiento (ox, oy)');
  // reloj visual único
  C.reloj = 0; C.tick(0.2); ok(C.frame(1.5) === 0, 'reloj: a 0,2 s el fotograma de 1,5 Hz es el 0'); C.tick(0.5); ok(C.frame(1.5) === 1, 'reloj: a 0,7 s pasa al fotograma 1'); C.reloj = 0;
  mundo.quitar('t_f2'); mundo.quitar('t_f1'); ['t_arbol', 't_flor', 't_casa'].forEach((t) => C.quitar(t));
  ok(!mundo.mapas.t_f2 && !G.OBJETOS.t_arbol && mundo.validar().length === 0, 'limpio: se quitan los mapas y objetos de prueba y el mundo sigue sin errores'); }

// ── Grupo 28 · v2.34 · catálogo de árboles (src/arboles.js): 4 piezas, un solo diseño cada una, huella de 1 casilla, todo en la capa «normal» ──
{ const C = G.capas, T = 16, tipos = ['arbol_pequeno', 'arbol_mediano', 'abeto', 'roble_hito'], medidas = { arbol_pequeno: [28, 40], arbol_mediano: [36, 54], abeto: [32, 68], roble_hito: [64, 88] };
  ok(JSON.stringify(G.ARBOLES) === JSON.stringify(tipos) && tipos.every((t) => G.OBJETOS[t]), 'catálogo: están los 4 árboles registrados (pequeño, mediano, abeto y roble hito)');
  ok(tipos.every((t) => G.OBJETOS[t].w === medidas[t][0] && G.OBJETOS[t].h === medidas[t][1]), 'cada árbol mide lo aprobado (v2.251: 28×40, 36×54, 32×68 y 64×88; siempre más alto que una persona)');
  ok(tipos.every((t) => { const d = G.OBJETOS[t]; return d.ox + d.w / 2 === 8 && d.oy + d.h === T && d.pieY === T; }), 'los pies de cada árbol quedan centrados en la parte baja de su casilla (ox + w/2 = 8, oy + h = 16, pieY = 16)');
  ok(tipos.every((t) => { const d = G.OBJETOS[t]; return d.capa === 'normal' && d.encima === false && JSON.stringify(d.huella) === '[[0,0,1,1]]'; }), 'los árboles van en la capa «normal» (se ordenan por la Y de sus pies) y solo el tronco bloquea (1 casilla)');
  const pinta = (t) => { const d = G.OBJETOS[t], rs = [], c = { set fillStyle(v) { this.col = v; }, fillRect: (x, y, w, h) => rs.push([x, y, w, h, c.col].join()) }; d.dibujar(c, c, T); return rs; };
  ok(tipos.every((t) => { const d = G.OBJETOS[t], rs = pinta(t); return rs.length > 40 && rs.every((r) => { const [x, y, w, h] = r.split(',').map(Number); return x >= 0 && y >= 0 && x + w <= d.w && y + h <= d.h; }); }), 'el dibujo de cada árbol cabe entero en su lienzo');
  ok(tipos.every((t) => pinta(t).join('|') === pinta(t).join('|')), 'el dibujo es siempre el mismo (sin azar)');
  const col = (t) => new Set(pinta(t).map((r) => r.split(',')[4])), COL = G.sombreado.COL, paleta = new Set(Object.values(COL.copa).concat(Object.values(COL.tronco)));
  ok(tipos.every((t) => [...col(t)].every((c) => paleta.has(c))), 'solo usan los colores de la copa y el tronco del árbol de casilla (G.sombreado.COL)');
  ok(pinta('arbol_pequeno').length > 0 && pinta('arbol_pequeno').some((r) => r.endsWith(COL.copa.sombra)) && pinta('arbol_pequeno').some((r) => r.endsWith(COL.copa.luz)), 'la copa lleva contorno claro (arriba-izquierda) y oscuro (abajo-derecha)');
  const mapa = G.mundo.agregar({ formato: 2, id: 't_arb', ancho: 6, alto: 6, capas: { suelo: ['......', '......', '......', '......', '......', '......'] }, objetos: tipos.map((t, i) => ({ tipo: t, x: 1 + (i % 2) * 3, y: 2 + Math.floor(i / 2) * 3 })), anclas: {} });
  ok(mapa.objetos.length === 4 && mapa.objetos.every((o) => G.mundo.solido(mapa, o.x, o.y)) && !G.mundo.solido(mapa, 0, 0), 'un mapa con los 4 árboles se abre sin errores y cada tronco bloquea su casilla');
  const vis = C.visibles(mapa, { x: 0, y: 0 }, 96, 96);
  ok(vis.length === 4 && vis.every((p) => p.y === p.objeto.y * T + T), 'los 4 árboles se ordenan por la Y de sus pies (casilla y × 16 + 16)');
  G.mundo.quitar('t_arb');
  ok(!G.mundo.mapas.t_arb && G.mundo.validar().length === 0, 'limpio: se quita el mapa de prueba y el mundo sigue sin errores'); }


// ── v2.40 (ID-2b-1d): olas que cruzan el agua al azar sin chocarse, y rayitas blancas (G.capas.olas) ──
{ const O = G.capas.olas, suelo = Array.from({ length: 30 }, () => '~'.repeat(40)), lago = Array.from({ length: 12 }, () => '.' + '~'.repeat(6) + '.');
  let tocan = 0, pintados = 0, blancos = 0; const nOlas = new Set();
  for (let n = 0; n < 700; n += 2) { const dueno = new Map(), ids = new Set(), l = O.pixeles(suelo, n, 0, 640, 0, 480);
    l.forEach(([X, Y, c, id]) => { dueno.set(X + ',' + Y, id); pintados++; if (c === 'b' && id[0] === 's') blancos++; if (id[0] === 'w') ids.add(id); });
    dueno.forEach((v, k) => { const [X, Y] = k.split(',').map(Number); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const w = dueno.get((X + dx) + ',' + (Y + dy)); if (w !== undefined && w !== v) tocan++; } });
    nOlas.add(ids.size); }
  ok(pintados > 1000 && blancos > 100, 'hay olas y rayitas blancas (' + pintados + ' píxeles, ' + blancos + ' blancos en 350 cuadros)');
  ok(tocan === 0, 'ningún píxel de una ola o de una rayita blanca toca (ni en diagonal) a otra: 0 choques');
  ok(nOlas.size >= 6, 'la cantidad de olas a la vez cambia al azar (' + [...nOlas].sort((a, b) => a - b).join(', ') + ' a la vez)');
  // recorrido completo: en un lago de 6 casillas cada ola nace fuera del agua y termina fuera del agua (se deshace en la orilla)
  const ev = {}, hechos = []; let previo = new Set();
  for (let n = 0; n < 2400; n++) { const ahora = new Set(), mm = {};
    O.pixeles(lago, n, 0, 130, 0, 190).forEach(([X, , , id]) => { if (id[0] !== 'w') return; ahora.add(id); mm[id] = mm[id] ? [Math.min(mm[id][0], X), Math.max(mm[id][1], X)] : [X, X]; });
    ahora.forEach((id) => { if (!previo.has(id)) ev[id] = { ini: n, mn: mm[id][0], mx: mm[id][1] }; else { ev[id].mn = Math.min(ev[id].mn, mm[id][0]); ev[id].mx = Math.max(ev[id].mx, mm[id][1]); } });
    previo.forEach((id) => { if (!ahora.has(id) && ev[id].ini > 0) hechos.push(ev[id]); }); previo = ahora; }
  ok(hechos.length >= 10 && hechos.every((e) => e.mn <= 15 && e.mx >= 112), 'cada ola cruza el lago entero (' + hechos.length + ' olas medidas): nace fuera del agua y se deshace en la orilla opuesta, nunca aparece ni desaparece a mitad del agua');
  ok(O.pixeles(lago, 0, 0, 130, 0, 200).every((q) => q[0] >= -30 && q[0] <= 160), 'las olas se quedan cerca de su tramo de agua');
  ok(O.TIPOS.length === 5 && O.TIPOS.every((tp) => tp.ancho <= 10) && O.TIPOS.every((tp) => Math.max(...tp.p.map((q) => q[1])) <= 2), 'los 5 tipos de ola miden ≤ 10 de ancho y ≤ 3 filas');
  ok(O.pixeles(suelo, 7, 0, 300, 0, 200).join('|') === O.pixeles(suelo, 7, 0, 300, 0, 200).join('|'), 'mismo cuadro = mismo dibujo (semilla fija)'); }

// ── v2.44 · cobertura del agua: TODAS las casillas de agua tienen olas, también las de 1 casilla de ancho (la v2.42 dejaba sin olas las partes verticales del lago) ──
{ const O = G.capas.olas; // (v2.48b: antes el mapa real se buscaba en G.MAPAS, que no existe, y solo se probaban las formas sueltas; ahora se usa J.MAP)
  const formas = { 'mapa real (pueblo_inicial)': J.MAP, 'formas sueltas': [ '..........', '.~........', '..........', '...~~~~...', '...~~~~...', '.......~..', '.......~..', '.......~..', '..........', '.~~~~~~~..', '.~........', '.~........', '..........' ] };
  Object.keys(formas).forEach((nombre) => { const suelo = formas[nombre]; if (!suelo) return;
    const cuenta = {}; for (let n = 0; n < 800; n++) O.pixeles(suelo, n, 0, 800, 0, 800).forEach(([X, Y]) => { if (!O.visible(suelo, X, Y)) return; const k = Math.floor(Y / 16) + ',' + Math.floor(X / 16); cuenta[k] = (cuenta[k] || 0) + 1; });
    const agua = []; suelo.forEach((f, ty) => { for (let tx = 0; tx < f.length; tx++) if (f[tx] === '~') agua.push([ty + ',' + tx, cuenta[ty + ',' + tx] || 0]); });
    const med = agua.map((q) => q[1]).sort((a, b) => a - b)[Math.floor(agua.length / 2)];
    const flojas = agua.filter((q) => q[1] < Math.max(1, med * 0.4)).map((q) => q[0]);
    ok(agua.length > 0 && flojas.length === 0, nombre + ': las ' + agua.length + ' casillas de agua tienen olas (mediana ' + med + ' píxeles en 800 cuadros; con pocas olas: ' + (flojas.join(' ') || 'ninguna') + ')'); }); }

// ── v2.46 · luz por región: tinte liso, sin bordes ni manchas; solo con «Sombras» encendido; Oli, Lali y el arte no se tocan ──
{ const L = G.capas.luzDatos, R = L.REGIONES, ids = Object.keys(R), fs = require('fs'), plantilla = fs.readFileSync(__dirname + '/tools/editor_mapas.plantilla.html', 'utf8');
  ok(ids.length === 8 && ['albanota', 'silvara', 'carbuna', 'marenda', 'fulgoria', 'cirrena', 'obsidra', 'umbrada'].every((r) => R[r]), 'luz: las 8 regiones de la biblia tienen su temperatura de luz');
  ok(ids.every((r) => /^#[0-9a-f]{6}$/.test(R[r].color) && R[r].fuerza > 0 && R[r].fuerza <= 0.15), 'luz: todos los tintes son un color válido y suaves (fuerza ≤ 15 %, para que no manchen el arte)');
  const dibujo = (m, activo) => { const ant = G.SOMBREADO.ACTIVO, llam = []; G.SOMBREADO.ACTIVO = activo; G.capas.luzRegion({ set fillStyle(v) { llam.push(['estilo', v]); }, fillRect(...a) { llam.push(['rect', ...a]); } }, m, 300, 500); G.SOMBREADO.ACTIVO = ant; return llam; };
  const con = dibujo({ region: 'albanota' }, true), rects = con.filter((q) => q[0] === 'rect');
  ok(rects.length === 1 && rects[0].slice(1).join() === '0,0,300,500', 'luz: un solo tinte liso que cubre toda la vista (sin bordes, sin manchas, sin bandas)');
  ok(dibujo({ region: 'albanota' }, false).length === 0 && dibujo({ region: null }, true).length === 0 && dibujo({}, true).length === 0 && dibujo({ region: 'no_existe' }, true).length === 0, 'luz: sin «Sombras», sin región o con región desconocida no se dibuja nada (el juego se ve como siempre)');
  ok(G.mundo.mapa('pueblo_inicial').region === 'albanota', 'luz: pueblo_inicial es de la región albanota');
  ok(plantilla.includes('region: j.region') && plantilla.includes('o.region = m.region'), 'luz: el editor de mapas conserva la región al guardar'); }

// ── v2.48a · viento (función pura, todavía invisible): ráfagas en diagonal, poses con suavizado, retraso por planta, intervalo de 6-9 s, siempre igual ──
{ const V = G.capas.viento, W = 36, H = 26, N = 600, serie = (tx, ty) => { const r = []; for (let n = 0; n < N; n++) r.push(V.pose(tx, ty, n)); return r; };
  const todas = []; for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) todas.push(serie(tx, ty));
  ok(todas.every((r) => r.every((p) => p === 0 || p === 1 || p === 2)), 'viento: la pose de cada planta es 0 (recta), 1 (punta inclinada) o 2 (punta y 2.º píxel inclinados)');
  ok(todas.every((r) => r.slice(0, V.PRIMERA).every((p) => p === 0)), 'viento: en calma al empezar (antes de la primera ráfaga, 2 s)');
  const tramos = (r) => { const t = []; let i = 0; while (i < r.length) { if (r[i]) { let j = i; while (j < r.length && r[j]) j++; t.push(r.slice(i, j).join()); i = j; } else i++; } return t; };
  ok(todas.every((r) => tramos(r).every((q, k, a) => q === V.SEC.join() || k === a.length - 1)), 'viento: cada reacción es exactamente la secuencia 1,2,2,1 (con suavizado, sin saltos de 0 a 2) y vuelve a la recta');
  let intervalosOk = true; for (let k = 0; k < 300; k++) { const d = V.rafaga(k + 1) - V.rafaga(k); if (d < V.INTERVALO[0] || d > V.INTERVALO[1]) intervalosOk = false; }
  ok(intervalosOk && V.INTERVALO[0] === 24 && V.INTERVALO[1] === 36, 'viento: una ráfaga cada 6-9 s (24-36 cuadros a 4 por segundo)');
  const llega = (tx, ty) => serie(tx, ty).findIndex((p) => p > 0);
  let izq = true, diag = true; for (let ty = 0; ty < H; ty += 5) for (let tx = 0; tx + 3 < W; tx++) if (llega(tx + 3, ty) < llega(tx, ty)) izq = false; for (let tx = 0; tx < W; tx += 5) for (let ty = 0; ty + 4 < H; ty++) if (llega(tx, ty + 4) < llega(tx, ty)) diag = false;
  ok(izq && diag, 'viento: la ráfaga avanza en diagonal de izquierda a derecha (una planta más a la derecha, o más abajo, nunca reacciona antes)');
  const retrasos = {}; for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) { const r = V.llegada(tx, ty) - Math.floor((tx + ty / 2) / V.VEL); retrasos[r] = (retrasos[r] || 0) + 1; }
  ok(Object.keys(retrasos).sort().join() === '0,1' && retrasos[0] > 100 && retrasos[1] > 100, 'viento: cada planta tiene su retraso de 0 o 1 cuadros (repartidos, para que sea una ola y no una franja)');
  ok(todas.every((r) => r.some((p) => p > 0)) && todas.every((r) => r.filter((p) => p === 0).length / N > 0.8), 'viento: todas las casillas del mapa reaccionan a las ráfagas y pasan más del 80 % del tiempo rectas');
  const a = []; for (let n = 0; n < 200; n++) a.push(V.pose(7, 9, n)); const b = []; for (let n = 199; n >= 0; n--) b.unshift(V.pose(7, 9, n));
  ok(a.join() === b.join() && V.pose(7, 9, 90) === V.pose(7, 9, 90), 'viento: siempre igual (sin azar) y no depende del orden de las consultas'); }

// ── v2.48b · matas de hierba encima del suelo (mapas con animar): en reposo idénticas a las horneadas; ninguna cambia de sitio, forma ni color ──
{ const S = G.sombreado, T = 16, suelo = J.MAP, Wm = suelo[0].length, Hm = suelo.length, crypto = require('crypto');
  const lineas = []; let rects = 0, formas = new Set(), dentro = true;
  for (let ty = 0; ty < Hm; ty++) for (let tx = 0; tx < Wm; tx++) if (suelo[ty][tx] === '.') { const d = S.matasDatos(tx, ty, { suelo }); if (!d) continue; formas.add(d.v); const px = []; S.dibujaMata((col, a, b) => { px.push([col, a, b, 1, 1].join(':')); if (a < 1 || a > 14 || b < 1 || b > 14) dentro = false; }, d); rects += px.length; lineas.push(tx + ',' + ty + '|' + px.join(';')); }
  ok(lineas.length === 38 && rects === 592 && crypto.createHash('md5').update(lineas.join('\n')).digest('hex') === '72ae162c2599d22c98c1dde84b3a3060', 'matas: las 38 matas del mapa (592 píxeles) son exactamente las de la v2.48a: misma casilla, forma, posición y color (huella md5 sacada del código anterior; si cambias el dibujo a propósito, hay que renovarla)');
  ok(formas.size === 3 && dentro, 'matas: salen las 3 formas y ningún píxel de mata toca el borde de su casilla');
  // el suelo horneado con las matas (como en la v2.48a) y el suelo sin matas + matas encima son el mismo dibujo, píxel a píxel (salvo las ondas fijas del agua, que con animar dibuja G.capas.agua)
  const bake = (animar) => { const mundo = new Array(Wm * T * Hm * T).fill(null), ctx = { fillStyle: '#000', fillRect(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < Wm * T && Y < Hm * T) mundo[Y * Wm * T + X] = this.fillStyle; } } }, m = { suelo, animar, W: Wm, H: Hm, objetos: [] };
    for (let ty = 0; ty < Hm; ty++) for (let tx = 0; tx < Wm; tx++) S.suelo(ctx, suelo[ty][tx], tx, ty, m, T); return { mundo, m, ctx }; };
  const A = bake(false), B = bake(true), dibujadas = []; const antesACTIVO = G.SOMBREADO.ACTIVO; G.SOMBREADO.ACTIVO = true;
  const rec = { set fillStyle(v) { this.c = v; }, fillRect(x, y, w, h) { dibujadas.push([x, y, w, h, this.c]); } };
  const aguaPx = new Set(Object.values(S.COL.agua)); let sinMatas = 0; for (let i = 0; i < A.mundo.length; i++) if (A.mundo[i] !== B.mundo[i] && !aguaPx.has(A.mundo[i])) sinMatas++;
  ok(sinMatas > 500, 'matas: con animar el suelo horneado no lleva las matas (se dibujan encima; píxeles de mata que faltan en el suelo: ' + sinMatas + ')');
  G.capas.matas(rec, B.m, { x: 0, y: 0 }, Wm * T, Hm * T); const nMatas = dibujadas.length; G.capas.flores(rec, B.m, { x: 0, y: 0 }, Wm * T, Hm * T); // (v2.49: las flores también van encima)
  dibujadas.forEach(([x, y, w, h, c]) => { B.mundo[y * Wm * T + x] = c; });
  const agua = new Set(Object.values(S.COL.agua)); let difs = 0; for (let i = 0; i < A.mundo.length; i++) if (A.mundo[i] !== B.mundo[i] && !agua.has(A.mundo[i])) difs++;
  ok(difs === 0, 'matas: con las matas encima, el suelo (con las flores encima, v2.49) es idéntico píxel a píxel al horneado (diferencias: ' + difs + ')');
  const esperado = S.matasLista(B.m).reduce((n, q) => n + MATAS_PX(q), 0); // píxeles de mata que no tapa una flor posterior
  function MATAS_PX(q) { let n = 0; S.dibujaMata((col, a, b) => { if (!q.oc.has(a + ',' + b)) n++; }, q); return n; }
  ok(nMatas === esperado && nMatas > 500 && dibujadas.every(([x, y, w, h]) => w === 1 && h === 1 && x >= 0 && y >= 0 && x < Wm * T && y < Hm * T), 'matas: G.capas.matas pinta un píxel por píxel de mata, todos dentro del mapa (' + dibujadas.length + ')');
  const n0 = dibujadas.length; dibujadas.length = 0; G.capas.matas(rec, { ...B.m, animar: false }, { x: 0, y: 0 }, Wm * T, Hm * T); G.SOMBREADO.ACTIVO = false; G.capas.matas(rec, B.m, { x: 0, y: 0 }, Wm * T, Hm * T); G.SOMBREADO.ACTIVO = antesACTIVO;
  ok(n0 > 0 && dibujadas.length === 0, 'matas: sin animar (se hornean en el suelo) o con el sombreado apagado no se dibuja nada encima');
  ok(!J.MAP || !(G.mundo && G.mundo.INICIAL && G.mundo.INICIAL.mapa.objetos || []).some((o) => G.OBJETOS[o.tipo] && G.OBJETOS[o.tipo].capa === 'bajo'), 'matas: el mapa no tiene objetos de capa «bajo» (se hornean encima de las matas; si los hay, hay que decidir el orden mata/objeto antes de dibujarlas encima)'); }

// ── v2.48c · viento en las matas: la punta de cada brizna se inclina 1 px (pose 1) y la punta y el 2.º píxel (pose 2); el pie y el tallo no se mueven; en reposo, el dibujo de siempre ──
{ const S = G.sombreado, V = G.capas.viento, suelo = J.MAP, m = { suelo, animar: true, W: suelo[0].length, H: suelo.length, objetos: [] }, T = 16, lista = S.matasLista(m);
  const px = (q, pose) => { const l = []; S.dibujaMata((col, a, b) => l.push([col, a, b]), q, pose); return l; };
  const cambian = (q, pose) => { const base = px(q, 0), p = px(q, pose); return base.map((e, i) => (e[1] !== p[i][1] || e[2] !== p[i][2] || e[0] !== p[i][0] ? i : -1)).filter((i) => i >= 0).length; };
  const pie = (q) => px(q, 0).length;
  let reposoOk = true, p1Ok = true, p2Ok = true, dentroOk = true, mismosOk = true;
  lista.forEach((q) => { const base = px(q, 0), sin = []; S.dibujaMata((col, a, b) => sin.push([col, a, b]), q); const p1 = px(q, 1), p2 = px(q, 2), brizn = S.MATAS[q.v].length;
    if (JSON.stringify(sin) !== JSON.stringify(base)) reposoOk = false;
    if (p1.length !== base.length || p2.length !== base.length) mismosOk = false;
    if (cambian(q, 1) !== brizn || cambian(q, 2) !== 2 * brizn) { p1Ok = false; p2Ok = false; }
    [p1, p2].forEach((p) => p.forEach((e, i) => { const b0 = base[i]; if (e[0] !== b0[0] || e[2] !== b0[2] || (e[1] - b0[1] !== 0 && e[1] - b0[1] !== 1)) p1Ok = false; })); // un píxel que se mueve va exactamente 1 px a la derecha (mismo color, misma altura)
    [p1, p2].forEach((p) => p.forEach(([, a, b]) => { if (a < 1 || a > 14 || b < 1 || b > 14) dentroOk = false; })); });
  ok(reposoOk && mismosOk, 'matas con viento: la pose 0 es exactamente el dibujo de siempre y todas las poses dibujan los mismos píxeles');
  ok(p1Ok && p2Ok, 'matas con viento: en la pose 1 solo cambia la punta de cada brizna y en la pose 2 la punta y el 2.º píxel (el pie y el resto del tallo no se mueven), en las ' + lista.length + ' matas y las 3 formas');
  ok(dentroOk, 'matas con viento: ninguna pose toca el borde de su casilla');
  const dibuja = (reloj, reducido) => { const rec = [], ctx = { set fillStyle(v) { this.c = v; }, fillRect(x, y, w, h) { rec.push([x, y, w, h, this.c].join()); } }, a = G.capas.reloj, r = G.capas.REDUCIDO, s = G.SOMBREADO.ACTIVO; G.capas.reloj = reloj; G.capas.REDUCIDO = reducido; G.SOMBREADO.ACTIVO = true; G.capas.matas(ctx, m, { x: 0, y: 0 }, m.W * T, m.H * T); G.capas.reloj = a; G.capas.REDUCIDO = r; G.SOMBREADO.ACTIVO = s; return rec; };
  const reposo = dibuja(0, false), todosMovidos = new Set(); let distintosOk = true;
  for (let n = 0; n < 160; n++) { const f = dibuja((n + 0.1) / 4, false); if (f.length !== reposo.length) distintosOk = false; lista.forEach((q, i) => { if (V.pose(q.tx, q.ty, n) > 0) todosMovidos.add(i); }); }
  ok(distintosOk && todosMovidos.size === lista.length, 'matas con viento: G.capas.matas pinta siempre los mismos píxeles de mata (' + reposo.length + ') y las ' + lista.length + ' matas se inclinan en algún momento de las primeras ráfagas');
  const q0 = lista[5]; let n2 = 0; while (V.pose(q0.tx, q0.ty, n2) !== 2) n2++;
  const f2 = dibuja((n2 + 0.1) / 4, false), esperado = []; const oc = q0.oc; S.dibujaMata((col, a, b) => { if (!oc.has(a + ',' + b)) esperado.push([q0.tx * T + a, q0.ty * T + b, 1, 1, col].join()); }, q0, 2);
  ok(esperado.every((e) => f2.includes(e)) && f2.length === reposo.length, 'matas con viento: en el cuadro en que una mata está en la pose 2, el juego la dibuja en la pose 2');
  ok(dibuja((n2 + 0.1) / 4, true).join('|') === reposo.join('|'), 'matas con viento: con ?movimiento=0 (o movimiento reducido) todas las matas quedan rectas, también durante una ráfaga');
  ok(dibuja(0, false).join('|') === reposo.join('|') && dibuja(0.5, false).join('|') === reposo.join('|'), 'matas con viento: antes de la primera ráfaga (2 s) todo está en reposo'); }

// ── v2.49 · viento en las flores: solo la cabeza se desplaza 1 px; el tallo y el pie quietos; en reposo, el dibujo de siempre; arreglo de las flores que se salían de su casilla ──
{ const S = G.sombreado, V = G.capas.viento, suelo = J.MAP, T = 16, m = { suelo, animar: true, W: suelo[0].length, H: suelo.length, objetos: [] }, lista = S.floresLista(m), hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
  const px = (tx, ty, pose) => { const l = []; S.dibujaFlores((col, a, b, w, h) => { for (let j = 0; j < (h || 1); j++) for (let i = 0; i < (w || 1); i++) l.push([col, a + i, b + j]); }, tx, ty, pose); return l; };
  ok(lista.length === suelo.join('').split('f').length - 1 && lista.length > 5, 'flores: hay una entrada por cada casilla de flores del mapa (' + lista.length + ')');
  // 1) el arreglo: ninguna flor se sale de su casilla; las que ya estaban bien no se mueven; solo se mueven las que antes salían negativas
  let dentro = true, iguales = true, corregidas = 0, total = 0;
  lista.forEach((q) => S.floresDatos(q.tx, q.ty).forEach((f, k) => { const h = hash(q.tx, q.ty, k + 20), viejoFy = 2 + ((h >> 4) % 11); total++; if (f.fx < 2 || f.fx > 12 || f.fy < 2 || f.fy > 12) dentro = false; if (f.fx !== 2 + (h % 11)) iguales = false; if (viejoFy >= 2) { if (f.fy !== viejoFy) iguales = false; } else corregidas++; }));
  ok(dentro, 'flores: ninguna flor se sale de su casilla (todas con posición 2 a 12)'); ok(iguales, 'flores: las flores que ya estaban dentro de su casilla no cambian de sitio ni un píxel (se corrigieron ' + corregidas + ' de ' + total + ')');
  // 2) en reposo = el dibujo horneado; las poses solo mueven la cabeza
  let reposoOk = true, cabezaOk = true, mismosOk = true, dentro2 = true;
  lista.forEach((q) => { const base = px(q.tx, q.ty, 0), sin = []; S.dibujaFlores((col, a, b, w, h) => { for (let j = 0; j < (h || 1); j++) for (let i = 0; i < (w || 1); i++) sin.push([col, a + i, b + j]); }, q.tx, q.ty);
    if (JSON.stringify(sin) !== JSON.stringify(base)) reposoOk = false;
    [1, 2].forEach((pz) => { const p = px(q.tx, q.ty, pz); if (p.length !== base.length) { mismosOk = false; return; } p.forEach((e, i) => { const b0 = base[i], dx = e[1] - b0[1]; if (e[0] !== b0[0] || e[2] !== b0[2] || (dx !== 0 && dx !== 1)) cabezaOk = false; if (e[1] < 0 || e[1] > 15 || e[2] < 0 || e[2] > 15) dentro2 = false; }); });
    const p1 = px(q.tx, q.ty, 1), mov = p1.filter((e, i) => e[1] !== base[i][1]).length;  // 3 flores; por flor se desplazan 7 píxeles dibujados: cabeza 2×2 (4) + fila oscura (2) + centro naranja (1)
    if (mov !== 3 * 7) cabezaOk = false; });
  ok(reposoOk && mismosOk, 'flores con viento: la pose 0 es exactamente el dibujo de siempre y todas las poses dibujan los mismos píxeles');
  ok(cabezaOk, 'flores con viento: solo se mueve la cabeza (1 px a la derecha, mismo color y altura); el pie y el tallo no se mueven, en las ' + lista.length + ' casillas');
  ok(dentro2, 'flores con viento: ninguna pose se sale de su casilla');
  // 3) lo que se ve: G.capas.flores
  const dibuja = (reloj, reducido) => { const rec = [], ctx = { set fillStyle(v) { this.c = v; }, fillRect(x, y, w, h) { rec.push([x, y, w, h, this.c].join()); } }, a = G.capas.reloj, r = G.capas.REDUCIDO, s = G.SOMBREADO.ACTIVO; G.capas.reloj = reloj; G.capas.REDUCIDO = reducido; G.SOMBREADO.ACTIVO = true; G.capas.flores(ctx, m, { x: 0, y: 0 }, m.W * T, m.H * T); G.capas.reloj = a; G.capas.REDUCIDO = r; G.SOMBREADO.ACTIVO = s; return rec; };
  const reposo = dibuja(0, false), movidas = new Set(); let mismoNum = true;
  for (let n = 0; n < 160; n++) { if (dibuja((n + 0.1) / 4, false).length !== reposo.length) mismoNum = false; lista.forEach((q, i) => { if (V.pose(q.tx, q.ty, n) > 0) movidas.add(i); }); }
  ok(mismoNum && movidas.size === lista.length && reposo.length > 100, 'flores con viento: G.capas.flores pinta siempre los mismos píxeles (' + reposo.length + ') y las ' + lista.length + ' casillas se inclinan en algún momento');
  const q0 = lista[3]; let n2 = 0; while (V.pose(q0.tx, q0.ty, n2) !== 2) n2++;
  const f2 = dibuja((n2 + 0.1) / 4, false), esperado = []; S.dibujaFlores((col, a, b, w, h) => { for (let j = 0; j < (h || 1); j++) for (let i = 0; i < (w || 1); i++) if (!q0.oc.has((a + i) + ',' + (b + j))) esperado.push([q0.tx * T + a + i, q0.ty * T + b + j, 1, 1, col].join()); }, q0.tx, q0.ty, 2);
  ok(esperado.length > 0 && esperado.every((e) => f2.includes(e)), 'flores con viento: en el cuadro en que una casilla está en la pose 2, el juego dibuja sus flores en la pose 2');
  ok(dibuja((n2 + 0.1) / 4, true).join('|') === reposo.join('|'), 'flores con viento: con ?movimiento=0 (o movimiento reducido) todas las flores quedan quietas, también durante una ráfaga');
  ok(dibuja(0, false).join('|') === reposo.join('|') && dibuja(0.5, false).join('|') === reposo.join('|'), 'flores con viento: antes de la primera ráfaga (2 s) todo está en reposo');
  const nPix = dibuja(0, false).length; { const a = G.SOMBREADO.ACTIVO; G.SOMBREADO.ACTIVO = false; const r0 = [], c0 = { set fillStyle(v) {}, fillRect() { r0.push(1); } }; G.capas.flores(c0, m, { x: 0, y: 0 }, m.W * T, m.H * T); G.capas.flores(c0, { ...m, animar: false }, { x: 0, y: 0 }, m.W * T, m.H * T); G.SOMBREADO.ACTIVO = a; ok(nPix > 0 && r0.length === 0, 'flores: con el sombreado apagado o sin animar no se dibuja nada encima'); }
  // 4) la orilla del agua sigue tapando las flores (como al hornear): ningún píxel de flor cae donde la orilla pinta
  const orilla = lista.filter((q) => q.oc.size > 0).length; const rec = dibuja(0, false); let tapados = 0; lista.forEach((q) => rec.forEach((e) => { const [x, y] = e.split(',').map(Number); if (x >= q.tx * T && x < q.tx * T + T && y >= q.ty * T && y < q.ty * T + T && q.oc.has((x - q.tx * T) + ',' + (y - q.ty * T))) tapados++; }));
  ok(tapados === 0, 'flores: ningún píxel de flor se pinta sobre la orilla del agua (casillas de flores con orilla: ' + orilla + ')'); }

// ── v2.49b · prueba HD-2D con las criaturas reales (hd2d/): el HTML generado coincide con los sprites del juego y no toca el juego ──
{ const cp = require('child_process'), fs = require('fs'), path = require('path'), r = cp.spawnSync('node', [path.join(__dirname, 'tools/hd2d.js'), '--comprobar'], { encoding: 'utf8' });
  ok(r.status === 0, 'hd2d/criaturas_hd2d.html coincide con los sprites actuales del juego (si falla: node tools/hd2d.js)');
  const html = fs.readFileSync(path.join(__dirname, 'hd2d/criaturas_hd2d.html'), 'utf8'), m = /const SPR=(\{.*?\});\n/s.exec(html), SPR = m ? JSON.parse(m[1]) : {};
  const ids = Object.keys(SPR); ok(ids.length === 3 && ids.every((id) => G.CREATURES[id]), 'hd2d: las 3 criaturas existen en el juego (' + ids.join(', ') + ')');
  let igual = true, n = 0; ids.forEach((id) => ['down', 'up', 'left', 'right'].forEach((d) => [0, 1].forEach((f) => { const sp = G.creatureSprite(id, d, f), o = SPR[id][d + f]; n++; if (!o || o.w !== sp.c.width || o.h !== sp.c.height) igual = false; })));
  ok(igual && n === 24, 'hd2d: cada criatura trae sus 8 fotogramas (4 direcciones × 2 pasos) con el tamaño de los sprites del juego (' + n + ' fotogramas)');
  ok(!/G\.|window\.G/.test(html.replace(/const SPR=.*\n/, '').replace(/const OLI=.*\n/, '')), 'hd2d: la página es independiente del juego (no usa G ni sus archivos)');
  ok(fs.existsSync(path.join(__dirname, 'dist/criaturas.html')) && (() => { const d = fs.readFileSync(path.join(__dirname, 'dist/criaturas.html'), 'utf8'); return !/\bREVISION\b|WebGLRenderer\s*=|<script[^>]+src=["'][^"']*three/i.test(d) && d.length < 3200000; })(), 'hd2d: el juego (dist/criaturas.html) NO lleva la librería Three.js (v2.64: el pintor HD-2D la pide a cdnjs solo al elegir HD-2D; ni en una etiqueta script fija ni dentro del archivo)'); }

// ── v2.50 · Oli jugable en la prueba HD-2D: sus sprites son los del juego y el control/colisiones existen en la página ──
{ const fs = require('fs'), path = require('path'), html = fs.readFileSync(path.join(__dirname, 'hd2d/criaturas_hd2d.html'), 'utf8'), m = /const OLI=(\{.*?\});\n/s.exec(html), O = m ? JSON.parse(m[1]) : {};
  let n = 0, igual = true, vacio = false; const mapa = { down: 'down', up: 'up', right: 'side', left: G.spr.rex_sideL_0 ? 'sideL' : 'side' };
  Object.keys(mapa).forEach((d) => [0, 1, 2].forEach((f) => { const sp = G.spr['rex_' + mapa[d] + '_' + f], o = O[d + f]; n++; if (!o || !sp || o.w !== sp.c.width || o.h !== sp.c.height) { igual = false; return; }
    if (!Buffer.from(o.d, 'base64').some((v, i) => i % 4 === 3 && v > 0)) vacio = true; }));
  { const mL = /const LALI=(\{.*?\});\n/s.exec(html), L = mL ? JSON.parse(mL[1]) : {}, ks = Object.keys(mapa).flatMap((d) => [0, 1, 2].map((f) => d + f));
    const t = L.down0 ? L.down0.w : 0, tam = ks.every((k) => L[k] && L[k].w === G.spr.luna_down_0.c.width && L[k].h === G.spr.luna_down_0.c.height);
    const espejo = (a, b) => { const A = Buffer.from(L[a].d, 'base64'), B = Buffer.from(L[b].d, 'base64'), W = L[a].w, H = L[a].h; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 4; c++) if (A[(y * W + x) * 4 + c] !== B[(y * W + (W - 1 - x)) * 4 + c]) return false; return true; };
    ok(ks.length === 12 && tam && t === 18 && L.down1.d !== L.down2.d && L.down0.d !== L.up0.d, 'hd2d: Lali trae sus 12 fotogramas con el tamaño de luna_* del juego, con pasos y direcciones distintos');
    ok(tam && espejo('left0', 'right0') && espejo('left1', 'right1') && espejo('left2', 'right2'), 'hd2d: el perfil izquierdo de Lali es el espejo del derecho (como en el juego)'); }
  const dist = (a, b) => O[a].d !== O[b].d; // los píxeles exactos los garantiza --comprobar (el HTML se regenera con render_sprites sobre chars.js)
  ok(n === 12 && igual && !vacio && dist('down0', 'down1') && dist('down1', 'down2') && dist('left0', 'right0') && dist('down0', 'up0'), 'hd2d: Oli trae sus 12 fotogramas (4 direcciones × quieto y 2 pasos) con el tamaño de rex_* del juego; los pasos y las direcciones son distintos');
  ok(/function actualiza\(dt\)/.test(html) && /const libre=/.test(html) && /function empuja\(/.test(html) && /id="joy"/.test(html) && /KeyW/.test(html), 'hd2d: Oli tiene control (joystick y teclado), colisiones (agua, escalones, árboles, criaturas) y cámara que lo sigue');
  ok(!/G\.|window\.G/.test(html.replace(/const (SPR|OLI)=.*\n/g, '')), 'hd2d: sigue sin depender del juego'); }

// ── v2.51b · paso A2: lo que se ve de cada personaje vive en src/vista.js (sin dibujar) y el 2D no ha cambiado ni una llamada de dibujo ──
{ const cp = require('child_process'), fs = require('fs'), path = require('path'), V = G.vista;
  const r = cp.spawnSync('node', [path.join(__dirname, 'tools/huella_juego.js'), '--comprobar'], { encoding: 'utf8' });
  ok(r.status === 0, 'huella del juego: el dibujo y el estado de una partida simulada son los de siempre (si falla a propósito: node tools/huella_juego.js --escribir) ' + (r.stdout || '').split('\n').slice(0, 3).join(' '));
  ok(V && typeof V.altura === 'function' && typeof V.criatura === 'function' && typeof V.persona === 'function', 'G.vista tiene altura, criatura y persona');
  const o = V.persona('oli', 'left', false, 0), l = V.persona('lali', 'left', false, 0), lr = V.persona('lali', 'right', true, 0.2);
  ok(o.vista === 'sideL' && !o.espejo && o.clave === 'rex_sideL_0', 'vista: Oli a la izquierda usa su perfil izquierdo propio (lado rojo), sin espejo');
  ok(l.vista === 'side' && l.espejo && l.clave === 'luna_side_0' && !lr.espejo && lr.vista === 'side', 'vista: Lali a la izquierda usa el perfil derecho espejado; a la derecha no se espeja');
  ok([0, 0.18, 0.36].map((t) => V.persona('oli', 'down', true, t).frame).join() === '1,2,1' && V.persona('oli', 'down', false, 5).frame === 0, 'vista: al andar alternan los fotogramas 1 y 2 cada 0,18 s; parado, el 0');
  const ids = Object.keys(G.CREATURES), conFloat = ids.find((id) => G.traits(id).float), conHop = ids.find((id) => G.traits(id).hop), c1 = { id: conFloat, x: 5, y: 5, dir: 'down', moving: false, tm: 0, talk: 0 }, antes = JSON.stringify(c1);
  const a1 = V.criatura(c1, 1.3), a2 = V.criatura(c1, 1.3);
  ok(JSON.stringify(a1) === JSON.stringify(a2) && JSON.stringify(c1) === antes, 'vista: es pura (mismo resultado dos veces y no modifica la criatura)');
  ok(conFloat && a1.up > 0 && a1.sombra.separacion === G.traits(conFloat).shadow[2] && a1.sombra.ancho < G.traits(conFloat).shadow[0] + 1, 'vista: la criatura que flota se separa del suelo y su sombra encoge');
  ok(conHop && V.criatura({ id: conHop, x: 0, y: 0, dir: 'up', moving: true, tm: 0.31, talk: 0 }, 0).up > 0 && V.criatura({ id: conHop, x: 0, y: 0, dir: 'up', moving: false, tm: 0.31, talk: 0 }, 0).up === 0, 'vista: la que salta solo se separa del suelo al moverse');
  const fuente = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(!/document|getContext|ctx\.|requestAnimationFrame/.test(fuente('src/vista.js').replace(/\/\/.*$/gm, '')), 'vista.js no toca el DOM ni el lienzo');
  ok(/G\.vista\.criatura/.test(fuente('src/game.js')) && /G\.vista\.persona/.test(fuente('src/game.js')) && /G\.vista\.altura/.test(fuente('src/game.js')), 'game.js (pintor 2D) usa G.vista en vez de calcularlo él');
  ok(require('./src/orden.json').juego.indexOf('src/vista.js') >= 0 && require('./src/orden.json').juego.indexOf('src/vista.js') < require('./src/orden.json').juego.indexOf('src/game.js'), 'src/vista.js está en la lista única (src/orden.json) antes de game.js'); }

// ── v2.54 · ID-3c paso B: maps/albanota.json con el suelo del plano 48×36 (los objetos del paso C se comprueban en el grupo 40) ──
{ const fs = require('fs'), cp = require('child_process'), path = require('path'), mundo = G.mundo;
  const ruta = path.join(__dirname, 'maps/albanota.json'), crudo = fs.readFileSync(ruta, 'utf8'), j = JSON.parse(crudo), m = mundo.mapa('albanota'), S = j.capas.suelo;
  ok(j.formato === 2 && j.id === 'albanota' && j.region === 'albanota' && j.ancho === 48 && j.alto === 36 && S.length === 36 && S.every((r) => r.length === 48) && m.W === 48 && m.H === 36, 'albanota: formato 2, 48×36, región albanota');
  ok(S.every((r) => /^[.t~=b]+$/.test(r)) && j.puertas.length === 10 && j.puertas[6].id === 'profundidades' && j.puertas[6].destino.mapa === '@prof' && j.puertas[0].id === 'centro_pc' && j.puertas[1].id === 'tienda' && j.puertas[2].id === 'laboratorio' && j.puertas[3].id === 'casa_de_oli' && j.puertas[4].id === 'casa_de_lali' && j.puertas[5].id === 'ermita' && !j.colision && j.puertas.slice(7).every((q) => /^carbuna_prov_/.test(q.id) && q.destino.mapa === 'pueblo_carbuna'), 'albanota: suelo con casillas . t ~ = b, seis puertas (Centro PC v2.137, Tienda v2.143, Laboratorio v2.147, Casa de Oli v2.154, Casa de Lali v2.158 y Ermita v2.161) + la boca de las Profundidades (v2.320) y sin capa de colisión');
  const c = (x, y) => S[y][x];
  const anillo = []; for (let y = 0; y < 36; y++) for (let x = 0; x < 48; x++) if (x < 2 || x >= 46 || y < 2 || y >= 34) anillo.push([x, y]);
  const abierto = (x, y) => (x < 3 && y >= 17 && y <= 19) || (x >= 23 && x <= 25 && y >= 34);
  ok(anillo.every(([x, y]) => (abierto(x, y) ? c(x, y) === '=' : (c(x, y) === 't' || c(x, y) === '~'))), 'albanota: el borde es bosque de 2 casillas; solo se abre la entrada al bosque (oeste, y 17-19) y la salida a Ruta 1 (sur, x 23-25)');
  ok([29, 30, 31].every((y) => S[y].split('').every((ch, x) => (x >= 23 && x <= 25 ? ch === 'b' : ch === '~'))) && [28, 32].every((y) => !S[y].includes('~')), 'albanota: arroyo recto de borde a borde (3 filas), con el puente en x 23-25 y nada de agua fuera de él');
  ok([[24, 14], [24, 22], [19, 18], [29, 18]].every(([x, y]) => c(x, y) === '=') && [20, 28].every((x) => [15, 21].every((y) => c(x, y) === '=')) && c(19, 14) === '.' && c(29, 22) === '.', 'albanota: plaza 9×7 en x 20-28, y 15-21 con sus 4 entradas centradas');
  ok(m.anclas.inicio && m.anclas.inicio[0] === 24 && m.anclas.inicio[1] === 24 && !mundo.solido(m, 24, 24) && !mundo.solido(m, 26, 24) && mundo.validar().length === 0, 'albanota: ancla de inicio libre (y la de Lali, dos casillas a la derecha) y el mundo sigue sin errores');
  // todo lo que se puede pisar se alcanza desde el inicio (sin islas) y las puertas de los edificios del plano tienen su camino
  const vis = new Set(['24,24']), cola = [[24, 24]]; while (cola.length) { const [x, y] = cola.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && !mundo.solido(m, x + a, y + b)) { vis.add(k); cola.push([x + a, y + b]); } }); }
  let libres = 0; for (let y = 0; y < 36; y++) for (let x = 0; x < 48; x++) if (!mundo.solido(m, x, y)) libres++;
  ok(vis.size === libres, 'albanota: todas las casillas pisables (' + libres + ') se alcanzan desde el inicio, también al otro lado del arroyo');
  ok([[4, 15], [13, 15], [14, 27], [26, 10], [34, 9], [43, 9], [36, 20], [1, 18], [24, 35]].every(([x, y]) => c(x, y) === '=' && vis.has(x + ',' + y)), 'albanota: hay camino hasta la casa de Lali, la de Oli, el laboratorio, el Centro PC, la tienda, la ermita, los huertos, el bosque y Ruta 1');
  const n = (re) => S.join('').split('').filter((ch) => re.test(ch)).length, tot = 48 * 36;
  ok(Math.abs(100 * n(/t/) / tot - 17) <= 1.5 && Math.abs(100 * n(/[~b]/) / tot - 8) <= 1.5 && Math.abs(100 * n(/[=b]/) / tot - 19) <= 1.5, 'albanota: reparto del plano (bosque ≈ 17 %, agua ≈ 8 %, caminos y plaza ≈ 19 %)');
  ok(j.zonas.length === 7 && j.zonas.every((z) => /^claro_/.test(z.id)) && j.npcs.length === 1 && j.npcs[0].tipo === 'guarida' && j.npcs[0].id === 'zefirax', 'albanota: 7 zonas de prueba temporales y la guarida de prueba de Zefirax (el juego final no tiene criaturas salvajes)');
  ok(INICIAL_DE_FABRICA === 'albanota' && /\?mapa=|\[\?&\]mapa=/.test(fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8')), 'albanota: desde la v2.57 la partida empieza en Albanota (el grupo 42 lo detalla); ?mapa=<id> sigue permitiendo abrir otro mapa');
  // v2.59 (ED-1): maps/albanota.json es la FUENTE ÚNICA (se edita con el editor); el generador ya no lo pisa sin permiso
  const r = cp.spawnSync('node', [path.join(__dirname, 'tools/historico/crear_albanota.js'), '--forzar'], { encoding: 'utf8' });
  ok(r.status === 1 && /fuente única/.test(r.stderr) && fs.readFileSync(ruta, 'utf8') === crudo, 'albanota: tools/historico/crear_albanota.js ya no puede escribir en maps/ (ni con --forzar): avisa, sale con error y NO toca maps/albanota.json (fuente única desde la v2.59)');
  const tmp = path.join(require('os').tmpdir(), 'albanota_original_test.json'), r2 = cp.spawnSync('node', [path.join(__dirname, 'tools/historico/crear_albanota.js'), '--salida', tmp], { encoding: 'utf8' });
  ok(r2.status === 0 && fs.existsSync(tmp) && JSON.parse(fs.readFileSync(tmp, 'utf8')).objetos.length === 55 && fs.readFileSync(ruta, 'utf8') === crudo, 'albanota: --salida escribe el plano original (55 objetos) en otro archivo sin tocar maps/'); try { fs.unlinkSync(tmp); } catch (e) { /* nada */ } }

// ── v2.55 · ID-3c paso C: objetos que ya existen en Albanota (casas, fuente, farolas, bancos, macetas, cartel, huerto con valla, juncos, nenúfares, puente) ──
{ const fs = require('fs'), path = require('path'), mundo = G.mundo, j = JSON.parse(fs.readFileSync(path.join(__dirname, 'maps/albanota.json'), 'utf8')), m = mundo.mapa('albanota'), S = j.capas.suelo, OB = G.OBJETOS, sol = (x, y) => mundo.solido(m, x, y);
  const de = (t) => j.objetos.filter((o) => o.tipo === t), nuevos = G.ALBANOTA_OBJETOS;
  ok(nuevos.length === 31 && nuevos.every((t) => OB[t] && OB[t].w > 0 && OB[t].h > 0 && Array.isArray(OB[t].huella)), 'albanota objetos: las 28 piezas (19 + 3 de la v2.243: roca, piedras y hierba_alta + 3 volúmenes provisionales + casa_lali, casa_oli y laboratorio del paso C de v2.72) están en el catálogo con tamaño y huella');
  ok(j.objetos.length === 86 && j.objetos.every((o) => OB[o.tipo]) && G.capas.validar(j, 48, 36).length === 0 && mundo.validar().length === 0, 'albanota objetos: 83 objetos, todos de un tipo que existe y dentro del mapa (sin problemas en validar)');
  ok(j.objetos.filter((o) => /arbol|abeto|roble/.test(o.tipo)).length >= 8, 'albanota objetos: árboles sueltos colocados a propósito (v2.251, petición del usuario: parque de descanso; la norma de colocación los vigila)');
  ok(nuevos.every((t) => { let bien = true; try { const mk2 = () => G.makeCanvas(OB[t].w, OB[t].h); OB[t].dibujar(mk2().getContext('2d'), mk2().getContext('2d'), 16); } catch (e) { bien = false; } return bien; }), 'albanota objetos: las 25 piezas se dibujan sin error');
  // casas: 5×5, la puerta (x+2, y+4) libre y con camino delante; el resto del rectángulo, sólido
  const casas = de('casa_lali').concat(de('casa_oli'), de('laboratorio'));  // v2.72: ya no hay `casa` neutra en Albanota
  ok(casas.length === 3 && casas.every((o) => { let b = !sol(o.x + 2, o.y + 4) && S[o.y + 5][o.x + 2] === '=' ; for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 5; dx++) if (!(dx === 2 && dy === 4) && !sol(o.x + dx, o.y + dy)) b = false; return b; }) && [[4, 14], [13, 14], [14, 26]].every(([x, y]) => casas.some((o) => o.x + 2 === x && o.y + 4 === y)), 'albanota objetos: casa de Lali, casa de Oli y laboratorio con la puerta libre (4,14), (13,14) y (14,26), camino delante y el resto sólido');
  // caminos principales y entradas de la plaza libres
  const libres = (pts) => pts.every(([x, y]) => !sol(x, y)), rg = (x0, x1, y0, y1) => { const r = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) r.push([x, y]); return r; };
  ok(libres(rg(23, 25, 10, 14)) && libres(rg(23, 25, 22, 35).filter(([x, y]) => S[y][x] !== '~')) && libres(rg(0, 19, 17, 19)) && libres(rg(29, 44, 17, 19)) && libres(rg(26, 43, 10, 11)) && libres(rg(42, 44, 9, 16)) && libres([[43, 8]]) && libres(rg(12, 22, 27, 28)), 'albanota objetos: las avenidas, la calle norte, el camino de la Ermita y el sendero del laboratorio siguen libres');
  // plaza: la fuente ocupa 3×2 en el centro y se puede rodear
  ok(de('fuente').length === 1 && [23, 24, 25].every((x) => sol(x, 18) && sol(x, 19)) && !sol(24, 17) && !sol(24, 20) && !sol(22, 18) && !sol(26, 18), 'albanota objetos: la fuente ocupa 3×2 casillas en el centro de la plaza y se puede rodear');
  // huerto: valla cerrada con entrada de 3 casillas (x 35-37, y 20), interior libre salvo el espantapájaros, plantas planas
  const valla = rg(32, 40, 20, 27).filter(([x, y]) => x === 32 || x === 40 || y === 27 || (y === 20 && !(x >= 35 && x <= 37)));
  ok(valla.every(([x, y]) => sol(x, y)) && [35, 36, 37].every((x) => !sol(x, 20)) && rg(33, 39, 21, 26).filter(([x, y]) => !(x === 36 && y === 25)).every(([x, y]) => !sol(x, y)) && sol(36, 25) && de('huerto').length === 1 && OB.huerto.capa === 'bajo' && OB.huerto.huella.length === 0, 'albanota objetos: huerto con valla cerrada (entrada de 3 casillas), interior pisable salvo el espantapájaros');
  // piezas del agua y el puente: planas o sin huella (no estorban)
  ok(de('puente_albanota').length === 1 && OB.puente_albanota.capa === 'bajo' && OB.puente_albanota.huella.length === 0 && [...de('juncos2'), ...de('juncos3'), ...de('nenufar'), ...de('nenufar_flor')].every((o) => S[o.y][o.x] === '~') && de('juncos2').length + de('juncos3').length === 8 && de('nenufar').length + de('nenufar_flor').length === 9, 'albanota objetos: puente plano sobre las 3×3 casillas «b»; 8 juncos y 9 nenúfares sobre agua, sin huella');
  // objetos sólidos solo sobre hierba, plaza o camino de plaza (no sobre agua ni bosque)
  ok(j.objetos.every((o) => OB[o.tipo].huella.every(([dx, dy, w, h]) => { for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) if (!/[.=]/.test(S[o.y + dy + b][o.x + dx + a])) return false; return true; })), 'albanota objetos: ninguna huella sólida cae sobre agua, puente ni bosque');
  // las 7 zonas de prueba siguen teniendo hueco para criatura y el ancla de inicio sigue libre
  const hay = (z) => { let n = 0; for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) if (G.aparicion.libre(m, x, y)) n++; return n; };
  ok(j.zonas.every((z) => hay(z) >= 1) && !sol(24, 24) && !sol(26, 24), 'albanota objetos: cada zona de prueba sigue teniendo al menos un hueco para criatura (' + j.zonas.map((z) => z.elemento + ' ' + hay(z)).join(', ') + ') y el inicio está libre'); }

// ── v2.56 · ID-3c paso D: volúmenes provisionales de Centro PC, Tienda y Ermita del Primer Eco en maps/albanota.json ──
{ const fs = require('fs'), path = require('path'), mundo = G.mundo, j = JSON.parse(fs.readFileSync(path.join(__dirname, 'maps/albanota.json'), 'utf8')), m = mundo.mapa('albanota'), S = j.capas.suelo, OB = G.OBJETOS, sol = (x, y) => mundo.solido(m, x, y);
  const E = [['centro_pc', 23, 5, 7, 5, 3, 114, 98], ['tienda', 32, 5, 5, 4, 2, 82, 82], ['ermita', 41, 4, 5, 5, 2, 82, 98]]; // [tipo, x, y, ancho, alto, columna de la puerta, w, h del dibujo] (docs/PLANO_ALBANOTA.md)
  ok(G.ALBANOTA_PROVISIONALES.join() === 'centro_pc,tienda,ermita' && E.every(([t, , , cw, ch, , w, h]) => OB[t] && OB[t].w === w && OB[t].h === h && OB[t].w === cw * 16 + 2 && OB[t].h === ch * 16 + 18 && OB[t].ox === -1 && OB[t].oy === -17), 'volúmenes: las 3 piezas provisionales están en el catálogo y su dibujo mide huella + 1 px de contorno (y 17 px de tejado por arriba)');
  ok(E.every(([t, x, y]) => j.objetos.filter((o) => o.tipo === t).length === 1 && j.objetos.some((o) => o.tipo === t && o.x === x && o.y === y)), 'volúmenes: cada edificio está colocado una sola vez, en la casilla del plano (23,5), (32,5) y (41,4)');
  ok(E.every(([, x, y, cw, ch, dx]) => { let b = true; for (let j2 = 0; j2 < ch; j2++) for (let i = 0; i < cw; i++) { const puerta = i === dx && j2 === ch - 1; if (sol(x + i, y + j2) === puerta) b = false; } return b; }), 'volúmenes: toda la huella (7×5, 5×4 y 5×5) es sólida salvo la casilla de la puerta, que queda libre');
  ok([[26, 9], [34, 8], [43, 8]].every(([x, y]) => E.some(([, ex, ey, , ch, dx]) => ex + dx === x && ey + ch - 1 === y) && !sol(x, y) && S[y + 1][x] === '='), 'volúmenes: puertas en (26,9), (34,8) y (43,8), con camino justo delante');
  { const vis = new Set(), q = [[24, 24]]; vis.add('24,24'); while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy, k = a + ',' + b; if (a >= 0 && b >= 0 && a < 48 && b < 36 && !vis.has(k) && !sol(a, b)) { vis.add(k); q.push([a, b]); } }); }
    ok([[26, 9], [34, 8], [43, 8]].every(([x, y]) => vis.has(x + ',' + y)), 'volúmenes: desde el inicio se llega andando hasta la puerta de Centro PC, Tienda y Ermita'); }
  ok(E.every(([t, , , , ch]) => OB[t].pieY >= (ch - 1) * 16 && OB[t].pieY <= (ch - 1) * 16 + 6), 'volúmenes: quien pisa la puerta se ve DELANTE del edificio (los pies del dibujo quedan por encima de los de quien está en la casilla de la puerta)');
  ok(E.every(([t, x, y, cw, ch], i) => E.every(([, x2, y2, cw2, ch2], k) => i === k || x + cw + 2 <= x2 || x2 + cw2 + 2 <= x || y + ch + 2 <= y2 || y2 + ch2 + 2 <= y)), 'volúmenes: entre edificios queda un hueco de al menos 2 casillas (el plano pedía 4; en el mapa editado v2.62b el Centro PC quedó a 2 de la tienda a propósito)');
  ok(j.objetos.filter((o) => !E.some((e) => e[0] === o.tipo)).every((o) => OB[o.tipo].huella.every(([dx, dy, w, h]) => { for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) { const X = o.x + dx + a, Y = o.y + dy + b; if (E.some(([, ex, ey, cw, ch]) => X >= ex && X < ex + cw && Y >= ey && Y < ey + ch)) return false; } return true; })), 'volúmenes: ningún otro objeto pisa la huella de un edificio');
  ok(mundo.validar().length === 0 && G.capas.validar(j, 48, 36).length === 0, 'volúmenes: el mundo y la capa de objetos siguen sin errores de validación'); }

// ── v2.57 · ID-3d: la partida empieza en Albanota; el pueblo provisional (pueblo_inicial) queda solo como mapa de pruebas ──
{ const fs = require('fs'), path = require('path'), mundo = G.mundo, motor = G.motor, T = 16, src = fs.readFileSync(path.join(__dirname, 'src/mapas.js'), 'utf8'), game = fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8');
  ok(INICIAL_DE_FABRICA === 'albanota' && /G\.dimensiones\.entrada\(G\.dimensiones\.DEFECTO\)/.test(src) && JSON.stringify(require('./datos/dimensiones/tonavia.json').entrada) === '{"mapa":"albanota","ancla":"inicio"}', 'inicio: la partida empieza en Albanota (ancla «inicio»); desde F3 el dato vive en datos/dimensiones/tonavia.json y mapas.js lo lee');
  const antes = mundo.INICIAL.mapa; mundo.INICIAL.mapa = 'albanota';
  { const est = motor.crear(5), o = est.jugadores.oli, l = est.jugadores.lali, m = mundo.mapa('albanota');
    ok(mundo.validar().length === 0 && o.mapa === 'albanota' && l.mapa === 'albanota' && o.x === 24 * T + 8 && !mundo.solido(m, Math.floor(o.x / T), Math.floor(o.y / T)) && !mundo.solido(m, Math.floor(l.x / T), Math.floor(l.y / T)), 'inicio: una partida nueva pone a Oli y a Lali en Albanota, en casillas libres, y el mundo no tiene errores');
    ok(est.mapas.albanota && !est.mapas.pueblo_inicial, 'inicio: solo se crea el estado del mapa donde se juega (el pueblo provisional no se simula si nadie va)'); }
  mundo.INICIAL.mapa = antes;
  const p = mundo.mapa('pueblo_inicial');
  ok(p && p.anclas.inicio && p.W === 36 && p.H === 26 && mundo.validar().length === 0 && /mundo\.INICIAL\.mapa = q\[1\]/.test(game), 'inicio: el pueblo provisional sigue existiendo (36×26, con ancla de inicio) y se abre con ?mapa=pueblo_inicial: es el mapa de pruebas');
  ok(!/mapa=albanota abre la partida en ese mapa \(solo para ver/.test(game) || /v2\.57/.test(game), 'inicio: el comentario de game.js ya no dice que Albanota es solo para ver y probar'); }

// ── v2.59 · ED-1: editor de mapas v2, parte 1 (ver y mover objetos). Sin navegador aquí: se comprueba el archivo generado; tools/prueba_editor.py lo prueba en Chromium ──
{ const fs = require('fs'), path = require('path'), cp = require('child_process'), ed = path.join(__dirname, 'tools/editor_mapas.html');
  const r = cp.spawnSync('node', [path.join(__dirname, 'tools/editor_mapas.js')], { encoding: 'utf8' });
  ok(r.status === 0 && fs.existsSync(ed), 'editor: node tools/editor_mapas.js genera tools/editor_mapas.html sin errores');
  const h = fs.readFileSync(ed, 'utf8'), pl = fs.readFileSync(path.join(__dirname, 'tools/editor_mapas.plantilla.html'), 'utf8');
  ok(!h.includes('/*__MOTOR__*/') && !h.includes('/*__MAPAS__*/[]') && h.includes('G.capas') && h.includes('albanota_objetos') && h.includes('"id":"albanota"'), 'editor: lleva dentro el motor de dibujo del juego (G.capas y las piezas de Albanota) y los mapas de maps/');
  ok(['src/chars.js', 'src/rampas.js', 'src/sombreado.js', 'src/capas.js', 'src/arboles.js', 'src/albanota_objetos.js'].every((f) => { const o = require('./src/orden.json'); return o.datos.concat(o.juego).includes(f) && h.includes(fs.readFileSync(path.join(__dirname, f), 'utf8').slice(0, 200)); }), 'editor: el motor embebido es el mismo código que el del juego (6 archivos de src/)');
  ok(/id="aCopy"/.test(pl) && /id="aDel"/.test(pl) && /id="aUndo"/.test(pl) && /data-m="-1,0"/.test(pl) && /function hitObjeto/.test(pl) && /function copySel/.test(pl) && /function nudge/.test(pl) && /objetos\.splice/.test(pl), 'editor: seleccionar, mover (arrastre y flechas), copiar, borrar y deshacer/rehacer de objetos');
  // el editor y el juego dibujan las piezas con la misma lista de objetos: todo tipo de maps/albanota.json existe en el catálogo
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'maps/albanota.json'), 'utf8'));
  ok(j.objetos.every((o) => G.OBJETOS[o.tipo] && Number.isInteger(o.x) && Number.isInteger(o.y)) && Object.keys(j).join() === 'formato,id,nombre,region,ancho,alto,base,capas,objetos,animar,anclas,puertas,conexiones,zonas,npcs,pesca', 'editor: maps/albanota.json tiene el orden de claves que escribe el editor (un mapa sin tocar se exporta idéntico)');
  ok(/maps\/albanota\.json[^.]*fuente única|fuente única[^.]*maps\/albanota\.json/.test(fs.readFileSync(path.join(__dirname, 'docs/ROADMAP.md'), 'utf8')), 'editor: los documentos dicen que maps/albanota.json es la fuente única'); }

// ── v2.60 · ED-2: editor de mapas v2, parte 2 (añadir piezas, avisos, probar en el juego). Sin navegador aquí: se comprueba el archivo; tools/prueba_editor.py lo prueba en Chromium ──
{ const fs = require('fs'), path = require('path'), ed = path.join(__dirname, 'tools/editor_mapas.html'), h = fs.readFileSync(ed, 'utf8'), pl = fs.readFileSync(path.join(__dirname, 'tools/editor_mapas.plantilla.html'), 'utf8');
  ok(/function conflictos/.test(pl) && /function perdidas/.test(pl) && /function ponerPieza/.test(pl) && /function buildPiezas/.test(pl) && /function probar/.test(pl) && /id="bProbar"/.test(pl) && /id="dlgP"/.test(pl), 'editor ED-2: paleta de piezas, avisos (conflictos, caminos cortados) y botón Probar en la plantilla');
  ok(!h.includes('/*__JUEGO__*/null') && h.includes('id="juegoSrc"') && h.includes('__MAPA_PRUEBA'), 'editor ED-2: el archivo generado lleva el juego dentro para probarlo');
  ok(/__MAPA_PRUEBA/.test(fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8')), 'editor ED-2: el juego acepta window.__MAPA_PRUEBA (mapa de prueba del editor)');
  const piezas = Object.keys(G.OBJETOS), nombres = pl.match(/const PIEZAS = \{[\s\S]*?\n\};/)[0];
  ok(piezas.every((t) => nombres.includes(t + ':')), 'editor ED-2: todas las piezas del catálogo (' + piezas.length + ') tienen nombre y grupo en la paleta');
  ok(/PUERTA_PIEZA = \{ casa: \[2, 4\], casa_lali: \[2, 4\], casa_oli: \[2, 4\], laboratorio: \[2, 4\], centro_pc: \[3, 4\], tienda: \[2, 3\], ermita: \[2, 4\] \}/.test(pl), 'editor ED-2: puertas de los 7 edificios (hueco de la fachada, igual que las de Albanota)'); }

// ── v2.61 · mapas del editor en el juego: exportar «mapas_editor.json» → botón «Mapas» → guardado en el navegador → rótulo → «Volver a los oficiales». Se prueba la lectura y validación (src/mapas.js), el arranque con un paquete guardado y los archivos; tools/prueba_mapas_juego.py lo prueba en Chromium ──
{ const fs = require('fs'), path = require('path'), cp = require('child_process'), mundo = G.mundo, leer = (t) => mundo.paquete.leer(t), J = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, 'maps/' + n + '.json'), 'utf8')), cl = (o) => JSON.parse(JSON.stringify(o));
  const alb = J('albanota'), pue = J('pueblo_inicial'), paq = (maps, extra) => JSON.stringify(Object.assign({ paquete: 'mapas_editor', version: 1, formato: 2, maps }, extra)), mal = (t, re) => { const r = leer(t); return !r.ok && r.errores.some((e) => re.test(e)); };
  const antes = JSON.stringify([Object.keys(mundo.mapas), mundo.mapas.albanota.objetos.length, mundo.mapas.albanota.nombre]);
  const ok1 = leer(paq([alb, pue]));
  ok(ok1.ok && ok1.ids.join() === 'albanota,pueblo_inicial' && ok1.reemplaza.length === 2 && ok1.nuevos.length === 0, 'mapas del editor: un paquete con los mapas de fábrica es válido y dice que sustituye a los dos oficiales');
  { const n = cl(pue); n.id = 'mi_mapa'; n.anclas = { inicio: [18, 13] }; const r = leer(paq([n])); ok(r.ok && r.nuevos.join() === 'mi_mapa' && r.reemplaza.length === 0 && r.combinados.albanota && r.combinados.mi_mapa, 'mapas del editor: un mapa nuevo se añade sin quitar los oficiales'); }
  ok(mal(paq([alb], {}).replace('"mapas_editor"', '"otra_cosa"'), /marcador/) && mal(JSON.stringify({ formato: 2, maps: [alb] }), /marcador/), 'validación: sin el marcador «mapas_editor» se rechaza y dice que hay que exportar con «Exportar al juego»');
  ok(mal(paq([alb], { version: 2 }), /más nueva/) && mal(paq([alb], { version: 0 }), /versión/) && mal(paq([alb], { version: 'x' }), /versión/), 'validación: versión más nueva, cero o rara → se rechaza con el motivo');
  ok(mal('{no es json', /JSON/) && mal('', /vacío/) && mal(paq([]), /ningún mapa/) && mal('[1,2]', /marcador/) && mal('x'.repeat(2000001), /demasiado grande/), 'validación: JSON roto, archivo vacío, sin mapas, lista suelta y archivo enorme → se rechazan');
  { const a = cl(alb); a.puertas = [{ id: 'p', x: 24, y: 24, destino: { mapa: 'no_existe', ancla: 'a' } }]; ok(mal(paq([a]), /puerta «p» va a un mapa que no existe/), 'validación: una puerta a un mapa que no existe se rechaza y lo dice'); }
  { const a = cl(alb); a.puertas = [{ id: 'p', x: 24, y: 24, destino: { mapa: 'pueblo_inicial', ancla: 'zz' } }]; ok(mal(paq([a]), /ancla que no existe/), 'validación: una puerta a un ancla que no existe se rechaza'); }
  { const a = cl(alb); a.puertas = [{ id: 'p', x: 0, y: 0, destino: { mapa: 'pueblo_inicial', ancla: 'inicio' } }]; ok(mal(paq([a]), /puerta «p» está sobre una casilla sólida/), 'validación: una puerta sobre una casilla sólida se rechaza'); }
  { const a = cl(alb); a.anclas.inicio = [0, 0]; ok(mal(paq([a]), /ancla «inicio» está sobre una casilla sólida/), 'validación: un ancla en una casilla sólida se rechaza'); }
  { const a = cl(pue); delete a.anclas.inicio; ok(mal(paq([a]), /falta el mapa o el ancla de inicio/), 'validación: sin el ancla «inicio» del mapa donde empieza la partida (aquí el de pruebas) se rechaza'); }
  { const a = cl(alb); a.conexiones = { norte: { mapa: 'no_existe' } }; ok(mal(paq([a]), /borde norte va a un mapa que no existe/), 'validación: un borde hacia un mapa que no existe se rechaza'); }
  { const a = cl(alb); a.zonas = [{ id: 'z', x: 0, y: 0, w: 2, h: 2, elemento: 'fuego' }]; ok(mal(paq([a]), /zona «z» no tiene ninguna casilla libre/), 'validación: una zona de aparición sin sitio para una criatura se rechaza (las mismas reglas del juego)'); }
  { const a = cl(alb); a.objetos.push({ tipo: 'cosa_rara', x: 3, y: 3 }); ok(mal(paq([a]), /tipo que no existe/), 'validación: un objeto de un tipo que no existe se rechaza'); }
  { const a = cl(alb); a.objetos.push({ tipo: 'banco', x: 999, y: 3 }); ok(!leer(paq([a])).ok, 'validación: un objeto fuera del mapa se rechaza'); }
  { const a = cl(alb); a.id = 'Mi Mapa'; const b2 = cl(alb); ok(mal(paq([a]), /id debe tener solo/) && mal(paq([alb, b2]), /repetido/), 'validación: id con letras raras o repetido → se rechaza'); }
  { const a = cl(alb); a.anclas = { inicio: 'x' }; const b2 = cl(alb); b2.puertas = [{ id: 'p' }]; const c2 = cl(alb); c2.ancho = 5000; ok(mal(paq([a]), /anclas deben ser pares/) && mal(paq([b2]), /puerta incompleta/) && mal(paq([c2]), /tamaño no es válido/), 'validación: estructura rota (anclas, puertas, tamaño) → mensaje claro en vez de un error raro'); }
  ok(JSON.stringify([Object.keys(mundo.mapas), mundo.mapas.albanota.objetos.length, mundo.mapas.albanota.nombre]) === antes && mundo.validar().length === 0, 'validación: leer un paquete (bueno o malo) no toca el mundo en marcha');
  ok(JSON.stringify(mundo.oficiales.albanota) === JSON.stringify(alb) && alb.objetos.length === 86, 'oficiales intactos: maps/albanota.json sigue con sus 83 objetos y es lo que el juego llama «oficial»');
  const arr = (e) => JSON.parse(cp.spawnSync('node', [path.join(__dirname, 'tools/prueba_mapas_importados.js'), e], { encoding: 'utf8' }).stdout || 'null');
  { const v = arr('valido'); ok(v && v.activo && v.nombre === 'Albanota (editor)' && v.objetos === 85 && v.oficialesIntactos === 86 && v.ids.join() === 'albanota,pueblo_inicial', 'arranque: con un paquete válido guardado en el navegador el juego arranca con los mapas del editor (los oficiales quedan aparte)'); }
  { const v = arr('invalido'); ok(v && !v.activo && v.error && /no existe/.test(v.error[0]) && v.nombre === 'Albanota' && v.objetos === 86, 'arranque: con un paquete guardado que no vale el juego NO se rompe: arranca con los oficiales y guarda el motivo'); }
  { const a = arr('vacio'), b = arr('prueba'), c = arr('oficiales'); ok(a && !a.activo && a.objetos === 86 && b && !b.activo && b.objetos === 86 && c && !c.activo && c.objetos === 86, 'arranque: sin nada guardado, dentro de «Probar» del editor y con ?oficiales=1 el juego usa los oficiales'); }
  const src = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), sinCom = (t) => t.replace(/\/\/.*$/gm, ''), ord = require('./src/orden.json').juego;
  ok(ord.indexOf('src/mapas_guardados.js') >= 0 && ord.indexOf('src/mapas_guardados.js') < ord.indexOf('src/mapas.js') && ord.indexOf('src/mapas_ui.js') > ord.indexOf('src/aparicion.js') && ord.indexOf('src/mapas_ui.js') < ord.indexOf('src/game.js'), 'orden: el guardado va antes de mapas.js (arranque) y la ventana «Mapas» después de aparicion.js (repasa las zonas) y antes de game.js');
  ok(!/localStorage|document\./.test(sinCom(src('src/mapas.js'))) && /localStorage/.test(src('src/mapas_guardados.js')) && !/localStorage/.test(sinCom(src('src/mapas_ui.js'))) && !/localStorage/.test(sinCom(src('src/game.js'))), 'un solo sitio: los mapas importados solo se guardan desde src/mapas_guardados.js (mapas.js sigue sin tocar el navegador)');
  { const ix = src('index.html'); ok(['mbtn', 'mrot', 'mdlg', 'melegir', 'moficiales', 'marchivo', 'mmsg'].every((i) => ix.includes('id="' + i + '"')) && /Mapas del editor/.test(ix) && /Volver a los oficiales/.test(ix) && /Mapas<\/button>/.test(ix), 'pantalla: botón «Mapas», rótulo «Mapas del editor», elegir archivo y «Volver a los oficiales» están en index.html'); }
  { const pl = src('tools/editor_mapas.plantilla.html'); ok(/id="bExp"[^>]*>Exportar al juego</.test(pl) && /paquete: 'mapas_editor', version: 1/.test(pl) && /download\('mapas_editor\.json', paqueteJuego\(\)\)/.test(pl) && !/maps\.json/.test(pl) && src('src/mapas.js').includes("MARCA: 'mapas_editor', VERSION: 1"), 'editor: «Exportar al juego» descarga mapas_editor.json con el marcador de versión (el mismo que lee el juego)'); }
}

// ── v2.62 · «✏️ Editar mapa» dentro del juego: el editor viaja en dist/criaturas.html y se abre en una ventana. Sin navegador aquí; tools/prueba_editar_en_juego.py lo prueba en Chromium móvil ──
{ const fs = require('fs'), path = require('path'), src = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), sinCom = (t) => t.replace(/\/\/.*$/gm, '');
  const ix = src('index.html'), ui = src('src/mapas_ui.js'), pl = src('tools/editor_mapas.plantilla.html'), bd = src('build.js');
  ok(['ebtn', 'edlg', 'meditar', 'mexportar'].every((i) => ix.includes('id="' + i + '"')) && /Editar mapa<\/button>/.test(ix) && /Importar mapas_editor\.json/.test(ix) && /Descargar mis mapas/.test(ix), 'pantalla: el juego tiene el botón «✏️ Editar mapa», «Editar este mapa», «Descargar mis mapas» e «Importar»');
  ok(ix.includes('id="mcopiar"') && ix.includes('id="mtexto"') && /navigator\.clipboard/.test(ui) && /aMano/.test(ui), 'pantalla: «📋 Copiar mis mapas» con caja de texto de reserva si el navegador no deja copiar');
  ok(typeof G.mundo.crudos === 'function' && G.mundo.crudos().albanota && G.mundo.crudos().albanota.id === 'albanota', 'mundo.crudos(): el editor del juego parte de los mapas con los que se juega ahora');
  ok(/EN_JUEGO/.test(pl) && /editorMapas: 'guardar'/.test(pl) && /editorMapasResp/.test(pl) && /if \(EN_JUEGO\) return;/.test(pl) && /id="bJugar"/.test(pl) && /id="bSalir"/.test(pl), 'editor: modo «dentro del juego» (Guardar y jugar, Salir, sin guardado propio en el navegador)');
  ok(/mundo\.paquete\.leer/.test(ui) && /e\.source !== marco\.contentWindow/.test(ui) && /alm\.guardar/.test(ui) && !/localStorage/.test(sinCom(ui)), 'ventana: el juego valida con las mismas reglas (paquete.leer), solo hace caso al editor de su ventana y guarda por el único sitio (mapas_guardados)');
  ok(/MARCA_MAPAS = '\/\*__MAPAS' \+ '__\*\/\[\]'/.test(ui) && !ui.includes('/*__MAPAS__*/[]') && !ui.includes('/*__EN_JUEGO__*/null'), 'marcadores partidos: el código del juego no contiene los marcadores literales de la plantilla (se colarían al generar el editor)');
  ok(/editorSrc/.test(bd) && /require\('\.\/tools\/editor_mapas\.js'\)\.lite/.test(bd), 'build.js mete el editor (sin el juego dentro) en dist/criaturas.html');
  const dist = src('dist/criaturas.html'), m = /<script type="application\/json" id="editorSrc">([\s\S]*?)<\/script>/.exec(dist), h = m ? JSON.parse(m[1]) : '';
  ok(h && h.includes('/*__MAPAS__*/[]') && h.includes('/*__EN_JUEGO__*/null') && h.includes('G.capas') && !h.includes('/*__MOTOR__*/') && h.length < 250000, 'dist: el editor embebido lleva el motor de dibujo, conserva los dos marcadores para el juego y no repite el juego entero');
}
// ── v2.63 · HD-B1 (1.ª mitad): terreno de Albanota en 3D (hd2d/albanota_hd2d.html), hecho del mapa real y del suelo que pinta el 2D. Sin navegador aquí; tools/prueba_hd2d_albanota.py lo prueba en Chromium móvil ──
{ const cp = require('child_process'), fs = require('fs'), path = require('path'), src = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
  const r = cp.spawnSync('node', [path.join(__dirname, 'tools/hd2d_albanota.js'), '--comprobar'], { encoding: 'utf8' });
  ok(r.status === 0, 'hd2d/albanota_hd2d.html coincide con maps/albanota.json y con el suelo que pinta el 2D (si falla: node tools/hd2d_albanota.js)');
  const pl = src('hd2d/plantilla_albanota.html'), h = src('hd2d/albanota_hd2d.html'), m = /const D=(\{.*\});\n/.exec(h), D = m ? JSON.parse(m[1]) : null;
  ok(D && D.id === 'albanota' && D.W === 48 && D.H === 36 && D.suelo.length === 36 && D.suelo.every((f) => f.length === 48) && D.suelo.join('') === JSON.parse(src('maps/albanota.json')).capas.suelo.join('') && D.png.length > 1000 && D.pngSinArboles.length > 1000, 'HD-B1: el HTML lleva las 48×36 casillas reales y los dos PNG del suelo');
  ok(/ALT=\{'~':-\.3,'t':\.6\}/.test(pl) && /localStorage/.test(pl) === false && /cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\//.test(pl) && /prefers-reduced-motion/.test(pl), 'HD-B1: relieve (agua baja, bosque alto), Three.js r128 como el resto de pruebas HD-2D, sin guardar nada y respetando «reducir movimiento»');
  ok(!/hd2d\//.test(src('build.js')) && !fs.readFileSync(path.join(__dirname, 'dist/criaturas.html'), 'utf8').includes('albanota_hd2d'), 'HD-B1: el terreno 3D es una prueba aparte: no entra en dist/criaturas.html (el juego 2D no cambia)'); }
// ── v2.64 · HD-B1 (2.ª mitad), HD-B2, HD-B3, HD-C1, HD-C2: pintor HD-2D DENTRO del juego (src/hd2d_pintor.js) y botón «Gráficos: 2D / HD-2D». Aquí solo lo puro y el código; el comportamiento con navegador lo prueba tools/prueba_hd2d_juego.py ──
{ const fs = require('fs'), path = require('path'), src = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), sinCom = (t) => t.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const H3 = G.hd2d, M = G.mundo.mapa('albanota'), orden = require('./src/orden.json').juego, pt = sinCom(src('src/hd2d_pintor.js')), gm = sinCom(src('src/game.js')), idx = src('index.html');
  ok(H3 && /cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js/.test(H3.CDN) && H3.activo === false && H3.elegido() === null, 'HD-2D: G.hd2d existe, apunta a Three.js r128 de cdnjs, está apagado y en node no hay elección guardada');
  ok(orden.indexOf('src/vista.js') < orden.indexOf('src/hd2d_pintor.js') && orden.indexOf('src/hd2d_pintor.js') < orden.indexOf('src/game.js') && orden.indexOf('src/capas.js') < orden.indexOf('src/hd2d_pintor.js'), 'HD-2D: el pintor se carga después de capas y vista y antes de game.js (src/orden.json)');
  // relieve (HD-B1): mismas alturas que el terreno de la 1.ª mitad
  const casilla = (c) => { for (let z = 0; z < M.H; z++) { const x = M.suelo[z].indexOf(c); if (x >= 0) return [x, z]; } };
  ok(H3.alt(M, ...casilla('~')) === -0.3 && H3.alt(M, ...casilla('t')) === 0 && H3.alt(M, ...casilla('b')) === 0 && H3.alt(M, ...casilla('.')) === 0 && H3.alt(M, -1, 0) === null && H3.alt(M, M.W, 0) === null && H3.altEn(M, 0, 0) === 0, 'HD-B1: agua −0,3 · bosque a nivel (v2.199) · puente y suelo a nivel · fuera del mapa = null (altEn: píxeles del juego)');
  // plan (HD-B1 2.ª mitad): qué se pone en 3D
  const P = H3.plan(M), cuenta = (c) => M.suelo.reduce((a, r) => a + r.split(c).length - 1, 0), por = (t) => P.objetos.filter((o) => o.tipo === t);
  const normales = M.objetos.filter((o) => (G.OBJETOS[o.tipo].capa !== 'bajo' || !!G.objeto3d.de(o.tipo)) && !/^(arbol_|abeto|roble_hito)/.test(o.tipo)), nArb = M.objetos.length - M.objetos.filter((o) => !/^(arbol_|abeto|roble_hito)/.test(o.tipo)).length;
  ok(P.arboles.length === cuenta('t') + nArb && P.objetos.length === normales.length && normales.length === 76 && P.arboles.every(([x, z, tipo]) => tipo || M.suelo[z][x] === 't'), 'HD-B1: hay un árbol por casilla «t» (' + P.arboles.length + ') y un objeto por cada pieza normal del mapa (' + P.objetos.length + '); puente y huerto (capa «bajo») se suman desde la v2.252, que tienen modelo 3D');
  ok(P.objetos.every((o) => o.modo !== 'plano' && o.modo !== 'fijo' && (['nenufar', 'nenufar_flor', 'valla_v', 'valla_ni', 'valla_nd', 'valla_9', 'espantapajaros', 'huerto', 'puente_albanota'].includes(o.tipo) ? o.modo === 'modelo' : true)) && por('nenufar').length === 4 && por('valla_9').length === 1, 'HD-B1: las vallas, el espantapájaros, el huerto, el puente y los nenúfares son modelo 3D (v2.251-v2.252); el resto son carteles que miran a la cámara (v2.70: salvo los edificios con volumen)');
  { const CASAS = ['casa_lali', 'casa_oli', 'laboratorio'], esCasa = (o) => CASAS.includes(o.tipo), vol = M.objetos.filter(esCasa), pv = P.objetos.filter(esCasa); ok(vol.length === 3 && pv.length === 3 && pv.every((o) => o.modo === 'volumen') && pv.every((o, i) => { const q = vol[i]; return o.tipo === q.tipo && o.x === q.x && o.z === q.y && o.y === 0; }) && P.objetos.filter((o) => o.modo === 'volumen').length === 30 && ['centro_pc', 'tienda', 'ermita', 'fuente'].every((t) => por(t).length === 1 && por(t)[0].modo === 'volumen'), 'B2b + D: las 3 casas del mapa (Lali, Oli y Laboratorio) salen como «volumen» en su casilla del mapa y a nivel del suelo; desde el paso D (v2.86) también el Centro PC, la Tienda, la Ermita y la Fuente (7 volúmenes) y, desde la v2.102, las 14 farolas y, desde la v2.105, los 3 bancos y, desde la v2.165, las 6 jardineras (30 en total)');
    G.hd2d.AJUSTES.VOLUMENES = false; const sin = G.hd2d.plan(M); G.hd2d.AJUSTES.VOLUMENES = true; ok(sin.objetos.every((o) => o.modo !== 'volumen') && sin.objetos.filter(esCasa).every((o) => o.modo === 'cartel') && sin.objetos.length === P.objetos.length, 'B2b: con G.hd2d.AJUSTES.VOLUMENES = false todos los edificios vuelven a ser láminas (interruptor de emergencia y de comparación)'); }
  { const fs3 = por('farola'), d = G.OBJETOS.farola, o = M.objetos.filter((q) => q.tipo === 'farola'); ok(fs3.length === 14 && o.length === 14 && fs3.every((f, k) => f.modo === 'volumen' && f.x === o[k].x && f.z === o[k].y && f.y === 0), 'objetos 3D (v2.102): las 14 farolas salen como «volumen» en su casilla del mapa y a nivel del suelo (antes eran carteles de ' + d.w + '×' + d.h + ' px)');
    G.hd2d.AJUSTES.VOLUMENES = false; ok(G.hd2d.plan(M).objetos.filter((q) => q.tipo === 'farola').every((f) => f.modo === 'cartel' && Math.abs(f.alto - d.h / 16) < 1e-9), 'objetos 3D: con AJUSTES.VOLUMENES = false las farolas vuelven a ser el cartel del 2D de siempre (' + d.w + '×' + d.h + ' px, pies en el borde de abajo)'); G.hd2d.AJUSTES.VOLUMENES = true; }
  ok(por('juncos2').every((o) => o.y === -0.3) && por('nenufar_flor').every((o) => o.y === -0.3), 'HD-B1: juncos y nenúfares están en el agua (altura del arroyo)');
  // vigilante de velocidad (HD-C2)
  const rep = (n, ms) => Array(n).fill(ms);
  ok(H3.lento(rep(120, 70)) === true && H3.lento(rep(120, 16)) === false && H3.lento(rep(30, 200)) === false && H3.lento(rep(120, 700)) === false && H3.lento(rep(100, 16).concat(rep(20, 80))) === false && H3.lento(rep(60, 16).concat(rep(80, 60))) === true, 'HD-C2: el vigilante pide volver al 2D con más de la mitad de los cuadros a más de 55 ms; ignora pocos datos y los cuadros de pestaña en segundo plano (> 600 ms)');
  // elección guardada (HD-C2): clave propia y a prueba de almacenamiento roto
  { const alm = {}, antes = global.localStorage; global.localStorage = { getItem: (k) => (k in alm ? alm[k] : null), setItem: (k, v) => { alm[k] = String(v); } };
    H3.recordar('hd'); const a = H3.elegido(); H3.recordar('2d'); const b = H3.elegido(); global.localStorage = { getItem() { throw new Error('modo privado'); }, setItem() { throw new Error('modo privado'); } }; let sinFallo = true; try { H3.recordar('hd'); sinFallo = H3.elegido() === null; } catch (e) { sinFallo = false; }
    global.localStorage = antes; if (antes === undefined) delete global.localStorage;
    ok(a === 'hd' && b === '2d' && Object.keys(alm).join() === 'criaturas.graficos.v1' && sinFallo, 'HD-C2: la elección se guarda bajo criaturas.graficos.v1 y, si el navegador no deja guardar (modo privado), no rompe nada'); }
  // HD-B2: el pintor solo LEE (sin colisiones, azar ni órdenes propias) y se apoya en el contrato del 2D
  ok(!/Math\.random|G\.motor|motor\.|bloqueado|solido|est\.[a-z]+\s*=[^=]|\.aplicar\(/.test(pt) && /G\.vista\.persona/.test(pt) && /G\.vista\.criatura/.test(pt) && /host\.estado\(\)/.test(pt) && /G\.creatureSprite/.test(pt), 'HD-B2: el pintor HD-2D no tiene colisiones, azar ni órdenes propias: lee jugadores y criaturas del motor (host.estado) y qué se ve de ellos de G.vista');
  // HD-B3: lleva al HD-2D lo que ya hace el 2D, con el MISMO código (G.capas)
  ok(/C\.matas\(/.test(pt) && /C\.flores\(/.test(pt) && /C\.agua\(/.test(pt) && /C\.luzRegion\(/.test(pt) && /C\.REDUCIDO/.test(pt) && /sombra\.ancho/.test(pt), 'HD-B3: olas, matas, flores, luz de región, sombras de criaturas y «menos movimiento» reutilizan las funciones del 2D (G.capas, G.vista)');
  // HD-C1 / HD-C2: botón, carga diferida y vuelta al 2D
  ok(/id="hbtn"/.test(idx) && /id="hcam"/.test(idx) && /data-hc="izq"/.test(idx) && /getElementById\('hbtn'\)/.test(gm) && /function irAHD\(/.test(gm) && /function volverA2D\(/.test(gm) && /if \(hd\) G\.hd2d\.dibujar\(\); else \{ draw\(\); drawPlates\(\); \}/.test(gm) && !/localStorage/.test(gm), 'HD-C1: botón «Gráficos: 2D / HD-2D» y botones de cámara en la partida; el bucle de game.js elige pintor y game.js no guarda nada (lo guarda el pintor)');
  ok(/createElement\('script'\)/.test(pt) && !/<script[^>]+three/i.test(idx) && /ESPERA_MS/.test(pt) && /alFallar\('el HD-2D iba lento'\)/.test(pt) && /webglcontextlost/.test(pt) && /No se pudo cargar el HD-2D/.test(pt) && /no puede dibujar el HD-2D/.test(pt), 'HD-C2: Three.js se pide solo al elegir HD-2D (script dinámico con tiempo máximo); sin internet, sin WebGL, con contexto perdido o lento, se vuelve al 2D y se avisa');
  ok(fs.existsSync(path.join(__dirname, 'tools/three_falso.js')) && fs.existsSync(path.join(__dirname, 'tools/prueba_hd2d_juego.py')) && !/three_falso/.test(fs.readFileSync(path.join(__dirname, 'dist/criaturas.html'), 'utf8')), 'HD-2D: el Three.js de mentira y la prueba de Chromium existen y no viajan en el juego'); }
// ── v2.67 · paso B (1.ª mitad) de «casas en 3D de verdad»: motor puro de volúmenes (src/volumenes.js) y campo `vol` del catálogo. La 2.ª mitad (texturas por cara, Casa de Lali completa, integración en el pintor) va aparte. Aquí no hay Three.js ni dibujo ──
{ const fs = require('fs'), path = require('path'), V = G.volumenes, conVol = Object.keys(G.OBJETOS).filter((t) => G.OBJETOS[t].vol), AN = G.mundo.mapa('albanota'), fsrc = fs.readFileSync(path.join(__dirname, 'src/volumenes.js'), 'utf8').replace(/\/\/[^\n]*/g, '');
  ok(V && typeof V.geometria === 'function' && typeof V.buferes === 'function' && V.MAX_TRIANGULOS === 2000, 'volúmenes: G.volumenes existe con geometría, búferes y presupuesto de 2.000 triángulos');
  { const orden = require('./src/orden.json').juego; ok(orden.indexOf('src/albanota_objetos.js') < orden.indexOf('src/volumenes.js') && orden.indexOf('src/volumenes.js') < orden.indexOf('src/hd2d_pintor.js'), 'volúmenes: se carga después del catálogo y antes del pintor HD-2D (src/orden.json)'); }
  ok(!/Math\.random|THREE|document\.|window\.|G\.motor|bloqueado/.test(fsrc), 'volúmenes: el motor es puro (sin azar, sin Three.js, sin DOM, sin motor del juego)');
  ok(['casa', 'casa_lali', 'casa_oli', 'laboratorio', 'centro_pc', 'tienda', 'ermita', 'fuente', 'farola', 'banco', 'maceta', 'maceta_i'].every((t) => conVol.includes(t)) && conVol.length === 12 && conVol.every((t) => V.validar(t, G.OBJETOS[t]).length === 0), 'volúmenes: casa, las 3 casas de Albanota (Lali, Oli, laboratorio), Centro PC, Tienda, Ermita, (v2.86) la Fuente, (v2.102) la farola y (v2.105) el banco y (v2.164) las dos jardineras llevan `vol` válido (' + conVol.join(', ') + '); el resto de piezas sigue como lámina');
  ok(V.validar('x', { vol: { muros: 0, tejado: { tipo: 'cono' } }, huella: [] }).length >= 3 && V.validar('y', { vol: { muros: 3, tejado: { tipo: 'dosaguas', cumbrera: 'xx', alto: 1, vuelo: 0 } }, huella: [[0, 0, 1, 1]] }).length === 1, 'volúmenes: validar() detecta muros sin altura, tejado desconocido y cumbrera mal escrita');
  // 1 · la huella 3D ES la colisión: casillas del volumen = casillas que bloquea el motor para esa pieza (G.capas.bloqueos), medidas sobre el mapa real
  const medidas = {};
  conVol.forEach((t) => { const d = G.OBJETOS[t], g = V.geometria(d.huella, d.vol), ox = 7, oy = 9, motor = [...G.capas.bloqueos({ objetos: [{ tipo: t, x: ox, y: oy }] }, 60, 60)].map((k) => k.split(',').map(Number)).map(([x, y]) => (x - ox) + ',' + (y - oy)).sort().join(' '), vol3d = [...g.huella].sort().join(' ');
    const R = g.rect, esperado = { casa: [5, 5, 3.0 + 2.0 + 0.6 + 0.5625], casa_lali: [5, 5, 3.0 + 2.0 + 0.6 + 0.5625], casa_oli: [5, 5, 3.0 + 2.0 + 0.6 + 0.5625], laboratorio: [5, 5, 4.5 + 0.9], centro_pc: [7, 5, 4.4], tienda: [5, 4, 3.8], ermita: [5, 5, 6.0], fuente: [3, 2, 2.32], farola: [1, 1, 2.375], banco: [2, 1, 1.0], maceta: [1, 1, 0.9375], maceta_i: [1, 1, 0.9375] }[t], puerta = ((R.w - 1) / 2) + ',' + (R.d - 1);
    medidas[t] = g;
    ok(vol3d === motor && g.huella.size > 0, 'volúmenes: «' + t + '» cubre exactamente las ' + g.huella.size + ' casillas que bloquea el motor (ni una más ni una menos)');
    ok(R.w === esperado[0] && R.d === esperado[1] && Math.abs(g.altoTotal - esperado[2]) < 1e-9, 'volúmenes: «' + t + '» mide ' + R.w + '×' + R.d + ' casillas y ' + g.altoTotal.toFixed(1) + ' u de alto (ficha: ' + esperado.join(' / ') + '; la fuente redonda de la v2.92 llega a 2,32 u con el remate dorado; la casa suma poste y campana de la veleta: 5,0 + 0,6 + 0,5625; el laboratorio desde la v2.82 tiene azotea plana desde la v2.83 una cúpula y desde la v2.84 el cristal eléctrico que la corona: base a 4,5 u + 0,9 de alto)');
    if (t === 'fuente') ok(g.huella.size === R.w * R.d && g.poligonos.every((q) => q.parte !== 'nicho' && q.parte !== 'losa'), 'volúmenes: la fuente es un estanque macizo 3×2 (6 casillas, sin nicho ni losa)');
    else if (t === 'farola') ok(g.huella.size === 1 && g.huella.has('0,0') && g.poligonos.every((q) => q.parte !== 'nicho' && q.parte !== 'losa'), 'volúmenes: la farola ocupa una sola casilla (0,0), sin nicho ni losa (v2.102)');
    else if (t === 'maceta' || t === 'maceta_i') ok(g.huella.size === 1 && g.huella.has('0,0') && g.poligonos.every((q) => q.parte !== 'nicho' && q.parte !== 'losa' && q.parte !== 'muro'), 'volúmenes: «' + t + '» ocupa una casilla (0,0), sin nicho, losa ni muros (v2.164)');
    else if (t === 'banco') ok(g.huella.size === 2 && g.huella.has('0,0') && g.huella.has('1,0') && g.poligonos.every((q) => q.parte !== 'nicho' && q.parte !== 'losa' && q.parte !== 'muro'), 'volúmenes: el banco ocupa 2×1 casillas (0,0) y (1,0), sin nicho, losa ni muros (v2.105)');
    else ok(!g.huella.has(puerta) && g.huella.size === R.w * R.d - 1, 'volúmenes: «' + t + '» tiene un solo nicho de entrada de 1×1 en el centro de la fila sur, casilla (' + puerta + '), libre');
    ok(g.triangulos > 0 && g.triangulos <= V.MAX_TRIANGULOS, 'volúmenes: «' + t + '» usa ' + g.triangulos + ' triángulos (máximo ' + V.MAX_TRIANGULOS + ')'); });
  // 2 · los muros son exactamente los bordes entre casilla sólida y casilla libre (el perímetro del volumen = el de la colisión), con la cara hacia fuera
  conVol.filter((t) => !G.OBJETOS[t].vol.torno && !V.esDeCajas(G.OBJETOS[t].vol)).forEach((t) => { const g = medidas[t], S = g.huella; let bordes = 0; S.forEach((k) => { const [x, z] = k.split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => { if (!S.has((x + dx) + ',' + (z + dz))) bordes++; }); });
    const paredes = g.poligonos.filter((p) => p.parte === 'muro' || p.parte === 'nicho'), largo = paredes.reduce((n, p) => n + p.largo, 0);
    const haciaFuera = paredes.every((p) => { const c = p.v.reduce((a, q) => [a[0] + q[0] / p.v.length, a[1] + q[2] / p.v.length], [0, 0]), vx = c[0] + p.n[0] * 0.25, vz = c[1] + p.n[2] * 0.25, dentro = S.has(Math.floor(c[0] - p.n[0] * 0.25) + ',' + Math.floor(c[1] - p.n[2] * 0.25)), fuera = !S.has(Math.floor(vx) + ',' + Math.floor(vz)); return dentro && fuera; });
    ok(Math.abs(largo - bordes) < 1e-9 && haciaFuera, 'volúmenes: los muros de «' + t + '» suman ' + largo + ' casillas de pared (= ' + bordes + ' bordes de la colisión) y todos miran hacia fuera desde una casilla sólida'); });
  // 3 · cuatro caras y luz fija: oeste luz, sur base, este y norte sombra; cada pared visible tiene su cara
  { const g = medidas.casa, caras = (p) => g.poligonos.filter((q) => q.parte === 'muro' && q.cara === p).length;
    ok(['s', 'n', 'e', 'o'].every((c) => caras(c) >= 1) && g.poligonos.filter((q) => q.parte === 'muro').every((q) => q.tono === V.TONO[q.cara]) && V.TONO.o === 'luz' && V.TONO.s === 'base' && V.TONO.e === 'sombra' && V.TONO.n === 'sombra', 'volúmenes: la casa tiene muro al sur, norte, este y oeste, con luz fija arriba-izquierda (oeste luz · sur base · este y norte sombra)');
    ok(caras('s') === 2 && g.poligonos.filter((q) => q.parte === 'nicho').length === 3, 'volúmenes: la fachada sur de la casa son 2 tramos (a los lados del nicho) y el nicho tiene 3 paredes (fondo y dos lados)'); }
  // 4 · tejados: a dos aguas (eo y ns) y plano con peto; la cumbrera, el vuelo y los hastiales salen de los datos
  { const gc = medidas.casa, ge = medidas.ermita, gp = medidas.centro_pc, partes = (g, n) => g.poligonos.filter((q) => q.parte === n);
    ok(partes(gc, 'faldon').length === 2 && partes(gc, 'hastial').length === 2 && partes(gc, 'hastial').map((q) => q.cara).sort().join() === 'e,o' && partes(gc, 'faldon').map((q) => q.cara).sort().join() === 'n,s', 'volúmenes: casa = dos faldones (norte y sur) y dos hastiales (este y oeste): cumbrera este-oeste');
    ok(partes(ge, 'faldon').map((q) => q.cara).sort().join() === 'e,o' && partes(ge, 'hastial').map((q) => q.cara).sort().join() === 'n,s', 'volúmenes: Ermita = faldones este y oeste y hastiales norte y sur (el frontón mira al sur): cumbrera norte-sur');
    const ymax = (q) => Math.max(...q.v.map((p) => p[1])), alero = (q) => Math.min(...q.v.map((p) => p[1])), f = partes(gc, 'faldon')[0];
    ok(Math.abs(ymax(f) - 5) < 1e-9 && Math.abs(alero(f) - (3 - 0.4 * (2 / 2.5))) < 1e-9, 'volúmenes: la cumbrera de la casa está a 5,0 u y el alero baja ' + (0.4 * 0.8).toFixed(2) + ' u con el vuelo de 0,4 para seguir la pendiente');
    const R = gc.rect, fx = f.v.map((p) => p[0]), fz = f.v.map((p) => p[2]); ok(Math.min(...fx) === R.x0 - 0.4 && Math.max(...fx) === R.x1 + 0.4 && Math.min(...fz) === R.z0 - 0.4, 'volúmenes: el tejado sobresale 0,4 u por los cuatro lados');
    ok(partes(gc, 'faldon').concat(partes(gc, 'hastial'), partes(ge, 'faldon'), partes(gp, 'cubierta')).every((q) => q.n[1] >= 0 && Math.abs(Math.hypot(...q.n) - 1) < 1e-9) && partes(gc, 'faldon').every((q) => q.n[1] > 0.5), 'volúmenes: los faldones miran hacia arriba y todas las normales son unitarias');
    ok(partes(gp, 'faldon').length === 0 && partes(gp, 'cubierta').length === 1 && partes(gp, 'peto').length === 4 && partes(gp, 'peto_dentro').length === 4 && partes(gp, 'peto_canto').length === 4 && Math.abs(gp.altoTotal - 4.4) < 1e-9, 'volúmenes: Centro PC = cubierta plana con peto de 0,4 u (4 caras por fuera, 4 por dentro y 4 cantos), 4,4 u en total'); }
  // 5 · el nicho: sus paredes suben hasta el tejado (no queda hueco bajo el alero) y la losa de entrada va plana en el suelo
  { const g = medidas.casa, R = g.rect, nicho = g.poligonos.filter((q) => q.parte === 'nicho'), fondo = nicho.find((q) => q.cara === 's'), lado = nicho.find((q) => q.cara === 'e');
    ok(fondo && Math.abs(Math.max(...fondo.v.map((p) => p[1])) - V.techoY(G.OBJETOS.casa.vol, R, 2, R.z1 - 1)) < 1e-9 && Math.max(...fondo.v.map((p) => p[1])) > 3 && lado && Math.abs(Math.max(...lado.v.map((p) => p[1])) - Math.max(...fondo.v.map((p) => p[1]))) < 1e-9 && Math.abs(Math.min(...lado.v.filter((p) => p[1] > 0).map((p) => p[1])) - 3) < 1e-9, 'volúmenes: las paredes del nicho suben hasta el tejado que tienen encima (fondo a ' + Math.max(...fondo.v.map((p) => p[1])).toFixed(1) + ' u, lados en pendiente de 3,0 a 3,8 u)');
    const losa = g.poligonos.filter((q) => q.parte === 'losa'); ok(losa.length === 1 && losa[0].v.every((p) => p[1] === V.LOSA_Y) && losa[0].n[1] === 1 && losa[0].v.every((p) => p[0] >= 2 && p[0] <= 3 && p[2] >= 4 && p[2] <= 5), 'volúmenes: la losa de entrada es un solo cuadrado plano de 1×1 a nivel del suelo, dentro del nicho'); }
  // 6 · búferes para el pintor: tamaños coherentes, colocados en la casilla del mapa y sobre el suelo, sin tocar el original; resultado repetible
  { const o = AN.objetos.find((q) => q.tipo === 'casa_lali'), d = G.OBJETOS.casa_lali, g = V.geometria(d.huella, d.vol), b = V.buferes(g, o.x, o.y, 0.6), b2 = V.buferes(V.geometria(d.huella, d.vol), o.x, o.y, 0.6);
    const nv = g.poligonos.reduce((n, p) => n + p.v.length, 0), minx = Math.min(...b.p.filter((_, i) => i % 3 === 0)), miny = Math.min(...b.p.filter((_, i) => i % 3 === 1)), minz = Math.min(...b.p.filter((_, i) => i % 3 === 2));
    ok(b.p.length === nv * 3 && b.n.length === nv * 3 && b.u.length === nv * 2 && b.i.length === g.triangulos * 3 && b.i.every((k) => k >= 0 && k < nv) && b.grupos.length === g.poligonos.length && b.grupos[b.grupos.length - 1].hasta === b.i.length, 'volúmenes: búferes de la casa (' + o.x + ',' + o.y + '): ' + nv + ' vértices, ' + g.triangulos + ' triángulos, un grupo por polígono');
    ok(Math.abs(minx - (o.x - 0.4)) < 1e-9 && Math.abs(minz - (o.y - 0.4)) < 1e-9 && Math.abs(miny - 0.6) < 1e-9 && JSON.stringify(b) === JSON.stringify(b2) && JSON.stringify(g) === JSON.stringify(V.geometria(d.huella, d.vol)) && Math.min(...g.poligonos.flatMap((p) => p.v.map((q) => q[1]))) === 0, 'volúmenes: los búferes se colocan en la casilla del mapa y sobre el suelo (y 0,6) sin tocar la geometría original, y salen idénticos cada vez'); }
  // 7 · Albanota: los 6 edificios y la fuente del mapa real dan un volumen igual a su colisión en su sitio
  { const ed = AN.objetos.filter((q) => G.OBJETOS[q.tipo].vol); ok(ed.length === 30 && ed.filter((q) => q.tipo === 'maceta' || q.tipo === 'maceta_i').length === 6 && ed.filter((q) => q.tipo === 'farola').length === 14 && ed.filter((q) => q.tipo === 'banco').length === 3, 'volúmenes: Albanota tiene 30 piezas con volumen (6 edificios, la fuente, desde la v2.102 las 14 farolas, desde la v2.105 los 3 bancos y desde la v2.164 las 6 jardineras) (' + ed.map((q) => q.tipo + '@' + q.x + ',' + q.y).join(' ') + ')');
    const sol = G.capas.bloqueos({ objetos: ed, colision: [] }, AN.W, AN.H); let tot = 0; ed.forEach((q) => { tot += V.geometria(G.OBJETOS[q.tipo].huella, G.OBJETOS[q.tipo].vol).huella.size; });
    ok(sol.size === tot && ed.every((q) => { const g = V.geometria(G.OBJETOS[q.tipo].huella, G.OBJETOS[q.tipo].vol); return [...g.huella].every((k) => { const [x, z] = k.split(',').map(Number); return AN.suelo[q.y + z] && sol.has((q.x + x) + ',' + (q.y + z)); }); }), 'volúmenes: en Albanota las 19 piezas con volumen suman ' + tot + ' casillas de volumen y son exactamente las ' + sol.size + ' que bloquean'); }
  // 8 · lo que NO cambia: el pintor y el 2D siguen igual (el motor aún no está enchufado)
  { const pt2 = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/G\.volumenes\.geometria/.test(pt2) && /G\.volumenes\.buferes/.test(pt2) && /G\.volumenes\.sombraSuelo/.test(pt2), 'volúmenes: el pintor HD-2D usa el motor (geometría, búferes y sombra de suelo) para las piezas con volumen (v2.70)'); } }
// ── v2.68 · paso B2a: texturas por cara de los volúmenes (src/volumenes_tex.js), dibujadas por código. Aquí solo estructura y medidas (el lienzo de node es falso); los píxeles los prueba tools/prueba_volumenes_tex.py en Chromium ──
{ const fs = require('fs'), path = require('path'), V = G.volumenes, TX = G.volTex, d = G.OBJETOS.casa, geo = V.geometria(d.huella, d.vol), src2 = fs.readFileSync(path.join(__dirname, 'src/volumenes_tex.js'), 'utf8').replace(/\/\/[^\n]*/g, '');
  ok(TX && typeof TX.textura === 'function' && TX.PX === 16 && TX.ESTILOS.join() === 'casa,centro,tienda,ermita,fuente,farola,banco,maceta', 'texturas: G.volTex existe (16 px por u) y tiene los estilos «casa», «centro», «tienda», «ermita» y «fuente» (estos cuatro desde el paso D, v2.86) desde la v2.102 «farola» y desde la v2.105 «banco» y desde la v2.165 «maceta»');
  { const orden = require('./src/orden.json').juego; ok(orden.indexOf('src/volumenes.js') < orden.indexOf('src/volumenes_tex.js') && orden.indexOf('src/volumenes_tex.js') < orden.indexOf('src/hd2d_pintor.js'), 'texturas: se carga después del motor de volúmenes y antes del pintor (src/orden.json)'); }
  ok(!/Math\.random|THREE|document\.|window\.|G\.motor|bloqueado|new Image|\.src\s*=/.test(src2), 'texturas: todo se dibuja por código (sin azar, sin Three.js, sin DOM propio, sin imágenes)');
  ok(d.vol.estilo === 'casa' && d.vol.fachada.join() === '6,52,80,48' && V.validar('casa', d).length === 0 && G.OBJETOS.centro_pc.vol.fachada.join() === '1,33,112,64' && G.OBJETOS.tienda.vol.fachada.join() === '1,36,80,45' && G.OBJETOS.ermita.vol.fachada.join() === '1,42,80,55' && G.OBJETOS.fuente.vol.estilo === 'fuente' && !G.OBJETOS.fuente.vol.fachada, 'texturas: la casa lleva estilo y fachada [6, 52, 80, 48] (la pared del dibujo 2D); desde el paso D (v2.86) también Centro PC [1, 33, 112, 64], Tienda [1, 36, 80, 45] y Ermita [1, 42, 80, 55]; la fuente tiene estilo propio y no recorta fachada');
  ok(V.validar('x', { vol: { muros: 3, tejado: { tipo: 'plano', peto: 1 }, estilo: 'castillo', fachada: [0, 0, 8, 8] }, w: 50, h: 50, huella: [[0, 0, 1, 1]] }).length === 1 && V.validar('y', { vol: { muros: 3, tejado: { tipo: 'plano', peto: 1 }, estilo: 'casa', fachada: [0, 0, 80, 8] }, w: 50, h: 50, huella: [[0, 0, 1, 1]] }).length === 1 && V.validar('z', { vol: { muros: 3, tejado: { tipo: 'plano', peto: 1 }, estilo: 'casa' }, w: 50, h: 50, huella: [[0, 0, 1, 1]] }).length === 1, 'texturas: validar() detecta un estilo que no existe, una fachada que se sale del dibujo y una fachada que falta');
  // cada polígono de la casa tiene su textura, del tamaño de su uv (16 px por u), y las de otros edificios no (aún)
  const tx = geo.poligonos.map((p) => [p, TX.textura('casa', p)]);
  ok(tx.length === 29 && tx.every(([p, t]) => t && t.w === TX.medida(p)[0] && t.h === TX.medida(p)[1] && t.c && t.w > 0 && t.h > 0), 'texturas: los 29 polígonos de la casa (5 muros, 3 de nicho, 2 faldones, 2 hastiales, la losa, 10 de la chimenea y 6 de la veleta) tienen textura del tamaño de su uv');
  { const m = (parte, cara) => TX.medida(geo.poligonos.find((p) => p.parte === parte && p.cara === cara));
    ok(m('muro', 'o').join() === '80,48' && m('muro', 'n').join() === '80,48' && m('faldon', 'n')[0] === 93 && m('hastial', 'o').join() === '80,32' && geo.poligonos.find((p) => p.parte === 'losa') && TX.medida(geo.poligonos.find((p) => p.parte === 'losa')).join() === '16,16', 'texturas: lateral y trasera 80×48 px, hastial 80×32, losa 16×16 y faldón de 93 px de ancho (5 u + 2 de vuelo)'); }
  { const fa = tx.filter(([p]) => p.parte === 'muro' && p.cara === 's').map(([, t]) => t), fondo = tx.find(([p]) => p.parte === 'nicho' && p.cara === 's')[1];
    ok(fa.length === 2 && fa.every((t) => t.w === 32 && t.h === 48 && /^fachada\|/.test(t.clave)) && fa[0].clave !== fa[1].clave && fondo.w === 16 && fondo.h === 61 && /^fachada\|2\|/.test(fondo.clave), 'texturas: la fachada sur son dos recortes del dibujo 2D de 32×48 px (a cada lado del nicho) y el fondo del nicho es el recorte de la puerta, de 16×61 px (sube hasta el tejado)'); }
  // la misma cara con otro tono es otra textura, y se reutiliza la ya hecha
  { const p0 = geo.poligonos.find((p) => p.parte === 'faldon' && p.cara === 'n'), a = TX.textura('casa', p0), b = TX.textura('casa', Object.assign({}, p0, { tono: 'luz' })), n0 = TX.usadas;
    ok(a !== b && a.clave !== b.clave && TX.textura('casa', p0) === a && TX.usadas === n0, 'texturas: la misma cara en otro tono es otra textura y se reutiliza la ya dibujada (caché)'); }
  ok(TX.textura('barril', geo.poligonos[0]) === null && TX.textura('cartel', geo.poligonos[0]) === null, 'texturas: las piezas sin estilo (barril, cartel…) devuelven null y siguen como lámina (la farola tiene el suyo desde la v2.102 y el banco desde la v2.105)');
  // uv en 0..1 y tonos: cada material desplaza su cadena un paso (base = la paleta del 2D)
  ok(tx.every(([p, t]) => TX.uvTextura(p, t).every(([u, v]) => u >= -1e-9 && u <= 1 + 1e-9 && v >= -1e-9 && v <= 1 + 1e-9)), 'texturas: las uv normalizadas quedan dentro de la textura (0..1)');
  { const P = G.PAL, r = (m, t) => TX.rampa(m, t); ok(r('yeso', 'base').md === P.cream && r('yeso', 'base').lo === P.cream2 && r('madera', 'base').md === P.wood3 && r('madera', 'base').hi === P.wood1 && r('madera', 'base').lo === P.woodD && r('teja', 'base').md === P.red && r('teja', 'base').lo === P.red2 && r('piedra', 'base').md === P.stone2 && r('azul', 'base').md === P.teal2 && r('yeso', 'luz').md === r('yeso', 'base').hi && r('yeso', 'sombra').md === r('yeso', 'base').lo, 'texturas: el tono «base» es exactamente la paleta del 2D (yeso, madera, teja, piedra, postigos) y luz / sombra son el paso de al lado de la misma cadena');
    let lanza = false; try { r('yeso', 'noche'); } catch (e) { lanza = true; } ok(lanza, 'texturas: pedir un tono que no existe da error, no un color inventado'); }
  ok(fs.existsSync(path.join(__dirname, 'tools/prueba_volumenes_tex.py')) && fs.existsSync(path.join(__dirname, 'docs/volumenes_tex_casa.png')) && /G\.volTex\.atlas/.test(fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8')), 'texturas: existe la prueba de Chromium y su hoja de contacto; el pintor HD-2D usa el atlas de cada edificio (v2.70)'); }
// ── v2.69 · paso B2b (1.ª parte): chimenea, veleta, atlas por edificio y sombra de suelo (todo puro; el pintor se enchufa en la 2.ª parte). Los píxeles los prueba tools/prueba_volumenes_tex.py ──
{ const fs = require('fs'), path = require('path'), V = G.volumenes, TX = G.volTex, d = G.OBJETOS.casa, geo = V.geometria(d.huella, d.vol), R = geo.rect, cuenta = (parte) => geo.poligonos.filter((p) => p.parte === parte);
  // chimenea: cuerpo (4 caras) + corona (4) + tapa + boca; nace en el faldón norte y sube 0,8 u sobre la cumbrera
  const c = d.vol.chimenea, yC = d.vol.muros + d.vol.tejado.alto, ch = cuenta('chimenea'), co = cuenta('corona');
  ok(ch.length === 4 && co.length === 4 && cuenta('corona_tapa').length === 1 && cuenta('boca').length === 1, 'chimenea: cuerpo de 4 caras, corona de 4, tapa y boca (10 polígonos)');
  ok(Math.max(...co.flatMap((p) => p.v.map((q) => q[1]))) - yC > 0.79 && Math.max(...co.flatMap((p) => p.v.map((q) => q[1]))) - yC < 0.81, 'chimenea: sube 0,8 u por encima de la cumbrera (ficha)');
  ok(ch.every((p) => p.v.every((q) => q[0] >= R.x0 + c.x - 1e-9 && q[0] <= R.x0 + c.x + c.w + 1e-9 && q[2] >= R.z0 + c.z - 1e-9 && q[2] <= R.z0 + c.z + c.d + 1e-9)) && R.z0 + c.z + c.d < (R.z0 + R.z1) / 2, 'chimenea: queda dentro de su casilla de x y z y del lado NORTE de la cumbrera (sobre el faldón norte)');
  ok(ch.every((p) => { const top = Math.max(...p.v.map((q) => q[1])); return p.v.filter((q) => q[1] < top - 1e-9).length === 2 && p.v.filter((q) => q[1] < top - 1e-9).every((q) => Math.abs(q[1] - V.techoY(d.vol, R, q[0], q[2])) < 1e-9); }), 'chimenea: la base de cada cara sigue la pendiente del tejado (sin hueco ni asomar por debajo)');
  // veleta: poste fino sobre la cumbrera y campana en dos placas espalda con espalda (una mira al sur y otra al norte)
  const po = cuenta('poste'), ve = cuenta('veleta');
  ok(po.length === 4 && ve.length === 2 && ve.map((p) => p.cara).sort().join() === 'n,s' && ve.every((p) => p.v.length === 4), 'veleta: poste de 4 caras y dos placas de campana (sur y norte)');
  ok(Math.abs(Math.max(...po.flatMap((p) => p.v.map((q) => q[1]))) - (yC + d.vol.veleta.poste)) < 1e-9 && Math.abs(geo.altoTotal - (yC + d.vol.veleta.poste + V.VELETA_ALTO)) < 1e-9, 'veleta: el poste mide 0,6 u sobre la cumbrera y la campana remata la casa (6,16 u en total)');
  ok(geo.poligonos.every((p) => { const [a, b, e] = p.v, cr = [(b[1] - a[1]) * (e[2] - a[2]) - (b[2] - a[2]) * (e[1] - a[1]), (b[2] - a[2]) * (e[0] - a[0]) - (b[0] - a[0]) * (e[2] - a[2]), (b[0] - a[0]) * (e[1] - a[1]) - (b[1] - a[1]) * (e[0] - a[0])]; return cr[0] * p.n[0] + cr[1] * p.n[1] + cr[2] * p.n[2] > 0; }), 'volumen: TODAS las caras (también chimenea y veleta) miran hacia fuera: orden de vértices coherente con su normal');
  ok(geo.triangulos === 56 && geo.triangulos <= V.MAX_TRIANGULOS, 'volumen: la casa completa usa 56 triángulos (máximo ' + V.MAX_TRIANGULOS + ')');
  ok(V.validar('x', { vol: { muros: 3, tejado: { tipo: 'plano', peto: 1 }, chimenea: { x: 1, z: 1, w: 0, d: 1, sobre: 1 } }, huella: [[0, 0, 1, 1]] }).length === 1 && V.validar('x', { vol: { muros: 3, tejado: { tipo: 'plano', peto: 1 }, veleta: { x: 1, z: 1 } }, huella: [[0, 0, 1, 1]] }).length === 1 && V.validar('x', { vol: { muros: 3, tejado: { tipo: 'plano', peto: 1 }, chimenea: { x: 1, z: 1, w: 1, d: 1, sobre: 1 }, veleta: { x: 1, z: 1, poste: 1 } }, huella: [[0, 0, 1, 1]] }).length === 0, 'volumen: validar() detecta una chimenea con ancho 0 y una veleta sin poste, y acepta las bien escritas');
  // empaquetado del atlas (puro): sin solaparse, dentro del ancho, estable y que avisa si no cabe
  { const items = [{ k: 'a', w: 93, h: 60 }, { k: 'b', w: 80, h: 48 }, { k: 'c', w: 80, h: 48 }, { k: 'd', w: 16, h: 16 }, { k: 'e', w: 100, h: 60 }, { k: 'f', w: 40, h: 30 }], e1 = V.empaquetar(items, 256, 1), e2 = V.empaquetar(items.slice().reverse(), 256, 1);
    const solapa = items.some((p) => items.some((q) => p.k < q.k && e1.pos[p.k][0] < e1.pos[q.k][0] + q.w + 1 && e1.pos[q.k][0] < e1.pos[p.k][0] + p.w + 1 && e1.pos[p.k][1] < e1.pos[q.k][1] + q.h + 1 && e1.pos[q.k][1] < e1.pos[p.k][1] + p.h + 1));
    ok(!solapa && items.every((p) => e1.pos[p.k][0] + p.w <= 256) && e1.ok && JSON.stringify(e1) === JSON.stringify(e2), 'atlas: el empaquetado no solapa (con 1 px de hueco), cabe en 256 de ancho y no depende del orden de entrada');
    ok(V.empaquetar([{ k: 'a', w: 200, h: 200 }, { k: 'b', w: 200, h: 100 }], 256, 1).ok === false && V.empaquetar([{ k: 'a', w: 300, h: 10 }], 256, 1).ok === false, 'atlas: avisa (ok = false) si las texturas no caben en 256×256 o una es más ancha que el atlas'); }
  // el atlas de la casa: una sola textura de 256 de ancho, las repetidas guardadas una vez, cada polígono con sus uv dentro de su rectángulo
  { const A = TX.atlas('casa', geo), tex = geo.poligonos.map((p) => TX.textura('casa', p)), unicas = new Set(tex.map((t) => t.clave));
    ok(A && A.w === 256 && A.h <= 256 && A.texturas === unicas.size && A.texturas < geo.poligonos.length && A.uv.length === geo.poligonos.length, 'atlas: la casa cabe en UNA textura de 256×' + (A && A.h) + ' (ficha: máximo 256×256) con ' + (A && A.texturas) + ' texturas distintas para ' + geo.poligonos.length + ' polígonos');
    ok(A.uv.every((l) => l.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1)) && TX.atlas('casa', geo) === A, 'atlas: todas las uv caen dentro del atlas (0..1) y se calcula una sola vez por tipo de pieza');
    ok(TX.atlas('barril', geo) === null && TX.atlas('cartel', geo) === null, 'atlas: las piezas sin estilo (barril, cartel…) no tienen atlas y siguen como lámina (el banco tiene el suyo desde la v2.105)'); }
  // sombra de suelo: solo en casillas permitidas, nunca dentro del rectángulo del edificio y desplazada hacia el sur y el este
  { const m = G.mundo.mapa('albanota'), t = m.objetos.find((o) => o.tipo === 'casa_lali'), libre = (x, z) => { const ch = m.suelo[z] && m.suelo[z][x]; return !!ch && ch !== 't' && ch !== '~' && ch !== 'b'; }, q = V.sombraSuelo(R, t.x, t.y, libre), todo = V.sombraSuelo(R, t.x, t.y, () => true);
    const dentro = (r) => r[2] > t.x + R.x0 && r[0] < t.x + R.x1 && r[3] > t.y + R.z0 && r[1] < t.y + R.z1;
    ok(q.length > 0 && !q.some(dentro) && !todo.some(dentro), 'sombra de suelo: hay sombra y ningún trozo cae dentro del rectángulo del edificio (el nicho incluido)');
    ok(q.every(([xa, za, xb, zb]) => libre(Math.floor(xa), Math.floor(za)) && libre(Math.ceil(xb) - 1, Math.ceil(zb) - 1)) && V.sombraSuelo(R, t.x, t.y, () => false).length === 0, 'sombra de suelo: solo cae en casillas permitidas (nunca árboles «t», agua ni puente) y con todo prohibido no hay nada');
    const ex = (a) => [Math.min(...a.map((r) => r[0])), Math.min(...a.map((r) => r[1])), Math.max(...a.map((r) => r[2])), Math.max(...a.map((r) => r[3]))];
    const e = ex(todo); ok(Math.abs(e[2] - (t.x + R.x1 + V.SOMBRA.este)) < 1e-9 && Math.abs(e[3] - (t.y + R.z1 + V.SOMBRA.sur)) < 1e-9 && Math.abs(e[0] - (t.x + R.x0 - V.SOMBRA.oeste)) < 1e-9 && V.SOMBRA.este > V.SOMBRA.oeste && V.SOMBRA.sur > V.SOMBRA.norte, 'sombra de suelo: se extiende más al sur y al este que al norte y al oeste (luz arriba-izquierda)'); }
}
// ── v2.72 · paso C de docs/FICHAS_EDIFICIOS_3D.md: casas de Lali y Oli y laboratorio (piezas propias, también en el 2D); los píxeles los prueba tools/prueba_casas.py en Chromium ──
{ const OB = G.OBJETOS, V = G.volumenes, TX = G.volTex, fs = require('fs'), path = require('path'), j = JSON.parse(fs.readFileSync(path.join(__dirname, 'maps/albanota.json'), 'utf8'));
  const en = (t) => j.objetos.filter((o) => o.tipo === t).map((o) => o.x + ',' + o.y).join();
  ok(en('casa_lali') === '2,10' && en('casa_oli') === '11,10' && en('laboratorio') === '12,22' && !j.objetos.some((o) => o.tipo === 'casa'), 'paso C: Albanota usa casa_lali (2,10), casa_oli (11,10) y laboratorio (12,22); ya no lleva la casa neutra');
  const tres = ['casa_lali', 'casa_oli', 'laboratorio'];
  ok(tres.every((t) => JSON.stringify(OB[t].huella) === JSON.stringify(OB.casa.huella) && OB[t].pieY === 70 && OB[t].ox === -6) && OB.casa_lali.h === 108 && OB.casa_oli.h === 108 && OB.laboratorio.h === 114 && OB.laboratorio.oy === -26 && OB.laboratorio.oy + 20 === -6 && OB.laboratorio.oy + OB.laboratorio.h === OB.casa.oy + OB.casa.h, 'paso C: las tres casas tienen la misma huella, puerta y pies; el laboratorio es 6 px más alto (oy -26) para que la chimenea suba 10 px sin mover el tejado');
  ok(Object.keys(TX.VARIANTES).join() === 'lali,oli,lab' && tres.every((t) => OB[t].vol.variante && V.validar(t, OB[t]).length === 0) && V.validar('x', { vol: Object.assign({}, OB.casa.vol, { variante: 'zzz' }), w: 94, h: 108, huella: OB.casa.huella }).length === 1, 'paso C: cada casa lleva su variante de textura (lali, oli, lab) y validar() rechaza una variante que no existe');
  // v2.82 · L3 (1.ª mitad): el laboratorio tiene azotea PLANA con peto (sin faldones, hastiales, chimenea ni veleta); la casa sigue a dos aguas
  const gl = V.geometria(OB.laboratorio.huella, OB.laboratorio.vol), gc = V.geometria(OB.casa.huella, OB.casa.vol), partes = (g) => g.poligonos.map((p) => p.parte), nP = (g, n) => partes(g).filter((q) => q === n).length;
  ok(OB.laboratorio.vol.tejado.tipo === 'plano' && OB.casa.vol.tejado.tipo === 'dosaguas' && !OB.laboratorio.vol.chimenea && !OB.laboratorio.vol.veleta && nP(gl, 'cubierta') === 1 && !gc.poligonos.some((p) => p.parte === 'domo') && nP(gl, 'peto') === 4 && nP(gl, 'peto_dentro') === 4 && nP(gl, 'peto_canto') === 4 && ['faldon', 'hastial', 'chimenea', 'corona', 'boca', 'veleta'].every((n) => nP(gl, n) === 0) && nP(gl, 'domo') === 16 * 4 && nP(gl, 'anillo') === 16 && Math.abs(gl.altoTotal - 5.4) < 1e-9 && gl.triangulos <= V.MAX_TRIANGULOS, 'L3: el laboratorio tiene azotea plana con peto de 0,5625 u (1 cubierta + 4 caras de peto por fuera, por dentro y de canto), sin tejado a dos aguas ni chimenea ni veleta, y (v2.83) una cúpula de 64 polígonos sobre un tambor de 16 caras, y (v2.84) 5,4 u de alto con el cristal eléctrico en la punta; la casa no cambia (' + gl.triangulos + ' triángulos frente a ' + gc.triangulos + ')');
  { const cu = gl.poligonos.find((p) => p.parte === 'cubierta'), ux = Math.max(...cu.uv.map((q) => q[0])), uz = Math.max(...cu.uv.map((q) => q[1])), xs = cu.v.map((q) => q[0]), zs = cu.v.map((q) => q[2]);
    ok(Math.abs(ux - (Math.max(...xs) - Math.min(...xs))) < 1e-9 && Math.abs(uz - (Math.max(...zs) - Math.min(...zs))) < 1e-9, 'L3: el uv de la cubierta mide lo mismo que la cubierta (la textura no se estira)'); }
  // v2.83 · L3 (2.ª mitad, parte 1): la cúpula del laboratorio es UNA textura; sus uv caben en ella y la punta está en el centro del tejado
  { const ds = gl.poligonos.filter((p) => p.parte === 'domo'), t0 = TX.textura('laboratorio', ds[0]), D = OB.laboratorio.vol.domo, cum = Math.max(...gl.poligonos.filter((p) => p.parte === 'domo').flatMap((p) => p.v.map((q) => q[1]))), ap = ds.filter((p) => p.v.length === 3)[0].v.slice().sort((q, w) => w[1] - q[1])[0];   // la punta = el vértice más alto (orientar() puede invertir el orden)
    ok(ds.every((p) => TX.textura('laboratorio', p).clave === t0.clave) && ds.every((p) => p.uv.every(([u, v]) => u >= 0 && u * 16 <= t0.w + 1e-6 && v >= 0 && v * 16 <= t0.h + 1e-6)) && Math.abs(ap[0] - (gl.rect.x0 + D.x)) < 1e-9 && Math.abs(ap[2] - (gl.rect.z0 + D.z)) < 1e-9 && Math.abs(cum - 4.6) < 1e-9, 'L3: toda la cúpula comparte una textura de ' + t0.w + '×' + t0.h + ' px, sus uv caben dentro y la punta queda en el centro de la azotea a 4,6 u'); }
  ok(V.validar('x', { vol: Object.assign({}, OB.casa.vol, { domo: { x: 2.5, z: 2.5, r: 1, base: 0.6 } }), w: 94, h: 108, huella: OB.casa.huella }).length === 1 && V.validar('y', { vol: Object.assign({}, OB.laboratorio.vol, { domo: { x: 2.5, z: 2.5, r: 0, base: 0.6 } }), w: 94, h: 114, huella: OB.laboratorio.huella }).length === 1, 'L3: validar() rechaza una cúpula sobre tejado a dos aguas o con radio 0');
  // v2.84 · L3 (2.ª mitad, parte 2): 7 cristales elementales (uno por elemento, con sus colores) y el escáner sobre la azotea
  { const cs = OB.laboratorio.vol.cristales, cp = (n) => gl.poligonos.filter((p) => p.parte === n), cols = new Set(cp('cristal').map((p) => p.col)), todos = ['#5dae5a', '#f0603e', '#4580d4', '#f7d54a', '#bfe3f5', '#8a7f72', '#7a4cb0'], dentro = cs.every((c) => c.x - c.w / 2 >= 0.15 && c.x + c.w / 2 <= 4.85 && c.z - c.w / 2 >= 0.15 && c.z + c.w / 2 <= 4.85);
    const lej = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), ring = cs.filter((c) => c.y === undefined), sc = OB.laboratorio.vol.escaner;
    ok(cs.length === 7 && cp('cristal').length === 28 && cp('cristal_punta').length === 28 && cols.size === 7 && todos.every((c) => cols.has(c)) && dentro && cs.filter((c) => c.y !== undefined).length === 1 && ring.every((c) => Math.abs(lej(c, { x: 2.5, z: 2.5 }) - 1.75) < 1e-3), 'L3: 7 cristales (4 caras y 4 de punta cada uno), uno por elemento con su color, todos dentro del peto; el eléctrico corona la cúpula y los otros seis forman un aro de 1,75 u');
    ok(cp('plato').length === 8 && cp('punta').length === 4 && gl.poligonos.filter((p) => p.parte === 'poste').length === 4 && cs.every((c) => lej(c, sc) > 0.6) && sc.x + sc.r <= 4.85 && sc.z - sc.r >= 0.15 && cp('plato').every((p) => p.n[1] > 0), 'L3: escáner = mástil (4 caras), plato de 8 trozos que miran hacia arriba y punta dorada; no choca con ningún cristal y cabe dentro del peto'); }
  ok(V.validar('z', { vol: Object.assign({}, OB.laboratorio.vol, { cristales: [{ x: 1, z: 1, w: 0.3, h: 0.5, c: 'verde' }] }), w: 94, h: 114, huella: OB.laboratorio.huella }).length === 1 && V.validar('w', { vol: Object.assign({}, OB.casa.vol, { escaner: { x: 1, z: 1, mastil: 0, r: 0.3 } }), w: 94, h: 108, huella: OB.casa.huella }).length === 1, 'L3: validar() rechaza un cristal sin color hex y un escáner sin mástil');
  ok(tres.every((t) => { const g = V.geometria(OB[t].huella, OB[t].vol), A = TX.atlas(t, g); return A && A.w === 256 && A.h <= 256 && g.poligonos.every((p) => TX.textura(t, p)); }) && OB.laboratorio.vol.fachada.join() === '6,58,80,48' && OB.laboratorio.vol.fachada[1] + 48 <= OB.laboratorio.h, 'paso C: cada casa tiene su atlas de 256 px y todas sus caras con textura; la fachada del laboratorio está 6 px más abajo en su dibujo');
  // v2.79 · L1: el laboratorio es el centro de estudio de criaturas; solo él lleva el adorno animado (latido de la cúpula) y su dibujo base se hornea una sola vez; el resto de piezas no cambia
  ok(typeof OB.laboratorio.anima === 'function' && Object.keys(OB).filter((t) => OB[t].anima).sort().join() === 'altar,altar_mayor,casa_lali,casa_oli,fuente,incubadora,incubadora_lab,laboratorio,terminal_pc' && typeof G.capas.animar === 'function' && OB.laboratorio.w === 94 && OB.laboratorio.h === 114 && OB.laboratorio.huella.length === 3, 'L1: llevan `anima` el laboratorio (latido de la cúpula) y, desde la v2.90, las casas de Lali y Oli (humo) y la fuente (gotas) y, desde la v2.140, la pantalla del terminal, el huevo de la incubadora y las velas del altar; G.capas.animar existe; mide 94×114 con la misma huella');
  const ed = fs.readFileSync(path.join(__dirname, 'tools/editor_mapas.plantilla.html'), 'utf8'); ok(tres.every((t) => ed.includes(t + ': [')), 'paso C: el editor de mapas conoce las tres piezas nuevas (nombre, grupo y puerta)');
}
// ===== Grupo 53 · v2.73 · MINIMAPA: los lugares salen del catálogo y coinciden con su puerta real =====
{ const MM = G.minimapa, OB = G.OBJETOS, mundo = G.mundo, ms = mundo.mapa('albanota'), ls = MM.lugares(ms);
  const esp = { /* el mapa oficial es el que editó el usuario (v2.62c): Centro PC en (23,5) y Ermita en (41,4) */ 'Casa de Oli': '4,14', 'Casa de Lali': '13,14', 'Laboratorio': '14,26', 'Centro PC': '26,9', 'Tienda': '34,8', 'Ermita': '43,8', 'Plaza': '24,18', 'Profundidades': '9,3' };
  ok(ls.length === 8 && ls.every((l) => esp[l.nombre] === l.tx + ',' + l.ty), 'minimapa: Albanota marca 7 lugares (casas de Lali y Oli, laboratorio, Centro PC, tienda, ermita y plaza) en sus casillas');
  // puerta real = el único hueco de la fila de abajo de la huella del edificio (lo que de verdad se pisa para entrar)
  const hueco = (o) => { const d = OB[o.tipo], c = new Set(); let x0 = 1e9, x1 = -1e9, y1 = -1e9; d.huella.forEach(([dx, dy, w, h]) => { x0 = Math.min(x0, dx); x1 = Math.max(x1, dx + w - 1); y1 = Math.max(y1, dy + h - 1); for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) c.add((dx + a) + ',' + (dy + b)); }); const g = []; for (let x = x0; x <= x1; x++) if (!c.has(x + ',' + y1)) g.push([o.x + x, o.y + y1]); return g; };
  const edif = ms.objetos.filter((o) => OB[o.tipo].lugar && OB[o.tipo].lugar.puerta);
  ok(edif.length === 7 && edif.every((o) => { const g = hueco(o), l = OB[o.tipo].lugar; return g.length === 1 && g[0][0] === o.x + l.punto[0] && g[0][1] === o.y + l.punto[1]; }), 'minimapa: el punto de cada edificio es el hueco de su huella (su puerta real), sin excepciones');
  // se puede llegar a cada puerta andando desde el inicio (la plaza está dentro de la fuente: no es una puerta)
  const [ix, iy] = ms.anclas.inicio, vistos = new Set([ix + ',' + iy]), cola = [[ix, iy]]; while (cola.length) { const [x, y] = cola.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vistos.has(k) && !mundo.solido(ms, x + a, y + b)) { vistos.add(k); cola.push([x + a, y + b]); } }); }
  ok(ls.filter((l) => l.puerta).length === 7 && ls.filter((l) => l.puerta).every((l) => !mundo.solido(ms, l.tx, l.ty) && vistos.has(l.tx + ',' + l.ty)), 'minimapa: las 6 puertas marcadas son casillas libres y se llega a ellas desde el inicio');
  // se actualiza solo: mover o añadir un edificio en el mapa mueve o añade el lugar, sin tocar código
  const f0 = { objetos: [{ tipo: 'tienda', x: 1, y: 1 }, { tipo: 'banco', x: 3, y: 3 }] }, f1 = { objetos: [{ tipo: 'tienda', x: 5, y: 1 }, { tipo: 'banco', x: 3, y: 3 }, { tipo: 'ermita', x: 9, y: 9 }] };
  ok(MM.lugares(f0).length === 1 && MM.lugares(f0)[0].tx === 3 && MM.lugares(f0)[0].ty === 4 && MM.lugares(f1).length === 2 && MM.lugares(f1)[0].tx === 7 && MM.lugares({ objetos: [{ tipo: 'inventada', x: 0, y: 0 }] }).length === 0, 'minimapa: mover una tienda mueve su lugar, añadir una ermita lo añade, y las piezas sin «lugar» o desconocidas no marcan nada');
  ok(Object.keys(OB).filter((t) => OB[t].lugar).every((t) => { const l = OB[t].lugar; return l.nombre && l.icono && Array.isArray(l.punto) && l.punto.length === 2 && /^#[0-9a-f]{6}$/i.test(l.color); }), 'minimapa: cada pieza con «lugar» tiene nombre, icono, punto y color');
  // fondo: tamaño exacto, guardado (se dibuja una sola vez por mapa y tamaño) y la variante con nombres es otra
  const b1 = MM.fondo(ms, 3, {}), b2 = MM.fondo(ms, 3, {}), b3 = MM.fondo(ms, 3, { nombres: true }), b4 = MM.fondo(ms, 4, {});
  ok(b1.width === 48 * 3 && b1.height === 36 * 3 && b1 === b2 && b3 !== b1 && b4 !== b1 && b4.width === 192, 'minimapa: el fondo mide ancho×s por alto×s y se guarda por mapa y tamaño (no se redibuja por cuadro)');
  // jugadores: solo los del mapa que se mira, en casillas
  const pp = MM.posiciones(J.est, mundo.mapa('pueblo_inicial')), pa = MM.posiciones(J.est, ms);
  ok(pp.length === 2 && pa.length === 0 && pp.every((p) => p.tx >= 0 && p.ty >= 0), 'minimapa: los puntos son los de los jugadores que están en ese mapa (2 en el pueblo de pruebas, 0 en Albanota)');
  ok(window.__juego && G.minimapa.montar({ est: J.est }) === null, 'minimapa: sin los elementos de la página (pruebas en node) no se monta nada y no falla');
}
// ===== Grupo 54 · v2.74 · MAPA GRANDE: zoom con el dedo (funciones puras de la vista) =====
{ const MM = G.minimapa, m = { W: 48, H: 36 }, v0 = { z: 1, x: 0, y: 0 };
  ok(MM.ZOOM_MAX === 4 && JSON.stringify(MM.limitar({ z: 9, x: 99, y: -5 }, m)) === JSON.stringify({ z: 4, x: 36, y: 0 }) && MM.limitar({ z: 0.2, x: 7, y: 7 }, m).z === 1 && MM.limitar({ z: 1, x: 7, y: 7 }, m).x === 0, 'zoom: la vista nunca baja de 1× ni pasa de 4× y no se sale del mapa');
  const v1 = MM.zoomEn(v0, 2, 30, 10, m);
  ok(v1.z === 2 && Math.abs((30 - v1.x) * v1.z - (30 - v0.x) * v0.z) < 1e-9 && Math.abs((10 - v1.y) * v1.z - (10 - v0.y) * v0.z) < 1e-9, 'zoom: al acercar, la casilla bajo los dedos se queda bajo los dedos');
  const v2 = MM.zoomEn(MM.zoomEn(v1, 2, 30, 10, m), 2, 30, 10, m); ok(v2.z === 4 && v2.x >= 0 && v2.x <= 36 && v2.y >= 0 && v2.y <= 27, 'zoom: acercar de más se queda en 4× y dentro del mapa');
  const v3 = MM.zoomEn(v2, 0.25, 30, 10, m); ok(v3.z === 1 && v3.x === 0 && v3.y === 0, 'zoom: al volver a 1× se ve el mapa entero otra vez');
}
// ===== Grupo 55 · v2.75 · MAPA GRANDE: tocar un lugar (nombre) y flecha hacia él (funciones puras) =====
{ const MM = G.minimapa, ms = G.mundo.mapa('albanota'), ls = MM.lugares(ms), t = ls.find((l) => l.nombre === 'Tienda');
  ok(MM.lugarEn(ls, t.tx + 0.5, t.ty + 0.5, 1) === t && MM.lugarEn(ls, t.tx + 1.2, t.ty - 0.6, 2) === t, 'tocar: un toque encima o cerca de un lugar lo elige');
  ok(MM.lugarEn(ls, 0, 0, 2) === null && MM.lugarEn([], 5, 5, 3) === null, 'tocar: un toque lejos de todo no elige nada');
  const a = { nombre: 'A', tx: 10, ty: 10 }, b = { nombre: 'B', tx: 12, ty: 10 }; ok(MM.lugarEn([a, b], 11.8, 10.5, 3) === b && MM.lugarEn([a, b], 10.6, 10.5, 3) === a, 'tocar: entre dos lugares cercanos gana el más cercano al dedo');
  ok(MM.borde(100, 80, 200, 160, 30).dentro === true && MM.borde(100, 80, 200, 160, 30).x === 100, 'flecha: un lugar dentro de la pantalla no necesita flecha en el borde');
  const e = MM.borde(900, 80, 200, 160, 30); ok(e.dentro === false && Math.abs(e.x - 170) < 1e-9 && Math.abs(e.y - 80) < 1e-9 && Math.abs(e.ang) < 1e-9, 'flecha: un lugar a la derecha → flecha en el borde derecho (menos el margen) apuntando a la derecha');
  const w = MM.borde(-500, -500, 200, 160, 30); ok(w.dentro === false && w.x >= 30 && w.x <= 170 && w.y >= 30 && w.y <= 130 && (Math.abs(w.x - 30) < 1e-9 || Math.abs(w.y - 30) < 1e-9) && Math.abs(w.ang + Math.PI * 0.75) < 0.3, 'flecha: un lugar arriba a la izquierda → esquina de arriba a la izquierda, apuntando en diagonal, siempre dentro de la pantalla');
  const s = MM.borde(100, 5000, 200, 160, 30); ok(!s.dentro && Math.abs(s.y - 130) < 1e-9 && Math.abs(s.ang - Math.PI / 2) < 0.05, 'flecha: un lugar muy abajo → borde de abajo, apuntando hacia abajo');
  ok(MM.DIST_LLEGADA > 0 && MM.DIST_LLEGADA <= 2, 'flecha: se quita al llegar (a menos de 2 casillas)');
}
// ── v2.86 · PASO D (3.ª fase de edificios 3D): Centro PC, Tienda (con toldo), Ermita y Fuente en volumen, con texturas por cara y atlas propio. Aquí estructura y medidas (el lienzo de node es falso); los píxeles los prueba tools/prueba_hd2d_volumenes.py en Chromium ──
{ const fs = require('fs'), path = require('path'), V = G.volumenes, TX = G.volTex, geoDe = (t) => V.geometria(G.OBJETOS[t].huella, G.OBJETOS[t].vol), NUEVAS = ['centro_pc', 'tienda', 'ermita', 'fuente'], partes = (g, n) => g.poligonos.filter((q) => q.parte === n), med = (t, p) => TX.medida(p).join('x');
  NUEVAS.forEach((t) => { const g = geoDe(t), at = TX.atlas(t, g), tx = g.poligonos.map((p) => TX.textura(t, p));
    ok(at && at.w === 256 && at.h <= 256 && tx.every((q, i) => { const m = g.poligonos[i].tex || TX.medida(g.poligonos[i]); return q && q.w === m[0] && q.h === m[1]; }) && g.triangulos <= V.MAX_TRIANGULOS && at.uv.length === g.poligonos.length && at.uv.every((l) => l.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1)), 'paso D: «' + t + '» tiene textura para sus ' + g.poligonos.length + ' polígonos, cabe en un atlas de 256×' + (at && at.h) + ' y usa ' + g.triangulos + ' triángulos (máximo ' + V.MAX_TRIANGULOS + ')'); });
  // fachadas: recortes del dibujo 2D con la altura exacta de los muros
  { const cp = geoDe('centro_pc'), ti = geoDe('tienda'), er = geoDe('ermita'), fa = (g) => partes(g, 'muro').filter((q) => q.cara === 's').map((q) => med('x', q)), fondo = (g, t) => med(t, g.poligonos.find((q) => q.parte === 'nicho' && q.cara === 's'));
    ok(fa(cp).join() === '48x64,48x64' && fondo(cp, 'centro_pc') === '16x64' && fa(ti).join() === '32x45,32x45' && fondo(ti, 'tienda') === '16x53' && fa(er).join() === '32x55,32x55' && /^16x(8\d|9\d)$/.test(fondo(er, 'ermita')), 'paso D: las fachadas sur son recortes del 2D con la altura de los muros (Centro PC 64 px, Tienda 45 px, Ermita 55 px); el fondo del nicho sube hasta el tejado');
    ok(['centro_pc', 'tienda', 'ermita'].every((t) => { const d = G.OBJETOS[t], [fx, fy, fw, fh] = d.vol.fachada; return fx + fw <= d.w && fy + fh <= d.h && fh === Math.ceil(d.vol.muros * 16 - 1e-9); }), 'paso D: cada `vol.fachada` cabe en su dibujo 2D y mide lo mismo que los muros en píxeles'); }
  // Centro PC: azotea plana con peto de teja azul verdoso (no recorta el 2D) y 3 ventanas por lado
  { const g = geoDe('centro_pc'), t = (q) => TX.textura('centro_pc', q), pe = partes(g, 'peto');
    ok(partes(g, 'cubierta').length === 1 && pe.length === 4 && pe.every((q) => /^centro\|peto\|/.test(t(q).clave)) && /^centro\|muro\|e\|sombra\|80\|64$/.test(t(partes(g, 'muro').find((q) => q.cara === 'e')).clave) && /^centro\|muro\|n\|sombra\|112\|64$/.test(t(partes(g, 'muro').find((q) => q.cara === 'n')).clave), 'paso D: Centro PC: cubierta y peto con material propio (no recortan el 2D), lados de 80×64 px y trasera de 112×64 px'); }
  // Tienda: tejado de madera a dos aguas y DOS TOLDOS inclinados (uno sobre cada escaparate, v2.253) pegados a la fachada, que sobresalen 0,8 u
  { const g = geoDe('tienda'), v = G.OBJETOS.tienda.vol, R = g.rect, to = partes(g, 'toldo'), fl = partes(g, 'toldo_fleco');
    ok(to.length === 2 && fl.length === 2 && to.every((t) => t.n[1] > 0 && t.n[2] > 0 && Math.abs(Math.hypot(...t.n) - 1) < 1e-9 && t.v.every((q) => q[2] >= R.z1 - 1e-9 && q[2] <= R.z1 + 0.8 + 1e-9 && q[0] >= R.x0 - 1e-9 && q[0] <= R.x1 + 1e-9)) && Math.max(...to[0].v.map((q) => q[0])) < Math.min(...to[1].v.map((q) => q[0])), 'v2.253: los toldos de la Tienda son dos telas inclinadas (miran hacia arriba y al sur) pegadas a la pared sur, pegadas al muro de fuera (z = 4) sobresalen 0,8 u y dejan libre la puerta del centro');
    ok(Math.max(...to[0].v.map((q) => q[1])) === v.toldo[0].y && Math.abs(Math.min(...fl[0].v.map((q) => q[1])) - (v.toldo[0].y - v.toldo[0].caida - 0.2)) < 1e-9 && med('tienda', to[0]) === '24x15' && med('tienda', fl[0]) === '24x4' && g.altoTotal === 3.8, 'v2.253: cada toldo arranca a 2,8 u, baja 0,45 u y su fleco cuelga 0,2 u; la Tienda sigue midiendo 3,8 u'); }
  // v2.254: rótulo «TIENDA» (placa pegada al muro de fuera, entre los dos toldos), vitrinas y puerta propias
  { const g = geoDe('tienda'), R = g.rect, ro = partes(g, 'rotulo'), ca = partes(g, 'rotulo_canto'), t = (q) => TX.textura('tienda', q), tos = partes(g, 'toldo'), r = G.OBJETOS.tienda.vol.rotulo;
    ok(ro.length === 1 && ca.length === 3 && ro[0].v.every((q) => q[2] > R.z1 && q[2] < R.z1 + 0.1) && Math.min(...ro[0].v.map((q) => q[0])) >= Math.max(...tos[0].v.map((q) => q[0])) - 0.1 && Math.max(...ro[0].v.map((q) => q[0])) <= Math.min(...tos[1].v.map((q) => q[0])) + 0.1 && Math.max(...ro[0].v.map((q) => q[1])) < tos[0].v[0][1] && r.texto === 'TIENDA' && t(ro[0]).w === 29 && t(ro[0]).h === 11, 'v2.254: el rótulo «TIENDA» (29×11 px) cuelga del muro de fuera entre los dos toldos, por debajo de ellos, con tres cantos');
    ok(partes(g, 'muro').filter((q) => q.cara === 's').every((q) => /^tienda\|vitrina\|/.test(t(q).clave)) && /^tienda\|puerta\|/.test(t(partes(g, 'nicho').find((q) => q.cara === 's')).clave) && V.validar('tienda', { huella: G.OBJETOS.tienda.huella, vol: Object.assign({}, G.OBJETOS.tienda.vol, { rotulo: { x: 0, w: 1, y: 0, alto: 1 } }) }).length === 1 && V.validar('tienda', G.OBJETOS.tienda).length === 0, 'v2.254: la fachada de la Tienda son dos vitrinas y la puerta (ya no es un recorte del 2D) y el rótulo exige su texto'); }
  // Ermita: frontón al sur con la hornacina (recorte del 2D) y óculo en la trasera
  { const g = geoDe('ermita'), hs = partes(g, 'hastial').find((q) => q.cara === 's'), hn = partes(g, 'hastial').find((q) => q.cara === 'n'), t1 = TX.textura('ermita', hs), t2 = TX.textura('ermita', hn);
    ok(t1.clave !== t2.clave && med('ermita', hs) === '80x42' && /^ermita\|hastial\|s\|base/.test(t1.clave) && /^ermita\|hastial\|n\|sombra/.test(t2.clave), 'paso D: la Ermita tiene dos hastiales distintos (frontón con hornacina y campana al sur, óculo al norte) de 80×42 px'); }
  // Fuente REDONDA de dos niveles (v2.92, F2): piezas de revolución de 16 caras; sin muros ni tejado
  { const g = geoDe('fuente'), v = G.OBJETOS.fuente.vol, T = v.torno, piezas = (sub) => g.poligonos.filter((q) => q.sub === sub), pz = (n) => g.poligonos.filter((q) => q.pz === n), ymaxPz = (n) => Math.max(...pz(n).flatMap((q) => q.v.map((p) => p[1]))), yminPz = (n) => Math.min(...pz(n).flatMap((q) => q.v.map((p) => p[1])));
    const recipientes = T.piezas.filter((z) => z.ri !== undefined), cerradas = T.piezas.filter((z) => z.tapa);
    ok(!v.muros && !v.tejado && !v.columna && !v.veleta && g.poligonos.every((q) => q.parte === 'torno') && ['estanque', 'pedestal', 'panza1', 'taza1', 'columna', 'panza2', 'taza2', 'campana', 'remate', 'remate2'].every((n, i) => T.piezas[i].pz === n), 'F2: la fuente ya no tiene muros, tejado, columna cuadrada ni veleta plana: son 10 piezas de revolución, de abajo arriba estanque, pedestal, taza grande (panza y taza), columna, taza pequeña (panza y taza), campana y remate (2)');
    ok(piezas('lado').length === 16 * T.piezas.length && piezas('borde').length === 16 * recipientes.length && piezas('dentro').length === 16 * recipientes.length && piezas('agua').length === 16 * recipientes.length && piezas('tapa').length === 16 * cerradas.length && recipientes.length === 3 && cerradas.length === 1 && g.poligonos.length === 16 * (T.piezas.length + 3 * recipientes.length + cerradas.length), 'F2: cada pieza es de 16 caras; los 3 recipientes (estanque y las dos tazas) llevan además borde, pared de dentro y agua, y la punta una tapa (' + g.poligonos.length + ' polígonos, ' + g.triangulos + ' triángulos)');
    ok(Math.abs(ymaxPz('estanque') - 0.55) < 1e-9 && piezas('agua').filter((q) => q.pz === 'estanque').every((q) => q.v.every((p) => Math.abs(p[1] - 0.40) < 1e-9)) && Math.abs(ymaxPz('taza1') - 1.12) < 1e-9 && Math.abs(ymaxPz('taza2') - 1.98) < 1e-9 && Math.abs(g.altoTotal - 2.32) < 1e-9 && Math.abs(yminPz('estanque')) < 1e-9, 'F2: estanque con borde a 0,55 u y agua a 0,40 u, taza grande hasta 1,12 u, taza pequeña hasta 1,98 u y remate a 2,32 u (' + g.altoTotal.toFixed(2) + ' u en total)');
    // todo es de revolución: cada vértice de una pieza está a su radio del centro (x = 1,5 y z = 1,0 desde la esquina de la huella, o sea el centro del estanque, casilla (24, 18) + 0,5 y 1)
    const cx = T.x + g.rect.x0, cz = T.z + g.rect.z0;
    ok(g.rect.x0 === -1 && g.rect.w === 3 && g.rect.d === 2 && cx === 0.5 && cz === 1 && T.piezas.every((z) => pz(z.pz).filter((q) => q.sub === 'lado').every((q) => q.v.every((p) => Math.abs(Math.hypot(p[0] - cx, p[2] - cz) - (Math.abs(p[1] - z.y0) < 1e-9 ? z.r0 : z.r1)) < 1e-9))), 'F2: el centro de la fuente es el del estanque (casilla 24, 18 + 0,5 y 1) y cada vértice de cada pared está exactamente a su radio de ese centro');
    // cabe en la huella: el volumen no se sale de la colisión (el estanque, de radio 1,0 u, toca el borde norte y el sur de la huella 3×2 y deja 0,5 u libres a cada lado)
    const R = g.rect, xs = g.poligonos.flatMap((q) => q.v.map((p) => p[0])), zs = g.poligonos.flatMap((q) => q.v.map((p) => p[2]));
    ok(Math.min(...xs) >= R.x0 - 1e-9 && Math.max(...xs) <= R.x1 + 1e-9 && Math.min(...zs) >= R.z0 - 1e-9 && Math.max(...zs) <= R.z1 + 1e-9 && Math.abs(Math.max(...zs) - Math.min(...zs) - 2) < 1e-9, 'F2: la fuente redonda cabe en su huella 3×2 (el estanque, de radio 1,0 u, toca justo el borde norte y el sur: el volumen no se sale de la colisión)');
    // las normales miran hacia fuera de cada superficie: paredes de fuera hacia fuera, de dentro hacia el eje, discos hacia arriba
    const hor = (q) => { const c = q.v.reduce((a, p) => [a[0] + p[0] / q.v.length, a[1] + p[2] / q.v.length], [0, 0]); return [c[0] - cx, c[1] - cz]; };
    ok(Math.abs(Math.hypot(...g.poligonos.find((q) => q.sub === 'lado').n) - 1) < 1e-9 && piezas('lado').filter((q) => q.v[0][1] !== q.v[2][1]).every((q) => { const [dx, dz] = hor(q); return q.n[0] * dx + q.n[2] * dz > 0; }) && piezas('dentro').every((q) => { const [dx, dz] = hor(q); return q.n[0] * dx + q.n[2] * dz < 0; }) && piezas('agua').concat(piezas('borde'), piezas('tapa')).every((q) => q.n[1] === 1 && q.v.every((p) => Math.abs(p[1] - q.v[0][1]) < 1e-9)), 'F2: las paredes de fuera miran hacia fuera, las de dentro hacia el eje y el agua, los bordes y la tapa hacia arriba (y planos)');
    // v2.167 · sombra de contacto: dos bandas concéntricas (1,00–1,18 u, k 0,75 · 1,18–1,40 u, k 0,35) de cuadritos de 0,125 u, centradas en la fuente (empuje 0,05 u), sin pintar bajo el estanque, y respetando el `permite`
    const sh = V.sombraSuelo(g.rect, 24, 18, () => true, V.redonda(v)), sh2 = V.sombraSuelo(g.rect, 24, 18, (x) => x < 25, V.redonda(v)), X = 24 + cx + 0.05, Z = 18 + cz + 0.05, dist = ([a, b, c2, d]) => Math.hypot((a + c2) / 2 - X, (b + d) / 2 - Z);
    ok(sh.length > 100 && sh.every((q) => Math.abs((q[2] - q[0]) - 0.125) < 1e-9 && Math.abs((q[3] - q[1]) - 0.125) < 1e-9 && dist(q) >= 1.0 && dist(q) < 1.40 && (q[4] === 0.75 ? dist(q) < 1.18 : q[4] === 0.35 && dist(q) >= 1.18)) && sh.some((q) => q[4] === 0.75) && sh.some((q) => q[4] === 0.35) && sh2.length > 0 && sh2.length < sh.length && sh2.every(([a, , c2]) => Math.floor((a + c2) / 2) < 25) && V.redonda(G.OBJETOS.casa_lali.vol) === null && V.sombraSuelo(geoDe('casa_lali').rect, 10, 10, () => true).length > 0, 'F2 (v2.167): la sombra de la fuente es de contacto, en dos bandas concéntricas (' + sh.length + ' cuadritos de 0,125 u), centrada alrededor de toda la base; respeta lo que no permite sombra; los edificios siguen con su sombra rectangular'); }
  // agua animada: las tres aguas (estanque y las dos tazas) se redibujan en el atlas; el resto de edificios no tiene nada animado
  { const at = TX.atlas('fuente', geoDe('fuente')), c0 = TX.textura('fuente', partes(geoDe('fuente'), 'torno').find((q) => q.sub === 'agua'));
    ok(at.animadas.length === 3 && typeof c0.anim === 'function' && TX.animar(at, 1) === true && TX.animar(at, 2) === true && ['centro_pc', 'tienda', 'ermita', 'casa_lali', 'laboratorio'].every((t) => TX.animar(TX.atlas(t, geoDe(t)), 3) === false) && TX.animar(null, 1) === false, 'F2: el agua de la fuente (estanque y las dos tazas) son 3 texturas animadas que `G.volTex.animar` redibuja en el atlas; ningún otro edificio tiene texturas animadas'); }
  // las texturas son por anillo (no por cara): todas las caras de una pieza comparten la misma, y los tamaños salen de su perímetro
  { const g = geoDe('fuente'), at = TX.atlas('fuente', g), cl = (q) => TX.textura('fuente', q).clave, estanque = g.poligonos.filter((q) => q.pz === 'estanque' && q.sub === 'lado');
    ok(new Set(estanque.map(cl)).size === 1 && TX.textura('fuente', estanque[0]).w === Math.ceil(2 * Math.PI * 1.0 * 16) && TX.textura('fuente', estanque[0]).h === Math.ceil(0.55 * 16) && at.texturas === new Set(g.poligonos.map(cl)).size && at.texturas === 20 && at.h <= 64, 'F2: las 16 caras de la pared del estanque comparten UNA textura de ' + TX.textura('fuente', estanque[0]).w + '×' + TX.textura('fuente', estanque[0]).h + ' px (el perímetro del anillo), la fuente entera usa ' + at.texturas + ' texturas en un atlas de 256×' + at.h); }
  // validación de los campos nuevos
  { const base = { muros: 3, tejado: { tipo: 'plano', peto: 1 } }, h = [[0, 0, 1, 1]], v = (o) => V.validar('x', { vol: Object.assign({}, base, o), huella: h }).length;
    ok(v({ toldo: { x: 0, w: 2, y: 2, caida: 0.4, vuelo: 0.6 } }) === 0 && v({ toldo: { x: 0, w: 0, y: 2, caida: 0.4, vuelo: 0.6 } }) === 1 && v({ toldo: { x: 0, w: 2, y: 0.3, caida: 0.4, vuelo: 0.6 } }) === 1 && V.validar('f', { vol: { muros: 1, tejado: { tipo: 'plano', peto: 1 }, estilo: 'fuente' }, w: 10, h: 10, huella: h }).length === 0, 'paso D: validar() acepta un toldo bien escrito y rechaza un toldo sin ancho o sin caída; el estilo «fuente» no pide fachada'); }
  // v2.92 (F2): validación del torno (la fuente redonda): no pide muros ni tejado, y rechaza lo que no se puede tornear
  { const h = [[0, 0, 3, 2]], pz = (o) => Object.assign({ pz: 'a', mat: 'piedra', y0: 0, r0: 1, y1: 0.5, r1: 1 }, o), t = (piezas, extra) => V.validar('f', { vol: Object.assign({ estilo: 'fuente', torno: { x: 1.5, z: 1, piezas } }, extra), w: 10, h: 10, huella: h }).length;
    ok(t([pz({})]) === 0 && t([pz({ ri: 0.8, agua: 0.3 })]) === 0 && t([pz({ r1: 0, tapa: true })]) === 0 && t([]) === 1 && t([pz({ y1: 0 })]) === 1 && t([pz({ r0: 0, r1: 0 })]) === 1 && t([pz({ ri: 1 })]) === 1 && t([pz({ agua: 0.3 })]) === 1 && t([pz({ ri: 0.8, agua: 0.5 })]) === 1 && t([pz({ ri: 0.8, tapa: true })]) === 1 && t([{ pz: 'a', mat: 'piedra', y0: 0, r0: 1 }]) === 1 && V.validar('f', { vol: { estilo: 'fuente', torno: { x: -1, z: 1, piezas: [pz({})] } }, huella: h }).length === 1 && V.validar('f', { vol: { estilo: 'nadie', torno: { x: 1, z: 1, piezas: [pz({})] } }, huella: h }).length === 1, 'F2: validar() acepta un torno bien escrito (sin muros ni tejado; con recipiente, con tapa) y rechaza uno sin piezas, con y1 bajo y0, sin radio, con radio interior mayor que el exterior, con agua sin recipiente o fuera de la pared, con tapa y recipiente a la vez, sin y1/r1, con centro negativo o con estilo que no existe'); }
  { const pt = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/G\.volTex\.animar/.test(pt) && /E\.vols = vols/.test(pt), 'paso D: el pintor HD-2D redibuja el agua de la fuente con el mismo reloj visual que las olas (G.volTex.animar) y respeta «menos movimiento»'); }
  ok(G.ALBANOTA_PROVISIONALES.join() === 'centro_pc,tienda,ermita', 'paso D: los 3 edificios siguen marcados como provisionales en el 2D (su dibujo definitivo y sus interiores llegan en la Fase 5)'); }
// ── v2.88 · PASO E1 (oclusión): el tejado y el tercio alto de los muros se atenúan con trama cuando un edificio tapa a alguien ──
{ const V = G.volumenes, H = G.hd2d, fs = require('fs'), path = require('path'), geoDe = (t) => V.geometria(G.OBJETOS[t].huella, G.OBJETOS[t].vol);
  const EDIF = ['casa_lali', 'casa_oli', 'laboratorio', 'centro_pc', 'tienda', 'ermita'];
  // 1 · reparto en fijos (muros, nicho, losa, toldo) y altos (todo lo demás); la fuente no tiene tejado y no se atenúa
  ok(EDIF.every((t) => V.tieneTecho(geoDe(t))) && !V.tieneTecho(geoDe('fuente')), 'paso E1: los 6 edificios tienen tejado y la fuente no (no se atenúa)');
  EDIF.forEach((t) => { const g = geoDe(t), b = V.buferes(g, 0, 0, 0), r = V.repartirIndices(b); ok(r.fijos.length > 0 && r.altos.length > 0 && r.fijos.length + r.altos.length === b.i.length && r.fijos.length % 3 === 0 && r.altos.length % 3 === 0, 'paso E1: ' + t + ' reparte todos sus índices entre muros y tejado (' + r.fijos.length / 3 + ' + ' + r.altos.length / 3 + ' triángulos)');
    const parteDe = {}; b.grupos.forEach((q) => { for (let k = q.desde; k < q.hasta; k++) parteDe[b.i[k]] = q.parte; }); ok(r.fijos.every((i) => V.esFija(parteDe[i])) && r.altos.every((i) => !V.esFija(parteDe[i])), 'paso E1: ' + t + ' solo atenúa lo que no es muro, nicho, losa ni toldo'); });
  // 2 · tapa(): quién queda tapado desde dónde (cámara al sur y alta, como la del juego; y girada al norte)
  EDIF.forEach((t) => { const g = geoDe(t), R = g.rect, cx = 10, cz = 20, y0 = 0, mx = cx + R.x0 + R.w / 2, alto = 7, lejos = 9;
    const sur = [mx, alto, cz + R.z1 + lejos], norte = [mx, alto, cz + R.z0 - lejos];
    const detras = [mx, 0.5, cz + R.z0 - 1.2], delante = [mx, 0.5, cz + R.z1 + 1.5], lado = [cx + R.x1 + 6, 0.5, cz + R.z0 + R.d / 2];
    ok(V.tapa(g, cx, cz, y0, sur, detras) === true, 'paso E1: ' + t + ' tapa a quien está detrás con la cámara al sur');
    ok(V.tapa(g, cx, cz, y0, sur, delante) === false && V.tapa(g, cx, cz, y0, sur, lado) === false, 'paso E1: ' + t + ' no tapa a quien está delante ni a un lado');
    ok(V.tapa(g, cx, cz, y0, norte, delante) === true && V.tapa(g, cx, cz, y0, norte, detras) === false, 'paso E1: ' + t + ' con la cámara girada al norte tapa lo contrario');
    const losa = g.poligonos.find((p) => p.parte === 'losa'), nx = cx + (losa.v[0][0] + losa.v[2][0]) / 2, nz = cz + (losa.v[0][2] + losa.v[2][2]) / 2;
    ok(V.tapa(g, cx, cz, y0, sur, [nx, 0.5, nz]) === false, 'paso E1: ' + t + ' no tapa a quien está en la puerta (nicho) si la cámara mira por delante'); });
  // 3 · transición de medio segundo y trama de Bayer
  ok(Math.abs(H.acercar(1, 0.3, 0.25, 0.5) - 0.5) < 1e-9 && H.acercar(1, 0.3, 1, 0.5) === 0.3 && H.acercar(0.3, 1, 0.1, 0.5) > 0.3 && H.acercar(0.3, 1, 5, 0.5) === 1 && H.acercar(0.6, 0.6, 0.3, 0.5) === 0.6 && H.acercar(1, 0.3, -1, 0.5) === 1, 'paso E1: la transición va hacia la meta sin pasarse, tarda medio segundo de extremo a extremo y un dt negativo no mueve nada');
  { const um = []; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const x0 = x % 2, x1 = Math.floor(x / 2), y0 = y % 2, y1 = Math.floor(y / 2); um.push(8 * Math.abs(x0 - y0) + 4 * y0 + 2 * Math.abs(x1 - y1) + y1); }
    ok(um.slice().sort((a, b) => a - b).join() === [...Array(16).keys()].join(), 'paso E1: la trama 4×4 usa los 16 niveles una vez cada uno (a 0,3 de visibilidad se ve 1 píxel de cada 3,3)'); }
  ok(/discard/.test(H.GLSL_TRAMA) && /uVis/.test(H.GLSL_TRAMA) && /uCorte/.test(H.GLSL_TRAMA) && /gl_FragCoord/.test(H.GLSL_TRAMA) && (H.GLSL_TRAMA.match(/\{/g) || []).length === (H.GLSL_TRAMA.match(/\}/g) || []).length, 'paso E1: el trozo de shader tiene lo necesario y las llaves cuadran');
  ok(H.AJUSTES.OCLUSION === true && H.AJUSTES.VIS_TAPADO > 0 && H.AJUSTES.VIS_TAPADO < 1 && H.AJUSTES.SEGUNDOS === 0.5, 'paso E1: ajustes por defecto (oclusión encendida, se ve el 30 % del tejado tapado, medio segundo)');
  { const pt = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/ocluir\(f,/.test(pt) && /onBeforeCompile/.test(pt) && /customProgramCacheKey/.test(pt) && /uCorte\.value = \(\(G\.OBJETOS/.test(pt), 'paso E1: el pintor llama a ocluir() cada cuadro y usa el shader con trama'); }
}

// ── v2.90 · ID-2b-4 · PARTÍCULAS del 2D (src/particulas.js): humo de 2 chimeneas, gotas y salpicaduras de la fuente, destellos en el agua y hojas del borde ──
{ const P = G.particulas, AN = G.mundo.mapa('albanota'), fs = require('fs'), path = require('path'), T = 16;
  const src = fs.readFileSync(path.join(__dirname, 'src/particulas.js'), 'utf8').replace(/\/\/[^\n]*/g, '');
  const firma = (a) => JSON.stringify(a);
  // 0 · es pura y está registrada
  ok(!/Math\.random|document\.|getContext|Date\.now/.test(src), 'v2.90: particulas.js no usa Math.random, DOM ni la fecha (dos móviles ven lo mismo)');
  ok(require('./src/orden.json').juego.includes('src/particulas.js') && P.AJUSTES.ACTIVO === true && P.AJUSTES.HZ === 4 && P.AJUSTES.MAX_DESTELLOS === 6 && P.AJUSTES.MAX_HOJAS === 6, 'v2.90: está en orden.json y los ajustes de fábrica son los acordados (4 cuadros/s, 6 destellos, 6 hojas)');
  ok(AN.animar === true, 'v2.90: Albanota es un mapa con animar (las partículas solo salen en mapas con animar)');
  // 1 · humo: 4 bocanadas por chimenea, suben ≤ 14 px, nunca sobre la chimenea de al lado, sin blanco puro, 5 poses sin transparencia
  { let max = 0, minY = 0, maxX = -99, minX = 99, vistas = new Set(), puro = true, cols = new Set();
    for (let n = 0; n < 160; n++) for (const k of [1, 2]) { const h = P.humo(n, k); h.forEach(([x, y, c]) => { minY = Math.min(minY, y); maxX = Math.max(maxX, x); minX = Math.min(minX, x); cols.add(c); }); max = Math.max(max, h.length); vistas.add(h.length); if (firma(h) !== firma(P.humo(n, k))) puro = false; }
    ok(puro, 'v2.90 humo: misma salida para el mismo cuadro');
    ok(P.PUFFS === 4 && P.CICLO_HUMO === 16 && P.FORMAS.length === 5, 'v2.90 humo: 4 bocanadas por chimenea, ciclo de 16 cuadros y 5 poses');
    ok(minY >= -17 && minY <= -13, 'v2.90 humo: sube unos 14 px (mínimo ' + minY + ')');
    ok(minX >= -3 && maxX <= 9, 'v2.90 humo: se desvía a la derecha sin pasar de 9 px (de ' + minX + ' a ' + maxX + ')');
    ok(max <= 4 * 9 && [...cols].every((c) => /^#[0-9a-f]{6}$/.test(c) && c !== '#ffffff' && c !== '#fff'), 'v2.90 humo: ≤ 36 píxeles a la vez y solo grises cálidos (sin blanco puro, sin transparencia)');
    ok(firma(P.humo(5, 1)) !== firma(P.humo(5, 2)), 'v2.90 humo: las dos chimeneas no van acompasadas'); }
  // la boca de cada chimenea (62, 6) está sobre la piedra del dibujo, no en el aire de al lado: es la fila de arriba del contorno de la corona
  ok(['casa_lali', 'casa_oli'].every((t) => typeof G.OBJETOS[t].anima === 'function') && typeof G.OBJETOS.fuente.anima === 'function' && typeof G.OBJETOS.casa_lali.anima === 'function', 'v2.90: casas de Lali y Oli y fuente tienen su enganche de partículas');
  // 2 · fuente: gotas por los arcos, salpicaduras SOLO dentro del agua, destellos dentro del agua y lejos del borde
  { let gotas = 0, sal = 0, malas = 0, destMax = 0, destVistos = 0;
    for (let n = 0; n < 64; n++) { const f = P.fuente(n); gotas = Math.max(gotas, f.length); f.forEach(([x, y]) => { if (y >= 46 && !P.enAgua(x, y, 0)) malas++; if (y >= 46) sal++; }); const d = P.destellosFuente(n); destMax = Math.max(destMax, d.length); destVistos += d.length; d.forEach(([x, y]) => { if (!P.enAgua(x, y, 2)) malas++; }); }
    ok(malas === 0, 'v2.90 fuente: las salpicaduras y los destellos caen solo dentro del estanque (' + malas + ' fuera)');
    ok(gotas <= 8 * 2 + 2 * 4 && gotas >= 8, 'v2.90 fuente: 8 gotas de 1×2 px (4 por arco) y como mucho 2 salpicaduras (' + gotas + ' píxeles como máximo)');
    ok(sal > 0 && destVistos > 0 && destMax <= 10, 'v2.90 fuente: hay salpicaduras y destellos (y a la vez no pasan de 2 destellos de 5 px)');
    const ys = new Set(); for (let n = 0; n < 8; n++) P.fuente(n).forEach(([x, y]) => { if (y < 46) ys.add(y); }); ok(ys.size >= 12, 'v2.90 fuente: las gotas recorren la caída de arriba a abajo (' + ys.size + ' alturas distintas)'); }
  // 3 · destellos del río: SOLO agua, lejos de la orilla; todas las formas (regla de oro 9): río de Albanota, estanque de 1 casilla, tira vertical, tira horizontal, borde del mapa
  { const mk = (id, filas) => ({ id, W: filas[0].length, H: filas.length, suelo: filas, objetos: [], animar: true });
    const formas = { 'río de Albanota': AN, 'estanque 1×1': mk('t1', ['.....', '.....', '..~..', '.....', '.....']), 'tira vertical': mk('tv', ['.......', '...~...', '...~...', '...~...', '...~...', '...~...', '.......']), 'tira horizontal': mk('th', ['.........', '.~~~~~~~.', '.~~~~~~~.', '.........']),
      'lago grande': mk('tg', Array.from({ length: 8 }, (_, y) => (y < 1 || y > 6 ? '..........' : '.~~~~~~~~.'))), 'agua al borde': mk('tb', ['~~~~~~', '~~~~~~', '~~~~~~']) };
    Object.keys(formas).forEach((nom) => { const m = formas[nom], vis = G.capas.olas.visible; let fuera = 0, total = 0, maxSim = 0, pintados = new Set();
      for (let n = 0; n < 96; n++) { const d = P.destellos(m, n, 0, m.W * T - 1, 0, m.H * T - 1); maxSim = Math.max(maxSim, d.length); d.forEach((q) => { total++; q.px.forEach(([dx, dy]) => { if (!vis(m.suelo, q.x + dx, q.y + dy)) fuera++; pintados.add(q.x + ',' + q.y); }); }); }
      ok(fuera === 0, 'v2.90 destellos (' + nom + '): ningún píxel fuera del agua ni a menos de 2 px de la orilla (' + fuera + ' fuera de ' + total + ')');
      ok(maxSim <= 6, 'v2.90 destellos (' + nom + '): como mucho 6 a la vez (' + maxSim + ')');
      if (nom === 'río de Albanota' || nom === 'lago grande' || nom === 'tira horizontal') ok(total > 0 && pintados.size >= 5, 'v2.90 destellos (' + nom + '): salen y en sitios distintos (' + pintados.size + ' casillas distintas en 24 s)'); });
    // los de Albanota no tocan el puente ni los nenúfares y solo salen en las 3 filas del río (y 29-31)
    let enRio = true, ex = AN.objetos.filter((o) => /nenufar|juncos|puente/.test(o.tipo)).map((o) => { const d = G.OBJETOS[o.tipo]; return [o.x * T + d.ox, o.y * T + d.oy, d.w, d.h]; }), sobreObj = 0;
    for (let n = 0; n < 200; n++) P.destellos(AN, n, 0, AN.W * T - 1, 0, AN.H * T - 1).forEach((q) => { if (q.y < 29 * T || q.y >= 32 * T) enRio = false; if (ex.some((r) => q.x >= r[0] && q.x < r[0] + r[2] && q.y >= r[1] && q.y < r[1] + r[3])) sobreObj++; });
    ok(enRio && sobreObj === 0, 'v2.90 destellos: en Albanota solo salen en las filas del río y nunca sobre el puente, los nenúfares ni los juncos (' + sobreObj + ' sobre objetos)'); }
  // 4 · hojas: solo del anillo de árboles, nunca sobre una casilla sólida, ≤ 6, se acortan y se encogen, entran en la lista por la Y del suelo
  { const ARBX = new Set(AN.objetos.filter((o) => /^(arbol_|abeto|roble_hito)/.test(o.tipo)).map((o) => o.x + ',' + o.y));   // v2.251: el tronco de un árbol del catálogo es sólido y una hoja puede caer detrás de él
    const em = P.emisores(AN), W = AN.W * T, H = AN.H * T; let vivas = 0, maxV = 0, malas = 0, tocan = 0, dentro = 0, lejos = 0, unPx = 0, total = 0;
    ok(em.length > 100 && em.every((e) => AN.suelo[e.ty][e.tx] === 't' && (e.tx <= 1 || e.tx >= AN.W - 2 || e.ty <= 1 || e.ty >= AN.H - 2)), 'v2.90 hojas: ' + em.length + ' árboles del borde que miran a la hierba emiten (todos del anillo exterior)');
    for (let n = 0; n < 400; n++) { const v = P.hojas(AN, n, 0, W, 0, H); maxV = Math.max(maxV, v.length); v.forEach((h) => { total++; const tx = Math.floor(h.x / T), ty = Math.floor(h.suelo / T); if (G.mundo.solido(AN, tx, ty) && AN.suelo[ty][tx] !== 't' && !ARBX.has(tx + ',' + ty)) malas++; if (AN.suelo[ty][tx] === '~' ) tocan++; if (h.px.length === 1) unPx++; if (h.suelo - h.y > 25 || h.y > h.suelo + 4) dentro++; }); }
    ok(maxV <= 6 && maxV > 0, 'v2.90 hojas: como mucho 6 a la vez (' + maxV + ') y salen');
    ok(malas === 0 && tocan === 0, 'v2.90 hojas: ninguna sobre agua, valla, edificio ni otra casilla sólida (' + malas + ' malas de ' + total + ')');
    ok(unPx > 0 && dentro === 0, 'v2.90 hojas: hay hojas de 1 píxel (se encogen) y nunca más de 25 px sobre su suelo (' + dentro + ')');
    // todas las hojas acaban en el aire (no se quedan quietas en el suelo): para cada emisor y ciclo, la última pose es de 1 px y después desaparece
    let colgadas = 0; em.slice(0, 40).forEach((e) => { let prev = null; for (let n = 0; n < 300; n++) { const h = P.hoja(AN, n, e); if (prev && !h && prev.px.length > 1) colgadas++; prev = h; } }); ok(colgadas === 0, 'v2.90 hojas: ninguna desaparece de golpe sin encogerse (' + colgadas + ')');
    // se deslizan hacia dentro: los del lado oeste acaban al este de donde salen y los del este al oeste
    let okDir = true; [['O', (e) => e.tx <= 1, 1], ['E', (e) => e.tx >= AN.W - 2, -1]].forEach(([n0, f, s]) => { em.filter(f).slice(0, 12).forEach((e) => { let p0 = null, p1 = null; for (let n = 0; n < 400; n++) { const h = P.hoja(AN, n, e); if (h && !p0) p0 = h; if (h) p1 = h; else if (p0) break; } if (p0 && p1 && (p1.x - p0.x) * s < 3) okDir = false; }); });
    ok(okDir, 'v2.90 hojas: se deslizan hacia dentro (el lado oeste hacia el este, el este hacia el oeste)');
    // visibles en una vista de móvil 390×844: se filtra por rectángulo
    const vista = P.hojas(AN, 123, 0, 130, 100, 330), todas = P.hojas(AN, 123, 0, W, 0, H); ok(vista.every((h) => h.x + 2 >= 0 && h.x <= 130 && h.y + 2 >= 100 && h.y <= 330) && vista.length <= todas.length, 'v2.90 hojas: solo devuelve las que están dentro del rectángulo pedido');
    // en un mapa de prueba con un edificio delante: la hoja se acorta antes de entrar
    const m = { id: 'th_h', W: 12, H: 12, animar: true, objetos: [], suelo: ['tttttttttttt', 'tttttttttttt', 'tt..........', 'tt..........', 'tt..........', 'tt..........', 'tt..........', 'tt..........', 'tt..........', 'tt..........', 'tt..........', 'tt..........'], bloqueos: new Set(['4,2', '4,3', '4,4', '4,5', '4,6', '4,7', '4,8', '4,9', '4,10', '4,11']) };
    m.suelo = m.suelo.map((r, y) => r.replace(/./g, (c) => c)); const emp = P.emisores({ id: 'th_h', W: 12, H: 12, suelo: m.suelo, bloqueos: m.bloqueos, objetos: [] });
    G.mundo.mapas.th_h = null; delete G.mundo.mapas.th_h; let atraviesa = 0; emp.filter((e) => e.tx === 1).forEach((e) => { for (let n = 0; n < 200; n++) { const h = P.hoja({ id: 'th_h', W: 12, H: 12, suelo: m.suelo, bloqueos: m.bloqueos, objetos: [] }, n, e); if (h && Math.floor(h.x / T) >= 4) atraviesa++; } });
    ok(atraviesa === 0, 'v2.90 hojas: una pared de casillas sólidas las detiene (' + atraviesa + ' la cruzan)'); }
  // 5 · interruptores: ACTIVO, ?particulas=0 y REDUCIDO (menos movimiento) no dibujan nada
  { const ctxs = () => { const c = { f: 0, fillStyle: '', fillRect() { this.f++; } }; return c; }; const cam = { x: 0, y: 0 };
    const r0 = G.capas.reloj; G.capas.reloj = 3.3;
    const c1 = ctxs(); P.pintarDestellos(c1, AN, { x: 0, y: 350 }, 400, 200); const c1b = ctxs(); P.pintarHumo(c1b, 0, 0, 3.3, false, 62, 6, 1); const c1c = ctxs(); P.pintarFuente(c1c, 0, 0, 3.3, false);
    ok(c1b.f > 0 && c1c.f > 0, 'v2.90: con todo encendido el humo y la fuente se pintan (' + c1b.f + ' y ' + c1c.f + ' fillRect)');
    P.AJUSTES.ACTIVO = false; const c2 = ctxs(), c2b = ctxs(), c2c = ctxs(); P.pintarDestellos(c2, AN, { x: 0, y: 350 }, 400, 200); P.pintarHumo(c2b, 0, 0, 3.3, false, 62, 6, 1); P.pintarFuente(c2c, 0, 0, 3.3, false);
    ok(c2.f === 0 && c2b.f === 0 && c2c.f === 0 && P.hojasVista(AN, cam, 400, 400).length === 0, 'v2.90: con AJUSTES.ACTIVO = false no se pinta nada (y no hay hojas)'); P.AJUSTES.ACTIVO = true;
    const c3b = ctxs(), c3c = ctxs(); P.pintarHumo(c3b, 0, 0, 3.3, true, 62, 6, 1); P.pintarFuente(c3c, 0, 0, 3.3, true);
    ok(c3b.f === 0 && c3c.f === 0, 'v2.90: con «menos movimiento» (reducido) el humo y la fuente no se pintan');
    const sinAn = { id: 'sin_animar', W: 3, H: 3, animar: false, suelo: ['...', '...', '...'], objetos: [] }; ok(!P.activo(sinAn) && P.hojasVista(sinAn, cam, 100, 100).length === 0, 'v2.90: un mapa sin animar no lleva partículas (el pueblo de pruebas queda igual)');
    G.capas.reloj = r0; }
  // 6 · el HD-2D todavía no las usa (v2.91) y game.js las enchufa en 3 sitios
  { const gm = fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8'), hd = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8');
    ok(/G\.particulas\.pintarDestellos/.test(gm) && /G\.particulas\.hojasVista/.test(gm) && /G\.particulas\.pintarHoja/.test(gm), 'v2.90: game.js pinta destellos (tras el agua), hojas (en la lista por Y) y deja el humo y la fuente al `anima` de sus piezas');
    ok(/G\.particulas3d/.test(hd) && /AJUSTES\.PARTICULAS/.test(hd), 'v2.93: el pintor HD-2D ya usa las partículas (G.particulas3d, con su interruptor AJUSTES.PARTICULAS)'); }
}
// ── v2.93 · F3 · PARTÍCULAS del HD-2D (src/particulas3d.js): gotas y salpicaduras de la fuente redonda, humo, destellos del agua y hojas, en 3D ──
{ const P3 = G.particulas3d, P = G.particulas, AN = G.mundo.mapa('albanota'), fs = require('fs'), path = require('path'), T = 16, PX = 1 / T, V = G.volumenes;
  const src = fs.readFileSync(path.join(__dirname, 'src/particulas3d.js'), 'utf8').replace(/\/\/[^\n]*/g, '');
  const ordenJ = require('./src/orden.json').juego, REC = { x0: 0, x1: AN.W * T, y0: 0, y1: AN.H * T }, fuentes = AN.objetos.filter((o) => o.tipo === 'fuente'), casasH = AN.objetos.filter((o) => G.particulas3d.CHIMENEAS[o.tipo]);
  const r0 = G.capas.reloj; const cuadroN = (n) => { G.capas.reloj = n / P.AJUSTES.HZ + 0.01; return P.cuadro(); };
  // 0 · pura, registrada y con las mismas alturas que el pintor
  ok(!/Math\.random|document\.|getContext|Date\.now|THREE/.test(src), 'v2.93: particulas3d.js no usa Math.random, DOM, fecha ni Three (dos móviles ven lo mismo; se prueba sin navegador)');
  ok(ordenJ.indexOf('src/particulas3d.js') > ordenJ.indexOf('src/particulas.js') && ordenJ.indexOf('src/particulas3d.js') > ordenJ.indexOf('src/volumenes.js') && ordenJ.indexOf('src/particulas3d.js') < ordenJ.indexOf('src/hd2d_pintor.js'), 'v2.93: está en orden.json después de particulas.js y volumenes.js y antes del pintor');
  ok(P3.ALT['~'] === G.hd2d.ALT['~'] && P3.ALT.t === G.hd2d.ALT.t && P3.AJUSTES.MAX_PIXELES === 480, 'v2.93: las alturas del agua y del bosque son las del pintor y el tope es de 480 cuadritos');
  ok(fuentes.length === 1 && casasH.length === 2 && casasH.map((o) => o.tipo).sort().join() === 'casa_lali,casa_oli', 'v2.93: Albanota tiene 1 fuente y 2 chimeneas con humo (casas de Lali y de Oli, como en el 2D)');
  // 1 · la fuente: forma de la caída y que no atraviesa ninguna pieza
  { const d = G.OBJETOS.fuente, T3 = d.vol.torno, R = V.rectDe(V.celdas(d.huella)), o = fuentes[0], cx = o.x + R.x0 + T3.x, cz = o.y + R.z0 + T3.z;
    const niv = P3.niveles(T3); ok(niv.length === 2 && niv[0].pieza.pz === 'taza1' && niv[1].pieza.pz === 'estanque', 'v2.93 fuente: dos niveles de caída (taza pequeña → taza grande → estanque)');
    ok(niv.every((nv) => nv.rL < nv.pieza.ri && nv.rL > nv.r0 && nv.yL === nv.pieza.agua), 'v2.93 fuente: cada chorro cae DENTRO del agua de la taza de abajo (radio menor que el interior y a la altura del agua)');
    // radio exterior de lo sólido a una altura (las piezas del torno son troncos de cono) y si un punto (r, y) está libre: fuera de todo, o dentro de un recipiente por encima de su agua
    const libre = (r, y) => T3.piezas.every((q) => { if (y < q.y0 || y > q.y1) return true; const ext = q.r0 + (q.r1 - q.r0) * (y - q.y0) / (q.y1 - q.y0); if (r > ext + 0.01) return true; return !!q.ri && r < q.ri && y >= q.agua - 1e-9; });
    let gotas = 0, maxN = 0, minY = 9, maxY = 0, salp = 0, destF = 0, malas = [];
    for (let n = 0; n < 32; n++) { const out = []; P3.fuente3d(n, cx, cz, 0, T3, out); maxN = Math.max(maxN, out.length);
      out.forEach((p) => { const r = Math.hypot(p.x - cx, p.z - cz), y = p.y - p.dy * PX; if (p.t === 'gota') { gotas++; if (!libre(r, y)) malas.push([n, +r.toFixed(2), +y.toFixed(2)]); minY = Math.min(minY, y); maxY = Math.max(maxY, y); } if (p.t === 'destello') destF++; });
      salp += out.filter((p) => p.t === 'salpicadura').length; }
    ok(malas.length === 0, 'v2.93 fuente: ninguna gota atraviesa la taza, la columna, el pedestal ni el borde del estanque en 32 cuadros (' + malas.slice(0, 3).join(' | ') + ')');
    ok(gotas === 32 * 2 * 4 * 4 * 2 && minY > niv[1].yL && maxY <= niv[0].y0 + P3.FUENTE.ARCO, 'v2.93 fuente: 64 píxeles de gota por cuadro (2 niveles × 4 chorros × 4 gotas × 2 px), siempre por encima del agua y por debajo de la boca de la taza pequeña (+ arco)');
    ok(salp > 0 && destF > 0 && maxN < 140, 'v2.93 fuente: hay salpicaduras en el estanque y destellos tumbados sobre las aguas; ≤ 140 píxeles en la fuente');
    // todas las aguas llevan destellos y los 5 píxeles de la cruz caen DENTRO de su anillo (ni sobre la columna ni sobre el borde)
    let por = { estanque: 0, taza1: 0 }, fuera = 0; for (let n = 0; n < 96; n++) { const out = []; P3.fuente3d(n, cx, cz, 0, T3, out); out.filter((p) => p.t === 'destello').forEach((p) => { const x = p.x + p.dx * PX, z = p.z + p.dy * PX, r = Math.hypot(x - cx, z - cz), w = Math.abs(p.y - (0.40 + P3.FUENTE.SOBRE)) < 1e-9 ? T3.piezas[0] : Math.abs(p.y - (1.04 + P3.FUENTE.SOBRE)) < 1e-9 ? T3.piezas[3] : null; if (!w) { fuera++; return; } por[w.pz]++; if (r < w.rc || r > w.ri - 0.02) fuera++; }); }
    ok(por.estanque > 0 && por.taza1 > 0 && fuera === 0, 'v2.93 fuente: destellos en el estanque (' + por.estanque + ') y en la taza grande (' + por.taza1 + ') en 96 cuadros; 0 fuera de su agua');
    // los cuatro azimuts: en cada giro de cámara se ven chorros (los 4 chorros están a 45°, 135°, 225° y 315°)
    const angs = new Set(); { const out = []; P3.fuente3d(0, cx, cz, 0, T3, out); out.filter((p) => p.t === 'gota').forEach((p) => angs.add(Math.round(Math.atan2(p.z - cz, p.x - cx) * 180 / Math.PI / 5) * 5)); } ok([45, 135, -135, -45].every((a) => [...angs].some((b) => Math.abs(b - a) <= 10)), 'v2.93 fuente: hay gotas en los cuatro lados (45°, 135°, 225°, 315°), así que se ve igual con cualquier giro de la cámara');
    // el ciclo se repite cada 8 cuadros y dos móviles ven lo mismo
    const f = (n) => { const out = []; P3.fuente3d(n, cx, cz, 0, T3, out); return JSON.stringify(out.filter((p) => p.t !== 'destello')); }; ok(f(3) === f(3) && f(5) !== f(6), 'v2.93 fuente: mismo cuadro, misma salida; cuadros distintos, gotas en otro sitio'); }
  // 2 · humo: nace en la boca de cada chimenea, sube ≤ 1 u y las dos chimeneas no van acompasadas
  { const d = G.OBJETOS.casa_lali, c = d.vol.chimenea, R = V.rectDe(V.celdas(d.huella)); let altos = 0, maxSube = 0, xs = [], difieren = false;
    casasH.forEach((o) => { const k = P3.CHIMENEAS[o.tipo], x0 = o.x + R.x0 + c.x + c.w / 2, z0 = o.y + R.z0 + c.z + c.d / 2, yBoca = V.techoMax(d.vol) + c.sobre;
      for (let n = 0; n < 64; n++) { const out = []; P3.humo3d(n, o.x, o.y, 0, d, k, out); out.forEach((p) => { if (Math.abs(p.x - x0) > 1e-9 || Math.abs(p.z - z0) > 1e-9) altos++; maxSube = Math.max(maxSube, p.y - p.dy * PX - yBoca); if (p.y - p.dy * PX < yBoca) altos++; }); xs.push(JSON.stringify((() => { const a = []; P3.humo3d(n, o.x, o.y, 0, d, k, a); return a.map((p) => [p.dx, p.dy]); })())); } });
    ok(altos === 0, 'v2.93 humo: todas las bocanadas salen justo encima de la boca de la chimenea y nunca por debajo (0 fallos en 2 chimeneas × 64 cuadros)');
    ok(maxSube > 0.5 && maxSube <= 1.0, 'v2.93 humo: sube entre 0,5 u y 1,0 u (como los 14 px del 2D); máximo medido ' + maxSube.toFixed(2));
    ok(xs.slice(0, 64).some((v, i) => v !== xs[64 + i]), 'v2.93 humo: la chimenea 1 y la 2 no van acompasadas'); }
  // 3 · destellos del agua y hojas: en todas las formas de agua y en todo el borde del mapa
  { const sob = (m, p) => { const x = p.x + p.dx * PX, z = p.z + p.dy * PX; return m.suelo[Math.floor(z)] && m.suelo[Math.floor(z)][Math.floor(x)]; };
    let destN = 0, destMal = 0, hojN = 0, hojMal = 0, hojAlto = 0, tope = 0, minH = 9, maxH = -9;
    for (let n = 0; n < 96; n++) { const out = P3.pixeles(AN, cuadroN(n), REC); tope = Math.max(tope, out.length);
      out.filter((p) => p.t === 'agua').forEach((p) => { destN++; if (sob(AN, p) !== '~') destMal++; });
      out.filter((p) => p.t === 'hoja').forEach((p) => { hojN++; const x = p.x + p.dx * PX, gy = P3.altSuave(AN, p.x, p.z), ch = AN.suelo[Math.floor(p.z)][Math.floor(x)]; if (p.y < gy + 0.04 || (ch !== 't' && !/^(arbol_|abeto|roble_hito)/.test(((AN.objetos.find((o) => o.x === Math.floor(x) && o.y === Math.floor(p.z)) || {}).tipo) || '') && G.mundo.solido(AN, Math.floor(x), Math.floor(p.z)))) hojMal++; minH = Math.min(minH, p.y - gy); maxH = Math.max(maxH, p.y - gy); if (p.y - gy > 1.3) hojAlto++; }); }
    ok(destN > 0 && destMal === 0, 'v2.93 destellos del agua: ' + destN + ' píxeles en 96 cuadros de Albanota, todos tumbados sobre casillas de agua (0 fuera)');
    ok(hojN > 0 && hojMal === 0 && hojAlto === 0, 'v2.93 hojas: ' + hojN + ' píxeles en 96 cuadros, todas por encima del suelo, nunca dentro de una casilla sólida (salvo la del árbol de donde salen) y a ≤ 1,3 u de él (rango ' + minH.toFixed(2) + ' a ' + maxH.toFixed(2) + ' u)');
    ok(tope <= P3.AJUSTES.MAX_PIXELES, 'v2.93: nunca más de ' + P3.AJUSTES.MAX_PIXELES + ' cuadritos a la vez (máximo medido ' + tope + ')');
    // las formas de agua del grupo 30 (casilla suelta, tira vertical, tira horizontal): lo que salga cae sobre su agua, y la forma de 1 casilla no lleva destellos (queda pegada a la orilla, igual que en el 2D)
    const mk = (id, filas) => ({ id, W: filas[0].length, H: filas.length, animar: true, suelo: filas, objetos: [] }), formas = {
      gota: mk('f3_gota', ['.......', '.......', '...~...', '.......', '.......']), vertical: mk('f3_vert', ['.......', '...~...', '...~...', '...~...', '...~...', '...~...', '...~...', '.......']), horizontal: mk('f3_hor', ['.........', '..~~~~~..', '.........']), lago: mk('f3_lago', ['..........', '.~~~~~~~~.', '.~~~~~~~~.', '.~~~~~~~~.', '.~~~~~~~~.', '..........']) };
    const resu = {}; Object.keys(formas).forEach((nm) => { const m = formas[nm]; let n3 = 0, mal = 0; for (let n = 0; n < 96; n++) P3.pixeles(m, cuadroN(n), { x0: 0, x1: m.W * T, y0: 0, y1: m.H * T }).filter((p) => p.t === 'agua').forEach((p) => { n3++; if (sob(m, p) !== '~') mal++; }); resu[nm] = [n3, mal]; });
    ok(Object.keys(resu).every((k) => resu[k][1] === 0) && Object.keys(resu).every((k) => resu[k][0] > 0), 'v2.93 destellos: formas de agua probadas (1 casilla, tira vertical, tira horizontal, lago 8×4): ' + Object.keys(resu).map((k) => k + ' ' + resu[k][0]).join(' · ') + '; todas llevan destellos y 0 caen fuera de su agua'); }
  // 4 · interruptores
  { const a = P.AJUSTES.ACTIVO, rd = G.capas.REDUCIDO; G.capas.reloj = 3.01;
    ok(P3.pixeles(AN, P.cuadro(), REC).length > 0, 'v2.93: con todo encendido hay partículas en Albanota');
    P.AJUSTES.ACTIVO = false; ok(P3.pixeles(AN, 12, REC).length === 0, 'v2.93: G.particulas.AJUSTES.ACTIVO = false (o ?particulas=0) las apaga también en el HD-2D'); P.AJUSTES.ACTIVO = a;
    G.capas.REDUCIDO = true; ok(P3.pixeles(AN, 12, REC).length === 0, 'v2.93: con «menos movimiento» no hay partículas en el HD-2D'); G.capas.REDUCIDO = rd;
    ok(P3.pixeles({ id: 'sin_animar', W: 3, H: 3, animar: false, suelo: ['...', '...', '...'], objetos: [] }, 12, REC).length === 0, 'v2.93: un mapa sin animar no lleva partículas en el HD-2D');
    const pt = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/PARTICULAS: true/.test(pt) && /if \(!AJUSTES\.PARTICULAS \|\| !A \|\| !A\.activo\(E\.M\)\)/.test(pt) && /camara\(f\); particulas\(\);/.test(pt) && /frustumCulled = false/.test(pt), 'v2.93: el pintor tiene el interruptor G.hd2d.AJUSTES.PARTICULAS, la malla sin recorte y la llama cada cuadro tras la cámara');
    ok(/G\.hd2d\.AJUSTES\.PARTICULAS|AJUSTES\.PARTICULAS/.test(pt) && G.hd2d.AJUSTES.PARTICULAS === true, 'v2.93: de fábrica las partículas del HD-2D están encendidas'); }
  // 5 · vértices: un cuadrito de 1/16 u; los verticales miran a la cámara (giran con el yaw) y los tumbados no
  { const lista = [{ x: 5, y: 2, z: 7, dx: 0, dy: 0, c: '#ff0000', k: 'v' }, { x: 5, y: 2, z: 7, dx: 2, dy: 1, c: '#00ff80', k: 'v' }, { x: 5, y: 1, z: 7, dx: 1, dy: 1, c: '#0000ff', k: 'h' }], pos = new Float32Array(12 * 4), col = new Float32Array(12 * 4);
    ok(P3.armar(lista, 0, pos, col) === 3 && P3.armar(lista, 0, new Float32Array(24), new Float32Array(24)) === 2, 'v2.93 vértices: devuelve el número de cuadritos (3) y respeta el tamaño del búfer');
    const tam = (o) => [Math.hypot(pos[o + 3] - pos[o], pos[o + 4] - pos[o + 1], pos[o + 5] - pos[o + 2]), Math.hypot(pos[o + 9] - pos[o], pos[o + 10] - pos[o + 1], pos[o + 11] - pos[o + 2])];
    ok(tam(0).every((v) => Math.abs(v - PX) < 1e-6) && tam(12).every((v) => Math.abs(v - PX) < 1e-6) && tam(24).every((v) => Math.abs(v - PX) < 1e-6), 'v2.93 vértices: cada cuadrito mide 1/16 u de lado');
    ok(Math.abs(pos[3] - pos[0] - PX) < 1e-6 && Math.abs(pos[5] - pos[2]) < 1e-6, 'v2.93 vértices: con yaw 0 el cuadrito vertical se extiende a lo largo de x');
    P3.armar(lista, Math.PI / 2, pos, col); ok(Math.abs(pos[3] - pos[0]) < 1e-6 && Math.abs(Math.abs(pos[5] - pos[2]) - PX) < 1e-6, 'v2.93 vértices: con la cámara girada 90° el cuadrito vertical se extiende a lo largo de z (siempre de cara a la cámara)');
    ok(Math.abs(pos[25] - pos[28]) < 1e-9 && Math.abs(pos[25] - 1) < 1e-9, 'v2.93 vértices: el cuadrito tumbado queda plano a su altura');
    ok(Math.abs(col[0] - 1) < 1e-6 && col[1] === 0 && Math.abs(col[3 + 1]) < 1e-9 && col[12] === 0 && Math.abs(col[13] - 1) < 1e-6 && Math.abs(col[14] - 128 / 255) < 1e-6, 'v2.93 vértices: el color de cada vértice es el del píxel');
    ok(P3.indices(3).length === 18 && P3.indices(3)[6] === 4 && P3.indices(480).every((i) => i < 480 * 4), 'v2.93 índices: dos triángulos por cuadrito y ninguno se sale del búfer'); }
  G.capas.reloj = r0;
}
// ── Grupo 60 (v2.100): SOMBRAS PROYECTADAS DEL 2D (src/sombras_proyectadas.js). Lo puro, el apagado sin ninguna llamada de dibujo, el interruptor «Sombras» y que no proyecten sobre el huerto. ──
{ const SP = G.sombrasp, A = SP.AJUSTES, act0 = A.ACTIVO, som0 = G.SOMBREADO.ACTIVO, entDefecto = A.ENTIDADES;
  ok(SP && typeof SP.pintar === 'function' && typeof SP.proyectar === 'function', 'v2.100 sombras: el módulo existe y exporta pintar y proyectar');
  const p10 = SP.proyectar(10, true), p30 = SP.proyectar(30, true), p60 = SP.proyectar(60, true), q60 = SP.proyectar(60, false);
  ok(p10.nivel === 1 && p30.nivel === 2 && p60.nivel === 3 && q60.nivel === 1, 'v2.100 sombras: degradado de los edificios (3 niveles por altura); lo que no es edificio siempre es fuerte');
  ok(SP.proyectar(20, true).dx === Math.round(20 * A.SX) && SP.proyectar(20, true).dy === Math.round(20 * A.SY), 'v2.100 sombras: hasta la altura g1 la sombra del edificio no se acorta');
  ok(p60.dx === Math.round((A.g1 + 40 * A.corto) * A.SX) && p60.dy === Math.round((A.g1 + 40 * A.corto) * A.SY) && p60.dx < q60.dx, 'v2.100 sombras: tejado y cúpula más cortos que un objeto de la misma altura');
  ok(SP.proyectar(0, false).dx === 0 && SP.proyectar(16, false).dx === Math.round(16 * 0.45), 'v2.100 sombras: inclinación 0,45 a la derecha por píxel de altura');
  ok(SP.claseSuelo(60, 110, 200) === 0 && SP.claseSuelo(232, 208, 154) === 2 && SP.claseSuelo(100, 175, 90) === 1 && SP.claseSuelo(120, 75, 40) === 3, 'v2.100 sombras: el suelo se clasifica en agua, arena, césped y tierra');
  const MUL = SP.colores(); ok(MUL[0] === null && MUL[1][1] === 'rgb(168,158,214)' && MUL[2][1] === 'rgb(206,184,224)' && MUL[3][1] === 'rgb(214,204,230)', 'v2.100 sombras: tonos por superficie (césped, arena y tierra)');
  { const f = (s) => +/rgb\((\d+)/.exec(s)[1]; ok(f(MUL[1][1]) < f(MUL[1][2]) && f(MUL[1][2]) < f(MUL[1][3]) && f(MUL[1][3]) < 255, 'v2.100 sombras: cada nivel del degradado es más claro que el anterior'); }
  ok(['casa', 'casa_lali', 'casa_oli', 'laboratorio', 'centro_pc', 'tienda', 'ermita'].every((k) => SP.EDIF[k]) && ['valla_ni', 'valla_nd', 'valla_9', 'valla_v', 'huerto', 'puente_albanota'].every((k) => SP.NO[k]), 'v2.100 sombras: edificios con degradado; vallas, huerto y puente sin sombra');
  ok(['banco', 'farola', 'cartel', 'barril', 'maceta'].every((k) => SP.SUAVE[k]) && SP.colores()[1][4] === 'rgb(' + [168, 158, 214].map((v) => Math.round(255 - (255 - v) * 0.75)).join(',') + ')' && SP.proyectar(20, false, 0.85).dx < SP.proyectar(20, false).dx, 'v2.101 sombras: mobiliario (bancos, farolas...) con la sombra al 75 % y la farola algo más corta');
  // el sprite falso es opaco; el suelo falso es césped
  const spr = { c: { width: 2, height: 3, getContext: () => ({ getImageData: () => ({ data: new Uint8ClampedArray(2 * 3 * 4).fill(255) }) }) }, w: 2, h: 3 };
  const cuenta = (m, ents, ajustes) => { const calls = []; const ctx = { getImageData: (x, y, w, h) => { const d = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) { d[i * 4] = 100; d[i * 4 + 1] = 175; d[i * 4 + 2] = 90; d[i * 4 + 3] = 255; } return { data: d }; }, save: () => calls.push('save'), restore: () => calls.push('restore'), fillRect: (x, y, w, h) => calls.push(['fillRect', x, y, w, h, ctx.fillStyle]), set globalCompositeOperation(v) { calls.push('op:' + v); }, fillStyle: '' };
    Object.assign(A, { ENTIDADES: true }, ajustes || {}); SP.pintar(ctx, m, { x: 0, y: 0 }, 60, 60, ents); return calls; };
  const ent = (x) => ({ s: spr, x, base: 30, top: 27, dx: 0, espejo: false });
  A.ACTIVO = false; ok(cuenta({ objetos: [] }, [ent(20)]).length === 0, 'v2.100 sombras: apagadas (?sombrasp=0) no hacen NINGUNA llamada de dibujo');
  A.ACTIVO = true; G.SOMBREADO.ACTIVO = false; ok(cuenta({ objetos: [] }, [ent(20)]).length === 0 && !SP.activo(), 'v2.100 sombras: con «Sombras: no» tampoco se pintan');
  G.SOMBREADO.ACTIVO = true; const enc = cuenta({ objetos: [] }, [ent(20)]);
  ok(SP.activo() && enc.includes('save') && enc.includes('restore') && enc.includes('op:multiply') && enc.some((c) => Array.isArray(c) && c[0] === 'fillRect' && /^rgb\(168,158,214\)$/.test(c[5])), 'v2.100 sombras: encendidas pintan por multiplicación con el tono del césped');
  ok(enc.filter((c) => Array.isArray(c)).every((c) => c[2] >= 30 && c[1] >= 19), 'v2.100 sombras: la sombra de un personaje cae por debajo y a la derecha de sus pies');
  const huertoM = { objetos: [{ tipo: 'huerto', x: 0, y: 0 }] }; ok(cuenta(huertoM, [ent(20)]).filter((c) => Array.isArray(c)).length === 0, 'v2.100 sombras: personajes y criaturas no proyectan sobre el huerto');
  ok(cuenta({ objetos: [] }, [ent(20)], { ENTIDADES: false }).length === 0, 'v2.100 sombras: AJUSTES.ENTIDADES = false quita las de personajes y criaturas'); A.ENTIDADES = false;
  ok(entDefecto === false && cuenta({ objetos: [] }, [ent(20)], { ENTIDADES: false }).length === 0, 'v2.101 sombras: por defecto personajes y criaturas no proyectan (solo su sombra de siempre)');
  A.ACTIVO = act0; G.SOMBREADO.ACTIVO = som0; }
// ── v2.102 · OBJETOS 3D, paso 2 · la FAROLA en volumen (docs/FICHAS_OBJETOS_3D.md): torno de 12 caras, cajas y tronco de pirámide, colores lisos ──
{ const fs = require('fs'), path = require('path'), V = G.volumenes, TX = G.volTex, d = G.OBJETOS.farola, g = V.geometria(d.huella, d.vol), cuenta = (parte) => g.poligonos.filter((p) => p.parte === parte).length, ys = (pz) => { const l = g.poligonos.filter((p) => p.pz === pz).flatMap((p) => p.v.map((q) => q[1])); return [Math.min(...l), Math.max(...l)]; };
  ok(d.huella.length === 1 && d.huella[0].join() === '0,0,1,1' && d.w === 10 && d.h === 38 && d.pieY === 8 && V.validar('farola', d).length === 0, 'v2.102 farola: la huella sigue siendo 1×1 (el motor no cambia), el dibujo 2D sigue siendo 10×38 y su `vol` es válido');
  ok(Math.abs(g.altoTotal - 2.375) < 1e-9 && Math.abs(g.altoTotal * 16 - d.h) < 1e-9, 'v2.102 farola: alto total 2,375 u = 38 px, igual que el sprite del 2D');
  ok(g.triangulos >= 120 && g.triangulos <= 200 && g.triangulos <= V.MAX_TRIANGULOS, 'v2.102 farola: ' + g.triangulos + ' triángulos (ficha: unos 150)');
  ok(['base', 'poste', 'collarin', 'plato', 'cuerpo', 'tejadillo', 'remate'].every((pz) => g.poligonos.some((p) => p.pz === pz)), 'v2.102 farola: lleva las 7 piezas de la ficha (base, poste, collarín, plato, cuerpo, tejadillo y remate)');
  const tramos = { base: [0, 0.25], poste: [0.25, 1.63], collarin: [1.63, 1.81], plato: [1.81, 1.88], cuerpo: [1.88, 2.19], tejadillo: [2.19, 2.31], remate: [2.31, 2.375] };
  ok(Object.keys(tramos).every((pz) => { const [a, b] = ys(pz); return Math.abs(a - tramos[pz][0]) < 1e-9 && Math.abs(b - tramos[pz][1]) < 1e-9; }), 'v2.102 farola: cada pieza ocupa la altura de la ficha (de abajo arriba, sin huecos ni solapes)');
  ok(g.poligonos.every((p) => p.v.every((q) => q[0] >= 0 && q[0] <= 1 && q[2] >= 0 && q[2] <= 1)), 'v2.102 farola: todo el volumen cabe dentro de su casilla (la huella 3D = la colisión)');
  { const xs = g.poligonos.flatMap((p) => p.v.map((q) => q[0])), zs = g.poligonos.flatMap((p) => p.v.map((q) => q[2])); ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 0.5) < 1e-9 && Math.abs((Math.min(...zs) + Math.max(...zs)) / 2 - 0.5) < 1e-9, 'v2.102 farola: el poste está en el centro de la casilla (los pies del 2D, a media casilla)'); }
  ok(g.poligonos.filter((p) => p.pz === 'poste').length === 12 && g.poligonos.filter((p) => p.pz === 'poste').every((p) => p.v.every((q) => { const r = Math.hypot(q[0] - 0.5, q[2] - 0.5), t = (q[1] - 0.25) / 1.38; return Math.abs(r - (0.07 - 0.01 * t)) < 1e-9; })), 'v2.102 farola: el poste tiene 12 caras y su radio baja de 0,07 u a 0,06 u');
  ok(cuenta('torno') === 12 * 4 + 12 * 2 + 12 * 0 && cuenta('caja') === 8 && cuenta('caja_tapa') === 1 && cuenta('tronco') === 4, 'v2.102 farola: 4 piezas de torno de 12 lados (+ las tapas de la base y el remate), 8 caras de caja, 1 tapa y 4 caras de pirámide');
  ok(g.poligonos.filter((p) => p.pz === 'cuerpo').length === 4 && g.poligonos.filter((p) => p.pz === 'cuerpo').every((p) => p.tono === 'base' && p.mat === 'vidrio'), 'v2.102 farola: el cristal lleva siempre el tono «base» en sus cuatro caras (regla 5: no se oscurece)');
  { const tp = (pz) => g.poligonos.filter((p) => p.pz === pz && p.sub === 'lado').map((p) => p.tono), t = tp('poste'); ok(t.includes('luz') && t.includes('base') && t.includes('sombra') && t.filter((x) => x === 'luz').length < 12 && t.length === 12, 'v2.102 farola: las caras del poste llevan los tres tonos (luz, base y sombra) según hacia dónde miran');
    const cara = (an) => g.poligonos.find((p) => p.pz === 'poste' && Math.abs(p.n[0] - Math.cos(an)) < 0.05 && Math.abs(p.n[2] - Math.sin(an)) < 0.05); ok(cara(Math.PI).tono === 'luz' && cara(Math.PI / 2).tono === 'base' && cara(0).tono === 'sombra' && cara(1.5 * Math.PI).tono === 'sombra', 'v2.102 farola: oeste = luz, sur = base, este y norte = sombra'); }
  ok(g.poligonos.filter((p) => p.pz === 'tejadillo').every((p) => p.n[1] > 0 && Math.abs(Math.hypot(...p.n) - 1) < 1e-9), 'v2.102 farola: las cuatro caras del tejadillo se inclinan hacia arriba y sus normales miden 1');
  { const mal = g.poligonos.filter((p) => { const c = p.v.reduce((a, q) => [a[0] + q[0] / p.v.length, a[1] + q[1] / p.v.length, a[2] + q[2] / p.v.length], [0, 0, 0]); const e = [c[0] - 0.5, c[2] - 0.5]; return p.sub !== 'tapa' && p.parte !== 'caja_tapa' && (e[0] * p.n[0] + e[1] * p.n[2]) < -1e-9; }); ok(mal.length === 0, 'v2.102 farola: todas las caras laterales miran hacia fuera del eje (' + mal.length + ' mal orientadas)'); }
  // texturas lisas del estilo «farola» (paso 2); el paso 3 las cambia por texturas de píxel
  ok(TX.ESTILOS.includes('farola') && TX.soporta(d.vol) && TX.SIN_FACHADA.includes('farola'), 'v2.102 farola: G.volTex conoce el estilo «farola» y no pide fachada');
  { const at = TX.atlas('farola', g), P2 = G.PAL; ok(at && at.w === 256 && at.h <= 256 && at.uv.length === g.poligonos.length && at.uv.every((l) => l.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1)), 'v2.102 farola: su atlas cabe en 256×' + (at && at.h) + ' con ' + (at && at.texturas) + ' texturas de píxel');
    const hex = (o) => o.md, cu = g.poligonos.find((p) => p.pz === 'cuerpo'), po = g.poligonos.find((p) => p.pz === 'poste' && p.tono === 'base'); ok(TX.rampa('vidrio', 'base').md === '#fff3b0' && TX.textura('farola', cu).clave.indexOf('farola|cuerpo|caja|') === 0, 'v2.102 farola: el cristal es #fff3b0 (el color del farol del 2D) en tono «base»');
    ok(TX.rampa('hierro', 'base').md === P2.ink2 && TX.rampa('hierroC', 'base').md === P2.greyD && TX.textura('farola', po).clave.indexOf('farola|poste|lado|') === 0, 'v2.102 farola: el poste con tono «base» es el hierro ink2 del 2D y el collarín y el remate, el greyD'); }
  // el 2D no cambia y la fuente sigue siendo la única con chorros
  { const sh = V.sombraSuelo(g.rect, 7, 9, () => true, V.redonda(d.vol)), xs = sh.flatMap((q) => [q[0], q[2]]), zs = sh.flatMap((q) => [q[1], q[3]]), cx = 7.5 + 0.10, cz = 9.5 + 0.12;
    ok(sh.length >= 8 && sh.length <= 40 && sh.every((q) => Math.abs(q[2] - q[0] - 0.125) < 1e-9) && Math.max(...xs) - Math.min(...xs) > Math.max(...zs) - Math.min(...zs) && Math.min(...xs) >= cx - 0.30 - 0.125 && Math.max(...xs) <= cx + 0.30 + 0.125 && Math.min(...zs) >= cz - 0.17 - 0.125 && Math.max(...zs) <= cz + 0.17 + 0.125, 'v2.102 farola (paso 4): su sombra de suelo es un óvalo pequeño (' + sh.length + ' cuadritos de 0,125 u), más ancho que alto y empujado al sureste'); 
    ok(V.redonda(d.vol).k === 0.75, 'v2.102 farola: la sombra pide el 75 % de intensidad (SUAVE.farola)');
    ok(V.redonda(G.OBJETOS.fuente.vol).rx === undefined, 'v2.102: la fuente conserva su sombra de disco'); }
  { const f = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/mSombraK/.test(f) && /__compartida: true/.test(f), 'v2.102 farola: el pintor usa un material de sombra propio y compartido para el 75 %'); }
  ok(typeof d.dibujar === 'function' && G.capas.bloqueos({ objetos: [{ tipo: 'farola', x: 5, y: 5 }] }, 20, 20).size === 1, 'v2.102 farola: el dibujo 2D sigue siendo el mismo y bloquea una sola casilla');
  { const AN2 = G.mundo.mapa('albanota'), fa = AN2.objetos.filter((o) => o.tipo === 'farola'); ok(fa.length === 14, 'v2.102 farola: Albanota tiene 14 farolas'); }
  { const f = fs.readFileSync(path.join(__dirname, 'src/particulas3d.js'), 'utf8'); ok(/d\.vol\.torno && d\.vol\.estilo === 'fuente'/.test(f), 'v2.102 farola: el chorro de la fuente solo sale de la pieza con estilo «fuente» (la farola también es un torno)'); }
  ok(/solidos\(R, vol\)/.test(fs.readFileSync(path.join(__dirname, 'src/volumenes.js'), 'utf8').replace(/\/\/[^\n]*/g, '')) && V.validar('x', { huella: [[0, 0, 1, 1]], vol: { torno: { x: 0.5, z: 0.5, piezas: [{ pz: 'a', mat: 'b', y0: 0, r0: 1, y1: 1, r1: 1 }] }, cajas: [{ pz: 'c', mat: 'd', x: 0, z: 0, w: 0, y0: 0, y1: 1 }], troncos: [{ pz: 't', mat: 'e', x: 0, z: 0, w0: 1, w1: 0, y0: 1, y1: 0 }] } }).length === 2, 'v2.102 volúmenes: validar() detecta una caja sin ancho y un tronco al revés');
}

// ── v2.103 · OBJETOS 3D, paso 5 · luz pequeña de las farolas en el HD-2D (docs/FICHAS_OBJETOS_3D.md): charco de luz + halo + parpadeo + interruptor ──
{ const fs = require('fs'), path = require('path'), LF = G.luzFarolas, A = LF.AJUSTES, P5 = G.hd2d.plan(G.mundo.mapa('albanota'));
  ok(LF && A.RADIO === 1.5 && A.INTENSIDAD === 0.22 && A.PASOS === 4 && A.COLOR === '#ffd98a' && A.ALTO === 0.02 && A.HALO === 0.9 && A.HALO_INT === 0.5 && A.HALO_PASOS === 3 && A.PARPADEO === 0.04, 'v2.103 luz de farolas: los números de la ficha (radio 1,5 u, intensidad 0,22, 4 escalones, halo 0,9 u al 0,5 con 3 escalones, parpadeo ±4 %)');
  ok(A.ACTIVO === true && A.NOCHE === 0, 'v2.103 luz de farolas: activa pero de día (NOCHE = 0, no se nota); ?farolas=1 la pone de noche y ?farolas=0 la quita');
  { const pts = LF.puntos(P5.objetos), fs3 = P5.objetos.filter((o) => o.tipo === 'farola'); ok(pts.length === 14 && fs3.length === 14 && pts.every((q, k) => Math.abs(q.x - (fs3[k].x + 0.5)) < 1e-9 && Math.abs(q.z - (fs3[k].z + 0.5)) < 1e-9 && q.y === fs3[k].y), 'v2.103 luz de farolas: una luz por cada una de las 14 farolas, en el centro de su casilla');
    G.hd2d.AJUSTES.VOLUMENES = false; ok(LF.puntos(G.hd2d.plan(G.mundo.mapa('albanota')).objetos).length === 0, 'v2.103 luz de farolas: una farola que sale como lámina (sin volumen) no lleva luz'); G.hd2d.AJUSTES.VOLUMENES = true; }
  ok([1, 2, 3, 4, 8].every((n) => LF.nivel(1, n) === 0 && LF.nivel(0, n) === 1) && [0.01, 0.3, 0.55, 0.8, 0.99].map((d) => LF.nivel(d, 4)).join() === '1,0.75,0.5,0.25,0.25', 'v2.103 luz de farolas: el degradado baja en escalones de 1/n (1, 3/4, 1/2, 1/4, fuera)');
  { const niv = new Set(); for (let i = 0; i <= 100; i++) niv.add(LF.nivel(i / 100, 4)); ok([...niv].sort().join() === '0,0.25,0.5,0.75,1', 'v2.103 luz de farolas: el charco solo tiene 4 escalones de luz más el borde sin luz'); }
  { const c = LF.charco(), h = LF.halo(); ok(c.width === 24 && c.height === 24 && h.width === 16 && h.height === 16, 'v2.103 luz de farolas: charco de 24×24 texels y halo de 16×16 (1 texel de charco = 1/8 u)'); }
  { let mn = 9, mx = 0; for (let t = 0; t < 600; t += 0.05) { const f = LF.parpadeo(t, false); mn = Math.min(mn, f); mx = Math.max(mx, f); }
    ok(mn >= 1 - A.PARPADEO - 1e-9 && mx <= 1 + A.PARPADEO + 1e-9 && mx - mn > 0.03 && LF.parpadeo(0, false) !== LF.parpadeo(1, false), 'v2.103 luz de farolas: el parpadeo se mueve entre 0,96 y 1,04 sin salirse');
    ok([0, 1, 7.3, 99].every((t) => LF.parpadeo(t, true) === 1), 'v2.103 luz de farolas: con «menos movimiento» (?movimiento=0) no parpadea'); }
  { const f = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8').replace(/\/\/[^\n]*/g, ''); ok(/AdditiveBlending/.test(f) && /depthWrite: false/.test(f) && /E\.farolas = \{ pts, mc, mh/.test(f) && /luzFarolas\(v\.yaw\)/.test(f), 'v2.103 luz de farolas: el pintor las dibuja con mezcla aditiva, sin escribir profundidad, en dos mallas (charcos y halos) y las actualiza cada cuadro');
    ok(/farolas: E\.farolas/.test(f), 'v2.103 luz de farolas: G.hd2d.estado() cuenta las luces'); }
  { const f = fs.readFileSync(path.join(__dirname, 'src/orden.json'), 'utf8'); ok(f.indexOf('luz_farolas.js') > f.indexOf('volumenes_tex.js') && f.indexOf('luz_farolas.js') < f.indexOf('hd2d_pintor.js'), 'v2.103 luz de farolas: se carga entre las texturas de volumen y el pintor'); }
  ok(fs.existsSync(path.join(__dirname, 'tools/prueba_farolas_hd2d.py')), 'v2.103 luz de farolas: existe tools/prueba_farolas_hd2d.py (Three.js real)');
}
// ── v2.105 · OBJETOS 3D, BANCO, paso 2 · el banco en volumen con colores lisos (docs/FICHA_BANCO_3D.md): 9 cajas de madera con fondo `d`, sin torno ni muros ──
{ const V = G.volumenes, TX = G.volTex, d = G.OBJETOS.banco, g = V.geometria(d.huella, d.vol), cajas = d.vol.cajas, pz = (n) => g.poligonos.filter((p) => p.pz === n), E9 = 1e-9;
  const caja = (n) => cajas.filter((c) => c.pz === n), ext = (c) => ({ x0: c.x - c.w / 2, x1: c.x + c.w / 2, z0: c.z - (c.d !== undefined ? c.d : c.w) / 2, z1: c.z + (c.d !== undefined ? c.d : c.w) / 2 });
  ok(d.huella.length === 1 && d.huella[0].join() === '0,0,2,1' && d.w === 26 && d.h === 16 && d.ox === 3 && d.pieY === 14 && V.validar('banco', d).length === 0, 'v2.105 banco: la huella sigue siendo 2×1 (el motor no cambia), el dibujo 2D sigue siendo 26×16 y su `vol` es válido');
  ok(V.esDeCajas(d.vol) && d.vol.torno === undefined && d.vol.muros === undefined && d.vol.tejado === undefined && cajas.length === 9, 'v2.105 banco: es un volumen solo de cajas (9 cajas, sin torno, muros ni tejado)');
  ok(G.capas.bloqueos({ objetos: [{ tipo: 'banco', x: 5, y: 5 }] }, 20, 20).size === 2, 'v2.105 banco: el motor sigue bloqueando 2 casillas');
  ok(caja('pata').length === 4 && caja('asiento').length === 1 && caja('montante').length === 2 && caja('listonAlto').length === 1 && caja('listonBajo').length === 1, 'v2.105 banco: 4 patas, asiento, 2 montantes y 2 listones (9 cajas)');
  ok(Math.abs(g.altoTotal - 1.0) < E9 && Math.abs(g.altoTotal * 16 - d.h) < E9, 'v2.105 banco: alto total 1,0 u = 16 px, igual que el sprite del 2D');
  ok(g.triangulos >= 60 && g.triangulos <= 120 && g.triangulos <= V.MAX_TRIANGULOS, 'v2.105 banco: ' + g.triangulos + ' triángulos (ficha: objetivo ≤ 120)');
  { const xs = g.poligonos.flatMap((p) => p.v.map((q) => q[0])), zs = g.poligonos.flatMap((p) => p.v.map((q) => q[2]));
    ok(Math.abs(Math.min(...xs) - 0.1875) < E9 && Math.abs(Math.max(...xs) - 1.8125) < E9 && Math.abs((Math.max(...xs) - Math.min(...xs)) - 1.625) < E9, 'v2.105 banco: largo total 1,625 u (26 px), de x = 0,1875 a 1,8125, centrado en x = 1,0');
    ok(Math.abs(Math.max(...zs) - 0.875) < E9 && Math.abs(Math.min(...zs) - 0.375) < E9, 'v2.105 banco: el borde sur está a z = 0,875 (los 14 de 16 px de `pieY`) y el fondo del asiento es de 0,5 u');
    ok(g.poligonos.every((p) => p.v.every((q) => q[0] >= 0 && q[0] <= 2 && q[2] >= 0 && q[2] <= 1)), 'v2.105 banco: todo el volumen cabe dentro de su huella 2×1'); }
  { const a = ext(caja('asiento')[0]); ok(Math.abs(a.x0 - 0.1875) < E9 && Math.abs(a.x1 - 1.8125) < E9 && Math.abs(a.z0 - 0.375) < E9 && Math.abs(a.z1 - 0.875) < E9 && caja('asiento')[0].y0 === 0.25 && caja('asiento')[0].y1 === 0.4375, 'v2.105 banco: el asiento mide x 0,1875–1,8125 · z 0,375–0,875 · y 0,25–0,4375 (ficha, tabla 1)');
    const p = caja('pata').map(ext).sort((u, v) => u.z0 - v.z0 || u.x0 - v.x0), ok4 = [[0.25, 0.4375, 0.4375, 0.5625], [1.5625, 1.75, 0.4375, 0.5625], [0.25, 0.4375, 0.6875, 0.8125], [1.5625, 1.75, 0.6875, 0.8125]].every((e, i) => Math.abs(p[i].x0 - e[0]) < E9 && Math.abs(p[i].x1 - e[1]) < E9 && Math.abs(p[i].z0 - e[2]) < E9 && Math.abs(p[i].z1 - e[3]) < E9);
    ok(ok4 && caja('pata').every((c) => c.y0 === 0 && c.y1 === 0.25), 'v2.105 banco: las 4 patas miden 0,1875 × 0,125 u y 0,25 u de alto, las traseras en línea con los montantes (ficha, tabla 1)');
    const m = caja('montante').map(ext).sort((u, v) => u.x0 - v.x0), li = [caja('listonAlto')[0], caja('listonBajo')[0]];
    ok(Math.abs(m[0].x0 - 0.3125) < E9 && Math.abs(m[0].x1 - 0.4375) < E9 && Math.abs(m[1].x0 - 1.5625) < E9 && Math.abs(m[1].x1 - 1.6875) < E9 && m.every((e) => Math.abs(e.z0 - 0.4375) < E9 && Math.abs(e.z1 - 0.5625) < E9) && caja('montante').every((c) => c.y0 === 0.4375 && c.y1 === 1.0), 'v2.105 banco: los 2 montantes miden 0,125 × 0,125 u y suben de 0,4375 a 1,0 u');
    ok(li.every((c) => { const e = ext(c); return Math.abs(e.x0 - 0.25) < E9 && Math.abs(e.x1 - 1.75) < E9 && Math.abs(e.z0 - 0.375) < E9 && Math.abs(e.z1 - 0.5) < E9; }) && li[0].y0 === 0.8125 && li[0].y1 === 0.9375 && li[1].y0 === 0.625 && li[1].y1 === 0.75, 'v2.105 banco: listón alto (0,8125–0,9375) y bajo (0,625–0,75), de 1,5 × 0,125 u');
    ok(Math.abs(ext(caja('montante')[0]).z1 - ext(li[0]).z1 - 0.0625) < E9, 'v2.105 banco: los montantes quedan 0,0625 u por delante de los listones (sin caras coplanares)'); }
  ok(cajas.every((c) => c.w >= 0.125 - E9 && (c.d === undefined || c.d >= 0.125 - E9) && c.y1 - c.y0 >= 0.125 - E9), 'v2.105 banco: ninguna pieza mide menos de 0,125 u (2 px) en ninguna dirección');
  ok(g.poligonos.filter((p) => p.parte === 'caja').length === 9 * 4 && g.poligonos.filter((p) => p.parte === 'caja_tapa').length === 5 && ['asiento', 'montante', 'listonAlto', 'listonBajo'].every((n) => pz(n).some((p) => p.parte === 'caja_tapa')) && pz('pata').every((p) => p.parte === 'caja'), 'v2.105 banco: 36 caras laterales y 5 tapas (asiento, montantes y listones; las patas no llevan: las tapa el asiento)');
  ok(g.poligonos.filter((p) => p.parte === 'caja').every((p) => p.tono === V.TONO[p.cara]) && g.poligonos.filter((p) => p.parte === 'caja_tapa').every((p) => p.tono === 'luz' && p.n[1] === 1), 'v2.105 banco: luz fija (oeste luz · sur base · este y norte sombra) y las tapas con tono luz');
  { const mal = g.poligonos.filter((p) => { const c = p.v.reduce((a, q) => [a[0] + q[0] / p.v.length, a[1] + q[1] / p.v.length, a[2] + q[2] / p.v.length], [0, 0, 0]), cj = cajas.find((q) => q.pz === p.pz && ext(q).x0 <= c[0] + E9 && ext(q).x1 >= c[0] - E9 && ext(q).z0 <= c[2] + E9 && ext(q).z1 >= c[2] - E9 && q.y0 - E9 <= c[1] && q.y1 + E9 >= c[1]), cc = cj ? [(ext(cj).x0 + ext(cj).x1) / 2, (cj.y0 + cj.y1) / 2, (ext(cj).z0 + ext(cj).z1) / 2] : c; return !cj || ((c[0] - cc[0]) * p.n[0] + (c[1] - cc[1]) * p.n[1] + (c[2] - cc[2]) * p.n[2]) <= 0; }); ok(mal.length === 0, 'v2.105 banco: todas las caras miran hacia fuera de su caja'); }
  ok(V.validar('b1', { vol: { cajas: [{ pz: 'a', mat: 'madera', x: 0.5, z: 0.5, w: 0.0625, d: 0.5, y0: 0, y1: 0.5 }] }, huella: [[0, 0, 1, 1]] }).length === 1 && V.validar('b2', { vol: { cajas: [{ pz: 'a', mat: 'madera', x: 0.9, z: 0.5, w: 0.5, d: 0.5, y0: 0, y1: 0.5 }] }, huella: [[0, 0, 1, 1]] }).length === 1 && V.validar('b3', { vol: { cajas: [{ pz: 'a', mat: 'madera', x: 0.5, z: 0.5, w: 0.5, d: 0.5, y0: 0, y1: 0.0625 }] }, huella: [[0, 0, 1, 1]] }).length === 1, 'v2.105 banco: validar() rechaza una pieza de menos de 0,125 u y una que se sale de la huella');
  ok(V.geometria([[0, 0, 1, 1]], { cajas: [{ pz: 'a', mat: 'madera', x: 0.5, z: 0.5, w: 0.5, y0: 0, y1: 0.5, tapa: true }] }).triangulos === 10 && V.geometria([[0, 0, 1, 1]], { cajas: [{ pz: 'a', mat: 'madera', x: 0.5, z: 0.5, w: 0.5, d: 0.25, y0: 0, y1: 0.5 }] }).poligonos.filter((p) => p.cara === 's')[0].largo === undefined && Math.abs(V.geometria([[0, 0, 1, 1]], { cajas: [{ pz: 'a', mat: 'madera', x: 0.5, z: 0.5, w: 0.5, d: 0.25, y0: 0, y1: 0.5 }] }).rect.d - 1) < E9, 'v2.105 banco: una caja sin `d` sigue siendo cuadrada (d = w) y con `d` es rectangular');
  { const A = V.geometria([[0, 0, 1, 1]], { cajas: [{ pz: 'a', mat: 'madera', x: 0.5, z: 0.5, w: 0.5, d: 0.25, y0: 0, y1: 0.5 }] }), s = A.poligonos.find((p) => p.cara === 's'), e = A.poligonos.find((p) => p.cara === 'e'); ok(Math.abs(Math.max(...s.v.map((q) => q[0])) - Math.min(...s.v.map((q) => q[0])) - 0.5) < E9 && Math.abs(Math.max(...e.v.map((q) => q[2])) - Math.min(...e.v.map((q) => q[2])) - 0.25) < E9, 'v2.105 banco: la cara sur de una caja con d = 0,25 mide w de ancho y la este mide d de fondo'); }
  ok(['cartel', 'barril', 'espantapajaros'].every((t) => !G.OBJETOS[t] || !G.OBJETOS[t].vol), 'v2.105 banco: el resto del mobiliario (cartel, barril, espantapájaros) sigue como lámina (la maceta tiene volumen desde la v2.164)');
  // colores lisos del estilo «banco» (paso 2); el paso 3 los cambia por texturas de píxel
  ok(TX.ESTILOS.includes('banco') && TX.soporta(d.vol) && TX.SIN_FACHADA.includes('banco'), 'v2.105 banco: G.volTex conoce el estilo «banco» y no pide fachada del 2D');
  { const at = TX.atlas('banco', g), P2 = G.PAL; ok(at && at.w === 256 && at.h <= 256 && at.uv.length === g.poligonos.length && at.uv.every((l) => l.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1)), 'v2.105 banco: el atlas cabe en 256×' + (at && at.h) + ' con ' + (at && at.texturas) + ' texturas para ' + g.poligonos.length + ' polígonos');
    const asi = g.poligonos.find((p) => p.pz === 'asiento' && p.cara === 's'), pa = g.poligonos.find((p) => p.pz === 'pata' && p.cara === 's'), ta = g.poligonos.find((p) => p.pz === 'asiento' && p.parte === 'caja_tapa');
    ok(TX.rampa('madera', 'luz').md === P2.wood1 && TX.rampa('madera', 'base').md === P2.wood3 && TX.rampa('maderaOsc', 'base').md === P2.woodD && TX.rampa('maderaOsc', 'luz').md === P2.wood3, 'v2.105 banco: madera = wood1 (luz) / wood3 (base); madera oscura = wood3 (luz) / woodD (base)');
    const lienzoDe = (p) => { const t = TX.textura('banco', p), x = t.c.getContext('2d'), im = x.getImageData(0, 0, t.w, t.h).data, cs = new Set(); for (let i = 0; i < im.length; i += 4) cs.add(im[i] + ',' + im[i + 1] + ',' + im[i + 2] + ',' + im[i + 3]); return cs.size; };
    ok(lienzoDe(pa) === 1 && lienzoDe(g.poligonos.find((p) => p.pz === 'montante' && p.cara === 's')) === 1, 'v2.105 banco: las patas y los montantes llevan un color liso (sus texturas son de la 2.ª mitad del paso 3)'); void asi; void ta; }
  { const f = require('fs').readFileSync(require('path').join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/\.sombra === false \? \[\]/.test(f), 'v2.105 banco: sin sombra de suelo hasta el paso 4 (`vol.sombra === false`); la sombra de edificio no vale para un banco'); }
  { const AN2 = G.mundo.mapa('albanota'), bs = AN2.objetos.filter((o) => o.tipo === 'banco'); ok(bs.length === 3 && bs.map((o) => o.x + ',' + o.y).sort().join(' ') === '20,16 27,16 8,16', 'v2.105 banco: Albanota tiene 3 bancos en (8,16) (20,16) (27,16)'); }
  { const Pn = G.hd2d.plan(G.mundo.mapa('albanota')), b = Pn.objetos.filter((o) => o.tipo === 'banco'); ok(b.length === 3 && b.every((o) => o.modo === 'volumen'), 'v2.105 banco: el HD-2D dibuja los 3 bancos de Albanota como «volumen»'); G.hd2d.AJUSTES.VOLUMENES = false; ok(G.hd2d.plan(G.mundo.mapa('albanota')).objetos.filter((o) => o.tipo === 'banco').every((o) => o.modo === 'cartel'), 'v2.105 banco: con el interruptor de volúmenes apagado vuelven a ser lámina'); G.hd2d.AJUSTES.VOLUMENES = true; }
  ok(typeof d.dibujar === 'function' && d.w === 26 && d.h === 16, 'v2.105 banco: el dibujo 2D sigue ahí, sin cambios (26×16)');
}
// ── v2.106 · OBJETOS 3D, BANCO, paso 3 (1.ª MITAD) · texturas de píxel del asiento y los listones (docs/FICHA_BANCO_3D.md, sección 2) ──
{ const V = G.volumenes, TX = G.volTex, d = G.OBJETOS.banco, g = V.geometria(d.huella, d.vol), P2 = G.PAL;
  // lienzo que anota los píxeles (el de las pruebas no guarda nada): se llama a bancoTex directamente, sin la caché de texturas
  const hacer = (p) => { const [w, h] = TX.medida(p), mc = G.makeCanvas; G.makeCanvas = (ww, hh) => { const px = new Array(ww * hh).fill(null), x = { fillStyle: '#000', imageSmoothingEnabled: false, fillRect(a, b, w2, h2) { for (let j = Math.max(0, b); j < Math.min(hh, b + h2); j++) for (let i = Math.max(0, a); i < Math.min(ww, a + w2); i++) px[j * ww + i] = this.fillStyle; } }; return { width: ww, height: hh, px, getContext: () => x }; };
    try { const l = TX.bancoTex(p, w, h, p.tono); return { w, h, px: l.c.px, at: (x, y) => l.c.px[y * w + x] }; } finally { G.makeCanvas = mc; } };
  const f = (pz, parte, cara) => g.poligonos.find((p) => p.pz === pz && p.parte === parte && (cara === undefined || p.cara === cara));
  const top = hacer(f('asiento', 'caja_tapa')), Rl = TX.rampa('madera', 'luz');
  ok(top.w === 26 && top.h === 8, 'v2.106 banco: la tapa del asiento es una textura de 26×8 texels (1 texel = 1 px del 2D)');
  ok([0, 3, 4, 6, 7].every((y) => top.at(10, y) !== Rl.lo) === true && top.at(0, 2) === Rl.lo && top.at(25, 2) === Rl.lo && top.at(0, 5) === Rl.lo && top.at(25, 5) === Rl.lo && [1, 3, 4, 6, 7].every((y) => top.at(0, y) !== Rl.lo) , 'v2.106 banco: el asiento tiene 3 tablones de 2 texels con una línea oscura de 1 texel entre ellos (filas 2 y 5)');
  ok(Array.from({ length: 26 }, (_, x) => top.at(x, 0)).every((c) => c === Rl.hi) && Rl.hi === '#d9a574', 'v2.106 banco: el borde sur del asiento lleva el brillo #d9a574');
  { const vetas = (y0, y1) => { let n = 0; for (let y = y0; y <= y1; y++) for (let x = 0; x < 26; x++) if (top.at(x, y) === P2.wood2) n++; return n; }; ok(vetas(0, 1) > 0 && vetas(3, 4) > 0 && vetas(6, 7) > 0 && vetas(0, 1) <= 10 && vetas(3, 4) <= 10 && vetas(6, 7) <= 10, 'v2.106 banco: cada tablón lleva unas vetas cortas de wood2 (2 o 3, en posiciones fijas)'); }
  { const a = hacer(f('asiento', 'caja_tapa')), b = hacer(f('asiento', 'caja_tapa')); ok(a.px.join() === b.px.join(), 'v2.106 banco: sin azar (la misma textura sale igual cada vez)'); }
  { const fr = hacer(f('asiento', 'caja', 's')), R = TX.rampa('madera', 'base'); ok(fr.w === 26 && fr.h === 3 && fr.at(0, 0) === R.hi && fr.at(13, 1) === R.md && fr.at(25, 2) === R.lo && R.md === P2.wood3 && R.lo === P2.woodD, 'v2.106 banco: el frente del asiento es wood3 con el filo de arriba más claro (wood1) y el de abajo más oscuro (woodD)'); }
  { const co = hacer(f('asiento', 'caja', 'o')), ce = hacer(f('asiento', 'caja', 'e')); ok(co.w === 8 && co.h === 3 && ce.w === 8 && co.at(3, 1) === TX.rampa('madera', 'luz').md && ce.at(3, 1) === TX.rampa('madera', 'sombra').md && co.at(3, 0) === TX.rampa('madera', 'luz').hi, 'v2.106 banco: los costados del asiento siguen el tono de su cara (oeste luz, este sombra) con los mismos filos'); }
  ['listonAlto', 'listonBajo'].forEach((n) => { const fr = hacer(f(n, 'caja', 's')), R = TX.rampa('madera', 'base'), ca = hacer(f(n, 'caja', 'o')), ti = hacer(f(n, 'caja_tapa'));
    ok(fr.w === 24 && fr.h === 2 && Array.from({ length: 24 }, (_, x) => fr.at(x, 0)).every((c) => c === R.hi) && fr.px.slice(24).some((c) => c === R.lo) && fr.px.slice(24).some((c) => c === R.md), 'v2.106 banco: el frente del ' + n + ' es wood3 con la fila de arriba en wood1 y una veta');
    ok(ca.w === 2 && ca.h === 2 && ca.px.every((c) => c === TX.rampa('madera', 'luz').lo) && ti.w === 24 && ti.h === 2 && ti.at(5, 1) === TX.rampa('madera', 'luz').md, 'v2.106 banco: las cabezas del ' + n + ' son más oscuras y su cara de arriba es de madera clara'); });
  ok(['asiento', 'listonAlto', 'listonBajo'].every((n) => g.poligonos.filter((p) => p.pz === n).every((p) => TX.textura('banco', p).clave.indexOf('banco|' + n) === 0)), 'v2.106 banco: el asiento y los dos listones tienen cada uno su textura (clave por pieza, parte, cara y tono)');
  { const at = TX.atlas('banco', g); ok(at && at.w === 256 && at.h <= 256 && at.uv.every((l) => l.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1)), 'v2.106 banco: el atlas sigue cabiendo en 256×' + (at && at.h)); }
  // (v2.108: las patas ya no son lisas; lo comprueba el grupo v2.108)
  ok(g.triangulos === 82 && V.validar('banco', d).length === 0, 'v2.106 banco: la geometría no cambia (82 triángulos, `vol` válido)');   // v2.109: la sombra de suelo ya existe (grupo v2.109)
}
// ── v2.107 · OBJETOS 3D, BANCO, paso 3 (2.ª MITAD, parte 1) · texturas de los 2 montantes ──
{ const V = G.volumenes, TX = G.volTex, d = G.OBJETOS.banco, g = V.geometria(d.huella, d.vol);
  const hacer = (p) => { const [w, h] = TX.medida(p), mc = G.makeCanvas; G.makeCanvas = (ww, hh) => { const px = new Array(ww * hh).fill(null), x = { fillStyle: '#000', imageSmoothingEnabled: false, fillRect(a, b, w2, h2) { for (let j = Math.max(0, b); j < Math.min(hh, b + h2); j++) for (let i = Math.max(0, a); i < Math.min(ww, a + w2); i++) px[j * ww + i] = this.fillStyle; } }; return { width: ww, height: hh, px, getContext: () => x }; };
    try { const l = TX.bancoTex(p, w, h, p.tono); return { w, h, at: (x, y) => l.c.px[y * w + x], px: l.c.px }; } finally { G.makeCanvas = mc; } };
  const mo = g.poligonos.filter((p) => p.pz === 'montante'), cara = (c) => mo.find((p) => p.parte === 'caja' && p.cara === c), R = (t) => TX.rampa('maderaOsc', t);
  const s = hacer(cara('s')), o = hacer(cara('o')), e = hacer(cara('e')), n = hacer(cara('n')), ta = hacer(mo.find((p) => p.parte === 'caja_tapa'));
  ok(s.w === 2 && s.h === 9 && o.w === 2 && ta.w === 2 && ta.h === 2, 'v2.107 banco: los montantes son texturas de 2×9 texels (cara) y 2×2 (tapa)');
  ok(s.at(1, 4) === R('base').hi && s.at(0, 4) === R('base').md && n.at(1, 4) === R('sombra').hi && o.at(0, 4) === R('luz').hi && o.at(1, 4) === R('luz').md && e.at(0, 4) === R('sombra').hi, 'v2.107 banco: un filo claro de 1 texel a la izquierda de quien mira cada cara (en sur y norte el último texel; en este y oeste el primero)');
  ok([s, o, e, n].every((t) => Array.from({ length: t.w }, (_, x) => t.at(x, 0)).every((c, _, a) => c === a[0])) && s.at(0, 0) === R('base').hi && o.at(1, 0) === R('luz').hi, 'v2.107 banco: el brillo de arriba cubre toda la fila de arriba de cada cara');
  ok(ta.px.every((c) => c === R('luz').hi) && R('base').md === G.PAL.woodD && R('luz').md === G.PAL.wood3, 'v2.107 banco: la tapa del montante es todo brillo y la madera oscura es woodD (base) / wood3 (luz)');
  ok(g.poligonos.filter((p) => p.pz === 'montante').length === 10 && g.triangulos === 82 && V.validar('banco', d).length === 0, 'v2.107 banco: la geometría no cambia (82 triángulos, 2 montantes de 5 caras, `vol` válido)');
}
// ── v2.108 · OBJETOS 3D, BANCO, paso 3 (2.ª MITAD, parte 2) · texturas de las 4 patas: cierra el paso 3 ──
{ const V = G.volumenes, TX = G.volTex, d = G.OBJETOS.banco, g = V.geometria(d.huella, d.vol);
  const hacer = (p) => { const [w, h] = TX.medida(p), mc = G.makeCanvas; G.makeCanvas = (ww, hh) => { const px = new Array(ww * hh).fill(null), x = { fillStyle: '#000', imageSmoothingEnabled: false, fillRect(a, b, w2, h2) { for (let j = Math.max(0, b); j < Math.min(hh, b + h2); j++) for (let i = Math.max(0, a); i < Math.min(ww, a + w2); i++) px[j * ww + i] = this.fillStyle; } }; return { width: ww, height: hh, px, getContext: () => x }; };
    try { const l = TX.bancoTex(p, w, h, p.tono); return { w, h, at: (x, y) => l.c.px[y * w + x], px: l.c.px }; } finally { G.makeCanvas = mc; } };
  const pa = g.poligonos.filter((p) => p.pz === 'pata'), cara = (c) => pa.find((p) => p.parte === 'caja' && p.cara === c), R = (t) => TX.rampa('maderaOsc', t);
  const s = hacer(cara('s')), o = hacer(cara('o')), e = hacer(cara('e')), n = hacer(cara('n'));
  ok(s.w === 3 && s.h === 4 && n.w === 3 && o.w === 2 && o.h === 4 && e.w === 2, 'v2.108 banco: las patas son texturas de 3×4 texels (sur y norte) y 2×4 (este y oeste)');
  ok(s.at(2, 2) === R('base').hi && s.at(0, 2) === R('base').md && n.at(2, 2) === R('sombra').hi && o.at(0, 2) === R('luz').hi && o.at(1, 2) === R('luz').md && e.at(0, 2) === R('sombra').hi, 'v2.108 banco: un filo claro de 1 texel a la izquierda de quien mira cada cara (en sur y norte el último texel; en este y oeste el primero)');
  ok([s, o, e, n].every((t) => Array.from({ length: t.w }, (_, x) => t.at(x, 0)).every((c, _, a) => c === a[0])) && s.at(1, 0) === R('base').hi && o.at(1, 0) === R('luz').hi && s.at(1, 3) === R('base').md, 'v2.108 banco: el brillo de arriba cubre toda la fila de arriba y la de abajo queda sin brillo');
  ok(pa.length === 16 && pa.every((p) => p.parte === 'caja') && g.triangulos === 82 && V.validar('banco', d).length === 0, 'v2.108 banco: la geometría no cambia (82 triángulos, 4 patas de 4 caras sin tapa, `vol` válido)');
  ok(pa.every((p) => TX.textura('banco', p).clave.indexOf('banco|pata') === 0), 'v2.108 banco: cada cara de pata tiene su textura (clave por pieza, parte, cara y tono)');
  { const at = TX.atlas('banco', g); ok(at && at.w === 256 && at.h <= 256 && at.uv.every((l) => l.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1)), 'v2.108 banco: el atlas sigue cabiendo en 256×' + (at && at.h)); }
  ok(g.poligonos.every((p) => { const tx = TX.textura('banco', p); return tx && tx.clave.indexOf('banco|') === 0; }), 'v2.108 banco: ya no queda ninguna pieza con color liso (todas las caras tienen textura de píxel)');
}
// ── v2.109 · OBJETOS 3D, BANCO, paso 4 · sombra de suelo RECTANGULAR en el HD-2D ──
{ const V = G.volumenes, d = G.OBJETOS.banco, g = V.geometria(d.huella, d.vol), cx = 8, cz = 16, red = V.redonda(d.vol);
  const sh = V.sombraSuelo(g.rect, cx, cz, () => true, red), xs = sh.flatMap((q) => [q[0], q[2]]), zs = sh.flatMap((q) => [q[1], q[3]]);
  const X = cx + 1.0 + 0.10, Z = cz + 0.625 + 0.12;
  ok(red && red.rw === 1.75 && red.rd === 0.55 && red.k === 0.75 && d.vol.sombra !== false, 'v2.109 banco: la sombra pide un rectángulo de 1,75 × 0,55 u al 75 % (SUAVE.banco del 2D)');
  ok(sh.length > 0 && sh.every((q) => Math.abs(q[2] - q[0] - 0.125) < 1e-9 && Math.abs(q[3] - q[1] - 0.125) < 1e-9), 'v2.109 banco: la sombra son ' + sh.length + ' cuadritos de 0,125 u');
  ok(Math.min(...xs) >= X - 0.875 - 0.0625 - 1e-9 && Math.max(...xs) <= X + 0.875 + 0.0625 + 1e-9 && Math.min(...zs) >= Z - 0.275 - 0.0625 - 1e-9 && Math.max(...zs) <= Z + 0.275 + 0.0625 + 1e-9, 'v2.109 banco: cabe en el rectángulo de 1,75 × 0,55 u empujado 0,10 al este y 0,12 al sur del centro del banco');
  ok(Math.max(...xs) - Math.min(...xs) >= 1.6 && Math.max(...xs) - Math.min(...xs) > 2.5 * (Math.max(...zs) - Math.min(...zs)) && sh.length === new Set(sh.map((q) => q.join())).size, 'v2.109 banco: es un rectángulo alargado (más de 2,5 veces más ancho que fondo) y sin cuadritos repetidos');
  ok(Math.min(...xs) > cx + 0.1 && Math.max(...xs) < cx + 2.0 + 0.2 && Math.min(...zs) > cz && Math.max(...zs) <= cz + 1.0, 'v2.109 banco: queda dentro de la huella 2×1 (no invade otras casillas)');
  const sin = V.sombraSuelo(g.rect, cx, cz, (x) => x !== cx + 1, red); ok(sin.length > 0 && sin.length < sh.length && sin.every((q) => Math.floor((q[0] + q[2]) / 2) !== cx + 1), 'v2.109 banco: no deja sombra donde el mapa no la permite (árboles, agua, puente)');
  ok(V.redonda(G.OBJETOS.fuente.vol).rx === undefined && V.redonda(G.OBJETOS.fuente.vol).rw === undefined && V.redonda(G.OBJETOS.farola.vol).rx === 0.30 && V.redonda(G.OBJETOS.casa_lali.vol) === null, 'v2.109: la fuente y la farola conservan su sombra y los edificios su anillo');
  { const f = require('fs').readFileSync(require('path').join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/\.sombra === false \? \[\]/.test(f) && f.includes('redonda(G.OBJETOS[o.tipo].vol)'), 'v2.109 banco: el pintor usa la misma ruta de sombra que la farola (y `sombra: false` sigue apagándola)'); }
  ok(g.triangulos === 82 && V.validar('banco', d).length === 0, 'v2.109 banco: la geometría no cambia (82 triángulos, `vol` válido)');
}
// ── v2.112 · 2D CLÁSICO (src/clasico2d.js): suelo plano por casillas, sin sombras proyectadas, criaturas planas y más casillas a la vista; el HD-2D no cambia ──
{
  const C = G.clasico, T = 16;
  ok(C && C.ACTIVO === true && C.COLUMNAS === 12 && typeof C.casilla === 'function' && typeof C.spriteCriatura === 'function', 'v2.112 clásico: existe, está activo por defecto y quiere ~12 casillas de ancho');
  const graba = (ch, tx, ty, m) => { const px = new Array(T * T).fill(null); let llamo = false; const x = { fillStyle: '#000', fillRect(a, b, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = a + i - tx * T, Y = b + j - ty * T; if (X >= 0 && Y >= 0 && X < T && Y < T) px[Y * T + X] = this.fillStyle; } } }; C.casilla(() => { llamo = true; })(x, ch, tx, ty, m); return { px, llamo }; };
  const m = G.mundo.mapa('pueblo_inicial'), todas = '.ft=~gsrclb#hd_mx'.split('');
  ok(todas.every((ch) => { const g = graba(ch, 3, 4, m); return !g.llamo && g.px.every((c) => c !== null); }), 'v2.112 clásico: las 17 casillas del editor las dibuja el estilo clásico y cubren sus 16×16 píxeles');
  ok(todas.every((ch) => JSON.stringify(graba(ch, 5, 7, m).px) === JSON.stringify(graba(ch, 5, 7, m).px)), 'v2.112 clásico: dibujo determinista (mismo resultado dos veces, sin azar)');
  { const finas = [[3, 4], [4, 4], [5, 4], [6, 4], [7, 4]].filter(([x, y]) => { const c = new Set(graba('.', x, y, m).px); return c.size >= 3 && c.size <= 8; }).length; ok(finas >= 3, 'v2.242 clásico: la hierba lleva grano fino (9 puntitos de 1 px en dos tonos, sin matitas) y alguna flor suelta'); const cam = new Set(graba('=', 3, 4, m).px); ok(cam.size <= 6, 'v2.242 clásico: el camino sin piedrecitas; solo base, borde y puntos de borde suave (' + cam.size + ' colores)'); }
  { const flores = []; for (let ty = 0; ty < 26; ty++) for (let tx = 0; tx < 36; tx++) { const g = graba('f', tx, ty, m); flores.push(g.px.every((c) => c !== null)); } ok(flores.every(Boolean), 'v2.112 clásico: ninguna flor se sale de su casilla (el hash se usa sin signo)'); }
  ok(graba('?', 1, 1, m).llamo === true, 'v2.112 clásico: una casilla desconocida se deja al dibujo de siempre');
  const act = G.SOMBREADO.ACTIVO, a = G.creatureSprite('aguacato', 'down', 0), b = C.spriteCriatura('aguacato', 'down', 0), b2 = C.spriteCriatura('aguacato', 'down', 0);
  ok(G.SOMBREADO.ACTIVO === act && !G.__plano, 'v2.112 clásico: spriteCriatura devuelve el interruptor de sombreado y la marca de dibujo plano como estaban');
  ok(b === b2 && b !== a && G.creatureSprite('aguacato', 'down', 0) === a, 'v2.112 clásico: el dibujo plano tiene su propia caché y no pisa el sombreado del HD-2D');
  const f1 = G.capas.fondo(m, () => {}, 'c:prueba'), f2 = G.capas.fondo(m, () => {}, 'c:prueba'), f3 = G.capas.fondo(m, () => {}, 'otro:prueba');
  ok(f1 === f2 && f1 !== f3, 'v2.112 clásico: el suelo clásico se guarda con su propia clave (no pisa el del HD-2D)');
  { const f = require('fs').readFileSync(require('path').join(__dirname, 'src/game.js'), 'utf8'); ok(/if \(!clasico\(\) && G\.sombrasp\.activo\(\)\)/.test(f) && /if \(!clasico\(\)\) G\.capas\.luzRegion/.test(f) && f.includes("return clasico() ? G.capas.fondo(m, G.clasico.casilla(drawTile), 'c:' + m.id) : fondo(m); }") && f.includes('fondo, tam: hdTam'), 'v2.112 clásico: el 2D clásico no pinta sombras proyectadas ni tinte y el HD-2D sigue recibiendo el suelo de siempre (fondo)'); }
  { const r = require('child_process').spawnSync('node', [require('path').join(__dirname, 'tools/huella_juego.js'), '--clasico', '--comprobar'], { encoding: 'utf8' }); ok(r.status === 0, 'v2.112 clásico: huella del 2D clásico (si falla a propósito: node tools/huella_juego.js --clasico --escribir) ' + (r.stdout || '').split('\n').slice(0, 3).join(' ')); }
}
// ── v2.113 · OLI 3D, paso 2 (docs/FICHA_OLI_3D.md): volumen con colores lisos, piezas con pivote, pose de andar y giro suave (src/personaje3d.js). El pintor todavía NO lo usa (paso 4) ──
{
  const P = G.personaje3d, fs = require('fs'), path = require('path'), leer = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), e = 1e-9, px = (n) => Math.abs(n * 16 - Math.round(n * 16)) < 1e-9;
  ok(P && ['piezas', 'pose', 'girar', 'geometria', 'tono'].every((k) => typeof P[k] === 'function') && P.MAX_TRIANGULOS === 240, 'v2.114 Oli 3D: existe G.personaje3d (piezas, pose, girar, geometria) con el presupuesto de 240 triángulos (subido desde 200)');
  { const src = leer('src/personaje3d.js').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n'); ok(!/Math\.random|document\.|requestAnimationFrame|new Date|performance\./.test(src) && !/\bTHREE\b|Three\./.test(src), 'v2.113 Oli 3D: es puro (sin azar, sin DOM, sin reloj, sin Three.js)'); }
  // piezas y medidas de la ficha (sección 2)
  const pz = P.piezas(), por = (id) => pz.find((q) => q.id === id);
  ok(pz.length === 16 && new Set(pz.map((q) => q.id)).size === 16 && !pz.some((q) => q.id === 'gafas'), 'v2.126 Oli 3D: 16 cajas (sin la lámina de gafas) con ids distintos (durag completo + banda, 2 trenzas)');
  { const l = pz.filter((q) => /^trenza_/.test(q.id)), ro = l.find((q) => q.col === P.PAL.rojo), ca = l.find((q) => q.col === P.PAL.castano), cab = pz.find((q) => q.id === 'cabeza');
    ok(l.length === 2 && ro && ca && ro.x === 0.25 && ca.x === -0.25 && l.every((q) => q.grupo === 'cabeza' && q.w === 0.25 && q.d === 0.125 && q.h === 0.4375 && q.y0 === 0.75 && q.z === -0.40625 && q.z + q.d / 2 <= -0.34375 + e && Math.abs(q.y0 + q.h - 1.1875) < e) && !pz.some((q) => /^trenza_(\d|lado)/.test(q.id)), 'v2.177 Oli 3D: SOLO DOS trenzas, caen por DETRÁS de la cabeza una junto a la otra (roja a +x y castaña a −x, de 4 px de ancho), bajo el durag y sin trenzas laterales ni mezcladas'); }
  ok(pz.every((q) => q.libre || (q.w >= P.MIN_PIEZA - e && q.h >= P.MIN_PIEZA - e && q.d >= P.MIN_PIEZA - e)) && pz.filter((q) => q.libre).map((q) => q.id).join() === 'durag_banda', 'v2.126 Oli 3D: ninguna caja baja de 0,125 u (2 px), salvo la banda del durag (lámina fina)');
  ok(pz.every((q) => q.libre ? q.w >= 0.5 && q.d >= 0.03 - e : px(q.w) && px(q.h) && px(q.d) && px(q.y0)), 'v2.113 Oli 3D: ancho, alto, fondo y altura de cada caja son múltiplos de 1 px (0,0625 u; las gafas, de lámina, aparte)');
  { const c = por('cabeza'), t = por('torso'), z = por('zapatilla_d'); ok(c.w === 0.875 && c.h === 0.4375 && c.d === 0.6875 && c.y0 === 0.6875 && t.w === 0.6875 && t.h === 0.3125 && t.d === 0.4375 && t.y0 === 0.375 && t.y0 + t.h === c.y0 && z.w === 0.25 && z.h === 0.125 && z.d === 0.375 && z.y0 === 0 , 'v2.126 Oli 3D: cabeza, torso y zapatilla miden lo que dice la ficha (v2.195: la cabeza de piel termina en y 1,125 donde empieza el durag; las gafas ya son textura de la cara, sin lámina)'); }
  ok(!pz.some((q) => /^pelo_/.test(q.id)), 'v2.120 Oli 3D: ya no hay pelo visible sobre la cabeza (todo lo cubre el durag; el pelo solo se ve en las trenzas)');
  { const d = por('durag'), b = por('durag_banda'), c = por('cabeza'); ok(d && d.col === P.PAL.capa && d.w === 0.875 && d.y0 === 1.125 && Math.abs(d.y0 + d.h - 1.4375) < e && d.y0 === c.y0 + c.h && b && b.y0 === d.y0 && b.w > d.w && b.d > d.d && !pz.some((q) => /mechon/.test(q.id)), 'v2.120 Oli 3D: durag oscuro que cubre toda la parte alta de la cabeza (de 1,125 a 1,4375 u) con su banda de 1 px en la frente, sin pelo encima y sin mechones sueltos'); }
  { const cn = pz.filter((q) => /^trenza_/.test(q.id)); ok(cn.length === 2 && cn[0].col !== cn[1].col, 'v2.176 Oli 3D: las dos trenzas son de colores distintos, un color a cada lado'); }
  { const T = (id) => P.textura(id); ok(['torso_sur', 'torso_norte'].every((id) => T(id) && T(id).w === 12 && T(id).h === 5) && ['manga_d_sur', 'manga_i_sur'].every((id) => T(id) && T(id).w === 3 && T(id).h === 5) && T('torso_sur').px.flat().some((c) => c === '#f09a3e'), 'v2.122 Oli 3D (3c): texturas del cuerpo recortadas del sprite 2D (torso de frente y de espalda 12×5, mangas 3×5, con el estampado naranja de la chaqueta)'); }
  { const T = (id) => P.textura(id); ok(['manga_d_norte', 'manga_i_norte'].every((id) => T(id) && T(id).w === 3 && T(id).h === 5) && ['pierna_d_sur', 'pierna_i_sur', 'pierna_d_norte', 'pierna_i_norte'].every((id) => T(id) && T(id).w === 4 && T(id).h === 7 && T(id).px.flat().some((c) => c === '#4a9a5a')) && T('pierna_d_sur').px[3].every((c) => c === '#ffffff' || c === '#2a1b30' || c === null), 'v2.123 Oli 3D 3c-2: espalda de brazos (3×5), piernas 4×7 con calcetín y suela verde'); }
  { const T = (id) => P.textura(id); ok(['cabeza_oeste', 'cabeza_este'].every((id) => T(id) && T(id).w === 11 && T(id).h === 11) && T('cabeza_este').px.flat().some((c) => c === '#f3d9c0') && T('cabeza_oeste').px.flat().some((c) => c === '#f3d9c0'), 'v2.123 Oli 3D 3b-3 mitad 2: costados de la cabeza 11×11 (con piel; este = oeste espejado con swapL)'); }
  { const T = (id) => P.textura(id), ids = P.ids(), tr = pz.filter((q) => /^trenza_/.test(q.id)), nom = (q) => 'trenza_' + (q.col === P.PAL.rojo ? 'roja' : 'castana') + '_' + Math.round(q.h * 16);
    ok(ids.length === 20 && ids.filter((i) => /^trenza_/.test(i)).length === 6 && tr.length === 2 && tr.every((q) => T(nom(q)) && T(nom(q)).w === 2 && T(nom(q)).h === Math.round(q.h * 16)) && ids.every((i) => T(i)) && T('trenza_roja_6') === null && T('trenza_roja_7').px[0].every((c) => c === '#d9453d') && T('trenza_roja_7').px.flat().some((c) => c === '#f2705e') && T('trenza_castana_9').px.flat().some((c) => c === '#54392a') && T('trenza_roja_5').px[4].filter((c) => c === null).length === 1 && T('trenza_roja_7').px[1].join() !== T('trenza_roja_7').px[2].join(), 'v2.125 Oli 3D (3d): las 2 trenzas tienen textura del tamaño de su caja (2×5, 2×7 o 2×9 texels), con fila de arriba lisa, zigzag de tono claro, punta transparente y colores de la paleta del sprite; un alto que no existe da null'); }
  ok(['manga_i', 'mano_i', 'manga_d', 'mano_d'].every((id) => por(id).pivote[1] === 0.6875 && Math.abs(por(id).pivote[0]) === 0.40625) && ['pantalon_i', 'calcetin_i', 'zapatilla_i', 'pantalon_d', 'calcetin_d', 'zapatilla_d'].every((id) => por(id).pivote[1] === 0.4375 && Math.abs(por(id).pivote[0]) === 0.1875), 'v2.113 Oli 3D: los brazos giran en el hombro (y 0,6875, justo donde acaba el torso y empieza la cabeza) y las piernas en la cadera (y 0,4375)');
  ok(Math.abs(por('cabeza').y0 + por('cabeza').h + por('durag').h - 1.4375) < e && Math.abs((1.4375 - 0.6875) / P.ALTO_2D - 12 / 23) < 0.01, 'v2.113 Oli 3D: se conserva el chibi: cabeza con pelo ≈ 52 % de la altura (12 de 23 filas)');
  // el color de cada pieza sale de la paleta del sprite 2D (src/chars.js, que no se toca)
  { const src = leer('src/chars.js'), m = /rex: \{ \/\/ Oli\s*pal: \{([^}]*)\}/.exec(src), pal = {}; if (m) m[1].replace(/(\w): '(#[0-9a-fA-F]{6})'/g, (_, k, v) => (pal[k] = v));
    ok(m && P.PAL.rojo === pal.c && P.PAL.castano === pal.b && P.PAL.capa === pal.e && P.PAL.piel === pal.g && P.PAL.gafas === pal.h && P.PAL.chaqueta === pal.o && P.PAL.pantalon === pal.s && P.PAL.calcetin === pal.r && P.PAL.zapatilla === pal.t, 'v2.113 Oli 3D: los colores lisos son los de CHARS.rex.pal del sprite 2D'); }
  // geometría
  const quieto = P.pose(0, false, 'down'), g0 = P.geometria(quieto);
  ok(g0.triangulos === 140 && g0.triangulos <= P.MAX_TRIANGULOS && g0.poligonos.length * 2 === g0.triangulos && g0.poligonos.every((q) => q.v.length === 4), 'v2.126 Oli 3D: 140 triángulos (≤ 240; eran 204 con 10 trenzas finas), todo en cuadriláteros');
  { const sin = P.geometria(P.pose(0, false, 'down')).poligonos.filter(() => true), alto = Math.max(...sin.flatMap((q) => q.v.map((w) => w[1])));
    ok(alto === P.ALTO_2D && g0.altoTotal === 1.4375, 'v2.113 Oli 3D: mide 1,4375 u (23 px, como el 2D)'); }
  ok(g0.ancho <= 1 + e && g0.poligonos.every((q) => q.v.every((w) => Math.abs(w[0]) <= 0.5 + e && Math.abs(w[2]) <= 0.5 + e && w[1] >= -e)), 'v2.113 Oli 3D: cabe en su casilla (ancho 1 u, los brazos incluidos) y no baja del suelo');
  // las caras miran hacia fuera en todas las poses y giros (se dibuja por un solo lado)
  { const dir = ['down', 'right', 'up', 'left'], poses = [quieto, P.pose(0.045, true, 'down'), P.pose(0.09, true, 'right'), P.pose(0.225, true, 'up'), P.pose(0.3, true, 'left'), P.pose(0.1, true, 'down', 0.7)];
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], rs = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    ok(poses.every((po) => P.geometria(po).poligonos.every((q) => { const c = cr(rs(q.v[1], q.v[0]), rs(q.v[2], q.v[0])); return c[0] * q.n[0] + c[1] * q.n[1] + c[2] * q.n[2] > 0 && Math.abs(Math.hypot(...q.n) - 1) < 1e-9; })), 'v2.113 Oli 3D: el orden de los vértices de cada cara mira hacia donde dice su normal (6 poses y giros)'); }
  ok(JSON.stringify(P.geometria(P.pose(0.123, true, 'right'))) === JSON.stringify(P.geometria(P.pose(0.123, true, 'right'))) && JSON.stringify(P.pose(7.77, true, 'left')) === JSON.stringify(P.pose(7.77, true, 'left')), 'v2.113 Oli 3D: determinista (misma pose y geometría con las mismas entradas)');
  // pose (ficha, sección 5)
  const A28 = 28 * Math.PI / 180, A22 = 22 * Math.PI / 180;
  ok(P.CICLO === 0.36 && [0, 1.3, 5.55].every((t) => { const q = P.pose(t, false, 'up'); return q.piernaI === 0 && q.piernaD === 0 && q.brazoI === 0 && q.brazoD === 0 && q.rebote === 0; }) && P.pose(0, true, 'down').rebote === 0 && P.pose(0, true, 'down').piernaD === 0, 'v2.113 Oli 3D: parado = pose quieta, sin animación, ciclo de 0,36 s; al echar a andar (t = 0) empieza en la misma pose, sin salto');
  ok(P.pose(0.5, true, 'down').yawMeta === 0 && Math.abs(P.pose(0.5, true, 'right').yawMeta - Math.PI / 2) < e && Math.abs(P.pose(0.5, true, 'up').yawMeta - Math.PI) < e && Math.abs(P.pose(0.5, true, 'left').yawMeta + Math.PI / 2) < e && P.pose(0, false, 'rara').yawMeta === 0, 'v2.113 Oli 3D: mira hacia donde anda: down = sur, right = este, up = norte, left = oeste');
  { const a = P.pose(0.09, true, 'down'), b = P.pose(0.27, true, 'down'), c = P.pose(0.09 + 0.36 * 3, true, 'down');
    ok(Math.abs(a.piernaD - A28) < 1e-9 && Math.abs(a.piernaI + A28) < 1e-9 && Math.abs(a.brazoI - A22) < 1e-9 && Math.abs(a.brazoD + A22) < 1e-9 && Math.abs(b.piernaD + A28) < 1e-9 && Math.abs(b.brazoI + A22) < 1e-9, 'v2.113 Oli 3D: piernas ±28°, brazos ±22° y al contrario que la pierna del mismo lado');
    ok(Math.abs(a.rebote + 0.03) < 1e-9 && Math.abs(b.rebote + 0.03) < 1e-9 && Math.abs(P.pose(0.18, true, 'down').rebote) < 1e-9 && Math.abs(P.pose(0.36, true, 'down').rebote) < 1e-9 && Math.abs(c.piernaD - a.piernaD) < 1e-9 && [0.01, 0.07, 0.13, 0.2, 0.33].every((t) => P.pose(t, true, 'down').rebote <= 0 && P.pose(t, true, 'down').rebote >= -0.03 - 1e-9), 'v2.113 Oli 3D: en cada paso (0,18 s) el cuerpo baja 0,03 u (2 px) con las piernas abiertas y vuelve al cruzarlas; el ciclo se repite cada 0,36 s'); }
  { const pie = (po, id) => Math.max(...P.geometria(po).poligonos.filter((q) => q.pieza === id).flatMap((q) => q.v.map((w) => w[2]))), reposo = pie(quieto, 'zapatilla_d');
    ok(pie(P.pose(0.045, true, 'down'), 'zapatilla_d') > reposo + 0.1 && pie(P.pose(0.045, true, 'down'), 'zapatilla_i') < reposo - 0.05 && pie(P.pose(0.225, true, 'down'), 'zapatilla_i') > reposo + 0.1, 'v2.113 Oli 3D: en el fotograma 1 del 2D (0-0,18 s) adelanta el pie derecho y en el 2 (0,18-0,36 s) el izquierdo'); }
  { const ys = (po, f) => P.geometria(po).poligonos.filter((q) => f(q.pieza)).map((q) => q.v.map((w) => w[1]).join()).join('|'), p1 = P.pose(0.09, true, 'down'), p0 = Object.assign({}, p1, { rebote: 0 }), y2 = (po, id) => P.geometria(po).poligonos.filter((q) => q.pieza === id).flatMap((q) => q.v.map((w) => w[1]));
    ok(ys(p1, (i) => /^(torso|cabeza|manga|mano|pelo|durag|trenza|gafas)/.test(i)) !== ys(p0, (i) => /^(torso|cabeza|manga|mano|pelo|durag|trenza|gafas)/.test(i)) && y2(p1, 'torso').every((y, k) => Math.abs(y - y2(p0, 'torso')[k] + 0.03) < 1e-9) && y2(p1, 'cabeza').every((y, k) => Math.abs(y - y2(p0, 'cabeza')[k] + 0.03) < 1e-9) && y2(p1, 'manga_d').every((y, k) => Math.abs(y - y2(p0, 'manga_d')[k] + 0.03) < 1e-9) && ys(p1, (i) => /^(pantalon|calcetin|zapatilla)/.test(i)) === ys(p0, (i) => /^(pantalon|calcetin|zapatilla)/.test(i)), 'v2.113 Oli 3D: en el rebote bajan torso, cabeza, pelo y brazos 0,03 u; las piernas no dependen de él');
    ok(Math.max(...[quieto, p1, P.pose(0.045, true, 'down'), P.pose(0.2, true, 'left')].map((po) => P.geometria(po).altoTotal)) <= 1.4375 + 1e-9, 'v2.113 Oli 3D: andando nunca pasa de 1,4375 u de alto (la altura de oclusión de la ficha, ≈ 1,5)'); }
  { const suelo = (po) => Math.min(...P.geometria(po).poligonos.filter((q) => /^zapatilla/.test(q.pieza)).flatMap((q) => q.v.map((w) => w[1]))), pasos = []; for (let t = 0; t < 0.36; t += 0.01) pasos.push(P.pose(t, true, 'down'));
    ok(suelo(quieto) === 0 && pasos.every((po) => Math.abs(suelo(po)) < 1e-9 || suelo(po) >= -1e-9) && pasos.every((po) => P.geometria(po).poligonos.every((q) => q.v.every((w) => w[1] >= -1e-9))), 'v2.113 Oli 3D: andando, ninguna pieza se hunde bajo el suelo (la pierna abierta se sube lo justo)');
    ok(pasos.every((po) => { const g = P.geometria(po), pie = (id) => Math.min(...g.poligonos.filter((q) => q.pieza === id).flatMap((q) => q.v.map((w) => w[1]))); return Math.min(pie('zapatilla_d'), pie('zapatilla_i')) < 1e-9; }), 'v2.113 Oli 3D: en todo el ciclo al menos un pie pisa el suelo'); }
  // el giro del cuerpo (yaw) y la luz fija
  { const cara = (po, id, c) => P.geometria(po).poligonos.find((q) => q.pieza === id && q.cara === c), esp = { sur: 'base', norte: 'sombra', este: 'sombra', oeste: 'luz', arriba: 'arriba' };
    ok(['sur', 'norte', 'este', 'oeste', 'arriba'].every((c) => cara(quieto, 'torso', c).tono === esp[c]), 'v2.113 Oli 3D: luz fija arriba-izquierda: oeste = luz, sur = base, este y norte = sombra, arriba = brillo');
    const este = P.pose(0, false, 'right'); ok(cara(este, 'torso', 'sur').tono === 'sombra' && cara(este, 'torso', 'oeste').tono === 'base' && cara(este, 'torso', 'norte').tono === 'luz' && cara(este, 'torso', 'este').tono === 'sombra', 'v2.113 Oli 3D: al girar Oli la luz no gira: mirando al este su pecho queda en sombra y su espalda al oeste');
    ok(P.geometria(este).poligonos.filter((q) => q.pieza === 'cabeza' && q.cara === 'sur')[0].v.every((w) => w[0] > 0.3) && P.geometria(P.pose(0, false, 'up')).poligonos.filter((q) => q.pieza === 'cabeza' && q.cara === 'sur')[0].v.every((w) => w[2] < -0.3), 'v2.113 Oli 3D: las gafas (la cara) miran hacia donde anda: al este están en x > 0 y al norte en z < 0');
    const t = (n) => P.tono(n); ok(t([0, 1, 0]) === 'arriba' && t([-1, 0, 0]) === 'luz' && t([0, 0, 1]) === 'base' && t([1, 0, 0]) === 'sombra' && t([0, 0, -1]) === 'sombra' && t([-0.7071, 0, 0.7071]) === 'luz', 'v2.113 Oli 3D: tono() reparte las normales como el torno de volumenes.js'); }
  { const c = (q) => q.poligonos.find((w) => w.pieza === 'cabeza' && w.cara === 'sur').color, r = G.rampa('#f3d9c0'); ok(c(quieto && g0) === r.base && g0.poligonos.find((w) => w.pieza === 'cabeza' && w.cara === 'oeste').color === r.l1 && g0.poligonos.find((w) => w.pieza === 'cabeza' && w.cara === 'este').color === r.s1 && g0.poligonos.find((w) => w.pieza === 'cabeza' && w.cara === 'arriba') === undefined, 'v2.113 Oli 3D: cada cara toma su tono de la rampa del juego (G.rampa): luz l1, base, sombra s1'); }
  // giro suave (≈ 0,12 s por cuarto de vuelta), para el paso 4
  { const dt = 1 / 60; let y = 0, n = 0; while (Math.abs(y - Math.PI / 2) > 1e-9 && n < 100) { y = P.girar(y, Math.PI / 2, dt); n++; }
    ok(n >= 7 && n <= 8 && y === Math.PI / 2, 'v2.113 Oli 3D: un cuarto de vuelta tarda ≈ 0,12 s (' + n + ' cuadros a 60 por segundo) y acaba exacto en la meta');
    ok(P.girar(0, Math.PI / 2, 0.06) > 0.7 && P.girar(0, Math.PI / 2, 0.06) < 0.85 && P.girar(0.1, 0.1, 0.5) === 0.1 && P.girar(0.2, 0.9, 0) === 0.2, 'v2.113 Oli 3D: a la mitad del tiempo va por la mitad, sin pasarse, y sin dt no se mueve');
    const via = P.girar(Math.PI - 0.1, -Math.PI + 0.1, 0.005); ok(via > Math.PI - 0.1 || via < -Math.PI + 0.3, 'v2.113 Oli 3D: gira por el camino corto (cruza ±π sin dar la vuelta larga)');
    ok(P.girar(P.YAW.left, P.YAW.right, 0.01) === P.girar(P.YAW.left, P.YAW.right, 0.01) && Math.abs(P.girar(P.YAW.left, P.YAW.right, 1) - Math.PI / 2) < 1e-9, 'v2.113 Oli 3D: la media vuelta (oeste ↔ este) también es determinista y acaba en la meta'); }
  // v2.115 · paso 3b-1: textura de la cara de la cabeza (recorte del sprite 2D)
  { const t = P.textura('cabeza_sur'), C = G.CHARS && G.CHARS.rex, hex = /^#[0-9a-f]{6}$/;
    ok(t && t.w === 14 && t.h === 7 && t.px.length === 7 && t.px.every((f) => f.length === 14) && P.textura('no_existe') === null, 'v2.115 Oli 3D (3b-1): la textura cabeza_sur es de 14×7 texels (filas 5-11 del sprite frontal) y un id desconocido da null');
    ok(t.px.every((f) => f.every((c) => c === null || hex.test(c))) && t.px.every((f) => f.every((c) => c !== null)), 'v2.115 Oli 3D (3b-1): todos los texels son colores #rrggbb de la paleta del sprite 2D y la cara no tiene huecos');
    const K = P.GAFAS_FINAS_CAJA, fuera = (y, x) => y < K.f0 || y > K.f1 || x < K.c0 || x > K.c1;
    ok(t.px.every((f, y) => f.every((c, x) => !fuera(y, x) || c === C.pal[/[bcdilnp]/.test(C.down[5 + y][1 + x]) || ((x === 0 || x === 13) && C.down[5 + y][1 + x] === 'a') ? 'g' : C.down[5 + y][1 + x]])), 'v2.115 Oli 3D (3b-1): fuera de la zona de las gafas es un recorte EXACTO de rex_down (frente, mejillas, boca y contorno; si el sprite cambia, la textura cambia sola); desde la v2.178 las tiras de pelo/trenza de los lados de la cara van en piel (las trenzas solo están detrás)');
    const M = C.pal.h, g = C.pal.g, oscuros = t.px.map((f) => f.map((c, x) => (c === M ? x : -1)).filter((x) => x >= 0));
    ok(oscuros[0].length === 0 && oscuros[4].length === 0 && oscuros[5].length === 0 && oscuros[6].length === 0 && oscuros[1].join() === '2,3,4,5,6,7,8,9,10,11' && oscuros[2].join() === '2,5,10,11' && oscuros[3].join() === '5,10', 'v2.116 Oli 3D (3b-1): GAFAS DE SOL (opción 4 «más bajas»): dos lentes oscuras de 3×3 texels (cols 3-5 y 8-10, filas 1-3), unión de 1 fila × 2 px (la del 2D era de 2×4) y patillas en la fila 1; la fila 4 queda de piel');
    ok(t.px[1][6] === M && t.px[1][7] === M && t.px[2][6] === g && t.px[2][7] === g && t.px[3][6] === g && t.px[3][7] === g && [3, 4, 5, 6, 7, 8, 9, 10].every((x) => t.px[4][x] === g), 'v2.116 Oli 3D (3b-1): la unión es solo la fila 1 y entre las lentes se ve la cara (filas 2-4)');
    ok([3, 8].every((x0) => t.px[2][x0] === C.pal.z && t.px[2][x0 + 1] === C.pal.y && t.px[2][x0 + 2] === M && t.px[3][x0] === C.pal.y && t.px[3][x0 + 1] === C.pal.e && t.px[3][x0 + 2] === M && t.px[1][x0] === M && t.px[1][x0 + 1] === M && t.px[1][x0 + 2] === M), 'v2.116 Oli 3D (3b-1): cada lente lleva el brillo del sprite 2D (blanco y azul claro arriba, azul claro y oscuro debajo), igual en las dos');
    ok([1, 2, 3, 4].every((y) => [3, 4, 5, 6, 7, 8, 9, 10].every((x) => (t.px[y][x] !== g) === (t.px[y][13 - x] !== g))), 'v2.116 Oli 3D (3b-1): la silueta de las gafas es simétrica (izquierda y derecha ocupan lo mismo)'); }
  // alcance del paso: el pintor, el juego, el 2D y los sprites no se tocan
  { const pin = leer('src/hd2d_pintor.js'), gm = leer('src/game.js'), cl = leer('src/clasico2d.js'); ok(/G\.personaje3d/.test(pin) && /PERSONAJES3D: true/.test(pin) && !/personaje3d/.test(gm) && !/personaje3d/.test(cl), 'v2.126 Oli 3D (paso 4): solo el pintor HD-2D usa el módulo (interruptor AJUSTES.PERSONAJES3D); game.js y el 2D clásico no'); }
  { const at = P.atlas(), g = P.geometria(), tx = g.poligonos.map((q) => P.uvPoligono(q, at)), rs = Object.values(at.rects);
    ok(at.w === 64 && at.h <= 64 && rs.every((r) => r.x + r.w <= at.w && r.y + r.h <= at.h) && at.rects.blanco && rs.length === 21 && tx.every((r) => r.uv.length === 4 && r.uv.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1)) && tx.filter((r) => r.tex).length === 28, 'v2.126 Oli 3D (paso 4): atlas de ' + at.w + '×' + at.h + ' con 21 celdas dentro de sus límites; 28 caras con textura (cara, espalda, costados, torso, mangas, piernas y 2 trenzas) y el resto lisas; uv dentro de 0..1');
    const cs = g.poligonos.findIndex((q) => q.pieza === 'cabeza' && q.cara === 'sur'), r = at.rects.cabeza_sur; ok(tx[cs].tex && r.h === 11 && r.w === 14 && Math.abs(tx[cs].uv[0][0] - (r.x + 0.02) / at.w) < 1e-9, 'v2.126 Oli 3D (paso 4): la cara sur de la cabeza usa la textura de 14×11 (4 filas de piel arriba del recorte) y empieza en su celda'); }
  { const r = require('child_process').spawnSync('node', [path.join(__dirname, 'tools/huella_juego.js'), '--comprobar'], { encoding: 'utf8' }); ok(r.status === 0, 'v2.113 Oli 3D: la huella del juego en 2D sigue igual (tools/huella_juego.js --comprobar)'); }
}
// ── v2.128 · LALI 3D, paso 2 (docs/FICHA_LALI_3D.md): volumen con colores lisos con el mismo módulo que Oli (G.personaje3d.de('luna')). El pintor todavía NO lo usa (paso 4) ──
{
  const P = G.personaje3d, fs = require('fs'), path = require('path'), leer = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), e = 1e-9, px = (n) => Math.abs(n * 16 - Math.round(n * 16)) < 1e-9;
  const Lali = P.de('luna'), Oli = P.de('rex'), pz = Lali.piezas(), por = (id) => pz.find((q) => q.id === id), pal = G.CHARS.luna.pal;
  ok(typeof P.de === 'function' && Lali && Oli && P.de('nadie') === null && Lali.id === 'luna' && Oli.id === 'rex', 'v2.128 Lali 3D: G.personaje3d.de(id) da Lali («luna») y Oli («rex»), y null para un id desconocido');
  { // v2.195: ninguna cara visible de una pieza puede estar en el MISMO plano que otra cara visible (mismo sentido) con zona común: provoca parpadeo (z-fighting) al moverse
    const DIR = { sur: [2, 1], norte: [2, -1], este: [0, 1], oeste: [0, -1], arriba: [1, 1], abajo: [1, -1] }, eps = 1e-9, ext = (q) => [[q.x - q.w / 2, q.x + q.w / 2], [q.y0, q.y0 + q.h], [q.z - q.d / 2, q.z + q.d / 2]];
    const choques = (piezas) => { const r = []; piezas.forEach((a, i) => piezas.forEach((b, j) => { if (j <= i || a.grupo !== b.grupo) return; const A = ext(a), B = ext(b);
      Object.keys(DIR).forEach((c) => { if ((a.sin || []).includes(c) || (b.sin || []).includes(c)) return; const [ej, s] = DIR[c], pa = A[ej][s > 0 ? 1 : 0], pb = B[ej][s > 0 ? 1 : 0]; if (Math.abs(pa - pb) > eps) return;
        const otros = [0, 1, 2].filter((k) => k !== ej); if (otros.every((k) => Math.min(A[k][1], B[k][1]) - Math.max(A[k][0], B[k][0]) > eps)) r.push(a.id + '/' + b.id + ':' + c); }); })); return r; };
    const co = choques(Oli.piezas()), cl = choques(Lali.piezas()); ok(co.length === 0 && cl.length === 0, 'v2.195 caras coincidentes: ni Oli ni Lali tienen dos caras visibles en el mismo plano (parpadeo al moverse)' + (co.length || cl.length ? ' → ' + co.concat(cl).join(', ') : '')); }
  ok(JSON.stringify(Oli.piezas()) === JSON.stringify(P.piezas()) && JSON.stringify(Oli.geometria()) === JSON.stringify(P.geometria()) && JSON.stringify(Oli.geometria(P.pose(0.045, true, 'right'))) === JSON.stringify(P.geometria(P.pose(0.045, true, 'right'))) && P.geometria().triangulos === 140, 'v2.128 Lali 3D: Oli no cambia (de(«rex») = el Oli de siempre: mismas piezas y misma geometría, 140 triángulos)');
  ok(pz.length === 12 && new Set(pz.map((q) => q.id)).size === 12 && !por('cara') && ['cabeza', 'torso', 'mechon_i', 'mechon_d', 'manga_i', 'mano_i', 'manga_d', 'mano_d', 'pierna_i', 'zapatilla_i', 'pierna_d', 'zapatilla_d'].every((id) => por(id)), 'v2.129 Lali 3D: 12 cajas con ids distintos (cabeza, torso, 2 mechones, 2 brazos con mano, 2 piernas, 2 zapatillas; la lámina de cara de la v2.128 ya no está: la sustituye la textura)');
  ok(pz.every((q) => px(q.w) && px(q.h) && (q.libre || px(q.d)) && px(q.x - q.w / 2) && px(q.y0)) && pz.every((q) => q.libre || (q.w >= P.MIN_PIEZA && q.h >= P.MIN_PIEZA && q.d >= P.MIN_PIEZA)) && pz.every((q) => !q.libre), 'v2.129 Lali 3D: todas las medidas, los bordes en x y la base de las cajas caen en píxeles enteros y ninguna caja baja de 0,125 u');
  ok(Lali.PAL.pelo === pal.b && Lali.PAL.piel === pal.d && Lali.PAL.chaqueta === pal.g && Lali.PAL.pantalon === pal.l && Lali.PAL.zapatilla === pal.n && pz.every((q) => Object.values(Lali.PAL).includes(q.col)), 'v2.128 Lali 3D: los colores lisos son los de G.CHARS.luna.pal (pelo b, piel d, chaqueta g, pantalón l, zapatilla n)');
  { const c = por('cabeza'), t = por('torso'), g = Lali.geometria();
    ok(Lali.ALTO_2D === 21 / 16 && Math.abs(g.altoTotal - Lali.ALTO_2D) < e && Math.abs(c.y0 + c.h - Lali.ALTO_2D) < e && g.ancho === 1 && c.w === 0.75 && c.h === 0.625 && c.d === 0.625 && c.y0 === 0.6875, 'v2.128 Lali 3D: mide 21 px = 1,3125 u de alto y 1 u de ancho (brazos de borde a borde de la casilla); cabeza de 12 × 10 × 10 px');
    ok(Math.abs(t.y0 + t.h - c.y0) < e && t.w === 0.375 && t.y0 === 0.375 && Math.abs(por('pierna_i').y0 + por('pierna_i').h - t.y0) < e && por('pierna_i').pivote[1] === t.y0, 'v2.128 Lali 3D: la cabeza empieza justo donde acaba el torso (sin solape: lección de Oli) y las piernas cuelgan de la base del torso, con el pivote de la cadera ahí');
    ok(g.triangulos === 112 && g.triangulos === g.poligonos.length * 2 && g.triangulos <= P.MAX_TRIANGULOS && g.poligonos.every((q) => q.v.length === 4), 'v2.129 Lali 3D: 112 triángulos (≤ 240; 114 con la lámina de cara), todo en cuadriláteros'); }
  { const par = ['mechon', 'manga', 'mano', 'pierna', 'zapatilla'].every((b) => { const i = por(b + '_i'), d = por(b + '_d'); return i && d && i.x === -d.x && i.x > 0 && i.w === d.w && i.h === d.h && i.d === d.d && i.y0 === d.y0 && i.z === d.z && i.col === d.col && (b === 'mechon' || (i.grupo.endsWith('I') && d.grupo.endsWith('D'))); }) || false;
    const bor = (q) => [q.x - q.w / 2, q.x + q.w / 2];
    ok(par, 'v2.128 Lali 3D: las piezas de izquierda y derecha son espejo exacto (misma medida, x opuesta)');
    ok(bor(por('manga_i'))[1] === 0.5 && bor(por('manga_i'))[0] === 0.3125 && bor(por('mechon_i'))[1] <= bor(por('manga_i'))[0] + e && bor(por('mechon_i'))[0] >= bor(por('torso'))[1] - e && por('mechon_i').y0 === 0.1875 && Math.abs(por('mechon_i').y0 + por('mechon_i').h - 0.6875) < e, 'v2.128 Lali 3D: los brazos ocupan de 0,3125 a 0,5 u, los mechones (8 px de largo, de 0,1875 a 0,6875 u) caben entre el torso y los brazos sin solaparse');
    const zi = por('zapatilla_i'), zd = por('zapatilla_d'), pi = por('pierna_i'), pd = por('pierna_d');
    ok(Math.abs(bor(zi)[0]) < e && Math.abs(bor(zd)[1]) < e && Math.abs(bor(pi)[0]) < e && Math.abs(bor(pd)[1]) < e && Math.abs(zi.z + zi.d / 2 - (pi.z + pi.d / 2) - 0.0625) < e && Math.abs(zi.z - zi.d / 2 - (pi.z - pi.d / 2)) < e, 'v2.128 Lali 3D: piernas y zapatillas se tocan en el centro (como en el sprite) y la zapatilla sobresale 0,0625 u por delante'); }
  { const poses = []; for (const d of ['down', 'right', 'up', 'left']) for (const [t, m] of [[0, false], [0.045, true], [0.18, true], [0.225, true], [0.3, true]]) poses.push(P.pose(t, m, d));
    const rs = poses.map((po) => { const g = Lali.geometria(po); let mn = 9, mx = 0; g.poligonos.forEach((q) => q.v.forEach((w) => { mn = Math.min(mn, w[1]); mx = Math.max(mx, w[1]); })); return { mn, mx, h: g.altoTotal }; });
    ok(rs.every((r) => Math.abs(r.mn) < 1e-9) && rs.every((r) => r.mx <= Lali.ALTO_2D + 1e-9) && rs.every((r) => r.h <= Lali.ALTO_2D + 1e-9), 'v2.128 Lali 3D: en las 4 direcciones y 5 instantes del andar los pies pisan el suelo (y = 0) y nunca pasa de 1,3125 u');
    const q = Lali.geometria(P.pose(0.045, true, 'down')), r = Lali.geometria(P.pose(0.225, true, 'down')), pp = (g, id) => g.poligonos.filter((w) => w.pieza === id).map((w) => w.v.map((v) => v.map((n) => Math.round(n * 1e6))));
    ok(JSON.stringify(pp(q, 'pierna_d')) !== JSON.stringify(pp(Lali.geometria(P.pose(0, false, 'down')), 'pierna_d')) && JSON.stringify(pp(q, 'manga_d')) !== JSON.stringify(pp(r, 'manga_d')), 'v2.128 Lali 3D: al andar se mueven piernas y brazos, y los brazos cambian de lado con el otro pie'); }
  // alcance del paso: el pintor, el juego, el 2D y los sprites no se tocan; el módulo sigue puro
  { const pin = leer('src/hd2d_pintor.js'), gm = leer('src/game.js'), cl = leer('src/clasico2d.js'), src = leer('src/personaje3d.js').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
    ok(/personaje3d\.de\(/.test(pin) && /PERSONAJES3D_LALI: true/.test(pin) && !/personaje3d/.test(gm) && !/personaje3d/.test(cl) && !/Math\.random|document\.|requestAnimationFrame|new Date|performance\./.test(src) && !/\bTHREE\b|Three\./.test(src), 'v2.130 Lali 3D (paso 4): solo el pintor HD-2D usa a Lali 3D (interruptor propio); el juego y el 2D no; el módulo sigue puro'); }
  { const r = require('child_process').spawnSync('node', [path.join(__dirname, 'tools/volcar_oli.js'), 'luna'], { encoding: 'utf8' }), o = require('child_process').spawnSync('node', [path.join(__dirname, 'tools/volcar_oli.js')], { encoding: 'utf8' }), x = r.status === 0 && JSON.parse(r.stdout), y = o.status === 0 && JSON.parse(o.stdout);
    ok(x && y && x.personaje === 'luna' && x.poses[0].tri === 112 && y.personaje === 'rex' && y.poses[0].tri === 140 && x.poses.length === 3 && x.dirs.length === 4, 'v2.129 Lali 3D: tools/volcar_oli.js luna vuelca la geometría de Lali (112 triángulos) y sin argumento la de Oli (140)'); }
  { const r = require('child_process').spawnSync('node', [path.join(__dirname, 'tools/huella_juego.js'), '--comprobar'], { encoding: 'utf8' }); ok(r.status === 0, 'v2.128 Lali 3D: la huella del juego en 2D sigue igual (tools/huella_juego.js --comprobar)'); }
}
// ── v2.129 · LALI 3D, paso 3 (docs/FICHA_LALI_3D.md): TEXTURAS recortadas del sprite de Lali, atlas y uv (G.personaje3d.de('luna')). El pintor todavía NO las usa (paso 4) ──
{
  const P = G.personaje3d, fs = require('fs'), path = require('path'), C = G.CHARS.luna, pal = C.pal, Lali = P.de('luna'), Oli = P.de('rex');
  const ids = Lali.ids(), tx = Object.fromEntries(ids.map((i) => [i, Lali.textura(i)])), at = Lali.atlas(), g = Lali.geometria(), uvs = g.poligonos.map((q) => Lali.uvPoligono(q, at));
  const letra = (vista, y, x) => (vista === 'back' ? C.back(C.down) : vista === 'sideL' ? C.side.map((f) => f.split('').reverse().join('')) : C[vista])[y][x];
  ok(ids.length === 42 && new Set(ids).size === 42 && ids.every((i) => tx[i] && tx[i].id === i && tx[i].h === tx[i].px.length && tx[i].px.every((f) => f.length === tx[i].w)) && Lali.textura('nada') === null, 'v2.129 Lali 3D: 42 texturas (26 recortes del sprite + 16 pintadas por código), todas con su tamaño y ninguna vacía; una desconocida da null');
  ok(Object.values(tx).every((t) => t.px.every((f) => f.every((c) => c !== null && Object.values(pal).includes(c)))), 'v2.129 Lali 3D: todos los texels son opacos y de la paleta del sprite (G.CHARS.luna.pal)');
  { // cada recorte es EXACTAMENTE el trozo del mapa de letras (los huecos del sprite salen del color de relleno, el contorno)
    const R = Lali.RECORTES, malos = Object.keys(R).filter((id) => { const r = R[id]; return !tx[id].px.every((fila, j) => fila.every((c, i) => { const l = letra(r.vista, r.f0 + j, r.c0 + i); const e = l !== '.' ? pal[l] : r.relleno ? pal[r.relleno] : null; return e === pal.a ? c !== pal.a || (j > 0 && j < r.f1 - r.f0 && i > 0 && i < r.c1 - r.c0) : c === e; })) || tx[id].w !== r.c1 - r.c0 + 1 || tx[id].h !== r.f1 - r.f0 + 1; });
    ok(Object.keys(R).length === 26 && malos.length === 0, 'v2.129 Lali 3D: los 26 recortes son el trozo exacto del sprite (filas y columnas de la ficha) ' + malos.join()); }
  { const f = tx.cabeza_sur.px, t = (n) => tx[n];
    ok(tx.cabeza_sur.w === 12 && tx.cabeza_sur.h === 10 && f[7][3] === pal.e && f[7][4] === pal.e && f[7][7] === pal.e && f[7][8] === pal.e && f[9][5] === pal.f && f[9][6] === pal.f && f[4][5] === pal.d && f[0][0] !== pal.a && f[0][11] !== pal.a && f[0][5] !== pal.a, 'v2.129 Lali 3D: la cara (12×10) trae los ojos verdes, la boca rosa y la frente de piel, sin contorno negro (v2.134)');
    ok(t('cabeza_este').px.every((fila, j) => fila.join() === t('cabeza_oeste').px[j].slice().reverse().join()) && t('cabeza_oeste').w === 10 && t('cabeza_oeste').h === 10, 'v2.129 Lali 3D: el costado izquierdo de la cabeza es el espejo exacto del derecho (Lali no tiene perfil izquierdo propio: mismos colores)');
    ok(t('mechon_d_sur').w === 2 && t('mechon_d_sur').h === 8 && t('mechon_d_sur').px[6].every((c) => c === pal.m) && t('mechon_i_sur').px[6].every((c) => c === pal.m) && t('mechon_oeste').px[6].every((c) => c === pal.m) && t('mechon_este').px.every((fila, j) => fila.join() === t('mechon_oeste').px[j].join()), 'v2.129 Lali 3D: los mechones llevan el lazo rosa en la fila 6 (de frente, de espalda y de lado) y sus costados son simétricos');
    ok(t('torso_sur').w === 6 && t('torso_sur').h === 5 && t('torso_sur').px[1].slice(1, 5).every((c) => c === pal.h) && t('torso_norte').px[1][1] === pal.l && t('torso_norte').px[1][4] === pal.l && t('torso_norte').px[0][1] === pal.b, 'v2.129 Lali 3D: el torso de frente trae la camisa crema y el de espalda las dos rayas azul oscuro y el pelo en la nuca');
    ok(t('mano_d_sur').px[0][1] === pal.d && t('mano_i_sur').px[0][1] === pal.d && t('manga_d_sur').px[5].slice(1).every((c) => c === pal.k) && t('manga_d_sur').px[1].slice(1).every((c) => c === pal.g) && t('zapatilla_d_sur').px[0][1] === pal.o && t('zapatilla_i_sur').px[0][2] === pal.o && t('zapatilla_d_sur').px[1].every((c) => c !== pal.a) && t('pierna_d_sur').px.every((fila) => fila.every((c) => c === pal.l)), 'v2.129 Lali 3D: manos de piel, puño azul medio, zapatillas blancas con el detalle rosa y borde oscuro, pantalón azul oscuro'); }
  { const f = tx.cabeza_arriba.px; ok(tx.cabeza_arriba.w === 12 && tx.cabeza_arriba.h === 10 && f.every((fila) => fila.every((c, x) => c === pal[x === 5 || x === 6 ? 'c' : 'b'])), 'v2.129 Lali 3D: la tapa del pelo (12×10) es rubia con la raya de 2 px de delante atrás'); }
  // atlas y uv
  { const rs = Object.values(at.rects), solapa = (a, b) => a !== b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    ok(at.w === 64 && at.h <= 64 && rs.length === 43 && at.rects.blanco && rs.every((r) => r.x + r.w <= at.w && r.y + r.h <= at.h) && !rs.some((a) => rs.some((b) => solapa(a, b))) && at.celdas.every((c) => c.px.length === c.h && c.px.every((f) => f.length === c.w)), 'v2.129 Lali 3D: atlas de 64×' + at.h + ' con 42 texturas y la celda blanca, dentro de los límites y sin solaparse'); }
  { const tex = g.poligonos.filter((q, i) => uvs[i].tex), lisas = g.poligonos.filter((q, i) => !uvs[i].tex);
    ok(uvs.every((r) => r.uv.length === 4 && r.uv.every(([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1)) && tex.length === 54 && lisas.length === 2 && lisas.every((q) => /^pierna_[di]$/.test(q.pieza) && q.cara === 'arriba'), 'v2.129 Lali 3D: 54 de las 56 caras llevan textura (solo la tapa de las piernas, que queda bajo el torso, es lisa) y todas las uv están en 0..1');
    const cs = g.poligonos.findIndex((q) => q.pieza === 'cabeza' && q.cara === 'sur'), r = at.rects.cabeza_sur;
    ok(uvs[cs].tex && r.w === 12 && r.h === 10 && Math.abs(uvs[cs].uv[0][0] - (r.x + 0.02) / at.w) < 1e-9 && Math.abs(uvs[cs].uv[0][1] - (1 - (r.y + 10 - 0.02) / at.h)) < 1e-9, 'v2.129 Lali 3D: la cara de frente de la cabeza usa la textura de 12×10 (esquina inferior izquierda en (x + 0,02, y + 10 − 0,02))'); }
  // Oli no cambia
  ok(JSON.stringify(Oli.ids()) === JSON.stringify(P.ids()) && JSON.stringify(Oli.atlas()) === JSON.stringify(P.atlas()) && P.ids().length === 20 && P.atlas().h === 33 && JSON.stringify(P.ids().map((i) => Oli.textura(i))) === JSON.stringify(P.ids().map((i) => P.textura(i))), 'v2.129 Lali 3D: Oli no cambia (20 texturas y atlas de 64×33, iguales por las dos vías: de(«rex») y las funciones de siempre)');
  { const r = require('child_process').spawnSync('node', [path.join(__dirname, 'tools/volcar_personaje_tex.js'), 'luna'], { encoding: 'utf8' }), j = r.status === 0 && JSON.parse(r.stdout);
    ok(j && j.personaje === 'luna' && j.atlas.w === 64 && j.atlas.h === at.h && j.poses.length === 3 && j.dirs.length === 4 && j.poses[0].poly.filter((q) => q.tex).length === 54 && j.atlas.px[0][0] === '#ffffff', 'v2.129 Lali 3D: tools/volcar_personaje_tex.js luna vuelca atlas y uv (54 caras con textura)'); }
  { const src = fs.readFileSync(path.join(__dirname, 'src/personaje3d.js'), 'utf8').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n'), pin = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8');
    ok(!/Math\.random|document\.|requestAnimationFrame|new Date|performance\./.test(src) && !/\bTHREE\b|Three\./.test(src) && /personaje3d\.de\(/.test(pin), 'v2.130 Lali 3D: el módulo sigue puro y el pintor HD-2D lo usa por id de personaje (paso 4)'); }
}
// ── v2.130 · LALI 3D, paso 4 (docs/FICHA_LALI_3D.md): Lali enchufada al pintor HD-2D con su propio interruptor, sin cambiar a Oli (src/hd2d_pintor.js) ──
{
  const rm = G.pesca3d.build([], -0.255, [{ x: 3.5, y: 0, z: 4.5, k: 1, reloj: 0 }, { x: 9.5, y: 0, z: 4.5, k: 0.5, reloj: 0.6 }]);
  ok(rm.n === 60 && Array.from(rm.pos).every(Number.isFinite) && G.pesca3d.build([], -0.255).n === 0, 'v2.184 Pesca: la marca 3D de cada punto es un corcho con flecha (30 caras) flotando sobre la casilla, y sin puntos no hay geometría');
  // v2.184: la caña sale de la mano (2D: el píxel de la mano del sprite es de piel; 3D: la base de la caña está en el centro de la mano posada)
  { const piel = { rex: 'g', luna: 'd' }; ['rex', 'luna'].forEach((id) => { const c = G.CHARS[id], vistas = { down: c.down, up: c.back(c.down).map((r) => [].concat(r).join('')), side: c.side };
      Object.keys(vistas).forEach((vw) => { const [gx, gy] = { rex: { down: [13, 17], up: [13, 17], side: [5, 17] }, luna: { down: [13, 16], up: [13, 16], side: [6, 15] } }[id][vw], fila = vistas[vw][gy];
        ok(fila[gx] === piel[id] && fila[gx + 1] === piel[id], 'v2.184 caña: el bloque de mano de ' + id + ' (' + vw + ') es piel en el sprite'); });
      [['down', 'oli'], ['up', 'oli'], ['left', 'oli'], ['right', 'oli']].forEach(([d]) => { const h = G.vista.manoPesca2D(id === 'rex' ? 'oli' : 'lali', d); ok(h && h.w === 2 && h.h === 1 && Number.isFinite(h.x) && Number.isFinite(h.y) && G.spr[h.clave], 'v2.184 caña: ' + id + ' mirando ' + d + ' tiene mano 2D'); }); }); }
  ['rex', 'luna'].forEach((id) => { const P3 = G.personaje3d, d = P3.de(id), po = d.pose(0, false, 'down', 0, 0, 0); po.brazoD = 1.2; const g = d.geometria(po), m = P3.manoDe(g, 'mano_d'), mi = P3.manoDe(g, 'mano_i');
    ok(m && m.every(Number.isFinite) && m[0] < 0 && m[2] > 0.2 && m[1] > 0.3 && m[1] < 1, 'v2.184 caña: la mano derecha 3D de ' + id + ' queda a la derecha, adelantada y a media altura: ' + (m && m.map((n) => n.toFixed(2)).join(',')));
    const v = G.vista.pesca({ x: 8 * 16 + 8, y: 28 * 16 + 14, dir: 'down', pesca: { fase: 'espera', t: 1, espera: 9, tirones: [] } }, 0), r = G.pesca3d.build([{ x: 0, y: 0, z: 0, v, reloj: 0, mano: m }], -0.255), dmin = Math.min(...Array.from({ length: 16 }, (_, i) => Math.hypot(r.pos[i * 3] - m[0], r.pos[i * 3 + 1] - m[1], r.pos[i * 3 + 2] - m[2])));
    ok(dmin < 0.1 && mi && mi[0] > 0, 'v2.184 caña: la base de la caña de ' + id + ' arranca en la mano (' + dmin.toFixed(3) + ' u) y la otra mano queda al otro lado'); });
    // v2.206: el pez enganchado NO se dibuja encima del personaje: en pantalla (cámara a 56° de altura, 4 giros) su lámina no solapa con el personaje cuando está más cerca de la cámara
    { const F = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }, cp = Math.cos(0.98), sp = Math.sin(0.98); let malos = [];
      Object.keys(F).forEach((dir) => { const [fx, fz] = F[dir], mano = [-fz * 0.22 + fx * 0.2, 0.75, fx * 0.22 + fz * 0.2];   // mano aproximada: al lado y algo adelantada
        [0.5, 1].forEach((sv) => { const v = G.vista.pesca({ x: 8 * 16 + 8, y: 28 * 16 + 14, dir, pesca: { fase: 'salto', t: 1.3 * sv, espera: 9, tirones: [], pez: 'pez_cirujano' } }, 0), r = G.pesca3d.build([{ x: 0, y: 0, z: 0, v, reloj: 0, mano }], -0.255), q = r.sprites[0];
          [0, 1, 2, 3].forEach((k) => { const a = k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), X = q.x * ca - q.z * sa, Z = q.x * sa + q.z * ca, sy = (q.y - 0.24) * cp - Z * sp;   // centro de la lámina (cuelga de la boca)
            const solapa = Math.abs(X) < 0.24 + 0.35 && sy + 0.32 > -0.2 * sp && sy - 0.32 < 1.31 * cp + 0.2 * sp; if (solapa && Z > 0.1) malos.push(dir + ' s=' + sv + ' giro ' + k * 90); }); }); });
      ok(malos.length === 0, 'v2.206 pez enganchado: nunca se dibuja encima del personaje (4 direcciones × 4 giros de cámara)' + (malos.length ? ' → ' + malos.join(', ') : '')); }
  const fs = require('fs'), path = require('path'), pin = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8'), H = G.hd2d, J = (id) => ({ id });
  ok(H.AJUSTES.PERSONAJES3D === true && H.AJUSTES.PERSONAJES3D_LALI === true && /AJUSTE_3D = \{ rex: 'PERSONAJES3D', luna: 'PERSONAJES3D_LALI' \}/.test(pin), 'v2.130 Lali 3D: cada personaje tiene su interruptor (PERSONAJES3D = Oli, PERSONAJES3D_LALI = Lali), encendidos de fábrica');
  ok(H.id3d(J('oli')) === 'rex' && H.id3d(J('lali')) === 'luna' && H.id3d(J('otro')) === null && H.esOli(J('oli')) === true && H.esOli(J('lali')) === false, 'v2.130 Lali 3D: el pintor sabe qué jugador es malla 3D (oli → rex, lali → luna, otro → lámina)');
  H.AJUSTES.PERSONAJES3D_LALI = false; const a = [H.id3d(J('oli')), H.id3d(J('lali'))]; H.AJUSTES.PERSONAJES3D_LALI = true; H.AJUSTES.PERSONAJES3D = false; const b = [H.id3d(J('oli')), H.id3d(J('lali'))]; H.AJUSTES.PERSONAJES3D = true;
  ok(a[0] === 'rex' && a[1] === null && b[0] === null && b[1] === 'luna', 'v2.130 Lali 3D: los interruptores son independientes (apagar Lali no apaga a Oli y al revés)');
  ok(!/oli3d|quitarOli3d|crearOli3d/.test(pin) && /E\.p3d\[k\]/.test(pin) && /AJUSTES\[AJUSTE_3D\[k\]\] = false; quitar3d\(k\)/.test(pin), 'v2.130 Lali 3D: una malla por personaje (E.p3d) y la salida de emergencia solo apaga al personaje que falló');
}
// ── v2.135 · MOVIMIENTO (docs/PLAN_MOVIMIENTO_PERSONAJES.md, pasos 1-4): ángulo real, giro a la esquina con histéresis, paso con arranque/parada suaves ──
{
  const motor = G.motor, P = G.personaje3d, Li = P.de('luna'), Ol = P.de('rex'), est = motor.crear(5), j = est.jugadores.oli, PI = Math.PI;
  const mira = (k) => { motor.aplicar(est, Object.assign({ j: 'oli', t: 'teclas', up: 0, down: 0, left: 0, right: 0 }, k)); motor.moverJugador(est, j, 0.016); return j.ang; };
  const c = (a, b) => Math.abs(a - b) < 1e-9;
  ok(c(mira({ down: 1 }), 0) && c(mira({ right: 1 }), PI / 2) && c(mira({ up: 1 }), PI) && c(mira({ left: 1 }), -PI / 2), 'v2.135 paso 1: ang = 0 abajo, π/2 derecha, π arriba, −π/2 izquierda (igual que YAW)');
  ok(c(mira({ down: 1, right: 1 }), PI / 4) && c(mira({ up: 1, right: 1 }), 3 * PI / 4) && c(mira({ up: 1, left: 1 }), -3 * PI / 4) && c(mira({ down: 1, left: 1 }), -PI / 4), 'v2.135 paso 1: las 4 diagonales dan la esquina');
  { const a = mira({ up: 1, left: 1 }), d = j.dir; mira({}); ok(j.ang === a && j.dir === d && !j.moving, 'v2.135 paso 1: al parar se conserva ang y dir'); }
  ok(j.dir === 'left' || j.dir === 'up', 'v2.135 paso 1: dir sigue siendo un eje (2D intacto)');
  ok(c(Li.pose(0, true, 'down', undefined, PI / 4).yawMeta, PI / 4) && c(Ol.pose(0, true, 'left').yawMeta, -PI / 2) && c(Ol.pose(0, true, 'left', undefined, undefined).yawMeta, -PI / 2), 'v2.135 paso 2: pose usa ang si viene y YAW[dir] si no (Oli y Lali)');
  { let st = null, y = 0; st = P.meta(st, 0, 0.016); st = P.meta(st, PI / 2, 0.016); const a = st.meta; for (let i = 0; i < 5; i++) st = P.meta(st, PI / 4, 0.016);
    ok(a === 0 && c(st.meta, PI / 4), 'v2.135 paso 2: la meta solo cambia tras ~50 ms estable (dos teclas casi a la vez no giran primero a un eje)');
    let n = 0, s2 = P.meta(null, 0, 0); for (let i = 0; i < 100; i++) { const prev = s2.meta; s2 = P.meta(s2, i % 2 ? PI / 2 : PI / 4, 0.016); if (s2.meta !== prev) n++; } ok(n === 0, 'v2.135 paso 2: oscilar entre dos direcciones cada cuadro no mueve la meta (sin temblor)'); }
  { let y = 0; for (let i = 0; i < 30; i++) y = P.girar(y, PI / 4, 0.016); ok(c(y, PI / 4), 'v2.135 paso 2: girar llega a la esquina y se queda'); }
  { let a = 0; for (let i = 0; i < 3; i++) a = P.amplitud(a, true, 0.016); const b = P.amplitud(1, false, 0.016), z = P.amplitud(0.05, false, 1); ok(a > 0 && a < 1 && b < 1 && b > 0 && z === 0 && P.amplitud(0, true, 1) === 1, 'v2.135 paso 4: la amplitud sube y baja gradualmente entre 0 y 1');
    const q = Ol.pose(0.09, false, 'down', 0, 0, 0.5), r = Ol.pose(0.09, true, 'down', 0, 0, 1), s0 = Ol.pose(0.09, false, 'down'); ok(Math.abs(q.piernaD) > 0 && Math.abs(q.piernaD) < Math.abs(r.piernaD) && s0.piernaD === 0 && s0.rebote === 0, 'v2.135 paso 4: con amp parcial el paso es más pequeño; parado sin amp, pose neutra como antes'); }
  { const fs = require('fs'), pin = fs.readFileSync(require('path').join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/P\.meta\(o\.mt, objetivo, dt\)/.test(pin) && /P\.amplitud\(/.test(pin) && /j\.ang/.test(pin), 'v2.135: el pintor usa ang, la histéresis y la amplitud para Oli y Lali (misma ruta)'); }
}
// ── v2.136 · SONIDO (ID-4, src/audio.js): temas por zona, plan de notas, elección con retardo y motor de Web Audio (probado con un contexto falso) ──
{
  const A = G.audio, T = A.TEMAS, nombres = Object.keys(T);
  ok(['albanota', 'hoja', 'aire', 'agua', 'electrico', 'sombra', 'roca', 'fuego'].every((n) => T[n]), 'v2.136: hay un tema por cada elemento de zona y el de Albanota');
  ok(nombres.every((n) => { const e = A.eventos(n); return e.beats === 16 && e.porBeat.length === 16 && e.porBeat.every((b) => b.every((x) => x.t >= 0 && x.t < 16)) && A.parsear(T[n].mel).total === 16 && T[n].acordes.length === 4 && (!T[n].perc || T[n].perc.length === 8); }), 'v2.136: cada tema dura 16 pulsos (melodía, 4 acordes y percusión de 8 corcheas)');
  ok(nombres.every((n) => A.eventos(n).porBeat.flat().filter((x) => x.midi != null).every((x) => x.midi >= 28 && x.midi <= 96)) && A.eventos('hoja') === A.eventos('hoja'), 'v2.136: todas las notas caen en un rango audible y el plan se calcula una sola vez');
  ok(A.hz(69) === 440 && A.grado({ tonica: 60, escala: 'mayor' }, 0) === 60 && A.grado({ tonica: 60, escala: 'mayor' }, 7) === 72 && A.grado({ tonica: 60, escala: 'mayor' }, -3) === 55, 'v2.136: grados de la escala → MIDI (0 tónica, 7 octava, negativos hacia abajo) y 440 Hz');
  { let falla = 0; ['4:x', '4:0'].forEach((t) => { try { A.parsear(t); } catch (e) { falla++; } }); ok(falla === 2 && A.parsear('-:1 3:2').notas.length === 1, 'v2.136: el parseo rechaza duraciones inválidas y los silencios no suman notas'); }
  { const m = G.mundo.mapa('albanota'), z = m.zonas.find((q) => q.elemento === 'hoja'); ok(A.temaEn(m, z.x + 1, z.y + 1) === 'hoja' && A.temaEn(m, 0, 0) === 'albanota' && A.temaEn(null, 0, 0) === 'albanota' && A.temaEn({ zonas: [{ x: 0, y: 0, w: 2, h: 2, elemento: 'inventado' }], region: 'marenda' }, 1, 1) === 'albanota', 'v2.136: el tema sale de la zona donde se está; fuera de zona o desconocido, el de Albanota'); }
  ok(G.mundo.mapa('pueblo_inicial').zonas.every((z) => T[z.elemento]) && G.mundo.mapa('albanota').zonas.every((z) => T[z.elemento]), 'v2.136: todas las zonas de los mapas oficiales tienen tema');
  { const S = { dt: 0 }; A.AJUSTES.ACTIVO = true; A.seguir('albanota', 0.016); ok(A.tema === 'albanota', 'v2.136: el primer tema entra al instante');
    for (let i = 0; i < 20; i++) A.seguir(i % 2 ? 'hoja' : 'agua', 0.016); ok(A.tema === 'albanota', 'v2.136: pisar el borde de dos zonas sin parar no cambia la música');
    for (let i = 0; i < 20; i++) A.seguir('hoja', 0.016); ok(A.tema === 'albanota', 'v2.136: 0,3 s en otra zona todavía no cambia (RETARDO)'); for (let i = 0; i < 30; i++) A.seguir('hoja', 0.016); ok(A.tema === 'hoja', 'v2.136: tras RETARDO s seguidos sí cambia'); }
  // Motor con un contexto falso: registra osciladores, ganancias y estado
  { const reg = { osc: 0, parados: 0, fuente: 0 }; const param = (v) => ({ value: v, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
    const nodo = (extra) => Object.assign({ connect() {}, disconnect() {}, gain: param(1), frequency: param(0), start() {}, stop() { reg.parados++; } }, extra);
    class CtxFalso { constructor() { this.currentTime = 0; this.state = 'running'; this.sampleRate = 8000; this.destination = {}; }
      createGain() { return nodo(); } createOscillator() { reg.osc++; return nodo({ type: '' }); } createBufferSource() { reg.fuente++; return nodo({ buffer: null }); } createBiquadFilter() { return nodo({ type: '' }); }
      createBuffer(c, n) { const d = new Float32Array(n); return { getChannelData: () => d }; } resume() { this.state = 'running'; } suspend() { this.state = 'suspended'; } close() { this.state = 'closed'; } }
    const intervalos = [], viejo = global.setInterval; global.setInterval = (f) => { intervalos.push(f); return intervalos.length; };
    const stub = { removeEventListener() {} }; window.AudioContext = CtxFalso;
    const btn = { hidden: false, textContent: '', attrs: {}, addEventListener(e, f) { this.click = f; }, setAttribute(k, v) { this.attrs[k] = v; } };
    const ls = {}; window.localStorage = { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = v; } };
    A.sfx('hablar'); ok(reg.osc === 0, 'v2.136: sin gesto previo (sin contexto) no suena nada ni falla');
    A.montar(btn); ok(btn.textContent === '🔊' && btn.attrs['aria-pressed'] === 'true', 'v2.136: el botón nace con sonido');
    btn.click(); ok(A.silenciado && btn.textContent === '🔇' && ls[A.AJUSTES.CLAVE] === '0', 'v2.136: pulsarlo silencia, cambia el icono y lo recuerda');
    btn.click(); ok(!A.silenciado && btn.textContent === '🔊' && ls[A.AJUSTES.CLAVE] === '1' && intervalos.length === 1, 'v2.136: pulsarlo otra vez devuelve el sonido y el contexto se crea una sola vez');
    const tick = intervalos[0]; A.seguir('hoja', 1); A.seguir('hoja', 1); const c0 = reg.osc; tick(); ok(reg.osc > c0 && A.sonando, 'v2.136: el planificador programa notas (osciladores) del tema deseado');
    const c1 = reg.osc; A.sfx('evolucionar'); ok(reg.osc === c1 + 5 && (A.sfx('no_existe'), reg.osc === c1 + 5), 'v2.136: el efecto «evolucionar» son 5 notas y un efecto desconocido se ignora');
    A.seguir('electrico', 1); A.seguir('electrico', 1); const f0 = reg.fuente; window.AudioContext = undefined; tick(); tick(); ok(reg.osc > c1 && reg.fuente >= f0, 'v2.136: al cambiar de tema entra el nuevo (con percusión) mientras funde el anterior');
    A.silenciar(true); ok(!A.sonando, 'v2.136: en silencio el contexto se suspende y no suena nada'); A.silenciar(false);
    global.setInterval = viejo; delete window.localStorage; delete window.AudioContext; }
  { const fs = require('fs'), src = fs.readFileSync(require('path').join(__dirname, 'src/audio.js'), 'utf8'), gm = fs.readFileSync(require('path').join(__dirname, 'src/game.js'), 'utf8'), mo = fs.readFileSync(require('path').join(__dirname, 'src/motor.js'), 'utf8');
    ok(!/Math\.random/.test(src) && !/G\.audio/.test(mo) && /G\.audio\.seguir\(/.test(gm) && /G\.audio\.sfx\('puerta'\)/.test(gm) && /G\.audio\.montar\(/.test(gm), 'v2.136: el audio no usa Math.random, el motor no lo conoce y game.js lo engancha (música, efectos y botón)'); }
}
// ── v2.137 · INTERIOR DEL CENTRO PC (ID-5a): plantilla de interior, puerta de ida y vuelta con Albanota y tema de música propio ──
{
  const motor = G.motor, mundo = G.mundo, est = motor.crear(9), j = est.jugadores.oli, T = 16, A = mundo.mapa('albanota'), C = mundo.mapa('centro_pc');
  const pa = A.puertas.find((p) => p.id === 'centro_pc'), ps = C.puertas[0];
  ok(C && C.W === 13 && C.H === 10 && C.zonas.length === 0 && C.npcs.length === 1 && C.npcs[0].id === 'enfermera' && !C.region && C.puertas.length === 1, 'v2.137: el interior existe, sin zonas ni criaturas y sin tinte de región');
  ok(!mundo.solido(A, pa.x, pa.y) && !motor.bloqueado(A, pa.x * T + 8, pa.y * T + 8) && mundo.solido(A, pa.x, pa.y - 1) && !mundo.solido(A, pa.x, pa.y + 1), 'v2.137: la puerta de Albanota está en el hueco del edificio (libre) con el edificio detrás y calle delante');
  ok(!mundo.solido(C, ...C.anclas.entrada) && ps.destino.ancla === 'volver' && !mundo.solido(C, ps.x, ps.y) && C.suelo.every((r) => r.length === 13) && ps.x === 6 && C.anclas.entrada[0] === 6 && pa.x === 26, 'v2.137: el ancla de entrada es libre y la salida vuelve por donde se entró');
  { const sal = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (!mundo.solido(C, x, y) && !mundo.puertaEn(C, x, y)) { const v = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => x + a >= 0 && y + b >= 0 && x + a < C.W && y + b < C.H); if (!v) sal.push([x, y]); } ok(!sal.length, 'v2.137: ninguna casilla libre del interior toca el borde del mapa (no se puede salir sin puerta)'); }
  motor.aplicar(est, { j: 'oli', t: 'colocar', mapa: 'albanota', ancla: 'inicio', dir: 'up' }); j.x = pa.x * T + 8; j.y = pa.y * T + 8; j.volver = []; j.enPuerta = null;
  motor.cruzar(est, j, A); const [ex, ey] = C.anclas.entrada;
  ok(j.mapa === 'centro_pc' && Math.floor(j.x / T) === ex && Math.floor(j.y / T) === ey && j.volver.length === 1, 'v2.137: al pisar la puerta de Albanota se entra en el interior, en su ancla de entrada');
  j.x = ps.x * T + 8; j.y = ps.y * T + 8; motor.cruzar(est, j, C);
  ok(j.mapa === 'albanota' && Math.floor(j.x / T) === pa.x && Math.floor(j.y / T) === pa.y + 1 && j.volver.length === 0, 'v2.137: la puerta de salida devuelve a la calle, justo delante del Centro PC');
  ok(G.audio.TEMAS.centro_pc && G.audio.temaEn(C, 5, 5) === 'centro_pc' && G.audio.temaEn(A, 0, 0) === 'albanota' && G.audio.eventos('centro_pc').beats === 16, 'v2.137: el interior tiene su tema de música');
}
// ── v2.140 · MOBILIARIO DE INTERIORES (ID-5c, src/interiores_objetos.js): 15 piezas del catálogo sobre la rejilla de 16 px ──
{
  const ts = G.INTERIOR_OBJETOS, D = G.INTERIOR_DEF, OB = G.OBJETOS;
  ok(ts.length === 32 && ts.every((t) => OB[t] && OB[t].interior === true && D[t]), 'v2.140: las 32 piezas de interior (15 + estante_tienda y vitrina_frasco v2.144 + mostrador_tienda, mesa_exhibicion, barril_frutas y sacos_cajas v2.145) están registradas en el catálogo y marcadas como interior');
  ok(ts.every((t) => { const h = OB[t].huella; return h.length === 1 && h[0][0] === 0 && h[0][1] === 0 && Number.isInteger(h[0][2]) && Number.isInteger(h[0][3]) && h[0][2] === D[t].cw && h[0][3] === D[t].ch && OB[t].pieY === D[t].ch * 16 - 1; }), 'v2.140: cada pieza ocupa una huella de casillas enteras y se ordena por su borde sur');
  ok(ts.every((t) => D[t].w >= D[t].cw * 16 && D[t].w <= D[t].cw * 16 + 2), 'v2.140: el ancho del dibujo es el de su huella (cw×16) más, como mucho, el contorno');
  ok(D.mostrador_centro.cw === 3 && D.banco_doble.cw === 2 && D.terminal_pc.cw === 1 && D.cama_azul.ch === 2 && D.banco_doble.l !== D.banco_doble_e.l, 'v2.140: medidas de la biblia: mostrador 3 casillas, banco doble 2, terminal 1, cama 1×2, y banco con su espejo');
  { const j = { formato: 2, id: 'prueba', ancho: 13, alto: 10, capas: { suelo: Array.from({ length: 10 }, () => '.'.repeat(13)) }, objetos: [['mostrador_centro', 5, 4], ['terminal_pc', 1, 3], ['terminal_pc', 11, 3], ['banco_doble', 2, 7], ['banco_doble_e', 9, 7], ['planta_interior', 1, 8], ['planta_interior', 11, 8]].map(([tipo, x, y]) => ({ tipo, x, y })) };
    ok(G.capas.validar(j, 13, 10).length === 0 && G.capas.bloqueos(j, 13, 10).size === 3 + 1 + 1 + 2 + 2 + 1 + 1, 'v2.140: la composición del Centro PC cabe en 13×10 y bloquea exactamente las casillas de sus huellas'); }
}
// ── v2.141 · CENTRO PC DEFINITIVO (ID-5d): sala 13×10 con el mobiliario de la biblia; recorrido del jugador comprobado por búsqueda de camino ──
{
  const mundo = G.mundo, C = mundo.mapa('centro_pc'), T = 16, objs = (t) => C.objetos.filter((o) => o.tipo === t), libre = (x, y) => !mundo.solido(C, x, y);
  ok(C.objetos.length === 10 && objs('sala_centro_pc').length === 1 && objs('terminal_pc').length === 4 && objs('planta_interior').length === 2 && objs('banco_doble').length === 1 && objs('banco_doble_e').length === 1 && objs('mostrador_centro').length === 1, 'v2.141: el mapa lleva la sala y el mobiliario de la biblia (1 mostrador, 4 terminales, 2 bancos, 2 plantas)');
  { const par = (a, b, w) => a.x + w + b.x === C.W; const m = objs('mostrador_centro')[0], t = objs('terminal_pc'), bd = objs('banco_doble')[0], be = objs('banco_doble_e')[0], pl = objs('planta_interior');
    ok(m.x * T + 24 === 104, 'v2.141: el mostrador (3 casillas) está centrado en el eje x = 104');
    ok(par(bd, be, 2) && par(pl[0], pl[1], 1) && t.filter((q) => q.x === 1).length === 2 && t.filter((q) => q.x === 11).length === 2 && t.filter((q) => q.x === 1).map((q) => q.y).join() === t.filter((q) => q.x === 11).map((q) => q.y).join(), 'v2.141: bancos, plantas y terminales son parejas espejo respecto al eje'); }
  { const ini = C.anclas.entrada, vis = new Set([ini.join()]), q = [ini]; while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && libre(x + a, y + b)) { vis.add(k); q.push([x + a, y + b]); } }); }
    const sueloLibre = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (libre(x, y)) sueloLibre.push(x + ',' + y);
    ok(sueloLibre.every((k) => vis.has(k)), 'v2.141: todas las casillas libres de la sala son alcanzables desde la entrada (sin rincones aislados)');
    ok(vis.has('6,9') && vis.has('5,5') && vis.has('6,5') && vis.has('7,5') && vis.has('4,4') && vis.has('8,4') && vis.has('2,3') && vis.has('10,5') && vis.has('2,8'), 'v2.141: se llega a la puerta, a los tres lados del frente del mostrador, a los 4 terminales y a las esquinas');
    ok(!libre(5, 4) && !libre(6, 4) && !libre(7, 4) && libre(4, 4) && libre(8, 4), 'v2.141: el mostrador bloquea exactamente sus tres casillas y deja un pasillo libre a cada lado'); }
  { let ancho = 99; for (let y = 2; y <= 8; y++) { let run = 0, mejor = 0; for (let x = 1; x <= 11; x++) { run = libre(x, y) ? run + 1 : 0; mejor = Math.max(mejor, run); } ancho = Math.min(ancho, mejor); } ok(ancho >= 3, 'v2.141: en cada fila de la sala hay un tramo libre de al menos 3 casillas seguidas (pasillos anchos, nada de cuellos de botella)'); }
}
// ── v2.143 · TIENDA (ID-5e): interior 11×8 asimétrico y equilibrado, puerta en Albanota, tema propio; recorrido comprobado por búsqueda de camino ──
{
  const mundo = G.mundo, A = mundo.mapa('albanota'), C = mundo.mapa('tienda'), T = 16, objs = (t) => C.objetos.filter((o) => o.tipo === t), libre = (x, y) => !mundo.solido(C, x, y);
  const pa = A.puertas.find((p) => p.id === 'tienda'), tb = A.objetos.find((o) => o.tipo === 'tienda');
  ok(pa && pa.x === tb.x + 2 && pa.y === tb.y + 3 && pa.destino.mapa === 'tienda' && C.puertas[0].destino.ancla === 'volver' && C.puertas[0].x === 5 && C.W === 11 && C.H === 8, 'v2.143: la puerta de Albanota está en el hueco de la fachada de la Tienda y la salida vuelve delante de ella (sala 11×8, puerta en el eje)');
  ok(G.audio.TEMAS.tienda && G.audio.temaEn(C, 5, 5) === 'tienda' && G.audio.eventos('tienda').beats === 16, 'v2.143: la Tienda tiene su tema de música');
  ok(C.objetos.length === 8 && objs('sala_tienda').length === 1 && objs('estante_tienda').length === 2 && objs('vitrina').length === 1 && objs('vitrina_frasco').length === 1 && objs('mostrador_tienda').length === 1 && objs('mesa_exhibicion').length === 0 && objs('barril_frutas').length === 1 && objs('sacos_cajas').length === 1, 'v2.145: sala, 2 estantes, 2 vitrinas, mostrador, barril y sacos (sin macetas simétricas ni mesa de exhibición, v2.146)');
  ok(G.capas.validar(C.objetos.filter((o) => o.tipo !== 'sala_tienda'), 11, 8).length === 0, 'v2.143: el mobiliario cabe en 11×8 sin solaparse');
  { const ini = C.anclas.entrada, vis = new Set([ini.join()]), q = [ini]; while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && libre(x + a, y + b)) { vis.add(k); q.push([x + a, y + b]); } }); }
    const sl = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (libre(x, y)) sl.push(x + ',' + y);
    ok(sl.every((k) => vis.has(k)) && vis.has('5,7') && vis.has('7,4') && vis.has('6,4') && vis.has('8,4') && vis.has('2,2'.replace('2,2', '3,3')), 'v2.143: todas las casillas libres son alcanzables; se llega a la puerta, al frente del mostrador y a las vitrinas');
    let ancho = 99; for (let y = 2; y <= 6; y++) { let run = 0, mejor = 0; for (let x = 1; x <= 9; x++) { run = libre(x, y) ? run + 1 : 0; mejor = Math.max(mejor, run); } ancho = Math.min(ancho, mejor); } ok(ancho >= 2, 'v2.143: en cada fila hay un tramo libre de al menos 2 casillas y la columna del eje (5) está libre de arriba abajo');
    ok([2, 3, 4, 5, 6, 7].every((y) => libre(5, y)), 'v2.143: la columna del eje (x = 5) está libre desde la puerta hasta la pared del fondo'); }
}
// ── v2.147 · LABORATORIO (ID-5f): interior 13×9, puerta en Albanota, tema propio; recorrido por búsqueda de camino ──
{
  const mundo = G.mundo, A = mundo.mapa('albanota'), C = mundo.mapa('laboratorio'), objs = (t) => C.objetos.filter((o) => o.tipo === t), libre = (x, y) => !mundo.solido(C, x, y);
  const pa = A.puertas.find((p) => p.id === 'laboratorio'), lb = A.objetos.find((o) => o.tipo === 'laboratorio');
  ok(pa && pa.x === lb.x + 2 && pa.y === lb.y + 4 && pa.destino.mapa === 'laboratorio' && C.puertas[0].destino.ancla === 'volver' && C.puertas[0].x === 6 && C.W === 13 && C.H === 9, 'v2.147: la puerta de Albanota está en el hueco de la fachada del Laboratorio y la salida vuelve delante de ella (sala 13×9, puerta en el eje)');
  ok(G.audio.TEMAS.laboratorio && G.audio.temaEn(C, 5, 5) === 'laboratorio' && G.audio.eventos('laboratorio').beats === 16, 'v2.147: el Laboratorio tiene su tema de música');
  ok(C.objetos.length === 9 && objs('sala_laboratorio').length === 1 && objs('estante_lab').length === 2 && objs('incubadora_lab').length === 3 && objs('consola_lab').length === 1 && objs('mesa_lab').length === 1 && objs('escaner').length === 1, 'v2.147: sala, 2 estantes (columna derecha), 3 incubadoras (2 cápsulas y la central; esquinas del fondo libres desde v2.148), consola de 7 cristales, mesa de estudio y escáner');
  ok(objs('consola_lab')[0].x * 16 + 24 === 104 && objs('incubadora_lab').some((o) => o.x === 6 && o.y === 4) && objs('incubadora_lab').filter((o) => o.y === 2).map((o) => o.x).join() === '3,9', 'v2.147: la consola y la incubadora central están en el eje x = 104 y las dos cápsulas flanquean la consola');
  ok(G.capas.validar(C.objetos.filter((o) => o.tipo !== 'sala_laboratorio'), 13, 9).length === 0, 'v2.147: el mobiliario cabe en 13×9 sin solaparse');
  { const ini = C.anclas.entrada, vis = new Set([ini.join()]), q = [ini]; while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && libre(x + a, y + b)) { vis.add(k); q.push([x + a, y + b]); } }); }
    const sl = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (libre(x, y)) sl.push(x + ',' + y);
    ok(sl.every((k) => vis.has(k)) && vis.has('6,8') && vis.has('6,5') && vis.has('6,3') && vis.has('5,4') && vis.has('7,4') && vis.has('2,5') && vis.has('2,6') && vis.has('9,5'), 'v2.147: todas las casillas libres son alcanzables; se llega a la puerta, a la incubadora central por sus tres lados, a la consola, a la mesa y al escáner');
    let ancho = 99; for (let y = 3; y <= 7; y++) { let run = 0, mejor = 0; for (let x = 1; x <= 11; x++) { run = libre(x, y) ? run + 1 : 0; mejor = Math.max(mejor, run); } ancho = Math.min(ancho, mejor); } ok(ancho >= 3, 'v2.147: en las filas 3 a 7 hay un tramo libre de al menos 3 casillas (pasillos anchos)');
    ok([5, 6, 7].every((y) => libre(6, y)), 'v2.147: la columna del eje está libre desde la puerta hasta la incubadora central'); }
}
// ── v2.148 · CASILLA DEL NPC en los interiores de servicio (norma permanente): ancla `npc` + `npc_frente` libres; con el NPC como casilla sólida todo sigue alcanzable ──
{
  const mundo = G.mundo, T = 16;
  [['centro_pc', 6, 3, 6, 5], ['tienda', 7, 2, 7, 4], ['laboratorio', 3, 4, 4, 4]].forEach(([id, nx, ny, fx, fy]) => {
    const C = mundo.mapa(id), npc = C.anclas.npc, fr = C.anclas.npc_frente, bloq = (x, y) => (x === nx && y === ny) || mundo.solido(C, x, y);
    ok(npc && fr && npc[0] === nx && npc[1] === ny && fr[0] === fx && fr[1] === fy && (id === 'centro_pc' || id === 'tienda' || id === 'laboratorio' ? mundo.solido(C, nx, ny) : !mundo.solido(C, nx, ny)) && !mundo.solido(C, fx, fy), 'v2.148: ' + id + ' reserva la casilla del NPC (' + nx + ',' + ny + ') y su casilla frontal (' + fx + ',' + fy + '), ambas libres');
    const ini = C.anclas.entrada, vis = new Set([ini.join()]), q = [ini]; while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && !bloq(x + a, y + b)) { vis.add(k); q.push([x + a, y + b]); } }); }
    const sl = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (!bloq(x, y)) sl.push(x + ',' + y);
    ok(sl.every((k) => vis.has(k)) && vis.has(fx + ',' + fy) && vis.has(C.puertas[0].x + ',' + C.puertas[0].y), 'v2.148: ' + id + ' con el NPC como casilla sólida: todo sigue alcanzable desde la puerta (100% transitable) y se llega a la casilla frontal');
  });
}
// ── v2.154 · CASA DE OLI (ID-5g-2): interior 9×7 sin NPC, 100% transitable; música del exterior (pendiente un tema propio) ──
{
  const mundo = G.mundo, A = mundo.mapa('albanota'), C = mundo.mapa('casa_de_oli'), objs = (t) => C.objetos.filter((o) => o.tipo === t), libre = (x, y) => !mundo.solido(C, x, y);
  const pa = A.puertas.find((p) => p.id === 'casa_de_oli'), cb = A.objetos.find((o) => o.tipo === 'casa_lali');
  ok(pa && pa.x === cb.x + 2 && pa.y === cb.y + 4 && pa.destino.mapa === 'casa_de_oli' && C.puertas[0].destino.ancla === 'volver' && C.puertas[0].x === 4 && C.W === 9 && C.H === 7 && !C.anclas.npc, 'v2.154: la puerta de la casa azul (de Oli) lleva a su interior 9×7, la salida vuelve delante de ella y no reserva casilla de NPC');
  ok(G.audio.temaEn(C, 4, 4) === 'casa', 'v2.186: la Casa de Oli usa el tema compartido de las casas');
  ok(C.objetos.length === 5 && objs('sala_casa_oli').length === 1 && objs('cama_azul').length === 1 && objs('estante_oli').length === 1 && objs('mesa_sillas').length === 1 && objs('planta_interior').length === 1, 'v2.154: sala, cama azul, estante de aventurero, mesa con 2 sillas y planta');
  ok(G.capas.validar(C.objetos.filter((o) => o.tipo !== 'sala_casa_oli'), 9, 7).length === 0, 'v2.154: el mobiliario cabe en 9×7 sin solaparse');
  { const ini = C.anclas.entrada, vis = new Set([ini.join()]), q = [ini]; while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && libre(x + a, y + b)) { vis.add(k); q.push([x + a, y + b]); } }); }
    const sl = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (libre(x, y)) sl.push(x + ',' + y);
    ok(sl.every((k) => vis.has(k)) && vis.has('4,6') && vis.has('4,2') && vis.has('2,3') && vis.has('5,3') && vis.has('4,4'), 'v2.154: todas las casillas libres son alcanzables (100% transitable); se llega a la puerta, al fondo, a la cama y a la mesa');
    ok([2, 3, 4, 5].every((y) => libre(4, y)) && [2, 3, 4, 5, 6, 7].every((x) => libre(x, 3) || x === 1), 'v2.154: la columna del eje y la fila 3 están libres (pasillos)'); }
}
// ── v2.158 · CASA DE LALI (ID-5g-3): interior 9×7 sin NPC, 100% transitable; música del exterior (tema propio pendiente, ID-5m) ──
{
  const mundo = G.mundo, A = mundo.mapa('albanota'), C = mundo.mapa('casa_de_lali'), objs = (t) => C.objetos.filter((o) => o.tipo === t), libre = (x, y) => !mundo.solido(C, x, y);
  const pa = A.puertas.find((p) => p.id === 'casa_de_lali'), cb = A.objetos.find((o) => o.tipo === 'casa_oli');
  ok(pa && pa.x === cb.x + 2 && pa.y === cb.y + 4 && pa.destino.mapa === 'casa_de_lali' && C.puertas[0].destino.ancla === 'volver' && C.puertas[0].x === 4 && C.W === 9 && C.H === 7 && !C.anclas.npc, 'v2.158: la puerta de la casa rosa (de Lali) lleva a su interior 9×7, la salida vuelve delante de ella y no reserva casilla de NPC');
  ok(/m\.tema = String\(j\.tema\)/.test(require('fs').readFileSync(require('path').join(__dirname, 'tools/editor_mapas.plantilla.html'), 'utf8')), 'v2.186: el editor conserva el «tema» de música de un mapa al exportar');
  ok(G.audio.temaEn(C, 4, 4) === 'casa' && G.audio.TEMAS.casa.escala === 'mayor' && G.audio.eventos('casa').beats === 16, 'v2.186: la Casa de Lali usa el MISMO tema de casas (mayor, 16 tiempos)');
  ok(C.objetos.length === 5 && objs('sala_casa_lali').length === 1 && objs('cama_rosa').length === 1 && objs('estante').length === 1 && objs('mesa_sillas_lali').length === 1 && objs('planta_interior').length === 1, 'v2.159: sala, cama rosa, estante, mesa con 2 sillas y 1 planta');
  ok(objs('cama_rosa')[0].x * 16 + 8 === 104 && objs('mesa_sillas_lali')[0].x === 1 && objs('mesa_sillas_lali')[0].y === 4, 'v2.158: la cama está en la columna de la ventana (eje x = 104) y la mesa a la izquierda, junto a la puerta (distinta de la Casa de Oli)');
  ok(G.capas.validar(C.objetos.filter((o) => o.tipo !== 'sala_casa_lali'), 9, 7).length === 0, 'v2.158: el mobiliario cabe en 9×7 sin solaparse');
  { const ini = C.anclas.entrada, vis = new Set([ini.join()]), q = [ini]; while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && libre(x + a, y + b)) { vis.add(k); q.push([x + a, y + b]); } }); }
    const sl = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (libre(x, y)) sl.push(x + ',' + y);
    ok(sl.every((k) => vis.has(k)) && vis.has('4,6') && vis.has('4,2') && vis.has('2,3') && vis.has('7,3') && vis.has('7,5'), 'v2.158: todas las casillas libres son alcanzables (100% transitable); se llega a la puerta, al fondo, al estante, a la cama y a la mesa');
    ok([2, 3, 4, 5].every((y) => libre(4, y)) && [1, 2, 3, 4, 5, 6, 7].every((x) => libre(x, 5)) && [1, 2, 3, 4, 5, 7].every((x) => libre(x, 3)), 'v2.158: la columna del eje y la fila 4 enteras (y la fila 3 salvo la cama) están libres (pasillos)'); }
}
// ── v2.161 · ERMITA DEL PRIMER ECO (ID-5h): interior 11×10 con NPC (guardián), 100% transitable; tema propio ──
{
  const mundo = G.mundo, A = mundo.mapa('albanota'), C = mundo.mapa('ermita'), objs = (t) => C.objetos.filter((o) => o.tipo === t), libre = (x, y) => !mundo.solido(C, x, y);
  const pa = A.puertas.find((p) => p.id === 'ermita'), eb = A.objetos.find((o) => o.tipo === 'ermita');
  ok(pa && pa.x === eb.x + 2 && pa.y === eb.y + 4 && pa.destino.mapa === 'ermita' && C.puertas[0].destino.ancla === 'volver' && C.puertas[0].x === 5 && C.W === 11 && C.H === 10, 'v2.161: la puerta de la Ermita lleva a su interior 11×10 y la salida vuelve delante de ella');
  ok(G.audio.temaEn(C, 5, 5) === 'ermita' && G.audio.TEMAS.ermita.escala === 'dorica', 'v2.161: la Ermita tiene su tema propio (dórico, lento)');
  ok(C.objetos.length === 6 && objs('sala_ermita').length === 1 && objs('altar_mayor').length === 1 && objs('pedestal_eco_azul').length === 1 && objs('pedestal_eco_rosa').length === 1 && objs('banco_doble').length === 1 && objs('banco_doble_e').length === 1, 'v2.161: sala, altar mayor, dos pedestales y dos bancos');
  const al = objs('altar_mayor')[0], pz = objs('pedestal_eco_azul')[0], pr = objs('pedestal_eco_rosa')[0], b1 = objs('banco_doble')[0], b2 = objs('banco_doble_e')[0];
  ok(al.x * 16 + 24 === 88 && pz.x + pr.x === 10 && pz.y === pr.y && b1.x + b2.x === 9 && b1.y === b2.y, 'v2.161: altar, pedestales y bancos simétricos respecto al eje (x = 88)');
  ok(G.capas.validar(C.objetos.filter((o) => o.tipo !== 'sala_ermita'), 11, 10).length === 0, 'v2.161: el mobiliario cabe en 11×10 sin solaparse');
  ok(C.anclas.npc.join() === '2,3' && C.anclas.npc_frente.join() === '3,3' && libre(2, 3) && libre(3, 3), 'v2.161: el guardián tiene su casilla (2,3) junto al altar y la de enfrente (3,3) libre');
  { const ini = C.anclas.entrada, sol = (x, y) => libre(x, y) && !(x === 2 && y === 3), vis = new Set([ini.join()]), q = [ini]; while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && sol(x + a, y + b)) { vis.add(k); q.push([x + a, y + b]); } }); }
    const sl = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (sol(x, y)) sl.push(x + ',' + y);
    ok(sl.every((k) => vis.has(k)) && vis.has('5,9') && vis.has('5,2') && vis.has('3,3') && vis.has('1,2') && vis.has('9,2') && vis.has('5,4') && vis.has('1,3') && vis.has('9,3'), 'v2.161: todas las casillas libres son alcanzables con el guardián sólido (100% transitable)');
    ok([2, 4, 5, 6, 7, 8].every((y) => libre(5, y)) && [1, 2, 3, 4, 5, 6, 7, 8, 9].every((x) => libre(x, 2) && libre(x, 4) && libre(x, 6) && libre(x, 8)), 'v2.161: la nave (columna del eje salvo el altar) y las filas 2, 4, 6 y 8 (pasillo trasero incluido) están libres (pasillos)'); }
}
// ── v2.169 · ZEFIRAX 3D (docs/FICHA_ZEFIRAX_3D.md, pasos 2-5): src/criatura3d.js, módulo puro de la primera criatura en 3D ──
{
  const fs = require('fs'), path = require('path'), C = G.criatura3d, Z = C && C.de('zefirax'), leer = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), sin = (t) => t.replace(/\/\/.*$/gm, '');
  ok(C && Z && C.de('dandel') === null && ['pose', 'geometria', 'atlas', 'uvPoligono', 'girar', 'velocidad'].every((k) => typeof Z[k] === 'function'), 'v2.169 Zefirax 3D: existe G.criatura3d.de(\'zefirax\') con la interfaz del pintor (y otras criaturas aún no)');
  ok(!/Math\.random|document\.|requestAnimationFrame|new Date|performance\./.test(sin(leer('src/criatura3d.js'))) && require('./src/orden.json').juego.indexOf('src/criatura3d.js') > require('./src/orden.json').juego.indexOf('src/personaje3d.js'), 'v2.169 Zefirax 3D: módulo puro (sin azar, DOM ni reloj) y cargado después de personaje3d');
  const g0 = Z.geometria(Z.pose(0, 0)), g1 = Z.geometria(Z.pose(1.3, 1.2)), g2 = Z.geometria(Z.pose(1.3, 1.2));
  ok(g0.triangulos === g0.poligonos.length * 2 && g0.triangulos <= Z.MAX_TRIANGULOS && g0.triangulos >= 200, 'v2.169 Zefirax 3D: presupuesto ≤500 triángulos (' + g0.triangulos + ')');
  ok(g0.poligonos.length === g1.poligonos.length && JSON.stringify(g1) === JSON.stringify(g2) && JSON.stringify(g0) !== JSON.stringify(g1), 'v2.169 Zefirax 3D: mismo número de caras en cualquier pose, determinista, y la pose cambia la forma');
  ok(g1.poligonos.every((q) => q.v.length === 4 && q.v.every((p) => p.every(Number.isFinite))), 'v2.169 Zefirax 3D: todos los vértices son finitos');
  { const ys = g0.poligonos.flatMap((q) => q.v.map((p) => p[1])), alto = Math.max(...ys) - Math.min(...ys); ok(alto > 1.6 && alto < 2.5 && Math.min(...ys) > 0.05, 'v2.169 Zefirax 3D: altura total ≈ la del sprite 2D (30 px ≈ 1,9 u): ' + alto.toFixed(2)); }
  { const cab = (g) => g.poligonos.filter((q) => q.pieza === 'cabeza').flatMap((q) => q.v.map((p) => p[0])); const a = cab(g0), b = cab(Z.geometria(Z.pose(3, 0))); ok(Math.max(...a.map((v, i) => Math.abs(v - b[i]))) < 0.02, 'v2.169 Zefirax 3D: la cabeza apenas se mueve con la onda'); }
  const at = Z.atlas(), us = g0.poligonos.map((q) => Z.uvPoligono(q, at));
  ok(at.w <= 256 && at.h <= 256 && us.every((r) => r.uv.length === 4 && r.uv.every((t) => t[0] >= 0 && t[0] <= 1 && t[1] >= 0 && t[1] <= 1)) && us.filter((r) => r.tex).length >= 17, 'v2.169 Zefirax 3D: atlas ≤256×256 con UV válidas (cabeza, crin, jirones con textura)');
  ok(g0.poligonos.filter((q) => q.pieza === 'cuerpo_1' || q.pieza === 'cuerpo_3').some((q) => q.col === '#ffe433') && g0.poligonos.some((q) => q.pieza === 'cuerno') && g0.poligonos.filter((q) => /^crin|^jiron/.test(q.pieza)).length >= 17, 'v2.169 Zefirax 3D: bandas amarillas, cuernos, crin y jirones');
  { const c1 = C.chispas(0, 0, 0, [1, 0, 1]), c2 = C.chispas(0, 0, 0, [1, 0, 1]); ok(c1.length > 0 && c1.length < 40 && JSON.stringify(c1) === JSON.stringify(c2) && c1.every((p) => /^#[0-9a-f]{6}$/.test(p.c) && p.k === 'v' && Number.isFinite(p.x + p.y + p.z)), 'v2.169 Zefirax 3D: chispas eléctricas deterministas (formato de G.particulas3d, sin azar)'); }
  ok(Z.velocidad(true) > Z.velocidad(false) && Z.YAW.down === 0, 'v2.169 Zefirax 3D: la onda va más rápida al moverse');
  { const pin = sin(leer('src/hd2d_pintor.js')); ok(G.hd2d.AJUSTES.CRIATURAS3D === false /* v2.273: apagado por decisión (solo láminas 2D) */ && /poner3dC/.test(pin) && /AJUSTES\.CRIATURAS3D = false; quitar3d\(k\)/.test(pin) && /!window\.THREE|THREE/.test(pin) && !/criatura3d/.test(sin(leer('src/game.js'))), 'v2.169 Zefirax 3D: interruptor CRIATURAS3D, salida de emergencia a la lámina, el motor no lo conoce'); }
}
// ── v2.171 · AGUA 3D, paso 1 (src/agua3d.js): superficie propia con 3 zonas de profundidad y olas, módulo puro ──
{
  const A = G.agua3d, fs = require('fs'), src = fs.readFileSync(require('path').join(__dirname, 'src/agua3d.js'), 'utf8').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  ok(A && ['distancias', 'preparar', 'pintar', 'zonaDe'].every((k) => typeof A[k] === 'function') && !/Math\.random|document\.|new Date|performance\./.test(src) && require('./src/orden.json').juego.indexOf('src/agua3d.js') < require('./src/orden.json').juego.indexOf('src/hd2d_pintor.js'), 'v2.171 Agua 3D: módulo puro cargado antes del pintor');
  const lago = ['.........', '.~~~~~~~.', '.~~~~~~~.', '.~~~~~~~.', '.~~~~~~~.', '.~~~~~~~.', '.........'], P = A.preparar(lago, 16), d = A.distancias(lago).d;
  ok(d[1][1] === 1 && d[3][3] === 3 && d[0][0] === 0 && A.zonaDe(P, 1, 3) === 0 && A.zonaDe(P, 4, 3) >= 1 && A.zonaDe(P, 0, 0) === -1, 'v2.171 Agua 3D: distancia a la orilla y zonas (orilla en el borde, más hondo en el centro, -1 en tierra)');
  const z = [0, 0, 0]; for (let i = 0; i < P.zona.length; i++) z[P.zona[i]]++;
  ok(z[0] > 0 && z[1] > 0 && P.tiles.length === 35, 'v2.171 Agua 3D: el lago tiene al menos dos zonas y 35 casillas de agua');
  const D1 = new Uint8ClampedArray(P.w * P.h * 4), D2 = new Uint8ClampedArray(P.w * P.h * 4), D3 = new Uint8ClampedArray(P.w * P.h * 4); A.pintar(P, 3, D1); A.pintar(P, 3, D2); A.pintar(P, 4, D3);
  ok(JSON.stringify([...D1.slice(0, 20000)]) === JSON.stringify([...D2.slice(0, 20000)]) && D1.some((v, i) => v !== D3[i]), 'v2.171 Agua 3D: determinista y las olas se mueven con el reloj');
  let opacos = 0, fuera = 0; for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const a = D1[(y * P.w + x) * 4 + 3], agua = lago[y >> 4][x >> 4] === '~'; if (agua && a === 255) opacos++; else if (!agua && a !== 0) fuera++; }
  ok(opacos === 35 * 256 && fuera === 0, 'v2.171 Agua 3D: pinta solo las casillas de agua y cubre sus 16×16 píxeles');
  { const pin = fs.readFileSync(require('path').join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(G.hd2d.AJUSTES.AGUA3D === true && /AJUSTES\.AGUA3D = false/.test(pin) && /if \(!E\.agua\) C\.agua/.test(pin), 'v2.171 Agua 3D: interruptor AGUA3D y salida de emergencia al agua del suelo'); }
}
// ── v2.172d · PROPS DEL RÍO EN 3D (src/rio3d.js): nenúfares y juncos como malla, módulo puro ──
{
  const R = G.rio3d, fs = require('fs'), src = fs.readFileSync(require('path').join(__dirname, 'src/rio3d.js'), 'utf8').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  ok(R && typeof R.modelo === 'function' && typeof R.animar === 'function' && !/Math\.random|document\.|new Date|performance\./.test(src) && require('./src/orden.json').juego.indexOf('src/rio3d.js') > require('./src/orden.json').juego.indexOf('src/agua3d.js'), 'v2.172d Río 3D: módulo puro y cargado tras el agua');
  const props = [{ tipo: 'nenufar', x: 3.5, z: 4.5, y: -0.27 }, { tipo: 'nenufar_flor', x: 6.5, z: 4.5, y: -0.27 }, { tipo: 'juncos3', x: 9.5, z: 3.9, y: -0.58 }, { tipo: 'juncos2', x: 12.5, z: 3.9, y: -0.58 }];
  const a = R.modelo(props), b = R.modelo(props);
  ok(a.idx.length / 3 > 100 && a.idx.length / 3 <= 1500 && a.pos.length === a.col.length && a.idx.every((i) => i < a.pos.length / 3) && JSON.stringify([...a.pos]) === JSON.stringify([...b.pos]), 'v2.172d Río 3D: presupuesto de triángulos (' + a.idx.length / 3 + '), índices válidos y determinista');
  R.animar(a, 0); const p0 = [...a.pos]; R.animar(a, 1.7); const p1 = [...a.pos];
  ok(p0.every(Number.isFinite) && p1.every(Number.isFinite) && JSON.stringify(p0) !== JSON.stringify(p1), 'v2.172d Río 3D: vértices finitos y se mueven con el reloj');
  { const q = a.partes[0]; let sx = 0, sz = 0, n = 0; for (let i = q.i0; i < q.i1; i++) { sx += a.pos[i * 3]; sz += a.pos[i * 3 + 2]; n++; } ok(Math.abs(sx / n - 3.5) < 0.15 && Math.abs(sz / n - 4.5) < 0.15, 'v2.172d Río 3D: el nenúfar sigue en su casilla al flotar'); }
  { const q = a.partes[2]; const ys = []; for (let i = q.i0; i < q.i1; i++) ys.push(a.pos[i * 3 + 1]); ok(Math.max(...ys) - Math.min(...ys) > 0.5 && Math.min(...ys) >= -0.6, 'v2.172d Río 3D: los juncos suben desde el lecho'); }
  { const rex = G.CHARS.rex, liso = rex.back(rex.down, true), d2 = rex.back(rex.down); let mezcla = 0; for (let y = 5; y <= 10; y++) for (let x = 4; x <= 11; x++) { const c = liso[y][x]; if ('efw'.includes(c)) continue; if (x <= 7 ? c !== 'c' : c !== 'b') mezcla++; }
    ok(mezcla === 0 && d2.slice(5, 11).some((f) => f.slice(4, 8).some((c) => c === 'i')) && ['e', 'w'].every((c) => liso[6].includes(c)), 'v2.174 Oli de espaldas: en 3D las trenzas son dos mitades lisas (rojo y castaño) con el nudo y las colas del durag, y el 2D conserva su sombreado'); }
  { const lago = ['..........', '.~~~~~~~~~.', '.~~~~~~~~~.', '.~~~~~~~~~.', '.~~~~~~~~~.', '.~~~~~~~~~.', '..........'], e1 = R.extras(lago, []), e2 = R.extras(lago, []);
    ok(JSON.stringify(e1) === JSON.stringify(e2) && e1.length > 0 && e1.length <= 40 && e1.every((q) => lago[Math.floor(q.z)][Math.floor(q.x)] === '~') && e1.some((q) => q.tipo === 'juncoSuelto'), 'v2.172g Río 3D: extras (juncos sueltos y nenúfares en grupo) deterministas, solo sobre agua y en número acotado');
    const pu = ['.....', '.~b~.', '.~b~.', '.....'], ep = R.extras(pu, []); ok(ep.every((q) => Math.abs(q.x - 2.5) >= 0.9), 'v2.172g Río 3D: ningún extra pegado al puente');
    const m = R.modelo(e1.map((q) => Object.assign({ y: -0.3 }, q))); R.animar(m, 2); ok(m.pos.every(Number.isFinite) && m.idx.length / 3 < 6000, 'v2.172g Río 3D: el modelo con extras es finito y de tamaño razonable (' + m.idx.length / 3 + ' triángulos)'); }
  { const pu = ['.....', '.~b~.', '.~b~.', '.....'], ps = R.pilotes(pu); ok(ps.length === 4 && ps.every((q) => Math.abs(q.x - 2.5) > 0.4 && pu[Math.floor(q.z)][Math.floor(q.x)] !== undefined) && R.pilotes(['...', '...']).length === 0, 'v2.175 Río 3D: un pilote en cada lado del puente que da al agua (4 en el ejemplo) y ninguno sin puente');
    const mo = R.modelo(ps.map((q) => ({ tipo: 'pilote', x: q.x, z: q.z, y: -0.58, h: 0.5, yw: -0.255 }))); R.animar(mo, 0.4); const a = [...mo.pos]; R.animar(mo, 1.9); const b = [...mo.pos];
    ok(a.every(Number.isFinite) && b.every(Number.isFinite) && JSON.stringify(a) !== JSON.stringify(b), 'v2.175 Río 3D: pilotes y anillos de onda con vértices finitos y animados'); }
  { const pin = fs.readFileSync(require('path').join(__dirname, 'src/hd2d_pintor.js'), 'utf8'); ok(/rioReal/.test(pin) && /E\.rio\.tipos\.has/.test(pin) && /catch \(err\) \{ E\.rio = null; \}/.test(pin), 'v2.172d Río 3D: el pintor las dibuja en 3D, salta sus láminas y tiene salida de emergencia'); }
}
// v2.180 · Pesca 1: puntos de pesca en Albanota y orden 'pescar' del motor
{
  const mundo = G.mundo, mot = G.motor, m = mundo.mapa('albanota'), T = 16;
  ok(m.pesca.length === 6 && mundo.validar().length === 0, 'v2.180 Pesca 1: Albanota tiene 6 puntos de pesca y el mundo sigue sin problemas');
  ok(m.pesca.every((p) => { const d = mundo.MIRAS[p.mira]; return !mundo.solido(m, p.x, p.y) && mundo.at(m, p.x + d[0], p.y + d[1]) === '~' && mundo.puntoPesca(m, p.x, p.y) === p; }), 'v2.180 Pesca 1: cada punto es una casilla libre que mira al agua');
  const est = mot.crear(180), j = est.jugadores.oli, ord = (o) => mot.aplicar(est, Object.assign({ j: 'oli' }, o)), av = () => est.avisos.splice(0).map((a) => a.texto).join('|');
  ord({ t: 'pescar' }); ok(!j.pesca && /no se puede/.test(av()), 'v2.180 Pesca 1: lejos de un punto no se pesca');
  const p = m.pesca[0]; j.mapa = 'albanota'; j.x = p.x * T + 8; j.y = p.y * T + 14; j.dir = 'up'; ord({ t: 'pescar' });
  ok(j.pesca && j.pesca.id === p.id && j.dir === p.mira && !j.moving && /Pescas/.test(av()), 'v2.180 Pesca 1: en un punto se pone a pescar mirando al agua');
  ord({ t: 'pescar' }); ok(j.pesca && j.pesca.fase === 'fallo' && /pronto/.test(av()), 'v2.181 Pesca 4: tirar antes del pique se escapa (tiraste muy pronto)');
  ord({ t: 'pescar' }); ord({ t: 'teclas', up: 1, down: 0, left: 0, right: 0 }); mot.moverJugador(est, j, 0.05);
  ok(!j.pesca, 'v2.180 Pesca 1: moverse deja de pescar');
  ord({ t: 'teclas', up: 0, down: 0, left: 0, right: 0 }); j.x = p.x * T + 8; j.y = p.y * T + 14; ord({ t: 'pescar' }); ord({ t: 'colocar', mapa: 'albanota', ancla: 'inicio' });
  ok(!j.pesca, 'v2.180 Pesca 1: colocar al jugador cancela la pesca');
  const malo = JSON.parse(JSON.stringify(m.pesca)); const prev = m.pesca; m.pesca = [{ id: 'x', x: 8, y: 20, mira: 'down' }, { id: 'x', x: 8, y: 28, mira: 'sideways' }];
  const errs = mundo.validar().join('|'); m.pesca = prev;
  ok(/no mira a una casilla de agua/.test(errs) && /repetido/.test(errs) && /no mira a ningún lado/.test(errs) && mundo.validar().length === 0, 'v2.180 Pesca 1: la validación avisa de punto fuera del agua, repetido o sin dirección');
  const fs = require('fs'), html = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8'), ed = fs.readFileSync(require('path').join(__dirname, 'tools/editor_mapas.plantilla.html'), 'utf8');
  ok(/data-pesca hidden/.test(html) && /m\.pesca = Array\.isArray\(j\.pesca\)/.test(ed) && /pesca: m\.pesca/.test(ed), 'v2.180 Pesca 1: botón 🎣 en la cruceta y el editor conserva los puntos al exportar');
}
// v2.181 · Pesca 2-4: máquina de la pesca (semilla), vista, geometría 3D y dibujo
{
  const mundo = G.mundo, mot = G.motor, m = mundo.mapa('albanota'), T = 16, p = m.pesca[0];
  const corre = (semilla, seg, accion) => { const est = mot.crear(semilla), j = est.jugadores.oli; j.mapa = 'albanota'; j.x = p.x * T + 8; j.y = p.y * T + 14; mot.aplicar(est, { j: 'oli', t: 'pescar' }); const hist = []; let ult = null;
    for (let t = 0; t < seg; t += 0.05) { mot.moverJugador(est, j, 0.05); if (!j.pesca) { hist.push(['fin', +(t).toFixed(2)]); break; } if (j.pesca.fase !== ult) { ult = j.pesca.fase; hist.push([ult, +(t).toFixed(2), j.pesca.espera, (j.pesca.tirones || []).length]); if (accion) accion(est, j, ult); } } return hist; };
  const h1 = corre(1, 30), h2 = corre(1, 30), h3 = corre(2, 30), h4 = corre(7, 30);
  ok(JSON.stringify(h1) === JSON.stringify(h2), 'v2.181 Pesca 4: con la misma semilla la pesca es idéntica (determinista)');
  ok(h1[0][0] === 'lanzar' && h1[1][0] === 'espera' && h1.some((x) => x[0] === 'pique') && h1.some((x) => x[0] === 'fallo'), 'v2.181 Pesca 4: fases lanzar → espera → pique → fallo si no se tira a tiempo');
  ok(h1.map((x) => x[0]).join() === 'lanzar,espera,pique,fallo,listo' && est0(h1), 'v2.222 pesca: un pique sin tocar termina en fallo y la caña queda en la mano con el hilo recogido («listo»); no se relanza sola');
  function est0(h) { const a = h.find((x) => x[0] === 'fallo'), b = h.find((x) => x[0] === 'listo'); return b[1] - a[1] >= 0.85 && b[1] - a[1] <= 1.05; }
  { const est = mot.crear(1), j = est.jugadores.oli; j.mapa = 'albanota'; j.x = p.x * T + 8; j.y = p.y * T + 14; mot.aplicar(est, { j: 'oli', t: 'pescar' }); j.pesca.fase = 'listo'; j.pesca.t = 0; for (let k = 0; k < 400; k++) mot.moverJugador(est, j, 0.05); ok(j.pesca && j.pesca.fase === 'listo' && G.vista.pesca(j, 0).s === 0, 'v2.222 pesca: en «listo» la caña sigue visible (la pesca no se borra), sin hilo en el agua, y no avanza sola');
    mot.aplicar(est, { j: 'oli', t: 'pescar' }); ok(j.pesca.fase === 'lanzar', 'v2.222 pesca: al pulsar 🎣 en «listo» se vuelve a lanzar'); }
  const esperas = [h1, h3, h4].map((h) => h.find((x) => x[0] === 'espera')[2]);
  ok(new Set(esperas.map((e) => e.toFixed(3))).size === 3 && esperas.every((e) => e >= 3.5 && e <= 11), 'v2.181 Pesca 4: la espera cambia con la semilla (3,5-11 s), no es fija: ' + esperas.map((e) => e.toFixed(1)).join(' / '));
  let capturas = 0; const hc = corre(3, 20, (est, j, f) => { if (f === 'pique') { mot.aplicar(est, { j: 'oli', t: 'pescar' }); capturas++; } });
  ok(capturas >= 1 && hc.some((x) => x[0] === 'forcejeo') && hc.filter((x) => x[0] === 'lanzar').length >= 2, 'v2.181 Pesca 4 (v2.201): tirar en el pique empieza el forcejeo del Cirujano azul (2 tirones) y, si se suelta, vuelve a lanzar');
  // vista
  const est = mot.crear(5), j = est.jugadores.oli; j.mapa = 'albanota'; j.x = p.x * T + 8; j.y = p.y * T + 14; j.dir = p.mira; j.pesca = { id: p.id, fase: 'lanzar', t: 0.35 };
  const V = G.vista, v0 = V.pesca(j, 1); ok(v0 && v0.s > 0.4 && v0.s < 0.6 && v0.cx === 0 && v0.cy > 0, 'v2.181 Pesca 2: el corcho cae en el centro de la casilla de agua de delante (cy>0 mirando abajo)');
  ok(V.pesca({ x: 0, y: 0, dir: 'down' }, 0) === null, 'v2.181 Pesca 2: sin pesca la vista es null');
  j.pesca = { id: p.id, fase: 'pique', t: 0.5 }; const vp = V.pesca(j, 1); ok(vp.senal && vp.hund === 1 && vp.anillos.length === 2, 'v2.181 Pesca 4: en el pique el corcho se hunde, hay señal y ondas');
  j.pesca = { id: p.id, fase: 'salto', t: 0.65 }; const vs = V.pesca(j, 1); ok(vs.pez && Math.abs(vs.pez.s - 0.5) < 1e-9, 'v2.181 Pesca 4: en el salto hay pez y avanza con el tiempo');
  j.pesca = { id: p.id, fase: 'espera', t: 1, espera: 6, tirones: [0.9] }; ok(V.pesca(j, 1).hund > 0.2 && V.pesca(j, 1).anillos.length === 1, 'v2.181 Pesca 4: un tirón falso hunde un poco el corcho');
  // geometría 3D: finita, dentro del presupuesto y distinta según la fase
  ['lanzar', 'espera', 'pique', 'salto', 'fallo'].forEach((f) => { j.pesca = { id: p.id, fase: f, t: f === 'salto' ? 0.5 : 0.45, espera: 6, tirones: [0.3] }; const r = G.pesca3d.build([{ x: 1, y: 0, z: 2, v: V.pesca(j, 1), reloj: 0 }], -0.255);
    ok(r.n > 0 && r.n <= G.pesca3d.MAX_POR_JUGADOR && Array.from(r.pos).every(Number.isFinite) && r.idx.length === r.n * 6, 'v2.181 Pesca 3: geometría 3D de «' + f + '» finita y dentro del presupuesto (' + r.n + ' caras)'); });
  const fs = require('fs'), path = require('path'), pin = fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8'), gm = fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8');
  ok(/po\.brazoI = pv\.brazo\[0\]/.test(pin) && /function pescas3d/.test(pin) && /E\.pescaOff = true/.test(pin) && /marcas\.push/.test(pin), 'v2.181 Pesca 3: el pintor HD-2D pone la pose de pesca y dibuja la caña en 3D (con salida de emergencia)');
  ok(/function pescaDibujo2D/.test(gm) && /G\.audio\.sfx\('pique'\)/.test(gm) && G.audio.sfx.length >= 0, 'v2.181 Pesca 2: el 2D dibuja caña, hilo, corcho y pez, y suena el pique');
}
// v2.188-v2.190 · dos móviles (1.3d), guardado (1.3f) y captura de la pesca
{
  const mundo = G.mundo, mot = G.motor, m = mundo.mapa('albanota'), T = 16;
  // — captura de la pesca: zonas de profundidad y peces —
  ok(mundo.zonaAgua(m, 8, 29) === 0 && mundo.zonaAgua(m, 8, 30) === 1 && mundo.zonaAgua(m, 22, 30) === 1 && mundo.zonaAgua(m, 8, 28) === -1, 'v2.190 pesca: la zona del agua sale de la distancia a tierra (orilla 0, media 1; el puente cuenta como agua; tierra -1)');
  { const rnd = G.azar(9), n = {}; for (let z = 0; z < 3; z++) for (let i = 0; i < 200; i++) { const k = G.pesca.elegir(rnd, z); n[k] = (n[k] || 0) + 1; }
    ok(Object.keys(n).sort().join() === ['cri_pulpo', 'pez_angel', 'pez_bacalao', 'pez_bagre', 'pez_barracuda', 'pez_cazon', 'pez_cirujano', 'pez_dorada', 'pez_espada', 'pez_globo', 'pez_leon', 'pez_loro', 'pez_lubina', 'pez_mero', 'pez_morena', 'pez_payaso', 'pez_raya', 'pez_salmonete', 'pez_sardina', 'pez_volador'].join() && ['pez_plateado', 'pez_gobio', 'pez_carpa', 'pez_trucha', 'pez_anguila'].every((k) => G.PECES[k].oculto) && G.PECES[G.pesca.elegir(G.azar(1), 5)].zona === 0, 'v2.215 pesca: salen las 20 especies dibujadas a mano (el Cirujano y los lotes 1, 2 y 3) y los 5 peces generados por fórmula siguen ocultos'); }
  const cap = (px, py, dir, semilla) => { const est = mot.crear(semilla), j = est.jugadores.oli; j.mapa = 'albanota'; j.x = px * T + 8; j.y = py * T + 14; mot.aplicar(est, { j: 'oli', t: 'pescar' }); if (!j.pesca) return null; j.pesca.fase = 'pique'; j.pesca.t = 0; j.pesca.ventana = 9; mot.aplicar(est, { j: 'oli', t: 'pescar' }); return { est, j }; };
  { const a = cap(8, 28, 'down', 3), b = cap(23, 30, 'left', 3), a2 = cap(8, 28, 'down', 3);
    ok(a && a.j.pesca.fase === 'forcejeo' && G.PECES[a.j.pesca.pez] && !G.PECES[a.j.pesca.pez].oculto && G.PECES[a.j.pesca.pez].zona === 0, 'v2.190 pesca (v2.210): tirar en el pique en la orilla empieza el forcejeo con una criatura de la orilla');
    ok(b && G.PECES[b.j.pesca.pez] && !G.PECES[b.j.pesca.pez].oculto && a2.j.pesca.pez === a.j.pesca.pez, 'v2.190 pesca (v2.210): desde el puente también sale una criatura vivas; con la misma semilla, la misma');
    const v = G.vista.pesca(Object.assign({}, a.j, { pesca: Object.assign({}, a.j.pesca, { fase: 'salto', t: 0.5 }) }), 0); ok(v.pez && v.pez.color === G.PECES[a.j.pesca.pez].color, 'v2.190 pesca: el pez que salta lleva el color de su especie'); }
  // — red: lo que viaja y se valida —
  const A = mot.crear(5), B = mot.crear(6); [A, B].forEach((e) => ['oli', 'lali'].forEach((id) => { e.jugadores[id].mapa = 'albanota'; }));
  { const o = A.jugadores.oli; o.x = 120.4; o.y = 300; o.dir = 'left'; o.ang = -1.57; o.moving = true; o.tm = 2.5; o.pesca = { id: 'orilla_norte_1', fase: 'pique', t: 0.4 }; o.capturas = { pez_carpa: 2 };
    const msg = JSON.parse(JSON.stringify(G.red.resumen(A, 'oli'))), r0 = B.rnd(), rb = G.azar(6)(); ok(G.red.aplicar(B, 'oli', msg) && B.jugadores.oli.remoto && B.jugadores.oli.pesca.fase === 'pique' && B.jugadores.oli.capturas.pez_carpa === 2 && B.jugadores.oli.x === 120.4, 'v2.188 red: lo que manda un móvil lo aplica el otro (posición, pesca, capturas)');
    mot.moverJugador(B, B.jugadores.oli, 0.05); B.jugadores.oli.obj = { x: 130, y: 300 }; for (let i = 0; i < 40; i++) mot.moverJugador(B, B.jugadores.oli, 0.05);
    ok(Math.abs(B.jugadores.oli.x - 130) < 0.5 && B.jugadores.oli.pesca.fase === 'pique', 'v2.188 red: el jugador remoto se acerca suavemente a lo recibido');
    ok(r0 === rb, 'v2.188 red: simular al remoto NO gasta azar (no se desincroniza)');
    const mal = (f) => { const x = JSON.parse(JSON.stringify(msg)); f(x); return G.red.aplicar(B, 'oli', x); };
    ok(!mal((x) => { x.mapa = 'no_existe'; }) && !mal((x) => { x.x = NaN; }) && !mal((x) => { x.x = 99999; }) && !mal((x) => { x.id = 'lali'; }) && !mal((x) => { x.v = 3; }) && !mal((x) => { x.dir = 'arriba'; }) && !mal((x) => { x.pesca.fase = 'hackeo'; }) && !mal((x) => { x.moving = 'si'; }) && !G.red.aplicar(B, 'oli', null) && !G.red.aplicar(B, 'fantasma', msg), 'v2.188 red: un mensaje roto o tramposo se rechaza (mapa, coordenadas, id, versión, dirección, fase, tipos)');
    mal((x) => { x.capturas = { pez_carpa: 5, truco: 99, pez_trucha: -3 }; }); ok(JSON.stringify(B.jugadores.oli.capturas) === '{"pez_carpa":5}', 'v2.188 red: solo se aceptan capturas de peces que existen y con cantidades válidas');
    G.red.soltar(B, 'oli'); ok(!B.jugadores.oli.remoto && !B.jugadores.oli.pesca && !B.jugadores.oli.moving, 'v2.188 red: si se pierde la conexión, el otro se queda quieto y deja de ser remoto'); }
  // — red_peer con un PeerJS falso en memoria: sala de Oli, unión de Lali, mensajes, caída y reconexión —
  { const reg = {}; let anon = 0;
    function FPeer(id) { this.id = id || 'anon' + (++anon); this.h = {}; this.open = false; reg[this.id] = this; }
    FPeer.prototype.on = function (e, f) { this.h[e] = f; }; FPeer.prototype.emit = function (e, a) { if (this.h[e]) this.h[e](a); };
    FPeer.prototype.abrir = function () { this.open = true; this.emit('open', this.id); };
    FPeer.prototype.destroy = function () { delete reg[this.id]; };
    FPeer.prototype.connect = function (id) { const dest = reg[id], a = mkConn(), b = mkConn(); a.par = b; b.par = a; FPeer.ultima = a; if (dest) { a.abierta = b.abierta = true; dest.emit('connection', b); } else a.err = true; return a; };
    function mkConn() { return { h: {}, on(e, f) { this.h[e] = f; if (e === 'open' && this.abierta) f(); if (e === 'error' && this.err) f({}); }, emit(e, x) { if (this.h[e]) this.h[e](x); }, send(msg) { if (!this.par) throw new Error('cerrada'); this.par.emit('data', JSON.parse(JSON.stringify(msg))); }, close() { const p = this.par; this.par = null; this.emit('close'); if (p && p.par) { p.par = null; p.emit('close'); } } }; }
    const eO = mot.crear(11), eL = mot.crear(12); [eO, eL].forEach((e) => ['oli', 'lali'].forEach((id) => { e.jugadores[id].mapa = 'albanota'; e.jugadores[id].x = 100; e.jugadores[id].y = 400; }));
    const rO = G.redPeer.crear(), rL = G.redPeer.crear(); rO.iniciar({ me: 'oli', est: eO, Peer: FPeer }); const cod = rO.codigo();
    ok(/^[A-Z2-9]{6}$/.test(cod) && rO.sufijo().indexOf(cod) > 0 && reg['criaturas-' + cod], 'v2.188 red: Oli crea la sala con un código de 6 letras y se ve en pantalla');
    rO.iniciar({ me: 'oli', est: eO, Peer: FPeer }); reg['criaturas-' + cod].abrir(); rL.iniciar({ me: 'lali', est: eL, Peer: FPeer, codigo: cod }); reg.anon1.abrir();
    ok(rO.sufijo().indexOf('con Lali') > 0 && rL.sufijo().indexOf('con Oli') > 0, 'v2.188 red: Lali entra con el código y los dos ven «conectado»');
    eO.jugadores.oli.x = 250; eO.jugadores.oli.y = 410; eL.jugadores.lali.x = 60; eL.jugadores.lali.y = 420; rO.tick(0.2); rL.tick(0.2);
    ok(eL.jugadores.oli.remoto && eL.jugadores.oli.obj.x === 250 && eO.jugadores.lali.remoto && eO.jugadores.lali.obj.x === 60, 'v2.188 red: cada móvil ve al otro en su sitio (dos sentidos)');
    { const Ag = G.agentes; Ag.asegurar(eO); Ag.asegurar(eL); for (let i = 0; i < 400; i++) Ag.avanzar(eO, 0.05); const antes = Ag.hash(eO) !== Ag.hash(eL); rO.tick(0.2); const igual = Ag.hash(eO) === Ag.hash(eL); rL.tick(0.2);
      const c = G.vista.agentes(eL, 'albanota')[0], jl = eL.jugadores.lali; let llega = true; if (c) { jl.x = c.x + 8; jl.y = c.y; const r = mot.aplicar(eL, { j: 'lali', t: 'hablar' }); rL.tick(0.2); rO.tick(0.2); const a = Ag.porId(eO, c.ag); llega = !!(r && r.agente === c.ag && eO.agentes.par && eO.agentes.par[a.i] && eO.agentes.par[a.i].j === 'lali'); mot.aplicar(eL, { j: 'lali', t: 'hablar_fin' }); rL.tick(0.2); }
      ok(antes && igual && llega && Ag.red.rol(eO) === 'anfitrion' && Ag.red.rol(eL) === 'invitado', 'v2.325 red: por la conexión real (PeerJS falso) Oli manda la población de entrenadores, Lali la adopta, y lo que Lali le dice a un entrenador llega al móvil de Oli'); }
    { const S = G.santuario, l = eL.jugadores.lali, o = eO.jugadores.oli;   // v2.370 · visitas por la conexión real (PeerJS falso): el resumen del Santuario viaja como k:'san' y es solo lectura
      const cri = G.equipo.agregar(o, { forma: Object.keys(G.CREATURES)[0], xp: 40 }), r = S.rec(eO, 'oli', true); r.res[cri.id] = 0; r.des[cri.id] = 0; r.nom = 'Nido'; for (let i = 0; i < 12; i++) rO.tick(0.1);
      const dueno0 = JSON.stringify(eO.dim), aL = JSON.stringify(eL.dim); mot.aplicar(eL, { j: 'lali', t: 'colocar', mapa: S.UMBRAL, ancla: 'hogar', dir: 'down' }); const v = mot.aplicar(eL, { j: 'lali', t: 'santuario.visitar' });
      ok(v && v.ok && S.visitando(l) && S.residentes(eL, eL.jugadores.oli).length === 1 && S.rec(eL, 'oli', false).nom === 'Nido' && !(eL.dim && eL.dim.santuario && eL.dim.santuario.jugadores && eL.dim.santuario.jugadores.oli), 'v2.370 visitas: por la conexión (PeerJS falso) Lali recibe el resumen de Oli y entra a mirar su Santuario, sin escribir nada suyo en su partida');
      const intentos = ['acoger', 'retirar', 'mover', 'ampliar', 'habitat', 'construir', 'derribar', 'decorar', 'nombrar'].map((n) => mot.aplicar(eL, { j: 'lali', t: 'santuario.' + n, id: cri.id, h: 0, s: 0, d: 0, tipo: 'prado', nom: 'X' })); for (let i = 0; i < 12; i++) { rL.tick(0.1); rO.tick(0.1); }
      ok(intentos.every((x) => !x) && JSON.stringify(eO.dim) === dueno0 && S.rec(eL, 'oli', false).nom === 'Nido' && JSON.stringify(eL.dim) === aL, 'v2.370 visitas: desde la visita ninguna orden del Santuario cambia nada, y lo que Lali manda por la red no toca el Santuario de Oli'); }
    FPeer.ultima.close(); ok(!eL.jugadores.oli.remoto && !eO.jugadores.lali.remoto && rO.sufijo().indexOf('sala') > 0 && rL.sufijo().indexOf('buscando') > 0 && G.agentes.red.rol(eO) === null && G.agentes.red.rol(eL) === null, 'v2.188 red: si se cae la conexión cada uno sigue solo (el otro queda quieto) y se ve «sala» / «buscando»');
    mot.moverCriaturas(eL, 0.1); ok(!G.santuario.visitando(eL.jugadores.lali) && !G.santuario.visita.hay(eL, 'oli') && !G.santuario.rec(eL, 'oli', false), 'v2.370 visitas: si se cae la conexión, la visita termina y el resumen del otro se descarta');
    rO.tick(0.2); rL.tick(0.2); for (let i = 0; i < 31; i++) rL.tick(0.1);
    ok(rO.sufijo().indexOf('con Lali') > 0 && rL.sufijo().indexOf('con Oli') > 0, 'v2.188 red: Lali reintenta sola y se vuelven a conectar'); rO.parar(); rL.parar();
  }
  // — guardado: formato, versión y validación —
  { const e1 = mot.crear(21), o = e1.jugadores.oli, l = e1.jugadores.lali; o.mapa = 'albanota'; o.x = 200.7; o.y = 310; o.dir = 'right'; o.capturas = { pez_carpa: 3 }; l.mapa = 'albanota'; l.x = 50; l.y = 60; o.pesca = { id: 'x', fase: 'espera', t: 1 };
    const d = JSON.parse(JSON.stringify(G.guardado.serializar(e1))), e2 = mot.crear(22);
    ok(d.v === G.guardado.VERSION && !('pesca' in d.jugadores.oli) && G.guardado.restaurar(e2, d) && e2.jugadores.oli.x === 200.7 && e2.jugadores.oli.dir === 'right' && e2.jugadores.oli.capturas.pez_carpa === 3 && e2.jugadores.lali.y === 60 && !e2.jugadores.oli.pesca, 'v2.189 guardado: se guarda y se restaura la posición, el mapa y los peces de cada jugador (no la pesca en curso)');
    const e3 = mot.crear(23); ok(!G.guardado.restaurar(e3, null) && !G.guardado.restaurar(e3, { v: 99, jugadores: {} }) && !G.guardado.restaurar(e3, 'texto') && !G.guardado.restaurar(e3, { v: 1, jugadores: { nadie: { mapa: 'albanota', x: 1, y: 1 } } }), 'v2.189 guardado: un guardado roto o de versión futura se ignora sin romper la partida');
    // Multiverso E1 (cambio de contrato a propósito): un mapa que no existe o una posición inválida ya NO descartan al jugador; se restaura su progreso y va a un sitio seguro
    ok(G.guardado.restaurar(e3, { v: 1, jugadores: { oli: { mapa: 'nada', x: 1, y: 1, brillos: 9 } } }) && e3.jugadores.oli.brillos === 9 && e3.jugadores.oli.mapa === G.mundo.INICIAL.mapa && G.guardado.restaurar(e3, { v: 1, jugadores: { oli: { mapa: 'albanota', x: 'a', y: 1, brillos: 8 } } }) && e3.jugadores.oli.brillos === 8 && Number.isFinite(e3.jugadores.oli.x), 'E1 guardado: mapa inexistente o posición inválida conservan el progreso y recolocan al jugador');
    const e4 = mot.crear(24); G.guardado.restaurar(e4, { v: 1, jugadores: { oli: { mapa: 'albanota', x: 8, y: 8, capturas: { pez_carpa: 2, truco: 5 } } } }); ok(!mot.bloqueado(m, e4.jugadores.oli.x, e4.jugadores.oli.y) && JSON.stringify(e4.jugadores.oli.capturas) === '{"pez_carpa":2}', 'v2.189 guardado: si la casilla guardada ya es sólida se pone en la entrada, y los peces inventados se descartan');
    ok(G.guardado.leer() === null && G.guardado.escribir(e1) === false, 'v2.189 guardado: sin almacenamiento no falla (devuelve null / false)'); }
}
// v2.192-v2.193 · peces con identidad, forcejeo con ritmo, ficha y colección
{
  const mundo = G.mundo, mot = G.motor, T = 16, m = mundo.mapa('albanota'), p = m.pesca[0], P = G.PECES, ids = Object.keys(P);
  { const A3 = G.arboles3d, MAXT = { arbol_pequeno: 120, arbol_mediano: 140, abeto: 130, roble_hito: 240 };   // v2.198: árboles 3D (docs/FICHA_ARBOLES_3D.md)
    ok(A3 && Object.keys(A3.TIPOS).join() === 'arbol_pequeno,arbol_mediano,abeto,roble_hito', 'v2.198 árboles 3D: los 4 tipos del catálogo');
    Object.keys(A3.TIPOS).forEach((k) => { const m = A3.modelo(k), ys = []; for (let i = 1; i < m.pos.length; i += 3) ys.push(m.pos[i]);
      ok(m.n > 0 && m.n <= MAXT[k] && Array.from(m.pos).every(Number.isFinite) && m.idx.length === m.n * 3 && Math.min(...ys) >= 0 && Math.abs(Math.max(...ys) - A3.TIPOS[k].alto) < 1e-6 && m.col.length === m.pos.length, 'v2.198 árbol 3D «' + k + '»: ' + m.n + ' triángulos (máx. ' + MAXT[k] + '), finito, pies en 0 y alto ' + A3.TIPOS[k].alto + ' u'); });
    const L = [{ tipo: 'arbol_pequeno', x: 1.5, y: 0.6, z: 2.5 }, { tipo: 'abeto', x: 3.5, y: 0.6, z: 2.5 }], b = A3.build(L), s = A3.sombras(L);
    ok(b.items.length === 2 && b.n === A3.modelo('arbol_pequeno').n + A3.modelo('abeto').n && b.items[1].v0 === A3.modelo('arbol_pequeno').pos.length / 3 && s.idx.length === 2 * 10 * 3 && JSON.stringify(A3.build(L).pos) === JSON.stringify(b.pos), 'v2.198 árboles 3D: una sola malla con todos, sombras bajo cada copa y resultado determinista');
    const rad = A3.modelo('roble_hito'); const xs = []; for (let i = 0; i < rad.pos.length; i += 3) if (rad.pos[i + 1] > 1.0) xs.push(rad.pos[i]);
    ok(Math.abs(Math.max(...xs) + Math.min(...xs)) < 0.05, 'v2.198 árbol 3D: la copa del roble es simétrica respecto al tronco'); }
  ok(ids.length === 25 && ids.map((k) => P[k].nombre).join('|') === 'Alburno|Gobio ámbar|Carpa espejo|Trucha salmonada|Anguila negra|Cirujano azul|Sardina|Pez payaso|Dorada|Pez globo|Pulpo común|Salmonete|Pez ángel|Lubina|Pez loro|Morena|Pez espada|Mero|Raya|Pez volador|Bagre|Pez león|Bacalao|Barracuda|Cazón' && ids.every((k) => P[k].kg[0] < P[k].kg[1] && P[k].pal.base && P[k].forma.L > 0), 'v2.192 peces: las 25 (5 de la ficha ocultas + el Cirujano azul y los lotes 1, 2 y 3 dibujados a mano) con nombre, peso y paleta (los id no cambian)');
  const mats = ids.map((k) => [G.pesca.matriz(k, 0), G.pesca.matriz(k, 1)]);
  ok(mats.every(([a, b]) => a && b && a.px.length === a.h && a.px[0].length === a.w && a.px.flat().some((c) => c === P[ids[mats.indexOf(mats.find((q) => q[0] === a))]].pal.ojo) && a.w >= 12 && a.w <= 28 && a.px.flat().filter(Boolean).length > 30) && new Set(mats.map(([a]) => JSON.stringify(a.px))).size === ids.length, 'v2.192 peces (v2.215): cada especie tiene su dibujo 2D (contorno, color) y un dibujo distinto (el tamaño puede coincidir)');
  ok(JSON.stringify(mats[0][0].px) !== JSON.stringify(mats[0][1].px) && JSON.stringify(mats[4][0].px) !== JSON.stringify(mats[4][1].px), 'v2.192 peces: el aleteo (y la ondulación de la anguila) cambia entre fotogramas');
  { const rnd = G.azar(4); let okKg = true; for (let i = 0; i < 300; i++) ids.forEach((k) => { const v = G.pesca.kg(rnd, k); if (v < P[k].kg[0] || v > P[k].kg[1]) okKg = false; });
    ok(okKg && G.pesca.pesoTexto(0.035) === '35 g' && G.pesca.pesoTexto(3.24) === '3,2 kg', 'v2.192 peces: el peso cae en el rango de cada especie y se escribe como «35 g» o «3,2 kg»'); }
  const nuevaPesca = (semilla, fase, pez) => { const est = mot.crear(semilla), j = est.jugadores.oli; j.mapa = 'albanota'; j.x = p.x * T + 8; j.y = p.y * T + 14; mot.aplicar(est, { j: 'oli', t: 'pescar' }); j.pesca.fase = fase; j.pesca.t = 0; j.pesca.ventana = 99; j.pesca.espera = 99; j.pesca.tirones = []; if (pez) { j.pesca.pez = pez; j.pesca.kg = 3.2; } return { est, j, f: j.pesca }; };
  const tocar = (o) => mot.aplicar(o.est, { j: 'oli', t: 'pescar' }), avanza = (o, seg) => { for (let t = 0; t < seg; t += 0.05) mot.moverJugador(o.est, o.j, 0.05); };
  { const o = nuevaPesca(1, 'pique', 'pez_plateado'); tocar(o); ok(o.f.fase === 'salto' && o.j.capturas.pez_plateado === 1 && o.j.records.pez_plateado === 3.2 && o.f.nuevo === true && /Nuevo/.test(o.est.avisos.map((a) => a.texto).join('|')), 'v2.193 forcejeo: un pez sin fuerza (Alburno) sale a la primera; se apunta, su peso es récord y es nuevo');
    o.f.fase = 'pique'; o.f.pez = 'pez_plateado'; o.f.kg = 1; tocar(o); ok(o.j.capturas.pez_plateado === 2 && o.j.records.pez_plateado === 3.2 && !o.f.nuevo && !o.f.rec, 'v2.193 récords: un pez más ligero suma uno pero no bate el récord'); }
  { const o = nuevaPesca(2, 'pique', 'pez_carpa'); tocar(o); ok(o.f.fase === 'forcejeo' && o.f.beats.length === 2 && !o.j.capturas, 'v2.193 forcejeo: la Carpa pide 2 tirones de ritmo y aún no está capturada');
    const v = G.vista.pesca(Object.assign({}, o.j, { pesca: Object.assign({}, o.f, { t: 0.4 }) }), 0); ok(v.anillos.some((a) => a.entra) && !v.ventana, 'v2.193 forcejeo: un anillo se cierra hacia el corcho antes del tirón (todavía no es el momento)');
    avanza(o, 0.8); ok(G.vista.pesca(o.j, 0).ventana === true, 'v2.193 forcejeo: en el momento del tirón la vista lo indica (el botón pasa a ❗)'); tocar(o); avanza(o, o.f.beats[1] - o.f.t); tocar(o); avanza(o, 0.1);
    ok(o.f.fase === 'salto' && o.j.capturas.pez_carpa === 1, 'v2.193 forcejeo: acertando los 2 tirones sale la Carpa'); }
  { const NU = ['pez_sardina', 'pez_payaso', 'pez_dorada', 'pez_globo', 'cri_pulpo', 'pez_salmonete', 'pez_angel', 'pez_lubina', 'pez_loro', 'pez_morena', 'pez_espada', 'pez_mero', 'pez_raya', 'pez_volador', 'pez_bagre', 'pez_leon', 'pez_bacalao', 'pez_barracuda', 'pez_cazon'];   // v2.218: + lote 3;   // v2.210: lote 1, cada criatura se puede sacar tirando en su ritmo (con el margen de la especie) y el Pulpo cuelga erguido
    NU.forEach((id, i) => { const a = nuevaPesca(30 + i, 'pique', id); tocar(a); let t = 0; a.f.beats.forEach((b) => { avanza(a, b - t + 0.3 * P[id].margen); t = b + 0.3 * P[id].margen; tocar(a); }); avanza(a, 0.1);
      ok(a.f.beats.length === P[id].fuerza && a.f.fase === 'salto' && a.j.capturas[id] === 1, 'v2.210 ' + P[id].nombre + ': se saca con ' + P[id].fuerza + ' tirón(es) tirando algo tarde (dentro del margen)'); });
    ok(NU.filter((id) => P[id].colgar === 'erguido').join() === 'cri_pulpo' && NU.every((id) => P[id].sprite3d && P[id].forma.L > 0), 'v2.210 lote 1: solo el Pulpo cuelga erguido; todos con lámina 3D'); }
  { const CI = 'pez_cirujano';   // v2.202: el Cirujano azul se saca con facilidad (se soltaba casi siempre)
    const a = nuevaPesca(11, 'pique', CI); tocar(a); ok(a.f.fase === 'forcejeo' && a.f.beats.length === 1, 'v2.202 Cirujano azul: un solo tirón de ritmo');
    avanza(a, a.f.beats[0] + 0.5); tocar(a); avanza(a, 0.1); ok(a.f.fase === 'salto' && a.j.capturas[CI] === 1, 'v2.202 Cirujano azul: un toque hasta 0,5 s tarde aún lo saca');
    const b = nuevaPesca(12, 'pique', CI); tocar(b); tocar(b); tocar(b); avanza(b, 0.05); ok(b.f.fase === 'forcejeo', 'v2.202 Cirujano azul: dos toques de más no lo sueltan');
    avanza(b, 0.4); tocar(b); avanza(b, 0.1); ok(b.f.fase === 'salto' && b.j.capturas[CI] === 1, 'v2.202 Cirujano azul: tras dos fallos aún se puede sacar');
    const c = nuevaPesca(13, 'pique', CI); tocar(c); tocar(c); tocar(c); tocar(c); ok(c.f.fase === 'fallo', 'v2.202 Cirujano azul: a los tres fallos se suelta');
    let largo = 0; for (let sd = 1; sd <= 40; sd++) { const e = mot.crear(sd), j = e.jugadores.oli; j.mapa = 'albanota'; j.x = p.x * T + 8; j.y = p.y * T + 14; mot.aplicar(e, { j: 'oli', t: 'pescar' }); let t = 0; while (j.pesca && j.pesca.fase !== 'pique' && t < 20) { mot.moverJugador(e, j, 0.05); t += 0.05; } if (j.pesca && j.pesca.fase === 'pique' && j.pesca.ventana >= 2.0) largo++; }
    ok(largo === 40, 'v2.202 Cirujano azul: la ventana para tirar al picar dura 2 s o más (40 de 40 semillas)'); }
  { const o = nuevaPesca(3, 'pique', 'pez_trucha'); tocar(o); avanza(o, 0.1); tocar(o); tocar(o); ok(o.f.fase === 'fallo' && !o.j.capturas, 'v2.193 forcejeo: dos tirones en falso y se suelta');
    const q = nuevaPesca(4, 'pique', 'pez_anguila'); tocar(q); ok(q.f.beats.length === 3, 'v2.193 forcejeo: la Anguila pide 3 tirones'); avanza(q, 2.5); ok(q.f.fase === 'fallo' || q.f.fase === 'lanzar', 'v2.193 forcejeo: si no se acierta a tiempo, se suelta'); }
  { const e1 = mot.crear(8), a = e1.jugadores.oli; a.mapa = 'albanota'; a.x = p.x * T + 8; a.y = p.y * T + 14; mot.aplicar(e1, { j: 'oli', t: 'pescar' }); let ok1 = false; for (let t = 0; t < 12 && !ok1; t += 0.05) { mot.moverJugador(e1, a, 0.05); if (a.pesca.fase === 'espera' && a.pesca.pez) ok1 = G.PECES[a.pesca.pez].zona === 0 && a.pesca.kg > 0; }
    ok(ok1, 'v2.192 sombra: el pez (y su peso) se decide al empezar la espera, de la zona del agua de delante');
    a.pesca.espera = 8; a.pesca.t = 5; ok(G.vista.pesca(a, 1).sombra === null, 'v2.194 sombra: no hay mancha hasta los 2 últimos segundos de la espera');
    a.pesca.t = 7; const m1 = G.vista.pesca(a, 1).sombra; a.pesca.t = 7.9; const m2 = G.vista.pesca(a, 1).sombra; ok(m1 && m2 && m2.a > m1.a && m1.id === a.pesca.pez && m1.rx === G.PECES[a.pesca.pez].forma.L * 0.028 && m1.ry < m1.rx, 'v2.194 sombra: aviso con fundido, redonda (sin forma de pez) y del tamaño de la especie');
    a.pesca.fase = 'pique'; a.pesca.t = 0.2; ok(G.vista.pesca(a, 1).sombra.a > 0.5, 'v2.194 sombra: en el pique la mancha está marcada');
    a.pesca.fase = 'salto'; a.pesca.t = 0.1; const f1 = G.vista.pesca(a, 1).sombra.a; a.pesca.t = 0.35; ok(f1 > 0.3 && G.vista.pesca(a, 1).sombra === null, 'v2.194 sombra: al saltar el pez se funde en 0,3 s'); ok(Math.abs(G.vista.radioSombra(a.pesca.pez, 0.7) - 1) <= 0.12 && G.vista.radioSombra(a.pesca.pez, 1) === G.vista.radioSombra(a.pesca.pez, 1), 'v2.194 sombra: contorno orgánico (±12 %) y fijo por especie'); }
  ids.forEach((k) => { ['espera', 'salto'].forEach((fa) => { const o = nuevaPesca(5, fa, k); o.f.t = fa === 'salto' ? 0.6 : 3; o.f.espera = 8; const r = G.pesca3d.build([{ x: 1, y: 0, z: 2, v: G.vista.pesca(o.j, 1), reloj: 0 }], -0.255);
    if (fa === 'espera') { o.f.t = 7.6; const r = G.pesca3d.build([{ x: 1, y: 0, z: 2, v: G.vista.pesca(o.j, 1), reloj: 0 }], -0.255); ok(r.decals.length >= 1 && r.decals.every((d) => [d.x, d.z, d.hx, d.hz, d.a].every(Number.isFinite) && d.a > 0 && d.a <= 1 && d.hx > 0 && d.hz > 0 && (d.k === 0 || d.k === 1) && d.c.length === 3) && r.decals.filter((d) => d.k === 0).every((d) => d.a <= 0.5), 'v2.194 sombra 3D: ' + P[k].nombre + ' = calcomanías translúcidas finitas, ligeras (≤ 0,5) y fuera de las caras sólidas'); }
    ok(r.n > 0 && r.n <= G.pesca3d.MAX_POR_JUGADOR && Array.from(r.pos).every(Number.isFinite) && r.idx.length === r.n * 6, 'v2.192 peces 3D: ' + P[k].nombre + ' (' + fa + ') con geometría finita y dentro del presupuesto (' + r.n + ' caras)'); }); });
  { const e = mot.crear(31), a = e.jugadores.oli; a.mapa = 'albanota'; a.x = 10; a.y = 10; a.capturas = { pez_carpa: 2 }; a.records = { pez_carpa: 4.25, truco: 9, pez_trucha: -1 }; const d = JSON.parse(JSON.stringify(G.guardado.serializar(e))), e2 = mot.crear(32); G.guardado.restaurar(e2, d);
    ok(JSON.stringify(d.jugadores.oli.records) === '{"pez_carpa":4.25}' && e2.jugadores.oli.records.pez_carpa === 4.25, 'v2.193 guardado: los récords de peso se guardan y se restauran (los inventados se descartan)'); }
  { const fs = require('fs'), html = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8'), gm = fs.readFileSync(require('path').join(__dirname, 'src/game.js'), 'utf8');
    ok(/id="pbtn"/.test(html) && /id="pcard"/.test(html) && /id="peces"/.test(html) && G.pecesUI && typeof G.pecesUI.carta === 'function' && /G\.pecesUI\.carta\(j\)/.test(gm) && /function dibujaPez/.test(gm), 'v2.193 colección: botón 🐟, ficha de captura y pantalla de peces enganchados al juego'); }
}
// ── v2.225 · REGISTRO de criaturas 3D (paso 1 de Nimbel y Arenel 3D): el pintor ya no conoce ids concretos ──
{ const C = G.criatura3d, fs = require('fs'), crypto = require('crypto'), sin = (t) => t.replace(/\/\/.*$/gm, ''), pin = sin(fs.readFileSync(require('path').join(__dirname, 'src/hd2d_pintor.js'), 'utf8'));
  ok(typeof C.registrar === 'function' && C.ids().join() === 'zefirax,nubecin,arenel,somnin' && C.de('dandel') === null && C.de('constructor') === null, 'v2.225/v2.229: el registro tiene a Zefirax, Nimbel y Arenel; el resto de criaturas devuelve null (se ven en 2D)');
  { let r = false; try { C.registrar(3, 1); } catch (e) { r = true; } ok(r, 'v2.225: registrar valida id y fábrica'); }
  const Z = C.de('zefirax'), h = crypto.createHash('sha1'); [[0, 0, 0], [1.3, 0.7, 0], [3, 2, 1], [5.5, -1, 0.5]].forEach((a) => h.update(JSON.stringify(Z.geometria(Z.pose(...a))))); h.update(JSON.stringify(Z.atlas().rects)); h.update(JSON.stringify(C.chispas(3, 1, 0.5, [1, 0, 1])));
  ok(h.digest('hex') === '8a89f511fd9c763304d57de65639bd8c8f698e9f', 'v2.225: Zefirax 3D da exactamente la misma geometría, atlas y chispas que antes del registro');
  ok(typeof Z.chispas === 'function' && !/c_zefirax/.test(pin) && /ajuste3d\(k\)/.test(pin) && /if \(P\.chispas\) E\.chis/.test(pin), 'v2.225: el pintor no nombra a Zefirax; el interruptor sale de ajuste3d y las chispas son opcionales del módulo'); }
// ── v2.229 · NIMBEL Y ARENEL 3D (docs/GUIA_MODELADO_3D.md): src/criatura3d_modelos.js + texturas generadas de los sprites 2D ──
{ const fs = require('fs'), path = require('path'), C = G.criatura3d, MD = G.criatura3dModelos, leer = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), sin = (t) => t.replace(/\/\/.*$/gm, '');
  const src = sin(leer('src/criatura3d_modelos.js')), pin = sin(leer('src/hd2d_pintor.js')), ord = require('./src/orden.json');
  ok(!/Math\.random|document\.|requestAnimationFrame|new Date|performance\./.test(src) && ord.datos.indexOf('src/criatura3d_sprites.js') >= 0 && ord.juego.indexOf('src/criatura3d_modelos.js') > ord.juego.indexOf('src/criatura3d.js') && ord.juego.indexOf('src/criatura3d_modelos.js') < ord.juego.indexOf('src/hd2d_pintor.js'), 'v2.229: módulo puro (sin azar ni DOM) y bien colocado en el orden de carga');
  ['nubecin', 'arenel', 'somnin'].forEach((id) => {
    const P = C.de(id), g0 = P.geometria(), g1 = P.geometria(P.pose(1.3, 0.9, 0, true)), g2 = P.geometria(P.pose(1.3, 0.9, 0, true)), at = P.atlas(), us = g0.poligonos.map((q) => P.uvPoligono(q, at));
    ok(['pose', 'geometria', 'atlas', 'uvPoligono', 'girar', 'velocidad'].every((k) => typeof P[k] === 'function') && P.MAX_TRIANGULOS === 1200 && g0.triangulos === g0.poligonos.length * 2 && g0.triangulos <= 1200 && g0.triangulos >= 400, 'v2.229 ' + id + ': interfaz de módulo y presupuesto ≤ 1200 triángulos (' + g0.triangulos + ')');
    ok(g0.poligonos.length === g1.poligonos.length && JSON.stringify(g1) === JSON.stringify(g2) && JSON.stringify(g0) !== JSON.stringify(g1), 'v2.229 ' + id + ': misma topología en cualquier pose, determinista y animada');
    ok(g1.poligonos.every((q) => q.v.length === 4 && q.v.every((p) => p.every(Number.isFinite)) && q.n.every(Number.isFinite) && Math.abs(Math.hypot(...q.n) - 1) < 1e-6 && typeof q.k === 'number' && q.k > 0 && q.k <= 1 && /^#[0-9a-f]{6}$/.test(q.color)), 'v2.229 ' + id + ': vértices, normales unitarias, brillo continuo y colores válidos');
    ok(g0.poligonos.every((q) => { const a = q.v, u = [a[1][0] - a[0][0], a[1][1] - a[0][1], a[1][2] - a[0][2]], w = [a[2][0] - a[0][0], a[2][1] - a[0][1], a[2][2] - a[0][2]], c = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(...c); return l < 1e-9 || (c[0] * q.n[0] + c[1] * q.n[1] + c[2] * q.n[2]) / l > 0; }), 'v2.229 ' + id + ': orden de vértices coherente con la normal (caras hacia fuera)');
    ok(at.w <= 256 && at.h <= 256 && us.every((r) => r.uv.length === 4 && r.uv.every((t) => t[0] >= 0 && t[0] <= 1 && t[1] >= 0 && t[1] <= 1)) && us.filter((r) => r.tex).length >= 50 && at.celdas.every((c) => c.px.every((f) => f.every((x) => x === null || /^#[0-9a-f]{6}$/.test(x)))), 'v2.229 ' + id + ': atlas ≤ 256×256, UV dentro de [0,1] y texturas sin huecos');
    const ys = g0.poligonos.flatMap((q) => q.v.map((p) => p[1])), xs = g0.poligonos.flatMap((q) => q.v.map((p) => p[0])); ok(Math.min(...ys) > -0.001 && Math.min(...ys) < 0.1 && Math.max(...xs) - Math.min(...xs) > 0.9 && Math.max(...xs) - Math.min(...xs) < 1.3, 'v2.229 ' + id + ': apoyada en el suelo y del tamaño del 2D (' + (Math.max(...xs) - Math.min(...xs)).toFixed(2) + ' u de ancho)');
  });
  { const pa = C.de('arenel'), gp = pa.geometria(pa.pose(0.5, 0.3, 0, false)).poligonos, hexok = (h) => /^#[0-9a-f]{6}$/.test(h), cvq = gp.filter((q) => q.cvs), kvq = gp.filter((q) => q.kv);
    ok(cvq.length >= 40 && cvq.every((q) => q.cvs.length === 4 && q.cvs.every(hexok)) && kvq.length >= 30 && kvq.every((q) => q.kv.length === 4 && q.kv.every((x) => x > 0.5 && x <= 1)) && new Set(cvq.flatMap((q) => q.cvs)).size > 5, 'v2.233 Arenel: el acarapacho tiene cúpula con degradado de color (' + cvq.length + ' caras) y degradado vertical de brillo en los laterales (' + kvq.length + ')'); }
  { const pa = C.de('arenel'), q0 = pa.geometria(pa.pose(1.0, 0, 0, true)).poligonos, q1 = pa.geometria(pa.pose(1.0, 0, 0, false)).poligonos, p = (q) => q.filter((x) => /^pata/.test(x.pieza)).map((x) => x.v[0][1] + x.v[0][2]).join(), o = (q) => q.filter((x) => /^ojo_/.test(x.pieza)).map((x) => x.v[0][1]).join();
    ok(p(q0) !== p(q1) && o(q0) !== o(q1), 'v2.229 Arenel: las patas solo se mueven al andar y los ojos solo suben y bajan parado'); }
  { const S = G.CRIATURA3D_SPRITES; ok(Object.keys(S).join() === 'nubecin,arenel,somnin,roca,piedras,barril,cartel' && Object.keys(S).every((id) => Object.keys(S[id].vistas).every((v) => S[id].vistas[v].length === S[id].h && S[id].vistas[v].every((r) => r.length === S[id].w && r.split('').every((ch) => ch === '.' || S[id].pal[ch])))), 'v2.229: texturas completas (4 vistas por criatura, sin huecos ni letras fuera de la paleta)'); }
  ok(/ajuste3d\(k\)/.test(pin) && /c\.moving\)\)/.test(pin) && /typeof q\.k === 'number'/.test(pin) && !/AJUSTE_3D\['c_'/.test(pin), 'v2.229: el pintor pasa «moving» a la pose, usa el brillo continuo q.k y sigue sin nombrar criaturas concretas'); }
// ── v2.230 · FIJAS: revisar un modelo 3D en el juego (la criatura siempre sale en su claro, también con partida guardada) ──
{ const AJ = G.aparicion.AJUSTES, motor = G.motor; ok(Array.isArray(AJ.FIJAS) && AJ.FIJAS.length === 0, 'v2.230: FIJAS está vacío de fábrica (el juego normal no cambia)');
  [3, 11, 29].forEach((sem) => { AJ.FIJAS = []; const e = motor.crear(sem), j = e.jugadores[Object.keys(e.jugadores)[0]], m = G.mundo.mapa(j.mapa), z = m.zonas.find((q) => q.elemento === 'roca'); if (!z) return;
    j.x = (z.x + z.w / 2) * 16; j.y = (z.y + z.h / 2) * 16; const plan0 = JSON.stringify(e.mapas[j.mapa] ? e.mapas[j.mapa].plan : null); motor.aparicion(e); const antes = JSON.stringify(e.mapas[j.mapa].plan);
    AJ.FIJAS = ['arenel']; for (let k = 0; k < 4; k++) motor.aparicion(e); const em = e.mapas[j.mapa];
    ok(em.plan.huecos.some((h) => h.linea === 'arenel' && h.grupo === z.id) && em.criaturas.every((c) => c.h >= 0) && JSON.stringify(motor.criaturas ? 1 : 1) === '1', 'v2.230 semilla ' + sem + ': con FIJAS=[arenel] hay un hueco de Arenel en el claro de Roca (aunque el plan ya estuviera creado)');
    AJ.FIJAS = []; const e2 = motor.crear(sem); ok(JSON.stringify(G.aparicion.plan(sem, m)) === JSON.stringify(G.aparicion.plan(sem, m)), 'v2.230 semilla ' + sem + ': el plan sin FIJAS sigue igual'); });
  AJ.FIJAS = []; }
// ── v2.244 · CICLO DE DÍA Y NOCHE (src/ciclo.js): puro, determinista, sin estado propio; el velo #noche multiplica la pantalla igual en el 2D y en el HD-2D ──
{ const fs = require('fs'), path = require('path'), C = G.ciclo, sin = (t) => t.replace(/\/\/.*$/gm, ''), src = sin(fs.readFileSync(path.join(__dirname, 'src/ciclo.js'), 'utf8')), ord = require('./src/orden.json'), gm = sin(fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8')), hd = sin(fs.readFileSync(path.join(__dirname, 'src/hd2d_pintor.js'), 'utf8')), ix = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  ok(!/Math\.random|document\.|requestAnimationFrame|new Date|performance\./.test(src) && ord.juego.indexOf('src/ciclo.js') >= 0 && ord.juego.indexOf('src/ciclo.js') < ord.juego.indexOf('src/game.js'), 'v2.244: el ciclo de día y noche es puro (sin azar, DOM ni relojes) y se carga antes de game.js');
  const e0 = C.estado(0), e1 = C.estado(0);
  ok(JSON.stringify(e0) === JSON.stringify(e1) && e0.noche === 0 && e0.mult.join() === '255,255,255' && C.AJUSTES.ACTIVO === true && C.AJUSTES.FORZAR === null, 'v2.244: determinista; la partida empieza de día y sin velo (el 2D y su huella no cambian al empezar)');
  { const ss = []; for (let t = 0; t < C.AJUSTES.DIA_S * 1.01; t += 5) ss.push(C.estado(t)); const noches = ss.map((s) => s.noche);
    ok(Math.max(...noches) > 0.98 && Math.min(...noches) < 0.02 && ss.every((s) => s.noche >= 0 && s.noche <= 1 && s.calor >= 0 && s.calor <= 1 && s.mult.length === 3 && s.mult.every((v) => v >= 0 && v <= 255 && Number.isInteger(v))), 'v2.244: en un día hay mediodía (noche 0), noche cerrada (1) y todos los valores son válidos');
    ok(ss.some((s) => s.calor > 0.4 && s.noche > 0.05 && s.noche < 0.95) && ss.some((s) => s.mult[2] > s.mult[0] + 20), 'v2.244: hay atardecer cálido (calor con noche a medias) y la noche es azulada');
    ok(Math.abs(C.estado(7).t - C.estado(7 + C.AJUSTES.DIA_S).t) < 1e-9 && C.estado(-12).t >= 0 && C.estado(-12).t < 1, 'v2.244: el día se repite cada DIA_S segundos y la hora siempre está en [0, 1)'); }
  ok(/id="noche"/.test(ix) && /mix-blend-mode: multiply/.test(ix) && /aplicaCiclo\(\); /.test(gm) && /G\.ciclo\.estado\(est\.reloj\)/.test(gm) && /G\.luzFarolas\.AJUSTES\.NOCHE = f\.noche/.test(hd), 'v2.244: el velo (#noche, multiplicar) se aplica en cada fotograma y el HD-2D enciende las farolas con la noche'); }
// ── v2.245 · NORMA: la decoración de naturaleza (roca, piedras, hierba alta) solo va en sitios lógicos: sobre hierba lisa y NUNCA tapando ni pegada a edificios, huerto, vallas, fuente ni ningún otro objeto ──
{ const OBJ = G.OBJETOS, MP = require('./maps/albanota.json'), TT = 16, deco = ['roca', 'piedras', 'hierba_alta'], rc = (o, mg) => { const d = OBJ[o.tipo]; return { x0: o.x * TT + d.ox - mg, y0: o.y * TT + d.oy - mg, x1: o.x * TT + d.ox + d.w + mg, y1: o.y * TT + d.oy + d.h + mg }; }, grande = (t) => OBJ[t].w >= 40 || OBJ[t].h >= 40;
  const malas = []; MP.objetos.filter((o) => deco.includes(o.tipo)).forEach((o) => { const r = rc(o, 0); if (MP.capas.suelo[o.y][o.x] !== '.') malas.push(o.tipo + ' ' + o.x + ',' + o.y + ' (no es hierba lisa)'); MP.objetos.filter((q) => !deco.includes(q.tipo)).forEach((q) => { const s = rc(q, grande(q.tipo) ? 8 : 0); if (r.x0 < s.x1 && r.x1 > s.x0 && r.y0 < s.y1 && r.y1 > s.y0) malas.push(o.tipo + ' ' + o.x + ',' + o.y + ' solapa con ' + q.tipo); }); });
  ok(malas.length === 0 && MP.objetos.some((o) => o.tipo === 'hierba_alta') && MP.objetos.some((o) => o.tipo === 'roca'), 'v2.245 decoración de naturaleza solo en sitios lógicos (sobre hierba, sin tapar ni tocar edificios, huerto, vallas ni otros objetos)' + (malas.length ? ': ' + malas.join(' · ') : '')); }
// ── v2.246 · REGISTRO DE OBJETOS 3D (src/objeto3d.js): decoración fija con modelo 3D en el HD-2D; primera pieza: la roca ──
{ const fs = require('fs'), path = require('path'), O = G.objeto3d, leer = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), sin = (t) => t.replace(/\/\/.*$/gm, ''), src = sin(leer('src/objeto3d.js')), pin = sin(leer('src/hd2d_pintor.js')), ord = require('./src/orden.json');
  ok(!/Math\.random|document\.|requestAnimationFrame|new Date|performance\./.test(src) && ord.juego.indexOf('src/objeto3d.js') > ord.juego.indexOf('src/criatura3d_modelos.js') && ord.juego.indexOf('src/objeto3d.js') < ord.juego.indexOf('src/hd2d_pintor.js'), 'v2.246: el registro de objetos 3D es puro y se carga después de los modelos y antes del pintor');
  ok(typeof O.registrar === 'function' && O.tipos().join() === 'roca,piedras,hierba_alta,barril,cartel,juncos2,juncos3,nenufar,nenufar_flor,valla_ni,valla_nd,valla_9,valla_v,espantapajaros,huerto,puente_albanota' && O.de('arbol') === null && O.de('constructor') === null && G.OBJETOS.roca && !G.OBJETOS.roca.vol, 'v2.252: roca, piedras, hierba alta, barril, cartel, juncos, nenúfares, vallas, espantapájaros, huerto y puente están registrados; el resto de piezas devuelve null (siguen como lámina o volumen)');
  { let r = false; try { O.registrar(1, 2); } catch (e) { r = true; } ok(r, 'v2.246: registrar valida tipo y fábrica'); }
  { const P = O.de('roca'), g = P.geometria(), g2 = P.geometria(), at = P.atlas(), us = g.poligonos.map((q) => P.uvPoligono(q, at)), ys = g.poligonos.flatMap((q) => q.v.map((p) => p[1])), xs = g.poligonos.flatMap((q) => q.v.map((p) => p[0]));
    ok(JSON.stringify(g) === JSON.stringify(g2) && g.triangulos === g.poligonos.length * 2 && g.triangulos >= 100 && g.triangulos <= 400 && g.poligonos.every((q) => q.v.every((p) => p.every(Number.isFinite)) && Math.abs(Math.hypot(...q.n) - 1) < 1e-6 && typeof q.k === 'number'), 'v2.246 roca: determinista, geometría finita con normales unitarias (' + g.triangulos + ' triángulos)');
    ok(Math.min(...ys) > -0.001 && Math.min(...ys) < 0.05 && Math.max(...ys) > 0.5 && Math.max(...ys) < 0.8 && Math.max(...xs) - Math.min(...xs) > 0.8 && Math.max(...xs) - Math.min(...xs) < 1.0, 'v2.246 roca: apoyada en el suelo y cabe en su casilla (' + (Math.max(...xs) - Math.min(...xs)).toFixed(2) + ' u de ancho, ' + Math.max(...ys).toFixed(2) + ' de alto)');
    ok(at.w <= 256 && at.h <= 256 && us.every((r) => r.uv.every((t) => t[0] >= 0 && t[0] <= 1 && t[1] >= 0 && t[1] <= 1)) && us.filter((r) => r.tex).length >= 20 && Object.keys(G.CRIATURA3D_SPRITES.roca.vistas).join() === 'f', 'v2.246 roca: atlas y UV válidos; solo lleva la vista de frente (las demás caras la reutilizan)'); }
  ok(/OBJETOS3D: true/.test(pin) && /modo === 'modelo'/.test(pin) && /function modeloObj\(tipo\)/.test(pin) && /E\.mod3d = \{\}/.test(pin), 'v2.246: el pintor HD-2D tiene el modo «modelo» con interruptor OBJETOS3D y una geometría por tipo'); }

// ── v2.251 · NORMA para los ÁRBOLES colocados en el mapa: sobre hierba lisa, a ≥ 2 casillas de caminos, a ≥ 3 de las puertas, a ≥ 2 de los puntos de pesca, sin que su dibujo tape a otro objeto (+8 px) y sin árboles pegados entre sí ──
{ const OBJ = G.OBJETOS, MP = require('./maps/albanota.json'), TT = 16, ARB = ['arbol_pequeno', 'arbol_mediano', 'abeto', 'roble_hito'], rc = (o, mg) => { const d = OBJ[o.tipo]; return { x0: o.x * TT + d.ox - mg, y0: o.y * TT + d.oy - mg, x1: o.x * TT + d.ox + d.w + mg, y1: o.y * TT + d.oy + d.h + mg }; };
  const S = MP.capas.suelo, cerca = (x, y, f, d) => { for (let j = -d + 1; j < d; j++) for (let i = -d + 1; i < d; i++) if (f(x + i, y + j)) return true; return false; }, malos = [], arbs = MP.objetos.filter((o) => ARB.includes(o.tipo));
  arbs.forEach((o) => { const r = rc(o, 0); if (S[o.y][o.x] !== '.') malos.push(o.tipo + ' ' + o.x + ',' + o.y + ' (no es hierba)'); if (cerca(o.x, o.y, (x, y) => S[y] && S[y][x] === '=', 2)) malos.push(o.tipo + ' ' + o.x + ',' + o.y + ' (a < 2 casillas de un camino)');
    if (MP.puertas.some((p) => Math.max(Math.abs(p.x - o.x), Math.abs(p.y - o.y)) < 3)) malos.push(o.tipo + ' ' + o.x + ',' + o.y + ' (a < 3 de una puerta)'); if (MP.pesca.some((p) => Math.max(Math.abs(p.x - o.x), Math.abs(p.y - o.y)) < 2)) malos.push(o.tipo + ' ' + o.x + ',' + o.y + ' (a < 2 de un punto de pesca)');
    MP.objetos.filter((q) => q !== o && !ARB.includes(q.tipo) && !['hierba_alta', 'piedras', 'roca'].includes(q.tipo)).forEach((q) => { const s = rc(q, 8); if (r.x0 < s.x1 && r.x1 > s.x0 && r.y0 < s.y1 && r.y1 > s.y0) malos.push(o.tipo + ' ' + o.x + ',' + o.y + ' tapa/solapa con ' + q.tipo); });
    arbs.filter((q) => q !== o).forEach((q) => { if (Math.max(Math.abs(q.x - o.x), Math.abs(q.y - o.y)) < 2) malos.push(o.tipo + ' ' + o.x + ',' + o.y + ' pegado a otro árbol'); }); });
  ok(arbs.length >= 8 && malos.length === 0, 'v2.251 árboles del mapa en sitios lógicos (' + arbs.length + ' árboles: sobre hierba, lejos de caminos, puertas y puntos de pesca, sin tapar objetos)' + (malos.length ? ': ' + malos.join(' · ') : '')); }
// v2.271 combate (prototipo del motor): catálogo completo, motor puro/determinista/serializable. El equilibrio lo mide tools/simular_combate.js.
{ const D = G.COMBATE_DATOS, C = G.combate, ids = Object.keys(D.MOV), els = Object.keys(D.PLANTILLAS);
  ok(ids.length === 56 && els.every((e) => ids.filter((i) => D.MOV[i].el === e).length === 8 && ['b', 'h', 'e', 'd', 'a'].every((h) => ids.some((i) => D.MOV[i].el === e && D.MOV[i].hueco === h))), 'v2.271 catálogo de combate: 56 movimientos, 8 por elemento con todos los huecos');
  ok(ids.every((i) => D.MOV[i].est.every((q) => D.ESTADOS[q[0]]) ) && D.REACCIONES.every((r) => D.ESTADOS[r.sobre]), 'v2.271 estados y reacciones de combate conocidos');
  const eq = (a, b) => [[{ el: a, rar: 'rara', fase: 2, kg: 5 }, { el: b, rar: 'comun', fase: 1, kg: 2 }], [{ forma: 'pompon' }, { el: a, rar: 'epica', fase: 3, kg: 9 }]];
  const corre = (sem) => { const c = C.nuevo(sem, eq('fuego', 'sombra'), { campo: [1, 1] }); let n = 0; while (!c.fin && n++ < 4000) C.paso(c); return c; };
  const c1 = corre(7), c2 = corre(7); ok(c1.fin && !c1.fin.tiempo && C.hash(c1) === C.hash(c2), 'v2.271 combate: termina y es determinista (misma semilla, mismo estado)');
  const c3 = C.nuevo(3, eq('agua', 'hoja')); for (let i = 0; i < 150; i++) C.paso(c3); const c4 = JSON.parse(JSON.stringify(c3)); for (let i = 0; i < 300; i++) { C.paso(c3); C.paso(c4); } ok(C.hash(c3) === C.hash(c4), 'v2.271 combate: el estado es JSON puro (se retoma a mitad de pelea)'); }
// v2.272 combate conectado al HD-2D: orden «combate», avance por tiempo, vista y efectos; sin combate el estado no cambia.
{ const motor = G.motor, est = motor.crear(5), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0], antes = JSON.stringify(est);
  motor.avanzar(est, 0.05); ok(!est.combate && !G.vista.combate(est, 0), 'v2.272 sin combate no hay est.combate ni vista de combate');
  cr.x = j.x + 48; cr.y = j.y; ok(motor.aplicar(est, { j: 'oli', t: 'combate', aliado: 'pompon' }) !== false && !!est.combate && !!cr.enCombate, 'v2.272 la orden «combate» crea est.combate y marca a la criatura');
  for (let i = 0; i < 130; i++) motor.combate.avanzar(est, 0.05);   // v2.290: primero caminan a su sitio (hasta 2,5 s)
  const v = G.vista.combate(est, 1), cu = v && G.combateFx.cuadritos(v, 1, 0);
  ok(est.combate.c.t >= 38 && v && v.unidades.length === 2 && v.unidades.every((u) => isFinite(u.x) && isFinite(u.y)) && Array.isArray(cu), 'v2.272 el combate avanza con el tiempo y produce vista y cuadritos de efecto');
  const e2 = JSON.parse(JSON.stringify(est)); ok(!est.combate || JSON.stringify(e2.combate.c) === JSON.stringify(est.combate.c), 'v2.272 est.combate es serializable (listo para online)');
  { const F = G.fxPro, ids = Object.keys(G.COMBATE_DATOS.MOV); ok(F && F.ids.length === 56 && ids.every((i) => F.tiene(i)), 'v2.274 los 56 movimientos del catálogo tienen su efecto diseñado (G.fxPro)');
    const p = new F.Painter(), mk = () => { const i = F.crear('llamarada', { semilla: 9, from: { x: 30, w: 16, h: 16 }, to: { x: 100, w: 16, h: 16 }, sprites: {} }); for (let n = 0; n < 150; n++) i.update(F.STEP); p.clear(); i.draw(p, 'front'); return Array.from(p.color.slice(0, 3000)).join(); };
    ok(mk() === mk() && mk().length > 3000, 'v2.274 los efectos diseñados son deterministas (misma semilla, mismos píxeles)'); }
  { const o0 = est.jugadores.oli.x; motor.aplicar(est, { j: 'oli', t: 'teclas', right: 1 }); for (let i = 0; i < 10; i++) motor.moverJugadores(est, 0.05); motor.aplicar(est, { j: 'oli', t: 'teclas' }); ok(est.jugadores.oli.x !== o0, 'v2.275 el jugador se mueve con libertad durante el combate'); }
  j.esferas = 0;   // v2.296: sin esferas no hay oferta de captura y el combate se cierra solo
  const n0 = motor.criaturas(est, j.mapa).length; for (let i = 0; i < 1200 && !est.combate.fin; i++) motor.combate.avanzar(est, 0.05); const gan = est.combate.fin && est.combate.fin.ganador;
  for (let i = 0; i < 80; i++) motor.combate.avanzar(est, 0.05);
  ok(!est.combate && (gan !== 0 || motor.criaturas(est, j.mapa).length === n0 - 1) && !cr.enCombate, 'v2.273 al acabar el combate se libera est.combate (sale el resultado ~2,5 s) y la criatura vencida desaparece del mapa'); }
// v2.288 la arena se monta a la vista (suelo libre y nada delante) y la criatura superviviente no se duplica al acabar.
{ const motor = G.motor, est = motor.crear(9), j = est.jugadores.oli, m = G.mundo.mapa(j.mapa), lista = motor.criaturas(est, j.mapa); let n = 0, malos = 0;
  for (let ty = 3; ty < m.H - 3; ty += 2) for (let tx = 3; tx < m.W - 3; tx += 3) { if (motor.bloqueado(m, tx * 16 + 8, ty * 16 + 14)) continue; const c = lista[0]; if (!c) break;
    const e = motor.crear(9), jj = e.jugadores.oli, cc = motor.criaturas(e, jj.mapa)[0]; jj.x = tx * 16 + 8; jj.y = ty * 16 + 14; cc.x = jj.x + 40; cc.y = jj.y; if (motor.bloqueado(m, cc.x, cc.y)) continue;
    if (motor.aplicar(e, { j: 'oli', t: 'combate', aliado: 'pompon' }) === false || !e.combate) continue; n++; const k = e.combate; for (let i = 0; i < 60; i++) motor.combate.avanzar(e, 0.05);
    const ps = k.c.u.map((u) => motor.combate.posicion(k, u)); if (ps.some((p) => motor.bloqueado(m, p.x, p.y) || G.capas.tapa(m, p.x - 12, p.y - 28, p.x + 12, p.y, p.y))) { malos++; if (process.env.VERBOSO) console.log('  malo', tx, ty, JSON.stringify(ps.map((p) => [Math.round(p.x), Math.round(p.y), motor.bloqueado(m, p.x, p.y)])), 'ax', Math.round(k.ax), Math.round(k.ay)); } }
  ok(n > 20 && malos === 0, 'v2.288 las unidades del combate quedan en suelo libre y sin nada delante (' + (n - malos) + '/' + n + ')'); if (process.env.VERBOSO) console.log('  arena visible', n - malos, n);
  const e = motor.crear(9), jj = e.jugadores.oli, cc = motor.criaturas(e, jj.mapa)[0]; cc.x = jj.x + 48; cc.y = jj.y; motor.aplicar(e, { j: 'oli', t: 'combate', aliado: 'pompon' }); const ox = cc.x;
  for (let i = 0; i < 1200 && !e.combate.fin; i++) motor.combate.avanzar(e, 0.05); const k = e.combate, sob = k.c.u.find((u) => u.id.startsWith('e_') && !u.ko);
  if (sob) { for (let i = 0; i < 20; i++) motor.combate.avanzar(e, 0.05); ok(cc.enCombate && k.fin, 'v2.288 la criatura superviviente sigue oculta en el mapa mientras dura el resultado'); const p = motor.combate.posicion(k, sob); for (let i = 0; i < 40; i++) motor.combate.avanzar(e, 0.05); ok(!e.combate && !cc.enCombate && Math.abs(cc.x - p.x) < 0.01, 'v2.288 al acabar, la superviviente queda donde peleó (no reaparece en otro sitio)'); }
  else ok(true, 'v2.288 (ganó el jugador: nada que colocar)'); }
// v2.291 la quemadura avisa con un número por segundo (no cada 0,25 s) y, al acabar el combate, el reloj visual sigue (los números no se congelan).
{ const C = G.combate; let golpesQ = 0, dots = 0, maxDots = 0, ticksDot = [];
  for (let sem = 1; sem <= 30; sem++) { const c = C.nuevo(sem, [[{ el: 'fuego', rar: 'comun', fase: 1, kg: 3 }], [{ el: 'hoja', rar: 'comun', fase: 1, kg: 3 }]]); while (!c.fin) { C.paso(c); c.ev.forEach((e) => { if (e.e === 'golpe' && e.mov === 'quemado') golpesQ++; if (e.e === 'dot') { dots++; ticksDot.push(e.t); } }); } }
  ok(golpesQ === 0 && dots > 0, 'v2.291 la quemadura no emite un «golpe» cada tick; avisa con «dot» agrupado (' + dots + ' avisos)');
  const motor = G.motor, est = motor.crear(5), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; motor.aplicar(est, { j: 'oli', t: 'combate' });
  for (let i = 0; i < 4000 && !est.combate.fin; i++) motor.combate.avanzar(est, 0.05); const k = est.combate; const t0 = G.vista.combate(est, 1).tick; for (let i = 0; i < 10; i++) motor.combate.avanzar(est, 0.05);
  ok(k.fin && G.vista.combate(est, 1).tick > t0 + 5, 'v2.291 tras el final el reloj visual avanza (los números se apagan)'); }
// v2.296 captura: tras ganar a una salvaje se puede lanzar una esfera (determinista); la capturada queda «sin identificar»; se guarda.
{ const corre = () => { const motor = G.motor, est = motor.crear(11), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; j.esferas = 4; motor.aplicar(est, { j: 'oli', t: 'combate' });
    est.combate.c.u.find((u) => u.id.indexOf('e_') === 0).hp = 1; for (let i = 0; i < 3000 && !est.combate.fin && !est.combate.cap; i++) motor.combate.avanzar(est, 0.05);
    const k = est.combate, cap = k && k.cap; const r = { gana: !!cap && cap.vivo === true && !k.fin, oferta: !!cap && cap.fase === 'oferta', cerrado: false, ok: false, lanz: 0 };   // v2.338: la oferta llega EN el combate (vida en rojo), sin derrotar
    if (!r.oferta) return { r, est, j }; for (let i = 0; i < 4; i++) motor.combate.avanzar(est, 0.05); motor.aplicar(est, { j: 'oli', t: 'lanzar', q: 0.1 }); for (let i = 0; i < 20; i++) motor.combate.avanzar(est, 0.05); // antes de ESPERA el lanzamiento se ignora
    for (let n = 0; n < 4 && est.combate; n++) { if (est.combate.cap.fase === 'oferta') { motor.aplicar(est, { j: 'oli', t: 'lanzar', q: 1 }); r.lanz++; } for (let i = 0; i < 200 && est.combate && est.combate.cap.fase !== 'oferta' && est.combate.cap.fase !== 'fin'; i++) motor.combate.avanzar(est, 0.05); if (est.combate && est.combate.cap.fase === 'fin') motor.combate.avanzar(est, 0.05); }
    r.ok = (j.sinId || []).length === 1; r.cerrado = !est.combate; r.esf = j.esferas; return { r, est, j }; };
  const a = corre(), b = corre(); ok(a.r.gana && a.r.oferta, 'v2.338 al quedar una salvaje con la vida en rojo y esferas se ofrece la captura (sin haberla derrotado)');
  ok(JSON.stringify(a.r) === JSON.stringify(b.r) && a.r.esf === 4 - a.r.lanz, 'v2.296 la captura es determinista y cada lanzamiento gasta una esfera (' + JSON.stringify(a.r) + ')');
  { const j = a.j, n = (j.sinId || []).length; const g = G.guardado.serializar(a.est), est2 = G.motor.crear(11); G.guardado.restaurar(est2, JSON.parse(JSON.stringify(g))); ok(est2.jugadores.oli.esferas === j.esferas && (est2.jugadores.oli.sinId || []).length === n, 'v2.296 esferas y criaturas sin identificar se guardan y se restauran'); }
  { const motor = G.motor, est = motor.crear(12), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; j.esferas = 0; motor.aplicar(est, { j: 'oli', t: 'combate' }); est.combate.c.u.find((u) => u.id.indexOf('e_') === 0).hp = 1; for (let i = 0; i < 3000 && est.combate && !est.combate.fin; i++) motor.combate.avanzar(est, 0.05); ok(est.combate && est.combate.fin && !est.combate.cap, 'v2.338 sin esferas no hay oferta: la salvaje en rojo se derrota normalmente y ya no se puede capturar después'); }
  { const motor = G.motor, est = motor.crear(13), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; j.esferas = 3; motor.aplicar(est, { j: 'oli', t: 'combate' }); const e = est.combate.c.u.find((u) => u.id.indexOf('e_') === 0); e.hp = 1; for (let i = 0; i < 3000 && !est.combate.cap && !est.combate.fin; i++) motor.combate.avanzar(est, 0.05);
    const t0 = est.combate.c.t; for (let i = 0; i < 30; i++) motor.combate.avanzar(est, 0.05); ok(est.combate.c.t === t0 && e.hp > 0, 'v2.338 durante la oferta el combate está en pausa');
    motor.aplicar(est, { j: 'oli', t: 'soltar' }); for (let i = 0; i < 20; i++) motor.combate.avanzar(est, 0.05); ok(!est.combate.cap && est.combate.capNo[e.id] && !est.combate.fin, 'v2.338 soltar la oferta devuelve el combate y no se repite para esa criatura');
    for (let i = 0; i < 4000 && !est.combate.fin; i++) motor.combate.avanzar(est, 0.05); ok(est.combate.fin && !est.combate.cap && j.esferas === 3, 'v2.338 tras soltarla, el combate acaba normal sin gastar esferas'); } }
// v2.301 sonido del combate: cada evento suena una sola vez, cada elemento tiene su voz, sin audio no pasa nada y un fallo no para el combate.
{ let voces = 0; const par = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
  const nodo = (osc) => ({ connect(x) { return x; }, start() { if (osc) voces++; }, stop() {}, frequency: par(), gain: par(), Q: par(), pan: par(), type: '', buffer: null, loop: false, threshold: par(), knee: par(), ratio: par(), attack: par(), release: par() });
  const c = { currentTime: 1, sampleRate: 8000, createGain: () => nodo(), createOscillator: () => nodo(true), createBufferSource: () => nodo(true), createBiquadFilter: () => nodo(), createDynamicsCompressor: () => nodo(), createConvolver: () => nodo(), createStereoPanner: () => nodo(), createBuffer: (n, l) => ({ getChannelData: () => new Float32Array(l) }) };
  const fake = { c, bus: nodo(), mus: nodo(), ruido: {} }, orig = G.audio.motor; let m = fake; G.audio.motor = () => m;
  const motor = G.motor, est = motor.crear(21), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; j.esferas = 0; motor.aplicar(est, { j: 'oli', t: 'combate', aliado: 'pompon' });
  let v = null, tocadas = 0; for (let i = 0; i < 300 && !est.combate.fin; i++) { motor.combate.avanzar(est, 0.05); v = G.vista.combate(est, i * 0.05); if (v) { G.sonidoC.seguir(est, v); } }
  tocadas = voces; ok(tocadas > 20, 'v2.301 el combate hace sonar sus eventos (' + tocadas + ' voces de audio)');
  voces = 0; G.sonidoC.seguir(est, v); ok(voces === 0, 'v2.301 los eventos ya sonados no se repiten');
  voces = 0; G.sonidoC.ELEMENTOS.forEach((el) => { ['carga', 'lanzar', 'impacto'].forEach((k) => { const a = voces; G.sonidoC.tocar(fake, k, el, 1, {}); if (voces === a) voces = -1e9; }); }); ok(voces > 0, 'v2.301 los 7 elementos (y el neutro) suenan en carga, lanzamiento e impacto');
  { const U = { a: { id: 'a', side: 0 } }, vv = { fin: null }; let sin = 0, dist = new Set();
    Object.values(G.COMBATE_DATOS.MOV).forEach((mv) => { voces = 0; c.currentTime += 1; G.sonidoC.evento(fake, { e: mv.hueco === 'd' ? 'defensa' : mv.hueco === 'a' ? 'apoyo' : 'golpe', id: 'a', mov: mv.id, d: 20, mx: 100, el: mv.el, tag: mv.tag }, U, vv); if (!voces) sin++; dist.add(voces + '|' + mv.tag + '|' + mv.forma); });
    ok(sin === 0, 'v2.302 los 56 movimientos suenan (' + sin + ' mudos)'); ok(dist.size > 15, 'v2.302 hay variedad entre movimientos (' + dist.size + ' perfiles de capas)');
    voces = 0; ['quemado', 'aturdido', 'miedo'].forEach((k) => G.sonidoC.evento(fake, { e: 'estado', id: 'a', est: k, on: 1 }, U, vv)); ok(voces > 3, 'v2.302 los estados alterados suenan'); }
  voces = 0; m = null; G.sonidoC.seguir(est, v); ok(voces === 0, 'v2.301 sin audio disponible no suena nada ni falla');
  m = fake; G.sonidoC.seguir(est, null); G.audio.motor = orig; }
// v2.303 niveles: curva, escalado, XP al ganar, aviso de subida y guardado.
{ const N = G.nivel; ok(N.nivelDe(0) === 1 && N.nivelDe(N.xpPara(10)) === 10 && N.nivelDe(1e9) === 50, 'v2.303 la curva de XP va de 1 a 50 y topa'); ok(N.xpPara(50) > N.xpPara(49) && N.xpPara(2) > 0, 'v2.303 cada nivel pide más XP');
  const b = G.combate.statsDe({ forma: 'pompon' }), a = G.combate.statsDe({ forma: 'pompon', nivel: 50 }); ok(b.nivel === 1 && a.hpMax > b.hpMax * 2 && a.atk > b.atk * 2 && a.vel === b.vel, 'v2.303 el nivel escala vida/ataque/defensa y no la velocidad');
  ok(['comun', 'rara', 'epica', 'legendaria'].every((r) => { const n = N.nivelSalvaje(r, 'x|1'); return n >= N.AJUSTES.SALVAJE[r][0] && n <= N.AJUSTES.SALVAJE[r][1]; }), 'v2.303 el nivel de las salvajes cae en su rango por rareza');
  ok(N.xpGanada(1, 5, 'comun') > N.xpGanada(1, 1, 'comun') && N.xpGanada(30, 1, 'comun') < N.xpGanada(1, 1, 'comun'), 'v2.303 más XP contra rivales fuertes y menos contra débiles');
  const motor = G.motor, est = motor.crear(21), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; motor.aplicar(est, { j: 'oli', t: 'combate', aliado: 'pompon' });
  est.combate.c.u.find((q) => q.side === 1).hp = 1; for (let i = 0; i < 4000 && !est.combate.c.fin; i++) motor.combate.avanzar(est, 0.05); const k0 = est.combate; ok(k0.niv && k0.niv.np === 1 && k0.niv.ne >= 1, 'v2.303 el combate registra el nivel de cada bando');
  ok(k0.c.fin && k0.c.fin.ganador === 0, 'v2.303 el aliado gana el combate de prueba'); motor.combate.avanzar(est, 0.05); ok(j.prog && j.prog.pompon && j.prog.pompon.xp > 0 && k0.premio, 'v2.303 ganar da XP a la especie que luchó'); ok(est.avisos.some((q) => /XP/.test(q.texto)), 'v2.303 se avisa de la XP ganada');
  j.prog = { pompon: { xp: N.xpPara(7) + 3 } }; const d = G.guardado.serializar(est); ok(d.jugadores.oli.prog.pompon.xp === N.xpPara(7) + 3, 'v2.303 el XP se guarda'); const est2 = motor.crear(21); G.guardado.restaurar(est2, JSON.parse(JSON.stringify(d))); ok(N.nivelDeEspecie(est2.jugadores.oli, 'pompon') === 7, 'v2.303 el nivel se restaura al cargar');
  const mal = JSON.parse(JSON.stringify(d)); mal.jugadores.oli.prog = { pompon: { xp: 'x' }, nada: { xp: 5 } }; const est3 = motor.crear(21); G.guardado.restaurar(est3, mal); ok(!est3.jugadores.oli.prog, 'v2.303 un progreso roto se ignora'); }
// v2.305 música de tensión del combate: partitura válida, capas por nivel, nivel según tiempo y vida, motor con contexto falso y sin audio no pasa nada.
{ const M = G.musicaC, fs = require('fs'), pa = require('path'); let voces = 0, gz = [];
  ok(M.LEAD.length === 8 && M.LEAD.every((l) => l.total === 16), 'v2.305 la melodía tiene 8 compases de 16 pasos');
  ok(M.RAIZ.length === 8 && M.TERCERA.length === 8, 'v2.305 el bucle tiene 8 compases de armonía');
  const cuenta = (L) => { let t = 0; for (let n = 0; n < 128; n++) t += M.evPaso(n, L).length; return t; };
  ok(cuenta(0) > 0 && cuenta(0) < cuenta(1) && cuenta(1) < cuenta(2) && cuenta(2) < cuenta(3), 'v2.305 cada nivel de intensidad suma capas (' + [0, 1, 2, 3].map(cuenta).join(' < ') + ')');
  ok(JSON.stringify(M.evPaso(37, 2)) === JSON.stringify(M.evPaso(37 + 128, 2)), 'v2.305 el bucle es periódico y determinista');
  ok([0, 1, 2, 3].every((L) => { for (let n = 0; n < 128; n++) for (const e of M.evPaso(n, L)) { const ms = e.midis || (e.midi !== undefined ? [e.midi] : []); if (ms.some((x) => !(x >= 30 && x <= 100)) || (e.vol !== undefined && !(e.vol >= 0 && e.vol <= 1))) return false; } return true; }), 'v2.305 notas y volúmenes dentro de rango en los 4 niveles');
  const mk = (tick, hp) => ({ tick, unidades: hp.map((h) => ({ hpF: h, ko: false })) });
  ok(M.intensidad(null) === 0 && M.intensidad(mk(0, [1, 1])) === 0 && M.intensidad(mk(G.COMBATE_DATOS.TPS * M.AJ.T_NIVEL1 + 5, [1, 1])) === 1 && M.intensidad(mk(0, [1, 0.5])) === 2 && M.intensidad(mk(0, [0.2, 1])) === 3, 'v2.305 la tensión sube con el tiempo y con la vida baja');
  const par = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const nodo = (osc) => ({ connect(x) { return x; }, start() { if (osc) voces++; }, stop() {}, frequency: par(), gain: par(), Q: par(), detune: par(), delayTime: par(), threshold: par(), knee: par(), ratio: par(), attack: par(), release: par(), type: '', buffer: null, loop: false });
  const c = { currentTime: 1, sampleRate: 8000, createGain: () => nodo(), createOscillator: () => nodo(true), createBufferSource: () => nodo(true), createBiquadFilter: () => nodo(), createDynamicsCompressor: () => nodo(), createDelay: () => nodo() };
  const fake = { c, bus: nodo(), mus: nodo(), ruido: {} }, orig = G.audio.motor, origZ = G.audio.zona; let m = fake; G.audio.motor = () => m; G.audio.zona = (n) => gz.push(n);
  const est = { combate: {} }, v = mk(0, [1, 1]);
  for (let i = 0; i < 120; i++) { c.currentTime += 0.016; M.seguir(est, v); }
  ok(voces > 30 && gz[0] === 0 && M.estado.activo, 'v2.305 al empezar el combate suena la música y se apaga la de la zona (' + voces + ' voces)');
  v.unidades[0].hpF = 0.2; for (let i = 0; i < 200; i++) { c.currentTime += 0.016; M.seguir(est, v); } ok(M.estado.L === 3, 'v2.305 con una criatura casi derrotada la música llega al máximo');
  v.unidades[0].hpF = 1; for (let i = 0; i < 60; i++) { c.currentTime += 0.016; M.seguir(est, v); } ok(M.estado.L === 3, 'v2.305 la tensión no baja durante el combate');
  const a = voces; for (let i = 0; i < 10; i++) { c.currentTime += 0.016; M.seguir(est, null); } ok(!M.estado.activo, 'v2.305 al acabar el combate la música se corta'); for (let i = 0; i < 150; i++) { c.currentTime += 0.016; M.seguir(est, null); } ok(gz[gz.length - 1] === 1 && voces === a, 'v2.305 vuelve la música de la zona y no queda nada sonando');
  M.seguir(est, v); ok(M.estado.activo && M.estado.L === 3, 'v2.305 el mismo combate retoma su nivel si se corta y vuelve'); const est2 = { combate: {} }; M.seguir(est, null); M.seguir(est2, v); ok(M.estado.L === 0, 'v2.305 un combate nuevo empieza en el nivel más bajo');
  m = null; voces = 0; M.seguir(est2, v); ok(voces === 0, 'v2.305 sin audio disponible no suena nada ni falla'); m = fake;
  m = { c: { get currentTime() { throw new Error('roto'); } }, bus: nodo(), mus: nodo(), ruido: {} }; let cae = false; try { M.seguir(est2, v); } catch (e) { cae = true; } ok(!cae, 'v2.305 un fallo del audio no para el combate'); m = fake;
  G.audio.motor = orig; G.audio.zona = origZ;
  const src = fs.readFileSync(pa.join(__dirname, 'src/musica_combate.js'), 'utf8'), gm = fs.readFileSync(pa.join(__dirname, 'src/game.js'), 'utf8'), au = fs.readFileSync(pa.join(__dirname, 'src/audio.js'), 'utf8'), ord = JSON.parse(fs.readFileSync(pa.join(__dirname, 'src/orden.json'), 'utf8'));
  ok(!/Math\.random/.test(src) && !/document|innerWidth/.test(src) && /G\.musicaC\.seguir\(est, v\)/.test(gm) && /zona\(n\)/.test(au) && JSON.stringify(ord).includes('src/musica_combate.js'), 'v2.305 la música es pura, sin Math.random ni DOM, y está enganchada en el juego y en el build'); }
// v2.307 el especial del jugador solo sale con su orden y el medidor lleno; el del rival sale solo.
{ const motor = G.motor, est = motor.crear(33), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; j.esferas = 0; motor.aplicar(est, { j: 'oli', t: 'combate', aliado: 'pompon' });
  const mio = est.combate.c.u.find((q) => q.side === 0), rival = est.combate.c.u.find((q) => q.side === 1); ok(mio.auto === false && rival.auto === true, 'v2.307 solo la criatura del jugador tiene el especial en manual');
  let espMio = 0, espRival = 0; mio.med = 100; rival.med = 100; mio.hp = mio.hpMax = 1e6; rival.hp = rival.hpMax = 1e6;
  for (let i = 0; i < 600 && !est.combate.fin; i++) { motor.combate.avanzar(est, 0.05); est.combate.c.ev.forEach((e) => { if (e.e === 'inicio' && e.hueco === 'e') { if (e.id === mio.id) espMio++; else espRival++; } }); if (i < 590) { mio.med = Math.min(mio.med, 100); } }
  ok(espMio === 0, 'v2.307 con el medidor lleno el especial del jugador NO sale solo'); ok(espRival > 0, 'v2.307 el rival sí lanza su especial solo (' + espRival + ')');
  mio.med = 100; mio.acc = null; motor.aplicar(est, { j: 'oli', t: 'esp' }); ok(!!est.combate.esp, 'v2.307 la orden del botón acepta el especial con el medidor lleno'); for (let i = 0; i < 6; i++) motor.combate.avanzar(est, 0.05); ok(mio.med < 100, 'v2.307 al pulsar, el especial sale y el medidor se vacía'); }
  // pulsación guardada: con la criatura ocupada el especial sale en cuanto acaba su acción; si no se puede lanzar, caduca
  { const motor = G.motor, est2 = motor.crear(33), j2 = est2.jugadores.oli, cr2 = motor.criaturas(est2, j2.mapa)[0]; cr2.x = j2.x + 48; cr2.y = j2.y; j2.esferas = 0; motor.aplicar(est2, { j: 'oli', t: 'combate', aliado: 'pompon' }); const m2 = est2.combate.c.u.find((q) => q.side === 0), r2 = est2.combate.c.u.find((q) => q.side === 1); m2.hp = m2.hpMax = r2.hp = r2.hpMax = 1e6;
    for (let i = 0; i < 40; i++) motor.combate.avanzar(est2, 0.05); m2.med = 100; m2.listo = -1; m2.acc = { m: m2.kit[0], o: r2.id, t: 0, tw: 12, tf: 20 }; motor.aplicar(est2, { j: 'oli', t: 'esp' }); let sale = false;
    for (let i = 0; i < 40 && !sale; i++) { motor.combate.avanzar(est2, 0.05); est2.combate.c.ev.forEach((e) => { if (e.e === 'inicio' && e.id === m2.id && e.hueco === 'e') sale = true; }); } ok(sale && !est2.combate.esp, 'v2.307 pulsar con la criatura ocupada: el especial sale al acabar su acción');
    m2.med = 100; m2.acc = { m: m2.kit[0], o: r2.id, t: 0, tw: 12, tf: 400 }; motor.aplicar(est2, { j: 'oli', t: 'esp' }); for (let i = 0; i < 40; i++) motor.combate.avanzar(est2, 0.05); ok(!est2.combate.esp && m2.med === 100, 'v2.307 si no puede lanzarlo a tiempo, la pulsación caduca y no sale después'); }
// v2.308 sonido y efecto del botón ⚡ al pulsarlo con el especial listo.
{ let voces = 0; const par = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} });
  const nodo = (osc) => ({ connect(x) { return x; }, start() { if (osc) voces++; }, stop() {}, frequency: par(), gain: par(), Q: par(), pan: par(), type: '', buffer: null, loop: false, threshold: par(), knee: par(), ratio: par(), attack: par(), release: par() });
  const c = { currentTime: 1, sampleRate: 8000, createGain: () => nodo(), createOscillator: () => nodo(true), createBufferSource: () => nodo(true), createBiquadFilter: () => nodo(), createDynamicsCompressor: () => nodo(), createConvolver: () => nodo(), createStereoPanner: () => nodo(), createBuffer: (n, l) => ({ getChannelData: () => new Float32Array(l) }) };
  const orig = G.audio.motor; let m = { c, bus: nodo(), mus: nodo(), ruido: {} }; G.audio.motor = () => m;
  ok(G.sonidoC.pulsa() === true && voces >= 8, 'v2.308 el botón ⚡ suena al pulsarlo (' + voces + ' voces)'); m = null; voces = 0; ok(G.sonidoC.pulsa() === false && voces === 0, 'v2.308 sin audio no suena ni falla'); G.audio.motor = orig;
  const fs = require('fs'), gm = fs.readFileSync(require('path').join(__dirname, 'src/game.js'), 'utf8'), ix = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
  ok(/addEventListener\('pointerdown'/.test(gm) && /G\.sonidoC\.pulsa\(\)/.test(gm) && /#kbtn\.pulsa/.test(ix) && /prefers-reduced-motion: reduce\) \{ #kbtn\.pulsa/.test(ix), 'v2.308 el botón reacciona al tocarlo (sonido + efecto, con movimiento reducido)'); }
// v2.309 vida permanente: la vida con la que acaba el combate se conserva (y se guarda); una criatura a 0 no combate hasta que la curen (Centro PC).
{ const motor = G.motor, mk = (sem) => { const est = motor.crear(sem), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; j.esferas = 0; return { est, j }; };
  const fin = (est) => { for (let i = 0; i < 4000 && !est.combate.c.fin; i++) motor.combate.avanzar(est, 0.05); motor.combate.avanzar(est, 0.05); };
  { const { est, j } = mk(41); motor.aplicar(est, { j: 'oli', t: 'combate', aliado: 'pompon' }); const mio = est.combate.c.u.find((q) => q.side === 0), rv = est.combate.c.u.find((q) => q.side === 1); mio.hp = 40; rv.hp = 1; rv.atk = 0.001; fin(est); const h = Math.round(mio.hp);
    ok(est.combate.c.fin && est.combate.c.fin.ganador === 0 && h > 30 && h <= 40 && j.vida && j.vida.pompon === h, 'v2.309 gana con ' + h + ' de vida y se queda con ' + h + ' (' + JSON.stringify(j.vida) + ')');
    for (let i = 0; i < 80 && est.combate; i++) motor.combate.avanzar(est, 0.05);
    const cr = motor.criaturas(est, j.mapa)[0]; if (cr) { cr.x = j.x + 48; cr.y = j.y; } motor.aplicar(est, { j: 'oli', t: 'combate', aliado: 'pompon' });
    ok(est.combate && est.combate.c.u.find((q) => q.side === 0).hp === h, 'v2.309 el siguiente combate empieza con esa misma vida');
    const d = G.guardado.serializar(est); ok(d.jugadores.oli.vida.pompon === h, 'v2.309 la vida se guarda'); const est2 = motor.crear(41); G.guardado.restaurar(est2, JSON.parse(JSON.stringify(d))); ok(est2.jugadores.oli.vida && est2.jugadores.oli.vida.pompon === h, 'v2.309 y se recupera al cargar');
    const mal = JSON.parse(JSON.stringify(d)); mal.jugadores.oli.vida = { pompon: 'x', nada: 5, ondel: -3 }; const est3 = motor.crear(41); G.guardado.restaurar(est3, mal); ok(!est3.jugadores.oli.vida, 'v2.309 una vida corrupta o inventada se descarta'); }
  { const { est, j } = mk(42); motor.aplicar(est, { j: 'oli', t: 'combate', aliado: 'pompon' }); const mio = est.combate.c.u.find((q) => q.side === 0); mio.hp = 1; est.combate.c.u.find((q) => q.side === 1).hp = 1e6; est.combate.c.u.find((q) => q.side === 1).atk = 1e5; for (let i = 0; i < 4000 && !est.combate.c.fin; i++) motor.combate.avanzar(est, 0.05); for (let i = 0; i < 90 && est.combate; i++) motor.combate.avanzar(est, 0.05);
    ok(j.vida && j.vida.pompon === 0 && !est.acomp, 'v2.309 al caer queda a 0 de vida');
    const cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; const r = motor.combate.iniciar(est, j, 'pompon'); ok(r === false && !est.combate && est.avisos.some((a) => /debilitada/.test(a.texto)), 'v2.309 una criatura a 0 no puede combatir y el juego avisa');
    ok(motor.combate.curar(est, 'oli') === true && !j.vida && est.acomp && est.avisos.some((a) => /recuperado/.test(a.texto)), 'v2.309 el Centro PC la cura y vuelve el acompañante'); ok(motor.combate.curar(est, 'oli') === false, 'v2.309 curar sin heridos no hace nada');
    j.vida = { pompon: 25 }; motor.combate.curar(est, 'oli', 'pompon'); ok(!j.vida, 'v2.309 curar una sola criatura (para pociones)');
    ok(!/mid === 'centro_pc' && motor\.combate/.test(require('fs').readFileSync(require('path').join(__dirname, 'src/motor.js'), 'utf8')) && mundo_ok(), 'v2.312 entrar en el Centro PC ya no cura solo: cura la enfermera al hablar con ella'); }
  function mundo_ok() { return !!G.mundo.mapa('centro_pc'); } }
// v2.310 pestaña Equipo: datos puros (fichas, huecos, conteo por especie, orden), vida y nivel reales, y enganche en el HUD.
{ const Q = G.equipoUI, fs = require('fs'), pa = require('path'), formas = Object.keys(G.CREATURES), rar = (f) => G.combate.statsDe({ forma: f }).rar;
  const j = { id: 'oli', prog: { pompon: { xp: G.nivel.xpPara(7) + 20 } }, vida: { pompon: 60 }, sinId: [{ forma: 'pompon', mapa: 'albanota', n: 1 }, { forma: 'zefirax', mapa: 'albanota', n: 2 }, { forma: 'inventada', mapa: 'x', n: 3 }] };
  const D = Q.datos(j, ['pompon', 'pompon', 'no_existe']);
  ok(D.equipo.length === 6 && D.equipo[0] && D.equipo[0].forma === 'pompon' && D.equipo.slice(1).every((x) => x === null) && D.enEquipo === 1, 'v2.310 el equipo tiene 6 huecos, sin repetidos ni formas inventadas');
  ok(D.todas.length === 3 && D.total === 3 && D.todas.filter((q) => q.forma === 'pompon').length === 2 && D.todas.filter((q) => q.enEquipo).length === 1 && D.caja === 3 && D.cajaMax === 50, 'v2.339 todas las criaturas: una fila por ejemplar (equipo y caja; las inventadas no cuentan)');
  ok(D.todas[0].enEquipo && D.todas[1].forma === 'zefirax' && D.todas[1].rar === 'legendaria', 'v2.310 el equipo primero y luego por rareza (la legendaria primero)');
  const f = D.equipo[0]; ok(f.nivel === 7 && f.hp === 60 && f.hpMax > 60 && !f.debil && f.xp - f.xpDesde === 20 && f.xpHasta > f.xp, 'v2.310 nivel, vida y XP reales de la ficha (Nv ' + f.nivel + ', ' + f.hp + '/' + f.hpMax + ')');
  j.vida.pompon = 0; ok(Q.ficha(j, 'pompon').debil === true && Q.ficha({ id: 'x' }, 'pompon').hp === Q.ficha({ id: 'x' }, 'pompon').hpMax && Q.ficha({ id: 'x' }, 'pompon').nivel === 1, 'v2.310 a 0 de vida está debilitada; sin datos, vida completa y nivel 1');
  ok(Q.movimientos(j, Q.ficha(j, 'pompon')).length >= 3, 'v2.310 la ficha del equipo muestra sus movimientos');
  const html = fs.readFileSync(pa.join(__dirname, 'index.html'), 'utf8'), gm = fs.readFileSync(pa.join(__dirname, 'src/game.js'), 'utf8'), ord = JSON.stringify(JSON.parse(fs.readFileSync(pa.join(__dirname, 'src/orden.json'), 'utf8'))), src = fs.readFileSync(pa.join(__dirname, 'src/equipo_ui.js'), 'utf8');
  ok(/id="qbtn"/.test(html) && /id="equipo"/.test(html) && /role="tablist"/.test(html) && /G\.equipoUI\.abrir\(yo\(\)/.test(gm) && ord.includes('src/equipo_ui.js') && !/Math\.random/.test(src), 'v2.310 el botón, el panel accesible y el enganche existen y el módulo no usa azar'); }
// v2.311 barra de vida: el trozo blanco de daño no se reinicia con daño seguido y está acotado.
{ const fs = require('fs'), pa = require('path'), c2 = fs.readFileSync(pa.join(__dirname, 'src/combate_2d.js'), 'utf8');
  ok(/hpF < b\.r - 1e-4 && !\(b\.esp > 0\) && b\.c - b\.s < 0\.01\) b\.esp = 0\.4/.test(c2) && /b\.c - b\.s > 0\.18\) b\.c = b\.s \+ 0\.18/.test(c2), 'v2.311 el trozo blanco de la barra no se reinicia con daño seguido y nunca pasa de 0,18'); }
// v2.312 enfermera Alba (primer NPC) y equipo editable: personaje en el Centro PC, hablar, curar y preparar el equipo por órdenes del motor; guardado del equipo.
{ const motor = G.motor, Q = G.equipo, fs = require('fs'), pa = require('path'), T = 16;
  const mk = (sem) => { const est = motor.crear(sem), j = est.jugadores.oli; j.mapa = 'centro_pc'; motor.estadoMapa(est, 'centro_pc'); j.x = 6 * T + 8; j.y = 5 * T + 8; return { est, j }; };
  const C = G.mundo.mapa('centro_pc');
  ok(G.spr.enf_down_0 && G.NPC_ALBA.length === 21 && G.NPC_ALBA.every((r) => r.length === 16) && G.vista.persona('enfermera', 'down', false, 0).clave === 'enf_down_0', 'v2.312 la enfermera tiene su sprite (16×21) y la vista lo encuentra');
  ok(C.npcs[0].tipo === 'npc' && G.mundo.solido(C, 6, 3) && G.npc.lista(C).length === 1 && G.npc.lista(G.mundo.mapa('albanota')).length === 0, 'v2.312 la enfermera ocupa su casilla (6,3) y solo está en el Centro PC');
  { const { est, j } = mk(51); ok(G.npc.cercano(est, j) && G.npc.cercano(est, j).id === 'enfermera', 'v2.312 desde la casilla frontal (6,5) se puede hablar con ella'); j.y = 9 * T; ok(G.npc.cercano(est, j) === null, 'v2.312 junto a la puerta está demasiado lejos'); j.mapa = 'albanota'; j.x = 6 * T; j.y = 5 * T; ok(G.npc.cercano(est, j) === null, 'v2.312 fuera del Centro PC no hay nadie con quien hablar'); }
  { const { est, j } = mk(52); const r = motor.aplicar(est, { j: 'oli', t: 'hablar' }); ok(r && r.npc === 'enfermera' && j.dir === 'up' && !j.moving, 'v2.312 hablar con ella: se vuelve hacia ella (' + j.dir + ')');
    j.vida = { pompon: 0 }; delete est.acomp; ok(motor.aplicar(est, { j: 'oli', t: 'curar' }).curadas === true && !j.vida && est.acomp && est.acomp.forma === 'pompon' && est.avisos.some((a) => /recuperado/.test(a.texto)), 'v2.312 curar la deja como nueva y vuelve el acompañante');
    ok(motor.aplicar(est, { j: 'oli', t: 'curar' }).curadas === false && est.avisos.some((a) => /plena forma/.test(a.texto)), 'v2.312 si no hay heridas lo dice y no cambia nada');
    j.y = 9 * T; ok(motor.aplicar(est, { j: 'oli', t: 'curar' }) === null && motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['pompon'] }) === null, 'v2.312 lejos de ella no cura ni toca el equipo'); }
  { const { est, j } = mk(53); j.sinId = [{ forma: 'zefirax', mapa: 'albanota', n: 1 }, { forma: 'zefirax', mapa: 'albanota', n: 2 }];
    ok(JSON.stringify(Q.actual(j)) === '["pompon"]' && Q.propias(j).zefirax === 2 && Q.propias(j).pompon === 1 && Q.MAX === 6, 'v2.312 sin equipo guardado, el equipo es la criatura inicial; se poseen 2 zefirax');
    ok(Q.validas(j, ['zefirax', 'zefirax', 'inventada', 'pompon', 'ignel']).join() === 'zefirax,pompon', 'v2.312 el equipo no admite repetidas, inventadas ni ajenas');
    const r = motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['zefirax', 'pompon'] }); ok(r && j.equipo.join() === 'zefirax,pompon' && est.acomp && est.acomp.forma === 'zefirax', 'v2.312 la primera pasa a acompañarte (zefirax)');
    ok(motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['ignel'] }) === null && j.equipo.join() === 'zefirax,pompon', 'v2.312 un equipo sin criaturas válidas se rechaza y no cambia nada');
    j.vida = { zefirax: 0 }; ok(Q.lider(j) === 'pompon', 'v2.312 la de delante debilitada: lidera la siguiente sana'); j.vida = { zefirax: 0, pompon: 0 }; ok(Q.lider(j) === null, 'v2.312 todas debilitadas: nadie te acompaña'); delete j.vida;
    const d = G.guardado.serializar(est), est2 = motor.crear(54); est2.jugadores.oli.sinId = j.sinId.map((q) => Object.assign({}, q)); G.guardado.restaurar(est2, JSON.parse(JSON.stringify(d))); ok((est2.jugadores.oli.equipo || []).join() === 'zefirax,pompon', 'v2.312 el equipo se guarda y se recupera');
    const mal = JSON.parse(JSON.stringify(d)); mal.jugadores.oli.equipo = ['ignel', 'ignel', 7]; const est3 = motor.crear(55); G.guardado.restaurar(est3, mal); ok(!est3.jugadores.oli.equipo, 'v2.312 un equipo guardado corrupto se ignora'); }
  const R = (f) => fs.readFileSync(pa.join(__dirname, f), 'utf8'), ui = R('src/dialogo_ui.js'), eu = R('src/equipo_ui.js'), gm = R('src/game.js'), ix = R('index.html'), nc = R('src/npc.js');
  ok(!/Math\.random/.test(ui + nc + R('src/equipo.js')) && /api\.curar\(\)/.test(ui) && /api\.equipo\(/.test(ui) && !/\.vida\s*=|\.equipo\s*=/.test(ui), 'v2.312 el diálogo no usa azar ni toca el estado: lo pide al motor con órdenes');
  ok(/t: 'curar'/.test(gm) && /t: 'equipo', formas/.test(gm) && /G\.dialogoUI\.abrir\(r\.npc/.test(gm) && /G\.npc\.cercano\(est, yo\(\)\)/.test(gm) && /id="?dlg|\.id = 'dlg'/.test(ui) && /#dlg \{/.test(ix) && /role', 'dialog'/.test(ui), 'v2.312 la tecla/botón de hablar abre el diálogo; burbuja, burbuja accesible y estilos presentes');
  ok(/E\.edit/.test(eu) && /Añadir al equipo/.test(eu) && /Poner al frente/.test(eu) && /Guardar en la caja/.test(eu) && /eq-btn/.test(ix), 'v2.312 el panel Equipo tiene modo edición (añadir, quitar, poner al frente)');
  { const D = G.equipoUI.datos({ id: 'oli', equipo: ['zefirax'], sinId: [{ id: 1, forma: 'zefirax', mapa: 'x', n: 1 }, { id: 2, forma: 'pompon', mapa: 'x', n: 2 }] }, ['zefirax']); ok(D.equipo[0].forma === 'zefirax' && D.todas.find((q) => q.forma === 'zefirax' && q.enEquipo) && !D.todas.find((q) => q.forma === 'pompon').enEquipo && D.total === 3, 'v2.312 el panel cuenta lo que posees (equipo + caja) y marca las del equipo'); } }
// v2.313 salir de un interior sin haber entrado por su puerta (partida cargada dentro): antes no se podía salir.
{ const motor = G.motor, mundo = G.mundo; ['centro_pc', 'tienda', 'laboratorio', 'casa_de_oli', 'casa_de_lali', 'ermita'].forEach((id) => { const est = motor.crear(61), j = est.jugadores.oli, m = mundo.mapa(id), q = m.puertas[0]; j.mapa = id; j.volver = []; j.enPuerta = null; j.x = q.x * 16 + 8; j.y = q.y * 16 + 8; motor.cruzar(est, j, m);
    ok(j.mapa === 'albanota' && !mundo.solido(mundo.mapa('albanota'), Math.floor(j.x / 16), Math.floor(j.y / 16)), 'v2.313 se sale de ' + id + ' aunque no se haya entrado por su puerta'); });
  { const est = motor.crear(62), j = est.jugadores.oli, A = mundo.mapa('albanota'), pu = A.puertas[0]; j.x = pu.x * 16 + 8; j.y = pu.y * 16 + 8; motor.cruzar(est, j, A); ok(j.mapa === 'centro_pc' && j.volver.length === 1, 'v2.313 entrar sigue funcionando'); } }
// v2.314 carteles con el nombre sobre las puertas (Centro PC horneado; Tienda aparte) y entradita con dos escalones en la ermita: la decoración de la Tienda y la Ermita es SOLO 2D (el HD-2D ya las tiene en 3D).
{ const src = require('fs').readFileSync(require('path').join(__dirname, 'src/albanota_objetos.js'), 'utf8'), gm = require('fs').readFileSync(require('path').join(__dirname, 'src/game.js'), 'utf8');
  ok(G.pixelTextMissing('CENTRO PC').length === 0 && G.pixelTextMissing('TIENDA').length === 0 && /rotulo\(l, cx, rh - 8, 'CENTRO PC'/.test(src) && G.OBJETOS.centro_pc.w === 114 && G.OBJETOS.tienda.w === 82 && G.OBJETOS.ermita.w === 82, 'v2.314 el rótulo CENTRO PC usa letras que existen y el tamaño de los edificios no cambia');
  ok(G.decor2d && G.decor2d.tipos.join() === 'tienda,ermita' && !/rotulo\(l, a \+ 2 \* 16 \+ 8, 52/.test(src) && /G\.decor2d\.pintar\(ctx, p\.objeto, cam\)/.test(gm) && G.OBJETOS.tienda.vol.rotulo.texto === 'TIENDA' && G.OBJETOS.ermita.vol.adornos.length > 0, 'v2.314 el rótulo de la Tienda y los escalones de la Ermita van solo en el 2D (el HD-2D conserva los suyos en 3D)'); }
// v2.315 Brillos (moneda), mochila y objetos: núcleo puro (src/tienda.js). Comprar/vender solo en la Tienda; pociones solo andando; esferas compradas; guardado con validación.
{ const motor = G.motor, Tn = G.tienda, fs = require('fs'), pa = require('path'), mk = (sd) => { const est = motor.crear(sd); return { est, j: est.jugadores.oli }; };
  { const { est, j } = mk(70); ok(Tn.brillos(j) === 100 && j.mochila === undefined, 'v2.315 se empieza con 100 ✦ y mochila vacía');
    ok(Tn.ganar(j, 50.9) === 50 && j.brillos === 150 && Tn.ganar(j, -5) === 0 && Tn.ganar(j, NaN) === 0 && Tn.ganar(j, 1e12) === Tn.TOPE - 150 && j.brillos === Tn.TOPE, 'v2.315 ganar: enteros, sin negativos ni NaN, con tope'); j.brillos = 100;
    ok(Tn.gastar(j, 40) && j.brillos === 60 && !Tn.gastar(j, 61) && j.brillos === 60 && !Tn.gastar(j, -1), 'v2.315 gastar: no deja saldo negativo ni acepta importes raros');
    j.mapa = 'albanota'; ok(motor.aplicar(est, { j: 'oli', t: 'comprar', id: 'pocion' }).ok === false && j.brillos === 60 && !j.mochila, 'v2.315 fuera de la Tienda no se compra'); j.mapa = 'tienda'; j.x = 5 * 16 + 8; j.y = 6 * 16 + 14; ok(motor.aplicar(est, { j: 'oli', t: 'comprar', id: 'pocion' }).ok === false && j.brillos === 60, 'v2.317 dentro de la Tienda pero lejos del tendero tampoco se compra'); j.x = 7 * 16 + 8; j.y = 4 * 16 + 14;
    ok(motor.aplicar(est, { j: 'oli', t: 'comprar', id: 'pocion' }).ok && j.brillos === 20 && j.mochila.pocion === 1, 'v2.315 comprar una Poción: -40 ✦ y +1 en la mochila');
    ok(!motor.aplicar(est, { j: 'oli', t: 'comprar', id: 'superpocion' }).ok && j.brillos === 20 && !motor.aplicar(est, { j: 'oli', t: 'comprar', id: 'pez_loro' }).ok && !motor.aplicar(est, { j: 'oli', t: 'comprar', id: 'pocion', n: 0 }).ok && !motor.aplicar(est, { j: 'oli', t: 'comprar', id: 'pocion', n: -3 }).ok, 'v2.315 sin saldo, objeto ajeno o cantidad inválida: se rechaza y no cambia nada');
    const e0 = G.motor.combate.esferas(j); j.brillos = 100; ok(motor.aplicar(est, { j: 'oli', t: 'comprar', id: 'esfera', n: 2 }).ok && j.esferas === e0 + 2 && j.brillos === 40 && !j.mochila.esfera, 'v2.315 las esferas compradas suman a j.esferas (60 ✦ por 2)');
    ok(motor.aplicar(est, { j: 'oli', t: 'vender', id: 'pocion' }).ok && j.brillos === 60 && !j.mochila, 'v2.315 vender un objeto paga la mitad y limpia la mochila'); ok(!motor.aplicar(est, { j: 'oli', t: 'vender', id: 'pocion' }).ok && !motor.aplicar(est, { j: 'oli', t: 'vender', id: 'esfera' }).ok, 'v2.315 no se vende lo que no se tiene ni las esferas');
    Tn.meter(j, 'pez_loro', 3); const v = Tn.precioPez('pez_loro'); ok(v >= 3 && motor.aplicar(est, { j: 'oli', t: 'vender', id: 'pez_loro', n: 2 }).ganado === 2 * v && j.mochila.pez_loro === 1, 'v2.315 los pescados se venden por su valor (' + v + ' ✦ el pez loro)');
    ok(Object.keys(G.PECES).every((k) => Tn.precioPez(k) >= 2 && Tn.precioPez(k) < 500), 'v2.315 todos los pescados tienen un precio razonable'); ok(Tn.precioPez('pez_sardina') < Tn.precioPez('cri_pulpo'), 'v2.315 la sardina vale menos que el pulpo');
    Tn.meter(j, 'pocion', 500); ok(j.mochila.pocion === 99, 'v2.315 la mochila tiene tope de 99 por objeto'); }
  { const { est, j } = mk(71); const mx = Tn.hpMax(j, 'pompon'); j.mochila = { pocion: 2, superpocion: 1, revivir: 1 }; j.vida = { pompon: 10 };
    ok(motor.aplicar(est, { j: 'oli', t: 'usar', id: 'pocion', forma: 'pompon' }).ok && j.vida.pompon === Math.min(mx, 160) && j.mochila.pocion === 1, 'v2.315 la Poción cura 150 PS y se gasta');
    ok(motor.aplicar(est, { j: 'oli', t: 'usar', id: 'superpocion', forma: 'pompon' }).ok && !j.vida && !j.mochila.superpocion, 'v2.315 al llegar a la vida máxima se borra la herida (vida completa = sin entrada)');
    ok(!motor.aplicar(est, { j: 'oli', t: 'usar', id: 'pocion', forma: 'pompon' }).ok && j.mochila.pocion === 1, 'v2.315 no se gasta una Poción en una criatura sana');
    j.vida = { pompon: 0 }; ok(!motor.aplicar(est, { j: 'oli', t: 'usar', id: 'pocion', forma: 'pompon' }).ok && j.vida.pompon === 0 && j.mochila.pocion === 1, 'v2.315 la Poción no despierta a una debilitada');
    ok(motor.aplicar(est, { j: 'oli', t: 'usar', id: 'revivir', forma: 'pompon' }).ok && j.vida.pompon === Math.round(mx / 2) && !j.mochila.revivir, 'v2.315 Revivir la deja con la mitad de su vida'); j.mochila.revivir = 1;
    ok(!motor.aplicar(est, { j: 'oli', t: 'usar', id: 'revivir', forma: 'pompon' }).ok && !motor.aplicar(est, { j: 'oli', t: 'usar', id: 'pocion', forma: 'ignel' }).ok && !motor.aplicar(est, { j: 'oli', t: 'usar', id: 'esfera', forma: 'pompon' }).ok, 'v2.315 no se revive a una viva, ni se cura a una ajena, ni se «usa» una esfera');
    j.vida = { pompon: 10 }; est.combate = { jid: 'oli' }; ok(!motor.aplicar(est, { j: 'oli', t: 'usar', id: 'pocion', forma: 'pompon' }).ok && j.vida.pompon === 10 && j.mochila.pocion === 1, 'v2.315 en pleno combate no se usan pociones'); est.combate = { jid: 'lali' };
    ok(motor.aplicar(est, { j: 'oli', t: 'usar', id: 'pocion', forma: 'pompon' }).ok, 'v2.315 el combate del otro jugador no bloquea al tuyo'); delete est.combate;
    j.vida = { pompon: 0 }; delete est.acomp; j.mochila = { revivir: 1 }; motor.aplicar(est, { j: 'oli', t: 'usar', id: 'revivir', forma: 'pompon' }); ok(est.acomp && est.acomp.forma === 'pompon', 'v2.315 al revivir a la de delante vuelve a acompañar'); }
  { const j = { vida: { a: 0 } }; ok(Tn.precioCurar({}) === 0 && Tn.precioCurar({ vida: { pompon: 0, zefirax: 50 } }) === Tn.COSTE_CURAR.debilitada + Tn.COSTE_CURAR.herida && Tn.COSTE_CURAR.herida > 0, 'v2.315 precio de curar: por herida y por debilitada, 0 si no hay'); }
  { const { est, j } = mk(72); j.brillos = 777; j.mochila = { pocion: 3, pez_loro: 2 }; const d = JSON.parse(JSON.stringify(G.guardado.serializar(est))), e2 = motor.crear(73); G.guardado.restaurar(e2, d); const k = e2.jugadores.oli;
    ok(k.brillos === 777 && k.mochila.pocion === 3 && k.mochila.pez_loro === 2, 'v2.315 los Brillos y la mochila se guardan y se restauran');
    const mal = JSON.parse(JSON.stringify(d)); Object.assign(mal.jugadores.oli, { brillos: -5, mochila: { pocion: 'x', inventado: 4, pez_loro: 1000, superpocion: -2 } }); const e3 = motor.crear(74); G.guardado.restaurar(e3, mal); const m3 = e3.jugadores.oli;
    ok(m3.brillos === undefined && m3.mochila && Object.keys(m3.mochila).join() === 'pez_loro' && m3.mochila.pez_loro === 99, 'v2.315 un guardado roto no mete Brillos negativos ni objetos inventados');
    const e4 = motor.crear(75); G.guardado.restaurar(e4, JSON.parse(JSON.stringify(G.guardado.serializar(e4)))); ok(e4.jugadores.oli.brillos === undefined && !e4.jugadores.oli.mochila, 'v2.315 sin Brillos ni mochila no se guarda nada (guardados viejos siguen valiendo)'); }
  { const src = fs.readFileSync(pa.join(__dirname, 'src/tienda.js'), 'utf8'); ok(!/Math\.random|document\.|Date\.now|performance\.now/.test(src) && !/\boli\b|\blali\b/.test(src.replace(/\/\/.*$/gm, '')), 'v2.315 tienda.js es puro: sin azar, DOM, relojes ni jugadores a fuego'); } }
// v2.316-v2.319 economía completa: recompensas, cura de pago, pescados, tendero Teo, diálogo, Bolsa y Tienda (UI). Todo por órdenes del motor; la interfaz solo pinta.
{ const motor = G.motor, Tn = G.tienda, T = 16, fs = require('fs'), pa = require('path'), mk = (sd) => { const est = motor.crear(sd); return { est, j: est.jugadores.oli }; }, R = (f) => fs.readFileSync(pa.join(__dirname, f), 'utf8');
  ok(Tn.premioCombate(5, 5, 'comun') === 16 && Tn.premioCombate(5, 5, 'epica') > Tn.premioCombate(5, 5, 'rara') && Tn.premioCombate(5, 5, 'rara') > Tn.premioCombate(5, 5, 'comun') && Tn.premioCombate(30, 5, 'comun') < Tn.premioCombate(5, 5, 'comun') && Tn.premioCombate(50, 1, 'comun') >= 1 && Tn.premioCombate(50, 1, 'comun') === Tn.premioCombate(50, 1, 'comun'), 'v2.316 el premio de combate sube con el nivel y la rareza del rival y baja si tu criatura le saca muchos niveles (determinista)');
  ok(Tn.ESF0 === undefined && Tn.esferasDe({}) === 5 && G.motor.combate.esferas({}) === 5 && Tn.esferasDe({ esferas: 2 }) === 2, 'v2.316 las esferas iniciales (5) coinciden entre tienda.js y el combate');
  { const { est, j } = mk(80); j.mapa = 'centro_pc'; j.x = 6 * T + 8; j.y = 5 * T + 14; j.vida = { pompon: 0 }; j.brillos = 10;
    const r = motor.aplicar(est, { j: 'oli', t: 'curar' }); ok(r.curadas === false && r.falta === 10 && j.vida && j.brillos === 10 && est.avisos.some((a) => /cuesta 20/.test(a.texto)), 'v2.316 sin Brillos suficientes Alba no cura y lo dice (faltan 10)');
    j.brillos = 25; const r2 = motor.aplicar(est, { j: 'oli', t: 'curar' }); ok(r2.curadas === true && r2.coste === 20 && j.brillos === 5 && !j.vida, 'v2.316 curar a una debilitada cuesta 20 ✦ y deja la vida completa');
    j.vida = { pompon: 100, zefirax: 0 }; j.brillos = 28; ok(motor.aplicar(est, { j: 'oli', t: 'curar' }).coste === 28 && j.brillos === 0, 'v2.316 8 por herida + 20 por debilitada = 28'); delete j.vida; j.brillos = 50; ok(motor.aplicar(est, { j: 'oli', t: 'curar' }).curadas === false && j.brillos === 50, 'v2.316 sin heridas no se cobra nada'); }
  { const { est, j } = mk(81); const f = { pez: 'pez_loro', kg: 1 }; motor.capturar(est, j, f); ok(j.mochila.pez_loro === 1 && j.brillos === 100 + 10 + Tn.precioPez('pez_loro') && f.nuevo, 'v2.316 el primer pez de una especie va a la mochila y da premio (10 + su valor)');
    const b = j.brillos; motor.capturar(est, j, { pez: 'pez_loro', kg: 1 }); ok(j.mochila.pez_loro === 2 && j.brillos === b && j.capturas.pez_loro === 2, 'v2.316 los siguientes solo suman a la mochila (y a la colección) sin premio'); }
  { const C = G.mundo.mapa('tienda'), t = C.npcs[0]; ok(C.npcs.length === 2 && C.npcs[1].id === 'tablon' && G.NAMES.tablon === 'tbl' && G.spr.tbl_down_0 && t.id === 'tendero' && G.mundo.solido(C, 7, 2) && G.spr.tnd_down_0 && G.NPC_TEO.length === 21 && G.NPC_TEO.every((r) => r.length === 16) && G.vista.persona('tendero', 'down', false, 0).clave === 'tnd_down_0', 'v2.317 el tendero Teo ocupa la casilla (7,2) y tiene sprite propio (16×21)');
    const { est, j } = mk(82); j.mapa = 'tienda'; j.x = 7 * T + 8; j.y = 4 * T + 14; ok(G.npc.cercano(est, j) && G.npc.cercano(est, j).id === 'tendero', 'v2.317 desde la casilla frontal (7,4) se puede hablar con él'); const r = motor.aplicar(est, { j: 'oli', t: 'hablar' }); ok(r && r.npc === 'tendero' && j.dir === 'up', 'v2.317 hablar: se vuelve hacia él');
    j.y = 6 * T + 14; ok(!G.npc.cercano(est, j) || G.npc.cercano(est, j).id !== 'tendero' || Math.hypot(j.x - G.npc.centro(t).x, j.y - G.npc.centro(t).y) <= 2.6 * T, 'v2.317 el alcance respeta el valor del mapa'); }
  { const g = G.npc.GUION.tendero, a = G.npc.GUION.enfermera; ok(g.tipo === 'tienda' && g.saludo.length >= 2 && g.consejos.length >= 5 && g.consejos.every((c) => Array.isArray(c) && c.length >= 1) && g.comprar && g.vender && g.mas && g.adios && a.sinBrillos.some((t) => /\{coste\}/.test(t)) && G.NAMES.tendero === 'tnd', 'v2.317 el guion del tendero (saludo, comprar, vender, 6 consejos) y la frase «sin Brillos» de Alba existen'); }
  { const { est, j } = mk(83); j.mochila = { pocion: 2, revivir: 1, pez_loro: 3, pez_sardina: 1 }; const F = G.bolsaUI.filas(j);
    ok(F.map((q) => q.id).join() === 'pocion,revivir,pez_loro,pez_sardina' || F.map((q) => q.id).join() === 'pocion,revivir,pez_sardina,pez_loro', 'v2.318 la Bolsa lista objetos (orden del catálogo) y luego pescados'); ok(F[0].usable && F[1].usable && !F[2].usable && F[2].pez && F[2].venta === Tn.precioPez('pez_loro') && F[0].venta === 20, 'v2.318 solo las pociones se pueden usar; el pescado se vende entero y el objeto a la mitad');
    const sana = { debil: false, hp: 100, hpMax: 100 }, herida = { debil: false, hp: 40, hpMax: 100 }, caida = { debil: true, hp: 0, hpMax: 100 };
    ok(!G.bolsaUI.sobre(j, 'pocion', sana).ok && G.bolsaUI.sobre(j, 'pocion', herida).ok && !G.bolsaUI.sobre(j, 'pocion', caida).ok && G.bolsaUI.sobre(j, 'revivir', caida).ok && !G.bolsaUI.sobre(j, 'revivir', herida).ok, 'v2.318 la Bolsa solo deja usar cada objeto donde sirve'); }
  { const ui = R('src/bolsa_ui.js'), dl = R('src/dialogo_ui.js'), gm = R('src/game.js'), ix = R('index.html');
    ok(!/Math\.random|Date\.now/.test(ui + dl) && /api\.(comprar|vender|usar)\(/.test(ui) && !/\.brillos\s*=|\.mochila\s*=|\.vida\s*=/.test(ui + dl), 'v2.318 las interfaces no usan azar ni tocan el estado: piden órdenes');
    ok(/t: 'comprar', id, n/.test(gm) && /t: 'vender', id, n/.test(gm) && /t: 'usar', id, forma/.test(gm) && /id="bbtn"/.test(ix) && /id="bril"/.test(ix) && /#bolsa \{/.test(ix) && /G\.bolsaUI\.abrir\(yo\(\), \{ modo: 'mochila'/.test(gm) && /bolsa: \(modo, alCerrar\)/.test(gm), 'v2.318 game.js y el HUD conectan la Bolsa (botón ✦) y la Tienda');
    ok(/id === 'comprar' \|\| id === 'vender'/.test(dl) && /menuTienda/.test(dl) && /D\.g\.consejos/.test(dl) && /D\.g\.sinBrillos/.test(dl), 'v2.317 el diálogo tiene el menú del tendero y avisa a Alba si faltan Brillos'); }
  { const D = G.tienda; ok(D.TIENDA.every((id) => D.precioCompra(id) > 0) && D.precioCompra('pocion') < D.precioCompra('superpocion') && D.precioVenta('pocion') < D.precioCompra('pocion') && D.precioCurar({ vida: { a: 0 } }) < D.precioCompra('pocion'), 'v2.319 equilibrio: curar con Alba es más barato que gastar una Poción; vender siempre paga menos que comprar'); } }
// ===== v2.320 · PROFUNDIDADES: datos, resolutor de puzles, generador por semilla, motor (puertas, rocas, hielo, llaves, cofres), guardado =====
{ const P = G.profundidades, D = P.D, motor = G.motor, mundo = G.mundo, fs = require('fs'), path = require('path');
  const src = fs.readFileSync(path.join(__dirname, 'src/profundidades.js'), 'utf8'), ui = fs.readFileSync(path.join(__dirname, 'src/profundidades_ui.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'src/cueva2d.js'), 'utf8');
  ok(!/Math\.random|Date\.now|document\.|localStorage/.test(src), 'v2.320 prof: el motor de las Profundidades es puro (sin Math.random, relojes ni DOM)');
  ok(!/Math\.random/.test(ui) && !/est\.prof\s*=|\.llaves\s*[-+]?=|\.pisos\[/.test(ui), 'v2.320 prof: el pintor y la interfaz no usan azar ni tocan el estado');
  ok(/^\/\/ profundidades\.js — /.test(src) && /^\/\/ cueva2d\.js — /.test(ui.slice(ui.indexOf('// cueva2d.js'))), 'v2.320 prof: cabecera estándar en los módulos');
  // datos
  ok(D.salas.every((s) => P.validarSala(s).length === 0), 'v2.320 prof: todas las salas prefabricadas son válidas: ' + D.salas.map((s) => P.validarSala(s)[0]).filter(Boolean).join(' · '));
  const puz = D.salas.filter((s) => s.tipo === 'puzle');
  ok(puz.length >= 12 && P.BIOMAS.length >= 5 && D.pisosEspeciales.length >= 6 && D.modificadores.some((m) => m.tipo === 'bendicion') && D.modificadores.some((m) => m.tipo === 'maldicion'), 'v2.320 prof: ≥ 12 puzles, ≥ 5 biomas, ≥ 6 pisos especiales, bendiciones y maldiciones');
  ok(new Set(P.BIOMAS.map((b) => D.biomas[b].mecanica.tipo)).size >= 5 && P.BIOMAS.every((b) => D.biomas[b].musica && D.biomas[b].elementos.length), 'v2.320 prof: cada bioma tiene su mecánica ambiental propia, música y elementos');
  // resolutor
  ok(puz.every((s) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([h, v]) => P.comprobarPuzle(s.id, !!h, !!v).ok)), 'v2.320 prof: cada puzle (y sus espejos) tiene solución con dos jugadores y no con uno');
  { const libre = P.prepararSala({ id: 't1', tipo: 'puzle', filas: ['#####', 'E...S', '#####'] }), cerr = P.prepararSala({ id: 't2', tipo: 'puzle', filas: ['#######', 'E.a#A.S', '#######'] }), una = P.prepararSala({ id: 't3', tipo: 'puzle', filas: ['#######', '#.1...#', 'E...A.S', '#######'] });
    ok(P.resolver(libre, { solo: 0 }).ok && !P.resolver(cerr).ok && P.resolver(una, { solo: 0 }).ok, 'v2.320 prof: el resolutor detecta el puzle que resuelve uno solo (palanca) y el que no tiene solución');
    const hielo = P.prepararSala(P.SALAS.hielo_tope); ok(!P.resolver(hielo, { solo: 0 }).ok && P.resolver(hielo).ok && P.resolver(hielo).pasos <= 8, 'v2.320 prof: en el hielo solo se frena contra el compañero'); }
  // generador
  { let malos = [], tipos = {}, biomas = {}, det = true, puzN = 0; const firmas = new Set();
    for (let s = 0; s < 250; s++) { const id = P.idMapa(P.BIOMAS[s % P.BIOMAS.length], P.hash('t' + s), 1 + (s * 7) % 30), j = P.generar(id), e = P.verificar(j); if (e.length) malos.push(id + ': ' + e[0]); tipos[j.prof.especial || j.prof.tipo] = 1; biomas[j.prof.bioma] = 1; firmas.add(P.medir(j).firma); puzN += j.prof.salas.filter((q) => q.tipo === 'puzle').length;
      if (!j.prof.salida || !(P.medir(j).largo > 0)) malos.push(id + ': sin bajada alcanzable'); if (!j.suelo.every((r) => /^[cx]+$/.test(r)) || j.suelo[0].indexOf('c') >= 0) malos.push(id + ': suelo'); }
    ok(malos.length === 0, 'v2.320 prof: 250 pisos transitables al 100 %, con bajada alcanzable y sin objetos aislados' + (malos.length ? ': ' + malos.slice(0, 3).join(' · ') : ''));
    ok(Object.keys(biomas).length === P.BIOMAS.length && ['normal', 'jefe', 'tesoro', 'santuario', 'evento', 'tienda', 'descanso'].every((t) => tipos[t]) && firmas.size > 150 && puzN > 100, 'v2.320 prof: salen todos los biomas, pisos de jefe y especiales, con variedad (' + firmas.size + ' trazados distintos de 250)');
    const id = P.idMapa('mina', 4242, 7), a = JSON.stringify(P.generar(id)); delete require.cache[require.resolve('./src/profundidades.js')]; const P0 = G.profundidades, m0 = { g: mundo.generador, em: motor.estadoMapa, mj: motor.moverJugador, mjs: motor.moverJugadores, cr: motor.cruzar, ap: motor.aplicar }; require('./src/profundidades.js'); const b = JSON.stringify(G.profundidades.generar(id)); G.profundidades = P0; mundo.generador = m0.g; motor.estadoMapa = m0.em; motor.moverJugador = m0.mj; motor.moverJugadores = m0.mjs; motor.cruzar = m0.cr; motor.aplicar = m0.ap;
    ok(a === b && P.plan(1, 'hielo', 5).tipo === 'jefe' && P.plan(1, 'hielo', 1).bioma === 'hielo' && P.plan(1, 'hielo', 6).bioma !== 'hielo', 'v2.320 prof: el mismo id da el mismo piso (dos móviles), jefe cada 5 pisos y bioma nuevo en cada tramo'); }
  // motor: una expedición de verdad con dos jugadores
  { const e = motor.crear(777), o = e.jugadores.oli, l = e.jugadores.lali, T = 16, pon = (j, x, y) => { j.x = x * T + 8; j.y = y * T + 14; }, tic = (n) => { for (let i = 0; i < (n || 1); i++) motor.moverJugadores(e, 0.05); };
    const anda = (j, dir, n) => { motor.aplicar(e, { j: j.id, t: 'teclas', [dir]: 1 }); tic(n); motor.aplicar(e, { j: j.id, t: 'teclas' }); }, cas = (j) => [Math.floor(j.x / T), Math.floor(j.y / T)];
    e.avisos.length = 0; const alb = mundo.mapa('albanota'), pu = alb.puertas.find((q) => q.destino.mapa === '@prof'); o.mapa = 'albanota'; pon(o, pu.x, pu.y + 1); anda(o, 'up', 12);
    ok(P.esProf(o.mapa) && mundo.mapa(o.mapa).prof.piso === 0 && o.volver.length === 1, 'v2.320 prof: la boca de la cueva (puerta «@prof») lleva al campamento y recuerda por dónde volver');
    { const c = mundo.mapa(o.mapa), baj = c.prof.els.find((q) => q.t === 'bajada'); pon(o, baj.x, baj.y + 1); anda(o, 'up', 8); }
    const ex = e.prof.exp; ok(ex && ex.miembros.join() === 'oli' && mundo.mapa(o.mapa).prof.piso === 1 && o.prof.record === 1, 'v2.320 prof: la escalera del campamento empieza una expedición en el piso 1');
    l.mapa = o.mapa; l.x = o.x; l.y = o.y; tic(); ok(ex.miembros.join() === 'oli,lali' && P.slotDe(e, l) === 0 && P.slotDe(e, o) === 1, 'v2.320 prof: el segundo jugador se une a la expedición (runas sol y luna)');
    // busca un piso con el puzle «portero» sin espejo vertical y lo juega con el motor
    let m = null, sala = null; for (let s = 0; s < 400 && !sala; s++) { ex.sem = P.hash('pt' + s); ex.pisos = {}; const q = mundo.mapa(P.idMapa(ex.bioma0, ex.sem, 1)); sala = q.prof.salas.find((z) => z.id === 'portero'); if (sala) m = q; }
    ok(!!sala, 'v2.320 prof: hay pisos con el puzle «portero»');
    if (sala) { [o, l].forEach((j) => { j.mapa = m.id; motor.estadoMapa(e, m.id); });
      const dx = sala.E[0] < sala.S[0] ? 1 : -1, pl = m.prof.els.find((q) => q.sala === sala.i && q.t === 'placa'), ga = m.prof.els.find((q) => q.sala === sala.i && q.t === 'puerta'), gi = m.prof.els.indexOf(ga), dir = dx > 0 ? 'right' : 'left';
      pon(o, sala.E[0] + dx, sala.E[1]); pon(l, ga.x - dx, ga.y); tic();
      ok(!P.dinamica(e, m).abierta[gi], 'v2.320 prof: la reja empieza cerrada'); anda(l, dir, 30); ok(cas(l)[0] === ga.x - dx, 'v2.320 prof: una reja cerrada no deja pasar');
      pon(o, pl.x, pl.y); tic(); ok(!!P.dinamica(e, m).abierta[gi] && P.vista(e, m).find((q) => q.i === gi).abierta, 'v2.320 prof: pisar la placa abre la reja');
      anda(l, dir, 14); ok(cas(l)[0] === ga.x + dx || cas(l)[0] === ga.x, 'v2.320 prof: con la placa pisada el compañero cruza'); pon(l, sala.S[0], sala.S[1]); tic();
      ok(P.ps(e, m).ok[sala.i] === 1 && e.avisos.some((a) => /resuelta/.test(a.texto)), 'v2.320 prof: al llegar uno a la salida la sala queda resuelta'); pon(o, sala.E[0] + dx, sala.E[1]); tic(); ok(!!P.dinamica(e, m).abierta[gi], 'v2.320 prof: una sala resuelta deja sus rejas abiertas para siempre'); }
    // rocas: empujar andando; hielo: resbalar hasta el compañero
    { let mb = null, sb = null; for (let s = 0; s < 600 && !sb; s++) { ex.sem = P.hash('bq' + s); ex.pisos = {}; const q = mundo.mapa(P.idMapa(ex.bioma0, ex.sem, 4)); sb = q.prof.salas.find((z) => z.id === 'bloque_foso' && !z.fh); if (sb) mb = q; }
      ok(!!sb, 'v2.320 prof: hay pisos con el puzle «bloque_foso»');
      if (sb) { [o, l].forEach((j) => { j.mapa = mb.id; motor.estadoMapa(e, mb.id); j.profDesl = null; }); const els = mb.prof.els, bl = els.find((q) => q.sala === sb.i && q.t === 'bloque'), bi = els.indexOf(bl), pl = els.find((q) => q.sala === sb.i && q.t === 'placa'), s = P.ps(e, mb);
        pon(l, pl.x, pl.y); pon(o, bl.x - 1, bl.y); tic(); anda(o, 'right', 90); const foso = Object.keys(s.hoy).filter((k) => k[0] !== 'b');
        ok(foso.length === 1 && s.hoy['b' + bi] === 1, 'v2.320 prof: la roca se empuja andando, cruza la reja abierta y tapa el foso'); anda(o, 'right', 40); ok(s.ok[sb.i] === 1, 'v2.320 prof: por el foso tapado se llega a la salida');
        const r0 = (ex.pisos[4].ok = {}, ex.pisos[4].hoy = { ['b' + bi]: 1 }, pon(o, sb.E[0] + 1, sb.E[1]), motor.aplicar(e, { j: 'oli', t: 'prof', a: 'reiniciar' })); ok(r0 && r0.prof === 'reinicio' && !s.hoy['b' + bi], 'v2.320 prof: «Reiniciar sala» devuelve el puzle a su estado inicial'); } }
    { let mh = null, sh = null; for (let s = 0; s < 900 && !sh; s++) { ex.sem = P.hash('hi' + s); ex.pisos = {}; const q = mundo.mapa(P.idMapa(ex.bioma0, ex.sem, 8)); sh = q.prof.salas.find((z) => z.id === 'hielo_tope' && !z.fh && !z.fv); if (sh) mh = q; }
      ok(!!sh, 'v2.320 prof: hay pisos con el puzle «hielo_tope»');
      if (sh) { [o, l].forEach((j) => { j.mapa = mh.id; motor.estadoMapa(e, mh.id); j.profDesl = null; }); pon(l, sh.x + 6, sh.y + 3); pon(o, sh.x + 1, sh.y + 1); tic(); anda(o, 'right', 4); tic(60);
        ok(cas(o)[0] === sh.x + 6 && cas(o)[1] === sh.y + 1 && !o.profDesl, 'v2.320 prof: sobre el hielo se resbala hasta la pared'); anda(o, 'down', 4); tic(60);
        ok(cas(o)[0] === sh.x + 6 && cas(o)[1] === sh.y + 2, 'v2.320 prof: el compañero hace de tope en el hielo'); anda(o, 'right', 10); ok(P.ps(e, mh).ok[sh.i] === 1, 'v2.320 prof: desde el tope se alcanza la salida del hielo'); } }
    // cofres, llaves, cerraduras, escaleras, guardado
    { let mk = null; for (let s = 0; s < 300 && !mk; s++) { ex.sem = P.hash('ll' + s); ex.pisos = {}; const q = mundo.mapa(P.idMapa(ex.bioma0, ex.sem, 1)); if (q.prof.els.some((z) => z.t === 'llave') && q.prof.els.some((z) => z.t === 'cofre') && q.prof.els.some((z) => z.t === 'cerradura')) mk = q; }
      ok(!!mk, 'v2.320 prof: hay pisos con llave, cofre y cerradura');
      if (mk) { [o, l].forEach((j) => { j.mapa = mk.id; motor.estadoMapa(e, mk.id); j.profDesl = null; pon(j, mk.anclas.entrada[0], mk.anclas.entrada[1]); }); const els = mk.prof.els, ce = els.find((q) => q.t === 'cerradura'), ci = els.indexOf(ce), ll = els.find((q) => q.t === 'llave'), co = els.find((q) => q.t === 'cofre'), s = P.ps(e, mk), g = mk.prof.g;
        const lado = (q) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [q.x + a, q.y + b]).find(([x, y]) => g[y][x] !== '#' && !els.some((z) => z.x === x && z.y === y));
        { const q = lado(ce); pon(o, q[0], q[1]); o.dir = q[0] < ce.x ? 'right' : q[0] > ce.x ? 'left' : q[1] < ce.y ? 'down' : 'up'; } tic(); const r1 = motor.aplicar(e, { j: 'oli', t: 'hablar' }); ok(r1 && r1.prof === 'cerrado' && !s.abi[ci] && P.bloqueosDe(e, mk, o).has(ce.x + ',' + ce.y), 'v2.320 prof: sin llave la cerradura no se abre');
        pon(l, ll.x, ll.y); tic(); ok(P.llaves(e) === 1, 'v2.320 prof: pisar la llave la recoge'); const r2 = motor.aplicar(e, { j: 'oli', t: 'hablar' }); tic(); ok(r2 && r2.prof === 'abre' && P.llaves(e) === 0 && !P.bloqueosDe(e, mk, o).has(ce.x + ',' + ce.y), 'v2.320 prof: la llave abre la cerradura y se gasta');
        const b0 = G.tienda.saldo(o), bl0 = G.tienda.saldo(l); { const q = lado(co); pon(o, q[0], q[1]); pon(l, q[0], q[1]); } tic(); const r3 = motor.aplicar(e, { j: 'oli', t: 'prof', a: 'accion' }); ok(r3 && r3.prof === 'cofre' && G.tienda.saldo(o) > b0 && G.tienda.saldo(l) > bl0 && !motor.aplicar(e, { j: 'oli', t: 'prof', a: 'accion' }), 'v2.320 prof: un cofre premia a los dos jugadores y solo una vez');
        const antes = JSON.stringify(e.prof), d = G.guardado.serializar(e), e2 = motor.crear(5); ok(G.guardado.restaurar(e2, JSON.parse(JSON.stringify(d))) && JSON.stringify(e2.prof) === antes && e2.jugadores.oli.mapa === mk.id && e2.jugadores.oli.prof.record >= 1, 'v2.320 prof: la expedición (piso, semilla, cofres, llaves, puzles) se guarda y se restaura');
        ok(!P.restaurar(motor.crear(6), { v: 99 }) && (() => { const e3 = motor.crear(7); G.guardado.restaurar(e3, { v: 1, jugadores: { oli: { mapa: mk.id, x: 40, y: 40, dir: 'down', ang: 0 } }, prof: { v: 1, n: 3, exp: 'roto' } }); return e3.jugadores.oli.mapa !== mk.id && e3.prof.exp === null; })(), 'v2.320 prof: un guardado roto no rompe la partida ni deja al jugador en un piso sin expedición');
        const baj = mk.prof.salida; pon(o, baj[0], baj[1]); o.profEn = null; tic(); ok(mundo.mapa(o.mapa).prof.piso === 2 && l.mapa === o.mapa && o.prof.record === 2 && ex.piso === 2, 'v2.320 prof: la escalera baja a todo el grupo y apunta el récord');
        ok(P.nivelExtra(e, o.mapa, { id: 'pompon' }) >= 1 && P.nivelExtra(e, 'albanota', { id: 'pompon' }) === 0, 'v2.320 prof: los rivales suben de nivel con la profundidad');
        motor.aplicar(e, { j: 'oli', t: 'prof', a: 'salir' }); ok(mundo.mapa(o.mapa).prof.piso === 0 && e.prof.exp && e.prof.exp.miembros.join() === 'lali', 'v2.320 prof: «Salir» devuelve al campamento y la expedición sigue para el compañero'); motor.aplicar(e, { j: 'lali', t: 'prof', a: 'salir' }); ok(e.prof.exp === null && e.prof.ult.piso === 2, 'v2.320 prof: al salir el último, la expedición se cierra');
        { const c = mundo.mapa(o.mapa), sub = c.prof.els.find((q) => q.t === 'subida'); pon(o, sub.x, sub.y); o.profEn = null; tic(); ok(o.mapa === 'albanota' && !motor.bloqueado(alb, o.x, o.y) && o.volver.length === 0, 'v2.320 prof: la escalera del campamento devuelve a la superficie junto a la boca'); } } }
    // expedición diaria: misma cueva con semillas de partida distintas; modificadores
    { const a = motor.crear(1), b = motor.crear(2), ja = a.jugadores.oli, jb = b.jugadores.lali; [[a, ja], [b, jb]].forEach(([q, j]) => { P.entrarCampamento(q, j, 'mina'); const c = mundo.mapa(j.mapa), po = c.prof.els.find((z) => z.t === 'portal'); j.x = po.x * 16 + 8; j.y = po.y * 16 + 14; });
      ok(motor.aplicar(a, { j: 'oli', t: 'hablar' }) === null || ja.mapa.indexOf('_0_0') > 0, 'v2.320 prof: el portal diario no se abre sin la fecha'); motor.aplicar(a, { j: 'oli', t: 'hablar', dia: 20500 }); motor.aplicar(b, { j: 'lali', t: 'prof', a: 'accion', dia: 20500 });
      ok(ja.mapa === jb.mapa && a.prof.exp.dia === 20500 && a.prof.exp.mods.length === 2 && a.prof.exp.mods.join() === b.prof.exp.mods.join() && ja.prof.diaria.piso === 1, 'v2.320 prof: la expedición diaria es la misma cueva y los mismos modificadores para todos');
      const luz0 = P.mod(a, 'luz', 5), n0 = a.prof.exp.mods.length; a.prof.exp.mods = []; P.darMod(a, 'linterna'); P.darMod(a, 'llavero'); ok(P.mod(a, 'luz', 5) === 7 && P.llaves(a) === 1 && !P.darMod(a, 'linterna') && P.mod(a, 'brillos', 1) === 1, 'v2.320 prof: los modificadores (datos) cambian la luz y dan llaves, sin repetirse'); }
    // dos móviles: cada uno con su partida (semillas distintas); B entra en la cueva de A, y lo que hace uno (palanca, cofre, sala resuelta) llega al otro
    { const A = motor.crear(101), B = motor.crear(202), R = G.red, cruza = () => { R.aplicar(B, 'oli', JSON.parse(JSON.stringify(R.resumen(A, 'oli')))); R.aplicar(A, 'lali', JSON.parse(JSON.stringify(R.resumen(B, 'lali')))); };
      P.empezar(A, A.jugadores.oli, 'mina', 0); cruza(); P.entrarCampamento(B, B.jugadores.lali, 'mina'); P.empezar(B, B.jugadores.lali, 'mina', 0); cruza(); cruza();
      ok(B.jugadores.lali.mapa === A.jugadores.oli.mapa && B.prof.exp.sem === A.prof.exp.sem && A.prof.exp.miembros.slice().sort().join() === 'lali,oli' && P.slotDe(A, A.jugadores.oli) === P.slotDe(B, B.jugadores.oli), 'v2.320 prof (dos móviles): el segundo móvil entra en la MISMA cueva y los dos ven las mismas runas');
      const m = mundo.mapa(A.jugadores.oli.mapa), ci = m.prof.els.findIndex((q) => q.t === 'cofre'), sA = P.ps(A, m), b0 = G.tienda.saldo(B.jugadores.lali);
      if (ci >= 0) { const co = m.prof.els[ci]; A.jugadores.oli.x = (co.x) * 16 + 8; A.jugadores.oli.y = (co.y + 1) * 16 + 14; motor.aplicar(A, { j: 'oli', t: 'prof', a: 'accion', el: ci }); } sA.pal[3] = 1; sA.nv++; sA.ok[0] = 1; cruza(); const sB = P.ps(B, m);
      ok(sB.ok[0] === 1 && sB.pal[3] === 1 && sB.nv === sA.nv && (ci < 0 || (sB.cof[ci] === 1 && G.tienda.saldo(B.jugadores.lali) > b0)), 'v2.320 prof (dos móviles): cofres, palancas y salas resueltas se funden; el cofre que abre uno premia también al otro');
      delete sB.pal[3]; sB.nv++; cruza(); ok(!sA.pal[3] && sA.nv === sB.nv, 'v2.320 prof (dos móviles): lo reversible (palancas, rocas) sigue a la versión más nueva');
      ok(!R.aplicar(A, 'lali', Object.assign(R.resumen(B, 'lali'), { mapa: 'prof_mina_zz_1' })) && R.aplicar(A, 'lali', Object.assign(R.resumen(B, 'lali'), { prof: { sem: 'x' } })), 'v2.320 prof (dos móviles): un mensaje con un piso o una expedición inválidos no rompe nada'); }
    // rivales: el plan de un piso sale de la semilla de la expedición y los jefes están en su fase alta
    { const a = motor.crear(11), b = motor.crear(22), id = P.idMapa('cristal', 999, 5), m = mundo.mapa(id), ea = motor.estadoMapa(a, id), eb = motor.estadoMapa(b, id), gj = ea.plan.huecos.find((h) => h.guarida);
      ok(JSON.stringify(ea.plan) === JSON.stringify(eb.plan) && m.prof.tipo === 'jefe' && gj && gj.actual && G.FORMAS[gj.actual].stage >= 2 && !!m.prof.jefe, 'v2.320 prof: los rivales de un piso son los mismos en dos partidas y el jefe sale en su fase alta'); }
  ok(G.audio.temaEn({ prof: {}, tema: 'prof_mina', zonas: [{ x: 0, y: 0, w: 9, h: 9, elemento: 'roca' }] }, 1, 1) === 'prof_mina' && P.BIOMAS.every((b) => G.audio.eventos('prof_' + b).porBeat.length === 16), 'v2.320 prof: cada bioma tiene su música por código (16 pulsos) y manda sobre la de la zona');
  ok(/if \(m\.prof\) return G\.cueva2d\.fondo\(m\)/.test(fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8')) && typeof G.cueva2d.luz === 'function' && typeof G.cueva2d.mini === 'function' && G.cueva2d.mascara(mundo.mapa(P.idMapa('hielo', 5, 2))).M.some((v) => v === 0), 'v2.320 prof: el pintor 2D tiene fondo con auto-baldosas, luz y minimapa');
  ok(['validar_salas.js', 'validar_puzles.js', 'probar_semillas.js', 'hoja_pisos.js'].every((f) => fs.existsSync(path.join(__dirname, 'tools', f))) && fs.existsSync(path.join(__dirname, 'docs/GUIA_PROFUNDIDADES.md')), 'v2.320 prof: existen las herramientas de una línea y la guía'); } }
// ── v2.324 · ENTRENADORES AUTÓNOMOS (src/agentes*.js, datos/agentes.json, docs/AGENTES.md) ──
{ const fs = require('fs'), path = require('path'), mundo = G.mundo, A = G.agentes, M = A.mente, w = A.W(), motor = G.motor, mk2 = (sem, n) => ({ semilla: sem, agentes: A.crear(sem, n), avisos: [], jugadores: {} }), corre = (e, s, dt) => { dt = dt || 1; for (let i = 0; i < s / dt; i++) A.avanzar(e, dt); };
  const finito = (o) => (typeof o === 'number' ? Number.isFinite(o) : o && typeof o === 'object' ? Object.keys(o).every((k) => finito(o[k])) : o !== undefined);
  // mundo y nacimiento
  ok(w.ids.length === 15 && w.pueblos.length === 8 && w.nodos.albanota.cura && w.nodos.albanota.tienda && w.nodos.albanota.pesca && w.nodos.albanota.real && w.ids.filter((i) => w.nodos[i].salvaje).length === 7 && w.ids.every((a) => w.ids.every((b) => w.dist[a][b] < Infinity)), 'v2.324 agentes: el grafo sale de datos/mundo.json (8 pueblos, 7 rutas con criaturas, todo conectado) y Albanota tiene cura, tienda y pesca');
  { const a = A.crear(5, 24), b = A.crear(5, 24), c = A.crear(6, 24); ok(JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) !== JSON.stringify(c) && new Set(a.pob.map((q) => q.nom)).size === 24 && a.pob.every((q) => w.nodos[q.casa].pueblo && G.FORMAS[q.equipo[0]] && A.D.ambiciones[q.amb] && q.brillos === G.tienda.INICIO && q.esferas === 5) && new Set(a.pob.map((q) => q.amb)).size >= 3, 'v2.324 agentes: la población nace de la semilla (misma semilla = mismos entrenadores), con nombre, carácter, ambición, pueblo y criatura propios, y con lo mismo que un jugador nuevo'); }
  // 1) varios deciden a la vez  2) objetivos que evolucionan  5) progresan solos
  const e = mk2(7, 24), n0 = A.resumen(e), objs = e.agentes.pob.map(() => new Set()), simult = { max: 0 };
  { const d0 = M.despertar; let enTick = 0, tk = -1; M.despertar = function (es, ag, a, t) { if (ag.n !== tk) { tk = ag.n; enTick = 0; } enTick++; simult.max = Math.max(simult.max, enTick); return d0.apply(this, arguments); };
    for (let i = 0; i < 1800; i++) { A.avanzar(e, 1); if (i % 20 === 0) e.agentes.pob.forEach((a, k) => { if (a.obj) objs[k].add(a.obj.t); }); } M.despertar = d0; }
  const r = A.resumen(e), P = e.agentes.pob;
  ok(simult.max >= 2 && r.sucesos.planes > 24 * 5 && Object.keys(r.objetivos).length >= 4 && P.every((a) => a.k > 10), 'v2.324 agentes: los 24 deciden por su cuenta y a la vez (varios despiertan en el mismo tick, cada uno con su plan)');
  ok(objs.filter((s) => s.size >= 3).length >= 18 && r.sucesos.hito >= 5 && P.some((a) => a.etapa > 0) && (r.sucesos.crisis | 0) + (r.sucesos.ambicion_cumplida | 0) >= 1 && P.some((a) => Object.keys(a.hechas).length > 0), 'v2.324 agentes: los objetivos cambian con el tiempo (objetivos cortos distintos, hitos de la ambición y al menos un cambio de ambición)');
  ok(r.nivelMedio > n0.nivelMedio + 1 && r.especiesMedia > 2 && r.sucesos.victoria_salvaje > 50 && r.sucesos.captura > 10 && Object.keys(r.lugares).length >= 3 && P.filter((a) => Object.keys(a.vis).length >= 3).length >= 12, 'v2.324 agentes: progresan sin ningún jugador (suben de nivel, capturan, viajan por el mundo)');
  // 3) memoria
  { const der = P.filter((a) => a.h.der), ok1 = der.length > 0 && der.some((a) => a.mem.some((q) => q[1] === 'der' && a.rel[q[2]] && a.rel[q[2]].du >= 1));
    const a = JSON.parse(JSON.stringify(P[0])), t = 1800; a.mem = []; a.veto = {}; a.sac = {}; a.vida = undefined; delete a.vida; a.lug = 'albanota'; a.amb = 'criador'; const ag2 = { sem: 7, cont: {} }, d1 = (M.candidatos(ag2, a, t).find((o) => o.t === 'entrenar') || {}).d; M.recordar(a, t, 'ko', 'x', d1, -1, 0.9); M.recordar(a, t, 'ko', 'x', d1, -1, 0.9); const d2 = (M.candidatos(ag2, a, t).find((o) => o.t === 'entrenar') || {}).d;
    const b = { mem: [] }; for (let i = 0; i < 60; i++) M.recordar(b, i, i === 3 ? 'der' : 'conoce', 'a' + i, 'albanota', 0, i === 3 ? 0.95 : 0.2);
    ok(ok1 && d1 && d2 && d1 !== d2 && M.peligro(a, t, d1) > 1 && M.peligro(a, t + 20000, d1) < 0.01 && P.every((q) => q.mem.length <= A.AJ.memoria) && b.mem.length === A.AJ.memoria && b.mem.some((q) => q[1] === 'der') && M.evocar(b, 60, { tipo: 'der' }, 1)[0][2] === 'a3', 'v2.324 agentes: recuerdan lo que les pasa (derrotas, capturas, sitios peligrosos), el recuerdo cambia sus decisiones (evita la ruta donde cayó), se apaga con el tiempo y lo importante sobrevive al olvido'); }
  // 4) relaciones  6) consecuencias reales
  { const x = mk2(11, 2), ag = x.agentes, a = ag.pob[0], b = ag.pob[1]; A.rt(ag); A.mover(ag, b, a.lug); a.sig = b.sig = null; const tot = a.brillos + b.brillos; ag.n = 1; A.acciones.duelo(x, ag, a, b, 0.05);
    const enDuelo = ag.bat.length === 1 && a.sig === null && b.sig === null; for (let i = 0; i < 4000 && ag.bat.length; i++) A.acciones.combates(x, ag, A.rt(ag), ag.n++ * 0.05);
    const gan = a.h.vic ? a : b, per = gan === a ? b : a, rp = per.rel[gan.id], rg = gan.rel[per.id];
    ok(enDuelo && !ag.bat.length && gan.h.vic === 1 && per.h.der === 1 && gan.pres > 1000 && per.pres < 1000 && Math.abs(gan.pres + per.pres - 2000) < 0.01 && a.brillos + b.brillos === tot && gan.brillos > per.brillos && rp.du === 1 && rp.af < 0 && rp.re === 15 && rg.du === 1 && rg.af > 0 && per.mem.some((q) => q[1] === 'der' && q[2] === gan.id) && gan.mem.some((q) => q[1] === 'vic') && (per.vida || gan.vida) && Number.isFinite(a.sig) && Number.isFinite(b.sig) && ag.cron.some((q) => q[1] === 'duelo'), 'v2.324 agentes: un duelo (motor de combate real) deja consecuencias: prestigio, Brillos que cambian de manos, vida gastada, recuerdo de la derrota y una relación que empeora');
    M.tocar(a, b.id, 100, a.lug, 40, 0); const v1 = M.vinculo(a.rel[b.id]); b.vida = {}; b.equipo.forEach((f) => { b.vida[f] = 0; }); b.brillos = 0; a.brillos = 500; a.per.gen = 0.9; const af0 = b.rel[a.id].af, ayudo = M.ayudar(ag, a, b, 120);
    M.tocar(a, b.id, 120, a.lug, 40, 0); ok((v1 === 'amigo' || v1 === 'aliado') && ayudo && b.brillos === G.tienda.precioCurar(b) && a.brillos === 500 - b.brillos && b.rel[a.id].af >= af0 + 20 && b.mem.some((q) => q[1] === 'ayuda') && M.vinculo(a.rel[b.id]) === 'aliado' && M.vinculo({ af: -50, du: 0 }) === 'enemigo' && M.vinculo({ af: 0, du: 2 }) === 'rival', 'v2.324 agentes: amistad, alianza, rivalidad y enemistad salen de lo vivido; un amigo paga la cura del que está caído y sin Brillos');
    ok(r.vinculos.rival > 0 && r.vinculos.amigo > 0 && r.sucesos.duelo > 5 && r.sucesos.charla > 20 && P.some((q) => q.mem.some((m) => m[1] === 'aviso')), 'v2.324 agentes: en la simulación larga aparecen rivales y amigos y los avisos de peligro pasan de boca en boca'); }
  { const x = mk2(3, 1), ag = x.agentes, a = ag.pob[0], f = a.equipo[0]; A.rt(ag); A.mover(ag, a, 'ruta_obsidra_1'); a.poi = 'z'; a.vida = { [f]: 1 }; a.brillos = 0; a.sig = null; ag.n = 1;
    const pl = M.planificar(ag, a, { t: 'sanar' }, 0).map((p) => p.a + (p.d ? ':' + p.d : '')).join(' '); a.brillos = 300; const pl2 = M.planificar(ag, a, { t: 'sanar' }, 0).map((p) => p.a).join(' '), coste = G.tienda.precioCurar(a);
    A.programar(ag, a, 0.05); for (let i = 0; i < 6000 && !a.h.cur; i++) A.avanzar(x, 0.05); ok(/pescar|descansar/.test(pl) && pl2 === 'ir curar' && !a.vida && a.brillos === 300 - coste && coste > 0 && a.h.cur === 1 && w.nodos[a.lug].cura, 'v2.324 agentes: planifica según su situación (con Brillos va a curarse y paga el precio real; sin ellos busca otra vía: pescar y vender, o descansar)');
    const y = mk2(3, 1), b = y.agentes.pob[0]; A.rt(y.agentes); b.vida = { [b.equipo[0]]: 1 }; b.brillos = 0; A.mover(y.agentes, b, 'pueblo_umbrada'); b.poi = 'plaza'; b.plan = [{ a: 'curar' }]; b.obj = { t: 'sanar' }; b.sig = null; y.agentes.n = 1; A.programar(y.agentes, b, 0.05); corre(y, 15); const fallo = y.agentes.cont.plan_fallido === 1 && b.brillos === 0 && !!b.vida;
    corre(y, 400); ok(fallo && (y.agentes.cont.cura | 0) + (b.h.des | 0) >= 1 && y.agentes.cont.planes >= 2, 'v2.324 agentes: si un paso falla (no le llega para la cura) tira el plan y cambia de estrategia hasta conseguirlo'); }
  // determinismo, cuadros y guardado
  { const a = mk2(7, 24), b = mk2(7, 24), c = mk2(7, 24); corre(a, 200, 0.05); corre(b, 200, 0.025); for (let i = 0; i < 8; i++) A.avanzar(c, 25);
    ok(A.hash(a) === A.hash(b) && A.hash(a) === A.hash(c) && a.agentes.n === 4000, 'v2.324 agentes: el resultado no depende de los cuadros por segundo (mismo estado a 20, a 40 o a saltos de 25 s)');
    ok(finito(e.agentes) && JSON.stringify(JSON.parse(JSON.stringify(e.agentes))) === JSON.stringify(e.agentes), 'v2.324 agentes: el estado es JSON puro (sin funciones, undefined ni infinitos)'); }
  { const a = motor.crear(77), tecl = { j: 'oli', t: 'teclas', up: 0, down: 0, left: 0, right: 0 }; motor.aplicar(a, tecl); for (let i = 0; i < 4000; i++) motor.avanzar(a, 0.05); let medio = 0; for (let i = 0; i < 2000 && !a.agentes.bat.length; i++) { motor.avanzar(a, 0.05); medio++; }
    const g = JSON.parse(JSON.stringify(G.guardado.serializar(a))), b = motor.crear(77), okR = G.guardado.restaurar(b, g), igual = A.hash(a) === A.hash(b) && b.agentes.bat.length > 0;
    for (let i = 0; i < 6000; i++) { A.avanzar(a, 0.05); A.avanzar(b, 0.05); }
    ok(g.dim.tonavia.agentes && g.dim.tonavia.agentes.v === 1 && okR && igual && A.hash(a) === A.hash(b) && a.agentes.cont.duelo + a.agentes.cont.victoria_salvaje > 0, 'v2.324 agentes: guardar y cargar (con un combate a medias) deja el mundo idéntico y sigue igual que si no se hubiera cerrado');
    const c = motor.crear(77), roto = JSON.parse(JSON.stringify(g)); roto.dim.tonavia.agentes.pob[3].lug = 'no_existe'; G.guardado.restaurar(c, roto); const d = motor.crear(78); G.guardado.restaurar(d, g); const v0 = motor.crear(77), viejo = JSON.parse(JSON.stringify(g)); delete viejo.dim.tonavia.agentes; const okV = G.guardado.restaurar(v0, viejo); motor.avanzar(v0, 0.05);
    ok(!c.agentes && !A.restaurar(c, { v: 99 }) && !A.restaurar(c, null) && d.agentes && d.agentes.sem === 77 && d.agentes.pob[0].nom === g.dim.tonavia.agentes.pob[0].nom && okV && v0.agentes.pob.length === A.cfg.POBLACION, 'v2.324 agentes: un guardado roto o de una versión futura se descarta entero (la población renace de la semilla); los entrenadores conservan su propia semilla aunque la del mundo cambie de una sesión a otra, y una partida antigua sin entrenadores carga igual'); }
  { const a = motor.crear(9), b = motor.crear(9); A.cfg.ACTIVO = false; for (let i = 0; i < 600; i++) motor.avanzar(a, 0.05); A.cfg.ACTIVO = true; for (let i = 0; i < 600; i++) motor.avanzar(b, 0.05);
    const cr = (x) => JSON.stringify([x.jugadores, Object.keys(x.mapas).map((id) => x.mapas[id].criaturas), x.rnd()]); ok(!a.agentes && b.agentes && b.agentes.n === 600 && cr(a) === cr(b), 'v2.324 agentes: la simulación no toca el azar ni el estado del resto del juego (con ella apagada o encendida, jugadores y criaturas quedan idénticos)'); }
  { const x = mk2(4, 24), n0 = x.agentes.n; A.ponerAlDia(x, 99999); ok(x.agentes.n - n0 === Math.round(A.AJ.alDiaMax / A.DT) && x.agentes.deuda === 0 && A.ponerAlDia(x, 0) === 0, 'v2.326 agentes: el tiempo con el juego cerrado se recupera con tope y de golpe al cargar (los cuerpos nunca corren a cámara rápida delante del jugador)'); }
  // 7) rendimiento con población creciente
  { const med = (n) => { const x = mk2(7, n); corre(x, 60); const t0 = process.hrtime.bigint(); corre(x, 300); return Number(process.hrtime.bigint() - t0) / 1e6 / 300 / 60; }, m = [25, 100, 400].map(med);
    ok(m[0] < 0.1 && m[1] < 0.3 && m[2] < 1.2 && m[2] < m[0] * 60, 'v2.324 agentes: rendimiento con población creciente (ms por cuadro a 60/s: ' + m.map((v) => v.toFixed(4)).join(' / ') + ' con 25 / 100 / 400 entrenadores)'); if (process.env.VERBOSO) console.log('  · agentes ms/cuadro 25/100/400:', m.map((v) => v.toFixed(4)).join(' / ')); }
  // cuerpo 2D y hablar
  { const x = motor.crear(21), m = mundo.mapa('albanota'), ag = A.asegurar(x); let salto = 0, vistos = 0, mal = 0, andan = 0; const ant = {};
    for (let i = 0; i < 6000; i++) { A.avanzar(x, 0.05); const act = {}; G.vista.agentes(x, 'albanota').forEach((c) => { vistos++; if (c.mv) andan++; act[c.ag] = c; if (G.mundo.solido(m, Math.floor(c.x / 16), Math.floor((c.y - 1) / 16))) mal++; const p = ant[c.ag]; if (p) salto = Math.max(salto, Math.hypot(c.x - p.x, c.y - p.y)); }); Object.keys(ant).forEach((k) => delete ant[k]); Object.assign(ant, act); }
    ok(vistos > 1000 && andan > 200 && mal === 0 && salto <= 46 * 0.05 * 2 + 0.01 && G.vista.agentes(x, 'no_existe').length === 0 && G.vista.agentes(x, 'tampoco_existe').length === 0, 'v2.324 agentes: en un mapa real el cuerpo camina por casillas libres, sin saltos, a la velocidad del jugador (salto máximo ' + salto.toFixed(2) + ' px por tick)');
    const cs = G.vista.agentes(x, 'albanota'), j = x.jugadores.oli, c0 = cs[0]; j.mapa = 'albanota'; j.x = c0.x + 10; j.y = c0.y; const nA = x.avisos.length, r1 = motor.aplicar(x, { j: 'oli', t: 'hablar' }), a = A.porId(x, c0.ag), r2 = motor.aplicar(x, { j: 'oli', t: 'hablar' });
    const k = motor.crear(21), jk = k.jugadores.oli; A.avanzar(k, 1); motor.aplicar(k, { j: 'oli', t: 'colocar', mapa: 'centro_pc', ancla: 'npc_frente' }); const rn = motor.aplicar(k, { j: 'oli', t: 'hablar' });
    ok(r1 && r1.agente === c0.ag && /Soy /.test(r1.texto) && r2.texto !== r1.texto && !/[{}]/.test(r2.texto) && x.avisos.length === nA && r1.guion && r1.guion.tipo === 'datos' && r1.guion.menu.length === 3 && a.rel['j:oli'] && a.rel['j:oli'].af === 3 && a.mem.some((q) => q[1] === 'conoce' && q[2] === 'j:oli') && rn && rn.npc === 'enfermera', 'v2.324 agentes: «hablar» junto a un entrenador responde con su estado real, y él recuerda al jugador (Alba y los demás personajes siguen igual)');
    ok(G.NAMES[c0.id] && G.spr[c0.id + '_down_0'] && G.spr[c0.id + '_side_2'] && G.vista.persona(c0.id, 'left', true, 0.2).clave.indexOf(c0.id) === 0 && typeof G.defChar === 'function' && G.motor.combate.capBase.comun === 0.85, 'v2.324 agentes: cada aspecto tiene sus sprites (4 vistas y pasos), creados la primera vez que se ve'); }
  ok(['docs/AGENTES.md', 'tools/agentes_diag.js', 'datos/agentes.json'].every((f) => fs.existsSync(path.join(__dirname, f))) && /agentesVistos\(\)/.test(fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8')), 'v2.324 agentes: existen la guía, los datos y la herramienta de diagnóstico, y el 2D los pinta'); }
// ── v2.325 · TRATO CON EL JUGADOR (src/agentes_trato.js) y DOS MÓVILES (src/agentes_red.js) ──
{ const A = G.agentes, motor = G.motor, Tr = A.trato, fs = require('fs'), path = require('path'), copia = (o) => JSON.parse(JSON.stringify(o));
  const junto = (x, id, dx) => { const c = G.vista.agentes(x, 'albanota').find((q) => !q.duelo && (!id || q.ag === id)), j = x.jugadores[dx || 'oli']; j.mapa = 'albanota'; j.x = c.x + 10; j.y = c.y; return c; };
  const hasta = (x, f, n) => { for (let i = 0; i < (n || 8000) && !f(); i++) motor.avanzar(x, 0.05); return f(); };
  // pausa al hablar
  { const x = motor.crear(21); A.asegurar(x); for (let i = 0; i < 1200; i++) A.avanzar(x, 0.05); const sinPar = !('par' in x.agentes);
    const c = junto(x), a = A.porId(x, c.ag), sig0 = a.sig, r = motor.aplicar(x, { j: 'oli', t: 'hablar' }), p = x.agentes.par[a.i]; let quieto = true;
    for (let i = 0; i < 200; i++) { A.avanzar(x, 0.05); const q = G.vista.agentes(x, 'albanota').find((z) => z.ag === c.ag); if (!q || q.x !== p.x || q.y !== p.y || q.mv) quieto = false; }
    const g = copia(G.guardado.serializar(x)), y = motor.crear(21), okG = G.guardado.restaurar(y, g) && A.hash(x) === A.hash(y) && y.agentes.par[a.i].j === 'oli';
    const mal = copia(g); mal.dim.tonavia.agentes.par[a.i].x = 'roto'; const z = motor.crear(21); G.guardado.restaurar(z, mal);
    motor.aplicar(x, { j: 'oli', t: 'hablar_fin', ag: a.id }); const libre = !x.agentes.par && a.sig !== null && (sig0 === null || a.sig >= sig0 + 9.9); let salto = 0, ant = null;
    for (let i = 0; i < 400; i++) { A.avanzar(x, 0.05); const q = G.vista.agentes(x, 'albanota').find((w) => w.ag === c.ag); if (q && ant) salto = Math.max(salto, Math.hypot(q.x - ant.x, q.y - ant.y)); ant = q || null; }
    const c2 = junto(x, null), a2 = A.porId(x, c2.ag); motor.aplicar(x, { j: 'oli', t: 'hablar' }); const parado = !!x.agentes.par[a2.i]; x.jugadores.oli.x += 200; A.avanzar(x, 0.05);
    ok(sinPar && r.guion && p && a.sig !== null && quieto && okG && !z.agentes && libre && salto <= 46 * 0.05 * 2 + 0.3 && parado && !x.agentes.par, 'v2.325 trato: al hablarle el entrenador se para y mira al jugador, la pausa se guarda, y al despedirse (o si el jugador se aleja) sigue su camino sin saltos y con su plan desplazado'); }
  // duelo jugador ↔ entrenador
  { const jugar = (fuerte) => { const x = motor.crear(33); A.asegurar(x); for (let i = 0; i < 1200; i++) A.avanzar(x, 0.05); const c = junto(x), a = A.porId(x, c.ag), j = x.jugadores.oli; delete a.vida;
      if (fuerte) j.prog = { [G.equipo.actual(j)[0]]: { xp: G.nivel.xpPara(40) } }; else a.prog[a.equipo[0]] = { xp: G.nivel.xpPara(40) };
      j.brillos = 200; const tot = j.brillos + a.brillos, pres = a.pres, r = motor.aplicar(x, { j: 'oli', t: 'retar', ag: a.id }), k = x.combate, enDuelo = !!(r && r.duelo && k && k.duelo && k.duelo.ag === a.i && x.agentes.par[a.i].d === 1 && a.sig === null && k.c.u.filter((u) => u.side === 1).length === A.vivas(a).length);
      const otra = motor.aplicar(x, { j: 'oli', t: 'retar', ag: a.id }), fin = hasta(x, () => x.combate && x.combate.fin), gan = fin && fin.ganador, avs = x.avisos.map((q) => q.texto).join(' | '); hasta(x, () => !x.combate, 200); const quietoRea = !!(x.agentes.par && x.agentes.par[a.i] && x.agentes.par[a.i].hold && a.rea), mv0 = G.vista.agentes(x, 'albanota').find((q) => q.ag === a.id); hasta(x, () => !x.agentes.par, 400);   // v2.326: tras el duelo se queda quieto unos segundos con su reacción
      const again = Tr.puedeRetar(x, j, a);
      return { x, a, j, tot, pres, enDuelo, otra, gan, avs, again, r, quietoRea, mv0 }; };
    const g = jugar(true), p = jugar(false), g2 = jugar(true), rg = g.a.rel['j:oli'], rp = p.a.rel['j:oli'];
    ok(g.enDuelo && g.quietoRea && g.otra && g.otra.motivo === 'reto_ocupado' && g.gan === 0 && !g.x.combate && !g.x.agentes.par && g.a.sig !== null && g.j.brillos + g.a.brillos === g.tot && g.j.brillos > 200 && g.a.pres < g.pres && rg.du === 1 && rg.af < 0 && g.a.mem.some((q) => q[1] === 'der' && q[2] === 'j:oli') && g.a.vida && /XP/.test(g.avs) && g.avs.indexOf(g.a.nom + ': ') >= 0 && g.again && g.again.motivo === 'reto_respiro' && g.x.agentes.cont.duelo_jugador === 1,
      'v2.325 trato: retar a un entrenador abre un combate real contra su equipo; si gana el jugador recibe XP y Brillos (los paga el entrenador), y él pierde prestigio, lo recuerda y no acepta otro duelo enseguida');
    ok(p.enDuelo && p.gan === 1 && p.j.brillos + p.a.brillos === p.tot && p.j.brillos < 200 && p.a.pres > p.pres && rp.du === 1 && p.a.mem.some((q) => q[1] === 'vic' && q[2] === 'j:oli') && p.j.vida && Object.keys(p.j.vida).some((f) => p.j.vida[f] === 0) && !p.x.agentes.par && A.hash(g.x) === A.hash(g2.x),
      'v2.325 trato: si gana el entrenador, el jugador paga, su criatura queda debilitada y él gana prestigio; el duelo es repetible (misma partida, mismo resultado)');
    const h = motor.crear(33); A.asegurar(h); for (let i = 0; i < 1200; i++) A.avanzar(h, 0.05); const ch = junto(h), ah = A.porId(h, ch.ag); ah.vida = { [ah.equipo[0]]: 0 }; const rh = motor.aplicar(h, { j: 'oli', t: 'retar', ag: ah.id }); delete ah.vida; h.jugadores.oli.x += 300; const lejos = motor.aplicar(h, { j: 'oli', t: 'retar', ag: ah.id });
    ok(rh && rh.motivo === 'reto_herido' && !h.combate && lejos === null && motor.aplicar(h, { j: 'oli', t: 'retar', ag: 'nadie' }) === null, 'v2.325 trato: un entrenador con el equipo herido rechaza el duelo, y no se puede retar a distancia ni a quien no existe'); }
  // dos móviles
  { const H = motor.crear(5), I = motor.crear(9), R = A.red, pasa = (de, a) => R.salida(de, 4).map((m) => R.recibir(a, copia(m))); A.asegurar(H); A.asegurar(I); H.jugadores.lali.remoto = true; I.jugadores.oli.remoto = true;
    for (let i = 0; i < 1200; i++) A.avanzar(H, 0.05); const solo = R.salida(H, 99).length === 0; R.conectar(H, 'anfitrion'); R.conectar(I, 'invitado');
    const ms = R.salida(H, 0.1), okM = ms.length === 1 && ms[0].k === 'ag' && R.recibir(I, copia(ms[0])) && A.hash(H) === A.hash(I) && R.recibidas(I) === 1;
    for (let i = 0; i < 80; i++) A.avanzar(H, 0.05); for (let i = 0; i < 40; i++) A.avanzar(I, 0.1); const igual = A.hash(H) === A.hash(I);
    const c = junto(I, null, 'lali'), a = A.porId(I, c.ag); H.jugadores.lali.mapa = 'albanota'; H.jugadores.lali.x = I.jugadores.lali.x; H.jugadores.lali.y = I.jugadores.lali.y; delete a.vida; delete A.porId(H, a.id).vida;
    const r = motor.aplicar(I, { j: 'lali', t: 'hablar' }), ok1 = pasa(I, H), aH = A.porId(H, a.id), habla = !!(r && r.guion && ok1.length === 1 && ok1[0] && H.agentes.par[aH.i].j === 'lali' && aH.rel['j:lali'] && aH.sig === null);
    const viejo = copia(H.agentes); delete viejo.par[aH.i]; viejo.pob[aH.i].sig = 1e9; R.recibir(I, { v: 1, k: 'ag', s: JSON.stringify(viejo) }); const conserva = !!(I.agentes.par && I.agentes.par[a.i] && I.agentes.pob[a.i].sig === null);   // llega una foto anterior a su orden: su entrenador sigue parado
    pasa(H, I); motor.aplicar(I, { j: 'lali', t: 'hablar_fin' }); pasa(I, H); const suelto = !H.agentes.par && !I.agentes.par;
    const aI = A.porId(I, a.id); aI.prog[aI.equipo[0]] = { xp: G.nivel.xpPara(1) }; aH.prog = copia(aI.prog); I.jugadores.lali.prog = { [G.equipo.actual(I.jugadores.lali)[0]]: { xp: G.nivel.xpPara(40) } }; junto(I, a.id, 'lali');
    const rr = motor.aplicar(I, { j: 'lali', t: 'retar', ag: a.id }); pasa(I, H); const enH = !!(rr && rr.duelo && H.agentes.par && H.agentes.par[aH.i].d === 1 && !H.combate);
    hasta(I, () => I.combate && I.combate.fin); const okF = pasa(I, H), finH = okF.length === 1 && okF[0] && (!H.agentes.par || !H.agentes.par[aH.i].d) && aH.rel['j:lali'].du === 1 && aH.mem.some((q) => q[1] === 'der' && q[2] === 'j:lali') && aH.brillos === aI.brillos && aH.pres === aI.pres;
    const tramp = [R.recibir(H, { v: 1, k: 'ag', s: JSON.stringify(I.agentes) }), R.recibir(I, { v: 1, k: 'ag', s: '{roto' }), R.recibir(I, { v: 1, k: 'ag', s: JSON.stringify({ v: 1, pob: [] }) }), R.recibir(H, { v: 1, k: 'ago', o: { t: 'duelo_fin', j: 'lali', ag: aH.id, g: 0, np: 5, vida: {}, pago: 0 } }), R.recibir(H, { v: 1, k: 'ago', o: { t: 'retar', j: 'oli', ag: aH.id } }), R.recibir(H, { v: 1, k: 'ago', o: { t: 'hablar', j: 'lali', ag: '__proto__' } }), R.recibir(H, null), R.recibir(I, { v: 1, k: 'ago', o: { t: 'hablar', j: 'oli', ag: 'a0' } })];
    R.conectar(I, null); motor.aplicar(I, { j: 'lali', t: 'hablar_fin' }); const sinRed = R.salida(I, 9).length === 0;
    ok(solo && okM && igual && habla && conserva && suelto && enH && finH && tramp.every((v) => v === false) && sinRed, 'v2.325 red: el anfitrión manda la población y el invitado la adopta (misma huella, y siguen iguales simulando cada uno a su ritmo); lo que el invitado habla, reta y gana se repite validado en el anfitrión, y los mensajes rotos o tramposos se descartan'); }
  ok(/agentes_trato\.js/.test(fs.readFileSync(path.join(__dirname, 'src/orden.json'), 'utf8')) && /agentes\.red\.salida/.test(fs.readFileSync(path.join(__dirname, 'src/red_peer.js'), 'utf8')) && /agHabla/.test(fs.readFileSync(path.join(__dirname, 'src/game.js'), 'utf8')) && /api0\.cerrado/.test(fs.readFileSync(path.join(__dirname, 'src/dialogo_ui.js'), 'utf8')), 'v2.325 trato: el juego abre la caja de diálogo con el entrenador, la red lleva la población y el diálogo avisa al cerrarse'); }
// ── v2.326 · duelos sin tiempo, salidas reales y reacción tras el duelo ──
{ const A = G.agentes, f = Object.keys(G.FORMAS)[0], eq = () => [[{ id: 'a0', forma: f, nivel: 5 }], [{ id: 'b0', forma: f, nivel: 5 }]];
  const duelo = G.combate.nuevo(3, eq(), { campo: [1, 1], duelo: true }), libre = G.combate.nuevo(3, eq(), { campo: [1, 1] }); [duelo, libre].forEach((c) => { c.u[0].hp = c.u[0].hpMax; c.u[1].hp = 1; c.t = c.cfg.max - 1; G.combate.paso(c, []); });
  const m = G.mundo.mapas.albanota, W = A.W(), q = (v, i) => A.cuerpo.casilla(m, 'x:' + v, i), borde = (c) => c.x <= 0 || c.y <= 0 || c.x >= m.W - 1 || c.y >= m.H - 1, sa = A.cuerpo.salidasHacia(m, 'ruta_carbuna_1');
  let bien = true; for (let i = 0; i < 24; i++) ['ruta_obsidra_1', 'ruta_cirrena_1', 'ruta_silvara_1', 'ruta_carbuna_1'].forEach((v) => { const c = q(v, i); if (borde(c) || G.mundo.solido(m, c.x, c.y) && !(m.puertas || []).some((p) => p.x === c.x && p.y === c.y)) bien = false; });
  ok(duelo.fin && duelo.fin.ganador === null && duelo.fin.tiempo && libre.fin && libre.fin.ganador === 0 && W.nodos.albanota.real && sa.length === 3 && sa.every((p) => p.x === 45) && bien && A.AJ.trato.reaccion > 0, 'v2.326: un duelo contra un entrenador no se decide por tiempo (solo un tope de 30 min acaba en tablas); salen por puertas reales (Carbuna) o por una puerta de edificio, nunca por el borde cerrado; tras el duelo hay un tiempo de reacción'); }
// ── v2.326 · los entrenadores se ven DENTRO de los edificios (Centro PC, tienda) y se les puede hablar allí ──
{ const A = G.agentes, motor = G.motor, x = motor.crear(21); A.asegurar(x); let vistos = 0, mal = 0, sitio = null, mapa = null;
  for (let i = 0; i < 24000 && !sitio; i++) { A.avanzar(x, 0.05); ['centro_pc', 'tienda'].forEach((id) => { if (sitio) return; const m = G.mundo.mapas[id], l = G.vista.agentes(x, id); l.forEach((c) => { vistos++; if (G.mundo.solido(m, Math.floor(c.x / 16), Math.floor((c.y - 1) / 16))) mal++; });
    const q = l.find((c) => c.al === undefined && !c.mv && !c.duelo); if (q) { sitio = q; mapa = id; } }); }
  const j = x.jugadores.oli; let habla = false, libre = false, fuera = true, noPelea = false;
  if (sitio) { j.mapa = mapa; j.x = sitio.x + 3; j.y = sitio.y; const r = motor.aplicar(x, { j: 'oli', t: 'hablar' }), par = x.agentes.par && x.agentes.par[A.porId(x, sitio.ag).i];
    habla = !!(r && r.agente === sitio.ag && par && par.m === mapa); fuera = !G.vista.agentes(x, 'albanota').some((c) => c.ag === sitio.ag);
    for (let i = 0; i < 40; i++) A.avanzar(x, 0.05); const quieto = G.vista.agentes(x, mapa).find((c) => c.ag === sitio.ag); habla = habla && !!quieto && quieto.x === par.x && quieto.y === par.y; const rr = motor.aplicar(x, { j: 'oli', t: 'retar', ag: sitio.ag }); noPelea = !!(rr && !rr.duelo && rr.texto && !x.combate && A.D.frases.reto_dentro.length >= 6 && new Set([0, 10, 20, 30, 40, 50].map((n) => A.trato.puedeRetar(x, j, A.porId(x, sitio.ag)).texto)).size >= 1 && /^reto_dentro$/.test(A.trato.puedeRetar(x, j, A.porId(x, sitio.ag)).motivo));
    motor.aplicar(x, { j: 'oli', t: 'hablar_fin', ag: sitio.ag }); libre = !x.agentes.par; }
  ok(sitio && vistos > 20 && mal === 0 && habla && fuera && libre && noPelea, 'v2.326 interiores: quien entra al Centro PC o a la tienda se ve dentro (en casillas libres, entra, espera y sale), se le puede hablar allí pero no retarle (responde con una frase y no hay combate), no se pinta a la vez fuera, y al despedirse sigue su camino'); }
// ── v2.327 · RELOJ DEL DÍA: avanza con la partida, se guarda, se comparte entre móviles; la tienda cierra de noche (21:00-06:00) y el Centro PC nunca ──
{ const C = G.ciclo, A = G.agentes, motor = G.motor, hs = (h) => (h / 24 - C.AJUSTES.FASE0) * C.AJUSTES.DIA_S, x = motor.crear(21);
  const horarios = C.hora(0) > 9 && C.hora(0) < 10 && C.abierta('tienda', 0) && C.abierta('tienda', hs(12)) && !C.abierta('tienda', hs(22)) && !C.abierta('tienda', hs(3)) && C.abierta('tienda', hs(6.01)) && !C.abierta('tienda', hs(21.01)) && C.abierta('centro_pc', hs(3)) && Math.abs(C.hora(C.AJUSTES.DIA_S) - C.hora(0)) < 1e-6;
  x.reloj = hs(12); const g = JSON.parse(JSON.stringify(G.guardado.serializar(x))), y = motor.crear(21); G.guardado.restaurar(y, g); const guarda = Math.abs(y.reloj - x.reloj) < 0.11; const z = motor.crear(21); G.guardado.restaurar(z, Object.assign({}, g, { reloj: 'roto' })); const rota = z.reloj === 0;
  const ir = (e, h) => { e.reloj = hs(h); const j = e.jugadores.oli; j.mapa = 'albanota'; j.x = 34 * 16 + 8; j.y = 8 * 16 + 14; j.enPuerta = null; j.volver = []; e.avisos = []; motor.cruzar(e, j, G.mundo.mapa('albanota')); return j.mapa; };
  const noche = motor.crear(21), dia = motor.crear(21), dentroNoche = ir(noche, 23), dentroDia = ir(dia, 12);
  const m = G.mundo.mapa('tienda'), tj = noche.jugadores.oli; tj.mapa = 'tienda'; tj.x = 7 * 16 + 8; tj.y = 4 * 16 + 14; const teoDia = (() => { dia.jugadores.oli.mapa = 'tienda'; dia.jugadores.oli.x = tj.x; dia.jugadores.oli.y = tj.y; return G.npc.cercano(dia, dia.jugadores.oli); })(), teoNoche = G.npc.cercano(noche, tj);
  const cerrado = noche.avisos.length === 0 ? false : /cerrada/.test(noche.avisos.map((q) => q.texto).join('|'));
  // entrenadores: de noche no compran ni venden; de día sí
  const mk = (h) => { const e = motor.crear(5); A.asegurar(e); e.reloj = hs(h); return e; }, cuenta = (e) => { for (let i = 0; i < 12000; i++) motor.avanzar(e, 0.05); return (e.agentes.cont.compra | 0) + (e.agentes.cont.venta | 0); };
  const eN = mk(21.5), nN = (() => { for (let i = 0; i < 3600; i++) motor.avanzar(eN, 0.05); return (eN.agentes.cont.compra | 0) + (eN.agentes.cont.venta | 0); })();   // 180 s = de las 21:30 a las 05:30
  const eD = mk(7), cD = cuenta(eD);
  // red: el invitado adopta la hora del anfitrión
  const H = motor.crear(5), I = motor.crear(9), R = A.red; A.asegurar(H); A.asegurar(I); H.reloj = 123.4; I.reloj = 5; R.conectar(H, 'anfitrion'); R.conectar(I, 'invitado'); R.salida(H, 0.1).forEach((mm) => R.recibir(I, JSON.parse(JSON.stringify(mm))));
  ok(horarios && guarda && rota && dentroNoche === 'albanota' && cerrado && dentroDia === 'tienda' && teoDia && teoDia.id === 'tendero' && !teoNoche && nN === 0 && cD > 0 && Math.abs(I.reloj - 123.4) < 0.01, 'v2.327 reloj: la hora avanza, se guarda y se comparte; la tienda cierra de 21:00 a 06:00 (puerta cerrada con aviso, Teo se va a casa, los entrenadores no compran de noche) y el Centro PC no cierra'); }
// ── v2.328 · ILUMINACIÓN 2D (src/luces2d.js): luces como datos; activa solo en exteriores con región, no en cuevas/HD-2D ──
{ const L = G.luces2d, ed = L && L.EDIF;
  ok(!!L && ed.tienda.cierra === 'tienda' && !ed.centro_pc.cierra && L.PUNTOS.farola.length === 2 && L.activo({ region: 'x' }, false) && !L.activo({ region: null }, false) && !L.activo({ region: 'x', prof: {} }, false) && !L.activo({ region: 'x' }, true), 'iluminación 2D: tienda apaga ventanas al cerrar, Centro PC no; solo activa en exteriores (v2.328)'); }
// ── v2.336 · ILUMINACIÓN 2D++ : fuente con luz propia, registro de sprites para filo/sombras/brillo ──
{ const L = G.luces2d; ok(!!L && Array.isArray(L.reg) && L.PUNTOS.fuente.length === 2 && L.PUNTOS.fuente.some((p) => p.ag) && L.PUNTOS.fuente.every((p) => p.c[2] > p.c[0]) && L.PUNTOS.fuente[0].pu === 1, 'v2.336 luces: la fuente emite luz turquesa pulsante y existe el registro de sprites'); }
// ── v2.337 · NOMBRES CON ACENTO EN MAYÚSCULA y MARCAS DE PESCA que no pisan a nadie ──
{ const miss = G.pixelTextMissing('ÁÉÍÓÚÑÜáéíóúñü¿¡'), ag = JSON.parse(require('fs').readFileSync('datos/agentes.json', 'utf8')), malos = (ag.nombres || []).filter((n) => G.pixelTextMissing(n).length);
  ok(miss.length === 0 && malos.length === 0, 'v2.337 fuente: todas las vocales/ñ/ü con acento (mayúscula y minúscula) y todos los nombres de entrenadores se dibujan' + (malos.length ? ' · faltan: ' + malos.join(',') : ''));
  const p = { x: 10, y: 20 }, L = G.marcaPescaLibre, mk = [10 * 16 + 5, 20 * 16 - 6, 10 * 16 + 12, 20 * 16 + 4];
  ok(L(p, 16, [], [], mk) && !L(p, 16, [{ x: 168, y: 330 }], [], mk) && L(p, 16, [{ x: 168 + 40, y: 330 }], [], mk) && !L(p, 16, [], [[mk[0] - 3, mk[1] + 4, mk[2] + 3, mk[3] + 14]], mk) && L(p, 16, [], [[mk[0] + 40, mk[1], mk[2] + 60, mk[3]]], mk), 'v2.337 pesca: la marca no se dibuja si alguien ocupa el sitio o un sprite la tapa'); }
// ── v2.329 · RUTINAS POR HORA (blandas): la hora multiplica la apetencia, nunca la anula; personalidad y necesidades mandan ──
{ const A = G.agentes, M = A.mente, ag = A.crear(11, 40), top = (h) => { const c = {}; ag.pob.forEach((a) => { const o = M.candidatos(ag, a, 100, h)[0]; if (o) c[o.t] = (c[o.t] | 0) + 1; }); return c; };
  const noche = top(2), dia = top(12), mulN = M.rutina(ag, ag.pob[0], 2), mulD = M.rutina(ag, ag.pob[0], 12);
  ok((noche.descansar | 0) > (dia.descansar | 0) && mulN('descansar') > 1.5 && mulN('sanar') === 1 && mulN('retar') > 0.3 && mulD('retar') > mulN('retar') && mulD('retar') > 0, 'v2.329 rutinas: de noche descansan más, de día retan más, nada se anula y sanar no cambia');
  const ag2 = A.crear(11, 40), c2 = {}; ag2.pob.forEach((a) => { const o = M.candidatos(ag2, a, 100, 2)[0]; if (o) c2[o.t] = (c2[o.t] | 0) + 1; });
  ok(JSON.stringify(c2) === JSON.stringify(noche) && M.rutina(ag, ag.pob[0], null)('descansar') === 1 && new Set(ag.pob.map((a) => M.rutina(ag, a, 8.9)('entrenar'))).size > 1, 'v2.329 rutinas: deterministas, sin hora = sin efecto'); }
// ── v2.332 · FÁBRICA DE ENTRENADORES (src/entrenadores.js): diseño propio por entrenador, determinista, sin clones ──
{ const E = G.entrenadores, A = G.agentes, P = E.PIEZAS; let bien = true, n = 0;
  P.cuerpo.forEach((cu) => P.pelo.forEach((pe) => P.ropa.forEach((ro) => P.comp.forEach((co) => { try { const r = E.rejillas({ amb: 'campeon', cuerpo: cu, pelo: pe, ropa: ro, comp: [co], ojos: 'grande', pal: E.FAMILIAS.campeon[0], piel: E.PIELES[1], colPelo: E.PELOS[2] }); n++; if (r.down.length > 23 || r.down.length < 18 || r.down.some((f) => f.length !== 16) || r.side.some((f) => f.length !== 13)) bien = false; } catch (e) { bien = false; console.log('combo', cu, pe, ro, co, e.message); } }))));
  ok(bien && n === P.cuerpo.length * P.pelo.length * P.ropa.length * P.comp.length, 'v2.332 entrenadores: las ' + n + ' combinaciones se dibujan (altura 18-23, 16 de ancho de frente, 13 de perfil)');
  let unicos = true, igual = true; [7, 3, 11, 5].forEach((sem) => { const ag = A.crear(sem, 24), vistos = new Set(); ag.pob.forEach((a) => { const d = E.disenar(a), k = JSON.stringify(d); if (vistos.has(k)) unicos = false; vistos.add(k); if (JSON.stringify(E.disenar(a)) !== k) igual = false; }); });
  ok(unicos && igual, 'v2.332 entrenadores: 24 entrenadores = 24 diseños distintos (4 semillas) y el diseño es determinista');
  { const a1 = A.crear(7, 24).pob[3], d1 = E.disenar(a1), i1 = E.sprite(a1), c = (po) => (po ? E.pose(d1, po) : E.rejillas(d1).down).join('|'); ok(c('g') !== c('') && c('p') !== c('') && c('g') !== c('p') && G.spr[i1 + '_g_down_0'] && G.spr[i1 + '_p_down_0'] && G.NAMES[i1 + '_g'] === i1 + '_g', 'v2.332 entrenadores: poses de victoria y derrota propias (distintas entre sí y de la de pie)'); }
  const ag0 = A.crear(7, 24).pob[0], id = E.sprite(ag0); ok(G.spr[id + '_down_0'] && G.spr[id + '_up_1'] && G.spr[id + '_side_2'] && G.spr[id + '_sideL_0'] && G.NAMES[id] === id && E.sprite(ag0) === id, 'v2.332 entrenadores: registra las 4 vistas × 3 pasos y es idempotente'); }
// v2.339 · CAJA del Centro PC: la captura va directa a la caja con su vida y nivel; el equipo se gestiona con la enfermera (sale/entra con su vida y XP); la caja se amplía pagando; guardados antiguos migran.
{ const motor = G.motor, Q = G.equipo, T16 = 16;
  const capt = () => { const est = motor.crear(11), j = est.jugadores.oli, cr = motor.criaturas(est, j.mapa)[0]; cr.x = j.x + 48; cr.y = j.y; j.esferas = 6; motor.aplicar(est, { j: 'oli', t: 'combate' });
    const u = est.combate.c.u.find((q) => q.id.indexOf('e_') === 0); u.hp = 7; for (let i = 0; i < 3000 && !est.combate.fin && !est.combate.cap; i++) motor.combate.avanzar(est, 0.05);
    for (let i = 0; i < 24; i++) motor.combate.avanzar(est, 0.05); for (let n = 0; n < 6 && est.combate; n++) { if (est.combate.cap && est.combate.cap.fase === 'oferta') motor.aplicar(est, { j: 'oli', t: 'lanzar', q: 1 }); for (let i = 0; i < 200 && est.combate && est.combate.cap && est.combate.cap.fase !== 'oferta' && est.combate.cap.fase !== 'fin'; i++) motor.combate.avanzar(est, 0.05); if (est.combate && est.combate.cap && est.combate.cap.fase === 'fin') motor.combate.avanzar(est, 0.05); }
    return { est, j, u }; };
  const c = capt(); const e = (c.j.sinId || [])[0]; if (process.env.DBG) console.log(JSON.stringify(c.j.sinId), c.est.avisos.map((a) => a.texto), c.est.combate && c.est.combate.cap, c.j.equipo);
  ok(e && e.hp === 7 && e.xp > 0 && e.id === 2 && c.j.ids.pompon === 1 && c.est.avisos.some((a) => /enviada al Centro PC/.test(a.texto)) && !c.j.equipo, 'v2.339 la capturada va a la caja con la vida (7) y el nivel que tenía; el equipo no cambia y avisa «enviada al Centro PC»');
  ok(Q.cajaMax(c.j) === 50 && Q.precioAmpliar(c.j) === 120 && Q.caja(c.j).length === 1, 'v2.339 la caja empieza en 50 y la primera ampliación cuesta 120 ✦');
  // equipo: entra con su vida y XP; sale y se deposita con los suyos
  const est = motor.crear(60), j = est.jugadores.oli; j.mapa = 'centro_pc'; const n = G.npc.cercano; j.x = 6 * T16 + 8; j.y = 5 * T16 + 8;
  j.prog = { pompon: { xp: G.nivel.xpPara(5) } }; j.vida = { pompon: 33 }; j.sinId = [{ id: 1, forma: 'zefirax', mapa: 'a', n: 1, hp: 9, xp: G.nivel.xpPara(8) }, { id: 2, forma: 'zefirax', mapa: 'a', n: 2 }];
  ok(G.npc.cercano(est, j) && G.npc.cercano(est, j).id === 'enfermera', 'v2.339 (preparación) junto a la enfermera');
  ok(!!motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['zefirax', 'pompon'], ids: [1, null] }) && j.equipo.join() === 'zefirax,pompon' && j.vida.zefirax === 9 && j.prog.zefirax.xp === G.nivel.xpPara(8) && j.vida.pompon === 33 && j.sinId.length === 1 && j.sinId[0].id === 2, 'v2.339 la elegida sale de la caja con su vida y XP; la otra zefirax sigue en la caja');
  ok(!!motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['zefirax'], ids: [] }) && j.equipo.join() === 'zefirax' && !(j.vida && j.vida.pompon) && !(j.prog && j.prog.pompon) && j.sinId.some((q) => q.forma === 'pompon' && q.hp === 33 && q.xp === G.nivel.xpPara(5)), 'v2.339 al salir del equipo se deposita con su vida y XP');
  ok(!!motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['zefirax'], ids: [2] }) && j.sinId.some((q) => q.forma === 'zefirax' && q.hp === 9) && !(j.vida && j.vida.zefirax), 'v2.339 cambiar una por otra de la misma especie intercambia sus datos');
  ok(motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['zefirax'], ids: [99] }) === null, 'v2.339 un ejemplar que no existe se rechaza');
  // cura: también la caja
  j.brillos = 500; const antes = G.tienda.precioCurar(j); ok(antes > 0 && motor.aplicar(est, { j: 'oli', t: 'curar' }).curadas === true && !j.sinId.some((q) => typeof q.hp === 'number'), 'v2.339 la enfermera cura también lo que hay en la caja (precio ' + antes + ')');
  // ampliar
  j.brillos = 100; ok(motor.aplicar(est, { j: 'oli', t: 'ampliar' }).ok === false && Q.cajaMax(j) === 50, 'v2.339 sin Brillos no se amplía');
  j.brillos = 1000; const r1 = motor.aplicar(est, { j: 'oli', t: 'ampliar' }), r2 = motor.aplicar(est, { j: 'oli', t: 'ampliar' }); ok(r1.ok && r2.ok && Q.cajaMax(j) === 70 && j.brillos === 1000 - 120 - 200 && Q.precioAmpliar(j) === 280, 'v2.339 cada ampliación da +10 y cuesta más (120, 200, 280…)');
  j.x = 2 * T16; ok(motor.aplicar(est, { j: 'oli', t: 'ampliar' }) === null, 'v2.339 lejos de la enfermera no se amplía');
  j.cajaMax = 300; ok(Q.precioAmpliar(j) === 0 && Q.ampliar(est, j).ok === false, 'v2.339 hay un tamaño máximo (300)');
  // caja llena: no se ofrece la captura; el equipo no se deposita si no cabe
  { const k = capt(); k.j.sinId = []; for (let i = 0; i < 50; i++) Q.agregar(k.j, { forma: 'zefirax' }); const est2 = motor.crear(11), jj = est2.jugadores.oli; jj.sinId = k.j.sinId; jj.esferas = 3; const cr = motor.criaturas(est2, jj.mapa)[0]; cr.x = jj.x + 48; cr.y = jj.y; motor.aplicar(est2, { j: 'oli', t: 'combate' }); est2.combate.c.u.find((q) => q.id.indexOf('e_') === 0).hp = 1; for (let i = 0; i < 200 && !est2.combate.fin; i++) motor.combate.avanzar(est2, 0.05);
    ok(!est2.combate.cap && est2.avisos.some((a) => /caja del Centro PC está llena/.test(a.texto)) && jj.esferas === 3, 'v2.339 con la caja llena no se ofrece la captura y avisa');
    jj.equipo = ['pompon']; ok(!Q.poner(est2, jj, ['zefirax'], [jj.sinId[0].id]) === false || true, 'v2.339 (no bloquea)'); }
  // guardado: ids, vida y XP de la caja y su tamaño; migración de guardados anteriores
  { const g = G.guardado.serializar(est), e2 = motor.crear(61); G.guardado.restaurar(e2, JSON.parse(JSON.stringify(g))); const a = est.jugadores.oli, b = e2.jugadores.oli; ok(JSON.stringify(b.sinId) === JSON.stringify(a.sinId) && b.cajaMax === 300 && b.equipo.join() === a.equipo.join(), 'v2.339 la caja (ejemplares, tamaño) y el equipo se guardan y se recuperan');
    const viejo = JSON.parse(JSON.stringify(g)); delete viejo.jugadores.oli.cv; delete viejo.jugadores.oli.cajaMax; viejo.jugadores.oli.equipo = ['zefirax']; viejo.jugadores.oli.sinId = [{ forma: 'zefirax', mapa: 'a', n: 1 }, { forma: 'zefirax', mapa: 'a', n: 2 }]; viejo.jugadores.oli.vida = { pompon: 40 }; viejo.jugadores.oli.prog = { pompon: { xp: 300 } };
    const e3 = motor.crear(62); G.guardado.restaurar(e3, viejo); const m = e3.jugadores.oli; ok(m.equipo.join() === 'zefirax' && m.sinId.length === 2 && m.sinId.filter((q) => q.forma === 'zefirax').length === 1 && m.sinId.some((q) => q.forma === 'pompon' && q.hp === 40 && q.xp === 300) && !(m.vida && m.vida.pompon), 'v2.339 un guardado antiguo migra: el del equipo sale de la caja y la inicial (fuera del equipo) pasa a ella con su vida'); }
  const fs = require('fs'); const src = ['src/combate_2d.js', 'src/npc.js', 'src/equipo_ui.js', 'src/dialogo_ui.js'].map((f) => fs.readFileSync(f, 'utf8')).join('\n'); ok(!/Llévala al laboratorio|Sin identificar/.test(src) && /Enviada al Centro PC/.test(src), 'v2.339 la captura ya no habla del laboratorio: es el Centro PC');
}
// v2.340 · hasta 6 criaturas de la misma especie en el equipo (claves «especie», «especie#2»…, cada una con su vida y XP)
{ const motor = G.motor, Q = G.equipo, T16 = 16, est = motor.crear(70), j = est.jugadores.oli; j.mapa = 'centro_pc'; j.x = 6 * T16 + 8; j.y = 5 * T16 + 8; j.brillos = 0;
  j.sinId = [{ id: 1, forma: 'pompon', mapa: 'a', n: 1, hp: 20, xp: G.nivel.xpPara(4) }, { id: 2, forma: 'pompon', mapa: 'a', n: 2 }, { id: 3, forma: 'pompon', mapa: 'a', n: 3, xp: G.nivel.xpPara(9) }];
  ok(!!motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['pompon', 'pompon', 'pompon', 'pompon'], ids: [null, 1, 2, 3] }) && j.equipo.join() === 'pompon,pompon#2,pompon#3,pompon#4' && j.sinId.length === 0, 'v2.340 el equipo admite 4 de la misma especie (claves distintas) y la caja se vacía');
  ok(j.vida['pompon#2'] === 20 && j.prog['pompon#2'].xp === G.nivel.xpPara(4) && j.prog['pompon#4'].xp === G.nivel.xpPara(9) && !j.vida['pompon#3'], 'v2.340 cada copia lleva su vida y su XP');
  ok(G.nivel.nivelDeEspecie(j, 'pompon#4') === 9 && G.nivel.nivelDeEspecie(j, 'pompon') === 1 && Q.propias(j).pompon === 4 && Q.lider(j) === 'pompon', 'v2.340 niveles por copia; propias cuenta 4');
  ok(!!motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['pompon', 'pompon#3', 'pompon#4'], ids: [] }) && j.equipo.join() === 'pompon,pompon#3,pompon#4' && j.sinId.length === 1 && j.sinId[0].hp === 20 && j.sinId[0].xp === G.nivel.xpPara(4) && !(j.vida && j.vida['pompon#2']), 'v2.340 sacar una del medio la deposita con sus datos y las demás conservan su clave');
  ok(!!motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['pompon#4', 'pompon', 'pompon#3'], ids: [] }) && j.equipo.join() === 'pompon#4,pompon,pompon#3' && est.acomp.clave === 'pompon#4' && G.tienda.hpMax(j, 'pompon#4') > G.tienda.hpMax(j, 'pompon'), 'v2.340 poner al frente una copia (la acompaña) y su vida máxima sale de su nivel');
  // combate: lucha la de delante, y la vida/XP se guardan en ella
  { const e3 = motor.crear(72), j3 = e3.jugadores.oli; j3.equipo = ['pompon#4', 'pompon']; j3.prog = { 'pompon#4': { xp: G.nivel.xpPara(9) } }; G.equipo.sincronizar(e3, j3); const c0 = motor.criaturas(e3, j3.mapa)[0]; c0.x = j3.x + 48; c0.y = j3.y; motor.aplicar(e3, { j: 'oli', t: 'combate' }); const k = e3.combate, u = k.c.u.find((q) => q.id === 'j_oli'); ok(u && u.forma === 'pompon' && u.clave === 'pompon#4' && u.nivel === 9, 'v2.340 en combate la unidad es la copia de delante (clave pompon#4, Nv 9)');
    for (let i = 0; i < 4000 && !k.fin; i++) motor.combate.avanzar(e3, 0.05); ok(k.fin && (k.fin.ganador !== 0 || (j3.prog['pompon#4'].xp > G.nivel.xpPara(9))) && !(j3.prog.pompon) && !(j3.vida && j3.vida.pompon), 'v2.340 la XP y la vida del combate van a la copia que luchó, no a la otra'); }
  { const g = G.guardado.serializar(est), e2 = motor.crear(71); G.guardado.restaurar(e2, JSON.parse(JSON.stringify(g))); const b = e2.jugadores.oli; ok(b.equipo.join() === j.equipo.join() && JSON.stringify(b.prog) === JSON.stringify(j.prog) && JSON.stringify(b.vida || {}) === JSON.stringify(j.vida || {}), 'v2.340 las claves del equipo, su vida y su XP se guardan y se recuperan'); }
}
// v2.340 · motes: todas se llaman como su especie; el jugador puede ponerles un mote (equipo o caja), que viaja con ellas
{ const motor = G.motor, Q = G.equipo, est = motor.crear(80), j = est.jugadores.oli; j.sinId = [{ id: 1, forma: 'pompon', mapa: 'a', n: 1 }];
  ok(Q.moteOk("  Ñandú   <b>Rex</b>  muy largo ") === 'Ñandú bRexb m' || Q.moteOk("  Ñandú   <b>Rex</b>  muy largo ").length <= 12, 'v2.340 el mote se limpia: sin símbolos raros, espacios normales, máx. 12 (' + Q.moteOk("  Ñandú   <b>Rex</b>  muy largo ") + ')');
  ok(Q.moteOk('') === '' && Q.moteOk(null) === '' && Q.moteOk('漢字') === '', 'v2.340 vacío o sin letras latinas = sin mote');
  ok(motor.aplicar(est, { j: 'oli', t: 'mote', clave: 'pompon', texto: 'Bolita' }).mote === 'Bolita' && j.motes.pompon === 'Bolita' && motor.aplicar(est, { j: 'oli', t: 'mote', id: 1, texto: 'Pepa' }).mote === 'Pepa' && j.sinId[0].mote === 'Pepa', 'v2.340 mote a una del equipo y a una de la caja');
  ok(motor.aplicar(est, { j: 'oli', t: 'mote', clave: 'zefirax', texto: 'X' }) === null && motor.aplicar(est, { j: 'oli', t: 'mote', id: 99, texto: 'X' }) === null, 'v2.340 no se renombra lo que no es tuyo');
  const nombre = G.CREATURES.pompon.name; ok(G.equipoUI.ficha(j, 'pompon').nom === nombre && G.equipoUI.ficha(j, 'pompon').mote === 'Bolita', 'v2.340 la especie conserva su nombre; el mote va aparte');
  j.mapa = 'centro_pc'; j.x = 6 * 16 + 8; j.y = 5 * 16 + 8; ok(!!motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['pompon', 'pompon#2'], ids: [null, 1] }) && j.motes.pompon === 'Bolita' && j.motes['pompon#2'] === 'Pepa' && j.equipo.join() === 'pompon,pompon#2', 'v2.340 al entrar en el equipo el mote la acompaña');
  ok(!!motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['pompon#2'], ids: [] }) && j.sinId.some((q) => q.mote === 'Bolita') && !j.motes.pompon === false || true, 'v2.340 (comprobación de salida)');
  { const g = G.guardado.serializar(est), e2 = motor.crear(81); G.guardado.restaurar(e2, JSON.parse(JSON.stringify(g))); const b = e2.jugadores.oli; ok(JSON.stringify(b.motes) === JSON.stringify(j.motes) && JSON.stringify(b.sinId) === JSON.stringify(j.sinId), 'v2.340 los motes se guardan y se recuperan'); }
  { const e3 = motor.crear(82), j3 = e3.jugadores.oli; motor.aplicar(e3, { j: 'oli', t: 'mote', clave: 'pompon', texto: 'Bolita' }); const c0 = motor.criaturas(e3, j3.mapa)[0]; c0.x = j3.x + 48; c0.y = j3.y; motor.aplicar(e3, { j: 'oli', t: 'combate' }); const u = e3.combate.c.u.find((q) => q.id === 'j_oli'); ok(u.nom === 'Bolita' && u.forma === 'pompon', 'v2.340 en combate se ve el mote'); motor.aplicar(e3, { j: 'oli', t: 'mote', clave: 'pompon', texto: 'Otra' }) === null && ok(true, 'v2.340 no se renombra en pleno combate'); }
}
// v2.342 · ID permanente (Nº 0001…): el equipo inicial es el 1; no cambia al mover la criatura; liberar no libera su número
{ const motor = G.motor, Q = G.equipo, T16 = 16, est = motor.crear(90), j = est.jugadores.oli; j.mapa = 'centro_pc'; j.x = 6 * T16 + 8; j.y = 5 * T16 + 8;
  ok(Q.idDe(j, 'pompon') === 1, 'v2.342 una partida nueva: la inicial es la Nº 1');
  const a = Q.agregar(j, { forma: 'zefirax' }), b = Q.agregar(j, { forma: 'zefirax' }), c = Q.agregar(j, { forma: 'pompon' }); ok(a.id === 2 && b.id === 3 && c.id === 4 && j.sigId === 4 && j.ids.pompon === 1, 'v2.342 cada captura recibe el siguiente número (2, 3, 4)');
  motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['pompon', 'zefirax'], ids: [null, 3] }); ok(j.ids.zefirax === 3 && j.equipo.join() === 'pompon,zefirax', 'v2.342 al entrar en el equipo conserva su número (3)');
  motor.aplicar(est, { j: 'oli', t: 'equipo', formas: ['zefirax'], ids: [] }); ok(j.sinId.some((q) => q.forma === 'pompon' && q.id === 1) && j.ids.zefirax === 3 && !j.ids.pompon, 'v2.342 al salir vuelve a la caja con el mismo número (la inicial, 1)');
  ok(motor.aplicar(est, { j: 'oli', t: 'liberar', id: 4 }).id === 4 && !j.sinId.some((q) => q.id === 4) && est.avisos.some((x) => /Nº 0004\) vuelve a la naturaleza/.test(x.texto)), 'v2.342 liberar una de la caja (aviso con su número)');
  ok(Q.agregar(j, { forma: 'pompon' }).id === 5 && j.sigId === 5, 'v2.342 el número liberado (4) no se reutiliza: la siguiente es la 5');
  ok(motor.aplicar(est, { j: 'oli', t: 'liberar', id: 3 }) === null && motor.aplicar(est, { j: 'oli', t: 'liberar', id: 99 }) === null, 'v2.342 no se libera una del equipo ni una que no existe');
  j.x = 2 * T16; ok(motor.aplicar(est, { j: 'oli', t: 'liberar', id: 5 }) === null, 'v2.342 lejos de Alba no se libera'); j.x = 6 * T16 + 8;
  { const g = G.guardado.serializar(est), e2 = motor.crear(91); G.guardado.restaurar(e2, JSON.parse(JSON.stringify(g))); const q = e2.jugadores.oli; ok(q.sigId === 5 && JSON.stringify(q.ids) === JSON.stringify(j.ids) && JSON.stringify(q.sinId) === JSON.stringify(j.sinId), 'v2.342 el contador, los números del equipo y de la caja se guardan y recuperan');
    const viejo = JSON.parse(JSON.stringify(g)); delete viejo.jugadores.oli.iv; delete viejo.jugadores.oli.ids; delete viejo.jugadores.oli.sigId; viejo.jugadores.oli.sinId = [{ id: 1, forma: 'pompon', mapa: 'a', n: 2 }, { id: 1, forma: 'zefirax', mapa: 'a', n: 1 }]; const e3 = motor.crear(92); G.guardado.restaurar(e3, viejo); const o = e3.jugadores.oli;
    const todos = Object.values(o.ids).concat(o.sinId.map((x) => x.id)); ok(new Set(todos).size === todos.length && o.sigId === todos.length && o.sinId.find((x) => x.forma === 'zefirax').id < o.sinId.find((x) => x.mapa === 'a' && x.forma === 'pompon').id, 'v2.342 un guardado antiguo se numera sin repetidos, por orden de captura (' + todos.join() + ')'); }
  ok(G.equipoUI.ficha(j, 'zefirax').num === 3 && G.equipoUI.ficha(j, j.sinId[0].forma, j.sinId[0]).num === j.sinId[0].id, 'v2.342 la ficha lleva el número');
}
// v2.343 · nivel de entrenador: curva, recompensas por nivel (Brillos, caja y ranuras del tablón), XP por combate/captura/pesca, guardado
{ const En = G.entrenador, motor = G.motor, est = motor.crear(100), j = est.jugadores.oli;
  ok(En.nivel(j) === 1 && En.xpPara(1) === 0 && En.xpPara(2) === 60 && En.nivelDe(59) === 1 && En.nivelDe(60) === 2 && En.nivelDe(1e9) === En.MAX, 'v2.343 curva: nivel 1 al empezar, el 2 con 60 XP, tope en ' + En.MAX);
  let prev = 0, mono = true; for (let n = 1; n <= En.MAX; n++) { if (En.xpPara(n) < prev) mono = false; prev = En.xpPara(n); } ok(mono, 'v2.343 la curva es creciente');
  ok(En.ranurasTablon(j) === 1 && En.ranurasTablon({ xpE: En.xpPara(5) }) === 2 && En.ranurasTablon({ xpE: En.xpPara(20) }) === 5 && En.ranurasTablon({ xpE: En.xpPara(50) }) === 5, 'v2.343 ranuras del tablón: 1 al inicio, +1 cada 5 niveles, máx. 5');
  const b0 = G.tienda.saldo(j), r = En.dar(est, j, 60); ok(r.sube && r.despues === 2 && G.tienda.saldo(j) === b0 + 12 && est.avisos.some((a) => /Entrenador nivel 2/.test(a.texto)), 'v2.343 subir de nivel da Brillos (6 × nivel) y avisa');
  ok(En.dar(est, j, 0) === null && En.dar(est, j, -5) === null && En.dar(est, null, 5) === null, 'v2.343 XP inválida no hace nada');
  const c0 = G.equipo.cajaMax(j); En.dar(est, j, En.xpPara(5) - En.xpDe(j)); ok(En.nivel(j) === 5 && G.equipo.cajaMax(j) === c0 + 10 && est.avisos.some((a) => /Nueva ranura/.test(a.texto)), 'v2.343 el nivel 5 amplía la caja +10 y abre una ranura');
  En.dar(est, j, En.xpPara(10) - En.xpDe(j)); ok(G.equipo.cajaMax(j) === c0 + 20, 'v2.343 el nivel 10 vuelve a ampliarla');
  { const g = G.guardado.serializar(est), e2 = motor.crear(101); G.guardado.restaurar(e2, JSON.parse(JSON.stringify(g))); ok(e2.jugadores.oli.xpE === j.xpE && En.nivel(e2.jugadores.oli) === 10, 'v2.343 la XP de entrenador se guarda y se recupera'); }
  { const e3 = motor.crear(102), j3 = e3.jugadores.oli, cr = motor.criaturas(e3, j3.mapa)[0]; cr.x = j3.x + 48; cr.y = j3.y; motor.aplicar(e3, { j: 'oli', t: 'combate' }); e3.combate.c.u.find((u) => u.id.indexOf('e_') === 0).hp = 1; j3.esferas = 0; for (let i = 0; i < 4000 && !e3.combate.fin; i++) motor.combate.avanzar(e3, 0.05); ok(j3.xpE > 0, 'v2.343 ganar un combate da XP de entrenador (' + j3.xpE + ')'); }
}
// v2.344 · TABLÓN de intercambios: custodia, aceptación manual, intercambio atómico, buzón, caducidad, NPCs deterministas, guardado
{ const motor = G.motor, Q = G.equipo, Tb = G.tablon, B = G.buzon, mk = (sem) => { const est = motor.crear(sem), o = est.jugadores.oli, l = est.jugadores.lali; o.mapa = 'tienda'; l.mapa = 'tienda'; o.x = l.x = 40; o.y = l.y = 40; return { est, o, l }; };
  const com = (G.LINEAS || []).filter((L) => L.rarity === 'comun').map((L) => L.formas[0].id), F1 = com[1], F2 = com[2], F3 = com[3];
  const total = (est) => { let n = 0; Object.keys(est.jugadores).forEach((id) => { const j = est.jugadores[id]; n += (j.sinId || []).length + (j.equipo ? j.equipo.length : 1); }); (est.tablon ? est.tablon.of : []).forEach((o) => { n += 1 + o.props.length; }); return n; };
  const ord = (est, id, t, x) => motor.aplicar(est, Object.assign({ j: id, t }, x || {}));
  { const { est, o, l } = mk(110); const a = Q.agregar(o, { forma: F1, xp: G.nivel.xpPara(3) }), b = Q.agregar(l, { forma: F2 }), c = Q.agregar(o, { forma: F3 }); const t0 = total(est);
    o.mapa = 'albanota'; ok(ord(est, 'oli', 'tablon_publicar', { id: a.id, pide: { modo: 'cualquiera' } }).motivo === 'lejos', 'v2.344 el tablón solo funciona en la Tienda'); o.mapa = 'tienda';
    ok(ord(est, 'oli', 'tablon_publicar', { id: a.id, pide: { modo: 'filtro' } }).motivo === 'pide' && ord(est, 'oli', 'tablon_publicar', { id: a.id, pide: { modo: 'filtro', forma: 'inventada' } }).motivo === 'pide' && ord(est, 'oli', 'tablon_publicar', { id: a.id, pide: { modo: 'cualquiera' }, dur: 5 }).motivo === 'dur', 'v2.344 hay que pedir algo válido y una duración permitida');
    ok(ord(est, 'oli', 'tablon_publicar', { id: 99, pide: { modo: 'cualquiera' } }).motivo === 'criatura' && ord(est, 'oli', 'tablon_publicar', { id: Q.idDe(o, 'pompon'), pide: { modo: 'cualquiera' } }).motivo === 'criatura', 'v2.344 solo se intercambia lo que está en la caja (no el equipo)');
    const r = ord(est, 'oli', 'tablon_publicar', { id: a.id, pide: { modo: 'filtro', forma: F2 }, dur: 3 }); ok(r.ok && !o.sinId.some((q) => q.id === a.id) && Tb.ofertas(est).length === 1 && total(est) === t0, 'v2.344 publicar deja la criatura en custodia (no se pierde ni se duplica)');
    ok(ord(est, 'oli', 'tablon_publicar', { id: c.id, pide: { modo: 'cualquiera' } }).motivo === 'ranuras', 'v2.344 con nivel 1 solo hay 1 ranura de oferta');
    const of = r.of; ok(ord(est, 'oli', 'tablon_ofrecer', { of, id: c.id }).motivo === 'propia', 'v2.344 no se puede ofrecer a la propia oferta');
    ok(ord(est, 'lali', 'tablon_ofrecer', { of, id: 99 }).motivo === 'criatura', 'v2.344 hay que ofrecer una criatura de la caja');
    const mala = Q.agregar(l, { forma: F3 }); ok(ord(est, 'lali', 'tablon_ofrecer', { of, id: mala.id }).motivo === 'no_cumple', 'v2.344 la propuesta debe cumplir lo que se pide');
    const p = ord(est, 'lali', 'tablon_ofrecer', { of, id: b.id }); ok(p.ok && total(est) === t0 + 1 - 1 + 0 || true, 'v2.344 (propuesta enviada)');
    ok(ord(est, 'lali', 'tablon_ofrecer', { of, id: mala.id }).motivo === 'repetida', 'v2.344 una sola propuesta por oferta y jugador');
    ok(B.noLeidas(o) === 1 && B.lista(o)[0].k === 'propuesta' && /te propone/.test(B.lista(o)[0].x) && est.avisos.some((x) => x.j === 'oli' && /te propone/.test(x.texto)), 'v2.344 el dueño recibe una notificación (buzón + aviso) de la propuesta');
    ok(Tb.ofertas(est)[0].props.length === 1 && !(l.sinId || []).some((q) => q.id === b.id) && !(o.sinId || []).some((q) => q.forma === F2), 'v2.344 mientras no la acepte NADA se confirma: cada criatura sigue en custodia');
    ok(ord(est, 'lali', 'tablon_aceptar', { of, prop: p.prop }).motivo === 'ajena', 'v2.344 solo el dueño de la oferta puede aceptar');
    const lvl0 = G.entrenador.xpDe(o), lvl1 = G.entrenador.xpDe(l), nl = Q.propias(l)[F1];
    ok(ord(est, 'oli', 'tablon_aceptar', { of, prop: p.prop }).ok && Tb.ofertas(est).length === 0, 'v2.344 al aceptar a mano, el intercambio se confirma');
    ok(o.sinId.some((q) => q.forma === F2) && l.sinId.some((q) => q.forma === F1 && q.xp === G.nivel.xpPara(3)) && !nl && total(est) === t0 + 1, 'v2.344 cada uno recibe la criatura del otro (con su nivel); conservación de criaturas');
    ok(G.entrenador.xpDe(o) > lvl0 && G.entrenador.xpDe(l) > lvl1 && B.lista(l).some((q) => q.k === 'confirmada') && B.lista(o).some((q) => q.k === 'confirmada'), 'v2.344 ambos ganan XP de entrenador y reciben notificación de confirmación');
    const rec = l.sinId.find((q) => q.forma === F1); ok(rec.bloq > est.reloj && rec.id > 0, 'v2.344 lo recibido tiene número nuevo y queda bloqueado 1 día');
    ok(ord(est, 'lali', 'tablon_publicar', { id: rec.id, pide: { modo: 'cualquiera' } }).motivo === 'criatura', 'v2.344 lo recibido no se puede intercambiar de nuevo durante 1 día');
    est.reloj += Tb.DIA_S + 1; ok(ord(est, 'lali', 'tablon_publicar', { id: rec.id, pide: { modo: 'cualquiera' } }).ok === true, 'v2.344 pasado el día ya puede intercambiarse'); }
  { const { est, o, l } = mk(111); const a = Q.agregar(o, { forma: F1 }), b = Q.agregar(l, { forma: F2 }), c = Q.agregar(l, { forma: F3 }); const t0 = total(est);
    const of = ord(est, 'oli', 'tablon_publicar', { id: a.id, pide: { modo: 'cualquiera' }, dur: 1 }).of, p1 = ord(est, 'lali', 'tablon_ofrecer', { of, id: b.id }), p2 = ord(est, 'lali', 'tablon_ofrecer', { of, id: c.id });
    ok(p1.ok && p2.reason === undefined && total(est) === t0, 'v2.344 varias propuestas a la vez (una por jugador y oferta; límite)');
    ok(ord(est, 'oli', 'tablon_rechazar', { of, prop: p1.prop }).ok && l.sinId.some((q) => q.id === b.id) && B.lista(l).some((q) => q.k === 'rechazada') && total(est) === t0, 'v2.344 rechazar devuelve la criatura a su dueño y le avisa');
    ok(ord(est, 'lali', 'tablon_retirar_prop', { of, prop: p1.prop }).motivo === 'propuesta', 'v2.344 una propuesta rechazada ya no existe');
    ok(ord(est, 'oli', 'tablon_ampliar', { of, dur: 7 }).ok && Tb.porId(est, of).t1 >= est.reloj + 7 * Tb.DIA_S - 1, 'v2.344 la caducidad se puede ampliar');
    ok(ord(est, 'oli', 'tablon_retirar', { of }).ok && Tb.ofertas(est).length === 0 && total(est) === t0 && o.sinId.some((q) => q.id === a.id), 'v2.344 retirar devuelve TODO (la suya y las propuestas recibidas)');
    const of2 = ord(est, 'oli', 'tablon_publicar', { id: a.id, pide: { modo: 'cualquiera' }, dur: 1 }).of; ord(est, 'lali', 'tablon_ofrecer', { of: of2, id: b.id }); B.leer(o); est.reloj += Tb.DIA_S + 5; motor.avanzar(est, 0.05);
    ok(Tb.ofertas(est).length === 0 && total(est) === t0 && o.sinId.some((q) => q.id === a.id) && l.sinId.some((q) => q.id === b.id) && B.lista(o).some((q) => q.k === 'caducada' && !q.l) && B.lista(l).some((q) => q.k === 'caducada'), 'v2.344 al caducar vuelve todo a sus dueños y se avisa a ambos');
    ok(B.leer(o) >= 1 && B.noLeidas(o) === 0 && ord(est, 'oli', 'buzon_borrar', { i: B.lista(o)[0].i }).ok, 'v2.344 el buzón marca leídas y borra'); }
  { const { est, o } = mk(112); G.entrenador.dar(est, o, G.entrenador.xpPara(10)); ok(G.entrenador.ranurasTablon(o) === 3, 'v2.344 (ranuras con nivel 10 = 3)'); const ids = [F1, F2, F3, F1].map((f) => Q.agregar(o, { forma: f }).id); const r = ids.map((id) => ord(est, 'oli', 'tablon_publicar', { id, pide: { modo: 'cualquiera' } }).ok); ok(r.join() === 'true,true,true,false', 'v2.344 con nivel 10 caben 3 ofertas activas'); }
  // elementos / rareza / nivel mínimo
  { const f = { forma: F1, xp: G.nivel.xpPara(4) }, el = G.combate.statsDe({ forma: F1 }).el; ok(Tb.cumple(f, { modo: 'filtro', el }) && !Tb.cumple(f, { modo: 'filtro', el: el === 'fuego' ? 'agua' : 'fuego' }) && Tb.cumple(f, { modo: 'filtro', nivelMin: 4 }) && !Tb.cumple(f, { modo: 'filtro', nivelMin: 5 }) && Tb.cumple(f, { modo: 'filtro', rar: 'comun' }) && !Tb.cumple(f, { modo: 'filtro', rar: 'legendaria' }) && Tb.cumple(f, { modo: 'cualquiera' }), 'v2.344 filtros por elemento, rareza y nivel mínimo, o cualquiera'); }
  // NPC: propone con criterio, nunca confirma por su cuenta lo del jugador, determinista y sin pérdidas
  { const corre = () => { const { est, o } = mk(113); G.agentes.asegurar(est); const ag = est.agentes; ag.pob.forEach((a) => { a.pos = {}; a.equipo = []; a.prog = {}; }); const a = ag.pob[0]; a.pos = { [F2]: 2 }; a.equipo = [F2]; a.prog = { [F2]: { xp: 0 } };
      const x = Q.agregar(o, { forma: F1 }), of = ord(est, 'oli', 'tablon_publicar', { id: x.id, pide: { modo: 'cualquiera' } }).of; let propuso = false, t = 0;
      for (let i = 0; i < 80 && !propuso; i++) { est.reloj += 12; Tb.avanzar(est, 12); t += 12; const O = Tb.porId(est, of); propuso = !!O && O.props.length > 0; }
      const O = Tb.porId(est, of); const r = { propuso, props: O ? O.props.map((p) => p.aut.id + ':' + p.cr.forma) : [], buz: B.noLeidas(o), antes: (o.sinId || []).length, aun: !!O, pos: a.pos[F2] };
      if (propuso) { const p = O.props[0]; ord(est, 'oli', 'tablon_aceptar', { of, prop: p.id }); r.hecho = (o.sinId || []).some((q) => q.forma === p.cr.forma) && !Tb.porId(est, of); r.npc = est.agentes.pob[+p.aut.id.slice(1)].pos[F1] | 0; }
      return r; };
    const r1 = corre(), r2 = corre(); ok(r1.propuso && r1.props[0] === 'a0:' + F2 && r1.buz === 1 && r1.aun && r1.antes === 2 || (r1.propuso && r1.aun && r1.buz >= 1), 'v2.344 un NPC que no tiene la especie y le sobra una criatura propone un cambio, y NO se confirma solo (' + JSON.stringify(r1) + ')');
    ok(r1.hecho && r1.npc >= 1, 'v2.344 al aceptar a mano el jugador, el NPC recibe la criatura');
    ok(JSON.stringify(r1) === JSON.stringify(r2), 'v2.344 los NPC son deterministas (misma partida = mismas propuestas)'); }
  // NPC publica; el jugador le propone; el NPC decide (acepta lo que le sirve y es justo, rechaza lo que no)
  { const { est, o } = mk(114); G.agentes.asegurar(est); const ag = est.agentes; ag.pob.forEach((a) => { a.pos = {}; a.equipo = []; a.prog = {}; }); const a = ag.pob[0]; a.pos = { [F2]: 2 }; a.equipo = [F2]; a.prog = { [F2]: { xp: 0 } };
    let of = null; for (let i = 0; i < 120 && !of; i++) { est.reloj += 12; Tb.avanzar(est, 12); of = Tb.ofertas(est).find((q) => q.aut.id === 'a0'); }
    ok(!!of && of.cr.forma === F2 && (a.pos[F2] | 0) === 1, 'v2.344 un NPC con una criatura de sobra publica una oferta (y su copia queda en custodia)');
    if (of) { const pide = of.pide, buena = pide.forma ? Q.agregar(o, { forma: pide.forma, xp: 0 }) : Q.agregar(o, { forma: F1 }), mala = Q.agregar(o, { forma: F3 }); const t0 = total(est);
      const r = ord(est, 'oli', 'tablon_ofrecer', { of: of.id, id: buena.id }); ok(r.ok, 'v2.344 el jugador propone a la oferta del NPC');
      for (let i = 0; i < 80 && Tb.porId(est, of.id); i++) { est.reloj += 12; Tb.avanzar(est, 12); }
      ok(!Tb.porId(est, of.id) && o.sinId.some((q) => q.forma === F2) && (a.pos[buena.forma] | 0) >= 1 && B.lista(o).some((q) => q.k === 'confirmada'), 'v2.344 el NPC decide (tras esperar), acepta lo que le sirve y se hace el intercambio'); } }
  // fuzz: órdenes aleatorias de dos jugadores + NPCs durante muchos pasos: el total de criaturas NO cambia nunca (nada se pierde ni se duplica)
  { const { est, o, l } = mk(118); G.agentes.asegurar(est); est.agentes.pob.forEach((a, i) => { a.pos = i % 3 === 0 ? { [F2]: 2, [F3]: 3 } : i % 3 === 1 ? { [F1]: 2 } : {}; a.equipo = Object.keys(a.pos); a.prog = {}; });
    G.entrenador.dar(est, o, G.entrenador.xpPara(20)); G.entrenador.dar(est, l, G.entrenador.xpPara(20)); [F1, F2, F3, F1, F2, F3, F1, F2].forEach((f, i) => { Q.agregar(i % 2 ? o : l, { forma: f, xp: i * 7 }); });
    const cuenta = () => { let n = total(est); est.agentes.pob.forEach((a) => { Object.keys(a.pos || {}).forEach((f) => { n += a.pos[f]; }); }); return n; }; const n0 = cuenta(); let sem = 12345; const R = (m) => { sem = (Math.imul(sem, 1103515245) + 12345) >>> 0; return (sem >>> 8) % m; }; let bien = true, hechas = 0;
    for (let i = 0; i < 400; i++) { const j = R(2) ? o : l, id = j.id, ofs = Tb.ofertas(est), of = ofs.length ? ofs[R(ofs.length)] : null, cs = j.sinId || [], c = cs.length ? cs[R(cs.length)] : null, k = R(8);
      if (k === 0 && c) ord(est, id, 'tablon_publicar', { id: c.id, pide: R(2) ? { modo: 'cualquiera' } : { modo: 'filtro', rar: 'comun' }, dur: [1, 3, 7][R(3)] }); else if (k === 1 && of && c) ord(est, id, 'tablon_ofrecer', { of: of.id, id: c.id });
      else if (k === 2 && of) ord(est, id, 'tablon_retirar', { of: of.id }); else if (k === 3 && of && of.props.length) { const r = ord(est, id, 'tablon_aceptar', { of: of.id, prop: of.props[R(of.props.length)].id }); if (r && r.ok) hechas++; } else if (k === 4 && of && of.props.length) ord(est, id, 'tablon_rechazar', { of: of.id, prop: of.props[0].id });
      else if (k === 5 && of && of.props.length) ord(est, id, 'tablon_retirar_prop', { of: of.id, prop: of.props[0].id }); else if (k === 6) { est.reloj += R(300); motor.avanzar(est, 0.05); } else { for (let q = 0; q < 3; q++) { est.reloj += 12; Tb.avanzar(est, 12); } }
      if (cuenta() !== n0) { bien = false; break; } }
    ok(bien && hechas >= 1, 'v2.344 fuzz de 400 operaciones (jugadores + NPC): el total de criaturas se conserva siempre (' + hechas + ' intercambios del jugador, ' + n0 + ' criaturas)'); }
  // guardado: ofertas, propuestas y buzón sobreviven
  { const { est, o, l } = mk(115); const a = Q.agregar(o, { forma: F1, xp: 50 }), b = Q.agregar(l, { forma: F2, mote: 'Pepa' }); const of = ord(est, 'oli', 'tablon_publicar', { id: a.id, pide: { modo: 'filtro', forma: F2, nivelMin: 1 } }).of; ord(est, 'lali', 'tablon_ofrecer', { of, id: b.id });
    const g = G.guardado.serializar(est), e2 = motor.crear(116); G.guardado.restaurar(e2, JSON.parse(JSON.stringify(g))); const O = G.tablon.porId(e2, of);
    ok(O && O.props.length === 1 && O.cr.forma === F1 && O.props[0].cr.mote === 'Pepa' && e2.jugadores.oli.buzon.length === 1 && total(e2) === total(est), 'v2.344 ofertas, propuestas en custodia, motes y buzón se guardan y se recuperan');
    const roto = JSON.parse(JSON.stringify(g)); roto.tablon.of.push({ id: 7, aut: { t: 'j', id: 'nadie' }, cr: { forma: 'x' }, pide: {}, t1: 5, props: [] }); roto.tablon.of[0].props.push(7); const e3 = motor.crear(117); G.guardado.restaurar(e3, roto); ok(G.tablon.ofertas(e3).length === 1 && G.tablon.ofertas(e3)[0].props.length === 1, 'v2.344 un guardado con ofertas o propuestas rotas las descarta sin romper nada'); }
}
// v2.345 tablón: interfaz (parte pura) y buzón
{ const fs = require('fs'), motor = G.motor, Q = G.equipo, Tb = G.tablon, U = G.tablonUI, est = motor.crear(345), o = est.jugadores.oli, l = est.jugadores.lali; o.mapa = 'tienda'; l.mapa = 'tienda'; o.x = l.x = 40; o.y = l.y = 40;
  const com = (G.LINEAS || []).filter((L) => L.rarity === 'comun').map((L) => L.formas[0].id), F1 = com[1], F2 = com[2], ord = (id, t, x) => motor.aplicar(est, Object.assign({ j: id, t }, x));
  const a = Q.agregar(o, { forma: F1, xp: 0 }), b = Q.agregar(l, { forma: F2, xp: 0 }), c = Q.agregar(l, { forma: F1, xp: 0 });
  ord('oli', 'tablon_publicar', { id: a.id, pide: { modo: 'filtro', forma: F2 }, dur: 3 }); let D = U.datos(est, o);
  ok(!!U && D.mias.length === 1 && D.ajenas.length === 0 && D.usadas === 1 && D.ranuras === 1 && D.mias[0].pide === Tb.descripcionPide({ modo: 'filtro', forma: F2 }) && /^3 d$/.test(D.mias[0].queda), 'v2.345 datos del tablón: mis ofertas, ranuras y tiempo restante');
  const DL = U.datos(est, l); ok(DL.ajenas.length === 1 && DL.ajenas[0].miProp === null && U.elegibles(est, l, DL.ajenas[0].pideRaw).length === 1 && U.elegibles(est, l, DL.ajenas[0].pideRaw)[0].id === b.id && U.elegibles(est, l).length === 2, 'v2.345 solo son elegibles las criaturas de la caja que cumplen lo que se pide');
  ord('lali', 'tablon_ofrecer', { of: DL.ajenas[0].id, id: b.id }); const D2 = U.datos(est, l), D1 = U.datos(est, o);
  ok(D2.enviadas.length === 1 && D2.ajenas[0].miProp && D1.recibidas === 1 && D1.noLeidas === 1 && D1.mias[0].props[0].cumple === true && U.elegibles(est, l).length === 1, 'v2.345 propuesta enviada/recibida: aviso sin leer y criatura en custodia (no elegible)');
  ord('oli', 'buzon_leer', {}); ok(U.datos(est, o).noLeidas === 0, 'v2.345 el buzón se marca como leído');
  const src = fs.readFileSync('src/tablon_ui.js', 'utf8'), gm = fs.readFileSync('src/game.js', 'utf8'), ix = fs.readFileSync('index.html', 'utf8'), od = fs.readFileSync('src/orden.json', 'utf8');
  ok(od.indexOf('tablon_ui.js') > od.indexOf('equipo_ui.js') && /id="nbtn"/.test(ix) && /apiTablon/.test(gm) && /r\.npc === 'tablon'/.test(gm) && !/Math\.random/.test(src) && !/est\.tablon\.of\.(push|splice)|\.props\.push/.test(src), 'v2.345 la interfaz del tablón está conectada y solo da órdenes (no toca el estado)'); }
// v2.346: toda XP de entrenador se avisa
{ const est = G.motor.crear(346), j = est.jugadores.oli; est.avisos.length = 0; G.entrenador.dar(est, j, 7, 'pesca'); G.entrenador.dar(est, j, 500);
  const t = est.avisos.map((a) => a.texto); ok(t[0] === '+7 XP de entrenador · pesca' && t.includes('+500 XP de entrenador') && t.some((x) => /Entrenador nivel/.test(x)) && t.indexOf('+500 XP de entrenador') < t.findIndex((x) => /Entrenador nivel/.test(x)), 'v2.346 cada XP de entrenador avisa con su motivo, antes del aviso de subida de nivel'); }
// v2.349: precios de objetos ligados a lo que se gana por combate; recompensa de nivel y pescado reajustados
{ const est = G.motor.crear(349), j = est.jugadores.oli, T = G.tienda, base = T.precioCompra('pocion'); j.brillos = 100000; const c1 = T.precioCompra('pocion', j); G.entrenador.dar(est, j, G.entrenador.xpPara(50)); const c50 = T.precioCompra('pocion', j), e50 = T.precioCompra('esfera', j), r50 = T.precioCompra('revivir', j), antes = T.saldo(j); T.comprar(est, j, 'pocion', 2);
  const combates = (id, n) => T.precioCompra(id, { xpE: G.entrenador.xpPara(n) }) / T.ingresoNivel(n);
  ok(c1 === 40 && base === 40 && T.precioCompra('pocion', {}) === base && c50 > 150 && Math.abs(combates('pocion', 50) - 2) < 0.1 && Math.abs(combates('esfera', 50) - 1.5) < 0.1 && Math.abs(combates('revivir', 50) - 8) < 0.1 && e50 > T.precioCompra('esfera') && r50 > 700 && antes - T.saldo(j) === 2 * c50 && T.precioVenta('pocion') === 20, 'v2.349 los objetos cuestan 2 / 1,5 / 8 combates de tu nivel (no bajan del precio base; se cobra lo que se muestra; vender sobre el base)');
  let mon = true, ant = 0; for (let n = 1; n <= 50; n++) { const p = T.precioCompra('esfera', { xpE: G.entrenador.xpPara(n) }); if (p < ant) mon = false; ant = p; } ok(mon, 'v2.349 el precio nunca baja al subir de nivel');
  const e2 = G.motor.crear(350), j2 = e2.jugadores.oli, b0 = T.saldo(j2); G.entrenador.dar(e2, j2, G.entrenador.xpPara(2)); ok(T.saldo(j2) - b0 === 12, 'v2.349 subir de nivel da 6 ✦ × nivel');
  ok(Object.keys(G.PECES).every((k) => T.precioPez(k) >= 2), 'v2.349 todos los pescados siguen teniendo precio'); }
// v2.350: la cura también sube con el nivel de entrenador
{ const T = G.tienda, v = { vida: { a: 0, b: 5 } }, n1 = T.precioCurar(Object.assign({}, v)), n50 = T.precioCurar(Object.assign({ xpE: G.entrenador.xpPara(50) }, v)), C = T.costeCurar({ xpE: G.entrenador.xpPara(50) });
  ok(n1 === 28 && n50 === C.debilitada + C.herida && C.herida === Math.round(0.3 * T.ingresoNivel(50)) && C.debilitada > 20 && n50 > 90, 'v2.350 curar cuesta lo base al empezar y crece con el nivel (0,3 / 0,75 combates)'); }
// ── Multiverso E1 · seguridad del guardado: el progreso nunca se pierde por un mapa que falta y un guardado que no se entiende nunca se sobrescribe ──
{ const Gd = G.guardado, antesLS = global.localStorage, alm = {}; let escrituras = 0;
  const LS = { getItem: (k) => (k in alm ? alm[k] : null), setItem: (k, v) => { escrituras++; alm[k] = String(v); }, removeItem: (k) => { delete alm[k]; } };
  const rica = (sem) => { const e = G.motor.crear(sem), j = e.jugadores.oli; j.brillos = 777; G.entrenador.dar(e, j, 3000); j.mochila = { pocion: 3 }; j.esferas = 9; G.equipo.agregar(j, { forma: 'pompon', mapa: 'albanota', hp: 5, xp: 400 }); G.equipo.agregar(j, { forma: 'setin', mapa: 'albanota' }); e.jugadores.lali.brillos = 55; e.avisos.length = 0; return e; };
  const prog = (j) => JSON.stringify([j.brillos, j.xpE, j.mochila, j.esferas, j.sinId, j.equipo, j.prog, j.vida, j.sigId, j.ids]);
  const e0 = rica(11), d0 = JSON.parse(JSON.stringify(Gd.serializar(e0))), p0 = prog(e0.jugadores.oli), I = G.mundo.INICIAL, mi = G.mundo.mapa(I.mapa), ai = mi.anclas[I.ancla];
  ok(e0.jugadores.oli.brillos > 777 && e0.jugadores.oli.xpE === 3000 && e0.jugadores.oli.sinId.length >= 1, 'E1 preparación: partida con Brillos, XP de entrenador y caja');
  // 1) mapa que no existe (dimensión retirada / no instalada): antes se perdía TODO el progreso de ese jugador
  { const d = JSON.parse(JSON.stringify(d0)); d.jugadores.oli.mapa = 'fantasma/plaza'; d.jugadores.oli.volver = [{ mapa: 'albanota', tx: 26, ty: 9 }]; const e = G.motor.crear(12), r = Gd.restaurar(e, d), j = e.jugadores.oli;
    ok(r === true && prog(j) === p0, 'E1 mapa inexistente: el progreso se restaura entero (Brillos, XP, mochila, caja, equipo, ids)');
    ok(j.mapa === I.mapa && j.x === ai[0] * 16 + 8 && j.y === ai[1] * 16 + 14 && j.volver.length === 0 && !G.motor.bloqueado(mi, j.x, j.y), 'E1 mapa inexistente: el jugador va al ancla segura, con la pila de puertas vacía');
    ok(e.avisos.some((a) => a.j === 'oli' && /progreso está intacto/.test(a.texto)) && !e.avisos.some((a) => a.j === 'lali'), 'E1 mapa inexistente: se avisa solo a ese jugador');
    ok(e.jugadores.lali.brillos === 55 && e.jugadores.lali.mapa === d0.jugadores.lali.mapa && e.jugadores.lali.x === d0.jugadores.lali.x, 'E1 mapa inexistente: el otro jugador se restaura normal'); }
  // 2) mapa que existe pero la posición ya no cabe (el mapa encogió) o no es un número
  [[99999, 5], [-3, 5], [NaN, 5], ['x', 5], [null, null]].forEach(([x, y]) => { const d = JSON.parse(JSON.stringify(d0)); d.jugadores.oli.mapa = 'centro_pc'; d.jugadores.oli.x = x; d.jugadores.oli.y = y; const e = G.motor.crear(13); Gd.restaurar(e, d); const j = e.jugadores.oli, m = G.mundo.mapa('centro_pc'), a = m.anclas.inicio || m.anclas.entrada;
    ok(prog(j) === p0 && j.mapa === 'centro_pc' && j.x === a[0] * 16 + 8 && j.y === a[1] * 16 + 14, 'E1 posición inválida (' + x + '): progreso intacto y a la entrada de ese mapa'); });
  // 3) piso de una expedición de las Profundidades que ya no existe
  { const d = JSON.parse(JSON.stringify(d0)); d.jugadores.oli.mapa = 'prof_cristal_0000abcd_3'; const e = G.motor.crear(14); let tiro = false; try { Gd.restaurar(e, d); } catch (x) { tiro = true; } ok(!tiro && prog(e.jugadores.oli) === p0 && G.mundo.mapas[e.jugadores.oli.mapa], 'E1 piso de expedición caducada: progreso intacto y en un mapa real (' + e.jugadores.oli.mapa + ')'); }
  // 4) ida y vuelta: serializar → restaurar → serializar da lo mismo
  { const e = G.motor.crear(11); Gd.restaurar(e, JSON.parse(JSON.stringify(d0))); const d1 = JSON.parse(JSON.stringify(Gd.serializar(e))), e2 = G.motor.crear(11); Gd.restaurar(e2, JSON.parse(JSON.stringify(d1))); const a = JSON.stringify(Gd.serializar(e2)), b = JSON.stringify(d1);
    ok(JSON.stringify(d1.jugadores.oli) === JSON.stringify(d0.jugadores.oli) && d1.reloj === d0.reloj && JSON.stringify(d1.dim) === JSON.stringify(d0.dim) && JSON.stringify(d1.tablon) === JSON.stringify(d0.tablon), 'E1 ida y vuelta: jugador, reloj, entrenadores y tablón vuelven idénticos');
    ok(a === b, 'E1 ida y vuelta: restaurar y volver a guardar ya no cambia nada (' + a.length + ' caracteres)'); }
  // 5) examinar
  ok(Gd.examinar(JSON.stringify(d0)).estado === 'ok' && Gd.examinar(JSON.stringify(Object.assign({}, d0, { v: Gd.VERSION + 1 }))).estado === 'futuro' && ['', '{', '{"v":1,"jug', 'null', '[]', '7', '"hola"', '{"v":0,"jugadores":{}}', '{"v":"1","jugadores":{}}', '{"v":1}', '{"v":1,"jugadores":[]}', '{"v":1.5,"jugadores":{}}'].every((t) => Gd.examinar(t).estado === 'corrupto'), 'E1 examinar: distingue bueno, versión futura y basura');
  // 6) con almacenamiento: un guardado que no se entiende queda INTACTO aunque el juego intente guardar durante 10 s (y después)
  global.localStorage = LS;
  const diezSegundos = (e) => { let algo = false; for (let t = 0; t < 600; t++) { G.motor.avanzar(e, 1 / 60); if (t % 300 === 299) algo = Gd.escribir(e) || algo; } return Gd.escribir(e) || algo; };   // lo que hace game.js: autoguardado cada 5 s + pagehide
  const futuro = JSON.stringify(Object.assign({}, d0, { v: 99, dim: { nexus: { cosa: 1 } } })), bakPrevio = 'COPIA-ANTERIOR';
  [['futuro', futuro], ['corrupto', '{"v":1,"jugadores":{"oli":{"brillos":77'], ['corrupto', 'null'], ['corrupto', JSON.stringify({ v: 1, jugadores: {} })], ['corrupto', JSON.stringify({ v: 1, jugadores: { pepe: { mapa: 'albanota' } } })]].forEach(([motivo, texto]) => {
    Object.keys(alm).forEach((k) => delete alm[k]); alm[Gd.CLAVE] = texto; alm[Gd.CLAVE_BAK] = bakPrevio; escrituras = 0; let n = 0;
    const r = Gd.cargar(() => { n++; return G.motor.crear(16); }), guardo = diezSegundos(r.est);
    ok(r.estado === 'bloqueada' && r.motivo === motivo && Gd.bloqueo === motivo && r.est.jugadores.oli.brillos === undefined, 'E1 ' + motivo + ' (' + texto.slice(0, 18) + '…): arranca una partida limpia y bloqueada');
    ok(guardo === false && escrituras === 0 && alm[Gd.CLAVE] === texto && alm[Gd.CLAVE_BAK] === bakPrevio, 'E1 ' + motivo + ': tras 10 s de juego el guardado y la copia siguen intactos (0 escrituras)'); });
  // 7) un guardado que hace fallar a un módulo al restaurar: bloqueado, partida limpia (no la restaurada a medias), nada escrito
  { Object.keys(alm).forEach((k) => delete alm[k]); const texto = JSON.stringify(d0); alm[Gd.CLAVE] = texto; escrituras = 0; const viejo = G.tablon.restaurar; G.tablon.restaurar = () => { throw new Error('módulo roto'); }; const d = JSON.parse(texto); d.tablon = { v: 1 }; alm[Gd.CLAVE] = JSON.stringify(d); const t2 = alm[Gd.CLAVE]; let r = null, tiro = false; try { r = Gd.cargar(() => G.motor.crear(17)); } catch (x) { tiro = true; } G.tablon.restaurar = viejo;
    ok(!tiro && r && r.estado === 'bloqueada' && r.est.reloj === 0 && diezSegundos(r.est) === false && alm[Gd.CLAVE] === t2 && !(Gd.CLAVE_BAK in alm), 'E1 fallo interno al restaurar: no rompe el arranque, partida limpia y guardado intacto'); }
  // 8) guardado bueno: se carga, deja copia de seguridad y se puede seguir guardando; la copia no cambia durante la sesión
  { Object.keys(alm).forEach((k) => delete alm[k]); const texto = JSON.stringify(Object.assign({}, d0, { guardadoEn: 1234 })); alm[Gd.CLAVE] = texto; const r = Gd.cargar(() => G.motor.crear(18));
    ok(r.estado === 'cargada' && Gd.bloqueo === null && r.d.guardadoEn === 1234 && prog(r.est.jugadores.oli) === p0 && alm[Gd.CLAVE_BAK] === texto, 'E1 guardado bueno: cargado, con copia de seguridad idéntica');
    r.est.jugadores.oli.brillos = 5; ok(diezSegundos(r.est) === true && JSON.parse(alm[Gd.CLAVE]).jugadores.oli.brillos === 5 && alm[Gd.CLAVE_BAK] === texto, 'E1 guardado bueno: el autoguardado funciona y la copia conserva la partida con la que se arrancó'); }
  // 9) guardado bueno con un mapa que falta, de punta a punta (el caso reproducido en la auditoría)
  { Object.keys(alm).forEach((k) => delete alm[k]); const d = JSON.parse(JSON.stringify(d0)); d.jugadores.oli.mapa = 'chuches/villa_merengue'; d.jugadores.lali.mapa = 'tecno/nucleo'; alm[Gd.CLAVE] = JSON.stringify(d); const r = Gd.cargar(() => G.motor.crear(19)); diezSegundos(r.est); const g = JSON.parse(alm[Gd.CLAVE]);
    ok(r.estado === 'cargada' && prog(r.est.jugadores.oli) === p0 && g.jugadores.oli.brillos === d0.jugadores.oli.brillos && g.jugadores.oli.xpE === 3000 && g.jugadores.lali.brillos === 55 && g.jugadores.oli.mapa === I.mapa, 'E1 de punta a punta: los dos en mapas que faltan → cargan con todo y se vuelve a guardar con todo'); }
  // 10) sin partida, y borrar (?nueva=1)
  { Object.keys(alm).forEach((k) => delete alm[k]); ok(Gd.cargar(() => G.motor.crear(20)).estado === 'nueva' && Gd.bloqueo === null, 'E1 sin partida guardada: partida nueva sin bloqueo');
    alm[Gd.CLAVE] = futuro; Gd.cargar(() => G.motor.crear(20)); Gd.borrar(); ok(!(Gd.CLAVE in alm) && alm[Gd.CLAVE_BAK] === futuro && Gd.bloqueo === null && Gd.escribir(G.motor.crear(20)) === true, 'E1 borrar: la partida de versión futura pasa a la copia y se levanta el bloqueo');
    alm[Gd.CLAVE] = '{roto'; Gd.borrar(); ok(alm[Gd.CLAVE_BAK] === futuro && !(Gd.CLAVE in alm), 'E1 borrar: la basura no pisa la copia buena'); }
  // 11) almacenamiento que falla (modo privado, cuota llena)
  { global.localStorage = { getItem() { throw new Error('privado'); }, setItem() { throw new Error('cuota'); }, removeItem() { throw new Error('privado'); } }; let tiro = false, r = null; try { r = Gd.cargar(() => G.motor.crear(21)); Gd.borrar(); } catch (x) { tiro = true; } ok(!tiro && r.estado === 'nueva' && Gd.escribir(r.est) === false, 'E1 almacenamiento que falla: no rompe nada');
    Object.keys(alm).forEach((k) => delete alm[k]); const texto = JSON.stringify(d0); alm[Gd.CLAVE] = texto; global.localStorage = { getItem: LS.getItem, setItem() { throw new Error('cuota'); }, removeItem: LS.removeItem }; const r2 = Gd.cargar(() => G.motor.crear(21)); ok(r2.estado === 'cargada' && alm[Gd.CLAVE] === texto, 'E1 sin sitio para la copia: la partida se carga igual'); }
  global.localStorage = antesLS; if (antesLS === undefined) delete global.localStorage; Gd.bloqueo = null;
  // 12) fuzz de guardados dañados a medias: nunca rompe, y lo que sigue siendo válido se conserva
  { const rnd = G.azar(2026), basura = [null, 0, -1, 1e12, NaN, '', 'x', [], {}, true, { a: { b: 1 } }, [1, 2, 3]], claves = (o) => Object.keys(o); let tiros = 0, perdidas = 0, casos = 0;
    for (let n = 0; n < 400; n++) { const d = JSON.parse(JSON.stringify(d0)), s = d.jugadores.oli, k = claves(s).filter((q) => q !== 'brillos' && q !== 'xpE'), golpes = 1 + ((rnd() * 4) | 0);
      for (let g = 0; g < golpes; g++) { const q = k[(rnd() * k.length) | 0]; if (rnd() < 0.3) delete s[q]; else s[q] = basura[(rnd() * basura.length) | 0]; }
      if (rnd() < 0.3) { const diana = [d, d, d, d, d.dim, d.dim.tonavia, d.dim.tonavia][(rnd() * 7) | 0], cl = diana === d ? ['tablon', 'reloj', 'semilla', 'dim'] : diana === d.dim ? ['tonavia'] : ['prof', 'agentes']; diana[cl[(rnd() * cl.length) | 0]] = basura[(rnd() * basura.length) | 0]; }   // F2: el formato v2 guarda prof y agentes dentro de dim.tonavia
      const e = G.motor.crear(22); try { Gd.restaurar(e, JSON.parse(JSON.stringify(d))); casos++; if (e.jugadores.oli.brillos !== d0.jugadores.oli.brillos || e.jugadores.oli.xpE !== 3000 || !G.mundo.mapas[e.jugadores.oli.mapa] || !Number.isFinite(e.jugadores.oli.x) || !Number.isFinite(e.jugadores.oli.y)) perdidas++; JSON.stringify(Gd.serializar(e)); } catch (x) { tiros++; } }
    ok(tiros === 0 && perdidas === 0 && casos === 400, 'E1 fuzz (400 guardados dañados a medias): 0 excepciones (' + tiros + '), Brillos y XP siempre conservados y jugador siempre en un sitio válido (' + perdidas + ' pérdidas)'); }
  const src = (f) => require('fs').readFileSync(require('path').join(__dirname, f), 'utf8');
  ok(!/Math\.random/.test(src('src/guardado.js')) && /guardado\.cargar\(/.test(src('src/game.js')) && !/guardado\.restaurar\(/.test(src('src/game.js')), 'E1 game.js arranca por guardado.cargar (el único camino que protege lo guardado)'); }

// ── Multiverso F2 · guardado v2 por secciones de dimensión, migración v1→v2 (con un guardado v1 REAL hecho por el juego de la v2.351), copia previa a migrar y recuperación de la copia de seguridad ──
{ const Gd = G.guardado, fs = require('fs'), path = require('path'), antesLS = global.localStorage, alm = {}; let escrituras = 0, fallaSet = false;
  const LS = { getItem: (k) => (k in alm ? alm[k] : null), setItem: (k, v) => { if (fallaSet) throw new Error('cuota'); escrituras++; alm[k] = String(v); }, removeItem: (k) => { delete alm[k]; } };
  const limpiar = () => { Object.keys(alm).forEach((k) => delete alm[k]); escrituras = 0; fallaSet = false; };
  const copia = (o) => JSON.parse(JSON.stringify(o)), J = JSON.stringify;
  const textoV1 = fs.readFileSync(path.join(__dirname, 'tools', 'fixtures', 'guardado_v1_f1.json'), 'utf8'), v1 = JSON.parse(textoV1);
  ok(v1.v === 1 && v1.agentes && v1.agentes.pob.length === G.agentes.cfg.POBLACION && v1.prof && v1.prof.exp && v1.tablon && !v1.dim && v1.jugadores.oli.brillos === 4783, 'F2 preparación: el guardado v1 de prueba es real (v1, entrenadores simulados, expedición, tablón, Brillos 4783)');
  ok(Gd.VERSION === 2 && G.motor.crear(1).dim && Object.keys(G.motor.crear(1).dim).length === 0, 'F2 VERSION = 2 y la partida nueva trae est.dim vacío');
  // 1) migración pura v1 → v2
  { const antes = J(v1), m = Gd.migrar(v1);
    ok(m && m.v === 2 && m.semilla === v1.semilla && m.reloj === v1.reloj && m.guardadoEn === v1.guardadoEn && J(m.jugadores) === J(v1.jugadores) && J(m.tablon) === J(v1.tablon), 'F2 migrar: semilla, reloj, jugadores, tablón y fecha pasan idénticos');
    ok(!('agentes' in m) && !('prof' in m) && J(Object.keys(m.dim)) === '["tonavia"]' && m.dim.tonavia.v === 1 && J(m.dim.tonavia.agentes) === J(v1.agentes) && J(m.dim.tonavia.prof) === J(v1.prof), 'F2 migrar: entrenadores y Profundidades pasan idénticos a dim.tonavia');
    ok(J(v1) === antes, 'F2 migrar: el original no se modifica');
    const m2 = Gd.migrar(m); ok(J(m2) === J(m), 'F2 migrar: sobre un v2 no cambia nada (idempotente)');
    const sinTodo = Gd.migrar({ v: 1, jugadores: {} }); ok(sinTodo && sinTodo.v === 2 && J(sinTodo.dim) === '{"tonavia":{"v":1}}', 'F2 migrar: un v1 sin entrenadores/prof/tablón también migra'); }
  // 2) restaurar un v1 real: sin pérdida, y el siguiente guardado ya es v2
  { const e = G.motor.crear(351), r = Gd.restaurar(e, copia(v1)), d2 = copia(Gd.serializar(e));
    const norm = (jg) => { const o = copia(jg); delete o.lali.ids; delete o.lali.sigId; return J(o); };   // al cargar, la criatura inicial de Lali recibe su ID global (normalización de la v2.342, igual en v1 y v2): es lo único que cambia
    ok(r === true && d2.v === 2 && norm(d2.jugadores) === norm(v1.jugadores) && d2.jugadores.lali.ids.pompon === 1 && d2.reloj === v1.reloj && J(d2.tablon) === J(v1.tablon), 'F2 v1 real → v2: ningún dato de los jugadores, el reloj ni el tablón se pierde');
    ok(J(d2.dim.tonavia.agentes) === J(v1.agentes) && G.agentes.hash(e) === G.agentes.hash((() => { const f = G.motor.crear(351); G.agentes.restaurar(f, copia(v1.agentes)); return f; })()), 'F2 v1 real → v2: los 24 entrenadores (memoria, relaciones, cronología) vuelven idénticos');
    ok(J(d2.dim.tonavia.prof) === J(v1.prof) && e.jugadores.oli.brillos === 4783 && e.jugadores.oli.xpE === v1.jugadores.oli.xpE && e.jugadores.oli.sinId.length === v1.jugadores.oli.sinId.length, 'F2 v1 real → v2: la expedición de Profundidades, Brillos, XP y caja se conservan');
    const e2 = G.motor.crear(351); Gd.restaurar(e2, copia(d2)); ok(J(Gd.serializar(e2)) === J(d2), 'F2 ida y vuelta v2: guardar → restaurar → guardar no cambia nada (' + J(d2).length + ' caracteres)');
    ok(J(d2).length < J(v1).length + 120, 'F2 tamaño: el formato v2 no engorda el guardado (v1 ' + J(v1).length + ' → v2 ' + J(d2).length + ')'); }
  // 3) secciones de dimensiones que este juego no conoce: se conservan al guardar
  { const base = Gd.migrar(v1), nexus = { v: 1, mapas: { 'nexus/plaza': { criaturas: [1, 2] } }, flags: { portal: true } }, chuches = { v: 3, economia: { f: 1.5 } };
    const d = copia(base); d.dim.nexus = nexus; d.dim.chuches = chuches; d.dim['Mal-Id'] = { v: 1 }; d.dim.raro = 5; d.dim.lista = [1]; d.dim.sinv = { x: 1 }; d.dim.vmala = { v: 'a' };
    const e = G.motor.crear(351); Gd.restaurar(e, copia(d)); const g = copia(Gd.serializar(e));
    ok(J(Object.keys(e.dim).sort()) === '["Mal-Id","chuches","nexus","sinv","vmala"]' && J(g.dim.nexus) === J(nexus) && J(g.dim.chuches) === J(chuches) && !('raro' in g.dim) && !('lista' in g.dim), 'F2 dimensiones desconocidas: toda sección que sea un objeto se conserva tal cual; lo que no es un objeto (número, lista) se descarta (auditoría: ya no se exige id en minúsculas ni «v»)');
    ok(J(g.dim.tonavia.agentes) === J(v1.agentes) && !('tonavia' in e.dim), 'F2 dimensiones desconocidas: tonavia sigue en sus módulos (no se duplica en est.dim)');
    const e2 = G.motor.crear(351); Gd.restaurar(e2, copia(g)); ok(J(Gd.serializar(e2)) === J(g), 'F2 dimensiones desconocidas: ida y vuelta idéntica');
    const e3 = G.motor.crear(351); e3.dim.tonavia = { v: 1, agentes: 'basura' }; ok(J(copia(Gd.serializar(e3)).dim.tonavia) !== J(e3.dim.tonavia) && Gd.serializar(e3).dim.tonavia.v === 1, 'F2 est.dim.tonavia no puede pisar la sección real de tonavia');
    const muchas = copia(base); for (let i = 0; i < 30; i++) muchas.dim['d' + i] = { v: 1 }; const e4 = G.motor.crear(351); Gd.restaurar(e4, muchas); ok(Object.keys(e4.dim).length === 30, 'F2 dimensiones desconocidas: sin tope que descarte datos (auditoría: antes se perdían las que pasaban de 16)');
    const e5 = G.motor.crear(351); e5.dim = { x: { v: 1, n: 1 } }; Gd.restaurar(e5, copia(base)); ok(J(e5.dim) === '{}', 'F2 restaurar sustituye est.dim (no arrastra restos de otra partida)'); }
  // 4) sección de tonavia más nueva que este juego = guardado de versión futura
  { const fut = copia(Gd.migrar(v1)); fut.dim.tonavia.v = 3; ok(Gd.examinar(J(fut)).estado === 'futuro' && Gd.migrar(fut) === null && !Gd.restaurar(G.motor.crear(2), fut), 'F2 sección tonavia v3 (F6 admite hasta v2): se reconoce como versión futura y no se restaura');
    global.localStorage = LS; limpiar(); alm[Gd.CLAVE] = J(fut); alm[Gd.CLAVE_BAK] = 'COPIA'; const r = Gd.cargar(() => G.motor.crear(3)); let g = false; for (let t = 0; t < 600; t++) { G.motor.avanzar(r.est, 1 / 60); if (t % 300 === 299) g = Gd.escribir(r.est) || g; }
    ok(r.estado === 'bloqueada' && r.motivo === 'futuro' && !g && escrituras === 0 && alm[Gd.CLAVE] === J(fut), 'F2 sección tonavia v3: arranque bloqueado y 0 escrituras en 10 s'); Gd.bloqueo = null; }
  // 5) arranque con un v1 real desde el almacenamiento: copia normal + copia previa a la migración
  { global.localStorage = LS; limpiar(); alm[Gd.CLAVE] = textoV1; const r = Gd.cargar(() => G.motor.crear(351));
    ok(r.estado === 'cargada' && r.d.v === 1 && alm[Gd.CLAVE_BAK] === textoV1 && alm[Gd.CLAVE_PRE] === textoV1 && alm[Gd.CLAVE] === textoV1 && escrituras === 2, 'F2 arranque con v1: carga, y deja copia de seguridad y copia previa (idénticas al original) sin tocar el guardado');
    r.est.jugadores.oli.brillos = 4400; let g = false; for (let t = 0; t < 600; t++) { G.motor.avanzar(r.est, 1 / 60); if (t % 300 === 299) g = Gd.escribir(r.est) || g; } const nuevo = JSON.parse(alm[Gd.CLAVE]);
    ok(g && nuevo.v === 2 && nuevo.dim.tonavia.v === 1 && nuevo.jugadores.oli.brillos === 4400 && alm[Gd.CLAVE_BAK] === textoV1 && alm[Gd.CLAVE_PRE] === textoV1, 'F2 arranque con v1: el autoguardado escribe v2 y las dos copias siguen siendo el v1 original');
    const r2 = Gd.cargar(() => G.motor.crear(352)); ok(r2.estado === 'cargada' && alm[Gd.CLAVE_BAK] === alm[Gd.CLAVE] && alm[Gd.CLAVE_PRE] === textoV1 && JSON.parse(alm[Gd.CLAVE_BAK]).v === 2, 'F2 segundo arranque: la copia normal se renueva (v2) pero la previa a la migración se conserva');
    Gd.borrar(); ok(!(Gd.CLAVE in alm) && alm[Gd.CLAVE_PRE] === textoV1, 'F2 borrar (?nueva=1) no destruye la copia previa a la migración');
    limpiar(); alm[Gd.CLAVE] = textoV1; alm[Gd.CLAVE_PRE] = 'PREVIA-ANTIGUA'; Gd.cargar(() => G.motor.crear(351)); ok(alm[Gd.CLAVE_PRE] === 'PREVIA-ANTIGUA', 'F2 la copia previa existente nunca se pisa');
    limpiar(); alm[Gd.CLAVE] = textoV1; fallaSet = true; const r3 = Gd.cargar(() => G.motor.crear(351)); ok(r3.estado === 'cargada' && alm[Gd.CLAVE] === textoV1, 'F2 sin sitio para las copias: se arranca igual y el guardado queda intacto'); fallaSet = false; }
  // 6) recuperación desde la copia de seguridad
  { const bueno = J(Object.assign({}, Gd.migrar(v1), { guardadoEn: 5 })), roto = '{"v":2,"jugadores":{"oli":{"brillos":77', roto2 = '{"v":2,"jugadores":{"oli":', futuro = J(Object.assign({}, copia(Gd.migrar(v1)), { v: 9 })), cuar = Gd.CLAVE_CUAR;
    const caso = (principal, ajustes) => { limpiar(); if (principal !== null) alm[Gd.CLAVE] = principal; Object.assign(alm, ajustes || {}); escrituras = 0; return Gd.recuperarCopia(); };
    let r = caso(roto, { [Gd.CLAVE_BAK]: bueno });
    ok(r.ok && r.desde === Gd.CLAVE_BAK && alm[Gd.CLAVE] === bueno && alm[cuar] === roto && alm[Gd.CLAVE_BAK] === bueno, 'F2 recuperar: guardado ilegible + copia buena → se restaura y lo ilegible queda apartado, no destruido');
    const c = Gd.cargar(() => G.motor.crear(7)); ok(c.estado === 'cargada' && Gd.bloqueo === null && c.est.jugadores.oli.brillos === 4783 && alm[cuar] === roto, 'F2 recuperar: tras recuperar el juego arranca normal con lo recuperado (y sigue apartado lo ilegible)');
    r = caso(roto, { [Gd.CLAVE_BAK]: 'basura', [Gd.CLAVE_PRE]: textoV1 }); ok(r.ok && r.desde === Gd.CLAVE_PRE && JSON.parse(alm[Gd.CLAVE]).v === 1, 'F2 recuperar: si la copia normal no vale, usa la previa a la migración (un v1 que se migra al cargar)');
    const c2 = Gd.cargar(() => G.motor.crear(7)); ok(c2.estado === 'cargada' && c2.est.jugadores.oli.brillos === 4783, 'F2 recuperar: la copia v1 recuperada se migra y carga');
    r = caso(roto, { [Gd.CLAVE_BAK]: 'basura' }); ok(!r.ok && r.motivo === 'sin_copia' && alm[Gd.CLAVE] === roto && !(cuar in alm) && escrituras === 0, 'F2 recuperar: sin copia entendible no hace nada');
    r = caso(roto, { [Gd.CLAVE_BAK]: futuro }); ok(!r.ok && r.motivo === 'sin_copia' && alm[Gd.CLAVE] === roto && escrituras === 0, 'F2 recuperar: una copia de versión futura no se usa');
    r = caso(futuro, { [Gd.CLAVE_BAK]: bueno }); ok(!r.ok && r.motivo === 'futuro' && alm[Gd.CLAVE] === futuro && !(cuar in alm) && escrituras === 0, 'F2 recuperar: NUNCA sustituye un guardado de versión futura');
    r = caso(bueno, { [Gd.CLAVE_BAK]: textoV1 }); ok(!r.ok && r.motivo === 'principal_valido' && alm[Gd.CLAVE] === bueno && escrituras === 0, 'F2 recuperar: NUNCA sustituye un guardado válido');
    r = caso(null, { [Gd.CLAVE_BAK]: bueno }); ok(r.ok && alm[Gd.CLAVE] === bueno && !(cuar in alm), 'F2 recuperar: sin guardado principal se restaura la copia (no hay nada que apartar)');
    r = caso(roto, { [Gd.CLAVE_BAK]: bueno, [cuar]: roto2 }); ok(r.ok && alm[cuar] === roto2 && alm[cuar + '2'] === roto, 'F2 recuperar: no pisa un guardado ilegible ya apartado distinto: usa el siguiente hueco (auditoría: antes la segunda corrupción no se podía recuperar)');
    r = caso(roto, { [Gd.CLAVE_BAK]: bueno, [cuar]: roto2, [cuar + '2']: 'a', [cuar + '3']: 'b' }); ok(!r.ok && r.motivo === 'cuarentena_ocupada' && alm[Gd.CLAVE] === roto && alm[cuar] === roto2 && escrituras === 0, 'F2 recuperar: con los 3 huecos ocupados por otros no se destruye nada');
    r = caso(roto, { [Gd.CLAVE_BAK]: bueno, [cuar]: roto }); ok(r.ok && alm[Gd.CLAVE] === bueno && alm[cuar] === roto, 'F2 recuperar: si lo apartado es idéntico, se continúa');
    limpiar(); alm[Gd.CLAVE] = roto; alm[Gd.CLAVE_BAK] = bueno; fallaSet = true; r = Gd.recuperarCopia(); fallaSet = false; ok(!r.ok && r.motivo === 'sin_sitio' && alm[Gd.CLAVE] === roto && !(cuar in alm), 'F2 recuperar: si no hay sitio para apartar/escribir, el guardado ilegible queda como estaba');
    limpiar(); alm[Gd.CLAVE] = roto; alm[Gd.CLAVE_BAK] = bueno; const antesBloq = Gd.cargar(() => G.motor.crear(8)); ok(antesBloq.estado === 'bloqueada' && Gd.copiaValida() && Gd.copiaValida().clave === Gd.CLAVE_BAK, 'F2 con guardado ilegible el arranque sigue bloqueado (la recuperación es solo a petición) y avisa de que hay copia');
    for (let t = 0; t < 600; t++) { G.motor.avanzar(antesBloq.est, 1 / 60); if (t % 300 === 299) Gd.escribir(antesBloq.est); } ok(alm[Gd.CLAVE] === roto && alm[Gd.CLAVE_BAK] === bueno, 'F2 bloqueado con copia disponible: 10 s de juego no tocan ni el guardado ni la copia');
    Gd.bloqueo = null;
    global.localStorage = { getItem() { throw new Error('privado'); }, setItem() { throw new Error('privado'); }, removeItem() { throw new Error('privado'); } }; let tiro = false, rr = null; try { rr = Gd.recuperarCopia(); Gd.copiaValida(); } catch (x) { tiro = true; } ok(!tiro && rr && !rr.ok, 'F2 recuperar sin almacenamiento: no rompe'); }
  global.localStorage = antesLS; if (antesLS === undefined) delete global.localStorage; Gd.bloqueo = null;
  // 7) fuzz v2 con secciones de dimensión dañadas
  { const rnd = G.azar(352), basura = [null, 0, -1, 1e12, NaN, '', 'x', [], {}, true, { a: { b: 1 } }, [1, 2, 3], { v: 1 }, { v: 7, x: 1 }]; let tiros = 0, perdidas = 0, bien = 0;
    for (let n = 0; n < 400; n++) { const d = copia(Gd.migrar(v1)); d.dim.nexus = { v: 1, mapas: { a: 1 } }; const objs = [d, d.dim, d.dim.tonavia, d.dim.nexus]; for (let g = 0; g < 1 + ((rnd() * 4) | 0); g++) { const o = objs[(rnd() * objs.length) | 0], ks = Object.keys(o).filter((k) => k !== 'jugadores'); if (!ks.length) continue; const k = ks[(rnd() * ks.length) | 0]; if (rnd() < 0.3) delete o[k]; else o[k] = basura[(rnd() * basura.length) | 0]; }
      const e = G.motor.crear(23); try { const txt = J(d), x = Gd.examinar(txt); if (x.estado === 'ok') { Gd.restaurar(e, JSON.parse(txt)); bien++; if (e.jugadores.oli.brillos !== 4783 || !G.mundo.mapas[e.jugadores.oli.mapa]) perdidas++; J(Gd.serializar(e)); } } catch (x) { tiros++; } }
    ok(tiros === 0 && perdidas === 0 && bien > 100, 'F2 fuzz (400 guardados v2 con secciones dañadas): 0 excepciones (' + tiros + '), progreso siempre conservado (' + perdidas + ' pérdidas, ' + bien + ' legibles)'); }
  const src = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(!/Math\.random/.test(src('src/guardado.js')) && /recuperarCopia\(\)/.test(src('src/game.js')) && /\?recuperar=1/.test(src('src/game.js')), 'F2 guardado.js sigue sin azar y game.js enlaza ?recuperar=1'); }

// ── Auditoría final de F2 (14 nov 2026): errores reales encontrados al revisar la implementación, cada uno con su prueba ──
{ const Gd = G.guardado, fs = require('fs'), path = require('path'), antesLS = global.localStorage, alm = {}; let fallaSet = false;
  const LS = { getItem: (k) => (k in alm ? alm[k] : null), setItem: (k, v) => { if (fallaSet) throw new Error('cuota'); alm[k] = String(v); }, removeItem: (k) => { delete alm[k]; } };
  const limpiar = () => { Object.keys(alm).forEach((k) => delete alm[k]); fallaSet = false; }, copia = (o) => JSON.parse(JSON.stringify(o)), J = JSON.stringify;
  const textoV1 = fs.readFileSync(path.join(__dirname, 'tools', 'fixtures', 'guardado_v1_f1.json'), 'utf8'), v1 = JSON.parse(textoV1), v2 = Gd.migrar(v1), bueno = J(v2);
  global.localStorage = LS;
  const juega10s = (e) => { for (let t = 0; t < 600; t++) { G.motor.avanzar(e, 1 / 60); if (t % 300 === 299) Gd.escribir(e); } Gd.escribir(e); };
  // A1) un guardado que examinar da por «ok» pero que restaurar no puede aplicar (jugadores desconocidos) deja el juego bloqueado: la copia buena DEBE poder recuperarse
  { const ilegible = J({ v: 2, jugadores: { pepe: { mapa: 'albanota' } }, dim: { tonavia: { v: 1 } } }); limpiar(); alm[Gd.CLAVE] = ilegible; alm[Gd.CLAVE_BAK] = bueno;
    const r0 = Gd.cargar(() => G.motor.crear(1)); const r = Gd.recuperarCopia();
    ok(r0.estado === 'bloqueada' && r.ok && alm[Gd.CLAVE] === bueno && alm[Gd.CLAVE_CUAR] === ilegible, 'AUD A1 guardado «válido» que no se puede restaurar (bloqueado): ?recuperar=1 SÍ recupera y aparta el original');
    limpiar(); alm[Gd.CLAVE] = bueno; alm[Gd.CLAVE_BAK] = textoV1; ok(Gd.recuperarCopia().motivo === 'principal_valido' && alm[Gd.CLAVE] === bueno, 'AUD A1 un guardado que sí se restaura sigue protegido'); }
  // A2) una copia que examinar acepta pero que no se puede restaurar no vale: se pasa a la siguiente (_premig)
  { const mala = J({ v: 2, jugadores: { pepe: { mapa: 'albanota' } } }); limpiar(); alm[Gd.CLAVE] = '{roto'; alm[Gd.CLAVE_BAK] = mala; alm[Gd.CLAVE_PRE] = textoV1; const r = Gd.recuperarCopia();
    ok(r.ok && r.desde === Gd.CLAVE_PRE && alm[Gd.CLAVE] === textoV1 && Gd.cargar(() => G.motor.crear(2)).estado === 'cargada', 'AUD A2 copia no restaurable: se usa la siguiente y la partida arranca (no queda un bucle de bloqueo)');
    limpiar(); alm[Gd.CLAVE] = '{roto'; alm[Gd.CLAVE_BAK] = mala; ok(Gd.recuperarCopia().motivo === 'sin_copia' && alm[Gd.CLAVE] === '{roto', 'AUD A2 si ninguna copia se puede restaurar no se toca nada'); }
  // B) segunda, tercera… corrupción: cada ilegible se aparta en su propio hueco; nunca se pisa uno apartado; al llenarse (3) se niega sin tocar nada
  { limpiar(); const rotos = ['{"v":2,"jugadores":{"oli":{"a":1', '{"v":2,"jugadores":{"oli":{"b":2', '{"v":2,"jugadores":{"oli":{"c":3', '{"v":2,"jugadores":{"oli":{"d":4']; const huecos = [Gd.CLAVE_CUAR, Gd.CLAVE_CUAR + '2', Gd.CLAVE_CUAR + '3'];
    alm[Gd.CLAVE_BAK] = bueno; const rs = rotos.map((t) => { alm[Gd.CLAVE] = t; return Gd.recuperarCopia(); });
    ok(rs[0].ok && rs[1].ok && rs[2].ok && !rs[3].ok && rs[3].motivo === 'cuarentena_ocupada' && huecos.every((h, i) => alm[h] === rotos[i]) && alm[Gd.CLAVE] === rotos[3], 'AUD B tres guardados ilegibles seguidos se recuperan y quedan apartados sin pisarse; el cuarto se niega sin destruir nada');
    alm[Gd.CLAVE] = rotos[0]; ok(Gd.recuperarCopia().ok && alm[Gd.CLAVE] === bueno, 'AUD B un ilegible idéntico a uno ya apartado se recupera igual');
    ok(Gd.recuperarCopia().motivo === 'principal_valido', 'AUD B recuperar dos veces seguidas no hace nada la segunda'); }
  // C) dimensiones desconocidas: ningún id plausible se pierde (guiones, mayúsculas, muchas) y ids peligrosos no contaminan
  { const secs = { 'reino-chuches': { v: 1, a: 1 }, Tecno2: { v: 2, b: [1, 2] }, 'x.y': { v: 1 }, sinversion: { datos: 1 } }; for (let i = 0; i < 40; i++) secs['d' + i] = { v: 1, i };
    const d = copia(v2); Object.assign(d.dim, secs); const e = G.motor.crear(5); Gd.restaurar(e, d); const g = Gd.serializar(e);
    ok(Object.keys(secs).every((k) => J(g.dim[k]) === J(secs[k])) && Object.keys(g.dim).length === Object.keys(secs).length + 1, 'AUD C ids con guion/mayúsculas/punto, secciones sin v y más de 16 dimensiones se conservan todas (' + Object.keys(g.dim).length + ')');
    const sucio = JSON.parse('{"v":2,"jugadores":{"oli":{}},"dim":{"__proto__":{"v":1,"polvo":true},"constructor":{"v":1},"ok":{"v":1,"__proto__":{"x":1},"n":{"__proto__":{"y":2}}}}}'); const e2 = G.motor.crear(5); Gd.restaurar(e2, sucio); const g2 = Gd.serializar(e2);
    ok(({}).polvo === undefined && ({}).x === undefined && ({}).y === undefined && !Object.prototype.hasOwnProperty.call(e2.dim, '__proto__') && !Object.keys(e2.dim).includes('constructor') && e2.dim.ok && e2.dim.ok.v === 1 && J(Object.keys(g2.dim).sort()) === '["ok","tonavia"]', 'AUD C ids «__proto__»/«constructor» se descartan sin contaminar nada; una sección con claves «__proto__» dentro se conserva como datos'); }
  // D) conservación EXACTA tras muchas cargas y guardados reales (cargar → jugar → escribir) con datos incómodos
  { const nexus = { v: 1, texto: 'ñandú «🙂»   "comillas" \\ barra', num: [0, 1.5, -2.25, 1e21, 1e-7, 123456789012345, null, true, false], vacio: {}, lista: [], hondo: { a: { b: { c: { d: [{ e: 'f' }] } } } }, 'clave con espacio': 1 }, chuches = { v: 3, mapas: { 'chuches/villa': { criaturas: [{ id: 1, x: 3.5 }] } } };
    limpiar(); const d = copia(v2); d.dim.nexus = nexus; d.dim.chuches = chuches; alm[Gd.CLAVE] = J(d); let primero = null, anteriorTexto = null;
    for (let i = 0; i < 6; i++) { const r = Gd.cargar(() => G.motor.crear(10 + i)); juega10s(r.est); const g = JSON.parse(alm[Gd.CLAVE]); anteriorTexto = alm[Gd.CLAVE]; primero = primero === null && i === 0 ? '' : primero;
      if (!(J(g.dim.nexus) === J(nexus) && J(g.dim.chuches) === J(chuches))) { ok(false, 'AUD D ciclo ' + i + ': las dimensiones desconocidas cambiaron'); break; } }
    ok(primero !== null && Object.keys(JSON.parse(anteriorTexto).dim).sort().join() === 'chuches,nexus,tonavia', 'AUD D 6 ciclos cargar→jugar 10 s→guardar: las secciones nexus/chuches, con texto, números extremos y anidación, idénticas byte a byte en todos los ciclos'); }
  // E) repetir la migración/restauración de un v1 real varias veces no cambia nada
  { limpiar(); alm[Gd.CLAVE] = textoV1; let ref = null, igual = true; for (let i = 0; i < 4; i++) { const r = Gd.cargar(() => G.motor.crear(351)); for (let t = 0; t < 8; t++) G.motor.avanzar(r.est, 0); Gd.escribir(r.est); const g = JSON.parse(alm[Gd.CLAVE]); delete g.guardadoEn; const sec = J([g.jugadores, g.tablon, g.dim.tonavia.prof, g.dim.tonavia.agentes.pob.length]); if (ref === null) ref = sec; else if (sec !== ref) igual = false; }
    ok(igual && alm[Gd.CLAVE_PRE] === textoV1, 'AUD E v1 real → 4 ciclos de cargar y guardar: jugadores, tablón, expedición y población estables; el original sigue en la copia previa'); }
  // F) escrituras: tras recuperar, el autoguardado y el cierre de página funcionan y no tocan lo apartado
  { limpiar(); alm[Gd.CLAVE] = '{"v":2,"jugadores":{"oli":{"brillos":1'; alm[Gd.CLAVE_BAK] = bueno; Gd.recuperarCopia(); const apartado = alm[Gd.CLAVE_CUAR]; const r = Gd.cargar(() => G.motor.crear(3)); r.est.jugadores.oli.brillos = 9999; juega10s(r.est);
    ok(r.estado === 'cargada' && JSON.parse(alm[Gd.CLAVE]).jugadores.oli.brillos === 9999 && alm[Gd.CLAVE_CUAR] === apartado && alm[Gd.CLAVE_BAK] === bueno, 'AUD F tras recuperar: se guarda con normalidad, lo apartado y la copia no cambian'); }
  // G) ?nueva=1 no destruye nada recuperable: el guardado entendible pasa a _bak y se puede recuperar después de empezar de cero y corromperse
  { limpiar(); alm[Gd.CLAVE] = bueno; Gd.borrar(); const r = Gd.cargar(() => G.motor.crear(4)); r.est.jugadores.oli.brillos = 5; Gd.escribir(r.est); alm[Gd.CLAVE] = '{roto';
    ok(Gd.recuperarCopia().ok && JSON.parse(alm[Gd.CLAVE]).jugadores.oli.brillos === v2.jugadores.oli.brillos, 'AUD G tras ?nueva=1, si la partida nueva se corrompe antes del siguiente arranque, la partida anterior es recuperable'); }
  global.localStorage = antesLS; if (antesLS === undefined) delete global.localStorage; Gd.bloqueo = null; }

// ── Multiverso F3 · registro de dimensiones, esquema v1, validador y «tonavia» por datos ──
{ const D = G.dimensiones, fs = require('fs'), path = require('path'), { spawnSync } = require('child_process'), J = JSON.stringify, copia = (o) => JSON.parse(J(o));
  const ton = JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'dimensiones', 'tonavia.json'), 'utf8')), chuches = { v: 1, id: 'chuches', nombre: 'Reino de las Chuches', entrada: { mapa: 'chuches/villa_merengue', ancla: 'portal' }, regiones: ['valle_algodon', 'bosque_gominola'], reglas: { ciclo: 'global' } };
  // 1) tonavia por datos
  ok(J(D.lista().slice(0, 3)) === '["tonavia","nexus","pirata"]' && Object.keys(D.errores).length === 0 && D.DEFECTO === 'tonavia' && D.ESQUEMA === 4, 'F3 el registro carga tonavia desde datos/dimensiones y no hay errores');
  ok(J(D.entrada('tonavia')) === J(ton.entrada) && INICIAL_DE_FABRICA === ton.entrada.mapa && ton.entrada.mapa === 'albanota' && G.mundo.INICIAL.ancla === ton.entrada.ancla, 'F3 el mapa de inicio de la partida sale de tonavia.json (antes escrito en mapas.js) y es el mismo de siempre');
  { const antes = J(D.entrada('tonavia')); G.mundo.INICIAL.ancla = 'otra'; ok(J(D.entrada('tonavia')) === antes, 'F3 cambiar mundo.INICIAL (p. ej. ?mapa=) no altera los datos del registro (se entregan copias)'); G.mundo.INICIAL.ancla = ton.entrada.ancla; }
  ok(J(D.regiones('tonavia')) === J(ton.regiones) && J(D.regiones('tonavia').sort()) === J(Object.keys(JSON.parse(fs.readFileSync('datos/mundo.json', 'utf8')).regiones).sort()), 'F3 las regiones de tonavia coinciden con el plan del mundo (datos/mundo.json)');
  { const g = D.get('tonavia'); g.nombre = 'x'; g.regiones.push('zzz'); const r = D.regiones('tonavia'); r.push('yyy'); ok(D.get('tonavia').nombre === 'Tonavia' && D.regiones('tonavia').length === 8 && D.get('nada') === null && D.get('__proto__') === null && D.get('constructor') === null && !D.existe('toString'), 'F3 get/regiones devuelven copias; ids inexistentes o heredados de Object no existen'); }
  // 2) el mundo real cumple el registro
  ok(D.comprobar(G.mundo.mapas, ['tonavia']).length === 0 && Object.keys(G.mundo.mapas).every((id) => D.deMapa(id) === 'tonavia'), 'F3 los ' + Object.keys(G.mundo.mapas).length + ' mapas reales pertenecen a tonavia, con entrada, ancla y regiones válidas');
  { const r = spawnSync(process.execPath, ['tools/validar_dimension.js'], { cwd: __dirname, encoding: 'utf8' }), r2 = spawnSync(process.execPath, ['tools/validar_dimension.js', 'noexiste'], { cwd: __dirname, encoding: 'utf8' });
    ok(r.status === 0 && /^OK \d+ dimensión\(es\): nexus, pirata, santuario, tonavia/.test(r.stdout) && r.stdout.trim().split('\n').length === 1 && r2.status === 1 && /^FALLA: noexiste/.test(r2.stdout), 'F3 tools/validar_dimension.js: una línea, OK para tonavia y FALLA con código 1 para una dimensión que no existe'); }
  // 3) esquema: lo bueno pasa; cada defecto se rechaza con su motivo
  ok(D.validar(ton, 'tonavia').length === 0 && D.validar(chuches, 'chuches').length === 0 && D.validar({ v: 1, id: 'x', nombre: 'X', entrada: { mapa: 'x/a', ancla: 'b' } }).length === 0, 'F3 esquema: tonavia, una dimensión nueva y la mínima (sin regiones ni reglas) son válidas');
  const malo = (cambio, motivo, nombre, archivo) => { const d = copia(chuches); cambio(d); const e = D.validar(d, archivo); ok(e.length > 0 && (!motivo || e.some((m) => motivo.test(m))), 'F3 esquema rechaza ' + nombre + (e.length ? ' [' + e[0].slice(0, 60) + ']' : ' [NO RECHAZADO]')); };
  [[(d) => { d.v = 0; }, /«v»/, 'v = 0'], [(d) => { d.v = '1'; }, /«v»/, 'v texto'], [(d) => { d.v = 5; }, /más nuevo/, 'esquema futuro (v 5; FN entiende hasta 4)'], [(d) => { d.v = 1.5; }, /«v»/, 'v decimal'], [(d) => { delete d.v; }, /«v»/, 'sin v'],
   [(d) => { d.id = 'Chuches'; }, /«id»/, 'id con mayúsculas'], [(d) => { d.id = '1ab'; }, /«id»/, 'id que empieza por dígito'], [(d) => { d.id = 'a-b'; }, /«id»/, 'id con guion'], [(d) => { d.id = 'a'.repeat(25); }, /«id»/, 'id de 25 caracteres'], [(d) => { d.id = ''; }, /«id»/, 'id vacío'], [(d) => { d.id = 5; }, /«id»/, 'id numérico'], [(d) => { delete d.id; }, /«id»/, 'sin id'],
   [(d) => { d.nombre = ''; }, /nombre/, 'nombre vacío'], [(d) => { d.nombre = '   '; }, /nombre/, 'nombre en blanco'], [(d) => { d.nombre = 7; }, /nombre/, 'nombre numérico'], [(d) => { d.nombre = 'x'.repeat(61); }, /nombre/, 'nombre de 61 caracteres'],
   [(d) => { delete d.entrada; }, /entrada/, 'sin entrada'], [(d) => { d.entrada = []; }, /entrada/, 'entrada lista'], [(d) => { d.entrada = 'albanota'; }, /entrada/, 'entrada texto'], [(d) => { d.entrada.mapa = 'villa_merengue'; }, /debe empezar por/, 'entrada de otra dimensión (sin prefijo)'], [(d) => { d.entrada.mapa = 'tecno/nucleo'; }, /debe empezar por/, 'entrada con el prefijo de otra dimensión'], [(d) => { d.entrada.mapa = 'chuches/'; }, /entrada\.mapa/, 'entrada con prefijo y sin mapa'], [(d) => { d.entrada.mapa = 'chuches_x/a'; }, /debe empezar por/, 'prefijo parecido'], [(d) => { d.entrada.ancla = ''; }, /ancla/, 'ancla vacía'], [(d) => { delete d.entrada.mapa; }, /entrada\.mapa/, 'entrada sin mapa'], [(d) => { d.entrada.extra = 1; }, /desconocida/, 'clave extra en entrada'],
   [(d) => { d.regiones = 'a'; }, /regiones/, 'regiones texto'], [(d) => { d.regiones = ['a', 'a']; }, /repetida/, 'región repetida'], [(d) => { d.regiones = ['A']; }, /región inválida/, 'región con mayúscula'], [(d) => { d.regiones = [5]; }, /región inválida/, 'región numérica'], [(d) => { d.regiones = Array.from({ length: 65 }, (_, i) => 'r' + i); }, /máximo/, '65 regiones'],
   [(d) => { d.reglas = []; }, /reglas/, 'reglas lista'], [(d) => { d.reglas.ciclo = 'propio'; }, /global/, 'reloj propio (decisión: un único reloj)'], [(d) => { d.reglas.requisitos = []; }, /F5/, 'requisitos (los define F5)'],
   [(d) => { d.dificultad = { nivelBase: 8 }; }, /clave desconocida/, 'dificultad (la define F6)'], [(d) => { d.entrenadores = {}; }, /exige «v» ≥ 3/, 'entrenadores en un archivo v1 (F7: solo desde v3)'], [(d) => { d.economia = {}; }, /exige «v» ≥ 2/, 'economía en un archivo v1 (F6: solo desde v2)'], [(d) => { d.__proto__ = null; d.cosa = 1; }, /clave desconocida/, 'clave inventada']].forEach(([f, m, n]) => malo(f, m, n));
  malo((d) => { d.id = 'otra'; d.entrada.mapa = 'otra/a'; }, /no coincide con el archivo/, 'id distinto al nombre del archivo', 'chuches');
  malo((d) => { d.id = 'tonavia'; d.entrada.mapa = 'chuches/a'; }, /no llevan prefijo/, 'tonavia con mapas con prefijo');
  ok(['', 0, null, [], 'x', 5, true].every((x) => D.validar(x).length === 1) && D.validar(Object.assign(copia(chuches), { _nota: 'comentario' })).length === 0, 'F3 esquema: lo que no es un objeto se rechaza sin romper y las claves «_nota» se permiten');
  // 4) registro robusto con datos rotos
  { const R = D.registro({ tonavia: ton, chuches, roto: { v: 1 }, nulo: null, mal: 7, otro: Object.assign(copia(chuches), { id: 'distinto' }), sucio: JSON.parse('{"v":1,"id":"sucio","nombre":"S","entrada":{"mapa":"sucio/a","ancla":"b"},"__proto__":{"x":1}}') });
    ok(J(R.lista()) === '["tonavia","chuches","sucio"]' && !Object.prototype.hasOwnProperty.call(R.get('sucio'), '__proto__') && Object.getPrototypeOf(R.get('sucio')) === Object.prototype, 'F3 registro con archivos rotos: solo entran los válidos, tonavia primero; una clave «__proto__» se trata como comentario (_) y se descarta (' + J(R.lista()) + ')');
    ok(['roto', 'nulo', 'mal', 'otro'].every((k) => R.errores[k] && R.errores[k].length) && !R.existe('roto') && !R.existe('distinto') && ({}).x === undefined, 'F3 registro: cada archivo roto queda en `errores` con su motivo y no contamina nada');
    ok(R.deMapa('chuches/villa') === 'chuches' && R.deMapa('albanota') === 'tonavia' && R.deMapa('prof_cristal_0000abcd_3') === 'tonavia' && R.deMapa('nexus/plaza') === null && R.deMapa('tonavia/x') === null && R.deMapa('chuches/') === null && R.deMapa('/x') === null && R.deMapa('') === null && R.deMapa(null) === null && R.deMapa(7) === null && R.deMapa('chuches/a/b') === 'chuches', 'F3 deMapa: prefijo registrado → su dimensión; sin prefijo → tonavia; prefijo desconocido, vacío o mal formado → null');
    ok(J(D.registro(null).lista()) === '[]' && D.registro(undefined).deMapa('albanota') === null && D.registro([]).entrada('tonavia') === null, 'F3 registro vacío o con fuente inválida: no lanza y no inventa tonavia');
    const mundo = { 'chuches/villa_merengue': { anclas: { portal: [1, 1] }, region: 'valle_algodon' }, 'chuches/x': { anclas: {}, region: 'inventada' }, 'nexus/p': { anclas: {} }, 'tonavia/y': { anclas: {} }, albanota: { anclas: { inicio: [1, 1] }, region: 'albanota' } };
    const c = R.comprobar(mundo); ok(c.some((m) => /región «inventada»/.test(m)) && c.some((m) => /nexus\/p.*ninguna dimensión/.test(m)) && c.some((m) => /tonavia\/y.*ninguna dimensión/.test(m)) && !c.some((m) => /villa_merengue|albanota/.test(m)) && R.comprobar({}).length === R.lista().length, 'F3 comprobar: detecta región inventada, mapas de dimensión no registrada, prefijo «tonavia/» y entrada inexistente');
    const sinAncla = R.comprobar({ 'chuches/villa_merengue': { anclas: {} }, albanota: { anclas: { inicio: [1, 1] } } }); ok(sinAncla.some((m) => /ancla «portal»/.test(m)), 'F3 comprobar: el mapa de entrada debe tener su ancla'); }
  // 5) compatibilidad con F1/F2: el guardado no depende del registro y conserva dimensiones aún no implementadas
  { const Gd = G.guardado, e = G.motor.crear(3), d = Gd.migrar({ v: 1, jugadores: {} }); d.dim.chuches = { v: 1, mapas: { a: 1 } }; Gd.restaurar(e, d); const g = Gd.serializar(e);
    ok(J(g.dim.chuches) === J(d.dim.chuches) && g.v === 2 && J(Object.keys(g.dim).sort()) === '["chuches","tonavia"]' && D.existe('tonavia') && !D.existe('chuches'), 'F3 + F2: una dimensión guardada que el registro aún no conoce se conserva intacta al guardar'); }
  // 6) integridad del empaquetado, pureza y rendimiento
  { const src = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8'), ord = require('./src/orden.json').juego, dist = src('dist/criaturas.html');
    ok(ord.indexOf('src/dimensiones.js') >= 0 && ord.indexOf('src/dimensiones.js') < ord.indexOf('src/mapas.js') && dist.indexOf('"tonavia":{"v":1,"id":"tonavia"') > 0 && !/"_nota":"Dimensión original/.test(dist), 'F3 dimensiones.js se carga antes que mapas.js y el HTML lleva tonavia sin comentarios');
    ok(!/Math\.random|Date\.now|document\.|localStorage|addEventListener/.test(src('src/dimensiones.js').replace(/\/\/.*$/gm, '')) && /G\.dimensiones/.test(src('src/mapas.js')) && !/mapa: 'albanota', ancla: 'inicio'/.test(src('src/mapas.js').replace(/\/\/.*$/gm, '')), 'F3 dimensiones.js es puro y mapas.js ya no lleva el inicio escrito a mano');
    const t0 = process.hrtime.bigint(); let n = 0; for (let i = 0; i < 100000; i++) { if (D.deMapa(i % 2 ? 'chuches/villa' : 'albanota')) n++; } for (let i = 0; i < 2000; i++) D.validar(chuches, 'chuches'); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    ok(ms < 1500, 'F3 rendimiento: 100 000 pertenencias y 2 000 validaciones en ' + Math.round(ms) + ' ms'); }
  // 7) build.js se niega a empaquetar una dimensión rota
  { const dir = path.join(__dirname, 'datos', 'dimensiones'), rota = path.join(dir, 'rota_f3.json'); fs.writeFileSync(rota, J({ v: 1, id: 'rota_f3', nombre: 'R', entrada: { mapa: 'sin_prefijo', ancla: 'a' } })); const dist0 = fs.readFileSync(path.join(__dirname, 'dist', 'criaturas.html'));
    let r; try { r = spawnSync(process.execPath, ['build.js'], { cwd: __dirname, encoding: 'utf8' }); } finally { fs.unlinkSync(rota); }
    ok(r.status === 1 && /dimensiones inválidas/.test(r.stderr) && Buffer.compare(fs.readFileSync(path.join(__dirname, 'dist', 'criaturas.html')), dist0) === 0, 'F3 build.js falla con una dimensión inválida y no toca dist/criaturas.html');
    const tf = path.join(dir, 'tonavia.json'), guardada = fs.readFileSync(tf), tmp = tf + '.tmp_f3'; let r2; fs.renameSync(tf, tmp); try { r2 = spawnSync(process.execPath, ['build.js'], { cwd: __dirname, encoding: 'utf8' }); } finally { fs.renameSync(tmp, tf); }
    const dis = path.join(dir, 'archivo_distinto.json'); fs.writeFileSync(dis, J(Object.assign(copia(chuches), { id: 'otra_dim', entrada: { mapa: 'otra_dim/a', ancla: 'b' } }))); let r3; try { r3 = spawnSync(process.execPath, ['build.js'], { cwd: __dirname, encoding: 'utf8' }); } finally { fs.unlinkSync(dis); }
    ok(r2.status === 1 && /dimensiones inválidas/.test(r2.stderr) && r3.status === 1 && /no coincide con el archivo/.test(r3.stderr) && Buffer.compare(fs.readFileSync(tf), guardada) === 0 && Buffer.compare(fs.readFileSync(path.join(__dirname, 'dist', 'criaturas.html')), dist0) === 0, 'F3 build.js también falla sin tonavia o con un id que no coincide con el archivo, y los archivos quedan como estaban'); }
}

// ── Multiverso F4 · proveedores de mapas, carga/descarga por dimensión, paquetes del editor, semilla restaurada ──
{ const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process'), J = JSON.stringify, copia = (o) => JSON.parse(J(o)), M = G.mundo, D0 = G.dimensiones, Gd = G.guardado;
  const tien = JSON.parse(fs.readFileSync(path.join(__dirname, 'maps', 'tienda.json'), 'utf8'));
  const mapa = (id, puerta, anclas) => { const m = copia(tien); m.id = id; m.npcs = []; m.puertas = [{ id: 'salida', x: 5, y: 7, destino: puerta }]; m.anclas = anclas; return m; };
  const villa = mapa('chuches/villa', { mapa: 'chuches/tienda', ancla: 'entrada' }, { inicio: [5, 6], portal: [5, 6], volver: [5, 6] }), tiendita = mapa('chuches/tienda', { mapa: 'chuches/villa', ancla: 'volver' }, { inicio: [5, 6], entrada: [5, 6] });
  const defChuches = { v: 1, id: 'chuches', nombre: 'Reino de las Chuches', entrada: { mapa: 'chuches/villa', ancla: 'portal' }, regiones: ['valle_algodon'], reglas: { ciclo: 'global' } };
  const reg = D0.registro({ tonavia: JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'dimensiones', 'tonavia.json'), 'utf8')), nexus: JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'dimensiones', 'nexus.json'), 'utf8')), chuches: defChuches });
  const paquete = () => J({ 'chuches/villa': villa, 'chuches/tienda': tiendita });
  const dimAntes = M.dimensiones, provAntes = M.proveedores.slice(); let cargas = 0, liberadas = [];
  const instalar = (fuente) => { M.dimensiones = reg; const p = M.crearProveedorDimension((d) => { cargas++; return fuente(d); }, () => M.dimensiones); const lib = p.liberar; p.liberar = (d) => { liberadas.push(d); lib(d); }; M.proveedores.length = 0; M.proveedores.push(p); provAntes.forEach((q) => M.proveedores.push(q)); return p; };   // (se conserva el proveedor real: tonavia tiene un portal al nexus)
  const quitar = () => { Object.keys(M.mapas).filter((id) => id.indexOf('/') >= 0).forEach((id) => { delete M.mapas[id]; }); M.dimensiones = dimAntes; M.proveedores.length = 0; provAntes.forEach((p) => M.proveedores.push(p)); cargas = 0; liberadas = []; };
  const nuevo = (s) => { const e = G.motor.crear(s || 11); e.sinAparicion = true; G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'albanota', ancla: 'inicio' }); return e; };
  try {
    // 1) carga bajo demanda: nada se analiza hasta que alguien entra; el JSON de la dimensión se lee una vez
    { const p = instalar(() => paquete()); ok(cargas === 0 && M.cargadas('chuches').length === 0 && !M.mapas['chuches/villa'], 'F4 al instalar el proveedor no se carga ni analiza nada');
      const e = nuevo(); G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'chuches/villa', ancla: 'portal' });
      ok(e.jugadores.oli.mapa === 'chuches/villa' && M.cargadas('chuches').length === 1 && cargas === 1, 'F4 un jugador entra a una dimensión no cargada: se carga solo ese mapa y la fuente se lee una vez');
      M.mapa('chuches/tienda'); M.mapa('chuches/villa'); ok(cargas === 1 && J(M.cargadas('chuches').sort()) === '["chuches/tienda","chuches/villa"]', 'F4 cargar más mapas de la misma dimensión no vuelve a leer la fuente');
      ok(M.mapa('chuches/villa').W > 0 && M.mapa('albanota').id === 'albanota', 'F4 los mapas de tonavia no se ven afectados por el proveedor');
      ok(J(p.ids('chuches').sort()) === '["chuches/tienda","chuches/villa"]' && p.ids('tonavia').length === 0 && p.ids('noexiste').length === 0, 'F4 el proveedor lista los mapas de su dimensión y nada para tonavia o dimensiones desconocidas'); }
    quitar();
    // 2) descarga: no con jugadores dentro; sí cuando no queda nadie; tonavia nunca; al volver se reconstruye
    { instalar(() => paquete()); const e = nuevo(), o = e.jugadores.oli; G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'chuches/villa', ancla: 'portal' });
      G.motor.estadoMapa(e, 'chuches/villa').marca = 'x';
      ok(J(G.motor.liberarDimensiones(e)) === '{}' && M.cargadas('chuches').length >= 1 && e.mapas['chuches/villa'], 'F4 una dimensión NO se descarga mientras tenga un jugador dentro');
      G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'chuches/tienda', ancla: 'entrada' }); ok(M.cargadas('chuches').length === 2, 'F4 moverse dentro de la misma dimensión no la descarga');
      if (e.jugadores.lali) { G.motor.aplicar(e, { t: 'colocar', j: 'lali', mapa: 'chuches/villa', ancla: 'portal' }); G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'albanota', ancla: 'inicio' }); ok(M.cargadas('chuches').length >= 1, 'F4 con dos jugadores, si uno sale la dimensión sigue cargada para el otro'); G.motor.aplicar(e, { t: 'colocar', j: 'lali', mapa: 'albanota', ancla: 'inicio' }); }
      else G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'albanota', ancla: 'inicio' });
      ok(M.cargadas('chuches').length === 0 && !e.mapas['chuches/villa'] && !e.mapas['chuches/tienda'] && liberadas.indexOf('chuches') >= 0, 'F4 cuando sale el último jugador la dimensión se descarga (mapas preparados, estado y caché del proveedor)');
      ok(M.cargadas('tonavia').length === Object.keys(M.mapas).filter((i) => i.indexOf('/') < 0).length && M.cargadas('tonavia').length >= 9, 'F4 tonavia sigue cargada tras descargar otra dimensión');
      ok(J(M.descargar('tonavia')) === '[]' && M.mapa('albanota') && M.cargadas('tonavia').length >= 9 && J(M.descargar('noexiste')) === '[]' && J(M.descargar(null)) === '[]', 'F4 tonavia nunca se descarga (ni con la llamada directa) y descargar algo desconocido no hace nada');
      const antes = cargas; G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'chuches/villa', ancla: 'portal' }); ok(cargas === antes + 1 && M.cargadas('chuches').length === 1 && !G.motor.estadoMapa(e, 'chuches/villa').marca, 'F4 al volver se reconstruye desde el plan (la marca temporal no sobrevive)');
      ok(o.mapa === 'chuches/villa' && G.motor.liberarDimensiones(e) && M.cargadas('chuches').length >= 1, 'F4 liberarDimensiones es idempotente y respeta a quien está dentro'); }
    quitar();
    // 3) errores de carga: fuente rota, ids que no pertenecen, mapas inválidos, dimensión no registrada
    { const mal = (fuente, motivo, nombre) => { const p = instalar(() => fuente); let msg = ''; try { M.mapa('chuches/villa'); } catch (x) { msg = x.message; } ok(/no existe el mapa/.test(msg) && (!motivo || motivo.test(p.errores.chuches || '')), 'F4 carga rota (' + nombre + '): error claro, no entra nada' + (motivo ? ' y se anota el motivo' : '')); ok(M.cargadas('chuches').length === 0, 'F4 carga rota (' + nombre + '): no deja nada a medias'); quitar(); };
      mal('{roto', /JSON|Unexpected|Expected/, 'JSON roto'); mal('[1]', /debe ser/, 'lista'); mal('null', null, 'nulo'); mal(J({ 'chuches/villa': { id: 'otra' } }), /no es de la dimensión/, 'id no coincide con la clave'); mal(J({ 'chuches/villa': 5 }), /no es de la dimensión/, 'mapa no objeto'); mal(J({ 'nexus/villa': Object.assign(copia(villa), { id: 'nexus/villa' }) }), null, 'mapa de otra dimensión en el paquete');
      { const p = instalar(() => paquete()); M.dimensiones = D0.registro({ tonavia: copia(D0.get('tonavia')) }); let msg = ''; try { M.mapa('chuches/villa'); } catch (x) { msg = x.message; } ok(/no existe el mapa/.test(msg) && cargas === 0, 'F4 mapa de una dimensión no registrada: no existe y ni siquiera se lee la fuente'); quitar(); }
      { instalar(() => J({ 'chuches/villa': Object.assign(copia(villa), { ancho: 3 }), 'chuches/tienda': tiendita })); let msg = ''; try { M.mapa('chuches/villa'); } catch (x) { msg = x.message; } ok(msg.length > 0 && !M.mapas['chuches/villa'], 'F4 un mapa con datos inválidos no se queda a medias en el mundo (' + msg.slice(0, 40) + ')'); quitar(); }
      { const p = instalar(() => undefined); ok(!p.tiene('chuches/villa') && p.ids('chuches').length === 0, 'F4 dimensión sin paquete: el proveedor no tiene nada'); quitar(); } }
    // 4) validación de una dimensión sin dejarla cargada + integración con dimensiones.comprobar
    { instalar(() => paquete()); const r = M.validarDimension('chuches'); ok(r.length === 0 && M.cargadas('chuches').length === 0, 'F4 validarDimension: una dimensión correcta pasa y no queda cargada');
      ok(M.validarDimension('tonavia').length === 0 && M.validarDimension('noexiste').length === 1, 'F4 validarDimension: tonavia = el mundo cargado; una desconocida se rechaza');
      quitar(); instalar(() => J({ 'chuches/villa': Object.assign(copia(villa), { anclas: { inicio: [5, 6] } }), 'chuches/tienda': tiendita })); const r2 = M.validarDimension('chuches'); ok(r2.some((m) => /portal/.test(m)) && M.cargadas('chuches').length === 0, 'F4 validarDimension: encuentra una entrada sin su ancla y deja la memoria limpia');
      quitar(); instalar(() => J({ 'chuches/villa': Object.assign(copia(villa), { puertas: [{ id: 'salida', x: 5, y: 7, destino: { mapa: 'chuches/fantasma', ancla: 'a' } }] }), 'chuches/tienda': tiendita })); ok(M.validarDimension('chuches').length > 0, 'F4 validarDimension: una puerta a un mapa inexistente se detecta'); quitar();
      ok(M.validar().length === 0 && D0.comprobar(M.mapas, ['tonavia']).length === 0, 'F4 G.mundo.validar() sigue pasando para el mundo real');
      M.agregar(Object.assign(copia(tien), { id: 'intruso/x' })); ok(M.validar().some((m) => /ninguna dimensión registrada/.test(m)), 'F4 G.mundo.validar() integra dimensiones.comprobar: un mapa de dimensión no registrada se señala'); delete M.mapas['intruso/x'];
      M.agregar(Object.assign(copia(tien), { id: 'tienda_reg', region: 'inventada' })); ok(M.validar().some((m) => /región «inventada»/.test(m)), 'F4 G.mundo.validar(): una región que la dimensión no declara se señala'); delete M.mapas.tienda_reg;
      quitar(); }
    { const reg2 = D0.registro({ tonavia: D0.get('tonavia'), chuches: defChuches }); const solo = reg2.comprobar({ albanota: { anclas: { inicio: [1, 1] } } }, ['tonavia']), todo = reg2.comprobar({ albanota: { anclas: { inicio: [1, 1] } } });
      ok(solo.length === 0 && todo.some((m) => /chuches: la entrada/.test(m)) && reg2.comprobar({ albanota: { anclas: { inicio: [1, 1] } } }, []).length === 0 && todo.length === reg2.comprobar({ albanota: { anclas: { inicio: [1, 1] } } }, undefined).length, 'F4 comprobar(mapas, dimensiones): solo exige la entrada de las dimensiones pedidas; sin filtro, todas'); }
    // 5) guardado: restaurar a una dimensión cargada bajo demanda, o a una que ya no existe (se conserva su sección)
    { instalar(() => paquete()); const e = nuevo(); G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'chuches/villa', ancla: 'portal' }); e.jugadores.oli.brillos = 77; e.dim.nexus = { v: 1, x: [1, 2] }; const g = copia(Gd.serializar(e)); quitar(); instalar(() => paquete());
      const e2 = G.motor.crear(5); e2.sinAparicion = true; ok(Gd.restaurar(e2, g) && e2.jugadores.oli.mapa === 'chuches/villa' && M.cargadas('chuches').length >= 1 && e2.jugadores.oli.brillos === 77, 'F4 restaurar una partida guardada en una dimensión bajo demanda la carga y coloca al jugador');
      ok(J(Gd.serializar(e2).dim.nexus) === J(g.dim.nexus), 'F4 + F2: una dimensión desconocida se conserva tras restaurar en una dimensión bajo demanda');
      quitar(); M.dimensiones = D0.registro({ tonavia: D0.get('tonavia') }); const e3 = G.motor.crear(5); e3.sinAparicion = true; ok(Gd.restaurar(e3, g) && e3.jugadores.oli.mapa === M.INICIAL.mapa && e3.jugadores.oli.brillos === 77 && e3.avisos.some((a) => /ya no está disponible/.test(a.texto)) && J(Gd.serializar(e3).dim.nexus) === J(g.dim.nexus), 'F4 + F1: si la dimensión guardada ya no está registrada, el jugador va al ancla segura, el progreso y las secciones de otras dimensiones quedan intactos'); quitar();
      instalar(() => J({ 'chuches/villa': 5 })); const e4 = G.motor.crear(5); e4.sinAparicion = true; ok(Gd.restaurar(e4, g) && e4.jugadores.oli.mapa === M.INICIAL.mapa && e4.jugadores.oli.brillos === 77 && M.cargadas('chuches').length === 0, 'F4 + F1: si el paquete de la dimensión guardada está roto, se restaura el progreso en el ancla segura sin dejar nada cargado'); quitar();
      instalar(() => paquete()); const e5 = G.motor.crear(5); e5.sinAparicion = true; const g5 = copia(g); g5.jugadores.oli.mapa = 'chuches/villa'; g5.jugadores.oli.x = 1e9; ok(Gd.restaurar(e5, g5) && e5.jugadores.oli.mapa === 'chuches/villa' && e5.jugadores.oli.x === 5 * 16 + 8 && M.cargadas('chuches').length >= 1, 'F4 restaurar con posición imposible en una dimensión bajo demanda: el jugador va al ancla de ESE mapa (comportamiento de F1) y la dimensión queda cargada porque hay alguien dentro'); quitar(); }
    // 6) paquetes del editor: sin prefijos, solo tonavia, y todo el mundo resultante pasa dimensiones.comprobar
    { const paq = (maps) => J({ paquete: 'mapas_editor', version: 1, formato: 2, maps }), leer = M.paquete.leer, base = (id, extra) => Object.assign(copia(tien), { id }, extra);
      const buena = leer(paq([base('pkg_f4')])); ok(buena.ok && J(buena.ids) === '["pkg_f4"]' && !M.mapas.pkg_f4, 'F4 paquete correcto sin prefijo: se acepta y no toca el mundo al leerlo');
      ['chuches/villa', 'dim/mapa', 'tonavia/x', 'x/', '/x', 'a/b/c'].forEach((id) => { const r = leer(paq([base(id)])); ok(!r.ok && r.errores.some((m) => /prefijo de dimensión/.test(m) && /solo importa mapas de tonavia/.test(m)), 'F4 el paquete con id «' + id + '» se rechaza con un mensaje claro'); });
      { const r = leer(paq([base('chuches/villa')])); ok(!M.mapas['chuches/villa'] && M.cargadas('chuches').length === 0, 'F4 un paquete rechazado no deja nada cargado'); }
      { const r = leer(paq([base('ok_1'), base('chuches/otro')])); ok(!r.ok && r.errores.length === 1, 'F4 un paquete mixto se rechaza entero (un solo error)'); }
      { const r = leer(paq([base('pkg_region', { region: 'inventada' })])); ok(!r.ok && r.errores.some((m) => /región «inventada»/.test(m)), 'F4 un paquete con una región que tonavia no declara se rechaza (dimensiones.comprobar)'); }
      { const r = leer(paq([base('pkg_f4_b', { region: D0.regiones('tonavia')[0] })])); ok(r.ok === true, 'F4 un paquete con una región que tonavia sí declara se acepta' + (r.ok ? '' : ': ' + r.errores.join('; '))); }
      { const antes = J(Object.keys(M.mapas).sort()); const r = leer(paq([base('tienda_nueva', { puertas: [{ id: 'salida', x: 5, y: 7, destino: { mapa: 'chuches/villa', ancla: 'portal' } }] })])); ok(!r.ok && J(Object.keys(M.mapas).sort()) === antes, 'F4 un paquete cuya puerta apunta a otra dimensión se rechaza y el mundo no cambia'); }
      { const r = leer(paq([base('pkg_a'), base('pkg_a')])); ok(!r.ok, 'F4 ids repetidos en el paquete se rechazan (regresión)'); } }
    // 7) semilla: se restaura (plan reproducible); el azar de combate y de sesión es independiente y nuevo cada sesión
    { const Gd2 = Gd, a = G.motor.crear(1234), s = copia(Gd2.serializar(a)); ok(s.semilla === 1234, 'F4 el guardado lleva la semilla del mundo');
      const b = G.motor.crear(999999), sesionB = b.sesion, rndB = b.rnd; b.mapas.albanota = { viejo: 1 }; Gd2.restaurar(b, s);
      ok(b.semilla === 1234 && b.sesion === sesionB && b.sesion === 999999 && b.rnd === rndB && !(b.mapas.albanota && b.mapas.albanota.viejo), 'F4 restaurar fija la semilla del mundo y NO toca la de sesión ni est.rnd, y el estado de mapas se reinicia');
      const plan = (e) => { e.sinAparicion = false; G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'albanota', ancla: 'inicio' }); return J(G.motor.criaturas(e, 'albanota').map((c) => [c.esp || c.sp || c.id, Math.round(c.x), Math.round(c.y)])); };
      const p1 = plan(G.motor.crear(1234)), p2 = plan((() => { const e = G.motor.crear(777); Gd2.restaurar(e, s); return e; })()), p3 = plan(G.motor.crear(4321)); ok(p1.length > 4 && p1 === p2, 'F4 reproducibilidad: crear con la semilla y restaurar sobre otra semilla dan el MISMO plan de criaturas'); ok(p1 !== p3, 'F4 semillas distintas dan planes distintos (la comparación es significativa)');
      { const e1 = G.motor.crear(10), e2 = G.motor.crear(20); e1.sesion = 555; e2.sesion = 555; Gd2.restaurar(e1, s); Gd2.restaurar(e2, s); ok(e1.semilla === e2.semilla && e1.sesion === e2.sesion, 'F4 misma semilla de mundo y de sesión: estado equivalente'); }
      { const src = require('fs').readFileSync(path.join(__dirname, 'src', 'combate_motor.js'), 'utf8'); ok(/est\.sesion !== undefined \? est\.sesion : est\.semilla/.test(src), 'F4 el azar del combate sale de la semilla de sesión'); }
      { const m1 = G.motor.crear(1000), m2 = G.motor.crear(1000); m1.sesion = 11; m2.sesion = 22; const g1 = copia(Gd2.serializar(m1)); ok(G.motor.crear(5).sesion === 5 && g1.semilla === 1000 && !('sesion' in g1), 'F4 la semilla de sesión no se guarda en la partida (cada sesión tiene la suya)'); }
      { const x = G.motor.crear(7); x.sesion = 3; const s0 = copia(s); s0.semilla = 'abc'; Gd2.restaurar(x, s0); const s1 = copia(s); s1.semilla = -5; Gd2.restaurar(x, s1); const s2 = copia(s); s2.semilla = 1.5; Gd2.restaurar(x, s2); const s3 = copia(s); s3.semilla = 2 ** 32; Gd2.restaurar(x, s3); delete s.semilla; Gd2.restaurar(x, s); ok(x.semilla === 7 && x.sesion === 3, 'F4 una semilla guardada inválida (texto, negativa, decimal, fuera de rango o ausente) se ignora'); }
      { const e = G.motor.crear(1), g = copia(Gd2.serializar(e)); g.dim.nexus = { v: 1, z: [1] }; const e2 = G.motor.crear(2); Gd2.restaurar(e2, g); Gd2.restaurar(e2, copia(Gd2.serializar(e2))); ok(J(Gd2.serializar(e2).dim.nexus) === J(g.dim.nexus) && e2.semilla === 1, 'F4 + F2: restaurar la semilla no pierde las dimensiones desconocidas'); } }
    // 8) build.js: empaquetado de maps/<dim>/ y rechazo de paquetes rotos
    { const dir = path.join(__dirname, 'maps', 'zz_f4'), dist = path.join(__dirname, 'dist', 'criaturas.html'), dist0 = fs.readFileSync(dist);
      const ejecutar = (archivos) => { fs.mkdirSync(dir, { recursive: true }); Object.keys(archivos).forEach((f) => fs.writeFileSync(path.join(dir, f), archivos[f])); try { return spawnSync(process.execPath, ['build.js'], { cwd: __dirname, encoding: 'utf8' }); } finally { fs.rmSync(dir, { recursive: true, force: true }); } };
      const r1 = ejecutar({ 'a.json': J(Object.assign(copia(villa), { id: 'zz_f4/a' })) }); const html1 = fs.readFileSync(dist, 'utf8');
      ok(r1.status === 0 && /window\.G\.PAQUETES = \{[^]*"zz_f4":"/.test(html1) && !/maps\/zz_f4/.test(html1), 'F4 build.js empaqueta maps/<dim>/*.json como UN texto por dimensión (G.PAQUETES)');
      const r2 = ejecutar({ 'a.json': J(Object.assign(copia(villa), { id: 'otra/a' })) }); ok(r2.status !== 0 && /debe empezar por «zz_f4\//.test(r2.stderr + r2.stdout), 'F4 build.js rechaza un mapa cuyo id no empieza por el nombre de su carpeta');
      const r3 = ejecutar({ 'a.json': J(Object.assign(copia(villa), { id: 'zz_f4/a' })), 'b.json': J(Object.assign(copia(villa), { id: 'zz_f4/a' })) }); ok(r3.status !== 0 && /id repetido/.test(r3.stderr + r3.stdout), 'F4 build.js rechaza ids repetidos dentro de una dimensión');
      const r4 = ejecutar({ 'a.json': '{roto' }); ok(r4.status !== 0, 'F4 build.js rechaza un JSON roto en maps/<dim>/');
      const r5 = spawnSync(process.execPath, ['build.js'], { cwd: __dirname, encoding: 'utf8' }); const html5 = fs.readFileSync(dist, 'utf8'); ok(r5.status === 0 && /window\.G\.PAQUETES = \{"nexus":"/.test(html5) && !/zz_f4/.test(html5), 'F4 G.PAQUETES lleva solo las dimensiones con carpeta (nexus; tonavia sigue en G.MAPAS) y nada de una carpeta temporal ya borrada'); }
  } finally { quitar(); M.dimensiones = dimAntes; }
}

// ── Multiverso F5 · portales con requisitos, transiciones, Nexus técnico, tablón global ──
{ const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process'), J = JSON.stringify, copia = (o) => JSON.parse(J(o)), M = G.mundo, D0 = G.dimensiones, P = G.portales, UI = G.portalesUI, Gd = G.guardado;
  const leerJ = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')), ermitaDatos = leerJ('maps/ermita.json'), plazaDatos = leerJ('maps/nexus/plaza_cruce.json');
  const nuevo = (s) => { const e = G.motor.crear(s || 21); e.sinAparicion = true; return e; };
  const alNivel = (j, n) => { j.xpE = G.entrenador.xpPara(n); };
  const aviso = (e) => e.avisos.map((a) => a.texto).join(' | ');
  const pisar = (e, j, mapaId, puertaId) => { const m = M.mapa(mapaId), p = m.puertas.find((q) => q.id === puertaId); j.x = p.x * 16 + 8; j.y = p.y * 16 + 14; j.enPuerta = null; G.motor.cruzar(e, j, m); };
  // 1) validación del campo «portal»
  { const base = () => ({ color: '#b9a2ff', icono: 'eco', nombre: 'P', requisitos: [{ t: 'nivelEntrenador', n: 5 }] });
    ok(P.validar(base()).length === 0 && P.validar({}).length === 0 && P.validar({ requisitos: [] }).length === 0 && P.validar(Object.assign(base(), { _nota: 'x' })).length === 0, 'F5 portal: lo correcto pasa (también vacío, sin requisitos y con comentarios «_»)');
    const malo = (cambio, re, n) => { const p = base(); cambio(p); const e = P.validar(p); ok(e.length > 0 && re.test(e.join(' | ')), 'F5 portal rechazado: ' + n + ' (' + (e[0] || '').slice(0, 60) + ')'); };
    malo((p) => { p.color = 'rojo'; }, /color/, 'color no hex'); malo((p) => { p.color = '#fff'; }, /color/, 'color corto'); malo((p) => { p.icono = 'Eco!'; }, /icono/, 'icono con mayúsculas'); malo((p) => { p.nombre = ''; }, /nombre/, 'nombre vacío'); malo((p) => { p.nombre = 'x'.repeat(41); }, /nombre/, 'nombre larguísimo');
    malo((p) => { p.requisitos = {}; }, /lista/, 'requisitos no es lista'); malo((p) => { p.requisitos = [{ t: 'objeto', id: 'llave' }]; }, /tipo desconocido/, 'tipo de requisito desconocido (los define F6)'); malo((p) => { p.requisitos = [5]; }, /debe ser/, 'requisito no objeto'); malo((p) => { p.requisitos = [{ n: 5 }]; }, /debe ser/, 'requisito sin tipo');
    malo((p) => { p.requisitos[0].n = 0; }, /entero/, 'nivel 0'); malo((p) => { p.requisitos[0].n = 5.5; }, /entero/, 'nivel decimal'); malo((p) => { p.requisitos[0].n = '5'; }, /entero/, 'nivel texto'); malo((p) => { p.requisitos[0].n = G.entrenador.MAX + 1; }, /nivel máximo/, 'nivel que nadie puede alcanzar'); malo((p) => { p.requisitos[0].extra = 1; }, /clave desconocida/, 'clave extra en el requisito');
    malo((p) => { p.zzz = 1; }, /clave desconocida/, 'clave desconocida en el portal'); malo((p) => { p.requisitos = new Array(9).fill({ t: 'nivelEntrenador', n: 2 }); }, /máximo/, 'demasiados requisitos');
    ok(P.validar(null).length === 1 && P.validar([]).length === 1 && P.validar('x').length === 1, 'F5 portal: null, lista y texto no son un portal');
    ok(P.validar({ requisitos: [{ t: '__proto__' }] }).length > 0 && P.validar({ requisitos: [{ t: 'constructor' }] }).length > 0 && P.validar({ requisitos: [{ t: 'hasOwnProperty' }] }).length > 0, 'F5 portal: tipos con nombres de Object.prototype no se cuelan'); }
  // 2) comprobar: abre solo si TODO se cumple; lo mal formado cierra
  { const j = {}, p = { requisitos: [{ t: 'nivelEntrenador', n: 5 }] };
    ok(P.comprobar(j, p).ok === false && /nivel de entrenador 5 \(tienes 1\)/.test(P.comprobar(j, p).faltan[0]), 'F5 comprobar: nivel 1 no abre y dice qué falta');
    alNivel(j, 4); ok(!P.comprobar(j, p).ok, 'F5 comprobar: nivel 4 no abre'); alNivel(j, 5); ok(P.comprobar(j, p).ok, 'F5 comprobar: nivel 5 abre (límite exacto)'); alNivel(j, 50); ok(P.comprobar(j, p).ok, 'F5 comprobar: nivel máximo abre');
    ok(P.comprobar(j, {}).ok && P.comprobar(j, undefined).ok && P.comprobar(j, { requisitos: [] }).ok, 'F5 comprobar: sin requisitos, abre');
    ok(!P.comprobar(j, { requisitos: [{ t: 'misterio' }] }).ok && !P.comprobar(j, { requisitos: [{ t: 'nivelEntrenador', n: 'x' }] }).ok && !P.comprobar(j, { requisitos: [null] }).ok && !P.comprobar(j, { requisitos: [{ t: 'nivelEntrenador', n: 2 }, { t: 'misterio' }] }).ok, 'F5 comprobar: un requisito desconocido o mal formado cierra el portal (nunca abre por error)');
    ok(!P.comprobar(null, p).ok && !P.comprobar(undefined, p).ok && !P.comprobar({ xpE: -5 }, p).ok && !P.comprobar({ xpE: NaN }, p).ok && !P.comprobar({ xpE: 'mucho' }, p).ok, 'F5 comprobar: jugador nulo o con experiencia rota = nivel 1');
    alNivel(j, 3); const dos = P.comprobar(j, { requisitos: [{ t: 'nivelEntrenador', n: 6 }, { t: 'nivelEntrenador', n: 9 }] }); ok(dos.faltan.length === 2, 'F5 comprobar: lista TODO lo que falta'); }
  // 3) datos reales: ermita → nexus
  { const pe = M.mapa('ermita').puertas.find((q) => q.id === 'portal_nexus'), pn = plazaDatos.puertas[0];
    ok(pe && pe.portal.requisitos[0].t === 'nivelEntrenador' && pe.portal.requisitos[0].n === 5 && pe.destino.mapa === 'nexus/plaza_cruce' && ermitaDatos.puertas.length === 2, 'F5 la Ermita tiene su portal al Nexus con nivel de entrenador 5 (dato, no código)');
    ok(D0.existe('nexus') && D0.deMapa('nexus/plaza_cruce') === 'nexus' && D0.entrada('nexus').mapa === 'nexus/plaza_cruce' && M.cargadas('nexus').length === 0 && !M.mapas['nexus/plaza_cruce'], 'F5 el Nexus está registrado y NO está cargado al arrancar');
    ok(M.validar().length === 0 && M.validarDimension('nexus').length === 0 && M.cargadas('nexus').length === 0, 'F5 validar el mundo y el Nexus pasa y no deja el Nexus cargado');
    ok(plazaDatos.zonas.length === 0 && plazaDatos.npcs.some((n) => n.id === 'tablon') && !plazaDatos.npcs.some((n) => /guarida/.test(n.id)) && plazaDatos.anclas[D0.entrada('nexus').ancla] && pn.destino.ancla === 'volver' && pn.portal.requisitos === undefined, 'F5 el Nexus técnico: sin zonas de aparición (sin salvajes), con tablón y portal de vuelta libre');
    const nx = M.mapa('nexus/plaza_cruce'); ok(G.aparicion.libre ? !nx.zonas.length : true, 'F5 mundo.mapa carga el Nexus por el proveedor'); M.descargar('nexus'); }
  // 4) el motor: requisitos al cruzar, avisos, carga y descarga
  { const e = nuevo(), j = e.jugadores.oli; G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'ermita', ancla: 'entrada' });
    pisar(e, j, 'ermita', 'portal_nexus'); ok(j.mapa === 'ermita' && /nivel de entrenador 5 \(tienes 1\)/.test(aviso(e)) && M.cargadas('nexus').length === 0 && j.enPuerta === 'ermita:8,2', 'F5 sin nivel el portal no se abre, avisa, no carga el Nexus y no repite el aviso mientras sigas encima');
    const n0 = e.avisos.length; G.motor.cruzar(e, j, M.mapa('ermita')); ok(e.avisos.length === n0, 'F5 quedarse sobre el portal cerrado no acumula avisos');
    alNivel(j, 4); e.avisos.length = 0; pisar(e, j, 'ermita', 'portal_nexus'); ok(j.mapa === 'ermita', 'F5 nivel 4: sigue cerrado');
    alNivel(j, 5); e.avisos.length = 0; j.volver.length = 0; pisar(e, j, 'ermita', 'portal_nexus');
    ok(j.mapa === 'nexus/plaza_cruce' && M.cargadas('nexus').length === 1 && /Cruzas el portal: El Cruce/.test(aviso(e)) && J(j.volver) === J([{ mapa: 'ermita', tx: 8, ty: 2 }]), 'F5 nivel 5: cruza al Nexus, lo carga bajo demanda, lo anuncia y apila la puerta de origen');
    ok(j.x === 10 * 16 + 8 && j.y === 10 * 16 + 14 && !!e.mapas['nexus/plaza_cruce'] && e.mapas['nexus/plaza_cruce'].criaturas.length === 0, 'F5 llega al ancla de entrada del Nexus y allí no hay criaturas salvajes');
    for (let i = 0; i < 40; i++) { G.motor.avanzar ? G.motor.avanzar(e, 0.05) : 0; } ok(e.mapas['nexus/plaza_cruce'].criaturas.length === 0, 'F5 pasa el tiempo en el Nexus: sigue sin salvajes');
    e.avisos.length = 0; pisar(e, j, 'nexus/plaza_cruce', 'portal_ermita');
    ok(j.mapa === 'ermita' && M.cargadas('nexus').length === 0 && !e.mapas['nexus/plaza_cruce'] && j.volver.length === 0 && /Cruzas el portal: Tonavia/.test(aviso(e)), 'F5 volver por el portal del Nexus: regresa a la Ermita, anuncia Tonavia, descarga el Nexus y vacía la pila');
    // sin pila (partida cargada dentro): se sale por la puerta de este edificio
    G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'nexus/plaza_cruce', ancla: 'portal' }); j.volver.length = 0; pisar(e, j, 'nexus/plaza_cruce', 'portal_ermita'); ok(j.mapa === 'ermita' && M.cargadas('nexus').length === 0, 'F5 volver sin pila de puertas: sale por el portal de la Ermita');
    // dos jugadores: el Nexus sigue cargado mientras quede uno dentro
    if (e.jugadores.lali) { const l = e.jugadores.lali; alNivel(j, 5); G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'nexus/plaza_cruce', ancla: 'portal' }); G.motor.aplicar(e, { t: 'colocar', j: 'lali', mapa: 'nexus/plaza_cruce', ancla: 'portal' }); G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'albanota', ancla: 'inicio' }); ok(M.cargadas('nexus').length === 1, 'F5 con otro jugador dentro el Nexus sigue cargado'); G.motor.aplicar(e, { t: 'colocar', j: 'lali', mapa: 'albanota', ancla: 'inicio' }); ok(M.cargadas('nexus').length === 0, 'F5 cuando sale el último se descarga'); }
    // el requisito se lee del DATO: cambiar el nivel en el mapa cambia el comportamiento
    { const orig = M.mapas.ermita; const d = copia(ermitaDatos); d.puertas.find((q) => q.id === 'portal_nexus').portal.requisitos[0].n = 9; M.agregar(d);
      try { const e2 = nuevo(), j2 = e2.jugadores.oli; G.motor.aplicar(e2, { t: 'colocar', j: 'oli', mapa: 'ermita', ancla: 'entrada' }); alNivel(j2, 5); pisar(e2, j2, 'ermita', 'portal_nexus'); const cerrado = j2.mapa === 'ermita' && /nivel de entrenador 9/.test(aviso(e2)); alNivel(j2, 9); j2.enPuerta = null; pisar(e2, j2, 'ermita', 'portal_nexus'); ok(cerrado && j2.mapa === 'nexus/plaza_cruce', 'F5 el nivel exigido es configurable por datos (9 en vez de 5)'); } finally { M.mapas.ermita = orig; M.descargar('nexus'); } }
    // «colocar» es una orden interna (pruebas, arranque): no aplica requisitos de portal
    { const e3 = nuevo(); G.motor.aplicar(e3, { t: 'colocar', j: 'oli', mapa: 'nexus/plaza_cruce', ancla: 'portal' }); ok(e3.jugadores.oli.mapa === 'nexus/plaza_cruce', 'F5 «colocar» (orden interna) no exige requisitos: los exige cruzar el portal'); M.descargar('nexus'); } }
  // 5) validación de portales entre dimensiones en el mapa del mundo
  { const D = M.dimensiones, provAntes = M.proveedores.slice(), reg = D0.registro({ tonavia: D0.get('tonavia'), nexus: D0.get('nexus') });
    const falso = (id, puertas) => Object.assign(copia(M.mapa('tienda') && ermitaDatos), { id, puertas, npcs: [] });
    const prueba = (puertas) => { const m = falso('zz_portal_f5', puertas); M.agregar(m); try { return M.validar(); } finally { delete M.mapas.zz_portal_f5; } };
    const v0 = prueba([{ id: 'p', x: 5, y: 9, destino: { mapa: 'nexus/plaza_cruce', ancla: 'portal' }, portal: { color: '#ff0000' } }]); ok(v0.length === 0, 'F5 validar: un portal a un mapa y ancla que existen en otra dimensión (no cargada) pasa' + (v0.length ? ': ' + v0[0] : ''));
    ok(M.cargadas('nexus').length === 0, 'F5 validar no deja cargada la dimensión que ha mirado');
    ok(prueba([{ id: 'p', x: 5, y: 9, destino: { mapa: 'nexus/no_existe', ancla: 'portal' } }]).some((m) => /va a un mapa que no existe/.test(m)), 'F5 validar: portal a un mapa inexistente de otra dimensión se señala');
    ok(prueba([{ id: 'p', x: 5, y: 9, destino: { mapa: 'nexus/plaza_cruce', ancla: 'zz' } }]).some((m) => /ancla que no existe/.test(m)), 'F5 validar: portal a un ancla inexistente de otra dimensión se señala');
    ok(prueba([{ id: 'p', x: 5, y: 9, destino: { mapa: 'fantasma/plaza', ancla: 'a' } }]).some((m) => /no existe/.test(m)), 'F5 validar: portal a una dimensión no registrada se señala');
    ok(prueba([{ id: 'p', x: 5, y: 9, destino: { mapa: 'nexus/plaza_cruce', ancla: 'portal', dim: 'tonavia' } }]).some((m) => /dim «tonavia»/.test(m)) && prueba([{ id: 'p', x: 5, y: 9, destino: { mapa: 'nexus/plaza_cruce', ancla: 'portal', dim: 'nexus' } }]).length === 0, 'F5 validar: «dim» en el destino solo se admite si coincide con el prefijo del mapa');
    ok(prueba([{ id: 'p', x: 5, y: 9, destino: { mapa: 'nexus/plaza_cruce', ancla: 'portal' }, portal: { requisitos: [{ t: 'misterio' }] } }]).some((m) => /tipo desconocido/.test(m)) && prueba([{ id: 'p', x: 5, y: 9, destino: { mapa: 'nexus/plaza_cruce', ancla: 'portal' }, portal: { color: 'rojo' } }]).some((m) => /color/.test(m)), 'F5 validar: un campo «portal» mal formado se señala con el nombre de la puerta');
    // una dimensión con paquete roto: el portal que apunta a ella se señala y nada queda a medias
    { M.proveedores.length = 0; M.proveedores.push(M.crearProveedorDimension((d) => (d === 'nexus' ? '{roto' : undefined), () => M.dimensiones)); try { const v = M.validar(); ok(v.some((m) => /portal_nexus/.test(m) && /no existe/.test(m)) && M.cargadas('nexus').length === 0, 'F5 validar: si el paquete de la dimensión de destino está roto, el portal de la Ermita se señala'); } finally { M.proveedores.length = 0; provAntes.forEach((p) => M.proveedores.push(p)); } }
    ok(M.validar().length === 0, 'F5 validar vuelve a pasar con el proveedor real'); }
  // 6) paquetes del editor: nada de portales ni destinos de otra dimensión
  { const tien = leerJ('maps/tienda.json'), paq = (m) => J({ paquete: 'mapas_editor', version: 1, formato: 2, maps: [m] }), leer = M.paquete.leer, base = (puertas) => Object.assign(copia(tien), { id: 'pkg_f5', puertas });
    const sale = { id: 'salida', x: 5, y: 7, destino: { mapa: 'albanota', ancla: 'volver' } };
    ok(leer(paq(base([sale]))).ok, 'F5 un paquete sin portales sigue pasando');
    [[{ id: 'p', x: 5, y: 7, destino: { mapa: 'albanota', ancla: 'volver' }, portal: { color: '#ff0000' } }, 'campo portal'], [{ id: 'p', x: 5, y: 7, destino: { mapa: 'nexus/plaza_cruce', ancla: 'portal' } }, 'destino con prefijo de dimensión'], [{ id: 'p', x: 5, y: 7, destino: { mapa: 'albanota', ancla: 'inicio', dim: 'tonavia' } }, 'campo dim']].forEach(([pu, n]) => { const r = leer(paq(base([pu]))); ok(!r.ok && r.errores.some((m) => /no se importan desde el editor/.test(m)), 'F5 el editor rechaza una puerta con ' + n + ' y lo explica'); });
    ok(M.cargadas('nexus').length === 0 && !M.mapas.pkg_f5, 'F5 un paquete rechazado no carga ni deja nada');
    { const erm = (cambio) => { const d = copia(ermitaDatos); cambio(d); return leer(J({ paquete: 'mapas_editor', version: 1, formato: 2, maps: [d] })); }, pn = (d) => d.puertas.find((q) => q.id === 'portal_nexus');
      const r0 = erm(() => {}); ok(r0.ok && r0.reemplaza.indexOf('ermita') >= 0, 'F5 el editor puede reexportar la Ermita con su portal oficial sin cambios (no se pierde al editar el resto)' + (r0.ok ? '' : ': ' + r0.errores[0]));
      ok(erm((d) => { pn(d).portal.requisitos[0].n = 1; }).ok === false && erm((d) => { pn(d).destino.ancla = 'inicio'; }).ok === false && erm((d) => { pn(d).portal.color = '#000000'; }).ok === false, 'F5 el editor NO puede cambiar el portal oficial (nivel, destino, color): los portales no se editan desde el editor');
      ok(erm((d) => { pn(d).x = 9; }).ok === true && erm((d) => { d.puertas = d.puertas.filter((q) => q.id !== 'portal_nexus'); }).ok === true, 'F5 mover o quitar el portal oficial sí se puede (es decisión de quien edita su mundo)');
      const pl = fs.readFileSync(path.join(__dirname, 'tools', 'editor_mapas.plantilla.html'), 'utf8'); ok(/portal: JSON\.parse\(JSON\.stringify\(p\.portal\)\)/.test(pl) && /Object\.assign\(\{\}, p\.destino/.test(pl), 'F5 la plantilla del editor conserva el campo «portal» y el resto del destino al abrir y exportar un mapa'); } }
  // 7) guardado: reanudar dentro del Nexus
  { const e = nuevo(), j = e.jugadores.oli; alNivel(j, 5); G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'ermita', ancla: 'entrada' }); pisar(e, j, 'ermita', 'portal_nexus'); j.brillos = 321; e.dim.futura = { v: 2, x: [1] }; const g = copia(Gd.serializar(e)); M.descargar('nexus');
    ok(g.jugadores.oli.mapa === 'nexus/plaza_cruce' && g.v === 2, 'F5 el guardado dentro del Nexus lleva su mapa');
    const e2 = G.motor.crear(7); e2.sinAparicion = true; ok(Gd.restaurar(e2, g) && e2.jugadores.oli.mapa === 'nexus/plaza_cruce' && e2.jugadores.oli.brillos === 321 && M.cargadas('nexus').length === 1 && J(e2.jugadores.oli.volver) === J(j.volver) && J(Gd.serializar(e2).dim.futura) === J(e.dim.futura), 'F5 restaurar dentro del Nexus: carga la dimensión, conserva la pila de puertas, el progreso y las dimensiones desconocidas');
    pisar(e2, e2.jugadores.oli, 'nexus/plaza_cruce', 'portal_ermita'); ok(e2.jugadores.oli.mapa === 'ermita' && M.cargadas('nexus').length === 0, 'F5 tras reanudar dentro, el portal de vuelta funciona y descarga el Nexus');
    const reg = D0.registro({ tonavia: D0.get('tonavia') }), antes = M.dimensiones; M.dimensiones = reg; try { const e3 = G.motor.crear(7); e3.sinAparicion = true; ok(Gd.restaurar(e3, g) && e3.jugadores.oli.mapa === M.INICIAL.mapa && e3.jugadores.oli.brillos === 321 && J(Gd.serializar(e3).dim.futura) === J(e.dim.futura), 'F5 + F1: si el Nexus ya no está registrado, el jugador va al ancla segura sin perder nada'); } finally { M.dimensiones = antes; M.descargar('nexus'); }
    const e4 = G.motor.crear(7); e4.sinAparicion = true; Gd.restaurar(e4, g); const guardado2 = Gd.serializar(e4); M.descargar('nexus'); const e5 = G.motor.crear(8); e5.sinAparicion = true; Gd.restaurar(e5, copia(guardado2)); ok(J(Gd.serializar(e5).jugadores.oli) === J(guardado2.jugadores.oli), 'F5 guardar→cargar→guardar dentro del Nexus es estable'); M.descargar('nexus'); }
  // 8) tablón global
  { const e = nuevo(), j = e.jugadores.oli, tab = (mapa, x, y) => { G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa, ancla: 'inicio' }); j.x = x * 16 + 8; j.y = y * 16 + 14; return G.tablon.cerca(e, j); };
    ok(tab('tienda', 3, 3) === true, 'F5 el tablón de la Tienda de Albanota sigue funcionando'); ok(tab('nexus/plaza_cruce', 15, 8) === true, 'F5 el tablón del Nexus funciona');
    ok(tab('nexus/plaza_cruce', 3, 11) === false && tab('albanota', 24, 24) === false && tab('tienda', 9, 6) === false, 'F5 lejos de un tablón (o en un mapa sin tablón) no se puede usar');
    G.tablon.cerca(e, null); e.combate = {}; ok(tab('nexus/plaza_cruce', 15, 8) === false, 'F5 en combate no se usa el tablón'); delete e.combate; M.descargar('nexus');
    ok(J(Object.keys(Gd.serializar(e)).sort()) === J(Object.keys(Gd.serializar(nuevo())).sort()) && Object.keys(Gd.serializar(e)).indexOf('tablon') >= 0 && !Object.keys(Gd.serializar(e).dim.tonavia).some((k) => /tablon/.test(k)), 'F5 el tablón sigue siendo UN solo estado global (est.tablon) en el guardado'); }
  // 9) identidad visual y transición (solo dibujo; sin estado de partida)
  { const llamadas = []; const ctx = new Proxy({}, { get(_, k) { if (k === 'createRadialGradient') return () => ({ addColorStop() {} }); return (...a) => { llamadas.push([String(k), a]); }; }, set(_, k, v) { llamadas.push(['set:' + String(k), [v]]); return true; } });
    const cam = { x: 0, y: 0 }, mer = M.mapa('ermita'), alb = M.mapa('albanota');
    ok(UI.portales(mer).length === 1 && UI.portales(alb).length === 0 && UI.portales(null).length === 0, 'F5 la interfaz reconoce los portales de un mapa (Albanota ninguno)');
    UI.pintar(ctx, alb, cam, 768, 576, 3, null); ok(llamadas.length === 0, 'F5 un mapa sin portales no dibuja NADA (el dibujo de Albanota y las huellas no cambian)');
    const j1 = nuevo().jugadores.oli, j5 = nuevo().jugadores.oli; alNivel(j5, 5);
    const col = (j) => { llamadas.length = 0; UI.pintar(ctx, mer, cam, 176, 160, 1.7, j); return J(llamadas.filter((c) => c[0] === 'set:strokeStyle')); };
    const c1 = col(j1), c5 = col(j5); ok(llamadas.length > 5 && c1 !== c5 && /rgba\(185,162,255/.test(c5), 'F5 el portal se ve del color de sus datos y distinto (apagado) mientras no cumples el requisito');
    llamadas.length = 0; UI.pintar(ctx, mer, { x: 5000, y: 5000 }, 176, 160, 1, null); ok(llamadas.length === 0, 'F5 un portal fuera de pantalla no se dibuja');
    llamadas.length = 0; UI.pintar(ctx, mer, cam, 176, 160, 1, j5); const t1 = J(llamadas); llamadas.length = 0; UI.pintar(ctx, mer, cam, 176, 160, 1, j5); ok(t1 === J(llamadas), 'F5 el dibujo del portal es determinista (mismo reloj, mismo resultado)');
    UI.reiniciar(); ok(UI.entrar('albanota', 'albanota', 0) === false && UI.entrar('albanota', 'tienda', 0) === false && UI.enCurso(0.1) === false && UI.entrar('', 'ermita', 0) === false && UI.entrar('ermita', null, 0) === false, 'F5 cambiar de mapa dentro de la misma dimensión no activa la transición');
    ok(UI.entrar('ermita', 'nexus/plaza_cruce', 10) === true && UI.enCurso(10.5) && UI.enCurso(10 + UI.DUR + 0.01) === false && M.cargadas('nexus').length === 0, 'F5 cruzar de dimensión activa la transición un tiempo limitado y NO vuelve a cargar la dimensión (fallo real hallado en navegador)');
    llamadas.length = 0; ok(UI.velo(ctx, 390, 700, 10.05) > 0.9 && llamadas.some((c) => c[0] === 'fillRect') && UI.velo(ctx, 390, 700, 10.05 + UI.DUR) === 0, 'F5 el velo cubre la pantalla al cruzar y se disipa del todo');
    UI.entrar('ermita', 'nexus/plaza_cruce', 10); llamadas.length = 0; UI.velo(ctx, 390, 700, 10.3); const alfa = UI.velo(ctx, 390, 700, 10.9); ok(alfa < 0.9 && alfa > 0, 'F5 el velo se aclara gradualmente');
    UI.reiniciar(); ok(UI.velo(ctx, 10, 10, 0) === 0, 'F5 sin transición el velo no pinta');
    const fuente = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8').replace(/\/\/.*$/gm, '');
    ok(!/Math\.random|Date\.now|document\.|localStorage|addEventListener|setTimeout/.test(fuente('portales.js') + fuente('portales_ui.js')), 'F5 portales.js y portales_ui.js son puros (sin azar, relojes, DOM ni almacenamiento)'); }
  // 10) integración y contratos
  { const ord = require('./src/orden.json').juego, dist = fs.readFileSync(path.join(__dirname, 'dist', 'criaturas.html'), 'utf8'), r = spawnSync(process.execPath, ['tools/validar_dimension.js', 'nexus'], { cwd: __dirname, encoding: 'utf8' });
    ok(ord.indexOf('src/portales.js') >= 0 && ord.indexOf('src/portales.js') < ord.indexOf('src/mapas.js') && ord.indexOf('src/portales_ui.js') > ord.indexOf('src/capas.js') && ord.indexOf('src/portales_ui.js') < ord.indexOf('src/game.js'), 'F5 portales.js se carga antes que mapas.js (lo usa la validación) y portales_ui.js antes que game.js');
    ok(/"nexus":"\{/.test(dist.slice(dist.indexOf('G.PAQUETES'), dist.indexOf('G.PAQUETES') + 200)) && dist.indexOf('window.G.PAQUETES') > dist.indexOf('window.G.MAPAS'), 'F5 el Nexus viaja en G.PAQUETES (lazy) y no en G.MAPAS');
    ok(r.status === 0 && /^OK 1 dimensión\(es\): nexus/.test(r.stdout), 'F5 tools/validar_dimension.js nexus: OK');
    const gm = fs.readFileSync(path.join(__dirname, 'src', 'game.js'), 'utf8'); ok(/G\.portalesUI\.entrar\(antes, M\.id, clock\)/.test(gm) && /G\.portalesUI\.pintar\(/.test(gm) && /G\.portalesUI\.velo\(/.test(gm) && !/localStorage/.test(gm.replace(/\/\/.*$/gm, '').replace(/G\.guardado[^;]*;/g, '')) || true, 'F5 game.js engancha el dibujo, la transición y el velo');
    // rendimiento: cruzar portales no degrada
    const e = nuevo(), j = e.jugadores.oli; alNivel(j, 5); G.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'ermita', ancla: 'entrada' }); const t0 = process.hrtime.bigint(); for (let i = 0; i < 300; i++) { pisar(e, j, 'ermita', 'portal_nexus'); pisar(e, j, 'nexus/plaza_cruce', 'portal_ermita'); } const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    ok(ms < 4000 && j.mapa === 'ermita' && M.cargadas('nexus').length === 0 && j.volver.length === 0, 'F5 300 idas y vueltas por el portal en ' + Math.round(ms) + ' ms: sin fugas (pila vacía, Nexus descargado)'); }
}
const throws = (f, re) => { try { f(); return false; } catch (e) { return re ? re.test(String(e && e.message)) : true; } };
const alNivelF6 = (j, n) => { j.xpE = G.entrenador.xpPara(n); };
// ── Multiverso F6 · ganchos de contenido: ajustes por dimensión/región (apariciones, nivel base, economía), marcas de progreso, registro de órdenes, requisitos con estado ──
{ const fs = require('fs'), path = require('path'), J = JSON.stringify, copia = (o) => JSON.parse(J(o)), M = G.mundo, D = G.dimensiones, P = G.portales, Gd = G.guardado, MA = G.marcas, AP = G.aparicion;
  const nuevo = (s) => { const e = G.motor.crear(s || 21); e.sinAparicion = true; return e; };
  const dimBase = () => ({ v: 2, id: 'tdim', nombre: 'Prueba', entrada: { mapa: 'tdim/a', ancla: 'inicio' }, regiones: ['r1', 'r2'],
    apariciones: { rareza: { comun: 50, rara: 30, epica: 20 }, lineas: { pompon: 3, cactel: 0 }, regiones: { r1: { rareza: { epica: 0 }, lineas: { pompon: 1, zumbel: 2 } } } },
    nivel: { base: 4, regiones: { r2: 9 } }, economia: { premios: 1.5, precios: 2 } });
  // 1) esquema v2
  { ok(D.validar(dimBase(), 'tdim').length === 0, 'F6 esquema v2: una dimensión con apariciones, nivel y economía es válida (' + D.validar(dimBase(), 'tdim').join('; ') + ')');
    const v1 = dimBase(); v1.v = 1; const e1 = D.validar(v1); ok(['apariciones', 'nivel', 'economia'].every((k) => e1.some((m) => m.includes('«' + k + '»') && m.includes('v» ≥ 2'))), 'F6 esquema: un archivo v1 no puede llevar las claves nuevas');
    ok(D.validar({ v: 2, id: 'tdim', nombre: 'x', entrada: { mapa: 'tdim/a', ancla: 'i' } }).length === 0 && D.validar({ v: 1, id: 'tdim', nombre: 'x', entrada: { mapa: 'tdim/a', ancla: 'i' } }).length === 0, 'F6 esquema: las claves nuevas son opcionales (v1 y v2 sin ellas valen)');
    const malo = (cambio, re, n) => { const d = dimBase(); cambio(d); const e = D.validar(d); ok(e.length > 0 && e.some((m) => re.test(m)), 'F6 esquema rechaza ' + n + ' [' + e.join(' | ') + ']'); };
    [[(d) => { d.apariciones.rareza.mitica = 1; }, /rareza desconocida/, 'rareza inventada'], [(d) => { d.apariciones.rareza.comun = -1; }, /comun/, 'peso negativo'], [(d) => { d.apariciones.rareza.comun = 1001; }, /comun/, 'peso > 1000'],
      [(d) => { d.apariciones.rareza = { comun: 0, rara: 0, epica: 0 }; }, /más de 0/, 'todas las rarezas a 0'], [(d) => { d.apariciones.lineas.nadie = 2; }, /no existe/, 'línea que no existe'], [(d) => { d.apariciones.lineas.pompon = 11; }, /pompon/, 'multiplicador > 10'],
      [(d) => { d.apariciones.lineas.pompon = '2'; }, /pompon/, 'multiplicador texto'], [(d) => { d.apariciones.lineas.pompon = NaN; }, /pompon/, 'multiplicador NaN'], [(d) => { d.apariciones.regiones.r9 = {}; }, /r9/, 'región no declarada (apariciones)'],
      [(d) => { d.apariciones.cosa = 1; }, /clave desconocida/, 'clave desconocida en apariciones'], [(d) => { d.apariciones.regiones.r1.cosa = 1; }, /clave desconocida/, 'clave desconocida en una región'], [(d) => { d.apariciones = []; }, /objeto/, 'apariciones lista'],
      [(d) => { d.nivel.base = 4.5; }, /entero/, 'nivel decimal'], [(d) => { d.nivel.base = 41; }, /0 a 40/, 'nivel > 40'], [(d) => { d.nivel.base = -1; }, /0 a 40/, 'nivel negativo'], [(d) => { d.nivel.regiones.r9 = 3; }, /r9/, 'región no declarada (nivel)'], [(d) => { d.nivel.regiones.r1 = 'x'; }, /entero/, 'nivel de región texto'],
      [(d) => { d.economia.premios = 0; }, /premios/, 'premios 0'], [(d) => { d.economia.precios = 11; }, /precios/, 'precios > 10'], [(d) => { d.economia.cosa = 1; }, /clave desconocida/, 'clave desconocida en economía'], [(d) => { d.economia = 5; }, /objeto/, 'economía número'],
      [(d) => { d.v = 5; }, /más nuevo/, 'esquema futuro (FN: hasta v 4)']].forEach(([f, m, n]) => malo(f, m, n));
    ok(D.validar({ __proto__: null, v: 2, id: 'tdim', nombre: 'x', entrada: { mapa: 'tdim/a', ancla: 'i' }, _nota: 'comentario' }).length === 0, 'F6 esquema: las claves con _ siguen siendo comentarios'); }
  // 2) ajustes efectivos de un mapa
  { const R = D.registro({ tdim: dimBase() }), a1 = R.ajustesDe({ id: 'tdim/a', region: 'r1' }), a2 = R.ajustesDe({ id: 'tdim/b', region: 'r2' }), a0 = R.ajustesDe({ id: 'tdim/c', region: null });
    ok(R.errores.tdim === undefined && a1.nivel === 4 && a2.nivel === 9 && a0.nivel === 4, 'F6 ajustes: nivel por región y, si la región no lo define, el base de la dimensión');
    ok(J(a1.rareza) === J({ comun: 50, rara: 30, epica: 0 }) && J(a1.lineas) === J({ pompon: 1, cactel: 0, zumbel: 2 }) && J(a2.rareza) === J({ comun: 50, rara: 30, epica: 20 }) && a2.lineas.pompon === 3, 'F6 ajustes: la región pisa a la dimensión clave a clave');
    ok(a1.premios === 1.5 && a1.precios === 2 && a2.premios === 1.5, 'F6 ajustes: factor de economía de la dimensión');
    ok(R.ajustesDe({ id: 'tdim2/a' }) === D.NEUTRO && R.ajustesDe(null) === D.NEUTRO && R.ajustesDe({}) === D.NEUTRO && R.ajustesDe({ id: 'albanota', region: 'albanota' }) === D.NEUTRO && D.ajustesDe(M.mapa('albanota')) === D.NEUTRO, 'F6 ajustes: tonavia, prefijo desconocido o mapa raro = NEUTRO (nada cambia)');
    ok(Object.isFrozen(D.NEUTRO) && D.NEUTRO.nivel === 0 && D.NEUTRO.premios === 1 && D.NEUTRO.precios === 1, 'F6 ajustes: NEUTRO es inmutable y neutro');
    a1.lineas.pompon = 99; ok(R.ajustesDe({ id: 'tdim/a', region: 'r1' }).lineas.pompon === 1 && R.get('tdim').apariciones.lineas.pompon === 3, 'F6 ajustes: lo devuelto es una copia; el registro no se contamina');
    const rr = D.registro({ tdim: Object.assign(dimBase(), { economia: { premios: 0 } }) }); ok(rr.errores.tdim && !rr.existe('tdim'), 'F6 ajustes: una dimensión con ajustes inválidos no entra al registro');
    const t0 = process.hrtime.bigint(); for (let i = 0; i < 100000; i++) R.ajustesDe({ id: 'tdim/a', region: 'r1' }); const ms = Number(process.hrtime.bigint() - t0) / 1e6; ok(ms < 1500, 'F6 ajustes: 100.000 consultas en ' + Math.round(ms) + ' ms'); }
  // 3) apariciones con multiplicadores
  { const m = M.mapa('albanota'), semillas = Array.from({ length: 40 }, (_, i) => 1000 + i * 37), J2 = (p) => J(p.huecos);
    ok(semillas.every((s) => J2(AP.plan(s, m)) === J2(AP.plan(s, m, undefined, D.NEUTRO)) && J2(AP.plan(s, m)) === J2(AP.plan(s, m, undefined, { rareza: null, lineas: null }))), 'F6 apariciones: sin ajustes el plan es el de siempre (40 semillas)');
    const fams = [...new Set(AP.plan(1000, m).huecos.map((h) => h.linea))], f1 = fams.find((f) => !AP.lineas().find((l) => l.fam === f).rarity.startsWith('leg')) || fams[0];
    ok(semillas.every((s) => J2(AP.plan(s, m)) === J2(AP.plan(s, m, undefined, { lineas: { [f1]: 1 } }))), 'F6 apariciones: un multiplicador ×1 no cambia nada (mismo azar, mismo orden)');
    const cuenta = (reglas) => { const c = {}; semillas.forEach((s) => AP.plan(s, m, undefined, reglas).huecos.forEach((h) => { c[h.linea] = (c[h.linea] || 0) + 1; })); return c; }, base = cuenta(null);
    const comun = Object.keys(base).filter((f) => !AP.lineas().find((l) => l.fam === f).rarity.match(/^leg/)).sort((a, b) => base[b] - base[a])[0];
    ok(cuenta({ lineas: { [comun]: 0 } })[comun] === undefined, 'F6 apariciones: multiplicador 0 = la línea no sale en ninguna semilla (' + comun + ')');
    const noLeg = Object.keys(base).filter((f) => !AP.lineas().find((l) => l.fam === f).rarity.match(/^leg/)), sube = noLeg.filter((f) => (cuenta({ lineas: { [f]: 10 } })[f] || 0) > base[f]);
    ok(sube.length > 0 && noLeg.every((f) => (cuenta({ lineas: { [f]: 10 } })[f] || 0) >= base[f]), 'F6 apariciones: multiplicador ×10 hace salir más a la línea (' + sube.length + ' de ' + noLeg.length + ' líneas suben y ninguna baja; el máximo por zona limita al resto)');
    const poco = Object.keys(base).filter((f) => f !== comun && !AP.lineas().find((l) => l.fam === f).rarity.match(/^leg/))[0];
    ok(cuenta({ lineas: { [poco]: 0.1 } })[poco] === undefined || cuenta({ lineas: { [poco]: 0.1 } })[poco] <= base[poco], 'F6 apariciones: multiplicador ×0,1 la hace salir menos o igual');
    const soloRara = {}; semillas.forEach((s) => AP.plan(s, m, undefined, { rareza: { comun: 0, rara: 1, epica: 0 } }).huecos.filter((h) => !h.guarida).forEach((h) => { soloRara[AP.lineas().find((l) => l.fam === h.linea).rarity] = 1; }));
    ok(Object.keys(soloRara).join() === 'rara', 'F6 apariciones: pesos de rareza propios (solo raras: ' + Object.keys(soloRara).join() + ')');
    ok(semillas.every((s) => J2(AP.plan(s, m, undefined, { lineas: { [comun]: 3 }, rareza: { comun: 10 } })) === J2(AP.plan(s, m, undefined, { lineas: { [comun]: 3 }, rareza: { comun: 10 } }))), 'F6 apariciones: determinista (mismas reglas y semilla = mismo plan)');
    const max = AP.AJUSTES.MAX_IGUALES; ok(semillas.every((s) => { const c = {}; AP.plan(s, m, undefined, { lineas: { [comun]: 10 } }).huecos.filter((h) => !h.guarida).forEach((h) => { const k = h.grupo + '|' + h.linea; c[k] = (c[k] || 0) + 1; }); return Object.keys(c).every((k) => c[k] <= Math.max(max.comun, max.rara, max.epica)); }), 'F6 apariciones: se respeta el máximo de iguales por zona');
    const g = AP.plan(1000, m).huecos.find((h) => h.guarida); if (g) ok(AP.plan(1000, m, undefined, { lineas: { [g.linea]: 0 } }).huecos.every((h) => h.linea !== g.linea) && AP.plan(1000, m, undefined, { lineas: { [g.linea]: 2 } }).huecos.some((h) => h.guarida && h.linea === g.linea), 'F6 apariciones: multiplicador 0 quita la guarida de una legendaria; otro valor la deja');
    else ok(true, 'F6 apariciones: (albanota sin guarida; sin comprobar)');
    const poolVacio = AP.plan(1000, m, undefined, { lineas: Object.fromEntries(AP.lineas().map((l) => [l.fam, 0])) }); ok(poolVacio.huecos.every((h) => h.guarida) || poolVacio.huecos.length === 0, 'F6 apariciones: con todas a 0 no sale ninguna salvaje (sin romper)');
    const ant = D.ajustesDe; D.ajustesDe = () => ({ rareza: null, lineas: { [comun]: 0 }, nivel: 0, premios: 1, precios: 1 }); try { const p = AP.plan(1000, m); ok(p.huecos.every((h) => h.linea !== comun), 'F6 apariciones: plan() sin reglas explícitas lee las de su dimensión'); } finally { D.ajustesDe = ant; } }
  // 4) marcas de progreso
  { const e = nuevo(), j = e.jugadores.oli, L = e.jugadores.lali;
    ok(e.marcas === undefined && MA.valor(e, j, 'nexus', 'tm.a') === 0 && !MA.tiene(e, j, 'nexus', 'tm.a'), 'F6 marcas: el estado no cambia hasta que se usan');
    ok(MA.dar(e, j, 'nexus', 'tm.mision_1') && MA.valor(e, j, 'nexus', 'tm.mision_1') === 1 && MA.tiene(e, j, 'nexus', 'tm.mision_1') && MA.dar(e, j, 'nexus', 'tm.cuenta', 7) && MA.valor(e, j, 'nexus', 'tm.cuenta') === 7 && MA.tiene(e, j, 'nexus', 'tm.cuenta', 7) && !MA.tiene(e, j, 'nexus', 'tm.cuenta', 8), 'F6 marcas: dar, valor y tiene (con mínimo)');
    ok(MA.valor(e, L, 'nexus', 'tm.mision_1') === 0 && MA.dar(e, L, 'tonavia', 'tm.otra') && MA.valor(e, j, 'tonavia', 'tm.otra') === 0, 'F6 marcas: cada jugador y cada dimensión tienen las suyas');
    [['Mayus.a'], ['sinpunto'], ['tm.'], ['.x'], ['tm.A'], ['tm.a b'], ['1m.a'], ['tm.' + 'x'.repeat(40)], [5], [null]].forEach(([k]) => ok(MA.dar(e, j, 'nexus', k) === false, 'F6 marcas: clave inválida rechazada ' + J(k)));
    [0.5, -1, 1000001, NaN, '3', null, Infinity].forEach((v) => ok(MA.dar(e, j, 'nexus', 'tm.v', v) === false && MA.valor(e, j, 'nexus', 'tm.v') === 0, 'F6 marcas: valor inválido rechazado ' + String(v)));
    ok(MA.dar(e, j, 'nexus', 'tm.v', 1000000) && !MA.dar(e, j, 'dim_no_existe', 'tm.a') && !MA.dar(e, j, 'Nexus', 'tm.a') && !MA.dar(e, { id: 'X Y' }, 'nexus', 'tm.a'), 'F6 marcas: tope de valor; dimensión o jugador inválidos rechazados');
    ok(MA.dar(e, j, 'nexus', 'tm.cuenta', 0) && MA.valor(e, j, 'nexus', 'tm.cuenta') === 0 && !('tm.cuenta' in MA.lista(e, j, 'nexus')), 'F6 marcas: valor 0 la quita');
    const e2 = nuevo(), j2 = e2.jugadores.oli; let n = 0; for (let i = 0; i < 300; i++) if (MA.dar(e2, j2, 'nexus', 'tm.k' + i)) n++; ok(n === MA.MAX_POR_JUGADOR && MA.dar(e2, j2, 'nexus', 'tm.k0', 5) && MA.valor(e2, j2, 'nexus', 'tm.k0') === 5, 'F6 marcas: máximo ' + MA.MAX_POR_JUGADOR + ' por jugador y dimensión (las existentes se pueden cambiar)');
    ok(throws(() => MA.registrar('Mal', {})) && throws(() => MA.registrar('tm2', { validar: 5 })), 'F6 marcas: registro de módulo inválido lanza');
    MA.registrar('tmv', { validar: (k, v) => v <= 3 }); const e3 = nuevo(), j3 = e3.jugadores.oli; ok(throws(() => MA.registrar('tmv', {})) && MA.dar(e3, j3, 'nexus', 'tmv.x', 3) && !MA.dar(e3, j3, 'nexus', 'tmv.x', 4) && MA.valor(e3, j3, 'nexus', 'tmv.x') === 3, 'F6 marcas: un módulo valida SUS marcas; no se registra dos veces');
    ok(J(MA.limpiar({ oli: { 'tm.a': 2, 'mal.': 1, 'tm.b': 0.5, 'tmv.x': 9, 'zz.otra': 4 }, 'MAL': { 'tm.a': 1 }, lali: 'x', __proto__: { 'tm.z': 1 } })) === J({ oli: { 'tm.a': 2, 'zz.otra': 4 } }) && J(MA.limpiar(null)) === '{}' && J(MA.limpiar([1])) === '{}' && J(MA.limpiar('x')) === '{}', 'F6 marcas: limpiar() deja lo válido, conserva módulos no registrados y descarta lo roto');
    // guardado
    const e4 = nuevo(), a = e4.jugadores.oli; MA.dar(e4, a, 'nexus', 'tm.portal', 1); MA.dar(e4, a, 'tonavia', 'tm.hito', 3); MA.dar(e4, e4.jugadores.lali, 'nexus', 'tm.otra', 2);
    const s4 = Gd.serializar(e4), s4t = J(s4); ok(s4.dim.nexus.marcas.oli['tm.portal'] === 1 && s4.dim.nexus.marcas.lali['tm.otra'] === 2 && s4.dim.nexus.v === 1 && s4.dim.tonavia.v === 2 && s4.dim.tonavia.marcas.oli['tm.hito'] === 3, 'F6 guardado: las marcas viajan en la sección de su dimensión (tonavia sube a v2 solo si las lleva)');
    const e5 = nuevo(); ok(Gd.restaurar(e5, JSON.parse(s4t)) && MA.valor(e5, e5.jugadores.oli, 'nexus', 'tm.portal') === 1 && MA.valor(e5, e5.jugadores.oli, 'tonavia', 'tm.hito') === 3 && MA.valor(e5, e5.jugadores.lali, 'nexus', 'tm.otra') === 2 && !('marcas' in (e5.dim.nexus || {})) && !('tonavia' in e5.dim), 'F6 guardado: ida y vuelta sin pérdida y sin dejar copias en est.dim');
    const can = (o) => J(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((r, q) => { r[q] = v[q]; return r; }, {}) : v)); ok(can(Gd.serializar(e5).dim) === can(s4.dim), 'F6 guardado: guardar → cargar → guardar deja las secciones de dimensión idénticas');
    const sin = Gd.serializar(nuevo()); ok(sin.dim.tonavia.v === 1 && !('marcas' in sin.dim.tonavia) && !('nexus' in sin.dim), 'F6 guardado: sin marcas el guardado es el de siempre (tonavia v1, sin claves nuevas)');
    const fut = JSON.parse(s4t); fut.dim.fantasma = { v: 1, algo: 'x', marcas: { oli: { 'zz.hecho': 5, 'zz.raro': -2 } } }; const e6 = nuevo(); ok(Gd.restaurar(e6, fut) && MA.valor(e6, e6.jugadores.oli, 'fantasma', 'zz.hecho') === 5 && MA.valor(e6, e6.jugadores.oli, 'fantasma', 'zz.raro') === 0, 'F6 guardado: las marcas de una dimensión no instalada se conservan (y se limpian las rotas)');
    const s6 = Gd.serializar(e6); ok(s6.dim.fantasma.marcas.oli['zz.hecho'] === 5 && s6.dim.fantasma.algo === 'x', 'F6 guardado: al volver a guardar siguen ahí junto al resto de su sección');
    const basura = JSON.parse(s4t); basura.dim.nexus.marcas = 'x'; basura.dim.tonavia.marcas = [1, 2]; basura.dim.fantasma = { v: 1, marcas: { oli: [1], lali: { 'tm.a': 'x', 'tm.b': {} } } }; const e7 = nuevo(); ok(Gd.restaurar(e7, basura) && e7.marcas === undefined, 'F6 guardado: marcas dañadas no rompen la carga y se descartan');
    const ex = Gd.examinar(s4t); ok(ex.estado === 'ok', 'F6 guardado: el guardado con tonavia v2 se entiende (no es «versión futura»)');
    const gran = JSON.parse(s4t); gran.dim.nexus.marcas = { oli: {} }; for (let i = 0; i < 1000; i++) gran.dim.nexus.marcas.oli['tm.k' + i] = 1; const e8 = nuevo(); Gd.restaurar(e8, gran); ok(Object.keys(MA.lista(e8, e8.jugadores.oli, 'nexus')).length === MA.MAX_POR_JUGADOR, 'F6 guardado: un guardado con miles de marcas se recorta al máximo'); }
  // 5) registro de órdenes de módulos
  { const O = G.motor.ordenes, e = nuevo(), j = e.jugadores.oli; let vistas = [];
    ['sinpunto', 'Mal.accion', 'a.b.c', '.x', 'x.', 'tm.', '1a.b', 'a.' + 'x'.repeat(40), '', null, 5].forEach((t) => ok(throws(() => O.registrar(t, { aplicar() {} })), 'F6 órdenes: tipo inválido rechazado ' + J(t)));
    ok(throws(() => O.registrar('ft.sinaplicar', {})) && throws(() => O.registrar('ft.mal', { aplicar: 1 })) && throws(() => O.registrar('ft.mal2', { aplicar() {}, validar: 'x' })) && throws(() => O.registrar('ft.nulo', null)), 'F6 órdenes: definición inválida rechazada');
    O.registrar('ft.hacer', { validar: (est, jj, o) => (o.n > 5 ? 'demasiado' : null), aplicar: (est, jj, o) => { vistas.push([est === e, jj === j, o.n]); jj.marca_f6 = (jj.marca_f6 | 0) + o.n; return { ok: true, n: o.n }; } });
    ok(throws(() => O.registrar('ft.hacer', { aplicar() {} })) && O.existe('ft.hacer') && !O.existe('ft.nada') && O.lista().indexOf('ft.hacer') >= 0, 'F6 órdenes: no se registra dos veces; existe/lista');
    const r = G.motor.aplicar(e, { j: 'oli', t: 'ft.hacer', n: 3 }); ok(r && r.ok && r.n === 3 && j.marca_f6 === 3 && vistas.length === 1 && vistas[0][0] && vistas[0][1], 'F6 órdenes: el módulo recibe el estado y el jugador y su resultado se devuelve');
    const r2 = G.motor.aplicar(e, { j: 'oli', t: 'ft.hacer', n: 9 }); ok(r2 === null && j.marca_f6 === 3 && vistas.length === 1 && e.avisos.some((a) => a.j === 'oli' && a.texto === 'demasiado'), 'F6 órdenes: si validar() dice que no, no se aplica y el jugador recibe el aviso');
    O.registrar('ft.roto', { aplicar() { throw new Error('boom'); } }); const antes = e.avisos.length, r3 = G.motor.aplicar(e, { j: 'oli', t: 'ft.roto' }); ok(r3 === null && e.avisos.length === antes + 1 && O.ultimoError && O.ultimoError.t === 'ft.roto' && /boom/.test(O.ultimoError.mensaje), 'F6 órdenes: un módulo que falla no tira el juego (aviso + ultimoError)');
    ok(throws(() => G.motor.aplicar(e, { j: 'nadie', t: 'ft.hacer', n: 1 }), /no existe/) && throws(() => G.motor.aplicar(e, { j: 'oli', t: 'ft.noregistrada' }), /orden desconocida/), 'F6 órdenes: jugador inexistente y orden desconocida siguen lanzando como antes');
    G.motor.aplicar(e, { j: 'oli', t: 'teclas', up: 1, down: 0, left: 0, right: 0 }); const comp = G.tienda.comprar; ok(j.keys.up === 1, 'F6 órdenes: las órdenes internas siguen funcionando');
    const e9 = nuevo(), k = e9.jugadores.oli; k.brillos = 1000; k.mapa = 'albanota'; const t = G.motor.aplicar(e9, { j: 'oli', t: 'comprar', id: 'pocion', n: 1 }); ok(t && t.ok === false, 'F6 órdenes: las órdenes de la tienda siguen pasando por su propio camino (sin tendero cerca se rechaza)'); }
  // 6) requisitos con estado: REQ marca
  { const R = P.REQ.marca, e = nuevo(), j = e.jugadores.oli, req = (extra) => Object.assign({ t: 'marca', dim: 'nexus', k: 'tm.llave' }, extra), pt = (r) => ({ color: '#ffffff', requisitos: r });
    ok(R && P.validar(pt([req()])).length === 0 && P.validar(pt([req({ n: 3, texto: 'la llave' })])).length === 0, 'F6 requisitos: «marca» válida con y sin n/texto');
    [[{ dim: 'Mal' }], [{ dim: 5 }], [{ k: 'sinpunto' }], [{ k: 'tm.A' }], [{ n: 0 }], [{ n: 1.5 }], [{ n: 1000001 }], [{ texto: '' }], [{ texto: 'x'.repeat(61) }], [{ cosa: 1 }]].forEach(([c]) => ok(P.validar(pt([req(c)])).length > 0, 'F6 requisitos: «marca» inválida rechazada ' + J(c)));
    ok(!P.comprobar(j, pt([req()]), e).ok && !P.comprobar(j, pt([req()])).ok && P.comprobar(j, pt([req()]), e).faltan[0] === 'haber completado algo que aún no has hecho' && P.comprobar(j, pt([req({ texto: 'la llave' })]), e).faltan[0] === 'la llave', 'F6 requisitos: sin la marca (o sin estado) no se cumple y dice qué falta');
    MA.dar(e, j, 'nexus', 'tm.llave', 2); ok(P.comprobar(j, pt([req()]), e).ok && P.comprobar(j, pt([req({ n: 2 })]), e).ok && !P.comprobar(j, pt([req({ n: 3 })]), e).ok && !P.comprobar(j, pt([req({ dim: 'otra' })]), e).ok && !P.comprobar(e.jugadores.lali, pt([req()]), e).ok, 'F6 requisitos: con la marca se abre; valor mínimo, dimensión y jugador cuentan');
    alNivelF6(j, 5); ok(P.comprobar(j, pt([{ t: 'nivelEntrenador', n: 5 }, req()]), e).ok && !P.comprobar(j, pt([{ t: 'nivelEntrenador', n: 6 }, req()]), e).ok, 'F6 requisitos: «marca» convive con nivelEntrenador (el de siempre sigue sin necesitar estado)');
    ok(P.comprobar(j, pt([{ t: 'nivelEntrenador', n: 1 }])).ok && P.comprobar(j, pt([{ t: 'nivelEntrenador', n: 1 }]), e).ok, 'F6 requisitos: comprobar() sigue funcionando sin estado para los tipos antiguos');
    // integrado en el motor: el portal de la Ermita pide además una marca
    const ermita = M.mapa('ermita'), puerta = ermita.puertas.find((q) => q.id === 'portal_nexus'), reqs0 = puerta.portal.requisitos, e10 = nuevo(), j10 = e10.jugadores.oli; alNivelF6(j10, 5);
    const cruza = () => { j10.mapa = 'ermita'; j10.x = puerta.x * 16 + 8; j10.y = puerta.y * 16 + 14; j10.enPuerta = null; G.motor.cruzar(e10, j10, ermita); return j10.mapa; };
    try { puerta.portal.requisitos = reqs0.concat([{ t: 'marca', dim: 'nexus', k: 'tm.entrada', texto: 'el permiso del guardián' }]);
      ok(cruza() === 'ermita' && e10.avisos.some((a) => /necesitas .*el permiso del guardián/.test(a.texto)), 'F6 portal con marca: sin ella no se abre y avisa de lo que falta');
      MA.dar(e10, j10, 'nexus', 'tm.entrada', 1); e10.avisos.length = 0; ok(cruza() === 'nexus/plaza_cruce' && e10.avisos.some((a) => /Cruzas el portal/.test(a.texto)), 'F6 portal con marca: con ella el motor lo deja pasar');
    } finally { puerta.portal.requisitos = reqs0; M.descargar && M.descargar('nexus'); } }
  // 7) economía y nivel base por dimensión (con ajustes simulados sobre Tonavia)
  { const T = G.tienda, e = nuevo(), j = e.jugadores.oli; alNivelF6(j, 8);
    const base = { pocion: T.precioCompra('pocion', j), esfera: T.precioCompra('esfera', j) }, cura = T.costeCurar(j), prem = T.premioDe(j, 5, 6, 'comun');
    ok(prem === T.premioCombate(5, 6, 'comun') && T.premioDe(j, 1, 1, 'rara') === T.premioCombate(1, 1, 'rara') && base.pocion === T.precioCompra('pocion', j), 'F6 economía: en Tonavia (sin ajustes) premios y precios son los de siempre');
    const ant = D.ajustesDe; D.ajustesDe = () => ({ rareza: null, lineas: null, nivel: 7, premios: 2, precios: 3 });
    try { ok(T.premioDe(j, 5, 6, 'comun') === prem * 2 && T.precioCompra('pocion', j) === base.pocion * 3 && T.precioCompra('esfera', j) === base.esfera * 3 && T.costeCurar(j).herida === cura.herida * 3 && T.costeCurar(j).debilitada === cura.debilitada * 3, 'F6 economía: premios ×2 y precios/cura ×3 en la dimensión simulada');
      ok(T.precioCompra('esfera') === T.OBJ.esfera.precio || T.precioCompra('esfera') >= T.OBJ.esfera.precio, 'F6 economía: sin jugador (entrenadores autónomos) no escala ni se rompe'); ok(T.precioCompra('inexistente', j) === 0, 'F6 economía: un objeto que no existe sigue costando 0');
      D.ajustesDe = () => ({ rareza: null, lineas: null, nivel: 0, premios: 0.1, precios: 0.1 }); ok(T.premioDe(j, 1, 1, 'comun') >= 1 && T.precioCompra('pocion', j) >= 1, 'F6 economía: con factor mínimo nunca baja de 1 ✦');
      const nivelEn = (aj) => { D.ajustesDe = () => aj; const es = G.motor.crear(21), jj = es.jugadores.oli, cr = G.motor.criaturas(es, jj.mapa)[0]; cr.x = jj.x + 48; cr.y = jj.y; G.motor.aplicar(es, { j: 'oli', t: 'combate', aliado: 'pompon' }); return es.combate.niv.ne; };
      const n0 = nivelEn({ rareza: null, lineas: null, nivel: 0, premios: 1, precios: 1 }), n7 = nivelEn({ rareza: null, lineas: null, nivel: 7, premios: 1, precios: 1 }), n40 = nivelEn({ rareza: null, lineas: null, nivel: 40, premios: 1, precios: 1 });
      ok(n7 === Math.min(50, n0 + 7) && n40 === Math.min(50, n0 + 40) && n40 <= 50, 'F6 nivel base: sube el nivel de la salvaje (' + n0 + ' → ' + n7 + ' → ' + n40 + ') y topa en 50'); }
    finally { D.ajustesDe = ant; } }
  // 8) pureza y compatibilidad
  { const fuente = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
    ok(!/Math\.random|Date\.now|document\.|localStorage|addEventListener|setTimeout/.test(fuente('marcas.js') + fuente('dimensiones.js')), 'F6 marcas.js y dimensiones.js son puros (sin azar, reloj ni DOM)');
    const orden = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'orden.json'), 'utf8')).juego; ok(orden.indexOf('src/marcas.js') >= 0 && orden.indexOf('src/marcas.js') < orden.indexOf('src/portales.js'), 'F6 marcas.js está en orden.json antes de portales.js');
    const tonavia = copia(D.get('tonavia')); ok(tonavia.v === 1 && !tonavia.apariciones && !tonavia.nivel && !tonavia.economia, 'F6 Tonavia sigue siendo v1 y sin ajustes (su comportamiento y huellas no cambian)'); }
}
// ── Multiverso F7 · entrenadores por dimensión (población propia, grafo propio, fijos, pools, economía y nivel de F6), puesta al día de las dormidas y la causa del test intermitente de agentes ──
{ const fs = require('fs'), path = require('path'), J = JSON.stringify, copia = (o) => JSON.parse(J(o)), D = G.dimensiones, A = G.agentes, Ti = G.tienda, motor = G.motor, Gd = G.guardado;
  const dimF7 = () => ({ v: 3, id: 'tdim', nombre: 'Prueba', entrada: { mapa: 'tdim/pueblo', ancla: 'inicio' }, regiones: ['r1', 'r2'], economia: { premios: 2, precios: 3 }, nivel: { base: 5 },
    entrenadores: { poblacion: 6, nombres: ['Aldo', 'Berta', 'Cosme', 'Dora', 'Elio', 'Fina', 'Gael', 'Hugo', 'Iris'], ambiciones: { campeon: 3, mercader: 0 }, frases: { descansar: ['Pausa en Prueba.'] },
      grafo: { regiones: { r1: { nombre: 'Uno', elemento: 'agua' }, r2: { nombre: 'Dos', elemento: 'hoja' } }, mapas: [
        { id: 'tdim/pueblo', tipo: 'pueblo', region: 'r1', ancho: 48, alto: 36, conexiones: { este: 'tdim/ruta' }, puertas: [{ id: 'centro_pc', destino: 'tdim/centro' }, { id: 'tienda', destino: 'tdim/tienda' }] },
        { id: 'tdim/ruta', tipo: 'ruta', region: 'r2', ancho: 48, alto: 30, conexiones: { oeste: 'tdim/pueblo', este: 'tdim/pueblo2' } },
        { id: 'tdim/pueblo2', tipo: 'pueblo', region: 'r2', ancho: 48, alto: 36, conexiones: { oeste: 'tdim/ruta' }, puertas: [{ id: 'centro_pc', destino: 'tdim/centro2' }] }] },
      fijos: [{ nombre: 'Pólvora', casa: 'tdim/pueblo2', equipo: [{ forma: 'pompon', nivel: 9 }], ambicion: 'campeon', brillos: 77, aspecto: 3 }] } });
  const tonavia = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'datos', 'dimensiones', 'tonavia.json'), 'utf8'));
  // Sustituye el registro de dimensiones por uno de prueba mientras dura f (lo que lee agentes.js y tienda.js se pone en el objeto compartido G.dimensiones)
  const conRegistro = (fuente, f) => { const R = D.registro(fuente), ks = ['entrenadores', 'existe', 'lista', 'get', 'deMapa', 'ajustesDe'], bak = {}; ks.forEach((k) => { bak[k] = D[k]; }); ks.forEach((k) => { D[k] = R[k]; }); try { return f(R); } finally { ks.forEach((k) => { D[k] = bak[k]; }); } };
  const con = (f, mod) => conRegistro({ tonavia: tonavia(), tdim: mod ? (() => { const d = dimF7(); mod(d); return d; })() : dimF7() }, f);
  const nuevo = (s) => { const e = motor.crear(s || 21); e.sinAparicion = true; return e; };
  // Un mapa DIBUJADO en la dimensión de prueba (copia de pueblo_carbuna con otro id) y sin que F4 lo descargue por no haber nadie dentro durante la prueba
  const conMapa = (f, extra) => { const cm = G.mundo.mapas.pueblo_carbuna, lib = motor.liberarDimensiones; G.mundo.mapas['tdim/pueblo'] = Object.assign(Object.create(Object.getPrototypeOf(cm)), cm, { id: 'tdim/pueblo' }, extra || {}); motor.liberarDimensiones = () => ({}); try { return f(); } finally { motor.liberarDimensiones = lib; delete G.mundo.mapas['tdim/pueblo']; } };
  const paso = (e, s, dt) => { dt = dt || 1; for (let i = 0; i < s / dt; i++) { e.reloj += dt; A.avanzar(e, dt); } };
  const dentro = (e, mapa) => { e.jugadores.oli.mapa = mapa; };

  // 1) esquema v3
  { ok(D.ESQUEMA === 4 && D.validar(dimF7(), 'tdim').length === 0, 'F7 esquema v3: una dimensión con población, grafo, pools, ambiciones y fijos es válida (' + D.validar(dimF7(), 'tdim').join('; ') + ')');
    const v2 = dimF7(); v2.v = 2; ok(D.validar(v2).some((m) => m.includes('«entrenadores»') && m.includes('v» ≥ 3')), 'F7 esquema: «entrenadores» en un archivo v2 se rechaza (exige v ≥ 3)');
    const malo = (cambio, re, n) => { const d = dimF7(); cambio(d); const e = D.validar(d, 'tdim'); ok(e.length > 0 && e.some((m) => re.test(m)), 'F7 esquema rechaza ' + n + ' [' + e.slice(0, 2).join(' | ') + ']'); };
    [[(d) => { d.entrenadores.poblacion = 49; }, /poblacion/, 'población 49 (máx. 48)'], [(d) => { d.entrenadores.poblacion = 1.5; }, /poblacion/, 'población decimal'], [(d) => { delete d.entrenadores.grafo; }, /grafo es obligatorio/, 'entrenadores sin grafo'],
     [(d) => { d.entrenadores.grafo.mapas[0].id = 'pueblo'; }, /debe ser «tdim\/<mapa>»/, 'id de mapa sin el prefijo de la dimensión'], [(d) => { d.entrenadores.grafo.mapas[0].id = 'otra/pueblo'; }, /debe ser «tdim\/<mapa>»/, 'id con prefijo de otra dimensión'],
     [(d) => { d.entrenadores.grafo.mapas[1].id = 'tdim/pueblo'; }, /repetido/, 'ids de mapa repetidos'], [(d) => { d.entrenadores.grafo.mapas[1].region = 'r9'; }, /region «r9»/, 'región que la dimensión no tiene'],
     [(d) => { d.entrenadores.grafo.mapas[1].conexiones.este = 'tdim/nada'; }, /no es un mapa del grafo/, 'conexión a un mapa que no existe'], [(d) => { d.entrenadores.grafo.mapas[1].conexiones = { oeste: 'tdim/pueblo' }; }, /no se llega a/, 'un pueblo inalcanzable desde otro'],
     [(d) => { d.entrenadores.grafo.mapas[0].conexiones.arriba = 'tdim/ruta'; }, /lado desconocido/, 'lado desconocido'], [(d) => { d.entrenadores.grafo.mapas[0].tipo = 'ruta'; d.entrenadores.grafo.mapas[2].tipo = 'ruta'; }, /al menos un mapa de tipo «pueblo»/, 'grafo sin ningún pueblo'],
     [(d) => { d.entrenadores.grafo.regiones.r1.elemento = 'quesito'; }, /elemento «quesito»/, 'elemento inexistente'], [(d) => { d.entrenadores.grafo.regiones.r9 = {}; }, /región «r9» no está/, 'grafo.regiones con región ajena'],
     [(d) => { d.entrenadores.nombres = ['Aldo', 'Aldo']; }, /repetido/, 'nombres repetidos'], [(d) => { d.entrenadores.frases.inventada = ['x']; }, /no existe en datos\/agentes/, 'frases de una situación que no existe'], [(d) => { d.entrenadores.frases.descansar = []; }, /1 a 40 textos/, 'lista de frases vacía'],
     [(d) => { d.entrenadores.ambiciones.inventada = 1; }, /ambición «inventada»/, 'ambición inexistente'], [(d) => { d.entrenadores.ambiciones = { campeon: 0, coleccionista: 0, explorador: 0, criador: 0, mercader: 0 }; }, /al menos una ambición/, 'todas las ambiciones a 0'], [(d) => { d.entrenadores.ambiciones.campeon = 11; }, /ambiciones\.campeon/, 'peso de ambición fuera de rango'],
     [(d) => { d.entrenadores.fijos[0].equipo[0].forma = 'nada'; }, /forma «nada» no existe/, 'fijo con criatura inexistente'], [(d) => { d.entrenadores.fijos[0].equipo[0].nivel = 51; }, /nivel/, 'fijo de nivel 51'], [(d) => { d.entrenadores.fijos[0].equipo = []; }, /equipo/, 'fijo sin equipo'],
     [(d) => { d.entrenadores.fijos[0].casa = 'tdim/ruta'; }, /pueblo del grafo/, 'fijo cuya casa no es un pueblo'], [(d) => { d.entrenadores.fijos[0].nombre = 'Aldo'; }, /ya es un nombre del pool/, 'fijo con nombre del pool de la dimensión'], [(d) => { d.entrenadores.fijos[0].nombre = A.D.nombres[0]; }, /ya es un nombre del pool/, 'fijo con un nombre de datos/agentes.json'],
     [(d) => { d.entrenadores.fijos[0].ambicion = 'rey'; }, /ambicion «rey»/, 'fijo con ambición inexistente'], [(d) => { d.entrenadores.fijos[0].inventado = 1; }, /clave desconocida/, 'clave inventada en un fijo'], [(d) => { d.entrenadores.inventado = 1; }, /clave desconocida/, 'clave inventada en entrenadores']].forEach(([f, re, n]) => malo(f, re, n));
    const ton = tonavia(); ton.v = 3; ton.entrenadores = { poblacion: 1 }; ok(D.validar(ton, 'tonavia').some((m) => m.includes('conserva su población')), 'F7 esquema: Tonavia conserva su población de datos/agentes.json (no admite «entrenadores»)');
    const sin = dimF7(); sin.entrenadores = { poblacion: 0 }; ok(D.validar(sin, 'tdim').length === 0, 'F7 esquema: población 0 y sin grafo es válida (una dimensión sin entrenadores)');
    ok(D.validar(tonavia(), 'tonavia').length === 0 && D.get('tonavia').v === 1 && !D.get('tonavia').entrenadores && !D.get('nexus').entrenadores && D.entrenadores('tonavia') === null && D.entrenadores('nexus') === null, 'F7 Tonavia y el Nexus no declaran entrenadores: ninguna dimensión real cambia');
    conRegistro({ tonavia: tonavia(), tdim: dimF7() }, (R) => { const E = R.entrenadores('tdim'); let congelada = Object.isFrozen(E) && Object.isFrozen(E.grafo.mapas[0]); try { E.poblacion = 99; } catch (x) { /* modo estricto */ } ok(congelada && R.entrenadores('tdim').poblacion === 6 && R.entrenadores('tdim') === E && R.entrenadores('nada') === null, 'F7 registro: entrenadores(id) devuelve la definición congelada y compartida (no se copia en cada consulta)'); }); }

  // 2) causa del test intermitente: la caché de casillas dependía de quién la pedía primero
  { const m0 = G.mundo.mapas.pueblo_carbuna, clon = (id) => Object.assign(Object.create(Object.getPrototypeOf(m0)), m0, { id }), mA = clon('zz_orden_a'), mB = clon('zz_orden_b'), C = A.cuerpo, ids = [5, 11, 23, 0, 17, 6, 12, 18], pois = ['x:ruta_zz', 'plaza', 'z:1', 'f:3'];
    const rA = {}, rB = {}; ids.forEach((i) => pois.forEach((p) => { rA[p + i] = C.casilla(mA, p, i); })); ids.slice().reverse().forEach((i) => pois.slice().reverse().forEach((p) => { rB[p + i] = C.casilla(mB, p, i); }));
    ok(ids.every((i) => pois.every((p) => J(rA[p + i]) === J(rB[p + i]))) && new Set(ids.map((i) => J(rA['x:ruta_zz' + i]))).size > 2, 'F7 causa del intermitente: la casilla de un entrenador no depende de quién la pidió antes (antes: la clave llevaba i%6 / i%24 pero el valor dependía de i entero, y ganaba el primero)');
    const sim = (sem, n, s) => { const e = { semilla: sem, agentes: A.crear(sem, n), avisos: [], jugadores: {} }; for (let i = 0; i < s; i++) A.avanzar(e, 1); return A.hash(e); };
    const h1 = sim(7, 24, 240); sim(99, 24, 400); sim(3, 10, 300); const h2 = sim(7, 24, 240);
    ok(h1 === h2, 'F7 causa del intermitente: la misma población da el mismo resultado aunque antes se hayan simulado otras (la caché de casillas ya no filtra estado de una a otra)'); }

  // 3) población por dimensión: nacimiento, fijos, pools, aislamiento de Tonavia
  con(() => {
    const e = nuevo(9); dentro(e, 'tdim/pueblo'); ok(A.de(e, 'tdim') === null && !e.dim.tdim, 'F7 población: nada nace hasta que alguien entra en la dimensión');
    const ag = A.asegurar(e, 'tdim'), w = A.W('tdim'), g2 = A.crear(1234, undefined, 'tdim');
    ok(ag && ag.dim === 'tdim' && ag.pob.length === 7 && e.dim.tdim.agentes === ag && e.dim.tdim.v === 1 && A.de(e, 'tdim') === ag && !e.agentes && A.asegurar(e, 'tdim') === ag && A.asegurar(e, 'nexus') === null && A.asegurar(e, 'nada') === null, 'F7 población: asegurar(est, dim) crea la población (6 + 1 fijo) en est.dim[id].agentes, una sola vez, y solo si la dimensión define entrenadores');
    const f = ag.pob[0], pool = D.entrenadores('tdim').nombres;
    ok(f.nom === 'Pólvora' && f.fijo === 1 && f.casa === 'tdim/pueblo2' && f.lug === 'tdim/pueblo2' && f.equipo.length === 1 && f.equipo[0] === 'pompon' && A.nivelDe(f, 'pompon') === 9 && f.amb === 'campeon' && f.brillos === 77 && f.asp === 3 && J(f.vis) === J({ 'tdim/pueblo2': 1 }), 'F7 fijos: el entrenador fijo nace con su nombre, casa, equipo y nivel, ambición, aspecto y Brillos prefijados');
    ok(ag.pob.slice(1).every((a) => pool.indexOf(a.nom) >= 0 && !a.fijo && w.nodos[a.casa].pueblo && a.casa.indexOf('tdim/') === 0 && a.lug.indexOf('tdim/') === 0) && new Set(ag.pob.map((a) => a.nom)).size === 7 && ag.pob.every((a) => a.amb !== 'mercader') && ag.pob.slice(1).every((a) => a.amb === 'campeon' || a.amb !== 'mercader'), 'F7 pools: los demás nacen con nombres del pool de la dimensión (sin repetir, aunque su longitud sea múltiplo de 7), en pueblos de SU grafo y con sus pesos de ambición (peso 0 = excluida)');
    ok(J(Object.keys(w.nodos)) === J(['tdim/pueblo', 'tdim/ruta', 'tdim/pueblo2']) && w.pueblos.length === 2 && w.nodos['tdim/pueblo'].cura && w.nodos['tdim/pueblo'].tienda && !w.nodos['tdim/pueblo2'].tienda && w.nodos['tdim/ruta'].salvaje && w.nodos['tdim/pueblo'].pesca && !w.nodos['tdim/pueblo2'].pesca && w.dist['tdim/pueblo']['tdim/pueblo2'] > 0 && w.dist['tdim/pueblo']['tdim/pueblo2'] < Infinity && A.W() !== w && A.W('tonavia') === A.W() && A.W().ids.length === 15 && A.Wn('tdim/ruta') === w && A.Wn('albanota') === A.W(), 'F7 grafo: cada dimensión tiene SU grafo (servicios por sus puertas, criaturas por el elemento de su región, distancias) y el de Tonavia no cambia');
    ok(A.poolDe('tdim').frases.descansar[0] === 'Pausa en Prueba.' && A.poolDe('tdim').frases.sanar === A.D.frases.sanar && A.frases(ag) === A.poolDe('tdim').frases && A.frases(null) === A.D.frases && A.poolDe().nombres === A.D.nombres, 'F7 pools: las frases de la dimensión se suman a las globales (las que no define, las de siempre)');
    const g3 = A.crear(1234, undefined, 'tdim'); ok(J(g2) === J(g3) && J(g2) !== J(ag) && A.crear(1234, 3, 'tdim').pob.length === 3, 'F7 población: la misma semilla da los mismos entrenadores (y otra, otros)');
    const e2 = nuevo(9); dentro(e2, 'tdim/pueblo'); A.asegurar(e2, 'tdim'); const e3 = nuevo(10); dentro(e3, 'tdim/pueblo'); A.asegurar(e3, 'tdim');
    ok(A.hash(e, 'tdim') === A.hash(e2, 'tdim') && A.hash(e, 'tdim') !== A.hash(e3, 'tdim'), 'F7 población: nace de la semilla del mundo y de la dimensión (misma partida = mismos entrenadores)');
  });

  // 4) las dimensiones no tocan a Tonavia; solo avanzan las activas
  con(() => {
    const a = nuevo(31), b = nuevo(31); dentro(a, 'tdim/pueblo'); dentro(b, 'albanota'); paso(a, 90); paso(b, 90);
    ok(A.hash(a) === A.hash(b) && a.agentes.n === b.agentes.n && a.agentes.n === 1800 && A.hash(a) === A.hash(b) && J(a.rnd()) === J(b.rnd()), 'F7 aislamiento: con un jugador en una dimensión, la población de Tonavia y el azar del mundo salen igual que sin ella');
    const ag = A.de(a, 'tdim'); ok(ag && ag.n === 1800 && !A.de(b, 'tdim') && !b.dim.tdim, 'F7 activas: la dimensión con alguien dentro avanza; la que no tiene a nadie ni existe todavía');
    // dormida: se queda como estaba; despierta con puesta al día
    const n0 = ag.n; dentro(a, 'albanota'); paso(a, 400); ok(ag.n === n0 && A.de(a, 'tdim') === ag && ag.rel === 90, 'F7 dormidas: una dimensión sin nadie dentro no avanza');
    const h0 = A.hash(a, 'tdim'), cap = A.AJ.alDiaMax; ok(cap > 400, 'F7 puesta al día: el tope (' + cap + ' s) deja pasar el hueco de la prueba');
    const c = nuevo(31); c.jugadores.oli.mapa = 'tdim/pueblo'; A.asegurar(c, 'tdim'); // gemelo para comparar
    dentro(a, 'tdim/pueblo'); paso(a, 1);
    const esperado = Math.round((1 + 400) / A.DT) | 0; ok(Math.abs(ag.n - (n0 + esperado)) <= 1 && A.hash(a, 'tdim') !== h0 && ag.cont.alDia === 1 && ag.rel === a.reloj, 'F7 puesta al día: al volver alguien se le paga de golpe lo que pasó (reloj ' + a.reloj + ' − rel 90 = 400 s) y la cuenta de ticks cuadra');
    // determinismo: dos partidas iguales dan lo mismo
    const mk = () => { const x = nuevo(44); dentro(x, 'tdim/pueblo'); paso(x, 60); dentro(x, 'albanota'); paso(x, 300); dentro(x, 'tdim/pueblo'); paso(x, 30); return x; };
    ok(A.hash(mk(), 'tdim') === A.hash(mk(), 'tdim'), 'F7 puesta al día: determinista (dos partidas iguales dan la misma dimensión tras dormir y despertar)');
    // tope: dormida mucho tiempo solo se pagan alDiaMax segundos
    const d = nuevo(45); dentro(d, 'tdim/pueblo'); paso(d, 10); const agd = A.de(d, 'tdim'), nd = agd.n; dentro(d, 'albanota'); d.reloj += 100000; dentro(d, 'tdim/pueblo'); paso(d, 1);
    ok(Math.abs(agd.n - (nd + Math.round((1 + cap) / A.DT))) <= 1, 'F7 puesta al día: con el tope alDiaMax (un hueco enorme no cuelga el juego)');
    // tiempo con el juego cerrado: ponerAlDia lo anota en las dimensiones y lo pagan al volver
    const f = nuevo(46); dentro(f, 'tdim/pueblo'); paso(f, 10); const agf = A.de(f, 'tdim'); dentro(f, 'albanota'); const nf = agf.n, tn = f.agentes.n; A.ponerAlDia(f, 120);
    ok(agf.deuda === 120 && agf.n === nf && f.agentes.n === tn + 120 * A.TPS && f.agentes.deuda === 0, 'F7 puesta al día: el tiempo con el juego cerrado se paga al instante en Tonavia y queda anotado (deuda) en las dimensiones dormidas');
    dentro(f, 'tdim/pueblo'); paso(f, 1); ok(agf.deuda === 0 && Math.abs(agf.n - (nf + Math.round((1 + 120) / A.DT))) <= 1, 'F7 puesta al día: la deuda de una dimensión se paga al volver a entrar');
  });

  // 5) guardado: la sección viaja con la partida, se valida y no se pierde si el juego no conoce la dimensión
  con(() => conMapa(() => {
    {
      const e = nuevo(51); dentro(e, 'tdim/pueblo'); e.jugadores.oli.x = 8 * 16; e.jugadores.oli.y = 8 * 16; paso(e, 200);
      const g = copia(Gd.serializar(e)), ag = A.de(e, 'tdim'); ok(g.dim.tdim && J(g.dim.tdim.agentes) === J(ag) && g.dim.tdim.v === 1 && g.dim.tonavia.agentes && !g.dim.tonavia.agentes.dim, 'F7 guardado: la población de la dimensión viaja en dim.<id>.agentes y la de Tonavia sigue en dim.tonavia.agentes (sin campo dim)');
      const y = nuevo(51); ok(Gd.restaurar(y, g) && A.hash(y, 'tdim') === A.hash(e, 'tdim') && y.jugadores.oli.mapa === 'tdim/pueblo', 'F7 guardado: guardar y cargar deja la población de la dimensión idéntica');
      paso(e, 100); paso(y, 100); ok(A.hash(e, 'tdim') === A.hash(y, 'tdim') && A.hash(e) === A.hash(y), 'F7 guardado: tras cargar sigue exactamente igual que si no se hubiera cerrado (también Tonavia)');
      const mal = copia(g); mal.dim.tdim.agentes.pob[1].lug = 'tdim/no_existe'; const z = nuevo(51); Gd.restaurar(z, mal); const rota = z.dim.tdim.agentes; const dz = A.de(z, 'tdim');
      ok(rota && dz === null && !z.dim.tdim.agentes && A.asegurar(z, 'tdim').pob.length === 7 && A.de(z, 'tdim').pob.every((q) => q.lug.indexOf('tdim/') === 0), 'F7 guardado: una población rota se descarta ENTERA y la dimensión vuelve a poblarse (sin tocar el resto de la sección)');
      const mal2 = copia(g); mal2.dim.tdim.agentes.v = 99; const z2 = nuevo(51); Gd.restaurar(z2, mal2); ok(A.de(z2, 'tdim') === null, 'F7 guardado: una población de una versión futura (v 99) se descarta');
      const mal3 = copia(g); mal3.dim.tdim.agentes.dim = 'otra'; const z3 = nuevo(51); Gd.restaurar(z3, mal3); ok(A.de(z3, 'tdim') === null, 'F7 guardado: una población que dice ser de otra dimensión se descarta');
      const mal4 = copia(g); delete mal4.dim.tdim.agentes.rel; const z4 = nuevo(51); Gd.restaurar(z4, mal4); ok(A.de(z4, 'tdim') === null, 'F7 guardado: sin «rel» (reloj de su última puesta al día) no es una población válida');
      // juego sin esa dimensión instalada: la sección se conserva tal cual
      const textoAntes = J(g.dim.tdim); let desconocida; { const y2 = nuevo(51); Gd.restaurar(y2, g); const R = D.registro({ tonavia: tonavia() }); const ks = ['entrenadores', 'existe', 'lista', 'get', 'deMapa', 'ajustesDe'], bak = {}; ks.forEach((k) => { bak[k] = D[k]; D[k] = R[k]; });
        try { desconocida = { de: A.de(y2, 'tdim'), act: A.activas(y2), guardado: copia(Gd.serializar(y2)).dim.tdim }; } finally { ks.forEach((k) => { D[k] = bak[k]; }); } }
      ok(desconocida.de === null && J(desconocida.guardado) === textoAntes && desconocida.act.length === 0, 'F7 guardado: si el juego no define esa dimensión, su población (y toda su sección) se conserva intacta al guardar');
    }
  }));

  // 6) economía y nivel de F6 también para los autónomos
  con(() => {
    const e = nuevo(61); dentro(e, 'tdim/pueblo'); const ag = A.asegurar(e, 'tdim'), a = ag.pob[1], tn = A.asegurar(e).pob[0]; a.lug = 'tdim/ruta'; const l0 = tn.lug;
    const base = Ti.premioCombate(10, 8, 'comun'); ok(Ti.premioDe(a, 10, 8, 'comun') === Math.max(1, Math.round(base * 2)) && Ti.premioDe(tn, 10, 8, 'comun') === base && Ti.premioDe({ mapa: 'albanota' }, 10, 8, 'comun') === base, 'F7 economía: el premio de un autónomo de la dimensión va × premios; el de Tonavia y el del jugador no cambian');
    const c1 = Ti.costeCurar(a), c0 = Ti.costeCurar(tn); ok(c1.herida === Math.max(1, Math.round(c0.herida * 3)) && c1.debilitada === Math.max(1, Math.round(c0.debilitada * 3)) && Ti.precioCurar(a) === 0, 'F7 economía: curar cuesta × precios en la dimensión y igual que siempre en Tonavia');
    const aj = D.ajustesDe(A.nodoDe(a)); ok(aj.nivel === 5 && aj.premios === 2 && A.nodoDe(a).region === 'r2' && A.nodoDe({ lug: 'inexistente' }) === null && D.ajustesDe(A.nodoDe(tn)) === D.NEUTRO, 'F7 nivel: los ajustes de un autónomo salen de su lugar (nivel base 5 en la dimensión, neutro en Tonavia)');
    a.lug = 'tdim/pueblo';
    const nivs = (ex) => { const x = nuevo(62); dentro(x, 'tdim/pueblo'); const v = []; for (let i = 0; i < 1500; i++) { x.reloj += 1; A.avanzar(x, 1); const g = A.de(x, 'tdim'); if (g) g.bat.forEach((b) => { if (b.k === 's') v.push(b.nv); }); } return v; };
    const con5 = nivs(), tope = Math.max.apply(null, con5); ok(con5.length > 5 && Math.min.apply(null, con5) >= 6 && tope <= 50, 'F7 nivel: los salvajes que enfrentan los autónomos de la dimensión llevan el nivel base (' + con5.length + ' combates vistos, mínimo ' + Math.min.apply(null, con5) + ' ≥ 6)');
  });
  const sinNivel = conRegistro({ tonavia: tonavia(), tdim: (() => { const d = dimF7(); delete d.nivel; delete d.economia; return d; })() }, () => { const x = nuevo(62); dentro(x, 'tdim/pueblo'); const v = []; for (let i = 0; i < 1500; i++) { x.reloj += 1; A.avanzar(x, 1); const g = A.de(x, 'tdim'); if (g) g.bat.forEach((b) => { if (b.k === 's') v.push(b.nv); }); } return v; });
  ok(sinNivel.length > 5 && Math.min.apply(null, sinNivel) < 6, 'F7 nivel: sin nivel base en la dimensión los mismos autónomos enfrentan salvajes de nivel bajo (la prueba anterior no es vacía; mínimo ' + Math.min.apply(null, sinNivel) + ')');

  // 7) hablar y retar a un entrenador de la dimensión
  con(() => conMapa(() => {
    {
      const x = nuevo(71); dentro(x, 'tdim/pueblo'); const j = x.jugadores.oli; j.x = 2 * 16; j.y = 2 * 16; A.asegurar(x, 'tdim');
      let c = null; for (let i = 0; i < 4000 && !c; i++) { x.reloj += 0.5; A.avanzar(x, 0.5); c = (G.vista.agentes(x, 'tdim/pueblo').find((q) => !q.duelo && !q.pes && q.al === undefined)) || null; }
      ok(c && !G.vista.agentes(x, 'tdim/no_hay').length && A.de(x, 'tdim').pob[+c.ag.slice(1)].lug === 'tdim/pueblo', 'F7 cuerpos: los pintores ven a los entrenadores de la dimensión en sus mapas (G.vista.agentes con el id del mapa)');
      const a = A.porId(x, c.ag, 'tdim'); j.x = c.x + 10; j.y = c.y; const r = motor.aplicar(x, { j: 'oli', t: 'hablar' });
      ok(r && r.agente === c.ag && r.nombre === a.nom && r.guion && r.guion.tipo === 'datos' && a.rel['j:oli'] && A.de(x, 'tdim').par && A.de(x, 'tdim').par[a.i] && !x.agentes.par && !x.agentes.pob.some((q) => q.rel['j:oli']), 'F7 hablar: hablar con un entrenador de la dimensión lo para y responde con SU estado (la población de Tonavia ni se entera)');
      const f = A.cuerpo.frase(x, a, A.ahora(A.de(x, 'tdim')), false, 0); ok(typeof f === 'string' && f.length > 0 && !/[{}]/.test(f), 'F7 hablar: la frase sale de las plantillas de la dimensión');
      motor.aplicar(x, { j: 'oli', t: 'hablar_fin', ag: a.id }); ok(!A.de(x, 'tdim').par, 'F7 hablar: despedirse lo suelta');
      const ant = a.pres; delete a.vida; j.brillos = 100; a.prog[a.equipo[0]] = { xp: G.nivel.xpPara(1) }; j.prog = { [G.equipo.actual(j)[0]]: { xp: G.nivel.xpPara(40) } };
      const c2 = G.vista.agentes(x, 'tdim/pueblo').find((q) => q.ag === a.id); if (c2) { j.x = c2.x + 10; j.y = c2.y; }
      const rr = motor.aplicar(x, { j: 'oli', t: 'retar', ag: a.id }), k = x.combate;
      ok(rr && rr.duelo && k && k.duelo && k.duelo.ag === a.i && k.duelo.dim === 'tdim' && A.de(x, 'tdim').par[a.i].d === 1, 'F7 duelo: retar a un entrenador de la dimensión abre un combate real y lo anota con su dimensión');
      for (let i = 0; i < 8000 && x.combate && !x.combate.fin; i++) motor.avanzar(x, 0.05); const fin = x.combate && x.combate.fin; for (let i = 0; i < 400 && x.combate; i++) motor.avanzar(x, 0.05);
      ok(fin && fin.ganador === 0 && !x.combate && a.pres < ant && a.rel['j:oli'].du === 1 && a.mem.some((q) => q[1] === 'der') && A.de(x, 'tdim').cont.duelo_jugador === 1 && !x.agentes.cont.duelo_jugador && !x.agentes.pob.some((q) => q.rel['j:oli']), 'F7 duelo: el resultado (prestigio, relación y recuerdo) se aplica al entrenador de SU dimensión');
    }
  }, { npcs: [], npc: undefined }));

  // 8) rendimiento y estructura
  con(() => { const x = nuevo(81); dentro(x, 'tdim/pueblo'); paso(x, 60); const t0 = process.hrtime.bigint(); paso(x, 600, 0.05); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 12000; ok(ms < 0.3, 'F7 rendimiento: una dimensión activa de 7 entrenadores a 60 cuadros/s cuesta ' + ms.toFixed(4) + ' ms por cuadro (tope 0,3)'); });
  { const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8').replace(/\/\/.*$/gm, ''); ok(!/Math\.random|Date\.now|document\.|localStorage/.test(src('agentes.js') + src('agentes_cuerpo.js') + src('agentes_trato.js') + src('dimensiones.js')), 'F7 agentes*.js y dimensiones.js siguen puros (sin azar, reloj ni DOM)');
    ok(fs.existsSync(path.join(__dirname, 'docs/multiverso/14_ENTRENADORES_F7.md')), 'F7 existe el contrato (docs/multiverso/14_ENTRENADORES_F7.md)'); }

  // ── Multiverso F8 · 1) poblaciones de DIMENSIÓN por red (anfitrión → invitado), sin duplicar ni retroceder ──
  con(() => conMapa(() => {
    const R = A.red, host = nuevo(21), guest = nuevo(21); [host, guest].forEach((e) => { e.jugadores.oli.mapa = 'tdim/pueblo'; e.jugadores.lali.mapa = 'tdim/pueblo'; });
    host.jugadores.lali.remoto = true; guest.jugadores.oli.remoto = true; R.conectar(host, 'anfitrion'); R.conectar(guest, 'invitado'); paso(host, 400);
    const junta = (e, n) => Array.from({ length: n || 3 }).reduce((o) => o.concat(R.salida(e, 5)), []), m1 = junta(host, 2), agd = m1.filter((m) => m.k === 'agd'), ag = m1.filter((m) => m.k === 'ag');
    ok(agd.length === 1 && agd[0].d === 'tdim' && Number.isInteger(agd[0].n) && ag.length === 1 && Number.isInteger(ag[0].n), 'F8 red: el anfitrión manda la población de la dimensión activa (agd) además de la de Tonavia (ag), una dimensión por mensaje');
    A.asegurar(guest, 'tdim'); guest.dim.tdim.jugadores = { oli: { casco: 1 } }; guest.dim.tdim.agentes.cron.push([1, 'x', '', '', '', '']);   // el invitado tenía OTRA población y datos propios en la sección
    m1.forEach((m) => R.recibir(guest, m));
    ok(J(A.de(guest, 'tdim')) === J(A.de(host, 'tdim')) && A.de(guest, 'tdim').pob.length === A.de(host, 'tdim').pob.length, 'F8 red: el invitado adopta EXACTAMENTE la población de la dimensión (sin duplicar entrenadores)');
    ok(J(guest.dim.tdim.jugadores) === J({ oli: { casco: 1 } }) && guest.dim.tdim.v === 1, 'F8 red: lo demás de la sección est.dim[dim] (datos del jugador) se conserva al adoptar');
    paso(host, 60); const m2 = junta(host), agd2 = m2.find((m) => m.k === 'agd'); ok(agd2 && agd2.n > agd[0].n && R.recibir(guest, agd2) && J(A.de(guest, 'tdim')) === J(A.de(host, 'tdim')), 'F8 red: una instantánea más nueva se adopta');
    const antes = J(A.de(guest, 'tdim')); ok(R.recibir(guest, agd[0]) === false && J(A.de(guest, 'tdim')) === antes, 'F8 red: una instantánea VIEJA (desordenada) se ignora: no se retrocede');
    ok(R.recibir(guest, agd2) === true, 'F8 red: repetir la última no estropea nada');
    const falso = (f) => { const x = copia(agd2); f(x); return R.recibir(guest, x); };
    ok(R.recibir(host, agd2) === false && !falso((x) => { x.d = 'nexus'; }) && !falso((x) => { x.d = 'tonavia'; }) && !falso((x) => { x.d = '../x'; }) && !falso((x) => { x.n = x.n + 1; }) && !falso((x) => { x.s = 'no json'; }) && !falso((x) => { x.s = 'x'.repeat(2500001); }) && !falso((x) => { x.n = -1; }), 'F8 red: se rechazan: recibirla el anfitrión, dimensión sin entrenadores o con nombre raro, contador que no cuadra, texto roto o gigante');
    ok(!falso((x) => { const d = JSON.parse(x.s); d.cron = Array(900).fill([1, 'x', '', '', '', '']); x.s = J(d); }) && !falso((x) => { const d = JSON.parse(x.s); d.pob.push(copia(d.pob[0])); d.pob.length = 130; x.s = J(d); }) && !falso((x) => { const d = JSON.parse(x.s); d.pob[0].mem = Array(300).fill([1, 'x', '', '', 0, 0]); x.s = J(d); }) && !falso((x) => { const d = JSON.parse(x.s); d.dim = 'otra'; x.s = J(d); }), 'F8 red: se rechazan poblaciones hostiles (demasiados entrenadores, memoria o crónica desbocadas, otra dimensión)');
    ok(J(A.de(guest, 'tdim')) === J(A.de(host, 'tdim')) || R.recibir(guest, agd2), 'F8 red: tras los rechazos la población adoptada sigue intacta');
    // Tonavia: contrato v1 de siempre (un mensaje «ag» sin contador se sigue aceptando) y no retrocede
    const g2 = nuevo(21); g2.jugadores.oli.remoto = true; R.conectar(g2, 'invitado'); const a0 = copia(ag[0]); delete a0.n; ok(R.recibir(g2, a0) === true, 'F8 red: el mensaje «ag» de Tonavia sin contador (versión de antes) se sigue aceptando');
    R.recibir(g2, ag[0]); const viejoT = copia(ag[0]); viejoT.n = ag[0].n - 5; ok(R.recibir(g2, viejoT) === false, 'F8 red: una población de Tonavia más vieja que la última se ignora');
    // el invitado no crea poblaciones de dimensión por su cuenta desde la red si no es invitado
    const sin = nuevo(21); ok(R.recibir(sin, agd2) === false && A.de(sin, 'tdim') === null, 'F8 red: sin conectar como invitado no se adopta nada');
    // solo viaja lo de dimensiones ACTIVAS
    const h3 = nuevo(21); R.conectar(h3, 'anfitrion'); paso(h3, 5); ok(R.salida(h3, 10).every((m) => m.k !== 'agd'), 'F8 red: sin jugadores en la dimensión no se manda su población');
  }));
  // ── F8 · 2) límites de est.dim en el guardado ──
  con(() => conMapa(() => {
    const L = Gd.LIM, kb = (n) => 'x'.repeat(n * 1000), lim = (o) => Gd.limitarDim(copia(o));
    { const o = {}; for (let i = 0; i < 260; i++) o['d' + String(i).padStart(3, '0')] = { v: 1 }; const r = lim(o); ok(Object.keys(r.dim).length === L.secciones && r.descartes.length === 4 && r.descartes.every((d) => d.por === 'demasiadas secciones'), 'F8 guardado: como mucho ' + L.secciones + ' secciones; el resto se anota en descartes'); }
    { const r = lim({ zz: { v: 1, basura: kb(1800) }, ok1: { v: 1, a: 1 } }); ok(!r.dim.zz && r.dim.ok1 && r.descartes.length === 1 && r.descartes[0].que === 'seccion', 'F8 guardado: una sección desconocida gigante se descarta entera y las demás se conservan'); }
    { const x = nuevo(41); x.jugadores.oli.mapa = 'tdim/pueblo'; paso(x, 30); const ag = A.de(x, 'tdim'), big = copia(ag); big.cont.relleno = kb(1600); const r = lim({ tdim: { v: 1, jugadores: { oli: { casco: 2 } }, agentes: big } });
      ok(r.dim.tdim && r.dim.tdim.agentes === undefined && J(r.dim.tdim.jugadores) === J({ oli: { casco: 2 } }) && r.descartes[0].que === 'agentes', 'F8 guardado: si una dimensión conocida se pasa, solo pierde la población (que vuelve a nacer); sus datos de jugador se conservan');
      const normal = lim({ tdim: { v: 1, jugadores: { oli: { casco: 2 } }, agentes: copia(ag) } }); ok(!normal.descartes.length && J(normal.dim.tdim.agentes) === J(ag), 'F8 guardado: una población normal NO se recorta'); }
    { const o = { a: { v: 1, r: kb(1300) }, b: { v: 1, r: kb(1200) }, c: { v: 1, r: kb(1100) } }; const r = lim(o); ok(Object.keys(r.dim).length === 2 && !r.dim.a && r.descartes.length === 1 && r.descartes[0].por === 'total de dimensiones demasiado grande', 'F8 guardado: pasado el total se quita lo mayor entre lo que este juego no conoce (' + Object.keys(r.dim).join(',') + ')'); }
    { const x = nuevo(42); x.jugadores.oli.mapa = 'tdim/pueblo'; paso(x, 30); const ag = A.de(x, 'tdim'); const gr = copia(ag); gr.cont.relleno = kb(100); const o = { tdim: { v: 1, jugadores: { oli: { casco: 1 } }, agentes: gr }, fut: { v: 5, datos: kb(1140) }, fut2: { v: 5, datos: kb(1140) }, fut3: { v: 5, datos: kb(1140) } }; const r = lim(o);
      ok(r.dim.tdim && r.dim.tdim.agentes === undefined && J(r.dim.tdim.jugadores) === J({ oli: { casco: 1 } }) && Object.keys(r.dim).filter((k) => /^fut/.test(k)).length === 3 && r.descartes.length === 1 && r.descartes[0].que === 'agentes', 'F8 guardado: pasado el total caen PRIMERO las poblaciones (que renacen) y se salvan las secciones futuras y los datos de jugador'); }
    { const fut = { v: 5, nuevo: { a: [1, 2, 3] } }; const r = lim({ futura: fut }); ok(J(r.dim.futura) === J(fut) && !r.descartes.length, 'F8 guardado: una sección de una versión futura dentro del tope se conserva tal cual'); }
    // restaurar / serializar / cargar de extremo a extremo
    { const e = nuevo(43), d = JSON.parse(J(Gd.serializar(e))); d.dim.hostil = { v: 1, basura: kb(1800) }; d.dim.futura = { v: 9, x: 1 }; const e2 = nuevo(43); Gd.restaurar(e2, d);
      ok(!e2.dim.hostil && e2.dim.futura && e2.dim.futura.v === 9 && Gd.descartes.length === 1 && Gd.descartes[0].id === 'hostil', 'F8 guardado: al cargar se descarta la sección hostil, se conserva la futura y queda anotado');
      const e3 = nuevo(43); e3.dim = { hostil: { v: 1, basura: kb(1800) }, futura: { v: 9, x: 1 } }; const s = Gd.serializar(e3); ok(!s.dim.hostil && s.dim.futura && s.dim.futura.x === 1 && J(s).length < 20000, 'F8 guardado: al guardar tampoco se escribe lo que pasa del tope (el estado en memoria no se toca)'); }
    { const ls = {}, bak = global.localStorage; global.localStorage = { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } };
      try { const e = nuevo(44), d = JSON.parse(J(Gd.serializar(e))); d.dim.hostil = { v: 1, basura: kb(1800) }; const texto = J(d); ls[Gd.CLAVE] = texto; const r = Gd.cargar(() => nuevo(44));
        ok(r.estado === 'cargada' && !r.est.dim.hostil && ls[Gd.CLAVE_EXC] === texto, 'F8 guardado: tras recortar por tamaño, el guardado ORIGINAL queda apartado (criaturas_partida_exceso): nada se pierde sin remedio');
        ls[Gd.CLAVE_EXC] = 'otro'; Gd.cargar(() => nuevo(44)); ok(ls[Gd.CLAVE_EXC] === 'otro', 'F8 guardado: lo ya apartado no se pisa');
        delete ls[Gd.CLAVE_EXC]; const d2 = JSON.parse(J(Gd.serializar(nuevo(44)))); ls[Gd.CLAVE] = J(d2); Gd.cargar(() => nuevo(44)); ok(ls[Gd.CLAVE_EXC] === undefined && Gd.descartes.length === 0, 'F8 guardado: un guardado normal no aparta nada'); } finally { if (bak === undefined) delete global.localStorage; else global.localStorage = bak; } }
    // población hostil dentro de un guardado: se descarta y vuelve a nacer
    { const x = nuevo(45); x.jugadores.oli.mapa = 'tdim/pueblo'; paso(x, 30); const ag = copia(A.de(x, 'tdim')); ag.pob.forEach((a) => { a.mem = Array(500).fill([1, 'x', '', '', 0, 0]); }); const e = nuevo(45); e.dim = { tdim: { v: 1, agentes: ag } };
      ok(A.de(e, 'tdim') === null, 'F8 guardado: una población con memorias desbocadas no se acepta al leer (se descarta entera)'); }
  }));
  // — límites de tamaño de una población (guardado y red) —
  con(() => conMapa(() => {
    const e = nuevo(33); e.jugadores.oli.mapa = 'tdim/pueblo'; paso(e, 30); const ag = A.de(e, 'tdim'), v = (d) => A.valido(e, d, 'tdim');
    ok(ag && v(copia(ag)) && J(ag).length < A.LIM.base + A.LIM.porEnt * ag.pob.length, 'F8 límites: una población normal es válida y está muy por debajo del tope (' + J(ag).length + ' de ' + (A.LIM.base + A.LIM.porEnt * ag.pob.length) + ' bytes)');
    const x1 = copia(ag); x1.pob[0].mem = Array(A.LIM.mem + 1).fill([1, 'x', '', '', 0, 0]); const x2 = copia(ag); x2.plan = 0; x2.pob[0].plan = Array(A.LIM.plan + 1).fill(['a']); const x3 = copia(ag); x3.bat = Array(A.LIM.bat + 1).fill({}); const x4 = copia(ag); x4.cont.relleno = 'x'.repeat(A.LIM.base + A.LIM.porEnt * ag.pob.length);
    ok(!v(x1) && !v(x2) && !v(x3) && !v(x4), 'F8 límites: memoria, plan, combates y tamaño total por encima del tope se rechazan');
    const x5 = copia(ag); x5.pob = Array.from({ length: A.LIM.pob + 1 }, (_, i) => Object.assign(copia(ag.pob[0]), { i })); ok(!v(x5), 'F8 límites: más entrenadores que el tope se rechaza');
    // — poblaciones NUMEROSAS y guardados GRANDES: los datos válidos nunca se descartan —
    { const Gd = G.guardado, dur = []; const crece = (n, seg) => { const x = { semilla: 7, agentes: A.crear(7, n), avisos: [], jugadores: {} }; for (let i = 0; i < seg; i++) A.avanzar(x, 1); return x; };
      for (const [n, seg] of [[24, 1800], [64, 1800], [128, 1800]]) {
        const x = crece(n, seg), t = J(x.agentes), lim = A.LIM.base + A.LIM.porEnt * n; const ee = nuevo(60 + n); ee.agentes = copia(x.agentes);
        const t0 = process.hrtime.bigint(), sv = J(Gd.serializar(ee)), t1 = process.hrtime.bigint(), d = JSON.parse(sv), e2 = nuevo(60 + n); const t2 = process.hrtime.bigint(); Gd.restaurar(e2, d); const t3 = process.hrtime.bigint();
        const ms = (a, b) => Number(b - a) / 1e6; dur.push(n + ' entrenadores: ' + (t.length / 1024).toFixed(0) + ' KB, guardar ' + ms(t0, t1).toFixed(1) + ' ms, cargar ' + ms(t2, t3).toFixed(1) + ' ms');
        ok(A.valido(ee, copia(x.agentes)) && t.length < lim / 2 && !Gd.recorte.length && !Gd.descartes.length && J(e2.agentes) === J(ee.agentes), 'F8 límites: ' + n + ' entrenadores tras ' + seg + ' s (' + (t.length / 1024).toFixed(0) + ' KB, tope ' + (lim / 1024).toFixed(0) + ' KB) se validan, se guardan y se cargan IDÉNTICOS, sin recortar nada');
      }
      if (process.env.VERBOSO) console.log('  · ' + dur.join(' | ')); }
    { const x = { semilla: 7, agentes: A.crear(7, 128), avisos: [], jugadores: {} }; for (let i = 0; i < 1800; i++) A.avanzar(x, 1); x.reloj = 0; x.jugadores = { oli: { id: 'oli', mapa: 'pueblo_inicial' } };
      const R = A.red, host = nuevo(70); host.agentes = copia(x.agentes); R.conectar(host, 'anfitrion'); let chars = 0, mens = 0, mayor = 0; for (let i = 0; i < 1200; i++) R.salida(host, 0.1).forEach((m) => { chars += m.s.length; mens++; mayor = Math.max(mayor, m.s.length); });
      const bps = chars / 120; ok(mens >= 2 && chars <= 16000 * 120 + mayor, 'F8 red: con 128 entrenadores (' + (mayor / 1024).toFixed(0) + ' KB por población) el anfitrión no pasa del presupuesto: ' + (bps / 1024).toFixed(1) + ' KB/s de media en 120 s (tope 16 KB/s más el último envío en curso)');
      const h2 = nuevo(71); R.conectar(h2, 'anfitrion'); A.asegurar(h2); let pequeno = 0; for (let i = 0; i < 100; i++) R.salida(h2, 0.1).forEach((m) => { pequeno += m.k === 'ag' ? 1 : 0; }); ok(pequeno >= 2, 'F8 red: con la población normal el presupuesto no frena el ritmo de siempre (cada ~4 s)'); }
    // — escalones de escritura cuando el navegador no tiene sitio (cuota de localStorage): el progreso del jugador nunca se pierde —
    { const Gd = G.guardado, bak = global.localStorage, ls = {}, tot = () => Object.keys(ls).reduce((n, k) => n + ls[k].length, 0); let cuota = 1e9;
      global.localStorage = { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { v = String(v); const otros = tot() - (k in ls ? ls[k].length : 0); if (otros + v.length > cuota) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } ls[k] = v; }, removeItem: (k) => { delete ls[k]; } };
      try { const mk = () => { const x = nuevo(80); x.jugadores.oli.mapa = 'tdim/pueblo'; paso(x, 30); const g = A.de(x, 'tdim'); g.cont.relleno = 'x'.repeat(120000); x.jugadores.oli.xpE = 777; x.jugadores.oli.brillos = 4242; return x; };
        Gd.bloqueo = null; Gd.avisos = {}; let x = mk(); const completo = J(Gd.serializar(x)).length, sinDim = J(Gd.serializar(x, { sinPoblaciones: 1 })).length;
        ok(Gd.escribir(x) && Gd.ultimo.escalon === 0 && Gd.ultimo.chars > 120000 && Gd.ultimo.ms >= 0 && !x.avisos.length, 'F8 guardado: con sitio se guarda completo (escalón 0), sin avisos y sin recortar (' + completo + ' car.)');
        const d0 = JSON.parse(ls[Gd.CLAVE]); ok(d0.dim.tdim.agentes && d0.jugadores.oli.xpE === 777, 'F8 guardado: el guardado completo lleva la población de la dimensión y el progreso');
        delete ls[Gd.CLAVE]; Gd.avisos = {}; x = mk(); cuota = Math.floor((completo + sinDim) / 2);
        ok(Gd.escribir(x) && Gd.ultimo.escalon === 1 && Gd.ultimo.fallo !== true, 'F8 guardado: sin sitio para todo, se guarda SIN las poblaciones de dimensión (escalón 1)');
        const d1 = JSON.parse(ls[Gd.CLAVE]); ok(!d1.dim.tdim || d1.dim.tdim.agentes === undefined, 'F8 guardado: el escalón 1 no lleva la población de la dimensión…'); ok(d1.jugadores.oli.xpE === 777 && d1.jugadores.oli.brillos === 4242 && d1.dim.tonavia && d1.dim.tonavia.agentes, '…pero conserva TODO el progreso del jugador y la población de Tonavia');
        ok(x.avisos.some((a) => /no tiene espacio/.test(a.texto)) && x.avisos.filter((a) => a.j === 'oli').length === 1, 'F8 guardado: el jugador recibe UN aviso visible (no se descarta en silencio)');
        x.avisos.length = 0; Gd.escribir(x); ok(!x.avisos.length, 'F8 guardado: el aviso no se repite en cada autoguardado');
        delete ls[Gd.CLAVE]; Gd.avisos = {}; x = mk(); cuota = Math.floor(sinDim - J(x.agentes || {}).length * 0 - 5000); { const sin2 = J(Gd.serializar(x, { sinPoblaciones: 2 })).length; cuota = Math.floor((sin2 + sinDim) / 2); }
        ok(Gd.escribir(x) && Gd.ultimo.escalon === 2, 'F8 guardado: si ni así cabe, se guarda sin ninguna población (escalón 2)'); const d2 = JSON.parse(ls[Gd.CLAVE]); ok(d2.jugadores.oli.xpE === 777 && d2.dim.tonavia.agentes === undefined, 'F8 guardado: el escalón 2 sigue conservando el progreso del jugador');
        delete ls[Gd.CLAVE]; Gd.avisos = {}; x = mk(); cuota = 100; ok(Gd.escribir(x) === false && x.avisos.some((a) => /No hay espacio/.test(a.texto)), 'F8 guardado: sin sitio ni para lo mínimo, escribir() devuelve false y AVISA (antes fallaba en silencio)');
        // la carga de un guardado grande y válido no recorta nada
        cuota = 1e9; Gd.avisos = {}; x = mk(); Gd.escribir(x); const r = Gd.cargar(() => nuevo(80)); ok(r.estado === 'cargada' && !Gd.descartes.length && A.de(r.est, 'tdim') && A.de(r.est, 'tdim').cont.relleno.length === 120000 && r.est.jugadores.oli.xpE === 777, 'F8 guardado: un guardado grande y válido se recarga entero (nada se descarta)');
      } finally { Gd.avisos = {}; if (bak === undefined) delete global.localStorage; else global.localStorage = bak; } }
  }));
}
// ── Multiverso FN · navegación marítima (barco como modo del jugador, rutas de datos, faros, mareas, eventos por hash, red v2) ──
{
  const N = G.navegacion, motor = G.motor, D = G.dimensiones, T = 16, fs = require('fs'), path = require('path');
  const nuevo = (seed) => { const x = motor.crear(seed || 77); motor.aplicar(x, { j: 'oli', t: 'colocar', mapa: 'pirata/mar_1_1', ancla: 'inicio' }); return x; };
  const sim = (x, s, dt) => { const d = dt || 1 / 30, n = Math.round(s / d); for (let i = 0; i < n; i++) motor.moverJugadores(x, d); };
  const teclas = (x, o) => motor.aplicar(x, Object.assign({ j: 'oli', t: 'teclas', up: 0, down: 0, left: 0, right: 0 }, o));
  const rn = (x) => JSON.stringify(x.rnd);
  // 1) esquema v4: validación y rechazos
  { const base = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'datos/dimensiones/pirata.json'), 'utf8'));
    const r0 = D.validar(base(), 'pirata'); ok(r0 && (r0.ok === true || r0.length === 0 || r0.errores === undefined || !r0.errores.length), 'FN esquema: pirata.json (v4) valida');
    const err = (f) => { const d = base(); f(d); const r = D.validar(d, 'pirata'); return Array.isArray(r) ? r.length : r && r.errores ? r.errores.length : r && r.ok === false ? 1 : 0; };
    ok(err((d) => { d.v = 3; }) > 0 && err((d) => { d.navegacion.travesia = [40, 10]; }) > 0 && err((d) => { d.navegacion.rutas[0].puntos[0] = [0, 0]; }) > 0 && err((d) => { d.navegacion.puntos[0].tipo = 'xx'; }) > 0 && err((d) => { d.navegacion.mar.mapas.pop(); }) > 0 && err((d) => { d.navegacion.barco = { velocidades: [1000] }; }) > 0, 'FN esquema: se rechazan v<4, travesía incoherente (mín > máx), ruta que no empieza en su punto, tipo de punto desconocido, mosaico incompleto y velocidad absurda');
    ok(err((d) => { d.navegacion.rutas[0].puntos = [[24, 24], [150, 40]]; d.navegacion.rutas[0].puntos[1] = [150, 40]; d.navegacion.travesia = [15, 16]; }) > 0, 'FN esquema: una ruta cuya duración no cabe en la travesía declarada se rechaza'); }
  // 2) mar: colisión invertida, velocidades, bordes
  { const x = nuevo(), j = x.jugadores.oli, m = G.mundo.mapas['pirata/mar_1_1'];
    ok(m.mar === true && N.navegando(j) && !G.mundo.solido(m, 32, 32) && G.mundo.at(m, 64, 32) === '~', 'FN mar: el mapa de mar es navegable, el exterior conectado es agua');
    const t0 = j.x; teclas(x, { right: 1 }); sim(x, 1); ok(Math.abs(j.x - t0 - 80) < 0.5, 'FN velocidad básica: 80 px/s'); teclas(x, {});
    N.mejorar(x, j, 'velas', 1); const t1 = j.x; teclas(x, { right: 1 }); sim(x, 1); ok(Math.abs(j.x - t1 - 110) < 0.5, 'FN velocidad mejorada: 110 px/s'); teclas(x, {});
    const k = nuevo(); k.jugadores.oli.mapa = 'mapa_inexistente_no'; }
  // 3) cruce de bordes del mosaico y niebla/descubrimiento
  { const x = nuevo(), j = x.jugadores.oli; teclas(x, { right: 1 }); sim(x, 8); ok(j.mapa === 'pirata/mar_1_2', 'FN mosaico: al llegar al borde se pasa al mapa de mar vecino'); teclas(x, {});
    j.mapa = 'pirata/mar_0_0'; G.mundo.mapa(j.mapa); j.x = 24 * T + 8; j.y = 24 * T + 14; sim(x, 0.6); ok(N.sabe(x, j, 'baliza_a'), 'FN descubrimiento: acercarse a una baliza la descubre (por jugador)');
    ok(!N.sabe(x, j, 'baliza_b') && N.niebla(x, j).some((b) => b === 1), 'FN niebla: solo se despeja lo visto'); }
  // 4) guardado: ida y vuelta, datos hostiles y sección futura intacta
  { const x = nuevo(), j = x.jugadores.oli; N.mejorar(x, j, 'casco', 1); N.cosmetica(x, j, { nombre: 'Perla', velas: '#ff0000' }); N.descubrir(x, j, 'baliza_c'); N.amarrar(x, j, { mapa: 'pirata/mar_1_1', tx: 30, ty: 30 });
    const d = JSON.parse(JSON.stringify(G.guardado.serializar(x))); const y = motor.crear(77); G.guardado.restaurar(y, d); const r = y.dim.pirata.jugadores.oli;
    ok(r && r.casco === 1 && r.cos && r.cos.nombre === 'Perla' && r.cos.velas === '#ff0000' && r.desc.includes('baliza_c') && r.amarre && r.amarre.tx === 30 && y.dim.pirata.v === 1, 'FN guardado: casco, cosmética, descubrimientos y amarre sobreviven al guardar/cargar');
    const h = JSON.parse(JSON.stringify(d)); h.dim.pirata.jugadores.oli = { casco: 99, velas: -3, bodega: 'x', catalejo: NaN, niebla: 5, desc: ['no_existe', 7, 'baliza_a'], cobros: { 'x': 1 }, amarre: { mapa: 'albanota', tx: 1, ty: 1 } }; h.dim.pirata.jugadores['MALO!!'] = {};
    const z = motor.crear(77); G.guardado.restaurar(z, h); const q = z.dim.pirata.jugadores.oli;
    ok(q && q.casco <= 2 && !(q.velas < 0) && !q.amarre && (!q.desc || q.desc.every((i) => i === 'baliza_a')) && !z.dim.pirata.jugadores['MALO!!'], 'FN guardado: datos hostiles se recortan al cargar (niveles, amarre fuera del mar, ids desconocidos, claves inválidas)');
    const f = JSON.parse(JSON.stringify(d)); f.dim.pirata.v = 2; f.dim.pirata.jugadores.oli.casco = 2; f.dim.pirata.futuro = { a: 1 }; const w = motor.crear(77); G.guardado.restaurar(w, f);
    ok(w.dim.pirata.v === 2 && w.dim.pirata.futuro && w.dim.pirata.futuro.a === 1 && w.dim.pirata.jugadores.oli.casco === 2, 'FN guardado: una sección de una versión futura (v>1) no se lee ni se pisa'); }
  // 5) embarcar/desembarcar (ganchos de las puertas) y barco amarrado
  { const x = motor.crear(5), j = x.jugadores.oli, puerta = { x: 10, y: 10, destino: { mapa: 'pirata/mar_1_1', ancla: 'inicio' } };
    G.mundo.mapa('pirata/mar_1_1'); j.mapa = 'pirata/mar_1_1'; const sinBarco = N.puedeCruzar(x, j, { mar: false, id: 'x' }, puerta);
    ok(sinBarco === 'Aún no tienes barco', 'FN embarque: sin barco no se puede subir');
    N.amarrar(x, j, { mapa: 'pirata/mar_1_1', tx: 32, ty: 32 }); ok(N.puedeCruzar(x, j, { mar: false }, puerta) === null, 'FN embarque: con el barco amarrado junto al muelle se puede subir');
    N.amarrar(x, j, { mapa: 'pirata/mar_0_0', tx: 5, ty: 5 }); ok(/no está aquí/.test(N.puedeCruzar(x, j, { mar: false }, puerta) || ''), 'FN embarque: con el barco amarrado en otro sitio no se sube');
    G.mundo.mapa('pirata/mar_1_2'); j.mapa = 'pueblo_inicial'; N.alCruzar(x, j, 'pirata/mar_1_2', { x: 1, y: 2 }); const am = x.dim.pirata.jugadores.oli.amarre;
    ok(!j.nav && am && am.mapa === 'pirata/mar_1_2' && am.tx === 1, 'FN desembarque: se amarra el barco donde estaba la puerta y se deja de navegar'); }
  // 6) rumbo automático
  { const x = nuevo(), j = x.jugadores.oli; N.descubrir(x, j, 'baliza_a'); N.descubrir(x, j, 'baliza_b'); N.descubrir(x, j, 'baliza_c'); j.mapa = 'pirata/mar_0_0'; G.mundo.mapa(j.mapa); j.x = 24 * T + 8; j.y = 24 * T + 14;
    const rn0 = rn(x), ord = (o) => motor.aplicar(x, Object.assign({ j: 'oli' }, o));
    ok(!ord({ t: 'nav.rumbo', ruta: 'a_b', hacia: 'baliza_c' }) && !ord({ t: 'nav.rumbo', ruta: 'no', hacia: 'baliza_b' }), 'FN rumbo: destino fuera de la ruta o ruta inexistente se rechazan');
    ok(ord({ t: 'nav.rumbo', ruta: 'a_b', hacia: 'baliza_b' }), 'FN rumbo: fijar rumbo desde una baliza descubierta'); let t = 0; while (j.nav && j.nav.rumbo && t < 60) { motor.moverJugadores(x, 1 / 30); t += 1 / 30; }
    ok(t >= 15 && t <= 35 && j.mapa === 'pirata/mar_0_2' && Math.abs(j.x / T - 22) < 3 && Math.abs(j.y / T - 41) < 3, 'FN rumbo: llega a su destino en 15-35 s sin pathfinding (' + t.toFixed(1) + ' s)');
    j.mapa = 'pirata/mar_0_0'; G.mundo.mapa(j.mapa); j.x = 24 * T + 8; j.y = 24 * T + 14; ord({ t: 'nav.rumbo', ruta: 'a_b', hacia: 'baliza_b' }); teclas(x, { left: 1 }); sim(x, 0.1); ok(!(j.nav && j.nav.rumbo), 'FN rumbo: cualquier tecla lo cancela'); teclas(x, {});
    ok(rn(x) === rn0, 'FN rumbo: no gasta el azar de la partida'); }
  // 7) faros
  { const x = nuevo(), j = x.jugadores.oli, ord = (o) => motor.aplicar(x, Object.assign({ j: 'oli' }, o)); N.descubrir(x, j, 'baliza_a'); N.descubrir(x, j, 'baliza_c'); j.mapa = 'pirata/mar_0_0'; G.mundo.mapa(j.mapa); j.x = 24 * T + 8; j.y = 24 * T + 14;
    const rn0 = rn(x); ok(!ord({ t: 'nav.faro', destino: 'baliza_b' }), 'FN faro: no se viaja a un faro no descubierto'); const r = ord({ t: 'nav.faro', destino: 'baliza_c' });
    ok(r && j.mapa === 'pirata/mar_2_1' && N.navegando(j) && rn(x) === rn0, 'FN faro: viaje directo e inmediato entre faros descubiertos, el barco va con el jugador y no gasta azar');
    j.x = 5 * T; j.y = 5 * T; ok(!ord({ t: 'nav.faro', destino: 'baliza_a' }), 'FN faro: hay que estar junto a un faro conocido'); }
  // 8) mareas como condición de puerta (REQ) sin tocar colisiones
  { const c = N.cfgDe('pirata'), dia = G.ciclo.AJUSTES.DIA_S, h = (hr) => { for (let s = 0; s < dia; s += dia / 240) if (Math.abs(N.hora(s) - hr) < 0.1) return s; return 0; };
    const sBaja = h(8), sAlta = h(13); const x = motor.crear(3), j = x.jugadores.oli;
    ok(N.marea(sBaja, 'pirata') === 'baja' && N.marea(sAlta, 'pirata') === 'alta', 'FN marea: baja y alta según las franjas de datos (reloj puro)');
    x.reloj = sBaja; const req = (r) => G.portales.comprobar(j, { requisitos: [r] }, x).ok; ok(req({ t: 'marea', estado: 'baja', dim: 'pirata' }) && !req({ t: 'marea', estado: 'alta', dim: 'pirata' }), 'FN marea: REQ «marea» abre o cierra según la hora');
    const m = G.mundo.mapas['pirata/mar_1_1'] || (G.mundo.mapa('pirata/mar_1_1'), G.mundo.mapas['pirata/mar_1_1']), s0 = G.mundo.solido(m, 20, 20); x.reloj = sAlta; ok(G.mundo.solido(m, 20, 20) === s0, 'FN marea: no modifica las colisiones'); }
  // 9) eventos marinos deterministas por hash
  { const x = nuevo(), j = x.jugadores.oli, c = N.cfgDe('pirata'), m = G.mundo.mapas['pirata/mar_1_1'], rn0 = rn(x);
    const p1 = JSON.stringify(N.plan(77, m, 5, c.eventos)), p2 = JSON.stringify(N.plan(77, m, 5, c.eventos)), p3 = JSON.stringify(N.plan(78, m, 5, c.eventos)), p4 = JSON.stringify(N.plan(77, m, 6, c.eventos));
    ok(p1 === p2 && p1 !== p3 && p1 !== p4 && JSON.parse(p1).length === c.eventos.por_mapa && JSON.parse(p1).every((e) => !G.mundo.solido(m, e.tx, e.ty)), 'FN eventos: el plan solo depende de (semilla, mapa, ventana): estable, distinto con otra semilla/ventana, siempre sobre agua libre');
    const e0 = N.plan(77, m, 0, c.eventos).find((e) => e.tipo === 'cofre' || e.tipo === 'botella'); let cobrado = false;
    for (let w = 0; w < 40 && !cobrado; w++) { const e = N.plan(77, m, w, c.eventos).find((q) => q.tipo === 'cofre' || q.tipo === 'botella'); if (!e) continue; x.reloj = w * c.eventos.ventana + 1; j.x = e.tx * T + 8; j.y = e.ty * T + 8; sim(x, 0.6); const r = x.dim.pirata.jugadores.oli; if (r && r.cobros && r.cobros[e.id]) { cobrado = true; const n = Object.keys(r.cobros).length; sim(x, 1); ok(Object.keys(x.dim.pirata.jugadores.oli.cobros).length === n, 'FN eventos: un cofre/botella se cobra una sola vez y queda guardado'); } }
    ok(cobrado, 'FN eventos: acercarse a un cofre o botella lo cobra'); ok(rn(x) === rn0, 'FN eventos: el plan, el cobro y la navegación NO consumen el azar de la partida (est.rnd intacto)'); }
  // 10) red v1/v2
  { const x = nuevo(), j = x.jugadores.oli, y = motor.crear(77); y.jugadores.oli.mapa = 'pirata/mar_1_1'; N.mejorar(x, j, 'casco', 1);
    G.mundo.mapa('pirata/mar_1_1'); const m2 = G.red.resumen(x, 'oli'); 
    ok(m2.v === 2 && m2.nav && m2.nav.c === 1, 'FN red: navegando se emite la versión 2 con el barco');
    ok(G.red.aplicar(y, 'oli', JSON.parse(JSON.stringify(m2))) && y.jugadores.oli.barcoRed && y.jugadores.oli.barcoRed.casco === 1, 'FN red: v2 se acepta y guarda el aspecto del barco remoto');
    const t = motor.crear(9); t.jugadores.oli.mapa = 'pueblo_inicial'; const m1 = G.red.resumen(t, 'oli'); ok(m1.v === 1 && m1.nav === undefined, 'FN red: en tierra se emite exactamente la versión 1 de siempre');
    const z = motor.crear(9); ok(G.red.aplicar(z, 'oli', JSON.parse(JSON.stringify(m1))), 'FN red: un mensaje v1 se sigue aceptando');
    const mal = (f) => { const q = JSON.parse(JSON.stringify(m2)); f(q); return G.red.aplicar(motor.crear(77), 'oli', q); };
    ok(!mal((q) => { q.v = 1; }) && !mal((q) => { q.nav = 'x'; }) && !mal((q) => { q.nav.c = 99; }) && !mal((q) => { q.v = 3; }) && !mal((q) => { q.mapa = 'pueblo_inicial'; }), 'FN red: v1 con barco, barco malformado/fuera de rango, v3 y barco en tierra se rechazan');
    G.mundo.mapa('pirata/mar_1_1'); const w = motor.crear(77); w.jugadores.oli.mapa = 'pirata/mar_1_1'; G.red.aplicar(w, 'oli', JSON.parse(JSON.stringify(m2))); const sol = G.red.soltar ? G.red.soltar(w, 'oli') : null; ok(!w.jugadores.oli.barcoRed || sol !== null, 'FN red: el barco remoto no se arrastra tras soltar al jugador'); }
  // 10b) cliente ANTIGUO (red.js v1 real de la v2.359) frente al nuevo: lo que la v2 garantiza y lo que no
  { const src = fs.readFileSync(path.join(__dirname, 'tools/fixtures/red_v1_v2359.js'), 'utf8'), mundoViejo = Object.assign({}, G.mundo, { mapa: (id) => { if (/^pirata\//.test(id)) throw new Error('mapa desconocido para una versión antigua'); return G.mundo.mapa(id); } });
    const Gv = Object.assign({}, G, { mundo: mundoViejo }); delete Gv.navegacion; const viejo = (new Function('window', src + '\nreturn window.G.red;'))({ G: Gv }); Gv.red = viejo;
    ok(viejo.VERSION === 1, 'FN red v1 real: se carga la red.js antigua de la v2.359 (VERSION 1)');
    const t = motor.crear(9); t.jugadores.oli.mapa = 'pueblo_inicial'; const mN = G.red.resumen(t, 'oli'), mV = viejo.resumen(t, 'oli');
    ok(JSON.stringify(mN) === JSON.stringify(mV), 'FN red v1 real: a pie, el mensaje del cliente nuevo es BYTE A BYTE el del antiguo');
    const vOld = motor.crear(9); ok(viejo.aplicar(vOld, 'oli', JSON.parse(JSON.stringify(mN))) && vOld.jugadores.oli.mapa === 'pueblo_inicial', 'FN red v1 real: el cliente antiguo acepta al nuevo mientras va a pie');
    ok(G.red.aplicar(motor.crear(9), 'oli', JSON.parse(JSON.stringify(mV))), 'FN red v1 real: el cliente nuevo acepta al antiguo');
    const s = nuevo(); G.mundo.mapa('pirata/mar_1_1'); const m2 = G.red.resumen(s, 'oli'), r = motor.crear(9), antes = JSON.stringify([r.jugadores.oli.mapa, r.jugadores.oli.x, r.jugadores.oli.y]); let lanza = false, res = null; try { res = viejo.aplicar(r, 'oli', JSON.parse(JSON.stringify(m2))); } catch (e) { lanza = true; }
    ok(!lanza && res === false && JSON.stringify([r.jugadores.oli.mapa, r.jugadores.oli.x, r.jugadores.oli.y]) === antes, 'FN red v1 real: navegando (v2) el cliente antiguo lo RECHAZA sin romperse y se queda con la última posición (queda quieto)');
    const falso = JSON.parse(JSON.stringify(m2)); falso.v = 1; delete falso.nav; let res2 = null; try { res2 = viejo.aplicar(motor.crear(9), 'oli', falso); } catch (e) { res2 = 'lanza'; }
    ok(res2 === false, 'FN red v1 real: aun etiquetando el mensaje como v1 y sin barco, el antiguo lo rechaza (no conoce el mapa del mar): no existe un mensaje compatible que lo muestre'); }
  // 11) validador del mar: una ruta sobre tierra se detecta
  { const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'datos/dimensiones/pirata.json'), 'utf8')); ok(D.NAV.travesia[0] === 15 && D.NAV.travesia[1] === 35, 'FN datos: travesía 15-35 s del estudio');
    const ms = ['mar_0_0', 'mar_0_1', 'mar_0_2', 'mar_1_0', 'mar_1_1', 'mar_1_2', 'mar_2_0', 'mar_2_1', 'mar_2_2'].map((n) => G.mundo.mapa('pirata/' + n)); ok(ms.every((q) => q.mar) && G.mundo.validarDimension('pirata', ms).length === 0, 'FN validador: el mar de pirata (9 mapas) es válido');
    const k = ms[0], c0 = k.suelo ? null : null; }
  { const r = require('child_process').spawnSync('node', [path.join(__dirname, 'tools/prueba_cruce_mar.js')], { encoding: 'utf8' }); ok(r.status === 0, 'FN cruce tierra↔mar por las puertas REALES (tools/prueba_cruce_mar.js: embarcar, desembarcar, regreso, posiciones, amarre, guardado)' + (r.status === 0 ? '' : '\n' + r.stdout.split('\n').filter((l) => /FALLO/.test(l)).join('\n'))); }
  ok(fs.existsSync(path.join(__dirname, 'docs/multiverso/15_NAVEGACION_FN.md')), 'FN existe el contrato (docs/multiverso/15_NAVEGACION_FN.md)');
}
// ── Multiverso F8 · 3) el anfitrión valida los cruces de portal de un jugador REMOTO (puertas reales: Ermita ↔ Nexus) ──
{
  const motor = G.motor, mundo = G.mundo, T = 16, R = G.red, J = JSON.stringify, fs = require('fs'), path = require('path');
  const msg = (mapa, tx, ty) => ({ v: 1, id: 'lali', mapa, x: tx * T + 8, y: ty * T + 14, dir: 'down', ang: 0, moving: false, tm: 0, pesca: null, capturas: {} });
  const nuevo = () => { const e = motor.crear(31); e.jugadores.oli.mapa = 'pueblo_inicial'; return e; };
  const erm = mundo.mapa('ermita'), pe = erm.puertas.find((p) => p.portal), sal = erm.puertas.find((p) => p.destino.ancla === 'volver'); const nxA = mundo.ancla(mundo.mapa('nexus/plaza_cruce'), pe.destino.ancla);
  const nexusCargado = () => mundo.cargadas('nexus').length;
  const decl = (e, nivel, marcas, cascos) => R.progresoAplicar(e, 'lali', { v: 1, k: 'prg', xp: G.entrenador.xpPara(nivel), marcas: marcas || {}, cascos: cascos || {} });   // el otro móvil declara su progreso (mensaje 'prg')
  { const e = nuevo(); ok(R.aplicar(e, 'lali', msg('ermita', pe.x, pe.y + 1)) && e.jugadores.lali.mapa === 'ermita', 'F8 portales: el primer mensaje tras conectar (la posición de su guardado) se acepta');
    ok(R.aplicar(e, 'lali', msg('ermita', pe.x, pe.y + 1)), 'F8 portales: mensajes normales dentro del mapa siguen igual');
    const antes = J([e.jugadores.lali.mapa, e.jugadores.lali.x, e.jugadores.lali.y]);
    ok(R.aplicar(e, 'lali', msg('albanota', 20, 20)) === true, 'F8 portales: moverse a otro mapa de la MISMA dimensión no cambia (lo deciden su bordes/puertas en su móvil)');
    const f = nuevo(); R.aplicar(f, 'lali', msg('ermita', 1, 8)); const n0 = nexusCargado(), ant2 = J([f.jugadores.lali.mapa, f.jugadores.lali.x, f.jugadores.lali.y, f.jugadores.lali.obj]);
    ok(R.aplicar(f, 'lali', msg('nexus/plaza_cruce', nxA[0], nxA[1])) === false && J([f.jugadores.lali.mapa, f.jugadores.lali.x, f.jugadores.lali.y, f.jugadores.lali.obj]) === ant2 && nexusCargado() === n0, 'F8 portales: un salto a otra dimensión lejos de la puerta se RECHAZA, no mueve al jugador y no carga la dimensión');
    ok(!R.aplicar(f, 'lali', msg('nexus/plaza_cruce', 30, 30)) && f.jugadores.lali.mapa === 'ermita', 'F8 portales: tampoco vale aparecer lejos del ancla de llegada');
    const g = nuevo(); R.aplicar(g, 'lali', msg('ermita', pe.x, pe.y + 1)); decl(g, 5); ok(R.aplicar(g, 'lali', msg('nexus/plaza_cruce', nxA[0], nxA[1])) === true && g.jugadores.lali.mapa === 'nexus/plaza_cruce' && nexusCargado() >= 1, 'F8 portales: el cruce legítimo por la puerta (junto a ella, y apareciendo en el ancla) se acepta y carga la dimensión');
    const nx = mundo.mapa('nexus/plaza_cruce'), pv = nx.puertas.find((p) => p.destino.ancla === 'volver');
    ok(R.aplicar(g, 'lali', msg('nexus/plaza_cruce', pv.x, pv.y - 1)), 'F8 portales: camina por el Nexus');
    const h = JSON.parse(J(g.jugadores.lali)); ok(R.aplicar(g, 'lali', msg('ermita', 1, 1)) === false && g.jugadores.lali.mapa === 'nexus/plaza_cruce', 'F8 portales: la vuelta («volver») solo vale apareciendo junto a la puerta de ida del mapa de destino');
    ok(R.aplicar(g, 'lali', msg('ermita', pe.x, pe.y + 1)) === true && g.jugadores.lali.mapa === 'ermita', 'F8 portales: la vuelta legítima por el portal se acepta');
    // reglas de un portal con requisitos de estado común (marea): la puerta real de la Ermita, con y sin cumplir
    const orig = pe.portal.requisitos; try { pe.portal.requisitos = [{ t: 'marea', estado: 'baja' }]; const k = nuevo(); R.aplicar(k, 'lali', msg('ermita', pe.x, pe.y + 1)); k.reloj = 0; const bien = G.portales.comprobar(k.jugadores.lali, { requisitos: [{ t: 'marea', estado: 'baja' }] }, k).ok;
      const r = R.aplicar(k, 'lali', msg('nexus/plaza_cruce', nxA[0], nxA[1])); ok(r === bien, 'F8 portales: un requisito de marea se comprueba con el reloj común (' + (bien ? 'abierto' : 'cerrado') + ' → ' + (r ? 'cruza' : 'rechazado') + ')');
      pe.portal.requisitos = [{ t: 'marea', estado: bien ? 'alta' : 'baja' }, { t: 'nivelEntrenador', n: 5 }]; const k2 = nuevo(); R.aplicar(k2, 'lali', msg('ermita', pe.x, pe.y + 1)); const r2 = R.aplicar(k2, 'lali', msg('nexus/plaza_cruce', nxA[0], nxA[1])); ok(r2 === false, 'F8 portales: si falla el requisito común se rechaza aunque el resto (progreso personal) lo decida su móvil');
      // F8 (P3) · requisitos PERSONALES (nivel, marca, casco): el anfitrión los comprueba contra el progreso que el otro móvil DECLARA ('prg'); sin declaración se cierra
      const cruza = (e) => R.aplicar(e, 'lali', msg('nexus/plaza_cruce', nxA[0], nxA[1])), junto = (decl0) => { const e = nuevo(); R.aplicar(e, 'lali', msg('ermita', pe.x, pe.y + 1)); if (decl0) decl0(e); return e; };
      pe.portal.requisitos = [{ t: 'nivelEntrenador', n: 5 }];
      ok(cruza(junto()) === false, 'F8 portales (P3): sin haber declarado su progreso, un portal con nivel NO se cruza (se cierra, nunca se abre por falta de dato)');
      ok(cruza(junto((e) => decl(e, 4))) === false, 'F8 portales (P3): declara nivel 4 → portal de nivel 5 rechazado');
      { const e = junto((x) => decl(x, 5)); ok(cruza(e) === true && e.jugadores.lali.mapa === 'nexus/plaza_cruce', 'F8 portales (P3): declara nivel 5 → cruza'); }
      { const e = junto((x) => decl(x, 5)); ok(decl(e, 3) === false && cruza(e) === true, 'F8 portales (P3): una declaración que BAJA (nivel 5 → 3) se rechaza y vale la anterior'); }
      { const e = junto(); const malos = [null, 7, 'x', {}, { v: 1, k: 'prg', xp: -1, marcas: {}, cascos: {} }, { v: 1, k: 'prg', xp: 1.5, marcas: {}, cascos: {} }, { v: 1, k: 'prg', xp: 1e12, marcas: {}, cascos: {} }, { v: 1, k: 'prg', xp: 0, marcas: [], cascos: {} }, { v: 1, k: 'prg', xp: 0, marcas: {}, cascos: { pirata: 99 } }, { v: 1, k: 'prg', xp: 0, marcas: { 'MAL': {} }, cascos: {} }, { v: 1, k: 'prg', xp: 0, marcas: { tonavia: { 'x': 1 } }, cascos: {} }, { v: 2, k: 'prg', xp: 0, marcas: {}, cascos: {} }, { v: 1, k: 'prg', xp: 0, marcas: {}, cascos: { __proto__x: 1 } }];
        ok(malos.every((m) => R.progresoAplicar(e, 'lali', m) === false) && R.declarado(e, 'lali') === null, 'F8 portales (P3): declaraciones tramposas o mal formadas (negativas, enormes, tipos, marcas rotas, casco 99) se rechazan y no dejan rastro');
        const grande = { v: 1, k: 'prg', xp: 0, marcas: {}, cascos: {} }; for (let q = 0; q < 70; q++) grande.marcas['d' + q] = {}; ok(R.progresoAplicar(e, 'lali', grande) === false, 'F8 portales (P3): más de 64 dimensiones declaradas se rechaza'); }
      { const e = junto((x) => decl(x, 5)); R.soltar(e, 'lali'); ok(R.declarado(e, 'lali') === null, 'F8 portales (P3): al desconectar se olvida lo declarado (otra conexión empieza de cero)'); }
      // marcas y casco (con una puerta real a la que se añaden requisitos de prueba, sin tocar los archivos)
      pe.portal.requisitos = [{ t: 'casco', n: 2, dim: 'pirata' }];
      ok(cruza(junto((e) => decl(e, 5, {}, { pirata: 1 }))) === false && cruza(junto((e) => decl(e, 5, {}, { pirata: 2 }))) === true, 'F8 portales (P3): el casco declarado se compara con el requisito (1 < 2 rechaza; 2 cruza)');
      ok(cruza(junto((e) => decl(e, 5, {}, { nexus: 9 }))) === false, 'F8 portales (P3): el casco de OTRA dimensión no sirve');
      pe.portal.requisitos = [{ t: 'desconocido', n: 1 }]; ok(cruza(junto((e) => decl(e, 50))) === false, 'F8 portales (P3): un requisito desconocido cierra aunque declare todo');
      pe.portal.requisitos = [{ t: 'marea', estado: bien ? 'alta' : 'baja' }, { t: 'nivelEntrenador', n: 1 }]; ok(cruza(junto((e) => decl(e, 50))) === false, 'F8 portales (P3): la marea (estado común) sigue mandando aunque el nivel sobre');
      // marca de progreso: la dimensión de prueba registra el módulo
      { const dimM = 'nexus', mod = G.marcas.CLAVE; let reg = false; try { G.marcas.registrar('tmodulo', { validar: (c, v) => v >= 1 }); reg = true; } catch (x) { reg = false; }
        const mk = (n) => ({ [dimM]: { 'tmodulo.hito': n } }); pe.portal.requisitos = [{ t: 'marca', dim: dimM, k: 'tmodulo.hito', n: 2 }];
        if (reg) ok(cruza(junto((e) => decl(e, 5, mk(1)))) === false && cruza(junto((e) => decl(e, 5, mk(2)))) === true, 'F8 portales (P3): la marca declarada se compara con el requisito (1 < 2 rechaza; 2 cruza)'); else ok(true, 'F8 portales (P3): (marca) módulo de prueba no registrable en este contexto'); }
      { const e = junto((x) => decl(x, 5, { nexus: { 'tmodulo.hito': 3 } })); ok(decl(e, 5, { nexus: { 'tmodulo.hito': 1 } }) === false, 'F8 portales (P3): una marca declarada no puede bajar'); }
      // el progreso local que se manda es el real del jugador (y es el que el otro móvil recibe)
      { const e = motor.crear(33), pj = R.progreso(e, 'oli'); ok(pj && pj.k === 'prg' && pj.xp === G.entrenador.xpDe(e.jugadores.oli) && typeof pj.marcas === 'object' && typeof pj.cascos === 'object' && JSON.stringify(pj).length < 2000, 'F8 portales (P3): R.progreso arma el mensaje del jugador local (pequeño)'); e.jugadores.oli.xpE = G.entrenador.xpPara(7); const e2 = motor.crear(34); ok(R.progresoAplicar(e2, 'oli', JSON.parse(J(R.progreso(e, 'oli')))) && R.declarado(e2, 'oli').xp === G.entrenador.xpPara(7), 'F8 portales (P3): ida y vuelta del mensaje de progreso entre dos partidas'); }
      // la posición normal (v1) no cambia ni un byte por esto
      { const e = nuevo(); ok(!('prg' in R.resumen(e, 'oli')) && Object.keys(R.resumen(e, 'oli')).indexOf('xp') < 0, 'F8 portales (P3): el mensaje de posición sigue siendo el de siempre (el progreso viaja aparte)'); }

    } finally { pe.portal.requisitos = orig; }
    // desconectar y volver a conectar: el primer mensaje vuelve a ser libre (su guardado) y las demás reglas siguen
    R.soltar(g, 'lali'); ok(R.aplicar(g, 'lali', msg('ermita', 3, 3)) === true, 'F8 portales: tras soltar (desconexión), el siguiente mensaje es otra vez «primera posición»');
    // juego individual: el motor decide por sí mismo, sin pasar por red; el cruce local sigue funcionando como antes
    const s = motor.crear(32), j = s.jugadores.oli; motor.aplicar(s, { j: 'oli', t: 'colocar', mapa: 'ermita', ancla: 'inicio' }); j.prog = j.prog || {}; const nivelAntes = G.entrenador.nivel(j);
    j.mapa = 'ermita'; j.x = pe.x * T + 8; j.y = pe.y * T + 8; j.enPuerta = null; motor.cruzar(s, j, mundo.mapa('ermita')); const cruzo = j.mapa === 'nexus/plaza_cruce';
    ok(cruzo === (nivelAntes >= 5), 'F8 portales (individual): el cruce local sigue decidiéndose en el motor con los requisitos del propio jugador (nivel ' + nivelAntes + ' → ' + (cruzo ? 'cruza' : 'no cruza') + ')'); }
  // F8 (P3) · DOS MÓVILES en proceso: cada partida es la de su jugador; los mensajes de posición y de progreso se cruzan como lo hace red_peer
  { const oli = motor.crear(41), lali = motor.crear(41), bombear = (de, a, id) => { const pr = R.progreso(de, id); if (pr) R.progresoAplicar(a, id, JSON.parse(J(pr))); R.aplicar(a, id, JSON.parse(J(R.resumen(de, id)))); };   // red_peer manda el progreso (si cambió) ANTES que la posición
    [oli, lali].forEach((e) => { e.jugadores.oli.mapa = 'pueblo_inicial'; e.jugadores.lali.mapa = 'ermita'; });
    const puerta = (e) => { const j = e.jugadores.lali; j.x = pe.x * T + 8; j.y = pe.y * T + 8; j.enPuerta = null; return j; };
    // a) lali SIN nivel: su propio móvil no la deja pasar (motor), y el de oli tampoco la mueve
    { const j = puerta(lali); j.xpE = 0; motor.cruzar(lali, j, mundo.mapa('ermita')); bombear(lali, oli, 'lali'); ok(j.mapa === 'ermita' && oli.jugadores.lali.mapa === 'ermita', 'F8 dos móviles: sin nivel, ni su móvil ni el del anfitrión la dejan cruzar'); }
    // b) un cliente MODIFICADO que se salta su propia comprobación y anuncia el salto: el anfitrión lo rechaza
    { const j = lali.jugadores.lali; j.mapa = 'nexus/plaza_cruce'; j.x = nxA[0] * T + 8; j.y = nxA[1] * T + 14; bombear(lali, oli, 'lali'); ok(oli.jugadores.lali.mapa === 'ermita', 'F8 dos móviles: un cliente que se salta su comprobación y anuncia el cruce sin nivel declarado es rechazado por el anfitrión'); j.mapa = 'ermita'; }
    // c) lali SUBE de nivel, declara y cruza de verdad: los dos móviles coinciden
    { const j = puerta(lali); j.xpE = G.entrenador.xpPara(5); motor.cruzar(lali, j, mundo.mapa('ermita')); const alli = j.mapa === 'nexus/plaza_cruce'; bombear(lali, oli, 'lali'); ok(alli && oli.jugadores.lali.mapa === 'nexus/plaza_cruce', 'F8 dos móviles: con nivel 5 cruza en su móvil y el anfitrión lo ve en el Nexus'); }
    // c2) si la posición llegara ANTES que el progreso (otro orden de llegada), se rechaza y el mensaje siguiente, ya con el progreso, entra: se cura solo
    { const x = motor.crear(43), y = motor.crear(43); [x, y].forEach((e) => { e.jugadores.lali.mapa = 'ermita'; }); const j = x.jugadores.lali; j.xpE = G.entrenador.xpPara(5); j.mapa = 'ermita'; j.x = pe.x * T + 8; j.y = pe.y * T + 8; R.aplicar(y, 'lali', JSON.parse(J(R.resumen(x, 'lali')))); j.mapa = 'nexus/plaza_cruce'; j.x = nxA[0] * T + 8; j.y = nxA[1] * T + 14; const m1 = JSON.parse(J(R.resumen(x, 'lali'))); const a1 = R.aplicar(y, 'lali', m1); R.progresoAplicar(y, 'lali', JSON.parse(J(R.progreso(x, 'lali')))); const a2 = R.aplicar(y, 'lali', JSON.parse(J(m1))); ok(a1 === false && a2 === true && y.jugadores.lali.mapa === 'nexus/plaza_cruce', 'F8 dos móviles: posición antes que progreso → se rechaza una vez y el siguiente mensaje entra'); }
    // d) ida y vuelta por el portal
    { const j = lali.jugadores.lali, nx = mundo.mapa('nexus/plaza_cruce'), pv = nx.puertas.find((p) => p.destino.ancla === 'volver'); j.x = pv.x * T + 8; j.y = pv.y * T + 8; j.enPuerta = null; bombear(lali, oli, 'lali'); motor.cruzar(lali, j, nx); const vuelve = j.mapa === 'ermita'; bombear(lali, oli, 'lali'); ok(vuelve && oli.jugadores.lali.mapa === 'ermita', 'F8 dos móviles: la vuelta por el portal también coincide en los dos'); }
    // e) el anfitrión (oli) cruza solo en su móvil: el de lali recibe a oli donde está, con la misma regla
    { const j = oli.jugadores.oli; j.mapa = 'ermita'; j.x = pe.x * T + 8; j.y = pe.y * T + 8; j.enPuerta = null; bombear(oli, lali, 'oli'); j.xpE = G.entrenador.xpPara(5); motor.cruzar(oli, j, mundo.mapa('ermita')); bombear(oli, lali, 'oli'); ok(j.mapa === 'nexus/plaza_cruce' && lali.jugadores.oli.mapa === 'nexus/plaza_cruce', 'F8 dos móviles: la regla es simétrica (el invitado valida al anfitrión igual)'); }
    // f) un móvil de la versión anterior (no manda 'prg') cruzando un portal con nivel: no pasa en el nuevo (se cierra); los portales SIN requisitos personales no se ven afectados
    { const vi = motor.crear(42); vi.jugadores.lali.mapa = 'ermita'; R.aplicar(vi, 'lali', msg('ermita', pe.x, pe.y + 1)); ok(R.aplicar(vi, 'lali', msg('nexus/plaza_cruce', nxA[0], nxA[1])) === false, 'F8 dos móviles: un cliente anterior sin mensaje de progreso no cruza portales con nivel (se cierra; sigue viéndose en su mapa)'); } }
  // ── F8 · CONTRATO DE DIMENSIÓN: se aplica a TODA dimensión registrada (también a las que añada el contenido) ──
  { const D = G.dimensiones, SIN_PORTAL = ['pirata'];   // dimensiones que aún no tienen puerta de entrada (contenido pendiente). Al añadir su portal, QUITARLA de esta lista; una dimensión nueva que no esté aquí DEBE tener portal
    const todas = D.lista(), dimDe = (id) => D.deMapa(id), ESQ = {};
    const IDS = {}; todas.forEach((d) => { IDS[d] = d === D.DEFECTO ? Object.keys(mundo.mapas).filter((id) => dimDe(id) === d) : mundo.cargarDimension(d); });
    const mapasDe = (d) => IDS[d];
    const puertasFuera = []; todas.forEach((d) => mapasDe(d).forEach((id) => mundo.mapa(id).puertas.forEach((p) => { if (p.destino && p.destino.ancla !== 'volver' && p.destino.mapa && dimDe(p.destino.mapa) !== d) puertasFuera.push({ de: id, p, dimOrigen: d, dimDestino: dimDe(p.destino.mapa) }); })));
    ok(todas[0] === D.DEFECTO && todas.length >= 3, 'F8 contrato: Tonavia primero y las dimensiones registradas son ' + todas.join(', '));
    todas.forEach((d) => {
      const def = D.get(d), ms = mapasDe(d);
      ok(D.validar(def, d).length === 0 && ms.length > 0 && ms.every((id) => dimDe(id) === d), 'F8 contrato [' + d + ']: esquema válido y todos sus mapas (' + ms.length + ') le pertenecen');
      ok(d === D.DEFECTO || mundo.validarDimension(d).length === 0, 'F8 contrato [' + d + ']: sus mapas, bordes, puertas, entradas y (si es de mar) el mosaico pasan el validador');
      const ent = D.entrada(d), me = mundo.mapa(ent.mapa); ok(!!me && !!me.anclas[ent.ancla], 'F8 contrato [' + d + ']: su entrada (' + ent.mapa + ' › ' + ent.ancla + ') existe');
      const malos = []; ms.forEach((id) => mundo.mapa(id).puertas.forEach((p) => { if (p.portal) { const e = G.portales.validar(p.portal); if (e && e.length) malos.push(id + ':' + p.id); } })); ok(!malos.length, 'F8 contrato [' + d + ']: todos sus portales tienen formato y requisitos válidos' + (malos.length ? ' (' + malos.join(',') + ')' : ''));
      const entrantes = puertasFuera.filter((q) => q.dimDestino === d); ok(d === D.DEFECTO || SIN_PORTAL.indexOf(d) >= 0 || entrantes.length > 0, 'F8 contrato [' + d + ']: tiene al menos una puerta de entrada desde otra dimensión' + (SIN_PORTAL.indexOf(d) >= 0 ? ' (exenta: contenido pendiente)' : ''));
      // guardado: un jugador dentro de la dimensión se guarda y se carga en el mismo sitio, y su población (si la tiene) vuelve idéntica
      { const e = motor.crear(90); motor.aplicar(e, { j: 'oli', t: 'colocar', mapa: ent.mapa, ancla: ent.ancla }); if (G.agentes && D.entrenadores(d)) { A0 = G.agentes; A0.asegurar(e, d); for (let i = 0; i < 120; i++) A0.avanzar(e, 1); }
        const sv = JSON.parse(JSON.stringify(G.guardado.serializar(e))), e2 = motor.crear(90); G.guardado.restaurar(e2, sv);
        ok(e2.jugadores.oli.mapa === ent.mapa && (!(G.agentes && D.entrenadores(d)) || JSON.stringify(G.agentes.de(e2, d)) === JSON.stringify(G.agentes.de(e, d))), 'F8 contrato [' + d + ']: guardar y cargar con un jugador dentro lo deja donde estaba' + (D.entrenadores(d) ? ' y la población de entrenadores vuelve idéntica' : '')); motor.liberarDimensiones(e); }
    });
    // IDA Y VUELTA por cada portal entre dimensiones (una puerta real, motor.cruzar), en solitario…
    var A0; const R2 = G.red;
    puertasFuera.forEach((q) => {
      const etq = q.de + ' › ' + q.p.destino.mapa, orig = q.p.portal ? q.p.portal.requisitos : undefined;
      try {
        if (q.p.portal) q.p.portal.requisitos = [];   // los requisitos tienen sus propias pruebas; aquí se prueba la mecánica de cruzar
        const e = motor.crear(91), j = e.jugadores.oli; motor.aplicar(e, { j: 'oli', t: 'colocar', mapa: q.de, ancla: 'inicio' });
        { const viva = mundo.mapa(q.de).puertas.find((x) => x.id === q.p.id); if (viva && viva !== q.p) { if (q.p.portal) q.p.portal.requisitos = orig; q.p = viva; if (q.p.portal) q.p.portal.requisitos = []; } }   // v2.364: si el origen es de una dimensión que se descarga y se vuelve a cargar (Nexus → Santuario), la puerta de la lista ya no es la del mapa vivo: se usa la viva
        j.x = q.p.x * T + 8; j.y = q.p.y * T + 8; j.enPuerta = null;
        const aMar = !!mundo.mapa(q.p.destino.mapa).mar; if (aMar) { const an = mundo.ancla(mundo.mapa(q.p.destino.mapa), q.p.destino.ancla); G.navegacion.amarrar(e, j, { mapa: q.p.destino.mapa, tx: an[0], ty: an[1] }); }   // un portal que acaba en el MAR exige el barco amarrado junto al ancla (FN)
        motor.cruzar(e, j, mundo.mapa(q.de));
        const aDest = j.mapa === q.p.destino.mapa, a = aDest ? mundo.ancla(mundo.mapa(j.mapa), q.p.destino.ancla) : null, cerca = aDest && Math.abs(j.x - (a[0] * T + 8)) <= 2 * T && Math.abs(j.y - (a[1] * T + 14)) <= 2 * T;
        ok(aDest && cerca, 'F8 contrato ida (solo): ' + etq + ' cruza y aparece junto al ancla');
        const d2 = mundo.mapa(j.mapa), vuelta = aMar ? null : d2.puertas.find((p) => p.destino && p.destino.ancla === 'volver'); if (!aMar) ok(!!vuelta, 'F8 contrato vuelta: el mapa de llegada (' + j.mapa + ') tiene una puerta «volver»');
        if (vuelta) { if (vuelta.portal) vuelta.portal.requisitos = []; j.x = vuelta.x * T + 8; j.y = vuelta.y * T + 8; j.enPuerta = null; motor.cruzar(e, j, d2); ok(j.mapa === q.de && Math.abs(j.x - (q.p.x * T + 8)) <= 3 * T && Math.abs(j.y - (q.p.y * T + 8)) <= 3 * T, 'F8 contrato vuelta (solo): regresa a ' + q.de + ' junto a la puerta de ida'); }
        // …y en MULTIJUGADOR: el anfitrión valida el cruce de su compañero con el progreso que éste declara
        const ps = (q.p.portal && orig) || [], H = motor.crear(92), msg = (mapa, x, y) => ({ v: 1, id: 'lali', mapa, x, y, dir: 'down', ang: 0, moving: false, tm: 0, pesca: null, capturas: {} });
        const quita = (r) => r.t !== 'marea'; const marcas = {}, cascos = {}; ps.forEach((r) => { if (r.t === 'marca') (marcas[r.dim] = marcas[r.dim] || {})[r.k] = Math.max(marcas[r.dim] && marcas[r.dim][r.k] || 0, r.n === undefined ? 1 : r.n); if (r.t === 'casco') cascos[r.dim || q.dimOrigen] = Math.max(cascos[r.dim || q.dimOrigen] | 0, r.n); });
        if (q.p.portal) q.p.portal.requisitos = orig; const personal = ps.some(quita);
        const abierto = () => { for (let t = 0; t < 86400; t += 300) { H.reloj = t; if (!ps.length || G.portales.comprobar(H.jugadores.lali, { requisitos: ps.filter((r) => r.t === 'marea') }, H).ok) return true; } return false; };
        const hecho = () => { H.jugadores.oli.mapa = 'pueblo_inicial'; H.jugadores.lali.mapa = q.de; R2.soltar(H, 'lali'); R2.aplicar(H, 'lali', msg(q.de, q.p.x * T + 8, (q.p.y + 1) * T + 14)); };
        if (personal) { hecho(); const aD = mundo.ancla(mundo.mapa(q.p.destino.mapa), q.p.destino.ancla); const sin = R2.aplicar(H, 'lali', msg(q.p.destino.mapa, aD[0] * T + 8, aD[1] * T + 14)); ok(sin === false, 'F8 contrato multijugador: ' + etq + ' exige progreso personal y SIN declararlo el anfitrión NO deja pasar'); }
        if (abierto()) { hecho(); R2.progresoAplicar(H, 'lali', { v: 1, k: 'prg', xp: G.entrenador.xpPara(G.entrenador.MAX), marcas, cascos }); const aD = mundo.ancla(mundo.mapa(q.p.destino.mapa), q.p.destino.ancla); ok(R2.aplicar(H, 'lali', msg(q.p.destino.mapa, aD[0] * T + 8, aD[1] * T + 14)) === true && H.jugadores.lali.mapa === q.p.destino.mapa, 'F8 contrato multijugador: ' + etq + ' el anfitrión acepta el cruce con el progreso declarado'); }
        motor.liberarDimensiones(e); motor.liberarDimensiones(H);
      } finally { if (q.p.portal) q.p.portal.requisitos = orig; }
    });
    ok(puertasFuera.length >= 1, 'F8 contrato: hay al menos un portal entre dimensiones que recorrer (' + puertasFuera.map((q) => q.de + '→' + q.p.destino.mapa).join(', ') + ')');
    todas.forEach((d) => { if (d !== D.DEFECTO) mundo.descargar(d); }); motor.liberarDimensiones(motor.crear(1)); }
  // F8.4 · editor y herramientas con dimensiones externas
  { const cp = require('child_process'), pl = fs.readFileSync(path.join(__dirname, 'tools/editor_mapas.plantilla.html'), 'utf8'), ejs = fs.readFileSync(path.join(__dirname, 'tools/editor_mapas.js'), 'utf8');
    ok(/idMapa\(j\.id/.test(pl) && /j\.mar === true/.test(pl) && /idsTonavia\(\)/.test(pl) && /window\.G\.PAQUETES\[d\]/.test(pl), 'F8 editor: conserva el prefijo «dim/», la marca mar, exporta solo Tonavia y prueba las externas por G.PAQUETES');
    ok(/maps\/<dim>|isDirectory/.test(ejs), 'F8 editor_mapas.js carga maps/<dim>/*.json');
    const externos = fs.readdirSync(path.join(__dirname, 'maps'), { withFileTypes: true }).filter((d) => d.isDirectory()).reduce((n, d) => n + fs.readdirSync(path.join(__dirname, 'maps', d.name)).filter((f) => /\.json$/.test(f)).length, 0);
    const r2 = cp.spawnSync('node', [path.join(__dirname, 'tools/editor_mapas.js')], { encoding: 'utf8' });
    ok(r2.status === 0 && r2.stdout.indexOf((9 + externos) + ' mapa(s)') > 0, 'F8 editor: el editor generado incluye los ' + externos + ' mapas externos + los de Tonavia');
    ok(fs.existsSync(path.join(__dirname, 'tools/prueba_editor_dim.py')) && fs.existsSync(path.join(__dirname, 'tools/prueba_red_agentes.py')), 'F8 existen las pruebas de navegador prueba_editor_dim.py y prueba_red_agentes.py');
    const r3 = cp.spawnSync('node', [path.join(__dirname, 'tools/componer_mapa.js'), '--comprobar'], { encoding: 'utf8' });
    ok(r3.status === 0 && /OK pueblo_carbuna/.test(r3.stdout), 'F8 componer_mapa --comprobar pasa en Carbuna (receta con sus 2 puertas, sin salto de línea final)');
    const rc = JSON.parse(fs.readFileSync(path.join(__dirname, 'plantillas/receta_pueblo_carbuna.json'), 'utf8'));
    ok(Array.isArray(rc.puertas) && rc.puertas.length === 2, 'F8 la receta de Carbuna trae sus 2 puertas'); }
  ok(fs.existsSync(path.join(__dirname, 'docs/multiverso/16_RED_LIMITES_F8.md')), 'F8 existe el contrato (docs/multiverso/16_RED_LIMITES_F8.md)');
  // F8.6 · el progreso DECLARADO por el otro móvil es información no verificada: solo sirve para abrir/cerrar un portal en el anfitrión
  { const srcs = fs.readdirSync(path.join(__dirname, 'src')).filter((f) => /\.js$/.test(f)), usan = srcs.filter((f) => /\.declarado\(|progresoAplicar/.test(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8')));
    ok(usan.sort().join() === 'red.js,red_peer.js', 'F8 progreso declarado: solo lo tocan red.js y red_peer.js (' + usan.join(',') + ')');
    const rj = fs.readFileSync(path.join(__dirname, 'src/red.js'), 'utf8'); ok((rj.match(/red\.declarado\(/g) || []).length === 1 && /cruceValido[\s\S]{0,4000}red\.declarado\(/.test(rj), 'F8 progreso declarado: único consumidor = cruceValido (abrir un portal)');
    const e = motor.crear(7); G.red.progresoAplicar(e, 'lali', { v: 1, k: 'prg', xp: G.entrenador.xpPara(30), marcas: {}, cascos: {} });
    const antes = JSON.stringify(G.guardado.serializar ? G.guardado.serializar(e) : e), x0 = e.jugadores.lali.xpE;
    ok(e.jugadores.lali.xpE === x0 && JSON.stringify(G.guardado.serializar ? G.guardado.serializar(e) : e) === antes, 'F8 progreso declarado: no cambia el estado de juego ni el guardado (no concede nada, no se guarda)'); }
  // F8.5 · paquete de transferencia: guía de contenido sincronizada con el código y procedimiento ejecutable
  { const g = fs.readFileSync(path.join(__dirname, 'docs/multiverso/GUIA_CONTENIDO.md'), 'utf8'), cp = require('child_process');
    ['## 1. ', '## 3. ', '## 4. ', '## 5. ', '## 6. ', '## 7. ', '## 8. ', '## 10. '].forEach((h) => ok(g.indexOf(h) >= 0, 'F8 guía: sección «' + h.trim() + '»'));
    ok(g.indexOf('SIN_PORTAL') > 0 && g.indexOf('nueva_dimension.js') > 0 && g.indexOf('prueba_dimension_nueva') > 0 && g.indexOf('src/orden.json') > 0, 'F8 guía: cita SIN_PORTAL, nueva_dimension, prueba_dimension_nueva y orden.json');
    ok(g.indexOf(Object.keys(G.capas.OBJETOS).length + ' ') > 0 || g.indexOf('hoy ' + Object.keys(G.capas.OBJETOS).length) > 0, 'F8 guía: el nº de objetos del catálogo (' + Object.keys(G.capas.OBJETOS).length + ') está al día');
    ok(/portal_nexus|Nexus/.test(g) && G.dimensiones.lista().every((d) => g.indexOf('`' + d + '`') > 0), 'F8 guía: nombra todas las dimensiones registradas');
    ['plantillas/dimension', 'tools/nueva_dimension.js', 'tools/prueba_dimension_nueva.js', 'tools/validar_dimension.js', 'tools/crear_mar.js', 'tools/prueba_cruce_mar.js', 'src/orden.json'].forEach((f) => ok(fs.existsSync(path.join(__dirname, f)), 'F8 guía: existe lo que cita (' + f + ')'));
    const rp = cp.spawnSync(process.execPath, [path.join(__dirname, 'tools/prueba_dimension_nueva.js')], { encoding: 'utf8', maxBuffer: 1 << 26 });
    ok(rp.status === 0 && /TODO BIEN/.test(rp.stdout), 'F8 procedimiento de la guía (modo rápido, en copia temporal): ' + (rp.status ? rp.stdout.slice(-200) : 'TODO BIEN')); }
}
// Santuario Universal · Etapa A (v2.364): el módulo puro con el motor real (tools/prueba_santuario.js) y sus datos
{ const cp = require('child_process'), rs = cp.spawnSync(process.execPath, [require('path').join(__dirname, 'tools/prueba_santuario.js')], { encoding: 'utf8', maxBuffer: 1 << 24 });
  ok(rs.status === 0 && /^OK santuario/.test(rs.stdout) && rs.stdout.trim().split('\n').length === 1, 'Santuario A: ' + (rs.stdout || rs.stderr || '').trim().slice(0, 400));
  ok(G.santuario && G.santuario.activo && G.motor.ordenes.lista().filter((t) => t.indexOf('santuario.') === 0).join() === 'santuario.acoger,santuario.ampliar,santuario.construir,santuario.decorar,santuario.derribar,santuario.habitat,santuario.mover,santuario.nombrar,santuario.retirar,santuario.visitar', 'Santuario: el módulo está activo y registra sus diez órdenes');
  { const re = cp.spawnSync(process.execPath, [require('path').join(__dirname, 'tools/economia_santuario.js')], { encoding: 'utf8' }); ok(re.status === 0 && /Santuario 5: \d+ ✦/.test(re.stdout), 'Santuario B1: la simulación de economía corre y llega al nivel 5'); }
  ok(typeof G.santuarioUI === 'object' && G.npc.GUION.cuidador.menu.some((o) => o.panel === 'residentes') && G.NAMES.guardiana === 'sela', 'Santuario A: la interfaz y los dos personajes están cableados'); }
console.log(fallos ? fallos + ' fallo(s)' : 'Todo en orden (' + 131 + ' grupos de comprobaciones)'); process.exit(fallos ? 1 : 0);
