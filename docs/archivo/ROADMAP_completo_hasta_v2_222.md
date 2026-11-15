# ROADMAP · Criaturas de Lali y Oli (reorganizado en la v2.52, 4 nov)

Un ZIP por paso y PARAR tras cada uno. La última palabra es del usuario. **Antes de cada paso se dice siempre el modelo/esfuerzo (LOW o MEDIUM), también el de cada subpaso y cada fase.** El historial completo de lo hecho (entradas por orden de llegada) está en `ROADMAP_HISTORICO.md`; el detalle técnico de cada versión, en `SESION.md`. Para retomar en otra sesión: `PROMPT_PARA_CONTINUAR.md`.

## 1. Dónde estamos (v2.208)

**RESUMEN v2.208 (8 nov 2026):** pesca completa y cerrada (2D y HD-2D: caña, hilo, pique, forcejeo, pez enganchado, ficha de captura, colección, guardado, dos móviles). Peces: ahora se dibujan **a mano píxel a píxel** (método y reglas en `docs/GUIA_PECES_A_MANO.md`); el único pez activo es el **Cirujano azul** (`pez_cirujano`, 19×15 px); los 5 peces antiguos generados por fórmula están ocultos (`oculto: true`). Árboles 3D en HD-2D hechos (Fases 1-3); falta colocarlos en los mapas (Fase 4) y el cierre (Fase 5).
**LOTE 1 DE FAUNA MARINA HECHO (v2.211-v2.214, 8 nov 2026):** Sardina, Pez payaso, Dorada, Pez globo y Pulpo común, dibujados a mano, en 2D y HD-2D, con ficha y colección (ver `docs/FICHA_PECES.md`). **LOTE 2 HECHO (v2.215-v2.217): Morena, Pez espada, Pez loro, Mero, Raya, Pez ángel, Salmonete y Lubina (8 criaturas, `docs/bloque_final_8.png`). **LOTE 3 HECHO (v2.218-v2.220): Pez volador, Bagre, Pez león, Bacalao, Barracuda y Cazón → 20 criaturas vivas; la FAUNA MARINA queda COMPLETA (sin lote 4 previsto).** Albanota (pueblo inicial) solo da las zonas 0 (orilla norte) y 1 (puentes): salen 14 de las 20; la zona 2 (agua honda: Pulpo, Mero, Pez espada, Raya, Barracuda y Cazón) queda reservada A PROPÓSITO para mapas futuros con agua a 3 o más casillas de tierra. Reserva sin usar: Lenguado, Pez cofre, Pez luna, Atún, Pez aguja y Pez ballesta (`docs/lote3_reserva_6.png`). Cada lote de 5 criaturas se dibuja a mano (con el Cirujano azul como referencia de calidad y estilo) y se implementa en 2D y HD-2D. El nuevo chat debe PROPONER primero el plan dividido en LOW/MEDIUM y esperar el «hazlo». Ver `docs/PROMPT_PARA_CONTINUAR.md`.


