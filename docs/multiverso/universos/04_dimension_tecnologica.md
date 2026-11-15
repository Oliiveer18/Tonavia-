# DIMENSIÓN TECNOLÓGICA (dimensión `tecno`)
Estados A/B/C: ver `00_comun.md`.

## 1. Identidad
Una ciudad-circuito que nunca duerme: neón, cables, torres y fábricas autónomas. **Tono: retrofuturista y optimista** (no distópico), paleta fría con acentos neón, música electrónica de chiptune y sintetizador. Todo se mueve por «pulsos»: la dimensión tiene un ritmo propio (eventos periódicos, B). Es la dimensión **más difícil y de combate** (banda de nivel propuesta 22-42, B), pensada para el final del recorrido.
Regla de variedad: las criaturas eléctricas y de roca/fuego dominan por aspecto, pero cualquier línea puede aparecer; el diseño usa multiplicadores, no filtros (ver §8).

## 2. Regiones y subregiones
| Región | Terreno | Subregiones | Lugar clave |
|---|---|---|---|
| **Ciudad Circuito** | calles de neón, plazas con pantallas | Distrito Central · Barrio de las Antenas | **Nodo Central** (entrada) |
| **Fábrica Hueca** | complejos industriales, cintas, hornos | Línea de Montaje · Foso de Fundición | **Planta Madre** (jefe) |
| **Campo de Cables** | llanuras con torres y generadores | Pradera Eléctrica · Cementerio de Chatarra | **Estación Relé** |
| **Núcleo** | interior del servidor, pasillos de datos | Sala de Servidores · Corazón Cuántico | **Torre Núcleo** (final) |

## 3. Mapas e interiores (catálogo)
| Id propuesto | Tipo / tamaño | Región | Contenido | Estado |
|---|---|---|---|---|
| `tecno/nodo_central` | pueblo 48×36 | Ciudad | Plaza con pantallas, Centro PC, tienda, laboratorio | A (mapa) |
| `tecno/centro_pc` | interior 13×10 | | Centro PC | A |
| `tecno/tienda_modulos` | interior ≈13×9 | | Tienda (`sala_tienda` retocada) | A |
| `tecno/laboratorio_i` | interior 13×9 | | Reusa plantilla `sala_laboratorio` (crianza/incubadora) | A |
| `tecno/barrio_antenas` | pueblo 48×36 | Ciudad | Antenas, azoteas, casas de plantilla | A |
| `tecno/calle_neon` | ruta h 64×32 | Ciudad→Fábrica | Ruta con zonas | A |
| `tecno/linea_montaje` | ruta grande 64×64 | Fábrica | Cintas, zonas de aparición | A |
| `tecno/foso_fundicion` | cueva 48×48 | Fábrica | Mazmorra: bioma **lava**/**mina** (B) | B/C |
| `tecno/planta_madre` | gimnasio 24×30 | Fábrica | Jefe de la dimensión (esqueleto de gimnasio) | A (mapa) · B (jefe) |
| `tecno/pradera_electrica` | ruta v 32×64 | Campo | Torres, descargas visuales | A |
| `tecno/cementerio_chatarra` | ruta grande 64×64 | Campo | Zona de chatarra, secreto | A |
| `tecno/estacion_rele` | pueblo 36×26 | Campo | Estación, Centro PC | A |
| `tecno/sala_servidores` | cueva 40×40 | Núcleo | Mazmorra de puzles (reusa motor de puzles de Profundidades) | B/C |
| `tecno/torre_nucleo` | cumbre 48×48 | Núcleo | Escena final | A (mapa) · C |

Total: 14 mapas, 4 interiores de plantilla.

## 4. Lugares especiales y secretos
- **Terminal Olvidada** (Cementerio de Chatarra): consola antigua que da una pista (cofre, B).
- **Sala de Servidores:** puzles de interruptores para dos jugadores (reutiliza el resolutor de puzles de `profundidades.js`: B).
- **Corazón Cuántico:** punto final; premio del jefe.
- **Sótano de la fábrica:** zona secreta donde se «fabrican» criaturas de práctica (sin dar progreso) — entrenamiento opcional (C).

## 5. NPCs
| Personaje | Rol | Estado |
|---|---|---|
| **Ingeniera Orsa** | Jefa de la Planta Madre; misión principal | B |
| **Dr. Volta** | Científico del laboratorio: misiones de investigación | B |
| **Byte**, mecánico | Tendero y reparador (curación de equipo con descuento) | B |
| **Kira**, hacker | Rival recurrente (entrenador fijo) | B |
| **Operador Cero** | Guarda del Núcleo; requisito de acceso | B |
| Entrenadores autónomos | Población propia 10-14 (ingenieros, repartidores, hackers): rasgos competitivos/curiosos | B |

## 6. Actividades, misiones y eventos
- **Misión principal «Restaurar el Núcleo» (B/C):** apagar 3 generadores desbocados (uno por región) y acceder al Núcleo. Cada generador tiene un puzle o jefe breve.
- **Misiones secundarias (B):** «Reparto de piezas», «Barrido de chatarra» (recolectar), «Cableado» (puzle).
- **Evento «Pico de carga» (B/C):** cada N días el Campo de Cables se llena de electricidad: más apariciones eléctricas y raras, pero los combates dan menos tiempo (solo si el motor lo permite; si no, simplemente más apariciones).
- **Torneo de Circuito (C):** combates seguidos contra entrenadores de la dimensión; premio en materiales.

## 7. Comercio, recursos y economía
- Tienda de módulos con objetos del juego (A) al precio de la tabla v2.350.
- **Recursos (B):** «Chip», «Cable fino», «Pila»: materiales de misión y de venta al Nexus; sirven más adelante para mejoras (no se define aquí).
- Es la dimensión de **premios más altos** por combate (nivel alto), por lo que sus precios de objetos deben seguir la regla de «x combates» (v2.350) sin regalar.
- Ingreso secundario: reciclaje de chatarra (vender «curiosidades» al Nexus).

## 8. Criaturas: probabilidades por ubicación
Pesos de rareza propuestos: **55 / 30 / 12** (más épicas). Multiplicadores (B):
| Zona | ×3 | ×2 | ×0,5 | 0 |
|---|---|---|---|---|
| Distrito Central | zumbel | pilita, arcel, ferrel | pompon | — |
| Barrio de las Antenas | nubecin, zumbel | dandel, pilita | cenel | — |
| Línea de Montaje | ferrel, zumbel | forjel, cuarzin, arcel | setin | — |
| Foso de Fundición | fosforin, cenel | forjel, ferrel | pompon, setin | — |
| Pradera Eléctrica | zumbel, pilita | arcel, nubecin | aguacato | — |
| Cementerio de Chatarra | ferrel, arenel | somnin, forjel | pompon | — |
| Sala de Servidores | arcel, pilita | somnin, lunabu | fosforin | — |
| Corazón Cuántico | arcel | zumbel, lunabu, forjel | setin | — |
Lo no nombrado es ×1. **Huecos de diseño futuros (opcionales):** 2 líneas «máquina» (eléctrico/roca) y 1 de sombra «virus» para distinguir la dimensión.
