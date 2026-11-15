// tienda.js — BRILLOS (✦), MOCHILA y OBJETOS (v2.315). Economía del juego: PURA, sin DOM ni azar ni relojes; todo vive en el estado del jugador (j.brillos, j.mochila) y se guarda con versión.
// Brillos = moneda blanda: solo se gana jugando (combates, pesca, hitos) y no se compra con dinero real. Toda transacción es una función determinista sobre `est`, para que un servidor pueda repetirla y validarla.
// Las esferas de captura siguen en j.esferas (combate_motor.js); aquí solo se compran. Las pociones NO se usan en combate (solo andando).
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), esNum = Number.isFinite;
  const INICIO = 100, TOPE = 9999999, MAX_ITEM = 99, MAX_ESF = 99;
  // ── Catálogo (datos, no código). tipo 'cura': suma `cura` PS · 'revive': devuelve a una debilitada con `frac` de su vida · 'esfera': suma esferas de captura ──
  const OBJ = {
    pocion:      { nombre: 'Poción',             tipo: 'cura',   cura: 150, precio: 40,  desc: 'Recupera 150 PS de una criatura herida.' },
    superpocion: { nombre: 'Superpoción',        tipo: 'cura',   cura: 400, precio: 110, desc: 'Recupera 400 PS de una criatura herida.' },
    revivir:     { nombre: 'Revivir',            tipo: 'revive', frac: 0.5,  precio: 180, desc: 'Despierta a una criatura debilitada con la mitad de su vida.' },
    esfera:      { nombre: 'Esfera de captura',  tipo: 'esfera', n: 1,       precio: 30,  desc: 'Sirve para capturar criaturas salvajes tras ganarles.' },
  };
  const TIENDA = ['pocion', 'superpocion', 'revivir', 'esfera'];   // qué vende la Tienda (stock ilimitado)
  const COSTE_CURAR = { herida: 8, debilitada: 20 };               // Centro PC: por criatura herida / debilitada

  const pez = (id) => (G.PECES && typeof id === 'string' && G.PECES[id]) || null;
  const existe = (id) => typeof id === 'string' && (Object.prototype.hasOwnProperty.call(OBJ, id) || !!pez(id));
  function nombre(id) { return OBJ[id] ? OBJ[id].nombre : pez(id) ? pez(id).nombre : String(id); }
  // Valor de un pescado: sube con la zona, la rareza (peso pequeño = raro) y el tamaño medio. Se vende entero; no se compra.
  const FACTOR_PEZ = [0.5, 0.35, 0.3];   // v2.350: el pescado de aguas medias/hondas rendía 3× más que combatir al empezar: se abarata más cuanto más hondo
  function precioPez(id, entrenador) { const p = pez(id); if (!p) return 0; const kg = (p.kg[0] + p.kg[1]) / 2; return Math.max(entrenador ? 3 : 2, Math.round((entrenador ? 1 : FACTOR_PEZ[p.zona | 0] || 0.3) * (6 + 5 * (p.zona | 0)) * Math.sqrt(kg) * Math.pow(30 / Math.max(1, p.peso), 0.35))); }
  // v2.349: los objetos cuestan un nº fijo de COMBATES del nivel del jugador (los premios crecen ~10×, los precios fijos se volvían regalo). Nunca bajan del precio base; vender sigue sobre el base.
  const COMBATES = { pocion: 2, superpocion: 5, esfera: 1.5, revivir: 8 };
  const ingresoNivel = (n) => { const c = Math.min(50, Math.round(1.4 * n + 0.6)); return premioCombate(c, c, 'comun'); };   // ✦ por combate contra un enemigo común de tu nivel (el nivel de criatura va ~1,4× el de entrenador)
  // F6 · factor de economía de la dimensión donde está el jugador (datos/dimensiones/<id>.json → economia.premios / precios). 1 en Tonavia: nada cambia.
  const ajustesDe = (j) => { try { if (!G.dimensiones || !G.dimensiones.ajustesDe || !j) return null; if (j.mapa) return G.dimensiones.ajustesDe(G.mundo.mapa(j.mapa)); return j.lug && G.agentes && G.agentes.nodoDe ? G.dimensiones.ajustesDe(G.agentes.nodoDe(j)) : null; } catch (e) { return null; } };   // F7: un entrenador autónomo (sin mapa; con lugar) usa los ajustes de su dimensión
  const factor = (j, k) => { const a = ajustesDe(j); return a && a[k] !== undefined ? a[k] : 1; };
  const escalar = (n, f) => (f === 1 ? n : Math.max(1, Math.round(n * f)));
  const precioCompra0 = (id, j) => (OBJ[id] ? Math.max(OBJ[id].precio, Math.round((COMBATES[id] || 0) * ingresoNivel(G.entrenador && j ? G.entrenador.nivel(j) : 1) / 5) * 5) : 0);
  const precioCompra = (id, j) => { const p = precioCompra0(id, j); return p ? escalar(p, factor(j, 'precios')) : 0; };   // F6: × precios de la dimensión
  const precioVenta = (id, entrenador) => (OBJ[id] ? Math.floor(OBJ[id].precio / 2) : pez(id) ? precioPez(id, entrenador) : 0);   // v2.349: los pescados valen la mitad para el jugador; los entrenadores NPC mantienen su mercado (su simulación no cambia)

  // ── Recompensas (funciones puras; el cliente no decide: las repite el motor/servidor) ──
  const RAR_PREMIO = { comun: 1, rara: 1.6, epica: 2.6, legendaria: 4 }, PREMIO_ESPECIE = 25;
  // Brillos por ganar un combate: crece con el nivel del rival y su rareza; baja si tu criatura le saca muchos niveles (sin farmeo fácil)
  function premioCombate(np, ne, rar) { ne = Math.max(1, ne | 0); const dif = Math.max(0, (np | 0) - ne), f = Math.max(0.2, 1 - 0.08 * dif); return Math.max(1, Math.round((6 + 2 * ne) * (RAR_PREMIO[rar] || 1) * f)); }
  // F6 · premio de un combate del jugador: el de siempre × el factor `premios` de su dimensión (1 en Tonavia). Los entrenadores autónomos siguen con premioCombate (F7).
  const premioDe = (j, np, ne, rar) => escalar(premioCombate(np, ne, rar), factor(j, 'premios'));
  // ── Estado del jugador ──
  const ESF0 = 5;   // esferas iniciales (las mismas que combate_motor.js)
  const saldo = (j) => (esNum(j && j.brillos) ? j.brillos : INICIO);                 // lectura sin tocar el estado (para la interfaz)
  const esferasDe = (j) => (j && j.esferas !== undefined ? j.esferas : ESF0);
  function brillos(j) { if (!esNum(j.brillos)) j.brillos = INICIO; return j.brillos; }
  function mochila(j) { if (!j.mochila || typeof j.mochila !== 'object') j.mochila = {}; return j.mochila; }
  const cuantos = (j, id) => (j && j.mochila && j.mochila[id]) | 0;
  function ganar(j, n) { n = Math.floor(n); if (!(n > 0)) return 0; const antes = brillos(j); j.brillos = Math.min(TOPE, antes + n); return j.brillos - antes; }
  function gastar(j, n) { n = Math.floor(n); if (!(n >= 0) || brillos(j) < n) return false; j.brillos -= n; return true; }
  function meter(j, id, n) { const m = mochila(j), antes = m[id] | 0; m[id] = Math.min(MAX_ITEM, antes + Math.max(0, Math.floor(n))); return m[id] - antes; }
  function sacar(j, id, n) { const m = mochila(j); if ((m[id] | 0) < n) return false; m[id] -= n; if (m[id] <= 0) delete m[id]; if (!Object.keys(m).length) delete j.mochila; return true; }

  // ── Vida de las criaturas ──
  function hpMax(j, forma) {
    const N = G.nivel, xp = j && j.prog && j.prog[forma] ? j.prog[forma].xp : 0, nv = N ? N.nivelDe(xp) : 1;
    const fe = String(forma).split('#')[0]; return G.combate.statsDe({ forma: fe, nivel: nv, tal: G.crianza ? G.crianza.talDe(j, fe) : null }).hpMax;   // v2.320: + talento de la cría activa
  }
  const vidaDe = (j, f) => (j && j.vida && typeof j.vida[f] === 'number' ? j.vida[f] : null);   // null = completa
  // Cuánto cobra el Centro PC por curar todo (se usa desde la v2.316); 0 si no hay heridas
  // v2.350: la cura del Centro PC también crece con el nivel (0,3 combates por criatura herida, 0,75 por debilitada; nunca bajo el base). Los entrenadores NPC (sin nivel) pagan el base.
  const costeCurar = (j) => { const ing = ingresoNivel(G.entrenador && j && j.xpE !== undefined ? G.entrenador.nivel(j) : 1); const f = factor(j, 'precios'); return { herida: escalar(Math.max(COSTE_CURAR.herida, Math.round(0.3 * ing)), f), debilitada: escalar(Math.max(COSTE_CURAR.debilitada, Math.round(0.75 * ing)), f) }; };   // F6: × precios de la dimensión
  function precioCurar(j) { const C = costeCurar(j); let t = 0; ((j && j.sinId) || []).forEach((q) => { if (typeof q.hp === 'number') t += q.hp <= 0 ? C.debilitada : C.herida; });   // v2.339: + lo que hay en la caja
    Object.keys((j && j.vida) || {}).forEach((f) => { if (typeof j.vida[f] === 'number') t += j.vida[f] <= 0 ? C.debilitada : C.herida; }); return t; }

  // ── Transacciones: devuelven { ok, motivo? } y avisan en est.avisos ──
  const aviso = (est, j, texto) => { if (est && est.avisos) est.avisos.push({ j: j.id, texto }); };
  const no = (est, j, motivo) => { aviso(est, j, motivo); return { ok: false, motivo }; };
  const enCombate = (est, j) => !!(est && est.combate && est.combate.jid === j.id);

  function comprar(est, j, id, n) {
    n = Math.floor(n === undefined ? 1 : n); if (!(n >= 1) || n > MAX_ITEM || TIENDA.indexOf(id) < 0) return no(est, j, 'Eso no se vende aquí');
    const o = OBJ[id], coste = precioCompra(id, j) * n;
    if (o.tipo === 'esfera') { const e = G.motor.combate.esferas(j); if (e + n * o.n > MAX_ESF) return no(est, j, 'No puedes llevar tantas esferas'); }
    else if (cuantos(j, id) + n > MAX_ITEM) return no(est, j, 'No te caben más ' + o.nombre.toLowerCase() + 's');
    if (!gastar(j, coste)) return no(est, j, 'No tienes suficientes Brillos');
    if (o.tipo === 'esfera') j.esferas = G.motor.combate.esferas(j) + n * o.n; else meter(j, id, n);
    aviso(est, j, 'Compras ' + (n > 1 ? n + ' ' : '') + o.nombre + ' (-' + coste + ' ✦)'); return { ok: true, coste };
  }
  function vender(est, j, id, n) {
    n = Math.floor(n === undefined ? 1 : n); if (!(n >= 1) || !existe(id) || !precioVenta(id)) return no(est, j, 'Eso no se puede vender');
    if (cuantos(j, id) < n) return no(est, j, 'No tienes tantos');
    const total = precioVenta(id) * n; sacar(j, id, n); const ganado = ganar(j, total);
    aviso(est, j, 'Vendes ' + (n > 1 ? n + ' ' : '') + nombre(id) + ' (+' + ganado + ' ✦)'); return { ok: true, ganado };
  }
  // Usar un objeto sobre una criatura (solo andando: nunca en pleno combate)
  function usar(est, j, id, forma) {
    const o = OBJ[id]; if (!o || (o.tipo !== 'cura' && o.tipo !== 'revive')) return no(est, j, 'Eso no se puede usar así');
    if (enCombate(est, j)) return no(est, j, 'No hay tiempo en pleno combate');
    if (cuantos(j, id) < 1) return no(est, j, 'No tienes ' + o.nombre.toLowerCase());
    if (!G.equipo || G.equipo.actual(j).indexOf(forma) < 0) return no(est, j, 'Esa criatura no va en tu equipo');
    const v = vidaDe(j, forma), mx = hpMax(j, forma), nom = G.combate.statsDe({ forma: String(forma).split('#')[0] }).nom;
    if (v === null || v >= mx) return no(est, j, nom + ' está en plena forma');
    if (o.tipo === 'cura' && v <= 0) return no(est, j, nom + ' está debilitada: necesita Revivir');
    if (o.tipo === 'revive' && v > 0) return no(est, j, nom + ' no está debilitada');
    const nuevo = o.tipo === 'revive' ? Math.max(1, Math.round(mx * o.frac)) : Math.min(mx, v + o.cura);
    sacar(j, id, 1); j.vida = j.vida || {}; if (nuevo >= mx) delete j.vida[forma]; else j.vida[forma] = nuevo; if (!Object.keys(j.vida).length) delete j.vida;
    if (G.equipo) G.equipo.sincronizar(est, j);   // si volvió la de delante, vuelve a acompañar
    aviso(est, j, nom + ' recupera ' + (nuevo - v) + ' PS'); return { ok: true, forma, ps: nuevo - v };
  }

  G.tienda = { premioDe, costeCurar, COMBATES, ingresoNivel, premioCombate, PREMIO_ESPECIE, saldo, esferasDe, OBJ, TIENDA, INICIO, TOPE, MAX_ITEM, MAX_ESF, COSTE_CURAR, existe, nombre, precioPez, precioCompra, precioVenta, precioCurar, brillos, mochila, cuantos, ganar, gastar, meter, sacar, hpMax, comprar, vender, usar };

  // ── Órdenes: comprar/vender solo junto al tendero de la Tienda; usar, andando ──
  if (G.motor) {
    const aplicar0 = G.motor.aplicar;
    G.motor.aplicar = function (est, o) {
      if (o && (o.t === 'comprar' || o.t === 'vender' || o.t === 'usar')) {
        const j = est.jugadores[o.j]; if (!j) throw new Error('orden de un jugador que no existe: ' + o.j);
        if (o.t === 'usar') return usar(est, j, o.id, o.forma);
        const n = G.npc && G.npc.cercano(est, j); if (!n || n.id !== 'tendero') return no(est, j, 'Aquí no hay quien te atienda');
        return o.t === 'comprar' ? comprar(est, j, o.id, o.n) : vender(est, j, o.id, o.n);
      }
      return aplicar0.call(G.motor, est, o);
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = G.tienda;
})(typeof window !== 'undefined' ? window : globalThis);
