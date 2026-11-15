#!/usr/bin/env python3
"""Captura el juego REAL (dist/criaturas.html, sombras proyectadas ya dentro del juego, v2.100) en las 6 vistas de la demo.
Salida: tools/demo_sombras/out_real/{vista}_real_{con,sin}.png  (con = por defecto; sin = ?sombrasp=0, idéntico al juego de antes).
Uso: python3 tools/demo_sombras/captura_real.py [vista…]"""
import sys, pathlib, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import demo
def abrir(b, extra):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(demo.URL + extra); pg.wait_for_function('window.__juego'); pg.add_style_tag(content=demo.CSS); pg.click('[data-pick=oli]'); pg.wait_for_timeout(400)
    return ctx, pg, errs
if __name__ == '__main__':
    vistas = [a for a in sys.argv[1:] if a in demo.VISTAS] or list(demo.VISTAS); sal = demo.AQUI / 'out_real'; sal.mkdir(exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for nombre, extra in (('sin', '&sombrasp=0'), ('con', '')):
            ctx, pg, errs = abrir(b, extra)
            for v in vistas:
                pg.evaluate(demo.stage_js(), demo.VISTAS[v]); pg.wait_for_timeout(1500); pg.locator('#stage').screenshot(path=str(sal / ('%s_real_%s.png' % (v, nombre)))); print(v, nombre)
            print(nombre, 'errores de consola:', errs or 'ninguno'); ctx.close()
        b.close()
