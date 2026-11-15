> **v2.2:** Bloque 2 completo y cerrado. Lo que sigue (hasta 200 líneas) está en `PLAN_200.md`. Este documento queda como archivo de las 10 fichas y su implementación.

# BLOQUE 2 · 10 líneas nuevas de criaturas (fichas aprobadas en v1.4; todo hecho: paso 0, lotes A, B1, B2, C y D)

Estado (v1.4): **las 10 fichas están aprobadas por el usuario tal cual**; los huecos de Oli se quedan con las propuestas de Claude (Dandel y Perlel) por ahora; **paso 0 (mapa grande) hecho**; **lote A hecho en v1.5** (Cenel, Ferrel, Dandel); **lote B1 hecho en v1.6** (Zumbel → Zumbarix y Arenel → Arenax). **lote B2 hecho en v1.7** (Perlel → Perlorix y Arcel → Arcarex). **Lote C hecho en v1.8 y v1.9; lote D hecho en v2.0 (Zefirax): el Bloque 2 está completo.**
Decisiones ya tomadas por el usuario: hacer un bloque de 10 líneas organizado; ampliar el mapa «por ahora» para que quepan; 2 huecos para diseños de Oli; la legendaria va dentro del bloque (como último lote).

## 1. Reparto del bloque (cumple DISENO_CRIATURAS.md, sección 7)
Hoy: 10 líneas, 1 / 5 / 4 (sin evolución / 1 evolución / 2 evoluciones). Con las 10 nuevas: **20 líneas, 5 / 9 / 6 = 25 % / 45 % / 30 %** (el objetivo).

| Fases | Nº en el bloque | Líneas |
|---|---|---|
| 1 (sin evolución) | 4 | Cenel (Común), Ferrel (Común), Dandel (Común, hueco de Oli), Zefirax (**Legendaria**) |
| 2 (una evolución) | 4 | Zumbel (Común), Arenel (Común), Perlel (Rara, hueco de Oli), Arcel (Rara) |
| 3 (dos evoluciones) | 2 | Forjel (**Épica**), Cactel (Rara) |

Formas nuevas: 10 de fase 1 + 8 evoluciones = **18 sprites** (el juego pasa de 23 a 41 formas).

| Elemento (principal) | Antes | Nuevas | Después |
|---|---|---|---|
| Fuego | Ignel | Cenel, Forjel | 3 |
| Eléctrico | Voltel | Zumbel, Arcel | 3 |
| Aire | Nimbel | Dandel, Zefirax | 3 |
| Roca | Cuarel | Ferrel, Arenel | 3 |
| Hoja | Aguacato, Micel | Cactel | 3 |
| Agua | Ondel, Espirel | Perlel | 3 |
| Sombra | Somnel, Lunel | – | 2 |

| Rareza | Antes | Nuevas | Después |
|---|---|---|---|
| Común | 4 | 5 (Cenel, Ferrel, Dandel, Zumbel, Arenel) | 9 |
| Rara | 5 | 3 (Perlel, Arcel, Cactel) | 8 |
| Épica | 1 | 1 (Forjel) | 2 |
| Legendaria | 0 | 1 (Zefirax) | 1 |

Comprobaciones: Común 1-2 fases ✔ · Rara 2-3 ✔ · Épica 3 ✔ · Legendaria 1 ✔. Ningún elemento tiene todas sus líneas con las mismas fases.

## 2. Huecos de Oli (2 de las 10)
Oli puede diseñar estas dos criaturas (su estilo: rasgo único + objeto absurdo; Claude las adapta a píxel como con Aguacato). Se reservan el **elemento, la rareza y las fases** para no romper el equilibrio; Oli elige todo lo demás (nombre de familia, forma, objeto). **Si Oli no tiene diseño a tiempo, se usa la propuesta de reserva de Claude** (fichas 3 y 7).
| Hueco | Condiciones | Reserva de Claude |
|---|---|---|
| Hueco Oli 1 | Común · Aire · 1 fase | Dandel |
| Hueco Oli 2 | Rara · Agua · 2 fases | Perlel |
Si Oli quisiera cambiar el elemento de un hueco, se compensa moviendo otra línea del bloque para mantener 3 por elemento.

