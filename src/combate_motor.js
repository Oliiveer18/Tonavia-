// combate_motor.js — el combate DENTRO del estado de la partida (v2.272, solo HD-2D por ahora). Une el motor puro (src/combate.js) con `est`: est.combate es JSON puro y sale/entra en el guardado.
// est.combate = { v, mapa, jid, ax, ay (centro de la arena en px del mapa), c (estado del motor de combate), acc (tiempo acumulado), evs (eventos de los últimos 3 s, con su tick), enemigos (índices de criaturas del mapa en pelea), fin }
// Sin DOM y sin Math.random. Órdenes (G.motor.aplicar): { j, t:'combate', aliado? } empieza contra la criatura salvaje más cercana · { j, t:'esp' } lanza el especial de la criatura del jugador · { j, t:'combate_fin' } lo corta.
// De momento el equipo del jugador no existe: `aliado` (id de forma) o 'pompon' hace de criatura propia (provisional, ficha FICHA_COMBATE §10). Una pelea por mapa a la vez.
(function (root) {
  'use strict';
  const G = root.G, motor = G.motor, T = 16, K = 0.8, TPS = G.COMBATE_DATOS.TPS, DT = 1 / TPS, RADIO = 7 * T, EVS_TICKS = 60; // K = px del mapa por unidad de arena (160 u = 8 casillas)
  const activo = (est) => !!(est.combate && !est.combate.fin);
  // v2.325: la criatura del jugador que está luchando ahora (en un duelo contra un entrenador el jugador lleva a su equipo: 'j_<id>' y los relevos 'j_<id>_<n>')
  const mia = (k, jid) => k.c.u.find((q) => q.side === 0 && q.campo && !q.ko && (q.id === 'j_' + jid || q.id.indexOf('j_' + jid + '_') === 0)) || null;
  const cercana = (est, j) => { let best = null, bd = RADIO; motor.criaturas(est, j.mapa).forEach((c, i) => { if (c.enCombate) return; const d = Math.hypot(c.x - j.x, c.y - j.y); if (d < bd) { bd = d; best = i; } }); return best; };
  // dónde se monta la arena: lo más cerca posible del punto medio, pero con las dos unidades y el espacio entre ellas en suelo libre y SIN nada delante (casas, árboles, tejados)
  function sitio(m, mx, my) {
    const HW = 39, K0 = K, ok = (x, y) => { if (x < HW + 12 || y < 30 || x > m.W * T - HW - 12 || y > m.H * T - 4) return false;
      for (const q of [-HW, -31, -23, -15, -7, 0, 7, 15, 23, 31, HW]) { if (motor.bloqueado(m, x + q, y)) return false; if (Math.abs(q) === HW || q === 0) { if (G.capas && G.capas.tapa && G.capas.tapa(m, x + q - 12, y - 28, x + q + 12, y, y)) return false; } } return true; };
    if (ok(mx, my)) return [mx, my];
    const c = []; for (let dy = -40; dy <= 40; dy += 4) for (let dx = -64; dx <= 64; dx += 4) c.push([dx, dy, dx * dx + dy * dy]); c.sort((a, b) => a[2] - b[2]);
    for (const [dx, dy] of c) if (ok(mx + dx, my + dy)) return [mx + dx, my + dy];
    return [mx, my];   // sin sitio ideal: donde estaban
  }
  function iniciar(est, j, aliado) {
    if (est.combate) return false;   // mientras dure el combate (y su cierre, con la captura) no empieza otro
    const i = cercana(est, j); if (i === null) { est.avisos.push({ j: j.id, texto: 'No hay criaturas cerca' }); return false; }
    const m = G.mundo.mapa(j.mapa), lista = motor.criaturas(est, j.mapa), c = lista[i];
    const ac = est.acomp && est.acomp.j === j.id ? est.acomp : null, al = ac || j; if (ac) ac.enCombate = true;
    // empiezan donde están: la arena se centra entre los dos y cada unidad arranca en su sitio real (si el aliado queda a la derecha, el eje se invierte)
    const fl = al.x <= c.x ? 1 : -1, [ax, ay] = sitio(m, (al.x + c.x) / 2, (al.y + c.y) / 2), u0 = (px) => Math.max(8, Math.min(152, 80 + fl * (px - ax) / K));
    const esp = (k) => String(k).split('#')[0], fp = aliado || (ac && (ac.clave || ac.forma)) || 'pompon', vida = j.vida && j.vida[fp], N = G.nivel, np = N ? N.nivelDeEspecie(j, fp) : 1, rarE = G.combate.statsDe({ forma: c.id }).rar, ne = Math.min(50, (N ? N.nivelSalvaje(rarE, c.id + '|' + j.mapa + '|' + i) : 1) + (G.profundidades ? G.profundidades.nivelExtra(est, j.mapa, c) : 0) + (G.dimensiones && G.dimensiones.ajustesDe ? G.dimensiones.ajustesDe(G.mundo.mapa(j.mapa)).nivel : 0));   // F6: nivel base de la región (0 en Tonavia)   // v2.320: en las Profundidades el nivel sube con el piso   // v2.303: nivel del aliado (por su XP) y de la salvaje (por rareza)
    if (vida !== undefined && vida <= 0) { if (ac) delete ac.enCombate; est.avisos.push({ j: j.id, texto: G.combate.statsDe({ forma: esp(fp) }).nom + ' está debilitada: llévala al Centro PC' }); return false; }   // v2.309: una criatura a 0 de vida no combate hasta que la curen
    const crz = G.crianza ? G.crianza.unidad(j, esp(fp), 'j_' + j.id) : null;   // v2.320: si una cría representa a la especie, lucha con su talento y su habilidad heredada
    const eq = [[{ id: 'j_' + j.id, forma: esp(fp), clave: fp, mote: G.equipo ? G.equipo.moteDe(j, fp) || undefined : undefined, nivel: np, auto: false, hp: vida, tal: crz ? crz.tal : undefined, kit: crz ? crz.kit : undefined }], [{ id: 'e_' + i, forma: c.id, nivel: ne }]];
    const semilla = ((est.sesion !== undefined ? est.sesion : est.semilla) + est.reloj * 1000 + i * 7919) >>> 0;   // F4: el azar del combate sale de la semilla de ESTA sesión (est.sesion), no de la del mundo (est.semilla, que se restaura al cargar): recargar una partida no repite las tiradas
    c.enCombate = true;
    const cr = {}; lista.forEach((q, ix) => { if (ix === i) cr['e_' + i] = q; });
    est.combate = { v: 1, cr, fl, y0: { ['j_' + j.id]: al.y, ['e_' + i]: c.y }, mapa: j.mapa, jid: j.id, ax, ay, c: G.combate.nuevo(semilla, eq, { campo: [1, 1] }), niv: { fp, np, ne, rarE }, acc: 0, evs: [], enemigos: [i], fin: null };
    { const q = est.combate.c.u, XA = 40, XE = 120, a0 = u0(al.x), e0 = u0(c.x); q.find((w) => w.id === 'j_' + j.id).x = XA; q.find((w) => w.id === 'e_' + i).x = XE; est.combate.dx = { ['j_' + j.id]: (a0 - XA) * K, ['e_' + i]: (e0 - XE) * K };
      const kk = est.combate, y1 = ay, dist = Math.max(Math.hypot(kk.dx['j_' + j.id], kk.y0['j_' + j.id] - y1), Math.hypot(kk.dx['e_' + i], kk.y0['e_' + i] - y1)); kk.ent = Math.max(0.4, Math.min(2.5, dist / 50)); kk.entT = 0; }   // caminan a su sitio (50 px/s) y el combate arranca al llegar   // formación a ~80 px; se deslizan desde su sitio real en 0,8 s
    return true;
  }
  function terminar(est) {
    const k = est.combate; if (!k || k.fin) return; k.fin = k.c.fin || { ganador: null, t: k.c.t, corte: true }; k.finT = 0;
    if (k.duelo && G.agentes && G.agentes.trato) G.agentes.trato.finDuelo(est, k);   // v2.325: duelo contra un entrenador autónomo: vida, XP, Brillos y recuerdos los reparte src/agentes_trato.js
    /* las criaturas de la arena siguen ocultas en el mapa hasta liberar(): así la superviviente no aparece duplicada en su sitio de origen */
    const j = est.jugadores[k.jid];
    if (j && k.niv) { const u = k.c.u.find((q) => q.id === 'j_' + k.jid); if (u) { j.vida = j.vida || {}; if (u.ko || u.hp <= 0) j.vida[k.niv.fp] = 0; else if (u.hp >= u.hpMax) delete j.vida[k.niv.fp]; else j.vida[k.niv.fp] = Math.max(1, Math.round(u.hp)); if (!Object.keys(j.vida).length) delete j.vida; } }   // v2.309: la vida con la que sale la criatura se conserva (también si cortas el combate)
    if (k.fin.ganador === 0 && !k.fin.corte && k.niv && G.nivel && j) {   // v2.303: ganar da XP a la especie que luchó; subir de nivel avisa
      const r = G.nivel.sumar(j, k.niv.fp, G.nivel.xpGanada(k.niv.np, k.niv.ne, k.niv.rarE)); k.premio = r; if (G.entrenador && r) G.entrenador.dar(est, j, Math.max(1, Math.round(r.ganada * 0.5)), 'combate');   // v2.343: XP de entrenador
       if (G.tienda) { const b = G.tienda.ganar(j, G.tienda.premioDe(j, k.niv.np, k.niv.ne, k.niv.rarE)); if (b) est.avisos.push({ j: j.id, texto: '+' + b + ' ✦' }); }   // v2.316: Brillos por ganar
     
      if (r) { const nom = (G.equipo && G.equipo.moteDe(j, k.niv.fp)) || G.combate.statsDe({ forma: String(k.niv.fp).split('#')[0] }).nom; est.avisos.push({ j: j.id, texto: r.sube ? '¡' + nom + ' sube al nivel ' + r.despues + '! (+' + r.ganada + ' XP)' : '+' + r.ganada + ' XP' }); }
    }
    // v2.338: la captura ya no se ofrece tras derrotar: se ofrece EN el combate, cuando la salvaje queda con la vida en rojo (ver ofrecer)
  }
  // ── Captura (v2.296; v2.338): cuando una salvaje queda con la vida en ROJO (≤ 25 %) el combate se pausa y se le puede lanzar una esfera (cap.vivo). Si se captura, el combate acaba en victoria sin derrotarla; si se suelta o se escapa, el combate sigue. Una oferta por criatura. Todo determinista (semilla del combate), pensado para online ──
  const ROJO = 0.25;
  const ESF0 = 5, BASE = { comun: 0.85, rara: 0.65, epica: 0.4, legendaria: 0.22 }, ESPERA = 0.8;
  function esf(j) { if (j.esferas === undefined) j.esferas = ESF0; return j.esferas; }
  const hrnd = (s) => { s = (s ^ 61) ^ (s >>> 16); s = (s + (s << 3)) | 0; s ^= s >>> 4; s = Math.imul(s, 0x27d4eb2d); s ^= s >>> 15; return (s >>> 0) / 4294967296; };
  function lanzar(est, j, o) {
    const k = est.combate, c = k && k.cap; if (!c || c.fase !== 'oferta' || c.t < ESPERA || esf(j) <= 0) return;
    j.esferas--; c.n++; c.q = Math.max(0, Math.min(1, +o.q || 0)); c.fase = 'vuelo'; c.t = 0;
  }
  function ofrecer(est, k) {   // v2.338: ¿hay una salvaje en rojo y esferas? → empieza la oferta (el combate se queda en pausa mientras dure)
    if (k.duelo || k.cap || k.fin || k.c.fin) return; const j = est.jugadores[k.jid]; if (!j || esf(j) <= 0) return; k.capNo = k.capNo || {};
    if (G.equipo && G.equipo.cajaLlena(j)) { if (!k.llena) { k.llena = true; est.avisos.push({ j: j.id, texto: 'La caja del Centro PC está llena: no puedes capturar. Amplíala allí' }); } return; }
    const u = k.c.u.find((q) => q.side === 1 && q.id.indexOf('e_') === 0 && q.campo !== false && !q.ko && q.hp > 0 && q.hp / q.hpMax <= ROJO && !k.capNo[q.id]);
    if (u) k.cap = { id: u.id, forma: u.forma, rar: u.rar || 'comun', el: u.el || 'fuego', fase: 'oferta', t: 0, n: 0, q: 0, ok: false, sac: 0, miss: false, vivo: true };
  }
  function capAvanzar(est, k, dt) {
    const c = k.cap, j = est.jugadores[k.jid]; c.t += dt;
    if (c.fase === 'oferta' && c.t > 14) { c.fase = 'huye'; c.t = 0; }
    else if (c.fase === 'vuelo' && c.t >= 0.75) {
      if (c.q <= 0) { c.miss = true; c.sac = 0; c.ok = false; c.fase = 'rompe'; c.t = 0; return; }
      c.miss = false; const sd = (k.c.rs + c.n * 7919) >>> 0, p = Math.min(0.97, BASE[c.rar] * (0.55 + 0.6 * c.q)); c.ok = hrnd(sd) < p; c.sac = c.ok ? 3 : 1 + (hrnd(sd + 1) * 2 | 0); c.fase = 'agita'; c.t = 0;
    } else if (c.fase === 'agita' && c.t >= c.sac * 0.8 + 0.35) {
      if (c.ok) { c.fase = 'ok'; c.t = 0; const nueva = !(G.equipo && G.equipo.propias(j)[c.forma]); if (nueva && G.tienda) { G.tienda.ganar(j, G.tienda.PREMIO_ESPECIE); est.avisos.push({ j: j.id, texto: '+' + G.tienda.PREMIO_ESPECIE + ' ✦ por una especie nueva' }); } const cu = k.c.u.find((q) => q.id === c.id); if (G.equipo) G.equipo.agregar(j, { forma: c.forma, mapa: k.mapa, hp: cu && c.vivo ? Math.max(1, Math.round(cu.hp)) : undefined, xp: cu && G.nivel ? G.nivel.xpPara(cu.nivel || 1) : 0 }); est.avisos.push({ j: j.id, texto: G.combate.statsDe({ forma: c.forma }).nom + ' enviada al Centro PC' }); if (G.entrenador) G.entrenador.dar(est, j, nueva ? 60 : 20, 'captura'); if (c.vivo) { if (cu) { cu.hp = 0; cu.ko = true; } derrotada(est, k, c.id); k.c.fin = { ganador: 0, t: k.c.t }; terminar(est); } } else { c.fase = 'rompe'; c.t = 0; }
    } else if (c.fase === 'rompe' && c.t >= 0.8) { if (c.n < 3 && esf(j) > 0) { c.fase = 'oferta'; c.t = ESPERA; } else { c.fase = 'huye'; c.t = 0; } }
    else if (c.fase === 'ok' && c.t >= 2.2) c.fase = 'fin';
    else if (c.fase === 'huye' && c.t >= (c.vivo ? 0.35 : 1.0)) { if (c.vivo) { k.capNo = k.capNo || {}; k.capNo[c.id] = true; k.cap = null; } else c.fase = 'fin'; }   // vivo: se acabó la oferta y el combate sigue
  }
  // una criatura derrotada desaparece en ese mismo instante: la salvaje sale del mapa para siempre; el acompañante de prueba no vuelve
  function derrotada(est, k, id) {
    const c = k.cr[id]; if (c) { if (id.indexOf('e_') === 0) k.vict = { id, forma: c.id }; const lista = motor.criaturas(est, k.mapa), q = lista.indexOf(c); if (q >= 0) lista.splice(q, 1); if (c.h !== undefined) { const em = motor.estadoMapa(est, k.mapa); (em.vencidas = em.vencidas || {})[c.h] = true; } /* su hueco no vuelve a generar criatura */ delete c.enCombate; delete k.cr[id]; }
    if (est.acomp && id === 'j_' + est.acomp.j) est.acomp.muerto = true;
  }
  function liberar(est) { const a = est.acomp, k = est.combate; if (a) { const j = est.jugadores[a.j], u = k && k.c.u.find((q) => q.id === 'j_' + a.j); delete a.enCombate; if (u && !u.ko) { const p = posicion(k, u); a.x = p.x; a.y = p.y; } else if (j) { a.x = j.x - 12; a.y = j.y; } } if (a && a.muerto) { delete est.acomp; const jq = est.jugadores[a.j], rel = jq && G.equipo && G.equipo.lider(jq); if (rel) acompanar(est, a.j, rel); } /* v2.312: relevo: la siguiente criatura sana del equipo pasa a acompañarte */ if (k) Object.keys(k.cr || {}).forEach((id) => { const c = k.cr[id], u = k.c.u.find((q) => q.id === id); if (!c) return; if (u && !u.ko) { const p = posicion(k, u); c.x = p.x; c.y = p.y; c.hx = p.x; c.hy = p.y; c.walk = 0; c.moving = false; } delete c.enCombate; }); delete est.combate; } // acaba la pantalla de resultado: el acompañante vuelve a seguirte
  function avanzar(est, dt) {
    const k = est.combate; if (!k) return; if (k.fin) { k.finT += dt; if (k.cap && k.cap.fase !== 'fin') { capAvanzar(est, k, dt); return; } if (k.finT > 1.9 || (k.cap && k.cap.fase === 'fin')) liberar(est); return; }
    if (k.cap && k.cap.vivo) { capAvanzar(est, k, dt); return; }   // v2.338: durante la oferta el combate está en pausa
    if (k.entT < k.ent) { k.entT += Math.min(dt, 0.1); return; }   // entrada: las criaturas caminan a su sitio, aún no luchan
    k.acc += Math.min(dt, 0.1);
    while (k.acc >= DT && !k.c.fin) { k.acc -= DT; const e0 = k.esp, u0 = e0 && k.c.u.find((q) => q.id === e0.id); if (e0 && (!u0 || u0.ko || u0.med < 100 || k.c.t > e0.hasta)) k.esp = null;   // v2.307: la pulsación del especial se recuerda hasta ESP_ESPERA ticks (o hasta que sale) y caduca si ya no se puede lanzar
      G.combate.paso(k.c, k.esp ? [{ t: 'esp', id: k.esp.id }] : []); if (k.esp && u0 && u0.med < 100) k.esp = null; k.c.ev.forEach((e) => { k.evs.push(e); if (e.e === 'ko') derrotada(est, k, e.id); }); }
    k.evs = k.evs.filter((e) => e.t > k.c.t - EVS_TICKS);
    if (k.c.fin) terminar(est); else ofrecer(est, k);
  }
  function orden(est, j, o) {
    if (o.t === 'combate') { iniciar(est, j, o.aliado); return true; }
    const k = est.combate; if (!k || k.fin) return false;
    if (o.t === 'esp') { const u = mia(k, j.id); if (u && u.campo && !u.ko && u.med >= 100) { k.esp = { id: u.id, hasta: k.c.t + Math.round(1.5 * G.COMBATE_DATOS.TPS) }; return true; } return false; }
    if (o.t === 'combate_fin') { terminar(est); return true; }
    return false;
  }
  // posición en px del mapa de una unidad del motor (línea de 160 u centrada en la arena; las unidades de un mismo bando se escalonan en profundidad)
  // separación visual: los dos bandos se apartan ±7 px del punto medio para que no se pisen al pelear cuerpo a cuerpo (solo vista; el motor no cambia)
  const ensanche = (k, x) => { const v = k.c.u.filter((q) => !q.ko && q.campo !== false); if (!v.length) return 0; const xm = v.reduce((a, q) => a + q.x, 0) / v.length; return 7 * Math.max(-1, Math.min(1, (x - xm) / 6)); };
  const posicion = (k, u) => { const lado = k.duelo ? [u] : k.c.u.filter((q) => q.side === u.side), n = lado.indexOf(u), y1 = k.ay + (n - (lado.length - 1) / 2) * 12, y0 = k.y0 && k.y0[u.id] !== undefined ? k.y0[u.id] : y1, s = k.ent ? Math.min(1, k.entT / k.ent) : 1, sx = s; return { x: k.ax + (k.fl || 1) * ((u.x - 80) * K + ensanche(k, u.x) + (k.dx && k.dx[u.id] ? k.dx[u.id] * (1 - sx) : 0)), y: y0 + (y1 - y0) * s }; }; // las líneas de profundidad se alinean poco a poco (2 s) desde donde estaban
  // acompañante provisional (solo de prueba, HD-2D): una criatura que sigue al jugador; durante el combate es el aliado. No existe en el 2D (no se crea).
  function acompanar(est, jid, clave) { const j = est.jugadores[jid]; if (!j) return; if (j.vida && j.vida[clave] <= 0) { delete est.acomp; return; } const forma = String(clave).split('#')[0]; est.acomp = { j: jid, forma, clave, x: j.x - 12, y: j.y, dir: 'down', moving: false, mapa: j.mapa }; }
  function seguir(est, dt) { // sigue el RASTRO de Oli (como un acompañante de RPG): camina por donde pasó él, a su misma velocidad (46 px/s), sin atajos, sin tirones y sin correr
    const a = est.acomp; if (!a || a.enCombate || !(dt > 0)) return; const j = est.jugadores[a.j]; if (!j) return;
    if (a.mapa !== j.mapa) { a.mapa = j.mapa; a.x = j.x; a.y = j.y; a.tr = []; a.moving = false; }
    const tr = a.tr || (a.tr = []), ult = tr.length ? tr[tr.length - 1] : { x: a.x, y: a.y };
    if (Math.hypot(j.x - ult.x, j.y - ult.y) >= 3) { tr.push({ x: j.x, y: j.y }); if (tr.length > 80) tr.shift(); }
    let L = 0, px = a.x, py = a.y; tr.forEach((q) => { L += Math.hypot(q.x - px, q.y - py); px = q.x; py = q.y; }); L += Math.hypot(j.x - px, j.y - py);
    const GAP = 20;
    if (L > 150) { a.x = j.x; a.y = j.y; tr.length = 0; a.moving = false; return; }                          // se quedó muy atrás (teletransporte, puerta): reaparece junto a Oli
    a.moving = a.moving ? L > GAP : L > GAP + 3;                                                              // arranca y para con un pequeño margen (sin parpadeos)
    if (!a.moving) return;
    let paso = 46 * Math.min(1.6, 1 + Math.max(0, L - GAP - 10) / 40) * dt, vx = 0, vy = 0;                   // si se retrasa mucho, acelera un poco para alcanzarlo
    while (paso > 1e-6) {
      const q = tr[0] || { x: j.x, y: j.y }, dx = q.x - a.x, dy = q.y - a.y, d = Math.hypot(dx, dy);
      if (d <= paso) { a.x = q.x; a.y = q.y; paso -= d; vx += dx; vy += dy; if (tr.length) tr.shift(); else break; }
      else { a.x += dx / d * paso; a.y += dy / d * paso; vx += dx / d * paso; vy += dy / d * paso; paso = 0; }
    }
    if (Math.abs(vx) + Math.abs(vy) > 1e-4) a.dir = Math.abs(vx) > Math.abs(vy) * 1.2 ? (vx > 0 ? 'right' : 'left') : Math.abs(vy) > Math.abs(vx) * 1.2 ? (vy > 0 ? 'down' : 'up') : a.dir;
  }
  // v2.309: curar (Centro PC): devuelve la vida completa a todas las criaturas del jugador y trae de vuelta al acompañante debilitado. Pensado también para pociones (curar una sola criatura: forma).
  function curar(est, jid, forma) {
    const j = est.jugadores[jid]; if (!j) return false; const cj = !forma && (j.sinId || []).some((q) => typeof q.hp === 'number'); const hay = forma ? !!j.vida && j.vida[forma] !== undefined : (!!j.vida && Object.keys(j.vida).length > 0) || cj; if (!hay) return false;   // v2.339: sin forma, también cura lo que hay en la caja
    if (forma) delete j.vida[forma]; else { j.vida = {}; (j.sinId || []).forEach((q) => { delete q.hp; }); } if (!Object.keys(j.vida).length) delete j.vida;
    if (!est.acomp && !est.combate) acompanar(est, jid, (G.equipo && G.equipo.lider(j)) || forma || 'pompon');
    est.avisos.push({ j: jid, texto: 'Tus criaturas se han recuperado' }); return true;
  }
  G.motor.combate = { capBase: BASE, curar, acompanar, seguir, K, TPS, activo, iniciar, avanzar, orden, terminar, posicion, ensanche, esferas: esf, entrando: (k) => !!(k && k.ent && k.entT < k.ent), cercana, sitio, mia };
  // ganchos en el motor: órdenes nuevas y avance del reloj; sin combate no cambia nada (la huella del 2D se comprueba)
  const aplicar0 = motor.aplicar, avanzar0 = motor.avanzar, criaturas0 = motor.moverCriaturas;
  motor.aplicar = function (est, o) { if (o && (o.t === 'lanzar' || o.t === 'soltar')) { const j = est.jugadores[o.j]; if (!j) throw new Error('orden de un jugador que no existe: ' + o.j); if (o.t === 'lanzar') lanzar(est, j, o); else if (est.combate && est.combate.cap && est.combate.cap.fase === 'oferta') { est.combate.cap.fase = 'huye'; est.combate.cap.t = 0; } return null; } if (o && (o.t === 'combate' || o.t === 'esp' || o.t === 'combate_fin')) { const j = est.jugadores[o.j]; if (!j) throw new Error('orden de un jugador que no existe: ' + o.j); orden(est, j, o); return null; } return aplicar0.call(motor, est, o); };
  motor.avanzar = function (est, dt) { avanzar0.call(motor, est, dt); if (est.combate) avanzar(est, dt); seguir(est, dt); };
  motor.moverCriaturas = function (est, dt) { if (est.combate && !est.combate.fin) motor.criaturas(est, est.combate.mapa).forEach((c) => { if (c.enCombate) c.talk = 1; }); return criaturas0.call(motor, est, dt); }; // las que pelean se quedan quietas (como al hablarles)
})(typeof window !== 'undefined' ? window : globalThis);