- **v2.208:** caña marrón del puente (mango y palo), más cerca y en la mano izquierda.
- **v2.207:** caña 3D de dos tonos claros (opción 2) e hilo blanco visible.
- **v2.206:** caña 3D con los colores y la forma de la 2D; el pez enganchado cuelga sobre el agua sin tapar al personaje.
- **v2.205:** un solo tamaño del Cirujano (19×15) y el pez enganchado ya no tapa a Oli.
- **v2.204:** pez enganchado a la caña (cuelga con la cabeza arriba) y caña 3D recta como la 2D.
- **v2.203:** contorno completo del Cirujano.
- **v2.202:** el Cirujano azul es fácil de sacar (1 tirón, más margen).
- **v2.201:** solo se pesca el Cirujano azul (los 5 antiguos, ocultos). **Siguen:** más peces dibujados a mano.
- **v2.200:** Cirujano azul, primer pez dibujado a mano (2D + lámina en HD-2D). **Siguen:** más peces y rehacer los 5 de río con ese método.
- **v2.199:** árboles 3D sin bloque debajo y sin viento (quietos).
- **v2.198:** árboles 3D en HD-2D, Fases 2 y 3 hechas (modelo, malla única, viento, sombra, oclusión). **Siguen:** Fase 4 (colocar en mapas) y 5.
- **v2.197:** árboles 3D en HD-2D, Fase 1 (ficha, LOW) hecha; pendiente de aprobación. **Siguen:** Fases 2-5.
- **v2.196:** peces 2D a doble resolución (paso 2 hecho). **Sigue:** paso 3, peces 3D con volumen y textura del sprite (MEDIUM).
- **v2.194:** sombra de pesca simple (mancha redonda; aviso 2 s antes y en el pique). **Siguen:** peces 2D a doble resolución (MEDIUM) y peces 3D con volumen y textura del sprite (MEDIUM).
- **v2.192-v2.193:** peces con identidad (dibujo 2D por código, modelos 3D, salto y sombra), forcejeo con ritmo, ficha de captura y colección 🐟. Aprobada la ficha de peces.
- **v2.191:** ficha de peces (`docs/FICHA_PECES.md`), pendiente de aprobar; luego peces 3D/2D (MEDIUM) y tensión + colección (MEDIUM).
- **v2.188-v2.190:** HECHOS 1.3d (dos móviles, PeerJS, roles fijos), 1.3f (guardado de partida) y captura de la pesca (peces por zona). Siguiente: 1.6 combate por turnos.
- Entradas v2.60-v2.100 (sombras proyectadas, laboratorio, minimapa, edificios 3D…): `docs/archivo/ROADMAP_entradas_v2_60_a_v2_100.md`.

## 2. Principios del plan
0. **Listo para online (norma del 7 nov):** ver `CLAUDE.md`. El juego puede salir online: estado serializable en `est`, motor determinista por órdenes y semilla, jugadores por id, contenido como datos, combate/captura verificables con semilla. Cambios de plan por esto: ID-5m (un tema por casa) se sustituye por UN tema genérico «interior doméstico» para todas las casas (opcional, LOW); 1.3d (dos móviles) pasa ANTES de la Fase 7 para construir el combate ya sincronizado.
1. **El 2D es la base; el HD-2D es una opción encima.** El mundo es uno solo y hay dos pintores (2D y HD-2D); un botón en partida cambia de pintor sin reiniciar. Si el HD-2D da problemas, el 2D sigue entero.
2. **El mapa provisional no pasa al HD-2D.** El HD-2D solo lee Albanota, cuando exista como mapa real (decisión del 4 nov).
3. **Albanota se hace una vez** (referencia aprobada → mapa real) y los dos modos la leen.
4. **Cada efecto visual nuevo se hace en los dos pintores o se anota como pendiente en el otro** (así nunca se acumulan diferencias sin saberlo).
5. Si se cambia a propósito lo que se ve en el 2D: `node tools/huella_juego.js --escribir` y se anota en `SESION.md`.
6. **Diseño espacial intencional y profesional (norma permanente del 6 nov):** todo edificio, interior, calle o entorno nuevo lleva una distribución estudiada (alineación con ejes y rejilla, simetría solo si se justifica, equilibrio, proporciones, función y recorrido del jugador, composición profesional, identidad propia) y se revisa desde la perspectiva real del jugador antes de darlo por terminado. No obliga a rehacer lo existente. Texto completo en `docs/BIBLIA_VISUAL.md` §13.

## 3. Hoja de ruta por fases

