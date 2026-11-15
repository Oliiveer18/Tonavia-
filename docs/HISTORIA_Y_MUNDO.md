# HISTORIA Y MUNDO · Criaturas de Lali y Oli (v2.20)

Documento de diseño del mundo, el combate híbrido y la identidad del juego. **Es una propuesta para aprobar:** nada de aquí está en el código salvo el editor de mapas. Los nombres propios son provisionales y pasarán por `GUIA_DE_NOMBRES.md` (originalidad y reglas N1-N10) antes de usarse.

Decisiones del usuario que lo motivan (v2.10):
- Juego **cooperativo para dos**; los jugadores **pueden separarse** (cada móvil tiene su cámara).
- Mundo con **gimnasios, Centro PC y muchos sitios bien hechos**; mapa lo bastante grande para que haya jugabilidad.
- **Combate híbrido:** clásico por turnos en gimnasios y entrenadores, y **tiempo real en el mapa** entre criaturas.
- Editor de mapas propio (hecho en esta versión).
- Historia e identidad propias.

---

## 1. Tamaño de los mapas (comparado con el actual)

Referencia: el mapa de hoy mide **36×26 = 936 casillas (576×416 px)**. Un móvil vertical con zoom entero muestra unas **8 casillas de ancho × 16 de alto**, así que el mapa actual son ≈ 4,5 × 1,6 pantallas: se cruza de lado a lado en unos 12 s (el jugador anda a 46 px/s = 2,9 casillas/s).

| Tipo de mapa | Casillas | Cuántas veces el actual | Pantallas (ancho × alto) | Cruzarlo a pie | Texto del suelo | Memoria al dibujarlo |
|---|---|---|---|---|---|---|
| **Actual** (Pueblo Inicial v1.4) | 36×26 = 936 | ×1,00 | 4,5 × 1,6 | 12 s | 0,9 KB | 0,9 MB |
| Pueblo | 48×36 = 1.728 | ×1,85 | 6,0 × 2,2 | 17 s | 1,7 KB | 1,7 MB |
| Ruta vertical | 32×64 = 2.048 | ×2,19 | 4,0 × 4,0 | 22 s | 2,1 KB | 2,0 MB |
| Ruta horizontal | 64×32 = 2.048 | ×2,19 | 8,0 × 2,0 | 22 s | 2,0 KB | 2,0 MB |
| Ruta grande | 64×64 = 4.096 | ×4,38 | 8,0 × 4,0 | 22 s (+ rodeos) | 4,1 KB | 4,0 MB |
| Cueva | 40×40 = 1.600 | ×1,71 | 5,0 × 2,5 | 14 s | 1,6 KB | 1,6 MB |
| Gimnasio | 24×30 = 720 | ×0,77 | 3,0 × 1,9 | 10 s | 0,7 KB | 0,7 MB |
| Centro PC | 14×12 = 168 | ×0,18 | 1,8 × 0,8 | 5 s | 0,2 KB | 0,16 MB |
| Tienda o casa | 10×8 = 80 | ×0,09 | 1,2 × 0,5 | 3 s | 0,1 KB | 0,08 MB |

Los «pasos para cruzar» son en línea recta sin obstáculos; con caminos que serpentean, rodeos y encuentros, cuenta el doble.

### Mundo completo estimado

| Qué | Cuántos | Casillas |
|---|---|---|
| Pueblos (1 inicial + 7, uno por elemento) | 8 | 13.824 |
| Rutas (8 normales + 4 grandes) | 12 | 32.768 |
| Cuevas o mazmorras (una por elemento) | 7 | 11.200 |
| Gimnasios (esqueleto común, uno por elemento) | 7 | 5.040 |
| Centro PC (un solo mapa compartido) | 1 | 168 |
| Tienda (un solo mapa compartido) | 1 | 80 |
| Casas e interiores distintos | 6 | 480 |
| **Total** | **≈ 42 mapas** | **≈ 63.560 casillas ≈ ×68 el mapa actual** |

