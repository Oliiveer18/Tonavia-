// escena_albanota_piezas.js — piezas dibujadas (casa, fuente, campana, banco, farola...) sin colocar; las usa escena_albanota2.js (ID-1d).
(function () {
  'use strict';
  const E = window.__escena, { G, P, L, put, items, INK, hash } = E, C = E.colores, ctx = E.ctx;
  const { GR, GR2, GR3, PI, PI2, PI3, WA, WA_S, WA_L, WA_D, BELL_B, BELL_BL, BELL_P, BELL_PS, GOLD, GOLD_S } = C;
  const RED = P.red, RED_S = P.red2, RED_L = '#ea6a58';

  // ---------- campana de dos mitades (emblema de Albanota) ----------
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

  // ---------- árboles ----------
  function lobulo(l, cx, cy, r, c) { l.disc(c.dark, cx, cy, r); l.disc(c.base, cx - 2, cy - 2, r - 2); if (r >= 7) l.disc(c.light, cx - 3.5, cy - 3.5, r - 5); }
  function tronco(l, x, y0, y1, w) {
    l.f(P.wood3, x, y0, w, y1 - y0); l.f(P.woodD, x + w - 3, y0, 3, y1 - y0); l.f(P.wood1, x, y0, 1, y1 - y0);
    l.f(P.wood3, x - 2, y1 - 2, w + 4, 2); l.f(P.woodD, x + w, y1 - 2, 2, 2); l.f(P.wood1, x - 2, y1 - 2, 1, 1);
  }
  function roble(tam) { // 0 grande · 1 mediano
    const l = tam ? L(34, 44) : L(48, 58), c = { dark: GR2, base: GR, light: GR3 };
    if (!tam) { tronco(l, 20, 34, 56, 8); [[24, 10, 8], [16, 14, 9], [32, 14, 9], [11, 26, 9], [37, 26, 9], [24, 20, 12], [17, 30, 8], [31, 30, 8], [24, 33, 8]].forEach(([x, y, r]) => lobulo(l, x, y, r, c)); }
    else { tronco(l, 14, 26, 42, 6); [[17, 8, 7], [10, 12, 7], [24, 12, 7], [8, 22, 7], [26, 22, 7], [17, 17, 9], [12, 26, 6], [22, 26, 6]].forEach(([x, y, r]) => lobulo(l, x, y, r, c)); }
    return l.outline();
  }
  function pino(alto) { // abeto de tres/cuatro pisos, luz a la izquierda
    const tiers = alto ? 4 : 3, th = 11, w = 26, h = tiers * 9 + th - 4 + 8, l = L(w, h), cx = 13;
    l.f(P.wood3, cx - 2, h - 8, 4, 8); l.f(P.woodD, cx, h - 8, 2, 8);
    for (let t = 0; t < tiers; t++) {
      const y0 = t * 9, mw = 5 + t * 3 + (alto ? 0 : 2);
      for (let r = 0; r < th; r++) {
        const hw = 1 + Math.round(r * mw / th) + (r === th - 1 ? 0 : 0), y = y0 + r, jag = (r >= th - 2 ? ((r % 2) ? 0 : 1) : 0);
        for (let x = cx - hw - jag; x < cx + hw + jag; x++) { const lit = x < cx - 1; l.p(lit ? (x < cx - hw + 1 && r > 1 ? PI3 : PI) : PI2, x, y); }
      }
    }
    return l.outline();
  }
  function arbusto(flor) {
    const l = L(26, 18), c = { dark: GR2, base: GR, light: GR3 };
    [[13, 7, 6], [7, 11, 6], [19, 11, 6], [13, 12, 6]].forEach(([x, y, r]) => lobulo(l, x, y, r, c));
    if (flor) [[8, 6], [14, 4], [11, 11], [18, 9], [5, 11]].forEach(([x, y], i) => { l.f(i % 2 ? BELL_PS : '#fff9ee', x, y, 2, 2); l.f(GOLD, x, y, 1, 1); });
    return l.outline();
  }

  // ---------- casa (5 casillas de ancho, tejado de 2 de alto, paredes de 3) ----------
  function casa() {
    const w = 94, rt = 20, rb = rt + 32, wb = rb + 48, h = wb + 8, l = L(w, h), cx = 46;
    const roofHw = (y) => 24 + Math.round((y - rt) * 20 / 31);
    // chimenea (detrás del tejado)
    l.f(P.stone2, 58, rt - 9, 10, 26); l.f(P.stone1, 58, rt - 9, 2, 26); l.f(P.stone3, 66, rt - 9, 2, 26);
    for (let y = rt - 6; y < rt + 12; y += 4) l.f(P.stone3, 60, y, 6, 1);
    l.f(P.stone1, 56, rt - 12, 14, 3); l.f(P.stone3, 56, rt - 9, 14, 1); l.f(P.stone2, 62, rt - 12, 2, 3);
    // tejado: escamas por bandas
    for (let y = rt; y < rb; y++) {
      const hw = roofHw(y), x0 = cx - hw, x1 = cx + hw, k = ((y - rt) / 4) | 0, ly = (y - rt) % 4, off = (k % 2) * 4;
      for (let x = x0; x < x1; x++) {
        const lx = (x - (cx - 44) + off) % 8; let col = x >= x1 - 4 ? RED_S : RED;
        if (ly === 3 && lx !== 0) col = x >= x1 - 4 ? C.GR && '#7c2a28' : RED_S;
        else if (lx === 7) col = x >= x1 - 4 ? '#7c2a28' : RED_S;
        else if (ly === 0 && x < cx - 2 && lx < 7) col = RED_L;
        l.p(col, x, y);
      }
    }
    l.f('#7c2a28', cx - 24, rt, 48, 1); l.f(RED_L, cx - 24, rt - 1, 47, 1); l.f(RED_S, cx - 23, rt - 3, 47, 2); l.f(RED_L, cx - 23, rt - 3, 45, 1); // cumbrera
    l.f(P.wood3, cx - 44, rb - 2, 88, 2); l.f(P.woodD, cx - 44, rb - 1, 88, 1); // alero
    // ventana redonda del desván
    l.disc(P.wood3, cx, rt + 16, 5.5); l.disc('#6fa4e8', cx, rt + 16, 3.8); l.f(P.wood3, cx - 4, rt + 16, 8, 1); l.f(P.wood3, cx, rt + 12, 1, 8); l.f(WA_L, cx - 3, rt + 13, 2, 2);
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
      l.f(P.teal2, vx - 11, gy - 1, 4, 14); l.f(P.teal2, vx + 7, gy - 1, 4, 14); l.f('#1f6065', vx - 10, gy + 2, 2, 1); l.f('#1f6065', vx - 10, gy + 6, 2, 1); l.f('#1f6065', vx + 8, gy + 2, 2, 1); l.f('#1f6065', vx + 8, gy + 6, 2, 1);
      l.f(P.teal, vx - 11, gy - 1, 1, 14);
      l.f(P.wood3, vx - 7, gy - 2, 14, 14); l.f('#6fa4e8', vx - 6, gy - 1, 12, 12); l.f(WA_L, vx - 6, gy - 1, 3, 4); l.f(WA, vx + 2, gy + 6, 4, 5);
      l.f(P.wood3, vx - 1, gy - 1, 1, 12); l.f(P.wood3, vx - 6, gy + 4, 12, 1);
      l.f(P.wood3, vx - 8, gy + 11, 16, 5); l.f(P.woodD, vx - 8, gy + 14, 16, 2); l.f(P.wood1, vx - 8, gy + 11, 16, 1);
      l.f(GR2, vx - 7, gy + 8, 14, 3);
      [-6, -2, 2, 5].forEach((dx, i) => { l.f(GR, vx + dx - 1, gy + 8, 3, 3); l.f(i % 2 ? BELL_P : GOLD, vx + dx - 1, gy + 6, 2, 2); });
    });
    // puerta de madera con arco, cartel de la campana y farol
    const dx0 = 38, dx1 = 54, dy0 = wb - 32;
    l.f(P.woodD, dx0 - 1, dy0 - 1, dx1 - dx0 + 2, 33); l.f(P.brown, dx0, dy0, dx1 - dx0, 32);
    for (let x = dx0 + 2; x < dx1; x += 4) l.f('#6b4226', x, dy0 + 2, 1, 30); l.f(P.wood3, dx0, dy0 + 2, 2, 30);
    l.f(P.woodD, dx0, dy0 + 10, dx1 - dx0, 2); l.f(P.woodD, dx0, dy0 + 24, dx1 - dx0, 2);
    l.f(P.woodD, dx0, dy0, 2, 1); l.f(P.woodD, dx1 - 2, dy0, 2, 1);
    l.f(GOLD, dx1 - 5, dy0 + 16, 2, 3); l.f(GOLD_S, dx1 - 5, dy0 + 18, 2, 1);
    l.f(P.wood1, 39, rb + 9, 14, 8); l.f(P.wood3, 39, rb + 15, 14, 2); l.f(P.woodD, 38, rb + 7, 2, 2); l.f(P.woodD, 52, rb + 7, 2, 2); // cartel colgado
    campana(l, 46, rb + 9, 0); l.f('#7c2a28', 0, 0, 0, 0);
    l.f(P.greyD, 61, rb + 16, 2, 2); l.f(P.ink2, 60, rb + 18, 4, 5); l.f(GOLD, 61, rb + 19, 2, 3); // farol
    // escalones
    l.f(P.stone1, 36, wb, 20, 3); l.f(P.stone3, 36, wb + 2, 20, 1); l.f(P.stone1, 33, wb + 3, 26, 3); l.f(P.stone3, 33, wb + 5, 26, 1);
    return l.outline();
  }

  // ---------- valla de madera ----------
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

  // ---------- fuente del cascabel ----------
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

  // ---------- banco (visto de frente) ----------
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
  function barril() {
    const l = L(14, 16);
    l.f(P.wood3, 1, 1, 12, 14); l.f(P.wood1, 1, 1, 3, 14); l.f(P.woodD, 10, 1, 3, 14);
    l.f(P.greyD, 0, 4, 14, 2); l.f(P.greyD, 0, 11, 14, 2); l.f(P.grey2, 1, 4, 12, 1); l.f(P.grey2, 1, 11, 12, 1);
    l.f(WA_S, 2, 1, 10, 2); l.f(WA, 2, 1, 7, 1);
    return l.outline();
  }
  function cartel() { // poste con tres flechas
    const l = L(34, 34);
    l.f(P.wood3, 14, 6, 5, 28); l.f(P.wood1, 14, 6, 1, 28); l.f(P.woodD, 18, 6, 1, 28);
    const tab = (y, x, w, dir, col) => { l.f(P.wood1, x, y, w, 8); l.f(P.wood3, x, y + 6, w, 2); for (let i = 0; i < 4; i++) l.f(P.wood1, dir > 0 ? x + w + i : x - 1 - i, y + i, 1, 8 - 2 * i); l.f(col, x + 3, y + 2, w - 6, 3); };
    tab(2, 3, 22, 1, BELL_P); tab(12, 8, 20, -1, BELL_B);
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
  function puente() { // cruza el arroyo de norte a sur (tablas horizontales)
    const w = 30, h = 46, l = L(w, h);
    l.f(WA_D, 3, 33, 24, 6); // sombra bajo el puente, sobre el agua
    l.f(P.wood3, 3, 0, 24, h - 6);
    for (let y = 0; y < h - 6; y += 4) { l.f(P.wood1, 3, y, 24, 3); l.f(P.woodD, 3, y + 3, 24, 1); l.f('#d9a574', 3, y, 24, 1); }
    l.f(P.woodD, 3, 0, 2, h - 6); l.f(P.woodD, 25, 0, 2, h - 6);
    [0, 1].forEach((i) => { const x = i ? 25 : 0; l.f(P.wood3, x, 0, 5, h - 4); l.f(P.wood1, x, 0, 1, h - 4); l.f(P.woodD, x + 4, 0, 1, h - 4); });
    [2, 18, 36].forEach((y) => [0, 25].forEach((x) => { l.f(P.wood1, x - 1, y, 7, 4); l.f(P.wood3, x - 1, y + 3, 7, 1); }));
    return l.outline();
  }
  function mantillo(w) { return null; }


  function mata() { const l = L(10, 6); l.disc(GR2, 3, 3.5, 2.8); l.disc(GR2, 7, 3.5, 2.8); l.disc(GR, 2.5, 3, 1.8); l.disc(GR, 6.5, 3, 1.8); l.f(GR3, 2, 2, 2, 1); l.f(GR3, 6, 2, 2, 1); return l; }
  function flores() { const l = L(14, 9); [[1, 3, BELL_P], [6, 1, '#fff9ee'], [10, 4, GOLD]].forEach(([x, y, c]) => { l.f(GR2, x + 1, y + 3, 1, 4); l.f(GR, x - 1, y + 4, 2, 2); l.f(GR, x + 2, y + 5, 2, 2); l.f(c, x, y, 3, 3); l.f(GOLD_S, x + 1, y + 1, 1, 1); }); return l; }

  window.__piezas = { campana, casa, valla, vallaV, fuente, banco, farola, maceta, barril, cartel, juncos, nenufar, puente, mata, flores };
})();
