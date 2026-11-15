// ═════════ HOJA (7 movimientos; Savia vital ya está en moves.js) ═════════
const SPORE = ramp(['#4a5a14', '#86a02c', '#c0d853', '#e8f59a', '#ffffe0']);
const BARK = ramp(['#2e2016', '#4b3522', '#6b4d2f', '#8e6c42', '#b08c5a']);
const LEAFC = [150, 235, 100];

// partículas propias de Hoja: espora (punto con halo) y nube (disco blando)
const _pd4 = Particles.prototype.draw;
Particles.prototype.draw = function (p, layer) {
  _pd4.call(this, p, layer);
  for (const q of this.a) {
    if (q.layer !== layer) continue;
    const k = q.age / q.life, a = k < 0.2 ? k / 0.2 : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
    if (q.kind === 'spore') { const x = q.x + Math.sin(q.age * 4 + q.seed) * 1.4; p.dpx(x, q.y, SPORE[3 + (q.seed & 1)], a); if (q.big) { p.dpx(x + 1, q.y, SPORE[2], a * 0.8); p.dpx(x, q.y + 1, SPORE[2], a * 0.8); } p.glow(x, q.y, 4, [200, 235, 90], 0.22 * a); }
    else if (q.kind === 'cloud') { const r = lerp(q.r0, q.r1, eo(k)); p.disc(q.x, q.y, r, SPORE[q.seed % 3], a * (q.a0 || 0.5)); p.disc(q.x - r * 0.25, q.y - r * 0.25, r * 0.6, SPORE[2 + (q.seed % 2)], a * (q.a0 || 0.5) * 0.7); }
  }
};

// enredadera: tallo grueso con borde oscuro y brillo
function vine(p, pts, th, taper = 0.5, a = 1) {
  const n = pts.length - 1;
  for (let pass = 0; pass < 3; pass++) {
    const c = pass === 0 ? LEAF[0] : pass === 1 ? LEAF[2] : LEAF[4], off = pass === 2 ? -th * 0.16 : 0;
    for (let i = 0; i < n; i++) {
      const A = pts[i], Bp = pts[i + 1], m = Math.max(1, Math.ceil(Math.hypot(Bp.x - A.x, Bp.y - A.y))), tp = 1 - taper * (i / n);
      const r = (pass === 0 ? th / 2 + 0.9 : pass === 1 ? th / 2 : Math.max(0.5, th / 4)) * tp;
      for (let k = 0; k < m; k++) { const u = k / m; p.disc(lerp(A.x, Bp.x, u) + off, lerp(A.y, Bp.y, u) + off, r, c, a); }
    }
  }
}
// impacto verde: hojas, chispas, onda
function leafHit(B, R, I, T, big = 1) {
  const P = B.P;
  B.shake = 2.4 * big; B.stop = 0.07 * big;
  for (let i = 0; i < 9 * big; i++) P.add({ kind: 'leaf', x: I.x + R.range(-3, 3), y: I.y + R.range(-4, 4), vx: R.range(-70, 70), vy: R.range(-80, -10), g: 110, drag: 1, life: R.range(0.5, 0.9), w: 12, len: R.range(1.6, 2.6) });
  for (let i = 0; i < 12 * big; i++) { const a = R.range(0, 6.28), s = R.range(50, 140); P.add({ kind: 'spark', x: I.x, y: I.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: R.range(0.15, 0.3), rp: LEAF, gc: LEAFC }); }
  P.ring({ x: I.x, y: I.y, r0: 1, r1: 11 * big, th: 2, life: 0.22, rp: LEAF, ry: 1, layer: 'front' });
  for (let i = 0; i < 5; i++) P.add({ kind: 'dust', x: T.x + R.range(-7, 7), y: T.y - 1, vx: R.range(-26, 26), vy: R.range(-8, -2), life: R.range(0.3, 0.5), r0: 1, r1: 3, layer: 'back' });
}
const reactHit = (k, amp, ta = 0.3) => (k < 0 ? act({}) : act({ dx: kf(k, [[0, 0], [0.07, amp], [0.5, 0]]), sy: kf(k, [[0, 1], [0.05, 0.82], [0.16, 1.07], [0.4, 1]]), sx: kf(k, [[0, 1], [0.05, 1.14], [0.16, 0.95], [0.4, 1]]), flash: 0.55 * clamp(1 - k / 0.12), tint: [120, 255, 90], tintA: k < 0.8 ? ta * clamp(1 - k / 0.8) : 0 }));
const dur4 = (B, d, extra) => Object.assign({ dur: d, timeNow: () => B.t, count: () => B.P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; } }, extra);

