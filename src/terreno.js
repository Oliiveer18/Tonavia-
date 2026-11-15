// terreno.js — MOTOR DE TERRENOS 2D (v2.321): auto-baldosas por píxel con bordes naturales, paleta, lava animada, brasas y luz por región (tema = m.region). Solo dibujo del 2D clásico: sin estado de partida ni Math.random. Tema nuevo = una entrada en TEMAS.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16, NF = 8; // NF: cuadros del ciclo de la lava (4 por segundo)
  const hs = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
  const ruido = (x, y, p, k) => { // ruido de valor suave 0..1 (rejilla de p píxeles, canal k): continuo entre casillas
    const gx = Math.floor(x / p), gy = Math.floor(y / p), fx = x / p - gx, fy = y / p - gy, v = (i, j) => (hs(gx + i + k * 7919, gy + j) & 1023) / 1023;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), a = v(0, 0), b = v(1, 0), c = v(0, 1), d = v(1, 1);
    return a + (b - a) * sx + (c + (d - c) * sx - a - (b - a) * sx) * sy;
  };
  const MEZ = {}, mezcla = (c1, c2, f) => { const k = c1 + c2 + f; if (MEZ[k]) return MEZ[k]; const p = (c, i) => parseInt(c.substr(i, 2), 16); return (MEZ[k] = '#' + [1, 3, 5].map((i) => ('0' + Math.round(p(c1, i) + (p(c2, i) - p(c1, i)) * f).toString(16)).slice(-2)).join('')); };
  const K = (s) => s.charCodeAt(0), CE = K('c'), RO = K('r'), LA = K('l'), CA = K('='), HI = K('.'), PU = K('b');

  // ── Tema CARBUNA (BIBLIA_VISUAL 4-5: tierra rojiza, basalto, brasa; tarde de brasa) ──
  const P = {
    cen: '#7f5e52', cenLuz: '#9a7868', cenSom: '#674a44',
    cam: '#4a3a44', camJunta: '#3a2c37', camLuz: '#58464f',
    roc: ['#5d4955', '#6d5863', '#7e6973'], rocLuz: '#9a8590', rocSom: '#463540', rocCara: '#33232f', rocBorde: '#241828',
    hie: '#8c9a4c', hieLuz: '#aab862', hieSom: '#667a3e',
    lava: '#f0603e', lavaClara: '#f7903c', lavaViva: '#f7d54a', lavaPlaca: '#b8322c', lavaOsc: '#c9402f', lavaCostra: '#6b1f24',
    orilla: '#3b2630', calor: '#ff6a30', pue: '#6a5863', pueJunta: '#4f3f4a',
  };
  const BASE = { [CE]: P.cen, [HI]: P.hie, [RO]: P.roc[1] };
  const nivel = (x, y) => Math.min(2, Math.floor((ruido(x, y, 22, 7) * 0.75 + ruido(x, y, 9, 8) * 0.25) * 3)); // terrazas de la roca
  function colorCarbuna(R, wx, wy, f) {
    const W = R.W, i = wy * W + wx, k = R.t[i], at = (dx, dy) => { const x = wx + dx, y = wy + dy; return x < 0 || y < 0 || x >= W || y >= R.H ? k : R.t[i + dy * W + dx]; };
    if (k === LA) { // costra en la orilla y, dentro, bandas duras que bajan 2 px por cuadro
      const d = R.dB[i]; if (d <= 1.5) return P.lavaCostra; if (d <= 3 + ruido(wx, wy, 5, 3) * 1.5) return P.lavaOsc;
      let v = ruido(wx, wy, 11, 4) * 1.7 + ruido(wx, wy, 5, 5) * 0.5 + wy / 16 - f / NF; v -= Math.floor(v);
      return v < 0.46 ? P.lava : v < 0.66 ? P.lavaClara : v < 0.76 ? P.lavaViva : v < 0.86 ? P.lavaClara : P.lavaPlaca;
    }
    let col;
    if (k === PU) { // puente de losas con pretil hacia la lava
      const l1 = at(-1, 0) === LA || at(1, 0) === LA || at(0, -1) === LA || at(0, 1) === LA, l2 = at(-2, 0) === LA || at(2, 0) === LA || at(0, -2) === LA || at(0, 2) === LA, l3 = at(-3, 0) === LA || at(3, 0) === LA || at(0, -3) === LA || at(0, 3) === LA;
      if (l1) return P.rocBorde; if (l2) return P.rocLuz; if (l3) return P.rocSom;
      col = (wy & 15) === 15 || ((wx + ((wy >> 4) & 1) * 8) & 15) === 15 ? P.pueJunta : P.pue;
    } else if (k === RO) { // roca alta: luz arriba-izquierda, cara oscura al sur, terrazas y grietas
      for (let q = 1; q <= 5; q++) if (at(0, q) !== RO) return q === 1 ? P.rocBorde : P.rocCara;
      if (at(0, -1) !== RO || at(-1, 0) !== RO) col = P.rocLuz;
      else if (at(1, 0) !== RO || at(2, 0) !== RO) col = P.rocSom;
      else {
        const n = nivel(wx, wy);
        if (nivel(wx, wy + 1) < n || nivel(wx, wy + 2) < n || nivel(wx + 1, wy) < n) col = P.rocSom;
        else if (nivel(wx, wy - 1) < n || nivel(wx - 1, wy) < n) col = P.rocLuz;
        else { col = P.roc[n]; const h = hs(wx >> 4, (wy >> 4) + 7001); if (h % 3 === 0) { const a = (wx & 15) - 3 - (h >>> 4) % 5, b = (wy & 15) - 4 - (h >>> 8) % 6; if (a >= 0 && a < 6 && b === (a >> 1)) col = P.rocSom; } }
      }
    } else if (k === CA) { // camino de losas de basalto; la ceniza (o la hierba) se deshace sobre él en tramado
      const otro = (q) => { for (const [dx, dy] of [[-q, 0], [q, 0], [0, -q], [0, q]]) { const v = at(dx, dy); if (v !== CA && v !== PU && v !== LA) return v; } return 0; };
      const v1 = otro(1), v2 = v1 || otro(2), par = (wx + wy) & 1;
      if (v1 && par === 0) col = BASE[v1] || P.cen;
      else if (v1) col = P.camJunta;
      else if (v2 && par === 1 && ((wx >> 1) + (wy >> 1)) % 2 === 0) col = BASE[v2] || P.cen;
      else { const fila = wy >> 4, lx = wx + (fila & 1) * 8, a = lx & 15, b = wy & 15; col = b === 15 || a === 15 ? P.camJunta : (b === 0 || a === 0) && hs(lx >> 4, fila + 3001) % 3 ? P.camLuz : P.cam; } // losas grandes de 16 px, a tresbolillo
    } else if (k === HI) { // hierba seca: borde claro arriba-izquierda, oscuro abajo-derecha, grano fino
      if (at(0, 1) !== HI || at(1, 0) !== HI) col = P.hieSom;
      else if (at(0, -1) !== HI || at(-1, 0) !== HI) col = P.hieLuz;
      else { const h = hs(wx, wy + 5003) % 29; col = h === 0 ? P.hieLuz : h === 1 ? P.hieSom : P.hie; }
    } else { // ceniza: lisa, con montoncitos y piedras con forma, pocos y separados
      col = P.cen;
      const h = hs(wx >> 3, (wy >> 3) + 9001), a = (wx & 7) - 1 - (h >>> 3) % 3, b = (wy & 7) - 2 - (h >>> 6) % 3;
      if (h % 6 === 0) { if (b === 0 && a >= 0 && a < 3) col = P.cenLuz; else if (b === 1 && a >= 1 && a < 5) col = P.cenSom; }
      else if (h % 6 === 1 && a >= 0 && a < 2 && b >= 0 && b < 2) col = a + b === 0 ? P.cenLuz : P.cenSom;
    }
    const d = R.dL[i]; // luz de la lava sobre lo que la rodea: costra y dos bandas duras
    if (d <= 1.5 && k !== PU) return P.orilla;
    if (d <= 5 + ruido(wx, wy, 8, 6) * 3) return mezcla(col, P.calor, 0.4);
    if (d <= 13 + ruido(wx, wy, 10, 9) * 5) return mezcla(col, P.calor, 0.16);
    return col;
  }
  const TEMAS = {
    carbuna: {
      PRIO: { l: 1, '=': 2, c: 3, '.': 4, r: 5, b: 6 },                                  // el de más prioridad se derrama sobre el vecino
      SANGRA: { l: [2.5, 6.5], '=': [0.5, 2.5], c: [2, 6.5], '.': [2, 6] },          // píxeles (mín, máx) que se le meten a cada terreno
      RECTO: 'b', FLUIDO: 'l', color: colorCarbuna,
      BRASAS: { casilla: 25, objetos: { carbuna_grieta: 85 }, colores: [P.lavaViva, P.lavaClara, P.lavaOsc] }, // % de fuentes activas por ciclo
      luz: { color: '#ff8a3c', fuerza: 0.06 },
    },
  };
  const tema = (m) => (m && m.region && TEMAS[m.region]) || null;

  // ── Trama: qué terreno es cada PÍXEL del mapa (bordes ondulados y esquinas redondas) + distancias a la orilla del fluido ──
  const TRAMAS = new WeakMap();
  function distancias(W, H, dentro) { // distancia en píxeles al conjunto «dentro» (dos pasadas, 1 y √2)
    const d = new Float32Array(W * H), D = 1.4142;
    for (let i = 0; i < W * H; i++) d[i] = dentro(i) ? 0 : 1e6;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; let v = d[i]; if (x > 0) v = Math.min(v, d[i - 1] + 1); if (y > 0) { v = Math.min(v, d[i - W] + 1); if (x > 0) v = Math.min(v, d[i - W - 1] + D); if (x < W - 1) v = Math.min(v, d[i - W + 1] + D); } d[i] = v; }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; let v = d[i]; if (x < W - 1) v = Math.min(v, d[i + 1] + 1); if (y < H - 1) { v = Math.min(v, d[i + W] + 1); if (x < W - 1) v = Math.min(v, d[i + W + 1] + D); if (x > 0) v = Math.min(v, d[i + W - 1] + D); } d[i] = v; }
    return d;
  }
  function trama(m, th) {
    let R = TRAMAS.get(m.suelo); if (R) return R;
    const W = m.W * T, H = m.H * T, t = new Uint8Array(W * H), ch = (x, y) => (m.suelo[y] || '')[x], F = K(th.FLUIDO), fluidas = [], idx = new Int16Array(m.W * m.H).fill(-1);
    for (let ty = 0; ty < m.H; ty++) for (let tx = 0; tx < m.W; tx++) {
      const a = ch(tx, ty), pa = th.PRIO[a] || 0, vs = [], s = th.SANGRA[a];
      if (a === th.FLUIDO) { idx[ty * m.W + tx] = fluidas.length; fluidas.push([tx, ty]); }
      if (pa && s) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const b = ch(tx + dx, ty + dy), pb = th.PRIO[b] || 0; if (pb > pa && th.RECTO.indexOf(b) < 0) vs.push([dx, dy, K(b), pb]); }
      for (let ay = 0; ay < T; ay++) for (let ax = 0; ax < T; ax++) {
        const wx = tx * T + ax, wy = ty * T + ay; let mejor = a ? K(a) : 0, bp = pa;
        if (vs.length) { const lim = s[0] + (s[1] - s[0]) * (ruido(wx, wy, 7, 1) * 0.65 + ruido(wx, wy, 3, 2) * 0.35);
          for (const v of vs) { if (v[3] <= bp) continue; const ddx = v[0] < 0 ? ax + 1 : v[0] > 0 ? T - ax : 0, ddy = v[1] < 0 ? ay + 1 : v[1] > 0 ? T - ay : 0; if (Math.hypot(ddx, ddy) <= lim) { mejor = v[2]; bp = v[3]; } } }
        t[wy * W + wx] = mejor;
      }
    }
    const fuentes = fluidas.map(([tx, ty]) => ({ tx, ty, p: th.BRASAS.casilla }));
    m.objetos.forEach((o) => { const p = th.BRASAS.objetos[o.tipo]; if (p) fuentes.push({ tx: o.x, ty: o.y, p }); });
    R = { W, H, t, dL: distancias(W, H, (i) => t[i] === F), dB: distancias(W, H, (i) => t[i] !== F), fluidas, idx, fuentes, atlas: [] };
    TRAMAS.set(m.suelo, R); return R;
  }
  function tramos(c, R, th, tx, ty, f, ox, oy, soloFluido) { // pinta una casilla en tiras horizontales de un color (pocas llamadas)
    const F = K(th.FLUIDO);
    for (let b = 0; b < T; b++) { let ini = 0, col = null; for (let a = 0; a <= T; a++) { const wx = tx * T + a, wy = ty * T + b, v = a < T && !(soloFluido && R.t[wy * R.W + wx] !== F) ? th.color(R, wx, wy, f) : null; if (v !== col) { if (col) { c.fillStyle = col; c.fillRect(ox + ini, oy + b, a - ini, 1); } col = v; ini = a; } } }
  }
  const COLS = 32;
  function cuadro(R, th, f) { // atlas del cuadro f: solo los píxeles de fluido de cada casilla de fluido (se hornea la primera vez que hace falta)
    if (R.atlas[f]) return R.atlas[f];
    const cv = G.makeCanvas(COLS * T, Math.max(1, Math.ceil(R.fluidas.length / COLS)) * T), c = cv.getContext('2d');
    R.fluidas.forEach(([tx, ty], i) => tramos(c, R, th, tx, ty, f, (i % COLS) * T, Math.floor(i / COLS) * T, true));
    return (R.atlas[f] = cv);
  }
  function brasasPx(m, n, x0, x1, y0, y1) { // función pura: [X, Y, color, tamaño] de las brasas en el cuadro n (8 por segundo); máximo 24 a la vez
    const th = tema(m), sal = []; if (!th) return sal;
    const R = trama(m, th), CICLO = 22, VIDA = 14, VAIVEN = [0, 0, 1, 1, 1, 0, 0, -1, -1, -1, 0, 0, 1, 1];
    for (const s of R.fuentes) {
      if (sal.length >= 24) break;
      const X0 = s.tx * T, Y0 = s.ty * T; if (X0 + T < x0 || X0 > x1 || Y0 + T < y0 || Y0 - 24 > y1) continue;
      const u = n + hs(s.tx, s.ty + 77) % CICLO, k = u % CICLO; if (k >= VIDA) continue;
      const h = hs(s.tx * 131 + s.ty, Math.floor(u / CICLO) + 500); if (h % 100 >= s.p) continue;
      sal.push([X0 + 3 + (h >>> 8) % 10 + VAIVEN[k], Y0 + 9 - Math.floor(k * 1.6), th.BRASAS.colores[k < 4 ? 0 : k < 9 ? 1 : 2], k < 3 ? 2 : 1]);
    }
    return sal;
  }

  G.terreno = {
    TEMAS, NF, tema, trama, brasasPx, ruido,
    pinta(c, ch, tx, ty, m) { const th = tema(m); if (!th || !th.PRIO[ch]) return false; tramos(c, trama(m, th), th, tx, ty, 0, tx * T, ty * T, false); return true; }, // casilla del suelo horneado (la llama clasico2d.js)
    animar(ctx, m, cam, VW, VH) { // fluido animado (solo las casillas a la vista, una copia por casilla) y luz de la región; antes de las entidades
      const th = tema(m); if (!th) return;
      const R = trama(m, th), cx = Math.round(cam.x), cy = Math.round(cam.y), f = G.capas.REDUCIDO ? 0 : G.capas.frame(4, NF);
      if (f && R.fluidas.length) { const at = cuadro(R, th, f);
        for (let ty = Math.max(0, Math.floor(cy / T)); ty <= Math.min(m.H - 1, Math.floor((cy + VH) / T)); ty++) for (let tx = Math.max(0, Math.floor(cx / T)); tx <= Math.min(m.W - 1, Math.floor((cx + VW) / T)); tx++) { const i = R.idx[ty * m.W + tx]; if (i >= 0) ctx.drawImage(at, (i % COLS) * T, Math.floor(i / COLS) * T, T, T, tx * T - cx, ty * T - cy, T, T); } }
      if (th.luz && !G.capas.luzDatos.OFF) { ctx.fillStyle = G.capas.luzDatos.rgba(th.luz.color, th.luz.fuerza); ctx.fillRect(0, 0, VW, VH); }
    },
    brasas(ctx, m, cam, VW, VH) { // chispas que suben de la lava y de las grietas; por encima de todo
      if (!tema(m) || G.capas.REDUCIDO) return;
      const cx = Math.round(cam.x), cy = Math.round(cam.y);
      brasasPx(m, Math.floor(G.capas.reloj * 8), cx, cx + VW, cy, cy + VH).forEach(([X, Y, col, s]) => { ctx.fillStyle = col; ctx.fillRect(X - cx, Y - cy, s, s); });
    },
  };

  // ── Decoración de Carbuna (piezas de G.capas; el compositor las coloca solo en su terreno) ──
  const pieza = (filas, pal) => (c) => filas.forEach((f, y) => { for (let x = 0; x < f.length; x++) if (pal[f[x]]) { c.fillStyle = pal[f[x]]; c.fillRect(x, y, 1, 1); } });
  const V = (n) => Array(n).fill('................');
  if (G.capas) {
    G.capas.registrar('carbuna_penasco', { w: 16, h: 16, huella: [[0, 0, 1, 1]], encima: false, dibujar: pieza(V(3).concat([
      '.....kkkkkk.....', '...kkLLLLllkk...', '..kLLLllllllsk..', '..kLllllllllsk..', '.kLlllllllllssk.', '.kLllllllllsssk.', '.kllllllllssssk.', '.kllllllsssssdk.', '.kslllsssssdddk.', '..kssssssddddk..', '...kkddddddkk...', '.....kkkkkk.....', '................']),
      { k: '#2a1b30', L: '#9a8590', l: '#6d5863', s: '#55414d', d: '#3d2c38' }) });
    G.capas.registrar('carbuna_arbol_seco', { w: 16, h: 24, oy: -8, huella: [[0, 0, 1, 1]], encima: false, dibujar: pieza([
      '................', '...k......k.....', '..kTk....kTk....', '..kTk...kTk.....', '...kTk..kTk..k..', '...kTk.kTk..kTk.', '....kTkkTk.kTk..', '.k..kTTTTkkTk...', 'kTk..kTtTTTk....', '.kTkkkTtTTk.....', '..kTTTTttTk.....', '...kkkTttTk.....',
      '......kTtTk.....', '......kTtTk.....', '......kTtTk.....', '......kTtTk.....', '......kTtTk.....', '......kTtTk.....', '.....kTTttTk....', '.....kTtttTk....', '....kTTtttTTk...', '....kTttttttk...', '...kkTtkkttTkk..', '....kkk..kkkk...'],
      { k: '#2a1b30', T: '#6a5460', t: '#44323d' }) });
    G.capas.registrar('carbuna_grieta', { w: 16, h: 16, capa: 'bajo', dibujar: pieza(V(2).concat([
      '................', '................', '..dd....ddd.....', '.dood..dooyd.dd.', '..doyddoddoodod.', '...dood...dyood.', '....dd.....ddd..', '................', '................', '................']).concat(V(4)),
      { d: P.orilla, o: P.lava, y: P.lavaViva }) });
    G.capas.registrar('carbuna_mata', { w: 16, h: 16, capa: 'bajo', dibujar: pieza(V(6).concat([
      '.....a...a......', '..a..ab.ab..a...', '..ab.ab.ab.ab...', '...abbbabbab....', '....bbbbbbb.....', '.....ccccc......']).concat(V(4)),
      { a: '#c9bd6a', b: '#9a9048', c: '#5f6238' }) });
  }
})(typeof window !== 'undefined' ? window : globalThis);
