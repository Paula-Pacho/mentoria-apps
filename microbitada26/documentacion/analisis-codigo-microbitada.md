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

**Landing page (`index.html`, en la raíz del repo):** creada para el dominio propio `microbitada.cat` (redirigido al repo). Tres botones: "Micro:bitada — Alumnes" (a `microbitada26/microbitada.html`), "Micro:bitada — Docents" (desactivado, "Properament", pendiente de construir — ver más abajo) y "Marcador en viu" (a `microbitada26/marcador.html`), más un enlace directo al codi inicial del Repte 5 a MakeCode. Usa la misma paleta corregida (Fase 3) que `microbitada.html`.

**Fixes en `marcador.html`:**
- El texto `1899-12-30T...Z` que aparecía junto a "Repte X de 5" era un bug de Google Sheets: un texto "mm:ss" se autodetectaba como hora real. Solucionado por partida doble: `setNumberFormat("@")` en el Apps Script (fuerza texto) + una guarda cliente en `formatTemps()` que solo muestra el valor si tiene pinta de "mm:ss" válido.
- El número de grupo (`numGrup`) ahora se muestra también en el marcador, junto al nombre del equipo (`Grup X — Nom`).

**Actualizaciones del 21/09/2026 (batch de 9 tareas pedidas por el usuario):**
1. **Peu de pàgina con logos institucionales y licencia**, en `index.html`, `microbitada.html` y `marcador.html`: logos de financiación (Ministeri d'Educació + Generalitat de Catalunya) y de Mentories 4.0 (en `assets/logos/`), más el texto de licencia CC BY-NC-SA 4.0.
2. **Desplegable de nombre de componentes del grupo** (1-8) sustituye a la antigua entrada de miembros uno a uno en `microbitada.html`: en la práctica cada dispositivo es un único grupo durante toda la actividad, así que ese flujo de "añadir participante" no aportaba nada. El valor se envía como `numComponents` en cada evento, pensado para sumarlo más adelante en el recuento de participantes del apartado docente.
3. **Registro de grupo simplificado a un solo paso**: se eliminaron los botones "Nou Grup"/"FINALITZAR CONFIGURACIÓ" (pensados para dar de alta varios grupos seguidos en un mismo dispositivo, algo que no se usa en la práctica). Ahora, al rellenar número de grupo + nombre + componentes y pulsar "Següent", se pasa directamente a la pantalla de START.
4. **Pantalla final unificada**: tanto el botón rojo "Acaba la micro:bitada!" (corte manual) como completar el repte 5 normal llevan ahora a la misma pantalla (`finishSession()`): un "Resum de la sessió" (temps, reptes assolits, grup, components) encima de la imagen final (21), sin el cronómetro en marcha, y un botón "Torna a la pàgina principal" hacia `https://microbitada.cat/index.html` con el mismo formato de botón grande que usa `index.html`. Se eliminó la antigua "Classificació Final" entre grupos (`step-results`/`finalRanking`), obsoleta desde que el registro es de un solo grupo por dispositivo.
5. **Limpieza automática de "Estat en viu" + renombrado a "Sessions finalitzades"** (`Code.gs`): cualquier sesión que lleve más de 4 horas sin actualizarse y no esté ya "Acabat" se considera abandonada, se marca como acabada, se traslada a la pestaña histórica (renombrada de "Respostes al formulari 1" a "Sessions finalitzades", con migración automática del nombre antiguo si existe) y desaparece de "Estat en viu". Requiere un paso manual **una sola vez**: ejecutar `installarTriggerNeteja` desde el editor de Apps Script para registrar el trigger horario (documentado en la cabecera de `Code.gs`).
6. `doGet(e)` hecho robusto ante `e` indefinido (ocurre al probar la función manualmente desde el editor de Apps Script, sin petición HTTP real).

**Pendiente de este mismo batch, bloqueado por datos que faltan del usuario:**
- Color de fondo y ampliación al máximo de las imágenes de los retos (pensado para Chromebook) — falta que el usuario indique el color deseado.
- ~~Niveles de dificultad (desplegable 1/2 al dar de alta el grupo) + renombrado de imágenes al esquema `R1_1`, `R1_2`, `R1_3`, `R1_3_N2`...~~ — implementado el 21/09/2026 (ver más abajo, "Nomenclatura de imágenes por repte...").
- Página "Micro:bitada — Docents": contador de total de participantes (los datos ya se capturan vía `numComponents`, punto 2) y contraseña de acceso — falta que el usuario indique la contraseña deseada (aviso pendiente: al ser una contraseña en el propio HTML/JS servido al navegador, es solo un filtro disuasorio, no seguridad real).
- Sistema de códigos de sesión tipo Kahoot (alta de centro/grupo-clase con código en vez de nombre de escuela, para poder jugar dos grupos a la vez en el mismo centro): explícitamente aplazado por el usuario a una sesión dedicada aparte.

**Bug real detectado tras desplegar el batch (21/09/2026): fallo al guardar en "Sessions finalitzades".** Al pulsar "Acaba la micro:bitada!" (o completar el repte 5), "Estat en viu" se actualizaba bien pero saltaba el error "Fes una selecció dins d'una sola columna per dur a terme accions al nivell de columna." al guardar el resumen final. Costó localizarlo porque `gestionarEvent()` captura la excepción y la devuelve como JSON normal (ok:false) — Apps Script nunca lo marcaba como "execución fallida" en `Execucions`, así que hubo que añadir temporalmente el `stack` a la respuesta para verlo en el aviso del navegador.

Se probaron dos hipótesis, verificadas en directo contra el `/exec` real (con el navegador integrado de Claude, que sí tiene salida a `script.google.com`, a diferencia de la terminal del Mac del usuario, bloqueada por el proxy del centro):
- **Primera hipótesis (incorrecta, pero inofensiva):** `sheet.appendRow()` en "Sessions finalitzades" chocaría con la restricción de columna por venir esa pestaña de un Google Form. Se sustituyó por `getRange(...).setValues(...)`. Al volver a probar en directo tras redesplegar, el mismo error seguía apareciendo: esta no era la causa real (el cambio se mantuvo igualmente, es más explícito).
- **Causa real, confirmada en directo:** `registrarRespostaFinal()` formateaba de golpe el rango `"D:I"` (6 columnas) con `setNumberFormat("@")`. El mensaje de error, leído literalmente ("selecciona dins d'una sola columna"), apunta justo a eso: en un full vinculat a un Form, una acción de format que abasta *més d'una columna sencera* topa amb aquesta restricció; una columna sola ("F:F", com ja fèiem a "Estat en viu", que mai ha donat error) no hi topa. **Solución:** formatear cada columna por separado, en un bucle sobre `["D:D","E:E","F:F","G:G","H:H","I:I"]`. Repetida la prueba en directo tras redesplegar: `{"ok":true}`, confirmado en producción.

**Código limpio y flujo de finalización unificado (21/09/2026, mismo día):** con el bug de arriba ya resuelto, se pidió una limpieza de `Code.gs` y un ajuste del flujo de fin de partida:
- Eliminado `doPost(e)` (el joc només fa servir GET; ja no calia mantenir-lo "per compatibilitat") y la migración automática del nombre antiguo de pestaña `"Respostes al formulari 1"` en `obtenirFullRespostes()` (migración ja completada fa temps, era codi mort).
- **Les dues vies de finalització (repte 5 completat / botó vermell "Acaba la micro:bitada!") ara mostren imatges diferents** a la mateixa pantalla de resum: imatge 20 si s'ha completat el repte 5 amb normalitat, imatge 21 si s'ha premut el botó d'emergència (`finishSession(imgFinal)` a `microbitada.html`, cridada com `finishSession(TOTAL_IMAGES - 1)` o `finishSession(TOTAL_IMAGES)` respectivament).
- **En qualsevol dels dos casos, la sessió desapareix immediatament d'"Estat en viu" en acabar** (funció nova `eliminarDeEstatEnViu(sessionId)`), en lloc de quedar-hi marcada com "Acabat": `gestionarEvent()` ara fa `registrarRespostaFinal(dades)` (escriu a "Sessions finalitzades") i tot seguit `eliminarDeEstatEnViu(dades.sessionId)` (esborra la fila d'"Estat en viu"), per aquest ordre — si fallés el primer pas, la fila no es perd. `netejarSessionsCaducades()` (la neteja horària de sessions abandonades sense finalitzar) ja no necessita comprovar `estat === "Acabat"`, perquè amb aquest canvi mai queda cap sessió acabada a "Estat en viu" esperant la neteja.

