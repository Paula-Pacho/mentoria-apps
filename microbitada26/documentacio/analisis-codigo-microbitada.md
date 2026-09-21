# Anàlisi del codi — microbitada.html

## Estat (actualitzat)

**Fase 1 — Robustesa i seguretat: completada.**
1. Numeració d'equip (vegeu més avall, canviada a manual després de proves reals).
2. XSS a la classificació final corregit (`textContent` en lloc de `innerHTML`).
3. (fusionat amb el punt 1).
4. Cronòmetre protegit contra doble interval.
5. `nav()` protegida contra índex d'imatge negatiu.
6. Còpia de seguretat del progrés a `localStorage` durant un repte en marxa, amb recuperació en recarregar.

**Fase 2 — Dades en temps real: completada i provada en producció.** Arquitectura final:
- `microbitada26/apps-script/Code.gs` — desplegat com a aplicació web (vegeu `notes-desplegament-apps-script.md` per al checklist de desplegament, que va costar força depurar).
- `microbitada.html` avisa per GET cada cop que se supera un candau (no només al final), amb un `sessionId` únic per partida, i captura els 5 reptes.
- `microbitada26/marcador.html` — pantalla en directe per al projector, filtrada per escola, confirmada funcionant.
- La pestanya "Estat en viu" del Sheet s'actualitza en directe per grup; la pestanya històrica es completa en finalitzar cada grup.

**Fase 3 — Accessibilitat: completada.** Canvis aplicats (un commit per punt):
1. Quadrícula 5x5 convertida de `<div onclick>` a `<button>` reals: focus de teclat, activació amb Enter/Espai, `aria-pressed` per cel·la i `role="group"` amb etiqueta descriptiva al contenidor.
2. Imatge de cada pista: sostre d'amplada del contenidor ampliat en pantalles grans (`@media min-width:900px`, fins a 900px) i visor a pantalla completa en tocar/prémer la imatge. No formaven part del checklist original d'accessibilitat, van sorgir d'una petició de l'usuari sobre baixa visió.
3. `<label class="sr-only">` enllaçada per `for`/`id` als 3 camps de text; el disseny visual no canvia.
4. Cel·les de la quadrícula ampliades de 40px a 44px (mínim recomanat per a objectius tàctils), separació de 5px a 6px.
5. Contrast de color corregit als botons (mesurat amb la fórmula de luminància de WCAG, mínim AA 4.5:1/3:1): taronja i verd mantenen el seu fons i passen el text a fosc; blau i vermell s'enfosqueixen lleugerament mantenint text blanc.

**Limitacions conegudes, decisió conscient de l'usuari — no bloquejants:**
- Les 25 cel·les de la quadrícula no porten `aria-label` individual (p. ex. "Fila 2, columna 3"): decisió explícita de l'usuari. El repte del patró continua sense ser resoluble només amb lector de pantalla.
- La imatge de cada pista (`#current-img`) continua sense atribut `alt` real (contingut, no decoratiu); pendent si es vol abordar en una altra sessió.

**Actualitzacions posteriors, després de la primera prova real amb grups (18/09/2026):**

