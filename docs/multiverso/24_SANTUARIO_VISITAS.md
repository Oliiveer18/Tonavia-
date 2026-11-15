# 24 · Santuario: visitas entre Santuarios privados (Etapa B, bloque 6, v2.370)

## DECISIONES OFICIALES DE DISEÑO (usuario, 15 nov 2026) — referencia vinculante

### 1. Dos Santuarios privados e independientes
- Por ahora solo existen dos: el de Oli y el de Lali.
- Cada uno tiene su propio hogar, cabaña, criaturas residentes (de **su propia** caja), nombre, niveles, ampliaciones, hábitats, instalaciones, decoración, economía y guardado.
- **No** hay comunidad compartida, construcciones colectivas, economía compartida, comercio ni sistemas sociales adicionales.

### 2. Bloque 6: solo visitas entre Santuarios privados
- Oli puede entrar y recorrer el Santuario de Lali, y Lali el de Oli.
- El visitante puede ver residentes, hábitats, instalaciones, ampliaciones, decoración y cabaña.
- **Permisos de solo lectura:** no puede mover, acoger, devolver, curar ni entrenar criaturas; no puede construir, ampliar, decorar, gastar Brillos ni cambiar ningún dato.
- **Sin recompensas ni ventajas por visitar.** Cada jugador conserva el control absoluto del suyo.

### 3. Implementación
- Se usa la arquitectura existente (identidad por jugador, guardado por jugador, red P2P). **Sin servidor autoritativo** y sin cambiar las limitaciones actuales de la red.
- El visitante recibe una representación **de solo lectura** del Santuario ajeno; sus acciones nunca pueden modificar los datos del propietario.
- Si algo no se puede garantizar con la arquitectura actual, no se simula: se documenta la limitación y la solución mínima.

### 4. Conservar lo aprobado
Brezo sigue siendo el cuidador exterior; Lirio, la archivera de la cabaña; el libro y la vitrina, informativos y de solo lectura. No se añaden mecánicas que no hagan falta para visitar.

### 5. Entrega
Pruebas mínimas: cada jugador conserva el suyo · ambos pueden visitar · el visitante recorre y consulta · ningún intento de modificación altera al propietario · salir devuelve al propio Santuario · guardado y reanudación · nada existente se rompe. El informe distingue: implementado y probado / solo probado en local o simulado / requiere dos dispositivos y conexión real / limitaciones. **El bloque no se marca como completamente validado sin una visita real entre dos jugadores.**


---

## IMPLEMENTADO (v2.370)

### Contrato
- **Entrada:** la Guardiana Sela del Umbral tiene la opción «Visitar el otro Santuario» (menú por datos, `panel:'visita'`). Ejecuta la orden `santuario.visitar` (`{ a? }`, a = el otro jugador por defecto). Condiciones: estar en el Umbral, sin combate, **conectado con el otro móvil** y haber recibido ya **su resumen**. Si falta algo, la orden se rechaza con su motivo («no estás conectado con Oli», «aún no ha llegado», «todavía no tiene Santuario») y nadie se mueve. No cuesta nada, no da nada, no cambia nada.
- **Dentro:** el visitante entra en el hogar del dueño (el mapa sale del id, igual que el propio: `santuario/hogar_<n>_…_<dueño>`), ve a sus residentes moverse y recorre el claro; puede **hablarles** (lectura: cómo son, qué hacen, con quién se llevan), entrar en **su cabaña** (`santuario/cabana_<dueño>`) y leer el **libro** y la **vitrina**; Brezo y Lirio le enseñan un panel de **solo lectura** («Santuario de Oli»: nivel, hábitats con residentes, instalaciones con su origen, decoración; sin botones, sin Brillos, sin costes ni progreso del visitante).
- **Salida:** la puerta de salida del hogar ajeno lleva a **tu propio hogar** (o al Umbral si aún no tienes Santuario). La salida de la cabaña ajena lleva al hogar de su dueño.
- **Fin automático de la visita** (`custodiar`, cada fotograma): si se cae la conexión, el resumen ajeno se descarta y el visitante vuelve a su Santuario («La visita ha terminado»); si el dueño cambia su hogar (nuevo hábitat, instalación o decoración → id nuevo), el visitante pasa al hogar nuevo sin salir de la visita; si alguien reanuda una partida guardada dentro de un Santuario ajeno, vuelve al suyo.

