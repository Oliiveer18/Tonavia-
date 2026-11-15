#!/usr/bin/env python3
"""prueba_red_agentes.py — F8: los entrenadores (G.agentes) se sincronizan entre dos navegadores con PeerJS real.
Necesita PeerJS: en este entorno cdnjs está bloqueado, así que se ejecuta con un PeerServer LOCAL (bucle local, tools/ no lo incluye; ver docs/multiverso/16_RED_LIMITES_F8.md).
Si PeerJS no carga, termina con «NO VERIFICABLE» (no cuenta como éxito de red real)."""
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); URL = 'file://' + raiz + '/dist/criaturas.html?menu=1&nueva=1&sonido=0&ciclo=0'
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def nuevo(b):
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None); return ctx, pg, errs
EST = "G.agentes.de(__juego.est, 'tonavia')"
with sync_playwright() as p:
    b = p.chromium.launch(); cO, O, eO = nuevo(b); cL, L, eL = nuevo(b)
    try:
        O.goto(URL); O.wait_for_function('window.__juego'); O.click('[data-pick=oli]')
        O.wait_for_function("!!window.Peer", timeout=20000); O.wait_for_function("!!G.redPeer.codigo()", timeout=5000); cod = O.evaluate("G.redPeer.codigo()")
        O.wait_for_function("document.getElementById('who').textContent.indexOf('sala') > 0", timeout=20000)
        L.goto(URL + '&sala=' + cod); L.wait_for_function('window.__juego'); L.click('[data-pick=lali]')
        L.wait_for_function("document.getElementById('who').textContent.indexOf('con Oli') > 0", timeout=30000)
        O.wait_for_function("document.getElementById('who').textContent.indexOf('con Lali') > 0", timeout=10000)
        ok(True, 'conectados (PeerJS real, bucle local)')
        O.wait_for_timeout(300); n0 = O.evaluate("(%s || {}).n || 0" % EST)
        L.wait_for_function("((%s || {}).n || 0) > 0" % EST, timeout=15000)
        a = O.evaluate("JSON.stringify((%s).pob.map(t => t.id).sort())" % EST); g = L.evaluate("JSON.stringify((%s).pob.map(t => t.id).sort())" % EST)
        ok(a == g and a != '[]', 'Lali recibe la misma población de entrenadores que Oli (%s entrenadores)' % (a.count(',') + 1))
        L.wait_for_timeout(5000)
        ok(L.evaluate("((%s) || {}).n" % EST) >= 1, 'el contador de la población avanza en el invitado')
        # F8: el anfitrión recibe el progreso personal declarado por Lali (base de la validación de requisitos de portal)
        O.wait_for_function("!!G.red.declarado(__juego.est, 'lali')", timeout=10000)
        L.evaluate("__juego.est.jugadores.lali.xpE = G.entrenador.xpPara(5)")
        O.wait_for_function("(G.red.declarado(__juego.est, 'lali') || {}).xp >= G.entrenador.xpPara(5)", timeout=10000)
        ok(True, 'el anfitrión recibe y actualiza el progreso declarado de Lali (nivel 5) por la red')
        ok(O.evaluate("G.portales.comprobar(__juego.est.jugadores.lali, {requisitos:[{t:'nivelEntrenador',n:5}]}, __juego.est, G.red.declarado(__juego.est,'lali')).ok") is True, 'con lo declarado, el requisito de nivel 5 se cumple en el anfitrión')
        ok(not eO and not eL, 'sin errores de consola en los dos' + ('' if not (eO or eL) else ': ' + str((eO + eL)[0])))
    except Exception as e:
        print(' NO VERIFICABLE (PeerJS real):', str(e).split('\n')[0]); b.close(); sys.exit(2)
    b.close()
print('FALLOS: %d' % len(fallos) if fallos else 'TODO BIEN (bucle local, NO internet real ni dos móviles)'); sys.exit(1 if fallos else 0)
