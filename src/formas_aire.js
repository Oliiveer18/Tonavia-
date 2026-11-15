// formas_aire.js — dibujos de las criaturas de elemento principal Aire (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo).
// Criaturas de este archivo: dandel, nubecin, zefirax.
// Los ayudantes comunes vienen de src/formas_base.js (G.F); cada archivo es su propio bloque (function () {...})(), así que los nombres locales no chocan entre archivos.
(function () {
  'use strict';
  const G = window.G, P = G.PAL;
  const { mk, inEll, set, def2 } = G.F;

  // Nimbel 20×12 · ancha y baja: nube que flota
  set('nubecin', [20, 12], (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), up = f ? 1 : 0, shade = '#b7d5ee';
    const circles = side ? [[6, 7, 3], [13.3, 7, 2.9], [8, 5, 3.4], [11.5, 5, 3.4], [10, 7, 4]] : [[5, 7, 3.2], [14.8, 7, 3.2], [7.8, 5, 3.6], [12.4, 4.8, 3.8], [10, 7, 4.4]];
    px(shade, 7, 10, 2, 2); px(shade, 12, 10, 2, 2);
    for (let y = 0; y <= 9; y++) for (let x = 0; x < W; x++) if (circles.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - (cy - up)) ** 2 <= r * r)) px(y >= 8 ? shade : P.white, x, y);
    if (dir === 'up') { px(shade, 9, 5, 2, 2); px(shade, 8, 6); px(shade, 11, 4); return; }
    if (!side) { px(P.ink, 6, 5, 2, 2); px(P.ink, 12, 5, 2, 2); px(P.white, 6, 5); px(P.white, 12, 5); px(P.pink2, 3, 7, 2, 1); px(P.pink2, 15, 7, 2, 1); px(P.ink, 9, 7, 2, 1); }
    else { px(P.ink, 5, 5, 2, 2); px(P.white, 5, 5); px(P.pink2, 4, 7, 2, 1); px(shade, 17, 7); px(shade, 18, 6); }
  });

  // Dandel · Aire · Común · 14×18 · 0,05 kg: diente de león vivo (en el hueco de Oli 1 va la propuesta de reserva de Claude). Bola de paracaídas blancos sobre un tallo fino, con hojitas y carita.
  // Rasgo propio: flota siempre y a veces se le desprende una semilla (frame 2, `flick`).
  const DAN = { w: '#f4f1ff', wL: '#ffffff', wD: '#cfd6f2', wDD: '#a9b2e0', g: '#5dae5a', gD: '#3d8446', gL: '#8fd484', y: '#f7d54a', pk: '#f5a8bd' };

  const dandelDraw = (c, dir, f, px0, W, H) => {
    const { side, px } = mk(dir, px0, W), back = dir === 'up', front = dir === 'down', up = f === 1 ? 1 : 0, fl = f === 2, D = DAN, y0 = -up, INK = '#2a1b30', sw = f === 1 ? 1 : 0;
    // tallo con hojitas y raicillas (se mece 1 px en el paso)
    for (let y = 11; y <= 15; y++) px(y % 2 ? D.g : D.gD, 6 + (y > 13 ? sw : 0), y, 2, 1);
    [[5, 13], [4, 13], [3, 12], [2, 12], [2, 11], [8, 13], [9, 13], [10, 12], [11, 12], [11, 11]].forEach(([x, y], i) => px(i % 5 < 2 ? D.g : i % 5 === 4 ? D.gL : D.gD, x, y));
    px(D.gD, 5 + sw, 16); px(D.gD, 8 + sw, 16); px(D.gD, 6 + sw, 17, 2, 1);
    // base amarilla (cáliz) y cabeza esponjosa de semillas con el borde deshilachado
    px(D.y, 5, 10 + y0, 4, 1); px(D.gD, 5, 10 + y0); px(D.gD, 8, 10 + y0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!inEll(x, y, 6.9, 5.4 + y0, 6.1, 5.4)) continue; const yy = y - y0, edge = !inEll(x - 1, y, 6.9, 5.4 + y0, 6.1, 5.4) || !inEll(x + 1, y, 6.9, 5.4 + y0, 6.1, 5.4) || !inEll(x, y - 1, 6.9, 5.4 + y0, 6.1, 5.4) || !inEll(x, y + 1, 6.9, 5.4 + y0, 6.1, 5.4); if (edge && (x * 7 + yy * 3) % 5 === 0) continue; const d = (x - 5) + (yy - 3); px(edge ? D.wD : d < 2 ? D.wL : d > 9 ? D.wDD : (x * 2 + yy) % 5 === 0 ? D.wD : D.w, x, y); }
    if (back) { [[4, 3], [7, 2], [9, 5], [5, 7], [8, 8], [3, 6], [10, 8]].forEach(([x, y]) => px(D.wDD, x, y + y0)); }
    else if (front) { px(INK, 4, 5 + y0, 2, 2); px(INK, 8, 5 + y0, 2, 2); px(D.wL, 4, 5 + y0); px(D.wL, 8, 5 + y0); px(D.pk, 2, 7 + y0, 2, 1); px(D.pk, 10, 7 + y0, 2, 1); px(INK, 6, 8 + y0, 2, 1); }
    else { px(INK, 3, 5 + y0, 2, 2); px(D.wL, 3, 5 + y0); px(D.pk, 2, 7 + y0, 2, 1); px(INK, 2, 8 + y0, 2, 1); [[9, 4], [10, 7]].forEach(([x, y]) => px(D.wDD, x, y + y0)); }
    // frame 2: se desprende una semilla-paracaídas que sube
    if (fl) { px(D.wL, 12, 0); px(D.w, 11, 1); px(D.w, 13, 1); px(D.wD, 12, 2); px(D.wD, 12, 3); }
  };

  def2('dandel', dandelDraw);

  // ═══ Bloque 2 · lote D (v2.0): Zefirax (Aire + Eléctrico, Legendaria, fase única 30×30, 12 kg). Serpiente del viento: cinta en «S», cabeza de dragón con crin de nubes, cola que se deshace en jirones. ═══
  // Cada vista tiene su propio dibujo (trazado de la cinta, cabeza y crin): frente con cara, espalda sin cara, perfil con la cabeza en 3/4 (los dos ojos visibles). El perfil derecho es el izquierdo reflejado.
  // Rasgo propio: flota siempre, majestuosa y lenta (`float`); parada, la cinta ondula y descarga rayos con más destellos de aura (frame 2, `flick`).
  (function () {
    const SZ = 30, K = SZ / 32; // 30×30 (v2.1): trazado pensado en 32 y reducido, cabezas redibujadas
    const Z = { W: '#e6f2ff', w: '#b3b0e6', C: '#7ec8f2', N: '#26337f', Y: '#ffe433', G: '#f2b632', H: '#ffffff', K: P.ink };
  const newBuf = () => Array.from({ length: SZ }, () => Array(SZ).fill(null));
  const put = (b, x, y, col) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < SZ && y < SZ) b[y][x] = col; };
  const blit = (b, map, x0, y0) => map.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.' && ch !== ' ') put(b, x0 + i, y0 + j, Z[ch]); } });
  function spline(pts, n) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t, q = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  // cinta: pts de la cabeza a la cola; bs = lado del vientre; mode = 'side' | 'front' | 'back'
  function ribbon(b, pts, bs, mode) {
    const S = spline(pts, 14).reverse(), N = S.length - 1; // de la cola (u=0) a la cabeza (u=1)
    const hwOf = (u) => (u < 0.2 ? 0.8 + 0.9 * (u / 0.2) : u < 0.45 ? 1.7 + 0.8 * ((u - 0.2) / 0.25) : u < 0.88 ? 2.5 : 2.5 + 0.4 * ((u - 0.88) / 0.12));
    const nrm = S.map((p, i) => { const a = S[Math.max(0, i - 1)], c = S[Math.min(N, i + 1)], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1; return [bs * -dy / l, bs * dx / l]; });
    const marks = [0.3, 0.42, 0.54, 0.66, 0.78, 0.9];
    for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {
      const px = x + 0.5, py = y + 0.5; let bi = -1, bd = 1e9;
      for (let i = 0; i <= N; i++) { const d = Math.hypot(px - S[i][0], py - S[i][1]); if (d < bd) { bd = d; bi = i; } }
      const u = bi / N, hw = hwOf(u); if (bd > hw) continue;
      const v = ((px - S[bi][0]) * nrm[bi][0] + (py - S[bi][1]) * nrm[bi][1]) / hw; // -1 lomo … +1 vientre
      const tick = marks.some((m) => Math.abs(u - m) < 0.011);
      let col;
      if (mode === 'side') col = v < -0.5 ? Z.W : v < 0.12 ? Z.C : v < 0.38 ? Z.w : Z.N;
      else if (mode === 'front') col = Math.abs(v) > 0.74 ? Z.W : Math.abs(v) > 0.4 ? Z.C : Z.N;
      else col = Math.abs(v) > 0.72 ? Z.w : Math.abs(v) > 0.3 ? Z.C : Z.W;
      if (tick && u > 0.25) { if (mode === 'side' && v > -0.45 && v < 0.1) col = Z.Y; else if (mode === 'front' && Math.abs(v) < 0.42) col = Z.Y; else if (mode === 'back' && Math.abs(v) < 0.3) col = Z.Y; }
      b[y][x] = col;
    }
    return { S, N, nrm, hwOf };
  }
  function puff0(b, cx, cy, r) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy > r * r) continue;
      put(b, x, y, dx + dy > r * 0.55 ? Z.w : dx + dy < -r * 0.9 && r >= 2.5 ? Z.H : Z.W);
    }
  }
  function puff(b, cx, cy, r) { puff0(b, cx * K, cy * K, r); }
  function trail(b, S) { // la cola se deshace en jirones de viento: motas cada vez más pequeñas
    const e = S[0], q = S[10], l = Math.hypot(e[0] - q[0], e[1] - q[1]) || 1, dx = (e[0] - q[0]) / l, dy = (e[1] - q[1]) / l, nx = -dy, ny = dx;
    [[3.6, 0.8, 3, 2, Z.W], [7, -1, 2, 2, Z.C], [10, 0.8, 2, 1, Z.W], [12.8, -0.6, 1, 1, Z.C]].forEach(([k, c, w, h, col]) => { const x = e[0] + dx * k + nx * c, y = e[1] + dy * k + ny * c; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(b, x + i - w / 2, y + j - h / 2, col); });
  }
  function wisp(b, pts, cols) { const S = spline(pts, 8); S.forEach((p, i) => { if (i % 3 !== 2) put(b, p[0], p[1], cols[i % cols.length]); }); }
  function star(b, x, y, big) { x = Math.round(x * K); y = Math.round(y * K); put(b, x, y, Z.H); put(b, x - 1, y, Z.Y); put(b, x + 1, y, Z.Y); put(b, x, y - 1, Z.Y); put(b, x, y + 1, Z.Y); if (big) { put(b, x - 2, y, Z.Y); put(b, x + 2, y, Z.Y); } }
  function dot(b, x, y) { x = Math.round(x * K); y = Math.round(y * K); put(b, x, y, Z.Y); }
  function bolt(b, pts) { pts = pts.map(([x, y]) => [Math.round(x * K), Math.round(y * K)]); pts.forEach(([x, y], i) => { put(b, x, y, i % 2 ? Z.H : Z.Y); const q = pts[i + 1]; if (q) { const mx = (x + q[0]) / 2, my = (y + q[1]) / 2; put(b, mx, my, Z.Y); } }); }
  const wave = (pts, f) => pts.map((p, i) => { const k = i / (pts.length - 1), a = f === 1 ? 1.1 : f === 2 ? -1.3 : 0; return [p[0] * K + a * Math.sin(i * 1.9) * k, p[1] * K + a * Math.cos(i * 1.5) * k * 0.8]; });

  // ── cabezas (dibujo propio de cada vista) ──
  const HEAD_FRONT = [
    'G...GG...G',
    'GG..GG..GG',
    '.GCCYYCCG.',
    '.CCCYYCCC.',
    'CNCCCCCCNC',
    'CYYCCCCYYC',
    'CYKCCCCKYC',
    '.CWWWWWWC.',
    '..WWKKWW..',
    '...wWWw...',
  ];
  const HEAD_BACK = [
    'G...GG...G',
    'GG..GG..GG',
    '.GCCCCCCG.',
    '.CCCCCCCC.',
    'CCCCCCCCCC',
  ];
  const HEAD_SIDE = [ // mira a la izquierda, vista 3/4: se ven los dos ojos y el hocico sale hacia delante
    '..........G',
    '........GGG',
    '.....CCCCGC',
    '...CCCCCCCC',
    '..CNNCNNCCC',
    '..CYYCYYCCC',
    '.CCYKCYKCCC',
    'WWWWCCCCCC.',
    'WKWWWWwwww.',
    '.wWWWww....',
  ];

  function drawZ(c, dir, f, px) {
    const b = newBuf();
    const mirror = dir === 'right', d = mirror ? 'left' : dir;
    if (d === 'down') {
      star(b, 4, 6, f === 2); star(b, 27, 9, false); dot(b, 3, 27); dot(b, 29, 20); if (f !== 1) dot(b, 28, 4); if (f === 2) { star(b, 4, 20, false); star(b, 28, 27, false); }
      const R = ribbon(b, wave([[16, 11.5], [11, 12.5], [6.5, 16.5], [10, 21], [17, 22], [23.5, 24.5], [24.5, 28], [19.5, 30], [13, 29.5], [8.5, 27]], f), 1, 'front');
      trail(b, R.S);
      puff(b, 10, 9, 3); puff(b, 22, 9, 3); puff(b, 11, 12, 2.5); puff(b, 21, 12, 2.5); puff(b, 13, 4, 2.5); puff(b, 19, 4, 2.5); puff(b, 16, 3, 2.5);
      blit(b, HEAD_FRONT, 10, 2);
      if (f === 2) { bolt(b, [[23, 14], [26, 16], [25, 18], [29, 20]]); bolt(b, [[7, 24], [4, 26], [6, 28]]); }
    } else if (d === 'up') {
      star(b, 27, 6, f === 2); star(b, 4, 9, false); dot(b, 28, 27); dot(b, 2, 20); if (f !== 1) dot(b, 3, 4); if (f === 2) { star(b, 27, 20, false); star(b, 4, 27, false); }
      const R = ribbon(b, wave([[16, 11.5], [21, 12.5], [25.5, 16.5], [22, 21], [15, 22], [8.5, 24.5], [7.5, 28], [12.5, 30], [19, 29.5], [23.5, 27]], f), -1, 'back');
      trail(b, R.S);
      puff(b, 10, 9, 3); puff(b, 22, 9, 3);
      blit(b, HEAD_BACK, 10, 2);
      puff(b, 12.5, 8.5, 3); puff(b, 19.5, 8.5, 3); puff(b, 16, 8.5, 3.2); puff(b, 11.5, 11.5, 3); puff(b, 20.5, 11.5, 3); puff(b, 16, 11.5, 3);
      if (f === 2) { bolt(b, [[9, 15], [6, 17], [7, 19], [3, 21]]); bolt(b, [[24, 24], [27, 26], [25, 28]]); }
    } else {
      star(b, 27, 4, f === 2); star(b, 4, 21, false); dot(b, 29, 14); dot(b, 3, 28); if (f !== 1) dot(b, 20, 3); if (f === 2) { star(b, 28, 21, false); dot(b, 3, 3); }
      const R = ribbon(b, wave([[12.5, 12], [18, 9.5], [23.5, 13], [23, 18], [15, 20.5], [8.5, 24], [11.5, 28], [19, 29.5], [25, 28], [27.5, 24.5]], f), -1, 'side');
      trail(b, R.S);
      [[0.96, 3], [0.89, 2.8], [0.82, 2.5], [0.75, 2.2], [0.68, 1.8]].forEach(([u, r]) => { const i = Math.round(u * R.N), p = R.S[i], n = R.nrm[i], h = R.hwOf(u); puff0(b, p[0] - n[0] * h, p[1] - n[1] * h, r); });
      blit(b, HEAD_SIDE, 1, 4);
      if (f === 2) { bolt(b, [[26, 14], [29, 16], [28, 18], [31, 21]]); bolt(b, [[7, 21], [4, 24], [6, 26]]); }
    }
    for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) if (b[y][x]) px(b[y][x], mirror ? SZ - 1 - x : x, y);
  }
    def2('zefirax', drawZ);
    G.ZEFIRAX_CABEZAS = { paleta: Z, frente: HEAD_FRONT, espalda: HEAD_BACK, perfil: HEAD_SIDE };   // v2.169: los dibujos de la cabeza, para que el módulo 3D (src/criatura3d.js) los recorte tal cual
  })();
})();
