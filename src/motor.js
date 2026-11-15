// motor.js — ESTADO del juego y ÓRDENES (paso 1.3a). No dibuja nada, no toca el DOM ni el teclado: solo reglas.
// Pensado para dos jugadores: cada jugador tiene SU mapa, posición y teclas. Todo lo que hace un jugador entra como una ORDEN
// {j: 'oli'|'lali', t: tipo, …} que se aplica con G.motor.aplicar(est, orden); más adelante (1.3d) las órdenes viajarán entre los dos móviles.
// Tipos de orden: 'teclas' {up,down,left,right} · 'colocar' {mapa?, ancla, dx?, dir?} · 'hablar' {i?} · 'evolucionar' {i?} · 'pescar' {} (v2.180: en un punto de pesca se pone a pescar; otra vez, recoge)  (i = nº de criatura en el mapa del jugador; sin i, la más cercana).
// El azar sale de una SEMILLA (est.rnd), nunca de Math.random: con la misma semilla y las mismas órdenes pasa lo mismo en los dos móviles.
(function (root) {
  'use strict';
  const G = root.G, T = 16, LEASH = 12, mundo = G.mundo;
  const ANG_DIR = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 };
  const DIRS = [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]];
  G.azar = function (semilla) { // mulberry32: números entre 0 y 1 reproducibles
    let a = semilla >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };

  const motor = G.motor = {
    T,
    crear(semilla) { // partida nueva: los dos jugadores en el ancla de inicio (Oli en ella, Lali dos casillas a la derecha); las criaturas salen por zonas (src/aparicion.js)
      const est = { semilla: semilla >>> 0, rnd: G.azar(semilla), reloj: 0, jugadores: {}, mapas: {}, avisos: [], dim: {}, sesion: semilla >>> 0 };   // F2: dim = secciones guardadas de dimensiones que este juego aún no gestiona (se conservan al guardar)
      const ini = mundo.INICIAL;
      ['oli', 'lali'].forEach((id) => { est.jugadores[id] = { id, mapa: ini.mapa, x: 0, y: 0, dir: 'down', ang: 0, moving: false, tm: 0, keys: { up: 0, down: 0, left: 0, right: 0 }, volver: [], enPuerta: null }; });
      est.sinAparicion = true; // los dos se colocan primero y la aparición se calcula una sola vez, con ambos ya en su sitio
      motor.aplicar(est, { j: 'oli', t: 'colocar', ancla: ini.ancla, dir: 'down' });
      motor.aplicar(est, { j: 'lali', t: 'colocar', ancla: ini.ancla, dx: 2, dir: 'left' });
      delete est.sinAparicion; motor.aparicion(est);
      return est;
    },
    nueva(id, tx, ty, espera, hueco, grupo) { // una criatura en la casilla (tx, ty); hueco y grupo (si salen del plan de aparición) dicen de qué hueco y zona es
      const c = { id, x: tx * T + 8, y: ty * T + 14, hx: tx * T + 8, hy: ty * T + 14, dir: 'down', moving: false, tm: 0, wait: espera || 0, walk: 0, vx: 0, vy: 0 };
      if (hueco !== undefined) { c.h = hueco; c.zona = grupo; }
      return c;
    },
    estadoMapa(est, id) { // estado de un mapa: sus criaturas, el plan de aparición (solo depende de la semilla y del mapa) y las zonas activas
      const m = mundo.mapa(id);
      if (!est.mapas[id]) est.mapas[id] = { criaturas: [], plan: G.aparicion.plan(est.semilla, m), activas: {} };
      return est.mapas[id];
    },
    // F4 · descarga de dimensiones: las que no son tonavia y ya no tienen NINGÚN jugador dentro salen de memoria (mapas preparados y su estado); al volver se reconstruyen desde su plan y las criaturas salvajes reaparecen. Lo persistente irá en las marcas de F6.
    liberarDimensiones(est) { const D = mundo.dimensiones, fuera = {}; D.lista().forEach((dim) => { if (dim === D.DEFECTO) return; const ids = mundo.cargadas(dim); if (!ids.length || Object.values(est.jugadores).some((j) => D.deMapa(j.mapa) === dim)) return; ids.forEach((id) => { delete est.mapas[id]; }); fuera[dim] = mundo.descargar(dim); if (G.capas && G.capas.soltar) G.capas.soltar(dim); }); return fuera; },   // FN: también se sueltan los suelos horneados (lienzos) de esa dimensión: el mar son 9 mapas de 1024×1024 px
    aparicion(est) { if (!est.sinAparicion) G.aparicion.actualizar(est); }, // activa y retira zonas según dónde estén los jugadores (est.sinAparicion = true solo en el banco de pruebas)
    criaturas(est, id) { return motor.estadoMapa(est, id).criaturas; },
    bloqueado(m, x, y) { return [[-4, -4], [4, -4], [-4, 0], [4, 0]].some(([dx, dy]) => mundo.solido(m, Math.floor((x + dx) / T), Math.floor((y + dy) / T))); },
    cercana(est, j) { // criatura más cercana al jugador (a menos de ~1,5 casillas)
      let best = null, bd = 24;
      motor.criaturas(est, j.mapa).forEach((c) => { const d = Math.hypot(c.x - j.x, c.y - j.y); if (d < bd) { bd = d; best = c; } });
      return best;
    },
    // F6 · REGISTRO DE ÓRDENES para módulos de contenido (FN, crafteo…). Un módulo registra órdenes `modulo.accion` (el punto las separa de las internas, que nunca llevan punto) con
    //   { validar?(est, j, o) → null | motivo, aplicar(est, j, o) → resultado }  — ambas reciben el ESTADO (`est`) y el jugador. Si `validar` da un motivo, la orden se rechaza con un aviso y no cambia nada;
    //   si el módulo falla (excepción), la orden se descarta con un aviso (un módulo roto no tira el juego) y el fallo queda en `ultimoError`. Las órdenes internas (tienda, tablón…) siguen como estaban.
    ordenes: (function () {
      const reg = Object.create(null), TIPO = /^[a-z][a-z0-9_]{0,23}\.[a-z][a-z0-9_]{0,31}$/;
      const O = {
        TIPO, ultimoError: null,
        registrar(tipo, def) {
          if (typeof tipo !== 'string' || !TIPO.test(tipo)) throw new Error('orden: el tipo debe ser «modulo.accion» (minúsculas, dígitos y _): ' + tipo);
          if (reg[tipo]) throw new Error('orden: «' + tipo + '» ya está registrada');
          if (!def || typeof def.aplicar !== 'function' || (def.validar !== undefined && typeof def.validar !== 'function')) throw new Error('orden: «' + tipo + '» necesita aplicar(est, j, o) y, opcionalmente, validar(est, j, o)');
          reg[tipo] = def;
        },
        existe(tipo) { return typeof tipo === 'string' && !!reg[tipo]; },
        lista() { return Object.keys(reg).sort(); },
        ejecutar(est, j, o) {
          const d = reg[o.t], aviso = (texto) => est.avisos.push({ j: j.id, texto });
          try {
            const motivo = d.validar ? d.validar(est, j, o) : null;
            if (motivo) { aviso(String(motivo)); return null; }
            return d.aplicar(est, j, o);
          } catch (e) { O.ultimoError = { t: o.t, mensaje: String(e && e.message || e) }; aviso('No se pudo hacer eso'); return null; }
        },
      };
      return O;
    })(),
    aplicar(est, o) { // aplica UNA orden; devuelve la criatura afectada (hablar/evolucionar) o null
      const j = est.jugadores[o.j]; if (!j) throw new Error('orden de un jugador que no existe: ' + o.j);
      if (motor.ordenes.existe(o.t)) return motor.ordenes.ejecutar(est, j, o);   // F6: órdenes de módulos de contenido
      if (o.t === 'teclas') { j.keys = { up: o.up | 0, down: o.down | 0, left: o.left | 0, right: o.right | 0 }; return null; }
      if (o.t === 'colocar') {
        const m = mundo.mapa(o.mapa || j.mapa), a = mundo.ancla(m, o.ancla); motor.estadoMapa(est, m.id);
        j.mapa = m.id; j.x = (a[0] + (o.dx | 0)) * T + 8; j.y = a[1] * T + 14; j.moving = false; j.enPuerta = null; if (j.pesca) j.pesca = null; if (o.dir) { j.dir = o.dir; j.ang = ANG_DIR[o.dir]; } motor.aparicion(est); motor.liberarDimensiones(est); return null;
      }
      if (o.t === 'pescar') { // v2.180 (Pesca 1): solo desde un punto de pesca; mira al agua y se queda quieto hasta que se mueva o recoja
        const aviso = (texto) => est.avisos.push({ j: j.id, texto });
        if (j.pesca) { // v2.181-v2.192: tirar en el pique saca el pez (los fuertes piden ritmo); fuera de la ventana, se tira pronto y se recoge el hilo
          const f = j.pesca;
          if (f.fase === 'pique') { motor.pez(est, j, f); if (G.PECES[f.pez].fuerza > 0) motor.forcejeo(f); else motor.capturar(est, j, f); }
          else if (f.fase === 'forcejeo') { // un toque con el anillo cerrándose = acierto; fuera de tiempo = tirón en falso (dos y se suelta)
            const EP = G.PECES[f.pez], marg = EP.margen || 0.3, i = f.beats.findIndex((b, n) => !f.hechos[n] && Math.abs(f.t - b) <= marg);
            if (i >= 0) { f.hechos[i] = true; f.aciertos = (f.aciertos | 0) + 1; } else { f.fallos = (f.fallos | 0) + 1; if (f.fallos >= (EP.fallosMax || 2)) { f.fase = 'fallo'; f.t = 0; aviso('Se soltó'); } }
          }
          else if (f.fase === 'lanzar' || f.fase === 'espera') { f.fase = 'fallo'; f.t = 0; aviso('Tiraste muy pronto'); }
          else if (f.fase === 'listo') { f.fase = 'lanzar'; f.t = 0; f.pez = undefined; f.kg = undefined; aviso('Lanzas otra vez'); }   // v2.222: caña en la mano con el hilo recogido: se vuelve a lanzar al pulsar
          return null;
        }
        const p = mundo.puntoPesca(mundo.mapa(j.mapa), Math.floor(j.x / T), Math.floor(j.y / T));
        if (!p) { aviso('Aquí no se puede pescar'); return null; }
        j.pesca = { id: p.id, fase: 'lanzar', t: 0 }; j.dir = p.mira; j.ang = ANG_DIR[p.mira]; j.keys = { up: 0, down: 0, left: 0, right: 0 }; j.moving = false; aviso('Pescas desde ' + p.id.replace(/_/g, ' ')); return null;
      }
      const lista = motor.criaturas(est, j.mapa), c = o.i === undefined ? motor.cercana(est, j) : lista[o.i] || null;
      if (o.t === 'curar') { // v2.312: la enfermera del Centro PC cura (hay que estar a su lado)
        const n = G.npc && G.npc.cercano(est, j); if (!n || n.id !== 'enfermera') return null;
        const T = G.tienda, coste = T ? T.precioCurar(j) : 0; // v2.316: curar cuesta Brillos (8 por herida, 20 por debilitada); si faltan, se pesca y se vende
        if (coste > 0 && T.saldo(j) < coste) { est.avisos.push({ j: j.id, texto: 'Curar cuesta ' + coste + ' ✦ y tienes ' + T.saldo(j) }); return { npc: n.id, curadas: false, falta: coste - T.saldo(j) }; }
        const hubo = motor.combate.curar(est, j.id); if (!hubo) est.avisos.push({ j: j.id, texto: 'Tus criaturas ya están en plena forma' }); else if (coste > 0) { T.gastar(j, coste); est.avisos.push({ j: j.id, texto: '-' + coste + ' ✦' }); } return { npc: n.id, curadas: hubo, coste: hubo ? coste : 0 };
      }
      if (o.t === 'equipo') { // v2.312: la enfermera prepara el equipo (hasta 6 especies que el jugador posee; la primera va al frente)
        const n = G.npc && G.npc.cercano(est, j); if (!n || n.id !== 'enfermera' || est.combate) return null;
        return G.equipo.poner(est, j, o.formas, o.ids) ? { npc: n.id, equipo: j.equipo.slice() } : null;
      }
      if (typeof o.t === 'string' && o.t.indexOf('tablon_') === 0) return G.tablon ? G.tablon.orden(est, j, o) : null;   // v2.344: tablón de intercambios (Tienda)
      if (o.t === 'buzon_leer') return { leidas: G.buzon.leer(j, Number.isInteger(o.i) ? o.i : undefined) };
      if (o.t === 'buzon_borrar') return { ok: G.buzon.borrar(j, o.i) };
      if (o.t === 'mote') { // v2.340: ponerle (o quitarle) un mote a una criatura del equipo ({ clave }) o de la caja ({ id }); fuera de combate
        if (est.combate) return null; return G.equipo.renombrar(est, j, o.clave !== undefined ? { clave: o.clave } : { id: o.id }, o.texto);
      }
      if (o.t === 'liberar') { // v2.342: soltar una criatura de la caja (solo con Alba; su ID no se reutiliza)
        const n = G.npc && G.npc.cercano(est, j); if (!n || n.id !== 'enfermera' || est.combate) return null;
        const r = G.equipo.liberar(est, j, o.id); return r ? Object.assign({ npc: n.id }, r) : null;
      }
      if (o.t === 'ampliar') { // v2.339: ampliar la caja del Centro PC (+10, cada vez más cara)
        const n = G.npc && G.npc.cercano(est, j); if (!n || n.id !== 'enfermera' || est.combate) return null;
        const r = G.equipo.ampliar(est, j); return Object.assign({ npc: n.id }, r);
      }
      if (o.t === 'hablar') {
        const np = G.npc && G.npc.cercano(est, j); // v2.312: un personaje a mano tiene prioridad sobre las criaturas
        if (np) { const p = G.npc.centro(np); j.dir = Math.abs(j.x - p.x) > Math.abs(j.y - p.y) ? (j.x < p.x ? 'right' : 'left') : (j.y < p.y ? 'down' : 'up'); j.moving = false; return { npc: np.id }; }
        if (!c) return null;
        const def = G.CREATURES[c.id]; c.talk = 2.5;
        c.dir = Math.abs(j.x - c.x) > Math.abs(j.y - c.y) ? (j.x < c.x ? 'left' : 'right') : (j.y < c.y ? 'up' : 'down');
        est.avisos.push({ j: j.id, texto: def.name + ': ' + def.line + ' (diseño de ' + def.by + ')' }); return c;
      }
      if (o.t === 'evolucionar') { // sin condiciones: el botón ✨ es solo para probar las evoluciones
        const aviso = (texto) => est.avisos.push({ j: j.id, texto });
        if (!c) { aviso('No hay ninguna criatura cerca'); return null; }
        const def = G.CREATURES[c.id];
        if (!def.evolvesTo) { aviso(def.name + (def.stage > 1 && def.stage >= def.phases ? ' ya está en su última fase' : ' todavía no tiene evolución diseñada')); return null; }
        const next = G.CREATURES[def.evolvesTo]; c.id = def.evolvesTo; c.talk = 1.2; c.moving = false;
        aviso('¡' + def.name + ' evoluciona a ' + next.name + '!'); return c;
      }
      throw new Error('orden desconocida: ' + o.t);
    },
    moverRemoto(est, j, dt) { // v2.188 (1.3d): el jugador del OTRO móvil no se simula: se acerca a lo último que mandó (sin azar, sin teclas)
      if (j.obj) { const dx = j.obj.x - j.x, dy = j.obj.y - j.y; if (Math.hypot(dx, dy) > 48) { j.x = j.obj.x; j.y = j.obj.y; } else { const k = Math.min(1, dt * 14); j.x += dx * k; j.y += dy * k; } }
      if (j.moving) j.tm += dt; if (j.pesca) j.pesca.t += dt;
    },
    moverJugador(est, j, dt) {
      if (j.remoto) { motor.moverRemoto(est, j, dt); return; }
      const m = mundo.mapa(j.mapa), k = j.keys, cn = m.conexiones; let vx = k.right - k.left, vy = k.down - k.up, n = vx && vy ? 0.7071 : 1, vel = 46;
      if (m.mar && G.navegacion) { vel = G.navegacion.velocidad(est, j); if (j.nav && j.nav.rumbo) { const gu = G.navegacion.guiar(est, j, vx, vy, dt); if (gu) { vx = gu.vx; vy = gu.vy; n = 1; } } }   // FN: en el mar el barco va a la velocidad de sus velas y puede seguir un rumbo automático (src/navegacion.js)
      j.moving = !!(vx || vy);
      if (!j.moving) { if (j.pesca) motor.pescando(est, j, dt); if (m.mar && G.navegacion) G.navegacion.tras(est, j, dt); return; }
      if (j.pesca) { j.pesca = null; est.avisos.push({ j: j.id, texto: 'Recoges la caña' }); } // moverse deja de pescar
      j.tm += dt;
      j.ang = Math.atan2(vx, vy); // v2.135: ángulo real de la marcha (0 = abajo, π/2 = derecha, π = arriba, −π/2 = izquierda); en diagonal, la esquina. Se conserva al parar. `dir` sigue siendo el eje dominante (2D)
      if (Math.abs(vx) >= Math.abs(vy) && vx) j.dir = vx > 0 ? 'right' : 'left'; else j.dir = vy > 0 ? 'down' : 'up';
      const sp = vel * dt * n;
      const nx = Math.max(cn.oeste ? -T : 6, Math.min(m.W * T + (cn.este ? T : -6), j.x + vx * sp)), ny = Math.max(cn.norte ? -T : 6, Math.min(m.H * T + (cn.sur ? T : -1), j.y + vy * sp));
      if (!motor.bloqueado(m, nx, j.y)) j.x = nx;
      if (!motor.bloqueado(m, j.x, ny)) j.y = ny;
      motor.cruzar(est, j, m);
      if (G.navegacion && G.navegacion.navegando(j)) G.navegacion.tras(est, j, dt);   // FN: niebla, puntos descubiertos y eventos del mar
    },
    pez(est, j, f) { // v2.192: el pez y su peso se deciden UNA vez (al empezar la espera, para que su sombra sea la del pez que pica); el azar es el de la semilla
      if (f.pez) return; const d = mundo.MIRAS[j.dir] || [0, 1], z = mundo.zonaAgua(mundo.mapa(j.mapa), Math.floor(j.x / T) + d[0], Math.floor(j.y / T) + d[1]);
      f.pez = G.pesca.elegir(est.rnd, z); f.kg = G.pesca.kg(est.rnd, f.pez);
    },
    forcejeo(f) { const E = G.PECES[f.pez]; f.fase = 'forcejeo'; f.t = 0; f.beats = []; f.hechos = []; f.aciertos = 0; f.fallos = 0; for (let i = 0; i < E.fuerza; i++) { f.beats.push(0.8 + i * E.ritmo); f.hechos.push(false); } },
    capturar(est, j, f) { // el pez sale del agua: se apunta (cuántos, el más pesado y si es nuevo) y salta
      const E = G.PECES[f.pez], id = f.pez; j.capturas = j.capturas || {}; j.records = j.records || {}; const nuevo = !j.capturas[id], rec = f.kg > (j.records[id] || 0);
      j.capturas[id] = (j.capturas[id] | 0) + 1; if (rec) j.records[id] = f.kg; f.fase = 'salto'; f.t = 0; f.n = (f.n | 0) + 1; f.nuevo = nuevo; f.rec = rec && !nuevo;
      est.avisos.push({ j: j.id, texto: '¡Has pescado: ' + E.nombre + ' (' + G.pesca.pesoTexto(f.kg) + ')!' + (nuevo ? ' ¡Nuevo!' : rec ? ' ¡Récord!' : '') });
      if (G.entrenador) G.entrenador.dar(est, j, nuevo ? 10 : 2, 'pesca');   // v2.343
      if (G.tienda) { G.tienda.meter(j, id, 1); if (nuevo) { const b = G.tienda.ganar(j, 10 + G.tienda.precioPez(id)); if (b) est.avisos.push({ j: j.id, texto: '+' + b + ' ✦ por tu primer ' + E.nombre }); } }   // v2.316: el pescado va a la mochila (se vende en la Tienda); la primera captura de cada especie da un premio
    },
    pescando(est, j, dt) { // v2.181 (Pesca 3-4): la pesca por fases (lanzar → espera → pique → salto/fallo → lanzar); la espera, los tirones y la ventana salen de la semilla (est.rnd), nunca son fijos
      const f = j.pesca, rnd = est.rnd; f.t += dt;
      if (f.fase === 'lanzar' && f.t >= 0.7) { f.fase = 'espera'; f.t = 0; f.espera = 3.5 + rnd() * 7.5; f.tirones = []; const k = (rnd() * 3) | 0; for (let i = 0; i < k; i++) f.tirones.push(0.5 + rnd() * Math.max(0.1, f.espera - 2.2)); f.tirones.sort((a, b) => a - b); motor.pez(est, j, f); }
      else if (f.fase === 'espera' && f.t >= f.espera) { f.fase = 'pique'; f.t = 0; f.ventana = 1.1 + rnd() * 0.5 + ((f.pez && G.PECES[f.pez] && G.PECES[f.pez].extraPique) || 0); }
      else if (f.fase === 'pique' && f.t >= f.ventana) { f.fase = 'fallo'; f.t = 0; f.sinToque = true; est.avisos.push({ j: j.id, texto: 'Se escapó' }); }   // v2.221: si no se tira en el pique, tras el fallo se recoge la caña (hay que volver a lanzar)
      else if (f.fase === 'forcejeo') { // se acabó el tiempo de un tirón sin acertar = se suelta; todos acertados = sale
        const perdido = f.beats.some((b, n) => !f.hechos[n] && f.t > b + (G.PECES[f.pez].margen || 0.3));
        if (perdido) { f.fase = 'fallo'; f.t = 0; est.avisos.push({ j: j.id, texto: 'Se soltó' }); }
        else if (f.hechos.every(Boolean)) motor.capturar(est, j, f);
      }
      else if (f.fase === 'fallo' && f.t >= 0.9 && f.sinToque) { f.fase = 'listo'; f.t = 0; f.sinToque = false; f.pez = undefined; f.kg = undefined; est.avisos.push({ j: j.id, texto: 'Vuelve a lanzar la caña' }); }   // v2.221-v2.222: un pique sin tocar ya no relanza solo: el hilo se recoge y la caña queda en la mano, visible, hasta pulsar 🎣
      else if ((f.fase === 'salto' && f.t >= 1.4) || (f.fase === 'fallo' && f.t >= 0.9)) { f.fase = 'lanzar'; f.t = 0; f.pez = undefined; f.kg = undefined; f.nuevo = f.rec = false; }
    },
    cruzar(est, j, m) { // bordes entre mapas y puertas
      const b = mundo.borde(m, j.x, j.y);
      if (b) {
        const nb = mundo.mapa(b.mapa);
        if (motor.bloqueado(nb, b.x, b.y)) { j.x = Math.max(6, Math.min(m.W * T - 6, j.x)); j.y = Math.max(6, Math.min(m.H * T - 1, j.y)); return; }
        motor.estadoMapa(est, b.mapa); j.mapa = b.mapa; j.x = b.x; j.y = b.y; j.enPuerta = null; motor.liberarDimensiones(est); return;
      }
      const tx = Math.floor(j.x / T), ty = Math.floor(j.y / T), p = mundo.puertaEn(m, tx, ty), clave = m.id + ':' + tx + ',' + ty;
      if (!p) { j.enPuerta = null; return; }
      if (j.enPuerta === clave) return; // acabas de llegar a esta puerta: no vuelve a saltar hasta que te apartes
      if (p.portal && G.portales) { const rq = G.portales.comprobar(j, p.portal, est); if (!rq.ok) { j.enPuerta = clave; est.avisos.push({ j: j.id, texto: 'El portal no se abre: necesitas ' + rq.faltan.join(' y ') + '.' }); return; } }   // F5: requisitos del portal (nivel de entrenador…)
      if (G.navegacion) { const no = G.navegacion.puedeCruzar(est, j, m, p); if (no) { j.enPuerta = clave; est.avisos.push({ j: j.id, texto: no }); return; } }   // FN: subir al barco exige que esté amarrado ahí
      let mid, tx2, ty2;
      if (p.destino.ancla === 'volver') { // Centro PC y tienda: se sale por la puerta de la que se entró
        const r = j.volver.pop() || mundo.puertaDe(m.id); if (!r) return; // v2.313: sin pila (partida cargada dentro) se sale por la puerta de este edificio
        const mr = mundo.mapa(r.mapa); mid = r.mapa; [tx2, ty2] = mundo.vecinaLibre(mr, r.tx, r.ty);
      } else {
        if (p.destino.mapa === 'tienda' && G.ciclo && !G.ciclo.abierta('tienda', est.reloj)) { j.enPuerta = clave; est.avisos.push({ j: j.id, texto: 'La tienda está cerrada de noche. Abre a las 6:00.' }); return; }   // v2.327: horario de la tienda
        j.volver.push({ mapa: m.id, tx, ty }); mid = p.destino.mapa; [tx2, ty2] = mundo.ancla(mundo.mapa(mid), p.destino.ancla);
      }
      motor.estadoMapa(est, mid); const dim0 = mundo.dimensiones.deMapa(m.id), dim1 = mundo.dimensiones.deMapa(mid), mapaAntes = m.id; j.mapa = mid; j.x = tx2 * T + 8; j.y = ty2 * T + 14;   // v2.309: el Centro PC cura a las criaturas
      j.enPuerta = mundo.puertaEn(mundo.mapa(mid), tx2, ty2) ? mid + ':' + tx2 + ',' + ty2 : null; motor.liberarDimensiones(est);
      if (G.navegacion) G.navegacion.alCruzar(est, j, mapaAntes, p);   // FN: bajar del barco lo amarra; subir lo pone en marcha
      if (dim0 !== dim1 && dim1) { const dd = mundo.dimensiones.get(dim1); est.avisos.push({ j: j.id, texto: 'Cruzas el portal: ' + (dd ? dd.nombre : dim1) }); }   // F5: cambio de dimensión
    },
    moverJugadores(est, dt) { Object.values(est.jugadores).forEach((j) => motor.moverJugador(est, j, dt)); },
    moverCriaturas(est, dt) { // paseo tranquilo de las criaturas de los mapas donde hay algún jugador; no pisan árboles ni agua
      motor.aparicion(est);
      const rnd = est.rnd, vistos = new Set(Object.values(est.jugadores).map((j) => j.mapa));
      vistos.forEach((id) => {
        const m = mundo.mapa(id);
        motor.criaturas(est, id).forEach((c) => {
          if (c.talk > 0) { c.talk -= dt; c.moving = false; return; } // se queda quieta mientras le hablas
          if (c.walk > 0) {
            const tr = G.traits(c.id), nx = c.x + c.vx * tr.speed * dt, ny = c.y + c.vy * tr.speed * dt;
            if (motor.bloqueado(m, nx, ny) || Math.hypot(nx - c.hx, ny - c.hy) > LEASH || nx < 8 || ny < 8 || nx > m.W * T - 8 || ny > m.H * T - 2) { c.walk = 0; c.wait = 0.4; c.moving = false; return; }
            c.x = nx; c.y = ny; c.moving = true; c.tm += dt; c.walk -= dt; if (c.walk <= 0) { c.moving = false; const w = G.traits(c.id).wait; c.wait = w[0] + rnd() * (w[1] - w[0]); }
          } else if ((c.wait -= dt) <= 0) {
            const far = Math.hypot(c.x - c.hx, c.y - c.hy) > LEASH * 0.6, d = far ? DIRS.slice().sort((a, b) => Math.hypot(c.x + a[1] * 6 - c.hx, c.y + a[2] * 6 - c.hy) - Math.hypot(c.x + b[1] * 6 - c.hx, c.y + b[2] * 6 - c.hy))[0] : DIRS[(rnd() * 4) | 0]; c.dir = d[0]; c.vx = d[1]; c.vy = d[2]; c.walk = 0.6 + rnd() * 1.2;
          }
        });
      });
    },
    avanzar(est, dt) { est.reloj += dt; motor.moverJugadores(est, dt); motor.moverCriaturas(est, dt); if (G.tablon) G.tablon.avanzar(est, dt); },
  };
})(typeof window !== 'undefined' ? window : globalThis);
