// ═════════ LOTE AGUA (resto de movimientos) ═════════
const WATERC2 = [90, 180, 255];
const wetTint = (k) => ({ tint: [90, 170, 255], tintA: 0.2 * clamp(k) });
// salpicadura de gotas con gravedad (al caer al suelo hacen anillo)
function splash(P, R, x, y, n, sp0, sp1, o = {}) { for (let i = 0; i < n; i++) { const a = R.range(o.a0 !== undefined ? o.a0 : -2.9, o.a1 !== undefined ? o.a1 : -0.25), sp = R.range(sp0, sp1); P.add({ kind: 'drop', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), g: 270, life: R.range(0.5, 1.0), splash: o.ground !== false, big: R.next() < 0.3, layer: o.layer || 'front' }); } }
// cresta de ola que avanza por el suelo (frente en wx, altura H)
function waveDraw(p, wx, H, t, L = 26) {
  for (let x = Math.floor(wx - L); x <= Math.ceil(wx + 4); x++) {
    const d = x - wx; let h = d < -2 ? H * Math.pow(smooth((d + L) / (L - 2)), 0.9) : H * Math.pow(clamp(1 - (d + 2) / 6), 0.5);
    h += Math.sin(x * 0.5 - t * 14) * 0.8 * (h / H); if (h < 1) continue;
    const curl = Math.pow(h / H, 3) * 3.5, top = GY - h;
    for (let y = Math.floor(top); y <= GY; y++) {
      const dep = y - top, xs = Math.round(x + curl * Math.pow(clamp(1 - dep / Math.max(1, h)), 2));
      let idx = dep < 1.4 ? 5 : dep < 3 ? 4 : 3 - Math.floor(clamp(dep / h) * 2.4);
      if (h2(x >> 1, y + Math.floor(t * 10), 3) > 0.93 && dep > 2) idx = Math.min(5, idx + 1);
      if (y === GY) idx = 1;
      const c = WATER[Math.max(0, Math.min(5, idx))]; p.px(xs, y, c); if (curl > 1 && dep < h * 0.7) p.px(xs - 1, y, c);
    }
  }
}
// burbuja translúcida (como el escudo)
function bubbleFx(p, C, rx, ry, t, boost = 0) {
  for (let y = Math.floor(C.y - ry - 1); y <= Math.ceil(C.y + ry + 1); y++) for (let x = Math.floor(C.x - rx - 1); x <= Math.ceil(C.x + rx + 1); x++) {
    const nx = (x + 0.5 - C.x) / rx, ny = (y + 0.5 - C.y) / ry, an = Math.atan2(ny, nx), d = Math.hypot(nx, ny) * (1 + 0.035 * Math.sin(an * 3 + t * 6)); if (d > 1) continue;
    const nz = fbm(x * 0.2 + t * 0.9, y * 0.2 - t * 0.5, 3);
    if (d > 0.8) { const b = (d - 0.8) / 0.2, spec = Math.cos(an + 2.3); p.dpx(x, y, boost > 0.5 ? WHITE : spec > 0.93 ? WATER[5] : WATER[Math.min(5, 2 + Math.floor(b * 3.2))], 0.55 + 0.4 * b); }
    else { const hi = (1 - Math.hypot(nx + 0.4, ny + 0.45)) * 0.3; if (nz > 0.66) p.dpx(x, y, WATER[4], 0.5); else p.dpx(x, y, WATER[2], clamp(0.12 + (nz - 0.3) * 0.25 + hi)); }
  }
}
// chorro: haz ondulante desde (x0,y0) hasta la punta; grosor th
function jet(p, x0, y0, x1, y1, tipF, th, t, core) {
  const n = Math.max(1, Math.round(Math.abs(x1 - x0))), end = Math.round(n * tipF);
  for (let i = 0; i <= end; i++) {
    const f = i / n, x = lerp(x0, x1, f), y = lerp(y0, y1, f) + Math.sin(i * 0.45 - t * 32) * 0.7 * Math.min(1, f * 4), w = th * (0.8 + 0.2 * Math.sin(i * 0.3 - t * 20));
    for (let k = -Math.floor(w / 2); k <= Math.floor(w / 2); k++) { const e = Math.abs(k) / (w / 2 + 0.01); let idx = e > 0.75 ? 2 : e > 0.4 ? 3 : 4; if (k === -Math.floor(w / 2)) idx = 5; if (h2(i >> 1, k + Math.floor(t * 30), 8) > 0.9) idx = Math.min(5, idx + 1); if (core && e < 0.3) idx = 5; p.px(x, y + k, WATER[idx]); }
  }
}

