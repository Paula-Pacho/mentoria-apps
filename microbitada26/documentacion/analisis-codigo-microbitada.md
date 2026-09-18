# Análisis del código — microbitada.html

## Estado (actualizado)

**Fase 1 — Robustez y seguridad: completada.**
1. Numeración de equipo (ver más abajo, cambiada a manual tras pruebas reales).
2. XSS en la clasificación final corregido (`textContent` en vez de `innerHTML`).
3. (fusionado con el punto 1).
4. Cronómetro protegido contra doble intervalo.
5. `nav()` protegida contra índice de imagen negativo.
6. Respaldo de progreso en `localStorage` durante un reto en marcha, con recuperación al recargar.

**Fase 2 — Datos en tiempo real: completada y probada en producción.** Arquitectura final:
- `microbitada26/apps-script/Code.gs` — desplegado como aplicación web (ver `notas-despliegue-apps-script.md` para el checklist de despliegue, que costó bastante depurar).
- `microbitada.html` avisa por GET en cada candado superado (no solo al final), con un `sessionId` único por partida, y captura los 5 retos.
- `microbitada26/marcador.html` — pantalla en vivo para el proyector, filtrada por escuela, confirmada funcionando.
- La pestaña "Estat en viu" del Sheet se actualiza en directo por grupo; la pestaña histórica "Respostes al formulari 1" se rellena al finalizar cada grupo.

**Fase 3 — Accesibilidad: completada.** Cambios aplicados (un commit por punto):
1. Cuadrícula 5x5 convertida de `<div onclick>` a `<button>` reales: foco de teclado, activación con Enter/Espacio, `aria-pressed` por celda y `role="group"` con etiqueta descriptiva en el contenedor.
2. Imagen de cada pista: techo de ancho del contenedor ampliado en pantallas grandes (`@media min-width:900px`, hasta 900px) y visor a pantalla completa al tocar/pulsar la imagen. No eran parte del checklist original de accesibilidad, surgieron de una petición del usuario sobre baja visión.
3. `<label class="sr-only">` enlazada por `for`/`id` en los 3 campos de texto; el diseño visual no cambia.
4. Celdas de la cuadrícula ampliadas de 40px a 44px (mínimo recomendado para objetivos táctiles), separación de 5px a 6px.
5. Contraste de color corregido en los botones (medido con la fórmula de luminancia de WCAG, mínimo AA 4.5:1/3:1): naranja y verde mantienen su fondo y pasan el texto a oscuro; azul y rojo se oscurecen ligeramente manteniendo texto blanco.

**Limitaciones conocidas, decisión consciente del usuario — no bloqueantes:**
- Las 25 celdas de la cuadrícula no llevan `aria-label` individual (p. ej. "Fila 2, columna 3"): decisión explícita del usuario. El reto del patrón sigue sin ser resoluble solo con lector de pantalla.
- La imagen de cada pista (`#current-img`) sigue sin atributo `alt` real (contenido, no decorativo); pendiente si se quiere abordar en otra sesión.

**Actualizaciones posteriores, tras la primera prueba real con grupos (18/09/2026):**

1. **Bug detectado en la primera prueba real: numeración automática rota con multi-dispositivo.** La numeración de Fase 1 asumía que los 5 grupos se registraban en el mismo dispositivo, uno tras otro (1r validado = equip 1, etc.). En el uso real cada grupo juega desde su propio dispositivo, así que cada uno registra un único grupo y ese grupo siempre "es el primero" en su dispositivo → todos acababan con `GROUP_KEYS["1"]`, sin relación con el material físico repartido. **Solución:** desplegable manual (1-5) junto al nombre del grupo, obligatorio (avisa con `alert` si no se elige), elegido por quien reparte el material. Sustituye por completo a la numeración automática (se eliminó `groupNumberFor()`).
2. **Columna de doble comprobación en el Sheet:** el número de grupo elegido viaja en `sendEvent()` como `numGrup` y aparece como columna nueva tanto en "Estat en viu" (9ª columna) como en "Respostes al formulari 1" (10ª, "Número de grup"), con comprobación de cabecera para no romper el histórico ya existente.
3. **Migración de imágenes a repo propio:** `BASE_URL` pasó de `aespino2-create/Microbitada-imatges` (externo) a `Paula-Pacho/mentoria-apps/microbitada26/imatges` (propio, público). Nueva secuencia de **21 imágenes** (antes 24), con otra distribución por reto. `GAME_FLOW` se refactorizó: ya no hace falta calcular números mágicos a mano, basta con editar `TOTAL_IMAGES` e `IMAGES_BEFORE_LOCK` (cuántas imágenes hay antes de cada candado); el resto se calcula solo. Carpeta `microbitada26/imatges/` con README explicando la convención de nombres (`01.jpg`..`21.jpg`).
4. Se retiró el enlace "Programació" (MakeCode) — ya no hacía falta.
5. **Documentación duplicada dentro del propio repo**, en `microbitada26/documentacion/` (antes solo vivía en este proyecto de Claude), para que cualquier mentor/a del equipo la consulte sin depender de una herramienta externa.
6. **Hosting vía GitHub Pages** (explicado al usuario, no requiere cambios de código): activar en Settings → Pages → Deploy from branch `main` / root. URLs resultantes:
   - `https://paula-pacho.github.io/mentoria-apps/microbitada26/microbitada.html`
   - `https://paula-pacho.github.io/mentoria-apps/microbitada26/marcador.html`

