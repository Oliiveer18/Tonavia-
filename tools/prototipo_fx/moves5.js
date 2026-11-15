// ═════════ ELÉCTRICO (8 movimientos) ═════════
const YEL = ramp(['#5a3b00', '#b87a00', '#ffc61a', '#ffe45e', '#fff6b0', '#ffffff']);
const ELEC = [255, 225, 90], ELB = [130, 170, 255];
const sdT = (t, k = 0) => Math.floor(t * 28) * 131 + k * 977 + 7;

// rayo en zigzag; con semilla distinta cada ~36 ms parpadea de forma determinista
function bpts(seed, x0, y0, x1, y1, n = 8, j = 4) {
  const r = new Rng(seed), a = [{ x: x0, y: y0 }], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 1; i < n; i++) { const u = i / n, o = r.range(-j, j); a.push({ x: x0 + dx * u + nx * o, y: y0 + dy * u + ny * o }); }
  a.push({ x: x1, y: y1 }); return a;
}
function bdraw(p, pts, th = 1, a = 1, gl = 0.25) {
  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i], B = pts[i + 1];
    if (th > 1) { p.line(A.x, A.y - 1, B.x, B.y - 1, YEL[2]); p.line(A.x, A.y + 1, B.x, B.y + 1, YEL[2]); p.line(A.x - 1, A.y, B.x - 1, B.y, YEL[2]); p.line(A.x + 1, A.y, B.x + 1, B.y, YEL[2]); }
    if (th > 3) { p.line(A.x - 2, A.y, B.x - 2, B.y, YEL[1]); p.line(A.x + 2, A.y, B.x + 2, B.y, YEL[1]); p.line(A.x - 1, A.y, B.x - 1, B.y, YEL[3]); p.line(A.x + 1, A.y, B.x + 1, B.y, YEL[3]); }
    p.line(A.x, A.y, B.x, B.y, th > 1 ? YEL[5] : YEL[4]);
    if (i % 2 === 0 && gl > 0) p.glow(A.x, A.y, 5 + th * 1.6, ELEC, gl * a);
  }
}
// chisporroteo corto alrededor de un punto
function arcs(p, cx, cy, r, n, t, k = 0, th = 1) { for (let i = 0; i < n; i++) { const rr = new Rng(sdT(t, k) + i * 31), a = rr.range(0, 6.28), d = r * rr.range(0.5, 1); bdraw(p, bpts(sdT(t, k) + i * 17, cx, cy, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 4, 2), th, 1, 0.15); } }
function hitE(B, R, I, T, big = 1) {
  const P = B.P; B.shake = 2.8 * big; B.stop = 0.07 * big;
  for (let i = 0; i < 14 * big; i++) { const a = R.range(0, 6.28), s = R.range(60, 170); P.add({ kind: 'spark', x: I.x, y: I.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: R.range(0.15, 0.32), rp: YEL, gc: ELEC }); }
  P.ring({ x: I.x, y: I.y, r0: 1, r1: 13 * big, th: 2, life: 0.2, rp: YEL, ry: 1, layer: 'front' });
  P.ring({ x: T.x, y: GY, r0: 2, r1: 17 * big, th: 2, life: 0.35, rp: YEL, ry: 0.32 });
  for (let i = 0; i < 4; i++) P.add({ kind: 'smoke', x: T.x + R.range(-6, 6), y: T.y - R.range(5, T.h), vx: R.range(-8, 8), vy: R.range(-20, -8), life: R.range(0.5, 0.9), r0: 1.5, r1: 4, a0: 0.35, layer: 'back' });
}
const reactE = (k, amp, dur = 0.4) => (k < 0 ? act({}) : act({ dx: k < dur ? Math.sin(k * 90) * 1.7 * (1 - k / dur) + kf(k, [[0, 0], [0.06, amp], [0.4, 0]]) : 0, sy: kf(k, [[0, 1], [0.05, 0.84], [0.16, 1.06], [0.4, 1]]), sx: kf(k, [[0, 1], [0.05, 1.12], [0.16, 0.96], [0.4, 1]]), flash: k < 0.3 ? 0.4 * (Math.floor(k * 45) % 2) : 0, tint: [255, 230, 80], tintA: k < 0.9 ? 0.4 * clamp(1 - k / 0.9) : 0 }));

// ───────────── Centella (Eléctrico · básico · proyectil) ─────────────
function centella(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.55 }, I = { x: T.x - T.w * 0.3, y: T.y - T.h * 0.5 };
  const T_REL = 0.32, FLY = 0.17, T_HIT = T_REL + FLY; let hit = false, orb = null, n = 0;
  B.S.at(T_REL, () => { B.shake = 0.8; for (let i = 0; i < 8; i++) P.add({ kind: 'spark', x: M.x, y: M.y, vx: R.range(40, 150), vy: R.range(-40, 40), life: 0.18, rp: YEL, gc: ELEC }); });
  B.S.at(T_HIT, () => { hit = true; hitE(B, R, I, T, 1); });
  return dur4(B, 1.6, {
    update(dt) { B.tick(dt); const t = B.t; if (t >= T_REL && t < T_HIT) { const u = (t - T_REL) / FLY; orb = { x: lerp(M.x, I.x, u), y: lerp(M.y, I.y, u) + Math.sin(u * 40) * 2 }; n -= dt; if (n <= 0) { n = 0.01; P.add({ kind: 'spark', x: orb.x, y: orb.y, vx: R.range(-30, 30), vy: R.range(-30, 30), life: 0.14, rp: YEL, gc: ELEC }); } } else orb = null; },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; p.disc(M.x, M.y, 1 + 2 * u, YEL[4]); p.glow(M.x, M.y, 6 + 8 * u, ELEC, 0.5 * u); arcs(p, M.x, M.y, 4 + 7 * u, 3, t, 1); }
        if (orb) { bdraw(p, bpts(sdT(t, 2), orb.x - 14, orb.y, orb.x, orb.y, 5, 2.5), 1, 1, 0.1); p.disc(orb.x, orb.y, 2.6, YEL[3]); p.disc(orb.x, orb.y, 1.4, YEL[5]); p.glow(orb.x, orb.y, 12, ELEC, 0.7); arcs(p, orb.x, orb.y, 6, 3, t, 3); p.glow(orb.x, GY, 8, ELEC, 0.25); }
        if (hit) { const k = t - T_HIT; if (k < 0.3) { arcs(p, I.x, I.y, 16, 6, t, 4, 1); if (k < 0.1) p.glow(I.x, I.y, 20, ELEC, 0.4 * (1 - k / 0.1)); } }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sx: kf(t, [[0, 1], [T_REL, 1.1]]), sy: kf(t, [[0, 1], [T_REL, 0.9]]), tintA: 0.3 * (t / T_REL), tint: [255, 230, 80] } : { sx: kf(r, [[0, 1.1], [0.05, 0.9], [0.25, 1]]), sy: kf(r, [[0, 0.9], [0.05, 1.12], [0.25, 1]]), dx: kf(r, [[0, 0], [0.05, -2.5], [0.3, 0]]), tintA: 0.25 * clamp(1 - r / 0.25), tint: [255, 230, 80] }); } return reactE(t - T_HIT, 4); },
  });
}

