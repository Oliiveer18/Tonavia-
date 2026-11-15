// escena_albanota2_objetos.js — ID-1d: coloca las piezas sobre el plano (plaza, avenidas, barrio, puente). Sin árboles.
(function () {
  'use strict';
  const E = window.__escena, Z = window.__piezas, { G, P, L, put, INK } = E, C = E.colores;
  const { WA, WA_S, WA_L, WA_D } = C;
  const T = 16;
  const at = (l, x, y, foot) => put(l, x, y, foot === undefined ? y + l.h : foot);

  // puente de 3 casillas (x 23-25, y 29-31): tablas, barandillas y postes; sin contorno en los extremos para no cortar el camino
  function puente() {
    const l = L(50, 50), x0 = 1, y0 = 1, w = 48, h = 48;
    l.f(P.wood3, x0, y0, w, h);
    for (let y = 0; y < h; y += 4) { l.f(P.wood1, x0 + 5, y0 + y, w - 10, 3); l.f(P.woodD, x0 + 5, y0 + y + 3, w - 10, 1); l.f('#d9a574', x0 + 5, y0 + y, w - 10, 1); }
    [0, 1].forEach((i) => { const x = i ? x0 + w - 5 : x0; l.f(P.wood3, x, y0, 5, h); l.f(P.wood1, x, y0, 1, h); l.f(P.woodD, x + 4, y0, 1, h); });
    [2, 22, 42].forEach((y) => [0, w - 7].forEach((x) => { l.f(P.wood1, x0 + x, y0 + y, 7, 4); l.f(P.wood3, x0 + x, y0 + y + 3, 7, 1); }));
    l.outline();
    l.x.clearRect(0, 0, 50, 1); l.x.clearRect(0, 49, 50, 1); // sin línea de contorno arriba ni abajo
    return l;
  }
  const casaEn = (tx, ty) => at(Z.casa(), tx * T - 6, (ty + 5) * T - 100, (ty + 5) * T + 2); // pared de 5×3 casillas; puerta en tx+2, fila ty+4
  const farola = (cx, foot) => at(Z.farola(), cx - 5, foot - 38, foot);
  const persona = (nombre, dir, f, x, y) => { const s = G.spr[`${G.NAMES[nombre]}_${dir}_${f}`]; put({ c: s.c, w: s.w, h: s.h }, x - s.w / 2, y - s.h + 2, y); };

  // --- arroyo: puente, juncos y nenúfares ---
  at(puente(), 367, 463, 463 + 50);
  [[40, 0], [150, 1], [212, 2], [300, 0], [330, 2], [440, 1], [480, 0]].forEach(([x, n]) => at(Z.juncos(n === 2 ? 3 : 2), x, 456, 472));
  [[70, 484, 1], [196, 488, 0], [290, 482, 1], [450, 487, 0], [104, 490, 0]].forEach(([x, y, f]) => at(Z.nenufar(!!f), x, y, y + 5));

  // --- plaza del Cascabel: fuente con campana, bancos al norte, jardineras al sur, 8 farolas (2 por entrada) ---
  at(Z.fuente(), E.FX - 30, E.FY - 50, E.FY + 18);
  at(Z.banco(), 332, 250); at(Z.banco(), 428, 250);
  at(Z.maceta(), 326, 332); at(Z.maceta(), 436, 332);
  [360, 424].forEach((x) => { farola(x, 239); farola(x, 356); });   // norte y sur
  [312, 472].forEach((x) => { farola(x, 270); farola(x, 340); });   // oeste y este
  [360, 424].forEach((x) => farola(x, 410));                        // par de farolas en la avenida sur
  at(Z.cartel(), 296, 356, 390);                                    // cartel de caminos, junto al cruce sur

  // --- barrio: Casa de Lali (2,10) y Casa de Oli (11,10), puertas al sur, ramales de 3 casillas ---
  casaEn(2, 10); casaEn(11, 10);
  [[26, 96], [170, 240]].forEach(([a, b]) => { at(Z.maceta(), a, 242, 256); at(Z.maceta(), b, 242, 256); });
  at(Z.banco(), 131, 255, 270); farola(120, 270); farola(166, 270);
  // laboratorio (provisional: la misma casa; el plano pide 6×5)
  casaEn(8, 22);

  window.__vista = (x0, y0, zoom) => {
    const ctx = E.ctx, VW = Math.ceil(390 / zoom), VH = Math.ceil(844 / zoom);
    E.items.sort((a, b) => a.foot - b.foot);
    E.items.forEach((it) => ctx.drawImage(it.l.c, Math.round(it.x), Math.round(it.y)));
    E.items.length = 0;
    const out = document.createElement('canvas'); out.width = 390; out.height = 844;
    const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
    o.drawImage(E.cv, x0, y0, VW, VH, 0, 0, VW * zoom, VH * zoom);
    return out.toDataURL('image/png');
  };
  window.__persona = persona;
})();
