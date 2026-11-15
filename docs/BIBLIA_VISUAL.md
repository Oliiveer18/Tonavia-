# BIBLIA VISUAL · Criaturas de Lali y Oli (v2.29, paso ID-1)

Documento único de estilo del mundo. Fija **una vez** paleta, luz, escala, animación, motivos de música e interfaz, para que Albanota, las siete regiones, los interiores y los menús salgan con la misma identidad sin rehacer nada. Lo que ya estaba decidido se recoge aquí; lo nuevo se marca como **PROPUESTA** y espera la aprobación del usuario (sección 11).

## 0. Cómo leerlo
- **Manda, por este orden:** las palabras del usuario → este documento → `ESTANDAR_SOMBREADO.md` y `REGLAS_DE_LUZ.md` (criaturas y luz) → `PLAN_IDENTIDAD.md`.
- **Dirección artística: no hay opciones.** El usuario decidió (v2.21) mantener el estilo actual y añadir sombreado; no quiso una dirección nueva. Por eso ID-1 no trae 2 o 3 estilos alternativos (como decía el plan original): trae el estándar único y tres imágenes de referencia.
- **Imágenes de referencia** (todas hechas con los sprites y el motor reales): `biblia_paletas.png`, `biblia_escala.png`, `biblia_motivos.png`.
- **Comprobación automática:** `python3 tools/paletas.py` (paletas, daltonismo y contraste de la interfaz).

## 1. Los tres pilares, traducidos a reglas visuales
| Pilar (`HISTORIA_Y_MUNDO.md`) | Regla visual |
|---|---|
| **Siempre dos** | Todo lo importante tiene versión para dos: bancos dobles, puertas de dos hojas, el cascabel de **dos mitades** (azul de Lali, rosa de Oli) como emblema de Albanota. Colores de personaje fijos: Lali azul, Oli rosa. |
| **Un mundo hecho de siete sonidos** | Cada elemento tiene un instrumento y una marca (sección 8); el suelo y los edificios llevan rasgos musicales (teclas, ondas, campanillas) **como forma**, no como puntos sueltos de color. |
| **Pixel art artesanal** | Contorno oscuro `#2a1b30`, colores por bandas duras, nada de degradados ni tramado, todo dibujado por código. |

## 2. Fundamentos (fijos; no se discuten en cada mapa)
1. **Píxel:** 1 píxel del arte = 1 píxel lógico; la casilla mide **16 px**; la cámara usa **zoom entero** (un móvil vertical muestra unas 8 casillas de ancho × 16 de alto).
2. **Contorno:** un solo color, `#2a1b30` (`G.PAL.ink`), de 1 px, en criaturas, personajes y objetos. El suelo no lleva contorno; los árboles y edificios llevan contorno claro arriba-izquierda y oscuro abajo-derecha (como el árbol actual).
3. **Luz:** una sola dirección, **arriba-izquierda**; sombra **abajo-derecha**, en todo y en todas las regiones. Lo que cambia entre regiones es la *temperatura* de la luz (sección 5), nunca su dirección.
4. **Bandas duras:** dos tonos por masa (base y sombra); el brillo de 1-2 px solo en metal, cristal y agua. Las masas de luz, sombra o detalle miden al menos 2×2 px (salvo ojos, boca y chispas declaradas).
5. **Rampas:** todo color de arte se calcula con `G.rampa(color)` (`src/rampas.js`): 5 tonos (sombra profunda, sombra, base, luz, brillo), con la luz hacia el amarillo cálido (52°) y la sombra hacia el violeta frío (275°). Nunca gris ni negro puro para sombrear.
6. **Sin ruido:** no hay manchas de varios tonos en el césped, espuma blanca en el lago ni sombras proyectadas junto a los árboles (decisión v2.21), ni píxeles sueltos de colores como «detalle» (decisión v2.24.5); el suelo es liso y el relleno son matas con forma, pocas y separadas (decisión v2.35). Un motivo es una forma con función, no confeti.
7. **Lo que emite luz no se sombrea** (llamas, electricidad, brasas, notas del cascabel).