### FAUNA MARINA por lotes de 5 (decidida el 8 nov; va ANTES del resto: el nuevo chat propone el plan LOW/MEDIUM y espera «hazlo») · Árboles 3D Fases 4-5 (LOW) pendientes
### ORDEN DE EJECUCIÓN (vigente desde v2.187, 7 nov) · de lo que queda · pasos 1, 2 y 5 HECHOS en v2.188-v2.190
Cada paso: un ZIP, se dice el esfuerzo, la sesión no puede cambiarlo (lo cambia el usuario en el selector), la verificación mecánica va a Haiku (skill `esfuerzo-delegacion`).
| # | Paso | Esfuerzo | Notas |
|---|---|---|---|
| 1 | **1.3d · Dos móviles** | MEDIUM | Roles fijos: el usuario es Oli y su pareja Lali (para siempre). PeerJS, órdenes + semilla, comprobación periódica del estado, seguir en solitario y reconectar. Sala creada una vez, código guardado en cada móvil (un toque para conectar). Sin pantallas extra. |
| 2 | **1.3f · Guardado de partida** (NUEVO) | MEDIUM | Estado serializable y con versión (posición, mapa, progreso de cada jugador); automático al cambiar de mapa y cada pocos segundos; en el móvil ahora, mismo formato para servidor después; migración entre versiones; con dos móviles, al reconectar se carga el más reciente. |
| 3 | **1.6 · Combate por turnos** | MEDIUM | Funciones puras con semilla, verificables por un servidor; nace guardable. |
| 4 | **1.7 · Choque y captura** | MEDIUM | Combate en tiempo real en el mapa y captura. |
| 5 | **Captura de la pesca** | MEDIUM | **HECHO (v2.188-v2.208).** |
| 6 | **Evolución** | MEDIUM | Nivel mínimo + objetos; pareja con el cascabel. |
| 7 | **1.3e · Personalización** | LOW (decidir) + MEDIUM | Nombre y complementos; con roles fijos, solo ajustes por personaje. |
| 8 | **ID-5g-4 · Identidad de color** | MEDIUM | Opcional, sin decidir. |
| 9 | **Fase 8 · Criaturas** (Hitos 1-4, 18 lotes) | LOW ficha + MEDIUM dibujo por lote | Se puede intercalar con los pasos 3-6 si quieres más criaturas antes. |
| 10 | **Regiones** (7) | MEDIUM por región | Tras el combate, con Hoja como molde; falta búsqueda de originalidad. |
Hecho en esta tanda: pesca (v2.180-v2.184), limpieza del editor y norma online (v2.185), música genérica de casas (v2.186). Pendientes sueltos: móvil real con GPU, aprobaciones tuyas (referencia de Albanota, biblia visual).

### Detalle por fases (histórico y estado)
Estados: **HECHA** · **EN CURSO** · pendiente. Esfuerzo entre paréntesis.

### Fase 0 · Fundamentos técnicos — HECHA
1.0 test de equilibrio (LOW) · 1.1 registro único de datos (MEDIUM) · 1.2 dibujo por elemento (MEDIUM) · 1.4 galería (MEDIUM) · 1.5 presupuestos (MEDIUM) · 1.3a motor de mapas (MEDIUM) · 1.3b aparición por zonas (MEDIUM) · 1.3b-bis interruptor de criaturas visibles (LOW). Detalle en `ROADMAP_HISTORICO.md`.

### Fase 1 · Identidad visual del 2D (MEDIUM) — casi hecha
| Paso | Esfuerzo | Estado |
|---|---|---|
| ID-1 biblia visual | MEDIUM | HECHA (v2.29), **pendiente de tu aprobación** |
| ID-2a motor de dibujo con capas y formato 2 de `maps/` | MEDIUM | HECHA |
| ID-2b-1 agua animada (olas) · ID-2b-2 luz por región | MEDIUM | HECHAS (v2.37-v2.46), aprobadas |
| Sombreado del suelo y de las 41 formas (v2.21-v2.28) y criaturas menos oscuras (v2.47) | MEDIUM | HECHO |
| Viento: función (v2.48a, LOW) · matas (v2.48b LOW + v2.48c MEDIUM) · flores (v2.49, LOW) · cámara fija entera (v2.48d, LOW) | LOW / MEDIUM | HECHO, **falta que lo pruebes en el móvil** |

