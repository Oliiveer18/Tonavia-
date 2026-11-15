// ═════════ ROCA (8 movimientos) ═════════
const ROCK = ramp(['#2e2a2e', '#4a4347', '#6b6168', '#8f8389', '#b8adb0', '#e4dcdc']);
const ROCKC = [210, 190, 170], ROCKT = [200, 175, 150];

// trozo de roca con sombreado
const _pd7 = Particles.prototype.draw;
Particles.prototype.draw = function (p, layer) {
  _pd7.call(this, p, layer);
  for (const q of this.a) if (q.kind === 'rock' && q.layer === layer) {
    const k = q.age / q.life, a = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1, s = q.sz || 2; if (a < 0.2) continue;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) p.px(q.x + x - s / 2, q.y + y - s / 2, x + y === 0 ? ROCK[4] : x + y >= 2 * s - 2 ? ROCK[1] : ROCK[(q.seed + x + y) % 2 ? 2 : 3]);
  }
};
const reactR = (k, amp, dur = 0.55) => (k < 0 ? act({}) : act({ dx: kf(k, [[0, 0], [0.07, amp], [dur, 0]]), sy: kf(k, [[0, 1], [0.05, 0.76], [0.18, 1.1], [0.42, 1]]), sx: kf(k, [[0, 1], [0.05, 1.2], [0.18, 0.94], [0.42, 1]]), flash: 0.4 * clamp(1 - k / 0.12), tint: ROCKT, tintA: k < 0.6 ? 0.3 * clamp(1 - k / 0.6) : 0 }));
const rocks = (P, R, x, y, n, sp = 90, up = 90, szMax = 3) => { for (let i = 0; i < n; i++) P.add({ kind: 'rock', x: x + R.range(-4, 4), y: y + R.range(-3, 3), vx: R.range(-sp, sp), vy: -R.range(up * 0.3, up), g: 260, life: R.range(0.5, 0.9), sz: Math.round(R.range(1.4, szMax)), layer: R.next() < 0.5 ? 'front' : 'back' }); };
const dustP = (P, R, x, y, n, sp = 40, r1 = 5) => { for (let i = 0; i < n; i++) P.add({ kind: 'dust', x: x + R.range(-8, 8), y: y - 1, vx: R.range(-sp, sp), vy: R.range(-14, -2), life: R.range(0.4, 0.9), r0: 1, r1, layer: 'back' }); };
const hitR = (B, R, I, T, big = 1) => { const P = B.P; B.shake = 3.6 * big; B.stop = 0.1 * big; rocks(P, R, I.x, I.y, 10 * big, 110, 130); dustP(P, R, T.x, GY, 10 * big, 50); P.ring({ x: I.x, y: I.y, r0: 1, r1: 13 * big, th: 2, life: 0.22, rp: ROCK, ry: 1, layer: 'front' }); P.ring({ x: T.x, y: GY, r0: 2, r1: 22 * big, th: 2, life: 0.4, rp: ROCK, ry: 0.32 }); };
// grietas en el suelo (decal oscuro irregular desde un punto)
const crack = (p, x0, x1, w, seed) => { const r = new Rng(seed); let y = GY + 1; for (let x = x0; Math.abs(x - x1) > 1; x += Math.sign(x1 - x0)) { y += r.range(-0.8, 0.8); y = clamp(y, GY - 1, GY + 5); for (let o = 0; o < w; o++) p.dark(x, Math.round(y) + o, 0.8); if (r.next() < 0.18) { let by = y; for (let b = 0; b < 5; b++) { by += r.range(0.4, 1.2); p.dark(x + (r.next() < 0.5 ? -b : b) * 0, Math.round(by), 0.7); } } } };
const stun = (p, x, y, t, a = 1) => { for (let i = 0; i < 3; i++) { const an = t * 6 + i * 2.094, sx = x + Math.cos(an) * 7, sy = y + Math.sin(an) * 2; p.dpx(sx, sy, YEL[4], a); p.dpx(sx - 1, sy, YEL[3], a); p.dpx(sx + 1, sy, YEL[3], a); p.dpx(sx, sy - 1, YEL[3], a); p.dpx(sx, sy + 1, YEL[3], a); } };

