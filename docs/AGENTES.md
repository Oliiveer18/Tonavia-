# AGENTES · entrenadores NPC autónomos (v2.324 · trato y red v2.325)

Motor compartido de agentes: una población de entrenadores que vive en el mundo de Tonavia con o sin jugador delante. Solo 2D. Sin IA externa: todo es determinista y sale de la semilla.

## 1. Idea en cinco líneas
1. **Simulación por eventos, no por cuadros.** Cada entrenador duerme hasta su próxima decisión; una cola de prioridad los despierta. El coste depende de lo que *pasa*, no de cuántos son ni de los cuadros.
2. **El mundo es el grafo de `datos/mundo.json`** (8 pueblos y 7 rutas). Un mapa sin dibujar existe igual para ellos, con tiempos nominales según su tamaño.
3. **Un entrenador tiene la forma de datos de un jugador** (`equipo`, `prog`, `vida`, `brillos`, `mochila`, `esferas`): se le aplican `G.nivel`, `G.tienda`, `G.pesca` y `G.combate` tal cual. Mismas reglas, mismos precios, misma fórmula de captura.
4. **Los combates son procesos** con el motor real (`G.combate`), un paso por tick: coste repartido, repetibles con su semilla (un servidor podría validarlos).
5. **El cuerpo es una proyección pura** del estado (posición = f(paso, tiempo)): no hay nada que simular por cuadro ni que sincronizar; solo se calcula para quien está en el mapa que se pinta.

## 2. Piezas
| Archivo | Qué hace |
|---|---|
| `datos/agentes.json` | Todo lo ajustable: población, duraciones, ambiciones (meta, hitos, pesos), nombres, frases. |
| `src/agentes.js` | Núcleo: azar por entrenador, grafo del mundo, cola de eventos, tick, guardado con versión, huella y diagnóstico. Gancho en `motor.moverCriaturas`. |
| `src/agentes_mente.js` | Memoria, relaciones, ambición, objetivos por utilidad, planificador de metas, encuentros y el ciclo `despertar`. |
| `src/agentes_acciones.js` | Acciones (`OPS` para planificar, `ACC` para ejecutar) y combates (salvajes y duelos) con sus consecuencias. |
| `src/agentes_cuerpo.js` | Cuerpo en mapas reales (puntos de interés, caminos BFS), sprites y la orden `hablar`. |
| `tools/agentes_diag.js` | Diagnóstico sin gráficos (una línea, resumen, crónica, ficha, rendimiento). |
| `tools/prueba_agentes.py` | Prueba en Chromium móvil. |

Estado: `est.agentes = { v, sem, n, acc, deuda, sb, pob, bat, cron, cont }` (JSON puro). Lo que no se guarda (cola, índice por lugar, combates en memoria) se reconstruye del estado; un combate a medias se repite desde su semilla hasta el tick actual.

## 3. La mente de un entrenador
- **Identidad:** nombre, pueblo natal, aspecto, 6 rasgos de 0 a 1 (`comp` competitivo, `soc` sociable, `val` valiente, `cur` curioso, `ten` tenaz, `gen` generoso).
- **Ambición (largo plazo):** campeón (prestigio), coleccionista (especies), explorador (mapas), criador (nivel), mercader (Brillos). Cada una tiene hitos. Al cumplirla entera, o si la frustración supera su aguante (`crisis × (0,5 + ten)`), **cambia de sueño** según su carácter.
- **Objetivos (corto plazo):** sanar, abastecer, capturar, entrenar, retar, explorar, comerciar, socializar, descansar. Utilidad = necesidad × peso de la ambición × carácter × saciedad (lo recién hecho apetece menos) − distancia − miedo al lugar.
- **Plan:** búsqueda de coste uniforme sobre un estado simbólico (`lugar, Brillos, pescado, esferas, pociones, salud, contador`) con las acciones de `OPS`. Ejemplo real: sin Brillos y herido en una ruta → `ir a Albanota · pescar · vender · curar`; con Brillos → `ir · curar`.
- **Cuando algo falla** (no le llega para la cura, el rival ya no está, pierde un combate) el plan se tira y se replantea; al segundo tropiezo abandona ese objetivo un rato (veto) y lo recuerda.
- **Memoria:** hasta 24 recuerdos `[t, tipo, quién, lugar, valencia, importancia]`; se olvida lo menos saliente (importancia × olvido exponencial). Se usa para decidir: evita la ruta donde cayó su equipo, busca la revancha con quien le ganó, y al hablar cuenta lo que recuerda.
- **Relaciones:** por cada conocido, afinidad (−100…100), respeto, duelos y dónde lo vio por última vez (para ir a buscarlo: puede no encontrarlo). De ahí salen `amigo`, `aliado`, `rival`, `enemigo`. Consecuencias: un amigo paga la cura o regala una poción; los rivales se retan al verse; al charlar se pasan avisos de sitios peligrosos y el rencor hacia quien venció a un amigo.
- **Jugador:** al hablarle se presenta, dice lo que está haciendo de verdad y recuerda al jugador (`rel['j:<id>']`).

