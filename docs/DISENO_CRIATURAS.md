# Diseño del sistema de criaturas · Criaturas de Lali y Oli

Estado: **decidido en la conversación con el usuario**, salvo lo marcado con ❓. Ya programado (v0.9): elementos, rarezas, datos de fase, tamaño por fase y la primera línea evolutiva (Aguacato). Sin programar: combate, captura y condiciones de evolución.
Idea base (de Oli y Lali): criaturas de distintos **elementos**; según su **rareza** tienen 0, 1 o 2 evoluciones, hasta un máximo de **3 fases**. Todas 100 % originales, con identidad propia. **Una criatura debe verse de la rareza que es**: una común parece común, una épica parece épica y una legendaria parece legendaria (ver sección 5).

## 1. Elementos (7)
Cada criatura tiene 1 elemento; las raras y superiores pueden tener un segundo.

| Elemento | Idea | Color guía |
|---|---|---|
| Hoja | plantas, frutas, hongos | verdes |
| Fuego | llamas, calor, brasas | rojo/naranja |
| Agua | agua, hielo, humedad | azul/teal |
| Eléctrico | electricidad, pilas, mecanismos | amarillo |
| Aire | viento, nubes, sonido | blanco/celeste |
| Roca | tierra, piedra, metal | grises/marrones |
| Sombra | noche, misterio, sueños | morado oscuro |

Cambios respecto a la primera propuesta: Brasa → Fuego, Charco → Agua, Chispa → Eléctrico, Brisa → Aire; el elemento Absurdo se quita.
**Ventajas y debilidades (propuesta cerrada en v0.8):** cada elemento gana a 2, pierde contra 2 y es neutral con los otros 2. Ganar = daño ×2, perder = ×0,5. Está en código (`G.ELEMENTS[x].strong/weak` y `G.elementEffect`), pero aún no se usa: no hay combate.

| Elemento | Gana a | Pierde contra |
|---|---|---|
| Fuego | Hoja, Aire | Agua, Roca |
| Agua | Fuego, Roca | Hoja, Eléctrico |
| Hoja | Agua, Sombra | Fuego, Aire |
| Eléctrico | Agua, Aire | Roca, Sombra |
| Aire | Hoja, Sombra | Fuego, Eléctrico |
| Roca | Fuego, Eléctrico | Agua, Sombra |
| Sombra | Eléctrico, Roca | Hoja, Aire |

## 2. Rareza y número de fases
La rareza **se decide al diseñar la criatura** (no se tira al azar) y fija cuántas fases puede tener.

| Rareza | Fases | Evoluciones | Frecuencia al aparecer | Segundo elemento |
|---|---|---|---|---|
| Común | 1 o 2 | 0 o 1 | muy alta | no |
| Rara | 2 o 3 | 1 o 2 | media | a veces |
| Épica | 3 | 2 | baja | normalmente sí |
| Legendaria | 1 (única) | 0 | casi nunca / evento | sí |

Además de la rareza, decide el número de fases:
1. **Historia de la criatura**: si tiene una historia de cría, joven y adulta, se le dan más fases.
2. **Tamaño en la historia**: las pequeñas y graciosas suelen quedarse en 1-2 fases; las imponentes llegan a 3.
3. **Elección de Oli**: la última palabra es de quien la diseña.

## 3. Evoluciones
Una criatura con varias fases es una **línea evolutiva**: cada fase es una entrada propia enlazada con la siguiente. Al evolucionar se **conservan** el nombre de familia, la paleta base y un rasgo reconocible (orejas, hojita, llave...), para que se vea que es la misma criatura.

**Condiciones de evolución: NO se programan todavía** (decisión del usuario). Solo están las evoluciones en sí (v0.9): `evolve()` en `src/game.js` (desde v2.16 manda la orden `evolucionar` a `src/motor.js`) pasa la criatura a su `evolvesTo`, y el botón ✨ solo sirve para probar. **Decidido en v2.13 (sin implementar aún):** nivel mínimo + objetos (7 Notas y 7 Fragmentos, uno por elemento) y, en algunas líneas, la presencia del otro jugador (cascabel); **se descartan las condiciones de lugar y de hora**. Detalle en `HISTORIA_Y_MUNDO.md`, sección 4 ter.

## 4. Datos de cada criatura (cuando se programe)
Campos que tendrá cada entrada en `src/creatures.js`:
`id`, `name`, `by` (autor), `line` (frase), `elements` [1-2], `rarity`, `family` (id de la línea), `stage` (1-3), `evolvesTo` (id de la siguiente fase), `size` (tamaño del sprite), `draw`.

