# 23 · Santuario: interior de la cabaña (Etapa B, bloque 5, v2.369)

**Principio:** un lugar para estar y para consultar. No cura (eso es de la Doctora), no entrena, no da Brillos ni vivencias, no añade monedas ni inventarios. Todo lo que se puede usar reutiliza el panel de Residentes y lee el estado que ya existe.

## Contrato
- Datos: `datos/santuario.json` → `cabana` (sala 11×8 `sala_cabana`, tema `casa`, puerta, entrada, Lirio, camas por jugador, muebles). El validador comprueba que cada pieza cabe, que no se pisan y que **todo el suelo libre se recorre desde la entrada**.
- Id: `santuario/cabana_<jugador>`. **No lleva** nivel, hábitats, instalaciones ni decoración: no cambia al decorar, construir ni ampliar, así que el panel funciona dentro y nunca te echa. Mapa 100 % determinista (mismo id, mismo mapa).
- Hogar: puerta `cabana` en el eje de la fachada (casilla libre de la huella de la casa, fila 6) y ancla `cabana` (fila 7) donde apareces al salir. Todos los niveles. Los ids del hogar no cambian.
- Entrar: puerta `cabana` del hogar → cabaña (aviso «<nombre> · La cabaña»). Salir: puerta `salida` de la cabaña → **el hogar ACTUAL** del jugador (si decoraste o ampliaste dentro, sales al hogar nuevo). Ganchos en `motor.cruzar` (mismo patrón que el resto del módulo). `j.volver` no se toca.
- Órdenes `santuario.*` (acoger, construir, decorar, ampliar, nombrar…) valen dentro de la cabaña (`propio` reconoce el id). `recolocar` no mueve al jugador dentro; el hogar se rehace al salir. `alCambiar` actualiza el hogar aunque esté en memoria.
- Combate: igual que en el hogar, no hay.

## Qué hay dentro
| Pieza | Uso |
|---|---|
| **Archivera Lirio** (NPC `archivera`, alcance 2,1) | Abre el mismo panel de Residentes que Brezo (gancho en `game.js`: `npc === 'cuidador' \|\| 'archivera'`) y habla de la cabaña. |
| **Estante → Libro del Santuario** | Lectura: nombre, nivel, residentes, vivencias, techo, instalaciones (con su origen) y decoración. |
| **Vitrina → Aportes** | Lectura: lo que han traído otras dimensiones (instalaciones, hábitats, piezas): construido / disponible / lo que falta. |
| Cama (azul Oli, rosa Lali), mostrador, mesa con sillas, plantas | Ambiente. |
Las lecturas son puras (`G.santuario.lectura`), solo leen; la interfaz las muestra en el panel (`G.santuarioUI.leer`). Un solo gancho en `game.js talk()`.

## Decisiones técnicas
- Brezo sigue fuera y Lirio dentro (un NPC por mapa, sin duplicar el mismo personaje).
- Las lecturas van en el panel y no en el rótulo `#who` (es de una línea y se trunca en móvil).
- La sala es un objeto de catálogo (`sala_cabana`, 78 objetos): registrada en la paleta del editor.
- Solo 2D y clásico (HD-2D no aplica en el Santuario; comprobado dentro de la cabaña).

## Limitaciones
- Una sola distribución para todos los niveles (no crece con el Santuario); solo la cama cambia con el jugador.
- La decoración del exterior no se refleja dentro.
- Las residentes no entran en la cabaña.
- Solo el dueño entra (las visitas son el bloque 6).

## Verificación
`prueba_santuario.js` §26-29 (validador, generador y puerta en 5 niveles, entrar/salir/decorar/ampliar dentro, muebles sin cambiar el estado, guardado dentro) y `prueba_santuario.py` (2D y clásico; capturas `santuario_v2369_*`).
