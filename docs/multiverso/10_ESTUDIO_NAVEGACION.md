# ESTUDIO TÉCNICO · NAVEGACIÓN DE LA ISLA PIRATA (D4)
**Estado: PENDIENTE DE APROBACIÓN.** Solo análisis: no se ha tocado código, mapas ni la hoja de ruta, y F6 sigue pausada. Parte de la experiencia aprobada en `09_DISENO_MULTIVERSO.md` §3.5-3.6 y del código actual (v2.356: `motor.js`, `mapas.js`, `guardado.js`, `red.js`, `red_peer.js`, `aparicion.js`, `ciclo.js`, `portales.js`, contratos 06-08).

## 1. Resumen y recomendación
**Se puede construir sin rehacer el motor**, apoyándolo en lo que F1-F5 ya dejaron (mapas por dimensión, puertas/portales, bordes entre mapas, guardado por secciones, reloj único). Pero **no cabe en F6-F8 tal como están**: hace falta una entrega nueva (**«FN · Navegación»**, §7).

**Solución recomendada** (un solo diseño, §5):
1. **El mar es un mosaico de mapas normales** (3×3 de 64×64 = 192×192 casillas) unidos por los bordes que el motor ya conoce. Marca de mapa nueva `mar`: el agua se puede cruzar y la tierra no.
2. **El barco es un MODO del jugador, no una entidad con vida propia.** Navegando, la posición del barco es la del jugador (el motor ya la guarda, valida y manda por red). Atracado, el barco es solo un dato («amarrado en tal muelle»).
3. **Subir y bajar del barco = puertas** entre el muelle de la isla y el mar (mecanismo de F5).
4. **Rumbo automático por rutas marcadas en los datos** (lista de puntos entre puertos y faros, comprobadas por una herramienta), sin buscar caminos en el juego.
5. **Faros-baliza = viaje directo** entre faros descubiertos por el jugador (orden validada que coloca barco y jugador).
6. **Todo lo nuevo se guarda en una sección propia** `est.dim.pirata` (el formato v2 ya conserva secciones de dimensiones), validada al cargar.
7. **Eventos del mar deterministas** (derivados de semilla + mapa + ventana de tiempo, sin gastar el azar de la partida).

## 2. Qué soporta ya el motor (reutilizable)
| Necesidad | Lo que ya existe |
|---|---|
| Mapas por dimensión con ids `dim/mapa`, carga/descarga bajo demanda | F4 (`mapas.js`, `liberarDimensiones`) |
| Pasar de un mapa a otro caminando | `mundo.borde` + `conexiones` norte/sur/este/oeste (`motor.cruzar`) |
| Subir/bajar, entrar/salir | Puertas con destino y ancla, antirrebote `enPuerta`, velo de transición (F5, `portales_ui.js`) |
| Guardar posición y mapa de cada jugador, validar al cargar, plan B seguro | `guardado.js`: si el sitio ya no vale, vuelve a un ancla segura sin perder progreso |
| Datos de una dimensión que este juego no conoce | `est.dim.<id>` se conserva tal cual (F2) |
| Reloj único para mareas y noche | `est.reloj`, `G.ciclo.hora()` (puro, igual en ambos móviles) |
| Pesca en alta mar | `mundo.zonaAgua` (orilla/media/honda); la profundidad ya sale sola del mapa |
| Azar reproducible por mapa | `G.hash` + `G.azar` (así se hace el plan de aparición) |
| Dos jugadores en mapas distintos | `red.js`: cada móvil manda SU jugador (mapa, x, y…); el otro lo acerca suavemente y lo teletransporta si cambia de mapa |
| Niebla y minimapa propios | Patrón de `cueva2d.js` (niebla con luz) y `minimapa.js` |
| Requisitos de portal | `G.portales.REQ` (F5), ampliable en F6 |

