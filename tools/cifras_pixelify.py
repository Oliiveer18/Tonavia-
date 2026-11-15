#!/usr/bin/env python3
"""tools/cifras_pixelify.py — genera tools/pixelify_num_400.woff2 y pixelify_num_700.woff2 (v2.319.3): SOLO las cifras 0-9, dibujadas en la misma rejilla de 5×7 píxeles y con el mismo
recorte de esquinas que Pixelify Sans, pero con formas que no se confunden entre sí (5 con barra recta arriba, 6 con la panza abierta, 8 con cintura, 3/9 distintos).
Dos pesos (400 y 700) con el trazo medido en Pixelify Sans en cada peso, para que las cifras tengan el mismo grosor que las letras. El tema (tools/tema_ui.py) las incrusta y se usan SOLO para los dígitos (unicode-range); el resto del texto sigue en Pixelify. Uso: python3 tools/cifras_pixelify.py   (necesita fontTools y brotli)"""
import os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
G = {
 '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
 '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],   # ancho de 3 columnas (como el 1 de Pixelify): no deja hueco al lado
 '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
 '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
 '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
 '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
 '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
 '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
 '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
 '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
}
# Medidas reales de Pixelify Sans (variable, eje wght) por peso: X0/Y0 = borde izquierdo/inferior, W/H = ancho/alto del glifo, T = grosor de los palos verticales, TV = grosor de las barras horizontales,
# W1 = ancho del 1 (3 columnas), ADV/ADV1 = avance. Los palos se reparten con la separación (W-T)/(columnas-1): así el grosor crece con el peso igual que en las letras.
PESOS = {400: dict(X0=60, Y0=-12, W=465, H=643, T=101, TV=99, W1=283, ADV=586, ADV1=404), 700: dict(X0=61, Y0=-11, W=481, H=649, T=127, TV=135, W1=304, ADV=603, ADV1=426)}
def glifo(filas, m):
    n = len(filas[0]); W = m['W1'] if n == 3 else m['W']; px = (W - m['T']) / (n - 1); py = (m['H'] - m['TV']) / 6; pen = TTGlyphPen(None)
    for r, fila in enumerate(filas):
        c = 0
        while c < n:
            if fila[c] == '#':
                e = c
                while e < n and fila[e] == '#': e += 1
                x0 = m['X0'] + c * px; x1 = m['X0'] + (e - 1) * px + m['T']; top = m['Y0'] + m['H'] - r * py; y1 = top; y0 = top - m['TV']
                x0, x1, y0, y1 = round(x0), round(x1), round(y0), round(y1)
                pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath(); c = e
            else: c += 1
    return pen.glyph()
orden = ['.notdef'] + ['uni%04X' % ord(k) for k in G]
for peso, m in PESOS.items():
    fb = FontBuilder(1000, isTTF=True); fb.setupGlyphOrder(orden); fb.setupCharacterMap({ord(k): 'uni%04X' % ord(k) for k in G})
    gl = {'.notdef': TTGlyphPen(None).glyph()}; gl.update({'uni%04X' % ord(k): glifo(v, m) for k, v in G.items()}); fb.setupGlyf(gl)
    fb.setupHorizontalMetrics({n: ((m['ADV1'] if n == 'uni0031' else m['ADV']), m['X0']) for n in orden}); fb.setupHorizontalHeader(ascent=920, descent=-280)
    fb.setupNameTable({'familyName': 'PixelifyNum', 'styleName': 'Bold' if peso == 700 else 'Regular'}); fb.setupOS2(sTypoAscender=920, sTypoDescender=-280, usWinAscent=920, usWinDescent=280, usWeightClass=peso); fb.setupPost()
    fb.font.flavor = 'woff2'; out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pixelify_num_%d.woff2' % peso); fb.save(out); print('escrito', out, os.path.getsize(out), 'bytes')