// ───────────── Latigazo (Hoja · básico · contacto) ─────────────
function latigazo(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const H = { x: F.x + F.w * 0.35, y: F.y - F.h * 0.45 }, I = { x: T.x - T.w * 0.3, y: T.y - T.h * 0.5 };
  const L = Math.hypot(I.x - H.x, I.y - H.y) * 1.0, AH = Math.atan2(I.y - H.y, I.x - H.x);
  const T_W = 0.4, T_L = T_W + 0.13, T_HIT = T_L + 0.01; let hit = false;
  const aF = (t) => (t < T_W ? lerp(AH - 0.5, AH - 2.2, smooth(t / T_W)) : t < T_L ? lerp(AH - 2.2, AH + 0.04, ei((t - T_W) / 0.13)) : lerp(AH + 0.04, AH - 0.2, smooth((t - T_L) / 0.45)));
  const lf = (t) => (t < T_W ? lerp(0.4, 0.62, smooth(t / T_W)) : t < T_L ? lerp(0.62, 1, ei((t - T_W) / 0.13)) : lerp(1, 0.25, smooth((t - T_L) / 0.45)));
  const amp = (t) => (t < T_W ? 3 : t < T_L ? lerp(7, 0.6, (t - T_W) / 0.13) : 0.6 + 3 * Math.sin(clamp((t - T_L) / 0.35) * Math.PI));
  const pts = (t) => { const a = [], N = 22, l = lf(t), A = amp(t), ang = aF(t); for (let i = 0; i <= N; i++) { const u = i / N, r = u * L * l, w = Math.sin(u * 8 - t * (t < T_W ? 9 : 55)) * A * Math.sin(Math.min(1, u * 1.3) * Math.PI) * (0.4 + 0.6 * u), nx = -Math.sin(ang), ny = Math.cos(ang); a.push({ x: H.x + Math.cos(ang) * r + nx * w, y: H.y + Math.sin(ang) * r + ny * w }); } return a; };
  B.S.at(T_L - 0.02, () => { B.shake = 0.8; for (let i = 0; i < 6; i++) P.add({ kind: 'dust', x: F.x + F.w * 0.5 + R.range(0, 8), y: GY - 1, vx: R.range(10, 40), vy: R.range(-6, -1), life: 0.3, r0: 1, r1: 3, layer: 'back' }); });
  B.S.at(T_HIT, () => {
    hit = true; leafHit(B, R, I, T, 1.3); B.stop = 0.1; B.shake = 3.4;
    P.ring({ x: I.x, y: I.y, r0: 2, r1: 16, th: 2, life: 0.18, rp: LEAF, ry: 1, layer: 'front' });
    P.add({ kind: 'sparkle', x: I.x, y: I.y, vx: 0, vy: 0, life: 0.22, len: 5, rp: LEAF });
    for (let i = 0; i < 8; i++) { const a = R.range(-0.9, 0.9), s = R.range(80, 170); P.add({ kind: 'spark', x: I.x, y: I.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.2, rp: LEAF, gc: LEAFC }); }
  });
  let n = 0;
  return dur4(B, 1.9, {
    update(dt) { B.tick(dt); const t = B.t; if (t < T_W) { n -= dt; if (n <= 0) { n = 0.05; const q = pts(t)[14]; P.add({ kind: 'leaf', x: q.x, y: q.y, vx: R.range(-8, 8), vy: R.range(-10, 6), g: 30, life: 0.5, w: 9, len: 1.5 }); } }
      if (t > T_W && t < T_HIT) { n -= dt; if (n <= 0) { n = 0.012; const q = pts(t), tp = q[q.length - 1]; P.add({ kind: 'leaf', x: tp.x, y: tp.y, vx: R.range(-30, 0), vy: R.range(-20, 20), g: 20, life: 0.35, w: 14, len: 1.4 }); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front' && t < T_L + 0.5) {
        if (t > T_W && t < T_HIT + 0.05) for (let g = 4; g >= 1; g--) vine(p, pts(t - g * 0.016), 3, 0.6, 0.18 + 0.05 * (4 - g));
        const q = pts(t), tip = q[q.length - 1], pr = q[q.length - 2], ang = Math.atan2(tip.y - pr.y, tip.x - pr.x);
        vine(p, q, 3.6, 0.6);
        for (let i = 3; i < q.length - 2; i += 3) { const d = (i % 2 ? 1 : -1), a2 = Math.atan2(q[i + 1].y - q[i].y, q[i + 1].x - q[i].x); p.line(q[i].x, q[i].y, q[i].x + Math.cos(a2 + d * 1.5) * 2.4, q[i].y + Math.sin(a2 + d * 1.5) * 2.4, BARK[4]); }
        leaf(p, q[10].x, q[10].y - 1, 3, 1.4, ang - 1.3); leaf(p, q[15].x, q[15].y + 1, 3, 1.4, ang + 1.3);
        leaf(p, tip.x, tip.y, 4, 1.8, ang, LEAF);
        if (t > T_L - 0.03 && t < T_HIT + 0.06) { p.glow(tip.x, tip.y, 10, LEAFC, 0.35); const k = (t - (T_L - 0.03)) / 0.1; if (k < 1) p.ring(tip.x, tip.y, 3 + 9 * k, 1, LEAF[5], 1, 1 - k); }
        if (t < T_W) p.glow(H.x, H.y, 8, LEAFC, 0.3 * (t / T_W));
      }
      if (layer === 'front' && hit) { const k = t - T_HIT; if (k < 0.22) p.glow(I.x, I.y, 18, LEAFC, 0.3 * (1 - k / 0.22)); }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') return act(t < T_W ? { dx: -3 * smooth(t / T_W), sx: kf(t, [[0, 1], [T_W, 0.9]]), sy: kf(t, [[0, 1], [T_W, 1.1]]), tintA: 0.25 * (t / T_W), tint: LEAFC } : { dx: kf(t - T_W, [[0, -3], [0.13, 4.5], [0.6, 0]]), sx: kf(t - T_W, [[0, 0.9], [0.13, 1.16], [0.5, 1]]), sy: kf(t - T_W, [[0, 1.1], [0.13, 0.88], [0.5, 1]]), tintA: 0.25 * clamp(1 - (t - T_L) / 0.3), tint: LEAFC });
      return reactHit(t - T_HIT, 8.5);
    },
  });
}

// ───────────── Cuchilla de hoja (Hoja · básico · proyectil ×3) ─────────────
function cuchilla(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.62 }, I = { x: T.x - T.w * 0.25, y: T.y - T.h * 0.5 };
  const T_REL = 0.5, FLY = 0.3, GAPS = [0, 0.1, 0.2], YS = [-7, 0, 7], hits = [];
  const pos = (i, t) => { const u = clamp((t - T_REL - GAPS[i]) / FLY); return { u, x: lerp(M.x + 4, I.x, Math.pow(u, 1.3)), y: lerp(M.y, I.y + YS[i], u) - Math.sin(Math.PI * u) * (i - 1) * 5 }; };
  GAPS.forEach((g, i) => B.S.at(T_REL + g + FLY, () => {
    const q = { x: I.x, y: I.y + YS[i] }; hits.push(B.t);
    B.shake = 1.6 + i * 0.8; B.stop = 0.03 + (i === 2 ? 0.05 : 0);
    for (let j = 0; j < 7; j++) P.add({ kind: 'leaf', x: q.x, y: q.y, vx: R.range(-60, 60), vy: R.range(-70, -5), g: 110, drag: 1, life: R.range(0.4, 0.8), w: 13, len: R.range(1.3, 2.2) });
    for (let j = 0; j < 8; j++) { const a = R.range(-1, 1) + Math.PI, s = R.range(60, 130); P.add({ kind: 'spark', x: q.x, y: q.y, vx: Math.cos(a + R.range(-0.4, 0.4)) * s * -1, vy: Math.sin(a) * s, life: 0.2, rp: LEAF, gc: LEAFC }); }
    P.ring({ x: q.x, y: q.y, r0: 1, r1: i === 2 ? 12 : 8, th: 2, life: 0.2, rp: LEAF, ry: 1, layer: 'front' });
  }));
  B.S.at(T_REL, () => { B.shake = 0.8; for (let i = 0; i < 8; i++) P.add({ kind: 'sparkle', x: M.x + R.range(-6, 6), y: M.y + R.range(-8, 8), vx: R.range(0, 30), vy: R.range(-10, 10), life: 0.35, len: 1.5, rp: LEAF }); });
  let n = 0;
  return dur4(B, 2.0, {
    update(dt) { B.tick(dt); const t = B.t; for (let i = 0; i < 3; i++) { const q = pos(i, t); if (q.u > 0 && q.u < 1) { n -= dt; if (n <= 0) { n = 0.035; P.add({ kind: 'sparkle', x: q.x - 2, y: q.y + R.range(-1.5, 1.5), vx: -20, vy: 0, life: 0.25, len: 1, rp: LEAF }); if (R.next() < 0.3) P.add({ kind: 'leaf', x: q.x, y: q.y, vx: R.range(-30, -5), vy: R.range(-10, 10), g: 40, life: 0.4, w: 10, len: 1.2 }); } } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; for (let i = 0; i < 3; i++) { const a = t * 9 + i * 2.094, r = 6 + 5 * (1 - u); leaf(p, M.x + Math.cos(a) * r * 0.6, M.y + Math.sin(a) * r, 3.4 * (0.5 + 0.5 * u), 1.7 * (0.5 + 0.5 * u), a * 2); } p.glow(M.x, M.y, 8 + 8 * u, LEAFC, 0.4 * u); }
        for (let i = 0; i < 3; i++) { const q = pos(i, t); if (q.u > 0 && q.u < 1) { const a = t * 28 + i; for (let g = 2; g >= 1; g--) { const q2 = pos(i, t - g * 0.014); leaf(p, q2.x, q2.y, 5, 2.4, a - g * 0.7, LEAF, 0.35); } leaf(p, q.x, q.y, 6, 2.8, a); p.glow(q.x, q.y, 8, LEAFC, 0.3); } }
        hits.forEach((h, i) => { const k = t - h; if (k < 0.2) { const q = { x: I.x, y: I.y + YS[i % 3] }, f = k / 0.2; p.glow(q.x, q.y, 14, LEAFC, 0.35 * (1 - f)); const L2 = 9 * eo(k / 0.08); for (let s = -1; s <= 1; s += 2) p.line(q.x - L2, q.y + L2 * 0.5 * s, q.x + L2, q.y - L2 * 0.5 * s, f < 0.6 ? LEAF[5] : LEAF[3]); } });
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sx: kf(t, [[0, 1], [T_REL, 0.9]]), sy: kf(t, [[0, 1], [T_REL, 1.12]]), tintA: 0.3 * (t / T_REL), tint: LEAFC } : { sx: kf(r, [[0, 0.9], [0.06, 1.14], [0.3, 1]]), sy: kf(r, [[0, 1.12], [0.06, 0.88], [0.3, 1]]), dx: kf(r, [[0, 0], [0.08, 2.5], [0.4, 0]]), tintA: 0.25 * clamp(1 - r / 0.3), tint: LEAFC }); }
      let dx = 0, fl = 0, sy = 1, sx = 1; hits.forEach((h) => { const k = t - h; if (k >= 0 && k < 0.45) { dx += kf(k, [[0, 0], [0.05, 2.6], [0.4, 0]]); fl = Math.max(fl, clamp(1 - k / 0.1)); sy = Math.min(sy, kf(k, [[0, 1], [0.04, 0.9], [0.2, 1]])); sx = Math.max(sx, kf(k, [[0, 1], [0.04, 1.08], [0.2, 1]])); } });
      return act({ dx, flash: fl, sy, sx, tint: [120, 255, 90], tintA: hits.length ? 0.25 * clamp(1 - (t - hits[hits.length - 1]) / 0.8) : 0 });
    },
  });
}

