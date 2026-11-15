// objetos de la PROPUESTA (copia de trabajo; no toca el proyecto)
(function () {
  'use strict';
  const E = window.__escena, Z = window.__piezas, { G, P, L, put, INK } = E, C = E.colores;
  const T = 16;
  const at = (l, x, y, foot) => put(l, x, y, foot === undefined ? y + l.h : foot);
  const puente = () => { const l = L(50, 50), x0 = 1, y0 = 1, w = 48, h = 48;
    l.f(P.wood3, x0, y0, w, h);
    for (let y = 0; y < h; y += 4) { l.f(P.wood1, x0 + 5, y0 + y, w - 10, 3); l.f(P.woodD, x0 + 5, y0 + y + 3, w - 10, 1); l.f('#d9a574', x0 + 5, y0 + y, w - 10, 1); }
    [0, 1].forEach((i) => { const x = i ? x0 + w - 5 : x0; l.f(P.wood3, x, y0, 5, h); l.f(P.wood1, x, y0, 1, h); l.f(P.woodD, x + 4, y0, 1, h); });
    [2, 22, 42].forEach((y) => [0, w - 7].forEach((x) => { l.f(P.wood1, x0 + x, y0 + y, 7, 4); l.f(P.wood3, x0 + x, y0 + y + 3, 7, 1); }));
    l.outline(); l.x.clearRect(0, 0, 50, 1); l.x.clearRect(0, 49, 50, 1); return l; };
  const casaEn = (tx, ty) => at(Z.casa(), tx * T - 6, (ty + 5) * T - 100, (ty + 5) * T + 2);
  const farola = (cx, foot) => at(Z.farola(), cx - 5, foot - 38, foot);
  // volumen provisional (sin sprite todavía): pared + tejado liso, sin inventar detalles
  function bloque(tx, ty, w, h, doorCol, nombre) {
    const pw = w * T, ph = h * T, l = L(pw, ph), rt = Math.round(ph * 0.42);
    l.f('#c0524a', 0, 0, pw, rt); l.f('#8f3a38', 0, rt - 3, pw, 3); l.f('#d96a5f', 0, 0, pw, 2);
    l.f('#f2e2c0', 0, rt, pw, ph - rt); l.f('#c9b78f', 0, ph - 4, pw, 4);
    const dx = (doorCol - tx) * T + 2; l.f('#2a1a24', dx, ph - 22, 12, 22); l.f('#f7d54a', dx + 9, ph - 11, 1, 2);
    l.outline(); at(l, tx * T, ty * T, (ty + h) * T);
  }
  // puente + juncos (fuera de los caminos) + nenúfares
  at(puente(), 367, 463, 513);
  [40, 100, 160, 432, 474, 560, 640, 720].forEach((x, i) => at(Z.juncos(i % 3 === 2 ? 3 : 2), x, 456, 472));
  [[70, 484, 1], [196, 488, 0], [290, 482, 1], [450, 487, 0], [104, 490, 0], [330, 490, 1], [560, 486, 1], [640, 484, 0], [700, 490, 1]].forEach(([x, y, f]) => at(Z.nenufar(!!f), x, y, y + 5));
  // plaza
  at(Z.fuente(), E.FX - 30, E.FY - 50, E.FY + 18);
  at(Z.banco(), 332, 250); at(Z.banco(), 428, 250);
  at(Z.maceta(), 326, 332); at(Z.maceta(), 436, 332);
  [360, 424].forEach((x) => { farola(x, 239); farola(x, 356); farola(x, 424); });
  [312, 472].forEach((x) => { farola(x, 270); farola(x, 322); });      // simétricas respecto a la avenida (±26)
  at(Z.cartel(), 316, 396, 430);                                        // cartel en el cruce con el sendero del laboratorio
  // barrio
  casaEn(2, 10); casaEn(11, 10);
  [[26, 96], [170, 240]].forEach(([a, b]) => { at(Z.maceta(), a, 242, 256); at(Z.maceta(), b, 242, 256); });
  at(Z.banco(), 131, 255, 270); farola(120, 270); farola(166, 270);
  // laboratorio: columna de la puerta de Oli (col. 13)
  casaEn(11, 22);
  // volúmenes provisionales del plano aprobado
  bloque(21, 5, 7, 5, 24, 'Centro PC'); bloque(32, 5, 5, 4, 34, 'Tienda'); bloque(41, 3, 5, 5, 43, 'Ermita');
  // huertos con piezas ya existentes: parcela, valla con hueco en la entrada, surcos y espantapájaros
  const GX0 = 33 * T, GY0 = 21 * T, GW = 7 * T, GH = 6 * T;
  const parcela = L(GW, GH); parcela.f('#7a4a2b', 0, 0, GW, GH);
  for (let r = 0; r < 6; r++) { const y = 4 + r * 15; parcela.f('#a96f46', 4, y, GW - 8, 2); parcela.f('#6b4226', 4, y + 9, GW - 8, 2); parcela.f('#8f5c33', 4, y + 2, GW - 8, 7); }
  E.ctx.drawImage(parcela.c, GX0, GY0);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) { const l = Z.cultivo(r % 5); l.outline(); const x = GX0 + 7 + c * 11, y = GY0 + 3 + r * 15; put(l, x, y, y + 11); }
  at(Z.espantapajaros(), GX0 + GW / 2 - 11, GY0 + 40, GY0 + 72);
  at(Z.vallaV(GH - 6), GX0 - 4, GY0 - 2, GY0 + GH + 6); at(Z.vallaV(GH - 6), GX0 + GW - 2, GY0 - 2, GY0 + GH + 6);
  at(Z.valla(32, [0, 30]), GX0 - 4, GY0 - 12, GY0 - 6); at(Z.valla(32, [0, 30]), GX0 + 80, GY0 - 12, GY0 - 6);  // hueco x 560-608 = ramal
  at(Z.valla(GW + 4, [0, GW + 2]), GX0 - 4, GY0 + GH, GY0 + GH + 10);
  at(Z.barril(), GX0 + GW + 6, GY0 + 6);

  window.__render = () => { const ctx = E.ctx; E.items.sort((a, b) => a.foot - b.foot);
    E.items.forEach((it) => ctx.drawImage(it.l.c, Math.round(it.x), Math.round(it.y))); E.items.length = 0; return E.cv.toDataURL('image/png'); };
})();