## 3. Paleta global
Colores de la identidad (ya existen en `G.PAL` y en `index.html`):
| Token | Valor | Uso |
|---|---|---|
| `ink` | `#2a1b30` | contorno y texto sobre colores claros |
| `night` | `#2d2540` | fondo de la interfaz y de la pantalla de elección |
| `panel` | `#40294a` | paneles, botones, tarjetas |
| `white` | `#fff9ee` | texto sobre fondo oscuro |
| `accent` | `#f7d54a` | acción principal (el amarillo del cascabel) |
| `grey` | `#b9b4c4` | texto secundario, filtros «Todos» |

Colores de los 7 elementos (`G.ELEMENTS`, para placas, filtros y marcas): Hoja `#5dae5a` · Fuego `#f0603e` · Agua `#3f9bd6` · Eléctrico `#f7d54a` · Aire `#bfe3f5` · Roca `#8a7f72` · Sombra `#7a4cb0`. Rarezas: Común `#b9b4c4` · Rara `#4d9bf0` · Épica `#b06be8` · Legendaria `#f7d54a`.

## 4. Paletas por región (PROPUESTA) → `biblia_paletas.png`, `tools/paletas_regiones.json`
Cada región tiene 7 materiales (suelo, camino, muro, tejado, madera, agua, acento) con su rampa de 5 tonos. Se reconoce por su **suelo y su tejado** (lo que más ocupa la pantalla) y por su acento.
| Región | Rol | Suelo | Tejado | Acento | Carácter |
|---|---|---|---|---|---|
| Albanota | pueblo inicial | `#5dae5a` hierba | `#d94a3f` rojo | `#f7d54a` cascabel | cálido, acogedor |
| Silvara | Hoja | `#3d8446` | `#2a8187` | `#f5a8bd` flor | verde profundo, madera |
| Carbuna | Fuego | `#8a5a44` | `#a8322f` | `#f09a3e` brasa | tierra rojiza, basalto |
| Marenda | Agua | `#ead7ae` arena | `#3f9bd6` | `#3fb5b0` | luminoso, azul y arena |
| Fulgoria | Eléctrico | `#797686` | `#f7d54a` | `#7dffe7` | gris azulado, chispa cian |
| Cirrena | Aire | `#a8d8c0` | `#8e5bc4` | `#f5a8bd` | claro, abierto, lavanda |
| Obsidra | Roca | `#8a7f72` | `#5d576b` | `#e8c47a` | ocre y piedra |
| Umbrada | Sombra | `#3d3560` | `#2d2540` | `#f7d54a` estrellas | nocturno, violeta |

**Pruebas hechas (`tools/paletas.py`):** las 56 rampas (8 regiones × 7 materiales) van de oscuro a claro; ninguna pareja de regiones se confunde en visión normal, protanopia, deuteranopia ni tritanopia (el suelo o el tejado difieren ΔE ≥ 14); los 7 elementos tampoco se confunden entre sí (ΔE ≥ 12). La herramienta sabe fallar (se probó con dos regiones iguales).

**Notas honestas.** (1) Las rampas de colores casi blancos (Cirrena) saturan mucho la sombra profunda, porque el motor calcula el tono de sombra con la misma regla para todo; se ve bien en pantalla (son las bandas más oscuras y pequeñas), pero conviene mirarlo al hacer Cirrena. (2) El nombre de las regiones sigue pendiente de la búsqueda de originalidad (ver `HISTORIA_Y_MUNDO.md` 4 bis).