// ───────────── Enredadera (Hoja · habilidad · zona, inmoviliza) ─────────────
function enredadera(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_TEL = 0.3, T_B = 0.75, T_GROW = 0.6, T_REL = 2.2, T_END = 2.9;
  const V = [{ x: -0.36, ph: 0, back: false }, { x: 0.36, ph: 2.1, back: false }, { x: 0, ph: 4.2, back: true }, { x: -0.16, ph: 1.1, back: true }, { x: 0.16, ph: 3.2, back: false }];
  const grow = (t) => (t < T_B ? 0 : eo((t - T_B) / T_GROW) * (t > T_REL ? 1 - smooth((t - T_REL) / (T_END - T_REL)) : 1));
  const vpts = (v, t) => { const h = T.h * 1.1 * grow(t), sq = 1 - 0.18 * smooth((t - T_B - T_GROW) / 0.35), a = []; for (let i = 0; i <= 14; i++) { const u = i / 14; a.push({ x: T.x + v.x * T.w * (1 - 0.5 * u) + Math.sin(u * 7.5 + v.ph) * T.w * 0.5 * (0.55 + 0.45 * u) * sq, y: GY - u * h }); } return a; };
  B.S.at(T_TEL, () => { B.shake = 0.5; for (let i = 0; i < 6; i++) P.add({ kind: 'leaf', x: F.x + R.range(-6, 6), y: GY - 1, vx: R.range(-10, 20), vy: R.range(-40, -15), g: 60, life: 0.6, w: 9, len: 1.5 }); });
  B.S.at(T_B, () => { B.shake = 2.6; B.stop = 0.05; P.ring({ x: T.x, y: GY, r0: 2, r1: 26, th: 2, life: 0.4, rp: LEAF, ry: 0.32, layer: 'front' }); for (let i = 0; i < 16; i++) P.add({ kind: 'dust', x: T.x + R.range(-T.w * 0.6, T.w * 0.6), y: GY - 1, vx: R.range(-30, 30), vy: R.range(-24, -5), life: R.range(0.3, 0.6), r0: 1, r1: 4, layer: 'back' }); for (let i = 0; i < 10; i++) P.add({ kind: 'leaf', x: T.x + R.range(-T.w * 0.5, T.w * 0.5), y: GY - 2, vx: R.range(-30, 30), vy: R.range(-90, -30), g: 110, drag: 1, life: R.range(0.6, 1), w: 11, len: 2 }); });
  B.S.at(T_B + T_GROW, () => { B.shake = 1.2; for (let i = 0; i < 8; i++) P.add({ kind: 'sparkle', x: T.x + R.range(-T.w * 0.5, T.w * 0.5), y: T.y - R.range(2, T.h), vx: 0, vy: -8, life: 0.4, len: 1.5, rp: LEAF }); });
  B.S.at(T_REL, () => { for (let i = 0; i < 16; i++) P.add({ kind: 'leaf', x: T.x + R.range(-T.w * 0.6, T.w * 0.6), y: T.y - R.range(2, T.h), vx: R.range(-24, 24), vy: R.range(-30, 5), g: 40, life: R.range(0.8, 1.4), w: 9, len: 1.8, rp: LEAF }); });
  const drawV = (p, t, back) => V.forEach((v, i) => { if (v.back !== back || grow(t) <= 0.02) return; const q = vpts(v, t); vine(p, q, 3.2, 0.5); for (const u of [4, 9]) leaf(p, q[u].x + (i % 2 ? 2 : -2), q[u].y, 2.4, 1.1, (i % 2 ? 0.4 : Math.PI - 0.4)); });
  return dur4(B, 3.2, {
    update(dt) { B.tick(dt); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') {
        if (t > T_TEL) { const a = clamp((t - T_TEL) / 0.4) * (t < T_B ? 1 : clamp(1 - (t - T_B) / 1.5)); for (let y = -3; y <= 3; y++) for (let x = -16; x <= 16; x++) { const d = (x / 16) ** 2 + (y / 3) ** 2, n = fbm((T.x + x) * 0.3, (GY + y) * 0.5, 4); if (d + (n - 0.5) * 0.5 < 1) p.dark(T.x + x, GY + y, 0.55 * a); } }
        drawV(p, t, true);
      }
      if (layer === 'front') {
        if (t > T_TEL && t < T_B) { const u = (t - T_TEL) / (T_B - T_TEL); p.ring(T.x, GY, 6 + 12 * u, 1, LEAF[4], 0.32, 0.9); p.ring(T.x, GY, 3 + 8 * u, 1, LEAF[3], 0.32, 0.8); p.glow(T.x, GY, 20, LEAFC, 0.3 * u); }
        drawV(p, t, false);
        if (t > T_B && t < T_B + 0.4) p.glow(T.x, GY - 6, 28, LEAFC, 0.6 * (1 - (t - T_B) / 0.4));
        if (grow(t) > 0.3) p.glow(T.x, T.y - T.h * 0.5, 22, LEAFC, 0.14 * grow(t));
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') return act(t < T_B ? { sy: kf(t, [[0, 1], [T_TEL, 0.84], [T_B, 0.84]]), sx: kf(t, [[0, 1], [T_TEL, 1.14], [T_B, 1.14]]), tintA: 0.3 * clamp(t / T_TEL), tint: LEAFC } : { sy: kf(t - T_B, [[0, 0.84], [0.1, 1.1], [0.35, 1]]), sx: kf(t - T_B, [[0, 1.14], [0.1, 0.92], [0.35, 1]]), tintA: 0.3 * clamp(1 - (t - T_B) / 0.4), tint: LEAFC });
      if (t < T_B) return act({ dx: t > T_TEL ? Math.sin(t * 50) * 0.6 : 0 });
      if (t < T_REL) { const k = t - T_B, s = clamp((k - T_GROW) / 0.3); return act({ sx: 1 - 0.07 * s, sy: kf(k, [[0, 1], [0.1, 1.06], [0.3, 0.97]]), dx: Math.sin(t * 28) * 0.7 * (1 - clamp(k / 1.2)) * s, tint: [90, 200, 70], tintA: 0.3 * clamp(k / 0.4), flash: clamp(1 - k / 0.1) * 0.6 }); }
      const k = t - T_REL; return act({ sy: kf(k, [[0, 0.97], [0.1, 1.12], [0.35, 1]]), sx: kf(k, [[0, 0.93], [0.1, 0.95], [0.35, 1]]), tint: [90, 200, 70], tintA: 0.3 * clamp(1 - k / 0.5) });
    },
  });
}

