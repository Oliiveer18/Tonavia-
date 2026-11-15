#!/usr/bin/env python3
# tools/prueba_entrenadores.py — v2.332: los entrenadores NPC se ven con su diseño propio en el juego real (2D), de día y de noche, sin errores. Capturas: docs/entrenadores_v2332_*_390x844.png
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True).new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    r = pg.evaluate("() => { const e = __juego.est, ag = e.agentes; const ids = ag.pob.map((a) => G.vista.agentes ? 0 : 0); const n = Object.keys(G.diseno || {}).length; return { n, pob: ag.pob.length }; }")
    pg.evaluate("() => { const e = __juego.est; for (let i = 0; i < 400; i++) G.agentes.avanzar(e, 0.25); }")
    # lleva al jugador a donde haya un entrenador visible
    for h in (12, 23):
        pg.evaluate("(h) => { const e = __juego.est; e.reloj = (h / 24 - G.ciclo.AJUSTES.FASE0) * G.ciclo.AJUSTES.DIA_S; }", h)
        hallado = pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; for (const id of Object.keys(G.mundo.mapas)) { const v = G.vista.agentes ? G.vista.agentes(e, id) : []; if (v.length) { j.mapa = id; j.x = v[0].x; j.y = v[0].y + 28; return { id, n: v.length, sprites: v.map((q) => q.id) }; } } return null; }")
        pg.wait_for_timeout(700)
        if hallado:
            pg.screenshot(path=os.path.join(raiz, 'docs', 'entrenadores_v2332_%s_390x844.png' % ('dia' if h == 12 else 'noche'))); print(h, hallado['id'], hallado['n'], 'entrenadores')
        ok(bool(hallado) and all(s.startswith('ag') and s != 'oli' for s in hallado['sprites']), 'a las %d h hay entrenadores a la vista con sprite propio' % h)
    pose = pg.evaluate("() => { const e = __juego.est, ag = e.agentes; const a = ag.pob.find((q) => !q.paso || !q.paso.dentro); if (!a) return null; const t = G.agentes.ahora(ag) + ag.acc; a.rea = [t + 5, 'g', t - 1]; const v = []; Object.keys(G.mundo.mapas).forEach((id) => (G.vista.agentes(e, id) || []).forEach((q) => { if (q.ag === a.id) v.push(q.id); })); a.rea = [t + 5, 'p', t - 1]; const w = []; Object.keys(G.mundo.mapas).forEach((id) => (G.vista.agentes(e, id) || []).forEach((q) => { if (q.ag === a.id) w.push(q.id); })); a.rea = null; return { g: v, p: w }; }")
    ok(pose is None or ((not pose['g'] or pose['g'][0].endswith('_g')) and (not pose['p'] or pose['p'][0].endswith('_p'))), 'reacción tras un duelo: victoria y derrota usan su pose propia %s' % pose)
    d = pg.evaluate("() => Object.keys(G.diseno || {}).length"); ok(d >= 1, 'se han creado %d diseños durante la partida' % d)
    b.close()
ok(not err, 'sin errores de página %s' % err[:2]); print('OK' if not fallos else 'FALLA: %d' % len(fallos)); sys.exit(1 if fallos else 0)
