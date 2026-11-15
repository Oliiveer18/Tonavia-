// capas.js — MOTOR DE DIBUJO CON CAPAS (ID-2a, v2.33). Solo dibujo: no guarda estado de partida ni usa Math.random.
// Formato 2 de maps/*.json: capas.suelo (casillas como siempre) + objetos [{tipo, x, y}] + colision (filas extra, 'x' = sólido) + animar (true/false).
// Un objeto es una pieza del catálogo G.OBJETOS (se registra con G.capas.registrar). Capas de dibujo, de abajo arriba:
//   1. suelo (casillas) + objetos de capa «bajo» (decorado en el suelo, sin altura)        → se hornea una vez en un lienzo
//   2. agua animada (solo si el mapa tiene animar: true)                                   → 2 fotogramas del reloj visual
//   3. entidades (jugadores, criaturas) y objetos «normales» ordenados por la Y de sus pies → se pasa por detrás de lo que está más al sur
//   4. «encima» de los objetos (copas, tejados, farolillos): se dibuja DESPUÉS de las entidades
// Reloj visual único: G.capas.tick(dt) lo avanza el bucle del juego; G.capas.frame(hz) da el fotograma (0,1,…) de un adorno.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  const OBJETOS = (G.OBJETOS = G.OBJETOS || {});
  const capas = (G.capas = {
    T, OBJETOS, reloj: 0,
    // def = { w, h (px del dibujo), ox, oy (px desde la esquina de la casilla (x,y) hasta la esquina del dibujo), pieY (px desde la parte de arriba de la casilla (x,y) hasta los pies, para ordenar),
    //         huella: [[dx, dy, ancho, alto] en casillas desde (x,y)] sólidas (puede ser []), capa: 'bajo' | 'normal',
    //         dibujar(base, encima, T): dibuja con Canvas2D en dos lienzos w×h; «encima» puede no usarse }
    registrar(tipo, def) {
      if (!tipo || typeof def.dibujar !== 'function' || !(def.w > 0 && def.h > 0)) throw new Error('objeto «' + tipo + '» mal definido (w, h y dibujar son obligatorios)');
      OBJETOS[tipo] = Object.assign({ ox: 0, oy: 0, pieY: T, huella: [], capa: 'normal' }, def);
      delete cache[tipo];
    },
    quitar(tipo) { delete OBJETOS[tipo]; delete cache[tipo]; },
    REDUCIDO: (() => { try { return (typeof location !== 'undefined' && /[?&]movimiento=0/.test(location.search || '')) || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } })(), // «menos movimiento»: el agua se queda quieta
    tick(dt) { capas.reloj += dt; },
    frame(hz, n) { return Math.floor(capas.reloj * hz) % (n || 2); }, // fotograma de un adorno que cambia «hz» veces por segundo
    // casillas sólidas que añaden los objetos y la capa de colisión de un mapa del formato 2 (Set de «x,y»)
    bloqueos(j, W, H) {
      const s = new Set();
      (j.colision || []).forEach((fila, y) => { for (let x = 0; x < fila.length; x++) if (fila[x] === 'x') s.add(x + ',' + y); });
      (j.objetos || []).forEach((o) => { const d = OBJETOS[o.tipo]; if (d) d.huella.forEach(([dx, dy, w, h]) => { for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) s.add((o.x + dx + a) + ',' + (o.y + dy + b)); }); });
      return s;
    },
    // Problemas de los objetos de un mapa (lista vacía = bien)
    validar(j, W, H) {
      const out = [];
      (j.objetos || []).forEach((o, i) => {
        const d = OBJETOS[o.tipo];
        if (!d) { out.push('el objeto ' + i + ' es de un tipo que no existe («' + o.tipo + '»)'); return; }
        if (!Number.isInteger(o.x) || !Number.isInteger(o.y) || o.x < 0 || o.y < 0 || o.x >= W || o.y >= H) out.push('el objeto ' + i + ' («' + o.tipo + '») está fuera del mapa');
        d.huella.forEach(([dx, dy, w, h]) => { if (o.x + dx < 0 || o.y + dy < 0 || o.x + dx + w > W || o.y + dy + h > H) out.push('la huella del objeto ' + i + ' («' + o.tipo + '») se sale del mapa'); });
      });
      if (j.colision) { if (j.colision.length !== H) out.push('la capa de colisión no tiene ' + H + ' filas'); else j.colision.forEach((f, y) => { if (f.length !== W) out.push('la fila ' + y + ' de colisión no mide ' + W); }); }
      return out;
    },
  });

  // ---------- dibujo (necesita lienzos: en node las pruebas no llegan aquí) ----------
  const cache = {};   // tipo → { base, encima } horneados
  const FONDOS = {};  // id de mapa → { suelo }
  const dibujoDe = (tipo) => {
    if (cache[tipo]) return cache[tipo];
    const d = OBJETOS[tipo], base = G.makeCanvas(d.w, d.h), encima = G.makeCanvas(d.w, d.h);
    const cb = base.getContext('2d'), ce = encima.getContext('2d'); cb.imageSmoothingEnabled = ce.imageSmoothingEnabled = false;
    d.dibujar(cb, ce, T);
    return (cache[tipo] = { base, encima });
  };
  capas.dibujoDe = dibujoDe;   // v2.328: la luz nocturna mira los sprites horneados (ventanas)
  // ── Olas del agua (v2.40) ── función pura (sin dibujar): pixeles(suelo, n, x0, x1, y0, y1) = [X, Y, color, id] de las olas y las rayitas blancas en el cuadro n (4 por segundo).
  // El agua se reparte en BANDAS de 7 filas: la ola ocupa las filas 0-3 (empieza en la 0 o la 1), una rayita blanca la fila 5 y quedan filas vacías entre todo: nada se toca, ni en diagonal.
  // OLAS: en cada tramo de agua de una banda (de orilla a orilla), cada cierto tiempo AL AZAR sale una ola (a veces ninguna, a veces varias a la vez en bandas distintas), de un tipo, hacia un lado y en un momento distinto cada vez. Empieza fuera del agua, cruza todo el tramo a 2 px por cuadro y termina deshaciéndose en la orilla opuesta.
  // RAYITAS BLANCAS (las de siempre, ahora solo sobre agua): rayas de 2-3 px que aparecen y se apagan al azar en 3 cuadros.
  const olas = (capas.olas = (() => {
    const BANDA = 6, CELDA = 20;
    const hs = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
    const px = (cadena) => cadena.split(' ').map((t) => { const [a, b, c] = t.split(','); return [+a, +b, c]; }); // [dx, dy, color]: o = onda, b = brillo (blanco), h = seno oscuro
    const TIPOS = [
      { peso: 30, p: px('0,0,o 1,0,o 2,0,o 3,0,o 4,0,o 1,1,h 2,1,h 3,1,h 4,1,h') },                                       // raya recta con seno
      { peso: 25, p: px('0,1,o 1,0,o 2,0,o 3,1,o 4,1,o 5,0,o 6,0,o 1,2,h 4,2,h') },                                        // ondulada (~)
      { peso: 20, p: px('0,0,o 1,0,o 2,0,o 4,0,o 5,0,o 7,0,o 8,0,o 1,1,h 5,1,h') },                                        // discontinua
      { peso: 15, p: px('0,0,o 1,0,b 2,0,b 3,0,o 1,1,h 2,1,h') },                                                            // chispa corta con brillo
      { peso: 10, p: px('0,0,o 1,0,o 2,0,o 3,0,o 4,0,b 5,0,b 6,0,o 7,0,o 8,0,o 9,0,o 2,1,h 3,1,h 6,1,h 7,1,h') }            // línea larga fina
    ];
    TIPOS.forEach((t) => { t.ancho = Math.max(...t.p.map((q) => q[0])) + 1; });
    const CORTOS = TIPOS.filter((t) => t.ancho <= 5); // v2.43: en el agua de 1 casilla de ancho (partes verticales) solo olas cortas
    const escoge = (n) => { let a = 0; for (let i = 0; i < TIPOS.length; i++) { a += TIPOS[i].peso; if (n < a) return TIPOS[i]; } return TIPOS[0]; };
    const cacheTramos = new WeakMap();
    function tramos(suelo, ty) { // tramos seguidos de agua de una fila de casillas: [inicio, fin] en px, con 5 px de margen por dentro de la orilla
      let c = cacheTramos.get(suelo); if (!c) cacheTramos.set(suelo, (c = {}));
      if (c[ty]) return c[ty];
      const fila = suelo[ty] || '', r = []; let i = 0;
      while (i < fila.length) { if (fila[i] !== '~') { i++; continue; } let j = i; while (j < fila.length && fila[j] === '~') j++; if ((j - i) * 16 - 10 >= 6) r.push([i * 16 + 5, j * 16 - 5, i * 16, j * 16]); i = j; }
      return (c[ty] = r);
    }
    function pixeles(suelo, n, x0, x1, y0, y1) {
      const sal = [];
      for (let b = Math.max(0, Math.floor(y0 / BANDA) - 1); b <= Math.floor(y1 / BANDA); b++) {
        const wy = b * BANDA, dir = hs(b, 24) % 2 ? 1 : -1; // v2.41: todas las olas de una banda van hacia el mismo lado (así dos olas de la misma banda nunca se cruzan)
        tramos(suelo, Math.floor((wy + 1) / 16)).forEach(([xa, xb, ta, tb], i) => {
          if (tb < x0 - 40 || ta > x1 + 40) return;
          const viaje = Math.ceil((tb - ta + 28) / 2), SL = viaje + 10, fase0 = hs(b * 131 + i * 7 + ta, 23) % SL;
          for (let lane = 0; lane < 3; lane++) { // v2.42: 3 olas por banda a la vez (desfasadas un tercio de hueco: separación mínima ≥ 16 px)
            const u = n + fase0 + lane * Math.floor(SL / 3), s = Math.floor(u / SL), k = u % SL; // «hueco»: tiempo de viaje + espera
            const sd = (salt) => hs(b * 977 + ta * 13 + salt + lane * 5003, s);
            if (sd(1) % 100 >= 92) continue; // a veces no sale ola
            const off = sd(2) % 4, kk = k - off; if (kk < 0 || kk >= viaje) continue;
            const T0 = tb - ta <= 16 ? CORTOS[sd(4) % CORTOS.length] : escoge(sd(4) % 100), X0 = dir > 0 ? ta - T0.ancho - 2 + 2 * kk : tb + 2 - 2 * kk; // sale de fuera del agua, la cruza y se deshace en la orilla opuesta
            T0.p.forEach(([dx, dy, c]) => sal.push([X0 + dx, wy + dy, c, 'w' + b + ':' + ta + ':' + lane]));
          }
        });
        // rayitas blancas: fila 5 de la banda, celdas de 20 px
        for (let cx = Math.floor(x0 / CELDA) - 1; cx <= Math.floor(x1 / CELDA); cx++) {
          const u2 = n + (hs(cx * 5 + 3, b * 11 + 4) % 10), e2 = Math.floor(u2 / 10), k2 = u2 % 10, s2 = hs(cx * 92821 + b * 68917 + 77, e2 + 1000);
          if (k2 >= 3 || s2 % 100 >= 40) continue;
          const X = cx * CELDA + 3 + (s2 % 13), L = k2 === 1 ? 3 : 2;
          for (let q = 0; q < L; q++) sal.push([X + q, b * BANDA + 4, 'b', 's' + b + ':' + cx]);
        }
      }
      return sal;
    }
    // v2.44: ¿se pinta un píxel del mundo (wx, wy)? Solo sobre agua, lejos de la orilla y del fondo oscuro de la casilla. La usan capas.agua y el test de cobertura.
    function visible(suelo, wx, wy) {
      const a = (x, y) => { const r = suelo[Math.floor(y / 16)]; return !!r && r[Math.floor(x / 16)] === '~'; };
      return a(wx - 2, wy) && a(wx + 2, wy) && a(wx, wy - 2) && a(wx, wy + 3) && wy % 16 < 12 && wy % 16 > 1 && a(wx, wy + 1);
    }
    return { BANDA, CELDA, TIPOS, pixeles, visible };
  })());

  // ── Viento (v2.48a, invisible: todavía no se dibuja) ── Función pura: en qué POSE está una mata o una flor de la casilla (tx, ty) en el cuadro n (4 por segundo, como el agua). Lo usarán las matas (v2.48c) y las flores (v2.49).
  // Una ráfaga cruza el mapa en diagonal, de izquierda a derecha (u = tx + ty/2, como una franja inclinada de bordes duros que avanza VEL casillas por cuadro). Cuando llega a una planta, esta pasa por SEC = [1, 2, 2, 1] (poses con suavizado) y vuelve a 0 (recta).
  // Poses: 0 recta · 1 punta inclinada 1 px · 2 punta y 2.º píxel inclinados 1 px. Cada planta tiene un retraso propio de 0 o 1 cuadros (por su casilla) para que la ráfaga sea una ola y no una franja. Las ráfagas salen cada 6-9 s (24-36 cuadros), siempre igual en cada partida (no usa azar). La primera, a los 2 s.
  const viento = (capas.viento = (() => {
    const SEC = [1, 2, 2, 1], VEL = 1.5, INTERVALO = [24, 36], PRIMERA = 8, INCLINACION = [[0, 0], [1, 0], [1, 1]]; // INCLINACION[pose] = píxeles a la derecha de [la punta, el 2.º píxel]
    const hv = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
    const SALIDAS = [PRIMERA]; // SALIDAS[k] = cuadro en que sale la ráfaga k (se va rellenando; el resultado no depende del orden de las consultas)
    const rafaga = (k) => { while (SALIDAS.length <= k) SALIDAS.push(SALIDAS[SALIDAS.length - 1] + INTERVALO[0] + (hv(SALIDAS.length, 41) % (INTERVALO[1] - INTERVALO[0] + 1))); return SALIDAS[k]; };
    const llegada = (tx, ty) => Math.floor((tx + ty / 2) / VEL) + (hv(tx * 131 + ty * 7, 43) % 2); // cuadros que tarda una ráfaga en llegar a la casilla desde que sale (retraso propio incluido)
    const pose = (tx, ty, n) => {
      const m = n - llegada(tx, ty); if (m < PRIMERA) return 0;
      let k = Math.max(0, Math.floor(m / INTERVALO[1]) - 1); while (rafaga(k + 1) <= m) k++; // la última ráfaga ya salida (empieza buscando cerca: las ráfagas salen cada 24-36 cuadros)
      const i = m - rafaga(k); return i >= 0 && i < SEC.length ? SEC[i] : 0;
    };
    return { SEC, VEL, INTERVALO, PRIMERA, INCLINACION, rafaga, llegada, pose };
  })());

  // ── Luz por región (v2.46, ID-2b-2) ── Cada región tiene su temperatura de luz FIJA (BIBLIA_VISUAL 5; sin ciclo de día y noche): un tinte suave y liso, el mismo en todo el mapa, SIN bordes ni manchas (la luz por zonas con bandas de la v2.45 se descartó: dejaba manchas sobre el césped).
  // Se pone encima del suelo y del agua y antes de jugadores y criaturas (Oli, Lali y los sprites no se tocan; las rampas del arte tampoco). El mapa dice su región con «region» en su JSON (opcional: sin región, sin tinte). Solo con «Sombras» encendido; ?luz=0 la apaga.
  const luz = (capas.luzDatos = (() => {
    const REGIONES = { // color y fuerza del tinte (0-1) de cada región, de la columna «luz» de la biblia
      albanota: { color: '#ffd9a0', fuerza: 0.05, luz: 'alba cálida' }, silvara: { color: '#f0e8a0', fuerza: 0.05, luz: 'sol filtrado' }, carbuna: { color: '#ff9a50', fuerza: 0.07, luz: 'tarde de brasa' },
      marenda: { color: '#bfe6ff', fuerza: 0.05, luz: 'mañana de mar' }, fulgoria: { color: '#c0d8ff', fuerza: 0.05, luz: 'cielo de tormenta clara' }, cirrena: { color: '#f4f0ff', fuerza: 0.04, luz: 'altura despejada' },
      obsidra: { color: '#ffe6b0', fuerza: 0.05, luz: 'mediodía seco' }, umbrada: { color: '#6a50b8', fuerza: 0.12, luz: 'crepúsculo' }
    };
    const OFF = (() => { try { return typeof location !== 'undefined' && /[?&]luz=0/.test(location.search || ''); } catch (e) { return false; } })();
    const rgba = (hex, f) => 'rgba(' + [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16)).join(',') + ',' + f + ')';
    return { REGIONES, OFF, rgba };
  })());

  Object.assign(capas, {
    soltar(dim) { Object.keys(FONDOS).forEach((k) => { if (k.indexOf(dim + '/') === 0 || k.indexOf('c:' + dim + '/') === 0) delete FONDOS[k]; }); },   // FN: libera los suelos horneados de una dimensión descargada (motor.liberarDimensiones)
    limpiar() { Object.keys(cache).forEach((k) => delete cache[k]); Object.keys(FONDOS).forEach((k) => delete FONDOS[k]); }, // tras encender o apagar el sombreado
    // Suelo horneado: todas las casillas y los objetos de capa «bajo». dibujaCasilla(ctx, ch, tx, ty, mapa) la pone el juego (game.js).
    fondo(m, dibujaCasilla, clave) { // clave (v2.112): otro suelo del mismo mapa (el del 2D clásico); sin ella, el de siempre
      const k = clave || m.id;
      if (FONDOS[k]) return FONDOS[k].suelo;
      const c = G.makeCanvas(m.W * T, m.H * T), x = c.getContext('2d');
      for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) dibujaCasilla(x, m.suelo[ty][tx], tx, ty, m);
      m.objetos.forEach((o) => { const d = OBJETOS[o.tipo]; if (d.capa === 'bajo') x.drawImage(dibujoDe(o.tipo).base, o.x * T + d.ox, o.y * T + d.oy); });
      FONDOS[k] = { suelo: c }; return c;
    },
    // Objetos «normales» que se ven en la vista (cam = esquina, VW×VH = tamaño): [{ y: clave de orden, objeto }] para mezclar con las entidades
    visibles(m, cam, VW, VH) {
      const out = [];
      m.objetos.forEach((o) => {
        const d = OBJETOS[o.tipo]; if (d.capa === 'bajo') return;
        const px = o.x * T + d.ox, py = o.y * T + d.oy;
        if (px + d.w < cam.x || px > cam.x + VW || py + d.h < cam.y || py > cam.y + VH) return;
        out.push({ y: o.y * T + d.pieY, objeto: o });
      });
      return out;
    },
    // ¿tapa algún objeto (casa, árbol, tejado…) el rectángulo x0..x1 × y0..y1 de una entidad cuyos pies están en yp? Sirve para colocar el combate a la vista (v2.288)
    tapa(m, x0, y0, x1, y1, yp) {
      return m.objetos.some((o) => { const d = OBJETOS[o.tipo]; if (d.capa === 'bajo') return false; const px = o.x * T + d.ox, py = o.y * T + d.oy;
        if (x1 < px || x0 > px + d.w || y1 < py || y0 > py + d.h) return false; return o.y * T + d.pieY > yp || d.encima !== false; });
    },
    dibujarBase(ctx, o, cam) { const d = OBJETOS[o.tipo]; ctx.drawImage(dibujoDe(o.tipo).base, Math.round(o.x * T + d.ox - cam.x), Math.round(o.y * T + d.oy - cam.y)); },
    // Adorno animado de una pieza (v2.79: el latido de la cúpula del laboratorio): se pinta justo encima de su dibujo, solo en la vista 2D del juego. Con ?movimiento=0 o movimiento reducido no se pinta.
    animar(ctx, o, cam) { const d = OBJETOS[o.tipo]; if (d.anima) d.anima(ctx, Math.round(o.x * T + d.ox - cam.x), Math.round(o.y * T + d.oy - cam.y), capas.reloj, capas.REDUCIDO); },
    // «encima» de todos los objetos normales visibles, después de las entidades
    dibujarEncima(ctx, lista, cam) { lista.forEach((p) => { const o = p.objeto, d = OBJETOS[o.tipo]; if (d.encima !== false) ctx.drawImage(dibujoDe(o.tipo).encima, Math.round(o.x * T + d.ox - cam.x), Math.round(o.y * T + d.oy - cam.y)); }); },
    // Matas de hierba encima del suelo (v2.48b) y con viento (v2.48c): solo en mapas con animar y con el sombreado encendido (sin él, el dibujo es el de game.js). En reposo se ven exactamente como cuando estaban horneadas en el suelo; cuando pasa una ráfaga (G.capas.viento.pose) la punta se inclina 1 px en tres poses. ?movimiento=0 las deja rectas.
    matas(ctx, m, cam, VW, VH) {
      if (!m.animar || !G.SOMBREADO || !G.SOMBREADO.ACTIVO || !G.sombreado) return;
      const cx = Math.round(cam.x), cy = Math.round(cam.y), n = capas.REDUCIDO ? 0 : Math.floor(capas.reloj * 4);
      G.sombreado.matasLista(m).forEach((q) => {
        const x0 = q.tx * T - cx, y0 = q.ty * T - cy; if (x0 + T <= 0 || y0 + T <= 0 || x0 >= VW || y0 >= VH) return;
        const pose = capas.REDUCIDO ? 0 : viento.pose(q.tx, q.ty, n);
        G.sombreado.dibujaMata((col, a, b) => { if (q.oc.has(a + ',' + b)) return; ctx.fillStyle = col; ctx.fillRect(x0 + a, y0 + b, 1, 1); }, q, pose); // (q.oc: píxeles que una flor de una casilla posterior tapaba al hornear)
      });
    },
    // Flores encima del suelo con viento (v2.49): mismas reglas que las matas (solo mapas con animar y «Sombras» encendido; ?movimiento=0 las deja quietas). Con la ráfaga la cabeza de cada flor se desplaza 1 px; el tallo no. Los píxeles que tapa la orilla del agua (q.oc) no se pintan, como cuando estaban horneadas.
    flores(ctx, m, cam, VW, VH) {
      if (!m.animar || !G.SOMBREADO || !G.SOMBREADO.ACTIVO || !G.sombreado) return;
      const cx = Math.round(cam.x), cy = Math.round(cam.y), n = capas.REDUCIDO ? 0 : Math.floor(capas.reloj * 4);
      G.sombreado.floresLista(m).forEach((q) => {
        const x0 = q.tx * T - cx, y0 = q.ty * T - cy; if (x0 + T <= 0 || y0 + T <= 0 || x0 >= VW || y0 >= VH) return;
        const pose = capas.REDUCIDO ? 0 : viento.pose(q.tx, q.ty, n);
        G.sombreado.dibujaFlores((col, a, b, w, h) => { ctx.fillStyle = col; for (let j = 0; j < (h || 1); j++) for (let i = 0; i < (w || 1); i++) if (!q.oc.has((a + i) + ',' + (b + j))) ctx.fillRect(x0 + a + i, y0 + b + j, 1, 1); }, q.tx, q.ty, pose);
      });
    },
    // Luz por región (v2.46): un tinte liso sobre todo el suelo y el agua (ver luzDatos). Solo con el sombreado encendido y sin ?luz=0.
    luzActiva() { return !!(G.SOMBREADO && G.SOMBREADO.ACTIVO) && !luz.OFF; },
    luzRegion(ctx, m, VW, VH) { const R = m.region && luz.REGIONES[m.region]; if (!R || !capas.luzActiva()) return; ctx.fillStyle = luz.rgba(R.color, R.fuerza); ctx.fillRect(0, 0, VW, VH); },
    // Agua animada (v2.39; solo mapas con animar: true): ver capas.olas. Cada píxel se comprueba: solo se pinta sobre agua y lejos de la orilla. Con «menos movimiento» (?movimiento=0 o el ajuste del sistema) se queda en un cuadro fijo.
    agua(ctx, m, cam, VW, VH) {
      if (!m.animar) return;
      const n = capas.REDUCIDO ? 12 : Math.floor(capas.reloj * 4), C = (G.SOMBREADO && G.SOMBREADO.ACTIVO ? G.sombreado.COL.agua : { onda: '#6aa5ee', brillo: '#d3e8ff', hondo: '#35629f' });
      const agua = (wx, wy) => { const r = m.suelo[Math.floor(wy / T)]; return !!r && r[Math.floor(wx / T)] === '~'; };
      const sobre = (wx, wy) => olas.visible(m.suelo, wx, wy); // lejos de la orilla y del fondo oscuro de la casilla (ver olas.visible)
      const x0 = Math.max(0, Math.floor(cam.x)), x1 = Math.min(m.W * T - 1, Math.ceil(cam.x + VW)), y0 = Math.max(0, Math.floor(cam.y)), y1 = Math.min(m.H * T - 1, Math.ceil(cam.y + VH));
      const COLOR = { o: C.onda, b: C.brillo, h: C.hondo };
      olas.pixeles(m.suelo, n, x0, x1, y0, y1).forEach(([X, Y, c]) => { if (X < x0 || X > x1 || Y < y0 || Y > y1 || !sobre(X, Y)) return; ctx.fillStyle = COLOR[c]; ctx.fillRect(Math.round(X - cam.x), Math.round(Y - cam.y), 1, 1); });
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
