// portales.js — PORTALES entre dimensiones (Multiverso F5). PURO: sin DOM, sin azar, sin relojes; lo usan el motor (puertas), la validación de mapas y la interfaz.
// Un portal es una PUERTA con un campo extra: { id, x, y, destino: { mapa, ancla }, portal: { color, icono, nombre?, requisitos?: [{ t, … }] } }.
//   · La dimensión de destino NO se escribe: sale del prefijo del id del mapa («nexus/plaza» → nexus; sin prefijo → tonavia) (contrato de F3/F4).
//   · requisitos: TODOS deben cumplirse para cruzar. Solo existen los tipos de REQ; uno desconocido se RECHAZA al validar. F6: cumple/texto/comprobar reciben también `est` (estado de la partida) y existe el tipo `marca` (marcas de progreso, src/marcas.js).
//   · Los requisitos se comprueban al cruzar la puerta en el motor (no en la orden interna «colocar»). Un portal no da objetos ni criaturas.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), plano = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const nivel = (j) => (G.entrenador && j ? G.entrenador.nivel(j) : 1);
  // Tipos de requisito. validar(r) → texto de problema o null; cumple(j, r, est) → bool; texto(r, j, est) → qué falta, en lenguaje de jugador. `est` puede faltar (los tipos que lo necesitan entonces NO se cumplen).
  const REQ = {
    nivelEntrenador: {
      claves: ['t', 'n'],
      validar: (r) => { const tope = G.entrenador && G.entrenador.MAX ? G.entrenador.MAX : 999; return Number.isInteger(r.n) && r.n >= 1 && r.n <= tope ? null : '«n» debe ser un entero de 1 a ' + tope + (tope === 999 ? '' : ' (el nivel máximo de entrenador)'); },   // (al arrancar, entrenador.js aún no está cargado: ahí el tope es 999; las herramientas y las pruebas ya lo ven con el nivel máximo real)
      cumple: (j, r, est, decl) => (decl === undefined ? nivel(j) >= r.n : !!decl && !!G.entrenador && G.entrenador.nivel({ xpE: decl.xp }) >= r.n),   // F8: `decl` = progreso DECLARADO por el otro móvil (undefined = jugador local; null = no ha declarado nada: no se cumple)
      texto: (r, j) => 'nivel de entrenador ' + r.n + ' (tienes ' + nivel(j) + ')',
    },
    // F6 · marca de progreso: { t:'marca', dim, k:'modulo.clave', n? (valor mínimo, por defecto 1), texto? (qué decir al jugador) }
    marca: {
      claves: ['t', 'dim', 'k', 'n', 'texto'],
      validar: (r) => {
        if (typeof r.dim !== 'string' || !/^[a-z][a-z0-9_]{0,23}$/.test(r.dim)) return '«dim» debe ser el id de una dimensión';
        if (typeof r.k !== 'string' || !(G.marcas ? G.marcas.CLAVE : /^[a-z][a-z0-9_]{0,23}\.[a-z0-9_]{1,39}$/).test(r.k)) return '«k» debe ser «modulo.clave» (minúsculas, dígitos y _)';
        if (r.n !== undefined && !(Number.isInteger(r.n) && r.n >= 1 && r.n <= 1000000)) return '«n» debe ser un entero de 1 a 1.000.000';
        if (r.texto !== undefined && !(typeof r.texto === 'string' && r.texto.trim() && r.texto.length <= 60)) return '«texto» debe ser un texto de 1 a 60 caracteres';
        return null;
      },
      cumple: (j, r, est, decl) => (decl === undefined ? !!est && !!G.marcas && G.marcas.tiene(est, j, r.dim, r.k, r.n === undefined ? 1 : r.n) : !!decl && !!decl.marcas[r.dim] && (decl.marcas[r.dim][r.k] | 0) >= (r.n === undefined ? 1 : r.n)),
      texto: (r) => r.texto || 'haber completado algo que aún no has hecho',
    },
    // FN · marea: { t:'marea', estado:'baja'|'alta', dim? } — la puerta solo se abre con esa marea (reloj único; no cambia ninguna colisión). `dim` por defecto: la dimensión del jugador.
    marea: {
      claves: ['t', 'estado', 'dim'],
      validar: (r) => (r.estado !== 'baja' && r.estado !== 'alta' ? '«estado» debe ser «baja» o «alta»' : r.dim !== undefined && !(typeof r.dim === 'string' && /^[a-z][a-z0-9_]{0,23}$/.test(r.dim)) ? '«dim» debe ser el id de una dimensión' : null),
      cumple: (j, r, est) => !!est && !!G.navegacion && G.navegacion.marea(est.reloj, r.dim || (G.mundo && G.mundo.dimensiones.deMapa(j.mapa))) === r.estado,
      texto: (r) => 'marea ' + r.estado,
    },
    // FN · casco: { t:'casco', n, dim? } — el casco del barco del jugador debe tener al menos el nivel n.
    casco: {
      claves: ['t', 'n', 'dim'],
      validar: (r) => (!(Number.isInteger(r.n) && r.n >= 1 && r.n <= 9) ? '«n» debe ser un entero de 1 a 9' : r.dim !== undefined && !(typeof r.dim === 'string' && /^[a-z][a-z0-9_]{0,23}$/.test(r.dim)) ? '«dim» debe ser el id de una dimensión' : null),
      cumple: (j, r, est, decl) => { if (decl !== undefined) return !!decl && ((decl.cascos[r.dim || (G.mundo && G.mundo.dimensiones.deMapa(j.mapa))] | 0) >= r.n); if (!est || !G.navegacion) return false; const b = G.navegacion.barco(est, r.dim ? { id: j.id, mapa: G.mundo.dimensiones.entrada(r.dim) ? G.mundo.dimensiones.entrada(r.dim).mapa : j.mapa } : j); return !!b && b.casco >= r.n; },
      texto: (r) => 'un casco de nivel ' + r.n + ' en tu barco',
    },
    // Santuario B3 · profundidad: { t:'profundidad', n } — récord de Profundidades (piso más hondo alcanzado). SOLO PERSONAL (`local`): no vale en portales (el progreso declarado por red no lo lleva: para otro móvil se cierra).
    profundidad: {
      local: true, dim: 'tonavia',
      claves: ['t', 'n'],
      validar: (r) => (Number.isInteger(r.n) && r.n >= 1 && r.n <= 999 ? null : '«n» debe ser un entero de 1 a 999 (piso de las Profundidades)'),
      cumple: (j, r, est, decl) => decl === undefined && !!j && !!j.prof && (j.prof.record | 0) >= r.n,
      texto: (r, j) => 'llegar al piso ' + r.n + ' de las Profundidades (tu récord: ' + ((j && j.prof && j.prof.record) | 0) + ')',
    },
  };
  // Dimensión a la que pertenece el hito de un requisito (null si no es un hito de dimensión: p. ej. el nivel de entrenador). Lo usa el Santuario para exigir que un aporte pida un hito de SU origen.
  function origenDe(r) {
    const d = plano(r) && Object.prototype.hasOwnProperty.call(REQ, r.t) ? REQ[r.t] : null; if (!d) return null;
    if (d.dim) return d.dim; return r.t === 'marca' || r.t === 'casco' || r.t === 'marea' ? (typeof r.dim === 'string' ? r.dim : null) : null;
  }
  const CLAVES = ['color', 'icono', 'nombre', 'requisitos'], MAX_REQ = 8;
  // Problemas de UN campo `portal` (vacía = bien). `opc.local` = lista de requisitos de un hito personal (Santuario): admite los tipos `local`; en un portal real se rechazan.
  function validar(p, opc) {
    if (!plano(p)) return ['«portal» debe ser un objeto'];
    const e = [];
    Object.keys(p).forEach((k) => { if (CLAVES.indexOf(k) < 0 && k[0] !== '_') e.push('portal: clave desconocida «' + k + '» (solo: ' + CLAVES.join(', ') + ')'); });
    if (p.color !== undefined && !(typeof p.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.color))) e.push('portal.color debe ser #rrggbb');
    if (p.icono !== undefined && !(typeof p.icono === 'string' && /^[a-z][a-z0-9_]{0,23}$/.test(p.icono))) e.push('portal.icono debe ser minúsculas, dígitos y _ (máx. 24)');
    if (p.nombre !== undefined && !(typeof p.nombre === 'string' && p.nombre.trim() && p.nombre.length <= 40)) e.push('portal.nombre debe ser un texto de 1 a 40 caracteres');
    if (p.requisitos !== undefined) {
      if (!Array.isArray(p.requisitos)) e.push('portal.requisitos debe ser una lista');
      else {
        if (p.requisitos.length > MAX_REQ) e.push('portal.requisitos: máximo ' + MAX_REQ);
        p.requisitos.forEach((r, i) => {
          const nom = 'requisito ' + (i + 1);
          if (!plano(r) || typeof r.t !== 'string') { e.push(nom + ': debe ser { t, … }'); return; }
          const d = Object.prototype.hasOwnProperty.call(REQ, r.t) ? REQ[r.t] : null;
          if (!d) { e.push(nom + ': tipo desconocido «' + r.t + '» (existen: ' + Object.keys(REQ).join(', ') + ')'); return; }
          if (d.local && !(opc && opc.local)) { e.push(nom + ': el tipo «' + r.t + '» es personal y no vale en un portal'); return; }
          Object.keys(r).forEach((k) => { if (d.claves.indexOf(k) < 0 && k[0] !== '_') e.push(nom + ': clave desconocida «' + k + '»'); });
          const m = d.validar(r); if (m) e.push(nom + ' (' + r.t + '): ' + m);
        });
      }
    }
    return e;
  }
  // ¿Puede cruzar este jugador? { ok, faltan: [texto…] }. Un requisito mal formado NO se cumple (cierra, nunca abre por error).
  function comprobar(j, p, est, decl) {   // F8: con `decl` (progreso declarado por el otro móvil) los requisitos personales se comprueban contra lo declarado; null = no declaró nada (se cierra)
    const faltan = [];
    if (plano(p) && Array.isArray(p.requisitos)) p.requisitos.forEach((r) => {
      const d = plano(r) && Object.prototype.hasOwnProperty.call(REQ, r.t) ? REQ[r.t] : null;
      let bien = false; try { bien = !!d && d.validar(r) === null && d.cumple(j, r, est, decl); } catch (x) { bien = false; }
      if (!bien) faltan.push(d && d.validar(r) === null ? d.texto(r, j, est) : 'un requisito que este juego no entiende');
    });
    return { ok: faltan.length === 0, faltan };
  }
  G.portales = { REQ, validar, comprobar, origenDe };
})(typeof window !== 'undefined' ? window : globalThis);
