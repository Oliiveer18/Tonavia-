#!/usr/bin/env python3
# tools/prueba_santuario.py — prueba en Chromium móvil (390×844) el SANTUARIO UNIVERSAL · Etapas A, B1, B2 y B3 (v2.367): portal del Nexus con nivel 8, Umbral y Guardiana, hogar propio, Cuidador y panel de residentes,
# criaturas reales de la caja moviéndose, noche (duermen), guardado y recarga DENTRO del hogar, salida hasta el Nexus y pintado en 2D clásico y 2D.
# Uso: node build.js && python3 tools/prueba_santuario.py   Última línea: «OK» o «FALLA: n». Capturas: docs/santuario_v2369_*_390x844.png
import os
from playwright.sync_api import sync_playwright
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); html = os.path.join(raiz, 'dist', 'criaturas.html'); err = []; fallos = []
def ok(c, m):
    print(('  ok  ' if c else ' FALLO ') + m)
    if not c: fallos.append(m)
def foto(pg, n): pg.screenshot(path=os.path.join(raiz, 'docs', 'santuario_v2369_%s_390x844.png' % n))
CRUZA = "(id) => { const e = __juego.est, j = e.jugadores.oli, m = __juego.mundo.mapa(j.mapa), p = m.puertas.find((q) => q.id === id); j.x = p.x * 16 + 8; j.y = p.y * 16 + 8; j.enPuerta = null; __juego.motor.cruzar(e, j, m); return j.mapa; }"
RES = "() => { const e = __juego.est, em = e.mapas[e.jugadores.oli.mapa]; return em ? em.criaturas.filter((c) => c.res !== undefined).map((c) => [c.res, c.id, Math.round(c.x), Math.round(c.y), c.act, !!c.dur]) : []; }"
def avanza_dialogo(pg, veces=12):
    for _ in range(veces):
        if pg.locator('#santu:not([hidden])').count() or not pg.locator('#dlg:not([hidden])').count() or pg.locator('#dlg:not([hidden]) .dlg-op').count(): return
        pg.click('#dlg', position={'x': 195, 'y': 760}); pg.wait_for_timeout(350)
