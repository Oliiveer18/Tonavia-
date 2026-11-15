# ROADMAP · Criaturas de Lali y Oli (al día el 10 nov 2026, v2.314)

Un ZIP por paso y PARAR tras cada uno. La última palabra es del usuario. **Antes de cada paso se dice siempre el esfuerzo (LOW o MEDIUM), también el de cada subpaso y cada fase.** El detalle técnico de cada versión está en `SESION.md` (v2.305 en adelante) y en `archivo/` (lo anterior). La versión anterior COMPLETA de este roadmap (con las tablas por fase y las entradas v2.188-v2.208) está en `docs/archivo/ROADMAP_completo_hasta_v2_222.md`; el historial viejo, en `docs/archivo/ROADMAP_HISTORICO.md`. Para retomar en otra sesión: `CONTINUAR.md` y `PROMPT_PARA_CONTINUAR.md`.

## 1. Dónde estamos (v2.323)

- **Terrenos y mundo (v2.321-v2.323):** motor de terrenos 2D (`src/terreno.js`) y compositor de mapas por receta; plan del mundo en `datos/mundo.json`/`docs/MUNDO.md` (50 mapas, 7 regiones); Carbuna (pueblo) generada y conectada a Albanota con puerta provisional y cartel. Pendiente: edificios y NPC en Carbuna, ruta definitiva, resto de regiones (cada una necesita su tema en `TEMAS`).
- **NPC realistas (Fable 5.2, en curso).** Sin tocar los puzles de las Profundidades (usuario, 11 nov).

- **Profundidades hechas (v2.320):** cuevas generadas, 5 biomas, 12 puzles, pisos especiales (ver `SESION.md` y `GUIA_PROFUNDIDADES.md`). Pendiente: HD-2D de las cuevas, más contenido por datos, prueba en iPhone. **Crianza en pausa** (decisión del usuario).

- **Economía hecha (v2.315-v2.319):** Brillos ✦, mochila, objetos, tendero Teo, Bolsa y Tienda, recompensas y cura de pago (ver `SESION.md`). Pendiente: afinar precios con partidas reales, Teo en HD-2D, cosméticos.

- **Desde la v2.259 (HECHO):** combate en tiempo real conectado a 2D y HD-2D con 56 movimientos y 7 elementos, acompañante, especial y captura con esferas (v2.259-v2.296) · Ignel en 3D real con GLB, prueba (v2.297) · tema «pixel cálido» e interfaz ordenada (v2.298-v2.300) · sonido sintetizado del combate con variedad por movimiento (v2.301-v2.302) · **niveles 1-50 por especie, núcleo** (v2.303) · combate de noche con foco de luz (v2.304) · música de tensión adaptativa (v2.305) · especial manual, vida permanente y panel Equipo (v2.307-v2.311) · **enfermera Alba (primer NPC) con curación y equipo editable de 6** (v2.312), salir de interiores (v2.313) y rótulos/escalones en 2D (v2.314). Detalle en `CONTINUAR.md` y `SESION.md`.

