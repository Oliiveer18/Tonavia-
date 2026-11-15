// ═════════ AIRE (8 movimientos) ═════════
const AIR = ramp(['#3d6a78', '#6fa7b8', '#a9d8e4', '#d8f2f8', '#f4fcff']);
const AIRC = [200, 240, 255], AIRT = [190, 235, 255];

// ráfaga (línea de viento) y chevrón azul
const _pd6 = Particles.prototype.draw;
Particles.prototype.draw = function (p, layer) {
  _pd6.call(this, p, layer);
  for (const q of this.a) {
    if (q.layer !== layer) continue; const k = q.age / q.life;
    if (q.kind === 'gust') { const sp = Math.hypot(q.vx, q.vy) || 1, L = q.len * (1 - k * 0.5), ux = q.vx / sp, uy = q.vy / sp; if (h2(q.seed, Math.floor(q.age * 30), 2) < k * 0.5) continue; for (let s = 0; s <= L; s++) p.px(q.x - ux * s, q.y - uy * s, s < L * 0.35 ? AIR[4] : AIR[3]); }
    else if (q.kind === 'chevA') { const a = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1; for (let i = 0; i < 2; i++) { const y = q.y + i * 3; p.dpx(q.x - 1, y - 2, AIR[4], a); p.dpx(q.x, y - 1, AIR[4], a); p.dpx(q.x + 1, y, AIR[3], a); p.dpx(q.x, y + 1, AIR[4], a); p.dpx(q.x - 1, y + 2, AIR[3], a); } p.glow(q.x, q.y, 7, AIRC, 0.25 * a); }
  }
};
const crescent = (p, cx, cy, r, ang, span, th, a = 1) => { const bx = cx - Math.cos(ang) * r, by = cy - Math.sin(ang) * r; for (let i = 0; i <= 16; i++) { const u = i / 16, aa = ang - span + u * 2 * span, tp = Math.sin(Math.PI * u), rr = th * tp; if (rr < 0.3) continue; p.disc(bx + Math.cos(aa) * r, by + Math.sin(aa) * r, Math.max(0.5, rr), tp > 0.6 ? AIR[4] : tp > 0.3 ? AIR[3] : AIR[2], a); } };
const swirl = (p, cx, cy, r, t, arms, ry = 0.8, a = 1, turns = 3) => { for (let m = 0; m < arms; m++) for (let i = 0; i < 60; i++) { const u = i / 60, ang = m * 6.283 / arms + u * turns + t * 12, x = cx + Math.cos(ang) * r * u, y = cy + Math.sin(ang) * r * u * ry, c = u > 0.7 ? AIR[4] : AIR[3], al = a * (0.4 + 0.6 * u); p.dpx(x, y, c, al); p.dpx(x + 1, y, c, al * 0.8); if (ry > 0.5) p.dpx(x, y + 1, AIR[2], al * 0.6); } };
const reactA = (k, amp, dur = 0.5) => (k < 0 ? act({}) : act({ dx: kf(k, [[0, 0], [0.07, amp], [dur, 0]]), sy: kf(k, [[0, 1], [0.05, 0.82], [0.16, 1.08], [0.4, 1]]), sx: kf(k, [[0, 1], [0.05, 1.14], [0.16, 0.95], [0.4, 1]]), flash: 0.4 * clamp(1 - k / 0.12), tint: AIRT, tintA: k < 0.6 ? 0.3 * clamp(1 - k / 0.6) : 0 }));
const gustBurst = (P, R, x, y, n, s0, s1, o = {}) => { for (let i = 0; i < n; i++) { const a = o.a0 !== undefined ? R.range(o.a0, o.a1) : R.range(0, 6.28), s = R.range(s0, s1); P.add({ kind: 'gust', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.2, 0.4), len: R.range(4, 9), drag: 2 }); } };
const featherP = (P, R, x, y, n, sp = 40) => { for (let i = 0; i < n; i++) P.add({ kind: 'leaf', x: x + R.range(-3, 3), y: y + R.range(-3, 3), vx: R.range(-sp, sp), vy: R.range(-sp, sp * 0.3), g: 14, drag: 1.2, life: R.range(0.7, 1.3), w: 6, len: R.range(2, 3), rp: AIR }); };