// ───────────── Chorro (Agua · básico · haz) ─────────────
function chorro(ctx, cfg = {}) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P, TH = cfg.th || 4, T_W = cfg.w || 0.3, T_S = T_W + (cfg.grow || 0.12), T_E = T_S + (cfg.hold || 0.6), T_R = T_E + 0.18;
  const M = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.42 }, I = { x: T.x - T.w * 0.4, y: T.y - T.h * 0.5 }, push = cfg.push || 0;
  let hits = [], nS = 0, nD = 0;
  const tip = (t) => (t < T_W ? 0 : clamp((t - T_W) / (T_S - T_W))), tail = (t) => (t > T_E ? clamp((t - T_E) / (T_R - T_E)) : 0);
  B.S.at(T_W, () => { B.shake = cfg.shake ? 1.5 : 0.6; splash(P, R, M.x, M.y, 8, 40, 120, { a0: -1.2, a1: 0.8, ground: false }); });
  B.S.at(T_S, () => { B.stop = cfg.stop || 0.05; B.shake = cfg.shake || 2; hits.push(B.t); P.ring({ x: I.x, y: I.y, r0: 1, r1: cfg.big ? 18 : 12, th: 2, life: 0.22, rp: WATER, ry: 1, layer: 'front' }); });
  (cfg.pulses || [0.18, 0.36]).forEach((d) => B.S.at(T_S + d, () => { hits.push(B.t); B.shake = Math.max(B.shake, 1.2); }));
  const pushX = (t) => (push ? push * eo((t - T_S) / 0.35) * (t < T_E ? 1 : 1 - eo((t - T_E) / 0.5)) : 0);
  return {
    dur: cfg.dur || 2.2, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t;
      if (t > T_S && t < T_E + 0.1) { nS -= dt; if (nS <= 0) { nS = cfg.big ? 0.02 : 0.035; const ix = I.x + pushX(t); splash(P, R, ix, I.y + R.range(-3, 4), cfg.big ? 3 : 2, 50, cfg.big ? 190 : 130, { a0: -2.8, a1: -0.3, up: 20 }); if (R.next() < 0.5) P.add({ kind: 'smoke', x: ix, y: I.y, vx: R.range(-10, 10), vy: R.range(-16, -6), life: 0.4, r0: 1.5, r1: 4, a0: 0.3, layer: 'back' }); } }
      if (t > T_W && t < T_E) { nD -= dt; if (nD <= 0) { nD = 0.03; const f = R.next() * tip(t); P.add({ kind: 'drop', x: lerp(M.x, I.x, f), y: lerp(M.y, I.y, f) + R.range(-3, 3), vx: R.range(-10, 30), vy: R.range(-30, 10), g: 200, life: 0.5, splash: true }); } }
      if (t > T_E && t < T_E + 1.6) { nD -= dt; if (nD <= 0) { nD = 0.16; P.add({ kind: 'drop', x: T.x + pushX(t) + R.range(-T.w * 0.3, T.w * 0.3), y: T.y - R.range(2, T.h * 0.8), vx: 0, vy: 0, g: 230, life: 0.6, splash: true }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back' && t > T_S) { const a = clamp(1 - (t - T_S - 0.8) / 1.2); for (let x = -12; x <= 12; x++) for (let y = -2; y <= 2; y++) if ((x / 12) ** 2 + (y / 2.4) ** 2 < 1) p.dark(T.x + pushX(t) + x, GY + y, 0.35 * a); }
      if (layer === 'front') {
        if (t < T_W) { const u = t / T_W; p.disc(M.x, M.y, 1 + 2 * u, WATER[3]); p.disc(M.x, M.y, 0.8 * u, WATER[5]); p.glow(M.x, M.y, 8 + 6 * u, WATERC2, 0.4 * u); }
        if (t >= T_W && t < T_R) {
          const x0 = lerp(M.x, I.x, tail(t)), y0 = lerp(M.y, I.y, tail(t)); jet(p, x0, y0, I.x, I.y, tip(t), TH, t, cfg.core);
          p.glow(lerp(x0, I.x, 0.5 * tip(t)), lerp(y0, I.y, 0.5 * tip(t)), 18, WATERC2, 0.3); if (t > T_S) p.glow(I.x + pushX(t), I.y, 16, WATERC2, 0.55 * (1 - tail(t)));
        }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const w = clamp(t / T_W), r = t - T_W; return act({ sy: t < T_W ? kf(t, [[0, 1], [T_W, 0.84]]) : kf(r, [[0, 0.84], [0.06, 1.1], [0.4, 1]]), sx: t < T_W ? kf(t, [[0, 1], [T_W, 1.14]]) : kf(r, [[0, 1.14], [0.06, 0.92], [0.4, 1]]), dx: t > T_W && t < T_E ? -1 : 0, tintA: 0.25 * w * (t < T_E ? 1 : 0), tint: WATERC2 }); }
      if (!hits.length) return act({});
      const f = evalHits(hits, t, 0.1), k = t - hits[0];
      return act({ dx: pushX(t) + (t < T_E ? 0.8 * Math.sin(t * 80) : 0), sy: 1 - 0.07 * f, sx: 1 + 0.07 * f, flash: 0.8 * f, ...wetTint(k < 1.6 ? 1 : clamp(1 - (k - 1.6) / 0.6)) });
    },
  };
}

// ───────────── Salpicón (Agua · básico · proyectil corto) ─────────────
function salpicon(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.45 }, I = { x: T.x - T.w * 0.3, y: T.y - T.h * 0.5 };
  const T_W = 0.3, T_FLY = 0.38, T_HIT = T_W + T_FLY; let ball = null, hit = false, nT = 0;
  B.S.at(T_W, () => { B.shake = 0.6; splash(P, R, M.x, M.y, 8, 40, 110, { a0: -1, a1: 0.7, ground: false }); });
  B.S.at(T_HIT, () => { hit = true; B.stop = 0.07; B.shake = 2.6; splash(P, R, I.x, I.y, 26, 50, 170, { up: 30 }); P.ring({ x: I.x, y: I.y, r0: 1, r1: 14, th: 2.2, life: 0.22, rp: WATER, ry: 1, layer: 'front' }); P.ring({ x: T.x, y: T.y, r0: 1, r1: 14, th: 2, life: 0.4, rp: WATER, ry: 0.3 }); for (let i = 0; i < 6; i++) P.add({ kind: 'smoke', x: I.x + R.range(-4, 4), y: I.y + R.range(-4, 4), vx: R.range(-12, 12), vy: R.range(-20, -8), life: 0.5, r0: 2, r1: 5, a0: 0.3, layer: 'back' }); });
  const pos = (t) => { const u = clamp((t - T_W) / T_FLY); return { x: lerp(M.x, I.x, u), y: lerp(M.y, I.y, u) - Math.sin(Math.PI * u) * 11, u }; };
  return {
    dur: 2.1, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t; ball = t >= T_W && t < T_HIT ? pos(t) : null;
      if (ball) { nT -= dt; if (nT <= 0) { nT = 0.018; P.add({ kind: 'drop', x: ball.x - 2, y: ball.y + R.range(-2, 2), vx: R.range(-30, 0), vy: R.range(-10, 30), g: 200, life: 0.4, splash: true }); } }
      if (hit && t < T_HIT + 1.3) { nT -= dt; if (nT <= 0) { nT = 0.13; P.add({ kind: 'drop', x: T.x + R.range(-T.w * 0.3, T.w * 0.3), y: T.y - R.range(2, T.h * 0.8), vx: 0, vy: 0, g: 230, life: 0.6, splash: true }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_W) { const u = t / T_W, r = 1 + 2.6 * eo(u); p.disc(M.x, M.y, r, WATER[3]); p.disc(M.x - 0.5, M.y - 0.5, r * 0.5, WATER[5]); p.glow(M.x, M.y, 8, WATERC2, 0.35 * u); }
        if (ball) { const w = 1 + 0.12 * Math.sin(t * 40), r = 3.3; p.disc(ball.x, ball.y, r * w, WATER[2], 1, r / w); p.disc(ball.x, ball.y + 0.3, r * 0.75, WATER[3], 1, r * 0.7); p.disc(ball.x - 1, ball.y - 1.2, 1.2, WATER[5]); p.glow(ball.x, ball.y, 11, WATERC2, 0.5); }
        if (hit && t - T_HIT < 0.2) p.glow(I.x, I.y, 20, WATERC2, 0.7 * (1 - (t - T_HIT) / 0.2));
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_W; return act(t < T_W ? { sy: kf(t, [[0, 1], [T_W, 0.82]]), sx: kf(t, [[0, 1], [T_W, 1.15]]), dx: -1.5 * smooth(t / T_W), tintA: 0.2 * (t / T_W), tint: WATERC2 } : { sy: kf(r, [[0, 0.82], [0.06, 1.14], [0.3, 1]]), sx: kf(r, [[0, 1.15], [0.06, 0.88], [0.3, 1]]), dx: kf(r, [[0, -1.5], [0.06, 2.5], [0.35, 0]]) }); }
      const k = t - T_HIT; if (k < 0) return act({});
      return act({ dx: kf(k, [[0, 0], [0.07, 3.2], [0.4, 0]]), sy: kf(k, [[0, 1], [0.05, 0.8], [0.16, 1.08], [0.4, 1]]), sx: kf(k, [[0, 1], [0.05, 1.16], [0.16, 0.94], [0.4, 1]]), flash: clamp(1 - k / 0.12), ...wetTint(k < 1.3 ? 1 : clamp(1 - (k - 1.3) / 0.5)) });
    },
  };
}

