#!/usr/bin/env python3
"""prueba_particulas_hd2d.py — prueba con Three.js REAL (r128) de las partículas del HD-2D (v2.93, F3).
Uso: node build.js && python3 tools/prueba_particulas_hd2d.py --three ruta/three.min.js [carpeta_capturas] [--docs]     (necesita playwright y PIL; npm install three@0.128.0 -> node_modules/three/build/three.min.js)
Comprueba, en Chromium móvil 390×844 con dibujo por software: (1) con las partículas encendidas hay cuadritos en la malla y con el interruptor G.hd2d.AJUSTES.PARTICULAS apagado, 0 y la malla se esconde ·
(2) +1 llamada de dibujo exacta · (3) la fuente: más píxeles de brillo de agua (#d3e8ff / #f4f9ff) con partículas que sin ellas, en los 4 giros de cámara · (4) el humo de la Casa de Lali: más píxeles gris cálido (#cfc8d0 / #a59ca8) con partículas ·
(5) rendimiento: ms por cuadro con y sin partículas (con el dibujo por software de Chromium, no un móvil real) · (6) sin errores de consola. Deja capturas en la carpeta de salida (con --docs, docs/fuente_f3_giros_390x844.png)."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image
raiz = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]; three = None
if '--three' in args: i = args.index('--three'); three = pathlib.Path(args[i + 1]); del args[i:i + 2]
docs = '--docs' in args
if docs: args.remove('--docs')
if not three: print('falta --three ruta/three.min.js (Three.js r128 real)'); sys.exit(2)
sal = pathlib.Path(args[0]) if args else pathlib.Path('/tmp/capturas_particulas_hd2d'); sal.mkdir(parents=True, exist_ok=True)
mapa = json.loads((raiz / 'maps' / 'albanota.json').read_text(encoding='utf8'))
fuente = [o for o in mapa['objetos'] if o['tipo'] == 'fuente'][0]; lali = [o for o in mapa['objetos'] if o['tipo'] == 'casa_lali'][0]
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html')
BRILLO = [(0xd3, 0xe8, 0xff), (0xf4, 0xf9, 0xff)]; HUMO = [(0xcf, 0xc8, 0xd0), (0xa5, 0x9c, 0xa8)]
def cerca(c, rgb, tol): return all(abs(c[i] - rgb[i]) <= tol for i in range(3))
def cuenta(im, cols, caja=None, tol=3):
    x0, y0, x1, y1 = caja or (0, 0, im.width, im.height); px = im.load(); n = 0
    for x in range(max(0, x0), min(im.width, x1)):
        for y in range(max(0, y0), min(im.height, y1)):
            c = px[x, y]
            if any(cerca(c, k, tol) for k in cols): n += 1
    return n
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=1); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(path=str(three), content_type='application/javascript'))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(200)
    pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=15000); pg.wait_for_timeout(800)
    def poner(x, y): pg.evaluate('(c) => { const j = __juego.est.jugadores.oli; j.x = c[0] * 16; j.y = c[1] * 16; }', [x, y]); pg.wait_for_timeout(1500)
    def foto(nombre): f = sal / nombre; pg.screenshot(path=str(f)); return Image.open(f).convert('RGB')
    # ── 1 · cámara sobre la fuente, cerca ──
    poner(fuente['x'] + 0.5, fuente['y'] + 3.4)
    ok(pg.evaluate('G.hd2d.AJUSTES.PARTICULAS') is True, 'las partículas del HD-2D están encendidas de fábrica')
    st = pg.evaluate('G.hd2d.estado()'); ok(st['particulas'] >= 64, 'con las partículas encendidas hay %d cuadritos en la malla (la fuente sola pone 64 de gotas)' % st['particulas'])
    # llamadas de dibujo: se alterna encendido/apagado en seguida (2 cuadros de espera cada vez) y se compara por parejas seguidas, para que no cuenten otros cambios de la escena (criaturas que pasan, etc.); se da la diferencia que más se repite
    difs = pg.evaluate("""async () => { const cuadro = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const d = []; for (let i = 0; i < 10; i++) { G.hd2d.AJUSTES.PARTICULAS = true; await cuadro(); const on = G.hd2d.estado().llamadas; G.hd2d.AJUSTES.PARTICULAS = false; await cuadro(); const off = G.hd2d.estado().llamadas; d.push(on - off); } G.hd2d.AJUSTES.PARTICULAS = true; return d; }""")
    dif = max(set(difs), key=difs.count); pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = false'); pg.wait_for_timeout(500); st0 = pg.evaluate('G.hd2d.estado()')
    ok(st0['particulas'] == 0, 'con el interruptor apagado no hay cuadritos (%d)' % st0['particulas'])
    ok(dif == 1, 'las partículas cuestan UNA llamada de dibujo más (diferencia más repetida %s en %s)' % (dif, difs))
    pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = true'); pg.wait_for_timeout(500)
    # ── 2 · los 4 giros: brillo de la fuente con y sin partículas ──
    tiras = []; todos_mejor = True; sumas = []
    for k in range(4):
        pr = pg.evaluate('(c) => G.hd2d.proyectar(c[0], c[1])', [fuente['x'] + 0.0, fuente['y'] + 0.5]); cx, cy = int(pr['x']), int(pr['y']); caja = (cx - 90, cy - 230, cx + 90, cy + 60)   # la cámara gira alrededor del jugador: la fuente cambia de sitio en la pantalla en cada giro
        con = []; sin = []
        for rep in range(4):   # varios cuadros del reloj visual (cada 250 ms): las gotas cambian de sitio
            pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = true'); pg.wait_for_timeout(280); a = foto('fuente_con_%d.png' % k); con.append(cuenta(a, BRILLO, caja))
            pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = false'); pg.wait_for_timeout(120); s = foto('fuente_sin_%d.png' % k); sin.append(cuenta(s, BRILLO, caja))
        mc, ms = sum(con) / len(con), sum(sin) / len(sin); sumas.append((mc, ms)); todos_mejor = todos_mejor and mc > ms + 8
        pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = true'); pg.wait_for_timeout(300); tiras.append(foto('fuente_giro_%d.png' % k).crop(caja))
        pg.evaluate('G.hd2d.girar(2)'); pg.wait_for_timeout(900)
    ok(todos_mejor, 'en los 4 giros (0°, 90°, 180°, 270°) la fuente tiene más píxeles de brillo con partículas que sin ellas (media con/sin: %s)' % ', '.join('%.0f/%.0f' % s for s in sumas))
    if docs:
        W = sum(t.width for t in tiras); H = max(t.height for t in tiras); hoja = Image.new('RGB', (W, H), (27, 20, 36)); x = 0
        for t in tiras: hoja.paste(t, (x, 0)); x += t.width
        hoja = hoja.resize((hoja.width * 2, hoja.height * 2), Image.NEAREST); hoja.save(raiz / 'docs' / 'fuente_f3_giros_390x844.png')
    # ── 3 · humo de la Casa de Lali ──
    pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = true'); pg.click('[data-hc=zoom]'); pg.click('[data-hc=zoom]'); poner(lali['x'] + 3.6, lali['y'] + 4.8)   # zoom lejos y la cámara al sur de la casa
    con = []; sin = []
    for rep in range(5):
        pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = true'); pg.wait_for_timeout(260); con.append(cuenta(foto('humo_con.png'), HUMO))
        pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = false'); pg.wait_for_timeout(120); sin.append(cuenta(foto('humo_sin.png'), HUMO))
    ok(sum(con) > sum(sin) + 10, 'el humo de la chimenea se ve: píxeles gris cálido con partículas %s y sin ellas %s' % (con, sin))
    pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = true'); pg.wait_for_timeout(300); casa = foto('humo_casa_lali.png')
    if docs: casa.save(raiz / 'docs' / 'hd2d_humo_f3_390x844.png')
    # ── 4 · rendimiento: ms por cuadro con y sin ──
    pg.click('[data-hc=zoom]'); poner(fuente['x'] + 0.5, fuente['y'] + 3.4)
    medir = '() => new Promise((ok) => { const t = []; let u = performance.now(), n = 0; const f = (ts) => { t.push(ts - u); u = ts; if (++n < 70) requestAnimationFrame(f); else ok(t.slice(10).reduce((a, b) => a + b, 0) / (t.length - 10)); }; requestAnimationFrame(f); })'
    pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = true'); on = pg.evaluate(medir); pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = false'); off = pg.evaluate(medir); pg.evaluate('G.hd2d.AJUSTES.PARTICULAS = true')
    ok(on < off + 8, 'rendimiento (dibujo por software): %.1f ms por cuadro con partículas y %.1f sin ellas (diferencia < 8 ms)' % (on, off))
    # ── 5 · sin errores ──
    ok(not errs, 'sin errores de consola' + ('' if not errs else ': ' + '; '.join(errs[:3])))
    b.close()
print('\n' + ('TODO BIEN' if not fallos else 'HAY %d FALLO(S)' % len(fallos))); sys.exit(1 if fallos else 0)
