// mapas_guardados.js — dónde viven los mapas importados del editor (v2.61): UN solo sitio, el navegador donde se juega (localStorage).
// Se carga justo antes de src/mapas.js, que lee G.MAPAS_GUARDADOS al arrancar. Solo guarda y lee TEXTO: la validación vive en src/mapas.js (G.mundo.paquete.leer).
// Los mapas guardados NO pasan a otro móvil: hay que importar el archivo mapas_editor.json en cada uno.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {}), CLAVE = 'criaturas.mapas_editor.v1', CLAVE_RECHAZO = CLAVE + '.rechazo';
  const ls = () => { try { return root.localStorage || null; } catch (e) { return null; } }; // sin almacenamiento (modo privado, node): todo devuelve null / false
  const leer = (k) => { try { const s = ls(); return s ? s.getItem(k) : null; } catch (e) { return null; } };
  const quitar = (k) => { try { const s = ls(); if (s) s.removeItem(k); } catch (e) { /* nada que quitar */ } };
  G.almacenMapas = {
    CLAVE,
    leer: () => leer(CLAVE),
    guardar(texto) { try { const s = ls(); if (!s) return false; s.setItem(CLAVE, texto); return s.getItem(CLAVE) === texto; } catch (e) { return false; } }, // false = no cabe o no hay almacenamiento
    borrar() { quitar(CLAVE); },
    rechazar(motivos) { try { const s = ls(); if (s) s.setItem(CLAVE_RECHAZO, JSON.stringify(motivos)); } catch (e) { /* el aviso es opcional */ } }, // se enseña una vez en el arranque siguiente
    leerRechazo() { const t = leer(CLAVE_RECHAZO); quitar(CLAVE_RECHAZO); try { return t ? JSON.parse(t) : null; } catch (e) { return null; } },
  };
  // El juego abierto desde el editor («Probar») usa los mapas del editor tal como están: nunca los guardados. ?oficiales=1 ignora lo guardado (salida de emergencia).
  const probando = typeof root.__MAPA_PRUEBA === 'string', pideOficiales = !!(root.location && /[?&]oficiales=1/.test(root.location.search || ''));
  G.MAPAS_GUARDADOS = probando || pideOficiales ? null : G.almacenMapas.leer();
})(typeof window !== 'undefined' ? window : globalThis);
