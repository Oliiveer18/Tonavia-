# ESTÁNDAR DE SOMBREADO Y DETALLE DE CRIATURAS · v2.24.5

Documento de reglas fijas (paso 1 de 6 del arreglo del sombreado, 2 nov 2026). Lo escribe Claude a petición del usuario, que NO quiere más píxeles de varios colores añadidos a mano: hacen la criatura inconsistente. Complementa a `REGLAS_DE_LUZ.md` (luz, rampas y sistema técnico) y manda sobre cualquier detalle de elemento (agua, eléctrico…) hecho a mano.

## Principio
**La criatura se lee por su SILUETA y por 3-4 masas de color. El sombreado ordena esas masas; no añade ruido.** Si un píxel no mejora la silueta, la cara o el volumen, sobra.

## Reglas (se comprueban con tools/luz.js y a ojo en la hoja de contacto)
1. **Una sola luz: arriba-izquierda.** Sombra abajo-derecha, en TODAS las criaturas y elementos. Nunca una luz distinta por zona.
2. **Dos tonos por masa: base y sombra** (modo `limpio: true`, ya implementado). El brillo de 1-2 px solo en metal y cristal. Sin tonos intermedios.
3. **La sombra es una banda continua** abajo-derecha, de grosor regular. Sin píxeles sueltos, sin escalones de 1 px, sin tramado ni degradados.
4. **Bloques, no puntos:** cualquier zona de luz, sombra o detalle mide al menos 2×2 px, salvo ojos, boca y chispas/brillos declarados. Un píxel suelto de otro color está prohibido.
5. **Un solo contorno** por criatura (`#2a1b30`), sin matices según el entorno.
6. **Colores:** el límite lo mide `tools/luz.js` por vista (base ≤ 24 y el sombreado no puede pasar de ×2 con `limpio`). Una criatura nueva debe quedarse en 4-6 colores de base + 1 de acento (rareza alta: hasta 8).
7. **Un solo color de acento por criatura** (ojos aparte): el rasgo que la hace reconocible. No repartir el acento en muchos puntos.
8. **El elemento se expresa con la SILUETA, no con decoración:** agua = formas de gota, lóbulos redondos y un brillo; eléctrico = puntas y zigzag en la silueta y una zona luminosa (`emite`) sin sombrear; fuego = llama en la silueta; roca = facetas grandes. No se pegan salpicaduras, chispas ni motas de colores por el cuerpo.
9. **Lo que emite luz no se sombrea** (llamas, electricidad, brasas, ojos mágicos): se marca en `emite`.
10. **Todo el sombreado sale del motor** (`src/sombreado.js` + ficha en `src/luz_criaturas.js`). Prohibido pintar a mano luces y sombras en los dibujos de `src/formas_*.js`; ahí solo van las masas de color y los rasgos.
11. **Legibilidad:** a tamaño real (1×) en móvil se distingue la silueta, los ojos y el rasgo principal. Si hace falta ampliar para entenderla, falla.
12. **Siluetas:** el sombreado nunca cambia el canal alfa. Ojos iguales y simetría de frente/espalda (`tools/simetria.js`, `tools/ojos.py`).

## Lo que NO quiere el usuario (v2.24.5)
- Capas de varios colores en cada zona.
- Píxeles sueltos de colores distintos como «detalles» (salpicaduras, motas, chispas repartidas).
- Sombreado a mano criatura por criatura que no salga del motor.
(Se suman a las de `REGLAS_DE_LUZ.md` sección 6: manchas en el césped, espuma blanca en el lago, sombras proyectadas junto a los árboles.)

## Flujo para migrar o crear una criatura
1. Dibujo en `src/formas_<elemento>.js`: solo masas de color y rasgos (reglas 4, 7, 8, 10).
2. Ficha en `src/luz_criaturas.js` con `limpio: true`, material y `emite`.
3. `node tools/luz.js`, `node tools/simetria.js --sombreado`, `node tools/equilibrio.js`, `node test.js`.
4. Hoja de contacto antes/después a 1× y ampliada, y captura de móvil 390×844. Aprobación del usuario antes de empaquetar.

## Estado de partida de este ZIP
Contiene el sombreado limpio aprobado en 15 criaturas (Hoja, Fuego, Voltorax, Cuarzoth). **No contiene** los retoques de Agua ni de Eléctrico hechos en otros chats: este ZIP es el estado limpio al que se vuelve (paso 3 del plan queda cubierto al trabajar desde él). Las criaturas aún sin ficha de luz usan la pasada de bordes de la v2.21 hasta migrarlas con estas reglas.

## Actualización v2.24.6 (paso 2a)
La regla 4 ya la aplica el motor en la sombra (`src/sombreado.js`) y la vigila `node tools/bloques.js`. Pendiente (paso 2b): reglas 5, 6 y 7 en `tools/luz.js`.

## Actualización v2.24.7 (paso 2b)
`tools/luz.js` vigila ya contorno único (regla 5), brillo solo en metal/cristal (regla 2) y colores de base ≤ 24 con `limpio` (regla 6; 4-6 + 1 acento para criaturas nuevas, revisado a ojo). Paso 2 completo.

## Actualización v2.25 (paso 4, parte 1 de 4)
Agua (6 formas) migrada con `limpio: true`; ya son 21 las formas con sombreado limpio. Faltan 20 (partes 2-4 del paso 4).

## Actualización v2.26 (paso 4, parte 2 de 4)
Eléctrico y Aire (9 formas) migrados con `limpio: true`; ya son 30 las formas con sombreado limpio. Faltan 11 (Roca, Sombra y Ignel).

## Actualización v2.27 (paso 4, parte 3 de 4)
Roca, Sombra e Ignel (11 formas) migrados con `limpio: true`; ya son las 41 formas con sombreado limpio.

## Actualización v2.28 (paso 4, parte 4 de 4)
Revisión del conjunto sin cambios de código: las 41 formas con `limpio: true`, hoja de contacto y captura en móvil revisadas, todas las herramientas en verde. Regla nueva de cierre para cada criatura: pasar también `python3 tools/contorno.py` (contorno completo en los 16 frames, desde la v2.27.1).


## Regla de brillo (v2.47)
El sombreado no puede dejar a las criaturas más oscuras de la cuenta: una criatura sombreada no pierde, de media, más de 4 puntos de claridad (de 255) frente a su dibujo sin sombreado, y ninguna pierde más de 8 (control: `node tools/brillo.js`, también en `test.js`). Antes de la v2.47 la media era 4,7 y la peor, cuarzin, 11,1.
- **Sombra suave por material** (`SOMBRA_SUAVE` en `src/sombreado.js`): la sombra usa un contraste de rampa más bajo (piel 0,78 · roca 0,70 · metal y cristal 0,55 × el contraste del material). La luz no cambia. El mínimo de contraste del estándar (`MIN_DELTA` de `tools/luz.js`) manda: la piel no puede bajar de 0,78 (lunareth se queda en el límite).
- **Luz de borde en las criaturas oscuras** (claridad media del relleno < 0,30): el relleno pegado al contorno por arriba-izquierda toma el tono `l1` de su rampa, para que el cuerpo no se funda con el contorno y la silueta se lea sobre el suelo.
- Nunca se inventa un color fuera de la rampa del propio relleno, y el alfa (la silueta) no cambia.