### Cómo se garantiza el solo lectura
1. **Cada móvil tiene su estado y es autoridad del suyo.** El Santuario del otro **no existe** en el móvil del visitante: solo hay una *representación declarada* por el dueño.
2. **Mensaje nuevo `{ v:1, k:'san', r, caja }`** (por la misma conexión PeerJS, sin servidor): `r` = registro del dueño (`n, hab, res, des, ins, dec, nom`; sin `hoy`, vivencias ni Brillos) y `caja` = **solo sus residentes** (`id, forma, xp, mote?, hp?`). Se manda al conectar y cuando cambia (se compara ~1 vez por segundo). Tamaño típico < 2 kB; tope de 16 kB.
3. **Validación estricta al recibir** (`G.santuario.visita.recibir`): solo del jugador **remoto** (jamás el propio ni uno sin conexión), forma y rangos (`limpiarRec`: nivel, hábitats, instalaciones, decoración y residentes recortados a lo que el juego permite), formas de criatura existentes, ids únicos, motes limpios, tamaño. Un mensaje roto o tramposo se rechaza entero.
4. **Se guarda aparte, en memoria** (`WeakMap` ligado al jugador remoto), **nunca** en `est.dim` ni en el guardado; se descarta al perder la conexión. `rec()` y `cajaDe()` consultan esa representación solo para jugadores remotos y **jamás crean ni escriben** el registro de otro.
5. **Todas las órdenes del Santuario exigen `propio(j)`**: el mapa tiene que ser del propio jugador y el actor no puede ser remoto. Desde una visita (mapa ajeno) las nueve órdenes se rechazan, también suplantando al dueño. Combatir y evolucionar siguen bloqueados en todo el Santuario. El entrenamiento solo corre para el dueño en su móvil y el tiempo no entrena a nadie.
6. **Ningún mensaje de red ejecuta órdenes.** El único camino del otro móvil al estado es posición, progreso declarado, entrenadores y este resumen (solo para mostrar).

### Cambios fuera del módulo (mínimos)
`red_peer.js` (enviar/recibir `san`, descartar al caer), `game.js` (entrada de Sela y panel de solo lectura de Brezo/Lirio durante una visita), `santuario_ui.js` (opción del menú de Sela; `leer` acepta `alCerrar`), `test.js` (diez órdenes `santuario.*` y prueba por la conexión simulada). `motor.js` no se toca.

### Rendimiento
Un móvil solo simula los hogares donde hay un jugador **local** (lo que ve el otro lo simula el otro). El resumen no se manda si no cambia.

---

## LÍMITES Y LIMITACIONES (honestos)

1. **El resumen es información declarada, no verificable.** Sin servidor autoritativo, el móvil del visitante no puede comprobar que el Santuario que le enseñan es el real: un cliente modificado podría mostrar otra cosa. Es coherente con la decisión del doc 16 §4 (se acepta el riesgo residual): **solo se usa para mostrar**; no concede recompensas, no abre nada y no se guarda. Con dos jugadores de confianza no tiene consecuencias; no es seguridad entre desconocidos.
2. **Solo hay visita con los dos móviles conectados a la vez.** Sin conexión no hay forma de ver el Santuario del otro (no se simula con datos guardados: no se tienen, y serían viejos).
3. **Los datos pueden ir un segundo por detrás** (se compara cada ~1 s). Lo que el dueño cambie se ve en la visita casi al instante; el movimiento de las residentes lo calcula cada móvil por su cuenta (función del reloj), así que pueden no coincidir al milímetro.
4. **Una caída de conexión durante la visita te devuelve a tu Santuario** (por diseño, no hay datos ajenos que mostrar).
5. **Un móvil con versión anterior** no entiende `san`: no podrá ser visitado ni visitar (lo ignora, sin errores).
6. **Las visitas no se ven en pantalla del dueño de forma especial:** si el visitante llega por puerta legítima, el dueño ve su avatar como a cualquier jugador remoto en ese mapa; no hay avisos ni "visitas" como sistema social.
7. **No probado con red real:** ver el informe de la entrega (qué se probó local/simulado y qué requiere dos dispositivos).

## PRUEBAS
- `node tools/prueba_santuario.js` (sección 30, 39 comprobaciones): dos móviles simulados con estado propio, resumen por `k:'san'`, resúmenes hostiles, intentos de modificación (incluso suplantando al dueño), cabaña ajena, salir/volver, caída de conexión, dueño que cambia su hogar, guardado dentro de una visita y reanudación.
- `node test.js`: visita por la conexión PeerJS **falsa** de `red_peer` (envío, recepción, rechazo de órdenes, caída).
- `python3 tools/prueba_santuario.py` (Chromium 390×844, 2D y clásico): entrada por el diálogo de Sela, residentes ajenas, panel de solo lectura, intentos rechazados, nada en el guardado, salida a tu Santuario. El «otro móvil» es un segundo estado dentro de la misma página.
- **Estado (15 nov 2026):** funcionamiento aprobado por el usuario; implementado y con pruebas locales/simuladas superadas.
- **Pendiente de validación real (no marcado como validado):** una visita entre dos dispositivos reales con PeerJS por Internet (NAT, latencia, reconexión).
