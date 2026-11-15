# Fichas de identidad · 7 líneas evolutivas (aprobadas; las 7 hechas) + línea nº 8 (Voltel, hecha en v1.2)

Estado: escritas en v1.1 (paso 1 del método). NO se dibuja nada hasta que el usuario las apruebe.
Tamaño y peso por fase: propios de cada línea (aprobado en v1.1, ya no hay +2 fijo; tabla abajo y en código `G.LINE_PLAN`). Colores por rareza (DISENO_CRIATURAS.md, sección 5): Común 3-4 · Rara 4-5 · Épica 5-6.
NOMBRES (aprobados por el usuario en v1.1): estilo Charmander-Charmeleon-Charizard, raíz común al inicio, palabras inventadas (sin unir dos palabras, sin diminutivos en -ín). Los ids internos del código NO cambian (pompon, fosforin, setin, caracolin, somnin, cuarzin, lunabu, pilita, nubecin, aguacaton, aguacatigre); solo cambia el nombre que se ve.

| Id | Fase 1 | Fase 2 | Fase 3 |
|---|---|---|---|
| aguacato | Aguacato (Oli, se queda) | Aguacaryn | Aguacarax |
| pompon | Ondel | Ondavar | – |
| fosforin | Ignel | Ignavar | – |
| setin | Micel | Micavar | – |
| caracolin | Espirel | Espiravar | – |
| somnin | Somnel | Somnaris | – |
| cuarzin | Cuarel | Cuarvel | Cuarzoth |
| lunabu | Lunel | Lunareth | Lunaroth |
| pilita | Voltel | Voltavar  | Voltorax  |
| nubecin | Nimbel | – | – |

## TAMAÑO Y PESO (aprobado en v1.1)
| Línea | Fase 1 | Fase 2 | Fase 3 | Lógica |
|---|---|---|---|---|
| Aguacato | 18×18, 3 kg | Aguacaryn 20×20, 6 kg | Aguacarax 22×22, 14 kg | el hueso y los músculos pesan |
| Ondel | 14×14, 1,2 kg | Ondavar 18×12, 2 kg | – | se ensancha y se aplana (nenúfar), flota |
| Ignel | 12×16, 0,8 kg | Ignavar 14×16, 1 kg | – | misma altura (la cerilla se consume); la llama no pesa |
| Micel | 14×16, 2 kg | Micavar 18×18, 5 kg | – | sombrero muy ancho y pie alto |
| Espirel | 20×14, 4 kg | Espiravar 20×18, 9 kg | – | mismo largo, concha-torre alta y pesada |
| Somnel | 16×20, 3 kg | Somnaris 16×22, 2 kg | – | más alto con la capa pero más ligero (flota) |
| Cuarel | 18×16, 25 kg | Cuarvel 20×18, 45 kg | Cuarzoth 22×24, 120 kg | roca pesadísima, los cristales dan altura |
| Lunel | 20×20, 4 kg | Lunareth 26×20, 6 kg | Lunaroth 24×26, 8 kg | alas abiertas (ancho), luego alto y majestuoso; plumas ligeras |
| Voltel | 14×18, 2,5 kg | Voltavar 18×16, 6 kg  | Voltorax 20×26, 15 kg  | de pila a batería ancha y baja, luego torre-bobina alta; los bornes y las bobinas pesan |
| Nimbel | 20×12, 0,1 kg | – | – | nube: casi no pesa |

