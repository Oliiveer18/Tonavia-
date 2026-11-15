import json,math,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
d=json.load(open('sprites2.json'))
def img(i,k):
    s=d[i][k]; return np.array(s['d'],dtype=np.uint8).reshape(s['h'],s['w'],4)
def limpia(a):
    o=a.copy(); H,W=a.shape[:2]
    dark=(a[:,:,3]>0)&(a[:,:,:3].astype(int).sum(axis=2)<190)
    for _ in range(3):
        n=o.copy()
        for y in range(H):
            for x in range(W):
                if o[y,x,3]>0 and dark[y,x]:
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
                        yy,xx=y+dy,x+dx
                        if 0<=yy<H and 0<=xx<W and a[yy,xx,3]>0 and not dark[yy,xx]: n[y,x,:3]=(a[yy,xx,:3]*0.93).astype(np.uint8); break
        o=n
    return o
def crop(a): 
    xs=np.where(a[:,:,3].any(axis=0))[0]; ys=np.where(a[:,:,3].any(axis=1))[0]; return a[ys.min():ys.max()+1,xs.min():xs.max()+1]
LAT={}
ZC=[0]
def build(i,partes,modo='A'):
    full=img(i,'down0'); xs=np.where(full[:,:,3].any(axis=0))[0]; ys=np.where(full[:,:,3].any(axis=1))[0]
    F=crop(full); up=img(i,'up0')[ys.min():ys.max()+1, xs.min():xs.max()+1]
    H,W=F.shape[:2]; Fc=limpia(F); Uc=limpia(up); vox={}
    LAT.clear(); LAT.update(dict(L=img(i,'left0'),R=img(i,'right0'),x0=int(xs.min()),y0=int(ys.min()),cw=full.shape[1]))
    for nombre,mask,zf in partes:
        ok=lambda x,y: 0<=x<W and 0<=y<H and F[y,x,3]>0 and mask(x,y,W,H)
        dist={}; fr=[]
        for y in range(H):
            for x in range(W):
                if ok(x,y) and any(not ok(x+a,y+b) for a,b in ((1,0),(-1,0),(0,1),(0,-1))): dist[(x,y)]=1; fr.append((x,y))
        k=0
        while fr:
            k+=1; nx=[]
            for (x,y) in fr:
                for a,b in ((1,0),(-1,0),(0,1),(0,-1)):
                    p=(x+a,y+b)
                    if ok(*p) and p not in dist: dist[p]=dist[(x,y)]+1; nx.append(p)
            fr=nx
        for (x,y),dd in dist.items():
            rr=zf(x,y); rr=[rr] if isinstance(rr,tuple) else rr
            for (z0,z1) in rr:
              t=z1-z0
              if modo=='A':   # bloque biselado: el borde retrocede 1 px por cada lado
                  if dd==1 and t>3: z0+=1; z1-=1
              elif modo=='B': # relieve: frente plano, trasera redondeada
                  r={1:3,2:1}.get(dd,0); r=min(r,max(0,t-2)); z0+=r
              elif modo=='C': # medallón: dos escalones por cada lado
                  r={1:2,2:1}.get(dd,0); r=min(r,max(0,(t-2)//2)); z0+=r; z1-=r
              if modo=='D':   # cúpula: frente plano, el fondo crece con la distancia al borde
                  th=max(2,int(round(t*math.sqrt(min(dd,5)/5.0)))); z0=z1-th
              for z in range(z0,z1): vox[(x,y,z)]=(nombre,)
    return vox,F,Fc,up,Uc,W,H
def facecol(v,p,dx,dy,dz,F,Fc,up,Uc):
    x,y,z=p
    if dz==1: return F[y,x]
    if dz==-1 and up[y,x,3]>0: return up[y,x]
    if dx!=0 and LAT:
        yy=y+LAT['y0']; cl=ZC[0]-z
        if dx>0: c=LAT['L'][yy,cl] if 0<=cl<LAT['cw'] else None
        else:
            cr=LAT['cw']-1-cl; c=LAT['R'][yy,cr] if 0<=cr<LAT['cw'] else None
        if c is not None and c[3]>0: return c
    return Fc[y,x]
def greedy(vox):
    tri=0
    for axis in range(3):
        for sg in (-1,1):
            planes={}
            for (x,y,z),meta in vox.items():
                n=[0,0,0]; n[axis]=sg
                if (x+n[0],y+n[1],z+n[2]) in vox: continue
                c=(x,y,z); k=c[axis]; u=[a for i,a in enumerate(c) if i!=axis]
                planes.setdefault(k,{})[tuple(u)]=meta[0]
            for k,g in planes.items():
                seen=set()
                for (u,v) in sorted(g):
                    if (u,v) in seen: continue
                    col=g[(u,v)]; w=1
                    while (u+w,v) in g and (u+w,v) not in seen and g[(u+w,v)]==col: w+=1
                    h=1
                    while all((u+i,v+h) in g and (u+i,v+h) not in seen and g[(u+i,v+h)]==col for i in range(w)): h+=1
                    for i in range(w):
                        for j in range(h): seen.add((u+i,v+j))
                    tri+=2
    return tri
def render(vox,F,Fc,up,Uc,W,H,yaw,pit=16,S=11,size=(280,250),zc=0):
    im=Image.new('RGBA',size,(0,0,0,0)); dr=ImageDraw.Draw(im)
    cx,cy=W/2,H/2
    ya,pa=math.radians(yaw),math.radians(pit)
    def proj(x,y,z):
        X,Y,Z=-(x-cx),-(y-cy),-(z-zc)
        x1=X*math.cos(ya)+Z*math.sin(ya); z1=-X*math.sin(ya)+Z*math.cos(ya)
        y1=Y*math.cos(pa)-z1*math.sin(pa); z2=Y*math.sin(pa)+z1*math.cos(pa)
        return size[0]/2+x1*S, size[1]/2+8-y1*S, z2
    L=np.array([-0.5,0.8,0.6]); L=L/np.linalg.norm(L); faces=[]
    for p in vox:
        x,y,z=p
        for dx,dy,dz in [(1,0,0),(-1,0,0),(0,-1,0),(0,1,0),(0,0,1),(0,0,-1)]:
            if (x+dx,y+dy,z+dz) in vox: continue
            nx,ny,nz=-dx,-dy,-dz
            x1=nx*math.cos(ya)+nz*math.sin(ya); z1=-nx*math.sin(ya)+nz*math.cos(ya)
            if ny*math.sin(pa)+z1*math.cos(pa)>=-1e-6: continue
            c=facecol(vox[p],p,dx,dy,dz,F,Fc,up,Uc)
            lum=0.80+0.38*max(0,float(np.array([dx,-dy,dz],float)@L))+(0.0 if dy==-1 else 0)
            if dz==1: lum=1.0
            elif dz==-1: lum=0.95
            elif dx!=0: lum=0.92+0.12*max(0,float(np.array([dx,0,0],float)@L))
            col=tuple(int(min(255,v*lum)) for v in c[:3])
            if dx!=0: q=[(x+(dx>0),y,z),(x+(dx>0),y+1,z),(x+(dx>0),y+1,z+1),(x+(dx>0),y,z+1)]
            elif dy!=0: yy=y+(dy>0); q=[(x,yy,z),(x+1,yy,z),(x+1,yy,z+1),(x,yy,z+1)]
            else: zz=z+(dz>0); q=[(x,y,zz),(x+1,y,zz),(x+1,y+1,zz),(x,y+1,zz)]
            P=[proj(*a) for a in q]; faces.append((sum(a[2] for a in P)/4,[(a[0],a[1]) for a in P],col))
    faces.sort(key=lambda f:-f[0])
    for _,P,col in faces: dr.polygon(P,fill=col+(255,),outline=col+(255,))
    return im
# ---- Nimbel: el fondo de cada fila sale del sprite de PERFIL (left0); ZC fija la correspondencia z <-> columna del perfil
def nim_z(x,y):
    row=np.where(LAT['L'][y+LAT['y0'],:,3]>0)[0]
    if len(row)<4: return (-3,3)
    a,b=int(row.min()),int(row.max()); return (ZC[0]-b+1, ZC[0]-a)
NIM=[('cuerpo',lambda x,y,W,H:y<=11,nim_z),('gotas',lambda x,y,W,H:y>=12,lambda x,y:(-1,3))]
# ---- Arenel: z = 7 - columna del perfil (frente z>0)
cl=lambda x,y,W,H:7<=y<=10 and (x<=3 or x>=12)
ey=lambda x,y,W,H:1<=y<=5 and (1<=x<=4 or 11<=x<=14)
cp=lambda x,y,W,H:1<=y<=5 and 5<=x<=10
lg=lambda x,y,W,H:y>=12 and not (y==12 and 6<=x<=9)
bd=lambda x,y,W,H:not(cl(x,y,W,H) or ey(x,y,W,H) or cp(x,y,W,H) or lg(x,y,W,H))
def leg_z(x,y): return [(4,5),(0,1)] if x in (3,12) else [(2,3),(-2,-1)]
ARE=[('cuerpo',bd,lambda x,y:(-6,4)),('tapon',cp,lambda x,y:(-6,2)),('ojos',ey,lambda x,y:(3,7)),('pinzas',cl,lambda x,y:(4,8)),('patas',lg,leg_z)]
ZCS={'nubecin':10,'arenel':7}
def F(n,b=False):
    try: return ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',n,index=1 if b else 0)
    except: return ImageFont.load_default()
BG=(43,37,64); PANEL=(54,47,78); TX=(235,232,245); TX2=(170,164,195)
NOM={'A':'A · bloque biselado (frente y espalda planos, borde −1 px)','B':'B · relieve (frente plano exacto, trasera redondeada)','C':'C · medallón (frente y espalda con dos escalones de borde)','D':'D · cúpula (frente plano exacto, fondo que crece desde el borde)'}
def hoja(i,partes,tit,salida):
    W_=1480; sh=Image.new('RGB',(W_,100+4*262),BG); dr=ImageDraw.Draw(sh); res=[]
    dr.text((20,12),f'{tit} · cuatro propuestas de modelado por piezas (v2.227)',font=F(26,True),fill=TX)
    dr.text((20,48),'Cada parte del dibujo es una pieza con su fondo y posición; la cara frontal es el sprite tal cual. Triángulos tras fusionar caras del mismo color.',font=F(14),fill=TX2)
    for r,m in enumerate('ABCD'):
        ZC[0]=ZCS[i]; vox,Fr,Fc,up,Uc,W,H=build(i,partes,m); tri=greedy(vox); res.append((m,len(vox),tri)); y0=80+r*262
        dr.rounded_rectangle([20,y0,W_-20,y0+252],8,fill=PANEL); dr.text((32,y0+8),f'{NOM[m]} · {len(vox)} vóxeles · ≈ {tri} triángulos',font=F(16,True),fill=TX)
        for q,(kk,lb) in enumerate((('down0','2D frente'),('left0','2D perfil'),('up0','2D espalda'))):
            sp=d[i][kk]; t=Image.fromarray(np.array(sp['d'],dtype=np.uint8).reshape(sp['h'],sp['w'],4),'RGBA'); t=t.resize((sp['w']*4,sp['h']*4),Image.NEAREST)
            sh.paste(t,(24,y0+34+q*72),t); dr.text((24+sp['w']*2,y0+34+q*72+sp['h']*4+6),lb,font=F(11),fill=TX2,anchor='mm')
        for n,(yw,pt,lab) in enumerate([(0,-14,'frente'),(30,-18,'3/4 derecha'),(-35,-22,'3/4 izquierda'),(90,-14,'perfil'),(0,-90,'planta'),(180,-14,'espalda')]):
            im=render(vox,Fr,Fc,up,Uc,W,H,yw,pt,S=9,size=(205,215)); px=150+n*215; sh.paste(im,(px,y0+30),im); dr.text((px+98,y0+240),lab,font=F(12),fill=TX2,anchor='mm')
    sh.save(salida); return res
print(hoja('nubecin',NIM,'NIMBEL','hoja_nimbel.png')); print(hoja('arenel',ARE,'ARENEL','hoja_arenel.png'))