## 3. Nombres y tamaños (aprobar)
Estilo Charmander-Charmeleon-Charizard: raíz común, palabras inventadas, sin diminutivos en -ín. Fase 1 de Claude en «-el». Ids internos propuestos entre paréntesis. Todas las letras existen en la fuente de píxeles (comprobado).
| Línea | Fase 1 | Fase 2 | Fase 3 | Tamaños [ancho×alto, kg] |
|---|---|---|---|---|
| Cenel (`cenel`) | Cenel | – | – | 14×12, 0,3 kg |
| Ferrel (`ferrel`) | Ferrel | – | – | 16×14, 3 kg |
| Dandel (`dandel`) | Dandel | – | – | 14×18, 0,05 kg |
| Zefirax (`zefirax`) | Zefirax | – | – | 30×30 (fijo, v2.1), 12 kg |
| Zumbel (`zumbel`) | Zumbel | Zumbarix | – | 14×14, 1 kg → 18×18, 2,5 kg |
| Arenel (`arenel`) | Arenel | Arenax | – | 14×12, 2 kg → 18×16, 6 kg |
| Perlel (`perlel`) | Perlel | Perlorix | – | 16×14, 3 kg → 20×18, 8 kg |
| Arcel (`arcel`) | Arcel | Arcarex | – | 14×16, 2 kg → 20×20, 4 kg |
| Forjel (`forjel`) | Forjel | Forjavel | Forjadrax | 16×14, 12 kg → 20×20, 40 kg → 24×28, 110 kg |
| Cactel (`cactel`) | Cactel | Cactavar | Cactorax | 14×16, 2 kg → 18×20, 5 kg → 22×26, 20 kg |

## 4. Fichas de identidad
Cada fase se distingue por **silueta, paleta y un rasgo propio** (regla de v1.0). Paletas con hue shifting (sombras hacia el violeta, luces hacia el azul). Colores por rareza: Común 3-4 · Rara 4-5 · Épica 5-6 · Legendaria 6-7 + aura.

### 1. Cenel (Fuego, Común, 1 fase) · 14×12, 0,3 kg
- Historia: bolita de hollín que salió de una chimenea y todavía no sabe que ya se apagó. Distinta de Ignel (cerilla delgada): aquí es **redonda, baja y peluda de ceniza**.
- Silueta: pelota irregular con dos orejillas de pelusa, patitas diminutas y una grieta incandescente en la espalda.
- Paleta (4): gris ceniza (+ sombra violeta), naranja ascua (grieta), amarillo (ojos), blanco (brillo).
- Rasgo: deja bocanadas de ceniza al andar (saltitos cortos, `hop`); parada, **la grieta se enciende y suelta una chispa** (frame 2, `flick`) y estornuda ceniza.
- Frase: «Achís... ¡perdona, era ceniza! Bueno, era yo.»

### 2. Ferrel (Roca, Común, 1 fase) · 16×14, 3 kg
- Historia: erizo hecho de limaduras de hierro con un imán de herradura por hocico; todo se le pega. **Objeto absurdo:** lleva pegados clips y chinchetas.
- Silueta: lomo de púas (limaduras) en abanico, hocico en forma de herradura que sobresale, cuerpo corto y patas cortas.
- Paleta (4): hierro oscuro (púas, + sombra), rojo y azul del imán (hocico), gris plata (clips).
- Rasgo: parada, **un clip salta y se le pega al lomo** (frame 2, `flick`); anda con pasitos cortos y pesados.
- Frase: «Ven... no, ¡no te acerques con las llaves!»

### 3. Dandel (Aire, Común, 1 fase) · 14×18, 0,05 kg · **hueco de Oli 1**
- Reserva de Claude: diente de león vivo, cabeza de paracaídas blancos sobre un tallo fino con hojitas y carita.
- Silueta: bola esponjosa arriba (ancha) y tallo estrecho abajo; cada semilla es un pelito.
- Paleta (3-4): blanco-crema (semillas, luz azulada), verde (tallo), amarillo (centro), contorno.
- Rasgo: **flota** (`float`) y a veces se le **desprende una semilla** que sube (frame 2, `flick`); el viento la empuja.
- Frase: «Pide un deseo... pero sopla bajito.»

