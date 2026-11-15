// peces.js — los peces (v2.188; v2.192 = identidad de docs/FICHA_PECES.md): DATOS, elección con azar de la semilla y su dibujo 2D GENERADO por código (sin DOM ni Math.random).
// Los `id` NO cambian (están en los guardados y en lo que viaja entre los móviles). Zonas: 0 orilla · 1 media · 2 honda. `peso` = probabilidad relativa dentro de su zona; `kg` = rango de peso;
// `fuerza` = tirones de ritmo al sacarlo (0 = sale a la primera, como siempre) y `ritmo` = segundos entre tirones. `forma` guía el dibujo: L largo y H alto en px de 2D, cola, aleta dorsal, barbillas, manchas, escamas, ondula.
(function (root) {
  'use strict';
  const G = root.G, T = 16;
  const PECES = {
    pez_plateado: { oculto: true, nombre: 'Alburno', zona: 0, peso: 70, kg: [0.02, 0.06], fuerza: 0, ritmo: 0, color: '#b9d0de', forma: { L: 9, H: 3, cola: 'horq', dorsal: false },
      pal: { luz: '#e6f0f6', base: '#b9d0de', sombra: '#7f9db3', vientre: '#f4f9fb', aleta: '#9fb7c9', extra: '#7f9db3', ojo: '#2a1b30' } },
    pez_gobio: { oculto: true, nombre: 'Gobio ámbar', zona: 0, peso: 30, kg: [0.05, 0.15], fuerza: 0, ritmo: 0, color: '#d9a441', forma: { L: 10, H: 4, cola: 'red', dorsal: true, barbas: true, manchas: true },
      pal: { luz: '#f0cf86', base: '#d9a441', sombra: '#a8732b', vientre: '#f6e6bd', aleta: '#c4852f', extra: '#7a5320', ojo: '#2a1b30' } },
    pez_carpa: { oculto: true, nombre: 'Carpa espejo', zona: 1, peso: 65, kg: [1.5, 6], fuerza: 2, ritmo: 0.95, color: '#4a86c5', forma: { L: 15, H: 7, cola: 'horq', dorsal: true, escamas: true },
      pal: { luz: '#7fb0e0', base: '#4a86c5', sombra: '#2d5a94', vientre: '#9cc4e8', aleta: '#2d5a94', extra: '#d7ecff', ojo: '#2a1b30' } },
    pez_trucha: { oculto: true, nombre: 'Trucha salmonada', zona: 1, peso: 35, kg: [0.4, 1.8], fuerza: 2, ritmo: 0.6, color: '#e8907a', forma: { L: 13, H: 4, cola: 'horq', dorsal: true, manchas: true, franja: true },
      pal: { luz: '#f3b5a3', base: '#e8907a', sombra: '#b8624f', vientre: '#fbd9cc', aleta: '#d57a63', extra: '#5a3a3a', ojo: '#2a1b30', lomo: '#8aa08c' } },
    pez_anguila: { oculto: true, nombre: 'Anguila negra', zona: 2, peso: 100, kg: [0.8, 3], fuerza: 3, ritmo: 0.55, color: '#2f2a3d', forma: { L: 20, H: 2, cola: 'red', ondula: true },
      pal: { luz: '#7a5fb0', base: '#2f2a3d', sombra: '#1b1824', vientre: '#8a8696', aleta: '#1b1824', extra: '#7a5fb0', ojo: '#e8e0a0' } },
  };
  // v2.201: `oculto: true` = fuera del juego (no se elige al pescar ni sale en la colección).
  // v2.200: peces DIBUJADOS A MANO píxel a píxel (prototipo aprobado por el usuario: `docs/archivo/capturas/pesca_v2_180_a_v2_208/pez_cirujano_propuesta.png`). Cada uno es una tabla de píxeles (`filas`, un carácter por color de `pal`, «.» = vacío) con su contorno ya incluido; en 3D se usan como lámina que mira a la cámara (`sprite3d`).
  const PIXELES = {
    pez_cirujano: {
      pal: { a: '#584a1a', b: '#4e370f', c: '#f7cf4a', d: '#d99a2b', e: '#0c1638', f: '#243f9e', g: '#294057', h: '#74b4f2', i: '#3a73d6', j: '#1c3480', k: '#ffffff', l: '#141a33', m: '#14294d', n: '#cbe8ff', o: '#1a2347', p: '#49535b' },
      filas: [
        '.........aba.......',
        '.b......acdca......',
        'bdb....bdcdcdb.....',
        'acca...ebfffffeg...',
        'bdddb.efffffffhhg..',
        '.bcccaiihhhijiklim.',
        '..addiiiiiiijilliim',
        '..accihfffffjfnnhhg',
        '..bddihhhhhccchhog.',
        '.acccmhhhnnddnnnhg.',
        'bddda.gnnnnnnnnng..',
        'accb...ppnnnnnpp...',
        'bda.....acccpp.....',
        '.b.......ada.......',
        '..........b........' ] },
    // v2.210: LOTE 1 de fauna marina, dibujado a mano (docs/lote1_revision2_x14.png). `cola` = columnas que bajan 1 px en el 2.º fotograma; `punta` = fila desde la que las puntas de los tentáculos se juntan (Pulpo).
    pez_sardina: {
      cola: 3, pal: { a: '#2d3f4a', b: '#102230', c: '#1f303d', d: '#7fb0cf', e: '#3c4b53', f: '#253744', g: '#2f5f86', h: '#a9d3e8', i: '#2f414c', j: '#1c303e', k: '#4f86ad', l: '#1a2e3c', m: '#ffffff', n: '#141a33', o: '#5d9bc2', p: '#213745', q: '#1f3f63', r: '#14294d', s: '#070e1b', t: '#303f49', u: '#e4f2f8', v: '#2c323a', w: '#525759' },
      filas: [
        '.......aaa.......',
        '.a...bcdddceee...',
        'adf.bgggggghhhi..',
        'jkklgggggghmnoop.',
        'addooqoqoohnnors.',
        'jkktuuuuuuuuuuv..',
        'adf.wuukkuuuww...',
        '.a...wwjjwww.....' ] },
    pez_payaso: {
      cola: 3, pal: { a: '#461c05', b: '#2b1306', c: '#c4500f', d: '#572b09', e: '#512e11', f: '#331a08', g: '#2b1a14', h: '#fff3dc', i: '#ffb44f', j: '#f27a1a', k: '#593612', l: '#5b3f1e', m: '#ffb054', n: '#583210', o: '#ffffff', p: '#141a33', q: '#4e2407', r: '#0f0907', s: '#513a2a' },
      filas: [
        '......aaaaa.....',
        '.a...bcccccbd...',
        'ace.fghgighgjk..',
        'lmmnjghgighgiik.',
        'lmmjjghgjghgopjd',
        'lmmjjghgjghgppjd',
        'lmmnjghgjghgjcq.',
        'lmmlfghgcghgca..',
        'ace..rsccccba...',
        '.a.....aaaa.....' ] },
    pez_dorada: {
      cola: 3, pal: { a: '#1c2128', b: '#1d232a', c: '#4e5d70', d: '#1e252d', e: '#56687d', f: '#383321', g: '#e3b43c', h: '#514015', i: '#423d2b', j: '#8fa3b5', k: '#1a2a3d', l: '#c7d6e2', m: '#ffffff', n: '#141a33', o: '#333a41', p: '#7a8ea3', q: '#090f15', r: '#e8f0f5', s: '#535658', t: '#373b40' },
      filas: [
        '......aaaaaa.....',
        '.....bccccccb....',
        '.a..deeeeeeeef...',
        'acadeeeeeeeeggh..',
        'accjjjjjjkjlmnjjo',
        '.acjjpjppkplnnjjo',
        'accllllllklllllkq',
        'accrrrrrrrrrrrrrs',
        'acasrrrrrrrrrrrs.',
        '.....stcccctss...',
        '.......acca......',
        '........aa.......' ] },
    pez_globo: {
      cola: 2, pal: { a: '#57523f', b: '#f4e6b0', c: '#4b4531', d: '#3e3823', e: '#8a7a3a', f: '#a89350', g: '#3d361b', h: '#f7e9a0', i: '#4c462e', j: '#c9b25c', k: '#5e4a1c', l: '#ffffff', m: '#141a33', n: '#40391e', o: '#b39f55', p: '#524c34', q: '#4d452b', r: '#d8c27a', s: '#efe2a6', t: '#56513b', u: '#5a3d14', v: '#201507', w: '#fbf5dc', x: '#5a584f', y: '#595649', z: '#585444' },
      filas: [
        '.....aaaa.....',
        '...aabccbaa...',
        '..abdeeeedba..',
        '..ageefhhhga..',
        '.ibjkjjhlmjba.',
        'noojjkfhmmjp..',
        'qrrsfsohhhsst.',
        'noosssossssuv.',
        '.ibwkwwkwwwba.',
        '..axwwkwwwxa..',
        '..abywwwwyba..',
        '...aabzzbaa...',
        '.....aaaa.....',
        '..............' ] },
    cri_pulpo: {
      punta: 11, pal: { b: '#411926', c: '#e07a94', d: '#b5476a', e: '#8f3a5f', f: '#f5e08a', g: '#141a33', h: '#ffffff', j: '#f4b9c4' },
      filas: [
        '.....bbbbb.....',
        '...bbccdddbb...',
        '..bcccddddddb..',
        '.bcdddddddddeb.',
        '.bdddddddddddb.',
        '.bdddddddddddb.',
        'bdfffdddddfffdb',
        'bdfhgdddddfhgdb',
        'bdfffdddddfffdb',
        '.bddddeeeddddb.',
        '.bdddbdddbdddb.',
        '.bdjdbdjdbdjdb.',
        '..bdb.bdb.bdb..',
        '..bjb.bjb.bjb..',
        '...b...b...b...' ] },
    // v2.215: LOTE 2 de fauna marina (8 criaturas dibujadas a mano, docs/bloque_final_8.png). Mismo método que el lote 1.
    pez_morena: {
      cola: 4, pal: { a: '#141a33', b: '#162114', c: '#27351f', d: '#2a1a14', e: '#3a472a', f: '#3c4729', g: '#3e5427', h: '#6f8c47', i: '#7a3318', j: '#a3bd66', k: '#a9bd62', l: '#e0703c', m: '#e6cf5a', n: '#e8d36a', o: '#ff9a4a', p: '#ffffff' },
      filas: [
        '..............fff...',
        '.........l.eeeeffee.',
        'ol.......oeejjjnjjeb',
        'iii....l.iejjjnpahgb',
        'ffff.l.oeejjhhhaahgb',
        'ejffco.iejjhhggggddb',
        'ejhmcifejmmhggbbbbb.',
        'eehmhkkjjjmggbb.....',
        '.ehhhmmjjgggbb......',
        '.eehhhmhggbbb.......',
        '..cccggggbb.........',
        '....bbbbbb..........' ] },
    pez_espada: {
      cola: 4, pal: { a: '#141a33', b: '#2a3a5a', c: '#2b4c8c', d: '#2f4f8a', e: '#3b63a8', f: '#4b74b8', g: '#4f7fc0', h: '#6a98d2', i: '#9aa6b8', j: '#e3ecf4', k: '#e8d36a', l: '#ffffff' },
      filas: [
        '........cccc........',
        'cccc....cffcc.......',
        'cffccccccfffccc.....',
        'ccffceeeeeeeekccc...',
        '.cffeeeeeedeklaecccc',
        '.cffhhhhhhghkaaeeiic',
        '.cffhhhhhhhhhhhhbccc',
        '.cffjjjjjjjjjjjjcc..',
        'ccffcjjjjjjjjjccc...',
        'cffccccccffcccc.....',
        'cccc....cccc........',
        '....................' ] },
    pez_loro: {
      cola: 4, pal: { a: '#0b3439', b: '#141a33', c: '#164541', d: '#176b72', e: '#1a3a40', f: '#1f8a8f', g: '#2a8f86', h: '#3fb8a4', i: '#563426', j: '#563c2a', k: '#573c43', l: '#6fd0b8', m: '#8fe0cc', n: '#f08a5a', o: '#f0a064', p: '#f2a0aa', q: '#f4e08a', r: '#f7c4cb', s: '#ffffff' },
      filas: [
        '......jjjjj........',
        '.....jjooojjjj.....',
        '.....jooooooojaaa..',
        'iiiiaaffffffffffaa.',
        'inniaffffdffdfqffa.',
        'iinnffdfffffgqsbfaa',
        '.innfhhhlhhhgqbbmaa',
        '.innhhhlhhlhgheccaa',
        '.innpphhhhhhpppppk.',
        '.inipppprpprpppppk.',
        '.iiikpppppppppppkk.',
        '....kkkppppkkkkkk..',
        '......kkkkkk.......',
        '...................' ] },
    pez_mero: {
      cola: 4, pal: { a: '#141a33', b: '#2b2318', c: '#32291a', d: '#3f3422', e: '#4a2e18', f: '#4c3e27', g: '#524a37', h: '#56513f', i: '#5a3d22', j: '#7a5a34', k: '#8c6a38', l: '#a77c47', m: '#a9824a', n: '#b08a4e', o: '#d5a55e', p: '#e6c689', q: '#e8d36a', r: '#f0d9a0', s: '#ffffff' },
      filas: [
        '.....ddcdcdcdcc...',
        '.....dnknknknkcb..',
        'ddccbbjjmmjjjjjbg.',
        'dnkcbjjmijmjqqjpgb',
        'dnkndjpjjijqsaqjjb',
        'cknknjpjjjjqaaqjjb',
        'cknknllllnlllllebb',
        'dnkndooooknoooooof',
        'dnkdfoooooopooooff',
        'ddccffrrrrrrrrrff.',
        '.....hhrrrrrrhhh..',
        '......hhrrrrhh....',
        '.......hhhhhh.....' ] },
    pez_raya: {
      cola: 4, pal: { a: '#141a33', b: '#151b28', c: '#222936', d: '#333a48', e: '#3c4560', f: '#5f6a86', g: '#8e9ab8', h: '#aab4cc', i: '#ffffff' },
      filas: [
        '.......ddddd......',
        '....ddddgggdddd...',
        '...ddgggffffhgdc..',
        '..ddggffeffhiafcc.',
        'bbbggffffffhaaffcb',
        'eeegffggggffhffeeb',
        'bbbgfffffffhiaeebb',
        '..ddfffffefhaaebb.',
        '...cceefffeeeebb..',
        '....bbbbeeebbbb...',
        '.......bbbbb......' ] },
    pez_angel: {
      cola: 3, pal: { a: '#141a33', b: '#232a38', c: '#2a3140', d: '#9fb0c2', e: '#dce5ee', f: '#f3cd45', g: '#f4f8fb', h: '#ffe066', i: '#ffffff' },
      filas: [
        '...chfc.h.......',
        '...cffccc.......',
        '...ccfffccc.....',
        '...ccbggbbcc....',
        '...cgbeebbecc...',
        'cffcgbeebbefcc..',
        'cfcggbeebbfiac..',
        'cffgebfebbfaac..',
        'fffgebeebbeedc..',
        'cffgebefbbeedc..',
        'cfcgebeebbefdc..',
        'cffcebfebbddcc..',
        '...cbbeebbdcc...',
        '...ccbddbbcc....',
        '...cffffccc.....',
        '...cffccc.......',
        '...cchf.........' ] },
    pez_salmonete: {
      cola: 4, pal: { a: '#141a33', b: '#7a2a34', c: '#a83a48', d: '#d8505c', e: '#f0504a', f: '#f08a8a', g: '#f6cf4a', h: '#f6d36a', i: '#fbd5ca', j: '#ff7a6a', k: '#ffffff' },
      filas: [
        '......bjjb........',
        'jbb..bedjebb......',
        'bebbbbcddddbbhbb..',
        'bbdbdccdddddhkabb.',
        '.bddddddddcchaadb.',
        '.bdfffggggggffffb.',
        '.bdiiffffffffffbb.',
        'bbdbiiiiiiiiiiibb.',
        'bebbbbbiiiibbbbb..',
        'jbb...bbbbbb......',
        '..................' ] },
    pez_lubina: {
      cola: 4, pal: { a: '#141a33', b: '#2f3d48', c: '#3d4e5c', d: '#56697a', e: '#6e8394', f: '#7d8d99', g: '#8aa4b4', h: '#a5b6c2', i: '#e8d36a', j: '#e9eff2', k: '#ffffff' },
      filas: [
        '......f.fbfbf......',
        'fbb..bbbbbbbbb.....',
        'bgbbbbdccccddibbb..',
        'bbfbdddddddcikadbb.',
        '.bfddddcdddeiaaddb.',
        '.bfhhhhhhchhhhhhhb.',
        '.bfhhhhhhhhhhhhhbb.',
        'bbffjjjjjjjjjjjjjb.',
        'bgbbbjjjjjjjjjjbbb.',
        'fbb.bbbbbbbbbbbb...',
        '........bbb........' ] },
    // v2.218: LOTE 3 de fauna marina (6 criaturas, docs/lote3_final_6c.png): llega a 20 criaturas vivas.
    pez_volador: {
      cola: 4, pal: { a: '#141a33', b: '#1e3466', c: '#2f55a0', d: '#5a90d0', e: '#9fd0ec', f: '#dfe9f2', g: '#e6eef6', h: '#ffffff' },
      filas: [
        '..........bbbb.....',
        '.b......bbeeeeb....',
        'bbb...bbeeeeeeb....',
        'bbbb.beeeeeeebb....',
        '.bbbbccccccccccbb..',
        '.bdccccccccccfhacb.',
        '.bdddddddddddfaadb.',
        'bbdgggggdddggggbb..',
        'bbddgggggggggggb...',
        'bbbb.beeebbbbbb....',
        '.bb...bbb..........' ] },
    pez_bagre: {
      cola: 4, pal: { a: '#141a33', b: '#2a3320', c: '#4a5a3a', d: '#5f6e3e', e: '#6f7e48', f: '#8a9660', g: '#a8b87a', h: '#dcd4a4', i: '#e8d36a', j: '#ffffff' },
      filas: [
        '........bb.........',
        '.bb..bbbeeb........',
        'bccbbeeeeeeb.......',
        '.bcbbddddggdbbbbb..',
        '.bccddccddgddijadb.',
        '.bcddddcdddddiaaddb',
        '.bcfffffffffffffbbb',
        'bcchhhhhhhhhhfffhhb',
        'bcbbbhhhhhhhhhhhhb.',
        '.b...bbbbbbbbbbbb..',
        '...................' ] },
    pez_leon: {
      cola: 4, pal: { a: '#141a33', b: '#4a1810', c: '#6e2018', d: '#8a3328', e: '#b0392e', f: '#d9634a', g: '#d9895a', h: '#f2cf4a', i: '#f6e2c0', j: '#ffffff' },
      filas: [
        '......b.b.b........',
        '.....bbbbbbb.......',
        '.....bddddddb......',
        '.....bdddddddb.....',
        '.b...bdfffffbbbb...',
        'bgb.bffieeeiefffb..',
        'bgggffeieeeiehjacb.',
        '.bggfeeieeeiehaacb.',
        '.bggfeeieeeieeebb..',
        'bgggfeeieeeieeeccb.',
        'bgbbbeeeeeecccccb..',
        '.bbbgggccccbbbbb...',
        '...bggggddddb......',
        '....bgggggddb......',
        '.....bbbbbbb.......' ] },
    pez_bacalao: {
      cola: 4, pal: { a: '#141a33', b: '#3a3018', c: '#4a3e1c', d: '#6a5a30', e: '#7a6a3a', f: '#8a7a44', g: '#a89a62', h: '#e4d9ae', i: '#e8d36a', j: '#ffffff' },
      filas: [
        '......b..b...b.....',
        '.b...bfbbfb.bfb....',
        'bdb.bffffffffffb...',
        'bddbbeeeeeeeeebbb..',
        '.bddeecceeeeeeeeeb.',
        '.bdeeeeceecceeijaeb',
        '.bdgghhhhggcggiaagb',
        '.bdhgggggggggggbbbb',
        'bddhhhhhhhhhhhhhhb.',
        'bdbbbhhhhhhhhhhhb..',
        '.b...bbbbbbbbbbb...',
        '...................' ] },
    pez_barracuda: {
      cola: 4, pal: { a: '#141a33', b: '#2f3d48', c: '#3a2a2a', d: '#3d4e5c', e: '#4a6272', f: '#6b7f8c', g: '#8798a4', h: '#a5b6c2', i: '#e8d36a', j: '#eaf0f3', k: '#ffffff' },
      filas: [
        '.b......bb..b.......',
        'bgb....bffbbbb......',
        'bggbbbbeeeeeeebbbb..',
        '.bgeeeedeedeedikaeb.',
        '.bgeeeedhhdhhdiaaeeb',
        '.bghhhhhhhhhhhhhhccb',
        '.bghjjjjjjjjjjjjjjjb',
        'bggbbjjjjjjjjjjbbbb.',
        'bgb..bbbffbbbbb.....',
        '.b......bb..........' ] },
    pez_cazon: {
      cola: 4, pal: { a: '#141a33', b: '#27323d', c: '#52667a', d: '#6a8096', e: '#9aaebf', f: '#e8d36a', g: '#eaf0f3', h: '#ffffff' },
      filas: [
        '.b.......bbb........',
        'bdb.....bcccb.......',
        'bddb..bbcccccb......',
        '.bdbbbccccccccbbbb..',
        '.bdccccccccccbbfhab.',
        '.bdccccccccccbcbaacb',
        '.bdeeeeeeeeeeeeeeeeb',
        '.bddgggggggggggggbbb',
        '..bbbbggggggggbbbbb.',
        '...b..bbbdddbb......',
        '.........bbb........' ] },
  };
  PECES.pez_cirujano = { nombre: 'Cirujano azul', zona: 0, peso: 22, kg: [0.15, 0.9], fuerza: 1, ritmo: 0.8, margen: 0.55, fallosMax: 3, extraPique: 0.9, /* v2.202: más fácil de sacar (1 tirón, margen de ±0,55 s, 3 fallos y más tiempo para tirar al picar): antes se soltaba casi siempre */ color: '#3a73d6', sprite3d: true, forma: { L: 20, H: 9, cola: 'horq', dorsal: true },
    pal: { luz: '#74b4f2', base: '#3a73d6', sombra: '#243f9e', vientre: '#cbe8ff', aleta: '#f7cf4a', extra: '#d99a2b', ojo: '#141a33' } };
  // v2.210: lote 1. Zonas: 0 orilla · 1 media · 2 honda. `colgar: 'erguido'` = criatura que no es pez: cuelga SIN girar, del hilo atado a lo alto del cuerpo (el pez cuelga girado 90°, de la boca).
  const NUEVOS = {
    pez_sardina: { nombre: 'Sardina', zona: 0, peso: 40, kg: [0.03, 0.12], fuerza: 1, ritmo: 0.8, margen: 0.55, fallosMax: 3, extraPique: 0.9, color: '#5d9bc2', L: 17, H: 8 },
    pez_payaso: { nombre: 'Pez payaso', zona: 0, peso: 18, kg: [0.05, 0.25], fuerza: 1, ritmo: 0.75, margen: 0.5, fallosMax: 3, extraPique: 0.9, color: '#f27a1a', L: 16, H: 10 },
    pez_dorada: { nombre: 'Dorada', zona: 1, peso: 30, kg: [0.5, 2.5], fuerza: 2, ritmo: 0.75, margen: 0.45, fallosMax: 3, extraPique: 0.9, color: '#8fa3b5', L: 17, H: 12 },
    pez_globo: { nombre: 'Pez globo', zona: 1, peso: 14, kg: [0.3, 1.5], fuerza: 2, ritmo: 0.85, margen: 0.45, fallosMax: 3, extraPique: 0.9, color: '#c9b25c', L: 14, H: 14 },
    cri_pulpo: { nombre: 'Pulpo común', zona: 2, peso: 25, kg: [1, 6], fuerza: 3, ritmo: 0.7, margen: 0.4, fallosMax: 3, extraPique: 1.0, color: '#b5476a', L: 15, H: 15, colgar: 'erguido' },
    // v2.215: lote 2. Zonas: 0 orilla · 1 media · 2 honda.
    pez_salmonete: { nombre: 'Salmonete', zona: 0, peso: 20, kg: [0.1, 0.5], fuerza: 1, ritmo: 0.8, margen: 0.55, fallosMax: 3, extraPique: 0.9, color: '#d8505c', L: 18, H: 11 },
    pez_angel: { nombre: 'Pez ángel', zona: 0, peso: 10, kg: [0.1, 0.6], fuerza: 1, ritmo: 0.75, margen: 0.5, fallosMax: 3, extraPique: 0.9, color: '#dce5ee', L: 16, H: 17 },
    pez_lubina: { nombre: 'Lubina', zona: 1, peso: 26, kg: [0.5, 3], fuerza: 2, ritmo: 0.75, margen: 0.45, fallosMax: 3, extraPique: 0.9, color: '#a5b6c2', L: 19, H: 11 },
    pez_loro: { nombre: 'Pez loro', zona: 1, peso: 20, kg: [0.4, 2.5], fuerza: 2, ritmo: 0.75, margen: 0.45, fallosMax: 3, extraPique: 0.9, color: '#33b8a4', L: 19, H: 14 },
    pez_morena: { nombre: 'Morena', zona: 1, peso: 14, kg: [0.8, 3.5], fuerza: 2, ritmo: 0.6, margen: 0.45, fallosMax: 3, extraPique: 0.9, color: '#6f8c47', L: 20, H: 12 },
    pez_espada: { nombre: 'Pez espada', zona: 2, peso: 18, kg: [2, 10], fuerza: 3, ritmo: 0.65, margen: 0.4, fallosMax: 3, extraPique: 1.0, color: '#4f86d6', L: 20, H: 12 },
    pez_mero: { nombre: 'Mero', zona: 2, peso: 20, kg: [2, 9], fuerza: 3, ritmo: 0.7, margen: 0.4, fallosMax: 3, extraPique: 1.0, color: '#a77c47', L: 18, H: 13 },
    pez_raya: { nombre: 'Raya', zona: 2, peso: 16, kg: [1, 6], fuerza: 3, ritmo: 0.7, margen: 0.4, fallosMax: 3, extraPique: 1.0, color: '#5f6a86', L: 18, H: 11 },
    // v2.218: lote 3 (20 criaturas vivas en total).
    pez_volador: { nombre: 'Pez volador', zona: 0, peso: 14, kg: [0.1, 0.5], fuerza: 1, ritmo: 0.75, margen: 0.5, fallosMax: 3, extraPique: 0.9, color: '#5a90d0', L: 19, H: 11 },
    pez_bagre: { nombre: 'Bagre', zona: 0, peso: 14, kg: [0.3, 2], fuerza: 2, ritmo: 0.8, margen: 0.45, fallosMax: 3, extraPique: 0.9, color: '#6f7e48', L: 19, H: 11 },
    pez_leon: { nombre: 'Pez león', zona: 1, peso: 16, kg: [0.3, 1.2], fuerza: 2, ritmo: 0.7, margen: 0.45, fallosMax: 3, extraPique: 0.9, color: '#b0392e', L: 19, H: 15 },
    pez_bacalao: { nombre: 'Bacalao', zona: 1, peso: 18, kg: [0.8, 5], fuerza: 2, ritmo: 0.75, margen: 0.45, fallosMax: 3, extraPique: 0.9, color: '#a89a62', L: 19, H: 12 },
    pez_barracuda: { nombre: 'Barracuda', zona: 2, peso: 14, kg: [1, 5], fuerza: 3, ritmo: 0.65, margen: 0.4, fallosMax: 3, extraPique: 1.0, color: '#a5b6c2', L: 20, H: 10 },
    pez_cazon: { nombre: 'Cazón', zona: 2, peso: 12, kg: [2, 8], fuerza: 3, ritmo: 0.7, margen: 0.4, fallosMax: 3, extraPique: 1.0, color: '#52667a', L: 20, H: 11 },
  };
  Object.keys(NUEVOS).forEach((id) => { const { L, H, ...d } = NUEVOS[id]; PECES[id] = Object.assign(d, { sprite3d: true, forma: { L, H }, pal: { luz: '#ffffff', base: d.color, sombra: '#333333', vientre: '#ffffff', aleta: d.color, extra: d.color, ojo: '#141a33' } }); });
  function matrizPixeles(id, frame) {   // el dibujo a mano; el fotograma 1 baja la cola 1 px (aleteo)
    const D = PIXELES[id], H = D.filas.length, W = D.filas[0].length; let px = D.filas.map((f) => Array.from(f).map((c) => (c === '.' ? null : D.pal[c])));
    if (frame && D.punta) { const q = px.map((f) => f.slice()); for (let y = D.punta; y < H; y++) for (let x = 0; x < W; x++) q[y][x] = null; for (let y = D.punta; y < H; y++) for (let x = 0; x < W; x++) if (px[y][x]) q[y][x < W / 2 ? x + 1 : x - 1] = px[y][x]; px = q; }   // Pulpo: las puntas de los tentáculos se juntan
    else if (frame) for (let x = 0; x < (D.cola || 6); x++) { for (let y = H - 1; y > 0; y--) px[y][x] = px[y - 1][x]; px[0][x] = null; }
    return { w: W, h: H, px };
  }
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function elegir(rnd, zona) { // pez al azar (ponderado) de esa zona; si no hay de esa zona, de la orilla
    const vivos = Object.keys(PECES).filter((k) => !PECES[k].oculto);   // v2.201: los 5 peces generados por fórmula están OCULTOS (no salen al pescar ni en la colección; sus datos siguen para los guardados antiguos y se pueden recuperar quitando `oculto`)
    let ids = vivos.filter((k) => PECES[k].zona === zona); if (!ids.length) ids = vivos.filter((k) => PECES[k].zona === 0);
    const total = ids.reduce((s, k) => s + PECES[k].peso, 0); let r = rnd() * total;
    for (const k of ids) { r -= PECES[k].peso; if (r < 0) return k; }
    return ids[ids.length - 1];
  }
  function kg(rnd, id) { const [a, b] = PECES[id].kg, r = rnd(); return Math.round((a + (b - a) * r * r) * 1000) / 1000; } // más pequeños que grandes
  function pesoTexto(v) { return v < 1 ? Math.round(v * 1000) + ' g' : (Math.round(v * 10) / 10).toString().replace('.', ',') + ' kg'; }
  // v2.196: dibujo 2D lateral a DOBLE resolución (docs/FICHA_PECES.md), mirando a la DERECHA (cabeza a la derecha). { w, h, px[y][x] = color|null }. frame 0|1 = aleteo de la cola / ondulación de la anguila.
  // Estructura: lomo oscuro, flanco, franja clara y vientre; contorno del tono oscuro del propio pez; ojo (3×3 con aro claro en los grandes, 2×2 con aro en el Alburno, aro amarillo en la Anguila); boca abierta en forma de PICO (la mandíbula de arriba sobresale 1 px sobre la boca);
  // branquia, aletas dorsal, anal, ventral y pectoral con radios, cola con radios. Sin azar ni DOM (solo `hash`).
  const SPR = { pez_plateado: { L: 12, Hb: 4, cola: 4, ta: 0.46, dors: [0.40, 0.62, 1] }, pez_gobio: { L: 14, Hb: 6, cola: 4, ta: 0.46, dors: [0.36, 0.64, 2] }, pez_carpa: { L: 18, Hb: 9, cola: 5, ta: 0.56, dors: [0.30, 0.66, 3] },
    pez_trucha: { L: 17, Hb: 5, cola: 4, ta: 0.46, dors: [0.38, 0.62, 2] }, pez_anguila: { L: 26, Hb: 3, cola: 3, ta: 0.5, dors: null, amp: 1.5 } };   // v2.196 (ajuste): de mano a mano de Oli (≈ 14-18 px), la Anguila más larga y fina
  const SPR_G = { pez_plateado: { L: 22, Hb: 6, cola: 6, ta: 0.46, dors: [0.40, 0.60, 1] }, pez_gobio: { L: 24, Hb: 8, cola: 6, ta: 0.46, dors: [0.36, 0.64, 3] }, pez_carpa: { L: 30, Hb: 13, cola: 7, ta: 0.56, dors: [0.30, 0.66, 4] },
    pez_trucha: { L: 30, Hb: 8, cola: 7, ta: 0.46, dors: [0.38, 0.62, 3] }, pez_anguila: { L: 44, Hb: 5, cola: 4, ta: 0.5, dors: null, amp: 2 } };   // v2.196: la MISMA especie a mayor detalle (para la ficha de captura y la colección, que se ven grandes); en el agua se usa la pequeña
  const hn = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), hx = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mul = (h, f) => hx(hn(h).map((v) => v * f)), mix = (a, b, t) => hx(hn(a).map((v, i) => v + (hn(b)[i] - v) * t)), IRIS = '#f4e9c8';
  function matriz(id, frame, grande) {
    if (PIXELES[id]) return matrizPixeles(id, frame);
    const E = PECES[id], S = (grande ? SPR_G : SPR)[id], hi = !!grande; if (!E || !S) return null; const P = E.pal, L = S.L, Hb = S.Hb, cola = S.cola, fr = frame ? 1 : 0, amp = S.amp || 0, ang = id === 'pez_anguila', W = L + 2, Hc = Hb + 2 * amp + 12, cy = Math.floor(Hc / 2);
    const g = Array.from({ length: Hc }, () => Array(W).fill(null)), put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < Hc) g[y][x] = c; };
    const lomo = mix(P.base, P.sombra, 0.65), luz = id === 'pez_trucha' ? mix(P.base, P.luz, 0.8) : P.luz, aS = mul(P.aleta, 0.72), xb0 = cola - 1, cyx = (x) => cy + (amp ? amp * Math.sin(x * 0.27 + fr * Math.PI) : 0), info = {};
    for (let x = xb0; x < L; x++) { // cuerpo: perfil con morro romo
      const t = (x - xb0) / (L - 1 - xb0), prof = Math.pow(Math.sin(Math.PI * (0.08 + 0.80 * t)), 0.6), fh = Math.max(ang ? 1.7 : 1.4, Hb * prof), c = cyx(x), top = Math.round(c - fh * S.ta), bot = Math.round(c + fh * (1 - S.ta)); info[x] = { top, bot };
      for (let y = top; y < bot; y++) { const r = (y - top + 0.5) / (bot - top); let col = r < 0.25 ? lomo : r < 0.55 ? P.base : r < 0.78 ? luz : P.vientre;
        if (id === 'pez_trucha' && r > 0.42 && r < 0.58) col = mix(P.luz, P.vientre, 0.6); if (id === 'pez_plateado' && r > 0.45 && r < 0.62) col = mix(P.luz, '#ffffff', 0.5); if (ang) col = r < 0.45 ? P.sombra : r < 0.8 ? P.base : P.vientre; put(x, y, col); } }
    const xg = L - 1 - Math.round(L * 0.27), big = hi || Hb >= 9, ex = L - 1 - Math.round(L * (hi && id === 'pez_plateado' ? 0.2 : big ? 0.15 : 0.2)), I = info[ex], ey = Math.round(I.top + (I.bot - I.top) * (hi && id === 'pez_plateado' ? 0.22 : big ? 0.36 : 0.25)), g0 = info[xg];
    if (id === 'pez_carpa') for (let x = xb0 + 4; x < xg - 1; x += 3) for (let y = info[x].top + 2, k = ((x - xb0) / 3 | 0) % 2; y < info[x].bot - 3; y += 3) { put(x, y + k, P.extra); put(x + 1, y + k, P.extra); put(x, y + k + 1, mix(P.extra, P.base, 0.5)); }   // escamas espejo
    if (id === 'pez_trucha') for (let x = xb0 + 2; x < xg + 2; x++) for (let y = info[x].top + 1; y < info[x].bot - 1; y++) if (hash(x, y) < 0.13) put(x, y, P.extra);   // puntitos
    if (id === 'pez_gobio') [0.18, 0.36, 0.54, 0.72].forEach((t) => { const x = Math.round(xb0 + t * (L - 1 - xb0)), y = Math.round(info[x].top + (info[x].bot - info[x].top) * 0.42); put(x, y, P.extra); put(x, y + 1, mix(P.extra, P.base, 0.4)); });   // manchas del costado
    if (Hb >= 9 || hi) for (let y = g0.top + 1; y < g0.bot - 1; y++) { const r = (y - g0.top) / (g0.bot - g0.top); put(xg + Math.round(-1.4 * Math.sin(r * Math.PI)) + 1, y, mix(P.sombra, '#000000', 0.15)); }   // branquia
    if (S.dors) { const [t0, t1, Hd] = S.dors, xa0 = xb0 + t0 * (L - 1 - xb0); for (let x = Math.round(xa0); x <= Math.round(xb0 + t1 * (L - 1 - xb0)); x++) { const q = (x - xa0) / ((t1 - t0) * (L - 1 - xb0)), h = Math.max(1, Math.round(Hd * (0.35 + 0.65 * q))); for (let k = 1; k <= h; k++) put(x, info[x].top - k, id === 'pez_gobio' ? (x % 2 ? aS : mul(P.aleta, 0.55)) : (x % 2 ? P.aleta : aS)); } }
    if (ang) for (let x = xb0 + 2; x < L - 8; x++) { put(x, info[x].top - 1, P.aleta); put(x, info[x].bot, P.aleta); }   // aleta continua de la anguila
    else { const xa = Math.round(xb0 + 0.22 * (L - 1 - xb0)); for (let k = 0; k < 3; k++) { put(xa + k, info[xa + k].bot, aS); put(xa + k, info[xa + k].bot + 1 - (k === 2 ? 1 : 0), P.aleta); }   // anal
      const xv = Math.round(xb0 + 0.5 * (L - 1 - xb0)); put(xv, info[xv].bot, aS); put(xv - 1, info[xv].bot + 1, P.aleta); put(xv - 2, info[xv].bot + 1, aS);   // ventral
      const yp = Math.round(g0.top + (g0.bot - g0.top) * 0.55); for (let k = 0; k < (hi ? 4 : 3); k++) { put(xg - k, yp + (k >> 1), k % 2 ? P.aleta : aS); put(xg - k, yp + 1 + (k >> 1), k % 2 ? aS : P.aleta); } }   // pectoral
    const cp = info[xb0], c0 = (cp.top + cp.bot) / 2 + (fr && !ang ? 1 : 0);   // cola con radios en horizontal
    for (let x = 0; x < cola; x++) { const k = cola - 1 - x, span = ang ? 1.3 + k * 0.2 : Math.min(1.2 + k * 0.95, Hb * 0.62), notch = ang || id === 'pez_gobio' ? 0 : Math.max(0, (k - 2) * 0.75 * span / Math.max(1, cola - 3));
      for (let d = -Math.ceil(span); d <= Math.ceil(span); d++) { if (Math.abs(d) > span || Math.abs(d) < notch) continue; put(x, c0 + d + (ang ? cyx(x) - cy : 0), Math.round(c0 + d) % 2 ? P.aleta : aS); } }
    const gr = Hb >= 8 && !ang;   // ojo
    if (gr) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(ex + dx, ey + dy, dx === 0 && dy === 0 ? P.ojo : IRIS); put(ex - 1, ey - 1, '#ffffff'); }
    else if (hi) { for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) put(ex + dx, ey + dy, P.ojo); const ar = ang ? '#e8e0a0' : IRIS; put(ex - 1, ey, ar); put(ex - 1, ey + 1, ar); put(ex, ey - 1, ar); put(ex + 1, ey - 1, ar); }
    else { put(ex, ey, P.ojo); put(ex - 1, ey, ang ? '#e8e0a0' : IRIS); if (!ang) put(ex, ey - 1, IRIS); }   // ojo pequeño: pupila de 1 px con aro claro a un lado y arriba
    // boca abierta en V (dos diagonales): una cuña con el vértice dentro de la cabeza que se abre hacia el morro; se vacía (el contorno oscuro dibuja las dos diagonales) y el vértice queda oscuro; siempre queda 1 fila de mandíbula arriba y abajo
    const bm = info[L - 1], boca = Math.round(bm.top + (bm.bot - bm.top) * 0.55), vx = L - (hi ? 5 : 3), oscuro = mul(P.sombra, 0.4);
    for (let x = vx + 1; x < L; x++) { const q = x - vx, ci = info[x], gU = Math.min(Math.floor(q * (hi ? 0.4 : 0.34) + 0.5), boca - ci.top - 1), gL = Math.min(Math.floor(q * (hi ? 0.6 : 0.5) + 0.5), ci.bot - 1 - boca - 1); for (let y = boca - Math.max(0, gU); y <= boca + Math.max(0, gL); y++) g[y][x] = null; if (q === 1) g[boca][x] = oscuro; }
    put(vx, boca, oscuro);
    const o = g.map((f) => f.slice()); for (let y = 0; y < Hc; y++) for (let x = 0; x < W; x++) if (!g[y][x]) { const n = [[0, -1], [-1, 0], [1, 0], [0, 1]].map(([a, b]) => (g[y + b] && g[y + b][x + a]) || null).find(Boolean); if (n) o[y][x] = mul(n, 0.38); }   // contorno: tono oscuro del vecino
    let y0 = 0, y1 = Hc - 1; while (y0 < y1 && o[y0].every((c) => !c)) y0++; while (y1 > y0 && o[y1].every((c) => !c)) y1--;
    return { w: W, h: y1 - y0 + 1, px: o.slice(y0, y1 + 1) };
  }
  G.PECES = PECES; G.pesca = { elegir, kg, pesoTexto, matriz, T };
})(typeof window !== 'undefined' ? window : globalThis);
