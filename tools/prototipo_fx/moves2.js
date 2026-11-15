// ═════════ LOTE FUEGO (resto de movimientos) ═════════
// tajo curvo: barrido de un arco con grosor que se afina en los extremos y cola que se apaga
function slashArc(p, cx, cy, r, a0, a1, th, prog, tail) {
  const R = Math.ceil(r + th);
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    const d = Math.hypot(x, y); if (Math.abs(d - r) > th / 2 + 1) continue;
    const f = (Math.atan2(y, x) - a0) / (a1 - a0); if (f < 0 || f > 1 || f > prog) continue;
    const age = (prog - f) / tail; if (age > 1) continue;
    const thick = th * Math.pow(Math.sin(Math.PI * f), 0.6) * (1 - age * 0.55), e = Math.abs(d - r) / (thick / 2 + 0.001); if (e > 1) continue;
    let idx = e < 0.35 ? 8 : e < 0.6 ? 7 : e < 0.8 ? 5 : 3; idx = Math.max(1, idx - Math.floor(age * 4));
    p.px(cx + x, cy + y, FIRE[idx]);
  }
}
const evalHits = (hits, t, dur) => { let f = 0; for (const h of hits) { const k = t - h; if (k >= 0 && k < dur) f = Math.max(f, 1 - k / dur); } return f; };

// ───────────── Bola explosiva (Fuego · habilidad · proyectil + área) ─────────────
const bolaExplosiva = (ctx) => llamarada(ctx, { flyT: 0.55, arc: 17, big: 1.5, ball: 1.4, frags: 8 });

// ───────────── Zarpa ardiente (Fuego · básico · contacto) ─────────────
function zarpaArdiente(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const LAND = { x: T.x - (T.w + F.w) * 0.5 + 1 }, T_W = 0.24, T_D = 0.11, T_C = T_W + T_D, T_B = T_C + 0.36;
  const C = { x: T.x - 1, y: T.y - T.h * 0.55 }, ghosts = []; let nG = 0, hit = false;
  const x = (t) => t < T_W ? F.x - 3 * smooth(t / T_W) : t < T_C ? lerp(F.x - 3, LAND.x, ei((t - T_W) / T_D)) : t < T_B ? LAND.x : lerp(LAND.x, F.x, smooth((t - T_B) / 0.32));
  B.S.at(T_C, () => { B.shake = 1.2; });
  B.S.at(T_C + 0.08, () => {
    hit = true; B.stop = 0.07; B.shake = 3;
    burst(P, R, C.x - 2, C.y, 18, 70, 190, { a0: -1.2, a1: 1.2, up: 20 });
    P.add({ kind: 'fire', x: C.x, y: C.y + 1, vx: 15, vy: -12, life: 0.3, r: 6 });
    P.ring({ x: C.x, y: C.y, r0: 1, r1: 12, th: 2, life: 0.18, rp: FIRE, ry: 1, layer: 'front' });
    for (let i = 0; i < 6; i++) P.add({ kind: 'ember', x: C.x + R.range(-3, 3), y: C.y + R.range(-5, 5), vx: R.range(-20, 50), vy: R.range(-60, -10), g: -4, life: R.range(0.5, 1), big: R.next() < 0.3 });
    P.add({ kind: 'smoke', x: C.x, y: C.y, vx: 5, vy: -16, life: 0.7, r0: 2, r1: 6, a0: 0.5, layer: 'back' });
  });
  return {
    dur: 1.9, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t, cx = x(t);
      if (t < T_C) { nG -= dt; if (nG <= 0) { nG = t < T_W ? 0.04 : 0.014; P.add({ kind: 'fire', x: cx + F.w * 0.4, y: F.y - F.h * 0.4, vx: 0, vy: -22, life: 0.24, r: t < T_W ? 1.4 + 1.6 * (t / T_W) : 3 }); if (t >= T_W) ghosts.push({ x: cx, a: 0 }); } }
      for (const g of ghosts) g.a += dt;
      if (t > T_C && t < T_C + 0.55) { nG -= dt; if (nG <= 0) { nG = 0.05; P.add({ kind: 'fire', x: T.x + R.range(-T.w * 0.3, T.w * 0.3), y: T.y - R.range(T.h * 0.3, T.h * 0.9), vx: 0, vy: -24, life: 0.28, r: 2 }); } }
    },
    draw(p, layer) {
      const t = B.t, cx = x(t);
      if (layer === 'back') for (const g of ghosts) if (g.a < 0.16) p.sprite(ctx.sprites.caster, g.x, F.y, { flat: FIRE[3], alpha: 0.6 * (1 - g.a / 0.16), sx: 1.1, sy: 0.92 });
      if (layer === 'front') {
        if (t < T_C) { const u = clamp(t / T_W), px = cx + F.w * 0.42, py = F.y - F.h * 0.4; flame(p, px, py, 1.6 + 2 * u, 1.8 + 2 * u, t, 5, { up: 0.6 }); p.glow(px, py, 8 + 6 * u, FIREC, 0.5 * u); }
        const k = (t - T_C + 0.03) / 0.13; if (k >= 0 && k < 2.2) { slashArc(p, C.x - 5, C.y + 4, 10, -2.2, 0.85, 5.5, clamp(k), 0.6); slashArc(p, C.x - 4, C.y + 5, 7, -2.1, 0.7, 2.6, clamp(k * 1.1 - 0.1), 0.55); if (k < 1.1) p.glow(C.x - 2, C.y, 16, [255, 160, 70], 0.5); }
        if (hit) { const q = t - T_C - 0.08; if (q < 0.26) p.glow(C.x, C.y, 22, [255, 150, 70], 0.8 * (1 - q / 0.26)); }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') {
        const dx = x(t) - F.x; let sx = 1, sy = 1;
        if (t < T_W) { sy = kf(t, [[0, 1], [T_W, 0.8]]); sx = kf(t, [[0, 1], [T_W, 1.16]]); } else if (t < T_C) { sy = 0.92; sx = 1.18; } else if (t < T_C + 0.25) { const k = t - T_C; sy = kf(k, [[0, 1.12], [0.08, 0.88], [0.25, 1]]); sx = kf(k, [[0, 0.9], [0.08, 1.12], [0.25, 1]]); }
        return act({ dx, sx, sy, tintA: t < T_C ? 0.3 : 0.2 * clamp(1 - (t - T_C) / 0.3), tint: [255, 120, 30] });
      }
      const k = t - (T_C + 0.08); if (k < 0) return act({});
      return act({ dx: kf(k, [[0, 0], [0.07, 4], [0.5, 0]]), sy: kf(k, [[0, 1], [0.05, 0.82], [0.16, 1.08], [0.4, 1]]), sx: kf(k, [[0, 1], [0.05, 1.14], [0.16, 0.94], [0.4, 1]]), flash: clamp(1 - k / 0.12), tint: [255, 90, 30], tintA: k < 0.9 ? 0.25 * clamp(1 - k / 0.9) : 0 });
    },
  };
}

