// ═════════ SOMBRA (8 movimientos) ═════════
const SH = ramp(['#0e0a1a', '#241638', '#3d2860', '#6a46a0', '#a878d8', '#e0c8ff']);
const SHC = [170, 110, 240], SHT = [90, 50, 150];

const _pd8 = Particles.prototype.draw;
Particles.prototype.draw = function (p, layer) {
  _pd8.call(this, p, layer);
  for (const q of this.a) {
    if (q.layer !== layer) continue; const k = q.age / q.life, a = k < 0.2 ? k / 0.2 : k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
    if (q.kind === 'umbra') { const r = lerp(q.r0, q.r1, eo(k)); p.disc(q.x, q.y, r, SH[1], a * (q.a0 || 0.7)); p.disc(q.x - r * 0.25, q.y - r * 0.3, r * 0.6, SH[2], a * (q.a0 || 0.7) * 0.7); if (q.rim) p.dpx(q.x - r * 0.6, q.y - r * 0.6, SH[4], a * 0.8); }
    else if (q.kind === 'chevD') { for (let i = 0; i < 2; i++) { const y = q.y + i * 3; p.dpx(q.x - 2, y - 1, SH[4], a); p.dpx(q.x - 1, y, SH[4], a); p.dpx(q.x, y + 1, SH[5], a); p.dpx(q.x + 1, y, SH[4], a); p.dpx(q.x + 2, y - 1, SH[4], a); } p.glow(q.x, q.y, 7, SHC, 0.25 * a); }
  }
};
const reactS = (k, amp, dur = 0.5) => (k < 0 ? act({}) : act({ dx: kf(k, [[0, 0], [0.07, amp], [dur, 0]]), sy: kf(k, [[0, 1], [0.05, 0.84], [0.16, 1.07], [0.4, 1]]), sx: kf(k, [[0, 1], [0.05, 1.12], [0.16, 0.96], [0.4, 1]]), flash: 0.4 * clamp(1 - k / 0.12), tint: SHT, tintA: k < 0.9 ? 0.45 * clamp(1 - k / 0.9) : 0 }));
const wisps = (P, R, x, y, n, sp = 30, up = 30) => { for (let i = 0; i < n; i++) P.add({ kind: 'umbra', x: x + R.range(-4, 4), y: y + R.range(-4, 4), vx: R.range(-sp, sp), vy: -R.range(up * 0.3, up), life: R.range(0.5, 1.0), r0: 1.5, r1: R.range(3, 6), a0: 0.7, rim: R.next() < 0.5, layer: R.next() < 0.5 ? 'front' : 'back' }); };
const hitS = (B, R, I, T, big = 1) => { const P = B.P; B.shake = 2.6 * big; B.stop = 0.07 * big; wisps(P, R, I.x, I.y, 8 * big, 60, 60); for (let i = 0; i < 12 * big; i++) { const a = R.range(0, 6.28), s = R.range(50, 150); P.add({ kind: 'spark', x: I.x, y: I.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: R.range(0.15, 0.3), rp: SH, gc: SHC }); } P.ring({ x: I.x, y: I.y, r0: 1, r1: 7 * big, th: 2, life: 0.18, rp: SH, ry: 1, layer: 'front' }); P.ring({ x: T.x, y: GY, r0: 2, r1: 18 * big, th: 2, life: 0.4, rp: SH, ry: 0.32 }); };
const slashS = (p, x, y, k, a0, L = 12, th = 2) => { const L2 = L * eo(k / 0.07), ca = Math.cos(a0), sa = Math.sin(a0); for (let o = -th + 1; o < th; o++) p.line(x - ca * L2 + o * -sa * 0.6, y - sa * L2 + o * ca * 0.6, x + ca * L2 + o * -sa * 0.6, y + sa * L2 + o * ca * 0.6, o === 0 ? (k < 0.04 ? SH[5] : SH[4]) : SH[3]); };
const eye = (p, x, y, a, s = 1) => { for (const d of [-3, 3]) { for (let i = -1; i <= 1; i++) p.dpx(x + d * s + i, y, SH[5], a); p.dpx(x + d * s, y - 1, SH[4], a * 0.7); p.dpx(x + d * s, y + 1, SH[4], a * 0.7); p.dpx(x + d * s, y, [255, 80, 120].length ? SH[0] : SH[0], a); p.glow(x + d * s, y, 4, [220, 90, 160], 0.3 * a); } };
const tend = (p, pts, th, a = 1) => { const n = pts.length - 1; for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) { const A = pts[i], B2 = pts[i + 1], m = Math.max(1, Math.ceil(Math.hypot(B2.x - A.x, B2.y - A.y))), tp = 1 - 0.6 * (i / n), r = (pass === 0 ? th / 2 + 0.8 : th / 2) * tp; for (let k = 0; k < m; k++) { const u = k / m; p.disc(lerp(A.x, B2.x, u) + (pass ? -0.3 : 0), lerp(A.y, B2.y, u) + (pass ? -0.3 : 0), Math.max(0.5, r), pass === 0 ? SH[1] : SH[2], a); } } };
const sigil = (p, x, y, r, t, a = 1, ry = 0.32) => { p.ring(x, y, r, 1, SH[4], ry, a); p.ring(x, y, r * 0.72, 1, SH[3], ry, a * 0.8); for (let i = 0; i < 8; i++) { const an = i * 0.785 + t * 1.2, c = Math.cos(an), s = Math.sin(an); p.dpx(x + c * r * 0.86, y + s * r * 0.86 * ry, SH[5], a); p.dpx(x + c * r * 0.5, y + s * r * 0.5 * ry, SH[4], a * 0.8); } p.glow(x, y, r * 0.8, SHC, 0.15 * a); };

