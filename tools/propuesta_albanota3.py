#!/usr/bin/env python3
"""v2.53: imagen de referencia de Albanota (propuesta de la auditoría urbanística), 48x36 casillas, motor y piezas reales.
Uso: python3 tools/propuesta_albanota3.py  (necesita dist/criaturas.html y playwright). No cambia el juego.
Escribe docs/albanota_v253_propuesta_limpia.png (sin anotar; la anotada se hizo a mano encima). Centro PC, Tienda y Ermita son volúmenes provisionales."""
import os, base64
from playwright.sync_api import sync_playwright
from PIL import Image
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda n: open(os.path.join(raiz, 'tools', n), encoding='utf-8').read()
piezas = rd('escena_albanota_piezas.js').replace('window.__piezas = { campana, casa,', 'window.__piezas = { arbusto, cultivo, espantapajaros, campana, casa,')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); err = []
    pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?mapa=pueblo_inicial'); pg.wait_for_timeout(400)
    pg.evaluate(rd('escena_albanota3.js')); pg.evaluate(piezas); pg.evaluate(rd('escena_albanota3_objetos.js'))
    u = pg.evaluate('window.__render()'); b.close()
tmp = os.path.join(raiz, 'docs', '_tmp.png'); open(tmp, 'wb').write(base64.b64decode(u.split(',')[1]))
im = Image.open(tmp).convert('RGB'); im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(os.path.join(raiz, 'docs', 'albanota_v253_propuesta_limpia.png')); os.remove(tmp)
print('ERRORES' if err else 'OK', err[:3])
