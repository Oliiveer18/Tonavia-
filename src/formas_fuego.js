// formas_fuego.js — dibujos de las criaturas de elemento principal Fuego (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo).
// Criaturas de este archivo: cenel, forjadrax, forjavel, forjel, fosforin, ignavar.
// Los ayudantes comunes vienen de src/formas_base.js (G.F); cada archivo es su propio bloque (function () {...})(), así que los nombres locales no chocan entre archivos.
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  const { mk, ell, set, def2, sym, rows, vfill } = G.F;

  // Ignel 12×16 · alto y delgado: cerilla con la cabeza encendida
  set('fosforin', [12, 16], (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, shade = '#d9bf8a', x0 = side ? 3 : 2, x1 = side ? 9 : 9;
    px(shade, 3, 14, 2, 2); px(shade, 7, 14, 2, 2); // patitas
    for (let y = 7 - up; y <= 13 - up; y++) for (let x = x0; x <= x1; x++) { if ((y === 13 - up) && (x === x0 || x === x1)) continue; px(y >= 11 - up ? shade : P.cream, x, y); }
    ell(px, W, H, side ? 6 : 6, 5 - up, 3.5, 3, 0, P.red); px(P.red2, side ? 4 : 4, 6 - up, 5, 1);
    px(P.orange, 6, 0); px(P.orange, 5, 1, 3, 1); px(P.yellow, 6, 1); // llamita
    if (dir === 'up') { px(P.brown, 5, 8 - up, 2, 5); return; }
    if (!side) { px(P.ink, 3, 9 - up, 2, 2); px(P.ink, 7, 9 - up, 2, 2); px(P.white, 3, 9 - up); px(P.white, 7, 9 - up); px(P.ink, 5, 12 - up, 2, 1); }
    else { px(P.ink, 3, 9 - up, 2, 2); px(P.white, 3, 9 - up); px(P.ink, 3, 12 - up, 2, 1); px(P.orange, 10, 10 - up); px(P.orange, 11, 9 - up); px(P.yellow, 10, 9 - up); }
  });

  // ═══ Línea de Ignel (Fosforín): cerilla delgada → Ignavar, cerilla encendida con melena de llama ═══
  // Ignavar (fase 2, 14×16, 1 kg): misma altura que Ignel pero la figura cambia. Cuerpo corto y cabeza roja ancha rodeada de una melena de llama asimétrica (lengua alta a la izquierda, bajas a la derecha) con bracitos y pies de carboncillo.
  // Rasgo propio: la llama parpadea siempre (frame 2 = las lenguas cambian de altura y salta una chispa); salta más alto pero más despacio. Se conserva: punta roja, cuerpo crema (ahumado), saltitos.
  const IGN = { head: P.red, headD: P.red2, body: '#cdb98f', bodyD: '#a8946c', char: '#4a3b3b', fl: P.orange, core: P.yellow };

  const ignavarDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f === 1 ? 1 : 0, fl = f === 2, front = dir === 'down';
    // pies de carboncillo y cuerpo corto de papel ahumado
    px(IGN.char, side ? 4 : 4, 14, 2, 2); px(IGN.char, side ? 7 : 8, 14, 2, 2);
    for (let y = 10 - up; y <= 13 - up; y++) for (let x = side ? 3 : 4; x <= (side ? 9 : 9); x++) { if (y === 13 - up && (x === (side ? 3 : 4) || x === 9)) continue; px(y >= 12 - up ? IGN.bodyD : IGN.body, x, y); }
    // bracitos
    if (!side) { px(IGN.bodyD, 2, 10 - up, 2, 3); px(IGN.bodyD, 10, 10 - up, 2, 3); px(IGN.body, 2, 10 - up); px(IGN.body, 11, 10 - up); }
    else px(IGN.bodyD, 5, 10 - up, 2, 2);
    // melena de llama (detrás de la cabeza): lengua alta a la izquierda y más bajas a la derecha; en el perfil fluye hacia atrás
    const T = (col, x, y, w, h) => px(col, x, y - up, w, h);
    if (!side) {
      T(IGN.fl, 3, fl ? 1 : 0, 2, fl ? 3 : 4); T(IGN.fl, 6, fl ? 0 : 1, 2, fl ? 4 : 3); T(IGN.fl, 9, fl ? 1 : 2, 2, fl ? 3 : 2);
      T(IGN.fl, 1, 3, 2, 3); T(IGN.fl, 11, 4, 2, 2); T(IGN.fl, 0, 5, 1, 2);
      T(IGN.core, 3, fl ? 2 : 2, 1, 2); T(IGN.core, 6, fl ? 1 : 2, 1, fl ? 3 : 2); T(IGN.core, 9, fl ? 2 : 3, 1, 1);
    } else {
      T(IGN.fl, 4, fl ? 1 : 0, 3, fl ? 3 : 4); T(IGN.fl, 8, fl ? 1 : 2, 3, 3); T(IGN.fl, 10, fl ? 3 : 4, 3, 2); T(IGN.fl, 11, fl ? 5 : 6, 2, 2); T(IGN.fl, 12, fl ? 7 : 8, 1, 1);
      T(IGN.core, 5, 2, 1, 2); T(IGN.core, 9, fl ? 2 : 3, 1, 2); T(IGN.core, 11, fl ? 4 : 5, 1, 1);
    }
    if (fl) { px(IGN.core, side ? 13 : 12, 0); px(IGN.fl, side ? 0 : 0, 2); } // chispa que salta
    // cabeza roja ancha
    ell(px, W, H, side ? 6.5 : 7, 6.4 - up, side ? 4.8 : 5.4, 3.4, 0, (x, y) => (y >= 9 - up ? IGN.headD : IGN.head));
    if (dir === 'up') { // de espaldas: la melena cubre la nuca
      ell(px, W, H, 7, 5.4 - up, 4.4, 2.8, 0, (x, y) => (Math.abs(x - 6.5) < 1.6 && y < 7 - up ? IGN.core : IGN.fl)); return; }
    const ey = 7 - up;
    if (front) { px(P.ink, 4, ey, 2, 2); px(P.ink, 8, ey, 2, 2); px(P.white, 4, ey); px(P.white, 8, ey); px(IGN.headD, 3, ey - 1, 3, 1); px(IGN.headD, 8, ey - 1, 3, 1); px(P.ink, 6, ey + 2, 2, 1); }
    else { px(P.ink, 3, ey, 2, 2); px(P.white, 3, ey); px(IGN.headD, 2, ey - 1, 3, 1); px(P.ink, 2, ey + 2, 2, 1); }
  };

  def2('ignavar', ignavarDraw);

  // ═══ Bloque 2 · lote A (v1.5): tres criaturas de una sola fase. Cenel (Fuego), Ferrel (Roca) y Dandel (Aire). ═══
  // Cenel · Fuego · Común · 14×12 · 0,3 kg: bolita de hollín que no sabe que ya se apagó. Pelusa de carbón, ojos de ascua y una grieta incandescente en la espalda.
  // Rasgo propio: parada, la grieta se enciende y suelta una chispa (frame 2, `flick`); anda a saltitos cortos dejando ceniza. Distinta de Ignel (cerilla delgada): redonda, baja y peluda.
  const CEN = { k: '#4a4458', kD: '#342f42', kL: '#6b6580', kH: '#8e88a8', e: '#f07a2a', eD: '#c8501a', y: '#ffd23f', w: '#fff3c0', ash: '#b9b4c4' };

  const cenelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, C = CEN, y0 = -up, INK = '#2a1b30';
    const cx = side ? 6.6 : 7, rx = side ? 5.6 : 6.2;
    // patitas de ascua (siempre en el suelo)
    (side ? [[3, 4], [8, 9]] : [[4, 5], [8, 9]]).forEach(([a, b]) => { vfill(px, 10, a, b, C.e); vfill(px, 11, a, b, C.eD); });
    // cuerpo de pelusa: luz arriba-izquierda, sombra abajo-derecha, borde irregular (flecos)
    ell(px, W, H, cx, 6.2 + y0, rx, 4.8, 0, (x, y) => { const d = (x - 3) + (y - y0 - 2); const fringe = (x * 3 + y * 5) % 7 === 0 && (y - y0 <= 2 || y - y0 >= 9); return fringe ? C.kL : d < 3 ? C.kL : d > 12 ? C.kD : C.k; });
    px(C.kH, side ? 3 : 4, 2 + y0, 2, 1); px(C.kL, side ? 2 : 3, 3 + y0);
    // orejas de pelusa
    px(C.k, side ? 4 : 3, 0 + y0, 2, 2); px(C.kL, side ? 4 : 3, 0 + y0); px(C.k, side ? 8 : 10, 0 + y0, 2, 2); px(C.kD, side ? 9 : 11, 1 + y0);
    // grieta incandescente: en la cabeza (frente), larga en la espalda; en el frame 2 se enciende
    const ec = fl ? C.w : C.y, ee = fl ? C.y : C.e;
    if (back) { [[4, 3], [5, 4], [6, 4], [6, 5], [7, 6], [8, 6], [8, 7], [9, 8]].forEach(([x, y], i) => { px(ee, x, y + y0); if (i % 2) px(ec, x, y + y0); }); px(C.eD, 5, 5 + y0); px(C.eD, 9, 7 + y0); }
    else if (front) { px(ee, 6, 2 + y0, 2, 1); px(ec, 7, 2 + y0); px(ee, 7, 3 + y0); }
    else { [[8, 3], [9, 4], [9, 5], [10, 6]].forEach(([x, y], i) => { px(ee, x, y + y0); if (i % 2) px(ec, x, y + y0); }); }
    // cara: ojos de ascua con brillo y boquita
    if (front) { px(C.y, 4, 5 + y0, 2, 2); px(C.y, 8, 5 + y0, 2, 2); px(C.w, 4, 5 + y0); px(C.w, 8, 5 + y0); px(INK, 5, 6 + y0); px(INK, 9, 6 + y0); px(C.e, 6, 8 + y0, 2, 1); }
    else if (side) { px(C.y, 3, 5 + y0, 2, 2); px(C.w, 3, 5 + y0); px(INK, 4, 6 + y0); px(C.e, 2, 8 + y0, 2, 1); px(C.kD, 11, 7 + y0, 2, 2); px(C.k, 12, 7 + y0); } // y colita de pelusa
    // frame 2: chispa que sale de la grieta y motas de ceniza
    if (fl) { px(C.w, 7, 0); px(C.y, 6, 1 - 1 + 0 > 0 ? 1 : 0); [[1, 3], [12, 2], [13, 5]].forEach(([x, y]) => { if (!side || x > 4) px(C.ash, x, y); }); }
  };

  def2('cenel', cenelDraw);

  // ═══ Bloque 2 · lote C, parte 1 (v1.8): Forjel → Forjavel → Forjadrax (Fuego + Roca, Épica, 3 fases). Mismas reglas de cara que la v1.6b: una sola cara, ojos grandes y simétricos (`sym`), silueta clara sin color. ═══
  // Idea que une las tres fases: el HIERRO DE LA FORJA (yunque → herrero → titán) y la brasa/lava cada vez más grande. Épica: 5-6 colores + brillos.
  const FOR = { i: '#4f4a68', iD: '#2f2b45', iL: '#7c79a4', iH: '#aaa8cf', r: '#e0483f', rD: '#a8322f', o: '#f59a2a', y: '#ffd23f', w: '#fff3c0', br: '#7a5a3a', brD: '#4f3722', brk: '#8a4e3c', brkD: '#5a2f26', sm: '#8a869e', smL: '#b6b3cf' };

  // Ojos de la forja, opción B (v2.23.2; solo Forjel): blanco cálido + pupila + párpado de brasa + ceño. Columna exterior: párpado (brasa), blanco, blanco; columna interior (hacia la nariz): ceño oscuro, párpado, pupila. El ceño baja hacia el centro.
  const ojoB = (px, xo, xi, y) => { const F = FOR; px(F.o, xo, y); px(F.iD, xi, y); px(F.w, xo, y + 1); px(F.o, xi, y + 1); px(F.w, xo, y + 2); px(F.iD, xi, y + 2); };
  const ojosB = (px, W, xo, xi, y) => { ojoB(px, xo, xi, y); ojoB(px, W - 1 - xo, W - 1 - xi, y); };

  // Ojos de la forja, opción A (Forjavel y Forjadrax; referencia del usuario): blanco cálido arriba, pupila oscura en la columna interior (fila 2) y párpado de brasa DEBAJO (fila 3). Ceja plana oscura de siempre.
  const ojoA = (px, xo, xi, y) => { const F = FOR; px(F.w, xo, y); px(F.w, xi, y); px(F.w, xo, y + 1); px(F.iD, xi, y + 1); px(F.o, xo, y + 2); px(F.o, xi, y + 2); };
  const ojosA = (px, W, xo, xi, y) => { ojoA(px, xo, xi, y); ojoA(px, W - 1 - xo, W - 1 - xi, y); };

  // Forjel (fase 1, 16×14, 12 kg): yunque bajo y ancho con cuernos de hierro, ojos de brasa en la cintura y una brasa encendida en el lomo.
  // Rasgo propio: anda muy pesado (speed 6); la brasa parpadea (frame 1 sube) y, parado, se aviva y suelta chispas (frame 2, `flick`).
  const forjelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, F = FOR, y0 = -up, em = fl ? 1 : 0;
    const col = (rowsDef) => (x, y, a, b) => rowsDef(x, y, a, b);
    if (!side) {
      sym(px, W, F.iD, 2, 13, 3, 1);
      rows(px, [[10 + y0, 1, 14], [11 + y0, 1, 14], [12 + y0, 2, 13]], (x, y) => (y - y0 === 10 ? F.iL : y - y0 === 12 ? F.iD : x < 6 ? F.i : F.iD));
      rows(px, [[6 + y0, 3, 12], [7 + y0, 3, 12], [8 + y0, 3, 12], [9 + y0, 3, 12]], (x, y) => (x < 5 ? F.iL : x > 10 ? F.iD : F.i));
      rows(px, [[3 + y0, 1, 14], [4 + y0, 1, 14], [5 + y0, 0, 15]], (x, y) => (y - y0 === 3 ? F.iH : y - y0 === 5 ? F.iD : F.iL));
      sym(px, W, F.iL, 0, 1 + y0, 1, 3); sym(px, W, F.iH, 0, 1 + y0, 1, 1); sym(px, W, F.iL, 1, 2 + y0, 1, 1); // cuernos
      if (back) { px(F.o, 5, 2 + y0 - em, 6, 1); px(F.y, 6, 1 + y0 - em, 4, 1); px(F.o, 7, 3 + y0, 2, 1); px(F.r, 8, 6 + y0, 1, 4); px(F.r, 5, 9 + y0, 1, 1); px(F.r, 11, 7 + y0, 1, 1); if (fl) { px(F.w, 7, 0, 2, 1); px(F.y, 4, 1); px(F.y, 11, 0); } return; }
      px(F.o, 6, 2 + y0 - em, 4, 1); px(F.y, 7, 1 + y0 - em, 2, 1); if (fl) { px(F.w, 7, 0, 2, 1); px(F.y, 4, 1); px(F.y, 11, 0); }
      ojosB(px, W, 5, 6, 6 + y0); px(F.iD, 7, 9 + y0, 2, 1);
    } else {
      sym(px, W, F.iD, 3, 13, 3, 1); px(F.iD, 10, 13, 3, 1);
      rows(px, [[10 + y0, 3, 14], [11 + y0, 3, 14], [12 + y0, 4, 13]], (x, y) => (y - y0 === 10 ? F.iL : y - y0 === 12 ? F.iD : x < 8 ? F.i : F.iD));
      rows(px, [[6 + y0, 5, 12], [7 + y0, 5, 12], [8 + y0, 5, 12], [9 + y0, 5, 12]], (x) => (x < 7 ? F.iL : x > 10 ? F.iD : F.i));
      rows(px, [[3 + y0, 0, 14], [4 + y0, 2, 14], [5 + y0, 4, 14]], (x, y) => (y - y0 === 3 ? F.iH : y - y0 === 5 ? F.iD : F.iL));
      px(F.iL, 1, 2 + y0, 2, 1);
      px(F.o, 8, 2 + y0 - em, 4, 1); px(F.y, 9, 1 + y0 - em, 2, 1); if (fl) { px(F.w, 9, 0, 2, 1); px(F.y, 6, 1); px(F.y, 13, 0); }
      ojoB(px, 7, 6, 6 + y0); px(F.iD, 5, 9 + y0, 2, 1);
    }
  };

  def2('forjel', forjelDraw);

  // Forjavel (fase 2, 20×20, 40 kg): herrero-golem. Cabeza de bloque con cuernos y ojos de brasa, hombreras de yunque, BARRIGA-FRAGUA con fuego visible y un MARTILLO a una mano (el «asa» de la silueta).
  // Rasgo propio: se apoya en el martillo y la fragua echa chispas (frame 2, `flick`); anda lento (speed 8). Se conserva: hierro oscuro, brasa naranja, forma de yunque en los hombros.
  const forjavelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, F = FOR, y0 = -up, lean = fl ? 1 : 0;
    const hx = (x, w) => (back ? W - x - w : x); // el martillo está en la mano contraria de espaldas
    if (!side) {
      px(F.br, hx(18, 2), 3 + y0, 2, 11); px(F.brD, hx(19, 1), 3 + y0, 1, 11); // mango
      px(F.iD, hx(15, 5), 0 + y0, 5, 4); px(F.iH, hx(15, 5), 0 + y0, 5, 1); px(F.iL, hx(16, 3), 1 + y0, 3, 2); px(fl ? F.y : F.o, hx(18, 2), 1 + y0, 2, 2); px(F.o, hx(15, 1), 1 + y0, 1, 2);// martillo con la cara al rojo
      sym(px, W, F.iD, 4, 19, 5, 1); sym(px, W, F.i, 5, 16, 4, 3); px(F.iD, 5, 15, 10, 1);
      rows(px, [[7 + y0, 5, 14], [8 + y0, 5, 14], [9 + y0, 5, 14], [10 + y0, 5, 14], [11 + y0, 5, 14], [12 + y0, 5, 14], [13 + y0, 5, 14], [14 + y0, 5, 14]], (x, y) => (x < 8 ? F.iL : x > 12 ? F.iD : F.i));
      sym(px, W, F.iL, 1, 8 + y0, 3, 6); sym(px, W, F.iD, 0, 13 + y0, 4, 2); // brazos y puños
      sym(px, W, F.iL, 1, 7 + y0, 4, 3); sym(px, W, F.iH, 1, 7 + y0, 4, 1); sym(px, W, F.iD, 1, 9 + y0, 4, 1); // hombreras de yunque
      rows(px, [[1 + y0, 6, 13], [2 + y0, 6, 13], [3 + y0, 6, 13], [4 + y0, 6, 13], [5 + y0, 6, 13], [6 + y0, 7, 12]], (x, y) => (y - y0 === 1 ? F.iH : x < 9 ? F.iL : F.i));
      sym(px, W, F.iL, 5, 0 + y0, 1, 2); // cuernos
      if (back) { sym(px, W, F.iD, 7, 3 + y0, 1, 1); px(F.o, 9, 10 + y0, 2, 3); px(F.r, 9, 9 + y0, 2, 1); px(F.iD, 8, 8 + y0, 4, 1); if (fl) { px(F.y, 9, 7, 2, 1); px(F.w, 10, 5 + y0); } return; }
      sym(px, W, F.iD, 6, 2 + y0, 3, 1); ojosA(px, W, 7, 8, 3 + y0); px(F.iD, 9, 5 + y0, 2, 1);
      px(F.iD, 7, 10 + y0, 6, 4); px(F.r, 8, 11 + y0, 4, 3); px(F.o, 9, 11 + y0, 2, 3); px(F.y, 9, 13 + y0, 2, 1); if (fl) { px(F.w, 9, 11 + y0, 2, 2); px(F.y, 8, 9 + y0); px(F.o, 12, 8 + y0); px(F.y, 10, 8 + y0 - 1); }
    } else {
      px(F.br, 1, 3 + y0, 2, 11); px(F.brD, 2, 3 + y0, 1, 11);
      px(F.iD, 0, 0 + y0, 4, 4); px(F.iH, 0, 0 + y0, 4, 1); px(F.iL, 1, 1 + y0, 2, 2); px(fl ? F.y : F.o, 0, 1 + y0, 1, 2);
      px(F.iD, 5, 19, 5, 1); px(F.iD, 11, 19, 4, 1); px(F.i, 6, 16, 3, 3); px(F.i, 11, 16, 3, 3); px(F.iD, 6, 15, 8, 1);
      rows(px, [[7 + y0, 6, 14], [8 + y0, 6, 14], [9 + y0, 6, 14], [10 + y0, 6, 14], [11 + y0, 6, 14], [12 + y0, 6, 14], [13 + y0, 6, 14], [14 + y0, 6, 14]], (x) => (x < 8 ? F.iL : x > 12 ? F.iD : F.i));
      px(F.iD, 5, 10 + y0, 2, 4); px(F.r, 5, 11 + y0, 1, 3); px(F.o, 5, 12 + y0, 1, 2);
      px(F.iL, 5, 7 + y0, 6, 3); px(F.iH, 5, 7 + y0, 6, 1); px(F.iD, 5, 9 + y0, 6, 1); px(F.iL, 4, 10 + y0, 3, 3); px(F.iD, 1, 13 + y0, 5, 2);
      rows(px, [[1 + y0, 4, 11], [2 + y0, 4, 11], [3 + y0, 4, 11], [4 + y0, 4, 11], [5 + y0, 4, 11], [6 + y0, 5, 10]], (x, y) => (y - y0 === 1 ? F.iH : x < 7 ? F.iL : F.i));
      px(F.iL, 6, 0 + y0, 1, 2); px(F.iD, 5, 2 + y0, 3, 1); ojoA(px, 6, 5, 3 + y0); px(F.iD, 4, 6 + y0, 2, 1);
      if (fl) { px(F.y, 3, 8 + y0); px(F.o, 8, 9 + y0 - 1); }
    }
  };

  def2('forjavel', forjavelDraw);

  // Forjadrax (fase 3, 24×28, 110 kg): titán de la forja. El yunque es ahora sus HOMBROS (con cuernos), una CHIMENEA de ladrillo humea en su espalda, ríos de LAVA por el pecho y los brazos, ojos de fuego blanco y grietas incandescentes.
  // Rasgo propio: casi no anda (speed 3); parado, la chimenea echa humo y la lava gotea (frame 2, `flick`). Se conserva: hierro oscuro, brasa/lava naranja y el yunque como hombros.
  const forjadraxDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, F = FOR, y0 = -up;
    const smoke = (x) => { if (fl) { px(F.smL, x - 1, 1, 3, 1); px(F.sm, x + 1, 0, 3, 1); px(F.sm, x + 4, 1); } else if (up) { px(F.smL, x, 0, 2, 1); px(F.sm, x + 1, 1, 3, 1); } else { px(F.sm, x - 1, 1, 3, 1); px(F.smL, x, 0, 2, 1); } };
    const chim = (x, w, y1, y2) => { px(F.brkD, x - 1, 2 + y0 + 1, w + 2, 1); for (let y = y1; y <= y2; y++) for (let k = 0; k < w; k++) px(((y + k) % 3 === 0) ? F.brkD : F.brk, x + k, y + y0); px(F.iD, x - 1, 3 + y0, w + 2, 1); };
    if (!side) {
      if (!back) { chim(16, 4, 4, 9); smoke(16); }
      sym(px, W, F.iD, 5, 27, 7, 1); sym(px, W, F.i, 6, 23, 5, 4); sym(px, W, F.iL, 6, 23, 1, 4);
      rows(px, [[13 + y0, 5, 18], [14 + y0, 5, 18], [15 + y0, 5, 18], [16 + y0, 5, 18], [17 + y0, 5, 18], [18 + y0, 5, 18], [19 + y0, 5, 18], [20 + y0, 5, 18], [21 + y0, 5, 18], [22 + y0, 5, 18]], (x, y) => (x < 9 ? F.iL : x > 14 ? F.iD : F.i));
      sym(px, W, F.iL, 1, 13 + y0, 4, 8); sym(px, W, F.iD, 4, 13 + y0, 1, 8); sym(px, W, F.iD, 0, 21 + y0, 5, 3); sym(px, W, F.iL, 1, 21 + y0, 1, 1);
      rows(px, [[10 + y0, 0, 23], [11 + y0, 0, 23], [12 + y0, 1, 22]], (x, y) => (y - y0 === 10 ? F.iH : y - y0 === 12 ? F.iD : F.iL));
      sym(px, W, F.iH, 0, 7 + y0, 1, 1); sym(px, W, F.iL, 0, 8 + y0, 2, 2); // cuernos del yunque
      rows(px, [[3 + y0, 8, 15], [4 + y0, 8, 15], [5 + y0, 8, 15], [6 + y0, 8, 15], [7 + y0, 8, 15], [8 + y0, 8, 15], [9 + y0, 9, 14]], (x, y) => (y - y0 === 3 ? F.iH : x < 11 ? F.iL : F.i));
      if (back) { chim(10, 4, 4, 13); smoke(10); px(F.r, 7, 15 + y0, 1, 5); px(F.r, 16, 14 + y0, 1, 6); px(F.o, 8, 18 + y0, 1, 2); px(F.o, 12, 19 + y0, 2, 1); sym(px, W, F.r, 2, 15 + y0, 1, 3); if (fl) { px(F.o, 3, 24); px(F.o, 20, 25); } return; }
      sym(px, W, F.iD, 8, 4 + y0, 3, 1); ojosA(px, W, 9, 10, 5 + y0); px(F.r, 10, 8 + y0, 4, 1); // ojos de fuego blanco y boca de lava
      px(F.r, 10, 13 + y0, 4, 9); px(F.o, 11, 14 + y0, 2, 7); px(F.y, 11, 16 + y0, 2, 3); px(F.w, 11, 17 + y0, 2, 1); // río de lava del pecho
      sym(px, W, F.r, 7, 14 + y0, 1, 1); sym(px, W, F.r, 8, 15 + y0, 1, 1); sym(px, W, F.r, 7, 16 + y0, 1, 1); sym(px, W, F.o, 8, 19 + y0, 1, 1); sym(px, W, F.r, 6, 19 + y0, 1, 2); // grietas
      sym(px, W, F.r, 2, 15 + y0, 1, 3); sym(px, W, F.o, 3, 18 + y0, 1, 2); // lava en los brazos
      if (fl) { sym(px, W, F.o, 2, 24, 1, 1); px(F.y, 12, 22 + y0); }
    } else {
      chim(15, 4, 4, 11); smoke(15);
      px(F.iD, 5, 27, 5, 1); px(F.iD, 12, 27, 5, 1); px(F.i, 6, 23, 4, 4); px(F.i, 12, 23, 4, 4); px(F.iL, 6, 23, 1, 4);
      rows(px, [[13 + y0, 7, 18], [14 + y0, 7, 18], [15 + y0, 7, 18], [16 + y0, 7, 18], [17 + y0, 7, 18], [18 + y0, 7, 18], [19 + y0, 7, 18], [20 + y0, 7, 18], [21 + y0, 7, 18], [22 + y0, 7, 18]], (x) => (x < 10 ? F.iL : x > 15 ? F.iD : F.i));
      rows(px, [[10 + y0, 2, 19], [11 + y0, 2, 19], [12 + y0, 3, 19]], (x, y) => (y - y0 === 10 ? F.iH : y - y0 === 12 ? F.iD : F.iL));
      px(F.iH, 1, 9 + y0, 3, 1);
      rows(px, [[3 + y0, 5, 12], [4 + y0, 5, 12], [5 + y0, 5, 12], [6 + y0, 5, 12], [7 + y0, 5, 12], [8 + y0, 5, 12], [9 + y0, 6, 11]], (x, y) => (y - y0 === 3 ? F.iH : x < 8 ? F.iL : F.i));
      px(F.iD, 5, 4 + y0, 3, 1); ojoA(px, 6, 5, 5 + y0); px(F.r, 5, 8 + y0, 3, 1);
      px(F.iL, 5, 13 + y0, 5, 8); px(F.iD, 9, 13 + y0, 1, 8); px(F.iD, 4, 21 + y0, 5, 3); px(F.r, 6, 15 + y0, 1, 3); px(F.o, 7, 18 + y0, 1, 2);
      px(F.r, 10, 14 + y0, 1, 6); px(F.o, 11, 16 + y0, 1, 2);
      if (fl) { px(F.o, 6, 24); px(F.y, 17, 22 + y0); }
    }
  };

  def2('forjadrax', forjadraxDraw);
})();