// ───────────── Tajo de viento (Aire · básico · proyectil) ─────────────
function tajo(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.55 }, I = { x: T.x - T.w * 0.25, y: T.y - T.h * 0.5 };
  const T_REL = 0.4, FLY = 0.2, GAP = [0, 0.11], YS = [-4, 4], hits = []; let n = 0;
  const pos = (i, t) => { const u = clamp((t - T_REL - GAP[i]) / FLY); return { u, x: lerp(M.x + 4, I.x, u), y: lerp(M.y, I.y + YS[i], u) }; };
  B.S.at(T_REL, () => { B.shake = 0.8; gustBurst(P, R, M.x, M.y, 8, 60, 160, { a0: -0.6, a1: 0.6 }); });
  GAP.forEach((g, i) => B.S.at(T_REL + g + FLY, () => { const q = { x: I.x, y: I.y + YS[i] }; hits.push({ t: B.t, q }); B.shake = 1.6 + i * 1.2; B.stop = 0.03 + i * 0.04; gustBurst(P, R, q.x, q.y, 10, 60, 170); P.ring({ x: q.x, y: q.y, r0: 1, r1: 10 + i * 3, th: 2, life: 0.2, rp: AIR, ry: 1, layer: 'front' }); for (let j = 0; j < 5; j++) P.add({ kind: 'dust', x: T.x + R.range(-8, 8), y: GY - 1, vx: R.range(-30, 30), vy: R.range(-10, -2), life: 0.4, r0: 1, r1: 3, layer: 'back' }); if (i) featherP(P, R, q.x, q.y, 4, 50); }));
  return dur4(B, 1.8, {
    update(dt) { B.tick(dt); const t = B.t; for (let i = 0; i < 2; i++) { const q = pos(i, t); if (q.u > 0 && q.u < 1) { n -= dt; if (n <= 0) { n = 0.02; P.add({ kind: 'gust', x: q.x - 3, y: q.y + R.range(-4, 4), vx: -90, vy: R.range(-6, 6), life: 0.2, len: 8 }); } } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; swirl(p, M.x, M.y, 4 + 10 * u, t, 3, 0.9, u); p.glow(M.x, M.y, 8 + 6 * u, AIRC, 0.35 * u); }
        for (let i = 0; i < 2; i++) { const q = pos(i, t); if (q.u > 0 && q.u < 1) { crescent(p, q.x, q.y, 9, 0, 1.0, 2.4); p.glow(q.x, q.y, 9, AIRC, 0.35); } }
        hits.forEach((h) => { const k = t - h.t; if (k < 0.16) { const L2 = 9 * eo(k / 0.06); p.line(h.q.x - L2, h.q.y - L2, h.q.x + L2, h.q.y + L2, AIR[4]); p.line(h.q.x - L2, h.q.y + L2, h.q.x + L2, h.q.y - L2, AIR[3]); p.glow(h.q.x, h.q.y, 14, AIRC, 0.3 * (1 - k / 0.16)); } });
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sx: kf(t, [[0, 1], [T_REL, 0.92]]), sy: kf(t, [[0, 1], [T_REL, 1.1]]), dx: -2 * smooth(t / T_REL), tintA: 0.25 * (t / T_REL), tint: AIRT } : { sx: kf(r, [[0, 0.92], [0.07, 1.14], [0.3, 1]]), sy: kf(r, [[0, 1.1], [0.07, 0.9], [0.3, 1]]), dx: kf(r, [[0, -2], [0.08, 3], [0.4, 0]]), tintA: 0.2 * clamp(1 - r / 0.25), tint: AIRT }); }
      let dx = 0, fl = 0, sy = 1, sx = 1; hits.forEach((h) => { const k = t - h.t; if (k >= 0 && k < 0.5) { dx += kf(k, [[0, 0], [0.06, 3.5], [0.45, 0]]); fl = Math.max(fl, 0.4 * clamp(1 - k / 0.1)); sy = Math.min(sy, kf(k, [[0, 1], [0.04, 0.88], [0.2, 1]])); sx = Math.max(sx, kf(k, [[0, 1], [0.04, 1.1], [0.2, 1]])); } }); return act({ dx, flash: fl, sx, sy, tint: AIRT, tintA: hits.length ? 0.25 * clamp(1 - (t - hits[hits.length - 1].t) / 0.6) : 0 }); },
  });
}

// ───────────── Aletazo (Aire · básico · contacto) ─────────────
function aletazo(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const LAND = T.x - (T.w + F.w) * 0.5 + 2, T_W = 0.3, T_D = 0.1, T_C = T_W + T_D, T_B2 = T_C + 0.35, C = { x: T.x - 3, y: T.y - T.h * 0.55 };
  const x = (t) => (t < T_W ? F.x - 3 * smooth(t / T_W) : t < T_C ? lerp(F.x - 3, LAND, ei((t - T_W) / T_D)) : t < T_B2 ? LAND : lerp(LAND, F.x, smooth((t - T_B2) / 0.3)));
  const jy = (t) => (t < T_W ? -3 * smooth(t / T_W) : t < T_C ? -3 + 3 * ((t - T_W) / T_D) : 0);
  let hit = false, n = 0;
  B.S.at(T_C + 0.02, () => { hit = true; B.shake = 3; B.stop = 0.07; gustBurst(P, R, C.x, C.y, 16, 80, 200, { a0: -1.6, a1: 1.6 }); featherP(P, R, C.x, C.y, 8, 60); P.ring({ x: C.x, y: C.y, r0: 1, r1: 13, th: 2, life: 0.2, rp: AIR, ry: 1, layer: 'front' }); P.ring({ x: T.x, y: GY, r0: 2, r1: 20, th: 2, life: 0.35, rp: AIR, ry: 0.32 }); for (let i = 0; i < 8; i++) P.add({ kind: 'dust', x: T.x + R.range(-8, 8), y: GY - 1, vx: R.range(-40, 40), vy: R.range(-10, -2), life: 0.5, r0: 1, r1: 4, layer: 'back' }); });
  return dur4(B, 1.8, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_W && t < T_C) { n -= dt; if (n <= 0) { n = 0.012; P.add({ kind: 'gust', x: x(t) + F.w * 0.3, y: F.y - R.range(2, F.h), vx: -80, vy: 0, life: 0.18, len: 7 }); } } if (t < T_W) { n -= dt; if (n <= 0) { n = 0.05; featherP(P, R, F.x + R.range(-8, 8), F.y - F.h * 0.5, 1, 20); } } },
    draw(p, layer) {
      const t = B.t, cx = x(t);
      if (layer === 'front') {
        if (t < T_C) { const u = clamp(t / T_W), fl = Math.sin(t * 40) * 0.5; crescent(p, cx + F.w * 0.1, F.y - F.h * 0.7 + fl * 3, 8 + 4 * u, -1.0 + fl, 1.0, 2.2, 0.7); p.glow(cx, F.y - F.h * 0.5, 12, AIRC, 0.2 * u); }
        else if (t < T_C + 0.14) { const k = (t - T_C) / 0.14; crescent(p, cx + F.w * 0.3 + 6 * k, F.y - F.h * 0.5, 14, -0.2, 1.1, 3.4, 1 - k * 0.4); crescent(p, cx + F.w * 0.3 + 3 * k, F.y - F.h * 0.5, 10, -0.2, 0.9, 2, 1 - k * 0.4); }
        if (hit) { const k = t - T_C - 0.02; if (k < 0.22) p.glow(C.x, C.y, 20, AIRC, 0.3 * (1 - k / 0.22)); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const dx = x(t) - F.x; let sx = 1, sy = 1; if (t < T_W) { sy = kf(t, [[0, 1], [T_W, 1.12]]); sx = kf(t, [[0, 1], [T_W, 0.9]]); } else if (t < T_C) { sy = 0.94; sx = 1.14; } else if (t < T_C + 0.25) { const k = t - T_C; sy = kf(k, [[0, 1.1], [0.08, 0.88], [0.25, 1]]); sx = kf(k, [[0, 0.9], [0.08, 1.12], [0.25, 1]]); } return act({ dx, dy: jy(t), sx, sy, tintA: t < T_C ? 0.2 : 0.1 * clamp(1 - (t - T_C) / 0.3), tint: AIRT }); } return reactA(t - (T_C + 0.02), 4.5); },
  });
}

