// luz_criaturas.js — v2.23 (B1): ajustes de luz POR CRIATURA para el volumen calculado (src/sombreado.js, sección 1b). Solo las criaturas listadas aquí usan el sistema nuevo;
// las demás siguen con la pasada de bordes de la v2.21 hasta que se migren (B2.x, por elemento). Todo detrás de G.SOMBREADO.ACTIVO.
// Ficha de luz de cada criatura (se anotan en METODO_DE_TRABAJO.md):
//   mat      material por defecto: 'piel' (suave) · 'roca' · 'metal' (contraste duro y brillo) · 'cristal' (facetas y brillo).
//   colores  reglas por color que cambian el material de una zona: { h: [mín, máx] tono 0-360, s: [mín, máx] saturación 0-1, l: [mín, máx] luminosidad 0-1, mat }. Gana la primera que encaja.
//   emite    zonas que emiten luz (electricidad, brillos mágicos): no se sombrean. Mismo formato de rangos.
//   columnas (solo criaturas que se estiran de 16 a otro ancho): qué columna del dibujo de 16 va a cada columna final, simétrica, para que de frente y de espaldas los dos lados salgan iguales (el estirado automático duplica columnas solo por un lado). Si se usa, cambia la silueta de frente y de espaldas en 1 columna: ver tools/luz.js.
//   limpio   (v2.24.1) true = sombreado compacto: solo base y sombra, brillo de 1-2 px en metal/cristal y un solo contorno. Interruptor G.SOMBREADO.LIMPIO.
//   alcance  cuántos píxeles desde el borde cuenta el volumen (por defecto 3; las criaturas grandes pueden llevar 4).
(function () {
  'use strict';
  const G = window.G;
  G.LUZ_CRIATURAS = {
    aguacato: { limpio: true, mat: 'piel' }, // desde la v2.23.3 se dibuja nativo a 18×18 (sin estirado ni `columnas`)
    // B2.1b (v2.23.3): resto de la familia Hoja; todo piel (suave, poco contraste) como Aguacato, aprobado por el usuario.
    // B2.1c (v2.23.5): llaves de Aguacaryn (bronce) y Aguacarax (oro) con material `metal`. Rangos medidos sobre los colores del dibujo: bronce y oro caen en tono 33-46°; el ámbar de los ojos de Aguacarax (#f7b733, tono 40°, saturación 0,92) queda fuera por saturación; los huesos (tono 23-31°), la piel, la barriga y las garras quedan fuera por tono, y las garras color crema (luminosidad > 0,75) por luminosidad.
    aguacaton: { limpio: true, mat: 'piel', colores: [{ h: [33, 60], s: [0.5, 1], l: [0.15, 0.7], mat: 'metal' }] },
    aguacatigre: { limpio: true, mat: 'piel', colores: [{ h: [34, 46], s: [0.5, 0.82], l: [0.15, 0.7], mat: 'metal' }, { h: [47, 60], s: [0.8, 1], l: [0.15, 0.7], mat: 'metal' }] },
    cactel: { limpio: true, mat: 'piel' }, cactavar: { limpio: true, mat: 'piel' }, cactorax: { limpio: true, mat: 'piel' }, micavar: { limpio: true, mat: 'piel' }, setin: { limpio: true, mat: 'piel' },
    // B2.2 (v2.24): familia Fuego. Rangos medidos sobre los colores del dibujo. Brasas y llamas (naranja, amarillo, blanco cálido; tono 15-60°, sat ≥ 0,7) EMITEN luz y no se sombrean; el hierro de la forja (grises azulados, tono 235-260°, sat 0,1-0,35) es `metal`; madera y ladrillo del yunque quedan como `piel`. En Ignavar la cabeza roja (sat 0,67) es piel y no emite; en la forja el rojo de la brasa (tono 0-8°, sat ≥ 0,7) sí emite.
    ignavar: { limpio: true, mat: 'piel', emite: [{ h: [25, 60], s: [0.8, 1], l: [0.5, 1] }] },
    cenel: { limpio: true, mat: 'roca', emite: [{ h: [15, 60], s: [0.75, 1], l: [0.43, 1] }] },
    forjel: { limpio: true, mat: 'piel', colores: [{ h: [235, 260], s: [0.1, 0.35], mat: 'metal' }], emite: [{ h: [20, 60], s: [0.8, 1], l: [0.5, 1] }, { h: [0, 8], s: [0.7, 0.8], l: [0.5, 0.6] }] },
    forjavel: { limpio: true, mat: 'piel', colores: [{ h: [235, 260], s: [0.1, 0.35], mat: 'metal' }], emite: [{ h: [20, 60], s: [0.8, 1], l: [0.5, 1] }, { h: [0, 8], s: [0.7, 0.8], l: [0.5, 0.6] }] },
    forjadrax: { limpio: true, mat: 'piel', colores: [{ h: [235, 260], s: [0.1, 0.35], mat: 'metal' }], emite: [{ h: [20, 60], s: [0.8, 1], l: [0.5, 1] }, { h: [0, 8], s: [0.7, 0.8], l: [0.5, 0.6] }] },
    // B2.3 (v2.25, paso 4 · parte 1 de 4): familia Agua. Todo `piel` (masas suaves de gota, lóbulos y concha); solo el dorado de Espiravar (borde, punta y ventanita, tono 36-44°, sat ≥ 0,7) es `metal`. Sin `emite` ni `colores` en el resto: la perla y el coral de Perlel/Perlorix se leen por silueta y masa (regla 8 del estándar).
    pompon: { limpio: true, mat: 'piel' }, ondavar: { limpio: true, mat: 'piel' }, caracolin: { limpio: true, mat: 'piel' },
    espiravar: { limpio: true, mat: 'piel', colores: [{ h: [36, 44], s: [0.7, 1], l: [0.4, 0.62], mat: 'metal' }] },
    perlel: { limpio: true, mat: 'piel' }, perlorix: { limpio: true, mat: 'piel' },
    // B2.4 (v2.26, paso 4 · parte 2 de 4): familias Eléctrico y Aire. Rangos medidos sobre los colores del dibujo. Cuerpos `piel` (masas suaves); lo que EMITE luz (arcos y chispas cian/amarillas, alas de Zumbel) no se sombrea (regla 9); gris/lavanda neutro (tapa de Voltel; bornes y pinzas de Voltavar; tono 255-262°, sat ≤ 0,3) = `metal` (la cola-rayo gris de Arcarex se queda `piel`: con metal el test de luz no pasaba, solo salían 2 px de brillo). Aire (nube, diente de león, serpiente) todo `piel`; solo las chispas amarillas de Zefirax emiten. Los puntos blancos y los ojos no entran en ningún rango.
    pilita: { limpio: true, mat: 'piel', colores: [{ h: [255, 262], s: [0.05, 0.15], l: [0.5, 0.78], mat: 'metal' }] },
    voltavar: { limpio: true, mat: 'piel', colores: [{ h: [255, 262], s: [0.05, 0.3], l: [0.5, 0.95], mat: 'metal' }], emite: [{ h: [183, 206], s: [0.65, 1], l: [0.5, 1] }] },
    zumbel: { limpio: true, mat: 'piel', emite: [{ h: [183, 194], s: [0.6, 1], l: [0.55, 1] }, { h: [50, 58], s: [0.95, 1], l: [0.75, 0.9] }] },
    zumbarix: { limpio: true, mat: 'piel', emite: [{ h: [183, 194], s: [0.6, 1], l: [0.55, 1] }, { h: [50, 58], s: [0.95, 1], l: [0.75, 0.9] }] },
    arcel: { limpio: true, mat: 'piel', emite: [{ h: [193, 199], s: [0.95, 1], l: [0.65, 0.75] }, { h: [47, 53], s: [0.95, 1], l: [0.62, 0.74] }] },
    arcarex: { limpio: true, mat: 'piel', emite: [{ h: [193, 199], s: [0.95, 1], l: [0.65, 0.75] }, { h: [47, 53], s: [0.95, 1], l: [0.62, 0.74] }] },
    nubecin: { limpio: true, mat: 'piel' }, dandel: { limpio: true, mat: 'piel' },
    zefirax: { limpio: true, mat: 'piel', emite: [{ h: [48, 56], s: [0.95, 1], l: [0.55, 0.65] }], alcance: 4 },
    // B2.5 (v2.27, paso 4 · parte 3 de 4): Roca, Sombra e Ignel (11 formas). Rangos medidos sobre los colores del dibujo. Roca = `roca`; el dorado y el cristal turquesa de Cuarel/Cuarvel como en Cuarzoth (dorado `metal`, turquesa `cristal`); el hierro gris-violeta de Ferrel = `metal`. Sombra = todo `piel`; las lunas y estrellas amarillo-crema de la línea de Lunel EMITEN luz (regla 9). Ignel = `piel`, solo la llama emite (como Ignavar).
    fosforin: { limpio: true, mat: 'piel', emite: [{ h: [25, 60], s: [0.8, 1], l: [0.5, 1] }] },
    cuarzin: { limpio: true, mat: 'roca', colores: [{ h: [150, 200], s: [0.25, 1], mat: 'cristal' }, { h: [35, 60], s: [0.4, 1], mat: 'metal' }], alcance: 3 },
    cuarvel: { limpio: true, mat: 'roca', colores: [{ h: [150, 200], s: [0.25, 1], mat: 'cristal' }], alcance: 3 },
    ferrel: { limpio: true, mat: 'roca', colores: [{ h: [240, 252], s: [0.1, 0.3], l: [0.5, 1], mat: 'metal' }] },
    arenel: { limpio: true, mat: 'roca' }, arenax: { limpio: true, mat: 'roca' },
    somnin: { limpio: true, mat: 'piel' }, somnaris: { limpio: true, mat: 'piel' },
    lunabu: { limpio: true, mat: 'piel', emite: [{ h: [46, 54], s: [0.9, 1], l: [0.7, 1] }] },
    lunareth: { limpio: true, mat: 'piel', emite: [{ h: [46, 54], s: [0.9, 1], l: [0.7, 1] }] },
    lunaroth: { limpio: true, mat: 'piel', emite: [{ h: [46, 54], s: [0.9, 1], l: [0.7, 1] }] },
    voltorax: { limpio: true, mat: 'metal', emite: [{ h: [165, 200], s: [0.4, 1], l: [0.6, 1] }] },
    cuarzoth: { limpio: true, mat: 'roca', colores: [{ h: [150, 200], s: [0.25, 1], mat: 'cristal' }, { h: [255, 300], s: [0.3, 1], mat: 'cristal' }, { h: [35, 60], s: [0.4, 1], mat: 'metal' }], alcance: 3 },
  };
})();
