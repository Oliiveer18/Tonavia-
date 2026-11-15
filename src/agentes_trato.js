// agentes_trato.js — EL TRATO de un entrenador autónomo CON UN JUGADOR (v2.325): hablar (con caja de diálogo), pararse mientras se le habla y el DUELO jugador ↔ entrenador. PURO. Guía: docs/AGENTES.md §8.
// Órdenes (G.motor.aplicar): { j, t:'hablar' } junto a un entrenador → { agente, nombre, texto, sprite, guion } (guion = datos para src/dialogo_ui.js, tipo 'datos') ·
//   { j, t:'hablar_fin', ag? } termina la charla · { j, t:'retar', ag } → { agente, nombre, duelo:true } o { agente, nombre, texto } si no puede ahora.
// PAUSA: est.agentes.par[i] = { t0, tu, x, y, dir, j, sig, pt0, d? } — el entrenador queda quieto (su reloj propio se congela: al soltarlo, su paso y su despertar se desplazan lo que duró).
//   Mientras está parado tiene a.sig = null, así que los demás entrenadores no le retan ni le hablan. Se suelta solo si el jugador se aleja, cambia de mapa o pasa TR.pausaMax.
// DUELO: usa est.combate (el mismo combate en tiempo real del jugador) con `duelo: { ag, nom, np }` y sin criaturas del mapa: el jugador lleva a su equipo sano (relevos 'j_<id>_<n>')
//   y el entrenador el suyo. Al acabar (combate_motor.terminar → finDuelo) reparte vida, XP, Brillos (paga el que pierde), prestigio, recuerdo y relación, con las reglas de los duelos entre entrenadores.
// Dos móviles: lo que hace el invitado se repite en el anfitrión con `remoto` (src/agentes_red.js).
(function (root) {
  'use strict';
  const G = root.G, A = G && G.agentes; if (!A || !A.cuerpo || !G.motor) return;
  const D = A.D, AJ = A.AJ, TR = AJ.trato, T = 16, Me = A.mente, Ti = G.tienda, esNum = Number.isFinite;
  const reloj = (ag) => A.ahora(ag) + ag.acc, r1 = (n) => Math.round(n * 10) / 10, r2 = (n) => Math.round(n * 100) / 100, inc = (o, k) => { o[k] = (o[k] | 0) + 1; };
  const nomJ = (jd) => jd.charAt(0).toUpperCase() + jd.slice(1), eco = (est, o) => { if (A.red) A.red.local(est, o); };
  const mirar = (p, j) => (Math.abs(j.x - p.x) > Math.abs(j.y - p.y) ? (j.x > p.x ? 'right' : 'left') : (j.y > p.y ? 'down' : 'up'));
  // F7: cada entrenador pertenece a la población de SU dimensión (el prefijo de su lugar); un jugador, a la de la dimensión de su mapa
  const agDe = (est, a) => A.de(est, A.dimDe(a.lug)), agJ = (est, j) => A.de(est, A.dimDe(j && j.mapa));
  const decir = (clave, a, j, n) => { const F = A.poolDe(A.dimDe(a.lug)).frases, l = F[clave] || F.descansar, v = { nom: a.nom, quien: nomJ(j.id), criatura: G.CREATURES[a.equipo[0]].name, nivel: A.nivelMax(a), amb: D.ambiciones[a.amb].nombre }; return l[(a.i + (n | 0)) % l.length].replace(/\{(\w+)\}/g, (s, k) => (v[k] !== undefined ? v[k] : '…')); };

  // ── Pausa ──
  function parar(est, a, j, duelo) {
    const ag = agDe(est, a), t = reloj(ag), par = ag.par || {}; let p = par[a.i];
    if (!p) { const m = G.mundo && G.mundo.mapas && G.mundo.mapas[a.lug], mi = j.mapa !== a.lug && G.mundo && G.mundo.mapas ? G.mundo.mapas[j.mapa] : null; let q = m ? A.cuerpo.pose(a, t, m) : null, dentro; if (!q && mi) { q = A.cuerpo.poseDentro(a, t, mi); if (q) dentro = j.mapa; } if (!q) return null;   // v2.326: también se le puede hablar y retar dentro del edificio donde está
      p = par[a.i] = { t0: r2(t), tu: r2(t), x: r2(q.x), y: r2(q.y), dir: q.dir, j: j.id, sig: a.sig, pt0: a.paso ? a.paso.t0 : null }; if (dentro) p.m = dentro; ag.par = par; if (a.sig !== null) A.suspender(ag, a); }
    p.tu = r2(t); p.j = j.id; delete p.hold; if (duelo) p.d = 1; p.dir = mirar(p, j); return p;
  }
  function soltar(est, a) {
    const ag = agDe(est, a), p = ag.par && ag.par[a.i]; if (!p) return false; const d = Math.max(0, reloj(ag) - p.t0);
    if (a.paso && p.pt0 !== null && a.paso.t0 === p.pt0) a.paso.t0 = r2(a.paso.t0 + d);                                         // su trayecto sigue donde lo dejó
    if (p.sig !== null && a.sig === null && !(a.paso && a.paso.bat)) A.programar(ag, a, Math.max(A.ahora(ag), p.sig + d));      // y despierta tanto más tarde como estuvo parado
    delete ag.par[a.i]; if (!Object.keys(ag.par).length) delete ag.par; return true;
  }
  function esperar(est, a) {   // v2.326: acabado el duelo se queda quieto unos segundos (con su reacción) antes de seguir con lo suyo
    const ag = agDe(est, a), p = ag.par && ag.par[a.i]; if (!p) return soltar(est, a); p.d = 0; p.hold = r2(reloj(ag) + TR.reaccion); return true;
  }
  function vigilar(est, ag) {   // cada avance: suelta a los que ya no tienen a su jugador delante (o cuyo duelo ya no existe)
    const par = ag.par, t = reloj(ag);
    Object.keys(par).forEach((k) => { const p = par[k], a = ag.pob[k], j = est.jugadores[p.j]; let fuera;
      if (p.hold) fuera = t >= p.hold || !j;
      else if (p.d) fuera = t - p.tu > TR.dueloMax || !j || (!j.remoto && !(est.combate && est.combate.duelo && est.combate.duelo.ag === a.i && est.combate.duelo.dim === ag.dim));
      else fuera = t - p.tu > TR.pausaMax || !j || j.mapa !== (p.m || a.lug) || Math.hypot(j.x - p.x, j.y - p.y) > TR.alejarse * T;
      if (fuera) soltar(est, a); });
  }

  // ── Hablar ──
  function puedeRetar(est, j, a) {
    const ag = agDe(est, a), t = A.ahora(ag), no = (k) => ({ ok: false, motivo: k, texto: decir(k, a, j, Math.floor(t / 10)) }), p = ag.par && ag.par[a.i], r = a.rel['j:' + j.id];
    if (j.mapa !== a.lug) return no('reto_dentro');   // v2.326: dentro de un edificio (Centro PC, tienda…) no se pelea
    if (est.combate || j.pesca) return no('reto_ocupado');
    if ((a.paso && a.paso.bat) || (p && (p.d || p.j !== j.id))) return no('duelo');
    if (r && t - r.td < TR.enfriamiento) return no('reto_respiro');
    if (!A.vivas(a).length || A.salud(a) < AJ.duelo.saludMin) return no('reto_herido');
    if (!G.equipo || !G.equipo.lider(j)) return no('reto_tu_herido');
    return { ok: true, texto: decir('reto_si', a, j) };
  }
  function guion(est, j, a, t, texto) {   // el menú de la charla, como DATOS (dialogo_ui.js tipo 'datos'): nada de esto toca el estado
    const fr = []; [1, 2, 3, 4].forEach((k) => { const f = A.cuerpo.frase(est, a, t, false, k); if (f !== texto && !fr.some((x) => x[0] === f)) fr.push([f]); }); if (!fr.length) fr.push([texto]);
    const eq = a.equipo.map((f) => G.CREATURES[f].name + ' (nivel ' + A.nivelDe(a, f) + ')').join(', '), cans = A.salud(a) < AJ.duelo.saludMin ? ' ' + decir('equipo_cansado', a, j) : '', pr = puedeRetar(est, j, a);
    const reto = pr.ok ? { id: 'retar', txt: 'Retar a un duelo', sub: 'Tu equipo contra el suyo', panel: 'retar', di: [pr.texto] } : { id: 'retar', txt: 'Retar a un duelo', sub: 'Ahora no puede', frases: [[pr.texto]] };
    return { tipo: 'datos', nombre: a.nom, rol: 'Entrenador · nivel ' + A.nivelMax(a), saludo: [texto], mas: [decir('mas', a, j)], adios: [decir('adios', a, j)],
      menu: [{ id: 'charlar', txt: 'Charlar', sub: '¿Qué andas haciendo?', frases: fr }, { id: 'equipo', txt: 'Su equipo', sub: a.equipo.length + (a.equipo.length === 1 ? ' criatura' : ' criaturas') + ' · ✦ ' + a.brillos, frases: [['Llevo a ' + eq + '.' + cans]] }, reto] };
  }
  function hablar(est, j, c, remoto) {
    const dim = A.dimDe(j.mapa), ag = A.de(est, dim), a = A.porId(est, c.ag, dim), t = A.ahora(ag), id = 'j:' + j.id, r0 = a.rel[id], primera = !r0;
    if (primera) Me.recordar(a, t, 'conoce', id, a.lug, 0, 0.3); const sube = primera || t - r0.tc >= 60, r = Me.tocar(a, id, t, a.lug, sube ? 3 : 0, 0); if (sube) { r.tc = Math.round(t); r.n++; }
    const p = parar(est, a, j, false); if (remoto) return { agente: a.id };
    const x = p ? p.x : c.x, y = p ? p.y : c.y; j.dir = Math.abs(j.x - x) > Math.abs(j.y - y) ? (j.x < x ? 'right' : 'left') : (j.y < y ? 'down' : 'up'); j.moving = false;
    const texto = A.cuerpo.frase(est, a, t, primera, 0);
    return { agente: a.id, nombre: a.nom, texto, sprite: c.id, guion: guion(est, j, a, t, texto) };
  }

  // ── Duelo jugador ↔ entrenador ──
  function iniciarDuelo(est, j, a) {
    const ag = agDe(est, a), m = G.mundo.mapa(j.mapa), M = G.motor.combate, K = M.K, p = parar(est, a, j, true); if (!p) return false;
    const ac = est.acomp && est.acomp.j === j.id ? est.acomp : null, al = ac || j; if (ac) ac.enCombate = true;
    const fl = al.x <= p.x ? 1 : -1, [ax, ay] = M.sitio(m, (al.x + p.x) / 2, Math.max(al.y, p.y) + T)   /* la arena queda una casilla por delante de los dos, para que no peleen encima de sus dueños */, u0 = (px) => Math.max(8, Math.min(152, 80 + fl * (px - ax) / K));
    const sanas = G.equipo.actual(j).filter((f) => !(j.vida && typeof j.vida[f] === 'number' && j.vida[f] <= 0));
    const mios = sanas.map((f, k) => { const id = k ? 'j_' + j.id + '_' + k : 'j_' + j.id, crz = G.crianza ? G.crianza.unidad(j, G.equipo.especie(f), id) : null; return { id, forma: G.equipo.especie(f), clave: f, mote: G.equipo.moteDe(j, f) || undefined, nivel: G.nivel.nivelDeEspecie(j, f), auto: false, hp: j.vida && j.vida[f], tal: crz ? crz.tal : undefined, kit: crz ? crz.kit : undefined }; });
    A.acciones.ordenar(a, true); const suyos = A.acciones.specs(a, 'e_a' + a.i + '_'), jl = mios[0].id, el = suyos[0].id;
    const sem = A.mez((ag.sem ^ Math.imul(ag.n + 1, 0x9E3779B1) ^ Math.imul(a.i + 1, 7919)) >>> 0), c = G.combate.nuevo(sem, [mios, suyos], { campo: [1, 1], duelo: true });
    c.u.forEach((u) => { u.x = u.side === 0 ? 40 : 120; });
    const k = est.combate = { v: 1, cr: {}, fl, y0: { [jl]: al.y, [el]: p.y }, mapa: j.mapa, jid: j.id, ax, ay, c, acc: 0, evs: [], enemigos: [], fin: null, duelo: ag.dim ? { ag: a.i, nom: a.nom, dim: ag.dim } : { ag: a.i, nom: a.nom } };
    k.dx = { [jl]: (u0(al.x) - 40) * K, [el]: (u0(p.x) - 120) * K }; k.ent = Math.max(0.4, Math.min(2.5, Math.max(Math.hypot(k.dx[jl], al.y - ay), Math.hypot(k.dx[el], p.y - ay)) / 50)); k.entT = 0;
    j.moving = false; inc(ag.cont, 'duelo_jugador_empezado'); return true;
  }
  // lo que le pasa AL ENTRENADOR (lo único que el anfitrión aplica cuando el duelo fue en el otro móvil): g = 0 gana el jugador · 1 gana el entrenador · null tablas o corte
  function ladoAgente(est, a, jd, g, np, vida, pago) {
    const ag = agDe(est, a), t = A.ahora(ag), id = 'j:' + jd, na = A.nivelMax(a), out = { na, premio: 0 }, dp = r1(AJ.duelo.k * 0.5);
    a.vida = a.vida || {}; a.equipo.forEach((f) => { if (!esNum(vida[f])) return; const v = Math.min(vida[f], A.hp(a, f)), mx = A.hpMax(a, f); if (v <= 0) a.vida[f] = 0; else if (v >= mx) delete a.vida[f]; else a.vida[f] = Math.max(1, Math.round(v)); }); if (!Object.keys(a.vida).length) delete a.vida;
    const r = Me.tocar(a, id, t, a.lug, 0, 0); r.du++; r.td = Math.round(t);
    if (g === 0) {
      a.pres = r1(a.pres - dp); out.premio = Math.min(a.brillos, Ti.premioCombate(np, na, 'rara')); if (out.premio > 0) Ti.gastar(a, out.premio);
      G.nivel.sumar(a, a.equipo[0], Math.round(G.nivel.xpGanada(na, np, 'rara') * 0.3)); Me.tocar(a, id, t, a.lug, -(2 + 6 * a.per.comp), 15); Me.recordar(a, t, 'der', id, a.lug, -1, 0.8); inc(a.h, 'der'); a.frus += 1;
      A.cron(ag, t, 'duelo_jugador', id, a.id, a.lug, nomJ(jd) + ' vence a nv' + na);
    } else if (g === 1) {
      a.pres = r1(a.pres + dp); const c = Math.max(0, Math.min(pago | 0, Ti.premioCombate(na, np, 'rara'))); if (c) Ti.ganar(a, c);
      G.nivel.sumar(a, a.equipo[0], G.nivel.xpGanada(na, np, 'rara')); Me.tocar(a, id, t, a.lug, 2, 5); Me.recordar(a, t, 'vic', id, a.lug, 1, 0.5); inc(a.h, 'vic'); a.frus = Math.max(0, a.frus - 0.3);
      A.cron(ag, t, 'duelo_jugador', a.id, id, a.lug, 'nv' + na + ' vence a ' + nomJ(jd));
    } else inc(ag.cont, 'duelo_tablas');
    a.rea = [r2(t + TR.reaccion), g === 1 ? 'g' : 'p']; if (g !== null) esperar(est, a); else soltar(est, a); return out;
  }
  function finDuelo(est, k) {   // lo llama combate_motor.terminar al acabar (o cortarse) un duelo contra un entrenador
    const ag = A.de(est, k.duelo.dim), a = ag && ag.pob[k.duelo.ag], j = est.jugadores[k.jid]; if (!a || !j) return;
    j.vida = j.vida || {}; k.c.u.forEach((u) => { if (u.side !== 0) return; const q = u.clave || u.forma; if (u.ko || u.hp <= 0) j.vida[q] = 0; else if (u.hp >= u.hpMax) delete j.vida[q]; else j.vida[q] = Math.max(1, Math.round(u.hp)); }); if (!Object.keys(j.vida).length) delete j.vida;
    const g = k.fin.corte ? null : k.fin.ganador, vida = {}; k.c.u.forEach((u) => { if (u.side === 1) vida[u.forma] = u.ko || u.hp <= 0 ? 0 : Math.round(u.hp); });
    const um = A.acciones.activa(k.c, 0), np = um.nivel, na = A.nivelMax(a), pago = g === 1 ? Math.min(Ti.saldo(j), Ti.premioCombate(na, np, 'rara')) : 0; if (pago > 0) Ti.gastar(j, pago);
    const res = ladoAgente(est, a, j.id, g, np, vida, pago); eco(est, { t: 'duelo_fin', j: j.id, ag: a.id, g, np, vida, pago });
    if (g === 0) {
      const x = G.nivel.sumar(j, um.forma, G.nivel.xpGanada(np, na, 'rara')); k.premio = x; if (res.premio > 0) Ti.ganar(j, res.premio);
      est.avisos.push({ j: j.id, texto: a.nom + ': ' + decir('reto_pierde', a, j, k.c.t) + (res.premio > 0 ? ' (+' + res.premio + ' ✦)' : '') });
      if (x) est.avisos.push({ j: j.id, texto: x.sube ? '¡' + um.nom + ' sube al nivel ' + x.despues + '! (+' + x.ganada + ' XP)' : '+' + x.ganada + ' XP' });
    } else if (g === 1) est.avisos.push({ j: j.id, texto: a.nom + ': ' + decir('reto_gana', a, j, k.c.t) + (pago > 0 ? ' (−' + pago + ' ✦)' : '') });
    else est.avisos.push({ j: j.id, texto: a.nom + ': ' + decir('reto_tablas', a, j, k.c.t) });
  }

  // ── Lo que llega del otro móvil (solo lo aplica el anfitrión; se valida todo: un mensaje roto o tramposo no puede romper la partida) ──
  function remoto(est, o) {
    const j = o && typeof o === 'object' ? est.jugadores[o.j] : null, ag = j ? agJ(est, j) : null; if (!ag || !j || !j.remoto || typeof o.ag !== 'string' || !/^a\d+$/.test(o.ag)) return false;
    const a = ag.pob[+o.ag.slice(1)], p = a && ag.par && ag.par[a.i]; if (!a) return false;
    if (o.t === 'hablar') { if (a.lug !== j.mapa || (p && p.j !== j.id)) return false; hablar(est, j, { ag: a.id }, true); return true; }
    if (o.t === 'hablar_fin') { if (!p || p.j !== j.id || p.d) return false; return soltar(est, a); }
    if (o.t === 'retar') { if (a.lug !== j.mapa || (a.paso && a.paso.bat) || (p && (p.d || p.j !== j.id)) || !A.vivas(a).length) return false; return !!parar(est, a, j, true); }
    if (o.t === 'duelo_fin') {
      if (!p || !p.d || p.j !== j.id || !(o.g === 0 || o.g === 1 || o.g === null) || !Number.isInteger(o.np) || o.np < 1 || o.np > 100 || !o.vida || typeof o.vida !== 'object' || !Number.isInteger(o.pago) || o.pago < 0) return false;
      ladoAgente(est, a, j.id, o.g, o.np, o.vida, o.pago); return true;
    }
    return false;
  }

  A.trato = { parar, soltar, vigilar, puedeRetar, guion, hablar, iniciarDuelo, ladoAgente, finDuelo, remoto };
  A.cuerpo.hablar = hablar;
  const aplicar0 = G.motor.aplicar;
  G.motor.aplicar = function (est, o) {
    const jj = o && A.cfg.ACTIVO && (o.t === 'hablar' || o.t === 'hablar_fin' || o.t === 'retar') ? est.jugadores[o.j] : null, agg = o && A.cfg.ACTIVO && (o.t === 'hablar' || o.t === 'hablar_fin' || o.t === 'retar') ? A.de(est, A.dimDe(jj && jj.mapa)) : null;
    if (agg) {
      const j = jj, ag = agg;
      if (o.t === 'hablar') { if (j && !est.combate && !(G.npc && G.npc.cercano(est, j))) { const c = A.cuerpo.cercano(est, j); if (c) { const r = hablar(est, j, c); eco(est, { t: 'hablar', j: j.id, ag: c.ag }); return r; } } }   // un personaje con diálogo propio sigue teniendo prioridad
      else if (o.t === 'hablar_fin') { if (j && ag.par) Object.keys(ag.par).forEach((k) => { const p = ag.par && ag.par[k], a = ag.pob[k]; if (p && p.j === j.id && !p.d && (!o.ag || o.ag === a.id)) { soltar(est, a); eco(est, { t: 'hablar_fin', j: j.id, ag: a.id }); } }); return null; }
      else { const a = j && typeof o.ag === 'string' ? A.porId(est, o.ag, A.dimDe(j.mapa)) : null, c = a ? A.cuerpo.cuerpos(est, j.mapa).find((q) => q.ag === a.id) : null; if (!c || Math.hypot(c.x - j.x, c.y - j.y) > TR.alcanceRetar * T) return null;
        const pr = puedeRetar(est, j, a); if (!pr.ok) return { agente: a.id, nombre: a.nom, texto: pr.texto, motivo: pr.motivo };
        if (!iniciarDuelo(est, j, a)) return null; eco(est, { t: 'retar', j: j.id, ag: a.id }); return { agente: a.id, nombre: a.nom, duelo: true }; }
    }
    return aplicar0.call(G.motor, est, o);
  };
})(typeof window !== 'undefined' ? window : globalThis);
