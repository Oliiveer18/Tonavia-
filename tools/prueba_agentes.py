#!/usr/bin/env python3
# tools/prueba_agentes.py — prueba en Chromium móvil (390×844) los ENTRENADORES AUTÓNOMOS (v2.324): se ven en Albanota, caminan, se les habla, sobreviven a recargar y no cuestan cuadros.
# Uso: node build.js && python3 tools/prueba_agentes.py   Última línea: «OK» o «FALLA: n». Deja la captura docs/agentes_v2324_390x844.png.
import sys, os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
CUADRO = "() => new Promise((res) => { let n = 0, t0 = performance.now(), mx = 0, ant = t0; const f = (t) => { mx = Math.max(mx, t - ant); ant = t; if (++n < 120) requestAnimationFrame(f); else res([(t - t0) / n, mx]); }; requestAnimationFrame(f); })"
COSTE = "() => { const A = G.agentes, e = __juego.est, t0 = performance.now(); for (let i = 0; i < 20 * 120; i++) A.avanzar(e, 0.05); return (performance.now() - t0) / (120 * 60); }"
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page()
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(2500)
    pg.evaluate("() => { for (let i = 0; i < 1200 && !G.vista.agentes(__juego.est, 'albanota').length; i++) __juego.creatureStep(0.05); }")   # la semilla cambia en cada sesión: si en este instante no hay nadie a la vista, se adelanta la simulación
    r = pg.evaluate("() => { const A = G.agentes, e = __juego.est; return { n: e.agentes.n, pob: e.agentes.pob.length, vis: G.vista.agentes(e, 'albanota') }; }")
    ok(r['pob'] == 24 and r['n'] > 20, 'la población existe y el reloj de la simulación avanza con el juego (%d entrenadores, tick %d)' % (r['pob'], r['n']))
    ok(len(r['vis']) >= 1, 'hay entrenadores con cuerpo en Albanota (%d)' % len(r['vis']))
    pg.evaluate("() => { const e = __juego.est; for (let i = 0; i < 20 * 90; i++) G.agentes.avanzar(e, 0.05); }")   # 90 s de mundo: ya van y vienen
    c = pg.evaluate("() => { const e = __juego.est, quieto = () => G.vista.agentes(e, 'albanota').find((q) => !q.mv && !q.duelo && q.al === undefined); for (let i = 0; i < 2400 && !quieto(); i++) __juego.creatureStep(0.05); const v = G.vista.agentes(e, 'albanota'), c = quieto() || v[0], j = e.jugadores.oli; j.x = c.x + 12; j.y = c.y; j.dir = 'left'; return c; }")
    pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(raiz, 'docs', 'agentes_v2324_390x844.png'))
    t = pg.evaluate("() => { const r = __juego.talk(); return r && r.texto ? r.nombre + ': ' + r.texto : JSON.stringify(r); }")
    ok(c['nom'] in t and 'Soy' in t, 'al hablarle se presenta (%s)' % t)
    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(raiz, 'docs', 'agentes_v2324_hablar_390x844.png'))
    # v2.325: caja de diálogo, el entrenador se para, y duelo jugador ↔ entrenador
    d = pg.evaluate("() => { const b = document.getElementById('dlg'); return b ? [b.querySelector('#dlg-n').textContent, b.querySelector('.dlg-tag span').textContent, !!__juego.est.agentes.par] : null; }")
    ok(bool(d) and d[0] == c['nom'] and 'Entrenador' in d[1] and d[2], 'se abre la caja de diálogo con su nombre y retrato, y el entrenador se queda parado (%s)' % d)
    pg.click('#dlg .dlg-txt'); pg.wait_for_timeout(250)
    ops = pg.evaluate("() => Array.from(document.querySelectorAll('#dlg .dlg-op b')).map((b) => b.textContent)")
    ok(ops == ['Charlar', 'Su equipo', 'Retar a un duelo', 'Despedirme'], 'el menú ofrece charlar, ver su equipo, retar y despedirse (%s)' % ops)
    pg.screenshot(path=os.path.join(raiz, 'docs', 'agentes_v2325_dialogo_390x844.png'))
    pg.click('#dlg .dlg-op:nth-child(1)'); pg.wait_for_timeout(200); pg.click('#dlg .dlg-txt'); pg.wait_for_timeout(150)
    ch = pg.evaluate("() => document.querySelector('#dlg .dlg-sr').textContent"); ok(len(ch) > 8 and '{' not in ch, 'al charlar cuenta lo que hace, con la frase entera (%s)' % ch)
    pg.click('#dlg .dlg-txt'); pg.wait_for_timeout(250); pg.click('#dlg .dlg-txt'); pg.wait_for_timeout(250)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.prog = { [G.equipo.actual(j)[0]]: { xp: G.nivel.xpPara(30) } }; const a = e.agentes.pob[+Object.keys(e.agentes.par)[0]]; delete a.vida; }")
    pg.click('#dlg .dlg-x'); pg.wait_for_timeout(200); suelto = pg.evaluate("() => !__juego.est.agentes.par && !document.getElementById('dlg')")
    ok(suelto, 'al cerrar la charla el entrenador sigue su camino')
    pg.evaluate("(id) => { const e = __juego.est, c = G.vista.agentes(e, 'albanota').find((q) => q.ag === id), j = e.jugadores.oli; j.x = c.x + 12; j.y = c.y; delete G.agentes.porId(e, id).vida; j.prog = Object.assign(j.prog || {}, { [G.equipo.actual(j)[0]]: { xp: G.nivel.xpPara(40) } }); }", c['ag'])   # el ganador depende de qué entrenador toque (la semilla cambia en cada sesión): era la causa del fallo intermitente de la v2.325
    pg.evaluate("() => __juego.talk()"); pg.wait_for_timeout(200); pg.click('#dlg .dlg-txt'); pg.wait_for_timeout(250); pg.click('#dlg .dlg-op:nth-child(3)'); pg.wait_for_timeout(200); pg.click('#dlg .dlg-txt'); pg.wait_for_timeout(200); pg.click('#dlg .dlg-txt'); pg.wait_for_timeout(1500)
    du = pg.evaluate("() => { const k = __juego.est.combate; return k && k.duelo ? [k.duelo.nom, k.c.u.length, !document.getElementById('dlg'), !document.getElementById('kbtn').hidden] : null; }")
    if not du: du = pg.evaluate("() => [document.getElementById('dlg') ? document.getElementById('dlg').innerText : 'sin dialogo', !!__juego.est.combate, __juego.est.avisos.slice(-2)]")
    ok(bool(du) and du[0] == c['nom'] and du[2] and du[3], 'retarle cierra el diálogo y empieza el combate contra su equipo, con el botón del especial (%s)' % du)
    pg.wait_for_timeout(1800); pg.screenshot(path=os.path.join(raiz, 'docs', 'agentes_v2325_duelo_390x844.png'))
    fin = pg.evaluate("() => new Promise((res) => { const t0 = performance.now(), f = () => { const e = __juego.est, k = e.combate; if (k && !k.fin && performance.now() - t0 < 60000) { for (let i = 0; i < 20 && e.combate && !e.combate.fin; i++) __juego.creatureStep(0.05); return setTimeout(f, 10); } res(k && k.fin ? k.fin.ganador : 'sin fin'); }; f(); })")
    pg.wait_for_timeout(2600); tras = pg.evaluate("(id) => { const e = __juego.est, a = G.agentes.porId(e, id); return [!e.combate, !!(e.agentes.par && e.agentes.par[a.i] && e.agentes.par[a.i].hold && a.rea), a.rel['j:oli'].du, document.getElementById('who').textContent]; }", c['ag'])
    pg.screenshot(path=os.path.join(raiz, 'docs', 'agentes_v2326_reaccion_390x844.png')); pg.wait_for_timeout(4800); suelto2 = pg.evaluate("() => !__juego.est.agentes.par")
    ok(fin in (0, 1) and tras[0] and tras[1] and suelto2 and tras[2] == 1, 'el duelo termina, el entrenador reacciona unos segundos quieto, lo recuerda y luego sigue su vida (ganador %s · %s)' % (fin, tras))
    for _ in range(4):   # alguno puede estar entrando en un edificio o parado un instante: se mira en varias ventanas
        m1 = pg.evaluate("() => { const e = __juego.est, a = G.vista.agentes(e, 'albanota').filter((q) => q.mv).map((q) => [q.ag, q.x, q.y]); return a; }"); pg.wait_for_timeout(600)
        m2 = pg.evaluate("() => { const e = __juego.est, o = {}; G.vista.agentes(e, 'albanota').forEach((q) => { o[q.ag] = [q.x, q.y]; }); return o; }")
        mov = [a for a in m1 if a[0] in m2 and abs(m2[a[0]][0] - a[1]) + abs(m2[a[0]][1] - a[2]) > 4]
        if len(m1) == 0 or len(mov) >= 1: break
    ok(len(m1) == 0 or len(mov) >= 1, 'los que caminan avanzan de verdad en pantalla (%d de %d)' % (len(mov), len(m1)))
    f = pg.evaluate(CUADRO); coste = pg.evaluate(COSTE)
    ok(coste < 0.5, 'la simulación cuesta %.4f ms por cuadro en el navegador (24 entrenadores; cuadro medio %.1f ms, peor %.1f ms)' % (coste, f[0], f[1]))
    di = pg.evaluate("() => { const e = __juego.est, ids = ['centro_pc', 'tienda'], vis = () => { for (const id of ids) { const q = G.vista.agentes(e, id).find((c) => c.al === undefined && !c.mv && !c.duelo); if (q) return [id, q]; } return null; }; for (let i = 0; i < 24000 && !vis(); i++) __juego.creatureStep(0.05); const v = vis(); if (!v) return null; const j = e.jugadores.oli; __juego.motor.aplicar(e, { j: 'oli', t: 'colocar', mapa: v[0], ancla: 'entrada' }); const q = G.vista.agentes(e, v[0]).find((c) => c.ag === v[1].ag) || v[1]; j.x = q.x + 3; j.y = q.y; return [v[0], v[1].nom, v[1].ag]; }")   # v2.326: se les ve dentro de los edificios
    pg.wait_for_timeout(500)
    if di: pg.screenshot(path=os.path.join(raiz, 'docs', 'agentes_v2326_interior_390x844.png'))
    di2 = pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli, v = G.vista.agentes(e, j.mapa); return [j.mapa, v.length, !!document.getElementById('c') || true]; }") if di else None
    ok(bool(di) and di2[1] >= 1, 'se ve a un entrenador dentro del edificio (%s)' % (di,))
    pg.evaluate("() => { __juego.guardar ? __juego.guardar() : G.guardado.escribir(__juego.est); }")
    h1 = pg.evaluate("() => [G.agentes.hash(__juego.est), __juego.est.agentes.n, JSON.parse(localStorage.getItem('criaturas_partida')).dim.tonavia.agentes.n]")
    ok(h1[2] > 0, 'el guardado del navegador lleva a los entrenadores (tick %d)' % h1[2])
    pg.goto('file://' + html + '?menu=1&sonido=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(600)
    h2 = pg.evaluate("() => { const e = __juego.est, a = e.agentes; return [a.n, a.pob.filter((q) => q.rel['j:oli']).length, a.cron.length, a.deuda]; }")
    ok(h2[0] >= h1[2] and h2[1] >= 1 and h2[2] > 0, 'tras recargar la página el mundo sigue donde estaba y el entrenador recuerda a Oli (tick %d, %d le conocen)' % (h2[0], h2[1]))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0&agentes=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    off = pg.evaluate("() => [!!__juego.est.agentes, G.vista.agentes(__juego.est, 'albanota').length]")
    ok(off == [False, 0], '?agentes=0 apaga el sistema entero')
    ok(not err, 'sin errores de consola %s' % err[:2])
    b.close()
print('OK' if not fallos else 'FALLA: %d' % len(fallos))
