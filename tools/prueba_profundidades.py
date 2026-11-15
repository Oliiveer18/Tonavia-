#!/usr/bin/env python3
# tools/prueba_profundidades.py — prueba en Chromium móvil (v2.320) las Profundidades: boca de la cueva en Albanota, campamento, bajar a pie, rótulo y minimapa, un piso de cada bioma
# (con captura 390×844 caminando por él), santuario (elegir bendición), estela, cofre, criaturas en la sala de combate, rendimiento del pintor y sin errores de consola.
# Uso: node build.js && python3 tools/prueba_profundidades.py [dist/criaturas.html] [carpeta_capturas]   (necesita playwright). Última línea: «OK» o «FALLA: n».
import sys, os
from playwright.sync_api import sync_playwright
aqui = os.path.dirname(os.path.abspath(__file__)); raiz = os.path.dirname(aqui)
html = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'dist', 'criaturas.html'))
sal = sys.argv[2] if len(sys.argv) > 2 else os.path.join(raiz, 'docs')
err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def foto(pg, n): pg.screenshot(path=os.path.join(sal, 'prof_v2320_%s_390x844.png' % n))
IR = """([b, n, tipo]) => { const J = __juego, P = G.profundidades, e = J.est, o = e.jugadores.oli, l = e.jugadores.lali; delete e.acomp; e.prof = null; P.empezar(e, o, b, 0); P.empezar(e, l, b, 0); const x = e.prof.exp;
  let m = null; for (let s = 0; s < 400 && !m; s++) { x.sem = P.hash('prueba|' + b + s); x.pisos = {}; const q = J.mundo.mapa(P.idMapa(x.bioma0, x.sem, n)); if (!tipo || q.prof.especial === tipo || q.prof.salas.some((z) => z.tipo === tipo)) m = q; }
  [o, l].forEach((j, i) => { J.motor.estadoMapa(e, m.id); j.mapa = m.id; j.x = m.anclas.entrada[0] * 16 + 8; j.y = m.anclas.entrada[1] * 16 + 14; j.profEn = null; }); return m.prof.bioma + ' ' + m.prof.tipo; }"""