// ───────────── Sacudida (Eléctrico · básico · contacto) ─────────────
function sacudida(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const LAND = T.x - (T.w + F.w) * 0.5 + 1, T_W = 0.22, T_D = 0.07, T_C = T_W + T_D, T_B2 = T_C + 0.4, C = { x: T.x - 2, y: T.y - T.h * 0.5 };
  const x = (t) => (t < T_W ? F.x - 2 * smooth(t / T_W) : t < T_C ? lerp(F.x - 2, LAND, ei((t - T_W) / T_D)) : t < T_B2 ? LAND : lerp(LAND, F.x, smooth((t - T_B2) / 0.25)));
  const ghosts = []; let hit = false, n = 0;
  B.S.at(T_C + 0.02, () => { hit = true; hitE(B, R, C, T, 1.1); for (let i = 0; i < 3; i++) P.add({ kind: 'sparkle', x: T.x + R.range(-6, 6), y: T.y - T.h - 3, vx: R.range(-8, 8), vy: -4, life: 0.8, len: 1.6, rp: YEL }); });
  return dur4(B, 1.6, {
    update(dt) { B.tick(dt); const t = B.t; if (t < T_C) { n -= dt; if (n <= 0) { n = t < T_W ? 0.05 : 0.012; if (t >= T_W) ghosts.push({ x: x(t), a: 0 }); } } ghosts.forEach((g) => (g.a += dt)); },
    draw(p, layer) {
      const t = B.t, cx = x(t);
      if (layer === 'back') ghosts.forEach((g) => { if (g.a < 0.14) p.sprite(ctx.sprites.caster, g.x, F.y, { flat: YEL[3], alpha: 0.85 * (1 - g.a / 0.14), sx: 1.08, sy: 0.94 }); });
      if (layer === 'front') {
        if (t < T_C) { arcs(p, cx, F.y - F.h * 0.5, 8 + 6 * clamp(t / T_W), 3, t, 5); p.glow(cx, F.y - F.h * 0.5, 14, ELEC, 0.3 * clamp(t / T_W)); }
        if (hit) { const k = t - T_C - 0.02; if (k < 0.3) { arcs(p, C.x, C.y, 15, 5, t, 6, k < 0.12 ? 2 : 1); if (k < 0.1) p.glow(C.x, C.y, 22, ELEC, 0.4 * (1 - k / 0.1)); } }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const dx = x(t) - F.x; let sx = 1, sy = 1; if (t < T_W) { sy = kf(t, [[0, 1], [T_W, 0.82]]); sx = kf(t, [[0, 1], [T_W, 1.15]]); } else if (t < T_C) { sx = 1.2; sy = 0.9; } return act({ dx, sx, sy, tintA: t < T_C + 0.1 ? 0.3 : 0.12, tint: [255, 230, 80], flash: t > T_C && t < T_C + 0.1 ? 0.3 : 0 }); } return reactE(t - (T_C + 0.02), 5); },
  });
}