**Primera línea evolutiva (v0.9) con identidad propia por fase (v1.0): Aguacato (18×18) → Aguacaryn (20×20) → Aguacarax (22×22)**, las tres Hoja y Rara. Historia: fruta con llave → fruta madura con hueso → felino. Cada fase cambia de **silueta, paleta, llave y movimiento** (no es una ampliación): Aguacato, pera-gato fresca con llave gris (diseño de Oli, sin tocar) · Aguacaryn, pera ancha de piel Hass con hueso grande y llave de bronce, se contonea · Aguacarax, felino de hombros anchos con rayas, garras, ojos ámbar, hueso-gema con aro de oro y llave de oro, más rápido y con cola que se mueve. Se conservan de Oli el nombre de familia (Aguacat-), las orejas de gato con interior rosa, la barriga clara y la llave de cuerda. Cada fase es una entrada propia con `family: 'aguacato'`, `stage`, `evolvesTo` y `phases: 3`; las fases 2 y 3 están en `src/formas.js` (`aguatonDraw`, `aguatigreDraw`).
**Regla para las próximas líneas evolutivas (aprendida en v1.0):** cada fase debe distinguirse por su silueta en negro, por su paleta y por un rasgo propio (objeto, postura o movimiento); no basta con agrandar la anterior y añadir detalles.

**Segunda línea evolutiva (v1.1): Ondel (14×14, 1,2 kg) → Ondavar (18×12, 2 kg)**, Agua y Común. De gota con hojita a nenúfar: silueta ancha y baja con hoja grande, paleta azul + verde oscuro + rosa, rasgo propio = hoja que gotea parada y rebote pequeño. Entradas `pompon` → `ondavar` (`family: 'pompon'`, `stage` 1-2, `phases: 2`); dibujo en `src/formas.js` (`ondavarDraw`).

**Tercera línea evolutiva (v1.1): Ignel (12×16, 0,8 kg) → Ignavar (14×16, 1 kg)**, Fuego y Común. De cerilla delgada a cerilla encendida con melena: misma altura pero silueta ancha (cabeza roja ancha con llamas asimétricas: lengua alta a la izquierda, bajas a la derecha; en el perfil la melena fluye hacia atrás), cuerpo corto de papel ahumado, bracitos y pies de carboncillo. Rasgo propio: la llama parpadea parada y suelta una chispa (frame 2, `flick`); salta más alto y más despacio (`hop [4,10]`, speed 22). Entradas `fosforin` → `ignavar` (`family: 'fosforin'`, `stage` 1-2, `phases: 2`); dibujo en `src/formas.js` (`ignavarDraw`).

**Cuarta línea evolutiva (v1.1): Micel (14×16, 2 kg) → Micavar (18×18, 5 kg)**, Hoja y Común. De seta pequeña y compacta a seta en «T»: sombrero granate enorme tipo paraguas que sobresale a los lados (puntos crema), laminillas a la vista, pie alto con anillo-falda y base de musgo verde. Rasgo propio: suelta esporas al parar (frame 2, `flick 2.4`) y se contonea suave al andar (`sway [1,8]`) en vez de dar saltitos; más lento (speed 13 frente a 17). Entradas `setin` → `micavar` (`family: 'setin'`, `stage` 1-2, `phases: 2`); dibujo en `src/formas.js` (`micavarDraw`).

**Quinta línea evolutiva (v1.1): Espirel (20×14, 4 kg) → Espiravar (20×18, 9 kg)**, Agua y Rara. De caracol bajo con concha en espiral a caracol de cuerpo corto con concha-torre cónica (silueta de montaña): azul marino con franjas de nácar rosa-crema, punta y borde dorados y una ventanita dorada con un pececito; cuerpo turquesa. Rasgo propio: al parar, el pececito nada y suben burbujas (frame 2, `flick 2.0`); las antenas suben y bajan (frames 1 y 2); lentísimo (speed 5 frente a 6). Entradas `caracolin` → `espiravar` (`family: 'caracolin'`, `stage` 1-2, `phases: 2`); dibujo en `src/formas.js` (`espiravarDraw`).

**Fases previstas por criatura (v0.8, propuesta):** Ondel 2 · Aguacato 3 · Ignel 2 · Voltel 3 (**v1.2: pasa de 1 a 3**) · Nimbel 1 · Cuarel 3 · Somnel 2 · Micel 2 · Espirel 2 · Lunel 3 (`G.PHASES_PLAN`). Cada entrada guarda `family`, `stage`, `evolvesTo` y `phases`. Rarezas confirmadas: Ondel Común, Aguacato Rara.