### 4. Zefirax (Aire + Eléctrico, Legendaria, 1 fase única) · 30×30 (v2.1; antes 32×32), 12 kg
- Historia: serpiente del viento que cruza las tormentas; el rayo es su aliento. Aparece «casi nunca / en evento».
- Silueta única: cuerpo **largo en cinta** en forma de «S» ancha que ocupa el lienzo, cabeza de dragón pequeño con crin de nubes, cola que se deshace en jirones de viento. No se parece a ninguna otra del juego.
- Paleta (7 + aura): blanco azulado (cuerpo, + sombra violeta), celeste (cinta), azul noche (vientre), amarillo eléctrico (rayos y ojos), dorado (cuernos), blanco puro (brillo) y **aura** de destellos propios.
- Rasgo: siempre **flota** majestuosa y lenta (`float`, speed baja); parada, **la cinta ondula y descarga rayos** (frame 2, `flick`) con un aura de destellos que se ve de lejos (regla: debe destacar de lejos).
- Frase: «Soy el viento antes de la tormenta.»
- Técnico: único caso de 30×30 (`G.LEGENDARY_SIZE`); necesita su prueba de tamaño y de sombra, y va al final (lote D).

### 5. Zumbel → Zumbarix (Eléctrico, Común, 2 fases) · 14×14 → 18×18
- Historia: abejorro pequeño con aguijón-enchufe (cría) → abejorro corpulento, «electricista» de la colmena (joven). Para no repetirse con Voltel (amarillo/naranja) usa **violeta y cian**.
- **Zumbel:** abejorro peludo y redondo, alas de cristal cian, aguijón en forma de clavija de enchufe, rayas pálidas.
- **Zumbarix:** más grande y esbelto, alas-hélice dobles que giran, cuerpo con rayas, **aguijón triple** (enchufe europeo), antenas con puntas de chispa. Silueta: de bola con alas a cuerpo alargado con alas abiertas.
- Paleta: violeta oscuro + rayas amarillo pálido + alas cian + naranja (aguijón) → añade blanco de arco.
- Rasgo: F1 `float` corto con zumbido (`float [2,2.4]`, frame 1 bate alas) · F2 flota más alto y rápido; parado, **chispa entre las antenas** (frame 2).
- Se conserva: violeta, alas cian, aguijón-enchufe.

### 6. Arenel → Arenax (Roca, Común, 2 fases) · 14×12 → 18×16
- Historia: cangrejo ermitaño que vive en un **tapón de botella** (objeto absurdo) → cangrejo con **castillo de arena** a cuestas.
- **Arenel:** cuerpo bajo y ancho de color arena, ojos en pedúnculo, dos pinzas pequeñas, tapón azul como casa.
- **Arenax:** la concha es un **castillo de arena** con torrecitas y una banderita; pinzas grandes (la silueta gana «asas»); más alto.
- Paleta: ocre/arena (+ sombra violeta), rojo coral (pinzas), azul tapón (F1) → arena clara + marrón húmedo + bandera roja (F2).
- Rasgo: **anda de lado** (`sway` en vez de saltitos) · F2 más lento; parado, la **banderita ondea y cae arena** (frame 2).
- Se conserva: arena, pinzas coral, ojos en pedúnculo.

### 7. Perlel → Perlorix (Agua, Rara, 2 fases) · 16×14 → 20×18 · **hueco de Oli 2**
- Reserva de Claude: almeja con una perla enorme que no sabe cerrar la boca (cría) → ostra gigante con perla luminosa y corona de coral (joven).
- **Perlel:** concha de dos valvas (la de arriba se abre), perla blanca en medio, ojitos sobre la perla, patitas de pie de molusco.
- **Perlorix:** concha grande con relieve, perla que brilla y sirve de «cara» con ojos, **corona de coral** rosa y burbujas.
- Paleta (4-5): azul marino y violeta (concha), nácar rosa-blanco (perla), rosa coral, burbuja celeste.
- Rasgo: parada, **bosteza abriendo la concha y sale una burbuja** (frame 2); anda arrastrándose con la concha (`sway`), muy lenta.
- Se conserva: perla grande y valvas azules.