// ───────────── Garra umbría (Sombra · básico · contacto) ─────────────
function garra(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const LAND = T.x - (T.w + F.w) * 0.5 + 2, T_W = 0.28, T_D = 0.08, T_C = T_W + T_D, T_B2 = T_C + 0.42, C = { x: T.x - 3, y: T.y - T.h * 0.55 };
  const x = (t) => (t < T_W ? F.x - 2 * smooth(t / T_W) : t < T_C ? lerp(F.x - 2, LAND, ei((t - T_W) / T_D)) : t < T_B2 ? LAND : lerp(LAND, F.x, smooth((t - T_B2) / 0.25)));
  const ghosts = []; let hit = false, n = 0; const HT = [T_C + 0.02, T_C + 0.1, T_C + 0.18]; const hts = [];
  HT.forEach((tt, i) => B.S.at(tt, () => { hts.push({ t: tt, a: -0.7 + i * 0.5 }); if (i === 0) hit = true; hitS(B, R, C, T, i === 2 ? 1.2 : 0.7); }));
  return dur4(B, 1.7, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_W - 0.02 && t < T_C) { n -= dt; if (n <= 0) { n = 0.014; ghosts.push({ x: x(t), a: 0 }); } } if (t < T_W) { n -= dt; if (n <= 0) { n = 0.06; wisps(P, R, F.x + R.range(-6, 6), F.y - R.range(0, F.h), 1, 8, 20); } } ghosts.forEach((g) => (g.a += dt)); },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') ghosts.forEach((g) => { if (g.a < 0.16) p.sprite(ctx.sprites.caster, g.x, F.y, { flat: SH[2], alpha: 0.8 * (1 - g.a / 0.16), sx: 1.1, sy: 0.92 }); });
      if (layer === 'front') {
        if (t < T_W) p.glow(F.x, F.y - F.h * 0.5, 14, SHC, 0.2 * (t / T_W));
        hts.forEach((h) => { const k = t - h.t; if (k < 0.22) { slashS(p, C.x, C.y, k, h.a * 1.4 + 0.4, 13, 2); p.glow(C.x, C.y, 12, SHC, 0.14 * (1 - k / 0.22)); } });
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const dx = x(t) - F.x; let sx = 1, sy = 1; if (t < T_W) { sy = kf(t, [[0, 1], [T_W, 0.84]]); sx = kf(t, [[0, 1], [T_W, 1.14]]); } else if (t < T_C) { sx = 1.2; sy = 0.9; } return act({ dx, sx, sy, tint: SHT, tintA: t < T_C + 0.3 ? 0.35 : 0.12, alpha: t > T_W - 0.02 && t < T_C + 0.06 ? 0.75 : 1 }); } let dx = 0, fl = 0, sy = 1; hts.forEach((h, i) => { const k = t - h.t; if (k >= 0 && k < 0.4) { dx += kf(k, [[0, 0], [0.05, 2 + i], [0.4, 0]]); fl = Math.max(fl, 0.4 * clamp(1 - k / 0.1)); sy = Math.min(sy, kf(k, [[0, 1], [0.04, 0.88], [0.2, 1]])); } }); return act({ dx, flash: fl, sy, tint: SHT, tintA: hts.length ? 0.45 * clamp(1 - (t - hts[0].t) / 1.0) : 0 }); },
  });
}