## 5. Luz por región (PROPUESTA)
- **Dirección fija arriba-izquierda** en todo el juego. Cada región tiene una **temperatura** (columna «luz» de `biblia_paletas.png`): Albanota alba cálida · Silvara sol filtrado · Carbuna tarde de brasa · Marenda mañana de mar · Fulgoria cielo de tormenta clara · Cirrena altura despejada · Obsidra mediodía seco · Umbrada crepúsculo.
- **Sin ciclo de día y noche** (decisión propuesta): luz fija por región, con momentos especiales por historia (devolver un Eco cambia la luz y la música de esa región). Motivo: el ciclo real cuesta rendimiento en móviles modestos y complica sincronizar los dos móviles. Si el usuario lo pide, se añade más adelante sin rehacer nada (la temperatura sería una capa de tinte).
- **Hecho (v2.46, ID-2b-2):** `G.capas.luzRegion`: un tinte liso (color y fuerza por región en `G.capas.luzDatos.REGIONES`, 4-12 %) sobre todo el suelo y el agua, antes de jugadores y criaturas, sin bordes ni manchas; el mapa dice su región con `"region"` en su JSON (`pueblo_inicial` = `albanota`; el editor la conserva); solo con «Sombras» encendido, `?luz=0` la apaga. La luz por zonas con bandas se probó en la v2.45 y se descartó (manchas sobre el césped).
- **Cómo se aplica (ID-2):** como un tinte suave sobre el suelo ya dibujado, nunca cambiando las rampas del arte ni el sombreado de las criaturas (así las 41 formas y las futuras se ven igual en todas partes).

## 6. Escala → `biblia_escala.png`
| Elemento | Medida | Nota |
|---|---|---|
| Casilla | 16 × 16 px | unidad de todo |
| Oli y Lali | sprite 18 × 24 px (≈ 1,4 casillas de alto) | no se tocan sin permiso |
| Criaturas | de 0,9 casillas (Ondel) a 1,9 (Zefirax) | tamaños pares, ya fijados en `lineas.js` |
| Árbol | 4 piezas (v2.34): pequeño 16×16 (el de siempre), mediano 16×24, abeto 16×32, roble hito 28×40; huella de 1 casilla | un solo diseño por tamaño; se ordenan por la Y de los pies: el personaje pasa por detrás de la copa o por delante del tronco (`src/arboles.js`) |
| **Puerta** (PROPUESTA) | 1 ancho × 2 alto | el personaje (1,4) pasa con holgura |
| **Casa** (PROPUESTA) | mínimo 5 × 4 casillas, tejado aparte (1 casilla más) | ventanas 1 × 1; la puerta de dos hojas del Centro PC mide 2 × 2 |
| Pueblo / ruta / cueva / gimnasio | ver `HISTORIA_Y_MUNDO.md` sección 1 | Albanota 48 × 36 |

Regla de lectura: un edificio tiene que ser **claramente más grande** que la criatura más grande que lo visite (Zefirax, 1,9 casillas): por eso 4 casillas de alto como mínimo.

## 7. Animación (v2.29: ritmos reales hoy + PROPUESTA para lo que falta)
**Hoy en el juego (`src/game.js`):** personajes 3 fotogramas (quieto, paso A, paso B; cambia cada 0,18 s al andar); criaturas 2 fotogramas al andar (0,2 s) más el 2 para la cola y el 3 para el ojo; movimientos por rasgos (`hop`, `float`, `sway`, `nod`, `flick`, ver `lineas.js`).