// ───────────── Remolino (Aire · habilidad · área, aparta) ─────────────
function remolino(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: F.x, y: GY }, T_S = 0.3, T_X = 0.75, T_END = 2.0, RMAX = 70, T_REACH = T_X + 0.4; let n = 0;
  const rad = (t) => RMAX * eo((t - T_X) / 0.7);
  B.S.at(T_X, () => { B.shake = 2.4; B.stop = 0.05; gustBurst(P, R, F.x + 8, F.y - F.h * 0.4, 20, 100, 260, { a0: -0.7, a1: 0.7 }); P.ring({ x: F.x, y: GY, r0: 3, r1: RMAX, th: 3, life: 0.6, rp: AIR, ry: 0.32, layer: 'front' }); });
  B.S.at(T_REACH, () => { B.shake = 3; B.stop = 0.06; gustBurst(P, R, T.x - 4, T.y - T.h * 0.5, 14, 70, 200); for (let i = 0; i < 10; i++) P.add({ kind: 'dust', x: T.x + R.range(-8, 8), y: GY - 1, vx: R.range(-10, 50), vy: R.range(-14, -3), life: 0.6, r0: 1, r1: 5, layer: 'back' }); featherP(P, R, T.x, T.y - T.h * 0.5, 6, 60); });
  return dur4(B, 2.4, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_X && t < T_END - 0.3) { n -= dt; if (n <= 0) { n = 0.03; const a = R.range(0, 6.28), r = rad(t) * R.range(0.4, 1); P.add({ kind: 'gust', x: F.x + Math.cos(a) * r, y: GY - R.range(2, 14), vx: -Math.sin(a) * 120, vy: Math.cos(a) * 14, life: 0.25, len: 7 }); if (R.next() < 0.3) P.add({ kind: 'dust', x: F.x + Math.cos(a) * r, y: GY - 1, vx: R.range(20, 60), vy: R.range(-10, -2), life: 0.5, r0: 1, r1: 3, layer: 'back' }); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_X) { const u = clamp(t / T_X); swirl(p, F.x, F.y - F.h * 0.5, 6 + 14 * u, t, 3, 0.9, u * 0.9); p.glow(F.x, F.y - F.h * 0.5, 10 + 8 * u, AIRC, 0.25 * u); }
        else if (t < T_END) { const a = clamp((T_END - t) / 0.5), r = rad(t); for (let h = 0; h < 3; h++) swirl(p, F.x, GY - 3 - h * 7, r * (1 - h * 0.2), t + h * 0.3, 3, 0.16, a * (1 - h * 0.25), 2.2); p.ring(F.x, GY, r, 1, AIR[3], 0.16, 0.8 * a); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_X; return act(t < T_X ? { sx: 1 + 0.12 * Math.sin(t * 45), sy: kf(t, [[0, 1], [T_X, 0.9]]), tintA: 0.3 * (t / T_X), tint: AIRT } : t < T_X + 0.9 ? { sx: Math.abs(Math.cos(t * 22)) * 0.5 + 0.55, sy: 1.04, tintA: 0.3, tint: AIRT } : { sx: 1, sy: 1, tintA: 0.2 * clamp(1 - (t - T_X - 0.9) / 0.3), tint: AIRT }); }
      if (t < T_REACH) return act({}); const k = t - T_REACH; return act({ dx: kf(k, [[0, 0], [0.12, 9], [0.5, 12], [1.0, 4], [1.4, 0]]), dy: kf(k, [[0, 0], [0.15, -6], [0.35, 0]]), sx: 1 + 0.06 * Math.sin(k * 40) * clamp(1 - k / 0.8), sy: kf(k, [[0, 1], [0.04, 0.84], [0.2, 1.06], [0.45, 1]]), flash: 0.4 * clamp(1 - k / 0.1), tint: AIRT, tintA: 0.3 * clamp(1 - k / 0.9) }); },
  });
}