// ───────────── Cadena voltaica (Eléctrico · habilidad · salta entre objetivos) ─────────────
function cadena(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.4, y: F.y - F.h * 0.55 }, I = { x: T.x - T.w * 0.2, y: T.y - T.h * 0.5 };
  const P2 = { x: T.x + 24, y: GY - 12 }, P3 = { x: T.x - 12, y: GY - 34 };
  const T_C = 0.5, T_J2 = 0.62, T_J3 = 0.76, T_J4 = 0.9, T_OFF = 1.25, J = [T_C, T_J2, T_J3, T_J4]; const hits = [];
  const hitAt = (q, big) => { hits.push({ t: B.t, q }); B.shake = 2 + big; B.stop = 0.04 * big; for (let i = 0; i < 10; i++) { const a = R.range(0, 6.28), s = R.range(50, 140); P.add({ kind: 'spark', x: q.x, y: q.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 15, life: 0.25, rp: YEL, gc: ELEC }); } P.ring({ x: q.x, y: GY, r0: 2, r1: 12, th: 2, life: 0.3, rp: YEL, ry: 0.32 }); };
  B.S.at(T_C, () => hitAt(I, 1.2)); B.S.at(T_J2, () => hitAt(P2, 1)); B.S.at(T_J3, () => hitAt(P3, 1)); B.S.at(T_J4, () => hitAt(I, 1.4));
  return dur4(B, 2.0, {
    update(dt) { B.tick(dt); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_C) { const u = t / T_C; arcs(p, M.x, M.y, 4 + 8 * u, 3, t, 1); p.glow(M.x, M.y, 8 + 8 * u, ELEC, 0.5 * u); p.disc(M.x, M.y, 1 + 2 * u, YEL[4]); }
        const segs = [[M, I, T_C, 2], [I, P2, T_J2, 2], [P2, P3, T_J3, 2], [P3, I, T_J4, 2]];
        segs.forEach(([a, b, t0, th], i) => { if (t >= t0 && t < T_OFF - (3 - i) * 0.04) { const bp = bpts(sdT(t, i), a.x, a.y, b.x, b.y, 9, 5); bdraw(p, bp, th, 1, 0.3); if (i > 0 || true) { const m = bp[4]; bdraw(p, bpts(sdT(t, i + 9), m.x, m.y, m.x + R.range(-8, 8) * 0 + (i % 2 ? 9 : -9), m.y - 7, 4, 2), 1, 1, 0.1); } } });
        hits.forEach((h) => { const k = t - h.t; if (k < 0.3) { arcs(p, h.q.x, h.q.y, 13, 4, t, 7, 1); if (k < 0.1) p.glow(h.q.x, h.q.y, 18, ELEC, 0.4 * (1 - k / 0.1)); } });
        [P2, P3].forEach((q, i) => { const k = t - (i ? T_J3 : T_J2); if (k > 0 && k < 0.6) { p.disc(q.x, q.y, 1.5, YEL[4]); p.glow(q.x, q.y, 10, ELEC, 0.4 * (1 - k / 0.6)); } });
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_C; return act(t < T_C ? { sx: kf(t, [[0, 1], [T_C, 1.12]]), sy: kf(t, [[0, 1], [T_C, 0.88]]), tintA: 0.3 * (t / T_C), tint: [255, 230, 80] } : { sx: kf(r, [[0, 1.12], [0.06, 0.92], [0.4, 1]]), sy: kf(r, [[0, 0.88], [0.06, 1.1], [0.4, 1]]), tintA: t < T_OFF ? 0.25 : 0.25 * clamp(1 - (t - T_OFF) / 0.3), tint: [255, 230, 80] }); } if (t < T_C) return act({}); const k = t - T_C; return act({ dx: t < T_OFF + 0.1 ? Math.sin(t * 90) * 1.6 : 0, flash: t < T_OFF ? 0.55 * (Math.floor(t * 40) % 2) : 0, tint: [255, 230, 80], tintA: 0.4 * clamp(1 - Math.max(0, t - T_OFF) / 0.6), sy: 1 - 0.05 * Math.sin(k * 30) * (t < T_OFF ? 1 : 0) }); },
  });
}

// ───────────── Red estática (Eléctrico · habilidad · área, ralentiza) ─────────────
function red(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_C = 0.5, T_X = 0.62, T_END = 2.6, RMAX = 74; let n = 0;
  const rad = (t) => RMAX * eo((t - T_X) / 0.6);
  B.S.at(T_X, () => { B.shake = 2.4; B.stop = 0.05; P.ring({ x: F.x, y: GY, r0: 3, r1: RMAX, th: 3, life: 0.6, rp: YEL, ry: 0.32, layer: 'front' }); for (let i = 0; i < 20; i++) P.add({ kind: 'spark', x: F.x + R.range(-6, 6), y: GY - 2, vx: R.range(-120, 160), vy: R.range(-50, -5), g: 120, life: R.range(0.25, 0.5), rp: YEL, gc: ELEC }); });
  return dur4(B, 3.0, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_X && t < T_END - 0.3) { n -= dt; if (n <= 0) { n = 0.05; const a = R.range(0, 6.28), r = rad(t) * R.range(0.3, 1); P.add({ kind: 'spark', x: F.x + Math.cos(a) * r * 1.0, y: GY - Math.abs(Math.sin(a)) * r * 0.16, vx: R.range(-10, 10), vy: R.range(-40, -10), g: 60, life: R.range(0.2, 0.4), rp: YEL, gc: ELEC }); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back' && t > T_X) { const r = rad(t), a = clamp((T_END - t) / 0.6); for (let y = -8; y <= 8; y++) for (let x = -Math.ceil(r); x <= r; x++) { const d = (x / r) ** 2 + (y / (r * 0.16)) ** 2; if (d < 1 && d > 0.55 && h2(x, y, Math.floor(t * 8)) < 0.22 * a) p.dark(F.x + x, GY + y * 0.5, 0.4); } }
      if (layer === 'front') {
        if (t < T_X) { const u = t / T_X; arcs(p, F.x, F.y - F.h * 0.4, 6 + 10 * u, 3, t, 3); p.glow(F.x, F.y - F.h * 0.5, 12 + 6 * u, ELEC, 0.4 * u); }
        if (t > T_X && t < T_END) {
          const r = rad(t), a = clamp((T_END - t) / 0.6);
          for (let i = 0; i < 7; i++) { const ang = i * 0.45 - 0.2, ex = F.x + Math.cos(ang) * r, ey = GY - 2 + Math.sin(ang) * r * 0.16; bdraw(p, bpts(sdT(t, i), F.x, GY - 3, ex, ey, 10, 3), 1, a, 0.1); }
          p.ring(F.x, GY, r, 1, YEL[3], 0.16, a); p.ring(F.x, GY, r * 0.7, 1, YEL[2], 0.16, a * 0.7);
          for (let i = 0; i < 5; i++) { const ox = T.x + (i - 2) * 6; if (Math.abs(ox - F.x) < r) bdraw(p, bpts(sdT(t, 20 + i), ox, GY, ox + (i - 2) * 1.5, GY - 6 - 8 * (i % 2), 4, 2), 1, a, 0.1); }
          p.glow(F.x + r * 0.5, GY - 3, r * 0.6, ELEC, 0.06 * a);
        }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_X; return act(t < T_X ? { sy: kf(t, [[0, 1], [T_C, 0.84], [T_X, 0.84]]), sx: kf(t, [[0, 1], [T_C, 1.14], [T_X, 1.14]]), tintA: 0.3 * clamp(t / T_C), tint: [255, 230, 80] } : { sy: kf(r, [[0, 0.84], [0.1, 1.12], [0.35, 1]]), sx: kf(r, [[0, 1.14], [0.1, 0.92], [0.35, 1]]), tintA: 0.25 * clamp(1 - r / 0.6), tint: [255, 230, 80] }); }
      const arr = (F.x + RMAX * 0.9 > T.x) ? T_X + 0.5 : 9; if (t < arr) return act({}); const k = t - arr, a = clamp(k / 0.2) * clamp((T_END - t) / 0.6); return act({ dx: Math.sin(t * 70) * 1.2 * clamp(1 - k / 0.5), flash: k < 0.25 ? 0.55 * (Math.floor(k * 45) % 2) : 0, tint: [255, 230, 90], tintA: 0.35 * a, sy: 1 - 0.03 * a, sx: 1 + 0.03 * a }); },
  });
}

