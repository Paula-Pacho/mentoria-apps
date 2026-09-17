# Notas de despliegue — Apps Script de la micro:bitada

Registro de los problemas reales que costó diagnosticar al poner en marcha `microbitada26/apps-script/Code.gs` (el backend de datos en tiempo real), para no repetir el proceso la próxima vez que haga falta tocarlo.

## Checklist para desplegar una implementación web de este script

En "Implementar" → "Gestionar implementacions" → lápiz (editar):

1. **"Executar com"** debe ser **"Jo (tu-email@xtec.cat)"** — no "Usuario que accede a la aplicación web". Si se deja en la segunda, el script intenta ejecutarse con los permisos de quien hace la petición (nadie, en el caso de una web pública), y da error 401.
2. **"Qui té accés"** debe ser **"Qualsevol persona"** — no "Cualquier usuario con cuenta de Google". Si se deja en la segunda, también da 401 para peticiones anónimas (que es como llega la petición desde el navegador de un alumno).
3. **"Versió"** — este es el que más veces nos hizo perder el hilo: tras editar el código, hay que cambiar explícitamente este desplegable a **"Nova versió"** antes de pulsar "Implementar". Si se deja en un número de versión concreto (por ejemplo "Versió 1"), Google sigue sirviendo el código congelado de esa versión antigua para siempre, aunque el editor muestre código distinto y aunque se pulse "Implementar" repetidamente. Sintoma: la respuesta del script no cambia por mucho que se edite el código, y una prueba con un parámetro claramente inválido (`?action=test123`) sigue devolviendo la respuesta de la rama por defecto en vez de un error — eso confirma que el código en ejecución no es el que se ve en el editor.

La URL del `/exec` no cambia entre versiones mientras se edite la misma implementación (solo cambia si se crea una implementación nueva desde cero), así que no hace falta tocar la URL guardada en `microbitada.html`/`marcador.html` al redesplegar — solo asegurarse de los tres puntos de arriba.

## Otros hallazgos durante la puesta en marcha

- **La URL "de dominio"** (`.../a/macros/xtec.cat/s/.../exec`) que Google muestra por defecto a una cuenta de Workspace puede comportarse de forma menos fiable para peticiones anónimas que la **URL genérica** (`.../macros/s/.../exec`), aunque el ID de implementación sea el mismo. Usamos la genérica.
- **POST vs GET**: los eventos del joc (`sendEvent` en `microbitada.html`) se mandan por GET, con los datos como parámetros en la URL, no por POST con cuerpo JSON. Apps Script no siempre devuelve la cabecera `Access-Control-Allow-Origin` en la respuesta a un POST (aunque el POST se ejecute bien en el servidor), lo que hace que el navegador bloquee la lectura de la respuesta con un error de CORS. Con GET esto no pasa. `doPost` se mantiene en el código por compatibilidad, pero el juego ya no lo usa.
- **Probar en local**: abrir los `.html` con doble clic (`file://`) no sirve para probar esto — hay que servirlos con un servidor local (`python3 -m http.server 8000` desde la carpeta, y abrir `http://localhost:8000/...`), porque el origen "null" de una página `file://` puede bloquear las peticiones salientes según el navegador.
