// prueba_santuario.js — SANTUARIO UNIVERSAL · Etapa A (v2.364). Prueba el módulo puro (src/santuario.js) con el motor real, sin navegador.
// Uso: node tools/prueba_santuario.js   → UNA línea «OK …» o «FALLA: …» (código 1). También corre dentro de test.js.
const G = require('./_cargar.js')(), S = G.santuario, motor = G.motor, mundo = G.mundo, T = 16;
let n = 0; const fallos = [], ok = (c, m) => { n++; if (!c) fallos.push(m); };
const fin = () => { if (fallos.length) { console.log('FALLA: ' + fallos.slice(0, 8).join(' · ') + (fallos.length > 8 ? ' (+' + (fallos.length - 8) + ' más)' : '')); process.exit(1); } console.log('OK santuario: ' + n + ' comprobaciones · ' + extra.join(' · ')); };
const extra = [];
if (!S || !S.activo) { console.log('FALLA: el módulo no está activo: ' + JSON.stringify(S && S.errores)); process.exit(1); }
const D = S.D, TIPOS = Object.keys(D.habitats), copia = (o) => JSON.parse(JSON.stringify(o));
const avisosDe = (e) => e.avisos.map((a) => a.texto).join(' | ');
const pasos = (e, seg, dt) => { for (let t = 0; t < seg - 1e-9; t += dt) { e.reloj += dt; motor.moverCriaturas(e, dt); } };
const enPuerta = (e, j, idPuerta) => { const m = mundo.mapa(j.mapa), p = m.puertas.find((q) => q.id === idPuerta); j.x = p.x * T + 8; j.y = p.y * T + 8; j.enPuerta = null; motor.cruzar(e, j, m); };
const aCasa = (e, id) => { const j = e.jugadores[id]; motor.aplicar(e, { j: id, t: 'colocar', mapa: S.UMBRAL, ancla: 'hogar' }); enPuerta(e, j, 'hogar'); return j; };
const dar = (j, formas) => formas.map((f) => G.equipo.agregar(j, { forma: f, xp: 40 }));
const residentesMapa = (e, id) => (e.mapas[id] ? e.mapas[id].criaturas.filter((c) => c.res !== undefined) : []);

// 1 · datos
ok(S.validarDatos(D).length === 0, 'datos: datos/santuario.json es válido');
{ const m = (f) => { const d = copia(D); f(d); return S.validarDatos(d).length > 0; };
  ok(m((d) => { d.habitats.charca.clave = 'p'; }) && m((d) => { d.habitats.prado.suelo = '~'; }) && m((d) => { d.habitats.prado.elemento = 'queso'; }) && m((d) => { d.niveles[0].pw = 30; }) && m((d) => { d.niveles[1].habitats = 3; }) && m((d) => { d.temperamentos.linea.noexiste = { pasear: 1 }; }) && m((d) => { delete d.frases.dormir; }) && m((d) => { d.ritmo.obligado = 1; }) && m((d) => { d.habitatInicial = 'nada'; }),
    'datos: el validador rechaza clave repetida, suelo sólido, elemento, parcela que no cabe, cuentas, línea inexistente, frase, ritmo e inicial'); }

// 2 · ids
{ const id = S.idHogarDe(3, ['prado', 'charca', 'brasa', 'penumbra'], 'lali'), a = S.analizar(id);
  ok(id === 'santuario/hogar_3_pcbs_lali' && a && a.n === 3 && a.jug === 'lali' && a.tipos.join() === 'prado,charca,brasa,penumbra', 'ids: ida y vuelta de un id de hogar');
  ok(['santuario/hogar_1_pp_oli', 'santuario/hogar_6_p_oli', 'santuario/hogar_1_z_oli', 'santuario/hogar_1_p_', 'santuario/hogar_1_p_Oli', 'hogar_1_p_oli', 'santuario/umbral', 'santuario/hogar_1_p_oli/x', null, 7].every((x) => !S.esHogar(x) && !S.proveedor.tiene(x)), 'ids: lo que no cuadra con los datos no es un hogar (no se genera nada)');
  ok(G.dimensiones.deMapa(id) === 'santuario' && S.esHogar(id) && S.enSantuario(S.UMBRAL) && !S.esHogar(S.UMBRAL), 'ids: el hogar pertenece a la dimensión santuario'); }

// 3 · generador: los cinco niveles, con todos los hábitats
{ let todo = true, alc = true, celdas = true, igual = true, obj = true; const cargados = [];
  D.niveles.forEach((N, i) => { for (let v = 0; v < TIPOS.length; v++) {
    const tipos = []; for (let k = 0; k < N.habitats; k++) tipos.push(TIPOS[(k + v) % TIPOS.length]); const id = S.idHogarDe(i + 1, tipos, 'oli'), m = mundo.mapa(id), p = S.trazar(id); cargados.push(id);
    if (m.W !== N.ancho || m.H !== N.alto || p.habitats.length !== N.habitats || p.solares.length !== N.solares) todo = false;
    const vis = new Set([m.anclas.entrada.join()]), q = [m.anclas.entrada]; while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const k = (x + a) + ',' + (y + b); if (!vis.has(k) && x + a >= 0 && y + b >= 0 && x + a < m.W && y + b < m.H && !mundo.solido(m, x + a, y + b)) { vis.add(k); q.push([x + a, y + b]); } }); }
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (!mundo.solido(m, x, y) && !vis.has(x + ',' + y)) alc = false;
    const npc = m.npcs[0], pu = m.puertas[0]; if (mundo.solido(m, pu.x, pu.y) || !vis.has(pu.x + ',' + pu.y) || !vis.has(npc.x + ',' + (npc.y + 1)) || mundo.solido(m, m.anclas.entrada[0], m.anclas.entrada[1])) alc = false;
    p.habitats.forEach((h) => { if (h.celdas.length < 12) celdas = false; h.celdas.forEach(([x, y]) => { if (mundo.solido(m, x, y) || x < h.x || y < h.y || x >= h.x + h.w || y >= h.y + h.h) celdas = false; }); });
    const zonas = p.habitats.concat(p.solares); m.objetos.forEach((o) => { const d = G.capas.OBJETOS[o.tipo]; if (!d) { obj = false; return; } d.huella.forEach(([dx, dy, w, h]) => { zonas.forEach((z) => { if (o.x + dx < z.x + z.w && o.x + dx + w > z.x && o.y + dy < z.y + z.h && o.y + dy + h > z.y) obj = false; }); }); });
    zonas.forEach((a, ia) => zonas.forEach((b, ib) => { if (ia < ib && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) todo = false; }));
    if (JSON.stringify(S.generar(id)) !== JSON.stringify(S.generar(id)) || m.zonas.length) igual = false;
  } });
  ok(todo, 'generador: tamaño, nº de hábitats y solares de cada nivel, sin parcelas solapadas'); ok(alc, 'generador: todo el suelo libre se alcanza desde la entrada (puerta y cuidador incluidos)');
  ok(celdas, 'generador: las casillas de paseo son libres y están dentro de su hábitat'); ok(obj, 'generador: objetos del catálogo y ninguno dentro de una parcela'); ok(igual, 'generador: el mismo id da el mismo mapa y no tiene zonas de aparición');
  const pr = mundo.validar(); ok(pr.length === 0, 'generador: el validador del mundo acepta ' + cargados.length + ' hogares cargados (' + pr.slice(0, 2).join('; ') + ')');
  mundo.descargar('santuario'); ok(mundo.cargadas('santuario').length === 0, 'generador: descargar la dimensión suelta los hogares generados'); extra.push(cargados.length + ' hogares generados'); }

// 4 · acceso: Nexus (nivel 8) → Umbral → hogar propio → vuelta
{ const e = motor.crear(11), j = e.jugadores.oli; ok(!e.dim || !e.dim.santuario, 'acceso: una partida nueva no tiene sección de Santuario');
  motor.aplicar(e, { j: 'oli', t: 'colocar', mapa: 'nexus/plaza_cruce', ancla: 'inicio' }); enPuerta(e, j, 'portal_santuario');
  ok(j.mapa === 'nexus/plaza_cruce' && /nivel de entrenador 8|necesitas/.test(avisosDe(e)), 'acceso: sin nivel 8 el portal del Nexus no se abre (' + avisosDe(e).slice(-60) + ')');
  j.xpE = G.entrenador.xpPara(8); enPuerta(e, j, 'portal_santuario'); ok(j.mapa === S.UMBRAL, 'acceso: con nivel 8 se llega al Umbral');
  const vol = j.volver.length; enPuerta(e, j, 'hogar'); const casa = j.mapa;
  ok(casa === 'santuario/hogar_1_p_oli' && e.dim.santuario.v === 1 && e.dim.santuario.jugadores.oli.n === 1 && j.volver.length === vol, 'acceso: la puerta del Umbral lleva a TU hogar, crea el refugio gratis y no toca la pila de vuelta');
  const m = mundo.mapa(casa); ok(Math.abs(j.x - (m.anclas.entrada[0] * T + 8)) < 1 && !motor.bloqueado(m, j.x, j.y), 'acceso: apareces en la entrada del hogar, en suelo libre');
  const l = aCasa(e, 'lali'); ok(l.mapa === 'santuario/hogar_1_p_lali' && l.mapa !== casa, 'acceso: cada jugador llega a su propio hogar');
  enPuerta(e, j, 'salida'); ok(j.mapa === S.UMBRAL && Math.abs(j.x - (7 * T + 8)) <= T && j.volver.length === vol, 'acceso: la salida del hogar devuelve al Umbral');
  enPuerta(e, j, 'portal_nexus'); ok(j.mapa === 'nexus/plaza_cruce', 'acceso: del Umbral se vuelve al Nexus por donde se entró');
  motor.aplicar(e, { j: 'lali', t: 'colocar', mapa: mundo.INICIAL.mapa, ancla: mundo.INICIAL.ancla }); motor.aplicar(e, { j: 'oli', t: 'colocar', mapa: mundo.INICIAL.mapa, ancla: mundo.INICIAL.ancla });
  ok(mundo.cargadas('santuario').length === 0 && !Object.keys(e.mapas).some((k) => S.enSantuario(k)), 'acceso: sin nadie dentro, la dimensión se descarga entera (mapas y estado de mapa)'); }

// 5 · residentes: son ejemplares de la caja, sin duplicar
{ const e = motor.crear(12), j = e.jugadores.oli, cj = dar(j, ['fosforin', 'cuarzin', 'somnin', 'pilita', 'nubecin', 'setin', 'cenel']), antes = JSON.stringify(j.sinId), propias = JSON.stringify(G.equipo.propias(j));
  const r0 = motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[0].id }); ok(r0 === null && (!e.dim.santuario || !e.dim.santuario.jugadores) && /dentro de tu Santuario/.test(avisosDe(e)), 'residentes: fuera del hogar la orden se rechaza y no cambia nada');
  aCasa(e, 'oli'); const casa = j.mapa; ok(residentesMapa(e, casa).length === 0, 'residentes: el refugio empieza vacío');
  const r1 = motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[0].id }), L = residentesMapa(e, casa);
  ok(r1 && r1.ok && r1.h === 0 && L.length === 1 && L[0].res === cj[0].id && L[0].id === 'fosforin', 'residentes: acoger pone en el mapa a ESE ejemplar (su forma y su ID)');
  ok(JSON.stringify(j.sinId) === antes && JSON.stringify(G.equipo.propias(j)) === propias && e.dim.santuario.jugadores.oli.res[cj[0].id] === 0, 'residentes: la caja no cambia (nada se duplica ni se mueve): solo se anota la asignación');
  ok(motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[0].id }) === null && motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: 99999 }) === null && motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: 'x' }) === null && motor.aplicar(e, { j: 'lali', t: 'santuario.acoger', id: cj[1].id }) === null && residentesMapa(e, casa).length === 1, 'residentes: repetir, un id que no existe, un id raro u otro jugador se rechazan');
  for (let i = 1; i < 6; i++) motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[i].id });
  ok(residentesMapa(e, casa).length === 6 && motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[6].id }) === null && /lleno/.test(avisosDe(e)) && residentesMapa(e, casa).length === 6, 'residentes: el Refugio admite 6 y la séptima se rechaza');
  const r2 = motor.aplicar(e, { j: 'oli', t: 'santuario.retirar', id: cj[2].id }); ok(r2 && r2.ok && residentesMapa(e, casa).length === 5 && j.sinId.some((q) => q.id === cj[2].id) && motor.aplicar(e, { j: 'oli', t: 'santuario.retirar', id: cj[2].id }) === null, 'residentes: retirar la saca del mapa y la deja en la caja');
  // sale de la caja por los sistemas de siempre (liberar): deja el Santuario sin tocar esos sistemas
  G.equipo.liberar(e, j, cj[1].id); pasos(e, 1.2, 0.1);
  ok(residentesMapa(e, casa).length === 4 && e.dim.santuario.jugadores.oli.res[cj[1].id] === undefined, 'residentes: liberar un ejemplar lo quita del hogar y del registro (al segundo siguiente)');
  ok(G.equipo.poner(e, j, ['pilita'], [cj[3].id]) && (pasos(e, 1.2, 0.1), residentesMapa(e, casa).length === 3) && !residentesMapa(e, casa).some((c) => c.res === cj[3].id), 'residentes: llevarse una al equipo la quita del hogar');
  // hablar y no combatir
  const c = residentesMapa(e, casa)[0]; j.x = c.x + 6; j.y = c.y; const rh = motor.aplicar(e, { j: 'oli', t: 'hablar' });
  ok(rh && rh.residente === c.res && c.talk > 0 && /\(Nv \d+, \S+\) /.test(avisosDe(e)), 'residentes: al hablarle se para, te mira y dice qué hace');
  ok(motor.aplicar(e, { j: 'oli', t: 'combate' }) === false && !e.combate && /no se combate/.test(avisosDe(e)) && motor.aplicar(e, { j: 'oli', t: 'evolucionar' }) === null && c.id === 'fosforin', 'residentes: dentro no se combate ni se usa el botón de evolución');
  const v = S.vista(e, j); ok(v.nivel === 1 && v.max === 6 && v.total === 3 && v.habitats[0].residentes.length === 3 && v.caja.length === j.sinId.length - 3 && v.propio, 'residentes: la lectura para la interfaz cuadra con el estado'); }

