// ═════════ ESCENARIO ═════════
const CX = 32, TX = 94, STEP = 1 / 120;
const $ = (i) => document.getElementById(i);
const sprites = {};
function loadSprites(data) {
  return Promise.all(Object.entries(data).flatMap(([id, dirs]) => Object.entries(dirs).map(([d, o]) => new Promise((res) => {
    const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const id2 = g.getImageData(0, 0, c.width, c.height); (sprites[id] = sprites[id] || {})[d] = { w: c.width, h: c.height, data: new Uint32Array(id2.data.buffer.slice(0)) }; res(); }; im.src = o.u;
  }))));
}
// fondo: cielo en bandas tramadas y suelo de hierba oscura
const bg = new Uint32Array(W * H);
(function () {
  const sky = ['#10152a', '#151b34', '#1a2240', '#202a4a'].map(hex2), gr = ['#1d3326', '#22402b', '#27492f'].map(hex2), edge = hex2('#142419');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c;
    if (y < 44) { const b = Math.floor(y / 11), f = (y % 11) / 11; c = sky[Math.min(3, b + (bay(x, y) < f ? 1 : 0))]; if (h2(x, y, 99) > 0.996) c = hex2('#8fa0c8'); }
    else { const n = fbm(x * 0.12, y * 0.2, 5); c = gr[n < 0.4 ? 0 : n < 0.62 ? 1 : 2]; if (y === 44) c = edge; if ((x % 16 === 0 && y > 46) || (y % 16 === 14 && y > 46)) c = lerpCol(c, edge, 0.35); if (h2(x, y, 21) > 0.985) c = gr[2]; }
    bg[y * W + x] = c;
  }
  function lerpCol(a, b, t) { return pack(lerp(a & 255, b & 255, t) | 0, lerp((a >> 8) & 255, (b >> 8) & 255, t) | 0, lerp((a >> 16) & 255, (b >> 16) & 255, t) | 0); }
})();

const cv = $('stage'), cx = cv.getContext('2d'), off = document.createElement('canvas'); off.width = W; off.height = H;
const octx = off.getContext('2d'), img = octx.createImageData(W, H), img32 = new Uint32Array(img.data.buffer), P = new Painter();
const S = { idx: 0, inst: null, acc: 0, freeze: 0, speed: 1, paused: false, loop: true, light: true, endWait: 0, frame: 0, ms: 0, frames: 0, seedN: 7 };

