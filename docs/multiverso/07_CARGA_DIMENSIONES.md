# F4 · Carga de dimensiones (contrato v2.355)
- **Disposición:** `maps/*.json` = tonavia (siempre cargada). `maps/<dim>/*.json` = otra dimensión, id de cada mapa `<dim>/<nombre>`; debe estar registrada en `datos/dimensiones/<dim>.json`.
- **Carga:** al entrar un jugador (`colocar`, borde, puerta, restaurar) `mundo.mapa(id)` pide el mapa a los proveedores (`G.PAQUETES[dim]` en el navegador, `maps/<dim>/` en node). Un paquete roto o con ids ajenos NO entra: error claro y nada a medias.
- **Descarga:** `motor.liberarDimensiones(est)`: sin jugadores dentro y distinta de tonavia → se quitan mapas preparados, estado (`est.mapas`) y caché del proveedor. Al volver se reconstruyen desde el plan; las criaturas salvajes reaparecen. Criaturas capturadas/marcas persistentes: F6.
- **Guardado:** `restaurar` carga la dimensión del sitio guardado si existe; si no existe o su paquete está roto, el jugador va al ancla segura (F1) y `dim.<otra>` se conserva intacto (F2).
- **Semilla:** `est.semilla` (mundo, se guarda y restaura; plan de criaturas) ≠ `est.sesion` (azar de combate, nueva en cada sesión, no se guarda). `est.rnd` no se restaura.
- **Editor:** solo ids sin prefijo (tonavia); ids con `/` rechazados; el mundo resultante pasa `dimensiones.comprobar`. Importar otras dimensiones: F8.
- **Para F5+:** `validarDimension(dim)` sirve para validar portales/entradas; `comprobar(mapas, dims)` solo exige la entrada de las dimensiones cargadas.