**PROPUESTA para ID-2 en adelante:**
1. **Un solo reloj visual** (nunca el estado de la partida): los adornos no se sincronizan entre los dos móviles porque no importan para el juego.
2. **Pulso de 0,5 s (120 pulsaciones por minuto):** los ciclos de los adornos se miden en pulsos (agua: 1 cuadro por pulso, 4 cuadros; hierba con viento: 2 cuadros cada 2 pulsos; antorchas y brasas: 3 cuadros de 1/4 de pulso). Así, cuando llegue la música (ID-4), lo que se mueve va al compás sin ajustes.
3. **Qué se mueve y qué no:** se mueven el agua, las banderas, las antorchas, los tejados con campanillas y las partículas; **no** se mueve el suelo de caminos ni los edificios. Máximo **24 partículas** a la vez; las notas del cascabel son partículas, no suelo.
4. Toda animación tiene un fotograma «de reposo» legible: la captura o la miniatura nunca enseña una pose rota.
5. Respetar `prefers-reduced-motion`: sin partículas y con agua de 2 cuadros.
7. **Viento en hierba y flores (v2.48a función · v2.48b matas encima del suelo · v2.48c matas con viento, v2.49 flores con viento, HECHAS):** `G.capas.viento.pose(tx, ty, n)` da la pose de una mata o flor en el cuadro n (4 por segundo). Una ráfaga cruza el mapa en diagonal, de izquierda a derecha, a 1,5 casillas por cuadro (u = tx + ty/2); a cada planta le llega con un retraso propio de 0 o 1 cuadros y la mueve por la secuencia 1,2,2,1 (1 s) y vuelve a la recta. Poses: 0 recta · 1 punta 1 px a la derecha · 2 punta y 2.º píxel 1 px a la derecha; el pie y el tallo no se mueven. Ráfagas cada 6-9 s, la primera a los 2 s, siempre igual (sin azar). En reposo el dibujo es el de siempre. Matas (v2.48c, `G.sombreado.dibujaMata(r, d, pose)` y `G.capas.matas`): pose 1 = la punta (píxel más claro) de cada brizna 1 px a la derecha; pose 2 = la punta y el 2.º píxel; el pie y el resto del tallo no se mueven; nunca toca el borde de la casilla; con `?movimiento=0` o movimiento reducido, rectas. Hojas de muestra: `docs/matas_poses.png` y `docs/matas_rafaga_8_cuadros.png`.
6. **Agua animada (v2.37-v2.44, `src/capas.js`, `G.capas.olas`):** olas de 5 tipos (raya recta, ondulada, discontinua, chispa, línea larga fina) y rayitas blancas, 4 cuadros por segundo, 2 px por cuadro. El agua se reparte en franjas de 6 filas (ola en las filas 0-2, rayita blanca en la 4, filas vacías entre todo: nada se toca ni en diagonal). **3 olas a la vez por franja y tramo**, todas hacia el mismo lado dentro de una franja (así no se cruzan), cada una cruza el tramo de orilla a orilla (nace fuera y se deshace en la orilla opuesta, nunca aparece o desaparece a mitad). **Cada casilla de agua tiene olas, también las de 1 casilla de ancho (partes verticales, estanques):** ahí salen solo los tipos cortos (≤ 5 px). Solo se pinta sobre agua y lejos de la orilla (`olas.visible`). Sin espuma blanca en la orilla (rechazada por el usuario). Control: grupo 30 de `test.js` y `tools/cobertura_agua.py`.

## 8. Motivos de música → `biblia_motivos.png` (PROPUESTA · **DESCARTADA por el usuario el 2 nov**: no la ve profesional; se rediseña desde cero, ver `SESION.md`)
**Principio:** un motivo es una **forma del terreno** con sentido, no decoración repartida. Aparece pocas veces y siempre donde el mundo lo justifica.
| Motivo | Dónde | Cómo se ve |
|---|---|---|
| **Camino de teclas** | caminos de Albanota | una octava (do-re-mi-fa-sol-la-si): líneas de separación entre casillas y la tecla negra donde la hay en un piano (do-re, re-mi, fa-sol, sol-la, la-si). No añade colores nuevos. |
| **Eco en el agua** | lagos y fuentes | dos ondas concéntricas con luz arriba-izquierda; en el juego, una animación lenta (un pulso por onda). |
| **Plaza del cascabel** | centro de Albanota | medallón de dos mitades (azul y rosa) con aro dorado y un tono por masa; es el único elemento grande de color del pueblo. |
| **Marca de elemento** | placas, carteles, gimnasios, galería | icono 9 × 9: hoja, llama, gota, rayo, remolino, cristal, luna. |