// ───────────── Mazazo (Roca · básico · contacto) ─────────────
function mazazo(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const LAND = T.x - (T.w + F.w) * 0.5 + 3, T_W = 0.5, T_D = 0.12, T_C = T_W + T_D, T_B2 = T_C + 0.45, I = { x: T.x - T.w * 0.3, y: T.y - T.h * 0.5 };
  const x = (t) => (t < T_W ? F.x - 3 * smooth(t / T_W) : t < T_C ? lerp(F.x - 3, LAND, ei((t - T_W) / T_D)) : t < T_B2 ? LAND : lerp(LAND, F.x, smooth((t - T_B2) / 0.35)));
  let hit = false;
  B.S.at(T_W - 0.02, () => { B.shake = 0.6; rocks(P, R, F.x + 6, GY - 8, 4, 30, 40, 2.4); });
  B.S.at(T_C + 0.02, () => { hit = true; hitR(B, R, I, T, 1.1); });
  return dur4(B, 1.9, {
    update(dt) { B.tick(dt); },
    draw(p, layer) {
      const t = B.t, cx = x(t);
      if (layer === 'back' && hit) { const a = clamp(1 - (t - T_C) / 1.2); crack(p, I.x - 2, I.x - 22, 1, 5); p.dark(T.x, GY + 2, 0.3 * a); }
      if (layer === 'front') {
        if (t < T_C + 0.1) { const u = clamp(t / T_W), fy = F.y - F.h * 0.8 - 6 * (1 - Math.abs(u * 2 - 1)) * 0 - 5 * u; const sx = cx + F.w * 0.35, sy = t < T_W ? F.y - F.h - 4 * u : lerp(F.y - F.h - 4, F.y - F.h * 0.35, clamp((t - T_W) / T_D)); for (let dy = 0; dy < 9; dy++) for (let dx = -5; dx <= 5; dx++) if (Math.abs(dx) + Math.abs(dy - 4) < 8 && h2(dx + 9, dy + 9, 11) > 0.08) p.px(sx + dx, sy + dy - 3, dx + dy < 0 ? ROCK[4] : dx > 2 ? ROCK[1] : ROCK[2 + ((dx + dy) & 1)]); p.glow(sx, sy, 10, ROCKC, 0.15 * u); }
        if (hit) { const k = t - T_C - 0.02; if (k < 0.25) { p.glow(I.x, I.y, 18, ROCKC, 0.3 * (1 - k / 0.25)); const L2 = 10 * eo(k / 0.08); for (let i = 0; i < 6; i++) { const a = -1.5 + i * 0.6; p.line(I.x, I.y, I.x + Math.cos(a) * L2, I.y + Math.sin(a) * L2, k < 0.1 ? ROCK[5] : ROCK[3]); } } stun(p, T.x, T.y - T.h - 3, t, clamp(1.2 - (t - T_C) / 0.9)); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const dx = x(t) - F.x; let sx = 1, sy = 1; if (t < T_W) { sy = kf(t, [[0, 1], [T_W, 1.18]]); sx = kf(t, [[0, 1], [T_W, 0.88]]); } else if (t < T_C) { sy = 0.86; sx = 1.18; } else if (t < T_C + 0.3) { const k = t - T_C; sy = kf(k, [[0, 0.86], [0.06, 0.9], [0.3, 1]]); sx = kf(k, [[0, 1.18], [0.06, 1.12], [0.3, 1]]); } return act({ dx, sx, sy, tintA: t < T_C ? 0.2 : 0.1 * clamp(1 - (t - T_C) / 0.3), tint: ROCKT }); } return reactR(t - (T_C + 0.02), 9); },
  });
}

// ───────────── Pedrusco (Roca · básico · proyectil lento) ─────────────
function pedrusco(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const I = { x: T.x - T.w * 0.2, y: T.y - T.h * 0.5 }, H0 = { x: F.x + F.w * 0.4, y: F.y - F.h - 8 };
  const T_UP = 0.55, T_REL = 0.95, FLY = 0.55, T_HIT = T_REL + FLY; let hit = false, n = 0;
  const pos = (t) => { if (t < T_UP) { const u = eo(t / T_UP); return { x: F.x + F.w * 0.4, y: lerp(GY + 6, H0.y, u), a: 0, ph: 0 }; } if (t < T_REL) return { x: H0.x, y: H0.y - Math.sin((t - T_UP) / (T_REL - T_UP) * Math.PI) * 2, a: 0, ph: 1 }; const u = clamp((t - T_REL) / FLY); return { x: lerp(H0.x, I.x, u), y: lerp(H0.y, I.y, u) - Math.sin(Math.PI * u) * 22, a: t * 10, ph: 2 }; };
  B.S.at(0.05, () => { B.shake = 0.8; rocks(P, R, F.x + F.w * 0.4, GY, 6, 40, 70, 2.4); dustP(P, R, F.x + F.w * 0.4, GY, 6, 24, 3); });
  B.S.at(T_UP, () => { B.shake = 0.8; });
  B.S.at(T_HIT, () => { hit = true; hitR(B, R, I, T, 1.5); rocks(P, R, I.x, I.y, 10, 130, 140, 3.4); });
  const boulder = (p, x, y, a, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const d = dx * dx + dy * dy, n = h2(dx + 9, dy + 9, 3); if (d > r * r + (n - 0.5) * r * 1.4) continue; const sh = (dx * Math.cos(a - 0.8) + dy * Math.sin(a - 0.8)) / r; p.px(x + dx, y + dy, sh < -0.4 ? ROCK[4] : sh < 0.1 ? ROCK[3] : sh < 0.5 ? ROCK[2] : ROCK[1]); if (n < 0.1 && d < r * r * 0.6) p.px(x + dx, y + dy, ROCK[0]); } };
  return dur4(B, 2.2, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_REL && t < T_HIT) { n -= dt; if (n <= 0) { n = 0.03; const q = pos(t); P.add({ kind: 'dust', x: q.x, y: q.y + R.range(-2, 2), vx: R.range(-30, -5), vy: R.range(-6, 6), life: 0.4, r0: 1.5, r1: 4, layer: 'back' }); if (R.next() < 0.4) P.add({ kind: 'rock', x: q.x, y: q.y, vx: R.range(-30, 0), vy: R.range(-10, 20), g: 200, life: 0.5, sz: 1.5, layer: 'back' }); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back' && hit) crack(p, I.x - 4, I.x + 8, 1, 9);
      if (layer === 'front') {
        if (t < T_HIT) { const q = pos(t); boulder(p, q.x, q.y, q.a, 6); if (t < T_REL) p.glow(q.x, q.y, 14, ROCKC, 0.12); else if (t > T_REL) { p.ring(q.x, GY, 6, 1, ROCK[2], 0.32, 0.5); } }
        if (t > T_UP && t < T_REL) { const sh = pos(T_REL - 0.01); p.dark(sh.x, GY + 1, 0.0); }
        if (hit) { const k = t - T_HIT; if (k < 0.25) p.glow(I.x, I.y, 20, ROCKC, 0.3 * (1 - k / 0.25)); stun(p, T.x, T.y - T.h - 3, t, clamp(1.2 - k / 0.9)); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_REL; return act(t < T_UP ? { sy: kf(t, [[0, 1], [T_UP, 0.86]]), sx: kf(t, [[0, 1], [T_UP, 1.12]]), tintA: 0.25, tint: ROCKT } : t < T_REL ? { sy: kf(t, [[T_UP, 0.86], [T_REL, 1.2]]), sx: kf(t, [[T_UP, 1.12], [T_REL, 0.9]]), dy: -2 * smooth((t - T_UP) / (T_REL - T_UP)), tintA: 0.25, tint: ROCKT } : { sy: kf(r, [[0, 1.2], [0.08, 0.84], [0.35, 1]]), sx: kf(r, [[0, 0.9], [0.08, 1.16], [0.35, 1]]), dy: kf(r, [[0, -2], [0.08, 0]]), dx: kf(r, [[0, 0], [0.08, 3], [0.4, 0]]), tintA: 0.2 * clamp(1 - r / 0.3), tint: ROCKT }); } return reactR(t - T_HIT, 11); },
  });
}