// ───────────── Nube de esporas (Hoja · habilidad · área, ralentiza) ─────────────
function esporas(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.4, y: F.y - F.h * 0.6 }, C = { x: T.x, y: T.y - T.h * 0.45 };
  const T_INF = 0.55, T_PUFF = 0.7, T_X = 1.25, T_END = 3.2; let n = 0, m = 0;
  B.S.at(T_PUFF, () => { B.shake = 1; for (let i = 0; i < 16; i++) P.add({ kind: 'cloud', x: M.x + R.range(-2, 4), y: M.y + R.range(-3, 3), vx: R.range(20, 60), vy: R.range(-10, 6), drag: 1.3, life: R.range(0.5, 0.8), r0: 2, r1: R.range(4, 7), a0: 0.55, layer: 'back' }); });
  B.S.at(T_X, () => { B.shake = 1.4; P.ring({ x: C.x, y: GY, r0: 2, r1: 30, th: 2, life: 0.5, rp: SPORE, ry: 0.32, layer: 'front' }); for (let i = 0; i < 26; i++) { const a = R.range(0, 6.28), d = R.range(0, 14); P.add({ kind: 'cloud', x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d * 0.8 + 4, vx: Math.cos(a) * R.range(5, 22), vy: R.range(-14, -2), drag: 1, life: R.range(1.2, 2.0), r0: 3, r1: R.range(6, 11), a0: 0.45, layer: R.next() < 0.5 ? 'back' : 'front' }); } });
  return dur4(B, 3.6, {
    update(dt) {
      B.tick(dt); const t = B.t;
      if (t < T_PUFF) { n -= dt; if (n <= 0) { n = 0.04; P.add({ kind: 'spore', x: M.x + R.range(-6, 6), y: M.y + R.range(-4, 6), vx: R.range(-6, 6), vy: R.range(-16, -4), life: 0.5 }); } }
      if (t > T_PUFF && t < T_X) { n -= dt; if (n <= 0) { n = 0.02; const u = (t - T_PUFF) / (T_X - T_PUFF); P.add({ kind: 'spore', x: lerp(M.x, C.x, u) + R.range(-4, 4), y: lerp(M.y, C.y, u) + R.range(-6, 6) - Math.sin(Math.PI * u) * 6, vx: R.range(-8, 8), vy: R.range(-8, 8), life: 0.5, big: R.next() < 0.3 }); } }
      if (t > T_X && t < T_END - 0.3) {
        n -= dt; if (n <= 0) { n = 0.03; P.add({ kind: 'spore', x: C.x + R.range(-T.w * 0.9, T.w * 0.9), y: GY - R.range(0, T.h * 1.4), vx: R.range(-6, 6), vy: R.range(-12, -3), life: R.range(0.8, 1.4), big: R.next() < 0.4 }); }
        m -= dt; if (m <= 0) { m = 0.18; P.add({ kind: 'cloud', x: C.x + R.range(-T.w * 0.7, T.w * 0.7), y: C.y + R.range(-8, 10), vx: R.range(-6, 6), vy: R.range(-6, -1), life: 1.2, r0: 4, r1: R.range(7, 11), a0: 0.35, layer: 'front' });
          P.add({ kind: 'sparkle', x: C.x + R.range(-8, 8), y: C.y + R.range(-T.h * 0.5, T.h * 0.4), vx: 0, vy: -6, life: 0.6, len: 1.5, rp: SPORE }); }
      }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_PUFF) { const u = t / T_PUFF; p.glow(M.x, M.y, 8 + 8 * u, [200, 235, 90], 0.4 * u); }
        if (t > T_X && t < T_END) { const a = clamp((t - T_X) / 0.3) * clamp((T_END - t) / 0.6); p.glow(C.x, C.y, 30, [190, 225, 80], 0.2 * a); for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; p.ring(C.x, GY, 6 + 22 * ph, 1, SPORE[2], 0.32, 0.8 * (1 - ph) * a); } }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') return act(t < T_PUFF ? { sx: kf(t, [[0, 1], [T_INF, 1.18], [T_PUFF, 1.18]]), sy: kf(t, [[0, 1], [T_INF, 0.86], [T_PUFF, 0.86]]), tintA: 0.3 * clamp(t / T_INF), tint: [200, 235, 90] } : { sx: kf(t - T_PUFF, [[0, 1.18], [0.08, 0.88], [0.35, 1]]), sy: kf(t - T_PUFF, [[0, 0.86], [0.08, 1.14], [0.35, 1]]), dx: kf(t - T_PUFF, [[0, 0], [0.08, -2.5], [0.4, 0]]), tintA: 0.3 * clamp(1 - (t - T_PUFF) / 0.4), tint: [200, 235, 90] });
      if (t < T_X) return act({});
      const k = t - T_X, a = clamp(k / 0.3) * clamp((T_END - t) / 0.6), s = Math.sin(k * 3.2);
      return act({ dx: Math.sin(k * 2.2) * 1.4 * a, dy: 0, sy: 1 - 0.04 + 0.03 * s * a, sx: 1 + 0.03 * s * a, tint: [200, 225, 80], tintA: 0.4 * a, flash: k < 0.1 ? 0.5 * (1 - k / 0.1) : 0 });
    },
  });
}