- **Hecho y cerrado:** motor y datos (Fase 0), identidad visual 2D, Albanota como mapa real, editor de mapas, modo HD-2D con botón 2D/HD-2D, edificios en 3D, partículas y sombras, música por código, interiores (Centro PC, Tienda, Laboratorio, casas, Ermita), Oli, Lali y Zefirax en 3D, dos móviles (PeerJS), guardado de partida, **pesca completa** y **fauna marina completa**.
- **Pesca (v2.180-v2.222):** puntos de pesca, caña 2D y 3D, pique, forcejeo con ritmo, criatura enganchada, ficha de captura, colección 🐟, récords, guardado y red. Desde la v2.222, si el «!» del pique no se toca, el hilo se recoge pero la caña se queda en la mano, visible, y hay que pulsar 🎣 para lanzar otra vez.
- **Fauna marina (v2.200-v2.220): 20 criaturas dibujadas a mano** (Cirujano azul + lote 1 de 5 + lote 2 de 8 + lote 3 de 6), en 2D y HD-2D, con ficha y colección. Tabla de especies, zonas y probabilidades: `FICHA_PECES.md`. Método, estilo y lecciones: `GUIA_PECES_A_MANO.md`. Los 5 peces antiguos generados por fórmula siguen ocultos (`oculto: true`).
- **Zonas de pesca:** Albanota (pueblo inicial) solo da las zonas 0 (orilla norte) y 1 (puentes): salen 14 de las 20. La **zona 2** (agua honda: Pulpo, Mero, Pez espada, Raya, Barracuda y Cazón) queda reservada **a propósito** para mapas futuros con agua a 3 o más casillas de tierra; no añadir puntos de zona 2 en Albanota.
- **Reserva de peces sin usar:** Lenguado, Pez cofre, Pez luna, Atún, Pez aguja y Pez ballesta (`docs/lote3_reserva_6.png`; dibujos de reserva en `docs/lote3_reserva_sprites.json`).
- **Criaturas 3D en HD-2D (v2.169-v2.240):** Zefirax (a mano, curva), **Nimbel, Arenel y Somnel** (modelo a mano desde su sprite; interruptor `CRIATURAS3D`; método y lecciones en `GUIA_MODELADO_3D.md`). Pendiente: instancias múltiples del mismo tipo (hoy una malla 3D por tipo a la vez) y ver el HD-2D en el móvil real.
- **Ideas de pokesurvivor.com (v2.241-v2.244, HECHAS):** menús limpios, suelo con grano y caminos suaves, rocas/piedras/hierba alta y ciclo de día y noche (`SESION.md`). Pendiente: guardar la hora del día en la partida (hoy `est.reloj` no se guarda).
- **Decoraciones en 3D (v2.245-v2.251):** `src/objeto3d.js` (registro) con roca, piedras, hierba alta, barril, cartel con el nombre del pueblo, juncos y nenúfares; árboles 3D más grandes que una persona y 10 colocados en el parque (norma de colocación con test). Lo que falta, por esfuerzo y orden, en `docs/LISTA_DECORACIONES_3D.md`.
- **Decoración 3D, lotes 3 y 4 (v2.252-v2.258):** vallas (módulo paramétrico), espantapájaros, huerto (54 plantas) y puente con modelo 3D (`src/objeto3d.js`; el pintor ya acepta piezas de capa «bajo» con modelo). **Edificios definitivos en 3D:** Tienda (v2.253-v2.254: vitrinas, dos toldos, rótulo «TIENDA»), Ermita (v2.256: relieves de piedra) y Centro PC (v2.257-v2.258: fachada propia, dos ventanas y rótulo «CENTRO PC» sobre la puerta). Herramientas nuevas del generador de volúmenes (`src/volumenes.js`): `vol.toldo` (uno o lista, con `retiro`), `vol.rotulo` (placa con texto en letra de píxel 3×5) y `vol.adornos` (cajas de piedra). Detalle y lecciones en `SESION.md`. Pendiente: lotes de interiores (`LISTA_DECORACIONES_3D.md`) y la campana 3D de la espadaña.
- **Árboles 3D en HD-2D:** Fases 1-4 hechas (v2.197-v2.251; Fase 4 = colocados en Albanota, decisión del usuario del 9 nov); falta el cierre (Fase 5) y decidir si el 2D clásico sube sus casillas «t».

## 2. Lo que queda, por esfuerzo

### LOW
| Qué | Notas |
|---|---|
| **Árboles: banco bajo el roble y más árboles al sur del lago** | Cuando se quiten los claros de criaturas de prueba (provisionales). Reglas de despeje en `CLAUDE.md` y test v2.251. |
| **Árboles 3D · Fase 5: cierre** | Pruebas, documentos y ZIP. |
| **Guardar la hora del día en la partida** | Hoy `est.reloj` no se guarda y el día vuelve a empezar al cargar (v2.244). |
| **1.3e Personalización: decidir qué entra** | Con roles fijos (Oli y Lali), solo ajustes por personaje (nombre y complementos). Sin decidir. |
| **Más criaturas en 3D** | Siguiendo `GUIA_MODELADO_3D.md` (una por sesión, MEDIUM cada una). Arenax (evolución de Arenel) y las demás, a decidir con el usuario. |
| **Fase 8 · ficha y aprobación de cada lote de criaturas** | Una por lote; son 18 lotes. |

