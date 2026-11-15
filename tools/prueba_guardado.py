#!/usr/bin/env python3
# tools/prueba_guardado.py — Multiverso E1 + F2: seguridad, migración v1→v2 y recuperación de la copia en el navegador real (390×844).
# (1) guardado de versión futura y (2) ilegible: tras 11 s de juego siguen intactos y se avisa; (3) mapa que no existe: el progreso se conserva y se vuelve a guardar; copia de seguridad.
import os, sys, json
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = 'file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?menu=1&sonido=0&ciclo=0'; err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
# Al salir de una página el juego guarda (pagehide): antes de inyectar un guardado a mano se calla a la página VIEJA para que no lo pise al navegar. La página nueva usa el guardado real.
CALLAR = "() => { G.guardado.escribir = () => false; }"
LS = "() => [localStorage.getItem('criaturas_partida'), localStorage.getItem('criaturas_partida_bak')]"
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    # partida real de partida: jugar, enriquecer y guardar
    pg.goto(html + '&nueva=1'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(800)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.brillos = 777; G.entrenador.dar(e, j, 3000); G.equipo.agregar(j, { forma: 'pompon', mapa: 'albanota', hp: 5, xp: 400 }); G.guardado.escribir(e); }")
    buena = pg.evaluate(LS)[0]; d = json.loads(buena); brillos = d['jugadores']['oli']['brillos']
    ok(d['v'] == 2 and brillos >= 777 and d['jugadores']['oli']['xpE'] == 3000, 'partida de partida guardada (Brillos %s, XP 3000)' % brillos)
    for nombre, texto, motivo in [('versión futura', json.dumps(dict(d, v=99, dim={'nexus': {}})), 'futuro'), ('ilegible', buena[:len(buena) // 2], 'corrupto')]:
        pg.evaluate(CALLAR); pg.evaluate("(t) => { localStorage.setItem('criaturas_partida', t); localStorage.setItem('criaturas_partida_bak', 'COPIA'); }", texto)
        pg.goto(html); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1500)
        ok(pg.evaluate("() => G.guardado.bloqueo") == motivo, nombre + ': el juego arranca bloqueado (' + motivo + ')')
        aviso = pg.inner_text('#gbl') if pg.locator('#gbl').count() else ''; caja = pg.evaluate("() => { const e = document.getElementById('gbl'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, e.scrollWidth <= e.clientWidth + 1]; }")
        ok('no se guarda' in aviso and caja and caja[0] >= 0 and caja[2] <= 390 and caja[1] >= 0 and caja[4], nombre + ': aviso completo y dentro de la pantalla: «' + aviso.replace('\n', ' / ') + '»')
        pg.wait_for_timeout(4000); ok(pg.locator('#gbl').count() == 1, nombre + ': el aviso no desaparece solo')
        pg.screenshot(path=os.path.join(raiz, 'docs', 'guardado_e1_' + motivo + '_390x844.png'))
        pg.click('#gbl'); pg.wait_for_timeout(200); ok(pg.locator('#gbl').count() == 0, nombre + ': se cierra al tocarlo')
        pg.evaluate("() => { __juego.est.jugadores.oli.brillos = 1; }"); pg.keyboard.down('ArrowDown'); pg.wait_for_timeout(11000); pg.keyboard.up('ArrowDown')
        pg.evaluate("() => { window.dispatchEvent(new Event('pagehide')); }"); r = pg.evaluate(LS)
        ok(r[0] == texto and r[1] == 'COPIA', nombre + ': tras 11 s de juego + cierre, el guardado y la copia siguen idénticos')
    # mapa que no existe
    d3 = json.loads(buena); d3['jugadores']['oli']['mapa'] = 'fantasma/plaza'; t3 = json.dumps(d3)
    pg.evaluate(CALLAR); pg.evaluate("(t) => { localStorage.setItem('criaturas_partida', t); localStorage.removeItem('criaturas_partida_bak'); }", t3)
    pg.goto(html); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    r = pg.evaluate("() => { const j = __juego.est.jugadores.oli; return [G.guardado.bloqueo, j.brillos, j.xpE, j.mapa, (j.sinId || []).length + (j.equipo || []).length]; }")
    ok(pg.locator('#gbl').count() == 0 and r[0] is None and r[1] == brillos and r[2] == 3000 and r[3] == 'albanota' and r[4] >= 1, 'mapa inexistente: progreso intacto y jugador en Albanota %s' % r)
    pg.screenshot(path=os.path.join(raiz, 'docs', 'guardado_e1_mapa_390x844.png'))
    pg.wait_for_timeout(6000); g = pg.evaluate(LS); n = json.loads(g[0])
    ok(g[1] == t3 and n['jugadores']['oli']['brillos'] == brillos and n['jugadores']['oli']['mapa'] == 'albanota', 'mapa inexistente: copia de seguridad = lo leído, y el autoguardado escribe la partida completa')
    # ?nueva=1 sobre un guardado bloqueado: pasa a la copia y se puede volver a guardar
    fut = json.dumps(dict(d, v=99)); pg.evaluate(CALLAR); pg.evaluate("(t) => localStorage.setItem('criaturas_partida', t)", fut)
    pg.goto(html + '&nueva=1'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(6500); g = pg.evaluate(LS)
    ok(g[1] == fut and g[0] and json.loads(g[0])['v'] == 2 and pg.evaluate("() => G.guardado.bloqueo") is None, '?nueva=1: la partida de versión futura queda en la copia y la nueva se guarda')
    # F2 (1): un guardado v1 REAL del juego anterior (tools/fixtures/guardado_v1_f1.json) se carga, se migra al guardar y deja la copia previa
    v1 = open(os.path.join(raiz, 'tools', 'fixtures', 'guardado_v1_f1.json'), encoding='utf8').read(); b1 = json.loads(v1)['jugadores']['oli']['brillos']
    pg.evaluate(CALLAR); pg.evaluate("(t) => { localStorage.setItem('criaturas_partida', t); localStorage.removeItem('criaturas_partida_bak'); localStorage.removeItem('criaturas_partida_premig'); localStorage.removeItem('criaturas_partida_corrupta'); }", v1)
    pg.goto(html); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    r = pg.evaluate("() => { const j = __juego.est.jugadores.oli; return [G.guardado.bloqueo, j.brillos, j.xpE, Object.keys(__juego.est.dim).length, __juego.est.agentes.pob.length]; }")
    ok(pg.locator('#gbl').count() == 0 and r[0] is None and r[1] == b1 and r[3] == 0 and r[4] == 24, 'v1 real: carga sin avisos con todo su progreso %s' % r)
    pg.wait_for_timeout(6000); g = pg.evaluate("() => [localStorage.getItem('criaturas_partida'), localStorage.getItem('criaturas_partida_bak'), localStorage.getItem('criaturas_partida_premig')]"); n = json.loads(g[0])
    ok(n['v'] == 2 and 'agentes' not in n and n['dim']['tonavia']['v'] == 1 and len(n['dim']['tonavia']['agentes']['pob']) == 24 and n['jugadores']['oli']['brillos'] >= b1 and g[1] == v1 and g[2] == v1, 'v1 real: el autoguardado escribe v2 (dim.tonavia) y las copias normal y previa son el v1 original')
    # F2 (2): guardado ilegible + copia buena: el arranque sigue bloqueado y avisa; ?recuperar=1 restaura la copia y aparta lo ilegible
    buena = g[0]; roto = buena[:len(buena) // 2]
    pg.evaluate(CALLAR); pg.evaluate("([t, b]) => { localStorage.setItem('criaturas_partida', t); localStorage.setItem('criaturas_partida_bak', b); localStorage.removeItem('criaturas_partida_corrupta'); }", [roto, buena])
    pg.goto(html); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1500)
    aviso = pg.inner_text('#gbl') if pg.locator('#gbl').count() else ''
    ok(pg.evaluate("() => G.guardado.bloqueo") == 'corrupto' and '?recuperar=1' in aviso, 'ilegible con copia: arranca bloqueado y el aviso explica cómo recuperar: «' + aviso.replace('\n', ' / ')[-120:] + '»')
    box = pg.evaluate("() => { const e = document.getElementById('gbl'); const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, e.scrollHeight <= e.clientHeight + 1]; }")
    ok(box[0] >= 0 and box[2] <= 390 and box[1] >= 0 and box[3] <= 844, 'ilegible con copia: el aviso cabe en la pantalla %s' % box)
    pg.screenshot(path=os.path.join(raiz, 'docs', 'guardado_f2_recuperar_aviso_390x844.png'))
    pg.wait_for_timeout(5500); ok(pg.evaluate(LS)[0] == roto, 'ilegible con copia: sin ?recuperar=1 no se toca nada (ni en 5 s de juego)')
    pg.evaluate(CALLAR); pg.goto(html + '&recuperar=1'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    r = pg.evaluate("() => [G.guardado.bloqueo, __juego.est.jugadores.oli.brillos, localStorage.getItem('criaturas_partida_corrupta')]")
    ok(pg.locator('#gbl').count() == 0 and r[0] is None and r[1] >= b1 and r[2] == roto, '?recuperar=1: la copia vuelve a ser la partida, con todo su progreso, y lo ilegible queda apartado %s' % r[:2])
    # F2 (3): ?recuperar=1 nunca sustituye un guardado válido ni uno de versión futura
    for nombre, texto in [('válido', buena), ('versión futura', json.dumps(dict(json.loads(buena), v=99)))]:
        pg.evaluate(CALLAR); pg.evaluate("([t, b]) => { localStorage.setItem('criaturas_partida', t); localStorage.setItem('criaturas_partida_bak', b); localStorage.removeItem('criaturas_partida_corrupta'); }", [texto, v1])
        pg.goto(html + '&recuperar=1'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200); r = pg.evaluate(LS)
        ok(r[0] == texto or (nombre == 'válido' and json.loads(r[0])['jugadores']['oli']['brillos'] >= b1), '?recuperar=1 con guardado ' + nombre + ': no se sustituye por la copia')
    # Auditoría F2 (1): guardado de buena forma pero que no se puede restaurar (bloqueado) -> el aviso ofrece recuperar y ?recuperar=1 funciona; cierre de página después sin tocar lo apartado
    inres = json.dumps({'v': 2, 'jugadores': {'pepe': {'mapa': 'albanota'}}, 'dim': {'tonavia': {'v': 1}}})
    pg.evaluate(CALLAR); pg.evaluate("([t, b]) => { localStorage.setItem('criaturas_partida', t); localStorage.setItem('criaturas_partida_bak', b); ['', '2', '3'].forEach((n) => localStorage.removeItem('criaturas_partida_corrupta' + n)); }", [inres, buena])
    pg.goto(html); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1500); aviso = pg.inner_text('#gbl') if pg.locator('#gbl').count() else ''
    ok(pg.evaluate("() => G.guardado.bloqueo") == 'corrupto' and '?recuperar=1' in aviso, 'no restaurable con copia: bloqueado y el aviso ofrece recuperar')
    pg.evaluate(CALLAR); pg.goto(html + '&recuperar=1'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    pg.evaluate("() => { __juego.est.jugadores.oli.brillos += 1; window.dispatchEvent(new Event('pagehide')); }"); r = pg.evaluate("() => [G.guardado.bloqueo, localStorage.getItem('criaturas_partida_corrupta'), JSON.parse(localStorage.getItem('criaturas_partida')).v, localStorage.getItem('criaturas_partida_bak')]")
    ok(r[0] is None and r[1] == inres and r[2] == 2 and r[3] == buena and pg.locator('#gbl').count() == 0, 'no restaurable con copia: ?recuperar=1 recupera, aparta el original, el cierre de página guarda y la copia no cambia')
    # Auditoría F2 (2): ?nueva=1 junto a ?recuperar=1 -> gana ?nueva=1 (no se recupera nada; lo entendible pasa a la copia)
    pg.evaluate(CALLAR); pg.evaluate("([t]) => { localStorage.setItem('criaturas_partida', t); localStorage.removeItem('criaturas_partida_bak'); }", [buena])
    pg.goto(html + '&nueva=1&recuperar=1'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200); r = pg.evaluate("() => [G.guardado.bloqueo, __juego.est.jugadores.oli.brillos, localStorage.getItem('criaturas_partida_bak')]")
    ok(r[0] is None and r[1] != brillos and r[2] == buena, '?nueva=1&recuperar=1: empieza de cero y el guardado anterior queda en la copia')
    ok(not err, 'sin errores de página %s' % err[:2]); b.close()
print('FALLOS: %d' % len(fallos) if fallos else 'OK prueba_guardado'); sys.exit(1 if fallos else 0)