// ───────────── Zarzal (Hoja · especial · zona, espinas y cura) ─────────────
function bosque(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_TEL = 0.5, T_B = 1.0, T_BLOOM = 1.9, T_REL = 3.4, T_END = 4.1, PUL = [2.0, 2.6, 3.1];
  const ZV = [{ dx: -30, h: 40, ph: 0, d: 0.1, ct: -15 }, { dx: -19, h: 50, ph: 1.3, d: 0.0, ct: -8 }, { dx: -8, h: 36, ph: 2.6, d: 0.2, ct: -1 }, { dx: 9, h: 52, ph: 3.9, d: 0.08, ct: 6 }, { dx: 20, h: 40, ph: 5.2, d: 0.25, ct: 11 }, { dx: 31, h: 32, ph: 0.7, d: 0.15, ct: 17 }];
  const fade = (t) => (t > T_REL ? 1 - smooth((t - T_REL) / (T_END - T_REL)) : 1);
  const gz = (v, t) => clamp((t - T_B - v.d) / 0.7) * fade(t);
  const zpts = (v, t) => { const g = gz(v, t), a = [], x0 = T.x + v.dx, xt = T.x + v.ct, h = v.h * eback(g > 0 ? g : 0) * (g > 0 ? 1 : 0); for (let i = 0; i <= 18; i++) { const u = (i / 18) * Math.min(1, g * 1.05); a.push({ x: lerp(x0, xt, Math.pow(u, 1.7)) + Math.sin(u * 6 + v.ph + t * 1.5) * 1.6 * u, y: GY - h * (1 - Math.pow(1 - u, 2.2)) }); } return a; };
  const RT = [-0.34, 0.34, 0.05].map((x, i) => ({ x, ph: i * 2.2 }));
  const rpts = (v, t) => { const h = T.h * 0.55 * eo((t - T_B - 0.3) / 0.6) * fade(t), a = []; for (let i = 0; i <= 10; i++) { const u = i / 10; a.push({ x: T.x + v.x * T.w * (1 - 0.4 * u) + Math.sin(u * 6 + v.ph) * T.w * 0.4, y: GY - u * h }); } return a; };
  B.S.at(T_TEL, () => { B.shake = 0.6; for (let i = 0; i < 10; i++) P.add({ kind: 'sparkle', x: F.x + R.range(-8, 8), y: GY - R.range(0, 8), vx: 0, vy: -R.range(10, 24), life: 0.6, len: 1.5, rp: HEAL }); });
  B.S.at(T_B, () => { B.shake = 3.2; B.stop = 0.07; P.ring({ x: T.x, y: GY, r0: 2, r1: 44, th: 3, life: 0.5, rp: LEAF, ry: 0.32, layer: 'front' }); for (let i = 0; i < 24; i++) P.add({ kind: 'dust', x: T.x + R.range(-38, 36), y: GY - 1, vx: R.range(-30, 30), vy: R.range(-24, -4), life: R.range(0.4, 0.8), r0: 1, r1: 5, layer: 'back' }); for (let i = 0; i < 12; i++) P.add({ kind: 'leaf', x: T.x + R.range(-36, 34), y: GY - 2, vx: R.range(-30, 30), vy: R.range(-110, -40), g: 110, drag: 1, life: R.range(0.6, 1), w: 11, len: 2 }); });
  B.S.at(T_BLOOM, () => { B.shake = 1.2; for (const v of ZV) { const q = zpts(v, T_BLOOM + 0.5), tp = q[q.length - 1]; for (let j = 0; j < 6; j++) P.add({ kind: 'leaf', x: tp.x, y: tp.y, vx: R.range(-30, 30), vy: R.range(-40, -5), g: 30, drag: 0.8, life: R.range(0.8, 1.3), w: 7, len: 1.6, rp: PETAL }); } });
  PUL.forEach((tt) => B.S.at(tt, () => { B.shake = 0.5; P.ring({ x: F.x, y: F.y, r0: 3, r1: 18, th: 2, life: 0.55, rp: HEAL, ry: 0.32 }); for (let j = 0; j < 8; j++) P.add({ kind: 'sparkle', x: F.x + R.range(-F.w * 0.5, F.w * 0.5), y: F.y - R.range(2, F.h), vx: R.range(-6, 6), vy: R.range(-26, -10), life: R.range(0.5, 0.9), len: 2, rp: HEAL }); P.add({ kind: 'plus', x: F.x, y: F.y - F.h - 2, vx: 0, vy: -14, life: 0.8 });
    for (const v of ZV) { const q = zpts(v, tt), tp = q[q.length - 1]; for (let j = 0; j < 4; j++) P.add({ kind: 'sparkle', x: tp.x, y: tp.y, vx: R.range(-30, -5) * (F.x < T.x ? 1 : -1), vy: R.range(-30, -5), g: 30, life: 0.5, len: 1.4, rp: HEAL }); } }));
  B.S.at(T_REL, () => { for (let i = 0; i < 30; i++) P.add({ kind: 'leaf', x: T.x + R.range(-38, 34), y: GY - R.range(5, 45), vx: R.range(-20, 20), vy: R.range(-10, 20), g: 30, life: R.range(1, 1.8), w: 8, len: 2, rp: R.next() < 0.5 ? PETAL : LEAF }); });
  let n = 0;
  const flower = (p, x, y, sc, glow) => { for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; leaf(p, x + Math.cos(a) * 2.6 * sc, y + Math.sin(a) * 2.6 * sc, 3.4 * sc, 1.7 * sc, a, PETAL); } p.disc(x, y, 1.5 * sc, hex2('#ffe27a')); p.glow(x, y, 12 * sc, [255, 190, 215], 0.35 + 0.4 * glow); };
  const drawZ = (p, t) => ZV.forEach((v, i) => {
    const g = gz(v, t); if (g <= 0.02) return; const q = zpts(v, t); vine(p, q, 3.6, 0.65);
    for (let k = 2; k < q.length - 1; k += 2) { const d = (k % 4 ? 1 : -1), a2 = Math.atan2(q[k + 1].y - q[k].y, q[k + 1].x - q[k].x); for (let s2 = 1; s2 <= 3; s2++) p.px(q[k].x + Math.cos(a2 + d * 1.45) * s2, q[k].y + Math.sin(a2 + d * 1.45) * s2, s2 === 3 ? BARK[4] : BARK[3]); }
    leaf(p, q[6].x + 2, q[6].y, 2.6, 1.2, 0.3); leaf(p, q[11].x - 2, q[11].y, 2.6, 1.2, Math.PI - 0.3);
    const tp = q[q.length - 1];
    if (g < 0.95 || t < T_BLOOM) p.disc(tp.x, tp.y, 1.8, LEAF[3]);
    else { let gl = 0; PUL.forEach((tt) => { const k = (t - tt) / 0.5; if (k >= 0 && k < 1) gl = Math.max(gl, Math.sin(k * Math.PI)); }); const bs = clamp((t - T_BLOOM - i * 0.05) / 0.35); flower(p, tp.x, tp.y, (0.3 + 0.45 * eback(bs)) * (1 + 0.2 * gl) * fade(t), gl * fade(t)); }
  });
  return dur4(B, 4.5, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_B + 0.4 && t < T_REL) { n -= dt; if (n <= 0) { n = 0.08; P.add({ kind: 'sparkle', x: T.x + R.range(-34, 34), y: GY - R.range(4, 40), vx: R.range(-4, 4), vy: R.range(-8, 2), life: R.range(0.8, 1.4), len: 1.2, rp: PETAL }); if (t > T_BLOOM && R.next() < 0.6) P.add({ kind: 'leaf', x: T.x + R.range(-30, 30), y: GY - R.range(30, 52), vx: R.range(-8, 8), vy: R.range(6, 18), g: 4, life: 1.6, w: 6, len: 1.6, rp: PETAL }); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') {
        if (t > T_TEL) { const a = clamp((t - T_TEL) / 0.5) * fade(t); for (let y = -4; y <= 4; y++) for (let x = -40; x <= 36; x++) { const d = (x / 40) ** 2 + (y / 4) ** 2, nn = fbm((T.x + x) * 0.25, (GY + y) * 0.5, 6); if (d + (nn - 0.5) * 0.5 < 1) p.dark(T.x + x, GY + y, 0.55 * a); } }
      }
      if (layer === 'front') {
        if (t > T_TEL && t < T_B) { const u = (t - T_TEL) / (T_B - T_TEL); p.ring(T.x, GY, 8 + 34 * u, 1, LEAF[4], 0.32, 0.9); p.glow(T.x, GY, 36, LEAFC, 0.22 * u); p.glow(F.x, F.y - F.h * 0.5, 14, LEAFC, 0.3 * u); }
        drawZ(p, t);
        if (t > T_B + 0.3 && t < T_END) RT.forEach((v) => { const q = rpts(v, t); if (q[10].y < GY - 1) vine(p, q, 2.6, 0.5); });
        if (t > T_B && t < T_B + 0.4) p.glow(T.x - 2, GY - 12, 40, LEAFC, 0.2 * (1 - (t - T_B) / 0.4));
        PUL.forEach((tt) => { const k = (t - tt) / 0.5; if (k >= 0 && k < 1) p.glow(F.x, F.y - F.h * 0.5, 17, LEAFC, 0.45 * (1 - k)); });
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { let s = 0, bob = 0; PUL.forEach((tt) => { const k = (t - tt) / 0.5; if (k >= 0 && k < 1) { s = Math.max(s, Math.sin(k * Math.PI)); bob = Math.max(bob, Math.sin(clamp(k * 1.6) * Math.PI)); } });
        if (t < T_B) return act({ sy: kf(t, [[0, 1], [T_TEL, 0.85], [T_B - 0.12, 0.85], [T_B, 1.18]]), sx: kf(t, [[0, 1], [T_TEL, 1.14], [T_B - 0.12, 1.14], [T_B, 0.9]]), dy: kf(t, [[0, 0], [T_B - 0.1, 0], [T_B, -3]]), tintA: 0.3 * clamp(t / T_TEL), tint: LEAFC });
        const k = t - T_B; return act({ sy: kf(k, [[0, 1.18], [0.15, 0.9], [0.4, 1]]) + 0.08 * bob, sx: kf(k, [[0, 0.9], [0.15, 1.1], [0.4, 1]]) - 0.05 * bob, dy: kf(k, [[0, -3], [0.15, 0]]) - 2 * bob, tintA: Math.max(0.25 * clamp(1 - k / 0.4), 0.4 * s), tint: LEAFC }); }
      if (t < T_B) return act({ dx: t > T_TEL ? Math.sin(t * 60) * 0.5 : 0 });
      if (t < T_REL) { const k = t - T_B; return act({ sx: kf(k, [[0, 1], [0.5, 0.94]]), sy: kf(k, [[0, 1], [0.15, 1.06], [0.6, 0.97]]), dx: Math.sin(t * 24) * 0.6 * (1 - clamp(k / 1.5)), tint: [90, 200, 70], tintA: 0.3 * clamp(k / 0.5), flash: clamp(1 - k / 0.1) * 0.5 }); }
      const k = t - T_REL; return act({ sy: kf(k, [[0, 0.97], [0.12, 1.12], [0.4, 1]]), sx: kf(k, [[0, 0.94], [0.12, 0.96], [0.4, 1]]), tint: [90, 200, 70], tintA: 0.3 * clamp(1 - k / 0.5) });
    },
  });
}

