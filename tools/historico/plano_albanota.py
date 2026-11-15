# v2.53: laboratorio en (11,22) y calle norte prolongada (auditoría urbanística). HISTÓRICO (v2.62d): plano ORIGINAL de la v2.53 (no refleja las ediciones posteriores del mapa). Uso: cd tools/historico && python3 plano_albanota.py  (escribe ../../docs/plano_albanota_48x36.png y mide huecos, reparto y pantallas de móvil)
from PIL import Image, ImageDraw, ImageFont
import json
W,H,T=48,36,24
R=lambda x,y,w,h:(x,y,w,h)
# --- datos del plano (x,y,w,h en casillas) ---
B={
 'Casa de Lali':((2,10,5,5),(4,14)),
 'Casa de Oli':((11,10,5,5),(13,14)),
 'Laboratorio':((11,22,5,5),(13,26)),
 'Centro PC':((21,5,7,5),(24,9)),
 'Tienda':((32,5,5,4),(34,8)),
 'Ermita del Primer Eco':((41,3,5,5),(43,7)),
}
PLAZA=(20,15,9,7)
HUERTOS=(33,21,7,6)
ARB=[]
ARBOLES0=[(9,3),(14,7),(18,4),(19,9),(8,8),(10,12),(17,13),(29,3),(30,8),(38,3),(39,12),(40,15),(45,11),(8,17-1+0),(31,13),(31,24),(30,26),(18,25),(15,19+3),(6,23),(2,22),(12,31-4),(35,13),(44,25),(44,22),(21,2)]

AGUA=[(0,29,48,3)]
PUENTE=(23,29,3,3)
CAMINOS=[(23,10,3,5),(26,10,18,2),(33,9,3,1),(0,17,20,3),(29,17,16,3),(42,8,3,9),(3,15,3,2),(12,15,3,2),(12,27,11,2),(23,22,3,13),(35,20,3,1),(43,7,1,1)]
ARCOS={'Entrada al bosque':(0,17,3,3),'Salida a Ruta 1':(23,34,3,2)}
PRUEBA={
 'Hoja':(1,2,6,7,'#3f9b4a'),'Aire':(1,20,6,6,'#9fc3e8'),'Eléctrico':(41,22,5,5,'#f2d13a'),
 'Agua':(41,27,5,2,'#3b82c4'),'Sombra':(38,32,8,3,'#7a5aa6'),'Roca':(29,32,8,3,'#8c857d'),'Fuego':(1,32,8,3,'#d9552b')}
ANCLAS={'inicio':(24,24),'guarida_zefirax (prueba)':(4,22)}
def gap(a,b):
    dx=max(a[0]-(b[0]+b[2]),b[0]-(a[0]+a[2]));dy=max(a[1]-(b[1]+b[3]),b[1]-(a[1]+a[3]));return max(dx,dy)
# --- comprobaciones ---
res=[]
names=list(B)
for i,a in enumerate(names):
    for b in names[i+1:]: res.append((a,b,gap(B[a][0],B[b][0])))
for a in names: res.append((a,'Plaza',gap(B[a][0],PLAZA))); res.append((a,'Huertos',gap(B[a][0],HUERTOS)))
res.append(('Plaza','Huertos',gap(PLAZA,HUERTOS)))
print('HUECOS (casillas libres entre piezas):')
for a,b,g in sorted(res,key=lambda r:r[2]): print(f'  {a} – {b}: {g}', '' if g>=4 else '  <<< MENOS DE 4')
# clasificación de casillas
cls=[['prado']*W for _ in range(H)]
def fill(r,c):
    for y in range(r[1],r[1]+r[3]):
        for x in range(r[0],r[0]+r[2]):
            if 0<=x<W and 0<=y<H: cls[y][x]=c
for y in range(H):
    for x in range(W):
        if x<2 or x>=W-2 or y<2 or y>=H-2: cls[y][x]='bosque'
