# MULTIVERSO · DISEÑO DE DIMENSIONES (diseño aprobado)
**Estado: DISEÑO APROBADO por el usuario (14 nov 2026; decisiones D1–D12 en §10).** La técnica de la navegación se estudia aparte en `10_ESTUDIO_NAVEGACION.md` (pendiente de aprobación). Documento de diseño y planificación: no hay nada de esto en el código, en `datos/` ni en los mapas. F6 sigue pausada hasta que se apruebe. No sustituye ni cambia la hoja de ruta oficial (`05_HOJA_DE_RUTA.md`), el contrato técnico (`06`, `07`, `08`) ni las fichas anteriores (`universos/`), que se conservan tal cual.

Leyenda de estado (igual que `universos/00_comun.md`): **A** = se puede crear con lo que existe · **B** = necesita el contrato del motor · **C** = solo con el motor dimensional funcionando. Todo nombre propio es **provisional**.

Regla de criaturas (decisión ya aprobada, `universos/00_comun.md`): se usan las **20 líneas existentes** con multiplicadores de aparición; **no se inventa ninguna criatura como si existiera**. Los «huecos de diseño» son ideas SIN nombre ni ficha, que solo se crearían por el proceso habitual de fichas y nombres (`GUIA_DE_NOMBRES.md`). Las 20 líneas (elemento): pompon (agua) · aguacato (hoja) · fosforin (fuego) · pilita (eléctrico) · nubecin (aire) · cuarzin (roca) · somnin (sombra) · setin (hoja) · caracolin (agua) · lunabu (sombra) · cenel (fuego) · ferrel (roca) · dandel (aire) · zefirax (aire+eléctrico, legendaria) · zumbel (eléctrico) · arenel (roca) · perlel (agua) · arcel (eléctrico) · forjel (fuego+roca) · cactel (hoja).

---
## 1. Visión global del multiverso

| Dimensión | Estado de diseño | Estado en el juego | En desarrollo ahora |
|---|---|---|---|
| **Tonavia** (mundo original, 8 regiones) | existente | implementada (mapas de Albanota y Carbuna; 6 regiones sin mapas) | no |
| **Nexus «El Cruce»** (hub) | ficha `universos/01_nexus.md` | mapa técnico de prueba (F5) | sí (conexión de las tres dimensiones, §7) |
| **Reino de las Chuches** | ficha `universos/02_reino_chuches.md` | solo en papel | **SELECCIONADA** |
| **Isla Pirata** | nueva, §3 | solo en papel | **SELECCIONADA** |
| **Imperio del Cerezo** | nueva, §4 | solo en papel | **SELECCIONADA** |
| Mundo Salvaje | ficha `universos/03_mundo_salvaje.md` | solo en papel | **aparcada** (documentada, no eliminada) |
| Dimensión Tecnológica | ficha `universos/04_dimension_tecnologica.md` | solo en papel | **aparcada** (documentada, no eliminada) |
| Reino de los Juguetes | idea de la propuesta anterior | — | **descartada/aparcada** (§9) |

Las tres seleccionadas son deliberadamente distintas en tono, ritmo y forma de explorar:

| | Reino de las Chuches | Isla Pirata | Imperio del Cerezo |
|---|---|---|---|
| Tono | acogedor, humor y cariño | aventurero, libre | elegante, sereno, misterioso |
| Forma de explorar | a pie, pueblos y rutas | **por mar**, de isla en isla | a pie, aldeas, templos, ciudad-castillo |
| Pregunta que mueve al jugador | «¿qué ingrediente falta?» | «¿qué hay tras ese horizonte?» | «¿por qué no florece el cerezo?» |
| Actividad propia | cocina y pastelería | navegar, mapas del tesoro, barco propio | sigilo, dojo, festivales |
| Paleta | pastel muy saturado | azul marino, madera, oro | rosa cerezo, laca roja, verde bambú, negro tinta |
| Música (orientación) | caja de música, xilófono | acordeón, violín, olas | koto, flauta, tambor (composición original) |
| Banda de nivel (B) | 8-22 (documentada) | 14-32 (aprobada) | 18-38 (propuesta, sin decidir) |

