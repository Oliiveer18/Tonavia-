# SESION · v2.297 a v2.304 (archivado el 10 nov 2026)

Ignel 3D, tema «pixel cálido», HUD, sonido del combate, niveles (núcleo) y combate de noche. Lo vigente está en `docs/SESION.md`.

## v2.297 · Ignel en 3D real (prueba, HD-2D)
- `src/glb.js` (nuevo): cargador mínimo de GLB con malla animada para Three r128 (sin GLTFLoader). Registro `REG` (id → archivo, escala `k`); el GLB **no va dentro del HTML** (3,6 MB): se pide una vez junto al juego (`ignel.glb`); si falta o falla, se queda la lámina 2D y no se reintenta.
- `hd2d_pintor.js`: `poner3dG` (interruptor `CRIATURAS_GLB`) sustituye la lámina en mapa, acompañante y combate; Idle / Walking / Dead (animación de Mixamo/Meshy), giro por `dir`, ataque y defensa con el movimiento procedural de `E.proAct`. Solo HD-2D; el 2D no cambia (huella igual).
- Modelo: `modelos/ignel_glb.wasm` (el GLB con otra extensión, porque el alojamiento no sirve `.glb`; 31.026 triángulos, 42 huesos, textura JPEG 2048). Pendiente: Attack/Hit propias, textura más ligera, cámara del combate en HD-2D (no encuadra la arena), efectos 3D.
- Pruebas: `tools/prueba_glb_hd2d.py --three … --glb …` (con y sin archivo). test.js 97 grupos ok; dist 1.584 MB.

## v2.298 · Tema «pixel cálido» (interfaz completa)
- `tools/tema_ui.py` + `tools/tema_ui.css` generan el bloque `/*TEMA:INI*/…/*TEMA:FIN*/` de `index.html` (se regenera con `python3 tools/tema_ui.py <fuente.woff2>`): tipografía **Pixelify Sans** recortada (OFL, 7 KB, incrustada), marcos de 9 cortes dibujados píxel a píxel (panel, oro, secundario, hueco, cruceta), paleta madera/crema/oro, 20 iconos de píxel 9×9 propios (sustituyen a los emoji) y pantalla de inicio con título. Sustituye al bloque azul v2.241.
- Aplica a HUD, cruceta, menús, galería, mapas, peces, diálogos y botón de combate. `G.ic(nombre, clases)` (game.js) pinta iconos desde JS. El icono del sonido va por CSS (`#abtn[aria-pressed]`) para no tocar audio.js ni su prueba.
- El 2D no cambia (huella igual). dist ≈ 1.60 MB. Pendiente: placas y banners del combate (dibujados en el lienzo) siguen con su paleta; iconos de otros textos con emoji (`destino.icono` del minimapa).

