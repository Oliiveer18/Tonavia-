#!/usr/bin/env python3
"""prueba_pesca.py — Chromium móvil 390×844: puntos de pesca de Albanota (v2.180, Pesca 1): marcador, botón 🎣, pescar, moverse cancela, el ✨ vuelve.
Uso: node build.js && python3 tools/prueba_pesca.py [carpeta_capturas]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_pesca'); sal.mkdir(parents=True, exist_ok=True)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html'); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
J = "__juego.est.jugadores.oli"
def ir(pg, x, y): pg.evaluate("(() => { const j = %s; j.x = %d * 16 + 8; j.y = %d * 16 + 14; j.pesca = null; })()" % (J, x, y)); pg.wait_for_timeout(350)
vis = lambda pg, s: pg.evaluate("(() => { const b = document.querySelector('%s'); return !!b && !b.hidden && b.offsetParent !== null; })()" % s)
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    ok(pg.evaluate("__juego.mapa.id") == 'albanota' and not vis(pg, '[data-pesca]') and vis(pg, '[data-evo]'), '(1) al empezar no hay botón de pesca y se ve el ✨')
    ir(pg, 8, 27); pg.wait_for_timeout(100)
    ok(not vis(pg, '[data-pesca]'), '(2) a una casilla de la orilla todavía no hay botón')
    ir(pg, 8, 28); ok(vis(pg, '[data-pesca]') and not vis(pg, '[data-evo]'), '(3) en el punto aparece el 🎣 y el ✨ se esconde')
    pg.screenshot(path=str(sal / 'pesca_1_orilla_norte.png'))
    pg.click('[data-pesca]'); pg.wait_for_timeout(250)
    ok(pg.evaluate(J + ".pesca && " + J + ".pesca.id") == 'orilla_norte_1' and pg.evaluate(J + ".dir") == 'down', '(4) tocar 🎣 pone a pescar mirando al agua')
    ok(pg.evaluate(J + ".pesca.fase") in ('lanzar', 'espera'), '(5) al pescar empieza el lanzamiento y la espera')
    pg.screenshot(path=str(sal / 'pesca_2_pescando.png'))
    pg.evaluate("__juego.keys.left = 1"); pg.wait_for_timeout(300); pg.evaluate("__juego.keys.left = 0"); pg.wait_for_timeout(300)
    ok(not pg.evaluate(J + ".pesca") and not vis(pg, '[data-pesca]') and vis(pg, '[data-evo]'), '(6) caminar deja de pescar y vuelve el ✨')
    ir(pg, 23, 30); ok(vis(pg, '[data-pesca]'), '(7) en el puente (oeste) hay punto de pesca'); pg.click('[data-pesca]'); pg.wait_for_timeout(200)
    ok(pg.evaluate(J + ".dir") == 'left', '(8) en el puente mira al agua del oeste'); pg.screenshot(path=str(sal / 'pesca_3_puente.png'))
    pg.click('[data-pesca]'); pg.wait_for_timeout(200); ok(pg.evaluate(J + ".pesca.fase") == 'fallo', '(9) tirar antes del pique: se escapa (tiraste muy pronto)')
    ir(pg, 20, 28); pg.screenshot(path=str(sal / 'pesca_4_orilla_norte_centro.png'))
    ir(pg, 24, 24); pg.screenshot(path=str(sal / 'pesca_0_inicio_sin_marcas.png'))
    ok(not errs, '(10) sin errores en consola' + ('' if not errs else ': ' + errs[0]))
    b.close()
print('TODO BIEN' if not fallos else 'FALLOS: %d' % len(fallos)); sys.exit(1 if fallos else 0)
