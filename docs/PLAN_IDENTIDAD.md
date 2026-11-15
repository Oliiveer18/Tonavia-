> **Nota (v2.52):** el orden vigente de todos los pasos (incluido ID-3 Albanota en 4 subpasos, el modo HD-2D y el resto del juego) está en `ROADMAP.md`. Este documento conserva el detalle del bloque de identidad.

# PLAN DE IDENTIDAD VISUAL Y SONORA · Criaturas de Lali y Oli (v2.20)

Documento de plan (solo documentos: no hay cambios de código en la v2.20). Fija **qué se hace primero para que el mundo tenga identidad única y aspecto profesional, y en qué orden, para no rehacer mapas ni interiores más adelante**. Lo decidió el usuario el 2 de noviembre de 2026; el plan fue propuesto por Claude y confirmado por él.

## 1. Decisión del usuario (v2.20)
1. **Antes del Centro PC y de cualquier interior, el mapa principal necesita esencia e identidad.** Hoy es un suelo plano con hierba, árboles y caminos: no transmite el juego ni su historia.
2. Objetivo: aspecto **profesional, detallado y «promocional»** (que un tráiler o una captura se vean como un juego de verdad), hecho **una sola vez**, sin volver a rehacer partes.
3. **El espacio entre criaturas se hace al final**, cuando se implementen todas. Faltan **+160 líneas y sus evoluciones** por crear visualmente; hasta entonces las criaturas siguen ocultas (interruptor `AJUSTES.VISIBLES`, v2.19) y no se colocan en el mapa.
4. Orden confirmado: **ID-1 biblia visual → ID-2 motor con capas → ID-3 Albanota → ID-4 música y sonido → ID-5 Centro PC (el antiguo 1.3c)**. Un ZIP por paso y PARAR tras cada uno.

## 2. Punto de partida (honesto)
- Mapa `pueblo_inicial` de 36×26 casillas de 16 px (formato 1 de `maps/`), con 17 casillas del editor + 12 nuevas dibujadas en `game.js`. **Una sola capa de suelo**: nada pasa por detrás de las copas, no hay objetos con altura, ni animación de casillas, ni luz, ni música ni sonido.
- El mapa es una prueba técnica («Pueblo Inicial v1.4»); no representa Albanota ni la premisa (el mundo hecho de siete sonidos, el cascabel de dos mitades).
- Lo que sí está: pixel art de contorno oscuro y colores planos, Oli y Lali, 41 formas de criaturas, motor de mapas (puertas, bordes, anclas), estado separado del dibujo y editor de mapas.

## 3. Principios
1. **Un solo estándar.** Todo (pueblo, rutas, cuevas, gimnasios, interiores, menús) comparte paleta, contorno, luz y reglas; se fija en ID-1 y no se discute en cada mapa.
2. **El mundo es música** (pilar 2 de `HISTORIA_Y_MUNDO.md`). La identidad se ve y se oye: detalles con forma de nota, losas de camino como teclas, ondas del Eco en el agua, partículas del cascabel, motivos por elemento y por región.
3. **Siempre dos** (pilar 1): lugares y detalles pensados para dos personas (bancos dobles, puertas de dos hojas, el cascabel que suena cuando están juntas).
4. **Pixel art artesanal** (pilar 3): contorno oscuro y colores por bandas (no degradados), todo dibujado por código.
5. **Tono cálido con momentos épicos:** el día a día es acogedor y detallado; la música, el color y la puesta en escena crecen al devolver un Eco, con los líderes y con Zefirax.
6. **Hacerlo una vez:** primero el formato y el motor, después el contenido. Los mapas se dibujan con el editor sobre el formato final.
7. **El estado no depende del dibujo:** animaciones, luz y partículas viven en `game.js` (solo dibujo) y en un reloj visual propio; nunca en `G.motor`. Así los dos móviles comparten partida sin sincronizar adornos.

## 4. Sobre «nivel AAA» (aclaración)
Con pixel art hecho por código se puede llegar a un acabado **muy cuidado y coherente, comparable a un juego indie premiado**. «AAA» literal (producción de cientos de personas, arte pintado a mano, doblaje) no es realista y no es el objetivo. Lo que más se nota es: dirección de arte coherente, animación, luz, capas con profundidad, música y sonido. Eso es lo que persigue este plan.