Estadísticas (❓ provisional, se mantienen): total orientativo por fase 1 ≈ 180, fase 2 ≈ 300, fase 3 ≈ 450; las legendarias ≈ 500 en su única fase.

**Novena línea evolutiva (v1.2, HECHA): Voltel (14×18, 2,5 kg) → Voltavar (18×16, 6 kg) → Voltorax (20×26, 15 kg)**, Eléctrico, 3 fases. Decisión del usuario: Voltel gusta mucho y tendrá dos evoluciones. **Consecuencia de las reglas (sección 2):** una Común solo puede tener 1-2 fases, así que para llegar a 3 Voltel pasa a **Rara** (aprobado por el usuario al pedir la implementación). Al ser Rara sube su detalle visual: 4-5 colores y un accesorio/objeto por fase. Ficha completa en `FICHAS_IDENTIDAD.md`, nº 8. Ids propuestos: `pilita` → `voltavar` → `voltorax` (`family: 'pilita'`). Dibujos en `src/formas.js` (`voltavarDraw`, `voltoraxDraw`); `G.PHASES_PLAN`/`G.LINE_PLAN` y la rareza de Voltel actualizados en `src/creatures.js`.

## 5. Diseño visual por rareza
> **v2.2:** los tamaños de esta tabla son solo orientativos y están superados por los rangos por rareza y fase de `PLAN_200.md` (sección 6) y por `G.LINE_PLAN`. La meta de 200 líneas y su reparto están en `PLAN_200.md`.
La rareza tiene que **notarse a simple vista** en el sprite. Reglas:

| Rareza | Colores (sin contar contorno) | Silueta y detalle | Tamaño del sprite | Aspecto |
|---|---|---|---|---|
| Común | 3-4 | redonda y sencilla, sin accesorios, un solo rasgo | 16×16 | simpática, "de andar por casa" |
| Rara | 4-5 | un rasgo distintivo claro y un detalle extra (accesorio u objeto) | 16×16 | llama la atención sin gritar |
| Épica | 5-6 | silueta marcada y potente, marcas y detalles, expresión de carácter, acentos brillantes | 20×20 o 24×24 | se nota que es especial |
| Legendaria | 6-7 + brillo/aura propio | silueta única y majestuosa, diseño que no se parece a ninguna otra | 30×30 (v2.1; antes 32×32) | imponente, en el juego debe destacar de lejos |

**Tamaño y forma por criatura (v0.6, decidido y aprobado):** el tamaño de la tabla es solo orientativo. Cada criatura tiene su propio tamaño de sprite, silueta, movimiento, sombra y rasgo de color (`G.TRAITS` en `src/creatures.js`; dibujos propios en `src/formas.js`). Las raras destacan más que las comunes, pero no todas miden lo mismo. Fase 1 actual (Aguacato evolucionado: 20×20 y 22×22): Ondel 14×14 · Aguacato 18×18 · Ignel 12×16 · Voltel 14×18 · Nimbel 20×12 · Cuarel 18×16 · Somnel 16×20 · Micel 14×16 · Espirel 20×14 · Lunel 20×20 (épica). Para una criatura nueva: añadir su entrada en `G.TRAITS` y, si se dibuja a mano en su tamaño, marcarla `native` y ponerla en `src/formas.js`.

Reglas comunes:
- **Tamaño y peso por línea y fase (v1.1, decidido por el usuario):** cada criatura tiene su peso y su tamaño y sus evoluciones también; no todas las fases crecen igual (algunas se ensanchan, otras se alargan, otras casi no cambian; pueden coincidir en algo, pero todas con lógica de tamaño y peso). Están en `G.LINE_PLAN` (`src/creatures.js`: [ancho, alto, kg] por fase); `G.stageSize` y `G.stageWeight` lo leen. La legendaria es siempre 32×32 (`G.LEGENDARY_SIZE`). El peso es solo un dato por ahora (sin combate); más adelante afectará al movimiento. El nivel de detalle de cada fase sube con su rareza.

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

- Cada fase tiene **hoja de 3 vistas** (frente, perfil, espalda), como Aguacato. En el juego: 4 direcciones × 2 pasos.
- Sin degradados; colores planos y contorno oscuro.
- Una criatura = una fase a la vez. Primero fase 1; las fases 2 y 3 se piden con el prompt de evolución (`PROMPT_IMAGEN.md`).