// ───────────── Aguja de sombra (Sombra · básico · proyectil ×3) ─────────────
function aguja(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.45, y: F.y - F.h * 0.55 }, I = { x: T.x - T.w * 0.25, y: T.y - T.h * 0.5 };
  const T_REL = 0.45, FLY = 0.16, GAP = [0, 0.09, 0.18], YS = [-6, 0, 6], hits = []; let n = 0;
  const pos = (i, t) => { const u = clamp((t - T_REL - GAP[i]) / FLY); return { u, x: lerp(M.x + 3, I.x, u), y: lerp(M.y + (i - 1) * 3, I.y + YS[i], u) }; };
  B.S.at(T_REL, () => { B.shake = 0.8; wisps(P, R, M.x, M.y, 5, 40, 20); });
  GAP.forEach((g, i) => B.S.at(T_REL + g + FLY, () => { const q = { x: I.x, y: I.y + YS[i] }; hits.push({ t: B.t, q }); B.shake = 1.6 + i * 0.8; B.stop = 0.03 + (i === 2 ? 0.05 : 0); wisps(P, R, q.x, q.y, 5, 40, 40); for (let j = 0; j < 8; j++) { const a = R.range(0, 6.28), s = R.range(50, 140); P.add({ kind: 'spark', x: q.x, y: q.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.22, rp: SH, gc: SHC }); } P.ring({ x: q.x, y: q.y, r0: 1, r1: 8 + i * 3, th: 2, life: 0.2, rp: SH, ry: 1, layer: 'front' }); }));
  return dur4(B, 1.8, {
    update(dt) { B.tick(dt); const t = B.t; for (let i = 0; i < 3; i++) { const q = pos(i, t); if (q.u > 0 && q.u < 1) { n -= dt; if (n <= 0) { n = 0.015; P.add({ kind: 'umbra', x: q.x - 2, y: q.y + R.range(-1, 1), vx: -20, vy: R.range(-6, 6), life: 0.35, r0: 1.4, r1: 3, a0: 0.8, layer: 'back' }); } } } },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; p.glow(M.x, M.y, 8 + 8 * u, SHC, 0.4 * u); for (let i = 0; i < 3; i++) { const a = t * 8 + i * 2.1, r = 6 * (1 - 0.4 * u); p.line(M.x + Math.cos(a) * r, M.y + Math.sin(a) * r * 0.8, M.x + Math.cos(a) * (r + 5), M.y + Math.sin(a) * (r + 5) * 0.8, SH[4]); } }
        for (let i = 0; i < 3; i++) { const q = pos(i, t); if (q.u > 0 && q.u < 1) { p.line(q.x - 9, q.y - (i - 1) * 1, q.x + 2, q.y, SH[3]); p.line(q.x - 5, q.y, q.x + 3, q.y, SH[5]); p.px(q.x + 3, q.y, SH[5]); p.glow(q.x, q.y, 9, SHC, 0.45); } }
        hits.forEach((h) => { const k = t - h.t; if (k < 0.18) { p.glow(h.q.x, h.q.y, 14, SHC, 0.35 * (1 - k / 0.18)); const L2 = 7 * eo(k / 0.06); p.line(h.q.x - L2, h.q.y - L2, h.q.x + L2, h.q.y + L2, SH[5]); p.line(h.q.x - L2, h.q.y + L2, h.q.x + L2, h.q.y - L2, SH[4]); } });
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sx: kf(t, [[0, 1], [T_REL, 0.92]]), sy: kf(t, [[0, 1], [T_REL, 1.1]]), tintA: 0.35 * (t / T_REL), tint: SHT } : { sx: kf(r, [[0, 0.92], [0.06, 1.12], [0.3, 1]]), sy: kf(r, [[0, 1.1], [0.06, 0.9], [0.3, 1]]), tintA: 0.3 * clamp(1 - r / 0.3), tint: SHT }); } let dx = 0, fl = 0; hits.forEach((h) => { const k = t - h.t; if (k >= 0 && k < 0.4) { dx += kf(k, [[0, 0], [0.05, 2.4], [0.4, 0]]); fl = Math.max(fl, 0.4 * clamp(1 - k / 0.1)); } }); return act({ dx, flash: fl, tint: SHT, tintA: hits.length ? 0.45 * clamp(1 - (t - hits[0].t) / 1.0) : 0 }); },
  });
}

// ───────────── Mal de ojo (Sombra · habilidad · haz, maldice) ─────────────
function malDeOjo(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const M = { x: F.x + F.w * 0.4, y: F.y - F.h * 0.6 }, C = { x: T.x, y: T.y - T.h * 0.5 };
  const T_C = 0.5, T_B = 0.5, T_ARR = 0.78, T_END = 3.0; let n = 0, m = 0, on = 0;
  B.S.at(T_ARR, () => { on = 1; B.shake = 2; B.stop = 0.05; P.ring({ x: T.x, y: GY, r0: 2, r1: 22, th: 2, life: 0.4, rp: SH, ry: 0.32 }); wisps(P, R, C.x, C.y, 10, 40, 40); });
  [1.2, 1.55].forEach((tt) => B.S.at(tt, () => { for (let k = 0; k < 3; k++) P.add({ kind: 'chevD', x: T.x - 6 + k * 6, y: T.y - T.h - 2 + k * 0, vx: 0, vy: 10, life: 0.9 }); }));
  return dur4(B, 3.4, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_B && t < T_END - 0.7) { n -= dt; if (n <= 0) { n = 0.03; const u = R.next(); P.add({ kind: 'spark', x: lerp(M.x, C.x, u) + R.range(-2, 2), y: lerp(M.y, C.y, u) + R.range(-4, 4), vx: R.range(-10, 10), vy: R.range(-10, 10), life: 0.3, rp: SH, gc: SHC }); } } if (on && t < T_END - 0.4) { m -= dt; if (m <= 0) { m = 0.07; P.add({ kind: 'umbra', x: T.x + R.range(-T.w * 0.5, T.w * 0.5), y: T.y - T.h * R.range(0.1, 0.9), vx: R.range(-6, 6), vy: -R.range(10, 24), life: 0.8, r0: 1.5, r1: 3.5, a0: 0.7, rim: true, layer: 'front' }); } } },
    draw(p, layer) {
      const t = B.t, a = on ? clamp((T_END - t) / 0.6) : 0;
      if (layer === 'back' && on) for (let y = -4; y <= 4; y++) for (let x = -20; x <= 20; x++) if ((x / 20) ** 2 + (y / 4) ** 2 < 1) p.dark(T.x + x, GY + y * 0.5 + 1, 0.5 * a);
      if (layer === 'front') {
        if (t < T_B) { const u = t / T_B; p.glow(M.x, M.y, 8 + 8 * u, SHC, 0.4 * u); eye(p, M.x + 4, M.y - 6, u * 0.9, 0.7); }
        if (t > T_B && t < T_END - 0.5) { const bp = bpts(sdT(t, 3), M.x, M.y, C.x, C.y, 16, 4); for (let i = 0; i < bp.length - 1; i++) { const w = Math.sin(i * 0.9 - t * 18) * 1.2; p.line(bp[i].x, bp[i].y + w, bp[i + 1].x, bp[i + 1].y + w, SH[3]); p.line(bp[i].x, bp[i].y + w - 1, bp[i + 1].x, bp[i + 1].y + w - 1, SH[4]); p.line(bp[i].x, bp[i].y + w + 1, bp[i + 1].x, bp[i + 1].y + w + 1, SH[1]); if (i % 3 === 0) p.glow(bp[i].x, bp[i].y, 6, SHC, 0.15); } }
        if (on) { sigil(p, T.x, GY, 22 * eo((t - T_ARR) / 0.4), t, a); const e = clamp((t - T_ARR - 0.2) / 0.3) * a; eye(p, C.x, T.y - T.h - 6, e, 0.8); p.glow(C.x, C.y, 22, SHC, 0.2 * a); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_B ? { sx: kf(t, [[0, 1], [T_B, 1.1]]), sy: kf(t, [[0, 1], [T_B, 0.9]]), tintA: 0.35 * (t / T_B), tint: SHT } : { sx: 1.0, sy: 1.0, tintA: 0.3 * clamp(1 - Math.max(0, t - (T_END - 0.7)) / 0.5), tint: SHT });
      if (t < T_ARR) return act({}); const k = t - T_ARR, a = t > T_END - 0.6 ? clamp((T_END - t) / 0.6) : 1; return act({ sy: kf(k, [[0, 1], [0.1, 0.84], [0.3, 0.94]]) * a + (1 - a), sx: kf(k, [[0, 1], [0.1, 1.1], [0.3, 0.98]]) * a + (1 - a), dx: Math.sin(t * 40) * 0.5 * clamp(1 - k / 1), flash: 0.4 * clamp(1 - k / 0.1), tint: SHT, tintA: 0.5 * a }); },
  });
}