// ───────────── Onda sísmica (Roca · habilidad · área corta, aturde) ─────────────
function onda(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_W = 0.45, T_S = T_W + 0.1, SP = 150, DIST = T.x - F.x, T_ARR = T_S + (DIST - 12) / SP, T_END = T_ARR + 1.6; const spikes = [];
  B.S.at(T_S, () => { B.shake = 3; B.stop = 0.06; P.ring({ x: F.x, y: GY, r0: 3, r1: 28, th: 3, life: 0.5, rp: ROCK, ry: 0.32, layer: 'front' }); dustP(P, R, F.x, GY, 12, 60); rocks(P, R, F.x, GY, 6, 70, 80); });
  B.S.at(T_ARR, () => { B.shake = 4.2; B.stop = 0.1; P.ring({ x: T.x, y: GY, r0: 3, r1: 30, th: 3, life: 0.5, rp: ROCK, ry: 0.32, layer: 'front' }); rocks(P, R, T.x, GY - 4, 14, 100, 150); dustP(P, R, T.x, GY, 12, 60, 6); });
  let n = 0;
  return dur4(B, 2.8, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_S && t < T_ARR) { n -= dt; const fx = F.x + (t - T_S) * SP; if (n <= 0) { n = 0.05; spikes.push({ x: fx, t, h: R.range(5, 10) }); P.add({ kind: 'rock', x: fx, y: GY - 2, vx: R.range(-10, 20), vy: -R.range(30, 80), g: 260, life: 0.5, sz: 2, layer: 'front' }); dustP(P, R, fx, GY, 1, 14, 3); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') { if (t > T_S) { const fx = Math.min(T.x, F.x + (t - T_S) * SP); crack(p, F.x + 6, fx, 1, 21); } }
      if (layer === 'front') {
        if (t < T_S) { const u = clamp(t / T_W); p.glow(F.x, GY - 4, 10 + 8 * u, ROCKC, 0.2 * u); if (t > T_W - 0.12) p.ring(F.x, GY, 5 + 8 * (t - T_W + 0.12) / 0.12, 1, ROCK[4], 0.32, 0.8); }
        spikes.forEach((s) => { const k = t - s.t, u = k < 0.12 ? eo(k / 0.12) : 1 - clamp((k - 0.5) / 0.35), h = s.h * u; if (h < 0.5) return; for (let y = 0; y < h; y++) { const w = Math.max(1, Math.round((1 - y / h) * 2.4)); for (let dx = -w; dx <= w; dx++) p.px(s.x + dx, GY + 1 - y, dx < 0 ? ROCK[4] : dx > 0 ? ROCK[1] : ROCK[3]); } });
        if (t > T_ARR) { const k = t - T_ARR; if (k < 0.2) p.glow(T.x, T.y - T.h * 0.4, 20, ROCKC, 0.3 * (1 - k / 0.2)); stun(p, T.x, T.y - T.h - 3, t, clamp(1.1 - k / 1.3)); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_S ? { sy: kf(t, [[0, 1], [T_W, 1.2], [T_S, 1.2]]), sx: kf(t, [[0, 1], [T_W, 0.88], [T_S, 0.88]]), dy: -3 * smooth(t / T_W), tintA: 0.25 * clamp(t / T_W), tint: ROCKT } : { sy: kf(t - T_S, [[0, 1.2], [0.06, 0.8], [0.3, 1]]), sx: kf(t - T_S, [[0, 0.88], [0.06, 1.2], [0.3, 1]]), dy: kf(t - T_S, [[0, -3], [0.06, 0]]), tintA: 0.2 * clamp(1 - (t - T_S) / 0.3), tint: ROCKT });
      if (t < T_ARR - 0.1) return act({}); const k = t - T_ARR; return act({ dy: kf(k, [[-0.1, 0], [0, 0], [0.12, -12], [0.3, 0]]), dx: Math.sin(k * 50) * 0.6 * clamp(1 - k / 1.2), sy: kf(k, [[0, 1], [0.04, 0.8], [0.3, 1.04], [0.5, 1]]), sx: kf(k, [[0, 1], [0.04, 1.14], [0.3, 0.98], [0.5, 1]]), flash: 0.4 * clamp(1 - k / 0.1), tint: ROCKT, tintA: 0.3 * clamp(1 - k / 1.2) }); },
  });
}

