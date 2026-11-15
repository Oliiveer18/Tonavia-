# SESION · v2.209 a v2.296 (archivado el 10 nov 2026)

## v2.209 · Documentos al día y archivo (LOW, solo documentos)
- Preparado el relevo a un chat nuevo para la **fauna marina de 5 en 5**. Nuevos: `docs/GUIA_PECES_A_MANO.md` (método, reglas de estilo, integración técnica y cierre de cada lote), `docs/FICHA_PECES.md` reescrita (Cirujano azul activo, 5 antiguos ocultos), `docs/CONTINUAR.md` y `docs/PROMPT_PARA_CONTINUAR.md` (prompt del chat nuevo) al día; `docs/ROADMAP.md` con el resumen v2.208 y la fauna marina como siguiente; `CLAUDE.md` y `LEEME.txt` apuntan a la guía.
- **Archivado (movido, no borrado) en `docs/archivo/`:** SESION v2.131-v2.179, estado del ROADMAP v2.127-v2.187, CONTINUAR v2.184, FICHA_PECES v2.191 (fórmula), PROMPT_PARA_CONTINUAR antiguo y 74 capturas que ya no cita ningún documento vivo (`docs/archivo/capturas/`).
- Comprobado: build, test.js (90 grupos), huella 2D. No se tocó código del juego.

## v2.211 · Fauna marina, lote 1, paso B (8 nov 2026)
- Dibujos aprobados por el usuario (`docs/lote1_revision2_*.png`) pasados a `src/peces.js`: **Dorada 17×12**, **Pez globo 14×14**, **Pulpo 15×15** (antes 18×14, 17×17 y 15×18; recortados a mano, sin escalar). Sardina 17×8, Payaso 16×10 y Cirujano 19×15 sin cambios. `forma.L/H` actualizados.
- La pose enganchada NO se toca: igual que el Cirujano (peces girados, colgados de la boca; Pulpo erguido). Verificado: `node build.js`, `node test.js` (90 grupos) y huella del juego igual. Sin pruebas de navegador (se hacen en los pasos C y D).

## v2.212 · Fauna marina, lote 1, paso C (2D) (8 nov 2026)
- Revisadas en el 2D a 390×844 (×2) las 6 criaturas activas: forcejeo (enganchada: peces girados y colgados de la boca, Pulpo erguido, sumergidas), salto, ficha de captura y colección 🐟 (`docs/lote1_2d_forcejeo.png`, `lote1_2d_salto.png`, `lote1_2d_coleccion.png`). Sin errores de consola. No hizo falta cambiar código: el pintor 2D (`dibujaPez`, `dibujaPezColgado`) y `peces_ui.js` ya dibujan los tamaños nuevos.
- Pendiente: paso D (HD-2D, mismas capturas con Three.js real), paso E (cierre y ZIP).

## v2.213 · Fauna marina, lote 1, paso D (HD-2D) (8 nov 2026)
- Revisadas en el HD-2D (Three.js real) a 390×844 (×2) las 6 criaturas en forcejeo (sumergidas, translúcidas bajo el agua) y salto (`docs/lote1_hd_forcejeo.png`, `lote1_hd_salto.png`). Láminas con la escala correcta por píxel (0,032 u): Dorada, Globo y Pulpo más pequeños que el Cirujano o igual de proporcionados; Pulpo erguido colgando del hilo. Sin errores de consola. Sin cambios de código.
- Pendiente: paso E (cierre, ZIP).

## v2.214 · Fauna marina, lote 1, paso E (cierre) (8 nov 2026)
- Cierre del lote 1: `ROADMAP.md`, `CONTINUAR.md`, `LEEME.txt` y `FICHA_PECES.md` al día. Verificación final: `node build.js`, `node test.js` (90 grupos), huella del juego igual, `prueba_pesca.py` en TODO BIEN, capturas 2D y HD-2D a 390×844 revisadas. Sin pruebas propias de guardado/red (las existentes pasan). ZIP: `criaturas_v2_214_fauna_lote1.zip`.

## v2.215 · Fauna marina, lote 2 (8 criaturas), paso B: datos y tests (8 nov 2026)
- Dibujos aprobados (`docs/bloque_final_8.png`, datos en `docs/bloque_final_8_sprites.json`) pasados a `src/peces.js`: **Morena 20×12**, **Pez espada 20×12**, **Pez loro 19×14**, **Mero 18×13**, **Raya 18×11**, **Pez ángel 16×17**, **Salmonete 18×11** y **Lubina 19×11**. Técnica nueva (curvas a alta resolución → bajada por votación → contorno → retoque a mano sobre rejilla), `tools/dibuja_peces_hires.py`.
- Zonas y pesos (probabilidad = peso / suma de la zona): **0 orilla** Sardina 40, Salmonete 20, Cirujano 22, Payaso 18, Pez ángel 10 · **1 media** Lubina 26, Dorada 30, Pez loro 20, Morena 14, Pez globo 14 · **2 honda** Mero 20, Pez espada 18, Raya 16, Pulpo 25. Forcejeo: 1 tirón (Salmonete, Ángel), 2 (Lubina, Loro, Morena), 3 (Espada, Mero, Raya), margen 0,55-0,4 s.
- Tests: especies (14 vivas + 5 ocultas), todas se sacan en su ritmo (`NU`, 13 criaturas); la prueba «silueta de tamaño distinto» pasa a «dibujo distinto» (Morena/Espada y Raya/Salmonete miden igual); el tope de tamaño de `dist/criaturas.html` sube de 1,10 a 1,15 MB (1,11 MB con los 8 dibujos).
- Verificado: `node build.js`, `node test.js` (90 grupos), huella del juego igual, `prueba_pesca.py`. Pendiente: pasos C (2D con capturas) y D (HD-2D) y E (cierre, ZIP). La pose enganchada es la del Cirujano (girados, de la boca).

## v2.216 · Fauna marina, lote 2, pasos C (2D) y D (HD-2D) (8 nov 2026)
- Revisadas a 390×844 (×2) las 8 criaturas nuevas en 2D y en HD-2D: forcejeo (enganchadas y sumergidas bajo la sombra), salto, ficha de captura y colección 🐟 (14 de 14) (`docs/lote2_2d_forcejeo.png`, `lote2_2d_salto.png`, `lote2_2d_coleccion.png`, `lote2_hd_forcejeo.png`, `lote2_hd_salto.png`). Sin errores de consola. Sin cambios de código: ambos pintores ya dibujan las láminas nuevas con la misma función que el Cirujano.
- Pendiente: paso E (cierre, ZIP).

## v2.217 · Fauna marina, lote 2, paso E (cierre) (8 nov 2026)
- Cierre del lote 2: `ROADMAP.md`, `CONTINUAR.md`, `LEEME.txt`, `FICHA_PECES.md` y `GUIA_PECES_A_MANO.md` (§5, técnica y estilo vigentes) al día. Verificación final: `node build.js`, `node test.js` (90 grupos), huella del juego igual, `prueba_pesca.py` en TODO BIEN, capturas 2D y HD-2D a 390×844 revisadas. ZIP: `criaturas_v2_217_fauna_lote2.zip`.

## v2.218 · Fauna marina, lote 3 (6 criaturas), paso B: datos y tests (8 nov 2026)
- Dibujos aprobados (`docs/lote3_final_6c.png`, datos en `docs/lote3_final_6_sprites.json`) pasados a `src/peces.js`: **Pez volador 19×11**, **Bagre 19×11**, **Pez león 19×15**, **Bacalao 19×12**, **Barracuda 20×10** y **Cazón 20×11**. Ya hay **20 criaturas vivas**. Contorno de 1 px (4 vecinos), relleno de colas y aletas dibujado ANTES del borde, nada pegado al borde del lienzo (se perdía el contorno).
- Zonas y pesos: **0 orilla** + Pez volador 14, Bagre 14 · **1 media** + Pez león 16, Bacalao 18 · **2 honda** + Barracuda 14, Cazón 12. Forcejeo: Pez volador 1 tirón; Bagre, Pez león, Bacalao 2; Barracuda y Cazón 3.
- Tests: 20 especies vivas + 5 ocultas; las 19 criaturas de `NU` se sacan en su ritmo. Verificado: `node build.js` (1,11 MB), `node test.js` (90 grupos), huella del juego igual, `prueba_pesca.py`. Pendiente: pasos C (2D) y D (HD-2D) con capturas, y E (cierre, ZIP).

## v2.219 · Fauna marina, lote 3, pasos C (2D) y D (HD-2D) (8 nov 2026)
- Revisadas a 390×844 (×2) las 6 criaturas nuevas en 2D y HD-2D: forcejeo (enganchadas y sumergidas), salto, ficha y colección 🐟 (`docs/lote3_2d_forcejeo.png`, `lote3_2d_salto.png`, `lote3_2d_coleccion.png`, `lote3_hd_forcejeo.png`, `lote3_hd_salto.png`). Sin errores de consola. Sin cambios de código (mismos pintores que el Cirujano).
- Pendiente: paso E (cierre, ZIP).

## v2.220 · Fauna marina, lote 3, paso E (cierre) (8 nov 2026)
- Cierre de la fauna marina (20 criaturas vivas): `ROADMAP.md`, `CONTINUAR.md`, `LEEME.txt`, `FICHA_PECES.md` y `GUIA_PECES_A_MANO.md` (§6, contorno y relleno) al día. Verificación final: `node build.js`, `node test.js` (90 grupos), huella del juego igual, `prueba_pesca.py` en TODO BIEN, capturas 2D y HD-2D revisadas. ZIP: `criaturas_v2_220_fauna_completa.zip`.
- (8 nov 2026) Decisión de diseño anotada: Albanota solo ofrece las zonas 0 y 1 (los puentes caen en zona 1, comprobado); la zona 2 se reserva a propósito para mapas futuros. Sin cambios de código.

## v2.221 · Pesca: un pique sin tocar recoge la caña (8 nov 2026)
- Pedido del usuario: si salta el «!» y no se toca, la caña no debe quedarse eternamente en el agua relanzándose sola. Ahora, si se pasa la ventana del pique sin tirar (`fase 'fallo'` con `sinToque`), tras el fallo (0,9 s) se recoge el hilo (`j.pesca = null`, aviso «Recoges el hilo: vuelve a lanzar») y hay que pulsar 🎣 para lanzar otra vez. No cambia: tirar antes de tiempo, soltarse en el forcejeo y el salto siguen relanzando solos (el jugador estaba atento).
- `src/motor.js` (`pescando`, estado serializable en `j.pesca`, determinista). Test nuevo (v2.221) y `corre` del test v2.181 tolera `j.pesca` nulo. Verificado: `node build.js`, `node test.js` (90 grupos), huella igual, `prueba_pesca.py` y comprobación en navegador (pique sin tocar → «fallo» → pesca nula y botón 🎣 → al pulsar vuelve a «lanzar», sin errores).

