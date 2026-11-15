#!/usr/bin/env python3
"""ID-1b: imagen de prueba de un trozo de Albanota a 390x844 (zoom 3). Uso: python3 tools/escena_albanota.py [salida.png] [--sin-zoom]
Carga dist/criaturas.html en Chromium (usa el motor real: paleta, rampas, sprites de Oli, Lali y criaturas) y ejecuta
tools/escena_albanota.js + tools/escena_albanota_objetos.js. No cambia el juego."""
import sys, os, base64
from playwright.sync_api import sync_playwright

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
salida = next((a for a in sys.argv[1:] if not a.startswith('--')), os.path.join(raiz, 'docs', 'albanota_prueba_390x844.png'))
leer = lambda n: open(os.path.join(raiz, 'tools', n), encoding='utf-8').read()

FINAL = r"""
(() => {
  const E = window.__escena, G = E.G, ctx = E.ctx, W = E.W, H = E.H;
  const spr = (id) => G.spr[id];
  const persona = (nombre, dir, f, x, y) => { const s = G.spr[`${G.NAMES[nombre]}_${dir}_${f}`]; E.items.push({ l: { c: s.c, w: s.w, h: s.h }, x: x - s.w / 2, y: y - s.h + 2, foot: y }); };
  const bicho = (id, dir, f, x, y) => { const s = G.creatureSprite(id, dir, f); E.items.push({ l: { c: s.c, w: s.w, h: s.h }, x: x - s.w / 2, y: y - s.h + 2, foot: y }); };
  persona('lali', 'down', 0, 48, 224); persona('oli', 'down', 0, 66, 224);
  bicho('dandel', 'down', 0, 28, 192); bicho('aguacato', 'down', 0, 56, 276);
  E.items.sort((a, b) => a.foot - b.foot);
  E.items.forEach((it) => ctx.drawImage(it.l.c, Math.round(it.x), Math.round(it.y)));
  const ZOOM = window.__zoom || 3, VW = Math.round(390 / ZOOM), VH = Math.ceil(844 / ZOOM), OX = 7, OY = 3;
  const out = document.createElement('canvas'); out.width = 390; out.height = 844;
  const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
  o.drawImage(E.cv, OX, OY, VW, VH, 0, 0, VW * ZOOM, VH * ZOOM);
  return out.toDataURL('image/png');
})()
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    errores = []
    pg.on('pageerror', lambda e: errores.append(str(e)))
    pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.path.join(raiz, 'dist', 'criaturas.html') + '?mapa=pueblo_inicial')
    pg.wait_for_timeout(500)
    pg.evaluate(leer('escena_albanota.js'))
    pg.evaluate(leer('escena_albanota_objetos.js'))
    url = pg.evaluate(FINAL)
    b.close()
if errores:
    print('ERRORES:', errores[:5]); sys.exit(1)
open(salida, 'wb').write(base64.b64decode(url.split(',')[1]))
print('OK', salida)