for r in AGUA: fill(r,'agua')
for r in CAMINOS: fill(r,'camino')
fill(PLAZA,'plaza'); fill(HUERTOS,'huerto')
for g in ARB: fill(g,'arbol')
for n,(r,d) in B.items(): fill(r,'edificio')
fill(PUENTE,'camino')
for r in ARCOS.values(): fill(r,'camino')
from collections import Counter
c=Counter(v for row in cls for v in row);tot=W*H
print('REPARTO:',{k:f'{100*v/tot:.0f}%' for k,v in c.items()})
libre=c['prado']+c['camino']+c['plaza']
print(f'Libre o poco decorado (prado+caminos+plaza): {100*libre/tot:.0f}%')
# ventana de móvil 8x17: cosas importantes visibles
items={**{n:r for n,(r,d) in B.items()},'Plaza':PLAZA,'Huertos':HUERTOS,'Puente':PUENTE,**{k:v for k,v in ARCOS.items()}}
def inter(a,b): return not(a[0]+a[2]<=b[0] or b[0]+b[2]<=a[0] or a[1]+a[3]<=b[1] or b[1]+b[3]<=a[1])
mx=0;dist=Counter();worst=None
for y0 in range(0,H-17+1):
    for x0 in range(0,W-8+1):
        win=(x0,y0,8,17);n=[k for k,v in items.items() if inter(win,v)]
        dist[len(n)]+=1
        if len(n)>mx: mx=len(n);worst=(x0,y0,n)
print('Ventana 8x17: máx cosas importantes =',mx,worst);print('  reparto nº cosas por pantalla:',dict(sorted(dist.items())))
# --- dibujo ---
M=30;LEG=300
img=Image.new('RGB',(W*T+2*M,H*T+2*M+LEG),'#f4efe2');d=ImageDraw.Draw(img)
F=lambda s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',s)
col={'prado':'#bfe3a0','bosque':'#4c8a4a','agua':'#6fb3e6','camino':'#e3cf9e','plaza':'#c9c6cf','huerto':'#c49a6c','arbol':'#5a9b4e','edificio':'#d9d0c4'}
for y in range(H):
    for x in range(W):
        d.rectangle([M+x*T,M+y*T,M+x*T+T-1,M+y*T+T-1],fill=col[cls[y][x]])
for g in ARB:
    for yy in range(g[1],g[1]+g[3]):
        for xx in range(g[0],g[0]+g[2]):
            d.ellipse([M+xx*T+2,M+yy*T+2,M+xx*T+T-3,M+yy*T+T-3],fill='#3f8a45',outline='#2a1b30',width=2)
def okarbol(x,y):
    for n,(r,dr) in B.items():
        if r[0]-1<=x<=r[0]+r[2] and r[1]-1<=y<=r[1]+r[3]+1: return False
    if PLAZA[0]-3<=x<=PLAZA[0]+PLAZA[2]+2 and PLAZA[1]-3<=y<=PLAZA[1]+PLAZA[3]+2: return False
    if cls[y][x] not in ('prado',): return False
    if HUERTOS[0]-1<=x<=HUERTOS[0]+HUERTOS[2] and HUERTOS[1]-1<=y<=HUERTOS[1]+HUERTOS[3]: return False
    return True
ARBOLES=[]
print('árboles sueltos:',len(ARBOLES))
for (xx,yy) in ARBOLES:
    cx0,cy0=M+xx*T+T//2,M+yy*T+T//2
    d.rectangle([cx0-2,cy0+4,cx0+2,cy0+10],fill='#6b4a2b')
    d.ellipse([cx0-10,cy0-11,cx0+10,cy0+7],fill='#2f7a3a',outline='#2a1b30',width=2)
for x in range(0,W+1,8): d.line([M+x*T,M,M+x*T,M+H*T],fill='#00000030',width=1)
for y in range(0,H+1,6): d.line([M,M+y*T,M+W*T,M+y*T],fill='#00000030',width=1)
P=lambda x,y:(M+x*T,M+y*T)
def box(r,fill=None,out='#2a1b30',w=3):
    d.rectangle([*P(r[0],r[1]),*P(r[0]+r[2],r[1]+r[3])],fill=fill,outline=out,width=w)
def txt(x,y,s,sz=18,fill='#2a1b30',anchor='mm'): d.text(P(x,y),s,font=F(sz),fill=fill,anchor=anchor)
# zonas de prueba (discontinuas)
for n,(x,y,w,h,c0) in PRUEBA.items():
    r=(x,y,w,h);box(r,None,c0,3);txt(x+w/2,y+h/2,n[:3].upper(),16,c0)
# arcos
for n,r in ARCOS.items(): box(r,'#8b6b3d')
# edificios
for n,(r,dr) in B.items():
    box(r,'#c0504a');d.rectangle([*P(r[0],r[1]+2),*P(r[0]+r[2],r[1]+r[3])],fill='#f0e2c0',outline='#2a1b30',width=3)
    d.rectangle([*P(dr[0],dr[1]),*P(dr[0]+1,dr[1]+1)],fill='#2a1b30')