### Fase 2 · Albanota: de la referencia al mapa real — HECHA (v2.57), pendiente de tu aprobación de la referencia
Plano aprobado 48×36 (`PLANO_ALBANOTA.md`) y 2 imágenes de referencia v2.32 (plaza y barrio). Reglas del plano: río recto horizontal, caminos centrados, sin mirador, sin arboledas ni árboles nuevos, sin criaturas salvajes en el juego final.
| Paso | Esfuerzo | Qué |
|---|---|---|
| ID-3a | LOW | **HECHO (v2.53):** auditoría urbanística y 7 cambios al plano, decididos por Claude por delegación del usuario |
| ID-3b | MEDIUM | Referencia rehecha (v2.53: imagen 48×36 con motor y piezas reales) → **pendiente de tu aprobación** |
| ID-3c | MEDIUM | Albanota como mapa real `maps/albanota.json` (48×36, formato 2), visible en el 2D. **En 3 subpasos:** **B · suelo: HECHO (v2.54, `?mapa=albanota`)** → **C · objetos que ya existen: HECHO (v2.55, 52 objetos, `src/albanota_objetos.js`)** → **D · volúmenes provisionales de Centro PC, Tienda y Ermita: HECHO (v2.56, 55 objetos)** |
| ID-3d | LOW | **HECHO (v2.57):** el juego empieza en Albanota; el pueblo provisional queda solo como mapa de pruebas (`?mapa=pueblo_inicial`) |
Nota: la mejora «de cómo se vería en HD-2D» (luz, profundidad) NO entra aquí: va en HD-B3.

### Fase 2b · Editor de mapas v2 (decidido el 5 nov, v2.58) — HECHA: ED-1 (v2.59) y ED-2 (v2.60); SIGUIENTE: Fase 3 (HD-B1)
**Por qué:** el usuario ve fallos en Albanota y quiere editarlo todo «de la manera más fácil e intuitiva», desde el móvil. Hoy `tools/editor_mapas.html` solo pinta el **suelo** (hierba, camino, agua, árbol) y coloca anclas, puertas, zonas y npcs; **no muestra ni deja mover, añadir o borrar objetos** (casas, fuente, farolas, bancos, huerto, Centro PC, Tienda, Ermita…): solo los conserva sin tocarlos. Además `maps/albanota.json` lo genera `tools/crear_albanota.js`, que **borraría lo editado a mano** cada vez que se ejecute.
**Decisión (usuario, 5 nov):** hacer la **parte 1** y parar; la parte 2 después, cuando él lo diga.
| Paso | Esfuerzo | Qué |
|---|---|---|
| ED-1 | MEDIUM | **HECHO (v2.59).** **Parte 1 · ver y mover.** (a) `maps/albanota.json` pasa a ser la **fuente única**: `tools/crear_albanota.js` se retira o se deja como herramienta de «rehacer desde cero» que avisa antes de sobrescribir (los grupos 39 y 40 de `test.js` que comprueban «el generador regenera el mismo archivo» se adaptan). (b) El editor muestra Albanota con los **dibujos reales** de cada objeto (el mismo motor `G.capas`) y la cuadrícula de 16 px. (c) Tocar un objeto lo selecciona; se puede **arrastrar** (encaja en la cuadrícula), **borrar** y **copiar**. (d) **Deshacer y rehacer.** (e) Guardar/exportar el JSON. Pensado para el móvil (botones grandes, sin menús escondidos). **Hecho tal cual:** `maps/albanota.json` es la **fuente única** (`tools/crear_albanota.js` sin `--forzar` avisa y no toca nada; con `--salida ruta` escribe el plano original aparte); el editor lleva dentro el motor del juego (`G.capas` + piezas de Albanota) y muestra los 55 objetos con su dibujo, la cuadrícula y las casillas sólidas; tocar elige el objeto de encima, arrastrar lo mueve a la cuadrícula (arrastrar el fondo desplaza la vista), flechas grandes, Copiar, Borrar, Deshacer/Rehacer, «Objetos» para ocultar los dibujos, «Recargar del archivo»; «Comprobar mapa» entiende los objetos. Probado con `tools/prueba_editor.py`. |
| ED-2 | MEDIUM | **HECHO (v2.60).** ED-2 (v2.60, MEDIUM): el editor de mapas AÑADE piezas y avisa. Herramienta «Añadir pieza» (O, botón «＋ Pieza») con paleta de las 26 piezas del juego en grupos (Edificios, Plaza, Huerto y vallas, Agua, Árboles); un toque pone la pieza por los pies (arrastrar desplaza la vista; «Listo» termina); avisos en vivo (rojo = error, amarillo = aviso, «!» sobre la pieza) si una pieza tapa una puerta, un ancla, una guarida o la entrada de un edificio, deja sin sitios de aparición una zona, o corta un camino / deja sin acceso una puerta; tocar un aviso de «Comprobar mapa» lleva a la pieza; botón «▶ Probar»: abre el juego dentro del editor con TODOS los mapas tal como están, sin exportar (el editor lleva el juego dentro). Cambio mínimo en src/game.js: acepta window.__MAPA_PRUEBA además de ?mapa=. Albanota queda en «Todo en orden». **Límites:** probado a mano en Chromium (móvil 390×844); `node test.js` = 44 grupos y `python3 tools/prueba_editor.py` = TODO BIEN (móvil y escritorio, incluye ED-2); huella del juego igual (`c671c2cb…`); arrastre con dedo real sin probar; «Probar» empieza siempre en el ancla «inicio». **Antes era:** **Parte 2 · añadir y pulir.** Paleta con todas las piezas (casas, farolas, bancos, fuente, edificios, juncos…) para colocarlas tocando; avisos si una pieza tapa una puerta, un camino o un sitio de aparición (reutilizando las reglas de `G.capas.validar` y `G.mundo.validar`); botón para **probar el mapa en el juego**. |
Cómo se trabaja con el editor (v2.59): abrir `tools/editor_mapas.html` (se crea con `node tools/editor_mapas.js`), editar Albanota, **Exportar → «Copiar este mapa» o «Descargar»**, y pasar ese `albanota.json` a Claude (o ponerlo en `maps/albanota.json` y `node build.js`). El editor guarda en el navegador, pero **solo lo exportado llega al juego**. Antes de ED-2 se pide al usuario la **lista de fallos que ve** en Albanota (puede ir apuntándolos mientras usa el editor). Las piezas provisionales (Centro PC, Tienda, Ermita) se editan igual que las demás. Nada de esto toca el juego ni los dibujos de las criaturas.

