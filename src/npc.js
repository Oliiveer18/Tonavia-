// npc.js — PERSONAJES NO JUGABLES (v2.312). Hoy: la enfermera Alba del Centro PC. Sprite propio, lugar en el mapa (maps/*.json → npcs con tipo «npc»), alcance de conversación y guion.
// PURO salvo el dibujo del sprite: sin azar ni DOM. El diálogo en pantalla vive en src/dialogo_ui.js.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  // ── Enfermera Alba: pelo rosa, cofia blanca con cruz, uniforme blanco con cuello turquesa (misma paleta cálida del juego) ──
  const PAL = { a: '#2a1b30', b: '#f08cae', c: '#d4648f', d: '#f8dfcb', e: '#3a2a50', f: '#f5a8bd', g: '#fff9ee', h: '#d8d2e6', i: '#d94a3f', j: '#ffffff', k: '#e4dcec', l: '#3fb5b0', m: '#e0607a', n: '#b9b4c4' };
  const ALBA = [
    '.....aaaaaa.....',
    '....ajjjjjja....',
    '...ajjjiijjja...',
    '...akjjiijjka...',
    '..abbaaaaaabba..',
    '..abbddddddbba..',
    '..abcddddddcba..',
    '..abdeddddedba..',
    '..abdeddddedba..',
    '..abfddmmddfba..',
    '..abcddddddcba..',
    '..aabbllllbbaa..',
    '.aabbggiiggbbaa.',
    'aggbbgiiiigbbgga',
    'aggbbggiiggbbgga',
    'adgbbggggggbbgda',
    'addcbggggggbcdda',
    '.aacbllllllbcaa.',
    '..aagggggggggaa.',
    '..agghggggghgga.',
    '....annaaaanna..',
  ];
  G.NPC_ALBA = ALBA; G.NPC_PAL = PAL;
  // ── Tendero Teo: gorra roja, camisa mostaza y delantal verde con un bolsillo dorado (misma paleta cálida) ──
  const TEO = [
    '.....aaaaaa.....', '....appqqppa....', '...appppppppa...', '..aappppppppaa..', '..abbbbbbbbbba..', '..abddddddddba..', '..abdeddddedba..', '..abdeddddedba..',
    '..abfddmmddfba..', '..abcddddddcba..', '...aabddddbaa...', '.aajjjkkkkjjjaa.', 'ajjjjkkkkkkjjjja', 'adjjjkkyykkjjjda', 'addjjkkkkkkjjdda', '.aadkkkkkkkkdaa.',
    '..aakkkllkkkaa..', '..aakkkkkkkkaa..', '...aannnnnnaa...', '....annaanna....', '....aooaaooa....',
  ];
  const PAL_TEO = { a: '#2a1b30', b: '#6b3f2a', c: '#e9b79c', d: '#f8dfcb', e: '#3a2a50', f: '#f5a8bd', m: '#b5564a', p: '#d94a3f', q: '#f06a5d', j: '#e8a93a', k: '#4d9b5c', l: '#35764a', y: '#ffd24d', n: '#3a2a50', o: '#5a3a2a' };
  G.NPC_TEO = TEO;
  // Sprite de un personaje de una sola vista (la de frente sirve para las 4 direcciones y 3 pasos): prefijo del id → dibujo + paleta
  function crearSprites(pref, filas, pal) {
    if (!G.defSprite) return;
    ['down', 'up', 'side', 'sideL'].forEach((v) => [0, 1, 2].forEach((f) => {
      const name = pref + '_' + v + '_' + f, oy = 24 - filas.length, ox = Math.floor((18 - filas[0].length) / 2);
      G.defSprite(name, 18, 24, (c) => { filas.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch !== '.' && pal[ch]) { c.fillStyle = pal[ch]; c.fillRect(x + ox, y + oy, 1, 1); } } }); });
      const s = G.spr[name]; s.ox = 1; s.oy = 1; s.tw = 16; s.th = 22; s.top = Math.max(0, oy - 1);
    }));
  }
  // ── Doctora Nora (v2.320, crianza): moño violeta, bata blanca con blusa turquesa y un boli dorado en el bolsillo (misma silueta y paleta cálida) ──
  const NORA = [
    '......aaaa......', '....aappppaa....', '...appqqqqppa...', '..aappppppppaa..', '..abbbbbbbbbba..', '..abddddddddba..', '..abdeddddedba..', '..abdeddddedba..',
    '..abfddmmddfba..', '..abcddddddcba..', '...aabddddbaa...', '.aajjjkkkkjjjaa.', 'ajjjjjkkkkjjjjja', 'adjjjjjkkjjyjjda', 'addjjjjjjjjyjdda', '.aadjjjjjjjjdaa.',
    '..aajjjjjjjjaa..', '..aajjjjjjjjaa..', '...aannnnnnaa...', '....annaanna....', '....aooaaooa....',
  ];
  const PAL_NORA = { a: '#2a1b30', b: '#5f3b8e', c: '#e9b79c', d: '#f8dfcb', e: '#3a2a50', f: '#f5a8bd', m: '#b5564a', p: '#8e5bc4', q: '#b08be8', j: '#fff9ee', k: '#3fb5b0', y: '#f7c948', n: '#3a2a50', o: '#5a3a2a' };
  G.NPC_NORA = NORA;
  // ── Tablón de intercambios (v2.345): corcho con papeles y chinchetas sobre dos postes de madera (un objeto «personaje» de una sola vista, como los demás) ──
  const TABLON = ['.aaaaaaaaaaaaaa.', 'abbbbbbbbbbbbbba', 'abccccccccccccba', 'abcpppcccqqqcrba', 'abcpprcccqqqccba', 'abcpppcsssccccba', 'abccccrsssqqqcba', 'abcqqqcsssqqrcba', 'abcqqrcccccpppba', 'abcqqqcrpppppcba', 'abccccccpprpccba', 'abbbbbbbbbbbbbba', '.aaaaaaaaaaaaaa.', '...abba....abba.', '...adda....adda.', '...aaaa....aaaa.'];
  const PAL_TABLON = { a: '#2a1b30', b: '#8a5a34', d: '#6b4426', c: '#d9b27c', p: '#fff9ee', q: '#f7e6a8', r: '#d94a3f', s: '#7fd0cc' };
  G.NPC_TABLON = TABLON;
  crearSprites('tbl', TABLON, PAL_TABLON); crearSprites('enf', ALBA, PAL); crearSprites('tnd', TEO, PAL_TEO); crearSprites('nor', NORA, PAL_NORA);
  G.NAMES = G.NAMES || {}; G.NAMES.enfermera = 'enf'; G.NAMES.tendero = 'tnd'; G.NAMES.doctora = 'nor'; G.NAMES.tablon = 'tbl';   // id del personaje → id del sprite (lo usa G.vista.persona)

  // ── Guion de la enfermera (una frase por pulsación; las opciones salen al final) ──
  const GUION = {
    enfermera: {
      nombre: 'Enfermera Alba', rol: 'Centro PC',
      saludo: ['¡Bienvenido al Centro PC!', 'Soy Alba. Aquí cuidamos de tus criaturas, guardamos las que capturas y preparamos tu equipo.', '¿Qué necesitas hoy?'],
      curarNada: ['¡Tus criaturas ya están en plena forma!', 'Vuelve cuando las necesiten.'],
      curando: ['Déjalas en mis manos, solo será un momento…'],
      curado: ['¡Listo! Tus criaturas están como nuevas.', '¡Que tengáis mucha suerte ahí fuera!'],
      equipo: ['Muy bien. Elige quién te acompaña: la de delante es la que lucha.'],
      equipoHecho: ['¡Equipo preparado!', '¿Algo más?'],
      adios: ['¡Hasta pronto! Cuídate mucho.'],
      ampliado: ['¡Hecho! He hecho sitio en la caja del Centro PC.', 'Ahora caben {max} criaturas.'],
      ampliarNo: ['Ampliar la caja cuesta {coste} ✦ y llevas {saldo}.', 'Pesca algo y véndelo en la Tienda: ¡así reúnes lo que falta!'],
      ampliarTope: ['¡La caja ya tiene el tamaño máximo!'],
      sinBrillos: ['Curar a tu equipo cuesta {coste} ✦ y llevas {saldo}.', 'Pesca algo y véndelo en la Tienda: ¡así reúnes lo que falta!'],
    },
  };
  // v2.320 · Diálogo guiado por DATOS (tipo 'datos'): «menu» = opciones; cada una abre un panel (panel) o dice unas frases (frases, rotando). Sirve para cualquier personaje nuevo sin tocar dialogo_ui.js.
  GUION.doctora = {
    tipo: 'datos', nombre: 'Doctora Nora', rol: 'Laboratorio',
    saludo: ['¡Hola! Soy la Doctora Nora y estudio cómo nacen las criaturas.', 'Si me traes dos criaturas, las incubadoras harán el resto: el huevo eclosiona mientras caminas.', '¿Qué hacemos?'],
    mas: ['¿Algo más?'], adios: ['¡Camina mucho! A los huevos les encanta el paseo.'],
    menu: [
      { id: 'criar', txt: 'Criar', sub: 'Elige dos criaturas', panel: 'criar', di: ['Elige dos criaturas. La cría hereda color, marcas y adornos de una u otra… y a veces sale algo nuevo.'] },
      { id: 'incubadoras', txt: 'Incubadoras', sub: 'Tus huevos', panel: 'incubadoras', di: ['Aquí están tus huevos.'] },
      { id: 'crias', txt: 'Mis crías', sub: 'Elige cuál te acompaña', panel: 'crias', di: ['Estas son las crías que han nacido aquí.'] },
      { id: 'charlar', txt: 'Charlar', sub: 'Un consejo de Nora', frases: [
        ['Si criáis juntos, cada uno con una criatura suya, la mutación sale el doble de veces.', 'Y los pasos de los dos cuentan para el huevo.'],
        ['Tras criar, los padres descansan un buen paseo antes de volver a poner un huevo.'],
        ['Cada cría tiene su talento: un pelín más de vida, ataque, defensa o velocidad que sus padres… o un pelín menos.'],
        ['Dicen que en las Profundidades, dentro de los cofres más raros, a veces aparece un huevo.'] ] },
    ],
  };
  GUION.tablon = { tipo: 'tablon', nombre: 'Tablón de intercambios', rol: 'Tienda' };   // no es un diálogo: abre el panel del tablón (src/tablon_ui.js)
  GUION.tendero = {
    tipo: 'tienda', nombre: 'Tendero Teo', rol: 'Tienda',
    saludo: ['¡Bienvenido a la Tienda de Albanota!', 'Soy Teo. Vendo de todo para el camino: pociones, revivir y esferas de captura.', 'Y si traes pescado fresco, te lo compro a buen precio.'],
    comprar: ['Mira con calma. Pagas en Brillos ✦, claro.'], vender: ['Enséñame lo que traes. Los pescados los pago enteros; lo demás, a mitad de precio.'],
    mas: ['¿Algo más?'], adios: ['¡Vuelve cuando quieras! Y no te olvides de las esferas.'],
    consejos: [
      ['Las pociones solo se usan andando, nunca en pleno combate. Prepárate antes de salir.', 'Se gastan desde la Bolsa ✦ del menú.'],
      ['¿Una criatura ha caído? La Poción no la despierta: necesitas Revivir, que la deja con la mitad de su vida.'],
      ['Sin esferas no hay captura. Tras ganar a una criatura salvaje, solo puedes ofrecerle una si te queda alguna.'],
      ['¿Sin Brillos? Pesca. Cada pez va a tu Bolsa y yo te lo compro; los de aguas hondas valen más.'],
      ['Alba, en el Centro PC, cura a todo tu equipo por unos pocos Brillos: 8 por criatura herida y 20 por cada una debilitada.'],
      ['Cada especie nueva que pescas o capturas te da un premio. Y los rivales raros pagan más que los comunes.'],
    ],
  };
  // ── Dónde está y a quién se puede hablar ──
  const lista = (m, reloj) => ((m && m.npcs) || []).filter((n) => n && n.tipo === 'npc' && !(n.id === 'tendero' && G.ciclo && !G.ciclo.abierta('tienda', reloj)));   // v2.327: Teo se va a casa cuando la tienda cierra (reloj: est.reloj)
  const centro = (n) => ({ x: n.x * T + 8, y: n.y * T + 14 });
  const pos = (n) => { const q = centro(n); return { x: q.x, y: q.y + (n.dy || 0) }; };   // dónde se DIBUJA (dy: desplazamiento visual en px; detrás del mostrador se ve de pecho para arriba)
  // NPC más cercano a j dentro de su alcance (en casillas; por defecto 2,6), o null
  function cercano(est, j) {
    const m = G.mundo && j ? G.mundo.mapa(j.mapa) : null; let mejor = null, dm = Infinity;
    lista(m, est && est.reloj).forEach((n) => { const p = centro(n), d = Math.hypot(j.x - p.x, j.y - p.y); if (d <= (n.alcance || 2.6) * T && d < dm) { dm = d; mejor = n; } });
    return mejor;
  }
  G.npc = { GUION, lista, centro, pos, cercano, T };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.npc;
})(typeof window !== 'undefined' ? window : globalThis);
