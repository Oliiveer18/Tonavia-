// sombreado.js — v2.21 (paso A del plan de identidad, docs/REGLAS_DE_LUZ.md): luz fija ARRIBA-IZQUIERDA y sombra ABAJO-DERECHA en todo lo que se dibuja por código.
// Dos partes: (1) G.sombrearSprite(cv): pasada que se aplica a cada sprite de criatura justo después de su contorno (contorno selectivo + luz y sombra en los bordes, con cambio de tono: luces cálidas, sombras frías);
//             (2) G.sombreado.suelo(...): dibujo de las casillas de suelo (hierba, flores, árbol, camino, agua) con la misma regla.
// Interruptor: G.SOMBREADO.ACTIVO (true = sombreado; false = el dibujo de siempre, idéntico píxel a píxel). En el juego: botón «Sombras» o ?sombras=0 en la dirección. Solo DIBUJO: nunca toca el estado de la partida ni la silueta (el canal alfa no cambia).
// No toca a Oli ni a Lali (sprites de src/chars.js): eso queda para un paso aparte.
(function () {
  'use strict';
  const G = window.G;
  const SOMBREADO = (G.SOMBREADO = { ACTIVO: true, VOLUMEN: true, LIMPIO: true }); // LIMPIO (v2.24.1): las criaturas con `limpio: true` en src/luz_criaturas.js usan el sombreado compacto (base + sombra, brillo mínimo, un solo contorno); false = el volumen de la v2.24.0 (?limpio=0, para comparar). VOLUMEN (v2.23, B1): false = las criaturas piloto vuelven a la pasada de bordes de la v2.21 (solo para comparar; ?volumen=0)
  try { if (typeof location !== 'undefined' && /[?&]sombras=0/.test(location.search || '')) SOMBREADO.ACTIVO = false; } catch (e) { /* sin dirección: se queda el valor por defecto */ }
  try { if (typeof location !== 'undefined' && /[?&]limpio=0/.test(location.search || '')) SOMBREADO.LIMPIO = false; } catch (e) { /* idem */ }
  try { if (typeof location !== 'undefined' && /[?&]volumen=0/.test(location.search || '')) SOMBREADO.VOLUMEN = false; } catch (e) { /* idem */ }

  // ── (1) Sprites ──
  const INK = [0x2a, 0x1b, 0x30]; // el mismo contorno que dibuja outline() en src/creatures.js
  const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b); let h = 0, s = 0; const l = (M + m) / 2; if (M !== m) { const d = M - m; s = l > 0.5 ? d / (2 - M - m) : d / (M + m); h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; };
  const hsl2rgb = ([h, s, l]) => { h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; };
  const towards = (h, t, a) => { const d = ((t - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), a); }; // acerca el tono h al tono t, como mucho a grados

  G.sombrearSprite = function (cv, cid) {
    if (!SOMBREADO.ACTIVO) return;
    const cfg = SOMBREADO.VOLUMEN && cid && G.LUZ_CRIATURAS ? G.LUZ_CRIATURAS[cid] : null; // criatura piloto con volumen calculado (src/luz_criaturas.js)
    const c = cv.getContext && cv.getContext('2d'); if (!c || !c.getImageData || !c.putImageData) return;
    const W = cv.width, H = cv.height, id = c.getImageData(0, 0, W, H), d = id.data, s = new Uint8ClampedArray(d);
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : [s[(y * W + x) * 4], s[(y * W + x) * 4 + 1], s[(y * W + x) * 4 + 2], s[(y * W + x) * 4 + 3]]);
    const isInk = (p) => !!p && p[3] > 0 && p[0] === INK[0] && p[1] === INK[1] && p[2] === INK[2];
    const empty = (p) => !p || p[3] === 0;
    const put = (x, y, col) => { const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; }; // el canal alfa NO se toca: la silueta es la misma
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = at(x, y); if (empty(p)) continue;
      const ns = [at(x, y - 1), at(x - 1, y), at(x, y + 1), at(x + 1, y)]; // arriba, izquierda, abajo, derecha
      if (isInk(p) && ns.some(empty)) { // contorno selectivo
        if (cfg && cfg.limpio && SOMBREADO.LIMPIO) continue; // sombreado limpio: UN solo tono de contorno (el original), sin matices según el entorno: toma el tono de lo que rodea, más claro arriba-izquierda y más oscuro abajo-derecha
        const fills = ns.filter((q) => q && q[3] > 0 && !isInk(q)); if (!fills.length) continue;
        const f = fills.reduce((a, q) => (a[0] + a[1] + a[2] > q[0] + q[1] + q[2] ? a : q));
        let [h, sa, l] = rgb2hsl(f); const top = empty(ns[0]) || empty(ns[1]), bot = empty(ns[2]) || empty(ns[3]);
        l = top && !bot ? Math.max(0.16, l * 0.42) : Math.max(0.09, l * 0.30); h = towards(h, 285, 28); sa = Math.min(1, Math.max(sa, 0.35) * 0.9);
        put(x, y, hsl2rgb([h, sa, l])); continue;
      }
      if (isInk(p)) continue; // detalles oscuros de dentro (ojos, bocas): no se tocan
      if (cfg) continue; // criatura piloto: el relleno lo pinta la pasada de volumen (abajo)
      let [h, sa, l] = rgb2hsl(p); if (l > 0.9 || l < 0.12) continue; // blancos (ojos, brillos) y casi negros: no se tocan
      const litN = isInk(ns[0]) || isInk(ns[1]), darkN = isInk(ns[2]) || isInk(ns[3]);
      if (litN && !darkN) put(x, y, hsl2rgb([towards(h, 52, 14), Math.min(1, sa * 1.05), Math.min(0.92, l + 0.10)])); // borde iluminado: más claro y más cálido
      else if (darkN && !litN) put(x, y, hsl2rgb([towards(h, 275, 12), Math.min(1, sa * 1.05 + 0.02), Math.max(0.10, l - 0.12)])); // borde en sombra: más oscuro y más frío
    }
    if (cfg) volumen(s, d, W, H, cfg, isInk);
    acabado(s, d, W, H, isInk);
    c.putImageData(id, 0, 0);
  };

  // ── (1c) Acabado (v2.47) ── Dos ajustes dentro de las rampas de color (nunca se inventa un color fuera de la rampa del propio relleno):
  // (1) SOMBRA MÁS SUAVE: la sombra usa un `contraste` más bajo (SOMBRA_SUAVE de su material × el del material); la luz no cambia. Así la criatura deja de ser, de media, más oscura que su dibujo original (la sombra ocupaba más que la luz) y las sombras siguen separándose de la base.
  // (2) LUZ DE BORDE en las criaturas oscuras (claridad media del relleno < 0,30): el relleno pegado al contorno por arriba-izquierda (de donde viene la luz) toma el tono `l1` de su rampa, para que el cuerpo no se funda con el contorno oscuro y la silueta se lea sobre el suelo.
  // Solo cambia R, G y B de píxeles de relleno; ni el alfa, ni el contorno, ni blancos, casi negros y ojos (los mismos que respeta el sombreado).
  const SOMBRA_SUAVE = { piel: 0.78, roca: 0.70, metal: 0.55, cristal: 0.55 }; // por material: el metal y el cristal tienen mucho contraste y pierden más brillo; la piel tiene poco y no se puede bajar más (mínimo del estándar, tools/luz.js)
  function acabado(s, d, W, H, isInk) {
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : [s[(y * W + x) * 4], s[(y * W + x) * 4 + 1], s[(y * W + x) * 4 + 2], s[(y * W + x) * 4 + 3]]);
    const borde = (q) => !q || q[3] === 0 || isInk(q), idx = []; let suma = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (s[i + 3] === 0 || isInk([s[i], s[i + 1], s[i + 2], s[i + 3]])) continue;
      const l = rgb2hsl([s[i], s[i + 1], s[i + 2]])[2]; if (l > 0.9 || l < 0.12) continue;
      idx.push([x, y, i]); suma += l;
    }
    if (!idx.length || suma / idx.length >= 0.30) return;
    idx.forEach(([x, y, i]) => { const ns = [at(x, y - 1), at(x - 1, y), at(x, y + 1), at(x + 1, y)]; if ((borde(ns[0]) || borde(ns[1])) && !borde(ns[2]) && !borde(ns[3])) { const c = G.rampa.rgb([s[i], s[i + 1], s[i + 2]], {}).l1; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; } });
  }


  // ── (1b) Volumen calculado (v2.23, B1) ──
  // Desde la silueta se calcula qué zonas miran a la luz (arriba-izquierda): se mide la distancia de cada píxel al borde (transparente o contorno oscuro), se saca la pendiente
  // y se pinta en 3 bandas duras (luz · base · sombra) con la rampa del propio color (G.rampa). Nunca toca el canal alfa. Los materiales deciden cuánto contraste y si hay brillo.
  const MAT = { // umbral: cuánto tiene que mirar a la luz para pintarse; contraste: separación de la rampa; brillo/profundo: usan s0 y l2 en los bordes más extremos
    piel:    { umbral: 0.40, contraste: 0.65, brillo: false, profundo: false },
    roca:    { umbral: 0.40, contraste: 1.00, brillo: false, profundo: true },
    metal:   { umbral: 0.34, contraste: 1.20, brillo: true,  profundo: true },
    cristal: { umbral: 0.30, contraste: 1.30, brillo: true,  profundo: true },
  };
  const enRango = (v, r) => !r || (v >= r[0] && v <= r[1]);
  function volumen(s, d, W, H, cfg, isInk) {
    const L = !!(cfg.limpio && SOMBREADO.LIMPIO), Iv = new Float32Array(W * H), R = cfg.alcance || 3, IDX = (x, y) => y * W + x, D = new Int16Array(W * H).fill(-1), cola = [];
    const borde = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return true; const i = IDX(x, y) * 4; return s[i + 3] === 0 || (s[i] === INK[0] && s[i + 1] === INK[1] && s[i + 2] === INK[2]); };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (s[IDX(x, y) * 4 + 3] === 0 || borde(x, y)) { D[IDX(x, y)] = 0; cola.push(IDX(x, y)); } // distancia 0 = borde
    for (let q = 0; q < cola.length; q++) { const i = cola[q], x = i % W, y = (i / W) | 0; if (D[i] >= R) continue; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) return; const j = IDX(X, Y); if (D[j] < 0) { D[j] = D[i] + 1; cola.push(j); } }); }
    const dd = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : D[IDX(x, y)] < 0 ? R : D[IDX(x, y)]); // lo que quedó sin visitar está a R o más: plano
    const banda = new Int8Array(W * H), mats = new Array(W * H); // banda: 2 brillo · 1 luz · 0 base · -1 sombra · -2 sombra profunda · 9 = no se toca
    banda.fill(9);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = IDX(x, y) * 4; if (s[i + 3] === 0 || borde(x, y)) continue;
      const col = [s[i], s[i + 1], s[i + 2]], [h, sa, l] = G.color.rgb2hsl(col);
      if (l > 0.92 || l < 0.12) continue; // blancos y casi negros: no se tocan (como en la v2.21)
      let mat = cfg.mat || 'piel', emite = false;
      (cfg.emite || []).forEach((r) => { if (enRango(h, r.h) && enRango(sa, r.s) && enRango(l, r.l)) emite = true; });
      if (emite) continue; // lo que emite luz (electricidad, brillos mágicos) no se sombrea
      for (const r of cfg.colores || []) if (enRango(h, r.h) && enRango(sa, r.s) && enRango(l, r.l)) { mat = r.mat; break; }
      const M = MAT[mat] || MAT.piel;
      const gx = (dd(x + 1, y - 1) + 2 * dd(x + 1, y) + dd(x + 1, y + 1) - dd(x - 1, y - 1) - 2 * dd(x - 1, y) - dd(x - 1, y + 1)) / 8, gy = (dd(x - 1, y + 1) + 2 * dd(x, y + 1) + dd(x + 1, y + 1) - dd(x - 1, y - 1) - 2 * dd(x, y - 1) - dd(x + 1, y - 1)) / 8;
      const I = 0.7071 * (gx + gy); // producto de la normal por la luz (arriba-izquierda): >0 mira a la luz, <0 mira a la sombra
      let b = 0;
      if (I > M.umbral) b = M.brillo && I > M.umbral * 2.6 && dd(x, y) <= 1 ? 2 : 1;
      else if (I < -M.umbral) b = M.profundo && I < -M.umbral * 2.6 && dd(x, y) <= 1 ? -2 : -1;
      banda[IDX(x, y)] = b; mats[IDX(x, y)] = M; Iv[IDX(x, y)] = I;
    }
    if (L) { // sombreado limpio (v2.24.1): solo base y sombra; el brillo (metal/cristal) queda en 1-2 px por mancha; la banda de sombra se alisa para que sea continua y de grosor regular
      for (let k = 0; k < W * H; k++) { if (banda[k] === 1) banda[k] = 0; else if (banda[k] === -2) banda[k] = -1; }
      const vec = (k) => { const x = k % W, y = (k / W) | 0, r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) r.push(IDX(X, Y)); } return r; };
      for (let pasada = 0; pasada < 2; pasada++) {
        const cp = banda.slice();
        for (let k = 0; k < W * H; k++) {
          if (cp[k] === 9 || cp[k] === 2) continue;
          const v = vec(k).filter((j) => cp[j] !== 9), sh = v.filter((j) => cp[j] === -1).length;
          if (cp[k] === -1 && sh <= 1) banda[k] = 0; // sombra suelta: fuera
          else if (cp[k] === 0 && v.length >= 5 && sh >= 5) banda[k] = -1; // hueco dentro de la sombra: se rellena
        }
      }
      // v2.24.6 (paso 2a, reglas 3 y 4 del estándar): la sombra se compone de bloques de al menos 2×2 px. Un píxel de sombra que no está en ningún 2×2 de sombra se engrosa hacia dentro (completa un 2×2 con a lo sumo 2 píxeles de base) o, si no cabe, se quita. Solo cambia color, nunca el alfa.
      const sombra2 = () => { const cp = banda.slice(), ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H, B = (x, y) => (ok(x, y) ? cp[IDX(x, y)] : 9);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (cp[IDX(x, y)] !== -1) continue;
          let dentro = false, mejor = null;
          for (const [ox, oy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) { // los 4 cuadrados 2×2 que contienen (x, y)
            const c = [[x + ox, y + oy], [x + ox + 1, y + oy], [x + ox, y + oy + 1], [x + ox + 1, y + oy + 1]], v = c.map(([a, b]) => B(a, b));
            if (v.every((q) => q === -1)) { dentro = true; break; }
            if (v.some((q) => q === 9 || q === 2 || q === 1)) continue; // fuera de la criatura, contorno o brillo: no se toca
            const faltan = c.filter(([a, b]) => B(a, b) === 0);
            if (faltan.length <= 2 && (!mejor || faltan.length < mejor.length)) mejor = faltan;
          }
          if (dentro) continue;
          if (mejor) mejor.forEach(([a, b]) => { banda[IDX(a, b)] = -1; }); else banda[IDX(x, y)] = 0;
        } };
      sombra2(); sombra2();
      const vis = new Uint8Array(W * H);
      for (let k = 0; k < W * H; k++) { // brillo: de cada mancha de brillo solo se quedan los 2 píxeles más iluminados
        if (banda[k] !== 2 || vis[k]) continue;
        const comp = [k], pila = [k]; vis[k] = 1;
        while (pila.length) { const q = pila.pop(); vec(q).forEach((j) => { if (banda[j] === 2 && !vis[j]) { vis[j] = 1; comp.push(j); pila.push(j); } }); }
        comp.sort((a, b) => Iv[b] - Iv[a]); comp.slice(2).forEach((j) => { banda[j] = 0; });
      }
    }
    // limpieza: un píxel que no se parece a ninguno de sus 4 vecinos y los vecinos coinciden entre sí toma su banda (quita puntos sueltos; no mueve nada si la zona es de un solo tipo)
    const fina = (b) => (b === 2 ? 1 : b === -2 ? -1 : b), copia = banda.slice();
    if (!L) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = IDX(x, y); if (copia[k] === 9) continue;
      const v = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= W || Y >= H ? 9 : copia[IDX(X, Y)]; }).filter((q) => q !== 9).map(fina);
      if (v.length < 3) continue;
      const f = fina(copia[k]), igual = v.filter((q) => q === f).length;
      if (igual === 0) { const c0 = v.filter((q) => q === v[0]).length; if (c0 >= 3) banda[k] = v[0]; } // aislado: 0 vecinos iguales y al menos 3 coinciden
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = IDX(x, y), b = banda[k]; if (b === 9 || b === 0) continue;
      const i = k * 4, ram = G.rampa.rgb([s[i], s[i + 1], s[i + 2]], { contraste: (mats[k] ? mats[k].contraste : 1) * (b < 0 ? SOMBRA_SUAVE[mats[k] === MAT.roca ? 'roca' : mats[k] === MAT.metal ? 'metal' : mats[k] === MAT.cristal ? 'cristal' : 'piel'] : 1) });
      const out = b === 2 ? ram.l2 : b === 1 ? ram.l1 : b === -1 ? ram.s1 : ram.s0;
      d[i] = out[0]; d[i + 1] = out[1]; d[i + 2] = out[2];
    }
  }

  // ── (2) Suelo ──
  const hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; }; // el mismo que game.js: mismo suelo siempre
  const r01 = (x, y, k) => hash(x, y, k) / 4294967295;
  const COL = {
    hierba: { s0: '#2c7351', s1: '#3b8d50', base: '#5dae5a', l1: '#76c363', l2: '#93d46f' },          // sombra fría → luz cálida
    arena: { s0: '#b58f58', s1: '#cfad72', base: '#e8cf98', l1: '#f3e2b6' },
    agua: { borde: '#2a4f9c', hondo: '#35629f', base: '#4580d4', onda: '#6aa5ee', brillo: '#d3e8ff' },
    copa: { c4: '#a3de7c', c3: '#78c866', c2: '#4cab57', c1: '#36904f', c0: '#256249', luz: '#2d7a52', sombra: '#1b4440' },
    tronco: { luz: '#9a6238', base: '#6b4226', sombra: '#4a2e24' },
  };
  const SUELOS = '.ft=~'; // casillas que dibuja este módulo; las demás (las 12 nuevas) siguen con su dibujo de game.js

  // v2.35: matas de hierba con forma (sustituyen a los puntos sueltos). Cada una es un dibujo de 3-4 briznas (centro más alta, punta clara, pie oscuro), ocupa una sola casilla y no pisa el borde.
  // Salen poco (≈1 de cada 6 casillas de hierba lisa), nunca en dos casillas vecinas, ni junto al agua, ni bajo árboles ni en casillas con flores.
  const MATAS = [ // [x, y, altura, tono]: tono 0 = tallo oscuro, 1 = tallo medio; la punta de cada brizna se pinta clara
    [[0, 2, 3], [2, 0, 5], [4, 1, 4]],
    [[0, 1, 4], [2, 2, 3], [4, 0, 5], [6, 2, 3]],
    [[0, 2, 3], [2, 1, 4], [4, 2, 3]]
  ];
  const ANCHO = [5, 7, 5];
  const tieneMata = (tx, ty) => hash(tx, ty, 81) % 100 < 18;
  // v2.48b: la mata se separa en DATOS (¿hay mata en esta casilla y cómo es?) y DIBUJO (r(color, x, y) por píxel), para poder dibujarla encima del suelo en los mapas con animar (G.capas.matas), donde se moverá con el viento (v2.48c). El dibujo en reposo es exactamente el de siempre.
  function matasDatos(tx, ty, m) {
    if (!tieneMata(tx, ty) || tieneMata(tx - 1, ty) || tieneMata(tx, ty - 1) || tieneMata(tx - 1, ty - 1) || tieneMata(tx + 1, ty - 1)) return null;
    const ch = (dx, dy) => { const row = m.suelo[ty + dy]; return row && row[tx + dx] !== undefined ? row[tx + dx] : 't'; };
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (ch(dx, dy) === '~') return null; // nada junto al agua (la orilla ya dibuja su borde)
    const v = hash(tx, ty, 82) % 3, w = ANCHO[v];
    return { v, ox: 3 + (hash(tx, ty, 83) % (11 - w - 1)), oy: 6 + (hash(tx, ty, 84) % 4) };
  }
  // pose (v2.48c): 0 recta · 1 la punta de cada brizna 1 px a la derecha · 2 la punta y el 2.º píxel 1 px a la derecha (G.capas.viento.INCLINACION). El pie y el resto del tallo no se mueven.
  function dibujaMata(r, d, pose) {
    const H = COL.hierba, INC = G.capas && G.capas.viento ? G.capas.viento.INCLINACION[pose || 0] : [0, 0];
    MATAS[d.v].forEach(([bx, by, alto]) => {
      for (let k = 0; k < alto; k++) r(k === 0 ? H.l2 : k === 1 ? H.l1 : H.s1, d.ox + bx + (k < 2 ? INC[k] : 0), d.oy + by + k); // punta muy clara, después clara y tallo oscuro
      r(H.s0, d.ox + bx, d.oy + by + alto); // pie
    });
  }
  // v2.49: las flores de una casilla. Datos y dibujo separados para poder dibujarlas ENCIMA del suelo con viento (G.capas.flores). Cada flor: pie (sombra), cabeza 2×2 con centro naranja y tallo de 2 px. Con viento (pose 1 o 2) solo la CABEZA se desplaza 1 px a la derecha (G.capas.viento.INCLINACION[pose][0]); el tallo y el pie no se mueven.
  // Arreglo de un defecto antiguo (v2.49): `(h >> 4) % 11` salía negativo cuando h pasaba de 2^31 y la flor se pintaba en la casilla de arriba, por encima de lo que hubiera. Ahora un valor negativo se lleva al mismo número positivo (+11): las flores que ya estaban bien no se mueven ni un píxel; solo las que se salían de su casilla pasan a estar dentro de ella.
  const FLORES_COL = [['#f5a8bd', '#d9708f'], ['#f7d54a', '#d9a82a'], ['#ffffff', '#c9c4d8']];
  function floresDatos(tx, ty) { return FLORES_COL.map(([col, dk], k) => { const h = hash(tx, ty, k + 20); return { col, dk, fx: 2 + (h % 11), fy: 2 + ((((h >> 4) % 11) + 11) % 11) }; }); }
  function dibujaFlores(r, tx, ty, pose) {
    const H = COL.hierba, dx = G.capas && G.capas.viento ? G.capas.viento.INCLINACION[pose || 0][0] : 0;
    floresDatos(tx, ty).forEach(({ col, dk, fx, fy }) => { r(H.s0, fx + 1, fy + 3, 2, 1); r(col, fx + dx, fy, 2, 2); r(dk, fx + dx, fy + 1, 2, 1); r('#f09a3e', fx + dx, fy, 1, 1); r(H.s1, fx, fy + 2, 1, 2); });
  }
  // v2.49: la orilla de la hierba junto al agua (píxeles [a, b, 's0' | 's1'] de la casilla), compartida por suelo() y por la lista de flores (la orilla se dibuja después de las flores horneadas, así que las tapa)
  const LADOS_ORILLA = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  function orillaPix(m, tx, ty) {
    const T = 16, l = [], nb = (dx, dy) => { const row = m.suelo[ty + dy]; return row && row[tx + dx] !== undefined ? row[tx + dx] : 't'; };
    LADOS_ORILLA.forEach(([dx, dy]) => { if (nb(dx, dy) !== '~') return; for (let i = 0; i < T; i++) { const dep = 1 + (hash(tx * 3 + i, ty * 5 + dx, 90) % 2); for (let q = 0; q < dep; q++) { if (dy) l.push([i, dy < 0 ? q : T - 1 - q, q === 0 ? 's0' : 's1']); else l.push([dx < 0 ? q : T - 1 - q, i, q === 0 ? 's0' : 's1']); } } });
    return l;
  }
  const LISTAS_F = new WeakMap();
  function floresLista(m) { // [{ tx, ty, oc }] de las casillas de flores; oc = píxeles de la casilla que la orilla del agua tapa (las flores horneadas quedaban debajo)
    if (LISTAS_F.has(m)) return LISTAS_F.get(m);
    const l = []; for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) if (m.suelo[ty][tx] === 'f') l.push({ tx, ty, oc: new Set(orillaPix(m, tx, ty).map(([a, b]) => a + ',' + b)) });
    LISTAS_F.set(m, l); return l;
  }
  const LISTAS = new WeakMap(); // mapa → lista de matas (se calcula una vez)
  function matasLista(m) { // [{ tx, ty, v, ox, oy }] de todas las casillas de hierba lisa con mata
    if (LISTAS.has(m)) return LISTAS.get(m);
    const T = 16, tapa = new Map(); // píxel del mundo → orden de la última casilla que lo pinta con una flor (las casillas se hornean en orden de filas)
    for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) if (m.suelo[ty][tx] === 'f') dibujaFlores((col, a, b, w, h) => { for (let j = 0; j < (h || 1); j++) for (let i = 0; i < (w || 1); i++) tapa.set((tx * T + a + i) + ',' + (ty * T + b + j), ty * m.W + tx); }, tx, ty);
    const l = []; for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) if (m.suelo[ty][tx] === '.') {
      const d = matasDatos(tx, ty, m); if (!d) continue;
      const oc = new Set(); for (let b = 0; b < T; b++) for (let a = 0; a < T; a++) if ((tapa.get((tx * T + a) + ',' + (ty * T + b)) || -1) > ty * m.W + tx) oc.add(a + ',' + b); // píxeles de la casilla que una flor de una casilla posterior ya tapaba al hornear (también valen para la mata inclinada)
      l.push({ tx, ty, v: d.v, ox: d.ox, oy: d.oy, oc });
    }
    LISTAS.set(m, l); return l;
  }
  function suelo(c, ch, tx, ty, m, T) {
    if (!SOMBREADO.ACTIVO || SUELOS.indexOf(ch) < 0) return false;
    const x = tx * T, y = ty * T, r = (col, a, b, w, h) => { c.fillStyle = col; c.fillRect(x + a, y + b, w || 1, h || 1); };
    const nb = (dx, dy) => { const row = m.suelo[ty + dy]; return row && row[tx + dx] !== undefined ? row[tx + dx] : 't'; }; // fuera del mapa cuenta como árbol (hierba)
    const LADOS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const lado = (dx, dy, col) => { if (dy) r(col, 0, dy < 0 ? 0 : T - 1, T, 1); else r(col, dx < 0 ? 0 : T - 1, 0, 1, T); }; // línea de 1 px pegada a un lado de la casilla
    const H = COL.hierba, A = COL.arena, W = COL.agua;
    // v2.245: bordes de camino con TRAMADO ORDENADO (la paridad sale de la posición en el mundo, así el dibujo continúa sin cortes entre casillas): profundidad 0 = tramado de tablero, 1 = un píxel de cada dos filas alternas, 2 = esporádico
    const borde = (dx, dy, col, prof, den) => { for (let k = 0; k < T; k++) { const wx = tx * T + (dy ? k : prof), wy = ty * T + (dy ? prof : k), par = (wx + wy) & 1, ok = den === 2 ? par === 0 : den === 3 ? par === 1 && ((wx >> 1) + (wy >> 1)) % 2 === 0 : ((wx >> 1) + (wy >> 1)) % 4 === 0 && par === 0; if (ok) { if (dy) r(col, k, dy < 0 ? prof : T - 1 - prof); else r(col, dx < 0 ? prof : T - 1 - prof, k); } } };
    if (ch === '=') { // camino de arena: liso (v2.35: sin guijarros ni puntos) y una línea más oscura donde toca la hierba
      r(A.base, 0, 0, T, T);
      LADOS.forEach(([dx, dy]) => { const v = nb(dx, dy); if (v !== '=' && v !== '~') { lado(dx, dy, A.s1); borde(dx, dy, A.s1, 1, 2); borde(dx, dy, A.s1, 2, 4); borde(dx, dy, A.s0, 3, 5); } }); // v2.242: borde suave (la línea se deshace en puntos hacia dentro)
    } else if (ch === '~') { // agua: dos azules, ondas sueltas y un borde azul oscuro (sin espuma)
      r(W.base, 0, 0, T, T); r(W.hondo, 0, T - 3, T, 3);
      if (!m.animar) for (let k = 0; k < 2; k++) { const h = hash(tx, ty, k + 60), i = 1 + (h % 9), j = 2 + ((h >> 4) % 9); r(W.brillo, i, j, 3, 1); r(W.onda, i - 1, j, 1, 1); r(W.onda, i + 3, j, 1, 1); r(W.hondo, i + 1, j + 1, 3, 1); } // con animar, las ondas las dibuja G.capas.agua (v2.37)
      LADOS.forEach(([dx, dy]) => { if (nb(dx, dy) !== '~') lado(dx, dy, W.borde); });
    } else { // hierba (., f) y suelo bajo el árbol (t)
      r(H.base, 0, 0, T, T); // un solo verde (v2.35) con un GRANO MUY FINO (v2.242): nueve puntitos de 1 px en dos tonos próximos y, una casilla de cada siete, una florecita de 1 px
      const dm = ch === '.' ? matasDatos(tx, ty, m) : null;   // las casillas con mata o flores no llevan grano (las dibuja otra capa encima y debe coincidir píxel a píxel)
      if (ch === '.' && !dm) { for (let i = 0; i < 9; i++) { const hh = hash(tx, ty, 70 + i); r(i % 2 ? H.l1 : H.s1, hh % 16, (hh >>> 4) % 16); } const hf = hash(tx, ty, 90); if (hf % 7 === 0) r(['#ffffff', '#f5a8bd', '#f7d54a'][(hf >>> 12) % 3], 2 + ((hf >>> 3) % 12), 2 + ((hf >>> 8) % 12)); }
      if (!dm && ch !== 'f') LADOS.forEach(([dx, dy]) => { if (nb(dx, dy) === '=') { borde(dx, dy, A.s1, 0, 2); borde(dx, dy, A.base, 1, 3); borde(dx, dy, A.s1, 2, 5); } }); // v2.242: la tierra se mete a puntos en la hierba pegada al camino
      if (ch === '.' && !m.animar) { const d = matasDatos(tx, ty, m); if (d) dibujaMata((col, a, b) => r(col, a, b), d); } // con animar, las matas las dibuja G.capas.matas encima del suelo (v2.48b)
      if (ch === 'f' && !m.animar) dibujaFlores(r, tx, ty); // con animar, las flores las dibuja G.capas.flores encima del suelo (v2.49)
      orillaPix(m, tx, ty).forEach(([a, b, c]) => r(H[c], a, b)); // orilla de la hierba junto al agua (v2.49: calculada por orillaPix)
      if (ch === 't') { // árbol: tronco con luz a la izquierda y copa en 5 tonos con luz arriba-izquierda; contorno claro arriba-izquierda y oscuro abajo-derecha
        const TR = COL.tronco, C = COL.copa;
        r(TR.sombra, 9, 10, 1, 6); r(TR.base, 7, 10, 2, 6); r(TR.luz, 6, 10, 1, 6); r(TR.sombra, 10, 15); r(TR.sombra, 5, 15);
        const dentro = (X, Y) => (X >= 1 && X <= 14 && Y >= 2 && Y <= 11) || (X >= 2 && X <= 13 && Y >= 1 && Y <= 10) || (X >= 4 && X <= 11 && Y >= 0 && Y <= 1);
        for (let Y = 0; Y < 12; Y++) for (let X = 0; X < 16; X++) {
          if (!dentro(X, Y)) continue;
          if (!dentro(X + 1, Y) || !dentro(X, Y + 1)) { r(C.sombra, X, Y); continue; }
          if (!dentro(X - 1, Y) || !dentro(X, Y - 1)) { r(C.luz, X, Y); continue; }
          const t = ((X - 8) * -0.62 + (Y - 5.5) * -0.78) / 8, v = t + r01(X >> 1, Y >> 1, tx * 31 + ty) * 0.22 - 0.1;
          r(v > 0.52 ? C.c4 : v > 0.2 ? C.c3 : v < -0.55 ? C.c0 : v < -0.18 ? C.c1 : C.c2, X, Y);
        }
        r(C.c0, 5, 11, 6, 1); r(C.c0, 3, 10, 2, 1);
      }
    }
    return true;
  }

  G.sombreado = { COL, suelo, SUELOS, MAT, MATAS, matasDatos, dibujaMata, matasLista, floresDatos, dibujaFlores, floresLista, orillaPix };
})();