## v2.222 · Pesca: tras un pique sin tocar la caña se queda en la mano, visible (8 nov 2026)
- Corrige la v2.221 (que la hacía desaparecer). Ahora, tras «Se escapó», el hilo se recoge pero la caña SIGUE en la mano, visible y levantada, con el corcho recogido (fase nueva `listo` de `j.pesca`; `src/motor.js`, `src/vista.js`: `s = 0`, brazo levantado). No relanza sola: hay que pulsar 🎣 (entonces vuelve a `lanzar`). Caminar sigue cancelando la pesca. Tirar antes de tiempo, soltarse en el forcejeo y el salto siguen relanzando solos.
- Tests v2.222 (fase `listo`, no avanza sola, se vuelve a lanzar al pulsar). Verificado: `node build.js`, `node test.js` (90 grupos), huella igual, `prueba_pesca.py`, y en navegador 2D y HD-2D (`docs/pesca_listo_2d_hd.png`): lanzada → pique sin tocar → `listo` (caña visible, sin hilo en el agua) → 🎣 → `lanzar`, sin errores. Sin tocar los dibujos del HD-2D.

## v2.223 · Documentos al día y archivo (LOW, solo documentos) (8 nov 2026)
- **ROADMAP limpiado y reescrito** (`docs/ROADMAP.md`): dónde estamos (v2.222), lo que queda dividido en LOW y MEDIUM, pendientes del usuario, principios, resumen de lo hecho por fases, Fase 8, decisiones (12 y 13 nuevas: fauna marina y caña) y reglas. La versión completa anterior (tablas por fase y entradas v2.188-v2.208) está en `docs/archivo/ROADMAP_completo_hasta_v2_222.md`.
- **Al día:** `CONTINUAR.md`, `PROMPT_PARA_CONTINUAR.md` (ahora genérico; siguiente paso recomendado: 1.6 combate), `LEEME.txt` (v2.222, 90 grupos, documentos y herramientas nuevas), `FICHA_PECES.md` (las 20 criaturas con zona, probabilidad, kg, forcejeo y tamaño, generada desde `src/peces.js`) y `GUIA_PECES_A_MANO.md` (decisión «solo peces de caña», técnica del §5).
- **Archivado (movido, no borrado):** SESION v2.180-v2.208 → `docs/archivo/SESION_v2_180_a_v2_208.md`; CONTINUAR y PROMPT anteriores → `docs/archivo/`; 50 imágenes intermedias → `docs/archivo/capturas/fauna_marina_propuestas/` (38; con `LEEME.txt`) y `docs/archivo/capturas/pesca_v2_180_a_v2_208/` (12). En `docs/` quedan solo las imágenes aprobadas y las capturas de cada lote.
- Solo se tocaron dos comentarios de `src/peces.js` (rutas de imágenes archivadas). Comprobado: build, test.js (90 grupos), huella 2D.

## v2.224 · Prototipo 3D por extrusión de vóxeles, Nimbel y Arenel (LOW, solo prototipo; no toca el juego) (9 nov 2026)
- Prueba del «método B» (convertir el dibujo 2D en volumen sin modelar a mano): intersección de las siluetas de frente y de lado, con perfil redondeado, y colores recortados de los sprites reales (`G.creatureSprite`). Herramientas: `tools/prototipo_voxel_volcar.py` (saca los sprites con Playwright) y `tools/prototipo_voxel.py` (render con 5 vistas). Resultado: `docs/prototipo_voxel_nimbel_arenel.png`.
- Veredicto: da volumen automático, pero la cara se estira, el contorno queda ruidoso y se pierden las piezas finas (ojos en pedúnculo, pinzas, patas de Arenel). No sirve tal cual para criaturas protagonistas; pendiente que el usuario decida (ver respuesta de la sesión). Nada de `src/` ni `test.js` cambió.

## v2.225 · Registro de criaturas 3D (paso 1 de Nimbel y Arenel 3D, MEDIUM) (9 nov 2026)
- Decidido el modelado a mano (la extrusión de vóxeles de la v2.224 no sirve para criaturas protagonistas). Plan: 1 registro (esto) · 2 ficha única y hoja de vistas de Nimbel y Arenel (LOW) · 3 Nimbel · 4 Arenel (si es largo, en dos sesiones) · 5 integración, tests y capturas (LOW).
- `src/criatura3d.js`: `registrar(id, fábrica)`, `ids()`, `PLANEADAS` (`nubecin`, `arenel`; siguen en 2D) y `de(id)` busca en el registro. Zefirax es la primera entrada, con `chispas` como parte opcional de su módulo.
- `src/hd2d_pintor.js`: ya no nombra a Zefirax; `AJUSTE_3D` solo tiene personajes y las criaturas usan `ajuste3d(k)` → `CRIATURAS3D`. Las chispas solo las pone quien las tiene.
- Tests v2.225 (registro, validación, geometría/atlas/chispas de Zefirax idénticos por hash al estado anterior) y el test fijado de v2.130 actualizado. Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual, `prueba_hd2d_juego.py` (Three falso). NO verificado: captura de Zefirax con Three.js real (no hay Three.js aquí); sí queda probado que su geometría es idéntica.

## v2.226 · Ficha y hoja de vistas de Nimbel y Arenel 3D (paso 2, LOW; solo documentos e imagen) (9 nov 2026)
- `docs/FICHA_NIMBEL_ARENEL_3D.md` y `docs/nimbel_arenel3d_hoja_de_vistas.png` (sprites reales + alzados y planta propuestos; `tools/hoja_vistas_nimbel_arenel.py`). Presupuesto ≈ 190 (Nimbel) y ≈ 230 (Arenel) triángulos. Pendiente de aprobación del usuario; no se tocó `src/`.
- Nota para el paso 5: el pintor solo muestra una malla 3D por tipo de criatura a la vez (`vistos[k]`).

## v2.227 · Modelado por piezas fiel al 2D, Nimbel y Arenel (MEDIUM, solo imágenes y herramienta; no toca el juego) (9 nov 2026)
- El usuario descartó el diseño de bultos/elipsoides de la v2.226 (poco coherente con el 2D) y prefería la extrusión de la v2.224. Nuevo método: cada parte del sprite (Arenel: cuerpo, tapón, ojos, pinzas, patas; Nimbel: cuerpo y gotas) es una pieza extruida con su fondo y posición; cara frontal = sprite exacto, espalda = sprite de la espalda, laterales con el color sin contorno.
- Cuatro variantes de perfil, para elegir: A bloque biselado · B relieve (trasera redondeada) · C medallón · D cúpula (fondo que crece desde el borde). Triángulos tras fusionar caras: Nimbel A 392 · B 378 · C 560 · D 504; Arenel A 440 · B 374 · C 404 · D 372 (presupuesto propuesto ≤ 1200).
- **Corrección (revisión del usuario: perfil, planta y espalda no eran consistentes):** (1) la cámara de la herramienta miraba desde ABAJO (signo del cabeceo invertido): las vistas «3/4» y «planta» enseñaban la parte inferior; ahora cabeceo negativo (se ve desde arriba); (2) los laterales salían de colores del frente, ahora se muestrean de los sprites 2D reales de perfil (izquierdo/derecho) y la espalda de la espalda 2D a luz plena; (3) el fondo de cada pieza sale de la silueta del perfil 2D (Nimbel por filas; Arenel: cuerpo, tapón, ojos, pinzas y patas ajustados a las columnas del perfil). Las hojas llevan las tres referencias 2D (frente, perfil, espalda) al lado. Triángulos (A,B,C,D): Nimbel 460·482·670·600; Arenel 476·414·398·414.
- `docs/nimbel3d_propuestas_por_piezas.png`, `docs/arenel3d_propuestas_por_piezas.png`, `tools/prototipo_piezas_nimbel_arenel.py`. La primera hoja se movió a `docs/archivo/capturas/`. Ficha marcada como descartada en §1-§2. No se tocó `src/`. Pendiente de elección del usuario; si no convence, se descarta el 3D por modelado para estas criaturas.

## v2.228 · Modelos 3D a mano de Nimbel y Arenel, con renders reales (MEDIUM, paso 1 del plan; AÚN FUERA DEL JUEGO) (9 nov 2026)
- Decidido por el usuario: la idea 2 (modelado a mano), «bien hecha». La hoja de la v2.226 era un plano esquemático; ahora hay modelo real y render del modelo. Nimbel ya no son bolas: UNA masa por cortes horizontales (ancho del frente, fondo del perfil, superelipse con 5 bultos en el contorno) más 2 gotas. Arenel: concha, tapón, 2 ojos con pedúnculo, 2 pinzas y 8 patas como piezas biseladas.
- `tools/modelo3d_nimbel_arenel.js` (módulo puro; medidas tomadas de los sprites 2D con contorno): Nimbel 208 quads = 416 triángulos · Arenel 414 quads = 828 (presupuesto ≤ 1200). `tools/render_modelo3d.py` (render con z-buffer; textura PROYECTADA de los sprites 2D de frente, perfil y espalda, sin su contorno; luz y tonos equivalentes a los del juego). `docs/nimbel3d_modelo_a_mano.png`, `docs/arenel3d_modelo_a_mano.png`.
- Valoración: Arenel se lee muy bien; Nimbel parece una cúpula/seta algo lisa (pendiente de decisión del usuario). No se tocó `src/`: `de('nubecin')` y `de('arenel')` siguen devolviendo null. Test nuevo v2.228 (pureza, geometría finita, presupuesto, medidas). Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual. No verificado: Three.js real, luz y sombras del juego.

## v2.228b · Retoque de los modelos 3D de Nimbel y Arenel (ojos y acarapacho) (MEDIUM; sigue FUERA DEL JUEGO) (9 nov 2026)
- Pedido del usuario: problemas en los ojos de los dos y el acarapacho de Arenel demasiado pequeño. Cambios en `tools/modelo3d_nimbel_arenel.js`: (1) los rasgos ya no se proyectan del sprite sobre la superficie curva (salían rotos): Nimbel lleva ojos (3 px inclinados), boca y mofletes como decales planos pegados a la superficie del frente; Arenel lleva ojos ESFÉRICOS blancos con pupila oscura y brillo sobre pedúnculos, y la boca como decal; (2) acarapacho (tapón azul) de Arenel agrandado a ≈ 10 px de ancho y fondo (filas 1,5-9,5), como en la espalda y el perfil del 2D, con aro claro arriba; (3) Nimbel: contorno más abultado y arriba más ancho; (4) pinzas, pedúnculos y patas con color liso (sin sprite proyectado). Render: la tinta del 2D ya no se proyecta (error corregido: se propagaba la tinta entre píxeles vecinos).
- Triángulos: Nimbel 534 · Arenel 978 (máx. 1200). Test v2.228 actualizado. Verificado: build, `node test.js` (90 grupos), huella 2D igual. Sin Three.js real. `src/` sin cambios.

