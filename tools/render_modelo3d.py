#!/usr/bin/env python3
"""Render con z-buffer de los modelos 3D de Nimbel y Arenel (tools/modelo3d_nimbel_arenel.js) con TEXTURA PROYECTADA de los sprites 2D reales:
la cara que mira al frente toma el sprite de frente, la de la espalda el de espalda, las laterales los de perfil; arriba/abajo, el color base de la pieza.
Tonos como el juego (TONO_TEX): arriba 1,0 · oeste 0,95 · frente 0,89 · este y espalda 0,72.
Uso: node tools/modelo3d_nimbel_arenel.js > modelos.json && python3 tools/render_modelo3d.py modelos.json sprites.json salida_nimbel.png salida_arenel.png"""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
mod = json.load(open(sys.argv[1])); spr = json.load(open(sys.argv[2]))
def S(i, k, limpio=False):
    s = spr[i][k]; a = np.array(s['d'], dtype=np.uint8).reshape(s['h'], s['w'], 4)
    if not limpio: return a
    # la tinta del 2D (contorno y rasgos de la cara) no se proyecta: los rasgos son geometría/decales propios del modelo; cada píxel de tinta toma el color del vecino relleno
    H, W = a.shape[:2]; o = a.copy(); tinta = (a[:, :, 3] > 0) & (a[:, :, :3].astype(int).sum(axis=2) < 190)
    for _ in range(4):
        n2 = o.copy(); hay = False; t0 = tinta.copy()
        for y in range(H):
            for x in range(W):
                if tinta[y, x]:
                    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < H and 0 <= xx < W and o[yy, xx, 3] > 0 and not t0[yy, xx]: n2[y, x, :3] = o[yy, xx, :3]; tinta[y, x] = False; break
                    else: hay = True
        o = n2
        if not hay: break
    return o
import re, pathlib
_t = (pathlib.Path(__file__).resolve().parent.parent / 'src' / 'criatura3d_sprites.js').read_text(encoding='utf8'); _j = json.loads(_t[_t.index('{', _t.index('CRIATURA3D_SPRITES =')):_t.rindex('};') + 1])
def _tex(e):
    pal = {l: [int(c[k:k + 2], 16) for k in (1, 3, 5)] for l, c in e['pal'].items()}
    return {v: np.array([[pal[ch] + [255] for ch in fila] for fila in filas], dtype=np.uint8) for v, filas in e['vistas'].items()}
TEX = {i: _tex(e) for i, e in _j.items()}
def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[j:j+2], 16) for j in (0, 2, 4)], float)
def render(i, yaw, pit, size=(300, 270), sc=11.0, sombra=True):
    cfg = mod[i]['cfg']; quads = mod[i]['quads']; U = 1 / 16
    D = TEX[i]; Wc = D['f'].shape[1]; Hc = D['f'].shape[0]   # las MISMAS texturas que el juego (src/criatura3d_sprites.js)
    ya, pa = math.radians(yaw), math.radians(pit)
    d = np.array([math.sin(ya) * math.cos(pa), math.sin(pa), math.cos(ya) * math.cos(pa)])   # hacia la cámara
    f = -d; up0 = np.array([0, 1, 0.0]); r = np.cross(f, up0)
    if np.linalg.norm(r) < 1e-6: r = np.array([math.cos(ya), 0, -math.sin(ya)])
    r /= np.linalg.norm(r); u = np.cross(r, f)
    ctr = np.array([0, 0.32, 0]); W, H = size; img = np.zeros((H, W, 4), float); zb = np.full((H, W), -1e9)
    def proj(p):
        q = np.array(p) - ctr; return np.array([W / 2 + q @ r * 16 * sc * 1.0, H * 0.58 - q @ u * 16 * sc * 1.0, q @ d])
    L = np.array([-0.5, 0.8, 0.6]); L /= np.linalg.norm(L)
    for q in quads:
        n = np.array(q['n']); 
        if n @ d <= 0.02: continue
        v = [np.array(p) for p in q['v']]
        # tono del juego según la normal
        tono = max(0.55, min(1.0, 0.88 - 0.14 * n[0] + 0.12 * n[2] + 0.06 * n[1]))   # brillo NETO como src/criatura3d_modelos.js (luzK): frente 1,0 · arriba ≈ 0,94 · este ≈ 0,74
        base = hexrgb(q['col'] if n[1] >= -0.0 else q['colB']); liso = q.get('liso', False)
        if q.get('e'): tono = 1.0
        P2 = [proj(p) for p in v]
        for tri in ((0, 1, 2), (0, 2, 3)):
            a, b, c = P2[tri[0]], P2[tri[1]], P2[tri[2]]
            x0, x1 = int(max(0, math.floor(min(a[0], b[0], c[0])))), int(min(W - 1, math.ceil(max(a[0], b[0], c[0]))))
            y0, y1 = int(max(0, math.floor(min(a[1], b[1], c[1])))), int(min(H - 1, math.ceil(max(a[1], b[1], c[1]))))
            if x1 < x0 or y1 < y0: continue
            den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(den) < 1e-9: continue
            xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
            l1 = ((b[1] - c[1]) * (xs - c[0]) + (c[0] - b[0]) * (ys - c[1])) / den; l2 = ((c[1] - a[1]) * (xs - c[0]) + (a[0] - c[0]) * (ys - c[1])) / den; l3 = 1 - l1 - l2
            m = (l1 >= -1e-6) & (l2 >= -1e-6) & (l3 >= -1e-6)
            if not m.any(): continue
            z = l1 * a[2] + l2 * b[2] + l3 * c[2]; sel = m & (z > zb[y0:y1 + 1, x0:x1 + 1])
            if not sel.any(): continue
            yy, xx = np.nonzero(sel); P3 = (l1[sel][:, None] * v[tri[0]] + l2[sel][:, None] * v[tri[1]] + l3[sel][:, None] * v[tri[2]])
            col = np.tile(base, (len(yy), 1))
            if q.get('cv'):   # degradado por vértice
                C = [hexrgb(h) for h in q['cv']]; L3 = (l1[sel], l2[sel], l3[sel]); col = L3[0][:, None] * C[tri[0]] + L3[1][:, None] * C[tri[1]] + L3[2][:, None] * C[tri[2]]
            ax = np.argmax(np.abs(n))
            xpx = cfg['cx'] + P3[:, 0] / U; ypx = cfg['suelo'] - P3[:, 1] / U; zpx = cfg['zc'] - P3[:, 2] / U
            suf = 't' if q['pieza'] == 'tapon' and 'ft' in D else ''
            if liso or n[1] > 0.5: sp = None
            elif ax == 2: sp = D['f' + suf] if n[2] > 0 else D['b' + suf]; cx_ = xpx if n[2] > 0 else 2 * cfg['cx'] - xpx; cy_ = ypx
            elif ax == 0: sp = D['l' + suf] if n[0] > 0 else D['r' + suf]; cx_ = zpx if n[0] > 0 else Wc - zpx; cy_ = ypx
            else: sp = None
            if sp is not None:
                ci = np.floor(cx_).astype(int); ri = np.floor(cy_).astype(int); ok = (ci >= 0) & (ci < Wc) & (ri >= 0) & (ri < Hc)
                px = np.zeros((len(yy), 4)); px[ok] = sp[ri[ok], ci[ok]]; has = px[:, 3] > 0
                col[has] = px[has, :3]
            fk = 1.0
            if q.get('kg'): fk = 0.84 + 0.16 * (l1[sel] * q['kg'][tri[0]] + l2[sel] * q['kg'][tri[1]] + l3[sel] * q['kg'][tri[2]]); fk = fk[:, None]
            col = np.clip(col * tono * fk, 0, 255)
            img[y0 + yy, x0 + xx, :3] = col; img[y0 + yy, x0 + xx, 3] = 255; zb[y0 + yy, x0 + xx] = z[sel]
    return Image.fromarray(img.astype(np.uint8), 'RGBA')
