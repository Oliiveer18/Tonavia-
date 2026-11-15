# MUNDO SALVAJE (dimensión `salvaje`)
Estados A/B/C: ver `00_comun.md`.

## 1. Identidad
La dimensión de **la naturaleza sin domar**: selvas, pantanos, sabana, cañones y un gran río. Pocos pueblos, mucha ruta, **más criaturas y más raras**. Tono: aventura y exploración; música orgánica (percusión, flautas), luz cambiante con el ciclo día/noche (aquí el ciclo importa: unas criaturas solo de noche, B). Es la dimensión **de captura y exploración** (banda de nivel propuesta 12-30, B). Pensada para jugadores que quieren completar la colección.

## 2. Regiones y subregiones
| Región | Terreno | Subregiones | Lugar clave |
|---|---|---|---|
| **Selva Umbral** | selva densa, lianas, claros | Dosel Alto · Sotobosque | **Campamento Raíz** (entrada) |
| **Pantano Brumoso** | ciénaga, nenúfares, niebla | Juncal · Isla del Sapo | **Aldea Palafito** |
| **Sabana Dorada** | llanura, acacias, manadas | Pastizal · Cráter Seco | **Puesto del Mirador** |
| **Gran Cañón** | cañón, río y cascadas | Garganta · Meseta del Eco | **Refugio de la Garganta** |

Cada región tiene un clima visual propio (luz y tema de terreno; el motor de terrenos actual solo tiene el tema de Carbuna, el resto se crea como contenido del compositor, A).

## 3. Mapas e interiores (catálogo)
| Id propuesto | Tipo / tamaño | Región | Contenido | Estado |
|---|---|---|---|---|
| `salvaje/campamento_raiz` | pueblo 48×36 | Selva | Campamento: tienda de campaña, Centro PC, hoguera | A (mapa) |
| `salvaje/tienda_campo` | interior | | Tienda (plantilla `sala_tienda`) | A |
| `salvaje/centro_pc` | interior 13×10 | | Centro PC | A |
| `salvaje/ruta_dosel` | ruta v 32×64 | Selva | Puentes de lianas, zonas altas | A |
| `salvaje/ruta_sotobosque` | ruta h 64×32 | Selva | Zonas de sombra | A |
| `salvaje/aldea_palafito` | pueblo 48×36 | Pantano | Casas sobre pilotes, puentes (`puente_albanota` como base) | A |
| `salvaje/juncal` | ruta grande 64×64 | Pantano | Pesca, nenúfares (`nenufar`, `juncos`) | A |
| `salvaje/ruta_sabana` | ruta h 64×32 | Sabana | Manadas, zonas amplias | A |
| `salvaje/puesto_mirador` | pueblo 36×26 | Sabana | Torre de vigía, tienda | A |
| `salvaje/crater_seco` | cueva/cumbre 48×48 | Sabana | Mazmorra: bioma **mina**/**lava** (B: bioma por dimensión) | B/C |
| `salvaje/garganta` | ruta grande 64×64 | Cañón | Río, cascadas, pesca honda | A (mapa) · B (peces) |
| `salvaje/refugio_garganta` | pueblo 36×26 | Cañón | Refugio, Centro PC | A |
| `salvaje/meseta_eco` | cumbre 48×48 | Cañón | Guarida del jefe (B) | A (mapa) · B |
| `salvaje/cueva_hongos` | cueva 40×40 | Selva | Mazmorra: bioma **hongos** (B) | B/C |

Total: 14 mapas, 2 interiores de plantilla.

## 4. Lugares especiales y secretos
- **Árbol Hueco** (Selva, secreto): interior pequeño con cofre y NPC ermitaño.
- **Isla del Sapo** (Pantano): solo accesible por nenúfares/puente oculto; guarda una criatura épica fija (guarida de una línea ya existente, p. ej. lunabu: B).
- **Cráter Seco** (Sabana): mazmorra con piso especial de jefe.
- **Meseta del Eco:** mirador que muestra la estrella de la dimensión; escena final.

## 5. NPCs
| Personaje | Rol | Estado |
|---|---|---|
| **Guardabosques Aldo** | Guía y misión inicial («censo de criaturas») | B |
| **Lorena, bióloga** | Misiones de captura y registro (entrega fichas de criaturas nuevas) | B |
| **Tito, el balsero** | Transporte por el río (atajo entre Pantano y Cañón) | C (transporte) |
| **Ermitaño del Árbol Hueco** | Secreto con recompensa | B |
| **Líder: Zura, domadora** | Jefa de la dimensión (meseta del Eco) | B |
| Entrenadores autónomos | Población propia 8-12 (naturalistas, pescadores, cazadores): rasgos más curiosos/valientes | B |

## 6. Actividades, misiones y eventos
- **Misión principal «Censo Salvaje» (B/C):** registrar N criaturas distintas en cada región (usa el registro de capturas que ya guarda `j.capturas`/colección; el criterio exacto lo define Fable/Sonnet después). Premio final: acceso a la Meseta del Eco.
- **Rutas de pesca** (A + B): peces propios por región; usa el sistema existente.
- **Evento «Migración» (B/C):** durante un par de días de juego aparecen manadas (zonas con más huecos) en la Sabana.
- **Eventos nocturnos (B):** unas apariciones solo de noche (condición por `G.ciclo`).
- **Caza fotográfica (opcional, C):** actividad sin combate.

## 7. Comercio, recursos y economía
- Tiendas de campo con los objetos del juego (A): sin cambios de precio salvo el factor de dimensión (B).
- **Recursos (B):** «Fibra de selva», «Hueso de sabana», «Cristal de cañón»: materiales de misión y de venta al Nexus.
- **Pesca:** ruta de ingresos secundaria; recordar el factor v2.350 por profundidad (el motor de peces aún no distingue dimensión: B).
- Pocas tiendas a propósito: la dimensión empuja a usar Pociones propias y esferas.

## 8. Criaturas: probabilidades por ubicación
Pesos de rareza propuestos: **50 / 32 / 14** (más raras). Multiplicadores (B):
| Zona | ×3 | ×2 | ×0,5 | 0 |
|---|---|---|---|---|
| Dosel Alto | nubecin, dandel | aguacato, zumbel | arenel | — |
| Sotobosque (noche ×2 más) | setin | somnin, lunabu, cactel | pilita | — |
| Juncal (Pantano) | pompon, caracolin | perlel, somnin | fosforin, cenel | — |
| Isla del Sapo | — | lunabu (guarida), perlel | — | — |
| Pastizal (Sabana) | dandel, arenel | cactel, ferrel, zumbel | pompon | — |
| Cráter Seco | fosforin, cenel | forjel, cuarzin | pompon, nubecin | — |
| Garganta | pompon | perlel, cuarzin, nubecin | cenel | — |
| Meseta del Eco | cuarzin | arcel, pilita, forjel | setin | — |
Lo no nombrado es ×1. **Huecos de diseño futuros (opcionales):** 3 líneas de fauna (felino de sabana, anfibio de pantano, ave del cañón) para la colección.
