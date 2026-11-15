// santuario.js — SANTUARIO UNIVERSAL · Etapa A (v2.364). Contrato: docs/multiverso/19_SANTUARIO_ETAPA_A.md. PURO: sin DOM, sin Math.random, sin relojes de pared; NO toca el azar de la partida (est.rnd).
// · Cada jugador tiene SU hogar dentro de la dimensión «santuario». El mapa del hogar NO es un archivo: se genera solo a partir de su id («santuario/hogar_<nivel>_<hábitats>_<jugador>»), así
//   dos móviles con el mismo id ven lo mismo, cada cambio de trazado cambia el id (ninguna caché queda vieja) y no hay mapas por jugador en el guardado ni en `dist`.
// · Un residente ES un ejemplar de la caja (j.sinId, ID permanente): aquí solo se guarda la asignación `ejemplar → hábitat` en est.dim.santuario.jugadores.<id> = { n, hab[], res{} }. Nada se duplica.
// · COMPORTAMIENTO SIN ESTADO: lo que hace cada criatura es una función pura de (semilla, ejemplar, reloj). El tiempo se corta en «tramos»; en cada uno la criatura pasea a un punto, descansa,
//   mira o duerme según su temperamento (datos) y la hora. No se guarda nada, no se gasta azar y no hay «puesta al día»: al volver, cada una está donde le toca.
// · Todo el contenido (niveles, hábitats, temperamentos, frases) sale de datos/santuario.json. Añadir un hábitat o el carácter de una especie nueva = añadir una entrada.
// Partes: A) datos · B) id y generador del hogar · C) estado por jugador · D) comportamiento · E) órdenes y lecturas · F) ganchos en el motor.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16, VERSION = 1, DIM = 'santuario', UMBRAL = DIM + '/umbral', PUERTA_HOGAR = 'hogar', PUERTA_CABANA = 'cabana', PUERTA_SALIDA = 'salida';
  const plano = (o) => !!o && typeof o === 'object' && !Array.isArray(o), ent = Number.isInteger, esNum = Number.isFinite;
  const cargar = (n) => (G.DATOS && G.DATOS[n]) || (typeof require === 'function' ? require('../datos/' + n + '.json') : null);
  const D = cargar('santuario'), mundo = G.mundo, motor = G.motor;
  const CASILLAS = (mundo && mundo.SOLIDO) || {}, JUG = /^[a-z][a-z0-9_]{0,15}$/, ACTS = ['pasear', 'descansar', 'mirar'];
  // mezcla entera (sin cadenas): el «azar» de cada criatura sale de aquí, nunca de est.rnd
  const mix = (a, b) => { let h = (a ^ Math.imul(b | 0, 0x9E3779B1)) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B); h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35); return (h ^ (h >>> 16)) >>> 0; };
  const hashTxt = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ───────────────────────── A) DATOS ─────────────────────────
  function validarDatos(d) {   // lista de problemas de datos/santuario.json (vacía = bien)
    const e = []; if (!plano(d)) return ['santuario.json: no es un objeto'];
    if (d.v !== 1) e.push('v debe ser 1');
    const hs = plano(d.habitats) ? d.habitats : {}, claves = {}, ids = Object.keys(hs), els = G.ELEMENTS || {};
    if (!ids.length) e.push('habitats: falta al menos uno');
    ids.forEach((id) => {
      const h = hs[id], c = 'habitats.' + id;
      if (!/^[a-z][a-z0-9_]{0,23}$/.test(id) || !plano(h)) { e.push(c + ': id o forma no válidos'); return; }
      if (typeof h.clave !== 'string' || !/^[a-z]$/.test(h.clave)) e.push(c + '.clave debe ser UNA letra minúscula'); else if (claves[h.clave]) e.push(c + '.clave «' + h.clave + '» repetida (' + claves[h.clave] + ')'); else claves[h.clave] = id;
      if (typeof h.nombre !== 'string' || !h.nombre || h.nombre.length > 24) e.push(c + '.nombre: texto de 1 a 24 letras');
      if (!els[h.elemento]) e.push(c + '.elemento desconocido («' + h.elemento + '»)');
      ['suelo', 'borde'].forEach((k) => { if (!(h[k] in CASILLAS) || CASILLAS[h[k]]) e.push(c + '.' + k + ' debe ser una casilla transitable'); });
      if (!(h.rasgo in CASILLAS)) e.push(c + '.rasgo debe ser una de las 17 casillas');
    });
    if (!hs[d.habitatInicial]) e.push('habitatInicial debe ser un hábitat que exista');
    const ns = Array.isArray(d.niveles) ? d.niveles : [];
    if (ns.length < 1 || ns.length > 9) e.push('niveles: de 1 a 9');
    ns.forEach((n, i) => {
      const c = 'niveles[' + (i + 1) + ']'; if (!plano(n)) { e.push(c + ': no es un objeto'); return; }
      ['ancho', 'alto', 'filas', 'pw', 'ph', 'solares', 'habitats', 'residentes'].forEach((k) => { if (!ent(n[k]) || n[k] < 0) e.push(c + '.' + k + ' debe ser un entero ≥ 0'); });
      if (e.length) return;
      if (typeof n.nombre !== 'string' || !n.nombre) e.push(c + '.nombre: falta');
      if (n.ancho < 24 || n.alto < 18 || n.ancho > 64 || n.alto > 64 || n.ancho % 2) e.push(c + ': tamaño de 24×18 a 64×64, ancho par');
      if (n.pw < 6 || n.ph < 4) e.push(c + ': la parcela mide al menos 6×4');
      if ((n.ancho >> 1) + 2 + n.pw > n.ancho - 2) e.push(c + ': la parcela no cabe a lo ancho');
      if (n.filas < 1 || 10 + n.filas * (n.ph + 1) - 1 > n.alto - 2) e.push(c + ': las filas de parcelas no caben a lo alto');
      if (n.habitats < 1 || n.habitats > 12 || n.solares + n.habitats !== n.filas * 2) e.push(c + ': solares + habitats debe ser filas × 2 (y de 1 a 12 hábitats)');
      if (n.residentes < 1 || n.residentes > 300) e.push(c + '.residentes: de 1 a 300 (tope de la caja)');
      if (i > 0 && plano(ns[i - 1]) && (n.habitats < ns[i - 1].habitats || n.residentes < ns[i - 1].residentes)) e.push(c + ': un nivel no puede dar menos que el anterior');
    });
    const R = d.ritmo; if (!plano(R) || !(R.tramo >= 2 && R.tramo <= 60) || !Array.isArray(R.noche) || R.noche.length !== 2 || !Array.isArray(R.siesta) || R.siesta.length !== 2 || !ent(R.obligado) || R.obligado < 2 || R.obligado > 8 || !(R.alcance > 0) || !(R.persecucion >= 1)) e.push('ritmo: tramo (2-60), noche y siesta [desde, hasta], obligado (2-8), alcance y persecucion');
    const tp = d.temperamentos, tOk = (t, c, completo) => { if (!plano(t)) { e.push(c + ': no es un objeto'); return; } ACTS.forEach((a) => { if (t[a] !== undefined ? !(esNum(t[a]) && t[a] >= 0 && t[a] <= 100) : completo) e.push(c + '.' + a + ': peso de 0 a 100'); }); if (t.calma !== undefined ? !(t.calma >= 0.4 && t.calma <= 3) : completo) e.push(c + '.calma: de 0,4 a 3'); if (t.nocturna !== undefined && typeof t.nocturna !== 'boolean') e.push(c + '.nocturna: true o false'); };
    if (!plano(tp)) e.push('temperamentos: falta'); else {
      tOk(tp.base, 'temperamentos.base', true); if (plano(tp.base) && !(tp.base.pasear > 0)) e.push('temperamentos.base.pasear debe ser mayor que 0');
      [['elemento', (k) => !!els[k]], ['linea', (k) => !G.CREATURES || Object.values(G.CREATURES).some((c) => c.family === k)], ['forma', (k) => !G.CREATURES || !!G.CREATURES[k]]].forEach(([grupo, existe]) => { const o = tp[grupo]; if (o === undefined) return; if (!plano(o)) { e.push('temperamentos.' + grupo + ': no es un objeto'); return; } Object.keys(o).forEach((k) => { if (!existe(k)) e.push('temperamentos.' + grupo + '.' + k + ': no existe'); tOk(o[k], 'temperamentos.' + grupo + '.' + k, false); }); });
    }
    if (!plano(d.acceso) || typeof d.acceso.mapa !== 'string' || !d.acceso.mapa || typeof d.acceso.puerta !== 'string' || !d.acceso.puerta) e.push('acceso: mapa y puerta por los que se llega al Umbral');
    ns.forEach((n, i) => { if (i > 0 && plano(n) && !(plano(n.coste) && n.coste.combates > 0 && n.coste.combates <= 2000 && ent(n.coste.minimo) && n.coste.minimo >= 0)) e.push('niveles[' + (i + 1) + '].coste: combates (>0) y minimo'); });
    ids.forEach((id) => { if (plano(hs[id]) && !(ent(hs[id].nivel) && hs[id].nivel >= 1 && hs[id].nivel <= Math.max(1, ns.length))) e.push('habitats.' + id + '.nivel: nivel de Santuario desde el que se puede elegir'); });
    if (plano(hs[d.habitatInicial]) && hs[d.habitatInicial].nivel !== 1) e.push('habitatInicial debe poder elegirse desde el nivel 1');
    if (!plano(d.cambioHabitat) || !(d.cambioHabitat.combates >= 0) || !ent(d.cambioHabitat.minimo) || d.cambioHabitat.minimo < 0) e.push('cambioHabitat: combates y minimo');
    const so = d.social; if (!plano(so) || !(so.bloque >= 6 && so.bloque <= 120) || !(so.base >= 0 && so.base <= 1) || !(so.dias >= 1) || !esNum(so.recelo) || !Array.isArray(so.niveles) || !so.niveles.length || so.niveles.some((n, i) => !plano(n) || typeof n.nombre !== 'string' || !esNum(n.desde) || (i > 0 && n.desde <= so.niveles[i - 1].desde))) e.push('social: bloque (6-120), base (0-1), dias, recelo y niveles con «desde» creciente');
    const rg = d.rasgos; if (!plano(rg) || !Object.keys(rg).length || Object.keys(rg).some((k) => !plano(rg[k]) || typeof rg[k].nombre !== 'string' || !rg[k].nombre || ['pasear', 'descansar', 'mirar', 'calma', 'social'].some((q) => rg[k][q] !== undefined && !(esNum(rg[k][q]) && Math.abs(rg[k][q]) <= 10)))) e.push('rasgos: cada uno con nombre y ajustes numéricos');
    const DONES = ['cura', 'vinculo', 'tope', 'eficiencia', 'encuentros', 'techo', 'concordia'], EFECTOS = ['tope', 'cura', 'vinculo', 'vivencias', 'expedicion'], cat = (G.capas && G.capas.OBJETOS) || null;
    ids.forEach((id) => { const h = hs[id]; if (!plano(h)) return; if (!plano(h.don) || DONES.indexOf(h.don.tipo) < 0 || !(esNum(h.don.valor) && h.don.valor > 0 && h.don.valor <= 5) || typeof h.don.texto !== 'string' || !h.don.texto) e.push('habitats.' + id + '.don: tipo (' + DONES.join(', ') + '), valor y texto');
      const a = h.actividad; if (!plano(a) || typeof a.frase !== 'string' || !a.frase || typeof a.emo !== 'string' || !(a.peso >= 0 && a.peso <= 20) || !(a.afin >= 0 && a.afin <= 20)) e.push('habitats.' + id + '.actividad: frase, emo, peso y afin'); });
    const ins = d.instalaciones, cl = {}; if (!plano(ins)) e.push('instalaciones: falta'); else Object.keys(ins).forEach((id) => { const q = ins[id], c = 'instalaciones.' + id; if (!/^[a-z][a-z0-9_]{0,23}$/.test(id) || !plano(q)) { e.push(c + ': id o forma no válidos'); return; }
      if (typeof q.clave !== 'string' || !/^[1-9]$/.test(q.clave) || cl[q.clave]) e.push(c + '.clave: UN dígito 1-9 sin repetir'); else cl[q.clave] = id;
      if (typeof q.nombre !== 'string' || !q.nombre || typeof q.texto !== 'string' || !q.texto) e.push(c + ': nombre y texto'); if (!(ent(q.nivel) && q.nivel >= 1 && q.nivel <= Math.max(1, ns.length))) e.push(c + '.nivel');
      if (!(plano(q.coste) && q.coste.combates > 0 && ent(q.coste.minimo) && q.coste.minimo >= 0)) e.push(c + '.coste: combates y minimo'); if (!plano(q.efecto) || EFECTOS.indexOf(q.efecto.tipo) < 0 || !(q.efecto.valor > 0 && q.efecto.valor <= 5)) e.push(c + '.efecto: tipo (' + EFECTOS.join(', ') + ') y valor'); else if ((q.efecto.tipo === 'expedicion') !== (q.efecto.donde !== undefined) || (q.efecto.donde !== undefined && !(typeof q.efecto.donde === 'string' && (q.efecto.donde === 'profundidades' ? q.origen === 'tonavia' : q.efecto.donde === q.origen)))) e.push(c + '.efecto: «expedicion» lleva «donde» (la dimensión de su origen, o «profundidades» si el origen es tonavia) y ningún otro tipo lo lleva');
      if (!(q.suelo in CASILLAS) || CASILLAS[q.suelo]) e.push(c + '.suelo debe ser transitable'); if (!Array.isArray(q.objetos) || q.objetos.length > 6 || q.objetos.some((o) => !Array.isArray(o) || (cat && !cat[o[0]]) || !ent(o[1]) || !ent(o[2]) || Math.abs(o[1]) > 3 || Math.abs(o[2]) > 1)) e.push(c + '.objetos: [tipo del catálogo, dx (±3), dy (±1)], 6 como mucho'); });
    const en = d.entrenamiento; if (!plano(en) || !(en.dosis > 0 && en.dosis <= 5) || !(en.afin >= 0 && en.afin <= 1) || !Array.isArray(en.amistad) || en.amistad.length !== (plano(so) && Array.isArray(so.niveles) ? so.niveles.length + 1 : 0) || en.amistad.some((x) => !(x >= 0 && x <= 0.5)) || !(en.ritmo >= 5 && en.ritmo <= 600) || !Array.isArray(en.vivencias) || en.vivencias.length !== ns.length || en.vivencias.some((x) => !(ent(x) && x > 0))) e.push('entrenamiento: dosis, afin, amistad (uno por nivel de relación + 1), ritmo y vivencias (una por nivel)');
    if (plano(d.frases) && typeof d.frases.aprende !== 'string') e.push('frases.aprende: falta');
    if (plano(d.frases) && ['jugar', 'juntas', 'saludo', 'recelo'].some((a) => typeof d.frases[a] !== 'string' || d.frases[a].indexOf('{con}') < 0)) e.push('frases: jugar, juntas, saludo y recelo llevan {con}');
    if (!plano(d.frases) || ACTS.concat('dormir').some((a) => typeof d.frases[a] !== 'string' || !d.frases[a])) e.push('frases: falta la de pasear, descansar, mirar o dormir');
    // DECORACIÓN (B4): piezas 1×1 del catálogo, clave de una letra única, huecos «plaza» y/o «borde». Opcional (sin ella no hay decoración).
    if (d.decoracion !== undefined) { const pz = plano(d.decoracion) ? d.decoracion.piezas : null, cd = {}; if (!plano(pz) || !Object.keys(pz).length || Object.keys(pz).length > 26) e.push('decoracion.piezas: de 1 a 26 piezas'); else Object.keys(pz).forEach((id) => { const q = pz[id], c = 'decoracion.piezas.' + id; if (!/^[a-z][a-z0-9_]{0,23}$/.test(id) || !plano(q)) { e.push(c + ': id o forma no válidos'); return; }
      if (typeof q.clave !== 'string' || !/^[a-z]$/.test(q.clave) || cd[q.clave]) e.push(c + '.clave: UNA letra minúscula sin repetir'); else cd[q.clave] = id; if (typeof q.nombre !== 'string' || !q.nombre || q.nombre.length > 24) e.push(c + '.nombre: texto de 1 a 24 letras');
      const O = cat && cat[q.objeto]; if (!O || JSON.stringify(O.huella) !== '[[0,0,1,1]]') e.push(c + '.objeto: pieza del catálogo de huella 1×1'); if (!(ent(q.nivel) && q.nivel >= 1 && q.nivel <= Math.max(1, ns.length))) e.push(c + '.nivel');
      if (!(plano(q.coste) && q.coste.combates > 0 && ent(q.coste.minimo) && q.coste.minimo >= 0)) e.push(c + '.coste: combates y minimo'); if (!Array.isArray(q.donde) || !q.donde.length || q.donde.some((k) => k !== 'plaza' && k !== 'borde')) e.push(c + '.donde: «plaza» y/o «borde»'); }); }
    // APORTES de otras dimensiones (B3, v2.367): `origen` + `req`. Un aporte pide siempre un hito de SU dimensión y no supera el valor máximo de su tipo en el contenido base (lateral, no vertical). Contrato: docs/multiverso/21_SANTUARIO_APORTES.md
    { const P = G.portales, dims = G.dimensiones, tope = {}, aportes = [];
      ids.forEach((id) => { const h = hs[id]; if (plano(h)) { if (h.origen === undefined && h.req === undefined && plano(h.don)) tope[h.don.tipo] = Math.max(tope[h.don.tipo] || 0, h.don.valor || 0); else aportes.push(['habitats.' + id, h, h.don]); } });
      if (plano(ins)) Object.keys(ins).forEach((id) => { const q = ins[id]; if (plano(q)) { if (q.origen === undefined && q.req === undefined && plano(q.efecto)) tope[q.efecto.tipo] = Math.max(tope[q.efecto.tipo] || 0, q.efecto.valor || 0); else aportes.push(['instalaciones.' + id, q, q.efecto]); } });
      if (plano(d.decoracion) && plano(d.decoracion.piezas)) Object.keys(d.decoracion.piezas).forEach((id) => { const q = d.decoracion.piezas[id]; if (plano(q) && (q.origen !== undefined || q.req !== undefined)) aportes.push(['decoracion.piezas.' + id, q, undefined]); });
      aportes.forEach(([c, q, ef]) => {
        if (typeof q.origen !== 'string' || !dims || !dims.existe(q.origen)) { e.push(c + '.origen: id de una dimensión instalada (un aporte siempre viene de una)'); return; }
        if (!Array.isArray(q.req) || !q.req.length) { e.push(c + '.req: lista con al menos un requisito (un aporte sin hito no está conectado a nada)'); return; }
        const pr = P ? P.validar({ requisitos: q.req }, { local: true }) : ['G.portales no está cargado']; if (pr.length) { pr.forEach((m) => e.push(c + '.req: ' + m)); return; }
        if (!q.req.some((r) => P.origenDe(r) === q.origen)) e.push(c + '.req: debe incluir un hito de «' + q.origen + '» (marca de esa dimensión, profundidad para tonavia, casco o marea con su «dim»)');
        if (plano(ef)) { const v = ef.valor !== undefined ? ef.valor : 0, techo = tope[ef.tipo] !== undefined ? tope[ef.tipo] : (ef.tipo === 'expedicion' ? 1 : 0); if (ef.tipo !== undefined && v > techo) e.push(c + ': un aporte no puede superar el máximo de su tipo en el contenido base (' + ef.tipo + ' ≤ ' + techo + ')'); }
      }); }
    if (d.cabana !== undefined) {   // B5 (v2.369): la cabaña por dentro. Todo en datos; se comprueba que cada pieza cabe, no se pisan y TODO el suelo libre se recorre desde la puerta
      const cb = d.cabana, c = 'cabana', OB = G.capas && G.capas.OBJETOS ? G.capas.OBJETOS : {}, ent = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
      if (!plano(cb)) e.push(c + ': debe ser un objeto'); else {
        const W = cb.ancho, H = cb.alto; if (!ent(W, 7, 21) || !ent(H, 6, 14)) e.push(c + '.ancho/alto: enteros (ancho 7-21, alto 6-14)');
        else {
          if (!OB[cb.sala] || !OB[cb.sala].interior || OB[cb.sala].huella.length) e.push(c + '.sala debe ser una sala de interior del catálogo'); if (typeof cb.tema !== 'string' || !cb.tema) e.push(c + '.tema: texto');
          const lleno = new Set(), dentro = (x, y) => x >= 1 && y >= 2 && x <= W - 2 && y <= H - 2, pon = (x, y, w, h, q) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { if (!dentro(i, j)) { e.push(c + '.' + q + ': se sale del suelo'); return; } if (lleno.has(i + ',' + j)) { e.push(c + '.' + q + ': pisa otra pieza'); return; } lleno.add(i + ',' + j); } };
          if (!plano(cb.puerta) || !ent(cb.puerta.x, 1, W - 2) || !Array.isArray(cb.entrada) || cb.entrada.length !== 2 || cb.entrada[0] !== cb.puerta.x || cb.entrada[1] !== H - 2) e.push(c + '.puerta/entrada: la puerta está en la fila de abajo y la entrada justo encima');
          if (!Array.isArray(cb.puerta && cb.puerta.fuera) || cb.puerta.fuera.length !== 2 || !ent(cb.puerta.fuera[0], 0, 99) || !ent(cb.puerta.fuera[1], 0, 99)) e.push(c + '.puerta.fuera: [x, y] del hogar donde apareces al salir (relativo al eje: x = columna de la puerta del hogar, no se usa)');
          if (!plano(cb.camas) || !['oli', 'lali', 'otro'].every((k) => OB[cb.camas[k]] && OB[cb.camas[k]].huella.length === 1)) e.push(c + '.camas: oli, lali y otro (piezas de una sola huella)');
          if (!plano(cb.archivera) || !ent(cb.archivera.x, 1, W - 2) || !ent(cb.archivera.y, 2, H - 2)) e.push(c + '.archivera: {x, y} dentro del suelo'); else pon(cb.archivera.x, cb.archivera.y, 1, 1, 'archivera');
          if (!Array.isArray(cb.muebles) || !cb.muebles.length || cb.muebles.length > 24) e.push(c + '.muebles: de 1 a 24'); else cb.muebles.forEach((m, i) => {
            const q = c + '.muebles[' + i + ']'; if (!plano(m) || !ent(m.x, 0, 99) || !ent(m.y, 0, 99)) { e.push(q + ': {tipo, x, y}'); return; }
            const hu = m.tipo === 'cama' ? OB[cb.camas && cb.camas.oli] : OB[m.tipo]; if (!hu || !hu.interior || !Array.isArray(hu.huella) || hu.huella.length !== 1) { e.push(q + '.tipo: pieza del catálogo con una sola huella (o «cama»)'); return; }
            if (m.accion !== undefined && ['libro', 'aportes'].indexOf(m.accion) < 0) e.push(q + '.accion: libro o aportes'); pon(m.x, m.y, hu.huella[0][2], hu.huella[0][3], 'muebles[' + i + ']'); });
          if (lleno.has(cb.entrada && cb.entrada.join())) e.push(c + '.entrada: hay una pieza encima');
          if (!e.some((t) => t.indexOf(c + '.') === 0)) { const vis = new Set([cb.entrada.join()]), cola = [cb.entrada.slice()]; while (cola.length) { const [x, y] = cola.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (dentro(x + a, y + b) && !lleno.has(k) && !vis.has(k)) { vis.add(k); cola.push([x + a, y + b]); } }); }
            if (vis.size !== (W - 2) * (H - 3) - lleno.size) e.push(c + ': hay casillas de suelo libres a las que no se llega (todo el interior debe poder recorrerse)'); } } } }
    return e;
  }
  const errores = D ? validarDatos(D) : ['falta datos/santuario.json'];
  if (errores.length || !mundo || !motor) { G.santuario = { activo: false, errores, validarDatos, DIM }; if (typeof module !== 'undefined' && module.exports) module.exports = G.santuario; return; }
  const NIV = D.niveles, HAB = D.habitats, RIT = D.ritmo, INS = D.instalaciones, EN = D.entrenamiento, PIE = (D.decoracion || {}).piezas || {}, POR_CLAVE = {}, INS_CLAVE = {}, PIE_CLAVE = {}; Object.keys(HAB).forEach((id) => { POR_CLAVE[HAB[id].clave] = id; }); Object.keys(INS).forEach((id) => { INS_CLAVE[INS[id].clave] = id; }); Object.keys(PIE).forEach((id) => { PIE_CLAVE[PIE[id].clave] = id; });
  const nivelDe = (n) => NIV[Math.max(1, Math.min(NIV.length, n | 0)) - 1];
  const cupoHab = (n) => { const N = nivelDe(n); return Math.ceil(N.residentes / N.habitats); };

  // ───────────────────────── B) ID Y GENERADOR DEL HOGAR ─────────────────────────
  const RXA = /^santuario\/hogar_([1-9])_([a-z0-9]{1,12})(?:_i([0-9]{1,4}))?(?:_d([a-z0-9]{1,16}))?_([a-z][a-z0-9_]{0,15})$/;   // hábitats · [_i instalaciones] · [_d decoración] · jugador
  // Decoración (B4): huecos fijos del trazado. Plaza: 4 (junto a la cabaña, sobre el camino). Por cada fila de parcelas: 2 (a los lados de la avenida, sobre la hierba). Orden estable: subir de nivel solo AÑADE huecos al final.
  const nHuecos = (n) => 4 + 2 * nivelDe(n).filas;
  function idHogarDe(n, tipos, jug, ins, dec) { const ci = (ins || []).map((t) => (INS[t] ? INS[t].clave : '0')).join(''), cd = (dec || []).map((t) => (PIE[t] ? PIE[t].clave : '0')).join(''); return DIM + '/hogar_' + n + '_' + tipos.map((t) => (HAB[t] ? HAB[t].clave : '0')).join('') + (/[1-9]/.test(ci) ? '_i' + ci : '') + (/[a-z]/.test(cd) ? '_d' + cd : '') + '_' + jug; }
  function analizar(id) {   // id → { n, tipos[], jug } o null (un id que no cuadra con los datos NO es un hogar: no se genera nada)
    if (typeof id !== 'string') return null; const m = RXA.exec(id); if (!m) return null; const n = +m[1]; if (n > NIV.length || m[2].length !== NIV[n - 1].habitats) return null;
    const tipos = [], ins = [], dec = []; for (const ch of m[2]) { if (ch === '0') tipos.push(null); else if (POR_CLAVE[ch]) tipos.push(POR_CLAVE[ch]); else return null; }
    if (m[3] !== undefined) { if (m[3].length !== NIV[n - 1].solares || !/[1-9]/.test(m[3])) return null; for (const ch of m[3]) { if (ch === '0') ins.push(null); else if (INS_CLAVE[ch]) ins.push(INS_CLAVE[ch]); else return null; } } else for (let i = 0; i < NIV[n - 1].solares; i++) ins.push(null);
    if (m[4] !== undefined) { if (m[4].length !== nHuecos(n) || !/[a-z]/.test(m[4])) return null; for (const ch of m[4]) { if (ch === '0') dec.push(null); else if (PIE_CLAVE[ch]) dec.push(PIE_CLAVE[ch]); else return null; } } else for (let i = 0; i < nHuecos(n); i++) dec.push(null);
    return { n, tipos, ins, dec, jug: m[5] };
  }
  const esHogar = (id) => typeof id === 'string' && id.charCodeAt(DIM.length + 1) === 104 && id.indexOf(DIM + '/hogar_') === 0 && !!analizar(id);
  // Cabaña (B5): interior de la fachada del hogar. Su id solo lleva al jugador: no cambia al decorar, construir ni ampliar (así el panel de Residentes funciona dentro y nunca te echa).
  const CAB = D.cabana || null, RXC = /^santuario\/cabana_([a-z][a-z0-9_]{0,15})$/;
  const analizarCab = (id) => { if (!CAB || typeof id !== 'string') return null; const m = RXC.exec(id); return m ? { jug: m[1] } : null; };
  const esCabana = (id) => typeof id === 'string' && id.indexOf(DIM + '/cabana_') === 0 && !!analizarCab(id);
  const idCabana = (jug) => DIM + '/cabana_' + jug;
  const enSantuario = (id) => typeof id === 'string' && id.indexOf(DIM + '/') === 0;
  const cache = Object.create(null);
  // Trazado (primero la distribución, después se construye): bosque de 2 casillas alrededor · cabaña arriba en el eje · placita delante · avenida por el eje hasta la puerta del sur ·
  // parcelas a los dos lados de la avenida, por filas (los primeros «solares» quedan reservados a instalaciones; el resto son hábitats, en el orden de sus huecos).
  function trazar(id) {
    if (cache[id]) return cache[id]; const a = analizar(id); if (!a) return null;
    const N = NIV[a.n - 1], W = N.ancho, H = N.alto, cx = W >> 1, g = [], objetos = [], pon = (x, y, ch) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = ch; };
    for (let y = 0; y < H; y++) { g.push([]); for (let x = 0; x < W; x++) g[y].push(x < 2 || y < 2 || x >= W - 2 || y >= H - 2 ? 't' : (mix(x * 7349 + y * 9151, a.n) % 11 === 0 ? 'f' : '.')); }
    for (let y = 2; y <= 6; y++) for (let x = cx - 2; x <= cx + 2; x++) pon(x, y, '.');   // bajo la cabaña, césped liso
    objetos.push({ tipo: 'casa', x: cx - 2, y: 2 }); pon(cx, 6, '=');
    for (let y = 7; y <= 8; y++) for (let x = cx - 4; x <= cx + 4; x++) pon(x, y, '=');
    for (let y = 9; y <= H - 2; y++) pon(cx, y, '=');
    [cx - 5, cx + 5].forEach((x) => { pon(x, 7, '.'); objetos.push({ tipo: 'farola', x, y: 7 }); });
    [[3, 3], [W - 4, 3]].concat(W >= 40 ? [[6, 5], [W - 7, 5]] : []).forEach(([x, y]) => { pon(x, y, '.'); objetos.push({ tipo: 'arbol_mediano', x, y }); });
    const parcelas = [], habitats = [], solares = [];
    for (let f = 0; f < N.filas; f++) { const y0 = 10 + f * (N.ph + 1); parcelas.push({ x: cx - 1 - N.pw, y: y0, w: N.pw, h: N.ph, lado: 'izq' }, { x: cx + 2, y: y0, w: N.pw, h: N.ph, lado: 'der' }); if (f > 0) { const x = f % 2 ? cx - 1 : cx + 1; pon(x, y0 - 1, '.'); objetos.push({ tipo: 'farola', x, y: y0 - 1 }); } }
    parcelas.forEach((p, i) => {
      const slot = i - N.solares, tipo = slot >= 0 ? a.tipos[slot] : null, h = tipo ? HAB[tipo] : null, x1 = p.x + p.w - 1, y1 = p.y + p.h - 1;
      for (let y = p.y; y <= y1; y++) for (let x = p.x; x <= x1; x++) { const orilla = x === p.x || y === p.y || x === x1 || y === y1; pon(x, y, h ? (orilla ? h.borde : h.suelo) : (orilla ? 'f' : '.')); }
      if (!h) { const so = { x: p.x, y: p.y, w: p.w, h: p.h, lado: p.lado, slot: slot >= 0 ? slot : undefined }, q = slot < 0 ? INS[a.ins[i]] : null; solares.push(so);
        if (q) { so.ins = a.ins[i]; const mx = p.x + (p.w >> 1), my = p.y + (p.h >> 1) - 1; for (let y = p.y + 1; y <= y1 - 1; y++) for (let x = p.x + 1; x <= x1 - 1; x++) pon(x, y, q.suelo); q.objetos.forEach((o) => objetos.push({ tipo: o[0], x: mx + o[1], y: my + o[2] })); }
        return; }
      const rx = p.lado === 'der' ? x1 - 2 : p.x + 1; for (let y = p.y + 1; y <= y1 - 1; y++) for (let x = rx; x <= rx + 1; x++) pon(x, y, h.rasgo);
      const duro = !!CASILLAS[h.rasgo], px0 = duro && p.lado === 'izq' ? p.x + 3 : p.x, px1 = duro && p.lado === 'der' ? x1 - 3 : x1, celdas = [];
      for (let y = p.y; y <= y1; y++) for (let x = px0; x <= px1; x++) celdas.push([x, y]);
      const puntos = []; for (let y = p.y + 1; y <= y1 - 1; y++) { if (duro) puntos.push([p.lado === 'der' ? px1 : px0, y]); else { puntos.push([rx, y]); puntos.push([rx + 1, y]); } }   // donde se hace la actividad propia: pegadas al rincón (o encima, si se puede pisar)
      habitats[slot] = { slot, tipo, nombre: h.nombre, elemento: h.elemento, x: p.x, y: p.y, w: p.w, h: p.h, lado: p.lado, paseo: { x: px0, y: p.y, w: px1 - px0 + 1, h: p.h }, celdas, puntos, haciaRasgo: p.lado === 'der' ? 'right' : 'left' };
    });
    const huecos = [[cx - 3, 7, 'plaza', 'Plaza · izquierda arriba'], [cx + 3, 7, 'plaza', 'Plaza · derecha arriba'], [cx - 3, 8, 'plaza', 'Plaza · izquierda abajo'], [cx + 3, 8, 'plaza', 'Plaza · derecha abajo']];
    for (let f = 0; f < N.filas; f++) { const y0 = 10 + f * (N.ph + 1); huecos.push([cx - 1, y0 + 1, 'borde', 'Avenida ' + (f + 1) + ' · izquierda'], [cx + 1, y0 + N.ph - 2, 'borde', 'Avenida ' + (f + 1) + ' · derecha']); }
    const decor = huecos.map((h, i) => { const t = a.dec[i], q = t ? PIE[t] : null; if (q) objetos.push({ tipo: q.objeto, x: h[0], y: h[1] }); return { d: i, x: h[0], y: h[1], donde: h[2], nombre: h[3], pieza: q ? t : null }; });
    const nombreJug = a.jug.charAt(0).toUpperCase() + a.jug.slice(1), crudo = {
      formato: 2, id, nombre: N.nombre + ' de ' + nombreJug, region: null, ancho: W, alto: H, capas: { suelo: g.map((f) => f.join('')) }, objetos, animar: true,
      anclas: Object.assign({ inicio: [cx, H - 4], entrada: [cx, H - 4] }, CAB ? { cabana: [cx, 7] } : {}),
      puertas: [{ id: PUERTA_SALIDA, x: cx, y: H - 2, destino: { mapa: UMBRAL, ancla: PUERTA_HOGAR }, portal: { color: '#8fe0a8', icono: 'hoja', nombre: 'Umbral del Santuario' } }].concat(CAB ? [{ id: PUERTA_CABANA, x: cx, y: 6, destino: { mapa: idCabana(a.jug), ancla: 'entrada' } }] : []),
      conexiones: { norte: null, sur: null, este: null, oeste: null }, zonas: [],
      npcs: [{ id: 'cuidador', tipo: 'npc', nombre: 'Cuidador Brezo', x: cx + 2, y: 7, dir: 'down', alcance: 2.2 }],
    };
    return (cache[id] = { id, n: a.n, jug: a.jug, tipos: a.tipos, ins: a.ins, dec: a.dec, decor, W, H, cx, nivel: N, habitats, solares, crudo });
  }
  const cacheC = Object.create(null);
  function trazarCab(id) {   // la cabaña por dentro: sala fija (datos) + cama del color de su dueño + Lirio. No depende del estado: mismo id, mismo mapa
    if (cacheC[id]) return cacheC[id]; const a = analizarCab(id); if (!a) return null;
    const W = CAB.ancho, H = CAB.alto, fila = (y) => (y < 2 || y === H - 1 ? '#'.repeat(W) : '#' + '_'.repeat(W - 2) + '#'), suelo = []; for (let y = 0; y < H; y++) suelo.push(fila(y));
    suelo[H - 1] = suelo[H - 1].slice(0, CAB.puerta.x) + 'd' + suelo[H - 1].slice(CAB.puerta.x + 1);
    const objetos = [{ tipo: CAB.sala, x: 0, y: 0 }], muebles = []; CAB.muebles.forEach((m) => { const tipo = m.tipo === 'cama' ? (CAB.camas[a.jug] || CAB.camas.otro) : m.tipo, hu = G.capas.OBJETOS[tipo].huella[0]; objetos.push({ tipo, x: m.x, y: m.y }); muebles.push({ tipo, x: m.x, y: m.y, w: hu[2], h: hu[3], accion: m.accion || null }); });
    const nombreJug = a.jug.charAt(0).toUpperCase() + a.jug.slice(1);
    const crudo = { formato: 2, id, nombre: 'Cabaña de ' + nombreJug, region: null, tema: CAB.tema, ancho: W, alto: H, capas: { suelo }, objetos, animar: false, anclas: { inicio: CAB.entrada.slice(), entrada: CAB.entrada.slice() },
      puertas: [{ id: PUERTA_SALIDA, x: CAB.puerta.x, y: H - 1, destino: { mapa: UMBRAL, ancla: PUERTA_HOGAR } }],   // el destino real lo decide cruzar: siempre el hogar ACTUAL del jugador (su id cambia con cada decoración)
      conexiones: { norte: null, sur: null, este: null, oeste: null }, zonas: [], npcs: [{ id: 'archivera', tipo: 'npc', nombre: 'Archivera Lirio', x: CAB.archivera.x, y: CAB.archivera.y, dir: 'down', alcance: CAB.archivera.alcance || 2.1, dy: -12 }] };
    return (cacheC[id] = { id, jug: a.jug, W, H, muebles, crudo });
  }
  const generarCab = (id) => { const p = trazarCab(id); return p ? JSON.parse(JSON.stringify(p.crudo)) : null; };
  const generar = (id) => { const p = trazar(id); return p ? JSON.parse(JSON.stringify(p.crudo)) : null; };
  const proveedor = { tiene: (id) => !!analizar(id) || !!analizarCab(id), cargar: (id) => (analizarCab(id) ? generarCab(id) : generar(id)), ids: () => [], liberar(dim) { if (dim === DIM) { Object.keys(cache).forEach((k) => { delete cache[k]; }); Object.keys(cacheC).forEach((k) => { delete cacheC[k]; }); } } };

  // ───────────────────────── C) ESTADO POR JUGADOR: est.dim.santuario.jugadores.<id> = { n, hab: [tipo|null…], res: { <idEjemplar>: hueco }, des: { <idEjemplar>: día en que llegó a ese hábitat } } ─────────────────────────
  const limpios = new WeakSet();   // registros ya validados en esta sesión (lo que llega de un guardado se valida la primera vez que se lee; guardado.js no cambia)
  const nuevo = () => ({ n: 1, hab: [D.habitatInicial], res: {}, des: {}, ins: [null], dec: new Array(nHuecos(1)).fill(null), nom: '', viv: 0, dia: -1, hoy: {} });
  const limpiaNombre = (t) => (typeof t === 'string' ? t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 '·.\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20) : '');
  const topeViv = (r) => Math.round(EN.vivencias[r.n - 1] * (1 + efectoIns(r, 'vivencias')));
  const efectoIns = (r, tipo) => { let v = 0; (r.ins || []).forEach((t) => { const q = INS[t]; if (q && q.efecto.tipo === tipo) v += q.efecto.valor; }); return v; };
  // APORTES (B3): dónde está el jugador a efectos de «expedición» (Profundidades cuenta aparte de Tonavia) y cuánto más deprisa llena la reserva lo que gana ahí.
  const dondeDe = (j) => (G.profundidades && G.profundidades.esProf && G.profundidades.esProf(j.mapa) ? 'profundidades' : (mundo.dimensiones ? mundo.dimensiones.deMapa(j.mapa) : 'tonavia'));
  const bonoViaje = (r, donde) => { let v = 0; (r.ins || []).forEach((t) => { const q = INS[t]; if (q && q.efecto.tipo === 'expedicion' && q.efecto.donde === donde) v += q.efecto.valor; }); return v; };
  // ¿Se puede ELEGIR / CONSTRUIR esto ahora? Nivel del Santuario + hito de su dimensión de origen (si es un aporte). Solo se pide al elegir: lo ya construido nunca se pierde (limpiarRec no lo mira).
  function desbloqueo(est, j, r, q) {
    const nivelOk = q.nivel <= r.n, res = q.req ? G.portales.comprobar(j, { requisitos: q.req }, est) : { ok: true, faltan: [] }, d = q.origen && G.dimensiones && G.dimensiones.existe(q.origen) ? G.dimensiones.get(q.origen) : null;
    return { nivelOk, reqOk: res.ok, ok: nivelOk && res.ok, faltan: (nivelOk ? [] : ['un Santuario de nivel ' + q.nivel]).concat(res.faltan), origen: q.origen || null, origenNombre: d ? d.nombre : null };
  }
  function limpiarRec(r) {   // forma, rangos, listas cerradas y tamaños: un registro roto nunca rompe la partida ni crece sin tope
    const o = nuevo(); if (!plano(r)) return o;
    o.n = ent(r.n) ? Math.max(1, Math.min(NIV.length, r.n)) : 1; const N = nivelDe(o.n), hab = Array.isArray(r.hab) ? r.hab : [];
    o.hab = []; for (let i = 0; i < N.habitats; i++) o.hab.push(typeof hab[i] === 'string' && HAB[hab[i]] && HAB[hab[i]].nivel <= o.n ? hab[i] : i === 0 ? D.habitatInicial : null);   // null = parcela aún sin hábitat
    const cuenta = new Array(N.habitats).fill(0), cupo = cupoHab(o.n), des = plano(r.des) ? r.des : {}; let total = 0;
    if (plano(r.res)) Object.keys(r.res).filter((k) => /^[1-9][0-9]{0,8}$/.test(k)).sort((x, y) => x - y).forEach((k) => { const h = r.res[k]; if (total >= N.residentes || !ent(h) || h < 0 || h >= N.habitats || !o.hab[h] || cuenta[h] >= cupo) return; o.res[k] = h; cuenta[h]++; total++; if (ent(des[k]) && des[k] >= 0 && des[k] < 1e7) o.des[k] = des[k]; });
    o.ins = []; const ri = Array.isArray(r.ins) ? r.ins : [], ya = {}; for (let i = 0; i < N.solares; i++) { const t = ri[i]; o.ins.push(typeof t === 'string' && INS[t] && INS[t].nivel <= o.n && !ya[t] ? (ya[t] = 1, t) : null); }
    o.dec = []; const rd = Array.isArray(r.dec) ? r.dec : []; for (let i = 0; i < nHuecos(o.n); i++) { const t = rd[i], q = typeof t === 'string' ? PIE[t] : null; o.dec.push(q && q.nivel <= o.n && q.donde.indexOf(i < 4 ? 'plaza' : 'borde') >= 0 ? t : null); }   // lo hecho nunca pierde por un hito: solo se descarta lo que ya no existe o no cabe en su hueco
    o.nom = limpiaNombre(r.nom);
    o.dia = ent(r.dia) && r.dia >= -1 && r.dia < 1e7 ? r.dia : -1; if (plano(r.hoy)) Object.keys(o.res).forEach((k) => { const x = r.hoy[k]; if (ent(x) && x > 0 && x < 1e6) o.hoy[k] = x; });
    o.viv = ent(r.viv) && r.viv > 0 ? Math.min(r.viv, topeViv(o)) : 0;
    return o;
  }
  function seccion(est, crear) {
    const d = plano(est.dim) ? est.dim : (crear ? (est.dim = {}) : null); if (!d) return null;
    let s = plano(d[DIM]) ? d[DIM] : null; if (!s) { if (!crear) return null; s = d[DIM] = { v: VERSION }; }
    if (!ent(s.v)) s.v = VERSION; if (s.v > VERSION) return null;   // sección de una versión futura: ni se lee ni se pisa
    if (!plano(s.jugadores)) { if (!crear) return null; s.jugadores = {}; }
    return s;
  }
  const futura = (est) => plano(est.dim) && plano(est.dim[DIM]) && ent(est.dim[DIM].v) && est.dim[DIM].v > VERSION;
  function rec(est, jug, crear) {
    if (!JUG.test(jug)) return null; const s = seccion(est, crear); if (!s) return null; let r = s.jugadores[jug];
    if (!plano(r)) { if (!crear) return null; r = s.jugadores[jug] = nuevo(); limpios.add(r); return r; }
    if (!limpios.has(r)) { r = s.jugadores[jug] = limpiarRec(r); limpios.add(r); }
    return r;
  }
  const cajaDe = (j) => (j && Array.isArray(j.sinId) ? j.sinId : []);
  const idHogar = (est, jug) => { const r = rec(est, jug, false) || nuevo(); return idHogarDe(r.n, r.hab, jug, r.ins, r.dec); };
  // residentes REALES ahora mismo: asignaciones cuyo ejemplar sigue en la caja (sacarlo al equipo, liberarlo o intercambiarlo lo quita de aquí sin tocar esos sistemas). No cambia nada.
  function residentes(est, j) {
    const r = j ? rec(est, j.id, false) : null, out = []; if (!r) return out;
    cajaDe(j).forEach((e) => { const h = e && r.res[e.id]; if (h !== undefined && G.CREATURES[e.forma]) out.push({ e, slot: h }); });
    return out.sort((a, b) => a.e.id - b.e.id);
  }
  function depurar(est, j) {   // borra del registro las asignaciones de ejemplares que ya no están en la caja (solo el móvil del dueño)
    const r = j && !j.remoto ? rec(est, j.id, false) : null; if (!r) return 0; const vivos = {}; cajaDe(j).forEach((e) => { if (e) vivos[e.id] = 1; });
    let n = 0; Object.keys(r.res).forEach((k) => { if (!vivos[k]) { delete r.res[k]; delete r.des[k]; delete r.hoy[k]; n++; } }); return n;
  }

  // ───────────────────────── D) VIDA: comportamiento sin estado + carácter + relaciones ─────────────────────────
  const CIC = () => (G.ciclo ? G.ciclo.AJUSTES : null), fraccion = (reloj) => { const A = CIC(); return (A ? A.FASE0 : 0.4) + (reloj || 0) / (A ? A.DIA_S : 600); };
  const hora = (reloj) => (((fraccion(reloj) % 1) + 1) % 1) * 24, diaDe = (reloj) => Math.floor(fraccion(reloj));
  const entre = (h, q) => (q[0] <= q[1] ? h >= q[0] && h < q[1] : h >= q[0] || h < q[1]);
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const TEMP = Object.create(null);
  function temperamento(forma) {   // de la ESPECIE: base ← elemento ← línea ← forma (cada nivel pisa solo lo que declara)
    if (TEMP[forma]) return TEMP[forma]; const c = G.CREATURES[forma] || {}, tp = D.temperamentos, t = Object.assign({}, tp.base);
    [(tp.elemento || {})[(c.elements || [])[0]], (tp.linea || {})[c.family], (tp.forma || {})[forma]].forEach((o) => { if (o) Object.assign(t, o); });
    t.total = t.pasear + t.descansar + t.mirar; if (!(t.total > 0)) { t.pasear = 1; t.total = 1; }
    return (TEMP[forma] = t);
  }
  // CARÁCTER de cada ejemplar: sale de su ID permanente (no se guarda, no cambia nunca, es el mismo en cualquier móvil). Matiza el temperamento de su especie.
  const RASGOS = Object.keys(D.rasgos).sort(), rasgoDe = (id) => RASGOS[mix(0x5A17, id) % RASGOS.length];
  function caracter(forma, id) {
    const b = temperamento(forma), g = D.rasgos[rasgoDe(id)], t = { pasear: Math.max(0.5, b.pasear + (g.pasear || 0)), descansar: Math.max(0, b.descansar + (g.descansar || 0)), mirar: Math.max(0, b.mirar + (g.mirar || 0)), calma: lim(b.calma + (g.calma || 0), 0.4, 3), nocturna: !!b.nocturna, social: g.social || 0 };
    t.total = t.pasear + t.descansar + t.mirar; return t;
  }
  const duerme = (tp, t) => entre(hora(t), tp.nocturna ? RIT.siesta : RIT.noche);
  function actividad(c, k) {   // qué hace la criatura, a solas, en su tramo k (puro)
    if (duerme(c._tp, k * c._L - c._off)) return 'dormir';
    if ((k + c._s) % RIT.obligado === 0) return 'pasear';   // cada pocos tramos pasea sí o sí: acota la búsqueda hacia atrás de `punto`
    const r = (mix(c._s, k) / 4294967296) * (c._tp.total + c._pw); if (r >= c._tp.total) return 'propia';   // la actividad de SU hábitat (bañarse, calentarse…): pesa más si es de su elemento
    return r < c._tp.pasear ? 'pasear' : r < c._tp.pasear + c._tp.descansar ? 'descansar' : 'mirar';
  }
  const celda = (hb, i, s) => { const q = hb.celdas[i % hb.celdas.length]; return [q[0] * T + 5 + (s % 7), q[1] * T + 14 - ((s >>> 3) % 4)]; };
  const nidoPropio = (c, hb) => celda(hb, mix(c._s, 0x51ED), c._s);
  function punto(c, hb, k, prof) {   // dónde está al ACABAR el tramo k: su nido si duerme, un punto nuevo si pasea, y si no, donde ya estaba
    const a = actividad(c, k); if (a === 'dormir' || prof >= 8 || k < 0) return c._nido || nidoPropio(c, hb);
    if (a === 'pasear') { const s = mix(c._s ^ 0x2F6B, k); return celda(hb, s, s >>> 8); }
    if (a === 'propia') { const s = mix(c._s ^ 0x71C3, k), q = hb.puntos[s % hb.puntos.length]; return [q[0] * T + 5 + ((s >>> 4) % 7), q[1] * T + 14 - ((s >>> 8) % 4)]; }
    return punto(c, hb, k - 1, prof + 1);
  }
  const dirDe = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')), DIRS = ['down', 'left', 'up', 'right'];
  const I = { x: 0, y: 0, anda: false, dir: null };   // resultado de `aSolas` (se reutiliza: sin basura por fotograma)
  function aSolas(c, hb, reloj) {   // dónde le toca estar a solas en `reloj` (función pura; deja además c.act y los datos de su tramo)
    const L = c._L, tt = reloj + c._off, k = Math.floor(tt / L), u = tt - k * L;
    if (c._k !== k || c._hb !== hb) { c._k = k; c._hb = hb; c._a = actividad(c, k); c._p0 = punto(c, hb, k - 1, 0); c._p1 = punto(c, hb, k, 0); c._d = Math.hypot(c._p1[0] - c._p0[0], c._p1[1] - c._p0[1]); }
    I.x = c._p1[0]; I.y = c._p1[1]; I.anda = false; I.dir = null; I.u = u; I.k = k;
    if (c._d > 0.5) { const pr = Math.min(1, u * Math.max(c._v, c._d / (0.8 * L)) / c._d); if (pr < 1) { I.x = c._p0[0] + (c._p1[0] - c._p0[0]) * pr; I.y = c._p0[1] + (c._p1[1] - c._p0[1]) * pr; I.anda = true; I.dir = dirDe(c._p1[0] - c._p0[0], c._p1[1] - c._p0[1]); } }
    return I;
  }
  // RELACIONES: no se guarda ninguna. La de dos criaturas sale de quiénes son (familia, elementos, carácter, «química» de sus dos ID) y de los DÍAS que llevan viviendo en el mismo hábitat.
  const SO = D.social, FIN = { saludo: 0.5, recelo: 0.45, jugar: 0.85, juntas: 0.9 };
  function afinidad(fa, ia, fb, ib, dias, mod) {   // mod = { vinculo, concordia } del hábitat y las instalaciones   // → { ritmo, puntos, nivel (-1 = desconocidas, 0…), recelo }
    const A = G.CREATURES[fa] || {}, B = G.CREATURES[fb] || {}, ea = A.elements || [], eb = B.elements || [], ta = caracter(fa, ia), tb = caracter(fb, ib);
    let base = (mix(Math.min(ia, ib) + 0x77, Math.max(ia, ib)) % 5) - 2;   // química: de −2 a +2
    if (A.family && A.family === B.family) base += 2; if (ea.some((x) => eb.indexOf(x) >= 0)) base += 1; if (Math.abs(ta.calma - tb.calma) < 0.25) base += 1;
    const choca = (x, y) => x.some((el) => { const E = (G.ELEMENTS || {})[el]; return !!E && (E.strong || []).some((s) => y.indexOf(s) >= 0); }); if (choca(ea, eb) || choca(eb, ea)) base -= 2;
    const recelo = base <= SO.recelo && !(mod && mod.concordia), ritmo = (recelo ? 0.2 : lim(0.5 + 0.15 * Math.max(base, mod && mod.concordia ? 0 : -9) + (ta.social + tb.social), 0.1, 1.4)) * (1 + (mod ? mod.vinculo : 0)), puntos = Math.max(0, Math.min(dias, SO.dias)) * ritmo;
    let nivel = -1; SO.niveles.forEach((n, i) => { if (puntos >= n.desde) nivel = i; });
    return { ritmo, puntos, nivel, recelo, base };
  }
  // Una vez por día de juego (o cuando cambia quién vive ahí): la mejor relación de cada una y con quién comparte nido las amigas.
  function relacionar(est, p, em, r) {
    const hoy = diaDe(est.reloj), porHab = {}; em.criaturas.forEach((c) => { if (c.res !== undefined && p.habitats[c.hab]) (porHab[c.hab] = porHab[c.hab] || []).push(c); });
    const firma = hoy + '|' + em.modF + '|' + em.criaturas.map((c) => (c.res === undefined ? '' : c.res + ':' + c.hab)).join(','); if (em.relF === firma) return; em.relF = firma; em.socK = null;
    const dias = (c) => { const d = r && r.des ? r.des[c.res] : undefined; return d === undefined ? 0 : Math.max(0, hoy - d); };
    Object.keys(porHab).forEach((h) => {
      const L = porHab[h], hb = p.habitats[h], pares = []; L.forEach((c) => { c._mejor = null; if (c._nido) { c._nido = null; c._k = null; } });
      for (let i = 0; i < L.length; i++) for (let k = i + 1; k < L.length; k++) { const a = L[i], b = L[k], af = afinidad(a.id, a.res, b.id, b.res, Math.min(dias(a), dias(b)), em.mods[h]); if (af.nivel < 0) continue; pares.push({ a, b, af }); [[a, b], [b, a]].forEach(([x, y]) => { if (!x._mejor || af.puntos > x._mejor.puntos) x._mejor = { con: y.res, nivel: af.nivel, puntos: af.puntos }; }); }
      const cogida = new Set(); pares.filter((q) => q.af.nivel >= 1).sort((x, y) => y.af.puntos - x.af.puntos || x.a.res - y.a.res || x.b.res - y.b.res).forEach((q) => {   // las amigas duermen juntas (cada una, con una sola)
        if (cogida.has(q.a.res) || cogida.has(q.b.res)) return; cogida.add(q.a.res); cogida.add(q.b.res); const n = nidoPropio(q.a, hb), x2 = n[0] + 11 <= (hb.paseo.x + hb.paseo.w) * T - 3 ? n[0] + 11 : n[0] - 11; q.a._nido = n; q.b._nido = [x2, n[1]]; q.a._k = q.b._k = null; });
    });
  }
  // ENCUENTROS: cada `bloque` segundos, las despiertas de un hábitat se emparejan (orden por mezcla: puro) y, según su relación, se saludan, juegan, descansan juntas o se miran de reojo.
  function emparejar(est, p, em, K, r) {
    const hoy = diaDe(est.reloj), porHab = {}, t0 = K * SO.bloque, tm = (K + 0.5) * SO.bloque; em.socK = K;
    em.criaturas.forEach((c) => { if (c.res === undefined) return; c._soc = null; if (p.habitats[c.hab] && !duerme(c._tp, tm)) (porHab[c.hab] = porHab[c.hab] || []).push(c); });
    const dias = (c) => { const d = r && r.des ? r.des[c.res] : undefined; return d === undefined ? 0 : Math.max(0, hoy - d); };
    Object.keys(porHab).forEach((h) => {
      const hb = p.habitats[h], z = hb.paseo, sem = mix(em.sem ^ (h * 977), K), L = porHab[h].map((c) => [mix(sem, c.res), c]).sort((x, y) => x[0] - y[0] || x[1].res - y[1].res);
      for (let i = 0; i + 1 < L.length; i += 2) {
        const a = L[i][1], b = L[i + 1][1], af = afinidad(a.id, a.res, b.id, b.res, Math.min(dias(a), dias(b)), em.mods[h]), az = mix(a._s ^ b._s, K);
        if ((az % 1000) / 1000 >= lim(SO.base + 0.3 * (af.ritmo - 0.5) + 0.1 * (af.nivel + 1) + em.mods[h].encuentros, 0.05, 0.95)) continue;
        const q = (az >>> 10) % 100, tipo = af.recelo ? 'recelo' : af.nivel >= 1 ? (q < 50 ? 'jugar' : 'juntas') : af.nivel === 0 ? (q < 45 ? 'saludo' : q < 80 ? 'jugar' : 'juntas') : (q < 75 ? 'saludo' : 'jugar');
        const pa = aSolas(a, hb, t0), ax = pa.x, ay = pa.y, pb = aSolas(b, hb, t0), mx = lim((ax + pb.x) / 2, z.x * T + 26, (z.x + z.w) * T - 26), my = lim((ay + pb.y) / 2, z.y * T + 20, (z.y + z.h) * T - 8), izq = ax <= pb.x;
        a._soc = { K, tipo, con: b.res, lado: izq ? -1 : 1, mx, my, nivel: af.nivel }; b._soc = { K, tipo, con: a.res, lado: izq ? 1 : -1, mx, my, nivel: af.nivel };
      }
    });
  }
  function mover(c, hb, reloj, dt, gente) {   // coloca una residente donde le toca en `reloj` y la acerca con suavidad (ese alcance visual es lo único que no es puro, y no se guarda)
    if (c.talk > 0) { c.talk -= dt; c.moving = false; return; }
    const s = aSolas(c, hb, reloj); let ix = s.x, iy = s.y, anda = s.anda, dir = s.dir, act = c._a, emo = null, con; const so = c._soc;
    if (so) { const us = reloj / SO.bloque - so.K;
      if (us >= 0.08 && us <= FIN[so.tipo]) { act = so.tipo; con = so.con; dir = so.lado > 0 ? 'left' : 'right'; anda = false; iy = so.my;
        if (so.tipo === 'saludo') { ix = so.mx + so.lado * 9; if (us > 0.22) emo = 'hola'; }
        else if (so.tipo === 'recelo') { ix = so.mx + so.lado * 22; if (us > 0.2) emo = 'recelo'; }
        else if (so.tipo === 'juntas') { ix = so.mx + so.lado * 7; dir = 'down'; if (so.nivel >= 1 && ((reloj / 3) | 0) % 2 === 0) emo = 'afecto'; }
        else if (us < 0.2) ix = so.mx + so.lado * 11;
        else { const an = reloj * 2.4 + (so.lado > 0 ? 0 : Math.PI); ix = so.mx + Math.cos(an) * 11; iy = so.my + Math.sin(an) * 5; anda = true; dir = dirDe(-Math.sin(an), Math.cos(an) * 0.45); emo = 'juego'; } } }
    const ex = ix - c.x, ey = iy - c.y, e = Math.hypot(ex, ey), paso = Math.max(c._v, 16) * RIT.persecucion * dt;
    if (c._nueva || e <= paso) { c.x = ix; c.y = iy; c._nueva = false; } else { c.x += (ex / e) * paso; c.y += (ey / e) * paso; anda = true; if (e > 3 || !dir) dir = dirDe(ex, ey); }
    if (act === 'propia' && !anda) { emo = hb.emo; dir = hb.haciaRasgo; c.salta = ((reloj * 2.5 + (c.res % 5)) | 0) % 2 === 0; } else c.salta = false;
    if (!emo && c._apr > reloj && act !== 'dormir') emo = 'estrella';
    c.act = act; c.con = con; c.emo = emo; c.dur = act === 'dormir' && !anda;
    if (dir) c.dir = dir; else if (c.dur) c.dir = 'down';
    else if (act === 'mirar') { let m = null, dm = 56; for (const p of gente) { const d = Math.hypot(p.x - c.x, p.y - c.y); if (d < dm) { dm = d; m = p; } } c.dir = m ? dirDe(m.x - c.x, m.y - c.y) : DIRS[mix(c._s, s.k * 8 + ((s.u / 2) | 0)) % 4]; }
    c.moving = anda || c.salta; if (c.moving) c.tm += dt; c.hx = c.x; c.hy = c.y;
  }
  function nuevaResidente(sem, e, slot) {
    const c = motor.nueva(e.forma, 0, 0, 0), tp = caracter(e.forma, e.id);
    c.res = e.id; c.hab = slot; c._s = mix(sem, e.id); c._tp = tp; c.rasgo = rasgoDe(e.id); c._L = RIT.tramo * tp.calma; c._off = ((c._s % 1000) / 1000) * c._L; c._v = (G.traits(e.forma).speed || 12); c._nueva = true; c.act = c._a = 'descansar'; c._pw = 0; c._apr = 0;
    return c;
  }
  // Pone en el mapa (est.mapas[id].criaturas, lo que leen los TRES pintores) exactamente las residentes que dice el estado del dueño; conserva las que ya estaban.
  function poblar(est, id) {
    const em = est.mapas[id], p = trazar(id); if (!em || !p) return; const j = est.jugadores[p.jug], quiere = new Map(); em.sem = mix(est.semilla >>> 0, hashTxt(p.jug));
    const r0 = j ? rec(est, j.id, false) : null, gl = r0 ? efectoIns(r0, 'vinculo') : 0; em.mods = {}; p.habitats.forEach((hb) => { if (!hb) return; const d = HAB[hb.tipo].don, a = HAB[hb.tipo].actividad; hb.emo = a.emo; em.mods[hb.slot] = { vinculo: gl + (d.tipo === 'vinculo' ? d.valor : 0), concordia: d.tipo === 'concordia', encuentros: d.tipo === 'encuentros' ? d.valor : 0 }; }); em.modF = JSON.stringify(em.mods);
    const peso = (c) => { const hb = p.habitats[c.hab], a = HAB[hb.tipo].actividad, pw = a.peso + ((G.CREATURES[c.id].elements || []).indexOf(hb.elemento) >= 0 ? a.afin : 0); if (c._pw !== pw) { c._pw = pw; c._k = null; } c.tipoHab = hb.tipo; };
    residentes(est, j).forEach((q) => { if (p.habitats[q.slot]) quiere.set(q.e.id, q); });
    const L = em.criaturas; for (let i = L.length - 1; i >= 0; i--) { const c = L[i]; if (c.res === undefined) continue; const q = quiere.get(c.res); if (!q || q.e.forma !== c.id) L.splice(i, 1); else { if (c.hab !== q.slot) { c.hab = q.slot; c._soc = null; c._nido = null; c._k = null; } c.nom = q.e.mote || undefined; peso(c); quiere.delete(c.res); } }
    quiere.forEach((q) => { const c = nuevaResidente(em.sem, q.e, q.slot); c.nom = q.e.mote || undefined; peso(c); mover(c, p.habitats[q.slot], est.reloj, 0, []); L.push(c); });
    L.sort((a, b) => (a.res === undefined ? -1 : b.res === undefined ? 1 : a.res - b.res));
    relacionar(est, p, em, j ? rec(est, j.id, false) : null);
  }
  // ENTRENAMIENTO: nada se gana por el paso del tiempo. La reserva de VIVENCIAS solo se llena jugando (XP de entrenador); en casa, cada residente toma de ella hasta su dosis del día.
  const dosis = (e) => { const n = nivelCri(e); return Math.max(1, Math.round(EN.dosis * G.nivel.xpGanada(n, n, 'comun'))); };
  const techoDe = (j) => { let m = 1; (G.equipo ? G.equipo.actual(j) : j.equipo || []).forEach((k) => { const q = j.prog && j.prog[k]; m = Math.max(m, G.nivel.nivelDe(q ? q.xp : 0)); }); return m; };
  function topeHoy(r, e, c) {   // XP que esa residente puede aprender hoy: dosis × (1 + elemento en casa + amistad + Fragua + Campo de prácticas)
    const t = HAB[r.hab[r.res[e.id]]], afin = t && (G.CREATURES[e.forma].elements || []).indexOf(t.elemento) >= 0;
    return Math.round(dosis(e) * (1 + (afin ? EN.afin : 0) + EN.amistad[c && c._mejor ? c._mejor.nivel + 1 : 0] + (t && t.don.tipo === 'tope' ? t.don.valor : 0) + efectoIns(r, 'tope')));
  }
  const curaAqui = (r, id) => { const t = HAB[r.hab[r.res[id]]]; return efectoIns(r, 'cura') > 0 || (!!t && t.don.tipo === 'cura'); };
  function entrenar(est, j, p, em) {
    const r = rec(est, j.id, false); if (!r || !em) return; const hoy = diaDe(est.reloj), L = em.criaturas, caja = {}; cajaDe(j).forEach((e) => { if (e) caja[e.id] = e; });
    if (r.dia !== hoy) { r.dia = hoy; r.hoy = {}; let n = 0; Object.keys(r.res).forEach((k) => { const e = caja[k]; if (e && typeof e.hp === 'number' && curaAqui(r, k)) { delete e.hp; n++; } }); if (n) aviso(est, j, n === 1 ? 'Una residente ha amanecido curada' : n + ' residentes han amanecido curadas'); }
    if (!(r.viv > 0) || !L.length) return; const techo = techoDe(j), xpMax = G.nivel.xpPara(G.nivel.AJUSTES && G.nivel.AJUSTES.MAX ? G.nivel.AJUSTES.MAX : 50), ini = Math.floor(est.reloj) % L.length;
    for (let i = 0; i < L.length && r.viv > 0; i++) {
      const c = L[(ini + i) % L.length], e = c.res !== undefined ? caja[c.res] : null; if (!e || r.res[e.id] === undefined) continue; const t = HAB[r.hab[r.res[e.id]]], nv = nivelCri(e);
      if (nv >= techo + (t.don.tipo === 'techo' ? t.don.valor : 0) || (e.xp | 0) >= xpMax) continue; const tope = topeHoy(r, e, c), hecho = r.hoy[e.id] || 0; if (hecho >= tope) continue;
      const ef = 1 + (t.don.tipo === 'eficiencia' ? t.don.valor : 0); const da = Math.min(tope - hecho, Math.max(1, Math.ceil(tope / EN.ritmo)), xpMax - (e.xp | 0)); if (da <= 0) continue; em.debe = (em.debe || 0) + da / ef; const cuesta = Math.min(r.viv, Math.floor(em.debe)); em.debe -= cuesta;   // el coste se lleva con decimales (no se guarda): el redondeo nunca regala ni cobra de más de 1 vivencia
      e.xp = (e.xp | 0) + da; r.viv -= cuesta; r.hoy[e.id] = hecho + da; c._apr = est.reloj + 2; const n2 = nivelCri(e); if (n2 > nv) aviso(est, j, nombreDe(e) + ' sube a Nv ' + n2 + ' en el Santuario');
    }
  }
  function vivir(est, j, n) {   // lo llama el gancho de entrenador.dar: jugar llena la reserva (con tope); quien no tiene Santuario no acumula nada
    const r = j && !j.remoto && est ? rec(est, j.id, false) : null; if (!r || !(n > 0)) return; r.viv = Math.min(topeViv(r), (r.viv | 0) + Math.floor(n * (1 + bonoViaje(r, dondeDe(j)))));   // B3: una «expedición» llena la reserva más deprisa con lo que ganas en su lugar
  }
  function revisar(est, id, p) {   // una vez por segundo de juego: registro al día, el dueño en el id que le toca y las residentes que tocan
    const j = est.jugadores[p.jug];
    if (j && !j.remoto) { depurar(est, j); const bien = idHogar(est, j.id); if (j.mapa === id && bien !== id) { motor.aplicar(est, { j: j.id, t: 'colocar', mapa: bien, ancla: 'entrada', dir: 'up' }); return; } }
    poblar(est, id);
    if (j && !j.remoto && j.mapa === id) entrenar(est, j, p, est.mapas[id]);
  }
  const LEJOS = 26 * T;   // rendimiento: solo se mueve lo que algún jugador puede ver; el resto no cuesta nada y, al acercarse, aparece donde le toca (es una función del reloj)
  function avanzar(est, dt) {
    const vistos = {}; Object.values(est.jugadores).forEach((j) => { if (esHogar(j.mapa)) (vistos[j.mapa] = vistos[j.mapa] || []).push(j); });
    Object.keys(vistos).forEach((id) => {
      const p = trazar(id), em = motor.estadoMapa(est, id), seg = Math.floor(est.reloj); if (em.sanT !== seg) { em.sanT = seg; revisar(est, id, p); }
      const em2 = est.mapas[id] || em, L = em2.criaturas, gente = vistos[id], K = Math.floor(est.reloj / SO.bloque);
      if (em2.socK !== K) { const d = est.jugadores[p.jug]; emparejar(est, p, em2, K, d ? rec(est, d.id, false) : null); }
      for (let i = 0; i < L.length; i++) { const c = L[i]; if (c.res === undefined || !p.habitats[c.hab]) continue;
        let cerca = false; for (let g = 0; g < gente.length && !cerca; g++) cerca = Math.abs(gente[g].x - c.x) < LEJOS && Math.abs(gente[g].y - c.y) < LEJOS;
        if (!cerca && !c._nueva) { const s = aSolas(c, p.habitats[c.hab], est.reloj); c.x = s.x; c.y = s.y; c.moving = false; c.emo = null; continue; }
        mover(c, p.habitats[c.hab], est.reloj, dt, gente); }
    });
  }

  // ───────────────────────── E) ÓRDENES Y LECTURAS ─────────────────────────
  const aviso = (est, j, texto) => est.avisos.push({ j: j.id, texto });
  const propio = (j) => { const a = j ? (analizar(j.mapa) || analizarCab(j.mapa)) : null; return !!a && a.jug === j.id; };
  const nombreDe = (e) => e.mote || G.CREATURES[e.forma].name, nivelCri = (e) => (G.nivel ? G.nivel.nivelDe(e.xp | 0) : 1);
  const ocupacion = (r) => { const c = new Array(r.hab.length).fill(0); Object.keys(r.res).forEach((k) => { c[r.res[k]]++; }); return c; };
  // precio en Brillos con el criterio de la tienda (v2.349): un nº de combates del nivel del jugador, nunca por debajo de un mínimo. Sin factor de dimensión: el Santuario cuesta lo mismo estés donde estés.
  const precio = (j, c) => (c ? Math.max(c.minimo, Math.round(c.combates * (G.tienda ? G.tienda.ingresoNivel(G.entrenador ? G.entrenador.nivel(j) : 1) : 10) / 10) * 10) : 0);
  function entrar(est, j) {   // del Umbral a TU hogar (la primera vez se crea el refugio, gratis)
    if (futura(est)) { aviso(est, j, 'Tu Santuario es de una versión más nueva del juego: actualízalo para entrar.'); return false; }
    const primera = !rec(est, j.id, false), r = rec(est, j.id, true); if (!r) return false; depurar(est, j);
    motor.aplicar(est, { j: j.id, t: 'colocar', mapa: idHogar(est, j.id), ancla: 'entrada', dir: 'up' });
    aviso(est, j, primera ? 'Este claro es tuyo: aquí pueden vivir las criaturas de tu caja. Habla con Brezo.' : 'Entras en ' + (r.nom ? r.nom : 'tu ' + nivelDe(r.n).nombre));
    return true;
  }
  function salir(est, j) { motor.aplicar(est, { j: j.id, t: 'colocar', mapa: UMBRAL, ancla: PUERTA_HOGAR, dir: 'down' }); return true; }
  function base(est, j) { if (!propio(j)) return 'Eso solo se hace dentro de tu Santuario'; if (est.combate) return 'Ahora no'; const r = rec(est, j.id, false); return r ? { r } : 'Aún no tienes Santuario'; }
  function comun(est, j, o) {   // validación compartida de las órdenes sobre un ejemplar → { r, e } o un motivo (texto)
    const b = base(est, j); if (typeof b === 'string') return b;
    const e = ent(o.id) ? cajaDe(j).find((q) => q && q.id === o.id) : null; if (!e || !G.CREATURES[e.forma]) return 'Esa criatura no está en tu caja';
    return { r: b.r, e };
  }
  function hueco(r, e, pedido) {   // hábitat con sitio: el pedido; si no, uno de su elemento; si no, el más vacío
    const oc = ocupacion(r), cupo = cupoHab(r.n); if (pedido !== undefined) return ent(pedido) && pedido >= 0 && pedido < r.hab.length && r.hab[pedido] && oc[pedido] < cupo ? pedido : -1;
    const el = (G.CREATURES[e.forma].elements || [])[0]; let mejor = -1;
    r.hab.forEach((t, i) => { if (!t || oc[i] >= cupo) return; const afin = HAB[t].elemento === el; if (mejor < 0 || (afin && HAB[r.hab[mejor]].elemento !== el) || (afin === (HAB[r.hab[mejor]].elemento === el) && oc[i] < oc[mejor])) mejor = i; });
    return mejor;
  }
  const alCambiar = (est, j) => { const id = esCabana(j.mapa) ? idHogar(est, j.id) : j.mapa; if (est.mapas[id]) poblar(est, id); };   // dentro de la cabaña también se actualiza el hogar (está en memoria)
  const recolocar = (est, j) => { if (esCabana(j.mapa)) return; const bien = idHogar(est, j.id); if (j.mapa !== bien) motor.aplicar(est, { j: j.id, t: 'colocar', mapa: bien, ancla: 'entrada', dir: 'up' }); };
  motor.ordenes.registrar('santuario.acoger', {   // { id, h? } · un ejemplar de la caja pasa a vivir en un hábitat (sigue en la caja: solo se anota dónde vive)
    validar(est, j, o) { const q = comun(est, j, o); if (typeof q === 'string') return q; if (q.r.res[q.e.id] !== undefined) return nombreDe(q.e) + ' ya vive en tu Santuario'; if (Object.keys(q.r.res).length >= nivelDe(q.r.n).residentes) return 'Tu ' + nivelDe(q.r.n).nombre + ' está lleno (' + nivelDe(q.r.n).residentes + ' criaturas)'; return hueco(q.r, q.e, o.h) < 0 ? 'En ese hábitat no cabe nadie más' : null; },
    aplicar(est, j, o) { const q = comun(est, j, o), h = hueco(q.r, q.e, o.h); q.r.res[q.e.id] = h; q.r.des[q.e.id] = diaDe(est.reloj); alCambiar(est, j); aviso(est, j, nombreDe(q.e) + ' se instala en ' + HAB[q.r.hab[h]].nombre); return { ok: true, id: q.e.id, h }; },
  });
  motor.ordenes.registrar('santuario.retirar', {   // { id } · deja de vivir en el Santuario (sigue en la caja, intacta)
    validar(est, j, o) { const q = comun(est, j, o); if (typeof q === 'string') return q; return q.r.res[q.e.id] === undefined ? nombreDe(q.e) + ' no vive en tu Santuario' : null; },
    aplicar(est, j, o) { const q = comun(est, j, o); delete q.r.res[q.e.id]; delete q.r.des[q.e.id]; alCambiar(est, j); aviso(est, j, nombreDe(q.e) + ' vuelve a la caja'); return { ok: true, id: q.e.id }; },
  });
  motor.ordenes.registrar('santuario.mover', {   // { id, h } · cambia de hábitat (sus relaciones empiezan de nuevo con las vecinas nuevas)
    validar(est, j, o) { const q = comun(est, j, o); if (typeof q === 'string') return q; if (q.r.res[q.e.id] === undefined) return nombreDe(q.e) + ' no vive en tu Santuario'; if (q.r.res[q.e.id] === o.h) return 'Ya vive ahí'; return hueco(q.r, q.e, ent(o.h) ? o.h : -1) < 0 ? 'En ese hábitat no cabe nadie más' : null; },
    aplicar(est, j, o) { const q = comun(est, j, o); q.r.res[q.e.id] = o.h; q.r.des[q.e.id] = diaDe(est.reloj); alCambiar(est, j); aviso(est, j, nombreDe(q.e) + ' se muda a ' + HAB[q.r.hab[o.h]].nombre); return { ok: true, id: q.e.id, h: o.h }; },
  });
  motor.ordenes.registrar('santuario.ampliar', {   // {} · paga y sube un nivel: mapa mayor, más residentes y parcelas nuevas (vacías: su hábitat lo eliges tú)
    validar(est, j) { const b = base(est, j); if (typeof b === 'string') return b; if (b.r.n >= NIV.length) return 'Tu Santuario ya no puede crecer más'; const pr = precio(j, NIV[b.r.n].coste); return G.tienda && G.tienda.saldo(j) < pr ? 'Ampliar cuesta ' + pr + ' ✦ y tienes ' + G.tienda.saldo(j) : null; },
    aplicar(est, j) { const r = base(est, j).r, pr = precio(j, NIV[r.n].coste); if (G.tienda && !G.tienda.gastar(j, pr)) return null; r.n++; while (r.hab.length < NIV[r.n - 1].habitats) r.hab.push(null); while (r.ins.length < NIV[r.n - 1].solares) r.ins.push(null); while (r.dec.length < nHuecos(r.n)) r.dec.push(null); recolocar(est, j); aviso(est, j, '¡Tu Santuario crece! Ahora es ' + NIV[r.n - 1].nombre + ' · -' + pr + ' ✦'); return { ok: true, nivel: r.n, coste: pr }; },
  });
  const costeHabitat = (j, r, h) => (r.hab[h] ? precio(j, D.cambioHabitat) : 0);
  motor.ordenes.registrar('santuario.habitat', {   // { h, tipo } · da hábitat a una parcela vacía (gratis) o cambia el que tiene (cuesta); quienes viven ahí se quedan
    validar(est, j, o) { const b = base(est, j); if (typeof b === 'string') return b; const r = b.r; if (!ent(o.h) || o.h < 0 || o.h >= r.hab.length) return 'Esa parcela no existe'; const H = typeof o.tipo === 'string' ? HAB[o.tipo] : null; if (!H) return 'Ese hábitat no existe'; { const u = desbloqueo(est, j, r, H); if (!u.ok) return H.nombre + ' necesita ' + u.faltan.join(' y '); } if (r.hab[o.h] === o.tipo) return 'Esa parcela ya es ' + H.nombre; const pr = costeHabitat(j, r, o.h); return pr && G.tienda && G.tienda.saldo(j) < pr ? 'Cambiar el hábitat cuesta ' + pr + ' ✦ y tienes ' + G.tienda.saldo(j) : null; },
    aplicar(est, j, o) { const r = base(est, j).r, pr = costeHabitat(j, r, o.h); if (pr && G.tienda && !G.tienda.gastar(j, pr)) return null; r.hab[o.h] = o.tipo; recolocar(est, j); aviso(est, j, 'Nueva zona: ' + HAB[o.tipo].nombre + (pr ? ' · -' + pr + ' ✦' : '')); return { ok: true, h: o.h, tipo: o.tipo, coste: pr }; },
  });
  motor.ordenes.registrar('santuario.construir', {   // { s, tipo } · levanta una instalación en un solar libre (una de cada tipo)
    validar(est, j, o) { const b = base(est, j); if (typeof b === 'string') return b; const r = b.r, q = typeof o.tipo === 'string' ? INS[o.tipo] : null; if (!ent(o.s) || o.s < 0 || o.s >= r.ins.length) return 'Ese solar no existe'; if (!q) return 'Esa instalación no existe'; if (r.ins[o.s]) return 'Ese solar ya está ocupado'; if (r.ins.indexOf(o.tipo) >= 0) return 'Ya tienes ' + q.nombre; { const u = desbloqueo(est, j, r, q); if (!u.ok) return q.nombre + ' necesita ' + u.faltan.join(' y '); } const pr = precio(j, q.coste); return G.tienda && G.tienda.saldo(j) < pr ? q.nombre + ' cuesta ' + pr + ' ✦ y tienes ' + G.tienda.saldo(j) : null; },
    aplicar(est, j, o) { const r = base(est, j).r, q = INS[o.tipo], pr = precio(j, q.coste); if (G.tienda && !G.tienda.gastar(j, pr)) return null; r.ins[o.s] = o.tipo; r.viv = Math.min(r.viv | 0, topeViv(r)); recolocar(est, j); aviso(est, j, '¡' + q.nombre + ' en pie! ' + q.texto + ' · -' + pr + ' ✦'); return { ok: true, s: o.s, tipo: o.tipo, coste: pr }; },
  });
  motor.ordenes.registrar('santuario.derribar', {   // { s } · deja libre el solar (no se devuelve nada)
    validar(est, j, o) { const b = base(est, j); if (typeof b === 'string') return b; return !ent(o.s) || o.s < 0 || o.s >= b.r.ins.length || !b.r.ins[o.s] ? 'Ahí no hay nada que derribar' : null; },
    aplicar(est, j, o) { const r = base(est, j).r, t = r.ins[o.s]; r.ins[o.s] = null; r.viv = Math.min(r.viv | 0, topeViv(r)); recolocar(est, j); aviso(est, j, INS[t].nombre + ' derribada: el solar queda libre'); return { ok: true, s: o.s }; },
  });
  // PERSONALIZACIÓN (B4): piezas decorativas en los huecos del trazado (solo estético) y nombre del Santuario. Contrato: docs/multiverso/22_SANTUARIO_DECORACION.md
  const kindDe = (d) => (d < 4 ? 'plaza' : 'borde');
  motor.ordenes.registrar('santuario.decorar', {   // { d, tipo|null } · coloca una pieza en el hueco d (cuesta) o la quita (gratis, sin devolución)
    validar(est, j, o) { const b = base(est, j); if (typeof b === 'string') return b; const r = b.r; if (!ent(o.d) || o.d < 0 || o.d >= r.dec.length) return 'Ese hueco no existe';
      if (o.tipo === null) return r.dec[o.d] ? null : 'Ahí no hay nada que quitar';
      const q = typeof o.tipo === 'string' ? PIE[o.tipo] : null; if (!q) return 'Esa pieza no existe'; if (r.dec[o.d] === o.tipo) return 'Ahí ya está ' + q.nombre; if (q.donde.indexOf(kindDe(o.d)) < 0) return q.nombre + ' no va ahí (' + q.donde.join(' o ') + ')';
      const u = desbloqueo(est, j, r, q); if (!u.ok) return q.nombre + ' necesita ' + u.faltan.join(' y '); const pr = precio(j, q.coste); return G.tienda && G.tienda.saldo(j) < pr ? q.nombre + ' cuesta ' + pr + ' ✦ y tienes ' + G.tienda.saldo(j) : null; },
    aplicar(est, j, o) { const r = base(est, j).r; if (o.tipo === null) { const q = PIE[r.dec[o.d]]; r.dec[o.d] = null; recolocar(est, j); aviso(est, j, q.nombre + ' retirada'); return { ok: true, d: o.d }; }
      const q = PIE[o.tipo], pr = precio(j, q.coste); if (G.tienda && !G.tienda.gastar(j, pr)) return null; r.dec[o.d] = o.tipo; recolocar(est, j); aviso(est, j, q.nombre + ' colocada · -' + pr + ' ✦'); return { ok: true, d: o.d, tipo: o.tipo, coste: pr }; },
  });
  motor.ordenes.registrar('santuario.nombrar', {   // { nom } · pone o quita (texto vacío) el nombre de tu Santuario (hasta 20 letras; gratis)
    validar(est, j, o) { const b = base(est, j); return typeof b === 'string' ? b : typeof o.nom !== 'string' ? 'Nombre no válido' : null; },
    aplicar(est, j, o) { const r = base(est, j).r; r.nom = limpiaNombre(o.nom); aviso(est, j, r.nom ? 'Tu Santuario se llama ' + r.nom : 'Tu Santuario vuelve a no tener nombre'); return { ok: true, nom: r.nom }; },
  });
  function cercana(est, j) { let m = null, dm = RIT.alcance; const em = est.mapas[j.mapa]; (em ? em.criaturas : []).forEach((c) => { if (c.res === undefined) return; const d = Math.hypot(c.x - j.x, c.y - j.y); if (d < dm) { dm = d; m = c; } }); return m; }
  const nombreRes = (dueno, id) => { const e = cajaDe(dueno).find((q) => q && q.id === id); return e ? nombreDe(e) : 'otra'; };
  const frase = (dueno, c) => String(c.act === 'propia' && HAB[c.tipoHab] ? HAB[c.tipoHab].actividad.frase : D.frases[c.act] || D.frases.descansar).replace('{con}', c.con !== undefined ? nombreRes(dueno, c.con) : 'otra');
  function hablar(est, j) {   // hablarle a una residente: te mira y cuenta qué hace, cómo es y con quién se lleva (no es salvaje: ni se captura ni combate)
    const c = cercana(est, j); if (!c) return null; const p = trazar(j.mapa), dueno = est.jugadores[p.jug], e = cajaDe(dueno).find((q) => q && q.id === c.res); if (!e) return null;
    const txt = nombreDe(e) + ' (Nv ' + nivelCri(e) + ', ' + D.rasgos[c.rasgo].nombre + ') ' + frase(dueno, c) + (c._mejor && c.con !== c._mejor.con ? ' · ' + nombreRes(dueno, c._mejor.con) + ' y ella ' + SO.niveles[c._mejor.nivel].nombre : c._mejor ? ' · ' + SO.niveles[c._mejor.nivel].nombre : '');
    c.talk = 2.5; c.moving = false; c.emo = null; c.dir = dirDe(j.x - c.x, j.y - c.y); j.dir = dirDe(c.x - j.x, c.y - j.y); j.moving = false;
    aviso(est, j, txt); return { residente: e.id, forma: e.forma, act: c.act, rasgo: c.rasgo };
  }
  // Muebles de la cabaña con uso (B5): LEEN el estado del Santuario y devuelven una «lectura» (título + secciones) que la interfaz muestra en el panel. No cambian nada, no dan nada.
  function muebleCerca(j) { const p = esCabana(j.mapa) ? trazarCab(j.mapa) : null; if (!p) return null; let m = null, dm = 24; p.muebles.forEach((q) => { if (!q.accion) return; const cx = Math.max(q.x * T, Math.min(j.x, (q.x + q.w) * T)), cy = Math.max(q.y * T, Math.min(j.y, (q.y + q.h) * T)), d = Math.hypot(j.x - cx, j.y - cy); if (d < dm) { dm = d; m = q; } }); return m; }
  function lectura(est, j, accion) {   // → { titulo, sub, secciones: [{ h, filas: [{ x, e? }] }] } (e: 'ok' | 'falta' | 'info')
    const v = vista(est, j);
    if (accion === 'libro') {
      const hechas = v.instalaciones.filter((t) => t.hecha), pz = v.decoracion.huecos.filter((h) => h.pieza);
      return { titulo: 'Libro del Santuario', sub: v.nom || 'Sin nombre', secciones: [
        { h: 'Tu Santuario', filas: [{ x: v.nombre + ' · ' + v.total + ' de ' + v.max + ' criaturas' }, { x: 'Vivencias: ' + v.vivencias.hay + ' de ' + v.vivencias.tope }, { x: 'Tus residentes aprenden hasta el nivel ' + v.techo }] },
        { h: 'Instalaciones', filas: hechas.length ? hechas.map((t) => ({ x: t.nombre + (t.origen ? ' · aporte de ' + t.origen : ''), e: 'ok' })) : [{ x: 'Todavía no has levantado ninguna.', e: 'info' }] },
        { h: 'Decoración', filas: pz.length ? pz.map((h) => ({ x: h.nombrePieza + ' · ' + h.nombre })) : [{ x: 'Sin piezas colocadas.', e: 'info' }] }] };
    }
    const L = v.instalaciones.filter((t) => t.origen).map((t) => ({ t, k: 'Instalación' })).concat(v.tipos.filter((t) => t.origen).map((t) => ({ t, k: 'Hábitat' })), v.decoracion.piezas.filter((t) => t.origen).map((t) => ({ t, k: 'Decoración' })));
    return { titulo: 'Vitrina de aportes', sub: v.nom || 'Sin nombre', secciones: [{ h: 'Lo que han traído otras dimensiones', filas: L.length ? L.map(({ t, k }) => { const hecha = !!t.hecha, abierta = hecha || !!t.abierta || !!t.abierto; return { x: t.nombre + ' (' + k + ', ' + t.origen + ') · ' + (hecha ? 'construido' : abierta ? 'disponible' : 'te falta ' + (t.falta || []).join(' y ')), e: hecha ? 'ok' : abierta ? 'info' : 'falta' }; }) : [{ x: 'Aún no hay aportes de otras dimensiones.', e: 'info' }] }] };
  }
  function usarMueble(est, j) { const q = muebleCerca(j); if (!q) return null; j.moving = false; return { mueble: q.accion, lectura: lectura(est, j, q.accion) }; }
  // Lectura para la interfaz (no cambia nada): nivel, ampliación siguiente, hábitats con sus residentes (carácter y mejor relación) y los ejemplares de la caja que aún no viven aquí.
  function vista(est, j) {
    const r = rec(est, j.id, false) || nuevo(), N = nivelDe(r.n), viven = {}, em = est.mapas[idHogar(est, j.id)], enMapa = {}; (em ? em.criaturas : []).forEach((c) => { if (c.res !== undefined) enMapa[c.res] = c; });
    const ficha = (e, h) => { const c = enMapa[e.id], m = c && c._mejor; return { id: e.id, forma: e.forma, nom: G.CREATURES[e.forma].name, mote: e.mote || '', nivel: nivelCri(e), el: (G.CREATURES[e.forma].elements || [])[0], h, rasgo: D.rasgos[rasgoDe(e.id)].nombre, hoy: h === undefined ? 0 : (r.dia === diaDe(est.reloj) ? r.hoy[e.id] || 0 : 0), tope: h === undefined ? 0 : topeHoy(r, e, c), herida: typeof e.hp === 'number', amiga: m ? { nom: nombreRes(j, m.con), rel: SO.niveles[m.nivel].nombre, nivel: m.nivel } : null }; };
    const tipos = Object.keys(HAB).map((t) => { const u = desbloqueo(est, j, r, HAB[t]); return { tipo: t, nombre: HAB[t].nombre, elemento: HAB[t].elemento, nivel: HAB[t].nivel, abierto: u.ok, falta: u.faltan, origen: u.origenNombre, don: HAB[t].don.texto }; });
    const habitats = r.hab.map((t, i) => ({ slot: i, tipo: t, nombre: t ? HAB[t].nombre : 'Parcela vacía', elemento: t ? HAB[t].elemento : null, cupo: cupoHab(r.n), cambiar: costeHabitat(j, r, i), don: t ? HAB[t].don.texto : '', residentes: [] }));
    residentes(est, j).forEach((q) => { viven[q.e.id] = 1; habitats[q.slot].residentes.push(ficha(q.e, q.slot)); });
    const caja = cajaDe(j).filter((e) => e && G.CREATURES[e.forma] && !viven[e.id]).map((e) => ficha(e)), sig = r.n < NIV.length ? NIV[r.n] : null;
    const solares = r.ins.map((t, i) => ({ s: i, tipo: t, nombre: t ? INS[t].nombre : 'Solar libre', texto: t ? INS[t].texto : '' })), instalaciones = Object.keys(INS).map((t) => { const u = desbloqueo(est, j, r, INS[t]); return { tipo: t, nombre: INS[t].nombre, texto: INS[t].texto, nivel: INS[t].nivel, coste: precio(j, INS[t].coste), abierta: u.ok, falta: u.faltan, origen: u.origenNombre, hecha: r.ins.indexOf(t) >= 0 }; });
    const piezas = Object.keys(PIE).map((t) => { const u = desbloqueo(est, j, r, PIE[t]); return { tipo: t, nombre: PIE[t].nombre, nivel: PIE[t].nivel, coste: precio(j, PIE[t].coste), donde: PIE[t].donde, abierta: u.ok, falta: u.faltan, origen: u.origenNombre }; }), huecos = r.dec.map((t, d) => ({ d, nombre: trazar(idHogar(est, j.id)).decor[d].nombre, donde: kindDe(d), pieza: t, nombrePieza: t ? PIE[t].nombre : '' }));
    return { nivel: r.n, nom: r.nom, decoracion: { huecos, piezas }, nombre: N.nombre, max: N.residentes, total: Object.keys(viven).length, habitats, caja, tipos, solares, instalaciones, vivencias: { hay: r.viv | 0, tope: topeViv(r) }, techo: techoDe(j), propio: propio(j), brillos: G.tienda ? G.tienda.saldo(j) : 0,
      ampliar: sig ? { nombre: sig.nombre, coste: precio(j, sig.coste), residentes: sig.residentes, habitats: sig.habitats, nuevos: Object.keys(HAB).filter((t) => HAB[t].nivel === r.n + 1).map((t) => HAB[t].nombre) } : null };
  }

  // ───────────────────────── F) GANCHOS EN EL MOTOR (mismo patrón que Profundidades: se envuelve, no se edita motor.js) ─────────────────────────
  mundo.proveedores.push(proveedor);
  function acceso() { try { const mm = mundo.mapa(D.acceso.mapa), pu = mm.puertas.find((q) => q.id === D.acceso.puerta); return pu ? { mapa: mm.id, tx: pu.x, ty: pu.y } : null; } catch (x) { return null; } }
  const estadoMapa0 = motor.estadoMapa;
  motor.estadoMapa = function (est, id) { const em = estadoMapa0.call(motor, est, id); if (!em.san && esHogar(id)) { em.san = 1; poblar(est, id); } return em; };
  const cruzar0 = motor.cruzar;
  motor.cruzar = function (est, j, m) {   // la puerta «hogar» del Umbral lleva a CADA UNO a su hogar; la «salida» del hogar, de vuelta (sin tocar la pila j.volver)
    if (enSantuario(m.id)) {
      const tx = Math.floor(j.x / T), ty = Math.floor(j.y / T), p = mundo.puertaEn(m, tx, ty), ida = p && m.id === UMBRAL && p.id === PUERTA_HOGAR, vuelta = p && p.id === PUERTA_SALIDA && esHogar(m.id);
      // «volver» del Umbral: lo natural es salir por la puerta que lleva a él. Si la pila no la tiene arriba (partida cargada dentro: el guardado solo conserva puertas de mapas cargados), se repone.
      if (p && m.id === UMBRAL && p.destino && p.destino.ancla === 'volver' && j.enPuerta !== m.id + ':' + tx + ',' + ty) { const ac = acceso(), top = j.volver[j.volver.length - 1]; if (ac && !(top && top.mapa === ac.mapa)) j.volver.push(ac); }
      const aCab = p && p.id === PUERTA_CABANA && esHogar(m.id), deCab = p && p.id === PUERTA_SALIDA && esCabana(m.id);   // B5: puerta de la cabaña (desde fuera) y salida de la cabaña (al hogar ACTUAL)
      if (aCab || deCab) { const clave = m.id + ':' + tx + ',' + ty; if (j.enPuerta === clave) return; const r = rec(est, j.id, false);
        if (aCab) { motor.aplicar(est, { j: j.id, t: 'colocar', mapa: idCabana(j.id), ancla: 'entrada', dir: 'up' }); aviso(est, j, (r && r.nom ? r.nom + ' · ' : '') + 'La cabaña'); } else motor.aplicar(est, { j: j.id, t: 'colocar', mapa: idHogar(est, j.id), ancla: 'cabana', dir: 'down' });
        return; }
      if (ida || vuelta) { const clave = m.id + ':' + tx + ',' + ty; if (j.enPuerta === clave) return; if (!(ida ? entrar(est, j) : salir(est, j))) j.enPuerta = clave; return; }
    }
    return cruzar0.call(motor, est, j, m);
  };
  const criaturas0 = motor.moverCriaturas, NADIE = [];
  motor.moverCriaturas = function (est, dt) {   // las residentes NO usan el paseo de las salvajes (que gasta est.rnd): se apartan mientras corre y luego se mueven con su reloj
    const apartadas = []; Object.values(est.jugadores).forEach((j) => { const em = esHogar(j.mapa) ? est.mapas[j.mapa] : null; if (em && em.criaturas !== NADIE) { apartadas.push([em, em.criaturas]); em.criaturas = NADIE; } });
    try { criaturas0.call(motor, est, dt); } finally { apartadas.forEach((q) => { q[0].criaturas = q[1]; }); }
    avanzar(est, dt);
  };
  let enganchado = false;
  function enganchar() { if (enganchado || !G.entrenador || !G.entrenador.dar) return; enganchado = true; const dar0 = G.entrenador.dar; G.entrenador.dar = function (est, j, n, motivo) { const q = dar0.call(G.entrenador, est, j, n, motivo); if (q) vivir(est, j, n); return q; }; }
  const aplicar0 = motor.aplicar;
  motor.aplicar = function (est, o) {
    enganchar();
    if (o && (o.t === 'hablar' || o.t === 'combate' || o.t === 'evolucionar')) {
      const j = est.jugadores[o.j];
      if (j && (esHogar(j.mapa) || esCabana(j.mapa))) {
        if (o.t !== 'hablar') { aviso(est, j, o.t === 'combate' ? 'En el Santuario no se combate: aquí las criaturas están en casa' : 'Aquí no'); return o.t === 'combate' ? false : null; }
        if (!(G.npc && G.npc.cercano(est, j))) return esCabana(j.mapa) ? usarMueble(est, j) : hablar(est, j);
      }
    }
    return aplicar0.call(motor, est, o);
  };

  G.santuario = { activo: true, errores, VERSION, DIM, UMBRAL, D, validarDatos, mix, caracter, rasgoDe, afinidad, entrenar, vivir, topeHoy, topeViv, techoDe, nHuecos, limpiaNombre, desbloqueo, bonoViaje, dondeDe, enganchar, diaDe, precio, relacionar, emparejar, aSolas, analizar, idHogarDe, idHogar, esHogar, esCabana, analizarCab, idCabana, trazarCab, generarCab, muebleCerca, lectura, usarMueble, enSantuario, trazar, generar, proveedor, rec, limpiarRec, residentes, depurar, temperamento, actividad, punto, mover, hora, poblar, avanzar, entrar, salir, vista, cercana, nivelDe, cupoHab, propio, futura };
  if (typeof module !== 'undefined' && module.exports) module.exports = G.santuario;
})(typeof window !== 'undefined' ? window : globalThis);