// ───────────── Vendaval (Aire · habilidad · haz, empuja en línea) ─────────────
function vendaval(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.5 }, T_IN = 0.5, T_BL = 0.5, T_END = 2.0, T_ARR = T_BL + 0.2; let n = 0, m = 0;
  B.S.at(T_BL, () => { B.shake = 1.5; });
  B.S.at(T_ARR, () => { B.shake = 2.4; B.stop = 0.04; gustBurst(P, R, T.x - 6, T.y - T.h * 0.5, 10, 80, 200, { a0: -1.5, a1: 1.5 }); });
  return dur4(B, 2.4, {
    update(dt) {
      B.tick(dt); const t = B.t;
      if (t < T_IN) { n -= dt; if (n <= 0) { n = 0.025; const a = R.range(-1, 1), d = R.range(14, 22); P.add({ kind: 'gust', x: M.x + 6 + Math.cos(a) * d, y: M.y + Math.sin(a) * d * 0.8, vx: -Math.cos(a) * 110, vy: -Math.sin(a) * 90, life: 0.2, len: 5 }); } }
      if (t > T_BL && t < T_END - 0.35) { n -= dt; if (n <= 0) { n = 0.008; const u = R.next(), y = lerp(M.y, T.y - T.h * 0.5, 0.5) + R.range(-1, 1) * (4 + 14 * u); P.add({ kind: 'gust', x: M.x + 6 + R.range(0, 10), y: lerp(M.y, y, 0.3), vx: R.range(280, 420), vy: (y - M.y) * 0.6 * R.range(0, 1) + R.range(-4, 4), life: 0.22, len: R.range(8, 16) }); }
        m -= dt; if (m <= 0) { m = 0.05; P.add({ kind: 'dust', x: M.x + R.range(8, 50), y: GY - 1, vx: R.range(100, 200), vy: R.range(-6, -1), life: 0.4, r0: 1, r1: 4, layer: 'back' }); if (R.next() < 0.35) P.add({ kind: 'leaf', x: M.x + R.range(8, 30), y: M.y + R.range(-8, 8), vx: R.range(160, 260), vy: R.range(-20, 20), life: 0.5, w: 20, len: 2, rp: AIR }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_IN) { const u = t / T_IN; p.glow(M.x + 6, M.y, 10 + 8 * u, AIRC, 0.25 * u); swirl(p, M.x + 8, M.y, 6 + 8 * (1 - u), -t, 2, 0.9, u, 2); }
        if (t > T_BL && t < T_END - 0.3) { const a = clamp((T_END - 0.3 - t) / 0.3); p.glow(T.x - 8, T.y - T.h * 0.5, 22, AIRC, 0.15 * a); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_IN ? { sx: kf(t, [[0, 1], [T_IN, 1.16]]), sy: kf(t, [[0, 1], [T_IN, 0.9]]), tintA: 0.3 * (t / T_IN), tint: AIRT } : t < T_END - 0.3 ? { sx: 0.94, sy: 1.04, dx: -1.5 + Math.sin(t * 60) * 0.4, tintA: 0.3, tint: AIRT } : { sx: kf(t - T_END + 0.3, [[0, 0.94], [0.15, 1]]), sy: kf(t - T_END + 0.3, [[0, 1.04], [0.15, 1]]), tintA: 0.2 * clamp(1 - (t - T_END + 0.3) / 0.3), tint: AIRT });
      if (t < T_ARR) return act({}); const k = t - T_ARR, push = kf(k, [[0, 0], [0.35, 11], [1.1, 14], [1.55, 14], [2.0, 0]]); return act({ dx: push + Math.sin(t * 70) * 0.8 * (t < T_END - 0.3 ? 1 : 0), sy: 0.96, sx: 1.05, tint: AIRT, tintA: 0.25 * clamp(1 - Math.max(0, k - 1.2) / 0.5), flash: 0.4 * clamp(1 - k / 0.1) }); },
  });
}

// ───────────── Tornado (Aire · especial · área, arrastra y dispersa) ─────────────
function tornado(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_C = 0.5, T_G = 0.9, T_THR = 2.6, T_END = 3.2, HG = 64; let n = 0;
  const g = (t) => eo((t - T_G) / 0.7) * (t > T_THR ? clamp(1 - (t - T_THR) / 0.5) : 1);
  const rx = (y01, t) => 4 + y01 * 13 * (1 + 0.1 * Math.sin(t * 3));
  B.S.at(T_G, () => { B.shake = 3; B.stop = 0.06; P.ring({ x: T.x, y: GY, r0: 2, r1: 30, th: 3, life: 0.5, rp: AIR, ry: 0.32, layer: 'front' }); for (let i = 0; i < 16; i++) P.add({ kind: 'dust', x: T.x + R.range(-14, 14), y: GY - 1, vx: R.range(-50, 50), vy: R.range(-24, -4), life: R.range(0.4, 0.8), r0: 1, r1: 5, layer: 'back' }); });
  B.S.at(T_THR, () => { B.shake = 4; B.stop = 0.1; gustBurst(P, R, T.x, T.y - T.h * 0.5, 28, 120, 320); featherP(P, R, T.x, T.y - T.h * 0.5, 14, 100); P.ring({ x: T.x, y: GY, r0: 3, r1: 42, th: 3, life: 0.5, rp: AIR, ry: 0.32, layer: 'front' }); });
  const drawFun = (p, t, front) => { const gg = g(t); if (gg <= 0.02) return; const H = HG * gg; for (let y = 0; y < H; y += 2) { const y01 = y / HG, r = rx(y01, t), cnt = 7; for (let i = 0; i < cnt; i++) { const a = i * 6.283 / cnt + t * (14 - y01 * 4) + y01 * 3, fr = Math.sin(a) > 0; if (fr !== front) continue; const px = T.x + Math.cos(a) * r, py = GY - y + Math.sin(a) * r * 0.22; p.px(px, py, front ? (i % 2 ? AIR[4] : AIR[3]) : AIR[1]); p.px(px + 1, py, front ? AIR[2] : AIR[0]); } } };
  return dur4(B, 3.6, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_G + 0.2 && t < T_THR) { n -= dt; if (n <= 0) { n = 0.04; const a = R.range(0, 6.28), y = R.range(0, 1); P.add({ kind: 'dust', x: T.x + Math.cos(a) * rx(y, t), y: GY - y * HG, vx: -Math.sin(a) * 40, vy: -4, life: 0.3, r0: 1, r1: 3, layer: 'front' }); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') { if (t > T_C) for (let y = -3; y <= 3; y++) for (let x = -18; x <= 18; x++) { const d = (x / 18) ** 2 + (y / 3) ** 2, a = clamp((t - T_C) / 0.4) * (t > T_THR ? clamp(1 - (t - T_THR) / 0.6) : 1); if (d < 1 && h2(x, y, Math.floor(t * 10)) < 0.25 * a) p.dark(T.x + x, GY + y, 0.4); } drawFun(p, t, false); }
      if (layer === 'front') {
        if (t < T_G) { const u = clamp((t - T_C) / (T_G - T_C)); if (t > T_C) swirl(p, T.x, GY - 2, 8 + 14 * u, t, 3, 0.2, u); swirl(p, F.x, F.y - F.h * 0.5, 4 + 8 * clamp(t / T_C), t, 3, 0.9, clamp(t / T_C) * 0.8); }
        drawFun(p, t, true); const gg = g(t); if (gg > 0.1) p.glow(T.x, GY - HG * gg * 0.5, 26, AIRC, 0.1 * gg);
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_G ? { sx: kf(t, [[0, 1], [T_C, 1.12], [T_G, 1.12]]), sy: kf(t, [[0, 1], [T_C, 0.9], [T_G, 0.9]]), tintA: 0.3 * clamp(t / T_C), tint: AIRT } : { sx: kf(t - T_G, [[0, 1.12], [0.1, 0.9], [0.35, 1]]), sy: kf(t - T_G, [[0, 0.9], [0.1, 1.12], [0.35, 1]]), tintA: 0.25 * clamp(1 - (t - T_G) / 0.5), tint: AIRT });
      if (t < T_G) return act({}); const k = t - T_G; if (t < T_THR) { const lift = eo(k / 0.8) * 22; return act({ dy: -lift, sx: Math.abs(Math.cos(t * 14)) * 0.55 + 0.5, sy: 1, dx: Math.sin(t * 5) * 2, tint: AIRT, tintA: 0.3 }); } const q = t - T_THR; return act({ dx: kf(q, [[0, 0], [0.1, 10], [0.5, 16], [1.0, 0]]), dy: kf(q, [[0, -22], [0.2, -12], [0.42, 0]]), sx: kf(q, [[0, 0.7], [0.15, 1.1], [0.45, 1]]), sy: kf(q, [[0, 1], [0.4, 1], [0.44, 0.8], [0.6, 1.06], [0.85, 1]]), flash: 0.4 * clamp(1 - q / 0.1), tint: AIRT, tintA: 0.3 * clamp(1 - q / 0.8) }); },
  });
}

