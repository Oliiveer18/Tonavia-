// interiores_objetos.js — MOBILIARIO DE LOS INTERIORES (v2.140, ID-5c; docs/BIBLIA_INTERIORES.md §1b y §5). Solo dibujo: sin estado de partida ni Math.random.
// Trece piezas del catálogo G.capas (G.OBJETOS), todas sobre la rejilla de 16 px: el ancho y el alto de la HUELLA son casillas enteras y el dibujo queda centrado en ellas (anchos pares → eje exacto).
// Dos juegos de material: CLINICO (blanco cálido y turquesa: Centro PC, Laboratorio) y MADERA (casas, tienda, ermita). Luz arriba-izquierda (1 px) y sombra abajo-derecha (2 px) en bandas duras; contorno automático de 1 px.
// Se colocan en un mapa como cualquier objeto ({ tipo, x, y }); el HD-2D las lee como láminas del dibujo 2D (como los demás objetos sin volumen). Animaciones (con «menos movimiento» quedan quietas): pantalla del terminal, huevo de la incubadora, llama de las velas.
(function (root) {
  'use strict';
  const G = root.G, P = G.PAL, L = G.lienzoPieza, T = 16;
  const CLINICO = { base: '#fff9ee', luz: '#ffffff', sombra: '#b9b4c4', hondo: '#8a8498', borde: P.teal2, borde2: P.teal, tapa: '#ffffff', frente: '#e3ddd0' };
  const MADERA = { base: P.wood1, luz: '#d9a574', sombra: P.wood3, hondo: P.woodD, borde: P.wood3, borde2: P.wood1, tapa: P.cream, frente: P.wood1 };
  const VERDE = { base: '#3f6f4a', luz: '#6fa57a', sombra: '#2b4d34', hondo: '#1f3a27', borde: '#2b4d34', borde2: '#3f6f4a', tapa: '#f6ebcf', frente: '#3f6f4a' }; // v2.145 · paleta A de la Tienda (verde mercado)
  const VIOLETA = { base: '#6a5a94', luz: '#9a88c4', sombra: '#4a3a6b', hondo: '#33264d', borde: '#4a3a6b', borde2: '#7a67a3', tapa: '#efe6d0', frente: '#6a5a94' }; // v2.147 · paleta A del Laboratorio (violeta de observatorio)
  const AZ = { b: '#4d7fd6', l: '#8fb4f0', s: '#35559a' }, RO = { b: '#f5a8bd', l: '#fff9ee', s: '#e47a9a' }; // Lali azul, Oli rosa (las dos mitades de la campana)
  // caja con luz arriba-izquierda (1 px) y sombra abajo-derecha (2 px)
  const caja = (l, x, y, w, h, base, luz, sombra) => { l.f(base, x, y, w, h); if (luz) { l.f(luz, x, y, w, 1); l.f(luz, x, y, 1, h); } if (sombra) { l.f(sombra, x, y + h - 2, w, 2); l.f(sombra, x + w - 2, y, 2, h); } };
  const campana = (l, x, y) => { l.f(AZ.b, x, y, 2, 4); l.f(AZ.l, x, y, 1, 1); l.f(RO.b, x + 2, y, 2, 4); l.f(RO.l, x + 2, y, 1, 1); l.f(P.yellow, x, y + 4, 4, 1); }; // campana de dos mitades (4×5)

  // MOSTRADOR de 3 casillas (48 px), centrado; con máquina de curación encima (Centro PC) o sin ella (tienda). Lienzo 50×30: contenido en x 1..48.
  function mostrador(M, curacion) {
    const l = L(50, 30);
    if (curacion) { // máquina de 24 px centrada (x 13..36): 6 huecos para criaturas (emiten luz: no se sombrean)
      caja(l, 13, 2, 24, 12, CLINICO.sombra, CLINICO.luz, CLINICO.hondo); l.f(CLINICO.base, 14, 3, 21, 8); l.f(P.teal, 14, 3, 22, 1); l.f(CLINICO.luz, 14, 3, 1, 8);
      [AZ.b, RO.b, P.yellow, P.yellow, AZ.b, RO.b].forEach((c, i) => { const a = 16 + (i % 3) * 7, b = 5 + ((i / 3) | 0) * 4; l.f(P.ink, a - 1, b - 1, 5, 4); l.f(c, a, b, 3, 2); });
    }
    if (!curacion) { // v2.144 · tienda: caja registradora (izquierda) y cesta de bayas (derecha) sobre la tapa
      caja(l, 6, 5, 12, 9, P.greyD, P.grey2, P.ink2); l.f(P.glow, 8, 6, 8, 3); l.f(P.white, 8, 6, 8, 1); [8, 11, 14].forEach((x) => l.f(P.grey2, x, 10, 2, 2)); l.f(P.yellow, 7, 12, 10, 1);
      l.f(P.brown, 32, 9, 12, 5, P.wood2); l.f(P.woodD, 32, 12, 12, 2); l.f(P.wood2, 32, 9, 12, 1); [[33, P.red], [36, AZ.b], [39, P.red], [42, P.yellow]].forEach(([x, c]) => { l.f(c, x, 7, 3, 3); l.p(P.white, x, 7); });
    }
    caja(l, 1, 14, 48, 5, M.tapa, '#ffffff', M.sombra); l.f(M.frente === M.base ? M.luz : M.frente, 1, 19, 48, 7); l.f(M.luz, 1, 19, 1, 7); l.f(M.sombra, 47, 19, 2, 7); l.f(M.borde, 1, 26, 48, 3); l.f(M.borde2, 1, 26, 48, 1); // tapa, frente y rodapié
    l.f(M.sombra, 15, 19, 1, 7); l.f(M.sombra, 33, 19, 1, 7); // juntas de los paneles, simétricas respecto al eje (x 24,5)
    campana(l, 23, 21); return l.outline();
  }
  // TERMINAL de ordenador: 1 casilla (mesa 16 px + monitor 12 px). Lienzo 18×18.
  function terminal() {
    const l = L(18, 18);
    caja(l, 1, 9, 16, 8, CLINICO.base, CLINICO.luz, CLINICO.sombra); l.f(CLINICO.borde, 1, 15, 16, 2);
    caja(l, 3, 1, 12, 8, P.greyD, P.grey2, P.ink2); l.f(P.glow, 4, 2, 10, 5); l.f(P.white, 4, 2, 10, 1); l.f(P.grey, 4, 12, 10, 2); l.f(P.grey2, 4, 14, 10, 1); // pantalla (emite luz) y teclado
    return l.outline();
  }
  const pantalla = (ctx, ox, oy, reloj, reducido) => { if (reducido) return; const k = Math.floor(reloj * 2) % 4; ctx.fillStyle = '#d9fff7'; ctx.fillRect(ox + 4, oy + 3 + k, 10, 1); }; // línea de barrido que baja
  // BANCO DOBLE de 2 casillas (32 px): mitad azul (Lali) y mitad rosa (Oli); `inv` = espejo (rosa-azul), para la pareja simétrica. Lienzo 34×15.
  function banco(inv) {
    const l = L(34, 15), a = inv ? RO : AZ, b = inv ? AZ : RO;
    caja(l, 1, 7, 32, 7, MADERA.sombra, MADERA.base, MADERA.hondo); caja(l, 1, 1, 16, 6, a.b, a.l, a.s); caja(l, 17, 1, 16, 6, b.b, b.l, b.s); l.f(P.ink2, 16, 1, 2, 6);
    return l.outline();
  }
  // PLANTA de 1 casilla: dibujo simétrico de 12 px centrado (x 2..13) en una tabla de 16. Lienzo 16×16.
  function planta() {
    const l = L(16, 16), V = '#76c363';
    caja(l, 5, 9, 6, 6, P.brown, P.wood2, P.woodD);
    [[2, 5, 6], [8, 5, 6], [5, 1, 6]].forEach(([x, y, w]) => caja(l, x, y, w, 5, P.green, V, P.green2)); // tres masas de 6 px: simétricas respecto al eje x = 8
    l.f(P.green2, 6, 6, 4, 4); return l.outline();
  }
  // ESTANTE de 2 casillas: 3 baldas con objetos de colores. Lienzo 34×28.
  function estante(M) {
    const l = L(34, 28); caja(l, 1, 1, 32, 26, M.hondo, M.sombra, M.hondo);
    [2, 11, 20].forEach((y, r) => { l.f(M.base, 3, y, 28, 7); l.f(M.luz, 3, y, 28, 1); l.f(M.sombra, 3, y + 7, 28, 2); [P.red, AZ.b, P.yellow, P.green, RO.b, P.purple, P.orange].forEach((c, i) => { const a = 4 + i * 4; l.f(c, a, y + 2 + ((i + r) % 2), 3, 5 - ((i + r) % 2)); l.f(P.white, a, y + 2 + ((i + r) % 2), 1, 1); }); });
    return l.outline();
  }
  // v2.144 · ESTANTE DE TIENDA (productos, no libros): frascos con tapón, sacos atados y cestas de bayas, con huecos entre piezas. Lienzo 34×28.
  function estanteTienda() {
    const l = L(34, 28); caja(l, 1, 1, 32, 26, VERDE.hondo, VERDE.sombra, VERDE.hondo);
    [2, 11, 20].forEach((y) => { l.f(VERDE.base, 3, y, 28, 7); l.f(VERDE.luz, 3, y, 28, 1); l.f(VERDE.sombra, 3, y + 7, 28, 2); });
    [[5, P.red], [11, AZ.b], [17, P.green], [23, P.purple]].forEach(([x, c]) => { l.f(P.brown, x + 1, 3, 2, 1); l.f('#bfe3f5', x + 1, 4, 2, 1); l.f(c, x, 5, 4, 4); l.p(P.white, x, 5); }); // frascos (fila de arriba)
    [5, 14].forEach((x) => { l.f(P.cream, x, 14, 7, 5); l.f(P.cream, x + 1, 13, 5, 1); l.f(P.red, x + 1, 13, 5, 1); l.f(P.cream2, x + 5, 15, 2, 4); }); l.f(P.wood2, 23, 14, 7, 5); l.f(P.white, 24, 15, 5, 2); l.f(P.red, 25, 15, 3, 1); // sacos y una caja con etiqueta
    [[5, P.red], [14, P.yellow], [23, P.purple]].forEach(([x, c]) => { l.f(P.brown, x, 24, 7, 4 - 1); l.f(P.woodD, x, 26, 7, 1); [1, 3, 5].forEach((d) => { l.f(c, x + d - 1, 22, 2, 2); l.p(P.white, x + d - 1, 22); }); }); // cestas de bayas (fila de abajo)
    return l.outline();
  }
  // v2.145 · piezas de identidad de la Tienda. MESA DE EXHIBICIÓN (2 casillas): dos cestas de bayas simétricas sobre la mesa. Lienzo 34×20.
  const cestas = (l) => [5, 20].forEach((x, i) => { l.f(P.brown, x, 6, 9, 5); l.f(P.woodD, x, 9, 9, 2); [[1, P.red], [4, i ? P.yellow : AZ.b], [7, P.red]].forEach(([d, c]) => { l.f(c, x + d - 1, 3, 3, 3); l.p(P.white, x + d - 1, 3); }); });
  // BARRIL CON FRUTAS (1 casilla): aros de hierro y tres frutas asomando. Lienzo 16×22.
  function barril() {
    const l = L(16, 22); caja(l, 2, 8, 12, 13, P.wood2, P.wood1, P.woodD); l.f(P.greyD, 2, 11, 12, 1); l.f(P.greyD, 2, 17, 12, 1); l.f(P.woodD, 2, 7, 12, 2);
    [[5, P.red], [8, P.yellow], [11, P.green]].forEach(([x, c], i) => { l.disc(c, x, i === 1 ? 4 : 5, 2.3); l.p(P.white, x - 1, i === 1 ? 3 : 4); }); return l.outline();
  }
  // PILA DE SACOS Y CAJAS (1 casilla): caja con etiqueta y un saco atado encima, centrados. Lienzo 16×22.
  function sacos() {
    const l = L(16, 22); caja(l, 1, 12, 14, 9, P.wood2, P.wood1, P.woodD); l.f(P.white, 5, 14, 6, 3); l.f(P.red, 7, 15, 2, 1);
    l.f(P.cream, 3, 5, 10, 8); l.f(P.cream, 5, 3, 6, 2); l.f(P.red, 5, 4, 6, 1); l.f(P.cream2, 11, 6, 2, 7); l.f(P.white, 4, 6, 1, 3); return l.outline();
  }
  // v2.147 · piezas del Laboratorio. ESCÁNER de criaturas (1 casilla): arco con un panel de luz entre dos postes sobre un pedestal. Lienzo 16×26.
  function escaner() {
    const l = L(16, 26); caja(l, 1, 18, 14, 7, VIOLETA.sombra, VIOLETA.luz, VIOLETA.hondo); caja(l, 2, 2, 3, 17, VIOLETA.base, VIOLETA.luz, VIOLETA.sombra); caja(l, 11, 2, 3, 17, VIOLETA.base, VIOLETA.luz, VIOLETA.sombra); caja(l, 2, 1, 12, 3, VIOLETA.base, VIOLETA.luz, VIOLETA.sombra);
    l.f('#bfe3f5', 5, 5, 6, 13); l.f(P.white, 5, 5, 1, 13); l.f(P.glow, 6, 9, 4, 1); return l.outline();
  }
  const estudio = (l) => { l.f(P.red, 5, 4, 7, 5); l.f(P.cream, 6, 5, 5, 1); l.f(P.cream, 6, 7, 5, 1); l.f('#bfe3f5', 24, 4, 4, 5); l.f(P.purple, 24, 7, 4, 2); l.f(P.white, 24, 4, 1, 3); }; // libro y probeta sobre la mesa de estudio
  // v2.154 · piezas de la Casa de Oli. ESTANTE DE AVENTURERO (2 casillas): copa dorada, brújula, linterna y frascos en baldas de madera. Lienzo 34×28.
  function estanteOli() {
    const l = L(34, 28), M = MADERA; caja(l, 1, 1, 32, 26, M.hondo, M.sombra, M.hondo);
    [2, 11, 20].forEach((y) => { l.f(M.base, 3, y, 28, 7); l.f(M.luz, 3, y, 28, 1); l.f(M.sombra, 3, y + 7, 28, 2); });
    l.f(P.yellow, 6, 5, 6, 3); l.f(P.yellow, 8, 8, 2, 1); l.f(P.orange, 7, 9, 4, 1); l.f(P.yellow, 5, 4, 1, 2); l.f(P.yellow, 12, 4, 1, 2); l.p(P.white, 7, 5); // copa
    l.ell(P.ink, 22, 7, 3.4, 3.4); l.ell('#bfe3f5', 22, 7, 2.6, 2.6); l.f(P.red, 22, 5, 1, 2); l.p(P.white, 21, 6); // brújula
    l.f(AZ.b, 5, 14, 5, 5); l.f(AZ.l, 5, 14, 1, 5); l.f(P.yellow, 6, 12, 3, 2); l.f(P.cream, 16, 14, 8, 5); l.f(P.cream2, 22, 15, 2, 4); l.f(P.red, 16, 14, 8, 1); // linterna y saco
    [[5, P.green], [11, AZ.b], [17, P.red], [23, P.purple]].forEach(([x, c]) => { l.f(P.brown, x + 1, 22, 2, 1); l.f(c, x, 23, 4, 4); l.p(P.white, x, 23); }); // frascos
    return l.outline();
  }
  // MESA CON DOS SILLAS (3 casillas, 48 px): mesa de 2 casillas centrada y una silla a cada lado, simétrica. Lienzo 50×22.
  function mesaSillas(C = AZ) {
    const l = L(50, 22), M = MADERA;
    [2, 42].forEach((x) => { caja(l, x, 6, 6, 8, M.base, M.luz, M.sombra); caja(l, x + 1, 1, 4, 5, M.sombra, M.base, M.hondo); l.f(M.hondo, x + 1, 14, 1, 5); l.f(M.hondo, x + 4, 14, 1, 5); }); // sillas con respaldo, 1 px más pequeñas: no tocan la pared
    caja(l, 9, 4, 32, 12, M.tapa, '#ffffff', M.sombra); l.f(M.sombra, 9, 15, 32, 2); [10, 37].forEach((x) => l.f(M.hondo, x, 17, 3, 4)); // tablero y patas
    l.f(C.b, 22, 7, 6, 5); l.f(C.l, 22, 7, 6, 1); l.f(P.white, 24, 5, 2, 2); // taza (azul en la Casa de Oli, rosa en la de Lali) y su vapor
    return l.outline();
  }
  // CAMA de 1×2 casillas (16×32): cabecero arriba, almohada y manta azul (Lali) o rosa (Oli). Lienzo 18×34.
  function cama(c) {
    const l = L(18, 34); caja(l, 1, 1, 16, 32, MADERA.sombra, MADERA.base, MADERA.hondo); caja(l, 2, 4, 14, 8, P.white, P.white, P.cream2); caja(l, 2, 12, 14, 19, c.b, c.l, c.s); l.f(P.white, 2, 12, 14, 3);
    return l.outline();
  }
  // MESA de 2 casillas (32×18) con tapa clara y cuatro patas.
  function mesa(M, extra) {
    const l = L(34, 20); caja(l, 1, 1, 32, 12, M.tapa, '#ffffff', M.sombra); l.f(M.sombra, 1, 12, 32, 2); if (extra) extra(l);
    [2, 29].forEach((x) => l.f(M.hondo, x, 14, 3, 5)); return l.outline();
  }
  // INCUBADORA de 1 casilla: cápsula de cristal con un huevo que brilla (emite luz). Lienzo 16×26.
  function incubadora(brillo, M = CLINICO) {
    const l = L(16, 26); caja(l, 1, 18, 14, 7, M.borde, M.borde2, P.night); l.f('#bfe3f5', 2, 1, 12, 17); l.f(P.white, 2, 1, 2, 17); l.f('#9cc4f5', 12, 1, 2, 17);
    l.ell(P.cream, 8, 11, 3.6, 5); l.f(brillo ? '#fff3b0' : P.yellow, 7, 9, 3, 3); l.p(P.white, 6, 8); l.f(P.cream2, 9, 14, 2, 2); return l.outline();
  }
  const huevo = (ctx, ox, oy, reloj, reducido) => { if (reducido) return; if (Math.floor(reloj * 1.5) % 2) { ctx.fillStyle = 'rgba(255,243,176,0.85)'; ctx.fillRect(ox + 8, oy + 9, 3, 3); } };
  // CONSOLA DE LOS 7 CRISTALES de 3 casillas (48 px): siete cristales elementales (4 px de ancho, paso 6, centrados) sobre un pedestal. Lienzo 50×26.
  function cristales(M = CLINICO) {
    const l = L(50, 26); caja(l, 1, 14, 48, 11, M.base, M.luz, M.sombra); l.f(M.borde, 1, 22, 48, 3);
    ['#5dae5a', '#f0603e', '#3f9bd6', '#f7d54a', '#bfe3f5', '#8a7f72', '#7a4cb0'].forEach((c, i) => { const x = 5 + i * 6; l.f(c, x, 4, 4, 10); l.f(c, x + 1, 2, 2, 2); l.f(P.white, x, 4, 1, 6); l.f(P.white, x + 1, 2, 1, 1); });
    return l.outline();
  }
  // VITRINA de tienda, 2 casillas (32 px): cristal con tres objetos. Lienzo 34×20.
  function vitrina(frasco) { // v2.144: una sola pieza destacada y centrada (gema o frasco grande) sobre un pie
    const l = L(34, 20); caja(l, 1, 1, 32, 18, VERDE.base, VERDE.luz, VERDE.sombra); l.f('#bfe3f5', 3, 3, 28, 9); l.f(P.white, 3, 3, 3, 9); l.f(VERDE.sombra, 3, 13, 28, 1);
    if (frasco) { l.f(P.brown, 16, 3, 2, 1); l.f('#e9f6fa', 16, 4, 2, 2); l.disc(P.purple, 17, 8, 3.6); l.f(P.white, 14, 6, 1, 2); }
    else { [[16, 4, 2], [15, 5, 4], [14, 6, 6], [14, 7, 6], [15, 8, 4], [16, 9, 2]].forEach(([x, y, w]) => l.f('#f0603e', x, y, w, 1)); l.f(P.white, 15, 6, 1, 2); l.f(P.red, 17, 8, 2, 1); }
    l.f(VERDE.hondo, 12, 11, 10, 1); return l.outline();
  }
  // ALTAR de la ermita, 2 casillas (32 px): piedra con la campana de dos mitades centrada y dos velas simétricas. Lienzo 34×26.
  function altar() {
    const l = L(34, 26); caja(l, 1, 10, 32, 15, P.stone1, P.grey, P.stone3); caja(l, 9, 6, 16, 6, P.stone2, P.grey, P.stone3);
    campana(l, 15, 1); [4, 27].forEach((x) => { l.f(P.white, x, 5, 3, 7); l.f(P.cream2, x + 2, 5, 1, 7); }); return l.outline();
  }
  const vela = (ctx, ox, oy, reloj, reducido) => { const k = reducido ? 0 : Math.floor(reloj * 3) % 2; [4, 27].forEach((x) => { ctx.fillStyle = P.yellow; ctx.fillRect(ox + x, oy + 2 + k, 3, 3 - k); ctx.fillStyle = P.orange; ctx.fillRect(ox + x + 1, oy + 4, 1, 1); }); };


  // SALA DEL CENTRO PC (ID-5d, dirección B de docs/BIBLIA_INTERIORES.md §1b): suelo de baldosa, paredes, ventanas, cartel, alfombra y puerta, en UNA pieza de fondo (capa «bajo», se hornea con el suelo) de 13×10 casillas. Eje central: x = 104.
  // Las casillas del mapa ('#' pared, '_' suelo, 'd' puerta) mandan en la colisión; esta pieza solo las viste. Mobiliario: piezas de arriba, colocadas según la tabla de la biblia.
  function salaCentroPC() {
    const W = 208, H = 160, EJE = 104, l = L(W, H), f = l.f, S = { suelo: '#cfe3df', suelo2: '#b3cfcb', pared: P.white, pared2: '#e3ddd0', zocalo: P.teal2, alf: P.teal }, tinta = (x, y, w, h) => f(P.ink, x, y, w, h);
    f(S.pared2, 0, 0, W, H); f(S.suelo, T, 2 * T, W - 2 * T, 7 * T);
    for (let y = 2 * T; y < H - T; y += 8) { f(S.suelo2, T, y + 7, W - 2 * T, 1); for (let x = T + ((y / 8) % 2) * 8; x < W - T; x += 16) f(S.suelo2, x, y, 1, 7); } // baldosas de 16×8 alineadas con la rejilla
    f(S.pared, T, 0, W - 2 * T, 2 * T); f(S.zocalo, T, 2 * T - 10, W - 2 * T, 10); f(P.white, T, 2 * T - 10, W - 2 * T, 1); for (let x = T; x < W - T; x += 12) f(S.pared2, x, 0, 1, 2 * T - 11); // pared trasera de 2 casillas con zócalo
    f(S.zocalo, T - 3, 0, 3, H - T); f(S.zocalo, W - T, 0, 3, H - T); f(S.zocalo, 0, H - T, W, 3); // zócalo de las paredes laterales y delantera
    tinta(T - 1, 0, 1, H - T); tinta(W - T, 0, 1, H - T); tinta(0, H - T - 1, W, 1); tinta(0, 0, W, 1); tinta(0, 2 * T - 1, W, 1);
    salida(l, W, H, EJE, { alf: S.alf, claro: '#9fd3cc', hoja: P.teal, marco: P.teal2 });
    // ventanas simétricas respecto al eje; su luz cae al suelo hacia abajo-derecha (como toda la luz del juego), en banda lisa
    [2 * T + 1, W - 2 * T - 15].forEach((vx) => { tinta(vx - 1, 4, 16, 16); f(AZ.b, vx, 5, 14, 14); f(P.white, vx, 5, 14, 1); f(P.white, vx, 5, 1, 14); f(AZ.s, vx, 17, 14, 2); f(P.white, vx + 6, 5, 2, 14); f(P.white, vx, 11, 14, 2);
      l.x.fillStyle = 'rgba(200,240,255,0.27)'; l.x.beginPath(); l.x.moveTo(vx + 2, 2 * T); l.x.lineTo(vx + 14, 2 * T); l.x.lineTo(vx + 26, 4 * T + 8); l.x.lineTo(vx + 14, 4 * T + 8); l.x.fill(); });
    tinta(EJE - 15, 3, 30, 14); f(S.zocalo, EJE - 14, 4, 28, 12); f(P.teal, EJE - 14, 4, 28, 1); f(P.night, EJE - 14, 14, 28, 2); l.ell(P.ink, EJE, 10, 7.2, 6.2); l.ell(P.red, EJE, 10, 6, 5); f(P.white, EJE - 1, 7, 3, 7); f(P.white, EJE - 3, 9, 7, 3); // cartel del Centro PC centrado: barra azul verdosa y círculo rojo
    return l;
  }

  // v2.142 · SALIDA (puerta de dos hojas con ventanilla, marco y dintel de 1 px, felpudo 12×7, alfombra 1×2 y banda de luz de calle), todo simétrico respecto a EJE; c = {alf, claro, hoja, marco}
  function salida(l, W, H, EJE, c) {
    const f = l.f, tinta = (x, y, w, h) => f(P.ink, x, y, w, h), rx = EJE - 8, ry = H - 4 * T;
    if (c.ancha) { // alfombra de 3×1 con borde tejido y una brújula en el centro (Casa de Oli)
      const ax = EJE - 24; tinta(ax - 1, ry - 1, 50, T + 2); f(c.alf, ax, ry, 48, T); f(c.claro, ax + 2, ry + 2, 44, T - 4); for (let x = ax + 4; x < ax + 44; x += 4) { f(c.alf, x, ry + 2, 2, 1); f(c.alf, x, ry + T - 3, 2, 1); }
      if (c.flor) { [[-3, 0], [3, 0], [0, -3], [0, 3]].forEach(([dx, dy]) => l.disc(c.alf, EJE + dx, ry + 8 + dy, 2.4)); l.disc(P.yellow, EJE, ry + 8, 1.9); } // flor de cuatro pétalos
      else { l.ell(P.ink, EJE, ry + 8, 5.2, 5.2); l.ell(P.white, EJE, ry + 8, 4.2, 4.2); f(c.alf, EJE - 1, ry + 4, 2, 9); f(c.alf, EJE - 4, ry + 7, 9, 2); f(P.red, EJE - 1, ry + 4, 2, 4); } }
    else { tinta(rx - 1, ry - 1, 18, 2 * T + 2); f(c.alf, rx, ry, 16, 2 * T); f(c.claro, rx + 1, ry + 1, 14, 2 * T - 2); for (let y = ry + 4; y < ry + 2 * T - 4; y += 8) f(c.alf, rx + 6, y, 4, 4); } // alfombra 1×2 hacia el interior
    tinta(EJE - 7, H - 2 * T + 6, 14, 9); f('#4a5560', EJE - 6, H - 2 * T + 7, 12, 7); f('#6b7886', EJE - 5, H - 2 * T + 8, 10, 1); f('#6b7886', EJE - 5, H - 2 * T + 12, 10, 1); // felpudo neutro 12×7
    tinta(EJE - 9, H - T - 1, 18, T + 1); f(c.marco, EJE - 8, H - T, 16, T); // marco y dintel de 1 px por fuera
    [EJE - 7, EJE + 1].forEach((hx, i) => { f(c.hoja, hx, H - T + 2, 6, 13); f(c.marco, hx, H - T + 11, 6, 4); f(AZ.b, hx + 1, H - T + 4, 4, 6); f('#d8f4f8', hx + 1, H - T + 4, 1, 2); f(P.yellow, i ? hx : hx + 5, H - T + 8, 1, 2); }); // hojas de 6 px con ventanilla, reflejo, rodapié y tirador junto a la junta
    f(P.ink, EJE - 1, H - T + 2, 2, 13); // junta central
    l.x.fillStyle = 'rgba(0,0,0,0.25)'; l.x.fillRect(EJE - 7, H - T + 2, 14, 1); // sombra bajo el dintel
    l.x.fillStyle = 'rgba(255,226,150,0.24)'; l.x.beginPath(); l.x.moveTo(EJE - 8, H - T - 1); l.x.lineTo(EJE + 8, H - T - 1); l.x.lineTo(EJE + 6, H - T - 25); l.x.lineTo(EJE - 6, H - T - 25); l.x.fill(); // banda de luz de calle sobre el eje
  }
  // v2.143 · SALA DE LA TIENDA 11×8 (176×128), eje x = 88: madera clara y crema; ventana con toldo a rayas rojas y crema centrada en el eje; la planta de muebles es asimétrica (mostrador a la derecha)
  function salaTienda() {
    const W = 176, H = 128, EJE = 88, l = L(W, H), f = l.f, tinta = (x, y, w, h) => f(P.ink, x, y, w, h), S = { suelo: '#c9754a', suelo2: '#a85d38', pared: '#f6ebcf', pared2: '#e8d6ab', zocalo: VERDE.base }, ROJO = '#d94a3f';
    f(S.pared2, 0, 0, W, H); f(S.suelo, T, 2 * T, W - 2 * T, 5 * T);
    for (let y = 2 * T; y < H - T; y += 16) { f(S.suelo2, T, y + 15, W - 2 * T, 1); for (let x = T; x < W - T; x += 16) { f(S.suelo2, x + 15, y, 1, 15); f('#dc8f64', x + 1, y + 1, 2, 1); } } // baldosas terracota de 16×16 alineadas con la rejilla
    f(S.pared, T, 0, W - 2 * T, 2 * T); f(S.zocalo, T, 2 * T - 10, W - 2 * T, 10); f(VERDE.luz, T, 2 * T - 10, W - 2 * T, 1); for (let x = T; x < W - T; x += 12) f(S.pared2, x, 0, 1, 2 * T - 11);
    f(S.zocalo, T - 3, 0, 3, H - T); f(S.zocalo, W - T, 0, 3, H - T); f(S.zocalo, 0, H - T, W, 3);
    tinta(T - 1, 0, 1, H - T); tinta(W - T, 0, 1, H - T); tinta(0, H - T - 1, W, 1); tinta(0, 0, W, 1); tinta(0, 2 * T - 1, W, 1);
    // pizarra de precios en el eje (x 76..99): marco verde oscuro, tiza con rayas de precio y una manzana
    tinta(EJE - 13, 3, 26, 17); f(VERDE.hondo, EJE - 12, 4, 24, 15); f('#2f3b36', EJE - 10, 6, 20, 11);
    [8, 11, 14].forEach((y, i) => { f('#f6ebcf', EJE - 8, y, 7 - i, 1); f(P.yellow, EJE + 3, y, 4, 1); }); l.disc(P.red, EJE + 6, 8, 1.6); f(P.green, EJE + 6, 5, 1, 1);
    // cartel de la bolsa dorada sobre el mostrador (x 96..144, centro 120) y, a la izquierda de la pizarra, hierbas y un saco colgados de una cuerda
    tinta(108, 3, 24, 16); f(ROJO, 109, 4, 22, 14); f('#fff4d8', 109, 4, 22, 1); f('#fff4d8', 109, 17, 22, 1); f(P.yellow, 116, 8, 8, 8); f(P.yellow, 118, 6, 4, 2); f(P.orange, 116, 14, 8, 2); f(P.white, 117, 9, 1, 3); f(ROJO, 119, 5, 2, 1);
    f(P.ink, 50, 4, 24, 1); [[52, P.green], [56, P.green2], [60, P.green]].forEach(([x, c]) => { f(P.ink, x + 1, 5, 1, 2); f(c, x, 7, 3, 7); f(P.white, x, 7, 1, 2); }); f(P.red, 55, 6, 5, 1); f(P.cream, 66, 8, 6, 6); f(P.cream, 67, 7, 4, 1); f(P.red, 67, 7, 4, 1); f(P.cream2, 70, 9, 2, 5); f(P.ink, 68, 5, 1, 2);
    salida(l, W, H, EJE, { alf: ROJO, claro: '#f3dfae', hoja: VERDE.base, marco: VERDE.hondo });
    return l;
  }

  // v2.147 · SALA DEL LABORATORIO 13×9 (208×144), eje x = 104: damero lavanda, paredes crema, zócalo ciruela con filete dorado; dos ojos de buey y el emblema del huevo en el eje; luz cálida en el suelo bajo la incubadora central (casilla 6,4)
  function salaLaboratorio() {
    const W = 208, H = 144, EJE = 104, l = L(W, H), f = l.f, tinta = (x, y, w, h) => f(P.ink, x, y, w, h), S = { a: '#b9a8d6', b: '#a597c6', pared: '#f6ebcf', pared2: '#e8d6ab' };
    f(S.pared2, 0, 0, W, H);
    for (let y = 2 * T; y < H - T; y += T) for (let x = T; x < W - T; x += T) f(((x / T + y / T) % 2) ? S.b : S.a, x, y, T, T); // damero de baldosas de 16×16 alineado con la rejilla
    f(S.pared, T, 0, W - 2 * T, 2 * T); f(VIOLETA.sombra, T, 2 * T - 10, W - 2 * T, 10); f('#e8c47a', T, 2 * T - 10, W - 2 * T, 1); for (let x = T; x < W - T; x += 12) f(S.pared2, x, 0, 1, 2 * T - 11);
    f(VIOLETA.sombra, T - 3, 0, 3, H - T); f(VIOLETA.sombra, W - T, 0, 3, H - T); f(VIOLETA.sombra, 0, H - T, W, 3);
    tinta(T - 1, 0, 1, H - T); tinta(W - T, 0, 1, H - T); tinta(0, H - T - 1, W, 1); tinta(0, 0, W, 1); tinta(0, 2 * T - 1, W, 1);
    [EJE - 40, EJE + 40].forEach((cx) => { l.ell(P.ink, cx, 11, 7.2, 7.2); l.ell(VIOLETA.luz, cx, 11, 6.2, 6.2); l.ell(AZ.b, cx, 11, 4.6, 4.6); f(P.white, cx - 3, 8, 2, 1); f(VIOLETA.luz, cx - 5, 11, 10, 1); f(VIOLETA.luz, cx, 6, 1, 10); }); // ojos de buey simétricos
    tinta(EJE - 13, 3, 26, 15); f(VIOLETA.sombra, EJE - 12, 4, 24, 13); l.ell(P.cream, EJE, 11, 4.4, 5.6); f(P.yellow, EJE - 1, 9, 3, 3); f('#e8c47a', EJE - 12, 4, 24, 1); // emblema: huevo sobre placa ciruela
    l.x.fillStyle = 'rgba(255,220,140,0.2)'; l.x.beginPath(); l.x.ellipse(EJE, 4 * T + 10, 30, 15, 0, 0, Math.PI * 2); l.x.fill(); l.x.fillStyle = 'rgba(255,230,160,0.18)'; l.x.beginPath(); l.x.ellipse(EJE, 4 * T + 10, 17, 8, 0, 0, Math.PI * 2); l.x.fill(); // luz cálida
    salida(l, W, H, EJE, { alf: VIOLETA.luz, claro: '#d9cff0', hoja: VIOLETA.base, marco: VIOLETA.hondo });
    return l;
  }

  // v2.154 · SALA DE LA CASA DE OLI 9×7 (144×112), eje x = 72, paleta A «azul mar y madera clara»: tablones claros, paredes crema, zócalo de madera, ventana con cortinas azules sobre la cama, mapa del tesoro en el eje y percha con mochila
  function salaCasaOli() {
    const W = 144, H = 112, EJE = 72, l = L(W, H), f = l.f, tinta = (x, y, w, h) => f(P.ink, x, y, w, h), S = { suelo: '#d9a96e', suelo2: '#bf8a52', pared: '#f7e9cb', pared2: '#e8d6ab', zocalo: '#8f5c33' };
    f(S.pared2, 0, 0, W, H); f(S.suelo, T, 2 * T, W - 2 * T, 4 * T);
    for (let y = 2 * T; y < H - T; y += 16) { f(S.suelo2, T, y + 15, W - 2 * T, 1); for (let x = T + ((y / 16) % 2) * 16; x < W - T; x += 32) f(S.suelo2, x, y, 1, 15); } // tablones de 32×16 alineados con la rejilla
    f(S.pared, T, 0, W - 2 * T, 2 * T); f(S.zocalo, T, 2 * T - 10, W - 2 * T, 10); f('#c48b52', T, 2 * T - 10, W - 2 * T, 1); for (let x = T; x < W - T; x += 12) f(S.pared2, x, 0, 1, 2 * T - 11);
    f(S.zocalo, T - 3, 0, 3, H - T); f(S.zocalo, W - T, 0, 3, H - T); f(S.zocalo, 0, H - T, W, 3);
    tinta(T - 1, 0, 1, H - T); tinta(W - T, 0, 1, H - T); tinta(0, H - T - 1, W, 1); tinta(0, 0, W, 1); tinta(0, 2 * T - 1, W, 1);
    // Ventana 13×14 con cuatro cristales IGUALES de 5×5 (marco 1 px, travesaño 1 px, antepecho 2 px), eje en x = 27; cortinas de 5 px, espejo exacto una de otra (x → 54 − x)
    const vx = 21; tinta(vx - 1, 5, 15, 16); f(P.white, vx, 6, 13, 14); [[vx + 1, 7], [vx + 7, 7], [vx + 1, 13], [vx + 7, 13]].forEach(([x, y]) => { f(AZ.b, x, y, 5, 5); f(AZ.l, x, y, 1, 1); }); f(AZ.s, vx, 18, 13, 2);
    f(P.woodD, 16, 4, 23, 2); f(P.yellow, 16, 3, 1, 4); f(P.yellow, 38, 3, 1, 4); // barra de la cortina con remates dorados
    [0, 1].forEach((lado) => { // dos cortinas: pliegues, lazada a media altura y caída ensanchada (la derecha es el espejo de la izquierda)
      const px = (c, y, col) => f(col, lado ? 54 - (16 + c) : 16 + c, y, 1, 1);
      for (let y = 6; y < 21; y++) { const w = y >= 12 && y <= 13 ? 3 : 5; for (let c = 0; c < w; c++) px(c, y, c === 0 ? AZ.l : (c % 2 ? AZ.b : AZ.s)); }
      px(3, 12, P.yellow); px(3, 13, P.yellow); px(0, 20, P.yellow); // lazada dorada
    });
    l.x.fillStyle = 'rgba(255,236,170,0.22)'; l.x.beginPath(); l.x.moveTo(vx + 2, 2 * T); l.x.lineTo(vx + 14, 2 * T); l.x.lineTo(vx + 26, 4 * T + 4); l.x.lineTo(vx + 14, 4 * T + 4); l.x.fill();
    tinta(EJE - 12, 3, 24, 17); f('#f0d9a0', EJE - 11, 4, 22, 15); f('#d8be7c', EJE - 11, 4, 22, 1); f('#d8be7c', EJE - 11, 18, 22, 1); [[EJE - 8, 14], [EJE - 5, 11], [EJE - 2, 12], [EJE + 1, 9], [EJE + 4, 8]].forEach(([x, y]) => f(AZ.s, x, y, 2, 1)); f(P.red, EJE + 6, 6, 3, 1); f(P.red, EJE + 7, 5, 1, 3); // mapa del tesoro con ruta y una X roja
    f(P.woodD, 42, 8, 17, 2); [43, 53, 57].forEach((x) => f(P.yellow, x, 7, 2, 2)); // percha con mochila y botas
    f(P.brown, 42, 10, 1, 9); f(P.brown, 51, 10, 1, 9); f('#b83a30', 43, 10, 8, 4); f(P.red, 43, 14, 8, 7); f(P.woodD, 45, 16, 4, 3); f(P.yellow, 46, 12, 1, 2); f(P.white, 44, 15, 1, 3); // mochila: solapa, bolsillo y correas
    [53, 57].forEach((x) => { f(P.woodD, x, 10, 2, 5); f(P.woodD, x, 15, 3, 2); f(P.wood2, x, 10, 1, 5); });
    salida(l, W, H, EJE, { alf: AZ.b, claro: '#cfe0fa', hoja: P.wood1, marco: P.woodD, ancha: true });
    return l;
  }

  // v2.158 · SALA DE LA CASA DE LALI 9×7 (144×112), eje x = 72, paleta «rosa pastel y madera clara»: paredes rosadas, zócalo rosa, tablones pálidos, espejo ovalado en el eje y ventana con cortinas rosas sobre la cama (eje de la ventana x = 104, la columna de la cama); alfombra con flor
  function salaCasaLali() {
    const W = 144, H = 112, EJE = 72, l = L(W, H), f = l.f, tinta = (x, y, w, h) => f(P.ink, x, y, w, h), S = { suelo: '#ebd6b2', suelo2: '#cfae7c', pared: '#fbe9ec', pared2: '#efd0d6', zocalo: RO.s };
    f(S.pared2, 0, 0, W, H); f(S.suelo, T, 2 * T, W - 2 * T, 4 * T);
    for (let y = 2 * T; y < H - T; y += 16) { f(S.suelo2, T, y + 15, W - 2 * T, 1); for (let x = T + ((y / 16) % 2) * 16; x < W - T; x += 32) f(S.suelo2, x, y, 1, 15); } // tablones pálidos de 32×16 alineados con la rejilla
    f(S.pared, T, 0, W - 2 * T, 2 * T); f(S.zocalo, T, 2 * T - 10, W - 2 * T, 10); f(RO.b, T, 2 * T - 10, W - 2 * T, 1); for (let x = T; x < W - T; x += 12) f(S.pared2, x, 0, 1, 2 * T - 11);
    f(S.zocalo, T - 3, 0, 3, H - T); f(S.zocalo, W - T, 0, 3, H - T); f(S.zocalo, 0, H - T, W, 3);
    tinta(T - 1, 0, 1, H - T); tinta(W - T, 0, 1, H - T); tinta(0, H - T - 1, W, 1); tinta(0, 0, W, 1); tinta(0, 2 * T - 1, W, 1);
    // espejo ovalado centrado en el eje (x = 72)
    l.ell(P.ink, EJE, 11, 7.8, 9.8); l.ell(RO.s, EJE, 11, 6.8, 8.8); l.ell(RO.b, EJE, 11, 5.8, 7.8); l.ell('#d8f0f8', EJE, 11, 4.6, 6.6); f(P.white, EJE - 3, 6, 1, 3); f(P.white, EJE - 2, 5, 1, 1);
    // ventana 13×14 con cuatro cristales idénticos de 5×5, eje en x = 104; cortinas rosas de 5 px, espejo exacto una de otra (x → 208 − x)
    const vx = 98; tinta(vx - 1, 5, 15, 16); f(P.white, vx, 6, 13, 14); [[vx + 1, 7], [vx + 7, 7], [vx + 1, 13], [vx + 7, 13]].forEach(([x, y]) => { f(AZ.b, x, y, 5, 5); f(AZ.l, x, y, 1, 1); }); f(RO.s, vx, 18, 13, 2);
    f(P.woodD, 92, 4, 25, 2); f(P.yellow, 92, 3, 1, 4); f(P.yellow, 116, 3, 1, 4);
    [0, 1].forEach((lado) => { const px = (c, y, col) => f(col, lado ? 208 - (92 + c) : 92 + c, y, 1, 1);
      for (let y = 6; y < 21; y++) { const w = y >= 12 && y <= 13 ? 3 : 5; for (let c = 0; c < w; c++) px(c, y, c === 0 ? RO.l : (c % 2 ? RO.b : RO.s)); }
      px(3, 12, P.yellow); px(3, 13, P.yellow); px(0, 20, P.yellow); });
    l.x.fillStyle = 'rgba(255,236,200,0.22)'; l.x.beginPath(); l.x.moveTo(vx + 1, 2 * T); l.x.lineTo(vx + 12, 2 * T); l.x.lineTo(vx + 24, 4 * T + 4); l.x.lineTo(vx + 13, 4 * T + 4); l.x.fill();
    salida(l, W, H, EJE, { alf: RO.s, claro: '#fde6ec', hoja: P.wood1, marco: P.woodD, ancha: true, flor: true });
    return l;
  }


  // v2.369 · SALA DE LA CABAÑA DEL SANTUARIO 11×8 (176×128), eje x = 88: tablones claros, paredes crema, zócalo verde Santuario; dos ventanas simétricas (columnas 2 y 8) y una placa con una hoja en el eje; alfombra de flor delante de la puerta
  function salaCabana() {
    const W = 176, H = 128, EJE = 88, l = L(W, H), f = l.f, tinta = (x, y, w, h) => f(P.ink, x, y, w, h), S = { suelo: '#d9a96e', suelo2: '#bf8a52', pared: '#f6ebcf', pared2: '#e8d6ab', zocalo: VERDE.base };
    f(S.pared2, 0, 0, W, H); f(S.suelo, T, 2 * T, W - 2 * T, 5 * T);
    for (let y = 2 * T; y < H - T; y += 16) { f(S.suelo2, T, y + 15, W - 2 * T, 1); for (let x = T + ((y / 16) % 2) * 16; x < W - T; x += 32) f(S.suelo2, x, y, 1, 15); } // tablones de 32×16 alineados con la rejilla
    f(S.pared, T, 0, W - 2 * T, 2 * T); f(S.zocalo, T, 2 * T - 10, W - 2 * T, 10); f(VERDE.luz, T, 2 * T - 10, W - 2 * T, 1); for (let x = T; x < W - T; x += 12) f(S.pared2, x, 0, 1, 2 * T - 11);
    f(S.zocalo, T - 3, 0, 3, H - T); f(S.zocalo, W - T, 0, 3, H - T); f(S.zocalo, 0, H - T, W, 3);
    tinta(T - 1, 0, 1, H - T); tinta(W - T, 0, 1, H - T); tinta(0, H - T - 1, W, 1); tinta(0, 0, W, 1); tinta(0, 2 * T - 1, W, 1);
    [2 * T + 1, W - 2 * T - 15].forEach((vx) => { tinta(vx - 1, 4, 16, 16); f(AZ.b, vx, 5, 14, 14); f(P.white, vx, 5, 14, 1); f(P.white, vx, 5, 1, 14); f(VERDE.base, vx, 17, 14, 2); f(P.white, vx + 6, 5, 2, 14); f(P.white, vx, 11, 14, 2); // ventana con travesaños y cortinas verdes en espejo
      f(VERDE.luz, vx - 1, 5, 3, 13); f(VERDE.luz, vx + 12, 5, 3, 13); f(VERDE.sombra, vx + 1, 5, 1, 13); f(VERDE.sombra, vx + 12, 5, 1, 13);
      l.x.fillStyle = 'rgba(255,236,170,0.22)'; l.x.beginPath(); l.x.moveTo(vx + 2, 2 * T); l.x.lineTo(vx + 14, 2 * T); l.x.lineTo(vx + 26, 4 * T + 8); l.x.lineTo(vx + 14, 4 * T + 8); l.x.fill(); });
    tinta(EJE - 13, 3, 26, 15); f(VERDE.sombra, EJE - 12, 4, 24, 13); l.ell(P.cream, EJE, 11, 5, 6.2); f(VERDE.base, EJE - 1, 7, 2, 9); f(VERDE.luz, EJE - 4, 9, 3, 2); f(VERDE.luz, EJE + 1, 11, 3, 2); f('#e8c47a', EJE - 12, 4, 24, 1); // placa con una hoja
    salida(l, W, H, EJE, { alf: VERDE.base, claro: '#cfe6cf', hoja: P.wood1, marco: P.woodD, ancha: true, flor: true });
    return l;
  }
  // tipo → { dibujo, casillas de la huella (cw × ch), anclaje }. ox/oy llevan el dibujo a la casilla (x, y) con la base alineada con el borde sur de la huella.
  // v2.161 · ERMITA DEL PRIMER ECO (ID-5h). ALTAR MAYOR de 3 casillas (48 px) centrado: piedra, escalón, campana de dos mitades y dos velas; panel azul pizarra con dos remaches dorados. Lienzo 50×26 (contenido x 1..48, eje 24,5).
  function altarMayor() {
    const l = L(50, 26); caja(l, 1, 10, 48, 15, P.stone1, P.grey, P.stone3); caja(l, 11, 6, 28, 6, P.stone2, P.grey, P.stone3); campana(l, 23, 1);
    [6, 41].forEach((x) => { l.f(P.white, x, 5, 3, 7); l.f(P.cream2, x + 2, 5, 1, 7); });
    l.f('#e8c47a', 3, 16, 44, 1); l.f('#35559a', 14, 18, 22, 5); l.f('#e8c47a', 17, 20, 2, 1); l.f('#e8c47a', 31, 20, 2, 1); l.f('#4d7fd6', 14, 18, 22, 1); return l.outline();
  }
  const velaMayor = (ctx, ox, oy, reloj, reducido) => { const k = reducido ? 0 : Math.floor(reloj * 3) % 2; [6, 41].forEach((x) => { ctx.fillStyle = P.yellow; ctx.fillRect(ox + x, oy + 2 + k, 3, 3 - k); ctx.fillStyle = P.orange; ctx.fillRect(ox + x + 1, oy + 4, 1, 1); }); };
  // PEDESTAL de 1 casilla (16 px) para cada jugador: base y fuste de piedra y un disco del color del personaje con un destello (x 3..12, eje 7,5). Lienzo 16×22.
  function pedestal(C) {
    const l = L(16, 22); caja(l, 2, 12, 12, 9, P.stone1, P.grey, P.stone3); caja(l, 4, 7, 8, 6, P.stone2, P.grey, P.stone3);
    l.f(C.b, 3, 3, 10, 4); l.f(C.l, 3, 3, 10, 1); l.f(C.s, 3, 6, 10, 1); l.f(P.white, 7, 4, 2, 1); return l.outline();
  }
  // v2.161 · SALA DE LA ERMITA 11×10 (176×160), eje x = 88: capilla de piedra gris con zócalo azul pizarra y filete dorado; siete hornacinas (una por eco, apagadas hasta que se recojan), alfombra de nave que prolonga la de la puerta y luz cálida sobre el altar
  function salaErmita() {
    const W = 176, H = 160, EJE = 88, l = L(W, H), f = l.f, tinta = (x, y, w, h) => f(P.ink, x, y, w, h), S = { a: '#8d8a99', b: '#847f93', pared: '#d6d2e0', pared2: '#b9b4c8', azul: '#35559a', oro: '#e8c47a' };
    f(S.pared2, 0, 0, W, H);
    for (let y = 2 * T; y < H - T; y += T) for (let x = T; x < W - T; x += T) { f(((x / T + y / T) % 2) ? S.b : S.a, x, y, T, T); f('#76738a', x + 15, y, 1, T); f('#76738a', x, y + 15, T, 1); } // losas de 16×16 con junta, alineadas con la rejilla
    f(S.pared, T, 0, W - 2 * T, 2 * T); f(S.azul, T, 2 * T - 10, W - 2 * T, 10); f(S.oro, T, 2 * T - 10, W - 2 * T, 1); for (let x = T; x < W - T; x += 16) f(S.pared2, x, 0, 1, 2 * T - 11);
    f(S.azul, T - 3, 0, 3, H - T); f(S.azul, W - T, 0, 3, H - T); f(S.azul, 0, H - T, W, 3);
    tinta(T - 1, 0, 1, H - T); tinta(W - T, 0, 1, H - T); tinta(0, H - T - 1, W, 1); tinta(0, 0, W, 1); tinta(0, 2 * T - 1, W, 1);
    // siete hornacinas, centradas en el eje cada 20 px: Hoja, Fuego, Agua, Aire (centro, el que sostiene el Primer Eco), Eléctrico, Roca, Sombra; gema apagada (se encenderá con cada eco)
    ['#3d5a40', '#6a3a35', '#34476a', '#5a6877', '#6a5f2e', '#5a4c42', '#4a3a6b'].forEach((c, i) => { const cx = EJE + (i - 3) * 20;
      tinta(cx - 6, 4, 12, 16); f('#2d2a3a', cx - 5, 5, 10, 14); f(S.pared, cx - 6, 4, 1, 1); f(S.pared, cx + 5, 4, 1, 1); f(S.pared2, cx - 5, 5, 10, 1); f(c, cx - 2, 10, 4, 4); f('#4a4660', cx - 2, 10, 4, 1); f(S.oro, cx - 5, 18, 10, 1); });
    l.x.fillStyle = 'rgba(255,220,140,0.2)'; l.x.beginPath(); l.x.ellipse(EJE, 4 * T, 40, 17, 0, 0, Math.PI * 2); l.x.fill(); l.x.fillStyle = 'rgba(255,230,160,0.18)'; l.x.beginPath(); l.x.ellipse(EJE, 4 * T, 22, 9, 0, 0, Math.PI * 2); l.x.fill(); // luz cálida del altar
    salida(l, W, H, EJE, { alf: S.azul, claro: '#6f8fcf', hoja: S.azul, marco: '#1f3366' });
    const rx = EJE - 8; tinta(rx - 1, 63, 1, 34); tinta(rx + 16, 63, 1, 34); tinta(rx - 1, 63, 18, 1); f(S.azul, rx, 64, 16, 33); f('#6f8fcf', rx + 1, 65, 14, 32); for (let y = 68; y < 96; y += 8) f(S.azul, rx + 6, y, 4, 4); // alfombra de nave, continua con la de la puerta
    return l;
  }

  const PIEZAS = {
    mostrador_centro: { w: 50, h: 30, l: () => mostrador(CLINICO, true), cw: 3, ch: 1, ox: -1, oy: -13 },
    mostrador_madera: { w: 50, h: 30, l: () => mostrador(MADERA, false), cw: 3, ch: 1, ox: -1, oy: -13 },
    terminal_pc:      { w: 18, h: 18, l: terminal, anima: pantalla, cw: 1, ch: 1, ox: -1, oy: -1 },
    banco_doble:      { w: 34, h: 15, l: () => banco(false), cw: 2, ch: 1, ox: -1, oy: 2 },
    banco_doble_e:    { w: 34, h: 15, l: () => banco(true), cw: 2, ch: 1, ox: -1, oy: 2 },
    planta_interior:  { w: 16, h: 16, l: planta, cw: 1, ch: 1, ox: 0, oy: 1 },
    estante:          { w: 34, h: 28, l: () => estante(MADERA), cw: 2, ch: 1, ox: -1, oy: -11 },
    estante_clinico:  { w: 34, h: 28, l: () => estante(CLINICO), cw: 2, ch: 1, ox: -1, oy: -11 },
    cama_azul:        { w: 18, h: 34, l: () => cama(AZ), cw: 1, ch: 2, ox: -1, oy: -1 },
    cama_rosa:         { w: 18, h: 34, l: () => cama(RO), cw: 1, ch: 2, ox: -1, oy: -1 },
    mesa:             { w: 34, h: 20, l: () => mesa(MADERA), cw: 2, ch: 1, ox: -1, oy: -3 },
    incubadora:       { w: 16, h: 26, l: () => incubadora(false), anima: huevo, cw: 1, ch: 1, ox: 0, oy: -9 },
    consola_cristales: { w: 50, h: 26, l: cristales, cw: 3, ch: 1, ox: -1, oy: -9 },
    vitrina:          { w: 34, h: 20, l: () => vitrina(false), cw: 2, ch: 1, ox: -1, oy: -3 },
    mostrador_tienda: { w: 50, h: 30, l: () => mostrador(VERDE, false), cw: 3, ch: 1, ox: -1, oy: -13 },
    mesa_exhibicion:  { w: 34, h: 20, l: () => mesa(VERDE, cestas), cw: 2, ch: 1, ox: -1, oy: -3 },
    barril_frutas:    { w: 16, h: 22, l: barril, cw: 1, ch: 1, ox: 0, oy: -5 },
    sacos_cajas:      { w: 16, h: 22, l: sacos, cw: 1, ch: 1, ox: 0, oy: -5 },
    consola_lab:      { w: 50, h: 26, l: () => cristales(VIOLETA), cw: 3, ch: 1, ox: -1, oy: -9 },
    incubadora_lab:   { w: 16, h: 26, l: () => incubadora(false, VIOLETA), anima: huevo, cw: 1, ch: 1, ox: 0, oy: -9 },
    mesa_lab:         { w: 34, h: 20, l: () => mesa(VIOLETA, estudio), cw: 2, ch: 1, ox: -1, oy: -3 },
    estante_lab:      { w: 34, h: 28, l: () => estante(VIOLETA), cw: 2, ch: 1, ox: -1, oy: -11 },
    escaner:          { w: 16, h: 26, l: escaner, cw: 1, ch: 1, ox: 0, oy: -9 },
    estante_oli:      { w: 34, h: 28, l: estanteOli, cw: 2, ch: 1, ox: -1, oy: -11 },
    mesa_sillas:      { w: 50, h: 22, l: () => mesaSillas(AZ), cw: 3, ch: 1, ox: -1, oy: -5 },
    mesa_sillas_lali: { w: 50, h: 22, l: () => mesaSillas(RO), cw: 3, ch: 1, ox: -1, oy: -5 },
    vitrina_frasco:   { w: 34, h: 20, l: () => vitrina(true), cw: 2, ch: 1, ox: -1, oy: -3 },
    estante_tienda:   { w: 34, h: 28, l: estanteTienda, cw: 2, ch: 1, ox: -1, oy: -11 },
    altar:            { w: 34, h: 26, l: altar, anima: vela, cw: 2, ch: 1, ox: -1, oy: -9 },
    altar_mayor:      { w: 50, h: 26, l: altarMayor, anima: velaMayor, cw: 3, ch: 1, ox: -1, oy: -9 },
    pedestal_eco_azul: { w: 16, h: 22, l: () => pedestal(AZ), cw: 1, ch: 1, ox: 0, oy: -5 },
    pedestal_eco_rosa: { w: 16, h: 22, l: () => pedestal(RO), cw: 1, ch: 1, ox: 0, oy: -5 }
  };
  Object.keys(PIEZAS).forEach((tipo) => { const d = PIEZAS[tipo];
    G.capas.registrar(tipo, { w: d.w, h: d.h, ox: d.ox, oy: d.oy, pieY: d.ch * T - 1, huella: [[0, 0, d.cw, d.ch]], capa: 'normal', encima: false, anima: d.anima, interior: true, dibujar(b) { b.drawImage(d.l().c, 0, 0); } }); });
  G.capas.registrar('sala_centro_pc', { w: 208, h: 160, ox: 0, oy: 0, pieY: 160, huella: [], capa: 'bajo', encima: false, interior: true, dibujar(b) { b.drawImage(salaCentroPC().c, 0, 0); } }); // v2.141: suelo y paredes del Centro PC
  G.capas.registrar('sala_tienda', { w: 176, h: 128, ox: 0, oy: 0, pieY: 128, huella: [], capa: 'bajo', encima: false, interior: true, dibujar(b) { b.drawImage(salaTienda().c, 0, 0); } }); // v2.143
  G.capas.registrar('sala_laboratorio', { w: 208, h: 144, ox: 0, oy: 0, pieY: 144, huella: [], capa: 'bajo', encima: false, interior: true, dibujar(b) { b.drawImage(salaLaboratorio().c, 0, 0); } }); // v2.147
  G.capas.registrar('sala_casa_oli', { w: 144, h: 112, ox: 0, oy: 0, pieY: 112, huella: [], capa: 'bajo', encima: false, interior: true, dibujar(b) { b.drawImage(salaCasaOli().c, 0, 0); } }); // v2.154
  G.capas.registrar('sala_casa_lali', { w: 144, h: 112, ox: 0, oy: 0, pieY: 112, huella: [], capa: 'bajo', encima: false, interior: true, dibujar(b) { b.drawImage(salaCasaLali().c, 0, 0); } }); // v2.158
  G.capas.registrar('sala_cabana', { w: 176, h: 128, ox: 0, oy: 0, pieY: 128, huella: [], capa: 'bajo', encima: false, interior: true, dibujar(b) { b.drawImage(salaCabana().c, 0, 0); } }); // v2.369: cabaña del Santuario
  G.capas.registrar('sala_ermita', { w: 176, h: 160, ox: 0, oy: 0, pieY: 160, huella: [], capa: 'bajo', encima: false, interior: true, dibujar(b) { b.drawImage(salaErmita().c, 0, 0); } }); // v2.158
  G.INTERIOR_SALAS = ['sala_centro_pc', 'sala_tienda', 'sala_laboratorio', 'sala_casa_oli', 'sala_casa_lali', 'sala_ermita', 'sala_cabana'];
  G.INTERIOR_OBJETOS = Object.keys(PIEZAS);
  G.INTERIOR_DEF = PIEZAS; // medidas para pruebas
})(typeof window !== 'undefined' ? window : globalThis);
