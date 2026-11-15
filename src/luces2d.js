// luces2d.js — ILUMINACIÓN 2D DE DÍA/NOCHE (v2.328). Solo dibujo (sin estado de partida ni Math.random): con el reloj del ciclo (src/ciclo.js) construye un MAPA DE LUZ del tamaño de la vista
// (color ambiente + focos escalonados, estilo pixel art) y lo multiplica sobre el juego; después suma un brillo suave en farolas y ventanas. Las luces son DATOS (tablas de abajo): cosa nueva = una entrada.
// v2.336: fuente con luz sumergida, reflejos en el agua, filo de luz en personajes, atardecer con tinte dorado, polillas y polvo, criaturas de fuego/eléctricas que brillan y niebla de madrugada.
// Interruptores: ?luces=0 (vuelve al velo antiguo), ?noche=suave (noche menos cerrada). Cuevas, interiores y HD-2D no pasan por aquí (activo() lo dice).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  const Q = (() => { try { return typeof location !== 'undefined' ? (location.search || '') : ''; } catch (e) { return ''; } })();
  const OFF = /[?&]luces=0/.test(Q), SUAVE = /[?&]noche=suave/.test(Q);
  const CAL = [255, 190, 100], FRIO = [120, 230, 220], LAVA = [255, 110, 40], AMB = [255, 214, 140], FUENTE = [90, 225, 215];
  const lim = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
  // Edificios: ventanas [x,y,w,h] y puerta [x,y] en píxeles del sprite; horas = [desde, hasta] en que están encendidas (null = toda la noche); cierra = clave de horario de servicio (apagadas si cerrado)
  const EDIF = {
    tienda:      { vent: [[7, 35, 20, 18], [55, 35, 20, 18]], puerta: [41, 82], cierra: 'tienda', c: CAL },
    centro_pc:   { vent: [[8, 43, 20, 19], [32, 43, 20, 19], [62, 43, 20, 19], [86, 43, 20, 19]], puerta: [57, 98], c: CAL },
    casa_lali:   { vent: [[15, 65, 14, 13], [63, 65, 14, 13]], puerta: [47, 100], horas: [17.5, 23.5], c: CAL },
    casa_oli:    { vent: [[15, 65, 14, 13], [63, 65, 14, 13]], puerta: [47, 100], horas: [17.5, 23.5], c: CAL },
    laboratorio: { vent: [[7, 64, 16, 29], [68, 64, 16, 29], [31, 34, 28, 12]], puerta: [47, 112], c: FRIO },
    ermita:      { vent: [[10, 54, 10, 20], [62, 54, 10, 20], [32, 17, 18, 18]], puerta: [41, 92], horas: [18, 23], c: AMB },
  };
  // Focos puntuales (tipo de objeto → [{x,y (sprite), r (radio px), c, a (fuerza), p (parpadeo), s: suelo = charco aplastado, cab: brillo en la cabeza}])
  const PUNTOS = {
    farola:          [{ x: 5, y: 38, r: 38, c: CAL, a: 1, s: 1 }, { x: 5, y: 4, r: 10, c: CAL, a: 1, cab: 1 }],
    brasero_carbuna: [{ x: 7, y: 20, r: 40, c: LAVA, a: 1, p: 1, s: 1 }, { x: 7, y: 5, r: 9, c: [255, 170, 70], a: 1, p: 1, cab: 1 }],
    fuente:          [{ x: 30, y: 52, r: 60, c: FUENTE, a: 0.85, s: 1, pu: 1, bd: [30, 90, 170] }, { x: 30, y: 52, r: 0, c: FUENTE, a: 1, ag: 1 }],   // v2.336: luz sumergida turquesa + agua que brilla (aguaFuente)
    cartel_carbuna:  [{ x: 28, y: 34, r: 22, c: CAL, a: 0.5, s: 1 }],
  };
  let lm = null, lc = null;
  const flick = (clock, k) => 1 + 0.07 * Math.sin(clock * 9 + k * 3.1) + 0.05 * Math.sin(clock * 15.7 + k * 1.3);
  const hh = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rgb = (c, k) => 'rgb(' + Math.round(c[0] * k) + ',' + Math.round(c[1] * k) + ',' + Math.round(c[2] * k) + ')';
  // ¿pasa este mapa por la iluminación? (no cuevas, no interiores —sin región—, no HD-2D, con ciclo y sin ?luces=0)
  const activo = (M, hd) => !OFF && !hd && !!G.ciclo && G.ciclo.AJUSTES.ACTIVO && !!M && !M.prof && !!M.region;
  // v2.335: foco SUAVE (degradado radial de 6 paradas, sin anillos): núcleo cálido que se enfría hacia el naranja en el borde. Aplastado en vertical si va en el suelo. ctx ya en 'lighter'
  const NARANJA = [255, 120, 40], PAR = [[0, 1], [0.12, 0.9], [0.3, 0.62], [0.55, 0.32], [0.8, 0.1], [1, 0]];
  function charco(c, x, y, r, col, k, plano, borde) {
    const NB = borde || NARANJA;
    c.save(); c.translate(Math.round(x), Math.round(y)); if (plano) c.scale(1, 0.62);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
    PAR.forEach((q) => { const m = q[0] * 0.65, cc = [col[0] + (NB[0] - col[0]) * m, col[1] + (NB[1] - col[1]) * m, col[2] + (NB[2] - col[2]) * m]; g.addColorStop(q[0], rgb(cc, k * q[1])); });
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fill(); c.restore();
  }
  // Halo de una bombilla: bola de luz blanco-cálida (núcleo caliente) con bloom
  function halo(c, x, y, r, col, k) {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgb([255, 244, 214], Math.min(1, k * 0.95))); g.addColorStop(0.25, rgb(col, k * 0.55)); g.addColorStop(0.6, rgb(col, k * 0.16)); g.addColorStop(1, rgb(col, 0));
    c.fillStyle = g; c.fillRect(Math.floor(x - r), Math.floor(y - r), Math.ceil(2 * r) + 1, Math.ceil(2 * r) + 1);
  }
  // ── v2.336 · auxiliares ──
  const sua = (x) => x * x * (3 - 2 * x), clar = (c, k) => c.map((v) => Math.min(255, Math.round(v + (255 - v) * k)));
  const reg = [];   // sprites dibujados este cuadro (los rellena game.js: personas y criaturas): { k: 1 criatura, id, s (sprite), x, y (pies en pantalla), dx, dy (esquina del sprite respecto a x, y), esp (espejado), a (opacidad) }
  const cvs = [null, null], tmp = (i, w, h) => { let c = cvs[i]; if (!c || c.width < w || c.height < h) { c = cvs[i] = Object.assign(document.createElement('canvas'), { width: Math.max(w, c ? c.width : 0), height: Math.max(h, c ? c.height : 0) }); } const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height); return x; };
  const dib = (c, r, x, y) => { if (r.esp) { c.save(); c.translate(x + r.s.w, y); c.scale(-1, 1); c.drawImage(r.s.c, 0, 0); c.restore(); } else c.drawImage(r.s.c, x, y); };
  const elem = (r) => { const d = r.k && G.CREATURES && G.CREATURES[r.id]; return (d && d.elements) || []; };
  // Filo de luz: 1 px del borde que mira a la luz (lateral y, si la luz está arriba, también el superior), con el color de la luz
  function filo(ctx, r, l, k) {
    const s = r.s, w = s.w + 4, h = s.h + 4, ex = r.x + r.dx + s.w / 2, dir = l[0] >= ex ? 1 : -1, col = clar(l[2], 0.3), arriba = l[1] < r.y + r.dy + s.h * 0.3;
    [[-dir, 0, 1], [0, 1, arriba ? 0.75 : 0]].forEach((q) => {
      if (!q[2]) return; const c = tmp(0, w, h); dib(c, r, 2, 2); c.globalCompositeOperation = 'source-in'; c.fillStyle = rgb(col, 1); c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'destination-out'; dib(c, r, 2 + q[0], 2 + q[1]);
      ctx.globalAlpha = Math.min(1, k * q[2] * (r.a === undefined ? 1 : r.a)); ctx.drawImage(cvs[0], 0, 0, w, h, r.x + r.dx - 2, r.y + r.dy - 2, w, h);
    }); ctx.globalAlpha = 1;
  }
  // Agua de la fuente iluminada desde dentro (elipse del estanque en el sprite: centro (30,52), radios 18×7): núcleo claro, anillos que nacen donde cae el agua, destellos y bruma de luz sobre los chorros
  function aguaFuente(ctx, bx, by, k, clock) {
    const cx = bx + 30, cy = by + 52; ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, 18, 7, 0, 0, 6.2832); ctx.clip();
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 7 / 18); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 18); g.addColorStop(0, rgb([170, 255, 244], k * 0.62)); g.addColorStop(0.55, rgb([60, 210, 214], k * 0.34)); g.addColorStop(1, rgb([20, 120, 190], k * 0.2)); ctx.fillStyle = g; ctx.fillRect(-18, -18, 36, 36); ctx.restore();
    ctx.lineWidth = 1; [-14, 14].forEach((ix, n) => { for (let i = 0; i < 3; i++) { const u = (clock * 0.42 + i / 3 + n * 0.37) % 1; ctx.strokeStyle = rgb([200, 255, 250], k * 0.55 * (1 - u)); ctx.beginPath(); ctx.ellipse(cx + ix, cy, 1 + u * 8, 0.4 + u * 3, 0, 0, 6.2832); ctx.stroke(); } });
    const q = Math.floor(clock * 4); for (let i = 0; i < 9; i++) { const a = hh(i * 5 + q, 3), b = hh(i + 40, q * 3 + i), ang = a * 6.2832, rr = Math.sqrt(b) * 0.92; if (hh(i, q) > 0.55) continue; ctx.fillStyle = rgb([225, 255, 255], k * 0.9); ctx.fillRect(Math.round(cx + Math.cos(ang) * 17 * rr), Math.round(cy + Math.sin(ang) * 6.4 * rr), 1, 1); }
    ctx.restore();
    [[30, 31, 16, 0.2], [16, 52, 10, 0.22], [44, 52, 10, 0.22]].forEach((p) => { const g = ctx.createRadialGradient(bx + p[0], by + p[1], 0, bx + p[0], by + p[1], p[2]); g.addColorStop(0, rgb([170, 255, 244], k * p[3] * (0.8 + 0.2 * Math.sin(clock * 3 + p[0])))); g.addColorStop(1, rgb([60, 200, 210], 0)); ctx.fillStyle = g; ctx.fillRect(bx + p[0] - p[2], by + p[1] - p[2], p[2] * 2, p[2] * 2); });
  }
  // Reflejos de farolas, ventanas y brasas en el agua que tienen debajo (columna que tiembla, recortada a las casillas de agua) + destellos de luna sobre el agua
  function reflejos(ctx, M, luzs, VW, VH, cx, cy, clock, kM) {
    const su = M.suelo; if (!su) return;
    luzs.forEach((l, i) => {
      if (l[5]) return; const wx = l[0] + cx, wy = l[1] + cy, tx = Math.floor(wx / T); if (tx < 0 || tx >= M.W) return;
      let tope = -1; for (let q = Math.max(0, Math.floor(wy / T)); q < Math.min(M.H, Math.floor(wy / T) + 9); q++) if (su[q][tx] === '~') { tope = q * T; break; }
      const d = tope - wy; if (tope < 0 || d < 0 || d > 130) return;
      const len = Math.round(30 - d * 0.18), k = l[3] * Math.min(1, 1.3 - d / 140), sd = i * 1.7 + tx;
      for (let r = 0; r < len; r += 2) {
        const f = 1 - r / len, w = Math.max(1, Math.round(2 + f * 5 + Math.sin(clock * 2.4 + r * 0.7 + sd) * 1.6)), yy = tope + 2 + r, ty2 = Math.floor(yy / T), px = wx + Math.sin(clock * 1.7 + r * 0.55 + sd) * (1 + r * 0.07) - w / 2, tx2 = Math.floor(px / T);
        if (ty2 >= M.H || tx2 < 0 || tx2 >= M.W || su[ty2][tx2] !== '~') continue;
        ctx.fillStyle = rgb(l[2], k * f * (0.5 + 0.5 * Math.max(0, Math.sin(clock * 2.9 + r * 0.9 + sd)))); ctx.fillRect(Math.round(px - cx), Math.round(yy - cy), w, 1);
      }
    });
    if (kM < 0.05) return;
    for (let ty = Math.max(0, Math.floor(cy / T)); ty <= Math.min(M.H - 1, Math.floor((cy + VH) / T)); ty++) for (let tx = Math.max(0, Math.floor(cx / T)); tx <= Math.min(M.W - 1, Math.floor((cx + VW) / T)); tx++) if (su[ty][tx] === '~') for (let i = 0; i < 2; i++) {
      const r1 = hh(tx * 3 + i, ty), r2 = hh(tx + 7, ty * 3 + i), ph = Math.sin(clock * 1.5 + r1 * 40); if (ph < 0.55) continue;
      const a = (ph - 0.55) / 0.45 * kM, X = Math.round(tx * T + r1 * 14 - cx), Y = Math.round(ty * T + r2 * 14 - cy);
      ctx.fillStyle = rgb([190, 215, 255], a * 0.8); ctx.fillRect(X, Y, 2, 1); ctx.fillStyle = rgb([190, 215, 255], a * 0.3); ctx.fillRect(X - 2, Y, 1, 1); ctx.fillRect(X + 3, Y, 1, 1);
    }
  }
  function pintar(ctx, M, est, cam, VW, VH, clock, jugador, extras) {
    const e = G.ciclo.estado(est.reloj), mult = e.mult;
    if (mult[0] > 253 && mult[1] > 253 && mult[2] > 253) return;   // pleno día: no cuesta nada
    const luz = Math.max(e.noche, e.calor * 0.55), kV = sua(lim(0.06, 0.6, e.noche)), kF = sua(lim(0.25, 0.95, e.noche)),   /* las ventanas se encienden primero, las farolas después: el atardecer tiene su propio momento */ hora = G.ciclo.hora(est.reloj), cx = Math.round(cam.x), cy = Math.round(cam.y);
    if (!lm || lm.width !== VW || lm.height !== VH) { lm = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(VW, VH) : Object.assign(document.createElement('canvas'), { width: VW, height: VH }); lc = lm.getContext('2d'); }
    const aclara = Math.max(est.combate ? 0.45 : 0, SUAVE ? 0.35 : 0), amb = mult.map((v) => Math.round(v + (255 - v) * aclara));
    lc.globalCompositeOperation = 'source-over'; lc.fillStyle = 'rgb(' + amb[0] + ',' + amb[1] + ',' + amb[2] + ')'; lc.fillRect(0, 0, VW, VH);
    lc.globalCompositeOperation = 'lighter';
    const glows = [], lamps = [], luzs = [], pos = (o, d) => [o.x * T + d.ox - cx, o.y * T + d.oy - cy];
    (M.objetos || []).forEach((o) => {
      const d = G.OBJETOS[o.tipo]; if (!d) return; const [bx, by] = pos(o, d);
      if (bx > VW + 60 || by > VH + 60 || bx + d.w < -60 || by + d.h < -60) return;
      const ed = EDIF[o.tipo];
      if (ed) {
        let on = kV > 0.02; if (ed.cierra && !G.ciclo.abierta(ed.cierra, est.reloj)) on = false;
        if (on) {   // v2.336: con horas, cada ventana se enciende y se apaga a su propia hora (fundido de ~20 min)
          let mx = 0; ed.vent.forEach((v, i) => { let vk = 1; if (ed.horas) { const des = ed.horas[0] + 0.5 * hh(o.y * 5 + i * 3, o.x), off = ed.horas[1] - 1.3 * hh(o.x * 3 + i * 7, o.y); vk = Math.min(sua(lim(des, des + 0.3, hora)), 1 - sua(lim(off - 0.3, off, hora))); } const k = kV * vk; mx = Math.max(mx, vk); if (k < 0.01) return;
            charco(lc, bx + v[0] + v[2] / 2, by + v[1] + v[3] + 4, 14 + v[2] * 0.35, ed.c, 0.32 * k, 1); glows.push([bx + v[0], by + v[1], v[2], v[3], ed.c, k]); luzs.push([bx + v[0] + v[2] / 2, by + v[1] + v[3] / 2, ed.c, k, 45]); });
          if (mx > 0.01) charco(lc, bx + ed.puerta[0], by + ed.puerta[1] + 2, 26, ed.c, 0.8 * kV * mx, 1); }
      }
      (PUNTOS[o.tipo] || []).forEach((p, i) => {
        let k = kF * p.a * (p.p ? flick(clock, o.x * 7 + o.y + i) : 1); if (kF < 0.02) return;
        if (p.pu) k *= 0.86 + 0.14 * Math.sin(clock * 1.4 + o.x);
        if (p.ag) { glows.push([bx, by, 0, 0, p.c, k, 3]); luzs.push([bx + 30, by + 44, p.c, k, 70, 1]); } else if (p.cab) { glows.push([bx + p.x, by + p.y, p.r, 0, p.c, k, 2]); luzs.push([bx + p.x, by + p.y, p.c, k, 95]); } else { charco(lc, bx + p.x, by + p.y, p.r, p.c, 0.9 * k, p.s, p.bd); if (o.tipo === 'farola') lamps.push([bx + p.x, by + p.y]); }
      });
    });
    if (M.suelo && luz > 0.02 && kV > 0.02) for (let ty = Math.max(0, Math.floor(cy / T)); ty <= Math.min(M.H - 1, Math.floor((cy + VH) / T)); ty++) { const fila = M.suelo[ty]; for (let tx = Math.max(0, Math.floor(cx / T)); tx <= Math.min(M.W - 1, Math.floor((cx + VW) / T)); tx++) if (fila[tx] === 'l') { const k = (0.6 + 0.4 * hh(tx, ty)) * flick(clock, tx + ty * 5) * kV; charco(lc, tx * T + 8 - cx, ty * T + 8 - cy, 17, LAVA, 0.5 * k, 0); } }
    if (jugador && kF > 0.02) charco(lc, jugador.x - cx, jugador.y - 6 - cy, 34, AMB, 0.28 * kF, 0);   // farolillo del viajero: la noche no es negra donde estás
    if (kF > 0.02) (extras || []).forEach((q) => charco(lc, q.x - cx, q.y - 5 - cy, 24, [150, 165, 215], 0.2 * kF, 0));   // v2.335: quien camina de noche nunca se pierde en la sombra (luz de luna tenue)
    if (kF > 0.02) reg.forEach((r) => { if (!r.k) return; const el = elem(r), X = r.x, Y = r.y + r.dy + r.s.h * 0.5;   // v2.336: criaturas de fuego y eléctricas iluminan lo que las rodea
      if (el.indexOf('fuego') >= 0) charco(lc, X, Y, 28, LAVA, 0.55 * kF * flick(clock, X * 0.1 + String(r.id).length), 0); else if (el.indexOf('electrico') >= 0) charco(lc, X, Y, 24, [255, 240, 130], 0.5 * kF * (0.65 + 0.35 * Math.max(0, Math.sin(clock * 13 + X) * Math.sin(clock * 5.3))), 0, [70, 130, 255]); });
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(lm, 0, 0);
    if (kF > 0.02) { ctx.globalCompositeOperation = 'source-over'; (extras || []).concat(jugador ? [jugador] : []).forEach((q) => { const fx = q.x - cx, fy = q.y - cy; let ld = null, dm = 96; lamps.forEach((l) => { const d = Math.hypot(l[0] - fx, l[1] - fy); if (d < dm) { dm = d; ld = l; } }); const dx = ld ? (fx - ld[0]) / Math.max(1, dm) : 0, sx = Math.round(dx * 4 * (1 - dm / 110)), a = 0.34 * kF * (ld ? 1 - 0.5 * dm / 96 : 0.7); ctx.fillStyle = 'rgba(8,10,34,' + a.toFixed(3) + ')'; ctx.fillRect(Math.round(fx - 5 + sx), Math.round(fy + 0), 10, 2); ctx.fillRect(Math.round(fx - 4 + sx), Math.round(fy - 1), 8, 1); ctx.fillRect(Math.round(fx - 3 + sx), Math.round(fy + 2), 6, 1); }); }   // sombra de contacto, desplazada al lado contrario de la farola más cercana
    ctx.globalCompositeOperation = 'lighter';
    glows.forEach((g) => { if (g[6] === 3) aguaFuente(ctx, g[0], g[1], g[5], clock); else if (g[6] === 2) halo(ctx, g[0], g[1], g[2] * 1.5, g[4], g[5] * 0.85); else { ctx.fillStyle = rgb(g[4], g[5] * 0.42); ctx.fillRect(Math.round(g[0]), Math.round(g[1]), g[2], g[3]); } });   // ventanas y cabezas de farola emiten luz propia
    reflejos(ctx, M, luzs, VW, VH, cx, cy, clock, sua(lim(0.4, 0.9, e.noche)));
    if (kV > 0.02 && luzs.length) reg.forEach((r) => { let b = null, bk = 0; luzs.forEach((l) => { const d = Math.hypot(l[0] - r.x, l[1] - (r.y + r.dy + r.s.h * 0.5)); if (d < l[4]) { const q = l[3] * (1 - d / l[4]); if (q > bk) { bk = q; b = l; } } }); if (b) filo(ctx, r, b, 0.75 * bk); });   // v2.336: filo de luz en el lado que mira a la luz más fuerte cercana
    if (e.calor > 0.04) { const am = e.t < 0.5, ca = Math.min(1, e.calor * 1.15) * (1 - e.noche * 0.5), sx = am ? VW : 0, A = (v) => (v * ca).toFixed(3);   // v2.336: atardecer/amanecer: oro hacia el sol, rosa arriba y un bloom bajo en el horizonte
      let g = ctx.createLinearGradient(sx, 0, am ? VW * 0.25 : VW * 0.75, 0); g.addColorStop(0, 'rgba(255,165,70,' + A(0.11) + ')'); g.addColorStop(1, 'rgba(255,165,70,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      g = ctx.createLinearGradient(0, 0, 0, VH * 0.55); g.addColorStop(0, 'rgba(255,105,150,' + A(0.07) + ')'); g.addColorStop(1, 'rgba(255,105,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      g = ctx.createRadialGradient(am ? VW * 1.05 : -VW * 0.05, VH * 0.22, 0, am ? VW * 1.05 : -VW * 0.05, VH * 0.22, VW); g.addColorStop(0, 'rgba(255,200,120,' + A(0.13) + ')'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }
    ctx.globalCompositeOperation = 'source-over';
    if (e.noche > 0.1) { const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(10,14,56,' + (0.2 * e.noche * (SUAVE ? 0.5 : 1)).toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(10,14,56,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }   // v2.335: cielo más profundo arriba (gradación)
    if (e.noche > 0.1) { const g = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.35, VW / 2, VH / 2, Math.max(VW, VH) * 0.72); g.addColorStop(0, 'rgba(6,8,28,0)'); g.addColorStop(1, 'rgba(6,8,28,' + (0.38 * e.noche * (SUAVE ? 0.5 : 1)).toFixed(3) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }   // viñeta: contraste y foco hacia el centro
    ctx.restore();
  }
  // v2.328 (paso 5): detalles de ambiente. Luciérnagas sobre la hierba de noche y humo en las chimeneas de las casas (tarde y madrugada). Solo dibujo, determinista con el reloj.
  const CHIM = { casa_lali: [73, 9], casa_oli: [73, 9] };
  function ambiente(ctx, M, est, cam, VW, VH, clock) {
    const e = G.ciclo.estado(est.reloj), hora = G.ciclo.hora(est.reloj), cx = Math.round(cam.x), cy = Math.round(cam.y); ctx.save();
    (M.objetos || []).forEach((o) => {   // humo: casas con fuego encendido (17:00-24:00 y 4:30-9:00)
      const c = CHIM[o.tipo], d = c && G.OBJETOS[o.tipo]; if (!d || !((hora >= 17 && hora < 24) || (hora >= 4.5 && hora < 9))) return;
      const bx = o.x * T + d.ox + c[0] - cx, by = o.y * T + d.oy + c[1] - cy; if (bx < -20 || bx > VW + 20 || by < -40 || by > VH + 40) return;
      for (let i = 0; i < 6; i++) { const u = ((clock * 0.22 + i / 6 + hh(o.x, o.y)) % 1), a = Math.sin(u * Math.PI) * 0.5, sz = 2 + Math.floor(u * 3); ctx.fillStyle = 'rgba(' + (e.noche > 0.5 ? '150,160,190' : '205,200,200') + ',' + a.toFixed(2) + ')'; ctx.fillRect(Math.round(bx + Math.sin(u * 5 + i) * 3 + u * 7 - sz / 2), Math.round(by - u * 26), sz, sz); }
    });
    const kL = sua(lim(0.25, 0.95, e.noche)), objs = M.objetos || [];   // v2.336: polillas y polvo de luz alrededor de cada farola
    if (kL > 0.05 && !M.prof) objs.forEach((o) => {
      if (o.tipo !== 'farola') return; const d = G.OBJETOS[o.tipo]; if (!d) return; const hx = o.x * T + d.ox + 5 - cx, hy = o.y * T + d.oy + 4 - cy; if (hx < -30 || hx > VW + 30 || hy < -30 || hy > VH + 50) return;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const r = hh(o.x * 7 + i, o.y), u = (clock * (0.04 + r * 0.05) + hh(i, o.x + o.y)) % 1, a = 0.42 * Math.sin(u * Math.PI) * kL * (0.35 + 0.65 * Math.pow(Math.sin(clock * 1.3 + r * 30), 2)); if (a < 0.02) continue; ctx.fillStyle = 'rgba(255,222,165,' + a.toFixed(2) + ')'; ctx.fillRect(Math.round(hx + (r - 0.5) * (6 + u * 26) + Math.sin(clock * 0.7 + r * 20) * 3), Math.round(hy + 4 + u * 34), 1, 1); }
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 2; i++) { const r = hh(o.x + i * 13, o.y * 3), a = clock * (1.7 + r * 1.4) + r * 6, rad = 6 + 4 * Math.sin(clock * 0.9 + r * 9); if (Math.sin(clock * 0.5 + r * 11) < -0.7) continue;
        const X = Math.round(hx + Math.cos(a) * rad + Math.sin(clock * 7 + r) * 1.2), Y = Math.round(hy + Math.sin(a) * rad * 0.6 + Math.sin(clock * 5 + r * 3) * 1.5); ctx.fillStyle = 'rgba(240,232,205,' + (0.85 * kL).toFixed(2) + ')'; if (Math.floor(clock * 14 + r * 5) % 2) ctx.fillRect(X - 1, Y, 3, 1); else ctx.fillRect(X, Y - 1, 1, 3); }
    });
    const kN = sua(lim(2.5, 4, hora)) * (1 - sua(lim(5.5, 6.8, hora)));   // v2.336: niebla baja de madrugada (3-6 h), solo en Albanota; recoge el color de las farolas
    if (kN > 0.02 && M.id === 'albanota') {
      for (let gy = Math.floor((cy - 30) / 56); gy <= Math.floor((cy + VH + 30) / 56); gy++) for (let gx = Math.floor((cx - 140) / 120) - 1; gx <= Math.floor((cx + VW + 140) / 120); gx++) {
        const r = hh(gx + 11, gy + 5); if (r < 0.35) continue; const w = 70 + r * 70, h = 13 + r * 14, X = Math.round(gx * 120 + r * 100 + Math.sin(clock * 0.04 + r * 20) * 55 - cx), Y = Math.round(gy * 56 + hh(gx + 3, gy + 17) * 40 - cy);
        ctx.save(); ctx.translate(X, Y); ctx.scale(1, h / w); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w), A = 0.2 * kN; g.addColorStop(0, 'rgba(168,188,228,' + A.toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(150,170,215,' + (A * 0.45).toFixed(3) + ')'); g.addColorStop(1, 'rgba(150,170,215,0)'); ctx.fillStyle = g; ctx.fillRect(-w, -w, 2 * w, 2 * w); ctx.restore();
      }
      ctx.globalCompositeOperation = 'lighter'; objs.forEach((o) => { if (o.tipo !== 'farola') return; const d = G.OBJETOS[o.tipo], lx = o.x * T + d.ox + 5 - cx, ly = o.y * T + d.oy + 30 - cy; if (lx < -50 || lx > VW + 50 || ly < -50 || ly > VH + 50) return; ctx.save(); ctx.translate(lx, ly); ctx.scale(1, 0.4); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 40); g.addColorStop(0, 'rgba(255,190,110,' + (0.16 * kN).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = g; ctx.fillRect(-40, -40, 80, 80); ctx.restore(); }); ctx.globalCompositeOperation = 'source-over';
    }
    const k = Math.max(0, Math.min(1, (e.noche - 0.5) * 2));   // luciérnagas: solo con la noche cerrada y fuera de Carbuna
    if (k > 0 && M.id === 'albanota' && M.suelo) {
      ctx.globalCompositeOperation = 'lighter';
      for (let gy = Math.floor(cy / 40); gy <= Math.floor((cy + VH) / 40); gy++) for (let gx = Math.floor(cx / 40); gx <= Math.floor((cx + VW) / 40); gx++) for (let i = 0; i < 2; i++) {
        const r1 = hh(gx * 2 + i, gy), r2 = hh(gx + 91, gy * 2 + i); if (r1 > 0.5) continue;
        const wx = gx * 40 + r1 * 80 + Math.sin(clock * 0.6 + r2 * 20) * 14, wy = gy * 40 + r2 * 40 + Math.cos(clock * 0.5 + r1 * 30) * 10, tx = Math.floor(wx / T), ty = Math.floor(wy / T);
        if (tx < 0 || ty < 0 || tx >= M.W || ty >= M.H || '.t'.indexOf(M.suelo[ty][tx]) < 0) continue;
        const b = Math.max(0, Math.sin(clock * 2.2 + r2 * 40)); if (b < 0.15) continue; const X = Math.round(wx - cx), Y = Math.round(wy - cy);
        ctx.fillStyle = 'rgba(190,255,90,' + (0.16 * b * k).toFixed(2) + ')'; ctx.fillRect(X - 2, Y - 1, 5, 3); ctx.fillRect(X - 1, Y - 2, 3, 5); ctx.fillStyle = 'rgba(235,255,150,' + (0.9 * b * k).toFixed(2) + ')'; ctx.fillRect(X, Y, 1, 1);
      }
    }
    ctx.restore();
  }
  G.luces2d = { activo, pintar, ambiente, EDIF, PUNTOS, OFF, SUAVE, reg };
})(typeof window !== 'undefined' ? window : globalThis);
