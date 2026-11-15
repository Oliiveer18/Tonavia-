// catalogo.js — genera docs/CATALOGO.md a partir del registro único (src/lineas.js). NO se edita CATALOGO.md a mano.
// Uso:  node tools/catalogo.js              -> reescribe docs/CATALOGO.md
//       node tools/catalogo.js --comprobar  -> no escribe; sale con código 1 si CATALOGO.md no coincide con el registro (lo usa test.js)
const path = require('path'), fs = require('fs');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'docs/CATALOGO.md');
const noop = () => {}, mk = () => { const base = { getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), measureText: () => ({ width: 40 }) }; const ctx = new Proxy(base, { get: (t, p) => (p in t ? t[p] : noop), set: () => true }); return { width: 0, height: 0, getContext: () => ctx, style: {}, offsetHeight: 80 }; };
global.window = global; global.document = { createElement: mk, getElementById: () => mk(), querySelectorAll: () => [] };
require(path.join(root, 'src/orden.json')).datos.forEach((f) => require(path.join(root, f))); // lista única: src/orden.json
const G = window.G; // sin número de versión en el catálogo: solo depende de src/lineas.js, así no se desfasa en cada subida de versión

const num = (v) => String(v).replace('.', ','), cap = (e) => G.ELEMENTS[e].name, rar = (r) => G.RARITIES[r].name;
const nn = (n) => String(n).padStart(3, '0'), pct = (a, t) => Math.round(100 * a / t);
const ELEM = Object.keys(G.ELEMENTS), RAR = Object.keys(G.RARITIES);
const lineas = G.LINEAS.slice(), formas = lineas.reduce((n, L) => n + L.formas.length, 0);
const count = (f) => lineas.filter(f).length;
const linea = (L) => L.formas.map((f) => f.name + ' ' + f.size[0] + '×' + f.size[1] + ' · ' + num(f.kg) + ' kg').join(' → ');

let t = '';
t += '# Catálogo · Criaturas de Lali y Oli\n\n';
t += 'Inventario oficial de lo que **ya está dibujado y en el juego**. Se ordena por elemento y, dentro de cada elemento, de Común a Legendaria (y por Nº de línea). Lo que falta hasta las 200 líneas está en `PLAN_200.md`. Las reglas de diseño están en `DISENO_CRIATURAS.md`.\n\n';
t += '**Nº de línea:** número fijo e intransferible de cada línea evolutiva (001-020 ya asignados; las nuevas continúan desde 021). **Elemento principal:** el primero de la lista; cuenta para el reparto por elemento.\n\n';
t += '## 1. Resumen\n\n';
t += '- **' + lineas.length + ' líneas · ' + formas + ' formas** (meta: 200 líneas · 410 formas).\n';
t += '- Por rareza: ' + RAR.map((r) => rar(r) + ' ' + count((L) => L.rarity === r)).join(' · ') + '.\n';
t += '- Por fases: ' + [1, 2, 3].map((k) => k + (k === 1 ? ' fase ' : ' fases ') + count((L) => L.formas.length === k)).join(' · ') + ' (' + [1, 2, 3].map((k) => pct(count((L) => L.formas.length === k), lineas.length)).join(' / ') + ' %).\n';
t += '- Por elemento (principal): ' + ELEM.map((e) => cap(e) + ' ' + count((L) => L.elements[0] === e)).join(' · ') + '.\n\n';
t += '| Rareza | 1 fase | 2 fases | 3 fases | Líneas | Formas |\n|---|---|---|---|---|---|\n';
RAR.forEach((r) => { const c = [1, 2, 3].map((k) => count((L) => L.rarity === r && L.formas.length === k)); t += '| ' + rar(r) + ' | ' + c.join(' | ') + ' | ' + c.reduce((a, b) => a + b, 0) + ' | ' + lineas.filter((L) => L.rarity === r).reduce((n, L) => n + L.formas.length, 0) + ' |\n'; });
t += '| **Total** | ' + [1, 2, 3].map((k) => count((L) => L.formas.length === k)).join(' | ') + ' | ' + lineas.length + ' | ' + formas + ' |\n\n';
t += '## 2. Inventario por elemento\n\n';
ELEM.forEach((e) => {
  const ls = lineas.filter((L) => L.elements[0] === e).sort((a, b) => RAR.indexOf(a.rarity) - RAR.indexOf(b.rarity) || a.n - b.n);
  t += '### ' + cap(e) + ' (' + ls.length + (ls.length === 1 ? ' línea' : ' líneas') + ')\n\n| Nº | Línea (tamaño · peso) | Rareza | Fases | Elementos | Hecha en |\n|---|---|---|---|---|---|\n';
  ls.forEach((L) => { t += '| ' + nn(L.n) + ' | ' + linea(L) + ' | ' + rar(L.rarity) + ' | ' + L.formas.length + ' | ' + L.elements.map(cap).join(' + ') + ' | ' + L.hecha + ' |\n'; });
  t += '\n';
});
t += '## 3. Nombres\nEl registro completo de nombres (fases 1, 2 y 3 de cada línea, con la idea de la raíz) y las reglas N1-N10 están en `GUIA_DE_NOMBRES.md`. Los ids internos del código conservan los nombres antiguos (por ejemplo `pompon` = Ondel) y no se ven en el juego.\n\n';
t += '_Este catálogo se genera con `node tools/catalogo.js` a partir del registro único `src/lineas.js` (`G.LINEAS`): **no se edita a mano**. Al añadir una línea se escribe su entrada en `src/lineas.js` y se vuelve a ejecutar el comando; `test.js` avisa si el catálogo se ha quedado desfasado._\n';

if (process.argv.includes('--comprobar')) { const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : ''; if (cur !== t) { console.log('docs/CATALOGO.md no coincide con src/lineas.js: ejecuta node tools/catalogo.js'); process.exit(1); } console.log('docs/CATALOGO.md al día'); } else { fs.writeFileSync(out, t); console.log('docs/CATALOGO.md escrito (' + lineas.length + ' líneas, ' + formas + ' formas)'); }