// ───────────── Ojo del huracán (Aire · especial · zona, arrastra al centro) ─────────────
function ojo(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_C = 0.5, T_Z = 0.9, T_BURST = 3.0, T_END = 3.7, RZ = 40; let n = 0;
  const zone = (t) => (t < T_Z ? 0 : t < T_BURST ? eo((t - T_Z) / 0.6) : clamp(1 - (t - T_BURST) / 0.4));
  B.S.at(T_Z, () => { B.shake = 2.6; B.stop = 0.05; P.ring({ x: T.x, y: GY, r0: 2, r1: RZ, th: 3, life: 0.5, rp: AIR, ry: 0.32, layer: 'front' }); });
  B.S.at(T_BURST, () => { B.shake = 5; B.stop = 0.12; P.ring({ x: T.x, y: GY, r0: 3, r1: 60, th: 3, life: 0.5, rp: AIR, ry: 0.32, layer: 'front' }); P.ring({ x: T.x, y: T.y - T.h * 0.5, r0: 3, r1: 28, th: 2, life: 0.3, rp: AIR, ry: 1, layer: 'front' }); gustBurst(P, R, T.x, T.y - T.h * 0.5, 30, 140, 340); featherP(P, R, T.x, T.y - T.h * 0.5, 14, 110); for (let i = 0; i < 16; i++) P.add({ kind: 'dust', x: T.x + R.range(-16, 16), y: GY - 1, vx: R.range(-90, 90), vy: R.range(-24, -4), life: R.range(0.4, 0.8), r0: 1, r1: 5, layer: 'back' }); });
  return dur4(B, 4.0, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_Z && t < T_BURST) { n -= dt; if (n <= 0) { n = 0.03; const a = R.range(0, 6.28), r = RZ * R.range(0.6, 1); const x = T.x + Math.cos(a) * r, y = GY + Math.sin(a) * r * 0.16 - R.range(0, 6); P.add({ kind: 'gust', x, y, vx: -Math.cos(a) * 90 - Math.sin(a) * 90, vy: -Math.sin(a) * 14 + Math.cos(a) * 14, life: 0.45, len: 7 }); if (R.next() < 0.3) P.add({ kind: 'leaf', x, y, vx: -Math.cos(a) * 70 - Math.sin(a) * 70, vy: -Math.sin(a) * 10 - 10, life: 0.5, w: 16, len: 2, rp: AIR }); } } },
    draw(p, layer) {
      const t = B.t, z = zone(t);
      if (layer === 'back' && z > 0) for (let y = -4; y <= 4; y++) for (let x = -RZ; x <= RZ; x++) { const d = (x / RZ) ** 2 + (y / (RZ * 0.16)) ** 2; if (d < 1 && h2(x, y, Math.floor(t * 8)) < 0.25 * z * (1 - 0.5 * d)) p.dark(T.x + x, GY + y * 0.5, 0.35); }
      if (layer === 'front') {
        if (t < T_Z) swirl(p, F.x, F.y - F.h * 0.5, 4 + 10 * clamp(t / T_C), t, 3, 0.9, clamp(t / T_C) * 0.8);
        if (z > 0) { for (let h = 0; h < 3; h++) swirl(p, T.x, GY - 2 - h * 9, RZ * z * (1 - h * 0.18), -t * (1 + h * 0.2) + h, 4, 0.16, z * (1 - h * 0.2), 2.6); p.ring(T.x, GY, RZ * z, 1, AIR[3], 0.16, 0.7 * z); p.ring(T.x, GY, RZ * z * 0.45, 1, AIR[4], 0.16, 0.7 * z); p.glow(T.x, T.y - T.h * 0.5, 22, AIRC, 0.12 * z); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_Z ? { sx: kf(t, [[0, 1], [T_C, 1.12], [T_Z, 1.12]]), sy: kf(t, [[0, 1], [T_C, 0.9], [T_Z, 0.9]]), tintA: 0.3 * clamp(t / T_C), tint: AIRT } : { sx: kf(t - T_Z, [[0, 1.12], [0.1, 0.9], [0.35, 1]]), sy: kf(t - T_Z, [[0, 0.9], [0.1, 1.12], [0.35, 1]]), tintA: 0.25 * clamp(1 - (t - T_Z) / 0.5), tint: AIRT });
      if (t < T_Z) return act({}); if (t < T_BURST) { const k = t - T_Z; return act({ dx: Math.sin(t * 6) * 2 * clamp(k / 0.5), dy: -3 * Math.abs(Math.sin(t * 4)) * clamp(k / 0.5), sx: 0.95 + 0.1 * Math.abs(Math.cos(t * 10)), sy: 1, tint: AIRT, tintA: 0.3 * clamp(k / 0.4) }); } const q = t - T_BURST; return act({ dx: kf(q, [[0, 0], [0.1, 12], [0.6, 18], [1.2, 0]]), dy: kf(q, [[0, 0], [0.15, -10], [0.4, 0]]), sx: kf(q, [[0, 1], [0.05, 1.16], [0.2, 0.95], [0.45, 1]]), sy: kf(q, [[0, 1], [0.05, 0.8], [0.2, 1.08], [0.45, 1]]), flash: 0.4 * clamp(1 - q / 0.1), tint: AIRT, tintA: 0.3 * clamp(1 - q / 0.9) }); },
  });
}