## v2.229 · Nimbel y Arenel 3D en el juego (MEDIUM) (9 nov 2026)
- Aprobados por el usuario los modelos a mano (v2.228). Integrados con el interruptor común `CRIATURAS3D`: `src/criatura3d_modelos.js` (módulo puro; `MODELOS` → registro de la v2.225), `src/criatura3d_sprites.js` (texturas GENERADAS de los sprites 2D por `tools/generar_sprites3d.py`; `--comprobar` verifica que están al día), `src/orden.json` (datos y juego). `tools/modelo3d_nimbel_arenel.js` ahora vuelca los modelos del propio módulo y `tools/render_modelo3d.py` los renderiza (revisión).
- Pintor (`src/hd2d_pintor.js`, 2 cambios mínimos): `pose(..., c.moving)` y brillo continuo `q.k` cuando el módulo lo da. Zefirax sin cambios.
- Animación: Nimbel respira (escala vertical ±3,5 %); Arenel mueve las patas al andar y sube/baja los ojos parado.
- Tests v2.229 (puro, orden de carga, interfaz y presupuesto, topología constante, geometría y normales, orientación de caras, UV y atlas, tamaño y apoyo en suelo, animación, texturas completas, pintor) y `tools/prueba_criaturas3d.py` (Three falso: el pintor crea la malla de Nimbel y de Arenel, no se desactiva solo, apagar el interruptor vuelve la lámina). Verificado: `node build.js` (1,138 MB), `node test.js` (90 grupos), huella 2D igual, `prueba_criaturas3d.py`, `prueba_hd2d_juego.py`, `prueba_galeria.py`, `prueba_pesca.py`.
- NO verificado: Three.js real, luz/sombras/HD-2D reales en móvil. Límite conocido: una malla 3D por tipo a la vez (ver `docs/GUIA_MODELADO_3D.md` §6).
- **Nueva guía `docs/GUIA_MODELADO_3D.md`**: método, convenciones, lo que funcionó, lo que falló (con causa y regla) y checklist para las próximas criaturas.

## v2.230 · Revisar Arenel 3D en el juego: criaturas «fijas» (LOW; no cambia el juego normal) (9 nov 2026)
- El usuario no veía a Arenel en su partida (sale al azar en el claro de Roca, junto al laboratorio, y en una partida guardada el plan ya está creado). Comprobado con Three.js real r128 (descargado de cdnjs a la carpeta temporal, no al proyecto): Arenel SÍ se dibuja en 3D, 978 triángulos, sin errores.
- `AJUSTES.FIJAS` en `src/aparicion.js` (`[]` de fábrica): `ap.fijar(em, m)` garantiza, en cada llamada de `actualizar`, un hueco de cada línea listada en la zona de su elemento (usa un hueco sin criatura viva, sin gastar azar: el resto del plan no cambia; también en partidas guardadas). `src/game.js`: el enlace con `#arenel`, `#nimbel` o `#3d` los activa. En el artefacto publicado se activó `['arenel']` solo en su copia.
- Test v2.230 (FIJAS vacío de fábrica; con `['arenel']` hay hueco de Arenel en la zona de Roca; el plan sin FIJAS no cambia). Verificado: build, `node test.js` (90 grupos), huella 2D igual, navegador con Three real (`#arenel`: Arenel en (19,27), junto al laboratorio).
- Observación: desde la cámara cenital del HD-2D se ve sobre todo el acarapacho; si no convence, mejorar su lectura es trabajo MEDIUM aparte.

## v2.231 · Arenel 3D: ojos menos saltones (MEDIUM) (9 nov 2026)
- Pedido del usuario tras verlo en el HD-2D: los ojos estaban «un poco para afuera, demasiado grandes y saltones». Cambio en `src/criatura3d_modelos.js`: esfera de radio 2,4 → 1,9 px y aplastada en z (×0,8); más juntos al acarapacho (x 3/13 → 3,7/12,3) y menos adelantados (z 3,0 → 3,9 columnas); pupila 1,25 → 0,95 px; pedúnculo más corto (3,0 → 2,0 px). Misma topología (978 triángulos). Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual y captura con Three.js real (`#arenel`) sin errores.

## v2.232 · Arenel 3D: brillo más profesional (MEDIUM) (9 nov 2026)
- Pedido del usuario: bajar el brillo del acarapacho (arriba y en la capa justo inferior, ambas casi blancas). Causas encontradas: (1) las caras con textura salían ×1,12 más claras que las de color liso (el material multiplica por BRILLO y las lisas ya lo compensaban): la parte de arriba (color liso `#d3deef` a brillo 1,0) y los laterales con textura no coincidían y se quemaban; (2) el aro del acarapacho es casi blanco en el 2D; (3) la banda blanca de abajo era el BLANCO DE LOS OJOS del sprite de frente (tapa el acarapacho en el 2D) proyectado sobre el acarapacho 3D.
- Arreglos: `luzK` pasa a ser brillo NETO (frente 1,0 · oeste ≈ 1,0 · este ≈ 0,74 · espalda ≈ 0,76 · arriba ≈ 0,94); en las caras con textura se divide por BRILLO (`q.k = net/BRILLO`), así texturizadas y lisas coinciden. Aro de arriba `#d3deef` → `#a9c1e6` (modelo y textura). `tools/generar_sprites3d.py`: `COLOR_3D` (remapeo de color solo para el 3D) y `QUITAR_3D` (el blanco de los ojos se trata como tinta y se rellena con el color del vecino). Afecta también a Nimbel (arriba menos quemado). `tools/render_modelo3d.py` usa la misma fórmula.
- Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual, `generar_sprites3d.py --comprobar`, `prueba_criaturas3d.py`; captura con Three.js real en `docs/arenel3d_brillo_antes_despues.png`.

## v2.233 · Arenel 3D: acarapacho con cúpula y degradados (MEDIUM) (9 nov 2026)
- Pedido del usuario: la parte de arriba del acarapacho era plana y no convencía; quería degradado de color en lugar de cambios bruscos. Cambios en `src/criatura3d_modelos.js`: (1) la tapa plana pasa a CÚPULA (4 anillos de 0,3 a 2,0 px de altura con el radio bajando hasta un punto); (2) degradado de COLOR por vértice en la cúpula (borde azul `#3f7fd6` → centro azul claro `#8fb0e6`, con suavizado); (3) degradado VERTICAL de brillo por vértice en los laterales con textura (×0,84 abajo → ×1,0 arriba). Estructura nueva del módulo: `q.cv` (colores por vértice, caras lisas) y `q.kg` (posición 0-1 para el brillo por vértice, caras con textura) → `poligono.cvs` / `poligono.kv`.
- Pintor (`src/hd2d_pintor.js`): usa `q.kv` y `q.cvs` por vértice cuando existen (mismo bucle; el resto de criaturas no cambia). Render de revisión (`tools/render_modelo3d.py`) interpola ambos. Triángulos de Arenel: 1026 (máx. 1200).
- Test v2.233 (caras con degradado de color y de brillo, valores válidos). Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual, `prueba_criaturas3d.py`.

## v2.234 · Arenel 3D: último retoque de acarapacho y ojos (MEDIUM) (9 nov 2026)
- Pedido del usuario («la parte del corazón», interpretado como el CARAPACHO/acarapacho, y los ojos; último retoque). (1) Acarapacho consistente con el 2D: la cúpula lleva nervios (sectores alternos `#3a74cc` / `#4a8ae0` que se funden hacia el centro `#8fb0e6`), como las estrías verticales del tapón del dibujo, y continúan las franjas de los laterales. (2) Ojos más separados y más parecidos al 2D: centros en x = 3 y 13 (10 px entre ellos, como el dibujo; antes 8,6), pupila = ranura vertical oscura (0,55 × 1,5 px) entre dos franjas blancas (el 2D es «blanco-tinta-blanco»), sin el brillo que el 2D no tiene.
- Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual; captura con Three.js real. Si «corazón» no era el acarapacho, indicar cuál es la parte.

## v2.236 · Arenel 3D: el acarapacho se queda atrás y sin píxeles de más (MEDIUM) (9 nov 2026)
- Aclaración del usuario: no eran los lados izquierdo/derecho (la v2.235, que estrechaba el acarapacho, se REVIERTE), sino los de delante/detrás: el acarapacho debe quedar en la parte de atrás y había «píxeles de más» (azules sobre el cuerpo y sobre su cara). Causas: (1) el acarapacho llegaba 1 px más adelante que en el perfil 2D (ahora fondo 9 px, z de +3,5 a −5,5, pegado atrás); (2) la textura del cuerpo llevaba los azules del tapón (en el 2D lo tapa) y la del tapón llevaba píxeles de arena, naranja y rojo.
- Arreglo: `tools/generar_sprites3d.py` (`TAPON_3D`) genera dos juegos de texturas para Arenel: del CUERPO (sin ningún azul del tapón) y del TAPÓN (solo sus azules, el resto relleno con el azul más cercano); vistas `f b l r` y `ft bt lt rt`. `src/criatura3d_modelos.js` usa `…t` en las caras de la pieza `tapon`. `tools/render_modelo3d.py` lee ahora las MISMAS texturas del juego (`src/criatura3d_sprites.js`). Lección anotada en `docs/GUIA_MODELADO_3D.md`.
- Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual, `generar_sprites3d.py --comprobar`. Sin captura con Three real todavía.

## v2.237 · Criaturas 3D siempre visibles en el pueblo del artefacto (LOW; sin cambios en el juego) (9 nov 2026)
- Norma del usuario: toda criatura 3D nueva se deja visible en el pueblo para revisarla. Forma mínima, sin tocar el juego: al publicar el artefacto, en SU copia se pone `FIJAS: ['arenel', 'nubecin', …]` (todas las que tengan modelo 3D, menos legendarias, que ya tienen guarida; Zefirax está en su guarida (21, 3)). El código del juego queda con `FIJAS: []` y las huellas 2D originales (`91ad3494…` y `3ac35a05…`).
- Un intento de poner `FIJAS` en «auto» dentro del juego cambió la huella y un test; se REVIRTIÓ por completo (huellas reescritas a sus valores anteriores, 90 grupos en orden). Para la próxima criatura 3D: añadir su id a esa lista al publicar.


## v2.238 · Ficha y medidas de Somnel 3D (paso 1, LOW; solo documentos e imagen) (9 nov 2026)
- `docs/FICHA_SOMNEL_3D.md`, `docs/somnel3d_medidas.png` y `docs/somnel_2d_referencia.png`. Decisión del usuario: la estrella ✦ es una pieza 3D flotante a su lado. Presupuesto ≈ 780 triángulos. Somnaris (la evolución) queda fuera. No se tocó `src/`. Pendiente de aprobación; siguiente: paso 2 (MEDIUM, modelo y render).

## v2.239 · Somnel 3D: modelo y render (paso 2, MEDIUM; registrado pero aún no revisado en el juego) (9 nov 2026)
- Ficha aprobada (estrella flotante a su lado). `src/criatura3d_modelos.js`: `somnel()` (cuerpo por cortes con textura propia de las filas 10-16; gorro cónico caído hacia atrás con banda y borla; ojos cerrados como decales; 4 patas; estrella ✦ en cruz flotante que gira; motita) y `animaSomnel` (respira despacio, borla que se balancea, patas al andar, estrella que flota y gira). `tools/generar_sprites3d.py`: `FILAS_3D` (textura solo de un rango de filas; fuera de él se repite la fila del borde) y `QUITAR_3D['somnin']`; 16 pasadas de relleno en lugar de 8. `tools/render_modelo3d.py` ya renderiza Somnel (tercer argumento).
- Tests actualizados (3 criaturas registradas, texturas de las 3). Render: `docs/somnel3d_modelo_a_mano.png`. ≈ 840 triángulos. Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual, `generar_sprites3d.py --comprobar`. NO hecho (paso 3): prueba de navegador con Three real, captura en el juego, ZIP final y artefacto.
- **Aviso de tamaño:** `dist/criaturas.html` pesa 1.149.334 bytes; el tope del test es 1.150.000. La próxima criatura 3D lo superará: hay que reducir (p. ej. texturas sin sangrado en `criatura3d_sprites.js`) o subir el tope con tu visto bueno.

