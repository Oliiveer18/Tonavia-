#!/usr/bin/env python3
"""v2.44: mapa de calor del agua. Para cada casilla de agua del mapa dice cuántos píxeles de ola se pintan en 800 cuadros.
Una casilla con muy pocos (mucho menos que la mediana) es una parte del agua sin movimiento (así se vio la parte vertical del lago en la v2.42).
Uso: python3 tools/cobertura_agua.py [dist/criaturas.html]   (necesita playwright; el mismo control, sin navegador, está en el grupo 30 de test.js)"""
import sys, os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = next((a for a in sys.argv[1:] if a.endswith('.html')), os.path.join(raiz, 'dist', 'criaturas.html'))
JS = """() => {
  const J = window.__juego; let M = typeof J.mapa === 'function' ? J.mapa() : J.mapa; const T = 16, suelo = M.suelo, cnt = {};
  for (let n = 0; n < 800; n++) G.capas.olas.pixeles(suelo, n, 0, M.W * T, 0, M.H * T).forEach(([X, Y]) => { if (!G.capas.olas.visible(suelo, X, Y)) return; const k = Math.floor(Y / T) + ',' + Math.floor(X / T); cnt[k] = (cnt[k] || 0) + 1; });
  const out = [], v = [];
  for (let ty = 0; ty < M.H; ty++) for (let tx = 0; tx < M.W; tx++) if (suelo[ty][tx] === '~') { const c = cnt[ty + ',' + tx] || 0; v.push(c); out.push([ty, tx, c]); }
  v.sort((a, b) => a - b); const med = v[Math.floor(v.length / 2)];
  return { med, flojas: out.filter((q) => q[2] < Math.max(1, med * 0.4)), total: out.length };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.goto('file://' + os.path.abspath(html)); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    r = pg.evaluate(JS); b.close()
print('casillas de agua:', r['total'], '· mediana de píxeles en 800 cuadros:', r['med'])
print('CASILLAS CON POCAS OLAS:', r['flojas'] if r['flojas'] else 'ninguna')
sys.exit(1 if r['flojas'] else 0)