// ───────────── Emboscada (Sombra · habilidad · aparece tras el rival) ─────────────
function emboscada(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const BX = T.x + (T.w + F.w) * 0.5 - 4, T_V = 0.35, T_SL = 0.9, T_E = 1.25, T_HIT = T_E + 0.07, T_B2 = T_HIT + 0.55, C = { x: T.x + 3, y: T.y - T.h * 0.55 }; let hit = false, n = 0;
  const pool = (t) => (t < T_V ? null : t < T_E ? { x: lerp(F.x, BX, smooth((t - T_V) / (T_E - T_V))), a: 1 } : t < T_E + 0.25 ? { x: BX, a: 1 - (t - T_E) / 0.25 } : null);
  B.S.at(T_V, () => { B.shake = 0.8; wisps(P, R, F.x, F.y - F.h * 0.5, 14, 40, 40); P.ring({ x: F.x, y: GY, r0: 2, r1: 16, th: 2, life: 0.35, rp: SH, ry: 0.32 }); });
  B.S.at(T_E, () => { B.shake = 1; wisps(P, R, BX, F.y - F.h * 0.5, 14, 40, 40); P.ring({ x: BX, y: GY, r0: 2, r1: 16, th: 2, life: 0.35, rp: SH, ry: 0.32 }); });
  B.S.at(T_HIT, () => { hit = true; hitS(B, R, C, T, 1.5); B.shake = 4.4; for (let i = 0; i < 6; i++) P.add({ kind: 'sparkle', x: C.x, y: C.y, vx: R.range(-50, 20), vy: R.range(-40, 10), life: 0.4, len: 2, rp: SH }); });
  const cx = (t) => (t < T_E ? BX : t < T_B2 ? BX - 2 * eo((t - T_HIT) / 0.1) : lerp(BX - 2, F.x, smooth((t - T_B2) / 0.4)));
  return dur4(B, 2.0, {
    update(dt) { B.tick(dt); const t = B.t; const pl = pool(t); if (pl && t < T_E) { n -= dt; if (n <= 0) { n = 0.03; wisps(P, R, pl.x, GY - 2, 1, 10, 20); } } },
    draw(p, layer) {
      const t = B.t, pl = pool(t);
      if (layer === 'back' && pl) for (let y = -2; y <= 2; y++) for (let x = -9; x <= 9; x++) if ((x / 9) ** 2 + (y / 2.2) ** 2 < 1) p.dark(pl.x + x, GY + 1 + y, 0.7 * pl.a);
      if (layer === 'front') {
        if (pl) { p.ring(pl.x, GY, 8, 1, SH[3], 0.3, pl.a * 0.8); p.glow(pl.x, GY, 12, SHC, 0.2 * pl.a); }
        if (hit) { const k = t - T_HIT; if (k < 0.24) { slashS(p, C.x, C.y, k, -0.9, 15, 2); slashS(p, C.x, C.y, k, 0.9, 13, 2); p.glow(C.x, C.y, 16, SHC, 0.16 * (1 - k / 0.24)); } }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { if (t < T_V) return act({ sy: kf(t, [[0, 1], [T_V, 0.8]]), sx: kf(t, [[0, 1], [T_V, 1.18]]), tint: SHT, tintA: 0.35 * (t / T_V) }); if (t < T_E) return act({ alpha: 0, dx: 0 }); const dx = cx(t) - F.x, k = t - T_E; return act({ dx, alpha: clamp(k / 0.1), sy: kf(k, [[0, 1.2], [0.07, 0.86], [0.4, 1]]), sx: kf(k, [[0, 0.88], [0.07, 1.16], [0.4, 1]]), tint: SHT, tintA: 0.35 * clamp(1 - k / 0.5) }); }
      if (t < T_E - 0.1) return act({ dx: t > T_V ? Math.sin(t * 20) * 0.4 : 0 }); if (t < T_HIT) return act({ sx: 1.04, dy: -1 }); const k = t - T_HIT; return act({ dx: kf(k, [[0, 0], [0.07, -10], [0.6, 0]]), sy: kf(k, [[0, 1], [0.04, 0.78], [0.18, 1.1], [0.42, 1]]), sx: kf(k, [[0, 1], [0.04, 1.18], [0.18, 0.95], [0.42, 1]]), flash: 0.2 * clamp(1 - k / 0.12), tint: SHT, tintA: 0.5 * clamp(1 - k / 1.0) }); },
  });
}

// ───────────── Noche voraz (Sombra · especial · área, miedo y roba vida) ─────────────
function noche(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: T.x, y: T.y - T.h * 0.5 }, S = { x: F.x, y: F.y - F.h * 0.5 };
  const T_C = 0.6, T_V = 0.9, T_D = 1.7, T_END = 4.0, EY = [[-26, -34], [-14, -50], [10, -44], [24, -30], [-30, -12], [28, -10], [0, -58]]; let n = 0, m = 0; const orbs = [];
  const veil = (t) => (t < T_V ? 0 : eo((t - T_V) / 0.7)) * (t > T_END - 0.8 ? clamp((T_END - t) / 0.8) : 1);
  B.S.at(T_V, () => { B.shake = 3; B.stop = 0.06; P.ring({ x: T.x, y: GY, r0: 2, r1: 50, th: 3, life: 0.6, rp: SH, ry: 0.32, layer: 'front' }); wisps(P, R, F.x, GY - 4, 12, 40, 40); });
  B.S.at(T_D + 1.5, () => { B.shake = 4; B.stop = 0.1; P.ring({ x: F.x, y: S.y, r0: 3, r1: 26, th: 3, life: 0.45, rp: HEAL, ry: 1, layer: 'front' }); for (let j = 0; j < 10; j++) P.add({ kind: 'sparkle', x: F.x + R.range(-F.w * 0.5, F.w * 0.5), y: F.y - R.range(2, F.h), vx: R.range(-6, 6), vy: R.range(-30, -10), life: R.range(0.5, 0.9), len: 2, rp: HEAL }); P.add({ kind: 'plus', x: F.x, y: F.y - F.h - 2, vx: 0, vy: -14, life: 0.8 }); wisps(P, R, C.x, C.y, 14, 60, 60); });
  return dur4(B, 4.4, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_D && t < T_D + 1.5) { n -= dt; if (n <= 0) { n = 0.03; orbs.push({ u: 0, y0: R.range(-T.h * 0.4, T.h * 0.4), w: R.range(-8, 8) }); } } orbs.forEach((o) => (o.u += dt / 0.55)); while (orbs.length && orbs[0].u > 1) orbs.shift(); if (t > T_V && t < T_END - 0.6) { m -= dt; if (m <= 0) { m = 0.08; wisps(P, R, T.x + R.range(-44, 40), GY - R.range(0, 6), 1, 8, 36); } } },
    draw(p, layer) {
      const t = B.t, v = veil(t);
      if (layer === 'back') { if (v > 0) { for (let y = 0; y < GY - 2; y += 1) for (let x = 0; x < 128; x += 1) p.dpx(x, y, SH[0], 0.3 * v); for (let y = -4; y <= 4; y++) for (let x = -50; x <= 46; x++) if ((x / 50) ** 2 + (y / 4) ** 2 < 1) p.dark(T.x + x, GY + y * 0.5 + 1, 0.55 * v); } }
      if (layer === 'front') {
        if (t < T_V) { const u = t / T_C; p.glow(S.x, S.y, 12 + 8 * clamp(u), SHC, 0.35 * clamp(u)); }
        if (v > 0) { for (let i = 0; i < 6; i++) { const x = T.x - 38 + i * 15, pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push({ x: x + (T.x - x) * u * 0.5 * v + Math.sin(u * 5 + i + t * 2) * 2, y: GY - u * (14 + 8 * (i % 3)) * v }); } tend(p, pts, 2.2, 0.9); }
          EY.forEach(([ex, ey], i) => { const b = Math.max(0, Math.sin(t * 2 + i * 1.7)); eye(p, T.x + ex, GY + ey + 22, v * (b > 0.08 ? 1 : 0.1) * clamp((t - T_V - i * 0.08) / 0.2), 0.8); }); p.glow(C.x, C.y, 26, SHC, 0.2 * v); }
        orbs.forEach((o) => { const u = o.u, x = lerp(C.x, S.x, u), y = lerp(C.y + o.y0, S.y, u) - Math.sin(Math.PI * u) * 12 + Math.sin(u * 14 + o.w) * 2; p.disc(x, y, 1.4, SH[5]); p.glow(x, y, 6, SHC, 0.35); });
        if (t > T_D + 0.6 && t < T_D + 1.6) p.glow(S.x, S.y, 16, SHC, 0.2); if (t > T_D + 1.5 && t < T_D + 2.0) p.glow(S.x, S.y, 18, [140, 240, 140], 0.4 * (1 - (t - T_D - 1.5) / 0.5));
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_V ? { sx: kf(t, [[0, 1], [T_C, 1.14], [T_V, 1.14]]), sy: kf(t, [[0, 1], [T_C, 0.88], [T_V, 0.88]]), tintA: 0.4 * clamp(t / T_C), tint: SHT } : { sx: kf(t - T_V, [[0, 1.14], [0.1, 0.9], [0.35, 1]]), sy: kf(t - T_V, [[0, 0.88], [0.1, 1.12], [0.35, 1]]), tintA: 0.4 * clamp(1 - (t - T_V) / 1.0) + (t > T_D && t < T_D + 1.5 ? 0.2 : 0), tint: SHT });
      if (t < T_V) return act({}); const k = t - T_V, a = v0(t), dr = t > T_D && t < T_D + 1.5 ? clamp((t - T_D) / 0.4) : 0; return act({ dx: Math.sin(t * 60) * (0.5 + dr) * a, sx: (1 - 0.08 * a) , sy: 1 - 0.05 * a - 0.07 * dr, tint: SHT, tintA: 0.55 * a, flash: k < 0.1 ? 0.3 : 0 }); function v0(tt) { return clamp((T_END - 0.6 - tt) / 0.5) * clamp((tt - T_V) / 0.3); } },
  });
}