box(PLAZA,'#c9c6cf');box(HUERTOS,'#c49a6c')
# fuente
cx,cy=PLAZA[0]+4.5,PLAZA[1]+3.5
d.ellipse([*P(cx-1.5,cy-1.5),*P(cx+1.5,cy+1.5)],fill='#6fb3e6',outline='#2a1b30',width=3)
d.ellipse([*P(cx-.5,cy-.5),*P(cx+.5,cy+.5)],fill='#c85a9a',outline='#2a1b30',width=2)
# puente
box(PUENTE,'#a8703a')
# anclas
for n,(x,y) in ANCLAS.items():
    d.polygon([P(x+.5,y-.2),P(x+1.1,y+.5),P(x+.5,y+1.2),P(x-.1,y+.5)],fill='#ffd23f',outline='#2a1b30')
# ventanas móvil
for (x0,y0,l) in [(20,11,'Pantalla A'),(0,3,'Pantalla B')]:
    d.rectangle([*P(x0,y0),*P(x0+8,y0+17)],outline='#d6246e',width=4)
    txt(x0+4,y0+17.5,l+' (8×17)',15,'#d6246e')
# números de zona
NUM={1:(PLAZA[0]+4.5,PLAZA[1]-1.2),2:(24.5,3.2),3:(5,11.5),4:(37.5,13.2),5:(14,29.2),6:(1.5,17.5),7:(24.5,33.2)}
NUM={1:(21.4,16.4),2:(29.5,7.2),3:(8.5,12.6),4:(11,20.6),5:(36.5,19.6),6:(4.5,30.6),7:(1.5,15.6),8:(21.5,34.6),9:(39.2,5.6),}
for k,(x,y) in NUM.items():
    d.ellipse([P(x,y)[0]-17,P(x,y)[1]-17,P(x,y)[0]+17,P(x,y)[1]+17],fill='#fff',outline='#d6246e',width=4);txt(x,y,str(k),22,'#d6246e')
# rótulos
txt(24.5,18+2.7,'Plaza del Cascabel',16)
for n,(r,dr) in B.items(): txt(r[0]+r[2]/2,r[1]+r[3]/2+.8,{'Casa de Lali':'Lali','Casa de Oli':'Oli','Ermita del Primer Eco':'Ermita'}.get(n,n),13)
txt(36.5,24,'Huertos',14);txt(10,30.5,'Arroyo',14,'#fff');txt(44,30.5,'Arroyo',14,'#fff');txt(24.5,30.5,'Puente',12,'#fff')
txt(1.5,13.6,'Bosque',12,'#fff');txt(24.5,35.2,'Ruta 1',13,'#fff');pass
for (x,y) in [(22.7,14.5),(25.3,14.5),(22.7,22.5),(25.3,22.5),(19.5,16.7),(19.5,19.3),(29.5,16.7),(29.5,19.3)]:
    d.ellipse([P(x,y)[0]-5,P(x,y)[1]-5,P(x,y)[0]+5,P(x,y)[1]+5],fill='#ffd23f',outline='#2a1b30',width=2)
# ejes
for x in range(0,W,8): d.text((M+x*T+2,6),str(x),font=F(13),fill='#555')
for y in range(0,H,6): d.text((4,M+y*T+2),str(y),font=F(13),fill='#555')
d.text((M,H*T+M+4),'PLANO ALBANOTA 48×36 · casilla = 16 px · rejilla: cada 8 y 6 casillas · rosa = ventana de móvil 8×17',font=F(15),fill='#2a1b30')
leg=['1 Plaza del Cascabel 9×7: 4 entradas centradas (N, S, O, E) con farolas   2 Centro PC y Tienda (calle norte hasta la Ermita: bucle)',
'3 Barrio: Casa de Lali y Casa de Oli (5×5), puertas al norte de la avenida oeste   4 Laboratorio 5×5 bajo Oli (misma columna de puerta, 13)',
'5 Huertos 7×6 (puerta a la avenida este)   6 Arroyo con puente   7 Entrada al bosque (eje oeste–este con la plaza)',
'8 Salida a Ruta 1 (sur)   9 Ermita del Primer Eco (cooperativa; dos accesos: avenida este y calle norte)',
'Estrella = anclas (inicio, guarida de prueba) · cuadro oscuro = puerta con ancla volver · punto amarillo = farola',
'Recuadros de color = 7 zonas de aparición TEMPORALES de prueba, ocultas (Hoja, Aire, Eléctrico, Agua, Sombra, Roca, Fuego)',
'Verde oscuro = bosque de borde · verde claro = prado libre · beige = caminos · rosa = ventana de móvil 8×17']
for i,s in enumerate(leg): d.text((M,H*T+M+34+i*28),s,font=F(15),fill='#2a1b30')
img.save('../../docs/plano_albanota_48x36.png');print(img.size)
