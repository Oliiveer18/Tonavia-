# FICHA DE CRIATURA 3D · SOMNEL (`somnin`) (v2.238 · paso 1 de 3, APROBADA; paso 2 hecho en la v2.239)

Sigue `docs/GUIA_MODELADO_3D.md` (leerla antes del paso 2). Medidas sobre los sprites 2D reales con el contorno incluido: `docs/somnel3d_medidas.png` (frente, perfil y espalda con rejilla de 2 px y las piezas marcadas) y `docs/somnel_2d_referencia.png`. El 2D no cambia.

## 1. Datos
Sombra · Rara · 16×20 de ficha, **sprite de 18×22 px = 1,125 × 1,375 u** (el más alto de las tres criaturas 3D) · 3 kg · evoluciona a Somnaris (fuera de este plan). Línea: «Zzz... cinco minutitos más...». Paleta: cuerpo `#8e5bc4` / manchas `#863eb9` · gorro `#5f3b8e`, `#562e77` · banda del gorro `#4a2c73`, `#41215c` · amarillo `#f7d54a` (borla, estrella, motita) · tinta `#2a1b30`.

## 2. Piezas y medidas (en px del sprite; 1 u = 16 px; suelo = fila 22)
| Pieza | Forma 3D | Medida / posición | Color |
|---|---|---|---|
| Cuerpo | masa única por cortes (superelipse), como Nimbel | 14 px de ancho (frente) × 13 de fondo (perfil); filas 10-17 → y 0,27-0,75 u; más estrecho arriba (filas 10 y 16-17) | textura propia (solo del cuerpo): `#8e5bc4` + manchas `#863eb9` |
| Gorro | cono de 5 anillos que se cierran en la punta | filas 3-9; base de 13 px en la banda; punta a y ≈ 1,19 u; **caído hacia atrás (−z) ≈ 2,5 px y +x ≈ 1,5 px** | liso `#5f3b8e` con tono; banda `#4a2c73`/`#41215c` |
| Borla | esfera pequeña | 2×2 px en la punta, filas 0-2 | `#f7d54a` (emisiva) |
| Ojos cerrados | decales planos pegados a la superficie | dos rayas de tinta de 3 px, fila 14, x 5-7 y 10-12; manchas `#863eb9` justo encima (filas 12-13) | `#2a1b30` / `#863eb9` |
| Patas | dos cajas biseladas | 4×4 px, filas 17-20; x 4-7 y 10-13 | liso `#5f3b8e` / `#562e77` |
| Estrella ✦ | dos cajas finas en cruz, **flotante a su lado** (decisión del usuario) | cruz 3×3 px; a ≈ +0,40 u en x, −0,15 u en z, centro a y ≈ 0,97 u; **flota y gira despacio** | `#f7d54a` emisiva |
| Motita amarilla | caja de 1 px | a la izquierda y delante, a la altura de la banda del gorro (fila 10) | `#f7d54a` emisiva |

**Nota de coherencia:** el gorro y la estrella caen siempre a la derecha de la imagen en las tres vistas del 2D (no son tres proyecciones de un mismo objeto, como Zefirax). Se elige: gorro caído hacia atrás y un poco a +x; estrella a +x y atrás; motita a −x y delante. Visto por detrás, la estrella saldrá a la izquierda (el 2D la pone a la derecha): diferencia asumida.

## 3. Texturas (generador)
Solo el cuerpo lleva textura proyectada. El gorro, las patas y la estrella comparten colores con el cuerpo en el 2D (`#5f3b8e`/`#562e77` aparecen en gorro y patas): por la lección de la v2.236 se generan **por filas**: el cuerpo toma solo las filas 10-16 (se quita todo lo demás y se rellena con el color del vecino); gorro y patas van en color liso. `tools/generar_sprites3d.py` necesita una máscara por filas (hoy solo por colores): pequeño añadido.

## 4. Animación (misma topología, solo vértices)
Cuerpo: respira despacio (escala vertical ±3 %, periodo ≈ 3,5 s, más lento que Nimbel: está dormido). Gorro: cabeceo suave con la respiración. Borla: se balancea. Estrella: flota ±0,03 u y gira. Al moverse: pasitos con las patas (como Arenel) y respiración más rápida.

## 5. Presupuesto
Cuerpo ≈ 130 quads · gorro ≈ 60 · borla 32 · estrella 2 × 26 · motita 26 · patas 2 × 26 · decales ≈ 14 → **≈ 390 quads ≈ 780 triángulos** (máx. 1200).

## 6. Pasos (un ZIP por paso; PARAR tras cada uno)
| Paso | Esfuerzo | Qué |
|---|---|---|
| 1 | LOW | Esta ficha y la hoja de medidas (HECHO) |
| 2 | MEDIUM | Modelo en `src/criatura3d_modelos.js` (`MODELOS.somnin`), máscara por filas en el generador de texturas, render a 6 vistas con los 2D al lado (**con la cámara mirando desde arriba**), para tu aprobación antes del juego |
| 3 | MEDIUM | Integración y cierre: tests, `prueba_criaturas3d.py` (añadir `somnin`), captura con Three.js real, publicar el artefacto con `somnin` en `FIJAS` (claro de Sombra, (9, 3), al noroeste del pueblo) |

## 7. Riesgos y decisiones
1. **Gorro y estrella entre vistas** (nota del §2): se asumen pequeñas diferencias con el 2D.
2. **Una malla 3D por tipo** a la vez (límite conocido).
3. **Un solo cuerpo blando con piezas pequeñas:** el riesgo de «bloque/seta» de Nimbel; el gorro y las patas ayudan a que no parezca una cúpula.
4. **Aprobación:** propuesta; hasta tu «hazlo» no se escribe código.