// ───────────── Terror nocturno (Sombra · especial · zona, miedo prolongado) ─────────────
function terror(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: T.x, y: T.y - T.h * 0.5 }, T_C = 0.6, T_Z = 1.0, T_END = 4.2; let n = 0;
  const z = (t) => (t < T_Z ? 0 : eo((t - T_Z) / 0.8)) * (t > T_END - 0.9 ? clamp((T_END - t) / 0.9) : 1);
  const HD = [-0.4, -0.15, 0.15, 0.4].map((x, i) => ({ x, ph: i * 1.7 }));
  const hp = (h, t) => { const g = z(t), pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push({ x: T.x + h.x * T.w * 2.2 * (1 - 0.55 * u) + Math.sin(u * 5 + h.ph + t * 2) * 3 * u, y: GY - u * (T.h * 0.9) * g }); } return pts; };
  B.S.at(T_Z, () => { B.shake = 3; B.stop = 0.06; P.ring({ x: T.x, y: GY, r0: 2, r1: 40, th: 3, life: 0.6, rp: SH, ry: 0.32, layer: 'front' }); wisps(P, R, T.x, GY - 4, 14, 60, 40); });
  B.S.at(T_Z + 0.5, () => { B.shake = 1.6; });
  return dur4(B, 4.6, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_Z && t < T_END - 0.9) { n -= dt; if (n <= 0) { n = 0.05; wisps(P, R, T.x + R.range(-34, 34), GY - R.range(0, 4), 1, 6, 40); } } },
    draw(p, layer) {
      const t = B.t, g = z(t);
      if (layer === 'back' && g > 0) { for (let y = -5; y <= 5; y++) for (let x = -42; x <= 42; x++) { const d = (x / 42) ** 2 + (y / 5) ** 2, nn = fbm((T.x + x) * 0.2 + t * 0.3, (GY + y) * 0.4, 14); if (d + (nn - 0.5) * 0.5 < 1) p.dark(T.x + x, GY + y * 0.5 + 1, 0.7 * g); } }
      if (layer === 'front') {
        if (t < T_Z) p.glow(F.x, F.y - F.h * 0.5, 12 + 8 * clamp(t / T_C), SHC, 0.35 * clamp(t / T_C));
        if (g > 0) { sigil(p, T.x, GY, 36 * g, t * 0.6, g, 0.32); HD.forEach((h) => { const pts = hp(h, t); tend(p, pts, 3, g); const tp = pts[pts.length - 1]; for (let f = -2; f <= 2; f++) { const a = -1.57 + f * 0.5; p.line(tp.x, tp.y, tp.x + Math.cos(a) * 4, tp.y + Math.sin(a) * 4, SH[4]); } });
          [[-22, -26], [24, -34], [-8, -48], [14, -14], [-30, -8], [30, -46]].forEach(([ex, ey], i) => { const b = Math.sin(t * 1.5 + i * 2.1); eye(p, T.x + ex, GY + ey + 22, g * (b > -0.6 ? 1 : 0.1) * clamp((t - T_Z - i * 0.1) / 0.3), 0.8); }); p.glow(C.x, C.y, 24, SHC, 0.18 * g); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_Z ? { sx: kf(t, [[0, 1], [T_C, 1.14], [T_Z, 1.14]]), sy: kf(t, [[0, 1], [T_C, 0.88], [T_Z, 0.88]]), tintA: 0.4 * clamp(t / T_C), tint: SHT } : { sx: kf(t - T_Z, [[0, 1.14], [0.1, 0.9], [0.35, 1]]), sy: kf(t - T_Z, [[0, 0.88], [0.1, 1.12], [0.35, 1]]), tintA: 0.35 * clamp(1 - (t - T_Z) / 0.6), tint: SHT });
      if (t < T_Z) return act({}); const k = t - T_Z, g = z(t); return act({ dx: Math.sin(t * 55) * 1.6 * g, dy: -Math.abs(Math.sin(t * 20)) * 1.0 * g, sx: 1 - 0.1 * g, sy: 1 - 0.08 * g, alpha: 1 - 0.2 * g * (Math.sin(t * 9) > 0.3 ? 1 : 0), tint: SHT, tintA: 0.6 * g, flash: k < 0.1 ? 0.3 : 0 }); },
  });
}