## 1. Ondel (Agua, Común, 2 fases) · HECHA en v1.1 (Ondavar dibujado) · 14×14 → 18×12
- Historia: gota con hojita (cría) → nenúfar con su hoja-paraguas (joven).
- **Ondavar** (fase 2): cuerpo más bajo y ancho (cintura de flor de loto), hoja grande y plana sobre la cabeza que sobresale por los lados. Silueta: de gota alta a seta-nenúfar achatada.
- Paleta: teal claro con hojita (fase 1) → azul profundo con hoja verde oscura y pétalo rosa en la base (3-4 colores).
- Rasgo propio: la hoja-paraguas gotea cuando está parada (frame 2: cae una gota); rebota menos (1 px) y más despacio (velocidad 15 frente a 20). Hecho así en Ondavar.
- Cómo quedó dibujado: hoja ancha de nenúfar verde con muesca en la esquina baja, cuerpo azul con sombra azul oscura, pétalos de loto rosas en la base (de lado, un capullo rosa hace de cola), mejillas rosas, patitas naranjas, gota de brillo teal.
- Se conserva: teal, mejillas rosas, hojita, pies rojos, ojos grandes.

## 2. Ignel (Fuego, Común, 2 fases) · HECHA en v1.1 (Ignavar dibujado) · 12×16 → 14×16
- Historia: cerilla nueva (cría) → cerilla encendida con melena de llama (joven).
- **Ignavar** (fase 2): cuerpo más corto y llama grande en forma de melena asimétrica que cambia la silueta (de palo delgado a figura con cabeza ancha). Brazos pequeños.
- Paleta: cabeza roja y cuerpo crema → cuerpo crema ahumado, llama naranja y amarilla, pies de carboncillo (4 colores).
- Rasgo propio: la llama parpadea siempre (frame 2) y suelta una chispa al parar; saltitos más largos y más lentos.
- Se conserva: punta roja de cerilla, cuerpo crema, saltitos.
- Cómo quedó dibujado: cabeza roja ancha (sombreada abajo) con cejas y ojos grandes; melena de 3 lenguas de llama naranja con núcleo amarillo (alta a la izquierda, bajas a la derecha) más mechones laterales; de espaldas, la melena cubre toda la nuca; de perfil fluye hacia atrás. Cuerpo corto crema ahumado con sombra, bracitos oscuros y pies de carboncillo. Frame 2: las lenguas cambian de altura y salta una chispa amarilla. Movimiento: `hop [4,10]` (más alto, más lento), speed 22, `flick 3.2`.

## 3. Micel (Hoja, Común, 2 fases) · HECHA en v1.1 (Micavar dibujado) · 14×16 → 18×18
- Historia: seta pequeña (cría) → seta con sombrero de ala ancha y pie con anillo (joven).
- **Micavar** (fase 2): sombrero ancho tipo paraguas que sobresale, pie alto con anillo-falda y base de musgo. Silueta: de seta redonda y compacta a «T» alta con ala ancha.
- Paleta: sombrero rojo con puntos blancos y pie crema → rojo granate con puntos crema, laminillas visibles, anillo claro y musgo verde (4 colores).
- Rasgo propio: nube de esporas (píxeles claros) que suelta al parar o al saltar (frame 2); contoneo suave en vez de saltitos.
- Se conserva: sombrero rojo con puntos blancos, pie crema, carita con mejillas.
- Cómo quedó dibujado: sombrero granate de 18 px que sobresale a los lados, puntos crema, borde de laminillas alternando dos tonos, anillo-falda blanco con sombra, pie crema estrecho con carita (ojos, mejillas rosas, boca) y base de musgo verde. De espaldas, borde liso sin laminillas ni cara. Frame 2: esporas verde claro alrededor. Movimiento: `sway [1,8]`, speed 13, `flick 2.4`, sin saltitos.

