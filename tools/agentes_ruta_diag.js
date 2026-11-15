// agentes_ruta_diag.js — comprobación de los CUERPOS de los entrenadores en mapas dibujados (v2.326). Uso: node tools/agentes_ruta_diag.js [--min 40] [--semilla 7]
//  1) nadie pisa una casilla que el JUGADOR no puede pisar (mismo hitbox que G.motor.bloqueado) ni se queda en el borde cerrado del mapa;
//  2) nadie salta de sitio entre dos cuadros (teletransporte) salvo al entrar o salir de un edificio / mapa;
//  3) lo mismo DENTRO de los edificios (Centro PC, tienda): se les ve entrar, esperar y salir;
//  4) tras un duelo se quedan quietos al menos AJ.trato.reaccion segundos antes de moverse.
const G = require('./_cargar.js')(), A = G.agentes, arg = process.argv.slice(2), val = (k, d) => (arg.includes(k) ? arg[arg.indexOf(k) + 1] : d);
const MIN = +val('--min', 40), SEM = +val('--semilla', 7), T = 16, DT = 0.25, est = { semilla: SEM, agentes: A.crear(SEM, A.cfg.POBLACION), avisos: [], jugadores: {} };
const fallos = [], visto = new Map(), maxSalto = A.AJ.velocidad * DT * 1.6 + 2;
const pisable = (m, x, y) => [[-4, -4], [4, -4], [-4, 0], [4, 0]].every(([dx, dy]) => { const tx = Math.floor((x + dx) / T), ty = Math.floor((y + dy) / T); return tx >= 0 && ty >= 0 && tx < m.W && ty < m.H && !G.mundo.solido(m, tx, ty); });
const rea = new Map(); let dentro = 0, duelos = 0, saltos = 0, borde = 0, solidas = 0, quietos = 0;
for (let s = 0; s < MIN * 60 / DT; s++) {
  A.avanzar(est, DT);
  Object.keys(G.mundo.mapas).forEach((id) => { const m = G.mundo.mapas[id], ext = !!A.W().nodos[id];
    A.cuerpo.cuerpos(est, id).forEach((c) => { const k = id + c.ag, p = visto.get(k);
      if (c.al === undefined && !pisable(m, c.x, c.y)) { solidas++; if (solidas < 4) fallos.push(c.ag + ' pisa una casilla sólida en ' + id + ' (' + Math.floor(c.x / T) + ',' + Math.floor(c.y / T) + ')'); }
      const tx = Math.floor(c.x / T), ty = Math.floor((c.y - 6) / T), puerta = (m.puertas || []).some((q) => q.x === tx && q.y === ty);
      if (ext && (tx <= 0 || ty <= 0 || tx >= m.W - 1 || ty >= m.H - 1) && !puerta) { borde++; if (borde < 4) fallos.push(c.ag + ' en el borde cerrado de ' + id + ' (' + tx + ',' + ty + ')'); }
      if (p && p.t === s - 1 && c.al === undefined && p.al === undefined && Math.hypot(c.x - p.x, c.y - p.y) > maxSalto) { saltos++; if (saltos < 4) fallos.push(c.ag + ' salta ' + Math.round(Math.hypot(c.x - p.x, c.y - p.y)) + ' px en ' + id); }
      if (!ext) dentro++;
      if (c.rea && !rea.has(c.ag)) { rea.set(c.ag, { x: c.x, y: c.y, s }); duelos++; }
      const r = rea.get(c.ag); if (r && c.rea) { if (Math.hypot(c.x - r.x, c.y - r.y) > 1.5) { quietos++; if (quietos < 4) fallos.push(c.ag + ' se mueve durante su reacción'); } } else if (r) rea.delete(c.ag);
      visto.set(k, { x: c.x, y: c.y, t: s, al: c.al }); }); });
}
console.log(fallos.length ? 'FALLA: ' + fallos.join('; ') : 'OK ruta: ' + MIN + ' min · ' + duelos + ' reacciones tras duelo · ' + dentro + ' presencias dentro de edificios · sin casillas sólidas, bordes cerrados ni saltos');
process.exit(fallos.length ? 1 : 0);
