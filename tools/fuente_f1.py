#!/usr/bin/env python3
"""F1 (v2.91a): imagen de CONCEPTO de la fuente redonda de dos niveles para el HD-2D (opcion B). No es el motor: solo dibuja el aspecto propuesto. Uso: python3 tools/fuente_f1.py -> docs/fuente_f1_opcionB_390x540.png"""
import math, os
from PIL import Image, ImageDraw
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, S = 130, 150, 3
CX = 65
img = Image.new('RGB', (W, H), (232, 205, 150)); px = img.load()
def mix(c, k): return tuple(max(0, min(255, int(v * k))) for v in c)
PIEDRA = (150, 150, 162); AZUL = (62, 112, 190); ROSA = (226, 140, 170); ORO = (236, 192, 70)
AGUA1 = (74, 150, 226); AGUA2 = (52, 118, 200); BRILLO = (211, 232, 255)
def elipse(cy, r, col_fn, ratio=0.5):
    ry = max(1, int(r * ratio))
    for y in range(cy - ry, cy + ry + 1):
        for x in range(CX - r, CX + r + 1):
            dx, dy = (x - CX + 0.0) / r, (y - cy + 0.0) / ry
            if dx * dx + dy * dy <= 1 and 0 <= x < W and 0 <= y < H: px[x, y] = col_fn(x, y, dx, dy)
def lado(base, junta=22, curso=6):  # piedra con sillares: luz a la izquierda, juntas en trabazon
    def f(x, y, dx, dy):
        u = max(-1, min(1, (x - CX) / max(1, abs(dx and (x - CX) / dx) or 1)))
        ang = math.degrees(math.asin(max(-1, min(1, dx)))); k = 1.12 - 0.42 * (dx + 1) / 2
        fila = y // curso; j = (ang + 90 + (fila % 2) * junta / 2) % junta
        if j < 1.5 or y % curso == 0: k *= 0.82
        return mix(base, k)
    return f
def tronco(cy0, r0, cy1, r1, base, **kw):  # tronco de cono: de abajo (cy0, r0) a arriba (cy1, r1)
    n = abs(cy0 - cy1)
    for i in range(n + 1):
        t = i / max(1, n); cy = round(cy0 + (cy1 - cy0) * t); r = round(r0 + (r1 - r0) * t)
        elipse(cy, r, lado(base, **kw))
def anillo(cy, r, ri, col, col2):  # cara de arriba: borde de piedra y, dentro, agua
    elipse(cy, r, lambda x, y, dx, dy: mix(col, 1.1 + 0.08 * dy))
    elipse(cy + 1, ri, lambda x, y, dx, dy: (AGUA1 if (x * 7 + y * 13) % 11 else BRILLO) if (y % 5 == 0 and (x + y) % 6 < 2) else (AGUA2 if dy > 0.35 else AGUA1))
def oro(cy, r):  # filete dorado del borde
    for x in range(CX - r, CX + r + 1):
        dx = (x - CX) / r; y = cy + int(math.sqrt(max(0, 1 - dx * dx)) * r * 0.5)
        if 0 <= y < H: px[x, y] = ORO; px[x, y - 1] = mix(ORO, 1.15)
# sombra en el suelo
elipse(118, 56, lambda x, y, dx, dy: (214, 186, 134))
# 1 estanque
tronco(117, 46, 103, 46, PIEDRA); anillo(103, 46, 38, mix(PIEDRA, 1.15), None); oro(103, 46)
# 2 pedestal
tronco(106, 13, 97, 11, mix(PIEDRA, 0.95))
# 3 taza grande (tronco abierto con franjas azul y rosa)
tronco(97, 11, 84, 27, AZUL, junta=30, curso=7); anillo(84, 27, 23, mix(AZUL, 1.35), None); oro(84, 27)
# 4 columna
tronco(86, 6, 68, 5, mix(PIEDRA, 1.0), junta=60, curso=9)
# 5 taza pequena
tronco(68, 5, 59, 15, ROSA, junta=40, curso=6); anillo(59, 15, 12, mix(ROSA, 1.2), None); oro(59, 15)
# 6 campana y remate
tronco(60, 4, 49, 7, AZUL, junta=60, curso=5)
elipse(46, 4, lambda x, y, dx, dy: ORO, ratio=0.9)
# 7 chorros: arcos de la taza pequena a la grande y de la grande al estanque
def arco(x0, y0, x1, y1, alto, n, fase):
    for i in range(n):
        t = ((i + fase) % n) / n; x = round(x0 + (x1 - x0) * t); y = round(y0 + (y1 - y0) * t - alto * 4 * t * (1 - t))
        for (a, b, c) in ((0, 0, BRILLO), (0, 1, (255, 255, 255))):
            if 0 <= x < W and 0 <= y + b < H: px[x + a, y + b] = c
for s in (-1, 1):
    arco(CX + s * 12, 59, CX + s * 24, 86, 6, 7, 0 if s < 0 else 3)
    arco(CX + s * 26, 85, CX + s * 36, 106, 8, 8, 1 if s < 0 else 4)
    arco(CX + s * 4, 64, CX + s * 9, 86, 3, 4, 0)
# salpicaduras en el estanque
for (x, y) in ((CX - 37, 107), (CX + 37, 107), (CX - 36, 108), (CX + 36, 108), (CX - 38, 107), (CX + 38, 107)): px[x, y] = BRILLO
lienzo = Image.new("RGB", (390, 540), (31, 27, 46)); g = img.resize((W * S, H * S), Image.NEAREST); lienzo.paste(g, (0, 20))
d = ImageDraw.Draw(lienzo)
d.text((10, 6), 'Fuente HD-2D · opcion B (dos niveles) · concepto F1', fill=(240, 230, 200))
for i, (n, c) in enumerate((('piedra', PIEDRA), ('azul', AZUL), ('rosa', ROSA), ('oro', ORO), ('agua', AGUA1), ('brillo', BRILLO))):
    d.rectangle((10 + i * 62, 490, 62 + i * 62, 508), fill=c); d.text((14 + i * 62, 511), n, fill=(240, 230, 200))
d.text((10, 478), 'paleta (la del 2D: piedra gris, campana azul y rosa, filetes dorados)', fill=(200, 190, 170))
out = os.path.join(raiz, 'docs', 'fuente_f1_opcionB_390x540.png'); lienzo.save(out); print(out)