Principio común: **no todo es combatir ni capturar.** Cada dimensión tiene al menos una actividad que se disfruta sin combate (cocinar, navegar y buscar tesoros, ceremonias y festivales), y al menos un lugar de descanso seguro.

---
## 2. Reino de las Chuches (se mantiene)
**Fuente de verdad: `universos/02_reino_chuches.md`, que NO se modifica.** Mundo de golosinas, caramelos, chocolate, tartas y repostería, con paisajes comestibles; identidad acogedora, colorida y divertida. Se conserva todo lo documentado:
- 4 regiones: Valle Algodón (Villa Merengue, entrada) · Bosque Gominola (Gominar) · Montañas Turrón (Caramelia) · Lago Cacao (Palacio de Azúcar). 14 mapas.
- Misión principal «La Receta Real» (4 ingredientes, una prueba distinta por región), misiones secundarias, evento «Día de la Golosina», pesca en el Lago Cacao.
- NPC: Reina Azucena, Maestro Tarta, Abuela Regaliz, Barón Caramelo (rival), Cacao, Gominola.
- Criaturas: las 20 líneas con los multiplicadores de su ficha (banda de rareza 62/28/10).

**Incorporación de las decisiones nuevas:** ninguna cambia su contenido. Solo se ajusta su lugar en el multiverso (portal de entrada y requisito propuestos, §7). Las ideas de mejora que se comentaron en la conversación (taller de cocina como minijuego central, concurso de tartas con jurado, recursos que viajan entre dimensiones) quedan así: **taller de cocina central y concurso de tartas = contenido futuro APROBADO (D10)**, para después de F8 y sin tocar la ficha original ni implementarlos ahora; los «recursos que viajan entre dimensiones» siguen sin aprobar.

Huecos de diseño de criaturas ya anotados en su ficha: los mantiene; este documento no añade ninguno.

---
## 3. Isla Pirata (nueva)
### 3.1 Idea
Un **archipiélago**: el mar es el protagonista y cada isla tiene su carácter. El jugador llega a Puerto Calavera, consigue su barco y decide qué isla visitar y en qué orden (con una excepción final). Tono aventurero, con humor de piratas amables (no violento). Historia principal: **«El Tesoro del Capitán Leyenda»**: se dice que el Capitán Leyenda partió su mapa en cuatro trozos y los escondió en cuatro islas; la capitana Salitre propone reunirlos antes de que lo haga el rival simpático, el Capitán Pólvora. Tono: carrera amistosa por un tesoro, sin villano malvado.

### 3.2 Cuántas islas al empezar (aprobado, D3: 5 + 2 reservadas; banda 14-32)
**Propuesta: 5 islas + mar abierto** (la capital más 4), con 2 islas «dormidas» reservadas para ampliar después. Razón: 5 caben en el contenido previsto por dimensión (≈14 mapas, como las demás), cada una con una personalidad clara, y el mar entre ellas aporta variedad por sí mismo. Más islas diluirían el contenido; menos haría la navegación irrelevante (aprobado, D3).

### 3.3 Las islas
| Isla (nombre provisional) | Personalidad | Mapas y lugares (ids propuestos `pirata/…`) |
|---|---|---|
| **Puerto Calavera** (entrada y capital) | bulliciosa, humorística, siempre de fiesta | `puerto_calavera` (pueblo 48×36, muelles), `taberna_ancla_rota` (interior), `astillero` (donde se consigue y mejora el barco), `tienda_marinera`, `centro_pc`, `casa_capitana` |
| **Aldea Coral** | acogedora, tranquila; el descanso de la dimensión | `aldea_coral` (pueblo 36×26, casas sobre pilotes), `playa_coral` (ruta con **pesca**), `cueva_marea` (cueva que solo se abre con la marea baja), `casa_pescadora` |
| **Isla Mapa** | jungla de pistas; se explora a pie | `jungla_mapa` (ruta grande 64×64 con zonas de aparición), `campamento_cartografos` (pueblo pequeño), `ruinas_brujula` (mazmorra con puzles de dirección) |
| **Bahía de los Naufragios** | misteriosa y brumosa, sin ser de terror | `costa_pecios` (ruta con barcos varados), `faro_gris`, `galeon_niebla` (mazmorra: interior de un galeón varado con jefe opcional) |
| **Isla Tormenta** (final) | aventura intensa, cielo de rayos | `acantilados_rayo` (ruta grande), `fortaleza_tormenta` (pueblo/fortín), `cueva_tesoro_leyenda` (mazmorra final) |
| *(dormidas, reservadas)* | Fuerte Cañón (base de una armada rival), Isla Volcán | no se diseñan ahora |

