#!/usr/bin/env python3
"""biblia_interiores.py — imágenes de referencia de docs/BIBLIA_INTERIORES.md (v2.138, ID-5b). Solo PROPUESTA de arte: no toca el juego.
Uso: python3 tools/biblia_interiores.py [carpeta]   (necesita Pillow)
Salida: biblia_int_centro_A.png (hogar acogedor) · biblia_int_centro_B.png (clínico tecnológico) · biblia_int_catalogo.png (paletas por edificio y mobiliario)
Todo con los colores de G.PAL, contorno #2a1b30, luz arriba-izquierda, bandas duras y casilla de 16 px (el arte se dibuja a 1× y se amplía sin suavizar)."""
import pathlib, sys
from PIL import Image, ImageDraw
sal = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent / 'docs'
INK = '#2a1b30'; T = 16
PAL = dict(wood1='#c48b52', wood2='#b27a45', wood3='#8f5c33', woodD='#6b4226', cream='#f7e9cb', cream2='#ead7ae', white='#fff9ee', red='#d94a3f', red2='#a8322f', yellow='#f7d54a',
           green='#5dae5a', green2='#3d8446', teal='#3fb5b0', teal2='#2a8187', blue='#4d7fd6', blue2='#35559a', pink='#f5a8bd', pink2='#e47a9a', grey='#b9b4c4', grey2='#8a8498', greyD='#5d576b',
           stone1='#8d8a99', stone2='#797686', stone3='#615e6f', glow='#7dffe7', purple='#8e5bc4', purple2='#5f3b8e', brown='#7a4a2b', orange='#f09a3e', night='#2d2540')
# Dos direcciones para el Centro PC. Mismos muebles y misma planta: solo cambian materiales y color.
A = dict(nombre='A · Hogar acogedor', suelo='#c48b52', suelo2='#b27a45', pared='#f7e9cb', pared2='#ead7ae', zocalo='#8f5c33', mostr='#c48b52', mostr_top='#f7e9cb', mostr_sh='#8f5c33', acento='#d94a3f', pantalla='#7dffe7', alfombra='#d94a3f', alfombra2='#f7e9cb', luz=(255, 236, 170, 70))
B = dict(nombre='B · Clínico tecnológico', suelo='#cfe3df', suelo2='#b3cfcb', pared='#fff9ee', pared2='#e3ddd0', zocalo='#2a8187', mostr='#fff9ee', mostr_top='#ffffff', mostr_sh='#b9b4c4', acento='#d94a3f', pantalla='#7dffe7', alfombra='#3fb5b0', alfombra2='#fff9ee', luz=(200, 240, 255, 70))

def caja(d, x, y, w, h, base, luz=None, sombra=None):
    """Caja con contorno oscuro, luz arriba-izquierda (1 px) y sombra abajo-derecha (2 px)."""
    d.rectangle([x - 1, y - 1, x + w, y + h], fill=INK); d.rectangle([x, y, x + w - 1, y + h - 1], fill=base)
    if luz: d.rectangle([x, y, x + w - 1, y + 1], fill=luz); d.rectangle([x, y, x + 1, y + h - 1], fill=luz)
    if sombra: d.rectangle([x, y + h - 2, x + w - 1, y + h - 1], fill=sombra); d.rectangle([x + w - 2, y, x + w - 1, y + h - 1], fill=sombra)

