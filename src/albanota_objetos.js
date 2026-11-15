// albanota_objetos.js — OBJETOS DE ALBANOTA (v2.55, ID-3c paso C; v2.56, paso D: volúmenes provisionales). Solo dibujo: sin estado de partida ni Math.random.
// Las piezas que ya estaban dibujadas y aprobadas en las escenas de referencia (tools/escena_albanota_piezas.js y escena_albanota3_objetos.js) pasan al catálogo de G.capas.
// Aquí NO se inventa nada: cada pieza es el mismo dibujo, con la misma paleta (G.PAL), contorno automático de 1 px y luz arriba-izquierda.
// Cada objeto se coloca en una CASILLA (x, y) de maps/albanota.json (antes lo hacía tools/historico/crear_albanota.js; hoy se edita en el juego o en tools/editor_mapas.html): las medidas (ox, oy, pieY, huella) llevan el dibujo a la posición del plano
// ajustada a la cuadrícula de 16 px (diferencia con la imagen de referencia: pocos píxeles). Centro PC, Tienda y Ermita (volúmenes provisionales del paso D, v2.56) están al final.
(function (root) {
  'use strict';
  const G = root.G, P = G.PAL, T = 16, INK = P.ink;
  const GR = P.green, GR2 = P.green2, GR3 = '#7cc972', WA = '#4d7fd6', WA_S = '#35559a', WA_L = '#8fb4f0', WA_D = '#2f4a86';
  const BELL_B = '#4d7fd6', BELL_BL = '#8fb4f0', BELL_P = '#f5a8bd', BELL_PS = '#e47a9a', GOLD = '#f7d54a', GOLD_S = '#d9a52e';
  const RED = P.red, RED_S = P.red2, RED_L = '#ea6a58', C = { GR };
  const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

  // lienzo pequeño con contorno automático (el mismo L de las escenas de referencia)
  function L(w, h) {
    const c = G.makeCanvas(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const o = { c, x, w, h,
      f(col, a, b, ww, hh) { x.fillStyle = col; x.fillRect(a, b, ww, hh); },
      p(col, a, b) { x.fillStyle = col; x.fillRect(a, b, 1, 1); },
      disc(col, cx, cy, r) { o.ell(col, cx, cy, r, r); },
      ell(col, cx, cy, rx, ry) { x.fillStyle = col; for (let yy = Math.floor(cy - ry); yy <= Math.ceil(cy + ry); yy++) for (let xx = Math.floor(cx - rx); xx <= Math.ceil(cx + rx); xx++) { const dx = (xx + 0.5 - cx) / rx, dy = (yy + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) x.fillRect(xx, yy, 1, 1); } },
      outline() { const id = x.getImageData(0, 0, w, h), d = id.data, s = new Uint8ClampedArray(d), k = hx(INK);
        const al = (a, b) => (a < 0 || b < 0 || a >= w || b >= h ? 0 : s[(b * w + a) * 4 + 3]);
        for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) { const i = (b * w + a) * 4; if (s[i + 3] === 0 && (al(a - 1, b) || al(a + 1, b) || al(a, b - 1) || al(a, b + 1))) { d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; d[i + 3] = 255; } }
        x.putImageData(id, 0, 0); return o; },
    };
    return o;
  }

  G.lienzoPieza = L; // v2.140: el mismo lienzo con contorno, para src/interiores_objetos.js

  // ---------- piezas (copiadas tal cual de las escenas de referencia) ----------
  function campana(l, cx, top, s) { // s = 1 grande (16 px) · 0 pequeña (8 px)
    const fil = s ? [[4, 0], [8, 1], [10, 2], [12, 3], [12, 4], [12, 5], [12, 6], [12, 7], [14, 8], [16, 9], [18, 10]] : [[2, 0], [4, 1], [4, 2], [6, 3], [6, 4], [8, 5], [8, 6]];
    fil.forEach(([w, r]) => { const x0 = cx - w / 2, y = top + r; l.f(BELL_B, x0, y, w / 2, 1); l.f(BELL_P, cx, y, w / 2, 1); });
    const n = fil.length;
    // luz arriba-izquierda: filo claro a la izquierda; sombra a la derecha
    fil.forEach(([w, r], i) => { if (i >= 1) { l.f(BELL_BL, cx - w / 2, top + r, s ? 2 : 1, 1); l.f(BELL_PS, cx + w / 2 - (s ? 2 : 1), top + r, s ? 2 : 1, 1); } });
    l.f(GOLD, cx - 1, top, 2, n); // junta dorada entre las dos mitades
    const last = fil[n - 1][0];
    l.f(GOLD, cx - last / 2, top + n, last, s ? 2 : 1); l.f(GOLD_S, cx - last / 2 + 1, top + n + (s ? 1 : 0), last - 1, 1); if (s) l.f(P.ink2, cx - last / 2 + 2, top + n + 2, last - 4, 1);
    if (s) { l.f(GOLD, cx - 2, top - 3, 4, 3); l.f(INK, cx - 1, top - 2, 2, 1); l.f(GOLD, cx - 1, top + n + 3, 3, 2); } // asa y badajo
    else l.f(GOLD, cx - 1, top + n + 1, 2, 1);
  }
  // v2.72 (paso C de docs/FICHAS_EDIFICIOS_3D.md): variantes de la casa. 'neutra' = el dibujo de siempre (pieza `casa`, ya no está en Albanota); 'lali' = postigos y flores azules; 'oli' = postigos y flores rosas;
  // 'lab' = (hasta la v2.76) laboratorio con tejado de pizarra; desde la v2.77 el laboratorio usa su propio dibujo, laboratorio(), y esta variante ya no se usa. Las otras tres comparten volumen, huella y puerta.
  const POST_TEAL = { md: P.teal2, ra: '#1f6065', hi: P.teal }, TEJA_ROJA = [RED_L, RED, RED_S, '#7c2a28'];
  const CASA_V = {
    neutra: { arriba: 0, post: POST_TEAL, flor: [GOLD, BELL_P], teja: TEJA_ROJA },
    lali:   { arriba: 0, post: { md: '#4d7fd6', ra: '#35559a', hi: '#8fb4f0' }, flor: ['#cfe0fa', '#2a3f7a'], teja: TEJA_ROJA },
    oli:    { arriba: 0, post: { md: '#e47a9a', ra: '#c25a7c', hi: '#f5a8bd' }, flor: ['#fbc7d5', '#e04f7f'], teja: TEJA_ROJA },
    lab:    { arriba: 6, post: POST_TEAL, flor: [GOLD, BELL_P], teja: ['#6aa0aa', '#3f7681', '#2d5a65', '#1f3f48'], alta: true, lente: true, matraz: true },
  };
  function matraz(l, cx, top) { // 8 × 8 px: cuello, hombros, panza con líquido verde (el emblema del laboratorio, en lugar de la campana)
    const VI = '#dfeefc', VS = '#a9c6f2', LI = '#5dae5a', LL = '#9ad88f';
    l.f(P.brown, cx - 1, top - 1, 2, 1);                                                        // corcho
    l.f(VI, cx - 1, top, 2, 2); l.f(VS, cx, top, 1, 2);                                          // cuello
    l.f(VI, cx - 2, top + 2, 4, 1); l.f(VI, cx - 3, top + 3, 6, 1); l.f(VS, cx + 2, top + 3, 1, 1); // hombros
    l.f(VI, cx - 4, top + 4, 8, 3); l.f(VI, cx - 3, top + 7, 6, 1);                              // panza
    l.f(LI, cx - 4, top + 5, 8, 2); l.f(LI, cx - 3, top + 7, 6, 1); l.f(LL, cx - 3, top + 5, 2, 1); l.f(VS, cx + 3, top + 4, 1, 3); l.f(VS, cx + 2, top + 7, 1, 1);
  }
  function casa(variante) {
    const v = CASA_V[variante || 'neutra'];
    const w = 94, rt = 20 + v.arriba, rb = rt + 32, wb = rb + 48, h = wb + 8, l = L(w, h), cx = 46;
    const [T0, T1, T2, T3] = v.teja;
    const roofHw = (y) => 24 + Math.round((y - rt) * 20 / 31);
    // chimenea (detrás del tejado); la del laboratorio sube 10 px más (+0,6 u) y tiene la corona más ancha con la boca abierta
    if (v.alta) {
      const ct = rt - 19;
      l.f(P.stone2, 58, ct, 10, rt + 17 - ct); l.f(P.stone1, 58, ct, 2, rt + 17 - ct); l.f(P.stone3, 66, ct, 2, rt + 17 - ct);
      for (let y = ct + 3; y < rt + 12; y += 4) l.f(P.stone3, 60, y, 6, 1);
      l.f(P.stone1, 55, ct - 3, 16, 3); l.f(P.stone3, 55, ct, 16, 1); l.f(P.stone2, 62, ct - 3, 2, 3); l.f(P.ink2, 57, ct - 4, 12, 1);
    } else {
      l.f(P.stone2, 58, rt - 9, 10, 26); l.f(P.stone1, 58, rt - 9, 2, 26); l.f(P.stone3, 66, rt - 9, 2, 26);
      for (let y = rt - 6; y < rt + 12; y += 4) l.f(P.stone3, 60, y, 6, 1);
      l.f(P.stone1, 56, rt - 12, 14, 3); l.f(P.stone3, 56, rt - 9, 14, 1); l.f(P.stone2, 62, rt - 12, 2, 3);
    }
    // tejado: escamas por bandas
    for (let y = rt; y < rb; y++) {
      const hw = roofHw(y), x0 = cx - hw, x1 = cx + hw, k = ((y - rt) / 4) | 0, ly = (y - rt) % 4, off = (k % 2) * 4;
      for (let x = x0; x < x1; x++) {
        const lx = (x - (cx - 44) + off) % 8; let col = x >= x1 - 4 ? T2 : T1;
        if (ly === 3 && lx !== 0) col = x >= x1 - 4 ? T3 : T2;
        else if (lx === 7) col = x >= x1 - 4 ? T3 : T2;
        else if (ly === 0 && x < cx - 2 && lx < 7) col = T0;
        l.p(col, x, y);
      }
    }
    l.f(T3, cx - 24, rt, 48, 1); l.f(T0, cx - 24, rt - 1, 47, 1); l.f(T2, cx - 23, rt - 3, 47, 2); l.f(T0, cx - 23, rt - 3, 45, 1); // cumbrera
    l.f(P.wood3, cx - 44, rb - 2, 88, 2); l.f(P.woodD, cx - 44, rb - 1, 88, 1); // alero
    // ventana redonda del desván
    if (v.lente) { // lente del laboratorio: aro de madera, cristal grande con reflejo y sombra abajo a la derecha, sin cruz
      l.disc(P.woodD, cx, rt + 16, 8.6); l.disc(P.wood3, cx, rt + 16, 7.6); l.disc('#6fa4e8', cx, rt + 16, 6); l.f(WA, cx + 1, rt + 19, 4, 2); l.f(WA, cx + 3, rt + 17, 2, 2); l.f(WA_L, cx - 4, rt + 12, 4, 2); l.f(WA_L, cx - 5, rt + 14, 2, 3);
    } else {
      l.disc(P.wood3, cx, rt + 16, 5.5); l.disc('#6fa4e8', cx, rt + 16, 3.8); l.f(P.wood3, cx - 4, rt + 16, 8, 1); l.f(P.wood3, cx, rt + 12, 1, 8); l.f(WA_L, cx - 3, rt + 13, 2, 2);
    }
    // veleta: campana pequeña de dos mitades
    l.f(P.greyD, cx - 1, rt - 10, 2, 10); campana(l, cx, rt - 20, 0);
    // paredes de yeso con entramado
    const xw0 = 6, xw1 = 86;
    l.f(P.cream, xw0, rb, xw1 - xw0, wb - rb); l.f('#ead7ae', xw1 - 3, rb, 3, wb - rb); l.f('#ead7ae', xw0, rb, xw1 - xw0, 4); l.f('#d3bb86', xw0, rb + 4, xw1 - xw0, 1);
    const post = (x, wd) => { l.f(P.wood3, x, rb, wd, wb - rb); l.f(P.wood1, x, rb, 1, wb - rb); l.f(P.woodD, x + wd - 1, rb, 1, wb - rb); };
    post(6, 4); post(34, 3); post(55, 3); post(82, 4);
    l.f(P.wood3, xw0, rb + 4, xw1 - xw0, 3); l.f(P.wood1, xw0, rb + 4, xw1 - xw0, 1); l.f(P.woodD, xw0, rb + 6, xw1 - xw0, 1);
    // zócalo de piedra
    l.f(P.stone2, xw0, wb - 6, xw1 - xw0, 6); l.f(P.stone1, xw0, wb - 6, xw1 - xw0, 1); l.f(P.stone3, xw0, wb - 1, xw1 - xw0, 1);
    for (let x = xw0 + 2; x < xw1; x += 7) { l.f(P.stone3, x, wb - 5, 1, 2); if (x + 3 < xw1) l.f(P.stone3, x + 3, wb - 3, 1, 2); } // (v2.32: la junta no se sale de la pared)
    // ventanas con postigos azul verdoso y jardinera
    [22, 70].forEach((vx) => {
      const gy = rb + 15;
      l.f(v.post.md, vx - 11, gy - 1, 4, 14); l.f(v.post.md, vx + 7, gy - 1, 4, 14); l.f(v.post.ra, vx - 10, gy + 2, 2, 1); l.f(v.post.ra, vx - 10, gy + 6, 2, 1); l.f(v.post.ra, vx + 8, gy + 2, 2, 1); l.f(v.post.ra, vx + 8, gy + 6, 2, 1);
      l.f(v.post.hi, vx - 11, gy - 1, 1, 14);
      l.f(P.wood3, vx - 7, gy - 2, 14, 14); l.f('#6fa4e8', vx - 6, gy - 1, 12, 12); l.f(WA_L, vx - 6, gy - 1, 3, 4); l.f(WA, vx + 2, gy + 6, 4, 5);
      l.f(P.wood3, vx - 1, gy - 1, 1, 12); l.f(P.wood3, vx - 6, gy + 4, 12, 1);
      l.f(P.wood3, vx - 8, gy + 11, 16, 5); l.f(P.woodD, vx - 8, gy + 14, 16, 2); l.f(P.wood1, vx - 8, gy + 11, 16, 1);
      l.f(GR2, vx - 7, gy + 8, 14, 3);
      [-6, -2, 2, 5].forEach((dx, i) => { l.f(GR, vx + dx - 1, gy + 8, 3, 3); l.f(i % 2 ? v.flor[1] : v.flor[0], vx + dx - 1, gy + 6, 2, 2); });
    });
    // puerta de madera con arco, cartel de la campana y farol
    const dx0 = 38, dx1 = 54, dy0 = wb - 32;
    l.f(P.woodD, dx0 - 1, dy0 - 1, dx1 - dx0 + 2, 33); l.f(P.brown, dx0, dy0, dx1 - dx0, 32);
    for (let x = dx0 + 2; x < dx1; x += 4) l.f('#6b4226', x, dy0 + 2, 1, 30); l.f(P.wood3, dx0, dy0 + 2, 2, 30);
    l.f(P.woodD, dx0, dy0 + 10, dx1 - dx0, 2); l.f(P.woodD, dx0, dy0 + 24, dx1 - dx0, 2);
    l.f(P.woodD, dx0, dy0, 2, 1); l.f(P.woodD, dx1 - 2, dy0, 2, 1);
    l.f(GOLD, dx1 - 5, dy0 + 16, 2, 3); l.f(GOLD_S, dx1 - 5, dy0 + 18, 2, 1);
    l.f(P.wood1, 39, rb + 9, 14, 8); l.f(P.wood3, 39, rb + 15, 14, 2); l.f(P.woodD, 38, rb + 7, 2, 2); l.f(P.woodD, 52, rb + 7, 2, 2); // cartel colgado
    if (v.matraz) matraz(l, 46, rb + 9); else campana(l, 46, rb + 9, 0);
    l.f(P.greyD, 61, rb + 16, 2, 2); l.f(P.ink2, 60, rb + 18, 4, 5); l.f(GOLD, 61, rb + 19, 2, 3); // farol
    // escalones
    l.f(P.stone1, 36, wb, 20, 3); l.f(P.stone3, 36, wb + 2, 20, 1); l.f(P.stone1, 33, wb + 3, 26, 3); l.f(P.stone3, 33, wb + 5, 26, 1);
    return l.outline();
  }
  // v2.79 · L1 · LABORATORIO = CENTRO DE ESTUDIO DE CRIATURAS (sustituye al de la v2.77; diseño en docs/FICHAS_EDIFICIOS_3D.md §3). Pieza propia, 94×114 como antes (mismo ox/oy/huella/puerta: el mapa no se mueve).
  // Silueta: cúpula de cristal con luz cálida y un huevo dentro (late despacio, ver `anima` en la ficha de la pieza), SIETE cristales elementales (Hoja, Fuego, Agua, Eléctrico, Aire, Roca, Sombra: tres a cada lado de la cúpula y el eléctrico coronándola)
  // y un plato escáner pequeño a la derecha. Fachada: ventanal grande con cápsula y huevo que brilla, pantalla de estudio con barras de elemento, dos incubadoras de cristal junto a la puerta (huevo y orbe), cartel con huevo-chispa y «LAB»,
  // puerta de madera con arco y luz cálida. Paredes crema, parapeto y marcos turquesa; los colores vivos solo en cristales, cúpula y huevos. Sin tuberías, vapor ni matraces. La pared sur ocupa y 58-106 (la lee `vol.fachada` del HD-2D).
  const LABC = { crema: P.cream, cremaL: P.white, cremaS: P.cream2, cremaD: '#d9c08e', arena: '#c9b48c', arenaL: '#e2d2ae', arenaS: '#a8946b', arenaD: '#7d6a4a',
    turq: P.teal2, turqL: '#5fc3c9', turqD: '#1f6065', turqC: P.teal, vidrio: '#c9eef2', vidrioL: '#f4fdff', vidrioS: '#7fb6c8', noche: '#3b2e4d', nocheT: '#1b2a3a', madera: P.wood1, maderaS: P.wood3, maderaD: P.woodD, oro: P.yellow, oroS: '#d9a52e' };
  const ELEM7 = { hoja: '#5dae5a', fuego: '#f0603e', agua: '#4580d4', electrico: '#f7d54a', aire: '#bfe3f5', roca: '#8a7f72', sombra: '#7a4cb0' };
  const LAB_DOMO = { cx: 46, cy: 46, R: 16 };
  let labBrillo = null; // píxeles de la luz interior de la cúpula (los que «laten»); los rellena laboratorio()
  function cristal(l, cx, base, h, col) { // cristal elemental: punta arriba, base plana oculta tras el parapeto; luz a la izquierda, sombra a la derecha
    const r = G.rampa(col), ws = [1, 3]; while (ws.length < h) ws.push(5);
    ws.forEach((w, i) => { const y = base - h + i, x0 = cx - ((w - 1) >> 1); l.f(r.base, x0, y, w, 1); if (w >= 3) { l.f(r.l1, x0, y, w > 3 ? 2 : 1, 1); l.f(r.s1, x0 + w - (w > 3 ? 2 : 1), y, w > 3 ? 2 : 1, 1); } });
    l.f(r.l2, cx - 1, base - h + 2, 1, 2); l.f(r.s0, cx + 2, base - 3, 1, 3);
  }
  function huevo(l, cx, top, ws, c) { // ws = anchos (impares) de cada fila; c = { b, l, s, m } base, luz, sombra y motas (opcional)
    ws.forEach((w, i) => { const x0 = cx - ((w - 1) >> 1), y = top + i; l.f(c.b, x0, y, w, 1); if (w >= 3) { l.p(c.l, x0, y); l.p(c.s, x0 + w - 1, y); } });
    l.p('#ffffff', cx - 1, top + 1); if (c.m) { l.f(c.m, cx, top + (ws.length >> 1) + 1, 2, 2); l.p(c.m, cx - 2, top + 3); }
  }
  function domoCalido(l, marca) { // cúpula de cristal con luz cálida; marca(x, y) recibe los píxeles de la luz interior
    const { cx, cy, R } = LAB_DOMO, dentro = (x, y, r) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; return dx * dx + dy * dy <= r * r; };
    for (let y = cy - R; y < cy; y++) for (let x = cx - R; x <= cx + R; x++) if (dentro(x, y, R)) { const dy = y + 0.5 - cy; l.p(dy < -R * 0.62 ? '#ffe08a' : dy < -R * 0.3 ? '#ffc45e' : '#f5a64a', x, y); }
    for (let y = cy - R; y < cy; y++) for (let x = cx - R; x <= cx + R; x++) { // luz del nido: dos elipses concéntricas
      const a = ((x + 0.5 - cx) / 10) ** 2 + ((y + 0.5 - (cy - 7)) / 8) ** 2, b = ((x + 0.5 - cx) / 5.6) ** 2 + ((y + 0.5 - (cy - 7)) / 4.6) ** 2;
      if (a <= 1 && dentro(x, y, R - 2)) { l.p(b <= 1 ? '#fffbe0' : '#ffe9a8', x, y); marca(x, y); } }
    huevo(l, cx, cy - 11, [1, 3, 5, 5, 5, 5, 3], { b: '#f0d9a8', l: '#fff6dc', s: '#d9b87a' });
    [-8, 8].forEach((dx) => { for (let y = cy - R; y < cy; y++) { const dy = y + 0.5 - cy, lim = Math.sqrt(Math.max(0, R * R - dy * dy)); if (Math.abs(dx) < lim - 1) l.p(LABC.turq, cx + dx, y); } }); // nervios
    l.f(LABC.turq, cx - R + 2, cy - 12, 2 * R - 3, 1); // nervio horizontal
    for (let y = cy - R; y < cy; y++) for (let x = cx - R; x <= cx + R; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d2 = dx * dx + dy * dy; if (d2 <= R * R && d2 > (R - 1.7) * (R - 1.7)) l.p(dx < 0 && dy < -2 ? LABC.turqL : LABC.turq, x, y); } // aro exterior
    l.f('#fffbe8', cx - 11, cy - 11, 3, 1); l.f('#fffbe8', cx - 12, cy - 10, 1, 3); // reflejo arriba a la izquierda
    l.f(LABC.turqD, cx - R - 1, cy, 2 * R + 3, 3); l.f(LABC.turqL, cx - R - 1, cy, 2 * R + 3, 1); // anillo de apoyo
  }
  function laboratorio() {
    const w = 94, h = 114, l = L(w, h), wb = 106, rb = 58, xw0 = 6, xw1 = 86, { cx, cy, R } = LAB_DOMO, pix = [];
    // escáner: plato pequeño a la derecha, sobre un mástil, con la punta del alimentador encendida
    l.f('#8a8498', 84, 36, 2, 14); l.f('#b9b4c4', 84, 36, 1, 14); l.f(LABC.turqD, 82, 46, 6, 3);
    l.ell('#e8e2f0', 84, 30, 7, 5.4); l.ell(LABC.turqC, 83, 31, 5.4, 4.1); l.ell(LABC.turq, 82.6, 31.6, 3.4, 2.5); l.f('#b9b4c4', 85, 27, 1, 4);
    l.f('#8a8498', 80, 24, 1, 5); l.f(LABC.oro, 79, 22, 2, 2);
    // los siete cristales elementales: tres a cada lado, de menor a mayor hacia la cúpula, y el eléctrico coronándola
    [[14, 9, 'hoja'], [20, 11, 'fuego'], [26, 13, 'agua'], [66, 13, 'aire'], [72, 11, 'roca'], [78, 9, 'sombra']].forEach(([x, hh, e]) => cristal(l, x, 50, hh, ELEM7[e]));
    cristal(l, cx, cy - R + 3, 14, ELEM7.electrico);
    domoCalido(l, (x, y) => pix.push([x, y]));
    // parapeto turquesa con remate crema
    l.f(LABC.cremaS, xw0 - 2, 49, xw1 - xw0 + 4, 9); l.f(LABC.cremaL, xw0 - 2, 49, xw1 - xw0 + 4, 2); l.f(LABC.cremaD, xw0 - 2, 51, xw1 - xw0 + 4, 1);
    l.f(LABC.turq, xw0 - 1, 52, xw1 - xw0 + 2, 5); l.f(LABC.turqL, xw0 - 1, 52, xw1 - xw0 + 2, 1); l.f(LABC.turqD, xw0 - 1, 56, xw1 - xw0 + 2, 1);
    for (let x = xw0 + 3; x < xw1 - 5; x += 10) l.f(LABC.turqL, x, 54, 4, 1);
    // pared crema (luz a la izquierda, sombra a la derecha y bajo el parapeto)
    l.f(LABC.crema, xw0, rb, xw1 - xw0, wb - rb); l.f(LABC.cremaL, xw0, rb, 2, wb - rb); l.f(LABC.cremaS, xw1 - 4, rb, 4, wb - rb); l.f(LABC.cremaS, xw0, rb, xw1 - xw0, 2); l.f(LABC.cremaD, xw0, rb + 2, xw1 - xw0, 1);
    // zócalo de piedra clara y filete turquesa
    l.f(LABC.turq, xw0, wb - 8, xw1 - xw0, 2); l.f(LABC.turqL, xw0, wb - 8, xw1 - xw0, 1);
    l.f(LABC.arena, xw0, wb - 6, xw1 - xw0, 6); l.f(LABC.arenaL, xw0, wb - 6, xw1 - xw0, 1); l.f(LABC.arenaS, xw0, wb - 1, xw1 - xw0, 1);
    for (let x = xw0 + 8; x < xw1; x += 12) l.f(LABC.arenaS, x, wb - 5, 1, 4);
    // ventana de estudio (derecha): pantalla con barras de elemento sobre una mesa
    const marco = (x0, x1, y0, y1) => { l.f(LABC.turqD, x0, y0, x1 - x0, y1 - y0); l.f(LABC.turqL, x0, y0, x1 - x0, 1); l.f(LABC.turqL, x0, y0, 1, y1 - y0); l.f(LABC.turq, x0 + 1, y0 + 1, x1 - x0 - 2, 1); l.f(LABC.turq, x0 + 1, y0 + 1, 1, y1 - y0 - 2);
      l.f(LABC.arenaL, x0 - 2, y1, x1 - x0 + 4, 3); l.f(LABC.arenaS, x0 - 2, y1 + 2, x1 - x0 + 4, 1); };
    marco(68, 86, 64, 96); l.f(LABC.nocheT, 70, 66, 14, 28); l.f('#27384a', 70, 66, 14, 6);
    l.f(LABC.turqD, 71, 69, 12, 11); l.f('#0e1a26', 72, 70, 10, 9);
    [[72, 3, ELEM7.hoja], [75, 6, ELEM7.fuego], [78, 4, ELEM7.agua], [81, 7, ELEM7.electrico]].forEach(([bx, bh, c]) => l.f(c, bx, 78 - bh, 2, bh)); l.f('#5fc3c9', 72, 78, 10, 1);
    l.f('#55657a', 70, 84, 14, 3); l.f('#8a8498', 70, 84, 14, 1); l.f(ELEM7.hoja, 72, 85, 2, 1); l.f(ELEM7.fuego, 75, 85, 2, 1); l.f('#ffe9a8', 79, 85, 3, 1); l.f('#3b4a5e', 70, 87, 14, 7); l.f('#ffd98a', 80, 88, 3, 2);
    l.f('#fffbe8', 71, 67, 4, 1); l.f('#fffbe8', 70, 68, 1, 2);
    // ventanal grande (izquierda): cápsula de cristal con un huevo que brilla
    marco(6, 24, 64, 96); l.f(LABC.noche, 8, 66, 15, 28);
    [[7, 11, '#6a4a62'], [5.4, 9, '#a8704f'], [4, 7, '#e8a860']].forEach(([rx, ry, c]) => l.ell(c, 15, 79, rx, ry));
    huevo(l, 15, 75, [1, 3, 5, 7, 7, 7, 7, 5, 3], { b: '#fff6dc', l: '#ffffff', s: '#e6c98f', m: LABC.turqC });
    l.f(LABC.vidrioL, 10, 71, 1, 15); l.f(LABC.vidrioS, 20, 71, 1, 15); l.f(LABC.vidrioL, 12, 69, 7, 1); l.p(LABC.vidrioL, 11, 70); l.p(LABC.vidrioS, 19, 70); // cristal de la cápsula
    l.f(LABC.turqD, 9, 86, 13, 3); l.f(LABC.turqL, 9, 86, 13, 1); l.f(LABC.noche, 8, 89, 15, 5); l.f('#ffd98a', 13, 87, 5, 1);
    l.f('#fffbe8', 9, 67, 4, 1); l.f('#fffbe8', 8, 68, 1, 2);
    // dos incubadoras de cristal junto a la puerta: huevo a la izquierda, orbe de luz a la derecha
    [[30, 'huevo'], [62, 'orbe']].forEach(([ix, que]) => {
      l.f(LABC.turqD, ix - 4, 100, 9, 5); l.f(LABC.turqL, ix - 4, 100, 9, 1); l.f(LABC.turq, ix - 3, 104, 7, 1);
      l.f(LABC.vidrio, ix - 3, 86, 7, 14); l.f(LABC.vidrio, ix - 2, 84, 5, 2); l.f(LABC.vidrioL, ix - 3, 86, 1, 14); l.f(LABC.vidrioL, ix - 2, 84, 2, 1); l.f(LABC.vidrioS, ix + 3, 86, 1, 14); l.p(LABC.vidrioS, ix + 2, 85);
      l.f(LABC.turqD, ix - 3, 99, 7, 1);
      if (que === 'huevo') huevo(l, ix, 90, [1, 3, 5, 5, 5, 3, 1].slice(0, 7), { b: '#fff6dc', l: '#ffffff', s: '#e6c98f', m: ELEM7.agua });
      else { l.disc('#ffd98a', ix, 94, 3.2); l.disc('#fff6c8', ix, 94, 2); l.f('#ffffff', ix - 1, 93, 1, 1); [[0, -4], [-1, -3], [0, -3], [1, -3], [0, -2]].forEach(([dx, dy]) => l.p(LABC.oro, ix + 3 + dx, 90 + dy + 1)); }
    });
    // cartel con huevo y chispa + «LAB»
    l.f(LABC.turqD, 31, 60, 30, 11); l.f(LABC.turqL, 31, 60, 30, 1); l.f(LABC.nocheT, 33, 62, 26, 7); l.f(LABC.turq, 32, 61, 28, 9);
    l.f('#1b3a3f', 33, 62, 26, 7);
    huevo(l, 38, 62, [1, 3, 5, 5, 5, 3, 1], { b: '#fff6dc', l: '#ffffff', s: '#e6c98f' });
    [[43, 62], [42, 63], [43, 63], [44, 63], [43, 64]].forEach(([x, y]) => l.p(LABC.oro, x, y));
    const letra = { L: ['100', '100', '100', '100', '111'], A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'] };
    'LAB'.split('').forEach((c, i) => letra[c].forEach((fila, r) => fila.split('').forEach((b, q) => { if (b === '1') l.p('#fff6dc', 47 + i * 4 + q, 63 + r); })));
    // puerta de madera con arco y luz cálida
    const px = 46, ay = 82, dr = 8; // arco: centro (46, 82), radio 8
    for (let y = ay - dr - 2; y < ay; y++) for (let x = px - dr - 2; x <= px + dr + 2; x++) { const dx = x + 0.5 - px, dy = y + 0.5 - ay; if (dx * dx + dy * dy <= (dr + 2) * (dr + 2)) l.p(dx < 0 && dy < -3 ? LABC.arenaL : LABC.arena, x, y); }
    l.f(LABC.arena, px - dr - 2, ay, 2 * dr + 4, wb - ay); l.f(LABC.arenaL, px - dr - 2, ay, 1, wb - ay); l.f(LABC.arenaS, px + dr + 1, ay, 1, wb - ay);
    for (let y = ay - dr; y < wb; y++) for (let x = px - dr; x < px + dr; x++) {
      const dx = x + 0.5 - px, dy = y + 0.5 - ay; if (y < ay && dx * dx + dy * dy > dr * dr) continue;
      l.p(y < ay ? (Math.abs(dx) < 0.6 || Math.abs(dx - 4.5) < 0.6 || Math.abs(dx + 4.5) < 0.6 ? LABC.maderaS : '#ffd98a') : (x < px ? LABC.madera : LABC.maderaS), x, y); }
    l.f(LABC.maderaD, px - 1, ay, 2, wb - ay); l.f('#d9a574', px - dr, ay + 1, 1, wb - ay - 1); l.f('#d9a574', px - dr + 1, ay + 6, 5, 1); l.f(LABC.maderaD, px + 1, ay + 6, 6, 1);
    l.f(LABC.maderaD, px - dr, ay + 14, 2 * dr, 1); l.f(LABC.oro, px - 3, ay + 11, 1, 3); l.f(LABC.oro, px + 2, ay + 11, 1, 3);
    l.f('#ffe9a8', px - 3, ay - 5, 2, 2); // destello del cristal del arco
    // escalones de piedra clara
    l.f(LABC.arenaL, 34, wb, 24, 3); l.f(LABC.arenaS, 34, wb + 2, 24, 1); l.f(LABC.arenaL, 31, wb + 3, 30, 3); l.f(LABC.arenaS, 31, wb + 5, 30, 1);
    labBrillo = pix;
    return l.outline();
  }
  // latido de la cúpula (v2.79): un velo de luz cálida sobre los píxeles del nido; 8 pulsos de 0,5 s (4 s por respiración); con ?movimiento=0 no se dibuja y queda la luz de base. Solo el 2D (en HD-2D el laboratorio sigue siendo la casa de siempre hasta L3).
  const LATIDO = [0, 1, 2, 3, 3, 2, 1, 0], VELO = [0, 0.16, 0.3, 0.44];
  let velos = null;
  function velosLab() {
    if (velos) return velos;
    if (!labBrillo) laboratorio();
    velos = VELO.map((a) => { const o = L(94, 114); if (a > 0) { o.x.globalAlpha = a; o.f('#fff3c4', 0, 0, 0, 0); labBrillo.forEach(([x, y]) => o.p('#fff3c4', x, y)); } return o.c; });
    return velos;
  }
  // v2.90 (ID-2b-4): partículas de las piezas, se pintan justo después de su dibujo (G.capas.animar → anima): humo de las chimeneas de las casas de Lali y de Oli (la boca está en (62, 6) del dibujo; k = nº de chimenea) y gotas, salpicaduras y destellos de la fuente. Ver src/particulas.js.
  const humoK = (k) => (ctx, ox, oy, reloj, reducido) => { if (G.particulas) G.particulas.pintarHumo(ctx, ox, oy, reloj, reducido, 62, 6, k); };
  function aguaFuente(ctx, ox, oy, reloj, reducido) { if (G.particulas) G.particulas.pintarFuente(ctx, ox, oy, reloj, reducido); }
  function latidoLab(ctx, ox, oy, reloj, reducido) { if (reducido) return; const k = LATIDO[Math.floor(reloj * 2) % LATIDO.length]; if (k) ctx.drawImage(velosLab()[k], ox, oy); }
  function valla(len, postes) {
    const l = L(len + 2, 14);
    l.f(P.wood3, 0, 4, len, 2); l.f(P.wood1, 0, 4, len, 1); l.f(P.wood3, 0, 9, len, 2); l.f(P.wood1, 0, 9, len, 1);
    for (let x = 1; x + 4 <= len; x += 6) { l.f(P.wood1, x, 2, 4, 12); l.f(P.wood3, x + 3, 2, 1, 12); l.f(P.wood1, x + 1, 1, 2, 1); l.f(P.wood3, x, 12, 4, 2); l.f('#d9a574', x, 2, 1, 10); }
    (postes || []).forEach((px) => { l.f(P.wood3, px, 0, 4, 14); l.f(P.wood1, px, 0, 1, 14); l.f(P.woodD, px + 3, 0, 1, 14); l.f(P.wood1, px, 0, 4, 1); });
    return l.outline();
  }
  function vallaV(len) { // lado vertical visto de frente: postes + dos travesaños
    const l = L(6, len + 2);
    l.f(P.wood3, 1, 0, 4, len); l.f(P.wood1, 1, 0, 1, len); l.f(P.woodD, 4, 0, 1, len);
    for (let y = 0; y < len; y += 12) { l.f(P.wood1, 0, y, 6, 3); l.f(P.wood3, 0, y + 2, 6, 1); }
    return l.outline();
  }
  function fuente() {
    const w = 60, h = 70, cx = 30, by = 50, l = L(w, h); // by = centro del borde del estanque
    // pared del estanque (cilindro)
    l.ell(P.stone3, cx, by + 6, 24, 12); l.f(P.stone3, cx - 24, by, 48, 6);
    l.ell(P.stone2, cx - 1, by + 6, 23, 11); l.f(P.stone2, cx - 24, by, 46, 6);
    for (let x = cx - 20; x < cx + 22; x += 8) l.f(P.stone3, x, by + 9, 1, 6); // juntas de los sillares
    l.ell(P.stone1, cx, by, 24, 12); l.ell('#e4e0ec', cx - 1, by - 1, 22, 10); l.ell(P.stone1, cx, by, 21, 9); // labio claro arriba-izquierda
    l.ell(P.stone3, cx, by + 1, 19, 8); // pared interior
    l.ell(WA, cx, by + 2, 18, 7); l.ell(WA_S, cx + 4, by + 6, 12, 2);
    // ondas alrededor de la columna (nacen de la caída de agua)
    [[11, 4], [15, 6]].forEach(([rx, ry]) => { for (let a = 0; a < 360; a += 1) { const px = Math.round(cx + Math.cos(a * Math.PI / 180) * rx), py = Math.round(by + 3 + Math.sin(a * Math.PI / 180) * ry); if (py >= by + 3 || a > 200 || a < 20) l.p(WA_L, px, py); } });
    // columna cilíndrica
    l.f(P.stone2, cx - 4, by - 22, 8, 24); l.f(P.stone1, cx - 4, by - 22, 2, 24); l.f(P.stone3, cx + 2, by - 22, 2, 24);
    l.f(P.stone1, cx - 6, by - 4, 12, 4); l.f(P.stone3, cx - 6, by - 1, 12, 1); // base
    // taza superior
    l.ell(P.stone3, cx, by - 20, 10, 4); l.ell(P.stone1, cx, by - 22, 10, 4); l.ell(WA, cx, by - 22, 8, 2);
    // caídas de agua (arcos laterales)
    [-1, 1].forEach((s) => { for (let t = 0; t <= 15; t++) { const yy = by - 20 + t, xx = cx + s * (9 + Math.round(5 * Math.sin(Math.min(t / 15, 1) * Math.PI / 2) )); l.f(WA_L, s > 0 ? xx - 1 : xx, yy, 2, 1); if (t > 3 && t < 13) l.f(WA, s > 0 ? xx - 2 : xx + 1, yy, 1, 1); } });
    // la campana grande
    campana(l, cx, by - 37, 1);
    return l.outline();
  }
  function banco() {
    const l = L(26, 16);
    l.f(P.wood3, 1, 0, 24, 2); l.f(P.wood1, 1, 0, 24, 1); l.f(P.wood3, 1, 3, 24, 2); l.f(P.wood1, 1, 3, 24, 1); // respaldo
    l.f(P.woodD, 2, 0, 2, 7); l.f(P.woodD, 22, 0, 2, 7);
    l.f(P.wood1, 0, 6, 26, 4); l.f('#d9a574', 0, 6, 26, 1); l.f(P.wood3, 0, 9, 26, 3); // asiento
    l.f(P.woodD, 1, 12, 3, 4); l.f(P.woodD, 22, 12, 3, 4);
    return l.outline();
  }
  function farola() {
    const l = L(10, 38);
    l.f(P.ink2, 4, 12, 2, 26); l.f(P.greyD, 3, 34, 4, 4); l.f(P.greyD, 4, 8, 2, 4);
    l.f(P.ink2, 1, 1, 8, 2); l.f(P.greyD, 2, 0, 6, 1);
    l.f('#fff3b0', 3, 3, 4, 5); l.f(GOLD, 2, 3, 1, 5); l.f(GOLD, 7, 3, 1, 5); l.f(GOLD, 3, 7, 4, 1); l.f(P.ink2, 1, 8, 8, 1);
    return l.outline();
  }
  function maceta() { // jardinera de piedra con flores
    const l = L(22, 14);
    l.f(P.stone2, 0, 6, 22, 8); l.f(P.stone1, 0, 6, 22, 2); l.f(P.stone3, 0, 12, 22, 2); l.f(P.stone3, 19, 6, 3, 8);
    l.f(GR2, 1, 3, 20, 4);
    for (let i = 0; i < 5; i++) { const x = 1 + i * 4; l.f(GR, x, 2, 3, 4); l.f(['#fff9ee', BELL_P, GOLD, BELL_BL, BELL_P][i], x, 0, 2, 3); l.f(GOLD_S, x, 2, 1, 1); }
    return l.outline();
  }
  // v2.243 · ROCAS, PIEDRAS y HIERBA ALTA (idea 2 de pokesurvivor.com: mundo más vivo con muchos elementos pequeños). Solo 2D por código; en el HD-2D salen como láminas de pie con la sombra proyectada
  // (como el barril); su volumen 3D propio queda pendiente (docs/ROADMAP.md). La roca bloquea (1 casilla); piedras y hierba alta se pisan.
  function roca() {
    const l = L(16, 12);
    l.f(P.stone2, 1, 4, 14, 7); l.f(P.stone2, 3, 2, 10, 2); l.f(P.stone1, 3, 3, 6, 2); l.f(P.stone1, 2, 5, 3, 3); l.f(P.stone3, 11, 5, 4, 5); l.f(P.stone3, 2, 9, 12, 2); l.f(P.stone3, 7, 5, 1, 3); l.f(P.stone1, 9, 6, 2, 1);
    return l.outline();
  }
  // v2.320 · BOCA DE LAS PROFUNDIDADES: peñasco de 3×2 casillas con un arco oscuro abajo en el centro (la casilla de la puerta). Solo 2D por código; en el HD-2D sale como lámina de pie (pendiente su volumen).
  function bocaCueva() {
    const l = L(48, 40), A = P.stone1, B = P.stone2, C = P.stone3;
    for (let y = 4; y < 39; y++) { const k = y < 14 ? Math.round((14 - y) * 1.5) : 0, m = y > 34 ? 39 - y - 4 < 0 ? 1 : 0 : 0; l.f(B, 2 + k + m, y, 44 - 2 * k - 2 * m, 1); }
    l.f(A, 14, 5, 16, 3); l.f(A, 8, 9, 9, 3); l.f(A, 4, 16, 5, 6); l.f(A, 27, 10, 8, 2); l.f(C, 34, 14, 10, 22); l.f(C, 4, 33, 40, 5); l.f(C, 20, 12, 2, 4); l.f(C, 10, 20, 3, 2); l.f(A, 37, 18, 3, 2); l.f(C, 6, 26, 4, 2);
    l.f('#2a1b30', 15, 20, 18, 19); l.f('#2a1b30', 17, 18, 14, 2); l.f('#120c1c', 17, 22, 14, 17); l.f('#120c1c', 19, 20, 10, 2); l.f('#3a2a50', 19, 34, 10, 5); l.f('#4a3f73', 21, 36, 6, 3);   // arco y penumbra del fondo
    l.f(A, 14, 19, 2, 4); l.f(A, 16, 17, 3, 2); l.f(C, 32, 19, 2, 20); l.f('#7ff0ff', 23, 26, 2, 3); l.f('#ffffff', 23, 26, 1, 1);   // dovelas claras a la izquierda (luz) y un cristal que brilla dentro
    l.f('#5dae5a', 3, 6, 4, 2); l.f('#3b8d50', 40, 10, 4, 2); l.f('#5dae5a', 11, 4, 3, 1);   // musgo
    return l.outline();
  }
  function piedras() {
    const l = L(14, 8);
    l.f(P.stone2, 1, 3, 6, 4); l.f(P.stone1, 2, 3, 3, 1); l.f(P.stone3, 1, 6, 6, 1); l.f(P.stone2, 8, 4, 5, 3); l.f(P.stone1, 9, 4, 2, 1); l.f(P.stone3, 8, 6, 5, 1);
    return l.outline();
  }
  function hierbaAlta() {   // mata alta: 7 hojas afiladas en tres tonos (oscuro #2c7351, medio #3b8d50, claro #93d46f) sobre una base oscura; contrasta con la hierba lisa (#5dae5a)
    const l = L(16, 14), alturas = [9, 12, 10, 13, 8, 11, 9], D = '#2c7351', M = '#3b8d50', C = '#93d46f';
    l.f(D, 0, 12, 16, 2); l.f(M, 1, 11, 14, 1);
    alturas.forEach((h, k) => { const x = 1 + k * 2, y = 12 - h; l.f(D, x, y + 2, 2, h - 1); l.f(M, x, y + 1, 1, h - 1); l.f(C, x, y + 2, 1, Math.max(2, h - 5)); l.p(D, x, y); l.p(C, x, y + 1); });
    return l;
  }
  function barril() {
    const l = L(14, 16);
    l.f(P.wood3, 1, 1, 12, 14); l.f(P.wood1, 1, 1, 3, 14); l.f(P.woodD, 10, 1, 3, 14);
    l.f(P.greyD, 0, 4, 14, 2); l.f(P.greyD, 0, 11, 14, 2); l.f(P.grey2, 1, 4, 12, 1); l.f(P.grey2, 1, 11, 12, 1);
    l.f(WA_S, 2, 1, 10, 2); l.f(WA, 2, 1, 7, 1);
    return l.outline();
  }
  function cartel() { // v2.248: poste y letrero grande con el NOMBRE del pueblo (el del mapa) y una flecha azul debajo
    const l = L(56, 40), nombre = (G.MAPAS && G.MAPAS.albanota && G.MAPAS.albanota.nombre) || 'Albanota';
    l.f(P.wood3, 25, 14, 6, 26); l.f(P.wood1, 25, 14, 1, 26); l.f(P.woodD, 30, 14, 1, 26);
    l.f(P.wood1, 2, 3, 52, 13); l.f(P.wood3, 2, 14, 52, 2); l.f(P.woodD, 2, 3, 52, 1); l.f(P.woodD, 2, 3, 1, 13); l.f(P.woodD, 53, 3, 1, 13); l.f(P.wood3, 4, 5, 1, 1); l.f(P.wood3, 51, 5, 1, 1); l.f(P.wood3, 4, 12, 1, 1); l.f(P.wood3, 51, 12, 1, 1);   // clavos
    const w = G.pixelTextWidth ? G.pixelTextWidth(nombre, 1) : 40; if (G.drawPixelText) G.drawPixelText(l.x, nombre, 2 + Math.round((52 - w) / 2), 5, 1, '#fff3d6', '#4a2b17');
    const tab = (y, x, ww, dir, col) => { l.f(P.wood1, x, y, ww, 8); l.f(P.wood3, x, y + 6, ww, 2); for (let i = 0; i < 4; i++) l.f(P.wood1, dir > 0 ? x + ww + i : x - 1 - i, y + i, 1, 8 - 2 * i); l.f(col, x + 3, y + 2, ww - 6, 3); };
    tab(20, 17, 24, -1, BELL_B);
    return l.outline();
  }
  function cartelCarbuna() { // v2.323: letrero de la puerta provisional a Carbuna: tablón oscuro con borde de brasa y el nombre, flecha naranja hacia el ESTE
    const l = L(56, 40), EM = '#ff8a3c', EM2 = '#ffd27a';
    l.f(P.wood3, 25, 14, 6, 26); l.f(P.wood1, 25, 14, 1, 26); l.f(P.woodD, 30, 14, 1, 26);
    l.f('#3b2a30', 2, 3, 52, 13); l.f('#2a1b22', 2, 14, 52, 2); l.f(EM, 2, 3, 52, 1); l.f(EM, 2, 3, 1, 13); l.f(EM, 53, 3, 1, 13); l.f(EM2, 4, 5, 1, 1); l.f(EM2, 51, 5, 1, 1); l.f(EM2, 4, 12, 1, 1); l.f(EM2, 51, 12, 1, 1);
    const w = G.pixelTextWidth ? G.pixelTextWidth('CARBUNA', 1) : 40; if (G.drawPixelText) G.drawPixelText(l.x, 'CARBUNA', 2 + Math.round((52 - w) / 2), 5, 1, '#ffe2b0', '#2a1408');
    l.f('#3b2a30', 17, 20, 24, 8); l.f('#2a1b22', 17, 26, 24, 2); for (let i = 0; i < 4; i++) l.f('#3b2a30', 41 + i, 20 + i, 1, 8 - 2 * i); l.f(EM, 20, 22, 20, 3); l.f(EM2, 21, 22, 6, 1);
    return l.outline();
  }
  function brasero() { // v2.323: brasero de piedra oscura con llama y brasas (flanquea la puerta de Carbuna)
    const l = L(14, 26);
    l.f(P.stone3, 5, 14, 4, 12); l.f(P.stone2, 5, 14, 1, 12); l.f(P.stone3, 3, 24, 8, 2); l.f(P.stone1, 3, 24, 8, 1);
    l.f('#3b2a30', 1, 10, 12, 5); l.f('#2a1b22', 2, 14, 10, 1); l.f('#e8501c', 2, 7, 10, 4);
    l.f('#ff8a3c', 3, 4, 8, 5); l.f('#ffd27a', 5, 2, 4, 5); l.f('#fff3c0', 6, 4, 2, 2); l.f('#ff8a3c', 6, 0, 2, 3);
    return l.outline();
  }
  function espantapajaros() { // camisa mitad azul (Lali) mitad rosa (Oli)
    const l = L(22, 32);
    l.f(P.wood3, 10, 6, 3, 26); l.f(P.woodD, 12, 6, 1, 26); l.f(P.wood3, 1, 11, 20, 3);
    l.f(BELL_B, 5, 10, 6, 11); l.f(BELL_P, 11, 10, 6, 11); l.f(BELL_BL, 5, 10, 2, 11); l.f(BELL_PS, 15, 10, 2, 11); l.f(GOLD, 10, 10, 2, 11);
    l.f(BELL_B, 1, 12, 5, 3); l.f(BELL_P, 16, 12, 5, 3);
    l.f('#e9c470', 0, 14, 3, 2); l.f('#e9c470', 19, 14, 3, 2);
    l.f(P.skin1, 7, 1, 8, 8); l.f(P.skin2, 12, 1, 3, 8);
    l.f('#e9c470', 4, 3, 14, 3); l.f('#b8903e', 4, 5, 14, 1); l.f('#e9c470', 7, 0, 8, 3); l.f(BELL_P, 7, 2, 8, 1);
    l.f(INK, 8, 6, 2, 2); l.f(INK, 12, 6, 2, 2); l.f(INK, 9, 9, 4, 1);
    return l.outline();
  }
  function cultivo(tipo) { // plantas de huerto de 8x8
    const l = L(10, 10);
    if (tipo === 0) { l.disc('#5d9e8f', 5, 6, 4); l.disc('#8fd0b8', 4, 5, 3); l.disc('#bfeadb', 3.5, 4.5, 1.8); l.disc(GR2, 5, 8, 2.5); } // col
    else if (tipo === 1) { l.f(GR2, 2, 1, 2, 6); l.f(GR, 4, 0, 2, 7); l.f(GR3, 6, 1, 2, 6); l.f(P.orange, 3, 7, 4, 3); l.f('#d4781f', 4, 9, 2, 1); } // zanahoria
    else if (tipo === 2) { l.f(P.wood3, 4, 0, 1, 10); l.f(GR2, 1, 2, 4, 6); l.f(GR, 4, 3, 4, 5); l.f(P.red, 2, 4, 3, 3); l.f(P.red, 6, 6, 3, 3); l.f(RED_L, 2, 4, 1, 1); } // tomate con tutor
    else if (tipo === 3) { l.disc(GR2, 3, 6, 2.5); l.disc(P.orange, 6, 6, 4); l.disc('#f7b45c', 5, 5, 2.5); l.f(P.wood3, 5, 1, 2, 2); l.f('#d4781f', 8, 6, 1, 3); } // calabaza
    else { l.f(GR2, 0, 4, 10, 5); l.f(GR, 1, 3, 8, 5); l.f(GR3, 2, 2, 4, 3); l.f(GR3, 5, 5, 4, 2); } // lechuga/hierbas
    return l;
  }
  function juncos(n) {
    const l = L(12, 20);
    [[2, 8, 14], [5, 4, 18], [8, 9, 12]].slice(0, n).forEach(([x, top, hh], i) => { l.f(GR2, x, top, 2, hh); l.f(GR, x, top, 1, hh); if (i !== 2) { l.f(P.brown, x, top - 2, 2, 5); l.f('#a96f46', x, top - 2, 1, 4); } });
    return l;
  }
  function nenufar(flor) {
    const l = L(10, 5);
    l.ell(GR2, 5, 2.5, 4.5, 2); l.ell(GR, 4.5, 2, 3.5, 1.4); l.f(WA, 7, 0, 3, 2);
    if (flor) { l.f(BELL_P, 3, 0, 3, 2); l.f(GOLD, 4, 1, 1, 1); }
    return l;
  }

  // ---------- puente de 50×50 (sustituye a la casilla «b»: 3×3 casillas) ----------
    const puente50 = () => { const l = L(50, 50), x0 = 1, y0 = 1, w = 48, h = 48;
    l.f(P.wood3, x0, y0, w, h);
    for (let y = 0; y < h; y += 4) { l.f(P.wood1, x0 + 5, y0 + y, w - 10, 3); l.f(P.woodD, x0 + 5, y0 + y + 3, w - 10, 1); l.f('#d9a574', x0 + 5, y0 + y, w - 10, 1); }
    [0, 1].forEach((i) => { const x = i ? x0 + w - 5 : x0; l.f(P.wood3, x, y0, 5, h); l.f(P.wood1, x, y0, 1, h); l.f(P.woodD, x + 4, y0, 1, h); });
    [2, 22, 42].forEach((y) => [0, w - 7].forEach((x) => { l.f(P.wood1, x0 + x, y0 + y, 7, 4); l.f(P.wood3, x0 + x, y0 + y + 3, 7, 1); }));
    l.outline(); l.x.clearRect(0, 0, 50, 1); l.x.clearRect(0, 49, 50, 1); return l; };

  // ---------- Huerto: parcela de tierra con surcos y 54 plantas (6 filas × 9), en una sola pieza plana (se hornea con el suelo) ----------
  function huerto() {
    const GW = 7 * T, GH = 6 * T, l = L(GW, GH);
    l.f('#7a4a2b', 0, 0, GW, GH);
    for (let r = 0; r < 6; r++) { const y = 4 + r * 15; l.f('#a96f46', 4, y, GW - 8, 2); l.f('#6b4226', 4, y + 9, GW - 8, 2); l.f('#8f5c33', 4, y + 2, GW - 8, 7); }
    for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) { const p = cultivo(r % 5); p.outline(); l.x.drawImage(p.c, 7 + c * 11, 3 + r * 15); }
    return l;
  }


  // ---------- v2.56 · paso D · VOLÚMENES PROVISIONALES (Centro PC, Tienda, Ermita del Primer Eco) ----------
  // Son bloques sencillos, sin detalle: sirven para ver el tamaño, la puerta y el camino de cada edificio en el mapa real. Los dibujos definitivos llegan con los interiores (Fase 5).
  // Mismas reglas que la casa: casilla (x, y) = esquina noroeste de la huella (cw × ch casillas); la casilla de la puerta (x+dx, y+ch-1) queda libre y quien la pisa se ve DELANTE;
  // el lienzo sobresale 17 px por arriba (tejado) y 1 px por cada lado y por abajo (contorno). Solo paleta G.PAL y la campana de dos mitades que ya existe.
  const PLINTO = (l, a, b, yb) => { l.f(P.stone2, a, yb - 5, b - a, 5); l.f(P.stone1, a, yb - 5, b - a, 1); l.f(P.stone3, a, yb - 1, b - a, 1); for (let x = a + 3; x < b; x += 8) l.f(P.stone3, x, yb - 4, 1, 2); };
  const PARED = (l, a, b, y0, y1, col, luz, som) => { l.f(col, a, y0, b - a, y1 - y0); l.f(luz, a, y0, 2, y1 - y0); l.f(som, b - 3, y0, 3, y1 - y0); };
  const VENTANA = (l, x, y, w, h) => { l.f(P.wood3, x - 1, y - 1, w + 2, h + 2); l.f('#6fa4e8', x, y, w, h); l.f(WA_L, x + 1, y + 1, 3, 2); l.f(P.wood3, x + (w >> 1), y, 1, h); l.f(P.wood3, x, y + (h >> 1), w, 1); l.f(P.woodD, x - 1, y + h + 1, w + 2, 1); };
  function PUERTA(l, a, dx, yb, hojas, col, luz, marco) { // 12 px de ancho y 16 de alto, centrada en la casilla de la puerta
    const x = a + dx * 16 + 2, y = yb - 16;
    l.f(marco, x - 1, y - 1, 14, 17); l.f(col, x, y, 12, 16); l.f(luz, x, y, 1, 16);
    if (hojas === 2) { l.f(P.woodD, x + 5, y, 2, 16); l.f(GOLD, x + 3, y + 8, 1, 2); l.f(GOLD, x + 8, y + 8, 1, 2); } else { l.f(luz, x + 2, y + 2, 8, 5); l.f(GOLD, x + 9, y + 9, 1, 2); }
    l.f(P.stone1, x - 2, yb - 1, 16, 1); // umbral
  }
  // v2.314: rótulo con el NOMBRE del edificio sobre su puerta: marco claro, cara de color y letra de píxel del juego (src/font.js); `adorno` pinta algo a cada lado (el círculo rojo del Centro PC).
  function rotulo(l, cx, fy, txt, cara, marco, borde, adorno) {
    const tw = G.pixelTextWidth(txt, 1) + (adorno ? 14 : 6), x0 = Math.round(cx - tw / 2);
    l.f(marco, x0 - 1, fy - 1, tw + 2, 12); l.f(cara, x0, fy, tw, 10); l.f(P.woodD, x0 - 1, fy + 11, tw + 2, 1);
    if (adorno) { adorno(x0 + 4, fy + 5); adorno(x0 + tw - 5, fy + 5); }
    G.drawPixelText(l.x, txt, x0 + (adorno ? 7 : 3), fy + 1, 1, '#fff9ee', borde);
  }
  function centroPC() {
    const cw = 7, ch = 5, W = cw * 16 + 2, Hh = ch * 16 + 18, l = L(W, Hh), a = 1, b = 1 + cw * 16, yb = Hh - 1, rh = 34;
    PARED(l, a, b, rh, yb, P.cream, '#fffaf0', P.cream2); l.f(P.cream2, a, rh, b - a, 3);
    // tejado plano de tejas azul verdoso con borde
    l.f(P.teal, a, 1, b - a, rh - 1); for (let y = 6; y < rh - 2; y += 5) l.f(P.teal2, a, y, b - a, 1); l.f('#7fded8', a, 1, b - a, 2); l.f(P.teal2, b - 5, 1, 5, rh - 1); l.f('#1f6065', a, rh - 3, b - a, 3);
    // letrero sobre la puerta: tablón crema con barra azul verdosa y un círculo rojo (aviso provisional)
    const cx = a + 3 * 16 + 8; rotulo(l, cx, rh - 8, 'CENTRO PC', P.teal2, P.cream, '#14484c', (x, y) => { l.disc(P.red, x, y, 3); l.f(RED_L, x - 1, y - 2, 2, 1); });
    [a + 8, a + 32, b - 26, b - 50].forEach((x) => VENTANA(l, x, rh + 10, 18, 16)); // dos y dos, con un hueco de 12 px en el centro (sobre la puerta)
    PLINTO(l, a, b, yb); PUERTA(l, a, 3, yb, 1, P.blue2, '#8fb4f0', P.stone3);
    return l.outline();
  }
  function tienda() {
    const cw = 5, ch = 4, W = cw * 16 + 2, Hh = ch * 16 + 18, l = L(W, Hh), a = 1, b = 1 + cw * 16, yb = Hh - 1, rh = 20;
    PARED(l, a, b, rh, yb, P.wood1, '#d9a574', P.wood2);
    for (let y = rh + 12; y < yb - 6; y += 6) l.f(P.wood2, a, y, b - a, 1); // tablas
    // tejado de tejas de madera
    l.f(P.wood3, a, 1, b - a, rh - 1); for (let y = 5; y < rh - 2; y += 4) { l.f(P.woodD, a, y, b - a, 1); for (let x = a + ((y >> 2) % 2) * 4; x < b; x += 8) l.f(P.woodD, x, y - 3, 1, 3); } l.f('#a8683a', a, 1, b - a, 2); l.f(P.woodD, a, rh - 3, b - a, 3);
    // toldo a rayas rojas y crema con borde festoneado
    for (let x = a; x < b; x += 8) { const cr = ((x - a) >> 3) % 2; l.f(cr ? P.cream : P.red, x, rh, 8, 9); l.f(cr ? P.cream2 : RED_S, x, rh + 6, 8, 3); l.f(cr ? P.cream : P.red, x + 2, rh + 9, 4, 2); }
    VENTANA(l, a + 7, rh + 16, 18, 14); VENTANA(l, b - 25, rh + 16, 18, 14); l.f(P.wood3, a + 6, rh + 30, 20, 3); l.f(P.wood3, b - 26, rh + 30, 20, 3); // escaparates con mostrador
    PLINTO(l, a, b, yb); PUERTA(l, a, 2, yb, 1, P.wood3, P.wood1, P.woodD);
    return l.outline();
  }
  function ermita() {
    const cw = 5, ch = 5, W = cw * 16 + 2, Hh = ch * 16 + 18, l = L(W, Hh), a = 1, b = 1 + cw * 16, yb = Hh - 1, cx = a + 40, rh = 42, SL = P.blue2, SLL = '#6f9ae0', SLD = '#2f4a8a';
    // frontón: pizarra con escamas en los bordes del tejado (v2.163) y piedra en el centro
    for (let y = 1; y < rh; y++) { const hw = 6 + Math.round(y * 34 / rh); for (let x = cx - hw; x < cx + hw; x++) { const pz = y < 5 || x < cx - hw + 5 || x >= cx + hw - 5; l.p(pz ? ((x < cx ? SLL : SL)) : (x < cx + hw - 8 ? P.stone1 : P.stone2), x, y); if (pz && y >= 5 && (y % 4 === 3 || (x + (y >> 2) * 2) % 5 === 0)) l.p(x < cx ? SL : SLD, x, y); } }
    PARED(l, a, b, rh, yb, P.stone1, '#a9a6b6', P.stone2); l.f(SL, a, rh - 2, b - a, 2); l.f(SLL, a, rh - 2, b - a, 1);
    l.f(P.stone1, a, rh, b - a, 1); l.f(P.stone2, a, rh + 1, b - a, 2); l.f(P.stone3, a, rh + 3, b - a, 1); // cornisa de piedra bajo el tejado
    for (let y = rh + 8; y < yb - 12; y += 8) { l.f(P.stone3, a, y, b - a, 1); for (let x = a + ((y - rh) >> 3) % 2 * 6 + 3; x < b - 3; x += 12) l.f(P.stone3, x, y - 7, 1, 7); } // sillares
    l.f(P.stone2, a, yb - 12, b - a, 7); l.f(P.stone1, a, yb - 12, b - a, 1); l.f(P.stone3, a, yb - 6, b - a, 1); // zócalo oscuro
    // espadaña del frontón (hueco de 22×24 centrado: lo recorta el 3D): arco de piedra, campana de dos mitades colgada de una viga y remate dorado
    l.f(P.stone3, cx - 11, 14, 22, 24); [[0, 3], [1, 2], [2, 1], [3, 1], [4, 0]].forEach(([i, w]) => { l.f(P.stone1, cx - 11 + i, 14, w, 1); l.f(P.stone1, cx + 11 - i - w, 14, w, 1); }); // esquinas redondeadas del arco
    l.f(P.ink2, cx - 9, 17, 18, 21); l.f(P.ink2, cx - 7, 16, 14, 1); l.f(P.stone2, cx - 9, 17, 18, 1); l.f(P.woodD, cx - 8, 19, 16, 2); l.f(GOLD, cx - 1, 15, 2, 2); campana(l, cx, 24, 0); l.f(P.greyD, cx - 1, 21, 2, 3);
    // dos ventanas estrechas
    [a + 10, b - 18].forEach((x) => { l.f(P.stone3, x - 1, rh + 12, 10, 21); l.f('#6fa4e8', x, rh + 13, 8, 19); l.f(WA_L, x + 1, rh + 14, 2, 3); l.f(P.stone3, x + 3, rh + 13, 1, 19); });
    PLINTO(l, a, b, yb);
    // puerta con arco de piedra, dos hojas azul pizarra con marco, ventanilla y tiradores dorados, y dos peldaños (v2.163; mismos colores que la de dentro)
    const dx = a + 2 * 16 + 2, dy = yb - 20;
    l.f(P.stone3, dx - 3, dy - 3, 18, 21); l.f(P.stone1, dx - 3, dy - 3, 18, 1); [[0, 2], [1, 1]].forEach(([i, w]) => { l.f(P.stone1, dx - 3 + i, dy - 3, w + 1, 1); l.f(P.stone2, dx - 3 + i, dy - 3, 1, 1); });
    l.f('#1f3366', dx - 1, dy - 1, 14, 19); l.f('#35559a', dx, dy, 12, 18); l.f('#35559a', dx, dy - 1, 12, 1); l.f('#6f8fcf', dx, dy, 1, 18);
    [dx + 1, dx + 7].forEach((hx) => { l.f('#4d7fd6', hx + 1, dy + 3, 3, 5); l.f('#d8f4f8', hx + 1, dy + 3, 1, 2); }); l.f(P.woodD, dx + 5, dy, 2, 18); l.f(GOLD, dx + 3, dy + 10, 1, 2); l.f(GOLD, dx + 8, dy + 10, 1, 2);
    l.f(P.stone1, dx - 4, yb - 2, 20, 2); l.f(P.stone2, dx - 5, yb - 1, 22, 1); l.f(P.stone3, dx - 5, yb, 22, 1); // peldaños
    return l.outline();
  }

  // ---------- v2.314 · DECORACIÓN SOLO 2D: rótulo de la Tienda y escalones de la Ermita ----------
  // En HD-2D estas piezas ya existen en 3D (vol.rotulo y vol.adornos); si se pintaran dentro del dibujo 2D, el HD-2D (que recorta su fachada de ese dibujo) las duplicaría. Por eso van aparte, sobre el edificio ya dibujado, y solo las pinta el 2D (game.js).
  const DECOR2D = {
    tienda: { x: 41 - 22, y: 51, w: 44, h: 13, pinta: (l) => rotulo(l, 22, 1, 'TIENDA', P.woodD, P.wood1, '#2a1408') },   // centrado sobre la puerta (columna 2), entre el escaparate y el umbral
    ermita: { x: 31, y: 92, w: 28, h: 6, pinta: (l) => {   // entradita: dos escalones de piedra (alto y estrecho; bajo y más ancho), luz arriba-izquierda; la puerta está en x 35..47
      l.f(P.stone1, 4, 0, 20, 1); l.f(P.stone2, 4, 1, 20, 2); l.f(P.stone3, 4, 3, 20, 1); l.f('#a9a6b6', 4, 0, 20, 1); l.f(P.stone3, 4, 0, 1, 4); l.f(P.stone3, 23, 0, 1, 4);
      l.f(P.stone1, 0, 3, 28, 1); l.f(P.stone2, 0, 4, 28, 1); l.f(P.stone3, 0, 5, 28, 1); } },
  };
  const decorHechos = {};
  G.decor2d = { // dibuja el adorno 2D de un edificio (o = objeto del mapa) sobre su dibujo ya pintado
    pintar(ctx, o, cam) {
      const D = DECOR2D[o.tipo], d = G.OBJETOS[o.tipo]; if (!D || !d) return;
      let c = decorHechos[o.tipo]; if (!c) { const l = L(D.w, D.h); D.pinta(l); c = decorHechos[o.tipo] = l.c; }
      ctx.drawImage(c, Math.round(o.x * 16 + d.ox - cam.x) + D.x, Math.round(o.y * 16 + d.oy - cam.y) + D.y);
    },
    tipos: Object.keys(DECOR2D),
  };

  // ---------- registro en el catálogo ----------
  // w, h: tamaño del dibujo (px). ox/oy: píxeles desde la esquina de la casilla (x, y) hasta la esquina del dibujo. pieY: de la parte de arriba de la casilla a los pies (orden de dibujo).
  // huella: casillas sólidas [dx, dy, ancho, alto] desde (x, y). Regla: los pies de lo que se sostiene solo (farolas, juncos, espantapájaros) quedan a mitad de casilla (pieY 8).
  // vol (v2.67, HD-2D): volumen 3D del edificio { muros, tejado }; ver src/volumenes.js. v2.68: estilo (texturas por cara, src/volumenes_tex.js) y fachada = [x, y, ancho, alto] de la pared sur dentro del dibujo 2D, de donde se recorta su textura. Solo lo lee el pintor HD-2D; el 2D no cambia. Una pieza sin vol sigue como lámina.
  const HUELLA_CASA = [[0, 0, 5, 4], [0, 4, 2, 1], [3, 4, 2, 1]];
  const VOL_CASA = { muros: 3.0, tejado: { tipo: 'dosaguas', cumbrera: 'eo', alto: 2.0, vuelo: 0.4 }, estilo: 'casa', fachada: [6, 52, 80, 48], chimenea: { x: 3.25, z: 1.0, w: 0.7, d: 0.7, sobre: 0.8 }, veleta: { x: 2.5, z: 2.5, poste: 0.6 } };
  // v2.82 · L3 (1.ª mitad): el laboratorio deja el tejado a dos aguas: azotea PLANA con peto de 9 px (0,5625 u, la franja del parapeto del 2D); sin chimenea ni veleta. v2.83 (L3, 2.ª mitad, parte 1): + CÚPULA de vidrio cálido (r 1,0 u) sobre un tambor turquesa de 0,6 u. Los 7 cristales y el escáner llegan después.
  // v2.84 · L3 (2.ª mitad, parte 2): los 7 cristales elementales sobre la azotea (colores de ELEM7): el eléctrico corona la cúpula (base a 4,5 u = la punta de la cúpula menos 0,1) y los otros seis forman un aro de 1,75 u alrededor de ella; alturas del 2D (9, 11 y 13 px → 0,56, 0,69 y 0,81 u), de menor a mayor hacia el frente.
  const CRISTALES_LAB = [['hoja', 240, 0.56], ['fuego', 180, 0.69], ['agua', 120, 0.81], ['aire', 60, 0.81], ['roca', 0, 0.69], ['sombra', -60, 0.56]].map(([e, a, h]) => ({ x: +(2.5 + 1.75 * Math.cos(a * Math.PI / 180)).toFixed(4), z: +(2.5 + 1.75 * Math.sin(a * Math.PI / 180)).toFixed(4), w: 0.3, h, c: ELEM7[e] })).concat([{ x: 2.5, z: 2.5, w: 0.4, h: 0.9, c: ELEM7.electrico, y: 4.5 }]);
  const VOL_LAB = { muros: 3.0, tejado: { tipo: 'plano', peto: 0.5625, grosor: 0.15 }, domo: { x: 2.5, z: 2.5, r: 1.0, base: 0.6 }, cristales: CRISTALES_LAB, escaner: { x: 4.2, z: 0.9, mastil: 0.9, r: 0.38 }, estilo: 'casa', variante: 'lab', fachada: [6, 58, 80, 48] };
  // v2.92 · F2 · la FUENTE REDONDA de DOS NIVELES en volumen (opción B de la v2.91a; sustituye a la de cajas de la v2.86): estanque de piedra de 16 caras con filete dorado (radio 1,0 u: cabe justo en el fondo de la huella 3×2, que no cambia; borde a 0,55 u y agua a 0,40 u), pedestal, taza grande azul (hasta 1,12 u), columna redonda, taza pequeña rosa (hasta 1,98 u) y campana azul con remate dorado (2,32 u en total). Las «panzas» son la parte de abajo de cada taza (se abre hacia arriba, así que la cámara no la ve: solo cierra el cuerpo); la pared que sí se ve es la de la taza. Sin chorros (las partículas del HD-2D son F3). Cada pieza: radio r0 a la altura y0 → radio r1 a la altura y1; `ri` + `agua` = recipiente con agua dentro; `rc` = radio de lo que sube por el centro (las ondas del agua nacen ahí). Ver G.volumenes (torno) y G.volTex (estilo «fuente»).
  // v2.102 · OBJETOS 3D, paso 2 · la FAROLA en volumen (ficha docs/FICHAS_OBJETOS_3D.md): torno de 12 caras para la base, el poste, el collarín y el remate; plato y cuerpo de cristal en caja; tejadillo en pirámide truncada. Alto total 2,375 u (= los 38 px del dibujo). El poste va en el centro de la casilla (los pies del 2D están a media casilla) y la huella no cambia (1×1). El poste es algo más grueso que en el 2D (0,07 u) para que no parpadee al girar. El cuerpo lleva `fijo`: el cristal no se oscurece según la cara.
  const VOL_FAROLA = { estilo: 'farola', torno: { x: 0.5, z: 0.5, lados: 12, centrado: true, luz: true, piezas: [
    { pz: 'base',     mat: 'hierro',  y0: 0,    r0: 0.16, y1: 0.25,  r1: 0.11, tapa: true },
    { pz: 'poste',    mat: 'hierro',  y0: 0.25, r0: 0.07, y1: 1.63,  r1: 0.06 },
    { pz: 'collarin', mat: 'hierroC', y0: 1.63, r0: 0.09, y1: 1.81,  r1: 0.09 },
    { pz: 'remate',   mat: 'hierroC', y0: 2.31, r0: 0.19, y1: 2.375, r1: 0.06, tapa: true } ] },
    cajas: [ { pz: 'plato', mat: 'hierro', x: 0.5, z: 0.5, w: 0.5, y0: 1.81, y1: 1.88, tapa: true }, { pz: 'cuerpo', mat: 'vidrio', x: 0.5, z: 0.5, w: 0.375, y0: 1.88, y1: 2.19, fijo: true } ],
    troncos: [ { pz: 'tejadillo', mat: 'hierro', x: 0.5, z: 0.5, w0: 0.5, w1: 0.25, y0: 2.19, y1: 2.31 } ],
    sombra: { rx: 0.30, rz: 0.17, dx: 0.10, dz: 0.12, q: 0.125, k: 0.75 } };   // paso 4: sombra de suelo en HD-2D = óvalo pequeño al 75 % (SUAVE.farola del 2D)
  const VOL_FUENTE = { estilo: 'fuente', sombra: { anillos: [[1.0, 1.18, 0.75], [1.18, 1.40, 0.35]], dx: 0.05, dz: 0.05, q: 0.125 }, torno: { x: 1.5, z: 1.0, piezas: [
    { pz: 'estanque',  mat: 'piedra',      y0: 0,    r0: 1.0,  y1: 0.55, r1: 1.0,  ri: 0.80, agua: 0.40, filete: true, rc: 0.34 },
    { pz: 'pedestal',  mat: 'piedra',      y0: 0.40, r0: 0.34, y1: 0.66, r1: 0.26 },
    { pz: 'panza1',    mat: 'azulTaza',    y0: 0.66, r0: 0.26, y1: 0.82, r1: 0.52 },
    { pz: 'taza1',     mat: 'azulTaza',    y0: 0.82, r0: 0.52, y1: 1.12, r1: 0.66, ri: 0.55, agua: 1.04, filete: true, rc: 0.12 },
    { pz: 'columna',   mat: 'piedra',      y0: 1.04, r0: 0.12, y1: 1.66, r1: 0.10 },
    { pz: 'panza2',    mat: 'rosa',        y0: 1.66, r0: 0.10, y1: 1.72, r1: 0.22 },
    { pz: 'taza2',     mat: 'rosa',        y0: 1.72, r0: 0.22, y1: 1.98, r1: 0.38, ri: 0.31, agua: 1.92, filete: true, rc: 0.10 },
    { pz: 'campana',   mat: 'azulCampana', y0: 1.92, r0: 0.17, y1: 2.20, r1: 0.07 },
    { pz: 'remate',    mat: 'oro',         y0: 2.20, r0: 0.07, y1: 2.24, r1: 0.09 },
    { pz: 'remate2',   mat: 'oro',         y0: 2.24, r0: 0.09, y1: 2.32, r1: 0.03, tapa: true } ] } };
  // v2.105 · OBJETOS 3D, BANCO, paso 2 · el BANCO en volumen con colores lisos (ficha docs/FICHA_BANCO_3D.md): 9 cajas de madera, sin torno ni muros (vol.cajas con fondo `d`). Origen en la esquina de la huella 2×1 (x a lo largo, z hacia el sur, y arriba); largo 1,625 u (26 px) centrado en x = 1,0; borde sur a z = 0,875 (los 14 de 16 px de `pieY`); alto total 1,0 u (= los 16 px del sprite). Cada caja va CENTRADA en (x, z): las medidas de la ficha (x0–x1, z0–z1) están en el comentario. El volumen mira al sur. Ninguna pieza mide menos de 0,125 u. `sombra: false`: sin sombra de suelo hasta el paso 4 (óvalo/rectángulo propio); la sombra de edificio no vale para un banco.
  const VOL_BANCO = { estilo: 'banco', sombra: { x: 1.0, z: 0.625, rw: 1.75, rd: 0.55, dx: 0.10, dz: 0.12, q: 0.125, k: 0.75 }, cajas: [
    { pz: 'pata',       mat: 'maderaOsc', x: 0.34375, z: 0.75, w: 0.1875, d: 0.125, y0: 0,      y1: 0.25 },     // delantera izquierda: x 0,25–0,4375 · z 0,6875–0,8125
    { pz: 'pata',       mat: 'maderaOsc', x: 1.65625, z: 0.75, w: 0.1875, d: 0.125, y0: 0,      y1: 0.25 },     // delantera derecha: x 1,5625–1,75
    { pz: 'pata',       mat: 'maderaOsc', x: 0.34375, z: 0.5,  w: 0.1875, d: 0.125, y0: 0,      y1: 0.25 },     // trasera izquierda: z 0,4375–0,5625 (en línea con los montantes)
    { pz: 'pata',       mat: 'maderaOsc', x: 1.65625, z: 0.5,  w: 0.1875, d: 0.125, y0: 0,      y1: 0.25 },     // trasera derecha
    { pz: 'asiento',    mat: 'madera',    x: 1.0,     z: 0.625, w: 1.625,  d: 0.5,   y0: 0.25,   y1: 0.4375, tapa: true },   // x 0,1875–1,8125 · z 0,375–0,875
    { pz: 'montante',   mat: 'maderaOsc', x: 0.375,   z: 0.5,  w: 0.125,  d: 0.125, y0: 0.4375, y1: 1.0, tapa: true },      // x 0,3125–0,4375 · 0,0625 u por delante de los listones
    { pz: 'montante',   mat: 'maderaOsc', x: 1.625,   z: 0.5,  w: 0.125,  d: 0.125, y0: 0.4375, y1: 1.0, tapa: true },      // x 1,5625–1,6875
    { pz: 'listonAlto', mat: 'madera',    x: 1.0,     z: 0.4375, w: 1.5,  d: 0.125, y0: 0.8125, y1: 0.9375, tapa: true },  // x 0,25–1,75 · z 0,375–0,5
    { pz: 'listonBajo', mat: 'madera',    x: 1.0,     z: 0.4375, w: 1.5,  d: 0.125, y0: 0.625,  y1: 0.75, tapa: true } ] };
  // v2.164 · MACETA (jardinera de piedra con flores) en 3D, pasos 1-2 de 5 (ficha en docs/FICHAS_EDIFICIOS_3D.md). El 2D mide 22×14 px y sobresale 6 px de su casilla; el volumen 3D debe caber en la huella (regla de G.volumenes), así que mide 1 × 0,5 u (16 px) y lleva 4 matas en vez de 5: es la MISMA pieza en `maceta` y `maceta_i` (el desplazamiento de 6 px solo existe en el dibujo 2D). Desde la v2.165 (paso 3) lleva `estilo: 'maceta'` y texturas propias (macetaTex en src/volumenes_tex.js).
  const VOL_MACETA = (() => { const cajas = [
    { pz: 'cuerpo', mat: 'piedra', x: 0.5, z: 0.75, w: 1.0, d: 0.5, y0: 0, y1: 0.5, tapa: true },             // piedra de la casilla entera por delante: z 0,5–1,0 (a ras del pie)
    { pz: 'hierba', mat: 'hoja', x: 0.5, z: 0.75, w: 0.875, d: 0.375, y0: 0.5, y1: 0.6875, tapa: true } ];   // seto de 14 px: asoma 3 px sobre la piedra (el 2D: y 3–7)
    ['yeso', 'rosa', 'oro', 'florAzulClara'].forEach((m, i) => { const fx = 0.125 + 0.25 * i;                    // cuatro matas a 0,25 u: x 0,125 · 0,375 · 0,625 · 0,875
      cajas.push({ pz: 'tallo', mat: 'hoja', x: fx, z: 0.75, w: 0.125, d: 0.125, y0: 0.6875, y1: 0.8125, tapa: true });
      cajas.push({ pz: 'flor', mat: m, x: fx, z: 0.75, w: 0.125, d: 0.125, y0: 0.8125, y1: 0.9375, tapa: true }); });
    return { estilo: 'maceta', sombra: { x: 0.5, z: 0.75, rw: 1.25, rd: 0.55, dx: 0.10, dz: 0.12, q: 0.125, k: 0.75 }, cajas }; })();
  const PIEZAS = {
    casa:            { w: 94, h: 108, l: () => casa('neutra'), ox: -6, oy: -20, pieY: 70, huella: HUELLA_CASA, lugar: { nombre: 'Casa', icono: '🏠', punto: [2, 4], puerta: true, color: '#a06a45' }, vol: Object.assign({}, VOL_CASA) },   // la casa NEUTRA de siempre (v2.72: ya no está en Albanota; se conserva para los mapas guardados y el pueblo de pruebas). Casilla = esquina noroeste del rectángulo 5×5; la casilla de la puerta (x+2, y+4) queda libre y quien la pisa se ve DELANTE de la casa (pies a y+70 < y+74)
    // v2.72 · paso C · las tres casas de Albanota: mismo volumen, huella y puerta; cambian postigos y flores (Lali azul, Oli rosa) y el laboratorio (pizarra azul verdosa, chimenea alta, lente, matraz)
    // v2.153: el NOMBRE del tipo es el color de la fachada (casa_lali = azul, casa_oli = rosa); el DUEÑO es el del cartel: la casa azul es de Oli y la rosa de Lali.
    casa_lali:       { w: 94, h: 108, l: () => casa('lali'), anima: humoK(1), ox: -6, oy: -20, pieY: 70, huella: HUELLA_CASA, lugar: { nombre: 'Casa de Oli', icono: '🏠', punto: [2, 4], puerta: true, color: '#4d7fd6' }, vol: Object.assign({}, VOL_CASA, { variante: 'lali' }) },   // casilla (2, 10); puerta en (4, 14)
    casa_oli:        { w: 94, h: 108, l: () => casa('oli'), anima: humoK(2), ox: -6, oy: -20, pieY: 70, huella: HUELLA_CASA, lugar: { nombre: 'Casa de Lali', icono: '🏠', punto: [2, 4], puerta: true, color: '#e47a9a' }, vol: Object.assign({}, VOL_CASA, { variante: 'oli' }) },     // casilla (11, 10); puerta en (13, 14)
    laboratorio:     { w: 94, h: 114, l: laboratorio, anima: latidoLab, ox: -6, oy: -26, pieY: 70, huella: HUELLA_CASA, lugar: { nombre: 'Laboratorio', icono: '🧪', punto: [2, 4], puerta: true, color: '#3f7681' }, vol: VOL_LAB },   // casilla (12, 22); puerta en (14, 26); 6 px más alto (la chimenea sube 10 px), por eso oy -26
    fuente:          { w: 60, h: 70, l: fuente, anima: aguaFuente, ox: -22, oy: -42, pieY: 26, huella: [[-1, 0, 3, 2]], lugar: { nombre: 'Plaza', icono: '⛲', punto: [0, 0], puerta: false, color: '#9cc4f5' }, vol: VOL_FUENTE },                              // casilla = centro de la plaza (24,18); el estanque ocupa 3×2 casillas
    banco:           { w: 26, h: 16, l: banco, ox: 3, oy: -1, pieY: 14, huella: [[0, 0, 2, 1]], vol: VOL_BANCO },
    farola:          { w: 10, h: 38, l: farola, ox: 3, oy: -30, pieY: 8, huella: [[0, 0, 1, 1]], vol: VOL_FAROLA },
    maceta:          { w: 22, h: 14, l: maceta, ox: 0, oy: 2, pieY: 16, huella: [[0, 0, 1, 1]], vol: VOL_MACETA },
    maceta_i:        { w: 22, h: 14, l: maceta, ox: -6, oy: 2, pieY: 16, huella: [[0, 0, 1, 1]], vol: VOL_MACETA },                                   // la misma jardinera, pegada al borde izquierdo de un ramal
    cartel:          { w: 56, h: 40, l: cartel, ox: -20, oy: -26, pieY: 14, huella: [[0, 0, 1, 1]] },
    cartel_carbuna:  { w: 56, h: 40, l: cartelCarbuna, ox: -20, oy: -26, pieY: 14, huella: [[0, 0, 1, 1]] },   // v2.323: señala la puerta PROVISIONAL del este (45,17-19)
    brasero_carbuna: { w: 14, h: 26, l: brasero, ox: 1, oy: -12, pieY: 14, huella: [[0, 0, 1, 1]] },
    boca_cueva:      { w: 48, h: 40, l: bocaCueva, ox: 0, oy: -8, pieY: 26, huella: [[0, 0, 3, 1], [0, 1, 1, 1], [2, 1, 1, 1]], lugar: { nombre: 'Profundidades', icono: '⛪', punto: [1, 1], puerta: true, color: '#7ff0ff' } },   // 3×2 casillas; la puerta es la casilla de abajo en el centro (x+1, y+1)
    roca:            { w: 16, h: 12, l: roca, ox: 0, oy: 4, pieY: 16, huella: [[0, 0, 1, 1]] },
    piedras:         { w: 14, h: 8, l: piedras, ox: 1, oy: 7, pieY: 16, huella: [] },
    hierba_alta:     { w: 16, h: 14, l: hierbaAlta, ox: 0, oy: 2, pieY: 16, huella: [] },
    barril:          { w: 14, h: 16, l: barril, ox: 0, oy: 0, pieY: 16, huella: [[0, 0, 1, 1]] },
    espantapajaros:  { w: 22, h: 32, l: espantapajaros, ox: -3, oy: -24, pieY: 8, huella: [[0, 0, 1, 1]] },
    valla_ni:        { w: 43, h: 14, l: () => valla(41, [0, 39]), ox: 6, oy: 4, pieY: 10, huella: [[0, 0, 3, 1]] },                // lado norte del huerto, a la izquierda de la entrada (casillas x..x+2)
    valla_nd:        { w: 43, h: 14, l: () => valla(41, [0, 39]), ox: -1, oy: 4, pieY: 10, huella: [[0, 0, 3, 1]] },               // lado norte, a la derecha de la entrada (mismo dibujo; las esquinas quedan alineadas con los lados)
    valla_9:         { w: 132, h: 14, l: () => valla(130, [0, 128]), ox: 6, oy: 0, pieY: 10, huella: [[0, 0, 9, 1]] },             // lado sur del huerto
    valla_v:         { w: 6, h: 96, l: () => vallaV(94), ox: 5, oy: 0, pieY: 96, huella: [[0, 0, 1, 6]] },                           // lados este y oeste del huerto
    juncos2:         { w: 12, h: 20, l: () => juncos(2), ox: 2, oy: -12, pieY: 8, huella: [] },
    juncos3:         { w: 12, h: 20, l: () => juncos(3), ox: 2, oy: -12, pieY: 8, huella: [] },
    nenufar:         { w: 10, h: 5, l: () => nenufar(false), ox: 3, oy: 5, pieY: 10, huella: [] },
    nenufar_flor:    { w: 10, h: 5, l: () => nenufar(true), ox: 3, oy: 5, pieY: 10, huella: [] },
    puente_albanota: { w: 50, h: 50, l: puente50, ox: -1, oy: -1, pieY: 48, huella: [], capa: 'bajo' },                             // casilla (23, 29): cubre las 3×3 casillas «b»
    huerto:          { w: 112, h: 96, l: huerto, ox: 0, oy: 0, pieY: 96, huella: [], capa: 'bajo' },                                // casilla (33, 21): 7×6 casillas
    // v2.56 · paso D · volúmenes provisionales. Huella = rectángulo cw×ch menos la casilla de la puerta (x+dx, y+ch-1). Lienzo = cw*16+2 por ch*16+18; ox -1, oy -17.
    centro_pc:       { w: 114, h: 98, l: centroPC, ox: -1, oy: -17, pieY: 70, huella: [[0, 0, 7, 4], [0, 4, 3, 1], [4, 4, 3, 1]], lugar: { nombre: 'Centro PC', icono: '🏥', punto: [3, 4], puerta: true, color: '#d9586f' }, vol: { muros: 4.0, tejado: { tipo: 'plano', peto: 0.4 }, estilo: 'centro', fachada: [1, 33, 112, 64],
      rotulo: { x: 2.21875, w: 2.5625, y: 2.3, alto: 0.6875, retiro: 0, texto: 'CENTRO PC' },   // nombre sobre la puerta, en la pared (v2.258: antes colgaba delante de la puerta y la tapaba)
      adornos: [{ x0: 2.8, x1: 4.2, y0: 0, y1: 0.06, z0: 5, z1: 5.4 }, { x0: 2.9, x1: 4.1, y0: 0.06, y1: 0.12, z0: 5, z1: 5.2 },   // dos peldaños ante la puerta
        { x0: 3, x1: 3.1, y0: 0, y1: 1.5, z0: 4, z1: 4.12 }, { x0: 3.9, x1: 4, y0: 0, y1: 1.5, z0: 4, z1: 4.12 },   // jambas de la puerta, en el fondo del nicho
        { x0: 0.44, x1: 1.69, y0: 2.18, y1: 2.26, z0: 5, z1: 5.12 }, { x0: 5.31, x1: 6.56, y0: 2.18, y1: 2.26, z0: 5, z1: 5.12 },   // alféizares de las dos ventanas
        { x0: 0.44, x1: 1.69, y0: 3.38, y1: 3.48, z0: 5, z1: 5.1 }, { x0: 5.31, x1: 6.56, y0: 3.38, y1: 3.48, z0: 5, z1: 5.1 },   // dinteles
        { x0: 0, x1: 7, y0: 3.88, y1: 4, z0: 5, z1: 5.08 }] } },   // cornisa bajo el peto   // casilla (21, 5): 7×5; puerta en (24, 9)
    tienda:          { w: 82, h: 82, l: tienda, ox: -1, oy: -17, pieY: 54, huella: [[0, 0, 5, 3], [0, 3, 2, 1], [3, 3, 2, 1]], lugar: { nombre: 'Tienda', icono: '🏪', punto: [2, 3], puerta: true, color: '#e0a040' }, vol: { muros: 2.8, tejado: { tipo: 'dosaguas', cumbrera: 'eo', alto: 1.0, vuelo: 0.3 }, estilo: 'tienda', fachada: [1, 36, 80, 45], toldo: [{ x: 0.1, w: 1.5, y: 2.8, caida: 0.45, vuelo: 0.8, retiro: 0 }, { x: 3.4, w: 1.5, y: 2.8, caida: 0.45, vuelo: 0.8, retiro: 0 }], rotulo: { x: 1.5625, w: 1.8125, y: 1.55, alto: 0.6875, retiro: 0, texto: 'TIENDA' } } },     // casilla (32, 5): 5×4; puerta en (34, 8)
    ermita:          { w: 82, h: 98, l: ermita, ox: -1, oy: -17, pieY: 70, huella: [[0, 0, 5, 4], [0, 4, 2, 1], [3, 4, 2, 1]], lugar: { nombre: 'Ermita', icono: '⛪', punto: [2, 4], puerta: true, color: '#b8b0a0' }, vol: { muros: 3.4, tejado: { tipo: 'dosaguas', cumbrera: 'ns', alto: 2.6, vuelo: 0.4 }, estilo: 'ermita', fachada: [1, 42, 80, 55], adornos: [
      { x0: 1.8, x1: 3.2, y0: 0, y1: 0.06, z0: 5, z1: 5.4 }, { x0: 1.9, x1: 3.1, y0: 0.06, y1: 0.12, z0: 5, z1: 5.2 },   // dos peldaños ante la puerta
      { x0: 2, x1: 2.1, y0: 0, y1: 1.45, z0: 4, z1: 4.12 }, { x0: 2.9, x1: 3, y0: 0, y1: 1.45, z0: 4, z1: 4.12 },   // jambas del arco (pegadas a la puerta, en el fondo del nicho)
      { x0: 2, x1: 3, y0: 1.45, y1: 1.6, z0: 4, z1: 4.12 }, { x0: 2.12, x1: 2.88, y0: 1.6, y1: 1.74, z0: 4, z1: 4.12 }, { x0: 2.34, x1: 2.66, y0: 1.74, y1: 1.88, z0: 4, z1: 4.14 },   // dintel y arco escalonado con clave
      { x0: 0.5, x1: 1.25, y0: 2.65, y1: 2.78, z0: 5, z1: 5.1 }, { x0: 0.5, x1: 1.25, y0: 1.25, y1: 1.34, z0: 5, z1: 5.14 }, { x0: 3.75, x1: 4.5, y0: 2.65, y1: 2.78, z0: 5, z1: 5.1 }, { x0: 3.75, x1: 4.5, y0: 1.25, y1: 1.34, z0: 5, z1: 5.14 },   // dinteles y alféizares de las dos ventanas
      { x0: 0, x1: 5, y0: 3.3, y1: 3.4, z0: 5, z1: 5.08 }, { x0: 1.7, x1: 3.3, y0: 3.6, y1: 3.68, z0: 5, z1: 5.14 }] } },   // cornisa a lo ancho y repisa bajo la espadaña     // casilla (41, 3): 5×5; puerta de dos hojas en (43, 7)
  };
  Object.keys(PIEZAS).forEach((tipo) => { const d = PIEZAS[tipo];
    G.capas.registrar(tipo, { w: d.w, h: d.h, ox: d.ox, oy: d.oy, pieY: d.pieY, huella: d.huella, vol: d.vol, lugar: d.lugar, capa: d.capa || 'normal', encima: false, anima: d.anima, dibujar(b) { b.drawImage(d.l().c, 0, 0); } }); });
  G.ALBANOTA_OBJETOS = Object.keys(PIEZAS);
  G.ALBANOTA_PROVISIONALES = ['centro_pc', 'tienda', 'ermita']; // nombre histórico (v2.56): el 3D de los tres edificios es definitivo desde la v2.253-v2.258; los interiores ya están hechos (Fase 5)
})(typeof window !== 'undefined' ? window : globalThis);