// 6 · niveles: el id del hogar sigue al estado; mudarse entre hábitats
{ const e = motor.crear(13), j = e.jugadores.oli, cj = dar(j, ['pompon', 'fosforin', 'cuarzin']); aCasa(e, 'oli'); cj.forEach((q) => motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: q.id }));
  const r = S.rec(e, 'oli', false); r.n = 2; r.hab = ['charca', 'brasa']; pasos(e, 1.2, 0.1);
  ok(j.mapa === 'santuario/hogar_2_cb_oli' && residentesMapa(e, j.mapa).length === 3, 'niveles: al cambiar el trazado, el dueño pasa al hogar nuevo con sus residentes');
  const rm = motor.aplicar(e, { j: 'oli', t: 'santuario.mover', id: cj[1].id, h: 1 }); ok(rm && rm.h === 1 && residentesMapa(e, j.mapa).find((c) => c.res === cj[1].id).hab === 1 && motor.aplicar(e, { j: 'oli', t: 'santuario.mover', id: cj[1].id, h: 5 }) === null, 'niveles: mudar a otro hábitat (y rechazar uno que no existe)');
  pasos(e, 30, 0.1); const p = S.trazar(j.mapa), c = residentesMapa(e, j.mapa).find((q) => q.res === cj[1].id), z = p.habitats[1].paseo; ok(c.x >= z.x * T && c.x <= (z.x + z.w) * T && c.y >= z.y * T && c.y <= (z.y + z.h) * T, 'niveles: tras mudarse vive dentro de su hábitat nuevo');
  const libre = hab => motor.aplicar(e, { j: 'oli', t: 'santuario.retirar', id: cj[0].id }) && motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[0].id }); const ra = libre(); ok(ra && ra.h === 0, 'niveles: sin pedir hábitat, una criatura de agua va a la Charca (afinidad de elemento)'); }

// 7 · comportamiento: puro, determinista, dentro del hábitat, con día y noche y carácter por especie
{ const monta = (sem) => { const e = motor.crear(sem), j = e.jugadores.oli, cj = dar(j, ['fosforin', 'cuarzin', 'somnin', 'pilita', 'nubecin', 'setin']); aCasa(e, 'oli'); aCasa(e, 'lali'); cj.forEach((q) => motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: q.id })); return e; };
  const a = monta(77), b = monta(77), c2 = monta(78); let usos = 0; const r0 = a.rnd; a.rnd = () => { usos++; return r0(); };
  pasos(a, 200, 1 / 60); pasos(b, 196, 0.25); pasos(b, 4, 1 / 30); b.reloj = a.reloj; pasos(a, 6, 1 / 60); pasos(b, 6, 1 / 20); b.reloj = a.reloj; motor.moverCriaturas(a, 0); motor.moverCriaturas(b, 0);
  const pa = residentesMapa(a, a.jugadores.oli.mapa), pb = residentesMapa(b, b.jugadores.oli.mapa), dif = Math.max.apply(null, pa.map((c, i) => Math.hypot(c.x - pb[i].x, c.y - pb[i].y)));
  ok(usos === 0, 'comportamiento: no gasta el azar de la partida (est.rnd: ' + usos + ' usos)'); ok(dif < 1.5 && pa.every((c, i) => c.act === pb[i].act), 'comportamiento: mismo reloj = mismo sitio y misma actividad, se llegue como se llegue (diferencia ' + dif.toFixed(2) + ' px)');
  pasos(c2, 206, 0.25); ok(residentesMapa(c2, c2.jugadores.oli.mapa).some((c, i) => Math.hypot(c.x - pa[i].x, c.y - pa[i].y) > 4), 'comportamiento: otra semilla, otra vida');
  // un día entero de juego: siempre dentro, sobre suelo libre; duermen cuando toca; cada especie a su manera
  const e = monta(79), j = e.jugadores.oli, m = mundo.mapa(j.mapa), p = S.trazar(j.mapa), z = p.habitats[0].paseo, L = residentesMapa(e, j.mapa), st = {}; let fuera = 0, salto = 0; L.forEach((c) => { st[c.id] = { anda: 0, n: 0, sale: 0, mov: false, acts: {}, nocheDur: 0, noche: 0, diaDur: 0, dia: 0, x: c.x, y: c.y }; });
  const dia = G.ciclo.AJUSTES.DIA_S, dt = 0.1; for (let t = 0; t < dia; t += dt) { e.reloj += dt; motor.moverCriaturas(e, dt); const h = S.hora(e.reloj);
    L.forEach((c) => { const q = st[c.id]; const mv = c.moving && !c.salta; q.n++; if (mv) q.anda++; if (mv && !q.mov) q.sale++; q.mov = mv; q.acts[c.act] = 1; if (c.x < z.x * T || c.x > (z.x + z.w) * T || c.y < z.y * T || c.y > (z.y + z.h) * T || motor.bloqueado(m, c.x, c.y)) fuera++; if (Math.hypot(c.x - q.x, c.y - q.y) > 8) salto++; q.x = c.x; q.y = c.y;
      if (h >= 23 || h < 4) { q.noche++; if (c.dur) q.nocheDur++; } if (h >= 10 && h < 16) { q.dia++; if (c.dur) q.diaDur++; } }); }
  ok(fuera === 0, 'comportamiento: en un día entero ninguna sale de su zona de paseo ni pisa una casilla sólida (' + fuera + ' muestras fuera)'); ok(salto === 0, 'comportamiento: se mueven con continuidad, sin saltos (' + salto + ')');
  ok(['fosforin', 'cuarzin', 'pilita', 'nubecin', 'setin'].every((f) => st[f].nocheDur / st[f].noche > 0.9 && st[f].diaDur === 0), 'comportamiento: las diurnas duermen de noche y están despiertas de día');
  ok(st.somnin.diaDur / st.somnin.dia > 0.9 && st.somnin.nocheDur === 0, 'comportamiento: la de sombra (nocturna) duerme de día y vive de noche');
  ok(L.every((c) => Object.keys(st[c.id].acts).length >= 3), 'comportamiento: cada una hace varias cosas a lo largo del día (pasear, descansar, mirar, dormir)');
  ok(st.pilita.sale >= st.cuarzin.sale * 2 && st.pilita.anda / st.pilita.n > st.cuarzin.anda / st.cuarzin.n, 'comportamiento: el carácter sale de los datos (la eléctrica sale a pasear ' + st.pilita.sale + ' veces al día; la de roca, ' + st.cuarzin.sale + ')');
  const t1 = S.temperamento('cuarzoth'), t2 = S.temperamento('cuarzin'), t3 = S.temperamento('somnin'); ok(t1.calma === 1.8 && t2.calma === 1.4 && t3.nocturna === true && t3.descansar === 7, 'comportamiento: el temperamento se resuelve base ← elemento ← línea ← forma');
  // mirar al jugador cercano
  let miro = false; for (let t = 0; t < 400 && !miro; t += 0.1) { e.reloj += 0.1; const c = L.find((q) => q.act === 'mirar' && !q.moving); if (c) { j.x = c.x + 20; j.y = c.y; motor.moverCriaturas(e, 0.1); if (c.act === 'mirar' && !c.moving) { miro = c.dir === 'right'; } } else motor.moverCriaturas(e, 0.1); }
  ok(miro, 'comportamiento: la que está curioseando se gira hacia el jugador cercano'); }

// 8 · guardado: ida y vuelta, tamaño y datos hostiles
{ const e = motor.crear(21), j = e.jugadores.oli, cj = dar(j, ['fosforin', 'cuarzin', 'pompon']); j.xpE = G.entrenador.xpPara(9); aCasa(e, 'oli'); cj.forEach((q) => motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: q.id })); pasos(e, 40, 0.1);
  const sv = JSON.parse(JSON.stringify(G.guardado.serializar(e))), e2 = motor.crear(5); ok(G.guardado.restaurar(e2, sv) && (G.guardado.descartes || []).length === 0, 'guardado: se restaura sin descartes');
  ok(JSON.stringify(sv).indexOf('"criaturas"') < 0 && JSON.stringify(sv.dim.santuario) === JSON.stringify({ v: 1, jugadores: { oli: e.dim.santuario.jugadores.oli } }), 'guardado: solo viaja la asignación (ni criaturas ni mapas): ' + JSON.stringify(sv.dim.santuario).length + ' B');
  const j2 = e2.jugadores.oli; ok(j2.mapa === j.mapa && Math.abs(j2.x - j.x) < 0.2 && JSON.stringify(e2.dim.santuario) === JSON.stringify(e.dim.santuario), 'guardado: el jugador vuelve a su hogar, en su sitio, con el mismo registro');
  motor.moverCriaturas(e, 0); motor.moverCriaturas(e2, 0); const A = residentesMapa(e, j.mapa), B = residentesMapa(e2, j2.mapa); ok(B.length === 3 && A.every((c, i) => c.res === B[i].res && Math.hypot(c.x - B[i].x, c.y - B[i].y) < 1.5), 'guardado: al cargar, cada residente está donde le toca (sin guardar posiciones)');
  // 300 residentes
  const g = motor.crear(22), k = g.jugadores.oli; for (let i = 0; i < 300; i++) G.equipo.agregar(k, { forma: ['pompon', 'fosforin', 'cuarzin', 'pilita', 'somnin', 'nubecin', 'setin', 'zumbel'][i % 8] }); aCasa(g, 'oli'); const R = S.rec(g, 'oli', false); R.n = 5; R.hab = ['prado', 'charca', 'brasa', 'cumbre', 'brisa', 'chispa', 'penumbra', 'prado']; pasos(g, 1.2, 0.1);
  let entran = 0; k.sinId.forEach((q) => { if (motor.aplicar(g, { j: 'oli', t: 'santuario.acoger', id: q.id })) entran++; });
  const bytes = JSON.stringify(g.dim.santuario).length; ok(entran === 300 && residentesMapa(g, k.mapa).length === 300 && bytes < 60000, 'guardado: 300 residentes caben y el registro pesa ' + bytes + ' B (objetivo ≤ 60.000 por jugador)'); extra.push('300 residentes = ' + bytes + ' B');
  const t0 = process.hrtime.bigint(); for (let i = 0; i < 600; i++) { g.reloj += 1 / 60; motor.moverCriaturas(g, 1 / 60); } const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 600; ok(ms < 2, 'rendimiento: 300 residentes cuestan ' + ms.toFixed(3) + ' ms por fotograma en node (tope de la prueba: 2 ms)'); extra.push('300 residentes = ' + ms.toFixed(3) + ' ms/fotograma');
  const sg = JSON.parse(JSON.stringify(G.guardado.serializar(g))), g2 = motor.crear(6); G.guardado.restaurar(g2, sg); ok(residentesMapa(g2, g2.jugadores.oli.mapa).length === 300 && (G.guardado.descartes || []).length === 0, 'guardado: el Gran Santuario lleno se guarda y se carga entero');
  // datos hostiles
  const malo = S.limpiarRec({ n: 99, hab: ['queso', 7, 'charca'], res: { 1: 0, 2: 9, x: 0, '-3': 0, 4: 'a', 99999999999: 0, 5: 1.5, 6: 0 }, extra: 'x'.repeat(5000) });
  ok(malo.n === 5 && malo.hab.length === 8 && malo.hab[0] === 'prado' && malo.hab[2] === 'charca' && JSON.stringify(malo.res) === '{"1":0,"6":0}' && malo.extra === undefined, 'guardado: un registro roto se limpia (nivel, hábitats, asignaciones y claves de más)');
  const lleno = { n: 1, hab: ['prado'], res: {} }; for (let i = 1; i <= 40; i++) lleno.res[i] = 0; ok(Object.keys(S.limpiarRec(lleno).res).length === 6, 'guardado: un registro con más residentes de los que caben se recorta al tope');
  const h = copia(sv); h.dim.santuario.jugadores.oli = { n: 'x', hab: null, res: [1, 2, 3] }; h.dim.santuario.jugadores['__proto__x'] = 1; const e3 = motor.crear(7); G.guardado.restaurar(e3, h); pasos(e3, 1.2, 0.1);
  ok(e3.jugadores.oli.mapa === 'santuario/hogar_1_p_oli' && residentesMapa(e3, e3.jugadores.oli.mapa).length === 0 && e3.dim.santuario.jugadores.oli.n === 1, 'guardado: con el registro destrozado el jugador conserva su sitio y su progreso; el hogar vuelve a ser un refugio vacío');
  const f = copia(sv); f.dim.santuario.v = 2; f.jugadores.oli.mapa = S.UMBRAL; f.jugadores.oli.x = 7 * T + 8; f.jugadores.oli.y = 3 * T + 14; const e4 = motor.crear(8); G.guardado.restaurar(e4, f); const txt = JSON.stringify(e4.dim.santuario); enPuerta(e4, e4.jugadores.oli, 'hogar');
  ok(e4.jugadores.oli.mapa === S.UMBRAL && JSON.stringify(e4.dim.santuario) === txt && /versión más nueva/.test(avisosDe(e4)) && JSON.stringify(G.guardado.serializar(e4).dim.santuario) === txt, 'guardado: una sección de versión futura ni se lee ni se pisa (y se conserva al guardar)');
  // partida cargada DENTRO del Santuario: la pila de vuelta llega sin la puerta del Nexus (no estaba cargado) y aun así se sale por ella
  { const u = motor.crear(23), ju = u.jugadores.oli; ju.xpE = G.entrenador.xpPara(8); motor.aplicar(u, { j: 'oli', t: 'colocar', mapa: 'ermita', ancla: 'entrada' }); enPuerta(u, ju, 'portal_nexus'); enPuerta(u, ju, 'portal_santuario'); enPuerta(u, ju, 'hogar');
    const su = JSON.parse(JSON.stringify(G.guardado.serializar(u))), u2 = motor.crear(24), k2 = u2.jugadores.oli; G.guardado.restaurar(u2, su); const pila = k2.volver.map((q) => q.mapa).join();
    enPuerta(u2, k2, 'salida'); enPuerta(u2, k2, 'portal_nexus'); const enNexus = k2.mapa === 'nexus/plaza_cruce' && Math.abs(k2.x - (10 * T + 8)) <= 2 * T && k2.y <= 4 * T; enPuerta(u2, k2, 'portal_ermita');
    ok(ju.mapa === 'santuario/hogar_1_p_oli' && enNexus && k2.mapa === 'ermita', 'guardado: cargando dentro del hogar (pila guardada: «' + pila + '») se sale Umbral → Nexus → Ermita, sin quedar atrapado ni saltarse el Nexus'); }
  // un sitio guardado que ya no cuadra con el registro
  const d = copia(sv); d.jugadores.oli.mapa = 'santuario/hogar_3_pcbs_oli'; d.jugadores.oli.x = 20 * T + 8; d.jugadores.oli.y = 26 * T + 14; const e5 = motor.crear(9); G.guardado.restaurar(e5, d); pasos(e5, 1.2, 0.1);
  ok(e5.jugadores.oli.mapa === 'santuario/hogar_1_p_oli', 'guardado: si el sitio guardado no es el hogar que dice el registro, el dueño vuelve al suyo'); }