## v2.240-v2.244 · Somnel 3D en el juego y las ideas visuales de pokesurvivor.com (MEDIUM, en una sola tanda por petición del usuario) (9 nov 2026)
Orden hecho: **0 · espacio** → **3 · Somnel** → **6 · menús** → **1 · suelo** → **2 · rocas y hierba alta** → **5 · día y noche**. Ideas sacadas de pokesurvivor.com (juego 2D de otra empresa; solo inspiración, nada copiado).
- **0 (v2.240):** `criatura3d_sprites.js` sale compacto (JSON sin sangrado; 8,0 → 6,4 KB) y el tope de tamaño de `dist` pasa de 1,15 a **1,30 MB** (`test.js`; `dist` ≈ 1,16 MB).
- **3 · Somnel 3D (v2.240):** `prueba_criaturas3d.py` incluye `somnin` (876 triángulos) y pasa con Three.js real (sin errores; se apaga con `CRIATURAS3D`). En la cámara cenital se ve sobre todo el gorro, la borla, la estrella y la motita (`docs/somnel3d_en_juego.png`). En el artefacto se publica con `FIJAS` (copia del scratchpad).
- **6 · Menús limpios (v2.241):** solo CSS en `index.html` (paneles azul oscuro con borde claro y sombra, títulos con sombra, botones rotundos, clase `.barra` reutilizable). Se evitó `text-transform: uppercase` (rompía `innerText` en `prueba_galeria.py`). `docs/menus_nuevos.png`.
- **1 · Suelo (v2.242):** hierba con **grano fino** (9 puntos de 1 px en dos tonos) y florecitas sueltas (1 de cada 7 casillas) y **caminos con borde suave** (puntos que se deshacen hacia dentro y la tierra que entra en la hierba), en los dos pintores: `src/sombreado.js` (HD-2D y 2D no clásico) y `src/clasico2d.js` (2D por defecto; cambia a propósito los tests «v2.170 hierba lisa» → «v2.242 grano fino»). Error encontrado: `>>` con enteros sin signo daba posiciones negativas y escribía fuera de la casilla; se usa `>>>`. Las casillas con mata o flores no llevan grano (las dibuja otra capa y debe coincidir píxel a píxel).
- **2 · Rocas, piedras y hierba alta (v2.243):** tres piezas nuevas en `src/albanota_objetos.js` (`roca` 1 casilla sólida, `piedras`, `hierba_alta`; las dos últimas se pisan), añadidas al editor (grupo «Naturaleza») y 34 objetos en `maps/albanota.json` (89 → 88 tras quitar tres que pisaban la ermita o el huerto). En el HD-2D salen como láminas de pie con sombra proyectada (como el barril); **su volumen 3D propio queda PENDIENTE** (anotado en el ROADMAP). Tests con cifras fijas actualizados (57 → 88 objetos, 25 → 28 piezas, 55 → 86 normales).
- **5 · Día y noche (v2.244):** `src/ciclo.js` (puro; sin estado propio: depende de `est.reloj`; 10 min por día, empieza por la mañana). Un velo `#noche` con mezcla «multiplicar» sobre el juego, igual en el 2D y en el HD-2D; las farolas del HD-2D se encienden con `noche` (`luz_farolas.js`). Interruptores: `?ciclo=0`, y `#dia`, `#atardecer`, `#noche` en la dirección fijan la hora. Pendiente: guardar la hora en la partida (hoy `est.reloj` no se guarda y el día vuelve a empezar al cargar).
- **Huellas:** la normal y la clásica se reescribieron a propósito (cambian los objetos del mapa): `64e9b852…` y `ac604d36…`. Tests: 90 grupos en orden.

- Pruebas de navegador al día con las cifras nuevas (`prueba_editor.py` y `prueba_mapas_juego.py`: 88 objetos y grupo «Naturaleza»). Verificación final: build, `node test.js` (90 grupos), las dos huellas, `generar_sprites3d.py --comprobar`, y `prueba_galeria`, `prueba_pesca`, `prueba_editor`, `prueba_mapas_juego`, `prueba_hd2d_juego` (Three falso) y `prueba_criaturas3d` (Three real) en TODO BIEN. Captura HD-2D de noche con Three real sin errores y con las farolas encendidas (`docs/ciclo_dia_noche_2d.png`).

## v2.245 · Correcciones del usuario: hierba en el laboratorio y el huerto, caminos y lista de decoraciones (MEDIUM) (9 nov 2026)
- **Hierba sobre edificios y huerto:** las matas y piedras que puse se pintaban DELANTE de la fachada del laboratorio y pegadas al huerto, la tienda, el Centro PC y las vallas (se ordenan por los pies). Se quitaron 13 (88 → 75 objetos) y se añadió un test permanente (v2.245): la decoración de naturaleza solo sobre hierba lisa y sin solaparse con el dibujo de ningún otro objeto (+8 px de margen a los grandes). Norma anotada en `CLAUDE.md`. Se reescribieron las huellas (`64e9b852…` normal, `c82c9b99…` clásica) y las cifras de las pruebas del editor.
- **Caminos:** el borde pasa de puntos al azar a un **tramado ordenado** (paridad según la posición en el mundo, continuo entre casillas): línea, tablero, filas alternas y puntos esporádicos; en el camino y en la hierba, en `src/sombreado.js` y `src/clasico2d.js`.
- **Lista de decoraciones 3D:** `docs/LISTA_DECORACIONES_3D.md` (38 piezas exteriores, 29 objetos y 6 salas interiores, estado, esfuerzo y orden de lotes).

## v2.246 · Registro de objetos 3D de decoración + primera pieza (la roca) (MEDIUM) (9 nov 2026)
- `src/objeto3d.js` (puro): `G.objeto3d.registrar/tipos/de` y las piezas con modelo; reutiliza `fabrica` y los constructores `B` de `src/criatura3d_modelos.js` (ahora exportados) y la textura proyectada del dibujo 2D (`tools/generar_sprites3d.py`, nuevo `OBJ_IDS`, solo vista «f»; en `uvPoligono` las demás caras usan esa textura). La **roca** (378 triángulos las 3; 126 cada una): masa de 6 cortes y 9 lados con bultos suaves.
- Pintor HD-2D (`src/hd2d_pintor.js`): modo `'modelo'` en `plan()` para los tipos registrados (con interruptor `AJUSTES.OBJETOS3D`), `modeloObj(tipo)` (una geometría y un material por tipo, `E.mod3d`), una malla por ejemplar con giro 0/90/180/270° según su casilla y sombra de contacto; si algo falla, esa pieza vuelve a lámina. El resto de piezas no cambia.
- Tests v2.246 (puro, orden de carga, registro, roca determinista y dentro de su casilla, atlas y UV, pintor) y `tools/prueba_objetos3d.py`. Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual, prueba con Three falso (3 de 3 rocas, sin errores).
- Siguiente (docs/LISTA_DECORACIONES_3D.md): lote 1 — piedras, hierba alta, barril y cartel.

## v2.247 · Decoración 3D, lote 1: piedras, hierba alta, barril y cartel (MEDIUM) (9 nov 2026)
- Roca aceptada visualmente por el usuario. Cuatro piezas más en `src/objeto3d.js`: **piedras** (dos piedras pequeñas con la textura de la roca), **hierba alta** (siete hojas afiladas e inclinadas sobre un montículo, SIN textura: color por vértice del pie oscuro a la punta clara), **barril** (cuerpo de 10 lados con panza; textura del 2D y tapa azul) y **cartel** (poste y dos tablones con su textura y dos placas de color). `fabrica` admite `cfg.sinTextura` (piezas solo de colores, sin sprite). `tools/generar_sprites3d.py`: `OBJ_IDS` con piedras, barril y cartel.
- Verificado: `node build.js`, `node test.js` (90 grupos) y una captura con Three real en el HD-2D (`docs/lote1_objetos3d.png`). Sin más pruebas por indicación del usuario.

## v2.248 · Cartel con el nombre del pueblo y hierba alta rehecha (MEDIUM) (9 nov 2026)
- **Cartel:** el 2D pasa a 56×40 px con un letrero grande con el nombre del mapa («Albanota», `G.MAPAS.albanota.nombre`, letra de píxel de `src/font.js`) y una flecha azul. En el 3D, poste y tablones de madera lisa y, delante, dos paneles con la textura del 2D (por detrás es madera lisa); no gira (`cfg.fijo`: mira siempre al sur). El generador conserva la tinta oscura del cartel (`CONSERVAR_TINTA`: sin ella las letras se deshacían). Lección: el generador lee `dist/criaturas.html` → hay que hacer `node build.js`, luego `tools/generar_sprites3d.py` y otra vez `node build.js` si cambia un dibujo 2D. Otro fallo propio: un comentario `//` metido en medio de una línea se tragó `E.scene.add(mesh)` (todas las piezas 3D desaparecieron en una captura).
- **Hierba alta rehecha** (parecía «un juguete»): ahora cada pieza reparte 9 matitas reales (dos láminas cruzadas con recorte duro, textura de hojas hecha por código en verdes cercanos al césped, tamaño y giro distintos). Para ello `fabrica` admite un atlas propio (`cfg.celdas`), quads con `texId`/`uvs` y doble cara (`cfg.doble`).
- Huellas reescritas (el cartel 2D cambia el dibujo): `8544db4c…` y `f85cb898…`. Verificado: `node build.js`, `node test.js` (90 grupos) y capturas con Three real (`docs/cartel_3d.png`, `docs/cartel_hierba_3d.png`).
- **v2.249 · hierba alta estilizada:** la versión de matitas «reales» (v2.248) se vio demasiado realista frente a las rocas, los árboles y los personajes. Ahora son láminas cruzadas con recorte duro y la textura de PÍXEL del propio dibujo 2D (`CONSERVAR_ALFA` en el generador: se conserva la transparencia; letra «.» en las filas): una mata de tres láminas (0°, 60°, 120°) y otra más pequeña y girada. Verificado: build y `node test.js` (90 grupos) + captura con Three real (`docs/hierba_alta_3d.png`).
- **v2.250 · hierba alta simplificada** (la v2.249 no gustó: «mala propuesta, más simple y más fácil de ver»): una mata grande de bajo polígono, sin textura, de cinco hojas anchas en pirámide (una alta en el centro y cuatro abiertas) en solo dos verdes con corte duro (oscuro abajo, claro arriba) y sombreado plano. `hierba_alta` sale de `OBJ_IDS` del generador. Verificado: build, `node test.js` (90 grupos) y captura con Three real (`docs/hierba_alta_3d.png`). Lección: para decoración pequeña, forma grande y simple y pocos colores antes que detalle.

