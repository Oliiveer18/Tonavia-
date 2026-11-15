#!/usr/bin/env python3
# tools/prueba_puerta_carbuna.py — prueba en Chromium móvil la puerta PROVISIONAL Albanota ↔ Carbuna (v2.322): ir y volver andando. Uso: node build.js && python3 tools/prueba_puerta_carbuna.py   Última línea: «OK» o «FALLA: n».
import sys, os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page()
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(700)
    pg.evaluate("() => { const J = __juego, o = J.est.jugadores.oli, l = J.est.jugadores.lali; [o, l].forEach((j) => { j.x = 41 * 16 + 8; j.y = 18 * 16 + 14; j.dir = 'right'; }); }")
    pg.wait_for_timeout(600); pg.screenshot(path=os.path.join(raiz, 'docs', 'cartel_carbuna_v323_390x844.png'))   # el cartel y los braseros junto a la puerta
    def mapa(): return pg.evaluate("() => __juego.est.jugadores.oli.mapa")
    def andar(t, ms):
        pg.evaluate("(t) => { __juego.est.jugadores.oli.teclas = null; window.__t = t; }", t)
        pg.keyboard.down(t); pg.wait_for_timeout(ms); pg.keyboard.up(t)
    andar('ArrowRight', 1800); pg.wait_for_timeout(300)
    ok(mapa() == 'pueblo_carbuna', 'caminando al este desde Albanota se llega a pueblo_carbuna (mapa: %s)' % mapa())
    pos = pg.evaluate("() => { const o = __juego.est.jugadores.oli; return [Math.floor(o.x / 16), Math.floor(o.y / 16)]; }")
    ok(abs(pos[0] - 3) <= 1 and pos[1] in (17, 18), 'aparece en el camino de entrada de Carbuna %s' % pos)
    pg.screenshot(path=os.path.join(raiz, 'docs', 'puerta_carbuna_v322_390x844.png'))
    andar('ArrowLeft', 1500); pg.wait_for_timeout(300)
    ok(mapa() == 'albanota', 'caminando al oeste desde Carbuna se vuelve a Albanota (mapa: %s)' % mapa())
    ok(not err, 'sin errores de consola %s' % err[:2])
    b.close()
print('OK' if not fallos else 'FALLA: %d' % len(fallos))