## 6. Pasos técnicos (solo cuando el usuario lo pida, avisando antes)
**Sexta línea evolutiva (v1.1): Somnel (16×20, 3 kg) → Somnaris (16×22, 2 kg)**, Sombra y Rara. De duendecillo dormilón con gorro de dormir a mago de los sueños: gorro más alto y torcido con borla-estrella, cabeza pequeña con ojos entreabiertos, capa índigo en campana con estrellas, luna creciente al cuello y cola de capa que sobresale en los perfiles. Rasgo propio: flota (sin pies), la capa ondea parado (frame 2, `flick 2.0`) y abre un ojo al hablarle (frame 3, rasgo `eye`). Entradas `somnin` → `somnaris` (`family: 'somnin'`, `stage` 1-2, `phases: 2`); dibujo en `src/formas.js` (`somnarisDraw`).

**Séptima línea evolutiva (v1.1): Cuarel (18×16, 25 kg) → Cuarvel (20×18, 45 kg) → Cuarzoth (22×24, 120 kg)**, Roca y Rara, 3 fases. Historia: guijarro con casco de minero → minero con pico y mochila de cristales → coloso de cristal. Cada fase cambia de **silueta, paleta y objeto**: Cuarel, bola de piedra gris con casco amarillo y dos cuernos teal · Cuarvel, bloque de pizarra de hombros cuadrados con casco naranja y lámpara, pico en una mano (el «asa» de la silueta), tirantes y mochila de cuero con cristales teal asomando; parado se apoya en el pico (frame 2, `flick 2.4`), speed 6 · Cuarzoth, montaña de cristales (aguja central, hombros y espalda en teal y violeta) sobre un torso ancho de pizarra con gema violeta y aro dorado en el pecho, casco dorado con lámpara blanca y ojos de luz teal; parado destella (frame 2, `flick 1.6`), speed 3. Cristales dibujados como prismas de cuarzo reales (punta hexagonal, cara izquierda clara, derecha oscura, estrías horizontales). Sombras hacia el violeta y luces hacia el azul (hue shifting). Se conserva: casco de minero con luz, roca gris, teal de cuernos y vetas. Entradas `cuarzin` → `cuarvel` → `cuarzoth` (`family: 'cuarzin'`, `stage` 1-3, `phases: 3`); dibujo en `src/formas.js` (`cuarvelDraw`, `cuarzothDraw`, ayudante `cry`).

**Octava línea evolutiva (v1.1): Lunel (20×20, 4 kg) → Lunareth (26×20, 6 kg) → Lunaroth (24×26, 8 kg)**, Sombra y Épica, 3 fases. Historia: búho lunar → búho del eclipse con alas abiertas → guardián del cielo. Lunareth: alas desplegadas a los lados (silueta ancha en «M»), cuerpo morado más claro que las alas, ojos ámbar, orejas-mechón con estrella y el eclipse en el pecho (luna crema medio tapada con corona dorada); parado abre más las alas y el eclipse brilla (frame 2, `flick 2.2`); `float [3,1.3]`, speed 12. Lunaroth: silueta alta (corona de luna llena con cráteres y aro dorado sobre la cabeza, alas largas de cielo nocturno con estrellas y borde dorado que cuelgan hacia abajo, cola de cometa dorada), ojos dorados, vientre lila con adorno dorado; parado, aura de destellos y cola que brilla (frame 2, `flick 1.8`); `float [4,1.1]`, speed 10. Se conserva: ojos grandes, estrellas en las orejas, cuerpo morado, garras naranjas y la luna. Entradas `lunabu` → `lunareth` → `lunaroth` (`family: 'lunabu'`, `stage` 1-3, `phases: 3`); dibujo en `src/formas.js` (`lunarethDraw`, `lunarothDraw`, ayudantes `sym` y `rows`).

1. (hecho, v0.8) Campos de la sección 4 en las criaturas existentes.
2. (hecho, v0.8-v0.9) Tamaño de sprite por criatura y líneas evolutivas (solo la evolución, sin condiciones).
3. (hecho, v0.9) Línea evolutiva completa de Aguacato.
4. Hechas las 7 líneas evolutivas (Aguacato, Ondel, Ignel, Micel, Espirel, Somnel, Cuarel, Lunel). Pendiente: combate híbrido, captura y condiciones de evolución (decididos en v2.13, ver `HISTORIA_Y_MUNDO.md`).
5. (hecho, v1.2) Línea de Voltel (3 fases). Reparto equilibrado de fases: sección 7 (criterio para las próximas).