## 4. Espirel (Agua, Rara, 2 fases) · HECHA en v1.1 (Espiravar dibujado) · 20×14 → 20×18
- Historia: caracol con concha de espiral (cría) → caracol con concha-torre y acuario (joven).
- **Espiravar** (fase 2): cuerpo más corto y concha alta en forma de torre cónica con una ventanita (silueta de «montaña» frente al óvalo bajo y largo de la fase 1).
- Paleta: cuerpo menta, concha azul con centro amarillo → cuerpo turquesa, concha azul marino con nácar rosa-crema, borde y ventana dorados (5 colores).
- Rasgo propio (objeto): ventana de la concha con un pececito que nada (frame 2) y burbujas; antenas que suben y bajan. Sigue siendo lentísimo.
- Se conserva: cuerpo menta, concha azul con centro amarillo, ojos en antenas.
- Cómo quedó dibujado: concha cónica de 14 filas azul marino con franjas de nácar en espiral, punta dorada y borde dorado en la base; ventanita dorada con agua celeste y pececito naranja. Cuerpo turquesa corto y ancho; cabeza con dos antenas gruesas con ojos y mejillas rosas. De espaldas, torre lisa sin ventana ni cara. Frame 2: el pez cambia de sitio y suben dos burbujas; antenas: frame 0 normal, frame 1 alta, frame 2 baja. Movimiento: speed 5, `flick 2.0`.

## 5. Somnel (Sombra, Rara, 2 fases) · HECHA en v1.1 (Somnaris dibujado) · 16×20 → 16×22
- Historia: duendecillo dormilón con gorro de mago (cría) → mago de los sueños con capa (joven).
- **Somnaris** (fase 2): gorro más alto y torcido con borla-estrella, capa que cae por detrás con cola ondulada y luna creciente al cuello. Silueta: de gota con gorro a figura con capa y cola.
- Paleta: morado, gorro oscuro, estrellitas amarillas → índigo y azul noche, capa con estrellas, luna crema, ojos entreabiertos (5 colores).
- Rasgo propio (movimiento): ya no cabecea: flota unos píxeles sobre el suelo y la capa ondea (frame 2); abre un ojo al hablarle.
- Se conserva: gorro con estrellitas amarillas, cuerpo morado, ojitos de rayita.
- Cómo quedó dibujado: el gorro sigue siendo el de dormir (no de mago) pero más alto y torcido, con la punta curvada a la derecha (hacia atrás en el perfil), borla-estrella amarilla con centro crema y dos estrellitas; cabeza morada pequeña con ojos entreabiertos (ranura oscura y un punto claro); capa índigo en campana con estrellitas, luna creciente crema al cuello y borde ondulado; de perfil la cola de la capa sobresale por detrás. Sin pies: flota. Frame 2: la capa se ensancha y una estrella centellea. Frame 3 (al hablarle): el ojo izquierdo se abre del todo. Movimiento: `float [2, 1.4]`, speed 10, `flick 2.0`, `eye`.

