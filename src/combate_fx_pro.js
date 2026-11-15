// combate_fx_pro.js — GENERADO por tools/generar_fx_pro.js desde tools/prototipo_fx (no editar a mano). Los 56 efectos de movimiento diseñados (núcleo de píxeles determinista: sin Math.random ni relojes).
// G.fxPro = { W, H, GY, tiene(id), crear(id, { semilla, from:{x,w,h}, to:{x,w,h}, sprites }) → instancia { update(dt), draw(p, capa), actor(rol), stop, shake, dur, timeNow() }, Painter, Rng, STEP }
// Escena de 128×80 px (1 px = 1 px del juego); el lanzador va a la izquierda y el objetivo a la derecha (el pintor refleja la escena cuando lanza el bando derecho).
(function (__root) {
// ═════════ NÚCLEO DE EFECTOS (prototipo) ═════════
// Puro y determinista: sin Math.random ni relojes; todo sale de una semilla y de pasos fijos de 1/120 s.
// 1 px del efecto = 1 px del juego (rejilla de 16 px). Dos búferes: color (opaco/tramado) y luz (aditiva).
const W = 128, H = 80, GY = 62;
const pack = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
const hex2 = (h) => pack(parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16));
const rgbOf = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ramp = (a) => a.map(hex2);
const FIRE = ramp(['#3a0f14', '#7a1c18', '#b92a1a', '#e8461c', '#ff7a22', '#ffae2e', '#ffd95a', '#fff2b0', '#ffffff']);
const SMOKE = ramp(['#1c1a22', '#2b2832', '#3d3a47', '#555160', '#716d7c']);
const WATER = ramp(['#0f3a63', '#1a5f95', '#2f8fd0', '#58b8ee', '#9ad8fa', '#dff4ff']);
const LEAF = ramp(['#16361f', '#245c2b', '#3d8a36', '#6cb544', '#a6dc5f', '#e0f59a']);
const HEAL = ramp(['#2a8a4a', '#58c76a', '#9be889', '#e2ffc8', '#ffffff']);
const DUST = ramp(['#4a3d33', '#6f5d4b', '#98846b']);
const PETAL = ramp(['#b83a6a', '#e0608e', '#f59ab5', '#ffd6e2', '#fff4f7']);
const WHITE = hex2('#ffffff');

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const ei = (x) => clamp(x) * clamp(x);
const eback = (x) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
// fotogramas clave: [[t, v], …] con suavizado entre cada par
function kf(t, k) { if (t <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], smooth((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]))); return k[k.length - 1][1]; }

class Rng { constructor(s) { this.s = s >>> 0; } next() { let t = (this.s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } range(a, b) { return a + (b - a) * this.next(); } pick(a) { return a[Math.floor(this.next() * a.length)]; } sign() { return this.next() < 0.5 ? -1 : 1; } }

function h2(x, y, s) { let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
function vn(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(h2(xi, yi, s), h2(xi + 1, yi, s), u), lerp(h2(xi, yi + 1, s), h2(xi + 1, yi + 1, s), u), v); }
const fbm = (x, y, s) => vn(x, y, s) * 0.6 + vn(x * 2.1, y * 2.1, s + 7) * 0.3 + vn(x * 4.3, y * 4.3, s + 13) * 0.1;
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bay = (x, y) => BAY[((y & 3) << 2) | (x & 3)];

// ── Pintor: color (opaco o tramado), luz aditiva y oscurecido del suelo ──
class Painter {
  constructor() { this.color = new Uint32Array(W * H); this.light = new Float32Array(W * H * 3); this.dk = new Float32Array(W * H); }
  clear() { this.color.fill(0); this.light.fill(0); this.dk.fill(0); }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; this.color[y * W + x] = c; }
  dpx(x, y, c, a) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; if (a >= 1 || bay(x, y) < a) this.color[y * W + x] = c; }
  dark(x, y, a) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; if (a > this.dk[i]) this.dk[i] = a; }
  glow(cx, cy, r, rgb, I) {
    if (I <= 0.01 || r < 1) return;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r; if (d >= 1) continue;
      const v = (1 - d) * (1 - d) * I, q = Math.floor(v * 6 + bay(x, y)) / 6, i = (y * W + x) * 3;
      this.light[i] += rgb[0] * q; this.light[i + 1] += rgb[1] * q; this.light[i + 2] += rgb[2] * q;
    }
  }
  disc(cx, cy, r, c, a = 1, ry) {
    ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const nx = (x + 0.5 - cx) / r, ny = (y + 0.5 - cy) / ry; if (nx * nx + ny * ny <= 1) this.dpx(x, y, c, a); }
  }
  ring(cx, cy, r, th, c, ry = 1, a = 1) {
    const R = Math.ceil(r + th);
    for (let y = Math.floor(cy - R * ry - 1); y <= Math.ceil(cy + R * ry + 1); y++) for (let x = Math.floor(cx - R - 1); x <= Math.ceil(cx + R + 1); x++) {
      const d = Math.hypot((x + 0.5 - cx), (y + 0.5 - cy) / ry); if (Math.abs(d - r) <= th / 2) this.dpx(x, y, c, a);
    }
  }
  line(x0, y0, x1, y1, c) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) this.px(lerp(x0, x1, i / n), lerp(y0, y1, i / n), c); }
  // sprite anclado por los pies; o = { sx, sy, dx, dy, flash, tint:[r,g,b], tintA, alpha, flat:color }
  sprite(sp, fx, fy, o = {}) {
    const sx = o.sx || 1, sy = o.sy || 1, dw = Math.max(1, Math.round(sp.w * sx)), dh = Math.max(1, Math.round(sp.h * sy));
    const ox = Math.round(fx + (o.dx || 0) - dw / 2), oy = Math.round(fy + (o.dy || 0) - dh), fl = o.flash || 0, ta = o.tintA || 0, al = o.alpha === undefined ? 1 : o.alpha;
    for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) {
      const c = sp.data[Math.min(sp.h - 1, Math.floor(j * sp.h / dh)) * sp.w + Math.min(sp.w - 1, Math.floor(i * sp.w / dw))]; if ((c >>> 24) < 128) continue;
      let r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255;
      if (o.flat !== undefined) { r = o.flat & 255; g = (o.flat >> 8) & 255; b = (o.flat >> 16) & 255; }
      if (ta > 0) { r = lerp(r, o.tint[0], ta); g = lerp(g, o.tint[1], ta); b = lerp(b, o.tint[2], ta); }
      if (fl > 0) { r = lerp(r, 255, fl); g = lerp(g, 255, fl); b = lerp(b, 255, fl); }
      this.dpx(ox + i, oy + j, pack(r | 0, g | 0, b | 0), al);
    }
  }
}