## v2.251 · Árboles más grandes que una persona, parque con árboles y lote 2 (juncos y nenúfares) (MEDIUM) (9 nov 2026)
- **Tamaños** (norma del usuario: un árbol siempre es más grande que una persona; Oli mide 1,44 u): árboles 3D pequeño 1→**2,2 u**, mediano 1,5→**3,0**, abeto 2→**3,8**, roble 2,5→**5,0** (alto ×k y copa ×0,8·k, en `src/arboles3d.js`). Los dibujos 2D del catálogo (`src/arboles.js`): 28×40, 36×54, 32×68 y 64×88 px. Como el bosque del borde (296 casillas «t») usa el pequeño en el 3D, también sube a 2,2 u. En el 2D clásico las casillas «t» siguen siendo de 16 px (pendiente decidir si se sube).
- **Parque de descanso:** 10 árboles nuevos en `maps/albanota.json` (roble hito junto a la plaza norte, abeto/mediano/pequeño en el parque, el borde norte, el lado este y los céspedes del sur-oeste), siguiendo la norma: sobre hierba, ≥ 2 casillas de caminos, ≥ 3 de puertas, ≥ 2 de puntos de pesca, fuera de los claros de criaturas (provisionales) y sin tapar ningún objeto. Test permanente v2.251 que lo vigila; se quitaron 3 decoraciones que quedaban debajo (roca, piedras) y se descartó el banco nuevo. Pendiente: el banco bajo el roble y más árboles al sur del lago cuando se quiten los claros de prueba.
- **Lote 2:** juncos (2 y 3 tallos) y nenúfares (con y sin flor) con modelo 3D en `src/objeto3d.js` (bajo polígono, sin textura; los nenúfares dejan de ser láminas tumbadas). `modelo` pasa a ir antes que `plano` en `plan()`.
- Tests actualizados (árboles sueltos permitidos, hojas que caen tras un tronco, cifras de objetos y del HD-B1). Huellas sin cambios (`8544db4c…`, `f85cb898…`). Verificado: build, `node test.js` (90 grupos) y capturas con Three real (`docs/arboles_parque_lago.png`; 18 piezas 3D, sin errores).


## v2.252 · Decoración 3D, lote 3: vallas, espantapájaros, huerto y puente (MEDIUM) (9 nov 2026)
- `src/objeto3d.js`: 7 piezas nuevas de bajo polígono, sin textura y con la paleta de madera del 2D: **vallas** (`valla_ni`, `valla_nd`, `valla_9`, `valla_v`; un módulo paramétrico con postes, listones y dos travesaños; fijas al sur, la vertical tendida de norte a sur), **espantapájaros** (poste, camisa mitad azul y mitad rosa, cabeza con ojos, sombrero de paja con cinta), **huerto** (losa de tierra, 6 caballones y 54 plantas: col, zanahoria, tomate con tutor, calabaza y lechuga) y **puente** (cubierta de tablones, vigas y barandilla de 3 postes por lado). El origen local de cada pieza es el centro de su primera casilla.
- `src/hd2d_pintor.js`: `plan()` ya no descarta las piezas de capa «bajo» (huerto y puente) cuando tienen modelo 3D; se ponen encima del suelo horneado (que queda debajo, sin verse). Son 73 piezas normales (antes 71).
- Tests v2.252 actualizados (HD-B1 ×2 y registro). Verificado: `node build.js`, `node test.js` (90 grupos) y huella 2D sin cambios (`8544db4c…`); capturas con Three real r128 en el navegador integrado (huerto con vallas y espantapájaros, y puente): sin errores de consola, 26 modelos y 9710 triángulos de modelos.
- No se ejecutaron `tools/prueba_*.py` (Chromium de Playwright no instalado aquí). Pendiente: el volumen definitivo del Centro PC, la Tienda y la Ermita (lote 4); en el puente el pasamanos queda en las casillas exteriores (se camina «dentro» de la barandilla, igual que en el 2D). Revisión de perspectiva real (móvil 390×844) del huerto y el puente: hecha en el navegador integrado a 800×600; falta verla en un móvil real.

## v2.253 · Lote 4a: Tienda definitiva en el HD-2D (MEDIUM) (9 nov 2026)
- Hallazgo: la Tienda ya tenía toldo y tejado a dos aguas en su `vol`, pero el toldo (uno solo, a 2,7 u y 0,6 de vuelo) quedaba escondido bajo el alero desde la cámara cenital y la fachada se leía como «tejado y una tira de pared». No hacía falta un modelo aparte (`objeto3d`): se mantiene el sistema de volúmenes, que conserva la atenuación del edificio cuando alguien queda detrás.
- `src/volumenes.js`: `vol.toldo` admite un toldo o una lista (`toldo1` genera cada uno; `validar` los recorre). `src/albanota_objetos.js` (tienda): **dos toldos** a rayas rojas y crema, uno sobre cada escaparate (x 0,1 y 3,1; 1,8 de ancho, a 2,8 u, caída 0,5 y vuelo 1,4), que dejan libre la puerta central; alero del tejado de 0,4 a 0,3 u. Muros (2,8), cumbrera (+1,0), fachada y altura total (3,8) no cambian.
- Tests v2.253 (los dos del toldo pasan a la lista de dos). Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual (`8544db4c…`) y captura con Three real (`docs/tienda_antes.jpg`, `docs/tienda_despues.jpg`): la puerta se llega sin rodeos y nada tapa el paso. Sin `tools/prueba_*.py` (Chromium de Playwright no instalado). Pendiente: Ermita (4b) y Centro PC (4c).

## v2.254 · Lote 4a (2.ª parte): vitrinas a los lados de la puerta y rótulo «TIENDA» (MEDIUM) (9 nov 2026)
- Petición del usuario tras ver la v2.253: ventanas enfrente del camino, a ambos lados de la puerta, y el nombre encima, integrado y legible.
- Hallazgo: los toldos estaban pegados a z = 3 (R.z1 − 1) y los bloques laterales de la fachada llegan a z = 4, así que parte del toldo quedaba dentro de la pared. Ahora `toldo` admite `retiro` (0 = muro de fuera) y los dos toldos (1,5 u de ancho, 0,8 de vuelo, a 2,8 u) salen de la pared.
- **Fachada propia** (`vitrinaTI`, `puertaTI` en `src/volumenes_tex.js`, ya no es un recorte del 2D; el 2D no cambia): dos vitrinas a la altura de los ojos con marco, cristal con brillo, travesaño, cuatro frascos de colores sobre el mostrador y alféizar, y la puerta con marco en el hueco central.
- **Rótulo** (`rotulo` en `src/volumenes.js`, `rotuloTex` con letra de píxel 3×5 propia, N de 5): placa de 29×11 px (1,8125 × 0,6875 u) con marco claro, fondo oscuro, letras crema y cuatro tornillos, pegada al muro de fuera entre los dos toldos y por debajo de ellos, con tres cantos finos (no se atenúa: `FIJAS`). Sin escuadras aparte: la placa se apoya en las dos paredes. El primer intento con la N de 4 px parecía una «H»; se pasó a 5.
- Tests v2.254 (rótulo, vitrinas, puerta y validación). Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual (`8544db4c…`) y captura con Three real a 375×812 (`docs/tienda_rotulo_movil.jpg`): el nombre se lee y la puerta se llega sin rodeos. Sin `tools/prueba_*.py` (Chromium de Playwright no instalado).

## v2.255 · Lote 4b: diagnóstico de la Ermita en el HD-2D (LOW, solo captura y revisión; sin cambios de código) (9 nov 2026)
- Captura a 375×812 con Three real (`docs/ermita_hoy.jpg`): la Ermita ya se lee bien. Frontón triangular con la hornacina y la campana de dos mitades, tejado de pizarra azul, puerta de dos hojas azul en el nicho, dos ventanas estrechas con marco y las dos farolas, todo alineado con el eje de la puerta; el camino llega sin rodeos.
- A diferencia de la Tienda, no hay nada escondido bajo el alero ni dentro de las paredes. Mejoras posibles (MEDIUM, a decidir con el usuario): puerta con arco y peldaños en relieve, ventanas con marco de piedra saliente y espadaña con volumen. Sin cambios hechos.

## v2.256 · Lote 4b: Ermita con relieves de piedra (MEDIUM) (9 nov 2026)
- `src/volumenes.js`: nuevo campo `vol.adornos` = lista de cajas `{ x0, x1, y0, y1, z0, z1, mat? }` (casillas desde la esquina de la huella y unidades de alto) con sus caras sur, oeste, este y arriba; «adorno» (fijas, hasta la altura de los muros) y «adorno_alto» (se atenúan con el tejado). `validar` las comprueba. `src/volumenes_tex.js`: `adornoER` (sillería clara con juntas cada 8 px).
- Ermita (`src/albanota_objetos.js`, 13 cajas): dos peldaños ante la puerta (0,06 u cada uno, para que Oli no se hunda al pasar), jambas, dintel y arco escalonado con clave pegados a la puerta (primer intento a z = 5: flotaba delante de la puerta por la perspectiva; se movió a z = 4), dinteles y alféizares de las dos ventanas, cornisa a lo ancho sobre los muros y repisa bajo la espadaña. Muros, tejado, huella, puerta, camino y 2D no cambian.
- Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual (`8544db4c…`) y capturas a 375×812 con Three real (`docs/ermita_hoy.jpg` antes, `docs/ermita_despues.jpg` después; encuadre y zoom distintos). La puerta se llega sin rodeos. Sin `tools/prueba_*.py` (falta Chromium). Pendiente: Centro PC (4c); la espadaña sigue siendo pintura plana (la campana 3D exigiría una pieza de revolución).

## v2.257 · Lote 4c: Centro PC con marquesina, letrero y relieves (MEDIUM) (9 nov 2026)
- Diagnóstico (`docs/centro_pc_antes.jpg`): el tejado plano dominaba la vista, el nicho de la puerta era una franja crema vacía sin ninguna señal (el letrero del 2D queda fuera del recorte de la fachada) y las cuatro ventanas eran planas.
- `src/albanota_objetos.js` (centro_pc): **marquesina** azul verdosa sobre la puerta (a 1,6 u: Oli mide 1,44; sale 0,8 u) con el **letrero «CENTRO PC»** en su borde delantero (`vol.rotulo` con `retiro: -0,8`; 41×11 px, placa azul verdosa con letras crema); dos peldaños bajos; jambas de la puerta pegadas al fondo del nicho (lección de la Ermita); alféizares y dinteles claros en las cuatro ventanas; cornisa bajo el peto. 14 cajas en `vol.adornos`.
- `src/volumenes_tex.js`: letras C, R, O, P y espacio en `GLIFOS`; `rotuloTex` y `adornoER` aceptan estilo/material (placa y marquesina con el material `azul`; el primer intento con `teja` salió rojo); el estilo `centro` resuelve `rotulo`, `rotulo_canto`, `adorno` y `adorno_alto`.
- Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual (`8544db4c…`) y capturas a 375×812 con Three real (`docs/centro_pc_antes.jpg`, `docs/centro_pc_despues.jpg`; el zoom del después es más cercano). Sin `tools/prueba_*.py` (falta Chromium). Con esto queda cerrado el lote 4 (Tienda, Ermita, Centro PC).