// ───────────── Plumaje etéreo (Aire · defensa · propia, esquiva) ─────────────
function plumaje(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: F.x, y: F.y - F.h * 0.5 }, T_ON = 0.5, T_DASH = 1.4, T_C = 1.54, T_OFF = 2.9, T_END = 3.4;
  const DASH = (T.x - F.x) - (F.w * 0.5 + T.w * 0.5) + 2, OVER = 16;
  const ex = (t) => (t < T_DASH ? (t > T_DASH - 0.35 ? 1.5 * smooth((t - T_DASH + 0.35) / 0.35) : 0) : t < T_C ? lerp(1.5, -DASH, ei((t - T_DASH) / (T_C - T_DASH))) : t < T_C + 0.18 ? lerp(-DASH, -DASH - OVER, eo((t - T_C) / 0.18)) : t < T_C + 0.8 ? -DASH - OVER : lerp(-DASH - OVER, 0, smooth((t - T_C - 0.8) / 0.5)));
  let ghost = null;
  B.S.at(T_ON, () => { B.shake = 0.5; featherP(P, R, C.x, C.y, 10, 50); });
  B.S.at(T_C - 0.03, () => { B.shake = 0.6; ghost = { x: F.x, a: 0 }; gustBurst(P, R, C.x, C.y, 12, 80, 200); featherP(P, R, C.x, C.y, 10, 90); });
  B.S.at(T_C + 0.1, () => { B.shake = 2; for (let i = 0; i < 8; i++) P.add({ kind: 'dust', x: T.x + ex(T_C + 0.1) + R.range(-6, 6), y: GY - 1, vx: R.range(-40, 10), vy: R.range(-8, -2), life: 0.5, r0: 1, r1: 4, layer: 'back' }); });
  const dodge = (t) => { const k = t - (T_C - 0.06); return k < 0 ? 0 : kf(k, [[0, 0], [0.08, 1], [0.55, 1], [0.85, 0]]); };
  return dur4(B, 3.6, {
    update(dt) { B.tick(dt); if (ghost) ghost.a += dt; const t = B.t; if (t > T_C && t < T_C + 0.4) { P.add({ kind: 'gust', x: T.x + ex(t) + T.w * 0.5, y: T.y - R.range(2, T.h), vx: 120, vy: 0, life: 0.2, len: 7 }); } },
    draw(p, layer) {
      const t = B.t, g = clamp((t - T_ON) / 0.4) * (t > T_OFF ? clamp((T_END - t) / (T_END - T_OFF)) : 1);
      if (layer === 'back' && ghost && ghost.a < 0.5) p.sprite(ctx.sprites.caster, ghost.x, F.y, { flat: AIR[3], alpha: 0.6 * (1 - ghost.a / 0.5) });
      if (layer === 'front' && g > 0) {
        for (let i = 0; i < 7; i++) { const a = i * 0.898 + t * 1.6, rx = F.w * 0.7 + 3 + Math.sin(t * 3 + i) * 1.5, x = C.x + Math.cos(a) * rx, y = C.y + Math.sin(a) * F.h * 0.55; leaf(p, x, y, 3.4, 1.3, a + 1.6, AIR, g); }
        p.glow(C.x, C.y, 22, AIRC, 0.15 * g * (1 + dodge(t)));
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const d = dodge(t); return act(t < T_ON ? {} : { dx: -7 * d, dy: -2 * d, alpha: 1 - 0.6 * d, sy: 1 + 0.06 * d, sx: 1 - 0.06 * d, tint: AIRT, tintA: (t < T_C ? 0.2 * clamp((t - T_ON) / 0.3) : 0.2) + 0.2 * d }); }
      const dx = ex(t); if (t < T_DASH) return act({ dx, sx: t > T_DASH - 0.35 ? kf(t, [[T_DASH - 0.35, 1], [T_DASH, 0.9]]) : 1, sy: t > T_DASH - 0.35 ? kf(t, [[T_DASH - 0.35, 1], [T_DASH, 1.1]]) : 1 });
      if (t < T_C) return act({ dx, sx: 1.18, sy: 0.9 });
      const k = t - T_C; return act({ dx, dy: kf(k, [[0, 0], [0.15, -3], [0.3, 0]]), sx: kf(k, [[0, 1.16], [0.2, 0.96], [0.5, 1]]), sy: kf(k, [[0, 0.9], [0.1, 1.08], [0.4, 0.94], [0.8, 1]]) });
    },
  });
}