// ───────────── Tormenta de fuego (Fuego · especial · zona) ─────────────
function tormentaFuego(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_REL = 0.95, T0 = 1.15, N = 15, hitsT = [], mets = [];
  for (let i = 0; i < N; i++) { const last = i === N - 1; mets.push({ x: last ? T.x : T.x + R.range(-32, 22), tHit: T0 + i * 0.12 + R.range(0, 0.05) + (last ? 0.15 : 0), big: last ? 2 : i % 5 === 4 ? 1.4 : 1, fall: last ? 0.4 : 0.3 }); }
  const onT = (m) => Math.abs(m.x - T.x) < T.w * 0.6;
  mets.forEach((m) => B.S.at(m.tHit, () => {
    const y = GY - R.range(0, 3), b = m.big;
    P.add({ kind: 'fire', x: m.x, y: y - 2, vx: 0, vy: -14, life: 0.34, r: 5 * b, drag: 2 });
    burst(P, R, m.x, y - 2, Math.round(10 * b), 50, 150 * Math.sqrt(b), { a0: -2.9, a1: -0.25, up: 40 });
    P.ring({ x: m.x, y: GY, r0: 1, r1: 12 * b, th: 2.2, life: 0.3, rp: FIRE, ry: 0.3 });
    for (let k = 0; k < 2; k++) P.add({ kind: 'dust', x: m.x + R.range(-4, 4), y: GY - 1, vx: R.range(-30, 30), vy: R.range(-10, -3), life: 0.4, r0: 1, r1: 3.5, layer: 'back' });
    P.add({ kind: 'fire', x: m.x + R.range(-3, 3), y: GY - 2, vx: 0, vy: -6, life: 0.9, r: 2.4, layer: 'back' });
    if (b >= 2) { B.stop = 0.12; B.shake = 5; P.ring({ x: m.x, y: y - 4, r0: 1, r1: 24, th: 3, life: 0.28, rp: FIRE, ry: 1, layer: 'front' }); for (let k = 0; k < 6; k++) P.add({ kind: 'smoke', x: m.x + R.range(-8, 8), y: GY - 3, vx: R.range(-10, 10), vy: R.range(-24, -10), life: R.range(0.9, 1.5), r0: 2, r1: 8, a0: 0.55, layer: 'back' }); }
    else if (b > 1) { B.stop = 0.04; B.shake = 3; } else B.shake = Math.max(B.shake, 1.2);
    if (onT(m)) { hitsT.push(B.t); B.shake = Math.max(B.shake, 2.5); }
  }));
  B.S.at(T_REL, () => { B.shake = 1; for (let i = 0; i < 12; i++) P.add({ kind: 'spark', x: F.x + R.range(-3, 3), y: F.y - F.h, vx: R.range(-30, 60), vy: R.range(-190, -90), g: 20, life: R.range(0.3, 0.6), bounce: 0 }); });
  const metPos = (m, t) => { const u = clamp(1 - (m.tHit - t) / m.fall); return u > 0 && u < 1 ? { x: lerp(m.x + 26, m.x, Math.pow(u, 1.25)), y: lerp(-10, GY - 2, Math.pow(u, 1.25)), u } : null; };
  let nT = 0, nW = 0;
  return {
    dur: 3.6, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t;
      for (const m of mets) { const q = metPos(m, t); if (q) { m.q = q; nT -= dt; } else m.q = null; }
      nW -= dt; if (nW <= 0) { nW = 0.015; for (const m of mets) if (m.q) P.add({ kind: 'fire', x: m.q.x + 2, y: m.q.y - 2, vx: 20, vy: -10, life: 0.2, r: 2.6 * Math.sqrt(m.big) }); }
      if (t < T_REL) { nT -= dt; if (nT <= 0) { nT = 0.03; P.add({ kind: 'ember', x: F.x + R.range(-6, 6), y: F.y - R.range(0, 6), vx: R.range(-6, 6), vy: R.range(-40, -15), life: 0.7 }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') { const a = clamp((t - 2.0) / 1.4); for (const m of mets) if (t > m.tHit) for (let x = -5; x <= 5; x++) for (let y = -1; y <= 1; y++) if ((x / 5) ** 2 + (y / 1.4) ** 2 < 1) p.dark(m.x + x, GY + y, 0.8 * (1 - a)); }
      if (layer === 'front') {
        const sky = clamp(t / T_REL) * (t < 2.9 ? 1 : clamp(1 - (t - 2.9) / 0.7)); p.glow(T.x - 4, 2, 62, [255, 110, 50], 0.38 * sky); p.glow(F.x, F.y - F.h * 0.6, 14, FIREC, 0.4 * clamp(t / T_REL) * (t < T_REL + 0.2 ? 1 : 0));
        for (const m of mets) if (m.q) { const b = Math.sqrt(m.big); flame(p, m.q.x, m.q.y, 4.2 * b, 3 * b, t * 1.3, 7, { up: 0.15 }); p.disc(m.q.x + 1, m.q.y + 1, 1.3 * b, FIRE[8]); p.glow(m.q.x, m.q.y, 14 * b, FIREC, 0.55); }
        for (const m of mets) if (t - m.tHit >= 0 && t - m.tHit < 0.25) p.glow(m.x, GY - 4, 22 * Math.sqrt(m.big), [255, 150, 70], 0.7 * (1 - (t - m.tHit) / 0.25));
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const w = clamp(t / T_REL), r = t - T_REL; return act(t < T_REL ? { sy: kf(t, [[0, 1], [0.35, 0.82], [T_REL, 1.18]]), sx: kf(t, [[0, 1], [0.35, 1.14], [T_REL, 0.88]]), dy: -2 * smooth((t - 0.35) / 0.6), tintA: 0.35 * w, tint: [255, 130, 40] } : { sy: kf(r, [[0, 1.18], [0.08, 0.9], [0.4, 1]]), sx: kf(r, [[0, 0.88], [0.08, 1.1], [0.4, 1]]), tintA: 0.3 * clamp(1 - r / 0.5), tint: [255, 130, 40] }); }
      if (!hitsT.length) return act({});
      const last = hitsT[hitsT.length - 1], k = t - last, f = evalHits(hitsT, t, 0.1), burn = t - hitsT[0];
      return act({ dx: 1.6 * Math.sin(k * 70) * Math.exp(-k * 9), sy: 1 - 0.09 * f, sx: 1 + 0.09 * f, flash: f, tint: [255, 90, 30], tintA: burn < 1.6 ? 0.3 * clamp(1 - burn / 1.6) * (0.7 + 0.3 * Math.sin(t * 40)) : 0 });
    },
  };
}

// ───────────── Erupción (Fuego · especial · zona bajo el rival) ─────────────
function erupcion(ctx) {
  const R = ctx.R, F = ctx.from, T = ctx.to, B = base(ctx), P = B.P;
  const T_TEL = 0.15, T_E = 1.15; let erupted = false, nE = 0;
  B.S.at(T_E, () => {
    erupted = true; B.stop = 0.13; B.shake = 5.5;
    P.ring({ x: T.x, y: GY, r0: 2, r1: 30, th: 4, life: 0.5, rp: FIRE, ry: 0.3 }); P.ring({ x: T.x, y: GY, r0: 1, r1: 18, th: 2.5, life: 0.38, rp: FIRE, ry: 0.3 });
    for (let i = 0; i < 26; i++) P.add({ kind: 'ember', x: T.x + R.range(-5, 5), y: GY - 4, vx: R.range(-55, 55), vy: R.range(-190, -80), g: 300, drag: 0.3, life: R.range(0.8, 1.4), big: true });
    burst(P, R, T.x, GY - 4, 24, 60, 190, { a0: -2.7, a1: -0.45, up: 60 });
    for (let i = 0; i < 7; i++) P.add({ kind: 'smoke', x: T.x + R.range(-7, 7), y: GY - R.range(2, 14), vx: R.range(-10, 10), vy: R.range(-34, -16), life: R.range(1.0, 1.7), r0: 2, r1: 9, a0: 0.6, layer: 'back' });
    for (let i = 0; i < 12; i++) P.add({ kind: 'dust', x: T.x + R.range(-14, 14), y: GY - 1, vx: R.range(-70, 70), vy: R.range(-14, -3), life: R.range(0.4, 0.8), r0: 1, r1: 5, layer: 'back' });
  });
  const crack = (x, y) => { const n = fbm(x * 0.22, y * 0.5, 17), n2 = fbm(x * 0.5, y * 0.25, 29); return Math.abs(n - 0.5) < 0.05 || Math.abs(n2 - 0.5) < 0.035; };
  const col = (t) => { const k = clamp((t - T_E) / 0.14), fade = t > T_E + 0.5 ? clamp(1 - (t - T_E - 0.5) / 0.45) : 1; return { h: 34 * eo(k) * (0.7 + 0.3 * fade), fade }; };
  return {
    dur: 3.0, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t;
      if (t > T_TEL && t < T_E) { nE -= dt; if (nE <= 0) { nE = 0.05 * (1.6 - (t - T_TEL) / (T_E - T_TEL)); P.add({ kind: 'ember', x: T.x + R.range(-13, 13), y: GY - R.range(0, 2), vx: R.range(-4, 4), vy: R.range(-26, -8), life: R.range(0.4, 0.8) }); } }
      if (erupted && t < T_E + 0.8) { nE -= dt; if (nE <= 0) { nE = 0.03; P.add({ kind: 'ember', x: T.x + R.range(-6, 6), y: GY - R.range(6, 26), vx: R.range(-25, 25), vy: R.range(-60, -20), g: 150, life: R.range(0.3, 0.8), big: true }); } }
    },
    draw(p, layer) {
      const t = B.t;
      if (layer === 'back') {
        if (t > T_TEL) {
          const a = clamp((t - T_TEL) / 0.4), after = erupted ? clamp(1 - (t - T_E - 0.9) / 1.5) : 1, pulse = 0.55 + 0.45 * Math.sin(t * (10 + 14 * clamp((t - T_TEL) / (T_E - T_TEL))));
          for (let y = -6; y <= 6; y++) for (let x = -17; x <= 17; x++) { const d = (x / 17) ** 2 + (y / 5.5) ** 2; if (d > 1) continue; p.dark(T.x + x, GY + y, 0.55 * a * after); if (crack(T.x + x, GY + y) && d < 1 - 0.1 * (1 - a)) p.px(T.x + x, GY + y, FIRE[erupted ? 5 : pulse > 0.6 ? 4 : 3]); }
          if (!erupted) p.glow(T.x, GY - 1, 22, FIREC, 0.55 * a * pulse);
        }
        if (erupted) { const c = col(t); if (c.fade > 0) { flame(p, T.x, GY - c.h * 0.45, 7.5 * (0.6 + 0.4 * c.fade), c.h * 0.6, t * 1.4, 21, { up: 0.9, fade: (1 - c.fade) * 0.7, rise: 6 }); p.glow(T.x, GY - c.h * 0.4, 28, FIREC, 0.75 * c.fade); } }
      }
      if (layer === 'front') { if (erupted) { const k = t - T_E; if (k < 0.3) p.glow(T.x, GY - 8, 44, [255, 160, 70], 0.8 * (1 - k / 0.3)); } else if (t > T_TEL) p.glow(F.x, F.y - F.h * 0.5, 12, FIREC, 0.3 * clamp((t - T_TEL) / 0.8)); }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_E; return act(t < T_E ? { sy: kf(t, [[0, 1], [0.7, 1.14], [T_E - 0.08, 1.2], [T_E, 0.8]]), sx: kf(t, [[0, 1], [0.7, 0.92], [T_E, 1.15]]), dy: -1.5 * smooth(t / 0.7), tintA: 0.35 * clamp(t / 0.8), tint: [255, 130, 40] } : { sy: kf(r, [[0, 0.8], [0.35, 1]]), sx: kf(r, [[0, 1.15], [0.35, 1]]), tintA: 0.3 * clamp(1 - r / 0.4), tint: [255, 130, 40] }); }
      if (t < T_E - 0.4) { const sh = t > T_TEL ? 0.7 * Math.sin(t * 60) * clamp((t - T_TEL) / 0.5) : 0; return act({ dx: sh, sy: 0.97 }); }
      if (t < T_E) return act({ dx: 0.7 * Math.sin(t * 60), sy: 0.95 });
      const k = t - T_E; return act({ dy: kf(k, [[0, 0], [0.16, -18], [0.34, -17], [0.62, 0]]), sy: kf(k, [[0, 0.8], [0.06, 1.2], [0.3, 1.05], [0.62, 0.8], [0.74, 1]]), sx: kf(k, [[0, 1.2], [0.06, 0.88], [0.3, 0.96], [0.62, 1.2], [0.74, 1]]), flash: clamp(1 - k / 0.16), tint: [255, 90, 30], tintA: k < 1.4 ? 0.3 * clamp(1 - k / 1.4) * (0.7 + 0.3 * Math.sin(k * 40)) : 0 });
    },
  };
}

