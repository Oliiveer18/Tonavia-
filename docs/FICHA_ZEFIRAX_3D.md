# FICHA DE CRIATURA 3D · ZEFIRAX (v2.168 · paso 1 de 7, PROPUESTA pendiente de aprobación)

Primera criatura en 3D del HD-2D. Hoja de vistas: `docs/zefirax3d_hoja_de_vistas.png` (sprites 2D reales + curva propuesta). El 2D no cambia; la colisión, el combate y el motor tampoco.

## 0. Reglas
1. **Unidad:** 1 u = 1 casilla = 16 px = 16 texels. Zefirax mide 30×30 px = **1,875 u** (Legendaria, fase única, 12 kg, Aire + Eléctrico).
2. **Volumen con textura de píxel**, filtro nítido, luz fija arriba-izquierda (oeste = luz, sur = base, este y norte = sombra, arriba = brillo), como Oli, Lali, farola y banco.
3. **Lo que emite luz no se sombrea:** ojos, bandas amarillas, rayos y destellos (regla 7 de `BIBLIA_VISUAL.md`).
4. **Sin azar:** la ondulación es una función pura del reloj (`Math.random` prohibido en lo puro).
5. **Interruptor de seguridad:** `G.hd2d.AJUSTES.CRIATURAS3D` (lista de ids; hoy solo `zefirax`). Apagado o con cualquier fallo = lámina de hoy.
6. **Presupuesto:** ≤ **500 triángulos**, atlas ≤ 256×256, +1 llamada de dibujo. Estimación de esta ficha: ≈ 300.
7. Un paso por sesión con su ZIP. Módulo nuevo `src/criatura3d.js`, **parametrizado por datos** (la definición de Zefirax es un objeto); no se generaliza más hasta que haya una segunda criatura.

## 1. Cómo es Zefirax hoy (leído de `src/formas_aire.js`)
- **Rasgo:** serpiente del viento: cinta en «S», cabeza de dragón con crin de nubes, cola que se deshace en jirones. Flota siempre, majestuosa y lenta; parada, la cinta ondula y descarga rayos (fotograma 2).
- **Vistas del 2D:** `down` (frente, con cara), `up` (espalda, sin cara) y `left` (perfil en 3/4 con los dos ojos); `right` es el izquierdo reflejado. **Cada vista tiene su propio trazado de la cinta**: no son tres proyecciones de una misma curva. Consecuencia: el 3D será *la misma criatura*, no una copia píxel a píxel de cada vista (ver §6).
- **Cuerpo:** cinta de 5 px de ancho en la parte gorda (radio 2,5 px = 0,156 u), 3,4 px en el cuello, afinándose hasta 1,6 px en la cola. Seis **bandas amarillas** a u = 0,30 · 0,42 · 0,54 · 0,66 · 0,78 · 0,90.
- **Cabeza:** 10×10 px (0,625 u) con dos cuernos dorados, ojos amarillos con pupila oscura y hocico claro; **crin** de 5-7 nubes redondas (radio 2-3 px) a los lados y detrás.
- **Cola:** cuatro motas cada vez más pequeñas (jirones). **Destellos:** estrellas amarillas de 5 px a los lados y puntos sueltos; rayos en zigzag en el fotograma 2.
- **Paleta (se conserva):** W `#e6f2ff` lomo/nubes · w `#b3b0e6` sombra de nube · C `#7ec8f2` flanco · N `#26337f` vientre y ojos · Y `#ffe433` bandas y rayos · G `#f2b632` cuernos · H `#ffffff` destello · K pupila oscura.

## 2. Diseño 3D propuesto
- **Cuerpo = cadena de 16 tramos** (17 anillos) de sección **hexagonal**, que siguen una **hélice aplastada de ≈ 1,1 vueltas**, de la cabeza (arriba) a la punta de la cola (abajo). Posición local (x lateral, z hacia delante, y arriba), con `t` de 0 (cabeza) a 1 (cola):
  - `y(t) = 1,62 − 1,40·t` (de 1,62 u a 0,22 u).
  - `x(t) = −0,58·sin(2π·t/0,9)·(1 − 0,15·t)` · `z(t) = 0,45·sin(2π·t/0,9 − 1,2)·(1 − 0,1·t)` (desfasadas ≈ 70°: el S se ve de frente y de perfil).
  - Radio: 0,18 u en el cuello · 0,156 u hasta t = 0,55 · baja a 0,106 u en t = 0,8 · 0,05 u en la punta.
  - Es una **primera curva**: en el paso 2 se ajusta contra el 2D de frente y 3/4 hasta que la silueta caiga a ≤ 1 px, y queda anotada aquí.