## 5. Pasos
Cada paso: avisar antes del nivel (LOW/MEDIUM) y de lo que se hará, esperar la confirmación del usuario, entregar **un ZIP y parar**. Comprobar siempre con captura de móvil 390×844 antes de entregar y sin prometer que queda bien sin verlo. Presupuestos de la v2.9 (`dist` ≤ 3 MB con 410 formas, arranque ≤ 1 s con CPU 4× más lenta, caché ≤ 300 sprites) y huella de los 656 sprites de criaturas **sin cambios** salvo que el paso diga lo contrario.

### ID-1 · Biblia visual (MEDIUM)
- **Qué:** documento `docs/BIBLIA_VISUAL.md` con paleta global y paleta por región (Albanota + 7 regiones), reglas de contorno, sombra y luz (por bandas), escala de personajes frente a edificios y árboles (casilla de 16 px), catálogo de motivos «de música» por elemento y región, reglas de animación (cuántos cuadros, qué se mueve y con qué ritmo), y reglas de UI (menús, diálogos, galería) que comparten el estilo.
- **Entrega:** el documento y **2 o 3 imágenes de prueba** (un trozo de Albanota con direcciones artísticas distintas) hechas por código, para que el usuario **elija la dirección** antes de seguir.
- **Prueba de cierre:** imágenes revisadas en móvil; paletas comprobadas (contraste de texto, daltonismo básico); decisión del usuario anotada en `SESION.md`.
- **Riesgo:** elegir mal aquí se paga en todo lo demás; por eso es el primero y lleva aprobación explícita.

### ID-2 · Motor de dibujo con capas (MEDIUM; se parte en ID-2a y ID-2b si crece)
- **Qué:** **formato 2 de `maps/`** definido una sola vez: capas de suelo, decorado bajo, objetos con altura (con su parte «encima» que se dibuja después de las entidades), y colisiones aparte. Dibujo de entidades **ordenado por Y** (se pasa por detrás de copas, tejados, vallas). **Casillas animadas** (agua, hierba y flores con viento, antorchas) con un reloj visual único. **Luz por bandas**, sombras proyectadas y **partículas** (polen, notas, chispas del cascabel). Cámara y zoom enteros como ahora.
- **Migración:** `maps/pueblo_inicial.json` pasa al formato 2 sin cambiar lo que se ve (prueba de captura idéntica antes de añadir decorado); el editor de mapas se actualiza al formato 2 y sigue abriendo mapas del formato 1.
- **Prueba de cierre:** captura idéntica tras la migración; `node test.js` y `node tools/equilibrio.js` sin fallos; huella de sprites de criaturas idéntica; presupuestos medidos (fotogramas por segundo en móvil de gama baja simulado, peso y arranque); `G.mundo.validar()` con mapas falsos del formato 2.
- **Riesgo:** rendimiento al dibujar capas y animaciones en móviles modestos (se mide, y se cachea el suelo en lienzos por trozos si hace falta).

### ID-3 · Albanota, corte vertical (MEDIUM; se parte por zonas si crece)
- **Qué:** rehacer el pueblo inicial con el estándar de ID-1/ID-2: plaza con el motivo del cascabel, casas con puertas (los interiores llegan en ID-5), caminos con identidad, carteles, vallas, huertos, agua con ondas, vida (detalles animados, partículas) y las zonas de aparición de los 7 claros integradas con el paisaje. Tamaño propuesto **48×36** (el del plan de mundo); las anclas y zonas se conservan o se actualizan en `maps/`.
- **Entrega:** mapa final de Albanota, capturas de móvil y la **plantilla de «cómo se hace un pueblo»** que copiarán los demás.
- **Prueba de cierre:** todas las zonas alcanzables a pie, ninguna criatura (cuando estén visibles) pisa árboles ni agua, anclas válidas, 4.000 pasos de simulación sin atascos, presupuestos y captura de móvil.

### ID-4 · Música y sonido por código (MEDIUM)
- **Qué:** motor de audio con la Web Audio API (sin archivos externos): un tema por zona (Albanota primero), efectos de pasos, puertas, hablar, evolucionar y el cascabel, con **mute y volumen**, y arranque solo tras un toque del jugador (regla de los navegadores móviles). La música reacciona a la premisa (el cascabel suena cuando los dos jugadores están cerca).
- **Prueba de cierre:** sin errores en móvil; no suena nada antes del primer toque; peso del `dist` dentro del presupuesto; el audio no toca el estado de la partida.
- **Riesgo:** el sonido no se puede verificar sin escucharlo: se entregan los temas con un botón de prueba y el usuario decide.

