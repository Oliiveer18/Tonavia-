# AUDITORÍA TÉCNICA PREVIA · PROYECTO MULTIVERSO
Proyecto: «Criaturas de Lali y Oli», v2.350 (13 nov 2026). Auditor: Sonnet 5.5. Destinatario: Fable 5.2 (con el ZIP `criaturas_v2_350.zip`).
No se ha modificado nada del juego para este informe. Todo lo afirmado sale de leer el código o de ejecutarlo en Node, salvo lo marcado.

**Leyenda:** **[V]** verificado (leído y/o ejecutado) · **[P]** existe parcialmente · **[N]** no existe · **[?]** no verificado (y por qué).

---
## 0. Resumen ejecutivo (lo que más importa)
1. **Hay una base muy reutilizable:** motor puro y determinista (`est` serializable + órdenes + semilla), mapas como datos JSON unidos por nombre, un precedente de «mundos generados por id» (Profundidades), y una simulación de entrenadores por eventos con «puesta al día» offline. **[V]**
2. **El mundo es un único espacio:** un solo diccionario global de mapas (`G.mundo.mapas`), un solo grafo para los entrenadores (`datos/mundo.json`), un solo calendario/reloj, una sola población (24) y un solo tablón. No existe el concepto «dimensión». **[V]**
3. **Hay un fallo de guardado real que Fable debe corregir ANTES de crear dimensiones:** si el mapa guardado de un jugador no existe al cargar (una dimensión retirada, renombrada o aún no instalada), `restaurar` descarta TODO el progreso de ese jugador (criaturas, Brillos, XP, mochila…), no solo su posición. Reproducido en ejecución: tras guardar con Brillos=777 y XP=3000 y cambiar el mapa a uno inexistente, al cargar quedan sin valor. Además, una versión futura (`v:2`) devuelve `null` y, como el autoguardado escribe cada 5 s, la partida entendida a medias puede sobrescribir la buena. **[V]**
4. **No hay descarga de mapas ni de estados de mapa:** `est.mapas[id]` solo crece; solo se retiran las criaturas de las zonas lejanas. Con pocas dimensiones es irrelevante; con muchas, hay que añadir carga/descarga. **[V]**
5. **Contenido que hoy está en CÓDIGO y no en datos** (bloquea que «añadir dimensiones no toque el código central»): los guiones de NPC (`src/npc.js`, `GUION`), las criaturas y sus dibujos (`lineas.js`, `formas_*.js`), parte de las luces por región (`capas.js`) y los 50 mapas del plan (solo 8 existen de verdad). **[V]**

---
## 1. Arquitectura actual
**Tecnología [V]:** JavaScript sin dependencias ni bundler. `node build.js` une `index.html` + `src/*.js` (orden en `src/orden.json`: bloques `datos` y `juego`) y mete `maps/*.json` dentro del HTML como `G.MAPAS` → un único `dist/criaturas.html` (≈2,1 MB). Pintores: canvas 2D (base) y HD-2D con Three.js (opción; Three.js y PeerJS se piden a CDN). Guardado en `localStorage`. 138 archivos en `tools/`, `test.js` con 121 grupos de comprobaciones (≈1.500 líneas `ok(`), huellas deterministas del juego 2D y clásico (`tools/huella_juego.js`).

**Normas del proyecto (en `CLAUDE.md`) que Fable debe respetar [V]:** estado nuevo en `est` y serializable; motor puro sin `Math.random`/DOM/relojes; jugadores por id (nada de `oli`/`lali` a fuego en lógica nueva); contenido como datos; guardado con versión; combate/captura puros y repetibles; todo ligero y generado por código; el 2D es la base y cada efecto va en los dos pintores o se anota como pendiente. Una sesión = un paso = un ZIP; verificación: `build` → `test` → `huella --comprobar` → pruebas de navegador.

**Estado y órdenes [V]:** `G.motor.crear(semilla)` devuelve `est = { semilla, rnd, reloj, jugadores, mapas, avisos }`; los módulos añaden `est.agentes`, `est.prof`, `est.tablon`. Todo cambio entra por `G.motor.aplicar(est, { j, t, … })`. Los pintores leen de `G.vista`.

