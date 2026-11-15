# Técnica: curvas a alta resolución -> bajada a píxel por VOTACIÓN de color -> contorno selout -> limpieza de píxeles sueltos -> retoque a mano (ojo, boca, manchas).
import numpy as np
from PIL import Image, ImageDraw
K=12
def hx(c):return tuple(int(c[i:i+2],16) for i in (1,3,5))
def sel(c):
    r,g,b=c;return (int(r*.36),int(g*.36+3),int(b*.36+6))
class Lienzo:
    def __init__(s,W,H):
        s.W,s.H=W,H;s.img=np.zeros((H*K,W*K,3),np.uint8);s.cov=np.zeros((H*K,W*K),bool)
    def mask(s,fn):
        m=Image.new('L',(s.W*K,s.H*K),0);d=ImageDraw.Draw(m);fn(d);return np.array(m)>0
    def pintar(s,m,col,solo_dentro=None):
        if solo_dentro is not None:m=m&solo_dentro
        s.img[m]=hx(col);s.cov|=m
    def poly(s,pts):return s.mask(lambda d:d.polygon([(x*K,y*K) for x,y in pts],fill=255))
    def elipse(s,cx,cy,rx,ry):return s.mask(lambda d:d.ellipse([(cx-rx)*K,(cy-ry)*K,(cx+rx)*K,(cy+ry)*K],fill=255))
    def tubo(s,pts,radios,n=60,desp=(0,0),rf=1.0):  # desp = desplazamiento fijo en px
        P=np.array(pts,float);R=np.array(radios,float)
        def cr(P,t):
            P=np.vstack([P[0],P,P[-1]]);i=min(int(t),len(P)-4);u=t-i;a,b,c,d=P[i],P[i+1],P[i+2],P[i+3]
            return 0.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u**3)
        m=Image.new('L',(s.W*K,s.H*K),0);dr=ImageDraw.Draw(m)
        for k in range(n*(len(P)-1)+1):
            t=k/n;p=cr(P,min(t,len(P)-1-1e-9));r=np.interp(t,range(len(R)),R)*rf
            x,y=p[0]+desp[0],p[1]+desp[1]
            dr.ellipse([(x-r)*K,(y-r)*K,(x+r)*K,(y+r)*K],fill=255)
        return np.array(m)>0
def desp(m,dx,dy):
    o=np.zeros_like(m);dx=int(round(dx*K));dy=int(round(dy*K));H,W=m.shape
    ys=slice(max(0,dy),H+min(0,dy));xs=slice(max(0,dx),W+min(0,dx))
    yo=slice(max(0,-dy),H+min(0,-dy));xo=slice(max(0,-dx),W+min(0,-dx))
    o[ys,xs]=m[yo,xo];return o
def sombrear(L,m,base,luz,osc,d=0.9):
    L.pintar(m,base);L.pintar(m&~desp(m,d,d),luz);L.pintar(m&~desp(m,-d,-d),osc)
def contra(L,m,zonas):
    """contrasombreado por columnas: zonas=[(t_max,color)...] con t en 0..1 de arriba a abajo del cuerpo"""
    for x in range(m.shape[1]):
        ys=np.where(m[:,x])[0]
        if len(ys)==0:continue
        t0,t1=ys[0],ys[-1]+1
        for y in ys:
            t=(y-t0)/(t1-t0)
            for tm,c in zonas:
                if t<=tm:L.img[y,x]=hx(c);break
        L.cov[ys,x]=True
def bajar(L):
    H,W=L.H,L.W;out=[[None]*W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            c=L.cov[y*K:(y+1)*K,x*K:(x+1)*K]
            if c.mean()<0.5:continue
            b=L.img[y*K:(y+1)*K,x*K:(x+1)*K][c];k=(b[:,0].astype(int)<<16)|(b[:,1].astype(int)<<8)|b[:,2]
            v,n=np.unique(k,return_counts=True);v=v[n.argmax()];out[y][x]='#%06x'%v
    return out
def contorno(g,fuera=None):
    H,W=len(g),len(g[0]);o=[r[:] for r in g]
    for y in range(H):
        for x in range(W):
            if g[y][x] is None:
                for dy,dx in ((-1,0),(0,-1),(1,0),(0,1),(-1,-1),(1,-1),(-1,1),(1,1)):
                    yy,xx=y+dy,x+dx
                    if 0<=yy<H and 0<=xx<W and g[yy][xx]:o[y][x]='#%02x%02x%02x'%sel(hx(g[yy][xx]));break
    return o
def limpiar(g):
    H,W=len(g),len(g[0])
    for y in range(H):
        for x in range(W):
            c=g[y][x]
            if not c:continue
            vec=[g[y+dy][x+dx] for dy,dx in((-1,0),(1,0),(0,-1),(0,1)) if 0<=y+dy<H and 0<=x+dx<W and g[y+dy][x+dx]]
            if len(vec)>=3 and c not in vec:
                from collections import Counter;g[y][x]=Counter(vec).most_common(1)[0][0]
    return g
def parches(g,pt):
    for (x,y),c in pt.items():g[y][x]=c
    return g
def a_filas(g):
    cols=sorted({c for r in g for c in r if c});L='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    m={c:L[i] for i,c in enumerate(cols)}
    return {'pal':{v:k for k,v in m.items()},'filas':[''.join('.' if c is None else m[c] for c in r) for r in g]}