### ID-5 · Interiores y Centro PC (LOW) — antiguo paso 1.3c
- **Qué:** Centro PC compartido (14×12) con puerta y «volver», y después casas y tienda (10×8), ya con el estándar y el formato 2.
- **Prueba de cierre:** entrar y volver a la puerta de origen, sin criaturas dentro, captura de móvil.

Después, sin cambios de orden: **1.3d dos móviles (MEDIUM)** → 1.3e personalización (solo apuntada) → 1.6 combate por turnos → 1.7 Choque en tiempo real y captura → regiones (2.x), con Hoja como molde.

## 6. Lo que NO se hace en este bloque
- No se dibujan criaturas nuevas ni se tocan las 41 formas, sus datos o la galería.
- No se decide el **espacio entre criaturas** ni su colocación en el mapa: va **al final**, al implementarlas todas (`AJUSTES.CASILLAS_POR_HUECO`, `SEPARACION`, `MAX_HUECOS`, `LEJOS_INICIO`, y el número y la separación por mapa).
- No se toca a Lali y Oli (aspecto base).
- No se implementan combate, captura ni condiciones de evolución.

## 7. Decisiones que se proponen al usuario durante el bloque
1. **ID-1:** la dirección artística entre las 2 o 3 propuestas; si el juego tiene **ciclo de día y noche** o una luz fija por zona (propuesta de Claude: luz fija por zona, con momentos especiales por historia; el ciclo real solo si lo pide, porque cuesta rendimiento y complica los dos móviles).
2. **ID-3:** tamaño final de Albanota y qué edificios lleva (por defecto: Centro PC, tienda, 2 casas de los personajes, laboratorio y plaza).
3. **ID-4:** estilo de la música (propuesta: melodías cortas por zona que se pueden superponer, instrumentación sencilla).

## 8. Decisión del usuario (v2.21): dirección artística y paso A
- El usuario no quiso una dirección artística nueva (una anterior no le convenció): **se mantiene el estilo actual y se le añade sombreado** (luz arriba-izquierda, tonos con cambio de color, contorno selectivo). Por eso ID-1 no entrega 2 o 3 direcciones: queda reducido a `docs/REGLAS_DE_LUZ.md`.
- **Hecho en la v2.21 (paso A):** sombreado automático de las 41 formas y del suelo del mapa, con interruptor (botón «Sombras», `?sombras=0`). Los sprites de criaturas SÍ cambian con el sombreado encendido (la regla de «huella idéntica» de la sección 5 se cumple con el interruptor apagado).
- **No se quiere:** manchas en el césped, línea blanca en el lago, sombras en el suelo junto a los árboles.
- **Pendiente:** retoque a mano de las criaturas; Oli y Lali (necesita permiso); ID-2 en adelante sin cambios.

## 9. Siguiente en identidad (v2.22, solo documentos)
- El usuario pidió (2 nov) un método para sombrear todas las criaturas, y las futuras, igual y de forma profesional. El plan está en `REGLAS_DE_LUZ.md`, sección 7 (rampas compartidas + volumen calculado + test de luz; pasos B1 → B2.x → B3). **Espera su «hazlo» para B1.**
- Siguen pendientes sin cambios de orden: ID-2 (motor con capas), ID-3 Albanota, ID-4 música, ID-5 Centro PC; Oli y Lali (permiso).


## 10. ID-1 hecho (v2.29)
`docs/BIBLIA_VISUAL.md` fija el estándar único (sin direcciones alternativas, por la decisión de la v2.21), con 8 paletas regionales, luz, escala, animación, motivos de música e interfaz, más `tools/paletas.py`. Espera la aprobación de su sección 11 antes de empezar ID-2.

## 11. ID-2a hecho (v2.33)
Formato 2 de `maps/`, `src/capas.js` (capas, orden por Y con «encima», reloj visual, agua animada opt-in), migración de `pueblo_inicial` con captura idéntica y editor al día. **ID-2b (pendiente, MEDIUM):** luz por bandas, sombras proyectadas (sin sombras junto a árboles, regla del usuario), partículas y casillas animadas del paisaje. El mapa de Albanota va en ID-3.
