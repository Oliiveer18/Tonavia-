// navegacion.js — NAVEGACIÓN MARÍTIMA (Multiverso FN). Contrato: docs/multiverso/15_NAVEGACION_FN.md. PURO: sin DOM, sin Math.random, sin relojes de pared; NO toca el azar de la partida (est.rnd).
// · El mar es un mosaico 3×3 de mapas de 64×64 con «mar: true» (src/mapas.js: el agua se cruza, la tierra bloquea). Los datos viven en la dimensión (esquema v4, clave «navegacion»).
// · El barco es un MODO del jugador, no una entidad: se navega cuando j.mapa es un mapa de mar. Atracado, el barco es un DATO (amarre) en est.dim.<dim>.jugadores.<id>, junto a sus mejoras, su cosmética y lo descubierto.
// · Subir/bajar = puertas (motor.cruzar llama a puedeCruzar/alCruzar). Rumbo automático = rutas de datos (polilíneas, sin buscar caminos). Faros = viaje directo entre faros PROPIOS descubiertos. Mareas = condición de puerta.
// · Eventos del mar: plan puro por hash(semilla|mapa|ventana|n); los cobros se guardan por jugador. Todo lo que se guarda vive en est.dim.<dim> (Tonavia no cambia).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16, VERSION = 1, plano = (o) => !!o && typeof o === 'object' && !Array.isArray(o), esNum = Number.isFinite, ent = Number.isInteger;
  const NAV = G.dimensiones.NAV, PARTES = G.dimensiones.PARTES_BARCO, COSM = ['bandera', 'mascaron', 'cubierta'], CELDA = 8, CELDAS = NAV.lado * NAV.cols / CELDA, TOPE_DESC = 64, TOPE_COBROS = 64, JUG = /^[a-z][a-z0-9_]{0,15}$/, ID_COS = /^[a-z][a-z0-9_]{0,23}$/, ID_EV = /^[a-z0-9_]+\/[a-z0-9_]+#[0-9]{1,9}#[0-9]{1,2}$/;
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', NIEBLA_LEN = Math.ceil(CELDAS * CELDAS / 6);
  const registro = () => G.mundo.dimensiones, cfgDe = (dim) => (dim ? registro().navegacion(dim) : null), dimDe = (mapaId) => registro().deMapa(mapaId);
  const esMar = (id) => { const m = G.mundo.mapas[id]; return !!m && m.mar === true; };
  const aviso = (est, j, texto) => est.avisos.push({ j: j.id, texto });
  const navegando = (j) => !!j && esMar(j.mapa);

  // ── estado por jugador: est.dim.<dim>.jugadores.<id> ──
  const seccion = (est, dim, crear) => {
    const d = est.dim && plano(est.dim) ? est.dim : (crear ? (est.dim = {}) : null); if (!d) return null;
    let s = plano(d[dim]) ? d[dim] : null; if (!s) { if (!crear) return null; s = d[dim] = { v: 1 }; }
    if (!ent(s.v)) s.v = 1; if (s.v > VERSION) return null;   // sección de una versión futura: no se lee ni se pisa
    if (!plano(s.jugadores)) { if (!crear) return null; s.jugadores = {}; }
    return s;
  };
  const vacio = () => ({ casco: 0, velas: 0, bodega: 0, catalejo: 0 });
  const leerRec = (est, j, dim) => { const s = seccion(est, dim, false), r = s && s.jugadores[j.id]; return plano(r) ? r : null; };
  const escribirRec = (est, j, dim) => { const s = seccion(est, dim, true); if (!s) return null; if (!plano(s.jugadores[j.id])) s.jugadores[j.id] = vacio(); return s.jugadores[j.id]; };
  const dimJ = (j) => dimDe(j.mapa);

  // limpieza de lo que llega de un guardado o de la red (forma, rangos, listas cerradas, tamaños)
  const colorOk = (c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);
  const nombreOk = (n) => (typeof n === 'string' ? n.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 24) : '');
  function cosOk(k, c) { // cosmética: nombre de texto corto, color de velas y ids de listas cerradas (las de la dimensión, si las hay)
    const o = {}; if (!plano(k)) return o;
    const nm = nombreOk(k.nombre); if (nm) o.nombre = nm;
    if (colorOk(k.velas)) o.velas = k.velas.toLowerCase();
    COSM.forEach((p) => { if (typeof k[p] === 'string' && ID_COS.test(k[p]) && (!c || (c.barco.cosmetica[p] || []).indexOf(k[p]) >= 0)) o[p] = k[p]; });
    return o;
  }
  const amarreOk = (a, c) => (plano(a) && c.pos[a.mapa] && ent(a.tx) && ent(a.ty) && a.tx >= 0 && a.ty >= 0 && a.tx < NAV.lado && a.ty < NAV.lado ? { mapa: a.mapa, tx: a.tx, ty: a.ty } : null);
  function limpiarRec(r, c) {
    const o = vacio(); if (!plano(r)) return o;
    PARTES.forEach((p) => { o[p] = ent(r[p]) ? Math.max(0, Math.min(c.barco.max[p], r[p])) : 0; });
    const k = cosOk(r.cos, c); if (Object.keys(k).length) o.cos = k;
    const am = amarreOk(r.amarre, c); if (am) o.amarre = am;
    if (Array.isArray(r.desc)) { const vistos = {}, ids = {}; c.puntos.forEach((p) => { ids[p.id] = 1; }); const d = r.desc.filter((x) => typeof x === 'string' && ids[x] && !vistos[x] && (vistos[x] = 1)).slice(0, TOPE_DESC); if (d.length) o.desc = d; }
    if (typeof r.niebla === 'string' && r.niebla.length === NIEBLA_LEN && /^[A-Za-z0-9_-]+$/.test(r.niebla) && /[^A]/.test(r.niebla)) o.niebla = r.niebla;
    if (plano(r.cobros)) { const cb = {}; Object.keys(r.cobros).filter((x) => ID_EV.test(x) && r.cobros[x] === 1).sort().slice(-TOPE_COBROS).forEach((x) => { cb[x] = 1; }); if (Object.keys(cb).length) o.cobros = cb; }
    return o;
  }
  // Carga: valida el estado de navegación de cada dimensión que este juego conoce (las demás secciones se conservan tal cual; una sección de versión futura, también).
  function alRestaurar(est) {
    if (!est.dim || !plano(est.dim)) return;
    registro().lista().forEach((dim) => {
      const c = cfgDe(dim), s = est.dim[dim]; if (!c || !plano(s) || s.jugadores === undefined) return; if (ent(s.v) && s.v > VERSION) return;
      if (!plano(s.jugadores)) { delete s.jugadores; return; }
      const out = {}; Object.keys(s.jugadores).filter((id) => JUG.test(id)).slice(0, 8).forEach((id) => { out[id] = limpiarRec(s.jugadores[id], c); });
      s.jugadores = out; if (!ent(s.v)) s.v = 1;
    });
  }

  // ── geometría del mosaico ──
  const globalPx = (c, j) => { const p = c.pos[j.mapa]; return p ? { x: p[1] * c.lado * T + j.x, y: p[0] * c.lado * T + j.y } : null; };   // posición del jugador en el mar entero (px)
  const celdaDe = (gxt, gyt) => Math.floor(gyt / CELDA) * CELDAS + Math.floor(gxt / CELDA);
  // niebla: mapa de bits de CELDAS×CELDAS celdas de 8×8 casillas, guardado como texto de 96 letras (6 bits cada una)
  const cacheNieb = new WeakMap();
  function bitsDe(r) {
    const s = r && r.niebla; if (typeof s !== 'string') return new Uint8Array(CELDAS * CELDAS);
    const c = cacheNieb.get(r); if (c && c.s === s) return c.b;
    const b = new Uint8Array(CELDAS * CELDAS); for (let k = 0; k < s.length; k++) { const v = A64.indexOf(s[k]); for (let i = 0; i < 6; i++) { const n = k * 6 + i; if (n < b.length) b[n] = (v >> i) & 1; } }
    cacheNieb.set(r, { s, b }); return b;
  }
  function textoBits(b) { let t = ''; for (let k = 0; k < NIEBLA_LEN; k++) { let v = 0; for (let i = 0; i < 6; i++) { const n = k * 6 + i; if (n < b.length && b[n]) v |= 1 << i; } t += A64[v]; } return t; }
  function despejar(r, gxt, gyt, radio) { // marca como vistas las celdas cuyo centro está a menos de `radio` casillas; devuelve cuántas son nuevas
    const b = bitsDe(r).slice(), cx0 = Math.max(0, Math.floor((gxt - radio) / CELDA)), cx1 = Math.min(CELDAS - 1, Math.floor((gxt + radio) / CELDA)), cy0 = Math.max(0, Math.floor((gyt - radio) / CELDA)), cy1 = Math.min(CELDAS - 1, Math.floor((gyt + radio) / CELDA));
    let nuevas = 0; for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) { const i = cy * CELDAS + cx; if (!b[i] && Math.hypot(cx * CELDA + CELDA / 2 - gxt, cy * CELDA + CELDA / 2 - gyt) <= radio + CELDA / 2) { b[i] = 1; nuevas++; } }
    if (nuevas) { r.niebla = textoBits(b); } return nuevas;
  }

  // ── mareas: el RELOJ ÚNICO (est.reloj) y la hora del día; independiente de ?ciclo=0 y de #hora (esos solo cambian el dibujo) ──
  function hora(reloj) { const A = G.ciclo ? G.ciclo.AJUSTES : null, dia = A ? A.DIA_S : 600, f0 = A ? A.FASE0 : 0.4; return ((((f0 + (reloj || 0) / dia) % 1) + 1) % 1) * 24; }
  function marea(reloj, dim) { const c = cfgDe(dim), h = hora(reloj); return c && c.mareas.baja.some((q) => h >= q[0] && h < q[1]) ? 'baja' : 'alta'; }

  // ── barco: niveles, velocidad, amarre ──
  function barco(est, j) { // estado efectivo del barco de un jugador local (copia): niveles, cosmética, amarre y descubierto
    const dim = dimJ(j), c = cfgDe(dim); if (!c) return null; const r = leerRec(est, j, dim) || {};
    return { dim, casco: r.casco | 0, velas: r.velas | 0, bodega: r.bodega | 0, catalejo: r.catalejo | 0, cos: Object.assign({}, r.cos), amarre: r.amarre ? Object.assign({}, r.amarre) : null, desc: (r.desc || []).slice() };
  }
  function velocidad(est, j) { const dim = dimJ(j), c = cfgDe(dim); if (!c) return 46; const r = leerRec(est, j, dim), n = r ? Math.min(r.velas | 0, c.barco.velocidades.length - 1) : 0; return c.barco.velocidades[n]; }
  function mejorar(est, j, parte, nivel, dim0) { // API para los módulos de contenido (astillero…): fija un nivel dentro de los límites de la dimensión (la del jugador, o `dim0`)
    const dim = dim0 || dimJ(j), c = cfgDe(dim); if (!c || PARTES.indexOf(parte) < 0 || !ent(nivel) || nivel < 0 || nivel > c.barco.max[parte]) return false;
    const r = escribirRec(est, j, dim); if (!r) return false; r[parte] = nivel; return true;
  }
  function cosmetica(est, j, k, dim0) { const dim = dim0 || dimJ(j), c = cfgDe(dim); if (!c) return false; const o = cosOk(k, c), r = escribirRec(est, j, dim); if (!r) return false; if (Object.keys(o).length) r.cos = Object.assign({}, r.cos, o); else delete r.cos; return true; }
  function amarrar(est, j, a) { // API: deja el barco amarrado en una casilla de agua del mosaico (también es como un módulo «da» el primer barco)
    const dim = dimDe(a && a.mapa), c = cfgDe(dim); if (!c) return false; const am = amarreOk(a, c); if (!am) return false;
    const r = escribirRec(est, j, dim); if (!r) return false; r.amarre = am; return true;
  }
  function descubrir(est, j, id, dim0) { // API: descubre un punto (islas con pista, mapas del Loro Cartógrafo…). true si era nuevo
    const dim = dim0 || dimJ(j), c = cfgDe(dim); if (!c || !c.puntos.some((p) => p.id === id)) return false;
    const r = escribirRec(est, j, dim); if (!r) return false; r.desc = r.desc || []; if (r.desc.indexOf(id) >= 0 || r.desc.length >= TOPE_DESC) return false;
    r.desc.push(id); const p = c.puntos.find((q) => q.id === id); aviso(est, j, 'Descubres: ' + p.nombre); return true;
  }
  const sabe = (r, id) => !!r && Array.isArray(r.desc) && r.desc.indexOf(id) >= 0;
  const puntoCerca = (c, g, p, extra) => Math.hypot(g.x / T - (p.gx + 0.5), g.y / T - (p.gy + 0.5)) <= p.radio + (extra || 0);
  // Sitio de amarre efectivo. Plan B: si el amarre guardado ya no es agua libre, el barco vuelve al puerto de la dimensión (sin perder mejoras).
  function amarreEfectivo(est, j, dim, c) {
    const r = leerRec(est, j, dim); if (!r || !r.amarre) return null; const a = r.amarre; let m = null; try { m = G.mundo.mapa(a.mapa); } catch (e) { m = null; }
    if (m && m.mar && !G.mundo.solido(m, a.tx, a.ty)) return a;
    const pu = c.barco.puerto; if (!pu) return null;
    try { const mm = G.mundo.mapa(pu.mapa), an = G.mundo.ancla(mm, pu.ancla), w = escribirRec(est, j, dim); if (!w) return null; w.amarre = { mapa: mm.id, tx: an[0], ty: an[1] }; aviso(est, j, 'Tu barco ha vuelto al puerto'); return w.amarre; } catch (e) { return null; }
  }

  // ── subir y bajar: puertas ──
  // Antes de cruzar una puerta que va de tierra al mar: el barco debe estar amarrado ahí. (De mar a tierra siempre se puede.) → null | motivo
  function puedeCruzar(est, j, m, p) {
    const d = p && p.destino; if (!d || d.ancla === 'volver' || d.mapa === '@prof' || m.mar) return null;
    let dest = null; try { dest = G.mundo.mapa(d.mapa); } catch (e) { return null; } if (!dest || !dest.mar) return null;
    const dim = dimDe(d.mapa), c = cfgDe(dim); if (!c) return null;
    const am = amarreEfectivo(est, j, dim, c); if (!am) return 'Aún no tienes barco';
    let a; try { a = G.mundo.ancla(dest, d.ancla); } catch (e) { return null; }
    if (am.mapa !== dest.id || Math.max(Math.abs(am.tx - a[0]), Math.abs(am.ty - a[1])) > 3) { let nom = ''; try { nom = G.mundo.mapa(am.mapa).nombre; } catch (e) { nom = ''; } return 'Tu barco no está aquí: está amarrado en ' + (nom || 'otro muelle'); }
    return null;
  }
  // Tras cruzar una puerta (mapas ya cambiados): bajar del barco lo amarra donde estaba la puerta; subir lo pone en marcha.
  function alCruzar(est, j, mapaAntes, p) {
    const antes = esMar(mapaAntes), ahora = esMar(j.mapa); if (antes === ahora) return;
    if (antes) { const dim = dimDe(mapaAntes), c = cfgDe(dim); if (c && p) { const r = escribirRec(est, j, dim); if (r) { r.amarre = { mapa: mapaAntes, tx: p.x, ty: p.y }; aviso(est, j, 'Amarras el barco'); } } j.nav = undefined; delete j.nav; }
    else { j.nav = { acc: 0 }; aviso(est, j, 'Subes al barco'); }
  }

  // ── rumbo automático por rutas de datos ──
  function ptsRuta(c, r, desde) { const pts = r.puntos.map((q) => [q[0] * T + 8, q[1] * T + 8]); return desde === r.desde ? pts : pts.slice().reverse(); }
  function cancelar(est, j, texto) { if (j.nav && j.nav.rumbo) { j.nav.rumbo = null; if (texto) aviso(est, j, texto); return true; } return false; }
  // Opciones para la interfaz: rutas que salen del punto donde está el barco (hacia puntos ya descubiertos) y faros a los que se puede viajar desde aquí.
  function opciones(est, j) {
    const dim = dimJ(j), c = cfgDe(dim), out = { rutas: [], faros: [], enFaro: false }; if (!c || !navegando(j)) return out;
    const g = globalPx(c, j), r = leerRec(est, j, dim); if (!g) return out;
    const vmin = c.barco.velocidades[0], vmax = c.barco.velocidades[c.barco.velocidades.length - 1], sp = (n) => { let l = 0; for (let i = 1; i < n.puntos.length; i++) l += Math.hypot(n.puntos[i][0] - n.puntos[i - 1][0], n.puntos[i][1] - n.puntos[i - 1][1]) * T; return l; };
    c.rutas.forEach((ru) => [[ru.desde, ru.hasta], [ru.hasta, ru.desde]].forEach(([a, b]) => {
      const pa = c.puntos.find((q) => q.id === a), pb = c.puntos.find((q) => q.id === b);
      if (pa && pb && puntoCerca(c, g, pa) && sabe(r, a) && sabe(r, b)) out.rutas.push({ ruta: ru.id, hacia: b, nombre: pb.nombre, seg: Math.round(sp(ru) / vmax), segMax: Math.round(sp(ru) / vmin) });
    }));
    const aqui = c.puntos.find((q) => q.tipo === 'faro' && sabe(r, q.id) && puntoCerca(c, g, q));
    if (aqui) { out.enFaro = aqui.id; c.puntos.forEach((q) => { if (q.tipo === 'faro' && q.id !== aqui.id && sabe(r, q.id)) out.faros.push({ id: q.id, nombre: q.nombre }); }); }
    return out;
  }
  // Lo llama motor.moverJugador cada paso con las teclas (vx, vy): sin rumbo → null; con rumbo y alguna tecla → lo cancela; si no, devuelve el vector unitario hacia el siguiente punto de la ruta.
  function guiar(est, j, vx, vy, dt) {
    const R = j.nav && j.nav.rumbo; if (!R) return null;
    if (vx || vy) { cancelar(est, j, 'Rumbo cancelado'); return null; }
    const dim = dimJ(j), c = cfgDe(dim), g = c && navegando(j) ? globalPx(c, j) : null; if (!g) { j.nav.rumbo = null; return null; }
    const v = velocidad(est, j);
    for (let k = 0; k < 4 && R.i < R.pts.length; k++) { const q = R.pts[R.i]; if (Math.hypot(q[0] - g.x, q[1] - g.y) <= Math.max(3, v * dt * 1.5)) R.i++; else break; }
    if (R.i >= R.pts.length) { j.nav.rumbo = null; const p = c.puntos.find((q) => q.id === R.hacia); aviso(est, j, 'Llegas a ' + (p ? p.nombre : 'tu destino')); return null; }
    R.at += dt; if (R.at >= 0.5) { if (R.ult && Math.hypot(g.x - R.ult.x, g.y - R.ult.y) < v * R.at * 0.2) { cancelar(est, j, 'El barco se ha detenido'); return null; } R.ult = { x: g.x, y: g.y }; R.at = 0; }
    const q = R.pts[R.i], dx = q[0] - g.x, dy = q[1] - g.y, d = Math.hypot(dx, dy) || 1; return { vx: dx / d, vy: dy / d };
  }

  // ── eventos del mar: plan PURO por hash (nunca est.rnd), activación por cercanía, cobros guardados ──
  const planes = new Map();
  function pesoTotal(tipos) { return tipos.reduce((s, t) => s + (t.peso || 1), 0); }
  function plan(semilla, mapa, ventana, ev) { // → [{ id, tipo, ev, tx, ty }]; depende SOLO de (semilla, mapa, ventana, datos) y del agua del mapa
    const out = []; if (!ev || !ev.por_mapa || !ev.tipos.length || !mapa || !mapa.mar) return out;
    const tot = pesoTotal(ev.tipos), L = NAV.lado;
    for (let n = 0; n < ev.por_mapa; n++) {
      let r = G.hash(String(semilla >>> 0) + '|' + mapa.id + '|' + ventana + '|' + n + '|t') % tot, tp = ev.tipos[0]; for (const t of ev.tipos) { if (r < (t.peso || 1)) { tp = t; break; } r -= (t.peso || 1); }
      for (let i = 0; i < 24; i++) {
        const hx = G.hash(String(semilla >>> 0) + '|' + mapa.id + '|' + ventana + '|' + n + '|x' + i), hy = G.hash(String(semilla >>> 0) + '|' + mapa.id + '|' + ventana + '|' + n + '|y' + i), tx = 4 + (hx % (L - 8)), ty = 4 + (hy % (L - 8));
        let libre = true; for (let dy = -1; dy <= 1 && libre; dy++) for (let dx = -1; dx <= 1; dx++) if (G.mundo.solido(mapa, tx + dx, ty + dy) || mapa.porCasilla.has((tx + dx) + ',' + (ty + dy))) { libre = false; break; }
        if (libre && out.every((q) => Math.hypot(q.tx - tx, q.ty - ty) >= 8)) { out.push({ id: mapa.id + '#' + ventana + '#' + n, tipo: tp.tipo, ev: tp.id, tx, ty }); break; }
      }
    }
    return out;
  }
  function eventos(est, mapaId) { // eventos activos AHORA en un mapa de mar (cacheado por ventana)
    const dim = dimDe(mapaId), c = cfgDe(dim), m = G.mundo.mapas[mapaId]; if (!c || !m || !m.mar) return [];
    const v = Math.floor((est.reloj || 0) / c.eventos.ventana), k = est.semilla + '|' + mapaId + '|' + v; let p = planes.get(k);
    if (!p) { p = plan(est.semilla, m, v, c.eventos); planes.set(k, p); if (planes.size > 48) planes.delete(planes.keys().next().value); }
    return p;
  }
  function volverAlPuerto(est, j, c) {
    const g = globalPx(c, j), pu = c.puntos.filter((p) => p.tipo === 'puerto'); if (!g || !pu.length) return false;
    pu.sort((a, b) => Math.hypot(g.x / T - a.gx, g.y / T - a.gy) - Math.hypot(g.x / T - b.gx, g.y / T - b.gy)); const p = pu[0];
    j.mapa = p.mapa; j.x = p.tx * T + 8; j.y = p.ty * T + 14; j.moving = false; j.enPuerta = null; if (j.nav) j.nav.rumbo = null;
    G.motor.estadoMapa(est, p.mapa); G.motor.aparicion(est); G.motor.liberarDimensiones(est); aviso(est, j, 'La tormenta te devuelve a ' + p.nombre); return true;
  }
  function tocarEventos(est, j, dim, c) {
    const evs = eventos(est, j.mapa); if (!evs.length) return;
    const tx = j.x / T, ty = j.y / T, rad = c.eventos.radio, vistos = j.nav.vistos || (j.nav.vistos = {});
    for (const e of evs) {
      if (Math.hypot(e.tx + 0.5 - tx, e.ty + 0.5 - ty) > rad) continue;
      const def = c.eventos.tipos.find((t) => t.id === e.ev) || {}, txt = def.texto || e.tipo;
      if (e.tipo === 'cofre' || e.tipo === 'botella') {
        const r = leerRec(est, j, dim); if (r && r.cobros && r.cobros[e.id]) continue;
        const w = escribirRec(est, j, dim); if (!w) continue; w.cobros = w.cobros || {}; w.cobros[e.id] = 1;
        const ks = Object.keys(w.cobros).sort(); if (ks.length > TOPE_COBROS) ks.slice(0, ks.length - TOPE_COBROS).forEach((x) => { delete w.cobros[x]; });
        let extra = ''; if (def.brillos > 0 && G.tienda) { const b = G.tienda.ganar(j, def.brillos); if (b) extra = ' · +' + b + ' ✦'; }
        aviso(est, j, txt + ': ¡es tuyo!' + extra);
      } else if (e.tipo === 'tormenta') {
        if (vistos[e.id]) continue; vistos[e.id] = 1; const r = leerRec(est, j, dim), casco = r ? r.casco | 0 : 0;
        if (casco < (def.casco | 0)) { aviso(est, j, 'Tu casco no aguanta esta tormenta'); volverAlPuerto(est, j, c); return; }
        aviso(est, j, txt + ': tu casco aguanta');
      } else if (!vistos[e.id]) { vistos[e.id] = 1; aviso(est, j, txt); }
    }
  }
  // Tras mover al jugador local en un mapa de mar (cada ~0,25 s): despeja la niebla y descubre puntos con el catalejo, y toca los eventos cercanos.
  function tras(est, j, dt) {
    if (!navegando(j)) return; const nv = j.nav || (j.nav = { acc: 0 }); nv.acc += dt; if (nv.acc < 0.25) return; nv.acc = 0;
    const dim = dimJ(j), c = cfgDe(dim); if (!c) return; const g = globalPx(c, j); if (!g) return;
    const rec = leerRec(est, j, dim), gxt = g.x / T, gyt = g.y / T, rad = c.barco.vision[Math.min(rec ? rec.catalejo | 0 : 0, c.barco.vision.length - 1)];
    const w = escribirRec(est, j, dim); if (!w) return;
    despejar(w, gxt, gyt, rad);
    c.puntos.forEach((p) => { if (!p.oculto && !sabe(w, p.id) && Math.hypot(gxt - (p.gx + 0.5), gyt - (p.gy + 0.5)) <= rad) descubrir(est, j, p.id); });
    tocarEventos(est, j, dim, c);
  }

  // ── órdenes (registro de órdenes de F6): se validan contra el estado y funcionan igual en los dos móviles ──
  const O = G.motor && G.motor.ordenes;
  if (O) {
    O.registrar('nav.rumbo', {
      validar(est, j, o) {
        if (!navegando(j)) return 'Solo se puede fijar rumbo navegando'; const dim = dimJ(j), c = cfgDe(dim); if (!c) return 'Aquí no se navega';
        if (j.nav && j.nav.rumbo) return 'Ya llevas un rumbo'; const ru = c.rutas.find((q) => q.id === o.ruta); if (!ru || (o.hacia !== ru.desde && o.hacia !== ru.hasta)) return 'Ese rumbo no existe';
        const orig = c.puntos.find((q) => q.id === (o.hacia === ru.hasta ? ru.desde : ru.hasta)), dest = c.puntos.find((q) => q.id === o.hacia), r = leerRec(est, j, dim), g = globalPx(c, j);
        if (!orig || !dest || !g || !puntoCerca(c, g, orig)) return 'Hay que estar junto a ' + (orig ? orig.nombre : 'el punto de partida'); if (!sabe(r, orig.id) || !sabe(r, dest.id)) return 'Aún no conoces ese destino';
        return null;
      },
      aplicar(est, j, o) { const c = cfgDe(dimJ(j)), ru = c.rutas.find((q) => q.id === o.ruta), pts = ptsRuta(c, ru, o.hacia === ru.hasta ? ru.desde : ru.hasta); j.nav = j.nav || { acc: 0 }; j.nav.rumbo = { ruta: ru.id, hacia: o.hacia, pts, i: 1, at: 0, ult: null }; j.keys = { up: 0, down: 0, left: 0, right: 0 }; aviso(est, j, 'Rumbo fijado'); return { ruta: ru.id }; },
    });
    O.registrar('nav.parar', { validar(est, j) { return j.nav && j.nav.rumbo ? null : 'No llevas ningún rumbo'; }, aplicar(est, j) { cancelar(est, j, 'Rumbo cancelado'); return {}; } });
    O.registrar('nav.faro', {
      validar(est, j, o) {
        if (!navegando(j)) return 'Los faros se usan desde el mar'; const dim = dimJ(j), c = cfgDe(dim); if (!c) return 'Aquí no se navega';
        const g = globalPx(c, j), r = leerRec(est, j, dim), dest = c.puntos.find((q) => q.id === o.destino && q.tipo === 'faro');
        if (!dest || !sabe(r, dest.id)) return 'Ese faro aún no lo conoces'; if (!g) return 'Aquí no se navega';
        const aqui = c.puntos.find((q) => q.tipo === 'faro' && sabe(r, q.id) && puntoCerca(c, g, q)); if (!aqui) return 'Hay que estar junto a un faro que conozcas'; if (aqui.id === dest.id) return 'Ya estás en ese faro';
        return null;
      },
      aplicar(est, j, o) {   // gratuito e inmediato: el barco va con el jugador (es un modo suyo)
        const c = cfgDe(dimJ(j)), p = c.puntos.find((q) => q.id === o.destino);
        j.mapa = p.mapa; j.x = p.tx * T + 8; j.y = p.ty * T + 14; j.moving = false; j.enPuerta = null; j.keys = { up: 0, down: 0, left: 0, right: 0 }; if (j.nav) j.nav.rumbo = null;
        G.motor.estadoMapa(est, p.mapa); G.motor.aparicion(est); G.motor.liberarDimensiones(est); aviso(est, j, 'Viajas a ' + p.nombre); return { faro: p.id };
      },
    });
  }

  // ── red (mensaje v2): lo mínimo del barco para que el otro móvil lo dibuje igual ──
  function red(est, id) { // → null (no navega: el mensaje sigue siendo v1) | { c, v, k }
    const j = est.jugadores[id]; if (!j || !navegando(j)) return null; const b = barco(est, j); if (!b) return null;
    const o = { c: b.casco, v: b.velas }; if (Object.keys(b.cos).length) o.k = b.cos; return o;
  }
  function redLimpiar(n) { // valida lo recibido; null si no es válido
    if (!plano(n) || Object.keys(n).some((k) => k !== 'c' && k !== 'v' && k !== 'k')) return null;
    if (!ent(n.c) || n.c < 0 || n.c > NAV.maxNivel || !ent(n.v) || n.v < 0 || n.v > NAV.maxNivel) return null;
    const o = { casco: n.c, velas: n.v, cos: {} };
    if (n.k !== undefined) { if (!plano(n.k) || Object.keys(n.k).some((k) => ['nombre', 'velas', 'bandera', 'mascaron', 'cubierta'].indexOf(k) < 0)) return null; o.cos = cosOk(n.k, null); if (Object.keys(o.cos).length !== Object.keys(n.k).length) return null; }
    return o;
  }
  function aspecto(est, j) { // lo que hace falta para DIBUJAR el barco de un jugador (local: de su estado; remoto: de lo que mandó)
    if (j.remoto) return j.barcoRed || { casco: 0, velas: 0, cos: {} };
    const b = barco(est, j); return b ? { casco: b.casco, velas: b.velas, cos: b.cos } : { casco: 0, velas: 0, cos: {} };
  }

  // ── validación del mar de una dimensión contra sus mapas YA preparados (la usa mundo.validarDimension y tools/validar_mar.js) ──
  function validarMundo(dim, ms) {
    const c = cfgDe(dim), out = []; if (!c) { Object.values(ms).forEach((m) => { if (m.mar) out.push(m.id + ': es un mapa de mar pero la dimensión «' + dim + '» no tiene «navegacion»'); }); return out; }
    const L = NAV.lado, dirs = { norte: [-1, 0], sur: [1, 0], este: [0, 1], oeste: [0, -1] };
    Object.values(ms).forEach((m) => { if (m.mar && !c.pos[m.id]) out.push(m.id + ': es un mapa de mar que no está en el mosaico de «navegacion.mar»'); });
    c.mapas.forEach((fila, r) => fila.forEach((id, k) => {
      const m = ms[id]; if (!m) { out.push('mosaico: falta el mapa «' + id + '»'); return; }
      if (!m.mar) out.push(id + ': está en el mosaico del mar pero no lleva «mar: true»');
      if (m.W !== L || m.H !== L) out.push(id + ': los mapas del mosaico miden ' + L + '×' + L + ' (este mide ' + m.W + '×' + m.H + ')');
      Object.keys(dirs).forEach((lado) => {
        const [dr, dc] = dirs[lado], r2 = r + dr, c2 = k + dc, esp = r2 >= 0 && r2 < c.mapas.length && c2 >= 0 && c2 < fila.length ? c.mapas[r2][c2] : null, con = m.conexiones[lado];
        if (esp && (!con || con.mapa !== esp || (con.desplazamiento | 0) !== 0)) out.push(id + ': su borde ' + lado + ' debe ir a «' + esp + '» sin desplazamiento'); else if (!esp && con) out.push(id + ': su borde ' + lado + ' da al exterior del mosaico y no debe tener conexión');
      });
    }));
    const libre = (gx, gy) => { const col = Math.floor(gx / (L * T)), fil = Math.floor(gy / (L * T)); if (col < 0 || fil < 0 || fil >= c.mapas.length || col >= c.mapas[0].length) return false; const m = ms[c.mapas[fil][col]]; return !!m && !G.motor.bloqueado(m, gx - col * L * T, gy - fil * L * T); };
    c.puntos.forEach((p) => { const m = ms[p.mapa]; if (m && G.mundo.solido(m, p.tx, p.ty)) out.push('punto «' + p.id + '»: está sobre tierra (' + p.mapa + ' ' + p.tx + ',' + p.ty + ')'); });
    c.rutas.forEach((ru) => {   // se recorre cada tramo en pasos de 4 px con la misma regla de colisión del motor: ningún rumbo puede rozar tierra
      for (let i = 1; i < ru.puntos.length; i++) {
        const a = ru.puntos[i - 1], b = ru.puntos[i], dx = (b[0] - a[0]) * T, dy = (b[1] - a[1]) * T, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
        for (let s = 0; s <= n; s++) if (!libre(a[0] * T + 8 + dx * s / n, a[1] * T + 8 + dy * s / n)) { out.push('ruta «' + ru.id + '»: el tramo ' + i + ' pasa por tierra (cerca de ' + Math.round(a[0] + (b[0] - a[0]) * s / n) + ',' + Math.round(a[1] + (b[1] - a[1]) * s / n) + ')'); break; }
      }
    });
    const pu = c.barco.puerto; if (pu) { const m = ms[pu.mapa] || null; if (!m) out.push('barco.puerto: el mapa «' + pu.mapa + '» no existe'); else if (!m.anclas[pu.ancla]) out.push('barco.puerto: el mapa «' + pu.mapa + '» no tiene el ancla «' + pu.ancla + '»'); else if (!m.mar) out.push('barco.puerto: «' + pu.mapa + '» debe ser un mapa de mar (el barco amarra en el agua, junto al muelle)'); }
    return out;
  }

  G.navegacion = { VERSION, CELDA, CELDAS, NIEBLA_LEN, navegando, esMar, barco, velocidad, mejorar, cosmetica, amarrar, descubrir, marea, hora, globalPx, opciones, guiar, tras, plan, eventos, puedeCruzar, alCruzar, alRestaurar, limpiarRec, red, redLimpiar, aspecto, validarMundo, bitsDe, celdaDe, cancelar, cfgDe,
    sabe: (est, j, id) => { const dim = dimJ(j); return sabe(leerRec(est, j, dim), id); },
    niebla: (est, j) => { const dim = dimJ(j); return bitsDe(leerRec(est, j, dim)); },
    puntos: (est, j) => { const dim = dimJ(j), c = cfgDe(dim), r = leerRec(est, j, dim); return c ? c.puntos.filter((p) => sabe(r, p.id)) : []; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.navegacion;
})(typeof window !== 'undefined' ? window : globalThis);