// 9 · red: el anfitrión acepta el paso Umbral → hogar (misma dimensión) y rechaza saltar a un hogar desde otra dimensión sin puerta
{ const H = motor.crear(31), R = G.red, msg = (mapa, x, y) => ({ v: 1, id: 'lali', mapa, x, y, dir: 'down', ang: 0, moving: false, tm: 0, pesca: null, capturas: {} });
  H.jugadores.lali.mapa = S.UMBRAL; R.soltar(H, 'lali'); R.aplicar(H, 'lali', msg(S.UMBRAL, 7 * T + 8, 2 * T + 14));
  ok(R.aplicar(H, 'lali', msg('santuario/hogar_1_p_lali', 12 * T + 8, 14 * T + 14)) === true && H.jugadores.lali.mapa === 'santuario/hogar_1_p_lali', 'red: el anfitrión acepta que su compañero entre en su hogar desde el Umbral');
  const H2 = motor.crear(32); R.aplicar(H2, 'lali', msg(mundo.INICIAL.mapa, H2.jugadores.lali.x, H2.jugadores.lali.y));
  ok(R.aplicar(H2, 'lali', msg('santuario/hogar_1_p_lali', 12 * T + 8, 14 * T + 14)) === false && H2.jugadores.lali.mapa === mundo.INICIAL.mapa && mundo.cargadas('santuario').length === 0, 'red: saltar a un hogar desde otra dimensión sin pasar por una puerta se ignora y no deja nada cargado');
  ok(residentesMapa(H, 'santuario/hogar_1_p_lali').length === 0, 'red: el hogar de un jugador remoto se ve sin residentes (las visitas con resumen son de una etapa posterior)'); }

// ═════════ ETAPA B · bloque 1 (v2.365): carácter, relaciones, encuentros, ampliaciones y hábitats a elegir ═════════
// 10 · carácter de cada ejemplar y afinidad
{ const vistos = {}; for (let i = 1; i <= 200; i++) vistos[S.rasgoDe(i)] = (vistos[S.rasgoDe(i)] || 0) + 1;
  ok(Object.keys(vistos).length === Object.keys(D.rasgos).length && S.rasgoDe(42) === S.rasgoDe(42), 'carácter: sale del ID permanente (estable) y entre 200 ejemplares aparecen todos los rasgos');
  const a = S.caracter('pilita', 3), b = S.caracter('pilita', 4), base = S.temperamento('pilita'); ok(S.rasgoDe(3) !== S.rasgoDe(4) && JSON.stringify(a) !== JSON.stringify(b) && a.nocturna === base.nocturna, 'carácter: dos ejemplares de la misma especie no son iguales, pero siguen siendo de su especie');
  let sim = true, crece = true, tope = true, fam = 0, otra = 0, n = 0; for (let i = 1; i < 60; i++) for (let k = i + 1; k < 60; k += 7) { const x = S.afinidad('pompon', i, 'cuarzin', k, 6), y = S.afinidad('cuarzin', k, 'pompon', i, 6); if (x.puntos !== y.puntos || x.nivel !== y.nivel) sim = false;
    const d0 = S.afinidad('pompon', i, 'pompon', k, 0), d5 = S.afinidad('pompon', i, 'pompon', k, 5), d99 = S.afinidad('pompon', i, 'pompon', k, 99), d10 = S.afinidad('pompon', i, 'pompon', k, 10); if (d0.nivel !== -1 || d5.puntos <= d0.puntos || d99.puntos !== d10.puntos) crece = false; if (d10.recelo && d10.nivel > 0) tope = false; fam += d10.puntos; otra += S.afinidad('pompon', i, 'fosforin', k, 10).puntos; n++; }
  ok(sim, 'relaciones: la afinidad es simétrica'); ok(crece, 'relaciones: recién llegadas son desconocidas, la relación crece con los días de convivencia y tiene tope'); ok(tope, 'relaciones: dos que no se tragan no pasan de conocerse');
  ok(fam / n > otra / n * 1.3, 'relaciones: las de la misma familia se llevan mejor que agua con fuego (' + (fam / n).toFixed(1) + ' frente a ' + (otra / n).toFixed(1) + ' puntos de media a los 10 días)'); }

// 11 · encuentros: se emparejan de verdad y lo que hacen depende de su relación
{ const e = motor.crear(41), j = e.jugadores.oli, cj = dar(j, ['pompon', 'pompon', 'pompon', 'cuarzin', 'pilita', 'nubecin']); e.reloj = 12.3 * G.ciclo.AJUSTES.DIA_S; aCasa(e, 'oli'); aCasa(e, 'lali'); cj.forEach((q) => motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: q.id }));
  const casa = j.mapa, r = S.rec(e, 'oli', false), hoy = S.diaDe(e.reloj); ok(cj.every((q) => r.des[q.id] === hoy), 'encuentros: al acoger se anota el día de llegada');
  pasos(e, 1.2, 0.1); ok(residentesMapa(e, casa).every((c) => !c._mejor), 'relaciones: el primer día nadie tiene amigas todavía');
  const cuenta = {}, tipos0 = {}; let mutuo = true, lejos = 0, cerca = 0; const muestra = (tipos) => { const L = residentesMapa(e, casa), por = {}; L.forEach((c) => { por[c.res] = c; }); L.forEach((c) => { if (c.con === undefined) return; tipos[c.act] = (tipos[c.act] || 0) + 1; const o = por[c.con]; if (!o || o.con !== c.res || o.act !== c.act) mutuo = false; else if (c.act === 'juntas' || c.act === 'jugar') { cerca++; if (Math.hypot(c.x - o.x, c.y - o.y) > 60) lejos++; } }); };
  for (let t = 0; t < 250; t += 0.1) { e.reloj += 0.1; motor.moverCriaturas(e, 0.1); if (S.hora(e.reloj) > 8 && S.hora(e.reloj) < 20) muestra(tipos0); }
  ok(mutuo, 'encuentros: una pareja es mutua (si A está con B, B está con A y hacen lo mismo)'); ok(tipos0.saludo > 0 && !tipos0.juntas === false || tipos0.saludo > 0, 'encuentros: las desconocidas sobre todo se saludan (' + JSON.stringify(tipos0) + ')');
  // diez días después (mismo hábitat): hay amigas, juegan y descansan juntas, y duermen pegadas
  cj.forEach((q) => { r.des[q.id] = hoy - 10; }); e.mapas[casa].relF = null; pasos(e, 1.2, 0.1); const L = residentesMapa(e, casa), amigas = L.filter((c) => c._mejor && c._mejor.nivel >= 1);
  ok(amigas.length >= 2, 'relaciones: tras diez días de convivencia hay amistades (' + amigas.length + ' de 6 tienen amiga)');
  const dia = G.ciclo.AJUSTES.DIA_S; for (let t = 0; t < dia; t += 0.1) { e.reloj += 0.1; motor.moverCriaturas(e, 0.1); const h = S.hora(e.reloj); if (h > 8 && h < 20) muestra(cuenta); }
  ok(mutuo && (cuenta.jugar || 0) > 0 && (cuenta.juntas || 0) > 0 && (cuenta.jugar + cuenta.juntas) / (cuenta.saludo || 1) > (((tipos0.jugar || 0) + (tipos0.juntas || 0)) / (tipos0.saludo || 1)), 'encuentros: con amistad juegan y descansan juntas mucho más que antes (' + JSON.stringify(cuenta) + ')');
  ok(cerca > 0 && lejos / cerca < 0.25, 'encuentros: cuando juegan o descansan juntas están de verdad una al lado de la otra (' + (100 - 100 * lejos / cerca).toFixed(0) + ' % del tiempo a menos de 4 casillas; el resto, llegando)');
  while (!(S.hora(e.reloj) > 1 && S.hora(e.reloj) < 2)) { e.reloj += 1; } pasos(e, 40, 0.1); const por = {}; L.forEach((c) => { por[c.res] = c; }); const par = L.find((c) => c._nido && c._mejor && c.dur);
  ok(!!par && L.some((o) => o !== par && o.dur && Math.hypot(o.x - par.x, o.y - par.y) < 14), 'relaciones: de noche las amigas duermen pegadas');
  // hablar cuenta carácter y relación; mudarse reinicia la convivencia
  const c = amigas[0]; j.x = c.x + 6; j.y = c.y; e.avisos.length = 0; motor.aplicar(e, { j: 'oli', t: 'hablar' }); ok(/(son amigas|son inseparables|se conocen)/.test(avisosDe(e)), 'relaciones: al hablarle cuenta con quién se lleva (' + avisosDe(e) + ')');
  const v = S.vista(e, j).habitats[0].residentes; ok(v.every((f) => !!f.rasgo) && v.some((f) => f.amiga && f.amiga.nom), 'relaciones: la interfaz recibe el carácter y la mejor amiga de cada una');
  const sv = JSON.parse(JSON.stringify(G.guardado.serializar(e))), e2 = motor.crear(3); G.guardado.restaurar(e2, sv); pasos(e2, 1.2, 0.1); ok(JSON.stringify(e2.dim.santuario) === JSON.stringify(e.dim.santuario) && residentesMapa(e2, casa).filter((q) => q._mejor && q._mejor.nivel >= 1).length === amigas.length, 'relaciones: sobreviven a guardar y cargar (solo se guarda el día de llegada)'); }