// ───────────── Viento de cola (Aire · apoyo · sube la velocidad) ─────────────
function vientoCola(ctx) {
  const R = ctx.R, F = ctx.from, A = ctx.to, B = base(ctx), P = B.P;
  const S0 = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.55 }, AC = { x: A.x, y: A.y - A.h * 0.5 };
  const T_REL = 0.45, FLY = 0.3, T_L = T_REL + FLY, T_DASH = 1.5, DDX = -14, ghosts = []; let orb = null, n = 0, m = 0, on = 0;
  B.S.at(T_REL, () => { B.shake = 0.5; gustBurst(P, R, S0.x, S0.y, 10, 60, 150, { a0: -0.6, a1: 0.6 }); });
  B.S.at(T_L, () => { on = 1; B.shake = 1; P.ring({ x: A.x, y: A.y, r0: 3, r1: 17, th: 2, life: 0.45, rp: AIR, ry: 0.32 }); gustBurst(P, R, AC.x, AC.y, 12, 60, 160); featherP(P, R, AC.x, AC.y, 6, 50); });
  [0.0, 0.18, 0.36].forEach((d) => B.S.at(T_L + 0.2 + d, () => { for (let k = 0; k < 3; k++) P.add({ kind: 'chevA', x: A.x - 6 + k * 6, y: A.y - A.h - 2 - k * 2, vx: 0, vy: -16, life: 0.85 }); }));
  const dashX = (t) => (t < T_DASH ? 0 : t < T_DASH + 0.12 ? lerp(0, DDX, ei((t - T_DASH) / 0.12)) : t < T_DASH + 0.3 ? DDX : lerp(DDX, 0, smooth((t - T_DASH - 0.3) / 0.14)));
  return dur4(B, 3.0, {
    update(dt) { B.tick(dt); const t = B.t; if (t >= T_REL && t < T_L) { const u = (t - T_REL) / FLY; orb = { x: lerp(S0.x, AC.x, u), y: lerp(S0.y, AC.y, u) - Math.sin(Math.PI * u) * 14 }; n -= dt; if (n <= 0) { n = 0.012; P.add({ kind: 'gust', x: orb.x, y: orb.y + R.range(-2, 2), vx: -80, vy: R.range(-10, 10), life: 0.18, len: 6 }); } } else orb = null;
      if (t > T_L + 0.1 && t < T_L + 1.3) { m -= dt; if (m <= 0) { m = 0.06; P.add({ kind: 'gust', x: A.x - A.w * 0.6, y: A.y - R.range(2, A.h), vx: 140, vy: 0, life: 0.2, len: 8 }); } }
      if (t > T_DASH - 0.05 && t < T_DASH + 0.5) { ghosts.push({ x: A.x + dashX(t), a: 0 }); } ghosts.forEach((g) => (g.a += dt)); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') ghosts.forEach((g) => { if (g.a < 0.16) p.sprite(ctx.sprites.target, g.x, A.y, { flat: AIR[3], alpha: 0.7 * (1 - g.a / 0.16) }); });
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; swirl(p, S0.x, S0.y, 4 + 8 * u, t, 3, 0.9, u * 0.9); p.glow(S0.x, S0.y, 8 + 6 * u, AIRC, 0.3 * u); }
        if (orb) { crescent(p, orb.x, orb.y, 6, 0, 1.2, 2); p.glow(orb.x, orb.y, 10, AIRC, 0.4); }
        if (on && t > T_L && t < T_L + 1.6) { const k = (t - T_L) / 1.6; swirl(p, AC.x, AC.y, A.w * 0.9, t, 2, 0.8, 1 - k, 2); p.glow(AC.x, AC.y, 18, AIRC, 0.2 * (1 - k)); }
        if (t > T_DASH && t < T_DASH + 0.5) for (let i = 0; i < 5; i++) { const y = A.y - A.h * (0.2 + i * 0.17), L2 = 9 + (i % 2) * 6, x0 = A.x + dashX(t) + A.w * 0.4 + (i % 3) * 3; p.line(x0, y, x0 + L2, y, AIR[i % 2 ? 4 : 3]); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sx: kf(t, [[0, 1], [T_REL, 1.12]]), sy: kf(t, [[0, 1], [T_REL, 0.9]]), tintA: 0.25 * (t / T_REL), tint: AIRT } : { sx: kf(r, [[0, 1.12], [0.05, 0.9], [0.25, 1]]), sy: kf(r, [[0, 0.9], [0.05, 1.12], [0.25, 1]]), dx: kf(r, [[0, 0], [0.05, -2], [0.3, 0]]), tintA: 0.2 * clamp(1 - r / 0.25), tint: AIRT }); }
      if (t < T_L) return act({}); const k = t - T_L; const lean = k < 1.4 ? Math.sin(t * 12) * 0.5 : 0; return act({ dx: dashX(t) + lean, sx: t > T_DASH && t < T_DASH + 0.3 ? 1.15 : 1, sy: t > T_DASH && t < T_DASH + 0.3 ? 0.92 : 1, flash: k < 0.2 ? 0.2 * (1 - k / 0.2) : 0, tint: AIRT, tintA: 0.3 * clamp(1 - k / 1.6) }); },
  });
}