## v2.258 · Centro PC, corrección del usuario: dos ventanas y el nombre sobre la puerta (MEDIUM) (9 nov 2026)
- El usuario vio dos fallos de la v2.257: el letrero (colgado de la marquesina, 0,8 u delante de la pared) tapaba la puerta, y, además de las cuatro ventanas, se veían dos «a medias». Causa de las dos medias: el recorte del 2D (`fachada`) trae cuatro ventanas y las interiores (x 32-50 y 62-80 px) se cortan contra el nicho.
- Solución: **fachada propia del Centro PC** (`paredCP`, `fachadaCPmuro`, `puertaCP` en `src/volumenes_tex.js`; el 2D no cambia): cada bloque de pared lleva una sola ventana (la de fuera) y el hueco central es la puerta con su marco. Se quitó la marquesina y los alféizares/dinteles de las ventanas interiores. El `vol.rotulo` pasa a la pared (`retiro: 0`, y a 2,3 u), centrado sobre la puerta y por encima de ella (la perspectiva desplaza hacia arriba lo que está más al fondo, así que a 1,75 u tapaba el dintel de la puerta).
- Verificado: `node build.js`, `node test.js` (90 grupos), huella 2D igual (`8544db4c…`) y captura a 375×812 con Three real (`docs/centro_pc_despues.jpg`): puerta libre, nombre encima, solo dos ventanas. Sin `tools/prueba_*.py` (falta Chromium).

## v2.259 · Ficha de combate en tiempo real (LOW, solo documentos) (9 nov 2026)
- `docs/FICHA_COMBATE.md` (borrador v1, pendiente de aprobación): combate en tiempo real y automático, botón de especial que se carga, cambio de criatura, varias a la vez, sprites 2D también en el HD-2D, efectos propios con la calidad de pixelfx (solo referencia). Roles por elemento, 5 formas de ataque, estados, reacciones, IA, medidor, simulador de equilibrio y decisiones ❓. No se tocó `src/`. El zip pixelfx (MIT) se analizó: no se copia; se hará un núcleo propio.
- (9 nov, misma sesión) Ficha reescrita como **catálogo de movimientos compartido** (8 por elemento, 56 en total; 4 huecos por criatura según rareza), medidor del especial **por criatura**, KO fuera hasta curar, equipo de 6 con 1 en el campo. Artefacto visual de la ficha publicado. Pendiente: exclusivos de épicas/legendarias (a confirmar) y números de equilibrio (simulador).

## v2.260 · Prototipo de efectos de combate (MEDIUM, solo prototipo; no toca `src/`) (9 nov 2026)
- `tools/prototipo_fx/` (`nucleo.js` partículas/luz/llama con semilla, `moves.js` 4 movimientos, `main.js` escenario, `efectos_combate.html` artefacto): **Llamarada** (Fuego, básico), **Salto de fuego** (Fuego, habilidad), **Escudo de agua** (defensa) y **Brote** (apoyo), sobre los sprites reales de Ignel, Ondel y Aguacato. Núcleo propio (ideas de pixelfx como referencia, sin copiar código). Escala 1 px = 1 px del juego (128×80), color + luz aditiva, tramado, parada de impacto, temblor, squash/stretch.
- Revisado por capturas (8 instantes por movimiento). Ajustada la luz (se pasaba). Sin errores de consola salvo la tipografía externa bloqueada en el entorno. Pendiente: medir en móvil real, pasar a los dos pintores del juego y los números de equilibrio.
- Salto de fuego (decisión del usuario): salta EN SU SITIO y la onda llega al rival; forma «onda en línea», alcance larga.

## v2.261 · Prototipo de efectos: lote Fuego completo (MEDIUM; no toca `src/`) (9 nov 2026)
- `tools/prototipo_fx/moves2.js`: **Zarpa ardiente** (básico, contacto con tajo curvo), **Bola explosiva** (habilidad; variante parametrizada de Llamarada: arco, explosión grande y fragmentos), **Tormenta de fuego** (especial; 15 bolas sobre el rival y una final enorme), **Erupción** (especial; aviso de grietas bajo el rival, columna, el rival sale despedido), **Aura ardiente** (defensa; el rival embiste y se quema) y **Avivar** (apoyo; flechas ^ de subida de ataque). Con Llamarada y Salto de fuego, Fuego queda con sus 8 movimientos del catálogo.
- Revisado por capturas (8 instantes por movimiento). Corregido: el destello del impacto tapaba el tajo (se adelantó el tajo), el anillo de la Bola explosiva era demasiado grande. Sin errores de ejecución. Pendiente: medir en móvil real.

## v2.262 · Prototipo de efectos: lote Agua completo (MEDIUM; no toca `src/`) (9 nov 2026)
- El usuario probó el prototipo en su móvil: **va fluido** y deja los efectos de Fuego como están (puede retocarlos más adelante, probándolos en el juego).
- `tools/prototipo_fx/moves3.js`: **Chorro** (haz), **Salpicón** (proyectil corto), **Ola** (cresta que avanza por el suelo y empuja), **Burbuja** (atrapa y flota), **Marea** (especial: ola gigante que cruza toda la pantalla), **Torrente** (especial: haz grueso que empuja y arrastra; reutiliza el generador del Chorro con parámetros) y **Purificar** (apoyo: apaga el fuego de una aliada). Con el Escudo de agua, Agua queda con sus 8 movimientos. Generadores comunes nuevos: `waveDraw`, `bubbleFx`, `jet`, `splash`.
- Revisado por capturas (8 instantes por movimiento). Ajustado el tinte de «mojado» y el grosor del Chorro. Sin errores de ejecución.
- (misma sesión) **Marea rediseñada** por decisión del usuario (se parecía a la Ola): ahora el agua SUBE sobre la zona del rival (aviso con ondas, rival flotando ralentizado, burbujas, se retira y lo arrastra, cae con parada y deja charcos). Ya no es una cresta que cruza el suelo.

## v2.263 · Guía de nombres de movimientos (LOW, solo documento) (9 nov 2026)
- `docs/GUIA_NOMBRES_MOVIMIENTOS.md`: reglas y 2 opciones por cada uno de los 17 movimientos hechos (nombres provisionales; el `id` interno no cambia). Pendiente de elegir por el usuario.

## v2.264 · Nombres definitivos de movimientos (LOW) (9 nov 2026)
Aplicados en ficha, prototipo y artefactos: Fogonazo, Zarpazo ígneo, Bola de magma, Pisotón solar, Lluvia de meteoritos, Estallido volcánico, Aura ardiente (se mantiene), Fervor, Chorro a presión, Salpicadura, Oleada, Pompa prisión, Pleamar, Hidrocañón, Muro acuático, Lluvia curativa, Savia vital. Los ids internos no cambian.

## v2.265 · Prototipo de efectos: Hoja completa (LOW, sin tocar src/) (9 nov 2026)
- `tools/prototipo_fx/moves4.js`: Latigazo, Cuchilla de hoja, Enredadera, Nube de esporas, Selva voraz, Ciclón de hojas, Piel de corteza (+ Savia vital ya hecho). Total 24 movimientos (Fuego 8, Agua 8, Hoja 8). Nombres de Hoja propuestos, pendientes de tu visto bueno. Verificado por capturas; sin prueba en móvil.

## v2.266 · Latigazo mejorado y Zarzal (LOW) (9 nov 2026)
- Latigazo: onda que recorre la enredadera, espinas, estela, chasquido con anillo, impacto más fuerte. 'Selva voraz' → **Zarzal** (id interno 'bosque'): zarzas con espinas que se arquean sobre el rival, raíces que lo sujetan, flores que curan en 3 pulsos; sin árboles.

## v2.267 · Prototipo de efectos: Eléctrico completo (LOW, sin tocar src/) (9 nov 2026)
- `tools/prototipo_fx/moves5.js`: Centella, Sacudida, Cadena voltaica, Red estática, Tormenta eléctrica, Rayo cenital, Jaula de chispas, Pulso veloz. Total 32 movimientos (Fuego, Agua, Hoja, Eléctrico). Rayos en zigzag con semilla determinista (parpadean y se pueden rebobinar). Nombres propuestos, pendientes de tu visto bueno. Verificado por capturas; sin prueba en móvil.

## v2.268 · Prototipo de efectos: Aire completo (LOW, sin tocar src/) (9 nov 2026)
- `tools/prototipo_fx/moves6.js`: Tajo de viento, Aletazo, Remolino, Vendaval, Tornado, Ojo del huracán, Plumaje etéreo, Viento de cola. Total 40 movimientos (Fuego, Agua, Hoja, Eléctrico, Aire). Nombres propuestos, pendientes de tu visto bueno. Verificado por capturas; sin prueba en móvil.

## v2.269 · Prototipo de efectos: Roca completo (LOW, sin tocar src/) (9 nov 2026)
- `tools/prototipo_fx/moves7.js`: Mazazo, Pedrusco, Onda sísmica, Embestida pétrea, Alud de rocas, Seísmo, Muralla de piedra, Desafío. Total 48 movimientos (Fuego, Agua, Hoja, Eléctrico, Aire, Roca). Nombres propuestos, pendientes de tu visto bueno. Verificado por capturas; sin prueba en móvil.

## v2.270 · Prototipo de efectos: Sombra completo, 56 movimientos (LOW, sin tocar src/) (9 nov 2026)
- `tools/prototipo_fx/moves8.js`: Garra umbría, Aguja de sombra, Mal de ojo, Emboscada, Noche voraz, Terror nocturno, Manto de penumbra, Drenar fuerza. Nombres aplicados en las fichas.
- Verificado solo por capturas (no en móvil). Pendiente: probar en móvil Hoja–Sombra; ❓ legendarios, 1–3 enemigos, números por simulador.