1. **Bug detectat a la primera prova real: numeració automàtica trencada amb multidispositiu.** La numeració de la Fase 1 assumia que els 5 grups es registraven al mateix dispositiu, un darrere l'altre (1r validat = equip 1, etc.). En l'ús real cada grup juga des del seu propi dispositiu, així que cada un registra un únic grup i aquest grup sempre "és el primer" al seu dispositiu → tots acabaven amb `GROUP_KEYS["1"]`, sense relació amb el material físic repartit. **Solució:** desplegable manual (1-5) al costat del nom del grup, obligatori (avisa amb `alert` si no es tria), triat per qui reparteix el material. Substitueix del tot la numeració automàtica (es va eliminar `groupNumberFor()`).
2. **Columna de doble comprovació al Sheet:** el número de grup triat viatja a `sendEvent()` com a `numGrup` i apareix com a columna nova tant a "Estat en viu" (9a columna) com a la pestanya històrica (10a, "Número de grup"), amb comprovació de capçalera per no trencar l'històric ja existent.
3. **Migració d'imatges a repositori propi:** `BASE_URL` va passar d'un repositori extern a `Paula-Pacho/mentoria-apps/microbitada26/imatges` (propi, públic). Aquest pas va incloure, en aquell moment, una seqüència numerada d'imatges amb `GAME_FLOW` calculat a partir d'un total i d'un llistat d'imatges abans de cada candau; aquest esquema es va substituir més endavant pel de noms per repte (vegeu "Nomenclatura d'imatges per repte..." més avall).
4. Es va retirar l'enllaç "Programació" (MakeCode) — ja no calia.
5. **Documentació duplicada dins del propi repositori**, a `microbitada26/documentacio/` (abans només vivia en aquest projecte de Claude), perquè qualsevol mentor/a de l'equip la consulti sense dependre d'una eina externa.
6. **Allotjament via GitHub Pages** (explicat a l'usuari, no requereix canvis de codi): activat a Settings → Pages → Deploy from branch `main` / root, i posteriorment amb domini propi `microbitada.cat` (vegeu CNAME al README principal).

**Pàgina d'inici (`index.html`, a l'arrel del repositori):** creada per al domini propi `microbitada.cat`. Tres botons: "Micro:bitada — Alumnes" (a `microbitada26/microbitada.html`), "Micro:bitada — Docents" (desactivat, "Properament", pendent de construir — vegeu més avall) i "Marcador en viu" (a `microbitada26/marcador.html`), més un enllaç directe al codi inicial del Repte 5 a MakeCode. Fa servir la mateixa paleta corregida (Fase 3) que `microbitada.html`.

**Correccions a `marcador.html`:**
- El text `1899-12-30T...Z` que apareixia al costat de "Repte X de 5" era un bug de Google Sheets: un text "mm:ss" s'autodetectava com a hora real. Solucionat per partida doble: `setNumberFormat("@")` a l'Apps Script (força text) + una guarda al client a `formatTemps()` que només mostra el valor si té pinta de "mm:ss" vàlid.
- El número de grup (`numGrup`) ara es mostra també al marcador, al costat del nom de l'equip (`Grup X — Nom`).