## 6. Cuarel (Roca, Rara, 3 fases) · HECHA en v1.1 (Cuarvel y Cuarzoth dibujados) · 18×16 → 20×18 → 22×24
- Historia: guijarro con casco de minero (cría) → minero con pico y mochila de cristales (joven) → coloso de cristal (adulto).
- **Cuarvel** (fase 2): cuerpo ancho de hombros cuadrados, pico a un lado (objeto) y mochila con cristales pequeños a la espalda. Silueta: bloque con «asa» del pico.
- **Cuarzoth** (fase 3): torre de cristales apuntados en la espalda y los hombros; silueta de montaña irregular. Casco dorado con luz que parpadea.
- Paleta: gris con casco amarillo y cuernos teal → pizarra oscura, casco naranja, vetas teal → pizarra con cristales teal y violeta brillantes, casco dorado, luz blanca (4 → 5 → 6 colores, de Rara a casi Épica).
- Rasgo propio: F1 casco · F2 pico (se apoya en él al parar) · F3 cristales que destellan (frame 2). Muy pesado y lento en F1-F2; en F3 casi no anda y destella.
- Se conserva: casco de minero con luz, cuerpo de roca gris, teal de los cuernos y vetas.
- Cómo quedó dibujado (Cuarvel, 20×18): cuerpo de pizarra de hombros cuadrados con luz arriba-izquierda y sombra abajo-derecha, casco naranja con lámpara y ala oscura sobre una cara de piedra con ojos grandes, brazos cuadrados, pico de mango de madera con cabeza de hierro en la mano derecha (en perfil, delante; de espaldas, en el lado contrario), tirantes de cuero cruzados al pecho y mochila de cuero que de espaldas tapa el cuerpo y de perfil sobresale; cristales teal (y uno violeta de perfil) asoman por detrás. Frame 2: se inclina 1 px, el pico baja y un cristal destella. Movimiento: `flick 2.4`, speed 6 (Cuarel 8).
- Cómo quedó dibujado (Cuarzoth, 22×24): silueta de montaña irregular (aguja central teal de 11 px, cristales violeta y teal en hombros y espalda, de perfil se inclinan hacia atrás y sobresalen por detrás); torso ancho de pizarra con hombreras, brazos gruesos con nudillos, piernas cortas; gema violeta con aro dorado en el pecho y vetas teal; casco dorado con lámpara blanca y ojos de luz teal; de espaldas, sin cara ni gema. Frame 2: lámpara y ojos en blanco, todos los cristales destellan y saltan estrellitas. Movimiento: `flick 1.6`, speed 3.
- Los cristales siguen la morfología real del cuarzo (prisma con punta, cara izquierda clara y derecha oscura, estrías horizontales) y las paletas usan hue shifting (sombras hacia el violeta, luces hacia el azul).

## 7. Lunel (Sombra, Épica, 3 fases) · HECHA en v1.1 (Lunareth y Lunaroth dibujados) · 20×20 → 26×20 → 24×26
- Historia: búho lunar de ojos enormes (cría) → búho del eclipse con alas abiertas (joven) → búho cósmico, guardián del cielo (adulto).
- **Lunareth** (fase 2): alas desplegadas a los lados (silueta ancha, en «M»), luna en el pecho medio tapada por un eclipse. Orejitas con estrellas.
- **Lunaroth** (fase 3): silueta alta y majestuosa: alas largas de cielo nocturno con estrellas, cola de cometa y corona de luna llena sobre la cabeza.
- Paleta: morado con ojos amarillos y barriga lila → morado más oscuro con ojos ámbar, luna crema y borde dorado → azul noche y violeta con estrellas blancas, luna llena y acentos dorados brillantes (5 → 6 → 6 colores, rareza Épica).
- Rasgo propio: F1 ojos-luna · F2 alas que se abren y cierran · F3 aura de destellos y cola de cometa. Siempre flota; cada fase más alta y más suave.
- Se conserva: ojos amarillos grandes, estrellitas en las orejas, cuerpo morado, pies naranjas y luna.
- Cómo quedó dibujado (Lunareth, 26×20): alas desplegadas a los lados (violeta oscuro con borde claro y plumas), cuerpo morado más claro para destacar, cejas, ojos ámbar con pupila, pico naranja, lunita dorada en la frente, orejas-mechón con estrella y eclipse en el pecho (disco crema tapado por otro oscuro, con puntos dorados). De perfil, un ala larga hacia atrás y arriba; de espaldas, estrellas en el lomo. Frame 2: alas más altas, eclipse blanco y dorado. `float [3,1.3]`, speed 12, `flick 2.2`.
- Cómo quedó dibujado (Lunaroth, 24×26): corona de luna llena (cráteres, aro dorado) sobre la cabeza, ojos dorados, orejas con punta dorada, vientre lila con adorno dorado, alas largas azul noche con estrellas y borde dorado que cuelgan en banderas, cola de cometa dorada. Frame 2: aro y ojos más brillantes y destellos alrededor. `float [4,1.1]`, speed 10, `flick 1.8`.

