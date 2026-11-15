# 16 · F8 — Red de poblaciones, límites de guardado escalables, requisitos de portal y herramientas (v2.363)

Contrato de F8. No cambia la hoja de ruta (`05`). Reglas heredadas: F1 (guardado), F2 (`est.dim`), F7 (poblaciones), FN (mar). Las instrucciones para crear contenido están en `GUIA_CONTENIDO.md`.

## 1. Sincronía de poblaciones por dimensión
- Mensaje anfitrión → invitado: `{v:1, k:'agd', d:<dim>, s:<JSON de la población>, n:<g.n>, r:<est.reloj>}`. Una población por envío (la más atrasada), solo dimensiones activas (`A.activas`). `ag` (Tonavia) sigue igual y además lleva `n` (opcional: un cliente viejo lo ignora). Un cliente viejo ignora `agd`.
- **Presupuesto de ancho de banda:** `BPS` = 16.000 car./s en total (`agentes_red.js`). Tras enviar L caracteres no sale otra población hasta pasar L/BPS s; entre las que tocan sale primero la más atrasada. El invitado sigue simulando por su cuenta entre envíos (determinista); solo se corrige menos a menudo. Efecto: con poblaciones saturadas (≈ 100 KB) el refresco baja de 4 s a ≈ 6 s por población, sin picos.
- El invitado valida: rol · `d` con forma `^[a-z][a-z0-9_]{0,23}$` · `s` ≤ `LIM_MSG` (2.500.000 car.) · `n` entero ≥ 0 igual al de la población · no más antigua que la última adoptada · `A.restaurarDim` (valida con `A.valido`, conserva el resto de `est.dim[dim]`, rechaza `v>1`).
- Manda el anfitrión; el invitado adopta la población entera, nunca mezcla. Acciones del invitado: `ago`, las aplica el anfitrión.

## 2. Límites de guardado, por tipo de dato (F8: ya no son los de v2.362)
Los límites de v2.362 (600 KB/sección, 1,4 MB total, 64 secciones) se sustituyen. **El techo real no lo pone el juego sino `localStorage` (≈ 5 MB de caracteres por origen, con copias BAK/PRE/EXC/CUAR del guardado); por eso los límites son generosos y hay un mecanismo de escalones para cuando el navegador no da más.**

| Tipo | Límite | Dónde | Por qué |
|---|---|---|---|
| Entrenadores por población | `max(128, POBLACION)` | `agentes.valido` | el esquema admite 48 autónomos + 16 fijos = 64; 128 deja margen ×2 |
| Bytes por población | `65.536 + 16.384 × nº entrenadores` (≤ 2,1 MB con 128) | `agentes.valido` | real: ≈ 0,5 KB/entrenador al nacer, ≈ 4,3 KB tras horas; el techo es ≈ 4× lo saturado, solo frena datos hostiles |
| Listas por población | batallas 256 · crónica `max(800, 4·AJ)` · memoria/agente `max(100, 4·AJ)` · plan 64 · relaciones `max(100, 4·AJ)` | `agentes.valido` | acotado por los ajustes del propio juego |
| Población guardada por dimensión | 1.500.000 B | `guardado.LIM.agentes` | cabe la saturada de 128 entrenadores (≈ 550 KB) ×2,7 |
| Resto de la sección (jugadores, marcas, navegación…) | 250.000 B | `guardado.LIM.datos` | sin población, un jugador usa < 10 KB |
| Sección desconocida (dimensión futura `v>1`) | 1.750.000 B (población + datos) | `limitarDim` | se conserva intacta para versiones futuras |
| Secciones `est.dim` | 256 | `LIM.secciones` | |
| Total de `est.dim` | 3.500.000 B | `LIM.total` | por debajo de la cuota del navegador con margen para el resto del guardado |
| Mensaje de población en red | 2.500.000 car. | `agentes_red.LIM_MSG` | |
| Progreso declarado (`prg`) | 40.000 car., 64 dimensiones | `red.MAX_PROG` | ver §4 |