// ───────────── Embestida pétrea (Roca · habilidad · contacto en línea, aturde) ─────────────
function embestida(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const LAND = T.x - (T.w + F.w) * 0.5 + 6, T_W = 0.55, T_D = 0.28, T_C = T_W + T_D, T_B2 = T_C + 0.5, I = { x: T.x - T.w * 0.3, y: T.y - T.h * 0.5 };
  const x = (t) => (t < T_W ? F.x - 4 * smooth(t / T_W) : t < T_C ? lerp(F.x - 4, LAND, ei((t - T_W) / T_D)) : t < T_B2 ? LAND + 2 * eo((t - T_C) / 0.1) : lerp(LAND + 2, F.x, smooth((t - T_B2) / 0.45)));
  let hit = false, n = 0;
  B.S.at(T_W, () => { B.shake = 1; dustP(P, R, F.x, GY, 10, 40, 4); });
  B.S.at(T_C, () => { hit = true; hitR(B, R, I, T, 1.5); });
  return dur4(B, 2.2, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_W && t < T_C) { n -= dt; if (n <= 0) { n = 0.02; const cx = x(t); dustP(P, R, cx - F.w * 0.4, GY, 1, 12, 5); P.add({ kind: 'rock', x: cx - F.w * 0.4, y: GY - R.range(0, F.h), vx: R.range(-70, -20), vy: R.range(-40, 10), g: 200, life: 0.5, sz: 2, layer: 'back' }); } } },
    draw(p, layer) {
      const t = B.t, cx = x(t);
      if (layer === 'back' && t > T_W) { const a = clamp(1 - (t - T_C) / 1.5), e = Math.min(cx, LAND); for (let xx = F.x; xx < e; xx += 1) if (h2(xx, 1, 6) < 0.7 * (t > T_C ? a : 1)) p.dark(xx, GY + 1 + (h2(xx, 2, 6) < 0.4 ? 1 : 0), 0.4); }
      if (layer === 'front') {
        if (t < T_W) { const u = t / T_W; p.glow(cx, F.y - F.h * 0.4, 10 + 6 * u, ROCKC, 0.15 * u); }
        if (hit) { const k = t - T_C; if (k < 0.25) { p.glow(I.x, I.y, 20, ROCKC, 0.3 * (1 - k / 0.25)); const L2 = 11 * eo(k / 0.08); for (let i = 0; i < 7; i++) { const a = -1.7 + i * 0.55; p.line(I.x, I.y, I.x + Math.cos(a) * L2, I.y + Math.sin(a) * L2, k < 0.1 ? ROCK[5] : ROCK[3]); } } stun(p, T.x, T.y - T.h - 3, t, clamp(1.2 - k / 1.1)); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const dx = x(t) - F.x; let sx = 1, sy = 1; if (t < T_W) { sy = kf(t, [[0, 1], [T_W, 0.82]]); sx = kf(t, [[0, 1], [T_W, 1.16]]); } else if (t < T_C) { sx = 1.2; sy = 0.88; } else if (t < T_C + 0.3) { const k = t - T_C; sx = kf(k, [[0, 1.2], [0.08, 0.88], [0.3, 1]]); sy = kf(k, [[0, 0.88], [0.08, 1.12], [0.3, 1]]); } return act({ dx, sx, sy, tintA: t < T_C ? 0.25 : 0.12 * clamp(1 - (t - T_C) / 0.4), tint: ROCKT }); } return reactR(t - T_C, 13, 0.7); },
  });
}

