// agentes_mente.js — LA MENTE de un entrenador (v2.324): memoria, relaciones, ambición, objetivos y planificador. PURO. Guía: docs/AGENTES.md.
// Ciclo (G.agentes.mente.despertar): 1) cierra el paso que estaba haciendo y aplica sus consecuencias · 2) revisa su ambición (hitos, crisis) ·
// 3) reacciona a quien tenga delante (ayudar, retar, charlar) · 4) si no tiene plan, elige un OBJETIVO por utilidad (necesidades × ambición × carácter ×
// saciedad) y lo convierte en un PLAN con un planificador de metas (búsqueda de coste uniforme sobre las acciones de agentes_acciones.js) · 5) empieza el
// siguiente paso y se duerme hasta que acabe. Si un paso falla, el plan se tira y se vuelve a pensar: así cambia de estrategia cuando algo sale mal.
(function (root) {
  'use strict';
  const G = root.G, A = G && G.agentes; if (!A) return;
  const D = A.D, AJ = A.AJ, cl = (x, a, b) => Math.max(a, Math.min(b, x));

  // ── MEMORIA episódica: [t, tipo, quién, lugar, valencia, importancia]. Capacidad fija; se olvida lo menos saliente (importancia × olvido exponencial) ──
  const saliencia = (e, t) => e[5] * Math.exp(-(t - e[0]) / AJ.memoriaVida);
  function recordar(a, t, tipo, quien, lugar, val, imp) {
    a.mem.push([Math.round(t), tipo, quien || '', lugar || '', val, imp]);
    if (a.mem.length > AJ.memoria) { let m = 0, ms = Infinity; a.mem.forEach((e, i) => { const s = saliencia(e, t); if (s < ms) { ms = s; m = i; } }); a.mem.splice(m, 1); }
  }
  function evocar(a, t, f, k) {   // los k recuerdos más salientes que casan con el filtro { tipo?, quien?, lugar? }
    return a.mem.filter((e) => (!f.tipo || e[1] === f.tipo) && (!f.quien || e[2] === f.quien) && (!f.lugar || e[3] === f.lugar)).sort((x, y) => saliencia(y, t) - saliencia(x, t)).slice(0, k || 1);
  }
  const peligro = (a, t, lugar) => a.mem.reduce((s, e) => s + ((e[1] === 'ko' || e[1] === 'aviso') && e[3] === lugar ? saliencia(e, t) : 0), 0);   // cuánto teme ese sitio (por experiencia propia o por un aviso)

  // ── RELACIONES: a.rel[id] = { af (afinidad −100…100), re (respeto 0…100), n (encuentros), t, lu (dónde lo vio por última vez), du (duelos), td, tc } ──
  function tocar(a, id, t, lug, dAf, dRe) {
    let r = a.rel[id];
    if (!r) { const ks = Object.keys(a.rel); if (ks.length >= AJ.relaciones) { let m = ks[0], mv = Infinity; ks.forEach((k) => { const q = a.rel[k], v = Math.abs(q.af) + q.re * 0.5 + q.du * 5 - (t - q.t) / 600; if (v < mv) { mv = v; m = k; } }); delete a.rel[m]; }
      r = a.rel[id] = { af: 0, re: 0, n: 0, t, lu: '', du: 0, td: -1e6, tc: -1e6 }; }
    r.af *= Math.exp(-(t - r.t) / AJ.relacionVida);   // sin trato, la afinidad vuelve despacio hacia la indiferencia
    r.af = Math.round(cl(r.af + (dAf || 0), -100, 100) * 10) / 10; r.re = Math.round(cl(r.re + (dRe || 0), 0, 100) * 10) / 10; r.t = Math.round(t); if (lug) r.lu = lug;
    return r;
  }
  const vinculo = (r) => (!r ? 'desconocido' : r.af >= 60 ? 'aliado' : r.af >= 25 ? 'amigo' : r.af <= -40 ? 'enemigo' : r.du >= 2 ? 'rival' : 'conocido');

  // ── AMBICIÓN (largo plazo): una medida con hitos. Al cumplirla entera, o tras demasiada frustración, cambia de sueño según su carácter ──
  const METRICA = { prestigio: (a) => a.pres, especies: (a) => Object.keys(a.pos).length, mapas: (a) => Object.keys(a.vis).filter((k) => a.vis[k] === 2).length, nivel: (a) => A.nivelMax(a), brillos: (a) => a.brillos };
  function revisarAmbicion(ag, a, t) {
    const am = D.ambiciones[a.amb], v = METRICA[am.meta](a);
    while (a.etapa < am.hitos.length && v >= am.hitos[a.etapa]) { a.etapa++; a.frus = Math.max(0, a.frus - 2); recordar(a, t, 'hito', a.amb, a.lug, 1, 0.9); A.cron(ag, t, 'hito', a.id, '', a.lug, a.amb + ' ' + a.etapa); }
    const cumplida = a.etapa >= am.hitos.length; if (!cumplida && a.frus < AJ.crisis * (0.5 + a.per.ten)) return;
    a.hechas[a.amb] = 1; if (Object.keys(a.hechas).length >= Object.keys(D.ambiciones).length) a.hechas = { [a.amb]: 1 };
    const antes = a.amb, ru = [A.azar(ag, a), A.azar(ag, a), A.azar(ag, a)]; a.amb = A.ambicionPara(a.per, a.hechas, (n) => ru[n % 3]) || antes;
    const nm = D.ambiciones[a.amb], nv = METRICA[nm.meta](a); a.etapa = 0; while (a.etapa < nm.hitos.length - 1 && nv >= nm.hitos[a.etapa]) a.etapa++;   // empieza en el escalón que le corresponde
    a.frus = 0; a.obj = null; a.plan = []; recordar(a, t, cumplida ? 'hito' : 'crisis', antes, a.lug, cumplida ? 1 : -1, 1); A.cron(ag, t, cumplida ? 'ambicion_cumplida' : 'crisis', a.id, '', a.lug, antes + ' → ' + a.amb);
  }

  // ── OBJETIVOS (corto plazo): se puntúan todos y se intenta planificar del mejor al peor ──
  // v2.329: multiplicador de apetencia por franja horaria (blando: nunca anula). Determinista: solo depende de la hora del reloj, de la personalidad y de un desfase fijo por entrenador
  function rutina(ag, a, hora) {
    const R = D.rutina; if (!R || hora === undefined || hora === null) return () => 1;
    const h = (((hora + (A.azarDe(ag.sem, a.i, 9999) * 2 - 1) * (R.desfase || 0)) % 24) + 24) % 24, fr = R.franjas.find((f) => (h >= f.desde && h < f.hasta) || (h + 24 >= f.desde && h + 24 < f.hasta)) || null;
    return (k) => { if (!fr || k === 'sanar') return 1; let m = fr.w[k === 'abastecer' ? 'comerciar' : k]; if (m === undefined) return 1;
      if (m < 1) m += (1 - m) * Math.min(1, a.per.cur * 0.5 + (a.amb === 'explorador' ? 0.4 : 0));   // los curiosos y exploradores siguen fuera de noche
      if (fr.n === 'amanecer' && a.amb === 'mercader' && (k === 'comerciar' || k === 'abastecer')) m += 0.3; return m; };
  }
  function candidatos(ag, a, t, hora) {
    const w = A.Wn(a.lug), P = D.ambiciones[a.amb].pesos, per = a.per, sa = A.salud(a), out = [], rut = rutina(ag, a, hora);
    const sacia = (k) => 1 - 0.6 * Math.exp(-(t - (a.sac[k] === undefined ? -1e6 : a.sac[k])) / AJ.saciedad);   // lo que acaba de hacer le apetece menos (variedad)
    const pon = (o, u) => { if (u > 0.01 && !(a.veto[o.t] > t)) { o.u = u * (o.t === 'sanar' ? 1 : sacia(o.t) * rut(o.t)) + A.azar(ag, a) * 0.06; out.push(o); } };
    const mejor = (ids, f) => { let m = null, mv = -Infinity; ids.forEach((id) => { if (w.dist[a.lug][id] === Infinity) return; const v = f(id) - w.dist[a.lug][id] / 60 - 2 * peligro(a, t, id); if (v > mv) { mv = v; m = id; } }); return m; };
    pon({ t: 'sanar' }, sa < 0.35 ? 3 : sa < 0.8 ? 1.5 * (1 - sa) + 0.4 * (1 - per.val) : 0);
    pon({ t: 'comerciar', m: a.brillos + 80 }, (a.brillos < 40 ? 0.9 : 0) + (P.comerciar || 0) * 0.7);
    const ganasCap = (P.capturar || 0) + (a.equipo.length < 3 ? 0.5 : 0);
    if (a.esferas < 2) pon({ t: 'abastecer' }, ganasCap * 0.8);
    else { const d = mejor(w.ids.filter((id) => w.nodos[id].salvaje), (id) => (w.nodos[id].salvajes.some((s) => !a.pos[s.f]) ? 2 : 0)); if (d) pon({ t: 'capturar', d }, ganasCap * (0.6 + 0.4 * per.cur) * (sa >= 0.6 ? 1 : 0.3)); }
    { const d = mejor(w.ids.filter((id) => w.nodos[id].salvaje), (id) => (a.vis[id] ? 0 : per.cur)); if (d) pon({ t: 'entrenar', d, n: 2 }, (P.entrenar || 0) * (0.6 + 0.4 * per.ten) * (sa >= 0.6 ? 1 : 0.3)); }
    { let q = null, qv = 0; Object.keys(a.rel).forEach((id) => { if (id[0] !== 'a') return; const r = a.rel[id], v = vinculo(r); if (!r.lu || v === 'aliado' || t - r.t > AJ.duelo.avistamiento || t - r.td < AJ.duelo.enfriamiento) return;
        const g = 0.5 + (v === 'rival' ? 0.5 : v === 'enemigo' ? 0.6 : 0) + (evocar(a, t, { tipo: 'der', quien: id }, 1).length ? 0.4 : 0) + r.re / 200; if (g > qv) { qv = g; q = { id, lu: r.lu }; } });
      if (q) pon({ t: 'retar', q: q.id, d: q.lu }, (P.retar || 0) * (0.5 + 0.5 * per.comp) * qv * (sa >= AJ.duelo.saludMin ? 1 : 0.2)); }
    { const d = mejor(w.ids.filter((id) => a.vis[id] !== 2), () => 0); if (d) pon({ t: 'explorar', d }, (P.explorar || 0) * (0.5 + 0.5 * per.cur)); }
    { let d = a.casa, bv = 0; Object.keys(a.rel).forEach((id) => { const r = a.rel[id]; if (r.af > bv && r.lu && w.nodos[r.lu] && w.nodos[r.lu].pueblo) { bv = r.af; d = r.lu; } }); pon({ t: 'socializar', d }, (P.socializar || 0) * (0.3 + 0.7 * per.soc)); }
    pon({ t: 'descansar' }, 0.12);
    return out.sort((x, y) => y.u - x.u);
  }

  // ── PLANIFICADOR de metas: estado simbólico pequeño + acciones con condición/efecto/coste (A.acciones.OPS). Coste uniforme, con tope de nodos y de fondo ──
  const META = { sanar: (s) => s.sa >= 0.95, abastecer: (s) => s.es >= 3, entrenar: (s, o) => s.c >= (o.n || 1), capturar: (s) => s.c >= 1, retar: (s) => s.c >= 1, explorar: (s) => s.c >= 1, comerciar: (s, o) => s.br >= o.m, socializar: (s) => s.c >= 1, descansar: (s) => s.c >= 1 };
  function planificar(ag, a, obj, t, est) {
    const w = A.Wn(a.lug), OPS = A.acciones.OPS, usa = A.acciones.USA[obj.t], meta = META[obj.t], cx = { a, obj, t, w, ab: !G.ciclo || G.ciclo.abierta('tienda', est && est.reloj), cCura: Math.max(8, G.tienda.precioCurar(a)), pel: (id) => peligro(a, t, id) };
    const s0 = { lug: a.lug, br: a.brillos, pe: A.acciones.pescados(a), es: a.esferas, po: G.tienda.cuantos(a, 'pocion'), sa: A.salud(a), c: 0, g: 0, f: 0, p: null, ant: null };
    if (meta(s0, obj)) return null;
    const abiertos = [s0], vistos = new Set(); let n = 0;
    while (abiertos.length && n++ < AJ.planNodos) {
      let mi = 0; for (let i = 1; i < abiertos.length; i++) if (abiertos[i].g < abiertos[mi].g) mi = i; const s = abiertos.splice(mi, 1)[0];
      if (meta(s, obj)) { const pasos = []; for (let q = s; q.p; q = q.ant) pasos.unshift(q.p); return pasos; }
      const k = s.lug + '|' + (s.br >> 4) + '|' + s.pe + '|' + s.es + '|' + s.po + '|' + Math.round(s.sa * 4) + '|' + s.c; if (vistos.has(k) || s.f >= AJ.planFondo) continue; vistos.add(k);
      const hijo = (p, coste) => { const h = { lug: s.lug, br: s.br, pe: s.pe, es: s.es, po: s.po, sa: s.sa, c: s.c, g: s.g + coste, f: s.f + 1, p, ant: s }; abiertos.push(h); return h; };
      const dests = {}; ['cura', 'tienda', 'pesca', 'salvaje'].forEach((sv) => { const d = w.cerca[sv][s.lug]; if (d) dests[d] = 1; }); if (obj.d) dests[obj.d] = 1; dests[a.casa] = 1;
      Object.keys(dests).forEach((d) => { if (d !== s.lug && w.dist[s.lug][d] < Infinity) hijo({ a: 'ir', d }, w.dist[s.lug][d] * (1 + Math.min(2, cx.pel(d)))).lug = d; });
      usa.forEach((nm) => { const op = OPS[nm]; if (op.pre(s, cx)) op.ef(hijo(op.paso(s, cx), op.coste(s, cx)), cx); });
    }
    return null;
  }

  // ── ENCUENTROS: al despertar mira quién hay en su mismo lugar (primero sus conocidos; luego, alguien al azar) ──
  const libre = (b) => !(b.paso && (b.paso.bat || b.paso.dentro)) && b.sig !== null;
  const nivelEq = (x) => A.nivelMax(x);
  function ayudar(ag, a, b, t) {   // a un amigo malherido y sin Brillos: una poción, o pagarle la cura
    const T = G.tienda, coste = T.precioCurar(b); if (!(A.salud(b) < 0.45 && b.brillos < coste)) return false;
    if (T.cuantos(a, 'pocion') > 0) { T.sacar(a, 'pocion', 1); T.meter(b, 'pocion', 1); }
    else if (a.per.gen > 0.35 && a.brillos >= coste * 3) { T.gastar(a, coste); T.ganar(b, coste); }
    else return false;
    tocar(b, a.id, t, a.lug, 25, 5); tocar(a, b.id, t, a.lug, 8, 0); recordar(b, t, 'ayuda', a.id, a.lug, 1, 0.7); recordar(a, t, 'ayuda', b.id, a.lug, 1, 0.3); a.h.ayu = (a.h.ayu | 0) + 1; A.cron(ag, t, 'ayuda', a.id, b.id, a.lug); return true;
  }
  function charlar(ag, a, b, t) {   // sube la afinidad y se cuentan cosas: un sitio peligroso, o quién venció a un amigo (el rencor se contagia)
    const ra = a.rel[b.id], rb = b.rel[a.id], antes = ra ? vinculo(ra) : '', d = 3 + 6 * (a.per.soc + b.per.soc) / 2;
    const r1 = tocar(a, b.id, t, a.lug, d, 0), r2 = tocar(b, a.id, t, a.lug, d, 0); r1.tc = r2.tc = Math.round(t); r1.n++; r2.n++;
    [[a, b], [b, a]].forEach(([x, y]) => {
      const ko = evocar(x, t, { tipo: 'ko' }, 1)[0]; if (ko && !y.mem.some((e) => e[3] === ko[3] && (e[1] === 'ko' || e[1] === 'aviso'))) recordar(y, t, 'aviso', x.id, ko[3], -1, ko[5] * 0.5);
      const der = evocar(x, t, { tipo: 'der' }, 1)[0]; if (der && der[2] !== y.id && y.rel[x.id] && y.rel[x.id].af >= 25 && x.rel[der[2]]) { const q = tocar(y, der[2], t, '', -12, 0); if (!q.lu) q.lu = x.rel[der[2]].lu; q.t = x.rel[der[2]].t; }
    });
    if (antes !== 'aliado' && vinculo(r1) === 'aliado' && vinculo(r2) === 'aliado') A.cron(ag, t, 'alianza', a.id, b.id, a.lug);
    a.h.cha = (a.h.cha | 0) + 1; ag.cont.charla = (ag.cont.charla | 0) + 1;
  }
  function quiereDuelo(ag, a, b, t) {
    const D2 = AJ.duelo, r = a.rel[b.id], v = vinculo(r); if (v === 'aliado' || (r && t - r.td < D2.enfriamiento) || A.salud(a) < D2.saludMin || A.salud(b) < D2.saludMin) return false;
    if (nivelEq(b) > nivelEq(a) + 2 + Math.round(6 * a.per.val)) return false;   // no reta a quien le saca demasiados niveles (según su valentía)
    const p = a.per.comp * 0.45 + (a.amb === 'campeon' ? 0.25 : 0) + (v === 'rival' ? 0.35 : v === 'enemigo' ? 0.5 : v === 'amigo' ? -0.1 : 0);
    return A.azar(ag, a) < p;
  }
  const aceptaDuelo = (a, b) => b.per.val * 0.6 + b.per.comp * 0.4 + (vinculo(b.rel[a.id]) === 'rival' ? 0.3 : 0) + (b.amb === 'campeon' ? 0.2 : 0) > 0.45;
  function encuentro(est, ag, a, t, forzar) {   // true = ha empezado un duelo (queda en espera)
    if (!forzar && t - a.te < AJ.charla.encuentro) return false; a.te = Math.round(t);
    const aqui = A.presentes(ag, a.lug), lista = [];
    for (const id in a.rel) { if (lista.length >= 2) break; if (id[0] !== 'a') continue; const b = ag.pob[+id.slice(1)]; if (b && b !== a && b.lug === a.lug) lista.push(b); }
    if (aqui.length > 1) { const b = ag.pob[aqui[Math.floor(A.azar(ag, a) * aqui.length)]]; if (b !== a && lista.indexOf(b) < 0) lista.push(b); }
    for (const b of lista) {
      if (!libre(b)) continue;
      if (!a.rel[b.id]) { recordar(a, t, 'conoce', b.id, a.lug, 0, 0.2); a.h.con = (a.h.con | 0) + 1; } if (!b.rel[a.id]) recordar(b, t, 'conoce', a.id, a.lug, 0, 0.2);
      const ra = tocar(a, b.id, t, a.lug, 0, 0), rb = tocar(b, a.id, t, a.lug, 0, 0), v = vinculo(ra);
      if ((v === 'amigo' || v === 'aliado') && ayudar(ag, a, b, t)) continue;
      if (quiereDuelo(ag, a, b, t)) {
        if (aceptaDuelo(a, b)) { A.acciones.duelo(est, ag, a, b, t); return true; }
        ra.re = Math.max(0, ra.re - 5); ra.td = rb.td = Math.round(t) - AJ.duelo.enfriamiento / 2; ag.cont.duelo_rechazado = (ag.cont.duelo_rechazado | 0) + 1; continue;
      }
      if (v !== 'enemigo' && t - ra.tc >= AJ.charla.enfriamiento && (forzar || A.azar(ag, a) < 0.25 + 0.6 * a.per.soc)) charlar(ag, a, b, t);
    }
    return false;
  }

  // ── EL CICLO ──
  function fallo(ag, a, t, que) { a.frus += 0.25; a.plan = []; if (a.obj) { a.obj.f = (a.obj.f | 0) + 1; if (a.obj.f >= 2) { a.veto[a.obj.t] = Math.round(t + AJ.veto); recordar(a, t, 'fallo', a.obj.t, a.lug, -1, 0.25); a.obj = null; } }   // al segundo tropiezo abandona ese objetivo un rato (y lo recuerda)
    ag.cont.plan_fallido = (ag.cont.plan_fallido | 0) + 1; }
  function despertar(est, ag, a, t) {
    const ACC = A.acciones.ACC;
    if (a.paso) { const p = a.paso; a.paso = null; if (p.dentro) a.sal = Math.round(t * 100) / 100;   /* v2.326: cuándo sale de un edificio / llega por una puerta (el cuerpo lo anima) */ if (p.poi && p.a !== 'ir') a.poi = p.poi; if (ACC[p.a].fin(est, ag, a, p, t) === false) fallo(ag, a, t, p.a); }
    revisarAmbicion(ag, a, t);
    if (A.vivas(a).length && encuentro(est, ag, a, t, false)) return;
    if (a.obj && a.obj.t !== 'sanar' && A.salud(a) < 0.35) { a.obj = null; a.plan = []; }   // una urgencia rompe el compromiso con el plan
    for (let intento = 0; intento < 4; intento++) {
      if (!a.plan.length) {
        let re = a.obj && (a.obj.f || a.obj.r) ? a.obj : null;                                         // plan roto o interrumpido: primero se intenta el mismo objetivo por otro camino
        if (a.obj && !re) { a.sac[a.obj.t] = Math.round(t); a.frus = Math.max(0, a.frus - 0.15); }      // plan terminado: objetivo cumplido
        a.obj = null;
        for (let v = 0; v < 2 && !a.obj; v++) {
          for (const o of re ? [re] : candidatos(ag, a, t, G.ciclo && est ? G.ciclo.hora(est.reloj) : null)) { delete o.r; const pl = planificar(ag, a, o, t, est); if (pl && pl.length) { a.obj = o; a.plan = pl; ag.cont.planes = (ag.cont.planes | 0) + 1; break; } }
          if (!re) break; if (!a.obj && re.f) a.veto[re.t] = Math.round(t + AJ.veto); re = null;
        }
        if (!a.obj) break;
      }
      const p = a.plan[0], r = ACC[p.a].ini(est, ag, a, p, t);
      if (r === null) return;                                     // en combate: lo despertará el desenlace
      if (r === false) { fallo(ag, a, t, p.a); continue; }        // ya no se puede: se vuelve a pensar
      if (r > 0) { A.programar(ag, a, t + r); return; }           // r === 0: el paso no hacía falta; se sigue con el siguiente
    }
    a.paso = A.acciones.ocioPaso(a, t); A.programar(ag, a, t + AJ.dur.ocio + a.paso.w);   // sin nada que hacer: espera y vuelve a mirar
  }

  A.mente = { saliencia, recordar, evocar, peligro, tocar, vinculo, METRICA, META, revisarAmbicion, candidatos, rutina, planificar, encuentro, charlar, ayudar, despertar };
})(typeof window !== 'undefined' ? window : globalThis);
