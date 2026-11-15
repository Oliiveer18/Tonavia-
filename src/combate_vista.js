// combate_vista.js — QUÉ se ve del combate, sin dibujar nada (v2.272; contrato entre el motor de combate y los pintores, hoy solo el HD-2D). Funciones puras sobre est.combate.
// G.vista.combate(est, reloj) → null (no hay combate) o { unidades, ev, tick, fin, k }:
//   unidades: [{ id, forma, side, x, y (pies, px del mapa), dir, moving, tm, up (px que se eleva), dx (retroceso en px), hpF, med, el, ko, estados, esc, esq, w, h }]
//   ev = eventos de los últimos 3 s (cada uno con su tick `t`), tick = tick del motor con fracción (para animar entre ticks), fin = null | { ganador, ... } (se enseña 2,5 s tras acabar).
(function (root) {
  'use strict';
  const G = root.G, TPS = G.COMBATE_DATOS.TPS, VER_FIN = 1.95;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.vista.acomp = function (est, reloj) { const a = est && est.acomp; if (!a || a.enCombate) return null; const sz = G.traits(a.forma).size; const j = est.jugadores[a.j], ax = j ? Math.round(j.x) + Math.round(a.x - j.x) : a.x, ay = j ? Math.round(j.y) + Math.round(a.y - j.y) : a.y; /* se dibuja relativo a Oli (la cámara va a su posición redondeada): sin vibración de 1 px al caminar */ return { forma: a.forma, x: ax, y: ay, dir: a.dir, moving: a.moving, tm: reloj, w: sz[0], h: sz[1] }; };
  G.vista.combate = function (est, reloj) {
    const k = est && est.combate; if (!k) return null;
    if (k.fin && k.finT > VER_FIN && !(k.cap && k.cap.fase !== 'fin')) return null;
    // tras el final el motor se para, pero el reloj visual sigue: los números se acaban de apagar (antes se quedaban congelados)
    const c = k.c, tick = c.t + (k.fin ? (k.finT || 0) * TPS : clamp(k.acc * TPS, 0, 1)), M = G.motor.combate, unidades = [];
    const muertos = []; c.u.forEach((u) => { if (u.ko) { const e = k.evs.find((q) => q.e === 'ko' && q.id === u.id); if (e && tick - e.t < 24) { const p = M.posicion(k, u), sz = G.traits(u.forma).size; muertos.push({ id: u.id, x: p.x, y: p.y, w: sz[0], h: sz[1], cap: !!(k.cap && k.cap.id === u.id), forma: u.forma, dir: (u.side === 0) === ((k.fl || 1) === 1) ? 'right' : 'left', t: e.t }); } } }); // para que se vea la cifra del golpe mortal
    c.u.forEach((u) => {
      if (u.ko || !u.campo) return;   // la criatura derrotada desaparece en el acto
      if (k.cap && k.cap.vivo && k.cap.id === u.id && k.cap.fase !== 'huye') return;   // v2.338: mientras se le lanza la esfera la dibuja la captura (cap), no la unidad
      const p = M.posicion(k, u), tr = G.traits(u.forma), sz = tr.size, fl = k.fl || 1, dir0 = (u.side === 0) === (fl === 1) ? 'right' : 'left', ent = M.entrando(k), ds = k.dx && k.dx[u.id] ? -fl * k.dx[u.id] : 0, dir = ent && Math.abs(ds) > 2 ? (ds > 0 ? 'right' : 'left') : dir0, sgn = (u.side === 0 ? 1 : -1) * fl;
      let dx = 0, up = 0;
      k.evs.forEach((e) => { const a = (tick - e.t) / 5; // retroceso de 5 ticks al recibir un golpe; embestida corta al atacar
        if (e.e === 'golpe' && e.id === u.id && a >= 0 && a < 1) dx -= sgn * 3 * Math.sin(Math.PI * a);
        if (e.e === 'inicio' && e.id === u.id && (e.hueco === 'b' || e.hueco === 'h')) { const b = (tick - e.t - 3) / 4; if (b >= 0 && b < 1) dx += sgn * 4 * Math.sin(Math.PI * b); } });
      if (u.acc && u.acc.t < u.acc.tw && (u.acc.m && G.COMBATE_DATOS.MOV[u.acc.m].hueco === 'e')) up = 1.5 * Math.sin(reloj * 14); // el especial se carga temblando
      unidades.push({ id: u.id, forma: u.forma, side: u.side, x: p.x + dx, y: p.y, dir, moving: !!u.mv || (ent && Math.abs(ds) > 2), tm: reloj, up, dx, hpF: Math.max(0, u.hp / u.hpMax), med: u.med, el: u.el, ko: false, estados: Object.keys(u.est).filter((n) => u.est[n] > 0), esc: u.esc > 0, esq: u.esq > 0, w: sz[0], h: sz[1], nom: u.nom + ' Nv' + (u.nivel || 1), nivel: u.nivel || 1, acc: u.acc ? { m: u.acc.m, t: u.acc.t, tw: u.acc.tw } : null });
    });
    let cap = null; if (k.cap) { const cu = c.u.find((q) => q.id === k.cap.id); if (cu) { const p = M.posicion(k, cu), sz = G.traits(cu.forma).size; cap = { fase: k.cap.fase, t: k.cap.t, n: k.cap.n, q: k.cap.q, ok: k.cap.ok, sac: k.cap.sac, miss: k.cap.miss, vivo: !!k.cap.vivo, hpF: Math.max(0, cu.hp / cu.hpMax), el: k.cap.el, rar: k.cap.rar, forma: cu.forma, dir: (cu.side === 0) === ((k.fl || 1) === 1) ? 'right' : 'left', x: p.x, y: p.y, w: sz[0], h: sz[1] }; } }
    return { cap, finT: k.finT || 0, fl: k.fl || 1, unidades, ko: muertos, ev: k.evs, tick, fin: k.fin ? { ganador: k.fin.ganador, corte: !!k.fin.corte } : null, jid: k.jid, k: M.K, ax: k.ax, ay: k.ay, off: (x) => M.ensanche(k, x) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