## v2.271 · Motor de combate en tiempo real (prototipo) + simulador (MEDIUM)
- **Nuevo** `src/combate_datos.js` (catálogo de los 56 movimientos con ids del prototipo de efectos, estados, 6 reacciones, plantillas de elemento) y `src/combate.js` (motor puro a 20 ticks/s: semilla propia en `c.rs`, estado JSON, IA, 5 huecos, 8 estados, reacciones, medidor del especial por criatura, relevos y cambio, eventos para los pintores). Añadidos a `src/orden.json` (datos). No se usan todavía en el juego: `dist` solo crece ~14 KB y la huella 2D no cambia (`8544db4c…`).
- **Nuevo** `tools/simular_combate.js` (determinismo, serializable, sin atascos, matriz 7×7 con plantillas iguales, reales, 2+1 contra 3+1, µs/tick) y 3 comprobaciones en `test.js` (catálogo, determinismo, JSON a mitad de pelea).
- **Equilibrio (calibrado con `tools/calibrar_combate.js`, reproducible):** (1) las variantes de cada hueco valen lo mismo dentro de su elemento (potencia `CAL`; intensidad de defensas y apoyos); (2) los 7 emparejamientos neutros se centran con un coeficiente de daño por rareza y elemento (`AJUSTE`); (3) el peso no decide: `KGPOT` iguala ligeros y pesados. Mejoras de motor hechas para ello: tenacidad (inmunidad 2 s tras aturdir/enredar/miedo; antes Sombra dejaba a Hoja con miedo eterno), las reacciones consumen el estado, variación ±30 % y crítico 18 %×1,8, arranque desigual (medidor y enfriamientos), rareza ×1/1,25/1,45/1,7.
- **Medido (300 peleas por pareja):** victorias globales por elemento Común 45-53 %, Rara 47-57 %; criaturas reales contra las plantillas de su nivel: 38-65 %; duración mediana 12 s (p10 7, p90 22); sin atascos; ~5 µs/tick (Node). Con ventaja de tipo (×2/×0,5) el resultado sigue siendo casi 100/0 a igualdad de nivel (decisión de la ficha); entre neutros hay parejas 30-70 %. **Épico/legendario: sin equilibrar** (solo existen 3 líneas y falta su movimiento exclusivo); se recalibra con ellos.
- **Pendiente:** recalibrar épico/legendario; entrada «pequeño ataque» al cambiar; movimiento exclusivo de épicas/legendarias; conectar eventos con los pintores 2D/HD-2D (los efectos de `tools/prototipo_fx`); pantalla de combate y botón de especial; probar todo en móvil.
- **Documentación (v2.271):** `FICHA_COMBATE.md` pasa a v2 con el apartado 15 (estado, reglas del motor, cómo equilibrar, pendientes); `ROADMAP.md` y `CONTINUAR.md` actualizados; `GUIA_NOMBRES_MOVIMIENTOS.md` (propuestas A/B ya resueltas) archivada en `docs/archivo/GUIA_NOMBRES_MOVIMIENTOS_v2.269_propuestas_A_B.md`. Los ❓ de la ficha se aceptan provisionalmente hasta probar jugando (9 nov, usuario).

## v2.272 · Combate conectado al HD-2D (MEDIUM, solo HD-2D; el 2D no se toca)
- Nuevos `src/combate_motor.js` (orden «combate»/«esp»/«combate_fin», avance con acumulador a 20 ticks/s, `est.combate` serializable), `src/combate_vista.js` (`G.vista.combate`) y `src/combate_fx.js` (efectos genéricos por forma/elemento). Ganchos en `hd2d_pintor.js` (unidades, cuadritos de efecto, barras de vida y especial, números, banner), `game.js` (botón ⚔/⚡ `#kbtn`, a la izquierda; el combate avanza en `creatureStep`) e `index.html`.
- Provisional de prueba: aliado `pompon` y enemigo = criatura salvaje más cercana (≤7 casillas); sustituir por equipo y «choque y captura».
- Comprobado: `node build.js`, `node test.js` (92 grupos), huella del juego sin cambios, `tools/prueba_combate_hd2d.py --three …` (Chromium móvil 390×844, Three r128 real por software: combate completo, victoria, sin errores). El motor no avanzaba al principio (faltaba engancharlo al bucle) y «¡» no existe en la fuente del juego: corregidos.
- Pendiente: probar en móvil real (fps/partículas), portar los 56 efectos propios, nombres que se solapan en cuerpo a cuerpo, combate en 2D, épicas/legendarias.


## v2.273 · HD-2D: solo criaturas 2D, árboles sin trama, acompañante de prueba
- `AJUSTES.CRIATURAS3D = false` (las láminas 2D ya se usaban; el interruptor sigue por si se reactiva) y `OCLUSION_ARBOLES = false` (los árboles ya no se vuelven translúcidos con trama al taparse una criatura; los edificios mantienen su oclusión).
- Acompañante provisional (`est.acomp`, solo en HD-2D, se crea al entrar y se borra al volver al 2D; no está en la huella): `pompon` sigue al jugador y es el aliado del combate (`motor.combate.acompanar/seguir`, `G.vista.acomp`). Sustituir por el equipo real.
- Comprobado: build, test (92), huella igual, prueba de combate y captura del acompañante siguiendo a Oli. `tools/prueba_criaturas3d.py` presupone el interruptor en true: hay que encenderlo antes si se usa.

- v2.273b: al acabar el combate el cartel «Victoria» dura 2,5 s y se libera `est.combate` (antes se quedaba para siempre porque `est.reloj` no avanza en el bucle del juego); el acompañante reaparece siguiendo al jugador solo entonces; la criatura vencida se quita del mapa.

## v2.274 · Los 56 efectos diseñados dentro del combate HD-2D
- `tools/generar_fx_pro.js` empaqueta el prototipo (`tools/prototipo_fx`, sin cambiarlo) en `src/combate_fx_pro.js` (G.fxPro, 260 KB; el tope de tamaño de `dist/criaturas.html` en `test.js` sube de 1,30 a 1,60 MB). Los ids del prototipo y del catálogo son los mismos.
- `hd2d_pintor.js` (`combateProFx`): al empezar el lanzamiento (evento `inicio`) arranca la escena del movimiento (128×80 px = la arena) y la pinta en dos láminas (color y luz aditiva); si lanza el bando derecho se refleja; los movimientos del lanzador/objetivo (embestidas, encogerse) se aplican a las láminas de las unidades. Los efectos genéricos (`combate_fx.js`) solo quedan para estados, reacciones, KO y los movimientos sin efecto propio (ninguno).
- Cierre del combate: el resultado dura 1,8 s, el acompañante reaparece en el sitio de su aliado (sin saltos) y la criatura vencida sale del mapa.
- Pendiente: sincronía fina (el efecto dura más que el vuelo del motor: el daño llega antes del impacto visual), encuadre de cámara (los extremos de la arena pueden quedar cortados en pantallas estrechas), el temblor/parada de impacto y el tinte de los efectos no se aplican, con la cámara girada las láminas no siguen la línea de la arena.

## v2.275 · El daño llega en el instante del impacto visual
- `tools/medir_impactos.js` mide en cada efecto diseñado el instante de su impacto (la parada de impacto) y lo guarda en `G.COMBATE_DATOS.IMPACTO` (42 movimientos con daño; casi no depende de la distancia). El motor retrasa el daño hasta ese instante (`c.pend`, también contacto, haz, línea y área); la esquiva, los estados y las reacciones se resuelven entonces. Simulador: sigue en 40–60 % por elemento (no hizo falta recalibrar). Pendiente: Esporas no tiene parada de impacto (se usa 0,9 s) y Ola varía con la distancia (se midió a 62 px).

## v2.276 · Ciclo del combate: derrotada = desaparece ya, sin reaparecer; movimiento libre
- Una criatura derrotada se quita en el mismo tick del KO (la vista no dibuja unidades KO; no hay encogerse ni cuenta atrás). La salvaje sale del mapa y su hueco de aparición queda en `est.mapas[id].vencidas` (`aparicion.js` no vuelve a generarla). El acompañante de prueba, si cae, no vuelve (se recrea al volver a entrar en HD-2D).
- El jugador ya no se bloquea durante el combate (se quitó el gancho de `moverJugador`); la arena queda donde empezó.
- Pendiente: qué pasa con una criatura propia derrotada cuando exista el equipo (¿se cura en el centro?).

## v2.277 · Combate en el pintor 2D (los 56 efectos, acompañante, ⚔/⚡)
- Nuevo `src/combate_2d.js` (`G.combate2d`): unidades del combate y acompañante ordenados con el resto por la Y de los pies, efectos diseñados (G.fxPro) sobre el lienzo 2D (1 px = 1 px, escena 128×80 = la arena; capa de luz aditiva; reflejada si lanza el bando derecho), cuadritos genéricos para estados/reacciones, y barras, números y rótulo final en el lienzo `#ui`. Ganchos mínimos en `game.js` (`draw`, `drawPlates`, `combateUI`). El botón ⚔/⚡ y el acompañante de prueba (uno por sesión, si cae no vuelve) funcionan ahora también en 2D.
- Huella: sin acompañante el dibujo es idéntico a antes (se comprobó); con el acompañante dibuja una criatura más, así que se reescribieron `docs/HUELLA_JUEGO.txt` y `HUELLA_JUEGO_CLASICO.txt` a propósito.
- `tools/prueba_combate_2d.py` (sin Three). El HD-2D no se ha tocado: sigue con los efectos diseñados (pedido: «solo el 2D»); si no encajan allí, apagar `combateProFx` y dejar los cuadritos genéricos es cosa de una línea.
- Pendiente: la cifra del golpe mortal no se ve (la unidad desaparece en ese tick); probar en móvil; el 2D clásico (`?clasico`) usa los mismos sprites.

## v2.278 · «Jugo» de barras y números en el 2D (solo la parte de dibujo, LOW)
- `combate_2d.js`: vaciado suave de la barra, trozo de daño (blanco al golpe, rojo mientras se vacía tras ~0,4 s), color verde/amarillo/rojo por estado, y números con pop al entrar, subida con freno y desvanecimiento final. Solo 2D; sin tocar el motor.
- Pendiente (MEDIUM, pedido en el vídeo): temblor/destello/punch, tamaño según daño, color por tipo, críticos distintos, números sin solaparse, curas con relleno suave (requieren eventos nuevos de cura y eficacia en el motor), y la cifra del golpe mortal.

## v2.279 · «Jugo» completo en el 2D (los de MEDIUM del vídeo)
- Motor: nuevos eventos `cura` (regeneración, robo de vida, limpiar, curar aliados) y campos `ef` (eficacia) y `mx` (vida máxima del objetivo) en `golpe`. Solo informan: el simulador sigue igual.
- `combate_vista`: `ko` (posición de los derrotados ~1,2 s) para ver la cifra del golpe mortal. `combate_2d.js`: temblor, destello blanco y «punch» de la unidad y de su barra al recibir; tamaño del número según el daño (pequeño/medio/grande), color por eficacia (naranja eficaz, gris poco eficaz, blanco normal), crítico dorado, más grande y con temblor; cada número sale por un arco distinto; curas con «+N» verde y brillo verde en la barra que se rellena suave.
- Solo 2D. El HD-2D ignora lo nuevo (los «+N» de cura se pintan como texto simple).

## v2.280 · Ritmo, inicio natural, barras con identidad (2D)
- Ritmo: `D.RITMO = 1.8` multiplica los enfriamientos (los ataques se espacian; ambos bandos por igual). Simulador sigue en su rango (40–67 % por criatura; el calibrador podría afinarse otra vez con el ritmo nuevo). Cada lanzamiento muestra el nombre real del movimiento en una cinta con el color de su elemento.
- Inicio natural: la arena se centra entre aliado y enemigo y cada unidad arranca en su sitio real (`est.combate.fl` invierte el eje si el aliado queda a la derecha; `y0` por unidad y alineación gradual de la profundidad en 2 s). Se acabó el «teletransporte a la arena».
- Barras (solo 2D, `combate_2d.js`): placa de píxel con el borde violeta del juego y esquinas cortadas, vida en dos tonos con brillo y marcas de cuarto, insignia de rombo con el color del elemento, medidor del especial fino que parpadea dorado con rayo al llenarse, un cuadrito por estado, nombre sobre cinta oscura.
- Pendiente: listas de movimientos por criatura (hoy el kit sale de la plantilla de su elemento y rareza, por eso el aliado de prueba no «tiene» ataques propios); recalibrar con el ritmo; mover a una criatura que ya está lejos antes de empezar.