Mapas de mar: ver §3.5. Total orientativo: ~16 mapas de tierra más el mar (aprobado, D3).

### 3.4 Criaturas y NPC por isla
Multiplicadores propuestos (B; lo no citado = ×1). Rareza propuesta 55/30/12 (pendiente: se fija al crear el contenido).
| Isla | ×3 | ×2 | ×0,5 | Huecos de diseño (sin nombre) |
|---|---|---|---|---|
| Puerto Calavera (poca fauna) | — | nubecin, dandel | — | gaviota mensajera (aire) |
| Aldea Coral | pompon, caracolin, perlel | setin | forjel | cangrejo con concha de cofre (agua/roca) |
| Isla Mapa | aguacato, setin, cactel | somnin | ferrel | loro imitador (aire) |
| Bahía de los Naufragios | somnin, lunabu | cuarzin, fosforin | dandel | farol-fantasma amistoso (sombra/fuego) |
| Isla Tormenta | pilita, zumbel, arcel | nubecin, forjel | pompon | medusa de rayo (eléctrico/agua); zefirax podría tener allí un lugar especial (aire+eléctrico, **solo si se aprueba**; ya tiene guarida en Albanota) |

NPC (provisionales; evitados los nombres de `datos/agentes.json`): **Capitana Salitre** (guía y misión principal), **Maestro Astillero Brea** (barco y mejoras), **Cocinero Garbanzo** (taberna, recetas marineras), **Pescadora Concha** (Aldea Coral, pesca de altura), **Loro Cartógrafo** (mapas y pistas), **Capitán Pólvora** (rival recurrente; entrenador fijo con el sistema de agentes, F7), **Anselmo, vigía del Faro Gris**, **Viejo Marea** (leyenda del Capitán Leyenda; secreto). Población de entrenadores autónomos propia: propuesta 8 (F7).

### 3.5 Navegación (experiencia aprobada, D4: mar libre, rumbo automático y faros-baliza; la técnica está en `10_ESTUDIO_NAVEGACION.md`)
- **El mar es un espacio explorable**, no un menú: el jugador gobierna su barco sobre un mar con islas visibles a lo lejos (los destinos se ven antes de llegar), corrientes y viento como textura, y puntos de interés en el camino.
- **Desembarcar:** al llegar a un muelle o playa, el jugador baja del barco y pasa a tierra (transición como la de una puerta, con el velo de F5 si cambia de mapa-dimensión).
- **Cada travesía dura poco** (objetivo orientativo: 15-35 s entre islas vecinas según el nivel de las velas) y siempre ofrece algo: islotes con cofres, remolinos, ballenas, botellas con mensajes, un navío del Capitán Pólvora que reta a una carrera, nubes de tormenta que anuncian una zona difícil.
- **Descubrimiento:** el mapa del mar se va «dibujando» al navegar (niebla que se despeja) y las islas nuevas se descubren por pistas (mapas, cartógrafos).
- **Evitar lo lento o aburrido:** (a) **faros-baliza**: tras descubrir un faro se puede viajar entre faros ya visitados sin navegar; (b) **rumbo automático** a un destino conocido (el barco navega solo mientras el jugador descansa o mira; se interrumpe si hay un evento); (c) travesías cortas y distancias medidas para que ninguna sea un trámite; (d) los eventos del mar son opcionales y nunca bloquean.
- **Peligros:** sin «muerte» ni pérdida de progreso. Una tormenta fuerte con un casco débil solo hace volver al puerto más cercano (el jugador entiende por qué necesita mejorar el casco).

