// mapas_ui.js — botón «Mapas» (importar, exportar, volver a los oficiales), botón «✏️ Editar mapa» (abre el editor DENTRO del juego, v2.62) y rótulo «Mapas del editor» (v2.61).
// La lectura y la validación son de src/mapas.js (G.mundo.paquete.leer); el guardado, de src/mapas_guardados.js. Aquí solo se pinta y se reacciona. Sin DOM (node) no hace nada.
(function () {
  'use strict';
  const G = window.G, mundo = G.mundo, alm = G.almacenMapas, estado = G.mapasEditor || { activo: false, ids: [], error: null };
  const $ = (id) => (typeof document !== 'undefined' && document.getElementById ? document.getElementById(id) : null);
  const btn = $('mbtn'), rot = $('mrot'), dlg = $('mdlg');
  const recargar = () => { try { location.reload(); } catch (e) { /* sin navegador */ } };
  // Un paquete guardado que ya no sirve (p. ej. el juego cambió) nunca rompe el arranque: se aparta y se juega con los oficiales, diciendo por qué.
  let motivos = null;
  if (estado.error) { alm.borrar(); motivos = estado.error; } // no era válido al arrancar: ya se usaron los oficiales
  else if (estado.activo) { // válido con las reglas de arranque; se repasa con el mundo ya completo (zonas de aparición, etc.)
    const mal = mundo.validar(); if (mal.length) { alm.borrar(); alm.rechazar(mal); recargar(); return; }
  }
  const previo = alm.leerRechazo(); if (previo && !motivos) motivos = previo;
  if (!btn || !btn.addEventListener || !dlg) return;
  if (typeof window.__MAPA_PRUEBA === 'string') { btn.hidden = true; if ($('ebtn')) $('ebtn').hidden = true; return; } // dentro de «Probar» del editor no hace falta

  const li = (t) => '<li>' + String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</li>';
  const msg = $('mmsg'), lista = $('mlista'), estadoEl = $('mestado'), ofi = $('moficiales'), elegir = $('melegir'), archivo = $('marchivo');
  let seguro = false;
  function pintar() {
    if (rot) rot.hidden = !estado.activo;
    estadoEl.textContent = estado.activo ? 'Estás jugando con los mapas del editor (' + estado.ids.length + (estado.ids.length === 1 ? ' mapa' : ' mapas') + ').' : 'Estás jugando con los mapas oficiales.';
    lista.innerHTML = estado.activo ? estado.ids.map((id) => li(id + (estado.reemplaza.indexOf(id) >= 0 ? ' · sustituye al oficial' : ' · nuevo'))).join('') : '';
    ofi.disabled = !estado.activo; ofi.textContent = seguro ? '¿Seguro? Pulsa otra vez' : 'Volver a los oficiales';
  }
  function decir(titulo, errores, mal) {
    const extra = errores.length > 8 ? errores.length - 8 : 0;
    msg.className = mal ? 'mal' : 'bien'; msg.innerHTML = '<b>' + titulo + '</b>' + (errores.length ? '<ul>' + errores.slice(0, 8).map(li).join('') + (extra ? li('… y ' + extra + ' más') : '') + '</ul>' : '');
  }
  const abrir = () => { seguro = false; pintar(); dlg.hidden = false; };
  btn.addEventListener('click', () => { msg.textContent = ''; msg.className = ''; if ($('mtexto')) $('mtexto').hidden = true; abrir(); });
  $('mcerrar').addEventListener('click', () => { dlg.hidden = true; });
  elegir.addEventListener('click', () => { msg.textContent = ''; archivo.value = ''; archivo.click(); });
  archivo.addEventListener('change', () => {
    const f = archivo.files && archivo.files[0]; if (!f) return;
    const lector = new FileReader();
    lector.onerror = () => decir('No se pudo leer el archivo.', [], true);
    lector.onload = () => {
      const r = mundo.paquete.leer(String(lector.result || ''));
      if (!r.ok) { decir('No se cargó nada. El archivo tiene problemas:', r.errores, true); return; } // se rechaza entero: lo que había antes sigue igual
      if (!alm.guardar(r.texto)) { decir('No se pudo guardar en este navegador (¿modo privado o sin espacio?). No se cargó nada.', [], true); return; }
      decir('Mapas cargados (' + r.ids.length + '). Reiniciando el juego…', [], false); setTimeout(recargar, 400);
    };
    lector.readAsText(f);
  });
  ofi.addEventListener('click', () => {
    if (!seguro) { seguro = true; pintar(); return; }
    alm.borrar(); decir('Listo: vuelven los mapas oficiales. Reiniciando el juego…', [], false); setTimeout(recargar, 400);
  });
  // ---- Editor dentro del juego (v2.62). El editor (tools/editor_mapas.plantilla.html) viaja en dist/criaturas.html como texto (#editorSrc) y se abre en una ventana a pantalla completa.
  // Parte de los mapas con los que se juega ahora (mundo.crudos()) y se abre en el mapa donde está el jugador. «Guardar y jugar» manda el paquete aquí: se valida con las MISMAS reglas del mundo (mundo.paquete.leer), se guarda y se reinicia.
  const ed = $('edlg'), editar = $('ebtn'); let marco = null; // el marco (iframe) se crea al abrir y se quita al cerrar: así el juego no lleva un marco vacío a cuestas // el texto del editor (#editorSrc) va DESPUÉS de este script en el HTML: se busca al pulsar, no al arrancar
  const cerrarEditor = () => { if (ed) { ed.hidden = true; ed.innerHTML = ''; } marco = null; };
  const paquete = () => JSON.stringify({ paquete: mundo.paquete.MARCA, version: mundo.paquete.VERSION, formato: 2, maps: Object.values(mundo.crudos()) }, null, 1) + '\n';
  const MARCA_MAPAS = '/*__MAPAS' + '__*/[]', MARCA_ID = '/*__EN_JUEGO' + '__*/null'; // partidos a propósito: el código del juego no debe contener los marcadores literales de la plantilla del editor
  function abrirEditor() {
    let html = null; try { const fuente = $('editorSrc'); html = fuente ? JSON.parse(fuente.textContent) : null; } catch (e) { html = null; }
    if (!html || !ed) { abrir(); decir('Este archivo del juego no trae el editor. Genera el juego otra vez con node build.js.', [], true); return; }
    const id = G.mapaActual ? G.mapaActual() : mundo.INICIAL.mapa, json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
    ed.innerHTML = ''; marco = document.createElement('iframe'); marco.id = 'eframe'; marco.title = 'Editor de mapas'; ed.appendChild(marco);
    marco.srcdoc = html.replace(MARCA_MAPAS, () => json(Object.values(mundo.crudos()))).replace(MARCA_ID, () => json(id));
    ed.hidden = false; dlg.hidden = true;
  }
  if (editar) editar.addEventListener('click', abrirEditor);
  $('meditar').addEventListener('click', abrirEditor);
  // «Copiar mis mapas» (v2.62b): en una página publicada las descargas no funcionan, así que el texto del paquete se copia al portapapeles; si el navegador no deja, se enseña en una caja ya seleccionada para copiarlo a mano.
  const caja = $('mtexto');
  const mostrarTexto = (t) => { if (!caja) return; caja.hidden = false; caja.value = t; try { caja.focus(); caja.select(); caja.setSelectionRange(0, t.length); } catch (e) { /* se selecciona a mano */ } };
  $('mcopiar').addEventListener('click', () => {
    const t = paquete(), n = Object.keys(mundo.crudos()).length; if (caja) caja.hidden = true;
    const aMano = () => { mostrarTexto(t); decir('No se pudo copiar solo. El texto está en la caja de abajo, ya seleccionado: mantén pulsado y elige «Copiar» (' + n + ' mapas).', [], true); };
    try { if (!navigator.clipboard || !navigator.clipboard.writeText) { aMano(); return; } navigator.clipboard.writeText(t).then(() => decir('Copiado (' + n + ' mapas, ' + Math.round(t.length / 1000) + ' KB). Pégalo en el chat con Claude.', [], false), aMano); } catch (e) { aMano(); }
  });
  $('mexportar').addEventListener('click', () => {
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([paquete()], { type: 'application/json' })); a.download = 'mapas_editor.json'; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); decir('Descargado: mapas_editor.json con todos los mapas de ahora.', [], false);
    } catch (e) { decir('No se pudo descargar el archivo en este navegador.', [], true); }
  });
  window.addEventListener('message', (e) => {
    const d = e.data; if (!marco || e.source !== marco.contentWindow || !d || !d.editorMapas) return; // solo se le hace caso al editor de esta ventana
    if (d.editorMapas === 'salir') { cerrarEditor(); return; }
    if (d.editorMapas !== 'guardar') return;
    const r = mundo.paquete.leer(String(d.texto || ''));
    const responder = (m) => { try { marco.contentWindow.postMessage({ editorMapasResp: m }, '*'); } catch (x) { /* el editor ya no está */ } };
    if (!r.ok) { responder({ ok: false, errores: r.errores }); return; } // se rechaza entero: lo que había antes sigue igual
    if (!alm.guardar(r.texto)) { responder({ ok: false, errores: ['No se pudo guardar en este navegador (¿modo privado o sin espacio?). No se cargó nada.'] }); return; }
    responder({ ok: true }); setTimeout(recargar, 600);
  });
  pintar();
  if (motivos) { abrir(); decir('Los mapas del editor guardados no se pudieron usar, así que el juego usa los oficiales:', motivos, true); }
})();
