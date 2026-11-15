#!/usr/bin/env python3
# tools/hoja_entrenadores.py — v2.332: hoja de contacto de los entrenadores (frente, espalda, perfil, pasos) frente a Oli y Lali. Uso: python3 tools/hoja_entrenadores.py [n=30] [salida.png]
import os, sys
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html')
n = int(sys.argv[1]) if len(sys.argv) > 1 else 30; REAL = 'real' in sys.argv; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(raiz, 'docs', 'entrenadores_hoja.png'); err = []
JS = """(n) => { const REAL = __REAL__; const AM = ['campeon','coleccionista','explorador','criador','mercader'], K = 4, cols = 4, cw = 6*18*K+14, ch = 24*K+22, c = document.createElement('canvas'); c.width = cols*cw; c.height = Math.ceil((n+2)/cols)*ch; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#6b7a52'; x.fillRect(0,0,c.width,c.height); x.font = '10px monospace';
  const fila = (id, i, tit) => { const ox = (i%cols)*cw, oy = Math.floor(i/cols)*ch; x.fillStyle = '#fff'; x.fillText(tit, ox+4, oy+10); ['down_0','up_0','side_0','side_1','g_down_0','p_down_0'].forEach((v, k) => { const s = G.spr[id+'_'+v]; if (s) x.drawImage(s.c, ox+k*18*K+4, oy+14, 18*K, 24*K); }); };
  fila('rex', 0, 'Oli'); fila('luna', 1, 'Lali');
  const pob = (window.__juego && __juego.est.agentes && location.hash !== '#') ? __juego.est.agentes.pob : null; for (let k = 0; k < n; k++) { const a = pob && REAL ? pob[k] : { i: k, asp: (k*137+11)%1000, amb: AM[k%5] }, id = G.entrenadores.sprite(a), d = G.diseno[id]; fila(id, k+2, k+' '+d.amb.slice(0,4)+' '+d.cuerpo.slice(0,4)+' '+d.pelo.slice(0,5)+' '+d.ropa.slice(0,5)+' '+d.comp.join('+')); }
  return c.toDataURL('image/png'); }"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 400, 'height': 800}); pg.on('pageerror', lambda e: err.append(str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0'); pg.wait_for_timeout(500)
    if REAL: pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    u = pg.evaluate(JS.replace('__REAL__', 'true' if REAL else 'false'), n); b.close()
import base64; open(out, 'wb').write(base64.b64decode(u.split(',')[1])); print('hoja:', out, 'errores:', err)
