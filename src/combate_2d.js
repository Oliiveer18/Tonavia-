// combate_2d.js — el combate en tiempo real en el pintor 2D (v2.277). Lee G.vista.combate / G.vista.acomp y dibuja con el lienzo 2D del juego (1 px = 1 px del juego, sin Three).
// Los 56 efectos diseñados (G.fxPro: escena de 128×80 px = la arena) se pintan tal cual sobre el lienzo, en dos capas (color y luz aditiva); si lanza el bando derecho se refleja. Lo que no tiene efecto propio usa los cuadritos de combate_fx.js.
// API: entradas(est, mapaId, reloj) → [{ y, u2d }] (para ordenar con el resto) · unidad(ctx, u, cam, reloj, spr) · efectos(ctx, est, cam, reloj) · ui(uctx, ui, KS, cam, est, reloj)
(function (root) {
  'use strict';
  const G = root.G, T = 16, PRO_STEP = 1 / 120;
  const S = { q: null, vistos: new Set(), t: 0, act: {}, hit: {}, pix: [], pixV: new Set(), capV: null }; // q: [normal, reflejada] = { espejo, P, c, l, inst[] }
  const vista = (est, reloj) => (G.vista.combate ? G.vista.combate(est, reloj) : null);
  function entradas(est, mapaId, reloj) {
    const L = [], v = vista(est, reloj); S.hit = {};
    if (v) v.ev.forEach((e) => { if (e.e !== 'golpe') return; const a = v.tick - e.t; if (a < 0 || a >= 6) return; const k = (1 - a / 6) * (e.crit ? 1.8 : 1), c = S.hit[e.id]; if (!c || k > c.k) S.hit[e.id] = { k, a, crit: !!e.crit }; }); // golpe reciente: temblor, destello y «punch»
    if (v && est.combate.mapa === mapaId) v.unidades.forEach((u) => L.push({ y: u.y, u2d: u }));
    if (v && v.cap && est.combate.mapa === mapaId) { const c = v.cap, vis = c.fase === 'oferta' || c.fase === 'rompe' || (c.fase === 'vuelo' && c.t < 0.18);
      if (vis) { const ab = c.fase === 'vuelo' ? 1 - c.t / 0.18 : 1, par = Math.floor(reloj * 7) % 2; L.push({ y: c.y, u2d: { id: 'cap', forma: c.forma, x: c.x, y: c.y, dir: c.dir, moving: false, tm: reloj, up: 0, alpha: c.fase === 'oferta' && !c.vivo ? (par ? 0.82 : 1) : 1, rojo: c.vivo && c.fase === 'oferta' ? 0.2 + 0.18 * Math.sin(reloj * 6) : 0, sc: ab, flash: c.fase === 'vuelo' ? 1 - ab : (c.fase === 'rompe' && c.t < 0.25 ? 1 - c.t / 0.25 : 0) } }); } }
    const a = G.vista.acomp ? G.vista.acomp(est, reloj) : null; if (a && est.acomp.mapa === mapaId) L.push({ y: a.y, u2d: { id: 'acomp', forma: a.forma, x: a.x, y: a.y, dir: a.dir, moving: a.moving, tm: reloj, up: 0 } });
    return L;
  }

  // ── Captura (v2.296) ──
  const CICLO = 1.6;   // el anillo se encoge de 1 a 0,25 cada 1,6 s
  const anillo = (cap) => 1 - 0.75 * (((cap.t - 0.8) % CICLO + CICLO) % CICLO) / CICLO;
  const calidad = (cap, err, w) => { const r = anillo(cap); let q = r < 0.42 ? 3 : r < 0.68 ? 2 : 1; if (err > w * 1.2 + 6) return 0; if (err > w * 0.55 + 3 && q > 1) q--; return [0, 0.5, 0.8, 1][q]; };
  // ── Captura: esfera y efectos (v2.338) ──
  const rgbDe = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0xf0603e; return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgbA = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  function brillo(ctx, x, y, r, c, a) { if (a <= 0.01) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgbA(c, a)); g.addColorStop(0.45, rgbA(c, a * 0.35)); g.addColorStop(1, rgbA(c, 0)); ctx.fillStyle = g; ctx.fillRect(Math.round(x - r), Math.round(y - r), Math.ceil(r * 2), Math.ceil(r * 2)); ctx.restore(); }
  function chispa(ctx, x, y, r, c, a) { x = Math.round(x); y = Math.round(y); ctx.fillStyle = rgbA(c, a); ctx.fillRect(x - r, y, r * 2 + 1, 1); ctx.fillRect(x, y - r, 1, r * 2 + 1); ctx.fillStyle = rgbA([255, 255, 255], a); ctx.fillRect(x, y, 1, 1); }
  function anilloSuelo(ctx, x, y, r, c, a, grosor) { if (a <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.4); ctx.strokeStyle = rgbA(c, a); ctx.lineWidth = grosor || 1; ctx.beginPath(); ctx.arc(0, 0, Math.max(0.5, r), 0, 6.2832); ctx.stroke(); ctx.restore(); }
  // esfera de 11×11 con volumen: mitad de color del elemento arriba (luz arriba-izquierda), crema abajo, banda oscura con botón y brillo especular
  const orbs = {};
  function orbCanvas(col) {
    if (orbs[col]) return orbs[col]; const c = G.makeCanvas(11, 11), x = c.getContext('2d'), C = rgbDe(col), DK = [36, 18, 29], CR = [255, 243, 214];
    const mix = (a, k) => (k >= 0 ? a.map((v) => Math.round(v + (255 - v) * k)) : a.map((v) => Math.round(v * (1 + k)))), px = (xx, yy, a) => { x.fillStyle = 'rgb(' + a.join(',') + ')'; x.fillRect(xx, yy, 1, 1); };
    for (let y = 0; y < 11; y++) for (let xx = 0; xx < 11; xx++) {
      const dx = xx - 5, dy = y - 5, d = Math.hypot(dx, dy); if (d > 5.3) continue; if (d > 4.4 || dy === 0) { px(xx, y, DK); continue; }
      const l = (-dx * 0.55 - dy * 0.75) / 5; px(xx, y, dy < 0 ? mix(C, l > 0.45 ? 0.5 : l > 0.12 ? 0.18 : l < -0.4 ? -0.34 : 0) : mix(CR, l > 0.3 ? 0.35 : l < -0.35 ? -0.24 : l < 0 ? -0.1 : 0));
    }
    for (let yy = 4; yy <= 6; yy++) for (let xx = 4; xx <= 6; xx++) px(xx, yy, DK); px(5, 5, [255, 250, 232]); px(3, 2, [255, 255, 255]); px(2, 3, [255, 255, 255]);
    return (orbs[col] = c);
  }
  function esfera(ctx, x, y, col, ang, esc) { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang); if (esc !== 1) ctx.scale(esc, esc); ctx.drawImage(orbCanvas(col), -5.5, -5.5); ctx.restore(); }
  function mitad(ctx, x, y, col, arriba, f) { const o = orbCanvas(col); ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f); ctx.translate(Math.round(x + (arriba ? -1 : 1) * 9 * f), Math.round(y + (arriba ? -12 : 10) * f + (arriba ? 0 : 14 * f * f))); ctx.rotate((arriba ? -1 : 1) * f * 1.1); ctx.scale(1.4, 1.4); if (arriba) ctx.drawImage(o, 0, 0, 11, 5, -5.5, -5.5, 11, 5); else ctx.drawImage(o, 0, 5, 11, 6, -5.5, -0.5, 11, 6); ctx.restore(); }
  function capFx(ctx, cam, VW, VH, c, reloj) {
    const pal = (G.combateFx.PAL[c.el] || G.combateFx.PAL.fuego), hex = pal[1], C = rgbDe(hex), ORO = [255, 216, 74], BL = [255, 249, 238], gy = c.y, cy = c.y - c.h * 0.45, X = c.x - cam.x, Y = cy - cam.y, GY = gy - cam.y, ox = cam.x + VW / 2, oy = cam.y + VH + 6, h8 = (i, s) => { const t = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return t - Math.floor(t); };
    ctx.save();
    if (c.fase === 'oferta') {   // la criatura está débil: aura roja que late, retícula que gira y chispas de peligro
      const f = Math.min(1, c.t / 0.5), p = 0.5 + 0.5 * Math.sin(reloj * (c.vivo ? 6 : 3)), R = Math.max(c.w, c.h) * 0.5 + 9 + 2 * p;
      if (c.vivo) { brillo(ctx, X, Y, c.w + 24, [255, 60, 50], 0.24 * f * (0.55 + 0.45 * p)); anilloSuelo(ctx, X, GY, c.w * 0.55 + 4 + 3 * p, [255, 90, 80], 0.7 * f * (0.5 + 0.5 * p), 2);
        for (let i = 0; i < 6; i++) { const u = ((reloj * 0.9 + i / 6) % 1); chispa(ctx, X + Math.sin(i * 2.3 + reloj * 1.3) * c.w * 0.42, GY - u * (c.h + 6), 1, [255, 120, 90], (1 - u) * 0.9 * f); } }
      ctx.fillStyle = rgbA(BL, 0.9 * f); for (let i = 0; i < 4; i++) for (let s = 0; s < 6; s++) { const an = reloj * 0.7 + i * Math.PI / 2 + (s - 2.5) * 0.1; ctx.fillRect(Math.round(X + Math.cos(an) * R), Math.round(Y + Math.sin(an) * R * 0.85), 1, 1); }
      ctx.fillStyle = rgbA(C.map((v) => Math.min(255, v + 90)), f); for (let i = 0; i < 4; i++) { const an = reloj * 0.7 + i * Math.PI / 2; ctx.fillRect(Math.round(X + Math.cos(an) * R) - 1, Math.round(Y + Math.sin(an) * R * 0.85) - 1, 3, 3); }
    } else if (c.fase === 'vuelo') {   // arco de la esfera con estela, brillo y sombra en el suelo
      const f = Math.min(1, c.t / 0.75), pos = (q) => ({ x: ox + (c.x - ox) * q, y: oy + (cy - oy) * q - 46 * Math.sin(Math.PI * q), g: oy + (gy - oy) * q }), P = pos(f);
      ctx.fillStyle = 'rgba(20,10,30,' + (0.28 * (1 - 0.5 * Math.sin(Math.PI * f))).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(Math.round(P.x - cam.x), Math.round(P.g - cam.y), 6 - 2 * Math.sin(Math.PI * f), 2, 0, 0, 6.2832); ctx.fill();
      for (let i = 7; i >= 1; i--) { const q = Math.max(0, f - i * 0.04), T2 = pos(q), a = (1 - i / 8) * 0.55; brillo(ctx, T2.x - cam.x, T2.y - cam.y, 7 - i * 0.6, C, a); ctx.fillStyle = rgbA(BL, a * 0.8); ctx.fillRect(Math.round(T2.x - cam.x), Math.round(T2.y - cam.y), 1, 1); }
      brillo(ctx, P.x - cam.x, P.y - cam.y, 15, C, 0.45); esfera(ctx, P.x - cam.x, P.y - cam.y, hex, f * 14, 1.7 - 0.5 * f);
    } else if (c.fase === 'agita' || c.fase === 'ok') {
      const k = c.fase === 'agita' ? c.t / 0.8 : c.sac, fr = k - Math.floor(k), fin = c.fase === 'agita' && c.t > 0.15 && Math.floor(k) < c.sac, sh = fin ? Math.sin(Math.min(1, fr / 0.55) * Math.PI * 2) * (1 - Math.min(1, fr / 0.55)) * 0.7 : 0, OY = GY - 6, hechos = c.fase === 'ok' ? 3 : Math.min(3, Math.floor(k));
      if (c.fase === 'agita' && c.t < 0.4) { const u = c.t / 0.4, e = u * u;   // la criatura se absorbe en la esfera: haz de luz que converge + destello
        for (let i = 0; i < 18; i++) { const sx = X + (h8(i, 1) - 0.5) * c.w, sy = Y + (h8(i, 2) - 0.5) * c.h, q = Math.min(1, e * 1.15 + h8(i, 3) * 0.0), px = sx + (X - sx) * q, py = sy + (OY - sy) * q; ctx.fillStyle = rgbA(i % 2 ? BL : C.map((v) => Math.min(255, v + 80)), 1 - u * 0.7); ctx.fillRect(Math.round(px), Math.round(py), u < 0.6 ? 2 : 1, u < 0.6 ? 2 : 1); }
        brillo(ctx, X, OY, 10 + 12 * (1 - u), BL, 0.9 * (1 - u)); }
      brillo(ctx, X, OY, c.fase === 'ok' ? 14 + 10 * Math.min(1, c.t / 1.2) : 14, c.fase === 'ok' ? ORO : C, c.fase === 'ok' ? 0.5 * Math.max(0, 1 - c.t / 2.2) + 0.15 : 0.22 + 0.14 * Math.sin(reloj * 9));
      esfera(ctx, X, OY, hex, c.fase === 'ok' ? 0 : sh, 1.4);
      for (let i = 0; i < 3; i++) { const bx = Math.round(X + (i - 1) * 7), by = Math.round(OY - 15), lit = i < hechos; ctx.fillStyle = '#24121d'; ctx.fillRect(bx - 2, by - 2, 5, 5); ctx.fillStyle = lit ? '#ffd84a' : '#4a3a55'; ctx.fillRect(bx - 1, by - 1, 3, 3); if (lit) { ctx.fillStyle = '#fff9ee'; ctx.fillRect(bx - 1, by - 1, 1, 1); } }   // tres lucecitas: una por sacudida completada
      if (c.fase === 'agita' && c.t > 0.15) { const ph = (c.t - 0.15) / 0.8, i = Math.floor(ph); if (i < c.sac && ph - i < 0.18) { for (let n = 0; n < 6; n++) { const an = n * 1.05 + i, rr = 6 + 10 * (ph - i) / 0.18; ctx.fillStyle = '#fff4dc'; ctx.fillRect(Math.round(X + Math.cos(an) * rr), Math.round(OY + 2 + Math.sin(an) * rr), 1, 1); } anilloSuelo(ctx, X, GY, 6 + 12 * (ph - i) / 0.18, BL, 0.5 * (1 - (ph - i) / 0.18)); } }
      if (c.fase === 'ok') { const f = c.t / 1.2; anilloSuelo(ctx, X, GY, 4 + 34 * Math.min(1, f), ORO, 0.8 * Math.max(0, 1 - f), 2); anilloSuelo(ctx, X, GY, 2 + 22 * Math.min(1, f), BL, 0.6 * Math.max(0, 1 - f));
        for (let n = 0; n < 14; n++) { const an = n * 0.9 + 0.3, rr = 4 + 26 * Math.min(1, f) * (0.6 + 0.4 * ((n * 37) % 10) / 10), a = Math.max(0, 1 - f); ctx.fillStyle = n % 3 ? rgbA(ORO, a) : rgbA(BL, a); ctx.fillRect(Math.round(X + Math.cos(an) * rr), Math.round(OY + Math.sin(an) * rr * 0.8 - 8 * f), 2, 2); }
        for (let n = 0; n < 5; n++) { const u = Math.min(1, Math.max(0, (c.t - n * 0.12) / 1.3)); if (u > 0 && u < 1) chispa(ctx, X + Math.sin(n * 2.1) * (8 + 14 * u), OY - 8 - 26 * u, n % 2 ? 2 : 1, ORO, Math.sin(u * Math.PI)); } }
    } else if (c.fase === 'rompe' && !c.miss) {   // se escapa: la esfera se abre en dos y estalla un destello
      const f = Math.min(1, c.t / 0.8), OY = GY - 6; mitad(ctx, X, OY, hex, true, f); mitad(ctx, X, OY, hex, false, f);
      brillo(ctx, X, Y, 12 + 22 * f, BL, 0.8 * Math.max(0, 1 - f * 1.6)); anilloSuelo(ctx, X, GY, 6 + 26 * f, C, 0.9 * (1 - f), 2);
      for (let n = 0; n < 14; n++) { const an = n * 0.45, rr = 4 + 20 * f * (0.6 + 0.4 * h8(n, 4)); ctx.fillStyle = n % 2 ? rgbA(BL, 1 - f) : rgbA(C, 1 - f); ctx.fillRect(Math.round(X + Math.cos(an) * rr), Math.round(Y + Math.sin(an) * rr * 0.9), 1, 1); }
    } else if (c.fase === 'rompe' && c.miss) {   // fallo: la esfera rebota al suelo
      const f = Math.min(1, c.t / 0.8), x = c.x + (c.x > ox ? 1 : -1) * 30 * f, y = cy + 40 * f - 20 * Math.sin(Math.PI * Math.min(1, f * 1.4)); brillo(ctx, x - cam.x, y - cam.y, 9, C, 0.3 * (1 - f)); esfera(ctx, x - cam.x, y - cam.y, hex, f * 9, 1.4);
    }
    ctx.restore();
  }
  function pulverizar(u) {   // el sprite de una criatura estalla en píxeles (derrota o huida)
    const sp = sprite(u.forma, u.dir); if (!sp) return;
    let r = ((u.t || 7) * 2654435761 + 12345) >>> 0; const rnd = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 4294967296; };
    for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) { const c = sp.data[y * sp.w + x]; if (!(c >>> 24)) continue; const dx = x - sp.w / 2, dy = y - sp.h * 0.55, d = Math.hypot(dx, dy) || 1;
      S.pix.push({ x: u.x + (x - sp.w / 2), y: u.y - sp.h + y + 2, vx: dx / d * (10 + 26 * rnd()) + (rnd() - 0.5) * 8, vy: dy / d * (8 + 18 * rnd()) - 14 * rnd(), r: c & 255, g: (c >>> 8) & 255, b: (c >>> 16) & 255, t: -(1 - y / sp.h) * 0.12, vida: 0.55 + 0.6 * rnd() }); }
  }
  const blancos = new WeakMap(); function blanco(s) { let b = blancos.get(s.c); if (!b) { b = G.makeCanvas(s.c.width, s.c.height); const x = b.getContext('2d'); x.drawImage(s.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, b.width, b.height); blancos.set(s.c, b); } return b; } // silueta blanca para el destello
  const rojos = new WeakMap(); function rojoSil(s) { let b = rojos.get(s.c); if (!b) { b = G.makeCanvas(s.c.width, s.c.height); const x = b.getContext('2d'); x.drawImage(s.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ff3a30'; x.fillRect(0, 0, b.width, b.height); rojos.set(s.c, b); } return b; }
  function unidad(ctx, u, cam, reloj, spr) {
    const v = G.vista.criatura({ id: u.forma, dir: u.dir, moving: u.moving, tm: u.tm }, reloj), s = spr(u.forma, u.dir, v.frame), sb = v.sombra; if (!s) return; const ac = S.act[u.id] || { dx: 0, dy: 0, sx: 1, sy: 1 };
    const h = S.hit[u.id], jx = h ? (Math.floor(h.a * 2) % 2 ? 1 : -1) * Math.round(2.2 * h.k) : 0, pk = h ? h.k : 0;
    ctx.save(); ctx.translate(Math.round(u.x + ac.dx + jx - cam.x), Math.round(u.y - cam.y));
    ctx.fillStyle = 'rgba(30,20,40,0.25)'; ctx.fillRect(-Math.round(sb.ancho / 2), -sb.alto + 1, sb.ancho, sb.alto);
    if (u.alpha !== undefined) ctx.globalAlpha = u.alpha; if (u.sc !== undefined && u.sc !== 1) ctx.scale(Math.max(0.01, u.sc), Math.max(0.01, u.sc));
    ctx.translate(0, Math.round(ac.dy)); if (ac.sx !== 1 || ac.sy !== 1) ctx.scale(ac.sx, ac.sy); if (pk) ctx.scale(1 + 0.1 * pk, 1 - 0.07 * pk);
    const dx0 = -s.w / 2 + v.sway, dy0 = -s.h + 2 - Math.round(v.up + (u.up || 0)) - sb.separacion + v.nod; ctx.drawImage(s.c, dx0, dy0);
    if (u.rojo > 0) { ctx.globalAlpha = Math.min(0.7, u.rojo); ctx.drawImage(rojoSil(s), dx0, dy0); ctx.globalAlpha = 1; }
    if (u.flash > 0) { ctx.globalAlpha = Math.min(1, u.flash); ctx.drawImage(blanco(s), dx0, dy0); ctx.globalAlpha = 1; }
    if (h) { ctx.globalAlpha = Math.min(0.9, 0.8 * h.k); ctx.drawImage(blanco(s), dx0, dy0); ctx.globalAlpha = 1; } ctx.restore();
  }
  function crear(espejo) {
    const F = G.fxPro, mk = () => { const c = G.makeCanvas(F.W, F.H), cx = c.getContext('2d'), im = cx.createImageData(F.W, F.H); return { c, cx, im, i32: new Uint32Array(im.data.buffer) }; };
    return { espejo, P: new F.Painter(), c: mk(), l: mk(), inst: [] };
  }
  const sprDe = {}; function sprite(forma, dir) { const k = forma + '|' + dir; if (sprDe[k]) return sprDe[k]; const s = G.creatureSprite(forma, dir, 0); if (!s) return null; const d = s.c.getContext('2d').getImageData(0, 0, s.c.width, s.c.height); return (sprDe[k] = { w: s.c.width, h: s.c.height, data: new Uint32Array(d.data.buffer) }); }
  function efectos(ctx, est, cam, reloj) {
    const v = vista(est, reloj), F = G.fxPro; S.act = {}; const KSx = ctx.getTransform ? ctx.getTransform().a : 1, VWc = () => ctx.canvas.width / KSx, VHc = () => ctx.canvas.height / KSx;
    if (!v) { S.vistos.clear(); if (S.q) S.q.forEach((q) => { q.inst = []; }); return; }
    if (S.k !== est.combate) { S.k = est.combate; S.vistos.clear(); S.pix = []; S.pixV.clear(); S.hit = {}; if (S.q) S.q.forEach((q) => { q.inst = []; }); S.t = reloj; }   // combate nuevo: los ticks vuelven a 0 y las claves «tick|id|mov» se repetirían (los efectos del 2.º combate no salían)
    if (!S.q) { S.q = [crear(false), crear(true)]; S.t = reloj; } const dt = Math.max(0, Math.min(0.05, reloj - S.t)); S.t = reloj;
    const U = {}; v.unidades.forEach((u) => { U[u.id] = u; }); const x0 = v.ax - F.W / 2, y0 = v.ay - F.GY;
    if (F) v.ev.forEach((e) => {
      if (e.e !== 'inicio' || !F.tiene(e.mov)) return; const key = e.t + '|' + e.id + '|' + e.mov; if (S.vistos.has(key) || v.tick - e.t > 6) return; S.vistos.add(key);
      const c = U[e.id]; if (!c) return; let t = e.obj ? U[e.obj] : null; if (!t || t === c) t = v.unidades.find((q) => q.side !== c.side && !q.ko) || c;   // v2.310: las defensas/apoyos propios apuntan a la propia criatura; el efecto debe orientarse hacia el RIVAL (si no, el muro de la criatura de la derecha salía a su espalda)
      const esp = c.x > t.x, sx = (u) => (esp ? F.W - (u.x - x0) : u.x - x0);
      S.q[esp ? 1 : 0].inst.push({ inst: F.crear(e.mov, { semilla: (e.t * 7919 + e.mov.length * 131 + c.w) >>> 0, from: { x: sx(c), w: c.w, h: c.h }, to: { x: sx(t), w: t.w, h: t.h }, sprites: { caster: sprite(c.forma, 'right'), target: sprite(t.forma, 'left') } }), cid: c.id, tid: t.id, frz: 0, acc: 0 });
    });
    if (S.vistos.size > 400) S.vistos.clear();
    if (F) S.q.forEach((q) => {
      q.inst.forEach((o) => { o.acc += dt; let n = 0; while (o.acc >= PRO_STEP && n < 12) { o.acc -= PRO_STEP; n++; if (o.frz > 0) { o.frz -= PRO_STEP; continue; } o.inst.update(PRO_STEP); if (o.inst.stop > 0) o.frz = o.inst.stop; } });
      q.inst = q.inst.filter((o) => !(o.inst.dur && o.inst.timeNow() >= o.inst.dur + 0.4));
      q.inst.forEach((o) => { [['caster', o.cid], ['target', o.tid]].forEach(([rol, id]) => { const a = o.inst.actor(rol); if (!S.act[id]) S.act[id] = { dx: a.dx * (q.espejo ? -1 : 1), dy: a.dy, sx: a.sx, sy: a.sy }; }); });
      if (!q.inst.length) return;
      const P = q.P, W = F.W, H = F.H; P.clear(); q.inst.forEach((o) => { o.inst.draw(P, 'back'); o.inst.draw(P, 'front'); });
      const cc = q.c.i32, ll = q.l.i32, col = P.color, lt = P.light, dk = P.dk;
      for (let i = 0; i < W * H; i++) { let c = col[i]; if (!(c >>> 24)) c = dk[i] > 0 ? (((dk[i] * 150) | 0) << 24) >>> 0 : 0; cc[i] = c; const k = i * 3, r = lt[k] > 255 ? 255 : lt[k], g = lt[k + 1] > 255 ? 255 : lt[k + 1], b = lt[k + 2] > 255 ? 255 : lt[k + 2]; ll[i] = (0xff000000 | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0)) >>> 0; }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (cc[i] >>> 24) continue; const so = (j) => (cc[j] >>> 24) > 170; if ((x > 0 && so(i - 1)) || (x < W - 1 && so(i + 1)) || (y > 0 && so(i - W)) || (y < H - 1 && so(i + W))) cc[i] = 0x99301018; }   // contorno oscuro de 1 px alrededor de lo sólido: separa el efecto del suelo claro
      q.c.cx.putImageData(q.c.im, 0, 0); q.l.cx.putImageData(q.l.im, 0, 0);
      ctx.save(); ctx.translate(Math.round(x0 - cam.x) + (q.espejo ? W : 0), Math.round(y0 - cam.y)); if (q.espejo) ctx.scale(-1, 1);
      ctx.drawImage(q.c.c, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(q.l.c, 0, 0); ctx.restore();
    });
    // desintegración: la criatura derrotada desaparece en el acto y su sprite estalla en píxeles sueltos (cada píxel real del dibujo)
    (v.ko || []).forEach((u) => { const key = u.id + '|' + u.t; if (S.pixV.has(key) || !u.forma || u.cap) return; S.pixV.add(key); pulverizar(u); });
    if (v.cap) { const c = v.cap, key = 'huye|' + c.n; if (c.fase === 'huye' && !c.vivo && !S.pixV.has(key)) { S.pixV.add(key); pulverizar({ forma: c.forma, dir: c.dir, x: c.x, y: c.y, t: 99 + c.n }); } S.capV = c; } else S.capV = null;
    if (S.pix.length) { const dt2 = dt; S.pix = S.pix.filter((p) => { p.t += dt2; if (p.t < 0) return true; if (p.t >= p.vida) return false; p.x += p.vx * dt2; p.y += p.vy * dt2; p.vy += 38 * dt2; p.vx *= 0.985; return true; });
      S.pix.forEach((p) => { if (p.t < 0) return; const f = p.t / p.vida, bl = p.t < 0.07 ? 1 - p.t / 0.07 : 0, a = f < 0.55 ? 1 : 1 - (f - 0.55) / 0.45, r = (p.r + (255 - p.r) * bl) | 0, g = (p.g + (255 - p.g) * bl) | 0, b = (p.b + (255 - p.b) * bl) | 0;
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(2) + ')'; ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), 1, 1); }); }
    if (S.capV) capFx(ctx, cam, VWc(), VHc(), S.capV, reloj);   // v2.338
    if (G.combateFx) { // estados, reacciones y lo que no tiene efecto propio: cuadritos genéricos
      G.combateFx.cuadritos(v, reloj, 0).forEach((p) => { const px = Math.round(p.x * T + p.dx - cam.x), py = Math.round(p.k === 'h' ? p.z * T + p.dy - cam.y : p.z * T - p.y * T + p.dy - cam.y); ctx.fillStyle = p.c; ctx.fillRect(px, py, 1, 1); });
    }
  }
  // Barras con «jugo» (v2.278): vaciado suave, trozo de daño que espera y luego se vacía, color por estado; números con pop, subida y desvanecimiento.
  const BAR = { ids: {}, t: null };
  const eo = (t) => 1 - (1 - Math.max(0, Math.min(1, t))) ** 2;
  const ESTADO_COL = { quemado: '#ff6a3d', mojado: '#58b8ee', enredado: '#6cb544', aturdido: '#ffd95a', ralentizado: '#9ad8fa', maldito: '#a878d8', miedo: '#8a6fb0', empujado: '#b9a98f', ciego: '#8a8a8a', debil: '#d9a0a0' };
  const colorHpRamp = (f) => (f > 0.5 ? ['#a9f0b8', '#4fbf6c'] : f > 0.25 ? ['#fff08a', '#e8b82e'] : ['#ff9a8a', '#d9453a']); // [brillo, base]
  const colorHp = (f) => (f > 0.5 ? '#6fdc8c' : f > 0.25 ? '#f7d54a' : '#e0524a');
  function barra(id, hpF, reloj) {
    let b = BAR.ids[id]; if (!b) b = BAR.ids[id] = { s: hpF, c: hpF, esp: 0, r: hpF };
    const dt = BAR.dt;
    if (hpF > b.r + 1e-4) b.glow = 0.7; b.glow = Math.max(0, (b.glow || 0) - dt * 1.6);
    if (hpF < b.r - 1e-4 && !(b.esp > 0) && b.c - b.s < 0.01) b.esp = 0.4;   // v2.311: solo abre la espera si no hay una en curso (el daño seguido la reiniciaba y el trozo blanco no se vaciaba nunca)
                                           // golpe nuevo: el trozo de daño espera un instante
    b.r = hpF; b.s += (hpF - b.s) * (1 - Math.exp(-dt * 9));                    // la barra baja (o sube) con una curva, sin saltar
    if (b.esp > 0) b.esp -= dt; else b.c += (hpF - b.c) * (1 - Math.exp(-dt * 5));
    if (b.c - b.s > 0.18) b.c = b.s + 0.18;   // el trozo de daño nunca pasa de un tramo corto // pasado ese instante, el trozo se vacía
    if (hpF > b.c) b.c = hpF; if (Math.abs(b.s - hpF) < 0.002) b.s = hpF; if (Math.abs(b.c - hpF) < 0.002) b.c = hpF;
    return b;
  }
  function ui(uctx, ui, KS, cam, est, reloj) {
    const v = vista(est, reloj), FX = G.combateFx; if (!v || !FX) return;
    BAR.dt = BAR.t === null ? 0 : Math.max(0, Math.min(0.1, reloj - BAR.t)); BAR.t = reloj; if (!BAR.n || BAR.k !== est.combate) { BAR.ids = {}; BAR.k = est.combate; BAR.n = 1; }
    const dpr = root.devicePixelRatio || 1, u = Math.max(2, Math.round(1.5 * dpr));
    const L = FX.ui(v), ranks = {}; L.forEach((it) => { if (it.t === 'num' || it.t === 'cura') { const a = ranks[it.id] = ranks[it.id] || []; if (a.indexOf(it.tk) < 0) a.push(it.tk); } }); Object.keys(ranks).forEach((k) => ranks[k].sort((x, y) => x - y));
    const BP = L.filter((it) => it.t === 'barra').sort((a, b) => a.x - b.x), SEP = 40;   // placas: separación mínima en px de juego para que no se pisen
    if (BP.length > 1) for (let i = 1; i < BP.length; i++) { const d = BP[i].x - BP[i - 1].x; if (d < SEP) { const m = (SEP - d) / 2; BP[i - 1].x -= m; BP[i].x += m; } }
    L.forEach((it) => {
      if (it.t === 'final') { const w = G.pixelTextWidth(it.txt, u * 2); G.drawPixelText(uctx, it.txt, Math.round((ui.width - w) / 2), Math.round(ui.height * 0.22), u * 2, '#fff4dc', '#24121d'); return; }
      let h = it.h, al = it.a;
      let ox = 0, col = '#fff4dc', sz = u;
      if (it.t === 'num' || it.t === 'cura') {   // nace sobre el cuerpo del objetivo, sube un poco con freno y se apaga rápido: nunca queda flotando
        const tn = 1 - it.a, idx = ranks[it.id].indexOf(it.tk); h = it.h + 14 * eo(tn); al = tn < 0.5 ? 1 : 1 - (tn - 0.5) / 0.5;
        ox = (idx % 2 ? 1 : -1) * 4 * KS * eo(tn * 2) * (1 + Math.floor(idx / 2));                                          // varios golpes seguidos se abren a los lados
        if (it.t === 'cura') { col = '#7ef0a0'; sz = Math.round(u * 1.5); }
        else { const f = it.fr < 0.08 ? 1 : it.fr < 0.2 ? 1.5 : 2; sz = Math.max(u, Math.round(u * (f + (it.crit ? 0.5 : 0)))); col = it.crit ? '#ffd84a' : it.ef > 1.01 ? '#ffa94a' : it.ef < 0.99 ? '#a8b8c8' : '#fff4dc'; if (it.crit && tn < 0.3) ox += (Math.floor(tn * 40) % 2 ? 1 : -1) * 2 * KS; }  // tamaño según el daño; color por eficacia; crítico dorado, grande y con temblor
        if (it.dot) { col = '#ff9a4a'; sz = u; }                                                                              // quemadura: pequeña y naranja
        if (tn < 0.15 && !it.dot) sz = Math.round(sz * 1.25);                                                                           // pop al entrar
      } // pop al entrar, sube con freno y se apaga al final
      const sx = (it.x - cam.x) * KS + ox, sy = (it.y - cam.y - h) * KS; if (sx < -60 || sx > ui.width + 60 || sy < -40 || sy > ui.height + 40) return;
      if (it.t === 'barra') {
        const hb = S.hit[it.id], b = barra(it.id, it.hpF, reloj), q = Math.max(2, KS), W = 22, shk = hb ? (Math.floor(hb.a * 2) % 2 ? 1 : -1) * Math.round(hb.k) : 0;
        const x = Math.round(sx / q) * q - Math.round(W / 2) * q + shk * q, y = Math.round(sy / q) * q - 5 * q, R = (a, b2, w, h, c, al2) => { uctx.globalAlpha = al2 === undefined ? 1 : al2; uctx.fillStyle = c; uctx.fillRect(x + a * q, y + b2 * q, w * q, h * q); uctx.globalAlpha = 1; };
        const pe = (G.combateFx.PAL[it.el] || G.combateFx.PAL.fuego), mat = colorHpRamp(b.s);
        // placa: borde violeta del juego con esquinas cortadas, tablero interior y relieve
        R(1, 0, W - 2, 1, '#24121d'); R(1, 4, W - 2, 1, '#24121d'); R(0, 1, 1, 3, '#24121d'); R(W - 1, 1, 1, 3, '#24121d'); R(1, 1, W - 2, 3, '#5a3845');
        R(1, 4, W - 2, 1, '#24121d'); R(2, 1, W - 4, 1, 'rgba(255,244,220,0.24)');
        const iw = W - 4, fx = 2;                                                                                  // hueco de la barra: 18 px de juego
        R(fx, 2, iw, 2, '#2b1824');
        if (b.c > b.s) R(fx, 2, Math.round(iw * b.c), 2, b.esp > 0 ? '#fff4e0' : '#e8604f');                      // trozo de daño
        R(fx, 2, Math.round(iw * b.s), 2, mat[1]); R(fx, 2, Math.round(iw * b.s), 1, mat[0]);                      // vida: tono base y brillo superior
        for (let k = 1; k < 4; k++) R(fx + Math.round(iw * k / 4), 2, 1, 2, 'rgba(42,27,48,0.55)');                // marcas de cuarto
        if (hb) R(fx, 2, iw, 2, '#ffffff', Math.min(0.9, 0.8 * hb.k));
        if (b.glow > 0) R(fx, 2, Math.round(iw * b.s), 2, '#c8ffd8', Math.min(1, b.glow * 1.2));
        // insignia del elemento: rombo de su color con centro claro, sobre la esquina izquierda
        R(-3, 0, 1, 1, '#24121d'); R(-4, 1, 3, 1, '#24121d'); R(-5, 2, 5, 1, '#24121d'); R(-4, 3, 3, 1, '#24121d'); R(-3, 4, 1, 1, '#24121d');
        R(-3, 1, 1, 1, pe[2]); R(-4, 2, 3, 1, pe[1]); R(-3, 3, 1, 1, pe[0]); R(-3, 2, 1, 1, pe[3]);
        let yy = 5;
        if (it.med !== null) {   // medidor del especial: carril fino bajo la placa; al llenarse parpadea dorado con un rayo
          const lleno = it.med >= 100, par = lleno && Math.floor(reloj * 6) % 2 === 0;
          R(1, yy, W - 2, 2, '#24121d'); R(2, yy, iw, 1, '#2b1824'); R(2, yy, Math.round(iw * Math.min(1, it.med / 100)), 1, lleno ? (par ? '#fff3a8' : '#ffd84a') : '#4aa3e8');
          if (lleno) { R(W - 1, yy - 1, 1, 1, '#ffd84a'); R(W, yy, 1, 1, '#ffd84a'); R(W - 1, yy + 1, 1, 1, '#ffd84a'); R(W, yy + 2, 1, 1, '#ffd84a'); } yy += 2;
        }
        (it.est || []).slice(0, 5).forEach((n, ix) => { const c = ESTADO_COL[n] || '#ccc'; R(1 + ix * 3, yy + 1, 2, 2, '#24121d'); R(1 + ix * 3, yy + 1, 2, 2, c); });   // un cuadrito por estado
        const w = G.pixelTextWidth(it.nom, u), tx = Math.round(sx - w / 2), ty = y - G.PIXEL_TEXT_HEIGHT * u - 2 * q;
        uctx.fillStyle = 'rgba(42,27,48,0.7)'; uctx.fillRect(tx - q, ty - Math.floor(q / 2), w + 2 * q, G.PIXEL_TEXT_HEIGHT * u + q);
        G.drawPixelText(uctx, it.nom, tx, ty, u, '#fff4dc', '#24121d');
      } else if (it.t === 'mov') {
        if (it.hueco !== 'e') return;   // solo los especiales llevan nombre: cartel fijo arriba, sin tapar a las criaturas   // nombre del movimiento, en una cinta con el color de su elemento
        const pe = G.combateFx.PAL[it.el] || G.combateFx.PAL.fuego, k = it.hueco === 'e' ? Math.round(u * 1.5) : u, w = G.pixelTextWidth(it.txt, k), tx = Math.round((ui.width - w) / 2), ty = Math.round(ui.height * 0.13), hh = G.PIXEL_TEXT_HEIGHT * k;   // la cinta se corre hacia fuera para no tapar al rival
        uctx.globalAlpha = Math.max(0, al); uctx.fillStyle = '#24121d'; uctx.fillRect(tx - 3 * u, ty - u, w + 6 * u, hh + 2 * u); uctx.fillStyle = pe[1]; uctx.fillRect(tx - 3 * u, ty - u, u * 2, hh + 2 * u); uctx.fillRect(tx + w + u, ty - u, u * 2, hh + 2 * u);
        G.drawPixelText(uctx, it.txt, tx, ty, k, '#fff4dc', '#24121d'); uctx.globalAlpha = 1;
      } else { uctx.globalAlpha = Math.max(0, al); const k = it.t === 'num' || it.t === 'cura' ? sz : u, w = G.pixelTextWidth(it.txt, k); G.drawPixelText(uctx, it.txt, Math.round(sx - w / 2), Math.round(sy), k, it.t === 'reac' ? (it.c || '#ffd84a') : col, '#24121d'); uctx.globalAlpha = 1; }
    });    capturaUI(uctx, cam, KS, est, reloj, u, ui);
  }
  // anillo de puntería, textos y esferas restantes (se dibuja en el lienzo de texto, a resolución de pantalla)
  function capturaUI(uctx, cam, KS, est, reloj, u, ui) {
    const c = S.capV; if (!c) return; const tx = (t, x, y, k, col) => { const w = G.pixelTextWidth(t, k); G.drawPixelText(uctx, t, Math.round(x - w / 2), Math.round(y), k, col, '#24121d'); };
    const sx = (c.x - cam.x) * KS, sy = (c.y - c.h * 0.5 - cam.y) * KS, j = est.jugadores[S.me2 || 'oli'] || {}, n = j.esferas === undefined ? 5 : j.esferas;
    if (c.fase === 'oferta' && c.t >= 0.8) {
      const r = anillo(c), col = r < 0.42 ? '#ffd84a' : r < 0.68 ? '#7ef0a0' : '#fff4dc', R0 = (c.w * 0.5 + 9) * KS, R = R0 + 16 * r * KS, q = Math.max(3, Math.round(KS * 0.75));
      for (let a = 0; a < 64; a++) { const an = a / 64 * Math.PI * 2; uctx.fillStyle = 'rgba(255,249,238,0.35)'; uctx.fillRect(Math.round(sx + Math.cos(an) * R0 - q / 2), Math.round(sy + Math.sin(an) * R0 * 0.8 - q / 2), q, q); uctx.fillStyle = col; uctx.fillRect(Math.round(sx + Math.cos(an) * R - q / 2), Math.round(sy + Math.sin(an) * R * 0.8 - q / 2), q, q); }
      if (c.vivo && c.n === 0 && c.t < 2.4) tx('¡Está débil!', ui.width / 2, ui.height * 0.3, u * 2, Math.floor(reloj * 6) % 2 ? '#ff6a5a' : '#ffd84a'); tx('Desliza hacia la criatura', ui.width / 2, ui.height * 0.62, u, '#fff4dc'); tx('Esferas x' + n, ui.width / 2, ui.height * 0.62 + G.PIXEL_TEXT_HEIGHT * u * 1.6, u, '#ffd84a');
    }
    if (S.msg && reloj - S.msg.t < 1.1) { const f = (reloj - S.msg.t) / 1.1; uctx.globalAlpha = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3; tx(S.msg.txt, sx, sy - (c.h * 0.7 + 8 + 10 * f) * KS, Math.round(u * 1.5), S.msg.col || '#ffd84a'); uctx.globalAlpha = 1; }
    if (c.fase === 'ok' && c.t > 0.9) { tx('¡Capturada!', ui.width / 2, ui.height * 0.3, u * 2, '#ffd84a'); tx('Enviada al Centro PC', ui.width / 2, ui.height * 0.3 + G.PIXEL_TEXT_HEIGHT * u * 2.6, u, '#fff4dc'); }
    else if (c.fase === 'rompe' && c.t < 0.8) tx(c.miss ? 'Fallaste' : '¡Se escapó!', ui.width / 2, ui.height * 0.3, u * 2, '#fff4dc');
    else if (c.fase === 'huye' && !c.vivo) tx('Huyó...', ui.width / 2, ui.height * 0.3, u * 2, '#c8d0e0');
  }
  G.combate2d = { _bar: BAR, aviso: (txt, reloj, col) => { S.msg = { txt, t: reloj, col }; }, quien: (id) => { S.me2 = id; }, anillo, calidad, entradas, unidad, efectos, ui, pixeles: () => S.pix.length, activos: () => (S.q ? S.q.reduce((n, q) => n + q.inst.length, 0) : 0) };
})(typeof window !== 'undefined' ? window : globalThis);