- **Recorrido:** del pueblo inicial a la región más lejana hay unas 150 casillas en línea recta, ≈ 50 s sin parar. Con exploración, encuentros y gimnasios, cada región da de 30 a 45 min de juego.
- **Peso:** el suelo de todo el mundo son ≈ 62 KB de texto; con objetos (puertas, anclas, zonas, personajes) unos 150 KB. Cabe de sobra en el presupuesto de 3 MB (las 410 formas ocupan 1,59 MB).
- **Memoria:** solo se mantiene en memoria el mapa actual y los vecinos de borde. El mayor (64×64) pide 4 MB de lienzo; con vecino son ≈ 8-12 MB. Sin problema en un móvil.
- **Dos jugadores en mapas distintos:** el anfitrión simula como mucho 2 mapas a la vez (uno por jugador) y los dos tienen el límite de 24 criaturas activas por mapa.

Los tamaños son orientativos: el editor muestra en cada mapa su peso real, y si una región se queda corta se amplía con «Cambiar tamaño» sin rehacer nada.

---

## 2. Estructura y archivos

- **Un archivo por mapa** en `maps/<id>.json`: suelo (texto), anclas, puertas, conexiones de borde, zonas de aparición y personajes.
- **Se conectan por nombre, nunca por coordenadas:** una puerta apunta a `mapa` + `ancla`; un borde apunta a un mapa vecino con un desplazamiento. Mover un edificio solo cambia su puerta.
- **Símbolos de casilla estables:** nunca se renumeran; solo se añaden. Hoy hay 17 (el juego dibuja 5: `. f t ~ =`; las otras 12 se dibujan desde el 1.3a, v2.16).
- **Partida guardada por identificador** (`gimnasio_fuego: derrotado`), nunca por coordenadas.
- **Centro PC y tienda:** un solo mapa; la puerta de salida usa el ancla especial `volver` y devuelve al jugador a la puerta de la que entró.
- **Convención de nombres:** `pueblo_<elemento>`, `ruta_<n>_<a>_<b>`, `cueva_<elemento>`, `gimnasio_<elemento>`, `centro_pc`, `tienda`, `casa_<n>`.

### Editor de mapas (`tools/editor_mapas.html`)
- Un solo archivo, sin instalar nada; funciona en ordenador y en móvil. Se genera con `node tools/editor_mapas.js` (une la plantilla y los `maps/*.json`).
- **Pintar:** lápiz, goma, rectángulo, relleno, cuentagotas, 17 casillas, rejilla (marcas cada 8×16 = una pantalla de móvil), capa de casillas sólidas, zoom ×1 a ×6, deshacer y rehacer por mapa.
- **Objetos:** anclas, puertas, zonas de aparición (con elemento y nota), personajes (npc, entrenador, líder, cofre, cartel, guarida); se seleccionan, se mueven y se editan en el panel.
- **Mapas:** nuevo con plantillas (pueblo, ruta, cueva, gimnasio, Centro PC, tienda, casa), duplicar, borrar, cambiar tamaño, conexiones de borde con desplazamiento.
- **Comprobación:** anclas o personajes sobre casillas sólidas, puertas sin destino o con ancla inexistente, zonas sin suelo transitable, **todo alcanzable a pie desde «inicio»**, bordes que de verdad se pueden cruzar y que se corresponden con el vecino, y vecinos que no apuntan de vuelta.
- **Datos:** se guarda solo en el navegador; **exporta** (un mapa o paquete) y guárdalo en `maps/`. Importa uno o varios.
- Trae cargado el mapa actual (`maps/pueblo_inicial.json`, 36×26, con sus 7 claros como anclas) para ampliarlo desde ahí.

---

## 3. Combate híbrido

Dos modos con **los mismos datos**: una sola tabla de ataques, los mismos elementos (ganar ×2, perder ×0,5) y las mismas estadísticas. No se hace dos veces el trabajo.

