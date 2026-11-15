#!/usr/bin/env python3
"""tema_ui.py — genera el bloque CSS del tema «pixel cálido» (v2.298) y lo inserta en index.html entre /*TEMA:INI*/ y /*TEMA:FIN*/.
Marcos de 9 cortes (border-image) dibujados píxel a píxel + fuente Pixelify Sans recortada (OFL). Uso: python3 tools/tema_ui.py <fuente.woff2>   (necesita PIL)"""
import base64, io, pathlib, re, sys
from PIL import Image
raiz = pathlib.Path(__file__).resolve().parent.parent
def hexc(h, a=255): h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
def marco(n, O, H, F, S, a=255):   # n = 5 | 7 · esquinas recortadas, contorno, bisel claro arriba-izquierda y oscuro abajo-derecha
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0)); m = n - 1
    for y in range(n):
        for x in range(n):
            if (x in (0, m)) and (y in (0, m)): continue
            c = F
            if x in (0, m) or y in (0, m): c = O
            elif y == 1 or x == 1: c = H
            elif y == m - 1 or x == m - 1: c = S
            im.putpixel((x, y), hexc(c, a))
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'url(data:image/png;base64,' + base64.b64encode(b.getvalue()).decode() + ')'
TINTA = '#24121d'
M = {   # nombre: (n, contorno, claro, relleno, sombra, alfa)
    'panel':  (7, TINTA, '#d9a46c', '#5a3845', '#3e2430', 255),
    'oro':    (7, '#3a2008', '#fff0a0', '#f7c948', '#c9871c', 255),
    'sec':    (5, TINTA, '#a97b86', '#6a4452', '#4a2c3a', 255),
    'orop':   (5, '#3a2008', '#fff0a0', '#f7c948', '#c9871c', 255),
    'hueco':  (5, TINTA, '#150a12', '#2b1824', '#4a3040', 255),
    'pad':    (5, TINTA, '#a97b86', '#6a4452', '#4a2c3a', 215),
}