### 8. Arcel → Arcarex (Eléctrico, Rara, 2 fases) · 14×16 → 20×20
- Historia: ardilla de pelo erizado de **electricidad estática** que carga un **globo de fiesta** que se le pega (objeto absurdo) (cría) → ardilla planeadora con membranas que **chispean entre las patas** (joven). Distinta de Voltel (bobina) y Zumbel (insecto).
- **Arcel:** ardilla redonda, pelo de punta, cola grande y esponjosa, globo rosa pegado a la cabeza.
- **Arcarex:** **membranas** abiertas a los lados (silueta ancha) con arcos azules en los bordes, cola larga de **resorte**, casco-pararrayos en la cabeza.
- Paleta (4-5): turquesa/azul pizarra (pelo, + sombra violeta), crema (barriga), rosa (globo), amarillo y azul eléctrico (arcos).
- Rasgo: F1 el globo se infla y desinfla al pararse (frame 2) · F2 planea (`float` bajo) y salta un **arco entre las patas** parado (frame 2, `flick`).
- Se conserva: cola grande, pelo de punta, rosa del globo (ahora en detalles).

### 9. Forjel → Forjavel → Forjadrax (Fuego + Roca, Épica, 3 fases) · 16×14 → 20×20 → 24×28
- Historia: **yunque** con carita (cría) → **herrero-golem** con martillo y fragua en la barriga (joven) → **titán de la forja**, coloso de lava con chimenea (adulto).
- **Forjel:** yunque bajo y ancho con cuernos de hierro, brasa encendida en el lomo, patas cortas, ojos de brasa.
- **Forjavel:** cuerpo de bloque de hierro con hombros cuadrados, **martillo** a una mano (el «asa» de la silueta), **barriga-fragua** con fuego visible.
- **Forjadrax:** silueta alta: yunque como hombros, **chimenea** humeante en la espalda, ríos de **lava** por el pecho y los brazos, ojos de fuego blanco, grietas incandescentes.
- Paleta (5-6): hierro oscuro (+ sombra violeta), rojo y naranja lava, amarillo (brillo), blanco caliente, marrón (mango) → gana brillo y lava en cada fase.
- Rasgo: F1 brasa que parpadea · F2 se apoya en el martillo y la fragua echa chispas (frame 2) · F3 casi no anda; parado, **chimenea que humea y lava que gotea** (frame 2). Muy pesado y lento en las tres.
- Se conserva: hierro oscuro, brasa/fuego naranja, forma de yunque como «hombros».

### 10. Cactel → Cactavar → Cactorax (Hoja, Rara, 3 fases) · 14×16 → 18×20 → 22×26
- Historia: cactus bebé con **maceta de botas** y una flor (cría) → cactus **trotamundos con sombrero y poncho** (joven) → **saguaro guardián** del desierto con nido de pájaros (adulto). Distinta de Aguacato y Micel por silueta y paleta (verde azulado + rosa).
- **Cactel:** cuerpo redondo con espinas, flor rosa en la cabeza, **macetas** como zapatos.
- **Cactavar:** brazos en «U» (silueta de cactus clásico), sombrero de paja, poncho a rayas rojo-crema, espinas más largas.
- **Cactorax:** columna alta con brazos grandes levantados, gran **flor** coronando, nido con un pájaro en el brazo, cara tallada en el tronco.
- Paleta (4-5): verde azulado (+ sombra violeta), rosa (flor), rojo y crema (poncho), marrón (maceta y sombrero).
- Rasgo: F1 la flor se abre y cierra al pararse (frame 2) · F2 el poncho ondea y se calza el sombrero (frame 2) · F3 casi inmóvil; parado, **el pájaro asoma del nido** y cae una flor (frame 2).
- Se conserva: verde azulado, rosa de la flor, espinas, cara de cactus tranquilo.

## 5. Orden de implementación (un ZIP por paso, vista previa 4 direcciones × 3 frames antes de empaquetar, PARAR tras cada uno)
| Paso | Qué | Notas |
|---|---|---|
| 0 | **Ampliar el mapa** (decisión del usuario) | de 20×15 a ≈ 36×26 casillas; zonas por elemento; rejilla de aparición de 20 criaturas con ≥ 3 casillas de separación; la cámara ya está lista; actualizar tests de mapa y aparición |
| A | (HECHO v1.5) Fase 1 sin evolución: Cenel, Ferrel y Dandel | tres criaturas, un ZIP, con galería |
| B1 | (HECHO v1.6) Zumbel → Zumbarix y Arenel → Arenax | dos líneas de 2 fases |
| B2 | (HECHO v1.7) Perlel → Perlorix (o el diseño de Oli) y Arcel → Arcarex | dos líneas de 2 fases |
| C | (HECHO v1.8 y v1.9) Forjel → Forjavel → Forjadrax y Cactel → Cactavar → Cactorax | dos líneas de 3 fases (una por ZIP si hace falta) |
| D | (HECHO v2.0) Zefirax (legendaria; 30×30 desde v2.1) | último: tamaño fijo, aura, sombra y pruebas propias |
En cada paso: `G.TRAITS`, `G.LINE_PLAN`, `G.PHASES_PLAN`, dibujo en `src/formas.js`, `SPAWN`, tests (recuento de criaturas y bloque nuevo) y documentos al día.

