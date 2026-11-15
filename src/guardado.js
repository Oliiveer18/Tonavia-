// guardado.js — v2.352 (Multiverso F2: formato v2 por secciones de dimensión + migración v1→v2 + recuperación de la copia). Antes v2.189 (1.3f): guardado de partida. Estado serializable y CON VERSIÓN (norma «listo para online»): el mismo formato sirve para el móvil hoy y para un servidor mañana.
// Puro salvo leer/escribir/borrar (localStorage, con try/catch: sin almacenamiento el juego sigue). Lo que se guarda: por jugador, mapa, posición, dirección y peces pescados. Las criaturas salen de la semilla; la pesca en curso no se guarda.
(function (root) {
  'use strict';
  const G = root.G, T = 16, VERSION = 2, SECCION_TONAVIA = 2, SECCION_BASE = 1, CLAVE = 'criaturas_partida', CLAVE_BAK = CLAVE + '_bak', CLAVE_PRE = CLAVE + '_premig', CLAVE_EXC = 'criaturas_partida_exceso', CLAVE_CUAR = CLAVE + '_corrupta', DIRS = ['up', 'down', 'left', 'right'], esNum = Number.isFinite;
  const sinIdOk = (a) => (Array.isArray(a) ? a.filter((q) => q && typeof q === 'object' && typeof q.forma === 'string' && G.CREATURES && G.CREATURES[q.forma]).slice(0, 500).map((q, i) => { const e = { id: Number.isInteger(q.id) && q.id > 0 ? q.id : i + 1, forma: q.forma, mapa: typeof q.mapa === 'string' ? q.mapa : '', n: Number.isInteger(q.n) ? q.n : 0 }; if (esNum(q.hp) && q.hp >= 0) e.hp = Math.min(Math.round(q.hp), 1e6); if (esNum(q.xp) && q.xp > 0) e.xp = Math.min(Math.round(q.xp), 1e6); { const m = G.equipo ? G.equipo.moteOk(q.mote) : ''; if (m) e.mote = m; } if (esNum(q.bloq) && q.bloq > 0) e.bloq = Math.round(q.bloq); return e; }) : []);   // v2.339: la caja del Centro PC (ejemplares con id, vida y XP)
  const motesOk = (c) => { const o = {}; if (c && typeof c === 'object' && !Array.isArray(c) && G.equipo) Object.keys(c).slice(0, 12).forEach((k) => { const m = G.equipo.moteOk(c[k]); if (m && /^[a-z0-9_]+(#[2-6])?$/.test(k) && G.CREATURES[G.equipo.especie(k)]) o[k] = m; }); return o; };
  const cajaOk = (n) => (Number.isInteger(n) && n > 50 ? Math.min(n, 300) : undefined);
  const capturasOk = (c) => { const o = {}; if (c && typeof c === 'object' && !Array.isArray(c)) Object.keys(c).forEach((k) => { if (G.PECES && G.PECES[k] && Number.isInteger(c[k]) && c[k] > 0 && c[k] < 100000) o[k] = c[k]; }); return o; };
  const recordsOk = (c) => { const o = {}; if (c && typeof c === 'object' && !Array.isArray(c)) Object.keys(c).forEach((k) => { if (G.PECES && G.PECES[k] && esNum(c[k]) && c[k] > 0 && c[k] < 1000) o[k] = c[k]; }); return o; };
  const brillosOk = (n) => (Number.isInteger(n) && n >= 0 ? Math.min(n, 9999999) : undefined);   // v2.315: Brillos (moneda)
  const mochilaOk = (c) => { const o = {}; if (c && typeof c === 'object' && !Array.isArray(c)) Object.keys(c).slice(0, 200).forEach((k) => { if (G.tienda && G.tienda.existe(k) && Number.isInteger(c[k]) && c[k] > 0) o[k] = Math.min(c[k], 99); }); return o; };
  const equipoOk = (a, j) => (G.equipo ? G.equipo.validas(j, a) : []);   // v2.312: el equipo guardado (hasta 6 especies que posee)
  const vidaOk = (c) => { const o = {}; if (c && typeof c === 'object' && !Array.isArray(c)) Object.keys(c).slice(0, 500).forEach((k) => { if (G.FORMAS && G.FORMAS[String(k).split('#')[0]] && esNum(c[k]) && c[k] >= 0) o[k] = Math.min(Math.round(c[k]), 1e6); }); return o; };   // v2.309: vida actual por especie (0 = debilitada; sin entrada = completa)
  const progOk = (c) => { const o = {}; if (c && typeof c === 'object' && !Array.isArray(c)) Object.keys(c).slice(0, 500).forEach((k) => { if (G.FORMAS && G.FORMAS[String(k).split('#')[0]] && c[k] && esNum(c[k].xp) && c[k].xp > 0) o[k] = { xp: Math.min(Math.round(c[k].xp), 1e6) }; }); return o; };   // v2.303: XP por especie
  // ── Multiverso F2 · formato v2: { v, semilla, reloj, jugadores, tablon, dim: { <idDimension>: { v, …secciones } } }. `tonavia` (la dimensión original) lleva agentes y prof; el tablón es global (decisión 1); `dim` ausente en un jugador = tonavia.
  // Las secciones de dimensiones que este juego no gestiona (`est.dim[id]`) se conservan tal cual: guardar desde un juego que no las conoce NO las borra.
  const plano = (o) => !!o && typeof o === 'object' && !Array.isArray(o), DIM_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/, DIM_VETADO = { __proto__: null, constructor: 1, prototype: 1 };
  const clonar = (o) => JSON.parse(JSON.stringify(o));
  const dimOtrasOk = (c) => { const o = {}; if (plano(c)) Object.keys(c).filter((k) => k !== 'tonavia' && DIM_ID.test(k) && !(k in DIM_VETADO)).forEach((k) => { const q = c[k]; if (plano(q)) { try { o[k] = clonar(q); } catch (e) { /* no serializable: se descarta */ } } }); return o; };   // sin tope de número (los límites son de F8): descartar una sección es perder datos del jugador
  // ── Multiverso F8 · límites de est.dim. Medido: una población de 64 entrenadores ≈ 260 KB; las marcas y el barco de un jugador, unos pocos KB. localStorage ofrece ~5 M de caracteres y el juego guarda hasta 3 copias
  // (principal, _bak, _premig): el principal debe quedar muy por debajo de 1/3. Reglas, de la menos a la más dañina: 1) como mucho 64 secciones; 2) una sección ≤ SECCION: si pasa, se le quita solo `agentes` (población
  // autónoma, que vuelve a nacer) y, si aun así no cabe o no tiene población, se descarta ENTERA; 3) todas las secciones ≤ TOTAL: se quitan primero las poblaciones (la mayor primero) y solo después las secciones
  // que este juego no conoce (la mayor primero). Nunca se toca `tonavia` (su tope es el de la población) ni los datos de jugador de una dimensión conocida. Todo lo descartado se anota en `guardado.descartes`.
  // F8 · LÍMITES POR TIPO DE DATO (medidos, ver docs/multiverso/16_RED_LIMITES_F8.md §3). Una población real pesa ~0,5 KB al nacer y ~4,3 KB por entrenador tras horas de juego (se estabiliza: memoria, relaciones y crónica están acotadas);
  // 64 entrenadores ≈ 260 KB, 128 ≈ 500 KB. Los topes dejan ≥ 2× de margen sobre eso. El techo REAL es la cuota de localStorage del navegador (≈ 5 MB de texto en escritorio, menos en algunos móviles): si no cabe, escribir() baja
  // por escalones (primero las poblaciones de las dimensiones, luego la de Tonavia; el progreso del jugador JAMÁS) y lo AVISA al jugador.
  const LIM = { secciones: 256, agentes: 1500000, datos: 250000, total: 3500000 };   // por sección: población (agentes) y el resto (jugadores, marcas, navegación…) por separado; total = todas las est.dim juntas
  const tam = (o) => { try { return JSON.stringify(o).length; } catch (e) { return Infinity; } };
  function limitarDim(dim) {   // dim: objeto ya limpio (dimOtrasOk). Devuelve { dim, descartes: [{ id, que, bytes, por }] }
    const out = {}, descartes = [], ids = Object.keys(dim).sort(); const conoce = (k) => !!(G.dimensiones && G.dimensiones.existe && G.dimensiones.existe(k));
    ids.forEach((k, i) => { if (i >= LIM.secciones) descartes.push({ id: k, que: 'seccion', bytes: tam(dim[k]), por: 'demasiadas secciones' }); else out[k] = dim[k]; });
    Object.keys(out).forEach((k) => {
      const sec = out[k]; if (!sec || typeof sec !== 'object' || Array.isArray(sec)) return;
      if (conoce(k) && sec.agentes !== undefined) { const b = tam(sec.agentes); if (b > LIM.agentes) { delete sec.agentes; descartes.push({ id: k, que: 'agentes', bytes: b, por: 'población demasiado grande' }); } }
      const resto = Object.assign({}, sec); delete resto.agentes;
      // dimensión conocida: su población y el resto con topes separados; sección desconocida (de otra versión): un solo tope = población + datos
      if (conoce(k) ? tam(resto) > LIM.datos : tam(sec) > LIM.agentes + LIM.datos) {
        descartes.push({ id: k, que: 'seccion', bytes: tam(sec), por: 'sección demasiado grande' }); delete out[k]; }
    });
    const peso = (k) => tam(out[k]); let tot = Object.keys(out).reduce((n, k) => n + peso(k), 0);
    if (tot > LIM.total) { Object.keys(out).filter((k) => out[k].agentes !== undefined && conoce(k)).sort((a, b) => tam(out[b].agentes) - tam(out[a].agentes)).forEach((k) => { if (tot <= LIM.total) return; const ag = out[k].agentes, b = tam(ag); delete out[k].agentes; tot -= b; descartes.push({ id: k, que: 'agentes', bytes: b, por: 'total de dimensiones demasiado grande' }); }); }
    if (tot > LIM.total) { Object.keys(out).filter((k) => !conoce(k)).sort((a, b) => peso(b) - peso(a)).forEach((k) => { if (tot <= LIM.total) return; const b = peso(k); delete out[k]; tot -= b; descartes.push({ id: k, que: 'seccion', bytes: b, por: 'total de dimensiones demasiado grande' }); }); }
    return { dim: out, descartes };
  }
  const seccionFutura = (d) => !!d && plano(d.dim) && plano(d.dim.tonavia) && Number.isInteger(d.dim.tonavia.v) && d.dim.tonavia.v > SECCION_TONAVIA;   // una sección de tonavia más nueva que este juego = guardado de versión futura
  function avisar(est, tipo, texto) { if (guardado.avisos[tipo] || !est || !est.avisos) return; guardado.avisos[tipo] = true; Object.keys(est.jugadores).forEach((id) => est.avisos.push({ j: id, texto })); }
  const leerLS = (k) => { try { const t = root.localStorage ? root.localStorage.getItem(k) : null; return typeof t === 'string' && t ? t : null; } catch (e) { return null; } };
  const guardado = G.guardado = {
    VERSION, CLAVE, CLAVE_BAK, CLAVE_PRE, CLAVE_CUAR, CLAVE_EXC, LIM, limitarDim, descartes: [], recorte: [], ultimo: null,
    serializar(est, opc) { opc = opc || {}; const jug = {}; Object.keys(est.jugadores).forEach((id) => { const j = est.jugadores[id]; jug[id] = { mapa: j.mapa, x: Math.round(j.x * 10) / 10, y: Math.round(j.y * 10) / 10, dir: j.dir, ang: Math.round(j.ang * 1000) / 1000, capturas: capturasOk(j.capturas), records: recordsOk(j.records), esferas: Number.isInteger(j.esferas) && j.esferas >= 0 ? Math.min(j.esferas, 999) : undefined, sinId: sinIdOk(j.sinId), cajaMax: cajaOk(j.cajaMax), buzon: j.buzon && G.buzon ? G.buzon.limpiar(j.buzon) : undefined, tx: j.tx ? { d: j.tx.d, n: j.tx.n } : undefined, xpE: Number.isInteger(j.xpE) && j.xpE > 0 ? Math.min(j.xpE, 1e7) : undefined, sigId: Number.isInteger(j.sigId) && j.sigId > 0 ? j.sigId : undefined, ids: (() => { const o = {}; Object.keys(j.ids || {}).slice(0, 12).forEach((k) => { if (Number.isInteger(j.ids[k]) && j.ids[k] > 0) o[k] = j.ids[k]; }); return Object.keys(o).length ? o : undefined; })(), iv: 1, motes: (() => { const m = motesOk(j.motes); return Object.keys(m).length ? m : undefined; })(), cv: 1, prog: progOk(j.prog), vida: vidaOk(j.vida), equipo: j.equipo ? equipoOk(j.equipo, j) : undefined, brillos: brillosOk(j.brillos), mochila: j.mochila ? mochilaOk(j.mochila) : undefined, prof: G.profundidades ? G.profundidades.jugOk(j.prof) : undefined, crianza: G.crianza ? G.crianza.serializarJ(j) : undefined, volver: (j.volver || []).slice(-4).map((r) => ({ mapa: r.mapa, tx: r.tx, ty: r.ty })) }; }); const lim = limitarDim(dimOtrasOk(est.dim)), dim = lim.dim; guardado.recorte = lim.descartes; if (opc.sinPoblaciones >= 1) Object.keys(dim).forEach((k) => { if (G.dimensiones && G.dimensiones.existe(k) && dim[k] && dim[k].agentes !== undefined) { delete dim[k].agentes; guardado.recorte.push({ id: k, que: 'agentes', bytes: 0, por: 'sin espacio en el navegador' }); } }); dim.tonavia = { v: SECCION_BASE, agentes: G.agentes && !(opc.sinPoblaciones >= 2) ? G.agentes.serializar(est) : undefined, prof: G.profundidades ? G.profundidades.serializar(est) : undefined }; if (G.marcas) G.marcas.alSerializar(est, dim); return { v: VERSION, semilla: est.semilla, reloj: Number.isFinite(est.reloj) ? Math.round(est.reloj * 10) / 10 : 0, jugadores: jug, tablon: G.tablon ? G.tablon.serializar(est) : undefined, dim }; },   // v2.320: + Profundidades (est.prof, j.prof), crianza (j.crias, j.huevos…) y la pila de puertas
    migrar(d) { // lleva un guardado de cualquier versión conocida a la actual (sin tocar el original); null si no se entiende (versión futura o basura)
      if (!plano(d) || !Number.isInteger(d.v) || d.v < 1 || d.v > VERSION || seccionFutura(d)) return null;
      if (d.v === 1) { // v1 → v2: lo de la dimensión original (agentes, prof) pasa a la sección `tonavia`; semilla, reloj, jugadores y tablón no cambian
        const o = { v: 2 }, t = { v: SECCION_BASE }; Object.keys(d).forEach((k) => { if (k === 'agentes' || k === 'prof') { if (d[k] !== undefined) t[k] = d[k]; } else if (k !== 'v' && k !== 'dim') o[k] = d[k]; }); o.dim = { tonavia: t }; return o;
      }
      return d;
    },
    restaurar(est, d0) { // aplica un guardado al estado; devuelve true si se aplicó algo. Valida todo (un guardado roto no puede romper la partida)
      const d = guardado.migrar(d0); if (!d || !d.jugadores || typeof d.jugadores !== 'object') return false; let n = 0; if (esNum(d.reloj) && d.reloj >= 0 && d.reloj < 1e9) est.reloj = d.reloj;   /* v2.327: la hora del día se guarda */ if (Number.isInteger(d.semilla) && d.semilla >= 0 && d.semilla <= 0xFFFFFFFF && d.semilla !== est.semilla) { est.semilla = d.semilla; est.mapas = {}; }   /* F4: la semilla del MUNDO se restaura (el plan de criaturas sale solo de ella); est.rnd y est.sesion (azar de la sesión y del combate) NO */ const dt = plano(d.dim) && plano(d.dim.tonavia) ? d.dim.tonavia : {}; { const l = limitarDim(dimOtrasOk(d.dim)); est.dim = l.dim; guardado.descartes = l.descartes; } if (G.marcas) G.marcas.alRestaurar(est, d.dim); if (G.navegacion) G.navegacion.alRestaurar(est); /* FN: estado del barco y descubrimientos (est.dim.<dim>.jugadores), validado */ if (G.profundidades) G.profundidades.restaurar(est, dt.prof); if (G.agentes) G.agentes.restaurar(est, dt.agentes); if (G.tablon && d.tablon) G.tablon.restaurar(est, d.tablon);   // v2.324: entrenadores autónomos
      Object.keys(est.jugadores).forEach((id) => {
        const s = d.jugadores[id], j = est.jugadores[id]; if (!s || typeof s !== 'object') return;
        let m = null; try { m = G.mundo.mapa(s.mapa); } catch (e) { m = null; } if (m && m.prof && m.prof.piso > 0 && !(G.profundidades && G.profundidades.ps(est, m))) m = null;   // v2.320: un piso de una expedición que ya no existe no se restaura
        // Multiverso E1: el PROGRESO se restaura siempre. Si el sitio guardado ya no vale (mapa retirado, renombrado o aún no instalado; posición fuera del mapa), solo se pierde el sitio: el jugador va a un ancla segura.
        const dentro = !!m && esNum(s.x) && esNum(s.y) && s.x >= 0 && s.y >= 0 && s.x <= m.W * T && s.y <= m.H * T; let sitio = !!m;
        j.dir = DIRS.indexOf(s.dir) >= 0 ? s.dir : 'down'; j.ang = esNum(s.ang) ? s.ang : 0; j.moving = false; j.pesca = null; j.enPuerta = null;
        if (m) { const a = m.anclas.inicio || m.anclas.entrada; j.mapa = s.mapa; if (dentro) { j.x = s.x; j.y = s.y; }
          if (!dentro || G.motor.bloqueado(m, j.x, j.y)) { if (a) { j.x = a[0] * T + 8; j.y = a[1] * T + 14; } else if (!dentro) sitio = false; } } // si el mapa cambió y esa casilla ya es sólida (o ya no existe), a la entrada
        if (!sitio) { const ms = guardado.seguro(j); j.dir = 'down'; j.ang = 0; est.avisos.push({ j: id, texto: 'El lugar donde guardaste ya no está disponible: vuelves a ' + ms.nombre + '. Tu progreso está intacto.' }); }
        const c = capturasOk(s.capturas), rc = recordsOk(s.records); { const pr = progOk(s.prog); if (Object.keys(pr).length) j.prog = pr; } { const vd = vidaOk(s.vida); if (Object.keys(vd).length) j.vida = vd; } if (Object.keys(c).length) j.capturas = c; if (Object.keys(rc).length) j.records = rc; if (Number.isInteger(s.esferas) && s.esferas >= 0) j.esferas = Math.min(s.esferas, 999); const sid = sinIdOk(s.sinId); if (sid.length) j.sinId = sid; { const cm = cajaOk(s.cajaMax); if (cm) j.cajaMax = cm; } if (Number.isInteger(s.xpE) && s.xpE > 0) j.xpE = Math.min(s.xpE, 1e7); { const mo = motesOk(s.motes); if (Object.keys(mo).length) j.motes = mo; } { const bz = G.buzon ? G.buzon.limpiar(s.buzon) : []; if (bz.length) j.buzon = bz; if (s.tx && Number.isInteger(s.tx.d) && Number.isInteger(s.tx.n) && s.tx.d >= 0 && s.tx.n >= 0) j.tx = { d: s.tx.d, n: Math.min(s.tx.n, 99) }; } { const io = s.ids && typeof s.ids === 'object' && !Array.isArray(s.ids) ? s.ids : {}; Object.keys(io).slice(0, 12).forEach((k) => { if (Number.isInteger(io[k]) && io[k] > 0 && /^[a-z0-9_]+(#[2-6])?$/.test(k)) { j.ids = j.ids || {}; j.ids[k] = io[k]; } }); if (Number.isInteger(s.sigId) && s.sigId > 0) j.sigId = s.sigId; } { const eq = equipoOk(s.equipo, j); if (eq.length) j.equipo = eq; } if (s.cv !== 1 && G.equipo) G.equipo.migrar(j); if (G.equipo) { if (s.iv !== 1) G.equipo.renumerar(j); else G.equipo.asegurar(j); } { const b = brillosOk(s.brillos); if (b !== undefined) j.brillos = b; const mo = mochilaOk(s.mochila); if (Object.keys(mo).length) j.mochila = mo; } if (G.profundidades) { const pr = G.profundidades.jugOk(s.prof); if (pr) j.prof = pr; } if (G.crianza) G.crianza.restaurarJ(j, s.crianza); if (!sitio) j.volver = []; else if (Array.isArray(s.volver)) j.volver = s.volver.filter((r) => r && G.mundo.mapas[r.mapa] && Number.isInteger(r.tx) && Number.isInteger(r.ty)).slice(-4).map((r) => ({ mapa: r.mapa, tx: r.tx, ty: r.ty })); G.motor.estadoMapa(est, j.mapa); n++;
      });
      G.motor.liberarDimensiones(est);   // F4: comprobar un sitio guardado puede haber cargado una dimensión donde al final no quedó nadie
      if (n) G.motor.aparicion(est); return n > 0;
    },
    seguro(j) { const I = G.mundo.INICIAL, m = G.mundo.mapa(I.mapa), a = G.mundo.ancla(m, I.ancla); j.mapa = m.id; j.x = a[0] * T + 8; j.y = a[1] * T + 14; return m; },   // ancla segura (hoy el inicio; con dimensiones, la entrada de la suya o del Nexus)
    // ── Multiverso E1 · seguridad: un guardado que este juego NO entiende (ilegible o de versión futura) jamás se sobrescribe ──
    bloqueo: null,   // null = se puede guardar · 'futuro' | 'corrupto' = hay un guardado que no se entiende: escribir() no hace nada hasta borrar() (?nueva=1)
    examinar(texto) { // texto guardado → { estado: 'ok' | 'futuro' | 'corrupto', d }. No toca nada.
      let d = null; try { d = JSON.parse(texto); } catch (e) { return { estado: 'corrupto', d: null }; }
      if (!d || typeof d !== 'object' || Array.isArray(d) || !Number.isInteger(d.v) || d.v < 1) return { estado: 'corrupto', d: null };
      if (d.v > VERSION || seccionFutura(d)) return { estado: 'futuro', d };
      return d.jugadores && typeof d.jugadores === 'object' && !Array.isArray(d.jugadores) ? { estado: 'ok', d } : { estado: 'corrupto', d: null };
    },
    // Arranque: crea la partida (crear() → est) y le aplica lo guardado. Devuelve { est, estado: 'nueva' | 'cargada' | 'bloqueada', motivo?, d? }.
    // 'cargada' deja una copia del texto leído en CLAVE_BAK (la última partida buena con la que se arrancó). 'bloqueada' no toca nada guardado y da una partida limpia que no se guardará.
    cargar(crear) {
      guardado.bloqueo = null; guardado.descartes = []; let texto = null; try { texto = root.localStorage ? root.localStorage.getItem(CLAVE) : null; } catch (e) { texto = null; }
      if (typeof texto !== 'string' || !texto) return { est: crear(), estado: 'nueva' };
      const x = guardado.examinar(texto); if (x.estado !== 'ok') { guardado.bloqueo = x.estado; return { est: crear(), estado: 'bloqueada', motivo: x.estado }; }
      let est = crear(), bien = false; try { bien = guardado.restaurar(est, x.d); } catch (e) { bien = false; }
      if (!bien) { guardado.bloqueo = 'corrupto'; return { est: crear(), estado: 'bloqueada', motivo: 'corrupto' }; }   // partida limpia: la que se restauró a medias se descarta
      try { root.localStorage.setItem(CLAVE_BAK, texto); } catch (e) { /* sin sitio para la copia: se sigue */ }
      if (guardado.descartes.length) { avisar(est, 'carga_recorte', 'Algunos datos del mundo de tu partida eran demasiado grandes y se recortaron (la partida original se conserva aparte).'); try { if (root.localStorage.getItem(CLAVE_EXC) === null) root.localStorage.setItem(CLAVE_EXC, texto); } catch (e) { /* sin sitio: se sigue */ } }   // F8: si se recortó algo por tamaño, el guardado ORIGINAL queda apartado una vez (nada se pierde sin remedio)
      if (x.d.v < VERSION && leerLS(CLAVE_PRE) === null) { try { root.localStorage.setItem(CLAVE_PRE, texto); } catch (e) { /* sin sitio: se sigue */ } }   // F2: el guardado original de una versión anterior se conserva UNA vez, tal cual, antes de migrarlo (la copia normal se renueva en cada arranque)
      return { est, estado: 'cargada', d: x.d };
    },
    // ── Multiverso F2 · recuperación desde la copia de seguridad. NUNCA automática (la pide el jugador con ?recuperar=1) y nunca a costa de lo que se entiende:
    // solo si el guardado principal falta o es ilegible (jamás si es válido ni de versión futura); lo ilegible se aparta antes en CLAVE_CUAR (no se destruye ni se pisa otro apartado distinto); la copia debe ser entendible.
    restaurable(texto, crear) { // ¿se entiende Y se puede aplicar? (examinar solo mira la forma; un guardado puede tener buena forma y no restaurarse, p. ej. sin ningún jugador conocido)
      const x = guardado.examinar(texto); if (x.estado !== 'ok') return false;
      try { return guardado.restaurar((crear || (() => G.motor.crear(0)))(), x.d) === true; } catch (e) { return false; }
    },
    copiaValida(crear) { for (const clave of [CLAVE_BAK, CLAVE_PRE]) { const t = leerLS(clave); if (t !== null && guardado.restaurable(t, crear)) return { clave, texto: t }; } return null; },   // la más reciente que este juego puede restaurar
    recuperarCopia(crear) { // → { ok, motivo?, desde? } · motivos: 'futuro' | 'principal_valido' | 'sin_copia' | 'cuarentena_ocupada' | 'sin_sitio'
      const t = leerLS(CLAVE); if (t !== null) { const e = guardado.examinar(t).estado; if (e === 'futuro') return { ok: false, motivo: 'futuro' }; if (e === 'ok' && guardado.restaurable(t, crear)) return { ok: false, motivo: 'principal_valido' }; }   // un guardado que no se puede restaurar cuenta como ilegible (es el que deja el juego bloqueado)
      const c = guardado.copiaValida(crear); if (!c) return { ok: false, motivo: 'sin_copia' };
      try {
        if (t !== null) { // lo ilegible se aparta en el primer hueco libre (3 huecos); si ya está apartado tal cual, no se escribe de nuevo; si están los 3 ocupados por otros, no se hace nada
          const huecos = [CLAVE_CUAR, CLAVE_CUAR + '2', CLAVE_CUAR + '3']; let h = huecos.find((k) => leerLS(k) === t);
          if (!h) { h = huecos.find((k) => leerLS(k) === null); if (!h) return { ok: false, motivo: 'cuarentena_ocupada' }; root.localStorage.setItem(h, t); if (leerLS(h) !== t) return { ok: false, motivo: 'sin_sitio' }; }
        }
        root.localStorage.setItem(CLAVE, c.texto); if (leerLS(CLAVE) !== c.texto) return { ok: false, motivo: 'sin_sitio' };
      } catch (e) { return { ok: false, motivo: 'sin_sitio' }; }
      guardado.bloqueo = null; return { ok: true, desde: c.clave };
    },
    leer() { try { const t = root.localStorage && root.localStorage.getItem(CLAVE); return t ? JSON.parse(t) : null; } catch (e) { return null; } },
    // F8 · escribir con ESCALONES. Si el navegador no tiene sitio (cuota de localStorage), antes de rendirse se quita lo que el juego sabe regenerar (las poblaciones de entrenadores: primero las de las dimensiones, luego la de Tonavia)
    // y nunca el progreso del jugador; el jugador recibe un aviso (una vez por sesión y por tipo). guardado.ultimo = { chars, ms, escalon } (para que el juego espacie el autoguardado si el guardado pesa).
    escribir(est) {
      try {
        if (guardado.bloqueo || !root.localStorage) return false;
        for (let esc = 0; esc <= 2; esc++) {
          const t0 = Date.now(), texto = JSON.stringify(Object.assign(guardado.serializar(est, { sinPoblaciones: esc }), { guardadoEn: t0 }));
          try { root.localStorage.setItem(CLAVE, texto); } catch (e) { guardado.ultimo = { chars: texto.length, ms: Date.now() - t0, escalon: esc, fallo: true }; continue; }
          guardado.ultimo = { chars: texto.length, ms: Date.now() - t0, escalon: esc };
          if (esc > 0 || guardado.recorte.length) avisar(est, esc > 0 ? 'cuota' : 'recorte', esc > 0 ? 'Tu navegador casi no tiene espacio: se guarda tu progreso, pero no a los entrenadores del mundo (volverán a aparecer).' : 'Algunos datos del mundo eran demasiado grandes y no se guardaron (tu progreso está intacto).');
          return true;
        }
        avisar(est, 'sin_sitio', 'No hay espacio en el navegador para guardar. Libera espacio o exporta tu partida.'); return false;
      } catch (e) { return false; }
    },
    avisos: {},   // qué avisos de guardado ya se dieron en esta sesión
    borrar() { // empezar de cero (?nueva=1): lo que había y se entendía (o era de una versión futura) queda antes en CLAVE_BAK; levanta el bloqueo
      try { if (root.localStorage) { const t = root.localStorage.getItem(CLAVE); if (typeof t === 'string' && t && guardado.examinar(t).estado !== 'corrupto') { try { root.localStorage.setItem(CLAVE_BAK, t); } catch (e) { /* sin sitio */ } } root.localStorage.removeItem(CLAVE); } } catch (e) { /* sin almacenamiento */ }
      guardado.bloqueo = null;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
