// portales_ui.js — IDENTIDAD VISUAL de los portales y TRANSICIÓN entre dimensiones (Multiverso F5). Solo dibujo (2D): sin estado de partida, sin azar.
// Es el MÍNIMO común y legible: marco con halo del color de cada portal (apagado si aún no se cumple su requisito), destellos que lo orbitan y un velo con el nombre de la dimensión al cruzar.
// El arte definitivo (iconos por portal, mapas, luz y música de cada mundo) lo hace el trabajo de contenido (Sonnet) leyendo los mismos datos: portal.color / portal.icono.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16, DEF = '#b9a2ff', DUR = 1.6;
  const hex = (c, a) => { const n = parseInt(String(c || DEF).slice(1), 16) || 0; return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a.toFixed(3) + ')'; };
  const estado = { desde: null, nombre: '', color: DEF, hasta: null };   // transición en curso (solo visual)
  const ui = (G.portalesUI = {
    DUR,
    // Portales visibles de un mapa (para el dibujo y las pruebas).
    portales(M) { return (M && M.puertas ? M.puertas : []).filter((p) => p && p.portal); },
    // Marco + halo de cada portal del mapa. `j` (opcional) decide si se ve «abierto» o «apagado».
    pintar(ctx, M, cam, VW, VH, clock, j, est) {
      ui.portales(M).forEach((p) => {
        const cx = Math.round(p.x * T + 8 - cam.x), cy = Math.round(p.y * T + 8 - cam.y); if (cx < -24 || cy < -24 || cx > VW + 24 || cy > VH + 24) return;
        const ok = !j || !G.portales || G.portales.comprobar(j, p.portal, est).ok, col = p.portal.color || DEF, pulso = 0.5 + 0.5 * Math.sin(clock * 2.4 + p.x), a = ok ? 0.55 + 0.25 * pulso : 0.22;
        ctx.save();
        const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 20); g.addColorStop(0, hex(col, a)); g.addColorStop(1, hex(col, 0));
        ctx.fillStyle = g; ctx.fillRect(cx - 22, cy - 24, 44, 48);
        ctx.strokeStyle = hex(col, ok ? 0.95 : 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 8, 12, 0, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 5; i++) { const an = clock * (ok ? 1.3 : 0.4) + i * 1.2566, dx = Math.cos(an) * 10, dy = Math.sin(an) * 14; ctx.fillStyle = hex('#ffffff', ok ? 0.85 : 0.3); ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1); }
        ctx.restore();
      });
    },
    // Avisa de que el jugador acaba de cambiar de mapa: si cambia de DIMENSIÓN empieza el velo (nombre y color de la nueva).
    entrar(mapaAntes, mapaAhora, clock) {
      const D = G.dimensiones; if (!D || !mapaAntes || !mapaAhora) return false;
      const a = D.deMapa(mapaAntes), b = D.deMapa(mapaAhora); if (!b || a === b) return false;
      const def = D.get(b); estado.desde = clock; estado.nombre = def ? def.nombre : b; estado.hasta = b;
      // el color del velo es el del portal que se ha cruzado (el de ida o, al volver, el del portal de la dimensión que se deja)
      let col = null; /* solo mira mapas YA cargados: el velo no debe volver a cargar una dimensión recién soltada */ try { const M = G.mundo; [mapaAntes, mapaAhora].forEach((id) => { if (col) return; const mp = M.mapas[id]; if (!mp) return; const q = mp.puertas.find((p) => p.portal && p.portal.color && p.destino && (p.destino.mapa === mapaAhora || p.destino.mapa === mapaAntes)); if (q) col = q.portal.color; }); } catch (x) { col = null; }
      estado.color = typeof col === 'string' && /^#[0-9a-fA-F]{6}$/.test(col) ? col : DEF; return true;
    },
    enCurso(clock) { return estado.desde !== null && clock - estado.desde < DUR; },
    // Velo a pantalla completa (aparece de golpe y se disipa) con el nombre de la dimensión. Devuelve la opacidad usada (0 = nada).
    velo(ctx, w, h, clock) {
      if (!ui.enCurso(clock)) { estado.desde = null; return 0; }
      const t = (clock - estado.desde) / DUR, a = t < 0.25 ? 1 : 1 - (t - 0.25) / 0.75, k = Math.max(0, Math.min(1, a));
      ctx.save(); ctx.fillStyle = hex(estado.color, 0.92 * k); ctx.fillRect(0, 0, w, h);
      if (G.drawPixelText && G.pixelTextWidth) { const u = Math.max(2, Math.round(Math.min(w, h) / 120)), tw = G.pixelTextWidth(estado.nombre, u); ctx.globalAlpha = Math.min(1, k * 1.4); G.drawPixelText(ctx, estado.nombre, Math.round((w - tw) / 2), Math.round(h / 2 - 4 * u), u, '#fff9ee', '#2a1b30'); }
      ctx.restore(); return k;
    },
    reiniciar() { estado.desde = null; },
  });
})(typeof window !== 'undefined' ? window : globalThis);
