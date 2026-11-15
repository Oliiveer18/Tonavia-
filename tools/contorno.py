#!/usr/bin/env python3
"""contorno.py — comprueba que TODOS los sprites (41 formas × 4 direcciones × 4 frames) tienen el contorno completo (v2.27.1).
Regla: ningún píxel opaco que no sea contorno puede tocar (4 vecinos) un píxel transparente ni el borde del lienzo. Sale con código 1 si falla alguno.
Uso: python3 tools/contorno.py   (necesita node; no necesita navegador)"""
import json, os, subprocess, sys, tempfile
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ids = [l.split("'")[1] for l in open(os.path.join(raiz, 'src/lineas.js'), encoding='utf-8') if l.strip().startswith('{ id:') or " { id: '" in l and 'name:' in l]
if not ids:
    import re; ids = re.findall(r"\{ id: '([a-z]+)', name:", open(os.path.join(raiz, 'src/lineas.js'), encoding='utf-8').read())
tmp = tempfile.mktemp(suffix='.json')
subprocess.check_call(['node', os.path.join(raiz, 'tools/render_sprites.js'), raiz, tmp, ','.join(ids), '0,1,2,3'])
D = json.load(open(tmp)); os.remove(tmp)
INK = (0x2a, 0x1b, 0x30); malas = {}
for i, v in D.items():
    for k, s in v.items():
        W, H, d = s['w'], s['h'], s['d']
        def a(x, y): return None if x < 0 or y < 0 or x >= W or y >= H else tuple(d[(y*W+x)*4:(y*W+x)*4+4])
        n = 0
        for y in range(H):
            for x in range(W):
                p = a(x, y)
                if p[3] == 0 or p[:3] == INK: continue
                if any((q := a(x+dx, y+dy)) is None or q[3] == 0 for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))): n += 1
        if n: malas.setdefault(i, []).append(f'{k}:{n}')
print(f'{len(D)} formas × 16 vistas comprobadas')
if malas:
    print('CONTORNO INCOMPLETO en', len(malas), 'formas:')
    for i, l in malas.items(): print(' ', i, ' '.join(l))
    sys.exit(1)
print('TODO BIEN: contorno completo en todas las vistas (sombreado activo).')
