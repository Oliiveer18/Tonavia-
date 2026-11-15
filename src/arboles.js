// arboles.js — CATÁLOGO DE ÁRBOLES (v2.34, aprobado por el usuario el 3 nov con la hoja `docs/arboles_final_cuatro.png`). Solo dibujo: sin estado de partida ni Math.random.
// Cuatro piezas del catálogo de G.capas (se registran aquí; NO se colocan en ningún mapa todavía: llegan con ID-3):
//   arbol_pequeno 16×16 (el árbol de casilla de siempre) · arbol_mediano 16×24 (misma copa, más alta) · abeto 16×32 (copa cónica, un verde más oscuro) · roble_hito 28×40 (copa de lóbulos; UNO por zona)
// Todos: UN solo diseño (sin variantes: decisión del usuario), mismo sombreado y paleta que el árbol de casilla (G.sombreado.COL: copa en 5 tonos con luz arriba-izquierda,
// contorno claro arriba-izquierda y oscuro abajo-derecha, tronco con luz a la izquierda), huella de 1 casilla (solo el tronco bloquea) y los pies en la parte baja de la casilla (x, y).
// Todo el árbol (tronco y copa) va en la capa «normal»: se ordena por la Y de sus pies con jugadores y criaturas, así quien está al norte queda tapado por la copa y quien está al sur pasa por delante.
(function (root) {
  'use strict';
  const G = root.G, T = 16;
  const hash = (a, b, k) => { let h = (a * 374761393 + b * 668265263 + k * 2147483647) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
  const elipses = (L, X, Y) => L.some(([cx, cy, rx, ry]) => Math.pow(Math.abs((X + 0.5 - cx) / rx), 2.6) + Math.pow(Math.abs((Y + 0.5 - cy) / ry), 2.6) <= 1);
  const pisos = (L, X, Y) => L.some(([top, h, hw, cx]) => Y >= top && Y < top + h && Math.abs(X + 0.5 - cx) <= Math.max(1.2, hw * (Y - top + 1) / h)); // abeto: triángulos apilados [arriba, alto, medio ancho abajo, centro]
  // Copa del árbol de casilla (octógono escalonado) para un w×h
  const octogono = (w, h) => { const k = w / 16, i1 = Math.round(k), i2 = Math.round(2 * k), i3 = Math.round(4 * k), y1 = Math.round(2 * k), y2 = Math.round(k);
    return (X, Y) => (X >= i1 && X <= w - 1 - i1 && Y >= y1 && Y <= h - 1) || (X >= i2 && X <= w - 1 - i2 && Y >= y2 && Y <= h - 2) || (X >= i3 && X <= w - 1 - i3 && Y >= 0 && Y <= y1 - 1); };

  function copa(c, ox, oy, w, h, dentro, semilla, oscura) { // 5 tonos con luz arriba-izquierda; borde claro arriba-izquierda y oscuro abajo-derecha
    const C = G.sombreado.COL.copa, ins = (X, Y) => X >= 0 && Y >= 0 && X < w && Y < h && dentro(X, Y), r = (col, X, Y) => { c.fillStyle = col; c.fillRect(ox + X, oy + Y, 1, 1); };
    for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
      if (!ins(X, Y)) continue;
      if (!ins(X + 1, Y) || !ins(X, Y + 1)) { r(oscura ? C.c0 : C.sombra, X, Y); continue; }
      if (!ins(X - 1, Y) || !ins(X, Y - 1)) { r(oscura ? C.c1 : C.luz, X, Y); continue; }
      const t = ((X - w / 2) * -0.62 + (Y - h / 2) * -0.78) / (Math.max(w, h) / 2), v = t + (hash(X >> 1, Y >> 1, semilla) / 4294967295) * 0.22 - 0.1 - (oscura ? 0.28 : 0) + (ins(X, Y + 2) ? 0 : -0.25);
      r(v > 0.52 ? C.c4 : v > 0.2 ? C.c3 : v < -0.55 ? C.c0 : v < -0.18 ? C.c1 : C.c2, X, Y);
    }
  }
  function tronco(c, cx, base, alto, ancho, raices) { // luz a la izquierda, sombra a la derecha, pie oscuro
    const R = G.sombreado.COL.tronco, a = Math.round(cx - ancho / 2), f = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    f(R.luz, a, base - alto, 1, alto); f(R.base, a + 1, base - alto, ancho - 2, alto); f(R.sombra, a + ancho - 1, base - alto, 1, alto); f(R.sombra, a - 1, base - 1, 1, 1); f(R.sombra, a + ancho, base - 1, 1, 1);
    if (raices) { f(R.base, a - 2, base - 1, 1, 1); f(R.sombra, a + ancho + 1, base - 1, 1, 1); }
  }

  // Medidas de cada pieza (px): w×h del dibujo; los pies quedan en la parte baja de la casilla (x, y): ox + w/2 = 8 y oy + h = 16.
  const ARBOLES = {
    // v2.251 (pedido del usuario: un árbol siempre es más grande que una persona; Oli mide 24 px): pequeño 28×40 (1,6× Oli), mediano 36×54 (2,25×), abeto 32×68 (2,8×), roble 64×88 (3,7×)
    arbol_pequeno: { w: 28, h: 40, dibujar(b) { tronco(b, 14, 40, 14, 5); copa(b, 0, 0, 28, 28, octogono(28, 28), 3, false); } },
    arbol_mediano: { w: 36, h: 54, dibujar(b) { tronco(b, 18, 54, 18, 6); copa(b, 0, 0, 36, 38, octogono(36, 38), 3, false); } },
    abeto: { w: 32, h: 68, dibujar(b) { tronco(b, 16, 68, 14, 4); copa(b, 1, 0, 30, 58, (X, Y) => pisos([[0, 21, 9.9, 15], [15, 24, 13.3, 15], [32, 26, 15, 15]], X, Y), 21, true); } },
    roble_hito: { w: 64, h: 88, dibujar(b) { tronco(b, 32, 88, 26, 10, true); copa(b, 2, 0, 60, 66, (X, Y) => Math.pow((X + 0.5 - 30) / 29.8, 2) + Math.pow((Y + 0.5 - 33) / 32.8, 2) <= 1, 41, false); } },
  };
  Object.keys(ARBOLES).forEach((tipo) => { const d = ARBOLES[tipo];
    G.capas.registrar(tipo, { w: d.w, h: d.h, ox: 8 - d.w / 2, oy: T - d.h, pieY: T, huella: [[0, 0, 1, 1]], capa: 'normal', encima: false, dibujar: d.dibujar }); });
  G.ARBOLES = Object.keys(ARBOLES); // lista para pruebas y herramientas
})(typeof window !== 'undefined' ? window : globalThis);