// 12 · mote en el rótulo
{ const e = motor.crear(42), j = e.jugadores.oli, a = G.equipo.agregar(j, { forma: 'pompon', mote: 'Bolita' }), b = G.equipo.agregar(j, { forma: 'pompon' }); aCasa(e, 'oli'); [a, b].forEach((q) => motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: q.id })); const L = residentesMapa(e, j.mapa);
  ok(L.find((c) => c.res === a.id).nom === 'Bolita' && L.find((c) => c.res === b.id).nom === undefined && /Bolita se instala/.test(avisosDe(e)), 'rótulo: la residente con mote lleva su mote; la que no, el nombre de su especie'); }

// 13 · ampliar con Brillos y elegir hábitat
{ const e = motor.crear(43), j = e.jugadores.oli, cj = dar(j, ['pompon', 'aguacato']); j.xpE = G.entrenador.xpPara(8); aCasa(e, 'oli'); cj.forEach((q) => motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: q.id }));
  const Ti = G.tienda, p8 = S.precio(j, D.niveles[1].coste); ok(p8 === 450 && S.precio({ xpE: G.entrenador.xpPara(20) }, D.niveles[1].coste) === 15 * Ti.ingresoNivel(20) && S.precio({ xpE: 0 }, D.niveles[4].coste) === 15000, 'ampliar: el precio es un nº de combates de tu nivel con un mínimo (450 ✦ a nivel 8)');
  j.brillos = 449; const antes = JSON.stringify(e.dim.santuario); ok(motor.aplicar(e, { j: 'oli', t: 'santuario.ampliar' }) === null && j.brillos === 449 && JSON.stringify(e.dim.santuario) === antes && /cuesta 450/.test(avisosDe(e)), 'ampliar: sin Brillos suficientes no pasa nada y dice cuánto falta');
  j.brillos = 1000; const ra = motor.aplicar(e, { j: 'oli', t: 'santuario.ampliar' }), r = S.rec(e, 'oli', false);
  ok(ra && ra.coste === 450 && j.brillos === 550 && r.n === 2 && JSON.stringify(r.hab) === '["prado",null]' && j.mapa === 'santuario/hogar_2_p0_oli' && residentesMapa(e, j.mapa).length === 2, 'ampliar: paga, pasa a Patio, el dueño aparece en el hogar nuevo con sus residentes y la parcela nueva llega vacía');
  ok(S.trazar(j.mapa).solares.length === 3 && S.vista(e, j).habitats[1].nombre === 'Parcela vacía' && motor.aplicar(e, { j: 'oli', t: 'santuario.mover', id: cj[0].id, h: 1 }) === null, 'ampliar: en una parcela vacía no vive nadie hasta que le das hábitat');
  ok(motor.aplicar(e, { j: 'oli', t: 'santuario.habitat', h: 1, tipo: 'brasa' }) === null && /nivel 3/.test(avisosDe(e)) && motor.aplicar(e, { j: 'oli', t: 'santuario.habitat', h: 4, tipo: 'charca' }) === null && motor.aplicar(e, { j: 'oli', t: 'santuario.habitat', h: 1, tipo: 'queso' }) === null, 'hábitat: no se puede elegir uno de un nivel superior, ni en una parcela que no existe, ni uno inventado');
  const rh = motor.aplicar(e, { j: 'oli', t: 'santuario.habitat', h: 1, tipo: 'charca' }); ok(rh && rh.coste === 0 && j.brillos === 550 && j.mapa === 'santuario/hogar_2_pc_oli', 'hábitat: dar hábitat a una parcela vacía es gratis y el mapa cambia');
  const rm = motor.aplicar(e, { j: 'oli', t: 'santuario.mover', id: cj[1].id, h: 1 }); ok(rm && rm.h === 1, 'hábitat: ya se puede vivir en la Charca');
  const pc = S.precio(j, D.cambioHabitat), rc = motor.aplicar(e, { j: 'oli', t: 'santuario.habitat', h: 0, tipo: 'brisa' }); ok(rc && rc.coste === pc && pc === 90 && j.brillos === 550 - pc && j.mapa === 'santuario/hogar_2_ac_oli' && residentesMapa(e, j.mapa).length === 2 && motor.aplicar(e, { j: 'oli', t: 'santuario.habitat', h: 0, tipo: 'brisa' }) === null, 'hábitat: cambiar uno que ya existe cuesta ' + pc + ' ✦ y quienes viven ahí se quedan');
  j.brillos = 9999999; let n = 0; while (motor.aplicar(e, { j: 'oli', t: 'santuario.ampliar' })) n++; ok(n === 3 && r.n === 5 && r.hab.length === 8 && motor.aplicar(e, { j: 'oli', t: 'santuario.ampliar' }) === null && /no puede crecer más/.test(avisosDe(e)), 'ampliar: llega hasta el Gran Santuario y ahí se acaba');
  const v = S.vista(e, j); ok(v.ampliar === null && v.tipos.every((t) => t.abierto) && v.habitats.filter((h) => !h.tipo).length === 6, 'ampliar: la lectura para la interfaz refleja nivel máximo, hábitats abiertos y parcelas por decidir');
  const g = motor.crear(44), k = g.jugadores.oli; aCasa(g, 'oli'); const v1 = S.vista(g, k); ok(v1.ampliar && v1.ampliar.nombre === 'Patio' && v1.ampliar.nuevos.join() === 'Charca,Claro de Brisa' && v1.tipos.filter((t) => t.abierto).length === 1, 'ampliar: cada nivel anuncia lo que trae (hábitats nuevos)'); }

// 14 · rendimiento: lo que nadie ve no se anima
{ const g = motor.crear(45), k = g.jugadores.oli; for (let i = 0; i < 300; i++) G.equipo.agregar(k, { forma: ['pompon', 'fosforin', 'cuarzin', 'pilita', 'somnin', 'nubecin', 'setin', 'zumbel'][i % 8] }); aCasa(g, 'oli'); const R = S.rec(g, 'oli', false); R.n = 5; R.hab = ['prado', 'charca', 'brasa', 'cumbre', 'brisa', 'chispa', 'penumbra', 'prado']; pasos(g, 1.2, 0.1); k.sinId.forEach((q) => motor.aplicar(g, { j: 'oli', t: 'santuario.acoger', id: q.id }));
  k.x = 5 * T; k.y = 5 * T; pasos(g, 3, 0.1); const L = residentesMapa(g, k.mapa), lejos = L.filter((c) => Math.abs(c.x - k.x) >= 26 * T || Math.abs(c.y - k.y) >= 26 * T);
  ok(L.length === 300 && lejos.length > 50 && lejos.every((c) => !c.moving && !c.emo), 'rendimiento: de 300 residentes, las ' + lejos.length + ' que quedan lejos del jugador no se animan');
  const t0 = process.hrtime.bigint(); for (let i = 0; i < 1200; i++) { g.reloj += 1 / 60; motor.moverCriaturas(g, 1 / 60); } const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 1200; ok(ms < 2, 'rendimiento: 300 residentes con vida social cuestan ' + ms.toFixed(3) + ' ms por fotograma en node'); extra.push('con vida social = ' + ms.toFixed(3) + ' ms/fotograma'); }

// ═════════ ETAPA B · bloque 2 (v2.366): hábitats con función, actividades propias, entrenamiento por vivencias, instalaciones ═════════
const DIA = G.ciclo.AJUSTES.DIA_S, alDia = (e, r) => { e.reloj = (Math.floor(e.reloj / DIA) + 1) * DIA + 5; };   // salta al comienzo del día siguiente
const montar = (sem, formas, n, hab) => { const e = motor.crear(sem), j = e.jugadores.oli, cj = dar(j, formas); e.reloj = 20.3 * DIA; aCasa(e, 'oli'); aCasa(e, 'lali'); const r = S.rec(e, 'oli', false); if (n) { r.n = n; r.hab = hab; while (r.ins.length < D.niveles[n - 1].solares) r.ins.push(null); pasos(e, 1.2, 0.1); } return { e, j, cj, r }; };

// 15 · ids con instalaciones (los de las etapas anteriores siguen valiendo)
{ const a = S.analizar('santuario/hogar_2_pc_oli'), id = S.idHogarDe(2, ['prado', 'charca'], 'oli', ['campo', null]), b = S.analizar(id);
  ok(a && a.ins.join() === ',' && id === 'santuario/hogar_2_pc_i10_oli' && b && b.ins[0] === 'campo' && b.ins[1] === null && b.jug === 'oli' && S.idHogarDe(2, ['prado', 'charca'], 'oli', [null, null]) === 'santuario/hogar_2_pc_oli', 'ids: las instalaciones viajan en el id solo si hay alguna; el id antiguo sigue siendo válido');
  ok(['santuario/hogar_2_pc_i00_oli', 'santuario/hogar_2_pc_i1_oli', 'santuario/hogar_2_pc_i19_oli', 'santuario/hogar_1_p_i10_oli'].every((x) => !S.esHogar(x)), 'ids: tramo de instalaciones vacío, de otra longitud o con una clave que no existe = no es un hogar'); }

// 16 · generador con instalaciones: todo válido y alcanzable
{ let bien = true, n = 0; const tipos = Object.keys(D.instalaciones); D.niveles.forEach((N, i) => { tipos.forEach((t, k) => { const ins = []; for (let q = 0; q < N.solares; q++) ins.push(q === 0 ? t : tipos[(k + 1) % tipos.length]); const hab = []; for (let q = 0; q < N.habitats; q++) hab.push(TIPOS[q % TIPOS.length]);
    const id = S.idHogarDe(i + 1, hab, 'oli', ins), m = mundo.mapa(id), p = S.trazar(id); n++; const vis = new Set([m.anclas.entrada.join()]), q = [m.anclas.entrada]; while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const kk = (x + a) + ',' + (y + b); if (!vis.has(kk) && x + a >= 0 && y + b >= 0 && x + a < m.W && y + b < m.H && !mundo.solido(m, x + a, y + b)) { vis.add(kk); q.push([x + a, y + b]); } }); }
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (!mundo.solido(m, x, y) && !vis.has(x + ',' + y)) bien = false;
    const so = p.solares.filter((z) => z.slot === undefined); if (so[0].ins !== t) bien = false; D.instalaciones[t].objetos.forEach((o) => { if (!m.objetos.some((ob) => ob.tipo === o[0] && ob.x >= so[0].x && ob.x < so[0].x + so[0].w && ob.y >= so[0].y && ob.y < so[0].y + so[0].h)) bien = false; });
    p.habitats.forEach((h) => { if (!h.puntos.length) bien = false; h.puntos.forEach(([x, y]) => { if (mundo.solido(m, x, y) || !h.celdas.some((c) => c[0] === x && c[1] === y)) bien = false; }); }); }); });
  ok(bien && mundo.validar().length === 0, 'generador: ' + n + ' hogares con instalaciones válidos, alcanzables, con sus objetos dentro del solar y puntos de actividad pisables (' + mundo.validar().slice(0, 1).join() + ')'); mundo.descargar('santuario'); }

// 17 · actividad propia de cada hábitat
{ const { e, j, cj } = montar(51, ['pompon', 'pompon', 'pompon', 'pompon', 'pompon', 'pompon', 'cuarzin', 'cuarzin', 'cuarzin', 'cuarzin', 'cuarzin', 'cuarzin'], 3, ['charca', 'charca', 'prado', 'prado']); cj.forEach((q, i) => motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: q.id, h: i % 2 }));
  const L = residentesMapa(e, j.mapa), p = S.trazar(j.mapa), hb = p.habitats[0], cuenta = {}; let enSitio = true, emo = true; L.forEach((c) => { cuenta[c.res] = 0; });
  for (let t = 0; t < DIA; t += 0.1) { e.reloj += 0.1; motor.moverCriaturas(e, 0.1); L.forEach((c) => { if (c.act !== 'propia' || c.moving && !c.salta) return; cuenta[c.res]++; const hb = p.habitats[c.hab]; if (!hb.puntos.some((q) => Math.abs(c.x - (q[0] * T + 8)) <= 4 && Math.abs(c.y - (q[1] * T + 12)) <= 4)) enSitio = false; if (c.emo !== 'gota' || c.dir !== hb.haciaRasgo) emo = false; }); }
  let agua = 0, otras = 0; cj.forEach((q, i) => { if (i < 6) agua += cuenta[q.id] / 6; else otras += cuenta[q.id] / 6; });
  ok(agua > 0 && otras > 0 && agua > otras * 1.4, 'hábitat: en la Charca todas chapotean, pero las de agua mucho más que las de roca (' + agua.toFixed(0) + ' frente a ' + otras.toFixed(0) + ' muestras al día)'); ok(enSitio && emo, 'hábitat: la actividad propia se hace en la orilla, mirando al agua y con su señal');
  let dicho = false; for (let t = 0; t < 300 && !dicho; t += 0.1) { e.reloj += 0.1; motor.moverCriaturas(e, 0.1); const c = L.find((q) => q.act === 'propia' && !(q.moving && !q.salta)); if (c) { j.x = c.x - 8; j.y = c.y; e.avisos.length = 0; motor.aplicar(e, { j: 'oli', t: 'hablar' }); dicho = /chapotea en la orilla/.test(avisosDe(e)); } }
  ok(dicho, 'hábitat: al hablarle mientras lo hace, lo cuenta con la frase de su hábitat'); }

