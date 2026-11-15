#!/usr/bin/env python3
"""ID-2a: captura del juego en Chromium móvil 390x844 desde 6 puntos del mapa, con y sin sombreado, y dice el MD5 de cada una.
Uso: python3 tools/captura_igual.py [html] [--guardar carpeta]   Se comparan dos versiones ejecutándolo con cada html (sin criaturas, para quitar el azar)."""
import sys, os, hashlib
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:]]
guardar = args[args.index('--guardar') + 1] if '--guardar' in args else None
html = next((a for a in args if a.endswith('.html')), os.path.join(raiz, 'dist', 'criaturas.html'))
PUNTOS = [(18, 13), (5, 3), (30, 6), (30, 21), (6, 21), (18, 23)]
res = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); err = []
    pg.on('pageerror', lambda e: err.append(str(e))); pg.on('console', lambda m: err.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.path.abspath(html) + '?mapa=pueblo_inicial'); pg.wait_for_timeout(400)
    pg.evaluate("G.aparicion.AJUSTES.VISIBLES = false"); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    for sombras in (True, False):
        pg.evaluate("(s) => { if (G.SOMBREADO.ACTIVO !== s) document.getElementById('sbtn').click(); }", sombras)
        for i, (tx, ty) in enumerate(PUNTOS):
            pg.evaluate("([x, y]) => { const J = window.__juego; J.S.x = x * 16 + 8; J.S.y = y * 16 + 8; J.follow(0, true); }", [tx, ty])
            pg.wait_for_timeout(120)
            png = pg.locator('#game').screenshot()
            if guardar: os.makedirs(guardar, exist_ok=True); open(os.path.join(guardar, '%s_%d.png' % ('s' if sombras else 'n', i)), 'wb').write(png)
            res.append(hashlib.md5(png).hexdigest()[:10])
    b.close()
print(' '.join(res)); print('ERRORES' if err else 'sin errores de consola', err[:3])
