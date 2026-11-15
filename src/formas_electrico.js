// formas_electrico.js — dibujos de las criaturas de elemento principal Eléctrico (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo).
// Criaturas de este archivo: arcarex, arcel, pilita, voltavar, voltorax, zumbarix, zumbel.
// Los ayudantes comunes vienen de src/formas_base.js (G.F); cada archivo es su propio bloque (function () {...})(), así que los nombres locales no chocan entre archivos.
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  const { mk, ell, set, def2, sym, rows, vfill, Ei, eli } = G.F;

  // Voltel 14×18 · cilíndrica y alta: pila con borne, banda gris y rayo
  set('pilita', [14, 18], (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, x0 = side ? 3 : 2, x1 = side ? 10 : 11, top = 3 - up, bot = 15 - up;
    px(P.orange, 3, 16, 2, 2); px(P.orange, 9, 16, 2, 2);
    px(P.grey, 5, 0 - up + 0, 4, 3); px(P.grey2, 5, 2 - up, 4, 1);
    for (let y = top; y <= bot; y++) for (let x = x0; x <= x1; x++) { if ((y === top || y === bot) && (x === x0 || x === x1)) continue; px(y === bot || x === x1 ? P.orange : P.yellow, x, y); }
    px(P.grey, x0, 12 - up, x1 - x0 + 1, 1);
    if (dir === 'up') { [[6, 5], [7, 5], [8, 5], [6, 6], [7, 6], [5, 7], [6, 7], [7, 7], [8, 7], [7, 8], [8, 8], [6, 9], [7, 9]].forEach(([x, y]) => px(P.orange, x, y - up)); return; }
    if (!side) { px(P.ink, 4, 6 - up, 2, 2); px(P.ink, 8, 6 - up, 2, 2); px(P.white, 4, 6 - up); px(P.white, 8, 6 - up); px(P.ink, 6, 9 - up, 2, 1); px(P.orange, 0, 8 - up, 2, 3); px(P.orange, 12, 8 - up, 2, 3); }
    else { px(P.ink, 4, 6 - up, 2, 2); px(P.white, 4, 6 - up); px(P.ink, 3, 9 - up, 2, 1); px(P.orange, 6, 9 - up, 2, 2); [[12, 4], [11, 5], [12, 5], [11, 6], [12, 6], [13, 7]].forEach(([x, y]) => px(P.orange, x, y - up)); }
  });

  // ═══ Línea de Voltel (v1.2): pila viva → Voltavar, batería de arranque con pinzas → Voltorax, bobina de tormentas ═══
  // Idea que une las tres fases: el rayo. Naranja en la espalda de Voltel → arco azul entre los bornes de Voltavar → luz blanco-azul que recorre todo Voltorax.
  // Paleta con hue shifting: las sombras de la pizarra van hacia el violeta y las luces hacia el azul (como Cuarel).
  const VOL = {
    c: '#3c4468', cD: '#262b4a', cL: '#5b6694', cH: '#7f8cc0',                    // carcasa de acero azul pizarra (Voltavar)
    y: '#f7d54a', yL: '#fff09a', yD: '#d9a82a',                                    // amarillo de Voltel
    o: '#f09a3e', oD: '#c8651f', oL: '#ffc070',                                    // naranja de Voltel
    m: '#b9b4c4', mD: '#8a8498', mL: '#e8e4f0',                                    // metal de bornes y pinzas
    a: '#4fd8ff', aW: '#d6faff', aD: '#2a8fd6',                                    // arco eléctrico
    s: '#2c3150', sD: '#1b1e38', sL: '#4a5382', sH: '#6a76ab',                     // pizarra oscura de Voltorax
    cu: '#c9743a', cuL: '#f0a868', cuD: '#8f4a24',                                 // cobre de la bobina
    n: '#141a5c', // v2.23: azul noche de la cara (visor) para que los ojos amarillos resalten
    b: '#3fa9ff', bD: '#2a5fd0', bDD: '#1f3fa8', bL: '#9be8ff', w: '#f4feff',          // luz azul y blanca (la esfera es azul profundo para que los ojos de luz se lean)
  };

  // Voltavar (fase 2, 18×16, 6 kg): bloque ancho y bajo (batería de arranque) con dos bornes arriba (uno naranja, otro gris), placa-cara amarilla, banda de advertencia, pinzas de cocodrilo como brazos y cable enroscado de cola.
  // Rasgo propio: parado, un arco azul salta entre los bornes y las pinzas castañetean (frame 2, `flick`). Trote corto y firme. Se conserva: amarillo y naranja, borne gris, rayo naranja (espalda), ojos negros con brillo, patas naranjas.
  const voltavarDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, V = VOL, y0 = -up, INK = '#2a1b30';
    const x0 = side ? 4 : 2, x1 = side ? 12 : 15; // anchura de la carcasa
    // patas gruesas, siempre en el suelo (el cuerpo las tapa por arriba)
    (side ? [[4, 6], [9, 11]] : [[4, 6], [11, 13]]).forEach(([a, b]) => { for (let y = 12; y <= 15; y++) { vfill(px, y, a, b, (x) => (y === 15 ? V.oD : x === a ? V.oL : x === b ? V.oD : V.o)); } });
    // cable enroscado que sobresale por detrás (perfil) o cuelga a los lados (espalda)
    const coil = (ax, ay, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if ((x === 0 || x === w - 1) && (y === 0 || y === h - 1)) continue; if (x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2) continue; px((x + y) % 3 === 0 ? V.o : (x + y) % 3 === 1 ? V.cD : V.c, ax + x, ay + y + y0); } }; // anillo de cable de 1 px (esquinas redondeadas)
    if (side) coil(13, 8, 5, 6); else if (back) { coil(0, 8, 4, 5); coil(14, 8, 4, 5); }
    // terminales: naranja (+) y gris (–), con el arco azul entre los dos al pararse
    if (!side) { vfill(px, 0 + y0, 3, 5, (x) => (x === 3 ? V.oL : V.o)); vfill(px, 1 + y0, 3, 5, (x) => (x === 5 ? V.oD : V.o)); vfill(px, 0 + y0, 12, 14, (x) => (x === 12 ? V.mL : V.m)); vfill(px, 1 + y0, 12, 14, (x) => (x === 14 ? V.mD : V.mD)); }
    else { vfill(px, 0 + y0, 5, 7, (x) => (x === 5 ? V.oL : V.o)); vfill(px, 1 + y0, 5, 7, (x) => (x === 7 ? V.oD : V.o)); }
    // carcasa de acero (esquinas redondeadas): luz arriba-izquierda, sombra abajo-derecha
    for (let y = 2; y <= 12; y++) { const a = y === 2 || y === 12 ? x0 + 1 : x0, b = y === 2 || y === 12 ? x1 - 1 : x1; vfill(px, y + y0, a, b, (x) => (y === 12 || y === 11 ? V.cD : y === 2 ? (x < a + 3 ? V.cH : V.cL) : x === a ? V.cL : x === b ? V.cD : V.c)); }
    for (let y = 3; y <= 3; y++) (side ? [7, 10] : [3, 8, 13]).forEach((x) => { px(V.cD, x, y + y0, 2, 1); }); // tapones de las celdas
    // banda de advertencia (franjas naranja y amarillas en diagonal)
    for (let y = 10; y <= 11; y++) vfill(px, y + y0, x0, x1, (x) => ((x + y) % 4 < 2 ? (fl ? V.yL : V.y) : V.o));
    // placa amarilla del frente (cara) o de la espalda (rayo grande)
    const pa = side ? 4 : 4, pb = side ? 8 : 13;
    if (!side || true) { for (let y = 4; y <= 9; y++) { const a = y === 4 || y === 9 ? pa + 1 : pa, b = y === 4 || y === 9 ? pb - 1 : pb; vfill(px, y + y0, a, b, (x) => (y === 9 ? V.yD : y === 4 ? V.yL : x === a ? V.yL : x === b ? V.yD : V.y)); } }
    if (back) [[8, 4], [9, 4], [10, 4], [8, 5], [9, 5], [7, 6], [8, 6], [9, 6], [10, 6], [9, 7], [10, 7], [8, 8], [9, 8]].forEach(([x, y]) => px(V.o, x, y + y0));
    else if (front) { // ojos rasgados con cejas, boca de rendija y un colmillo
      px(INK, 5, 6 + y0, 2, 2); px(INK, 11, 6 + y0, 2, 2); px(V.w, 5, 6 + y0); px(V.w, 11, 6 + y0);
      px(INK, 5, 5 + y0, 2, 1); px(INK, 4, 4 + y0); px(INK, 11, 5 + y0, 2, 1); px(INK, 13, 4 + y0);
      px(INK, 7, 8 + y0, 4, 1); px(V.w, 7, 9 + y0);
    } else { px(INK, 5, 6 + y0, 2, 2); px(V.w, 5, 6 + y0); px(INK, 5, 5 + y0, 2, 1); px(INK, 4, 8 + y0, 2, 1); px(V.w, 4, 9 + y0); }
    // pinzas de cocodrilo: mordaza de metal (con dientes) y mango naranja aislante; en el frame 2 castañetean (mordaza abierta)
    const clamp = (gx, jx) => { for (let y = 6; y <= 10; y++) px(y === 6 ? V.oL : y === 10 ? V.oD : V.o, gx, y + y0); px(V.mL, jx, 6 + y0); px(V.mL, jx, 10 + y0); if (!fl) { px(V.mD, jx, 7 + y0); px(V.mD, jx, 9 + y0); } else px(V.aW, jx, 8 + y0); };
    if (side) clamp(3, 2); else { clamp(1, 0); clamp(16, 17); }
    // arco eléctrico (frame 2)
    if (fl) { if (!side) { [[6, 1, V.a], [7, 0, V.aW], [8, 1, V.aW], [9, 0, V.aW], [10, 1, V.a], [11, 0, V.a], [7, 1, V.aD], [9, 1, V.aD], [8, 0, V.a], [10, 0, V.aD]].forEach(([x, y, col]) => px(col, x, y)); } else [[8, 1, V.a], [9, 0, V.aW], [10, 1, V.a], [8, 0, V.aD], [11, 0, V.a]].forEach(([x, y, col]) => px(col, x, y)); }
  };

  def2('voltavar', voltavarDraw);

  // Voltorax (fase 3, 20×26, 15 kg): bobina de tormentas. Torre simétrica: esfera de luz con ojos blancos, cuello con gema amarilla, bobina de cobre con vetas de luz, hombreras, brazos-cable con pinzas y base en espiral de cobre.
  // Rasgo propio: parado, la esfera se enciende al blanco y los rayos se alargan y sueltan chispas (frame 2, `flick`). Pasos pesados y lentos. Se conserva: amarillo (gema), cobre/naranja, rayo como emblema (ahora luz), pinzas de Voltavar.
  const voltoraxDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, V = VOL, y0 = -up;
    const lit = (col) => (!fl ? col : col === V.bDD ? V.bD : col === V.bD ? V.b : col === V.b ? V.bL : col === V.bL ? V.w : col); // esfera encendida en el frame 2
    // patas gruesas con puntera naranja, siempre en el suelo
    (side ? [[5, 8], [11, 14]] : [[3, 6], [13, 16]]).forEach(([a, b]) => { for (let y = 21; y <= 25; y++) vfill(px, y, a, b, (x) => (y === 24 ? (x === a ? V.oL : V.o) : y === 25 ? V.oD : x === a ? V.sL : x === b ? V.sD : V.s)); });
    // base: disco en espiral de cobre (bobina primaria)
    const ba = side ? 5 : 3, bb = side ? 15 : 16;
    vfill(px, 20 + y0, ba, bb, (x) => (x === ba || x === bb ? V.sD : x % 2 ? V.cu : V.cuL)); vfill(px, 21 + y0, ba, bb, (x) => (x === ba || x === bb ? V.sD : V.cuD));
    px(V.yD, ba + 2, 21 + y0); px(V.yD, bb - 2, 21 + y0);
    // cola de cable enroscado (perfil)
    if (side) for (let y = 14; y <= 19; y++) for (let x = 13; x <= 17; x++) { if ((x === 13 || x === 17) && (y === 14 || y === 19)) continue; if (x >= 15 && x <= 16 && y >= 16 && y <= 17) continue; px((x + y) % 3 === 0 ? V.o : (x + y) % 3 === 1 ? V.sD : V.s, x, y + y0); }
    // bobina: núcleo de pizarra y franjas de cobre; en la espalda y el frente recorre las vetas de luz
    const ca = side ? 7 : 6, cb = side ? 12 : 13;
    for (let y = 11; y <= 19; y++) { const a = y >= 18 ? ca - 1 : ca, b = y >= 18 ? cb + 1 : cb; vfill(px, y + y0, a, b, (x) => (y === 11 ? V.sL : y === 19 ? V.sD : x === a ? V.sL : x === b ? V.sD : y % 2 ? V.cuD : x === a + 1 ? V.cuL : V.cu)); }
    // cuello con gema amarilla y collar
    vfill(px, 7 + y0, 7, 12, (x) => (x === 7 ? V.sH : V.sL)); for (let y = 8; y <= 9; y++) vfill(px, y + y0, 8, 11, (x) => (x === 8 ? V.sL : x === 11 ? V.sD : V.s)); vfill(px, 10 + y0, 7, 12, (x) => (x === 7 ? V.sL : x === 12 ? V.sD : V.s));
    const gx = side ? 8 : 9; px(V.yL, gx, 8 + y0, 2, 1); px(V.y, gx, 9 + y0, 2, 1);
    // hombreras de pizarra con pernos y brazos-cable que acaban en pinzas
    const pauld = (a, b, dark) => { for (let y = 11; y <= 14; y++) { const aa = y === 11 ? a + 1 : a, bb2 = y === 11 ? b - 1 : b; vfill(px, y + y0, aa, bb2, (x) => (y === 11 ? V.sH : y === 12 ? (dark ? V.s : V.sL) : y === 13 ? (dark ? V.sD : V.s) : V.sD)); } px(V.y, a + 1, 13 + y0); };
    const arm = (a, dark) => { vfill(px, 15 + y0, a, a + 2, (x) => (x === a ? V.oL : x === a + 2 ? V.oD : V.o)); vfill(px, 16 + y0, a, a + 2, (x) => (x === a ? V.mL : x === a + 2 ? V.mD : V.m)); px(V.mD, a, 17 + y0); px(dark ? V.mD : V.m, a + 2, 17 + y0); };
    if (side) { pauld(5, 9, false); arm(6, false); } else { pauld(2, 5, false); pauld(14, 17, true); arm(2, false); arm(15, true); }
    // esfera de luz (cabeza): azul con luz arriba-izquierda y sombra abajo-derecha, collar de cobre
    [[0, 8, 11], [1, 6, 13], [2, 5, 14], [3, 5, 14], [4, 5, 14], [5, 5, 14]].forEach(([y, a, b]) => vfill(px, y + y0, a, b, (x) => lit(y === 5 ? V.bDD : x >= 13 || (y === 1 && x >= 12) ? V.bDD : (y === 1 && x <= 9) || (y === 2 && x <= 8) ? V.b : V.bD)));
    vfill(px, 6 + y0, 6, 13, (x) => (x <= 7 ? V.cuL : x >= 12 ? V.cuD : V.cu));
    if (front) vfill(px, 3 + y0, 6, 13, V.n), vfill(px, 4 + y0, 6, 13, V.n); else if (side) vfill(px, 3 + y0, 5, 9, V.n), vfill(px, 4 + y0, 5, 9, V.n); // visor oscuro: ahí brillan los ojos de luz
    px(V.w, 7, 1 + y0); // reflejo de la esfera
    // v2.23: ojos blancos 2×2 con pupila oscura abajo-derecha sobre la cara azul noche (antes sin pupila y mezclados con la esfera); la boca pasa de blanco a cian
    const ojo = (x) => { px(V.w, x, 3 + y0); px(V.w, x + 1, 3 + y0); px(V.w, x, 4 + y0); px('#1a1030', x + 1, 4 + y0); };
    if (front) { ojo(7); ojo(11); px(V.bL, 9, 5 + y0, 2, 1); }
    else if (side) { ojo(6); px(V.bL, 5, 5 + y0, 2, 1); }
    // vetas de luz del pecho (frente) o rayo gigante de espalda
    const vein = fl ? V.w : V.bL;
    if (front) [[10, 11], [9, 12], [10, 13], [9, 14], [10, 15], [9, 16], [10, 17], [9, 18]].forEach(([x, y]) => px(vein, x, y + y0));
    if (back) [[11, 1], [10, 2], [9, 3], [9, 4], [10, 4], [11, 4], [10, 5], [9, 6], [9, 7], [10, 8], [9, 9], [10, 10], [11, 11], [10, 12], [9, 13], [9, 14], [10, 14], [11, 14], [10, 15], [9, 16], [10, 17], [9, 18]].forEach(([x, y], i) => { px(i % 2 ? V.w : V.bL, x, y + y0); px(V.b, x + 1, y + y0); });
    // rayos: cortos siempre, más largos en el frame 2 (en perfil se curvan hacia atrás)
    const L = [[4, 2], [3, 3], [4, 4], [3, 5], [2, 6], [3, 7], [2, 8], [3, 9], [2, 10]], R = L.map(([x, y]) => [W - 1 - x, y]);
    const ray = (list, n) => list.slice(0, n).forEach(([x, y], i) => px(i % 2 ? V.bL : V.w, x, y + y0));
    if (side) ray(R.map(([x, y]) => [x - 1, y]), fl ? 9 : 4); else { ray(L, fl ? 9 : 4); ray(R, fl ? 9 : 4); }
    if (fl) [[1, 4], [18, 7], [0, 9], [17, 2], [9, 0]].forEach(([x, y]) => { if (!side || x > 9) { px(V.w, x, y + y0); px(V.bL, x - 1, y + y0); px(V.bL, x + 1, y + y0); } });
  };

  def2('voltorax', voltoraxDraw);

  const ZUM = { b: '#6b3fa0', bD: '#4a2a78', bL: '#9066cc', st: '#f4e7a0', stD: '#d2bd6c', wg: '#8ff0fa', wgL: '#e2fdff', wgD: '#49b8d4', or: '#f59a2a', orD: '#c06a14', w: '#ffffff', sp: '#fff7a0' };

  // Zumbel · Eléctrico · Común · 14×14 · 1 kg: abejorro peludo y redondo. Cara arriba (ojos grandes con ceja y boquita), barriga con rayas, alas de cristal cian, antenas con chispa, patitas y aguijón-enchufe.
  // Rasgo propio: flota con zumbido (frame 1 bate las alas); parado, salta una chispa entre las antenas (frame 2, `flick`).
  const zumbelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, Z = ZUM, y0 = -up, INK = '#2a1b30', wy = f === 1 ? -1 : 0;
    const wc = (x, y) => ((x + y) % 4 === 0 ? Z.wgL : Z.wg);
    if (!side) { ell(px, W, H, 2.6, 4.2 + wy, 2.6, 2.4, 0, wc); ell(px, W, H, W - 2.6, 4.2 + wy, 2.6, 2.4, 0, wc); sym(px, W, Z.wgD, 1, 5 + wy, 3, 1); }
    else { ell(px, W, H, 9.2, 3.6 + wy, 3.4, 2.3, 0, wc); px(Z.wgD, 7, 4 + wy, 5, 1); }
    if (back) { px(Z.orD, 6, 12 + y0, 2, 1); sym(px, W, Z.or, 5, 13 + y0, 1, 1); } else if (side) { px(Z.orD, 11, 8 + y0, 1, 3); px(Z.or, 12, 8 + y0, 2, 1); px(Z.or, 12, 10 + y0, 2, 1); }
    if (!side) sym(px, W, Z.bD, 3, 13 + y0, 1, 1); else { px(Z.bD, 3, 13 + y0); px(Z.bD, 7, 13 + y0); } // patitas
    const cx = side ? 6.6 : 7, rx = side ? 5.2 : 5.8;
    ell(px, W, H, cx, 8.2 + y0, rx, 4.8, 0, (x, y) => { const yy = y - y0; if (yy === 10 || (back && yy === 7)) return Z.st; if (yy === 11 || (back && yy === 8)) return Z.stD; if (yy >= 12) return Z.bD; return x < cx - 2 && yy < 8 ? Z.bL : Z.b; });
    if (!side) { sym(px, W, Z.bD, 5, 2, 1, 2); sym(px, W, Z.sp, 4, 1, 1, 1); if (fl) { sym(px, W, Z.w, 5, 0, 1, 1); px(Z.sp, 6, 1, 2, 1); px(Z.w, 6, 0, 2, 1); } }
    else { px(Z.bD, 4, 2, 1, 2); px(Z.sp, 3, 1); px(Z.bD, 6, 2, 1, 2); px(Z.sp, 6, 1); if (fl) { px(Z.w, 4, 0); px(Z.sp, 5, 0); } }
    if (back) { [[4, 5], [9, 6], [6, 9]].forEach(([x, y]) => px(Z.bL, x, y + y0)); return; }
    if (front) { Ei(px, 3, 5 + y0, INK); Ei(px, 9, 5 + y0, INK); px(INK, 6, 9 + y0, 2, 1); sym(px, W, '#ff9ab5', 2, 8 + y0, 1, 1); }
    else { Ei(px, 2, 5 + y0, INK); px(INK, 1, 9 + y0, 2, 1); px('#ff9ab5', 3, 8 + y0); }
  };

  def2('zumbel', zumbelDraw);

  // Zumbarix (fase 2, 18×18, 2,5 kg): abejorro corpulento. Cabeza redonda separada del tórax por un cuello oscuro, ojos grandes con cejas, cuatro alas-hélice, abdomen alargado con rayas y aguijón triple.
  // Rasgo propio: flota más alto y rápido; las alas giran (frame 1) y parado salta un arco entre las antenas (frame 2, `flick`).
  const zumbarixDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, Z = ZUM, y0 = -up, INK = '#2a1b30', sp = f === 1 ? 1.5 : 0;
    const wcol = (cy) => (x, y) => (y === Math.round(cy) ? Z.wgD : (x + y) % 5 === 0 ? Z.wgL : Z.wg);
    if (!side) [[3.4, 7.2 - sp, 3.6, 2.1], [4.2, 11.6 + sp, 3.1, 1.7]].forEach(([cx, cy, rx, ry]) => { ell(px, W, H, cx, cy + y0, rx, ry, 0, wcol(cy + y0)); ell(px, W, H, W - cx, cy + y0, rx, ry, 0, wcol(cy + y0)); });
    else [[12.4, 6.4 - sp, 4, 1.9], [13, 10.6 + sp, 3.4, 1.6]].forEach(([cx, cy, rx, ry]) => ell(px, W, H, cx, cy + y0, rx, ry, 0, wcol(cy + y0)));
    // aguijón triple: tres clavijas simétricas (1 + 2 + 1 px de ancho)
    if (!side) { px(Z.orD, 6, 16 + y0, 6, 1); sym(px, W, Z.or, 6, 17 + y0, 1, 1); px(Z.or, 8, 17 + y0, 2, 1); px(Z.w, 8, 17 + y0); } else { px(Z.orD, 7, 16 + y0, 6, 1); px(Z.or, 7, 17 + y0); px(Z.or, 9, 17 + y0, 2, 1); px(Z.or, 12, 17 + y0); }
    const bx = side ? 9 : 9, hx = side ? 7.2 : 9, k = side ? 0.88 : 1;
    ell(px, W, H, bx, 13.2 + y0, 3.3 * k, 3.6, 0, (x, y) => { const yy = y - y0; return yy === 12 || yy === 14 ? Z.st : yy >= 15 ? Z.bD : Z.b; }); // abdomen con rayas
    ell(px, W, H, bx, 9.6 + y0, 3.9 * k, 2.7, 0, (x, y) => (x < bx - 1.5 && y - y0 < 10 ? Z.bL : Z.b)); // tórax
    px(Z.st, side ? 7 : 7, 10 + y0, side ? 4 : 4, 1); // collar
    ell(px, W, H, hx, 5.1 + y0, 4.1 * k, 3.3, 0, (x, y) => (x < hx - 1.5 && y - y0 < 5 ? Z.bL : Z.b)); // cabeza
    px(Z.bD, side ? 6 : 7, 8 + y0, side ? 4 : 4, 1); // cuello oscuro (separa cabeza y tórax)
    if (!side) { sym(px, W, Z.bD, 6, 1, 1, 2); sym(px, W, Z.bD, 5, 0, 1, 1); sym(px, W, Z.sp, 4, 0, 1, 1); if (fl) { sym(px, W, Z.w, 6, 0, 1, 1); sym(px, W, Z.sp, 7, 1, 1, 1); px(Z.w, 8, 0, 2, 1); } }
    else { px(Z.bD, 5, 1, 1, 2); px(Z.bD, 4, 0); px(Z.sp, 3, 0); px(Z.bD, 8, 1, 1, 2); px(Z.sp, 9, 0); if (fl) { px(Z.w, 5, 0); px(Z.sp, 6, 0); px(Z.w, 7, 0); px(Z.sp, 8, 0); } }
    if (back) { px(Z.bL, 7, 4 + y0, 4, 1); px(Z.bD, 8, 6 + y0, 2, 1); return; }
    if (front) { Ei(px, 6, 4 + y0, INK); Ei(px, 10, 4 + y0, INK); px(INK, 8, 7 + y0, 2, 1); }
    else { Ei(px, 4, 4 + y0, INK); px(INK, 2, 7 + y0, 2, 1); }
  };

  def2('zumbarix', zumbarixDraw);

  // ── Arcel → Arcarex (Eléctrico, Rara) ──
  const ARC = { f: '#4a9cb8', fL: '#86d6e6', fD: '#2e6a8c', fV: '#3a4a8a', cr: '#f6e8c8', crD: '#e0cfa4', tooth: '#fff3d0', bl: '#f58ab4', blD: '#c8588a', blL: '#ffc0d8', str: '#e8e4ee', strD: '#a9a4b8', ye: '#ffe45a', ar: '#6ad8ff', w: '#ffffff', m: '#5fb8cc', mD: '#3f8aa8' };

  // Arcel (fase 1, 14×16, 2 kg): ardilla redonda de pelo erizado por la electricidad estática, cola grande y esponjosa y un GLOBO ROSA pegado a la cabeza (se le queda pegado por la estática).
  // Rasgo propio: anda a saltitos; parada, el globo se infla y el pelo suelta chispas (frame 2, `flick`).
  const arcelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, A = ARC, y0 = -up, INK = '#2a1b30', gr = fl ? 0.6 : 0;
    const fur = (x, y) => (x < 6 && (y + x) % 5 === 0 ? A.fL : A.f);
    const tailC = (x, y) => (y - y0 < 4 ? (x < 11 ? A.fL : A.f) : y % 4 < 2 ? A.f : A.fD);
    const balloon = (cx, cy) => { ell(px, W, H, cx, cy + y0, 3 + gr, 2.7 + gr, 0, (x, y) => (x < cx - 0.8 && y < cy + y0 - 0.5 ? A.blL : y > cy + y0 + 1.2 ? A.blD : A.bl)); px(A.blD, Math.round(cx), Math.round(cy + y0 + 2.8 + gr)); px(A.str, Math.round(cx) + 1, Math.round(cy + y0 + 3.8 + gr)); };
    if (!side) {
      if (!back) ell(px, W, H, 11.2, 7.8 + y0, 2.6, 5.8, 0, tailC); // cola detrás (a la derecha), con la punta crema
      ell(px, W, H, 7, 12.8 + y0, 3.8, 2.6, 0, (x, y) => (y - y0 >= 14 ? A.fD : fur(x, y)));
      if (!back) ell(px, W, H, 7, 13.3 + y0, 2.1, 1.9, 0, A.cr);
      px(A.fD, f === 1 ? 3 : 4, 15, 2, 1); px(A.fD, f === 1 ? 9 : 8, 15, 2, 1);
      ell(px, W, H, 6.6, 7.8 + y0, 4.3, 3.6, 0, fur);
      sym(px, W, A.f, 2, 4 + y0, 2, 2); sym(px, W, A.fL, 1, 7 + y0, 1, 1); sym(px, W, A.fL, 1, 9 + y0, 1, 1); // orejas y pelo de punta
      if (fl) { sym(px, W, A.ye, 0, 6 + y0, 1, 1); sym(px, W, A.ar, 0, 10 + y0, 1, 1); }
      if (back) { ell(px, W, H, 7, 9.6 + y0, 2.6, 5.6, 0, tailC); balloon(4, 2.7); sym(px, W, A.fD, 5, 3 + y0, 1, 1); return; }
      balloon(3.6, 2.6);
      Ei(px, 4, 6 + y0, INK); Ei(px, 8, 6 + y0, INK);
      px(A.cr, 5, 9 + y0, 4, 2); px(INK, 6, 9 + y0, 2, 1); px(A.tooth, 6, 10 + y0, 2, 1);
      if (fl) { px(A.ye, 12, 2 + y0); px(A.ar, 13, 3 + y0); px(A.ye, 12, 14 + y0); }
    } else {
      ell(px, W, H, 11.2, 7.6 + y0, 2.7, 6, 0, tailC);
      ell(px, W, H, 7.8, 12.4 + y0, 4.2, 2.6, 0, (x, y) => (y - y0 >= 14 ? A.fD : fur(x, y)));
      ell(px, W, H, 6, 13.2 + y0, 2.2, 1.6, 0, A.cr);
      px(A.fD, f === 1 ? 4 : 5, 15, 2, 1); px(A.fD, f === 1 ? 9 : 8, 15, 2, 1);
      ell(px, W, H, 4.8, 7.8 + y0, 3.8, 3.6, 0, fur);
      px(A.f, 6, 3 + y0, 2, 2); px(A.fL, 8, 7 + y0); px(A.fL, 8, 9 + y0);
      balloon(3.6, 2.6);
      Ei(px, 2, 6 + y0, INK); px(INK, 0, 8 + y0, 1, 2); px(A.cr, 1, 9 + y0, 2, 2); px(A.tooth, 1, 10 + y0, 1, 1);
      if (fl) { px(A.ye, 9, 5 + y0); px(A.ar, 10, 4 + y0); px(A.ye, 12, 2 + y0); }
    }
  };

  def2('arcel', arcelDraw);

  // Arcarex (fase 2, 20×20, 4 kg): ardilla planeadora. Membranas abiertas a los lados (silueta ancha) con ARCOS azules en el borde, CASCO-PARARRAYOS rosa (el rosa del globo, ahora en un detalle), ceño decidido y cola larga de RESORTE con chispa en la punta.
  // Rasgo propio: planea (`float` bajo) y, parada, salta un arco entre las manos y los pies (frame 2, `flick`). Se conserva: pelo de punta, cola grande (ahora de muelle), rosa y turquesa.
  const arcarexDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, A = ARC, y0 = -up, INK = '#2a1b30';
    const fur = (x, y) => (x < 9 && (y + x) % 5 === 0 ? A.fL : A.f);
    const coil = (x0) => { for (let y = 3; y <= 11; y++) { const cx = x0 + 1.3 * Math.sin(y * 1.6), c0 = Math.round(cx - 1); for (let x = c0; x <= c0 + 2; x++) px(Math.floor(y / 2) % 2 ? A.str : A.strD, x, y + y0); } px(A.ye, Math.round(x0) - 1, 1 + y0, 2, 2); if (fl) { px(A.w, Math.round(x0), 0 + y0); px(A.ye, Math.round(x0) + 2, 2 + y0); } };
    const mem = [[9, 1, 5], [10, 0, 5], [11, 0, 5], [12, 1, 5], [13, 1, 5], [14, 2, 5], [15, 3, 5], [16, 4, 5]];
    const memCol = (a) => (x, y) => (x === a ? (fl && y % 2 ? A.w : A.ar) : y >= 15 ? A.mD : A.m);
    if (!side) {
      if (!back) coil(16.5);
      mem.forEach(([y, a, b]) => { rows(px, [[y + y0, a, b]], memCol(a)); rows(px, [[y + y0, W - 1 - b, W - 1 - a]], (x) => (x === W - 1 - a ? (fl && y % 2 ? A.w : A.ar) : y >= 15 ? A.mD : A.m)); });
      sym(px, W, A.fD, 0, 8 + y0, 2, 1); sym(px, W, A.fD, 3, 17 + y0, 1, 1);
      if (fl) { sym(px, W, A.ye, 0, 12 + y0, 1, 1); sym(px, W, A.w, 1, 14 + y0, 1, 1); sym(px, W, A.ye, 2, 16 + y0, 1, 1); }
      ell(px, W, H, 10, 13.3 + y0, 3.8, 3.3, 0, fur);
      if (!back) ell(px, W, H, 10, 13.8 + y0, 2.3, 2.4, 0, A.cr);
      sym(px, W, A.fD, 6, 16 + y0, 2, 2); // pies
      ell(px, W, H, 10, 7.4 + y0, 4.7, 3.4, 0, fur);
      sym(px, W, A.f, 4, 4 + y0, 1, 4); sym(px, W, A.fL, 3, 5 + y0, 1, 2); sym(px, W, A.fL, 4, 8 + y0, 1, 1); // orejas y pelo de punta
      eli(px, 10, 4.8 + y0, 4.3, 2.8, 2 + y0, 4 + y0, W, (x, y) => (y - y0 === 4 ? A.blD : x < 8 && y - y0 < 4 ? A.blL : A.bl)); px(A.str, 9, 1 + y0, 2, 1); px(A.ye, 9, 0 + y0, 2, 1); // casco-pararrayos
      if (back) { eli(px, 10, 6.6 + y0, 4.3, 3, 5 + y0, 9 + y0, W, fur); ell(px, W, H, 10, 12 + y0, 2.4, 5, 0, (x, y) => (y % 4 < 2 ? A.fL : A.f)); coil(16.5); return; }
      Ei(px, 7, 6 + y0, INK); Ei(px, 11, 6 + y0, INK); sym(px, W, A.fD, 6, 5 + y0, 2, 1);
      px(A.cr, 8, 9 + y0, 4, 2); px(INK, 9, 9 + y0, 2, 1); px(A.tooth, 9, 10 + y0, 2, 1);
    } else {
      coil(16.5);
      ell(px, W, H, 9, 13.4 + y0, 4.6, 3.3, 0, fur);
      ell(px, W, H, 7, 14 + y0, 2.3, 2.2, 0, A.cr);
      rows(px, [[10 + y0, 10, 14], [11 + y0, 10, 16], [12 + y0, 11, 17], [13 + y0, 11, 17], [14 + y0, 12, 16], [15 + y0, 12, 15]], (x, y, a, b) => (x === b ? (fl ? A.w : A.ar) : y - y0 >= 14 ? A.mD : A.m)); // membrana hacia atrás
      px(A.fD, f === 1 ? 6 : 7, 17, 2, 2); px(A.fD, f === 1 ? 11 : 10, 17, 2, 2);
      ell(px, W, H, 6.8, 7.4 + y0, 3.9, 3.4, 0, fur);
      px(A.f, 8, 3 + y0, 1, 3); px(A.fL, 10, 6 + y0); px(A.fL, 10, 8 + y0);
      eli(px, 6.8, 4.8 + y0, 3.8, 2.8, 2 + y0, 4 + y0, W, (x, y) => (y - y0 === 4 ? A.blD : x < 5 && y - y0 < 4 ? A.blL : A.bl)); px(A.str, 6, 1 + y0, 2, 1); px(A.ye, 6, 0 + y0, 2, 1);
      Ei(px, 4, 6 + y0, INK); px(A.fD, 3, 5 + y0, 2, 1); px(INK, 2, 8 + y0, 1, 2); px(A.cr, 2, 9 + y0, 3, 2); px(A.tooth, 2, 10 + y0, 1, 1);
      if (fl) { px(A.ye, 12, 8 + y0); px(A.w, 14, 10 + y0); px(A.ye, 16, 12 + y0); px(A.ar, 15, 16 + y0); }
    }
  };

  def2('arcarex', arcarexDraw);
})();