## 4. Niveles de actividad (rendimiento)
| Nivel | Quién | Coste |
|---|---|---|
| Dormido | Todos, casi siempre | 0 por cuadro (una entrada en la cola) |
| En combate | Los que pelean | 1 paso del motor por tick (≈2 µs) |
| Con cuerpo | Los del mapa que se pinta y caben en pantalla | Una interpolación al pintar |

Medido (`node tools/agentes_diag.js --rendimiento`, ms por cuadro a 60/s): 25 → 0,011 · 100 → 0,025 · 400 → 0,11 · 1600 → 0,50. En Chromium con 24: 0,013 ms. Topes: `eventosPorTick` (48) y `ticksDeudaPorCuadro` (8) evitan tirones.

## 5. Normas «listo para online»
Estado en `est`, serializable y con versión; motor puro y determinista (el resultado no depende de los cuadros por segundo); sin `Math.random` ni relojes de pared (la única entrada de reloj es `ponerAlDia`, que la pone la interfaz al cargar); no usa `est.rnd` (el resto del juego no cambia ni un número: comprobado); jugadores por id; contenido como datos; `G.agentes.hash(est)` da la huella del estado para comparar dos móviles o un servidor.

## 6. Ampliar
- **Ajustar:** `datos/agentes.json` (población, duraciones, hitos, pesos, frases).
- **Acción nueva:** una entrada en `OPS`, otra en `ACC` y su nombre en `USA[objetivo]` (`agentes_acciones.js`).
- **Objetivo nuevo:** su utilidad en `candidatos` y su meta en `META` (`agentes_mente.js`).
- **Ambición nueva:** solo datos (si usa una medida nueva, añadirla a `METRICA`).
- **Diagnóstico en el navegador:** `G.agentes.resumen(__juego.est)`, `G.agentes.ficha(__juego.est, 'Olaya')`, `G.agentes.cronica(__juego.est, 30)`. Apagar: `?agentes=0`.