**Bug "se duplican pantallas de finalización" — resuelto (confirmado por el usuario el 21/09/2026, en pruebas tras el batch de abajo).** Nunca se llegó a diagnosticar directamente (quedó aplazado varias veces: primero por el error de guardado, luego por la petición de limpieza de código). El usuario confirmó en pruebas que, tras los cambios de "Repte 5 acaba directament la gimcana" (ver más abajo) — que eliminan el botón "ACABAR GIMCANA" y el paso intermedio de navegar por más imágenes tras superar el repte 5 — el bug ya no se reproduce. Hipótesis razonable de la causa: ese botón, alcanzable justo después de completar el repte 5 navegando por un par de imágenes más, dejaba abierta la puerta a pulsarlo más de una vez (doble clic, o volver a alcanzar esa pantalla tras navegar atrás/adelante) y disparar `finishSession()` por duplicado; al convertir la resolución del repte 5 en la única vía que finaliza automáticamente la partida (sin botón ni pasos intermedios), esa ventana desaparece.

**Nomenclatura de imágenes por repte, pantalla previa a START y niveles de dificultad (21/09/2026, continuación de la sesión):**
- **`GAME_FLOW` reestructurado**: en vez de un contador global de imágenes (`TOTAL_IMAGES`/`IMAGES_BEFORE_LOCK` + el offset `imgTrigger`), cada repte lleva ahora su propia lista de nombres de imagen (`images: ['R1_1','R1_2','R1_3']`, etc.). El candado aparece solo al llegar al final de esa lista — ya no hace falta calcular ninguna posición global, y añadir/quitar imágenes de un repte no afecta a los demás. Reparto real: repte 1-4 con 3 imágenes cada uno, repte 5 con 4.
- **Imágenes P1-P3**, nuevas: se ven dentro de la pantalla "Preparats, START", antes de pulsar START (con el cronómetro todavía parado), reutilizando el mismo visor con Enrere/Endavant; en la última (P3), "Endavant" deja paso al botón START, que es el que realmente arranca el cronómetro.
- **Repte 5 resuelto acaba la gimcana directamente**: se eliminó el botón "ACABAR GIMCANA" (redundante — antes había que superar el repte 5 y además navegar hasta la última imagen y pulsar ese botón). Ahora, al validar correctamente el repte 5 (el último de `GAME_FLOW`), `validateLock()` llama directamente a `finishSession('F1')`.
- **Nombres de las imágenes finales**: `F1` (repte 5 resuelto con normalidad) y `F0` (botón rojo de emergencia "Acaba la micro:bitada!", en cualquier punto de la partida).
- **Nivel de dificultad**: nuevo desplegable "Nivell de dificultat" (1/2) al dar de alta el grupo, guardado en `allGroups[].level` y enviado al Apps Script como campo `nivell` (nueva columna en "Estat en viu" y "Sessions finalitzades", igual que `numGrup`). `loadImageWithLevel(img, nombre)` prueba primero `<nombre>_N2.jpg` cuando el grupo ha elegido nivel 2 (funciona también para P1-P3, no solo para las imágenes de repte) y, si esa variante no existe (error de carga), cae automáticamente a la imagen normal de nivel 1 — así no hace falta crear la variante N2 de todas las imágenes, solo de las que se quieran diferenciar.
- **Botón "Torna a la pàgina principal" corregido**: sobresalía del contenedor en la pantalla final. Causa real: la clase `.btn-landing` (copiada de `index.html`) combina `width:100%` con `padding`, y `index.html` tiene una regla global `* { box-sizing: border-box; }` que `microbitada.html` nunca tuvo — sin ella, el padding se suma al 100% del ancho y desborda. Se sustituyó por `.btn-tornar-header`, más compacto, con `box-sizing:border-box` explícito, y se movió de debajo de todo a la cabecera de la pantalla de resumen (antes del "Resum de la sessió"), tal como pidió el usuario.
- Imágenes ya subidas por el usuario al repo con esta nomenclatura (`P1`-`P3`, `R1_1`..`R5_4`, `F0`, `F1`, y variantes `_N2` para varias de ellas) — nombres verificados contra el código, coinciden exactamente.