**Mapas [V]:**
- Archivos `maps/*.json` (formato 2: `capas`, `objetos`, `anclas`, `puertas`, `conexiones`, `zonas`, `npcs`, `pesca`, `region`). Hoy hay 9 (≈26 KB en total).
- `src/mapas.js`: `preparar(j)` valida y completa cada mapa al arrancar; `G.mundo.mapas` es un diccionario global; `G.mundo.mapa(id)` lo devuelve y, si no existe, pregunta a `G.mundo.generador(id)` (hoy solo lo usa Profundidades) → **es el único mecanismo de carga perezosa que existe**. `agregar`/`quitar` añaden o quitan mapas en marcha. `validarMapas` comprueba que puertas, anclas, bordes, zonas y guaridas apunten a algo real.
- Los mapas se unen por **nombre**, nunca por coordenadas: puerta → `{mapa, ancla}`; borde (`norte/sur/este/oeste`) → mapa vecino + desplazamiento, con reciprocidad exigida.
- Paquetes del editor (`mapas_guardados.js`, `mapas_ui.js`): el jugador importa un paquete (`MAX_MAPAS 40`) que se guarda en el navegador y **sustituye por id** a los oficiales. Es un segundo origen de mapas con validación propia.
- `INICIAL = { mapa: 'albanota', ancla: 'inicio' }` fijo en `mapas.js`.

**Escenas, zonas y transiciones [V/P]:** no hay «escenas» como objeto. Un jugador está en `j.mapa`; la orden `colocar` (`{mapa, ancla, dx, dir}`) lo teletransporta y recalcula la aparición; las puertas usan `j.enPuerta` y una pila `j.volver` (4 últimas). Las zonas son rectángulos de aparición dentro del mapa (`zonas`). La presentación de la transición (fundido, sonido) está en `game.js` **[?]**: no la he revisado en detalle porque no afecta al diseño del motor.

**Sistemas reutilizables tal cual [V]:** motor/órdenes/semilla, `G.mundo` (mapas por nombre, anclas, puertas, validación), aparición por plan y semilla, guardado con sub-versiones, `G.red` (qué viaja, validado), `G.agentes` (núcleo), `G.profundidades` (modelo de «mundo generado + estado propio»), `G.ciclo` (hora por `est.reloj`), `G.tienda`/`G.entrenador`/`G.tablon` (economía y nivel), huellas y tests.

---
## 2. NPCs y entrenadores autónomos
**Hay dos sistemas distintos [V]:**
- **NPC estáticos** (`src/npc.js`, `dialogo_ui.js`): personajes fijos en `maps/*.json → npcs` (tipo `npc`): Alba, Teo, la doctora, el tablón, etc. Sprite por código, **guion en código** (`const GUION` en `npc.js`), interacción por la orden `hablar`. **[V]**
- **Entrenadores autónomos** (`agentes*.js`, `docs/AGENTES.md`): 24 entrenadores (`datos/agentes.json`: población, rasgos, ambiciones, nombres, frases). Simulación por **eventos** (cola de prioridad, no por cuadros), el coste depende de lo que pasa y no de cuántos son; el cuerpo en el mapa es una **proyección pura** del estado (posición = f(paso, tiempo)). Tienen la forma de datos de un jugador (`equipo`, `prog`, `vida`, `brillos`, `mochila`, `esferas`), así que usan `G.nivel`, `G.tienda`, `G.pesca`, `G.combate` con las mismas reglas. Azar propio por entrenador (no tocan `est.rnd`).

