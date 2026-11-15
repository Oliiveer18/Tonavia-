// navegacion_ui.js — DIBUJO y panel mínimo de la navegación (Multiverso FN). Solo presentación (2D y clásico): sin estado de partida ni azar.
// Barco bajo la persona (casco/velas/cosmética según G.navegacion.aspecto), niebla por celdas, destellos de eventos, balizas y el panel «⚓» con rutas y faros.
// El arte definitivo (modelos, velas, mascarones) lo hace el trabajo de contenido leyendo los mismos datos.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), T = 16, CASCO = ['#8a5a3c', '#6b4a8a', '#3c6a8a', '#8a3c4a'], VELA = ['#f4efe0', '#fff1b8', '#cdeaff'];
  let panelEl = null, sig = '';
  const N = () => G.navegacion;
  const ui = (G.navegacionUI = {
    // Barco bajo los pies de la persona (x, y = pies en px del mapa). `mueve`: deja estela.
    barco(ctx, asp, dir, x, y, clock, mueve) {
      const a = asp || { casco: 0, velas: 0, cos: {} }, bob = Math.round(Math.sin(clock * 2.2 + x * 0.05)), col = CASCO[Math.min(a.casco | 0, CASCO.length - 1)], vela = VELA[Math.min(a.velas | 0, VELA.length - 1)];
      ctx.save(); ctx.translate(Math.round(x), Math.round(y) + bob);
      if (mueve) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; const o = dir === 'left' ? 1 : dir === 'right' ? -1 : 0, v = dir === 'up' ? 1 : dir === 'down' ? -1 : 0; for (let i = 1; i <= 3; i++) ctx.fillRect(Math.round(o * i * 5 - 3 + (dir === 'up' || dir === 'down' ? 0 : 0)), Math.round(-v * i * 4 + 2), 6 - i, 1); }
      ctx.fillStyle = 'rgba(20,40,70,0.28)'; ctx.fillRect(-11, 0, 22, 3);
      ctx.fillStyle = col; ctx.fillRect(-10, -3, 20, 5); ctx.fillRect(-8, 2, 16, 1); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-10, -3, 20, 1);
      if (a.velas > 0 || true) { ctx.fillStyle = '#5a3b26'; ctx.fillRect(-1, -14, 2, 11); ctx.fillStyle = vela; ctx.fillRect(1, -13, 6 + (a.velas | 0) * 2, 8 + (a.velas | 0)); }
      if (a.cos && a.cos.bandera) { ctx.fillStyle = '#d94b4b'; ctx.fillRect(-1, -17, 5, 3); }
      if (a.cos && a.cos.mascaron) { ctx.fillStyle = '#e8c35a'; ctx.fillRect(9, -4, 3, 4); }
      ctx.restore();
    },
    // Niebla: oscurece las celdas de 8×8 casillas del mapa visible que el jugador aún no ha visto.
    niebla(ctx, M, est, j, cam, VW, VH) {
      const n = N(); if (!n || !M || !M.mar || !j || j.mapa !== M.id) return; const c = n.cfgDe(M.id.split('/')[0]); if (!c || !c.pos || !c.pos[M.id]) return;
      const b = n.niebla(est, j), p = c.pos[M.id], C = n.CELDA, W = n.CELDAS, per = c.lado / C; ctx.save(); ctx.fillStyle = 'rgba(20,30,50,0.62)';
      for (let cy = 0; cy < per; cy++) for (let cx = 0; cx < per; cx++) { if (b[(p[0] * per + cy) * W + p[1] * per + cx]) continue; const px = Math.round(cx * C * T - cam.x), py = Math.round(cy * C * T - cam.y); if (px > VW || py > VH || px + C * T < 0 || py + C * T < 0) continue; ctx.fillRect(px, py, C * T, C * T); }
      ctx.restore();
    },
    // Destellos de los eventos activos del mapa (cofre, botella, remolino…) que ya no se han cobrado.
    eventos(ctx, M, est, j, cam, clock) {
      const n = N(); if (!n || !M || !M.mar) return; const lista = n.eventos(est, M.id), niebla = n.niebla(est, j), c = n.cfgDe(M.id.split('/')[0]); if (!c) return;
      lista.forEach((e) => {
        const px = Math.round(e.tx * T + 8 - cam.x), py = Math.round(e.ty * T + 8 - cam.y + Math.sin(clock * 2 + e.tx) * 1.5), k = e.tipo === 'remolino' || e.tipo === 'tormenta' ? '#9fd0ff' : e.tipo === 'ballena' ? '#7fb6d9' : '#ffe58a';
        ctx.save(); ctx.fillStyle = k; if (e.tipo === 'remolino') { ctx.strokeStyle = k; ctx.beginPath(); ctx.arc(px, py, 6 + Math.sin(clock * 3) * 1.5, 0, Math.PI * 2); ctx.stroke(); } else { ctx.fillRect(px - 2, py - 2, 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(px - 1 + Math.round(Math.sin(clock * 4)), py - 4, 1, 1); } ctx.restore();
      });
    },
    // Balizas/faros descubiertos del mapa visible.
    puntos(ctx, M, est, j, cam, clock) {
      const n = N(); if (!n || !M || !M.mar || !j) return; n.puntos(est, j).filter((p) => p.mapa === M.id).forEach((p) => {
        const px = Math.round(p.tx * T + 8 - cam.x), py = Math.round(p.ty * T + 8 - cam.y), pulso = 0.5 + 0.5 * Math.sin(clock * 2.4 + p.tx);
        ctx.save(); ctx.fillStyle = 'rgba(255,240,170,' + (0.25 + 0.2 * pulso).toFixed(2) + ')'; ctx.fillRect(px - 8, py - 8, 16, 16); ctx.fillStyle = '#f4efe0'; ctx.fillRect(px - 2, py - 10, 4, 12); ctx.fillStyle = '#d94b4b'; ctx.fillRect(px - 2, py - 10, 4, 3); ctx.restore();
      });
    },
    // Panel «⚓»: rutas y faros disponibles AQUÍ + parar el rumbo. `orden(o)` envía la orden; `say(txt)` muestra un aviso.
    panel(est, j, orden, say) {
      const n = N();
      const op = n && j && n.navegando(j) ? n.opciones(est, j) : null, R = j && j.nav && j.nav.rumbo, s = !op ? '' : R ? 'R' : JSON.stringify(op);
      if (s === sig) return; if (!panelEl) { if (!op) return; { panelEl = document.createElement('div'); panelEl.id = 'navpanel'; panelEl.style.cssText = 'position:absolute;right:10px;top:56px;z-index:4;display:none;width:190px;font:700 12px/1.3 inherit;color:#fff9ee;background:rgba(42,27,48,.86);border:2px solid #7a5a60;border-radius:4px;padding:5px 6px'; const st = document.getElementById('stage'); if (st && st.appendChild) st.appendChild(panelEl); } }
      sig = s; panelEl.innerHTML = '';
      if (!op || (!R && !op.rutas.length && !op.faros.length)) { panelEl.style.display = 'none'; return; }
      const btn = (txt, o) => { const b = document.createElement('button'); b.textContent = txt; b.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:3px 0;padding:6px 7px;font:inherit;font-size:12px;line-height:1.25;white-space:normal;text-align:left;color:#2a1b30;background:#fff1b8;border:2px solid #7a5a60;border-radius:3px'; b.addEventListener('click', () => { const r = orden(o); if (r === null || r === false) say('No se puede ahora'); sig = ''; }); panelEl.appendChild(b); };
      if (R) btn('Parar rumbo', { t: 'nav.parar' }); else { op.rutas.forEach((r) => btn('Rumbo: ' + r.nombre + ' · ~' + r.seg + '-' + r.segMax + ' s', { t: 'nav.rumbo', ruta: r.ruta, hacia: r.hacia })); op.faros.forEach((f) => btn('Faro: ' + f.nombre, { t: 'nav.faro', destino: f.id })); }
      panelEl.style.display = 'block';
    },
    ocultarPanel() { if (panelEl) { panelEl.style.display = 'none'; sig = ''; } },
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = ui;
})(typeof window !== 'undefined' ? window : globalThis);
