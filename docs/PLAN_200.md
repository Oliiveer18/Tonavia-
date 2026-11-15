# PLAN 200 · Criaturas de Lali y Oli (v2.13)

**Documento maestro** del objetivo de 200 líneas evolutivas. Cualquier decisión sobre cuántas criaturas, de qué elemento, rareza y fases se hacen se toma aquí. Lo que ya está hecho está en `CATALOGO.md`; el estado y el siguiente paso, en `ROADMAP.md`; cómo se trabaja, en `METODO_DE_TRABAJO.md`.

**Estado de las decisiones (v2.3):**
- **Aprobado por el usuario:** la meta (200 líneas con todas sus evoluciones), el reparto de las secciones 3 y 4, el límite de dobles elementos (20 %, sección 7) y el orden de los hitos (sección 8).
- **Delegado en Claude por el usuario («hazlo lo más profesional posible»):** los rangos de tamaño y peso (sección 6), la arquitectura técnica (sección 10) y el sistema de nombres (`GUIA_DE_NOMBRES.md`). Quedan como reglas vigentes; el usuario puede cambiarlas cuando quiera.
- **Dandel y Perlel** se quedan como líneas del juego (sección 5).

## 1. Objetivo
- **200 líneas evolutivas** = **410 formas dibujadas** (210 son evoluciones). Hoy: 20 líneas y 41 formas; **faltan 180 líneas y 369 formas**.
- Todo nivelado: mismo peso de cada elemento, rareza proporcional, fases coherentes con la rareza, tamaños y pesos con lógica.
- Solo evoluciones, de momento sin condiciones, combate ni captura: ya están **decididos** (v2.13: evolución por nivel + objetos y combate híbrido, ver `HISTORIA_Y_MUNDO.md`) pero se programan después del motor de mapas.

## 2. Reglas fijas (ya vigentes, no cambian)
| Regla | Valor |
|---|---|
| Rareza → fases permitidas | Común 1-2 · Rara 2-3 · Épica 3 · Legendaria 1 |
| Elementos | 7: Hoja, Fuego, Agua, Eléctrico, Aire, Roca, Sombra; cada uno gana a 2 y pierde contra 2 (`DISENO_CRIATURAS.md`, sección 1) |
| Cada fase | silueta, paleta y rasgo propios; colores planos y contorno oscuro; vista de espaldas sin cara |
| Dibujo | se redibuja a la medida de cada fase, nunca se reescala |
| Tamaño y peso | propios de cada línea y fase (`G.LINE_PLAN`); la lógica manda, no un +2 fijo |
| Legendaria | 30×30, fase única |
| Nº de línea | fijo; 001-020 ya asignados, las nuevas desde 021 |

## 3. Meta por elemento y rareza
Cada elemento tiene **28 líneas** (7 × 28 = 196) y se suman **4 huecos de Oli** = **200**. Clave de las columnas:
**C1** Común sin evolución · **C2** Común con 1 evolución · **R2** Rara con 1 · **R3** Rara con 2 · **E** Épica (2 evoluciones) · **L** Legendaria · **X** libre (1 evolución; rareza a elegir entre las cuatro cuando se planifique).

Cada celda es **hecho/meta**. El elemento es el principal de la línea (los dobles cuentan en el primero).

| Elemento | C1 | C2 | R2 | R3 | E | L | X | Líneas | Formas meta |
|---|---|---|---|---|---|---|---|---|---|
| Hoja | 0/5 | 1/7 | 0/4 | 2/4 | 0/5 | 0/2 | 0/1 | **3/28** | 58 |
| Fuego | 1/5 | 1/7 | 0/4 | 0/4 | 1/5 | 0/2 | 0/1 | **3/28** | 58 |
| Agua | 0/5 | 1/7 | 2/5 | 0/3 | 0/5 | 0/2 | 0/1 | **3/28** | 57 |
| Eléctrico | 0/5 | 1/7 | 1/4 | 1/4 | 0/5 | 0/2 | 0/1 | **3/28** | 58 |
| Aire | 2/6 | 0/6 | 0/5 | 0/3 | 0/5 | 1/2 | 0/1 | **3/28** | 56 |
| Roca | 1/5 | 1/7 | 0/4 | 1/4 | 0/5 | 0/2 | 0/1 | **3/28** | 58 |
| Sombra | 0/5 | 0/7 | 1/5 | 0/3 | 1/5 | 0/2 | 0/1 | **2/28** | 57 |
| **Total** | 4/36 | 5/48 | 4/31 | 4/25 | 2/35 | 1/14 | 0/7 | **20/196** | 402 |