### MEDIUM
| # | Paso | Notas |
|---|---|---|
| 2c | **Decoración 3D por lotes** | `docs/LISTA_DECORACIONES_3D.md`: vallas (módulo), espantapájaros, huerto, puente; Centro PC, Tienda y Ermita definitivos; 29 objetos y 6 salas interiores. Formas simples y fáciles de ver. |
| 2b | **Criaturas 3D: instancias múltiples** | Hoy una malla 3D por tipo a la vez (`vistos[k]`); compartir textura entre ejemplares. |
| 3 | **1.6 · Combate en tiempo real — HECHO (v2.259-v2.296; pendiente: cámara de combate HD-2D, equipo y cambio en pleno combate)** | Antes era por turnos. Criaturas automáticas, botón de especial, cambio en pleno combate. Ficha: `FICHA_COMBATE.md` (decisiones confirmadas provisionalmente el 9 nov, a validar jugando). **Hecho (v2.259-v2.271):** catálogo de 56 movimientos con efectos de prototipo (`tools/prototipo_fx`) y motor puro + simulador + calibrador (`src/combate*.js`, `tools/simular_combate.js`, `tools/calibrar_combate.js`), equilibrado en Común y Rara. **Falta:** conectar eventos con los pintores 2D/HD-2D, pantalla de combate y botón de especial, listas de movimientos por criatura, exclusivos épicos/legendarios (y recalibrar), prueba en móvil. |
| 4 | **1.7 · Choque y captura — HECHO en 2D (v2.296; faltan sonidos de captura; equipo y colección: panel y edición HECHOS)** | Combate en tiempo real en el mapa y captura. |
| 6 | **Evolución y niveles** — niveles núcleo HECHO (v2.303); faltan movimientos por nivel, evolución por nivel, niveles por zona y ficha de criatura | Nivel mínimo + objetos; pareja con el cascabel. |
| 7 | **1.3e · Personalización** (construirla) | Una vez decidido el alcance. |
| 8 | **ID-5g-4 · Identidad de color** | Opcional, sin decidir. |
| 9 | **Fase 8 · dibujo de las criaturas** | De 20 a 200 líneas (≈410 formas). Un lote por sesión. Se puede intercalar con los pasos 3-6. |
| 10 | **Regiones** (7) | Una por sesión, tras el combate, con Hoja como molde. Falta la búsqueda de originalidad. Aquí entran los mapas con agua honda (zona 2). |

Orden de ejecución vigente (desde la v2.187; el combate y la captura ya están hechos, ahora toca profundizar niveles, evolución y equipo): 1.3d dos móviles (HECHO) → 1.3f guardado (HECHO) → **1.6 combate (siguiente)** → 1.7 choque y captura → captura de la pesca (HECHA) → evolución → personalización → identidad de color (opcional) → criaturas → regiones. El orden lo decide el usuario; no empiezo nada sin su «hazlo». Cada paso: un ZIP, se dice el esfuerzo, la verificación mecánica puede ir a Haiku (skill `esfuerzo-delegacion`).

### Nuevos pendientes (v2.312)
| Qué | Notas |
|---|---|
| ~~Pociones y objetos de curación~~ | HECHO (v2.315-v2.319, economía). |
| **Enfermera y tendero en HD-2D** | Alba y Teo existen en 2D; falta el pintor 3D. |
| **Mostrar la vida fuera del combate** | Hoy solo en el panel Equipo. LOW. |

