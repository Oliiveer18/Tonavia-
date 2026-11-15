// formas_sombra.js — dibujos de las criaturas de elemento principal Sombra (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo).
// Criaturas de este archivo: lunabu, lunareth, lunaroth, somnaris, somnin.
// Los ayudantes comunes vienen de src/formas_base.js (G.F); cada archivo es su propio bloque (function () {...})(), así que los nombres locales no chocan entre archivos.
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  const { mk, ell, set, def2, sym, rows } = G.F;

  // Somnel 16×20 · alto y esbelto: gorro de dormir puntiagudo, estrellitas
  set('somnin', [16, 20], (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), dn = f ? 1 : 0, cy = 13 + dn, ey = Math.round(cy) - 1;
    px(P.purple2, 4, 18, 3, 2); px(P.purple2, 9, 18, 3, 2);
    ell(px, W, H, side ? 8.5 : 8, cy, 5.8, 5.2, 0.1, (x, y) => (y >= cy + 2.6 ? P.purple2 : P.purple));
    [[9, 2, 1], [8, 3, 2], [7, 4, 4], [6, 5, 6], [5, 6, 7], [4, 7, 9], [3, 8, 10]].forEach(([x, y, w]) => px(P.purple2, x, y, w, 1)); // gorro cónico
    px('#4a2c73', 3, 8, 10, 1); px(P.yellow, 10, 0, 2, 2); // borde y pompón
    star(px, 14, 5); px(P.yellow, 1, 9);
    if (dir === 'up') return;
    if (!side) { px(P.ink, 4, ey + 1, 3, 1); px(P.ink, 9, ey + 1, 3, 1); px(P.ink, 7, ey + 4, 2, 2); }
    else { px(P.ink, 3, ey + 1, 3, 1); px(P.ink, 2, ey + 4, 2, 2); }
    function star(p, x, y) { [[x, y - 1], [x - 1, y], [x, y], [x + 1, y], [x, y + 1]].forEach(([a, b]) => p(P.yellow, a, b)); }
  });

  // Lunel · Sombra · Épica · 20×20: búho nocturno con luna en la frente, ojos de oro y estrellas flotando
  def2('lunabu',
    (c, dir, f, px0, W, H) => {
      const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, body = P.purple2, belly = '#b794e6', wing = '#4a2c73', gold = P.yellow;
      px(P.orange, 6, 18, 3, 2); px(P.orange, 11, 18, 3, 2); // garras
      ell(px, W, H, 10, 12 - up, side ? 6.6 : 7.8, 6.6, 0.05, body);
      if (dir === 'down') ell(px, W, H, 10, 15 - up, 4.2, 3.6, 0, belly); // pecho claro
      [[3, 2, 3], [2, 3, 4], [2, 4, 3]].forEach(([x, y, w]) => px(wing, x, y, w, 1)); // mechones de las orejas
      [[14, 2, 3], [14, 3, 4], [15, 4, 3]].forEach(([x, y, w]) => px(wing, x, y, w, 1));
      if (!side) { px(wing, 1, 9 - up, 3, 8); px(wing, 16, 9 - up, 3, 8); px('#3a2360', 1, 15 - up, 3, 2); px('#3a2360', 16, 15 - up, 3, 2); } // alas pegadas al cuerpo
      else px(wing, side ? 11 : 11, 9 - up, 5, 8);
      if (dir === 'up') { [[9, 4], [10, 4], [8, 5], [8, 6], [9, 7], [10, 7]].forEach(([x, y]) => px(gold, x, y - up)); star(px, 3, 7); star(px, 17, 4); return; }
      if (!side) {
        [[9, 4], [10, 4], [8, 5], [8, 6], [9, 7], [10, 7]].forEach(([x, y]) => px(gold, x, y - up)); // luna
        ell(px, W, H, 6, 10 - up, 2.8, 2.8, 0, gold); ell(px, W, H, 14, 10 - up, 2.8, 2.8, 0, gold);
        px(P.ink, 5, 9 - up, 2, 3); px(P.ink, 13, 9 - up, 2, 3); px(P.white, 5, 9 - up); px(P.white, 13, 9 - up); px(P.orange, 9, 12 - up, 2, 2); // ojos y pico
        star(px, 2, 5); star(px, 17, 6);
      } else {
        [[5, 4], [4, 5], [4, 6], [5, 7]].forEach(([x, y]) => px(gold, x, y - up));
        ell(px, W, H, 6, 10 - up, 2.8, 2.8, 0, gold); px(P.ink, 5, 9 - up, 2, 3); px(P.white, 5, 9 - up); px(P.orange, 2, 12 - up, 2, 2);
        star(px, 16, 6);
      }
    });

  function star(px, x, y) { [[x, y - 1], [x - 1, y], [x, y], [x + 1, y], [x, y + 1]].forEach(([a, b]) => px(P.yellow, a, b)); }

  // ═══ Línea de Somnel: duendecillo dormilón con gorro de dormir → Somnaris, mago de los sueños con capa ═══
  // Somnaris (fase 2, 16×22, 2 kg): más alto y esbelto; flota (sin pies) y su capa índigo cae con una cola ondulada que sobresale en los perfiles. Gorro de dormir más alto y torcido con borla-estrella, luna creciente al cuello.
  // Rasgo propio: ya no cabecea; flota y la capa ondea parado (frame 2, `flick`) con una estrella que centellea. Al hablarle abre un ojo (frame 3, rasgo `eye`). Se conserva: gorro con estrellitas amarillas, cara morada, ojitos de rayita.
  const SOM = { cape: '#4b43a8', cape2: '#2f2a78', night: '#1c1f55' };

  const somnarisDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f === 1 ? 1 : 0, back = dir === 'up', front = dir === 'down', flare = f === 2, ph = [0, 2, 1, 0][f] || 0;
    // capa: cuerpo en forma de campana (de frente y espalda) o con cola larga hacia atrás (perfil); el borde inferior ondula
    const FR = { 13: [6, 9], 14: [5, 10], 15: [4, 11], 16: [4, 11], 17: [3, 12], 18: [3, 12], 19: [2, 13], 20: [2, 13], 21: [2, 13] };
    const SD = { 13: [5, 9], 14: [4, 10], 15: [4, 11], 16: [4, 12], 17: [4, 13], 18: [4, 14], 19: [4, 15], 20: [4, 15], 21: [4, 15] };
    const hemY = (x) => (side && x >= 10 ? 21 - Math.floor((x - 10) / 2) - (flare ? 1 : 0) - ((x + ph) % 3 === 0 ? 1 : 0) : 21 - (((x + ph) % 4) < 2 ? 0 : 1));
    for (let y = 13; y <= 21; y++) {
      let [a, b] = (side ? SD : FR)[y]; if (flare && y >= 17) { a--; b += side ? 0 : 1; }
      for (let x = a; x <= b; x++) { const hy = hemY(x); if (y > hy) continue; px(y === hy ? SOM.night : y === hy - 1 || x === a || x === b ? SOM.cape2 : SOM.cape, x, y); }
    }
    if (!side || true) { // estrellitas en la capa; en el frame 2 la primera centellea
      const st = side ? [[8, 19], [11, 20], [13, 19]] : [[4, 17], [11, 18], [7, 20]];
      st.forEach(([x, y], i) => { if (y < hemY(x) - 1) { px(P.yellow, x, y); if (flare && i === 0) { px(P.yellow, x - 1, y); px(P.yellow, x + 1, y); px(P.yellow, x, y - 1); px(P.yellow, x, y + 1); px(P.cream, x, y); } } });
    }
    // cabeza morada
    const cy = 10.9 - up, ey = Math.round(cy) - 1;
    ell(px, W, H, side ? 7 : 8, cy, side ? 4.1 : 4.6, 3.0, 0, (x, y) => (y >= cy + 1.6 ? P.purple2 : P.purple));
    // gorro de dormir alto y torcido hacia la derecha (hacia atrás en el perfil) con borla-estrella
    const sx = side ? -1 : 0, HAT = [[3, 10, 13], [4, 8, 12], [5, 6, 11], [6, 5, 11], [7, 3, 12]];
    HAT.forEach(([y, a, b]) => { for (let x = a; x <= b; x++) px(y === 7 ? SOM.night : x === a && y >= 4 && y <= 6 ? SOM.cape : SOM.cape2, x + sx, y - up); });
    px(P.yellow, 6 + sx, 5 - up); px(P.yellow, 9 + sx, 4 - up); // estrellitas del gorro
    [[13, 0], [12, 1], [14, 1], [13, 2]].forEach(([x, y]) => px(P.yellow, x + sx, y - up)); px(P.cream, 13 + sx, 1 - up); // borla-estrella
    if (back) return;
    // luna creciente al cuello
    if (front) [[8, 14], [9, 14], [7, 15], [7, 16], [8, 17], [9, 17]].forEach(([x, y]) => px(P.cream, x, y)); else [[6, 14], [7, 14], [5, 15], [5, 16], [6, 17], [7, 17]].forEach(([x, y]) => px(P.cream, x, y));
    // cara: ojos cerrados (solo la ranura oscura, sin punto claro desde la v2.24.3); al hablarle (frame 3) el ojo izquierdo se abre (ranura y pupila oscuras, sin blanco desde la v2.24.4)
    const eye = (x, open, pl) => { if (open) { px(P.ink, x, ey - 1, 3, 1); px(P.ink, x + pl, ey, 2, 2); } else { px(P.ink, x, ey, 3, 1); } };
    if (front) { eye(4, f === 3, 1); eye(9, false); px(P.ink, 7, ey + 3, 2, 1); }
    else { eye(3, f === 3, 0); px(P.ink, 3, ey + 3, 2, 1); }
  };

  def2('somnaris', somnarisDraw);

  // ═══ Línea de Lunel: búho lunar → Lunareth, búho del eclipse con alas abiertas → Lunaroth, guardián del cielo ═══
  // Paletas por fase (Épica: 5-6 colores): morado → morado oscuro con ámbar, luna crema y dorado → azul noche y violeta con estrellas, luna llena y oro.
  const LUN = {
    b: '#5e3d9c', bD: '#3a2566', bL: '#7f5cc8', bel: '#8d68c8', belL: '#c4a4f0',     // cuerpo de Lunareth
    w: '#2a1c58', wD: '#1a1040', wL: '#6a49a8',                                       // alas de Lunareth
    am: '#f0a020', amL: '#ffd36b', cr: '#fff0c8', crD: '#e0cf9f',                    // ojos ámbar, luna crema
    n: '#1c1f55', n2: '#2e2f86', n3: '#4a4cb0', ob: '#4a2f86', obL: '#7a56c0', obD: '#33205f', ol: '#cdb0f7', // Lunaroth: noche, cuerpo, vientre
    gd: '#f7d54a', gdD: '#c8921c', mn: '#fffbe6', mnD: '#d9cf9f',                    // oro y luna llena
  };

  // Lunareth (fase 2, 26×20, 6 kg): alas desplegadas a los lados (silueta ancha en «M»), cabeza con orejas-mechón con estrella, ojos ámbar y eclipse en el pecho (la luna medio tapada).
  // Rasgo propio: las alas se abren más y el eclipse brilla parado (frame 2, `flick`); sigue flotando. Se conserva: ojos grandes, estrellas en las orejas, cuerpo morado, garras naranjas y la luna.
  const lunarethDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), L = LUN, back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, y0 = -up, dy = fl ? -2 : 0, INK = '#2a1b30';
    // garras
    if (side) { px(P.orange, 6, 18, 2, 2); px(P.orange, 10, 18, 2, 2); } else { px(P.orange, 9, 18, 2, 2); px(P.orange, 15, 18, 2, 2); }
    if (!side) {
      // alas desplegadas: filas [y, desde, hasta] del ala izquierda; la derecha es su espejo
      const WL = [[2, 0, 1], [3, 0, 3], [4, 0, 5], [5, 0, 7], [6, 1, 9], [7, 1, 9], [8, 1, 9], [9, 2, 9], [10, 2, 9], [11, 3, 9], [12, 3, 9], [13, 4, 9], [14, 4, 5], [14, 7, 8], [15, 4, 4], [15, 7, 7]];
      const rowsW = WL.map(([y, a, b]) => [y + dy, a, b]); if (fl) rowsW.unshift([1, 0, 0], [2, 0, 2]);
      const colW = (x, y, a) => (y - dy <= 3 || x === a ? L.wL : y - dy >= 14 ? L.wL : (x === 4 || x === 6) && y - dy >= 9 ? L.wD : L.w);
      rows(px, rowsW, colW); rows(px, rowsW.map(([y, a, b]) => [y, W - 1 - b, W - 1 - a]), (x, y) => colW(W - 1 - x, y, [0, 0, 0].length ? (rowsW.find((r) => r[0] === y) || [0, 0])[1] : 0));
    } else {
      // de perfil (mira a la izquierda): un ala larga hacia atrás y arriba
      const WS = [[3, 22, 25], [4, 19, 25], [5, 16, 24], [6, 14, 23], [7, 12, 22], [8, 11, 21], [9, 10, 20], [10, 10, 19], [11, 10, 17], [12, 10, 15], [13, 11, 13]].map(([y, a, b]) => [y + dy, a, b]);
      rows(px, WS, (x, y, a, b) => (y - dy <= 5 || x === b ? L.wL : (x + y) % 5 === 0 ? L.wD : L.w));
    }
    // cuerpo
    const cx = side ? 9 : 13, cy = 12 + y0;
    ell(px, W, H, cx, cy, side ? 5.2 : 5.5, 6.4, 0.04, (x, y) => (y >= cy + 3.5 ? L.bD : x < cx - 2 && y < cy - 1 ? L.bL : L.b));
    // orejas-mechón con estrella
    if (side) { [[4, 3], [5, 2], [5, 3], [6, 3], [6, 4]].forEach(([x, y]) => px(L.bD, x, y + y0)); px(P.yellow, 5, 1 + y0); }
    else { [[7, 3], [8, 2], [8, 3], [9, 3], [8, 4], [9, 4]].forEach(([x, y]) => { px(L.bD, x, y + y0); px(L.bD, W - 1 - x, y + y0); }); sym(px, W, P.yellow, 8, 1 + y0); }
    if (back) { [[11, 9], [15, 12], [13, 15], [10, 13]].forEach(([x, y]) => px(P.yellow, x, y + y0)); px(L.bD, 11, 17 + y0, 4, 2); [[12, 18], [13, 18]].forEach(([x, y]) => px(L.bL, x, y + y0)); return; }
    if (front) {
      ell(px, W, H, 13, 14.8 + y0, 3.8, 3.4, 0, L.bel); ell(px, W, H, 13, 15.6 + y0, 2.6, 2.2, 0, L.belL);
      // eclipse: luna crema medio tapada por un disco oscuro, con corona dorada
      ell(px, W, H, 13, 14.5 + y0, 2.7, 2.7, 0, L.cr); ell(px, W, H, 14.4, 14 + y0, 2.5, 2.5, 0, L.bD);
      [[13, 11.5], [10, 14], [16, 14], [13, 17.5]].forEach(([x, y]) => px(fl ? '#ffffff' : P.yellow, Math.floor(x), Math.round(y) + y0));
      if (fl) { px(P.yellow, 10, 12 + y0); px(P.yellow, 16, 12 + y0); px(P.yellow, 10, 16 + y0); px(P.yellow, 16, 16 + y0); }
      px(P.yellow, 12, 4 + y0, 2, 1); px(P.yellow, 12, 5 + y0); // lunita de la frente
      sym(px, W, L.bD, 7, 6 + y0, 3, 1); // cejas
      [[9.6, 8.6], [16.4, 8.6]].forEach(([x, y]) => { ell(px, W, H, x, y + y0, 2.3, 2.3, 0, L.am); });
      sym(px, W, INK, 9, 8 + y0, 2, 3); sym(px, W, '#fff', 9, 8 + y0, 1, 1); px(P.orange, 12, 11 + y0, 2, 2);
    } else {
      ell(px, W, H, 6, 8.6 + y0, 2.3, 2.3, 0, L.am); px(INK, 5, 8 + y0, 2, 3); px(P.white, 5, 8 + y0); px(L.bD, 3, 6 + y0, 3, 1); px(P.orange, 1, 10 + y0, 2, 2); px(P.yellow, 5, 4 + y0); px(P.yellow, 4, 5 + y0);
    }
  };

  def2('lunareth', lunarethDraw);

  // Lunaroth (fase 3, 24×26, 8 kg): guardián del cielo. Silueta alta y majestuosa: corona de luna llena, alas largas de cielo nocturno con estrellas y borde dorado, y cola de cometa.
  // Rasgo propio: aura de destellos y cola de cometa (frame 2, `flick`); siempre flota, más alto y suave. Se conserva: ojos grandes (ahora dorados), estrellas, cuerpo morado y la luna (ahora llena sobre la cabeza).
  const lunarothDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), L = LUN, back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, y0 = -up, INK = '#2a1b30';
    // alas largas colgando hacia los lados (banderas de noche)
    const WG = [[10, 6, 8], [11, 4, 8], [12, 3, 8], [13, 2, 8], [14, 2, 8], [15, 1, 8], [16, 1, 8], [17, 0, 7], [18, 0, 7], [19, 0, 6], [20, 0, 6], [21, 0, 5], [22, 0, 4], [23, 0, 2], [24, 0, 1]];
    const colWing = (x, y, a, b) => (x === a || y === 10 ? L.gd : (x * 3 + y * 7) % 11 === 0 ? '#ffffff' : y > 17 ? L.n : L.n2);
    if (!side) { rows(px, WG.map(([y, a, b]) => [y + y0, a, b]), (x, y, a, b) => colWing(x, y - y0, a, b)); rows(px, WG.map(([y, a, b]) => [y + y0, W - 1 - b, W - 1 - a]), (x, y, a, b) => colWing(W - 1 - x, y - y0, WG.find((r) => r[0] === y - y0)[1], b)); }
    else { const WS = [[11, 9, 12], [12, 9, 14], [13, 9, 16], [14, 9, 18], [15, 9, 19], [16, 10, 20], [17, 11, 21], [18, 12, 22], [19, 14, 22], [20, 16, 23], [21, 18, 23], [22, 20, 23], [23, 22, 23]]; rows(px, WS.map(([y, a, b]) => [y + y0, a, b]), (x, y, a, b) => (x === b ? L.gd : (x * 3 + y * 7) % 11 === 0 ? '#ffffff' : y - y0 > 17 ? L.n : L.n2)); }
    // cola de cometa
    const tail = side ? [[22, 9, 12], [23, 11, 14], [24, 13, 16], [25, 15, 17]] : [[22, 10, 13], [23, 11, 12], [24, 11, 12], [25, 11, 11]];
    rows(px, tail.map(([y, a, b]) => [y, a, b]), (x, y) => (y >= 24 ? (fl ? '#ffffff' : L.gd) : L.obL)); if (fl) { px(L.gd, side ? 18 : 10, side ? 25 : 24); px(L.gd, side ? 8 : 13, 25); }
    // cuerpo y cabeza
    const cx = side ? 10 : 12, hx = side ? 8 : 12;
    ell(px, W, H, cx, 17 + y0, side ? 3.9 : 4.2, 5.2, 0.03, (x, y) => (y >= 20 + y0 ? L.obD : x < cx - 1.5 && y < 15 + y0 ? L.obL : L.ob));
    if (front) { ell(px, W, H, 12, 17.5 + y0, 2.7, 3.9, 0, L.ol); px(L.gd, 11, 14 + y0, 2, 1); px(L.gd, 11, 15 + y0); px(L.gd, 11, 16 + y0, 2, 1); px(L.gdD, 12, 15 + y0); }
    ell(px, W, H, hx, 10 + y0, side ? 4.2 : 4.5, 3.7, 0, (x, y) => (y >= 12 + y0 ? L.obD : x < hx - 1.5 && y < 9 + y0 ? L.obL : L.ob));
    // orejas con punta dorada
    if (side) { [[5, 6], [5, 5], [6, 5], [6, 4]].forEach(([x, y]) => px(L.obD, x, y + y0)); px(L.gd, 5, 4 + y0); }
    else { [[7, 7], [7, 6], [8, 6], [7, 5], [8, 5]].forEach(([x, y]) => { px(L.obD, x, y + y0); px(L.obD, W - 1 - x, y + y0); }); sym(px, W, L.gd, 7, 4 + y0); }
    // corona de luna llena
    const mx = side ? 8 : 12, my = 3.4 + y0;
    ell(px, W, H, mx, my, 3.9, 3.9, 0, fl ? L.gd : L.gdD); ell(px, W, H, mx, my, 3.1, 3.1, 0, L.mn);
    if (!back) { px(L.mnD, mx - 2, 2 + y0, 2, 2); px(L.mnD, mx + 1, 4 + y0, 2, 1); px(L.mnD, mx - 1, 5 + y0); } else { px(L.mnD, mx + 1, 2 + y0); px(L.mnD, mx - 2, 4 + y0); }
    if (back) { [[10, 15], [14, 18], [12, 21], [9, 19]].forEach(([x, y]) => px(L.gd, x, y + y0)); return; }
    // cara
    if (front) { [[9.9, 10], [14.1, 10]].forEach(([x, y]) => ell(px, W, H, x, y + y0, 2, 2, 0, fl ? L.amL : L.gd)); sym(px, W, INK, 9, 9 + y0, 2, 2); px(INK, 9, 9 + y0, 2, 2); sym(px, W, '#fff', 9, 9 + y0); px(P.orange, 11, 12 + y0, 2, 2); sym(px, W, L.obD, 7, 7 + y0, 3, 1); }
    else { ell(px, W, H, 6.6, 10 + y0, 2, 2, 0, fl ? L.amL : L.gd); px(INK, 6, 9 + y0, 2, 2); px(P.white, 6, 9 + y0); px(P.orange, 3, 11 + y0, 2, 2); px(L.obD, 5, 7 + y0, 3, 1); }
    // aura de destellos al pararse (frame 2)
    if (fl) [[3, 6], [20, 8], [1, 13], [22, 17], [7, 1], [17, 1]].forEach(([x, y]) => { if (!side || x > 11 || y < 9) { px('#ffffff', x, y); px(L.gd, x - 1, y); px(L.gd, x + 1, y); px(L.gd, x, y - 1); px(L.gd, x, y + 1); } });
  };

  def2('lunaroth', lunarothDraw);
})();
