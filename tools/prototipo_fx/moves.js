// ═════════ MOVIMIENTOS DE REFERENCIA ═════════
// Cada movimiento: preparación → lanzamiento → trayecto → impacto (parada breve, temblor, destello) → recuperación.
const NEUTRO = { dx: 0, dy: 0, sx: 1, sy: 1, flash: 0, tintA: 0, tint: [255, 255, 255], alpha: 1 };
const act = (o) => Object.assign({}, NEUTRO, o);
const FIREC = [255, 140, 50], WATERC = [90, 180, 255], HEALC = [140, 255, 150];

// Base común: tiempo, partículas, guion, temblor y parada de impacto
function base(ctx) {
  const o = { R: ctx.R, t: 0, P: new Particles(ctx.R), S: new Script(), shake: 0, stop: 0, extra: [] };
  o.tick = (dt) => { o.t += dt; o.S.run(o.t); o.P.update(dt, GY); o.shake *= Math.exp(-dt * 11); };
  return o;
}
const burst = (P, R, x, y, n, sp0, sp1, o = {}) => { for (let i = 0; i < n; i++) { const a = (o.a0 !== undefined ? R.range(o.a0, o.a1) : R.range(0, Math.PI * 2)), sp = R.range(sp0, sp1); P.add(Object.assign({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), g: 260, drag: 1.2, life: R.range(0.3, 0.65), bounce: 0.35 }, o.p || {})); } };