### Fase 3 · HECHA (v2.64) · Modo HD-2D y botón 2D / HD-2D (necesita Fase 2; va DESPUÉS de la Fase 2b; el primero será HD-B1)
Contrato del pintor y arquitectura en `ARQUITECTURA_2D_HD2D.md`.
| Paso | Esfuerzo | Qué | Estado |
|---|---|---|---|
| HD-0 | LOW + MEDIUM | Prueba con Oli (v2.50: sprites LOW, control/colisiones/cámara MEDIUM) y Lali (v2.51a, LOW) | HECHA |
| HD-A1 · HD-A2 · HD-A3 | LOW · MEDIUM · LOW | Inventario, `vista.js` + huella del juego, contrato del pintor (v2.51b) | HECHA |
| HD-B1 | MEDIUM | Albanota (mapa real) a terreno 3D: suelo, agua, caminos, edificios, objetos, árboles | **HECHA** (1.ª mitad v2.63; 2.ª v2.64: edificios y objetos como láminas del dibujo 2D) |
| HD-B2 | MEDIUM | El HD-2D lee del motor y de `G.vista` (sin colisiones propias; Oli/Lali y criaturas del motor; el menú de elegir personaje es el del 2D) | **HECHA** (v2.64) |
| HD-C1 | LOW | Botón «Gráficos: 2D / HD-2D» en partida, mismo estado y posición | **HECHA** (v2.64) |
| HD-C2 | MEDIUM | Three.js solo se carga si eliges HD-2D; si falla o va lento, vuelve al 2D; recuerda la elección | **HECHA** (v2.64) |
| HD-B3 | MEDIUM | Llevar al HD-2D lo que ya tiene el 2D: olas, viento, luz, sombras de criaturas | **HECHA** (v2.64) |
| HD-C3 | LOW | Pruebas, documentos y ZIP | **HECHA** (v2.64) |
Decidido en HD-C2: Three.js se pide a cdnjs solo al elegir HD-2D (no va dentro del archivo). Pendiente: verlo con Three.js real en el móvil. Avisos: cada contenido nuevo se dibuja en los dos modos; en móviles lentos el HD-2D podría quedar opcional.

