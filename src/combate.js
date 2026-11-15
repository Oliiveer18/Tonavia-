// combate.js — MOTOR DE COMBATE en tiempo real (v2.271, prototipo). PURO: sin DOM, sin Math.random, sin relojes; 20 ticks/s; todo el estado es JSON (c) con su propia semilla (c.rs).
// Uso:  const c = G.combate.nuevo(semilla, [equipoA, equipoB], { campo: [1, 1] });  while (!c.fin) G.combate.paso(c, ordenes);   // c.ev = eventos del tick (para los pintores)
// equipo = lista de especificaciones { forma } (criatura real de G.LINEAS) o { el, rar, fase, kg } (plantilla), con { kit } opcional. Órdenes: { t:'esp', id } · { t:'cambio', id, a }.
// Presentación (2D y HD-2D) y simulador solo LEEN: eventos inicio, golpe, esquiva, fallo, reaccion, estado, ko, especial_listo, cambio, fin. Los números están por equilibrar (tools/simular_combate.js).
(function () {
  'use strict';
  const G = window.G, D = G.COMBATE_DATOS, MOV = D.MOV, TPS = D.TPS, ARENA = D.ARENA;
  const RAR = { comun: 1, rara: 1.25, epica: 1.45, legendaria: 1.7 }, FASE = [1, 1.25, 1.5];
  const FUERZA = 1.5;   // daño global por golpe (los ataques son más lentos: cada golpe pesa más)
  const WIND = { b: 4, h: 8, e: 14, d: 4, a: 6 }, TOTAL = { b: 8, h: 14, e: 30, d: 10, a: 12 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), tk = (s) => Math.round(s * TPS), hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const rnd = (c) => { c.rs = (c.rs + 0x6D2B79F5) >>> 0; let t = Math.imul(c.rs ^ (c.rs >>> 15), 1 | c.rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let IDX = null; // forma → { L, f, fase }
  const indice = () => { if (!IDX) { IDX = {}; G.LINEAS.forEach((L) => L.formas.forEach((f, i) => { IDX[f.id] = { L, f, fase: i + 1 }; })); } return IDX; };
  const kgPot = (kg) => { const K = D.KGPOT; if (kg <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (kg <= K[i][0]) { const t = Math.log(kg / K[i - 1][0]) / Math.log(K[i][0] / K[i - 1][0]); return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * t; } return K[K.length - 1][1]; };
  const ALC = [0, 16, 28, 48, 64, 80], DURO = { aturdido: 1, enredado: 1, miedo: 1 };

  // ── Estadísticas: plantilla de elemento × rareza × fase × peso. Ligeros: rápidos y frágiles; pesados: aguantan y empujan. ──
  function statsDe(s) {
    let el = s.el, rar = s.rar, fase = s.fase, kg = s.kg, nom = s.nom;
    if (s.forma) { const r = indice()[s.forma]; if (!r) throw new Error('forma desconocida: ' + s.forma); el = r.L.elements[0]; rar = r.L.rarity; fase = rar === 'legendaria' ? 3 : r.fase; kg = r.f.kg; nom = r.f.name; }
    const P = D.PLANTILLAS[el], w = Math.log2(1 + kg) / Math.log2(121), m = (RAR[rar] || 1) * (FASE[(fase || 1) - 1] || 1), nv = Math.max(1, Math.min(50, s.nivel | 0 || 1)), mn = G.nivel ? G.nivel.mult(nv) : 1;   // v2.303: el nivel (1 si no se indica) escala vida, ataque y defensa
    const tl = s.tal || {};   // v2.320: talento de una cría (src/crianza.js): multiplicador por estadística; sin él, todo ×1 como siempre
    return { el, nom: nom || el, rar, fase, kg, nivel: nv, hpMax: Math.round(480 * (0.75 + 0.5 * w) * (0.55 + 0.15 * P[0]) * m * mn * (tl.ps || 1)), atk: 10 * (0.55 + 0.15 * P[1]) * m * mn * kgPot(kg) * (tl.atq || 1), def: 10 * (0.55 + 0.15 * P[2]) * (0.8 + 0.4 * w) * m * mn * (tl.def || 1), vel: (0.55 + 0.12 * P[3]) * (1.25 - 0.5 * w) * (tl.vel || 1), alc: ALC[P[4]] };
  }
  // Kit según rareza: Común 3 huecos (básico+habilidad+especial); Rara +1 (defensa o apoyo); Épica/Legendaria +1 más. El exclusivo llegará con las criaturas.
  function kitDe(el, rar, id, forzado) {
    if (forzado) return forzado.slice();
    const h = hash(id), por = {}; Object.keys(MOV).forEach((k) => { if (MOV[k].el === el) (por[MOV[k].hueco] = por[MOV[k].hueco] || []).push(k); });
    const pick = (hu, o) => por[hu][(h + (o || 0)) % por[hu].length], kit = [pick('b'), pick('h'), pick('e')];
    if (rar !== 'comun') kit.push(h % 2 ? pick('d') : pick('a'));
    if (rar === 'epica' || rar === 'legendaria') kit.push(kit[3] === por.d[0] || kit[3] === por.d[1] ? pick('a') : pick('d'));
    kit.push(pick('b', 1)); // segundo básico para variar
    return kit;
  }
  function crearUnidad(id, side, s) {
    const st = statsDe(s);
    return { id, side, forma: s.forma || null, clave: s.clave || s.forma || null, nivel: st.nivel, el: st.el, nom: s.mote || st.nom, rar: st.rar, kg: st.kg, hpMax: st.hpMax, hp: s.hp > 0 ? Math.min(st.hpMax, s.hp) : st.hpMax, atk: st.atk, def: st.def, vel: st.vel, alc: st.alc, x: 0, campo: false, ko: false, kit: kitDe(st.el, st.rar, id, s.kit), cd: {}, est: {}, inm: {}, med: 0, acc: null, esc: 0, esq: 0, bA: 0, bV: 0, reg: 0, prov: null, amen: 0, cambioCd: 0, listo: -1, auto: s.auto !== false, ph: 0 };
  }
  function nuevo(semilla, equipos, cfg) {
    cfg = Object.assign({ campo: [1, 1], max: TPS * 150 }, cfg || {}); if (cfg.duelo) cfg.max = TPS * 1800;   // v2.326: en un duelo contra un entrenador NO hay victoria por tiempo (gana quien derrota a la criatura rival); el tope de 30 min solo evita un bloqueo eterno y acaba en tablas
    const c = { v: 1, t: 0, rs: semilla >>> 0, cfg, u: [], ev: [], pend: [], relevo: [], fin: null };
    equipos.forEach((eq, side) => eq.forEach((s, i) => { const u = crearUnidad(s.id || ('s' + side + 'u' + i), side, s); if (c.u.some((o) => o.id === u.id)) throw new Error('id de unidad repetido: ' + u.id); c.u.push(u); }));
    [0, 1].forEach((side) => { const mios = c.u.filter((u) => u.side === side); mios.slice(0, cfg.campo[side]).forEach((u, i) => { u.campo = true; u.x = (side === 0 ? 34 - i * 12 : ARENA - 34 + i * 12) + (rnd(c) - 0.5) * 16; u.ph = Math.floor(rnd(c) * 3); u.med = Math.floor(rnd(c) * 30); u.kit.forEach((k) => { u.cd[k] = Math.floor(rnd(c) * 16); }); }); }); // arranque desigual: medidor y primeros enfriamientos al azar
    return c;
  }
  const ev = (c, o) => c.ev.push(Object.assign({ t: c.t }, o));
  const vivos = (c, side) => c.u.filter((u) => u.side === side && u.campo && !u.ko), por = (c, id) => c.u.find((u) => u.id === id);
  const enemigos = (c, u) => vivos(c, 1 - u.side), aliados = (c, u) => vivos(c, u.side).filter((a) => a !== u), dir = (u) => (u.side === 0 ? 1 : -1);
  const mods = (u) => ({ atk: (u.bA > 0 ? 1.5 : 1) * (u.est.maldito > 0 ? 0.8 : 1) * (u.est.debil > 0 ? 0.75 : 1), def: u.est.maldito > 0 ? 0.8 : 1 });
  const velEf = (u) => u.vel * (u.est.ralentizado > 0 ? 0.55 : 1) * (u.bV > 0 ? 1.5 : 1);

  function poner(c, u, nombre, prob, dur) {
    if (u.ko || u.inm[nombre] > 0 || (prob < 1 && rnd(c) >= prob)) return; // tenacidad: tras un control duro hay unos ticks de inmunidad (evita bloqueos eternos)
    const t = tk(dur || D.ESTADOS[nombre]); if (!(u.est[nombre] > 0)) ev(c, { e: 'estado', id: u.id, est: nombre, on: 1 });
    u.est[nombre] = Math.max(u.est[nombre] || 0, t);
    if (nombre === 'aturdido' && u.acc) { ev(c, { e: 'interrumpe', id: u.id }); u.acc = null; }
  }
  function empujar(c, src, tgt, m) { poner(c, tgt, 'empujado', 1); }

  // ── Daño ──
  function curar(c, u, n) { const a = u.hp; u.hp = Math.min(u.hpMax, u.hp + n); const g = u.hp - a; if (g >= 1) ev(c, { e: 'cura', id: u.id, d: Math.round(g) }); } // las curas avisan a los pintores (relleno suave de la barra y «+N» verde)
  function golpear(c, src, tgt, m, factor) {
    if (tgt.ko || !tgt.campo) return 0;
    const evita = (tgt.esq > 0 ? 0.7 : clamp((tgt.vel - src.vel) * 0.1, 0, 0.2)) + (src.est.ciego > 0 ? 0.3 : 0);
    if (m.forma !== 'zona' && rnd(c) < evita) { ev(c, { e: 'esquiva', id: tgt.id, de: src.id, mov: m.id }); return 0; }
    const ms = mods(src), mt = mods(tgt); let k = (factor || 1) * G.elementEffect(m.el, tgt.el);
    const r = D.REACCIONES.find((q) => q.con === m.el && tgt.est[q.sobre] > 0);
    if (r) {
      k *= r.mult; ev(c, { e: 'reaccion', id: tgt.id, r: r.id, de: src.id });
      tgt.est[r.sobre] = 0; if (r.quita) tgt.est[r.quita] = 0; // la reacción consume el estado que la dispara
      (r.aplica || []).forEach(([n, p]) => poner(c, tgt, n, p, r.dur));
      if (r.salta) enemigos(c, src).forEach((o) => { if (o !== tgt && Math.abs(o.x - tgt.x) <= r.salta[0]) daño(c, src, o, m.pot * r.salta[1] * (src.atk * ms.atk) / (src.atk * ms.atk + o.def * mods(o).def) * 2); });
      if (r.extiende) enemigos(c, src).forEach((o) => { if (Math.abs(o.x - tgt.x) <= r.extiende[0]) poner(c, o, r.extiende[1], 1); });
    }
    const crit = rnd(c) < 0.18; if (crit) k *= 1.8; k *= 0.7 + 0.6 * rnd(c); // variación de ±30 % por golpe: las peleas igualadas se deciden de verdad al azar
    const d = ((D.AJUSTE[src.rar === 'legendaria' ? 'epica' : src.rar] || D.AJUSTE.comun)[src.el] || 1) * m.pot * k * (src.atk * ms.atk) / (src.atk * ms.atk + tgt.def * mt.def) * 2 * FUERZA;
    const real = daño(c, src, tgt, d, crit, m.id);
    m.est.forEach(([n, p]) => { if (n === 'empujado') { if (rnd(c) < p) empujar(c, src, tgt, m); } else poner(c, tgt, n, p); });
    src.med = Math.min(100, src.med + Math.min(14, real * 0.4)); tgt.med = Math.min(100, tgt.med + Math.min(10, real * 0.25));
    if (m.tag === 'roba') { curar(c, src, real * 0.5); }
    return real;
  }
  function dotAviso(c, u) { if ((u.dotA || 0) >= 1) ev(c, { e: 'dot', id: u.id, d: Math.round(u.dotA), mx: u.hpMax }); u.dotA = 0; }
  function daño(c, src, tgt, d, crit, mov) {
    const bl = tgt.esc > 0; if (bl) d *= 0.5; d = Math.max(1, d); tgt.hp -= d; if (mov === 'quemado') { tgt.dotA = (tgt.dotA || 0) + d; if (c.t % 20 === 0 || tgt.hp <= 0) dotAviso(c, tgt); if (tgt.hp <= 0) matar(c, tgt); return d; }   // la quemadura avisa una vez por segundo con la suma (no un «3» cada 0,25 s)
    ev(c, { e: 'golpe', bl: bl ? 1 : 0, id: tgt.id, de: src.id, mov, d: Math.round(d), crit: crit ? 1 : 0, mx: tgt.hpMax, ef: mov && MOV[mov] ? G.elementEffect(MOV[mov].el, tgt.el) : 1 });
    if (tgt.hp <= 0) matar(c, tgt); return d;
  }
  function matar(c, u) {
    u.hp = 0; u.ko = true; u.campo = false; u.acc = null; ev(c, { e: 'ko', id: u.id });
    if (c.u.some((o) => o.side === u.side && !o.ko && !o.campo)) c.relevo.push({ side: u.side, t: c.t + 20, x: u.x });
  }

  // ── Acciones ──
  function iniciar(c, u, m, o) {
    u.cd[m.id] = Math.round(tk(m.cd) * D.RITMO * (0.85 + 0.3 * rnd(c)) / (0.6 + 0.4 * velEf(u))); if (m.hueco === 'e') u.med = 0;
    u.acc = { m: m.id, o: o ? o.id : u.id, t: 0, tw: WIND[m.hueco], tf: TOTAL[m.hueco] }; if (o && o !== u && m.pot > 0) o.amen = c.t + Math.max(WIND[m.hueco], Math.round((D.IMPACTO[m.id] || 0) * TPS)) + 2;
    if (m.hueco === 'b' || m.hueco === 'h' || m.hueco === 'e') { c.libre = c.t + Math.max(Math.round((D.IMPACTO[m.id] || 0.9) * TPS), WIND[m.hueco]) + 8; c.ult = u.side; }   // turno visual: una acción ofensiva a la vez (hasta su impacto + reacción)
    ev(c, { e: 'inicio', id: u.id, mov: m.id, hueco: m.hueco, obj: o ? o.id : null });
  }
  // ¿puede esta unidad iniciar ya una acción ofensiva? tras cada una, el turno pasa primero al otro bando
  function turno(c, u) { const l = c.libre || 0; if (c.t < l) return false; return !(c.t < l + 4 && c.ult === u.side && c.u.some((q) => q.side !== u.side && q.campo && !q.ko)); }
  function resolver(c, u, m, o) {
    const ms = enemigos(c, u); let obj = o && !o.ko && o.campo ? o : null;
    if (m.hueco === 'd') { ev(c, { e: 'defensa', id: u.id, mov: m.id, el: m.el, tag: m.tag }); if (m.tag === 'esq') u.esq = tk(3 * m.k); else u.esc = tk(4 * m.k); return; }
    if (m.hueco === 'a') { apoyo(c, u, m, obj); return; }
    if (!obj) obj = ms[0]; if (!obj) return;
    const d = 0, d2 = 0;
    ev(c, { e: 'efecto', id: u.id, mov: m.id, el: m.el, forma: m.forma, x0: u.x, x1: obj.x, r: m.r, dt: m.forma === 'proyectil' ? 2 + Math.round(d / 40) : m.forma === 'zona' ? 6 : 0, obj: obj.id }); // para los pintores: qué se lanza, desde dónde y hasta dónde
    const dl = Math.max(0, Math.round((D.IMPACTO[m.id] || 0) * TPS) - WIND[m.hueco]);   // el daño llega justo cuando el efecto impacta (instante medido en el prototipo, tools/medir_impactos.js)
    if (dl > 0) { c.pend.push({ t: c.t + dl, de: u.id, m: m.id, o: obj.id, dif: 1 }); return; }
    aplicarForma(c, u, m, obj, d, d2, 0);
  }
  // el efecto en sí (daño/estados) de un movimiento ofensivo; dif=1 cuando se aplica con retraso al impacto visual
  function aplicarForma(c, u, m, obj, d, d2, dif) {
    const ms = enemigos(c, u);
    if (m.forma === 'contacto') { golpear(c, u, obj, m, m.tag === 'espalda' ? 1.3 : 1); return; }
    if (m.forma === 'proyectil') { if (dif) impactoPend(c, { de: u.id, m: m.id, x: obj.x, o: obj.id }); else c.pend.push({ t: c.t + 2 + Math.round(d / 40), de: u.id, m: m.id, x: obj.x, o: obj.id }); return; }
    if (m.forma === 'haz') { golpear(c, u, obj, m, 1); if (m.tag === 'cadena') ms.filter((q) => q !== obj && Math.abs(q.x - obj.x) <= m.r).slice(0, 2).forEach((q) => golpear(c, u, q, m, 0.6)); return; }
    if (m.forma === 'linea') { ms.forEach((q) => golpear(c, u, q, m, 1)); return; }
    if (m.forma === 'area') { ms.filter((q) => Math.abs(q.x - obj.x) <= m.r).forEach((q) => golpear(c, u, q, m, 1)); return; }
    if (m.forma === 'zona') { if (dif) impactoPend(c, { de: u.id, m: m.id, x: obj.x, z: 1 }); else c.pend.push({ t: c.t + 6, de: u.id, m: m.id, x: obj.x, z: 1 }); }
  }
  function apoyo(c, u, m, obj) {
    const tag = m.tag; ev(c, { e: 'apoyo', id: u.id, mov: m.id, el: m.el, tag, a: obj ? obj.id : u.id });
    if (tag === 'provoca') { enemigos(c, u).forEach((q) => { q.prov = { id: u.id, t: c.t + tk(3) }; }); u.esc = Math.max(u.esc, tk(2 * m.k)); return; }
    if (tag === 'debilita') { if (obj) poner(c, obj, 'debil', 1, D.ESTADOS.debil * m.k); return; }
    const a = obj && !obj.ko ? obj : u;
    if (tag === 'ataque') a.bA = tk(6 * m.k); else if (tag === 'veloz') a.bV = tk(6 * m.k);
    else if (tag === 'regen') a.reg = tk(3 * m.k); else if (tag === 'limpia') { ['quemado', 'enredado', 'aturdido', 'ralentizado', 'maldito', 'miedo', 'debil', 'ciego'].forEach((n) => { a.est[n] = 0; }); curar(c, a, a.hpMax * 0.1 * m.k); }
  }
  function impactoPend(c, p) {
    const u = por(c, p.de), m = MOV[p.m]; if (!u) return;
    if (p.dif) { const o = por(c, p.o); if (u.ko || !o || o.ko || !o.campo) return; aplicarForma(c, u, m, o, Math.abs(o.x - u.x), Math.abs(o.x - u.x), 1); return; }
    const ms = enemigos(c, u); if (p.z) { ms.filter((q) => Math.abs(q.x - p.x) <= m.r).forEach((q) => golpear(c, u, q, m, 1)); if (m.tag === 'curaAliados') vivos(c, u.side).forEach((a) => { curar(c, a, a.hpMax * 0.08); }); ev(c, { e: 'zona', id: u.id, mov: m.id, x: p.x }); return; }
    const o = por(c, p.o), centro = o && !o.ko && o.campo ? o : null; if (!centro) return;
    if (m.r > 0) ms.filter((q) => Math.abs(q.x - centro.x) <= m.r).forEach((q) => golpear(c, u, q, m, q === centro ? 1 : 0.6)); else golpear(c, u, centro, m, 1);
  }

  // ── IA ──
  function objetivo(c, u) {
    const en = enemigos(c, u); if (!en.length) return null;
    if (u.prov && u.prov.t > c.t) { const p = por(c, u.prov.id); if (p && p.campo && !p.ko) return p; }
    if (u.el === 'sombra') return en.slice().sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0];
    return en.slice().sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
  }
  const listo = (u, id) => !(u.cd[id] > 0);
  function decidir(c, u, orden) {
    const obj = objetivo(c, u); if (!obj) return;
    const d = 0, kit = u.kit.map((k) => MOV[k]);   // distancia fija: todo está al alcance
    const esp = kit.find((m) => m.hueco === 'e' && ((m.id === kit.filter((q) => q.hueco === 'e')[0].id))); // una sola especial equipada
    if (u.med >= 100 && esp && (orden || (u.auto && u.listo >= 0 && c.t >= u.listo + (u.ph * 3) && turno(c, u)))) { u.listo = -1; return iniciar(c, u, esp, obj); }
    const dfn = kit.find((m) => m.hueco === 'd' && listo(u, m.id));
    if (dfn && ((u.amen > c.t && rnd(c) < 0.6 * velEf(u)) || (u.hp < 0.4 * u.hpMax && rnd(c) < 0.05))) return iniciar(c, u, dfn, u);
    const ap = kit.find((m) => m.hueco === 'a' && listo(u, m.id));
    if (ap) {
      const al = aliados(c, u).concat([u]);
      if (ap.tag === 'provoca') { if (!u.esc && d < 60) return iniciar(c, u, ap, u); }
      else if (ap.tag === 'debilita') { const f = enemigos(c, u).filter((q) => !(q.est.debil > 0)).sort((a, b) => b.atk - a.atk)[0]; if (f && Math.abs(f.x - u.x) <= ap.alc) return iniciar(c, u, ap, f); }
      else if (ap.tag === 'ataque' || ap.tag === 'veloz') { const a = al.filter((q) => !(q.bA > 0 || q.bV > 0))[0]; if (a && enemigos(c, u).length) return iniciar(c, u, ap, a); }
      else { const a = al.filter((q) => q.hp < 0.75 * q.hpMax || (ap.tag === 'limpia' && Object.keys(q.est).some((n) => n !== 'mojado' && n !== 'empujado' && q.est[n] > 0))).sort((x, y) => x.hp / x.hpMax - y.hp / y.hpMax)[0]; if (a) return iniciar(c, u, ap, a); }
    }
    const ok = turno(c, u), hab = kit.filter((m) => m.hueco === 'h' && ok && listo(u, m.id) && d <= m.alc + 2);
    if (hab.length) return iniciar(c, u, hab[0], obj);
    const bas = kit.filter((m) => m.hueco === 'b' && ok && listo(u, m.id) && d <= m.alc + 2);
    if (bas.length) return iniciar(c, u, bas[(c.t >> 2) % bas.length], obj);
  }
  // posiciones FIJAS: las unidades no se desplazan nunca (la distancia de combate es siempre la misma); los acercamientos/embestidas son solo animación del pintor
  function mover() {}

  function paso(c, ordenes) {
    if (c.fin) return c; c.ev = []; c.t++;
    ordenes = ordenes || [];
    c.relevo = c.relevo.filter((r) => { if (c.t < r.t) return true; const n = c.u.filter((u) => u.side === r.side && u.campo && !u.ko).length; const cand = c.u.find((u) => u.side === r.side && !u.ko && !u.campo); if (cand && n < c.cfg.campo[r.side]) { cand.campo = true; cand.x = r.x; cand.cambioCd = tk(4); ev(c, { e: 'cambio', id: cand.id, x: cand.x }); } return false; });
    ordenes.forEach((o) => {
      if (o.t === 'cambio') { const a = por(c, o.id), b = por(c, o.a); if (a && b && a.campo && !a.ko && !b.campo && !b.ko && a.side === b.side && !(a.cambioCd > 0)) { a.campo = false; a.acc = null; b.campo = true; b.x = a.x; b.cambioCd = tk(4); ev(c, { e: 'cambio', id: b.id, sale: a.id, x: b.x }); } }
    });
    c.u.forEach((u) => {
      if (!u.campo || u.ko) return;
      Object.keys(u.cd).forEach((k) => { if (u.cd[k] > 0) u.cd[k]--; });
      Object.keys(u.est).forEach((k) => { if (u.est[k] > 0) { u.est[k]--; if (u.est[k] === 0) { if (k === 'quemado') dotAviso(c, u); ev(c, { e: 'estado', id: u.id, est: k, on: 0 }); if (DURO[k]) u.inm[k] = tk(2); } } });
      Object.keys(u.inm).forEach((k) => { if (u.inm[k] > 0) u.inm[k]--; });
      if (u.est.quemado > 0 && c.t % 5 === 0) daño(c, u, u, u.hpMax * 0.0125 * G.elementEffect('fuego', u.el), 0, 'quemado');
      if (u.reg > 0) { u.reg--; if (c.t % 5 === 0) curar(c, u, u.hpMax * 0.25 / 12); }
      ['esc', 'esq', 'bA', 'bV', 'cambioCd'].forEach((k) => { if (u[k] > 0) u[k]--; });
      if (u.hp <= 0) return;
      if (u.med < 100) { u.med = Math.min(100, u.med + 0.04); if (u.med >= 100) { u.listo = c.t; ev(c, { e: 'especial_listo', id: u.id }); } }
      else if (u.listo < 0) u.listo = c.t;
    });
    c.u.forEach((u) => {
      if (!u.campo || u.ko) return;
      if (u.acc) { u.acc.t++; if (u.acc.t === u.acc.tw) resolver(c, u, MOV[u.acc.m], por(c, u.acc.o)); if (u.acc && u.acc.t >= u.acc.tf) u.acc = null; return; }
      if (u.est.aturdido > 0 || u.est.empujado > 0 || u.est.miedo > 0) return mover(c, u);
      const orden = ordenes.some((o) => o.t === 'esp' && o.id === u.id);
      if ((c.t + u.ph) % 3 === 0 || orden) decidir(c, u, orden);
      if (!u.acc) mover(c, u);
    });
    c.u.forEach((u) => { u.mv = Math.abs(u.x - (u.px === undefined ? u.x : u.px)) > 0.01 ? 1 : 0; u.px = u.x; }); // para los pintores: ¿se ha movido este tick?
    c.pend = c.pend.filter((p) => { if (c.t < p.t) return true; impactoPend(c, p); return false; });
    [0, 1].forEach((side) => { if (!c.fin && !c.u.some((u) => u.side === side && !u.ko)) { c.fin = { ganador: 1 - side, t: c.t }; ev(c, { e: 'fin', ganador: 1 - side }); } });
    if (!c.fin && c.t >= c.cfg.max) { const h = [0, 1].map((s) => c.u.filter((u) => u.side === s).reduce((a, u) => a + u.hp / u.hpMax, 0)); c.fin = { ganador: c.cfg.duelo || h[0] === h[1] ? null : h[0] > h[1] ? 0 : 1, t: c.t, tiempo: true }; ev(c, { e: 'fin', ganador: c.fin.ganador, tiempo: true }); }
    return c;
  }
  G.combate = { VERSION: 1, nuevo, paso, statsDe, kitDe, crearUnidad, vivos, hash: (c) => hash(JSON.stringify(c.u) + c.t + c.rs) };
})();
