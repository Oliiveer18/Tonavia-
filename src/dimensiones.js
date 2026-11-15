// dimensiones.js — Multiverso F3: REGISTRO de dimensiones, esquema (v1 F3, v2 F6, v3 F7, v4 FN) y validador. Una dimensión es un archivo de datos (datos/dimensiones/<id>.json); el motor solo la interpreta.
// Puro (sin DOM, sin azar, sin relojes, sin estado de partida). Lee G.DATOS.dimensiones (lo mete build.js) o, en node, datos/dimensiones/*.json.
// F3 solo define y valida lo que ya tiene significado: id, nombre, entrada, regiones y reglas.ciclo. Lo demás (dificultad, apariciones, economía, entrenadores, visual, requisitos de portal…) lo define la entrega que lo implementa (F5-F7): hasta entonces el esquema lo RECHAZA para que nada quede escrito sin efecto.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), ESQUEMA = 4, DEFECTO = 'tonavia', ID = /^[a-z][a-z0-9_]{0,23}$/, REGION = /^[a-z][a-z0-9_]{0,31}$/, MAX_REGIONES = 64;
  const plano = (o) => !!o && typeof o === 'object' && !Array.isArray(o), txt = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  const CLAVES = ['v', 'id', 'nombre', 'entrada', 'regiones', 'reglas'], CLAVES_V2 = ['apariciones', 'nivel', 'economia'], CLAVES_V3 = ['entrenadores'], CLAVES_V4 = ['navegacion'], RAREZAS = ['comun', 'rara', 'epica'];
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const congelar = (o) => { if (o && typeof o === 'object') { Object.keys(o).forEach((k) => congelar(o[k])); Object.freeze(o); } return o; };

  // Esquema v1: lista de problemas de UNA dimensión (vacía = bien). `archivo` (opcional) = id que dice el nombre del archivo.
  function validar(d, archivo) {
    const e = [];
    if (!plano(d)) return ['la dimensión debe ser un objeto'];
    const v2 = Number.isInteger(d.v) && d.v >= 2, v3 = Number.isInteger(d.v) && d.v >= 3, v4 = Number.isInteger(d.v) && d.v >= 4;
    Object.keys(d).forEach((k) => { if (CLAVES.indexOf(k) >= 0 || k[0] === '_') return; if (CLAVES_V2.indexOf(k) >= 0) { if (!v2) e.push('«' + k + '» exige «v» ≥ 2 (esquema F6)'); } else if (CLAVES_V3.indexOf(k) >= 0) { if (!v3) e.push('«' + k + '» exige «v» ≥ 3 (esquema F7)'); } else if (CLAVES_V4.indexOf(k) >= 0) { if (!v4) e.push('«' + k + '» exige «v» ≥ 4 (esquema FN)'); } else e.push('clave desconocida «' + k + '» (el esquema solo define: ' + CLAVES.concat(CLAVES_V2, CLAVES_V3, CLAVES_V4).join(', ') + ')'); });
    if (!Number.isInteger(d.v) || d.v < 1) e.push('«v» debe ser un entero ≥ 1');
    else if (d.v > ESQUEMA) e.push('«v» ' + d.v + ' es más nuevo que el esquema que entiende este juego (' + ESQUEMA + ')');
    if (typeof d.id !== 'string' || !ID.test(d.id)) e.push('«id» debe ser minúsculas, dígitos y _ (empieza por letra, máx. 24)');
    else if (archivo !== undefined && archivo !== d.id) e.push('«id» (' + d.id + ') no coincide con el archivo (' + archivo + ')');
    if (!txt(d.nombre, 60)) e.push('«nombre» debe ser un texto de 1 a 60 caracteres');
    const id = typeof d.id === 'string' && ID.test(d.id) ? d.id : null;
    if (!plano(d.entrada)) e.push('«entrada» debe ser { mapa, ancla }');
    else {
      Object.keys(d.entrada).forEach((k) => { if (k !== 'mapa' && k !== 'ancla') e.push('entrada: clave desconocida «' + k + '»'); });
      if (!txt(d.entrada.mapa, 80)) e.push('entrada.mapa debe ser un texto'); else if (id && espacioDe(d.entrada.mapa) !== (id === DEFECTO ? null : id)) e.push('entrada.mapa «' + d.entrada.mapa + '» no es de la dimensión ' + id + (id === DEFECTO ? ' (sus mapas no llevan prefijo)' : ' (debe empezar por «' + id + '/»)'));
      if (!txt(d.entrada.ancla, 40)) e.push('entrada.ancla debe ser un texto');
    }
    if (d.regiones !== undefined) {
      if (!Array.isArray(d.regiones)) e.push('«regiones» debe ser una lista');
      else { if (d.regiones.length > MAX_REGIONES) e.push('«regiones»: máximo ' + MAX_REGIONES); const vistos = {}; d.regiones.forEach((r) => { if (typeof r !== 'string' || !REGION.test(r)) e.push('región inválida: ' + JSON.stringify(r)); else if (vistos[r]) e.push('región repetida: ' + r); else vistos[r] = 1; }); }
    }
    if (d.reglas !== undefined) {
      if (!plano(d.reglas)) e.push('«reglas» debe ser un objeto');
      else { Object.keys(d.reglas).forEach((k) => { if (k !== 'ciclo' && k[0] !== '_') e.push('reglas: clave desconocida «' + k + '» (los requisitos de portal los define F5)'); }); if (d.reglas.ciclo !== undefined && d.reglas.ciclo !== 'global') e.push('reglas.ciclo solo puede ser «global» (un único reloj para todas las dimensiones, decisión aprobada)'); }
    }
    if (v2) validarAjustes(d, e);
    if (v3 && d.entrenadores !== undefined) validarEntrenadores(d, e);
    if (v4 && d.navegacion !== undefined) validarNavegacion(d, e);
    return e;
  }

  // ── F6 · ajustes de contenido (esquema v2): apariciones (pesos de rareza y multiplicadores por línea, por dimensión y por región), nivel base de las salvajes y factor de economía ──
  const esN = (x) => typeof x === 'number' && Number.isFinite(x), cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const LIM = { peso: [0, 1000], mult: [0, 10], nivel: [0, 40], factor: [0.1, 10] };
  function pesos(o, ctx, e) { // { comun, rara, epica }: números 0..1000, al menos uno > 0
    if (!plano(o)) { e.push(ctx + ' debe ser { comun, rara, epica }'); return; }
    Object.keys(o).forEach((k) => { if (RAREZAS.indexOf(k) < 0) e.push(ctx + ': rareza desconocida «' + k + '» (solo ' + RAREZAS.join(', ') + ')'); else if (!esN(o[k]) || o[k] < LIM.peso[0] || o[k] > LIM.peso[1]) e.push(ctx + '.' + k + ' debe ser un número de ' + LIM.peso.join(' a ')); });
    if (RAREZAS.every((k) => o[k] !== undefined) && RAREZAS.every((k) => !(o[k] > 0))) e.push(ctx + ': al menos una rareza debe pesar más de 0');   // un objeto parcial hereda el resto (de la dimensión o de PESOS)
  }
  function lineas(o, ctx, e) { // { <fam>: multiplicador 0..10 } (0 = excluida)
    if (!plano(o)) { e.push(ctx + ' debe ser un objeto { línea: multiplicador }'); return; }
    Object.keys(o).forEach((k) => { if (!/^[a-z][a-z0-9_]{0,31}$/.test(k)) e.push(ctx + ': nombre de línea inválido «' + k + '»'); else if (G.LINEAS && !G.LINEAS.some((L) => L.fam === k)) e.push(ctx + ': la línea «' + k + '» no existe'); if (!esN(o[k]) || o[k] < LIM.mult[0] || o[k] > LIM.mult[1]) e.push(ctx + '.' + k + ' debe ser un número de ' + LIM.mult.join(' a ')); });
  }
  function validarAjustes(d, e) {
    const regs = Array.isArray(d.regiones) ? d.regiones : [];
    const clavesOk = (o, ctx, ok) => Object.keys(o).forEach((k) => { if (ok.indexOf(k) < 0 && k[0] !== '_') e.push(ctx + ': clave desconocida «' + k + '»'); });
    const reg = (o, ctx, f) => { if (!plano(o)) { e.push(ctx + ' debe ser un objeto { región: … }'); return; } Object.keys(o).forEach((r) => { if (regs.indexOf(r) < 0) e.push(ctx + ': la región «' + r + '» no está en «regiones»'); else f(o[r], ctx + '.' + r); }); };
    if (d.apariciones !== undefined) {
      const A = d.apariciones;
      if (!plano(A)) e.push('«apariciones» debe ser un objeto');
      else {
        clavesOk(A, 'apariciones', ['rareza', 'lineas', 'regiones']);
        if (A.rareza !== undefined) pesos(A.rareza, 'apariciones.rareza', e);
        if (A.lineas !== undefined) lineas(A.lineas, 'apariciones.lineas', e);
        if (A.regiones !== undefined) reg(A.regiones, 'apariciones.regiones', (q, ctx) => { if (!plano(q)) { e.push(ctx + ' debe ser un objeto'); return; } clavesOk(q, ctx, ['rareza', 'lineas']); if (q.rareza !== undefined) pesos(q.rareza, ctx + '.rareza', e); if (q.lineas !== undefined) lineas(q.lineas, ctx + '.lineas', e); });
      }
    }
    if (d.nivel !== undefined) {
      const N = d.nivel;
      if (!plano(N)) e.push('«nivel» debe ser un objeto');
      else {
        clavesOk(N, 'nivel', ['base', 'regiones']);
        const ent = (x, ctx) => { if (!Number.isInteger(x) || x < LIM.nivel[0] || x > LIM.nivel[1]) e.push(ctx + ' debe ser un entero de ' + LIM.nivel.join(' a ')); };
        if (N.base !== undefined) ent(N.base, 'nivel.base');
        if (N.regiones !== undefined) reg(N.regiones, 'nivel.regiones', ent);
      }
    }
    if (d.economia !== undefined) {
      const E = d.economia;
      if (!plano(E)) e.push('«economia» debe ser un objeto');
      else { clavesOk(E, 'economia', ['premios', 'precios']); ['premios', 'precios'].forEach((k) => { if (E[k] !== undefined && (!esN(E[k]) || E[k] < LIM.factor[0] || E[k] > LIM.factor[1])) e.push('economia.' + k + ' debe ser un número de ' + LIM.factor.join(' a ')); }); }
    }
  }
  // ── F7 · entrenadores de la dimensión (esquema v3): población autónoma propia, grafo propio (mapas y rutas que recorren), pools de nombres y frases, pesos de ambición y entrenadores FIJOS con equipo prefijado ──
  // Contrato completo: docs/multiverso/14_ENTRENADORES_F7.md. Formato del grafo = el de datos/mundo.json (regiones + mapas), con ids «<dim>/<mapa>».
  const LIM_E = { poblacion: [0, 48], fijos: 16, nombres: 200, nodos: 64, lado: [8, 128], nivel: [1, 50], peso: [0, 10] }, LADOS = ['norte', 'sur', 'este', 'oeste'], TIPOS_NODO = ['pueblo', 'ruta', 'interior'], NODO = /^[a-z][a-z0-9_]{0,23}\/[a-z][a-z0-9_]{0,39}$/, FRASE_K = /^[a-z][a-z0-9_]{0,31}$/;
  function validarEntrenadores(d, e) {
    const E = d.entrenadores, id = typeof d.id === 'string' ? d.id : '?', ctx = 'entrenadores';
    if (!plano(E)) { e.push('«entrenadores» debe ser un objeto'); return; }
    Object.keys(E).forEach((k) => { if (['poblacion', 'grafo', 'nombres', 'frases', 'ambiciones', 'fijos'].indexOf(k) < 0 && k[0] !== '_') e.push(ctx + ': clave desconocida «' + k + '»'); });
    if (id === DEFECTO) { e.push(ctx + ': la dimensión original conserva su población y su grafo de datos/agentes.json y datos/mundo.json (no admite «entrenadores»)'); return; }
    const AG = G.agentes && G.agentes.D ? G.agentes.D : null, regs = Array.isArray(d.regiones) ? d.regiones : [];
    const pob = E.poblacion === undefined ? 0 : E.poblacion;
    if (!Number.isInteger(pob) || pob < LIM_E.poblacion[0] || pob > LIM_E.poblacion[1]) e.push(ctx + '.poblacion debe ser un entero de ' + LIM_E.poblacion.join(' a '));
    const fijos = E.fijos === undefined ? [] : E.fijos;
    if (!Array.isArray(fijos) || fijos.length > LIM_E.fijos) e.push(ctx + '.fijos debe ser una lista de hasta ' + LIM_E.fijos);
    // grafo: obligatorio si hay entrenadores
    const nodos = {}; let pueblos = 0;
    if (E.grafo === undefined) { if ((Number.isInteger(pob) && pob > 0) || (Array.isArray(fijos) && fijos.length)) e.push(ctx + '.grafo es obligatorio si hay población o entrenadores fijos'); }
    else if (!plano(E.grafo)) e.push(ctx + '.grafo debe ser { regiones, mapas }');
    else {
      const Gf = E.grafo; Object.keys(Gf).forEach((k) => { if (k !== 'regiones' && k !== 'mapas' && k[0] !== '_') e.push(ctx + '.grafo: clave desconocida «' + k + '»'); });
      const elementos = G.LINEAS ? G.LINEAS.reduce((o, L) => { L.elements.forEach((x) => { o[x] = 1; }); return o; }, {}) : null;
      if (Gf.regiones !== undefined) {
        if (!plano(Gf.regiones)) e.push(ctx + '.grafo.regiones debe ser un objeto { región: { nombre, elemento } }');
        else Object.keys(Gf.regiones).forEach((r) => { const q = Gf.regiones[r]; if (regs.indexOf(r) < 0) e.push(ctx + '.grafo.regiones: la región «' + r + '» no está en «regiones»'); if (!plano(q)) { e.push(ctx + '.grafo.regiones.' + r + ' debe ser un objeto'); return; } Object.keys(q).forEach((k) => { if (k !== 'nombre' && k !== 'elemento' && k[0] !== '_') e.push(ctx + '.grafo.regiones.' + r + ': clave desconocida «' + k + '»'); }); if (q.nombre !== undefined && !txt(q.nombre, 40)) e.push(ctx + '.grafo.regiones.' + r + '.nombre debe ser un texto de 1 a 40 caracteres'); if (q.elemento !== undefined && (typeof q.elemento !== 'string' || (elementos && !elementos[q.elemento]))) e.push(ctx + '.grafo.regiones.' + r + '.elemento «' + q.elemento + '» no existe'); });
      }
      if (!Array.isArray(Gf.mapas) || !Gf.mapas.length) e.push(ctx + '.grafo.mapas debe ser una lista con algún mapa');
      else if (Gf.mapas.length > LIM_E.nodos) e.push(ctx + '.grafo.mapas: máximo ' + LIM_E.nodos);
      else {
        Gf.mapas.forEach((m, n) => {
          const c = ctx + '.grafo.mapas[' + n + ']';
          if (!plano(m)) { e.push(c + ' debe ser un objeto'); return; }
          Object.keys(m).forEach((k) => { if (['id', 'tipo', 'region', 'ancho', 'alto', 'conexiones', 'puertas', 'pesca'].indexOf(k) < 0 && k[0] !== '_') e.push(c + ': clave desconocida «' + k + '»'); });
          if (typeof m.id !== 'string' || !NODO.test(m.id) || m.id.slice(0, m.id.indexOf('/')) !== id) { e.push(c + '.id debe ser «' + id + '/<mapa>» (minúsculas, dígitos y _)'); return; }
          if (nodos[m.id]) { e.push(c + ': id repetido «' + m.id + '»'); return; }
          nodos[m.id] = m;
          if (TIPOS_NODO.indexOf(m.tipo) < 0) e.push(c + '.tipo debe ser uno de ' + TIPOS_NODO.join(', '));
          if (m.tipo === 'pueblo') pueblos++;
          if ((m.tipo === 'pueblo' || m.tipo === 'ruta') && (typeof m.region !== 'string' || regs.indexOf(m.region) < 0)) e.push(c + '.region «' + m.region + '» no está en «regiones»');
          ['ancho', 'alto'].forEach((k) => { if (m.tipo !== 'interior' && (!Number.isInteger(m[k]) || m[k] < LIM_E.lado[0] || m[k] > LIM_E.lado[1])) e.push(c + '.' + k + ' debe ser un entero de ' + LIM_E.lado.join(' a ')); });
          if (m.pesca !== undefined && typeof m.pesca !== 'boolean') e.push(c + '.pesca debe ser verdadero o falso');
          if (m.puertas !== undefined) { if (!Array.isArray(m.puertas)) e.push(c + '.puertas debe ser una lista'); else m.puertas.forEach((p, q) => { if (!plano(p) || typeof p.id !== 'string' || !REGION.test(p.id)) e.push(c + '.puertas[' + q + '].id inválido'); else if (p.destino !== undefined && typeof p.destino !== 'string') e.push(c + '.puertas[' + q + '].destino debe ser un texto'); }); }
        });
        // conexiones: lados válidos y que apunten a nodos del grafo; todo pueblo/ruta alcanzable desde todo pueblo/ruta (el planificador necesita distancias finitas)
        Object.keys(nodos).forEach((nid) => { const m = nodos[nid]; if (m.conexiones === undefined) return; const c = ctx + '.grafo.mapas «' + nid + '».conexiones'; if (!plano(m.conexiones)) { e.push(c + ' debe ser un objeto { lado: mapa }'); return; } Object.keys(m.conexiones).forEach((l) => { if (LADOS.indexOf(l) < 0) e.push(c + ': lado desconocido «' + l + '»'); else if (typeof m.conexiones[l] !== 'string' || !nodos[m.conexiones[l]]) e.push(c + '.' + l + ' «' + m.conexiones[l] + '» no es un mapa del grafo'); }); });
        const rec = Object.keys(nodos).filter((k) => nodos[k].tipo === 'pueblo' || nodos[k].tipo === 'ruta');
        if (!e.length && rec.length) { const alc = (a) => { const v = { [a]: 1 }, cola = [a]; for (let i = 0; i < cola.length; i++) Object.keys(nodos[cola[i]].conexiones || {}).forEach((l) => { const t = nodos[cola[i]].conexiones[l]; if (nodos[t] && !v[t]) { v[t] = 1; cola.push(t); } }); return v; }; rec.forEach((a) => { const v = alc(a); rec.forEach((b) => { if (!v[b]) e.push(ctx + '.grafo: desde «' + a + '» no se llega a «' + b + '» por las conexiones'); }); }); }
      }
      if (pueblos === 0 && (pob > 0 || (Array.isArray(fijos) && fijos.length))) e.push(ctx + '.grafo necesita al menos un mapa de tipo «pueblo» (allí nacen los entrenadores)');
    }
    // pools
    if (E.nombres !== undefined) { if (!Array.isArray(E.nombres) || E.nombres.length > LIM_E.nombres) e.push(ctx + '.nombres debe ser una lista de hasta ' + LIM_E.nombres); else { const v = {}; E.nombres.forEach((q) => { if (!txt(q, 24)) e.push(ctx + '.nombres: «' + q + '» no es un texto de 1 a 24 caracteres'); else if (v[q]) e.push(ctx + '.nombres: «' + q + '» repetido'); else v[q] = 1; }); } }
    if (E.frases !== undefined) { if (!plano(E.frases)) e.push(ctx + '.frases debe ser un objeto { situación: [textos] }'); else Object.keys(E.frases).forEach((k) => { const l = E.frases[k]; if (!FRASE_K.test(k) || (AG && AG.frases && !AG.frases[k])) e.push(ctx + '.frases: la situación «' + k + '» no existe en datos/agentes.json'); else if (!Array.isArray(l) || !l.length || l.length > 40 || !l.every((q) => txt(q, 160))) e.push(ctx + '.frases.' + k + ' debe ser una lista de 1 a 40 textos de hasta 160 caracteres'); }); }
    if (E.ambiciones !== undefined) {
      if (!plano(E.ambiciones)) e.push(ctx + '.ambiciones debe ser un objeto { ambición: peso }');
      else { const todas = AG && AG.ambiciones ? Object.keys(AG.ambiciones) : null; Object.keys(E.ambiciones).forEach((k) => { if (todas && todas.indexOf(k) < 0) e.push(ctx + '.ambiciones: la ambición «' + k + '» no existe'); const w = E.ambiciones[k]; if (!esN(w) || w < LIM_E.peso[0] || w > LIM_E.peso[1]) e.push(ctx + '.ambiciones.' + k + ' debe ser un número de ' + LIM_E.peso.join(' a ')); }); if (todas && todas.every((k) => E.ambiciones[k] === 0)) e.push(ctx + '.ambiciones: al menos una ambición debe pesar más de 0'); }
    }
    // fijos
    if (Array.isArray(fijos)) {
      const vistos = {}; fijos.forEach((f, n) => {
        const c = ctx + '.fijos[' + n + ']';
        if (!plano(f)) { e.push(c + ' debe ser un objeto'); return; }
        Object.keys(f).forEach((k) => { if (['nombre', 'casa', 'equipo', 'ambicion', 'aspecto', 'brillos'].indexOf(k) < 0 && k[0] !== '_') e.push(c + ': clave desconocida «' + k + '»'); });
        if (!txt(f.nombre, 24)) e.push(c + '.nombre debe ser un texto de 1 a 24 caracteres'); else if (vistos[f.nombre]) e.push(c + '.nombre «' + f.nombre + '» repetido'); else vistos[f.nombre] = 1;
        if (txt(f.nombre, 24) && ((AG && AG.nombres && AG.nombres.indexOf(f.nombre) >= 0) || (Array.isArray(E.nombres) && E.nombres.indexOf(f.nombre) >= 0))) e.push(c + '.nombre «' + f.nombre + '» ya es un nombre del pool (datos/agentes.json o «nombres» de la dimensión): los fijos llevan nombre propio');
        if (f.casa !== undefined && (typeof f.casa !== 'string' || !nodos[f.casa] || nodos[f.casa].tipo !== 'pueblo')) e.push(c + '.casa debe ser un pueblo del grafo');
        if (!Array.isArray(f.equipo) || !f.equipo.length || f.equipo.length > 6) e.push(c + '.equipo debe ser una lista de 1 a 6 criaturas { forma, nivel }');
        else { const fv = {}; f.equipo.forEach((q, k) => { if (!plano(q) || typeof q.forma !== 'string' || (G.FORMAS && !G.FORMAS[q.forma])) e.push(c + '.equipo[' + k + '].forma «' + (plano(q) ? q.forma : q) + '» no existe'); else if (fv[q.forma]) e.push(c + '.equipo[' + k + ']: forma repetida «' + q.forma + '»'); else fv[q.forma] = 1; if (plano(q) && (!Number.isInteger(q.nivel) || q.nivel < LIM_E.nivel[0] || q.nivel > LIM_E.nivel[1])) e.push(c + '.equipo[' + k + '].nivel debe ser un entero de ' + LIM_E.nivel.join(' a ')); }); }
        if (f.ambicion !== undefined && (typeof f.ambicion !== 'string' || (AG && AG.ambiciones && !AG.ambiciones[f.ambicion]))) e.push(c + '.ambicion «' + f.ambicion + '» no existe');
        if (f.aspecto !== undefined && (!Number.isInteger(f.aspecto) || f.aspecto < 0 || (AG && AG.ajustes && f.aspecto >= AG.ajustes.aspectos))) e.push(c + '.aspecto debe ser un entero de 0 a ' + (AG && AG.ajustes ? AG.ajustes.aspectos - 1 : 'n'));
        if (f.brillos !== undefined && (!Number.isInteger(f.brillos) || f.brillos < 0 || f.brillos > 100000)) e.push(c + '.brillos debe ser un entero de 0 a 100000');
      });
    }
  }

  // ── FN · navegación marítima (esquema v4): mosaico de mapas de mar, barco (límites), puntos (islas, faros, puertos), rutas del rumbo automático, mareas y eventos del mar ──
  // Contrato completo: docs/multiverso/15_NAVEGACION_FN.md. Los mapas del mosaico son de 64×64 casillas y llevan «mar: true»; las coordenadas GLOBALES del mar son (columna·64 + x, fila·64 + y) en casillas.
  const NAV = { lado: 64, filas: 3, cols: 3, T: 16, puntos: 32, rutas: 48, ruta_puntos: 32, tipos_evento: 16, travesia: [15, 35], velocidad: [20, 300], maxNivel: 9, vision: [1, 40], ventana: [60, 86400], porMapa: [0, 8] };
  const NAV_DEF = { velocidades: [80, 110], max: { casco: 2, velas: 1, bodega: 2, catalejo: 2 }, vision: [6, 9, 12] }, PARTES = ['casco', 'velas', 'bodega', 'catalejo'], TIPOS_PUNTO = ['isla', 'faro', 'puerto', 'interes'], TIPOS_EVENTO = ['cofre', 'botella', 'remolino', 'ballena', 'rival', 'tormenta'], COSM = ['bandera', 'mascaron', 'cubierta'], ID_NAV = /^[a-z][a-z0-9_]{0,23}$/, ID_COS = /^[a-z][a-z0-9_]{0,23}$/;
  function validarNavegacion(d, e) {
    const N = d.navegacion, id = typeof d.id === 'string' ? d.id : '?', ctx = 'navegacion', ent = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
    if (!plano(N)) { e.push('«navegacion» debe ser un objeto'); return; }
    if (id === DEFECTO) { e.push(ctx + ': la dimensión original no navega'); return; }
    Object.keys(N).forEach((k) => { if (['mar', 'barco', 'puntos', 'rutas', 'mareas', 'eventos', 'travesia'].indexOf(k) < 0 && k[0] !== '_') e.push(ctx + ': clave desconocida «' + k + '»'); });
    // mosaico
    const pos = {};   // id de mapa → [fila, col]
    if (!plano(N.mar) || !Array.isArray(N.mar.mapas)) e.push(ctx + '.mar.mapas es obligatorio: una lista de ' + NAV.filas + ' filas de ' + NAV.cols + ' ids de mapa');
    else {
      Object.keys(N.mar).forEach((k) => { if (k !== 'mapas' && k[0] !== '_') e.push(ctx + '.mar: clave desconocida «' + k + '»'); });
      if (N.mar.mapas.length !== NAV.filas || N.mar.mapas.some((f) => !Array.isArray(f) || f.length !== NAV.cols)) e.push(ctx + '.mar.mapas debe ser un mosaico de ' + NAV.filas + '×' + NAV.cols + ' (' + NAV.filas + ' filas de ' + NAV.cols + ' ids)');
      else N.mar.mapas.forEach((f, r) => f.forEach((m, c) => { if (typeof m !== 'string' || espacioDe(m) !== id) e.push(ctx + '.mar.mapas[' + r + '][' + c + '] debe ser un id «' + id + '/…»'); else if (pos[m]) e.push(ctx + '.mar.mapas: mapa repetido «' + m + '»'); else pos[m] = [r, c]; }));
    }
    // barco: límites, velocidades, visión, puerto y cosmética
    const B = N.barco === undefined ? {} : N.barco, max = Object.assign({}, NAV_DEF.max);
    if (!plano(B)) e.push(ctx + '.barco debe ser un objeto');
    else {
      Object.keys(B).forEach((k) => { if (['velocidades', 'max', 'vision', 'puerto', 'cosmetica'].indexOf(k) < 0 && k[0] !== '_') e.push(ctx + '.barco: clave desconocida «' + k + '»'); });
      if (B.max !== undefined) { if (!plano(B.max)) e.push(ctx + '.barco.max debe ser un objeto'); else Object.keys(B.max).forEach((k) => { if (PARTES.indexOf(k) < 0) e.push(ctx + '.barco.max: parte desconocida «' + k + '» (' + PARTES.join(', ') + ')'); else if (!ent(B.max[k], 0, NAV.maxNivel)) e.push(ctx + '.barco.max.' + k + ' debe ser un entero de 0 a ' + NAV.maxNivel); else max[k] = B.max[k]; }); }
      const vel = B.velocidades === undefined ? NAV_DEF.velocidades : B.velocidades;
      if (!Array.isArray(vel) || vel.length !== max.velas + 1 || vel.some((v, i) => !ent(v, NAV.velocidad[0], NAV.velocidad[1]) || (i && v <= vel[i - 1]))) e.push(ctx + '.barco.velocidades debe ser una lista creciente de ' + (max.velas + 1) + ' velocidades (px/s, ' + NAV.velocidad.join(' a ') + '): una por nivel de velas');
      const vis = B.vision === undefined ? NAV_DEF.vision.slice(0, max.catalejo + 1) : B.vision;
      if (B.vision === undefined && max.catalejo > 2) e.push(ctx + '.barco.vision es obligatoria si catalejo > 2');
      else if (!Array.isArray(vis) || vis.length !== max.catalejo + 1 || vis.some((v, i) => !ent(v, NAV.vision[0], NAV.vision[1]) || (i && v < vis[i - 1]))) e.push(ctx + '.barco.vision debe ser una lista no decreciente de ' + (max.catalejo + 1) + ' radios (casillas, ' + NAV.vision.join(' a ') + '): uno por nivel de catalejo');
      if (B.puerto !== undefined && (!plano(B.puerto) || typeof B.puerto.mapa !== 'string' || typeof B.puerto.ancla !== 'string' || Object.keys(B.puerto).some((k) => k !== 'mapa' && k !== 'ancla'))) e.push(ctx + '.barco.puerto debe ser { mapa, ancla } (dónde está amarrado el primer barco y adónde vuelve si su amarre ya no existe)');
      else if (B.puerto !== undefined && espacioDe(B.puerto.mapa) !== id) e.push(ctx + '.barco.puerto.mapa debe ser de la dimensión ' + id);
      if (B.cosmetica !== undefined) { if (!plano(B.cosmetica)) e.push(ctx + '.barco.cosmetica debe ser un objeto'); else Object.keys(B.cosmetica).forEach((k) => { if (COSM.indexOf(k) < 0) e.push(ctx + '.barco.cosmetica: clave desconocida «' + k + '» (' + COSM.join(', ') + ')'); else if (!Array.isArray(B.cosmetica[k]) || B.cosmetica[k].length > 32 || B.cosmetica[k].some((x) => typeof x !== 'string' || !ID_COS.test(x))) e.push(ctx + '.barco.cosmetica.' + k + ' debe ser una lista de hasta 32 ids (minúsculas, dígitos y _)'); }); }
    }
    // puntos
    const pts = {}, glob = (p) => (pos[p.mapa] ? [pos[p.mapa][1] * NAV.lado + p.tx, pos[p.mapa][0] * NAV.lado + p.ty] : null);
    const P = N.puntos === undefined ? [] : N.puntos;
    if (!Array.isArray(P) || P.length > NAV.puntos) e.push(ctx + '.puntos debe ser una lista de hasta ' + NAV.puntos);
    else P.forEach((p, n) => {
      const c = ctx + '.puntos[' + n + ']'; if (!plano(p)) { e.push(c + ' debe ser un objeto'); return; }
      Object.keys(p).forEach((k) => { if (['id', 'tipo', 'nombre', 'mapa', 'tx', 'ty', 'radio', 'oculto'].indexOf(k) < 0 && k[0] !== '_') e.push(c + ': clave desconocida «' + k + '»'); });
      if (typeof p.id !== 'string' || !ID_NAV.test(p.id)) e.push(c + '.id debe ser minúsculas, dígitos y _'); else if (pts[p.id]) e.push(c + ': id repetido «' + p.id + '»'); else pts[p.id] = p;
      if (TIPOS_PUNTO.indexOf(p.tipo) < 0) e.push(c + '.tipo debe ser uno de ' + TIPOS_PUNTO.join(', '));
      if (!txt(p.nombre, 40)) e.push(c + '.nombre debe ser un texto de 1 a 40 caracteres');
      if (!pos[p.mapa]) e.push(c + '.mapa «' + p.mapa + '» no está en el mosaico');
      if (!ent(p.tx, 0, NAV.lado - 1) || !ent(p.ty, 0, NAV.lado - 1)) e.push(c + ': «tx» y «ty» deben ser enteros de 0 a ' + (NAV.lado - 1));
      if (p.radio !== undefined && !ent(p.radio, 1, 24)) e.push(c + '.radio debe ser un entero de 1 a 24 (casillas)');
      if (p.oculto !== undefined && typeof p.oculto !== 'boolean') e.push(c + '.oculto debe ser verdadero o falso (solo se descubre con una pista)');
    });
    // rutas: polilíneas entre dos puntos; sin buscar caminos en el juego
    const R = N.rutas === undefined ? [] : N.rutas, rid = {}, trav = N.travesia === undefined ? NAV.travesia : N.travesia;
    if (N.travesia !== undefined && (!Array.isArray(trav) || trav.length !== 2 || !ent(trav[0], 1, 600) || !ent(trav[1], 1, 600) || trav[0] > trav[1])) e.push(ctx + '.travesia debe ser [mínimo, máximo] en segundos (enteros, mínimo ≤ máximo)');
    const vmin = Array.isArray(B.velocidades) && B.velocidades.length ? B.velocidades[0] : NAV_DEF.velocidades[0], vmax = Array.isArray(B.velocidades) && B.velocidades.length ? B.velocidades[B.velocidades.length - 1] : NAV_DEF.velocidades[NAV_DEF.velocidades.length - 1];
    if (!Array.isArray(R) || R.length > NAV.rutas) e.push(ctx + '.rutas debe ser una lista de hasta ' + NAV.rutas);
    else R.forEach((r, n) => {
      const c = ctx + '.rutas[' + n + ']'; if (!plano(r)) { e.push(c + ' debe ser un objeto'); return; }
      Object.keys(r).forEach((k) => { if (['id', 'desde', 'hasta', 'puntos'].indexOf(k) < 0 && k[0] !== '_') e.push(c + ': clave desconocida «' + k + '»'); });
      if (typeof r.id !== 'string' || !ID_NAV.test(r.id)) e.push(c + '.id debe ser minúsculas, dígitos y _'); else if (rid[r.id]) e.push(c + ': id repetido «' + r.id + '»'); else rid[r.id] = 1;
      const a = pts[r.desde], b = pts[r.hasta];
      if (!a) e.push(c + '.desde «' + r.desde + '» no es un punto'); if (!b) e.push(c + '.hasta «' + r.hasta + '» no es un punto'); if (a && b && a === b) e.push(c + ': «desde» y «hasta» deben ser distintos');
      if (!Array.isArray(r.puntos) || r.puntos.length < 2 || r.puntos.length > NAV.ruta_puntos || r.puntos.some((q) => !Array.isArray(q) || q.length !== 2 || !ent(q[0], 0, NAV.cols * NAV.lado - 1) || !ent(q[1], 0, NAV.filas * NAV.lado - 1))) { e.push(c + '.puntos debe ser una lista de 2 a ' + NAV.ruta_puntos + ' pares [x, y] globales (casillas, 0 a ' + (NAV.cols * NAV.lado - 1) + ')'); return; }
      const ga = a && glob(a), gb = b && glob(b);
      if (ga && (r.puntos[0][0] !== ga[0] || r.puntos[0][1] !== ga[1])) e.push(c + ': el primer punto debe ser el de «' + r.desde + '» (' + ga.join(',') + ')');
      if (gb && (r.puntos[r.puntos.length - 1][0] !== gb[0] || r.puntos[r.puntos.length - 1][1] !== gb[1])) e.push(c + ': el último punto debe ser el de «' + r.hasta + '» (' + gb.join(',') + ')');
      let len = 0; for (let i = 1; i < r.puntos.length; i++) len += Math.hypot(r.puntos[i][0] - r.puntos[i - 1][0], r.puntos[i][1] - r.puntos[i - 1][1]) * NAV.T;
      if (Array.isArray(trav) && trav.length === 2) { const tl = len / vmin, tr = len / vmax; if (tl > trav[1] + 1e-9) e.push(c + ': con las velas básicas tarda ' + tl.toFixed(1) + ' s (máximo ' + trav[1] + ' s): acórtala'); if (tr < trav[0] - 1e-9) e.push(c + ': con las mejores velas tarda ' + tr.toFixed(1) + ' s (mínimo ' + trav[0] + ' s): alárgala'); }
    });
    // mareas (horas del día del reloj único) y eventos
    if (N.mareas !== undefined) {
      if (!plano(N.mareas)) e.push(ctx + '.mareas debe ser un objeto');
      else { Object.keys(N.mareas).forEach((k) => { if (k !== 'baja' && k[0] !== '_') e.push(ctx + '.mareas: clave desconocida «' + k + '»'); }); const bj = N.mareas.baja; if (bj !== undefined && (!Array.isArray(bj) || bj.length > 4 || bj.some((q) => !Array.isArray(q) || q.length !== 2 || !esN(q[0]) || !esN(q[1]) || q[0] < 0 || q[1] > 24 || q[0] >= q[1]))) e.push(ctx + '.mareas.baja debe ser una lista de hasta 4 tramos [desde, hasta] en horas del día (0 a 24, desde < hasta)'); }
    }
    if (N.eventos !== undefined) {
      const V = N.eventos; if (!plano(V)) { e.push(ctx + '.eventos debe ser un objeto'); return; }
      Object.keys(V).forEach((k) => { if (['ventana', 'por_mapa', 'radio', 'tipos'].indexOf(k) < 0 && k[0] !== '_') e.push(ctx + '.eventos: clave desconocida «' + k + '»'); });
      if (V.ventana !== undefined && !ent(V.ventana, NAV.ventana[0], NAV.ventana[1])) e.push(ctx + '.eventos.ventana debe ser un entero de ' + NAV.ventana.join(' a ') + ' (segundos de reloj de juego)');
      if (V.por_mapa !== undefined && !ent(V.por_mapa, NAV.porMapa[0], NAV.porMapa[1])) e.push(ctx + '.eventos.por_mapa debe ser un entero de ' + NAV.porMapa.join(' a '));
      if (V.radio !== undefined && !(esN(V.radio) && V.radio >= 0.5 && V.radio <= 6)) e.push(ctx + '.eventos.radio debe ser un número de 0,5 a 6 (casillas)');
      if (V.tipos !== undefined) {
        if (!Array.isArray(V.tipos) || V.tipos.length > NAV.tipos_evento) e.push(ctx + '.eventos.tipos debe ser una lista de hasta ' + NAV.tipos_evento);
        else { const vistos = {}; V.tipos.forEach((q, n) => { const c = ctx + '.eventos.tipos[' + n + ']'; if (!plano(q)) { e.push(c + ' debe ser un objeto'); return; } Object.keys(q).forEach((k) => { if (['id', 'tipo', 'peso', 'texto', 'casco', 'brillos'].indexOf(k) < 0 && k[0] !== '_') e.push(c + ': clave desconocida «' + k + '»'); }); if (typeof q.id !== 'string' || !ID_NAV.test(q.id)) e.push(c + '.id debe ser minúsculas, dígitos y _'); else if (vistos[q.id]) e.push(c + ': id repetido «' + q.id + '»'); else vistos[q.id] = 1; if (TIPOS_EVENTO.indexOf(q.tipo) < 0) e.push(c + '.tipo debe ser uno de ' + TIPOS_EVENTO.join(', ')); if (!ent(q.peso === undefined ? 1 : q.peso, 1, 100)) e.push(c + '.peso debe ser un entero de 1 a 100'); if (q.texto !== undefined && !txt(q.texto, 80)) e.push(c + '.texto debe ser un texto de 1 a 80 caracteres'); if (q.casco !== undefined && !ent(q.casco, 0, NAV.maxNivel)) e.push(c + '.casco debe ser un entero de 0 a ' + NAV.maxNivel); if (q.brillos !== undefined && !ent(q.brillos, 0, 1000)) e.push(c + '.brillos debe ser un entero de 0 a 1000'); }); }
      }
      if ((V.por_mapa | 0) > 0 && (!Array.isArray(V.tipos) || !V.tipos.length)) e.push(ctx + '.eventos: «por_mapa» > 0 exige «tipos»');
    }
  }
  // Configuración efectiva (con los valores por defecto) de la navegación de una dimensión, lista para usar: ver registro().navegacion
  function navEfectiva(N, id) {
    const B = N.barco || {}, max = Object.assign({}, NAV_DEF.max, B.max || {}), pos = {};
    N.mar.mapas.forEach((f, r) => f.forEach((m, c) => { pos[m] = [r, c]; }));
    const puntos = (N.puntos || []).map((p) => Object.assign({}, p, { gx: pos[p.mapa][1] * NAV.lado + p.tx, gy: pos[p.mapa][0] * NAV.lado + p.ty, radio: p.radio || 6, oculto: !!p.oculto }));
    const V = N.eventos || {};
    return { dim: id, lado: NAV.lado, mapas: N.mar.mapas, pos, barco: { max, velocidades: B.velocidades || NAV_DEF.velocidades.slice(0, max.velas + 1), vision: B.vision || NAV_DEF.vision.slice(0, max.catalejo + 1), puerto: B.puerto || null, cosmetica: B.cosmetica || {} }, puntos, rutas: (N.rutas || []).map((r) => Object.assign({}, r)), mareas: { baja: (N.mareas && N.mareas.baja) || [] }, travesia: N.travesia || NAV.travesia.slice(), eventos: { ventana: V.ventana || 600, por_mapa: V.por_mapa | 0, radio: V.radio || 2.5, tipos: V.tipos || [] } };
  }
  // Ajustes efectivos de un mapa: la región pisa a la dimensión, clave a clave. Sin nada configurado → { rareza: null, lineas: null, nivel: 0, premios: 1, precios: 1 }.
  const NEUTRO = Object.freeze({ rareza: null, lineas: null, nivel: 0, premios: 1, precios: 1 });

  // Espacio de nombres de un id de mapa: «dim/mapa» → 'dim'; sin barra → null (mapa de la dimensión original). Id mal formado → undefined.
  function espacioDe(idMapa) {
    if (typeof idMapa !== 'string' || !idMapa) return undefined;
    const i = idMapa.indexOf('/'); if (i < 0) return null;
    const p = idMapa.slice(0, i); return ID.test(p) && p !== DEFECTO && i < idMapa.length - 1 ? p : undefined;
  }

  // Registro a partir de { <archivo>: definición }. Las inválidas NO entran y quedan en `errores`; nunca lanza.
  function registro(fuente) {
    const dims = {}, errores = {}, cacheE = {}, cacheN = {};
    Object.keys(plano(fuente) ? fuente : {}).sort().forEach((k) => {
      const e = validar(fuente[k], k); if (e.length) { errores[k] = e; return; }
      const d = copia(fuente[k]); Object.keys(d).forEach((q) => { if (q[0] === '_') delete d[q]; }); dims[d.id] = d;
    });
    const R = {
      DEFECTO, ESQUEMA, errores,
      lista() { return Object.keys(dims).sort((a, b) => (a === DEFECTO ? -1 : b === DEFECTO ? 1 : a < b ? -1 : 1)); },
      existe(id) { return typeof id === 'string' && Object.prototype.hasOwnProperty.call(dims, id); },
      get(id) { return R.existe(id) ? copia(dims[id]) : null; },
      entrada(id) { return R.existe(id) ? copia(dims[id].entrada) : null; },
      // F7 · definición de entrenadores de una dimensión (o null). Es la copia interna, compartida: quien la use NO debe modificarla (se congela). Se cachea para no copiar en cada consulta.
      entrenadores(id) { if (!R.existe(id) || !dims[id].entrenadores) return null; return cacheE[id] || (cacheE[id] = congelar(copia(dims[id].entrenadores))); },
      // FN · navegación de una dimensión (o null): configuración efectiva congelada y cacheada (con valores por defecto, posiciones del mosaico y coordenadas globales de los puntos).
      navegacion(id) { if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(dims, id) || !dims[id].navegacion) return null; return cacheN[id] || (cacheN[id] = congelar(navEfectiva(copia(dims[id].navegacion), id))); },
      regiones(id) { return R.existe(id) ? (dims[id].regiones || []).slice() : []; },
      // a qué dimensión pertenece un mapa: la del prefijo («chuches/villa» → chuches), tonavia si no lleva; null si el prefijo no está registrado o el id es inválido
      deMapa(idMapa) { const p = espacioDe(idMapa); return p === undefined ? null : p === null ? (R.existe(DEFECTO) ? DEFECTO : null) : R.existe(p) ? p : null; },
      // F6 · ajustes de contenido de un mapa ({ id, region }): usa la dimensión del prefijo. Devuelve siempre el objeto NEUTRO (congelado) si no hay nada que aplicar.
      ajustesDe(mapa) {
        const dim = mapa && typeof mapa.id === 'string' ? R.deMapa(mapa.id) : null, D = dim ? dims[dim] : null; if (!D || (!D.apariciones && !D.nivel && !D.economia)) return NEUTRO;
        const A = D.apariciones || {}, Ar = (mapa.region && A.regiones && A.regiones[mapa.region]) || {}, N = D.nivel || {}, E = D.economia || {};
        const mezcla = (a, b) => (a || b ? Object.assign({}, a || {}, b || {}) : null);
        const nv = (mapa.region && N.regiones && N.regiones[mapa.region] !== undefined) ? N.regiones[mapa.region] : (N.base | 0);
        return { rareza: mezcla(A.rareza, Ar.rareza), lineas: mezcla(A.lineas, Ar.lineas), nivel: nv, premios: E.premios === undefined ? 1 : E.premios, precios: E.precios === undefined ? 1 : E.precios };
      },
      // Comprobación contra el mundo real (mapas ya preparados, p. ej. G.mundo.mapas): entrada existente, pertenencia y región de cada mapa.
      comprobar(mapas, dimensiones) { // `dimensiones` (opcional): a cuáles se les exige la entrada ahora (las que no están cargadas no se pueden comprobar sin cargarlas); por defecto, todas
        const e = [], ids = Object.keys(mapas || {});
        R.lista().filter((id) => !Array.isArray(dimensiones) || dimensiones.indexOf(id) >= 0).forEach((id) => { const en = dims[id].entrada, m = mapas[en.mapa]; if (!m) e.push(id + ': la entrada «' + en.mapa + '» no es un mapa que exista'); else if (!m.anclas || !m.anclas[en.ancla]) e.push(id + ': el mapa «' + en.mapa + '» no tiene el ancla «' + en.ancla + '»'); });
        ids.forEach((mid) => { const d = R.deMapa(mid); if (!d) { e.push('mapa «' + mid + '»: no pertenece a ninguna dimensión registrada'); return; } const reg = mapas[mid] && mapas[mid].region; if (reg && (dims[d].regiones || []).indexOf(reg) < 0) e.push('mapa «' + mid + '»: su región «' + reg + '» no está en las regiones de ' + d); });
        return e;
      },
    };
    return R;
  }

  // Fuente real: lo que mete build.js (G.DATOS.dimensiones) o, en node, datos/dimensiones/*.json.
  function fuenteReal() {
    if (G.DATOS && G.DATOS.dimensiones) return G.DATOS.dimensiones;
    if (typeof require !== 'function') return {};
    const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', 'datos', 'dimensiones'), o = {};
    fs.readdirSync(dir).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { try { o[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (x) { o[f.replace(/\.json$/, '')] = null; } });
    return o;
  }
  const real = registro(fuenteReal());
  G.dimensiones = Object.assign(real, { validar, registro, espacioDe, ID, NEUTRO, NAV, PARTES_BARCO: PARTES });
})(typeof window !== 'undefined' ? window : globalThis);
