// cueva2d.js — PINTOR 2D DE LAS PROFUNDIDADES (v2.320). Solo dibujo: no guarda estado de partida ni usa azar del sistema (todo sale del mapa, de G.profundidades.vista y del reloj visual).
// 1) fondo(m): suelo y paredes de un piso horneados píxel a píxel con AUTO-BALDOSAS orgánicas (esquinas redondeadas + borde irregular por ruido, sin contorno cuadriculado), cara frontal de la pared,
//    sombras de contacto (luz arriba-izquierda) y adornos de pared del bioma. 2) elementos(…): objetos del piso (placas, rejas, palancas, rocas, cofres…). 3) luz(…): polvo, niebla, oscuridad con
//    linterna por jugador, antorchas y cristales. 4) mini(…): minimapa que se va revelando. Pendiente del HD-2D: todo este módulo (ver docs/SESION.md).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16, P = () => G.profundidades;
  const h2 = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const mez = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a) => (a === undefined ? 'rgb(' : 'rgba(') + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + (a === undefined ? ')' : ',' + a + ')');
  const TINTA = '#2a1b30', CANAL = { a: '#f7c948', b: '#5fd0e8', c: '#ff7eb6', d: '#9dffb0', atajo: '#f7c948', jefe: '#c08cff', vencer: '#ff6b5e' };
  const colCanal = (c) => { c = String(c || ''); const k = c.indexOf('vencer') === 0 ? 'vencer' : c.indexOf(':') >= 0 ? c.split(':')[1] : c; return CANAL[k] || '#f7c948'; };
  const paleta = (m) => P().D.biomas[m.prof.bioma].paleta;
  const cache = new WeakMap();

  // ── 1) FONDO ──
  // ¿Es roca este píxel? Auto-baldosa: la pared cede 0-2 px (ruido a lo largo del borde) y redondea sus esquinas; el suelo rellena sus rincones.
  function mascara(m) {
    const g = m.prof.g, W = m.W, H = m.H, PW = W * T, PH = H * T, R = 6, R2 = 5, k = m.prof.sem & 1023, M = new Uint8Array(PW * PH);
    const roca = (x, y) => x < 0 || y < 0 || x >= W || y >= H || g[y][x] === '#';
    const n1 = (t, q) => { const a = Math.floor(t / 5), f = (t / 5) - a, v = h2(a, q, k) * (1 - f) + h2(a + 1, q, k) * f; return (v * 3.2) | 0; };
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      const w = roca(tx, ty), L = roca(tx - 1, ty), Rr = roca(tx + 1, ty), U = roca(tx, ty - 1), Dn = roca(tx, ty + 1);
      if (w && L && Rr && U && Dn) { for (let v = 0; v < T; v++) M.fill(1, (ty * T + v) * PW + tx * T, (ty * T + v) * PW + tx * T + T); continue; }
      if (!w && !L && !Rr && !U && !Dn) continue;
      for (let v = 0; v < T; v++) for (let u = 0; u < T; u++) {
        const px = tx * T + u, py = ty * T + v; let r;
        if (w) {
          r = true;
          if ((!L && u < n1(py, tx)) || (!Rr && u > 15 - n1(py, tx + 1)) || (!U && v < n1(px, ty + 77)) || (!Dn && v > 15 - n1(px, ty + 78))) r = false;
          else for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { if ((sx < 0 ? L : Rr) || (sy < 0 ? U : Dn)) continue; const cx = sx < 0 ? R : 15 - R, cy = sy < 0 ? R : 15 - R; if ((u - cx) * sx > 0 && (v - cy) * sy > 0 && Math.hypot(u - cx, v - cy) > R + 0.3) { r = false; break; } }
        } else {
          r = false;
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { if (!(sx < 0 ? L : Rr) || !(sy < 0 ? U : Dn)) continue; const cx = sx < 0 ? R2 : 15 - R2, cy = sy < 0 ? R2 : 15 - R2; if ((u - cx) * sx > 0 && (v - cy) * sy > 0 && Math.hypot(u - cx, v - cy) > R2 + 0.3) { r = true; break; } }
        }
        if (r) M[py * PW + px] = 1;
      }
    }
    return { M, PW, PH };
  }
  function fondo(m) {
    if (cache.has(m)) return cache.get(m);
    const PW = m.W * T, PH = m.H * T, cv = G.makeCanvas(PW, PH), c = cv.getContext('2d'); cache.set(m, cv);
    const img = c.createImageData ? c.createImageData(PW, PH) : null; if (!img || !img.data) return cv;   // entorno de pruebas sin lienzo real
    const pal = paleta(m), C = {}; Object.keys(pal).forEach((q) => { C[q] = rgb(pal[q]); });
    const { M } = mascara(m), g = m.prof.g, d = img.data, k = m.prof.sem & 1023, CARA = 7, INF = 99;
    // distancia (en px, aproximada) de cada píxel de roca al suelo más cercano: dos pasadas
    const dist = new Uint8Array(PW * PH);
    for (let i = 0; i < dist.length; i++) dist[i] = M[i] ? INF : 0;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const i = y * PW + x; if (!dist[i]) continue; let v = dist[i]; if (x > 0) v = Math.min(v, dist[i - 1] + 1); if (y > 0) v = Math.min(v, dist[i - PW] + 1); dist[i] = v; }
    for (let y = PH - 1; y >= 0; y--) for (let x = PW - 1; x >= 0; x--) { const i = y * PW + x; if (!dist[i]) continue; let v = dist[i]; if (x < PW - 1) v = Math.min(v, dist[i + 1] + 1); if (y < PH - 1) v = Math.min(v, dist[i + PW] + 1); dist[i] = v; }
    const pon = (i, col, f) => { const o = i * 4; d[o] = col[0] * f; d[o + 1] = col[1] * f; d[o + 2] = col[2] * f; d[o + 3] = 255; };
    const hielo = rgb(pal.acento), agua = mez(C.suelo, [40, 90, 150], 0.55), espora = rgb(pal.acento);
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const i = y * PW + x, r = h2(x, y, k);
      if (M[i]) {
        let cara = 0; for (let q = 1; q <= CARA; q++) { if (y + q >= PH) break; if (!M[i + q * PW]) { cara = q; break; } }   // suelo justo debajo → cara frontal de la pared
        if (cara) { const estr = ((y + ((x / 5) | 0)) % 4 === 0) ? 0.86 : 1; pon(i, cara === 1 ? C.borde : cara >= CARA - 1 ? C.roca2 : C.cara, cara === 1 ? 1 : estr * (0.82 + 0.05 * cara) * (r < 0.08 ? 0.85 : 1)); continue; }
        const dd = dist[i];
        if (dd <= 1) pon(i, C.borde, 1);
        else if (dd < 9 + r * 4) pon(i, C.roca, (r < 0.06 ? 1.14 : r > 0.94 ? 0.86 : 1) * (dd <= 3 ? 1.1 : 1));
        else if (dd < 15 + r * 6) pon(i, mez(C.roca, C.fondo, 0.6), 1);
        else pon(i, C.fondo, r < 0.02 ? 1.25 : 1);
        continue;
      }
      const tx = x >> 4, ty = y >> 4, ch = g[ty][tx], u = x & 15, v = y & 15; let col = C.suelo, f = 1;
      if (ch === ':') { col = C.fondo; f = v < 5 && g[ty - 1] && g[ty - 1][tx] !== ':' ? 1.6 - v * 0.1 : 0.7; if (v === 0 && g[ty - 1][tx] !== ':') { col = C.borde; f = 1; } }
      else if (ch === 'i') { col = mez(C.suelo, hielo, 0.62); f = ((u + v) % 11 === 0 || (u + v + 3) % 17 === 0) ? 1.12 : r < 0.04 ? 1.1 : 1; }
      else if (ch === 'w') { col = agua; f = (Math.sin(x * 0.7 + Math.sin(y * 0.5) * 2) > 0.92 && v % 3 === 0) ? 1.35 : r < 0.03 ? 1.2 : 1; }
      else { if (h2(x >> 1, y, k + 1) < 0.07) col = C.suelo2; else if (r < 0.012) f = 1.12; if (ch === 'e' && h2(x >> 1, y >> 1, k + 9) < 0.16) { col = espora; f = 0.9; } }
      // sombra de contacto: la pared de arriba (y un poco la de la izquierda) oscurece el suelo
      let s = 1; for (let q = 1; q <= 4; q++) if (y - q >= 0 && M[i - q * PW]) { s = Math.min(s, 0.72 + q * 0.06); break; }
      for (let q = 1; q <= 2; q++) if (x - q >= 0 && M[i - q]) { s = Math.min(s, 0.84 + q * 0.05); break; }
      pon(i, col, f * s);
    }
    c.putImageData(img, 0, 0);
    // adornos de pared (sobre la cara frontal; nunca pisan el paso)
    const R = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    m.prof.deco.forEach((q) => { const x = q.x * T, y = q.y * T, v = h2(q.x, q.y, 5);
      if (q.t === 'antorcha') { R(TINTA, x + 6, y + 6, 4, 8); R('#8a5a34', x + 7, y + 7, 2, 6); R('#c9c2b2', x + 5, y + 10, 6, 1); }
      else if (q.t === 'cristal') { const a = pal.acento, b = pal.acento2; R(TINTA, x + 2, y + 6, 4, 10); R(b, x + 3, y + 7, 2, 9); R(TINTA, x + 6, y + 1, 5, 15); R(a, x + 7, y + 2, 3, 14); R('#ffffff', x + 7, y + 2, 1, 6); R(TINTA, x + 11, y + 8, 4, 8); R(b, x + 12, y + 9, 2, 7); }
      else if (q.t === 'seta') { [[3, 9, pal.acento], [9, 6, pal.acento2]].forEach(([dx, dy, col]) => { R(TINTA, x + dx - 1, y + dy - 1, 7, 4); R(col, x + dx, y + dy, 5, 2); R('#ffffff', x + dx + 1, y + dy, 1, 1); R(TINTA, x + dx + 1, y + dy + 3, 3, 16 - dy - 3); R('#efe6d2', x + dx + 2, y + dy + 3, 1, 16 - dy - 3); }); }
      else if (q.t === 'viga') { R(TINTA, x + 1, y + 4, 14, 4); R('#8a5a34', x + 2, y + 5, 12, 2); R(TINTA, x + 2, y + 7, 4, 9); R('#6b4326', x + 3, y + 7, 2, 9); R(TINTA, x + 10, y + 7, 4, 9); R('#6b4326', x + 11, y + 7, 2, 9); }
      else if (q.t === 'gotera') { R('rgba(10,20,40,0.45)', x + 7, y + 3, 2, 12); R(pal.acento2, x + 7, y + 3, 1, 3); }
      else if (q.t === 'carambano') { for (let n = 0; n < 4; n++) { const hh = 4 + ((h2(q.x + n, q.y, 8) * 7) | 0), xx = x + 1 + n * 4; R(TINTA, xx - 1, y + 8, 4, hh + 1); R(pal.acento, xx, y + 8, 2, hh); R('#ffffff', xx, y + 8, 1, hh - 2); } }
      if (v < 0) R(TINTA, x, y, 1, 1);
    });
    return cv;
  }

  // ── 2) ELEMENTOS ──
  // Dibuja un objeto del piso con su esquina de casilla en (x, y) (px de pantalla del juego). o = entrada de G.profundidades.vista; t = reloj visual.
  function pintarEl(c, o, x, y, t, pal) {
    const R = (col, a, b, w, h) => { c.fillStyle = col; c.fillRect(x + a, y + b, w, h); }, e = o.e || {}, col = colCanal(e.canal), tipo = o.t;
    const gema = (a, b, on) => { R(TINTA, a - 1, b - 1, 5, 5); R(on ? col : '#5a5266', a, b, 3, 3); if (on) R('#ffffff', a, b, 1, 1); };
    if (tipo === 'placa') { R(TINTA, 2, 4, 12, 10); R(o.on ? '#b9b4c4' : '#8a8496', 3, o.on ? 6 : 5, 10, o.on ? 7 : 8); R(o.on ? '#8a8496' : '#6a6478', 3, 12, 10, 1); gema(7, 7, o.on); }
    else if (tipo === 'boton') { R(TINTA, 4, 5, 8, 8); R('#6a6478', 5, 6, 6, 6); R(o.on ? col : '#c9544a', 6, o.on ? 8 : 7, 4, 3); if (!o.on) R('#ff9a8c', 6, 7, 2, 1); }
    else if (tipo === 'runa') { const sol = e.slot === 0, cc = sol ? '#f7c948' : '#8fb4ff', p = 0.5 + 0.5 * Math.sin(t * 3 + e.x);
      R(css(rgb(cc), 0.18 + 0.14 * p), 0, 0, 16, 16); for (let n = 0; n < 4; n++) R(css(rgb(cc), 0.5), 2 + n * 4, ((t * 10 + n * 5) | 0) % 16, 1, 3);
      if (sol) { R(TINTA, 5, 5, 6, 6); R(cc, 6, 6, 4, 4); [[7, 2], [7, 12], [2, 7], [12, 7]].forEach(([a, b]) => R(cc, a, b, 2, 2)); } else { R(TINTA, 5, 4, 6, 8); R(cc, 6, 5, 4, 6); R(TINTA, 8, 5, 3, 4); } }
    else if (tipo === 'teleporte') { const p = ((t * 3) | 0) % 3; R(TINTA, 3, 4, 10, 9); R(pal.acento, 4, 5, 8, 7); R(TINTA, 5, 6, 6, 5); R(p === 0 ? '#ffffff' : pal.acento2, 6 + p, 7 + (p & 1), 2, 2); R(css(rgb(pal.acento), 0.35), 2, 3 - p, 12, 1); }
    else if (tipo === 'subida') { R(TINTA, 1, 2, 14, 13); for (let n = 0; n < 4; n++) { R(n % 2 ? '#d9cfb8' : '#efe6d2', 2, 3 + n * 3, 12 - n * 2, 3); R('#a89c84', 2, 5 + n * 3, 12 - n * 2, 1); } R('#fff9ee', 6, 0, 4, 2); }
    else if (tipo === 'bajada') { R(TINTA, 1, 2, 14, 13); R('#120c1c', 2, 3, 12, 11); for (let n = 0; n < 3; n++) { R(mezHex('#8a8496', '#120c1c', n / 3), 2 + n * 2, 11 - n * 3, 12 - n * 2, 3); } R(pal.acento, 7, 4 + (((t * 2) | 0) % 2), 2, 2); }
    else if (tipo === 'portal') { const p = t * 2.2; R(TINTA, 2, 1, 12, 14); R('#1c1430', 3, 2, 10, 12); for (let n = 0; n < 6; n++) { const a = p + n * 1.05; R(n % 2 ? pal.acento : pal.acento2, 7 + Math.round(Math.cos(a) * 3.4), 7 + Math.round(Math.sin(a) * 4.4), 2, 2); } R('#ffffff', 7, 7, 2, 2); }
    else if (tipo === 'estela') { R(TINTA, 3, -5, 10, 20); R('#8a8496', 4, -4, 8, 18); R('#b9b4c4', 4, -4, 2, 18); for (let n = 0; n < 4; n++) R('#4a4460', 6, -1 + n * 3, 5 - (n % 2), 1); R('#f7c948', 7, 11, 2, 2); }
    else if (tipo === 'cofre') { const rar = e.rar, cu = rar === 'epica' ? '#8a4cc8' : rar === 'rara' ? '#3f7fd6' : '#a8672f', os = rar === 'epica' ? '#5d2e94' : rar === 'rara' ? '#2a5aa0' : '#7a4520';
      R(TINTA, 1, o.abierta ? 0 : 3, 14, o.abierta ? 15 : 12); if (o.abierta) { R(os, 2, 1, 12, 5); R('#1c1430', 2, 6, 12, 3); R('#ffd86b', 5, 7, 2, 1); } else { R(cu, 2, 4, 12, 5); R('#ffffff', 3, 4, 3, 1); } R(os, 2, 9, 12, 5); R('#f7c948', 2, 8, 12, 1); R('#f7c948', 7, 8, 2, 4); R(TINTA, 7, 10, 2, 1); }
    else if (tipo === 'llave') { const b = Math.round(Math.sin(t * 3) * 1.5) - 4; R(TINTA, 4, 3 + b, 7, 7); R('#f7c948', 5, 4 + b, 5, 5); R(TINTA, 7, 6 + b, 1, 1); R(TINTA, 6, 9 + b, 3, 8); R('#f7c948', 7, 9 + b, 1, 7); R('#f7c948', 8, 13 + b, 2, 1); R('#f7c948', 8, 15 + b, 2, 1); R('rgba(30,20,40,0.3)', 5, 13, 6, 2); }
    else if (tipo === 'palanca') { R(TINTA, 3, 6, 10, 9); R('#6a6478', 4, 7, 8, 7); R('#8a8496', 4, 7, 8, 2); const dx = o.on ? 3 : -3; for (let n = 0; n < 7; n++) R(TINTA, 7 + Math.round(dx * n / 6) - 1, 7 - n - 1, 4, 3); for (let n = 0; n < 7; n++) R('#c9c2b2', 7 + Math.round(dx * n / 6), 7 - n, 2, 2); R(TINTA, 6 + dx, -3, 5, 5); R(o.on ? col : '#c9544a', 7 + dx, -2, 3, 3);
      if (e.orden) for (let n = 0; n < e.orden; n++) R('#fff9ee', 5 + n * 3 - (e.orden > 2 ? 1 : 0), 11, 2, 2); }
    else if (tipo === 'bloque') { R('rgba(30,20,40,0.3)', 1, 13, 14, 3); R(TINTA, 1, -1, 14, 16); R('#8a8496', 2, 0, 12, 14); R('#b9b4c4', 2, 0, 12, 4); R('#d8d2e6', 3, 1, 4, 1); R('#6a6478', 2, 10, 12, 4); R('#4a4460', 6, 6, 1, 3); R('#4a4460', 7, 8, 3, 1); }
    else if (tipo === 'tapado') { R(TINTA, 1, 1, 14, 14); R('#8a8496', 2, 2, 12, 12); R('#b9b4c4', 2, 2, 12, 2); R('#6a6478', 2, 12, 12, 2); R('#4a4460', 6, 6, 1, 3); }
    else if (tipo === 'estalagmita') { R('rgba(30,20,40,0.3)', 3, 13, 11, 2); for (let n = 0; n < 12; n++) { const w = 2 + Math.round(n * 0.75); R(TINTA, 8 - (w >> 1) - 1, 2 + n, w + 2, 1); R(n < 5 ? pal.roca2 : pal.roca, 8 - (w >> 1), 2 + n, w, 1); R(pal.roca2, 8 - (w >> 1), 2 + n, 1, 1); } }
    else if (tipo === 'cristal_mapa') { const on = o.on, a = on ? pal.acento : '#6a6478'; R('rgba(30,20,40,0.3)', 2, 13, 12, 2); R(TINTA, 5, -6, 6, 21); R(a, 6, -5, 4, 19); R(on ? '#ffffff' : '#8a8496', 6, -5, 1, 12); R(TINTA, 1, 4, 5, 11); R(on ? pal.acento2 : '#5a5266', 2, 5, 3, 9); R(TINTA, 10, 6, 5, 9); R(on ? pal.acento2 : '#5a5266', 11, 7, 3, 7); if (on && ((t * 3) | 0) % 4 === 0) R('#ffffff', 8, -8, 1, 3); }
    else if (tipo === 'altar') { R(TINTA, 2, 5, 12, 10); R('#b9b4c4', 3, 6, 10, 3); R('#8a8496', 4, 9, 8, 5); const b = o.on ? Math.round(Math.sin(t * 2.5) * 1.5) : 2; R(TINTA, 5, -5 + b, 6, 6); R(o.on ? pal.acento : '#5a5266', 6, -4 + b, 4, 4); if (o.on) R('#ffffff', 6, -4 + b, 2, 1); }
    else if (tipo === 'evento') { R(TINTA, 3, -4, 10, 19); R('#4a4460', 4, -3, 8, 17); R('#6a6478', 4, -3, 3, 17); R(TINTA, 5, 0, 6, 4); if (o.on) { R('#f7c948', 6, 1, 1, 2); R('#f7c948', 9, 1, 1, 2); } R('#8a5a34', 5, 9, 6, 3); R('#f7c948', 6, 9, 4, 1); }
    else if (tipo === 'hoguera') { R(TINTA, 2, 9, 12, 6); R('#6b4326', 3, 10, 10, 2); R('#8a5a34', 4, 12, 8, 2); const f = ((t * 8) | 0) % 3; R('#e4663a', 5, 2 + f, 6, 8 - f); R('#f7c948', 6, 4 + f, 4, 6 - f); R('#fff4dc', 7, 6 + (f & 1), 2, 3); R('#e4663a', 6 + f, 0 + f, 2, 2); }
    else if (tipo === 'mercader') { R('#8a3a4a', 1, 12, 14, 3); R('#f7c948', 2, 13, 12, 1); }
    else if (tipo === 'puerta' && e.estilo === 'puente') { if (o.abierta) { R(TINTA, 0, 2, 16, 12); for (let n = 0; n < 4; n++) { R('#a8672f', n * 4, 3, 3, 10); R('#c98a4a', n * 4, 3, 1, 10); } R('#6b4326', 0, 4, 16, 1); R('#6b4326', 0, 11, 16, 1); } else { R(TINTA, 0, 1, 2, 4); R(col, 0, 2, 1, 2); R(TINTA, 14, 1, 2, 4); R(col, 15, 2, 1, 2); } }
    else if (tipo === 'puerta' && e.estilo === 'sello') { if (!o.abierta) { const p = 0.5 + 0.5 * Math.sin(t * 4); R(TINTA, 0, -6, 16, 22); R(css(rgb(col), 0.55 + 0.25 * p), 1, -5, 14, 20); for (let n = 0; n < 3; n++) R('#ffffff', 3 + n * 4, -3 + (((t * 6) | 0) + n * 5) % 16, 1, 2); R(TINTA, 5, 1, 6, 6); R('#fff4dc', 6, 2, 4, 4); R(TINTA, 7, 3, 2, 2); } else { R(TINTA, 0, 9, 3, 6); R(col, 1, 10, 1, 4); R(TINTA, 13, 9, 3, 6); R(col, 14, 10, 1, 4); } }
    else if (tipo === 'puerta') { R(TINTA, 0, -6, 3, 21); R('#8a8496', 1, -5, 1, 19); R(TINTA, 13, -6, 3, 21); R('#8a8496', 14, -5, 1, 19); if (!o.abierta) { R(TINTA, 2, -5, 12, 3); R('#6a6478', 2, -4, 12, 1); for (let n = 0; n < 3; n++) { R(TINTA, 3 + n * 4, -3, 3, 18); R('#b9b4c4', 4 + n * 4, -3, 1, 17); } R(TINTA, 2, 6, 12, 3); R('#6a6478', 2, 7, 12, 1); } gema(6, -8, o.abierta); if (e.inv) { R(TINTA, 5, -3, 6, 1); R('#fff9ee', 6, -3, 4, 1); } }
    else if (tipo === 'cerradura') { if (!o.abierta) { R(TINTA, 0, -6, 16, 22); R('#8a5a34', 1, -5, 14, 20); R('#a8672f', 1, -5, 4, 20); R('#6b4326', 8, -5, 1, 20); R(TINTA, 4, 1, 8, 8); R('#f7c948', 5, 2, 6, 6); R(TINTA, 7, 4, 2, 3); R(TINTA, 5, -2, 6, 4); R('#c9c2b2', 6, -1, 4, 2); R(TINTA, 7, -1, 2, 2); } else { R(TINTA, 0, -6, 3, 21); R('#8a5a34', 1, -5, 1, 19); R(TINTA, 13, -6, 3, 21); R('#8a5a34', 14, -5, 1, 19); } }
    else if (tipo === 'grieta') { if (!o.abierta) { R(TINTA, 0, -4, 16, 20); R(pal.roca, 1, -3, 14, 18); R(pal.roca2, 1, -3, 14, 3); R(pal.cara, 1, 9, 14, 6); [[7, -3, 1, 5], [8, 1, 1, 4], [6, 4, 2, 1], [5, 5, 1, 5], [9, 5, 2, 1], [10, 6, 1, 4], [6, 10, 1, 4]].forEach(([a, b, w, h]) => R(TINTA, a, b, w, h)); if (((t * 2) | 0) % 3 === 0) R('#c9c2b2', 4 + (((t * 7) | 0) % 8), 12, 1, 1); } else { R(pal.roca, 0, 11, 3, 3); R(pal.cara, 13, 10, 3, 4); R(pal.roca2, 5, 13, 2, 1); } }
  }
  const mezHex = (a, b, t) => css(mez(rgb(a), rgb(b), t));
  const ALTOS = { puerta: 1, cerradura: 1, grieta: 1, palanca: 1, cofre: 1, bloque: 1, estela: 1, altar: 1, evento: 1, hoguera: 1, estalagmita: 1, cristal_mapa: 1, llave: 1 };
  // Objetos del piso para el pintor: los planos (placas, runas, escaleras…) se pintan ya; los altos se devuelven para ordenarlos por Y con jugadores y criaturas.
  function elementos(ctx, est, m, cam, VW, VH, t) {
    const pal = paleta(m), altos = [];
    P().vista(est, m).forEach((o) => {
      if (o.oculto || o.t === 'jefe') return; const x = o.x * T - cam.x, y = o.y * T - cam.y; if (x < -T * 2 || y < -T * 2 || x > VW + T || y > VH + T * 2) return;
      const alto = ALTOS[o.t] && !(o.t === 'puerta' && o.e.estilo === 'puente') && !((o.t === 'puerta' || o.t === 'cerradura' || o.t === 'grieta') && o.abierta && false);
      if (alto) altos.push({ y: o.y * T + 15, cueva: o }); else pintarEl(ctx, o, Math.round(x), Math.round(y), t, pal);
    });
    m.prof.deco.forEach((q) => { const x = Math.round(q.x * T - cam.x), y = Math.round(q.y * T - cam.y); if (x < -T || y < -T || x > VW || y > VH) return;   // llamas y gotas (animadas)
      if (q.t === 'antorcha') { const f = ((t * 8 + q.x) | 0) % 3; ctx.fillStyle = '#e4663a'; ctx.fillRect(x + 6, y + 1 + f, 4, 6 - f); ctx.fillStyle = '#f7c948'; ctx.fillRect(x + 7, y + 3 + f, 2, 4 - f); ctx.fillStyle = '#e4663a'; ctx.fillRect(x + 6 + f, y - 1 + f, 1, 2); }
      else if (q.t === 'gotera') { const p = (t * 0.7 + q.x * 0.37) % 1; ctx.fillStyle = pal.acento2; ctx.fillRect(x + 7, y + 6 + Math.round(p * p * 18), 1, 2); } });
    return altos;
  }
  function pintarAlto(ctx, o, cam, t, m) { pintarEl(ctx, o, Math.round(o.x * T - cam.x), Math.round(o.y * T - cam.y), t, paleta(m)); }

  // ── 3) LUZ Y ATMÓSFERA ──
  let lz = null;
  function luz(ctx, est, m, cam, VW, VH, t, yo) {
    const B = P().D.biomas[m.prof.bioma], pal = B.paleta, nie = rgb(pal.niebla), reduc = G.capas && G.capas.REDUCIDO;
    // polvo en suspensión y niebla baja (antes de la oscuridad: solo se ven donde hay luz)
    for (let n = 0; n < 26; n++) { const a = h2(n, 3, 1), b = h2(n, 7, 2), x = ((a * VW + t * (4 + 9 * b) * (reduc ? 0 : 1)) % VW + VW) % VW, y = ((b * VH + Math.sin(t * 0.6 + n) * 6 - t * 2 * a * (reduc ? 0 : 1)) % VH + VH) % VH; ctx.fillStyle = css(nie, 0.25 + 0.3 * a); ctx.fillRect(x | 0, y | 0, 1, 1); }
    for (let n = 0; n < 4; n++) { const y = ((h2(n, 1, 9) * VH + Math.sin(t * 0.25 + n * 2) * 10) | 0), x = ((Math.sin(t * 0.12 + n * 1.7) * 30) | 0); ctx.fillStyle = css(nie, 0.035); ctx.fillRect(x - 40, y, VW + 80, 9); ctx.fillRect(x - 10, y + 3, VW + 80, 5); }
    if (!lz || lz.width !== VW || lz.height !== VH) { lz = G.makeCanvas(VW, VH); }
    const c = lz.getContext('2d'); if (!c.arc) return; const osc = m.prof.piso === 0 ? Math.min(0.5, B.luz.oscuridad) : B.luz.oscuridad;
    c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, VW, VH); c.fillStyle = 'rgba(10,7,22,' + osc + ')'; c.fillRect(0, 0, VW, VH); c.globalCompositeOperation = 'destination-out';
    const focos = [];
    Object.values(est.jugadores).forEach((j) => { if (j.mapa !== m.id) return; const r = P().resumen(est, j); focos.push({ x: j.x, y: j.y - 8, r: (r ? r.luz : 4) * T, c: '#ffe2a8', k: 0.05 }); });
    m.prof.luces.forEach((q, n) => focos.push({ x: q.x * T + 8, y: q.y * T + 8, r: q.r * T * (q.f && !reduc ? 1 + 0.05 * Math.sin(t * 9 + n * 2.1) + 0.03 * Math.sin(t * 23 + n) : 1), c: q.c, k: 0.09 }));
    const vis = focos.filter((f) => f.x - cam.x > -f.r && f.y - cam.y > -f.r && f.x - cam.x < VW + f.r && f.y - cam.y < VH + f.r);
    vis.forEach((f) => { const x = Math.round(f.x - cam.x), y = Math.round(f.y - cam.y); [[1, 0.22], [0.84, 0.38], [0.66, 0.55], [0.5, 1]].forEach(([k, a]) => { c.fillStyle = 'rgba(0,0,0,' + a + ')'; c.beginPath(); c.arc(x, y, f.r * k, 0, 6.2832); c.fill(); }); });
    ctx.drawImage(lz, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; vis.forEach((f) => { const x = Math.round(f.x - cam.x), y = Math.round(f.y - cam.y); ctx.fillStyle = css(rgb(f.c), f.k); ctx.beginPath(); ctx.arc(x, y, f.r * 0.62, 0, 6.2832); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, f.r * 0.34, 0, 6.2832); ctx.fill(); }); ctx.restore();
    // la runa de cada jugador sobre su cabeza (sol = primer jugador de la expedición, luna = segundo), solo si el piso tiene runas
    if (m.prof.els.some((e) => e.t === 'runa')) Object.values(est.jugadores).forEach((j) => { if (j.mapa !== m.id) return; const s = P().slotDe(est, j), x = Math.round(j.x - cam.x) - 3, y = Math.round(j.y - cam.y) - 31, R = (col, a, b, w, h) => { ctx.fillStyle = col; ctx.fillRect(x + a, y + b, w, h); };
      R(TINTA, 0, 0, 7, 7); if (s === 0) { R('#f7c948', 1, 1, 5, 5); R(TINTA, 1, 1, 1, 1); R(TINTA, 5, 1, 1, 1); R(TINTA, 1, 5, 1, 1); R(TINTA, 5, 5, 1, 1); } else { R('#8fb4ff', 1, 1, 5, 5); R(TINTA, 3, 1, 3, 3); } });
  }

  // ── 4) MINIMAPA CON NIEBLA ──
  function mini(cv, est, m, yo, t) {
    const Pr = P(), s = Pr.ps(est, m), E = 2, W = m.W, H = m.H; if (cv.width !== W * E) { cv.width = W * E; cv.height = H * E; } const c = cv.getContext('2d'); if (!c.fillRect) return;
    const pal = paleta(m), v = s ? Pr.visto(m, s) : null, g = m.prof.g, ve = (x, y) => !v || v.a[((y / Pr.VB) | 0) * v.w + ((x / Pr.VB) | 0)];
    c.clearRect(0, 0, cv.width, cv.height); c.fillStyle = 'rgba(20,12,30,0.82)'; c.fillRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (g[y][x] === '#' || !ve(x, y)) continue; c.fillStyle = g[y][x] === ':' ? '#120c1c' : g[y][x] === 'i' ? pal.acento2 : pal.suelo; c.fillRect(x * E, y * E, E, E); }
    Pr.vista(est, m).forEach((o) => { if (o.oculto || !ve(o.x, o.y)) return; const col = o.t === 'bajada' ? '#5fd0e8' : o.t === 'subida' ? '#fff9ee' : o.t === 'cofre' && !o.abierta ? '#f7c948' : o.t === 'llave' ? '#f7c948' : (o.t === 'puerta' || o.t === 'cerradura') && !o.abierta ? '#ff6b5e' : o.t === 'portal' ? pal.acento : null; if (!col) return; c.fillStyle = col; c.fillRect(o.x * E - (o.t === 'bajada' || o.t === 'subida' ? 1 : 0), o.y * E - (o.t === 'bajada' || o.t === 'subida' ? 1 : 0), o.t === 'bajada' || o.t === 'subida' ? E + 2 : E, o.t === 'bajada' || o.t === 'subida' ? E + 2 : E); });
    Object.values(est.jugadores).forEach((j) => { if (j.mapa !== m.id) return; const x = Math.floor(j.x / T) * E, y = Math.floor(j.y / T) * E, mio = j === yo; c.fillStyle = TINTA; c.fillRect(x - 2, y - 2, E + 4, E + 4); c.fillStyle = mio ? (((t * 3) | 0) % 2 ? '#ffffff' : '#e4663a') : '#9dffb0'; c.fillRect(x - 1, y - 1, E + 2, E + 2); });
  }
  G.cueva2d = { fondo, mascara, elementos, pintarAlto, pintarEl, luz, mini, paleta, colCanal };
})(typeof window !== 'undefined' ? window : globalThis);
