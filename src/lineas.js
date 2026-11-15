// lineas.js — REGISTRO ÚNICO DE DATOS (paso 1.1 del PLAN_200). Una entrada por línea evolutiva, en orden de Nº de línea. Es la ÚNICA fuente de los datos de juego:
// de aquí salen G.PHASES_PLAN, G.LINE_PLAN, G.TRAITS y los datos de cada criatura (nombre, autor, elementos, rareza, frase, evolución, fase y peso); ver src/creatures.js.
// Los dibujos NO están aquí: viven en src/formas.js y se enlazan por el id de cada forma (def2(id, draw)).
//
// Campos de la línea:  n = Nº de línea (fijo; 001-020 ya asignados, las nuevas desde 021) · fam = id de la fase 1 (identifica la familia; nunca cambia) · raiz = parte del nombre compartida por todas las fases
//   idea = de dónde sale el sonido de la raíz (GUIA_DE_NOMBRES.md) · by = autor del diseño · elements = elementos (el primero es el principal) · rarity = comun | rara | epica | legendaria
//   hito / lote / hecha = cuándo se hizo (hito 0 = las 20 primeras)
//   DÓNDE APARECE ya no se escribe aquí (v2.17, paso 1.3b): lo decide src/aparicion.js con las zonas de aparición de maps/*.json (por elemento) y la rareza; las legendarias, con su guarida fija (npc «guarida» del mapa, id = fam)
// Campos de cada forma (fase 1, 2, 3 en orden; la evolución de cada una es la siguiente de la lista):
//   id = id del código (no cambia nunca) · name = nombre aprobado · line = frase al hablarle · size = [ancho, alto] del dibujo (siempre pares) · kg = peso
//   traits = movimiento: shadow [ancho, alto, separación del suelo] · speed · wait [mín, máx] segundos de pausa · hop [alto, ritmo] salta al andar · float [alto, ritmo] flota siempre · nod ritmo de cabeceo
//   · sway [px, ritmo] se contonea al andar · flick ritmo de cola al estar parada (usa el frame 2) · eye = true: abre un ojo al hablarle (usa el frame 3)
//   by = solo si el autor de esa fase es distinto del de la línea.
(function () {
  'use strict';
  window.G = window.G || {};
  window.G.LINEAS = [
    { n: 1, fam: 'pompon', raiz: 'Ond', idea: '«onda»', by: 'Claude', elements: ['agua'], rarity: 'comun', hito: 0, lote: 'Bloque 1', hecha: 'v1.1',
      formas: [
        { id: 'pompon', name: 'Ondel', size: [14, 14], kg: 1.2, line: '¡Plop! Soy Ondel.',
          traits: { shadow: [8, 2, 0], speed: 20, wait: [0.6, 1.8], hop: [2, 9] } },
        { id: 'ondavar', name: 'Ondavar', size: [18, 12], kg: 2, line: 'Plop... ¡Ven a mi hoja, que se está poniendo a llover!',
          traits: { shadow: [15, 2, 0], speed: 15, wait: [1, 2.4], hop: [1, 6], flick: 2.4 } },
      ] },
    { n: 2, fam: 'aguacato', raiz: 'Aguaca', idea: '«aguacate» (diseño de Oli)', by: 'Oli', elements: ['hoja'], rarity: 'rara', hito: 0, lote: 'Bloque 1', hecha: 'v0.9',
      formas: [
        { id: 'aguacato', name: 'Aguacato', size: [18, 18], kg: 3, line: '¡Miau-guacate! Dame cuerda.',
          traits: { shadow: [12, 3, 0], speed: 13, wait: [1.2, 3] } },
        { id: 'aguacaton', name: 'Aguacaryn', by: 'Claude, sobre el diseño de Oli', size: [20, 20], kg: 6, line: '¡Miau-guacate! Ya me ha salido el hueso.',
          traits: { shadow: [14, 4, 0], speed: 10, wait: [1.5, 3.5], sway: [1, 15] } },
        { id: 'aguacatigre', name: 'Aguacarax', by: 'Claude, sobre el diseño de Oli', size: [22, 22], kg: 14, line: '¡Grrr-guacate! Mi llave es más grande que la tuya.',
          traits: { shadow: [16, 4, 0], speed: 16, wait: [1, 2.5], flick: 3.2 } },
      ] },
    { n: 3, fam: 'fosforin', raiz: 'Ign', idea: '«ignis» (fuego, latín)', by: 'Claude', elements: ['fuego'], rarity: 'comun', hito: 0, lote: 'Bloque 1', hecha: 'v1.1',
      formas: [
        { id: 'fosforin', name: 'Ignel', size: [12, 16], kg: 0.8, line: '¡Fsss! No me rasques, que me enciendo.',
          traits: { shadow: [6, 2, 0], speed: 30, wait: [0.3, 1], hop: [3, 14] } },
        { id: 'ignavar', name: 'Ignavar', size: [14, 16], kg: 1, line: '¡Fuuush! Ahora tengo melena... y no es de peluquería.',
          traits: { shadow: [9, 2, 0], speed: 22, wait: [0.6, 1.6], hop: [4, 10], flick: 3.2 } },
      ] },
    { n: 4, fam: 'pilita', raiz: 'Volt', idea: '«voltio»', by: 'Claude', elements: ['electrico'], rarity: 'rara', hito: 0, lote: 'Bloque 1', hecha: 'v1.2',
      formas: [
        { id: 'pilita', name: 'Voltel', size: [14, 18], kg: 2.5, line: '¡Bzzz! Cuidado, que doy calambre.',
          traits: { shadow: [9, 3, 0], speed: 22, wait: [0.5, 1.6] } },
        { id: 'voltavar', name: 'Voltavar', size: [18, 16], kg: 6, line: '¡Zzzap! Ahora tengo pinzas... ¡y no pienso soltarlas!',
          traits: { shadow: [14, 3, 0], speed: 18, wait: [0.6, 1.6], flick: 2 } },
        { id: 'voltorax', name: 'Voltorax', size: [20, 26], kg: 15, line: 'Cuando yo hago crrrac, el cielo contesta.',
          traits: { shadow: [16, 3, 0], speed: 7, wait: [1.5, 3.5], flick: 1.4 } },
      ] },
    { n: 5, fam: 'nubecin', raiz: 'Nimb', idea: '«nimbo» (nube)', by: 'Claude', elements: ['aire'], rarity: 'comun', hito: 0, lote: 'Bloque 1', hecha: 'v0.5',
      formas: [
        { id: 'nubecin', name: 'Nimbel', size: [20, 12], kg: 0.1, line: 'Fuuu... ¿me llevas a dar una vuelta?',
          traits: { shadow: [8, 2, 4], speed: 14, wait: [0.5, 1.5], float: [3, 1.6] } },
      ] },
    { n: 6, fam: 'cuarzin', raiz: 'Cuar', idea: '«cuarzo»', by: 'Claude', elements: ['roca'], rarity: 'rara', hito: 0, lote: 'Bloque 1', hecha: 'v1.1',
      formas: [
        { id: 'cuarzin', name: 'Cuarel', size: [18, 16], kg: 25, line: 'Pico y pala, pico y pala... ¡Mira, un cristal!',
          traits: { shadow: [14, 3, 0], speed: 8, wait: [2, 4.5] } },
        { id: 'cuarvel', name: 'Cuarvel', size: [20, 18], kg: 45, line: '¡Con este pico no hay veta que se me resista!',
          traits: { shadow: [16, 3, 0], speed: 6, wait: [2.2, 5], flick: 2.4 } },
        { id: 'cuarzoth', name: 'Cuarzoth', size: [22, 24], kg: 120, line: 'Mi lámpara ilumina montañas enteras. Y mis cristales... también cantan.',
          traits: { shadow: [20, 4, 0], speed: 3, wait: [3, 6.5], flick: 1.6 } },
      ] },
    { n: 7, fam: 'somnin', raiz: 'Somn', idea: '«somnus» (sueño, latín)', by: 'Claude', elements: ['sombra'], rarity: 'rara', hito: 0, lote: 'Bloque 1', hecha: 'v1.1',
      formas: [
        { id: 'somnin', name: 'Somnel', size: [16, 20], kg: 3, line: 'Zzz... cinco minutitos más...',
          traits: { shadow: [10, 3, 0], speed: 12, wait: [2.5, 5], nod: 1.2 } },
        { id: 'somnaris', name: 'Somnaris', size: [16, 22], kg: 2, line: 'Shhh... estoy tejiendo tu sueño de esta noche.',
          traits: { shadow: [10, 3, 3], speed: 10, wait: [2, 4.5], float: [2, 1.4], flick: 2, eye: true } },
      ] },
    { n: 8, fam: 'setin', raiz: 'Mic', idea: '«micelio» (hongo)', by: 'Claude', elements: ['hoja'], rarity: 'comun', hito: 0, lote: 'Bloque 1', hecha: 'v1.1',
      formas: [
        { id: 'setin', name: 'Micel', size: [14, 16], kg: 2, line: '¡Shh! Estoy esporulando... digo, ¡hola!',
          traits: { shadow: [9, 2, 0], speed: 17, wait: [0.6, 2], hop: [1, 7] } },
        { id: 'micavar', name: 'Micavar', size: [18, 18], kg: 5, line: '¡Achís! Perdona, son solo esporas... de cariño.',
          traits: { shadow: [14, 2, 0], speed: 13, wait: [1, 2.6], sway: [1, 8], flick: 2.4 } },
      ] },
    { n: 9, fam: 'caracolin', raiz: 'Espir', idea: '«espiral»', by: 'Claude', elements: ['agua'], rarity: 'rara', hito: 0, lote: 'Bloque 1', hecha: 'v1.1',
      formas: [
        { id: 'caracolin', name: 'Espirel', size: [20, 14], kg: 4, line: 'Voy... despacito... pero llego.',
          traits: { shadow: [15, 3, 0], speed: 6, wait: [1.5, 3.5] } },
        { id: 'espiravar', name: 'Espiravar', size: [20, 18], kg: 9, line: 'Mira por mi ventanita... ¡hay un pez y todo!',
          traits: { shadow: [16, 3, 0], speed: 5, wait: [1.8, 4], flick: 2 } },
      ] },
    { n: 10, fam: 'lunabu', raiz: 'Lun', idea: '«luna»', by: 'Claude', elements: ['sombra'], rarity: 'epica', hito: 0, lote: 'Bloque 1', hecha: 'v1.1',
      formas: [
        { id: 'lunabu', name: 'Lunel', size: [20, 20], kg: 4, line: 'Uhu. La luna me lo contó todo.',
          traits: { shadow: [12, 3, 3], speed: 14, wait: [1.5, 3.5], float: [2, 1.4] } },
        { id: 'lunareth', name: 'Lunareth', size: [26, 20], kg: 6, line: 'Uhu... ¿ves esa sombra sobre la luna? Soy yo, de visita.',
          traits: { shadow: [16, 3, 4], speed: 12, wait: [1.8, 4], float: [3, 1.3], flick: 2.2 } },
        { id: 'lunaroth', name: 'Lunaroth', size: [24, 26], kg: 8, line: 'Yo vigilo el cielo para que tú duermas tranquilo. Uhu.',
          traits: { shadow: [14, 4, 5], speed: 10, wait: [2.5, 5.5], float: [4, 1.1], flick: 1.8 } },
      ] },
    { n: 11, fam: 'cenel', raiz: 'Cen', idea: '«ceniza»', by: 'Claude', elements: ['fuego'], rarity: 'comun', hito: 0, lote: 'Bloque 2 · A', hecha: 'v1.5',
      formas: [
        { id: 'cenel', name: 'Cenel', size: [14, 12], kg: 0.3, line: 'Achís... ¡perdona, era ceniza! Bueno, era yo.',
          traits: { shadow: [10, 2, 0], speed: 20, wait: [0.5, 1.5], hop: [2, 9], flick: 2.2 } },
      ] },
    { n: 12, fam: 'ferrel', raiz: 'Ferr', idea: '«ferrum» (hierro, latín)', by: 'Claude', elements: ['roca'], rarity: 'comun', hito: 0, lote: 'Bloque 2 · A', hecha: 'v1.5',
      formas: [
        { id: 'ferrel', name: 'Ferrel', size: [16, 14], kg: 3, line: 'Ven... no, ¡no te acerques con las llaves!',
          traits: { shadow: [11, 3, 0], speed: 10, wait: [1.2, 3.2], flick: 2.5 } },
      ] },
    { n: 13, fam: 'dandel', raiz: 'Dand', idea: '«dandelion» (diente de león)', by: 'Claude', elements: ['aire'], rarity: 'comun', hito: 0, lote: 'Bloque 2 · A', hecha: 'v1.5',
      formas: [
        { id: 'dandel', name: 'Dandel', size: [14, 18], kg: 0.05, line: 'Pide un deseo... pero sopla bajito.',
          traits: { shadow: [8, 2, 5], speed: 14, wait: [0.6, 1.8], float: [3, 1.5], flick: 2 } },
      ] },
    { n: 14, fam: 'zefirax', raiz: 'Zefir', idea: '«céfiro» (viento del oeste)', by: 'Claude', elements: ['aire', 'electrico'], rarity: 'legendaria', hito: 0, lote: 'Bloque 2 · D', hecha: 'v2.0',
      formas: [
        { id: 'zefirax', name: 'Zefirax', size: [30, 30], kg: 12, line: 'Soy el viento antes de la tormenta.',
          traits: { shadow: [18, 3, 7], speed: 8, wait: [2, 5], float: [4, 0.9], flick: 1.8 } },
      ] },
    { n: 15, fam: 'zumbel', raiz: 'Zumb', idea: '«zumbido»', by: 'Claude', elements: ['electrico'], rarity: 'comun', hito: 0, lote: 'Bloque 2 · B1', hecha: 'v1.6',
      formas: [
        { id: 'zumbel', name: 'Zumbel', size: [14, 14], kg: 1, line: '¡Bzzz! No toques mi enchufe... ¡o sí, que hace cosquillas!',
          traits: { shadow: [9, 2, 3], speed: 24, wait: [0.4, 1.4], float: [2, 2.4], flick: 2 } },
        { id: 'zumbarix', name: 'Zumbarix', size: [18, 18], kg: 2.5, line: 'Bzzzrrr... ¡la colmena tiene luz gracias a mí!',
          traits: { shadow: [11, 2, 5], speed: 32, wait: [0.4, 1.2], float: [3, 3.2], flick: 1.6 } },
      ] },
    { n: 16, fam: 'arenel', raiz: 'Aren', idea: '«arena»', by: 'Claude', elements: ['roca'], rarity: 'comun', hito: 0, lote: 'Bloque 2 · B1', hecha: 'v1.6',
      formas: [
        { id: 'arenel', name: 'Arenel', size: [14, 12], kg: 2, line: 'No es una chapa cualquiera: ¡es mi casa!',
          traits: { shadow: [10, 2, 0], speed: 12, wait: [0.8, 2.4], sway: [1, 8], flick: 2.2 } },
        { id: 'arenax', name: 'Arenax', size: [18, 16], kg: 6, line: 'Cuidado con las torres: se desmoronan si te ríes.',
          traits: { shadow: [14, 3, 0], speed: 8, wait: [1.4, 3.5], sway: [1, 10], flick: 1.8 } },
      ] },
    { n: 17, fam: 'perlel', raiz: 'Perl', idea: '«perla»', by: 'Claude', elements: ['agua'], rarity: 'rara', hito: 0, lote: 'Bloque 2 · B2', hecha: 'v1.7',
      formas: [
        { id: 'perlel', name: 'Perlel', size: [16, 14], kg: 3, line: 'No puedo cerrar la boca... ¡es que la perla no cabe!',
          traits: { shadow: [12, 2, 0], speed: 7, wait: [1.6, 4], sway: [1, 9], flick: 2.4 } },
        { id: 'perlorix', name: 'Perlorix', size: [20, 18], kg: 8, line: 'Mi corona es de coral de verdad. ¿Mi perla? No se toca, brilla sola.',
          traits: { shadow: [16, 3, 0], speed: 4, wait: [2, 5], sway: [1, 11], flick: 2 } },
      ] },
    { n: 18, fam: 'arcel', raiz: 'Arc', idea: '«arco» (arco eléctrico)', by: 'Claude', elements: ['electrico'], rarity: 'rara', hito: 0, lote: 'Bloque 2 · B2', hecha: 'v1.7',
      formas: [
        { id: 'arcel', name: 'Arcel', size: [14, 16], kg: 2, line: '¡Chispa! No te acerques... ¿ves? Ya se me pegó el globo otra vez.',
          traits: { shadow: [9, 2, 0], speed: 20, wait: [0.5, 1.6], hop: [1, 10], flick: 2.2 } },
        { id: 'arcarex', name: 'Arcarex', size: [20, 20], kg: 4, line: 'Planeo entre tormentas. ¡Sujeta tu paraguas, que hay arcos!',
          traits: { shadow: [14, 3, 4], speed: 24, wait: [0.5, 1.4], float: [2, 2], flick: 1.8 } },
      ] },
    { n: 19, fam: 'forjel', raiz: 'Forj', idea: '«forja»', by: 'Claude', elements: ['fuego', 'roca'], rarity: 'epica', hito: 0, lote: 'Bloque 2 · C1', hecha: 'v1.8',
      formas: [
        { id: 'forjel', name: 'Forjel', size: [16, 14], kg: 12, line: 'Toc, toc... ¿Eres el herrero? ¡Tengo la brasa lista!',
          traits: { shadow: [12, 2, 0], speed: 6, wait: [1.6, 4], flick: 2.2 } },
        { id: 'forjavel', name: 'Forjavel', size: [20, 20], kg: 40, line: '¡Clang! Si quieres algo bien hecho, golpéalo mientras está caliente.',
          traits: { shadow: [14, 3, 0], speed: 8, wait: [1.4, 3.6], flick: 2 } },
        { id: 'forjadrax', name: 'Forjadrax', size: [24, 28], kg: 110, line: 'Mi chimenea no humea: ¡respira!',
          traits: { shadow: [18, 3, 0], speed: 3, wait: [2.5, 6], flick: 1.6 } },
      ] },
    { n: 20, fam: 'cactel', raiz: 'Cact', idea: '«cactus»', by: 'Claude', elements: ['hoja'], rarity: 'rara', hito: 0, lote: 'Bloque 2 · C2', hecha: 'v1.9',
      formas: [
        { id: 'cactel', name: 'Cactel', size: [14, 16], kg: 2, line: 'Shh... mi flor se abre sola. ¡Pero no me riegues tanto!',
          traits: { shadow: [11, 2, 0], speed: 14, wait: [1.2, 3.4], hop: [2, 9], flick: 2.4 } },
        { id: 'cactavar', name: 'Cactavar', size: [18, 20], kg: 5, line: '¡Ándale! El desierto es mi casa y este poncho, mi bandera.',
          traits: { shadow: [14, 2, 0], speed: 10, wait: [1.4, 3.6], sway: [1, 9], flick: 2 } },
        { id: 'cactorax', name: 'Cactorax', size: [22, 26], kg: 20, line: 'Desde aquí arriba se ve todo el desierto. Mi pajarito vigila.',
          traits: { shadow: [18, 3, 0], speed: 4, wait: [2.4, 6], flick: 2.6 } },
      ] },
  ];
})();