**Terminado [V]:** mente (memoria, relaciones amigo/rival/aliado, ambición, rasgos, objetivos por utilidad, planificador de metas), acciones (comprar, vender, pescar, curar, combatir salvajes, capturar, duelos), trato con el jugador (hablar, retar, ayudar), red entre dos móviles (el anfitrión manda la población entera; el invitado la adopta y sigue simulando), guardado con versión, **puesta al día offline** (`ponerAlDia`, con tope `alDiaMax`), diagnóstico (`tools/agentes_diag.js`), integración con el tablón de intercambios (v2.344).
**Incompleto o inexistente:**
- **[V]** El mundo de los entrenadores es **un único grafo estático** `datos/mundo.json` (50 mapas planificados, **solo 8 con mapa real**; el resto se simulan con «tiempos nominales»). Se construye una sola vez al cargar `agentes.js` (`W`). No hay grafos por dimensión.
- **[V]** Una sola población (`est.agentes.pob`, 24) sin campo de dimensión. Sus «lugares» son pueblos y rutas con servicios (`cura`, `tienda`, `pesca`, `salvaje`).
- **[V]** Actividades = el conjunto fijo `OPS/ACC` de `agentes_acciones.js`. No hay eventos de mundo, misiones, ni comercio propio por dimensión.
- **[N]** Nada de entrenadores que cambien de dimensión, ni gimnasios/jefes como agentes.
**Estado [V]:** JSON puro `est.agentes = { v, sem, n, acc, deuda, sb, pob, bat, cron, cont }`. Lo que no se guarda (cola, índices, combates en memoria) se reconstruye; un combate a medias se repite desde su semilla.
**Reutilizar:** todo el núcleo y la forma «entrenador = jugador». **Desarrollar:** grafo y población por dimensión, campo `dim` en cada entrenador, y que un mapa sin dibujar de una dimensión inactiva siga contando (ver §7).

---
## 3. Criaturas y apariciones
**Registro [V]:** `src/lineas.js` es la **única fuente de datos**: 20 líneas evolutivas → 41 formas (nº, fam, raíz, autor, elementos, rareza `comun|rara|epica|legendaria`, evolución, peso). `creatures.js` deriva `G.CREATURES`, `G.FORMAS`, `G.LINE_PLAN`, `G.TRAITS`. **Los dibujos viven en código** (`formas_<elemento>.js`, 7 elementos) y se enlazan por id. Añadir una criatura = una entrada en `lineas.js` + sus dibujos (no es solo datos).
**Aparición [V]** (`src/aparicion.js`):
- Cada mapa trae `zonas` (rectángulo + `elemento`) y `guaridas` (npc `guarida`, solo legendarias).
- **Plan por mapa y semilla:** `plan(semilla, mapa)` calcula huecos y qué línea sale en cada uno usando un azar derivado de `hash(semilla | id del mapa)`: misma semilla, mismo plan en los dos móviles.
- Reglas: nº de huecos = casillas libres / `CASILLAS_POR_HUECO` (18; máx. 6); **rareza sorteada primero** con `PESOS {comun:60, rara:28, epica:10}` y luego línea **filtrada por elemento de la zona** (los dobles salen en ambas); `MAX_IGUALES {3,2,1}`; legendarias nunca sorteadas; `FIJAS` garantiza una línea por elemento.
- **Activación por cercanía:** una zona se activa a ≤9 casillas de un jugador y se retira a >13 (histéresis); la criatura vuelve al mismo hueco; máx. 24 activas por mapa. Interruptores `VISIBLES` y `SOLO`.
- **El estado de las criaturas de un mapa no se guarda** (salen de la semilla); no hay condiciones por hora/clima (`G.ciclo` existe pero la aparición no lo usa). **[V]**
**Cómo dar distribuciones propias por dimensión sin limitar la variedad (propuesta):**
- Mantener el algoritmo y cambiar solo **de qué pool y con qué pesos se alimenta**. Dato `apariciones` en la dimensión (y opcional por zona): `{ rareza: {…}, multiplicadores: { elemento|linea: factor }, excluir: [...], exclusivas: [...], cond: { hora, clima } }`.
- **Multiplicadores sobre el pool completo, no filtros duros:** por defecto toda línea cuyo elemento encaje sigue disponible con peso 1; la dimensión solo sube, baja o excluye. Así ninguna línea queda fuera salvo que el diseñador lo decida.
- El id de la dimensión entra en el hash del plan; en la dimensión original no cambia nada (para no romper las huellas).
- Para que el tablón/crianza/captura sigan coherentes, la distribución debe poder consultarse como función pura: `G.aparicion.tabla(dim, zona) → pesos`.