## 6. Decisiones del usuario (v1.4)
1. Fichas de las 10 criaturas: **aprobadas** tal como están.
2. Huecos de Oli: **se usan Dandel y Perlel por ahora** (si Oli diseña algo después, se sustituye).
3. Orden: **primero el mapa grande** (paso 0, hecho en v1.4), luego los lotes.

## 7. Mapa grande (paso 0, hecho en v1.4): sitios para cada criatura
Mapa de 36×26 casillas (desde v2.16 está en `maps/pueblo_inicial.json`; antes lo generaba `src/game.js`). Oli y Lali empiezan en el cruce de caminos (casilla 18,13). Siete claros, uno por elemento, unidos por caminos; cada claro tiene **3 sitios**. Las casillas son [x, y].
| Claro (centro) | Criaturas ya en el mapa | Sitios libres para el Bloque 2 (propuesta) |
|---|---|---|
| Aire, norte (18,4) | Nimbel [18,5] | Dandel [15,4] · Zefirax [21,3] |
| Agua, noreste (29,6), con lago | Ondel [27,6] · Espirel [30,8] | Perlel [27,9] |
| Eléctrico, este (31,13) | Voltel [31,12] | Zumbel [28,15] · Arcel [33,11] |
| Sombra, sureste (29,21) | Somnel [28,20] · Lunel [31,23] | – (2 líneas, sin nuevas) |
| Roca, sur (18,22) | Cuarel [18,21] | Ferrel [15,22] · Arenel [21,23] |
| Fuego, suroeste (6,21) | Ignel [5,21] | Cenel [8,19] · Forjel [4,23] |
| Hoja, oeste (6,8) | Aguacato [4,7] · Micel [8,9] | Cactel [6,11] |
Al añadir cada criatura: poner su `[id, x, y]` en `SPAWN` de `src/game.js` (una casilla libre, separada ≥ 2 casillas de las demás); el test del mapa comprueba que es alcanzable a pie desde el inicio y que está en el claro de su elemento (hay que añadirla a la tabla de ese test).

## 8. Lote A, cómo quedó dibujado (v1.5)
Tres criaturas Comunes de una sola fase, en su claro (`SPAWN`: Cenel [8,19], Ferrel [15,22], Dandel [15,4]). Datos en `G.TRAITS`, `G.LINE_PLAN` y `G.PHASES_PLAN` (`src/creatures.js`); dibujos en `src/formas.js` (`cenelDraw`, `ferrelDraw`, `dandelDraw`).
- **Cenel (14×12, 0,3 kg):** pelota de pelusa de carbón (tres tonos, luz arriba-izquierda) con dos orejas de pelusa, ojos amarillos de ascua con brillo, boquita naranja y patitas de ascua. Grieta incandescente: pequeña en la frente (frente), larga en zigzag por la espalda y en el perfil, con colita de pelusa. Frame 1 sube 1 px; **frame 2 (`flick 2.2`):** la grieta pasa a blanco-amarillo, sale una chispa y se ven motas de ceniza. Anda a saltitos (`hop [2,9]`, speed 20).
- **Ferrel (16×14, 3 kg):** cuerpo ovalado de hierro (lomo de púas de limadura con puntas claras), ojos blancos con pupila, **imán de herradura de hocico** (arco plateado, polo rojo y polo azul; de perfil una «C») y un clip y una chincheta pegados al lomo. Frame 2 (`flick 2.5`): salta otro clip y se pega; speed 10, anda pesado.
- **Dandel (14×18, 0,05 kg):** cabeza esponjosa de semillas blancas con borde deshilachado y sombras azuladas, carita con mejillas rosas, cáliz amarillo, tallo con dos hojitas en diagonal y raicillas. Flota siempre (`float [3,1.5]`, sombra separada 5 px); el tallo se mece 1 px en el paso. **Frame 2 (`flick 2.0`):** se desprende una semilla-paracaídas que sube. Es la propuesta de reserva de Claude para el hueco de Oli 1.
- Ajustes tras la vista previa: ojos blancos con pupila en Ferrel (los negros se perdían en el hierro oscuro), más púas arriba y cuerpo más claro; en Dandel, el borde deshilachado dejaba píxeles negros (se corrigió) y las hojas pasaron a diagonal.