// ───────────── Tormenta eléctrica (Eléctrico · especial · zona) ─────────────
function tormentaE(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_CL = 0.55, T_TEL = 1.0, STR = [1.5, 1.78, 2.0, 2.2, 2.4, 2.7], SX = [-22, 14, -8, 24, -28, 0], T_END = 4.0, CY = 13; const marks = [], hits = [];
  STR.forEach((tt, i) => B.S.at(tt, () => { const x = T.x + SX[i], last = i === STR.length - 1; hits.push({ t: tt, x, last }); marks.push({ x, a: 1 }); B.shake = last ? 5 : 2.4; B.stop = last ? 0.12 : 0.04; for (let j = 0; j < (last ? 22 : 10); j++) { const a = R.range(-3.1, 0), s = R.range(60, 180); P.add({ kind: 'spark', x, y: GY - 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 220, life: R.range(0.2, 0.5), rp: YEL, gc: ELEC }); } P.ring({ x, y: GY, r0: 2, r1: last ? 30 : 16, th: 2, life: 0.4, rp: YEL, ry: 0.32, layer: 'front' }); for (let j = 0; j < 4; j++) P.add({ kind: 'smoke', x: x + R.range(-4, 4), y: GY - 2, vx: R.range(-8, 8), vy: R.range(-24, -10), life: R.range(0.6, 1.1), r0: 1.5, r1: 5, a0: 0.4, layer: 'back' }); }));
  B.S.at(T_TEL, () => { B.shake = 0.6; P.ring({ x: T.x, y: GY, r0: 3, r1: 34, th: 2, life: 0.5, rp: YEL, ry: 0.32, layer: 'front' }); });
  const cloud = (p, t) => { const g = eo((t - T_CL) / 0.6) * (t > T_END - 0.7 ? clamp((T_END - t) / 0.7) : 1); if (g <= 0) return g; const fl = hits.some((h) => t - h.t < 0.1) ? 1 : 0; for (let i = 0; i < 9; i++) { const x = T.x - 42 + i * 8.5 + Math.sin(t * 0.8 + i) * 2, r = (6 + (i % 3) * 3) * g; p.disc(x, CY - 1 + (i % 2) * 2, r, SMOKE[fl ? 3 : 1 + (i % 2)]); p.disc(x - 1, CY - 3 + (i % 2) * 2, r * 0.7, SMOKE[fl ? 4 : 2]); } if (fl) p.glow(T.x, CY + 4, 50, ELEC, 0.18); return g; };
  return dur4(B, 4.4, {
    update(dt) { B.tick(dt); marks.forEach((m) => (m.a = Math.max(0, m.a - dt / 2.2))); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') { marks.forEach((m) => { for (let y = -1; y <= 1; y++) for (let x = -5; x <= 5; x++) if ((x / 5) ** 2 + (y / 1.4) ** 2 < 1) p.dark(m.x + x, GY + y, 0.5 * m.a); }); }
      if (layer === 'front') {
        if (t > T_CL) { const g = cloud(p, t); if (g > 0.4 && t < T_END - 0.7 && Math.floor(t * 9) % 3 === 0) { const x = T.x - 20 + (Math.floor(t * 9) * 13) % 40; bdraw(p, bpts(sdT(t, 3), x, CY, x + 8, CY + 9, 4, 2), 1, 0.7, 0.1); } }
        if (t > T_TEL && t < STR[0]) { const u = (t - T_TEL) / (STR[0] - T_TEL); p.ring(T.x, GY, 34 * (1 - 0.3 * u), 1, YEL[3], 0.32, 0.6 + 0.4 * u); }
        if (t < T_CL) { const u = t / T_CL; p.glow(F.x, F.y - F.h * 0.5, 12, ELEC, 0.3 * u); arcs(p, F.x, F.y - F.h * 0.6, 8, 2, t, 4); }
        hits.forEach((h) => { const k = t - h.t; if (k < 0.2) { const th = h.last ? 5 : 3, a = 1 - k / 0.2; bdraw(p, bpts(sdT(t, 5 + (h.x | 0)), h.x, CY + 3, h.x, GY, 12, h.last ? 7 : 5), th, a, 0.35); const m = bpts(sdT(t, 8), h.x, CY + 8, h.x + (h.x % 2 ? 14 : -14), CY + 24, 5, 3); bdraw(p, m, 1, a, 0.1); p.glow(h.x, GY - 2, h.last ? 44 : 26, ELEC, (h.last ? 0.65 : 0.45) * a); if (h.last) p.glow(T.x, T.y - T.h * 0.5, 30, [255, 255, 255], 0.25 * a); } });
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_CL ? { sy: kf(t, [[0, 1], [T_CL, 1.14]]), sx: kf(t, [[0, 1], [T_CL, 0.92]]), dy: -1.5 * smooth(t / T_CL), tintA: 0.3 * (t / T_CL), tint: [255, 230, 80] } : { sy: kf(t - T_CL, [[0, 1.14], [0.1, 0.86], [0.35, 1]]), sx: kf(t - T_CL, [[0, 0.92], [0.1, 1.1], [0.35, 1]]), dy: kf(t - T_CL, [[0, -1.5], [0.1, 0]]), tintA: 0.2 * clamp(1 - (t - T_CL) / 0.4), tint: [255, 230, 80] });
      let dx = 0, fl = 0, ta = 0; hits.forEach((h) => { const k = t - h.t, near = Math.abs(h.x - T.x) < 14 || h.last; if (k >= 0 && k < 0.5 && near) { dx += Math.sin(k * 90) * 1.6 * (1 - k / 0.5); fl = Math.max(fl, k < 0.25 ? 0.6 * (Math.floor(k * 45) % 2) : 0); ta = Math.max(ta, 0.4 * (1 - k / 0.5)); } }); const last = hits.length === STR.length ? t - hits[STR.length - 1].t : -1; const o = { dx, flash: fl, tint: [255, 230, 80], tintA: ta }; if (last >= 0) { o.dx += kf(last, [[0, 0], [0.08, 7], [0.6, 0]]); o.sy = kf(last, [[0, 1], [0.05, 0.78], [0.18, 1.1], [0.42, 1]]); o.sx = kf(last, [[0, 1], [0.05, 1.18], [0.18, 0.95], [0.42, 1]]); o.tintA = Math.max(ta, 0.35 * clamp(1 - last / 1.2)); } return act(o); },
  });
}