### 3.6 Barco: cómo se consigue, mejoras, personalización
- **Primer barco:** misión inicial en Puerto Calavera: la capitana Salitre te presta un **bote** averiado; recoges tres piezas (madera, tela, un ancla) por el puerto (recados que enseñan el lugar) y el Maestro Brea lo deja a flote. Ese bote llega a las islas cercanas (Aldea Coral).
- **Progresión:** bote → **velero** (se compra o se gana en el astillero) → **goleta** (la mejor). Cada paso abre rutas, no obliga a repetir nada.
- **Mejoras (por partes):** casco (resiste tormentas; necesario para la Isla Tormenta), velas (velocidad), bodega (más cargamento/cofres), catalejo (ver islas desde más lejos), cabina (descanso del equipo).
- **Personalización:** nombre del barco, color de velas, bandera, mascarón de proa, decoración de cubierta. Es **cosmética y gratuita o barata**, para que sea expresión personal y no una exigencia.
- **Ampliar:** tripulación (opcional, aprobado D5: NPC que ayudan en actividades concretas; **no** como compañeros de combate).
- Los barcos son del **jugador** (cada jugador tiene el suyo). Aprobado D5: un barco individual por jugador. Cómo se guarda y se sincroniza: `10_ESTUDIO_NAVEGACION.md`.

### 3.7 Secretos, mazmorras y tesoros
- **Mazmorras (3):** Cueva de la Marea (Aldea Coral, marea baja), Ruinas de la Brújula (Isla Mapa), Galeón de la Niebla (Bahía), más la Cueva del Tesoro del Capitán Leyenda (final). Bioma de cada cueva: a decidir (reutilizar los biomas de Profundidades, B).
- **Tesoros:** mapas del tesoro con «X» y pistas (adivinanzas del Loro Cartógrafo), cofres en islotes del mar, botellas con mensajes, las 4 piezas del mapa del Capitán Leyenda (una por isla), un tesoro legendario final.
- **Secretos:** Viejo Marea (Aldea Coral), una isla escondida que solo aparece con los cuatro trozos del mapa, un pecio que solo se ve con la marea baja.
- **Las mareas** usan el **reloj único** de siempre (decisión aprobada): marea alta/baja según la hora del día. No se invierte ni se cambia el reloj.

### 3.8 Actividades exclusivas
Navegar y descubrir · mapas del tesoro · pesca de altura (peces propios, B) · carreras de barcos contra el Capitán Pólvora · concursos de la taberna (minijuegos de nudos y cuentos de marinero, sin apuestas) · personalizar el barco · cocina marinera con Garbanzo (recetas con pescado propio) · fotografía de ballenas y criaturas marinas (aprobada como actividad opcional, D8).

### 3.9 Cómo encaja en la ruta
Entrada por el portal del Nexus; requisito: nivel de entrenador 10 (aprobado, §7). Misión principal: reunir los cuatro trozos del mapa y llegar a la Cueva del Tesoro en la Isla Tormenta (la última, abierta con el casco de goleta o con los cuatro trozos).

---
## 4. Imperio del Cerezo (nueva; sustituye a «Reino de los Juguetes»)
### 4.1 Idea
Japón feudal y cultura tradicional japonesa **de fantasía amable**, con identidad visual elegante y cuidada: aldeas de madera, templos, jardines, bosques de bambú, dojos, un castillo, samuráis, ninjas y festivales. **Historia principal «El Cerezo que no florece»:** cada primavera el Cerezo Eterno del jardín imperial florece y comienza el **Festival de los Mil Faroles**. Este año no ha florecido. La emperatriz Haruka sospecha que los **cuatro Faroles Sagrados** que mantienen su luz (uno por región) se han apagado. Cada farol exige una prueba distinta (sigilo, dojo, templo, ciudad); al encenderlos todos, el cerezo florece y se celebra el festival. Sin villano: el apagón tiene un motivo humano y tierno que se descubre al final (aprobado D9: enfoque tierno).