// ───────────── Alud de rocas (Roca · especial · zona) ─────────────
function alud(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_C = 0.6, T_TEL = 0.9, FALL = 0.45, T_END = 3.8;
  const RK = [{ dx: -26, t: 1.5, r: 5 }, { dx: 14, t: 1.75, r: 4 }, { dx: -10, t: 1.95, r: 5 }, { dx: 26, t: 2.15, r: 4 }, { dx: -30, t: 2.3, r: 4 }, { dx: 4, t: 2.45, r: 5 }, { dx: 0, t: 2.8, r: 11, last: true }];
  const hits = [], rubble = [];
  RK.forEach((k) => B.S.at(k.t, () => { const x = T.x + k.dx, big = k.last ? 1.8 : 0.8 + k.r * 0.1; hits.push({ t: k.t, x, last: k.last }); rubble.push({ x, r: k.r, t: k.t }); B.shake = k.last ? 6 : 2.4; B.stop = k.last ? 0.14 : 0.04; rocks(P, R, x, GY - 3, k.last ? 22 : 9, 110 * big, 140 * big, 3); dustP(P, R, x, GY, k.last ? 14 : 6, 50, k.last ? 7 : 4); P.ring({ x, y: GY, r0: 2, r1: k.last ? 34 : 15, th: 2, life: 0.4, rp: ROCK, ry: 0.32, layer: 'front' }); }));
  B.S.at(T_TEL, () => { B.shake = 0.6; });
  const boulder = (p, x, y, r, a) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const d = dx * dx + dy * dy, n = h2(dx + 7, dy + 7, 5); if (d > r * r + (n - 0.5) * r * 1.4) continue; const sh = (dx * Math.cos(a) + dy * Math.sin(a)) / r; p.px(x + dx, y + dy, sh < -0.4 ? ROCK[4] : sh < 0.1 ? ROCK[3] : sh < 0.5 ? ROCK[2] : ROCK[1]); } };
  let n = 0;
  return dur4(B, 4.2, {
    update(dt) { B.tick(dt); const t = B.t; RK.forEach((k) => { if (t > k.t - FALL && t < k.t) { n -= dt; if (n <= 0) { n = 0.02; const u = (t - (k.t - FALL)) / FALL; P.add({ kind: 'dust', x: T.x + k.dx + R.range(-2, 2), y: lerp(-6, GY - 3, u * u) - 3, vx: 0, vy: -10, life: 0.3, r0: 1.5, r1: 3.5, layer: 'back' }); } } }); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') {
        RK.forEach((k) => { if (t > T_TEL && t < k.t) { const u = clamp((t - (k.t - FALL - 0.3)) / (FALL + 0.3)); const rr = k.r * (0.5 + 0.6 * u); for (let y = -2; y <= 2; y++) for (let x = -Math.ceil(rr + 2); x <= rr + 2; x++) if ((x / (rr + 2)) ** 2 + (y / 2) ** 2 < 1) p.dark(T.x + k.dx + x, GY + 1 + y, 0.55 * clamp((t - T_TEL) / 0.3)); } });
        rubble.forEach((r) => { const a = clamp(1 - (t - r.t - 1.0) / 0.8); if (a <= 0) return; for (let i = 0; i < 6; i++) { const o = h2(r.x, i, 8), dx = (o - 0.5) * r.r * 2.6, w = 1 + Math.round(h2(r.x, i, 9) * r.r * 0.4); for (let yy = 0; yy < w; yy++) for (let xx = 0; xx < w + 1; xx++) p.px(r.x + dx + xx, GY - yy, yy === 0 && xx === 0 ? ROCK[4] : ROCK[1 + ((xx + yy + i) % 3)]); } });
      }
      if (layer === 'front') {
        if (t < T_TEL) { const u = clamp(t / T_C); p.glow(F.x, F.y - F.h * 0.5, 12 + 6 * u, ROCKC, 0.25 * u); }
        if (t > T_TEL && t < RK[0].t) { const u = (t - T_TEL) / (RK[0].t - T_TEL); p.ring(T.x, GY, 36 * (1 - 0.25 * u), 1, ROCK[3], 0.32, 0.5 + 0.4 * u); }
        RK.forEach((k) => { if (t > k.t - FALL && t < k.t) { const u = (t - (k.t - FALL)) / FALL, y = lerp(-8, GY - k.r, u * u); boulder(p, T.x + k.dx, y, k.r, t * 6 + k.dx); } });
        hits.forEach((h) => { const k = t - h.t; if (k < 0.25) p.glow(h.x, GY - 4, h.last ? 36 : 22, ROCKC, (h.last ? 0.45 : 0.3) * (1 - k / 0.25)); });
        const lastH = hits.find((h) => h.last); if (lastH) stun(p, T.x, T.y - T.h - 3, t, clamp(1.2 - (t - lastH.t) / 1.0)); else if (hits.length) stun(p, T.x, T.y - T.h - 3, t, 0.8 * clamp(1 - (t - hits[hits.length - 1].t) / 0.5));
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_C ? { sy: kf(t, [[0, 1], [T_C, 1.18]]), sx: kf(t, [[0, 1], [T_C, 0.9]]), dy: -2 * smooth(t / T_C), tintA: 0.3 * (t / T_C), tint: ROCKT } : { sy: kf(t - T_C, [[0, 1.18], [0.08, 0.84], [0.35, 1]]), sx: kf(t - T_C, [[0, 0.9], [0.08, 1.14], [0.35, 1]]), dy: kf(t - T_C, [[0, -2], [0.08, 0]]), tintA: 0.2 * clamp(1 - (t - T_C) / 0.4), tint: ROCKT });
      let dx = 0, fl = 0, ta = 0, sy = 1; hits.forEach((h) => { const k = t - h.t, near = Math.abs(h.x - T.x) < 14 || h.last; if (k >= 0 && k < 0.4 && near) { dx += Math.sin(k * 80) * 1.4 * (1 - k / 0.4); fl = Math.max(fl, 0.4 * clamp(1 - k / 0.1)); ta = Math.max(ta, 0.3 * (1 - k / 0.4)); sy = Math.min(sy, kf(k, [[0, 1], [0.04, 0.88], [0.2, 1]])); } }); const lh = hits.find((h) => h.last), o = { dx, flash: fl, sy, tint: ROCKT, tintA: ta }; if (lh) { const q = t - lh.t; o.dx += kf(q, [[0, 0], [0.1, 8], [0.7, 0]]); o.sy = kf(q, [[0, 1], [0.04, 0.72], [0.2, 1.08], [0.45, 1]]); o.sx = kf(q, [[0, 1], [0.04, 1.2], [0.2, 0.95], [0.45, 1]]); o.tintA = Math.max(ta, 0.3 * clamp(1 - q / 1.1)); } return act(o); },
  });
}