def F(n, b=False):
    try: return ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', n, index=1 if b else 0)
    except: return ImageFont.load_default()
BG = (43, 37, 64); PANEL = (54, 47, 78); TX = (235, 232, 245); TX2 = (170, 164, 195)
def hoja(i, tit, salida, info):
    W = 1480; sh = Image.new('RGB', (W, 700), BG); dr = ImageDraw.Draw(sh)
    dr.text((20, 12), f'{tit} · modelo 3D a mano (render del modelo real, v2.228)', font=F(26, True), fill=TX)
    dr.text((20, 48), info, font=F(14), fill=TX2)
    dr.rounded_rectangle([20, 80, W - 20, 340], 8, fill=PANEL); dr.text((32, 88), 'Referencias 2D (sprites reales del juego)', font=F(14), fill=TX2)
    for q, (k, lb) in enumerate((('down0', 'frente'), ('left0', 'perfil'), ('up0', 'espalda'), ('down1', 'paso B'))):
        s = spr[i][k]; t = Image.fromarray(np.array(s['d'], dtype=np.uint8).reshape(s['h'], s['w'], 4), 'RGBA'); t = t.resize((s['w'] * 10, s['h'] * 10), Image.NEAREST)
        sh.paste(t, (40 + q * 340, 120 + (160 - t.height) // 2), t); dr.text((40 + q * 340 + t.width // 2, 300), lb, font=F(13), fill=TX2, anchor='mm')
    dr.rounded_rectangle([20, 350, W - 20, 690], 8, fill=PANEL); dr.text((32, 358), 'Modelo 3D (texturas proyectadas de los sprites; luz y tonos del juego)', font=F(14), fill=TX2)
    for n, (yw, pt, lb) in enumerate([(0, 8, 'frente'), (30, 22, '3/4 derecha'), (-35, 22, '3/4 izquierda'), (90, 8, 'perfil'), (180, 8, 'espalda'), (0, 90, 'planta')]):
        im = render(i, yw, pt, size=(236, 280), sc=9.5); px = 26 + n * 242; sh.paste(im, (px, 380), im); dr.text((px + 118, 672), lb, font=F(13), fill=TX2, anchor='mm')
    sh.save(salida)
hoja('nubecin', 'NIMBEL', sys.argv[3], 'Una sola masa (cortes con el ancho del frente y el fondo del perfil, bultos en el contorno) y dos gotas. Ojos, boca y mofletes son decales propios sobre la superficie; el cuerpo toma el color de los sprites 2D.')
hoja('arenel', 'ARENEL', sys.argv[4], 'Acarapacho grande (tapón azul), cuerpo de arena, ojos esféricos con pupila y brillo sobre pedúnculos, pinzas y 8 patas. Colores proyectados de los sprites 2D.')
if len(sys.argv) > 5: hoja('somnin', 'SOMNEL', sys.argv[5], 'Una masa de cuerpo (textura propia, solo filas 10-16), gorro de dormir cónico caído hacia atrás con borla, ojos cerrados como decales, 4 patitas, estrella flotante y motita. Cámara del render: desde arriba.')
print('ok')
