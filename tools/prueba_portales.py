#!/usr/bin/env python3
# tools/prueba_portales.py — prueba en Chromium móvil (390×844) los PORTALES y el NEXUS técnico (Multiverso F5): requisito de nivel, cruce Ermita→Nexus→Ermita, velo de transición, carga/descarga de la dimensión, guardado dentro del Nexus y tablón global.
# Uso: node build.js && python3 tools/prueba_portales.py   Última línea: «OK» o «FALLA: n». Capturas: docs/portales_v2356_*_390x844.png
import os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def foto(pg, n): pg.screenshot(path=os.path.join(raiz, 'docs', 'portales_v2356_%s_390x844.png' % n))
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page()
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    ok(pg.evaluate("() => !__juego.mundo.mapas['nexus/plaza_cruce'] && G.mundo.cargadas('nexus').length === 0"), 'al arrancar el Nexus NO está cargado (carga bajo demanda)')
    # 1) Ermita: junto al portal, sin nivel
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; __juego.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'ermita', ancla: 'entrada' }); j.x = 8 * 16 + 8; j.y = 4 * 16 + 14; }"); pg.wait_for_timeout(900); foto(pg, 'ermita_cerrado')
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.y = 2 * 16 + 14; j.enPuerta = null; __juego.motor.cruzar(e, j, __juego.mundo.mapa('ermita')); }"); pg.wait_for_timeout(300)
    r = pg.evaluate("() => [__juego.est.jugadores.oli.mapa, document.getElementById('who').textContent]")
    ok(r[0] == 'ermita' and 'nivel de entrenador 5' in r[1], 'sin nivel 5 el portal no se abre y dice qué falta (%s)' % (r,))
    # 2) con nivel 5
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.xpE = G.entrenador.xpPara(5); j.x = 8 * 16 + 8; j.y = 4 * 16 + 14; j.enPuerta = null; }"); pg.wait_for_timeout(700); foto(pg, 'ermita_abierto')
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.y = 2 * 16 + 14; j.enPuerta = null; __juego.motor.cruzar(e, j, __juego.mundo.mapa('ermita')); }"); pg.wait_for_timeout(250)
    r = pg.evaluate("() => [__juego.est.jugadores.oli.mapa, G.mundo.cargadas('nexus').length, G.portalesUI.enCurso(__juego.clock !== undefined ? __juego.clock : 0)]")
    ok(r[0] == 'nexus/plaza_cruce' and r[1] >= 1, 'con nivel 5 el portal lleva al Nexus y lo carga (%s)' % (r,))
    foto(pg, 'nexus_velo'); pg.wait_for_timeout(2200); foto(pg, 'nexus')
    # 3) el tablón es global: se puede usar desde el Nexus
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; j.x = 15 * 16 + 8; j.y = 8 * 16 + 14; }"); pg.wait_for_timeout(300)
    ok(pg.evaluate("() => { const n = G.npc.cercano(__juego.est, __juego.est.jugadores.oli); return !!n && n.id === 'tablon'; }"), 'el tablón de intercambios está en el mercado del Nexus y se alcanza')
    # 4) guardar dentro del Nexus y recargar
    pg.evaluate("() => { G.guardado.escribir(__juego.est); }")
    pg.goto('file://' + html + '?menu=1&sonido=0'); pg.wait_for_timeout(500)
    try: pg.click('[data-pick=oli]', timeout=1500)
    except Exception: pass
    pg.wait_for_timeout(1200)
    r = pg.evaluate("() => [__juego.est.jugadores.oli.mapa, G.mundo.cargadas('nexus').length]")
    ok(r[0] == 'nexus/plaza_cruce' and r[1] >= 1, 'la partida guardada dentro del Nexus se reanuda allí (%s)' % (r,))
    # 5) volver por el portal del Nexus: sin pila de puertas (partida cargada dentro) sale por la Ermita
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.x = 10 * 16 + 8; j.y = 11 * 16 + 14; j.enPuerta = null; }"); pg.wait_for_timeout(200)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.y = 12 * 16 + 14; j.enPuerta = null; __juego.motor.cruzar(e, j, __juego.mundo.mapa('nexus/plaza_cruce')); }"); pg.wait_for_timeout(400)
    r = pg.evaluate("() => [__juego.est.jugadores.oli.mapa, G.mundo.cargadas('nexus').length, document.getElementById('who').textContent]")
    ok(r[0] == 'ermita' and r[1] == 0, 'volver por el portal del Nexus deja al jugador en la Ermita y descarga el Nexus (%s)' % (r,))
    ok(not err, 'sin errores de página %s' % err[:2])
    b.close()
print('OK' if not fallos else 'FALLA: %d' % len(fallos))
