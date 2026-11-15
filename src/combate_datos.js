// combate_datos.js — DATOS del combate en tiempo real (v2.271, prototipo del motor). Solo datos: catálogo de 56 movimientos, estados, reacciones y plantillas de elemento.
// Los ids de movimiento son los de tools/prototipo_fx (los efectos visuales cuelgan de ellos). Potencia, enfriamiento y alcance son de PARTIDA: se afinan con tools/simular_combate.js.
// Unidades: distancia en «u» (la arena mide 160 u), tiempo en segundos (el motor corre a 20 ticks/s).
(function () {
  'use strict';
  const G = window.G;
  // [id, nombre, elemento, hueco, forma, potencia, enfriamiento s, alcance u, radio u, [[estado, prob]…], etiqueta]
  // huecos: b básico · h habilidad · e especial (se carga con el medidor) · d defensa · a apoyo
  // formas: contacto · proyectil · haz · linea · area (alrededor del objetivo) · zona (suelo bajo el objetivo) · propia · aliado · enemigo
  const M = [
    ['llamarada', 'Fogonazo', 'fuego', 'b', 'proyectil', 11, 1.2, 56, 0, [['quemado', 0.25]], ''],
    ['zarpa', 'Zarpazo ígneo', 'fuego', 'b', 'contacto', 13, 1.1, 14, 0, [['quemado', 0.3]], ''],
    ['bola', 'Bola de magma', 'fuego', 'h', 'proyectil', 22, 5, 56, 18, [['quemado', 0.6]], ''],
    ['salto', 'Pisotón solar', 'fuego', 'h', 'linea', 20, 5, 40, 0, [['quemado', 0.5]], ''],
    ['tormenta', 'Lluvia de meteoritos', 'fuego', 'e', 'zona', 52, 0, 80, 30, [['quemado', 0.8]], ''],
    ['erupcion', 'Estallido volcánico', 'fuego', 'e', 'zona', 48, 0, 70, 24, [['quemado', 1]], ''],
    ['aura', 'Aura ardiente', 'fuego', 'd', 'propia', 0, 9, 0, 0, [], 'bloq'],
    ['avivar', 'Fervor', 'fuego', 'a', 'aliado', 0, 10, 80, 0, [], 'ataque'],
    ['chorro', 'Chorro a presión', 'agua', 'b', 'haz', 10, 1.2, 52, 0, [['mojado', 0.5]], ''],
    ['salpicon', 'Salpicadura', 'agua', 'b', 'proyectil', 12, 1, 28, 0, [['mojado', 0.5]], ''],
    ['ola', 'Oleada', 'agua', 'h', 'area', 18, 5, 40, 26, [['empujado', 0.7], ['mojado', 1]], ''],
    ['burbuja', 'Pompa prisión', 'agua', 'h', 'proyectil', 14, 5, 56, 0, [['ralentizado', 1]], ''],
    ['marea', 'Pleamar', 'agua', 'e', 'zona', 40, 0, 80, 34, [['mojado', 1]], ''],
    ['torrente', 'Hidrocañón', 'agua', 'e', 'haz', 62, 0, 90, 0, [['mojado', 1]], ''],
    ['escudo', 'Muro acuático', 'agua', 'd', 'propia', 0, 9, 0, 0, [], 'bloq'],
    ['purificar', 'Lluvia curativa', 'agua', 'a', 'aliado', 0, 10, 80, 0, [], 'limpia'],
    ['latigazo', 'Latigazo', 'hoja', 'b', 'contacto', 12, 1.1, 18, 0, [], ''],
    ['cuchilla', 'Cuchilla de hoja', 'hoja', 'b', 'proyectil', 11, 1.2, 52, 0, [], ''],
    ['enredadera', 'Enredadera', 'hoja', 'h', 'zona', 16, 5, 56, 16, [['enredado', 1]], ''],
    ['esporas', 'Nube de esporas', 'hoja', 'h', 'area', 14, 5, 44, 26, [['ralentizado', 0.9]], ''],
    ['bosque', 'Zarzal', 'hoja', 'e', 'zona', 44, 0, 70, 30, [['enredado', 0.6]], 'curaAliados'],
    ['ciclon', 'Ciclón de hojas', 'hoja', 'e', 'area', 50, 0, 40, 32, [], ''],
    ['corteza', 'Piel de corteza', 'hoja', 'd', 'propia', 0, 9, 0, 0, [], 'bloq'],
    ['brote', 'Savia vital', 'hoja', 'a', 'aliado', 0, 10, 80, 0, [], 'regen'],
    ['centella', 'Centella', 'electrico', 'b', 'proyectil', 10, 1, 56, 0, [['aturdido', 0.1]], ''],
    ['sacudida', 'Sacudida', 'electrico', 'b', 'contacto', 12, 1, 14, 0, [['aturdido', 0.12]], ''],
    ['cadena', 'Cadena voltaica', 'electrico', 'h', 'haz', 20, 5, 56, 40, [], 'cadena'],
    ['red', 'Red estática', 'electrico', 'h', 'area', 14, 5, 44, 26, [['ralentizado', 1]], ''],
    ['tormentae', 'Tormenta eléctrica', 'electrico', 'e', 'zona', 50, 0, 80, 40, [], ''],
    ['cenital', 'Rayo cenital', 'electrico', 'e', 'zona', 56, 0, 80, 14, [['aturdido', 0.8]], ''],
    ['jaula', 'Jaula de chispas', 'electrico', 'd', 'propia', 0, 9, 0, 0, [], 'bloq'],
    ['pulso', 'Pulso veloz', 'electrico', 'a', 'aliado', 0, 10, 80, 0, [], 'veloz'],
    ['tajo', 'Tajo de viento', 'aire', 'b', 'proyectil', 11, 1.1, 52, 0, [], ''],
    ['aletazo', 'Aletazo', 'aire', 'b', 'contacto', 12, 1, 14, 0, [['empujado', 0.15]], ''],
    ['remolino', 'Remolino', 'aire', 'h', 'area', 16, 5, 44, 24, [['empujado', 1]], ''],
    ['vendaval', 'Vendaval', 'aire', 'h', 'haz', 18, 5, 60, 0, [['empujado', 0.8]], ''],
    ['tornado', 'Tornado', 'aire', 'e', 'area', 48, 0, 56, 34, [['empujado', 1]], ''],
    ['ojo', 'Ojo del huracán', 'aire', 'e', 'zona', 44, 0, 70, 36, [['ralentizado', 1]], ''],
    ['plumaje', 'Plumaje etéreo', 'aire', 'd', 'propia', 0, 9, 0, 0, [], 'esq'],
    ['vientocola', 'Viento de cola', 'aire', 'a', 'aliado', 0, 10, 80, 0, [], 'veloz'],
    ['mazazo', 'Mazazo', 'roca', 'b', 'contacto', 14, 1.3, 14, 0, [], ''],
    ['pedrusco', 'Pedrusco', 'roca', 'b', 'proyectil', 12, 1.3, 44, 0, [], ''],
    ['onda', 'Onda sísmica', 'roca', 'h', 'area', 18, 5, 30, 26, [['aturdido', 0.6]], ''],
    ['embestida', 'Embestida pétrea', 'roca', 'h', 'contacto', 22, 5, 40, 0, [['empujado', 0.5]], 'embiste'],
    ['alud', 'Alud de rocas', 'roca', 'e', 'zona', 56, 0, 70, 34, [['aturdido', 0.5]], ''],
    ['seismo', 'Seísmo', 'roca', 'e', 'area', 50, 0, 40, 40, [['aturdido', 0.6], ['empujado', 1]], ''],
    ['muralla', 'Muralla de piedra', 'roca', 'd', 'propia', 0, 9, 0, 0, [], 'bloq'],
    ['desafio', 'Desafío', 'roca', 'a', 'propia', 0, 10, 80, 0, [], 'provoca'],
    ['garra', 'Garra umbría', 'sombra', 'b', 'contacto', 11, 1, 14, 0, [], ''],
    ['aguja', 'Aguja de sombra', 'sombra', 'b', 'proyectil', 12, 1.1, 52, 0, [], ''],
    ['maldeojo', 'Mal de ojo', 'sombra', 'h', 'haz', 16, 5, 56, 0, [['maldito', 1]], ''],
    ['emboscada', 'Emboscada', 'sombra', 'h', 'contacto', 22, 5, 70, 0, [], 'espalda'],
    ['noche', 'Noche voraz', 'sombra', 'e', 'area', 46, 0, 60, 36, [['miedo', 0.8]], 'roba'],
    ['terror', 'Terror nocturno', 'sombra', 'e', 'zona', 40, 0, 70, 34, [['miedo', 1]], ''],
    ['manto', 'Manto de penumbra', 'sombra', 'd', 'propia', 0, 9, 0, 0, [], 'esq'],
    ['drenar', 'Drenar fuerza', 'sombra', 'a', 'enemigo', 0, 10, 60, 0, [['debil', 1]], 'debilita'],
  ];
  const MOV = {};
  M.forEach((m) => { MOV[m[0]] = { id: m[0], nombre: m[1], el: m[2], hueco: m[3], forma: m[4], pot: m[5], cd: m[6], alc: m[7], r: m[8], est: m[9], tag: m[10], k: 1 }; });
  // Calibración (la escribe tools/calibrar_combate.js): id → [multiplicador de potencia, intensidad del efecto (duración e importe de defensas y apoyos)]. Hace que las variantes de un mismo hueco valgan lo mismo.
  const IMPACTO = {"llamarada":0.7,"zarpa":0.43,"bola":0.92,"salto":0.78,"tormenta":1.64,"erupcion":1.16,"chorro":0.43,"salpicon":0.68,"ola":1,"burbuja":0.86,"marea":1.36,"torrente":0.65,"latigazo":0.54,"cuchilla":0.81,"enredadera":0.76,"esporas":0.9,"bosque":1.01,"ciclon":1.26,"centella":0.49,"sacudida":0.32,"cadena":0.5,"red":0.63,"tormentae":1.51,"cenital":1.31,"tajo":0.6,"aletazo":0.43,"remolino":0.76,"vendaval":0.7,"tornado":0.91,"ojo":0.91,"mazazo":0.64,"pedrusco":1.51,"onda":0.55,"embestida":0.83,"alud":1.51,"seismo":0.91,"garra":0.38,"aguja":0.62,"maldeojo":0.78,"emboscada":1.32,"noche":0.91,"terror":1.01};
  const CAL = {"salto":[1.049,1],"bola":[0.954,1],"erupcion":[1.029,1],"tormenta":[0.972,1],"aura":[1,0.752],"avivar":[1,2.5],"burbuja":[0.872,1],"ola":[1.147,1],"torrente":[0.785,1],"marea":[1.274,1],"escudo":[1,0.777],"purificar":[1,0.578],"esporas":[0.921,1],"enredadera":[1.086,1],"ciclon":[1.324,1],"bosque":[0.755,1],"corteza":[1,0.379],"brote":[1,0.15],"red":[0.832,1],"cadena":[1.202,1],"cenital":[0.773,1],"tormentae":[1.293,1],"jaula":[1,0.535],"pulso":[1,2.5],"vendaval":[0.859,1],"remolino":[1.164,1],"ojo":[1.098,1],"tornado":[0.911,1],"plumaje":[1,0.486],"vientocola":[1,2.5],"embestida":[1.137,1],"onda":[0.88,1],"seismo":[1.023,1],"alud":[0.977,1],"muralla":[1,0.967],"desafio":[1,1.897],"emboscada":[1.56,1],"maldeojo":[0.641,1],"terror":[1.407,1],"noche":[0.711,1],"manto":[1,0.15],"drenar":[1,2.416]};
  Object.keys(CAL).forEach((id) => { if (MOV[id]) { MOV[id].pot *= CAL[id][0]; MOV[id].k = CAL[id][1]; } });
  // Peso → multiplicador de ataque: iguala la fuerza de ligeros y pesados (los pesados ya ganan vida y defensa; los ligeros, velocidad). Lo escribe tools/calibrar_combate.js: [kg, multiplicador].
  const KGPOT = [[0.05,1.626],[0.1,1.593],[0.3,1.487],[1,1.262],[3,1],[10,0.752],[30,0.605],[120,0.5]];
  // Estados (duración en segundos). Todo se guarda en la criatura como ticks restantes.
  const ESTADOS = { quemado: 4, mojado: 6, enredado: 2.5, aturdido: 1.2, ralentizado: 4, maldito: 6, miedo: 3, empujado: 0.35, ciego: 3, debil: 6 };
  // Reacciones: un golpe del elemento `con` sobre un objetivo con el estado `sobre`. mult = daño extra; resto = efectos (ver combate.js).
  const REACCIONES = [
    { id: 'vapor', con: 'fuego', sobre: 'mojado', mult: 1.15, quita: 'mojado', aplica: [['ciego', 1]] },
    { id: 'sobrecarga', con: 'electrico', sobre: 'mojado', mult: 1.4, salta: [40, 0.5] },
    { id: 'incendio', con: 'fuego', sobre: 'enredado', mult: 1.5, extiende: [30, 'quemado'] },
    { id: 'tormenta_electrica', con: 'electrico', sobre: 'empujado', mult: 1.2, salta: [40, 0.3] },
    { id: 'lodo', con: 'roca', sobre: 'mojado', mult: 1, quita: 'mojado', aplica: [['ralentizado', 1]], dur: 5 },
    { id: 'noche_voraz', con: 'sombra', sobre: 'maldito', mult: 1.3, aplica: [['miedo', 1]] },
  ];
  // Plantillas de elemento: estadísticas 1-5 [vida, ataque, defensa, velocidad, alcance] (FICHA_COMBATE §4).
  const PLANTILLAS = { fuego: [3, 5, 2, 3, 3], agua: [4, 2, 3, 3, 3], hoja: [4, 2, 3, 2, 3], electrico: [2, 4, 1, 5, 3], aire: [2, 3, 2, 4, 3], roca: [5, 3, 5, 1, 1], sombra: [3, 4, 2, 4, 2] };
  // Coeficiente de equilibrio por rareza y elemento (multiplica el daño que hace; la legendaria usa el de épica). Sale de tools/calibrar_combate.js; no tocar a mano.
  const AJUSTE = {"comun":{"fuego":0.547,"agua":1.244,"hoja":1.181,"electrico":1.402,"aire":1.629,"roca":0.719,"sombra":0.757},"rara":{"fuego":0.399,"agua":1.4,"hoja":1.069,"electrico":1.396,"aire":1.808,"roca":0.74,"sombra":0.897},"epica":{"fuego":0.398,"agua":1.232,"hoja":0.877,"electrico":1.592,"aire":1.846,"roca":0.701,"sombra":1.131}};
  G.COMBATE_DATOS = { RITMO: 1.8, AJUSTE, KGPOT, IMPACTO, VERSION: 1, TPS: 20, ARENA: 160, MOV, ESTADOS, REACCIONES, PLANTILLAS, HUECOS: { b: 'basico', h: 'habilidad', e: 'especial', d: 'defensa', a: 'apoyo' } };
})();
