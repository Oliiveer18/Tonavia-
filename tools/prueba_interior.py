#!/usr/bin/env python3
"""prueba_interior.py — Chromium móvil: entrar y salir del interior del Centro PC (v2.137, ID-5a) andando, música del interior y HD-2D dentro (con tools/three_falso.js).
Uso: node build.js && python3 tools/prueba_interior.py [carpeta_capturas]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('/tmp/capturas_interior'); sal.mkdir(parents=True, exist_ok=True)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html'); falso = (raiz / 'tools' / 'three_falso.js').read_text(encoding='utf8'); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
J = "__juego.est.jugadores.oli"
def anda(pg, tecla, ms):
    pg.evaluate("__juego.keys.%s = 1" % tecla); pg.wait_for_timeout(ms); pg.evaluate("__juego.keys.%s = 0" % tecla); pg.wait_for_timeout(150)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(body=falso, content_type='application/javascript'))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    pg.evaluate("(() => { const j = %s; j.x = 26 * 16 + 8; j.y = 11 * 16 + 8; })()" % J); pg.wait_for_timeout(200)
    anda(pg, 'up', 700); pg.wait_for_timeout(300)
    ok(pg.evaluate(J + ".mapa") == 'centro_pc', '(1) andando hacia el hueco del Centro PC se entra en el interior')
    pg.wait_for_timeout(1500); ok(pg.evaluate('G.audio.tema') == 'centro_pc', '(2) suena el tema del interior')
    pg.screenshot(path=str(sal / 'interior_1_entrada.png'))
    ok(pg.evaluate("[Math.floor(%s.x / 16), Math.floor(%s.y / 16)]" % (J, J)) == [6, 8], '(2b) se aparece en la columna central, delante de la puerta')
    anda(pg, 'up', 2500); ok(pg.evaluate("[Math.floor(%s.x / 16), Math.floor(%s.y / 16)]" % (J, J)) == [6, 5], '(2c) caminando recto por el eje se llega al frente del mostrador y no se atraviesa'); pg.screenshot(path=str(sal / 'interior_2_mostrador.png'))
    anda(pg, 'left', 1800); ok(pg.evaluate("Math.floor(%s.x / 16)" % J) == 2 and pg.evaluate("Math.floor(%s.y / 16)" % J) == 5, '(2d) por el pasillo se llega al terminal izquierdo (columna 2, fila 5) sin atravesar nada'); pg.screenshot(path=str(sal / 'interior_3_terminal.png'))
    pg.evaluate("(() => { const j = %s; j.x = 6 * 16 + 8; j.y = 8 * 16 + 8; })()" % J); pg.wait_for_timeout(150)
    pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=8000); pg.wait_for_timeout(500); pg.screenshot(path=str(sal / 'interior_4_hd2d.png'))
    ok(pg.evaluate(J + ".mapa") == 'centro_pc' and pg.evaluate('__juego.hd'), '(3) el HD-2D arranca dentro del interior sin salir de él')
    pg.click('#hbtn'); pg.wait_for_timeout(400)
    anda(pg, 'down', 900); pg.wait_for_timeout(300)
    ok(pg.evaluate(J + ".mapa") == 'albanota' and pg.evaluate("Math.floor(%s.y / 16)" % J) >= 10, '(4) andando hacia la puerta de abajo se vuelve a la calle, delante del Centro PC')
    pg.evaluate("(() => { const j = %s; j.x = 26 * 16 + 8; j.y = 11 * 16 + 8; })()" % J); pg.wait_for_timeout(200); anda(pg, 'up', 700); ok(pg.evaluate(J + ".mapa") == 'centro_pc', '(5) se puede volver a entrar')
    ok(not errs, '(6) sin errores de consola: ' + str(errs)); b.close()
print('TODO BIEN' if not fallos else '%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
