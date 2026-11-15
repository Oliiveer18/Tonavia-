// aparicion.js — APARICIÓN de criaturas por zona y rareza (paso 1.3b, v2.17). Solo reglas: no dibuja, no toca el DOM ni usa Math.random.
// Las criaturas ya no están colocadas una a una. Cada mapa (maps/*.json) trae ZONAS de aparición (con un elemento) y, para las legendarias, GUARIDAS (npc «guarida», id = fam de la línea).
// 1) PLAN del mapa: al crear el estado de un mapa se calcula, solo con la semilla de la partida y el id del mapa, qué criatura sale en cada hueco y en qué casilla. Misma semilla = mismo plan en los dos móviles.
//    · Nº de huecos de una zona = casillas libres / CASILLAS_POR_HUECO (mín. 1, máx. MAX_HUECOS). Casilla de hueco: libre con sus 4 vecinas libres, separada de los otros huecos y lejos del inicio y de las puertas.
//    · Línea de cada hueco: se sortea primero la rareza (PESOS: Común 60, Rara 28, Épica 10; las clases que no tengan líneas en esa zona se saltan y los pesos se reparten entre las demás) y luego una línea de esa rareza con el elemento de la zona (los dobles salen en las dos zonas). Una misma línea no sale más de MAX_IGUALES veces por zona (Común 3, Rara 2, Épica 1).
//    · Las legendarias nunca se sortean: solo están en su guarida (una casilla fija).
// 2) ACTIVACIÓN: una zona se activa cuando algún jugador de ese mapa está a ≤ ACTIVA casillas de ella y se retira cuando todos están a > RETIRA (la histéresis evita parpadeos). Al retirarse, la criatura se guarda en el plan y, al volver, sale en el MISMO hueco y con la misma forma (si evolucionó, evolucionada).
//    INTERRUPTOR (v2.19, paso 1.3b-bis): AJUSTES.VISIBLES = false (hoy) → no sale NINGUNA criatura ni guarida (el plan, el registro, los dibujos y la galería no cambian); true → como en la v2.17. AJUSTES.SOLO = null (todas) o una lista de ids de línea (fam) para dejar salir solo esas, p. ej. ['pompon'].
//    Máximo MAX criaturas activas por mapa: si ya hay MAX, el resto espera a que otra se retire.
// El estado de un mapa guarda solo datos simples (se podrá enviar entre móviles en el 1.3d): { criaturas: [...], plan: { huecos: [...] }, activas: { idZona: true } }.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16;
  const AJUSTES = { VISIBLES: true, SOLO: null, PESOS: { comun: 60, rara: 28, epica: 10 }, MAX: 24, ACTIVA: 9, RETIRA: 13, CASILLAS_POR_HUECO: 18, MAX_HUECOS: 6, MAX_IGUALES: { comun: 3, rara: 2, epica: 1 }, SEPARACION: 3, LEJOS_INICIO: 3, FIJAS: [] };   // FIJAS (v2.230, solo para revisar modelos 3D): lista de líneas que SIEMPRE ocupan un hueco de su zona, también en partidas guardadas; [] = desactivado
  G.hash = function (s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }; // FNV-1a: texto → número de 32 bits

  const ap = G.aparicion = {
    AJUSTES,
    fuente: null, // para pruebas: una lista de líneas que sustituye a G.LINEAS (p. ej. 200 líneas simuladas)
    lineas() { return ap.fuente || G.LINEAS; },
    permitido(h) { return !!AJUSTES.VISIBLES && (!AJUSTES.SOLO || AJUSTES.SOLO.includes(h.linea)); }, // ¿puede verse este hueco? (interruptor VISIBLES y lista SOLO)
    libre(m, tx, ty) { const s = G.mundo.solido; return !s(m, tx, ty) && !s(m, tx - 1, ty) && !s(m, tx + 1, ty) && !s(m, tx, ty - 1) && !s(m, tx, ty + 1) && !G.mundo.puertaEn(m, tx, ty); },
    huecosDe(m, z) { // nº de huecos de una zona según su tamaño real (casillas no sólidas)
      let n = 0; for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) if (!G.mundo.solido(m, x, y)) n++;
      return Math.max(1, Math.min(AJUSTES.MAX_HUECOS, Math.round(n / AJUSTES.CASILLAS_POR_HUECO)));
    },
    // Plan de un mapa: lista de huecos { grupo, guarida?, linea, tx, ty, espera, actual? } en un orden fijo (guaridas, luego zonas en el orden del archivo).
    // F6: `reglas` (opcional) = ajustes del mapa { rareza, lineas } (los de su dimensión/región, G.dimensiones.ajustesDe): pesos de rareza que pisan a PESOS y multiplicador por línea
    // (0 = no sale; >1 sale más; <1 menos). Sin reglas (todo Tonavia) el plan es EXACTAMENTE el de siempre: mismas llamadas al azar en el mismo orden.
    plan(semilla, m, lineas, reglas) {
      lineas = lineas || ap.lineas();
      const R = reglas || (G.dimensiones && G.dimensiones.ajustesDe ? G.dimensiones.ajustesDe(m) : null), LM = R && R.lineas ? R.lineas : null, PS = R && R.rareza ? Object.assign({}, AJUSTES.PESOS, R.rareza) : AJUSTES.PESOS;
      const mult = (fam) => (LM && LM[fam] !== undefined ? LM[fam] : 1);
      const rnd = G.azar(G.hash(String(semilla >>> 0) + '|' + m.id)), huecos = [], ocupadas = [];
      const lejos = (tx, ty) => ocupadas.every(([a, b]) => Math.hypot(a - tx, b - ty) >= AJUSTES.SEPARACION);
      const ini = m.anclas.inicio, cerca = (tx, ty) => (ini && Math.hypot(ini[0] - tx, ini[1] - ty) < AJUSTES.LEJOS_INICIO) || m.puertas.some((p) => Math.hypot(p.x - tx, p.y - ty) < 2);
      m.npcs.filter((n) => n.tipo === 'guarida' && mult(n.id) > 0).forEach((n) => { huecos.push({ grupo: 'guarida:' + n.id, guarida: true, linea: n.id, tx: n.x, ty: n.y, espera: rnd() * 2 }); ocupadas.push([n.x, n.y]); });
      m.zonas.forEach((z) => {
        const pool = lineas.filter((L) => L.rarity !== 'legendaria' && L.elements.includes(z.elemento) && mult(L.fam) > 0);
        if (!pool.length) return;
        const cand = []; for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) if (ap.libre(m, x, y)) cand.push([x, y]);
        for (let i = cand.length - 1; i > 0; i--) { const k = (rnd() * (i + 1)) | 0; [cand[i], cand[k]] = [cand[k], cand[i]]; } // mezcla con la semilla
        const quiere = ap.huecosDe(m, z), veces = {}; let n = 0;
        for (const [tx, ty] of cand) {
          if (n >= quiere) break;
          if (!lejos(tx, ty) || cerca(tx, ty)) continue;
          const clases = ['comun', 'rara', 'epica'].map((r) => [r, pool.filter((L) => L.rarity === r && (veces[L.fam] || 0) < AJUSTES.MAX_IGUALES[r])]).filter(([r, ls]) => ls.length && PS[r] > 0);
          if (!clases.length) break; // todas las líneas de la zona ya salieron el máximo de veces
          let t = rnd() * clases.reduce((s, [r]) => s + PS[r], 0), ls = clases[clases.length - 1][1];
          for (const [r, l] of clases) { if ((t -= PS[r]) < 0) { ls = l; break; } }
          let L; if (LM && ls.some((q) => mult(q.fam) !== 1)) { let u = rnd() * ls.reduce((s, q) => s + mult(q.fam), 0); L = ls[ls.length - 1]; for (const q of ls) { if ((u -= mult(q.fam)) < 0) { L = q; break; } } } else L = ls[(rnd() * ls.length) | 0]; veces[L.fam] = (veces[L.fam] || 0) + 1;
          huecos.push({ grupo: z.id, linea: L.fam, tx, ty, espera: rnd() * 2 }); ocupadas.push([tx, ty]); n++;
        }
      });
      return { huecos };
    },
    // v2.230: garantiza que cada línea de AJUSTES.FIJAS tenga un hueco en la zona de su elemento (usa un hueco sin criatura viva; no gasta azar, así el resto del plan no cambia). Idempotente.
    fijar(em, m) {
      (AJUSTES.FIJAS || []).forEach((fam) => {
        const L = ap.lineas().find((l) => l.fam === fam); if (!L || em.plan.huecos.some((h) => h.linea === fam)) return;
        const z = m.zonas.find((q) => L.elements.includes(q.elemento)); if (!z) return;
        const h = em.plan.huecos.find((q, i) => q.grupo === z.id && !q.guarida && !em.criaturas.some((c) => c.h === i));
        if (h) { h.linea = fam; h.actual = undefined; }
      });
    },
    grupos(plan) { const g = []; plan.huecos.forEach((h, i) => { let x = g.find((q) => q.id === h.grupo); if (!x) g.push(x = { id: h.grupo, idx: [] }); x.idx.push(i); }); return g; },
    // Distancia (en casillas) del punto (px, py) al rectángulo de una zona o a la casilla de una guarida.
    distancia(m, plan, grupo, px, py) {
      let x0, y0, x1, y1;
      if (grupo.id.startsWith('guarida:')) { const h = plan.huecos[grupo.idx[0]]; x0 = h.tx; y0 = h.ty; x1 = h.tx + 1; y1 = h.ty + 1; }
      else { const z = m.zonas.find((q) => q.id === grupo.id); x0 = z.x; y0 = z.y; x1 = z.x + z.w; y1 = z.y + z.h; }
      const tx = px / T, ty = py / T; return Math.hypot(Math.max(x0 - tx, 0, tx - x1), Math.max(y0 - ty, 0, ty - y1));
    },
    // Pone al día las criaturas de TODOS los mapas del estado: activa zonas cercanas, retira las lejanas y respeta el máximo. Idempotente y barato: se llama cada fotograma.
    actualizar(est) {
      const jugs = Object.values(est.jugadores);
      Object.keys(est.mapas).forEach((id) => {
        const em = est.mapas[id], m = G.mundo.mapa(id), aqui = jugs.filter((j) => j.mapa === id);
        ap.fijar(em, m);
        if (!em.grupos) em.grupos = ap.grupos(em.plan); // índice del plan (se recalcula, no se envía)
        em.grupos.forEach((g) => {
          const d = aqui.length && AJUSTES.VISIBLES ? Math.min.apply(null, aqui.map((j) => ap.distancia(m, em.plan, g, j.x, j.y))) : Infinity;
          if (!em.activas[g.id] && d <= AJUSTES.ACTIVA) em.activas[g.id] = true;
          else if (em.activas[g.id] && d > AJUSTES.RETIRA) delete em.activas[g.id];
          g.idx.forEach((i) => {
            const h = em.plan.huecos[i], viva = em.criaturas.find((c) => c.h === i);
            if (em.activas[g.id] && ap.permitido(h)) { if (!viva && !(em.vencidas && em.vencidas[i]) && em.criaturas.length < AJUSTES.MAX) em.criaturas.push(G.motor.nueva(h.actual || h.linea, h.tx, h.ty, h.espera, i, g.id)); }
            else if (viva && !(viva.talk > 0)) { h.actual = viva.id === h.linea ? undefined : viva.id; em.criaturas.splice(em.criaturas.indexOf(viva), 1); } // se retira; si no, guarda en qué forma estaba
          });
        });
      });
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