### Pendientes tuyos (no son pasos de código)
- **Aprobar la biblia visual** (ID-1, `BIBLIA_VISUAL.md`) y **la referencia de Albanota** (ID-3b).
- **Probar en un móvil real:** HD-2D con Three.js real, música, viento, interiores y las novedades de la pesca. Cuatro pruebas HD-2D (`banco_hd2d`, `farolas_hd2d`, `hd2d_volumenes`, `particulas_hd2d`) piden `--three` y no se pueden ejecutar en el entorno de Claude.
- Móvil real con GPU: rendimiento del HD-2D (podría quedar opcional en móviles lentos).

## 3. Principios del plan
0. **Listo para online (norma del 7 nov):** ver `CLAUDE.md`. Estado serializable en `est`, motor determinista por órdenes y semilla, jugadores por id, contenido como datos, combate/captura verificables con semilla.
1. **El 2D es la base; el HD-2D es una opción encima.** El mundo es uno solo y hay dos pintores; un botón en partida cambia de pintor sin reiniciar. Si el HD-2D da problemas, el 2D sigue entero.
2. **El mapa provisional no pasa al HD-2D.** El HD-2D solo lee Albanota.
3. **Albanota se hace una vez** y los dos modos la leen.
4. **Cada efecto visual nuevo se hace en los dos pintores o se anota como pendiente en el otro.**
5. Si se cambia a propósito lo que se ve en el 2D: `node tools/huella_juego.js --escribir` (y `--clasico --escribir`) y se anota en `SESION.md`.
6. **Diseño espacial intencional y profesional (norma del 6 nov):** distribución estudiada, alineación, equilibrio, recorrido del jugador, transitable al 100% y casilla de NPC en interiores de servicio; se revisa desde la perspectiva real del jugador. Texto completo en `BIBLIA_VISUAL.md` §13 y en `CLAUDE.md`.

## 4. Lo hecho (resumen; el detalle por fase está en `archivo/ROADMAP_completo_hasta_v2_222.md`)
| Fase | Qué | Estado |
|---|---|---|
| 0 | Fundamentos técnicos (equilibrio, registro de datos, dibujo por elemento, galería, presupuestos, motor de mapas, aparición por zonas) | HECHA |
| 1 | Identidad visual del 2D (biblia, capas, agua, luz, sombreado, viento) | HECHA; biblia **pendiente de tu aprobación** |
| 2 | Albanota: de la referencia al mapa real (48×36, `maps/albanota.json`) | HECHA (v2.57); referencia pendiente de aprobar |
| 2b | Editor de mapas v2 (ED-1 ver y mover, ED-2 añadir piezas y avisos); `maps/albanota.json` es la fuente única de Albanota | HECHA (v2.59-v2.60) |
| 3 | Modo HD-2D y botón 2D / HD-2D (HD-B1, B2, B3, C1-C3) | HECHA (v2.64) |
| 3b | Edificios en 3D de verdad en el HD-2D | HECHA (v2.89) |
| 4 | Pulido del 2D: partículas y sombras proyectadas | HECHA (v2.90-v2.100) |
| 5 | Sonido e interiores (Centro PC, Tienda, Laboratorio, casas, Ermita) | HECHA (v2.136-v2.186); falta verlo en HD-2D con Three real y móvil real |
| 6 | Dos móviles (1.3d), guardado (1.3f) | HECHA (v2.188-v2.190); personalización (1.3e) sin decidir |
| 7 | Combate, captura y evolución | captura de la pesca HECHA; combate, choque y evolución pendientes |
| Pesca | Puntos, caña, pique, forcejeo, ficha, colección | HECHA (v2.180-v2.222) |
| Peces | Cirujano azul + 19 criaturas más, dibujadas a mano | HECHA (v2.200-v2.220) |
| Personajes 3D | Oli, Lali, Zefirax | HECHA |
| Árboles 3D | Fases 1-4 | HECHAS (v2.197-v2.251); Fase 5 (cierre) pendiente |
| Decoración 3D | Registro de objetos, lotes 1-4 (rocas, hierba, barril, cartel, juncos, nenúfares, vallas, espantapájaros, huerto, puente) y edificios Tienda, Ermita y Centro PC | HECHA (v2.246-v2.258); interiores pendientes |

