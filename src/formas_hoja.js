// formas_hoja.js — dibujos de las criaturas de elemento principal Hoja (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo).
// Criaturas de este archivo: aguacatigre, aguacato, aguacaton, cactavar, cactel, cactorax, micavar, setin.
// Los ayudantes comunes vienen de src/formas_base.js (G.F); cada archivo es su propio bloque (function () {...})(), así que los nombres locales no chocan entre archivos.
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  const { mk, inEll, ell, def2, sym } = G.F;

  // ═══ Lote 2 (v0.7): tres criaturas nuevas de Claude, dibujadas directamente en su tamaño ═══
  // Micel · Hoja · Común · 14×16: seta con patitas, sombrero ancho sobre un tallo fino
  def2('setin',
    (c, dir, f, px0, W, H) => {
      const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, cap = P.red, cap2 = P.red2, stem = P.cream, sh = '#d9bf8a';
      px(P.brown, 4, 14, 2, 2); px(P.brown, 8, 14, 2, 2);
      for (let y = 8 - up; y <= 13 - up; y++) for (let x = side ? 4 : 4; x <= (side ? 9 : 9); x++) px(y >= 12 - up ? sh : stem, x, y); // tallo
      ell(px, W, H, side ? 7.5 : 7, 5 - up, side ? 6 : 6.6, 4.2, 0, (x, y) => (y >= 7 - up ? cap2 : cap)); // sombrero
      px(P.cream2, 1, 8 - up, 12, 1); // borde de laminillas
      [[3, 3, 2, 2], [8, 2, 2, 2], [11, 5, 2, 1], [6, 5, 2, 1]].forEach(([x, y, w, h]) => px(P.white, x, y - up, w, h)); // lunares
      if (dir === 'up') return;
      if (!side) { px(P.ink, 5, 10 - up, 1, 2); px(P.ink, 8, 10 - up, 1, 2); px(P.pink2, 4, 12 - up); px(P.pink2, 9, 12 - up); px(P.ink, 6, 12 - up, 2, 1); }
      else { px(P.ink, 4, 10 - up, 1, 2); px(P.ink, 4, 12 - up, 2, 1); }
    });


  // Aguacato · diseño de Oli (v0.4); v2.23.3 (B2.1a): redibujado DIRECTAMENTE a 18×18 (antes 16×16 estirado, lo que descuadraba los ojos). Mismas piezas del diseño (gato-aguacate con llave de cuerda, orejas con interior rosa, barriga clara, bracitos, colita), centradas en 18 con `sym`. Va en su propio bloque para no chocar con los ayudantes de Aguacaryn/Aguacarax.
  (function () {
    const A = { skin: P.green, dark: P.green2, belly: '#c4e27a', belly2: '#a9d46a', key: P.greyD, keyM: P.grey2, keyL: P.grey, ear: P.pink };
    const SPOTS = [[4, 7], [13, 8], [3, 12], [14, 13], [7, 15], [11, 15], [6, 9], [11, 7]];
    const inBody = (x, y, cx, cy, rx, ry) => { const dy = (y + 0.5 - cy) / ry; if (Math.abs(dy) > 1) return false; return Math.abs(x + 0.5 - cx) <= rx * Math.sqrt(1 - dy * dy) * (1 + 0.16 * dy); };
    function keyBow(px, x, y) { // lazo de la llave 6x4 con agujero
      px(A.key, x, y, 6, 1); px(A.key, x, y + 3, 6, 1); px(A.key, x, y + 1, 1, 2); px(A.key, x + 5, y + 1, 1, 2);
      px(A.keyM, x + 1, y + 1, 4, 2); px(A.keyL, x + 1, y + 1, 1, 1); px(A.key, x + 2, y + 1, 2, 1); // agujero oscuro
    }
    const EAR_L = [[3, 3], [4, 3], [2, 4], [3, 4], [4, 4], [5, 4], [2, 5], [3, 5], [4, 5], [5, 5], [5, 6]], EAR_P = [[3, 4], [4, 4], [3, 5], [4, 5]]; // oreja gordita de 4×3 con interior rosa 2×2
    def2('aguacato', (c, dir, f, px0, W, H) => {
      const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, cy = 10.6 - up, cx = side ? 7.6 : 9, rx = side ? 5.9 : 7.2, ry = 6.2;
      if (dir === 'down') keyBow(px, 6, 0);
      if (side) { px(A.key, 11, 8 - up, 2, 2); keyBow(px, 12, 4 - up); px(A.key, 12, 5 - up, 1, 1); } // llave de lado, saliendo de la espalda
      if (side) { px(A.dark, 3, 17 - up, 3, 1); px(A.dark, 9, 17 - up, 3, 1); } else sym(px, W, A.dark, 4, 17 - up, 3, 1); // pies
      for (let y = 0; y < 17 - up; y++) for (let x = 0; x < W; x++) {
        if (!inBody(x, y, cx, cy, rx, ry)) continue;
        px(y >= 15 - up ? A.dark : A.skin, x, y);
      }
      SPOTS.forEach(([x, y]) => { if (inBody(x, y - up, cx, cy, rx - 1, ry) && !(dir === 'down' && y > 11)) px(A.dark, x - (side ? 1 : 0), y - up); }); // textura de piel
      const ears = () => { EAR_L.forEach(([x, y]) => sym(px, W, A.skin, x, y - up)); EAR_P.forEach(([x, y]) => sym(px, W, A.ear, x, y - up)); };
      if (dir === 'down') {
        ears();
        for (let y = 11; y < 17 - up; y++) for (let x = 0; x < W; x++) { const dx = (x + 0.5 - 9) / 4.2, dy = (y + 0.5 - (14 - up)) / 3; if (dx * dx + dy * dy <= 1) px(y >= 15 - up ? A.belly2 : A.belly, x, y); } // barriga clara
        sym(px, W, A.skin, 1, 12 - up, 1, 2); // bracitos
        sym(px, W, P.ink, 4, 8 - up, 2, 2); px(P.white, 4, 8 - up); px(P.white, 12, 8 - up); // ojos (brillo arriba a la izquierda en los dos)
        px(P.pink2, 8, 10 - up, 2, 1); sym(px, W, P.ink, 7, 11 - up); px(P.red2, 8, 11 - up, 2, 1); // naricita y boquita
        sym(px, W, A.dark, 1, 10 - up); // bigotes
      } else if (dir === 'up') {
        keyBow(px, 6, 0); px(A.key, 8, 4 - up, 2, 5); px(A.keyM, 8, 4 - up, 1, 5); // llave y su eje clavado en la espalda
        ears();
        [[10, 14], [11, 14], [11, 15], [10, 15], [9, 15]].forEach(([x, y]) => px(A.dark, x, y - up)); // colita enroscada
        sym(px, W, A.skin, 1, 12 - up, 1, 2);
      } else { // perfil (mira a la izquierda)
        EAR_L.forEach(([x, y]) => px(A.skin, x, y - up)); EAR_P.forEach(([x, y]) => px(A.ear, x, y - up));
        px(A.dark, 8, 4 - up, 2, 2); px(A.dark, 8, 5 - up, 3, 1); // oreja lejana
        for (let y = 11; y < 17 - up; y++) for (let x = 0; x < W; x++) { const dx = (x + 0.5 - 4.2) / 2.6, dy = (y + 0.5 - (14 - up)) / 3; if (dx * dx + dy * dy <= 1) px(A.belly, x, y); }
        px(P.ink, 3, 8 - up, 2, 2); px(P.white, 3, 8 - up); px(P.pink2, 1, 10 - up); px(P.red2, 2, 11 - up, 2, 1); // ojo, nariz y boca
        px(A.skin, 5, 12 - up, 2, 2); px(A.dark, 5, 13 - up, 2, 1); // bracito
        [[12, 15], [13, 16], [14, 16], [15, 15], [15, 14]].forEach(([x, y]) => px(A.dark, x, y - up)); // colita
      }
    });
  })();
  // ═══ Línea de Aguacato (v1.0): Aguacato (18×18, diseño de Oli) → Aguacaryn (20×20) → Aguacarax (22×22) ═══
  // Historia: fruta con llave (cría) → fruta madura con hueso (joven) → felino (adulto). Cada fase tiene su propia silueta, paleta, llave y forma de moverse.
  // Se conserva de Oli: nombre de familia (Aguacat-), orejas de gato con interior rosa, barriga clara y la llave de cuerda en la espalda (gris → bronce → oro).
  const h97 = (x, y) => ((x * 374761393 + y * 668265263) >>> 0) % 97; // ruido fijo para la textura de la piel

  const earTri = (px, x0, y0, n, col, inner, tip) => { // oreja: borde exterior vertical en x0, se ensancha hacia dentro
    px(col, x0 - 1, y0 + 1);
    for (let r = 0; r < n; r++) for (let i = 0; i <= r; i++) px(inner && r >= 2 && i >= 1 && i < r ? inner : col, x0 + i, y0 + r);
    if (tip) { px(tip, x0, y0); px(tip, x0, y0 + 1); }
  };

  const keyBow = (px, x, y, w, hh, o, m, l, hole) => { // lazo de la llave con borde, brillo y agujero
    px(o, x, y, w, 1); px(o, x, y + hh - 1, w, 1); px(o, x, y + 1, 1, hh - 2); px(o, x + w - 1, y + 1, 1, hh - 2);
    px(m, x + 1, y + 1, w - 2, hh - 2); px(l, x + 1, y + 1, 2, 1); px(hole, x + 2, y + 2, w - 4, hh - 4);
  };

  const scanL = (pred, y, W) => { for (let x = 0; x < W; x++) if (pred(x, y)) return x; return -1; };

  const scanR = (pred, y, W) => { for (let x = W - 1; x >= 0; x--) if (pred(x, y)) return x; return -1; };

  // ── Aguacaryn · fase 2 (20×20) · «el madurar»: pera ancha, piel rugosa tipo Hass, hueso grande y llave de bronce ──
  const A2 = { skin: '#4e9a4a', hi: '#6fbf62', dark: '#2f6b3a', belly: '#d8e68c', belly2: '#bcd36e', ear: P.pink, o: '#5a3d18', m: '#c9962f', l: '#f1c95c', pit: '#7a4a2b', pitL: '#b8834d', pitD: '#4a2a18' };

  const aguatonDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f === 1 ? 1 : 0, yBot = H - 2 - up;
    const front = dir === 'down', sym = !side;
    const mir = (col, x, y, w, hh) => px(col, W - x - (w || 1), y, w, hh);
    const head = (x, y) => (sym ? inEll(x, y, 10, 7.8 - up, 6.6, 5.2, 0.1) : inEll(x, y, 7, 7.2 - up, 5.4, 4.8, 0.06));
    const body = (x, y) => (sym ? inEll(x, y, 10, 13.2 - up, 8.8, 5.5, 0.12) : inEll(x, y, 10, 13.6 - up, 7.2, 5.2, 0.1));
    const inB = (x, y) => y < yBot && (head(x, y) || body(x, y));
    const skinAt = (x, y) => { if (y >= yBot - 2) return A2.dark; const n = h97(x, y); return n % 11 === 0 ? A2.dark : n % 13 === 3 ? A2.hi : A2.skin; };
    // llave de bronce (detrás del cuerpo)
    if (sym) keyBow(px, 6, 0, 7, 4, A2.o, A2.m, A2.l, A2.o);
    else { keyBow(px, 12, 1 - up, 7, 4, A2.o, A2.m, A2.l, A2.o); px(A2.o, 14, 5 - up, 2, 3); px(A2.m, 14, 5 - up, 1, 3); }
    const leaf = (x, y) => { px(A2.hi, x, y, 2, 2); px(A2.skin, x + 1, y + 1); px(A2.dark, x, y + 2); };
    // patas cortas y fuertes
    if (sym) { px(A2.dark, 4, yBot, 4, 2); px(A2.dark, 12, yBot, 4, 2); px(A2.skin, 4, yBot, 4, 1); px(A2.skin, 12, yBot, 4, 1); }
    else { px(A2.dark, 3, yBot, 4, 2); px(A2.dark, 10, yBot, 4, 2); }
    // orejas
    if (front) { earTri(px, 4, 1, 4, A2.skin, A2.ear); earTri(mir, 4, 1, 4, A2.skin, A2.ear); }
    else if (dir === 'up') { earTri(px, 4, 1, 4, A2.skin); earTri(mir, 4, 1, 4, A2.skin); }
    else { earTri(px, 9, 2 - up, 3, A2.dark); earTri(px, 5, 1 - up, 4, A2.skin, A2.ear); }
    // cuerpo
    for (let y = 0; y < yBot; y++) for (let x = 0; x < W; x++) if (inB(x, y)) px(skinAt(x, y), x, y);
    if (side) { [[16, 15], [17, 15], [18, 14], [18, 12], [18, 10]].forEach(([x, y], i) => px(i === 3 ? A2.dark : A2.skin, x, y - up, 2, 2)); leaf(17, 7 - up); } // cola gruesa con hojita
    if (dir === 'up') { [[13, 15], [14, 16], [15, 16], [16, 15], [16, 14]].forEach(([x, y]) => px(A2.dark, x, y - up, 2, 2)); px(A2.hi, 15, 11 - up, 2, 2); px(A2.dark, 15, 13 - up); px(A2.o, 9, 4, 2, 5); px(A2.m, 9, 4, 1, 5); } // cola y eje de la llave clavado en la espalda
    if (front) {
      for (let y = 0; y < yBot; y++) for (let x = 0; x < W; x++) if (inEll(x, y, 10, 14.8 - up, 5.3, 3.4, 0) && body(x, y)) px(y >= yBot - 2 ? A2.belly2 : A2.belly, x, y);
      ell(px, W, H, 10, 14.6 - up, 2.9, 2.9, 0, A2.pitD); // hueso: borde, cuerpo y brillo
      ell(px, W, H, 10, 14.6 - up, 2.3, 2.3, 0, (x, y) => (x + 0.5 < 9.6 && y + 0.5 < 14.4 - up ? A2.pitL : A2.pit));
      px(A2.skin, 0, 11 - up, 3, 4); px(A2.dark, 0, 14 - up, 3, 1); px(A2.skin, 17, 11 - up, 3, 4); px(A2.dark, 17, 14 - up, 3, 1); // brazos fuertes
      const ey = 6 - up;
      px(P.ink, 5, ey, 3, 3); px(P.ink, 12, ey, 3, 3); px(P.white, 5, ey); px(P.white, 12, ey);
      px(A2.dark, 4, ey - 2, 4, 1); px(A2.dark, 12, ey - 2, 4, 1); // cejas
      px(P.pink2, 3, ey + 3, 2, 1); px(P.pink2, 15, ey + 3, 2, 1);
      px(P.pink2, 9, ey + 3, 2, 1); px(P.ink, 8, ey + 4); px(P.ink, 11, ey + 4); px(P.red2, 9, ey + 4, 2, 1);
    } else if (side) {
      for (let y = 0; y < yBot; y++) for (let x = 0; x < W; x++) if (inEll(x, y, 5.8, 14.6 - up, 3.4, 3.2, 0) && inB(x, y)) px(A2.belly, x, y);
      px(A2.skin, 4, 11 - up, 3, 4); px(A2.dark, 4, 14 - up, 3, 1);
      const ey = 6 - up; px(P.ink, 3, ey, 3, 3); px(P.white, 3, ey); px(A2.dark, 2, ey - 2, 4, 1);
      px(P.pink2, 1, ey + 3, 2, 1); px(P.red2, 1, ey + 5, 3, 1); px(P.pink2, 4, ey + 4, 2, 1);
    }
  };

  // ── Aguacarax · fase 3 (22×22) · «el felino»: hombros anchos y cintura fina, rayas, ojos ámbar, garras, llave de oro y hueso-gema en el pecho ──
  const A3 = { skin: '#357f46', hi: '#4ea45a', dark: '#1f5236', stripe: '#10302a', belly: '#e9edb0', belly2: '#cfd98c', ear: P.pink, eye: '#f7b733', claw: P.cream, gd: '#8a5a16', g: '#d9a62e', gl: '#f7d54a', pit: '#7a4a2b', pitL: '#b8834d' };

  const aguatigreDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f === 1 ? 1 : 0, alt = f === 2, yBot = H - 3 - up, front = dir === 'down', sym = !side;
    const mir = (col, x, y, w, hh) => px(col, W - x - (w || 1), y, w, hh);
    const head = (x, y) => (sym ? inEll(x, y, 11, 7.2 - up, 6.6, 5, 0.06) || [[3, 8], [3, 9], [4, 10], [18, 8], [18, 9], [17, 10]].some(([a, b]) => a === x && b === y + up) : inEll(x, y, 6.8, 6.8 - up, 5.4, 4.6, 0.04) || (x >= 1 && x <= 3 && y >= 8 - up && y <= 10 - up));
    const chest = (x, y) => (sym ? inEll(x, y, 11, 12.6 - up, 9.8, 4.4, 0) : inEll(x, y, 9.2, 13 - up, 6.1, 4.8, 0));
    const hips = (x, y) => (sym ? inEll(x, y, 11, 15.6 - up, 6.6, 4.2, 0) : inEll(x, y, 12.4, 14.6 - up, 4.8, 3.9, 0));
    const inB = (x, y) => y < yBot && (head(x, y) || chest(x, y) || hips(x, y));
    const skinAt = (x, y) => { if (y >= yBot - 2) return A3.dark; const n = h97(x, y); return n % 17 === 0 ? A3.hi : A3.skin; };
    if (sym) keyBow(px, 7, 0, 8, 5, A3.gd, A3.g, A3.gl, A3.gd);
    else { keyBow(px, 12, 1 - up, 8, 5, A3.gd, A3.g, A3.gl, A3.gd); px(A3.gd, 15, 6 - up, 2, 3); px(A3.g, 15, 6 - up, 1, 3); }
    const tail = (pts, tip) => { pts.forEach(([x, y], i) => px(i % 3 === 2 ? A3.stripe : A3.skin, x, y - up, 2, 2)); px(A3.hi, tip[0], tip[1] - up, 2, 2); px(A3.skin, tip[0] + 1, tip[1] + 1 - up); px(A3.stripe, tip[0], tip[1] + 2 - up); }; // cola con anillos y hojita
    // patas con garras
    const leg = (x, w, col) => { px(col, x, yBot, w, 3); px(A3.dark, x, yBot + 2, w, 1); for (let i = 0; i < w; i += 2) px(A3.claw, x + i, H - 1); };
    if (sym) { leg(5, 4, A3.skin); leg(13, 4, A3.skin); } else { leg(10, 4, A3.dark); leg(3, 4, A3.skin); leg(13, 4, A3.skin); }
    // orejas altas con puntas oscuras y mechón
    if (front) { earTri(px, 3, 0, 5, A3.skin, A3.ear, A3.stripe); earTri(mir, 3, 0, 5, A3.skin, A3.ear, A3.stripe); px(A3.stripe, 2, 1); px(A3.stripe, 19, 1); }
    else if (dir === 'up') { earTri(px, 3, 0, 5, A3.skin, null, A3.stripe); earTri(mir, 3, 0, 5, A3.skin, null, A3.stripe); px(A3.stripe, 2, 1); px(A3.stripe, 19, 1); }
    else { earTri(px, 9, 2 - up, 4, A3.dark, null, A3.stripe); earTri(px, 5, 0 - up, 5, A3.skin, A3.ear, A3.stripe); }
    // cuerpo
    for (let y = 0; y < yBot; y++) for (let x = 0; x < W; x++) if (inB(x, y)) px(skinAt(x, y), x, y);
    if (side) tail(alt ? [[17, 17], [18, 17], [19, 16], [20, 15], [21, 13], [21, 11]] : [[17, 17], [18, 17], [19, 16], [20, 15], [20, 13], [20, 11]], alt ? [20, 8] : [19, 8]);
    // rayas: salen de los costados hacia dentro
    const bar = (y, n, fromLeft) => { const l = scanL(inB, y, W), r = scanR(inB, y, W); if (l < 0) return; if (fromLeft) px(A3.stripe, l, y, n, 1); else px(A3.stripe, r - n + 1, y, n, 1); };
    if (front) {
      for (let y = 0; y < yBot; y++) for (let x = 0; x < W; x++) if (inEll(x, y, 11, 15.8 - up, 4.5, 3.7, 0) && inB(x, y)) px(y >= yBot - 2 ? A3.belly2 : A3.belly, x, y);
      [[10 - up, 4], [12 - up, 4], [14 - up, 3], [16 - up, 3], [18 - up, 2]].forEach(([y, n]) => { bar(y, n, true); bar(y, n, false); });
      px(A3.stripe, 10, 2, 2, 3); px(A3.stripe, 8, 3, 1, 2); px(A3.stripe, 13, 3, 1, 2); // marca en la frente
      ell(px, W, H, 11, 14.7 - up, 2.6, 2.6, 0, A3.gd); ell(px, W, H, 11, 14.7 - up, 2.1, 2.1, 0, A3.g); // hueso-gema con aro de oro
      ell(px, W, H, 11, 14.7 - up, 1.5, 1.5, 0, (x, y) => (x + 0.5 < 10.8 && y + 0.5 < 14.5 - up ? A3.pitL : A3.pit));
      px(A3.skin, 0, 12 - up, 3, 6); px(A3.dark, 0, 16 - up, 3, 2); px(A3.skin, 19, 12 - up, 3, 6); px(A3.dark, 19, 16 - up, 3, 2); // brazos con garras
      px(A3.claw, 0, 18 - up); px(A3.claw, 2, 18 - up); px(A3.claw, 19, 18 - up); px(A3.claw, 21, 18 - up);
      const ey = 6 - up;
      px(A3.eye, 5, ey, 3, 2); px(A3.eye, 14, ey, 3, 2); px(P.ink, 7, ey, 1, 2); px(P.ink, 14, ey, 1, 2); px(P.white, 5, ey); px(P.white, 16, ey);
      px(A3.stripe, 5, ey - 2, 2, 1); px(A3.stripe, 7, ey - 1, 2, 1); px(A3.stripe, 15, ey - 2, 2, 1); px(A3.stripe, 13, ey - 1, 2, 1); // ceño
      px(P.pink2, 10, ey + 3, 2, 1); px(P.ink, 9, ey + 4); px(P.ink, 12, ey + 4); px(P.red2, 10, ey + 4, 2, 1); px(P.white, 9, ey + 5); px(P.white, 12, ey + 5); // nariz, boca y colmillos
    } else if (side) {
      for (let y = 0; y < yBot; y++) for (let x = 0; x < W; x++) if (inEll(x, y, 5.6, 14.6 - up, 3.4, 3.7, 0) && inB(x, y)) px(A3.belly, x, y);
      [9, 11, 13, 15, 17].forEach((y, i) => bar(y - up, [3, 4, 4, 3, 2][i], false));
      px(A3.stripe, 5, 2, 1, 3); px(A3.stripe, 7, 1, 1, 3); px(A3.stripe, 9, 2, 1, 3);
      px(A3.skin, 6, 12 - up, 3, 5); px(A3.dark, 6, 15 - up, 3, 2); px(A3.claw, 6, 17 - up); px(A3.claw, 8, 17 - up);
      const ey = 6 - up; px(A3.eye, 3, ey, 3, 2); px(P.ink, 3, ey, 1, 2); px(A3.stripe, 2, ey - 2, 2, 1); px(A3.stripe, 4, ey - 1, 2, 1);
      px(P.pink2, 0, ey + 3, 2, 1); px(P.red2, 1, ey + 4, 3, 1); px(P.white, 2, ey + 5);
    } else {
      [[7, 5], [9, 5], [11, 4], [13, 4], [15, 3]].forEach(([y, n]) => { bar(y - up, n, true); bar(y - up, n, false); });
      px(A3.stripe, 10, 3, 2, 3); px(A3.stripe, 10, 7 - up, 2, 2); px(A3.stripe, 10, 10 - up, 2, 2); px(A3.stripe, 10, 13 - up, 2, 2); // raya del espinazo
      px(A3.gd, 10, 5, 2, 3); px(A3.g, 10, 5, 1, 3); px(A3.gd, 12, 6); // eje de la llave y un diente
      tail([[14, 18], [16, 18], [17, 17], [18, 16], [18, 14]], alt ? [19, 10] : [17, 10]);
    }
  };

  def2('aguacaton', aguatonDraw);

  def2('aguacatigre', aguatigreDraw);

  // ═══ Línea de Micel (Setín): seta pequeña y compacta → Micavar, seta de sombrero ancho tipo paraguas ═══
  // Micavar (fase 2, 18×18, 5 kg): silueta en «T»: sombrero granate enorme que sobresale, laminillas a la vista, pie alto con anillo-falda y base de musgo.
  // Rasgo propio: suelta una nube de esporas al parar (frame 2, `flick`) y se contonea suave al andar (`sway`) en vez de dar saltitos. Se conserva: sombrero rojo con puntos claros, pie crema, carita con mejillas.
  const MICA = { cap: '#8e2a3a', capD: '#6b1f2d', dot: P.cream, gill: '#d9bf8a', gill2: '#b89a66', stem: P.cream, stemD: '#d9bf8a', ring: P.white, ringD: P.cream2, moss: P.green, mossD: P.green2, spore: '#cfe8a8' };

  const micavarDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f === 1 ? 1 : 0, fl = f === 2, back = dir === 'up';
    // base de musgo (no se mueve con el paso)
    ell(px, W, H, side ? 8.5 : 9, 16.6, 5.6, 1.7, 0, (x, y) => (y >= 17 ? MICA.mossD : MICA.moss)); px(MICA.moss, 5, 15); px(MICA.moss, 12, 15); px(MICA.mossD, 7, 15);
    // pie alto
    const sx0 = side ? 5 : 6, sx1 = side ? 10 : 11;
    for (let y = 11 - up; y <= 15; y++) for (let x = sx0; x <= sx1; x++) px(y >= 14 ? MICA.stemD : MICA.stem, x, y);
    px(MICA.stemD, sx0 - 1, 15); px(MICA.stemD, sx1 + 1, 15);
    // anillo-falda
    const rx0 = side ? 3 : 4, rx1 = side ? 12 : 13;
    px(MICA.ring, rx0 + 1, 9 - up, rx1 - rx0 - 1, 1); px(MICA.ring, rx0, 10 - up, rx1 - rx0 + 1, 1); px(MICA.ringD, rx0 + 1, 11 - up, rx1 - rx0 - 1, 1);
    // sombrero ancho (sobresale a los dos lados) con borde inferior plano
    ell(px, W, H, side ? 9.5 : 9, 4.6 - up, side ? 8.4 : 8.9, 4.3, 0, (x, y) => (y >= 6 - up ? MICA.capD : MICA.cap));
    // laminillas (solo se ven de frente y de perfil; de espaldas, el borde liso)
    for (let x = side ? 2 : 1; x <= (side ? 16 : 16); x++) px(back ? MICA.capD : (x % 2 ? MICA.gill : MICA.gill2), x, 8 - up);
    (side ? [[4, 2, 2, 2], [9, 1, 3, 2], [13, 3, 2, 2], [7, 5, 2, 1], [12, 5, 2, 1]] : [[3, 2, 2, 2], [8, 1, 3, 2], [13, 3, 2, 2], [6, 5, 2, 1], [11, 5, 2, 1]]).forEach(([x, y, w, h]) => px(MICA.dot, x, y - up, w, h));
    if (fl) { [[1, 9], [0, 6], [16, 10], [17, 7], [3, 12], [14, 13]].forEach(([x, y]) => px(MICA.spore, x, y)); }
    if (back) return;
    const ey = 12 - up;
    if (!side) { px(P.ink, 7, ey, 1, 2); px(P.ink, 10, ey, 1, 2); px(P.pink2, 6, ey + 1); px(P.pink2, 11, ey + 1); px(P.ink, 8, ey + 2, 2, 1); }
    else { px(P.ink, 5, ey, 1, 2); px(P.pink2, 5, ey + 2); px(P.ink, 6, ey + 2, 2, 1); }
  };

  def2('micavar', micavarDraw);

  // ═══ Bloque 2 · lote C, parte 2 (v1.9): Cactel → Cactavar → Cactorax (Hoja, Rara, 3 fases). Mismo método que el resto, pero con los dibujos de la FOTO de Oli/artefacto ya aprobados: el frente de cada fase está dibujado píxel a píxel como en la galería; la espalda y los perfiles son derivados. ═══
  // Cada fase es un mapa de caracteres (una letra = un color de su paleta; '.' = transparente; '#' = tinta). `cacDraw` lo pinta; el contorno lo añade el juego solo.
  // Idea que une las tres fases: el cactus que crece (maceta de botas → trotamundos con sombrero y poncho → saguaro guardián con nido) y la flor rosa, cada vez más grande.
  const cacBlit = (px, rows, pal, ox, up, split) => rows.forEach((r, y) => { const yy = y - (y < split ? up : 0); if (yy < 0) return; for (let x = 0; x < r.length; x++) if (r[x] !== '.') px(pal[r[x]], x + ox, yy); });

  const cacDraw = (maps, pal, split) => (c, dir, f, px0, W, H) => { const { px } = mk(dir, px0, W), k = (dir === 'up' ? 'b' : dir === 'down' ? 'f' : 's') + (f === 2 ? '2' : '0'); cacBlit(px, maps[k], pal, 0, f === 1 ? 1 : 0, split); };

  const CTLP = { A: '#3f9a8c', B: '#2a6a6a', C: '#74cbb4', D: '#c08458', E: '#f3e9c8', F: '#f27aa8', G: '#5a3a26', H: '#9a6240', I: '#c4507e', J: '#ffffff', K: '#ffb3cf', '#': P.ink };

  const CTL = {
    f0: [
      '..............',
      '.......F......',
      '......KFF.....',
      '......FFF.....',
      '...ECAIIIAE...',
      '..ECCBAAABBE..',
      '..CCCBAAABBB..',
      '..CCJ#AAJ#BB..',
      'EACC##AA##BBAE',
      'AACC##AA##BBAA',
      'BBCFCB##ABFBBB',
      '..#CCBAAABB#..',
      '..E#CBAAAB#E..',
      '.DDDDDAADDDDD.',
      '..HHH....HHH..',
      '..GGG....GGG..'
  ],
    f2: [
      '.....F...F....',
      '.....FKFKF....',
      '......FIF.....',
      '......FFF.....',
      '...ECAIIIAE...',
      '..ECCBAAABBE..',
      '..CCCBAAABBB..',
      '..CCJ#AAJ#BB..',
      'EACC##AA##BBAE',
      'AACC##AA##BBAA',
      'BBCFCB##ABFBBB',
      '..#CCBAAABB#..',
      '..E#CBAAAB#E..',
      '.DDDDDAADDDDD.',
      '..HHH....HHH..',
      '..GGG....GGG..'
  ],
    b0: [
      '..............',
      '.......F......',
      '......KFF.....',
      '......FFF.....',
      '...ECAIIIAE...',
      '..ECCBAAABBE..',
      '..CCCBAAABBB..',
      '..CCEAAAAABB..',
      'EACCAAAAAABBAE',
      'AACCAAAAAEBBAA',
      'BBCACBCAABBBBB',
      '..#CCBAAABB#..',
      '..E#CBAAAB#E..',
      '.DDDDDAADDDDD.',
      '..HHH....HHH..',
      '..GGG....GGG..'
  ],
    b2: [
      '.....F...F....',
      '.....FKFKF....',
      '......FIF.....',
      '......FFF.....',
      '...ECAIIIAE...',
      '..ECCBAAABBE..',
      '..CCCBAAABBB..',
      '..CCEAAAAABB..',
      'EACCAAAAAABBAE',
      'AACCAAAAAEBBAA',
      'BBCACBCAABBBBB',
      '..#CCBAAABB#..',
      '..E#CBAAAB#E..',
      '.DDDDDAADDDDD.',
      '..HHH....HHH..',
      '..GGG....GGG..'
  ],
    s0: [
      '..............',
      '......F.......',
      '.....KFF......',
      '.....FFF......',
      '...ECIIIAE....',
      '..ECCBAAABE...',
      '..CCCBAAABB...',
      '..CCJ#AAABB...',
      '.ACC##AAABBAE.',
      '.ACC##AAABBAA.',
      '.BCFCAAAABB...',
      '...CCBAAABB...',
      '...ECBAAAB....',
      '..DDDDDAADDDD.',
      '...HHH..HHH...',
      '...GGG..GGG...'
  ],
    s2: [
      '.....F...F....',
      '.....FKFKF....',
      '......FIF.....',
      '......FFF.....',
      '...ECIIIAE....',
      '..ECCBAAABE...',
      '..CCCBAAABB...',
      '..CCJ#AAABB...',
      '.ACC##AAABBAE.',
      '.ACC##AAABBAA.',
      '.BCFCAAAABB...',
      '...CCBAAABB...',
      '...ECBAAAB....',
      '..DDDDDAADDDD.',
      '...HHH..HHH...',
      '...GGG..GGG...'
  ],
  };

  const CAVP = { A: '#f3e1b8', B: '#3f9a8c', C: '#e0b660', D: '#d9483f', E: '#2a6a6a', F: '#b88a3a', G: '#74cbb4', H: '#8a3a3a', I: '#9a6240', J: '#5a3a26', K: '#c08458', L: '#f3e9c8', M: '#a8322f', N: '#ffffff', O: '#655d6e', P: '#fff9ee', Q: '#453d54', '#': P.ink };

  const CAV = {
    f0: [
      '......CCCCCF......',
      '......HHHHHH......',
      '..CCCCCCCCCCCCCC..',
      'LFFFFFFFFFFFFFFFFL',
      '.GB...######...BG.',
      '.GE...EBBBBE...EG.',
      'LGE...N#BBN#...EGL',
      '.GE...##BB##...EG.',
      '.GE..G##BB##E..EG.',
      '.GEBBBEB##BEBBBEG.',
      '.BBBBBEBBBBEBBBBB.',
      '....AAAAAAAAAA....',
      '....DDDDMDDDDM....',
      '...AAAAAAAAAAAA...',
      '...DDDMDDDDMDDD...',
      '...AAAAAAAAAAAA...',
      '...A#A#ABABA#A....',
      '....KKK....KKK....',
      '....III....III....',
      '....JJJ....JJJ....'
  ],
    f2: [
      '.......CCCCCF.....',
      '.......HHHHHH.....',
      '..CCCCCCCCCCCCCC..',
      'LFFFFFFFFFFFFFFFFL',
      '.GB...######...BG.',
      '.GE...EBBBBE...EG.',
      'LGE...N#BBN#...EGL',
      '.GE...##BB##...EG.',
      '.GE..G##BB##E..EG.',
      '.GEBBBEB##BEBBBEG.',
      '.BBBBBEBBBBEBBBBB.',
      '....AAAAAAAAAA....',
      '.....DDDDMDDDDM...',
      '....AAAAAAAAAAAA..',
      '....DDDMDDDDMDDD..',
      '...AAAAAAAAAAAA...',
      '..A#A#ABABA#A.....',
      '....KKK....KKK....',
      '....III....III....',
      '....JJJ....JJJ....'
  ],
    b0: [
      '......CCCCCF......',
      '......HHHHHH......',
      '..CCCCCCCCCCCCCC..',
      'LFFFFFFFFFFFFFFFFL',
      '.GBBBBBBBBBBBBBBG.',
      '.GEBBBBBBBBBBBBEG.',
      'LGEBBGBBBBBBBBBEGL',
      '.GEBBBBBEEBBBBBEG.',
      '.GEBBBBBBBBBGBBEG.',
      '.GEBBBEBBBBEBBBEG.',
      '.BBBBBEBBBBEBBBBB.',
      '....AAAAAAAAAA....',
      '....DDDDMDDDDM....',
      '...AAAAAAAAAAAA...',
      '...DDDMDDDDMDDD...',
      '...AAAAAAAAAAAA...',
      '...A#A#ABABA#A....',
      '....KKK....KKK....',
      '....III....III....',
      '....JJJ....JJJ....'
  ],
    b2: [
      '.......CCCCCF.....',
      '.......HHHHHH.....',
      '..CCCCCCCCCCCCCC..',
      'LFFFFFFFFFFFFFFFFL',
      '.GBBBBBBBBBBBBBBG.',
      '.GEBBBBBBBBBBBBEG.',
      'LGEBBGBBBBBBBBBEGL',
      '.GEBBBBBEEBBBBBEG.',
      '.GEBBBBBBBBBGBBEG.',
      '.GEBBBEBBBBEBBBEG.',
      '.BBBBBEBBBBEBBBBB.',
      '....AAAAAAAAAA....',
      '.....DDDDMDDDDM...',
      '....AAAAAAAAAAAA..',
      '....DDDMDDDDMDDD..',
      '...AAAAAAAAAAAA...',
      '..A#A#ABABA#A.....',
      '....KKK....KKK....',
      '....III....III....',
      '....JJJ....JJJ....'
  ],
    s0: [
      '......CCCCCF......',
      '......HHHHHH......',
      '..CCCCCCCCCCCCCC..',
      'LFFFFFFFFFFFFFFFFL',
      '.GB...######...BG.',
      '.GE...EBBBBE...EG.',
      'LGE...N#BN#B...EGL',
      '.GE...##B##B...EG.',
      '.GE..G##B##BE..EG.',
      '.GEBBBE##BBEBBBEG.',
      '.BBBBBEBBBBEBBBBB.',
      '....AAAAAAAAAA....',
      '....DDDDMDDDDM....',
      '...AAAAAAAAAAAA...',
      '...DDDMDDDDMDDD...',
      '...AAAAAAAAAAAA...',
      '...A#A#ABABA#A....',
      '....KKK....KKK....',
      '....III....III....',
      '....JJJ....JJJ....'
  ],
    s2: [
      '.......CCCCCF.....',
      '.......HHHHHH.....',
      '..CCCCCCCCCCCCCC..',
      'LFFFFFFFFFFFFFFFFL',
      '.GB...######...BG.',
      '.GE...EBBBBE...EG.',
      'LGE...N#BN#B...EGL',
      '.GE...##B##B...EG.',
      '.GE..G##B##BE..EG.',
      '.GEBBBE##BBEBBBEG.',
      '.BBBBBEBBBBEBBBBB.',
      '....AAAAAAAAAA....',
      '.....DDDDMDDDDM...',
      '....AAAAAAAAAAAA..',
      '....DDDMDDDDMDDD..',
      '...AAAAAAAAAAAA...',
      '..A#A#ABABA#A.....',
      '....KKK....KKK....',
      '....III....III....',
      '....JJJ....JJJ....'
  ],
  };

  const CTXP = { A: '#3f9a8c', B: '#2a6a6a', C: '#6a4a32', D: '#f27aa8', E: '#74cbb4', F: '#8a6a4a', G: '#ffb3cf', H: '#f3e9c8', I: '#ffd23f', J: '#8a6a3a', K: '#c4507e', L: '#4a7fd6', M: '#5e4526', N: '#ffffff', O: '#8fb4f2', P: '#f59a2a', '#': P.ink };

  const CTX = {
    f0: [
      '.........DKKG.........',
      '.......GDDKKDDD.......',
      '......GDDDIIDDGD......',
      '......DDDIIIIGDD......',
      '......DDGDIIGDDD......',
      '.......GDDDGDDD.......',
      '..GID...ADGDDA#..OLLP.',
      '..DDD...BAAAAB#JJL#LJJ',
      '.HEAB..BBBAABBB.JMMMJ.',
      '..EAB...N#AAN#...BAE..',
      '..EAB...##AA##...BAE..',
      '..EAB#HE##AA##BH#BAE..',
      '.HEAB##EBAAAABB##BAEH.',
      '..EABAAABBAABBAAABAE..',
      '..EABAAABA##ABAAABAE..',
      '..AAAAAABAAAABAAAAAA..',
      '.......EBAAAABB.......',
      '........BAAAAB........',
      '........BAAAAB........',
      '......H#BAAAAB#H......',
      '.....H..BAAAAB..H.....',
      '........#AAAA#........',
      '.......CCCAACCC.......',
      '...CFFFCCCCFCCCFFCC...',
      '...CCCFCCCCFCCCCFCC...',
      '.....CFCCCCFCCCCF.....'
  ],
    f2: [
      '.........DKKG.........',
      '.......GDDKKDDD.......',
      '......GDDDIIDDGD......',
      '......DDDIIIIGDD......',
      '......DDGDIIGDDD......',
      '.......GDDDGDDD..OLLP.',
      '..GID...ADGDDA#..L#L..',
      '..DDD...BAAAAB#JJJJJJJ',
      '.HEAB..BBBAABBB.JMMMJ.',
      '..EAB...N#AAN#...BAE..',
      '..EAB...##AA##...BAE..',
      '..EAB#HE##AA##BH#BAE..',
      '.HEAB##EBAAAABB##BAEH.',
      '..EABAAABBAABBAAABAE..',
      '..EABAAABA##ABAAABAE..',
      '..AAAAAABAAAABAAAAAA..',
      '.......EBAAAABB.......',
      '.....D..BAAAAB........',
      '........BAAAAB........',
      '....G.H#BAAAAB#H......',
      '.....H..BAAAAB..H.....',
      '........#AAAA#........',
      '.......CCCAACCC.......',
      '...CFFFCCCCFCCCFFCC...',
      '...CCCFCCCCFCCCCFCC...',
      '.....CFCCCCFCCCCF.....'
  ],
    b0: [
      '.........GKKD.........',
      '.......DDDKKDDG.......',
      '......DGDDIIDDDG......',
      '......DDGIIIIDDD......',
      '......DDDGIIDGDD......',
      '.......DDDGDDDG.......',
      '.PLLO..#ADDGDA...DIG..',
      'JJL#LJJ#BAAAAB...DDD..',
      '.JMMMJ.BBBAABBB..BAEH.',
      '..EAB...BAAAAB...BAE..',
      '..EAB...BAAAAB...BAE..',
      '..EAB#HBBAAAABEH#BAE..',
      '.HEAB##BBAAAABE##BAEH.',
      '..EABAAABBAABBAAABAE..',
      '..EABAAABAAAABAAABAE..',
      '..AAAAAABAAAABAAAAAA..',
      '.......BBAAAABE.......',
      '........BAAAAB........',
      '........BAAAAB........',
      '......H#BAAAAB#H......',
      '.....H..BAAAAB..H.....',
      '........#AAAA#........',
      '.......CCCAACCC.......',
      '...CCFFCCCFCCCCFFFC...',
      '...CCFCCCCFCCCCFCCC...',
      '.....FCCCCFCCCCFC.....'
  ],
    b2: [
      '.........GKKD.........',
      '.......DDDKKDDG.......',
      '......DGDDIIDDDG......',
      '......DDGIIIIDDD......',
      '......DDDGIIDGDD......',
      '.PLLO..DDDGDDDG.......',
      '..L#L..#ADDGDA...DIG..',
      'JJJJJJJ#BAAAAB...DDD..',
      '.JMMMJ.BBBAABBB..BAEH.',
      '..EAB...BAAAAB...BAE..',
      '..EAB...BAAAAB...BAE..',
      '..EAB#HBBAAAABEH#BAE..',
      '.HEAB##BBAAAABE##BAEH.',
      '..EABAAABBAABBAAABAE..',
      '..EABAAABAAAABAAABAE..',
      '..AAAAAABAAAABAAAAAA..',
      '.......BBAAAABE.......',
      '........BAAAAB..D.....',
      '........BAAAAB........',
      '......H#BAAAAB#H.G....',
      '.....H..BAAAAB..H.....',
      '........#AAAA#........',
      '.......CCCAACCC.......',
      '...CCFFCCCFCCCCFFFC...',
      '...CCFCCCCFCCCCFCCC...',
      '.....FCCCCFCCCCFC.....'
  ],
    s0: [
      '.........DKKG.........',
      '.......GDDKKDDD.......',
      '......GDDDIIDDGD......',
      '......DDDIIIIGDD......',
      '......DDGDIIGDDD......',
      '.......GDDDGDDD.......',
      '..GID...ADGDDA#..OLLP.',
      '..DDD...BAAAAB#JJL#LJJ',
      '.HEAB..BBBAABBB.JMMMJ.',
      '..EAB...N#AN#B...BAE..',
      '..EAB...##A##B...BAE..',
      '..EAB#HE##A##ABH#BAE..',
      '.HEAB##EBAAAABB##BAEH.',
      '..EABAAABBAABBAAABAE..',
      '..EABAAAB##AABAAABAE..',
      '..AAAAAABAAAABAAAAAA..',
      '.......EBAAAABB.......',
      '........BAAAAB........',
      '........BAAAAB........',
      '......H#BAAAAB#H......',
      '.....H..BAAAAB..H.....',
      '........#AAAA#........',
      '.......CCCAACCC.......',
      '...CFFFCCCCFCCCFFCC...',
      '...CCCFCCCCFCCCCFCC...',
      '.....CFCCCCFCCCCF.....'
  ],
    s2: [
      '.........DKKG.........',
      '.......GDDKKDDD.......',
      '......GDDDIIDDGD......',
      '......DDDIIIIGDD......',
      '......DDGDIIGDDD......',
      '.......GDDDGDDD..OLLP.',
      '..GID...ADGDDA#..L#L..',
      '..DDD...BAAAAB#JJJJJJJ',
      '.HEAB..BBBAABBB.JMMMJ.',
      '..EAB...N#AN#B...BAE..',
      '..EAB...##A##B...BAE..',
      '..EAB#HE##A##ABH#BAE..',
      '.HEAB##EBAAAABB##BAEH.',
      '..EABAAABBAABBAAABAE..',
      '..EABAAAB##AABAAABAE..',
      '..AAAAAABAAAABAAAAAA..',
      '.......EBAAAABB.......',
      '.....D..BAAAAB........',
      '........BAAAAB........',
      '....G.H#BAAAAB#H......',
      '.....H..BAAAAB..H.....',
      '........#AAAA#........',
      '.......CCCAACCC.......',
      '...CFFFCCCCFCCCFFCC...',
      '...CCCFCCCCFCCCCFCC...',
      '.....CFCCCCFCCCCF.....'
  ],
  };

  // Cactel (fase 1, 14×16, 2 kg): cactus bebé redondo con espinas, flor rosa en la cabeza y MACETAS de botas. Pies siempre en la última fila; la fila 0 queda libre para que se abra la flor.
  // Rasgo propio: salta chiquito al andar (`hop`); parado, la flor se abre del todo y vuelve a cerrarse (frame 2, `flick`). Se conserva en las 3 fases: verde azulado, rosa de la flor, espinas crema, cara tranquila.
  def2('cactel', cacDraw(CTL, CTLP, 14));

  // Cactavar (fase 2, 18×20, 5 kg): cactus trotamundos. Brazos en «U» (silueta de cactus clásico), sombrero de paja, poncho a rayas rojo y crema con flecos, macetas de botas. De espaldas, cabeza lisa; de perfil, un solo ojo.
  // Rasgo propio: se contonea al andar (`sway`) y más despacio; parado, el poncho ondea y se ladea el sombrero (frame 2, `flick`).
  def2('cactavar', cacDraw(CAV, CAVP, 17));

  // Cactorax (fase 3, 22×26, 20 kg): saguaro guardián. Columna alta con brazos levantados, gran FLOR rosa con centro amarillo coronando, cara tallada en el tronco, florecilla en un brazo y NIDO con un pajarito azul en el otro, sobre un montón de tierra.
  // Rasgo propio: casi no anda (speed 4); parado, el pajarito asoma del nido y cae un pétalo (frame 2, `flick`).
  def2('cactorax', cacDraw(CTX, CTXP, 22));
})();