// ───────────── Manto de penumbra (Sombra · defensa · propia, esquiva) ─────────────
function manto(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const C = { x: F.x, y: F.y - F.h * 0.5 }, T_ON = 0.5, T_DASH = 1.4, T_C = 1.54, T_OFF = 2.9, T_END = 3.4;
  const DASH = (T.x - F.x) - (F.w * 0.5 + T.w * 0.5) + 2, OVER = 16;
  const ex = (t) => (t < T_DASH ? (t > T_DASH - 0.35 ? 1.5 * smooth((t - T_DASH + 0.35) / 0.35) : 0) : t < T_C ? lerp(1.5, -DASH, ei((t - T_DASH) / (T_C - T_DASH))) : t < T_C + 0.18 ? lerp(-DASH, -DASH - OVER, eo((t - T_C) / 0.18)) : t < T_C + 0.8 ? -DASH - OVER : lerp(-DASH - OVER, 0, smooth((t - T_C - 0.8) / 0.5)));
  const dodge = (t) => { const k = t - (T_C - 0.06); return k < 0 ? 0 : kf(k, [[0, 0], [0.08, 1], [0.55, 1], [0.85, 0]]); };
  let ghost = null, n = 0;
  B.S.at(T_ON, () => { B.shake = 0.5; wisps(P, R, C.x, C.y, 10, 30, 30); });
  B.S.at(T_C - 0.03, () => { B.shake = 0.6; ghost = { a: 0 }; wisps(P, R, C.x, C.y, 18, 60, 50); P.ring({ x: F.x, y: GY, r0: 2, r1: 18, th: 2, life: 0.35, rp: SH, ry: 0.32 }); });
  B.S.at(T_C + 0.1, () => { B.shake = 2; const tx = T.x + ex(T_C + 0.1); for (let i = 0; i < 6; i++) P.add({ kind: 'umbra', x: tx + R.range(-6, 6), y: GY - 2, vx: R.range(-30, 10), vy: R.range(-20, -5), life: 0.6, r0: 1.5, r1: 4, a0: 0.7, layer: 'back' }); });
  return dur4(B, 3.6, {
    update(dt) { B.tick(dt); if (ghost) ghost.a += dt; const t = B.t, g = clamp((t - T_ON) / 0.4) * (t > T_OFF ? clamp((T_END - t) / (T_END - T_OFF)) : 1); if (g > 0) { n -= dt; if (n <= 0) { n = 0.07; wisps(P, R, C.x + R.range(-F.w * 0.7, F.w * 0.7), F.y - R.range(0, F.h), 1, 6, 16); } } },
    draw(p, layer) {
      const t = B.t, g = clamp((t - T_ON) / 0.4) * (t > T_OFF ? clamp((T_END - t) / (T_END - T_OFF)) : 1);
      if (layer === 'back' && ghost && ghost.a < 0.5) p.sprite(ctx.sprites.caster, F.x, F.y, { flat: SH[2], alpha: 0.6 * (1 - ghost.a / 0.5) });
      if (layer === 'front' && g > 0) { for (let i = 0; i < 6; i++) { const a = i * 1.047 + t * 1.8, rx = F.w * 0.65 + 3 + Math.sin(t * 3 + i) * 1.5, x = C.x + Math.cos(a) * rx, y = C.y + Math.sin(a) * F.h * 0.55; p.disc(x, y, 2.6, SH[1], 0.8 * g); p.disc(x - 0.6, y - 0.6, 1.5, SH[3], 0.8 * g); } p.glow(C.x, C.y, 22, SHC, 0.15 * g * (1 + dodge(t))); }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') { const d = dodge(t); return act(t < T_ON ? {} : { dx: -7 * d, dy: -1 * d, alpha: 1 - 0.65 * d, sy: 1 + 0.05 * d, sx: 1 - 0.05 * d, tint: SHT, tintA: (t < T_C ? 0.3 * clamp((t - T_ON) / 0.3) : 0.3) + 0.25 * d }); }
      const dx = ex(t); if (t < T_DASH) return act({ dx, sx: t > T_DASH - 0.35 ? kf(t, [[T_DASH - 0.35, 1], [T_DASH, 0.9]]) : 1, sy: t > T_DASH - 0.35 ? kf(t, [[T_DASH - 0.35, 1], [T_DASH, 1.1]]) : 1 }); if (t < T_C) return act({ dx, sx: 1.18, sy: 0.9 }); const k = t - T_C; return act({ dx, dy: kf(k, [[0, 0], [0.15, -3], [0.3, 0]]), sx: kf(k, [[0, 1.16], [0.2, 0.96], [0.5, 1]]), sy: kf(k, [[0, 0.9], [0.1, 1.08], [0.4, 0.94], [0.8, 1]]), tint: SHT, tintA: 0.3 * clamp(1 - k / 0.8) }); },
  });
}