// ───────────── Ola (Agua · habilidad · área, empuja) ─────────────
function ola(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P, SPD = 95, X0 = F.x + F.w * 0.4, H = 13;
  const T_W = 0.38, T_S = T_W + 0.1, hitT = T_S + (T.x - T.w * 0.4 - X0) / SPD; let hit = false, nF = 0;
  B.S.at(T_W, () => { B.shake = 1.5; P.ring({ x: F.x, y: GY, r0: 2, r1: 16, th: 2, life: 0.4, rp: WATER, ry: 0.3 }); splash(P, R, F.x + 6, GY - 3, 10, 40, 120, { a0: -1.4, a1: -0.2 }); });
  B.S.at(hitT, () => { hit = true; B.stop = 0.1; B.shake = 4.4; splash(P, R, T.x - 4, GY - 8, 34, 60, 200, { a0: -2.6, a1: -0.4, up: 50 }); P.ring({ x: T.x, y: GY, r0: 2, r1: 26, th: 3, life: 0.5, rp: WATER, ry: 0.3 }); for (let i = 0; i < 8; i++) P.add({ kind: 'smoke', x: T.x + R.range(-8, 8), y: GY - R.range(2, 12), vx: R.range(-14, 14), vy: R.range(-22, -8), life: 0.7, r0: 2, r1: 7, a0: 0.35, layer: 'back' }); });
  const wx = (t) => (t < T_S ? -99 : X0 + SPD * (t - T_S)), push = (t) => (hit ? 11 * eo((t - hitT) / 0.4) * (1 - 0.82 * smooth((t - hitT - 0.6) / 0.7)) : 0);
  return {
    dur: 3.0, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t, x = wx(t);
      if (t >= T_S && x < T.x + 6) { nF -= dt; if (nF <= 0) { nF = 0.02; P.add({ kind: 'drop', x: x + 2, y: GY - H * R.range(0.5, 1), vx: R.range(10, 50), vy: R.range(-60, -10), g: 220, life: 0.5, splash: true }); P.add({ kind: 'smoke', x: x + 3, y: GY - H * 0.9, vx: 10, vy: -8, life: 0.4, r0: 1.5, r1: 4, a0: 0.45, layer: 'front' }); } }
      if (hit && t < hitT + 0.9) { nF -= dt; if (nF <= 0) { nF = 0.03; splash(P, R, T.x + push(t) + R.range(-6, 6), GY - R.range(0, 8), 2, 30, 110, { up: 20 }); } }
    },
    draw(p, layer) {
      const t = B.t, x = wx(t);
      if (layer === 'back') { if (hit) { const a = clamp(1 - (t - hitT - 0.8) / 1.4); for (let xx = -44; xx <= 20; xx++) for (let y = -2; y <= 2; y++) if (Math.abs(y) < 2.6 * (1 - Math.abs(xx + 12) / 36)) p.dark(T.x + xx, GY + y, 0.4 * a); } }
      if (layer === 'front') {
        if (t >= T_S && x < T.x + 30) { const grow = Math.min(1, (t - T_S) / 0.25), HH = H * grow * (x > T.x - 4 ? clamp(1 - (x - T.x + 4) / 28) : 1); if (HH > 1) { waveDraw(p, x, HH, t); p.glow(x, GY - HH * 0.5, 22, WATERC2, 0.35); } }
        if (hit && t - hitT < 0.25) p.glow(T.x, GY - 6, 28, WATERC2, 0.7 * (1 - (t - hitT) / 0.25));
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_W; return act(t < T_W ? { sy: kf(t, [[0, 1], [T_W - 0.08, 1.14], [T_W, 0.78]]), sx: kf(t, [[0, 1], [T_W - 0.08, 0.92], [T_W, 1.2]]), dy: -1.5 * smooth(t / (T_W - 0.08)), tintA: 0.25 * (t / T_W), tint: WATERC2 } : { sy: kf(r, [[0, 0.78], [0.3, 1]]), sx: kf(r, [[0, 1.2], [0.3, 1]]), tintA: 0.2 * clamp(1 - r / 0.4), tint: WATERC2 }); }
      const k = t - hitT; if (k < 0) return act({});
      return act({ dx: push(t), dy: -3 * Math.sin(clamp(k / 0.5) * Math.PI), sy: kf(k, [[0, 1], [0.05, 0.8], [0.2, 1.1], [0.5, 1]]), sx: kf(k, [[0, 1], [0.05, 1.16], [0.2, 0.94], [0.5, 1]]), flash: clamp(1 - k / 0.12) * 0.8, ...wetTint(k < 1.8 ? 1 : clamp(1 - (k - 1.8) / 0.6)) });
    },
  };
}