function start(i) {
  S.idx = i; const m = MOVES[i], cs = sprites[m.caster].right, ts = sprites[m.target].left;
  const R = new Rng(1234 + i * 77);
  S.cs = cs; S.ts = ts;
  S.inst = m.make({ R, from: { x: CX, y: GY, w: cs.w, h: cs.h }, to: { x: TX, y: GY, w: ts.w, h: ts.h }, sprites: { caster: cs, target: ts } });
  S.acc = 0; S.freeze = 0; S.endWait = 0;
  document.querySelectorAll('.mv').forEach((b, j) => b.setAttribute('aria-pressed', j === i));
  info(m);
}
function info(m) {
  $('nom').textContent = m.nombre; $('tipo').textContent = m.el + ' · ' + m.tipo; $('uso').textContent = m.uso;
  $('fases').innerHTML = m.fases.map((f) => '<li>' + f + '</li>').join('');
  $('dot').style.background = m.col;
  try { history.replaceState(null, '', '#' + m.id); } catch (e) { }
}
function drawShadow(p, x, w, lift) { const a = 0.55 * clamp(1 - lift / 30); for (let yy = -2; yy <= 2; yy++) for (let xx = -Math.ceil(w); xx <= Math.ceil(w); xx++) if ((xx / w) ** 2 + (yy / 2.2) ** 2 <= 1) p.dark(x + xx, GY + yy, a); }
function render() {
  const inst = S.inst, p = P; p.clear();
  const ac = inst.actor('caster'), at = inst.actor('target'), jit = S.freeze > 0 ? (S.frame % 2 ? 1 : -1) : 0;
  drawShadow(p, CX + ac.dx, S.cs.w * 0.42, -ac.dy); drawShadow(p, TX + at.dx, S.ts.w * 0.42, -at.dy);
  inst.draw(p, 'back');
  p.sprite(S.cs, CX, GY, ac); p.sprite(S.ts, TX, GY, Object.assign({}, at, { dx: at.dx + jit }));
  inst.draw(p, 'front');
  const col = p.color, lt = p.light, dk = p.dk, L = S.light;
  for (let i = 0; i < W * H; i++) {
    let c = bg[i], d = dk[i];
    if (d > 0) { const f = 1 - 0.6 * d; c = pack(((c & 255) * f) | 0, (((c >> 8) & 255) * f) | 0, (((c >> 16) & 255) * f) | 0); }
    const o = col[i]; if (o >>> 24) c = o;
    if (L) { const j = i * 3; let r = (c & 255) + lt[j], g = ((c >> 8) & 255) + lt[j + 1], b = ((c >> 16) & 255) + lt[j + 2]; c = pack(r > 255 ? 255 : r, g > 255 ? 255 : g, b > 255 ? 255 : b); }
    img32[i] = c;
  }
  octx.putImageData(img, 0, 0);
  const sh = inst.shake, sx = sh > 0.3 ? Math.round((h2(S.frame, 1, 3) - 0.5) * 2 * sh) : 0, sy = sh > 0.3 ? Math.round((h2(S.frame, 2, 3) - 0.5) * 2 * sh) : 0;
  cx.imageSmoothingEnabled = false; cx.fillStyle = '#0c0f1d'; cx.fillRect(0, 0, cv.width, cv.height);
  const k = cv.width / W; cx.drawImage(off, sx * k, sy * k, cv.width, cv.height);
}
let last = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  if (S.inst) {
    if (!S.paused) {
      S.acc += dt * S.speed; let n = 0;
      while (S.acc >= STEP && n < 12) {
        S.acc -= STEP; n++;
        if (S.freeze > 0) { S.freeze -= STEP; continue; }
        S.inst.update(STEP); const st = S.inst.stop; if (st > 0) S.freeze = st;
      }
      if (S.inst.dur && S.inst.actor && S.t_over()) { S.endWait += dt; if (S.loop && S.endWait > 0.7) start(S.idx); }
    }
    S.frame++; const t0 = performance.now(); render(); S.ms = S.ms * 0.9 + (performance.now() - t0) * 0.1;
    if ((S.frame & 15) === 0) { $('perf').textContent = S.ms.toFixed(2) + ' ms por fotograma · ' + (S.inst.count ? S.inst.count() : '') ; }
  }
  requestAnimationFrame(loop);
}
S.t_over = () => S.inst.timeNow() >= S.inst.dur;
function fit() { const w = Math.min($('wrap').clientWidth, 768), k = Math.max(1, Math.floor(w / W)); cv.width = W * k; cv.height = H * k; cv.style.width = cv.width + 'px'; cv.style.height = cv.height + 'px'; }
function boot(data) {
  loadSprites(data).then(() => {
    MOVES.forEach((m, i) => { const b = document.createElement('button'); b.className = 'mv'; b.style.setProperty('--c', m.col); b.innerHTML = '<i></i>' + m.nombre; b.onclick = () => start(i); $('moves').appendChild(b); });
    $('rep').onclick = () => start(S.idx);
    $('pau').onclick = () => { S.paused = !S.paused; $('pau').textContent = S.paused ? 'Seguir' : 'Pausa'; };
    document.querySelectorAll('[data-sp]').forEach((b) => b.onclick = () => { S.speed = +b.dataset.sp; document.querySelectorAll('[data-sp]').forEach((x) => x.setAttribute('aria-pressed', x === b)); });
    $('loop').onchange = (e) => { S.loop = e.target.checked; }; $('luz').onchange = (e) => { S.light = e.target.checked; };
    window.addEventListener('resize', fit); fit();
    const h = (location.hash || '').slice(1); start(Math.max(0, MOVES.findIndex((m) => m.id === h)));
    requestAnimationFrame(loop);
    window.__fx = { seek(i, t) { start(i); let q = 0; while (q < t) { S.inst.update(STEP); S.inst.stop; q += STEP; S.inst.timeNow && 0; } S.frame = 3; render(); return true; } };
  });
}