// ───────────── Drenar fuerza (Sombra · apoyo · debilita al rival más peligroso) ─────────────
function drenar(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const S = { x: F.x + F.w * 0.4, y: F.y - F.h * 0.55 }, C = { x: T.x, y: T.y - T.h * 0.5 }, T_C = 0.5, T_M = 0.8, T_END = 3.2; let n = 0, on = 0;
  B.S.at(T_M, () => { on = 1; B.shake = 1.6; B.stop = 0.05; wisps(P, R, C.x, C.y, 8, 40, 40); P.ring({ x: T.x, y: GY, r0: 2, r1: 22, th: 2, life: 0.4, rp: SH, ry: 0.32 }); });
  [1.5, 1.9, 2.3].forEach((tt) => B.S.at(tt, () => { for (let k = 0; k < 3; k++) P.add({ kind: 'chevD', x: T.x - 6 + k * 6, y: T.y - T.h - 3, vx: 0, vy: 12, life: 0.9 }); }));
  return dur4(B, 3.6, {
    update(dt) { B.tick(dt); const t = B.t; if (t > T_M + 0.4 && t < T_END - 0.7) { n -= dt; if (n <= 0) { n = 0.05; P.add({ kind: 'spark', x: T.x + R.range(-T.w * 0.4, T.w * 0.4), y: T.y - R.range(2, T.h), vx: R.range(-8, 8), vy: -R.range(30, 70), life: R.range(0.4, 0.7), rp: SH, gc: [255, 130, 80] }); } } },
    draw(p, layer) {
      const t = B.t, a = on ? clamp((T_END - t) / 0.6) : 0;
      if (layer === 'back' && on) for (let y = -3; y <= 3; y++) for (let x = -16; x <= 16; x++) if ((x / 16) ** 2 + (y / 3) ** 2 < 1) p.dark(T.x + x, GY + y * 0.5 + 1, 0.45 * a);
      if (layer === 'front') {
        if (t < T_M) { const u = clamp(t / T_C); p.glow(S.x, S.y, 8 + 8 * u, SHC, 0.4 * u); }
        if (on) { sigil(p, T.x, GY, 18 * eo((t - T_M) / 0.4), t, a); for (let i = 0; i < 3; i++) { const ph = clamp((t - T_M - 0.25) / 0.7 - i * 0.12), r = lerp(T.w * 0.9, T.w * 0.42, eo(ph)), y = T.y - T.h * (0.2 + 0.3 * i), al = clamp(ph * 3) * a; if (al > 0) { p.ring(T.x, y, r, 1, SH[4], 0.22, al); p.ring(T.x, y, r - 1, 1, SH[2], 0.22, al * 0.7); } } p.glow(C.x, C.y, 22, SHC, 0.18 * a); }
      }
      P.draw(p, layer);
    },
    actor(role) { const t = B.t; if (role === 'caster') return act(t < T_M ? { sx: kf(t, [[0, 1], [T_C, 1.1]]), sy: kf(t, [[0, 1], [T_C, 0.9]]), tintA: 0.35 * clamp(t / T_C), tint: SHT } : { sx: kf(t - T_M, [[0, 1.1], [0.08, 0.92], [0.3, 1]]), sy: kf(t - T_M, [[0, 0.9], [0.08, 1.1], [0.3, 1]]), tintA: 0.25 * clamp(1 - (t - T_M) / 0.5), tint: SHT });
      if (t < T_M) return act({}); const k = t - T_M, a = clamp((T_END - t) / 0.6); return act({ sy: (kf(k, [[0, 1], [0.1, 0.82], [0.6, 0.93]])) * a + (1 - a), sx: (kf(k, [[0, 1], [0.1, 1.1], [0.6, 0.96]])) * a + (1 - a), dy: 0, dx: Math.sin(t * 30) * 0.5 * clamp(1 - k / 1.2), tint: [90, 60, 110], tintA: 0.55 * a, flash: 0.35 * clamp(1 - k / 0.1) }); },
  });
}

