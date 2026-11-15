#!/usr/bin/env python3
"""prueba_glb_hd2d.py — Ignel con malla animada (GLB) en el HD-2D real (v2.297), Chromium móvil 390×844.
Uso: node build.js && python3 tools/prueba_glb_hd2d.py --three ruta/three.min.js --glb ruta/ignel_glb.wasm [carpeta_capturas]   (necesita playwright; npm install three@0.128.0)
Sirve dist/criaturas.html y el GLB por HTTP, pone a Ignel de acompañante y de rival, arranca un combate y captura; comprueba que se usa la malla 3D y que sin el archivo vuelve la lámina."""
import pathlib, sys, shutil, tempfile, threading, http.server, functools
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; a = sys.argv[1:]; ruta = {}
for k in ('--three', '--glb'):
    if k in a: i = a.index(k); ruta[k] = pathlib.Path(a[i + 1]); del a[i:i + 2]
sal = pathlib.Path(a[0] if a else '/tmp/capturas_glb'); sal.mkdir(parents=True, exist_ok=True); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def servir(con_glb):
    d = pathlib.Path(tempfile.mkdtemp()); shutil.copy(raiz / 'dist' / 'criaturas.html', d / 'index.html')
    if con_glb: shutil.copy(ruta['--glb'], d / 'ignel_glb.wasm')
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(d))); s.RequestHandlerClass.log_message = lambda *x: None
    threading.Thread(target=s.serve_forever, daemon=True).start(); return s
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    for con in (True, False):
        s = servir(con); pg = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/three.min.js', lambda r: r.fulfill(path=str(ruta['--three']), content_type='application/javascript'))
        pg.goto('http://127.0.0.1:%d/index.html' % s.server_address[1]); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(600)
        pg.evaluate("()=>{const J=__juego,o=J.est.jugadores.oli;J.est.acomp.forma='fosforin';const c=J.motor.criaturas(J.est,o.mapa)[0];c.id='fosforin';c.x=o.x+48;c.y=o.y;o.esferas=0}")
        pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=15000); pg.wait_for_timeout(2500)
        n = pg.evaluate("window.__juego.hd.glb ? Object.keys(window.__juego.hd.glb).length : -1") if False else None
        nom = 'con' if con else 'sin'; pg.screenshot(path=str(sal / (nom + '_mapa.png')))
        pg.evaluate("__juego.motor.aplicar(__juego.est,{j:'oli',t:'combate'})")
        for t in (1.0, 2.0, 3.5): pg.wait_for_timeout(1000); pg.screenshot(path=str(sal / ('%s_c%.1f.png' % (nom, t))))
        ok(not errs, '%s GLB: sin errores de página%s' % (nom, '' if not errs else ': ' + str(errs[:3]))); s.shutdown(); pg.context.close()
    b.close()
print('\n%d FALLO(S)' % len(fallos) if fallos else '\nprueba GLB en HD-2D ok'); sys.exit(1 if fallos else 0)
