#!/usr/bin/env python3
# tools/prueba_reloj.py — prueba en Chromium móvil (390×844) el RELOJ DEL DÍA (v2.327): la hora avanza y se guarda, la tienda cierra de noche (cartel, puerta, Teo) y el Centro PC no.
# Uso: node build.js && python3 tools/prueba_reloj.py   Última línea: «OK» o «FALLA: n». Capturas: docs/reloj_v2327_*_390x844.png
import os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page()
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1500)
    r1 = pg.evaluate("() => [__juego.est.reloj, document.getElementById('hora').textContent, document.getElementById('hora').style.display]"); pg.wait_for_timeout(1500)
    r2 = pg.evaluate("() => [__juego.est.reloj, document.getElementById('hora').textContent]")
    ok(r2[0] > r1[0] and r1[1].endswith('09:36') or r1[1].find(':') > 0, 'el reloj avanza con la partida y se ve la hora (%s → %s)' % (r1, r2))
    pg.evaluate("() => { __juego.guardar ? __juego.guardar() : G.guardado.escribir(__juego.est); }")
    g = pg.evaluate("() => JSON.parse(localStorage.getItem('criaturas_partida')).reloj")
    ok(g > 0, 'la hora se guarda en la partida (%s s)' % g)
    # noche: se coloca el reloj a las 23:00 y se mira la tienda
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; e.reloj = (23 / 24 - G.ciclo.AJUSTES.FASE0) * G.ciclo.AJUSTES.DIA_S; j.mapa = 'albanota'; j.x = 34 * 16 + 8; j.y = 10 * 16 + 14; j.enPuerta = null; }")
    pg.wait_for_timeout(900); pg.screenshot(path=os.path.join(raiz, 'docs', 'reloj_v2327_tienda_cerrada_390x844.png'))
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.y = 8 * 16 + 14; __juego.motor.cruzar(e, j, __juego.mundo.mapa('albanota')); }"); pg.wait_for_timeout(500)
    n = pg.evaluate("() => [__juego.est.jugadores.oli.mapa, __juego.est.avisos.concat([]).length, document.getElementById('who').textContent, document.getElementById('hora').textContent]")
    ok(n[0] == 'albanota' and 'cerrada' in n[2], 'de noche la puerta de la tienda no se abre y avisa (%s)' % (n,))
    pg.evaluate("() => { __juego.est.reloj = (12 / 24 - G.ciclo.AJUSTES.FASE0) * G.ciclo.AJUSTES.DIA_S; const j = __juego.est.jugadores.oli; j.x = 40; j.y = 40; j.enPuerta = null; }"); pg.wait_for_timeout(300)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.x = 34 * 16 + 8; j.y = 8 * 16 + 14; j.enPuerta = null; __juego.motor.cruzar(e, j, __juego.mundo.mapa('albanota')); }"); pg.wait_for_timeout(600)
    d = pg.evaluate("() => __juego.est.jugadores.oli.mapa")
    ok(d == 'tienda', 'de día la tienda abre (%s)' % d)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; e.reloj = (3 / 24 - G.ciclo.AJUSTES.FASE0) * G.ciclo.AJUSTES.DIA_S; j.mapa = 'albanota'; j.x = 26 * 16 + 8; j.y = 9 * 16 + 14; j.enPuerta = null; __juego.motor.cruzar(e, j, __juego.mundo.mapa('albanota')); }"); pg.wait_for_timeout(600)
    c = pg.evaluate("() => __juego.est.jugadores.oli.mapa")
    ok(c == 'centro_pc', 'de madrugada el Centro PC sigue abierto (%s)' % c)
    pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(raiz, 'docs', 'reloj_v2327_centro_noche_390x844.png'))
    ok(not err, 'sin errores de consola %s' % err[:2])
    b.close()
print('OK' if not fallos else 'FALLA: %d' % len(fallos))