### Por turnos clásico (gimnasios, entrenadores y legendarias)
- Elegir ataque, cambiar de criatura, usar objeto, huir (no en gimnasio).
- **Cooperativo:** combate doble 2 contra 2; cada jugador maneja una criatura (o su propio equipo). El líder del gimnasio usa dos criaturas.
- Se inicia al hablar con el entrenador, y no se puede evitar si te ve (línea de visión).

### Tiempo real en el mapa («Choque»)
- Una criatura salvaje o rival que te nota se acerca; tu criatura líder pelea a tu lado, en el propio mapa, sin pantalla aparte.
- **Controles:** te mueves para esquivar y colocar; cada criatura tiene **2 ataques con enfriamiento** en dos botones (alcance corto o a distancia, con la forma de cada elemento).
- **Cooperación:** uno atrae y el otro golpea; los **combos de elemento** (por ejemplo Agua + Eléctrico) hacen más daño si los dos jugadores golpean a la vez.
- **Captura:** se debilita por debajo del 25 % de PS y se lanza la cápsula con tiempo (acertar el momento sube la probabilidad).
- **Derrota:** la criatura cae («agotada», no se pierde nada) y se retira al Centro PC más cercano; así el juego no castiga a nadie.
- El resultado (experiencia, PS restantes) es el mismo que en el modo clásico.

### Qué hay que añadir a los datos (cuando toque)
`pv`, `ataque`, `defensa`, `velocidad` por forma y una tabla `ataques` (`id`, `elemento`, `potencia`, `enfriamiento`, `alcance`, `forma`). Se calcularán con una fórmula a partir de rareza, fase y elemento para no escribir 410 fichas a mano, con ajustes por línea.

---

## 4. Identidad e historia (borrador para aprobar)

### Los tres pilares
1. **Siempre dos.** Todo gira alrededor de Lali y Oli: nada importante se resuelve en solitario. Las mecánicas, los puzles, las puertas y los combates tienen una versión para dos.
2. **Un mundo hecho de siete sonidos.** El nombre de cada línea nace de un sonido (ya es la base de `GUIA_DE_NOMBRES.md`). El mundo es literalmente música: cada elemento es un «Eco».
3. **Pixel art artesanal.** Todo dibujado por código, con colores planos y contorno oscuro; la ciudad, el menú y hasta los diálogos comparten ese estilo. Es la seña visual del juego.

### Premisa
Hace mucho el mundo era un solo sonido, el **Primer Eco**, que se partió en siete: Hoja, Fuego, Agua, Eléctrico, Aire, Roca y Sombra. Cada región guarda el suyo en un santuario custodiado por un líder (el gimnasio). Con los años los ecos se han ido quedando mudos y las criaturas, que nacen de ellos, empiezan a cambiar.

Lali y Oli son dos amigas del pueblo inicial que reciben cada una **la mitad de un cascabel** que solo suena cuando están juntas. Por eso sus criaturas **se hacen más fuertes cuando las dos están cerca** (bono de pareja, puertas que solo ellas abren, combos).

### Estructura en actos
| Acto | Qué pasa |
|---|---|
| 0 · El pueblo | Cada jugador **crea su personaje**, reciben las dos mitades del cascabel, eligen criatura inicial y aprenden el Choque en la ruta de entrada. |
| 1-7 · Las siete regiones | En cada una: pueblo, ruta, cueva con puzle para dos, gimnasio y líder; al ganar, el santuario **devuelve su Eco** y la región cambia (música, colores, criaturas nuevas). El orden es libre salvo el último. |
| 8 · La cumbre del Aire | Con los siete ecos, el cascabel se completa y se abre el camino a **Zefirax** (legendaria de Aire, ya en el juego). No es un enemigo: es la que sostiene el Primer Eco. |
| Después | Las **2 legendarias por elemento** del plan (14 en total) en guaridas fijas, y las criaturas dobles de las rutas frontera. |

