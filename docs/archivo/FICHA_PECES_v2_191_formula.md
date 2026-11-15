# FICHA DE PECES · v2.191 (APROBADA por el usuario; aplicada en v2.192-v2.193)

Pasos siguientes (no se hacen hasta aprobar esta ficha): modelos 3D + sprites 2D + salto animado (MEDIUM) · tensión simple, ficha de captura y colección (MEDIUM).

## Reglas comunes
- **Nombres de peces reales y reconocibles**, sin diminutivos ni juegos de palabras. La identidad está en silueta, color y tamaño.
- **Los `id` internos NO cambian** (`pez_plateado`, `pez_gobio`, `pez_carpa`, `pez_trucha`, `pez_anguila`): están en los guardados y en lo que viaja entre los dos móviles. Solo cambia el nombre que se ve.
- Estilo del juego: colores planos con 3 tonos (luz, base, sombra), contorno oscuro en 2D, sin degradados. Vista lateral en 2D; en 3D, cajas y cintas pequeñas con color liso (como la caña y el corcho).
- Todo se construye por código, sin descargas. Mismo dibujo en los dos pintores o se anota como pendiente.

## Los cinco peces
| id (no cambia) | Nombre | Zona | Frecuencia | Tamaño 2D (px) | Largo 3D (u) | Peso (kg) |
|---|---|---|---|---|---|---|
| `pez_plateado` | **Alburno** | Orilla | Común (70) | 8 × 3 | 0,22 | 0,02 – 0,06 |
| `pez_gobio` | **Gobio ámbar** | Orilla | Poco común (30) | 9 × 4 | 0,26 | 0,05 – 0,15 |
| `pez_carpa` | **Carpa espejo** | Media | Común (65) | 14 × 6 | 0,40 | 1,5 – 6 |
| `pez_trucha` | **Trucha salmonada** | Media | Poco común (35) | 12 × 4 | 0,34 | 0,4 – 1,8 |
| `pez_anguila` | **Anguila negra** | Honda | Rara (100 dentro de su zona) | 18 × 3 | 0,55 | 0,8 – 3 |

(1 u = 1 casilla = 16 px. Hoy todos miden lo mismo; la diferencia de tamaño es parte de la identidad.)

## Identidad de cada uno
**Alburno** — El más pequeño y esbelto. Cuerpo fino plateado, vientre casi blanco, aleta de cola muy abierta. Ojo grande. Salta rápido y alto, casi sin peso. *Paleta:* luz `#e6f0f6` · base `#b9d0de` · sombra `#7f9db3` · aleta `#9fb7c9` · ojo `#2a1b30`.

**Gobio ámbar** — Achatado, cabeza grande y dos barbillas junto a la boca. Lomo ámbar con vientre claro y manchas oscuras en el costado. Aletas pectorales grandes y redondeadas. *Paleta:* luz `#f0cf86` · base `#d9a441` · sombra `#a8732b` · vientre `#f6e6bd` · manchas `#7a5320`.

**Carpa espejo** — Grande, alta y redonda. Azul acero con **pocas escamas muy grandes y brillantes** (la «espejo»: placas claras sueltas por el costado), boca pequeña con una barbilla. Salta pesada: sube poco y cae con salpicadura grande. *Paleta:* luz `#7fb0e0` · base `#4a86c5` · sombra `#2d5a94` · escamas `#d7ecff` · aleta `#2d5a94`.

**Trucha salmonada** — Alargada y estilizada. Flancos rosa salmón con una franja más clara a lo largo y puntitos oscuros muy finos; lomo verde grisáceo; cola ligeramente cortada. Salta en arco largo y se retuerce. *Paleta:* luz `#f3b5a3` · base `#e8907a` · sombra `#b8624f` · lomo `#8aa08c` · franja `#fbd9cc` · puntos `#5a3a3a`.

**Anguila negra** — Larguísima y fina, sin aletas laterales visibles, aleta dorsal continua. Casi negra con brillo violeta en el lomo y vientre gris. Ondula todo el cuerpo al saltar (el único pez con ondulación entera). Es la rara: solo en agua honda. *Paleta:* luz `#7a5fb0` · base `#2f2a3d` · sombra `#1b1824` · vientre `#8a8696` · ojo `#e8e0a0`.

## Cómo se construirá (para el paso siguiente)
- **2D:** un sprite lateral por pez (tamaño de la tabla), con contorno de 1 px; el salto alterna 2 fotogramas (aleteo) y se gira según sube o baja.
- **3D:** cuerpo de 4 a 6 cajas encadenadas (más gruesas en el centro), cola y aletas como cajas planas, ojo de 1 cubo. Menos de 40 caras por pez. La anguila usa 8 segmentos que ondulan. Color liso por zona (luz, base, sombra).
- **Animación del salto:** arco (sube, gira, cae), aleteo, salpicadura con anillos al entrar y al salir del agua.
- **Señal previa al pique:** una sombra oscura del pez (del tamaño de su especie) nadando bajo el corcho antes del pique real; en 2D un óvalo oscuro semitransparente.

## A decidir por ti al aprobar
1. ¿Te valen los cinco nombres, tamaños y paletas?
2. ¿Algún pez con rasgo propio de Tonavia (por ejemplo una marca que brille)? Por defecto, ninguno.

## v2.196 · Dibujo 2D a doble resolución (aprobado por el usuario con sus ajustes)
- **Tamaños (px, largo × alto):** Alburno 14 × 9 · Gobio ámbar 16 × 12 · Trucha 19 × 11 · Carpa espejo 20 × 16 · Anguila 28 × 10 (con ondulación). Ajustados a petición del usuario: un pez mide más o menos de una mano de Oli a la otra (≈ 14-18 px); la primera versión (22-44 px) se veía casi más grande que Oli. Generados por código en `src/peces.js` (`matriz`), sin descargas.
- **Estructura:** lomo oscuro, flanco, franja clara y vientre; contorno del tono oscuro del propio pez; branquia; aletas dorsal, anal, ventral y pectoral con radios; cola con radios; **ojo bien visible** (3×3 con aro claro y pupila en Carpa, Trucha y Gobio; 2×2 con aro en el Alburno; aro amarillo en la Anguila).
- **Boca abierta en V** (a petición del usuario): dos diagonales (mandíbula de arriba y de abajo) que se abren desde un vértice oscuro dentro de la cabeza hasta el morro. Ojo pequeño de 1 px con aro claro en los peces pequeños y 3×3 en la Carpa; la branquia solo en la Carpa.
- **Gobio ámbar:** SIN barbillas (parecía que algo le salía de la boca); su rasgo son las manchas oscuras del costado y la cabeza grande.
- **Pendiente (paso 3):** el 3D sigue con los modelos de cajas; el siguiente paso les da volumen y usa este sprite como textura.
