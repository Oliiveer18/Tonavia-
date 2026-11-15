#!/usr/bin/env python3
"""Dibuja las texturas de Oli 3D (v2.115, paso 3b-1) ampliadas x16, con una cuadrícula fina por texel.
Uso: node tools/volcar_oli_tex.js > /tmp/oli_tex.json && python3 tools/texturas_oli.py /tmp/oli_tex.json docs/oli_paso3b_cara.png   (necesita PIL)"""
import json, sys
from PIL import Image, ImageDraw
tex = json.load(open(sys.argv[1])); Z = 16; M = 12
W = sum(t['w'] * Z + M for t in tex) + M; H = max(t['h'] for t in tex) * Z + 2 * M
img = Image.new('RGB', (W, H), (122, 190, 110)); d = ImageDraw.Draw(img); x0 = M
for t in tex:
    for y, fila in enumerate(t['px']):
        for x, c in enumerate(fila):
            if c: d.rectangle((x0 + x * Z, M + y * Z, x0 + x * Z + Z - 1, M + y * Z + Z - 1), fill=tuple(int(c[i:i+2], 16) for i in (1, 3, 5)))
    for x in range(t['w'] + 1): d.line((x0 + x * Z, M, x0 + x * Z, M + t['h'] * Z), fill=(0, 0, 0, 40) if False else (60, 50, 70), width=1)
    for y in range(t['h'] + 1): d.line((x0, M + y * Z, x0 + t['w'] * Z, M + y * Z), fill=(60, 50, 70), width=1)
    x0 += t['w'] * Z + M
img.save(sys.argv[2]); print('ok', sys.argv[2], img.size)
