#!/usr/bin/env node
// nueva_dimension.js — F8: crea el ESQUELETO de una dimensión nueva a partir de plantillas/dimension/ (no escribe contenido).
// Uso: node tools/nueva_dimension.js <id> "<Nombre>" [--mar] [--desde <mapa>] [--en <carpeta_del_proyecto>]
//   <id>      minúsculas, dígitos y _ (máx. 24), empieza por letra; no puede existir ya.
//   --mar     dimensión de mar: esquema v4 con «navegacion», mosaico 3×3 de agua (tools/crear_mar.js) y entrada en el centro del mar.
//   --desde   mapa al que vuelve el portal de la entrada (por defecto nexus/plaza_cruce).
//   --en      proyecto donde crear los archivos (por defecto este; las pruebas usan una copia).
// Crea: datos/dimensiones/<id>.json y maps/<id>/entrada.json (sin --mar) o maps/<id>/mar_*.json (con --mar). NO toca ningún archivo existente.
// Lo que falta lo hace el contenido: una puerta DE ENTRADA en un mapa existente que lleve a la dimensión (docs/multiverso/GUIA_CONTENIDO.md §6). Luego: node tools/validar_dimension.js <id>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const arg = process.argv.slice(2), opc = (k, d) => (arg.includes(k) ? arg[arg.indexOf(k) + 1] : d), banderas = ['--mar'];
const pos = arg.filter((a, i) => a[0] !== '-' && !['--desde', '--en'].includes(arg[i - 1]));
const id = pos[0], nombre = pos[1], mar = arg.includes('--mar'), desde = opc('--desde', 'nexus/plaza_cruce'), raiz = path.resolve(opc('--en', path.join(__dirname, '..')));
const falla = (t) => { console.error('FALLA: ' + t); process.exit(1); };
if (!id || !nombre) falla('uso: node tools/nueva_dimension.js <id> "<Nombre>" [--mar] [--desde <mapa>] [--en <carpeta>]');
if (!/^[a-z][a-z0-9_]{0,23}$/.test(id) || id === 'tonavia') falla('id no válido «' + id + '» (minúsculas, dígitos y _; empieza por letra; máx. 24; «tonavia» está reservado)');
if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 60) falla('el nombre debe tener de 1 a 60 caracteres');
const plan = path.join(raiz, 'plantillas', 'dimension'), fDim = path.join(raiz, 'datos', 'dimensiones', id + '.json'), dMapas = path.join(raiz, 'maps', id);
if (fs.existsSync(fDim) || fs.existsSync(dMapas)) falla('la dimensión «' + id + '» ya existe (' + (fs.existsSync(fDim) ? 'datos/dimensiones/' + id + '.json' : 'maps/' + id + '/') + '); no se pisa nada');
if (!fs.existsSync(plan)) falla('faltan las plantillas en ' + plan);
const leer = (f) => JSON.parse(fs.readFileSync(path.join(plan, f), 'utf8')), sub = (o) => JSON.parse(JSON.stringify(o).replace(/__ID__/g, id).replace(/__NOMBRE__/g, nombre.replace(/["\\]/g, '')).replace(/__DESDE__/g, desde));
const sinNotas = (o) => { const r = {}; Object.keys(o).forEach((k) => { if (k[0] !== '_') r[k] = o[k]; }); return r; };
let dim = sinNotas(sub(leer('dimension.plantilla.json')));
if (mar) { const nav = sinNotas(sub(leer('navegacion.plantilla.json'))); dim = { v: 4, id, nombre: dim.nombre, entrada: { mapa: id + '/mar_1_1', ancla: 'inicio' }, regiones: [], reglas: dim.reglas, navegacion: nav }; }
fs.mkdirSync(path.dirname(fDim), { recursive: true }); fs.writeFileSync(fDim, JSON.stringify(dim, null, 1) + '\n');   // las dimensiones de datos/ llevan salto final; los mapas, no
const creados = ['datos/dimensiones/' + id + '.json'];
if (mar) { const r = cp.spawnSync(process.execPath, [path.join(raiz, 'tools', 'crear_mar.js'), id], { cwd: raiz, encoding: 'utf8' }); if (r.status !== 0) { fs.unlinkSync(fDim); falla('crear_mar: ' + (r.stderr || r.stdout)); } for (let f = 0; f < 3; f++) for (let c = 0; c < 3; c++) creados.push('maps/' + id + '/mar_' + f + '_' + c + '.json'); }
else { fs.mkdirSync(dMapas, { recursive: true }); fs.writeFileSync(path.join(dMapas, 'entrada.json'), JSON.stringify(sub(leer('mapa_entrada.plantilla.json')), null, 1)); creados.push('maps/' + id + '/entrada.json'); }
console.log('OK dimensión «' + id + '» creada (' + (mar ? 'mar, esquema v4' : 'tierra, esquema v1') + '):\n  ' + creados.join('\n  '));
console.log('Falta (contenido): una puerta de ENTRADA en un mapa existente que lleve a «' + dim.entrada.mapa + '» (ancla «' + (mar ? 'inicio' : 'portal') + '»). Después: node tools/validar_dimension.js ' + id + '   y   node build.js && node test.js');