// ───────────── Aura ardiente (Fuego · defensa · propia) ─────────────
function auraArdiente(ctx) {
  const R = ctx.R, F = ctx.from, A = ctx.to, B = base(ctx), P = B.P;
  const C = { x: F.x, y: F.y - F.h * 0.5 }, T_ON = 0.45, T_W = 0.95, T_DASH = 1.18, T_C = 1.34, T_OFF = 2.3;
  const DIST = (A.x - F.x) - (A.w + F.w) * 0.5 - 1; let flare = -9, nA = 0, nB = 0;
  const ax = (t) => t < T_W ? 0 : t < T_DASH ? 2.2 * smooth((t - T_W) / (T_DASH - T_W)) : t < T_C ? lerp(2.2, -DIST, ei((t - T_DASH) / (T_C - T_DASH))) : t < T_C + 0.14 ? -DIST : -DIST * (1 - eo((t - T_C - 0.14) / 0.55));
  B.S.at(T_C, () => {
    flare = B.t; B.stop = 0.1; B.shake = 3;
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; P.add({ kind: 'fire', x: C.x + Math.cos(a) * 8, y: C.y + Math.sin(a) * 9, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 10, life: 0.32, r: 3.4 }); }
    burst(P, R, C.x + F.w * 0.5, C.y, 24, 70, 200, { a0: -1.4, a1: 1.4, up: 30 }); P.ring({ x: C.x, y: C.y, r0: 5, r1: 22, th: 3, life: 0.26, rp: FIRE, ry: 1, layer: 'front' });
    for (let i = 0; i < 10; i++) P.add({ kind: 'ember', x: C.x + R.range(-8, 14), y: C.y + R.range(-9, 9), vx: R.range(-20, 70), vy: R.range(-60, 10), g: 40, life: R.range(0.5, 1.1), big: R.next() < 0.3 });
  });
  const aura = (t) => (t < T_ON ? eo(t / T_ON) : t < T_OFF - 0.5 ? 1 : clamp((T_OFF - t) / 0.5)) * (1 + 0.9 * clamp(1 - (t - flare) / 0.3) * (t >= flare ? 1 : 0));
  return {
    dur: 3.0, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t, a = aura(t);
      if (a > 0.05) { nA -= dt; if (nA <= 0) { nA = 0.04; const ang = R.range(0, 6.28); P.add({ kind: 'ember', x: C.x + Math.cos(ang) * F.w * 0.9, y: C.y + Math.sin(ang) * F.h * 0.7, vx: R.range(-6, 6), vy: R.range(-34, -14), life: R.range(0.4, 0.9) }); } }
      const q = t - T_C; if (q > 0.1 && q < 1.0) { nB -= dt; if (nB <= 0) { nB = 0.045; P.add({ kind: 'fire', x: A.x + ax(t) + R.range(-A.w * 0.3, A.w * 0.3), y: A.y - R.range(A.h * 0.3, A.h * 0.9), vx: 0, vy: -24, life: 0.28, r: 2 }); } }
    },
    draw(p, layer) {
      const t = B.t, a = aura(t);
      if (layer === 'back' && a > 0.05) { const N = 9; for (let i = 0; i < N; i++) { const ang = Math.PI * 0.5 + (i / N) * 6.2832, bx = C.x + Math.cos(ang) * F.w * 0.72, by = C.y + Math.sin(ang) * F.h * 0.62, back = Math.sin(ang) < 0; if (!back) continue; flame(p, bx, by, 2.4 * a, 3.4 * a, t + i, 30 + i, { up: 1, fade: 0.05 }); } }
      if (layer === 'front' && a > 0.05) {
        const N = 9; for (let i = 0; i < N; i++) { const ang = Math.PI * 0.5 + (i / N) * 6.2832, bx = C.x + Math.cos(ang) * F.w * 0.72, by = C.y + Math.sin(ang) * F.h * 0.62; if (Math.sin(ang) < 0) continue; flame(p, bx, by, 2.6 * a, 3.6 * a, t + i, 30 + i, { up: 1, fade: 0.05 }); }
        p.glow(C.x, C.y, 18 + 6 * (a - 1 > 0 ? a - 1 : 0), FIREC, 0.55 * Math.min(1, a)); p.glow(F.x, GY, 11, FIREC, 0.35 * Math.min(1, a));
      }
      if (layer === 'front' && t >= flare && t - flare < 0.28) p.glow(C.x + 6, C.y, 34, [255, 150, 70], 0.8 * (1 - (t - flare) / 0.28));
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const q = t - T_C, on = clamp(t / T_ON); let sy = kf(t, [[0, 1], [T_ON, 0.9], [T_ON + 0.2, 1]]), sx = kf(t, [[0, 1], [T_ON, 1.08], [T_ON + 0.2, 1]]); if (q > 0) { sy *= kf(q, [[0, 1], [0.08, 0.93], [0.3, 1]]); sx *= kf(q, [[0, 1], [0.08, 1.06], [0.3, 1]]); } return act({ sx, sy, dx: q > 0 ? kf(q, [[0, 0], [0.06, -1.5], [0.4, 0]]) : 0, tintA: 0.3 * aura(t) * on * (t < T_OFF ? 1 : 0), tint: [255, 120, 30] }); }
      const q = t - T_C, wind = t > T_W - 0.12 && t < T_DASH ? kf(t, [[T_W - 0.12, 0], [T_W + 0.1, 1]]) : 0;
      let sy = 1 - 0.14 * wind, sx = 1 + 0.12 * wind; if (q > 0) { sy *= kf(q, [[0, 0.8], [0.15, 1.1], [0.4, 1]]); sx *= kf(q, [[0, 1.16], [0.15, 0.94], [0.4, 1]]); }
      return act({ dx: ax(t), sx, sy, flash: q >= 0 ? clamp(1 - q / 0.13) : 0, tint: [255, 90, 30], tintA: q > 0 && q < 1.0 ? 0.3 * clamp(1 - q / 1.0) * (0.7 + 0.3 * Math.sin(q * 40)) : 0 });
    },
  };
}

