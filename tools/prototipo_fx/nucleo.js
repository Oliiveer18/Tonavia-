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