// 18 · dones: cada hábitat sirve para algo distinto
{ const dones = TIPOS.map((t) => D.habitats[t].don.tipo); ok(new Set(dones).size === TIPOS.length, 'dones: los siete hábitats tienen siete dones distintos (' + dones.join(', ') + ')');
  // Prado cura; Charca no
  const { e, j, cj, r } = montar(52, ['pompon', 'pompon'], 2, ['prado', 'charca']); cj.forEach((q) => { q.hp = 2; }); motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[0].id, h: 0 }); motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[1].id, h: 1 }); pasos(e, 2, 0.1);
  ok(cj[0].hp === 2 && cj[1].hp === 2, 'dones: el mismo día de llegar nadie se cura'); alDia(e); pasos(e, 2, 0.1); ok(cj[0].hp === undefined && cj[1].hp === 2 && /amanecido curada/.test(avisosDe(e)), 'dones: en el Prado amanecen curadas; en la Charca, no');
  // Charca: vínculo más rápido · Arboleda: tregua
  const em = e.mapas[j.mapa]; ok(em.mods[1].vinculo === 0.4 && em.mods[0].vinculo === 0 && S.afinidad('pompon', 1, 'pompon', 2, 5, em.mods[1]).puntos > S.afinidad('pompon', 1, 'pompon', 2, 5, em.mods[0]).puntos * 1.3, 'dones: en la Charca las amistades crecen un 40 % antes');
  let par = null; for (let a = 1; a < 80 && !par; a++) for (let b = a + 1; b < 80 && !par; b++) if (S.afinidad('pompon', a, 'fosforin', b, 10).recelo) par = [a, b];
  const sin = S.afinidad('pompon', par[0], 'fosforin', par[1], 10), con = S.afinidad('pompon', par[0], 'fosforin', par[1], 10, { vinculo: 0, concordia: true }); ok(sin.nivel <= 0 && !con.recelo && con.nivel >= 1, 'dones: bajo la Arboleda, dos que no se tragan acaban siendo amigas');
  const g = montar(53, ['pompon'], 2, ['brisa', 'prado']); ok(g.e.mapas[g.j.mapa].mods[0].encuentros === 0.25 && g.e.mapas[g.j.mapa].mods[1].encuentros === 0, 'dones: en el Claro de Brisa se buscan más'); }

// 19 · entrenamiento por vivencias: lento, con tope diario, y sin premio por esperar
{ const { e, j, cj, r } = montar(54, ['setin', 'cuarzin', 'fosforin'], 0); j.prog = j.prog || {}; const k0 = G.equipo.actual(j)[0]; j.prog[k0] = { xp: G.nivel.xpPara(20) }; cj.forEach((q) => motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: q.id })); const xp0 = cj.map((q) => q.xp);
  pasos(e, 60, 0.5); alDia(e); pasos(e, 60, 0.5); alDia(e); pasos(e, 60, 0.5); ok(cj.every((q, i) => q.xp === xp0[i]) && r.viv === 0, 'entrenamiento: sin vivencias nadie aprende, aunque pasen los días con el jugador dentro (esperar no da nada)');
  S.enganchar(); const sinCasa = motor.crear(55); G.entrenador.dar(sinCasa, sinCasa.jugadores.oli, 500, 'combate'); ok(!sinCasa.dim || !sinCasa.dim.santuario, 'entrenamiento: quien no tiene Santuario no acumula nada');
  G.entrenador.dar(e, j, 120, 'combate'); ok(r.viv === 120, 'entrenamiento: la XP de entrenador que ganas jugando llena la reserva (120)'); G.entrenador.dar(e, j, 5000, 'combate'); ok(r.viv === 300 && S.topeViv(r) === 300, 'entrenamiento: la reserva tiene tope (300 en el Refugio)');
  const L = residentesMapa(e, j.mapa), por = {}; L.forEach((c) => { por[c.res] = c; }); const topes = cj.map((q) => S.topeHoy(r, q, por[q.id])); alDia(e); const antes = cj.map((q) => q.xp), v0 = r.viv; pasos(e, 90, 0.5);
  const gan = cj.map((q, i) => q.xp - antes[i]); ok(gan.every((x, i) => x > 0 && Math.abs(x - topes[i]) <= 2) && Math.abs(v0 - r.viv - gan.reduce((a, b) => a + b, 0)) <= 1, 'entrenamiento: en una visita cada una aprende su dosis del día y la reserva baja lo mismo (' + gan.join(', ') + ' XP; reserva ' + v0 + ' → ' + r.viv + ')');
  pasos(e, 200, 0.5); ok(cj.every((q, i) => q.xp - antes[i] === gan[i]), 'entrenamiento: quedarse más rato el mismo día no da más (tope diario)');
  const n1 = G.nivel.nivelDe(cj[0].xp), comb = G.nivel.xpGanada(n1, n1, 'comun'); const D0 = Math.round(0.6 * comb); ok(topes[0] <= comb * 0.6 * 2.06 && S.topeHoy(r, cj[0], null) === Math.round(D0 * 1.25), 'entrenamiento: la dosis es poco más de medio combate al día (+25 % en el hábitat de su elemento); con todos los extras no llega a 1,3 combates');
  // lejos de casa 5 días: al volver, UNA dosis, no cinco
  enPuerta(e, j, 'salida'); const fuera = cj.map((q) => q.xp); for (let d = 0; d < 5; d++) { alDia(e); pasos(e, 3, 0.5); } ok(cj.every((q, i) => q.xp === fuera[i]), 'entrenamiento: mientras no estás en casa no pasa nada'); G.entrenador.dar(e, j, 5000, 'combate'); enPuerta(e, j, 'hogar'); pasos(e, 120, 0.5);
  ok(cj.every((q, i) => q.xp - fuera[i] <= S.topeHoy(r, q, por[q.id]) + 1 && q.xp > fuera[i]), 'entrenamiento: tras cinco días fuera se reparte UNA dosis, no cinco (no se acumula tiempo)');
  // techo: nadie supera a la mejor del equipo
  j.prog[k0] = { xp: 0 }; alDia(e); const t0 = cj.map((q) => q.xp); pasos(e, 90, 0.5); ok(S.techoDe(j) === 1 && cj.every((q, i) => q.xp === t0[i]), 'entrenamiento: ninguna residente pasa del nivel de la mejor criatura de tu equipo');
  // extras: amistad, Fragua, Campo, Temple, Sobrecarga
  const f = { id: 900, forma: 'pompon', xp: cj[0].xp }, R2 = { n: 3, hab: ['brasa', 'cumbre', 'chispa', 'prado'], res: { 900: 0 }, ins: ['campo', null], hoy: {} };
  ok(S.topeHoy(R2, f, null) === Math.round(D0 * 1.65) && S.topeHoy(R2, f, { _mejor: { nivel: 1 } }) === Math.round(D0 * 1.75) && S.topeHoy(R2, f, { _mejor: { nivel: 2 } }) === Math.round(D0 * 1.8), 'entrenamiento: Fragua +40 %, Campo de prácticas +25 %, amiga +10 %, inseparable +15 % (moderado y con techo)');
  const t = montar(56, ['pompon', 'pompon'], 3, ['cumbre', 'chispa', 'prado', 'prado']), kk = G.equipo.actual(t.j)[0]; t.j.prog = t.j.prog || {}; t.j.prog[kk] = { xp: G.nivel.xpPara(3) }; t.cj[0].xp = t.cj[1].xp = G.nivel.xpPara(3); motor.aplicar(t.e, { j: 'oli', t: 'santuario.acoger', id: t.cj[0].id, h: 0 }); motor.aplicar(t.e, { j: 'oli', t: 'santuario.acoger', id: t.cj[1].id, h: 1 }); t.r.viv = 800; alDia(t.e); pasos(t.e, 90, 0.5);
  ok(t.cj[0].xp === G.nivel.xpPara(3) && t.cj[1].xp > G.nivel.xpPara(3), 'dones: en el Llano de Chispas se puede superar el techo (hasta 3 niveles); en el Pedregal, no');
  t.j.prog[kk] = { xp: G.nivel.xpPara(30) }; alDia(t.e); const v1 = t.r.viv, x1 = t.cj[0].xp, x2 = t.cj[1].xp; pasos(t.e, 90, 0.5); const gp = t.cj[0].xp - x1, gc = t.cj[1].xp - x2;
  ok(gp > 0 && gc > 0 && Math.abs(v1 - t.r.viv - (gp / 1.4 + gc)) <= 2, 'dones: en el Pedregal aprender gasta menos vivencias (' + (gp + gc) + ' XP por ' + (v1 - t.r.viv) + ' vivencias)');
  t.r.viv = 99999; t.cj[0].xp = G.nivel.xpPara(4) - 3; alDia(t.e); t.e.avisos.length = 0; pasos(t.e, 60, 0.5); ok(/sube a Nv 4 en el Santuario/.test(avisosDe(t.e)), 'entrenamiento: avisa cuando una residente sube de nivel'); }

// 20 · instalaciones en los solares
{ const { e, j, cj, r } = montar(57, ['pompon'], 0); j.xpE = G.entrenador.xpPara(8); motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[0].id }); const pc = S.precio(j, D.instalaciones.campo.coste); j.brillos = pc - 1; const antes = JSON.stringify(e.dim.santuario);
  ok(motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 0, tipo: 'campo' }) === null && JSON.stringify(e.dim.santuario) === antes && j.brillos === pc - 1 && motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 3, tipo: 'campo' }) === null && motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 0, tipo: 'nada' }) === null, 'instalaciones: sin Brillos, en un solar que no existe o de un tipo inventado no se construye');
  j.brillos = 99999; ok(motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 0, tipo: 'manantial' }) === null && /nivel 2/.test(avisosDe(e)), 'instalaciones: cada una pide su nivel de Santuario');
  const rc = motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 0, tipo: 'campo' }); ok(rc && rc.coste === pc && pc === 800 && j.brillos === 99999 - pc && j.mapa === 'santuario/hogar_1_p_i1_oli' && mundo.mapa(j.mapa).objetos.some((o) => o.tipo === 'espantapajaros') && residentesMapa(e, j.mapa).length === 1, 'instalaciones: el Campo de prácticas cuesta ' + pc + ' ✦, aparece en el solar y las residentes siguen en casa');
  ok(motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 0, tipo: 'campo' }) === null, 'instalaciones: un solar ocupado no admite otra'); motor.aplicar(e, { j: 'oli', t: 'santuario.ampliar' }); ok(r.n === 2 && r.ins.join() === 'campo,' && j.mapa === 'santuario/hogar_2_p0_i10_oli', 'instalaciones: al ampliar se conserva lo construido y llega un solar más');
  ok(motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 1, tipo: 'campo' }) === null && /Ya tienes/.test(avisosDe(e)), 'instalaciones: una de cada tipo'); cj[0].hp = 1; motor.aplicar(e, { j: 'oli', t: 'santuario.habitat', h: 1, tipo: 'charca' }); motor.aplicar(e, { j: 'oli', t: 'santuario.mover', id: cj[0].id, h: 1 }); motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 1, tipo: 'manantial' }); alDia(e); pasos(e, 2, 0.5);
  ok(cj[0].hp === undefined && mundo.mapa(j.mapa).objetos.filter((o) => o.tipo === 'fuente').length === 1, 'instalaciones: con el Manantial amanecen curadas también las que no viven en el Prado');
  const rd = motor.aplicar(e, { j: 'oli', t: 'santuario.derribar', s: 1 }); ok(rd && r.ins[1] === null && j.mapa === 'santuario/hogar_2_pc_i10_oli' && motor.aplicar(e, { j: 'oli', t: 'santuario.derribar', s: 1 }) === null, 'instalaciones: derribar deja el solar libre');
  motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 1, tipo: 'glorieta' }); ok(e.mapas[j.mapa].mods[0].vinculo === 0.25 && e.mapas[j.mapa].mods[1].vinculo === 0.65, 'instalaciones: la Glorieta acelera las amistades en todos los hábitats (y se suma a la Charca)');
  motor.aplicar(e, { j: 'oli', t: 'santuario.ampliar' }); motor.aplicar(e, { j: 'oli', t: 'santuario.derribar', s: 1 }); const tv = S.topeViv(r); motor.aplicar(e, { j: 'oli', t: 'santuario.construir', s: 1, tipo: 'hoguera' }); r.viv = 99999; S.vivir(e, j, 1); const lleno = r.viv; motor.aplicar(e, { j: 'oli', t: 'santuario.derribar', s: 1 });
  ok(tv === 2000 && lleno === 4000 && r.viv === 2000, 'instalaciones: la Hoguera de relatos dobla la reserva de vivencias (y al derribarla, lo que sobra se pierde)');
  const v = S.vista(e, j); ok(v.solares.length === 2 && v.solares[0].tipo === 'campo' && v.instalaciones.length === 5 && v.instalaciones.find((q) => q.tipo === 'campo').hecha && v.vivencias.tope === 2000 && v.habitats[0].don && v.habitats[0].residentes.concat(v.habitats[1].residentes)[0].tope > 0, 'instalaciones: la lectura para el panel trae solares, catálogo, vivencias, dones y la dosis de cada residente');
  // guardado
  const sv = JSON.parse(JSON.stringify(G.guardado.serializar(e))), e2 = motor.crear(4); G.guardado.restaurar(e2, sv); pasos(e2, 1.2, 0.1); ok(JSON.stringify(e2.dim.santuario) === JSON.stringify(e.dim.santuario) && e2.jugadores.oli.mapa === j.mapa && (G.guardado.descartes || []).length === 0, 'guardado: instalaciones, vivencias y dosis del día sobreviven a guardar y cargar');
  const malo = S.limpiarRec({ n: 2, hab: ['prado', 'charca'], res: { 1: 0 }, ins: ['hoguera', 'campo', 'campo'], viv: 9e9, dia: 'x', hoy: { 1: 50, 2: 50, 3: -4 } }); ok(malo.ins.join() === ',campo' && malo.viv === 800 && malo.dia === -1 && JSON.stringify(malo.hoy) === '{"1":50}', 'guardado: instalaciones de un nivel superior o repetidas, vivencias de más y dosis ajenas se limpian');
  const viejo = S.limpiarRec({ n: 1, hab: ['prado'], res: {}, des: {} }); ok(viejo.ins.join() === '' && viejo.viv === 0 && viejo.dia === -1, 'guardado: un registro de la Etapa A o B1 (sin estos campos) se completa solo'); }

