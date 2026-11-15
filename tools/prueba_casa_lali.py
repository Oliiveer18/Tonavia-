#!/usr/bin/env python3
"""prueba_casa_lali.py — Chromium móvil: entrar a la Casa de Lali (v2.158, ID-5g-3) andando, música, recorrido hasta el cama y mesa, salir y volver a entrar.
Uso: node build.js && python3 tools/prueba_casa_lali.py [carpeta_capturas]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_casa_lali'); sal.mkdir(parents=True, exist_ok=True)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html'); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
J = "__juego.est.jugadores.oli"
def anda(pg, tecla, ms):
    pg.evaluate("__juego.keys.%s = 1" % tecla); pg.wait_for_timeout(ms); pg.evaluate("__juego.keys.%s = 0" % tecla); pg.wait_for_timeout(150)
pos = lambda pg: pg.evaluate("[Math.floor(%s.x / 16), Math.floor(%s.y / 16), %s.mapa]" % (J, J, J))
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    pg.evaluate("(() => { const j = %s; j.x = 13 * 16 + 8; j.y = 16 * 16 + 8; })()" % J); pg.wait_for_timeout(200)
    anda(pg, 'up', 700); pg.wait_for_timeout(300)
    ok(pos(pg)[2] == 'casa_de_lali', '(1) andando hacia el hueco de la casa rosa se entra en su interior')
    ok(pos(pg)[:2] == [4, 5], '(2) se aparece en la columna central, delante de la puerta %s' % pos(pg)); pg.screenshot(path=str(sal / 'casa_lali_1_entrada.png'))
    anda(pg, 'up', 1500); pg.screenshot(path=str(sal / 'casa_lali_2_fondo.png')); q = pos(pg)
    ok(q[0] == 4 and q[1] == 2, '(3) por el eje se llega al fondo de la sala %s' % q)
    pg.evaluate("(() => { const j = %s; j.x = 4 * 16 + 8; j.y = 3 * 16 + 8; })()" % J); anda(pg, 'left', 1500); q = pos(pg)
    ok(q[1] == 3 and q[0] in (1, 2), '(4) por la fila 3 se llega junto al estante %s' % q)
    pg.evaluate("(() => { const j = %s; j.x = 4 * 16 + 8; j.y = 4 * 16 + 8; })()" % J); anda(pg, 'right', 1800); q = pos(pg)
    ok(q[1] == 4 and q[0] == 7, '(5) por la fila 4 se llega a la derecha, junto a la cama y la planta %s' % q)
    pg.evaluate("(() => { const j = %s; j.x = 4 * 16 + 8; j.y = 5 * 16 + 8; })()" % J); anda(pg, 'down', 350); pg.wait_for_timeout(300)
    ok(pos(pg)[2] == 'albanota' and pos(pg)[0] == 13 and pos(pg)[1] in (15, 16), '(6) la salida devuelve a Albanota delante de la puerta %s' % pos(pg))
    anda(pg, 'up', 700); ok(pos(pg)[2] == 'casa_de_lali', '(7) se puede volver a entrar')
    ok(not errs, '(8) sin errores de consola: %s' % errs)
    b.close()
print('TODO BIEN' if not fallos else '%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
