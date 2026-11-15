// clasico2d.js — ESTILO 2D CLÁSICO (piloto, v2.112). Solo el pintor 2D de src/game.js: el HD-2D no lo usa y no cambia (su suelo, sus sprites y su sombreado siguen siendo los de siempre).
// Idea: el 2D se veía «3/4 de 3D» por las sombras proyectadas, la luz por región, el relieve del sombreado y un suelo con ruido al azar. Aquí el suelo es PLANO y por casillas (cada casilla repite su dibujo, como en los RPG de GBA),
// sin sombras largas ni tinte, y las criaturas usan su dibujo plano (sin sombreado). Todo con arte propio por código; nada copiado de otros juegos.
// Interruptor: ?clasico=0 en la dirección (vuelve al 2D anterior) o G.clasico.ACTIVO = false. Solo DIBUJO: nunca toca el estado de la partida ni la colisión.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  const OFF = (() => { try { return typeof location !== 'undefined' && /[?&]clasico=0/.test(location.search || ''); } catch (e) { return false; } })();
  const COL = {
    hierba: '#5fb35a', hierbaOsc: '#4c9c50', hierbaClara: '#82d074', hierbaBorde: '#3f8a48',
    camino: '#ecd9a8', caminoPunto: '#d8c08a', caminoBorde: '#bfa166',
    agua: '#4d7fd6', aguaClara: '#8fb4f0', aguaOsc: '#3a5fb0',
    arbol: '#4f9f55', arbolLuz: '#7cc972', arbolSombra: '#3d8446', arbolBorde: '#24502f',
    flores: ['#ffffff', '#f5a8bd', '#f7d54a'], centro: '#f09a3e',
  };
  const hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
  const HIERBA_LIKE = '.ft'; // casillas que se ven como hierba / bosque junto a un camino
  const lee = (m, x, y) => { const f = m.suelo[y]; return f ? f[x] : undefined; };

  function pinta(c, ch, tx, ty, m) { // true = la casilla es de las que el estilo clásico dibuja; false = se deja al dibujo de siempre (game.js)
    const x0 = tx * T, y0 = ty * T, r = (col, a, b, w, h) => { c.fillStyle = col; c.fillRect(x0 + a, y0 + b, w || 1, h || 1); };
    if (G.terreno && G.terreno.pinta(c, ch, tx, ty, m)) return true; // v2.321: mapas con tema de terreno (src/terreno.js)
    const par = (tx + ty) & 1;
    // v2.242 (pedido del usuario): GRANO FINO en la hierba (9 puntitos de 1 px en dos tonos) y BORDES SUAVES en los caminos (puntos que se deshacen hacia dentro, en el camino y en la hierba pegada). Igual que en el HD-2D (src/sombreado.js).
    const borde = (dx, dy, col, prof, den) => { for (let k = 0; k < T; k++) { const wx = tx * T + (dy ? k : prof), wy = ty * T + (dy ? prof : k), par = (wx + wy) & 1, ok = den === 2 ? par === 0 : den === 3 ? par === 1 && ((wx >> 1) + (wy >> 1)) % 2 === 0 : ((wx >> 1) + (wy >> 1)) % 4 === 0 && par === 0; if (ok) { if (dy) r(col, k, dy < 0 ? prof : T - 1 - prof); else r(col, dx < 0 ? prof : T - 1 - prof, k); } } };   // v2.245: tramado ordenado (ver src/sombreado.js)
    if (ch === '.' || ch === 'f') { // hierba: base lisa + 2 matitas fijas por casilla (se alternan en espejo para que no se vea una rejilla) + a veces una flor
      r(COL.hierba, 0, 0, T, T);
      const mata = (a, b) => { r(COL.hierbaOsc, a, b + 1, 1, 1); r(COL.hierbaOsc, a + 2, b + 1, 1, 1); r(COL.hierbaClara, a + 1, b, 1, 1); r(COL.hierbaOsc, a + 1, b + 1, 1, 1); };
      // v2.170: sin matitas (hierba lisa, como en el HD-2D); `mata` queda por si se quieren recuperar
      if (ch === '.') for (let i = 0; i < 9; i++) { const hh = hash(tx, ty, 70 + i); r(i % 2 ? COL.hierbaClara : COL.hierbaOsc, hh % 16, (hh >>> 4) % 16); }
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => { if (lee(m, tx + dx, ty + dy) === '=') { borde(dx, dy, COL.caminoBorde, 0, 2); borde(dx, dy, COL.caminoPunto, 1, 3); borde(dx, dy, COL.caminoBorde, 2, 5); } });
      const h = hash(tx, ty, 7);
      if (ch === 'f' || h % 11 === 0) { const col = COL.flores[(h >>> 4) % 3], fx = 2 + ((h >>> 8) % 3) * 4, fy = 2 + ((h >>> 12) % 3) * 4; r(COL.hierbaOsc, fx + 1, fy + 3, 1, 1); r(col, fx + 1, fy, 1, 1); r(col, fx, fy + 1, 1, 1); r(col, fx + 2, fy + 1, 1, 1); r(col, fx + 1, fy + 2, 1, 1); r(COL.centro, fx + 1, fy + 1, 1, 1); }
      return true;
    }
    if (ch === '=') { // camino: base lisa, piedrecitas fijas y borde fino donde toca hierba (esquinas redondeadas)
      r(COL.camino, 0, 0, T, T);
      const g = (dx, dy) => HIERBA_LIKE.indexOf(lee(m, tx + dx, ty + dy) || '=') >= 0;
      const N = g(0, -1), S = g(0, 1), W = g(-1, 0), E = g(1, 0);
      if (N) r(COL.caminoBorde, 0, 0, T, 1); if (S) r(COL.caminoBorde, 0, T - 1, T, 1); if (W) r(COL.caminoBorde, 0, 0, 1, T); if (E) r(COL.caminoBorde, T - 1, 0, 1, T);
      [[0, -1, N], [0, 1, S], [-1, 0, W], [1, 0, E]].forEach(([dx, dy, hay]) => { if (hay) { borde(dx, dy, COL.caminoBorde, 1, 2); borde(dx, dy, COL.caminoPunto, 2, 4); borde(dx, dy, COL.caminoPunto, 3, 5); } });
      const esq = (cond, a, b) => { if (cond) { r(COL.hierba, a, b, 1, 1); } };
      esq(N && W, 0, 0); esq(N && E, T - 1, 0); esq(S && W, 0, T - 1); esq(S && E, T - 1, T - 1);
      return true;
    }
    if (ch === '~') { // agua lisa con rayitas fijas; orilla un poco más oscura arriba
      r(COL.agua, 0, 0, T, T);
      r(COL.aguaClara, 2 + par * 6, 4, 4, 1); r(COL.aguaClara, 9 - par * 6, 11, 4, 1);
      const tierra = (dx, dy) => { const q = lee(m, tx + dx, ty + dy); return q !== undefined && q !== '~' && q !== 'b'; };
      if (tierra(0, -1)) r(COL.aguaOsc, 0, 0, T, 2);
      if (tierra(0, 1)) { r(COL.aguaClara, 0, T - 1, T, 1); }
      if (tierra(-1, 0)) r(COL.aguaClara, 0, 0, 1, T); if (tierra(1, 0)) r(COL.aguaClara, T - 1, 0, 1, T);
      return true;
    }
    if (ch === 't') { // árbol: una copa redonda por casilla; luz arriba-izquierda en 3 tonos planos. Entre árboles vecinos el hueco es oscuro (muro de bosque); junto a hierba abierta, el árbol se apoya en la hierba
      const t = (dx, dy) => lee(m, tx + dx, ty + dy) === 't';
      for (let b = 0; b < T; b++) for (let a = 0; a < T; a++) {
        const d = Math.hypot(a - 7.5, b - 7.5), sx = a < 8 ? -1 : 1, sy = b < 8 ? -1 : 1;
        let col;
        if (d > 7.6) col = (t(sx, 0) || t(0, sy) || t(sx, sy)) ? COL.arbolBorde : null; // esquina fuera de la copa
        else if (d > 6.6) col = COL.arbolBorde;
        else if (a + b < 11 && d < 5.2) col = COL.arbolLuz;
        else if (a + b > 19) col = COL.arbolSombra;
        else col = COL.arbol;
        if (col === null) { // esquina abierta: se ve la hierba de la casilla
          r(COL.hierba, a, b, 1, 1);
        } else r(col, a, b, 1, 1);
      }
      return true;
    }
    // Las 12 casillas «nuevas» del editor (paso 1.3a): mismo criterio, dibujo fijo por casilla (sin ruido al azar)
    const P = G.PAL || {}, pts = (col, lista, w, h) => lista.forEach(([a, b]) => { const q = par ? [a, b] : [T - 1 - a - (w || 1) + 1, b]; r(col, q[0], q[1], w || 1, h || 1); });
    if (ch === 'g') { // hierba alta: más oscura, con briznas en V repetidas
      r(COL.hierbaOsc, 0, 0, T, T);
      for (let b = 0; b < T; b += 8) for (let a = 0; a < T; a += 8) { const o = (b / 8) & 1 ? 4 : 0, x = a + o; r(COL.hierbaBorde, x + 1, b + 2, 1, 4); r(COL.hierba, x + 2, b + 1, 1, 5); r(COL.hierbaClara, x + 3, b + 2, 1, 3); r(COL.hierbaBorde, x + 4, b + 3, 1, 3); }
      return true;
    }
    if (ch === 's') { r(P.cream2 || '#ead7ae', 0, 0, T, T); pts('#d8c08a', [[2, 3], [9, 2], [5, 9], [12, 11], [14, 6]], 2, 1); return true; }
    if (ch === 'r') { r(P.stone2 || '#797686', 0, 0, T, T); r(P.stone1 || '#8d8a99', 0, 0, T, 3); r(P.stone3 || '#615e6f', 0, T - 3, T, 3); pts(P.stone3 || '#615e6f', [[3, 6], [10, 8]], 4, 1); pts(P.stone1 || '#8d8a99', [[6, 5], [2, 10]], 3, 1); return true; }
    if (ch === 'c') { r('#4a4260', 0, 0, T, T); pts('#3a3350', [[2, 3], [9, 2], [5, 9], [12, 11], [14, 6]], 3, 2); return true; }
    if (ch === 'l') { r(P.red || '#d94a3f', 0, 0, T, T); pts(P.orange || '#f09a3e', [[2, 2], [9, 7], [4, 11]], 5, 2); pts(P.yellow || '#f7d54a', [[4, 3], [11, 8], [6, 12]], 2, 1); r(P.red2 || '#a8322f', 0, T - 2, T, 2); return true; }
    if (ch === 'b') { r(COL.agua, 0, 0, T, T); r(COL.aguaOsc, 0, T - 2, T, 2); r(P.wood1 || '#c48b52', 0, 2, T, 12); for (let yy = 2; yy < 14; yy += 4) r(P.wood3 || '#8f5c33', 0, yy + 3, T, 1); r(P.woodD || '#6b4226', 0, 2, T, 1); r(P.woodD || '#6b4226', 0, 13, T, 1); return true; }
    if (ch === '#') { r(P.cream2 || '#ead7ae', 0, 0, T, T); for (let yy = 0; yy < T; yy += 4) { r('#c9b48a', 0, yy + 3, T, 1); for (let xx = (yy / 4) % 2 ? 4 : 0; xx < T; xx += 8) r('#c9b48a', xx, yy, 1, 3); } r(P.wood3 || '#8f5c33', 0, T - 2, T, 2); return true; }
    if (ch === 'h') { r(P.red2 || '#a8322f', 0, 0, T, T); for (let yy = 0; yy < T; yy += 4) { r(P.red || '#d94a3f', 0, yy, T, 3); for (let xx = (yy / 4) % 2 ? 3 : 0; xx < T; xx += 6) r(P.red2 || '#a8322f', xx, yy, 1, 3); } r(P.ink || '#2a1b30', 0, T - 1, T, 1); return true; }
    if (ch === 'd') { r(P.cream2 || '#ead7ae', 0, 0, T, T); r(P.woodD || '#6b4226', 3, 1, 10, 15); r(P.brown || '#7a4a2b', 4, 2, 8, 14); r(P.wood3 || '#8f5c33', 7, 2, 1, 14); r(P.yellow || '#f7d54a', 10, 9, 2, 2); return true; }
    if (ch === '_') { r(P.wood1 || '#c48b52', 0, 0, T, T); for (let yy = 0; yy < T; yy += 4) { r(P.wood2 || '#b27a45', 0, yy + 3, T, 1); r(P.wood2 || '#b27a45', par ? 4 : 11, yy, 1, 3); } return true; }
    if (ch === 'm') { r(P.wood1 || '#c48b52', 0, 0, T, T); r(P.woodD || '#6b4226', 1, 3, 14, 11); r(P.brown || '#7a4a2b', 2, 4, 12, 4); r(P.wood3 || '#8f5c33', 2, 9, 12, 4); r(P.yellow || '#f7d54a', 7, 10, 2, 1); return true; }
    if (ch === 'x') { r(P.ink || '#2a1b30', 0, 0, T, T); return true; }
    return false;
  }

  G.clasico = {
    ACTIVO: !OFF,
    COLUMNAS: 12, // casillas que se quieren ver de ancho (antes 8): el zoom entero baja y se ve más mundo, como en los RPG de GBA
    COL,
    // Devuelve la función de casilla del estilo clásico; las casillas que no son suyas las dibuja `original` (game.js)
    casilla(original) { return (c, ch, tx, ty, m) => { if (!pinta(c, ch, tx, ty, m)) original(c, ch, tx, ty, m); }; },
    // Sprite de criatura en su dibujo plano (sin sombreado), con caché propia (src/creatures.js: clave 'p:'): el HD-2D sigue con el suyo
    spriteCriatura(id, dir, f) {
      const S = G.SOMBREADO; if (!S) return G.creatureSprite(id, dir, f);
      const antes = S.ACTIVO; S.ACTIVO = false; G.__plano = true;
      try { return G.creatureSprite(id, dir, f); } finally { S.ACTIVO = antes; G.__plano = false; }
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