// ───────────── 1 · LLAMARADA (Fuego · básico · proyectil) ─────────────
function llamarada(ctx, cfg = {}) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.42, y: F.y - F.h * 0.55 }, I = { x: T.x - T.w * 0.3, y: T.y - T.h * 0.5 };
  const T_REL = 0.36, T_FLY = cfg.flyT || 0.34, BIG = cfg.big || 1, ARC = cfg.arc || 5, BR = cfg.ball || 1, T_HIT = T_REL + T_FLY;
  let ball = null, nEm = 0, nTr = 0, nBu = 0, nSm = 0, impact = false;
  B.S.at(T_REL, () => {
    B.shake = 1; burst(P, R, M.x, M.y, 14, 90, 210, { a0: -0.55, a1: 0.55, p: { life: R.range(0.2, 0.4) } });
    P.add({ kind: 'fire', x: M.x + 2, y: M.y, vx: 40, vy: -8, life: 0.16, r: 5 });
  });
  B.S.at(T_HIT, () => {
    impact = true; B.stop = 0.1 + 0.03 * (BIG - 1); B.shake = 3.6 * BIG;
    P.add({ kind: 'fire', x: I.x, y: I.y, vx: 0, vy: -16, life: 0.42, r: 11 * BIG, drag: 2 });
    P.add({ kind: 'fire', x: I.x - 3, y: I.y + 3, vx: -20, vy: -10, life: 0.34, r: 7 * BIG });
    P.add({ kind: 'fire', x: I.x + 3, y: I.y + 2, vx: 20, vy: -14, life: 0.36, r: 7 * BIG });
    burst(P, R, I.x, I.y, 30, 60, 190, { up: 70 });
    for (let i = 0; i < 16; i++) P.add({ kind: 'ember', x: I.x + R.range(-4, 4), y: I.y + R.range(-4, 4), vx: R.range(-40, 40), vy: R.range(-90, -20), g: -8, drag: 1, life: R.range(0.6, 1.3), big: R.next() < 0.3 });
    for (let i = 0; i < 6; i++) P.add({ kind: 'smoke', x: I.x + R.range(-6, 6), y: I.y + R.range(-4, 2), vx: R.range(-10, 10), vy: R.range(-26, -12), life: R.range(0.8, 1.4), r0: 2, r1: R.range(6, 9), a0: 0.6, layer: 'back' });
    P.ring({ x: I.x, y: I.y, r0: 1, r1: 15 * BIG, th: 2, life: 0.26, rp: FIRE, ry: 1, layer: 'front' });
    P.ring({ x: T.x, y: T.y, r0: 1, r1: 15 * BIG, th: 2, life: 0.4, rp: FIRE, ry: 0.3, layer: 'back' });
    for (let i = 0; i < (cfg.frags || 0); i++) P.add({ kind: 'fire', x: I.x, y: I.y - 2, vx: R.range(-80, 80), vy: R.range(-120, -50), g: 220, life: R.range(0.5, 0.9), r: 2.6 });
    for (let i = 0; i < 7; i++) P.add({ kind: 'dust', x: T.x + R.range(-8, 8), y: T.y - 1, vx: R.range(-30, 30), vy: R.range(-8, -2), life: R.range(0.3, 0.6), r0: 1, r1: 4, layer: 'back' });
  });
  const state = (t) => ({ u: clamp((t - T_REL) / T_FLY) });
  return {
    dur: 2.7, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t;
      if (t < T_REL) { nEm -= dt; if (nEm <= 0) { nEm = 0.016; const a = R.range(0, 6.28), d = R.range(11, 17); P.add({ kind: 'ember', x: M.x + Math.cos(a) * d, y: M.y + Math.sin(a) * d, vx: -Math.cos(a) * d / 0.22, vy: -Math.sin(a) * d / 0.22, life: 0.22, noglow: true }); } }
      if (t >= T_REL && t < T_HIT) {
        const u = state(t).u, e = Math.pow(u, 1.6); ball = { x: lerp(M.x, I.x, e), y: lerp(M.y, I.y, u) - Math.sin(Math.PI * u) * ARC };
        nTr -= dt; if (nTr <= 0) { nTr = 0.011; P.add({ kind: 'fire', x: ball.x - 3, y: ball.y + R.range(-1.5, 1.5), vx: -34, vy: R.range(-22, -6), life: 0.24, r: R.range(2.6, 3.6) }); }
        nBu -= dt; if (nBu <= 0) { nBu = 0.02; P.add({ kind: 'ember', x: ball.x - 2, y: ball.y + R.range(-3, 3), vx: R.range(-70, -20), vy: R.range(-35, 10), g: 40, life: R.range(0.3, 0.7) }); }
        nSm -= dt; if (nSm <= 0) { nSm = 0.035; P.add({ kind: 'smoke', x: ball.x - 4, y: ball.y, vx: -10, vy: -14, life: 0.55, r0: 1.5, r1: 5, a0: 0.45, layer: 'back' }); }
      } else ball = null;
      if (t > T_HIT + 0.05 && t < T_HIT + 1.15) { nBu -= dt; if (nBu <= 0) { nBu = 0.05; P.add({ kind: 'fire', x: T.x + R.range(-T.w * 0.3, T.w * 0.3), y: T.y - R.range(T.h * 0.3, T.h * 0.9), vx: 0, vy: -24, life: 0.3, r: 2.2 }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') {
        if (impact) { const a = clamp(1 - (t - T_HIT) / 2.0); for (let y = -3; y <= 3; y++) for (let x = -11; x <= 11; x++) { const d = (x / 11) ** 2 + (y / 3) ** 2, n = fbm((T.x + x) * 0.3, (T.y + y) * 0.5, 9); if (d + (n - 0.5) * 0.5 < 1) p.dark(T.x + x, T.y + y, a * 0.9); } }
      }
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL, r = 0.8 + 3.2 * eo(u); flame(p, M.x, M.y, r, r, t, 3, { up: 0.3, fade: 0.1 }); p.glow(M.x, M.y, 6 + 8 * u, FIREC, 0.5 * u); p.glow(F.x, F.y - F.h * 0.5, 12, FIREC, 0.2 * u); }
        if (ball) { const u = state(t).u; flame(p, ball.x, ball.y, 5.6 * BR, 3.9 * BR, t * 1.2, 7, { up: 0.15 }); p.disc(ball.x + 1, ball.y, 1.5 * BR, FIRE[8]); p.glow(ball.x, ball.y, 17 * BR, FIREC, 0.7); p.glow(ball.x, GY, 9, FIREC, 0.35 * (1 - 0.3 * u)); }
        if (impact) { const k = (t - T_HIT); if (k < 0.34) p.glow(I.x, I.y, 30 * BIG, [255, 150, 70], 0.8 * (1 - k / 0.34)); }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') {
        const w = clamp(t / T_REL), r = t - T_REL;
        const sy = t < T_REL ? kf(t, [[0, 1], [T_REL, 0.8]]) : kf(r, [[0, 0.8], [0.05, 1.16], [0.3, 1]]), sx = t < T_REL ? kf(t, [[0, 1], [T_REL, 1.16]]) : kf(r, [[0, 1.16], [0.05, 0.88], [0.3, 1]]), dx = t < T_REL ? -2 * smooth(w) : kf(r, [[0, -2], [0.06, 3.5], [0.5, 0]]);
        return act({ sx, sy, dx, tintA: t < T_REL ? 0.35 * w : 0.3 * clamp(1 - r / 0.25), tint: [255, 130, 40] });
      }
      const k = t - T_HIT; if (k < 0) return act({});
      return act({ dx: kf(k, [[0, 0], [0.07, 5.5 * BIG], [0.55, 0]]), sy: kf(k, [[0, 1], [0.05, 0.78], [0.17, 1.1], [0.42, 1]]), sx: kf(k, [[0, 1], [0.05, 1.18], [0.17, 0.94], [0.42, 1]]), flash: clamp(1 - k / 0.14), tint: [255, 90, 30], tintA: k < 1.2 ? 0.28 * clamp(1 - k / 1.2) * (0.7 + 0.3 * Math.sin(k * 40)) : 0 });
    },
  };
}