def sprites(S):
    """Cada pieza: (ancho, alto, función de dibujo). Origen arriba-izquierda; la sombra proyectada es abajo-derecha."""
    def mostrador(d, x, y, w=48, h=16):
        caja(d, x, y + 4, w, h - 4, S['mostr'], PAL['wood1'] if S is A else PAL['white'], S['mostr_sh']); d.rectangle([x - 1, y, x + w, y + 5], fill=INK); d.rectangle([x, y + 1, x + w - 1, y + 4], fill=S['mostr_top'])
        d.rectangle([x, y + 4, x + w - 1, y + 4], fill=PAL['cream2']); d.rectangle([x + w // 2 - 3, y + 8, x + w // 2 + 2, y + 12], fill=PAL['yellow']); d.rectangle([x + w // 2 - 3, y + 8, x + w // 2 - 1, y + 12], fill=PAL['blue']); d.rectangle([x + w // 2, y + 8, x + w // 2 + 2, y + 12], fill=PAL['pink'])  # campana de dos mitades
    def curacion(d, x, y):  # máquina de curación: aquí se dejan las criaturas
        caja(d, x, y, 24, 14, PAL['grey'], PAL['white'], PAL['grey2'])
        for i, c in enumerate([PAL['blue'], PAL['pink'], PAL['yellow']] * 2):
            cx = x + 3 + (i % 3) * 7; cy = y + 3 + (i // 3) * 5; d.rectangle([cx - 1, cy - 1, cx + 3, cy + 3], fill=INK); d.rectangle([cx, cy, cx + 2, cy + 2], fill=c)
    def pc(d, x, y):
        caja(d, x, y + 8, 16, 8, S['mostr'], PAL['wood1'] if S is A else PAL['white'], S['mostr_sh'])
        caja(d, x + 2, y, 12, 8, PAL['greyD'], PAL['grey2']); d.rectangle([x + 3, y + 1, x + 12, y + 5], fill=S['pantalla']); d.rectangle([x + 3, y + 1, x + 12, y + 1], fill=PAL['white'])
        d.rectangle([x + 3, y + 11, x + 12, y + 12], fill=PAL['grey'])
    def banco(d, x, y, w=32, inv=False):
        caja(d, x, y + 6, w, 7, PAL['wood3'], PAL['wood1'], PAL['woodD']); h = w // 2; az, ro = (PAL['blue'], PAL['teal'], PAL['blue2']), (PAL['pink'], PAL['white'], PAL['pink2'])
        a, b = (ro, az) if inv else (az, ro); caja(d, x, y, h, 6, *a); caja(d, x + h, y, w - h, 6, *b)  # dos mitades: Lali azul, Oli rosa
    def planta(d, x, y):
        caja(d, x + 2, y + 8, 7, 6, PAL['brown'], PAL['wood2'], PAL['woodD'])
        for dx, dy, w in [(0, 2, 5), (5, 0, 6), (3, 3, 5), (7, 4, 4)]: caja(d, x + dx, y + dy, w, 5, PAL['green'], '#76c363', PAL['green2'])
    def estante(d, x, y):
        caja(d, x, y, 22, 22, PAL['wood3'], PAL['wood1'], PAL['woodD'])
        for k in (6, 13): d.rectangle([x + 1, y + k, x + 20, y + k + 1], fill=PAL['woodD'])
        for i, c in enumerate([PAL['red'], PAL['blue'], PAL['yellow'], PAL['green'], PAL['pink'], PAL['purple']]): d.rectangle([x + 2 + (i % 3) * 6, y + 1 + (i // 3) * 7, x + 5 + (i % 3) * 6, y + 5 + (i // 3) * 7], fill=c)
    def cama(d, x, y):
        caja(d, x, y, 22, 28, PAL['wood3'], PAL['wood1'], PAL['woodD']); caja(d, x + 2, y + 9, 18, 17, PAL['cream'], PAL['white'], PAL['cream2']); caja(d, x + 3, y + 3, 16, 7, PAL['white'], PAL['white'], PAL['cream2'])
        d.rectangle([x + 2, y + 17, x + 19, y + 25], fill=PAL['blue']); d.rectangle([x + 2, y + 17, x + 19, y + 18], fill=PAL['teal'])
    def mesa(d, x, y):
        caja(d, x, y, 24, 14, PAL['wood1'], PAL['cream2'], PAL['wood3']); d.rectangle([x + 2, y + 14, x + 4, y + 17], fill=INK); d.rectangle([x + 19, y + 14, x + 21, y + 17], fill=INK)
    def capsula(d, x, y):  # incubadora del laboratorio: cristal con huevo
        caja(d, x, y + 16, 16, 6, PAL['teal2'], PAL['teal'], PAL['night']); d.rectangle([x - 1, y, x + 16, y + 17], fill=INK); d.rectangle([x, y + 1, x + 15, y + 16], fill='#bfe3f5'); d.rectangle([x, y + 1, x + 2, y + 16], fill=PAL['white'])
        d.ellipse([x + 4, y + 5, x + 11, y + 15], fill=PAL['cream'], outline=INK); d.rectangle([x + 6, y + 8, x + 8, y + 10], fill=PAL['yellow'])
    def cristal7(d, x, y):  # siete cristales elementales
        for i, c in enumerate(['#5dae5a', '#f0603e', '#3f9bd6', '#f7d54a', '#bfe3f5', '#8a7f72', '#7a4cb0']): d.rectangle([x + i * 5 - 1, y - 1, x + i * 5 + 3, y + 8], fill=INK); d.rectangle([x + i * 5, y, x + i * 5 + 2, y + 7], fill=c); d.rectangle([x + i * 5, y, x + i * 5, y + 2], fill=PAL['white'])
    def caldero(d, x, y):  # tienda: vitrina con objetos
        caja(d, x, y, 24, 16, PAL['wood2'], PAL['wood1'], PAL['wood3']); d.rectangle([x + 2, y + 2, x + 21, y + 9], fill='#bfe3f5'); d.rectangle([x + 2, y + 2, x + 4, y + 9], fill=PAL['white'])
        for i, c in enumerate([PAL['red'], PAL['yellow'], PAL['blue']]): d.ellipse([x + 4 + i * 6, y + 4, x + 8 + i * 6, y + 8], fill=c, outline=INK)
    def altar(d, x, y):  # ermita: piedra, campana y dos velas
        caja(d, x, y + 4, 28, 12, PAL['stone1'], PAL['grey'], PAL['stone3']); caja(d, x + 8, y, 12, 6, PAL['stone2'], PAL['grey'], PAL['stone3']); d.rectangle([x + 11, y - 6, x + 16, y - 1], fill=INK); d.rectangle([x + 12, y - 5, x + 14, y - 2], fill=PAL['blue']); d.rectangle([x + 15, y - 5, x + 16, y - 2], fill=PAL['pink'])
        for cx in (x + 3, x + 22): d.rectangle([cx, y - 2, cx + 2, y + 3], fill=PAL['white']); d.rectangle([cx, y - 5, cx + 2, y - 3], fill=PAL['yellow'])
    return dict(mostrador=(48, 16, mostrador), curacion=(24, 14, curacion), pc=(16, 16, pc), banco=(32, 13, banco), planta=(11, 14, planta), estante=(22, 22, estante), cama=(22, 28, cama), mesa=(24, 18, mesa), banco_e=(32, 13, lambda d, x, y: banco(d, x, y, 32, True)), capsula=(16, 22, capsula), cristales=(34, 8, cristal7), vitrina=(24, 16, caldero), altar=(28, 22, altar))

CASILLAS_W, CASILLAS_H = 13, 10   # sala de 13×10 casillas: columnas 0 y 12 = pared, fila 9 = pared delantera con la puerta, filas 0-1 = pared trasera (cara visible); suelo = 11×7 casillas
EJE = CASILLAS_W * T // 2          # eje central x = 104 px (centro de la columna 6)

def composicion():
    """Rejilla del Centro PC. Piezas centradas y parejas espejo respecto al eje x=104; verifica centrado, simetría y que todo cae sobre el suelo."""
    W = CASILLAS_W * T; P = sprites(A); L = []; centradas = []; parejas = []
    def cen(n, y): x = EJE - P[n][0] // 2; L.append((n, x, y)); centradas.append((n, x))              # pieza centrada en el eje
    def par(n, x, y, n2=None): n2 = n2 or n; L.append((n, x, y)); L.append((n2, W - x - P[n][0], y)); parejas.append((n, x, W - x - P[n][0], P[n][0]))  # pieza y su espejo
    cen('mostrador', 4 * T); cen('curacion', 4 * T - 10)             # mostrador de 3 casillas (48 px) en la fila 4 y la máquina de curación centrada sobre él
    par('pc', 1 * T, 3 * T); par('pc', 1 * T, 5 * T)                 # 4 terminales de 1 casilla pegados a las paredes laterales, filas 3 y 5 (1 casilla de aire entre ellos)
    par('banco', 2 * T, 7 * T + 2, 'banco_e')                        # 2 bancos dobles de 2 casillas, columnas 2-3 y 9-10 (mitades invertidas en el espejo)
    par('planta', 1 * T + 2, 8 * T + 1)                              # plantas en las esquinas delanteras
    for n, x in centradas: assert 2 * x + P[n][0] == W, ('descentrada', n, x)
    for n, x1, x2, w in parejas: assert x1 + w + x2 == W, ('sin espejo', n, x1, x2)
    for n, x, y in L: assert T <= x and x + P[n][0] <= W - T, ('fuera del suelo', n, x)
    return L

def habitacion(S, nombre):
    W, H = CASILLAS_W * T, CASILLAS_H * T; im = Image.new('RGB', (W, H), S['pared2']); d = ImageDraw.Draw(im)
    f0, f1 = T, W - T                                   # suelo: columnas 1..11
    d.rectangle([f0, 2 * T, f1 - 1, H - T - 1], fill=S['suelo'])
    for y in range(2 * T, H - T, 8):                    # listones (A) o baldosas (B) alineados con la rejilla: cada 8 px, desfase alterno
        d.rectangle([f0, y + 7, f1 - 1, y + 7], fill=S['suelo2'])
        for x in range(f0 + (y // 8 % 2) * 8, f1, 16): d.rectangle([x, y, x, y + 6], fill=S['suelo2'])
    d.rectangle([f0, 0, f1 - 1, 2 * T - 1], fill=S['pared']); d.rectangle([f0, 2 * T - 10, f1 - 1, 2 * T - 1], fill=S['zocalo']); d.rectangle([f0, 2 * T - 10, f1 - 1, 2 * T - 10], fill=PAL['white'] if S is B else PAL['wood1'])
    for x in range(f0, f1, 12): d.rectangle([x, 0, x, 2 * T - 11], fill=S['pared'] if x == EJE else S['pared2'])
    for x in (0, W - T): d.rectangle([x, 0, x + T - 1, H], fill=S['pared2']); d.rectangle([x + (T - 3 if x == 0 else 0), 0, x + (T - 1 if x == 0 else 2), H], fill=S['zocalo'])
    d.rectangle([0, H - T, W, H], fill=S['pared2']); d.rectangle([0, H - T, W, H - T + 2], fill=S['zocalo'])
    d.rectangle([f0 - 1, 0, f0 - 1, H - T], fill=INK); d.rectangle([f1, 0, f1, H - T], fill=INK); d.rectangle([0, H - T - 1, W, H - T - 1], fill=INK); d.rectangle([0, 0, W, 0], fill=INK); d.rectangle([0, 2 * T - 1, W, 2 * T - 1], fill=INK)
    # puerta centrada en el eje (columna 6) y alfombra de 3×2 casillas centrada delante
    d.rectangle([6 * T - 1, H - T - 1, 7 * T, H - 1], fill=INK); d.rectangle([6 * T, H - T, 7 * T - 1, H - 1], fill=PAL['woodD']); d.rectangle([6 * T + 3, H - T + 3, 7 * T - 4, H - 1], fill=PAL['brown']); d.rectangle([EJE - 1, H - 6, EJE, H - 5], fill=PAL['yellow'])
    rx, ry, rw, rh = EJE - 24, 7 * T, 48, 2 * T
    d.rectangle([rx - 1, ry - 1, rx + rw, ry + rh], fill=INK); d.rectangle([rx, ry, rx + rw - 1, ry + rh - 1], fill=S['alfombra']); d.rectangle([rx + 3, ry + 3, rx + rw - 4, ry + rh - 4], fill=S['alfombra2']); d.rectangle([rx + 6, ry + 6, rx + rw - 7, ry + rh - 7], fill=S['alfombra'])
    # ventanas simétricas respecto al eje y su luz en el suelo (la luz sigue entrando desde arriba-izquierda: las dos bandas caen hacia abajo-derecha, como todo el juego)
    luz = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(luz)
    for vx in (2 * T + 1, W - 2 * T - 15):
        caja(d, vx, 5, 14, 14, PAL['blue'], PAL['white'], PAL['blue2']); d.rectangle([vx + 6, 5, vx + 7, 18], fill=PAL['white']); d.rectangle([vx, 11, vx + 13, 12], fill=PAL['white'])
        ld.polygon([(vx + 2, 2 * T), (vx + 14, 2 * T), (vx + 26, 4 * T + 8), (vx + 14, 4 * T + 8)], fill=S['luz'])
    cx = EJE - 14; caja(d, cx, 4, 28, 12, PAL['teal2'], PAL['teal'], PAL['night']); d.ellipse([EJE - 6, 5, EJE + 6, 15], fill=PAL['red'], outline=INK); d.rectangle([EJE - 1, 7, EJE + 1, 13], fill=PAL['white']); d.rectangle([EJE - 3, 9, EJE + 3, 11], fill=PAL['white'])  # cartel centrado
    im = Image.alpha_composite(im.convert('RGBA'), luz).convert('RGB'); d = ImageDraw.Draw(im)
    P = sprites(S); piezas = composicion()
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    for n, x, y in piezas: w, h, f = P[n]; sd.rectangle([x + 2, y + h - 3, min(x + w + 2, W - T - 1), y + h + 2], fill=(30, 20, 40, 70))  # sombra abajo-derecha, banda lisa
    im = Image.alpha_composite(im.convert('RGBA'), sh).convert('RGB'); d = ImageDraw.Draw(im)
    for n, x, y in sorted(piezas, key=lambda p: p[2] + P[p[0]][1]): P[n][2](d, x, y)
    if '--ejes' in sys.argv:  # guía de comprobación: eje central y rejilla de casillas
        for gx in range(0, W + 1, T): d.line([gx, 0, gx, H], fill=(255, 0, 255) if gx == EJE else (120, 90, 150))
        d.line([EJE, 0, EJE, H], fill=(255, 0, 255))
    return im

def catalogo():
    W, H = 400, 215; im = Image.new('RGB', (W, H), PAL['night']); d = ImageDraw.Draw(im)
    FAM = [('Casas', ['#f7e9cb', '#c48b52', '#8f5c33', '#4d7fd6', '#f5a8bd'], 'cálido y acogedor; azul de Lali, rosa de Oli'),
           ('Laboratorio', ['#fff9ee', '#3fb5b0', '#2a8187', '#7dffe7', '#f7d54a'], 'crema y turquesa; color vivo solo en cristales y huevos'),
           ('Tienda', ['#c48b52', '#f7e9cb', '#d94a3f', '#8f5c33', '#f7d54a'], 'madera clara, rayas rojas y crema'),
           ('Ermita', ['#8d8a99', '#615e6f', '#35559a', '#e8c47a', '#fff9ee'], 'piedra, azul pizarra y dorado de la campana'),
           ('Centro PC', ['#f7e9cb', '#c48b52', '#2a8187', '#d94a3f', '#7dffe7'], 'según la dirección elegida (A o B)')]
    for i, (n, cols, _) in enumerate(FAM):
        y = 6 + i * 13
        d.text((4, y - 1), n, fill=PAL['white'])
        for k, c in enumerate(cols): d.rectangle([60 + k * 14, y, 60 + k * 14 + 12, y + 10], fill=c, outline=INK)
    P = sprites(A); fila = [('mostrador', 'mostrador'), ('curacion', 'sanador'), ('pc', 'terminal PC'), ('banco', 'banco doble'), ('planta', 'planta'), ('estante', 'estante'), ('cama', 'cama'), ('mesa', 'mesa'), ('capsula', 'incubadora'), ('cristales', '7 cristales'), ('vitrina', 'vitrina'), ('altar', 'altar')]
    x0, y0 = 8, 80
    for i, (k, _) in enumerate(fila):
        w, h, f = P[k]; cx = x0 + (i % 6) * 64 + (64 - w) // 2 if w < 60 else x0 + (i % 6) * 64; cy = y0 + (i // 6) * 64 + (48 - h) // 2
        d.rectangle([x0 + (i % 6) * 64 - 3, y0 + (i // 6) * 64 - 3, x0 + (i % 6) * 64 + 58, y0 + (i // 6) * 64 + 52], fill='#3a3050'); f(d, cx + 4, cy); d.text((x0 + (i % 6) * 64, y0 + (i // 6) * 64 + 40), fila[i][1], fill=PAL['grey'])
    return im

def guarda(im, nombre, k=4):
    sal.mkdir(parents=True, exist_ok=True); im.resize((im.width * k, im.height * k), Image.NEAREST).save(sal / nombre); print('ok', sal / nombre)
guarda(habitacion(A, 'A'), 'biblia_int_centro_A.png'); guarda(habitacion(B, 'B'), 'biblia_int_centro_B.png'); guarda(catalogo(), 'biblia_int_catalogo.png', 3)
