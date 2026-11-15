# GUÍA · PECES Y FAUNA MARINA DIBUJADOS A MANO (v2.222, 8 nov 2026)

**Por qué:** los peces generados por fórmula (v2.192-v2.196) no tenían la calidad ni la consistencia de un sprite dibujado; el **Cirujano azul** (v2.200-v2.208), dibujado píxel a píxel, sí gustó y es la referencia de estilo y calidad para todo lo nuevo. El proyecto quiere fauna marina de **5 en 5**.

## 1. Método (siempre en este orden)
1. **Diseño original**, no una copia. La lámina de referencia del usuario (peces de otro juego en punto de cruz) se usa solo como guía de ESTILO (siluetas gruesas y reconocibles, pocos tonos, ojo marcado, contorno). Si el juego sale online no puede llevar arte ajeno.
2. **Dibujo a mano**: una tabla de píxeles por criatura (la tabla final se escribe y retoca a mano, sin escalar; la silueta y el sombreado pueden partir de curvas a alta resolución, ver §5). Se pinta el relleno por filas/rangos y el contorno se añade con el **tono oscuro del vecino** (selout, ×0,36), o se escribe el sprite entero en texto.
3. **Aprobación por imagen ANTES de tocar el juego**: el usuario ve cada criatura ampliada (×14) y a tamaño real (×3) sobre el agua del juego, y a veces una comparación antes/después. Solo con su visto bueno se implementa.
4. **Un solo tamaño y un solo dibujo por criatura** (el usuario descartó tener dos tamaños).
5. Implementar en 2D y HD-2D, comprobar con capturas a 390×844 y con las pruebas de la zona; actualizar documentos; un ZIP por paso.

## 2. Reglas de estilo (sacadas del Cirujano azul)
- **Tamaño** de mano a mano de Oli: ≈ 14-20 px de largo; el prototipo mide 19×15. No más grande (el usuario rechazó peces de 22-44 px por «casi más grandes que Oli»).
- Vista de **perfil mirando a la DERECHA** (la cabeza a la derecha). Luz arriba-izquierda.
- **Contorno** oscuro del propio color (nunca negro puro); relleno de 4-5 tonos por zona (lomo oscuro, base, luz, vientre claro) con una marca propia (banda, manchas, franja, escamas…); siluetas gruesas y fáciles de leer a tamaño real.
- **Ojo** muy marcado: pupila 2×2 oscura + 1 píxel de brillo + aro claro. **Boca abierta en V** (dos diagonales, vértice oscuro dentro), discreta.
- Aletas y cola **con rayos** (dos tonos alternando); sin radios ruidosos en cuadrícula.
- **2 fotogramas**: la cola (columnas del extremo) baja 1 px en el segundo.
- Consistencia: un solo estilo y una sola paleta coherente por criatura (≈ 12-16 colores).
- Evitar píxeles sueltos que parezcan «algo saliendo de la boca» (se quitaron las barbillas del Gobio por eso).