## 9. Lote B1, cómo quedó dibujado (v1.6 y rehecho en v1.6b)
Dos líneas Comunes de 2 fases, cada una en su claro (`SPAWN`: Zumbel [28,15], Arenel [21,23]). Datos en `G.TRAITS`, `G.LINE_PLAN` y `G.PHASES_PLAN` (`src/creatures.js`); dibujos en `src/formas.js` (`zumbelDraw`, `zumbarixDraw`, `arenelDraw`, `arenaxDraw`). Se prueban con ✨ junto a Zumbel y junto a Arenel, y se ven en la galería.
**v1.6b (a petición del usuario: «no se ven bien los ojos, están descuadrados y no se sabe qué son»).** Diagnóstico propio: (1) en Arenel y Arenax el ojo derecho NO era el reflejo exacto del izquierdo (1,3 px de desfase; en Zumbel las antenas tampoco cuadraban); (2) los ojos de cangrejo caían sobre el tapón/castillo y se leían como una segunda cara (las ventanas del castillo parecían ojos y boca); (3) ojos pequeños y con la cara mezclada con el cuerpo. Reglas nuevas para todas las criaturas que vengan: una sola cara clara; ojos grandes, planos y centrados; todo lo de la vista frontal que sea simétrico se dibuja con `sym` (eje del lienzo) y se mide con `node tools/render_sprites.js … && python3 tools/ojos.py salida.json` (desfase horizontal ≈ 0); la cabeza se separa del cuerpo; la silueta debe decir qué es sin color (abejorro = alas + antenas + aguijón; cangrejo = pinzas + ojos en pedúnculo + concha).
- **Zumbel (Eléctrico, 14×14, 1 kg):** abejorro peludo y redondo, violeta con barriga de rayas pálidas, alas de cristal cian, antenas simétricas con chispa, patitas y aguijón de dos clavijas (de espaldas y de perfil). Cara arriba: ojos oscuros de 2×3 con brillo, boquita y mejillas rosas. Flota con zumbido (`float [2,2.4]`); frame 1 sube las alas; **frame 2 (`flick 2.0`):** zigzag de chispa entre las antenas.
- **Zumbarix (Eléctrico, 18×18, 2,5 kg):** cabeza redonda separada del tórax por un cuello oscuro, ojos oscuros con brillo, cuatro alas-hélice (en el frame 1 las de arriba suben y las de abajo bajan), collar pálido, abdomen alargado con rayas y **aguijón triple** simétrico (1 + 2 + 1 px). Flota más alto y rápido (`float [3,3.2]`, speed 32); **frame 2 (`flick 1.6`):** zigzag de chispa entre las antenas.
- **Arenel (Roca, 14×12, 2 kg):** cangrejo ermitaño de arena, bajo y ancho. Cara = dos **ojos blancos grandes en pedúnculo** a los lados, con el **tapón de botella azul** entre ellos como sombrero-casa; boquita, dos pinzas pequeñas coral y patitas. Anda de lado con contoneo (`sway [1,8]`); **frame 2 (`flick 2.2`):** los pedúnculos se alargan 1 px y caen granitos de arena.
- **Arenax (Roca, 18×16, 6 kg):** la concha es un **castillo de arena** (torre central ancha con almenas y ladrillos, dos torrecitas laterales y banderita roja) entre dos **ojos grandes en pedúnculo alto**; cuerpo cobrizo más oscuro que el castillo, boquita y **pinzas grandes** coral (las «asas» de la silueta). Sin ventanas ni puerta. Más lento (`sway [1,10]`, speed 8); **frame 2 (`flick 1.8`):** la bandera ondea más larga y cae arena.
- Se conserva de la fase 1: violeta, alas cian y aguijón-enchufe (Zumbel); arena, pinzas coral y ojos en pedúnculo (Arenel).
- Medición de ojos (`tools/ojos.py`) tras el rehecho: desfase horizontal 0,0 px en Arenel y Arenax; Zumbel y Zumbarix usan ojos oscuros con brillo del mismo lado (el 1,0 que marca la herramienta es el brillo, igual que en Ondel, Ignel, Voltel…).

