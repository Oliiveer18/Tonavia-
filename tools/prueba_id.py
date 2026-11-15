#!/usr/bin/env python3
# tools/prueba_id.py — v2.342: Nº de criatura en el panel Equipo y liberar desde la caja. Capturas: docs/id_v2342_*_390x844.png
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0&ciclo=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; G.equipo.agregar(j, { forma: 'zefirax' }); j.mapa = 'centro_pc'; j.x = 6 * 16 + 8; j.y = 5 * 16 + 8; G.equipoUI.abrir(j, null, { editar: true, guardar: (f, i) => !!__juego.motor.aplicar(e, { j: 'oli', t: 'equipo', formas: f, ids: i }), liberar: (id) => __juego.motor.aplicar(e, { j: 'oli', t: 'liberar', id }) }); }"); pg.wait_for_timeout(400)
    pg.click('#eq-tabs button[data-tab=todas]'); pg.wait_for_timeout(300)
    t = pg.inner_text('#eq-lista'); ok('Nº 0001' in t and 'Nº 0002' in t, 'las tarjetas muestran Nº 0001 y Nº 0002')
    pg.screenshot(path=os.path.join(raiz, 'docs', 'id_v2342_lista_390x844.png'))
    pg.locator('#eq-lista .eq-card').nth(1).click(); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(raiz, 'docs', 'id_v2342_ficha_390x844.png'))
    pg.click('.eq-btn.peligro'); pg.wait_for_timeout(200)
    ok(pg.evaluate("() => G.equipo.caja(__juego.est.jugadores.oli).length") == 1, 'el primer toque solo pide confirmación')
    pg.click('.eq-btn.peligro'); pg.wait_for_timeout(400)
    ok(pg.evaluate("() => G.equipo.caja(__juego.est.jugadores.oli).length") == 0, 'el segundo toque libera la criatura')
    ok(not err, 'sin errores de página %s' % err[:2]); b.close()
print('FALLOS' if fallos else 'OK'); sys.exit(1 if fallos else 0)
