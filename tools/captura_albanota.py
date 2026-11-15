#!/usr/bin/env python3
"""ID-3c: capturas de Albanota dentro del juego real (Chromium móvil 390x844, ?mapa=albanota). Centra la cámara en una casilla y guarda un PNG por vista.
Uso: python3 tools/captura_albanota.py [--criaturas] nombre=x,y [nombre=x,y ...]   (por defecto: plaza, barrio, huerto, puente en docs/albanota_v256_<nombre>_390x844.png; con --v=v255 cambia el prefijo de versión)
Sin --criaturas se ocultan las criaturas de prueba (AJUSTES.VISIBLES = false) para ver solo el mapa. No cambia archivos del juego."""
import sys, os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
ver = next((a[4:] for a in sys.argv[1:] if a.startswith('--v=')), 'v256')
vistas = [(a.split('=')[0], [int(v) for v in a.split('=')[1].split(',')]) for a in args] or [('plaza', [24, 18]), ('barrio', [8, 15]), ('huerto', [36, 23]), ('puente', [24, 30])]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); err = []
    pg.on('pageerror', lambda e: err.append(str(e))); pg.on('console', lambda m: err.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?mapa=albanota'); pg.wait_for_timeout(400)
    if '--criaturas' not in sys.argv: pg.evaluate("G.aparicion.AJUSTES.VISIBLES = false")
    pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    for nombre, (x, y) in vistas:
        pg.evaluate("([x, y]) => { const J = window.__juego; J.S.x = x * 16 + 8; J.S.y = y * 16 + 8; J.S.dir = 'down'; J.follow(0, true); }", [x, y]); pg.wait_for_timeout(350)
        ruta = os.path.join(raiz, 'docs', 'albanota_%s_%s_390x844.png' % (ver, nombre)); pg.screenshot(path=ruta); print(ruta)
    print('errores de consola:', err or 'ninguno')
    b.close()