// ───────────── Seísmo (Roca · especial · área, empuja y aturde) ─────────────
function seismo(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_C = 0.7, T_S = 0.9, SP = 130, T_ARR = T_S + (T.x - F.x) / SP, T_END = 3.4; const spires = []; let n = 0, shk = 0;
  B.S.at(T_S, () => { B.shake = 4; B.stop = 0.08; P.ring({ x: F.x, y: GY, r0: 3, r1: 40, th: 3, life: 0.6, rp: ROCK, ry: 0.32, layer: 'front' }); dustP(P, R, F.x, GY, 14, 70, 6); rocks(P, R, F.x, GY, 8, 90, 120); });
  B.S.at(T_ARR, () => { B.shake = 7; B.stop = 0.15; P.ring({ x: T.x, y: GY, r0: 3, r1: 50, th: 3, life: 0.6, rp: ROCK, ry: 0.32, layer: 'front' }); rocks(P, R, T.x, GY - 4, 26, 130, 190, 3.4); dustP(P, R, T.x, GY, 18, 80, 7); for (let i = 0; i < 6; i++) P.add({ kind: 'smoke', x: T.x + R.range(-12, 12), y: GY - 4, vx: R.range(-14, 14), vy: R.range(-30, -12), life: R.range(1, 1.7), r0: 2, r1: 8, a0: 0.45, layer: 'back' }); });
  return dur4(B, 3.8, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_S && t < T_ARR + 1.0) B.shake = Math.max(B.shake, 1.4); if (t > T_S && t < T_ARR) { n -= dt; const fx = F.x + (t - T_S) * SP; if (n <= 0) { n = 0.035; spires.push({ x: fx, t, h: R.range(8, 16) }); P.add({ kind: 'rock', x: fx, y: GY - 2, vx: R.range(-20, 30), vy: -R.range(40, 110), g: 260, life: 0.6, sz: 2, layer: 'front' }); dustP(P, R, fx, GY, 1, 20, 4); } } if (t > T_ARR && t < T_ARR + 1.0) { n -= dt; if (n <= 0) { n = 0.04; P.add({ kind: 'rock', x: T.x + R.range(-30, 30), y: GY - R.range(20, 50), vx: 0, vy: 30, g: 200, life: 0.5, sz: 2, layer: 'front' }); dustP(P, R, T.x + R.range(-40, 40), GY, 1, 20, 5); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back' && t > T_S) { const fx = Math.min(T.x + 12, F.x + (t - T_S) * SP); crack(p, F.x + 6, fx, 2, 31); crack(p, F.x + 10, fx - 6, 1, 33); if (t > T_ARR) { crack(p, T.x - 14, T.x + 24, 2, 35); } }
      if (layer === 'front') {
        if (t < T_S) { const u = clamp(t / T_C); p.glow(F.x, F.y - F.h * 0.5, 12 + 6 * u, ROCKC, 0.25 * u); }
        spires.forEach((s) => { const k = t - s.t, u = k < 0.14 ? eo(k / 0.14) : 1 - clamp((k - 0.8) / 0.6), h = s.h * u; if (h < 0.5) return; for (let y = 0; y < h; y++) { const w = Math.max(1, Math.round((1 - y / h) * 3)); for (let dx = -w; dx <= w; dx++) p.px(s.x + dx, GY + 1 - y, dx < 0 ? ROCK[4] : dx > 0 ? ROCK[1] : ROCK[3]); } });
        if (t > T_ARR) { const k = t - T_ARR; if (k < 0.25) p.glow(T.x, T.y - T.h * 0.4, 30, ROCKC, 0.4 * (1 - k / 0.25)); stun(p, T.x, T.y - T.h - 3 - 6 * Math.max(0, 1 - k / 0.5), t, clamp(1.3 - k / 1.8)); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_S ? { sy: kf(t, [[0, 1], [T_C, 1.22], [T_S, 1.22]]), sx: kf(t, [[0, 1], [T_C, 0.86], [T_S, 0.86]]), dy: -3 * smooth(t / T_C), tintA: 0.3 * clamp(t / T_C), tint: ROCKT } : { sy: kf(t - T_S, [[0, 1.22], [0.06, 0.78], [0.35, 1]]), sx: kf(t - T_S, [[0, 0.86], [0.06, 1.22], [0.35, 1]]), dy: kf(t - T_S, [[0, -3], [0.06, 0]]), dx: Math.sin(t * 60) * 0.5 * clamp(1 - (t - T_S) / 1.2), tintA: 0.2 * clamp(1 - (t - T_S) / 0.5), tint: ROCKT });
      if (t < T_ARR - 0.05) return act({ dx: t > T_S + 0.1 ? Math.sin(t * 70) * 0.5 : 0 }); const k = t - T_ARR; return act({ dy: kf(k, [[-0.05, 0], [0, 0], [0.18, -20], [0.5, 0]]), dx: kf(k, [[0, 0], [0.18, 6], [0.8, 10], [1.4, 0]]) + Math.sin(k * 60) * 0.5 * clamp(1 - k / 1.2), sy: kf(k, [[0, 1], [0.5, 1], [0.54, 0.7], [0.7, 1.1], [0.95, 1]]), sx: kf(k, [[0, 1], [0.5, 1], [0.54, 1.22], [0.7, 0.95], [0.95, 1]]), flash: 0.4 * clamp(1 - k / 0.1), tint: ROCKT, tintA: 0.35 * clamp(1 - k / 1.4) }); },
  });
}

