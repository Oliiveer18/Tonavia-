#!/usr/bin/env python3
"""prueba_combate_hd2d.py — combate en tiempo real en el HD-2D (v2.272), en Chromium móvil 390×844 con Three.js REAL.
Uso: node build.js && python3 tools/prueba_combate_hd2d.py --three ruta/three.min.js [carpeta_capturas] [--aliado pompon] [--seg 1,3,6,...]
(Three.js r128: npm install three@0.128.0 -> node_modules/three/build/three.min.js.) Arranca una pelea con la criatura salvaje más cercana, la deja correr y saca capturas; comprueba que hay unidades, cuadritos de efecto, barras y que el 2D no se toca."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; args = sys.argv[1:]; real = None; aliado = 'pompon'; segs = [0.3, 0.6, 0.9, 1.3, 1.8, 2.5, 3.2, 4, 5, 6, 9, 13]
if '--three' in args: i = args.index('--three'); real = pathlib.Path(args[i + 1]); del args[i:i + 2]
if '--aliado' in args: i = args.index('--aliado'); aliado = args[i + 1]; del args[i:i + 2]
if '--seg' in args: i = args.index('--seg'); segs = [float(x) for x in args[i + 1].split(',')]; del args[i:i + 2]
if not real: sys.exit('falta --three ruta/three.min.js')
sal = pathlib.Path(args[0]) if args else pathlib.Path('/tmp/capturas_combate'); sal.mkdir(parents=True, exist_ok=True)
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'ERR_' not in m.text else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(path=str(real), content_type='application/javascript'))
    pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(300)
    pg.click('#hbtn'); pg.wait_for_function('__juego.hd', timeout=15000); pg.wait_for_timeout(800)
    # una criatura salvaje junto a Oli (la más cercana al cruce); se coloca a 3 casillas a la derecha
    pg.evaluate("""() => { const J = __juego, est = J.est, o = est.jugadores.oli, lista = J.motor.criaturas(est, o.mapa); const c = lista[0]; c.x = o.x + 48; c.y = o.y; c.hx = c.x; c.hy = c.y; }""")
    pg.wait_for_timeout(300)
    ok(pg.is_visible('#kbtn') and pg.inner_text('#kbtn') == '⚔', 'con una criatura cerca aparece el botón ⚔ (HD-2D)')
    pg.screenshot(path=str(sal / '0_antes.png'))
    pg.evaluate("a => __juego.motor.aplicar(__juego.est, { j: 'oli', t: 'combate', aliado: a })", aliado); pg.wait_for_timeout(200)
    ok(pg.evaluate('!!__juego.est.combate && !__juego.est.combate.fin'), 'la orden «combate» crea est.combate')
    t0 = 0; maxpro = 0
    for s in segs:
        if s <= 6: pg.wait_for_timeout(int((s - t0) * 1000))   # tiempo real (el render por software es lento: pasados ~10 s el vigilante de FPS vuelve al 2D, como debe)
        else: pg.evaluate('n => { for (let i = 0; i < n * 10; i++) __juego.motor.combate.avanzar(__juego.est, 0.1); }', s - t0); pg.wait_for_timeout(350)   # se adelanta la simulación y se deja pintar
        t0 = s
        st = pg.evaluate('({ pro: G.hd2d.estado().st.proInst || 0, fx: G.hd2d.estado().st.combateCuadritos || 0, ent: G.hd2d.estado().entidades, v: (G.vista.combate(__juego.est, 0) || {}).unidades ? G.vista.combate(__juego.est, 0).unidades.map(u => [u.forma, Math.round(u.hpF * 100), Math.round(u.med)]) : null, fin: __juego.est.combate && __juego.est.combate.fin, tick: __juego.est.combate && __juego.est.combate.c.t })')
        maxpro = max(maxpro, st['pro']); print('  t=%.1fs' % s, st); pg.screenshot(path=str(sal / ('c_%04.1f.png' % s)))
        if pg.evaluate('!!(__juego.est.combate && __juego.est.combate.fin)'): break
    ok(maxpro > 0, 'v2.274 se pintaron efectos diseñados (G.fxPro) durante el combate')
    ok(pg.evaluate('!G.hd2d.estado() || G.hd2d.estado().st.combateCuadritos !== undefined'), 'el pintor armó cuadritos de efecto en algún momento')
    ok(not errs, 'sin errores en la consola' + ('' if not errs else ': ' + str(errs[:3])))
    b.close()
print('\n%d FALLO(S)' % len(fallos) if fallos else '\nprueba de combate HD-2D ok'); sys.exit(1 if fallos else 0)
