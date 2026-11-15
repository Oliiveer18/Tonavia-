// mapas.js — DATOS y reglas del mundo (paso 1.3a). No dibuja ni guarda estado de partida: solo sabe qué hay en cada mapa y cómo se unen.
// Los mapas son los archivos de maps/*.json (los hace tools/editor_mapas.html). En el navegador los trae build.js en G.MAPAS; en node se leen de maps/.
// Los mapas se unen por NOMBRE (puertas → mapa + ancla; bordes → mapa vecino + desplazamiento), nunca por coordenadas.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  // Las 17 casillas del editor (símbolo estable: nunca se renumera). true = bloquea el paso.
  const SOLIDO = { '.': 0, f: 0, g: 0, t: 1, '~': 1, '=': 0, s: 0, r: 1, c: 0, l: 1, b: 0, '#': 1, h: 1, d: 0, _: 0, m: 1, x: 1 };
  const LADOS = { norte: 'sur', sur: 'norte', este: 'oeste', oeste: 'este' };
  let crudos = G.MAPAS;
  if (!crudos && typeof require === 'function') { // pruebas y herramientas en node: se leen de maps/
    const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', 'maps');
    crudos = {}; fs.readdirSync(dir).filter((f) => /\.json$/.test(f)).forEach((f) => { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); crudos[j.id] = j; });
  }
  if (!crudos) throw new Error('mapas.js: no hay mapas (G.MAPAS vacío y maps/ no se puede leer)');

  function preparar(j) { // valida un mapa y le añade lo que el juego necesita (ancho, alto, puertas por casilla)
    const err = (t) => { throw new Error('mapa «' + j.id + '»: ' + t); };
    const W = j.ancho, H = j.alto, suelo = j.formato === 2 ? (j.capas || {}).suelo : j.suelo; // formato 1: «suelo»; formato 2 (ID-2a): capas.suelo + objetos + colision + animar
    if (!Array.isArray(suelo) || suelo.length !== H) err('el suelo no tiene ' + H + ' filas');
    suelo.forEach((r, y) => { if (r.length !== W) err('la fila ' + y + ' no mide ' + W); for (const ch of r) if (!(ch in SOLIDO)) err('casilla desconocida «' + ch + '» en la fila ' + y); });
    if (j.formato === 2 && G.capas) G.capas.validar(j, W, H).forEach((t) => err(t));
    if (j.mar !== undefined && j.mar !== true) err('«mar» solo puede ser true');
    if (j.mar === true && G.dimensiones && G.dimensiones.espacioDe(j.id) === null) err('un mapa de mar solo puede estar en otra dimensión (id «<dim>/<mapa>»)');   // FN
    const m = { id: j.id, mar: j.mar === true, nombre: j.nombre || j.id, W, H, suelo, objetos: j.objetos || [], animar: !!j.animar, region: j.region || null, tema: j.tema || null, bloqueos: j.formato === 2 && G.capas ? G.capas.bloqueos(j, W, H) : new Set(), anclas: j.anclas || {}, puertas: j.puertas || [], conexiones: j.conexiones || {}, zonas: j.zonas || [], npcs: j.npcs || [], pesca: j.pesca || [], prof: j.prof || null, porCasilla: new Map(), porPesca: new Map() };   // prof (v2.320): datos de un piso de las Profundidades (src/profundidades.js)
    (m.npcs || []).forEach((n) => { if (n && n.tipo === 'npc' && Number.isInteger(n.x) && Number.isInteger(n.y)) m.bloqueos.add(n.x + ',' + n.y); }); // v2.312: un personaje ocupa su casilla
    m.puertas.forEach((p) => m.porCasilla.set(p.x + ',' + p.y, p));
    m.pesca.forEach((p) => m.porPesca.set(p.x + ',' + p.y, p)); // v2.180 (Pesca 1): puntos de pesca por casilla
    return m;
  }
  // ---- Mapas del editor (v2.61): un paquete «mapas_editor» importado por el jugador se guarda en el navegador (src/mapas_guardados.js) y sustituye a los oficiales con el mismo id.
  // Aquí solo vive la LECTURA y la VALIDACIÓN (sin DOM ni almacenamiento): src/mapas_ui.js guarda y pinta. Las reglas son las mismas del juego (preparar + validarMapas).
  const INICIAL = G.dimensiones && G.dimensiones.entrada(G.dimensiones.DEFECTO); // dónde empieza la partida: la entrada de la dimensión original, de datos/dimensiones/tonavia.json (F3; antes escrito aquí: Albanota; pueblo_inicial queda solo para pruebas, ?mapa=pueblo_inicial)
  if (!INICIAL) throw new Error('mapas.js: falta o no es válida la dimensión «tonavia» (datos/dimensiones/tonavia.json): ' + JSON.stringify(G.dimensiones && G.dimensiones.errores));
  // F5 · los proveedores existen ANTES de arrancar el mundo: al leer un paquete del editor al arrancar también hay que poder mirar los destinos de los portales (otras dimensiones).
  const proveedores = []; let mundoRef = null; const dimsAct = () => (mundoRef ? mundoRef.dimensiones : G.dimensiones);
  const oficiales = crudos, PAQUETE = { MARCA: 'mapas_editor', VERSION: 1, MAX_TEXTO: 2000000, MAX_MAPAS: 40, MAX_LADO: 200 };
  const MIRAS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }; // v2.180: hacia dónde mira quien pesca
  const esInt = Number.isInteger, esTxt = (v) => typeof v === 'string' && v.length > 0;
  function leerPaquete(texto) { // texto del archivo → { ok, errores[], ids, reemplaza, nuevos, combinados, texto }. No guarda nada ni toca el mundo.
    const errores = [], falla = (t) => { errores.push(t); return { ok: false, errores }; };
    if (typeof texto !== 'string' || !texto.trim()) return falla('el archivo está vacío');
    if (texto.length > PAQUETE.MAX_TEXTO) return falla('el archivo es demasiado grande (' + Math.round(texto.length / 1000) + ' KB; el máximo son ' + Math.round(PAQUETE.MAX_TEXTO / 1000) + ' KB)');
    let p; try { p = JSON.parse(texto); } catch (e) { return falla('no es un archivo JSON válido (' + e.message + ')'); }
    if (!p || typeof p !== 'object' || Array.isArray(p) || p.paquete !== PAQUETE.MARCA) return falla('no es un paquete del editor: falta el marcador «' + PAQUETE.MARCA + '». Vuelve a exportarlo con «Exportar al juego»');
    if (!esInt(p.version) || p.version < 1) return falla('el marcador de versión del paquete no es válido');
    if (p.version > PAQUETE.VERSION) return falla('el paquete es de una versión más nueva (' + p.version + ') que la que entiende este juego (' + PAQUETE.VERSION + '): actualiza el juego');
    if (!Array.isArray(p.maps) || !p.maps.length) return falla('el paquete no trae ningún mapa');
    if (p.maps.length > PAQUETE.MAX_MAPAS) return falla('el paquete trae demasiados mapas (' + p.maps.length + '; el máximo son ' + PAQUETE.MAX_MAPAS + ')');
    const nuevos = {}, vistos = {};
    p.maps.forEach((j0, i) => {
      const j = j0 && typeof j0 === 'object' && !Array.isArray(j0) ? JSON.parse(JSON.stringify(j0)) : null, nom = j && esTxt(j.id) ? '«' + j.id + '»' : 'nº ' + (i + 1);
      const e = (t) => errores.push('mapa ' + nom + ': ' + t);
      if (!j) return e('no es un mapa');
      if (typeof j.id === 'string' && j.id.indexOf('/') >= 0) return e('el id lleva prefijo de dimensión (/): el editor solo importa mapas de ' + G.dimensiones.DEFECTO + ', sin prefijo (importar mapas de otras dimensiones no está disponible todavía)');
      if (!/^[a-z0-9_]{1,40}$/.test(j.id || '')) return e('el id debe tener solo minúsculas, números y _ (hasta 40 letras)');
      if (vistos[j.id]) return e('el id está repetido en el paquete'); vistos[j.id] = 1;
      if (!(esInt(j.ancho) && esInt(j.alto) && j.ancho >= 1 && j.alto >= 1 && j.ancho <= PAQUETE.MAX_LADO && j.alto <= PAQUETE.MAX_LADO)) return e('el tamaño no es válido (de 1 a ' + PAQUETE.MAX_LADO + ' casillas por lado)');
      const forma = [], par = (v) => Array.isArray(v) && v.length === 2 && esInt(v[0]) && esInt(v[1]);
      if (j.anclas != null && (typeof j.anclas !== 'object' || Array.isArray(j.anclas) || Object.values(j.anclas).some((v) => !par(v)))) forma.push('las anclas deben ser pares [x, y]');
      if (j.puertas != null && (!Array.isArray(j.puertas) || j.puertas.some((q) => !q || !esTxt(q.id) || !esInt(q.x) || !esInt(q.y) || !q.destino || typeof q.destino !== 'object' || !esTxt(q.destino.ancla)))) forma.push('hay una puerta incompleta (necesita id, x, y y destino con ancla)');
      const portalAjeno = (q) => q && (q.portal !== undefined || (q.destino && (q.destino.dim !== undefined || (typeof q.destino.mapa === 'string' && q.destino.mapa.indexOf('/') >= 0))));
      const portalOficial = (q) => { const of = oficiales[j.id], o = of && Array.isArray(of.puertas) ? of.puertas.find((x) => x && x.id === q.id) : null; return !!o && JSON.stringify([o.destino, o.portal]) === JSON.stringify([q.destino, q.portal]); };   // F5: el editor deja pasar un portal OFICIAL sin tocar (para poder editar el resto de la Ermita sin perderlo); no admite portales nuevos ni cambiados
      if (Array.isArray(j.puertas) && j.puertas.some((q) => portalAjeno(q) && !portalOficial(q))) forma.push('hay una puerta que sale de ' + G.dimensiones.DEFECTO + ' (campo «portal», «dim» o destino con prefijo de dimensión): los portales entre dimensiones no se importan desde el editor (solo se conservan los oficiales sin cambios)');
      if (j.conexiones != null && (typeof j.conexiones !== 'object' || Array.isArray(j.conexiones) || Object.keys(j.conexiones).some((k) => !LADOS[k] || (j.conexiones[k] !== null && (typeof j.conexiones[k] !== 'object' || !esTxt(j.conexiones[k].mapa)))))) forma.push('los bordes deben ser norte, sur, este u oeste, vacíos o con un mapa de destino');
      if (j.zonas != null && (!Array.isArray(j.zonas) || j.zonas.some((z) => !z || !esTxt(z.id) || !esInt(z.x) || !esInt(z.y) || !esInt(z.w) || !esInt(z.h)))) forma.push('hay una zona incompleta (necesita id, x, y, w y h)');
      if (j.npcs != null && (!Array.isArray(j.npcs) || j.npcs.some((n) => !n || !esTxt(n.id) || !esInt(n.x) || !esInt(n.y)))) forma.push('hay un personaje o guarida incompleto (necesita id, x e y)');
      if (j.pesca != null && (!Array.isArray(j.pesca) || j.pesca.some((q) => !q || !esTxt(q.id) || !esInt(q.x) || !esInt(q.y) || !(q.mira in MIRAS)))) forma.push('hay un punto de pesca incompleto (necesita id, x, y y mira: up, down, left o right)');
      if (j.objetos != null && !Array.isArray(j.objetos)) forma.push('los objetos deben ser una lista');
      if (j.mar !== undefined) forma.push('los mapas de mar (campo «mar») no se importan desde el editor (solo existen en otras dimensiones)');
      if (forma.length) return forma.forEach(e);
      try { preparar(j); nuevos[j.id] = j; } catch (x) { errores.push(String(x.message).replace(/^mapa «[^»]*»: /, 'mapa ' + nom + ': ')); }
    });
    if (errores.length) return { ok: false, errores };
    const combinados = Object.assign({}, oficiales, nuevos); let ms;
    try { ms = construir(combinados); } catch (x) { return falla(x.message); }
    const mundoErr = validarTodo(ms, INICIAL); // las mismas reglas que al arrancar: puertas, anclas, bordes, zonas, guaridas y el inicio, y que cada mapa pertenezca a una dimensión registrada con una región que ella declare (F4)
    if (mundoErr.length) return { ok: false, errores: mundoErr };
    const ids = Object.keys(nuevos);
    return { ok: true, errores: [], ids, reemplaza: ids.filter((id) => oficiales[id]), nuevos: ids.filter((id) => !oficiales[id]), combinados, texto };
  }
  proveedores.push(crearProveedorDimension(fuenteDimension, dimsAct));
  G.mapasEditor = { activo: false, ids: [], error: null };
  if (typeof G.MAPAS_GUARDADOS === 'string' && G.MAPAS_GUARDADOS) { // arranque: si hay un paquete guardado y es válido, el juego lo usa; si no, se queda con los oficiales y avisa (src/mapas_ui.js)
    const r = leerPaquete(G.MAPAS_GUARDADOS);
    if (r.ok) { crudos = r.combinados; G.mapasEditor = { activo: true, ids: r.ids, reemplaza: r.reemplaza, nuevos: r.nuevos, error: null }; } else G.mapasEditor.error = r.errores;
  }
  const mapas = construir(crudos);   // (la comprobación de portales a otras dimensiones ya usa los proveedores de arriba)

  function construir(cr) { const ms = {}; Object.keys(cr).forEach((id) => { ms[id] = preparar(cr[id]); }); return ms; }
  // Casilla, sólido y puerta como funciones sueltas (valen para cualquier mapa preparado, también uno todavía no instalado)
  function at(m, tx, ty) { // casilla; fuera del mapa: libre solo si ese lado tiene borde conectado, si no árbol
    if (tx >= 0 && ty >= 0 && tx < m.W && ty < m.H) return m.suelo[ty][tx];
    const lado = ty < 0 ? 'norte' : ty >= m.H ? 'sur' : tx < 0 ? 'oeste' : 'este', enRango = lado === 'norte' || lado === 'sur' ? tx >= 0 && tx < m.W : ty >= 0 && ty < m.H;
    return m.conexiones[lado] && enRango ? (m.mar ? '~' : '.') : 't';   // FN: en un mapa de mar, más allá de un borde conectado sigue el agua
  }
  // FN · en un mapa de mar (mar: true) la regla se INVIERTE para el barco: solo el agua («~») se cruza; la tierra, los muelles y los objetos bloquean. El resto de mapas, igual que siempre.
  function solido(m, tx, ty) { return (m.mar ? at(m, tx, ty) !== '~' : !!SOLIDO[at(m, tx, ty)]) || m.bloqueos.has(tx + ',' + ty); }
  function puertaEn(m, tx, ty) { return m.porCasilla.get(tx + ',' + ty) || null; }
  // F4: lo de siempre + pertenencia a dimensiones (G.dimensiones.comprobar, solo la entrada de tonavia: las demás se cargan bajo demanda).
  // F5 · destino de un portal en OTRA dimensión: se prepara desde su proveedor SIN cargarla en el mundo (y se suelta la caché de las que no estaban cargadas).
  function conExterno(fn) {
    const tocadas = {}, ext = (id) => {
      try {
        if (mundoRef && mundoRef.mapas[id]) return mundoRef.mapas[id]; const D = dimsAct(), d = D.deMapa(id); if (!d || d === D.DEFECTO) return null;
        for (const p of proveedores) { if (p.tiene(id)) { tocadas[d] = 1; return preparar(p.cargar(id)); } }
      } catch (x) { return null; }
      return null;
    };
    try { return fn(ext); } finally { try { Object.keys(tocadas).forEach((d) => { if (!mundoRef || !mundoRef.cargadas(d).length) proveedores.forEach((p) => { if (p.liberar) p.liberar(d); }); }); } catch (x) { /* nada que soltar */ } }
  }
  function validarTodo(ms, ini0) { return conExterno((ext) => validarMapas(ms, ini0, ext).concat(G.dimensiones.comprobar(ms, [G.dimensiones.DEFECTO]))); }
  // Comprobación de todo el mundo: puertas, anclas, bordes, zonas y guaridas apuntan a algo que existe. Devuelve la lista de problemas (vacía = bien). La usan el arranque y la importación de mapas del editor.
  function validarMapas(ms, ini0, ext) { // `ext(id)` (opcional): mapa preparado de OTRA dimensión que no está cargada (destino de un portal)
  const out = [];
  Object.values(ms).forEach((m) => {
    m.puertas.forEach((p) => {
      if (solido(m, p.x, p.y)) out.push(m.id + ': la puerta «' + p.id + '» está sobre una casilla sólida');
      const d = p.destino || {};
      if (d.ancla === 'volver' || d.mapa === '@prof') return;   // v2.320: «@prof» = boca de las Profundidades (el ancla es el bioma de entrada)
      if (p.portal !== undefined && G.portales) G.portales.validar(p.portal).forEach((t) => out.push(m.id + ': la puerta «' + p.id + '»: ' + t));
      if (d.dim !== undefined && d.dim !== G.dimensiones.deMapa(d.mapa)) out.push(m.id + ': la puerta «' + p.id + '» dice dim «' + d.dim + '» pero «' + d.mapa + '» es de la dimensión «' + G.dimensiones.deMapa(d.mapa) + '» (la dimensión sale del prefijo del id; «dim» sobra)');
      const dest = ms[d.mapa] || (ext ? ext(d.mapa) : null);
      if (!dest) out.push(m.id + ': la puerta «' + p.id + '» va a un mapa que no existe («' + d.mapa + '»)');
      else if (!dest.anclas[d.ancla]) out.push(m.id + ': la puerta «' + p.id + '» va a un ancla que no existe («' + d.mapa + '/' + d.ancla + '»)');
    });
    Object.keys(LADOS).forEach((s) => { const c = m.conexiones[s]; if (!c) return; if (!ms[c.mapa]) out.push(m.id + ': el borde ' + s + ' va a un mapa que no existe («' + c.mapa + '»)'); });
    if (m.mar && m.zonas.length) out.push(m.id + ': un mapa de mar no puede tener zonas de aparición');
    const zonasVistas = {};
    m.zonas.forEach((z) => { // zonas de aparición (paso 1.3b): dentro del mapa, con elemento válido, id único y algún sitio donde pueda salir una criatura
      if (zonasVistas[z.id]) out.push(m.id + ': la zona «' + z.id + '» está repetida'); zonasVistas[z.id] = 1;
      if (!(z.w > 0 && z.h > 0 && z.x >= 0 && z.y >= 0 && z.x + z.w <= m.W && z.y + z.h <= m.H)) { out.push(m.id + ': la zona «' + z.id + '» se sale del mapa'); return; }
      if (G.ELEMENTS && !G.ELEMENTS[z.elemento]) out.push(m.id + ': la zona «' + z.id + '» tiene un elemento desconocido («' + z.elemento + '»)');
      if (G.aparicion) { let hay = false; for (let y = z.y; y < z.y + z.h && !hay; y++) for (let x = z.x; x < z.x + z.w; x++) if (G.aparicion.libre(m, x, y)) { hay = true; break; } if (!hay) out.push(m.id + ': la zona «' + z.id + '» no tiene ninguna casilla libre para una criatura'); }
    });
    const pescaVistos = {};
    m.pesca.forEach((p) => { // v2.180 (Pesca 1): se pesca desde una casilla libre mirando a una casilla de agua
      if (pescaVistos[p.id]) out.push(m.id + ': el punto de pesca «' + p.id + '» está repetido'); pescaVistos[p.id] = 1;
      const d = MIRAS[p.mira];
      if (!d) { out.push(m.id + ': el punto de pesca «' + p.id + '» no mira a ningún lado'); return; }
      if (solido(m, p.x, p.y)) out.push(m.id + ': el punto de pesca «' + p.id + '» está sobre una casilla sólida');
      if (at(m, p.x + d[0], p.y + d[1]) !== '~') out.push(m.id + ': el punto de pesca «' + p.id + '» no mira a una casilla de agua');
    });
    m.npcs.filter((n) => n.tipo === 'guarida').forEach((n) => { // guaridas fijas: la línea existe y la casilla es transitable
      if (G.FORMAS && !(G.FORMAS[n.id] && G.FORMAS[n.id].stage === 1)) out.push(m.id + ': la guarida «' + n.id + '» no es la fase 1 de ninguna línea del registro');
      if (solido(m, n.x, n.y)) out.push(m.id + ': la guarida «' + n.id + '» está sobre una casilla sólida');
    });
    Object.keys(m.anclas).filter((n) => n !== 'npc').forEach((n) => { const [x, y] = m.anclas[n]; if (solido(m, x, y)) out.push(m.id + ': el ancla «' + n + '» está sobre una casilla sólida'); });
  });
  const ini = ms[ini0.mapa];
  if (!ini || !ini.anclas[ini0.ancla]) out.push('falta el mapa o el ancla de inicio (' + mundo.INICIAL.mapa + '/' + mundo.INICIAL.ancla + ')');
  return out;
  }
  const mundo = G.mundo = {
    T, SOLIDO, mapas,
    INICIAL,
    dimensiones: G.dimensiones,   // el registro con el que trabaja el mundo (las pruebas lo sustituyen por uno propio)
    // F4 · PROVEEDORES de mapas: lista de { tiene(id), cargar(id) → mapa crudo, liberar?(dim) }. Los de tonavia están cargados desde el arranque; el resto de dimensiones se carga bajo demanda por aquí; `generador` (Profundidades) sigue siendo el último recurso.
    proveedores,
    mapa(id) {
      let m = mapas[id];
      if (!m) { for (const p of mundo.proveedores) { if (p.tiene(id)) { m = mundo.agregar(p.cargar(id)); break; } } }
      if (!m && mundo.generador) { const j = mundo.generador(id); if (j) m = mundo.agregar(j); }
      if (!m) throw new Error('no existe el mapa «' + id + '»'); return m;
    },
    cargadas(dim) { const D = mundo.dimensiones; return Object.keys(mapas).filter((id) => D.deMapa(id) === dim); },   // ids de esa dimensión que están preparados ahora
    cargarDimension(dim) { const D = mundo.dimensiones, ids = []; if (!D.existe(dim)) return ids; mundo.proveedores.forEach((p) => { if (p.ids) p.ids(dim).forEach((id) => { if (ids.indexOf(id) < 0) ids.push(id); }); }); ids.forEach((id) => mundo.mapa(id)); return ids; },
    // Quita de memoria los mapas preparados de una dimensión. NUNCA tonavia (siempre cargada). No sabe de jugadores: quien llama (motor.liberarDimensiones) comprueba que no quede ninguno dentro.
    descargar(dim) { const D = mundo.dimensiones; if (typeof dim !== 'string' || dim === D.DEFECTO || !D.existe(dim)) return []; const ids = mundo.cargadas(dim); ids.forEach((id) => { delete mapas[id]; }); mundo.proveedores.forEach((p) => { if (p.liberar) p.liberar(dim); }); return ids; },
    // Valida una dimensión entera SIN dejarla cargada: sus mapas (puertas, anclas, bordes, zonas…), su entrada y la pertenencia/regiones. Para tonavia, el mundo cargado.
    validarDimension(dim) {
      const D = mundo.dimensiones; if (!D.existe(dim)) return ['la dimensión «' + dim + '» no está registrada'];
      if (dim === D.DEFECTO) return mundo.validar();
      const ya = mundo.cargadas(dim).length > 0, out = []; let ids = [];
      try { ids = mundo.cargarDimension(dim); } catch (x) { return [String(x.message)]; }
      try { const ms = {}; ids.forEach((id) => { ms[id] = mapas[id]; }); const en = D.entrada(dim); if (!ids.length) out.push(dim + ': no tiene ningún mapa'); else { validarTodoDim(ms, en, dim).forEach((t) => out.push(t)); if (G.navegacion && G.navegacion.validarMundo) G.navegacion.validarMundo(dim, ms).forEach((t) => out.push(t)); } }   // FN: el mar de la dimensión (mosaico, puntos y rutas libres de tierra)
      finally { if (!ya) mundo.descargar(dim); }
      return out;
    },
    at, solido, // casilla; sólido = casilla sólida o bloqueada por la huella de un objeto o por la capa de colisión
    puertaDe(id) { const q = Object.values(mundo.mapas).find((mp) => mp.id !== id && mp.puertas.some((pu) => pu.destino && pu.destino.mapa === id)); if (!q) return null; const pu = q.puertas.find((x) => x.destino && x.destino.mapa === id); return { mapa: q.id, tx: pu.x, ty: pu.y }; }, // v2.313: la puerta de fuera que lleva a este interior (para salir si no se entró por ella: partida cargada dentro)
    ancla(m, nombre) { const a = m.anclas[nombre]; if (!a) throw new Error('el mapa «' + m.id + '» no tiene el ancla «' + nombre + '»'); return a; },
    agregar(j) { const m = preparar(j); mapas[m.id] = m; return m; }, // añade un mapa en marcha (lo usan las pruebas con mapas falsos)
    quitar(id) { delete mapas[id]; },
    puertaEn,
    zonaAgua(m, tx, ty) { // v2.188: profundidad del agua en esa casilla: 0 orilla (a 1 casilla de tierra), 1 media (2), 2 honda (3 o más); -1 si no es agua. El puente cuenta como agua (pasa por encima)
      if (!m._agua) { const d = new Map(), q = []; for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) { const c = m.suelo[y][x]; if (c !== '~' && c !== 'b') { d.set(x + ',' + y, 0); q.push([x, y]); } }
        for (let i = 0; i < q.length; i++) { const [x, y] = q[i], v = d.get(x + ',' + y); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ',' + (y + dy), xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= m.W || yy >= m.H || d.has(k)) return; d.set(k, v + 1); q.push([xx, yy]); }); }
        m._agua = d; }
      if (at(m, tx, ty) !== '~') return -1; const v = m._agua.get(tx + ',' + ty); return v <= 1 ? 0 : v === 2 ? 1 : 2;
    },
    MIRAS, puntoPesca(m, tx, ty) { return m.porPesca.get(tx + ',' + ty) || null; }, // v2.180 (Pesca 1)
    paquete: Object.assign({ leer: leerPaquete }, PAQUETE), // lectura y validación de un paquete «mapas_editor» (v2.61)
    oficiales, // los mapas de fábrica (maps/*.json), sin los importados
    crudos: () => crudos, // v2.62: los mapas con los que juega ahora el juego (oficiales + importados), tal como están en los archivos: el editor del juego parte de ellos
    // Borde: si el punto (x, y) en píxeles se sale del mapa por un lado conectado, devuelve dónde aparece en el vecino ({mapa, x, y}); si no, null.
    borde(m, x, y) {
      const lado = x < 0 ? 'oeste' : x >= m.W * T ? 'este' : y < 0 ? 'norte' : y >= m.H * T ? 'sur' : null, c = lado && m.conexiones[lado];
      if (!c) return null;
      const nb = mundo.mapa(c.mapa), d = (c.desplazamiento | 0) * T;
      if (lado === 'oeste') return { mapa: c.mapa, x: nb.W * T + x, y: y + d };
      if (lado === 'este') return { mapa: c.mapa, x: x - m.W * T, y: y + d };
      if (lado === 'norte') return { mapa: c.mapa, x: x + d, y: nb.H * T + y };
      return { mapa: c.mapa, x: x + d, y: y - m.H * T };
    },
    // Casilla libre junto a (tx, ty) (abajo, arriba, izquierda, derecha): sitio donde dejar al jugador al volver por una puerta.
    vecinaLibre(m, tx, ty) {
      for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) { const a = tx + dx, b = ty + dy; if (!mundo.solido(m, a, b) && !mundo.puertaEn(m, a, b)) return [a, b]; }
      return [tx, ty];
    },
    validar() { return validarTodo(mapas, mundo.INICIAL); }, // lista de problemas del mundo cargado (vacía = bien)
  };
  function validarTodoDim(ms, en, dim) { return conExterno((ext) => validarMapas(ms, en, ext).concat(mundo.dimensiones.comprobar(ms, [dim]))); }
  // F4 · proveedor de dimensiones: sus mapas viajan como UN texto JSON por dimensión (G.PAQUETES, lo arma build.js desde maps/<dim>/*.json) que no se analiza hasta que alguien lo necesita; en node se leen de maps/<dim>/.
  function crearProveedorDimension(fuente, dimensiones) {
    const cache = {}, errores = {}, D = () => dimensiones();
    function crudos(dim) {
      if (Object.prototype.hasOwnProperty.call(cache, dim)) return cache[dim];
      let r = null; try {
        const src = fuente(dim); if (src !== undefined && src !== null) {
          const o = typeof src === 'string' ? JSON.parse(src) : src; if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('el paquete de la dimensión ' + dim + ' debe ser { id: mapa }');
          r = {}; Object.keys(o).forEach((k) => { if (!o[k] || typeof o[k] !== 'object' || o[k].id !== k || G.dimensiones.espacioDe(k) !== dim) throw new Error('el mapa «' + k + '» no es de la dimensión ' + dim + ' (su id debe ser «' + dim + '/…» y coincidir con su clave)'); r[k] = o[k]; });
        }
      } catch (x) { errores[dim] = String(x.message); r = null; }
      cache[dim] = r; return r;
    }
    const dimDe = (id) => { const d = D().deMapa(id); return d && d !== D().DEFECTO ? d : null; };
    return {
      errores,
      tiene(id) { const d = dimDe(id); if (!d) return false; const c = crudos(d); return !!c && Object.prototype.hasOwnProperty.call(c, id); },
      cargar(id) { return JSON.parse(JSON.stringify(crudos(dimDe(id))[id])); },
      ids(dim) { const c = D().existe(dim) && dim !== D().DEFECTO ? crudos(dim) : null; return c ? Object.keys(c) : []; },
      liberar(dim) { delete cache[dim]; delete errores[dim]; },
    };
  }
  function fuenteDimension(dim) { // texto/objeto con los mapas de la dimensión, o undefined
    if (G.PAQUETES) return G.PAQUETES[dim];
    if (typeof require !== 'function') return undefined;
    const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', 'maps', dim); if (!fs.existsSync(dir)) return undefined;
    const o = {}; fs.readdirSync(dir).filter((f) => /\.json$/.test(f)).sort().forEach((f) => { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); o[j.id] = j; }); return o;
  }
  mundo.crearProveedorDimension = crearProveedorDimension;
  mundoRef = mundo;
  const problemas = mundo.validar();
  if (problemas.length) throw new Error('mundo con errores:\n - ' + problemas.join('\n - '));
  // v2.337: una marca de pesca (el icono sobre el sitio) solo se muestra si NADIE ocupa ese sitio (ocup: [{x,y}] pies en px de mundo, a menos de 12 px del centro de la casilla) y NADA la tapa (cajas: sprites [x0,y0,x1,y1] y marca [x0,y0,x1,y1], en el mismo sistema). Así el icono nunca pisa a un pescador ni a nadie.
  G.marcaPescaLibre = (p, T, ocup, cajas, marca) => !ocup.some((q) => Math.abs(q.x - (p.x * T + 8)) < 12 && Math.abs(q.y - (p.y * T + 8)) < 12) && !cajas.some((c) => c[0] < marca[2] + 2 && c[2] > marca[0] - 2 && c[1] < marca[3] + 2 && c[3] > marca[1] - 2);
})(typeof window !== 'undefined' ? window : globalThis);