// ───────────── Burbuja (Agua · habilidad · atrapa y ralentiza) ─────────────
function burbuja(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.55 }, TC = { x: T.x, y: T.y - T.h * 0.5 }, BR = Math.max(T.w, T.h) * 0.78;
  const T_W = 0.3, T_FLY = 0.55, T_HIT = T_W + T_FLY, T_POP = T_HIT + 1.55; let ball = null, trapped = false, popped = false, nT = 0;
  B.S.at(T_W, () => { B.shake = 0.5; for (let i = 0; i < 6; i++) P.add({ kind: 'drop', x: M.x, y: M.y, vx: R.range(20, 70), vy: R.range(-40, -5), g: 120, life: 0.5, big: true }); });
  B.S.at(T_HIT, () => { trapped = true; B.stop = 0.06; B.shake = 1.5; splash(P, R, TC.x - BR, TC.y, 12, 30, 90, { a0: -3, a1: -0.1, ground: false }); P.ring({ x: T.x, y: GY, r0: 2, r1: 14, th: 2, life: 0.4, rp: WATER, ry: 0.3 }); });
  B.S.at(T_POP, () => { popped = true; B.shake = 1.5; for (let i = 0; i < 34; i++) { const a = R.range(0, 6.28), sp = R.range(30, 100); P.add({ kind: 'drop', x: TC.x + Math.cos(a) * BR * 0.9, y: TC.y + Math.sin(a) * BR, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, g: 260, life: 1, splash: true, big: R.next() < 0.3 }); } for (let i = 0; i < 3; i++) P.ring({ x: T.x, y: GY, r0: 2, r1: 10 + i * 6, th: 1.5, life: 0.5 + i * 0.1, rp: WATER, ry: 0.32 }); });
  const lift = (t) => (trapped && !popped ? -5 * eo((t - T_HIT) / 0.4) + Math.sin((t - T_HIT) * 2.6) * 1.2 : popped ? kf(t - T_POP, [[0, -5], [0.4, 0]]) : 0);
  const bpos = (t) => { const u = clamp((t - T_W) / T_FLY); return { x: lerp(M.x, TC.x, u), y: lerp(M.y, TC.y, u) - Math.sin(Math.PI * u) * 14, r: lerp(2.4, 4.6, eo(u)) }; };
  return {
    dur: 3.2, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t; ball = t >= T_W && t < T_HIT ? bpos(t) : null;
      if (ball) { nT -= dt; if (nT <= 0) { nT = 0.03; P.add({ kind: 'sparkle', x: ball.x, y: ball.y + R.range(-2, 2), vx: 0, vy: 0, life: 0.3, len: 1, rp: WATER, gc: [140, 210, 255] }); } }
      if (trapped && !popped) { nT -= dt; if (nT <= 0) { nT = 0.1; P.add({ kind: 'drop', x: TC.x + R.range(-BR * 0.6, BR * 0.6), y: TC.y + BR * 0.8, vx: 0, vy: -26, g: -10, life: 0.8 }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_W) { const u = t / T_W; p.disc(M.x, M.y, 0.8 + 1.8 * u, WATER[3], 0.8); p.glow(M.x, M.y, 7, WATERC2, 0.3 * u); }
        if (ball) { const w = 1 + 0.1 * Math.sin(t * 22); bubbleFx(p, ball, ball.r * w, ball.r / w, t); p.glow(ball.x, ball.y, ball.r * 3, WATERC2, 0.4); }
        if (trapped && !popped) { const k = t - T_HIT, g = eback(k / 0.3), flash = k < 0.07; bubbleFx(p, { x: TC.x, y: TC.y + lift(t) }, BR * g, BR * 1.06 * g, t, flash ? 1 : 0); p.glow(TC.x, TC.y + lift(t), BR * 1.8, WATERC2, 0.4 * g); }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_W; return act(t < T_W ? { sy: kf(t, [[0, 1], [T_W, 0.84]]), sx: kf(t, [[0, 1], [T_W, 1.14]]), tintA: 0.2 * (t / T_W), tint: WATERC2 } : { sy: kf(r, [[0, 0.84], [0.06, 1.1], [0.35, 1]]), sx: kf(r, [[0, 1.14], [0.06, 0.92], [0.35, 1]]) }); }
      if (!trapped) return act({});
      const k = t - T_HIT, sl = popped ? 0 : 1;
      return act({ dy: lift(t), sy: popped ? kf(t - T_POP, [[0, 1], [0.1, 0.82], [0.3, 1.06], [0.5, 1]]) : 1 + 0.03 * Math.sin(k * 2.6), sx: popped ? kf(t - T_POP, [[0, 1], [0.1, 1.14], [0.3, 0.96], [0.5, 1]]) : 1, flash: clamp(1 - k / 0.1) * 0.6, tint: WATERC2, tintA: sl * 0.3 + (popped ? 0.15 * clamp(1 - (t - T_POP) / 0.6) : 0) });
    },
  };
}

