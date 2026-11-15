#!/usr/bin/env python3
"""Rasterizador con z-buffer de la geometría REAL de Oli 3D con la CARA texturada (v2.118, paso 3b-2 mitad 2; v2.125: + trenzas con textura).
Uso: node tools/volcar_oli.js > /tmp/oli_geo.json && node tools/volcar_oli_tex.js > /tmp/oli_tex.json && python3 tools/cara_oli.py /tmp/oli_geo.json salida.png /tmp/oli_tex.json   (necesita PIL)
Filas 1-3: las 3 poses (quieto, pie derecho arriba, pie izquierdo arriba) con la cámara a 0, 90, 180 y 270 grados (los 4 giros). Fila 4: Oli andando hacia el sur, el este, el norte y el oeste, con la cámara a 0 grados."""
import json, math, sys
from PIL import Image, ImageDraw
geo = json.load(open(sys.argv[1])); salida = sys.argv[2]; TEXS = {t['id']: t for t in json.load(open(sys.argv[3]))}; TEX = TEXS['cabeza_sur']; TEXC = {('torso', 1): 'torso_sur', ('torso', -1): 'torso_norte', ('manga_d', 1): 'manga_d_sur', ('manga_i', 1): 'manga_i_sur', ('manga_d', -1): 'manga_d_norte', ('manga_i', -1): 'manga_i_norte', ('cabeza', -1): 'cabeza_norte'}; TEXX = {-1: 'cabeza_oeste', 1: 'cabeza_este'}   # v2.123: + espalda y costados de la cabeza (X: caras de lado, n[0] = -1 oeste / +1 este)   # v2.122: + cuerpo   # textura cabeza_sur
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
S, W, H, PIT = 120, 200, 250, math.radians(32)   # píxeles por unidad, tamaño de cada vista y cabeceo de la cámara
def vista(fig, yaw_deg):
    yaw = math.radians(yaw_deg); img = Image.new('RGB', (W, H), (122, 190, 110)); px = img.load(); zb = [[1e9] * W for _ in range(H)]
    def proy(p):   # cámara en el SUR (z+) a 0 grados, mirando al norte desde arriba; el este queda a la derecha
        x, y, z = p[0], p[1] - 0.75, p[2]
        x, z = x * math.cos(yaw) - z * math.sin(yaw), x * math.sin(yaw) + z * math.cos(yaw)
        prof = -(z * math.cos(PIT) + y * math.sin(PIT)); yy = y * math.cos(PIT) - z * math.sin(PIT)
        return (W / 2 + x * S, H / 2 + 10 - yy * S, prof)
    # sombra de suelo (óvalo del pintor, solo de referencia)
    d = ImageDraw.Draw(img); cx, cy, _ = proy((0, 0, 0)); d.ellipse((cx - 0.31 * S, cy - 0.09 * S, cx + 0.31 * S, cy + 0.09 * S), fill=(86, 150, 86))
    for q in fig['poly']:
        if q['pz'] == 'gafas': continue   # la lámina lisa de gafas se sustituye por la textura (paso 3b-3)
        n = q['n']; nz = n[0] * math.sin(yaw) + n[2] * math.cos(yaw)
        if nz * math.cos(PIT) + n[1] * math.sin(PIT) <= 1e-6: continue   # cara de espaldas
        xmin = min(v[0] for v in q['v']); P = [proy(v) for v in q['v']]; col = hexrgb(q['c']); cara = q['pz'] == 'cabeza' and abs(q['n'][2] - 1) < 1e-6; V = q['v']; lado = q['pz'] == 'cabeza' and abs(abs(q['n'][0]) - 1) < 1e-6; tc = TEXS.get(TEXX[round(q['n'][0])]) if lado else (TEXS.get(TEXC.get((q['pz'], round(q['n'][2])))) if abs(abs(q['n'][2]) - 1) < 1e-6 else None)
        tren = q['pz'].startswith('trenza') and abs(q['n'][1]) < 1e-6   # v2.125 (3d): trenzas con textura en zigzag (2 texels de ancho)
        if tren:
            lado = abs(abs(q['n'][0]) - 1) < 1e-6; ysb = [v[1] for v in V]; nom = 'trenza_%s_%d' % ('roja' if q['c'] == '#d9453d' else 'castana', round((max(ysb) - min(ysb)) / 0.0625)); tc = TEXS.get(nom)
        ej = 2 if lado else 0; xmin = min(v[ej] for v in V)   # eje horizontal de la textura: x en las caras de frente/espalda, z en los costados
        if tc: xs = [v[ej] for v in V]; ys = [v[1] for v in V]; bw = round((max(xs) - min(xs)) / 0.0625); off = (tc['w'] - bw) // 2
        for tri in ((0, 1, 2), (0, 2, 3)):
            a, b, c = (P[i] for i in tri)
            x0, x1 = int(max(0, min(a[0], b[0], c[0]))), int(min(W - 1, max(a[0], b[0], c[0])) + 1); y0, y1 = int(max(0, min(a[1], b[1], c[1]))), int(min(H - 1, max(a[1], b[1], c[1])) + 1)
            den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(den) < 1e-9: continue
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    l1 = ((b[1] - c[1]) * (x + .5 - c[0]) + (c[0] - b[0]) * (y + .5 - c[1])) / den; l2 = ((c[1] - a[1]) * (x + .5 - c[0]) + (a[0] - c[0]) * (y + .5 - c[1])) / den; l3 = 1 - l1 - l2
                    if l1 < -1e-6 or l2 < -1e-6 or l3 < -1e-6: continue
                    z = l1 * a[2] + l2 * b[2] + l3 * c[2]
                    if lado: z -= 0.03   # sesgo de profundidad: el costado de la cabeza comparte plano con el durag (evita z-fighting)
                    if z < zb[y][x]:
                        zb[y][x] = z; px[x, y] = col
                        if cara or tc:
                            i0, i1, i2 = tri; X = l1 * V[i0][ej] + l2 * V[i1][ej] + l3 * V[i2][ej]; Y = l1 * V[i0][1] + l2 * V[i1][1] + l3 * V[i2][1]
                            u = int((X - xmin) / 0.0625); v = int((0.6875 + 7 * 0.0625 - Y) / 0.0625) if cara else 0
                            if tc:
                                u = int((X - xmin) / 0.0625 + 0.5) if not tren else min(bw - 1, int((X - xmin) / 0.0625)); v = int((max(ys) - Y) / 0.0625) if not tren else min(tc['h'] - 1, int((max(ys) - Y) / 0.0625)); u = (bw - 1 - u if (q['n'][0] > 0 if lado else q['n'][2] < 0) else u) + off
                                if q['pz'] == 'cabeza' and v < 4: continue   # filas 1-4 del sprite: quedan bajo el durag (mismo plano que la cabeza: evita z-fighting)
                                if 0 <= u < tc['w'] and 0 <= v < tc['h'] and tc['px'][v][u]: px[x, y] = hexrgb(tc['px'][v][u])
                            elif 0 <= u < TEX['w'] and 0 <= v < TEX['h'] and TEX['px'][v][u]: px[x, y] = hexrgb(TEX['px'][v][u])
    return img
lienzo = Image.new('RGB', (W * 4, H), (30, 20, 36)); dib = ImageDraw.Draw(lienzo)
for c, ang in enumerate((0, 90, 180, 270)):
    lienzo.paste(vista(geo['poses'][0], ang), (c * W, 0)); dib.text((c * W + 6, 4), 'quieto · camara %d°' % ang, fill=(255, 255, 255))
lienzo.save(salida); print('guardado', salida)