**Actualitzacions del 21/09/2026 (bloc de 9 tasques demanades per l'usuari):**
1. **Peu de pàgina amb logos institucionals i llicència**, a `index.html`, `microbitada.html` i `marcador.html`: logos de finançament (Ministeri d'Educació + Generalitat de Catalunya) i de Mentories 4.0 (a `assets/logos/`), més el text de llicència CC BY-NC-SA 4.0.
2. **Desplegable de nombre de components del grup** (1-8) substitueix l'antiga entrada de membres un a un a `microbitada.html`: a la pràctica cada dispositiu és un únic grup durant tota l'activitat, així que aquell flux d'"afegir participant" no aportava res. El valor s'envia com a `numComponents` a cada event, pensat per sumar-lo més endavant al recompte de participants de l'apartat docent.
3. **Registre de grup simplificat a un sol pas**: es van eliminar els botons "Nou Grup"/"FINALITZAR CONFIGURACIÓ" (pensats per donar d'alta diversos grups seguits en un mateix dispositiu, cosa que no s'utilitza a la pràctica). Ara, en omplir número de grup + nom + components i prémer "Següent", es passa directament a la pantalla de START.
4. **Pantalla final unificada**: tant el botó vermell "Acaba la micro:bitada!" (tall manual) com completar el repte 5 normal porten ara a la mateixa pantalla (`finishSession()`): un "Resum de la sessió" (temps, reptes assolits, grup, components) sobre la imatge final, sense el cronòmetre en marxa, i un botó "Torna a la pàgina principal" cap a `https://microbitada.cat/index.html`. Es va eliminar l'antiga "Classificació Final" entre grups, obsoleta des que el registre és d'un sol grup per dispositiu.
5. **Neteja automàtica d'"Estat en viu" + renom a "Sessions finalitzades"** (`Code.gs`): qualsevol sessió que porti més de 4 hores sense actualitzar-se i no estigui ja acabada es considera abandonada, es marca com a acabada, es trasllada a la pestanya històrica (renombrada de l'antic nom del Form a "Sessions finalitzades", amb migració automàtica del nom antic si existia) i desapareix d'"Estat en viu". Va requerir un pas manual **una sola vegada**: executar `installarTriggerNeteja` des de l'editor d'Apps Script per registrar el trigger horari (documentat a la capçalera de `Code.gs`).
6. `doGet(e)` fet robust davant `e` indefinit (passa en provar la funció manualment des de l'editor d'Apps Script, sense petició HTTP real).

**Pendent d'aquest mateix bloc, bloquejat per dades que falten de l'usuari:**
- Color de fons i ampliació al màxim de les imatges dels reptes (pensat per a Chromebook) — falta que l'usuari indiqui el color desitjat.
- ~~Nivells de dificultat (desplegable 1/2 en donar d'alta el grup) + renom d'imatges a l'esquema `R1_1`, `R1_2`, `R1_3`, `R1_3_N2`...~~ — implementat el 21/09/2026 (vegeu més avall, "Nomenclatura d'imatges per repte...").
- Pàgina "Micro:bitada — Docents": comptador de total de participants (les dades ja es capturen via `numComponents`, punt 2) i contrasenya d'accés — falta que l'usuari indiqui la contrasenya desitjada (avís pendent: en ser una contrasenya al mateix HTML/JS servit al navegador, és només un filtre dissuasori, no seguretat real).
- Sistema de codis de sessió tipus Kahoot (alta de centre/grup-classe amb codi en lloc de nom d'escola, per poder jugar dos grups alhora al mateix centre): explícitament ajornat per l'usuari a una sessió dedicada a part.

**Bug real detectat després de desplegar el bloc (21/09/2026): error en desar a "Sessions finalitzades".** En prémer "Acaba la micro:bitada!" (o completar el repte 5), "Estat en viu" s'actualitzava bé però saltava l'error "Fes una selecció dins d'una sola columna per dur a terme accions al nivell de columna." en desar el resum final. Va costar localitzar-lo perquè `gestionarEvent()` captura l'excepció i la retorna com a JSON normal (ok:false) — Apps Script mai el marcava com a "execució fallida" a "Execucions", així que es va haver d'afegir temporalment el `stack` a la resposta per veure'l a l'avís del navegador.

Es van provar dues hipòtesis, verificades en directe contra el `/exec` real (amb el navegador integrat de Claude, que sí té sortida a `script.google.com`, a diferència del terminal del Mac de l'usuari, bloquejat pel proxy del centre):
- **Primera hipòtesi (incorrecta, però inofensiva):** `sheet.appendRow()` a "Sessions finalitzades" xocaria amb la restricció de columna per venir aquesta pestanya d'un Google Form. Es va substituir per `getRange(...).setValues(...)`. En tornar a provar en directe després de redesplegar, el mateix error continuava apareixent: aquesta no era la causa real (el canvi es va mantenir igualment, és més explícit).
- **Causa real, confirmada en directe:** `registrarRespostaFinal()` formatava de cop el rang `"D:I"` (6 columnes) amb `setNumberFormat("@")`. El missatge d'error, llegit literalment ("selecciona dins d'una sola columna"), apunta just a això: en un full vinculat a un Form, una acció de format que abasta *més d'una columna sencera* topa amb aquesta restricció; una columna sola ("F:F", com ja fèiem a "Estat en viu", que mai ha donat error) no hi topa. **Solució:** formatar cada columna per separat, en un bucle sobre `["D:D","E:E","F:F","G:G","H:H","I:I"]`. Repetida la prova en directe després de redesplegar: `{"ok":true}`, confirmat en producció.

**Codi net i flux de finalització unificat (21/09/2026, mateix dia):** amb el bug d'aquí sobre ja resolt, es va demanar una neteja de `Code.gs` i un ajust del flux de final de partida:
- Eliminat `doPost(e)` (el joc només fa servir GET; ja no calia mantenir-lo "per compatibilitat") i la migració automàtica del nom antic de pestanya (migració ja completada feia temps, era codi mort).
- **Les dues vies de finalització (repte 5 completat / botó vermell "Acaba la micro:bitada!") ara mostren imatges diferents** a la mateixa pantalla de resum: imatge `F1` si s'ha completat el repte 5 amb normalitat, imatge `F0` si s'ha premut el botó d'emergència.
- **En qualsevol dels dos casos, la sessió desapareix immediatament d'"Estat en viu" en acabar** (funció nova `eliminarDeEstatEnViu(sessionId)`), en lloc de quedar-hi marcada com "Acabat": `gestionarEvent()` ara fa `registrarRespostaFinal(dades)` (escriu a "Sessions finalitzades") i tot seguit `eliminarDeEstatEnViu(dades.sessionId)` (esborra la fila d'"Estat en viu"), per aquest ordre — si fallés el primer pas, la fila no es perd. `netejarSessionsCaducades()` (la neteja horària de sessions abandonades sense finalitzar) ja no necessita comprovar l'estat "Acabat", perquè amb aquest canvi mai queda cap sessió acabada a "Estat en viu" esperant la neteja.

**Bug "es dupliquen pantalles de finalització" — resolt (confirmat per l'usuari el 21/09/2026, en proves després del bloc de sota).** Mai es va arribar a diagnosticar directament (va quedar ajornat diverses vegades: primer per l'error de desat, després per la petició de neteja de codi). L'usuari va confirmar en proves que, després dels canvis de "Repte 5 acaba directament la gimcana" (vegeu més avall) — que eliminen el botó "ACABAR GIMCANA" i el pas intermedi de navegar per més imatges després de superar el repte 5 — el bug ja no es reprodueix. Hipòtesi raonable de la causa: aquell botó, accessible just després de completar el repte 5 navegant per un parell d'imatges més, deixava oberta la porta a prémer-lo més d'una vegada (doble clic, o tornar a arribar a aquella pantalla navegant enrere/endavant) i disparar `finishSession()` per duplicat; en convertir la resolució del repte 5 en l'única via que finalitza automàticament la partida (sense botó ni passos intermedis), aquesta finestra desapareix.

**Nomenclatura d'imatges per repte, pantalla prèvia a START i nivells de dificultat (21/09/2026, continuació de la sessió):**
- **`GAME_FLOW` reestructurat**: en lloc d'un comptador global d'imatges amb un offset acumulat, cada repte porta ara la seva pròpia llista de noms d'imatge (`images: ['R1_1','R1_2','R1_3']`, etc.). El candau apareix només en arribar al final d'aquesta llista — ja no cal calcular cap posició global, i afegir/treure imatges d'un repte no afecta els altres. Repartiment real: reptes 1-4 amb 3 imatges cada un, repte 5 amb 4.
- **Imatges P1-P3**, noves: es veuen dins la pantalla "Preparats, START", abans de prémer START (amb el cronòmetre encara aturat), reutilitzant el mateix visor amb Enrere/Endavant; a la darrera (P3), "Endavant" deixa pas al botó START, que és el que realment arrenca el cronòmetre.
- **Repte 5 resolt acaba la gimcana directament**: es va eliminar el botó "ACABAR GIMCANA" (redundant — abans calia superar el repte 5 i a més navegar fins a la darrera imatge i prémer aquell botó). Ara, en validar correctament el repte 5 (l'últim de `GAME_FLOW`), `validateLock()` crida directament `finishSession('F1')`.
- **Noms de les imatges finals**: `F1` (repte 5 resolt amb normalitat) i `F0` (botó vermell d'emergència "Acaba la micro:bitada!", en qualsevol punt de la partida).
- **Nivell de dificultat**: nou desplegable "Nivell de dificultat" (1/2) en donar d'alta el grup, desat a `allGroups[].level` i enviat a l'Apps Script com a camp `nivell` (nova columna a "Estat en viu" i "Sessions finalitzades", igual que `numGrup`). `loadImageWithLevel(img, nom)` prova primer `<nom>_N2.jpg` quan el grup ha triat nivell 2 (funciona també per a P1-P3, no només per a les imatges de repte) i, si aquesta variant no existeix (error de càrrega), cau automàticament a la imatge normal de nivell 1 — així no cal crear la variant N2 de totes les imatges, només de les que es vulguin diferenciar.
- **Botó "Torna a la pàgina principal" corregit**: sobresortia del contenidor a la pantalla final. Causa real: la classe antiga combinava `width:100%` amb `padding`, i `index.html` té una regla global `* { box-sizing: border-box; }` que `microbitada.html` mai havia tingut — sense ella, el padding se suma al 100% de l'amplada i desborda. Es va substituir per `.btn-tornar-header`, més compacte, amb `box-sizing:border-box` explícit, i es va moure de sota de tot a la capçalera de la pantalla de resum (abans del "Resum de la sessió"), tal com va demanar l'usuari.
- Imatges ja pujades per l'usuari al repositori amb aquesta nomenclatura (`P1`-`P3`, `R1_1`..`R5_4`, `F0`, `F1`, i variants `_N2` per a diverses d'elles) — noms verificats contra el codi, coincideixen exactament. Vegeu `microbitada26/imatges/README.md` per al detall complet.

**Pendent del costat d'Apps Script:** el `Code.gs` net (amb el fix de columna + el nou flux de finalització) és a l'arxiu de referència `microbitada26/apps-script/Code.gs` i ja verificat en directe contra el desplegament real, però **cada vegada que s'edita cal tornar-lo a copiar a l'editor d'Apps Script real i redesplegar ("Nova versió")** perquè els canvis facin efecte en producció — la primera vegada que es va enganxar aquesta línia de codi (amb la neteja automàtica d'"Estat en viu") ja es va executar `installarTriggerNeteja` una sola vegada; no cal repetir-ho a les edicions de codi següents, només redesplegar.

Nota operativa: els commits d'aquest treball viuen al repositori `mentoria-apps` (GitHub, `Paula-Pacho/mentoria-apps`, públic); l'usuari els puja amb `git push` des del seu propi Mac, ja que aquesta sessió no té accés de xarxa a GitHub.

Vegeu també `notes-desplegament-apps-script.md` per als detalls de configuració d'Apps Script (permisos d'execució/accés, versió de desplegament, GET vs POST) que va costar força identificar.

---

Font original: `microbitada.html` (carpeta "Mentoria" de l'usuari, després moguda/renombrada a `mentoria-apps/microbitada26/`), HTML/CSS/JS en un únic fitxer, amb imatges ara al propi repositori, un Apps Script propi com a backend, i una pantalla de marcador a part.

## Què fa l'aplicació

És una gimcana digital per a l'esdeveniment "micro:bitada Penedès 2026": els grups d'alumnes escriuen la seva escola, donen d'alta el seu equip (nom, número de grup 1-5 que els indica el/la docent segons el material físic repartit, nombre de components i nivell de dificultat, tot en desplegables, en un sol pas), premen START i recorren una sèrie d'imatges de presentació (P1-P3) i, després, 5 reptes consecutius, cadascun amb les seves pròpies imatges de pista (3 o 4 per repte) i un "candau" final (codi de 3 o 4 dígits, paraula de 6 lletres, o patró en una quadrícula 5x5). Un cronòmetre corre durant els reptes, i el progrés s'envia en temps real a l'Apps Script, visible a `marcador.html`. En resoldre el repte 5, o en acabar mitjançant el botó de tall manual, es desa el registre final i es mostra un resum de la sessió amb un botó per tornar a la pàgina principal.

## Mantenibilitat (pendent si es vol abordar)

- Sense gestió d'errors de càrrega d'imatge ni precàrrega de la imatge següent.
- Les claus de resposta (`GROUP_KEYS`) són visibles al codi font servit al navegador: qualsevol alumne amb les eines de desenvolupador pot llegir les solucions. Acceptable per a una gimcana escolar, però val la pena tenir-ho present.
- `marcador.html` (pantalla del projector) té la seva pròpia còpia de la mateixa paleta de colors i no se n'ha auditat el contrast.
- ~~La fila d'"Estat en viu" mai es marca com esborrada sola~~ — resolt el 21/09/2026: `netejarSessionsCaducades()` la trasllada a l'històric passades 4h sense activitat, i des del mateix dia les sessions acabades desapareixen d'"Estat en viu" a l'instant (vegeu més amunt). El filtre de 4h de `marcador.html` es manté com a xarxa de seguretat addicional, ja redundant en la majoria de casos.

## Pròxims passos

Cap fase pendent de les 4 sol·licitades originalment (robustesa, seguretat, dades en temps real, accessibilitat), ni de l'ajust de numeració manual després de la prova real. Del bloc del 21/09/2026 queden pendents: color de fons/mida de les imatges, pàgina Docents amb comptador i contrasenya, i codis de sessió tipus Kahoot (aquests tres bloquejats per dades/decisions de l'usuari). Nivells de dificultat i el bug de pantalles de finalització duplicades, que també eren en aquesta llista, ja estan resolts. Opcional, no bloquejant:
- Descripcions `alt` reals per a les imatges de pistes (contingut a redactar per l'organització).
- `aria-label` per cel·la a la quadrícula 5x5, si es vol que el repte de patró sigui resoluble sense veure la pantalla.
- Gestió d'errors de càrrega d'imatge; revisar/actualitzar la paleta de `marcador.html` (encara fa servir els valors de contrast anteriors a la Fase 3).
