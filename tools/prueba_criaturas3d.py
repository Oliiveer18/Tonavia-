#!/usr/bin/env python3
"""Prueba de navegador de las criaturas 3D (Nimbel, Arenel; v2.229) con el Three.js FALSO de tools/three_falso.js: prueba la LÓGICA del pintor (que cree la malla, anime y no se desactive solo),
NO que el 3D se vea bien (para eso: --three ruta/three.min.js, Three.js r128 real, y capturas). Uso: node build.js && python3 tools/prueba_criaturas3d.py [--three ruta] [carpeta_capturas]"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; args = sys.argv[1:]; real = None
if '--three' in args: i = args.index('--three'); real = pathlib.Path(args[i + 1]); del args[i:i + 2]
sal = pathlib.Path(args[0]) if args else None
if sal: sal.mkdir(parents=True, exist_ok=True)
falso = (raiz / 'tools' / 'three_falso.js').read_text(encoding='utf8'); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for cid in ('nubecin', 'arenel', 'somnin'):
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        if real: pg.route('**/three.min.js', lambda r: r.fulfill(path=str(real), content_type='application/javascript'))
        else: pg.route('**/three.min.js', lambda r: r.fulfill(body=falso, content_type='application/javascript'))
        pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
        # se coloca una criatura de ese tipo justo delante de Oli (la primera de la lista cambia de id)
        pg.evaluate("""(cid) => { const J = __juego, c = J.creatures[0], j = J.est.jugadores[Object.keys(J.est.jugadores)[0]]; c.id = cid; c.x = j.x + 24; c.y = j.y + 6; c.hx = c.x; c.hy = c.y; c.dir = 'down'; }""", cid)
        pg.evaluate('__juego.irAHD()'); pg.wait_for_function('G.hd2d.activo === true', timeout=15000); pg.wait_for_timeout(900)
        r = pg.evaluate("({ aj: G.hd2d.AJUSTES.CRIATURAS3D, p3: G.hd2d.estado().st.personaje3d })")
        ok(r['aj'] is True, cid + ': el interruptor CRIATURAS3D sigue encendido (el pintor no se desactivó por un fallo)')
        ok(bool(r['p3']) and ('c_' + cid) in r['p3'] and 400 <= r['p3']['c_' + cid] <= 1200, cid + ': el pintor creó su malla 3D (' + str((r['p3'] or {}).get('c_' + cid)) + ' triángulos)')
        pg.wait_for_timeout(1200); r2 = pg.evaluate("G.hd2d.AJUSTES.CRIATURAS3D"); ok(r2 is True and not errs, cid + ': sigue 3D tras animarse y sin errores de consola ' + (str(errs[:2]) if errs else ''))
        pg.evaluate("G.hd2d.AJUSTES.CRIATURAS3D = false"); pg.wait_for_timeout(600); r3 = pg.evaluate("G.hd2d.estado().st.personaje3d"); ok(not r3 or ('c_' + cid) not in r3, cid + ': apagando el interruptor vuelve la lámina 2D')
        if sal: pg.screenshot(path=str(sal / ('criatura3d_' + cid + '.png')))
        ctx.close()
    b.close()
print('\nTODO BIEN' if not fallos else '\n%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