// ───────────── Muralla de piedra (Roca · defensa · propia) ─────────────
function muralla(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_ON = 0.45, T_FULL = 1.0, T_DASH = 1.5, T_C = 1.64, T_OFF = 2.8, T_END = 3.3;
  const DASH = (T.x - F.x) - (F.w * 0.5 + T.w * 0.5) - 8, SL = [{ dx: 10, h: 20, w: 5, d: 0 }, { dx: 15, h: 26, w: 5, d: 0.1 }, { dx: 20, h: 20, w: 5, d: 0.2 }, { dx: 12, h: 14, w: 4, d: 0.3, back: true }, { dx: 18, h: 16, w: 4, d: 0.35, back: true }];
  const ex = (t) => (t < T_DASH ? (t > T_DASH - 0.4 ? 1.5 * smooth((t - T_DASH + 0.4) / 0.4) : 0) : t < T_C ? lerp(1.5, -DASH, ei((t - T_DASH) / (T_C - T_DASH))) : -DASH + kf(t - T_C, [[0, 0], [0.09, 10], [0.8, DASH]]));
  const IM = { x: F.x + 25, y: GY - 14 }; let hit = false;
  const g = (t) => clamp((t - T_ON) / (T_FULL - T_ON)) * (t > T_OFF ? 1 - smooth((t - T_OFF) / (T_END - T_OFF)) : 1);
  B.S.at(T_ON, () => { B.shake = 1.2; dustP(P, R, F.x + 15, GY, 10, 30, 4); });
  B.S.at(T_FULL, () => { B.shake = 1.6; rocks(P, R, F.x + 16, GY - 8, 6, 40, 60); });
  B.S.at(T_C, () => { hit = true; B.stop = 0.1; B.shake = 4; rocks(P, R, IM.x, IM.y, 14, 100, 100, 3); dustP(P, R, IM.x, GY, 8, 50, 5); P.ring({ x: IM.x, y: IM.y, r0: 1, r1: 14, th: 2, life: 0.22, rp: ROCK, ry: 1, layer: 'front' }); });
  B.S.at(T_OFF, () => { rocks(P, R, F.x + 16, GY - 10, 14, 50, 60); dustP(P, R, F.x + 16, GY, 8, 30, 4); });
  const slab = (p, s, t) => { const u = clamp((t - T_ON - s.d) / 0.4), hh = s.h * (u < 1 ? eback(u) : 1) * (t > T_OFF ? clamp(1 - (t - T_OFF) / (T_END - T_OFF)) : 1); if (hh < 1) return; const x0 = F.x + s.dx - s.w / 2; for (let y = 0; y < hh; y++) for (let x = 0; x < s.w; x++) { let c = x === 0 ? ROCK[4] : x === s.w - 1 ? ROCK[1] : ROCK[3 - ((y >> 2) & 1)]; if (y === Math.floor(hh) - 1) c = ROCK[5]; if (y % 5 === 4) c = ROCK[1]; if (hit && Math.hypot(x0 + x - IM.x, GY - y - IM.y) < 5 && (x + y) % 3 === 0) c = ROCK[0]; p.px(x0 + x, GY - y, c); } };
  return dur4(B, 3.5, {
    update(dt) { B.tick(dt); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') SL.forEach((s) => { if (s.back) slab(p, s, t); });
      if (layer === 'front') {
        SL.forEach((s) => { if (!s.back) slab(p, s, t); });
        if (t > T_ON && t < T_FULL) p.glow(F.x + 15, GY - 8, 22, ROCKC, 0.2 * g(t));
        if (hit) { const k = t - T_C; if (k < 0.24) p.glow(IM.x, IM.y, 22, ROCKC, 0.3 * (1 - k / 0.24)); }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const k = t - T_C; return act(t < T_ON ? {} : t < T_C ? { sy: kf(t, [[T_ON, 1], [T_FULL, 0.94]]), sx: kf(t, [[T_ON, 1], [T_FULL, 1.06]]), tint: ROCKT, tintA: 0.2 * g(t) } : { dx: kf(k, [[0, 0], [0.07, 0.6], [0.4, 0]]), sy: 0.94, sx: 1.06, tint: ROCKT, tintA: 0.15 * clamp(1 - k / 0.6) }); }
      const dx = ex(t); if (t < T_DASH) return act({ dx, sx: t > T_DASH - 0.4 ? kf(t, [[T_DASH - 0.4, 1], [T_DASH, 0.9]]) : 1, sy: t > T_DASH - 0.4 ? kf(t, [[T_DASH - 0.4, 1], [T_DASH, 1.1]]) : 1 });
      if (t < T_C) return act({ dx, sx: 1.18, sy: 0.9 });
      const k = t - T_C; return act({ dx, flash: 0.4 * clamp(1 - k / 0.1), sy: kf(k, [[0, 0.76], [0.1, 1.1], [0.4, 1]]), sx: kf(k, [[0, 1.2], [0.1, 0.94], [0.4, 1]]), dy: kf(k, [[0, 0], [0.12, -4], [0.35, 0]]), tint: ROCKT, tintA: 0.2 * clamp(1 - k / 0.5) });
    },
  });
}

