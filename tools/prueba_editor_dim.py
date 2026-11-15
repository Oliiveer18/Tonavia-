#!/usr/bin/env python3
"""prueba_editor_dim.py — F8: el editor de mapas con mapas de OTRAS dimensiones (maps/<dim>/*.json, id «dim/mapa»).
Uso: node tools/editor_mapas.js && python3 tools/prueba_editor_dim.py
Comprueba: el editor los carga · sin tocar nada se exportan IDÉNTICOS al archivo (mar, region:null, sin base, pesca) · el id conserva el prefijo ·
«Exportar al juego» solo lleva los de Tonavia · «Probar en el juego» abre un mapa de otra dimensión sin errores."""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent
fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
ext = sorted((raiz / 'maps').glob('*/*.json'))
ok(len(ext) > 0, 'hay mapas de otras dimensiones en maps/<dim>/ (' + str(len(ext)) + ')')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + str(raiz / 'tools' / 'editor_mapas.html')); pg.wait_for_timeout(500)
    ok(not errs, 'sin errores de consola ' + str(errs[:2]))
    ids = pg.evaluate('Object.keys(window.__editor.maps)')
    for f in ext:
        j = json.loads(f.read_text(encoding='utf8')); i = j['id']
        ok(i in ids, 'el editor tiene ' + i)
        txt = pg.evaluate('(i)=>JSON.stringify(window.__editor.toJSON(window.__editor.maps[i]),null,1)', i)
        ok(txt == f.read_text(encoding='utf8'), 'round-trip idéntico al archivo: ' + i)
    paq = json.loads(pg.evaluate('window.__editor.paqueteJuego()'))
    ok(all('/' not in m['id'] for m in paq['maps']) and len(paq['maps']) > 0, 'Exportar al juego solo lleva mapas de Tonavia (' + str(len(paq['maps'])) + ')')
    ok(all(m['id'] in ids for m in paq['maps']), 'y todos existen en el editor')
    # Probar en el juego con un mapa de otra dimensión (con ancla «inicio»)
    cand = [json.loads(f.read_text(encoding='utf8'))['id'] for f in ext if 'inicio' in json.loads(f.read_text(encoding='utf8')).get('anclas', {})]
    ok(len(cand) > 0, 'hay un mapa externo con «inicio» para probar: ' + str(cand[:1]))
    if cand:
        i = cand[0]
        pg.evaluate("(i)=>{document.getElementById('mapSel').value=i; document.getElementById('mapSel').dispatchEvent(new Event('change'))}", i)
        ok(pg.evaluate('window.__editor.cur.id') == i, 'el editor abre ' + i)
        pg.evaluate("document.getElementById('aProbar').click()"); pg.wait_for_timeout(2500)
        fj = [f for f in pg.frames if f != pg.main_frame]
        ok(len(fj) == 1 and fj[0].evaluate("typeof window.__juego") == 'object', 'el juego arranca con un mapa de otra dimensión, sin errores')
        if fj:
            ok(fj[0].evaluate("G.mundo.INICIAL.mapa") == i, 'el juego empieza en ' + i)
            ok(fj[0].evaluate("G.mundo.mapa('albanota').id") == 'albanota', 'Tonavia intacta dentro de la prueba')
        ok(pg.evaluate("document.getElementById('pruebaMsg').innerText") == '', 'sin mensajes de error')
        pg.evaluate("document.getElementById('pruebaCerrar').click()")
    ok(not errs, 'sin errores de consola al final ' + str(errs[:2]))
    b.close()
print('FALLOS' if fallos else 'TODO OK'); sys.exit(1 if fallos else 0)