## 10. Lote B2, cómo quedó dibujado (v1.7)
Dos líneas Raras de 2 fases, cada una en su claro (`SPAWN`: Perlel [27,9], Arcel [33,11]). Dibujos en `src/formas.js` (`perlelDraw`, `perlorixDraw`, `arcelDraw`, `arcarexDraw`). Se prueban con ✨ junto a Perlel o Arcel y se ven en la galería. Reglas de la v1.6b aplicadas: una sola cara clara, ojos grandes (oscuros de 2×3 con brillo) y simétricos con `sym`, silueta reconocible sin color; Raras = 4-5 colores + un detalle extra.
- **Perlel (Agua, 16×14, 3 kg):** almeja de dos valvas azules con costillas y borde de nácar; **la perla enorme es la cara** (ojos, mejillas rosas, boquita) y asoma de la boca ciruela; pie de molusco rosado. De espaldas: concha cerrada con costillas; de perfil: la perla sobresale por delante. Anda arrastrándose (`sway [1,9]`, speed 7); **frame 2 (`flick 2.4`):** bosteza (la valva de arriba sube 1 px) y sale una burbuja.
- **Perlorix (Agua, 20×18, 8 kg):** ostra gigante en abanico (el borde de la concha sobresale en «dientes»), **corona de tres corales rosas redondos**, perla grande con **aureola luminosa** que hace de cara, burbuja fija y pie rosado. Más lenta (`sway [1,11]`, speed 4); **frame 2 (`flick 2.0`):** bosteza, la aureola pasa a blanco con estrellitas y salen burbujas. Se conserva: perla con cara, valvas azules y pie rosado.
- **Arcel (Eléctrico, 14×16, 2 kg):** ardilla redonda turquesa con pelo de punta, orejas, hocico crema con diente, **cola grande a rayas con punta clara** y **globo rosa pegado a la cabeza**. Anda a saltitos (`hop [1,10]`, speed 20); **frame 2 (`flick 2.2`):** el globo se infla y salta alguna chispa amarilla y azul.
- **Arcarex (Eléctrico, 20×20, 4 kg):** ardilla planeadora de silueta ancha: **membranas** abiertas con borde de **arco azul**, **casco-pararrayos rosa** (el rosa del globo, ahora en un detalle) con punta amarilla, ceño, y **cola larga de resorte plateado** con chispa en la punta. Planea (`float [2,2.0]`, sombra separada 4 px, speed 24); **frame 2 (`flick 1.8`):** arco blanco-amarillo entre manos y pies y chispa en el resorte. Se conserva: turquesa, pelo de punta y rosa.
- Reparto de fases tras el lote: 1 fase: 4 · 2 fases: 9 · 3 fases: 4 → 17 líneas. Quedan C (Forjel, Cactel) y D (Zefirax).

## 11. Lote C, parte 1: Forjel, cómo quedó dibujado (v1.8)
Línea Épica de 3 fases en el claro de Fuego (`SPAWN`: Forjel [4,23]). Dibujos en `src/formas.js` (`forjelDraw`, `forjavelDraw`, `forjadraxDraw`). Idea que une las fases: el hierro de la forja (yunque → herrero → titán) y la brasa/lava cada vez más grande. Se prueba con ✨ junto a Forjel (dos pulsaciones) y se ve en la galería.
- **Forjel (16×14, 12 kg):** yunque bajo y ancho con cuernos de hierro, ojos de brasa en la cintura, patas cortas y una brasa en el lomo (de espaldas, grieta incandescente). Speed 6; **frame 2 (`flick 2.2`):** la brasa se aviva y suelta chispas.
- **Forjavel (20×20, 40 kg):** herrero-golem: cabeza de bloque con cuernos y ojos de brasa, hombreras de yunque, **barriga-fragua** con fuego y **martillo** en una mano (de espaldas, en la contraria). Speed 8; **frame 2 (`flick 2.0`):** la cara del martillo y la fragua se avivan y salen chispas.
- **Forjadrax (24×28, 110 kg):** titán: el yunque son sus **hombros** con cuernos, **chimenea de ladrillo** en la espalda con humo, **ríos de lava** en pecho y brazos, ojos de fuego blanco, boca de lava y grietas. Speed 3 (el más lento); **frame 2 (`flick 1.6`):** más humo y gotas de lava.
- Se conserva: hierro oscuro, brasa/lava naranja y el yunque (cuerpo → hombreras → hombros). Tamaño y silueta: bloque ancho y bajo → figura cuadrada con asa (martillo) → coloso alto con hombros anchos.

