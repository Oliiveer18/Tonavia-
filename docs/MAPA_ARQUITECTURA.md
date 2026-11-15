# MAPA DE ARQUITECTURA (generado)

Generado con `python3 tools/mapa_arquitectura.py` (75 módulos, 14698 líneas). Orden de carga: `src/orden.json`. Datos: `maps/*.json`. Herramientas: `tools/`. Pruebas: `test.js` y `tools/prueba_*.py`.

| Módulo | Líneas | Qué es |
|---|---:|---|
| `agua3d.js` | 109 | AGUA DEL HD-2D (v2.171, paso 1 del plan «agua en 3D»). PURO: sin Three, sin DOM, sin Math.random. |
| `albanota_objetos.js` | 594 | OBJETOS DE ALBANOTA (v2.55, ID-3c paso C; v2.56, paso D: volúmenes provisionales). Solo dibujo: sin estado de partida ni Math.random. |
| `aparicion.js` | 91 | APARICIÓN de criaturas por zona y rareza (paso 1.3b, v2.17). Solo reglas: no dibuja, no toca el DOM ni usa Math.random. |
| `arboles.js` | 45 | CATÁLOGO DE ÁRBOLES (v2.34, aprobado por el usuario el 3 nov con la hoja `docs/arboles_final_cuatro.png`). Solo dibujo: sin estado de partida ni Math.random. |
| `arboles3d.js` | 66 | ÁRBOLES 3D del HD-2D (v2.198, docs/FICHA_ARBOLES_3D.md). PURO: no toca Three, el DOM ni el estado; sin Math.random. |
| `audio.js` | 164 | MÚSICA Y SONIDO POR CÓDIGO (v2.136, ID-4). Sin archivos de audio: todo se sintetiza con Web Audio. No toca el motor, el estado ni el dibujo (la huella del juego no cambia |
| `bolsa_ui.js` | 87 | BOLSA y TIENDA (v2.318): panel a pantalla completa con los Brillos (✦), los objetos, las esferas y los pescados del jugador. Dos modos: |
| `capas.js` | 215 | MOTOR DE DIBUJO CON CAPAS (ID-2a, v2.33). Solo dibujo: no guarda estado de partida ni usa Math.random. |
| `chars.js` | 229 | pixel art generado por código: paleta, baldosas y objetos. |
| `ciclo.js` | 25 | CICLO DE DÍA Y NOCHE (v2.244, idea 5 de pokesurvivor.com). PURO: sin DOM, sin Math.random, sin relojes de pared. Solo calcula, a partir del reloj de la partida (est.reloj |
| `clasico2d.js` | 106 | ESTILO 2D CLÁSICO (piloto, v2.112). Solo el pintor 2D de src/game.js: el HD-2D no lo usa y no cambia (su suelo, sus sprites y su sombreado siguen siendo los de siempre). |
| `combate.js` | 207 | MOTOR DE COMBATE en tiempo real (v2.271, prototipo). PURO: sin DOM, sin Math.random, sin relojes; 20 ticks/s; todo el estado es JSON (c) con su propia semilla (c.rs). |
| `combate_2d.js` | 188 | el combate en tiempo real en el pintor 2D (v2.277). Lee G.vista.combate / G.vista.acomp y dibuja con el lienzo 2D del juego (1 px = 1 px del juego, sin Three). |
| `combate_datos.js` | 93 | DATOS del combate en tiempo real (v2.271, prototipo del motor). Solo datos: catálogo de 56 movimientos, estados, reacciones y plantillas de elemento. |
| `combate_fx.js` | 105 | EFECTOS del combate como cuadritos de píxel (v2.272, solo HD-2D). PURO: sin Three, sin DOM, sin Math.random; cada efecto es una función del tick actual y del evento que l |
| `combate_fx_pro.js` | 2343 | GENERADO por tools/generar_fx_pro.js desde tools/prototipo_fx (no editar a mano). Los 56 efectos de movimiento diseñados (núcleo de píxeles determinista: sin Math.random  |
| `combate_motor.js` | 130 | el combate DENTRO del estado de la partida (v2.272, solo HD-2D por ahora). Une el motor puro (src/combate.js) con `est`: est.combate es JSON puro y sale/entra en el guard |
| `combate_vista.js` | 30 | QUÉ se ve del combate, sin dibujar nada (v2.272; contrato entre el motor de combate y los pintores, hoy solo el HD-2D). Funciones puras sobre est.combate. |
| `creatures.js` | 168 | criaturas del juego. Los DATOS (nombre, autor, elementos, rareza, frase, tamaño, peso, rasgos de movimiento) viven en UN solo sitio: src/lineas.js (G.LINEAS, paso 1.1). |
| `crianza.js` | 185 | CRIANZA GENÉRICA (v2.320): genes, herencia, mutación, talento, habilidad, huevos que eclosionan andando y sintetizador de sprites por capas. PURO: sin DOM, sin azar del s |
| `crianza_ui.js` | 2 | (pendiente) |
| `criatura3d.js` | 140 | CRIATURAS 3D del HD-2D (v2.169 · ZEFIRAX 3D, pasos 2-5 de docs/FICHA_ZEFIRAX_3D.md). PURO: sin Three.js, sin DOM, sin Math.random; se prueba en node. |
| `criatura3d_modelos.js` | 205 | MODELOS 3D A MANO de Nimbel (nubecin) y Arenel (arenel) (v2.229). PURO: sin Three.js, sin DOM, sin Math.random; se prueba en node. |
| `criatura3d_sprites.js` | 8 | TEXTURAS de las criaturas 3D (v2.229), GENERADO por tools/generar_sprites3d.py a partir de los sprites 2D reales (sin tinta, sin transparencia). No editar a mano. |
| `cueva2d.js` | 176 | PINTOR 2D DE LAS PROFUNDIDADES (v2.320). Solo dibujo: no guarda estado de partida ni usa azar del sistema (todo sale del mapa, de G.profundidades.vista y del reloj visual |
| `dialogo_ui.js` | 107 | DIÁLOGO con un personaje (v2.312): caja inferior con retrato, nombre, texto que se escribe y opciones grandes. Sirve a la enfermera Alba (curar —cuesta Brillos— y prepara |
| `equipo.js` | 27 | EL EQUIPO del jugador (v2.312): qué criaturas lleva (hasta 6) y cuál va al frente (la que lo acompaña y pelea). PURO: sin DOM ni azar, listo para online. |
| `equipo_ui.js` | 96 | pestaña EQUIPO (v2.310): el equipo del jugador y todas sus criaturas, con nivel, XP, vida y ficha de detalle. Solo LEE lo que ya guarda cada jugador (j.prog, j.vida, j.si |
| `font.js` | 63 | fuente de píxeles propia de Lali y Oli (v0.5.1): letras de ancho variable (la i y la l finitas, la m y la w anchas), esquinas redondeadas, |
| `formas_agua.js` | 176 | dibujos de las criaturas de elemento principal Agua (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo). |
| `formas_aire.js` | 165 | dibujos de las criaturas de elemento principal Aire (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo). |
| `formas_base.js` | 39 | ayudantes comunes de dibujo (paso 1.2, v2.7): los que usan varias líneas de elementos distintos, y def2/set, que enlazan un dibujo con su entrada de src/lineas.js. |
| `formas_electrico.js` | 239 | dibujos de las criaturas de elemento principal Eléctrico (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dib |
| `formas_fuego.js` | 192 | dibujos de las criaturas de elemento principal Fuego (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo) |
| `formas_hoja.js` | 661 | dibujos de las criaturas de elemento principal Hoja (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo). |
| `formas_roca.js` | 241 | dibujos de las criaturas de elemento principal Roca (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo). |
| `formas_sombra.js` | 172 | dibujos de las criaturas de elemento principal Sombra (paso 1.2, v2.7). Solo DIBUJOS: los datos de cada criatura están en src/lineas.js y se enlazan con def2('id', dibujo |
| `galeria.js` | 119 | Galería de criaturas (v2.8, paso 1.4): todas las líneas por Nº, con filtros combinables (elemento, rareza, fases), búsqueda por nombre, páginas de 20 líneas y sprites que |
| `game.js` | 368 | PINTOR 2D y entrada (teclado, botones, cámara). Las reglas viven en src/mapas.js (datos del mundo) y src/motor.js (estado y órdenes); qué se ve de cada personaje (fotogra |
| `glb.js` | 63 | Cargador mínimo de GLB con malla animada (Three r128, sin GLTFLoader). Lee 1 malla con skin + animaciones por huesos (Mixamo/Meshy). |
| `guardado.js` | 38 | v2.189 (1.3f): guardado de partida. Estado serializable y CON VERSIÓN (norma «listo para online»): el mismo formato sirve para el móvil hoy y para un servidor mañana. |
| `hd2d_pintor.js` | 670 | PINTOR HD-2D del juego (v2.64: HD-B1 2.ª mitad, HD-B2, HD-B3 y HD-C2). Es el segundo «pintor» del contrato de docs/ARQUITECTURA_2D_HD2D.md: lee el mundo (mapa y estado de |
| `interiores_objetos.js` | 328 | MOBILIARIO DE LOS INTERIORES (v2.140, ID-5c; docs/BIBLIA_INTERIORES.md §1b y §5). Solo dibujo: sin estado de partida ni Math.random. |
| `lineas.js` | 162 | REGISTRO ÚNICO DE DATOS (paso 1.1 del PLAN_200). Una entrada por línea evolutiva, en orden de Nº de línea. Es la ÚNICA fuente de los datos de juego: |
| `luz_criaturas.js` | 53 | v2.23 (B1): ajustes de luz POR CRIATURA para el volumen calculado (src/sombreado.js, sección 1b). Solo las criaturas listadas aquí usan el sistema nuevo; |
| `luz_farolas.js` | 27 | LUZ PEQUEÑA DE LAS FAROLAS en el HD-2D (v2.102, paso 5 de docs/FICHAS_OBJETOS_3D.md). Sin luces reales (con 12 farolas y materiales sin iluminación solo afectarían al sue |
| `mapas.js` | 165 | DATOS y reglas del mundo (paso 1.3a). No dibuja ni guarda estado de partida: solo sabe qué hay en cada mapa y cómo se unen. |
| `mapas_guardados.js` | 22 | dónde viven los mapas importados del editor (v2.61): UN solo sitio, el navegador donde se juega (localStorage). |
| `mapas_ui.js` | 95 | botón «Mapas» (importar, exportar, volver a los oficiales), botón «✏️ Editar mapa» (abre el editor DENTRO del juego, v2.62) y rótulo «Mapas del editor» (v2.61). |
| `minimapa.js` | 157 | MINIMAPA y MAPA GRANDE (v2.73, paso 1; v2.74: zoom con el dedo en el mapa grande; v2.75: tocar un lugar → su nombre y una flecha en el borde del juego). Solo LEE el mapa  |
| `motor.js` | 183 | ESTADO del juego y ÓRDENES (paso 1.3a). No dibuja nada, no toca el DOM ni el teclado: solo reglas. |
| `musica_combate.js` | 128 | MÚSICA DE TENSIÓN DEL COMBATE (v2.305). Sin archivos: todo se sintetiza con Web Audio, igual que el resto del sonido. |
| `nivel.js` | 27 | NIVELES de criatura (v2.303): XP, curva, multiplicador de estadísticas y nivel de las salvajes. Funciones PURAS (sin DOM, sin Math.random, sin estado): el estado vive en  |
| `npc.js` | 117 | PERSONAJES NO JUGABLES (v2.312). Hoy: la enfermera Alba del Centro PC. Sprite propio, lugar en el mapa (maps/*.json → npcs con tipo «npc»), alcance de conversación y guio |
| `objeto3d.js` | 155 | REGISTRO DE OBJETOS 3D (decoración fija del HD-2D; v2.246). PURO: sin Three.js, sin DOM, sin Math.random. Igual que G.criatura3d pero para piezas del catálogo (G.OBJETOS) |
| `particulas.js` | 155 | PARTÍCULAS DEL 2D (ID-2b-4, v2.90). Humo de las chimeneas, gotas y salpicaduras de la Fuente, destellos en el agua y hojas que caen de los árboles del borde. |
| `particulas3d.js` | 112 | PARTÍCULAS DEL HD-2D (v2.93, F3). Lo PURO: qué píxeles hay en el mundo 3D en cada cuadro del reloj visual (4 por segundo). Sin Three, sin DOM y sin Math.random (usa el ha |
| `peces.js` | 419 | los peces (v2.188; v2.192 = identidad de docs/FICHA_PECES.md): DATOS, elección con azar de la semilla y su dibujo 2D GENERADO por código (sin DOM ni Math.random). |
| `peces_ui.js` | 29 | v2.192: ficha de captura (aparece al sacar un pez) y colección de peces (botón 🐟). Solo DOM; lo que muestra sale de G.PECES y de lo que ya guarda cada jugador (j.capturas |
| `personaje3d.js` | 301 | PERSONAJES 3D del HD-2D (v2.113 · OLI 3D, paso 2 de docs/FICHA_OLI_3D.md: volumen con COLORES LISOS; v2.114: + 4 trenzas laterales y tope de 240 triángulos; v2.115: paso  |
| `pesca3d.js` | 83 | geometría 3D de la pesca (v2.181, Pesca 2-4): caña, hilo, corcho, ondas, pez que salta y «!» del pique. PURO: no toca Three, el DOM ni el estado. |
| `profundidades.js` | 666 | LAS PROFUNDIDADES (v2.320): cuevas generadas por semilla, puzles para dos, estado y órdenes. PURO: sin DOM, sin azar del sistema, sin relojes. |
| `profundidades_ui.js` | 51 | INTERFAZ DE LAS PROFUNDIDADES (v2.320): rótulo del piso (bioma, llaves, runa, modificadores, pista del puzle), minimapa con niebla, botones «Salir» y «Reiniciar sala», |
| `rampas.js` | 42 | v2.23 (B1, capa 1 del sistema de sombreado, docs/REGLAS_DE_LUZ.md sección 7): rampas de color compartidas. |
| `red.js` | 28 | v2.188 (1.3d): QUÉ viaja entre los dos móviles, sin red ni DOM. Cada móvil manda SU jugador (autoridad por jugador) y el otro lo pinta; el mundo sale de la semilla. |
| `red_peer.js` | 62 | v2.188 (1.3d): la CONEXIÓN entre los dos móviles con PeerJS (punto a punto; se pide a cdnjs solo al elegir personaje, como Three.js). Roles fijos: Oli crea la sala y Lali |
| `rio3d.js` | 126 | PROPS DEL RÍO EN 3D (v2.172d, paso 4 del plan «agua en 3D»). PURO: sin Three, sin DOM, sin Math.random. |
| `sombras_proyectadas.js` | 96 | SOMBRAS PROYECTADAS DEL 2D (v2.100). Solo el 2D: el HD-2D no las usa (queda en pausa hasta que tenga texturas) y su suelo horneado no pasa por aquí. |
| `sombreado.js` | 270 | v2.21 (paso A del plan de identidad, docs/REGLAS_DE_LUZ.md): luz fija ARRIBA-IZQUIERDA y sombra ABAJO-DERECHA en todo lo que se dibuja por código. |
| `sonido_combate.js` | 201 | SONIDO del combate (v2.301): efectos sintetizados con Web Audio (sin archivos, sin licencias), uno por elemento y por fase del movimiento. |
| `terreno.js` | 169 | MOTOR DE TERRENOS 2D (v2.321): auto-baldosas por píxel con bordes naturales, paleta, lava animada, brasas y luz por región (tema = m.region). Solo dibujo del 2D clásico:  |
| `tienda.js` | 104 | BRILLOS (✦), MOCHILA y OBJETOS (v2.315). Economía del juego: PURA, sin DOM ni azar ni relojes; todo vive en el estado del jugador (j.brillos, j.mochila) y se guarda con v |
| `vista.js` | 63 | QUÉ se ve de cada personaje y criatura, sin dibujar nada (v2.51b, paso A2 del plan 2D / HD-2D). |
| `volumenes.js` | 447 | MOTOR DE VOLÚMENES del HD-2D (v2.67, paso B 1.ª mitad de docs/FICHAS_EDIFICIOS_3D.md). PURO: sin Three.js, sin DOM, sin azar; se prueba en node (grupo 49 de test.js, tool |
| `volumenes_tex.js` | 508 | TEXTURAS POR CARA de los volúmenes del HD-2D (v2.68, paso B2a de docs/FICHAS_EDIFICIOS_3D.md). Dibujadas por código con Canvas2D y la paleta del juego (G.PAL): sin imágen |