## 3. Sistemas nuevos necesarios
1. **Mapas de mar** (`mar:true`): la regla de «sólido» se invierte (agua libre, tierra bloqueada); validador propio (sin tierra aislada mal puesta, muelles sobre costa, puertas coherentes). *Núcleo (`mapas.js`, `motor.bloqueado`).*
2. **Modo navegación del jugador** (`j.nav`): velocidad propia (según velas), giro suave opcional, sin pescar a pie, sin entrar en combate. *Núcleo (`motor.moverJugador`).*
3. **Órdenes de navegación** (`zarpar`, `desembarcar` vía puerta, `rumbo`, `parar`, `faro`, `fondear`): validadas contra el estado. *Dependen del registro de órdenes de F6.*
4. **Estado de barco y descubrimiento por jugador** en `est.dim.pirata.jugadores.<id>`: `{nivel de casco/velas/bodega/catalejo, cosmética, amarre:{mapa,ancla}, descubiertas:[ids de islas/faros/puntos], niebla (bitset), cofres cobrados}`. *Depende de las marcas de progreso de F6.*
5. **Rutas marcadas y rumbo automático** (datos + ejecutor que simula pulsar teclas siguiendo los puntos; se cancela con cualquier tecla o evento).
6. **Faros-baliza**: faro = punto de datos con muelle; viaje rápido solo entre faros de ese jugador.
7. **Eventos del mar** (islotes con cofre, remolinos, botellas, ballenas, navío rival, nubes de tormenta): plan puro por mapa (como `aparicion.plan`) y activación por cercanía; los cobros se guardan.
8. **Requisito «casco»/«marea»** para puertas: hoy `G.portales.comprobar(j, portal)` no ve `est`; hay que pasarle `est` (cambio pequeño, ya anunciado por F6 con marcas de progreso).
9. **Pintado** en los dos pintores (2D y HD-2D): barco (casco, velas, bandera, mascarón), estela, olas, niebla de descubrimiento, siluetas de horizonte, brújula/rumbo y carta marina. *Es la parte más grande en arte y en horas de pintor.*
10. **Red**: campos del barco en el mensaje de jugador (§4.3).
11. **Herramientas**: validador de dimensión de mar (rutas libres de tierra, faros alcanzables, muelles coherentes) y pruebas.

## 4. Riesgos
### 4.1 Guardado
- **Estado a medias:** guardar mientras se navega o en pleno rumbo. Regla: no se guarda el rumbo ni el evento; se restaura al jugador parado en la posición válida.
- **Incoherencia barco/jugador:** a pie con el barco «amarrado» en un muelle que ya no existe (contenido cambiado). Plan B: el barco vuelve al muelle de Puerto Calavera, sin perder mejoras.
- **Posición en tierra al cargar:** ya lo cubre `restaurar` (casilla sólida → ancla), pero hay que dar a los mapas de mar un ancla segura.
- **Datos hostiles/corruptos:** hay que validar niveles (acotados), cosméticas (lista cerrada), ids descubiertos (solo los que existen), tamaños máximos. Mismo patrón que `capturasOk`/`mochilaOk`.
- **Versión:** sección propia con `v`; una versión futura de la sección no se pisa (igual que `seccionFutura`).
- **Huellas 2D/clásico:** todo lo nuevo debe vivir en `est.dim.pirata` y en campos que solo existen dentro de la dimensión, para que el estado de Tonavia no cambie.

### 4.2 Rendimiento
- **Tamaño del mar:** un mapa único de 192×192 son ~37.000 casillas (el mayor actual es 64×64 = 4.096). Recorridos como `zonaAgua` (búsqueda sobre todo el mapa), el plan y el pintado crecerían ~9×. **Mosaico de 64×64** mantiene lo ya medido y solo prepara los mapas donde hay jugador.
- **Velocidad vs. tamaño:** a pie se va a 46 px/s. Con barco a 80 px/s (velas básicas) o 110 (máximas), 100 casillas (1.600 px) son 20 s o 15 s: **travesías de 15-35 s sin hacer el mar enorme.** Proponer eso en lugar de los 20-40 s del diseño.
- **Islas visibles desde lejos:** la pantalla muestra ~25 casillas de ancho; «ver» una isla lejana se hace con **siluetas de horizonte** (decorado barato en el mapa de mar, también en los bordes del vecino), no con pintar mapas enteros.
- **Memoria/descarga:** F4 ya suelta la dimensión sin jugadores; el mar de 9 mapas se prepara por mapa visitado (a confirmar al medir).
- **Pintado doble:** 2D y HD-2D deben tener el mismo contenido. Es el riesgo de coste más alto; medir en un móvil modesto antes de cerrar.

### 4.3 Red (dos móviles, PeerJS punto a punto)
- **Lo que funciona gratis:** cada móvil manda su jugador; el otro lo acerca (`moverRemoto`) y lo teletransporta si salta de mapa. A 110 px/s y 10 mensajes/s, el salto es ~11 px, por debajo del umbral de teletransporte (48 px): sin tirones.
- **Hay que añadir:** campos del barco al mensaje (`nav`, nivel de casco/velas, cosmética) → **subir `VERSION` de `red.js`** con validación estricta y compatibilidad con la versión 1 (F8 ya prevé `dim` en los mensajes).
- **Rumbo automático:** solo se simula en el móvil dueño; el otro ve posiciones. Sin riesgo de desincronización.
- **Eventos del mar:** deben salir de `hash(semilla|mapa|evento|ventana)` y **no** de `est.rnd`, o los dos móviles verán cosas distintas. Los cobros (cofres) los decide el dueño de ese barco.
- **Cruces validados:** en F8 el anfitrión valida cruces de portal; los faros y puertas del mar deben pasar por la misma validación.
- **Dos barcos en el mismo mar:** sin colisión entre ellos (pasan por encima); evita problemas de red.