// ───────────── Avivar (Fuego · apoyo · más ataque a una aliada) ─────────────
function avivar(ctx) {
  const R = ctx.R, F = ctx.from, A = ctx.to, B = base(ctx), P = B.P;
  const S0 = { x: F.x + F.w * 0.25, y: F.y - F.h * 0.95 }, T_REL = 0.42, T_FLY = 0.5, T_L = T_REL + T_FLY, T_END = 2.6;
  const body = { x: A.x, y: A.y - A.h * 0.5 }; let orb = null, nA = 0, nB = 0, up = -9;
  B.S.at(T_REL, () => { B.shake = 0.5; for (let i = 0; i < 8; i++) P.add({ kind: 'ember', x: S0.x + R.range(-3, 3), y: S0.y + R.range(-3, 3), vx: R.range(-10, 40), vy: R.range(-50, -10), life: 0.5, big: true }); });
  B.S.at(T_L, () => {
    up = B.t; B.shake = 1.2; P.ring({ x: A.x, y: GY, r0: 1, r1: 16, th: 2.5, life: 0.45, rp: FIRE, ry: 0.32 }); P.ring({ x: A.x, y: GY, r0: 1, r1: 10, th: 2, life: 0.36, rp: FIRE, ry: 0.32 });
    burst(P, R, A.x, GY - 2, 20, 40, 130, { a0: -2.7, a1: -0.45, up: 40 });
    for (let i = 0; i < 8; i++) P.add({ kind: 'dust', x: A.x + R.range(-6, 6), y: GY - 1, vx: R.range(-30, 30), vy: R.range(-12, -3), life: 0.4, r0: 1, r1: 3.5, layer: 'back' });
  });
  [0.12, 0.45, 0.78].forEach((d) => B.S.at(T_L + d, () => { P.add({ kind: 'chevron', x: A.x, y: A.y - A.h - 1, vx: 0, vy: -16, life: 0.85 }); P.add({ kind: 'chevron', x: A.x - 7, y: A.y - A.h * 0.6, vx: 0, vy: -14, life: 0.8 }); P.add({ kind: 'chevron', x: A.x + 7, y: A.y - A.h * 0.6, vx: 0, vy: -14, life: 0.8 }); B.shake = 0.4; P.ring({ x: A.x, y: A.y, r0: 3, r1: 14, th: 2, life: 0.45, rp: FIRE, ry: 0.32 }); }));
  const orbPos = (t) => { const u = clamp((t - T_REL) / T_FLY); return { x: lerp(S0.x, body.x, u), y: lerp(S0.y, body.y, u * u) - Math.sin(Math.PI * u) * 22 }; };
  const buff = (t) => (t < T_L ? 0 : t < T_END - 0.5 ? 1 : clamp((T_END - t) / 0.5));
  return {
    dur: 3.0, timeNow: () => B.t, count: () => P.a.length + ' partículas', get shake() { return B.shake; }, get stop() { const s = B.stop; B.stop = 0; return s; },
    update(dt) {
      B.tick(dt); const t = B.t; orb = t >= T_REL && t < T_L ? orbPos(t) : null;
      if (t < T_REL) { nA -= dt; if (nA <= 0) { nA = 0.04; P.add({ kind: 'ember', x: F.x + R.range(-F.w * 0.6, F.w * 0.6), y: F.y - R.range(0, 4), vx: R.range(-6, 6), vy: R.range(-34, -14), life: 0.6 }); } }
      if (orb) { nB -= dt; if (nB <= 0) { nB = 0.012; P.add({ kind: 'fire', x: orb.x - 1, y: orb.y + R.range(-1, 1), vx: R.range(-20, 0), vy: R.range(-10, 6), life: 0.22, r: 2.4 }); if (R.next() < 0.5) P.add({ kind: 'ember', x: orb.x, y: orb.y, vx: R.range(-30, 0), vy: R.range(-10, 20), g: 40, life: 0.5 }); } }
      if (t > T_L && t < T_END - 0.4) { nB -= dt; if (nB <= 0) { nB = 0.07; const sd = R.sign(); P.add({ kind: 'fire', x: A.x + sd * R.range(A.w * 0.2, A.w * 0.5), y: A.y - R.range(A.h * 0.3, A.h * 0.95), vx: 0, vy: -22, life: 0.3, r: 1.8 }); P.add({ kind: 'ember', x: A.x + R.range(-A.w * 0.5, A.w * 0.5), y: A.y - R.range(0, A.h), vx: R.range(-6, 6), vy: R.range(-40, -14), life: R.range(0.4, 0.9) }); } }
    },
    draw(p, layer) {
      const t = B.t, b = buff(t);
      if (layer === 'front') {
        if (t < T_REL) { const u = t / T_REL; p.glow(S0.x, S0.y, 9 + 8 * u, FIREC, 0.5 * u); flame(p, S0.x, S0.y, 0.8 + 2 * u, 0.9 + 2 * u, t, 3, { up: 0.3 }); }
        if (orb) { flame(p, orb.x, orb.y, 3.4, 3.1, t * 1.3, 9, { up: 0.1 }); p.disc(orb.x + 0.5, orb.y, 1.2, FIRE[8]); p.glow(orb.x, orb.y, 14, FIREC, 0.75); p.glow(orb.x, GY, 8, FIREC, 0.25); }
        if (t >= T_L && b > 0) { const k = clamp((t - T_L) / 0.4); const col = clamp(1 - (t - T_L) / 0.8); if (col > 0) { flame(p, A.x, A.y - A.h * 0.45, A.w * 0.75, A.h * 0.95, t, 12, { up: 0.8, fade: 0.25 + (1 - col) * 0.5 }); } p.glow(body.x, body.y, 20, FIREC, 0.5 * b * (0.7 + 0.3 * Math.sin(t * 12))); if (t - up < 0.25) p.glow(body.x, body.y, 32, [255, 150, 70], 0.7 * (1 - (t - up) / 0.25)); }
      }
      P.draw(p, layer);
    },
    actor(role) {
      const t = B.t;
      if (role === 'caster') { const r = t - T_REL; return act(t < T_REL ? { sy: kf(t, [[0, 1], [T_REL, 1.12]]), sx: kf(t, [[0, 1], [T_REL, 0.92]]), dy: -smooth(t / T_REL), tintA: 0.3 * (t / T_REL), tint: [255, 140, 50] } : { sy: kf(r, [[0, 1.12], [0.07, 0.86], [0.35, 1]]), sx: kf(r, [[0, 0.92], [0.07, 1.12], [0.35, 1]]), tintA: 0.25 * clamp(1 - r / 0.3), tint: [255, 140, 50] }); }
      if (t < T_L) return act({});
      const k = t - T_L, b = buff(t), bob = Math.max(0, Math.sin(clamp(k / 0.5) * Math.PI)), pul = 0.5 + 0.5 * Math.sin(k * 9);
      return act({ sy: 1 + 0.1 * bob, sx: 1 - 0.06 * bob, dy: -2 * bob, tint: [255, 120, 40], tintA: b * (0.14 + 0.12 * pul) + 0.3 * clamp(1 - k / 0.4), flash: 0.2 * clamp(1 - k / 0.12) });
    },
  };
}
// chevrones «^» que suben (subida de ataque)
const _pd2 = Particles.prototype.draw;
Particles.prototype.draw = function (p, layer) {
  _pd2.call(this, p, layer);
  for (const q of this.a) if (q.kind === 'chevron' && q.layer === layer) { const k = q.age / q.life, a = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1, c = FIRE[Math.min(8, 5 + Math.floor((1 - k) * 3))], d = FIRE[3]; for (let i = 0; i < 2; i++) { const y = q.y + i * 3; p.dpx(q.x, y - 2, c, a); p.dpx(q.x - 1, y - 1, c, a); p.dpx(q.x + 1, y - 1, c, a); p.dpx(q.x - 2, y, c, a); p.dpx(q.x + 2, y, c, a); p.dpx(q.x - 2, y + 1, d, a); p.dpx(q.x + 2, y + 1, d, a); } p.glow(q.x, q.y, 7, FIREC, 0.35 * a); }
};