---
## 4. Guardado y persistencia
**Cómo funciona [V]** (`src/guardado.js`): clave única `criaturas_partida` en `localStorage`; `VERSION = 1`; `serializar(est)` produce `{ v, semilla, reloj, jugadores, prof, agentes, tablon }`; `restaurar` valida TODO (un guardado roto no debe romper la partida). Autoguardado cada 5 s. `migrar(d)` **no hace nada** (solo rechaza `v<1` o `v>VERSION`). Los datos nuevos se añadieron siempre como campos opcionales con sub-versiones (`iv`, `cv`) en vez de subir `VERSION`.
**Qué persiste [V]:** por jugador: mapa, posición, dirección, `capturas`/`records` (peces), esferas, `sinId` (caja, ≤500 ejemplares), `cajaMax`, buzón, `tx`, `xpE`, `sigId`/`ids`, `motes`, `prog`, `vida`, `equipo`, `brillos`, `mochila`, `prof`, `crianza`, `volver`; globales: semilla, reloj, entrenadores, expedición de Profundidades, tablón.
**Qué NO persiste [V]:** `est.mapas` (criaturas de los mapas, que se regeneran por semilla), la pesca en curso, el estado de red.
**Tamaño [V, medido en Node]:** ≈68 KB tras 1.000 s de juego simulado con 24 entrenadores. **[?]** No he medido el crecimiento a largo plazo (el límite de `localStorage` es ≈5 MB) ni el coste de `JSON.stringify` completo cada 5 s en un móvil.
**Riesgos de pérdida, duplicación e incompatibilidad:**
1. **Pérdida por mapa inexistente [V, reproducido]:** `guardado.js` línea ~28 hace `return` si el mapa guardado del jugador no existe o es inválido y esto salta TODA la restauración de ese jugador. Con dimensiones, retirar/renombrar una dimensión o cargar en un dispositivo sin ella pierde el progreso. *Arreglo recomendado:* restaurar siempre el progreso y, si el mapa falla, colocar al jugador en el ancla segura de su dimensión (o del Nexus).
2. **Sobrescritura tras versión futura o fallo de restaurar [V por lectura]:** si `restaurar` devuelve `false`, el juego arranca nuevo y el autoguardado de 5 s puede machacar el guardado bueno. *Arreglo:* no autoguardar mientras el guardado leído sea ilegible o de versión futura; mantener una copia `criaturas_partida_bak` antes de cada migración.
3. **Una sola clave y un solo JSON:** con N dimensiones el JSON crece y cualquier error corrompe todo. *Arreglo:* ver §7 (secciones por dimensión y límites de tamaño).
4. **Duplicación:** el tablón conserva las criaturas en custodia y está probado con un fuzz de 400 operaciones **[V]**; las dimensiones no deben crear un segundo camino de «entregar criatura» fuera de `G.equipo.agregar`.
5. **Paquetes del editor [V]:** pueden sustituir mapas oficiales por id; si una dimensión usa ids de mapa, hace falta un espacio de nombres (p. ej. `dim/mapa`) para que un paquete no pise mapas de una dimensión.

---
## 5. Rendimiento y escalabilidad
**Medido [V, solo en Node, no en móvil]:** 20.000 pasos de simulación (1.000 s de juego, 2 jugadores + 24 entrenadores) ≈ 0,7 s. **[?]** El rendimiento real en iPhone no está medido en esta auditoría.
**Limitaciones [V]:**
- Todos los mapas se preparan al arrancar y viven en `G.mundo.mapas` (9 mapas ≈ 26 KB, irrelevante hoy; los 50 planificados serían manejables; muchas dimensiones, no).
- `est.mapas` no se limpia nunca; `aparicion.actualizar` recorre los mapas con estado.
- La simulación de entrenadores es global; cada entrenador cuesta por evento, pero el JSON de `est.agentes` crece con población, crónica (`cron`) y relaciones.
- El HTML único incluye todos los datos; todo contenido nuevo engorda la descarga inicial.
**Sin tenerlas todas cargadas (propuesta):**
- **Proveedores de mapas:** generalizar `G.mundo.generador` (hoy un solo gancho) a una lista de proveedores (oficial, editor, dimensión, generado) con carga bajo demanda. En el build, empaquetar cada dimensión como bloque JSON comprimido que se analiza al entrar (sigue siendo un único archivo).
- **Descarga:** al salir de una dimensión y no quedar jugadores, serializar sus estados de mapa (solo lo que difiere del plan: cofres, puzles, criaturas capturadas) y quitarlos de `est.mapas`/`mundo.mapas`.
- **Simulación latente:** las dimensiones sin jugadores no se simulan; al volver se aplica la «puesta al día» (ya existe `ponerAlDia` con deuda acotada) y, para entrenadores, una proyección abstracta como la actual de los mapas «sin dibujar».
- **Muchos NPC y criaturas:** el diseño por eventos y proyección ya escala bien; el techo previsible está en el JSON del estado y en el pintado, no en la simulación. Mantener `MAX` de criaturas activas por mapa y limitar `cron`/relaciones por dimensión.
**Arquitectura recomendada:** núcleo central pequeño + **dimensiones como datos** + estado namespaced por dimensión (ver §7).