### Fase 8 · Criaturas: de 20 a 200 líneas (≈410 formas) — pendiente
Se hace por lotes; en cada lote: ficha y aprobación (LOW) y dibujo (MEDIUM o LOW según el lote, se dice al empezar). **El espacio entre criaturas se decide al final**, al tener todas.
| Hito | Líneas | Lotes |
|---|---|---|
| 1 · Nivelar Sombra; Épica y Legendaria por elemento | 50 | 3 |
| 2 · Comunes y Raras en proporción | 100 | 5 |
| 3 · Dobles elementos y segundas variantes | 150 | 5 |
| 4 · Cierre y equilibrio final | 200 | 5 |
Las regiones (Silvara, Carbuna, Marenda, Fulgoria, Cirrena, Obsidra y Umbrada) se construyen tras el combate, con Hoja como molde.

## 5. Decisiones del usuario (se mantienen)
1. Voltel es **Rara** (3 fases). Nombres estilo Charmander-Charmeleon-Charizard, sin diminutivos «-ín». Tamaño y peso propios por línea y fase. Reparto de fases ≈ 25 / 45 / 30 %. Zefirax 30×30.
2. Meta de **200 líneas con todas sus evoluciones** (≈410 formas); dobles elementos hasta el 20 %. Rangos, arquitectura técnica y sistema de nombres delegados en Claude. Dandel y Perlel se quedan.
3. Dos jugadores cooperativos que **pueden separarse** en mapas distintos; mapas con **editor propio** (`tools/editor_mapas.html`) y un archivo por mapa en `maps/`.
4. Gimnasios con **combate por turnos** y también **combate en tiempo real en el mapa**. Historia sin gran villano, con rival amistoso por región; cada jugador personaliza su personaje; tono cálido con momentos épicos.
5. Evolución: **nivel mínimo + objetos** y **pareja** con el cascabel; sin condiciones de lugar ni de hora.
6. Nombres aprobados: mundo **Tonavia**, pueblo **Albanota**, regiones Silvara, Carbuna, Marenda, Fulgoria, Cirrena, Obsidra y Umbrada.
7. **Identidad antes que interiores:** el mundo se hace bien una vez; criaturas ocultas mientras tanto.
8. Sombreado: el estilo actual + sombreado (luz arriba-izquierda); suelo limpio; sin sombras junto a árboles. Criaturas de Agua y Eléctrico: no seguir con muchos píxeles de varios colores. Las 20 criaturas actuales están aprobadas.
9. Albanota: pueblo inicial 48×36, sin criaturas salvajes en el juego final, río recto, caminos centrados, sin mirador, sin árboles nuevos.
10. **HD-2D:** se prueba en paralelo; botón en partida para pasar de 2D a HD-2D; el mapa provisional no pasa al HD-2D; Oli y Lali se implementan en el HD-2D.
11. No tocar a Oli y Lali en el 2D; respuestas breves en español (usa el móvil).
12. **Fauna marina (8 nov 2026):** solo criaturas que se pescan de verdad con caña (peces, no cangrejos ni estrellas de mar); dibujadas a mano en perfil mirando a la derecha con el estilo de la lámina de referencia (cuerpos gruesos, aletas sueltas y puntiagudas, varios tonos, manchas agrupadas), una sola talla y un solo dibujo por criatura, boca como la del Cirujano, borde de 1 px de un solo color. Los peces cuelgan de la boca al enganchar. Albanota solo da las zonas 0 y 1.
13. **Caña (8 nov 2026):** si no se toca en el pique, tras el fallo el hilo se recoge pero la caña queda en la mano, visible; se vuelve a lanzar al pulsar 🎣.

## 6. Reglas que no cambian
Cada fase de una criatura: silueta, paleta y rasgo propios; colores planos y contorno oscuro; vista de espaldas sin cara; redibujar a la medida (no reescalar). Primero la ficha y su aprobación; después el dibujo, una línea por ZIP. Combate, captura y evolución con condiciones solo en su paso (Fase 7).