// ───────────── Ciclón de hojas (Hoja · especial · área, cortes seguidos) ─────────────
function ciclon(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: T.x, y: T.y - T.h * 0.5 }, HG = T.h * 1.6, N = 34;
  const T_SW = 0.7, T_H0 = 1.25, STEP = 0.13, NH = 8, T_LAST = T_H0 + STEP * (NH - 1), T_OUT = T_LAST + 0.1, T_END = T_OUT + 0.7;
  const LV = Array.from({ length: N }, (_, i) => ({ h: R.next(), a: R.range(0, 6.28), w: R.range(7, 12) * (R.next() < 0.5 ? 1 : 1.15), s: R.range(3.2, 4.6), i }));
  const hits = []; let n = 0;
  const grow = (t) => clamp((t - T_SW) / 0.55);
  const lp = (v, t) => { const out = t > T_OUT ? (t - T_OUT) : 0, a = v.a + v.w * t, r = (T.w * 0.35 + v.h * T.w * 0.75) * (1 + out * 2.5), s = ((t - T_SW) / 0.55 - v.i / N * 0.6); if (s < 0 || t < T_SW) return null; return { x: C.x + Math.cos(a) * r, y: GY - v.h * HG * (t > T_OUT ? 1 + out * 0.6 : 1) + Math.sin(a) * r * 0.25 - 2, a, front: Math.sin(a) > 0, al: clamp(s * 3) * (t > T_OUT ? clamp(1 - out / 0.7) : 1) }; };
  B.S.at(T_SW, () => { B.shake = 1; P.ring({ x: C.x, y: GY, r0: 2, r1: 24, th: 2, life: 0.5, rp: LEAF, ry: 0.32, layer: 'front' }); });
  for (let i = 0; i < NH; i++) B.S.at(T_H0 + STEP * i, () => {
    hits.push({ t: B.t, a: R.range(-1.2, 1.2) + (i % 2 ? 2.3 : 0), y: R.range(-0.3, 0.3) }); const last = i === NH - 1;
    B.shake = last ? 4 : 1.6; B.stop = last ? 0.12 : 0.025;
    for (let j = 0; j < (last ? 14 : 4); j++) P.add({ kind: 'leaf', x: C.x + R.range(-4, 4), y: C.y + R.range(-5, 5), vx: R.range(-70, 70), vy: R.range(-70, -5), g: 100, drag: 1, life: R.range(0.4, 0.8), w: 13, len: 1.8 });
    for (let j = 0; j < (last ? 20 : 5); j++) { const a = R.range(0, 6.28), s = R.range(50, 140); P.add({ kind: 'spark', x: C.x, y: C.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.2, rp: LEAF, gc: LEAFC }); }
    if (last) { P.ring({ x: C.x, y: C.y, r0: 1, r1: 22, th: 3, life: 0.3, rp: LEAF, ry: 1, layer: 'front' }); P.ring({ x: C.x, y: GY, r0: 2, r1: 34, th: 2, life: 0.5, rp: LEAF, ry: 0.32 }); }
  });
  return dur4(B, 3.4, {
    update(dt) { B.tick(dt); const t = B.t; if (t < T_SW) { n -= dt; if (n <= 0) { n = 0.04; P.add({ kind: 'leaf', x: F.x + R.range(-F.w * 0.6, F.w * 0.6), y: F.y - R.range(0, 4), vx: R.range(-6, 6), vy: R.range(-34, -16), life: 0.7, w: 9, len: 1.6 }); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') {
        if (t > T_SW) { const a = grow(t) * (t > T_OUT ? clamp(1 - (t - T_OUT) / 0.7) : 1); for (let y = -3; y <= 3; y++) for (let x = -18; x <= 18; x++) { const d = (x / 18) ** 2 + (y / 3) ** 2, nn = fbm((T.x + x) * 0.3 + t * 0.5, (GY + y) * 0.5, 8); if (d + (nn - 0.5) * 0.5 < 1) p.dark(T.x + x, GY + y, 0.5 * a); } }
      }
      for (const v of LV) { const q = lp(v, t); if (q && (layer === 'front') === q.front) leaf(p, q.x, q.y, v.s + (q.front ? 0.5 : 0), v.s * 0.5, q.a + 1.57 + t * 3, q.front ? LEAF : [LEAF[0], LEAF[0], LEAF[1], LEAF[1], LEAF[2], LEAF[2]], q.al); }
      if (layer === 'front') {
        if (t > T_SW && t < T_END) { const a = grow(t) * (t > T_OUT ? clamp(1 - (t - T_OUT) / 0.7) : 1); p.glow(C.x, C.y, 28, LEAFC, 0.12 * a); }
        if (t < T_SW) p.glow(F.x, F.y - F.h * 0.5, 12, LEAFC, 0.3 * (t / T_SW));
        hits.forEach((h) => { const k = t - h.t; if (k < 0.16) { const f = k / 0.16, L2 = 16 * eo(k / 0.05), ca = Math.cos(h.a), sa = Math.sin(h.a); p.glow(C.x, C.y, 20, LEAFC, 0.6 * (1 - f)); for (let o = -1; o <= 1; o++) p.line(C.x - ca * L2 + o * sa * 0.6, C.y - sa * L2 - o * ca * 0.6, C.x + ca * L2 + o * sa * 0.6, C.y + sa * L2 - o * ca * 0.6, o === 0 ? (f < 0.6 ? LEAF[5] : LEAF[4]) : LEAF[3]); } });
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_OUT; return act(t < T_SW ? { sx: 1 + 0.06 * Math.sin(t * 40), sy: kf(t, [[0, 1], [T_SW, 1.1]]), dy: -2 * smooth(t / T_SW), tintA: 0.35 * (t / T_SW), tint: LEAFC } : t < T_OUT ? { sx: 1 + 0.08 * Math.sin(t * 30), sy: 1.08, dy: -2, tintA: 0.3, tint: LEAFC } : { sy: kf(r, [[0, 1.08], [0.1, 0.88], [0.4, 1]]), sx: kf(r, [[0, 1], [0.1, 1.12], [0.4, 1]]), dy: kf(r, [[0, -2], [0.1, 0]]), tintA: 0.3 * clamp(1 - r / 0.4), tint: LEAFC }); }
      if (t < T_SW) return act({});
      let dx = 0, fl = 0; hits.forEach((h) => { const k = t - h.t; if (k >= 0 && k < 0.2) { dx += Math.sin(k * 60) * 1.6 * (1 - k / 0.2); fl = Math.max(fl, clamp(1 - k / 0.07)); } });
      const last = hits.length === NH ? t - hits[NH - 1].t : -1;
      const base2 = { dx: dx + (t > T_H0 && t < T_OUT ? Math.sin(t * 40) * 0.5 : 0), flash: fl, tint: [120, 255, 90], tintA: t < T_OUT ? 0.3 * clamp((t - T_H0) / 0.3) : 0.3 * clamp(1 - (t - T_OUT) / 0.6) };
      if (last >= 0) { base2.dx += kf(last, [[0, 0], [0.08, 6], [0.6, 0]]); base2.sy = kf(last, [[0, 1], [0.05, 0.8], [0.18, 1.08], [0.42, 1]]); base2.sx = kf(last, [[0, 1], [0.05, 1.16], [0.18, 0.95], [0.42, 1]]); }
      return act(base2);
    },
  });
}