---
## 6. Preparación para multijugador
Estado actual **[V]:** dos jugadores fijos (`oli`, `lali`) creados en `motor.crear` (hardcode en `motor.js`, `red_peer.js` ×13, `game.js`, `entrenadores.js`…). Red punto a punto con PeerJS; autoridad **por jugador** (cada móvil manda el suyo) salvo los entrenadores (manda el anfitrión).
Decisiones que Fable debe tomar desde el principio:
1. **`j.dim` (dimensión) en cada jugador y en cada orden relevante;** el estado de una dimensión debe poder alojarse en otra «instancia» (servidor, otro móvil).
2. **Semilla por dimensión derivada** (`hash(semilla | dim)`), idéntica en todos los clientes, sin tocar la de la dimensión original.
3. **Jugadores por id sin nombres a fuego en lógica nueva;** parametrizar `crear(semilla, jugadores)`. No obliga a cambiar Oli/Lali hoy, pero la lógica nueva no debe suponer dos jugadores.
4. **Estado de dimensión separable** (`est.dim[id]`), de modo que un servidor pueda ser autoritativo por dimensión y un cliente suscribirse solo a la suya.
5. **Todo cambio por órdenes** (ya es la norma) y combate/captura/portales validables por el servidor; los portales no deben dar objetos ni criaturas por sí mismos.
6. **Nada de relojes de pared en el motor** (la «puesta al día» usa `Date.now()` solo en `game.js`, fuera del motor puro).
7. El tablón es hoy un estado global único: decidir si es del Nexus (recomendado) o por dimensión.

---
## 7. Diseño del futuro motor dimensional (solución recomendada, sin complejidad innecesaria)
**Principio:** una *dimensión* es un paquete de **datos** que declara su mundo; el motor solo la interpreta. Todo lo ya existente pasa a ser la dimensión `tonavia`, sin cambios de ids ni de huella.

**7.1 Registro de dimensiones (dato nuevo)** — `datos/dimensiones/<id>.json` + `G.dimensiones`:
```
{ "v": 1, "id": "...", "nombre": "...", "entrada": { "mapa": "...", "ancla": "..." },
  "mapas": "prefijo/lista", "regiones": { "<id>": { "luz": ..., "musica": ..., "tema": ... } },
  "apariciones": { ... },            // §3
  "entrenadores": { "poblacion": N, "grafo": "...", "ajustes": { ... } },
  "economia": { "precios": factor, "tienda": [...], "premios": factor },
  "reglas": { "ciclo": "propio|global", "requisitos": [...] },
  "npcs": "datos/npcs/<id>.json" }
```
Añadir una dimensión = añadir un JSON + sus mapas + (si hace falta) contenido; **no tocar código central**.
**7.2 Identificadores:** ids de mapa con espacio de nombres `dim/mapa`; los actuales siguen siendo válidos y pertenecen a `tonavia` (compatibilidad con guardados y huellas).
**7.3 Nexus y portales:** el Nexus es **una dimensión más** (con su mapa/s) cuyo contenido son portales. Un portal es una **puerta con destino ampliado**: `destino: { dim, mapa, ancla }` (la puerta actual es el caso `dim` omitido). Requisitos (`requisitos`) evaluados por el motor con datos del jugador (nivel, ecos, objetos). La transición reutiliza `colocar`, añadiendo `j.dim`.
**7.4 Estado por dimensión:** `est.dim = { <id>: { v, mapas: {…}, agentes: {…}, flags: {…}, economia: {…} } }` (el estado actual de `tonavia` se mueve ahí o se enlaza con `est.mapas`/`est.agentes` por compatibilidad en la v2 del guardado). El estado de un mapa guarda **solo lo que difiere del plan**.
**7.5 Mapas en regiones, zonas e interiores:** ya soportados por datos (`region`, `zonas`, `puertas` a interiores, `conexiones` por borde). Falta que `region` pueda llevar luz/música/tema por datos (hoy parte está en `capas.js` por código).
**7.6 Aparición contextual:** §3 (tablas con multiplicadores + condiciones opcionales por hora/clima usando `G.ciclo`).
**7.7 NPC, entrenadores y economía propios:** `G.agentes` pasa a recibir `dim`; un grafo y una población por dimensión activa; las dormidas se simulan por «puesta al día». La economía de `G.tienda` ya depende del jugador (`precioCompra(id, j)`); añadir factores por dimensión como parámetro de datos. Sacar `GUION` de `npc.js` a datos antes de crear mucho contenido de NPC.
**7.8 Carga/descarga:** §5.

