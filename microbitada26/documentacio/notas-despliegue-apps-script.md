# Notes de desplegament — Apps Script de la micro:bitada

Registre dels problemes reals que va costar diagnosticar en posar en marxa `microbitada26/apps-script/Code.gs` (el backend de dades en temps real), per no repetir el procés la propera vegada que calgui tocar-lo.

## Checklist per desplegar una implementació web d'aquest script

A "Implementar" → "Gestiona les implementacions" → llapis (editar):

1. **"Executar com"** ha de ser **"Jo (el teu compte)"** — no "Usuari que accedeix a l'aplicació web". Si es deixa en la segona, l'script intenta executar-se amb els permisos de qui fa la petició (ningú, en el cas d'una web pública), i dona error 401.
2. **"Qui té accés"** ha de ser **"Qualsevol persona"** — no "Qualsevol usuari amb compte de Google". Si es deixa en la segona, també dona 401 per a peticions anònimes (que és com arriba la petició des del navegador d'un alumne).
3. **"Versió"** — aquest és el que més vegades ens va fer perdre el fil: després d'editar el codi, cal canviar explícitament aquest desplegable a **"Nova versió"** abans de prémer "Implementar". Si es deixa en un número de versió concret (per exemple "Versió 1"), Google continua servint el codi congelat d'aquella versió antiga per sempre, encara que l'editor mostri codi diferent i encara que es premi "Implementar" repetidament. Símptoma: la resposta de l'script no canvia per molt que s'editi el codi, i una prova amb un paràmetre clarament invàlid (`?action=test123`) continua retornant la resposta de la branca per defecte en lloc d'un error — això confirma que el codi en execució no és el que es veu a l'editor.

La URL del `/exec` no canvia entre versions mentre s'editi la mateixa implementació (només canvia si es crea una implementació nova des de zero), així que no cal tocar la URL desada a `microbitada.html`/`marcador.html` en redesplegar — només assegurar-se dels tres punts d'aquí sobre.

## Altres troballes durant la posada en marxa

- **La URL "de domini"** (`.../a/macros/xtec.cat/s/.../exec`) que Google mostra per defecte a un compte de Workspace pot comportar-se de manera menys fiable per a peticions anònimes que la **URL genèrica** (`.../macros/s/.../exec`), encara que l'ID d'implementació sigui el mateix. Fem servir la genèrica.
- **POST vs GET**: els events del joc (`sendEvent` a `microbitada.html`) es envien per GET, amb les dades com a paràmetres a la URL, no per POST amb cos JSON. Apps Script no sempre retorna la capçalera `Access-Control-Allow-Origin` a la resposta d'un POST (encara que el POST s'executi bé al servidor), la qual cosa fa que el navegador bloquegi la lectura de la resposta amb un error de CORS. Amb GET això no passa. Per aquest motiu `doPost` es va acabar eliminant del tot de `Code.gs` (vegeu `analisis-codigo-microbitada.md`): el joc només ha fet servir GET des de fa temps, i mantenir-lo "per compatibilitat" ja no aportava res.
- **Provar en local**: obrir els `.html` amb doble clic (`file://`) no serveix per provar això — cal servir-los amb un servidor local (`python3 -m http.server 8000` des de la carpeta, i obrir `http://localhost:8000/...`), perquè l'origen "null" d'una pàgina `file://` pot bloquejar les peticions sortints segons el navegador.