## 5. Alternativas comparadas
| | A · Mosaico de mapas (RECOMENDADA) | B · Un solo mapa de 192×192 | C · «Carta» abstracta con tramos |
|---|---|---|---|
| Experiencia aprobada (mar libre) | Sí | Sí | **No** (no es navegar) |
| Reutiliza bordes y carga de F4 | Sí | Parcial | — |
| Rendimiento (lo medido) | Igual que hoy | ~9× más por mapa | Mejor |
| Riesgo de pintado | Medio (costuras) | Alto (cámara/culling) | Bajo |
| Rumbo automático | Rutas en datos | Rutas en datos | Trivial |
| Coste de la entrega | Medio | Medio-alto | Bajo |
Descartada **C** por contradecir D4. **B** descartada por rendimiento. **Barco como entidad con posición propia** (en vez de modo del jugador) descartado: obligaría a sincronizar entidades por red, a guardar una posición más y a resolver qué pasa si el jugador y su barco discrepan.

## 6. Decisiones técnicas que deben cerrarse antes de programar
Ver lista corta en la entrega; el detalle y mi recomendación para cada una está en §8.

## 7. Encaje en la hoja de ruta (sin modificarla)
- **No encaja en F6 ni en F8 sin ampliar su alcance.** F6 (ganchos de contenido) aporta tres piezas que la navegación necesita; F8 (red/rendimiento) endurece lo anterior, pero no crea el sistema.
- **Propuesta: una entrega nueva «FN · Navegación (núcleo)», después de F6 y antes de F8**, de tamaño parecido o algo mayor que F5. Incluye: mapas de mar, modo navegación, estado de barco y descubrimiento, rumbo y faros, eventos del mar (plan puro), requisitos nuevos, pintado mínimo común en 2D y HD-2D, validador y pruebas. El arte final del barco y los mapas de mar los hace Sonnet después.
- **Lo que pediría a F6 sin cambiar su objetivo (para que el usuario lo decida):** (1) que el registro de órdenes admita módulos con acceso al estado y validación propia; (2) que las marcas de progreso se guarden por jugador dentro de `est.dim.<dim>` con validador por módulo; (3) que `REQ` reciba `est`.
- **Lo que pediría a F8:** campos del barco en el mensaje de red, versión 2 de `red.js`, y medir el mar en móvil modesto.
- **Contenido (Sonnet, tras F8):** mapas de mar y de islas, siluetas, eventos, arte; Chuches primero (D11), por lo que la Isla Pirata no bloquea el resto.
- **Si prefieres no ampliar el alcance:** la Isla Pirata se retrasaría hasta después de F8 como proyecto propio; no recomendable, porque la navegación toca guardado y red.

## 8. Decisiones técnicas pendientes de aprobación (detalle)
1. **Topología del mar:** mosaico 3×3 de 64×64 (recomendado) frente a un mapa único.
2. **Barco = modo del jugador + dato «amarrado»** (recomendado) frente a entidad independiente.
3. **Dónde se guarda:** sección `est.dim.pirata` por jugador (recomendado) frente a campos en el jugador (cambiaría el estado de Tonavia).
4. **Descubrimiento:** por jugador; granularidad = islas/faros/puntos de interés + niebla gruesa de celdas de 8×8 (≈72 bytes). ¿Compartido entre los dos jugadores o individual? (recomiendo individual, como el barco).
5. **Rumbo automático:** rutas marcadas en datos y comprobadas por herramienta (recomendado) frente a búsqueda de caminos en el juego.
6. **Faros:** viaje gratuito e inmediato entre faros descubiertos por ese jugador; el barco viaja con él (recomendado); ¿con coste o espera?
7. **Mareas:** solo como condición de puerta (cueva), no cambiando casillas sólidas (recomendado; evita tocar la regla de colisión).
8. **Eventos:** deterministas por hash (no `est.rnd`), sin combate en el mar, cobros guardados.
9. **Velocidad y travesías:** 15-35 s según velas (en lugar de 20-40 s); ¿lo aceptas?
10. **Ampliación de alcance:** crear «FN · Navegación» entre F6 y F8 y las tres peticiones a F6 y la de F8 (§7).
11. **Presupuesto de pintado:** mínimo común en ambos pintores dentro de FN; arte final después. ¿De acuerdo?

## 9. Qué NO se hace
No se implementa nada, no se crea el mar ni el barco, no se cambia la hoja de ruta ni el alcance de F6, no se repite trabajo de F1-F5.