// ───────────── Rayo cenital (Eléctrico · especial · golpe vertical) ─────────────
function cenital(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const X = T.x - 2, CT = T.y - T.h * 0.5, T_CH = 1.05, T_S = 1.3, T_OFF = T_S + 0.42; let hit = false, n = 0;
  B.S.at(T_CH, () => { B.shake = 0.6; });
  B.S.at(T_S, () => {
    hit = true; B.shake = 6.5; B.stop = 0.15;
    P.ring({ x: X, y: GY, r0: 2, r1: 44, th: 3, life: 0.5, rp: YEL, ry: 0.32, layer: 'front' }); P.ring({ x: X, y: CT, r0: 2, r1: 26, th: 2, life: 0.3, rp: YEL, ry: 1, layer: 'front' });
    for (let i = 0; i < 30; i++) { const a = R.range(-3.1, 0), s = R.range(80, 220); P.add({ kind: 'spark', x: X, y: GY - 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 240, life: R.range(0.25, 0.7), rp: YEL, gc: ELEC }); }
    for (let i = 0; i < 12; i++) P.add({ kind: 'dust', x: X + R.range(-14, 14), y: GY - 1, vx: R.range(-50, 50), vy: R.range(-20, -4), life: R.range(0.4, 0.8), r0: 1, r1: 5, layer: 'back' });
    for (let i = 0; i < 6; i++) P.add({ kind: 'smoke', x: X + R.range(-8, 8), y: GY - 4, vx: R.range(-10, 10), vy: R.range(-30, -12), life: R.range(0.9, 1.5), r0: 2, r1: 7, a0: 0.5, layer: 'back' });
  });
  return dur4(B, 3.2, {
    update(dt) { B.tick(dt); const t = B.t; if (hit && t > T_S + 0.3 && t < 2.5) { n -= dt; if (n <= 0) { n = 0.05; P.add({ kind: 'spark', x: X + R.range(-T.w * 0.5, T.w * 0.5), y: T.y - R.range(2, T.h), vx: R.range(-30, 30), vy: R.range(-40, -5), g: 80, life: 0.25, rp: YEL, gc: ELEC }); } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') { if (hit) { const a = clamp(1 - (t - T_S) / 1.8); for (let y = -3; y <= 3; y++) for (let x = -16; x <= 16; x++) { const d = (x / 16) ** 2 + (y / 3) ** 2, nn = fbm((X + x) * 0.3, (GY + y) * 0.5, 12); if (d + (nn - 0.5) * 0.6 < 1) p.dark(X + x, GY + y, 0.65 * a); } } }
      if (layer === 'front') {
        if (t < T_S) { const u = clamp((t - 0.4) / (T_S - 0.4)); p.glow(F.x, F.y - F.h * 0.5, 12 + 6 * u, ELEC, 0.4 * u); arcs(p, F.x, F.y - F.h * 0.5, 8 + 6 * u, 3, t, 2); }
        if (t > T_CH - 0.4 && t < T_S) { const u = (t - T_CH + 0.4) / (T_S - T_CH + 0.4); p.ring(X, GY, 20 - 8 * u, 1, YEL[3], 0.32, 0.5 + 0.5 * u); p.ring(X, GY, 12 - 4 * u, 1, YEL[2], 0.32, 0.5 + 0.5 * u); for (let y = 0; y < GY; y += 4) if (h2(y, Math.floor(t * 20), 4) < 0.2 + 0.5 * u) p.px(X, y, YEL[3]); for (let i = 0; i < 3; i++) bdraw(p, bpts(sdT(t, i), X + R.range(-14, 14) * 0 + (i - 1) * 6, 0, X + (i - 1) * 3, 14, 5, 3), 1, 0.6 * u, 0.05); }
        if (t >= T_S && t < T_OFF) {
          const a = 1 - clamp((t - T_S - 0.2) / 0.22) * 0.8; const bp = bpts(sdT(t, 4), X, -4, X, GY - 1, 14, 6); bdraw(p, bp, 5, a, 0.5);
          for (let i = 0; i < 4; i++) { const m = bp[3 + i * 2]; bdraw(p, bpts(sdT(t, 20 + i), m.x, m.y, m.x + (i % 2 ? 22 : -22) * R.range(0.5, 1) * 0 + (i % 2 ? 20 : -20), m.y + 16 + i * 3, 6, 4), 2, a, 0.2); }
          p.glow(X, CT, 56, ELEC, 0.42 * a); p.glow(X, GY, 52, [255, 255, 255], 0.2 * Math.max(0, 1 - (t - T_S) / 0.18));
        }
        if (hit && t > T_S + 0.2 && t < 2.6) { const a = clamp(1 - (t - T_S - 0.2) / 1.2); arcs(p, X, CT, T.w * 0.7, 4, t, 6); p.glow(X, CT, 24, ELEC, 0.2 * a); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_S; return act(t < T_S ? { sy: kf(t, [[0, 1], [0.6, 1.14], [T_S, 1.2]]), sx: kf(t, [[0, 1], [0.6, 0.92], [T_S, 0.9]]), dy: -2 * smooth(t / T_S), tintA: 0.35 * clamp(t / 0.8), tint: [255, 230, 80] } : { sy: kf(r, [[0, 1.2], [0.1, 0.84], [0.4, 1]]), sx: kf(r, [[0, 0.9], [0.1, 1.14], [0.4, 1]]), dy: kf(r, [[0, -2], [0.1, 0]]), tintA: 0.3 * clamp(1 - r / 0.5), tint: [255, 230, 80] }); }
      if (t < T_S - 0.5) return act({}); if (t < T_S) return act({ dx: Math.sin(t * 70) * 0.8 * clamp((t - T_S + 0.5) / 0.5) });
      const k = t - T_S; if (k < 0.4) return act({ flat: undefined, flash: Math.floor(k * 36) % 2 ? 0.9 : 0.1, tint: [20, 20, 30], tintA: Math.floor(k * 36) % 2 ? 0 : 0.7, dx: Math.sin(k * 100) * 1.4, sy: 0.9, sx: 1.08 });
      return act({ dx: kf(k - 0.4, [[0, 0], [0.08, 6], [0.8, 0]]) + Math.sin(k * 70) * 0.8 * clamp(1 - (k - 0.4) / 0.9), sy: kf(k - 0.4, [[0, 0.82], [0.2, 1.08], [0.5, 1]]), sx: kf(k - 0.4, [[0, 1.16], [0.2, 0.96], [0.5, 1]]), tint: [255, 230, 80], tintA: 0.35 * clamp(1 - (k - 0.4) / 1.4), flash: 0 }); },
  });
}

// ───────────── Jaula de chispas (Eléctrico · defensa · propia) ─────────────
function jaula(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: F.x, y: F.y - F.h * 0.5 }, RX = F.w * 0.7 + 2, TOPY = F.y - F.h - 4, T_ON = 0.45, T_DASH = 1.4, T_C = 1.54, T_OFF = 2.8, T_END = 3.3;
  const DASH = (T.x - F.x) - (F.w * 0.5 + T.w * 0.5) - 1, IM = { x: F.x + RX, y: C.y };
  const ex = (t) => (t < T_DASH ? (t > T_DASH - 0.35 ? 1.5 * smooth((t - T_DASH + 0.35) / 0.35) : 0) : t < T_C ? lerp(1.5, -DASH, ei((t - T_DASH) / (T_C - T_DASH))) : t < T_C + 0.75 ? -DASH + 1.5 * Math.sin((t - T_C) * 40) * 0 : -DASH + DASH * smooth((t - T_C - 0.75) / 0.45));
  let hit = false;
  B.S.at(T_ON, () => { B.shake = 0.6; for (let i = 0; i < 10; i++) P.add({ kind: 'spark', x: F.x + R.range(-RX, RX), y: GY - R.range(0, F.h), vx: R.range(-30, 30), vy: R.range(-60, -10), g: 100, life: 0.3, rp: YEL, gc: ELEC }); });
  B.S.at(T_C, () => { hit = true; B.shake = 3.6; B.stop = 0.1; for (let i = 0; i < 16; i++) { const a = R.range(-1.6, 1.6), s = R.range(70, 170); P.add({ kind: 'spark', x: IM.x, y: IM.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.2, 0.4), rp: YEL, gc: ELEC }); } P.ring({ x: IM.x, y: IM.y, r0: 1, r1: 14, th: 2, life: 0.22, rp: YEL, ry: 1, layer: 'front' }); });
  const pole = (i) => { const a = Math.PI + (i / 6) * Math.PI * 1; return { x: C.x + Math.cos(a) * RX, ph: a }; };
  return dur4(B, 3.5, {
    update(dt) { B.tick(dt); },
    draw(p, layer) {
      const t = B.t, g = clamp((t - T_ON) / 0.4) * (t > T_OFF ? clamp((T_END - t) / (T_END - T_OFF)) : 1);
      if (layer === 'front') {
        if (g > 0) {
          for (let i = 0; i <= 6; i++) { const x = C.x - RX + (i / 6) * RX * 2, ty = TOPY + 2 + Math.abs(i - 3) * 2.2; bdraw(p, bpts(sdT(t, i), x, GY - 1, x, ty, 6, 1.8), 1, g, 0.12); }
          for (let i = 0; i < 6; i++) { const x0 = C.x - RX + (i / 6) * RX * 2, x1 = C.x - RX + ((i + 1) / 6) * RX * 2; bdraw(p, bpts(sdT(t, 10 + i), x0, TOPY + 2 + Math.abs(i - 3) * 2.2, x1, TOPY + 2 + Math.abs(i + 1 - 3) * 2.2, 4, 1.4), 1, g, 0.08); }
          p.glow(C.x, C.y, 24, ELEC, 0.18 * g);
          if (hit) { const k = t - T_C; if (k < 0.5) { for (let i = 0; i < 4; i++) bdraw(p, bpts(sdT(t, 30 + i), IM.x, IM.y + (i - 1.5) * 6, IM.x + 10, IM.y + (i - 1.5) * 8, 5, 3), 2, 1 - k / 0.5, 0.2); if (k < 0.1) p.glow(IM.x, IM.y, 18, ELEC, 0.22 * (1 - k / 0.1)); } }
        }
        if (t > T_C && t < T_C + 0.75) arcs(p, T.x + ex(t), T.y - T.h * 0.5, T.w * 0.7, 3, t, 7);
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const k = t - T_C; return act(t < T_ON ? {} : t < T_C ? { sy: 0.96, sx: 1.04, tint: [255, 230, 80], tintA: 0.2 * clamp((t - T_ON) / 0.3) } : { dx: kf(k, [[0, 0], [0.07, 0.8], [0.4, 0]]), tint: [255, 230, 80], tintA: 0.15 * clamp(1 - k / 0.6) }); }
      const dx = ex(t); if (t < T_DASH) return act({ dx, sx: t > T_DASH - 0.35 ? kf(t, [[T_DASH - 0.35, 1], [T_DASH, 0.9]]) : 1, sy: t > T_DASH - 0.35 ? kf(t, [[T_DASH - 0.35, 1], [T_DASH, 1.1]]) : 1 });
      if (t < T_C) return act({ dx, sx: 1.18, sy: 0.9 });
      const k = t - T_C; if (k < 0.75) return act({ dx: dx + Math.sin(k * 100) * 1.5, flash: Math.floor(k * 40) % 2 ? 0.7 : 0, tint: [255, 230, 80], tintA: 0.45 * clamp(1 - k / 0.75), sy: 1.04 - 0.1 * Math.sin(k * 80) * 0, sx: 1.04 });
      return act({ dx });
    },
  });
}

