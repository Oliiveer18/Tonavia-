// particulas.js — PARTÍCULAS DEL 2D (ID-2b-4, v2.90). Humo de las chimeneas, gotas y salpicaduras de la Fuente, destellos en el agua y hojas que caen de los árboles del borde.
// Función PURA del cuadro del reloj visual (4 por segundo, como el agua y el viento): sin estado, sin DOM y sin Math.random (hash fijo, como el viento). Dos móviles ven lo mismo y se puede probar sin navegador.
// Reglas (docs/CONTINUAR.md, trampas): destellos SOLO sobre agua y lejos de la orilla; sin espuma; nada de sombras junto a árboles; nada que quede en el suelo (las hojas se encogen en el aire).
// Solo en mapas con animar: true. Se apaga con ?particulas=0, con ?movimiento=0 / «menos movimiento» (G.capas.REDUCIDO) o con G.particulas.AJUSTES.ACTIVO = false.
// Cada efecto devuelve píxeles [x, y, color] RELATIVOS a su punto de anclaje; el dibujo (fillRect de 1×1) es lo único que toca el lienzo. El HD-2D todavía NO las usa (v2.91).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  const OFF = (() => { try { return typeof location !== 'undefined' && /[?&]particulas=0/.test(location.search || ''); } catch (e) { return false; } })();
  // MAX_* = tope de partículas a la vez en la vista (destellos y hojas); el resto son cantidades fijas por pieza (humo 4 por chimenea, 8 gotas y 2 salpicaduras en la fuente)
  const AJUSTES = { ACTIVO: !OFF, HZ: 4, MAX_DESTELLOS: 6, MAX_HOJAS: 6 };
  const hv = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; }; // mismo hash que el viento
  const COL = {
    humo: ['#cfc8d0', '#a59ca8'],            // cuerpo y sombra (gris cálido; nunca blanco puro)
    brillo: '#d3e8ff', chispa: '#f4f9ff',     // el brillo del agua de las olas y un punto más claro para el centro del destello
    hojas: [['#5dae5a', '#3d8446'], ['#7cc972', '#4f9a52']] // verdes del árbol de casilla (cara clara y cara oscura)
  };
  const cuadro = () => (G.capas && !G.capas.REDUCIDO ? Math.floor(G.capas.reloj * AJUSTES.HZ) : 0);
  const activo = (m) => !!(AJUSTES.ACTIVO && m && m.animar && G.capas && !G.capas.REDUCIDO);

  // ── 1 · Humo (chimenea) ── 4 bocanadas por chimenea, una cada 4 cuadros (ciclo de 16 = 4 s). Suben ~14 px y se desvían a la derecha (como las ráfagas); crecen y se deshacen en 5 poses sin transparencia.
  // Origen (0, 0) = la boca de la chimenea. k = nº de chimenea (cambia el desfase y el vaivén) para que dos chimeneas no vayan acompasadas.
  const CICLO_HUMO = 16, PUFFS = 4;
  const FORMAS = [ // [x, y, tono] 0 = cuerpo, 1 = sombra (abajo-derecha)
    [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 1]],                                                 // 0 · pequeña 2×2
    [[1, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 1], [1, 2, 1]],                                      // 1 · mediana (cruz de 3×3)
    [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 1], [0, 2, 0], [1, 2, 1], [2, 2, 1]], // 2 · grande 3×3
    [[0, 0, 0], [1, 1, 1]],                                                                       // 3 · se deshace (tramado)
    [[0, 0, 0]]                                                                                   // 4 · última pizca
  ];
  const poseHumo = (a) => (a < 3 ? 0 : a < 7 ? 1 : a < 11 ? 2 : a < 13 ? 3 : a < 15 ? 4 : -1);
  function humo(n, k) {
    const out = [];
    for (let j = 0; j < PUFFS; j++) {
      const a0 = n + (k || 0) * 5 + j * 4, a = a0 % CICLO_HUMO, ciclo = Math.floor(a0 / CICLO_HUMO), p = poseHumo(a); if (p < 0) continue;
      const vaiven = (hv((k || 0) * 17 + j, ciclo + 101) % 3) - 1;               // -1, 0 o 1 px de lado, fijo para cada bocanada
      const dx = Math.floor(a * 0.45) + (a >= 4 ? vaiven : 0), dy = -Math.round(a * 0.9);
      const ox = dx - (p >= 2 ? 1 : p === 1 ? 1 : 0), oy = dy - (p >= 2 ? 2 : p === 1 ? 2 : p === 0 ? 1 : 0); // la bocanada crece desde su centro
      FORMAS[p].forEach(([x, y, t]) => out.push([ox + x, oy + y, COL.humo[t]]));
    }
    return out;
  }

  // ── 2 · Fuente ── Coordenadas del dibujo de la fuente (60×70; cx 30, by 50). Las gotas bajan por los dos arcos que ya están dibujados (no hay chorro central: la campana lo taparía) y salpican en el estanque.
  // Estanque = elipse de agua (cx 30, by+2 = 52, radios 18 × 7); los píxeles de agua solo se pintan dentro (se comprueba con enAgua). 8 gotas (4 por arco) y 2 salpicaduras.
  const F = { cx: 30, by: 50, ax: 30, ay: 52, rx: 18, ry: 7 };
  const enAgua = (x, y, m) => { const dx = (x + 0.5 - F.ax) / (F.rx - (m || 0)), dy = (y + 0.5 - F.ay) / (F.ry - (m || 0)); return dx * dx + dy * dy <= 1; };
  const arco = (s, t) => { const xx = F.cx + s * (9 + Math.round(5 * Math.sin(Math.min(t / 15, 1) * Math.PI / 2))); return { x: s > 0 ? xx - 1 : xx, y: F.by - 20 + t }; }; // misma curva que fuente() en albanota_objetos.js (la 1.ª columna de las 2 de la caída)
  function fuente(n) {
    const out = [];
    [-1, 1].forEach((s, i) => {
      for (let j = 0; j < 4; j++) {
        const a = (n + j * 2 + i) % 8, t = a * 2, p = arco(s, t);
        out.push([p.x, p.y, COL.brillo], [p.x, p.y + 1, COL.chispa]);                                  // gota 1×2 sobre la caída
      }
      const sa = (n + i) % 8, fin = arco(s, 15), x = fin.x + (s > 0 ? 0 : 1), y = F.by - 2;          // la gota que cae sale con a = 0, así que la salpicadura sigue al 0, 1 y 2
      const poses = [[[-1, 0], [0, 0], [1, 0]], [[0, -1], [-1, 0], [1, 0], [0, 0]], [[-2, -1], [2, -1]]];
      if (sa < 3) poses[sa].forEach(([dx, dy]) => { if (enAgua(x + dx, y + dy, 0)) out.push([x + dx, y + dy, sa === 1 && dx === 0 && dy === 0 ? COL.chispa : COL.brillo]); });
    });
    return out;
  }
  // destellos de la fuente: 2 casillas fijas en la parte delantera del estanque (la trasera la tapa la columna), ciclo de 16 cuadros, cada uno dura 3
  function destellosFuente(n) {
    const out = [];
    for (let q = 0; q < 2; q++) {
      const a0 = n + q * 7 + 3, a = a0 % 16, e = Math.floor(a0 / 16); if (a > 2) continue;
      const h = hv(q * 31 + 7, e + 400); if (h % 100 >= 60) continue;
      const x = 17 + (h >>> 4) % 27, y = 53 + (h >>> 11) % 5; if (!enAgua(x, y, 4) || !enAgua(x - 1, y, 2) || !enAgua(x + 1, y, 2) || !enAgua(x, y - 1, 2) || !enAgua(x, y + 1, 2)) continue;
      if (a === 1) out.push([x, y, COL.chispa], [x - 1, y, COL.brillo], [x + 1, y, COL.brillo], [x, y - 1, COL.brillo], [x, y + 1, COL.brillo]); else out.push([x, y, COL.brillo]);
    }
    return out;
  }

  // ── 3 · Destellos en el agua ── Celdas de 24×16 px sobre el agua; cada celda tiene un ciclo de 12 cuadros (3 s) y, la mitad de las veces, un destello de 3 cuadros en una casilla distinta cada vez: 1 px · cruz de 5 px · 1 px.
  // SOLO sobre agua: los 5 píxeles de la cruz tienen que pasar capas.olas.visible (agua, lejos de la orilla y del fondo oscuro de la casilla) y no pueden caer sobre nenúfares, juncos ni el puente.
  const CELDA_X = 24, CELDA_Y = 16, CICLO_D = 12;
  const excluidos = new Map(); // id de mapa → rectángulos de objetos que no llevan destellos (nenúfares, juncos, puente)
  function rectasExcluidas(m) {
    const c = excluidos.get(m.id); if (c && c.n === m.objetos.length) return c.r;
    const r = []; (m.objetos || []).forEach((o) => { if (!/nenufar|juncos|puente/.test(o.tipo)) return; const d = G.OBJETOS[o.tipo]; if (d) r.push([o.x * T + d.ox - 2, o.y * T + d.oy - 2, d.w + 4, d.h + 4]); });
    excluidos.set(m.id, { n: m.objetos.length, r }); return r;
  }
  function destellos(m, n, x0, x1, y0, y1) {
    const vis = G.capas.olas.visible, ex = rectasExcluidas(m), out = [];
    const libre = (x, y) => vis(m.suelo, x, y) && !ex.some((r) => x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]);
    for (let cy = Math.floor(y0 / CELDA_Y) - 1; cy <= Math.floor(y1 / CELDA_Y); cy++) for (let cx = Math.floor(x0 / CELDA_X) - 1; cx <= Math.floor(x1 / CELDA_X); cx++) {
      const ph = hv(cx * 7 + 3, cy * 13 + 5) % CICLO_D, a0 = n + ph, a = a0 % CICLO_D, e = Math.floor(a0 / CICLO_D); if (a > 2) continue;
      const h = hv(cx * 97 + cy * 131 + e * 17, 55); if (h % 100 >= 55) continue;
      const X = cx * CELDA_X + 3 + (h >>> 3) % 18, Y = cy * CELDA_Y + 2 + (h >>> 9) % 12;
      if (!libre(X, Y) || !libre(X - 1, Y) || !libre(X + 1, Y) || !libre(X, Y - 1) || !libre(X, Y + 1)) continue;
      out.push({ x: X, y: Y, a, orden: cy * 10000 + cx });
    }
    out.sort((p, q) => p.orden - q.orden);
    return out.slice(0, AJUSTES.MAX_DESTELLOS).map((d) => ({ x: d.x, y: d.y, px: d.a === 1 ? [[0, 0, COL.chispa], [-1, 0, COL.brillo], [1, 0, COL.brillo], [0, -1, COL.brillo], [0, 1, COL.brillo]] : [[0, 0, COL.brillo]] }));
  }

  // ── 4 · Hojas ── Salen de los árboles del borde que miran a la hierba (la capa interior del anillo), se deslizan hacia dentro con el viento (~4-8 casillas) y se encogen en el aire; nunca cruzan una casilla sólida (agua, árbol, edificio, valla):
  // si el camino se corta, la hoja se acorta y se deshace antes. Entran en la lista ordenada por Y de los objetos con su Y del suelo, así un tejado las tapa si están detrás. Cada hoja = 2 píxeles (2×1, 1×2 o en diagonal) que giran; al final, 1 px.
  const VIDA = 44, CICLO_H = [56, 80], ALTO = 18;
  const emisoresCache = new Map();
  function emisores(m) { // [{ tx, ty, ix, iy, id }]
    const c = emisoresCache.get(m.id); if (c && c.s === m.suelo) return c.l;
    const l = [], libre = (x, y) => { const ch = m.suelo[y] && m.suelo[y][x]; return !!ch && ch !== 't' && ch !== '~' && !G.mundo.solido(m, x, y); };
    for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) {
      if (m.suelo[ty][tx] !== 't') continue;
      const ix = tx <= 1 ? 1 : tx >= m.W - 2 ? -1 : 0, iy = ty <= 1 ? 1 : ty >= m.H - 2 ? -1 : 0; if (!ix === !iy) continue; // solo el anillo del borde (las esquinas y los árboles sueltos no emiten)
      if (libre(tx + ix, ty + iy)) l.push({ tx, ty, ix, iy, id: ty * 1000 + tx });
    }
    emisoresCache.set(m.id, { s: m.suelo, l }); return l;
  }
  const VEL_IN = 2.2, VIENTO = [0.8, 0.15];
  function hoja(m, n, e) { // la hoja de este emisor ahora mismo, o null
    const P = CICLO_H[0] + hv(e.id, 61) % (CICLO_H[1] - CICLO_H[0] + 1), a0 = n + hv(e.id, 62) % P, a = a0 % P, ciclo = Math.floor(a0 / P);
    if (a >= VIDA || hv(e.id, ciclo + 700) % 100 >= 45) return null;
    const h = hv(e.id, ciclo + 900), vel = 0.8 + (h % 5) * 0.1, lado = ((h >>> 3) % 7) - 3;                       // velocidad 0,8-1,2 y desvío lateral ±3 px
    const pos = (t) => ({ x: e.tx * T + 8 + e.ix * VEL_IN * vel * t + VIENTO[0] * t + (e.ix ? 0 : lado * t / VIDA), y: e.ty * T + 12 + e.iy * VEL_IN * vel * t + VIENTO[1] * t + (e.iy ? 0 : lado * t / VIDA) });
    let L = VIDA; for (let t = 1; t <= VIDA; t++) { const p = pos(t), tx = Math.floor(p.x / T), ty = Math.floor(p.y / T); if ((tx !== e.tx || ty !== e.ty) && G.mundo.solido(m, tx, ty)) { L = t - 1; break; } } // (la casilla del propio árbol no cuenta: la hoja sale de ella)
    if (L < 10 || a >= L) return null;                                                                          // si el camino se corta pronto, esta hoja no sale
    const p = pos(a), alto = ALTO - (ALTO - 2) * a / L, balanceo = [0, 1, 2, 1, 0, -1, -2, -1][(a + h % 8) % 8];
    const resto = L - a, pal = COL.hojas[h % 2], giro = (a + h) % 3;
    const px = resto <= 1 ? [] : resto <= 3 ? [[0, 0, pal[0]]] : giro === 0 ? [[0, 0, pal[0]], [1, 0, pal[1]]] : giro === 1 ? [[0, 0, pal[0]], [0, 1, pal[1]]] : [[0, 0, pal[0]], [1, 1, pal[1]]];
    if (!px.length) return null;
    return { x: Math.round(p.x), y: Math.round(p.y - alto + balanceo), suelo: Math.round(p.y), px };
  }
  function hojas(m, n, x0, x1, y0, y1) { // las hojas que se ven en el rectángulo del mundo (x0..x1, y0..y1), por orden de emisor
    const lista = [], margen = VIDA * (VEL_IN * 1.2 + 1) + 8;
    emisores(m).forEach((e) => {
      const ex = e.tx * T, ey = e.ty * T; if (ex < x0 - margen || ex > x1 + margen || ey < y0 - margen || ey > y1 + margen) return;
      const h = hoja(m, n, e); if (h && h.x + 2 >= x0 && h.x <= x1 && h.y + 2 >= y0 && h.y <= y1) lista.push(h);
    });
    return lista.slice(0, AJUSTES.MAX_HOJAS);
  }

  // ── Dibujo (lo único que toca el lienzo; cada píxel es un fillRect 1×1) ──
  function pintar(ctx, px, ox, oy) { px.forEach(([x, y, c]) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); }); }
  const API = {
    AJUSTES, COL, CICLO_HUMO, PUFFS, FORMAS, F, VIDA, ALTO, CELDA_X, CELDA_Y, CICLO_D, activo, cuadro, hv, enAgua,
    humo, fuente, destellosFuente, destellos, emisores, hoja, hojas, pintar,
    // — ganchos del juego —
    // el humo de una chimenea (boca en (bx, by) del dibujo de la pieza; k = nº de chimenea) y la fuente: se llaman desde `anima` de la pieza (justo después de su dibujo, en su orden de profundidad); ox, oy = esquina del dibujo en pantalla
    pintarHumo(ctx, ox, oy, reloj, reducido, bx, by, k) { if (reducido || !AJUSTES.ACTIVO) return; pintar(ctx, humo(Math.floor(reloj * AJUSTES.HZ), k), ox + bx, oy + by); },
    pintarFuente(ctx, ox, oy, reloj, reducido) { if (reducido || !AJUSTES.ACTIVO) return; const n = Math.floor(reloj * AJUSTES.HZ); pintar(ctx, fuente(n), ox, oy); pintar(ctx, destellosFuente(n), ox, oy); },
    // destellos del río: se pintan justo después de las olas (antes de la luz de región y de los objetos)
    pintarDestellos(ctx, m, cam, VW, VH) {
      if (!activo(m)) return;
      const x0 = Math.max(0, Math.floor(cam.x)), x1 = Math.min(m.W * T - 1, Math.ceil(cam.x + VW)), y0 = Math.max(0, Math.floor(cam.y)), y1 = Math.min(m.H * T - 1, Math.ceil(cam.y + VH));
      destellos(m, cuadro(), x0, x1, y0, y1).forEach((d) => pintar(ctx, d.px, Math.round(d.x - cam.x), Math.round(d.y - cam.y)));
    },
    // hojas visibles como entradas de la lista ordenada del juego: [{ y: Y del suelo, hoja }]
    hojasVista(m, cam, VW, VH) { return activo(m) ? hojas(m, cuadro(), cam.x, cam.x + VW, cam.y, cam.y + VH).map((h) => ({ y: h.suelo, hoja: h })) : []; },
    pintarHoja(ctx, h, cam) { pintar(ctx, h.px, Math.round(h.x - cam.x), Math.round(h.y - cam.y)); }
  };
  G.particulas = API;
})(typeof window !== 'undefined' ? window : globalThis);