## v2.299 · HUD ordenado + pendientes del tema
- **Borroso del botón HD-2D**: con «HD-2D» activo, la regla antigua `#hbtn[aria-pressed=true]` ponía texto oscuro sobre el marco oscuro del tema nuevo (sombra incluida) y parecía desenfocado; ahora usa el marco dorado con texto marrón. Etiqueta corta («2D» / «HD-2D») para que la fila no salte de alto al cambiar.
- **HUD**: nueva barra superior `#hud` EN EL FLUJO (antes los botones flotaban sobre el mapa): fila A = estado (`#who`, con puntos suspensivos) + sonido, peces, mapas y galería (solo icono; el texto sigue en el HTML con `font-size:0`); fila B = ajustes (gráficos, sombras, editar mapa, cambiar). Cámara HD (`#hcam`) abajo a la izquierda junto al zoom y el botón de combate; `altoVista()` reserva la altura real de `#hud` (en node, sin `#hud`, conserva la cuenta antigua → huella igual).
- **Combate**: placas, barras y textos del lienzo con la paleta del tema (contorno #24121d, madera #5a3845, crema #fff4dc).
- **Lugares**: el minimapa dibuja iconos de píxel (casa, laboratorio, fuente, centro, tienda, ermita) leídos de las variables CSS `--ic-*`; sin documento (node) o sin cargar queda el emoji. El texto de destino usa el mismo icono.
- Tope de tamaño de `test.js` a 1,7 MB (dist ≈ 1,61 MB). `src/glb.js`: no pide el modelo abierto desde `file:`.
- `tools/prueba_hd2d_juego.py`: texto del botón actualizado. **Quedan 8 fallos en esa prueba** (recuentos de árboles/objetos/sombras y mensajes «sin internet / sin WebGL»); salen igual con el GLB apagado y no tocan CSS: probablemente vienen de versiones anteriores (v2.272+), sin investigar.

- v2.300: minimapa más pequeño (96×82 px, antes 128×110) y arriba a la derecha dentro del mapa. test.js 97 grupos y huella 2D iguales.

## v2.301 · Sonido del combate (síntesis Web Audio)
- `src/sonido_combate.js`: sonidos sintetizados, sin archivos ni licencias. Una voz por elemento (fuego, agua, hoja, eléctrico, aire, roca, sombra) y por fase: carga (golpes pesados y especiales), lanzamiento (según forma y duración del vuelo), impacto (según daño; crítico añade chasquido; bloqueo suena amortiguado), más defensa, apoyo, cura, esquiva, quemadura, KO, especial listo, reacción y fanfarria de victoria/derrota. Panorama por bando, reverb corta, compresor y máx. 5 impactos por 0,12 s.
- Se dispara desde `loop()` (`sonidoCombate()` en game.js) con los eventos de `G.vista.combate` (cada uno una vez, en su tick, igual que los efectos visuales; vale para 2D y HD-2D). Baja la música a la mitad mientras dura el combate. `G.audio.motor()` (audio.js) da contexto, bus de efectos, música y ruido solo si está sonando.
- Genérico: suena para CUALQUIER criatura según el elemento y el hueco de su movimiento (el acompañante Ondel y la salvaje del mapa incluidos).
- Pruebas: grupo nuevo en test.js (98 grupos); `tools/demo_sonido_combate.py` renderiza todo fuera de línea a WAV y mide (pico 0,78, sin NaN ni recortes); comprobado en Chromium real: ~127 voces en un combate, 0 errores. NO verificado: cómo SUENA (no puedo escuchar) ni en iPhone (el audio de iOS exige gesto previo; ya lo gestiona audio.js). Pendiente: capturas (lanzar esfera, agitar, éxito) y afinado de volúmenes tras escucharlo.

## v2.302 · Variedad de sonido por movimiento
- `src/sonido_combate.js`: cada movimiento tiene timbre propio (afinación y brillo derivados del hash de su id y su potencia, `MP`, aplicados en `osc`/`rui`), capas por forma (proyectil con barrido de panorama, haz/línea, zona/área grave, contacto) y por etiqueta (embiste, roba, debilita, cadena, provoca, espalda, limpia, veloz). Apoyo/defensa afinados por elemento; sonidos nuevos para estados alterados, interrupción, cambio de criatura y zona.
- Pruebas: test.js (+3 comprobaciones en el grupo v2.301); `tools/demo_sonido_movimientos.py` renderiza los 56 movimientos + estados (pico 0,83, sin NaN).
- Afinado de volumen: defensas/apoyos +50 %, hoja más presente, zonas/áreas más contenidas.

## v2.303 · Niveles de criatura (núcleo)
- `src/nivel.js` (puro, ajustes en `AJUSTES`): nivel 1–50 por XP (`xpPara(n)=30·(n−1)^1.75`, ~27 000 XP para el 50), multiplicador de vida/ataque/defensa `1+0,025·(n−1)` (×2,2 al 50; la velocidad no cambia), nivel de las salvajes por rareza (común 1–6, rara 4–12, épica 10–20, legendaria 18–30, reparto por hash determinista), XP ganada `(14+6·nivelRival)·rareza`, que cae hasta un 20 % contra rivales más débiles.
- El progreso es por ESPECIE del jugador (`j.prog[forma] = {xp}`), porque aún no hay equipo de individuos. `combate.js` acepta `nivel` en la unidad (1 por defecto: sin él, nada cambia). `combate_motor.js` fija los niveles al iniciar y da la XP al ganar (`k.premio`, aviso). Guardado: `prog` validado, mismo formato v1 (campo opcional).
- UI: nombre con «Nv N» en el combate (2D y HD-2D); cartel central «¡X sube al nivel N!» y fanfarria al subir.
- Pendiente (fases siguientes): movimientos por nivel, evolución por nivel, niveles por zona, ficha de criatura, barra de XP.

## v2.304 · Combate de noche
- `aplicaCiclo()` (game.js): con combate activo el velo nocturno se aclara un 65 % hacia blanco, con fundido de 0,7 s (`#noche` transition). Vale para 2D y HD-2D.
- v2.304b: foco de luz (radial blanco en el velo) sobre cada contendiente y el jugador, con fundido; el aclarado general baja al 45 %. En HD-2D usa `G.hd2d.proyectar` (no verificado en Chromium sin WebGL).