### Fase 3b · Edificios en 3D de verdad en el HD-2D (pedido el 5 nov, v2.65) — CERRADA (v2.89): A y B hechos (B cerrado en v2.71), C-E hechos (v2.72–v2.89)
Hoy los edificios del HD-2D son láminas del dibujo 2D. Plan en `FICHAS_EDIFICIOS_3D.md`: volúmenes con la huella exacta de la colisión.
| Paso | Esfuerzo | Qué | Estado |
|---|---|---|---|
| A | LOW | Fichas de los 6 edificios y reglas comunes | **HECHO (v2.65), decisiones cerradas por delegación (v2.66)** |
| B1 | MEDIUM | Motor PURO de volúmenes: caja con nicho, tejados a dos aguas y plano, luz por cara (tono), campo `vol`, búferes, test huella = colisión | **HECHO (v2.67)**: `src/volumenes.js`, grupo 49, `tools/volumenes.js` |
| B2a | MEDIUM | Texturas por cara hechas por código (3 tonos de luz) y su prueba en Chromium | **HECHO (v2.68)**: `src/volumenes_tex.js`, grupo 50, `tools/prueba_volumenes_tex.py`, `docs/volumenes_tex_casa.png` |
| B2b | MEDIUM | Enchufar motor y texturas al pintor HD-2D, chimenea, veleta y demás piezas 3D de la Casa de Lali, captura con Three.js real y rendimiento básico | **HECHO (v2.69-v2.71): PASO B CERRADO** |
| C | MEDIUM | Casa de Oli y Laboratorio en 3D; en el 2D, colores de las casas y dibujo del laboratorio (huella nueva a propósito) | **HECHO (v2.72); laboratorio nuevo L1-L3 hasta v2.84** |
| D | MEDIUM | Centro PC, Tienda, Ermita definitivos y Fuente en volumen. **Subpasos:** D1a Centro PC (MEDIUM) · D1b Tienda + toldo 3D (MEDIUM) · D1c Ermita (MEDIUM) · D2 Fuente (MEDIUM) · D3 pruebas, documentos y ZIP (LOW) | **HECHO (v2.87; falta que el usuario lo pruebe con Three.js real en el móvil)** |
| E | MEDIUM | Tejado atenuado al pasar detrás (E1, v2.88), rendimiento, pruebas y ZIP (E2, v2.89) | **HECHO (v2.89; falta probar con Three.js real en el móvil)** |

### Fase 4 · Pulido del 2D sobre Albanota — HECHA (ID-2b-4 en v2.90, ID-2b-3 en v2.94–v2.100)
| Paso | Esfuerzo | Qué |
|---|---|---|
| ID-2b-4 | MEDIUM | Partículas (hojas, polvo, destellos) |
| ID-2b-3 | MEDIUM | Sombras proyectadas (nunca junto a árboles; se hace después de Albanota porque ahora solo hay árboles) |
Cada uno se refleja luego en el HD-2D (principio 4).