## 8. Voltel (Eléctrico, **Rara** (antes Común), 3 fases) · HECHA en v1.2 (Voltavar y Voltorax dibujados) · 14×18 → 18×16 → 20×26
Estado: **aprobada y dibujada en v1.2** (el usuario pidió implementarla tal cual). Los cambios respecto a la ficha están en «Cómo quedó dibujado». Boceto previo: `docs/voltel_propuesta_siluetas.png`.
- **Por qué Rara:** las reglas (DISENO_CRIATURAS.md, sección 2) dan a las Comunes 1-2 fases; 3 fases es de Rara o superior. Rara = 4-5 colores, un rasgo claro y un objeto/accesorio por fase (aquí: pinzas + arco en F2, bobina + rayos en F3; Voltorax llega a 6 colores con brillo, como Cuarzoth).
- Nombres (aprobados; estilo Charmander-Charmeleon-Charizard, raíz «Volt-», palabras inventadas, sin diminutivos en -ín): **Voltel → Voltavar → Voltorax**. Ids: `pilita` (no cambia) → `voltavar` → `voltorax`, `family: 'pilita'`.
- **Historia (cría → joven → adulto):** pila viva y traviesa que da calambre a todo → batería de coche curtida en mil cacharros, con pinzas de arranque (de «cargar» a «dar el arranque») → torre-bobina que llama a las tormentas y las guarda en su esfera. Cada fase es una **máquina eléctrica real distinta** (pila → batería → bobina Tesla), así la evolución cuenta una historia y no es solo «más grande».
- **Idea de diseño que une las tres fases:** el **rayo**. En Voltel es un dibujo naranja en la espalda; en Voltavar pasa a ser un **arco azul vivo** entre los bornes; en Voltorax es **luz que recorre todo el cuerpo** y sale en rayos. El rayo «se enciende» fase a fase (naranja → azul → blanco-azul).

### 8.1 Siluetas (prueba del negro: las tres se distinguen sin color)
Cada boceto es la silueta de frente a la medida del lienzo; el ajuste final de píxeles sale al dibujar. `#` = silueta.
| | Voltel (14×18, ya hecha) | Voltavar (18×16) | Voltorax (20×26) |
|---|---|---|---|
| Forma | cilindro alto con borne central | **bloque ancho y bajo** con **dos bornes** y pinzas a los lados | **torre simétrica**: esfera arriba, cuello, bobina, base ancha |
| Proporción | alto y estrecho | ancho y bajo (más ancho que alto) | muy alto (casi el doble de alto que de ancho) |
| «Asa» de la silueta | brazos pequeños | pinzas abiertas a ambos lados + dos bornes arriba | brazos-cable con pinzas + base que se ensancha |

```
Voltavar 18×16                      Voltorax 20×26
..###........###..   ........####........  esfera (0-6)
..###........###..   ......########......
..##############..   .....##########.....
.################.   .....##########.....
.################.   .....##########.....
.################.   .....##########.....
##################   ......########......
##################   .......######.......  cuello (7-10)
##################   ........####........
##################   ........####........
##################   .......######.......
.################.   ..###.########.###..  hombros / brazos (11-17)
..##############..   ..################..
...###......###...   ..################..
...###......###...   ..################..
...###......###...   ..###.########.###..
                     ..###.########.###..
                     ..###.########.###..
                     .....##########.....  bobina (18-19)
                     .....##########.....
                     ...##############...  base (20-21)
                     ...##############...
                     ...####......####...  patas (22-25)
                     ...####......####...
                     ...####......####...
                     ...####......####...
```
(Voltavar: filas 0-15 · Voltorax: filas 0-25. Los rayos y las chispas del frame 2 sobresalen de esta silueta y no cuentan en el boceto.)

