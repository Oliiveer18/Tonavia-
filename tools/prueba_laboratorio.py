#!/usr/bin/env python3
"""prueba_laboratorio.py — Chromium móvil: entrar a la Laboratorio (v2.147, ID-5f) andando, música, recorrido hasta el incubadora central y mesa, salir y volver a entrar.
Uso: node build.js && python3 tools/prueba_laboratorio.py [carpeta_capturas]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_laboratorio'); sal.mkdir(parents=True, exist_ok=True)
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
    pg.evaluate("(() => { const j = %s; j.x = 14 * 16 + 8; j.y = 28 * 16 + 8; })()" % J); pg.wait_for_timeout(200)
    anda(pg, 'up', 700); pg.wait_for_timeout(300)
    ok(pos(pg)[2] == 'laboratorio', '(1) andando hacia el hueco del Laboratorio se entra en el interior')
    pg.wait_for_timeout(1500); ok(pg.evaluate('G.audio.tema') == 'laboratorio', '(2) suena el tema del Laboratorio')
    ok(pos(pg)[:2] == [6, 7], '(3) se aparece en la columna central, delante de la puerta %s' % pos(pg)); pg.screenshot(path=str(sal / 'lab_1_entrada.png'))
    anda(pg, 'up', 500); pg.screenshot(path=str(sal / 'lab_2_incubadora.png')); q = pos(pg)
    ok(q[0] == 6 and q[1] == 5, '(4) por el eje se llega al frente de la incubadora central %s' % q)
    pg.evaluate("(() => { const j = %s; j.x = 3 * 16 + 8; j.y = 5 * 16 + 8; })()" % J); anda(pg, 'left', 500); pg.screenshot(path=str(sal / 'lab_3_mesa.png')); q = pos(pg)
    ok(q[1] == 5 and q[0] in (1, 2), '(5) por el pasillo izquierdo se llega junto a la mesa de estudio %s' % q)
    pg.evaluate("(() => { const j = %s; j.x = 6 * 16 + 8; j.y = 7 * 16 + 8; })()" % J); anda(pg, 'down', 350); pg.wait_for_timeout(300)
    ok(pos(pg)[2] == 'albanota' and pos(pg)[0] == 14 and pos(pg)[1] in (27, 28), '(6) la salida devuelve a Albanota delante de la puerta %s' % pos(pg))
    anda(pg, 'up', 700); ok(pos(pg)[2] == 'laboratorio', '(7) se puede volver a entrar')
    ok(not errs, '(8) sin errores de consola: %s' % errs)
    b.close()
print('TODO BIEN' if not fallos else '%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
