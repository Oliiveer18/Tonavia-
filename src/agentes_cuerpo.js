// agentes_cuerpo.js — EL CUERPO de un entrenador en un mapa real (v2.324). PURO salvo crear su sprite la primera vez que se pinta. Guía: docs/AGENTES.md.
// Idea central: el cuerpo NO se simula. Es una PROYECCIÓN del estado abstracto: posición = f(paso en curso, tiempo). Cada paso ocurre en un punto de interés
// del lugar (a.poi → paso.poi): 'p:<puerta>' delante de una puerta · 'x:<vecino>' salida hacia otro mapa · 'f:<n>' punto de pesca · 'plaza' · 'z' campo · 'c:x,y,l|r' casilla concreta.
// El entrenador camina por el camino más corto (BFS sobre las casillas libres) a la velocidad del jugador y se queda allí; si el paso es «dentro», desaparece
// tras la puerta. Sin estado por cuadro: nada que guardar ni sincronizar, y pintar 3 o 300 cuesta lo mismo para la simulación (nivel de detalle gratis).
// Los mapas que aún no existen usan tiempos nominales según su tamaño (datos/mundo.json), así el mundo entero funciona aunque solo haya dos mapas dibujados.
(function (root) {
  'use strict';
  const G = root.G, A = G && G.agentes; if (!A || !A.acciones) return;
  const D = A.D, AJ = A.AJ, T = 16, VEL = AJ.velocidad, real = (id) => (G.mundo && G.mundo.mapas && G.mundo.mapas[id]) || null;
  const INFO = new Map();
  function info(m) {   // casillas alcanzables desde la plaza (en orden de cercanía) y cachés de puntos y caminos
    let c = INFO.get(m.id); if (c && c.m === m) return c;
    const Wd = m.W, H = m.H, sol = (x, y) => x < 0 || y < 0 || x >= Wd || y >= H || G.mundo.solido(m, x, y), an = m.anclas || {};
    let b = an.plaza || an.inicio || an.entrada; if (!b || sol(b[0], b[1])) { b = null; for (let y = 0; y < H && !b; y++) for (let x = 0; x < Wd; x++) if (!sol(x, y)) { b = [x, y]; break; } }
    const alc = new Uint8Array(Wd * H), lista = []; if (b) { alc[b[1] * Wd + b[0]] = 1; lista.push([b[0], b[1]]); for (let i = 0; i < lista.length; i++) { const [x, y] = lista[i]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (!sol(nx, ny) && !alc[ny * Wd + nx]) { alc[ny * Wd + nx] = 1; lista.push([nx, ny]); } }); } }
    c = { m, alc, lista, poi: {}, cam: new Map() }; INFO.set(m.id, c); return c;
  }
  function cercana(c, x, y) { const W = c.m.W; if (x >= 0 && y >= 0 && x < W && y < c.m.H && c.alc[y * W + x]) return [x, y]; let m = c.lista[0] || [0, 0], md = Infinity; c.lista.forEach((q) => { const d = Math.abs(q[0] - x) + Math.abs(q[1] - y); if (d < md) { md = d; m = q; } }); return m; }
  function salidasHacia(m, v) {   // puertas de un mapa dibujado que llevan, por el camino más corto del grafo, hacia el vecino v (las que el jugador puede cruzar de verdad)
    const W = A.Wn(m.id); return (m.puertas || []).filter((p) => p.destino && p.destino.mapa && (p.destino.mapa === v || (W.nodos[p.destino.mapa] && W.sig[m.id] && W.sig[m.id][p.destino.mapa] === v)));
  }
  function casilla(m, poi, i) {   // { x, y, dir } de un punto de interés en un mapa real
    const c = info(m), k0 = poi === 'plaza' ? 'q' : poi[0], clave = poi + '#' + i; if (c.poi[clave]) return c.poi[clave];   // F7: la clave lleva el índice COMPLETO del entrenador. Antes llevaba i%6 / i%24 aunque el valor dependiera de i (sa[i % sa.length], plaza(), z): gana el primero que lo pedía y el resultado dependía de quién llegó antes (otra población en el mismo proceso, otro orden de carga) → tiempos de camino distintos → simulación distinta (el test «v2.324 agentes … simulación larga» intermitente)
    if (c.np > 4000) { c.poi = {}; c.np = 0; } c.np = (c.np | 0) + 1;
    const L = c.lista, plaza = () => L[Math.min(L.length - 1, 1 + (i % 24) * 2)] || [0, 0]; /* v2.325: 24 sitios salteados alrededor de la plaza (antes 12 pegados: se pisaban) */ let q, dir = 'down';
    if (k0 === 'p') { const nm = poi.slice(2), pu = (m.puertas || []).find((p) => p.id === nm); if (pu) { q = [pu.x, pu.y + 1]; dir = 'up'; } else q = (m.anclas && m.anclas[nm]) || plaza(); }
    else if (k0 === 'x') {   // v2.326: sale por una puerta REAL que el jugador también puede usar (la que lleva hacia ese vecino); si el vecino aún no existe, «sale» por una puerta de edificio (se pierde dentro y reaparece en ella): nadie cruza un borde cerrado
      const v = poi.slice(2), sa = salidasHacia(m, v), n = A.Wn(m.id).nodos[m.id], lado = n ? (n.vecinos.find((z) => z.id === v) || {}).lado : null;
      if (sa.length) { const pu = sa[i % sa.length]; q = [pu.x, pu.y]; dir = lado === 'este' ? 'right' : lado === 'oeste' ? 'left' : lado === 'norte' ? 'up' : 'down'; }
      else { const ed = (m.puertas || []).filter((p) => p.destino && p.destino.mapa && String(p.destino.mapa)[0] !== '@' && !(A.Wn(m.id).nodos[p.destino.mapa])), pu = ed.find((p) => p.id === 'centro_pc') || ed[0]; if (pu) { q = [pu.x, pu.y + 1]; dir = 'up'; } else q = plaza(); } }
    else if (k0 === 'f' && m.pesca && m.pesca.length) { const n = m.pesca.length, pt = poi.slice(2).split('.'), k = (+pt[0] || 0) % n, p = m.pesca[k], d = pt[1] === '1' ? 2 : 0, lat = p.mira === 'left' || p.mira === 'right'; q = [p.x + (lat ? 0 : d), p.y]; /* v2.334: 'f:<punto>.<lado>' (lado 1 = dos casillas al lado; en el puente solo hay un sitio) */ dir = p.mira || 'down'; }   // v2.325: si el punto está cogido se ponen al lado, a lo largo de la orilla (antes varios pescaban en la misma casilla)
    else if (k0 === 'c') { const v = poi.slice(2).split(','); q = [+v[0] || 0, +v[1] || 0]; dir = { l: 'left', r: 'right', u: 'up', d: 'down' }[v[2]] || 'right'; }   // v2.325: casilla concreta (el que reta se coloca a dos casillas de su rival, mirándole)
    else if (k0 === 'z' && L.length) q = L[A.mez(i * 31 + 7) % L.length];
    else q = plaza();
    q = cercana(c, q[0], q[1]); return (c.poi[clave] = { x: q[0], y: q[1], dir });
  }
  function camino(c, a, b) {   // camino más corto en casillas (BFS de 4 vecinos); se guarda por pareja de puntos
    const W = c.m.W, k = a.x + ',' + a.y + '>' + b.x + ',' + b.y; let r = c.cam.get(k); if (r) return r;
    const de = new Int32Array(W * c.m.H).fill(-1), s = a.y * W + a.x, e = b.y * W + b.x, cola = [s]; de[s] = s;
    for (let i = 0; i < cola.length && de[e] < 0; i++) { const q = cola[i], x = q % W, y = (q / W) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= c.m.H) return; const n = ny * W + nx; if (c.alc[n] && de[n] < 0) { de[n] = q; cola.push(n); } }); }
    const pts = []; if (de[e] >= 0) for (let q = e; ; q = de[q]) { pts.unshift([q % W, (q / W) | 0]); if (q === s) break; } else pts.push([a.x, a.y], [b.x, b.y]);
    r = { pts, L: (pts.length - 1) * T }; if (c.cam.size > 600) c.cam.clear(); c.cam.set(k, r); return r;
  }
  // cuánto tarda en ir de un punto a otro dentro de un lugar: camino real si el mapa existe; si no, un tiempo nominal según su tamaño
  function tAndar(nid, p1, p2, i) {
    if (p1 === p2) return 0; const n = A.Wn(nid).nodos[nid], m = n && n.real ? real(nid) : null;
    if (m) { const c = info(m); return camino(c, casilla(m, p1, i), casilla(m, p2, i)).L / VEL; }
    const lado = (p) => (p[0] === 'x' ? (n.vecinos.find((z) => z.id === p.slice(2)) || {}).lado : null), l1 = lado(p1), l2 = lado(p2), eje = (l) => (l === 'este' || l === 'oeste' ? n.W : n.H);
    if (l1 && l2) return ((l1 === l2 ? 4 : (l1 === 'este' || l1 === 'oeste') === (l2 === 'este' || l2 === 'oeste') ? eje(l1) : (n.W + n.H) / 2) * T) / VEL;
    return ((l1 || l2 ? eje(l1 || l2) / 2 : (n.W + n.H) / 6) * T) / VEL;
  }
  const DIR = (dx, dy, d0) => (dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : dy < 0 ? 'up' : d0);
  function pose(a, t, m) {   // v2.326: al salir de un edificio asoma por la puerta (un paso y se hace visible)
    const q = pose0(a, t, m), s = a.sal === undefined ? 9 : t - a.sal;
    if (q && s >= 0 && s < 0.35 && q.al === undefined && (a.poi[0] === 'p' || a.poi[0] === 'x') && casilla(m, a.poi, a.i).dir === 'up') { const f = s / 0.35; q.y -= T * (1 - f); q.al = f; }
    return q;
  }
  function pose0(a, t, m) {   // dónde está ahora mismo (px del mapa) o null si está dentro de un edificio
    const p = a.paso, de = casilla(m, a.poi, a.i), px = (q) => ({ x: q.x * T + 8, y: q.y * T + 14, dir: q.dir, mv: false, tm: 0 });
    if (!p || !p.poi || p.poi === a.poi) return p && p.dentro ? null : px(de);   // (v2.325: quien repite algo dentro del edificio no se queda pintado en la puerta)
    const a2 = casilla(m, p.poi, a.i), cam = camino(info(m), de, a2), d = (t - p.t0) * VEL;
    if (d >= cam.L) { if (!p.dentro) return px(a2); const e = d - cam.L, o = casilla(m, p.poi, a.i); return e < T && o.dir === 'up' && p.poi[0] !== 'c' ? { x: px(a2).x, y: px(a2).y - e, dir: 'up', mv: true, tm: e / VEL, al: 1 - e / T } : null; }   // v2.326: entra por la puerta (un paso más y se desvanece)
    const k = Math.max(0, d / T), i0 = Math.min(cam.pts.length - 2, Math.floor(k)), f = k - i0, P = cam.pts[i0], Q = cam.pts[i0 + 1];
    return { x: (P[0] + (Q[0] - P[0]) * f) * T + 8, y: (P[1] + (Q[1] - P[1]) * f) * T + 14, dir: DIR(Q[0] - P[0], Q[1] - P[1], 'down'), mv: true, tm: t - p.t0 };
  }
  // ── Interiores (v2.326): quien «entra» al Centro PC o a la tienda se VE dentro: entra por la puerta, va a un sitio frente al mostrador, espera y sale. Misma idea: posición = f(paso, tiempo) ──
  const IN = new Map();
  function infoDentro(mi) {   // sitios de espera: casillas alcanzables cerca del mostrador (sin tapar al empleado, ni la casilla de cara a él, ni la entrada)
    let c = IN.get(mi.id); if (c && c.m === mi) return c;
    const ci = info(mi), an = mi.anclas || {}, f = an.npc_frente || an.entrada || an.inicio || [1, 1], n = an.npc || null, e = an.entrada || an.inicio || ci.lista[0] || [1, 1], dd = (q, z) => Math.abs(q[0] - z[0]) + Math.abs(q[1] - z[1]);
    const sl = ci.lista.filter((q) => !(n && q[0] === n[0] && q[1] === n[1]) && !(q[0] === f[0] && q[1] === f[1]) && dd(q, e) >= 2 && dd(q, f) >= 2 && (!n || q[1] > n[1] + 1)).sort((a, b) => dd(a, f) - dd(b, f) || a[1] - b[1] || a[0] - b[0]).slice(0, 8);
    c = { m: mi, ci, sl, e, n, f }; IN.set(mi.id, c); return c;
  }
  function sobre(cam, d) { const k = Math.max(0, d / T), i0 = Math.max(0, Math.min(cam.pts.length - 2, Math.floor(k))), f = Math.min(1, k - i0), P = cam.pts[i0], Q = cam.pts[Math.min(cam.pts.length - 1, i0 + 1)]; return { x: (P[0] + (Q[0] - P[0]) * f) * T + 8, y: (P[1] + (Q[1] - P[1]) * f) * T + 14, dir: DIR(Q[0] - P[0], Q[1] - P[1], null) }; }
  function poseDentro(a, t, mi) {   // dónde está dentro de ese interior ahora mismo, o null si no está allí (o no le toca)
    const p = a.paso; if (!p || !p.dentro || p.a === 'ir' || a.sig === null || !p.poi || p.poi[0] !== 'p') return null;
    const nodo = (A.Wn(a.lug).nodos[a.lug] && real(a.lug)) || null, pu = nodo && (nodo.puertas || []).find((q) => q.id === p.poi.slice(2)); if (!pu || !pu.destino || pu.destino.mapa !== mi.id) return null;
    const tin = p.t0 + (p.w || 0) + 0.35, D = a.sig - tin, tt = t - tin; if (tt < 0 || D <= 0.1 || tt >= D) return null;
    const ci = infoDentro(mi), s = ci.sl.length ? ci.sl[a.i % ci.sl.length] : ci.e, cam = camino(ci.ci, { x: ci.e[0], y: ci.e[1] }, { x: s[0], y: s[1] }), d = Math.max(0, Math.min(tt, D - tt, cam.L / VEL)) * VEL, o = cam.pts.length > 1 ? sobre(cam, d) : { x: s[0] * T + 8, y: s[1] * T + 14, dir: null };
    const al = Math.min(1, tt / 0.3, (D - tt) / 0.3), quieto = d <= 0 || d >= cam.L, cara = ci.n ? (Math.abs(ci.n[0] - s[0]) > Math.abs(ci.n[1] - s[1]) ? (ci.n[0] > s[0] ? 'right' : 'left') : (ci.n[1] > s[1] ? 'down' : 'up')) : 'up';
    return { x: o.x, y: o.y, dir: quieto ? cara : (o.dir || cara), mv: !quieto, tm: tt, al: al < 1 ? Math.max(0, al) : undefined };
  }
  function dentroDe(mapaId) {   // [{ nodo, puerta }] que llevan a ese interior
    const w = A.Wn(mapaId), out = []; if (!w) return out; Object.keys(w.nodos).forEach((id) => { const m = w.nodos[id].real ? real(id) : null; if (m) (m.puertas || []).forEach((p) => { if (p.destino && p.destino.mapa === mapaId) out.push({ nodo: id, puerta: p.id }); }); }); return out;
  }
  function cuerposDentro(est, mapaId) {
    const ag = est && A.de(est, A.dimDe(mapaId)), mi = real(mapaId); if (!A.cfg.ACTIVO || !ag || !mi) return [];
    const t = A.ahora(ag) + ag.acc, out = [], par = ag.par || {};
    dentroDe(mapaId).forEach((d) => A.presentes(ag, d.nodo).forEach((i) => { const a = ag.pob[i], q = par[i];
      const p = q && q.m === mapaId ? { x: q.x, y: q.y, dir: q.dir, mv: false, tm: 0 } : (!q ? poseDentro(a, t, mi) : null);
      if (p) { const re = a.rea && a.rea[0] > t && t >= (a.rea[2] || 0) ? a.rea[1] : undefined, sp = sprite(a), pose = re && !p.mv && G.NAMES && G.NAMES[sp + '_' + re]; out.push({ id: pose ? sp + '_' + re : sp, x: p.x, y: p.y, dir: pose ? 'down' : p.dir, mv: p.mv, tm: p.tm, nom: a.nom, ag: a.id, duelo: !!((a.paso && a.paso.bat) || (q && q.d)), al: p.al, pes: !q && !p.mv ? pescaDe(a, t) : undefined, rea: a.rea && a.rea[0] > t && t >= (a.rea[2] || 0) ? a.rea[1] : undefined }); } }));
    return out;
  }
  // ── Aspecto (provisional): el dibujo de Oli o de Lali con la ropa y el pelo de otro color. Se crea la primera vez que hace falta ──
  function recolor(pal, grados) {
    const o = {}; Object.keys(pal).forEach((k) => {
      const v = pal[k], r = parseInt(v.slice(1, 3), 16) / 255, g = parseInt(v.slice(3, 5), 16) / 255, b = parseInt(v.slice(5, 7), 16) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
      if (d < 0.001) { o[k] = v; return; } const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360;
      if (l < 0.16 || s < 0.12 || (h >= 12 && h <= 35 && l > 0.5)) { o[k] = v; return; }   // contorno, grises y piel no cambian
      h = (h + grados) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m0 = l - c / 2, [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
      o[k] = '#' + [r1, g1, b1].map((u) => Math.round((u + m0) * 255).toString(16).padStart(2, '0')).join('');
    }); return o;
  }
  function sprite(a) {   // v2.332: cada entrenador tiene su diseño propio (src/entrenadores.js); sin la fábrica, el provisional de siempre (Oli/Lali recoloreados)
    if (G.entrenadores && G.defChar) return G.entrenadores.sprite(a); const k = a.asp, id = 'ag' + k; if (G.NAMES && G.NAMES[id]) return id; if (!G.NAMES) return 'oli';
    if (G.defChar && G.CHARS) { const base = G.CHARS[k % 2 ? 'luna' : 'rex']; G.defChar(id, Object.assign({}, base, { pal: recolor(base.pal, 50 + k * 37) })); G.NAMES[id] = id; } else G.NAMES[id] = 'rex';
    return id;
  }
  // ── Lo que ven los pintores: los entrenadores visibles en un mapa (contrato G.vista.agentes; solo lee) ──
  function cuerpos(est, mapaId) {
    const ag = est && A.de(est, A.dimDe(mapaId)), m = real(mapaId); if (!A.cfg.ACTIVO || !ag || !m) return []; if (!A.Wn(mapaId).nodos[mapaId]) return cuerposDentro(est, mapaId);
    const t = A.ahora(ag) + ag.acc, out = [], par = ag.par || null;
    A.presentes(ag, mapaId).forEach((i) => { const a = ag.pob[i], q = par && par[i]; if (q && q.m) return;   /* hablando dentro de un edificio: no se pinta fuera */ const p = q ? { x: q.x, y: q.y, dir: q.dir, mv: false, tm: 0 } : pose(a, t, m);   // v2.325: si está hablando o en duelo con un jugador, se queda quieto donde estaba (src/agentes_trato.js)
      if (p) { const re = a.rea && a.rea[0] > t && t >= (a.rea[2] || 0) ? a.rea[1] : undefined, sp = sprite(a), pose = re && !p.mv && G.NAMES && G.NAMES[sp + '_' + re]; out.push({ id: pose ? sp + '_' + re : sp, x: p.x, y: p.y, dir: pose ? 'down' : p.dir, mv: p.mv, tm: p.tm, nom: a.nom, ag: a.id, duelo: !!((a.paso && a.paso.bat) || (q && q.d)), al: p.al, pes: !q && !p.mv ? pescaDe(a, t) : undefined, rea: a.rea && a.rea[0] > t && t >= (a.rea[2] || 0) ? a.rea[1] : undefined }); } });
    return out;
  }
  // ── Hablar con un entrenador: dice la verdad de su estado (plantillas de datos/agentes.json) y recuerda al jugador ──
  function cercano(est, j) { let m = null, dm = AJ.alcanceHablar * T; cuerpos(est, j.mapa).forEach((c) => { if (c.al !== undefined && c.al < 0.6) return; const d = Math.hypot(c.x - j.x, c.y - j.y); if (d < dm) { dm = d; m = c; } }); return m; }
  // v2.333: qué se ve mientras pesca (contrato de G.vista.pesca): se calcula del reloj y del paso (lan, t0, w, dur), sin estado nuevo. Cada lance: lanzar → espera (tirones, sombra del pez) → pique → forcejeo → salto (si pica) o recoge sin nada
  function pescaDe(a, t) {
    const p = a.paso; if (!p || p.a !== 'pescar' || !p.lan || !(p.dur > 0)) return null; const u = t - (p.t0 + p.w); if (u < 0 || u >= p.dur) return null;
    const n = p.lan.length, Lc = p.dur / n, k = Math.min(n - 1, Math.floor(u / Lc)), s = u - k * Lc, r = p.lan[k], ok = r[1], cola = ok ? 3.8 : 1.6, espera = Math.max(2, Lc - 0.7 - cola), f = { pez: r[0], espera, tirones: [espera * 0.35, espera * 0.62], beats: [], hechos: [] };
    if (s < 0.7) { f.fase = 'lanzar'; f.t = s; } else if (s < 0.7 + espera) { f.fase = 'espera'; f.t = s - 0.7; }
    else { const q = s - 0.7 - espera; if (q < 0.6) { f.fase = 'pique'; f.t = q; } else if (!ok) { f.fase = 'listo'; f.t = q - 0.6; } else if (q < 2.0) { f.fase = 'forcejeo'; f.t = q - 0.6; } else if (q < 3.3) { f.fase = 'salto'; f.t = q - 2.0; } else { f.fase = 'listo'; f.t = q - 3.3; } }
    return f;
  }
  function frase(est, a, t, primera, salto) {
    const ag = A.de(est, A.dimDe(a.lug)), F = A.frases(ag), w = A.W(ag.dim), nomDe = (id) => (!id ? '' : id.slice(0, 2) === 'j:' ? id.charAt(2).toUpperCase() + id.slice(3) : (ag.pob[+id.slice(1)] || {}).nom || '');
    const ir = a.paso && a.paso.a === 'ir' ? a.paso.d : (a.plan.find((p) => p.a === 'ir') || {}).d, v = { nom: a.nom, amb: D.ambiciones[a.amb].nombre, criatura: G.CREATURES[a.equipo[0]].name, nivel: A.nivelDe(a, a.equipo[0]), dest: w.nombre(ir || (a.obj && a.obj.d) || a.lug), quien: nomDe(a.obj && a.obj.q) };
    let lista = F[a.obj ? a.obj.t : 'descansar'] || F.descansar; const turno = Math.floor(t / 20) + a.i + (salto | 0);
    if (primera) lista = F.presentacion; else if (a.paso && a.paso.bat) lista = F.duelo;
    else if (a.paso && a.paso.a === 'pescar' && turno % 3 !== 2 && F.pescando) lista = F.pescando;
    else if (turno % 3 === 2) { const e = a.mem.filter((q) => F['recuerdo_' + q[1]]).sort((x, y) => A.mente.saliencia(y, t) - A.mente.saliencia(x, t))[0]; if (e) { lista = F['recuerdo_' + e[1]]; if (e[1] === 'cap') v.criatura = G.CREATURES[e[2]] ? G.CREATURES[e[2]].name : v.criatura; else if (e[1] !== 'hito') v.quien = nomDe(e[2]); if (e[3]) v.dest = w.nombre(e[3]); } }
    return lista[turno % lista.length].replace(/\{(\w+)\}/g, (s, k) => (v[k] !== undefined && v[k] !== '' ? v[k] : '…'));
  }
  // hablar con el jugador, pararse y el duelo contra él viven en src/agentes_trato.js (v2.325)
  // v2.335: RESERVA DE CASILLAS. Quien va a quedarse parado en la plaza o en el campo pide sitio: si la casilla (o las de al lado) están ocupadas por otro entrenador o por un jugador, se le da la libre más cercana ('c:x,y,d'). Nadie se apila.
  function reservar(a, poi, forzar) {
    const m = real(a.lug), ag = A._ag, est = A._est; if (!m || !ag || poi[0] === 'f' || ((poi[0] === 'c' || poi[0] === 'x') && !forzar)) return poi;
    const c = info(m), W = m.W, oc = []; ag.pob.forEach((x) => { if (x === a || x.lug !== a.lug || (x.paso && x.paso.dentro)) return; const q = casilla(m, (x.paso && x.paso.poi) || x.poi, x.i); oc.push([q.x, q.y]); });
    Object.values((est && est.jugadores) || {}).forEach((j) => { if (j.mapa === a.lug) oc.push([Math.floor(j.x / T), Math.floor(j.y / T)]); });
    const cerca = (x, y, r) => oc.some((q) => Math.max(Math.abs(q[0] - x), Math.abs(q[1] - y)) <= r), q0 = casilla(m, poi, a.i), res = new Set(); (m.puertas || []).forEach((p) => { res.add(p.x + ',' + (p.y + 1)); res.add(p.x + ',' + p.y); }); (m.pesca || []).forEach((p) => { for (let d = -2; d <= 2; d++) res.add((p.x + d) + ',' + p.y); });
    const ok = (q, r) => !cerca(q[0], q[1], r) && !res.has(q[0] + ',' + q[1]);
    if (ok([q0.x, q0.y], 1)) return poi;
    for (const r of [1, 0]) { let mejor = null, md = 1e9; c.lista.forEach((q) => { const d = Math.abs(q[0] - q0.x) + Math.abs(q[1] - q0.y); if (d < md && d <= 8 && ok(q, r)) { md = d; mejor = q; } }); if (mejor) return 'c:' + mejor[0] + ',' + mejor[1] + ',' + (poi[0] === 'c' ? poi.slice(-1) : 'd'); }
    return poi;
  }
  A.cuerpo = { reservar, poseDentro, salidasHacia, info, casilla, camino, tAndar, pose, cuerpos, cercano, frase, sprite, recolor };
})(typeof window !== 'undefined' ? window : globalThis);