### Fase 5 · Sonido e interiores — ID-4 HECHO (v2.136); ID-5a HECHO (v2.137); ID-5b: dirección B elegida y composición del Centro PC hecha (v2.139); ID-5c HECHO (v2.140); ID-5d HECHO (v2.141); ID-5e HECHO (v2.143); ID-5f HECHO (v2.147); SIGUIENTE: ID-5g Casas; SIGUIENTE: ID-5c tras aprobar
Decidido el 6 nov: primero la ESTRUCTURA (sin arte) y después la ESTÉTICA una sola vez (biblia de interiores aprobada por el usuario), para no rehacer nada (igual que ID-1 antes de Albanota). Cada interior se dibuja en los dos pintores (2D y HD-2D) o se anota como pendiente (principio 4).
| Paso | Esfuerzo | Qué | Estado |
|---|---|---|---|
| ID-4 | MEDIUM | Música y sonido por código (8 temas por zona, efectos, botón 🔊/🔇) | **HECHO (v2.136)**; falta oírlo en móvil real |
| ID-5a | LOW | Estructura del interior del Centro PC como PLANTILLA: `maps/centro_pc.json` (sala pequeña, puerta de entrada y salida con Albanota), casillas ya existentes, sin zona de aparición, tema de música `centro_pc`; test de puertas y prueba en Chromium de entrar y salir | **HECHO (v2.137)**: `maps/centro_pc.json`, puerta `centro_pc` en Albanota [26,9], grupo 75, `tools/prueba_interior.py` |
| ID-5b | MEDIUM | Biblia visual de interiores (`docs/BIBLIA_INTERIORES.md`): paleta, materiales, suelo/paredes, mobiliario por tipo de edificio y luz interior, con 2-3 imágenes de prueba | **HECHO como propuesta (v2.138)**: `docs/BIBLIA_INTERIORES.md` + 3 imágenes; **espera tu aprobación** (A o B) |
| ID-5c | MEDIUM | Piezas de mobiliario por código (mostrador, estantes, mesas, ordenadores, camas…) en el 2D y reflejadas en el HD-2D | **HECHO (v2.140)**: `src/interiores_objetos.js`, 15 piezas, grupo 76, `tools/prueba_interiores_piezas.py`; HD-2D como láminas (animaciones pendientes) |
| ID-5d | MEDIUM | Interior definitivo del Centro PC (estética de la biblia) | **HECHO (v2.141)**: mapa 13×10, `sala_centro_pc`, mobiliario según §1b, minimapa oculto en interiores, revisión del jugador hecha; falta verlo en móvil real y HD-2D con Three real |
| ID-5e | MEDIUM | Interior de la Tienda | **HECHO (v2.143)**: mapa 11×8, `sala_tienda`, puerta en Albanota (34, 8), tema propio; falta HD-2D con Three real y móvil real |
| ID-5f | MEDIUM | Interior del Laboratorio | **HECHO (v2.147)**: mapa 13×9, `sala_laboratorio`, puerta en Albanota (14, 26), paleta violeta, tema propio; falta HD-2D con Three real y móvil real |
| ID-5g-1 | LOW | Cambio de dueños: casa azul = Oli, casa rosa = Lali | **HECHO (v2.153)** |
| ID-5g-2 | MEDIUM | Interior de la Casa de Oli (azul, aventurero; 9×7, 100% transitable, sin NPC) | **HECHO (v2.154)** con la música del exterior |
| ID-5g-3 | MEDIUM | Interior de la Casa de Lali (rosa, plantas; distribución distinta) | **HECHO (v2.158)** con la música del exterior |
| ID-5m | LOW | **Cambiado (7 nov, online):** un solo tema genérico «interior doméstico» para todas las casas, no uno por casa | **HECHO (v2.186)**: tema `casa` compartido |
| ID-5g-4 | MEDIUM | Idea aparte, sin decidir: cambio completo de identidad de color (campana, bancos, camas y ropa de Oli y Lali en 2D/3D) | Opcional |
| ID-5h | MEDIUM | Interior de la Ermita (la Fuente es exterior: sin interior) | **HECHO (v2.161)** |
Un interior por sesión, con su ZIP. Los pasos ID-5d..h pueden reordenarse a tu gusto.

### Fase 6 · Dos jugadores y personalización  (ORDEN NUEVO: 1.3d va antes de la Fase 7)
| Paso | Esfuerzo |
|---|---|
| 1.3d dos móviles (órdenes por PeerJS, ya preparado en el motor: órdenes + semilla) | MEDIUM |
| 1.3e personalización del personaje (nombre editable y complementos; solo apuntada; roles fijos: Oli y Lali) | pendiente de decidir |
| 1.3f guardado de partida (estado serializable con versión; móvil ahora, servidor después) | MEDIUM |

### Fase 7 · Combate, captura y evolución
| Paso | Esfuerzo |
|---|---|
| 1.6 combate por turnos clásico (gimnasios) | MEDIUM |
| 1.7 Choque en tiempo real en el mapa y captura | MEDIUM |
| Captura de la pesca: enganchar el salto del pez (v2.181) a una captura real y variar el pez por zona de profundidad | MEDIUM |
| Condiciones de evolución: nivel mínimo + objetos (14) y pareja con el cascabel (`HISTORIA_Y_MUNDO.md` 4 ter) | MEDIUM |

