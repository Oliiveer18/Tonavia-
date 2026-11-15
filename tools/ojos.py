# ojos.py <hoja.json> : mide si los ojos de la vista frontal (píxeles casi blancos) están centrados y a la misma altura.
# Para cada criatura da: nº de píxeles blancos a izquierda/derecha, desfase horizontal (0 = ojos simétricos) y desfase vertical.
import json, sys
d = json.load(open(sys.argv[1]))
for i, v in d.items():
    s = v['down0']; w, h, px = s['w'], s['h'], s['d']
    L = []; R = []
    for y in range(h):
        for x in range(w):
            k = (y * w + x) * 4
            if px[k + 3] and px[k] > 238 and px[k + 1] > 238 and px[k + 2] > 225:
                (L if x < w / 2 else R).append((x, y))
    if not L or not R:
        print(f"{i:10s} sin par de ojos blancos"); continue
    lx = sum(x for x, _ in L) / len(L); rx = sum(x for x, _ in R) / len(R)
    ly = sum(y for _, y in L) / len(L); ry = sum(y for _, y in R) / len(R)
    dx = (w - 1 - lx) - rx   # 0 si el ojo derecho es el reflejo exacto del izquierdo
    print(f"{i:10s} blancos {len(L):2d}/{len(R):2d}  desfase horizontal {dx:+.1f} px  desfase vertical {ly - ry:+.1f} px")
