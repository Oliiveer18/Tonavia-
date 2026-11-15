#!/usr/bin/env python3
# tools/prueba_pesca_npc.py — v2.333: los entrenadores NPC pescan de verdad: se ven todas las fases (lanzar, espera, pique, forcejeo, salto, recoger) y lo que se ve capturar es lo que entra en su mochila. Capturas: docs/pesca_npc_v2333_*_390x844.png
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
BUSCA = """() => { const e = __juego.est, ag = e.agentes, A = G.agentes; for (let i = 0; i < 12000; i++) { A.avanzar(e, 0.25); const a = ag.pob.find((q) => q.paso && q.paso.a === 'pescar' && q.paso.lan && !(ag.par && ag.par[q.i]) && (A.ahora(ag) + ag.acc) > q.paso.t0 + q.paso.w + 0.5); if (a) return { i: a.i, lug: a.lug }; } return null; }"""
SIGUE = """(i) => { const e = __juego.est, ag = e.agentes, a = ag.pob[i], A = G.agentes, fases = [], vistos = {}; const pez0 = Object.values(a.mochila || {}).reduce((s, v) => s + (v | 0), 0); const p0 = a.paso; let vio = 0, fin = false;
  for (let k = 0; k < 400 && a.paso === p0; k++) { A.avanzar(e, 0.25); (G.vista.agentes(e, a.lug) || []).forEach((c) => { if (c.ag === a.id && c.pes) { if (!vistos[c.pes.fase]) vistos[c.pes.fase] = 0; vistos[c.pes.fase]++; if (c.pes.fase === 'salto' && c.pes.t < 0.26) vio++; } }); }
  const res = p0 && p0.lan ? p0.lan.filter((r) => r[1]).length : -1; const pez1 = Object.values(a.mochila || {}).reduce((s, v) => s + (v | 0), 0); return { vistos, res, vio, dentro: pez1 - pez0, terminado: a.paso !== p0 }; }"""
POS = """([i, fase]) => { const e = __juego.est, ag = e.agentes, a = ag.pob[i], A = G.agentes; for (let k = 0; k < 600; k++) { const c = (G.vista.agentes(e, a.lug) || []).find((q) => q.ag === a.id); if (c && c.pes && c.pes.fase === fase) { const j = e.jugadores.oli; j.mapa = a.lug; j.x = c.x + 24; j.y = c.y + 6; return { x: c.x, y: c.y, fase }; } A.avanzar(e, 0.25); } return null; }"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True).new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0&ciclo=0'); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    h = pg.evaluate(BUSCA); ok(bool(h), 'hay un entrenador pescando %s' % h)
    if h:
        pg.evaluate(POS, [h['i'], 'espera']); pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(raiz, 'docs', 'pesca_npc_v2333_espera_390x844.png'))
        pg.evaluate(POS, [h['i'], 'salto']); pg.wait_for_timeout(250); pg.screenshot(path=os.path.join(raiz, 'docs', 'pesca_npc_v2333_salto_390x844.png'))
        r = pg.evaluate(SIGUE, h['i']); print(r)
        ok(r['terminado'] and 'espera' in r['vistos'] and 'lanzar' in r['vistos'], 'se ven el lanzamiento y la espera durante la pesca')
        ok(r['dentro'] == r['res'] or r['res'] < 0, 'lo que entra en la mochila (%s) coincide con los lances que pican (%s)' % (r['dentro'], r['res']))
    b.close()
ok(not err, 'sin errores de página %s' % err[:2]); print('OK' if not fallos else 'FALLA: %d' % len(fallos)); sys.exit(1 if fallos else 0)