---
## 8. Entrega para Fable
### 8.1 Diagnóstico
Ver §0–§6. Estado: motor sólido y preparado para online; **sin concepto de dimensión**; un fallo de guardado crítico; contenido de NPC/criaturas aún en código; entrenadores atados a un grafo único.

### 8.2 Sistemas existentes que Fable debe REUTILIZAR (no reescribir)
`G.motor.aplicar` y la norma de órdenes · `G.mundo` (mapas por nombre, anclas, puertas, `validarMapas`, hook `generador`) · `G.aparicion` (plan por semilla y activación) · `G.agentes` (núcleo por eventos, `ponerAlDia`, forma «entrenador = jugador») · `G.profundidades` como modelo de «mundo generado por id + estado propio + serialización» · `G.guardado` (validadores `*Ok`, sub-versiones) · `G.red`/`agentes_red` (qué viaja y cómo se valida) · `G.ciclo` · `G.tienda`/`G.entrenador`/`G.tablon` · `tools/huella_juego.js` y `test.js`.

### 8.3 Sistemas que Fable debe MODIFICAR
1. **`guardado.js`:** arreglar la pérdida por mapa inexistente; no sobrescribir un guardado ilegible/futuro; copia de seguridad; `VERSION` 2 con `migrar` real (v1 → todo en `tonavia`); secciones por dimensión y límites de tamaño.
2. **`mapas.js`:** proveedores de mapas con carga perezosa, ids con espacio de nombres, puertas con `destino.dim`, `INICIAL` por dato; que `mapas_guardados` respete el espacio de nombres.
3. **`motor.js`:** `j.dim`, `colocar` entre dimensiones, `crear(semilla, jugadores)` sin `oli/lali` a fuego en lo nuevo, `est.dim`, descarga de estados de mapa.
4. **`aparicion.js`:** pool y pesos desde `apariciones` (multiplicadores, condiciones), hash con dimensión sin cambiar `tonavia`.
5. **`agentes*.js`:** grafo y población por dimensión (`W(dim)`), campo `dim` en cada entrenador, simulación solo de dimensiones activas + puesta al día de las dormidas.
6. **`npc.js`/`dialogo_ui.js`:** guiones a datos (contrato definido por Fable).
7. **`capas.js`/`luces2d.js`/`audio.js`:** luz/música por región desde datos (hoy hay `albanota` a fuego: 2 en `luces2d`, 1 en `audio`).
8. **`red_peer.js`/`red.js`:** jugadores por id, `dim` en los mensajes, validación.
9. **`tienda.js`/`tablon.js`:** factores por dimensión; decidir el ámbito del tablón.

### 8.4 Sistemas NUEVOS que Fable debe construir
`G.dimensiones` (registro, validador de datos, esquema versionado) · cargador/descargador de mapas y estados · portales y requisitos · tabla de apariciones por dimensión · estado `est.dim` y su serialización por secciones · migración de guardado · herramienta `tools/validar_dimension.js` (como `validar_mundo.js`) · pruebas de contrato.