### Decisiones cerradas (v2.11)
| Punto | Decisión |
|---|---|
| Villano | **Sin gran villano:** el problema es natural (los ecos se apagan). En cada región aparece un **rival amistoso** que ayuda y compite. |
| Lali y Oli | **Cada jugador puede editar el nombre de su personaje** y ponerle complementos, **sin tocar el aspecto base**: los dos personajes están dibujados a partir de la foto de cada persona y se quedan como están (cara, pelo, piel, cuerpo y ropa base). Se podrán cambiar solo: **gorras, zapatos y algún complemento más** (propuesta: mochila, pulsera o color del cascabel, gafas). **Solo apuntado: no se hace nada todavía** (paso 1.3e, sin fecha). Los diálogos usan el nombre elegido; por defecto, Lali y Oli. |
| Tono | **Cálido, con momentos épicos:** humor y cariño en el día a día; música, color y puesta en escena grandes al devolver un Eco, en los líderes y con Zefirax. |

### Preguntas abiertas
1. Cantidad exacta de complementos y cuáles (el usuario decide cuando se haga el 1.3e).
2. Aprobar el nombre del mundo y de las regiones (sección 4 bis) y pasar la búsqueda de originalidad final antes de publicar.

### 4 bis · Nombres del mundo (APROBADOS por el usuario en v2.14; falta la búsqueda de originalidad de las regiones y el pueblo)
Criterio de la guía de nombres: inventados, sin unir dos palabras, pronunciables, con idea sonora (N2-N4, N9). El mundo es música, así que los nombres suenan a **tono / eco / resonancia**.

| Qué | Recomendado | Idea | Alternativas |
|---|---|---|---|
| **El mundo** | **Tonavia** | «tono» + sufijo de lugar -avia: «la tierra del tono» | Ecovar · Resonia (se parece a «Final Fantasy Resonance», descartada) |
| El Primer Eco | **el Eco Madre** | el sonido original que se partió | el Primer Tono |
| Pueblo inicial | **Albanota** | «alba» + «nota»: la primera nota del día | Primavoz |
| Región de Hoja | Silvara | «silva» (selva, latín) | Folvera |
| Región de Fuego | Carbuna | «carbón» | Pirandra |
| Región de Agua | Marenda | «mar» | Abisela |
| Región Eléctrica | Fulgoria | «fulgor» | Ampera |
| Región de Aire | Cirrena | «cirro» (nube alta) | Aerbis |
| Región de Roca | Obsidra | «obsidiana» | Petrama |
| Región de Sombra | Umbrada | «umbra» (sombra, latín) | Noxeda |

**Comprobación de originalidad (N9), honesta:** he buscado en la web «Tonavia», «Ecovar» y «Resonia». «Tonavia» no sale como juego ni marca conocida en una búsqueda básica (no es una garantía legal); «Resonia» queda cerca de otro juego y se descarta. Las ocho regiones y el pueblo **aún no se han buscado** una por una: se hará al aprobar la lista. Antes de publicar el juego hay que hacer una comprobación formal de marca del nombre final.

---

## 4 ter · Condiciones de evolución (v2.13: nivel + objetos; sin lugar ni hora)
**Decisión del usuario:** la evolución depende del **nivel** y de **objetos o fragmentos**; se descartan las condiciones de **lugar** y de **hora**. Se mantiene la de **pareja** (cascabel), que es la seña cooperativa del juego.

**Regla base.** Toda evolución exige un **nivel mínimo** y, según la rareza y la fase, **objetos**. El botón de evolucionar (hoy sin condiciones) solo aparece cuando se cumple todo, y el jugador decide si evoluciona o espera. Los objetos se gastan al evolucionar.

**Nivel mínimo (orientativo, se ajustará con la curva de experiencia):**
| Rareza | Fase 1 → 2 | Fase 2 → 3 |
|---|---|---|
| Común (2 fases) | 16 | – |
| Rara (2 o 3 fases) | 18 | 32 |
| Épica (3 fases) | 24 | 40 |
| Legendaria | no evoluciona | – |