Por qué Aire, Agua y Sombra difieren un poco de los demás: hay que repartir 36 C1, 31 R2 y 25 R3 entre 7 elementos, y no se dividen exactos. Aire lleva un C1 más (nubes, semillas, plumas); Agua y Sombra llevan un R2 más y un R3 menos (conchas, caracoles, duendes).

## 4. Totales de la meta
| Rareza | Líneas | 1 fase | 2 fases | 3 fases | Formas |
|---|---|---|---|---|---|
| Común | 84 | 36 | 48 | – | 132 |
| Rara | 56 | – | 31 | 25 | 137 |
| Épica | 35 | – | – | 35 | 105 |
| Legendaria | 14 | 14 | – | – | 14 |
| Libres (7) y huecos de Oli (4) | 11 | – | 11 | – | 22 |
| **Total** | **200** | **50** | **90** | **60** | **410** |

- Sin evolución: 50 (25 %) · una evolución: 90 (45 %) · dos evoluciones: 60 (30 %).
- Hoy el reparto es 5 / 9 / 6 (25 / 45 / 30 %): ya está en el objetivo y debe mantenerse en cada hito.

## 5. Huecos de Oli y libres
- **4 huecos de Oli** (1 por hito): se llenan con diseños de Oli, que define el elemento y las fases (por defecto, 1 evolución). Los diseños de Oli conservan su nombre original y su estilo (rasgo único + objeto absurdo, como Aguacato).
- **Dandel** (013, Aire, Común, 1 fase: diente de león vivo que flota y suelta semillas) y **Perlel → Perlorix** (017, Agua, Rara, 2 fases: almeja con una perla enorme que se hace ostra con corona de coral) son propuestas de Claude que ocupaban los dos «huecos de Oli» del Bloque 2. Se quedan como líneas normales de su elemento; no son provisionales en el sentido de «peores»: el único motivo para sustituirlas sería que Oli quisiera un diseño suyo en ese puesto.
- Si Oli lo pide, su diseño ocupa el mismo Nº de línea (013 o 017) y la misma casilla de la tabla de la sección 3, y la línea de Claude pasa a otro puesto libre.
- Si en un hito no ha llegado el diseño de Oli, el hueco se cubre con una línea extra del elemento más corto y el hueco pasa al hito siguiente.
- Las 7 **libres (X)**, una por elemento, sirven para ajustar el equilibrio al final de cada hito.

## 6. Tamaño y peso (APROBADO; criterios de Claude por delegación)
El tamaño y el peso los decide la historia de cada criatura (`G.LINE_PLAN`); estas reglas son una **alarma** del test de equilibrio, no un molde. Salen de los datos reales de las 20 líneas actuales.

| Regla | Contenido | Hoy |
|---|---|---|
| **T1 · Medidas pares** | ancho y alto siempre pares (sprites centrados y simétricos) | se cumple en las 41 formas |
| **T2 · Escalera de presencia** | área de la última fase (ancho × alto): Común 150-340 px² · Rara 340-600 · Épica 600-760 · Legendaria 900 (30×30) | Común 168-324 · Rara 352-572 · Épica 624-672 · Legendaria 900; sin solaparse |
| **T3 · Dimensiones por rareza y fase** | tabla siguiente | dentro de rango |
| **T4 · Fase distinta** | cada fase cambia ancho o alto respecto a la anterior; si no cambia el tamaño, cambia la silueta y se justifica en la ficha | se cumple |
| **T5 · Peso con lógica** | libre; la ficha justifica cada fase. Alarma si el peso baja de una fase a la siguiente (caso permitido: Somnaris 2 kg < Somnel 3 kg, porque flota) o sale del rango | se cumple |
| **T6 · Legendaria** | 30×30 fija, fase única; peso libre con lógica | Zefirax 12 kg |

