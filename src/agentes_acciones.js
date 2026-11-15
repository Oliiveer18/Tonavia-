// agentes_acciones.js — LO QUE UN ENTRENADOR PUEDE HACER (v2.324) y sus consecuencias reales. PURO. Guía: docs/AGENTES.md.
// Dos tablas con las mismas acciones vistas de dos maneras:
//   OPS[nombre] = { pre, ef, coste, paso }  → cómo las ve el PLANIFICADOR (estado simbólico: lug, br, pe, es, po, sa, c). USA[objetivo] = qué acciones sirven a cada objetivo.
//   ACC[nombre] = { ini, fin }              → cómo se EJECUTAN. ini devuelve la duración en segundos (0 = no hacía falta; false = ya no se puede; null = queda en combate).
//                                              fin aplica el resultado con las reglas del juego (G.tienda, G.nivel, G.pesca, G.combate) y devuelve false si no salió.
// Añadir una acción = una entrada en OPS, otra en ACC y su nombre en USA. Las economías son las del jugador: mismos precios, mismos premios, misma fórmula de captura.
// Los combates (salvajes y duelos) son procesos: se abren aquí, avanzan un paso por tick en `combates` y al terminar reparten vida, XP, Brillos, prestigio, recuerdos y relaciones.
(function (root) {
  'use strict';
  const G = root.G, A = G && G.agentes; if (!A || !A.mente) return;
  const D = A.D, AJ = A.AJ, DUR = AJ.dur, M = A.mente, Ti = G.tienda, inc = (o, k) => { o[k] = (o[k] | 0) + 1; };
  const pescados = (a) => Object.keys(a.mochila || {}).reduce((s, k) => s + (G.PECES && G.PECES[k] ? a.mochila[k] | 0 : 0), 0);
  const P_ESF = Ti.precioCompra('esfera'), P_POC = Ti.precioCompra('pocion');

  // ── Para el planificador ──
  const nd = (s, cx) => cx.w.nodos[s.lug];
  const OPS = {
    curar: { pre: (s, cx) => nd(s, cx).cura && s.sa < 0.95 && s.br >= cx.cCura, ef: (h, cx) => { h.br -= cx.cCura; h.sa = 1; }, coste: () => DUR.curar + 8, paso: () => ({ a: 'curar' }) },
    pocion: { pre: (s) => s.po > 0 && s.sa < 0.8 && s.sa > 0.05, ef: (h) => { h.po--; h.sa = Math.min(1, h.sa + 0.35); }, coste: () => DUR.pocion, paso: () => ({ a: 'pocion' }) },
    descansar: { pre: (s, cx) => nd(s, cx).pueblo && (s.sa < 0.95 || cx.obj.t === 'descansar'), ef: (h, cx) => { h.sa = 1; if (cx.obj.t === 'descansar') h.c++; }, coste: (s) => 20 + DUR.descansar * (1 - s.sa), paso: () => ({ a: 'descansar' }) },
    pescar: { pre: (s, cx) => nd(s, cx).pesca && s.pe < 9, ef: (h) => { h.pe += 3; }, coste: () => 3 * DUR.pescar + 8, paso: () => ({ a: 'pescar', n: 3 }) },
    vender: { pre: (s, cx) => nd(s, cx).tienda && cx.ab && s.pe > 0, ef: (h, cx) => { h.br += h.pe * cx.w.pPez; h.pe = 0; }, coste: () => DUR.vender + 8, paso: () => ({ a: 'vender' }) },
    comprarE: { pre: (s, cx) => nd(s, cx).tienda && cx.ab && s.br >= 3 * P_ESF && s.es < 6, ef: (h) => { h.es += 3; h.br -= 3 * P_ESF; }, coste: () => DUR.comprar + 8, paso: () => ({ a: 'comprar', id: 'esfera', n: 3 }) },
    comprarP: { pre: (s, cx) => nd(s, cx).tienda && cx.ab && s.br >= P_POC + cx.cCura && s.po < 2, ef: (h) => { h.po++; h.br -= P_POC; }, coste: () => DUR.comprar + 8, paso: () => ({ a: 'comprar', id: 'pocion', n: 1 }) },
    entrenar: { pre: (s, cx) => nd(s, cx).salvaje && s.sa >= 0.5, ef: (h, cx) => { h.sa -= 0.25; h.br += 10; if (cx.obj.t === 'entrenar') h.c++; }, coste: () => 50, paso: () => ({ a: 'entrenar' }) },
    capturar: { pre: (s, cx) => nd(s, cx).salvaje && s.sa >= 0.5 && s.es > 0, ef: (h, cx) => { h.es--; h.sa -= 0.25; if (cx.obj.t === 'capturar') h.c++; }, coste: () => 60, paso: () => ({ a: 'capturar' }) },
    retar: { pre: (s, cx) => s.lug === cx.obj.d && s.sa >= AJ.duelo.saludMin, ef: (h) => { h.c++; }, coste: () => 60, paso: (s, cx) => ({ a: 'retar', q: cx.obj.q }) },
    explorar: { pre: (s, cx) => s.lug === cx.obj.d, ef: (h) => { h.c++; }, coste: () => DUR.explorar, paso: () => ({ a: 'explorar' }) },
    socializar: { pre: (s, cx) => nd(s, cx).pueblo && (!cx.obj.d || s.lug === cx.obj.d), ef: (h) => { h.c++; }, coste: () => DUR.socializar, paso: () => ({ a: 'socializar' }) },
  };
  const USA = { sanar: ['curar', 'pocion', 'descansar', 'pescar', 'vender'], abastecer: ['comprarE', 'pescar', 'vender', 'entrenar'], entrenar: ['entrenar', 'pocion', 'curar', 'comprarP'], capturar: ['capturar', 'comprarE', 'curar', 'pocion'], retar: ['retar', 'curar', 'pocion'], explorar: ['explorar'], comerciar: ['pescar', 'vender', 'entrenar'], socializar: ['socializar'], descansar: ['descansar'] };

  // ── Combates como procesos ──
  function ordenar(a, duelo) {   // sanas delante; el criador saca primero a la de menos nivel (las cría a todas); los demás, a la más fuerte
    const cria = a.amb === 'criador' && !duelo; a.equipo.sort((x, y) => (A.hp(a, y) > 0) - (A.hp(a, x) > 0) || (cria ? A.nivelDe(a, x) - A.nivelDe(a, y) : A.nivelDe(a, y) - A.nivelDe(a, x)) || (x < y ? -1 : x > y ? 1 : 0));
  }
  const specs = (a, pre) => A.vivas(a).map((f, k) => ({ id: pre + k, forma: f, nivel: A.nivelDe(a, f), auto: true, hp: Math.max(1, Math.round(A.hp(a, f))) }));
  function abrir(ag, b) { b.id = ++ag.sb; b.n0 = ag.n - 1; b.sem = A.mez((ag.sem ^ Math.imul(b.id, 0x9E3779B1)) >>> 0); ag.bat.push(b); A.rt(ag).bat.set(b.id, G.combate.nuevo(b.sem, b.eq, b.k === 'd' ? { campo: [1, 1], duelo: true } : { campo: [1, 1] })); return b; }
  function aplicarVida(a, c, side) {   // la vida con la que salen se conserva, igual que la del jugador (j.vida)
    a.vida = a.vida || {}; c.u.forEach((u) => { if (u.side !== side) return; if (u.ko || u.hp <= 0) a.vida[u.forma] = 0; else if (u.hp >= u.hpMax) delete a.vida[u.forma]; else a.vida[u.forma] = Math.max(1, Math.round(u.hp)); });
    if (!Object.keys(a.vida).length) delete a.vida;
  }
  const activa = (c, side) => c.u.find((u) => u.side === side && u.campo && !u.ko) || c.u.find((u) => u.side === side);
  function capturar(ag, a, b, t) {   // misma fórmula que la esfera del jugador (BASE por rareza × calidad del lanzamiento); la puntería sale de su carácter
    const base = (G.motor.combate.capBase || {})[b.rar] || 0.5, hab = 0.3 + 0.35 * (a.per.ten + a.per.cur); let n = 0;
    while (n < 3 && a.esferas > 0) {
      n++; a.esferas--; const r = A.azar(ag, a), q = r < hab * 0.5 ? 1 : r < hab ? 0.8 : 0.5; if (A.azar(ag, a) >= Math.min(0.97, base * (0.55 + 0.6 * q))) continue;
      const nueva = !a.pos[b.f]; a.pos[b.f] = (a.pos[b.f] | 0) + 1; if (a.equipo.length < 6 && a.equipo.indexOf(b.f) < 0) a.equipo.push(b.f); if (nueva) Ti.ganar(a, Ti.PREMIO_ESPECIE);
      M.recordar(a, t, 'cap', b.f, b.lug, 1, b.rar === 'comun' ? 0.4 : 0.8); inc(a.h, 'cap'); A.cron(ag, t, 'captura', a.id, '', b.lug, G.CREATURES[b.f].name + (nueva ? ' (nueva)' : '')); return true;
    }
    return false;
  }
  function finSalvaje(ag, b, c, t) {
    const a = ag.pob[b.a], gana = c.fin.ganador === 0; aplicarVida(a, c, 0); let res = 'p';
    if (gana) {
      const u = activa(c, 0), x = G.nivel.sumar(a, u.forma, G.nivel.xpGanada(u.nivel, b.nv, b.rar)); Ti.ganar(a, Ti.premioDe(a, u.nivel, b.nv, b.rar)); inc(a.h, 'sal'); inc(ag.cont, 'victoria_salvaje'); a.frus = Math.max(0, a.frus - 0.1); if (x && x.sube) inc(ag.cont, 'sube_nivel');
      res = 'g'; if ((b.cap || (!a.pos[b.f] && (a.amb === 'coleccionista' || a.equipo.length < 3))) && a.esferas > 0 && capturar(ag, a, b, t)) res = 'c';
    } else { M.recordar(a, t, 'ko', b.f, b.lug, -1, 0.7); a.frus += 0.7; inc(a.h, 'ko'); A.cron(ag, t, 'derrota_salvaje', a.id, '', b.lug, G.CREATURES[b.f].name + ' nv' + b.nv); }
    if (a.paso) a.paso.res = res; A.programar(ag, a, t);
  }
  function finDuelo(ag, b, c, t) {
    const a = ag.pob[b.a], o = ag.pob[b.b], g = c.fin.ganador; aplicarVida(a, c, 0); aplicarVida(o, c, 1);
    if (g === 0 || g === 1) {
      const gan = g === 0 ? a : o, per = g === 0 ? o : a, ug = activa(c, g), ng = A.nivelMax(gan), np = A.nivelMax(per), e = 1 / (1 + Math.pow(10, (per.pres - gan.pres) / 400)), d = Math.round(AJ.duelo.k * (1 - e) * 10) / 10;
      gan.pres = Math.round((gan.pres + d) * 10) / 10; per.pres = Math.round((per.pres - d) * 10) / 10;
      const xp = G.nivel.xpGanada(ug.nivel, np, 'rara'); G.nivel.sumar(gan, ug.forma, xp); G.nivel.sumar(per, per.equipo[0], Math.round(xp * 0.3));   // el que pierde también aprende algo
      const premio = Math.min(per.brillos, Ti.premioCombate(ng, np, 'rara')); if (premio > 0) { Ti.gastar(per, premio); Ti.ganar(gan, premio); }   // el que pierde paga
      const v = M.vinculo(per.rel[gan.id]), amistoso = v === 'amigo' || v === 'aliado';
      const rp = M.tocar(per, gan.id, t, b.lug, amistoso ? 3 : -(6 + 14 * per.per.comp), 15), rg = M.tocar(gan, per.id, t, b.lug, amistoso ? 3 : 2, 5); rp.du++; rg.du++; rp.td = rg.td = Math.round(t);
      M.recordar(gan, t, 'vic', per.id, b.lug, 1, 0.5); M.recordar(per, t, 'der', gan.id, b.lug, -1, 0.8); inc(gan.h, 'vic'); inc(per.h, 'der'); gan.frus = Math.max(0, gan.frus - 0.3); per.frus += 1;
      A.cron(ag, t, 'duelo', gan.id, per.id, b.lug, 'nv' + ng + ' vence a nv' + np + (premio ? ', ' + premio + ' ✦' : ''));
    } else { const r1 = M.tocar(a, o.id, t, b.lug, 0, 3), r2 = M.tocar(o, a.id, t, b.lug, 0, 3); r1.du++; r2.du++; r1.td = r2.td = Math.round(t); inc(ag.cont, 'duelo_tablas'); }
    [a, o].forEach((x, i) => { if (x.paso) x.paso.res = g === i ? 'g' : 'p'; const llega = x.paso && x.paso.poi && x.paso.poi !== x.poi && A.cuerpo ? x.paso.t0 + A.cuerpo.tAndar(x.lug, x.poi, x.paso.poi, x.i) : t; const ini = Math.max(t, llega); x.rea = [Math.round((ini + AJ.trato.reaccion) * 100) / 100, g === i ? 'g' : 'p', Math.round(ini * 100) / 100]; A.programar(ag, x, ini + AJ.trato.reaccion); });   // v2.325: si aún iba andando hacia su sitio, sigue cuando llega (su cuerpo no salta)
  }
  function combates(est, ag, r, t) {   // un paso de motor por combate y tick; el que acaba se resuelve en ese mismo instante
    for (let i = 0; i < ag.bat.length;) { const b = ag.bat[i], c = r.bat.get(b.id); G.combate.paso(c, []); if (!c.fin) { i++; continue; } ag.bat.splice(i, 1); r.bat.delete(b.id); if (b.k === 'd') finDuelo(ag, b, c, t); else finSalvaje(ag, b, c, t); }
  }
  function duelo(est, ag, a, b, t) {
    ordenar(a, true); ordenar(b, true); const bt = abrir(ag, { k: 'd', a: a.i, b: b.i, eq: [specs(a, 'a'), specs(b, 'b')], lug: a.lug });
    const pb = b.paso && b.paso.poi ? b.paso : null;   // si el retado iba andando, su cuerpo termina ese trayecto (no salta hacia atrás)
    let pa = a.poi; const mr = G.mundo && G.mundo.mapas && G.mundo.mapas[a.lug];   // v2.325: en un mapa dibujado el que reta camina hasta quedar a dos casillas de su rival (antes se quedaban donde estaban, a veces uno encima de otro)
    if (mr && A.cuerpo) { const cb = A.cuerpo.casilla(mr, pb ? pb.poi : b.poi, b.i), ca = A.cuerpo.casilla(mr, a.poi, a.i), izq = ca.x <= cb.x; pa = 'c:' + (cb.x + (izq ? -2 : 2)) + ',' + cb.y + ',' + (izq ? 'r' : 'l'); if (A.cuerpo.reservar) pa = A.cuerpo.reservar(a, pa, 1); }
    a.paso = { a: 'duelo', bat: bt.id, t0: t, w: 0, poi: pa }; b.paso = { a: 'duelo', bat: bt.id, t0: pb ? pb.t0 : t, w: 0, poi: pb ? pb.poi : b.poi }; b.plan = []; if (b.obj) b.obj.r = 1;   // al retado se le corta lo que hacía: luego lo replantea
    A.suspender(ag, a); A.suspender(ag, b); inc(ag.cont, 'duelo_empezado');
  }

  // ── Ejecución ──
  const tA = (a, poi) => A.cuerpo.tAndar(a.lug, a.poi, poi, a.i);
  function ocioPaso(a, t) { const poi = A.cuerpo && A.cuerpo.reservar ? A.cuerpo.reservar(a, a.poi, 1) : a.poi, w = poi !== a.poi ? tA(a, poi) : 0; return { a: 'ocio', t0: t, w: Math.round(w * 100) / 100, poi }; }   // v2.335: parado sin hacer nada: no se queda tapando una puerta ni encima de otro
  function empezar(a, p, t, poi, trabajo, extra) { a.plan.shift(); if (A.cuerpo && A.cuerpo.reservar && !(extra && extra.dentro)) poi = A.cuerpo.reservar(a, poi); const w = tA(a, poi); a.paso = Object.assign({ a: p.a, t0: t, w: Math.round(w * 100) / 100, poi }, extra); return Math.max(0.05, w + trabajo); }
  const ajustesDe = (a) => { try { const n = A.nodoDe(a); return n && G.dimensiones && G.dimensiones.ajustesDe ? G.dimensiones.ajustesDe(n) : null; } catch (e) { return null; } };   // F7: ajustes de contenido (F6) del lugar donde está el entrenador
  const aqui = (a) => A.Wn(a.lug).nodos[a.lug], si = () => true;
  function salvaje(est, ag, a, p, t) {   // busca rival en la hierba: descarta los que le sacan demasiados niveles (según su valentía); si no ve ninguno a su alcance, se va con las manos vacías
    const n = aqui(a); if (!n.salvaje || !A.vivas(a).length) return false; if (p.a === 'capturar' && a.esferas < 1) return false;
    ordenar(a, false); const PES = G.aparicion.AJUSTES.PESOS, tot = n.salvajes.reduce((s, q) => s + (PES[q.rar] || 0), 0), tope = A.nivelDe(a, a.equipo[0]) + 2 + Math.round(6 * a.per.val);
    for (let k = 0; k < 3; k++) {
      let r = A.azar(ag, a) * tot, e = n.salvajes[n.salvajes.length - 1]; for (const q of n.salvajes) { r -= PES[q.rar] || 0; if (r < 0) { e = q; break; } }
      let nv = G.nivel.nivelSalvaje(e.rar, e.f + '|' + a.lug + '|' + a.i + '|' + a.k); const aj = ajustesDe(a); if (aj && aj.nivel > 0) nv = Math.min(50, nv + aj.nivel);   // F7: el nivel base de la región/dimensión (F6) también cuenta para ellos (0 en Tonavia: nada cambia)
      if (nv > tope) continue;
      a.plan.shift(); const bt = abrir(ag, { k: 's', a: a.i, b: -1, f: e.f, nv, rar: e.rar, cap: p.a === 'capturar' ? 1 : 0, lug: a.lug, eq: [specs(a, 'a'), [{ id: 'b0', forma: e.f, nivel: nv }]] });
      a.paso = { a: p.a, bat: bt.id, t0: t, w: 0, poi: a.poi }; A.suspender(ag, a); inc(ag.cont, 'combate_salvaje'); return null;
    }
    inc(ag.cont, 'huida'); return empezar(a, p, t, 'z', DUR.buscar, { res: 'h' });
  }
  const finBat = (est, ag, a, p) => p.res !== 'p';
  const ACC = {
    ir: { ini(est, ag, a, p, t) { if (a.lug === p.d) { a.plan.shift(); return 0; } const h = A.Wn(a.lug).sig[a.lug][p.d]; if (!h) return false; const poi = 'x:' + h, w = tA(a, poi); a.paso = { a: 'ir', d: p.d, h, t0: t, w: Math.round(w * 100) / 100, poi, dentro: 1 }; return Math.max(1, w + 0.6); },
      fin(est, ag, a, p) { const de = a.lug; A.mover(ag, a, p.h); a.poi = 'x:' + de; if (!a.vis[p.h]) a.vis[p.h] = 1; inc(a.h, 'hop'); return true; } },
    curar: { ini: (est, ag, a, p, t) => (aqui(a).cura ? empezar(a, p, t, 'p:centro_pc', DUR.curar, { dentro: 1 }) : false),
      fin(est, ag, a) { const c = Ti.precioCurar(a); if (c > 0 && !Ti.gastar(a, c)) return false; delete a.vida; inc(a.h, 'cur'); inc(ag.cont, 'cura'); return true; } },
    comprar: { ini: (est, ag, a, p, t) => (aqui(a).tienda && (!G.ciclo || G.ciclo.abierta('tienda', est.reloj)) ? empezar(a, p, t, 'p:tienda', DUR.comprar, { dentro: 1, id: p.id, n: p.n }) : false),
      fin(est, ag, a, p) { if (!Ti.gastar(a, Ti.precioCompra(p.id) * p.n)) return false; if (p.id === 'esfera') a.esferas = Math.min(Ti.MAX_ESF, a.esferas + p.n); else Ti.meter(a, p.id, p.n); inc(ag.cont, 'compra'); return true; } },
    vender: { ini: (est, ag, a, p, t) => (aqui(a).tienda && (!G.ciclo || G.ciclo.abierta('tienda', est.reloj)) ? empezar(a, p, t, 'p:tienda', DUR.vender, { dentro: 1 }) : false),
      fin(est, ag, a) { let n = 0; Object.keys(a.mochila || {}).forEach((k) => { if (!G.PECES[k]) return; const c = a.mochila[k]; Ti.ganar(a, Ti.precioVenta(k, true) * c); Ti.sacar(a, k, c); n += c; }); if (n) inc(ag.cont, 'venta'); return n > 0; } },
    pescar: { ini(est, ag, a, p, t) {   // v2.333: el resultado de cada lance se decide AL EMPEZAR (lan = [[especie, ¿pica?]…]) y se guarda en el paso: así lo que se ve pescar (src/agentes_cuerpo.js) es exactamente lo que entra en la mochila
        if (!aqui(a).pesca) return false;
      const mp = G.mundo && G.mundo.mapas && G.mundo.mapas[a.lug], pts = mp && mp.pesca || [], ocu = {}; let hay = 0;   // v2.334: cada sitio tiene un solo pescador; si está lleno (o hay ya demasiados) espera a que se libere
      ag.pob.forEach((x) => { if (x !== a && x.lug === a.lug && x.paso && typeof x.paso.poi === 'string' && x.paso.poi.indexOf('f:') === 0) { ocu[x.paso.poi] = 1; if (x.paso.a === 'pescar') hay++; } });   /* también cuenta quien está en duelo en ese sitio */
      Object.values(est.jugadores || {}).forEach((j) => { if (j.mapa === a.lug && j.pesca) { const k = pts.findIndex((q) => q.id === j.pesca.id); if (k >= 0) ocu['f:' + k + '.0'] = 1; } });
      let poi = 'f:' + a.i;
      if (pts.length) {
        const libres = [], o0 = Math.floor(A.azar(ag, a) * pts.length);
        for (let u = 0; u < pts.length; u++) { const k = (o0 + u) % pts.length, lat = pts[k].mira === 'left' || pts[k].mira === 'right'; [0, 1].forEach((sd) => { if (sd && lat) return; const id = 'f:' + k + '.' + sd; if (!ocu[id]) libres.push([id, (ocu['f:' + k + '.0'] ? 1 : 0) + (ocu['f:' + k + '.1'] ? 1 : 0) + sd * 0.5]); }); }
        libres.sort((x, y) => x[1] - y[1]);
        if (hay >= ((D.pesca && D.pesca.cupo) || 4) || !libres.length) { p.k = (p.k | 0) + 1; if (p.k > 8) return false; a.paso = ocioPaso(a, t); return 6 + 6 * A.azar(ag, a) + a.paso.w; }   // sitio lleno: espera y vuelve a mirar (unos 70 s como mucho)
        poi = libres[0][0];
      }
 const rnd = () => A.azar(ag, a), honda = aqui(a).honda, lan = [];
        for (let k = 0; k < p.n; k++) { const id = G.pesca.elegir(rnd, Math.floor(rnd() * (honda ? 3 : 2))); lan.push([id, rnd() < 0.92 - 0.12 * (G.PECES[id].fuerza || 0) ? 1 : 0]); }
        const trabajo = DUR.pescar * p.n * (0.8 + 0.4 * rnd()); return empezar(a, p, t, poi, trabajo, { n: p.n, dur: Math.round(trabajo * 100) / 100, lan }); },
      fin(est, ag, a, p, t) { let n = 0; (p.lan || []).forEach((r) => { if (r[1]) { Ti.meter(a, r[0], 1); n++; if (G.PECES[r[0]].fuerza >= 2 || G.PECES[r[0]].kg && G.PECES[r[0]].kg[1] >= 3) A.cron(ag, t, 'pesca', a.id, '', a.lug, G.PECES[r[0]].nombre); } }); a.h.pez = (a.h.pez | 0) + n; ag.cont.pesca = (ag.cont.pesca | 0) + n; return n > 0; } },
    pocion: { ini: (est, ag, a, p, t) => (Ti.cuantos(a, 'pocion') > 0 ? empezar(a, p, t, a.poi, DUR.pocion) : false),
      fin(est, ag, a) { let f = null, m = 1; a.equipo.forEach((q) => { const r = A.hp(a, q) / A.hpMax(a, q); if (r > 0 && r < m) { m = r; f = q; } }); if (!f || !Ti.sacar(a, 'pocion', 1)) return true; const v = Math.min(A.hpMax(a, f), A.hp(a, f) + Ti.OBJ.pocion.cura); if (v >= A.hpMax(a, f)) delete a.vida[f]; else a.vida[f] = v; if (a.vida && !Object.keys(a.vida).length) delete a.vida; return true; } },
    descansar: { ini: (est, ag, a, p, t) => { if (!aqui(a).pueblo) return false; const h = G.ciclo && est && est.reloj !== undefined ? G.ciclo.hora(est.reloj) : 12, noche = h >= D.rutina.nocheDesde || h < D.rutina.nocheHasta;   // v2.331: de noche duerme DENTRO del Centro PC un rato largo (el resto del día, un respiro en la plaza)
      return noche && aqui(a).cura ? empezar(a, p, t, 'p:centro_pc', D.rutina.sueno[0] + D.rutina.sueno[1] * A.azar(ag, a), { dentro: 1 }) : empezar(a, p, t, 'plaza', 20 + DUR.descansar * (1 - A.salud(a))); }, fin(est, ag, a) { delete a.vida; inc(a.h, 'des'); return true; } },
    socializar: { ini: (est, ag, a, p, t) => (aqui(a).pueblo ? empezar(a, p, t, 'plaza', DUR.socializar) : false), fin(est, ag, a, p, t) { a.te = -1e6; return true; } },   // al despertar mirará a quién tiene al lado sin esperar
    explorar: { ini: (est, ag, a, p, t) => empezar(a, p, t, 'z', DUR.explorar), fin(est, ag, a) { a.vis[a.lug] = 2; inc(a.h, 'exp'); return true; } },
    entrenar: { ini: salvaje, fin: finBat }, capturar: { ini: salvaje, fin: finBat },
    retar: { ini(est, ag, a, p, t) {   // va a buscar a alguien donde cree que está (su último recuerdo): puede no encontrarlo
        const b = ag.pob[+String(p.q).slice(1)], r = a.rel[p.q]; if (!b || b.lug !== a.lug) { if (r) r.lu = ''; if (a.obj) a.obj.f = 1; return false; }   // no está donde creía: olvida la pista y deja el reto para otro día
        if (b.paso && (b.paso.bat || b.paso.dentro) || b.sig === null) { p.k = (p.k | 0) + 1; if (p.k > 3) return false; a.paso = ocioPaso(a, t); return DUR.buscar + a.paso.w; }
        if (A.salud(a) < AJ.duelo.saludMin || !A.vivas(b).length) return false;
        a.plan.shift(); if (A.salud(b) < AJ.duelo.saludMin || !(b.per.val * 0.6 + b.per.comp * 0.4 + (b.amb === 'campeon' ? 0.2 : 0) + (M.vinculo(b.rel[a.id]) === 'rival' ? 0.3 : 0) > 0.45)) { const q = M.tocar(a, b.id, t, a.lug, -2, -5); q.td = Math.round(t); inc(ag.cont, 'duelo_rechazado'); return 0; }
        duelo(est, ag, a, b, t); return null; }, fin: si },
    duelo: { ini: () => false, fin: si }, ocio: { ini: () => false, fin: si },
  };
  A.acciones = { ocioPaso, OPS, USA, ACC, pescados, ordenar, specs, duelo, combates, aplicarVida, activa };
})(typeof window !== 'undefined' ? window : globalThis);