**Solo 14 objetos en todo el juego** (así no hay que crear 200 objetos distintos y el sistema escala a 200 líneas):
| Objeto | Cuántos | Qué es | Cómo se consigue |
|---|---|---|---|
| **Nota de <elemento>** | 7 | pieza común de un Eco; sirve a las criaturas de ese elemento | tienda (precio), cofres, y a veces la sueltan criaturas salvajes de ese elemento al vencerlas en el Choque |
| **Fragmento de <elemento>** | 7 | pieza rara de un Eco; para las evoluciones finales | **no se vende**: cofres de cuevas, premio de líder, guardianes de cueva (se pueden volver a retar) y legendarias |

**Quién pide qué:**
| Evolución | Condición |
|---|---|
| Común 1 → 2 | solo nivel (algunas, además 1 Nota) |
| Rara 1 → 2 | nivel (algunas, además 1 Nota) |
| Rara 2 → 3 | nivel + 1 Nota |
| Épica 1 → 2 | nivel + 1 Nota |
| Épica 2 → 3 | nivel + 1 Fragmento |
| Criatura de **doble elemento** | la Nota o el Fragmento **del segundo elemento** (obliga a explorar las dos regiones) |
| **Pareja** (1-2 líneas por elemento) | nivel + **el otro jugador cerca** (suena el cascabel); en lugar de objeto |
| Legendaria | no evoluciona |

Reparto objetivo en las ≈ 210 evoluciones: solo nivel ≈ 45 %, con Nota ≈ 30 %, con Fragmento ≈ 15 %, pareja ≈ 10 %.

**Reglas de diseño:**
- La galería y la ficha lo dicen siempre («Evoluciona a Voltavar: nivel 18 + 1 Nota de Eléctrico»).
- Nada oculto ni dependiente de la suerte; ningún objeto necesario está solo en una fuente que se pueda perder (los Fragmentos tienen siempre una fuente repetible, para no atascar la partida).
- **Mochila común del dúo** para Notas y Fragmentos (los dos jugadores comparten); los demás objetos serán de cada jugador.
- Los datos van en el campo `evolucion` de `src/lineas.js`: `{ nivel, objetos: [{ id, cantidad }], pareja: true|false }`. Se **añaden ahora** y se **activan** tras los pasos 1.6 y 1.7 (combate: experiencia y niveles). El test de equilibrio comprobará el reparto y que toda línea tenga una fuente posible de sus objetos.

---

### 4 quater · Identidad visual y sonora (v2.20)
La premisa («el mundo es música») debe **verse y oírse**. Decisión del usuario (2 nov): el mapa principal necesita esencia e identidad profesionales antes que cualquier interior, hechas una sola vez. Plan, principios, pasos ID-1 a ID-5, pruebas y decisiones pendientes en **`PLAN_IDENTIDAD.md`**. Ideas de partida (propuestas, a elegir en ID-1): detalles con forma de nota, losas de camino como teclas, ondas del Eco en el agua, partículas del cascabel, motivos por elemento y por región, la plaza de Albanota con el cascabel como centro.

---

## 5. Plan de trabajo (sustituye el paso 1.3 del ROADMAP)

Un ZIP por paso y PARAR tras cada uno.

**Decisiones del 1.3a (v2.15, solo documentos).** (1) El jugador no nota ningún cambio. (2) Se deja listo el modelo para dos jugadores: cada jugador tiene su mapa, posición y cámara, y todo lo que hace entra como **orden** `{jugador, tipo, …}` (mover, hablar, evolucionar) que se aplica al estado; **sin conectar nada** (PeerJS es el 1.3d). (3) El azar pasa a **semilla** (`Math.random` fuera) para que dos móviles vean lo mismo. (4) El mapa se lee de `maps/pueblo_inicial.json` y viaja dentro de `dist/criaturas.html`. (5) Casillas nuevas (12) dibujadas igual que en el editor; puertas por ancla, bordes entre mapas y ancla `volver`, probados con mapas falsos. (6) **Criaturas:** el usuario ha verificado y aprobado las 20 líneas actuales; quiere pasar a ir añadiéndolas según se hagan. **Recomendación de Claude: en el 1.3a siguen en sus casillas** (sirve de prueba de que nada cambia: huella y test) y **se retiran del mapa fijo en el 1.3b**, donde pasan a zonas de aparición; seguirán en el registro y en la galería. *Pendiente de confirmar por el usuario.* Esfuerzo: MEDIUM. ZIP del paso: v2.16.