// ── Llama: campo de ruido que sube; el centro es el más caliente ──
function flame(p, cx, cy, rx, ry, t, seed, o = {}) {
  const rp = o.ramp || FIRE, n = rp.length, up = o.up === undefined ? 1 : o.up, fade = o.fade || 0, rise = o.rise || 3.2, thr = o.thr || 0.05;
  const x0 = Math.floor(cx - rx - 2), x1 = Math.ceil(cx + rx + 2), y0 = Math.floor(cy - ry * (1 + up * 0.5) - 2), y1 = Math.ceil(cy + ry + 2);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    if (ny < 0) { nx /= 1 - Math.min(1, -ny) * 0.5 * up; ny /= 1 + up * 0.5; }
    const d = Math.sqrt(nx * nx + ny * ny), nz = fbm(x * 0.16, y * 0.16 - t * rise, seed), v = 1.05 - d + (nz - 0.5) * 0.95 - fade;
    if (v <= thr) continue;
    p.px(x, y, rp[Math.max(0, Math.min(n - 1, Math.floor(v * n * 1.02)))]);
  }
}
// hoja: elipse girada con nervio central y borde oscuro
function leaf(p, cx, cy, len, wid, ang, rp = LEAF, a = 1) {
  const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.ceil(len) + 1;
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    const u = x * ca + y * sa, v = -x * sa + y * ca, e = (u / len) * (u / len) + (v / wid) * (v / wid);
    if (e > 1) continue;
    const rim = e > 0.62, mid = Math.abs(v) < 0.45 && u > -len * 0.8;
    p.dpx(cx + x, cy + y, rim ? rp[1] : mid ? rp[4] : v < 0 ? rp[3] : rp[2], a);
  }
}