| Rareza · fase | Observado hoy (ancho × alto · kg) | Rango permitido (T3) |
|---|---|---|
| Común · fase 1 | 12-20 × 12-18 · 0,05-3 | 12-20 × 12-20 · 0,05-5 |
| Común · fase 2 | 14-18 × 12-18 · 1-6 | 14-20 × 12-20 · 0,5-10 |
| Rara · fase 1 | 14-20 × 14-20 · 2-25 | 14-20 × 14-20 · 1-30 |
| Rara · fase 2 | 16-20 × 16-22 · 2-45 | 16-22 × 16-24 · 2-60 |
| Rara · fase 3 | 20-22 × 22-26 · 14-120 | 20-24 × 22-28 · 10-150 |
| Épica · fase 1 | 16-20 × 14-20 · 4-12 | 16-22 × 14-22 · 3-20 |
| Épica · fase 2 | 20-26 × 20 · 6-40 | 20-28 × 20-24 · 5-60 |
| Épica · fase 3 | 24 × 26-28 · 8-110 | 24-28 × 26-30 · 8-150 |
| Legendaria | 30 × 30 · 12 | 30 × 30 · peso libre |

## 7. Elementos dobles (APROBADO: hasta el 20 %)
- Hasta **el 20 % de las líneas (40)** pueden tener dos elementos; cuentan en el elemento principal (el primero).
- El segundo elemento tiene que nacer de la historia de la criatura, no ser decorativo; se explica en la ficha.
- Ninguna pareja de elementos se repite en más de **3 líneas** (hay 21 parejas posibles), para que los dobles no se concentren.
- Hoy hay 2: Zefirax (Aire + Eléctrico) y Forjel (Fuego + Roca). Se programan sobre todo en el Hito 3; antes, solo si la historia de una línea lo pide.

## 8. Hitos y lotes (APROBADO el orden)
Un **lote** son 10 líneas (unas 20 formas): fichas → aprobación → una línea por ZIP. Quedan 18 lotes. Cada lote lleva todos los elementos en proporción; nunca se hace un elemento entero de golpe.

| Hito | Líneas al cerrar | Lotes | Prioridad |
|---|---|---|---|
| 0 | 20 | – | Este plan y los documentos (**HECHO v2.2**) |
| 1 | 50 | 3 | Nivelar Sombra; una Épica y una Legendaria por elemento |
| 2 | 100 | 5 | Comunes y Raras en proporción |
| 3 | 150 | 5 | Dobles elementos y segundas variantes |
| 4 | 200 | 5 | Cierre y equilibrio final (libres y huecos) |

**Hito 1 en detalle (50 líneas = 7 por elemento + 1 hueco de Oli):**
| Elemento | Hoy | Nuevas | Al cerrar | Épica / Legendaria nuevas |
|---|---|---|---|---|
| Hoja | 3 | 4 | 7 | Épica + Legendaria |
| Fuego | 3 | 4 | 7 | Legendaria (ya tiene Épica: Forjel) |
| Agua | 3 | 4 | 7 | Épica + Legendaria |
| Eléctrico | 3 | 4 | 7 | Épica + Legendaria |
| Aire | 3 | 4 | 7 | Épica (ya tiene Legendaria: Zefirax) |
| Roca | 3 | 4 | 7 | Épica + Legendaria |
| Sombra | 2 | 5 | 7 | Legendaria (ya tiene Épica: Lunel) |
| Hueco de Oli | – | 1 | – | – |
| **Total** | **20** | **30** | **50** | 5 Épicas + 6 Legendarias |

Las demás nuevas son Comunes y Raras en proporción 12:8. A Sombra, que no tiene ninguna Común, le tocan las primeras.

**Cierre de hito:** comprobación completa, acotada (ver `METODO_DE_TRABAJO.md`): tests del juego, test de equilibrio, y revisión de que el reparto por elemento, rareza y fases coincide con la sección 3. Si falta o sobra algo, se corrige en el hito siguiente (tolerancia: ±1 línea por casilla de la tabla).

**Esfuerzo orientativo:** unos 180 ZIP de línea (uno por línea) + 18 de fichas + 5 de cierre + 4-5 técnicos = unos **210 ZIP**.