## 7. Equilibrio entre criaturas de 1, 2 y 3 fases (v1.2)
> **v2.2:** el reparto 25 / 45 / 30 % se mantiene para las 200 líneas (50 / 90 / 60); detalle por elemento y rareza en `PLAN_200.md`, secciones 3 y 4.
**Actualización v2.0:** con el Bloque 2 completo (lote D: Zefirax) hay 20 líneas y 41 formas: 1 fase 5 (Nimbel, Cenel, Ferrel, Dandel, Zefirax) · 2 fases 9 · 3 fases 6 (25 / 45 / 30 %, el objetivo).
**Actualización v1.6:** con el Bloque 2 hecho hasta el lote B1 hay 15 líneas y 30 formas: 1 fase 4 (Nimbel, Cenel, Ferrel, Dandel) · 2 fases 7 (+ Zumbel, Arenel) · 3 fases 4. La tabla de abajo es la de v1.2 (10 líneas).
Objetivo: que el juego tenga criaturas **sin evolución, con una y con dos evoluciones** en un reparto sano, y que la rareza y el número de fases sean coherentes (sección 2). La última palabra es del usuario.

**Reparto actual (v1.2, 10 líneas, 23 formas):**
| Fases de la línea | Líneas | Nº | % |
|---|---|---|---|
| 1 (sin evolución) | Nimbel | 1 | 10 % |
| 2 (una evolución) | Ondel, Ignel, Micel, Espirel, Somnel | 5 | 50 % |
| 3 (dos evoluciones) | Aguacato, Voltel, Cuarel, Lunel | 4 | 40 % |

| Rareza | Líneas | Fases permitidas |
|---|---|---|
| Común | Ondel (2), Ignel (2), Micel (2), Nimbel (1) | 1-2 ✔ |
| Rara | Aguacato (3), Voltel (3, v1.2), Cuarel (3), Espirel (2), Somnel (2) | 2-3 ✔ |
| Épica | Lunel (3) | 3 ✔ |
| Legendaria | – | 1 (única) |

| Elemento | Líneas |
|---|---|
| Hoja | Aguacato, Micel |
| Agua | Ondel, Espirel |
| Sombra | Somnel, Lunel |
| Fuego | Ignel |
| Eléctrico | Voltel |
| Aire | Nimbel |
| Roca | Cuarel |

**Reglas de equilibrio para las próximas criaturas:**
1. **Reparto objetivo de líneas: ≈ 25 % sin evolución · ≈ 45 % con 1 evolución · ≈ 30 % con 2** (las legendarias cuentan como «sin evolución»). Hoy faltan criaturas de 1 fase y sobran de 3.
2. **Camino a 16 líneas** (+6): 3 de 1 fase, 2 de 2 fases, 1 de 3 fases → 4 / 7 / 5 (25 % / 44 % / 31 %). Las de 1 fase deben ser sobre todo Comunes simpáticas o la legendaria.
3. **Las criaturas sin evolución no son «peores»:** se compensan con identidad fuerte (rasgo único, movimiento propio) y, más adelante, estadísticas base algo más altas en su única fase.
4. **Coherencia con la rareza:** Común 1-2 · Rara 2-3 · Épica 3 · Legendaria 1. Una criatura de 3 fases que no sea Rara o superior obliga a cambiar la regla (como Voltel), y eso se decide con el usuario.
5. **Elementos:** al diseñar, priorizar los que tienen una sola línea (Fuego, Eléctrico, Aire, Roca) antes de dar una tercera a Hoja, Agua o Sombra; y que ningún elemento tenga todas sus líneas con el mismo número de fases.
6. **Historia manda:** el número de fases lo decide la historia de la criatura (cría/joven/adulta) y la elección de quien la diseña; los porcentajes son una guía, no una cuota.
7. Cada fase nueva sigue la regla de v1.0: silueta, paleta y rasgo propio distintos (no basta agrandar).

**Plan para llegar a 20 líneas (v1.3):** el Bloque 2 (`BLOQUE_2.md`) añade 10 líneas con reparto 4 / 4 / 2 (sin evolución / una / dos) y deja el total en 5 / 9 / 6 (25 / 45 / 30 %), con 3 líneas por elemento (Sombra 2), 9 Comunes, 8 Raras, 2 Épicas y 1 Legendaria. Incluye 2 huecos reservados para diseños de Oli.