**Pendiente del lado Apps Script:** el cambio del punto 2 (columna `numGrup`) está en el archivo de referencia `microbitada26/apps-script/Code.gs`, pero **hay que copiarlo también al editor de Apps Script real y redesplegar ("Nova versió")** para que surta efecto en producción — igual que cualquier cambio anterior de ese archivo.

Nota operativa: los commits de este trabajo viven en el repo `mentoria-apps` (GitHub, `Paula-Pacho/mentoria-apps`, público); el usuario los sube con `git push` desde su propio Mac, ya que esta sesión no tiene acceso de red a GitHub.

Ver también `notas-despliegue-apps-script.md` para los detalles de configuración de Apps Script (permisos de ejecución/acceso, versión de despliegue, GET vs POST) que costó bastante identificar.

---

Fuente original: `microbitada.html` (carpeta "Mentoria" del usuario, luego movida/renombrada a `mentoria-apps/microbitada26/`), HTML/CSS/JS en un único fichero, con imágenes ahora en el propio repo, un Apps Script propio como backend, y una pantalla de marcador aparte.

## Qué hace la app

Es una gimcana digital para el evento "micro:bitada Penedès 2026": los grupos de alumnos escriben su escuela, dan de alta su equipo (nombre + miembros, y **el número de grupo 1-5 que les indica el/la docente según el material físico repartido**, elegido en un desplegable), pulsan START y recorren una secuencia de 21 imágenes/pistas con 5 "candados" intercalados (código de 3 o 4 dígitos, palabra de 6 letras, o patrón en una cuadrícula 5x5). Un cronómetro corre durante el reto, y el progreso se envía en tiempo real al Apps Script, visible en `marcador.html`. Al acabar cada grupo, se guarda el registro final y se pasa al siguiente grupo hasta mostrar una clasificación local ordenada por tiempo.

## Mantenibilidad (pendiente si se quiere abordar)

- Sin manejo de errores de carga de imagen ni precarga de la siguiente imagen.
- Las claves de respuesta (`GROUP_KEYS`) son visibles en el código fuente servido al navegador: cualquier alumno con las herramientas de desarrollador puede leer las soluciones. Aceptable para una gimcana escolar, pero vale la pena tenerlo presente.
- `marcador.html` (pantalla del proyector) tiene su propia copia de la misma paleta de colores y no se ha auditado su contraste.
- La fila de "Estat en viu" nunca se borra sola (solo se actualiza in situ por `sessionId`); el filtro de 4h de `marcador.html` es solo de visualización. Si se quiere una limpieza real de cara a repetir el evento otro día, está pendiente de construir.

## Próximos pasos

Ninguna fase pendiente de las 4 solicitadas originalmente (robustez, seguridad, datos en tiempo real, accesibilidad), ni del ajuste de numeración manual tras la prueba real. Opcional, no bloqueante:
- Descripciones `alt` reales para las 21 imágenes de pistas (contenido a redactar por la organización).
- `aria-label` por celda en la cuadrícula 5x5, si se quiere que el reto de patrón sea resoluble sin ver la pantalla.
- Manejo de errores de carga de imagen; revisar contraste de `marcador.html`.
- Limpieza/reinicio de "Estat en viu" entre jornadas del evento, si hace falta.
