#!/usr/bin/env python3
# tools/prueba_mote.py — v2.340: poner un mote a una criatura desde la ficha del panel Equipo. Capturas: docs/mote_v2340_*_390x844.png
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0&ciclo=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; G.equipo.agregar(j, { forma: 'pompon' }); }"); pg.click('#bq, #qb, [data-equipo], #btn-equipo') if False else None
    pg.evaluate("() => G.equipoUI.abrir(__juego.est.jugadores.oli, null, { mote: (ref, t) => __juego.motor.aplicar(__juego.est, Object.assign({ j: 'oli', t: 'mote', texto: t }, ref)) })"); pg.wait_for_timeout(400)
    pg.locator('#eq-lista .eq-card').first.click(); pg.wait_for_timeout(300)
    pg.fill('#eq-mote-in', 'Bolita'); pg.screenshot(path=os.path.join(raiz, 'docs', 'mote_v2340_ficha_390x844.png'))
    pg.click('.eq-mote .eq-btn.pri'); pg.wait_for_timeout(400)
    ok(pg.evaluate("() => __juego.est.jugadores.oli.motes && __juego.est.jugadores.oli.motes.pompon") == 'Bolita', 'el mote se guarda en la criatura')
    ok('Bolita' in pg.inner_text('#eq-lista'), 'la tarjeta muestra el mote')
    pg.screenshot(path=os.path.join(raiz, 'docs', 'mote_v2340_lista_390x844.png'))
    pg.locator('#eq-lista .eq-card').first.click(); pg.wait_for_timeout(300); pg.click('.eq-mote .eq-btn.sec'); pg.wait_for_timeout(300)
    ok(pg.evaluate("() => !__juego.est.jugadores.oli.motes") and 'Ondel' in pg.inner_text('#eq-lista'), 'quitar el mote vuelve al nombre de la especie')
    ok(not err, 'sin errores de página %s' % err[:2]); b.close()
print('FALLOS' if fallos else 'OK'); sys.exit(1 if fallos else 0)