## 9. Reglas de equilibrio (comprobables)
Servirán de base al test de equilibrio (paso 1.0). Todas se miran con datos (`G.CREATURES`, `G.LINE_PLAN`) y se comprueban en segundos.
1. **E1 · Rareza y fases:** número de fases dentro del rango de su rareza.
2. **E2 · Reparto por elemento:** cada elemento dentro de ±1 línea de su meta del hito.
3. **E3 · Reparto por rareza:** cada casilla de la sección 3 dentro de ±1 en el cierre de hito.
4. **E4 · Tamaño y peso:** reglas T1-T6 de la sección 6 (alerta, no bloqueo).
5. **E5 · Lógica de crecimiento:** cada fase se distingue de la anterior en silueta (no solo tamaño); no hay dos formas idénticas.
6. **E6 · Silueta y paleta únicas:** dos líneas no comparten silueta de fase 1 ni paleta dominante.
7. **E7 · Nombres:** reglas N1-N10 de `GUIA_DE_NOMBRES.md` (raíz compartida, unicidad, distancia, cuotas, ortografía).
8. **E7b · Dobles:** máximo 40 líneas con dos elementos y ninguna pareja en más de 3 líneas (sección 7).
9. **E8 · Ficha previa:** ninguna línea se dibuja sin ficha de identidad aprobada.
10. **E9 · Datos completos:** cada forma tiene `family`, `stage`, `evolvesTo`, `phases`, tamaño y peso en `G.LINE_PLAN`, rasgos en `G.TRAITS`, dibujo y sitio donde aparece.

## 10. Arquitectura técnica (APROBADO; diseñada por Claude por delegación)
El código estaba montado para unas 40 formas (un solo `formas.js` de 1.739 líneas, datos repartidos en `G.PHASES_PLAN`, `G.LINE_PLAN`, `G.TRAITS` y `SPAWN` —ya juntados en `src/lineas.js` desde el paso 1.1, v2.6—, un mapa con sitio para 20 criaturas). Para llegar a 410 formas, antes del primer lote del Hito 1 se hacen estos pasos, **cada uno con su ZIP y sin cambiar lo que ve el jugador** (salvo 1.3 y 1.4):

| Paso | Qué | Criterio de cierre (prueba del paso) |
|---|---|---|
| 1.0 | **Test de equilibrio** (`tools/equilibrio.js`): reglas E1-E9, T1-T6 y N1-N10; informe corto en consola. **HECHO (v2.4)** | corre en menos de 2 s (0,2 s) y da 0 alertas con las 20 líneas actuales |
| 1.1 | **Registro único de datos** (`src/lineas.js`): una entrada por línea con Nº, raíz, elementos, rareza, fases, tamaño y peso por fase, rasgos de movimiento, región y aparición, hito y lote; de él se derivan `G.LINE_PLAN`, `G.PHASES_PLAN`, `G.TRAITS` y `SPAWN`. Genera `CATALOGO.md`. **HECHO (v2.6)** | los tests actuales pasan; las 41 formas salen idénticas (instantánea de datos y huella de sprites iguales antes y después) |
| 1.2 | **Dibujo por elemento**: `src/formas_base.js` (helpers) y un `src/formas_<elemento>.js` por elemento; `build.js` los une. **HECHO (v2.7)** | huella (hash) de los sprites idéntica antes y después: 41 formas × 4 direcciones × 3 frames |
| 1.3 | **Mundo y aparición** (v2.10: se parte en 1.3a motor de mapas, 1.3b aparición, 1.3c interiores, 1.3d dos móviles y 1.3e personalización; ver `HISTORIA_Y_MUNDO.md`, sección 5): una región por elemento (el claro actual crece), tabla de aparición por zona ponderada por rareza (Comunes frecuentes, Raras medias, Épicas escasas, Legendarias con guarida fija y única) y un máximo de criaturas activas a la vez (24, ajustable); el resto aparece al entrar en su región | ninguna criatura pisa árboles ni agua; el máximo se respeta |
| 1.4 | **Galería**: filtros por elemento, rareza y fases; orden por Nº de línea; paginación; ficha con tamaño, peso, evolución y Nº de línea; búsqueda por nombre; sprites dibujados al verse. **HECHO (v2.8)** | todas las líneas se ven y filtran (20 reales y 200 simuladas, 390×780) |
| 1.5 | **Presupuestos**: archivo final ≤ 3 MB con 410 formas, sprites generados al verlos y guardados en caché, arranque medido. **HECHO (v2.9)** | medición rápida con muestra indicada (410 formas simuladas): 1,59 MB, arranque 349 ms con CPU 4× más lenta, caché ≤ 300 |

