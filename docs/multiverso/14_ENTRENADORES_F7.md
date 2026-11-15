# F7 · Entrenadores por dimensión (contrato v2.358)
Qué ofrece el motor de entrenadores autónomos a las dimensiones. **Tonavia no cambia**: sigue con `datos/agentes.json` + `datos/mundo.json`, su población en `est.agentes` y su guardado en `dim.tonavia.agentes` (huellas 2D/clásico iguales). Ninguna dimensión real declara entrenadores todavía (no hay contenido): todo está probado con dimensiones de prueba.

## 1. Datos: clave `entrenadores` (esquema de dimensión **v3**)
Con `"v": 3` una dimensión (que no sea `tonavia`) admite `entrenadores`; con `v` < 3 se rechaza («exige v ≥ 3»). Todo es opcional salvo el grafo si hay entrenadores.
```
"entrenadores": {
  "poblacion": 12,                              // autónomos 0..48 (por encima de los fijos)
  "grafo": {                                    // MISMO formato que datos/mundo.json, con ids «<dim>/<mapa>»
    "regiones": { "<región>": { "nombre": "Bahía", "elemento": "agua" } },   // la región debe estar en «regiones» de la dimensión
    "mapas": [ { "id": "chuches/villa", "tipo": "pueblo|ruta|interior", "region": "…", "ancho": 48, "alto": 36,
                 "conexiones": { "este": "chuches/ruta_1" },                  // lados norte|sur|este|oeste → otro mapa del grafo
                 "puertas": [ { "id": "centro_pc", "destino": "chuches/centro" } ],   // servicios: «centro_pc» = cura · «tienda» = compra/vende
                 "pesca": true } ] },                                          // opcional: fuerza o niega la pesca (por defecto: la región es de agua)
  "nombres": ["…"],                             // pool propio (≤ 200; sin él, el de datos/agentes.json)
  "frases": { "descansar": ["…"] },             // se suman a las globales; la clave debe existir en datos/agentes.json › frases
  "ambiciones": { "campeon": 3, "mercader": 0 },// peso 0..10 al elegir ambición (por defecto 1; 0 = excluida; no todas a 0)
  "fijos": [ { "nombre": "Capitán Pólvora", "casa": "pirata/puerto", "equipo": [ { "forma": "pompon", "nivel": 9 } ],
               "ambicion": "campeon", "aspecto": 3, "brillos": 120 } ]   // hasta 16
}
```
Validación (`G.dimensiones.validar`): ids con el prefijo de la dimensión y sin repetir; conexiones a mapas del grafo; **todo pueblo/ruta alcanzable desde todo pueblo/ruta** (el planificador necesita distancias finitas); al menos un pueblo si hay entrenadores; nombres de fijos que no estén en ningún pool; formas, ambiciones y aspectos que existan. `G.dimensiones.entrenadores(id)` devuelve la definición **congelada y compartida** (o `null`).
- Tonavia **no admite** la clave (conserva sus datos de siempre). El Nexus y Tonavia no declaran nada.
- Un entrenador fijo nace con nombre, casa, equipo (con nivel), ambición, aspecto y Brillos prefijados; el resto (carácter, memoria, relaciones) nace como el de cualquiera y **evoluciona igual** (sube de nivel, cambia de equipo). «Fijo» = punto de partida fijo y presencia segura desde el primer día, no inmutable.

## 2. Estado: una población por dimensión
- Tonavia: `est.agentes` (sin cambios). Otra dimensión: `est.dim[id].agentes` (misma forma, más `dim` y `rel`). Al estar dentro de `est.dim`, **viaja en el guardado sin tocar `guardado.js`**: `dim.<id>.agentes`.
- Nace la primera vez que hay un jugador dentro y la dimensión define entrenadores (`G.agentes.asegurar(est, dim)`); semilla = semilla del mundo ⊕ hash del id de la dimensión; luego conserva SU semilla (`ag.sem`), como la de Tonavia.
- Validación **perezosa** (`G.agentes.de(est, dim)`): una población rota (lugar fuera de su grafo, versión futura, `dim` que no coincide, sin `rel`…) se descarta entera y vuelve a nacer, sin tocar el resto de la sección. **Si el juego no define la dimensión, la sección se deja intacta** (guardar no la borra).
- Cada módulo de `agentes_*` resuelve el grafo por el prefijo del lugar (`A.Wn(nodo)`, `A.W(dim)`), así que una población no puede ver el grafo de otra.