**Instrumento por elemento (para ID-4):** Hoja flauta · Fuego metales · Agua arpa · Eléctrico sintetizador · Aire campanillas · Roca marimba · Sombra violonchelo.

**Rasgo de cada región (PROPUESTA, para las próximas fases):** Silvara troncos con agujeros de flauta · Carbuna yunques y fuelles como percusión · Marenda redes tensadas como arpas · Fulgoria cables como cuerdas y pararrayos como diapasón · Cirrena campanillas colgantes · Obsidra columnas de cristal como marimba · Umbrada lunas y estrellas.

### 8 bis. Propuesta nueva (v2.30, pendiente de aprobación) → `albanota_prueba_390x844.png` (v2.30; **sustituida en la v2.32** por `albanota_v232_A_plaza_390x844.png` y `albanota_v232_B_barrio_390x844.png`, con las medidas del plano; los 3 árboles de la v2.30 NO están aprobados)
Sustituye a la sección 8. Un motivo es una **escena completa**: la Plaza del Cascabel (fuente con campana de dos mitades, bancos dobles, farolas, jardineras, adoquines con anillo de reloj), casas con tejado de escamas y la campana como veleta y cartel, huerto con espantapájaros azul y rosa, arroyo con puente, bosque variado. Hecha por código con la paleta y los sprites reales (`tools/escena_albanota.py`). No se reutiliza nada del camino de teclas, el eco en el agua ni el medallón suelto.

## 9. Interfaz (menús, diálogos, galería)
Reglas, con los valores reales de `index.html`:
1. **Fondo** `night`, **paneles** `panel`, **texto** `white`, **acción principal** `accent` con texto `ink`. Una sola acción principal por pantalla.
2. **Zonas táctiles de al menos 44 px** (filtros, botones de cerrar, buscador); botones de acción 48 px. Radios: 14 px en botones y tarjetas, 999 px en chips y filtros.
3. **Contraste (WCAG):** texto normal ≥ 4,5:1; bordes de chips y filtros ≥ 3:1 sobre el fondo. Los colores de elemento se usan tal cual para el **juego** (placas, marcas); en los chips de la galería se aclara solo la luminosidad hasta cumplir (función `uiColor` de `src/galeria.js`), sin cambiar el tono.
4. **Texto de las criaturas** con la fuente de píxeles (`src/font.js`), letra blanca con contorno oscuro. Texto de menús con la fuente del sistema.
5. **Nada depende solo del color:** cada chip lleva su nombre; los elementos se distinguen también por su marca (icono).
6. Móvil primero: 390 × 844 como medida de prueba; sin desplazamiento horizontal salvo las filas de filtros.

**Arreglo hecho en la v2.29 (medido con `tools/paletas.py`):** antes fallaban tres chips de la galería: **Sombra** (texto 2,69:1 y borde 2,41:1), **Roca** (texto 4,13:1). Ahora todos cumplen (Roca `#968c80`, Sombra `#a181c9` en el chip; los colores del juego no cambian).

## 10. Lo que NO se hace (resumen de decisiones del usuario)
- Dirección artística nueva.
- Manchas en el césped, espuma en el lago, sombras proyectadas junto a los árboles.
- Píxeles sueltos de colores como detalle; sombreado a mano criatura por criatura.
- Ciclo de día y noche (salvo que lo pida).
- Tocar a Oli y Lali sin permiso.
- Decidir el espacio entre criaturas (va al final).