### 8.5 Archivos y módulos concretos a revisar primero
`CLAUDE.md`, `docs/CONTINUAR.md`, `docs/AGENTES.md`, `docs/MUNDO.md`, `docs/GUIA_PROFUNDIDADES.md` · `src/mapas.js`, `src/motor.js` (crear, colocar, estadoMapa, avanzar), `src/aparicion.js`, `src/guardado.js` (líneas 18-35), `src/profundidades.js` (generador, estado, `jugOk`, gancho `estadoMapa`), `src/agentes.js` (mundo `W`, serializar/restaurar, `ponerAlDia`), `src/agentes_cuerpo.js`, `src/npc.js`, `src/lineas.js`, `src/red.js`, `src/red_peer.js`, `src/tablon.js`, `src/tienda.js`, `datos/mundo.json`, `datos/agentes.json`, `maps/albanota.json`, `build.js`, `test.js`, `tools/huella_juego.js`.

### 8.6 Dependencias y posibles conflictos
- **Huellas:** cualquier cambio que altere la semilla/plan/estado de `tonavia` rompe `huella_juego`; las huellas deben seguir iguales (la dimensión original ha de ser idéntica bit a bit).
- **Compatibilidad de guardados v1:** no deben perderse (ver riesgo 1).
- **Mapas con id fijo** (`albanota`, `tienda`, `centro_pc`) usados por: `tablon.js` (cerca del npc `tablon` en `tienda`), agentes (servicios por tipo), `INICIAL`.
- **`datos/mundo.json`** describe un mundo concreto; no debe convertirse en el grafo de todas las dimensiones.
- **Paquetes del editor** y **Profundidades** también inyectan mapas (`agregar`/generador): el nuevo cargador no debe romperlos.
- **Dos pintores (2D y HD-2D):** todo lo visual por dimensión (luz, tema) debe resolverse en ambos o anotarse.
- **Tamaño del HTML único:** el contenido de dimensiones debe cargarse bajo demanda dentro del mismo archivo.

### 8.7 Arquitectura recomendada
La de §7: dimensiones como datos + estado `est.dim` + proveedores de mapas con carga/descarga + simulación latente. Sin servidores, sin base de datos, sin reescribir el motor.

### 8.8 Interfaces y contratos que deben respetarse
1. **Orden de desplazamiento:** `{ j, t:'colocar', dim?, mapa, ancla, dx?, dir? }`; `dim` omitido = la dimensión actual del jugador.
2. **Puerta/portal:** `destino: { dim?, mapa, ancla }` (los datos actuales siguen siendo válidos).
3. **Proveedor de mapa:** `proveedor(id) → mapa en formato JSON validado o null` (mismas reglas que `preparar`/`validarMapas`).
4. **Dimensión (JSON versionado):** esquema de §7.1; validador que falla ruidosamente y no deja cargar datos rotos.
5. **Estado:** serializable, con versión, validado en `restaurar` (nunca romper la partida, nunca descartar progreso por un dato malo de otra sección).
6. **Aparición:** `G.aparicion.tabla(dim, zona)` pura y determinista.
7. **Entrenadores:** `G.agentes.W(dim)`; `dim` en cada entrenador; la forma «entrenador = jugador» no cambia.
8. **Economía:** funciones de `G.tienda` con parámetro de jugador (`j.dim` resuelve el factor).
9. **Norma de motor:** puro, determinista, sin `Math.random`/DOM/relojes.

### 8.9 Orden de implementación recomendado
1. **Seguridad del guardado** (arreglo de pérdida, no sobrescribir ilegible, copia de seguridad) + tests. *Sin esto no se debe seguir.*
2. `VERSION 2` y `migrar` v1→v2 con `est.dim['tonavia']` (comportamiento idéntico; huellas iguales).
3. Registro `G.dimensiones` + esquema + validador + dimensión `tonavia` declarada por datos.
4. Proveedores de mapas, ids con espacio de nombres, carga/descarga.
5. `j.dim`, portales y transición entre dimensiones; Nexus mínimo (un mapa de prueba).
6. Apariciones por dimensión.
7. Entrenadores por dimensión + puesta al día de las dormidas.
8. Economía por dimensión; luz/música por región desde datos; guiones de NPC a datos.
9. Preparación de red (jugadores por id, `dim` en mensajes).
10. Rendimiento y límites (tamaño de guardado, carga) y cierre de pruebas.