**Pendiente del lado Apps Script:** el `Code.gs` limpio (con el fix de columna + el nuevo flujo de finalización) está en el archivo de referencia `microbitada26/apps-script/Code.gs` y ya verificado en directo contra el despliegue real, pero **cada vez que se edita hay que volver a copiarlo al editor de Apps Script real y redesplegar ("Nova versió")** para que los cambios surtan efecto en producción — la primera vez que se enganchó esta línea de código (con la neteja automàtica d'"Estat en viu") ya se ejecutó `installarTriggerNeteja` una sola vez; no hace falta repetirlo en las siguientes ediciones de código, solo redesplegar.

Nota operativa: los commits de este trabajo viven en el repo `mentoria-apps` (GitHub, `Paula-Pacho/mentoria-apps`, público); el usuario los sube con `git push` desde su propio Mac, ya que esta sesión no tiene acceso de red a GitHub.

Ver también `notas-despliegue-apps-script.md` para los detalles de configuración de Apps Script (permisos de ejecución/acceso, versión de despliegue, GET vs POST) que costó bastante identificar.

---

Fuente original: `microbitada.html` (carpeta "Mentoria" del usuario, luego movida/renombrada a `mentoria-apps/microbitada26/`), HTML/CSS/JS en un único fichero, con imágenes ahora en el propio repo, un Apps Script propio como backend, y una pantalla de marcador aparte.

## Qué hace la app

Es una gimcana digital para el evento "micro:bitada Penedès 2026": los grupos de alumnos escriben su escuela, dan de alta su equipo (nombre, número de grupo 1-5 que les indica el/la docente según el material físico repartido, y número de componentes, todo en desplegables, en un solo paso), pulsan START y recorren una secuencia de 21 imágenes/pistas con 5 "candados" intercalados (código de 3 o 4 dígitos, palabra de 6 letras, o patrón en una cuadrícula 5x5). Un cronómetro corre durante el reto, y el progreso se envía en tiempo real al Apps Script, visible en `marcador.html`. Al acabar (normal o mediante el botón de corte manual), se guarda el registro final y se muestra un resumen de la sesión con un botón para volver a la página principal.

## Mantenibilidad (pendiente si se quiere abordar)

- Sin manejo de errores de carga de imagen ni precarga de la siguiente imagen.
- Las claves de respuesta (`GROUP_KEYS`) son visibles en el código fuente servido al navegador: cualquier alumno con las herramientas de desarrollador puede leer las soluciones. Aceptable para una gimcana escolar, pero vale la pena tenerlo presente.
- `marcador.html` (pantalla del proyector) tiene su propia copia de la misma paleta de colores y no se ha auditado su contraste.
- ~~La fila de "Estat en viu" nunca se borra sola~~ — resuelto el 21/09/2026: `netejarSessionsCaducades()` la marca como acabada y la traslada al histórico pasadas 4h sin actividad (ver arriba). El filtro de 4h de `marcador.html` se mantiene como red de seguridad adicional, ya redundante en la mayoría de casos.

## Próximos pasos

Ninguna fase pendiente de las 4 solicitadas originalmente (robustez, seguridad, datos en tiempo real, accesibilidad), ni del ajuste de numeración manual tras la prueba real. Del batch del 21/09/2026 quedan pendientes: color de fondo/tamaño de imágenes, página Docents con contador y contraseña, y códigos de sesión tipo Kahoot (estos tres bloqueados por datos/decisiones del usuario). Niveles de dificultad y el bug de pantallas de finalización duplicadas, que también estaban en esa lista, ya están resueltos. Opcional, no bloqueante:
- Descripciones `alt` reales para las 21 imágenes de pistas (contenido a redactar por la organización).
- `aria-label` por celda en la cuadrícula 5x5, si se quiere que el reto de patrón sea resoluble sin ver la pantalla.
- Manejo de errores de carga de imagen; revisar/actualizar la paleta de `marcador.html` (todavía usa los valores de contraste anteriores a la Fase 3).