PAL = {'w': '#fff4dc', 'y': '#f7c948', 'o': '#e4663a', 'r': '#e0503e', 'b': '#6cb4f0', 'B': '#3a78c0', 'g': '#78c878', 'G': '#3f9450', 'n': '#b8794a', 's': '#cdb99c', 'd': '#8a6a78', 'k': '#24121d'}
ICONOS = {
 'mapa': [".........", ".wwwwwww.", ".wggwbbw.", ".wgggwbw.", ".wwgwwww.", ".wwwwyww.", ".wwwyyyw.", ".wwwwyww.", "........."],
 'sonido': [".........", "...w..w..", "..ww...w.", "wwww.w.w.", "wwww.w.w.", "wwww.w.w.", "..ww...w.", "...w..w..", "........."],
 'mudo': [".........", "...w.....", "..ww.....", "wwww.r.r.", "wwww..r..", "wwww.r.r.", "..ww.....", "...w.....", "........."],
 'pez': [".........", ".........", "..bbbb...", ".bbbbbb.b", "bbwkbbbbb", ".bbbbbb.b", "..BBBB...", ".........", "........."],
 'galeria': [".........", ".nnnnnnn.", ".nbbbbbn.", ".nbbybbn.", ".nbGbGbn.", ".nGGGGGn.", ".nnnnnnn.", ".........", "........."],
 'cambiar': [".........", "..y......", ".yyyyyyy.", "..y......", ".........", "......y..", ".yyyyyyy.", "......y..", "........."],
 'espada': [".......ww", "......ww.", ".....ww..", "y...ww...", ".y.ww....", "..yw.....", "..nyy....", ".nn..y...", "n........"],
 'rayo': [".....yyy.", "....yyy..", "...yyy...", "..yyyyyy.", ".....yyy.", "....yy...", "...yy....", "..y......", "........."],
 'mano': [".........", "..w.w.w..", "..w.w.w.w", "..wwwww.w", ".wwwwwwww", ".wwwwwww.", "..wwwww..", "..wwwww..", "........."],
 'lupa': [".........", "..wwww...", ".w....w..", ".w....w..", ".w....w..", "..wwww...", ".....n...", "......n..", ".......n."],
 'girar': [".........", "..wwwww..", ".w.....w.", "w......w.", "wwww...w.", ".ww....w.", "..w...w..", "...www...", "........."],
 'lapiz': [".......yy", "......yny", ".....yny.", "....yny..", "...yny...", "..yny....", ".wny.....", "ww.......", "........."],
 'hablar': [".........", ".wwwwwww.", "wwwwwwwww", "wwdwdwdww", "wwwwwwwww", ".wwwwwww.", "..ww.....", "..w......", "........."],
 'estrella': ["....y....", "....y....", "...yyy...", "yyyyyyyyy", ".yyyyyyy.", "..yyyyy..", "..yy.yy..", ".yy...yy.", "........."],
 'anzuelo': ["....w....", "....w....", "....w....", "....w....", "....w....", "w...w....", "ww.ww....", ".www.....", "........."],
 'exclam': ["....r....", "...rrr...", "...rrr...", "...rrr...", "....r....", "....r....", ".........", "...rrr...", "...rrr..."],
 'cerrar': [".........", ".w.....w.", "..w...w..", "...w.w...", "....w....", "...w.w...", "..w...w..", ".w.....w.", "........."],
 'sombra': ["..wwddd..", ".wwwdddd.", "wwwwddddd", "wwwwddddd", "wwwwddddd", "wwwwddddd", "wwwwddddd", ".wwwdddd.", "..wwddd.."],
 'rejilla': [".........", ".www.www.", ".www.www.", ".www.www.", ".........", ".www.www.", ".www.www.", ".www.www.", "........."],
 'casa': [".........", "....r....", "...rrr...", "..rrrrr..", ".rrrrrrr.", ".wwwwwww.", ".wwwnnww.", ".wwwnnww.", "........."],
 'lab': [".........", "...www...", "....w....", "....w....", "...bbb...", "..bgbbb..", ".bbbbgbb.", ".bbbbbbb.", "........."],
 'fuente': [".........", "....b....", "...b.b...", "..b.b.b..", "...bbb...", ".sssssss.", ".sBBBBBs.", "..sssss..", "........."],
 'centro': [".........", ".wwwwwww.", ".wwwrwww.", ".wrrrrrw.", ".wwwrwww.", ".wwwwwww.", ".wwwnwww.", ".wwwnwww.", "........."],
 'tienda': [".........", ".rwrwrwr.", ".rwrwrwr.", ".wwwwwww.", ".wbbwbbw.", ".wbbwbbw.", ".wwwnwww.", ".wwwnwww.", "........."],
 'ermita': ["....y....", "...yyy...", "....y....", "...www...", "..wwwww..", "..wwwww..", "..wwnww..", "..wwnww..", "........."],
 'flecha': [".........", "....w....", "...www...", "..wwwww..", ".wwwwwww.", "...www...", "...www...", "...www...", "........."],
}
def icono(m):
    im = Image.new('RGBA', (9, 9), (0, 0, 0, 0))
    for y, fila in enumerate(m):
        assert len(fila) == 9, (y, fila)
        for x, ch in enumerate(fila):
            if ch != '.': im.putpixel((x, y), hexc(PAL[ch]))
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'url(data:image/png;base64,' + base64.b64encode(b.getvalue()).decode() + ')'

fuente = base64.b64encode(pathlib.Path(sys.argv[1]).read_bytes()).decode()
css = '/*TEMA:INI*/\n  @font-face { font-family: "Pixelify"; src: url(data:font/woff2;base64,' + fuente + ') format("woff2"); font-weight: 400 700; font-display: swap; }\n' + ''.join('  @font-face { font-family: "PixelifyNum"; src: url(data:font/woff2;base64,' + base64.b64encode((raiz / 'tools' / ('pixelify_num_%d.woff2' % w)).read_bytes()).decode() + ') format("woff2"); font-weight: %d; font-display: swap; unicode-range: U+0030-0039; }\n' % w for w in (400, 700)) + '  :root { ' + ' '.join('--m-%s: %s;' % (k, marco(*v)) for k, v in M.items()) + ' }\n'
css += '  :root { ' + ' '.join('--ic-%s: %s;' % (k, icono(v)) for k, v in ICONOS.items()) + ' }\n'
css += ''.join('  .i-%s { background-image: var(--ic-%s); }\n' % (k, k) for k in ICONOS)
css += (raiz / 'tools' / 'tema_ui.css').read_text()
css += '/*TEMA:FIN*/'
p = raiz / 'index.html'; s = p.read_text()
if '/*TEMA:INI*/' in s: s = re.sub(r'/\*TEMA:INI\*/.*?/\*TEMA:FIN\*/', lambda m: css, s, flags=re.S)
else: s = s.replace('</style>', '  ' + css + '\n</style>', 1)
p.write_text(s); print('index.html', len(s), 'bytes')