## 3. Cómo se integra (técnico)
- **Datos:** `src/peces.js` → `PIXELES.<id> = { pal: { letra: '#color' }, filas: ['....'] }` (`.` = vacío) y `PECES.<id> = { nombre, zona, peso, kg: [min, max], fuerza, ritmo, margen, fallosMax, extraPique, color, sprite3d: true, forma: { L, H }, pal }`. `G.pesca.matriz(id, frame)` devuelve `{ w, h, px }`; el fotograma 1 baja las columnas 0-5 un píxel (ajustar si la cola ocupa más).
- **Elección:** `elegir(rnd, zona)` ignora `oculto`; si una zona no tiene criaturas usa la de la orilla. Añadir criaturas por zona de profundidad (0 orilla, 1 media, 2 honda). **Probar con tests** que cada criatura se puede sacar (ventanas de `margen`, `extraPique`).
- **2D:** `dibujaPez` (salto, sin colgar), `dibujaPezColgado` (el sprite girado 90° con la cabeza hacia arriba y la boca en el hilo; la fila de la boca = 55 % del alto), ficha y colección (`src/peces_ui.js`, ×5 en escala entera).
- **HD-2D:** `sprite3d: true` → lámina que mira a la cámara (`pezSprites` en `src/hd2d_pintor.js`, escala 0,032 u por píxel, `colgado` gira 90° con la boca arriba, `sumergido` = translúcido durante el forcejeo). Sombra del pique: tamaño por `forma.L`.
- **Decisión del 8 nov 2026:** solo criaturas que se pescan de verdad con caña (peces); el Pulpo (`colgar: 'erguido'`, cuelga derecho del hilo atado al manto) es la única excepción. Si algún día se añade otra criatura que no es un pez, hay que decidir en el plan su **pose enganchada** (colgar de la boca no sirve igual: p. ej. colgar de una pinza o del cuerpo) y si el sprite se gira o no; y quizá una orientación por criatura. Es un punto MEDIUM que el plan debe resolver con una imagen de ejemplo.
- Tests a actualizar siempre: nº de especies, tamaños distintos, el que da por hecho el pez de un toque, el de proyección en pantalla del pez enganchado (`v2.206`).

## 4. Cierre de cada lote de 5
Capturas 2D y HD-2D (forcejeo y salto) de cada criatura, `docs/SESION.md`, `docs/FICHA_PECES.md`, `docs/ROADMAP.md`, ZIP `criaturas_v2_NNN_*.zip` (borrando el anterior) y, si el usuario lo pide, republicar el artefacto en la misma URL.

## 5. Técnica y estilo vigentes (v2.215, 8 nov 2026, decidido con el usuario)
- **Estilo:** el de la lámina de referencia (peces de otro juego, solo como guía, nunca copiar), pero en PERFIL mirando a la derecha: cuerpos gruesos, aletas y colas sueltas y puntiagudas con huecos, 4-5 tonos por familia de color, y manchas AGRUPADAS (2-4 píxeles, siguiendo el cuerpo), nunca puntos de colores sueltos y dispersos. Ojo del Cirujano (2×2 oscuro, brillo blanco arriba-izquierda, aro claro). Boca: muesca pequeña en el morro con un píxel oscuro dentro (no un bloque negro). Borde de un solo color por pez si hay varios vecinos muy distintos.
- **Técnica:** silueta y sombreado en curvas a alta resolución (×12) → bajada a píxel por votación de color → contorno selout → retoque a mano sobre una rejilla con coordenadas (aletas, ojo, boca, manchas). Herramienta: `tools/dibuja_peces_hires.py` (Python + Pillow, solo para diseñar; el juego guarda la tabla de píxeles). Lo fino (espinas, moteado) NO sale de la bajada automática: va a mano.
- **Tamaño:** hasta ≈ 20 px de largo y 17 de alto (Oli mide 18×24); dos peces pueden medir igual si el dibujo es distinto.
- **Aprobación:** hoja con todos ampliados + tamaño real junto a Oli antes de tocar el juego; lotes de 5 (el lote 2 salió con 8 porque se aprobaron 3 de la reserva).

## 6. Contorno y relleno (lección del lote 3, v2.218)
- El borde es de **1 px** (4 vecinos, no 8: con 8 aparecen dobles líneas en las escaleras) y de **un solo color por pez**.
- Se dibuja primero el RELLENO completo (cuerpo, colas, aletas, espinas) y después se genera el borde; ojos, boca y manchas van al final. Si no, colas y aletas quedan sin relleno o sin borde.
- Nada de relleno pegado al borde del lienzo (no cabe el contorno): dejar 1 px de margen en las 4 caras. Bigotes o barbillas sueltas rompen el contorno: no se usan.
- Revisar cada pez a ×30 con rejilla y coordenadas antes de enseñarlo: píxeles sobrantes o que faltan en el morro, aros de ojo sobre el contorno, bocas desproporcionadas.