(function () {
  const by = Object.fromEntries(MOVES.map((m) => [m.id, m])), F = '#f0603e';
  const add = [
    { id: 'zarpa', nombre: 'Zarpazo ígneo', el: 'Fuego', col: F, tipo: 'Básico · contacto', caster: 'fosforin', target: 'aguacato', make: zarpaArdiente, fases: ['Se agacha y enciende la garra', 'Embestida corta con estela', 'Tajo curvo de fuego', 'Impacto: parada, chispas y quemado', 'Vuelve a su sitio'], uso: 'Básico de cuerpo a cuerpo: la criatura sola, muy a menudo.' },
    { id: 'bola', nombre: 'Bola de magma', el: 'Fuego', col: F, tipo: 'Habilidad · proyectil + área', caster: 'fosforin', target: 'aguacato', make: bolaExplosiva, fases: ['Carga más larga', 'Lanzada en arco', 'Explosión grande con onda', 'Fragmentos de fuego que caen'], uso: 'Habilidad de área: la criatura sola, con enfriamiento.' },
    { id: 'tormenta', nombre: 'Lluvia de meteoritos', el: 'Fuego', col: F, tipo: 'Especial · zona', caster: 'fosforin', target: 'aguacato', make: tormentaFuego, fases: ['El cielo se enciende', 'Lluvia de bolas de fuego sobre el rival', 'Cada impacto deja fuego en el suelo', 'Bola final enorme con parada'], uso: 'Especial: lo lanzas tú con el botón cargado.' },
    { id: 'erupcion', nombre: 'Estallido volcánico', el: 'Fuego', col: F, tipo: 'Especial · zona bajo el rival', caster: 'fosforin', target: 'aguacato', make: erupcion, fases: ['Aviso: grietas incandescentes bajo el rival', 'Golpe contra el suelo', 'Columna de lava y fuego', 'El rival sale despedido', 'Brasas y humo'], uso: 'Especial: el aviso en el suelo permite leerlo.' },
    { id: 'aura', nombre: 'Aura ardiente', el: 'Fuego', col: F, tipo: 'Defensa · propia', caster: 'fosforin', target: 'aguacato', make: auraArdiente, fases: ['Se enciende un aura de llamas', 'El rival embiste', 'El aura estalla y lo quema', 'El rival sale rebotado'], uso: 'Hueco de defensa: castiga a quien ataca de cerca.' },
    { id: 'avivar', nombre: 'Fervor', el: 'Fuego', col: F, tipo: 'Apoyo · sube el ataque', caster: 'fosforin', target: 'pompon', make: avivar, fases: ['Concentra una brasa', 'La lanza en arco a la aliada', 'Fuego la envuelve', 'Tres flechas ^ de subida de ataque', 'Queda un brillo de brasas'], uso: 'Hueco de apoyo: mejora el ataque de una aliada.' },
  ].map((m) => Object.assign({}, m));
  const order = ['llamarada', 'zarpa', 'bola', 'salto', 'tormenta', 'erupcion', 'aura', 'avivar', 'escudo', 'brote'], all = Object.assign({}, by); add.forEach((m) => { all[m.id] = m; });
  MOVES.length = 0; order.forEach((id) => MOVES.push(all[id]));
})();
