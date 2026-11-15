// validar_santuario.js — valida datos/santuario.json con el validador del propio módulo (G.santuario.validarDatos). Uso: node tools/validar_santuario.js → una línea «OK …» o «FALLA: …» (código 1).
const G = require('./_cargar.js')(), S = G.santuario, e = S ? S.errores : ['no existe G.santuario'];
if (e.length) { console.log('FALLA: ' + e.join(' · ')); process.exit(1); }
console.log('OK santuario.json: ' + S.D.niveles.length + ' niveles, ' + Object.keys(S.D.habitats).length + ' hábitats (' + Object.keys(S.D.habitats).join(', ') + ')');
