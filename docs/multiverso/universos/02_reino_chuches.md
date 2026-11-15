# REINO DE LAS CHUCHES (dimensión `chuches`)
Estados A/B/C: ver `00_comun.md`.

## 1. Identidad
Un reino de golosinas con corte, calles de azúcar y mucha pastelería. **Tono: humor y cariño**, paleta pastel muy saturada, música de caja de música y xilófono. El conflicto es amable: el reino pierde su **Receta Real** y cada región guarda un ingrediente (misión principal, B). Mensaje de diseño: es la dimensión **acogedora**, de dificultad media-baja (banda de nivel propuesta 8-22, B).
Regla de variedad: aunque el tema es dulce, en todas las zonas pueden salir criaturas de cualquier elemento (ver multiplicadores): los dulces *favorecen* criaturas por su aspecto/elemento, no las limitan.

## 2. Regiones y subregiones
| Región | Terreno | Subregiones | Pueblo / lugar clave |
|---|---|---|---|
| **Valle Algodón** | praderas de nubes de azúcar, arroyos de sirope | Prados de Nube · Ribera de Sirope | **Villa Merengue** (entrada) |
| **Bosque Gominola** | bosque de gominolas y regaliz, claros con paletas | Claros de Fruta · Espesura de Regaliz | **Gominar** (aldea) |
| **Montañas Turrón** | roca de turrón y cristal de caramelo, hornos | Pedregal de Turrón · Cueva del Cristal Dulce | **Caramelia** (ciudad-taller) |
| **Lago Cacao** | lago y ríos de chocolate, cascadas, fábrica | Orilla de Cacao · Isla del Palacio | **Palacio de Azúcar** (gimnasio/jefe) |

## 3. Mapas e interiores (catálogo)
Ids propuestos. Plantillas existentes se reutilizan con retoque temático por datos (A).
| Id | Tipo / tamaño | Región | Contenido | Estado |
|---|---|---|---|---|
| `chuches/villa_merengue` | pueblo 48×36 | Valle Algodón | Plaza con fuente de sirope, pastelería, casas, Centro PC | A (mapa) |
| `chuches/pasteleria` | interior ≈13×9 | | Tienda (reusa `sala_tienda`) | A |
| `chuches/centro_pc` | interior 13×10 | | Centro PC (reusa `sala_centro_pc`) | A |
| `chuches/casa_merengue_1/2` | interior 10×8 | | Casas (plantilla `casa`) | A |
| `chuches/camino_regaliz` | ruta h 64×32 | Valle→Bosque | Ruta con zona de aparición y 1 trainer fijo | A |
| `chuches/bosque_gominola` | ruta v 32×64 | Bosque | Claros de aparición, atajo secreto | A |
| `chuches/gominar` | pueblo 48×36 | Bosque | Aldea, casa del Barón Caramelo | A |
| `chuches/pedregal_turron` | ruta grande 64×64 | Montañas | Subida a Caramelia, pesca no | A |
| `chuches/caramelia` | pueblo 48×36 | Montañas | Taller, mercado, Centro PC pequeño | A |
| `chuches/taller_caramelo` | interior ≈13×9 | | Actividad de cocina (B) | A (mapa) · B (actividad) |
| `chuches/cueva_cristal_dulce` | cueva 48×48 | Montañas | Mazmorra: reusa bioma **cristal** de Profundidades (B: bioma por dimensión) | B/C |
| `chuches/lago_cacao` | ruta grande 64×64 | Lago | Orilla con **puntos de pesca** | A (mapa) · B (peces propios) |
| `chuches/palacio_azucar` | gimnasio 24×30 | Lago | Líder de la dimensión (esqueleto de gimnasio) | A (mapa) · B (jefe) |
| `chuches/sala_trono` | interior | Palacio | Escena final de misión | A (mapa) · C |

Total: 14 mapas, de ellos 6 interiores de plantilla.

## 4. Lugares especiales y secretos
- **Jardín de Piruletas** (secreto, en `bosque_gominola`): claro oculto con cofre de la Receta (ingrediente 1).
- **Fuente de Sirope Dorado** (Villa Merengue): decorativa; da una pista de la misión.
- **Cueva del Caramelo Eterno** (`cueva_cristal_dulce`, último piso): jefe opcional; premio raro.
- **Isla del Palacio:** solo accesible por puente que se «construye» al terminar la misión (C).

