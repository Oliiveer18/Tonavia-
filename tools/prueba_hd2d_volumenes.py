#!/usr/bin/env python3
"""prueba_hd2d_volumenes.py — prueba con Three.js REAL (r128) de los edificios en volumen dentro del HD-2D del juego (v2.70, paso B2b).
Uso: node build.js && python3 tools/prueba_hd2d_volumenes.py --three ruta/three.min.js [carpeta_capturas]     (necesita playwright y PIL; npm install three@0.128.0 -> node_modules/three/build/three.min.js)
Comprueba, en Chromium móvil 390×844: (1) las 3 casas salen como volumen, con su atlas (≤ 256×256), su sombra y sin fallos · (2) desde 8 ángulos la Casa de Lali se ve con tejado rojo, paredes crema y chimenea de piedra,
y la cara oeste es más clara que la este (luz fija arriba-izquierda) · (3) presupuesto: triángulos por edificio ≤ 2.000 y como máximo +12 llamadas de dibujo respecto a las láminas · (4) rendimiento básico: tiempo por cuadro con volúmenes frente a láminas ·
(5) el interruptor G.hd2d.AJUSTES.VOLUMENES vuelve a las láminas · (6) sin errores de consola. Deja capturas en la carpeta de salida (docs/hd2d_casa_lali_*.png con --docs)."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image
raiz = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]; three = None
if '--three' in args: i = args.index('--three'); three = pathlib.Path(args[i + 1]); del args[i:i + 2]
docs = '--docs' in args
if docs: args.remove('--docs')
if not three: print('falta --three ruta/three.min.js (Three.js r128 real)'); sys.exit(2)
sal = pathlib.Path(args[0]) if args else pathlib.Path('/tmp/capturas_hd2d_volumenes'); sal.mkdir(parents=True, exist_ok=True)
mapa = json.loads((raiz / 'maps' / 'albanota.json').read_text(encoding='utf8'))
casas = [o for o in mapa['objetos'] if o['tipo'] in ('casa_lali', 'casa_oli', 'laboratorio')]; lali = [o for o in casas if o['tipo'] == 'casa_lali'][0]   # v2.72: tres piezas, tres atlas
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html')
def cerca(c, rgb, tol): return all(abs(c[i] - rgb[i]) <= tol for i in range(3))
def cuenta(im, rgb, tol=26, caja=None):
    x0, y0, x1, y1 = caja or (0, 0, im.width, im.height); n = 0
    for x in range(x0, x1, 2):
        for y in range(y0, y1, 2):
            if cerca(im.getpixel((x, y)), rgb, tol): n += 1
    return n
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=1); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(path=str(three), content_type='application/javascript'))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(200)
    pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=15000); pg.wait_for_timeout(800)
    # ── 1 · escena ──
    st = pg.evaluate('G.hd2d.estado()')['st']
    ok(st['volumenes'] == 3 and st['volFallos'] == 0 and st['sombras'] == 3, 'las 3 casas (Lali, Oli y Laboratorio) están en la escena como volumen (%d), con su sombra de suelo (%d) y sin fallos (%d)' % (st['volumenes'], st['sombras'], st['volFallos']))
    at = st['atlas']; ok(len(at) == 3 and sorted(a['tipo'] for a in at) == ['casa_lali', 'casa_oli', 'laboratorio'] and all(a['w'] == 256 and a['h'] <= 256 and a['triangulos'] <= 2000 for a in at), 'cada casa tiene su atlas (%s) y como mucho %d triángulos (máximo 2.000)' % (', '.join('%s %d×%d' % (a['tipo'], a['w'], a['h']) for a in at), max(a['triangulos'] for a in at)))
    ok(all(a['triangulos'] <= 2000 for a in at), 'cada edificio cabe en el presupuesto de 2.000 triángulos')
    # ── 2 · cámara sobre la Casa de Lali, 8 ángulos ──
    pg.evaluate('(c) => { const j = __juego.est.jugadores.oli; j.x = (c[0] + 2.5) * 16; j.y = (c[1] + 4.6) * 16; }', [lali['x'], lali['y']]); pg.wait_for_timeout(1200)
    pg.click('[data-hc=zoom]'); pg.wait_for_timeout(300); pg.click('[data-hc=zoom]'); pg.wait_for_timeout(500)   # lejos
    vistas = {}
    for k in range(8):
        pg.wait_for_timeout(700); f = sal / ('casa_lali_%d.png' % (k * 45)); pg.screenshot(path=str(f)); vistas[k] = Image.open(f).convert('RGB')
        pg.evaluate('G.hd2d.girar(1)')
    teja = (0xd9, 0x4a, 0x3f); yeso = (0xf7, 0xe9, 0xcb); piedra = (0x8a, 0x84, 0x98)
    ok(all(cuenta(v, teja, 40, (0, 80, 390, 700)) > 150 for v in vistas.values()), 'desde los 8 ángulos se ve el tejado rojo de la casa')
    ok(all(cuenta(v, yeso, 40, (0, 80, 390, 700)) > 80 for k, v in vistas.items() if k in (0, 1, 7)), 'desde el sur se ven las paredes de yeso crema (fachada)')
    ok(any(cuenta(v, piedra, 28, (0, 80, 390, 700)) > 40 for v in vistas.values()), 'hay piedra gris (zócalo y chimenea)')
    # luz fija arriba-izquierda: la cámara en yaw 90° está al ESTE y ve la pared este (tono «sombra», yeso #ead7ae); en 270° está al OESTE y ve la pared oeste (tono «luz», yeso #fff6dc). El material no se ilumina, así que los colores son los de la textura
    n = lambda v, rgb: cuenta(v, rgb, 5, (0, 80, 390, 700))
    luz90, luz270, som90, som270 = n(vistas[2], (255, 246, 220)), n(vistas[6], (255, 246, 220)), n(vistas[2], (234, 215, 174)), n(vistas[6], (234, 215, 174))
    print('  yeso «luz» visto desde el este/oeste: %d / %d · yeso «sombra»: %d / %d' % (luz90, luz270, som90, som270))
    ok(luz270 > 3 * luz90 + 30 and som90 > som270 + 30, 'luz fija: la pared oeste se ve con el yeso de «luz» y la este con el de «sombra», no al revés')
    # ── 3 · presupuesto de llamadas de dibujo: volúmenes frente a láminas ──
    pg.evaluate('G.hd2d.girar(0)'); pg.wait_for_timeout(500)
    def medir():
        pg.wait_for_timeout(600); return pg.evaluate("""async () => { const t = []; let u = performance.now(); for (let i = 0; i < 40; i++) { await new Promise(requestAnimationFrame); const n = performance.now(); t.push(n - u); u = n; } t.sort((a, b) => a - b); const e = G.hd2d.estado(); return { mediana: t[20], p90: t[36], llamadas: e.llamadas, triangulos: e.triangulos }; }""")
    con = medir()
    pg.evaluate('G.hd2d.AJUSTES.VOLUMENES = false; G.hd2d.reconstruir();'); pg.wait_for_timeout(600)
    st2 = pg.evaluate('G.hd2d.estado()')['st']; sin = medir()
    ok(st2['volumenes'] == 0, 'con el interruptor apagado no hay ningún volumen (todo láminas)')
    print('  con volúmenes: %s llamadas, %s triángulos, %.1f ms/cuadro (p90 %.1f) · con láminas: %s llamadas, %s triángulos, %.1f ms/cuadro (p90 %.1f)' % (con['llamadas'], con['triangulos'], con['mediana'], con['p90'], sin['llamadas'], sin['triangulos'], sin['mediana'], sin['p90']))
    ok(con['llamadas'] - sin['llamadas'] <= 12, 'presupuesto: %+d llamadas de dibujo respecto a las láminas (máximo +12)' % (con['llamadas'] - sin['llamadas']))
    ok(con['mediana'] < 55, 'rendimiento básico: %.1f ms por cuadro en el dibujo por software de Chromium (el vigilante manda al 2D por encima de 55 ms de forma sostenida); láminas: %.1f ms' % (con['mediana'], sin['mediana']))
    pg.evaluate('G.hd2d.AJUSTES.VOLUMENES = true; G.hd2d.reconstruir();'); pg.wait_for_timeout(700)
    ok(pg.evaluate('G.hd2d.estado().st.volumenes') == 3, 'al volver a encender el interruptor las 3 casas vuelven a ser volumen')
    # ── 3b · v2.82 (L3, 1.ª mitad): el laboratorio tiene azotea PLANA de arena con peto turquesa; desde los 8 ángulos no hay teja roja y se ve la arena de la cubierta ──
    lab = [o for o in mapa['objetos'] if o['tipo'] == 'laboratorio'][0]
    pg.evaluate('(c) => { const j = __juego.est.jugadores.oli; j.x = (c[0] + 2.5) * 16; j.y = (c[1] + 4.6) * 16; }', [lab['x'], lab['y']]); pg.wait_for_timeout(1200)
    vl = {}
    for k in range(8):
        pg.wait_for_timeout(700); f = sal / ('laboratorio_%d.png' % (k * 45)); pg.screenshot(path=str(f)); vl[k] = Image.open(f).convert('RGB')
        pg.evaluate('G.hd2d.girar(1)')
    arena = (0xc9, 0xb4, 0x8c); turq = (0x2a, 0x81, 0x87)
    ok(all(cuenta(v, arena, 14, (0, 80, 390, 700)) > 150 for v in vl.values()), 'laboratorio: desde los 8 ángulos se ve la azotea de arena')
    tri = {x['tipo']: x['triangulos'] for x in at}; ok(tri['laboratorio'] <= 2000, 'laboratorio: azotea plana con cúpula, %d triángulos (máximo 2.000)' % tri['laboratorio'])
    calido = (0xff, 0xe9, 0xa8); ok(all(cuenta(v, calido, 14, (0, 80, 390, 700)) > 30 for v in vl.values()), 'laboratorio: desde los 8 ángulos se ve la cúpula de vidrio cálido (#ffe9a8)')
    ok(all(cuenta(v, turq, 14, (0, 80, 390, 700)) > 20 for v in vl.values()), 'laboratorio: desde los 8 ángulos se ve el peto con su franja turquesa')
    # ── 4 · Oli entra en el nicho de la casa: se ve delante de la puerta, no dentro de la pared ──
    pg.evaluate('(c) => { const j = __juego.est.jugadores.oli; j.x = (c[0] + 2.5) * 16; j.y = (c[1] + 4.9) * 16; }', [lali['x'], lali['y']]); pg.wait_for_timeout(900); pg.evaluate('G.hd2d.girar(-0)')
    pg.screenshot(path=str(sal / 'nicho_oli.png'))
    ok(not errs, 'sin errores de consola (%s)' % '; '.join(errs[:3]))
    b.close()
if docs:
    import shutil
    for k in (0, 1, 2, 4): shutil.copy(sal / ('casa_lali_%d.png' % (k * 45)), raiz / 'docs' / ('hd2d_casa_lali_%d.png' % (k * 45)))
    for k in (0, 2): shutil.copy(sal / ('laboratorio_%d.png' % (k * 45)), raiz / 'docs' / ('hd2d_laboratorio_%d.png' % (k * 45)))   # v2.82
print('\nTODO BIEN' if not fallos else '\nFALLAN: ' + '; '.join(fallos)); sys.exit(1 if fallos else 0)
