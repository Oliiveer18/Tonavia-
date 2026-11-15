// formas_roca.js — dibujos de las criaturas de elemento principal Roca (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo).
// Criaturas de este archivo: arenax, arenel, cuarvel, cuarzin, cuarzoth, ferrel.
// Los ayudantes comunes vienen de src/formas_base.js (G.F); cada archivo es su propio bloque (function () {...})(), así que los nombres locales no chocan entre archivos.
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  const { mk, ell, set, def2, sym, rows, vfill, Ew } = G.F;

  // Cuarel 18×16 · compacta y cuadrada: guijarro minero con casco y cristales
  set('cuarzin', [18, 16], (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, cy = 10 - up, ey = Math.round(cy);
    px(P.stone3, 4, 14, 3, 2); px(P.stone3, 11, 14, 3, 2);
    ell(px, W, H, 9, cy, side ? 6.2 : 6.9, 4.6, 0.08, (x, y) => (y >= cy + 2 ? P.stone3 : P.stone1));
    [[4, 11], [12, 9], [7, 13], [11, 12]].forEach(([x, y]) => px(P.stone3, x + (side ? 1 : 0), y - up));
    const helmet = (hx) => { ell(px, W, H, hx, 6 - up, 5.4, 3.6, 0, P.yellow); px(P.yellow, hx - 6, 8 - up, 12, 1); px('#d9b52c', hx - 6, 8 - up, 12, 1); };
    if (dir === 'down') {
      [[2, 3], [1, 4], [2, 4], [1, 5], [2, 5], [3, 5], [1, 6], [2, 6], [3, 6], [2, 7], [3, 7]].forEach(([x, y]) => px(P.teal, x, y - up));
      [[15, 3], [15, 4], [16, 4], [14, 5], [15, 5], [16, 5], [14, 6], [15, 6], [16, 6], [14, 7], [15, 7]].forEach(([x, y]) => px(P.teal, x, y - up));
      helmet(9); px(P.white, 8, 4 - up, 2, 1);
      px(P.ink, 6, ey, 2, 2); px(P.ink, 10, ey, 2, 2); px(P.white, 6, ey); px(P.white, 10, ey); px(P.ink, 8, ey + 3, 2, 1);
    } else if (dir === 'up') { helmet(9); px(P.teal, 6, 9 - up, 2, 4); px(P.teal, 8, 7 - up, 2, 6); px(P.teal, 10, 9 - up, 2, 4); }
    else { px(P.teal, 10, 2 - up, 2, 5); px(P.teal, 12, 4 - up, 2, 5); px(P.teal, 14, 7 - up, 1, 4); helmet(8); px(P.white, 3, 6 - up, 1, 2); px(P.ink, 4, ey, 2, 2); px(P.white, 4, ey); px(P.ink, 3, ey + 3, 2, 1); }
  });

  // ═══ Línea de Cuarel: guijarro con casco de minero → Cuarvel, minero con pico y mochila de cristales → Cuarzoth, coloso de cristal ═══
  // Paletas por fase (hue shifting: las sombras de la roca van hacia el violeta, las luces hacia el azul; los cristales, de teal a violeta).
  const CUA = {
    s: '#5a5772', sD: '#403d57', sL: '#74718f', sH: '#9693b6',                     // pizarra: base, sombra, luz, brillo
    hO: '#f08a2e', hOD: '#bf5f1c', hOL: '#ffb45e', lamp: '#fff3b0',                 // casco naranja de Cuarvel
    mt: '#c9cddb', mtD: '#8f94a8', mtL: '#f1f3fa',                                  // hierro del pico
    pk: '#7a4a2b', pkD: '#5a3320', pack: '#6b4226', packL: '#8f5c33',               // mango y mochila
    tL: '#9ffff0', t: '#3fb5b0', tD: '#25757f',                                     // cristal teal (luz, base, sombra)
    vL: '#e3c8ff', v: '#a56bf0', vD: '#6a3fb0',                                     // cristal violeta
    gL: '#fff0a0', g: '#f2c230', gD: '#b8861c', gDD: '#8a5f12',                     // casco dorado de Cuarzoth
  };

  // Cristal de cuarzo: prisma con punta (ver morfología real del cuarzo): caras izquierda clara, centro base y derecha oscura, brillo cerca de la punta. flash = destello (frame 2).
  const cry = (px, x, y, w, h, c, flash) => {
    for (let r = 0; r < h; r++) {
      const ww = w <= 2 ? w : Math.min(w, (w % 2 ? 1 : 2) + 2 * r), xl = x + (w - ww) / 2;
      for (let i = 0; i < ww; i++) {
        let col = ww === 1 ? c[1] : ww === 2 ? (i === 0 ? c[1] : c[2]) : i === 0 ? c[0] : i === ww - 1 ? c[2] : c[1];
        if (w >= 3 && r === 2 && i === 0) col = c[3];
        if (flash) col = col === c[2] ? c[1] : col === c[1] ? c[0] : c[3];
        px(col, xl + i, y + r);
      }
      if (r > 0 && r < h - 1 && (r + w) % 4 === 0 && w >= 3) px(c[2], xl + 1, y + r); // estrías horizontales de la cara del prisma
    }
    if (flash) { px(c[3], x + (w >> 1), y - 1); }
  };

  const TEAL = [CUA.tL, CUA.t, CUA.tD, '#ffffff'], VIO = [CUA.vL, CUA.v, CUA.vD, '#ffffff'];

  const span = (px, y, a, b, col) => { for (let x = a; x <= b; x++) px(typeof col === 'function' ? col(x) : col, x, y); };

  // Cuarvel (fase 2, 20×18, 45 kg): hombros cuadrados y bloque de pizarra; casco naranja con lámpara, pico en una mano (el «asa» de la silueta) y mochila con cristales teal asomando.
  // Rasgo propio: se apoya en el pico al pararse (frame 2: se inclina, el pico baja y un cristal destella). Muy pesado y lento. Se conserva: casco de minero con luz, cuerpo de roca gris, teal de los cristales.
  const cuarvelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, lean = f === 2 ? 1 : 0, glint = f === 2;
    const S = CUA, y0 = -up, ph = lean, bx = side ? 0 : lean, INK = '#2a1b30';
    const X = (x) => (back ? W - 1 - x : x); // de espaldas el pico queda en el lado contrario (es la misma mano del personaje)
    // patas, siempre en el suelo
    if (side) { span(px, 16, 3, 7, S.sD); span(px, 17, 3, 7, S.sD); span(px, 16, 9, 13, S.sD); span(px, 17, 9, 13, S.sD); span(px, 16, 3, 5, S.s); span(px, 16, 9, 11, S.s); }
    else { span(px, 16, 4, 8, S.sD); span(px, 17, 4, 8, S.sD); span(px, 16, 11, 15, S.sD); span(px, 17, 11, 15, S.sD); span(px, 16, 4, 6, S.s); span(px, 16, 11, 13, S.s); }
    // cristales de la mochila (detrás de todo)
    if (side) { cry(px, 12, 3 + y0, 3, 7, TEAL, glint); cry(px, 15, 5 + y0, 2, 6, TEAL, false); cry(px, 10, 5 + y0, 2, 4, [S.vL, S.v, S.vD, '#fff'], false); }
    else if (back) { cry(px, 2, 3 + y0, 3, 8, TEAL, glint); cry(px, 15, 4 + y0, 3, 7, TEAL, false); cry(px, 5, 5 + y0, 2, 4, [S.vL, S.v, S.vD, '#fff'], false); cry(px, 13, 6 + y0, 2, 4, TEAL, glint); }
    else { cry(px, 1, 4 + y0, 3, 7, TEAL, glint); cry(px, 15, 6 + y0, 3, 5, TEAL, false); cry(px, 4, 5 + y0, 2, 4, TEAL, false); }
    // pico: mango hasta el suelo y cabeza de hierro encima
    if (!side) {
      const hx = 18; for (let y = 5 + ph; y <= 16; y++) px(y % 3 === 0 ? S.pkD : S.pk, X(hx), y + (y < 16 ? y0 : 0));
      const T = ph + y0;
      [[17, 3, 0], [18, 3, 0], [19, 3, 1], [15, 4, 0], [16, 4, 1], [17, 4, 1], [18, 4, 1], [19, 4, 2], [14, 5, 1], [15, 5, 2], [14, 6, 2], [19, 5, 2]].forEach(([x, y, k]) => px([S.mtL, S.mt, S.mtD][k], X(x), y + T));
      px(S.mtL, X(16), 3 + T);
    } else { // de perfil (mira a la izquierda): el pico va delante, en la mano
      for (let y = 6 + ph; y <= 16; y++) px(y % 3 === 0 ? S.pkD : S.pk, 2, y + (y < 16 ? y0 : 0));
      const T = ph + y0;
      [[0, 5, 2], [0, 4, 1], [1, 4, 0], [1, 3, 0], [2, 3, 0], [3, 3, 0], [4, 3, 1], [5, 4, 1], [2, 4, 1], [3, 4, 1], [4, 4, 1]].forEach(([x, y, k]) => px([S.mtL, S.mt, S.mtD][k], x, y + T));
    }
    // cuerpo de pizarra: hombros cuadrados, luz arriba-izquierda y sombra abajo-derecha
    if (side) {
      for (let y = 9; y <= 15; y++) span(px, y + y0, y === 15 ? 4 : 3, y === 15 ? 12 : 13, (x) => (y >= 14 || x >= 11 ? S.sD : y <= 10 && x < 8 ? S.sL : S.s));
      span(px, 9 + y0, 3, 7, S.sH); px(S.tL, 7, 12 + y0); px(S.t, 6, 13 + y0); px(S.t, 7, 13 + y0); px(S.tD, 8, 14 + y0);
      px(S.sL, 1, 11 + y0, 3, 4); px(S.sD, 1, 14 + y0, 3, 1); px(S.sH, 1, 11 + y0, 2, 1); px(S.sD, 3, 12 + y0, 1, 3); // brazo que sujeta el mango
    } else {
      for (let y = 9; y <= 15; y++) span(px, y + y0, (y === 15 ? 3 : 2) + bx, (y === 15 ? 14 : 15) + bx, (x) => (y >= 14 || x - bx >= 13 ? S.sD : y <= 11 && x - bx < 7 ? S.sL : S.s));
      span(px, 9 + y0, 2 + bx, 15 + bx, S.sL); span(px, 9 + y0, 2 + bx, 6 + bx, S.sH); // hombros: borde superior iluminado
      px(S.sD, 0 + bx, 10 + y0, 2, 5); px(S.s, 0 + bx, 10 + y0, 1, 4); px(S.sH, 0 + bx, 10 + y0); px(S.sD, 16 + bx, 10 + y0, 2, 5); px(S.s, 16 + bx, 10 + y0, 1, 4); px(S.sL, 16 + bx, 10 + y0); // brazos
      if (front) { px(S.sH, 16 + bx, 13 + y0, 2, 1); [[11, 11, 0], [11, 12, 1], [12, 13, 1], [12, 14, 2], [5, 13, 1], [5, 14, 2]].forEach(([x, y, k]) => px([S.tL, S.t, S.tD][k], x + bx, y + y0)); px(S.pack, 4 + bx, 10 + y0); [[4, 10], [5, 11], [6, 12], [7, 13], [8, 14]].forEach(([x, y]) => px(S.packL, x + bx, y + y0)); } // tirantes y vetas
    }
    // mochila (delante del cuerpo en las vistas de espalda y perfil)
    if (side) { for (let y = 10; y <= 15; y++) span(px, y + y0, 12, 17, y === 10 ? S.packL : y >= 14 ? S.pkD : S.pack); px(S.mt, 15, 12 + y0, 1, 2); span(px, 9 + y0, 13, 16, S.packL); }
    else if (back) { for (let y = 9; y <= 15; y++) span(px, y + y0, 3, 14, y === 9 ? S.packL : y >= 14 ? S.pkD : S.pack); px(S.pkD, 8, 10 + y0, 2, 5); px(S.mt, 8, 12 + y0, 2, 1); px(S.packL, 4, 10 + y0, 1, 4); px(S.packL, 13, 10 + y0, 1, 4); }
    // cabeza: casco naranja con lámpara sobre una cara de piedra
    const cx = side ? 4 : 5 + bx; // x de la primera columna de la cara
    span(px, 6 + y0, cx, cx + 7, back ? S.sD : S.sL); span(px, 7 + y0, cx, cx + 7, back ? S.sD : S.sL); span(px, 8 + y0, cx, cx + 7, back ? S.sD : S.s); // v2.23: la cara de frente y de perfil es más clara (antes filas 7 y 8 más oscuras) para que los ojos se lean; de espaldas no cambia
    const ha = (side ? 3 : 4) + bx, hb = (side ? 11 : 13) + bx;
    span(px, 1 + y0, ha + 2, hb - 2, S.hOL); span(px, 2 + y0, ha + 1, hb - 1, S.hO); span(px, 3 + y0, ha, hb, S.hO); span(px, 4 + y0, ha, hb, S.hO); span(px, 5 + y0, ha - 1, hb + 1, S.hOD);
    span(px, 2 + y0, ha + 2, ha + 3, S.hOL); px(S.hOL, ha, 3 + y0); px(S.hOL, ha + 1, 3 + y0); px(S.hOD, hb, 4 + y0); px(S.hOD, hb - 1, 4 + y0);
    if (front) { px(S.lamp, 8 + bx, 2 + y0, 2, 2); px('#ffffff', 8 + bx, 2 + y0); px(S.hOD, 7 + bx, 4 + y0, 4, 1); px(S.hOD, 7 + bx, 2 + y0, 1, 2); px(S.hOD, 10 + bx, 2 + y0, 1, 2); }
    else if (side) { px(S.lamp, 2, 3 + y0, 2, 2); px('#ffffff', 2, 3 + y0); px(S.hOD, 2, 5 + y0); }
    else px(S.hOD, 8, 2 + y0, 2, 3);
    // cara: ojos grandes con brillo y boquita (de espaldas no hay cara)
    if (front) { px(INK, cx + 1, 6 + y0, 2, 2); px(INK, cx + 5, 6 + y0, 2, 2); px('#ffffff', cx + 1, 6 + y0); px('#ffffff', cx + 5, 6 + y0); px(INK, cx + 3, 8 + y0, 2, 1); }
    else if (side) { px(INK, cx, 6 + y0, 2, 2); px('#ffffff', cx, 6 + y0); px(INK, cx, 8 + y0, 2, 1); }
    if (glint) { px('#ffffff', side ? 13 : 2 + (back ? 13 : 0), 4 + y0); } // destello del cristal al apoyarse
  };

  def2('cuarvel', cuarvelDraw);

  // Cuarzoth (fase 3, 22×24, 120 kg): coloso de cristal. Silueta de montaña irregular: una aguja central y cristales en los hombros y la espalda, torso ancho y piernas cortas y gruesas.
  // Casco dorado con lámpara blanca, ojos de luz teal, gema violeta en el pecho. Rasgo propio: casi no anda; parado, la lámpara se enciende más y todos los cristales destellan (frame 2, `flick`).
  // Se conserva: casco de minero con luz, cuerpo de roca (pizarra), teal de los cristales y de las vetas.
  const cuarzothDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, S = CUA, y0 = -up, INK = '#2a1b30';
    // piernas gruesas, en el suelo (el torso las tapa por arriba)
    if (side) { span(px, 20, 5, 9, S.sD); for (let y = 21; y <= 23; y++) { span(px, y, y === 23 ? 3 : 4, 9, y === 21 ? S.s : S.sD); span(px, y, 11, y === 23 ? 15 : 14, y === 21 ? S.s : S.sD); } span(px, 20, 11, 15, S.sD); px(S.sL, 4, 22, 2, 1); px(S.sL, 11, 22, 2, 1); }
    else { for (let y = 20; y <= 23; y++) { span(px, y, y === 23 ? 3 : 4, 9, y === 20 ? S.s : S.sD); span(px, y, 12, y === 23 ? 18 : 17, y === 20 ? S.s : S.sD); } px(S.sL, 4, 21, 2, 2); px(S.sL, 12, 21, 2, 2); }
    // cristales de atrás: aguja central, laterales y de la espalda
    if (side) { cry(px, 10, 0 + y0, 4, 11, TEAL, fl); cry(px, 14, 3 + y0, 4, 11, VIO, fl); cry(px, 17, 8 + y0, 3, 8, TEAL, fl); cry(px, 7, 3 + y0, 3, 7, VIO, fl); cry(px, 19, 12 + y0, 2, 5, VIO, fl); }
    else if (back) { cry(px, 9, 0 + y0, 4, 12, TEAL, fl); cry(px, 5, 2 + y0, 3, 10, VIO, fl); cry(px, 14, 3 + y0, 3, 9, VIO, fl); cry(px, 1, 6 + y0, 3, 9, TEAL, fl); cry(px, 18, 5 + y0, 3, 10, TEAL, fl); cry(px, 0, 11 + y0, 2, 5, VIO, fl); cry(px, 20, 11 + y0, 2, 5, VIO, fl); }
    else { cry(px, 9, 0 + y0, 4, 9, TEAL, fl); cry(px, 5, 3 + y0, 3, 8, VIO, fl); cry(px, 14, 3 + y0, 3, 8, VIO, fl); cry(px, 1, 5 + y0, 3, 9, TEAL, fl); cry(px, 18, 3 + y0, 3, 11, TEAL, fl); cry(px, 0, 11 + y0, 2, 5, VIO, fl); }
    // torso: dos hombreras de roca con cristales, pecho ancho
    if (side) {
      for (let y = 13; y <= 20; y++) span(px, y + y0, y === 13 || y === 20 ? 6 : 5, y === 13 || y === 20 ? 16 : 17, (x) => (y >= 19 || x >= 14 ? S.sD : y <= 15 && x < 9 ? S.sL : S.s));
      span(px, 13 + y0, 6, 11, S.sH); px(S.tL, 8, 15 + y0); px(S.t, 8, 16 + y0); px(S.t, 9, 17 + y0); px(S.tD, 10, 18 + y0);
      // brazo delantero grueso con puño de roca
      for (let y = 14; y <= 20; y++) span(px, y + y0, 3, 7, y === 14 ? S.sH : y >= 19 ? S.sD : y <= 16 ? S.sL : S.s); span(px, 20 + y0, 3, 7, S.sD); px(S.sD, 7, 15 + y0, 1, 5);
    } else {
      for (let y = 14; y <= 20; y++) span(px, y + y0, y === 20 ? 5 : 4, y === 20 ? 16 : 17, (x) => (y >= 19 || x >= 14 ? S.sD : y <= 16 && x < 9 ? S.sL : S.s));
      span(px, 14 + y0, 4, 17, S.sL); span(px, 14 + y0, 4, 9, S.sH);
      // hombreras (de las que salen los cristales) y brazos gruesos
      span(px, 13 + y0, 1, 5, S.sH); span(px, 14 + y0, 0, 5, S.sL); span(px, 13 + y0, 16, 20, S.sL); span(px, 14 + y0, 16, 21, S.s);
      for (let y = 15; y <= 20; y++) { span(px, y + y0, 0, 3, y >= 19 ? S.sD : y <= 16 ? S.sL : S.s); span(px, y + y0, 18, 21, y >= 19 ? S.sD : S.s); px(S.sD, 3, y + y0); px(S.sD, 21, y + y0); }
      span(px, 20 + y0, 0, 3, S.sD); span(px, 20 + y0, 18, 21, S.sD); px(S.sH, 0, 17 + y0, 2, 1); px(S.sH, 18, 17 + y0, 2, 1); // nudillos
      if (front) {
        // gema violeta del pecho con aro dorado y vetas teal
        [[10, 15], [11, 15], [9, 16], [12, 16], [9, 17], [12, 17], [10, 18], [11, 18]].forEach(([x, y]) => px(S.g, x, y + y0)); px(S.gD, 9, 18 + y0); px(S.gD, 12, 18 + y0); px(S.gL, 9, 15 + y0); px(S.gL, 12, 15 + y0);
        px(S.vD, 10, 16 + y0, 2, 2); px(S.v, 10, 16 + y0); px(fl ? '#ffffff' : S.vL, 11, 16 + y0);
        [[6, 16], [6, 17], [7, 18], [7, 19], [15, 16], [15, 17], [14, 18]].forEach(([x, y], i) => px(i % 3 === 0 ? S.tL : S.t, x, y + y0)); px(S.tD, 8, 19 + y0); px(S.tD, 13, 19 + y0);
      }
    }
    // cabeza: casco dorado con lámpara blanca sobre cara de piedra con ojos de luz
    const cx = side ? 5 : 7, w = 8;
    span(px, 10 + y0, cx, cx + w - 1, back ? S.sD : S.sL); span(px, 11 + y0, cx, cx + w - 1, back ? S.sD : S.s); span(px, 12 + y0, cx, cx + w - 1, back ? S.sD : S.s); span(px, 13 + y0, cx + 1, cx + w - 2, S.sD);
    const ha = side ? 4 : 7, hb = side ? 12 : 14;
    span(px, 5 + y0, ha + 2, hb - 2, S.gL); span(px, 6 + y0, ha + 1, hb - 1, S.g); span(px, 7 + y0, ha, hb, S.g); span(px, 8 + y0, ha, hb, S.g); span(px, 9 + y0, ha - 1, hb + 1, S.gD);
    px(S.gL, ha, 7 + y0, 2, 1); px(S.gL, ha + 1, 6 + y0); px(S.gD, hb, 8 + y0); px(S.gD, hb - 1, 8 + y0);
    if (front) { px(S.gD, 9, 6 + y0, 6, 3); px(fl ? '#ffffff' : S.lamp, 10, 7 + y0, 4, 1); px(fl ? S.lamp : S.gL, 10, 6 + y0, 4, 1); px(S.gD, 9, 6 + y0); px(S.gD, 14, 6 + y0); if (fl) { px('#ffffff', 11, 3 + y0, 2, 2); px(S.lamp, 10, 4 + y0); px(S.lamp, 13, 4 + y0); } }
    else if (side) { px(S.gD, 3, 6 + y0, 3, 3); px(fl ? '#ffffff' : S.lamp, 3, 7 + y0, 2, 1); px(S.gL, 3, 6 + y0, 2, 1); if (fl) px('#ffffff', 2, 7 + y0); }
    else px(S.gD, 10, 6 + y0, 4, 3);
    if (front) { px(INK, 8, 10 + y0, 2, 2); px(INK, 12, 10 + y0, 2, 2); px(fl ? '#ffffff' : S.tL, 8, 10 + y0, 2, 1); px(fl ? '#ffffff' : S.tL, 12, 10 + y0, 2, 1); px(INK, 10, 12 + y0, 2, 1); }
    else if (side) { px(INK, 5, 10 + y0, 2, 2); px(fl ? '#ffffff' : S.tL, 5, 10 + y0, 2, 1); px(INK, 5, 12 + y0, 2, 1); }
    // grietas de roca (textura) en torso y piernas
    if (!side) [[6, 18], [14, 16], [10, 19], [16, 19]].forEach(([x, y]) => px(S.sD, x, y + y0)); else [[8, 19], [12, 16], [14, 18]].forEach(([x, y]) => px(S.sD, x, y + y0));
    if (fl) { [[2, 3], [19, 1], [6, 1], [15, 6]].forEach(([x, y]) => { if (!side || x > 4) { px('#ffffff', x, y + y0); px('#ffffff', x - 1, y + y0); px('#ffffff', x + 1, y + y0); px('#ffffff', x, y - 1 + y0); px('#ffffff', x, y + 1 + y0); } }); }
  };

  def2('cuarzoth', cuarzothDraw);

  // Ferrel · Roca · Común · 16×14 · 3 kg: erizo de limaduras de hierro con un imán de herradura por hocico; todo se le pega (clips y chinchetas).
  // Rasgo propio: parado, un clip salta y se le pega al lomo (frame 2, `flick`); anda con pasitos cortos y pesados.
  const FER = { f: '#5a5578', fD: '#3a3552', fL: '#8a87a8', fH: '#b6b3cf', r: '#e0483f', rD: '#a8322f', bl: '#4d7fd6', blD: '#35559a', s: '#d5d3e3', sD: '#9a97ad', pin: '#f5a8bd' };

  const ferrelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, F = FER, y0 = -up, INK = '#2a1b30';
    // patas cortas, siempre en el suelo
    (side ? [[4, 6], [9, 11]] : [[4, 6], [10, 12]]).forEach(([a, b]) => { vfill(px, 12, a, b, F.f); vfill(px, 13, a, b, F.fD); });
    // cuerpo ovalado y lomo de púas (limaduras): el borde superior alterna píxeles
    const a0 = side ? 3 : 2, a1 = side ? 14 : 13;
    for (let y = 2; y <= 12; y++) { const inset = y === 2 || y === 12 ? 2 : y === 3 || y === 11 ? 1 : 0; vfill(px, y + y0, a0 + inset, a1 - inset, (x) => (y >= 11 || x >= a1 - 1 ? F.fD : y <= 4 && x < a0 + 6 ? F.fL : F.f)); }
    for (let x = a0; x <= a1; x++) { if (x % 2 === 0) { px(F.fL, x, 1 + y0); if (x % 4 === 0) px(F.fH, x, 0 + y0); } }
    // clips y chinchetas pegados al lomo (objeto absurdo) ; en el frame 2 salta otro clip
    px(F.s, a0 + 1, 2 + y0, 2, 1); px(F.sD, a0 + 1, 3 + y0); px(F.pin, a1 - 3, 1 + y0); px(F.r, a1 - 3, 0 + y0);
    if (fl) { px(F.s, 7, 0 + y0, 2, 1); px(F.sD, 8, 1 + y0); px(F.fH, 6, 0); }
    if (back) { px(F.s, 6, 5 + y0, 3, 1); px(F.sD, 6, 6 + y0, 1, 2); px(F.pin, 10, 7 + y0); px(F.r, 10, 6 + y0); [[4, 8], [8, 9], [11, 5]].forEach(([x, y]) => px(F.fH, x, y + y0)); return; }
    if (front) {
      px('#fff9ee', 4, 5 + y0, 2, 2); px('#fff9ee', 10, 5 + y0, 2, 2); px(INK, 5, 6 + y0); px(INK, 11, 6 + y0);
      // hocico: imán de herradura (arco plateado y polos rojo y azul)
      vfill(px, 7 + y0, 5, 10, F.s); vfill(px, 8 + y0, 5, 6, F.sD); vfill(px, 8 + y0, 9, 10, F.sD);
      px(F.r, 5, 9 + y0, 2, 2); px(F.rD, 6, 10 + y0); px(F.bl, 9, 9 + y0, 2, 2); px(F.blD, 10, 10 + y0);
      if (fl) { px(F.fH, 4, 10 + y0); px(F.fH, 11, 10 + y0); }
    } else {
      px('#fff9ee', 5, 5 + y0, 2, 2); px(INK, 5, 6 + y0);
      // imán de perfil: «C» con un polo rojo arriba y otro azul abajo
      vfill(px, 7 + y0, 1, 4, F.r); px(F.rD, 1, 7 + y0); px(F.s, 4, 8 + y0, 1, 1); px(F.sD, 3, 8 + y0); vfill(px, 9 + y0, 1, 4, F.bl); px(F.blD, 1, 9 + y0); px(F.s, 4, 7 + y0); px(F.sD, 4, 9 + y0);
      px(F.fD, 14, 8 + y0, 2, 2); px(F.f, 15, 8 + y0); // colita
    }
  };

  def2('ferrel', ferrelDraw);

  // Arenel · Roca · Común · 14×12 · 2 kg: cangrejo ermitaño. Cara = dos ojos grandes en pedúnculo a los lados (como una cangrejo de verdad), con el tapón de botella azul entre ellos como sombrero-casa;
  // cuerpo bajo y ancho de arena, boquita, dos pinzas coral y patitas. Rasgo propio: anda de lado (`sway`); parado, los ojos se alzan y caen granitos de arena (frame 2, `flick`).
  const ARE = { s: '#e8c47a', sL: '#f7dfa6', sD: '#c9a05a', sDD: '#9a7240', wet: '#8a6a44', wetD: '#5f4630', co: '#e8624f', coD: '#a8352f', coL: '#ff9a82', cap: '#3f7fd6', capL: '#78aaf2', capD: '#27559c', rim: '#d3deef', fl: '#e0384a', flD: '#a82234', pole: '#7a5a3a', win: '#4a3320', w: '#fffdf5', cs: '#f6e0a4', csL: '#fff2c8', csD: '#d6b06a', csDD: '#b8904c', bd: '#cf9650', bdL: '#e8b86e', bdD: '#a8723a' };

  const arenelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, A = ARE, y0 = -up, INK = '#2a1b30', sh = fl ? 1 : 0;
    const capRows = (rs, ridges) => rows(px, rs.map(([y, a, b]) => [y + y0, a, b]), (x, y, a, b) => (y - y0 === rs[0][0] ? A.rim : y - y0 === rs[rs.length - 1][0] ? ((x + y) % 2 ? A.capD : A.cap) : ridges.includes(x) ? A.capL : x === a || x === b ? A.capD : A.cap));
    const capF = [[2, 5, 8], [3, 4, 9], [4, 4, 9], [5, 4, 9], [6, 4, 9]], capB = [[1, 5, 8], [2, 3, 10], [3, 2, 11], [4, 2, 11], [5, 2, 11], [6, 2, 11], [7, 2, 11], [8, 3, 10]], capS = [[2, 5, 11], [3, 5, 12], [4, 5, 12], [5, 5, 12], [6, 5, 12], [7, 5, 12], [8, 6, 11]];
    if (front) capRows(capF, [5, 8]); if (side) capRows(capS, [7, 10]);
    if (!side) { sym(px, W, A.sDD, 2, 11, 1, 1); sym(px, W, A.sDD, 4, 11, 1, 1); } else [2, 4, 6, 8].forEach((x) => px(A.sDD, x, 11));
    const cx = side ? 5.8 : 7, rx = side ? 4.8 : 5.6;
    ell(px, W, H, cx, 7.8 + y0, rx, 3, 0, (x, y) => { const yy = y - y0; return yy >= 10 ? A.sD : (x < cx - 1 && yy <= 6) ? A.sL : (x * 5 + yy * 3) % 11 === 0 ? A.sD : A.s; });
    if (back) capRows(capB, [5, 8]);
    if (!side) { sym(px, W, A.co, 0, 7, 3, 3); sym(px, W, A.coD, 1, 7, 1, 2); sym(px, W, A.coL, 0, 7, 1, 1); } else { px(A.co, 0, 7, 3, 3); px(A.coD, 1, 7, 1, 2); px(A.coL, 0, 7); }
    if (back) return;
    // ojos grandes en pedúnculo (simétricos): pedúnculo corto (2 px) que se alarga 1 px en el frame 2
    if (front) { sym(px, W, A.s, 2, 4 - sh + y0, 1, 2 + sh); Ew(px, 1, 1 - sh + y0, INK, 0); Ew(px, 10, 1 - sh + y0, INK, 0); px(INK, 6, 8 + y0, 2, 1); }
    else { px(A.s, 3, 4 - sh + y0, 1, 2 + sh); Ew(px, 1, 1 - sh + y0, INK, -1); }
    if (fl) { [[0, 5], [12, 3], [13, 6]].forEach(([x, y]) => { if (!side || x > 4) px(A.s, x, y); }); }
  };

  def2('arenel', arenelDraw);

  // Arenax (fase 2, 18×16, 6 kg): la concha es un castillo de arena (torre central almenada con banderita y dos torrecitas) entre dos ojos grandes en pedúnculo altos; cuerpo cobrizo, boquita y pinzas grandes («asas» de la silueta).
  // Rasgo propio: más lento; parado, la banderita ondea y cae arena (frame 2, `flick`). Se conserva: arena, pinzas coral y ojos en pedúnculo. Sin ventanas ni puerta (parecían una segunda cara).
  const arenaxDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, A = ARE, y0 = -up, INK = '#2a1b30';
    if (!side) { sym(px, W, A.sDD, 4, 15, 1, 1); sym(px, W, A.sDD, 6, 15, 1, 1); } else [3, 5, 7, 9].forEach((x) => px(A.sDD, x, 15));
    const col = (dark) => (x, y, a, b) => (y - y0 >= 9 ? (y - y0 === 9 ? A.wet : A.wetD) : x === a ? (dark ? A.csD : A.csL) : x === b ? (dark ? A.csDD : A.csD) : (y - y0 === 7 && !dark) ? A.csD : dark ? A.csD : A.cs);
    const tw = (a, b, top, bot, dark, teeth) => { rows(px, Array.from({ length: bot - top + 1 }, (_, i) => [top + i + y0, a, b]), col(dark)); teeth.forEach((x) => px(dark ? A.csD : A.csL, x, top - 1 + y0)); };
    if (front) { tw(4, 5, 6, 9, true, [4]); tw(12, 13, 6, 9, true, [13]); tw(6, 11, 3, 9, false, [6, 7, 10, 11]); }
    else if (back) { tw(3, 5, 6, 9, true, [3, 5]); tw(12, 14, 6, 9, true, [12, 14]); tw(6, 11, 3, 9, false, [6, 7, 10, 11]); }
    else { tw(13, 15, 6, 9, true, [13, 15]); tw(8, 12, 3, 9, false, [8, 9, 11, 12]); }
    const fx = side ? 10 : 8; px(A.pole, fx, 0 + y0, 1, 3); px(A.fl, fx + 1, 0 + y0, fl ? 4 : 3, 1); px(A.flD, fx + 1, 1 + y0, fl ? 2 : 3, 1); if (fl) px(A.fl, fx + 4, 1 + y0);
    const cx = side ? 8.2 : 9, rx = side ? 6.2 : 7;
    ell(px, W, H, cx, 12.6 + y0, rx, 2.9, 0, (x, y) => { const yy = y - y0; return yy >= 14 ? A.bdD : (x < cx - 1 && yy <= 11) ? A.bdL : (x * 5 + yy * 3) % 11 === 0 ? A.bdD : A.bd; });
    if (!back) { // ojos grandes en pedúnculo alto, uno a cada lado del castillo
      if (front) { sym(px, W, A.bd, 2, 7 + y0, 1, 3); Ew(px, 1, 4 + y0, INK, 0); Ew(px, 14, 4 + y0, INK, 0); px(INK, 8, 13 + y0, 2, 1); }
      else { px(A.bd, 3, 7 + y0, 1, 3); Ew(px, 2, 4 + y0, INK, -1); }
    }
    // pinzas grandes
    if (!side) { sym(px, W, A.co, 0, 10, 4, 4); sym(px, W, A.co, 0, 9, 2, 1); sym(px, W, A.coD, 2, 10, 1, 2); sym(px, W, A.coD, 0, 13, 4, 1); sym(px, W, A.coL, 0, 10, 1, 1); }
    else { px(A.co, 0, 10, 4, 4); px(A.co, 0, 9, 2, 1); px(A.coD, 2, 10, 1, 2); px(A.coD, 0, 13, 4, 1); px(A.coL, 0, 10); }
    if (fl) [[6, 8], [12, 7], [10, 10]].forEach(([x, y]) => { if (!side || x > 5) px(A.csL, x, y); });
  };

  def2('arenax', arenaxDraw);
})();
