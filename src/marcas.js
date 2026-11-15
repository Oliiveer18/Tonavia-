// marcas.js — MARCAS DE PROGRESO por jugador y dimensión (Multiverso F6). PURO: sin DOM, sin azar, sin relojes. Una marca es un entero 1..1.000.000 con nombre «modulo.clave»
// (misiones, hallazgos, mejoras… los módulos de contenido deciden qué significan). Viven en est.marcas[dim][jugador][clave] (no existe hasta que se usa: el estado de quien no las usa no cambia)
// y se guardan dentro de la sección de su dimensión (est.dim.<dim>.marcas; la de tonavia, en dim.tonavia.marcas). Cada módulo puede registrar su propio validador.
// Lo que este juego no entiende (módulo no registrado, dimensión no instalada) se CONSERVA tal cual si tiene forma válida: nunca se borra progreso por no conocerlo.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), plano = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const CLAVE = /^[a-z][a-z0-9_]{0,23}\.[a-z0-9_]{1,39}$/, DIM = /^[a-z][a-z0-9_]{0,23}$/, JUG = /^[a-z][a-z0-9_]{0,15}$/, MAX_VALOR = 1000000, MAX_POR_JUGADOR = 256, MAX_JUGADORES = 8, MAX_DIMS = 64;
  const modulos = Object.create(null);   // prefijo → { validar(clave, valor) → bool }
  const valorOk = (v) => Number.isInteger(v) && v >= 1 && v <= MAX_VALOR;
  const modOk = (clave, valor) => { const m = modulos[clave.slice(0, clave.indexOf('.'))]; if (!m || !m.validar) return true; try { return !!m.validar(clave, valor); } catch (e) { return false; } };
  const aceptada = (clave, valor) => typeof clave === 'string' && CLAVE.test(clave) && valorOk(valor) && modOk(clave, valor);
  // Un módulo se registra una vez; `validar(clave, valor)` decide si un valor es válido para sus marcas (se usa al dar y al cargar).
  function registrar(modulo, def) {
    if (typeof modulo !== 'string' || !/^[a-z][a-z0-9_]{0,23}$/.test(modulo)) throw new Error('marcas: nombre de módulo inválido: ' + modulo);
    if (modulos[modulo]) throw new Error('marcas: el módulo «' + modulo + '» ya está registrado');
    if (def !== undefined && (!plano(def) || (def.validar !== undefined && typeof def.validar !== 'function'))) throw new Error('marcas: definición inválida para «' + modulo + '»');
    modulos[modulo] = def || {};
  }
  const tabla = (est, dim, jid, crear) => {
    if (!est.marcas) { if (!crear) return null; est.marcas = {}; }
    if (!est.marcas[dim]) { if (!crear) return null; est.marcas[dim] = {}; }
    if (!est.marcas[dim][jid]) { if (!crear) return null; est.marcas[dim][jid] = {}; }
    return est.marcas[dim][jid];
  };
  const jid = (j) => (j && typeof j === 'object' ? j.id : j);
  const valor = (est, j, dim, clave) => { const t = tabla(est, dim, jid(j), false); return t && Object.prototype.hasOwnProperty.call(t, clave) ? t[clave] : 0; };
  const tiene = (est, j, dim, clave, n) => valor(est, j, dim, clave) >= (n === undefined ? 1 : n);
  // Pone una marca (valor 1 por defecto; 0 la quita). Devuelve true si quedó guardada. Rechaza claves/valores inválidos, dimensiones sin registrar y pasarse del máximo.
  function dar(est, j, dim, clave, v) {
    v = v === undefined ? 1 : v;
    const id = jid(j); if (typeof id !== 'string' || !JUG.test(id) || typeof dim !== 'string' || !DIM.test(dim)) return false;
    if (!G.dimensiones || !G.dimensiones.existe(dim)) return false;
    if (typeof clave !== 'string' || !CLAVE.test(clave)) return false;
    if (v === 0) { const t = tabla(est, dim, id, false); if (t) delete t[clave]; return true; }
    if (!aceptada(clave, v)) return false;
    const t = tabla(est, dim, id, true); if (!Object.prototype.hasOwnProperty.call(t, clave) && Object.keys(t).length >= MAX_POR_JUGADOR) return false;
    t[clave] = v; return true;
  }
  const lista = (est, j, dim) => { const t = tabla(est, dim, jid(j), false); return t ? Object.assign({}, t) : {}; };
  // Limpia lo que llega de un guardado: { <jugador>: { <clave>: n } } → solo lo válido y dentro de los límites (los desconocidos con forma válida se conservan).
  function limpiar(o) {
    const out = {}; if (!plano(o)) return out;
    Object.keys(o).filter((k) => JUG.test(k)).slice(0, MAX_JUGADORES).forEach((k) => {
      if (!plano(o[k])) return; const t = {}; let n = 0;
      Object.keys(o[k]).sort().forEach((c) => { if (n < MAX_POR_JUGADOR && aceptada(c, o[k][c])) { t[c] = o[k][c]; n++; } });
      if (n) out[k] = t;
    });
    return out;
  }
  // Guardado: devuelve true si hubo marcas que escribir. `dim` = secciones { <dim>: {…} } ya clonadas (se les añade `marcas`); la de tonavia sube a v2 SOLO si lleva marcas.
  function alSerializar(est, dim) {
    let hubo = false;
    Object.keys(est.marcas || {}).filter((d) => DIM.test(d)).slice(0, MAX_DIMS).forEach((d) => {
      const m = limpiar(est.marcas[d]); if (!Object.keys(m).length) return;
      const sec = plano(dim[d]) ? dim[d] : (dim[d] = {}); if (!Number.isInteger(sec.v)) sec.v = 1;
      if (d === 'tonavia') sec.v = Math.max(sec.v, 2);
      sec.marcas = m; hubo = true;
    });
    return hubo;
  }
  // Carga: saca `marcas` de cada sección de dimensión (y de dim.tonavia) a est.marcas; deja la sección sin ellas.
  function alRestaurar(est, secciones) {
    est.marcas = undefined; delete est.marcas; const out = {};
    const coge = (d, sec) => { if (!DIM.test(d) || !plano(sec) || sec.marcas === undefined) return; const m = limpiar(sec.marcas); if (Object.keys(m).length) out[d] = m; };
    if (plano(secciones)) Object.keys(secciones).slice(0, MAX_DIMS + 1).forEach((d) => coge(d, secciones[d]));
    Object.keys(est.dim || {}).forEach((d) => { if (plano(est.dim[d])) delete est.dim[d].marcas; });
    if (Object.keys(out).length) est.marcas = out;
  }
  G.marcas = { CLAVE, MAX_VALOR, MAX_POR_JUGADOR, registrar, valor, tiene, dar, lista, limpiar, alSerializar, alRestaurar };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.marcas;
})(typeof window !== 'undefined' ? window : globalThis);