### 8.2 Voltavar · fase 2 · 18×16 · 6 kg · «la batería de arranque»
- **Cuerpo:** carcasa rectangular de **acero azul pizarra** (sin degradados: plano con luz arriba-izquierda y sombra abajo-derecha, hue shifting hacia el violeta). Esquinas redondeadas, **asa** moldeada en la tapa y **dos filas de tapones** de celda. Una **banda amarilla** de etiqueta cruza el frente con el **rayo naranja** de Voltel dibujado dentro (se conserva el emblema).
- **Bornes:** dos arriba, uno con tapa **naranja** (+) y otro con tapa **gris** (–); heredan el borne grande de Voltel. **Entre los dos salta un arco azul eléctrico** (en el frame 2).
- **Brazos:** **pinzas de cocodrilo** (mordazas de metal gris con dientes, mango naranja aislante) que sobresalen 1 px de la silueta a cada lado; el cable de cada pinza baja y se enrolla.
- **Cara:** en la mitad alta del frente: ojos negros con brillo blanco (como Voltel) pero **más rasgados, con cejas** (más carácter: Rara); boca de rendija con un **colmillo-clavija** pequeño.
- **Patas:** dos patas gruesas naranjas de 3 px (en Voltel eran patitas de 2 px): «más pesada y firme».
- **Vistas:**
  - *Frente:* cara, banda con rayo, pinzas abiertas.
  - *Espalda:* sin cara; en lugar de la banda, el **rayo naranja grande** en la carcasa y los **cables enrollados** colgando; bornes de frente.
  - *Perfil:* carcasa estrecha (la batería es más larga que ancha: 1 borne a la vista y el otro tapado), una pinza por delante y la **cola de cable enroscado** por detrás, que sobresale de la silueta; arco visible solo en el frame 2.
- **Movimiento:** trote corto y firme (`speed 18`, `wait [0.6, 1.6]`, sin saltitos); sombra ancha `[14, 3, 0]`. **Frame 1:** sube 1 px. **Frame 2 (parado, `flick 2.0`):** el arco azul salta entre los bornes y las pinzas castañetean (mordazas cerradas/abiertas); la banda de etiqueta parpadea en amarillo claro.
- **Se conserva de Voltel:** amarillo y naranja, borne gris, rayo naranja, ojos negros con brillo blanco, patas naranjas, expresión traviesa.

### 8.3 Voltorax · fase 3 · 20×26 · 15 kg · «la bobina de tormentas»
- **Cabeza = esfera/toroide de luz:** esfera grande (8 px de ancho) azul eléctrico con **anillo de cobre** alrededor del «ecuador» y reflejo blanco arriba-izquierda; **ojos de luz blanco-azul** (sin pupila negra: gran cambio de carácter respecto a Voltel y Voltavar); de espaldas la esfera no tiene cara.
- **Cuello:** estrecho, de metal oscuro, con una **gema amarilla** (el amarillo de Voltel) como collar.
- **Cuerpo = bobina secundaria:** cilindro de **hilo de cobre enrollado** (franjas horizontales alternas cobre claro/oscuro, como el bobinado real) sobre un núcleo pizarra; **hombreras** con pernos; la **banda y el rayo** de las fases anteriores son ahora **vetas de luz azul** que bajan por el pecho.
- **Brazos:** gruesos **cables aislados** (pizarra con anillos naranja) que terminan en **pinzas** (herencia de Voltavar), caen a los lados como los hombros de un coloso.
- **Base = bobina primaria:** disco ancho **en espiral de cobre** a los pies y **patas** gruesas de pizarra con puntera naranja.
- **Rayos:** 2-3 **rayos** (zigzag azul claro y blanco) nacen de la esfera y bajan en arco hacia las pinzas: es lo que le da silueta propia de tormenta. En el frame 2 son más largos y hay chispas sueltas.
- **Vistas:**
  - *Frente:* esfera con cara de luz, bobina con vetas, pinzas.
  - *Espalda:* sin cara; un **rayo gigante** recorre el cuerpo de la esfera a la base (el rayo naranja de Voltel, ahora blanco-azul) y la cola de cable enroscado sale por detrás.
  - *Perfil:* torre estrecha (la bobina se ve más fina), la esfera algo adelantada, el brazo-cable por delante y la cola por detrás; los rayos se curvan hacia atrás.
