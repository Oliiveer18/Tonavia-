#!/usr/bin/env python3
"""Genera src/criatura3d_sprites.js: las texturas de las criaturas 3D a partir de los sprites 2D REALES del juego (frente, espalda, perfil izq. y der.).
- Toda la tinta oscura (contorno y rasgos de la cara) se sustituye por el color del vecino relleno: los rasgos del 3D son geometría/decales propios del modelo.
- Los píxeles transparentes se rellenan con el color opaco más cercano (sin agujeros al proyectar la textura sobre la malla).
Uso: node build.js && python3 tools/generar_sprites3d.py            (reescribe src/criatura3d_sprites.js)
     python3 tools/generar_sprites3d.py --comprobar                 (falla si el archivo ya no coincide con los sprites 2D actuales)
Para añadir otra criatura 3D: añadir su id a IDS y volver a ejecutar."""
import json, os, sys
import numpy as np
from playwright.sync_api import sync_playwright
IDS = ['nubecin', 'arenel', 'somnin']
OBJ_IDS = ['roca', 'piedras', 'barril', 'cartel']   # decoración fija (G.OBJETOS): solo tienen el dibujo de frente (vista «f»); las demás caras la reutilizan
# Ajustes de color solo para el 3D (el 2D no cambia): el aro blanquecino del acarapacho de Arenel se rebaja para que no se queme bajo la luz del juego
COLOR_3D = {'arenel': {'#d3deef': '#a9c1e6'}}
# Colores que se tratan como «tinta» (se sustituyen por los del vecino): el blanco de los ojos del 2D tapa el acarapacho en la vista de frente y, proyectado, salía como una banda blanca
QUITAR_3D = {'arenel': ['#fffdf5']}
# Texturas SOLO de un rango de filas (v2.239): Somnel — el cuerpo toma las filas 10-16; gorro (3-9) y patas (17-21) comparten colores con él y van en color liso en el modelo; el amarillo de la motita no entra en el cuerpo
FILAS_3D = {'somnin': (10, 16)}
# Piezas cuya tinta oscura SÍ se conserva (v2.248): el letrero del cartel lleva el nombre del pueblo en letras con contorno oscuro; quitarlo las deshacía
CONSERVAR_TINTA = ['cartel']
# Piezas de láminas con recorte (v2.249): se conserva la transparencia del dibujo (letra «.») en lugar de rellenarla; las láminas cruzadas de la hierba alta usan el dibujo 2D tal cual
CONSERVAR_ALFA = ['hierba_alta']
QUITAR_3D['somnin'] = ['#f7d54a']
# Piezas con textura propia (v2.236): el tapón de Arenel solo lleva sus azules (los demás píxeles se rellenan con el azul más cercano) y el CUERPO no lleva ninguno de esos azules (en el 2D el tapón tapa el cuerpo: proyectado, dejaba píxeles azules de más en los lados del cuerpo)
TAPON_3D = {'arenel': ['#3f7fd6', '#78aaf2', '#27559c', '#d3deef', '#244bba', '#1b3077', '#3d69f0']}
VISTAS = {'f': 'down', 'b': 'up', 'l': 'left', 'r': 'right'}
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def sprites():
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); pg.goto('file://' + os.path.join(raiz, 'dist', 'criaturas.html')); pg.wait_for_timeout(400)
        out = {i: {v: pg.evaluate("([i,d,f])=>{const s=G.creatureSprite(i,d,f);const x=s.c.getContext('2d').getImageData(0,0,s.w,s.h);return {w:s.w,h:s.h,d:Array.from(x.data)}}", [i, d, 0]) for v, d in VISTAS.items()} for i in IDS}
        for t in OBJ_IDS: out[t] = {'f': pg.evaluate("(t)=>{const d=G.OBJETOS[t],c=G.makeCanvas(d.w,d.h),x=c.getContext('2d');d.dibujar(x,null,16);const q=x.getImageData(0,0,d.w,d.h);return {w:d.w,h:d.h,d:Array.from(q.data)}}", t)}
        b.close()
    return out