// ───────────── Piel de corteza (Hoja · defensa · propia) ─────────────
function corteza(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: F.x, y: F.y - F.h * 0.5 }, RX = F.w * 0.62 + 2, RY = F.h * 0.62;
  const T_ON = 0.5, T_FULL = 1.0, T_DASH = 1.5, T_C = 1.64, T_OFF = 2.7, T_END = 3.2;
  const DASH = (T.x - F.x) - (F.w * 0.5 + T.w * 0.5) + 2, IM = { x: F.x + RX, y: C.y };
  const ex = (t) => (t < T_DASH ? (t > T_DASH - 0.4 ? 1.5 * smooth((t - T_DASH + 0.4) / 0.4) : 0) : t < T_C ? lerp(1.5, -DASH, ei((t - T_DASH) / (T_C - T_DASH))) : -DASH + kf(t - T_C, [[0, 0], [0.09, 11], [0.8, DASH - 1.5 * 0 + 0]]) * 1);
  let hit = false;
  B.S.at(T_ON, () => { B.shake = 0.6; for (let i = 0; i < 8; i++) P.add({ kind: 'leaf', x: C.x + R.range(-RX, RX), y: C.y + R.range(-RY, RY), vx: R.range(-12, 12), vy: R.range(-20, -5), life: 0.5, w: 8, len: 1.4, rp: BARK }); });
  B.S.at(T_FULL, () => { B.shake = 1.4; P.ring({ x: F.x, y: GY, r0: 2, r1: 18, th: 2, life: 0.4, rp: BARK, ry: 0.32, layer: 'front' }); for (let i = 0; i < 6; i++) P.add({ kind: 'dust', x: F.x + R.range(-9, 9), y: GY - 1, vx: R.range(-22, 22), vy: R.range(-8, -2), life: 0.4, r0: 1, r1: 3, layer: 'back' }); });
  B.S.at(T_C, () => {
    hit = true; B.stop = 0.1; B.shake = 3.4;
    P.ring({ x: IM.x, y: IM.y, r0: 1, r1: 13, th: 2, life: 0.22, rp: BARK, ry: 1, layer: 'front' });
    for (let i = 0; i < 12; i++) P.add({ kind: 'leaf', x: IM.x, y: IM.y + R.range(-5, 5), vx: R.range(-30, 60), vy: R.range(-70, -10), g: 130, drag: 0.8, life: R.range(0.5, 0.9), w: 14, len: R.range(1, 1.8), rp: BARK });
    for (let i = 0; i < 12; i++) { const a = R.range(-1.4, 1.4), s = R.range(60, 150); P.add({ kind: 'spark', x: IM.x, y: IM.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.2, rp: BARK, gc: [220, 180, 110] }); }
    for (let i = 0; i < 5; i++) P.add({ kind: 'leaf', x: IM.x, y: IM.y, vx: R.range(-10, 40), vy: R.range(-60, -20), g: 90, life: 0.8, w: 10, len: 1.8 });
  });
  const bark = (p, t) => {
    const prog = clamp((t - T_ON) / (T_FULL - T_ON)), fade = t > T_OFF ? clamp((t - T_OFF) / (T_END - T_OFF)) : 0; if (prog <= 0) return;
    const x0 = Math.floor(C.x - RX - 3), x1 = Math.ceil(C.x + RX + 3), y0 = Math.floor(C.y - RY - 3), y1 = Math.ceil(C.y + RY + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x - C.x) / RX, dy = (y - C.y) / RY, d = Math.sqrt(dx * dx + dy * dy); if (d < 0.6 || d > 1.0 || y > GY) continue;
      const ang = (Math.atan2(dy, dx) + Math.PI) / 6.283, thr = ang * 0.45 + h2(x, y, 3) * 0.5; if (thr > prog || (fade > 0 && thr < fade)) continue;
      const nn = fbm(x * 0.5, y * 0.22, 4), groove = (x + (y >> 2)) % 4 === 0; let c = BARK[nn < 0.4 ? 1 : nn < 0.6 ? 2 : 3]; if (groove) c = BARK[1]; if (d > 0.93) c = BARK[0]; if (d < 0.7 && !groove) c = BARK[3];
      if (hit && Math.hypot(x - IM.x, y - IM.y) < 5 && (x + y) % 3 === 0) c = BARK[0];
      p.px(x, y, c);
    }
    if (prog > 0.9) for (const [ox, oy, a] of [[-0.3, -1.0, -1.9], [0.25, -0.96, -1.3], [-0.9, -0.2, 3.3]]) { const g = clamp((t - T_FULL) / 0.4) * (1 - fade); if (g > 0) leaf(p, C.x + ox * RX, C.y + oy * RY, 3 * g + 0.5, 1.4 * g + 0.2, a); }
  };
  return dur4(B, 3.5, {
    update(dt) { B.tick(dt); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        bark(p, t);
        if (t > T_ON && t < T_FULL) p.glow(C.x, C.y, 22, [200, 170, 100], 0.3 * (t - T_ON) / (T_FULL - T_ON));
        if (t > T_DASH - 0.4 && t < T_C) p.glow(T.x + ex(t) - 6, T.y - T.h * 0.5, 18, [255, 255, 255], 0.0);
        if (hit) { const k = t - T_C; if (k < 0.24) p.glow(IM.x, IM.y, 20, [240, 200, 130], 0.3 * (1 - k / 0.24)); }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const k = t - T_C; return act(t < T_ON ? {} : t < T_FULL ? { sy: kf(t, [[T_ON, 1], [T_FULL, 0.9]]), sx: kf(t, [[T_ON, 1], [T_FULL, 1.08]]), tint: [180, 140, 90], tintA: 0.3 } : k < 0 ? { sy: 0.95, sx: 1.04, tint: [180, 140, 90], tintA: 0.12 } : { dx: kf(k, [[0, 0], [0.07, 0.9], [0.4, 0]]), sy: kf(k, [[0, 0.95], [0.06, 0.92], [0.3, 1]]), sx: kf(k, [[0, 1.04], [0.06, 1.06], [0.3, 1]]), tint: [180, 140, 90], tintA: 0.12 * clamp(1 - k / 0.5) }); }
      const dx = ex(t); if (t < T_DASH) return act({ dx, sx: t > T_DASH - 0.4 ? kf(t, [[T_DASH - 0.4, 1], [T_DASH, 0.9]]) : 1, sy: t > T_DASH - 0.4 ? kf(t, [[T_DASH - 0.4, 1], [T_DASH, 1.1]]) : 1 });
      if (t < T_C) return act({ dx, sx: 1.18, sy: 0.9 });
      const k = t - T_C; return act({ dx, flash: clamp(1 - k / 0.1) * 0.8, sy: kf(k, [[0, 0.78], [0.1, 1.1], [0.4, 1]]), sx: kf(k, [[0, 1.16], [0.1, 0.94], [0.4, 1]]), dy: kf(k, [[0, 0], [0.12, -4], [0.35, 0]]) });
    },
  });
}

