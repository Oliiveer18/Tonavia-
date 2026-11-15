// red.js — v2.188 (1.3d): QUÉ viaja entre los dos móviles, sin red ni DOM. Cada móvil manda SU jugador (autoridad por jugador) y el otro lo pinta; el mundo sale de la semilla.
// resumen(est, id) → mensaje; aplicar(est, id, msg) → true si era válido y se aplicó (valida TODO lo que llega: un mensaje roto o tramposo no puede romper la partida).
// FN · VERSIÓN 2: añade el campo «nav» (barco: niveles de casco y velas y cosmética) y SOLO se manda mientras el jugador navega (en el mar); en tierra el mensaje es el de siempre (v1, idéntico byte a byte).
// Se aceptan v1 y v2; un mensaje v1 con «nav», o un «nav» mal formado, o en un mapa que no es de mar, se rechaza entero. Un móvil con la versión anterior solo ve parado al que navega (rechaza los v2); nada se rompe.
// El jugador remoto lleva `remoto = true`: el motor no lo simula (motor.moverRemoto lo acerca suavemente a lo recibido), así no gasta azar ni se desincroniza.
(function (root) {
  'use strict';
  const G = root.G, T = 16, VERSION = 2, DIRS = ['up', 'down', 'left', 'right'], FASES = ['lanzar', 'espera', 'pique', 'forcejeo', 'salto', 'fallo'], esNum = Number.isFinite, r1 = (n) => Math.round(n * 10) / 10, r3 = (n) => Math.round(n * 1000) / 1000;
  const DIMR = /^[a-z][a-z0-9_]{0,23}$/, PROG = new WeakMap(), MAX_PROG = 40000;   // F8: progreso DECLARADO por el otro móvil (no es estado de juego: no se guarda; vive por partida)
  const red = G.red = {
    VERSION,
    // F8 (P3) · PROGRESO DECLARADO. El anfitrión no tiene el progreso personal del otro jugador (su copia es la de su último guardado): cada móvil declara el SUYO en un mensaje aparte { v:1, k:'prg', xp, marcas, cascos }
    // (solo cuando cambia; el mensaje de posición no cambia ni un byte). El receptor lo valida (forma, rangos, tamaño) y exige que no BAJE (xp, marcas y cascos solo suben dentro de una conexión).
    progreso(est, id) {
      const j = est.jugadores[id]; if (!j) return null;
      const marcas = {}; Object.keys(est.marcas || {}).filter((d) => DIMR.test(d)).forEach((d) => { const t = G.marcas && G.marcas.lista(est, j, d); if (t && Object.keys(t).length) marcas[d] = t; });
      const cascos = {}; if (G.navegacion && G.dimensiones) G.dimensiones.lista().forEach((d) => { const e = G.dimensiones.entrada(d), b = e ? G.navegacion.barco(est, { id, mapa: e.mapa }) : null; if (b && b.casco > 0) cascos[d] = b.casco; });
      return { v: 1, k: 'prg', xp: G.entrenador ? G.entrenador.xpDe(j) : 0, marcas, cascos };
    },
    progresoAplicar(est, id, m) {   // → true si se aceptó
      if (!est.jugadores[id] || !m || typeof m !== 'object' || m.v !== 1 || m.k !== 'prg' || !G.entrenador) return false;
      const tope = G.entrenador.xpPara(G.entrenador.MAX); if (!Number.isInteger(m.xp) || m.xp < 0 || m.xp > tope) return false;
      const plano = (o) => !!o && typeof o === 'object' && !Array.isArray(o); if (!plano(m.marcas) || !plano(m.cascos)) return false;
      try { if (JSON.stringify(m).length > MAX_PROG) return false; } catch (e) { return false; }
      const marcas = {}, dims = Object.keys(m.marcas); if (dims.length > 64) return false;
      for (const d of dims) { if (!DIMR.test(d) || !plano(m.marcas[d])) return false; const t = G.marcas ? G.marcas.limpiar({ x: m.marcas[d] }).x || {} : {}; if (Object.keys(t).length !== Object.keys(m.marcas[d]).length) return false; marcas[d] = t; }   // una marca mal formada rechaza el mensaje entero
      const cascos = {}, cs = Object.keys(m.cascos); if (cs.length > 64) return false; for (const d of cs) { if (!DIMR.test(d) || !Number.isInteger(m.cascos[d]) || m.cascos[d] < 0 || m.cascos[d] > 9) return false; cascos[d] = m.cascos[d]; }
      let mapaP = PROG.get(est); if (!mapaP) { mapaP = {}; PROG.set(est, mapaP); } const v = mapaP[id];
      if (v) {   // dentro de una conexión el progreso no baja: un mensaje que retrocede es falso o viejo
        if (m.xp < v.xp) return false; for (const d of Object.keys(v.marcas)) for (const k of Object.keys(v.marcas[d])) if (!(marcas[d] && marcas[d][k] >= v.marcas[d][k])) return false; for (const d of Object.keys(v.cascos)) if (!(cascos[d] >= v.cascos[d])) return false;
      }
      mapaP[id] = { xp: m.xp, marcas, cascos }; return true;
    },
    declarado(est, id) { const o = PROG.get(est); return o && o[id] ? o[id] : null; },
    resumen(est, id) {
      const j = est.jugadores[id], f = j.pesca, nav = G.navegacion ? G.navegacion.red(est, id) : null;
      const o = { v: nav ? VERSION : 1, id, mapa: j.mapa, x: r1(j.x), y: r1(j.y), dir: j.dir, ang: r3(j.ang), moving: !!j.moving, tm: r3(j.tm), pesca: f ? { id: f.id, fase: f.fase, t: r3(f.t || 0), pez: f.pez || null } : null, capturas: Object.assign({}, j.capturas), prof: G.profundidades ? G.profundidades.red(est, id) : null };   // v2.320: + la expedición de las Profundidades (se funde, ver profundidades.js)
      if (nav) o.nav = nav; return o;
    },
    aplicar(est, id, m) {
      const j = est.jugadores[id]; if (!j || !m || typeof m !== 'object' || (m.v !== 1 && m.v !== VERSION) || m.id !== id) return false;
      let mapa = null; try { mapa = typeof m.mapa === 'string' ? G.mundo.mapa(m.mapa) : null; } catch (e) { mapa = null; } if (!mapa || !esNum(m.x) || !esNum(m.y) || m.x < 0 || m.y < 0 || m.x > mapa.W * T || m.y > mapa.H * T || DIRS.indexOf(m.dir) < 0 || !esNum(m.ang) || !esNum(m.tm) || m.tm < 0 || typeof m.moving !== 'boolean') return false;
      const p = m.pesca; if (p !== null && !(p && typeof p === 'object' && typeof p.id === 'string' && FASES.indexOf(p.fase) >= 0 && esNum(p.t) && p.t >= 0 && (p.pez === null || p.pez === undefined || (G.PECES && G.PECES[p.pez])))) return false;
      let nv = null; if (m.nav !== undefined) { nv = m.v === VERSION && mapa.mar && G.navegacion ? G.navegacion.redLimpiar(m.nav) : null; if (!nv) return false; }   // FN: el barco
      const c = {}; if (m.capturas && typeof m.capturas === 'object') Object.keys(m.capturas).forEach((k) => { if (G.PECES && G.PECES[k] && Number.isInteger(m.capturas[k]) && m.capturas[k] > 0 && m.capturas[k] < 100000) c[k] = m.capturas[k]; });
      if (j.remoto && j.mapa !== m.mapa && !red.cruceValido(est, j, m, mapa)) { G.motor.liberarDimensiones(est); return false; }   // F8 (P3): el cambio de DIMENSIÓN de un jugador remoto solo vale si sale de una puerta real (se ignora el mensaje; no se crea ni se carga nada)
      const nuevo = !j.remoto || j.mapa !== m.mapa; j.remoto = true;
      if (nuevo) { j.mapa = m.mapa; j.x = m.x; j.y = m.y; G.motor.estadoMapa(est, m.mapa); G.motor.liberarDimensiones(est); }
      j.obj = { x: m.x, y: m.y }; j.dir = m.dir; j.ang = m.ang; j.moving = m.moving; j.tm = m.tm; j.capturas = c; j.barcoRed = nv || undefined; if (!nv) delete j.barcoRed;
      j.pesca = p ? { id: p.id, fase: p.fase, t: p.t, pez: p.pez || undefined } : null;
      if (G.profundidades && m.prof) G.profundidades.redAplicar(est, id, m.prof);
      return true;
    },
    // F8 · ¿es legítimo el salto de mapa que anuncia un jugador REMOTO? Dentro de una dimensión basta con que el mapa exista (bordes, puertas, faros y escaleras ya los decide su móvil). Entre dimensiones debe haber una puerta del mapa
    // de origen que lleve al de destino, el jugador debe haber estado junto a ella en su último mensaje y debe aparecer junto al ancla de llegada; si la puerta es un portal, los requisitos que dependen solo del estado COMÚN
    // (la marea) se comprueban aquí. Los que dependen del progreso personal (nivel, marcas, casco) los comprueba el móvil del propio jugador al cruzar: el otro móvil no tiene ese progreso.
    cruceValido(est, j, m, mapa) {
      const D = G.mundo.dimensiones, d0 = D.deMapa(j.mapa), d1 = D.deMapa(m.mapa); if (d0 === d1) return true;
      let o = null; try { o = G.mundo.mapa(j.mapa); } catch (e) { return false; }
      const px = j.obj ? j.obj.x : j.x, py = j.obj ? j.obj.y : j.y, TOL = 6 * T, cerca = (x, y, cx, cy, r) => Math.abs(x - cx) <= r && Math.abs(y - cy) <= r;
      return o.puertas.some((p) => {
        if (!p.destino || !cerca(px, py, p.x * T + 8, p.y * T + 8, TOL)) return false;
        if (p.destino.ancla === 'volver') return mapa.puertas.some((q) => q.destino && q.destino.mapa === j.mapa && q.destino.ancla !== 'volver' && cerca(m.x, m.y, q.x * T + 8, q.y * T + 8, 3 * T));   // «volver»: se sale por la puerta de la que se entró (su pila vive en el móvil del jugador): debe aparecer junto a la puerta de ida del mapa de destino (la que lleva al de origen sin «volver»)
        if (p.destino.mapa !== m.mapa) return false;
        let a = null; try { a = G.mundo.ancla(mapa, p.destino.ancla); } catch (e) { return false; } if (!a || !cerca(m.x, m.y, a[0] * T + 8, a[1] * T + 14, 3 * T)) return false;
        return !p.portal || !Array.isArray(p.portal.requisitos) || !p.portal.requisitos.length || G.portales.comprobar(j, p.portal, est, red.declarado(est, j.id)).ok;   // TODOS los requisitos: los de estado común (marea) con el reloj de aquí, los personales (nivel, marca, casco) con lo que el jugador declaró; si no declaró nada, se cierra
      });
    },
    soltar(est, id) { const j = est.jugadores[id]; if (!j) return; j.remoto = false; { const o = PROG.get(est); if (o) delete o[id]; } j.obj = null; j.barcoRed = undefined; delete j.barcoRed; j.moving = false; j.pesca = null; j.keys = { up: 0, down: 0, left: 0, right: 0 }; }, // se perdió la conexión: se queda quieto donde estaba
  };
})(typeof window !== 'undefined' ? window : globalThis);