## 5. NPCs y personajes
| Personaje | Rol | Estado |
|---|---|---|
| **Reina Azucena** | Líder del Palacio de Azúcar; pide ayuda con la Receta Real | B (jefe/guion) |
| **Maestro Tarta** | Pastelero y tendero de Villa Merengue; da la misión inicial | B |
| **Abuela Regaliz** | Misiones secundarias en Gominar (ingredientes) | B |
| **Barón Caramelo** | Rival recurrente (entrenador fijo con equipo propio) | B (entrenador fijo; usa el sistema `agentes`) |
| **Cacao**, chocolatero | Comerciante de Lago Cacao (pesca/objetos) | B |
| **Gominola**, guía | Explica el reino; guarda el mapa de atajos | B |
| Entrenadores autónomos del reino | Población propia (propuesta 8-10) con nombres y frases dulces | B (población por dimensión) |

Entrenadores: reutilizar `G.agentes` tal cual; solo cambia el grafo (los 4 pueblos y rutas) y los pools de `nombres`/`frases` de la dimensión (datos). **No se reconstruye el sistema de agentes.**

## 6. Actividades, misiones y eventos
- **Misión principal «La Receta Real» (B/C):** conseguir 4 ingredientes (uno por región) y entregarlos a la Reina. Cada ingrediente se obtiene con una mini-prueba distinta (capturar una criatura concreta, pescar, superar la cueva, ganar al Barón).
- **Misiones secundarias (B):** «Entrega de pasteles» (recados entre pueblos), «Cazador de sabores» (capturar 3 elementos distintos en un claro), «Gominola perdida».
- **Evento «Día de la Golosina» (B/C):** cada N días de juego, las tiendas rebajan la Poción y suben las apariciones de criaturas raras en Valle Algodón.
- **Actividad de pesca** en Lago Cacao: usa el sistema de pesca existente (A) con peces propios (B).

## 7. Comercio, recursos y economía
- Tienda de Villa Merengue y Caramelia: los objetos del juego (A) a precio de la tabla v2.350.
- **Recursos propios (B):** «Azúcar cristal», «Cacao puro», «Esencia de nube»: materiales de misión y de venta al Nexus (requiere tipo de objeto/material nuevo).
- Peso económico: premios por combate según la tabla actual (el nivel de las criaturas de la dimensión decide cuánto vale cada combate, B). Los materiales se venden al Nexus por un valor equivalente a ≈1 combate de su banda.

## 8. Criaturas: probabilidades por ubicación
Las bandas de rareza base (común 60 / rara 28 / épica 10) cambian a **62 / 28 / 10**. Multiplicadores (B: necesitan la tabla de aparición por zona):
| Zona | ×3 | ×2 | ×0,5 | 0 |
|---|---|---|---|---|
| Prados de Nube (Valle Algodón) | nubecin, dandel | pompon, setin | forjel, lunabu | — |
| Ribera de Sirope | pompon | perlel, caracolin | ferrel, arenel | — |
| Claros de Fruta (Bosque) | setin | aguacato, cactel | cuarzin | — |
| Espesura de Regaliz (Bosque) | somnin | lunabu, setin | nubecin | — |
| Pedregal de Turrón (Montañas) | arenel, ferrel | cuarzin, fosforin | pompon | — |
| Cueva del Cristal Dulce | cuarzin | pilita, arcel, forjel | pompon | — |
| Orilla de Cacao (Lago) | pompon | perlel, caracolin, zumbel | cenel | — |
| Fábrica de Cacao (zona opcional) | fosforin, cenel | forjel, zumbel | nubecin | — |
Lo no nombrado es ×1: **cualquier línea sigue pudiendo salir en cualquier zona**. Guarida: ninguna nueva (Zefirax sigue en Albanota).
**Huecos de diseño futuros (opcionales):** 2 líneas nuevas de aire y roca de aspecto «golosina» (comunes) para variar la fauna; ver proceso de fichas.