(function () {
  const H = '#5dae5a', by = Object.fromEntries(MOVES.map((m) => [m.id, m]));
  const add = [
    { id: 'latigazo', nombre: 'Latigazo', tipo: 'Básico · contacto', make: latigazo, fases: ['Echa la enredadera atrás', 'Chasquido: la enredadera cruza hasta el rival', 'Impacto: parada, hojas y chispas verdes', 'La enredadera se recoge'], uso: 'Básico a corta distancia: la criatura sola, muy a menudo.' },
    { id: 'cuchilla', nombre: 'Cuchilla de hoja', tipo: 'Básico · proyectil ×3', make: cuchilla, fases: ['Tres hojas giran y se afilan', 'Salen en abanico, una tras otra', 'Tres cortes seguidos con hojas y destellos'], uso: 'Básico a media distancia: ráfaga de tres cortes.' },
    { id: 'enredadera', nombre: 'Enredadera', tipo: 'Habilidad · zona, inmoviliza', make: enredadera, fases: ['Aviso: círculo verde bajo el rival', 'Brotan zarcillos del suelo', 'Suben en espiral y lo atrapan', 'Lucha por soltarse y se liberan marchitos'], uso: 'Habilidad de control: deja al rival inmovilizado (enredado).' },
    { id: 'esporas', nombre: 'Nube de esporas', tipo: 'Habilidad · área, ralentiza', make: esporas, fases: ['Se hincha y acumula esporas', 'Suelta una nube que viaja al rival', 'La nube lo envuelve con onda en el suelo', 'Queda aturdido y ralentizado'], uso: 'Habilidad de control: ralentiza al rival y a los que lo rodean.' },
    { id: 'bosque', nombre: 'Zarzal', tipo: 'Especial · zona, espinas y cura', make: bosque, fases: ['Aviso: el suelo se ilumina', 'Brotan zarzas con espinas que se arquean sobre el rival', 'Raíces lo atrapan y las zarzas florecen', 'Tres pulsos de curación a las aliadas', 'Se deshace en pétalos y hojas'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'ciclon', nombre: 'Ciclón de hojas', tipo: 'Especial · área, cortes seguidos', make: ciclon, fases: ['Se carga de viento y hojas', 'Un ciclón de hojas envuelve al rival', 'Ocho cortes seguidos', 'Corte final con estallido y onda'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'corteza', nombre: 'Piel de corteza', tipo: 'Defensa · propia', make: corteza, fases: ['Placas de corteza se acoplan al cuerpo', 'Brotan hojas', 'El rival embiste y la corteza aguanta', 'Astillas, el rival rebota'], uso: 'Hueco de defensa: reduce el daño y no deja que la empujen.' },
  ].map((m) => Object.assign({ el: 'Hoja', col: H, caster: 'aguacato', target: 'pompon' }, m));
  const all = Object.assign({}, by); add.forEach((m) => { all[m.id] = m; });
  const order = ['llamarada', 'zarpa', 'bola', 'salto', 'tormenta', 'erupcion', 'aura', 'avivar', 'chorro', 'salpicon', 'ola', 'burbuja', 'marea', 'torrente', 'escudo', 'purificar', 'latigazo', 'cuchilla', 'enredadera', 'esporas', 'bosque', 'ciclon', 'corteza', 'brote'];
  MOVES.length = 0; order.forEach((id) => MOVES.push(all[id]));
})();