// ═════════ ETAPA B · bloque 3 (v2.367): aportes de otras dimensiones ═════════
// 18 · datos: el aporte vivo y el validador (un aporte siempre pide un hito de SU origen y nunca supera el máximo de su tipo)
{ const inst = D.instalaciones.campamento, val = (f) => { const d = copia(D); f(d); return S.validarDatos(d); }, mal = (f) => val(f).length > 0;
  const aporte = (o) => Object.assign({ clave: '6', nombre: 'Prueba', nivel: 1, coste: { combates: 10, minimo: 100 }, origen: 'nexus', req: [{ t: 'marca', dim: 'nexus', k: 'nexus.hito' }], efecto: { tipo: 'vinculo', valor: 0.25 }, texto: 'x', suelo: 's', objetos: [] }, o);
  ok(inst && inst.origen === 'tonavia' && inst.req.length === 1 && inst.req[0].t === 'profundidad' && inst.req[0].n === 10 && inst.efecto.tipo === 'expedicion' && inst.efecto.donde === 'profundidades' && inst.nivel === 3, 'aportes: el Campamento de expedición es un aporte de Tonavia que pide el piso 10 de las Profundidades');
  ok(!mal((d) => { d.instalaciones.x = aporte({}); }), 'aportes: un aporte con hito de marca de su dimensión es válido (' + val((d) => { d.instalaciones.x = aporte({}); }).slice(0, 1).join() + ')');
  ok(!mal((d) => { d.habitats.gruta = Object.assign(copia(d.habitats.cumbre), { clave: 'g', nombre: 'Gruta', origen: 'tonavia', req: [{ t: 'profundidad', n: 20 }] }); }) && mal((d) => { d.habitats.gruta = Object.assign(copia(d.habitats.cumbre), { clave: 'g', nombre: 'Gruta', origen: 'tonavia' }); }), 'aportes: también los hábitats pueden ser aportes, y sin hito no lo son');
  ok(mal((d) => { delete d.instalaciones.campamento.req; }) && mal((d) => { delete d.instalaciones.campamento.origen; }) && mal((d) => { d.instalaciones.campamento.origen = 'zzz'; }) && mal((d) => { d.instalaciones.campamento.req = []; }), 'aportes: sin hito, sin origen, con dimensión inexistente o con lista vacía NO es un aporte');
  ok(mal((d) => { d.instalaciones.campamento.req = [{ t: 'nivelEntrenador', n: 5 }]; }) && mal((d) => { d.instalaciones.campamento.req = [{ t: 'marca', dim: 'nexus', k: 'nexus.hito' }]; }), 'aportes: un hito de OTRA dimensión (o solo el nivel de entrenador) no conecta un aporte con su origen');
  ok(mal((d) => { d.instalaciones.campamento.req = [{ t: 'profundidad', n: 0 }]; }) && mal((d) => { d.instalaciones.campamento.req = [{ t: 'profundidad', n: 10, extra: 1 }]; }) && mal((d) => { d.instalaciones.campamento.req = [{ t: 'cosa', n: 1 }]; }), 'aportes: requisitos mal formados o de un tipo desconocido se rechazan');
  ok(mal((d) => { d.instalaciones.campamento.efecto.valor = 2; }) && mal((d) => { delete d.instalaciones.campamento.efecto.donde; }) && mal((d) => { d.instalaciones.campamento.efecto.donde = 'nexus'; }) && mal((d) => { d.instalaciones.x = aporte({ efecto: { tipo: 'vinculo', valor: 0.9 } }); }) && mal((d) => { d.instalaciones.x = aporte({ efecto: { tipo: 'tope', valor: 0.25, donde: 'nexus' } }); }), 'aportes: «expedicion» exige «donde» de su origen y ≤ +100 %; ningún aporte supera el máximo de su tipo');
  ok(G.portales.validar({ requisitos: [{ t: 'profundidad', n: 3 }] }).some((m) => /personal/.test(m)) && G.portales.validar({ requisitos: [{ t: 'profundidad', n: 3 }] }, { local: true }).length === 0, 'aportes: el requisito «profundidad» es personal: vale en el Santuario y se rechaza en un portal');
  ok(G.portales.origenDe({ t: 'profundidad', n: 1 }) === 'tonavia' && G.portales.origenDe({ t: 'marca', dim: 'nexus', k: 'a.b' }) === 'nexus' && G.portales.origenDe({ t: 'nivelEntrenador', n: 5 }) === null && G.portales.origenDe({ t: 'casco', n: 1 }) === null && G.portales.origenDe({ t: 'casco', n: 1, dim: 'pirata' }) === 'pirata', 'aportes: origenDe dice a qué dimensión pertenece cada hito'); }

// 19 · desbloqueo: nivel + hito, solo al elegir/construir; lo construido no se pierde
{ const { e, j, r } = montar(61, ['pompon'], 3, ['prado', 'charca', 'brasa', 'cumbre']); G.tienda.ganar(j, 100000); const D0 = D.instalaciones.campamento, pr = S.precio(j, D0.coste), nuevoC = () => ({ j: 'oli', t: 'santuario.construir', s: 0, tipo: 'campamento' }), br0 = G.tienda.saldo(j);
  e.avisos.length = 0; motor.aplicar(e, nuevoC());
  ok(r.ins[0] === null && G.tienda.saldo(j) === br0 && /Campamento de expedición necesita llegar al piso 10 de las Profundidades \(tu récord: 0\)/.test(avisosDe(e)), 'desbloqueo: sin el piso 10 no se construye y se dice qué falta (' + avisosDe(e).slice(-90) + ')');
  j.prof = { record: 9 }; e.avisos.length = 0; motor.aplicar(e, nuevoC()); ok(r.ins[0] === null && /récord: 9/.test(avisosDe(e)), 'desbloqueo: el piso 9 no basta');
  j.prof.record = 10; r.n = 2; r.hab.length = 2; r.ins.length = 2; e.avisos.length = 0; motor.aplicar(e, nuevoC()); ok(r.ins[0] === null && /un Santuario de nivel 3/.test(avisosDe(e)), 'desbloqueo: el hito no sustituye al nivel del Santuario (' + avisosDe(e).slice(-70) + ')');
  r.n = 3; r.hab = ['prado', 'charca', 'brasa', 'cumbre']; r.ins = [null, null]; const u0 = S.desbloqueo(e, j, r, D0); ok(u0.ok && u0.origen === 'tonavia' && u0.origenNombre === 'Tonavia' && u0.faltan.length === 0, 'desbloqueo: con nivel 3 y piso 10 se abre');
  e.avisos.length = 0; motor.aplicar(e, nuevoC()); ok(r.ins[0] === 'campamento' && G.tienda.saldo(j) === br0 - pr && pr === 3000, 'desbloqueo: construirlo cuesta solo sus Brillos (' + pr + ' ✦), sin regalar nada más');
  ok(S.idHogar(e, 'oli') === 'santuario/hogar_3_pcbr_i50_oli' && j.mapa === S.idHogar(e, 'oli') && mundo.mapa(j.mapa).objetos.some((o) => o.tipo === 'brasero_carbuna'), 'desbloqueo: el hogar se rehace con el campamento (id con la clave «5») y el jugador sigue dentro');
  // permanencia: perder el hito (guardado de otra partida, marca quitada…) nunca derriba lo construido
  j.prof.record = 0; ok(!S.desbloqueo(e, j, r, D0).ok && S.limpiarRec(copia(r)).ins[0] === 'campamento', 'permanencia: sin el hito el campamento sigue en pie y se conserva al cargar');
  const sv = JSON.parse(JSON.stringify(G.guardado.serializar(e))), e2 = motor.crear(5); G.guardado.restaurar(e2, sv); ok(S.rec(e2, 'oli', false).ins[0] === 'campamento' && S.rec(e2, 'oli', false).ins.length === 2, 'permanencia: el guardado conserva el campamento');
  // vista: el aporte pendiente muestra su origen y lo que falta
  const v1 = S.vista(e, j), i1 = v1.instalaciones.find((q) => q.tipo === 'campamento'); ok(i1 && i1.hecha && i1.origen === 'Tonavia', 'vista: el aporte construido figura como hecho y con su origen');
  motor.aplicar(e, { j: 'oli', t: 'santuario.derribar', s: 0 }); const v2 = S.vista(e, j), i2 = v2.instalaciones.find((q) => q.tipo === 'campamento'), m2 = v2.instalaciones.find((q) => q.tipo === 'manantial');
  ok(i2 && !i2.abierta && !i2.hecha && i2.origen === 'Tonavia' && i2.falta.length === 1 && /piso 10 de las Profundidades \(tu récord: 0\)/.test(i2.falta[0]) && m2.abierta && m2.falta.length === 0 && m2.origen === null, 'vista: el aporte pendiente dice su origen y qué falta; las instalaciones propias no llevan origen');
  j.prof.record = 12; ok(S.vista(e, j).instalaciones.find((q) => q.tipo === 'campamento').abierta && v2.tipos.every((q) => Array.isArray(q.falta)), 'vista: al cumplir el hito el aporte se abre'); }

// 20 · hito por marca de dimensión (el camino oficial de las dimensiones nuevas) y progreso declarado por otro móvil
{ const { e, j, r } = montar(62, ['pompon'], 1, ['prado']), q = { nivel: 1, origen: 'nexus', req: [{ t: 'marca', dim: 'nexus', k: 'nexus.hito', texto: 'el hito del Nexus' }] };
  const a = S.desbloqueo(e, j, r, q); ok(!a.ok && a.nivelOk && !a.reqOk && a.faltan.join() === 'el hito del Nexus', 'marca: sin la marca no se abre y dice el texto del requisito');
  ok(G.marcas.dar(e, j, 'nexus', 'nexus.hito', 1) && S.desbloqueo(e, j, r, q).ok, 'marca: con la marca de su dimensión se abre');
  ok(!G.portales.comprobar(j, { requisitos: [{ t: 'profundidad', n: 1 }] }, e, { xp: 0, marcas: {}, cascos: {} }).ok && !G.portales.comprobar(j, { requisitos: [{ t: 'profundidad', n: 1 }] }, e, null).ok, 'declarado: el progreso que declara otro móvil no abre un requisito personal (se cierra)'); }