- **Movimiento:** pasos pesados y lentos (`speed 7`, `wait [1.5, 3.5]`), sombra `[16, 3, 0]`. **Frame 1:** sube 1 px. **Frame 2 (parado, `flick 1.4`):** la esfera se enciende al blanco, los ojos brillan, los rayos se alargan, saltan chispas y las vetas del pecho parpadean. Es la fase «de poder»: destaca de lejos, como Cuarzoth y Lunaroth.
- **Se conserva de Voltel y Voltavar:** el amarillo (gema del cuello y detalles), el cobre/naranja de los accesorios, el rayo como emblema (ahora en luz), las **pinzas** de Voltavar y las patas gruesas con puntera naranja.

### 8.4 Paleta por fase (hue shifting: sombras hacia el violeta, luces hacia el azul, como Cuarel)
Contorno oscuro común (`#2a1b30`). Colores (los usados, sin degradados; Voltorax añade `#1f3fa8` para la esfera):
| Fase | Colores (sin contar contorno) | Valores |
|---|---|---|
| Voltel (hecha, 3-4) | amarillo, naranja, gris | `#f7d54a`, `#f09a3e`, `#b9b4c4` / `#8a8498` |
| **Voltavar (5)** | acero azul pizarra (base, sombra, luz) · amarillo etiqueta (+luz) · naranja (+sombra) · gris metal (+sombra) · azul eléctrico del arco | pizarra `#3c4468` / sombra `#262b4a` / luz `#5b6694` · amarillo `#f7d54a` / luz `#fff09a` · naranja `#f09a3e` / sombra `#c8651f` · metal `#b9b4c4` / `#8a8498` · arco `#4fd8ff` y núcleo `#d6faff` |
| **Voltorax (6 con brillo)** | pizarra oscura (cuerpo y patas) · cobre (bobina, 3 tonos) · amarillo (gema, detalles) · naranja (punteras, anillos) · azul eléctrico (esfera, vetas) · blanco-azul (ojos, núcleo de rayos) | pizarra `#2c3150` / sombra `#1b1e38` / luz `#4a5382` · cobre `#c9743a` / luz `#f0a868` / sombra `#8f4a24` · amarillo `#f7d54a` · naranja `#f09a3e` · azul `#3fa9ff` / sombra `#2a5fd0` / luz `#9be8ff` · blanco `#f4feff` |
La **rareza se nota subiendo de color y brillo**: Voltel mate y cálido → Voltavar con un acento frío (el arco) → Voltorax con luz propia (esfera y rayos), igual que Cuarel va de gris a cristales brillantes.

### 8.5 Qué cambia y qué se conserva (regla de v1.0: silueta, paleta y rasgo propio)
| | Voltel | Voltavar | Voltorax |
|---|---|---|---|
| Silueta | cilindro alto | bloque ancho y bajo con pinzas | torre con esfera y base ancha |
| Paleta | amarillo/naranja/gris, mate | pizarra + amarillo + arco azul | pizarra + cobre + luz azul y blanca |
| Objeto | borne grande | pinzas de cocodrilo y asa | bobina y rayos (pinzas heredadas) |
| Rasgo | rayo naranja en la espalda | arco entre bornes, pinzas que castañetean | esfera que se enciende y suelta rayos |
| Movimiento | trote corto | trote firme | pasos pesados y lentos |
| Ojos | negros con brillo | negros rasgados con cejas | de luz blanco-azul |
- Tamaño y peso (aprobado; datos de `G.LINE_PLAN`): `pilita: [[14,18,2.5],[18,16,6],[20,26,15]]`. Lógica: la batería es baja y ancha pero densa; la bobina es muy alta y pesa por el cobre y el pie.
- Frases (ya en el juego): Voltavar «¡Zzzap! Ahora tengo pinzas... ¡y no pienso soltarlas!» · Voltorax «Cuando yo hago crrrac, el cielo contesta.»
- Rasgo de datos: `flick` (frame 2) en las dos fases nuevas. No hace falta ningún rasgo nuevo en el código.
- Al aprobar: seguir las reglas de abajo (vista previa de 4 direcciones × 3 frames antes de empaquetar, tests, documentos, un ZIP y PARAR). Posible retoque a decidir tras la vista previa: si la esfera de Voltorax se lee mejor como toroide (anillo con hueco) que como esfera con anillo.

