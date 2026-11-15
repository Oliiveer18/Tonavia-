#!/usr/bin/env python3
"""ID-1d: dos imágenes de prueba 390x844 (zoom 2 = 12x26 casillas) con las medidas del PLANO de Albanota.
Uso: python3 tools/escena_albanota2.py   (necesita dist/criaturas.html y playwright). No cambia el juego.
A = plaza con sus 4 entradas, avenidas y puente. B = barrio (Casa de Lali y de Oli), avenida oeste y camino del laboratorio."""
import sys, os, base64
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
leer = lambda n: open(os.path.join(raiz, 'tools', n), encoding='utf-8').read()
VISTAS = [('A_plaza', 295, 154, "[['lali','down',0,380,338],['oli','down',0,404,338]]"),
          ('B_barrio', 24, 100, "[['lali','down',0,72,296],['oli','down',0,96,300]]")]
with sync_playwright() as p:
    b = p.chromium.launch()
    errores = []
    for nombre, x0, y0, pers in VISTAS:
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        pg.on('pageerror', lambda e: errores.append(str(e)))
        pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' else None)
        pg.goto('file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?mapa=pueblo_inicial')
        pg.wait_for_timeout(400)
        for f in ['escena_albanota2.js', 'escena_albanota_piezas.js', 'escena_albanota2_objetos.js']:
            pg.evaluate(leer(f))
        pg.evaluate("(%s).forEach(a => window.__persona(...a))" % pers)
        url = pg.evaluate("window.__vista(%d,%d,2)" % (x0, y0))
        open(os.path.join(raiz, 'docs', 'albanota_v232_%s_390x844.png' % nombre), 'wb').write(base64.b64decode(url.split(',')[1]))
        pg.close()
    b.close()
if errores:
    print('ERRORES:', errores[:5]); sys.exit(1)
print('OK')