(function () {
  const C = '#6cc4d8', by = Object.fromEntries(MOVES.map((m) => [m.id, m]));
  const add = [
    { id: 'tajo', nombre: 'Tajo de viento', tipo: 'Básico · proyectil ×2', make: tajo, fases: ['Junta aire en espiral', 'Dos cuchillas de viento salen una tras otra', 'Cortes en cruz con ráfagas y polvo'], uso: 'Básico a media distancia: corte rápido y a menudo.' },
    { id: 'aletazo', nombre: 'Aletazo', tipo: 'Básico · contacto', make: aletazo, fases: ['Salta y bate las alas', 'Embiste con estela', 'Golpe de ala con plumas y ráfaga', 'El rival retrocede'], uso: 'Básico de cuerpo a cuerpo: retroceso leve.' },
    { id: 'remolino', nombre: 'Remolino', tipo: 'Habilidad · área, aparta', make: remolino, fases: ['Se carga de viento', 'Gira y suelta un remolino que se expande', 'Alcanza al rival y lo aparta', 'El polvo se asienta'], uso: 'Habilidad: aparta y desordena a los rivales cercanos.' },
    { id: 'vendaval', nombre: 'Vendaval', tipo: 'Habilidad · haz, empuja', make: vendaval, fases: ['Inspira: el aire entra', 'Un chorro de viento recorre la línea', 'Empuja al rival de forma continua', 'Cesa y vuelve'], uso: 'Habilidad: empuja en línea recta.' },
    { id: 'tornado', nombre: 'Tornado', tipo: 'Especial · área, arrastra', make: tornado, fases: ['Aviso: polvo girando bajo el rival', 'Surge un tornado y lo levanta', 'Lo hace girar', 'Lo lanza lejos con onda de choque'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'ojo', nombre: 'Ojo del huracán', tipo: 'Especial · zona, arrastra al centro', make: ojo, fases: ['Se carga de viento', 'Un huracán plano se abre en el suelo', 'Todo gira hacia el centro y arrastra al rival', 'Estalla hacia afuera y lo dispersa'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'plumaje', nombre: 'Plumaje etéreo', tipo: 'Defensa · esquiva', make: plumaje, fases: ['Plumas orbitan al cuerpo', 'El rival embiste', 'Se vuelve etérea y esquiva', 'El rival pasa de largo y tropieza'], uso: 'Hueco de defensa: esquiva casi todo un tiempo.' },
    { id: 'vientocola', nombre: 'Viento de cola', tipo: 'Apoyo · sube la velocidad', make: vientoCola, fases: ['Sopla una brisa', 'La lanza en arco a la aliada', 'Remolino y chevrones de subida', 'La aliada se mueve más rápido con estelas'], uso: 'Hueco de apoyo: más velocidad para una aliada.' },
  ].map((m) => Object.assign({ el: 'Aire', col: C, caster: 'pompon', target: 'aguacato' }, m));
  add[7].target = 'fosforin';
  const all = Object.assign({}, by); add.forEach((m) => { all[m.id] = m; });
  const order = MOVES.map((m) => m.id).concat(add.map((m) => m.id));
  MOVES.length = 0; order.forEach((id) => MOVES.push(all[id]));
})();