Cuidado cultural: respeto y rigor, sin parodia ni estereotipo ofensivo; nombres y términos reales usados con sentido; ningún personaje, lugar ni música tomados de obras existentes (todo original).

### 4.2 Regiones y mapas
| Región | Carácter | Mapas y lugares (ids propuestos `cerezo/…`) |
|---|---|---|
| **Aldea Sakura** (entrada) | acogedora; el pueblo de madera y papel | `aldea_sakura` (pueblo 48×36), `casa_te` (interior; tienda y descanso), `casa_baños` (Centro PC con tema de baños termales), `dojo_aldea` (interior, dojo pequeño), `casa_aldeano_1/2` |
| **Bosque de Bambú** | ruta de sigilo y senderos | `bosque_bambu` (ruta grande 64×64), `sendero_toriis` (ruta v 32×64, santuarios y zorros), `casa_ninja` (interior; base de sigilo) |
| **Montaña del Templo** | templo y montaña | `escalera_templo` (ruta v 32×64), `templo_niebla` (pueblo/templo 36×26), `monasterio` (interior), `cueva_campana` (mazmorra) |
| **Ciudad del Castillo** | ciudad grande; torneos y teatro | `ciudad_castillo` (pueblo 48×36), `mercado_ciudad`, `arena_torneo` (gimnasio 24×30, líder de dojo), `teatro_kabuki`-estilo (interior, nombre provisional), `castillo` (interior 3 plantas) |
| **Jardín Imperial / Isla de los Faroles** (final) | jardín y festival | `jardin_cerezo_eterno` (cumbre 48×48), `lago_faroles` (ruta con pesca y faroles flotantes), `palacio_jardin` (interior) |

Total orientativo: ~18-20 mapas con interiores de plantilla. Los edificios reutilizan plantillas (casa, tienda, Centro PC, gimnasio) con piezas temáticas nuevas (B/A según contenido).

### 4.3 Estilo visual (identidad muy reconocible)
- **Arquitectura:** tejados curvos de teja oscura, madera y papel (shoji), puertas torii rojas, linternas de papel, puentes arqueados, jardines de piedra y estanques con carpas.
- **Paleta:** rosa cerezo y blanco, rojo laca, verde bambú, negro tinta y dorado tenue; fondo de cielo claro de acuarela.
- **Atmósfera:** **pétalos que caen** (se apoya en las partículas actuales), luces de faroles de noche, niebla de montaña en el templo; cada región con luz y música propias (contenido, Sonnet).
- **Música (orientación):** koto, flauta de bambú, taiko, shamisen; composición original.

### 4.4 NPC y personajes
Provisionales (sin colisión con `datos/agentes.json`): **Emperatriz Haruka** (la que pide ayuda), **Abuelo Takeo** (cuidador del Cerezo Eterno; secreto), **Kaede** (kunoichi; guía de sigilo), **Maestra Sumire** (dojo de la aldea; entrena), **Ren** (samurái rival honorable; entrenador fijo, F7), **Monje Gen** (Templo en la Niebla), **Daisuke** (tendero y chef de la casa de té), **Mei** (niña que vende faroles; guía amable), **Maestro del Torneo** (líder de la arena). Población de entrenadores autónomos propia: propuesta 8-10 (F7), con nombres y frases del tema.

### 4.5 Criaturas
Multiplicadores propuestos (B). Rareza propuesta 56/29/11 (pendiente: se fija al crear el contenido).
| Zona | ×3 | ×2 | ×0,5 | Huecos de diseño (sin nombre) |
|---|---|---|---|---|
| Aldea Sakura | setin, dandel | aguacato, pompon | forjel | carpa koi de estanque (agua) |
| Bosque de Bambú | aguacato, setin | somnin, nubecin | ferrel | zorro de santuario (sombra/fuego) |
| Montaña del Templo | cuarzin, nubecin | lunabu, ferrel | pompon | mapache de niebla (roca/sombra) |
| Ciudad del Castillo | zumbel, pilita | cenel, fosforin | — | grulla de papel (aire) |
| Jardín Imperial | perlel, aguacato | pompon, lunabu | — | libélula de farol (aire/eléctrico) |
Zefirax: sin papel especial en esta dimensión (aprobado, D9).

