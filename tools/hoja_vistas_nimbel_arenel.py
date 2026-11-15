import json,math
import numpy as np
from PIL import Image,ImageDraw,ImageFont
d=json.load(open('sprites2.json'))
BG=(43,37,64); PANEL=(54,47,78); GRID=(78,70,104); TX=(235,232,245); TX2=(170,164,195)
def F(n,b=False):
    try: return ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',n,index=1 if b else 0)
    except: return ImageFont.load_default()
W=1480; im=Image.new('RGB',(W,1900),BG); dr=ImageDraw.Draw(im)
def spr(i,k,K):
    s=d[i][k]; a=np.array(s['d'],dtype=np.uint8).reshape(s['h'],s['w'],4); t=Image.fromarray(a,'RGBA')
    return t.resize((s['w']*K,s['h']*K),Image.NEAREST)
def tile(x,y,w,h,i,k,lab,K=8):
    dr.rounded_rectangle([x,y,x+w,y+h],8,fill=PANEL); t=spr(i,k,K); im.paste(t,(x+(w-t.width)//2,y+(h-28-t.height)//2),t); dr.text((x+w//2,y+h-18),lab,font=F(15),fill=TX2,anchor='mm')
def panel(x,y,w,h,tit):
    dr.rounded_rectangle([x,y,x+w,y+h],8,fill=PANEL); dr.text((x+10,y+8),tit,font=F(14),fill=TX2)
S=190  # px por unidad
def ax(box,ox,oy):  # devuelve funciones u->px (origen suelo centro)
    return lambda u:box[0]+ox+u*S, lambda v:box[1]+oy-v*S
def grid(box,ox,oy,ur,ul,vt):
    X,Y=ax(box,ox,oy)
    u=-ul
    while u<=ur+1e-6: dr.line([X(u),box[1]+30,X(u),box[3]-6],fill=GRID); u+=0.25
    v=0
    while v<=vt+1e-6: dr.line([box[0]+6,Y(v),box[2]-6,Y(v)],fill=GRID); v+=0.25
    dr.line([box[0]+6,Y(0),box[2]-6,Y(0)],fill=(120,112,150),width=2)
    return X,Y
def circ(X,Y,u,v,r,col,out=(30,24,44),w=2): dr.ellipse([X(u-r),Y(v+r),X(u+r),Y(v-r)],fill=col,outline=out,width=w)
def ell(X,Y,u,v,ru,rv,col,out=(30,24,44),w=2): dr.ellipse([X(u-ru),Y(v+rv),X(u+ru),Y(v-rv)],fill=col,outline=out,width=w)
def rect(X,Y,u0,v0,u1,v1,col,out=(30,24,44),w=2): dr.rectangle([X(u0),Y(v1),X(u1),Y(v0)],fill=col,outline=out,width=w)
def poly(X,Y,pts,col,out=(30,24,44),w=2): dr.polygon([(X(a),Y(b)) for a,b in pts],fill=col,outline=out)
def chip(x,y,col,lab):
    dr.rectangle([x,y,x+22,y+22],fill=col,outline=(20,16,30)); dr.text((x+30,y+11),lab,font=F(14),fill=TX,anchor='lm')
dr.text((20,14),'Nimbel y Arenel · hoja de vistas para el 3D (v2.226, paso 2)',font=F(30,True),fill=TX)
dr.text((20,54),'1 u = 1 casilla = 16 px · luz fija arriba-izquierda · cada cuadro del fondo = 0,25 u · propuesta pendiente de aprobación (primera forma: se afina en los pasos 3 y 4)',font=F(15),fill=TX2)
# ---------------- NIMBEL ----------------
y0=90
dr.text((20,y0),'NIMBEL (id nubecin) · Aire · Común · 20×12 px = 1,25 × 0,75 u · 0,1 kg · fase única',font=F(21,True),fill=TX)
vs=[('down0','frente'),('up0','espalda'),('left0','perfil izq.'),('right0','perfil der.'),('down1','paso B (sube 1 px)')]
for n,(k,l) in enumerate(vs): tile(20+n*198,y0+34,188,150,'nubecin',k,l)
bx=[20+5*198+10,y0+34,W-20,y0+184]; panel(*bx,'Lo que se conserva del 2D')
for n,t in enumerate(['Nube blanca baja y ancha que flota','Cara: ojos oscuros, mofletes rosas, boca pequeña','Parte baja azulada (sombra de nube)','Rasgo: flota, y sube 1 px en el paso B']): dr.text((bx[0]+12,bx[1]+38+n*26),'· '+t,font=F(14),fill=TX)
# blueprints
yb=y0+200; bw=470; bh=300
boxes=[[20+k*(bw+15),yb,20+k*(bw+15)+bw,yb+bh] for k in range(3)]
for b,t in zip(boxes,['alzado frontal (x–y)','alzado lateral (z–y)','planta (x–z)']): panel(*b,t)
LUMPS=[(-0.31,0.30,-0.10,0.20),(0.30,0.30,0.10,0.19),(-0.14,0.44,0.00,0.22),(0.15,0.45,0.00,0.23),(0.0,0.31,0.04,0.27)]  # x,y,z,r
BL=(255,249,238); SH=(183,213,238); MID=(143,180,231)
# frontal
X,Y=grid(boxes[0],235,265,1.2,1.2,0.8)
rect(X,Y,-0.5,0,0.5,0.12,SH)
for x,y,z,r in sorted(LUMPS,key=lambda l:-l[2]): ell(X,Y,x,y,r,r*0.9,BL)
rect(X,Y,-0.20,0.18,0.20,0.20,SH,SH,0)
dr.text((X(0.3),Y(0.72)),'5 bultos',font=F(13),fill=TX2)
# cara decal
ell(X,Y,-0.10,0.40,0.03,0.035,(42,27,48),(42,27,48),0); ell(X,Y,0.10,0.40,0.03,0.035,(42,27,48),(42,27,48),0); rect(X,Y,-0.03,0.31,0.03,0.33,(42,27,48),(42,27,48),0)
ell(X,Y,-0.20,0.32,0.045,0.025,(228,122,154),(228,122,154),0); ell(X,Y,0.20,0.32,0.045,0.025,(228,122,154),(228,122,154),0)
dr.text((X(0),Y(0.0)+16),'cara = lámina recortada del 2D · base azul sombra',font=F(12),fill=TX2,anchor='mm')
# lateral
X,Y=grid(boxes[1],235,265,1.2,1.2,0.8)
rect(X,Y,-0.4,0,0.4,0.12,SH)
for x,y,z,r in sorted(LUMPS,key=lambda l:l[0]): ell(X,Y,z,y,r,r*0.9,BL)
dr.text((X(0.32),Y(0.0)-70),'frente >',font=F(13),fill=TX2)
# planta
X,Y=grid(boxes[2],235,150,1.2,1.2,0.0)
# para planta: eje vertical = z (hacia delante arriba), usamos Y(v) con v=z
for v in (-0.5,-0.25,0.25,0.5): dr.line([boxes[2][0]+6,Y(v),boxes[2][2]-6,Y(v)],fill=GRID)
for x,y,z,r in LUMPS: circ(X,Y,x,z,r,BL)
dr.text((X(0.45),Y(0.5)),'frente (arriba)',font=F(13),fill=TX2)
# datos
yt=yb+bh+12
panel(20,yt,W-40,168,'Diseño 3D propuesto')
tx=['Cuerpo: 5 bultos de nube (esferas bajas de 6 lados × 3 anillos, aplastadas ×0,9 en y) sacados de los círculos del 2D, sobre una base plana azulada de sombra (≈ 0,12 u).',
'Cara: lámina recortada del 2D (ojos, mofletes, boca) pegada al bulto central, sin sombrear (lo que «brilla» no se oscurece). Colores: blanco #fff9ee · sombra #b7d5ee · #8fb4e7 · rosa #e47a9a / #e0538e · tinta #2a1b30.',
'Movimiento: vaivén de 0,04 u (periodo ≈ 3 s) y cada bulto «respira» (±3 %) desfasado; al moverse, los bultos traseros se retrasan un poco (nube que arrastra). Gira con el yaw igual que Zefirax.',
'Presupuesto: 5 bultos × 36 + base 4 + cara 2 + jirones de abajo (2 gotas) ≈ 190 triángulos (máx. 300). Sombra: elipse 0,55 × 0,3 u. Sin chispas ni partículas nuevas.']
for n,t in enumerate(tx):
    dr.text((32,yt+34+n*31),t,font=F(13),fill=TX)
# ---------------- ARENEL ----------------
y1=yt+190
dr.text((20,y1),'ARENEL (id arenel) · Roca · Común · 14×12 px = 0,875 × 0,75 u · 2 kg · evoluciona a Arenax (fuera de este plan)',font=F(21,True),fill=TX)
vs=[('down0','frente'),('up0','espalda'),('left0','perfil izq.'),('right0','perfil der.'),('down1','paso B (sube 1 px)'),('down2','parado: ojos alzados + arena')]
tw=(W-40-5*10)//6
for n,(k,l) in enumerate(vs): tile(20+n*(tw+10),y1+34,tw,150,'arenel',k,l,K=7)
yb=y1+200
boxes=[[20+k*(bw+15),yb,20+k*(bw+15)+bw,yb+bh] for k in range(3)]
for b,t in zip(boxes,['alzado frontal (x–y)','alzado lateral (z–y)','planta (x–z)']): panel(*b,t)
SA=(232,196,122); SL=(247,223,166); SD=(201,160,90); SDD=(154,114,64); CO=(232,98,79); COD=(168,53,47); CAP=(63,127,214); CAPL=(120,170,242); CAPD=(39,85,156); RIM=(211,222,239); WH=(255,253,245); INK=(42,27,48)
# frontal
X,Y=grid(boxes[0],235,265,1.2,1.2,0.8)
for x in (-0.30,0.30):
    for dz in (0,): rect(X,Y,x-0.025,0.0,x+0.025,0.11,SDD)
for x in (-0.18,0.18): rect(X,Y,x-0.02,0.0,x+0.02,0.09,SDD)
ell(X,Y,0,0.26,0.35,0.19,SA)
poly(X,Y,[(-0.19,0.31),(0.19,0.31),(0.15,0.62),(-0.15,0.62)],CAP)
rect(X,Y,-0.16,0.60,0.16,0.64,RIM)
for x in (-0.28,0.28): rect(X,Y,x-0.025,0.40,x+0.025,0.50,SA); rect(X,Y,x-0.09,0.50,x+0.09,0.68,WH); rect(X,Y,x-0.035,0.54,x+0.035,0.62,INK)
for x in (-0.34,0.34): ell(X,Y,x,0.22,0.09,0.09,CO)
dr.text((X(0),Y(0)+16),'tapón azul · ojos en pedúnculo · pinzas coral · patas',font=F(12),fill=TX2,anchor='mm')
# lateral (z hacia la derecha = frente)
X,Y=grid(boxes[1],235,265,1.2,1.2,0.8)
for z in (-0.15,0.0,0.15): rect(X,Y,z-0.025,0.0,z+0.025,0.11,SDD)
ell(X,Y,0,0.26,0.30,0.19,SA)
poly(X,Y,[(-0.28,0.31),(0.10,0.31),(0.06,0.62),(-0.22,0.62)],CAP); rect(X,Y,-0.24,0.60,0.08,0.64,RIM)
rect(X,Y,0.08,0.40,0.13,0.50,SA); rect(X,Y,0.02,0.50,0.20,0.68,WH); rect(X,Y,0.12,0.54,0.19,0.62,INK)
ell(X,Y,0.27,0.22,0.10,0.09,CO)
dr.text((X(0.38),Y(0.0)-90),'frente >',font=F(13),fill=TX2)
# planta
X,Y=grid(boxes[2],235,150,1.2,1.2,0.0)
for v in (-0.5,-0.25,0.25,0.5): dr.line([boxes[2][0]+6,Y(v),boxes[2][2]-6,Y(v)],fill=GRID)
for x in (-0.30,0.30):
    for z in (-0.15,0.0,0.15): circ(X,Y,x*1.0,z,0.03,SDD)
ell(X,Y,0,0,0.35,0.28,SA)
circ(X,Y,0,-0.08,0.19,CAP); circ(X,Y,0,-0.08,0.13,CAPL)
for x in (-0.28,0.28): rect(X,Y,x-0.09,0.08,x+0.09,0.26,WH); rect(X,Y,x-0.035,0.16,x+0.035,0.24,INK)
for x in (-0.36,0.36): ell(X,Y,x,0.14,0.09,0.12,CO)
dr.text((X(0.45),Y(0.5)),'frente (arriba)',font=F(13),fill=TX2)
yt=yb+bh+12
panel(20,yt,W-40,198,'Diseño 3D propuesto')
tx=['Cuerpo: concha de arena aplastada (elipsoide 0,70 × 0,38 × 0,56 u, 8 lados × 3 anillos). Tapón de botella azul como casa, sobre la parte trasera: prisma de 6 lados que se estrecha, con aro claro #d3deef arriba.',
'Ojos: dos pedúnculos de arena (prisma de 4 caras) con un cubo blanco encima y pupila oscura en el frente. Pinzas coral: brazo + dos mandíbulas de prisma por lado. Patas: 3 por lado, dos tramos cada una, arena oscura.',
'Colores: arena #e8c47a / #f7dfa6 / #c9a05a / #9a7240 · tapón #3f7fd6 / #78aaf2 / #27559c · coral #e8624f / #a8352f / #e41921 · ojo #fffdf5 · tinta #2a1b30.',
'Movimiento: anda de LADO (las patas alternan en dos grupos de tres); parado alza los ojos 1 px (+0,06 u) y suelta granitos de arena con las partículas que ya existen (paso 5, sin partículas nuevas).',
'Presupuesto: cuerpo 48 + tapón 26 + ojos (2 × 20) + pinzas (2 × 32) + patas (6 × 8) ≈ 230 triángulos (máx. 300). Sombra: elipse 0,5 × 0,3 u.']
for n,t in enumerate(tx): dr.text((32,yt+34+n*31),t,font=F(13),fill=TX)
im=im.crop((0,0,W,yt+212)); im.save('hoja_vistas.png'); print(im.size)