| Paso | Qué | Lo que ve el jugador |
|---|---|---|
| **1.3-0 · Editor de mapas** | **HECHO (v2.10).** `tools/editor_mapas.html`, `maps/pueblo_inicial.json` | Nada (herramienta) |
| 1.3a · **HECHO (v2.16)** | Motor de mapas: carga, puertas, bordes, casillas nuevas; el mapa actual pasa a `maps/`. Estado separado del dibujo y movimientos como órdenes (listo para dos jugadores). | Nada |
| 1.3b · **HECHO (v2.17)** | Aparición por zona y rareza, máximo 24 activas, guaridas legendarias fijas. | Criaturas por zonas |
| 1.3b-bis · **HECHO (v2.19)** | Interruptor de aparición (`AJUSTES.VISIBLES`): se quitan las criaturas visibles sin borrar nada, para trabajar los mapas; después, más espacio entre ellas y número por mapa. | Mapa sin criaturas |
| ID-1 a ID-4 · pendientes (v2.20) | **Bloque de identidad** (`PLAN_IDENTIDAD.md`): biblia visual, motor con capas y formato 2 de `maps/`, Albanota como corte vertical, música y sonido por código. Va **antes** de los interiores. | Un mundo con identidad |
| 1.3c = ID-5 | Primer interior: Centro PC compartido, con puerta y vuelta (v2.20: pasa después de ID-1 a ID-4). | Entras a un edificio |
| 1.3d | Dos móviles (PeerJS), cada uno con su cámara, pueden separarse y entrar a mapas distintos. | Cooperativo básico |
| 1.3e | **Solo apuntado.** Nombre editable y complementos (gorras, zapatos y alguno más) sin tocar el aspecto base. | Personalizar al jugador |
| 1.6 | Datos de combate (PS, ataques) y combate por turnos clásico. | Primer combate |
| 1.7 | Choque en tiempo real en el mapa y captura. | Combate híbrido |
| 2.x | Región a región: pueblo, rutas, cueva, gimnasio y sus criaturas (los hitos del PLAN_200 se entrelazan con las regiones). | Mundo creciendo |

El primer ZIP de contenido real (2.x) debería ser la **región de Hoja** como molde de las demás.

## 6 · El Laboratorio de Albanota: para qué sirve (v2.76, 5 nov, solo documentos; aprobado por el usuario)
Tres funciones, todas sin código todavía: **(1) primera criatura:** Lali y Oli reciben allí a su primer compañero al empezar; **(2) evolución y estudio:** allí se evolucionan y se «analizan» las criaturas que capturen (las condiciones, nivel + objetos, siguen en 4 ter); **(3) misiones:** un NPC científico da encargos (traer ciertas criaturas). Se construye junto con los interiores (ID-5); antes, el rediseño visual del exterior (ver `FICHAS_EDIFICIOS_3D.md` §3).

**Aspecto del laboratorio (v2.78):** no es un laboratorio de ciencia general (matraces, vapor) sino un **centro de estudio de criaturas**: cúpula-incubadora con luz cálida, siete cristales (uno por elemento), escáner, cápsulas con huevos y cartel con huella o huevo. Detalle en `FICHAS_EDIFICIOS_3D.md` §3 «NUEVO DISEÑO». Motivo visual del mundo: **huevo / huella / cristal elemental**, reutilizable en el Centro PC, la tienda y los carteles.