// ───────────── 2 · SALTO DE FUEGO (Fuego · habilidad · contacto + onda) ─────────────
function saltoFuego(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const LAND = { x: F.x, y: GY }, SPD = 105;   // salta EN SU SITIO: la onda es la que llega al rival
  const T_J = 0.34, T_L = 0.78, HGT = 24, T_BACK = 99;
  const ghosts = [], pillars = [];
  let nGh = 0, nFl = 0, landed = false;
  const pos = (t) => {
    if (t < T_J) return { x: F.x, y: F.y, air: 0 };
    if (t < T_L) { const u = (t - T_J) / (T_L - T_J); return { x: lerp(F.x, LAND.x, u), y: F.y - Math.sin(Math.PI * u) * HGT, air: u }; }
    if (t < T_BACK) return { x: LAND.x, y: LAND.y, air: 0 };
    const u = clamp((t - T_BACK) / 0.5); return { x: lerp(LAND.x, F.x, smooth(u)), y: F.y - Math.sin(Math.PI * u) * 10, air: 0 };
  };
  B.S.at(T_J, () => { P.ring({ x: F.x, y: F.y, r0: 1, r1: 12, th: 2, life: 0.3, rp: FIRE, ry: 0.3, layer: 'back' }); for (let i = 0; i < 8; i++) P.add({ kind: 'dust', x: F.x + R.range(-5, 5), y: F.y - 1, vx: R.range(-30, 30), vy: R.range(-10, -2), life: 0.4, r0: 1, r1: 4, layer: 'back' }); });
  B.S.at(T_L, () => {
    landed = true; B.stop = 0.12; B.shake = 4.6;
    P.ring({ x: LAND.x, y: GY, r0: 2, r1: 24, th: 4, life: 0.45, rp: FIRE, ry: 0.3, layer: 'back' });
    P.ring({ x: LAND.x, y: GY, r0: 1, r1: 15, th: 2.5, life: 0.36, rp: FIRE, ry: 0.3, layer: 'back' });
    burst(P, R, LAND.x, GY - 2, 34, 50, 200, { a0: -2.9, a1: -0.25, up: 40 });
    for (let x = LAND.x + 11; x <= T.x + 14; x += 7) pillars.push({ x, t0: B.t + (x - LAND.x) / SPD, h: R.range(11, 17) });
    for (let i = 0; i < 12; i++) P.add({ kind: 'dust', x: LAND.x + R.range(-12, 12), y: GY - 1, vx: R.range(-60, 60), vy: R.range(-14, -3), life: R.range(0.35, 0.7), r0: 1, r1: 5, layer: 'back' });
    for (let i = 0; i < 6; i++) P.add({ kind: 'smoke', x: LAND.x + R.range(-10, 10), y: GY - 3, vx: R.range(-15, 15), vy: R.range(-24, -10), life: R.range(0.9, 1.5), r0: 2, r1: 8, a0: 0.55, layer: 'back' });
    for (let i = 0; i < 12; i++) P.add({ kind: 'ember', x: LAND.x + R.range(-10, 10), y: GY - 3, vx: R.range(-30, 30), vy: R.range(-90, -30), g: -6, life: R.range(0.7, 1.4), big: R.next() < 0.3 });
  });
  const hitAt = T_L + Math.max(0, (T.x - T.w * 0.4 - LAND.x)) / SPD;
  B.S.at(hitAt, () => { B.shake = Math.max(B.shake, 3); B.stop = 0.08; P.add({ kind: 'fire', x: T.x - 3, y: T.y - T.h * 0.45, vx: 20, vy: -14, life: 0.36, r: 8 }); burst(P, R, T.x - 3, T.y - T.h * 0.45, 20, 50, 160, { up: 60 }); P.ring({ x: T.x - 3, y: T.y - T.h * 0.45, r0: 1, r1: 14, th: 2.5, life: 0.2, rp: FIRE, ry: 1, layer: 'front' }); });
  return {
    dur: 2.6, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t, c = pos(t);
      if (t >= T_J && t < T_L) { nGh -= dt; if (nGh <= 0) { nGh = 0.028; ghosts.push({ x: c.x, y: c.y, a: 0, sx: 0.9, sy: 1.12 }); } nFl -= dt; if (nFl <= 0) { nFl = 0.014; P.add({ kind: 'fire', x: c.x + R.range(-3, 3) - 3, y: c.y - F.h * R.range(0.2, 0.9), vx: -40, vy: R.range(-18, -4), life: 0.26, r: R.range(2.6, 4) }); P.add({ kind: 'ember', x: c.x + R.range(-5, 5), y: c.y - R.range(2, F.h), vx: R.range(-60, -20), vy: R.range(-20, 20), g: 30, life: R.range(0.3, 0.8) }); } }
      if (t < T_J) { nFl -= dt; if (nFl <= 0) { nFl = 0.03; P.add({ kind: 'fire', x: F.x + R.range(-4, 4), y: F.y - R.range(1, 4), vx: 0, vy: -20, life: 0.28, r: 2.4 * clamp(t / T_J + 0.3) }); } }
      for (const g of ghosts) g.a += dt;
      if (t > T_L && t < T_L + (T.x + 14 - LAND.x) / SPD) { const fx = LAND.x + SPD * (t - T_L); if (R.next() < 0.7) P.add({ kind: 'dust', x: fx, y: GY - 1, vx: R.range(-6, 6), vy: R.range(-10, -3), life: 0.35, r0: 1, r1: 3.5, layer: 'back' }); if (R.next() < 0.5) P.add({ kind: 'ember', x: fx + R.range(-2, 3), y: GY - R.range(1, 7), vx: R.range(10, 40), vy: R.range(-40, -10), g: 40, life: R.range(0.3, 0.7) }); }
      if (t > T_L && t < T_L + 0.6) { nFl -= dt; if (nFl <= 0) { nFl = 0.05; P.add({ kind: 'fire', x: T.x + R.range(-T.w * 0.3, T.w * 0.3), y: T.y - R.range(T.h * 0.3, T.h * 0.9), vx: 0, vy: -24, life: 0.3, r: 2.2 }); } }
    },
    draw(p, layer) {
      const t = B.t, c = pos(t);
      if (layer === 'back') {
        if (landed) { const a = clamp(1 - (t - T_L) / 2.1); for (let y = -3; y <= 3; y++) for (let x = -14; x <= 14; x++) { const d = (x / 14) ** 2 + (y / 3.2) ** 2, n = fbm((LAND.x + x) * 0.3, (GY + y) * 0.5, 4); if (d + (n - 0.5) * 0.5 < 1) p.dark(LAND.x + x, GY + y, a * 0.85); } }
        for (const g of ghosts) { if (g.a < 0.2) p.sprite(ctx.sprites.caster, g.x, g.y, { sx: g.sx, sy: g.sy, flat: FIRE[3 + (g.a > 0.1 ? 0 : 1)], alpha: 0.65 * (1 - g.a / 0.2) }); }
      }
      if (layer === 'front') {
        if (t >= T_J && t < T_L) { flame(p, c.x - 2, c.y - F.h * 0.45, F.w * 0.75, F.h * 0.8, t, 11, { up: 0.5, fade: 0.1 }); p.glow(c.x, c.y - F.h / 2, 18, FIREC, 0.6); p.glow(c.x, GY, 10, FIREC, 0.4 * clamp(1 - (GY - c.y) / 40)); }
        for (const q of pillars) { const a = (t - q.t0) / 0.6; if (a < 0 || a > 1) continue; const hh = q.h * Math.min(1, a * 4) * (1 - a * 0.3); flame(p, q.x, GY - hh * 0.4, 3.6 + a * 1, hh * 0.65, t + q.x, q.x, { fade: a * a * 0.8, up: 1 }); p.glow(q.x, GY - hh * 0.4, 11, FIREC, 0.4 * (1 - a)); }
        if (landed) { const k = t - T_L; if (k < 0.4) p.glow(LAND.x, GY - 4, 34, [255, 150, 70], 0.8 * (1 - k / 0.4)); }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') {
        const c = pos(t); let sx = 1, sy = 1, ta = 0;
        if (t < T_J) { const w = t / T_J; sy = kf(t, [[0, 1], [T_J, 0.74]]); sx = kf(t, [[0, 1], [T_J, 1.2]]); ta = 0.4 * w; }
        else if (t < T_L) { sy = 1.2; sx = 0.86; ta = 0.55; }
        else { const k = t - T_L; sy = kf(k, [[0, 0.68], [0.1, 0.68], [0.3, 1.06], [0.5, 1]]); sx = kf(k, [[0, 1.25], [0.1, 1.25], [0.3, 0.95], [0.5, 1]]); ta = 0.4 * clamp(1 - k / 0.5); if (t > T_BACK - 0.1 && t < T_BACK) { sy = 0.85; sx = 1.1; } if (t >= T_BACK) { const u = clamp((t - T_BACK) / 0.5); sy = u < 1 ? 1.1 : 1; sx = u < 1 ? 0.92 : 1; ta = 0; } }
        return act({ dx: c.x - F.x, dy: c.y - F.y, sx, sy, tintA: ta, tint: [255, 120, 30] });
      }
      const k = t - hitAt; if (k < 0) return act({});
      return act({ dx: kf(k, [[0, 0], [0.09, 7], [0.65, 0]]), sy: kf(k, [[0, 1], [0.05, 0.74], [0.18, 1.12], [0.45, 1]]), sx: kf(k, [[0, 1], [0.05, 1.22], [0.18, 0.92], [0.45, 1]]), flash: clamp(1 - k / 0.15), tint: [255, 90, 30], tintA: k < 1.1 ? 0.3 * clamp(1 - k / 1.1) * (0.7 + 0.3 * Math.sin(k * 40)) : 0 });
    },
  };
}