// ───────────── Pulso veloz (Eléctrico · apoyo · sube velocidad) ─────────────
function pulso(ctx) {
  const R = ctx.R, F = ctx.from, A = ctx.to, B = base(ctx), P = B.P;
  const S0 = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.6 }, AC = { x: A.x, y: A.y - A.h * 0.5 };
  const T_REL = 0.45, FLY = 0.3, T_L = T_REL + FLY, T_DASH = 1.5, DDX = -14, ghosts = []; let orb = null, n = 0, m = 0, aura = 0;
  B.S.at(T_REL, () => { B.shake = 0.5; for (let i = 0; i < 8; i++) P.add({ kind: 'spark', x: S0.x, y: S0.y, vx: R.range(30, 120), vy: R.range(-40, 40), life: 0.2, rp: YEL, gc: ELEC }); });
  B.S.at(T_L, () => { aura = 1; B.shake = 1; P.ring({ x: A.x, y: A.y, r0: 3, r1: 17, th: 2, life: 0.45, rp: YEL, ry: 0.32 }); for (let i = 0; i < 12; i++) P.add({ kind: 'spark', x: A.x + R.range(-A.w * 0.5, A.w * 0.5), y: A.y - R.range(2, A.h), vx: R.range(-30, 30), vy: R.range(-60, -10), g: 60, life: 0.35, rp: YEL, gc: ELEC }); });
  [0.0, 0.18, 0.36].forEach((d) => B.S.at(T_L + 0.2 + d, () => { for (let k = 0; k < 3; k++) P.add({ kind: 'chev2', x: A.x - 6 + k * 6, y: A.y - A.h - 2 - k * 2, vx: 0, vy: -16, life: 0.85 }); }));
  const dashX = (t) => (t < T_DASH ? 0 : t < T_DASH + 0.12 ? lerp(0, DDX, ei((t - T_DASH) / 0.12)) : t < T_DASH + 0.3 ? DDX : lerp(DDX, 0, smooth((t - T_DASH - 0.3) / 0.14)));
  return dur4(B, 3.0, {
    update(dt) { B.tick(dt); const t = B.t; if (t >= T_REL && t < T_L) { const u = (t - T_REL) / FLY; orb = { x: lerp(S0.x, AC.x, u), y: lerp(S0.y, AC.y, u) - Math.sin(Math.PI * u) * 14 }; n -= dt; if (n <= 0) { n = 0.012; P.add({ kind: 'spark', x: orb.x, y: orb.y, vx: R.range(-20, 20), vy: R.range(-20, 20), life: 0.15, rp: YEL, gc: ELEC }); } } else orb = null;
      if (t > T_DASH - 0.05 && t < T_DASH + 0.5) { m -= dt; if (m <= 0) { m = 0.02; ghosts.push({ x: A.x + dashX(t), a: 0 }); P.add({ kind: 'spark', x: A.x + dashX(t) + A.w * 0.5, y: A.y - R.range(2, A.h), vx: R.range(20, 70), vy: 0, life: 0.18, rp: YEL, gc: ELEC }); } } ghosts.forEach((g) => (g.a += dt)); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') ghosts.forEach((g) => { if (g.a < 0.16) p.sprite(ctx.sprites.target, g.x, A.y, { flat: YEL[3], alpha: 0.5 * (1 - g.a / 0.16) }); });
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; p.glow(S0.x, S0.y, 8 + 8 * u, ELEC, 0.4 * u); p.disc(S0.x, S0.y, 1 + 2 * u, YEL[4]); arcs(p, S0.x, S0.y, 3 + 6 * u, 3, t, 1); }
        if (orb) { p.disc(orb.x, orb.y, 2.6, YEL[3]); p.disc(orb.x, orb.y, 1.3, YEL[5]); p.glow(orb.x, orb.y, 11, ELEC, 0.7); arcs(p, orb.x, orb.y, 6, 2, t, 3); }
        if (aura && t > T_L && t < T_L + 1.6) { const k = (t - T_L) / 1.6, a = 1 - k; arcs(p, AC.x, AC.y, A.w * 0.9, 3, t, 5); p.glow(AC.x, AC.y, 18, ELEC, 0.25 * a); }
        if (t > T_DASH && t < T_DASH + 0.5) { for (let i = 0; i < 5; i++) { const y = A.y - A.h * (0.2 + i * 0.17), L2 = 10 + (i % 2) * 6, x0 = A.x + dashX(t) + A.w * 0.4 + (i % 3) * 3; p.line(x0, y, x0 + L2, y, YEL[i % 2 ? 4 : 3]); } }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sx: kf(t, [[0, 1], [T_REL, 1.1]]), sy: kf(t, [[0, 1], [T_REL, 0.9]]), tintA: 0.3 * (t / T_REL), tint: [255, 230, 80] } : { sx: kf(r, [[0, 1.1], [0.05, 0.9], [0.25, 1]]), sy: kf(r, [[0, 0.9], [0.05, 1.12], [0.25, 1]]), dx: kf(r, [[0, 0], [0.05, -2], [0.3, 0]]), tintA: 0.25 * clamp(1 - r / 0.25), tint: [255, 230, 80] }); }
      if (t < T_L) return act({}); const k = t - T_L; const vib = k < 1.4 ? Math.sin(t * 90) * 0.5 : 0; return act({ dx: dashX(t) + vib, sx: t > T_DASH && t < T_DASH + 0.3 ? 1.15 : 1, sy: t > T_DASH && t < T_DASH + 0.3 ? 0.92 : 1, flash: k < 0.2 ? 0.25 * (1 - k / 0.2) : 0, tint: [255, 230, 80], tintA: 0.35 * clamp(1 - k / 1.6) }); },
  });
}
// chevrón «>» doble que sube (velocidad), amarillo
const _pd5 = Particles.prototype.draw;
Particles.prototype.draw = function (p, layer) {
  _pd5.call(this, p, layer);
  for (const q of this.a) if (q.kind === 'chev2' && q.layer === layer) { const k = q.age / q.life, a = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1; for (let i = 0; i < 2; i++) { const y = q.y + i * 3; p.dpx(q.x - 1, y - 2, YEL[4], a); p.dpx(q.x, y - 1, YEL[4], a); p.dpx(q.x + 1, y, YEL[3], a); p.dpx(q.x, y + 1, YEL[4], a); p.dpx(q.x - 1, y + 2, YEL[3], a); } p.glow(q.x, q.y, 7, ELEC, 0.3 * a); }
};