Detalle de cada paso (qué, cómo, línea base, prueba de cierre y riesgos): `PASOS_1_1_A_1_5.md`.

Después, en cada lote: hoja de contacto (`tools/hoja_sprites.py`) con las 10 líneas juntas antes de cerrarlo, para revisar de un vistazo que ninguna se parece a otra.

## 11. Plantilla de ficha de línea nueva
```
Nº de línea:
Nombres de cada fase (raíz compartida, ver GUIA_DE_NOMBRES.md):
Idea de la raíz (de dónde sale el sonido) y 2 alternativas:
Comprobación de originalidad (búsqueda) y de las reglas N1-N10:
Autor (Claude / Oli):
Elemento(s):
Rareza y fases (C1, C2, R2, R3, E, L, X):
Historia (cría → joven → adulta):
Silueta, paleta y rasgo propio de cada fase:
Qué se conserva de la fase 1:
Tamaño y peso de cada fase (con la lógica):
Frase al hablarle y cómo se mueve:
Casilla del plan (elemento / categoría / hito y lote):
```

## 12. Decisiones (v2.3)
| Punto | Decisión |
|---|---|
| Rangos de tamaño y peso | aprobados; criterios en la sección 6 (por delegación) |
| Dobles elementos | 20 % máximo; reglas en la sección 7 |
| Orden de los hitos | aprobado (sección 8) |
| Requisitos técnicos | aprobados; arquitectura en la sección 10 (por delegación) |
| Dandel y Perlel | se quedan; Oli puede sustituirlas si quiere (sección 5) |
| Nombres | sistema propio en `GUIA_DE_NOMBRES.md` (por delegación); el usuario aprueba cada nombre en la ficha de cada línea |

**Hecho:** pasos 1.0 (v2.4), 1.1 (v2.6), 1.2 (v2.7), 1.4 (v2.8), 1.5 (v2.9) y 1.3a (v2.16, motor de mapas); el 1.4 y el 1.5 se hicieron antes que el 1.3 porque no dependen de él. **v2.10-v2.13:** editor de mapas hecho y mundo, combate, historia y evolución decididos en `HISTORIA_Y_MUNDO.md`. **Pendiente del usuario:** decir cuándo arrancar el paso 1.3a (motor de mapas). Detalle de los pasos 1.1-1.5 en `PASOS_1_1_A_1_5.md`.

## 13. Mundo, combate y evolución (v2.13)
Los tamaños de mapa, el combate híbrido, la historia y las condiciones de evolución están en `HISTORIA_Y_MUNDO.md`. Efecto sobre este plan:
- **Campo nuevo `evolucion`** por forma en `src/lineas.js`: `{ nivel, objetos: [{ id, cantidad }], pareja }`. Objetos: 7 Notas y 7 Fragmentos (uno por elemento). Épica fase 2→3 pide Fragmento; los dobles elementos piden el objeto del segundo elemento.
- El test de equilibrio añadirá el reparto de condiciones (≈ 45 % solo nivel, 30 % Nota, 15 % Fragmento, 10 % pareja) y comprobará que cada objeto necesario tiene fuente.
- **Campos de combate** (`pv`, `ataque`, `defensa`, `velocidad`, ataques) se calculan con fórmula a partir de rareza, fase y elemento, con ajustes por línea (pasos 1.6-1.7).
- **Zonas de aparición** salen de las zonas de cada mapa (`maps/*.json`), no de una tabla única.

## 14. Identidad antes de interiores y espacio de criaturas al final (v2.20)
- Bloque de identidad visual y sonora (ID-1 a ID-5) **antes** del primer interior; ver `PLAN_IDENTIDAD.md`.
- **El espacio entre criaturas y su colocación en los mapas se deciden al final**, cuando se implementen todas las líneas (faltan +160 líneas y sus evoluciones por crear visualmente). Hasta entonces, ocultas con `AJUSTES.VISIBLES`.
- Los hitos de criaturas (1-4) no cambian de orden ni de tamaño.