def limpia(a, extra=(), conservar=None, filas=None, sin_tinta=False, sin_relleno=False):
    H, W = a.shape[:2]; o = a.copy(); tinta = (a[:, :, 3] > 0) & (a[:, :, :3].astype(int).sum(axis=2) < 190)
    if sin_tinta: tinta[:] = False
    if conservar is not None:   # solo se conservan estos colores: el resto de píxeles opacos se sustituye por el más cercano de ellos
        opaco = a[:, :, 3] > 0; esta = np.zeros(opaco.shape, bool)
        for c in conservar: esta |= (a[:, :, :3] == np.array([int(c[j:j + 2], 16) for j in (1, 3, 5)], dtype=np.uint8)).all(axis=2)
        tinta = opaco & ~esta
    if filas is not None:
        tinta |= (a[:, :, 3] > 0) & ((np.arange(a.shape[0])[:, None] < filas[0]) | (np.arange(a.shape[0])[:, None] > filas[1]))
    for c in extra: tinta |= (a[:, :, 3] > 0) & (a[:, :, :3] == np.array([int(c[j:j + 2], 16) for j in (1, 3, 5)], dtype=np.uint8)).all(axis=2)
    for _ in range(16):
        t0 = tinta.copy(); n2 = o.copy(); hay = False
        for y in range(H):
            for x in range(W):
                if t0[y, x]:
                    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < H and 0 <= xx < W and o[yy, xx, 3] > 0 and not t0[yy, xx]: n2[y, x, :3] = o[yy, xx, :3]; tinta[y, x] = False; break
                    else: hay = True
        o = n2
        if not hay: break
    # transparentes -> color opaco más cercano
    for _ in range(0 if sin_relleno else 40):
        vac = o[:, :, 3] == 0
        if not vac.any(): break
        n2 = o.copy()
        for y in range(H):
            for x in range(W):
                if vac[y, x]:
                    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < H and 0 <= xx < W and o[yy, xx, 3] > 0: n2[y, x] = o[yy, xx]; break
        o = n2
    return o
def js(d):
    pal = {}; letras = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    out = {}
    for i, vs in d.items():
        pal = {}; filas = {}
        todas = [(v, s, None) for v, s in vs.items()]
        if i in TAPON_3D: todas = [(v, s, 'cuerpo') for v, s in vs.items()] + [(v + 't', s, 'tapon') for v, s in vs.items()]
        for v, s, modo in todas:
            a0 = np.array(s['d'], dtype=np.uint8).reshape(s['h'], s['w'], 4)
            if modo == 'tapon': a = limpia(a0, (), TAPON_3D[i])
            elif modo == 'cuerpo': a = limpia(a0, tuple(QUITAR_3D.get(i, ())) + tuple(TAPON_3D[i]))
            else:
                a = limpia(a0, QUITAR_3D.get(i, ()), None, FILAS_3D.get(i), i in CONSERVAR_TINTA, i in CONSERVAR_ALFA); fr = FILAS_3D.get(i)
                if fr: a[:fr[0]] = a[fr[0]]; a[fr[1] + 1:] = a[fr[1]]   # fuera del rango se repite la fila del borde (no se propagan manchas)
            rows = []
            if modo != 'tapon':
                for ant, nue in COLOR_3D.get(i, {}).items():
                    m = (a[:, :, :3] == np.array([int(ant[j:j + 2], 16) for j in (1, 3, 5)], dtype=np.uint8)).all(axis=2); a[m, :3] = [int(nue[j:j + 2], 16) for j in (1, 3, 5)]
            else:
                for ant, nue in COLOR_3D.get(i, {}).items():
                    m = (a[:, :, :3] == np.array([int(ant[j:j + 2], 16) for j in (1, 3, 5)], dtype=np.uint8)).all(axis=2); a[m, :3] = [int(nue[j:j + 2], 16) for j in (1, 3, 5)]
            for y in range(s['h']):
                r = ''
                for x in range(s['w']):
                    if a[y, x, 3] == 0: r += '.'; continue
                    c = '#%02x%02x%02x' % tuple(a[y, x, :3])
                    if c not in pal: pal[c] = letras[len(pal)]
                    r += pal[c]
                rows.append(r)
            filas[v] = rows
        out[i] = {'w': vs['f']['w'], 'h': vs['f']['h'], 'pal': {l: c for c, l in pal.items()}, 'vistas': filas}
    cab = "// criatura3d_sprites.js — TEXTURAS de las criaturas 3D (v2.229), GENERADO por tools/generar_sprites3d.py a partir de los sprites 2D reales (sin tinta, sin transparencia). No editar a mano.\n// f = frente, b = espalda, l = perfil izquierdo, r = perfil derecho; cada letra es un color de `pal`.\n"
    return cab + "(function (root) {\n  'use strict';\n  const G = (root.G = root.G || {});\n  G.CRIATURA3D_SPRITES = " + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ";\n})(typeof window !== 'undefined' ? window : globalThis);\n"
txt = js(sprites()); ruta = os.path.join(raiz, 'src', 'criatura3d_sprites.js')
if '--comprobar' in sys.argv:
    actual = open(ruta).read() if os.path.exists(ruta) else ''
    print('texturas 3D al día' if actual == txt else 'FALLA: src/criatura3d_sprites.js no coincide con los sprites 2D actuales (ejecuta tools/generar_sprites3d.py)'); sys.exit(0 if actual == txt else 1)
open(ruta, 'w').write(txt); print('escrito', ruta, len(txt), 'bytes')