// ───────────── 3 · ESCUDO DE AGUA (Agua · defensa · propia) ─────────────
function escudoAgua(ctx) {
  const R = ctx.R, F = ctx.from, A = ctx.to, B = base(ctx), P = B.P;
  const C = { x: F.x, y: F.y - F.h * 0.5 }, RAD = Math.max(F.w, F.h) * 0.78;
  const T_FORM = 0.4, T_SHOOT = 0.95, T_HIT = 1.3, T_POP = 1.6;
  const MA = { x: A.x - A.w * 0.4, y: A.y - A.h * 0.55 };
  let shield = 0, absorbed = false, popped = false, ripple = null, nS = 0, ang = 0;
  const HITP = { x: C.x + RAD * 0.95, y: C.y - 1 };
  for (let i = 0; i < 20; i++) B.S.at(0.02 + i * 0.016, () => { const a = R.range(0, 6.28), d = R.range(15, 21); P.add({ kind: 'drop', x: 0, y: 0, orbit: true, cx: C.x, cy: C.y, ang: a, w: 9 * R.sign(), orR0: d, orR: d, life: 0.36, big: true }); });
  B.S.at(T_FORM, () => { absorbed = false; B.shake = 0.8; P.ring({ x: F.x, y: F.y, r0: 2, r1: 18, th: 2, life: 0.4, rp: WATER, ry: 0.3 }); });
  B.S.at(T_SHOOT, () => { B.shake = 0.8; for (let i = 0; i < 6; i++) P.add({ kind: 'leaf', x: MA.x, y: MA.y, vx: R.range(-70, -30), vy: R.range(-20, 20), life: 0.3, w: 12, len: 1.8 }); });
  B.S.at(T_HIT, () => {
    absorbed = true; B.stop = 0.07; B.shake = 1.8; ripple = { a: Math.atan2(HITP.y - C.y, HITP.x - C.x), t0: B.t };
    for (let i = 0; i < 14; i++) { const a = R.range(-0.9, 0.9); P.add({ kind: 'drop', x: HITP.x, y: HITP.y, vx: Math.cos(a) * R.range(40, 120), vy: Math.sin(a) * R.range(40, 120) - 30, g: 280, life: 0.9, splash: true, big: R.next() < 0.3 }); }
    for (let i = 0; i < 5; i++) P.add({ kind: 'leaf', x: HITP.x + 2, y: HITP.y, vx: R.range(10, 60), vy: R.range(-60, -10), g: 70, drag: 1.5, life: R.range(0.5, 0.9), w: 10, len: 1.6 });
    P.add({ kind: 'sparkle', x: HITP.x, y: HITP.y, vx: 0, vy: 0, life: 0.25, len: 3, rp: WATER, gc: [140, 210, 255] });
  });
  B.S.at(T_POP, () => {
    popped = true; B.shake = 1.4;
    for (let i = 0; i < 38; i++) { const a = R.range(0, 6.28), sp = R.range(30, 100); P.add({ kind: 'drop', x: C.x + Math.cos(a) * RAD * 0.9, y: C.y + Math.sin(a) * RAD * 1.0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, g: 260, life: 1, splash: true, big: R.next() < 0.3 }); }
    for (let i = 0; i < 3; i++) P.ring({ x: F.x, y: F.y, r0: 2, r1: 10 + i * 6, th: 1.5, life: 0.5 + i * 0.12, rp: WATER, ry: 0.32 });
    P.add({ kind: 'sparkle', x: C.x - 4, y: C.y - 6, vx: 0, vy: 0, life: 0.4, len: 2.5, rp: WATER, gc: [140, 210, 255] });
  });
  const leafPos = (t) => { const u = clamp((t - T_SHOOT) / (T_HIT - T_SHOOT)); return { x: lerp(MA.x, HITP.x, u), y: lerp(MA.y, HITP.y, u) - Math.sin(Math.PI * u) * 3 }; };
  return {
    dur: 2.7, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t;
      if (t >= T_FORM && !popped) shield = t < T_FORM + 0.28 ? eback((t - T_FORM) / 0.28) : 1; else if (popped) shield = 0;
      if (t >= T_SHOOT && t < T_HIT) { nS -= dt; if (nS <= 0) { nS = 0.014; const l = leafPos(t); P.add({ kind: 'ember', x: l.x + 2, y: l.y + R.range(-1, 1), vx: 20, vy: R.range(-8, 8), life: 0.3, rp: LEAF, noglow: true }); } }
      if (t >= T_FORM && t < T_POP && R.next() < dt * 14) P.add({ kind: 'sparkle', x: C.x + R.range(-RAD, RAD) * 0.8, y: C.y + R.range(-RAD, RAD) * 0.8, vx: 0, vy: 0, life: 0.45, len: 1.2, rp: WATER, gc: [140, 210, 255] });
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') {
        if (shield > 0.05) { p.dark(C.x, GY, 0); for (let x = -8; x <= 8; x++) for (let y = -2; y <= 2; y++) if ((x / 8) ** 2 + (y / 2) ** 2 < 1) p.dark(F.x + x, F.y + y, 0.15); }
      }
      if (layer === 'front') {
        if (t >= T_SHOOT && t < T_HIT) { const l = leafPos(t); leaf(p, l.x, l.y, 3.2, 1.7, t * 22); p.glow(l.x, l.y, 8, [120, 255, 120], 0.35); }
        if (shield > 0.02) {
          const s = shield, rx = RAD * s * (1 + 0.04 * Math.sin(t * 9)), ry = RAD * s * 1.08;
          const x0 = Math.floor(C.x - rx - 1), x1 = Math.ceil(C.x + rx + 1), y0 = Math.floor(C.y - ry - 1), y1 = Math.ceil(C.y + ry + 1);
          const flashHit = absorbed && t - T_HIT < 0.07;
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            let nx = (x + 0.5 - C.x) / rx, ny = (y + 0.5 - C.y) / ry; const an = Math.atan2(ny, nx), d = Math.hypot(nx, ny) * (1 + 0.035 * Math.sin(an * 3 + t * 7));
            if (d > 1) continue;
            const nz = fbm(x * 0.2 + t * 0.9, y * 0.2 - t * 0.5, 3);
            if (d > 0.8) {
              const b = (d - 0.8) / 0.2; let idx = 2 + Math.floor(b * 3.2), boost = 0;
              if (ripple) { const k = t - ripple.t0, da = Math.abs(((an - ripple.a + 9.4248) % 6.2832) - 3.1416), dd = Math.PI - da; boost = clamp(1 - Math.abs(dd - k * 9) / 0.6) * clamp(1 - k / 0.5); }
              if (boost > 0.4) idx = 5;
              const spec = Math.cos(an + 2.3);
              p.dpx(x, y, flashHit ? WHITE : spec > 0.93 ? WATER[5] : WATER[Math.min(5, idx)], 0.55 + 0.4 * b);
            } else {
              const hi = (1 - Math.hypot(nx + 0.4, ny + 0.45)) * 0.3;
              if (nz > 0.66) p.dpx(x, y, WATER[4], 0.5); else p.dpx(x, y, WATER[2], clamp(0.12 + (nz - 0.3) * 0.25 + hi));
            }
          }
          p.glow(C.x, C.y, RAD * 1.7, WATERC, 0.4 * s + (flashHit ? 0.6 : 0)); p.glow(F.x, GY, 14, WATERC, 0.3 * s);
        }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') {
        const w = clamp(t / T_FORM), k = t - T_POP;
        let sy = t < T_FORM ? kf(t, [[0, 1], [T_FORM, 0.84]]) : kf(t, [[T_FORM, 0.84], [T_FORM + 0.12, 1.1], [T_FORM + 0.3, 1]]), sx = t < T_FORM ? kf(t, [[0, 1], [T_FORM, 1.12]]) : kf(t, [[T_FORM, 1.12], [T_FORM + 0.12, 0.92], [T_FORM + 0.3, 1]]), dx = 0;
        if (absorbed) { const q = t - T_HIT; dx = kf(q, [[0, 0], [0.06, -1.5], [0.35, 0]]); }
        if (k > 0) { sy *= kf(k, [[0, 1], [0.1, 1.12], [0.3, 1]]); sx *= kf(k, [[0, 1], [0.1, 0.92], [0.3, 1]]); }
        return act({ sx, sy, dx, tintA: 0.25 * (t < T_FORM ? w : clamp(1 - (t - T_FORM) / 0.4)), tint: [90, 180, 255] });
      }
      const wind = t < T_SHOOT ? (t > T_SHOOT - 0.22 ? kf(t, [[T_SHOOT - 0.22, 0], [T_SHOOT, 1]]) : 0) : kf(t, [[T_SHOOT, 1], [T_SHOOT + 0.06, -0.8], [T_SHOOT + 0.35, 0]]);
      return act({ sy: 1 - 0.18 * wind, sx: 1 + 0.15 * wind, dx: wind > 0 ? 1.5 * wind : 0 });
    },
  };
}

