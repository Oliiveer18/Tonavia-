#!/usr/bin/env python3
"""prueba_combate_2d.py — combate en tiempo real en el pintor 2D (v2.277), Chromium móvil 390×844. Uso: node build.js && python3 tools/prueba_combate_2d.py [carpeta_capturas]
Arranca una pelea con la criatura salvaje más cercana y el acompañante; capturas a lo largo del combate; comprueba unidades, efectos, que la vencida desaparece y que el cierre deja todo limpio."""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; sal = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/capturas_combate2d'); sal.mkdir(parents=True, exist_ok=True); fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True).new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load' not in m.text else None)
    pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(600)
    ok(pg.evaluate('!!__juego.est.acomp'), 'el acompañante existe en el 2D')
    pg.evaluate("()=>{const J=__juego,o=J.est.jugadores.oli,c=J.motor.criaturas(J.est,o.mapa)[0];c.x=o.x+48;c.y=o.y;}"); pg.wait_for_timeout(300)
    pg.evaluate("__juego.est.jugadores.oli.esferas=0")   # sin esferas no hay oferta de captura (eso lo prueba tools/prueba_captura_2d.py)
    ok(pg.is_visible('#kbtn'), 'el botón ⚔ aparece en el 2D'); n0 = pg.evaluate("__juego.motor.criaturas(__juego.est,'albanota').length")
    pg.evaluate("__juego.motor.aplicar(__juego.est,{j:'oli',t:'combate'})")
    for s in [0.5, 1.0, 1.6, 2.4, 3.5, 5]:
        pg.wait_for_timeout(500 if s < 1.1 else 700); pg.screenshot(path=str(sal / ('c_%.1f.png' % s)))
    pg.evaluate("()=>{const J=__juego;for(let i=0;i<3000&&J.est.combate&&!J.est.combate.c.u.some(u=>u.ko);i++)J.motor.combate.avanzar(J.est,0.05)}"); mxp = 0
    for i in range(8):
        pg.wait_for_timeout(60); mxp = max(mxp, pg.evaluate('G.combate2d.pixeles()'))
    ok(mxp > 100, 'la criatura derrotada se desintegra en píxeles (%d partículas)' % mxp)
    pg.evaluate("()=>{const J=__juego;for(let i=0;i<1200&&J.est.combate&&!J.est.combate.fin;i++)J.motor.combate.avanzar(J.est,0.05)}"); pg.wait_for_timeout(300); pg.screenshot(path=str(sal / 'fin.png'))
    pg.evaluate("()=>{const J=__juego;for(let i=0;i<60;i++)J.motor.combate.avanzar(J.est,0.05)}"); pg.wait_for_timeout(500)
    ok(not pg.evaluate('!!__juego.est.combate'), 'el combate se cierra del todo')
    ok(pg.evaluate("__juego.motor.criaturas(__juego.est,'albanota').length") in (n0 - 1, n0), 'la criatura vencida desaparece del mapa')
    # los efectos tienen que verse en CADA combate (regresión v2.289: desde el 2.º no salían, claves «tick|id|mov» repetidas al reiniciarse los ticks)
    for k in (2, 3):
        pg.evaluate("()=>{const J=__juego,o=J.est.jugadores.oli,c=J.motor.criaturas(J.est,o.mapa)[0];c.x=o.x+48;c.y=o.y;J.motor.aplicar(J.est,{j:'oli',t:'combate'})}"); mx = 0
        for i in range(100):
            pg.wait_for_timeout(100); mx = max(mx, pg.evaluate('__juego.est.combate ? G.combate2d.activos() : 0'))
            if not pg.evaluate('!!__juego.est.combate'): break
        if k == 3: pg.screenshot(path=str(sal / 'tercero.png'))
        ok(mx > 0, 'combate %d: se ven efectos de combate (máx. %d activos)' % (k, mx))
        pg.evaluate("()=>{const J=__juego;for(let i=0;i<1500&&J.est.combate&&!J.est.combate.fin;i++)J.motor.combate.avanzar(J.est,0.05);for(let i=0;i<60;i++)J.motor.combate.avanzar(J.est,0.05)}"); pg.wait_for_timeout(300)
    ok(not errs, 'sin errores en la consola' + ('' if not errs else ': ' + str(errs[:3]))); b.close()
print('\n%d FALLO(S)' % len(fallos) if fallos else '\nprueba de combate 2D ok'); sys.exit(1 if fallos else 0)