def sesion(p, clasico):
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); pg = ctx.new_page(); et = 'clasico' if clasico else '2d'
    pg.on('pageerror', lambda e: err.append(et + ': ' + str(e)))
    pg.goto('file://' + html + '?menu=1&nueva=1&sonido=0' + ('' if clasico else '&clasico=0')); pg.wait_for_timeout(400); pg.click('[data-pick=oli]'); pg.wait_for_timeout(1200)
    ok(pg.evaluate("() => G.clasico.ACTIVO") == clasico, '[%s] modo de pintado correcto' % et)
    ok(pg.evaluate("() => G.mundo.cargadas('santuario').length === 0 && !G.spr.sela_down_0 && !(__juego.est.dim && __juego.est.dim.santuario)"), '[%s] al arrancar no hay nada del Santuario cargado (ni mapas, ni sprites, ni estado)' % et)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; ['fosforin', 'cuarzin', 'somnin', 'pilita', 'nubecin', 'setin', 'aguacato'].forEach((f, i) => G.equipo.agregar(j, { forma: f, xp: 30 * (i + 1) })); __juego.motor.aplicar(e, { t: 'colocar', j: 'oli', mapa: 'nexus/plaza_cruce', ancla: 'inicio' }); j.x = 10 * 16 + 8; j.y = 3 * 16 + 14; }"); pg.wait_for_timeout(900)
    if clasico: foto(pg, 'nexus_portal')
    r = pg.evaluate(CRUZA, 'portal_santuario'); pg.wait_for_timeout(200); w = pg.evaluate("() => document.getElementById('who').textContent"); ok(r == 'nexus/plaza_cruce' and 'nivel de entrenador 8' in w, '[%s] sin nivel 8 el portal del Santuario no se abre (%s · %s)' % (et, r, w))
    pg.evaluate("() => { __juego.est.jugadores.oli.xpE = G.entrenador.xpPara(8); }"); r = pg.evaluate(CRUZA, 'portal_santuario'); pg.wait_for_timeout(2600)
    ok(r == 'santuario/umbral' and pg.evaluate("() => __juego.mapa.id") == 'santuario/umbral', '[%s] con nivel 8 se llega al Umbral' % et); foto(pg, 'umbral_' + et)
    # Guardiana
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; j.x = 9 * 16 + 8; j.y = 4 * 16 + 14; __juego.talk(); }"); pg.wait_for_timeout(500)
    ok(pg.locator('#dlg').count() == 1 and 'Guardiana Sela' in pg.inner_text('#dlg'), '[%s] la Guardiana Sela habla en la caja de diálogo' % et); avanza_dialogo(pg)
    ok(pg.locator('.dlg-op').count() >= 3, '[%s] su menú sale de datos (%d opciones)' % (et, pg.locator('.dlg-op').count()))
    if clasico: foto(pg, 'guardiana')
    pg.click('.dlg-x'); pg.wait_for_timeout(300)
    # hogar
    r = pg.evaluate(CRUZA, 'hogar'); pg.wait_for_timeout(1500); ok(r == 'santuario/hogar_1_p_oli', '[%s] la puerta del Umbral lleva a tu hogar (%s)' % (et, r)); foto(pg, 'hogar_vacio_' + et)
    pg.evaluate("() => { const m = __juego.mapa, n = m.npcs[0], j = __juego.est.jugadores.oli; j.x = n.x * 16 + 8; j.y = (n.y + 1) * 16 + 14; __juego.talk(); }"); pg.wait_for_timeout(500)
    ok(pg.locator('#dlg').count() == 1 and 'Cuidador Brezo' in pg.inner_text('#dlg'), '[%s] el Cuidador Brezo atiende junto a la cabaña' % et); avanza_dialogo(pg)
    pg.locator('.dlg-op', has_text='Residentes').click(); pg.wait_for_timeout(300)
    for _ in range(4):
        if pg.locator('#santu:not([hidden])').count(): break
        pg.click('#dlg', position={'x': 195, 'y': 760}); pg.wait_for_timeout(400)
    ok(pg.locator('#santu:not([hidden])').count() == 1 and 'Refugio · 0 de 6' in pg.inner_text('#santu'), '[%s] se abre el panel de residentes' % et)
    ok(pg.locator('#santu .sa-c').count() == 7, '[%s] el panel lista los 7 ejemplares de la caja' % et)
    for _ in range(6): pg.locator('#santu .sa-c button', has_text='Acoger').first.click(); pg.wait_for_timeout(120)
    ok('Refugio · 6 de 6' in pg.inner_text('#santu') and pg.locator('#santu .sa-c button:disabled').count() == 1, '[%s] seis acogidas con el botón; la séptima queda desactivada (lleno)' % et)
    if clasico: foto(pg, 'panel')
    pg.locator('#santu .sa-c button', has_text='A la caja').first.click(); pg.wait_for_timeout(150); ok('Refugio · 5 de 6' in pg.inner_text('#santu'), '[%s] «A la caja» la retira' % et)
    pg.locator('#santu .sa-c button', has_text='Acoger').first.click(); pg.wait_for_timeout(150); pg.click('#santu .x'); pg.wait_for_timeout(300)
    visible = pg.locator('#dlg:not([hidden])').count() == 1; avanza_dialogo(pg)
    ok(pg.locator('#santu:not([hidden])').count() == 0 and visible and pg.locator('#dlg:not([hidden]) .dlg-op').count() >= 2, '[%s] al cerrar el panel vuelve el diálogo' % et); pg.click('.dlg-x'); pg.wait_for_timeout(300)
    a = pg.evaluate(RES); ok(len(a) == 6 and pg.evaluate("() => __juego.est.jugadores.oli.sinId.length") == 7, '[%s] hay 6 residentes en el mapa y la caja sigue teniendo sus 7 ejemplares' % et)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; j.x = 17 * 16 + 8; j.y = 9 * 16 + 4; }"); pg.wait_for_timeout(6000); c = pg.evaluate(RES)
    ok(any(abs(x[2] - y[2]) + abs(x[3] - y[3]) > 3 for x, y in zip(a, c)), '[%s] las residentes se mueven solas' % et); foto(pg, 'hogar_dia_' + et)
    # B1: rótulo con mote, ampliar con Brillos y elegir hábitat desde el panel
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.sinId[0].mote = 'Chispa'; j.brillos = 600; const m = __juego.mapa, n = m.npcs[0]; j.x = n.x * 16 + 8; j.y = (n.y + 1) * 16 + 14; __juego.talk(); }"); pg.wait_for_timeout(1300); avanza_dialogo(pg)
    pg.locator('.dlg-op', has_text='Residentes').click(); pg.wait_for_timeout(300)
    for _ in range(4):
        if pg.locator('#santu:not([hidden])').count(): break
        pg.click('#dlg', position={'x': 195, 'y': 760}); pg.wait_for_timeout(400)
    ok('Ampliar a Patio' in pg.inner_text('#santu') and 'Ampliar · 450 ✦' in pg.inner_text('#santu'), '[%s] el panel ofrece ampliar a Patio por 450 ✦ y dice qué trae' % et)
    if clasico: foto(pg, 'panel_ampliar')
    pg.click('#santu .sa-a button'); pg.wait_for_timeout(300); ok('Patio · 6 de 12' in pg.inner_text('#santu') and '150 ✦' in pg.inner_text('#santu') and 'Parcela vacía' in pg.inner_text('#santu'), '[%s] ampliar cobra 450 ✦, sube a Patio y aparece una parcela vacía' % et)
    pg.locator('#santu h2 button', has_text='Elegir hábitat').click(); pg.wait_for_timeout(200); pg.locator('#santu .sa-h button', has_text='Charca').click(); pg.wait_for_timeout(300)
    ok('Charca' in pg.inner_text('#santu') and pg.evaluate("() => __juego.est.jugadores.oli.mapa") == 'santuario/hogar_2_pc_oli', '[%s] se elige Charca para la parcela nueva (gratis) y el hogar cambia' % et)
    pg.locator('#santu .sa-c button', has_text='A Charca').first.click(); pg.wait_for_timeout(200); pg.click('#santu .x'); pg.wait_for_timeout(300); pg.click('.dlg-x'); pg.wait_for_timeout(1500)
    ok(pg.evaluate("() => __juego.mapa.id") == 'santuario/hogar_2_pc_oli' and pg.evaluate("() => __juego.est.mapas[__juego.mapa.id].criaturas.filter((c) => c.res !== undefined && c.hab === 1).length") == 1 and pg.evaluate("() => __juego.est.mapas[__juego.mapa.id].criaturas.some((c) => c.nom === 'Chispa')"), '[%s] el Patio se dibuja, una residente vive ya en la Charca y la del mote lo lleva en el rótulo' % et)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli, p = G.santuario.trazar(j.mapa).habitats[0]; j.x = (p.x + p.w / 2) * 16; j.y = (p.y - 1) * 16 + 14; }"); pg.wait_for_timeout(1200); foto(pg, 'patio_' + et)
    # B2: instalación desde el panel, vivencias y entrenamiento
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.brillos = 1000; G.entrenador.dar(e, j, 150, 'combate'); const k = G.equipo.actual(j)[0]; j.prog = j.prog || {}; j.prog[k] = { xp: G.nivel.xpPara(15) }; const m = __juego.mapa, n = m.npcs[0]; j.x = n.x * 16 + 8; j.y = (n.y + 1) * 16 + 14; __juego.talk(); }"); pg.wait_for_timeout(1300); avanza_dialogo(pg)
    pg.locator('.dlg-op', has_text='Residentes').click(); pg.wait_for_timeout(300)
    for _ in range(4):
        if pg.locator('#santu:not([hidden])').count(): break
        pg.click('#dlg', position={'x': 195, 'y': 760}); pg.wait_for_timeout(400)
    txt = pg.inner_text('#santu'); ok('Vivencias:' in txt and 'Solar libre' in txt and 'Reposo' in txt and 'Remanso' in txt, '[%s] el panel muestra vivencias, solares y el don de cada hábitat' % et)
    ok('Campamento de expedición (nivel 3)' in txt and 'aporte de Tonavia' in txt and 'Te falta: un Santuario de nivel 3 y llegar al piso 10 de las Profundidades' in txt, '[%s] el panel muestra el aporte pendiente con su origen y lo que falta' % et)
    pg.locator('#santu .sa-h button', has_text='Campo de prácticas').first.click(); pg.wait_for_timeout(400)
    ok('Campo de prácticas' in pg.inner_text('#santu') and 'Derribar' in pg.inner_text('#santu') and pg.evaluate("() => __juego.est.jugadores.oli.mapa") == 'santuario/hogar_2_pc_i10_oli', '[%s] se construye el Campo de prácticas en un solar y el hogar cambia' % et)
    if clasico: foto(pg, 'panel_b2')
    pg.click('#santu .x'); pg.wait_for_timeout(300); pg.click('.dlg-x'); x0 = pg.evaluate("() => __juego.est.jugadores.oli.sinId.reduce((a, q) => a + (q.xp || 0), 0)"); pg.wait_for_timeout(6000)
    x1 = pg.evaluate("() => __juego.est.jugadores.oli.sinId.reduce((a, q) => a + (q.xp || 0), 0)"); ok(x1 > x0 and pg.evaluate("() => G.santuario.rec(__juego.est, 'oli', false).viv") < 150, '[%s] con vivencias y el jugador en casa, las residentes aprenden (%d → %d XP)' % (et, x0, x1))
    pg.evaluate("() => { const j = __juego.est.jugadores.oli, s = G.santuario.trazar(j.mapa).solares[0]; j.x = (s.x + s.w / 2) * 16; j.y = (s.y + s.h) * 16 + 10; }"); pg.wait_for_timeout(1200); foto(pg, 'campo_' + et)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli, p = G.santuario.trazar(j.mapa).habitats[0]; j.x = (p.x + p.w / 2) * 16; j.y = (p.y - 1) * 16 + 14; }"); pg.wait_for_timeout(600)
    # encuentros: en un rato alguna pareja se junta
    visto = False
    for _ in range(15):   # se adelanta el reloj ronda a ronda (18 s de juego) hasta que toque un encuentro: la prueba no depende de la suerte de la semilla
        pg.wait_for_timeout(700)
        if pg.evaluate("() => __juego.est.mapas[__juego.mapa.id].criaturas.some((c) => c.con !== undefined)"): visto = True; break
        pg.evaluate("() => { const e = __juego.est; e.reloj = (Math.floor(e.reloj / 18) + 1) * 18 + 3; }")
    ok(visto, '[%s] en pocas rondas dos residentes se juntan (saludo, juego o descanso)' % et)
    if visto: pg.wait_for_timeout(1500); foto(pg, 'encuentro_' + et)
    # hablar con una residente
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli, c = e.mapas[j.mapa].criaturas[0]; j.x = c.x + 8; j.y = c.y + 2; __juego.talk(); }"); pg.wait_for_timeout(300)
    ok('(Nv ' in pg.evaluate("() => document.getElementById('who').textContent"), '[%s] hablar con una residente dice su nombre, nivel y qué hace' % et)
    # noche: duermen (las diurnas)
    pg.evaluate("() => { const e = __juego.est, D = G.ciclo.AJUSTES.DIA_S; e.reloj = Math.ceil(e.reloj / D) * D + D * (1 / 24 * 1.5 - 0.4 + 1); }"); pg.wait_for_timeout(9000); n = pg.evaluate(RES); h = pg.evaluate("() => G.santuario.hora(__juego.est.reloj)")
    ok(sum(1 for x in n if x[5]) >= 4 and any(x[1] == 'somnin' and not x[5] for x in n), '[%s] de noche (%.1f h) duermen las diurnas y la de sombra sigue despierta' % (et, h)); foto(pg, 'hogar_noche_' + et)
    # guardar y recargar DENTRO del hogar
    pg.evaluate("() => { G.guardado.escribir(__juego.est); }"); pg.goto('file://' + html + '?menu=1&sonido=0' + ('' if clasico else '&clasico=0')); pg.wait_for_timeout(500)
    try: pg.click('[data-pick=oli]', timeout=1500)
    except Exception: pass
    pg.wait_for_timeout(1500); r = pg.evaluate("() => [__juego.est.jugadores.oli.mapa, __juego.mapa.id, !!G.spr.brz_down_0]"); c = pg.evaluate(RES)
    ok(r[0] == 'santuario/hogar_2_pc_i10_oli' and r[1] == r[0] and r[2] and len(c) == 6, '[%s] la partida guardada dentro del hogar se reanuda allí con sus 6 residentes (%s)' % (et, r))
    # B4: decoración y nombre desde el panel (tras recargar; el id del hogar gana el tramo _d)
    pg.evaluate("() => { const e = __juego.est, j = e.jugadores.oli; j.brillos = 5000; const m = __juego.mapa, n = m.npcs[0]; j.x = n.x * 16 + 8; j.y = (n.y + 1) * 16 + 14; __juego.talk(); }"); pg.wait_for_timeout(1300); avanza_dialogo(pg)
    pg.locator('.dlg-op', has_text='Residentes').click(); pg.wait_for_timeout(300)
    for _ in range(4):
        if pg.locator('#santu:not([hidden])').count(): break
        pg.click('#dlg', position={'x': 195, 'y': 760}); pg.wait_for_timeout(400)
    pg.locator('#santu h2', has_text='Decoración y nombre').locator('button').click(); pg.wait_for_timeout(300)
    pg.fill('#santu input', 'Nido de Oli'); pg.locator('#santu button', has_text='Guardar nombre').click(); pg.wait_for_timeout(300)
    ok('Nido de Oli' in pg.inner_text('#santu') and pg.evaluate("() => G.santuario.rec(__juego.est, 'oli', false).nom") == 'Nido de Oli', '[%s] el nombre del Santuario se guarda y se muestra' % et)
    pg.locator('#santu .sa-a', has_text='Plaza').first.locator('button', has_text='Colocar').click(); pg.wait_for_timeout(300)
    ok('Farola' in pg.inner_text('#santu') and 'Árbol' not in pg.inner_text('#santu').split('Decoración')[1].split('En tu caja')[0], '[%s] en un hueco de plaza solo se ofrecen piezas de plaza' % et)
    b0 = pg.evaluate("() => __juego.est.jugadores.oli.brillos"); pg.locator('#santu .sa-h button', has_text='Farola').first.click(); pg.wait_for_timeout(500)
    m1 = pg.evaluate("() => __juego.est.jugadores.oli.mapa"); b1 = pg.evaluate("() => __juego.est.jugadores.oli.brillos")
    ok('_d' in m1 and b1 < b0 and 'Farola' in pg.inner_text('#santu'), '[%s] colocar una farola cuesta Brillos, la pone y el hogar se rehace (%s)' % (et, m1))
    if clasico: foto(pg, 'panel_decoracion')
    pg.locator('#santu .sa-a', has_text='Avenida').first.locator('button', has_text='Colocar').click(); pg.wait_for_timeout(300); pg.locator('#santu .sa-h button', has_text='Maceta').first.click(); pg.wait_for_timeout(500)
    ok(pg.evaluate("() => G.santuario.rec(__juego.est, 'oli', false).dec.filter(Boolean).length") == 2 and pg.evaluate("() => __juego.mapa.id") == pg.evaluate("() => __juego.est.jugadores.oli.mapa"), '[%s] se colocan dos piezas y el mapa activo es el nuevo hogar' % et)
    pg.click('#santu .x'); pg.wait_for_timeout(300); pg.click('.dlg-x'); pg.wait_for_timeout(1000)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli, h = G.santuario.trazar(j.mapa).decor.find((q) => q.pieza); j.x = h.x * 16 + 8; j.y = (h.y + 2) * 16 + 8; }"); pg.wait_for_timeout(1200); foto(pg, 'decorado_' + et)
    ok(pg.evaluate("() => __juego.mapa.objetos.filter((o) => o.tipo === 'farola' || o.tipo === 'maceta').length") >= 2, '[%s] las piezas aparecen como objetos del mapa' % et)
    # B5: la cabaña por dentro (entrar, Lirio y el panel, muebles con uso, salir al hogar actual)
    hogar_antes = pg.evaluate("() => __juego.est.jugadores.oli.mapa")
    r = pg.evaluate(CRUZA, 'cabana'); pg.wait_for_timeout(1500)
    ok(r == 'santuario/cabana_oli' and pg.evaluate("() => __juego.mapa.id") == r and pg.evaluate("() => !!G.spr.lir_down_0"), '[%s] la puerta de la fachada lleva a la cabaña y Lirio tiene su sprite' % et)
    foto(pg, 'cabana_dentro_' + et)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; j.x = 5 * 16 + 8; j.y = 4 * 16 + 14; j.dir = 'up'; __juego.talk(); }"); pg.wait_for_timeout(1300); avanza_dialogo(pg)
    ok('Lirio' in pg.inner_text('#dlg') and 'Residentes' in pg.inner_text('#dlg') and 'cura' not in pg.inner_text('#dlg').lower(), '[%s] Lirio atiende junto al mostrador: Residentes y la cabaña, sin curar' % et)
    if clasico: foto(pg, 'cabana_lirio')
    pg.locator('.dlg-op', has_text='Residentes').click(); pg.wait_for_timeout(300)
    for _ in range(4):
        if pg.locator('#santu:not([hidden])').count(): break
        pg.click('#dlg', position={'x': 195, 'y': 760}); pg.wait_for_timeout(400)
    ok('Nido de Oli' in pg.inner_text('#santu') and 'Decoración y nombre' in pg.inner_text('#santu'), '[%s] desde la cabaña se abre el mismo panel y conserva el nombre del Santuario' % et)
    pg.click('#santu .x'); pg.wait_for_timeout(300); pg.click('.dlg-x'); pg.wait_for_timeout(500)
    ok(pg.evaluate("() => __juego.est.jugadores.oli.mapa") == 'santuario/cabana_oli', '[%s] abrir y cerrar el panel no saca de la cabaña' % et)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; j.x = 2 * 16 + 8; j.y = 3 * 16 + 14; j.dir = 'up'; __juego.talk(); }"); pg.wait_for_timeout(700)
    t = pg.inner_text('#santu') if pg.locator('#santu:not([hidden])').count() else ''
    ok('LIBRO DEL SANTUARIO' in t and 'Nido de Oli' in t and 'Instalaciones' in t and 'Vivencias' in t, '[%s] el libro del estante abre una lectura con el nombre y el estado del Santuario' % et)
    if clasico: foto(pg, 'cabana_libro')
    pg.click('#santu .x'); pg.wait_for_timeout(300)
    ok('SANTUARIO' == pg.inner_text('#santu h1') and pg.evaluate("() => __juego.est.jugadores.oli.mapa") == 'santuario/cabana_oli', '[%s] al cerrar la lectura se sigue en la cabaña' % et)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; j.x = 8 * 16 + 8; j.y = 3 * 16 + 14; j.dir = 'up'; __juego.talk(); }"); pg.wait_for_timeout(700)
    t = pg.inner_text('#santu') if pg.locator('#santu:not([hidden])').count() else ''
    ok('VITRINA DE APORTES' in t and 'Campamento de expedición' in t and 'Tonavia' in t, '[%s] la vitrina enseña los aportes de otras dimensiones y lo que falta' % et)
    if clasico: foto(pg, 'cabana_vitrina')
    pg.click('#santu .x'); pg.wait_for_timeout(300)
    pg.evaluate("() => { const j = __juego.est.jugadores.oli; j.x = 5 * 16 + 8; j.y = 6 * 16 + 14; }"); pg.wait_for_timeout(500)
    r = pg.evaluate(CRUZA, 'salida'); pg.wait_for_timeout(1500)
    ok(r == pg.evaluate("() => G.santuario.idHogar(__juego.est, 'oli')") and pg.evaluate("() => __juego.mapa.id") == r and pg.evaluate("() => G.santuario.esHogar(__juego.mapa.id)"), '[%s] se sale al hogar actual (%s)' % (et, r))
    pg.evaluate("() => { const j = __juego.est.jugadores.oli, p = G.santuario.trazar(j.mapa); j.x = p.cx * 16 + 8; j.y = 8 * 16 + 14; }"); pg.wait_for_timeout(1200); foto(pg, 'cabana_fachada_' + et)
    # HD-2D: el Santuario se queda en 2D
    hd = pg.evaluate("() => { const p = __juego.irAHD(); return [typeof p, __juego.hd]; }"); pg.wait_for_timeout(300); ok(hd[1] is False and pg.evaluate("() => __juego.hd") is False, '[%s] el botón HD-2D no cambia de pintor dentro del Santuario (se queda en 2D)' % et)
    # salir: hogar → Umbral → Nexus (pila de vuelta repuesta tras cargar dentro)
    r1 = pg.evaluate(CRUZA, 'salida'); pg.wait_for_timeout(600); r2 = pg.evaluate(CRUZA, 'portal_nexus'); pg.wait_for_timeout(600)
    ok(r1 == 'santuario/umbral' and r2 == 'nexus/plaza_cruce' and pg.evaluate("() => G.mundo.cargadas('santuario').length") == 0, '[%s] se sale hogar → Umbral → Nexus y el Santuario se descarga (%s, %s)' % (et, r1, r2))
    b.close()
with sync_playwright() as p:
    sesion(p, True); sesion(p, False)
ok(not err, 'sin errores de página %s' % err[:3])
print('OK' if not fallos else 'FALLA: %d' % len(fallos))
