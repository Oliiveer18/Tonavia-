#!/usr/bin/env python3
"""prueba_captura_2d.py — captura de criaturas en el 2D (v2.296), Chromium móvil 390×844. Uso: node build.js && python3 tools/prueba_captura_2d.py [carpeta_capturas]
Gana un combate, desliza la esfera con un gesto real hacia la criatura y comprueba: oferta, gasto de esfera, resultado, «sin identificar» y cierre."""
import pathlib, sys
from playwright.sync_api import sync_playwright
raiz = pathlib.Path(__file__).resolve().parent.parent; sal = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/capturas_captura2d'); sal.mkdir(parents=True, exist_ok=True); fallos = []
def ok(c, m):
    print('  ok ' if c else ' FALLO', m); (None if c else fallos.append(m))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True).new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + str(raiz / 'dist' / 'criaturas.html')); pg.wait_for_function('window.__juego'); pg.click('[data-pick=oli]'); pg.wait_for_timeout(800)
    pg.evaluate("()=>{const J=__juego,o=J.est.jugadores.oli,c=J.motor.criaturas(J.est,o.mapa)[0];c.x=o.x+48;c.y=o.y;J.motor.aplicar(J.est,{j:'oli',t:'combate'})}"); pg.wait_for_timeout(1500)
    pg.evaluate("()=>{const J=__juego;J.est.combate.c.u.find(u=>u.id[0]==='e').hp=1;for(let i=0;i<4000&&!J.est.combate.fin;i++)J.motor.combate.avanzar(J.est,0.05)}"); pg.wait_for_timeout(2600)
    ok(pg.evaluate("__juego.est.combate&&__juego.est.combate.cap&&__juego.est.combate.cap.fase")=='oferta', 'al ganar se ofrece la captura'); ok(pg.is_visible('#capl'), 'aparece la capa de lanzamiento'); pg.screenshot(path=str(sal/'oferta.png'))
    lanz = 0
    for intento in range(4):   # el resultado es aleatorio (semilla de la partida): se repite el gesto hasta capturar
        if intento:
            for _ in range(60):
                f = pg.evaluate("(()=>{const k=__juego.est.combate;return k&&k.cap?k.cap.fase:null})()")
                if f in ('oferta', 'ok', 'fin', None): break
                pg.wait_for_timeout(250)
            if f != 'oferta': break
        for _ in range(60):
            if pg.evaluate("G.combate2d.anillo(G.vista.combate(__juego.est,0).cap)") < 0.4: break
            pg.wait_for_timeout(40)
        cx, cy = pg.evaluate("()=>{const J=__juego,c=G.vista.combate(J.est,0).cap,r=document.getElementById('game').getBoundingClientRect(),v=J.view(),Kc=r.width/v.VW;return [r.left+(c.x-J.cam.x)*Kc, r.top+(c.y-c.h*0.5-J.cam.y)*Kc]}")
        pg.mouse.move(250, 700); pg.mouse.down(); pg.mouse.move((250+cx)/2, (700+cy)/2, steps=4); pg.mouse.move(cx, cy+10, steps=4); pg.mouse.up(); pg.wait_for_timeout(200); lanz += 1
        if intento == 0: ok(pg.evaluate("__juego.est.jugadores.oli.esferas")==4, 'el lanzamiento gasta una esfera'); pg.screenshot(path=str(sal/'vuelo.png'))
        for _ in range(40):
            pg.wait_for_timeout(250)
            if pg.evaluate("(()=>{const k=__juego.est.combate;return !k||!k.cap||['ok','huye','fin','oferta'].includes(k.cap.fase)})()"): break
        if (pg.evaluate("(__juego.est.jugadores.oli.sinId||[]).length")): break
    ok(pg.evaluate("(__juego.est.jugadores.oli.sinId||[]).length")==1, 'la criatura capturada queda «sin identificar» (%d lanzamientos)' % lanz); pg.screenshot(path=str(sal/'capturada.png'))
    pg.wait_for_timeout(2600); ok(not pg.evaluate("!!__juego.est.combate"), 'el combate se cierra tras la captura'); ok(not pg.is_visible('#capl'), 'la capa de lanzamiento se oculta')
    ok(not errs, 'sin errores en la consola' + ('' if not errs else ': ' + str(errs[:3]))); b.close()
print('\n%d FALLO(S)' % len(fallos) if fallos else '\nprueba de captura 2D ok'); sys.exit(1 if fallos else 0)
