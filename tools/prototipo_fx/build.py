d='/tmp/claude-0/-home-claude/4e0e286c-7912-51e9-bc7f-cd465bb46bd1/scratchpad/fx4/'
h=open(d+'efectos_combate.html',encoding='utf-8').read()
js=''.join(open(d+f,encoding='utf-8').read()+'\n' for f in ['nucleo.js','moves.js','moves2.js','moves3.js','moves4.js','moves5.js','moves6.js','moves7.js','moves8.js','main.js'])
i=h.index('<script>')+9; j=h.index('boot({')
open(d+'efectos_combate.html','w',encoding='utf-8').write(h[:i]+js+h[j:])
