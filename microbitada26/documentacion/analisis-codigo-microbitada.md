# Análisis del código — microbitada.html

## Estado (actualizado)

**Fase 1 — Robustez y seguridad: completada.**
1. Numeración de equipo automática por orden de validación (máx. 5 grupos, bloqueo claro al 6º).
2. XSS en la clasificación final corregido (`textContent` en vez de `innerHTML`).
3. (fusionado con el punto 1).
4. Cronómetro protegido contra doble intervalo.
5. `nav()` protegida contra índice de imagen negativo.
6. Respaldo de progreso en `localStorage` durante un reto en marcha, con recuperación al recargar.

**Fase 2 — Datos en tiempo real: completada y probada en producción.** Arquitectura final:
- `microbitada26/apps-script/Code.gs` — desplegado como aplicación web (ver `notas-despliegue-apps-script.md` para el checklist de despliegue, que costó bastante depurar).
- `microbitada.html` avisa por GET en cada candado superado (no solo al final), con un `sessionId` único por partida, y captura los 5 retos (antes solo se guardaban 4).
- `microbitada26/marcador.html` — pantalla en vivo para el proyector, filtrada por escuela, confirmada funcionando: recoge los grupos activos y sus retos en tiempo real.
- La pestaña "Estat en viu" del Sheet se actualiza en directo por grupo; la pestaña histórica "Respostes al formulari 1" se sigue rellenando al finalizar cada grupo, ahora con la columna "Temps repte 5" añadida.

**Fase 3 — Accesibilidad: completada.** Cambios aplicados (un commit por punto):
1. Cuadrícula 5x5 convertida de `<div onclick>` a `<button>` reales: foco de teclado, activación con Enter/Espacio, `aria-pressed` por celda y `role="group"` con etiqueta descriptiva en el contenedor.
2. Imagen de cada pista: techo de ancho del contenedor ampliado en pantallas grandes (`@media min-width:900px`, hasta 900px) y visor a pantalla completa al tocar/pulsar la imagen (envuelta en `<button>`, cerrable con Esc/clic fuera/botón, con gestión de foco). Estos dos no eran parte del checklist original de accesibilidad, pero surgieron de una petición explícita del usuario sobre baja visión ("que el alumnado pueda acceder a la información sin forzar la vista").
3. `<label class="sr-only">` enlazada por `for`/`id` en los 3 campos de texto (escola, nom d'equip/membre, resposta del repte); el diseño visual no cambia.
4. Celdas de la cuadrícula ampliadas de 40px a 44px (mínimo recomendado para objetivos táctiles), separación de 5px a 6px.
5. Contraste de color corregido en los botones (medido con la fórmula de luminancia de WCAG, mínimo AA 4.5:1 texto normal / 3:1 texto grande): naranja y verde mantienen su color de fondo y pasan el texto a oscuro; azul y rojo se oscurecen ligeramente manteniendo texto blanco.

**Limitaciones conocidas, decisión consciente del usuario — no bloqueantes:**
- Las 25 celdas de la cuadrícula no llevan `aria-label` individual (p. ej. "Fila 2, columna 3"): son operables por teclado y anuncian su estado (activada/no activada), pero una persona que use solo lector de pantalla no puede distinguir una celda de otra, así que el reto del patrón en sí sigue sin ser resoluble sin ver la pantalla. Decisión explícita del usuario al proponerlo.
- La imagen de cada pista (`#current-img`) sigue sin atributo `alt`: es contenido real (no decorativo), así que necesitaría una descripción propia por imagen (24-27 fotos) que solo la organización puede redactar. Quedó aparcado cuando el usuario priorizó el tamaño de imagen (visto arriba) en su lugar; sigue pendiente si se quiere abordar en otra sesión.

Nota operativa: los commits de este trabajo viven en el repo `mentoria-apps` (GitHub, `Paula-Pacho/mentoria-apps`); el usuario los sube con `git push` desde su propio Mac, ya que esta sesión no tiene acceso de red a GitHub.

Ver también `notas-despliegue-apps-script.md` para los detalles de configuración de Apps Script (permisos de ejecución/acceso, versión de despliegue, GET vs POST) que costó bastante identificar.

---

Fuente original: `microbitada.html` (carpeta "Mentoria" del usuario, luego movida/renombrada a `mentoria-apps/microbitada26/`), HTML/CSS/JS en un único fichero, con imágenes en GitHub raw, un Apps Script propio como backend, y una pantalla de marcador aparte.

## Qué hace la app

Es una gimcana digital para el evento "micro:bitada Penedès 2026": los grupos de alumnos escriben su escuela, dan de alta su equipo (nombre + miembros; el número de equipo 1-5 se asigna automáticamente por orden de validación), pulsan START y recorren una secuencia de imágenes/pistas con 5 "candados" intercalados (código de 3 o 4 dígitos, palabra de 6 letras, o patrón en una cuadrícula 5x5). Un cronómetro corre durante el reto, y el progreso se envía en tiempo real al Apps Script, visible en `marcador.html`. Al acabar cada grupo, se guarda el registro final y se pasa al siguiente grupo hasta mostrar una clasificación local ordenada por tiempo.

## Mantenibilidad (sin cambios, pendiente si se quiere abordar)

- Números mágicos: los triggers de candado (6, 11, 16, 21, 27) y el umbral de fin (`realImgIdx >= 23`) dependen de que existan exactamente 24 imágenes numeradas 01–24 en GitHub. No hay comentario que lo explique.
- Sin manejo de errores de carga de imagen ni precarga de la siguiente imagen.
- Las claves de respuesta (`GROUP_KEYS`) son visibles en el código fuente servido al navegador: cualquier alumno con las herramientas de desarrollador puede leer las soluciones. Aceptable para una gimcana escolar, pero vale la pena tenerlo presente.
- `marcador.html` (pantalla del proyector) tiene su propia copia de la misma paleta de colores y no se ha auditado su contraste; fuera del alcance de esta fase porque el checklist original hablaba de "la plataforma" (el juego), pero sería una extensión natural si se quiere revisar.

## Próximos pasos

Ninguna fase pendiente de las 4 solicitadas originalmente (robustez, seguridad, datos en tiempo real, accesibilidad). Opcional, no bloqueante, si se quiere seguir mejorando:
- Descripciones `alt` reales para las 24-27 imágenes de pistas (contenido a redactar por la organización).
- `aria-label` por celda en la cuadrícula 5x5, si en el futuro se quiere que el reto de patrón sea resoluble sin ver la pantalla.
- Documentar los números mágicos con constantes nombradas; manejo de errores de carga de imagen.
- Revisar contraste de `marcador.html`.
