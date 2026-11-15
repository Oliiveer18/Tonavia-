// game.js — PINTOR 2D y entrada (teclado, botones, cámara). Las reglas viven en src/mapas.js (datos del mundo) y src/motor.js (estado y órdenes); qué se ve de cada personaje (fotograma, altura, balanceo) lo calcula src/vista.js; aquí solo se dibuja y se mandan órdenes (paso 1.3a). Todo se dibuja por código (pixel art); sin imágenes externas.
(function () {
  'use strict';
  const G = window.G, P = G.PAL, T = 16;
  { const sin = G.formasSinDibujo(); if (sin.length) throw new Error('formas sin dibujo (están en src/lineas.js pero ningún def2 las define): ' + sin.join(', ')); }
  // Casillas del mundo (las 17 del editor: src/mapas.js). El juego dibujaba 5 (. f t ~ =); las otras 12 se dibujan igual que en tools/editor_mapas.html.
  const mundo = G.mundo, motor = G.motor;
  try { const h = (typeof location !== 'undefined' && location.hash || '').slice(1), f = { arenel: ['arenel'], nimbel: ['nubecin'], '3d': ['arenel', 'nubecin'] }[h]; if (f) G.aparicion.AJUSTES.FIJAS = f; } catch (e) { /* sin enlace especial */ }   // v2.230: enlace …#arenel / #nimbel / #3d = esas criaturas siempre salen en su claro (para revisar su modelo 3D)
  try { const q = (typeof location !== 'undefined' && /[?&]mapa=([a-z0-9_]+)/.exec(location.search || '')) || (typeof window.__MAPA_PRUEBA === 'string' && [0, window.__MAPA_PRUEBA]); if (q) { const m0 = mundo.mapa(q[1]); if (m0.anclas.inicio) mundo.INICIAL.mapa = q[1]; } } catch (e) { /* mapa que no existe: se queda el de siempre */ } // v2.54: ?mapa=<id> abre la partida en ese mapa. v2.57: sin la opción empieza en Albanota (src/mapas.js, INICIAL); ?mapa=pueblo_inicial abre el pueblo provisional, que queda como mapa de pruebas
  const nueva = (() => { try { return /[?&]nueva=1/.test(window.location.search); } catch (e) { return false; } })(); if (nueva) G.guardado.borrar();
  const recuperacion = (() => { try { return /[?&]recuperar=1/.test(window.location.search) && !nueva ? G.guardado.recuperarCopia() : null; } catch (e) { return null; } })();   // Multiverso F2: ?recuperar=1 restaura la copia de seguridad SOLO si el guardado principal es ilegible o falta (nunca si es válido o de versión futura)
  const arranque = G.guardado.cargar(() => motor.crear(Date.now() >>> 0)), est = arranque.est, leido = arranque.d || null, cargada = arranque.estado === 'cargada';   // Multiverso E1: un guardado ilegible o de versión futura no se toca ni se sobrescribe (G.guardado.bloqueo)
  const AVISO_BLOQUEO = { futuro: 'Tu partida guardada es de una versión más nueva del juego. No se ha tocado; esta sesión no se guarda. Actualiza el juego.', corrupto: 'No se pudo leer tu partida guardada. Se conserva sin tocar; esta sesión no se guarda.' }; if (G.guardado.bloqueo === 'corrupto' && G.guardado.copiaValida()) AVISO_BLOQUEO.corrupto += ' Hay una copia de seguridad: abre el juego con ?recuperar=1 para restaurarla (se pierde lo jugado desde la última vez que arrancó).'; if (recuperacion && !recuperacion.ok && G.guardado.bloqueo) AVISO_BLOQUEO[G.guardado.bloqueo] += ' No se pudo recuperar la copia (' + recuperacion.motivo + ').'; if (cargada && G.agentes && leido && leido.guardadoEn > 0) G.agentes.ponerAlDia(est, (Date.now() - leido.guardadoEn) / 1000);   // v2.324: el tiempo con el juego cerrado también pasó para los entrenadores (con tope)
  // v2.189 (1.3f): continúa donde lo dejaste (?nueva=1 empieza de cero)
  // // estado de la partida: los dos jugadores, sus mapas y las criaturas (semilla = el azar de esta partida)
  let M, W, H; // mapa del jugador local y su tamaño en casillas
  const at = (tx, ty) => mundo.at(M, tx, ty);
  const solid = (tx, ty) => mundo.solido(M, tx, ty);
  const hash = (x, y, k) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; };
  const NUEVAS = 'gsrclb#hd_mx'; // las 12 casillas que el juego no dibujaba antes del 1.3a
  function drawTile(c, ch, tx, ty, mapa) {
    if (mapa && G.sombreado.suelo(c, ch, tx, ty, mapa, T)) return; // v2.21: suelo sombreado (src/sombreado.js); devuelve false si está apagado o la casilla no es de las suyas
    const x = tx * T, y = ty * T, r = (col, a, b, w, h) => { c.fillStyle = col; c.fillRect(x + a, y + b, w, h); };
    const grass = () => { r(P.green, 0, 0, T, T); for (let i = 0; i < 5; i++) { const h = hash(tx, ty, i); r(P.green2, h % 15, (h >> 4) % 15, 1, 2); } };
    if (ch === '~') {
      r(P.blue, 0, 0, T, T); r(P.blue2, 0, T - 2, T, 2);
      for (let i = 0; i < 3; i++) { const h = hash(tx, ty, i + 9); r('#8fb4f0', h % 11, 2 + ((h >> 5) % 10), 4, 1); }
    } else if (NUEVAS.indexOf(ch) >= 0) { // casillas nuevas (paso 1.3a): mismo dibujo que el editor de mapas
      const v = hash(tx, ty, 31) % 4, speck = (base, dark, n, w, h2) => { r(base, 0, 0, T, T); for (let i = 0; i < n; i++) { const h = hash(v, 5, i); r(dark, h % 14, (h >> 4) % 15, w, h2); } };
      if (ch === 'g') { r(P.green2, 0, 0, T, T); for (let i = 0; i < 7; i++) { const h = hash(v, 3, i), gx = h % 14, gy = 2 + ((h >> 4) % 12); r(P.green, gx, gy - 2, 1, 4); r('#7cc972', gx + 1, gy - 3, 1, 3); } }
      else if (ch === 's') speck(P.cream2, '#d3bb86', 6, 2, 1);
      else if (ch === 'r') { r(P.stone2, 0, 0, T, T); r(P.stone1, 0, 0, T, 3); r(P.stone3, 0, T - 3, T, 3); for (let i = 0; i < 3; i++) { const h = hash(v, 6, i); r(P.stone1, h % 11, 3 + ((h >> 4) % 8), 4, 2); r(P.stone3, (h >> 3) % 11, 5 + ((h >> 6) % 7), 3, 1); } }
      else if (ch === 'c') speck('#4a4260', '#3a3350', 6, 3, 2);
      else if (ch === 'l') { r(P.red, 0, 0, T, T); for (let i = 0; i < 4; i++) { const h = hash(v, 7, i); r(P.orange, h % 11, (h >> 4) % 13, 5, 2); r(P.yellow, (h >> 2) % 11, (h >> 6) % 13, 2, 1); } r(P.red2, 0, T - 2, T, 2); }
      else if (ch === 'b') { r(P.blue, 0, 0, T, T); r(P.blue2, 0, T - 2, T, 2); r(P.wood1, 0, 2, T, 12); for (let yy = 2; yy < 14; yy += 4) r(P.wood3, 0, yy + 3, T, 1); r(P.woodD, 0, 2, T, 1); r(P.woodD, 0, 13, T, 1); }
      else if (ch === '#') { r(P.cream2, 0, 0, T, T); for (let yy = 0; yy < T; yy += 4) { r('#c9b48a', 0, yy + 3, T, 1); for (let xx = (yy / 4) % 2 ? 4 : 0; xx < T; xx += 8) r('#c9b48a', xx, yy, 1, 3); } r(P.wood3, 0, T - 2, T, 2); }
      else if (ch === 'h') { r(P.red2, 0, 0, T, T); for (let yy = 0; yy < T; yy += 4) { r(P.red, 0, yy, T, 3); for (let xx = (yy / 4) % 2 ? 3 : 0; xx < T; xx += 6) r(P.red2, xx, yy, 1, 3); } r(P.ink, 0, T - 1, T, 1); }
      else if (ch === 'd') { r(P.cream2, 0, 0, T, T); r(P.woodD, 3, 1, 10, 15); r(P.brown, 4, 2, 8, 14); r(P.wood3, 7, 2, 1, 14); r(P.yellow, 10, 9, 2, 2); }
      else if (ch === '_') { r(P.wood1, 0, 0, T, T); for (let yy = 0; yy < T; yy += 4) { r(P.wood2, 0, yy + 3, T, 1); const h = hash(v, 8, yy); r(P.wood2, h % 14, yy, 1, 3); } }
      else if (ch === 'm') { r(P.wood1, 0, 0, T, T); r(P.woodD, 1, 3, 14, 11); r(P.brown, 2, 4, 12, 4); r(P.wood3, 2, 9, 12, 4); r(P.yellow, 7, 10, 2, 1); }
      else if (ch === 'x') r(P.ink, 0, 0, T, T);
    } else if (ch === '=') {
      r('#e0c48c', 0, 0, T, T); for (let i = 0; i < 5; i++) { const h = hash(tx, ty, i + 3); r('#c9a96c', h % 15, (h >> 4) % 15, 2, 1); }
    } else {
      grass();
      if (ch === 'f') for (let i = 0; i < 3; i++) { const h = hash(tx, ty, i + 20), col = [P.pink, P.yellow, P.white][i], fx = 2 + (h % 11), fy = 2 + ((h >> 4) % 11); r(col, fx, fy, 2, 2); r(P.orange, fx, fy, 1, 1); r(P.green2, fx, fy + 2, 1, 2); }
      if (ch === 't') { // árbol: tronco y copa en capas
        r(P.woodD, 6, 10, 4, 6); r(P.brown, 6, 10, 2, 6);
        r(P.green2, 1, 2, 14, 10); r(P.green, 2, 1, 12, 9); r(P.green, 4, 0, 8, 2); r('#7cc972', 4, 3, 3, 2); r('#7cc972', 9, 6, 3, 2); r(P.green2, 3, 9, 10, 3);
      }
    }
  }
  function fondo(m) { return G.capas.fondo(m, drawTile); }
  const clasico = () => !!(G.clasico && G.clasico.ACTIVO); // v2.112: estilo 2D clásico (src/clasico2d.js); el HD-2D sigue usando fondo() de siempre
  // v2.320: una unidad del jugador (acompañante o luchadora) cuya especie tiene una cría activa se pinta con el sprite sintetizado de esa cría
  function sprDe(u) { const jid = u.id === 'acomp' ? (est.acomp && est.acomp.j) : typeof u.id === 'string' && u.id.indexOf('j_') === 0 ? u.id.slice(2) : null, j = jid && est.jugadores[jid], c = j && G.crianza && G.criaSprite ? G.crianza.activa(j, u.forma) : null; return c ? (id, dir, f) => G.criaSprite(c, dir, f) || spr2d(id, dir, f) : spr2d; }
  function fondo2d(m) { if (m.prof) return G.cueva2d.fondo(m); /* v2.320: un piso de las Profundidades tiene su propio suelo (src/cueva2d.js) */ return clasico() ? G.capas.fondo(m, G.clasico.casilla(drawTile), 'c:' + m.id) : fondo(m); } // suelo horneado por G.capas (src/capas.js): casillas + decorado bajo
  let bg;

  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  // Cámara: la pantalla muestra solo una parte del mapa (zoom) y sigue a quien juegas. VW/VH = tamaño de la vista en píxeles del juego; fit() los calcula.
  G.ic = (n, c) => '<i class="ic ' + (c ? c + ' ' : '') + 'i-' + n + '"></i>';   // v2.298: icono de píxel (clases .i-* del tema de index.html)
  const ZOOM2D = [{ f: 1.3, n: 'lejos' }, { f: 1, n: 'normal' }, { f: 0.75, n: 'cerca' }, { f: 0.55, n: 'muy cerca' }]; let zoom2d = 2; // v2.281: zoom del 2D (botón 🔍, no se recuerda entre sesiones: game.js no guarda nada); por defecto «cerca»
  let VW = 0, VH = 0, K = 1, KS = 1, Kc = 1;   // KS (v2.196): píxeles de PANTALLA por cada píxel del juego, siempre un entero (así todos los píxeles salen iguales con cualquier densidad de pantalla)
  const cam = { x: 0, y: 0 };
  const NAME = { oli: 'Oli', lali: 'Lali' }, OTHER = { oli: 'lali', lali: 'oli' };
  G.mapaActual = () => yo().mapa; // v2.62: el botón «Editar mapa» abre el editor en el mapa donde estás
  const yo = () => est.jugadores[S.me || 'oli']; // el jugador de este móvil (antes de elegir, Oli: se ve el mismo mapa)
  const S = { me: null }; // S.x, S.y, S.dir, S.moving y S.tm son los del jugador local (están en el estado del motor)
  ['x', 'y', 'dir', 'moving', 'tm'].forEach((k) => Object.defineProperty(S, k, { get: () => yo()[k], set: (v) => { yo()[k] = v; }, enumerable: true }));
  const keys = { up: 0, down: 0, left: 0, right: 0 }; // teclas del jugador local; en cada paso se mandan como orden 'teclas'
  function cambiarMapa() { M = mundo.mapa(yo().mapa); W = M.W; H = M.H; bg = fondo2d(M); }
  cambiarMapa(); VW = W * T; VH = H * T;
  function refrescarSombreado() { G.spriteCacheClear(); G.capas.limpiar(); bg = fondo2d(M); if (hd) G.hd2d.reconstruir(); } // v2.21: tras encender o apagar el sombreado se vuelve a dibujar el suelo y los sprites
  { const sb = document.getElementById('sbtn'); if (sb && sb.addEventListener) { // botón «Sombras»: compara el dibujo de siempre con el sombreado
      const pinta = () => { sb.innerHTML = G.ic('sombra') + (G.SOMBREADO.ACTIVO ? 'Sombras: sí' : 'Sombras: no'); sb.setAttribute('aria-pressed', String(G.SOMBREADO.ACTIVO)); };
      sb.addEventListener('click', () => { G.SOMBREADO.ACTIVO = !G.SOMBREADO.ACTIVO; refrescarSombreado(); pinta(); }); pinta(); } }
  const lista = () => motor.criaturas(est, yo().mapa); // criaturas del mapa donde está el jugador local
  const orden = (o) => motor.aplicar(est, Object.assign({ j: S.me || 'oli' }, o));
  const nearest = () => motor.cercana(est, yo());
  let timerAviso = 0;
  function say(text) { const el = document.getElementById('who'); el.textContent = text; clearTimeout(timerAviso); timerAviso = setTimeout(() => { el.textContent = 'Juegas con ' + NAME[S.me] + G.redPeer.sufijo(); }, 3000); }
  let timerNv = 0;
  function avisoBloqueo() {   // Multiverso E1: cartel que se queda hasta que el jugador lo toca (la cabecera recorta los textos largos y este aviso hay que leerlo)
    const el = document.createElement('div'); el.id = 'gbl'; el.style.cssText = 'position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:40;padding:12px 16px;background:#24121d;color:#fff4dc;border:3px solid #e8b83a;box-shadow:0 0 0 3px #24121d;font-size:16px;line-height:1.35;text-align:center;width:84vw;max-width:420px';
    const t = document.createElement('div'); t.textContent = AVISO_BLOQUEO[G.guardado.bloqueo]; const c = document.createElement('div'); c.textContent = 'Toca para cerrar'; c.style.cssText = 'margin-top:8px;font-size:12px;color:#e8b83a'; el.appendChild(t); el.appendChild(c); el.addEventListener('click', () => el.remove()); document.body.appendChild(el);
  }
  function cartelNivel(texto) {   // v2.303: XP y subida de nivel, bien visibles en mitad de la pantalla (la cabecera es pequeña)
    let el = document.getElementById('nvl'); if (!el) { el = document.createElement('div'); el.id = 'nvl'; el.style.cssText = 'position:fixed;left:50%;top:26%;transform:translateX(-50%);z-index:30;pointer-events:none;padding:10px 16px;background:#24121d;color:#fff4dc;border:3px solid #e8b83a;box-shadow:0 0 0 3px #24121d;font-size:18px;text-align:center;max-width:86vw;transition:opacity .4s;opacity:0'; document.body.appendChild(el); }
    el.textContent = texto; el.style.color = /sube/.test(texto) ? '#ffd23f' : '#fff4dc'; el.style.opacity = '1'; clearTimeout(timerNv); timerNv = setTimeout(() => { el.style.opacity = '0'; }, /sube/.test(texto) ? 3800 : 2200);
  }
  function avisos() { refrescarBril(); est.avisos.splice(0).forEach((a) => { if (a.j === (S.me || 'oli')) { if (/XP/.test(a.texto) && !a.suave) cartelNivel(a.texto); else say(a.texto); } }); } // los avisos del otro jugador se los queda él (1.3d los enviará)
  function evolve(c) { const i = c ? lista().indexOf(c) : -1; const r = orden({ t: 'evolucionar', i: i >= 0 ? i : undefined }); avisos(); if (r) G.audio.sfx('evolucionar'); return r; } // v0.9 (paso 3): la criatura pasa a su siguiente fase. Sin condiciones: el botón ✨ es solo para probar las evoluciones
  function pescar() { const r = orden({ t: 'pescar' }); avisos(); return r; } // v2.180 (Pesca 1): botón 🎣, solo visible en un punto de pesca
  const hoy = () => Math.floor(Date.now() / 86400000);   // v2.320: día de hoy (solo la interfaz mira el reloj; el motor lo recibe en la orden) para la expedición diaria
  const apiProf = { prof: (o) => { const r = orden(Object.assign({ t: 'prof', dia: hoy() }, o)); avisos(); if (r && G.profUI) G.profUI.resultado(r); return r; } };
  function talk() { const r = orden({ t: 'hablar', dia: hoy() }); avisos(); if (r) G.audio.sfx('hablar'); if (r && r.prof && G.profUI) G.profUI.resultado(r); if (r && r.lectura && G.santuarioUI) G.santuarioUI.leer(est, yo(), r.lectura); if (r && r.npc === 'tablon' && G.tablonUI) G.tablonUI.abrir(yo(), apiTablon); else if (r && r.npc && G.dialogoUI) G.dialogoUI.abrir(r.npc, yo(), apiNpc);
    if (r && r.agente) { if (r.guion && G.dialogoUI && !G.dialogoUI.abierto()) { G.npc.GUION[r.sprite] = r.guion; agHabla = r.agente; if (!G.dialogoUI.abrir(r.sprite, yo(), apiNpc)) agHabla = null; } else if (r.texto && !(G.dialogoUI && G.dialogoUI.abierto())) say(r.nombre + ': ' + r.texto); }   // v2.325: un entrenador autónomo habla en la caja de diálogo (guion por datos que da el motor)
    return r; }
  let agHabla = null;   // id del entrenador con el que se está hablando (solo interfaz)
  function retarAgente(id) { const r = orden({ t: 'retar', ag: id }); avisos(); if (r && !r.duelo && r.texto) say(r.nombre + ': ' + r.texto); return r; }
  const apiBolsa = {   // v2.318: la Bolsa y la Tienda piden TODO al motor con órdenes (comprar, vender, usar)
    comprar: (id, n) => { const r = orden({ t: 'comprar', id, n }); avisos(); return r; },
    vender: (id, n) => { const r = orden({ t: 'vender', id, n }); avisos(); return r; },
    usar: (id, forma) => { const r = orden({ t: 'usar', id, forma }); avisos(); return r; },
  };
  function refrescarBril() { { const n = document.getElementById('nvE'); if (n && S.me && G.entrenador) { const v = 'Nv ' + G.entrenador.nivel(yo()); if (n.textContent !== v) n.textContent = v; } } const e = document.getElementById('bril'); if (e && S.me) { const v = String(G.tienda.saldo(yo())); if (e.textContent !== v) e.textContent = v; } if (G.tablonUI && S.me) G.tablonUI.badge(yo()); if (G.bolsaUI) G.bolsaUI.refrescar(); }
  const apiCrianza = { criar: (a, b, socio) => { const r = orden({ t: 'criar', a, b, socio }); avisos(); hud(); return r; }, activa: (forma, cria) => { const r = orden({ t: 'cria_activa', forma, cria }); G.sprCache = null; return r; } };   // v2.320: la crianza también va solo por órdenes
  const apiMote = (ref, texto) => orden(Object.assign({ t: 'mote', texto }, ref));   // v2.340: motes de las criaturas
  const apiTablon = { est: () => est, orden: (o) => { const r = orden(o); avisos(); return r; } };   // v2.345: el tablón y el buzón solo dan órdenes al motor
  const apiNpc = {   // v2.312: lo que el diálogo de un personaje puede pedirle al motor (siempre por órdenes: nada se toca desde la interfaz)
    curar: () => { const r = orden({ t: 'curar' }); avisos(); return r; },
    ampliar: () => { const r = orden({ t: 'ampliar' }); avisos(); hud(); return r; },   // v2.339: ampliar la caja del Centro PC
    bolsa: (modo, alCerrar) => G.bolsaUI.abrir(yo(), { modo: 'tienda', api: apiBolsa, alCerrar }),
    panel: (npc, cual, alCerrar) => (agHabla && cual === 'retar' ? (() => { const id = agHabla; G.dialogoUI.cerrar(); retarAgente(id); })() : npc === 'guardiana' && cual === 'visita' ? (() => { G.dialogoUI.cerrar(); orden({ t: 'santuario.visitar' }); avisos(); })() : npc === 'doctora' && G.crianzaUI ? G.crianzaUI.abrir(est, yo(), { pestana: cual, api: apiCrianza, alCerrar }) : (npc === 'cuidador' || npc === 'archivera') && G.santuarioUI ? ((G.santuario && G.santuario.visitando(yo())) ? (() => { const lec = G.santuario.lecturaVisita(est, yo()); lec ? G.santuarioUI.leer(est, yo(), lec, alCerrar) : alCerrar(); })() : G.santuarioUI.abrir(est, yo(), { api: { orden: apiTablon.orden }, alCerrar })) : alCerrar()),   // v2.320: paneles de un diálogo guiado por datos
    cerrado: () => { if (agHabla) { const id = agHabla; agHabla = null; orden({ t: 'hablar_fin', ag: id }); } },   // v2.325: al cerrar la charla el entrenador sigue su camino
    sub: (npc, id) => (npc === 'doctora' && G.crianzaUI ? G.crianzaUI.sub(est, yo(), id) : null),
    equipo: (alCerrar) => G.equipoUI.abrir(yo(), null, { editar: true, guardar: (formas, ids) => { const r = !!orden({ t: 'equipo', formas, ids }); avisos(); return r; }, mote: apiMote, liberar: (id) => { const r = orden({ t: 'liberar', id }); avisos(); return r; }, alCerrar }),
  }; // botón de acción: habla con la criatura más cercana (a menos de ~1,5 casillas)
  function creatureStep(dt) { motor.moverCriaturas(est, dt); if (est.combate) motor.combate.avanzar(est, dt); if (est.acomp) motor.combate.seguir(est, dt); }
  let clock = 0; // reloj para los movimientos propios (flotar, saltar, cabecear)
  const lift = (c) => G.vista.altura(c, clock); // cuánto se separa del suelo la criatura ahora mismo (px, hacia arriba): cuenta en src/vista.js
  function creatureDraw(c) {
    const v = G.vista.criatura(c, clock), s = clasico() ? G.clasico.spriteCriatura(c.id, c.dir, v.frame) : G.creatureSprite(c.id, c.dir, v.frame), sb = v.sombra; // qué se ve lo decide src/vista.js; aquí solo se dibuja
    ctx.save(); ctx.translate(Math.round(c.x - cam.x), Math.round(c.y - cam.y));
    if (!clasico() || sb.separacion > 0 || v.up > 0) { ctx.fillStyle = 'rgba(30,20,40,0.25)'; ctx.fillRect(-Math.round(sb.ancho / 2), -sb.alto + 1 + 0, sb.ancho, sb.alto); } // clásico: sin sombra en el suelo salvo si flota o salta
    ctx.drawImage(s.c, -s.w / 2 + v.sway, -s.h + 2 - Math.round(v.up) - sb.separacion + v.nod); ctx.restore();
    if (G.luces2d && G.luces2d.reg.length < 120) G.luces2d.reg.push({ k: 1, id: c.id, s, x: Math.round(c.x - cam.x), y: Math.round(c.y - cam.y), dx: -s.w / 2 + v.sway, dy: -s.h + 2 - Math.round(v.up) - sb.separacion + v.nod, esp: 0 }); // v2.336: la iluminación 2D usa estos sprites (filo de luz, sombras largas, brillo)
  }

  const blocked = (x, y) => motor.bloqueado(M, x, y);
  function step(dt) { // manda las teclas del jugador local como orden y mueve a los jugadores
    orden({ t: 'teclas', up: keys.up, down: keys.down, left: keys.left, right: keys.right });
    motor.moverJugadores(est, dt);
  }
  function person(id, x, y, dir, moving, tm) {
    const v = G.vista.persona(id, dir, moving, tm), s = G.spr[v.clave];
    ctx.save(); ctx.translate(Math.round(x - cam.x), Math.round(y - cam.y));
    if (v.espejo) ctx.scale(-1, 1);
    const jn = M.mar && G.navegacionUI && G.navegacion ? est.jugadores[id] : null, enBarco = jn && G.navegacion.navegando(jn);
    if (enBarco) G.navegacionUI.barco(ctx, G.navegacion.aspecto(est, jn), dir, 0, 1, clock, moving); else if (!clasico()) { ctx.fillStyle = 'rgba(30,20,40,0.25)'; ctx.fillRect(-5, -2, 10, 3); }
    ctx.drawImage(s.c, -s.w / 2, enBarco ? -s.h - 1 : -s.h + 2); ctx.restore();
    if (G.luces2d && G.luces2d.reg.length < 120) G.luces2d.reg.push({ k: 0, id, s, x: Math.round(x - cam.x), y: Math.round(y - cam.y), dx: -s.w / 2, dy: -s.h + 2, esp: v.espejo ? 1 : 0, a: ctx.globalAlpha }); // v2.336
  }
  const spr2d = (id, dir, f) => (clasico() ? G.clasico.spriteCriatura(id, dir, f) : G.creatureSprite(id, dir, f));
  const agentesVistos = () => (G.vista.agentes ? G.vista.agentes(est, M.id).filter((p) => p.x > cam.x - 12 && p.x < cam.x + VW + 12 && p.y > cam.y - 4 && p.y < cam.y + VH + 26) : []);   // v2.324: solo los entrenadores que caben en pantalla
  function draw() {
    ctx.drawImage(bg, Math.round(cam.x), Math.round(cam.y), VW, VH, 0, 0, VW, VH);
    const cueva = M.prof ? G.cueva2d.elementos(ctx, est, M, cam, VW, VH, clock) : null;   // v2.320: objetos planos de la cueva (placas, runas, escaleras); los altos se ordenan con las entidades
    if (!clasico()) G.capas.matas(ctx, M, cam, VW, VH); // matas de hierba encima del suelo (v2.48b; en reposo idénticas a las horneadas)
    if (!clasico()) G.capas.flores(ctx, M, cam, VW, VH); // flores encima del suelo, con viento (v2.49; en reposo idénticas a las horneadas salvo el defecto de las que se salían de su casilla)
    G.capas.agua(ctx, M, cam, VW, VH); // agua animada (solo mapas con animar: true)
    if (clasico()) G.terreno.animar(ctx, M, cam, VW, VH); // v2.321: lava animada y luz del tema de terreno (src/terreno.js)
    if (!clasico()) G.particulas.pintarDestellos(ctx, M, cam, VW, VH); // destellos en el agua (v2.90, ID-2b-4): solo sobre agua y lejos de la orilla, antes de la luz de región como las olas; ?particulas=0 los apaga
    if (!clasico()) G.capas.luzRegion(ctx, M, VW, VH); // luz por región (v2.46): tinte liso sobre el suelo y el agua, con «Sombras» encendido; ?luz=0 la apaga
    if (!clasico() && G.sombrasp.activo()) G.sombrasp.pintar(ctx, M, cam, VW, VH, []); // sombras proyectadas del 2D (v2.101, src/sombras_proyectadas.js): solo la silueta de los objetos (edificios, etc.), tras la luz y antes de dibujarlos; personajes y criaturas llevan solo su sombra de siempre (el óvalo bajo los pies); ?sombrasp=0 o «Sombras: no» las apagan
    if (!S.me) return; // menú de elección abierto
    const objs = G.capas.visibles(M, cam, VW, VH); // objetos con altura: se ordenan con las entidades por la Y de sus pies
    const list = lista().filter((c) => !c.enCombate).map((c) => ({ y: c.y, creature: c })).concat(objs, G.particulas.hojasVista(M, cam, VW, VH), cueva || []); // + hojas que caen (v2.90): se ordenan por la Y de su suelo, así un tejado las tapa si están detrás
    Object.values(est.jugadores).forEach((j) => { if (j.mapa === M.id) list.push({ id: j.id, x: j.x, y: j.y, dir: j.dir, mv: j.moving, tm: j.tm }); }); // los jugadores que están en este mapa
    G.npc.lista(M, est.reloj).forEach((n) => { const q = G.npc.pos(n); list.push({ id: n.id, x: q.x, y: q.y, dir: n.dir || 'down', mv: false, tm: 0 }); }); // v2.312: personajes del mapa (enfermera)
    agentesVistos().forEach((p) => list.push(p)); // v2.324: entrenadores autónomos presentes en este mapa (src/agentes_cuerpo.js)
    if (G.combate2d && (est.combate || est.acomp)) G.combate2d.entradas(est, M.id, clock).forEach((p) => list.push(p)); // v2.277: unidades del combate y acompañante
    const foco = !!(est.combate && camB > 0.01), uc = foco ? list.filter((p) => p.u2d || (p.id !== undefined && !p.creature && !p.objeto && !p.hoja && !p.cueva)) : [];   // v2.306: también los jugadores (personajes), no solo las criaturas   // en combate se atenúa el mundo y las criaturas del combate se pintan después, bien claras (la arena se coloca sin nada delante)
    if (foco) uc.forEach((p) => list.splice(list.indexOf(p), 1));
    list.sort((a, b) => a.y - b.y); if (G.luces2d) G.luces2d.reg.length = 0;
    list.forEach((p) => p.cueva ? G.cueva2d.pintarAlto(ctx, p.cueva, cam, clock, M) : p.u2d ? G.combate2d.unidad(ctx, p.u2d, cam, clock, sprDe(p.u2d)) : p.creature ? creatureDraw(p.creature) : p.hoja ? G.particulas.pintarHoja(ctx, p.hoja, cam) : p.objeto ? (G.capas.dibujarBase(ctx, p.objeto, cam), G.capas.animar(ctx, p.objeto, cam)) : (p.al !== undefined && p.al < 1 ? (ctx.globalAlpha = Math.max(0, p.al), person(p.id, p.x, p.y, p.dir, p.mv, p.tm), ctx.globalAlpha = 1) : person(p.id, p.x, p.y, p.dir, p.mv, p.tm)));   // v2.326: entra o sale de un edificio con fundido
    marcasPesca(); Object.values(est.jugadores).forEach((j) => { if (j.mapa === M.id && j.pesca) pescaDibujo2D(j); }); agentesVistos().forEach((n) => { if (n.pes && !(n.al < 1)) { const m = G.mundo.MIRAS[n.dir] || [0, 1]; pescaDibujo2D({ npc: 1, id: n.id, x: n.x, y: n.y, dir: n.dir, pesca: n.pes, mano: { x: m[0] ? m[0] * 2 : m[1] < 0 ? -4 : 4, y: -7 } }); } });   // v2.333: los entrenadores NPC pescan de verdad (mismo dibujo que el jugador) // v2.180-v2.181 (Pesca 1-4)
    objs.forEach((p) => { if (p.objeto) G.decor2d.pintar(ctx, p.objeto, cam); }); // v2.314: rótulo de la Tienda y escalones de la Ermita (solo 2D; en HD-2D ya son 3D)
    G.capas.dibujarEncima(ctx, objs, cam); // lo que va POR ENCIMA de las entidades (copas, tejados)
    if (M.mar && G.navegacionUI) { const jy = yo(); G.navegacionUI.puntos(ctx, M, est, jy, cam, clock); G.navegacionUI.eventos(ctx, M, est, jy, cam, clock); G.navegacionUI.niebla(ctx, M, est, jy, cam, VW, VH); }   // FN: balizas, eventos y niebla del mar
    if (G.portalesUI) G.portalesUI.pintar(ctx, M, cam, VW, VH, clock, S.me ? yo() : null, est);   // F5: marco y halo de los portales del mapa
    if (G.santuarioUI) G.santuarioUI.pintar(ctx, M, cam, VW, VH, clock, est);   // Santuario (v2.364): señales sobre las residentes (solo dentro del Santuario)
    if (clasico()) G.terreno.brasas(ctx, M, cam, VW, VH); // v2.321: brasas del tema de terreno
    if (G.luces2d && G.luces2d.activo(M, hd)) G.luces2d.pintar(ctx, M, est, cam, VW, VH, clock, S.me ? yo() : null, agentesVistos().filter((n) => !(n.al < 1)).map((n) => ({ x: n.x, y: n.y }))); G.luces2d.ambiente(ctx, M, est, cam, VW, VH, clock);   // v2.328: mapa de luz nocturno (src/luces2d.js); tras él se repintan los contendientes (foco), que quedan claros
    if (M.prof) G.cueva2d.luz(ctx, est, M, cam, VW, VH, clock, yo());   // v2.320: polvo, niebla y oscuridad con linternas
    if (!est.combate && S.me) { const np = G.npc.cercano(est, yo()); if (np) { const q = G.npc.pos(np), bx = Math.round(q.x - cam.x) + 13, by = Math.round(q.y - cam.y - 21 + Math.sin(clock * 4) * 1.2); ctx.fillStyle = '#2a1b30'; ctx.fillRect(bx - 7, by - 5, 14, 10); ctx.fillRect(bx - 1, by + 5, 3, 2); ctx.fillStyle = '#fff9ee'; ctx.fillRect(bx - 6, by - 4, 12, 8); ctx.fillRect(bx - 1, by + 4, 3, 1); ctx.fillStyle = '#2a1b30'; ctx.fillRect(bx - 4, by - 1, 2, 2); ctx.fillRect(bx - 1, by - 1, 2, 2); ctx.fillRect(bx + 2, by - 1, 2, 2); } } // v2.312: burbuja «habla conmigo» sobre el personaje cuando estás a su alcance
    if (foco) { ctx.fillStyle = 'rgba(22,12,40,' + (0.38 * camB).toFixed(3) + ')'; ctx.fillRect(0, 0, VW, VH); uc.sort((a, b) => a.y - b.y).forEach((p) => p.u2d ? G.combate2d.unidad(ctx, p.u2d, cam, clock, spr2d) : person(p.id, p.x, p.y, p.dir, p.mv, p.tm)); }   // v2.292: contraste de los efectos
    if (G.combate2d && est.combate) G.combate2d.efectos(ctx, est, cam, clock); // v2.277: efectos del combate sobre las entidades
  }
  // Nombres sobre las criaturas: letras de píxel blancas con contorno oscuro (src/font.js), en un lienzo aparte a resolución de pantalla para que se lean nítidas.
  const ui = document.getElementById('ui'), uctx = ui.getContext('2d');
  // v2.327: reloj del juego (la hora del día avanza con la partida y se guarda) y cartel de la tienda cerrada
  const horaEl = (() => { const e = document.createElement('div'); e.id = 'hora'; if (e.setAttribute) e.setAttribute('aria-hidden', 'true'); e.style.cssText = 'position:absolute;left:10px;top:12px;z-index:3;padding:3px 6px 4px;font:700 12px/1.1 inherit;letter-spacing:.04em;color:#fff9ee;background:rgba(42,27,48,.78);border:2px solid #7a5a60;border-radius:3px;pointer-events:none;text-shadow:0 1px 0 #2a1b30;display:none'; const st = document.getElementById('stage'); if (st && st.appendChild) st.appendChild(e); return e; })();
  let horaTxt = '';
  function pintaHora() { if (G.navegacionUI) G.navegacionUI.panel(est, S.me ? yo() : null, orden, say); const on = G.ciclo && G.ciclo.AJUSTES.ACTIVO && !M.prof, h = on ? G.ciclo.hora(est.reloj) : 0, txt = on ? (h >= 6 && h < 19 ? '☀ ' : '☾ ') + String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0') : ''; if (txt !== horaTxt) { horaTxt = txt; horaEl.textContent = txt; horaEl.style.display = txt ? 'block' : 'none'; } }
  function cartelTienda(u) { if (!G.ciclo || G.ciclo.abierta('tienda', est.reloj)) return; const pu = (M.puertas || []).find((p) => p.id === 'tienda' && p.destino && p.destino.mapa === 'tienda'); if (!pu) return; const t = 'CERRADO', w = G.pixelTextWidth(t, u), sx = Math.round((pu.x * 16 + 8) - cam.x) * KS, y = Math.round((pu.y * 16 + 16 - cam.y) * KS), pad = u * 2; uctx.fillStyle = '#2a1b30'; uctx.fillRect(Math.round(sx - w / 2) - pad, y - pad, w + pad * 2, G.PIXEL_TEXT_HEIGHT * u + pad * 2); uctx.fillStyle = '#b8453a'; uctx.fillRect(Math.round(sx - w / 2) - pad + u, y - pad + u, w + pad * 2 - u * 2, G.PIXEL_TEXT_HEIGHT * u + pad * 2 - u * 2); G.drawPixelText(uctx, t, Math.round(sx - w / 2), y, u, '#fff9ee', '#7a2a24'); }
  function drawPlates() {
    const dpr = window.devicePixelRatio || 1, u = Math.max(2, Math.round(1.5 * dpr)); // cada píxel de letra ≈ 1,5 px CSS (siempre entero en pantalla) (entero en pantalla)
    uctx.setTransform(1, 0, 0, 1, 0, 0); uctx.clearRect(0, 0, ui.width, ui.height);
    if (!S.me) return;
    const placed = [];
    lista().filter((c) => !c.enCombate).sort((p, q) => p.x - q.x).forEach((c) => {
      const def = G.CREATURES[c.id], s = G.creatureSprite(c.id, c.dir, 0), w = G.pixelTextWidth(c.nom || def.name, u), h = G.PIXEL_TEXT_HEIGHT * u;
      const sx = Math.round(c.x - cam.x) * KS, top = (c.y - cam.y - s.h + 2 - lift(c) - (G.traits(c.id).float ? G.traits(c.id).shadow[2] : 0)) * KS;
      const half = s.w / 2 * KS;
      if (sx + half < 0 || sx - half > ui.width || top + s.h * KS < 0 || top > ui.height) return; // el nombre se va con la criatura: se corta con el borde igual que el sprite y desaparece cuando ella sale entera
      const x = Math.round(sx - w / 2);
      let y = Math.round(top - h - 0.5 * u);
      while (placed.some((r) => x < r.x + r.w + u && x + w + u > r.x && y < r.y + h + 2 * u && y + h + 2 * u > r.y)) y -= h + 2 * u; // si dos nombres se tocan, el segundo sube
      placed.push({ x, y, w });
      if (sx < -w || sx > ui.width + w || y < -h || y > ui.height) return;
      G.drawPixelText(uctx, c.nom || def.name, x, y, u, '#fff9ee', '#2a1b30');
    });
    const puestos = [], jy = yo(); agentesVistos().forEach((n) => { if (n.al !== undefined && n.al < 0.6) return; if (!n.duelo && !n.rea && Math.hypot(n.x - jy.x, n.y - jy.y) > 7 * 16) return;   /* v2.335: solo se leen los nombres de los entrenadores cercanos */ const w = G.pixelTextWidth(n.nom, u), sx = Math.round(n.x - cam.x) * KS; let y = Math.round((n.y - cam.y - 25) * KS - G.PIXEL_TEXT_HEIGHT * u); const hh = G.PIXEL_TEXT_HEIGHT * u + 2 * u; for (let k = 0; k < 4 && puestos.some((q) => Math.abs(q.x - sx) < (q.w + w) / 2 + 2 * u && Math.abs(q.y - y) < hh); k++) y -= hh; puestos.push({ x: sx, y, w });   // v2.334: los nombres que se pisan se apilan hacia arriba
     G.drawPixelText(uctx, n.nom, Math.round(sx - w / 2), y, u, n.duelo ? '#ffd27a' : '#fff9ee', '#2a1b30');  if (n.rea) { const t = n.rea === 'g' ? '!' : '...', w2 = G.pixelTextWidth(t, u); G.drawPixelText(uctx, t, Math.round(sx - w2 / 2), y - Math.round(G.PIXEL_TEXT_HEIGHT * u * 1.4) + Math.round(Math.sin(clock * 6) * u), u, n.rea === 'g' ? '#ffd27a' : '#9fb4ff', '#2a1b30'); } }); // v2.324: nombre de cada entrenador
    G.npc.lista(M, est.reloj).forEach((n) => { if (!n.nombre) return; const q = G.npc.pos(n), w = G.pixelTextWidth(n.nombre, u), sx = Math.round(q.x - cam.x) * KS, y = Math.round((q.y - cam.y - 25) * KS - G.PIXEL_TEXT_HEIGHT * u); G.drawPixelText(uctx, n.nombre, Math.round(sx - w / 2), y, u, '#fff9ee', '#2a1b30'); }); // v2.312: nombre del personaje
    cartelTienda(u);
    if (G.combate2d && (est.combate || est.acomp)) { // v2.277: barras, números y rótulos del combate; el nombre del acompañante fuera de combate
      const a = est.acomp && !est.acomp.enCombate && est.acomp.mapa === M.id ? est.acomp : null;
      if (a) { const s = G.creatureSprite(a.forma, a.dir, 0), nm = (G.equipo && G.equipo.moteDe(yo(), a.clave)) || G.CREATURES[a.forma].name, w = G.pixelTextWidth(nm, u), va = G.vista.acomp(est, clock) || a, sx = Math.round(va.x - cam.x) * KS, top = (va.y - cam.y - s.h + 2) * KS; if (sx > -w && sx < ui.width + w && top > -40 && top < ui.height) G.drawPixelText(uctx, nm, Math.round(sx - w / 2), Math.round(top - G.PIXEL_TEXT_HEIGHT * u - 0.5 * u), u, '#fff9ee', '#2a1b30'); }
      if (est.combate) G.combate2d.ui(uctx, ui, KS, cam, est, clock);
    }
    if (G.portalesUI) G.portalesUI.velo(uctx, ui.width, ui.height, clock);   // F5: velo con el nombre de la dimensión al cruzar un portal
  }
  // ── HD-2D (v2.64: HD-C1 botón · HD-C2 carga y vuelta al 2D) ── El 2D es la base. «Gráficos» cambia de PINTOR (src/hd2d_pintor.js, Three.js, que se pide a internet solo al elegir HD-2D); el motor, el estado y la posición no cambian: se vuelve al 2D exactamente donde estás.
  // El pintor HD solo LEE (mapa, jugadores y criaturas del motor, G.vista); aquí se le da el «host». Si Three no carga, no hay WebGL o va lento, se queda o se vuelve al 2D y se dice por qué. La elección se recuerda (la guarda el propio pintor).
  let hd = false, hdOcupado = false;
  const hbtn = document.getElementById('hbtn'), hcam = document.getElementById('hcam');
  // v2.152 · la vista ocupa TODA la altura visible bajo el título; la cruceta flota encima (semitransparente, abajo y centrada), como en los juegos de móvil. `altoVisible` usa visualViewport (artefactos, barras del navegador).
  const altoVisible = () => Math.min(innerHeight, (window.visualViewport && visualViewport.height) || innerHeight);
  const altoVista = () => { const hb = document.getElementById('hud'); return altoVisible() - (hb ? (hb.offsetHeight || 0) + 12 : (document.getElementById('who').offsetHeight || 0) + 56); };   // v2.298: la barra superior (#hud) está en el flujo, encima del mapa
  const hdTam = () => ({ w: Math.max(120, innerWidth - 12), h: Math.max(160, altoVista()) });
  const hdHost = () => ({ stage: document.getElementById('stage'), ui, fondo, tam: hdTam, alFallar: (motivo) => volverA2D(motivo),
    estado: () => ({ M, yo: yo(), me: S.me, reloj: clock, noche: G.ciclo ? G.ciclo.estado(est.reloj).noche : 0, criaturas: lista(), combate: G.vista.combate ? G.vista.combate(est, clock) : null, acomp: G.vista.acomp ? G.vista.acomp(est, clock) : null, jugadores: Object.values(est.jugadores).filter((j) => j.mapa === M.id) }) });
  function hdBoton() { const sb2 = document.getElementById('sbtn'); if (sb2) sb2.hidden = clasico() && !hd; /* v2.112: en el 2D clásico «Sombras» no cambia nada de lo que se ve; solo se enseña en HD-2D */ if (hbtn) { hbtn.innerHTML = hdOcupado ? 'Cargando HD-2D…' : G.ic(hd ? 'estrella' : 'rejilla') + (hd ? 'HD-2D' : '2D'); hbtn.setAttribute('aria-pressed', String(hd)); hbtn.disabled = hdOcupado; } if (hcam) hcam.hidden = !hd; }
  function hdAjustar() { const { w, h } = hdTam(), dpr = window.devicePixelRatio || 1; ui.width = Math.round(w * dpr); ui.height = Math.round(h * dpr); ui.style.width = w + 'px'; ui.style.height = h + 'px'; G.hd2d.ajustar(); } // el lienzo 3D y el de los nombres miden lo mismo
  function irAHD() {
    if (hd || hdOcupado || !G.hd2d) return Promise.resolve(); if (M.prof) { say('Las Profundidades solo existen en 2D por ahora'); return Promise.resolve(); } if (M.mar) { say('El mar se navega en 2D por ahora'); return Promise.resolve(); } if (G.santuario && G.santuario.activo && G.santuario.enSantuario(M.id)) { say('El Santuario se ve en 2D por ahora'); return Promise.resolve(); }
    hdOcupado = true; hdBoton();
    return G.hd2d.activar(hdHost()).then((r) => { hdOcupado = false; if (!r.ok) { say(r.motivo); hdBoton(); return; } hd = true; cv.style.display = 'none'; G.hd2d.recordar('hd'); fit(); hdBoton(); });
  }
  function volverA2D(motivo) { if (!hd) return; G.hd2d.desactivar(); hd = false; cv.style.display = ''; G.hd2d.recordar('2d'); fit(); hdBoton(); if (motivo) say('Vuelvo al 2D: ' + motivo); }
  if (hbtn && hbtn.addEventListener) hbtn.addEventListener('click', () => (hd ? volverA2D() : irAHD()));
  if (hcam && hcam.querySelectorAll) hcam.querySelectorAll('[data-hc]').forEach((b) => b.addEventListener('click', () => { if (!hd) return; if (b.dataset.hc === 'zoom') b.innerHTML = G.ic('lupa') + G.hd2d.zoom(); else G.hd2d.girar(b.dataset.hc === 'izq' ? -1 : 1); }));
  addEventListener('keydown', (e) => { if (hd && !e.metaKey && !e.ctrlKey && (e.key === 'q' || e.key === 'r')) G.hd2d.girar(e.key === 'q' ? -1 : 1); }); // Q y R giran la cámara en HD-2D (la E es «hablar»)
  hdBoton();
  const mm = G.minimapa && G.minimapa.montar({ est, M: () => M, me: () => S.me, reloj: () => clock, alAbrir: () => { keys.up = keys.down = keys.left = keys.right = 0; }, proyectar: (tx, ty) => hd ? G.hd2d.proyectar(tx, ty) : { x: ((tx + 0.5) * T - cam.x) * Kc, y: ((ty + 0.5) * T - cam.y) * Kc, w: VW * Kc, h: VH * Kc } }); // v2.73: minimapa y mapa grande (src/minimapa.js); solo leen el mapa y el estado
  let last = 0, camB = 0; const camA = { x: 0, y: 0 };
  function follow(dt, snap) { // v2.48d: cámara FIJA al jugador, con valores ENTEROS (como los RPG clásicos de píxel art). Nada se desliza: al parar no hay recolocación y el fondo y todos los sprites usan el mismo entero, sin temblor de 1 px. Nunca se sale del mapa. (dt y snap se aceptan por compatibilidad; el cambio de mapa ya recoloca de golpe.)
    const mx = Math.max(0, Math.floor(W * T - VW)), my = Math.max(0, Math.floor(H * T - VH));
    const k = est.combate, en = !!(k && (!k.fin || (k.cap && k.cap.fase !== 'fin'))); if (en) { camA.x = k.ax; camA.y = k.ay; } camB += ((en ? 1 : 0) - camB) * (snap ? 1 : Math.min(1, (dt || 0.016) * 3)); if (Math.abs(camB) < 0.002) camB = 0;   // en combate la cámara se centra poco a poco en la arena (se ven las dos criaturas); al acabar vuelve a Oli
    const cx = S.x + (camA.x - S.x) * camB, cy = S.y + (camA.y - S.y) * camB;
    cam.x = Math.max(0, Math.min(mx, Math.round(cx) - (VW >> 1)));
    cam.y = Math.max(0, Math.min(my, Math.round(cy) - 11 - (VH >> 1)));
  }
  let tGuardado = 0; function guardar() { if (S.me) G.guardado.escribir(est); } function autoguardar(dt) { tGuardado += dt; const u = G.guardado.ultimo, cada = u && u.ms > 25 ? Math.min(60, Math.max(5, u.ms / 5)) : 5; if (tGuardado >= cada) { tGuardado = 0; guardar(); } }   // F8: si guardar tarda (guardado grande en un móvil lento) se espacia para gastar ≤ ~0,5 % del tiempo; al cambiar de mapa y al cerrar se guarda igual // v2.189 (1.3f): guardado automático cada 5 s, al cambiar de mapa y al cerrar
  addEventListener('pagehide', guardar); addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') guardar(); });
  function sincronizar() { if (M.id !== yo().mapa) { const antes = M.id; cambiarMapa(); if (G.portalesUI) G.portalesUI.entrar(antes, M.id, clock); fit(); if (!(M.mar && G.mundo.mapas[antes] && G.mundo.mapas[antes].mar)) G.audio.sfx('puerta'); guardar(); if (M.prof && hd) volverA2D('las Profundidades solo existen en 2D por ahora'); if (M.mar && hd) volverA2D('el mar se navega en 2D por ahora'); if (hd && G.santuario && G.santuario.activo && G.santuario.enSantuario(M.id)) volverA2D('el Santuario se ve en 2D por ahora'); } } // el jugador local pasó a otro mapa (puerta o borde): se cambia el suelo y se reajusta la cámara
  function colocarInicio() { // al elegir: el jugador elegido en el cruce de caminos y el otro dos casillas a su derecha
    const a = mundo.INICIAL.ancla, otro = OTHER[S.me];
    motor.aplicar(est, { j: S.me, t: 'colocar', mapa: mundo.INICIAL.mapa, ancla: a, dir: 'down' }); motor.aplicar(est, { j: otro, t: 'colocar', mapa: mundo.INICIAL.mapa, ancla: a, dx: 2, dir: 'left' });
  }
  let tamVisto = ''; // v2.151: si la ventana visible cambia sin evento de resize (artefactos, barras del navegador, giro), se recalcula la vista
  // v2.180 (Pesca 1): el botón 🎣 sustituye al ✨ de pruebas mientras estás en un punto de pesca (o pescando); no hay otro hueco libre en la cruceta
  let pbtn = null, ebtn = null;
  function pescaUI() {
    if (!pbtn) { pbtn = document.querySelectorAll('[data-pesca]')[0]; ebtn = document.querySelectorAll('[data-evo]')[0]; } if (!pbtn) return;
    const j = S.me ? yo() : null, ver = !!(j && (j.pesca || G.mundo.puntoPesca(M, Math.floor(j.x / T), Math.floor(j.y / T))));
    if (pbtn.hidden === ver) { pbtn.hidden = !ver; if (ebtn) ebtn.hidden = ver; }
    if (ver) { const t = j.pesca && (j.pesca.fase === 'pique' || (j.pesca.fase === 'forcejeo' && G.vista.pesca(j, clock).ventana)) ? '❗' : '🎣'; if (pbtn._k !== t) { pbtn._k = t; pbtn.innerHTML = G.ic(t === '❗' ? 'exclam' : 'anzuelo', 'g'); pbtn.setAttribute('aria-label', t === '❗' ? 'Tirar de la caña' : j.pesca ? 'Tirar de la caña (andar la recoge)' : 'Pescar'); } }
    const fase = j && j.pesca ? j.pesca.fase : null; // v2.181 (Pesca 4): sonido al lanzar, al picar y al capturar
    if (fase !== faseVista) { faseVista = fase; if (fase === 'pique') G.audio.sfx('pique'); else if (fase === 'salto') { G.audio.sfx('captura'); G.pecesUI.carta(j); } else if (fase === 'lanzar') G.audio.sfx('lanzar'); else if (fase === 'forcejeo') G.audio.sfx('pique'); }
    const ac = j && j.pesca ? (j.pesca.aciertos | 0) : 0; if (ac > aciertoVisto) G.audio.sfx('hablar'); aciertoVisto = ac;
  }
  // v2.272 · botón flotante de combate (solo HD-2D): ⚔ empieza una pelea de PRUEBA con la criatura salvaje más cercana (hasta que exista el choque, 1.7); durante la pelea es el botón del ESPECIAL (⚡), que solo se enciende con el medidor lleno
  let kbtn = null, kEstado = '', kPct = 0;
  // lanzamiento de la esfera (v2.296): deslizar hacia la criatura; el anillo que se encoge da la calidad y la puntería decide si acierta
  { let sw = null; const cl = document.getElementById('capl'), capDe = () => (est.combate && est.combate.cap && G.vista.combate ? (G.vista.combate(est, clock) || {}).cap : null); if (cl && cl.addEventListener) {
    cl.addEventListener('pointerdown', (e) => { const c = capDe(); sw = c && c.fase === 'oferta' && c.t >= 0.8 && S.me ? { x: e.clientX, y: e.clientY } : null; });
    cl.addEventListener('pointerup', (e) => { const s0 = sw; sw = null; const c = capDe(); if (!s0 || !c || c.fase !== 'oferta') return; const dy = s0.y - e.clientY; if (dy < 36) return;
      const r = cv.getBoundingClientRect(), cx = r.left + (c.x - cam.x) * Kc, cy = r.top + (c.y - c.h * 0.5 - cam.y) * Kc, t = (cy - s0.y) / (e.clientY - s0.y), xAt = s0.x + t * (e.clientX - s0.x), err = Math.abs(xAt - cx) / Kc, q = G.combate2d.calidad(c, err, c.w);
      G.combate2d.quien(S.me); G.combate2d.aviso(q === 1 ? '¡Excelente!' : q === 0.8 ? 'Bien' : q === 0.5 ? 'Normal' : 'Fallo', clock, q === 1 ? '#ffd84a' : q === 0 ? '#c8d0e0' : '#fff9ee'); motor.aplicar(est, { j: S.me, t: 'lanzar', q }); }); } }
  let acompHecho = false;
  function combateUI() {
    if (S.me && !acompHecho && est.jugadores[S.me]) { acompHecho = true; { const l = G.equipo.lider(est.jugadores[S.me]); if (l) motor.combate.acompanar(est, S.me, l); } } // acompañante de PRUEBA, uno por sesión (si cae, no vuelve)
    if (!kbtn) { kbtn = document.getElementById('kbtn'); if (kbtn && kbtn.addEventListener) {
      // v2.308: el especial se lanza al TOCAR (pointerdown) para que el sonido y el efecto salgan en el acto; el click posterior se ignora. El resto de acciones del botón siguen en click.
      kbtn.addEventListener('pointerdown', () => { const k = est.combate; if (!S.me || !k || k.fin || k.cap || kEstado !== 'esp') return; motor.aplicar(est, { j: S.me, t: 'esp' }); if (k.esp) { kbtn._tap = performance.now(); if (G.sonidoC && G.sonidoC.pulsa) G.sonidoC.pulsa(); kbtn.classList.remove('pulsa'); void kbtn.offsetWidth; kbtn.classList.add('pulsa'); setTimeout(() => kbtn.classList.remove('pulsa'), 520); } });
      kbtn.addEventListener('click', () => { if (!S.me) return; if (kbtn._tap && performance.now() - kbtn._tap < 900) { kbtn._tap = 0; return; } const k = est.combate; motor.aplicar(est, { j: S.me, t: k && k.cap ? 'soltar' : k && !k.fin ? 'esp' : 'combate' }); }); } } if (!kbtn) return;
    const j = S.me ? yo() : null, k = est.combate, en = !!(k && !k.fin && j && k.jid === j.id), u = en ? motor.combate.mia(k, j.id) : null;
    const cap = !!(k && k.cap && k.cap.fase === 'oferta' && j && k.jid === j.id), cerca = !en && !k && j && !j.pesca && G.motor.combate.cercana(est, j) !== null, ver = en || cerca || cap, e = cap ? 'cap' : en ? (u && u.med >= 100 ? 'esp' : 'carga') : cerca ? 'ini' : '';
    if (kbtn.hidden === ver) kbtn.hidden = !ver; { const cl = document.getElementById('capl'); if (cl && cl.hidden === cap) cl.hidden = !cap; }
    const obj = e === 'esp' ? 100 : e === 'carga' && u ? Math.min(100, u.med) : 0; kPct += (obj - kPct) * (obj < kPct ? 1 : 0.18); if (Math.abs(obj - kPct) < 0.3) kPct = obj; kbtn.style.setProperty('--p', kPct.toFixed(1));   // anillo de carga suavizado
    if (e === kEstado) return; kEstado = e;
    { const kk = e === 'ini' ? 'espada' : e === 'cap' ? 'mano' : 'rayo'; if (kbtn._k !== kk) { kbtn._k = kk; kbtn.innerHTML = G.ic(kk, 'g'); } } kbtn.classList.toggle('lista', e === 'esp'); kbtn.classList.toggle('ini', e === 'ini' || e === 'cap'); kbtn.setAttribute('aria-label', e === 'ini' ? 'Empezar un combate de prueba' : e === 'cap' ? 'Dejar ir a la criatura' : 'Lanzar el ataque especial');
  }
  let faseVista = null, aciertoVisto = 0;
  // v2.181 (Pesca 2-3): caña, hilo, corcho, ondas, pez que salta y «!» del pique, en el 2D (todo sale de G.vista.pesca; el HD-2D lo dibuja en src/pesca3d.js). La caña es una capa encima del sprite: no se redibuja a Oli ni a Lali.
  const cachePez = new Map(); // v2.192: dibujo 2D de cada pez (G.pesca.matriz), una vez por especie y fotograma
  function dibujaPez(id, frame, cx, cy, flip, sombra) {
    const k = id + frame; let m = cachePez.get(k); if (!m) { m = G.pesca.matriz(id, frame); cachePez.set(k, m); } if (!m) return;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const c = m.px[y][x]; if (!c) continue; ctx.fillStyle = sombra ? 'rgba(10,30,70,0.4)' : c; ctx.fillRect(Math.round(cx - m.w / 2 + (flip ? m.w - 1 - x : x)), Math.round(cy - m.h / 2 + y), 1, 1); }
  }
  // v2.203: el pez ENGANCHADO cuelga del hilo con la cabeza hacia arriba (el sprite girado 90°, la boca en el extremo del hilo)
  function dibujaPezColgado(id, frame, mx, my, alfa) {
    const k = id + frame; let m = cachePez.get(k); if (!m) { m = G.pesca.matriz(id, frame); cachePez.set(k, m); } if (!m) return; const ym = Math.round(m.h * 0.55), E = G.PECES[id];
    if (E && E.colgar === 'erguido') { ctx.globalAlpha = alfa; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const c = m.px[y][x]; if (!c) continue; ctx.fillStyle = c; ctx.fillRect(Math.round(mx - m.w / 2 + x), Math.round(my + y), 1, 1); } ctx.globalAlpha = 1; return; }   // v2.210: criatura que no es pez (Pulpo): cuelga derecha, el hilo atado a lo alto del cuerpo
    ctx.globalAlpha = alfa; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const c = m.px[y][x]; if (!c) continue; ctx.fillStyle = c; ctx.fillRect(Math.round(mx - ym + y), Math.round(my + (m.w - 1 - x)), 1, 1); } ctx.globalAlpha = 1;
  }
  function pescaDibujo2D(j) {
    const v = G.vista.pesca(j, clock); if (!v) return;
    const fx = Math.round(j.x - cam.x), fy = Math.round(j.y - cam.y), M = v.M, R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const hm = j.mano || G.vista.manoPesca2D(j.id, j.dir) || { x: M[0] ? M[0] * 5 : 4, y: -7 }, ar = v.brazo[0] + 0.9, fw = Math.sin(ar), up = -Math.cos(ar), mx = fx + hm.x, my = fy + hm.y;       // v2.184: la caña sale del píxel real de la mano del sprite
    let tx = 0, ty = 0;   // punta de la caña (se calcula abajo, cuando se sabe dónde está el corcho)
    let dx = fx + v.cx; const dy = fy + v.cy, a = v.s < 1 ? Math.sin(Math.PI * v.s) * 8 : 0;
    { const lev = Math.max(-4, Math.min(6, (ar - 2.0) * 5)), lado = M[0] || (hm.x >= 0 ? 1 : -1);   // v2.196: la caña es una recta hacia ARRIBA y hacia fuera desde la mano; el hilo CUELGA en vertical desde su punta hasta el corcho (el corcho, las ondas y el pez quedan justo debajo de la punta)
      tx = mx + lado * 12; ty = (j.npc ? my - 15 : Math.min(my - 15, dy - 9)) - lev; dx = tx; }
    let cx = tx + (dx - tx) * v.s, cy = ty + (dy - ty) * v.s - a;
    if (v.vuelta > 0) { cx = dx + (tx - dx) * v.vuelta; cy = dy + (ty - dy) * v.vuelta - Math.sin(Math.PI * v.vuelta) * 6; }
    else if (v.s >= 1) cy += (v.hund * 2.5) + (v.hund < 0.9 ? Math.round(v.bob * 0.4) : 0);
    const linea = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) R(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 1, 1, c); };
    if (v.s >= 1 && !v.vuelta) v.anillos.forEach((o) => { const r = 3 + (o.entra ? 1 - o.r : o.r) * 8, h = Math.max(1, Math.round(r / 2)); ctx.fillStyle = 'rgba(235,248,255,' + (o.entra ? 0.35 + 0.55 * o.r : 0.85 * (1 - o.r)).toFixed(2) + ')'; ctx.fillRect(Math.round(dx - r + 1), Math.round(dy - h), 2 * r - 2, 1); ctx.fillRect(Math.round(dx - r + 1), Math.round(dy + h), 2 * r - 2, 1); ctx.fillRect(Math.round(dx - r), Math.round(dy - h + 1), 1, Math.max(1, 2 * h - 1)); ctx.fillRect(Math.round(dx + r - 1), Math.round(dy - h + 1), 1, Math.max(1, 2 * h - 1)); });
    { const n = Math.max(Math.abs(tx - mx), Math.abs(ty - my), 1); for (let i = 0; i <= n; i++) R(mx + (tx - mx) * i / n, my + (ty - my) * i / n, 1, 1, i / n < 0.22 ? '#8f5c33' : '#c48b52'); }   // v2.196: la caña es UNA sola recta (empuñadura, cuerpo y punta sobre la misma línea; antes eran dos tramos que parecían doblados)
    let gancho = null;   // v2.203: boca del pez enganchado (forcejeo: bajo el agua y sacudiéndose; al sacarlo: sube por el hilo hasta la punta de la caña)
    if (v.pez) { const s = v.pez.s; gancho = { x: tx + Math.round(Math.sin(s * 9) * 1.5 * (1 - s)), y: dy + 1 + ((ty + 5) - (dy + 1)) * s, id: v.pez.id || 'pez_plateado', fr: Math.floor(v.pez.fase) % 2, a: 1 }; }
    else if (v.hook) gancho = { x: dx + Math.round(Math.sin(clock * 14) * 1.5), y: dy + 1, id: v.hook.id, fr: Math.floor(v.hook.fase) % 2, a: 0.6 };
    if (gancho) linea(tx, ty, gancho.x, gancho.y, 'rgba(245,245,250,0.9)'); else linea(tx, ty, cx, cy, 'rgba(245,245,250,0.9)');
    if (hm.clave && G.spr[hm.clave]) { const sp = G.spr[hm.clave]; ctx.save(); ctx.translate(fx, fy); if (hm.espejo) ctx.scale(-1, 1); ctx.drawImage(sp.c, hm.sx, hm.sy, hm.w, hm.h, -sp.w / 2 + hm.sx, -sp.h + 2 + hm.sy, hm.w, hm.h); ctx.restore(); }   // la mano se repinta encima: sujeta la caña
    if (v.hund < 0.9 && !v.pez && !v.hook) { R(cx - 1, cy - 2, 2, 2, '#e5484d'); R(cx - 1, cy, 2, 1, '#ffffff'); }                                    // corcho rojo y blanco
    if (v.sombra) { const S = v.sombra, rx = Math.max(2, S.rx * T * S.resp), ry = Math.max(1.5, S.ry * T * S.resp), R2 = Math.ceil(rx * 1.15), R3 = Math.ceil(ry * 1.15); for (let k = -R3; k <= R3; k++) for (let x = -R2; x <= R2; x++) { const d = Math.hypot(x / rx, k / ry) / G.vista.radioSombra(S.id, Math.atan2(k / ry, x / rx)); if (d >= 1) continue; ctx.fillStyle = 'rgba(10,30,70,' + (S.a * (d < 0.55 ? 0.85 : d < 0.8 ? 0.52 : 0.25)).toFixed(2) + ')'; ctx.fillRect(Math.round(dx + x), Math.round(dy + k), 1, 1); } }   // v2.194: mancha de 3 capas (núcleo, medio, halo) con contorno orgánico bajo el corcho: aviso, pique y fundido de salida
    if (gancho) dibujaPezColgado(gancho.id, gancho.fr, gancho.x, gancho.y, gancho.a);   // v2.203: colgado del hilo, con la cabeza hacia arriba
    if (v.senal && Math.floor(clock * 8) % 2 === 0) { R(fx - 2, fy - 27, 4, 9, '#2a1b30'); R(fx - 1, fy - 26, 2, 5, '#ffd84a'); R(fx - 1, fy - 20, 2, 2, '#ffd84a'); }   // «!» sobre la cabeza al picar
  }
  // v2.184: marca de los puntos de pesca cercanos: un corcho con flecha amarilla flotando sobre la casilla (en tierra o en el puente, nunca en el agua: no se confunde con las ondas de los pilotes). Aparece a menos de 3,5 casillas, se atenúa con la distancia y se apaga al pescar ahí; al pisar la casilla queda tenue (ya sale el botón 🎣).
  const ICONO_PESCA = ['..ooo..', '.orrro.', '.orrro.', '.owwwo.', '.owwwo.', '..ooo..', 'ooyyyoo', '.oyyyo.', '..oyo..', '...o...'], COL_PESCA = { o: '#2a1b30', r: '#e5484d', w: '#ffffff', y: '#ffd84a' };
  function marcasPesca() {
    const j = yo(), ocupantes = agentesVistos().map((n) => ({ x: n.x, y: n.y })).concat(Object.keys(est.jugadores).filter((id) => id !== S.me && est.jugadores[id].mapa === M.id).map((id) => ({ x: est.jugadores[id].x, y: est.jugadores[id].y }))), cajas = G.luces2d.reg.filter((r) => !(r.k === 0 && r.id === S.me)).map((r) => [r.x + r.dx, r.y + r.dy, r.x + r.dx + r.s.w, r.y + r.dy + r.s.h]);
    M.pesca.forEach((p) => {
      if (j.pesca && j.pesca.id === p.id) return;
      const d = Math.hypot(p.x * T + 8 - j.x, p.y * T + 8 - j.y), a = Math.max(0, Math.min(1, (56 - d) / 16)) * (Math.floor(j.x / T) === p.x && Math.floor(j.y / T) === p.y ? 0.35 : 1); if (a <= 0) return;
      const bx = Math.round(p.x * T + 8 - cam.x) - 3, by = Math.round(p.y * T + 4 - cam.y) - 10 + Math.round(Math.sin(clock * 2.4));
      if (!G.marcaPescaLibre(p, T, ocupantes, cajas, [bx, by, bx + 7, by + 10])) return;   // v2.337: ocupado o tapado por alguien (p. ej. un entrenador pescando ahí): no se dibuja
      ctx.save(); ctx.globalAlpha = a;
      ICONO_PESCA.forEach((fila, yy) => { for (let xx = 0; xx < 7; xx++) { const c = COL_PESCA[fila[xx]]; if (c) { ctx.fillStyle = c; ctx.fillRect(bx + xx, by + yy, 1, 1); } } }); ctx.restore();
    });
  }
  // v2.244: velo del ciclo de día y noche (src/ciclo.js): el color por el que se multiplica la pantalla; solo se toca el DOM cuando cambia
  const velo = document.getElementById('noche'); let veloCss = '';
  // v2.304: de noche, en combate el velo se aclara y deja un FOCO de luz (sin oscuridad) sobre cada contendiente y sobre el jugador, con fundido; así destacan en pantalla.
  let focoT = 0, focoK = 0;
  function focosNoche() {
    const v = est.combate && G.vista.combate ? G.vista.combate(est, clock) : null, ahora = performance.now(); focoK = v ? Math.min(1, focoK + (ahora - focoT) / 700) : Math.max(0, focoK - (ahora - focoT) / 500); focoT = ahora; if (!v || focoK <= 0) return [];
    // v2.306: el personaje del jugador queda completamente iluminado (meseta de luz que cubre todo su sprite); las criaturas siguen con el foco suave de la v2.304.
    const pts = v.unidades.filter((u) => !u.ko && u.x !== undefined).map((u) => ({ x: u.x, y: u.y, r: 46 + 40 * focoK, crea: false })), jy = S.me ? yo() : null; if (jy) pts.push({ x: jy.x, y: jy.y - 6, r: ((14 + 8) * Kc) * (0.6 + 0.4 * focoK), crea: true });   // las criaturas conservan el foco suave de la v2.304; el JUGADOR lleva una meseta de luz completa (v2.306)
    const out = [];
    pts.forEach((o) => { let px, py; if (hd && G.hd2d && G.hd2d.proyectar) { const q = G.hd2d.proyectar(o.x / T - 0.5, (o.y - 6) / T - 0.5); if (!q) return; px = q.x / q.w * 100; py = q.y / q.h * 100; } else { px = (o.x - cam.x) / VW * 100; py = (o.y - 8 - cam.y) / VH * 100; }
      if (px > -20 && px < 120 && py > -20 && py < 120) { const R = o.crea ? Math.round(o.r + 34) : Math.round(o.r), A = focoK.toFixed(2), n = o.crea ? Math.min(96, Math.round(o.r / R * 100)) : 30, B = (focoK * 0.55).toFixed(2); out.push('radial-gradient(circle ' + R + 'px at ' + px.toFixed(2) + '% ' + py.toFixed(2) + '%, rgba(255,255,255,' + A + ') 0, rgba(255,255,255,' + A + ') ' + n + '%, rgba(255,255,255,' + (o.crea ? (focoK * 0.5).toFixed(2) : B) + ') ' + (o.crea ? Math.round(n + (100 - n) * 0.45) : 62) + '%, rgba(255,255,255,0) 100%)'); } });
    return out;
  }
  function aplicaCiclo() { if (!velo || !G.ciclo) return; const L2 = G.luces2d && G.luces2d.activo(M, hd), k = M.prof || (!M.region && !G.luces2d.OFF) ? 1 : L2 ? 1 : est.combate ? 0.45 : 0,   /* v2.328: con luces2d el velo queda blanco (la luz la pone el mapa de luz); los interiores siempre están iluminados */ m = G.ciclo.estado(est.reloj).mult.map((c) => Math.round(c + (255 - c) * k)),   /* v2.320: bajo tierra no hay día ni noche */ base = 'rgb(' + m[0] + ',' + m[1] + ',' + m[2] + ')', f = !L2 && (m[2] < 250 || m[0] < 250) ? focosNoche() : [], css = f.length ? f.join(',') + ',' + base : base; if (css !== veloCss) { veloCss = css; velo.style.background = css; } }
  function avisosVivos() { if (est.avisos && est.avisos.length) avisos(); }   // v2.303: los avisos que salen sin una orden del jugador (XP y subida de nivel al terminar un combate) se muestran al momento
  function sonidoCombate() { const v = est.combate && G.vista.combate ? G.vista.combate(est, clock) : null; if (G.sonidoC) G.sonidoC.seguir(est, v); if (G.musicaC) G.musicaC.seguir(est, v); }   // v2.301: sonido del combate con los mismos eventos que los efectos visuales
  function loop(ts) { aplicaCiclo(); pintaHora(); const tv = innerWidth + 'x' + Math.round(altoVisible()) + 'x' + document.getElementById('pad').offsetHeight; if (tv !== tamVisto) { tamVisto = tv; fit(); } const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; clock += dt; est.reloj += dt;   /* v2.327: la hora del día avanza con la partida */ G.capas.tick(dt); step(dt); creatureStep(dt); sincronizar(); pescaUI(); combateUI(); sonidoCombate(); avisosVivos(); if (G.profUI) G.profUI.seguir(est, S.me ? yo() : null, M, clock, apiProf); if (G.crianzaUI) G.crianzaUI.seguir(est, S.me ? yo() : null); G.redPeer.tick(dt); autoguardar(dt); if (S.me) G.audio.seguir(G.audio.temaEn(M, S.x / T, S.y / T), dt); follow(dt); if (hd) G.hd2d.dibujar(); else { draw(); drawPlates(); } if (mm) mm.dibujar(); requestAnimationFrame(loop); }

  // fit(): zoom ENTERO (píxeles nítidos): unas 8 casillas de ancho en un móvil; la vista rellena la pantalla sin pasarse del mapa
  const zbtn = document.getElementById('zbtn');
  function zoomTexto() { if (zbtn) zbtn.innerHTML = G.ic('lupa') + ZOOM2D[zoom2d].n; }
  if (zbtn && zbtn.addEventListener) zbtn.addEventListener('click', () => { zoom2d = (zoom2d + 1) % ZOOM2D.length; zoomTexto(); fit(); });
  function fit() {
    if (document.documentElement && document.documentElement.style) document.documentElement.style.setProperty('--padh', (document.getElementById('pad').offsetHeight || 0) + 'px'); // el minimapa se coloca encima de la cruceta flotante
    const availW = innerWidth - 12, availH = altoVista();
    K = Math.max(2, Math.min(7, Math.round(availW / ((clasico() ? G.clasico.COLUMNAS : 8) * ZOOM2D[zoom2d].f * T)))); // clásico: ~12 casillas de ancho
    while (K > 2 && (availH / K < 6 * T)) K--; // al menos 6 casillas de alto
    const dpr = window.devicePixelRatio || 1; KS = Math.max(1, Math.floor(K * dpr + 1e-6)); Kc = KS / dpr;
    VW = Math.min(W * T, Math.floor(availW * dpr / KS)); VH = Math.min(H * T, Math.max(6 * T, Math.floor(availH * dpr / KS)));   // la vista se calcula en píxeles de pantalla: con densidad entera es lo de siempre, con fraccionaria rellena la pantalla sin bordes   // v2.196: el lienzo se pinta a resolución de pantalla con escala ENTERA (densidad 3 → 6; 2,75 → 5, no 5,5), el dibujo del juego no cambia
    cv.width = VW * KS; cv.height = VH * KS; ctx.setTransform(KS, 0, 0, KS, 0, 0); ctx.imageSmoothingEnabled = false;
    cv.style.width = VW * Kc + 'px'; cv.style.height = VH * Kc + 'px';
    ui.width = VW * KS; ui.height = VH * KS; ui.style.width = VW * Kc + 'px'; ui.style.height = VH * Kc + 'px';
    follow(0, true);
    if (hd) hdAjustar(); if (zbtn) { zoomTexto(); if (zbtn.hidden !== hd) zbtn.hidden = hd; } // el botón de zoom del 2D no se ve en HD-2D (tiene el suyo)
  }
  ['contextmenu', 'selectstart', 'dragstart'].forEach((ev) => addEventListener(ev, (e) => e.preventDefault())); // al mantener pulsado un botón el móvil no selecciona ni ofrece copiar
  addEventListener('resize', fit); addEventListener('orientationchange', fit); if (window.visualViewport) visualViewport.addEventListener('resize', fit);
  const KEY = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
  addEventListener('keydown', (e) => { if (e.target && e.target.tagName === 'INPUT') return; if (KEY[e.key]) { keys[KEY[e.key]] = 1; e.preventDefault(); } });
  addEventListener('keyup', (e) => { if (KEY[e.key]) keys[KEY[e.key]] = 0; });
  document.querySelectorAll('[data-dir]').forEach((b) => {
    const k = b.dataset.dir, on = (e) => { keys[k] = 1; e.preventDefault(); }, off = () => { keys[k] = 0; };
    b.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, off));
  });
  addEventListener('keydown', (e) => { if (e.target && e.target.tagName === 'INPUT') return; if (e.key === 'e' || e.key === 'Enter' || e.key === ' ') { talk(); e.preventDefault(); } });
  { const nb = document.getElementById('nbtn'); if (nb) nb.addEventListener('click', () => { if (S.me && !est.combate && G.tablonUI) G.tablonUI.abrirBuzon(yo(), apiTablon); }); }   // v2.345: buzón de avisos
  { const qb = document.getElementById('qbtn'); { const bb = document.getElementById('bbtn'); if (bb) bb.addEventListener('click', () => { if (S.me && !est.combate) G.bolsaUI.abrir(yo(), { modo: 'mochila', api: apiBolsa }); }); }
  if (G.equipoUI) { G.equipoUI.montar(); if (qb) qb.addEventListener('click', () => { if (S.me) G.equipoUI.abrir(yo(), null, { mote: apiMote }); }); } }   // v2.310: pestaña Equipo (el equipo hoy es el acompañante)
  { const pb = document.getElementById('pbtn'), px = document.getElementById('peces-x'); if (pb) pb.addEventListener('click', () => { if (S.me) G.pecesUI.abrir(yo()); }); if (px) px.addEventListener('click', () => G.pecesUI.cerrar()); } // v2.192: colección de peces
  document.querySelectorAll('[data-pesca]').forEach((b) => b.addEventListener('pointerdown', (e) => { pescar(); e.preventDefault(); }));
  document.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('pointerdown', (e) => { talk(); e.preventDefault(); }));
  document.querySelectorAll('[data-evo]').forEach((b) => b.addEventListener('pointerdown', (e) => { evolve(); e.preventDefault(); }));
  document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    S.me = b.dataset.pick; if (!cargada) colocarInicio(); if (G.guardado.bloqueo) avisoBloqueo(); document.getElementById('menu').hidden = true; document.getElementById('who').textContent = 'Juegas con ' + NAME[S.me]; fit(); refrescarBril();
    G.redPeer.iniciar({ me: S.me, est, aviso: () => { const w = document.getElementById('who'); if (w && S.me) w.textContent = 'Juegas con ' + NAME[S.me] + G.redPeer.sufijo(); } }); // v2.188 (1.3d): dos móviles; el rol queda guardado
    { const cb2 = document.getElementById('cbtn'); if (cb2 && G.redPeer.activo()) cb2.hidden = true; } // con la sala creada los roles son fijos (Oli y Lali)
  }));
  { const rol = G.redPeer.rolGuardado(), pick = Array.from(document.querySelectorAll('[data-pick]')).find((b) => b.dataset.pick === rol), sinMenu = (() => { try { return /[?&]menu=1/.test(window.location.search); } catch (e) { return false; } })(); if (pick && !sinMenu) pick.click(); } // el móvil recuerda su personaje: entra solo (?menu=1 muestra el menú)
  { const cb = document.getElementById('cbtn'); if (cb) cb.addEventListener('click', () => { // v2.133: cambiar de personaje sin recargar; cada uno conserva su sitio
    if (!document.getElementById('menu').hidden || G.redPeer.activo()) return;
    S.me = OTHER[S.me]; G.audio.sfx('cambiar'); keys.up = keys.down = keys.left = keys.right = 0; document.getElementById('who').textContent = 'Juegas con ' + NAME[S.me]; sincronizar(); fit(); }); }
  G.audio.montar(document.getElementById('abtn')); // v2.136 (ID-4): música y sonido por código (src/audio.js); botón 🔊/🔇
  fit(); requestAnimationFrame(loop);
  if (G.hd2d && G.hd2d.elegido() === 'hd') irAHD(); // la última elección se recuerda: si era HD-2D se intenta de nuevo (si no carga, se queda en 2D y lo dice)
  window.__juego = { apiProf, apiCrianza, draw, get clock() { return clock; }, drawPlates, get creatures() { return lista(); }, creatureStep, talk, evolve, nearest, get MAP() { return M.suelo; }, solid, S, keys, step, blocked, cam, follow, fit, view: () => ({ VW, VH, K }), est, motor, mundo, orden, sincronizar, get mapa() { return M; }, get hd() { return hd; }, irAHD, volverA2D };
})();