### 8.6 Cómo quedó dibujado (v1.2)
- **Voltavar (18×16):** carcasa de acero azul pizarra con luz arriba-izquierda; **placa amarilla** en el frente que hace de cara (ojos negros con brillo y cejas inclinadas, boca de rendija con un colmillo blanco), banda inferior de **franjas diagonales naranja y amarillas** (advertencia), dos bornes (naranja y gris) con tapones de celda entre ellos, **pinzas de cocodrilo de 2 px** a cada lado (mango naranja, mordaza de metal con dientes) y patas naranjas gruesas. De espaldas: **rayo naranja grande** sobre la placa y dos **cables enroscados** colgando a los lados. De perfil: placa con un ojo, un solo borne, una pinza delante y el **cable enroscado** sobresaliendo por detrás. Frame 1: sube 1 px (el borne pierde una fila). Frame 2: **arco azul** entre los bornes, mordazas abiertas con chispa y la banda en amarillo claro. `flick 2.0`, speed 18 (Voltel 22), sombra 14×3.
- **Voltorax (20×26):** **esfera de luz azul profundo** (para que se lean los ojos) con **visor oscuro** donde brillan los dos **ojos blancos** y una boca de luz, collar de cobre y un reflejo; cuello de pizarra con **gema amarilla**; **bobina** de franjas de cobre con **vetas de luz** (zigzag azul claro) en el pecho; **hombreras** con pernos amarillos; **brazos-cable** con mango naranja y pinzas; **base en espiral de cobre** con remaches; patas gruesas de pizarra con puntera naranja. De espaldas: **rayo gigante blanco-azul** de la esfera a la base. De perfil: esfera con un ojo en el visor, hombrera y brazo delanteros, **cable enroscado** de cola, rayos que se curvan hacia atrás. Rayos cortos siempre; en el **frame 2** la esfera se enciende (cada tono sube un nivel), los rayos se alargan hasta las hombreras y saltan chispas. `flick 1.4`, speed 7, sombra 16×3.
- **Cambios respecto a la ficha:** (1) en Voltavar la cara va en una **placa amarilla** (los ojos negros no se leían sobre el acero) y la banda es de franjas diagonales en vez de llevar el rayo; (2) las pinzas miden 2 px y la carcasa 14 px de ancho (en vez de 16) para que se vean; (3) la esfera de Voltorax es azul más oscura y lleva visor; (4) Voltorax usa 7 tonos de luz/pizarra/cobre en total (6 familias de color).
- Código: `VOL`, `vfill`, `voltavarDraw`, `voltoraxDraw` y los `def2('voltavar', …)` y `def2('voltorax', …)` al final de `src/formas.js`; `pilita.evolvesTo = 'voltavar'` y `voltavar.evolvesTo = 'voltorax'`. En el juego: ✨ junto a Voltel lo hace evolucionar, y otra vez más a Voltorax.

## Reglas para dibujar (se aplican al aprobar)
- Cada fase se distingue por silueta (en negro), paleta y rasgo propio; no vale agrandar y añadir detalles.
- Vista de espaldas sin cara; apéndices del perfil sobresalen de la silueta; redibujar a la medida.
- Una línea por ZIP: vista previa (4 direcciones × 2 pasos) antes de empaquetar y PARAR tras cada línea.
