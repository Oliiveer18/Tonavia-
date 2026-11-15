# SESION · Criaturas de Lali y Oli

> Archivado: v2.131-v2.179 en `docs/archivo/SESION_v2_131_a_v2_179.md`, v2.180-v2.208 (pesca, peces por fórmula, primer pez a mano, árboles 3D) en `docs/archivo/SESION_v2_180_a_v2_208.md` y lo anterior a la v2.131 en `docs/archivo/SESION_hasta_v2_130.md`. Aquí quedan v2.209 en adelante (fauna marina y últimos cambios de la pesca).

> Archivado también: v2.209-v2.296 (fauna marina a mano, combate en tiempo real y captura 2D) en `docs/archivo/SESION_v2_209_a_v2_296.md` y v2.297-v2.304 (Ignel 3D, tema «pixel cálido», sonido del combate, niveles núcleo, combate de noche) en `docs/archivo/SESION_v2_297_a_v2_304.md`.

## v2.325 · Entrenadores: diálogo, pausa, duelo con el jugador y dos móviles (12 nov 2026)
- Nuevos: `src/agentes_trato.js`, `src/agentes_red.js`. Tocados: `agentes.js`, `agentes_cuerpo.js`, `agentes_acciones.js`, `combate_motor.js` (gancho `finDuelo`, `mia`, `sitio`), `dialogo_ui.js` (`api.cerrado`), `game.js`, `red_peer.js`, `datos/agentes.json`, `orden.json`, `test.js`, `tools/prueba_agentes.py`.
- Arreglos de cuerpo: puntos de pesca y plaza repartidos, el que reta camina hasta su rival, nadie queda pintado en la puerta estando dentro, sin salto al acabar un duelo.
- Pruebas: test.js 111 grupos (solo falla «texturas», de antes); `prueba_agentes.py` en Chromium 390×844 con diálogo y duelo completos; combate 2D, captura 2D, tienda y laboratorio siguen bien.
- Huellas del 2D regeneradas A PROPÓSITO (los entrenadores se colocan en otros sitios). Huella de agentes 30 min: 711b0647.

## v2.305 · Música de tensión del combate
- `src/musica_combate.js` (nuevo, `G.musicaC`): música adaptativa sintetizada (sin archivos) para el combate. Bucle de 8 compases a 148 bpm (Dm Dm Eb Dm | Dm Bb A A), bajo en corcheas con cromatismo, bombo, caja, charles, taiko, pad, arpegio, melodía principal, golpes de cuerda y riser. 4 niveles que suman capas y abren el filtro; el nivel solo sube durante el combate y cambia en la barra del compás. Sube a los 6 s y cuando alguna criatura baja del 60 % / 30 % de vida.
- Al empezar: golpe de impacto y la música de la zona se funde a silencio (`G.audio.zona(0)`, nuevo en `audio.js` con el bus `E.mz`); al acabar se corta rápido (suena la fanfarria/derrota de `sonido_combate.js`) y la de la zona vuelve a los 1,8 s. Motor puro (sin azar ni DOM); si el audio falla, el combate sigue.
- Enganche: `game.js` calcula la vista del combate una vez y la pasa a `G.sonidoC.seguir` y `G.musicaC.seguir`. Ajustes en `G.musicaC.AJ`.
- Pruebas: `test.js` 100 grupos ok; `huella_juego.js --comprobar` igual (el 2D no cambia); `tools/demo_musica_combate.py` renderiza los 4 niveles fuera de línea (sin NaN, RMS creciente por nivel). Sin probar en un móvil real.

## v2.306 · Personajes de los jugadores sin oscurecer en combate (2D)
- En combate el mundo se atenúa; las criaturas ya se pintaban después de ese velo, pero Oli/Lali no. Ahora `game.js` pinta también a los jugadores después del velo, y de noche (`focosNoche`) el jugador lleva una meseta de luz completa. Las criaturas quedan exactamente como en la v2.304. Comprobado con capturas de día y noche, `test.js` (100) y la huella del 2D; HD-2D sin verificar.

## v2.307 · El especial del jugador es manual
- `combate_motor.js`: la criatura del jugador se crea con `auto: false`; su especial solo sale con la orden del botón ⚡ y el medidor lleno. Antes (`auto` por defecto) salía sola al llenarse. El rival conserva `auto: true` y lanza el suyo solo (mismo hueco «e», medidor propio). Prueba nueva en `test.js` (101 grupos). La pulsación de ⚡ se recuerda (`est.combate.esp = { id, hasta }`, 1,5 s): si la criatura está ocupada, el especial sale al acabar su acción; caduca si ya no se puede lanzar. Pruebas nuevas en `test.js`.

## v2.308 · Sonido y efecto al pulsar ⚡
- El especial se lanza al TOCAR el botón (`pointerdown`), no al soltar; el `click` posterior se ignora. `G.sonidoC.pulsa()` (sonido_combate.js): golpe grave + «zing» ascendente + arpegio de do mayor + destello de ruido + resplandor final (≈0,8 s); solo suena si la pulsación se acepta (medidor lleno). Efecto en el botón (`index.html`): hundimiento y rebote con brillo dorado y un anillo que se expande (0,4 s; sin animación con movimiento reducido). `test.js` 102 grupos; comprobado en Chromium móvil (clase `pulsa`, orden aceptada, sin errores).

## v2.309 · Vida permanente
- La vida con la que acaba un combate se conserva en `j.vida[forma]` (absoluta; sin entrada = completa; 0 = debilitada), también si se corta el combate. El siguiente combate empieza con esa vida (`hp` opcional en la especificación de `crearUnidad`). Se guarda (`guardado.js`, `vidaOk` descarta datos corruptos).
- Una criatura a 0 no puede combatir (aviso «está debilitada: llévala al Centro PC») y el acompañante caído no vuelve.
- `G.motor.combate.curar(est, jid, forma?)`: devuelve la vida completa (todas o una sola, pensado para pociones) y trae de vuelta al acompañante. Entrar en el mapa `centro_pc` (`motor.cruzar`) cura a todas.
- Pendiente: pociones (no existe inventario ni UI de objetos), mostrar la vida fuera de combate. Las salvajes no conservan daño (la vencida desaparece para siempre; si se corta el combate, vuelve entera). `test.js` 103 grupos; comprobado en Chromium con la puerta real.


## v2.310 — Muro delante y pestaña Equipo
- Muro de Cuarel: el efecto apuntaba a sí mismo (`obj`), así que se dibujaba detrás; ahora apunta al rival (`combate_2d.js`, `hd2d_pintor.js`).
- Nuevo botón «Equipo» en el HUD (`src/equipo_ui.js`): pestañas Equipo (6 huecos) y Criaturas (por especie: nivel, XP, vida, rareza, elemento, cantidad) con ficha de detalle y movimientos. Sin selección de equipo aún (equipo = acompañante).
- Pruebas: 104 grupos; huella 2D sin cambios.

## v2.311 — Barra de vida: trozo blanco atascado
- Con daño seguido (quemadura, golpes rápidos) cada bajada reiniciaba la espera de 0,4 s y el trozo blanco no se vaciaba, creciendo hasta ~41 % de la barra. Ahora la espera solo se abre si no hay una en curso y el trozo está vacío, y el trozo se acota a 0,18. Medido: máx 0,064 y 2/20 muestras en blanco (antes 0,41 y 19/20).
- Gancho de depuración `G.combate2d._bar`.

## v2.312 — Enfermera Alba (primer NPC) y equipo editable
- NPC nuevo en el Centro PC: **Enfermera Alba** (`src/npc.js`, sprite propio 16×21, `maps/centro_pc.json` → `npcs` tipo `npc`, con `dy` visual para verse tras el mostrador). Ocupa su casilla (6,3) (bloqueada); se habla con ella desde unas 2,6 casillas (botón/tecla de hablar; burbuja «…» y nombre sobre ella).
- Diálogo (`src/dialogo_ui.js`): caja inferior con retrato, texto que se escribe (se acelera al tocar), opciones: Curar a mis criaturas · Gestionar mi equipo · Despedirme. Solo pinta: pide al motor las órdenes `curar` y `equipo` (nuevas en `motor.aplicar`, exigen estar junto a ella).
- **Entrar al Centro PC ya no cura solo**: cura la enfermera al hablar con ella (`curar` con sonido y brillo en el retrato).
- Equipo (`src/equipo.js`, puro): `j.equipo` = hasta 6 especies que posee (capturadas + inicial); la primera sana va al frente y es el acompañante (`sincronizar`). Si cae en combate, el **relevo** pasa a la siguiente sana. Guardado en `guardado.js` (validado).
- Panel Equipo en modo edición cuando se abre desde la enfermera: ficha con Añadir al equipo / Quitar / Poner al frente, «Al frente» y «En equipo» marcados, aviso al cambiar. Abierto desde el HUD sigue siendo solo lectura.
- Huellas del dibujo regeneradas (el sprite nuevo desplaza los números de serie de los lienzos). Pruebas: 106 grupos. Solo 2D; HD-2D no dibuja aún al NPC.

## v2.313 — Salir de un interior sin haber entrado por su puerta
- Con la pila `j.volver` vacía (partida cargada estando dentro) las puertas «volver» no hacían nada y el jugador quedaba atrapado. Ahora se sale por la puerta exterior de ese edificio (`mundo.puertaDe`). Pruebas: 107 grupos.

## v2.314 — Rótulo de la Tienda y escalones de la Ermita en el 2D
- En **HD-2D** el rótulo «TIENDA»/«CENTRO PC» y los dos peldaños de la Ermita **ya existían en 3D** (`vol.rotulo`, `vol.adornos`; capturas de referencia en `docs/archivo/capturas/`). En el 2D no estaban y el usuario los echaba de menos (el artefacto se ve en 2D).
- 2D: «CENTRO PC» sustituye al letrero provisional del dibujo (`rotulo()` en `albanota_objetos.js`); el rótulo «TIENDA» y los dos escalones de la Ermita van **aparte, solo en 2D** (`G.decor2d`, pintado en `game.js` tras los objetos), porque el HD-2D recorta su fachada del dibujo 2D y los duplicaría. Se pintan también en el 2D clásico (es el modo por defecto).
- Pruebas: 108 grupos; huella 2D sin cambios. HD-2D sin verificar en navegador (Three.js no carga en este entorno).

## v2.315-v2.319 · Economía completa: Brillos, mochila, objetos, tendero Teo, Bolsa y Tienda · 10 nov 2026
(v2.315 núcleo puro · v2.316 recompensas · v2.317 tendero · v2.318 Bolsa/Tienda · v2.319 equilibrio y revisión; entregados en un solo ZIP por indicación del usuario. Sección final «v2.316-v2.319» más abajo.)

### v2.315 · núcleo puro (MEDIUM)
Paso 1 de 5 de la economía (propuesta aceptada por el usuario). Moneda: **Brillos (✦)**, blanda, solo se gana jugando.
- `src/tienda.js` (puro, tras `combate_motor.js` en `orden.json`): `j.brillos` (100 al empezar), `j.mochila` `{id: n}` (máx. 99), catálogo `OBJ` (Poción 40 ✦/150 PS, Superpoción 110/400, Revivir 180/mitad de vida, Esfera 30), `comprar`/`vender`/`usar`, `precioPez` (valor por zona, rareza y kg medio), `precioCurar` (herida 8, debilitada 20). Órdenes `comprar`/`vender` (solo con `j.mapa === 'tienda'`; desde la v2.317 también junto al vendedor) y `usar` (solo andando: **nunca en combate propio**).
- Esferas: siguen en `j.esferas`; la compra las suma (tope 99). Venta: objetos a la mitad; pescados a su valor; esferas no se venden.
- `guardado.js`: `brillos` y `mochila` validados (sin negativos ni ids inventados); guardados viejos siguen valiendo.
- `test.js`: +1 grupo (v2.315); tope de peso de `dist/criaturas.html` subido a 1.800.000 caracteres (autorizado). Huella 2D sin cambios. El fallo «texturas: prueba de Chromium» ya existía en el ZIP original.
- Decisiones del usuario: curar en el Centro PC **cuesta Brillos** (el jugador no se traba: pesca y vende); esferas cuestan Brillos; pociones solo fuera de combate; diálogo del vendedor al nivel del Centro PC.
- Siguiente: v2.316 (LOW) ganar Brillos por combate/pesca/hitos + HUD ✦ + cobrar la cura de Alba + meter los pescados en la mochila; v2.317 (MEDIUM) NPC de la Tienda; v2.318 (MEDIUM) panel de mochila y usar pociones andando + esferas; v2.319 (LOW) equilibrio y revisión espacial.