## 12. Lote C, parte 2: Cactel, cómo quedó dibujado (v1.9)
Línea Rara de 3 fases en el claro de Hoja (`SPAWN`: Cactel [6,11]). Dibujos en `src/formas.js` (mapas `CTL`, `CAV`, `CTX`; se pintan con `cacDraw`). El frente de cada fase es el de la captura de la galería, píxel a píxel; espalda y perfiles son derivados. Se prueba con ✨ junto a Cactel (dos pulsaciones) y se ve en la galería.
- **Cactel (14×16, 2 kg):** cactus redondo con espinas crema, flor rosa en la cabeza, mejillas rosas y **macetas de botas**. Anda a saltitos; **frame 2 (`flick 2.4`):** la flor se abre del todo (usa la fila libre de arriba).
- **Cactavar (18×20, 5 kg):** brazos en «U», **sombrero de paja** con cinta granate, cara oscura con ojos grandes, **poncho** a rayas rojo y crema con flecos, macetas de botas. Se contonea (`sway`), speed 10; **frame 2 (`flick 2.0`):** el poncho ondea y el sombrero se ladea.
- **Cactorax (22×26, 20 kg):** columna alta con brazos levantados, gran **flor** rosa con centro amarillo, cara tallada en el tronco, florecilla en el brazo izquierdo y **nido con un pajarito azul** en el derecho, sobre un montón de tierra. Speed 4 (la más lenta de la línea); **frame 2 (`flick 2.6`):** el pajarito asoma y caen pétalos.
- Se conserva: verde azulado, rosa de la flor, espinas crema, cara de cactus tranquilo. De espaldas no hay cara (cabeza lisa) y de perfil se ve un solo ojo.
- Reparto de fases tras el lote: 1 fase: 4 · 2 fases: 9 · 3 fases: 5 → 18 líneas. Queda D (Zefirax, legendaria).

## 13. Lote D: Zefirax, cómo quedó dibujado (v2.0)
Legendaria de fase única en el claro de Aire (`SPAWN`: Zefirax [21,3]). Dibujo en `src/formas.js` (bloque final con `def2('zefirax', …)`). Es el único 30×30 del juego (`G.LEGENDARY_SIZE`). Se ve en la galería y en el claro de Aire (no evoluciona).
- **Zefirax (30×30 desde v2.1, 12 kg):** serpiente del viento. Cinta en «S» (5 px de ancho, colores planos y contorno oscuro), cabeza de dragón pequeña celeste con ojos amarillos, cuernos dorados y **crin de nubes** blanco azulado con sombra violeta; la cola se afina y se deshace en jirones. Aura de destellos amarillos que se ve de lejos.
- **Vistas con dibujo propio:** frente (cara, vientre azul noche con marcas de rayo amarillas, crin simétrica), espalda (sin cara: coronilla, cuernos y crin; lomo claro con marcas de rayo), perfil izquierdo (cabeza en 3/4 con los **dos ojos visibles** y hocico por delante; la crin sigue el cuello) y perfil derecho (el izquierdo reflejado). La «S» de la espalda es la del frente reflejada, como se vería en 3D.
- **Movimiento:** flota siempre (`float [4, 0.9]`), speed 8, pausas largas; paso B ondula la cinta; **frame 2 (`flick 1.8`):** rayos y más destellos. Sombra `[18, 3, 7]`.
- Frase: «Soy el viento antes de la tormenta.» Diseño de Claude.
- Reparto final del bloque: 20 líneas, 1 fase: 5 · 2 fases: 9 · 3 fases: 6 (25 / 45 / 30 %).
