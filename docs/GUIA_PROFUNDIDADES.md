# GUÍA · Profundidades (cuevas generadas) — añadir contenido SOLO con datos

Todo el contenido vive en `datos/profundidades.json`. Motor: `src/profundidades.js` (puro); pintor: `src/cueva2d.js`; interfaz: `src/profundidades_ui.js`. **No hace falta tocar código** para nada de esta guía.

## Comprobación (siempre, en este orden; cada una da UNA línea «OK»/«FALLA»)
```
node tools/validar_salas.js          # formato de salas, biomas, pisos especiales, modificadores
node tools/validar_puzles.js         # cada puzle tiene solución y exige a los dos jugadores
node tools/probar_semillas.js 2000   # miles de pisos: transitables, bajada alcanzable, sin objetos aislados
node tools/hoja_pisos.js <bioma>     # (opcional) hoja de contacto de 50 pisos → docs/hoja_pisos_<bioma>.png (necesita Chromium)
node build.js && node test.js
```

## Cómo se arma un piso
Rejilla de huecos (`ajustes.celda` × `ajustes.rejilla`); el generador traza un camino (entrada → combate → puzle → tesoro → miniJefe → llave → jefe) con puertas con llave, atajos y secretos. Cada hueco usa una **sala prefabricada** (`salas[]`) o cueva orgánica. Piso = mapa con id `prof_<bioma>_<semillaHex>_<piso>`; misma semilla = mismo piso en los dos móviles. Un jefe cada `jefeCada` pisos y un piso especial por tramo.

## Añadir una SALA (la tarea más común)
1. Copia `plantillas/sala.json` y pega el objeto `sala` en `salas[]`.
2. Elige `tipo`: `puzle` (con `dif` 1-3), `jefe`, `jefe_oculto`, `tesoro`, `santuario`, `evento`, `tienda`, `descanso`, `campamento`.
3. Dibuja `filas` (máx. **10 × 8**, debe caber en `celda − 3`). Borde de roca `#`, una entrada `E` y una salida `S` en bordes opuestos (el generador puede girar/espejar la sala).
4. Letras (`leyenda`): `#` roca · `.` suelo · `:` foso · `i` hielo · `o` bloque empujable · `a b c d` placas · `A B C D` rejas del mismo canal · `X Y` reja invertida (abierta si NO hay peso) · `H I` puente (aparece al activar) · `1-4` palancas · `u v` botones · `< >` runas (slot 0 y 1) · `p q` teleportes · `{ }` subida/bajada · `$` cofre · `*` jefe · `J` puerta del jefe · `K` cerradura · `+` altar · `&` hoguera · `%` mercader · `?` evento.
5. Canal = letra que une fuente y puerta. Modos en `canales`: `"and"` (todas a la vez) o `"sec"` (palancas en orden, con `leyenda` propia `{"1":{"t":"palanca","canal":"a","orden":1}…}`).
6. Escribe una `pista` de una frase (aparece al entrar). Un puzle debe entenderse de un vistazo y **necesitar a los dos jugadores** (el validador lo exige).

Ejemplo mínimo real (`portero`):
```json
{ "id": "portero", "tipo": "puzle", "dif": 1, "pista": "Uno pisa la placa y el otro cruza la reja.",
  "filas": ["#######","#.a.#.#","E...A.S","#...#.#","#######"] }
```
Dificultad por profundidad: pisos 1-2 → dif 1; 3-6 → hasta dif 2; 7+ → hasta dif 3 (desde el piso 13 solo dif ≥ 2).

## Otros contenidos
- **Piso especial:** `pisosEspeciales[]` `{id, nombre, sala, peso, desde}` (peso = frecuencia; desde = primer piso en que puede salir) + su sala.
- **Evento (encrucijada):** `eventos[]` con `texto` y `opciones[{txt, sub, mod?, cofre?}]`.
- **Modificador** (bendición/maldición): `modificadores[]` `{id, tipo:'bendicion'|'maldicion', nombre, desc, efecto}`. Efectos: `luz`, `brillos`, `nivel`, `llaves`, `revela`, `rareza`, `radioMapa`.
- **Cofres:** `cofres{comun,rara,epica}` con `brillos [mín,máx]` y `objetos [[id,peso]…]` (`null` = nada; `huevo` cae a Brillos mientras la crianza esté en pausa).
- **Jefe:** sala `jefe` con `*`; su nivel sale de `ajustes.nivelJefe/nivelPorPiso`. El rival usa las criaturas de los `elementos` del bioma.
- **Bioma nuevo:** copia uno de `biomas{}` (`nombre`, `elementos`, `paleta` completa, `luz{radio,oscuridad}`, `mecanica{tipo: revela|oscuridad|esporas|charcos|hielo, texto}`, `deco[]`, `musica`). Para entrar a él, añade una **entrada** (abajo). Comprueba la hoja de pisos antes de darlo por bueno.
- **Entrada a la cueva:** en `maps/<mapa>.json`, un elemento de `puertas` con `destino: {"mapa":"@prof","ancla":"<bioma>"}` (ejemplo: «profundidades» en Albanota, casilla 9,3). Coloca la casilla con el editor de mapas.

## Lista de comprobación antes de dar por terminado
- [ ] `validar_salas` y `validar_puzles` en OK; `probar_semillas 2000` en OK.
- [ ] Sala: cabe en 10×8, `E` y `S` en bordes opuestos, pasillos ≥ 1 casilla, todo alcanzable.
- [ ] Revisión espacial (norma del proyecto): captura 390×844 caminando por el piso (`tools/prueba_profundidades.py`).
- [ ] Nada de azar del sistema ni estado fuera de `est.prof`/`j.prof` (norma «listo para online»).
- [ ] Anotarlo en `docs/SESION.md`.
