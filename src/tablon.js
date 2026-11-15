// tablon.js — TABLÓN DE INTERCAMBIOS de la Tienda (v2.344). Estado del mundo en est.tablon (JSON puro, determinista, sin DOM ni Math.random): ofertas de jugadores y entrenadores NPC.
// Reglas: solo se intercambia lo que está en la CAJA (no en el equipo) · al publicar u ofrecer, la criatura queda en CUSTODIA dentro de la oferta (nunca se duplica ni se pierde: si la oferta se retira, caduca o se rechaza, vuelve a su dueño)
// · cada oferta pide una especie / elemento / rareza / nivel mínimo, o «cualquiera» · TODA propuesta la acepta MANUALMENTE el dueño de la oferta (jugador o NPC) · el intercambio es atómico · XP de entrenador al confirmar (tope diario)
// · hasta ranurasTablon(j) ofertas activas (1…5, según el nivel de entrenador) · caducidad elegible (1, 3 o 7 días de juego) y ampliable · lo recibido por intercambio no se puede volver a intercambiar durante 1 día.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), VERSION = 1, DIA_S = 600, DURACIONES = [1, 3, 7], DUR_DEF = 3, MAX_PROPS_JUGADOR = 5, MAX_PROPS_OFERTA = 8, MAX_OFERTAS = 120, HIST = 30;
  const PASO_NPC = 12, ESPERA_NPC = 20, XP_DIA = 3, RAR = { comun: 1, rara: 2.2, epica: 4, legendaria: 8 }, NIV_MAX = 50;
  const existe = (f) => typeof f === 'string' && !!(G.CREATURES && G.CREATURES[f]);
  const elementos = () => Object.keys((G.COMBATE_DATOS && G.COMBATE_DATOS.PLANTILLAS) || {});
  const T = (est) => (est.tablon = est.tablon || { v: VERSION, sig: 0, of: [], hist: [], n: 0, acc: 0, rr: 0 });
  const st = (forma, xp) => G.combate.statsDe({ forma, nivel: G.nivel.nivelDe(xp || 0) });
  const nivelCr = (cr) => G.nivel.nivelDe(cr.xp || 0);
  const valor = (cr) => (RAR[st(cr.forma, 0).rar] || 1) * (10 + 3 * nivelCr(cr));
  const nombreCr = (cr) => cr.mote || st(cr.forma, 0).nom;
  const mayus = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const mote = (m) => (G.equipo ? G.equipo.moteOk(m) : '');
  // ── Qué se pide ──
  function pideOk(p) {
    if (!p || typeof p !== 'object' || p.modo === 'cualquiera') return p && p.modo === 'cualquiera' ? { modo: 'cualquiera' } : null;
    if (p.modo !== 'filtro') return null; const f = {}; let n = 0;
    if (p.forma !== undefined) { if (!existe(p.forma)) return null; f.forma = p.forma; n++; }
    if (p.el !== undefined) { if (elementos().indexOf(p.el) < 0) return null; f.el = p.el; n++; }
    if (p.rar !== undefined) { if (!RAR[p.rar]) return null; f.rar = p.rar; n++; }
    if (p.nivelMin !== undefined) { if (!Number.isInteger(p.nivelMin) || p.nivelMin < 1 || p.nivelMin > NIV_MAX) return null; f.nivelMin = p.nivelMin; n++; }
    return n ? Object.assign({ modo: 'filtro' }, f) : null;
  }
  function cumple(cr, p) {
    if (!p || p.modo === 'cualquiera') return true; const s = st(cr.forma, cr.xp);
    return (p.forma === undefined || cr.forma === p.forma) && (p.el === undefined || s.el === p.el) && (p.rar === undefined || s.rar === p.rar) && (p.nivelMin === undefined || nivelCr(cr) >= p.nivelMin);
  }
  // ── Dueños: jugador { t:'j', id } o entrenador NPC { t:'a', id:'a3' } ──
  const autJ = (j) => ({ t: 'j', id: j.id });
  const mismo = (a, b) => a.t === b.t && a.id === b.id;
  const jug = (est, aut) => (aut.t === 'j' ? est.jugadores[aut.id] || null : null);
  const npc = (est, aut) => (aut.t === 'a' && est.agentes && est.agentes.pob ? est.agentes.pob[+String(aut.id).slice(1)] || null : null);
  const nombreAut = (est, aut) => (aut.t === 'j' ? mayus(aut.id) : (npc(est, aut) || {}).nom || 'Entrenador');
  function autOk(est, a) { return a && typeof a === 'object' && ((a.t === 'j' && est.jugadores[a.id]) || (a.t === 'a' && typeof a.id === 'string' && /^a\d+$/.test(a.id))) ? { t: a.t, id: a.id } : null; }
  const cerca = (est, j) => { if (!j || est.combate) return false; const n = G.npc && G.npc.cercano(est, j);   /* F5: el tablón es GLOBAL (un solo est.tablon): se usa en cualquier mapa que tenga un personaje «tablon» (Tienda de Albanota y mercado del Nexus) */ return !!n && n.id === 'tablon'; };   // hay que estar junto a un tablón (Tienda de Albanota o Nexus)
  // ── Criaturas en custodia ──
  function tomar(est, j, id) {   // saca de la caja (no del equipo); null si no existe o está bloqueada
    const i = Number.isInteger(id) && j.sinId ? j.sinId.findIndex((q) => q.id === id) : -1; if (i < 0) return null; const e = j.sinId[i]; if (e.bloq > est.reloj) return null;
    j.sinId.splice(i, 1); if (!j.sinId.length) delete j.sinId; const c = { id: e.id, forma: e.forma, mapa: e.mapa || '', xp: e.xp | 0 }; if (typeof e.hp === 'number') c.hp = e.hp; if (e.mote) c.mote = e.mote; return c;
  }
  function entregar(est, aut, cr, intercambio) {   // la criatura llega a su (nuevo) dueño; si es devolución conserva su número, si es intercambio recibe uno nuevo y queda bloqueada 1 día
    const j = jug(est, aut), a = npc(est, aut);
    if (j) { const q = { forma: cr.forma, mapa: intercambio ? 'tablón' : cr.mapa, hp: cr.hp, xp: cr.xp, mote: cr.mote }; if (!intercambio) q.id = cr.id; else q.bloq = Math.round(est.reloj + DIA_S); G.equipo.agregar(j, q); return; }
    if (a) { const nueva = !a.pos[cr.forma]; a.pos[cr.forma] = (a.pos[cr.forma] | 0) + 1; if (cr.xp > ((a.prog && a.prog[cr.forma] && a.prog[cr.forma].xp) | 0)) { a.prog = a.prog || {}; a.prog[cr.forma] = { xp: cr.xp }; } if (nueva && a.equipo.length < 6 && a.equipo.indexOf(cr.forma) < 0) a.equipo.push(cr.forma); }
  }
  function sacarNpc(a, forma) { if ((a.pos[forma] | 0) < 2) return null; a.pos[forma]--; return { id: 0, forma, mapa: 'tablón', xp: (a.prog && a.prog[forma] && a.prog[forma].xp) | 0 }; }
  const excedentes = (a) => Object.keys(a.pos || {}).filter((f) => a.pos[f] >= 2 && existe(f)).sort();
  // ── Consultas ──
  const ofertas = (est) => T(est).of;
  const porId = (est, id) => ofertas(est).find((o) => o.id === id) || null;
  const activasDe = (est, aut) => ofertas(est).filter((o) => mismo(o.aut, aut));
  const propsDe = (est, aut) => { let n = 0; ofertas(est).forEach((o) => o.props.forEach((p) => { if (mismo(p.aut, aut)) n++; })); return n; };
  const diaDe = (est) => Math.floor(est.reloj / DIA_S);
  const restante = (est, o) => Math.max(0, o.t1 - est.reloj);
  function hist(est, o, res) { const h = T(est).hist; h.push({ id: o.id, res, t: Math.round(est.reloj), a: o.cr.forma, n: o.props.length }); while (h.length > HIST) h.shift(); }
  const err = (est, j, motivo, texto) => { if (texto && j && est.avisos) est.avisos.push({ j: j.id, texto }); return { ok: false, motivo }; };
  // cierra una oferta devolviendo TODO lo que está en custodia (salvo lo que se excluya)
  function cerrar(est, o, res, aceptada) {
    const t = T(est); t.of = t.of.filter((q) => q !== o); hist(est, o, res);
    if (res !== 'confirmada') entregar(est, o.aut, o.cr, false);
    o.props.forEach((p) => { if (p === aceptada) return; entregar(est, p.aut, p.cr, false); const pj = jug(est, p.aut); if (pj) G.buzon.avisar(est, pj, res === 'caducada' ? 'caducada' : 'rechazada', res === 'caducada' ? 'Caducó la oferta de ' + nombreAut(est, o.aut) + ': ' + nombreCr(p.cr) + ' vuelve a tu caja' : 'Tu propuesta por ' + nombreCr(o.cr) + ' no prosperó: ' + nombreCr(p.cr) + ' vuelve a tu caja', o.id); });
  }
  // XP y Brillos de un intercambio (solo jugadores): tope diario y bonus por especie nueva
  function premio(est, j, recibida, nueva) {
    if (!j) return; const d = diaDe(est); if (!j.tx || j.tx.d !== d) j.tx = { d, n: 0 };
    if (j.tx.n >= XP_DIA) { est.avisos.push({ j: j.id, texto: 'Hoy ya has ganado XP con tres intercambios' }); } else { j.tx.n++; const xp = Math.min(60, 10 + Math.round(valor(recibida) / 4)) + (nueva ? 40 : 0); if (G.entrenador) G.entrenador.dar(est, j, xp, 'intercambio'); }
    if (nueva && G.tienda) { const b = G.tienda.ganar(j, G.tienda.PREMIO_ESPECIE); if (b) est.avisos.push({ j: j.id, texto: '+' + b + ' ✦ por una especie nueva' }); }
  }
  function confirmar(est, o, p) {   // intercambio atómico: el dueño de la oferta recibe la propuesta y el que propuso recibe la oferta
    const jo = jug(est, o.aut), jp = jug(est, p.aut), nuevaO = jo ? !G.equipo.propias(jo)[p.cr.forma] : false, nuevaP = jp ? !G.equipo.propias(jp)[o.cr.forma] : false;
    entregar(est, o.aut, p.cr, true); entregar(est, p.aut, o.cr, true); cerrar(est, o, 'confirmada', p);
    if (jo) { premio(est, jo, p.cr, nuevaO); G.buzon.avisar(est, jo, 'confirmada', 'Intercambio hecho: recibes ' + nombreCr(p.cr) + ' por ' + nombreCr(o.cr), o.id); }
    if (jp) { premio(est, jp, o.cr, nuevaP); G.buzon.avisar(est, jp, 'confirmada', nombreAut(est, o.aut) + ' aceptó tu propuesta: recibes ' + nombreCr(o.cr), o.id); }
  }
  function descripcionPide(p) { if (!p || p.modo === 'cualquiera') return 'cualquier criatura'; const r = []; if (p.forma) r.push(G.CREATURES[p.forma].name); if (p.el) r.push('tipo ' + p.el); if (p.rar) r.push(p.rar); if (p.nivelMin) r.push('Nv ' + p.nivelMin + '+'); return r.join(' · '); }
  // ── Órdenes de jugador ──
  function orden(est, j, o) {
    if (!cerca(est, j)) return err(est, j, 'lejos');
    const aut = autJ(j), B = G.buzon;
    if (o.t === 'tablon_publicar') {
      const pide = pideOk(o.pide), dur = o.dur === undefined ? DUR_DEF : o.dur; if (!pide) return err(est, j, 'pide', 'Indica qué pides a cambio'); if (DURACIONES.indexOf(dur) < 0) return err(est, j, 'dur');
      if (ofertas(est).length >= MAX_OFERTAS) return err(est, j, 'lleno', 'El tablón está lleno');
      const ra = G.entrenador ? G.entrenador.ranurasTablon(j) : 1; if (activasDe(est, aut).length >= ra) return err(est, j, 'ranuras', 'Ya tienes ' + ra + (ra === 1 ? ' oferta activa' : ' ofertas activas') + ': sube de nivel para tener más');
      const cr = tomar(est, j, o.id); if (!cr) return err(est, j, 'criatura', 'Esa criatura no está en tu caja o aún no puede intercambiarse');
      const of = { id: ++T(est).sig, aut, cr, pide, t0: Math.round(est.reloj), t1: Math.round(est.reloj + dur * DIA_S), dur, props: [] }; T(est).of.push(of);
      est.avisos.push({ j: j.id, texto: nombreCr(cr) + ' queda en el tablón (' + dur + (dur === 1 ? ' día' : ' días') + ')' }); return { ok: true, of: of.id };
    }
    const of = porId(est, o.of); if (!of) return err(est, j, 'oferta', 'Esa oferta ya no está');
    if (o.t === 'tablon_retirar') { if (!mismo(of.aut, aut)) return err(est, j, 'ajena'); cerrar(est, of, 'retirada'); est.avisos.push({ j: j.id, texto: nombreCr(of.cr) + ' vuelve a tu caja' }); return { ok: true }; }
    if (o.t === 'tablon_ampliar') { if (!mismo(of.aut, aut)) return err(est, j, 'ajena'); if (DURACIONES.indexOf(o.dur) < 0) return err(est, j, 'dur'); of.t1 = Math.round(Math.max(of.t1, est.reloj + o.dur * DIA_S)); est.avisos.push({ j: j.id, texto: 'Oferta ampliada' }); return { ok: true, t1: of.t1 }; }
    if (o.t === 'tablon_ofrecer') {
      if (mismo(of.aut, aut)) return err(est, j, 'propia', 'No puedes ofrecer a tu propia oferta'); if (of.props.some((p) => mismo(p.aut, aut))) return err(est, j, 'repetida', 'Ya tienes una propuesta en esta oferta');
      if (of.props.length >= MAX_PROPS_OFERTA) return err(est, j, 'llena', 'Esta oferta ya tiene demasiadas propuestas'); if (propsDe(est, aut) >= MAX_PROPS_JUGADOR) return err(est, j, 'limite', 'Tienes ' + MAX_PROPS_JUGADOR + ' propuestas pendientes');
      const e = Number.isInteger(o.id) && j.sinId ? j.sinId.find((q) => q.id === o.id) : null; if (!e) return err(est, j, 'criatura', 'Esa criatura no está en tu caja');
      if (!cumple({ forma: e.forma, xp: e.xp | 0 }, of.pide)) return err(est, j, 'no_cumple', 'Esa criatura no cumple lo que se pide');
      const cr = tomar(est, j, o.id); if (!cr) return err(est, j, 'criatura', 'Esa criatura aún no puede intercambiarse');
      const p = { id: ++T(est).sig, aut, cr, t: Math.round(est.reloj) }; of.props.push(p); est.avisos.push({ j: j.id, texto: 'Propuesta enviada: ' + nombreCr(cr) });
      const dj = jug(est, of.aut); if (dj) B.avisar(est, dj, 'propuesta', nombreAut(est, aut) + ' te propone ' + nombreCr(cr) + ' (Nv ' + nivelCr(cr) + ') por ' + nombreCr(of.cr), of.id); return { ok: true, prop: p.id };
    }
    const p = of.props.find((q) => q.id === o.prop);
    if (o.t === 'tablon_retirar_prop') { const q = of.props.find((x) => x.id === o.prop && mismo(x.aut, aut)); if (!q) return err(est, j, 'propuesta'); of.props = of.props.filter((x) => x !== q); entregar(est, q.aut, q.cr, false); est.avisos.push({ j: j.id, texto: nombreCr(q.cr) + ' vuelve a tu caja' }); return { ok: true }; }
    if (!mismo(of.aut, aut)) return err(est, j, 'ajena'); if (!p) return err(est, j, 'propuesta', 'Esa propuesta ya no está');
    if (o.t === 'tablon_aceptar') { confirmar(est, of, p); return { ok: true }; }   // el dueño acepta A MANO: nada se confirma sin esta orden
    if (o.t === 'tablon_rechazar') { of.props = of.props.filter((x) => x !== p); entregar(est, p.aut, p.cr, false); const pj = jug(est, p.aut); if (pj) B.avisar(est, pj, 'rechazada', nombreAut(est, aut) + ' rechazó tu propuesta: ' + nombreCr(p.cr) + ' vuelve a tu caja', of.id); return { ok: true }; }
    return null;
  }
  // ── Caducidad ──
  function caducar(est) { ofertas(est).filter((o) => o.t1 <= est.reloj).forEach((o) => { const dj = jug(est, o.aut); cerrar(est, o, 'caducada'); if (dj) G.buzon.avisar(est, dj, 'caducada', 'Caducó tu oferta: ' + nombreCr(o.cr) + ' vuelve a tu caja', o.id); }); }
  // ── Entrenadores NPC: deterministas, con criterio (valor y necesidad), y nunca confirman sin decidir ──
  function rnd(est, sal) { let x = (est.semilla ^ Math.imul((T(est).n | 0) + 1, 0x9E3779B1) ^ Math.imul(sal + 1, 0x85EBCA6B)) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x2C1B3C6D) >>> 0; x ^= x >>> 12; x = Math.imul(x, 0x297A2D39) >>> 0; x ^= x >>> 15; return (x >>> 0) / 4294967296; }
  const quiere = (a, f) => !(a.pos && a.pos[f]);
  const justo = (dado, recibido) => valor(recibido) >= 0.85 * valor(dado);
  function npcDecide(est, a, aut) {   // responde a las propuestas de sus ofertas: acepta la mejor que le sirve y rechaza las que no
    for (const o of activasDe(est, aut)) {
      const listas = o.props.filter((p) => est.reloj - p.t >= ESPERA_NPC); if (!listas.length) continue;
      const buenas = listas.filter((p) => cumple(p.cr, o.pide) && justo(o.cr, p.cr)).sort((x, y) => (quiere(a, y.cr.forma) - quiere(a, x.cr.forma)) || (valor(y.cr) - valor(x.cr)) || x.id - y.id);
      if (buenas.length && (o.pide.modo === 'cualquiera' || buenas.some((p) => quiere(a, p.cr.forma)) || est.reloj - buenas[0].t >= 3 * ESPERA_NPC)) { const mejor = buenas.find((p) => quiere(a, p.cr.forma)) || buenas[0]; confirmar(est, o, mejor); return true; }
      const mala = listas.find((p) => !buenas.includes(p)); if (mala) { o.props = o.props.filter((x) => x !== mala); entregar(est, mala.aut, mala.cr, false); const pj = jug(est, mala.aut); if (pj) G.buzon.avisar(est, pj, 'rechazada', nombreAut(est, aut) + ' rechazó tu propuesta: ' + nombreCr(mala.cr) + ' vuelve a tu caja', o.id); return true; }
    } return false;
  }
  function npcPropone(est, a, aut) {
    if (propsDe(est, aut) >= 2 || rnd(est, 11) > 0.6) return false; const sobran = excedentes(a); if (!sobran.length) return false;
    for (const o of ofertas(est).slice().sort((x, y) => x.id - y.id)) {
      if (mismo(o.aut, aut) || o.props.some((p) => mismo(p.aut, aut)) || o.props.length >= MAX_PROPS_OFERTA || !quiere(a, o.cr.forma)) continue;
      const mios = sobran.map((f) => ({ forma: f, xp: (a.prog && a.prog[f] && a.prog[f].xp) | 0 })).filter((c) => cumple(c, o.pide) && justo(c, o.cr) && valor(c) <= 2 * valor(o.cr)).sort((x, y) => valor(x) - valor(y));
      if (!mios.length) continue; const cr = sacarNpc(a, mios[0].forma); if (!cr) continue;
      o.props.push({ id: ++T(est).sig, aut, cr, t: Math.round(est.reloj) }); const dj = jug(est, o.aut); if (dj) G.buzon.avisar(est, dj, 'propuesta', nombreAut(est, aut) + ' te propone ' + nombreCr(cr) + ' (Nv ' + nivelCr(cr) + ') por ' + nombreCr(o.cr), o.id); return true;
    } return false;
  }
  function npcPublica(est, a, aut) {
    if (activasDe(est, aut).length >= 1 || rnd(est, 13) > 0.5) return false; const sobran = excedentes(a); if (!sobran.length) return false;
    const f = sobran[Math.floor(rnd(est, 17) * sobran.length)], rar = st(f, 0).rar, pool = (G.LINEAS || []).filter((L) => L.rarity === rar && quiere(a, L.formas[0].id)).map((L) => L.formas[0].id);
    const cr = sacarNpc(a, f); if (!cr) return false; const pide = pool.length ? { modo: 'filtro', forma: pool[Math.floor(rnd(est, 19) * pool.length)] } : { modo: 'cualquiera' };
    T(est).of.push({ id: ++T(est).sig, aut, cr, pide, t0: Math.round(est.reloj), t1: Math.round(est.reloj + DUR_DEF * DIA_S), dur: DUR_DEF, props: [] }); return true;
  }
  function pasoNpc(est) {
    const ag = est.agentes; if (!ag || !ag.pob || !ag.pob.length) return; const t = T(est), a = ag.pob[t.rr % ag.pob.length]; t.rr++; const aut = { t: 'a', id: a.id };
    if (!a.pos || !a.equipo) return; if (!npcDecide(est, a, aut)) if (!npcPropone(est, a, aut)) npcPublica(est, a, aut);
  }
  function avanzar(est, dt) {
    if (!(dt > 0) || (!est.tablon && !(est.agentes && est.agentes.pob))) return; const t = T(est); caducar(est);
    t.acc += dt; let k = 0; while (t.acc >= PASO_NPC && k < 3) { t.acc -= PASO_NPC; t.n++; k++; pasoNpc(est); } if (t.acc > 3 * PASO_NPC) t.acc = 0;
  }
  // ── Guardado ──
  function serializar(est) { return est.tablon ? JSON.parse(JSON.stringify(est.tablon)) : undefined; }
  function restaurar(est, d) {
    if (!d || typeof d !== 'object' || d.v !== VERSION || !Array.isArray(d.of)) return false; const crOk = (c) => c && typeof c === 'object' && existe(c.forma) ? Object.assign({ id: Number.isInteger(c.id) ? c.id : 0, forma: c.forma, mapa: typeof c.mapa === 'string' ? c.mapa.slice(0, 24) : '', xp: Number.isInteger(c.xp) && c.xp > 0 ? Math.min(c.xp, 1e7) : 0 }, Number.isFinite(c.hp) && c.hp >= 0 ? { hp: Math.min(Math.round(c.hp), 1e6) } : {}, mote(c.mote) ? { mote: mote(c.mote) } : {}) : null;
    const of = []; d.of.slice(0, MAX_OFERTAS).forEach((o) => { const aut = o && autOk(est, o.aut), cr = o && crOk(o.cr), pide = o && pideOk(o.pide); if (!aut || !cr || !pide || !Number.isInteger(o.id) || !Number.isFinite(o.t1)) return;
      of.push({ id: o.id, aut, cr, pide, t0: Number.isFinite(o.t0) ? o.t0 : 0, t1: o.t1, dur: DURACIONES.indexOf(o.dur) >= 0 ? o.dur : DUR_DEF, props: (Array.isArray(o.props) ? o.props : []).slice(0, MAX_PROPS_OFERTA).map((p) => { const pa = p && autOk(est, p.aut), pc = p && crOk(p.cr); return pa && pc && Number.isInteger(p.id) ? { id: p.id, aut: pa, cr: pc, t: Number.isFinite(p.t) ? p.t : 0 } : null; }).filter(Boolean) }); });
    let sig = Number.isInteger(d.sig) ? d.sig : 0; of.forEach((o) => { if (o.id > sig) sig = o.id; o.props.forEach((p) => { if (p.id > sig) sig = p.id; }); });
    est.tablon = { v: VERSION, sig, of, hist: (Array.isArray(d.hist) ? d.hist : []).slice(-HIST).filter((h) => h && Number.isInteger(h.id) && typeof h.res === 'string' && existe(h.a)).map((h) => ({ id: h.id, res: h.res.slice(0, 12), t: Number.isFinite(h.t) ? h.t : 0, a: h.a, n: Number.isInteger(h.n) ? h.n : 0 })), n: Number.isInteger(d.n) ? d.n : 0, acc: Number.isFinite(d.acc) ? Math.max(0, Math.min(d.acc, 3 * PASO_NPC)) : 0, rr: Number.isInteger(d.rr) ? d.rr : 0 }; return true;
  }
  G.tablon = { DIA_S, DURACIONES, DUR_DEF, MAX_PROPS_JUGADOR, MAX_PROPS_OFERTA, valor, cumple, pideOk, descripcionPide, nombreCr, nombreAut, cerca, ofertas, porId, activasDe, restante, orden, caducar, avanzar, pasoNpc, serializar, restaurar };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.tablon;
})(typeof window !== 'undefined' ? window : globalThis);