// ── Partículas ──
class Particles {
  constructor(R) { this.R = R; this.a = []; this.rings = []; }
  add(o) { o.age = 0; o.seed = Math.floor(this.R.next() * 99999); o.layer = o.layer || 'front'; o.g = o.g || 0; o.drag = o.drag || 0; this.a.push(o); return o; }
  ring(o) { o.age = 0; o.layer = o.layer || 'back'; o.ry = o.ry === undefined ? 0.32 : o.ry; this.rings.push(o); }
  update(dt, gy) {
    const keep = [];
    for (const q of this.a) {
      q.age += dt; if (q.age >= q.life) { if (q.kind === 'drop' && q.splash && q.y >= gy - 1) this.ring({ x: q.x, y: gy, r0: 0.5, r1: 4, th: 1, life: 0.35, rp: WATER, layer: 'back' }); continue; }
      q.vy += q.g * dt; if (q.drag) { const f = Math.exp(-q.drag * dt); q.vx *= f; q.vy *= f; }
      if (q.orbit) { q.ang += q.w * dt; q.orR = lerp(q.orR0, 1, smooth(q.age / q.life)); q.x = q.cx + Math.cos(q.ang) * q.orR; q.y = q.cy + Math.sin(q.ang) * q.orR * 0.8; }
      else { q.x += q.vx * dt; q.y += q.vy * dt; }
      if (q.bounce && q.y > gy) { q.y = gy; q.vy *= -q.bounce; q.vx *= 0.7; if (Math.abs(q.vy) < 8) q.vy = 0; }
      if (q.kind === 'drop' && q.splash && q.y >= gy) { this.ring({ x: q.x, y: gy, r0: 0.5, r1: 4.5, th: 1, life: 0.4, rp: WATER, layer: 'back' }); continue; }
      keep.push(q);
    }
    this.a = keep;
    this.rings = this.rings.filter((r) => (r.age += dt) < r.life);
  }
  draw(p, layer) {
    for (const r of this.rings) if (r.layer === layer) { const k = r.age / r.life, rad = lerp(r.r0, r.r1, eo(k)), c = r.rp[Math.max(0, Math.min(r.rp.length - 1, Math.floor((1 - k) * r.rp.length)))]; p.ring(r.x, r.y, rad, lerp(r.th, 1.4, k), c, r.ry, k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1); }
    for (const q of this.a) {
      if (q.layer !== layer) continue;
      const k = q.age / q.life;
      switch (q.kind) {
        case 'ember': { if (h2(q.seed, Math.floor(q.age * 40), 5) < 0.18) break; const rp = q.rp || FIRE; p.px(q.x, q.y, rp[Math.max(1, Math.floor((1 - k) * (rp.length - 2)) + 1)]); if (q.big) p.px(q.x + 1, q.y, rp[Math.max(1, Math.floor((1 - k) * (rp.length - 2)))]); if (!q.noglow) p.glow(q.x, q.y, 5, q.gc || [255, 120, 40], 0.3 * (1 - k)); break; }
        case 'spark': { const sp = Math.hypot(q.vx, q.vy) || 1, L = Math.min(5, sp * 0.035), rp = q.rp || FIRE, c = rp[Math.max(2, Math.floor((1 - k) * (rp.length - 1)))]; for (let i = 0; i <= L; i++) p.px(q.x - (q.vx / sp) * i, q.y - (q.vy / sp) * i, i === 0 ? WHITE : c); p.glow(q.x, q.y, 6, q.gc || [255, 150, 60], 0.35 * (1 - k)); break; }
        case 'smoke': { const r = lerp(q.r0, q.r1, eo(k)); p.disc(q.x, q.y, r, SMOKE[Math.min(4, 1 + Math.floor(k * 3))], (1 - k) * (q.a0 || 0.55)); break; }
        case 'fire': { const r = q.r * (1 - k * 0.55); flame(p, q.x, q.y, r, r * 1.15, q.age, q.seed, { fade: k * 0.55, rise: 4 }); p.glow(q.x, q.y, q.r * 3.2, [255, 130, 40], 0.5 * (1 - k)); break; }
        case 'dust': { const r = lerp(q.r0, q.r1, eo(k)); p.disc(q.x, q.y, r, DUST[1 + (q.seed & 1)], (1 - k) * 0.7); break; }
        case 'drop': { const c = WATER[2 + (q.seed % 4)]; p.px(q.x, q.y, c); if (q.big) p.px(q.x, q.y + 1, WATER[2]); break; }
        case 'leaf': { const sw = Math.sin(q.age * q.w + q.seed) * 0.5; leaf(p, q.x, q.y, q.len || 2.6, 1.3, q.age * q.w + q.seed + sw, q.rp || LEAF); break; }
        case 'sparkle': { const s = Math.sin(k * Math.PI), L = Math.round(1 + s * (q.len || 2)), c = (q.rp || HEAL)[Math.min(4, 2 + Math.floor(s * 2.5))]; p.px(q.x, q.y, WHITE); if (s > 0.25) { for (let i = 1; i <= L; i++) { p.px(q.x + i, q.y, c); p.px(q.x - i, q.y, c); p.px(q.x, q.y + i, c); p.px(q.x, q.y - i, c); } } p.glow(q.x, q.y, 5, q.gc || [140, 255, 150], 0.25 * s); break; }
      }
    }
  }
}
// ── Guion: acciones en instantes concretos ──
class Script { constructor() { this.l = []; } at(t, fn) { this.l.push({ t, fn, done: false }); this.l.sort((a, b) => a.t - b.t); } run(t) { for (const e of this.l) if (!e.done && t >= e.t) { e.done = true; e.fn(); } } }

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

  const __porId = {}; MOVES.forEach((m) => { __porId[m.id] = m; });
  __root.G.fxPro = { W, H, GY, STEP: 1 / 120, Painter, Rng, ids: MOVES.map((m) => m.id), tiene: (id) => !!__porId[id], crear(id, o) { const m = __porId[id]; return m.make({ R: new Rng(o.semilla >>> 0), from: { x: o.from.x, y: GY, w: o.from.w, h: o.from.h }, to: { x: o.to.x, y: GY, w: o.to.w, h: o.to.h }, sprites: o.sprites }); } };
})(typeof window !== 'undefined' ? window : globalThis);