### v2.316-v2.319 · lo hecho tras el núcleo
- **v2.316 (LOW) recompensas:** `G.tienda.premioCombate(np, ne, rar)` (6+2·nivel rival, ×1/1,6/2,6/4 por rareza, −8 % por nivel de ventaja, mín. 20 %) se cobra al ganar (`combate_motor.terminar`); +25 ✦ por especie capturada nueva; el pescado va a `j.mochila` y la primera captura de cada pez da 10 ✦ + su valor; sin esferas tras ganar a una salvaje avisa «cómpralas en la Tienda». **Alba cobra** la cura (8 ✦ por herida, 20 ✦ por debilitada); sin saldo no cura y el diálogo lo explica (pesca y vende). HUD: botón «✦ N» (`#bbtn`, abre la Bolsa; estilo del tema en `index.html` y `tools/tema_ui.css`).
- **v2.317 (MEDIUM) tendero Teo:** sprite propio `tnd_*` (16×21, una vista para todas las direcciones, igual que Alba), `maps/tienda.json` → `npcs` (casilla (7,2) tras el mostrador, frontal (7,4), `dy` −12), guion `G.npc.GUION.tendero` (saludo, comprar, vender, 6 consejos útiles que rotan sin azar). `comprar`/`vender` exigen estar junto a Teo. Diálogo `dialogo_ui.js`: menú Comprar / Vender / Charlar / Despedirme; Alba muestra el precio de curar.
- **v2.318 (MEDIUM) Bolsa y Tienda:** `src/bolsa_ui.js` + `#bolsa` (CSS en `index.html`): modo Tienda (pestañas Comprar con ×1/×5 y Vender 1/Todo) y modo Bolsa (objetos, esferas, pescados; «Usar» una Poción/Revivir sobre una criatura con barra de vida). Solo pinta: pide órdenes `comprar`/`vender`/`usar` (`apiBolsa` en `game.js`). Pociones **solo andando** (el motor las rechaza en combate propio).
- **v2.319 (LOW) equilibrio y revisión:** curar con Alba (20 ✦ la peor herida) es más barato que una Poción (40 ✦); vender paga la mitad que comprar; Poción 150 PS ≈ 30 % de Ondel nivel 1 (489 PS). **Revisión espacial de la Tienda hecha** (captura móvil 390×844, `docs/tienda_v2319_*.png`): Teo tras el mostrador sin tapar estantes ni la puerta, casilla frontal (7,4) libre y todo transitable con el NPC sólido (test v2.148 actualizado). Prueba nueva `tools/prueba_tienda.py` (HUD, diálogo, comprar, vender, Esc, usar poción, Alba sin saldo, sin errores).
- **Verificación:** `node build.js` · `node test.js` (+2 grupos, solo falla «texturas: prueba de Chromium», anterior a esta sesión) · `huella_juego --comprobar` (el sprite nuevo desplaza los números de serie de los lienzos: huellas regeneradas con `--escribir` y `--clasico --escribir`; llamadas y estado idénticos) · `prueba_tienda.py`, `prueba_combate_2d.py`, `prueba_interior.py` en Chromium móvil. HD-2D sin verificar (Three.js no carga aquí): Teo y los ✦ del HUD/paneles son DOM/sprites del 2D; **pendiente** comprobar en HD-2D que Teo se ve tras el mostrador.
- **Pendiente / ideas:** ajustar precios con partidas reales; premios por hitos de colección de peces; cosméticos; Teo en HD-2D (modelo 3D) y música/sonido de caja registradora.

### v2.319.1-v2.319.3 · cifras legibles y con el grosor de las letras (arreglo pedido por el usuario)
- Problema 1: las cifras de Pixelify (5, 6, 8, 3…) se confundían a tamaño pequeño. Una primera solución (cifras del sistema) se leía pero desentonaba.
- Solución: **fuente propia solo de cifras «PixelifyNum»** (`tools/cifras_pixelify.py`): misma rejilla 5×7, esquinas recortadas y métrica que Pixelify, con formas inconfundibles (5 con barra recta arriba, 6 y 9 abiertos, 8 con cintura, 1 de 3 columnas). `unicode-range: U+0030-0039`, primera en la pila (`* { font-family: PixelifyNum, Pixelify, … }`).
- Problema 2 (v2.319.3): unas cifras se veían más gordas y otras más finas. **Causa:** Pixelify es una fuente variable (eje wght 400-700) cuyo trazo crece con el peso (palos 101 → 127, barras 99 → 135 unidades); las letras en negrita usaban 700 pero mis cifras tenían un único peso fino (92). **Arreglo:** dos pesos, `tools/pixelify_num_400.woff2` y `pixelify_num_700.woff2` (~570 bytes cada una), generados con el trazo medido en Pixelify en cada peso (palos repartidos con separación (W−T)/(columnas−1)); dos `@font-face` (400 y 700). Los pesos intermedios usan el más cercano. `tools/tema_ui.py` las incrusta (comprobado: regenera `index.html` idéntico).
- El texto de canvas (daños, nombres) usa `font.js` (5×7) y no cambia.
- Verificado: build, test.js (solo el fallo antiguo de texturas), prueba_tienda.py y capturas de muestra en peso 400 y 700 a 13-30 px.