### 4.6 Actividades exclusivas
- **Misiones de sigilo** (Kaede): entrar en un recinto o recuperar un objeto sin ser visto por los guardias del castillo; premio de reputación y atajos.
- **Torneos de dojo** (Maestra Sumire, arena de la Ciudad del Castillo): combates ordenados en rondas con reglas y honor (el sistema de combate actual; formato de torneo = contenido B/C).
- **Festivales:** Festival de los Mil Faroles (final) y festivales menores por región (faroles flotantes, fuegos artificiales, puestos de juegos tradicionales).
- **Ceremonia del té:** minijuego tranquilo (sin combate) en la casa de té.
- **Caligrafía / origami:** minijuegos de creación que dan objetos decorativos o permisos.
- **Pesca de carpas** en estanques y en el Lago de los Faroles (peces propios, B).

### 4.7 Cómo encaja en la ruta
Entrada por el portal del Nexus; requisito: nivel de entrenador 15 (aprobado, §7). Misión principal: encender los cuatro Faroles Sagrados (Aldea: pergamino y prueba de la maestra; Bosque: sigilo de Kaede; Montaña: reto del monje; Ciudad: torneo) y llegar al Jardín Imperial.

---
## 5. Particularidades que diferencian cada mundo
- **Chuches:** cocina y repostería; paisaje comestible; el mundo más acogedor.
- **Isla Pirata:** el mar y el barco propio como forma de jugar; mapas del tesoro; mareas con el reloj único.
- **Imperio del Cerezo:** sigilo, dojo, festivales y estética tradicional cuidada.
Cada una tiene además lugares de descanso y actividades sin combate.

## 6. Resumen de contenido y reutilización
Mapas orientativos: Chuches 14 · Isla Pirata ~16 + mar · Cerezo ~18-20. Reutilizan plantillas existentes (casa, tienda, Centro PC, gimnasio) y el compositor de mapas (A). Criaturas: solo las 20 líneas existentes, más huecos de diseño anotados (sin crear nada). Todo lo que necesita al motor (tablas de aparición por zona, nivel base por región, eventos, marcas de progreso, entrenadores por dimensión, barco y navegación) depende de F6-F8 y de la decisión técnica sobre la navegación (D4).

---
## 7. Conexión con el Nexus (propuesta de organización; sin tocar el sistema técnico de portales)
`universos/01_nexus.md` define un anillo con **4 portales en cruz y 3 huecos dormidos**. Con las tres seleccionadas queda así, **sin ampliar el número de portales**:

| Posición | Portal | Estado | Color propuesto del marco |
|---|---|---|---|
| Sur (por donde se llega) | **Albanota / Tonavia** (vuelta) | activo | violeta (ya en datos) |
| Norte | **Reino de las Chuches** | activo | rosa chicle (#ff8fc7) |
| Este | **Isla Pirata** | activo | azul marino con toques de oro |
| Oeste | **Imperio del Cerezo** | activo | rojo laca |
| Hueco 1 | Mundo Salvaje | dormido (aparcado) | verde apagado |
| Hueco 2 | Dimensión Tecnológica | dormido (aparcado) | cian apagado |
| Hueco 3 | libre | dormido | gris apagado |
Los huecos dormidos se ven como portales «sin luz» (la identidad del Nexus: otros mundos esperan). Ninguna dimensión aparcada se elimina ni se rehace: se despertaría más adelante sin tocar el mapa. Si algún día se quieren más de 7 portales, se estudiaría entonces (no se propone ahora).

**Requisitos de acceso APROBADOS (D6; nivel de entrenador, dato configurable):** Nexus (desde la Ermita) 5 · Chuches 6 · Isla Pirata 10 · Imperio del Cerezo 15. **No se exige haber completado otra dimensión ni hitos de historia.**

**Orden (aprobado, D7):** las tres abren al alcanzar su nivel, sin orden obligatorio. Dificultad recomendada (solo orientativa): Chuches → Pirata → Cerezo.

**Otras conexiones:** el **tablón global** y el **Centro PC** del Nexus sirven a todas; el mercado del Nexus puede comerciar con recursos propios de cada dimensión (recursos de Chuches, de la Isla Pirata, del Cerezo: concepto, sin decidir tipos de objeto). Entrenadores visitantes de cada dimensión pasean por el Nexus (F7, contenido C).

---
## 8. Impacto en la hoja de ruta
La hoja de ruta oficial no se toca. El impacto técnico del barco y la navegación (D4) se analiza en `10_ESTUDIO_NAVEGACION.md`, que propone una entrega nueva y pide decisiones técnicas **antes de F6**. Hasta que se apruebe, F6 sigue pausada y no se programa nada.

---
## 9. Dimensiones candidatas futuras y aparcadas (NO forman parte del desarrollo actual)
**Aparcadas por decisión (documentadas):** Mundo Salvaje · Dimensión Tecnológica (fichas conservadas).
**Descartada/aparcada:** **Reino de los Juguetes** (plástico, bloques, juguetería gigante): se sustituyó por el Imperio del Cerezo; queda registrada por si se quisiera recuperar.
**Candidatas de la propuesta de 14 (sin desarrollar):** Tierra de Dinosaurios · Reino Medieval · Frontera del Oeste · Cumbre Invernal · Archipiélago Tropical · Gran Circo y Feria · Colonia Estelar · Desierto de Faraones · Fondo del Mar · Valle de la Granja · Mansión Halloween. (Isla Pirata y Cerezo ya han salido de esta lista.) Ninguna se incorpora sin tu aprobación.

---
## 10. Decisiones aprobadas (14 nov 2026)
| # | Decisión aprobada |
|---|---|
| D1 | Visión global: Chuches, Isla Pirata e Imperio del Cerezo son las tres dimensiones seleccionadas. |
| D2 | Mundo Salvaje y Dimensión Tecnológica **aparcadas**, con sus fichas y sus portales dormidos en el Nexus. Reino de los Juguetes descartado/aparcado. |
| D3 | Isla Pirata: 5 islas iniciales + 2 reservadas; banda de nivel 14-32. |
| D4 | Navegación: **mar libre navegable**, con **rumbo automático** y **faros-baliza** para viajar entre destinos descubiertos. La solución técnica se estudia antes de F6 (`10_ESTUDIO_NAVEGACION.md`); no se implementa todavía. |
| D5 | Barco: bote → velero → goleta; mejoras por partes; personalización gratuita; **un barco individual por jugador**; tripulación opcional solo como ayuda en actividades. |
| D6 | Acceso por nivel de entrenador: Chuches 6, Pirata 10, Cerezo 15. Sin exigir completar otra dimensión ni hitos de historia. |
| D7 | Las tres disponibles al alcanzar su nivel, sin orden obligatorio. |
| D8 | Fotografía de criaturas: actividad opcional de Isla Pirata. |
| D9 | Historia del Cerezo con enfoque tierno. Zefirax sin papel especial en esa dimensión. |
| D10 | Taller de cocina central y concurso de tartas: contenido futuro aprobado de Chuches (no se modifica su ficha ni se implementa ahora). |
| D11 | Orden de creación del contenido, tras F8: Chuches → Isla Pirata → Imperio del Cerezo. |
| D12 | Las 6 regiones sin mapas de Tonavia se diseñan aparte, después de estas tres. |

**Cabos sueltos de contenido (no bloquean, se cierran al crear el contenido):** banda de nivel del Cerezo (18-38 propuesta), pesos de rareza de Pirata y Cerezo, número de entrenadores autónomos por dimensión, nombres provisionales de islas, regiones y NPC.