// ───────────── Marea (Agua · especial · el agua sube sobre la zona del rival) ─────────────
function marea(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const XL = T.x - 38, T_REL = 0.95, T_UP = T_REL + 1.1, T_HOLD = T_UP + 0.8, T_DOWN = T_HOLD + 0.7, TOP = GY - 15, BOT = H + 2;
  const lvl = (t) => (t < T_REL ? BOT : t < T_UP ? lerp(BOT, TOP, eo((t - T_REL) / 1.1)) : t < T_HOLD ? TOP + Math.sin((t - T_UP) * 3) * 0.8 : t < T_DOWN ? lerp(TOP, BOT, ei((t - T_HOLD) / 0.7)) : BOT);
  let hitT = T_UP; for (let t = T_REL; t < T_UP; t += 0.005) if (lvl(t) <= GY - 6) { hitT = t; break; }
  let nB = 0, up = false, down = false;
  for (let t = 0.15; t < T_REL; t += 0.3) B.S.at(t, () => { P.ring({ x: T.x, y: GY, r0: 3, r1: 24, th: 2, life: 0.7, rp: WATER, ry: 0.3 }); });
  B.S.at(T_REL, () => { B.shake = 1.5; for (let i = 0; i < 14; i++) P.add({ kind: 'sparkle', x: F.x + R.range(-5, 5), y: F.y - R.range(F.h, F.h + 8), vx: R.range(-10, 10), vy: R.range(-30, -5), life: 0.6, len: 1.8, rp: WATER, gc: [140, 210, 255] }); });
  B.S.at(hitT, () => { up = true; B.stop = 0.1; B.shake = 3.2; splash(P, R, T.x, GY - 6, 24, 40, 140, { a0: -2.7, a1: -0.4, up: 40 }); P.ring({ x: T.x, y: GY, r0: 2, r1: 28, th: 3, life: 0.5, rp: WATER, ry: 0.3 }); });
  B.S.at(T_HOLD, () => { down = true; B.shake = 2; for (let i = 0; i < 36; i++) P.add({ kind: 'drop', x: R.range(XL + 8, 124), y: TOP + R.range(-1, 3), vx: R.range(60, 150), vy: R.range(-70, -10), g: 250, life: 0.9, splash: true, big: R.next() < 0.3 }); });
  B.S.at(T_DOWN, () => { B.stop = 0.1; B.shake = 4.4; splash(P, R, T.x + 14, GY - 4, 40, 60, 200, { a0: -2.7, a1: -0.4, up: 50 }); for (let i = 0; i < 3; i++) P.ring({ x: T.x + 14, y: GY, r0: 2, r1: 12 + i * 8, th: 2.5, life: 0.5 + i * 0.12, rp: WATER, ry: 0.3 }); for (let i = 0; i < 8; i++) P.add({ kind: 'smoke', x: T.x + 14 + R.range(-8, 8), y: GY - R.range(2, 10), vx: R.range(-14, 14), vy: R.range(-22, -8), life: 0.7, r0: 2, r1: 7, a0: 0.35, layer: 'back' }); });
  const dxT = (t) => (t < T_HOLD ? 0 : t < T_DOWN ? 14 * smooth((t - T_HOLD) / 0.7) : 14 * (1 - smooth((t - T_DOWN) / 0.5)));
  const dyT = (t) => (t < hitT ? 0 : t < T_HOLD ? -9 * eo((t - hitT) / 0.6) + Math.sin(t * 2.4) * 1.2 : t < T_DOWN ? -9 * (1 - ei((t - T_HOLD) / 0.7)) : 0);
  return {
    dur: 4.6, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t;
      if (t > T_REL + 0.3 && t < T_HOLD + 0.3) { nB -= dt; if (nB <= 0) { nB = 0.05; const sf = lvl(t); P.add({ kind: 'bub', x: R.range(XL + 8, 124), y: Math.min(78, sf + R.range(6, 22)), vx: 0, vy: -R.range(14, 26), life: 0.6, r: R.range(1, 2.2) }); } }
      if (t < T_REL) { nB -= dt; if (nB <= 0) { nB = 0.06; P.add({ kind: 'drop', x: F.x + R.range(-8, 8), y: F.y - R.range(0, 4), vx: R.range(-4, 4), vy: R.range(-50, -20), g: 90, life: 0.6 }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') { if (t > 0.3) { const a = clamp((t - 0.3) / 0.6) * (t > T_DOWN + 0.5 ? clamp(1 - (t - T_DOWN - 0.5) / 1.5) : 1); for (let x = -22; x <= 22; x++) for (let y = -4; y <= 4; y++) if ((x / 22) ** 2 + (y / 4) ** 2 < 1) p.dark(T.x + x, GY + y, 0.4 * a); } }
      if (layer === 'front') {
        const sky = clamp((t - 0.2) / 0.8) * (t < T_DOWN ? 1 : clamp(1 - (t - T_DOWN) / 0.8)); p.glow(T.x - 6, 3, 66, [80, 150, 255], 0.3 * sky);
        const sf = lvl(t);
        if (sf < H) for (let y = Math.max(0, Math.floor(sf)); y < H; y++) for (let x = Math.max(0, XL - 6); x < W; x++) {
          const ea = clamp((x - XL) / 12); if (ea <= 0) continue; const d = y - sf, wob = Math.sin(x * 0.45 + t * 5) * 0.8; if (d < wob) continue;
          if (d < wob + 1.5) { p.dpx(x, y, WATER[5], ea); continue; } if (d < wob + 3) { p.dpx(x, y, WATER[4], 0.8 * ea); continue; }
          const caus = fbm(x * 0.17 + t * 0.6, y * 0.26 - t * 0.4, 7) > 0.66;
          if (caus) p.dpx(x, y, WATER[4], 0.5 * ea); else p.dpx(x, y, d > 14 ? WATER[1] : WATER[2], (0.34 + 0.2 * clamp(d / 12)) * ea);
        }
        if (sf < H - 2) p.glow(T.x, Math.max(0, sf), 30, WATERC2, 0.3);
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sy: kf(t, [[0, 1], [0.5, 0.82], [T_REL, 1.2]]), sx: kf(t, [[0, 1], [0.5, 1.15], [T_REL, 0.88]]), dy: -2 * smooth((t - 0.5) / 0.5), tintA: 0.35 * clamp(t / T_REL), tint: WATERC2 } : { sy: kf(r, [[0, 1.2], [0.08, 0.88], [0.4, 1]]), sx: kf(r, [[0, 0.88], [0.08, 1.12], [0.4, 1]]), tintA: 0.3 * clamp(1 - r / 0.5), tint: WATERC2 }); }
      if (t < hitT) return act({});
      const k = t - T_DOWN, sw = Math.sin(t * 2.2) * 0.05, wet = t < T_DOWN + 1.0 ? 1 : clamp(1 - (t - T_DOWN - 1.0) / 0.8);
      return act({ dx: dxT(t), dy: dyT(t), sx: (k > 0 ? kf(k, [[0, 1.25], [0.1, 1.25], [0.3, 0.94], [0.5, 1]]) : 1 + sw), sy: (k > 0 ? kf(k, [[0, 0.74], [0.1, 0.74], [0.3, 1.1], [0.5, 1]]) : 1 - sw), flash: (t - hitT < 0.1 ? 0.7 * (1 - (t - hitT) / 0.1) : 0) + (k > 0 && k < 0.12 ? 0.8 * (1 - k / 0.12) : 0), tint: [90, 170, 255], tintA: 0.34 * wet });
    },
  };
}
// burbuja pequeña que sube (para Marea)
const _pd3 = Particles.prototype.draw;
Particles.prototype.draw = function (p, layer) {
  _pd3.call(this, p, layer);
  for (const q of this.a) if (q.kind === 'bub' && q.layer === layer) { const a = 1 - clamp((q.age / q.life - 0.7) / 0.3), x = q.x + Math.sin(q.age * 9 + q.seed) * 1.2, y = q.y; if (q.r > 1.6) { p.dpx(x - 1, y, WATER[5], a); p.dpx(x + 1, y, WATER[4], a); p.dpx(x, y - 1, WATER[5], a); p.dpx(x, y + 1, WATER[4], a); } else { p.dpx(x, y, WATER[5], a); p.dpx(x + 1, y, WATER[4], a); } }
};

