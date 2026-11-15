#!/usr/bin/env python3
"""prueba_banco_hd2d.py — prueba con Three.js REAL (r128) del BANCO en volumen dentro del HD-2D del juego (v2.110, paso 5 de docs/FICHA_BANCO_3D.md).
Uso: node build.js && python3 tools/prueba_banco_hd2d.py --three ruta/three.min.js [carpeta_capturas] [--docs]     (necesita playwright y PIL; npm install three@0.128.0 -> node_modules/three/build/three.min.js)
Comprueba, en Chromium móvil 390×844 con dibujo por software: (1) los 3 bancos de Albanota salen como volumen, con 82 triángulos cada uno (≤ 120), su atlas ≤ 256×256 y sin fallos ·
(2) presupuesto: llamadas de dibujo respecto a las láminas (≤ +12) · (3) desde los 4 giros se ve madera del banco y la sombra rectangular oscurece el suelo (se compara con el mismo banco sin sombra) ·
(4) rendimiento: ms por cuadro con volumen frente a láminas (software de Chromium, no un móvil real) · (5) sin errores de consola. Con --docs deja docs/banco_paso5_antes_despues_390x844.png."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image
raiz = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]; three = None
if '--three' in args: i = args.index('--three'); three = pathlib.Path(args[i + 1]); del args[i:i + 2]
docs = '--docs' in args
if docs: args.remove('--docs')
if not three: print('falta --three ruta/three.min.js (Three.js r128 real)'); sys.exit(2)
sal = pathlib.Path(args[0]) if args else pathlib.Path('/tmp/capturas_banco_hd2d'); sal.mkdir(parents=True, exist_ok=True)
mapa = json.loads((raiz / 'maps' / 'albanota.json').read_text(encoding='utf8'))
bancos = [o for o in mapa['objetos'] if o['tipo'] == 'banco']; b0 = bancos[-1]   # el de (8, 16)
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
URL = 'file://' + str(raiz / 'dist' / 'criaturas.html')
def abre(p, modo='vol'):
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=1); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(path=str(three), content_type='application/javascript'))
    pg.goto(URL); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(200)
    if modo == 'lam': pg.evaluate('G.OBJETOS.banco.vol = null')   # solo el banco como lámina (los demás siguen en volumen)
    if modo == 'sin': pg.evaluate('G.OBJETOS.banco.vol.sombra = false')   # banco en volumen sin su sombra
    pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=15000); pg.wait_for_timeout(800)
    cx, cz = b0['x'] + 1.0, b0['y'] + 2.4
    pg.evaluate('(c) => { const j = __juego.est.jugadores.oli; j.x = c[0] * 16; j.y = c[1] * 16; }', [cx, cz]); pg.wait_for_timeout(1500)
    return b, pg, errs
def lum(im, x, y, r=2):
    s = n = 0
    for i in range(max(0, x - r), min(im.width, x + r + 1)):
        for j in range(max(0, y - r), min(im.height, y + r + 1)):
            R, G_, B = im.getpixel((i, j)); s += 0.3 * R + 0.59 * G_ + 0.11 * B; n += 1
    return s / max(1, n)
def sur(pg, im):   # luminancia media del suelo justo al sur del frente del banco (donde cae la sombra), 7 puntos
    v = []
    for k in range(7):
        pr = pg.evaluate('(c) => G.hd2d.proyectar(c[0], c[1])', [b0['x'] + 0.45 + k * 0.18, b0['y'] + 0.95]); v.append(lum(im, int(pr['x']), int(pr['y'])))
    return sum(v) / len(v)
def madera(pg, im):   # píxeles marrones (madera) en una caja alrededor del banco
    pr = pg.evaluate('(c) => G.hd2d.proyectar(c[0], c[1])', [b0['x'] + 1.0, b0['y'] + 0.6]); cx, cy = int(pr['x']), int(pr['y']); n = 0
    for i in range(max(0, cx - 60), min(im.width, cx + 60)):
        for j in range(max(0, cy - 50), min(im.height, cy + 40)):
            R, G_, B = im.getpixel((i, j))
            if R > G_ + 12 and G_ > B + 8 and R < 235: n += 1
    return n
def ms_cuadro(pg):
    return pg.evaluate("""async () => { const t0 = performance.now(); let n = 0; await new Promise((res) => { const f = () => { n++; if (performance.now() - t0 > 2000) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }); return (performance.now() - t0) / n; }""")
with sync_playwright() as p:
    res = {}
    for modo in ('vol', 'lam', 'sin'):
        b, pg, errs = abre(p, modo); st = pg.evaluate('G.hd2d.estado()')
        calls = []
        for _ in range(6): calls.append(pg.evaluate('G.hd2d.estado().llamadas')); pg.wait_for_timeout(200)
        ms = ms_cuadro(pg); imgs = []; sombra = []; mad = []; cen = []
        for k in range(4):
            f = sal / ('%s_%d.png' % (modo, k)); pg.wait_for_timeout(300); pg.screenshot(path=str(f)); im = Image.open(f).convert('RGB'); imgs.append(im); sombra.append(sur(pg, im)); mad.append(madera(pg, im)); pc = pg.evaluate('(c) => G.hd2d.proyectar(c[0], c[1])', [b0['x'] + 1.0, b0['y'] + 0.6]); cen.append((int(pc['x']), int(pc['y'])))
            pg.evaluate('G.hd2d.girar(1)'); pg.wait_for_timeout(1600)
        res[modo] = dict(cen=cen, st=st, calls=max(set(calls), key=calls.count), ms=ms, imgs=imgs, sombra=sombra, mad=mad, errs=errs)
        if modo == 'vol':
            g = pg.evaluate("""() => { const d = G.OBJETOS.banco, g = G.volumenes.geometria(d.huella, d.vol), a = G.volTex.atlas('banco', g); return { tri: g.triangulos, aw: a.w, ah: a.h, tex: a.texturas }; }""")
            res['geo'] = g
        b.close()
    V, L, S = res['vol'], res['lam'], res['sin']; sv, sl = V['st']['st'], L['st']['st']
    ok(sv['volumenes'] - sl['volumenes'] == len(bancos) == 3 and sv['volFallos'] == 0, 'los %d bancos salen como volumen (volúmenes %d con volumen, %d con láminas; fallos %d)' % (len(bancos), sv['volumenes'], sl['volumenes'], sv['volFallos']))
    ok(res['geo']['tri'] == 82 and res['geo']['tri'] <= 120, 'cada banco tiene %d triángulos (≤ 120)' % res['geo']['tri'])
    ok(res['geo']['aw'] == 256 and res['geo']['ah'] <= 256, 'el atlas del banco mide %d×%d con %d texturas (≤ 256×256)' % (res['geo']['aw'], res['geo']['ah'], res['geo']['tex']))
    ok(sv['sombras'] - sl['sombras'] == 3, 'los 3 bancos llevan su malla de sombra (+%d sombras)' % (sv['sombras'] - sl['sombras']))
    ok(V['calls'] - L['calls'] <= 12, 'llamadas de dibujo: %s con volumen frente a %s con láminas (+%d, máximo +12)' % (V['calls'], L['calls'], V['calls'] - L['calls']))
    for k in range(4): ok(V['mad'][k] > 150, 'giro %d: se ve la madera del banco (%d px marrones; con láminas %d)' % (k, V['mad'][k], L['mad'][k]))
    def dif(k):   # píxeles que cambian al quitar solo la sombra del banco (misma cámara, mismo jugador), en una caja alrededor del banco: cuántos y cuántos son más oscuros con sombra
        cx, cy = V['cen'][k]; n = osc = 0
        for i in range(max(0, cx - 90), min(390, cx + 90)):
            for j in range(max(0, cy - 55), min(844, cy + 55)):
                a_ = V['imgs'][k].getpixel((i, j)); b_ = S['imgs'][k].getpixel((i, j))
                if abs(sum(a_) - sum(b_)) >= 9: n += 1; osc += sum(a_) < sum(b_)
        return n, osc
    D = [dif(k) for k in range(4)]
    for k, (n, osc) in enumerate(D): print('       giro %d: la sombra cambia %d px (%d más oscuros); suelo al sur: %.1f con sombra, %.1f sin ella' % (k, n, osc, V['sombra'][k], S['sombra'][k]))
    ok(sum(1 for n, o in D if n >= 40) >= 3, 'la sombra del banco se ve en al menos 3 de los 4 giros (en el giro que falta, probablemente el banco tapa su propia sombra)')
    ok(all(o >= 0.9 * n for n, o in D), 'en ningún giro la sombra aclara nada: todos los píxeles que cambian son más oscuros')
    ok(V['ms'] <= L['ms'] * 1.5 + 5, 'rendimiento (software de Chromium, no un móvil): %.1f ms por cuadro con volumen y %.1f con láminas' % (V['ms'], L['ms']))
    ok(not V['errs'] and not L['errs'], 'sin errores de consola (%s)' % (V['errs'][:2] + L['errs'][:2]))
    if docs:
        cw, ch = 300, 200; hoja = Image.new('RGB', (cw * 4, ch * 2), (255, 255, 255))
        for k in range(4):
            for fila, R_ in ((0, L), (1, V)):
                pr = R_['cen'][k]; x0 = max(0, min(390 - cw, pr[0] - cw // 2)); y0 = max(0, min(844 - ch, pr[1] - ch // 2)); hoja.paste(R_['imgs'][k].crop((x0, y0, x0 + cw, y0 + ch)), (k * cw, fila * ch))
        hoja.save(raiz / 'docs' / 'banco_paso5_antes_despues_390x844.png'); print('guardado docs/banco_paso5_antes_despues_390x844.png (fila de arriba: láminas, abajo: volumen; 4 giros)')
print('\nTODO BIEN' if not fallos else '\n%d FALLO(S)' % len(fallos)); sys.exit(1 if fallos else 0)
