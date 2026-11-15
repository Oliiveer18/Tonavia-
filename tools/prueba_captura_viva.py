#!/usr/bin/env python3
# tools/prueba_captura_viva.py — v2.338: captura EN el combate con la vida en rojo (oferta → vuelo → sacudidas → capturada). Capturas: docs/captura_v2338_*_390x844.png
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0&ciclo=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli, m = G.motor, c = m.criaturas(e, j.mapa)[0]; j.esferas = 5; c.x = j.x + 56; c.y = j.y; m.aplicar(e, { j: 'oli', t: 'combate' }); }"); pg.wait_for_timeout(3200)
    pg.evaluate("() => { const k = __juego.est.combate; k.c.u.find((u) => u.id.indexOf('e_') === 0).hp = 1; }"); pg.wait_for_timeout(1400)
    ok(pg.evaluate("() => { const k = __juego.est.combate; return !!(k && k.cap && k.cap.vivo && k.cap.fase === 'oferta'); }"), 'con la vida en rojo se ofrece la captura en pleno combate')
    pg.screenshot(path=os.path.join(raiz, 'docs', 'captura_v2338_oferta_390x844.png'))
    pg.evaluate("() => { __juego.motor.aplicar(__juego.est, { j: 'oli', t: 'lanzar', q: 1 }); }"); pg.wait_for_timeout(420); pg.screenshot(path=os.path.join(raiz, 'docs', 'captura_v2338_vuelo_390x844.png'))
    pg.wait_for_timeout(650); pg.screenshot(path=os.path.join(raiz, 'docs', 'captura_v2338_absorbe_390x844.png'))
    pg.wait_for_timeout(900); pg.screenshot(path=os.path.join(raiz, 'docs', 'captura_v2338_agita_390x844.png'))
    pg.wait_for_timeout(2500); pg.screenshot(path=os.path.join(raiz, 'docs', 'captura_v2338_fin_390x844.png'))
    print(pg.evaluate("() => { const e = __juego.est; return JSON.stringify({ cap: e.combate && e.combate.cap && e.combate.cap.fase, sinId: (e.jugadores.oli.sinId || []).length, esf: e.jugadores.oli.esferas }); }"))
    ok(not err, 'sin errores de página %s' % err[:2]); b.close()
print('FALLOS' if fallos else 'OK'); sys.exit(1 if fallos else 0)
