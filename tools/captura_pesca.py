#!/usr/bin/env python3
"""captura_pesca.py — capturas a 390×844 (×2) de la pesca: Oli y Lali, 2D y HD-2D (Three.js real de cdnjs), con la fase congelada.
Uso: node build.js && python3 tools/captura_pesca.py carpeta_salida [fase ...]   (fases: espera pique salto; por defecto espera pique)"""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]); sal.mkdir(parents=True, exist_ok=True); fases = sys.argv[2:] or ['espera', 'pique']
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html')
EXTRA = {'espera': "{espera: 99, tirones: []}", 'pique': "{ventana: 99}", 'salto': "{}"}
T0 = {'espera': 1, 'pique': 0.5, 'salto': 0.6}
with sync_playwright() as p:
    b = p.chromium.launch()
    for quien in ('oli', 'lali'):
        for modo in ('2d', 'hd'):
            ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page()
            pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=%s]' % quien); pg.wait_for_timeout(300)
            pg.evaluate("(() => { const j = __juego.est.jugadores.%s; j.x = 8 * 16 + 8; j.y = 28 * 16 + 14; })()" % quien); pg.wait_for_timeout(400)
            if modo == 'hd':
                pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=30000); pg.wait_for_timeout(1500)
            pg.evaluate("document.querySelector('[data-pesca]').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true}))"); pg.wait_for_timeout(200)
            pg.evaluate("__juego.motor.pescando = () => {}")
            for f in fases:
                pg.evaluate("__juego.est.jugadores.%s.pesca = Object.assign({id: 'orilla_norte_1', fase: '%s', t: %s}, %s)" % (quien, f, T0[f], EXTRA[f])); pg.wait_for_timeout(700)
                pg.screenshot(path=str(sal / ('%s_%s_%s.png' % (quien, modo, f))), clip={'x': 20, 'y': 250, 'width': 350, 'height': 420})
            ctx.close()
    b.close()
print('capturas en', sal)