(function () {
  const E = '#f2c230', by = Object.fromEntries(MOVES.map((m) => [m.id, m]));
  const add = [
    { id: 'centella', nombre: 'Centella', tipo: 'Básico · proyectil', make: centella, fases: ['Concentra una chispa que crepita', 'Disparo rapidísimo', 'Impacto: destello y arcos', 'El rival se sacude'], uso: 'Básico a media distancia: muy rápido y muy a menudo.' },
    { id: 'sacudida', nombre: 'Sacudida', tipo: 'Básico · contacto', make: sacudida, fases: ['Se carga de electricidad', 'Arremete con estelas', 'Golpe con arcos y descarga', 'El rival queda aturdido un instante'], uso: 'Básico de cuerpo a cuerpo: aturde un instante.' },
    { id: 'cadena', nombre: 'Cadena voltaica', tipo: 'Habilidad · rayo encadenado', make: cadena, fases: ['Concentra la carga', 'Rayo al primer objetivo', 'Salta a un segundo y a un tercero', 'Vuelve al primero con un último latigazo'], uso: 'Habilidad: salta entre 2-3 objetivos (aquí, objetivos de muestra).' },
    { id: 'red', nombre: 'Red estática', tipo: 'Habilidad · área, ralentiza', make: red, fases: ['Se agacha y se carga', 'Onda eléctrica por el suelo', 'Red de arcos sobre la zona', 'Los atrapados quedan ralentizados'], uso: 'Habilidad de control alrededor de la criatura.' },
    { id: 'tormentae', nombre: 'Tormenta eléctrica', tipo: 'Especial · zona, rayos', make: tormentaE, fases: ['Se juntan nubes sobre el rival', 'Aviso: círculo en el suelo', 'Cinco rayos a su alrededor con cicatrices', 'Rayo final sobre el rival'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'cenital', nombre: 'Rayo cenital', tipo: 'Especial · golpe vertical', make: cenital, fases: ['Aviso: columna de luz y círculo', 'Un único rayo enorme cae desde el cielo', 'Onda, destello y cráter chamuscado', 'El rival se ve en negativo y sale despedido'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'jaula', nombre: 'Jaula de chispas', tipo: 'Defensa · propia', make: jaula, fases: ['Barrotes de chispas rodean a la criatura', 'El rival embiste', 'Descarga: queda paralizado un instante', 'Rebota'], uso: 'Hueco de defensa: paraliza un instante a quien la toca.' },
    { id: 'pulso', nombre: 'Pulso veloz', tipo: 'Apoyo · sube la velocidad', make: pulso, fases: ['Carga una chispa', 'La lanza en arco a la aliada', 'Descarga y chevrones de subida', 'La aliada vibra y se mueve más rápido, con estelas'], uso: 'Hueco de apoyo: más velocidad para una aliada.' },
  ].map((m) => Object.assign({ el: 'Eléctrico', col: E, caster: 'fosforin', target: 'pompon' }, m));
  add[7].target = 'aguacato';
  const all = Object.assign({}, by); add.forEach((m) => { all[m.id] = m; });
  const order = MOVES.map((m) => m.id).concat(add.map((m) => m.id));
  MOVES.length = 0; order.forEach((id) => MOVES.push(all[id]));
})();
