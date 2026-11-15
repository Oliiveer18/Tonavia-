// agentes.js — NÚCLEO del motor de ENTRENADORES AUTÓNOMOS (v2.324). PURO: sin DOM, sin Math.random, sin relojes de pared. Guía: docs/AGENTES.md.
// Qué es: una simulación por EVENTOS (no por cuadros). Cada entrenador duerme hasta su próxima decisión (a.sig) en una cola de prioridad; el coste depende de
// cuántas cosas PASAN, no de cuántos entrenadores hay ni de cuántos cuadros se pintan. Los combates son procesos que avanzan tick a tick con el reloj (el MISMO
// motor G.combate del jugador), así su coste se reparte y cualquiera puede repetirlos con la semilla.
// Estado: est.agentes = { v, sem, n (ticks simulados), acc, deuda, sb, pob: [entrenador…], bat: [combates en curso], cron: [crónica], cont } — JSON puro, con versión.
// Un entrenador tiene la MISMA forma de datos que un jugador (equipo, prog, vida, brillos, mochila, esferas): se le aplican G.nivel y G.tienda tal cual.
// Azar: cada entrenador tiene su propio hilo (semilla, índice, contador a.k). No toca est.rnd: el resto del juego no cambia ni un número.
// Mundo: el GRAFO de datos/mundo.json (pueblos y rutas). Un mapa sin dibujar sigue existiendo para ellos; si el mapa es real, src/agentes_cuerpo.js proyecta el cuerpo.
// F7 (Multiverso): una POBLACIÓN POR DIMENSIÓN. Tonavia conserva est.agentes (idéntico); las demás viven en est.dim[id].agentes con su propio grafo (datos de la dimensión, «entrenadores»), pools y entrenadores fijos.
//   Solo avanzan las dimensiones con algún jugador dentro; al volver se les aplica la PUESTA AL DÍA por diferencia de est.reloj (ag.rel) + el tiempo que el juego estuvo cerrado (ag.deuda). Contrato: docs/multiverso/14_ENTRENADORES_F7.md.
// Piezas: agentes_mente.js (memoria, relaciones, objetivos, planificador) · agentes_acciones.js (acciones y combates) · agentes_cuerpo.js (cuerpo 2D, hablar).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});
  const cargar = (n) => (G.DATOS && G.DATOS[n]) || (typeof require === 'function' ? require('../datos/' + n + '.json') : null);
  const D = cargar('agentes'), MUNDO = cargar('mundo');
  if (!D || !MUNDO || !G.COMBATE_DATOS) return;
  const AJ = D.ajustes, TPS = G.COMBATE_DATOS.TPS, DT = 1 / TPS, VERSION = 1, T = 16, esNum = Number.isFinite;
  const OFF = (() => { try { return typeof location !== 'undefined' && /[?&]agentes=0/.test(location.search || ''); } catch (e) { return false; } })();
  const cfg = { ACTIVO: D.activo !== false && !OFF, POBLACION: D.poblacion | 0 };

  // ── Azar reproducible por entrenador (hash de 32 bits; sin estado global) ──
  const mez = (h) => { h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
  const azarDe = (sem, i, k) => mez(mez((sem ^ Math.imul(i + 1, 0x9E3779B1)) >>> 0) ^ Math.imul(k + 1, 0x85EBCA77)) / 4294967296;
  const azar = (ag, a) => azarDe(ag.sem, a.i, a.k++);

  // ── El mundo que ven los entrenadores: grafo de pueblos y rutas con sus servicios (sale de los datos, se calcula una vez) ──
  let W = null;
  const WD = new Map();   // F7: grafo de cada dimensión (se reconstruye si cambia su definición)
  const OPUESTO = { norte: 'sur', sur: 'norte', este: 'oeste', oeste: 'este' };
  const dimDe = (id) => { const i = typeof id === 'string' ? id.indexOf('/') : -1; return i > 0 ? id.slice(0, i) : undefined; };   // «chuches/villa» → 'chuches'; sin prefijo = Tonavia (undefined)
  const defDim = (dim) => (dim && G.dimensiones && G.dimensiones.entrenadores ? G.dimensiones.entrenadores(dim) : null);   // definición de «entrenadores» de una dimensión (o null)
  function mundoAg(dim) {
    if (dim && dim !== 'tonavia') {
      const def = defDim(dim); if (!def || !def.grafo) return null; const c = WD.get(dim); if (c && c.def === def) return c.w;
      const w = construir(def.grafo.regiones || {}, def.grafo.mapas.filter((m) => m.tipo === 'pueblo' || m.tipo === 'ruta'), true); WD.set(dim, { def, w }); return w;
    }
    if (W) return W; W = construir(MUNDO.regiones, MUNDO.mapas, false); return W;
  }
  function construir(reg, mapasG, esDim) {
    const nodos = {}, ids = [], lineas = G.LINEAS || [];
    const especies = (el) => lineas.filter((L) => L.rarity !== 'legendaria' && L.elements.indexOf(el) >= 0).map((L) => ({ f: L.formas[0].id, rar: L.rarity }));
    mapasG.forEach((m) => {
      if (m.tipo !== 'pueblo' && m.tipo !== 'ruta') return;
      // Tonavia: los servicios salen del mapa dibujado si existe (como siempre). Dimensión: SOLO de sus datos (si no, la simulación dependería de qué mapas están cargados en ese momento); `real` es en vivo.
      const r = reg[m.region] || {}, mp = esDim ? null : (G.mundo && G.mundo.mapas && G.mundo.mapas[m.id]) || null, puerta = (id) => (m.puertas || []).some((p) => p.id === id);
      const salvajes = m.tipo === 'ruta' && r.elemento ? especies(r.elemento) : [], agua = m.pesca !== undefined ? m.pesca : r.elemento === 'agua';
      const nodo = { id: m.id, tipo: m.tipo, region: m.region, W: m.ancho || 48, H: m.alto || 36, real: !!mp, pueblo: m.tipo === 'pueblo', cura: m.tipo === 'pueblo' && puerta('centro_pc'), tienda: m.tipo === 'pueblo' && puerta('tienda'),
        pesca: mp ? !!(mp.pesca && mp.pesca.length) : agua, honda: !mp && agua, salvajes, salvaje: salvajes.length > 0, vecinos: [] };
      if (esDim) Object.defineProperty(nodo, 'real', { get() { return !!(G.mundo && G.mundo.mapas && G.mundo.mapas[m.id]); }, enumerable: true });
      nodos[m.id] = nodo; ids.push(m.id);
    });
    const dist = {}, sig = {}, medio = (n, lado) => ((lado === 'este' || lado === 'oeste' ? n.W : n.H) * T) / 2 / AJ.velocidad;
    ids.forEach((a) => { dist[a] = {}; sig[a] = {}; ids.forEach((b) => { dist[a][b] = a === b ? 0 : Infinity; sig[a][b] = a === b ? a : null; }); });
    mapasG.forEach((m) => { const n = nodos[m.id]; if (!n) return; Object.keys(m.conexiones || {}).forEach((lado) => { const v = nodos[m.conexiones[lado]]; if (!v) return; n.vecinos.push({ lado, id: v.id }); dist[n.id][v.id] = medio(n, lado) + medio(v, OPUESTO[lado]); sig[n.id][v.id] = v.id; }); });
    ids.forEach((k) => ids.forEach((a) => ids.forEach((b) => { const d = dist[a][k] + dist[k][b]; if (d < dist[a][b] - 1e-9) { dist[a][b] = d; sig[a][b] = sig[a][k]; } })));   // Floyd-Warshall (15 nodos)
    const cerca = {}; ['cura', 'tienda', 'pesca', 'salvaje', 'pueblo'].forEach((s) => { cerca[s] = {}; ids.forEach((a) => { let m = null; ids.forEach((b) => { if (nodos[b][s] && (m === null || dist[a][b] < dist[a][m])) m = b; }); cerca[s][a] = m; }); });
    const pez = G.PECES ? Object.keys(G.PECES).filter((k) => !G.PECES[k].oculto && G.PECES[k].zona <= 1) : [], pPez = pez.length && G.tienda ? Math.round(pez.reduce((s, k) => s + G.tienda.precioPez(k, true) * G.PECES[k].peso, 0) / pez.reduce((s, k) => s + G.PECES[k].peso, 0)) : 6;
    const nomReg = (id) => (reg[id] && reg[id].nombre) || id.charAt(0).toUpperCase() + id.slice(1);
    const nombre = (id) => { const n = nodos[id], mp = G.mundo && G.mundo.mapas && G.mundo.mapas[id]; if (mp && mp.nombre) return mp.nombre; if (!n) return id; return n.tipo === 'ruta' ? 'la ruta de ' + nomReg(n.region) : 'el pueblo de ' + nomReg(n.region); };
    return { nodos, ids, dist, sig, cerca, pPez, nombre, pueblos: ids.filter((i) => nodos[i].pueblo), regiones: reg };
  }

  // ── Montículo binario (mínimo por tiempo; a igualdad, por índice de entrenador: orden total y reproducible) ──
  const antes = (x, y) => x.t < y.t || (x.t === y.t && x.i < y.i);
  function meter(h, e) { let i = h.length; h.push(e); while (i > 0) { const p = (i - 1) >> 1; if (!antes(e, h[p])) break; h[i] = h[p]; i = p; } h[i] = e; }
  function sacar(h) { const top = h[0], e = h.pop(); const n = h.length; if (n) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && antes(h[c + 1], h[c])) c++; if (!antes(h[c], e)) break; h[i] = h[c]; i = c; } h[i] = e; } return top; }

  // ── Estado en marcha (no se guarda: se reconstruye del estado): cola, quién está en cada lugar y los combates en curso ──
  const RT = new WeakMap();
  function rt(ag) {
    let r = RT.get(ag); if (r) return r;
    r = { heap: [], sello: [], en: {}, bat: new Map() }; RT.set(ag, r);
    ag.pob.forEach((a) => { (r.en[a.lug] = r.en[a.lug] || []).push(a.i); r.sello[a.i] = 1; if (esNum(a.sig)) meter(r.heap, { t: a.sig, i: a.i, s: 1 }); });
    ag.bat.forEach((b) => { const c = G.combate.nuevo(b.sem, b.eq, b.k === 'd' ? { campo: [1, 1], duelo: true } : { campo: [1, 1] }); for (let k = ag.n - b.n0; k > 0 && !c.fin; k--) G.combate.paso(c, []); r.bat.set(b.id, c); });   // un combate a medias se REPITE desde su semilla hasta el tick actual
    return r;
  }
  const ahora = (ag) => ag.n * DT;
  function programar(ag, a, t) { const r = rt(ag); a.sig = t; r.sello[a.i] = (r.sello[a.i] | 0) + 1; meter(r.heap, { t, i: a.i, s: r.sello[a.i] }); }
  function suspender(ag, a) { const r = rt(ag); a.sig = null; r.sello[a.i] = (r.sello[a.i] | 0) + 1; }   // espera a que otro proceso (un combate) lo despierte
  function mover(ag, a, lug) {   // cambia de nodo y mantiene ordenada la lista de presentes (orden = índice: igual tras guardar y cargar)
    const r = rt(ag), de = r.en[a.lug] || [], q = de.indexOf(a.i); if (q >= 0) de.splice(q, 1);
    const a2 = (r.en[lug] = r.en[lug] || []); let lo = 0, hi = a2.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a2[m] < a.i) lo = m + 1; else hi = m; } a2.splice(lo, 0, a.i); a.lug = lug;
  }
  const presentes = (ag, lug) => rt(ag).en[lug] || [];

  // ── Criaturas de un entrenador (misma forma que j.prog / j.vida del jugador) ──
  const ST = new Map();
  function stats(f, nv) { const k = f + '|' + nv; let s = ST.get(k); if (!s) { s = G.combate.statsDe({ forma: f, nivel: nv }); ST.set(k, s); } return s; }
  const nivelDe = (a, f) => G.nivel.nivelDeEspecie(a, f);
  const hpMax = (a, f) => stats(f, nivelDe(a, f)).hpMax;
  const hp = (a, f) => (a.vida && typeof a.vida[f] === 'number' ? Math.min(a.vida[f], hpMax(a, f)) : hpMax(a, f));
  function salud(a) { let s = 0, m = 0; a.equipo.forEach((f) => { s += hp(a, f); m += hpMax(a, f); }); return m ? s / m : 0; }
  const vivas = (a) => a.equipo.filter((f) => hp(a, f) > 0);
  const nivelMax = (a) => a.equipo.reduce((m, f) => Math.max(m, nivelDe(a, f)), 1);

  // ── Nacimiento: todo sale de la semilla de la partida y de los datos (nombres, rasgos, ambición, pueblo natal, primera criatura) ──
  function ambicionPara(per, excluir, ruido, pesos) {   // F7: `pesos` (opcional, de la dimensión) multiplica la puntuación de cada ambición; 0 la excluye. Sin pesos, idéntico a siempre
    let mejor = null, mp = -1; Object.keys(D.ambiciones).forEach((k, n) => { if (excluir && excluir[k]) return; if (pesos && pesos[k] === 0) return; const af = D.ambiciones[k].afin || {}; let p = 0; Object.keys(af).forEach((r) => { p += af[r] * (per[r] || 0); }); p += ruido(n) * 0.35; if (pesos && pesos[k] !== undefined) p *= pesos[k]; if (p > mp) { mp = p; mejor = k; } });
    return mejor;
  }
  const POOL = new Map();   // F7: nombres, frases y pesos de ambición de una dimensión (por encima de los globales de datos/agentes.json)
  function poolDe(dim) {
    const def = dim && dim !== 'tonavia' ? defDim(dim) : null; if (!def) return { nombres: D.nombres, frases: D.frases, amb: null };
    const c = POOL.get(dim); if (c && c.def === def) return c.p;
    const p = { nombres: def.nombres && def.nombres.length ? def.nombres : D.nombres, frases: def.frases ? Object.assign({}, D.frases, def.frases) : D.frases, amb: def.ambiciones || null }; POOL.set(dim, { def, p }); return p;
  }
  function nacer(ag, i) {
    const w = mundoAg(ag.dim), pl = poolDe(ag.dim), a = { i, id: 'a' + i, k: 0 }, r = () => azar(ag, a), nm = pl.nombres, off = ag.sem % nm.length;
    a.nom = nm[(i * (nm.length % 7 ? 7 : 1) + off) % nm.length] + (i >= nm.length ? ' ' + (Math.floor(i / nm.length) + 1) : '');   // F7: con un pool cuya longitud es múltiplo de 7 el paso 7 repetiría el mismo nombre (48 nombres: igual que siempre)
    a.asp = Math.floor(r() * AJ.aspectos); a.casa = w.pueblos[Math.floor(r() * w.pueblos.length)]; a.lug = a.casa; a.poi = 'plaza';
    a.per = {}; D.rasgos.forEach((k) => { a.per[k] = Math.round(r() * 100) / 100; });
    const ru = D.rasgos.map(() => r()); a.amb = ambicionPara(a.per, null, (n) => ru[n % ru.length], pl.amb); a.etapa = 0; a.frus = 0; a.hechas = {};
    const el = (w.regiones[w.nodos[a.casa].region] || {}).elemento, com = (G.LINEAS || []).filter((L) => L.rarity === 'comun'), suyas = com.filter((L) => L.elements[0] === el), pool = suyas.length ? suyas : com, f = pool[Math.floor(r() * pool.length)].formas[0].id;
    a.equipo = [f]; a.pos = { [f]: 1 }; a.prog = { [f]: { xp: G.nivel.xpPara(1 + Math.floor(r() * r() * 7)) } }; a.brillos = G.tienda.INICIO; a.esferas = 5;
    a.pres = 1000; a.vis = { [a.casa]: 1 }; a.mem = []; a.rel = {}; a.obj = null; a.plan = []; a.paso = null; a.veto = {}; a.sac = {}; a.te = -1e6; a.h = {};
    a.sig = Math.round(r() * 400) / 20;   // despiertan escalonados en los primeros 20 s
    return a;
  }
  function fijar(ag, a, f) {   // F7: un entrenador FIJO de la dimensión: nombre, casa, equipo (con nivel), ambición, aspecto y Brillos prefijados; el resto (carácter, memoria, relaciones) nace como el de cualquiera y evoluciona igual
    a.nom = f.nombre; a.fijo = 1;
    if (f.casa) { a.casa = f.casa; a.lug = f.casa; a.vis = { [f.casa]: 1 }; }
    a.equipo = f.equipo.map((q) => q.forma); a.pos = {}; a.prog = {}; f.equipo.forEach((q) => { a.pos[q.forma] = 1; a.prog[q.forma] = { xp: G.nivel.xpPara(q.nivel) }; });
    if (f.ambicion) { a.amb = f.ambicion; a.etapa = 0; } if (f.aspecto !== undefined) a.asp = f.aspecto; if (f.brillos !== undefined) a.brillos = f.brillos;
  }
  function crear(semilla, n, dim) {
    const ag = { v: VERSION, sem: semilla >>> 0, n: 0, acc: 0, deuda: 0, sb: 0, pob: [], bat: [], cron: [], cont: {} };
    const def = dim && dim !== 'tonavia' ? defDim(dim) : null, fijos = def && def.fijos ? def.fijos : [];
    if (def) { ag.dim = dim; ag.rel = 0; }
    n = n === undefined ? (def ? fijos.length + (def.poblacion | 0) : cfg.POBLACION) : n; for (let i = 0; i < n; i++) { const a = nacer(ag, i); if (i < fijos.length) fijar(ag, a, fijos[i]); ag.pob.push(a); }
    return ag;
  }
  const renombrados = new WeakSet();   // v2.332: las partidas guardadas conservan el nombre con el que nació cada entrenador; datos/agentes.json › renombres lo cambia al cargar
  const VALIDAS = new WeakSet();   // F7: poblaciones de dimensión ya comprobadas (una partida cargada trae est.dim[id].agentes sin validar)
  const hashTxt = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; };
  function de(est, dim) {   // población EXISTENTE de una dimensión (sin crearla) o null. Una sección de una dimensión que este juego no define se deja tal cual (jamás se borra); si la define y está rota, se descarta entera y la población vuelve a nacer
    if (!dim || dim === 'tonavia') return est.agentes || null;
    const sec = est.dim && est.dim[dim]; if (!sec || typeof sec !== 'object' || !sec.agentes || !defDim(dim)) return null; const ag = sec.agentes;
    if (VALIDAS.has(ag)) return ag;
    const d = migrar(ag); if (d && valido(est, d, dim)) { if (!esNum(d.deuda) || d.deuda < 0) d.deuda = 0; VALIDAS.add(d); return d; }
    delete sec.agentes; return null;
  }
  function asegurarDim(est, dim) {
    if (!defDim(dim) || !mundoAg(dim)) return null; let ag = de(est, dim); if (ag) return ag;
    if (!est.dim) est.dim = {}; const sec = est.dim[dim] && typeof est.dim[dim] === 'object' && !Array.isArray(est.dim[dim]) ? est.dim[dim] : (est.dim[dim] = { v: 1 }); if (!Number.isInteger(sec.v)) sec.v = 1;
    ag = crear(mez((est.semilla ^ hashTxt(dim)) >>> 0), undefined, dim); ag.rel = esNum(est.reloj) ? est.reloj : 0; sec.agentes = ag; VALIDAS.add(ag); return ag;
  }
  function asegurar(est, dim) { if (dim && dim !== 'tonavia') return asegurarDim(est, dim); if (!est.agentes) est.agentes = crear(est.semilla); const ag = est.agentes; if (D.renombres && !renombrados.has(ag)) { renombrados.add(ag); (ag.pob || []).forEach((a) => { if (D.renombres[a.nom]) a.nom = D.renombres[a.nom]; }); } return ag; }
  function cron(ag, t, tipo, a, b, lug, x) { ag.cron.push([Math.round(t), tipo, a || '', b || '', lug || '', x === undefined ? '' : x]); if (ag.cron.length > AJ.cronica) ag.cron.shift(); ag.cont[tipo] = (ag.cont[tipo] | 0) + 1; }

  // ── Avance: tick fijo (el del combate). 1) despiertan los que tocan, en orden (tiempo, índice); 2) cada combate en curso da un paso ──
  function tick(est, ag, r) {
    ag.n++; const t = ag.n * DT, h = r.heap; let c = 0;
    while (h.length && h[0].t <= t && c < AJ.eventosPorTick) { const e = sacar(h); if (e.s !== r.sello[e.i]) continue; c++; A.mente.despertar(est, ag, ag.pob[e.i], t); }
    if (ag.bat.length) A.acciones.combates(est, ag, r, t);
  }
  function avanzar(est, dt) {
    if (!cfg.ACTIVO || !A.mente || !A.acciones || !(dt > 0)) return; const ag = asegurar(est), r = rt(ag); A._ag = ag; A._est = est;   /* v2.335: contexto para reservar casillas (no es estado) */
    ag.acc += dt; const k0 = Math.floor(ag.acc / DT + 1e-7); ag.acc = Math.max(0, ag.acc - k0 * DT); for (let i = 0; i < k0; i++) tick(est, ag, r);   // nº de ticks por división (no por restas): un salto grande de tiempo da los mismos ticks que muchos pequeños
    if (ag.par && A.trato) A.trato.vigilar(est, ag);   // v2.325: entrenadores parados por un jugador (hablar o duelo): se sueltan solos si el jugador se va
    if (ag.deuda > 0) { const k = Math.min(AJ.ticksDeudaPorCuadro, Math.ceil(ag.deuda / DT)); for (let i = 0; i < k; i++) tick(est, ag, r); ag.deuda = Math.max(0, ag.deuda - k * DT); }   // tiempo atrasado (partida cargada): se paga poco a poco, sin tirones
    avanzarDims(est, dt, ag);
  }
  // F7: dimensiones ACTIVAS = las que tienen algún jugador dentro y definen «entrenadores» (orden alfabético: reproducible). Tonavia se simula siempre, como hasta ahora.
  function activas(est) {
    const out = []; Object.keys(est.jugadores || {}).forEach((id) => { const d = dimDe(est.jugadores[id] && est.jugadores[id].mapa); if (d && d !== 'tonavia' && out.indexOf(d) < 0 && defDim(d)) out.push(d); }); return out.sort();
  }
  // Las dormidas no avanzan. Al volver a tener a alguien dentro se les paga de golpe el tiempo que pasó (est.reloj - ag.rel) más el que el juego estuvo cerrado (ag.deuda), con el tope alDiaMax: PUESTA AL DÍA. Solo depende del estado: dos clientes con el mismo est dan lo mismo.
  function avanzarDims(est, dt, agTon) {
    const act = activas(est); if (!act.length) return;
    act.forEach((dim) => {
      const ag = asegurar(est, dim); if (!ag) return; const r = rt(ag); A._ag = ag; A._est = est;
      let extra = ag.deuda > 0 ? ag.deuda : 0; ag.deuda = 0;
      if (esNum(est.reloj)) { const hueco = est.reloj - dt - ag.rel; if (hueco > 1e-6) extra += hueco; ag.rel = est.reloj; }
      extra = Math.min(AJ.alDiaMax, extra); if (extra > 0) ag.cont.alDia = (ag.cont.alDia | 0) + 1;
      ag.acc += dt + extra; const k0 = Math.floor(ag.acc / DT + 1e-7); ag.acc = Math.max(0, ag.acc - k0 * DT); for (let i = 0; i < k0; i++) tick(est, ag, r);
      if (ag.par && A.trato) A.trato.vigilar(est, ag);
    });
    A._ag = agTon; A._est = est;
  }
  // el tiempo que el juego estuvo cerrado entra como «deuda» (con tope): el mundo siguió su vida. Es la única entrada de reloj de pared y la pone la interfaz.
  function ponerAlDia(est, s) { if (!cfg.ACTIVO || !(s > 0)) return 0; const ag = asegurar(est); ag.deuda = Math.min(AJ.alDiaMax, (ag.deuda || 0) + s);
    const r = rt(ag); for (let k = Math.ceil(ag.deuda / DT - 1e-7); k > 0; k--) tick(est, ag, r); ag.deuda = 0;
    Object.keys(est.dim || {}).forEach((dim) => { const g = de(est, dim); if (g) g.deuda = Math.min(AJ.alDiaMax, (g.deuda || 0) + s); });   // F7: las dimensiones con población guardada se ponen al día cuando alguien vuelva a entrar
    return 0; }   // v2.326: el tiempo atrasado se paga de golpe al cargar (≈0,7 s, antes de pintar). Pagado a poco a poco, los cuerpos corrían ~30 veces más deprisa durante ~75 s

  // ── Guardado (JSON con versión). Un bloque roto se descarta ENTERO y la población vuelve a nacer. La población lleva SU semilla (ag.sem): hoy el juego estrena
  //    semilla del mundo en cada sesión (game.js) y los entrenadores tienen que seguir siendo los mismos ──
  function serializar(est) { return est.agentes ? JSON.parse(JSON.stringify(est.agentes)) : undefined; }
  function migrar(d) { if (!d || typeof d !== 'object' || !Number.isInteger(d.v) || d.v < 1 || d.v > VERSION) return null; return d; }   // migraciones futuras: if (d.v === 1) d = { …, v: 2 }
  // F8 · límites de VALIDACIÓN por población (protegen de datos hostiles o desbocados; NO son el presupuesto de guardado). Medido: ~0,5 KB por entrenador al nacer y ~4,3 KB tras horas de juego (se estabiliza: 64 ≈ 260 KB, 128 ≈ 500 KB).
  // El tope de bytes es POR ENTRENADOR (16 KB, ≈ 4× lo medido) más una base: una población válida de cualquier tamaño dentro de `pob` cabe siempre; la esquema de dimensión hoy admite 64 (48 + 16 fijos).
  const LIM = { pob: Math.max(128, cfg.POBLACION), bat: 256, cron: 800, mem: 100, plan: 64, rel: 100, base: 65536, porEnt: 16384 };
  function valido(est, d, dim) {   // dim: undefined = Tonavia (est.agentes); id = población de esa dimensión (est.dim[id].agentes)
    const w = mundoAg(dim), obj = (o) => o && typeof o === 'object' && !Array.isArray(o);
    if (d && typeof d === 'object') { let n = -1; try { n = JSON.stringify(d).length; } catch (e) { return false; } if (n > LIM.base + LIM.porEnt * (Array.isArray(d.pob) ? d.pob.length : 0)) return false; }   // F8: una población enorme (hostil o desbocada) se descarta entera, nunca se acepta
    if (!w || !d || (dim ? d.dim !== dim || !esNum(d.rel) : d.dim !== undefined) || !Number.isInteger(d.sem) || d.sem < 0 || !Number.isInteger(d.n) || d.n < 0 || !esNum(d.acc) || !Array.isArray(d.pob) || d.pob.length > LIM.pob || !Array.isArray(d.bat) || d.bat.length > LIM.bat || !Array.isArray(d.cron) || d.cron.length > Math.max(LIM.cron, 4 * AJ.cronica) || !obj(d.cont)) return false;   // F8: topes de tamaño (una población válida los cumple con mucho margen; ver docs/multiverso/16_RED_LIMITES_F8.md)
    if (d.par !== undefined && !(obj(d.par) && Object.keys(d.par).every((k) => { const p = d.par[k]; return d.pob[k] && obj(p) && esNum(p.t0) && esNum(p.tu) && esNum(p.x) && esNum(p.y) && typeof p.j === 'string' && typeof p.dir === 'string' && (p.sig === null || esNum(p.sig)); }))) return false;   // v2.325: pausas por trato con un jugador
    const okA = d.pob.every((a, i) => obj(a) && a.i === i && typeof a.nom === 'string' && w.nodos[a.lug] && w.nodos[a.casa] && D.ambiciones[a.amb] && obj(a.per) && Array.isArray(a.equipo) && a.equipo.length > 0 && a.equipo.length <= 6 && a.equipo.every((f) => G.FORMAS && G.FORMAS[f]) && obj(a.prog) && obj(a.pos) && obj(a.rel) && obj(a.vis) && Array.isArray(a.mem) && a.mem.length <= Math.max(LIM.mem, 4 * AJ.memoria) && Array.isArray(a.plan) && a.plan.length <= LIM.plan && Object.keys(a.rel).length <= Math.max(LIM.rel, 4 * AJ.relaciones)
      && Number.isInteger(a.brillos) && a.brillos >= 0 && Number.isInteger(a.esferas) && a.esferas >= 0 && Number.isInteger(a.k) && esNum(a.pres) && (a.sig === null || esNum(a.sig)) && (!a.vida || obj(a.vida)) && (!a.mochila || obj(a.mochila)));
    if (!okA) return false;
    return d.bat.every((b) => obj(b) && Number.isInteger(b.id) && Number.isInteger(b.n0) && b.n0 <= d.n && d.n - b.n0 < TPS * 200 && d.pob[b.a] && (b.b === -1 || d.pob[b.b]) && Array.isArray(b.eq) && b.eq.length === 2 && b.eq.every((e) => Array.isArray(e) && e.length > 0 && e.every((u) => obj(u) && G.FORMAS[u.forma])));
  }
  function restaurarDim(est, dim, d0) {   // F8 · red: el invitado adopta la población de una DIMENSIÓN que manda el anfitrión (misma validación que un guardado; conserva el resto de la sección est.dim[dim])
    if (!dim || dim === 'tonavia' || !defDim(dim) || !mundoAg(dim)) return false; const d = migrar(d0); if (!d || !valido(est, d, dim)) return false;
    if (!est.dim) est.dim = {}; const sec = est.dim[dim] && typeof est.dim[dim] === 'object' && !Array.isArray(est.dim[dim]) ? est.dim[dim] : (est.dim[dim] = { v: 1 }); if (!Number.isInteger(sec.v)) sec.v = 1; if (sec.v > 1) return false;   // sección de una versión futura: ni se lee ni se pisa
    const ag = JSON.parse(JSON.stringify(d)); ag.deuda = 0; sec.agentes = ag; VALIDAS.add(ag); return true;
  }
  function restaurar(est, d0) { const d = migrar(d0); if (!d || !valido(est, d)) return false; est.agentes = JSON.parse(JSON.stringify(d)); if (!esNum(est.agentes.deuda)) est.agentes.deuda = 0; return true; }
  const hash = (est, dim) => { const s = JSON.stringify(de(est, dim) || null); let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(16); };   // huella del estado (para comparar dos móviles o un servidor)

  // ── Diagnóstico (solo lee): resumen de la población, ficha de un entrenador y crónica ──
  function porId(est, id, dim) { const ag = de(est, dim); if (!ag) return null; return typeof id === 'number' ? ag.pob[id] : ag.pob.find((a) => a.id === id || a.nom === id) || null; }
  function resumen(est, dim) {
    const ag = asegurar(est, dim), p = ag.pob, n = p.length || 1, suma = (f) => p.reduce((s, a) => s + f(a), 0), amb = {}, lug = {}, obj = {};
    p.forEach((a) => { amb[a.amb] = (amb[a.amb] | 0) + 1; lug[a.lug] = (lug[a.lug] | 0) + 1; const o = a.obj ? a.obj.t : '-'; obj[o] = (obj[o] | 0) + 1; });
    const vin = {}; if (A.mente) p.forEach((a) => Object.keys(a.rel).forEach((k) => { const v = A.mente.vinculo(a.rel[k]); vin[v] = (vin[v] | 0) + 1; }));
    return { t: Math.round(ahora(ag)), poblacion: p.length, combatesEnCurso: ag.bat.length, nivelMedio: +(suma(nivelMax) / n).toFixed(2), equipoMedio: +(suma((a) => a.equipo.length) / n).toFixed(2), especiesMedia: +(suma((a) => Object.keys(a.pos).length) / n).toFixed(2), brillos: suma((a) => a.brillos), recuerdos: suma((a) => a.mem.length), relaciones: suma((a) => Object.keys(a.rel).length), vinculos: vin, ambiciones: amb, objetivos: obj, lugares: lug, sucesos: Object.assign({}, ag.cont) };
  }
  function ficha(est, id, dim) {
    const a = porId(est, id, dim), ag = de(est, dim); if (!a) return null; const w = mundoAg(dim), nom = (k) => (k[0] === 'a' && ag.pob[+k.slice(1)] ? ag.pob[+k.slice(1)].nom : k);
    return { id: a.id, nombre: a.nom, casa: a.casa, lugar: a.lug, ambicion: a.amb + ' (etapa ' + a.etapa + '/' + D.ambiciones[a.amb].hitos.length + ')', frustracion: +a.frus.toFixed(2), personalidad: a.per, prestigio: Math.round(a.pres), brillos: a.brillos, esferas: a.esferas, mochila: a.mochila || {},
      equipo: a.equipo.map((f) => G.CREATURES[f].name + ' nv' + nivelDe(a, f) + ' ' + Math.round(hp(a, f)) + '/' + hpMax(a, f)), especies: Object.keys(a.pos).length, mapas: Object.keys(a.vis).length,
      objetivo: a.obj ? a.obj.t + (a.obj.d ? ' → ' + a.obj.d : '') + (a.obj.q ? ' (' + nom(a.obj.q) + ')' : '') : null, paso: a.paso ? a.paso.a + (a.paso.h ? ' → ' + a.paso.h : '') : null, plan: a.plan.map((p) => p.a + (p.d ? ':' + p.d : '')),
      recuerdos: a.mem.map((e) => e[0] + 's ' + e[1] + (e[2] ? ' ' + nom(e[2]) : '') + (e[3] ? ' @' + e[3] : '')), relaciones: Object.keys(a.rel).map((k) => nom(k) + ': ' + (A.mente ? A.mente.vinculo(a.rel[k]) : '') + ' (afinidad ' + Math.round(a.rel[k].af) + ', respeto ' + Math.round(a.rel[k].re) + ', duelos ' + a.rel[k].du + ')'), historial: a.h, donde: w.nombre(a.lug) };
  }
  function cronica(est, n, dim) { const ag = de(est, dim); if (!ag) return []; const nom = (k) => (k && k[0] === 'a' && ag.pob[+k.slice(1)] ? ag.pob[+k.slice(1)].nom : k); return ag.cron.slice(-(n || 20)).map((e) => e[0] + 's · ' + e[1] + ' · ' + nom(e[2]) + (e[3] ? ' / ' + nom(e[3]) : '') + (e[4] ? ' @' + e[4] : '') + (e[5] !== '' ? ' · ' + e[5] : '')); }

  const A = G.agentes = { VERSION, D, AJ, cfg, DT, TPS, mez, azar, azarDe, W: mundoAg, Wn: (nodo) => mundoAg(dimDe(nodo)), dimDe, de, defDim, restaurarDim, valido, LIM, activas, poolDe, frases: (ag) => poolDe(ag && ag.dim).frases, nodoDe: (a) => { const w = a && mundoAg(dimDe(a.lug)), n = w && w.nodos[a.lug]; return n ? { id: n.id, region: n.region } : null; }, rt, ahora, programar, suspender, mover, presentes, stats, nivelDe, hpMax, hp, salud, vivas, nivelMax, ambicionPara, crear, asegurar, cron, avanzar, ponerAlDia, serializar, restaurar, migrar, hash, porId, resumen, ficha, cronica, mente: null, acciones: null, cuerpo: null, trato: null, red: null };

  // ── Gancho en el motor: la simulación avanza con el paso de las criaturas (lo llaman tanto el bucle del juego como motor.avanzar) ──
  if (G.motor) { const criaturas0 = G.motor.moverCriaturas; G.motor.moverCriaturas = function (est, dt) { const r = criaturas0.call(G.motor, est, dt); avanzar(est, dt); return r; }; }
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
