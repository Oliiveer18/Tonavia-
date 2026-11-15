# LISTA · TODAS LAS DECORACIONES QUE NECESITAN MODELO 3D (al día en la v2.251, 9 nov 2026)

Sacada del catálogo real del juego (`G.OBJETOS`, 69 piezas) y de `maps/albanota.json` (75 objetos). «VOL» = ya tiene volumen 3D en el HD-2D; «lámina» = hoy sale como el dibujo 2D de pie con sombra proyectada. Esfuerzo: LOW = una pieza sencilla (cajas/prismas, textura proyectada del sprite); MEDIUM = pieza con varias partes, animación o mucho detalle.

## Estado: el registro de objetos 3D ya existe (v2.246, `src/objeto3d.js`) y la roca es la primera pieza

## Método propuesto (para no repetir los fallos de las criaturas)
1. **Un registro de objetos 3D** (MEDIUM, una vez): igual que `G.criatura3d` pero para decoración fija: `registrar(tipo, módulo)`, modelo por piezas con la textura PROYECTADA del sprite 2D (`tools/generar_sprites3d.py`), brillo neto, giro con la cámara del HD-2D y sombra proyectada. Reutiliza `criatura3d_modelos.js` (anillos, cajas biseladas, esferas, decales). Solo para lo que NO tiene ya `vol`.
2. Después, **lotes de 4-5 piezas por sesión** (LOW cada una, MEDIUM el lote), siguiendo `docs/GUIA_MODELADO_3D.md` (render real a seis vistas con los 2D al lado, cámara desde arriba, una textura por pieza cuando se tapan, rasgos como geometría).
3. **Norma de colocación (permanente, v2.245):** la decoración de naturaleza va SOLO en sitios lógicos (sobre hierba lisa; nunca bajo ni pegada a edificios, huerto, vallas, fuente ni otros objetos; nunca dentro de un interior). Lo comprueba `test.js` (v2.245).

## 1 · Exterior (Albanota) — 38 piezas distintas
| Pieza | Cantidad en el mapa | Estado hoy | Qué hace falta | Esfuerzo |
|---|---|---|---|---|
| Casa (neutra), casa de Oli, casa de Lali | 2 | VOL | Detalle definitivo (hoy volumen con textura de píxel) | hecho |
| Laboratorio | 1 | VOL | — | hecho |
| Centro PC, Tienda, Ermita | 1+1+1 | **VOL definitivo (v2.253-v2.257)** | Toldos, vitrinas y rótulo (Tienda), relieves de piedra (Ermita), marquesina y letrero (Centro PC) | hecho |
| Fuente | 1 | VOL | — | hecho |
| Banco, farola, maceta, maceta (borde izq.) | 3 + 14 + 4 + 2 | VOL | — | hecho |
| Cartel | — | **3D hecho (v2.247)** | — | hecho |
| Barril | — | **3D hecho (v2.247)** | — | hecho |
| Roca | 3 | **3D hecho (v2.246)** | — | hecho |
| Piedras | — | **3D hecho (v2.247)** | — | hecho |
| Hierba alta | — | **3D hecho (v2.247)** | — | hecho |
| Árboles (pequeño, mediano, abeto, roble) | 296 casillas «t» + 10 colocados | 3D hecho; **más grandes que una persona (v2.251)**; Fase 4 hecha (10 en el parque) | Fase 5 (cierre) | LOW |
| Espantapájaros | 1 | **3D hecho (v2.252)** | Cruz de madera, camisa mitad azul/mitad rosa, cabeza (figura con piezas) | MEDIUM |
| Vallas: corta izq., corta der., larga (9), vertical (6) | 1+1+1+2 | **3D hecho (v2.252)** | Un solo módulo paramétrico «valla» (postes + travesaños; largo variable) | MEDIUM (una vez) |
| Huerto | 1 | **3D hecho (v2.252)**, sobre el suelo horneado | Bancales con tierra y plantas (suelo elevado con relieve) | MEDIUM |
| Juncos (2 y 3) | 6 + 2 | **3D hecho (v2.251)** | Tallos y espigas en láminas cruzadas | hecho |
| Nenúfar, nenúfar con flor | 4 + 5 | **3D hecho (v2.251)** | Disco plano sobre el agua (+ flor) | hecho |
| Puente | 1 | **3D hecho (v2.252)**, sobre el suelo horneado | Tablones, vigas y barandillas | MEDIUM |

## 2 · Interiores (6 salas) — 29 objetos + 6 salas, hoy todo lámina
| Familia | Piezas | Esfuerzo |
|---|---|---|
| Mostradores | mostrador del Centro PC (con máquina), de madera, de tienda | LOW ×3 |
| Estantes | estante de madera, clínico, de laboratorio, de aventurero, de tienda | LOW ×5 (un módulo común) |
| Mesas | mesa, mesa de estudio, mesa de exhibición, mesa con dos sillas (azul y rosa) | LOW ×5 |
| Camas | cama azul (Oli), cama rosa (Lali) | LOW ×2 |
| Bancos | banco doble (azul-rosa) y (rosa-azul) | LOW ×2 |
| Máquinas | terminal de ordenador, incubadora, incubadora del laboratorio, consola de 7 cristales, consola de cristales violeta, escáner de criaturas | MEDIUM ×6 (animadas y con luz) |
| Tienda | vitrina (gema), vitrina (frasco), barril con frutas, sacos y cajas | LOW ×4 |
| Ermita | altar, altar mayor, pedestal del eco (azul y rosa) | MEDIUM ×2 + LOW ×2 |
| Planta | planta de interior | LOW |
| Salas (suelo y paredes) | Centro PC, Tienda, Laboratorio, Casa de Oli, Casa de Lali, Ermita | MEDIUM ×6 |

## 3 · Resumen por esfuerzo y orden recomendado
- **Previo (MEDIUM):** registro de objetos 3D.
- **Lote 1 (LOW, 5 piezas):** roca, piedras, hierba alta, barril, cartel (las que se ven ya fuera).
- **Lote 2 (HECHO, v2.251):** juncos, nenúfares y colocación de árboles (Fase 5 de cierre pendiente).
- **Lote 3 (HECHO, v2.252):** vallas, espantapájaros, huerto, puente.
- **Lote 4 (HECHO, v2.253-v2.257):** Tienda, Ermita y Centro PC definitivos.
- **Lotes 5-8 (interiores):** muebles LOW por familias (mostradores+estantes, mesas+camas+bancos, tienda+ermita+planta), máquinas MEDIUM, y las 6 salas MEDIUM.
- Total: ≈ 14 piezas exteriores LOW, ≈ 6 MEDIUM exteriores, ≈ 22 interiores LOW, ≈ 11 interiores MEDIUM, 1 previo MEDIUM.