### Fase 8 · Criaturas: de 20 a 200 líneas (≈410 formas)
Se hace por lotes; en cada lote: ficha y aprobación (LOW) y dibujo (MEDIUM o LOW según el lote, se dice al empezar). **El espacio entre criaturas se decide al final**, al tener todas.
| Hito | Líneas | Lotes |
|---|---|---|
| 1 · Nivelar Sombra; Épica y Legendaria por elemento | 50 | 3 |
| 2 · Comunes y Raras en proporción | 100 | 5 |
| 3 · Dobles elementos y segundas variantes | 150 | 5 |
| 4 · Cierre y equilibrio final | 200 | 5 |
Las regiones (Silvara, Carbuna, Marenda, Fulgoria, Cirrena, Obsidra, Umbrada) se construyen tras el combate, con Hoja como molde. Falta la búsqueda de originalidad de regiones y pueblo.

### Orden recomendado
Ver «ORDEN DE EJECUCIÓN» arriba (v2.187). Antes: Fase 2 → 3 → 4 → 5 → 6 → 7 → 8. Las fases 3 y 4 se pueden intercalar si prefieres ver antes las partículas. El orden lo decides tú; no empiezo nada sin tu «hazlo».

## 4. Decisiones del usuario (se mantienen)
1. Voltel es **Rara** (3 fases) (v1.2). Nombres estilo Charmander-Charmeleon-Charizard, sin diminutivos «-ín» (v1.1). Tamaño y peso propios por línea y fase (v1.1). Reparto de fases ≈ 25 / 45 / 30 %. Zefirax 30×30 (v2.1).
2. Meta de **200 líneas con todas sus evoluciones** (≈410 formas); dobles elementos hasta el 20 % (v2.2-v2.3). Rangos, arquitectura técnica y sistema de nombres delegados en Claude («lo más profesional posible»). Dandel y Perlel se quedan.
3. Dos jugadores cooperativos que **pueden separarse** en mapas distintos; mapas con **editor propio** (`tools/editor_mapas.html`) y un archivo por mapa en `maps/` (v2.10).
4. Gimnasios con **combate por turnos** y también **combate en tiempo real en el mapa** (v2.10). Historia sin gran villano, con rival amistoso por región; cada jugador personaliza su personaje; tono cálido con momentos épicos (v2.11-v2.12).
5. Evolución: **nivel mínimo + objetos** y **pareja** con el cascabel; sin condiciones de lugar ni de hora (v2.13).
6. Nombres aprobados (v2.14): mundo **Tonavia**, pueblo **Albanota**, regiones Silvara, Carbuna, Marenda, Fulgoria, Cirrena, Obsidra y Umbrada.
7. **Identidad antes que interiores** (v2.20): el mundo se hace bien una vez; criaturas ocultas mientras tanto (v2.19).
8. Sombreado: el estilo actual + sombreado (luz arriba-izquierda); suelo limpio; sin sombras junto a árboles. Criaturas de Agua y Eléctrico: no seguir con muchos píxeles de varios colores (2 nov). Las 20 criaturas actuales están aprobadas.
9. Albanota (3 nov): pueblo inicial 48×36, sin criaturas salvajes en el juego final, río recto, caminos centrados, sin mirador, sin árboles nuevos (solo el original, y por ahora ninguno).
10. **HD-2D (4 nov):** se prueba en paralelo; quiere un botón en partida para pasar de 2D a HD-2D; **el mapa provisional no pasa al HD-2D**, solo Albanota (con la referencia posiblemente mejorada antes). Oli y Lali se implementan en el HD-2D.
11. No tocar a Oli y Lali en el 2D (decisión anterior, solo criaturas); respuestas breves en español (usa el móvil).

## 5. Reglas que no cambian
Cada fase de una criatura: silueta, paleta y rasgo propios; colores planos y contorno oscuro; vista de espaldas sin cara; redibujar a la medida (no reescalar). Primero la ficha y su aprobación; después el dibujo, una línea por ZIP. Combate, captura y evolución con condiciones solo en su paso (Fase 7).
- v2.169 Zefirax 3D pasos 2-5 hecho; quedan 6-7
- v2.169 Zefirax 3D completo (pasos 1-7)