A = """(t) => { const J = __juego, e = J.est, o = e.jugadores.oli, l = e.jugadores.lali, m = J.mundo.mapa(o.mapa), g = m.prof.g, q = m.prof.els.find((z) => z.t === t); if (!q) return false;
  const v = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([a, b]) => [q.x + a, q.y + b]).find(([x, y]) => g[y][x] !== '#' && !m.prof.els.some((z) => z.x === x && z.y === y)); if (!v) return false;
  o.x = v[0] * 16 + 8; o.y = v[1] * 16 + 14; o.dir = v[1] > q.y ? 'up' : v[1] < q.y ? 'down' : v[0] > q.x ? 'left' : 'right'; l.x = o.x; l.y = o.y; return true; }"""
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and err.append('consola: ' + m.text)); pg.on('pageerror', lambda e: err.append('error de página: ' + str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(700)
    # ── boca de la cueva en Albanota → campamento → piso 1, andando ──
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; delete e.acomp; j.x = 9 * 16 + 8; j.y = 6 * 16 + 14; }"); pg.wait_for_timeout(500); foto(pg, 'boca')
    pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(1300); pg.keyboard.up('ArrowUp'); pg.wait_for_timeout(500)
    ok(pg.evaluate("__juego.est.jugadores.oli.mapa") == 'prof_cristal_0_0', 'andando hacia la boca se entra al campamento'); ok(pg.is_visible('#phud') and 'Campamento' in pg.inner_text('#phud'), 'el rótulo dice «Campamento»'); foto(pg, 'campamento')
    ok(pg.is_hidden('#minib'), 'el minimapa del mundo se oculta bajo tierra')
    ok(pg.evaluate(A, 'estela'), 'hay una estela en el campamento'); pg.evaluate("__juego.talk()"); pg.wait_for_timeout(250); ok(pg.is_visible('#pmodal') and 'récord' in pg.inner_text('#pmodal'), 'la estela enseña los récords'); pg.click('#pmodal button'); pg.wait_for_timeout(150)
    pg.evaluate("() => { const J = __juego, j = J.est.jugadores.oli, m = J.mundo.mapa(j.mapa); j.x = m.anclas.entrada[0] * 16 + 8; j.y = m.anclas.entrada[1] * 16 + 14; }")
    pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(2600); pg.keyboard.up('ArrowUp'); pg.wait_for_timeout(600)
    ok(pg.evaluate("G.profundidades.resumen(__juego.est, __juego.est.jugadores.oli).piso") == 1, 'por la escalera se baja al piso 1'); ok('Piso 1' in pg.inner_text('#phud') and pg.is_visible('#pmini'), 'rótulo «Piso 1» y minimapa de la cueva visibles')
    r = pg.eval_on_selector('#phud', 'e => { const a = e.getBoundingClientRect(), m = document.getElementById("pmini").getBoundingClientRect(); return [a.right, m.left, a.left, m.right, innerWidth]; }'); ok(r[0] <= r[1] and r[2] >= 0 and r[3] <= r[4], 'el rótulo y el minimapa no se pisan y caben en 390 px')
    v0 = pg.evaluate("(() => { const e = __juego.est, m = __juego.mundo.mapa(e.jugadores.oli.mapa); return ((G.profundidades.ps(e, m) || { visto: '' }).visto.match(/[1-9a-f]/g) || []).length; })()")
    for k in ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp']: pg.keyboard.down(k); pg.wait_for_timeout(350); pg.keyboard.up(k)
    v1 = pg.evaluate("(() => { const e = __juego.est, m = __juego.mundo.mapa(e.jugadores.oli.mapa); return ((G.profundidades.ps(e, m) || { visto: '' }).visto.match(/[1-9a-f]/g) || []).length; })()"); ok(v1 >= v0 and v0 > 0, 'el minimapa se va revelando al caminar (%d → %d)' % (v0, v1))
    # ── un piso de cada bioma, con captura caminando ──
    for bio, piso, tipo in [('cristal', 3, 'puzle'), ('mina', 4, 'puzle'), ('hongos', 3, 'puzle'), ('inundada', 6, 'puzle'), ('hielo', 8, 'puzle')]:
        pg.evaluate(IR, [bio, piso, tipo]); pg.wait_for_timeout(500); foto(pg, bio + '_entrada')
        pg.evaluate("() => { const J = __juego, e = J.est, o = e.jugadores.oli, l = e.jugadores.lali, m = J.mundo.mapa(o.mapa), s = m.prof.salas.find((q) => q.tipo === 'puzle'), dx = s.E[0] < s.S[0] ? 1 : -1; o.x = (s.E[0] + dx) * 16 + 8; o.y = s.E[1] * 16 + 14; l.x = o.x + dx * 16; l.y = o.y; }"); pg.wait_for_timeout(500)
        ok('Pista:' in pg.inner_text('#phud') and pg.is_visible('#phud .pb button >> text=Reiniciar sala'), bio + ': en un puzle sin resolver salen la pista y «Reiniciar sala»'); foto(pg, bio + '_puzle')
    ms = pg.evaluate("(() => { const t = performance.now(); for (let i = 0; i < 60; i++) __juego.draw(); return (performance.now() - t) / 60; })()"); ok(ms < 12, 'pintar un cuadro de la cueva (suelo, objetos, luz) cuesta %.1f ms' % ms)
    # ── cofre, santuario, sala de combate ──
    pg.evaluate(IR, ['mina', 2, None]); b0 = pg.evaluate("G.tienda.saldo(__juego.est.jugadores.oli)")
    if pg.evaluate(A, 'cofre'):
        pg.wait_for_timeout(200); pg.evaluate("__juego.talk()"); pg.wait_for_timeout(200); ok(pg.evaluate("G.tienda.saldo(__juego.est.jugadores.oli)") > b0 and int(pg.inner_text('#bril')) > b0, 'abrir un cofre con el botón de hablar da Brillos (HUD al día)'); foto(pg, 'cofre')
    pg.evaluate(IR, ['hongos', 7, 'santuario']); ok(pg.evaluate(A, 'altar'), 'hay un santuario'); pg.wait_for_timeout(300); pg.evaluate("__juego.talk()"); pg.wait_for_timeout(250)
    ok(pg.is_visible('#pmodal') and len(pg.query_selector_all('#pmodal button')) == 4, 'el santuario ofrece 3 bendiciones y «Ahora no»'); foto(pg, 'santuario'); pg.click('#pmodal button >> nth=0'); pg.wait_for_timeout(300)
    ok(pg.evaluate("__juego.est.prof.exp.mods.length") == 1 and pg.is_visible('#phud .pm.ben'), 'la bendición elegida queda en la expedición y en el rótulo')
    pg.evaluate(IR, ['cristal', 1, None]); pg.evaluate("() => { const J = __juego, e = J.est, o = e.jugadores.oli, m = J.mundo.mapa(o.mapa), z = m.zonas[0]; if (z) { const h = e.mapas[m.id].plan.huecos.find((q) => q.grupo === z.id); if (h) { o.x = h.tx * 16 + 8 + 20; o.y = h.ty * 16 + 14; } } }"); pg.wait_for_timeout(700)
    ok(pg.evaluate("__juego.creatures.length") >= 1 and pg.is_visible('#kbtn'), 'en la sala de combate salen criaturas y el botón de combate'); foto(pg, 'combate')
    pg.click('#phud .pb button >> text=Salir'); pg.wait_for_timeout(200); pg.click('#phud .pb button >> text=Seguro'); pg.wait_for_timeout(500); ok(pg.evaluate("G.profundidades.resumen(__juego.est, __juego.est.jugadores.oli).piso") == 0, '«Salir» (dos toques) devuelve al campamento')
    # ── guardar dentro de la cueva y recargar ──
    pg.evaluate(IR, ['inundada', 2, None]); idm = pg.evaluate("(() => { G.guardado.escribir(__juego.est); return __juego.est.jugadores.oli.mapa; })()"); pg.goto('file://' + html + '?sonido=0'); pg.wait_for_timeout(900)
    if pg.is_visible('[data-pick=oli]'): pg.click('[data-pick=oli]'); pg.wait_for_timeout(500)
    ok(pg.evaluate("__juego.est.jugadores.oli.mapa") == idm and pg.is_visible('#phud'), 'al recargar se sigue en el mismo piso de la cueva')
    b.close()
for e in err: print(' ERROR ' + e)
n = len(fallos) + len(err); print('OK' if not n else 'FALLA: %d' % n); sys.exit(1 if n else 0)
