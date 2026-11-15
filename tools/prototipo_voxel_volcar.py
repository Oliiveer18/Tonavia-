import json,sys
from playwright.sync_api import sync_playwright
out={}
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('file:///Volumes/VENYI/criaturas_v2_209/dist/criaturas.html'); pg.wait_for_timeout(400)
    for i in ['nubecin','arenel','somnin']:
        out[i]={}
        for d in ['down','up','left','right']:
            for f in [0,1,2]:
                out[i][d+str(f)]=pg.evaluate("([i,d,f])=>{const s=G.creatureSprite(i,d,f);const x=s.c.getContext('2d').getImageData(0,0,s.w,s.h);return {w:s.w,h:s.h,d:Array.from(x.data)}}",[i,d,f])
    b.close()
json.dump(out,open(sys.argv[1],'w'))
print({i:{k:(v['w'],v['h']) for k,v in out[i].items()} for i in out})