// ───────────── Torrente (Agua · especial · haz largo, arrastra) ─────────────
const torrente = (ctx) => chorro(ctx, { th: 7, w: 0.55, grow: 0.1, hold: 1.1, pulses: [0.15, 0.3, 0.45, 0.6, 0.75, 0.9], shake: 3.2, stop: 0.1, big: true, core: true, push: 19, dur: 3.2 });

// ───────────── Purificar (Agua · apoyo · limpia estados) ─────────────
function purificar(ctx) {
  const R = ctx.R, F = ctx.from, A = ctx.to, B = base(ctx), P = B.P;
  const S0 = { x: F.x + F.w * 0.25, y: F.y - F.h * 0.95 }, body = { x: A.x, y: A.y - A.h * 0.5 }, T_REL = 0.45, T_FLY = 0.5, T_L = T_REL + T_FLY, T_RAIN = T_L + 0.1, T_END = T_L + 1.5;
  let orb = null, nA = 0, nB = 0, clean = false;
  B.S.at(T_REL, () => { B.shake = 0.5; });
  B.S.at(T_L, () => { B.shake = 1; P.ring({ x: A.x, y: GY, r0: 1, r1: 16, th: 2.5, life: 0.45, rp: WATER, ry: 0.32 }); for (let i = 0; i < 12; i++) P.add({ kind: 'sparkle', x: A.x + R.range(-A.w * 0.5, A.w * 0.5), y: A.y - R.range(2, A.h), vx: 0, vy: -16, life: R.range(0.5, 0.9), len: 2, rp: WATER, gc: [140, 210, 255] }); });
  B.S.at(T_RAIN + 0.35, () => { clean = true; B.shake = 1.2; for (let i = 0; i < 12; i++) P.add({ kind: 'smoke', x: A.x + R.range(-A.w * 0.4, A.w * 0.4), y: A.y - R.range(4, A.h), vx: R.range(-12, 12), vy: R.range(-34, -14), life: R.range(0.6, 1.0), r0: 2, r1: 7, a0: 0.55, layer: 'front' }); P.ring({ x: A.x, y: A.y - A.h * 0.5, r0: 3, r1: 15, th: 2, life: 0.35, rp: WATER, ry: 1, layer: 'front' }); });
  const orbPos = (t) => { const u = clamp((t - T_REL) / T_FLY); return { x: lerp(S0.x, body.x, u), y: lerp(S0.y, body.y - A.h * 0.8, u * u) - Math.sin(Math.PI * u) * 22 }; };
  return {
    dur: 3.2, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t; orb = t >= T_REL && t < T_L ? orbPos(t) : null;
      if (!clean) { nB -= dt; if (nB <= 0) { nB = 0.05; P.add({ kind: 'fire', x: A.x + R.sign() * R.range(A.w * 0.15, A.w * 0.5), y: A.y - R.range(A.h * 0.3, A.h * 0.95), vx: 0, vy: -22, life: 0.3, r: 2 }); } }
      if (t < T_REL) { nA -= dt; if (nA <= 0) { nA = 0.05; P.add({ kind: 'sparkle', x: S0.x + R.range(-5, 5), y: S0.y + R.range(-3, 5), vx: 0, vy: -8, life: 0.4, len: 1.2, rp: WATER, gc: [140, 210, 255] }); } }
      if (orb) { nA -= dt; if (nA <= 0) { nA = 0.016; P.add({ kind: 'drop', x: orb.x, y: orb.y + R.range(-1, 1), vx: R.range(-10, 10), vy: R.range(0, 20), g: 120, life: 0.4 }); } }
      if (t > T_RAIN && t < T_END - 0.2) { nA -= dt; if (nA <= 0) { nA = 0.025; P.add({ kind: 'drop', x: A.x + R.range(-A.w * 0.7, A.w * 0.7), y: A.y - A.h - R.range(4, 16), vx: R.range(-3, 3), vy: R.range(30, 80), g: 200, life: 0.7, splash: true, big: R.next() < 0.3 }); } }
      if (t > T_RAIN + 0.4 && t < T_END) { nB -= dt; if (nB <= 0) { nB = 0.09; P.add({ kind: 'sparkle', x: A.x + R.range(-A.w * 0.5, A.w * 0.5), y: A.y - R.range(2, A.h), vx: R.range(-4, 4), vy: R.range(-20, -8), life: 0.6, len: 1.6, rp: WATER, gc: [140, 210, 255] }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; p.glow(S0.x, S0.y, 9 + 7 * u, WATERC2, 0.45 * u); p.disc(S0.x, S0.y, 0.7 + 1.9 * u, WATER[4]); }
        if (orb) { p.disc(orb.x, orb.y, 3, WATER[2]); p.disc(orb.x, orb.y, 2, WATER[3]); p.disc(orb.x - 0.4, orb.y - 0.5, 1.1, WATER[5]); p.glow(orb.x, orb.y, 14, WATERC2, 0.7); }
        if (t > T_RAIN && t < T_END) { const k = (t - T_RAIN) / (T_END - T_RAIN), a = Math.sin(clamp(k) * Math.PI); p.glow(A.x, A.y - A.h * 0.5, 22, WATERC2, 0.45 * a); }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sy: kf(t, [[0, 1], [T_REL, 1.12]]), sx: kf(t, [[0, 1], [T_REL, 0.92]]), dy: -smooth(t / T_REL), tintA: 0.25 * (t / T_REL), tint: WATERC2 } : { sy: kf(r, [[0, 1.12], [0.07, 0.86], [0.35, 1]]), sx: kf(r, [[0, 0.92], [0.07, 1.12], [0.35, 1]]) }); }
      const k = t - T_L, burnA = clean ? 0 : 0.24 + 0.08 * Math.sin(t * 22), bob = k > 0 ? Math.max(0, Math.sin(clamp(k / 0.5) * Math.PI)) : 0;
      return act({ sy: 1 + 0.1 * bob, sx: 1 - 0.06 * bob, dy: -2 * bob, tint: clean || k > 0.35 ? [150, 220, 255] : [255, 90, 30], tintA: clean ? 0.3 * clamp(1 - (t - T_RAIN - 0.35) / 0.8) : t > T_RAIN ? 0.25 + burnA * 0.3 : burnA, flash: clean ? 0.5 * clamp(1 - (t - T_RAIN - 0.35) / 0.15) : 0 });
    },
  };
}

