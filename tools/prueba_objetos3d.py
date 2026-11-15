#!/usr/bin/env python3
"""Prueba de navegador de los objetos 3D de decoración (v2.246; src/objeto3d.js) con el Three.js FALSO de tools/three_falso.js: comprueba la LÓGICA (que el pintor cree una malla por ejemplar y no falle);
con --three ruta/three.min.js (r128 real) y una carpeta de capturas se ve el aspecto. Uso: node build.js && python3 tools/prueba_objetos3d.py [--three ruta] [carpeta_capturas]"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; args = sys.argv[1:]; real = None
if '--three' in args: i = args.index('--three'); real = pathlib.Path(args[i + 1]); del args[i:i + 2]
sal = pathlib.Path(args[0]) if args else None
if sal: sal.mkdir(parents=True, exist_ok=True)
falso = (raiz / 'tools' / 'three_falso.js').read_text(encoding='utf8'); fallos = []
mapa = json.loads((raiz / 'maps' / 'albanota.json').read_text(encoding='utf8')); rocas = [o for o in mapa['objetos'] if o['tipo'] == 'roca']
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    if real: pg.route('**/three.min.js', lambda r: r.fulfill(path=str(real), content_type='application/javascript'))
    else: pg.route('**/three.min.js', lambda r: r.fulfill(body=falso, content_type='application/javascript'))
    pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    r0 = rocas[0]; pg.evaluate("([x,y])=>{const J=__juego,j=J.est.jugadores[Object.keys(J.est.jugadores)[0]];j.x=x*16+8;j.y=(y+3)*16;}", [r0['x'], r0['y']])
    pg.evaluate('__juego.irAHD()'); pg.wait_for_function('G.hd2d.activo === true', timeout=15000); pg.wait_for_timeout(1200)
    st = pg.evaluate("G.hd2d.estado().st")
    ok((st.get('modelos') or 0) == len(rocas), 'el pintor creó una malla 3D por cada roca del mapa (%s de %d)' % (st.get('modelos'), len(rocas)))
    ok(not st.get('modeloFallos') and (st.get('triangulosModelos') or 0) > 0, 'ninguna roca cayó a lámina por un fallo (%s triángulos en total)' % st.get('triangulosModelos'))
    ok(not errs, 'sin errores de consola ' + (str(errs[:2]) if errs else ''))
    if sal: pg.screenshot(path=str(sal / 'objetos3d_roca.png'))
    b.close()
print('\nTODO BIEN' if not fallos else '\n%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