## v2.281 · Zoom del 2D y acompañante fluido
- Botón 🔍 (`#zbtn`, solo en 2D, a la izquierda sobre el ⚔): lejos / normal / cerca / muy cerca (anchura de vista ×1,3 / 1 / 0,75 / 0,55; `K` hasta 7). Por defecto «cerca» (antes equivalía a «normal»), así que las huellas del 2D se reescribieron a propósito. No se recuerda entre sesiones (game.js no guarda nada; se podría guardar desde el pintor o `guardado.js`).
- El acompañante sigue con suavizado exponencial (sin umbral de arranque/parada), se coloca detrás de Oli según su dirección (cambia despacio al girar), velocidad máx. 110 px/s, histéresis en el estado «andando» y en la dirección. Medido en navegador: pasos de 0,6–2,3 px por 33 ms, sin parones ni parpadeo de animación.

## v2.282 · El acompañante sigue el rastro de Oli
- Causa del «va muy rápido y vibra»: el seguimiento suavizado iba hasta a 110 px/s (Oli anda a 46 px/s) y recolocaba el sitio detrás de Oli en cada giro. Ahora `seguir()` guarda el rastro de Oli (un punto cada 3 px) y el acompañante lo recorre a 46 px/s (hasta ×1,6 si se queda muy atrás), a ~20 px de distancia; arranca/para con margen (sin parpadear), reaparece junto a Oli si se queda a más de 150 px o cambia de mapa. Medido: misma velocidad que Oli, pasos de 1,5–2,3 px por 33 ms.

## v2.283 — Combate 2D más limpio + botón de especial
- Cintas con el nombre del ataque eliminadas salvo en especiales (cartel fijo arriba, centrado).
- Placas de vida con separación mínima (40 px de juego) para que no se pisen.
- Botón ⚡: anillo de carga suavizado (--p) y, al llenarse, fondo dorado con pulso/halo (respeta prefers-reduced-motion).
- Verificado: build, test.js (94 grupos), huella igual, prueba_combate_2d.py ok.

## v2.284 — Formación y distancia de combate (2D)
- Al iniciar, las unidades se deslizan en 0,8 s desde su sitio real a la formación (x=30 / x=130, ~80 px); `est.combate.dx`.
- Separación visual `ensanche` (±7 px de cada bando respecto al punto medio), aplicada a unidades y a los efectos (`v.off`). Solo vista: el motor no cambia.
- Verificado: build, test.js, huella igual, simulador ok, prueba_combate_2d ok.
- Pendiente (medium): turno visual (una acción a la vez), acercamiento/vuelta de ataques de contacto, recalibrado.

## v2.285 — Turno visual y vaivén de contacto
- combate.js: `c.libre`/`c.ult` + `turno()`: una acción ofensiva (básico/habilidad/especial) a la vez, hasta su impacto + 0,4 s; luego el turno pasa primero al otro bando (4 ticks). Las órdenes del jugador (especial) no esperan.
- mover(): los de contacto (alc<30) esperan en su `home`, se lanzan cuando su ataque casi está listo y vuelven después.
- Recalibrado con calibrar_combate.js --escribir. Duración mediana 30 s.
- Estado simulador: determinismo y serializable ok; equilibrio comun f1 38–61 % (meta 40–60) → FALLA por poco; pendiente otra pasada del calibrador.

## v2.286 — Daño en el impacto (restaurado), defensas visibles, más daño por golpe
- combate.js: el retraso del daño hasta el impacto visual (`dl` = IMPACTO·TPS − WIND, `aplicarForma`, pend `dif`) faltaba en el motor; restaurado. Sincronía: 0 de 536 golpes fuera. `amen` hasta el impacto.
- FUERZA = 1.5 (daño por golpe); mediana 4,9 % de vida; combates ~19 s.
- golpe lleva `bl` (bloqueado); UI: «Esquiva», «Bloqueo», «Fallo».
- Recalibrado: equilibrio comun f1 45–58 %.

## v2.287 — Posiciones fijas en combate
- combate.js: `mover()` vacío; ya no hay desplazamientos, embestidas/saltos ni empujones que cambien `x` (comprobado: 0 ticks con movimiento en 20 peleas). Todo está siempre al alcance (d=0). Los acercamientos son solo animación del pintor.
- Formación 40/120 u (~64 px + 14 de ensanche). Cámara (game.js `follow`): en combate se centra suavemente en la arena (`camB`) y vuelve a Oli al acabar.
- Simulador ok (equilibrio comun f1 43–60 %; sin recalibrar).

## v2.288 — Arena a la vista y sin duplicados al acabar
- combate_motor.js `sitio()`: la arena se monta lo más cerca posible del punto medio pero con las dos unidades (y el espacio entre ellas) en suelo libre y sin nada delante (nuevo `G.capas.tapa`: casas, árboles, tejados). Test: 65/65 colocaciones despejadas.
- Al acabar, la criatura salvaje superviviente seguía visible en su sitio de origen mientras se mostraba la de la arena (duplicado, luego «saltaba»). Ahora permanece oculta hasta `liberar()` y queda donde peleó (x,y,hx,hy). VER_FIN 1.95 (sin hueco de 0,1 s).
- test.js: 95 grupos.

## v2.289 — Efectos en cada combate
- Causa: `combate_2d.js` guardaba en `S.vistos` las claves «tick|id|mov»; al empezar otro combate los ticks vuelven a 0 y esas claves se repetían, así que los efectos del 2.º/3.º combate se descartaban (medido en tiempo real: combate 3 → 0 efectos activos).
- Arreglo: al cambiar `est.combate` se reinicia el estado visual (vistos, golpes, instancias). Con el arreglo: 3/3/3 activos en 2.º y 3.º.
- `G.combate2d.activos()` y regresión en tools/prueba_combate_2d.py (combates 2.º y 3.º con efectos).

## v2.290 — Entrada caminando y números de daño
- Entrada: al empezar, las unidades caminan (animación de paso, mirando hacia donde van) a su sitio a 50 px/s (0,4–2,5 s) y el combate arranca al llegar (`k.ent/entT`, `motor.combate.entrando`). Antes se deslizaban sin caminar mientras ya peleaban.
- Números: nacen sobre el cuerpo del objetivo (50 % de su altura), suben 14 px con freno, vida 0,7 s (14 ticks; curas 0,8 s), varios golpes se abren a los lados; ya no quedan flotando lejos.
- test.js: el combate necesita ~6 s para avanzar (entrada). 95 grupos ok; huella igual; prueba 2D ok.

## v2.291 — Quemadura agrupada y números del golpe mortal
- Quemadura: aplicaba daño cada 0,25 s con un «3» cada vez durante varios segundos. Ahora el daño sigue igual pero el aviso (`dot`) es uno por segundo con la suma, pequeño y naranja (se vacía al acabar el estado).
- Golpe mortal: el reloj visual se congelaba al acabar el combate (`tick = c.t + 0`), así que el número del último golpe (grande) no envejecía y se quedaba pegado. Ahora `tick` sigue con `finT`. Pop de número reducido (×1,25).
- test.js: 96 grupos.

## v2.292 — Contraste de los efectos de combate (2D)
- Durante el combate el mundo se atenúa (velo 38 % × `camB`, violeta oscuro) y las criaturas del combate se pintan después, sin atenuar; la arena se coloca sin nada delante, así que no hay problema de orden. Los efectos quedan encima.
- Contorno oscuro de 1 px alrededor de los píxeles sólidos de cada efecto (separa del suelo claro).
- Verificado: build, test.js (96), huella igual, prueba 2D ok. Ajustable: 0,38 (game.js) y 0x99301018 (combate_2d.js).

## v2.293 — Nombres nítidos
- `#ui` (nombres, barras, números) tenía `image-rendering: auto`: si el lienzo cae en media posición de píxel de pantalla (centrado/fraccionario) el navegador lo suaviza y el texto se ve borroso. Ahora `pixelated` (sin interpolación). En captura a densidad 2 ya se veía nítido; el efecto real es en móviles con densidad/posición fraccionaria (no reproducido aquí).

## v2.294 — Acompañante sin vibración al caminar
- Causa: el acompañante se dibujaba en `round(a.x − cam.x)` y la cámara en `round(Oli.x)`: dos redondeos independientes, así que su posición respecto a Oli saltaba ±1 px del juego (≈ 5–6 px de pantalla) aunque la separación real fuera constante. Medido: 45 cambios en 240 fotogramas.
- Arreglo: `G.vista.acomp` devuelve la posición relativa a Oli redondeada (`round(Oli) + round(a − Oli)`); la placa de nombre usa lo mismo. Medido: 3 cambios (solo el arranque).
- Huellas reescritas (cambio visual intencionado): normal d98f344d… · clásica 2d06738e….

## v2.295 — Desintegración de la criatura derrotada (2D)
- La derrotada desaparece en el acto y su sprite estalla en píxeles de 1 px de juego (uno por píxel real del dibujo): salen radialmente con ruido, arriba antes que abajo, gravedad ligera, destello blanco los primeros 70 ms y desvanecido (0,5–1,2 s). Determinista por tick del KO. `G.combate2d.pixeles()`; prueba 2D comprueba >100 partículas.
- vista: `ko[]` lleva forma, dir y tick.

## v2.296 — Captura de criaturas (2D)
- Al ganar a una salvaje, si el jugador tiene esferas (empieza con 5; `j.esferas`), la criatura queda aturdida (parpadea) y se ofrece lanzarle una esfera antes de que desaparezca. Si no hay esferas o se deja ir (✋), se desintegra en píxeles.
- Lanzamiento (a nuestra manera): capa transparente `#capl`; deslizar hacia la criatura. Anillo que se encoge cada 1,6 s: pequeño = Excelente (1,0) / Bien (0,8) / Normal (0,5); la puntería (la recta del gesto contra la criatura) baja un nivel o falla (Fallo = 0, la esfera pasa de largo).
- Motor (`combate_motor.js`, determinista, serializable): `k.cap` {fase oferta→vuelo→agita→ok|rompe→oferta|huye→fin}; órdenes `lanzar {q}` y `soltar`. Probabilidad = base por rareza (común .85 · rara .65 · épica .4 · legendaria .22) × (0,55 + 0,6·q), tope .97; hasta 3 lanzamientos; 1–3 sacudidas (3 si sale bien). Semilla = semilla del combate.
- La capturada va a `j.sinId` (sin identificar; se oficializará en el laboratorio: pendiente). `esferas` y `sinId` se guardan (guardado.js). No empieza otro combate mientras dura el actual (`iniciar` bloquea con `est.combate`).
- Visual: esfera 9×9 en el color del elemento, vuelo en arco, sacudidas con chispas, estallido dorado al capturar, anillo y textos («Excelente!», «Capturada!», «Sin identificar. Llevala al laboratorio», «Se escapo!»). La cámara se queda en la arena mientras dura.
- Tests: test.js 97 grupos (determinismo, gasto, guardado); tools/prueba_captura_2d.py (gesto real con ratón).
- Pendiente: conseguir más esferas, laboratorio para identificar, límite de equipo, HD-2D (allí la oferta caduca sola a los 14 s).