// ───────────── 4 · BROTE (Hoja · apoyo · cura en el tiempo) ─────────────
function brote(ctx) {
  const R = ctx.R, F = ctx.from, A = ctx.to, B = base(ctx), P = B.P;
  const S0 = { x: F.x + F.w * 0.2, y: F.y - F.h * 0.95 }, SP = { x: A.x + A.w * 0.55 + 3, y: GY };
  const T_REL = 0.42, T_FLY = 0.5, T_LAND = T_REL + T_FLY, TICKS = [T_LAND + 0.15, T_LAND + 0.5, T_LAND + 0.85], T_BLOOM = T_LAND + 1.0, T_END = T_LAND + 1.9;
  let orb = null, nA = 0, nB = 0, pulses = [], bloom = false;
  B.S.at(T_REL, () => { B.shake = 0.5; for (let i = 0; i < 6; i++) P.add({ kind: 'sparkle', x: S0.x + R.range(-4, 4), y: S0.y + R.range(-4, 4), vx: R.range(-10, 20), vy: R.range(-20, -5), life: 0.4, len: 1.5 }); });
  B.S.at(T_LAND, () => {
    P.ring({ x: SP.x, y: GY, r0: 1, r1: 14, th: 2, life: 0.4, rp: HEAL, ry: 0.32 });
    for (let i = 0; i < 12; i++) P.add({ kind: 'dust', x: SP.x + R.range(-4, 4), y: GY - 1, vx: R.range(-25, 25), vy: R.range(-14, -3), life: R.range(0.3, 0.5), r0: 1, r1: 3, layer: 'back' });
    for (let i = 0; i < 8; i++) P.add({ kind: 'leaf', x: SP.x, y: GY - 2, vx: R.range(-40, 40), vy: R.range(-70, -25), g: 90, drag: 1.2, life: R.range(0.6, 1), w: 11, len: 1.7 });
  });
  TICKS.forEach((tt, i) => B.S.at(tt, () => {
    pulses.push({ t0: B.t }); B.shake = 0.4;
    P.ring({ x: A.x, y: A.y, r0: 3, r1: 15, th: 2, life: 0.5, rp: HEAL, ry: 0.32 });
    for (let j = 0; j < 7; j++) P.add({ kind: 'sparkle', x: A.x + R.range(-A.w * 0.5, A.w * 0.5), y: A.y - R.range(2, A.h), vx: R.range(-6, 6), vy: R.range(-26, -10), life: R.range(0.5, 0.9), len: 2 });
    P.add({ kind: 'plus', x: A.x, y: A.y - A.h - 2, vx: 0, vy: -14, life: 0.7 });
  }));
  B.S.at(T_BLOOM, () => { bloom = true; for (let i = 0; i < 12; i++) P.add({ kind: 'leaf', x: SP.x + R.range(-3, 3), y: GY - 17, vx: R.range(-26, 26), vy: R.range(-40, -5), g: 28, drag: 0.8, life: R.range(1.0, 1.6), w: 6, len: 1.9, rp: PETAL }); P.ring({ x: SP.x, y: GY - 16, r0: 1, r1: 12, th: 2, life: 0.35, rp: PETAL, ry: 1, layer: 'front' }); });
  const plantH = (t) => { if (t < T_LAND) return 0; const g = eo((t - T_LAND) / 0.55) * 17, d = t > T_END - 0.35 ? clamp((T_END - t) / 0.35) : 1; return g * d; };
  const orbPos = (t) => { const u = clamp((t - T_REL) / T_FLY); return { x: lerp(S0.x, SP.x, u), y: lerp(S0.y, GY - 2, u * u) - Math.sin(Math.PI * u) * 22 }; };
  return {
    dur: 2.9, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t;
      orb = t >= T_REL && t < T_LAND ? orbPos(t) : null;
      if (t < T_REL) { nA -= dt; if (nA <= 0) { nA = 0.045; P.add({ kind: 'leaf', x: F.x + R.range(-F.w * 0.6, F.w * 0.6), y: F.y - R.range(0, 4), vx: R.range(-6, 6), vy: R.range(-34, -16), life: 0.7, w: 9, len: 1.6 }); P.add({ kind: 'sparkle', x: S0.x + R.range(-5, 5), y: S0.y + R.range(-3, 5), vx: 0, vy: -8, life: 0.4, len: 1.2 }); } }
      if (orb) { nB -= dt; if (nB <= 0) { nB = 0.016; P.add({ kind: 'ember', x: orb.x, y: orb.y + R.range(-1, 1), vx: R.range(-10, 10), vy: R.range(0, 14), life: 0.4, rp: HEAL, noglow: true }); if (R.next() < 0.35) P.add({ kind: 'leaf', x: orb.x, y: orb.y, vx: R.range(-20, 0), vy: R.range(0, 20), g: 60, life: 0.5, w: 12, len: 1.4 }); } }
      if (t > T_LAND + 0.3 && t < T_END - 0.4) { nA -= dt; if (nA <= 0) { nA = 0.11; P.add({ kind: 'sparkle', x: SP.x + R.range(-6, 6), y: GY - R.range(2, 16), vx: R.range(-4, 4), vy: R.range(-14, -6), life: 0.6, len: 1.5 }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; p.glow(S0.x, S0.y, 10 + 10 * u, HEALC, 0.5 * u); p.disc(S0.x, S0.y, 0.6 + 1.9 * u, HEAL[3]); }
        if (orb) { p.disc(orb.x, orb.y, 3, HEAL[1]); p.disc(orb.x, orb.y, 2, HEAL[2]); p.disc(orb.x - 0.3, orb.y - 0.3, 1.1, HEAL[4]); p.glow(orb.x, orb.y, 13, HEALC, 0.7); p.glow(orb.x, GY, 8, HEALC, 0.25); }
        const h = plantH(t);
        if (h > 0.5) {
          const sway = Math.sin(t * 3) * 0.8 * (h / 17), n = Math.ceil(h);
          for (let i = 0; i <= n; i++) { const f = i / 17, x = SP.x + Math.sin(f * 2.2) * 1.8 + sway * f, y = GY - i, w = i < 4 ? 1 : 0; p.px(x, y, LEAF[2]); if (w) p.px(x + 1, y, LEAF[1]); p.px(x - 1, y, LEAF[3]); }
          const sx0 = (f) => SP.x + Math.sin(f * 2.2) * 1.8 + sway * f;
          if (h > 6) { const g = clamp((h - 6) / 6); leaf(p, sx0(0.35) + 3.2 * g, GY - 6 - 0.5, 3.8 * g + 0.5, 1.7 * g + 0.3, -0.45); }
          if (h > 10) { const g = clamp((h - 10) / 5); leaf(p, sx0(0.55) - 3.4 * g, GY - 10, 3.8 * g + 0.5, 1.7 * g + 0.3, Math.PI + 0.45); }
          const tx = sx0(h / 17), ty = GY - h;
          if (h > 14) { if (!bloom) { p.disc(tx, ty - 1, 1.6, LEAF[3]); p.px(tx, ty - 2, LEAF[5]); } else { const bt = clamp((t - T_BLOOM) / 0.35), pr = 2 + 2.2 * eback(bt); for (let i = 0; i < 5; i++) { const a = -1.57 + i * 1.2566; leaf(p, tx + Math.cos(a) * pr * 0.7, ty - 1 + Math.sin(a) * pr * 0.7, pr * 0.8, pr * 0.5, a, PETAL); } p.disc(tx, ty - 1, 1.3, hex2('#ffe27a')); p.glow(tx, ty - 1, 16, [255, 190, 210], 0.55 * bt); } }
          p.glow(SP.x, GY - h * 0.5, 10, HEALC, 0.2 * clamp(h / 8));
        }
        for (const pu of pulses) { const k = (t - pu.t0) / 0.5; if (k < 1) { p.glow(A.x, A.y - A.h * 0.5, 17, HEALC, 0.45 * (1 - k)); } }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') {
        const r = t - T_REL;
        return act(t < T_REL ? { sy: kf(t, [[0, 1], [T_REL, 1.12]]), sx: kf(t, [[0, 1], [T_REL, 0.92]]), dy: -1 * smooth(t / T_REL), tintA: 0.3 * (t / T_REL), tint: [140, 255, 150] } : { sy: kf(r, [[0, 1.12], [0.07, 0.86], [0.35, 1]]), sx: kf(r, [[0, 0.92], [0.07, 1.12], [0.35, 1]]), tintA: 0.25 * clamp(1 - r / 0.3), tint: [140, 255, 150] });
      }
      let s = 0, ta = 0, bob = 0;
      for (const pu of pulses) { const k = (t - pu.t0) / 0.5; if (k >= 0 && k < 1) { s = Math.max(s, Math.sin(k * Math.PI)); ta = Math.max(ta, 0.5 * (1 - k)); bob = Math.max(bob, Math.sin(clamp(k * 1.6) * Math.PI)); } }
      return act({ sy: 1 + 0.1 * bob, sx: 1 - 0.06 * bob, dy: -2 * bob, tintA: ta, tint: [150, 255, 160], flash: 0.18 * s });
    },
  };
}
// '+' que sube al curar
const _pd = Particles.prototype.draw;
Particles.prototype.draw = function (p, layer) {
  _pd.call(this, p, layer);
  for (const q of this.a) if (q.kind === 'plus' && q.layer === layer) { const k = q.age / q.life, c = HEAL[Math.min(4, 2 + Math.floor((1 - k) * 2.5))]; const a = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1; p.dpx(q.x, q.y, c, a); p.dpx(q.x - 1, q.y, c, a); p.dpx(q.x + 1, q.y, c, a); p.dpx(q.x, q.y - 1, c, a); p.dpx(q.x, q.y + 1, c, a); p.dpx(q.x - 2, q.y, c, a); p.dpx(q.x + 2, q.y, c, a); p.dpx(q.x, q.y - 2, c, a); p.dpx(q.x, q.y + 2, c, a); p.glow(q.x, q.y, 8, [140, 255, 150], 0.4 * a); }
};