## Decisiones de Fable · ficha de cría (v2.320, sintetizador de sprites)
- La ficha (`datos/crias/<fam>.json`) NO redibuja la criatura: `roles` asigna un papel a cada color exacto del dibujo a mano de la fase 1 y los genes solo recolorean papeles (`colores`), añaden marcas (`patron` en baldosa sobre papeles de `sobre`, anclada a la caja del `cuerpo`) y adornos (`capas` por vista down/up/side con `pos` arriba|abajo|detras). Así se conserva el trazo original y sus 4 direcciones y pasos.
- Requisitos de una línea: fase 1 con dibujo nativo (`def2`/`set`), ≥ 2 genes, primer alelo = aspecto original, al menos un alelo `mut:true`. Lo comprueba `G.crianza.validarFicha`; colores disponibles: `G.crianza.coloresDe(fam)`.
- El contorno de tinta (#2a1b30) lo pone el sintetizador al final; los adornos no llevan contorno propio. Vista `side` se dibuja mirando a la izquierda y se refleja sola.
- Solo `pompon` (Ondel) tiene `lista:true`: se apaga cambiando esa línea a `false`. Hoja: `node tools/hoja_crias.js <fam> [semilla]` → `docs/hoja_crias_<fam>.png` (las 3 últimas filas fuerzan mutaciones).


## v2.320 · Profundidades (cuevas generadas) · 11 nov 2026
- **Hecho (Fable 5.2):** `src/profundidades.js` (generador puro por semilla, resolutor de puzles, estado `est.prof`/`j.prof` versionado y guardado, órdenes `prof`), `src/cueva2d.js` (pintor 2D: auto-baldosas, linterna, antorchas, niebla), `src/profundidades_ui.js`, `datos/profundidades.json` (20 salas, 12 puzles, 5 biomas con mecánica propia y música, 6 pisos especiales, 8 modificadores, cofres por rareza). Entrada en Albanota (casilla 9,3). Herramientas de una línea: `validar_salas`, `validar_puzles`, `probar_semillas`, `hoja_pisos` (hoja de 50 pisos en `docs/hoja_pisos.png`).
- **Medido:** 300 pisos → variedad 94 %, recorrido medio 66 casillas, ~161 s por piso, 0 pisos de emergencia, generación 3 ms/piso. 12 puzles × 4 espejos con solución y exigen a los dos.
- **Cierre (Sonnet, 11 nov):** `docs/GUIA_PROFUNDIDADES.md` escrita; huellas del 2D regeneradas (`--escribir` y `--clasico --escribir`) porque el nuevo código y la Doctora Nora desplazan los números de serie de los lienzos y se añade `est.prof` al estado; `MAPA_ARQUITECTURA.md` regenerado; tope de peso de `dist/criaturas.html` en 2.100.000 (1,90 MB actuales). `test.js`: solo falla «texturas: prueba de Chromium» (anterior).
- **Crianza (v2.320, EN PAUSA por decisión del usuario, 11 nov):** `src/crianza.js` + `datos/crianza.json` + `datos/crias/pompon.json` + `tools/hoja_crias.js` existen, pero el resultado visual (recolorear el cuerpo de Ondel) no convenció: no parecen crías. No se continúa: sin interfaz ni Nora cableada. Si se retoma, la propuesta es: cría con el sprite real de la especie, herencia de estadísticas/habilidad y mutación como variante de color. Los cofres épicos cambian «huevo» por Brillos mientras no haya líneas listas.
- **Pendiente HD-2D:** las cuevas solo se pintan en 2D (nada de `hd2d_*`); anotado como pendiente.

## Qué puede hacer Sonnet a partir de aquí
1. Más salas de puzle (guía §Añadir una SALA) → `node tools/validar_salas.js && node tools/validar_puzles.js && node tools/probar_semillas.js 2000`.
2. Más entradas de cueva en otros mapas (puerta `@prof` + bioma) → `node test.js`.
3. Equilibrar Brillos/cofres/niveles (`datos/profundidades.json`) → `node tools/probar_semillas.js 2000`.
4. Más modificadores o eventos → `node tools/validar_salas.js`.
5. Bioma nuevo (lava) con paleta y música → `node tools/hoja_pisos.js <bioma>` y revisar la hoja.
6. Probar en el iPhone: linterna, música y rendimiento de las cuevas.


## v2.321 · Motor de terrenos 2D (Carbuna) · 11 nov 2026
- **Hecho (Fable 5.2):** `src/terreno.js` (auto-baldosas por píxel con bordes naturales; ceniza, roca, lava animada, camino, hierba, puente; brasas ≤ 24; luz cálida; tema = `m.region`), enganchado en `clasico2d.js` y `game.js`. Compositor `tools/componer_mapa.js` (sin `Math.random`) con la receta `plantillas/receta_pueblo_carbuna.json` → `maps/pueblo_carbuna.json` (48×36, 994 casillas libres 100 % alcanzables, caminos ≥ 2, 38 piezas en su terreno, determinista). Captura: `docs/carbuna_v321_390x844.png`. Medido ≈ 60 fps en Chromium de escritorio; sin probar en móvil real.
- **Cierre (Sonnet):** `docs/GUIA_TERRENOS.md`; esta nota. Huellas 2D y clásica sin cambios.
- **Pendiente:** pueblo_carbuna sin edificios (7 solares con ancla), sin puertas ni bordes conectados (solo se entra con `?mapa=pueblo_carbuna`); el puente se distingue poco del camino; lava, brasas y piezas no están en HD-2D; falta `docs/volumenes_tex_casa.png` (único fallo de `test.js`, anterior a este paso).

## v2.322 · Puerta PROVISIONAL Albanota ↔ Carbuna · 11 nov 2026
- Albanota: 3 puertas invisibles en el borde este (45,17-19) → `pueblo_carbuna` (ancla `inicio`, 3,17) y ancla nueva `carbuna` (44,18). Carbuna: 2 puertas en su borde oeste (0,17-18) → Albanota (ancla `carbuna`). Es temporal: se sustituirá por `ruta_carbuna_1` según `datos/mundo.json` (marcado ahí como provisional).
- `test.js` ahora espera 10 puertas en Albanota (las 3 nuevas, con id `carbuna_prov_*`). Prueba nueva en Chromium: `python3 tools/prueba_puerta_carbuna.py` (ir y volver andando; captura `docs/puerta_carbuna_v322_390x844.png`). Huella 2D sin cambios; `test.js` solo falla el de texturas (anterior).
- Pendiente: las puertas no tienen aspecto (son invisibles); un cartel o arco quedaría mejor.

## v2.323 · Señal de la puerta a Carbuna · 11 nov 2026
- Albanota: letrero «CARBUNA» con flecha naranja al este (`cartel_carbuna`, 45,16) y brasero encendido (`brasero_carbuna`, 45,20) que flanquean la puerta; el camino llega ahora hasta ella (casillas 45,17-19 pasan a `=`). Ambos registrados en `albanota_objetos.js` y en la paleta del editor. Captura: `docs/cartel_carbuna_v323_390x844.png`.
- `test.js` actualizado (29→31 piezas nuevas, 84→86 objetos, 74→76 normales en HD-B1) y `hd2d/albanota_hd2d.html` regenerado (`node tools/hd2d_albanota.js`). Huella 2D sin cambios. Solo falla el de texturas (anterior).
- Pendiente: sin marca en el minimapa (probé `lugar` y rompía 3 tests de minimapa; se puede añadir adaptándolos); el HD-2D dibuja el letrero como lámina plana (sin modelo 3D).

## v2.324 · Entrenadores NPC autónomos (motor de agentes, solo 2D)
- **Nuevo:** `src/agentes.js`, `agentes_mente.js`, `agentes_acciones.js`, `agentes_cuerpo.js`, `datos/agentes.json`, `docs/AGENTES.md`, `tools/agentes_diag.js`, `tools/prueba_agentes.py`. Arquitectura y decisiones en `docs/AGENTES.md`.
- **Tocado (mínimo):** `src/orden.json` (4 archivos antes de `guardado.js`), `guardado.js` (bloque `agentes`), `vista.js` (`G.vista.agentes`), `game.js` (pinta cuerpos y nombres con recorte por pantalla; `ponerAlDia` al cargar), `chars.js` (`G.defChar`, mismo resultado), `combate_motor.js` (exporta `capBase`), `test.js` (grupo 110).
- **Comprobado:** con `"activo": false` las dos huellas y `test.js` quedan EXACTAMENTE como en la v2.323 (no rompe nada). Con el sistema encendido: `test.js` 110 grupos (solo falla «texturas», anterior); el estado de jugadores y criaturas de la huella no cambia (`estado 190e210b78a572a8`); `agentes_diag.js` OK (determinismo, guardar a medias, invariantes); `prueba_agentes.py` OK en Chromium 390×844 (captura `docs/agentes_v2324_hablar_390x844.png`); `prueba_tienda`, `prueba_puerta_carbuna`, `prueba_profundidades` y `prueba_casa_oli` OK.
- **Huellas regeneradas a propósito** (ahora se pintan entrenadores en Albanota): 2D `64beaa50ab9bb1920e41f695`, clásico `3f5b367f363a90f5aea9fba5`.
- **Rendimiento:** 0,011 / 0,025 / 0,11 / 0,50 ms por cuadro con 25 / 100 / 400 / 1600 entrenadores (node); 0,013 ms con 24 en Chromium. `dist` 1.998.339 bytes (tope 2.100.000).
- **Observado, sin tocar:** `est.reloj` no avanza en el bucle real (`game.js` no llama a `motor.avanzar`), así que el ciclo de día y noche está parado en el juego; la semilla del mundo cambia en cada sesión (`motor.crear(Date.now())`), por eso la población guarda la suya.
- **Sin probar:** iPhone real. **Pendiente:** `docs/AGENTES.md` §7.

## v2.326 · Arreglos de entrenadores tras la prueba en iPhone (solo 2D)
- **Pedido del usuario:** (1) en duelos NPC gana quien derrota a la criatura rival, sin tiempo; (2) los NPC cruzaban el mapa hacia el sur, algo que el jugador no puede; (3) un NPC desapareció de golpe tras perder.
- **Hecho:** `combate.js` (`cfg.duelo`: sin victoria por tiempo, tope 30 min → tablas); `agentes_cuerpo.js` (`salidasHacia`: salida por puerta real o por puerta de edificio, `pose` con entrada/salida animada y `al` de transparencia, `rea` en `cuerpos`); `agentes_acciones.js` (`ir` entra por la puerta, reacción tras duelo entre entrenadores); `agentes_trato.js` (`esperar`: se queda quieto `reaccion` s tras el duelo con el jugador); `agentes_mente.js` (`a.sal`); `game.js` (fundido y marca «!»/«…»); `datos/agentes.json` (`trato.reaccion`: 4).
- **Causas halladas:** (2) iban a vecinos aún sin dibujar y caminaban hasta el borde sur/oeste/norte de Albanota; (3) al acabar el duelo seguían de inmediato con su plan (curarse = entrar en el Centro PC y dejar de dibujarse).
- **Nuevo:** `tools/agentes_ruta_diag.js` (casillas pisables por el jugador, bordes cerrados, saltos, quietud en la reacción); falla con el código de la v2.325 y pasa con el nuevo.
- **Comprobado:** `test.js` 112 grupos (solo falla «texturas», anterior); `agentes_diag.js` OK; `prueba_agentes.py` 4 veces seguidas OK; `prueba_tienda`, `prueba_puerta_carbuna`, `prueba_profundidades`, `prueba_casa_oli` OK. El fallo intermitente de la v2.325 era de la prueba: el ganador del duelo y cuántos entrenadores hay a la vista dependen de la semilla de cada sesión.
- **Huellas 2D regeneradas a propósito** (los entrenadores salen y se colocan distinto): 2D `6b2554c30948b6328b169d0b`, clásico `fade829166727650b3be27b3`. `dist` 2.024.181 bytes (tope 2.100.000).
- **Sin probar:** iPhone real y dos móviles.
- **Añadido (v2.326, mismo ZIP): los entrenadores iban «a la velocidad de la luz» al abrir la partida.** Causa: el tiempo con el juego cerrado (hasta 1800 s) se pagaba a 8 ticks por cuadro durante ~75 s y los cuerpos, que son función del tiempo, corrían ~30 veces más deprisa (25 px por cuadro en vez de 0,77). Ahora `ponerAlDia` lo paga de golpe al cargar (≈0,7 s, antes de pintar). `test.js` actualizado (grupo del tiempo atrasado). Además no se puede hablar con quien se está fundiendo en una puerta.
- **Pruebas de navegador:** `prueba_agentes.py` ya no depende de la semilla (escoge un entrenador quieto, sano y fuera de duelo; mira varias ventanas al comprobar que caminan). Queda una rareza (1 de ~25 pasadas) en la que el diálogo de «Retar» no abre el combate; la prueba ahora imprime el motivo si vuelve a pasar.
- **Presencia en interiores (v2.326, mismo ZIP):** `agentes_cuerpo.js` (`poseDentro`, `infoDentro`, `cuerposDentro`: posición dentro = f(paso, tiempo), igual que fuera), `agentes_trato.js` (`parar` y `vigilar` aceptan el mapa interior: `par[i].m`), `test.js` (grupo 113; el de «hablar» y el de cuerpos ya no exigen que el Centro PC esté vacío), `tools/agentes_ruta_diag.js` (también mide dentro). Captura: `docs/agentes_v2326_interior_390x844.png`. Dentro se les ve entrar (fundido), esperar y salir; no se pintan a la vez fuera.
- **Comprobado:** `test.js` 113 grupos (solo falla «texturas», anterior); `agentes_ruta_diag` OK (11.362 muestras dentro, sin casillas sólidas ni saltos); `prueba_agentes.py` 3 pasadas OK.
- **Sin duelos dentro de edificios (v2.326, mismo ZIP):** `agentes_trato.puedeRetar` rechaza el reto si el jugador no está en el mapa del entrenador (`reto_dentro`, 8 frases de distinto tono en `datos/agentes.json`, rotan con el tiempo); el menú muestra «Ahora no puede». Los duelos entre entrenadores ya excluían a quien está dentro. Test del grupo de interiores ampliado.

## v2.327 · Reloj del día y horario de la tienda (paso 1 del plan «noche», solo 2D)
- **Pedido:** encender el reloj (día = 10 min reales), guardarlo, mostrar la hora; la tienda cierra de noche, el Centro PC no.
- **Hecho:** `ciclo.js` (`HORARIO`, `hora`, `abierta`), `game.js` (`est.reloj += dt`, chip de hora, cartel «CERRADO» en la puerta), `guardado.js` (`reloj`), `agentes_red.js` (el anfitrión manda `r`), `motor.js` (puerta de la tienda cerrada con aviso), `npc.js` (Teo desaparece cerrado; `lista(m, reloj)`), `agentes_mente.js`/`agentes_acciones.js` (comprar y vender solo con la tienda abierta, al planear y al ejecutar).
- **Decisiones:** el reloj NO avanza con el juego cerrado (el tiempo atrasado de los entrenadores no mueve la hora); sin ciclo (`?ciclo=0`) todo está abierto; `A.avanzar` suelto no mueve `est.reloj` (solo el bucle del juego y `motor.avanzar`).
- **Comprobado:** `test.js` 114 grupos (solo falla «texturas», anterior); `prueba_reloj.py` OK (hora, guardado, tienda cerrada de noche y abierta de día, Centro PC abierto de madrugada, sin errores); `prueba_agentes`, `prueba_tienda`, `prueba_puerta_carbuna`, `prueba_profundidades` y `prueba_casa_oli` OK.
- **Huellas 2D regeneradas a propósito** (el dibujo depende de la hora): 2D `2b598b1cc07e0df38c35d7a3`, clásico `115a7edb875620ef6329cd60`. `dist` 2.032.731 bytes (tope 2.100.000).
- **Pendiente:** paso 2 (iluminación AAA). Hasta entonces la noche usa el velo de color de siempre.

## v2.328 · Iluminación 2D día/noche (paso 2 del plan «noche», solo 2D)
- **Hecho:** `src/luces2d.js` (nuevo): mapa de luz del tamaño de la vista (ambiente del ciclo + focos escalonados) multiplicado sobre el juego, más brillo propio en ventanas y cabezas de farola, viñeta nocturna y farolillo del viajero. Luces como DATOS (`EDIF`: ventanas/puerta por edificio con horas de encendido; `PUNTOS`: farola, brasero, cartel; lava de Carbuna por casillas). Tienda apaga ventanas al cerrar; casas y ermita las apagan de madrugada; Centro PC siempre. Interiores siempre iluminados (velo blanco); cuevas y HD-2D sin cambios; en combate el ambiente se aclara 45 %.
- **Interruptores:** `?luces=0` (velo antiguo), `?noche=suave` (noche menos cerrada). `game.js`: `aplicaCiclo` deja el velo blanco si luces2d está activo; `draw()` llama a `luces2d.pintar` antes del foco de combate. `capas.dibujoDe` expuesto.
- **Comprobado:** `test.js` 115 grupos (solo «texturas», anterior); `prueba_luces.py` OK (6 capturas `docs/luces_v2328_*`); huellas 2D/clásico idénticas (no hace falta regenerar). `dist` 2.040.398 bytes.
- **Retoque (mismo v2.328):** ventanas se encienden antes que las farolas (atardecer propio, captura a 17:55), charcos de 3 anillos más suaves, capturas de casas/lab/ermita revisadas. Coste de `pintar` en Chromium de escritorio: 0,8 ms (plaza) y 1,9 ms (Carbuna, con lava) por fotograma; en iPhone no medido.
- **Pendiente:** probar en iPhone real (ventanas medidas a ojo, rendimiento).

## v2.329 · Detalles de ambiente (paso 5 del plan «noche», solo 2D)
- **Hecho:** `luces2d.ambiente()` (llamada tras `pintar` en `draw()`): luciérnagas parpadeantes sobre la hierba de Albanota con la noche cerrada (determinista con el reloj, 2 por celda de 40 px) y humo en las chimeneas de las casas (17:00-24:00 y 4:30-9:00). Mismo interruptor `?luces=0`.
- **Comprobado:** `prueba_luces.py` OK (captura `docs/luces_v2328_noche_hierba/casas`); `test.js` solo falla «texturas» (anterior); huellas sin cambios.
- **No hecho (fuera de alcance):** luna/estrellas (vista cenital, sin cielo), sonidos nocturnos. Pendiente: iPhone real.
- **Huellas 2D regeneradas a propósito (v2.329; el estado `190e210b78a572a8` no cambia, solo el dibujo):** 2D `df7f60e171ec77bc74469de6`, clásico `9340dadcec844165e990a44a`. Observado: el test «v2.324 agentes: hablar junto a un entrenador» falló 1 de 5 ejecuciones de `test.js` (intermitente, no investigado).

## v2.330 · Rutinas por hora blandas (paso 4 del plan «noche»)
- **Hecho:** `datos/agentes.json › rutina` (4 franjas: amanecer 5-9, día 9-17, tarde 17-21, noche 21-5, multiplicadores ×0,3-3, editables) y `agentes_mente.rutina()` aplicado en `candidatos()` con la hora de `est.reloj`: la hora multiplica la apetencia, nunca la anula; `sanar` no cambia; los <1 se acercan a 1 con la curiosidad (y +explorador); el mercader madruga; desfase fijo de ±1 h por entrenador (`azarDe(sem, i, 9999)`, sin estado nuevo). Sin ciclo/reloj = sin efecto (las huellas no cambian).
- **Medido** (`tools/agentes_rutina_diag.js`, 3 días): descansar 22 % de noche vs 1 % por la tarde; socializar 11 % tarde vs 2 % de día/noche; comerciar 28-31 % día/tarde, entrenar 37 % al amanecer. Aún 23 % entrenando de noche (curiosos): subible bajando el factor de curiosidad si se quiere más vacío.
- **Comprobado:** `test.js` 117 grupos (solo «texturas» + intermitentes de «v2.324 agentes», ya observados antes); pruebas de navegador de agentes/reloj/luces.
- **No hecho:** casas (dormir = descansar en el Centro PC); sin sonido.

## v2.331 · Paso 6 (ajuste y pruebas) + dormir en el Centro PC
- **Hecho:** de noche (21-5 h) `descansar` ocurre DENTRO del Centro PC (30-60 s por vez, `rutina.sueno`; de día sigue siendo un respiro en la plaza). Objetivo del usuario: ~50 % dentro de noche. Medido con `tools/agentes_rutina_diag.js` (4 días, semillas 7/3/5): 51-55 % dentro de un edificio de 23 a 4 h (incluye curar). Ajustable con `rutina.sueno` y el peso nocturno de `descansar` (datos/agentes.json).
- **Comprobado:** `test.js` (solo «texturas», anterior); `huella --comprobar` igual; `prueba_agentes/reloj/luces` OK; `agentes_ruta_diag` OK (esta no avanza el reloj: no ejercita la noche).
- **Pendiente:** ver en pantalla el Centro PC de noche con varios dentro (8 huecos por Centro; si hay más, comparten hueco); iPhone real; casas; test intermitente «v2.324 agentes».

## v2.332 · Estética propia de los entrenadores NPC (pasos 1-3 del plan «sprites»)
- **Hecho:** `src/entrenadores.js` (fábrica por capas, mismas reglas que Oli/Lali: rejilla de letras, contorno, rampas luz/base/sombra con sombra violeta, 4 vistas × 3 pasos). Catálogo: 4 complexiones, 8 peinados, 6 ropas, 10 complementos, 3 ojos, 6 pieles, 13 colores de pelo, 15 paletas a mano (3 por ambición). `disenar(a)`: ambición → ropa/complemento/paleta; semilla fija (`a.i`, `a.asp`) → resto + un rasgo llamativo; determinista, sin estado nuevo. 24 entrenadores = 24 diseños (test con 4 semillas).
- **Cableado:** `agentes_cuerpo.sprite(a)` usa la fábrica (sin ella, el recoloreado provisional); poses propias de victoria (`<id>_g`, puños arriba, boca abierta) y derrota (`<id>_p`, cabeza caída, ojos cerrados) que se muestran mientras dura la reacción tras un duelo; el retrato del diálogo empieza donde empieza la cabeza.
- **Herramientas:** `tools/hoja_entrenadores.py [n] [salida] [real]` (hoja de contacto; `real` = los de una partida), `tools/prueba_entrenadores.py` (juego real, día/noche, poses). Capturas en `docs/`.
- **Comprobado:** `test.js` 121 grupos (solo «texturas», anterior); huellas 2D/clásico regeneradas a propósito (estado `190e210b78a572a8` igual): 2D `8be3d47e1375e51a9ee17d12`, clásico `5f954ce56b47ace7a566a6ca`; `prueba_agentes/luces/entrenadores` OK; `agentes_ruta_diag` OK.
- **Ojo:** `dist` 2.075.488 bytes (límite 2.100.000): quedan ~24 KB. Sin versión HD-2D (descartada). Pendiente: iPhone real; revisar en pantalla grande los combos menos vistos.
- **Nombres (v2.332):** «Pol» → «Kai» y «Adrián» → «Lola» en `datos/agentes.json › nombres` (huellas sin cambios).
- **Nombres (corrección):** Adrián→Aitor (un hombre; antes puse Lola por error), Pol→Kai; `datos/agentes.json › renombres` los aplica también a partidas guardadas (conservaban el nombre original).

## v2.333 — los NPC pescan de verdad
- `pescar`: los lances (pez, si pica) se deciden en `ini` (campo `lan` del paso); `fin` mete los peces en la mochila. `pescaDe(a,t)` en agentes_cuerpo.js proyecta fases (lanzar/espera/pique/forcejeo/salto/listo) y game.js dibuja caña, hilo, boya y pez.
- Frases `pescando`. Huellas sin cambios (2D 8be3d47e…, estado 190e210b78a572a8).
- Límite de dist subido por permiso del usuario: 2.100.000 → 2.300.000 (test.js). dist actual 2.078.396.
- Prueba: tools/prueba_pesca_npc.py. Fallo previo: "texturas".

## v2.334 — cupo y cola en la pesca + retoques
- Cada punto de pesca de un mapa dibujado tiene un solo pescador (orilla: hasta 2, a 2 casillas; puente: 1); el jugador también ocupa su sitio. Poi `f:<punto>.<lado>`; tope `datos/agentes.json › pesca.cupo` (4 NPC a la vez por mapa). Si está lleno esperan (`ocio`, 6-12 s, hasta 8 veces) y reintentan; al agotarse falla normal (veto).
- Caña del NPC: largo fijo (no depende de la distancia del corcho). Nombres que se pisan se apilan hacia arriba.
- Huellas 2D y clásico regeneradas a propósito (estado igual 190e210b78a572a8). tools/agentes_pesca_diag.js: máx. 4 en Albanota, 0 sitios repetidos.
- Pendiente: más zonas de pesca/exploración (las pedirá el usuario).

## v2.335 — nadie apilado + noche más pulida
- Causa del apilamiento: 'plaza' se trataba como una puerta ('p…') y TODOS caían en la misma casilla (src/agentes_cuerpo.js › casilla). Corregido, y además `reservar(a, poi, forzar)` da la casilla libre más cercana (otro entrenador, jugador, puertas y puntos de pesca reservados) en `empezar` y en `ocioPaso` (parado sin hacer nada). Duelo: el retador también busca sitio libre. Pesca: un duelista en un sitio de pesca lo sigue ocupando.
- tools/agentes_apilados_diag.js: 3 días → 0 casillas con 2+ parados (antes 592). Nombres: solo de los entrenadores a < 7 casillas (o en duelo/reacción), y si se pisan se apilan.
- Noche (src/luces2d.js): focos con degradado radial suave (sin anillos), halo de bombilla con bloom (adiós al rectángulo), luz de luna tenue y sombra de contacto (opuesta a la farola cercana) para jugador/NPC, gradación (cielo más profundo arriba). Visual puro.
- Huellas 2D y clásico regeneradas a propósito (estado 190e210b78a572a8 igual).
- Pendiente (necesita ojo del usuario): afinar intensidad/color de farolas, sombras de postes/edificios, reflejos en el agua, polvo en el cono de luz.

## v2.336 — iluminación 2D++ (noche cálida y atardecer, 7 efectos en `src/luces2d.js`)
- **Fuente:** luz sumergida turquesa que pulsa (charco con borde azul propio) + agua del estanque iluminada (núcleo, anillos donde cae el agua, destellos, bruma sobre los chorros). Entrada de datos `PUNTOS.fuente`.
- **Reflejos:** farolas, ventanas y brasas se reflejan en las casillas `~` que tienen debajo (columna que tiembla, recortada al agua) + destellos de luna sobre el agua.
- **Filo de luz:** el personaje o criatura junto a una luz recibe 1 px cálido (o turquesa junto a la fuente) en el borde que mira a la luz. Para esto `game.js` registra los sprites del cuadro en `G.luces2d.reg` (se vacía cada cuadro, tope 120).
- **Atardecer/amanecer:** sombras largas de personajes y criaturas (lado contrario al sol, sin pisar al sprite), oro hacia el sol, rosa arriba y bloom bajo. No hay sombras largas de objetos/edificios (pendiente).
- **Ambiente:** polillas y polvo en el cono de cada farola; cada ventana de las casas y la ermita se enciende y apaga a su hora (fundido ~20 min); niebla baja 3-6 h en Albanota que recoge el color de las farolas.
- **Criaturas:** las de fuego y las eléctricas (`elements`) iluminan su entorno de noche (naranja parpadeante / amarillo-azul con chispeo).
- Todo visual puro, determinista (reloj del ciclo + `hh`), sin estado de partida. Solo 2D; **HD-2D pendiente** (descartado por ahora). `?luces=0` lo apaga todo.
- **Comprobado:** `node build.js` (dist 2.098.787 B), `test.js` (solo «texturas», anterior), `huella --comprobar` igual, `tools/prueba_luces.py` y `tools/prueba_luces2.py` OK (sin errores), capturas `docs/luces_v2336_*`.
- **Pendiente:** verlo en el iPhone (intensidad de reflejos y fuente, ajustable en `PUNTOS`/`reflejos`), sombras largas de edificios y árboles, luz de interiores.

## v2.337 — «?lex» y marca de pesca tapando al pescador
- **Causa 1:** la fuente de píxeles no tenía vocales acentuadas en MAYÚSCULA (solo á é í ó ú ñ): «Álex» salía «?lex». **Arreglo de raíz** (`src/font.js`): cualquier letra con acento se descompone (`normalize('NFD')`) y la marca se coloca sobre la letra, mayúscula o minúscula (Á É Í Ó Ú Ñ Ü, à, â, ü…); añadidos ¿ y ¡. Test: todos los `nombres` de `datos/agentes.json` y todas las acentuadas se dibujan.
- **Causa 2:** `marcasPesca()` (game.js) dibujaba el icono del sitio de pesca aunque un entrenador estuviera pescando ahí, encima de su cara. **Arreglo:** `G.marcaPescaLibre` (`src/mapas.js`, pura): la marca no se dibuja si alguien ocupa la casilla (a < 12 px) ni si el icono toca el sprite de cualquiera (usa `G.luces2d.reg`, los sprites del cuadro; el propio jugador queda exento para mantener el aviso). Test en `test.js`.
- Huellas 2D y clásico regeneradas a propósito (cambia el texto con acentos; estado `190e210b78a572a8` igual).
- **Comprobado:** build (dist 2.100.426 B), `test.js` solo «texturas» (anterior), captura de «Álex Ñandú Éric Óscar Úrsula Íñigo» correcta. `prueba_pesca_npc.py` es intermitente (pasa y falla con el código original también).

## v2.338 — sombras como antes + captura EN el combate (vida en rojo) + captura más vistosa
- **Sombras:** retiradas las sombras largas del atardecer (v2.336); las sombras de personajes y criaturas vuelven a ser las de antes (la de contacto nocturna de la v2.335 y la del 2D siguen). Queda el tinte dorado/rosa del atardecer.
- **Captura con la vida en rojo (`src/combate_motor.js`):** cuando una salvaje (no en duelos) baja a ≤ 25 % de vida (rojo) y hay esferas, el combate se PAUSA y se ofrece la captura (`cap.vivo`, `ofrecer()`); misma mecánica que antes (deslizar, calidad, 3 sacudidas, fórmula `BASE × calidad`). Capturada → el combate acaba en victoria sin derrotarla (XP y Brillos como al ganar) y la criatura sale del mapa; soltar (botón) o fallar 3 veces → el combate sigue y no se vuelve a ofrecer a esa criatura (`k.capNo`). **Ya no se ofrece tras derrotarla** (una derrotada desaparece). Vista: `G.vista.combate().cap` lleva `vivo` y `hpF`; mientras dura la oferta la dibuja `cap`, no la unidad.
- **Visual (`src/combate_2d.js`, solo 2D):** esfera nueva 11×11 con volumen y brillo; aviso «¡Está débil!», aura roja que late y criatura teñida de rojo, retícula giratoria; vuelo con estela, brillo y sombra; absorción en haz de luz; 3 lucecitas (una por sacudida); al capturar anillo dorado y chispas; al escaparse la esfera se abre en dos con destello; textos con acentos (¡Capturada!, ¡Se escapó!, Llévala…).
- **Comprobado:** build (dist 2.107.605 B), `test.js` solo «texturas» (anterior) + 4 tests nuevos de captura (oferta en rojo, pausa, soltar, sin esferas), huellas iguales, `tools/prueba_captura_viva.py` (oferta→vuelo→sacudidas→capturada, sin errores) y `prueba_luces2.py` OK. Capturas `docs/captura_v2338_*`.
- **Pendiente:** HD-2D (su pintor no tiene la retícula/efectos nuevos; el motor y la vista sí valen); probar en iPhone; si quieres, una oferta también al volver a estar en rojo tras sanar o soltarla.

## v2.339 · Caja del Centro PC (capturas con su vida; solo 6 contigo)
- **Modelo (`src/equipo.js`):** `j.sinId` = caja de ejemplares `{id, forma, mapa, n, hp?, xp?}` (hp absoluto; sin él = completa). El equipo (`j.equipo`, ≤6 especies) lleva vida/XP en `j.vida/j.prog` (por especie); `poner(est,j,formas,ids)` deposita lo que sale (con su vida y XP) y saca lo que entra; caja 50 (+10 por ampliación, 120 ✦ + 80 por cada una, tope 300). `migrar` lleva guardados anteriores (sin `cv:1`): los del equipo salen de la caja y la inicial, si no va en el equipo, pasa a la caja.
- **Captura:** va directa a la caja con la vida que tenía (mín. 1) y su nivel; aviso «X enviada al Centro PC»; con la caja llena no se ofrece captura (avisa). Sin «laboratorio» en la captura.
- **Centro PC:** órdenes `equipo` (con `ids`) y `ampliar` (solo junto a Alba); curar también cura la caja; opción «Ampliar mi caja»; fuera del Centro el panel Equipo es solo lectura.
- **Comprobado:** build, `test.js` solo «texturas» (anterior) + tests v2.339, huellas iguales, `tools/prueba_caja.py`.

## v2.340 · Hasta 6 criaturas iguales en el equipo
- El equipo guarda **claves**: la especie (1.ª copia) y `especie#2`…`#6` (repetidas). `j.vida`/`j.prog`, `est.acomp.clave` y `unidad.clave` (combate) van por clave; `forma` sigue siendo la especie (sprites, estadísticas). `G.equipo.especie(clave)`; guardados v2.339 compatibles (sin `#`).
- `poner(est,j,claves,ids)`: lo que se queda conserva su clave y datos; lo que entra toma la primera clave libre; lo que sale se deposita con vida y XP. Fuera: quitado el límite «una por especie»; pociones y panel Equipo por clave.
- Comprobado: build, `test.js` (solo «texturas»), tests v2.340, `tools/prueba_caja.py`.

## v2.341 · Motes (nombre propio opcional)
- Todas se muestran con el nombre de su especie; las claves `#2…` son internas y no se ven en ningún sitio. Cada criatura puede tener un **mote** (≤12 caracteres latinos/cifras/espacio . ' -): `j.motes[clave]` (equipo) y `ejemplar.mote` (caja); viaja al entrar/salir del equipo; se guarda. Orden del motor `mote {clave|id, texto}` (vacío = quitar; no en combate). Se ve en panel Equipo (ficha con campo «Nombre»), bolsa, combate (`unidad.nom`), acompañante y avisos de nivel.
- Comprobado: build, `test.js` (solo «texturas»), tests de motes, `tools/prueba_mote.py`.

## v2.342 · ID permanente (Nº 0042) y liberar
- `j.sigId` (contador), `j.ids[clave]` (equipo) y `ejemplar.id` (caja): se asigna una vez (inicial = Nº 1; capturas y crías = siguiente) y no cambia al mover la criatura entre caja y equipo. `G.equipo.asegurar/idDe/liberar/renumerar`. Guardados anteriores (sin `iv:1`) se numeran por orden de captura (equipo primero).
- Orden `liberar {id}` (solo caja, junto a Alba, fuera de combate): el número no se reutiliza. Panel Equipo: «Nº 0042» en tarjeta y ficha; botón Liberar con doble confirmación (solo en modo Centro PC).
- Decisiones del usuario para el tablón (próximos pasos): ID global; solo se intercambia lo que está en la caja; hasta 5 ofertas activas (sube con el nivel de entrenador); caducidad elegible/ampliable; se pide especie/elemento/rareza/nivel mínimo o «cualquiera»; TODA propuesta se acepta manualmente (jugador o NPC); notificación profesional (buzón con no leídas) cuando llega una propuesta; XP de entrenador al confirmar.
- Comprobado: build, `test.js` (solo «texturas»), tests v2.342, `tools/prueba_id.py`, `prueba_caja.py`, `prueba_mote.py`.

## v2.343 · Nivel de entrenador
- `src/entrenador.js` (puro): `j.xpE`, curva `60·(n−1)^1,5` (nivel 2 = 60 XP, tope 50), `dar(est,j,xp)` con recompensa por nivel (20 × nivel ✦; cada 5 niveles +10 huecos de caja y una ranura de oferta del tablón, máx. 5 = `ranurasTablon`).
- XP: ganar combate (½ de la XP de la criatura), capturar (20; 60 si es especie nueva), pescar (2; 10 si es nueva). El tablón dará XP al confirmar.
- HUD: «Nv N» en el botón Equipo; panel Equipo: «Entrenador · Nivel N» con barra. Se guarda (`xpE`).
- Comprobado: build, `test.js` (solo «texturas»), tests v2.343, `tools/prueba_entrenador.py`.

## v2.344 · Tablón de intercambios: motor, NPCs y buzón (sin interfaz todavía)
- `src/tablon.js` (puro, `est.tablon`): ofertas con criatura en CUSTODIA (sale de la caja; vuelve si se retira/rechaza/caduca), pide especie/elemento/rareza/nivel mínimo o «cualquiera», duración 1/3/7 días de juego (600 s/día) ampliable, ranuras = `G.entrenador.ranurasTablon` (1…5), máx. 5 propuestas pendientes por jugador (8 por oferta). TODA propuesta se acepta a mano (`tablon_aceptar`); intercambio atómico; el recibido recibe número nuevo y se bloquea 1 día; XP de entrenador (10 + valor/4, máx. 60; +40 especie nueva; 3 intercambios con XP al día) y Brillos por especie nueva.
- Órdenes (solo en la Tienda, fuera de combate): `tablon_publicar/retirar/ampliar/ofrecer/retirar_prop/aceptar/rechazar`, `buzon_leer/buzon_borrar`.
- NPC (`avanzar` cada 12 s, un entrenador por paso, determinista): publican lo que les sobra (pos ≥ 2) pidiendo una especie que no tienen; proponen a ofertas cuya especie desean con una criatura de valor justo (≥ 85 %, ≤ 200 %) que cumpla lo pedido; deciden tras 20 s: aceptan la mejor que les sirve y rechazan las que no.
- `src/buzon.js`: `j.buzon` (≤30, no leídas) con avisos de propuesta, confirmada, rechazada, caducada; además sale el aviso emergente.
- Guardado: `est.tablon` (se descartan ofertas rotas), `j.buzon`, `j.tx`, `ejemplar.bloq`. Fuzz de 400 operaciones: el total de criaturas se conserva siempre.

## v2.345 — Tablón: interfaz, objeto en la Tienda y buzón
- Objeto «Tablón de intercambios» en la Tienda (casilla 3,2; hablar con él abre el panel). `src/tablon_ui.js`: panel con Ofertas · Mis ofertas · Propuestas (publicar con filtro cualquiera/especie/tipo/rareza/nivel mín. y duración 1/3/7; ofrecer, ampliar, retirar; aceptar con pantalla de confirmación Das/Recibes, rechazar). Solo da órdenes (`apiTablon.orden`).
- Buzón: botón ✉ en el HUD con insignia de no leídas (visible si hay avisos); panel `#buzon`, marcar leído al abrir, borrar aviso.
- Huellas regeneradas (cambia el dibujo de la Tienda). Prueba en navegador: `tools/prueba_tablon.py` (capturas en `docs/tablon_*.png`, `buzon.png`).
- Pendiente conocido: el toast de XP se dibuja sobre el buzón; «texturas» (anterior) sigue fallando.

## v2.346 — Aviso de XP de entrenador siempre
- `entrenador.dar(est, j, n, motivo)` emite siempre «+N XP de entrenador · motivo» (combate, captura, pesca, intercambio) antes del aviso de nivel; se muestra con el cartel de XP. Quitado el aviso duplicado del tablón.

## v2.347 — Aviso de XP de pesca discreto + «texturas» arreglado
- La XP de pesca sale como aviso normal (`suave`), el resto con cartel central. Regenerada `docs/volumenes_tex_casa.png` (faltaba): `test.js` pasa entero.
- Análisis de economía (sin cambios de números): simulando combates contra enemigos de tu nivel, el nivel de entrenador sube a ~0,7× el de la criatura (Nv 10 a los 52 combates, Nv 30 a los 140, Nv 50 a los 215) y se acumulan ~14 000 ✦; ampliar la caja hasta 300 cuesta ~22 000 ✦ (sumidero principal). Precios fijos (Poción 40, Esfera 30, curar 8/20 por criatura) frente a premios que crecen hasta 264 ✦/combate.

## v2.348 — Precios de objetos suben con el nivel de entrenador
- `tienda.precioCompra(id, j)`: precio base +3 % por nivel (Nv 1 = base; Nv 50 ≈ ×2,5). `comprar` cobra ese precio y la Bolsa lo muestra. Vender sigue sobre el precio base (sin ganancia comprando/vendiendo). Los entrenadores NPC compran al base.

## v2.349 — Economía reequilibrada
- Objetos: `tienda.precioCompra(id, j)` = nº fijo de combates del nivel del jugador (Poción 2, Superpoción 5, Esfera 1,5, Revivir 8; `ingresoNivel`), nunca por debajo del base; sustituye al +3 %/nivel de v2.348. Vender sobre el base.
- Pescado: vale la mitad para el jugador (pescando se ganaba 3-6× más por minuto que combatiendo al empezar). Los entrenadores NPC conservan su mercado (`precioPez/precioVenta(id, true)`) para no alterar su simulación.
- Recompensa de nivel de entrenador: 6 ✦ × nivel (antes 20 ×; a partir del Nv 40 los niveles daban 2,6× lo que se ganaba luchando).
- Pendiente de decidir: curar en la Doctora (8/20 ✦) sigue fijo; bonus de especie nueva (25 ✦ + 10+precio al primer pez).

## v2.350 — Nivelado final de la economía
- Curar en el Centro PC: 0,3 combates por criatura herida y 0,75 por debilitada del nivel del jugador (nunca bajo 8/20; los NPC pagan el base).
- Pescado: factor por profundidad 0,5 / 0,35 / 0,3 (orilla / media / honda) para el jugador → ~11 / 27 / 41 ✦ por minuto a 5 peces/min, frente a 12 / 43 / 110 ✦ por minuto luchando en Nv 1 / 10 / 30. Los puntos de pesca actuales dan aguas de profundidad 0 y 1.
- Tabla de referencia (Nv 1 / 10 / 30 / 50): combate 10/36/92/106 ✦; Poción 40/70/185/210; Esfera 30/55/140/160; Revivir 180/290/735/850; curar herida/debilitada 8·20 / 11·27 / 28·69 / 32·80; recompensa de nivel 6×nivel.

## Multiverso · paquete de preparación para Fable (solo documentos, sin cambios de código)
- `docs/multiverso/`: `00_PAQUETE_FABLE.md` (maestro), `01_AUDITORIA_TECNICA.md`, `02_REUTILIZACION.md`, `03_PROPUESTAS_DATOS.md`, `04_DEPENDENCIAS.md`, `universos/` (común, Nexus, Reino de las Chuches, Mundo Salvaje, Dimensión Tecnológica).
- Hallazgos clave: pérdida de progreso al cargar con mapa inexistente (reproducido), el nivel de las salvajes solo depende de la rareza, guiones de NPC en código.

## v2.351 — Multiverso F1 · Seguridad del guardado (Fable)
- `guardado.restaurar`: el progreso del jugador se restaura siempre. Mapa inexistente, piso de expedición caducada o posición inválida solo pierden el SITIO: entrada del mapa si existe, o `guardado.seguro(j)` (ancla de inicio), pila `volver` vacía y aviso al jugador. Antes se descartaba todo el jugador (Brillos, XP, caja…).
- `guardado.cargar(crear)` (nuevo camino de arranque en `game.js`), `examinar(texto)`, `bloqueo` (`'futuro'`/`'corrupto'`): un guardado que no se entiende no se sobrescribe (ni autoguardado, ni `pagehide`); si restaurar falla a medias se arranca con una partida limpia. Copia `criaturas_partida_bak` = último guardado bueno con el que se arrancó; `borrar()` pasa a la copia lo que se entendía o era de versión futura.
- Aviso en pantalla: cartel `#gbl` que se queda hasta tocarlo (la cabecera recortaba el texto).
- Cambio de contrato a propósito en un test antiguo (v2.189): un mapa inexistente ya no hace que `restaurar` devuelva `false`.
- **Comprobado:** build; `test.js` 122 grupos (nuevo grupo E1: 11 escenarios + fuzz de 400 guardados dañados); huellas 2D y clásico IGUALES; `agentes_diag` igual (15f00763); navegador: `prueba_guardado.py` (15 ok), `prueba_agentes`, `prueba_reloj`, `prueba_profundidades`, `prueba_caja` OK; `prueba_red` como antes (PeerJS real no verificable sin red); `prueba_tablon` falla igual que en la v2.350 en este entorno (no carga el CDN).
- **Pendiente anotado:** (F7) el test «v2.324 agentes: en la simulación larga aparecen rivales y amigos…» es intermitente y ya lo era en la v2.350 (1 de 8 ejecuciones); (F4) el guardado no restaura `semilla`: el plan de criaturas cambia en cada sesión; sin medir en iPhone real.

## v2.352 — Multiverso F2 · Guardado v2 y migración (Fable)
- `guardado.js`: `VERSION = 2`. Formato por secciones: `{ v, semilla, reloj, jugadores, tablon, dim: { tonavia: { v: 1, agentes, prof }, …otras } }`. `migrar` v1→v2 es pura (no modifica el original; idempotente sobre v2). Una sección `dim.tonavia.v` > 1 se trata como versión futura (bloquea, igual que `v` > 2).
- `est.dim` (nuevo, `{}` en `motor.crear`): guarda las secciones de dimensiones que este juego no gestiona (id `[a-z][a-z0-9_]{0,23}`, objeto con `v` entero, máx. 16). Se conservan tal cual en cada guardado, así que un juego sin el Nexus no borra los datos del Nexus. `tonavia` sigue en `est.agentes`/`est.prof` (huella del 2D sin cambios); `est.dim.tonavia` no existe ni puede pisarla.
- Copia previa a la migración: al cargar un guardado de versión anterior se guarda, una sola vez, el texto original en `criaturas_partida_premig` (jamás se pisa; `borrar()` tampoco la toca). La copia normal `_bak` sigue renovándose en cada arranque.
- **Recuperación desde la copia (evaluada e implementada, conservadora):** `?recuperar=1` → `G.guardado.recuperarCopia()`. Solo actúa si el guardado principal falta o es ilegible; NUNCA si es válido o de versión futura. Lo ilegible se aparta antes en `criaturas_partida_corrupta` (si ya hay uno distinto apartado, no se hace nada); la copia usada debe ser entendible (`_bak`, si no `_premig`; una copia de versión futura no se usa). Nunca es automática: el arranque con guardado ilegible sigue bloqueado y el aviso explica cómo recuperar (con la copia disponible). Coste: se pierde lo jugado desde el último arranque.
- `game.js`: lee `?recuperar=1` y amplía el aviso del guardado ilegible. `fixtures`: `tools/fixtures/guardado_v1_f1.json` = guardado v1 REAL generado con el código de la v2.351 (30 min de entrenadores, expedición de Profundidades, tablón, Brillos/XP/caja).
- Cambios de contrato de pruebas F1 (a propósito, mismas comprobaciones): `d.v === 1` → `VERSION`; «versión futura» de `examinar` pasa de `v:2` a `VERSION+1`; los tests que leían `g.agentes` del guardado leen `g.dim.tonavia.agentes`; el fuzz de F1 daña ahora `dim`/`dim.tonavia`; `prueba_guardado.py` y `prueba_agentes.py` leen el formato v2. Nada de F1 se ha eliminado.
- **Comprobado:** build; `test.js` 123 grupos (nuevo grupo F2: migración con v1 real sin pérdida, ida y vuelta, dimensiones desconocidas, sección futura, copia previa, 12 escenarios de recuperación, fuzz de 400 guardados v2 dañados); huellas 2D y clásico IGUALES; `agentes_diag` igual (15f00763); navegador 390×844: `prueba_guardado.py` (22 ok, con v1 real, aviso de recuperación y `?recuperar=1`), `prueba_agentes`, `prueba_reloj`, `prueba_profundidades`, `prueba_caja` OK; `prueba_red` igual que en la v2.351 (PeerJS real no verificable sin red); `prueba_tablon` falla igual que en la v2.351 (no carga el CDN).
- **Limitaciones / pendiente:** (F4) el guardado sigue sin restaurar `semilla`; (F3/F4) `est.dim` es un depósito opaco hasta que el registro de dimensiones reclame cada id; sin límite de tamaño por sección (F8: límites y rendimiento); la posición de un jugador en una dimensión no instalada se pierde (progreso intacto, F1); sin probar en iPhone real; test intermitente de agentes (F7) no tocado.

## v2.353 — Multiverso F2 · Auditoría final (Fable)
Revisión de la implementación de F2 buscando fallos reales (no solo tests en verde). Errores encontrados y corregidos, cada uno con prueba (grupo «Auditoría final de F2» de `test.js`, y `prueba_guardado.py`):
1. **Recuperación imposible en un caso real:** un guardado de buena forma que `restaurar` no puede aplicar (p. ej. sin ningún jugador conocido) bloquea el juego («corrupto»), pero `recuperarCopia` lo tomaba por válido (`principal_valido`) y no recuperaba. Ahora `restaurable()` comprueba que de verdad se puede aplicar; ese guardado cuenta como ilegible.
2. **Copia «válida» que no arranca:** `copiaValida` aceptaba una copia de buena forma pero no restaurable, y tras «recuperar» el juego volvía a bloquearse. Ahora exige que se pueda restaurar y pasa a la siguiente (`_premig`).
3. **Segunda corrupción irrecuperable:** con un solo hueco de cuarentena, tras recuperar una vez, la siguiente corrupción se negaba para siempre. Ahora hay 3 huecos (`criaturas_partida_corrupta`, `…2`, `…3`); nunca se pisa uno; con los 3 ocupados por otros no se hace nada.
4. **Pérdida de datos en `est.dim`:** (a) tope de 16 secciones: las demás se descartaban; (b) solo ids `[a-z][a-z0-9_]*` y secciones con `v` entero: ids como `reino-chuches` o `Tecno2` se perdían al guardar. Ahora se conserva todo objeto con un id razonable (`[A-Za-z0-9][A-Za-z0-9_.-]{0,63}`), sin tope (los límites son de F8); `__proto__`, `constructor` y `prototype` se descartan como id (comprobado que no contaminan nada y que claves `__proto__` internas se conservan como datos).
- Tests de F2 que codificaban el comportamiento anterior (tope 16, `v` obligatoria, un solo hueco) se actualizaron A PROPÓSITO por los puntos 3 y 4; ninguno se debilitó.
- Sin cambios (revisado y correcto): migración pura e idempotente (4 ciclos con el v1 real estables), conservación byte a byte de secciones desconocidas con texto Unicode, números extremos y anidación en 6 ciclos cargar→jugar→guardar, F1 intacto (bloqueos, 0 escrituras, `_bak`, fuzz), autoguardado y `pagehide` tras recuperar, `?nueva=1` (gana sobre `?recuperar=1`; lo anterior pasa a la copia).
- **Comprobado:** build; `test.js` 124 grupos; huellas 2D y clásico IGUALES; `agentes_diag` 15f00763; navegador: `prueba_guardado.py` (26 ok), `prueba_agentes`, `prueba_reloj`, `prueba_profundidades`, `prueba_caja`; `prueba_red` y `prueba_tablon` como en la v2.351 (CDN/PeerJS no disponibles).
- **Limitaciones conocidas (no defectos de F2):** dos pestañas abiertas a la vez pueden pisarse el autoguardado (igual desde siempre); volver a un juego de la v2.351 con un guardado v2 lo bloquea como «versión futura» (protección correcta, la copia `_premig` conserva el v1); `_premig` es un v1 antiguo si ninguna otra copia vale (se usa solo con `?recuperar=1`); un `dim.tonavia.agentes` dañado se sustituye por población nueva (como ya hacía F1); sin probar en iPhone real; `semilla` sin restaurar (F4); límites de tamaño y rendimiento (F8); test intermitente de agentes (F7).

## v2.354 — Multiverso F3 · Registro de dimensiones, esquema y validador; «tonavia» por datos (Fable)
- Nuevo `src/dimensiones.js` (`G.dimensiones`, puro, antes de `mapas.js` en `orden.json`): esquema v1, `validar`, `registro`, `deMapa`, `comprobar`. Nuevo `datos/dimensiones/tonavia.json` (entrada Albanota/inicio, las 8 regiones del plan, reloj global). Nuevo `tools/validar_dimension.js` y `docs/multiverso/06_ESQUEMA_DIMENSION.md` (contrato).
- `mapas.js`: `INICIAL` sale de `tonavia.entrada` (antes literal; error claro si falta). `build.js`: mete `G.DATOS.dimensiones` y se niega a empaquetar (sin tocar `dist/`) si alguna dimensión es inválida, no coincide su id con el archivo o falta `tonavia`.
- Alcance acotado: el esquema solo admite lo que ya tiene significado (id, nombre, entrada, regiones, reglas.ciclo=global); dificultad/apariciones/economía/entrenadores/requisitos se RECHAZAN hasta que F5-F7 los definan. Sin cambios en guardado (F2 intacto: las secciones `dim.*` desconocidas se siguen conservando), motor, aparición ni agentes.
- Cambio de contrato a propósito en un test antiguo (v2.57, «inicio»): ya no mira el texto de `mapas.js` sino que comprueba el resultado (Albanota/inicio) y que el dato viva en `tonavia.json`.

## v2.355 — Multiverso F4 · Proveedores de mapas, carga/descarga por dimensión, paquetes del editor, semilla restaurada (Fable)
- `mapas.js`: `mundo.proveedores` (+ `crearProveedorDimension`), `cargadas/cargarDimension/descargar/validarDimension`; `mundo.mapa` consulta proveedores antes del `generador`. `build.js`: `maps/<dim>/*.json` → `G.PAQUETES[dim]` (rechaza id fuera de su carpeta, repetidos y JSON roto). `dimensiones.comprobar(mapas, dimensiones?)` con filtro opcional; `mundo.validar()` lo integra.
- `motor.js`: `liberarDimensiones` (tras cada cambio de mapa y al restaurar); `est.sesion` (semilla de la sesión, no se guarda); `combate_motor.js` usa `est.sesion`. `guardado.restaurar` restaura `est.semilla` válida y reinicia `est.mapas`; no toca `est.rnd`/`est.sesion`.
- Editor: `leerPaquete` rechaza ids con `/` con mensaje claro y exige `dimensiones.comprobar`. Solo tonavia (el resto, F8).
- Decisiones aprobadas por el usuario: descarga A (tonavia siempre; resto bajo demanda), paquetes solo tonavia, semilla de mundo restaurada y azar de combate independiente. `tools/validar_dimension.js` valida otras dimensiones con `validarDimension`.
- Comprobado: test.js 126 grupos, huellas 2D/clásico y agentes_diag sin cambios, validar_mundo, catálogo, navegador (guardado, agentes, reloj, profundidades, caja, editar_en_juego, red, tienda). Fallos previos idénticos en la base F1: prueba_editor, prueba_minimapa, prueba_tablon, prueba_mapas_juego (82/83 objetos, CDN).

## v2.356 — Multiverso F5 · Portales con requisitos, transiciones, Nexus técnico, tablón global (Fable)
- Nuevo `src/portales.js` (puro; requisitos `nivelEntrenador`, validación, `comprobar`) y `src/portales_ui.js` (marco/halo del portal, velo de transición). `motor.cruzar`: requisitos, avisos de cruce, descarga. `mapas.js`: proveedores creados antes de arrancar el mundo, destinos de otras dimensiones validados sin cargarlas (`conExterno`), campo `portal` y `destino.dim` validados; paquetes del editor sin portales nuevos (los oficiales pasan sin cambios). `entrenador.js` exporta `MAX`.
- Datos: dimensión `nexus` + `maps/nexus/plaza_cruce.json` (mapa TÉCNICO), portal `portal_nexus` en `maps/ermita.json` (nivel 5, dato). `tablon.js`: el tablón se usa junto a cualquier personaje `tablon` (ya no solo en la Tienda). `game.js`: tres ganchos (transición, dibujo, velo). Editor: plantilla conserva `portal`/`destino` al abrir y exportar. `componer_mapa.js` crea la carpeta de ids `dim/mapa`.
- Fallo real hallado por la prueba de navegador y corregido: el velo de transición volvía a cargar la dimensión recién descargada (usaba `mundo.mapa`; ahora solo mira mapas ya cargados). Fallo real hallado por `prueba_editar_en_juego`: el editor perdía el portal de la Ermita al reexportar (ahora lo conserva).
- Cambios de contrato en pruebas antiguas (por haber ya un Nexus real, no por debilitarlas): el registro lista `["tonavia","nexus"]`; `comprobar(mapas)` sin filtro exige también la entrada del Nexus (los usos reales filtran a tonavia); los fixtures de «mapa inexistente» usan `fantasma/plaza` en vez de `nexus/plaza_cruce`; `G.PAQUETES` ya no va vacío; `validar_dimension.js` lista 2 dimensiones.
- Comprobado: test.js 127 grupos, huellas 2D/clásico y agentes_diag sin cambios, validar_mundo, catálogo, navegador (guardado, agentes, reloj, profundidades, caja, editar_en_juego, red, tienda, portales). Fallos previos idénticos a la base F1: prueba_editor, prueba_minimapa, prueba_tablon, prueba_mapas_juego (82/83 objetos, CDN); `componer_mapa --comprobar` de Carbuna ya fallaba.

## v2.357 — Multiverso F6 · Ganchos de contenido (Fable)
- Alcance aprobado (plan global `12`, hoja `05`): apariciones con multiplicadores, nivel base por región, factor de economía, marcas de progreso guardadas, registro de órdenes para módulos + las tres ampliaciones para FN/crafteo (órdenes con acceso a `est` y validación propia; marcas por jugador en `est.dim.<dim>` con validador por módulo; `REQ` con `est`). Contrato en `13_GANCHOS_F6.md`.
- Código: `dimensiones.js` (esquema v2, `ajustesDe`, `NEUTRO`), `aparicion.js` (`plan(…, reglas?)`), `combate_motor.js` (nivel base, `premioDe`), `tienda.js` (`premioDe`, precios/cura × factor), nuevo `marcas.js` (+ `orden.json`), `guardado.js` (marcas por sección; `SECCION_TONAVIA` = 2 máxima entendida, `SECCION_BASE` = 1 la que se escribe sin marcas), `motor.js` (`ordenes`, `cruzar` pasa `est`), `portales.js` (`REQ.marca`, `est`), `portales_ui.js`/`game.js` (pasan `est`).
- Cambios de contrato en pruebas antiguas, a propósito: sección tonavia «futura» es v3 (antes v2); `ESQUEMA` = 2; el esquema «futuro» es v3; `economia` en un archivo v1 se rechaza por «exige v ≥ 2» (antes «clave desconocida»). Ninguna prueba se debilitó.
- **Comprobado:** build; `test.js` 128 grupos (nuevo F6: esquema, ajustes, apariciones, marcas y guardado, órdenes, requisitos, economía y nivel, pureza); huellas 2D y clásico IGUALES y `agentes_diag` 15f00763; `validar_mundo` y `validar_dimension` (tonavia, nexus) OK; navegador 390×844: `prueba_guardado`, `prueba_portales`, `prueba_tienda`, `prueba_agentes`, `prueba_reloj`, `prueba_profundidades`, `prueba_caja`, `prueba_editar_en_juego` OK; `prueba_red` OK sin PeerJS real. **Peso:** `dist` 2.233.100 B (+16.8 KB; tope 2.300.000).
- **Fallos de navegador ya existentes (no de F6; mismas pruebas que fallaban en la v2.355):** `prueba_editor` y `prueba_mapas_juego` comparan con 82/83 objetos de Albanota y hoy son 86 (expectativa de la prueba desfasada: defecto de la PRUEBA, confirmado); `prueba_tablon` y `prueba_minimapa` fallan por `ERR_TUNNEL_CONNECTION_FAILED` (CDN, límite del entorno; no verificado con red). El test «texturas» pasa en este entorno. No tocados.
- **Sin probar:** iPhone real; ningún dato de juego usa aún los ajustes (no hay dimensión de contenido), así que su efecto en pantalla solo está probado por tests con ajustes simulados.

## v2.358 — Multiverso F7 · Entrenadores por dimensión (Fable)
- Alcance (hoja `05`): entrenadores por dimensión + puesta al día de las dormidas + investigar el test intermitente de agentes. Contrato en `14_ENTRENADORES_F7.md`. No se adelanta FN ni F8; no se tocó contenido de dimensiones ni crafteo.
- **Test intermitente de agentes — causa REAL (reproducida y verificada):** «v2.324 agentes: en la simulación larga aparecen rivales y amigos…» falló 1 de 14 ejecuciones secuenciales de `test.js` (las ejecuciones en paralelo no valen: se pisan archivos). La simulación aislada era determinista (hash idéntico en 3 procesos) y dentro de `test.js` era estable en un mismo proceso pero distinta de un proceso a otro; con `Date.now` congelado dejaba de variar (la partida de prueba de `game.js` se siembra con `Date.now()` y simula SU población en el mismo proceso). Se bajó hasta el primer tick distinto (tick 22, entrenador 23, `paso.w` 0 vs 2,43 s) y la causa: `agentes_cuerpo.js › casilla()` cacheaba por `poi#(i%6)` / `poi#(i%24)` pero el valor dependía de `i` entero; el primero en pedirlo fijaba la casilla de toda su clase. **Arreglo:** la clave lleva el índice completo (con tope de 4000 entradas). Tras él, 6 ejecuciones seguidas de `test.js` dan el mismo hash (igual al de la simulación aislada) y 14 ejecuciones completas sin fallos. Prueba nueva que **falla con el código antiguo** (verificado) y pasa con el nuevo. Afectaba también a la repetibilidad de la partida cargada y al modo en red; no era no-determinismo del motor.
- **Cambio de huella justificado:** `agentes_diag` 15f00763 → **470ee914** (la trayectoria de los entrenadores cambia porque ya no depende del orden de la caché). Las huellas del dibujo, 2D y clásico, **iguales**; estado `190e210b78a572a8` igual.
- Código: `dimensiones.js` (esquema v3, `validarEntrenadores`, `entrenadores(id)` congelado), `agentes.js` (grafo por dimensión, pools, fijos, `de/asegurar(est, dim)`, `activas`, `avanzarDims`, puesta al día, `ponerAlDia` anota la deuda en las dimensiones, `valido(est, d, dim)`), `agentes_mente/acciones/cuerpo/trato.js` (grafo por prefijo del lugar; hablar/retar/final de duelo con la población de la dimensión), `agentes_acciones.js` y `tienda.js` (nivel y economía de F6 para autónomos). `guardado.js` **no se tocó**.
- Cambios de contrato en pruebas antiguas, a propósito: `ESQUEMA` = 3; el esquema «futuro» es v4; `entrenadores` en un archivo v1 se rechaza por «exige v ≥ 3» (antes «clave desconocida»). Ninguna prueba se debilitó.
- **Comprobado:** build; `test.js` 129 grupos (nuevo F7: esquema, regresión del intermitente, población, fijos, pools, activas/dormidas/puesta al día, guardado, economía y nivel, hablar y retar, rendimiento, pureza); huellas 2D y clásico IGUALES; `validar_mundo`, `validar_dimension` (tonavia, nexus) OK; navegador: `prueba_agentes`, `prueba_guardado`, `prueba_portales`, `prueba_tienda`, `prueba_reloj`, `prueba_profundidades`, `prueba_caja`, `prueba_editar_en_juego`, `prueba_pesca_npc`, `prueba_puerta_carbuna` OK; `prueba_red` OK sin PeerJS real. **Peso:** `dist` 2.254.054 B (+20,9 KB sobre la v2.357; tope 2.300.000).
- **Fallos de navegador ya existentes (no de F7, iguales que en la v2.357):** `prueba_editor` y `prueba_mapas_juego` (expectativa de 82/83 objetos de Albanota frente a 86: defecto de la PRUEBA, confirmado); `prueba_tablon` y `prueba_minimapa` (`ERR_TUNNEL_CONNECTION_FAILED`, CDN: límite del entorno, no verificado con red). No tocados.
- **Sin probar / pendiente:** iPhone real (coste de la puesta al día: 0,4–0,9 s en PC por cada 1800 s; sin medir en móvil); ningún dato de juego declara entrenadores (todo probado con dimensiones de prueba); red: las poblaciones de dimensión no se sincronizan entre móviles hasta F8; el tablón solo anuncia a los de Tonavia; límite de tamaño de `est.dim` (≈160 KB por 48 autónomos tras 30 min) para F8.

## v2.359 · Revisión de pendientes F1–F7 (previa a FN) · 14 nov 2026
- Solo herramientas y pruebas; **el juego (src/, datos/, maps/) no cambia**. Huellas iguales (2D `9e6dc7f04c30c8bc9ccce694`, clásico `0627417447a15a67e0561620`, estado `190e210b78a572a8`); `test.js` 129 grupos OK; `validar_mundo` OK. `dist` 2.261.025 B (+7 KB: el editor embebido lleva ahora `font.js`; límite 2.300.000).
- **Corregido (defecto REAL del editor, reproducido):** `tools/editor_mapas.js` no cargaba `src/font.js` → `G.pixelTextWidth` no existía → «Centro PC» salía **invisible** en el editor y su paleta (aviso silencioso en consola).
- **Corregido (defecto REAL, reproducido):** «▶ Probar en el juego» del editor arrancaba un juego sin `G.DATOS` ni `G.PAQUETES` (F3/F4/v2.320) y fallaba con «falta la dimensión tonavia». `editor_mapas.js` arma ahora los mismos datos que `build.js` (copia de esa lógica; no se refactoriza build.js).
- **Corregido (defecto de las PRUEBAS):** `prueba_editor` y `prueba_mapas_juego` fijaban 82/83 objetos; Albanota tiene 86 desde la v2.323 (lo confirma `test.js`). Ahora leen el número de `maps/albanota.json`. `prueba_editor`: el mapa exportado lleva `\n` final y los 9 `maps/*.json` no (convención de siempre; se compara sin él) y la casa de prueba se pone en (18,13), hueco libre (en (8,27) hay un árbol: el aviso del editor era correcto).
- **Sin verificar con red real:** `prueba_tablon`, `prueba_minimapa` y `prueba_mapas_juego` fallan SOLO por `ERR_TUNNEL_CONNECTION_FAILED` al pedir a cdnjs (Three.js / PeerJS). Interceptando únicamente las peticiones a cdnjs con un cuerpo vacío, las tres pasan enteras (rc=0): la causa es la red, no el código. La carga real de PeerJS/Three.js sigue sin probarse aquí.
- **Mejora opcional (no hecha):** que esas tres pruebas ignoren los errores de CDN cuando no hay red.
- Otros defectos confirmados que afecten a FN: ninguno encontrado.

## v2.360 · FN · Navegación marítima (base técnica) · 14 nov 2026
- Contrato en `docs/multiverso/15_NAVEGACION_FN.md`. Nuevo: `src/navegacion.js`, `src/navegacion_ui.js`, `datos/dimensiones/pirata.json` + `maps/pirata/` (9 mapas de agua), `tools/crear_mar.js`, `tools/prueba_navegacion.py`. Modificados: `dimensiones.js` (esquema v4, `validarNavegacion`, `navegacion(id)`), `mapas.js` (`mar`), `motor.js` (velocidad, guía, ganchos de puerta), `portales.js` (REQ `marea`, `casco`), `guardado.js`, `red.js` (v2), `capas.js` (`soltar`), `game.js` (barco, niebla, panel, HD-2D→2D).
- Cambios de contrato en pruebas antiguas, a propósito: registro = tonavia, nexus, pirata; `ESQUEMA` = 4; esquema futuro = v5; mensaje de red inválido = v3.
- **Límite de `dist` subido: 2.300.000 → 2.400.000** (test.js). Medido: v2.359 = 2.261.025 B; v2.360 = 2.362.059 B (+101.034 B, +4,5 %; gzip 685.859 → 704.229, +18.370 B, +2,7 %). Reparto aproximado: 9 mapas de agua ~46 KB, `navegacion.js` ~29 KB, `dimensiones.js` ~13 KB, `navegacion_ui.js` ~6 KB, resto ~7 KB. El coste real de carga es el gzip (+2,7 %); en memoria el mar no carga hasta entrar en él.
- **Comprobado:** build; `test.js` 130 grupos (nuevo FN: esquema, mar, velocidades 80/110, mosaico, descubrimiento, guardado/hostil/futuro, embarque, rumbo, faros, mareas, eventos por hash sin gastar `est.rnd`, red v1/v2, validador); huellas 2D y clásico IGUALES; navegador `prueba_navegacion.py` (2D y clásico, 390×844) OK: 16,6 ms/fotograma, memoria JS 10–22 MB; `prueba_mapas_juego` OK con stub de cdnjs.
- **Defectos de la propia entrega corregidos:** el panel creaba su elemento en cada fotograma del arnés de huella (cambiaba los números de serie de los lienzos) → se crea solo al haber opciones.
- **Sin verificar / límites reales:** red real (PeerJS/Three.js no cargan en el entorno: solo se probó la lógica de los mensajes v1/v2); iPhone real; HD-2D en el mar (cae a 2D); cruce real por puertas tierra↔mar (no hay muelles: probado con los ganchos `puedeCruzar`/`alCruzar`); cliente v1 ve congelado al que navega.
- **Pendiente (reservado):** islas, muelles, astillero, carta marina, contenido de eventos; F8.

## v2.361 · FN · cierre de dos comprobaciones (red v1/v2 y cruce tierra↔mar) · 14 nov 2026
- **Red v1/v2:** el contrato exige que el código nuevo entienda v1 y v2 (estudio 10). Probado contra la `red.js` REAL de la v2.359 (`tools/fixtures/red_v1_v2359.js`): a pie el mensaje nuevo es byte a byte el v1; el antiguo acepta al nuevo y viceversa; navegando, el antiguo rechaza sin lanzar error ni desconectar y deja al jugador quieto. **No existe solución compatible** para mostrarlo a un v1: aunque se emitiera v1 sin barco, el antiguo no tiene los mapas de `pirata/` y lo rechaza (probado). Sin cambios de código; se documenta la garantía.
- **Cruce tierra↔mar:** nuevo `tools/prueba_cruce_mar.js` (también dentro de `test.js`): puertas reales sobre una copia temporal con un muelle de prueba; verifica avisos sin barco / barco lejos, embarcar («Subes al barco»), posición, 80 px/s, desembarcar («Amarras el barco») con el barco amarrado en la casilla de la puerta, regreso, ida y vuelta, estado del barco, guardado y azar intacto. Resultado: todo OK; **no se encontró ningún defecto en el código** (los dos fallos iniciales eran del guion: mantener la tecla pulsada hacía volver a cruzar la puerta, comportamiento correcto).
- `test.js`: 130 grupos OK (nuevas comprobaciones dentro del grupo FN). El juego (`src/`, `datos/`, `maps/`) no cambia; huellas iguales.
- **Siguen pendientes de comprobación FÍSICA:** la red real entre dos móviles (PeerJS/Three.js no cargan en el entorno) y el iPhone real (rendimiento y memoria del mar de 9 lienzos de 1024²).

## v2.362 · Multiverso F8 · Red, límites, portales y herramientas · 14 nov 2026
- **Red de poblaciones:** mensaje `agd` (anfitrión→invitado, una dimensión por envío), `ag` con `n` anti-obsoleto, `A.restaurarDim`. Contrato: `docs/multiverso/16_RED_LIMITES_F8.md`.
- **Límites:** población (`agentes.js LIM`) y guardado por sección `est.dim` (`guardado.js LIM`: 64 secciones / 600 KB / 1,4 MB; descartes anotados y texto original apartado en `criaturas_partida_exceso`).
- **Portales:** `red.cruceValido` en el anfitrión (puerta, distancia, ancla, marea); cruce inválido = ignorado y dimensión liberada.
- **Editor/herramientas:** el editor abre, edita, exporta idéntico y prueba mapas de `maps/<dim>/`; «Exportar» solo Tonavia. `componer_mapa --comprobar` en Carbuna arreglado (receta sin puertas + `\n` final).
- **Pruebas:** `test.js` (grupos F8 en el bloque F7 y propios), `tools/prueba_editor_dim.py`, `tools/prueba_red_agentes.py`; red en bucle local con PeerJS real (NO es internet ni dos móviles).
- **dist:** 2.362.059 → 2.373.473 B (+11.414); sin subir el límite (2.400.000). Coste medido en navegador: `valido` 0,02 ms, serializar 0,08 ms.
- **Siguen pendientes de comprobación física:** red real, CDN real, iPhone.


## v2.363 · Multiverso F8 (revisión) · límites escalables, requisitos de portal en el anfitrión, paquete de transferencia · 14 nov 2026
- **A · Límites por tipo** (`16_RED_LIMITES_F8.md` §2): población ≤ 128 entrenadores y `65.536 + 16.384·n` B; guardado por sección 1,5 MB de población + 250 KB de resto; 256 secciones; total 3,5 MB; escalones de escritura ante cuota de `localStorage` (primero poblaciones, nunca el progreso) con aviso; autoguardado adaptativo; presupuesto de red 16 KB/s con envío por turnos (la población más atrasada). Mensajes hasta 2,5 MB. Corrección: la cifra anterior «12 KB/población saturada» era falsa (real ≈ 0,5 KB/entrenador al nacer, ≈ 4,3 KB tras horas).
- **B · Requisitos de portal:** nivel, marca y casco ya NO se confían al móvil del jugador: cada móvil declara su progreso (`prg`, validado, monótono, acotado) y el anfitrión lo usa en `cruceValido` (`portales.comprobar(j,p,est,decl)`); sin declaración se cierra. **Limitación inevitable (a decidir por el usuario):** un cliente modificado puede declarar un progreso falso (P2P sin servidor; equivale a editar su propio guardado); el primer mensaje tras conectar se acepta; un móvil de la versión anterior no cruza portales con requisitos personales.
- **C · Paquete de transferencia:** `docs/multiverso/GUIA_CONTENIDO.md`; `plantillas/dimension/`, `tools/nueva_dimension.js`, `tools/prueba_dimension_nueva.js`; contrato por dimensión en `test.js` (aplica a toda dimensión nueva; `SIN_PORTAL=['pirata']`).
- **D · Verificación:** `test.js` 130 grupos OK; huellas 2D `9e6dc7f04c30c8bc9ccce694`/estado `190e210b78a572a8` y clásico `0627417447a15a67e0561620` IGUALES; validadores OK; 11 pruebas de navegador OK (CDN sustituido); red en bucle local OK (`prueba_red`, `prueba_red_agentes` incluye `prg` hasta el anfitrión). Reales: lo anterior. Simuladas: red local en bucle, CDN stub, CPU limitada como «móvil». Sin hacer: red real, cdnjs real, iPhone.
- **Rendimiento:** dist 2.382.604 B (límite de test 3.200.000, antes 2.400.000: margen para 3–4 dimensiones con mar; medido +46 KB por mar vacío). Arranque 782 ms (CPU ×1) / 1833 ms (×4), heap ≈ 10 MB. Guardado de 128 entrenadores (≈ 400 KB): escribir 0,5–3,8 ms, cargar 2,6–10 ms, stringify 1,7–12,7 ms (CPU ×1–×6).
- **Pendiente:** aprobación de F8; después Chuches → Pirata → Cerezo y crafteo; Santuario Multiversal. No se ha tocado `05_HOJA_DE_RUTA.md`.

- **Cierre de B (decisión del usuario):** riesgo residual ACEPTADO. Documentado en `16` §4: progreso declarado = no verificado; único uso = abrir/cerrar portal (test que lo vigila: solo `red.js`/`red_peer.js`, único consumidor `cruceValido`, no altera `est` ni el guardado); validaciones de puerta/posición/ancla/marea intactas; competición o anti-trampas exigirá arquitectura autoritativa.

## v2.364 · SANTUARIO UNIVERSAL · Etapa A (Fable) — 14 nov 2026
- Núcleo jugable: dimensión `santuario`, Umbral, hogar por jugador generado desde su id, residentes = ejemplares de la caja (solo asignación), comportamiento sin estado, panel de residentes, guardado. Contrato: `docs/multiverso/19_SANTUARIO_ETAPA_A.md`.
- Nuevos: `src/santuario.js`, `src/santuario_ui.js`, `datos/santuario.json`, `datos/dimensiones/santuario.json`, `maps/santuario/umbral.json`, `tools/prueba_santuario.js|.py`, `tools/validar_santuario.js`. Tocados: `src/orden.json`, `src/game.js` (4 enganches), `maps/nexus/plaza_cruce.json` (puerta), `test.js` (grupo 131 + arnés de portales), `GUIA_CONTENIDO.md`.
- Comprobado: build · test.js 131 grupos · huellas 2D/clásico/estado IGUALES · validar_dimension/mundo · componer_mapa · prueba_cruce_mar · prueba_santuario.js (64) · prueba_santuario.py (2D y clásico) · prueba_guardado/portales/entrenadores/agentes/navegacion.py. `mapas_juego/minimapa/tablon.py` dan el mismo resultado que en v2.363 (solo el error del CDN bloqueado). dist 2.431.572 B.
- NO comprobado: iPhone, red real entre dos móviles, HD-2D, pruebas de red en bucle local (no ejecutadas en esta entrega).
- La ficha 18 sigue con sus puntos [A] sin aprobar formalmente: (1) acceso por el Nexus y (2) nivel 8 están implementados tal cual; (3)-(6) no están implementados.

## v2.365 · SANTUARIO · Etapa B, bloque 1 (Fable) — 14 nov 2026
- Carácter por ejemplar, relaciones por convivencia, encuentros, ampliar con Brillos, elegir hábitat, mote en el rótulo, simulación de economía. Contrato: `docs/multiverso/20_SANTUARIO_ETAPA_B.md`.
- Tocados: `src/santuario.js`, `src/santuario_ui.js`, `datos/santuario.json`, `src/game.js` (rótulo: `c.nom || def.name`), `test.js`, `tools/prueba_santuario.js|.py`. Nuevo: `tools/economia_santuario.js`.
- Costes de ampliación: PROPUESTOS, sin aprobar. Aprobados: acceso por el Nexus y nivel 8.

## v2.366 · SANTUARIO · Etapa B, bloque 2 (Fable) — 15 nov 2026
- Entrenamiento por vivencias, dones de hábitat, actividades propias, instalaciones, panel de Brezo. Detalle, pendientes y no probado: `docs/multiverso/20_SANTUARIO_ETAPA_B.md` §3-5.
- Comprobado: test.js 131 · huellas iguales · prueba_santuario.js 135 · prueba_santuario.py (2D y clásico, dos pasadas) · guardado/portales/entrenadores/agentes/navegacion.py. dist 2.468.844 B.
- La Etapa B NO está cerrada.

## v2.367 · SANTUARIO · Etapa B, bloque 3 (Sonnet 5.5, MEDIUM) — 15 nov 2026
- **Aportes de otras dimensiones** (decisiones del usuario del 15 nov: costes de las cuatro instalaciones aprobados; Manantial sin cambios, solo cura a residentes; orden: aportes → personalización y decoración → interior de la cabaña → visitas de solo lectura). Estudio y contrato: `docs/multiverso/21_SANTUARIO_APORTES.md`.
- **Modelo:** un aporte = hábitat o instalación de `datos/santuario.json` con `origen` (dimensión instalada) y `req` (requisitos del catálogo de portales; al menos un hito de SU origen). Se pide solo al elegir/construir (nivel del Santuario + hito + Brillos + parcela o solar libre); lo construido nunca se pierde. Lateral, no vertical (no supera el máximo de su tipo). No hay estado nuevo.
- **Código:** `src/portales.js` (tipo personal `profundidad`, opción `validar(p, {local:true})`, `origenDe`), `src/santuario.js` (validador de aportes, `desbloqueo`, efecto `expedicion`, `bonoViaje`/`dondeDe`, `vista` con `origen` y `falta`), `src/santuario_ui.js` (los aportes pendientes se muestran una vez con su origen y lo que falta). **Datos:** `campamento` (clave 5): Campamento de expedición, origen `tonavia`, piso 10 de Profundidades, nivel 3, 60 combates (mín. 3.000 ✦, **coste propuesto, sin aprobar**), +50 % de vivencias llenadas con lo que se gana en las Profundidades; brasero y dos barriles sobre ceniza.
- **Hallazgos del estudio:** no existe contenido de Chuches/Pirata/Cerezo (solo hay un aporte vivo, el de Profundidades); los hábitats solo disponen de las 17 casillas, así que un hábitat nuevo se vería igual que uno existente → **no se añaden hábitats vivos** hasta que haya casillas u objetos propios (el validador ya los admite como aportes). El primer intento usaba un cartel que mostraba «Albanota»: se cambió por barriles (revisión visual).
- **Comprobado:** `node build.js` · `test.js` 131 grupos · huellas 2D (`9e6dc7f04c30c8bc9ccce694`), clásico (`0627417447a15a67e0561620`) y estado (`190e210b78a572a8`) IGUALES · `prueba_santuario.js` 164 (29 nuevas: validador de aportes, desbloqueo por nivel e hito, permanencia tras perder el hito, guardado, marca de dimensión, progreso declarado cerrado, expedición) · `prueba_santuario.py` (2D y clásico, nueva comprobación del panel) · `prueba_guardado/portales/entrenadores/agentes/navegacion.py` OK · `validar_santuario/mundo/dimension`, `prueba_cruce_mar`, `agentes_diag` OK. Capturas 390×844: `docs/santuario_v2367_*`. dist 2.468.844 → 2.475.270 B (límite 3.200.000).
- **Cambio de contrato en una prueba antigua, a propósito:** el catálogo de instalaciones pasa de 4 a 5.
- **No comprobado:** iPhone/Safari, red real y en bucle local, HD-2D, `mapas_juego/minimapa/tablon.py` (fallan por el CDN en este entorno, igual que antes), equilibrio con partidas reales (el +50 % es una propuesta).
- **La Etapa B NO está cerrada:** faltan personalización y decoración, interior de la cabaña y visitas de solo lectura (en ese orden).

## v2.368 · SANTUARIO · Etapa B, bloque 4: personalización y decoración (Sonnet 5.5, MEDIUM) — 15 nov 2026
- Bloque 3 (v2.367) aprobado; coste del Campamento aprobado con sus condiciones (doc 21).
- Nuevo: nombre del Santuario y decoración por huecos (plaza/borde) con 7 piezas, solo estéticas. Contrato en `docs/multiverso/22_SANTUARIO_DECORACION.md`.
- Órdenes nuevas `santuario.decorar` y `santuario.nombrar` (9 órdenes `santuario.*`; `test.js` actualizado a propósito).
- Verificado: prueba_santuario.js 190 comprobaciones, test.js 131 grupos, huellas 2D/clásico iguales, validar_santuario/mundo, pruebas de navegador (santuario, guardado, portales, entrenadores, agentes, navegación). Capturas `docs/santuario_v2368_*`; las antiguas intactas.
- Pendiente: aprobación de los costes de las piezas; bloques 5 (interior de la cabaña) y 6 (visitas de solo lectura).

## v2.369 · SANTUARIO · Etapa B, bloque 5: interior de la cabaña (Sonnet 5.5, MEDIUM) — 15 nov 2026
- Bloque 4 (v2.368) aprobado, con los siete costes de decoración tal cual (estética pura, retirada gratuita sin devolución).
- Nuevo: la cabaña del hogar se puede entrar (`santuario/cabana_<jugador>`, sala 11×8 `sala_cabana`). Lirio atiende el panel de Residentes; el estante (libro) y la vitrina (aportes) leen el estado; el panel funciona dentro; se sale siempre al hogar actual. No cura, no entrena, sin economía nueva. Contrato: `docs/multiverso/23_SANTUARIO_CABANA.md`.
- Toques fuera del módulo (mínimos): `game.js` (panel de `archivera` y lectura en `talk()`), `interiores_objetos.js` (sala), paleta del editor (plantilla) y recuento de la guía (78 objetos).
- Verificado: prueba_santuario.js 211, test.js 131 grupos, huellas 2D/clásico iguales, validar_santuario/mundo, pruebas de navegador (santuario 2D y clásico, guardado, portales, entrenadores, agentes, navegación, interior, interiores_piezas, editor, casas); minimapa igual que antes (solo falla la carga de fuentes externas sin red). Capturas `docs/santuario_v2369_*`; las antiguas intactas.
- Pendiente: bloque 6 (visitas de solo lectura); aprobación de dos decisiones menores (ver informe).