- **Cabeza (paso 3):** hocico y cráneo como dos prismas achaflanados (≈ 60 triángulos), dos cuernos de cuatro caras (G), mandíbula inferior más clara, **ojos como cuadros emisivos** amarillos con pupila K.
- **Crin y jirones (paso 5):** láminas de nubes con **recorte duro** (`alphaTest`, sin semitransparencia: borde de píxel nítido y sin problemas de orden de dibujo al girar la cámara): 5 láminas cruzadas en la nuca y 4 jirones a la cola.
- **Texturas (paso 4):** recortadas del propio 2D (lomo W/C, vientre N/w, bandas Y); el volumen reparte el color por la cara según su normal (lomo = hacia arriba/atrás, vientre = hacia abajo).
- **Movimiento:** flota con vaivén de 0,06 u y periodo ≈ 3 s; la onda del cuerpo **viaja de la cabeza a la cola** (desplaza la fase de `x`/`z`; velocidad ≈ 0,8 vueltas/s en reposo, más rápida si se mueve); la **cabeza guía** y el cuerpo gira (`yaw`) según la dirección (`down` = mira al sur, `left` = oeste…).
- **Sombra:** elipse suave de contacto en el suelo (≈ 0,55 × 0,35 u, k 0,35) que se achica algo con la altura del vaivén; no se pinta bajo un edificio.
- **Efectos (paso 6):** chispas eléctricas y destellos con las partículas que ya existen (v2.93), sin partículas nuevas ni azar; los jirones de la cola se animan con el reloj.

## 3. Presupuesto de triángulos (estimado)
| Parte | Cálculo | Triángulos |
|---|---|---|
| Cuerpo | 16 tramos × 6 caras × 2 | 192 |
| Cabeza | cráneo, hocico, mandíbula | ≈ 60 |
| Cuernos | 2 × 4 caras × 2 | 16 |
| Ojos | 2 cuadros × 2 | 4 |
| Crin | 5 láminas cruzadas | ≈ 20 |
| Jirones | 4 láminas | 8 |
| **Total** | | **≈ 300** (máx. 500) |

## 4. Pasos (un ZIP por paso, PARAR tras cada uno)
| Paso | Esfuerzo | Qué |
|---|---|---|
| 1 | LOW | **Esta ficha y la hoja de vistas** (v2.168) |
| 2 | MEDIUM | `src/criatura3d.js`: cuerpo en S con ondulación y flotación, ya dentro del juego (prototipo para validar escala y cámara) |
| 3 | MEDIUM | Cabeza, cuernos y ojos luminosos |
| 4 | MEDIUM | Texturas de píxel recortadas del 2D |
| 5 | MEDIUM | Crin y jirones de la cola (láminas con recorte duro) |
| 6 | LOW | Integración final: interruptor, sombra, chispas eléctricas con las partículas existentes |
| 7 | LOW | Tests y capturas a 390×844 con Three.js real |

## 5. Pruebas previstas
`test.js` (grupo nuevo: módulo puro, presupuesto ≤ 500, sin azar, interruptor), `node tools/huella_juego.js --comprobar` (el 2D no cambia, normal y clásico), `tools/prueba_hd2d_juego.py` y una prueba nueva de Zefirax con Three.js real a 390×844 (frente, espalda y perfil).

## 6. Riesgos y decisiones por aprobar
1. **Fidelidad:** al ser tres dibujos distintos, el 3D no puede coincidir píxel a píxel con las tres vistas. Prioridad: frente y 3/4 (las que más se ven). La espalda saldrá algo distinta.
2. **Rendimiento en móviles lentos:** presupuesto bajo (≈ 300, máx. 500) y un solo material; el interruptor permite volver a la lámina.
3. **Aspecto «de bloque»:** la hélice con anillos hexagonales puede verse facetada de cerca. Se juzga con la captura del paso 2; si hace falta, se sube a 8 lados (≈ 256 triángulos) dentro del presupuesto.
4. **Aprobación:** esta ficha es una propuesta. Hasta tu «hazlo» no se escribe código.