## 3. Quién avanza y la puesta al día
- **Tonavia se simula siempre**, como hasta ahora. Una dimensión solo **mientras tenga algún jugador dentro** (por el prefijo de `j.mapa`; orden alfabético = reproducible).
- Las dormidas no avanzan. Al volver a tener a alguien dentro se les paga **de golpe** `est.reloj − ag.rel` (lo que pasó) + `ag.deuda` (lo que el juego estuvo cerrado; `ponerAlDia` lo anota en cada dimensión con población y Tonavia lo paga al cargar), con el tope `ajustes.alDiaMax` (1800 s). Solo depende del estado: dos clientes con el mismo `est` dan lo mismo. Coste medido (PC): 0,4 s (8 autónomos) a 0,9 s (48) por cada puesta al día de 1800 s; **sin medir en iPhone**.
- La hora que ven al ponerse al día es la actual (`est.reloj`), no la de entonces: es una aproximación aceptada (la puesta al día no reproduce el día/noche pasado).

## 4. Economía y nivel (F6 → autónomos)
Un autónomo usa los ajustes de **su lugar** (`G.agentes.nodoDe(a)` → `G.dimensiones.ajustesDe`): sus victorias contra salvajes pagan `premioDe` (× `premios`), curarse y comprar cuestan × `precios`, y los salvajes que enfrenta suben su nivel con `nivel` (tope 50). Los duelos entre autónomos y contra jugadores no se escalan; `precioVenta` tampoco. En Tonavia (sin ajustes) nada cambia.

## 5. Trato con el jugador
`G.vista.agentes(est, mapaId)`, hablar, retar y el final del duelo trabajan con la población de la dimensión del mapa del jugador (`k.duelo.dim` se anota si no es Tonavia). Los cuerpos se ven en mapas **dibujados** de la dimensión (los servicios y los tiempos de camino usan el mapa si está cargado: una dimensión activa tiene sus mapas cargados por F4).

## 6. Fuera de F7 (queda anotado)
Red: `agentes_red.js` sigue sincronizando solo la población de Tonavia; las poblaciones de dimensión del anfitrión y del invitado no se sincronizan hasta **F8** (campo `dim` en el mensaje) · tablón: solo anuncia a los de Tonavia · tiempos de camino en una dimensión descargada son nominales (si el mapa dibujado cambia entre clientes, también cambia la simulación: F8 debe exigir que ambos tengan la dimensión cargada) · límites de tamaño de `est.dim` (≈ 160 KB por 48 autónomos tras 30 min; F8) · contenido real (Sonnet): nombres, frases, fijos como Capitán Pólvora o Ren.

## 7. Causa del test intermitente de agentes (v2.324 «simulación larga»)
**Reproducido** (1 de 14 ejecuciones secuenciales de `test.js`) y **explicado**: no era azar. `agentes_cuerpo.js › casilla()` cacheaba por `poi#(i%6)` / `poi#(i%24)` pero el valor dependía del índice entero (`sa[i % sa.length]`, `plaza()`, `z`), y el primero que lo pedía fijaba el resultado para todos de su clase. Como el juego de prueba (`game.js`, semilla = `Date.now()`) simula **otra población** en el mismo proceso, el orden de peticiones cambiaba de una ejecución a otra → tiempos de camino distintos → simulación distinta. Con `Date.now` congelado desaparecía; aislado era determinista. En el juego real afectaba a la repetibilidad (misma partida cargada ≠ misma continuación) y al futuro modo en red. **Arreglo:** la clave lleva el índice completo. Efecto aceptado y justificado: la huella de `agentes_diag` cambia (15f00763 → 470ee914); las huellas del dibujo (2D/clásico) no. Prueba nueva: «F7 causa del intermitente» (falla con el código antiguo, pasa con el nuevo).
