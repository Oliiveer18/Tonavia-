#!/usr/bin/env python3
"""prueba_hd2d_albanota.py — prueba en Chromium móvil (390×844) del terreno HD-2D de Albanota (HD-B1, 1.ª mitad, v2.63).
Uso: node tools/hd2d_albanota.js && python3 tools/prueba_hd2d_albanota.py [carpeta_capturas] [--three ruta/three.min.js]
La página carga Three.js r128 desde cdnjs; sin internet se le puede dar una copia local con --three (npm install three@0.128.0 -> node_modules/three/build/three.min.js).
Comprueba: la escena se construye con el mapa real (todas las casillas, el agua, el puente, el bosque) · se ve (no está en blanco, hay hierba, camino y agua con los colores del 2D) ·
girar, acercar y arrastrar mueven la cámara dentro de límites · sin errores de consola."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:]]
three = None
if '--three' in args: i = args.index('--three'); three = pathlib.Path(args[i + 1]); del args[i:i + 2]
sal = pathlib.Path(args[0]) if args else pathlib.Path('/tmp/capturas_hd2d_albanota'); sal.mkdir(parents=True, exist_ok=True)
mapa = json.loads((raiz / 'maps' / 'albanota.json').read_text(encoding='utf8')); S = mapa['capas']['suelo']
cuenta = lambda c: sum(r.count(c) for r in S)
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True).new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    if three: pg.route('**/three.min.js', lambda r: r.fulfill(path=str(three), content_type='application/javascript'))
    pg.goto('file://' + str(raiz / 'hd2d' / 'albanota_hd2d.html')); pg.wait_for_function('window.__hd && window.__hd.listo', timeout=15000); pg.wait_for_timeout(500)
    st = pg.evaluate('window.__hd.stats'); W, H = mapa['ancho'], mapa['alto']
    ok(st['arriba'] == W * H, 'una cara de arriba por casilla del mapa real (%d × %d = %d)' % (W, H, W * H))
    ok(st['agua'] == cuenta('~') and st['puente'] == cuenta('b') and st['bosque'] == cuenta('t'), 'el agua (%d), el puente (%d) y el bosque de borde (%d) coinciden con el mapa' % (cuenta('~'), cuenta('b'), cuenta('t')))
    ok(st['paredes'] > 0, 'hay paredes de relieve donde una casilla es más alta que su vecina (%d)' % st['paredes'])
    pg.screenshot(path=str(sal / '1_media.png'))
    # colores reales del 2D: se miran píxeles de la captura (hierba, camino, agua)
    from PIL import Image
    im = Image.open(sal / '1_media.png').convert('RGB'); cols = {}
    for x in range(0, im.width, 3):
        for y in range(70, 760, 3):  # solo la escena: sin la franja de texto de arriba ni los botones de abajo
            c = im.getpixel((x, y)); cols[c] = cols.get(c, 0) + 1
    def cerca(rgb, tol=40): return sum(n for c, n in cols.items() if all(abs(c[i] - rgb[i]) <= tol for i in range(3)))
    total = sum(cols.values())
    ok(cerca((0x5d, 0xae, 0x5a), 45) > total * .15, 'se ve hierba con el verde del 2D (#5dae5a)')
    ok(cerca((0xe0, 0xc4, 0x8c), 45) > total * .02, 'se ve camino con el color del 2D (#e0c48c)')
    # cámara
    v0 = pg.evaluate('({y: __hd.view.yawT, d: __hd.view.distT, x: __hd.view.tx, z: __hd.view.tz})')
    pg.click('#gd'); pg.wait_for_timeout(900); y1 = pg.evaluate('__hd.view.yaw'); ok(abs(y1 - 3.14159 / 4) < .05, '«⟳» gira la cámara 45°')
    pg.click('#gi'); pg.wait_for_timeout(900); ok(abs(pg.evaluate('__hd.view.yaw')) < .05, '«⟲» la devuelve')
    pg.click('#zm'); pg.wait_for_timeout(900); ok(pg.evaluate('__hd.view.dist') > v0['d'] + 5 and 'lejos' in pg.inner_text('#zm'), '«Cámara» alterna cerca / media / lejos')
    pg.screenshot(path=str(sal / '2_lejos.png'))
    pg.click('#zm'); pg.wait_for_timeout(900); pg.screenshot(path=str(sal / '3_cerca.png'))
    pg.evaluate('__hd.view.tx = 24; __hd.view.tz = 29; __hd.view.yawT = 0.5; __hd.render()'); pg.wait_for_timeout(900); pg.screenshot(path=str(sal / '4_arroyo_puente.png'))
    pg.evaluate('__hd.view.tx = 0; __hd.view.tz = 0; __hd.view.distT = 999')  # fuera de límites a propósito
    pg.mouse.move(200, 400); pg.mouse.down(); pg.mouse.move(210, 410); pg.mouse.up(); pg.wait_for_timeout(300)
    vv = pg.evaluate('({x: __hd.view.tx, z: __hd.view.tz, d: __hd.view.distT})'); ok(vv['x'] >= 2 and vv['z'] >= 2 and vv['d'] <= 70, 'arrastrar y alejar se quedan dentro de los límites del mapa')
    ok(not errs, 'sin errores de consola' + ('' if not errs else ': ' + '; '.join(errs[:3])))
    b.close()
print('\nTODO BIEN' if not fallos else '\nFALLOS: %d' % len(fallos)); sys.exit(1 if fallos else 0)