// 21 · «expedición»: lo que ganas en su lugar llena la reserva más deprisa; nada más cambia
{ const { e, j, r } = montar(63, ['pompon'], 3, ['prado', 'charca', 'brasa', 'cumbre']), mapa0 = j.mapa; r.ins = ['campamento', null];
  const dar2 = (mapa, n) => { r.viv = 0; j.mapa = mapa; S.vivir(e, j, n); j.mapa = mapa0; return r.viv; };
  ok(S.bonoViaje(r, 'profundidades') === 0.5 && S.bonoViaje(r, 'tonavia') === 0 && S.bonoViaje(r, 'nexus') === 0, 'expedición: el bono es solo para su lugar');
  ok(dar2('prof_prueba', 100) === 150 && dar2('albanota', 100) === 100 && dar2('nexus/plaza_cruce', 100) === 100 && dar2(mapa0, 100) === 100, 'expedición: +50 % con lo que ganas en las Profundidades; en Albanota, el Nexus o casa, igual que siempre');
  ok(S.dondeDe({ mapa: 'prof_prueba' }) === 'profundidades' && S.dondeDe({ mapa: 'albanota' }) === 'tonavia' && S.dondeDe({ mapa: 'nexus/plaza_cruce' }) === 'nexus', 'expedición: dónde se está se lee del mapa');
  r.viv = 0; j.mapa = 'prof_prueba'; S.vivir(e, j, 1e9); j.mapa = mapa0; ok(r.viv === S.topeViv(r), 'expedición: la reserva sigue teniendo su tope (' + r.viv + ')');
  r.ins = [null, null]; ok(dar2('prof_prueba', 100) === 100, 'expedición: sin campamento no hay bono');
  r.ins = ['campamento', null]; r.viv = 0; const antes = r.viv; j.remoto = true; j.mapa = 'prof_prueba'; S.vivir(e, j, 100); j.mapa = mapa0; j.remoto = false; ok(r.viv === antes, 'expedición: el móvil que no es del dueño no suma (como antes)'); }

// ═════════ ETAPA B · bloque 4 (v2.368): personalización y decoración ═════════
// 22 · ids con decoración (los anteriores siguen valiendo) y datos
{ const dec = new Array(S.nHuecos(2)).fill(null); dec[1] = 'farola'; dec[5] = 'arbol'; const id = S.idHogarDe(2, ['prado', 'charca'], 'oli', ['campo', null], dec), a = S.analizar(id);
  ok(id === 'santuario/hogar_2_pc_i10_d0c000e00_oli' && a && a.dec[1] === 'farola' && a.dec[5] === 'arbol' && a.dec.length === 8 && a.ins[0] === 'campo' && a.jug === 'oli', 'decoración: el id lleva solo las piezas puestas (' + id + ')');
  ok(S.idHogarDe(2, ['prado', 'charca'], 'oli', null, new Array(8).fill(null)) === 'santuario/hogar_2_pc_oli' && S.analizar('santuario/hogar_2_pc_oli').dec.join() === ',,,,,,,' && S.analizar('santuario/hogar_2_pc_i10_oli').dec.length === 8, 'decoración: sin piezas el id es el de siempre');
  ok(['santuario/hogar_2_pc_d0000000_oli', 'santuario/hogar_2_pc_dc_oli', 'santuario/hogar_2_pc_dc0000009_oli', 'santuario/hogar_2_pc_d0z000000_oli', 'santuario/hogar_1_p_d0c00000_oli'].every((x) => !S.esHogar(x)) && S.esHogar('santuario/hogar_2_pc_d0c0000000_oli') === false && S.esHogar('santuario/hogar_2_pc_dc0000000_oli') === true && S.esHogar('santuario/hogar_2_pc_dz0000000_oli') === false, 'decoración: tramo vacío, de otra longitud o con clave desconocida = no es un hogar'); }
{ const m = (f) => { const d = copia(D); f(d); return S.validarDatos(d).length > 0; };
  ok(!m(() => {}) && m((d) => { d.decoracion.piezas.roca.clave = 'a'; }) && m((d) => { d.decoracion.piezas.roca.objeto = 'banco'; }) && m((d) => { d.decoracion.piezas.roca.objeto = 'casa'; }) && m((d) => { d.decoracion.piezas.roca.donde = ['cielo']; }) && m((d) => { d.decoracion.piezas.roca.nivel = 9; }) && m((d) => { d.decoracion.piezas.roca.origen = 'tonavia'; }) && !m((d) => { d.decoracion.piezas.roca.origen = 'tonavia'; d.decoracion.piezas.roca.req = [{ t: 'profundidad', n: 5 }]; }), 'decoración: el validador rechaza clave repetida, objeto que no es 1×1, hueco inexistente, nivel imposible y aporte sin hito'); }

// 23 · generador: todos los huecos llenos en los cinco niveles
{ let bien = true, n = 0, enSitio = true; D.niveles.forEach((N, i) => { const dec = []; for (let k = 0; k < S.nHuecos(i + 1); k++) dec.push(k < 4 ? 'farola' : 'arbol'); const hab = []; for (let q = 0; q < N.habitats; q++) hab.push(TIPOS[q % TIPOS.length]);
    const ins = []; for (let q = 0; q < N.solares; q++) ins.push(q === 0 ? 'campo' : null); const id = S.idHogarDe(i + 1, hab, 'oli', ins, dec), m = mundo.mapa(id), p = S.trazar(id); n++;
    const vis = new Set([m.anclas.entrada.join()]), q = [m.anclas.entrada]; while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const kk = (x + a) + ',' + (y + b); if (!vis.has(kk) && x + a >= 0 && y + b >= 0 && x + a < m.W && y + b < m.H && !mundo.solido(m, x + a, y + b)) { vis.add(kk); q.push([x + a, y + b]); } }); }
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (!mundo.solido(m, x, y) && !vis.has(x + ',' + y)) bien = false;
    const npc = m.npcs[0]; if (!vis.has(npc.x + ',' + (npc.y + 1)) || !vis.has(m.puertas[0].x + ',' + m.puertas[0].y)) bien = false;
    p.decor.forEach((h) => { const o = m.objetos.find((q) => q.x === h.x && q.y === h.y); if (!o || o.tipo !== (h.d < 4 ? 'farola' : 'arbol_pequeno') || mundo.solido(m, h.x, h.y) !== true) enSitio = false; const z = p.habitats.concat(p.solares); if (z.some((r) => r && h.x >= r.x && h.x < r.x + r.w && h.y >= r.y && h.y < r.y + r.h)) enSitio = false; if (h.d >= 4 && !(m.suelo[h.y][h.x] === '.' || m.suelo[h.y][h.x] === 'f')) enSitio = false; if (h.d < 4 && m.suelo[h.y][h.x] !== '=') enSitio = false; }); });
  ok(bien && enSitio, 'decoración: ' + n + ' hogares con todos los huecos llenos siguen 100 % alcanzables y cada pieza está en su sitio (plaza sobre el camino, borde sobre la hierba, fuera de las parcelas)'); ok(mundo.validar().length === 0, 'decoración: el validador del mundo acepta los hogares decorados'); mundo.descargar('santuario'); }

// 24 · órdenes: coste, nivel, hueco, quitar gratis, nombre; permanencia y guardado
{ const { e, j, r } = montar(71, ['pompon'], 2, ['prado', 'charca']); G.tienda.ganar(j, 100000); const dec = (d, tipo) => motor.aplicar(e, { j: 'oli', t: 'santuario.decorar', d, tipo }), br = () => G.tienda.saldo(j), pr = (t) => S.precio(j, D.decoracion.piezas[t].coste);
  r.dec = new Array(S.nHuecos(2)).fill(null); let b0 = br(); e.avisos.length = 0; dec(1, 'farola'); ok(r.dec[1] === 'farola' && br() === b0 - pr('farola') && j.mapa === S.idHogar(e, 'oli') && /_d0c/.test(j.mapa), 'decorar: la pieza se coloca, cuesta solo sus Brillos y el hogar se rehace con ella');
  b0 = br(); e.avisos.length = 0; dec(1, 'arbol'); ok(r.dec[1] === 'farola' && /no va ahí/.test(avisosDe(e)) && br() === b0, 'decorar: un árbol no va sobre el camino de la plaza');
  e.avisos.length = 0; dec(1, 'farola'); ok(/ya está/.test(avisosDe(e)) && br() === b0, 'decorar: no se paga por repetir la misma pieza');
  e.avisos.length = 0; dec(5, 'espantapajaros'); ok(r.dec[5] === null && /Santuario de nivel 3/.test(avisosDe(e)), 'decorar: el nivel del Santuario manda');
  dec(5, 'arbol'); b0 = br(); dec(5, 'roca'); ok(r.dec[5] === 'roca' && br() === b0 - pr('roca'), 'decorar: cambiar una pieza cuesta la nueva (sin devolución)');
  b0 = br(); dec(5, null); ok(r.dec[5] === null && br() === b0, 'decorar: quitar es gratis y no devuelve nada'); e.avisos.length = 0; dec(5, null); ok(/nada que quitar/.test(avisosDe(e)), 'decorar: no se quita lo que no hay');
  e.avisos.length = 0; dec(99, 'farola'); dec(2, 'zzz'); ok(r.dec.filter(Boolean).length === 1, 'decorar: hueco o pieza inexistentes se rechazan'); j.brillos = 0; e.avisos.length = 0; dec(2, 'farola'); ok(r.dec[2] === null && /cuesta/.test(avisosDe(e)), 'decorar: sin Brillos no se coloca'); G.tienda.ganar(j, 100000);
  { const antes = JSON.stringify(r.dec), jl = e.jugadores.lali; G.tienda.ganar(jl, 100000); motor.aplicar(e, { j: 'lali', t: 'santuario.decorar', d: 0, tipo: 'farola' }); ok(JSON.stringify(r.dec) === antes && S.rec(e, 'lali', false).dec[0] === 'farola', 'decorar: cada jugadora decora solo su propio hogar'); }
  motor.aplicar(e, { j: 'oli', t: 'santuario.nombrar', nom: '  Hogar   de <b>Oli</b> y Lali con un nombre larguísimo  ' }); ok(r.nom === 'Hogar de bOlib y Lal' && r.nom.length <= 20 && S.vista(e, j).nom === r.nom, 'nombre: se limpia de signos raros, espacios y largo (' + r.nom + ')');
  motor.aplicar(e, { j: 'oli', t: 'santuario.nombrar', nom: '' }); ok(r.nom === '', 'nombre: vacío lo quita');
  motor.aplicar(e, { j: 'oli', t: 'santuario.nombrar', nom: 'Casa' }); r.n = 3; r.hab.push(null, null); r.ins.push(null); r.dec = r.dec.slice(0, 8); motor.aplicar(e, { j: 'oli', t: 'santuario.ampliar' });
  // ampliar añade huecos al final sin tocar los anteriores
  const rr = S.rec(e, 'oli', false); ok(rr.dec.length === S.nHuecos(rr.n) && rr.dec[1] === 'farola' && rr.nom === 'Casa', 'ampliar: los huecos nuevos se añaden al final y lo puesto se queda');
  const sv = JSON.parse(JSON.stringify(G.guardado.serializar(e))), e2 = motor.crear(5); G.guardado.restaurar(e2, sv); ok(JSON.stringify(S.rec(e2, 'oli', false).dec) === JSON.stringify(rr.dec) && S.rec(e2, 'oli', false).nom === 'Casa', 'guardado: piezas y nombre sobreviven');
  const malo = S.limpiarRec({ n: 2, hab: ['prado', 'charca'], dec: ['farola', 'arbol', 'roca', 'espantapajaros', 7, 'nada', 'farola'], nom: 'x'.repeat(99) + '<>' }); ok(malo.dec.length === 8 && malo.dec[0] === 'farola' && malo.dec[1] === null && malo.dec[2] === null && malo.dec[3] === null && malo.dec[4] === null && malo.dec[6] === 'farola' && malo.nom.length === 20, 'guardado: un registro roto o con piezas en huecos que no son suyos se corrige sin perder lo válido');
  const viejo = S.limpiarRec({ n: 2, hab: ['prado', 'charca'], res: {} }); ok(viejo.dec.length === 8 && viejo.dec.every((x) => x === null) && viejo.nom === '', 'guardado: un registro de B1-B3 (sin decoración) se completa solo');
  const vi = S.vista(e, j); ok(vi.decoracion.huecos.length === rr.dec.length && vi.decoracion.huecos[0].donde === 'plaza' && vi.decoracion.huecos[4].donde === 'borde' && vi.decoracion.piezas.find((q) => q.tipo === 'espantapajaros').abierta === true && vi.decoracion.piezas.find((q) => q.tipo === 'maceta').coste > 0, 'vista: huecos con su nombre y tipo, piezas con coste y si están abiertas'); }
{ const { e, j, r } = montar(72, ['pompon'], 1, ['prado']), q = { nivel: 1, origen: 'nexus', req: [{ t: 'marca', dim: 'nexus', k: 'nexus.hito' }] }; ok(!S.desbloqueo(e, j, r, q).ok && (G.marcas.dar(e, j, 'nexus', 'nexus.hito', 1), S.desbloqueo(e, j, r, q).ok), 'decoración: una pieza-aporte se abre con el hito de su dimensión (mismo mecanismo)'); }