const MOVES = [
  { id: 'llamarada', nombre: 'Fogonazo', el: 'Fuego', col: '#f0603e', tipo: 'Básico · proyectil', caster: 'fosforin', target: 'aguacato', make: llamarada, fases: ['Carga (la brasa se concentra)', 'Disparo con retroceso', 'Trayecto con estela', 'Impacto: parada, destello, onda y chispas', 'Quemado y mancha en el suelo'], uso: 'Lo lanza la criatura sola, muy a menudo.' },
  { id: 'salto', nombre: 'Pisotón solar', el: 'Fuego', col: '#f0603e', tipo: 'Habilidad · onda en línea', caster: 'fosforin', target: 'aguacato', make: saltoFuego, fases: ['Agacharse y encenderse', 'Salto en su sitio envuelto en llamas, con estela', 'Aterrizaje: parada y temblor', 'La onda de fuego recorre el suelo con columnas', 'Alcanza al rival: impacto y quemado'], uso: 'La criatura sola, cuando termina su enfriamiento.' },
  { id: 'escudo', nombre: 'Muro acuático', el: 'Agua', col: '#3f9bd6', tipo: 'Defensa · propia', caster: 'pompon', target: 'aguacato', make: escudoAgua, fases: ['Las gotas se reúnen', 'La burbuja se forma', 'Absorbe un golpe: onda por la superficie', 'Estalla en gotas y salpicaduras'], uso: 'Ocupa el hueco de defensa; la criatura lo usa al verse atacada.' },
  { id: 'brote', nombre: 'Savia vital', el: 'Hoja', col: '#5dae5a', tipo: 'Apoyo · cura en el tiempo', caster: 'aguacato', target: 'pompon', make: brote, fases: ['Concentra luz verde', 'Lanza la semilla en arco', 'Brota una planta junto a la aliada', 'Tres pulsos de curación', 'Florece y se disuelve en pétalos'], uso: 'Ocupa el hueco de apoyo; cura a una aliada herida.' },
];
