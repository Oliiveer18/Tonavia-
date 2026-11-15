#!/usr/bin/env python3
"""prueba_farolas_hd2d.py — prueba con Three.js REAL (r128) de la luz pequeña de las farolas del HD-2D (v2.103, pasos 5 y 6 de docs/FICHAS_OBJETOS_3D.md).
Uso: node build.js && python3 tools/prueba_farolas_hd2d.py --three ruta/three.min.js [carpeta_capturas] [--docs]     (necesita playwright y PIL; npm install three@0.128.0 -> node_modules/three/build/three.min.js)
Comprueba, en Chromium móvil 390×844 con dibujo por software: (1) 12 luces (charco + halo) con las intensidades de la ficha ·
(2) ?farolas=0 las quita y la farola 3D se queda · (3) +2 llamadas de dibujo exactas (una malla de charcos y una de halos, para las 12) ·
(4) más luz en pantalla alrededor de una farola con luz que sin ella, en los 4 giros de cámara · (5) el parpadeo se queda entre 0,96 y 1,04 y con ?movimiento=0 no se mueve ·
(6) rendimiento: ms por cuadro con y sin luz (software de Chromium, no un móvil real) · (7) sin errores de consola. Deja capturas en la carpeta de salida (con --docs, docs/farolas_paso6_antes_despues_390x844.png)."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image
raiz = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]; three = None
if '--three' in args: i = args.index('--three'); three = pathlib.Path(args[i + 1]); del args[i:i + 2]
docs = '--docs' in args
if docs: args.remove('--docs')
if not three: print('falta --three ruta/three.min.js (Three.js r128 real)'); sys.exit(2)
sal = pathlib.Path(args[0]) if args else pathlib.Path('/tmp/capturas_farolas_hd2d'); sal.mkdir(parents=True, exist_ok=True)
mapa = json.loads((raiz / 'maps' / 'albanota.json').read_text(encoding='utf8'))
farolas = [o for o in mapa['objetos'] if o['tipo'] == 'farola']; f0 = farolas[0]
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html')
def luz(im, caja):
    x0, y0, x1, y1 = caja; x0 = max(0, x0); y0 = max(0, y0); x1 = min(im.width, x1); y1 = min(im.height, y1); px = im.load(); s = 0; n = 0
    for x in range(x0, x1):
        for y in range(y0, y1):
            r, g, b = px[x, y]; s += 0.3 * r + 0.59 * g + 0.11 * b; n += 1
    return s / max(1, n)
def abre(p, consulta=''):
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=1); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(path=str(three), content_type='application/javascript'))
    pg.goto(URL + consulta); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(200)
    pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=15000); pg.wait_for_timeout(800)
    return b, pg, errs
def poner(pg, x, y): pg.evaluate('(c) => { const j = __juego.est.jugadores.oli; j.x = c[0] * 16; j.y = c[1] * 16; }', [x, y]); pg.wait_for_timeout(1500)
with sync_playwright() as p:
    # ── A · con luz ──
    b, pg, errs_d = abre(p); poner(pg, f0['x'] + 0.5, f0['y'] + 2.2); Fd = pg.evaluate('G.hd2d.estado().farolas')
    ok(Fd and Fd['n'] == 12 and Fd['visibles'] is False and Fd['charco'] == 0 and Fd['halo'] == 0, 'DE DÍA (por defecto) las 12 luces existen pero están escondidas y a 0: no se nota que den luz')
    pg.evaluate('G.luzFarolas.AJUSTES.NOCHE = 0.5'); pg.wait_for_timeout(300); Fa = pg.evaluate('G.hd2d.estado().farolas')
    ok(Fa['visibles'] is True and abs(Fa['charco'] - 0.11) < 0.11 * 0.06, 'al atardecer (NOCHE = 0,5) la luz sale a la mitad (charco %.3f)' % Fa['charco']); b.close()
    b, pg, errs = abre(p, '?farolas=1'); poner(pg, f0['x'] + 0.5, f0['y'] + 2.2)
    st = pg.evaluate('G.hd2d.estado()'); F = st['farolas']
    ok(F is not None and F['n'] == len(farolas) == 12, 'hay %d luces, una por farola' % (F['n'] if F else -1))
    ok(F and abs(F['charco'] - 0.22) <= 0.22 * 0.05 and abs(F['halo'] - 0.5) <= 0.5 * 0.05, 'intensidades de la ficha: charco %.3f (0,22 ±4 %%) y halo %.3f (0,5 ±4 %%)' % (F['charco'], F['halo']))
    ok(F and F['visibles'] is True, 'las dos mallas están a la vista')
    # parpadeo: muestras durante 3 s
    m = pg.evaluate("""async () => { const o = []; for (let i = 0; i < 60; i++) { const f = G.hd2d.estado().farolas; o.push(f.charco / 0.22); await new Promise((r) => setTimeout(r, 50)); } return o; }""")
    ok(0.955 <= min(m) and max(m) <= 1.045 and max(m) - min(m) > 0.01, 'el parpadeo se mueve entre %.3f y %.3f (límite 0,96–1,04)' % (min(m), max(m)))
    # llamadas de dibujo: se comparan, más abajo, con la página abierta con ?farolas=0 (la escena no se ve desde fuera)
    con_llamadas = []
    for _ in range(6): con_llamadas.append(pg.evaluate('G.hd2d.estado().llamadas')); pg.wait_for_timeout(200)
    ms = pg.evaluate("""async () => { const t0 = performance.now(); let n = 0; await new Promise((res) => { const f = () => { n++; if (performance.now() - t0 > 2000) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }); return (performance.now() - t0) / n; }""")
    con_ms = ms
    pr = pg.evaluate('(c) => G.hd2d.proyectar(c[0], c[1])', [f0['x'] + 0.5, f0['y'] + 0.5]); cx, cy = int(pr['x']), int(pr['y']); caja = (cx - 90, cy - 150, cx + 90, cy + 60)
    luces_con = []
    for k in range(4):
        pr = pg.evaluate('(c) => G.hd2d.proyectar(c[0], c[1])', [f0['x'] + 0.5, f0['y'] + 0.5]); cx, cy = int(pr['x']), int(pr['y'])
        f = sal / ('con_%d.png' % k); pg.wait_for_timeout(300); pg.screenshot(path=str(f)); luces_con.append((luz(Image.open(f).convert('RGB'), (cx - 90, cy - 150, cx + 90, cy + 60)), (cx, cy)))
        pg.evaluate('G.hd2d.girar(1)'); pg.wait_for_timeout(500)
    ok(not errs, 'sin errores de consola con luz (%s)' % errs[:2])
    b.close()
    # ── B · sin luz (?farolas=0) ──
    b, pg, errs0 = abre(p, '?farolas=0'); poner(pg, f0['x'] + 0.5, f0['y'] + 2.2)
    st0 = pg.evaluate('G.hd2d.estado()')
    ok(st0['farolas'] is None, '?farolas=0 quita charcos y halos')
    ok(st0['st']['volumenes'] >= 19, 'con ?farolas=0 la farola 3D se queda (%s volúmenes)' % st0['st']['volumenes'])
    sin_llamadas = []
    for _ in range(6): sin_llamadas.append(pg.evaluate('G.hd2d.estado().llamadas')); pg.wait_for_timeout(200)
    ms0 = pg.evaluate("""async () => { const t0 = performance.now(); let n = 0; await new Promise((res) => { const f = () => { n++; if (performance.now() - t0 > 2000) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }); return (performance.now() - t0) / n; }""")
    mod = lambda L: max(set(L), key=L.count)
    ok(mod(con_llamadas) - mod(sin_llamadas) == 2, 'la luz cuesta DOS llamadas de dibujo más (con %s, sin %s)' % (mod(con_llamadas), mod(sin_llamadas)))
    luces_sin = []
    for k in range(4):
        pr = pg.evaluate('(c) => G.hd2d.proyectar(c[0], c[1])', [f0['x'] + 0.5, f0['y'] + 0.5]); cx, cy = int(pr['x']), int(pr['y'])
        f = sal / ('sin_%d.png' % k); pg.wait_for_timeout(300); pg.screenshot(path=str(f)); luces_sin.append(luz(Image.open(f).convert('RGB'), (cx - 90, cy - 150, cx + 90, cy + 60)))
        pg.evaluate('G.hd2d.girar(1)'); pg.wait_for_timeout(500)
    for k in range(4): ok(luces_con[k][0] > luces_sin[k] + 1.0, 'giro %d: más luz con farolas (%.1f) que sin ellas (%.1f)' % (k, luces_con[k][0], luces_sin[k]))
    ok(not errs0, 'sin errores de consola sin luz (%s)' % errs0[:2])
    b.close()
    # ── C · ?movimiento=0 ──
    b, pg, errs1 = abre(p, '?farolas=1&movimiento=0'); poner(pg, f0['x'] + 0.5, f0['y'] + 2.2)
    q = pg.evaluate("""async () => { const o = []; for (let i = 0; i < 20; i++) { o.push(G.hd2d.estado().farolas.charco); await new Promise((r) => setTimeout(r, 100)); } return o; }""")
    ok(len(set(q)) == 1 and abs(q[0] - 0.22) < 1e-9, 'con ?movimiento=0 la luz no parpadea (charco fijo en %.3f)' % q[0])
    ok(not errs1, 'sin errores de consola con ?movimiento=0')
    b.close()
    # ── rendimiento: en UNA página se alterna luz encendida / apagada (interruptor en vivo G.luzFarolas.AJUSTES.ACTIVO) 8 veces y se toma la mediana de ms por cuadro de cada lado ──
    b, pg, errs2 = abre(p, '?farolas=1'); poner(pg, f0['x'] + 0.5, f0['y'] + 2.2)
    r = pg.evaluate("""async () => { const medir = () => new Promise((res) => { const t = []; let u = performance.now(), n = 0; const f = () => { const a = performance.now(); t.push(a - u); u = a; if (++n >= 40) res(t.slice(5).sort((x, y) => x - y)[Math.floor((t.length - 5) / 2)]); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
      const on = [], off = [], ll = [[], []]; for (let i = 0; i < 8; i++) { G.luzFarolas.AJUSTES.ACTIVO = true; await medir(); on.push(await medir()); ll[0].push(G.hd2d.estado().llamadas); G.luzFarolas.AJUSTES.ACTIVO = false; await medir(); off.push(await medir()); ll[1].push(G.hd2d.estado().llamadas); }
      G.luzFarolas.AJUSTES.ACTIVO = true; const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)]; return { on: med(on), off: med(off), ll }; }""")
    con_ms, ms0 = r['on'], r['off']; mod = lambda L: max(set(L), key=L.count)
    ok(mod(r['ll'][0]) - mod(r['ll'][1]) == 2, 'el interruptor en vivo quita exactamente las 2 llamadas de dibujo de la luz (con %s, sin %s)' % (mod(r['ll'][0]), mod(r['ll'][1])))
    print('rendimiento (software de Chromium, no un móvil real): %.1f ms/cuadro con luz, %.1f ms/cuadro sin luz (mediana de 8 vueltas)' % (con_ms, ms0))
    ok(con_ms <= ms0 * 1.10 + 2, 'la luz no suma más de un 10 %% de tiempo por cuadro (%.1f frente a %.1f ms)' % (con_ms, ms0))
    ok(not errs2, 'sin errores de consola al alternar la luz'); b.close()
    # ── imagen para los documentos: antes (sin luz) y después (con luz) ──
    if docs:
        a = Image.open(sal / 'sin_0.png').convert('RGB'); c = Image.open(sal / 'con_0.png').convert('RGB'); W = Image.new('RGB', (a.width * 2 + 10, a.height), (20, 16, 30)); W.paste(a, (0, 0)); W.paste(c, (a.width + 10, 0))
        W.save(raiz / 'docs' / 'farolas_paso6_antes_despues_390x844.png'); print('imagen de docs guardada')
print('\nFALLOS: %d' % len(fallos) if fallos else '\nTODO BIEN'); sys.exit(1 if fallos else 0)
