import json,math,sys
import numpy as np
from PIL import Image, ImageDraw
d=json.load(open(sys.argv[1])); OUT=sys.argv[2]
def img(s):
    a=np.array(s['d'],dtype=np.uint8).reshape(s['h'],s['w'],4); return a
YR=[0,0]
def trim(a):
    xs=np.where(a[:,:,3].any(axis=0))[0]; return a[YR[0]:YR[1]+1, xs.min():xs.max()+1]
def build(sp, prof):
    al=[img(sp[k]) for k in ('down0','up0','left0')]; ys=np.concatenate([np.where(a[:,:,3].any(axis=1))[0] for a in al]); YR[0]=ys.min(); YR[1]=ys.max()
    F=trim(img(sp['down0'])); Sd=trim(img(sp['left0'])); B=trim(img(sp['up0']))
    H=F.shape[0]; W=F.shape[1]; D=Sd.shape[1]
    # alinear por la base; ancho/fondo centrados
    def row_ext(a,y):
        xs=np.where(a[y,:,3]>0)[0]; return (xs.min(),xs.max()) if len(xs) else None
    vox={}
    for y in range(H):
        fe=row_ext(F,y); se=row_ext(Sd,y)
        if fe is None: continue
        if se is None: se=(D//2,D//2)
        cx=(fe[0]+fe[1])/2; hw=(fe[1]-fe[0]+1)/2; cz=(se[0]+se[1])/2; hd=(se[1]-se[0]+1)/2
        for x in range(W):
            if F[y,x,3]==0: continue
            t=(x+0.5-cx)/hw; k=math.sqrt(max(0,1-t*t)); k=prof(k)
            n=max(1,int(round(2*hd*k)))
            z0=int(round(cz-n/2))
            for z in range(z0,z0+n): vox[(x,y,z)]=1
    return vox,F,Sd,B,W,H,D
def limpia(a):
    o=a.copy(); H,W=a.shape[:2]
    lum=lambda p:0.3*p[0]+0.59*p[1]+0.11*p[2]
    dark=(a[:,:,3]>0)&(a[:,:,:3].astype(int).sum(axis=2)<190)
    for _ in range(3):
        n=o.copy()
        for y in range(H):
            for x in range(W):
                if o[y,x,3]>0 and dark[y,x]:
                    best=None
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
                        yy,xx=y+dy,x+dx
                        if 0<=yy<H and 0<=xx<W and a[yy,xx,3]>0 and not dark[yy,xx]: best=a[yy,xx]; break
                    if best is not None: n[y,x,:3]=(best[:3]*0.85).astype(np.uint8)
        o=n
    return o
def render(vox,F,Sd,B,W,H,D,yaw,pit=16,S=11,size=(260,230)):
    im=Image.new('RGBA',size,(0,0,0,0)); dr=ImageDraw.Draw(im)
    cx,cy,cz=W/2,H/2,D/2; Fc=limpia(F); Sd=limpia(Sd); B=limpia(B); Sr=Sd[:,::-1]
    ya,pa=math.radians(yaw),math.radians(pit)
    def proj(x,y,z):
        X,Y,Z=-(x-cx),-(y-cy),-(z-cz)
        x1=X*math.cos(ya)+Z*math.sin(ya); z1=-X*math.sin(ya)+Z*math.cos(ya)
        y1=Y*math.cos(pa)-z1*math.sin(pa); z2=Y*math.sin(pa)+z1*math.cos(pa)
        return size[0]/2+x1*S, size[1]/2+8-y1*S, z2
    L=np.array([-0.5,0.8,0.6]); L=L/np.linalg.norm(L)
    faces=[]
    for (x,y,z) in vox:
        for n,(dx,dy,dz) in enumerate([(1,0,0),(-1,0,0),(0,-1,0),(0,1,0),(0,0,1),(0,0,-1)]):
            if (x+dx,y+dy,z+dz) in vox: continue
            # color
            Dw=Sd.shape[1]; zz=min(max(z,0),Dw-1)
            if dx>0: c=Sd[y,Dw-1-zz]
            elif dx<0: c=Sr[y,zz]
            elif dz==-1: c=B[y,min(x,B.shape[1]-1)]
            elif dz==1: c=F[y,x]
            else: c=Fc[y,x]
            if c[3]==0: c=F[min(y,F.shape[0]-1),x]
            if c[3]==0:
                c=F[F[:,:,3]>0][0]
            nrm=np.array([dx,-dy,dz],float)
            lum=0.62+0.5*max(0,float(nrm@L))+(0.12 if dy==-1 else 0)
            col=tuple(int(min(255,v*lum)) for v in c[:3])
            # cuatro esquinas
            if dx!=0: q=[(x+(dx>0),y,z),(x+(dx>0),y+1,z),(x+(dx>0),y+1,z+1),(x+(dx>0),y,z+1)]
            elif dy!=0: yy=y+(dy>0); q=[(x,yy,z),(x+1,yy,z),(x+1,yy,z+1),(x,yy,z+1)]
            else: zz=z+(dz>0); q=[(x,y,zz),(x+1,y,zz),(x+1,y+1,zz),(x,y+1,zz)]
            P=[proj(*p) for p in q]
            # normal en vista: descartar caras traseras
            ex=np.array([P[1][0]-P[0][0],P[1][1]-P[0][1]]); ey=np.array([P[3][0]-P[0][0],P[3][1]-P[0][1]])
            if abs(ex[0]*ey[1]-ex[1]*ey[0])<1e-6: continue
            # visibilidad por normal rotada
            nx,ny,nz=-dx,-dy,-dz
            x1=nx*math.cos(ya)+nz*math.sin(ya); z1=-nx*math.sin(ya)+nz*math.cos(ya)
            z2=ny*math.sin(pa)+z1*math.cos(pa)
            if z2>=-1e-6: continue
            zc=sum(p[2] for p in P)/4
            faces.append((zc,[(p[0],p[1]) for p in P],col))
    faces.sort(key=lambda f:-f[0])
    for _,P,col in faces: dr.polygon(P,fill=col+(255,),outline=col+(255,))
    return im
def sheet(ids,names):
    rows=[]
    for i in ids:
        sp=d[i]
        # redondez: 1 = elipse; mas bajo = mas plano
        vox,F,Sd,B,W,H,D=build(sp,lambda k:k**0.7)
        f2=Image.fromarray(trim(img(sp['down0'])),'RGBA'); k=8
        cols=[f2.resize((f2.width*k,f2.height*k),Image.NEAREST)]
        cols+= [render(vox,F,Sd,B,W,H,D,yw) for yw in (0,30,-30,90,180)]
        rows.append((i,cols,len(vox)))
    return rows
ids=sys.argv[3].split(',')
rows=sheet(ids,None)
CW=270; RH=250
sh=Image.new('RGB',(CW*6,RH*len(rows)+20),(112,160,100))
dr=ImageDraw.Draw(sh)
for r,(i,cols,n) in enumerate(rows):
    for c,im in enumerate(cols):
        sh.paste(im,(c*CW+(CW-im.width)//2, r*RH+20+(RH-im.height)//2),im)
    dr.text((4,r*RH+4),f'{i}  vóxeles={n}  | 2D frente | 3D 0° | 35° | 90° | -35° | 180°',fill=(255,255,255))
sh.save(OUT); print([ (i,n) for i,_,n in rows])