### 8.10 Pruebas necesarias
- **Regresión:** `node test.js` completo, `huella_juego --comprobar` y `--clasico --comprobar` iguales, pruebas de navegador existentes.
- **Guardado:** v1 cargado y migrado sin pérdida; mapa/dimensión inexistente no pierde progreso; versión futura no sobrescribe; guardado corrupto parcial; límite de tamaño; ida y vuelta serializar → restaurar → hash igual.
- **Dimensiones:** validador acepta/rechaza datos; ids con espacio de nombres sin colisiones con paquetes del editor; carga y descarga conservando lo que difiere del plan; determinismo del plan por dimensión (misma semilla = mismo plan; `tonavia` idéntico).
- **Portales:** requisitos, ida/vuelta, `volver`, jugador en dimensión descargada.
- **Apariciones:** pesos multiplicativos (ninguna línea queda fuera sin exclusión explícita), tablas por zona, `MAX_IGUALES`.
- **Entrenadores:** población por dimensión, puesta al día de las dormidas, determinismo; conservación de criaturas (como el fuzz del tablón).
- **Economía:** precios y premios por dimensión sin regalar (usar `tools/equilibrio.js` y la tabla de la v2.350).
- **Rendimiento:** pasos de simulación y tamaño del guardado con N dimensiones; medir en móvil real **[?]**.
- **Red:** mensajes validados con `dim`, dos clientes en dimensiones distintas.

---
## 9. División de responsabilidades
| | **Fable 5.2** (ingeniería) | **Sonnet 5.5** (contenido e integración) |
|---|---|---|
| Guardado | Arreglo de pérdida, v2, migración, secciones, copias | — (solo usar el contrato) |
| Dimensiones | Registro, esquema, validador, cargador, portales, Nexus técnico | Crear cada dimensión como datos (JSON) según el esquema |
| Mapas | Proveedores, espacios de nombres, carga/descarga | Dibujar y componer mapas (`tools/editor_mapas`, `componer_mapa.js`), interiores, regiones |
| Apariciones | Motor de tablas con multiplicadores y condiciones | Definir las tablas de cada dimensión, zonas y guaridas |
| Entrenadores | Grafo/población por dimensión, puesta al día, dormidas | Nombres, frases, rasgos, ambiciones, rutinas y gimnasios como datos |
| NPC | Contrato de datos de guiones y migrar `GUION` | Escribir los NPC, diálogos, misiones |
| Criaturas | — | Nuevas líneas y dibujos (`lineas.js`, `formas_*.js`) |
| Economía | Mecanismo de factores por dimensión | Ajustar valores y comprobar con `equilibrio.js` |
| Visual | Que luz/música por región vengan de datos (2D y HD-2D) | Ambientación, paletas, música, integración visual |
| Red | Jugadores por id, `dim` en mensajes, validación | — |
| Pruebas | Pruebas de contrato, regresión, rendimiento | Pruebas de contenido (validador, mapas, equilibrio) |

**Reglas para no pisarse:** Fable es dueño de `guardado.js`, `mapas.js`, `motor.js`, `aparicion.js`, `agentes*.js`, `red*.js` y del esquema de `datos/dimensiones/`. Sonnet solo añade datos y contenido que cumplan ese esquema y **no toca esos archivos**. Si Sonnet necesita algo del núcleo, lo anota en `docs/SESION.md` para Fable. Fable no crea contenido de juego salvo el mínimo para probar (un Nexus y una dimensión de prueba).

---
## 10. Lo que no he podido verificar
- Rendimiento y memoria en móvil real (solo he medido en Node).
- Presentación de la transición entre mapas (`game.js`) y su equivalente en HD-2D.
- Comportamiento real de PeerJS con más de dos clientes.
- Crecimiento a largo plazo del guardado y del JSON de entrenadores.
- Cuántos de los 50 mapas planificados se terminarán (hoy 8 existen; 9 mapas en `maps/`, incluido `pueblo_inicial` de pruebas).