`limitarDim` (al serializar y al restaurar): primero secciones sobrantes (se conservan las más pequeñas, nunca las de dimensiones conocidas con datos de jugador); una población que excede su límite se quita entera (**las poblaciones se regeneran**; nunca se recorta a la mitad ni se acepta corrupta); sobre el total, primero poblaciones (la mayor primero), luego secciones desconocidas. **Nunca** se tocan `tonavia` ni el progreso de jugador de dimensiones conocidas. Lo descartado queda en `guardado.descartes` y se avisa; `cargar` aparta el texto ORIGINAL una vez en `criaturas_partida_exceso`.

**Escalones de escritura** (`guardado.escribir`): si `setItem` falla por cuota, antes de rendirse se prueba sin las poblaciones de las dimensiones y luego sin la de Tonavia (el progreso del jugador JAMÁS), y se muestra un aviso visible (una vez por sesión y tipo). `guardado.ultimo = {chars, ms, escalon}`.
**Autoguardado adaptativo** (`game.js`): intervalo base; si el último guardado tardó > 25 ms se espacia hasta 60 s (guarda siempre al ocultar/cerrar la página).

Escalabilidad: coste lineal con el tamaño del guardado (medido en escritorio: 128 entrenadores saturados, guardar 7 ms / cargar 8 ms; `valido` 0,02 ms). Un móvil de gama baja multiplica ×4–6 (CPU limitada con CDP, ver informe). Con 10 dimensiones de 48 entrenadores saturados el guardado sería ≈ 2,1 MB: cabe, y es la señal para pasar a un almacén por dimensión (IndexedDB, claves separadas) — alternativa escalable reservada, no hace falta aún. Si el navegador no da más, actúan los escalones.

## 3. Datos hostiles
Validación estricta intacta: cualquier población con forma/ids/tipos fuera de contrato, pesos fuera de límite, secciones `v>1` reescritas, claves de dimensión inválidas, marcas fuera de rango, mensajes enormes → se descartan (el guardado propio nunca silenciosamente: se anota en `descartes` y en `criaturas_partida_exceso`). Los datos válidos nunca se descartan si caben en el límite (test de guardados grandes con 128 entrenadores/10 dimensiones sin pérdidas).

## 4. Portales: requisitos validados en el anfitrión (cambio respecto a v2.362)
- Misma dimensión: válido. Distinta dimensión exige: puerta real del mapa de origen al de destino · última posición a ≤ 6 casillas de la puerta · llegada a ≤ 3 casillas del ancla · **todos los `requisitos` del portal** (`G.portales.comprobar(j, portal, est, decl)`), incluidos nivel, marca y casco, **con el progreso que declara el jugador**.
- **Qué recibe el anfitrión y cómo lo verifica:** mensaje `{v:1, k:'prg', xp, marcas:{dim:{clave:n}}, cascos:{dim:n}}` (solo se manda si cambia; al conectar y en cada tick antes de la posición). El receptor valida forma, rangos (`G.marcas.limpiar`, casco 0..9, ids de dimensión, tamaño) y **monotonía** (xp, marcas y cascos no bajan dentro de una conexión). Sin declaración válida el portal con requisito personal se **cierra** (fail closed). Los datos son el nivel/marcas/casco, no datos personales; nada sale de la sala P2P.
- **DECISIÓN ADOPTADA (usuario, v2.363): se acepta el riesgo residual.** No se añade servidor autoritativo ni firmas entre sesiones (no resuelven el falseo durante una conexión y complicarían la arquitectura P2P).
  1. **El progreso declarado por un cliente es información NO VERIFICADA**; un cliente modificado puede falsificarlo.
  2. **Uso permitido, único:** abrir o cerrar un portal en el anfitrión (`red.cruceValido`, el único consumidor de `red.declarado`; lo vigila un test). **No se usa** para conceder recompensas permanentes, alterar economías compartidas ni desbloquear contenido global: no se guarda, no se escribe en `est`, vive en memoria por conexión (`WeakMap`) y se borra al soltar al jugador. Lo que un jugador falsee solo le abre una puerta a él mismo, en su propia partida.
  3. Se mantienen las validaciones del anfitrión sobre puerta real, posición (≤ 6 casillas), ancla de destino (≤ 3), marea y existencia del mapa.
  4. **Una futura arquitectura autoritativa (servidor que posea el progreso) será NECESARIA si se incorpora competición o sistemas multijugador que requieran protección real contra trampas** (clasificaciones, economía o intercambios competitivos, recompensas compartidas). Hasta entonces, ningún sistema nuevo debe depender de `red.declarado` para autorizar algo más que un cruce de portal.
