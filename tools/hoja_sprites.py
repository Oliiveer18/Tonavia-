import json,sys
from PIL import Image
d=json.load(open(sys.argv[1])); out=sys.argv[2]; K=int(sys.argv[3]) if len(sys.argv)>3 else 6
ids=list(d.keys()); dirs=sys.argv[4].split(',') if len(sys.argv)>4 else ['down0','down1','up0','left0','left1','right0']
bg=(70,110,60)
cw=max(v['w'] for i in ids for v in d[i].values())+2; ch=max(v['h'] for i in ids for v in d[i].values())+2
img=Image.new('RGB',(cw*len(dirs)*K,ch*len(ids)*K),bg)
for r,i in enumerate(ids):
  for c,dr in enumerate(dirs):
    s=d[i][dr]; im=Image.new('RGBA',(s['w'],s['h'])); im.putdata([tuple(s['d'][k:k+4]) for k in range(0,len(s['d']),4)])
    im=im.resize((s['w']*K,s['h']*K),Image.NEAREST); img.paste(im,((c*cw+1)*K,(r*ch+1)*K),im)
img.save(out)