// ───────────── Desafío (Roca · apoyo · atrae los ataques enemigos) ─────────────
function desafio(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: F.x, y: F.y - F.h * 0.5 }, T_C = 0.5, T_R = 0.65, T_END = 3.0; let n = 0, on = 0;
  B.S.at(T_R, () => { B.shake = 3; B.stop = 0.06; for (let i = 0; i < 3; i++) P.ring({ x: F.x + 4, y: C.y, r0: 3, r1: 26 + i * 14, th: 2, life: 0.35 + i * 0.12, rp: ROCK, ry: 1, layer: 'front' }); dustP(P, R, F.x, GY, 10, 60, 5); rocks(P, R, F.x, GY - 6, 6, 70, 70); });
  B.S.at(T_R + 0.45, () => { on = 1; B.shake = 1.4; for (let i = 0; i < 8; i++) P.add({ kind: 'rock', x: T.x + R.range(-6, 6), y: T.y - T.h - R.range(0, 4), vx: R.range(-30, 30), vy: -R.range(20, 60), g: 160, life: 0.5, sz: 1.5, layer: 'front' }); });
  return dur4(B, 3.4, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_R + 0.3 && t < T_END - 0.4) { n -= dt; if (n <= 0) { n = 0.05; const y = T.y - R.range(2, T.h); P.add({ kind: 'dust', x: T.x - T.w * 0.4, y, vx: -R.range(80, 140), vy: (C.y - y) * 1.2, life: 0.3, r0: 1, r1: 2, layer: 'front' }); } } },
    draw(p, layer) {
      const t = B.t, a = t > T_R + 0.4 ? clamp((T_END - t) / 0.5) : 0;
      if (layer === 'front') {
        if (t < T_R) { const u = t / T_C; p.glow(C.x, C.y, 12 + 8 * clamp(u), ROCKC, 0.3 * clamp(u)); }
        if (on && t < T_END) {
          const ay = T.y - T.h - 9 + Math.sin(t * 8) * 0.8, k = clamp((t - T_R - 0.45) / 0.15); if (k > 0) { const s = 0.5 + 0.5 * eback(k); for (let y = 0; y < 7 * s; y++) for (let x = -1; x <= 1; x++) if (y < 5 * s || x === 0) p.px(T.x + x, ay + y - 3, y > 5 * s ? YEL[4] : [0, 1].includes(Math.abs(x)) ? ROCK[0] : ROCK[0]); for (let y = 0; y < 7 * s; y++) for (let x = -1; x <= 1; x++) if (y < 5 * s && x === 0) p.px(T.x + x, ay + y - 3, YEL[4]); p.px(T.x, ay + 4 * s, YEL[4]); p.glow(T.x, ay + 1, 9, [255, 120, 60], 0.35 * a); }
          const cy = F.y - F.h - 8 + Math.sin(t * 5) * 1, ca = clamp((t - T_R - 0.2) / 0.3) * a; p.ring(F.x, cy, 5, 1, ROCK[4], 1, ca); p.ring(F.x, cy, 2.4, 1, YEL[3], 1, ca); p.line(F.x - 8, cy, F.x + 8, cy, ROCK[4]); p.line(F.x, cy - 8, F.x, cy + 8, ROCK[4]); p.glow(F.x, cy, 12, ROCKC, 0.25 * ca);
        }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_R ? { sy: kf(t, [[0, 1], [T_C, 1.2], [T_R, 1.2]]), sx: kf(t, [[0, 1], [T_C, 0.88], [T_R, 0.88]]), tintA: 0.3 * clamp(t / T_C), tint: ROCKT } : { sy: kf(t - T_R, [[0, 1.2], [0.08, 0.84], [0.4, 1]]), sx: kf(t - T_R, [[0, 0.88], [0.08, 1.14], [0.4, 1]]), tintA: 0.3 * clamp(1 - (t - T_R) / 0.5), tint: ROCKT });
      if (t < T_R + 0.25) return act({}); const k = t - T_R - 0.25, a = clamp(k / 0.2) * (t > T_END - 0.4 ? clamp((T_END - t) / 0.4) : 1), hop = Math.abs(Math.sin(k * 9)) * 2 * (k < 1.2 ? 1 : 0); return act({ dx: 2 * a * eo(clamp(k / 0.3)) + Math.sin(t * 50) * 0.5 * a, dy: -hop * a, sx: 1 + 0.06 * a, sy: 1 - 0.04 * a, tint: [220, 90, 60], tintA: 0.35 * a, flash: k < 0.15 ? 0.3 * (1 - k / 0.15) : 0 }); },
  });
}

(function () {
  const C = '#a88f78', by = Object.fromEntries(MOVES.map((m) => [m.id, m]));
  const add = [
    { id: 'mazazo', nombre: 'Mazazo', tipo: 'Básico · contacto', make: mazazo, fases: ['Alza el puño de roca', 'Golpe de mazo con onda y grietas', 'Rocas y polvo; el rival sale lanzado y aturdido'], uso: 'Básico pesado: retroceso fuerte.' },
    { id: 'pedrusco', nombre: 'Pedrusco', tipo: 'Básico · proyectil lento', make: pedrusco, fases: ['Arranca un peñasco del suelo', 'Lo alza sobre la cabeza', 'Lo lanza en arco, girando', 'Impacto: se rompe en trozos'], uso: 'Básico a media distancia: lento pero muy pesado.' },
    { id: 'onda', nombre: 'Onda sísmica', tipo: 'Habilidad · área, aturde', make: onda, fases: ['Salta y se prepara', 'Pisotón: ondas y grietas en el suelo', 'Pinchos de roca brotan hacia el rival', 'Lo levanta y lo deja aturdido'], uso: 'Habilidad de control: aturde alrededor.' },
    { id: 'embestida', nombre: 'Embestida pétrea', tipo: 'Habilidad · contacto en línea', make: embestida, fases: ['Se agacha y arranca el polvo', 'Carga en línea dejando una estela de grietas', 'Choque brutal con rocas', 'El rival queda aturdido'], uso: 'Habilidad: embiste y aturde.' },
    { id: 'alud', nombre: 'Alud de rocas', tipo: 'Especial · zona', make: alud, fases: ['Aviso: sombras crecen en el suelo', 'Caen rocas una tras otra con polvo', 'Escombros se quedan un rato', 'Peñasco final sobre el rival'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'seismo', nombre: 'Seísmo', tipo: 'Especial · área, empuja y aturde', make: seismo, fases: ['Salta con todo el peso', 'Golpe: grietas largas y pinchos hacia el rival', 'El suelo tiembla; el rival sale despedido', 'Cae con onda, escombros y aturdimiento'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'muralla', nombre: 'Muralla de piedra', tipo: 'Defensa · propia', make: muralla, fases: ['Lajas de piedra suben del suelo', 'El rival embiste y la muralla aguanta', 'Trozos saltan; la criatura no se mueve', 'Se desmorona'], uso: 'Hueco de defensa: reduce el daño y no deja que la empujen.' },
    { id: 'desafio', nombre: 'Desafío', tipo: 'Apoyo · provoca', make: desafio, fases: ['Concentra el aire', 'Rugido con ondas de roca', 'Marca de alarma sobre el rival y diana sobre ella', 'El rival se enfurece y mira a la criatura'], uso: 'Hueco de apoyo: los enemigos van a por ella.' },
  ].map((m) => Object.assign({ el: 'Roca', col: C, caster: 'aguacato', target: 'fosforin' }, m));
  const all = Object.assign({}, by); add.forEach((m) => { all[m.id] = m; });
  const order = MOVES.map((m) => m.id).concat(add.map((m) => m.id));
  MOVES.length = 0; order.forEach((id) => MOVES.push(all[id]));
})();