(function () {
  const W2 = '#3f9bd6', by = Object.fromEntries(MOVES.map((m) => [m.id, m]));
  const add = [
    { id: 'chorro', nombre: 'Chorro a presión', tipo: 'Básico · haz', caster: 'pompon', target: 'fosforin', make: chorro, fases: ['Se agacha y junta agua', 'El chorro sale y se alarga hasta el rival', 'Tres pulsos de impacto con salpicaduras', 'El rival queda mojado y gotea'], uso: 'Básico a media distancia: la criatura sola, muy a menudo.' },
    { id: 'salpicon', nombre: 'Salpicadura', tipo: 'Básico · proyectil corto', caster: 'pompon', target: 'fosforin', make: salpicon, fases: ['Forma una gota grande', 'Sale en arco corto', 'Revienta al impactar', 'Queda mojado'], uso: 'Básico rápido de corto alcance.' },
    { id: 'ola', nombre: 'Oleada', tipo: 'Habilidad · área, empuja', caster: 'pompon', target: 'fosforin', make: ola, fases: ['Golpea el suelo', 'Una ola con cresta avanza por el suelo', 'Rompe sobre el rival y lo empuja', 'Deja el suelo mojado'], uso: 'Habilidad: aparta a los rivales y los moja.' },
    { id: 'burbuja', nombre: 'Pompa prisión', tipo: 'Habilidad · atrapa y ralentiza', caster: 'pompon', target: 'fosforin', make: burbuja, fases: ['Sopla una burbuja', 'Crece en el aire', 'Atrapa al rival, que flota', 'Estalla en gotas'], uso: 'Habilidad de control: ralentiza al rival atrapado.' },
    { id: 'marea', nombre: 'Pleamar', tipo: 'Especial · zona (el agua sube)', caster: 'pompon', target: 'fosforin', make: marea, fases: ['Aviso: ondas en el suelo bajo el rival', 'El agua sube e inunda su zona; el rival flota ralentizado', 'Burbujas y reflejos', 'Se retira y lo arrastra', 'Cae con parada y deja charcos'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'torrente', nombre: 'Hidrocañón', tipo: 'Especial · haz largo', caster: 'pompon', target: 'fosforin', make: torrente, fases: ['Carga a presión', 'Chorro grueso y blanco', 'Empuja y arrastra al rival', 'Estalla en una ola de gotas'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'purificar', nombre: 'Lluvia curativa', tipo: 'Apoyo · limpia estados', caster: 'pompon', target: 'fosforin', make: purificar, fases: ['La aliada arde (estado dañino)', 'Lanza una gota purificadora', 'Lluvia limpia sobre la aliada', 'El fuego se apaga con vapor', 'Brillo limpio'], uso: 'Hueco de apoyo: quita estados dañinos a una aliada.' },
  ].map((m) => Object.assign({ el: 'Agua', col: W2 }, m));
  const all = Object.assign({}, by); add.forEach((m) => { all[m.id] = m; });
  const order = ['llamarada', 'zarpa', 'bola', 'salto', 'tormenta', 'erupcion', 'aura', 'avivar', 'chorro', 'salpicon', 'ola', 'burbuja', 'marea', 'torrente', 'escudo', 'purificar', 'brote'];
  MOVES.length = 0; order.forEach((id) => MOVES.push(all[id]));
})();