(function () {
  const C = '#7a5bb0', by = Object.fromEntries(MOVES.map((m) => [m.id, m]));
  const add = [
    { id: 'garra', nombre: 'Garra umbría', tipo: 'Básico · contacto', make: garra, fases: ['Se funde en una estela oscura', 'Arremete', 'Tres zarpazos violetas en cadena', 'Vuelve a su sitio'], uso: 'Básico de cuerpo a cuerpo: golpe rápido.' },
    { id: 'aguja', nombre: 'Aguja de sombra', tipo: 'Básico · proyectil ×3', make: aguja, fases: ['Forma tres agujas oscuras', 'Salen en ráfaga rápida', 'Cada una clava con destello violeta y bruma'], uso: 'Básico a media distancia: tres agujas rápidas.' },
    { id: 'maldeojo', nombre: 'Mal de ojo', tipo: 'Habilidad · haz, maldice', make: malDeOjo, fases: ['Abre un ojo oscuro', 'Haz ondulante hasta el rival', 'Sello giratorio en el suelo y ojo sobre el rival', 'Flechas hacia abajo: ataque y defensa bajan'], uso: 'Habilidad de control: deja maldito al rival.' },
    { id: 'emboscada', nombre: 'Emboscada', tipo: 'Habilidad · aparece tras el rival', make: emboscada, fases: ['Se disuelve en sombra', 'Una mancha oscura cruza el suelo', 'Aparece a su espalda', 'Doble tajo por la espalda con destello'], uso: 'Habilidad: golpea por detrás con más daño.' },
    { id: 'noche', nombre: 'Noche voraz', tipo: 'Especial · área, miedo y roba vida', make: noche, fases: ['Se carga de oscuridad', 'Cae la noche: tentáculos y ojos por todas partes', 'Roba vida: orbes hasta la criatura', 'Se cura con destello verde'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'terror', nombre: 'Terror nocturno', tipo: 'Especial · zona, miedo prolongado', make: terror, fases: ['Se carga de oscuridad', 'Un sello oscuro se abre bajo el rival', 'Manos de sombra lo agarran y aparecen ojos', 'Queda temblando de miedo un buen rato'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'manto', nombre: 'Manto de penumbra', tipo: 'Defensa · esquiva', make: manto, fases: ['Bruma oscura orbita su cuerpo', 'El rival embiste', 'Se vuelve sombra y esquiva', 'El rival pasa de largo'], uso: 'Hueco de defensa: esquiva al ser apuntada.' },
    { id: 'drenar', nombre: 'Drenar fuerza', tipo: 'Apoyo · debilita al rival', make: drenar, fases: ['Concentra la oscuridad', 'Sello y anillos oscuros se cierran sobre el rival', 'Se le escapan chispas rojas', 'Flechas hacia abajo: pierde fuerza'], uso: 'Hueco de apoyo: debilita al rival más peligroso.' },
  ].map((m) => Object.assign({ el: 'Sombra', col: C, caster: 'pompon', target: 'fosforin' }, m));
  const all = Object.assign({}, by); add.forEach((m) => { all[m.id] = m; });
  const order = MOVES.map((m) => m.id).concat(add.map((m) => m.id));
  MOVES.length = 0; order.forEach((id) => MOVES.push(all[id]));
})();
