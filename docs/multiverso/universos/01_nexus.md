# NEXUS · «El Cruce» (dimensión `nexus`)
Estados: ver `00_comun.md`. Ids de mapa y de dimensión: propuestos.

## 1. Identidad
El punto donde los ecos de todos los mundos se cruzan. Una plaza suspendida sobre un cielo estrellado donde se ven, a lo lejos, las otras dimensiones como islas de colores. Es **seguro, social y comercial**: no hay combates salvajes. Su misión de juego es doble: **llegar a otros mundos** y **mantener viva la economía entre ellos** (tablón, mercado, Centro PC). Tono: cálido, tranquilo, con un punto de misterio.
Enlace con la historia existente (`HISTORIA_Y_MUNDO.md`): el Eco Madre se partió en siete; el Nexus es el lugar donde «suenan juntos» los ecos de las otras dimensiones. La entrada natural es la **Ermita de Albanota** (ya tiene altar y pedestales de Eco). Que el requisito sea una condición de historia o de nivel de entrenador es una decisión (B).
Música/luz: noche suave, tinte azul violeta (usar el sistema de luz por región que Fable pase a datos); farolas del HD-2D encendidas siempre (A: ya existen `luz_farolas.js`).

## 2. Regiones
| Región | Subregiones | Función |
|---|---|---|
| **El Cruce** (única región grande) | Anillo de portales · Mercado de Resonancia · Terraza del Observatorio | Hub y servicios |

## 3. Mapas e interiores
| Id propuesto | Tipo / tamaño | Contenido | Reutiliza | Estado |
|---|---|---|---|---|
| `nexus/plaza_cruce` | pueblo ≈48×36 | Plaza circular con 4 portales en cruz, fuente central, farolas, puente a la terraza. Salidas a interiores | objetos `fuente`, `banco`, `farola`, `cartel`, `pedestal_eco_*`; plantilla de terreno | A (mapa) · B (portales) |
| `nexus/centro_pc` | interior 13×10 | Centro PC del Nexus (enfermera propia) | plantilla `sala_centro_pc` + NPC `enfermera` | A |
| `nexus/mercado` | interior ≈13×9 | Tienda grande + tablón de intercambios | plantilla `sala_tienda`, NPC `tablon` | A (mapa) · B (guion tendero) |
| `nexus/archivo` | interior ≈11×9 | Archivo de portales: libro de dimensiones visitadas | `estante`, `mesa`, `consola_cristales` | A (mapa) · C (contenido dinámico) |
| `nexus/observatorio` | interior ≈10×8 | Secreto: telescopio de ecos, muestra qué eventos hay activos | `consola_lab`, `escaner` | A (mapa) · C |

Solo 5 mapas: es un nexo, no un mundo.

## 4. Lugares especiales y secretos
- **Anillo de portales:** 3 portales a las dimensiones nuevas + 1 de vuelta a Albanota (Ermita). Cada portal con su identidad visual propia (marco de color; ver `06_propuestas_datos.md`). Tres huecos «dormidos» para dimensiones futuras (sirven de ampliación sin tocar el mapa).
- **Observatorio (secreto):** se abre tras usar los 3 portales. Muestra el próximo evento de dimensión. No da ventaja directa.
- **Fuente de resonancia:** sitio de descanso; cura al grupo gratis una vez por día de juego (alternativa al Centro PC, sin competir con él: depende de la regla de curación).

## 5. NPCs
| Personaje | Rol | Notas | Estado |
|---|---|---|---|
| **Ilara**, guardiana del Cruce | Guía y puerta: explica portales, informa de requisitos | Guion nuevo | B (guiones a datos) |
| **Odo**, archivista | Libro de dimensiones, registra lo hallado | | B/C |
| **Vexa**, mercader errante | Tienda del Nexus: objetos básicos + «curiosidades» de cada dimensión | Vende al precio de la tabla v2.350 | B |
| **Pía**, enfermera del Nexus | Centro PC | Reusa NPC `enfermera` | A |
| **El Tablón** | Intercambios entre jugadores y entrenadores | Reusa NPC `tablon` y `G.tablon` (decidir si el tablón es global; recomendado: Nexus) | A (reubicar) · B (ámbito) |
| Entrenadores visitantes | Tránsito de entrenadores de otras dimensiones | Población del Nexus = 0 propia; visitantes de las demás (B/C) | C |

## 6. Actividades, misiones y eventos
- **Pasaporte de dimensión:** visitar cada dimensión y volver con una pieza de prueba (misión de Ilara). Recompensa: ranura extra de tablón o hueco de caja (reglas existentes en `G.entrenador`). B.
- **Marea de portales (evento):** cada cierto número de días de juego, un portal «brilla» y esa dimensión da un bonus (p. ej. más rareza de aparición o mejor premio por un día). Depende del sistema de eventos de Fable. B/C.
- **Intercambio:** el tablón es la actividad principal del Nexus (ya implementado en v2.344-v2.345). A.

## 7. Comercio, recursos y economía
- Tienda del Nexus: Poción, Superpoción, Esfera, Revivir (objetos y fórmula de precio existentes `G.tienda`).
- «Curiosidades»: objetos coleccionables de cada dimensión que se venden al Nexus por Brillos (necesita tipo de objeto nuevo → B).
- Sin premios de combate (no hay combate), de modo que no altera el equilibrio v2.350.

## 8. Criaturas
Sin zonas de aparición salvaje (pool vacío a propósito). Solo presencia ambiental opcional: algunas criaturas de **aire** (nubecin, dandel) y **eléctrico** (zumbel) podrían verse como adorno (dibujo, sin combate) — decisión de Fable si el motor soporta «criatura decorativa» (B).
Huecos de diseño futuro (no necesarios): ninguno.