## 7. Límites conocidos (v2.326)
- **Interiores (v2.326):** quien «entra» al Centro PC o a la tienda se ve dentro: entra por la puerta, va a un sitio de espera frente al mostrador (`infoDentro`: 8 casillas libres delante del empleado), espera y sale. Se le puede hablar y retar allí (`par[i].m` = mapa interior). Solo Centro PC y tienda (los únicos edificios a los que van); las casas y la ermita siguen vacías.
- **Salidas (v2.326):** un entrenador solo «sale» de un mapa dibujado por una puerta que el jugador también puede cruzar (la que lleva hacia ese vecino por el grafo; hoy las de Carbuna). Si el vecino no existe aún, sale por la puerta del Centro PC (o la primera de edificio) y reaparece en ella. Nunca por el borde cerrado.
- **Duelos sin tiempo (v2.326):** `G.combate.nuevo(..., { duelo: true })` quita la victoria por tiempo; solo un tope de 30 min acaba en tablas.
- **Reacción (v2.326):** al acabar un duelo (con jugador o entre entrenadores) el entrenador se queda quieto `ajustes.trato.reaccion` s (4) mostrando «!» (ganó) o «…» (perdió) antes de seguir. `a.rea = [fin, 'g'|'p', ini]`.
- **Aspecto provisional:** Oli o Lali recoloreados. No bloquean el paso. Solo 2D (el HD-2D no los dibuja).
- **Sus combates entre ellos no se ven:** el nombre sale en dorado mientras están en duelo, nada más.
- **Dos móviles:** manda Oli (el que crea la sala). Probado con un PeerJS falso (test.js); falta probarlo con dos móviles de verdad. El combate del invitado se juega en su móvil.
- **Gimnasios, evolución e intercambios** no existen aún como sistemas del juego: los entrenadores no los usan.
- **Solo Albanota y Marenda tienen pesca**, así que Albanota hace de centro económico (unos 12-15 a la vista). Ya no se apilan en la misma casilla (0,6 parejas pisándose de media; antes 5,6).
- **Guardado:** ≈2,7 KB por entrenador (65 KB con 24).
- `est.reloj` (día y noche) no avanza en el bucle real del juego: sin rutinas por hora. No se ha tocado (encenderlo cambia cómo se ve el juego: decisión del autor).

## 8. Trato con el jugador (v2.325 · `src/agentes_trato.js`)
- **Hablar:** `{t:'hablar'}` junto a un entrenador devuelve `guion` (datos para `dialogo_ui.js`): Charlar · Su equipo · Retar a un duelo. `game.js` lo abre en la caja de diálogo.
- **Pausa:** mientras se le habla queda quieto mirando al jugador (`est.agentes.par[i]`); al cerrar (`hablar_fin`), alejarse 3,5 casillas o pasar 40 s sigue su camino con el plan desplazado.
- **Duelo:** `{t:'retar', ag}` abre `est.combate` con `duelo:{ag,nom}`: equipo sano del jugador (relevos `j_<id>_<n>`) contra el suyo. Al acabar: vida, XP, Brillos (paga el que pierde), prestigio, recuerdo y relación. No acepta si está herido, en otro duelo o hace menos de 90 s del último.
- Ajustes en `datos/agentes.json` → `ajustes.trato`; frases `reto_*`, `adios`, `mas`.

## 9. Dos móviles (v2.325 · `src/agentes_red.js`)
- El anfitrión envía la población entera cada `ajustes.red.cada` s (`{k:'ag'}`); el invitado la adopta con la validación del guardado y sigue simulando entre envíos.
- Lo que el invitado habla, reta o gana viaja como `{k:'ago'}` y el anfitrión lo repite validado (`A.trato.remoto`). Transporte: `src/red_peer.js`.

## 10. Una población por dimensión (v2.358 · Multiverso F7)
- Tonavia: `est.agentes`, `datos/agentes.json` y `datos/mundo.json`, como siempre. Otra dimensión: `est.dim[id].agentes` con su grafo, pools y fijos (clave `entrenadores` del esquema v3). Contrato y reglas: `docs/multiverso/14_ENTRENADORES_F7.md`.
- Resolver la población: `A.de(est, dim)` (existente, validada) · `A.asegurar(est, dim)` (la crea). El grafo: `A.W(dim)` o `A.Wn(idDeNodo)` (por el prefijo del lugar). Frases: `A.frases(ag)`.
- Solo avanzan las dimensiones con un jugador dentro; las dormidas se ponen al día al volver (`est.reloj − ag.rel` + `ag.deuda`, tope `alDiaMax`).
- Regla de oro de la caché de casillas (`agentes_cuerpo.js`): **la clave debe llevar todo lo que decide el valor**. Con `i%6`/`i%24` el resultado dependía de quién llegaba primero y la simulación dejaba de ser reproducible (era la causa del test intermitente).