## 11. Decisiones que necesita del usuario (marca lo que apruebas)
1. **Paletas regionales** (sección 4): ¿se aprueban tal cual, o se cambia alguna región?
2. **Luz fija por región, sin ciclo de día y noche** (sección 5).
3. **Pulso de 0,5 s** como reloj de los adornos (sección 7).
4. **Motivos:** camino de teclas, eco en el agua y plaza del cascabel (sección 8); y si el medallón del cascabel es el centro de Albanota.
5. **Puerta 1 × 2 y casa mínima 5 × 4** (sección 6).

## 12. Lista de comprobación para cualquier arte nuevo
(+ la norma de diseño espacial de la sección 13 para todo edificio, interior, calle o entorno nuevo)
- [ ] Luz arriba-izquierda, sombra abajo-derecha; un solo contorno `#2a1b30`.
- [ ] Colores de la paleta de su región; rampas con `G.rampa`, no a mano.
- [ ] Sin píxeles sueltos de otro color ni masas menores de 2 × 2.
- [ ] A tamaño real (1×) en móvil se entiende la silueta.
- [ ] Escala correcta (puertas 1 × 2, edificios ≥ 4 casillas de alto).
- [ ] Criaturas: `node tools/luz.js`, `tools/contorno.py`, `tools/simetria.js --sombreado`. Regiones e interfaz: `python3 tools/paletas.py`.
- [ ] Captura en móvil 390 × 844 antes de entregar.

## 13. NORMA PERMANENTE · DISEÑO ESPACIAL INTENCIONAL Y PROFESIONAL (decidida por el usuario el 6 nov 2026)
Cada edificio, habitación, comercio, oficina, calle y entorno NUEVO debe tener una distribución espacial estudiada y coherente. Se aplica a todo lo futuro; **no obliga a rehacer ahora lo existente** (se corrige solo cuando se toque por otro motivo, y nunca a costa de desordenar otra zona).
1. **Alineación:** muebles, estructuras y elementos arquitectónicos alineados con los ejes y referencias del espacio (rejilla de 16 px, ejes de la sala, paredes). Nada «a ojo» ni torcido por 1-2 px.
2. **Simetría solo si la arquitectura o la función la justifican** (una sala de espera, una fachada formal, un altar). No se fuerza: una casa, una tienda con vitrinas, una calle o un huerto pueden y suelen ser asimétricos con equilibrio visual.
3. **Equilibrio visual:** sin concentraciones de objetos, huecos muertos ni composiciones descompensadas; el peso visual se reparte aunque la planta no sea simétrica.
4. **Proporciones:** respetar dimensiones, escalas, distancias y relaciones entre objetos (`BIBLIA_VISUAL.md` §6 y §2), y el estilo artístico general del juego.
5. **Organización funcional:** cada elemento tiene una ubicación lógica según su uso y el **recorrido del jugador** (un pasillo libre de al menos 1 casilla; la puerta, el mostrador y los puntos de interacción se llegan sin rodeos).
6. **Composición arquitectónica:** fachadas, interiores y estructuras parecen diseñados por un profesional, no objetos colocados sin plan. Primero se escribe la distribución (tabla o dibujo con rejilla y ejes), después se construye.
7. **Identidad propia:** cada espacio conserva su personalidad; no se repite la misma distribución en todos los escenarios.
**Límites:** no sacrificar naturalidad, jugabilidad ni creatividad por conseguir simetría; no «corregir» una zona desordenando otra.
**Antes de dar por terminada cualquier construcción nueva:** revisarla desde la perspectiva real del jugador (captura en el móvil 390×844 con el zoom real del juego, caminando por ella: se llega a todo, nada tapa el paso ni la puerta, se lee de un vistazo) y anotar en `docs/SESION.md` que se hizo la revisión. Referencia de aplicación: Centro PC (`BIBLIA_INTERIORES.md` §1b, rejilla + eje + comprobaciones con `assert`).

**Añadido (v2.148):** todo interior es transitable al 100%; los interiores de servicio reservan la casilla del NPC (`anclas.npc` y `npc_frente`) y se prueba con ella como casilla sólida (ver `CLAUDE.md`, punto 8).