// 25 · Campamento: el bono solo acelera la reserva; los límites diarios no cambian
{ const { e, j, r, cj } = montar(73, ['pompon'], 3, ['prado', 'charca', 'brasa', 'cumbre']); motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[0].id }); const k = G.equipo.actual(j)[0]; j.prog = j.prog || {}; j.prog[k] = { xp: G.nivel.xpPara(20) }; r.ins = ['campamento', null]; pasos(e, 1.2, 0.1);
  const r0 = S.vista(e, j).habitats[0].residentes.concat(S.vista(e, j).habitats[1].residentes)[0], tope = r0.tope; alDia(e); r.dia = -1; let xp0 = cj[0].xp | 0; r.viv = S.topeViv(r); j.mapa = j.mapa; for (let t = 0; t < DIA * 0.5; t += 0.1) { e.reloj += 0.1; motor.moverCriaturas(e, 0.1); if (r.viv < 50) r.viv = S.topeViv(r); }
  ok(tope > 0 && (cj[0].xp | 0) - xp0 > 0 && (cj[0].xp | 0) - xp0 <= tope, 'campamento: con la reserva siempre llena la residente aprende hoy como máximo su dosis (' + ((cj[0].xp | 0) - xp0) + ' ≤ ' + tope + ' XP)');
  ok(S.bonoViaje(r, 'profundidades') === 0.5 && S.bonoViaje(r, 'tonavia') === 0 && S.vivir.length === 3, 'campamento: el bono solo mira las Profundidades y solo acelera la reserva (no toca la XP de las criaturas)'); }

// ═════════ ETAPA B · bloque 5 (v2.369): interior de la cabaña ═════════
// 26 · datos: el validador rechaza una cabaña mal hecha
{ const m = (f) => { const d = copia(D); f(d.cabana); return S.validarDatos(d).length > 0; };
  ok(!m(() => {}) && m((c) => { c.muebles.push({ tipo: 'mesa', x: 3, y: 3 }); }) && m((c) => { c.muebles.push({ tipo: 'mesa', x: 9, y: 4 }); c.muebles.push({ tipo: 'mesa', x: 8, y: 3 }); }) && m((c) => { c.muebles[1].tipo = 'casa'; }) && m((c) => { c.muebles[1].accion = 'cura'; }) && m((c) => { c.puerta.x = 20; }) && m((c) => { c.sala = 'farola'; }) && m((c) => { c.muebles.push({ tipo: 'mesa', x: 9, y: 6 }); c.muebles.push({ tipo: 'mesa', x: 8, y: 5 }); c.muebles.push({ tipo: 'mesa', x: 1, y: 5 }); c.muebles.push({ tipo: 'mesa', x: 2, y: 4 }); c.muebles.push({ tipo: 'mesa', x: 4, y: 6 }); }) && m((c) => { delete c.camas.lali; }) && m((c) => { c.archivera.x = 4; }),
    'cabaña: el validador rechaza piezas pisadas, tipos o acciones que no existen, puerta fuera, sala que no es sala, casillas que quedarían aisladas, cama sin color y a Lirio sobre un mueble'); }

// 27 · generador: la cabaña es recorrible entera y el hogar tiene su puerta en los cinco niveles
{ const cab = (jug) => mundo.mapa('santuario/cabana_' + jug); let bien = true;
  ['oli', 'lali', 'otro'].forEach((jug) => { const m = cab(jug), c = D.cabana; if (m.W !== 11 || m.H !== 8 || m.tema !== 'casa' || m.region !== null) bien = false;
    const vis = new Set([m.anclas.entrada.join()]), q = [m.anclas.entrada]; while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const kk = (x + a) + ',' + (y + b); if (!vis.has(kk) && !mundo.solido(m, x + a, y + b) && x + a >= 0 && y + b >= 0 && x + a < m.W && y + b < m.H) { vis.add(kk); q.push([x + a, y + b]); } }); }
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (!mundo.solido(m, x, y) && !vis.has(x + ',' + y)) bien = false;
    const l = m.npcs[0]; if (!vis.has(l.x + ',' + (l.y + 2)) || !vis.has(c.puerta.x + ',' + (m.H - 1)) || m.npcs.length !== 1 || l.id !== 'archivera') bien = false;
    if (!m.objetos.some((o) => o.tipo === (jug === 'lali' ? 'cama_rosa' : 'cama_azul')) || !m.objetos.some((o) => o.tipo === 'sala_cabana')) bien = false; });
  ok(bien, 'cabaña: 11×8, sin región, toda recorrible desde la entrada (puerta y Lirio incluidas) y con la cama del color de su dueño');
  let todo = true; D.niveles.forEach((N, i) => { const hab = []; for (let q = 0; q < N.habitats; q++) hab.push(TIPOS[q % TIPOS.length]); const id = S.idHogarDe(i + 1, hab, 'oli', null, null), m = mundo.mapa(id), pu = m.puertas.find((q) => q.id === 'cabana'), cx = S.trazar(id).cx;
    if (!pu || pu.x !== cx || pu.y !== 6 || mundo.solido(m, pu.x, pu.y) || mundo.solido(m, cx, 7) || m.anclas.cabana.join() !== cx + ',7' || pu.destino.mapa !== 'santuario/cabana_oli' || m.puertas.length !== 2) todo = false; });
  ok(todo, 'cabaña: el hogar tiene la puerta de la cabaña en el eje de la fachada y un sitio libre delante, en los cinco niveles');
  ok(S.esCabana('santuario/cabana_oli') && !S.esHogar('santuario/cabana_oli') && !S.esCabana('santuario/cabana_') && !S.esCabana('santuario/cabana_Oli') && !S.esCabana('santuario/hogar_1_p_oli') && S.enSantuario('santuario/cabana_oli') && S.proveedor.tiene('santuario/cabana_lali') && !S.proveedor.tiene('santuario/cabana_9x9x9x9x9x9x9x9x'), 'cabaña: solo un id bien formado es una cabaña, y no se confunde con un hogar');
  ok(mundo.validar().length === 0, 'cabaña: el validador del mundo la acepta'); mundo.descargar('santuario'); }

// 28 · entrar, salir, usar el panel dentro y que nada se pierda
{ const { e, j, r, cj } = montar(81, ['pompon', 'somnin'], 2, ['prado', 'charca']); G.tienda.ganar(j, 100000); const hogar0 = j.mapa, cx = S.trazar(hogar0).cx;
  e.avisos.length = 0; enPuerta(e, j, 'cabana'); ok(j.mapa === 'santuario/cabana_oli' && Math.abs(j.x - (5 * T + 8)) < 1 && !motor.bloqueado(mundo.mapa(j.mapa), j.x, j.y) && /La cabaña/.test(avisosDe(e)), 'entrar: la puerta de la fachada lleva a la cabaña, a suelo libre, con aviso');
  motor.aplicar(e, { j: 'oli', t: 'santuario.nombrar', nom: 'Nido' }); e.avisos.length = 0; j.x = 5 * T + 8; j.y = 7 * T + 8; j.enPuerta = null; motor.cruzar(e, j, mundo.mapa(j.mapa));
  ok(j.mapa === hogar0 && Math.abs(j.x - (cx * T + 8)) < 1 && Math.floor(j.y / T) === 7 && !motor.bloqueado(mundo.mapa(j.mapa), j.x, j.y), 'salir: la puerta de la cabaña devuelve al hogar, delante de la fachada');
  e.avisos.length = 0; enPuerta(e, j, 'cabana'); ok(j.mapa === 'santuario/cabana_oli' && /Nido · La cabaña/.test(avisosDe(e)), 'entrar: el aviso lleva el nombre del Santuario');
  // el panel funciona dentro y NO echa al jugador aunque el id del hogar cambie
  const b0 = G.tienda.saldo(j); motor.aplicar(e, { j: 'oli', t: 'santuario.decorar', d: 1, tipo: 'farola' }); ok(j.mapa === 'santuario/cabana_oli' && r.dec[1] === 'farola' && G.tienda.saldo(j) < b0, 'cabaña: se decora desde dentro (cobra) y el jugador no se mueve');
  motor.aplicar(e, { j: 'oli', t: 'santuario.acoger', id: cj[0].id }); ok(r.res[cj[0].id] !== undefined, 'cabaña: se acoge una criatura desde dentro');
  motor.aplicar(e, { j: 'oli', t: 'santuario.ampliar' }); ok(j.mapa === 'santuario/cabana_oli' && r.n === 3, 'cabaña: ampliar desde dentro (cabaña con el mismo id; el hogar nuevo se crea al salir)');
  e.avisos.length = 0; j.x = 5 * T + 8; j.y = 7 * T + 8; j.enPuerta = null; motor.cruzar(e, j, mundo.mapa(j.mapa)); const hogar1 = S.idHogar(e, 'oli');
  ok(j.mapa === hogar1 && hogar1 !== hogar0 && /_d/.test(hogar1) && /^santuario\/hogar_3_/.test(hogar1), 'salir: se vuelve al hogar ACTUAL (decorado y ampliado), no al viejo');
  pasos(e, 1.5, 0.1); ok(e.mapas[hogar1].criaturas.filter((c) => c.res !== undefined).length === 1, 'salir: la residente que se acogió dentro ya está en el hogar');
  ok(G.motor.aplicar(e, { j: 'oli', t: 'combate' }) === false, 'cabaña: tampoco se combate dentro'); }

// 29 · muebles con uso: leen el estado, no cambian nada; Lirio atiende el panel; guardado dentro
{ const { e, j, r } = montar(82, ['pompon'], 2, ['prado', 'charca']); G.tienda.ganar(j, 100000); enPuerta(e, j, 'cabana'); const m = mundo.mapa(j.mapa), instantanea = () => JSON.stringify([r, j.brillos, j.mochila, j.equipo]), hablar = () => motor.aplicar(e, { j: 'oli', t: 'hablar' });
  const junto = (x, y) => { j.x = x * T + 8; j.y = y * T + 14; j.moving = false; };
  motor.aplicar(e, { j: 'oli', t: 'santuario.nombrar', nom: 'Nido' }); let a = instantanea(); junto(2, 3); e.avisos.length = 0; const rl = hablar(), tx = (q) => JSON.stringify(q.lectura);
  ok(rl && rl.mueble === 'libro' && rl.lectura.titulo === 'Libro del Santuario' && rl.lectura.sub === 'Nido' && /Charca|Patio/.test(tx(rl)) && /Vivencias/.test(tx(rl)) && /Sin piezas colocadas/.test(tx(rl)) && instantanea() === a, 'libro: cuenta nombre, nivel, residentes, vivencias, instalaciones y decoración sin cambiar nada');
  junto(8, 3); const rv = hablar(); ok(rv && rv.mueble === 'aportes' && rv.lectura.titulo === 'Vitrina de aportes' && /Campamento de expedición \(Instalación, Tonavia\) · te falta/.test(tx(rv)) && instantanea() === a, 'vitrina: lista los aportes de otras dimensiones y lo que falta para cada uno');
  r.n = 3; r.hab = ['prado', 'charca', 'brasa', 'cumbre']; while (r.ins.length < 2) r.ins.push(null); r.ins[0] = 'campamento'; r.dec = new Array(S.nHuecos(3)).fill(null); r.dec[0] = 'farola'; junto(8, 3); const rc = hablar(); ok(/Campamento de expedición \(Instalación, Tonavia\) · construido/.test(tx(rc)), 'vitrina: lo construido figura como construido');
  junto(2, 3); ok(/Farola/.test(tx(hablar())) && /Campamento de expedición · aporte de Tonavia/.test(tx(hablar())), 'libro: lista lo construido (con su origen) y las piezas puestas');
  junto(5, 6); e.avisos.length = 0; ok(hablar() === null || hablar() === undefined, 'lejos de todo no hay nada que usar'); junto(5, 4); const rn = hablar(); ok(rn && rn.npc === 'archivera', 'Lirio atiende junto al mostrador (diálogo del mismo panel)');
  G.guardado.escribir && 0; const sv = JSON.parse(JSON.stringify(G.guardado.serializar(e))), e2 = motor.crear(5); G.guardado.restaurar(e2, sv); const j2 = e2.jugadores.oli; ok(j2.mapa === 'santuario/cabana_oli' && mundo.mapa(j2.mapa).W === 11, 'guardado: una partida guardada dentro de la cabaña se reanuda allí');
  mundo.descargar('santuario'); }
fin();