- **Limitación inevitable (aceptada):** sin servidor, el anfitrión no puede **verificar** lo que declara el otro móvil: un cliente modificado puede declarar un nivel alto, igual que puede editar su propio guardado. Con la arquitectura P2P serverless actual esto no se puede cerrar del todo. Lo que sí se consigue: (1) el requisito se aplica en ambos móviles; (2) el cliente no puede saltarse la puerta/posición/ancla; (3) lo declarado es monótono y está acotado; (4) sin declaración no pasa. Impacto real: solo afecta a la propia partida de dos jugadores que se conocen; no hay clasificaciones ni economía competitiva. Alternativas (no implementadas): declaración firmada por el anfitrión del guardado anterior (cierra el falseo entre sesiones, no dentro de una), o servidor autoritativo (fuera de arquitectura).
- Otros límites: el primer mensaje tras conectar se acepta donde sea (posición de su guardado); un móvil de la versión anterior (sin `prg`) no puede cruzar portales con requisitos personales (los portales sin ellos no se ven afectados). Un jugador en solitario no pasa por la red: el motor local valida el cruce (F3).

## 5. Editor y herramientas con dimensiones externas
- `tools/editor_mapas.js` carga también `maps/<dim>/*.json`; un mapa externo sin tocar se exporta byte a byte igual. «Exportar al juego» solo lleva mapas de Tonavia (diseño F4/F5); «Probar en el juego» abre los externos (`G.PAQUETES[dim]`).
- Compositor `componer_mapa --comprobar` corregido en Carbuna (receta con 2 puertas, sin salto final).
- **Paquete de transferencia (F8):** `GUIA_CONTENIDO.md`; `plantillas/dimension/` y `tools/nueva_dimension.js` (esqueleto de tierra o mar); `tools/prueba_dimension_nueva.js` (el procedimiento sobre una copia temporal); contrato por dimensión en `test.js` (se aplica solo a toda dimensión nueva); validadores `validar_dimension.js`, `validar_mundo.js`, `componer_mapa --comprobar`.

## 6. Pruebas: reales, simuladas y no realizadas
- **Reales (en este entorno):** `node test.js` (130 grupos); validadores; huellas 2D y clásico; navegador Chromium (Playwright) con CDN sustituido por un servidor local (`/tmp/runcdn.py`): guardado, portales, entrenadores, editor, minimapa, navegación; migración de guardado v1 (fixture real); medición de guardado con 128 entrenadores y de arranque de `dist` con CPU limitada.
- **Simuladas:** red P2P con PeerJS REAL (npm) y un servidor de señalización LOCAL en bucle (`prueba_red.py`, `prueba_red_agentes.py`, `/tmp/lb/`): prueba protocolo y WebRTC entre dos páginas, **no** Internet, NAT ni dos móviles. Three.js/PeerJS del CDN sustituidos por stub/npm. El «móvil» es CPU limitada por CDP, no un iPhone.
- **No realizadas (pendientes físicas):** red real entre dos móviles; carga real desde cdnjs; iPhone/Safari (cuota de `localStorage`, memoria, HD-2D con Three.js real).

## 7. Pendiente / reservado
Declaración firmada de progreso o almacén por dimensión (IndexedDB) si el multiverso crece mucho. Importar mapas externos desde el juego (desactivado por diseño). Chuches/Pirata/Cerezo, crafteo y Santuario Multiversal: tras la aprobación de F8.
