# micro:bitada Penedès 2026

Aquest repositori conté el codi de la **micro:bitada**, una gimcana/joc de pistes per a escoles que fa servir plaques micro:bit. Aquest document explica, pas a pas i sense donar per fet que saps programar ni que has fet servir mai Git o GitHub, **què hi ha en aquest repositori i com es fan servir i es modifiquen els fitxers**.

Si el que busques és el detall tècnic de com funciona el codi per dins (bugs trobats, decisions de disseny, etc.), consulta la carpeta [`microbitada26/documentacion/`](microbitada26/documentacion/) — aquest README és la porta d'entrada per a qui comença de zero.

---

## 1. Què és aquest projecte?

La micro:bitada és una activitat en què grups d'alumnes resolen una sèrie de **reptes** (5 en total) fent servir una placa micro:bit. Cada repte, un cop resolt, dona una peça d'informació (un codi, una paraula, un patró...) que cal introduir a la pàgina web per desbloquejar el següent.

El projecte web té tres pantalles independents, més un "cervell" que les connecta totes:

| Fitxer | Què és | Qui el fa servir |
|---|---|---|
| `index.html` | La pàgina d'inici, amb un menú de tres botons | Tothom, és la porta d'entrada |
| `microbitada26/microbitada.html` | El joc en si: registre del grup, cronòmetre, imatges de pistes i candaus per introduir les respostes | L'alumnat, un dispositiu per grup |
| `microbitada26/marcador.html` | Un marcador en directe que mostra el progrés de tots els grups d'una escola | El professorat / la pantalla gran de l'aula |
| `microbitada26/apps-script/Code.gs` | El "backend": un petit programa que viu a Google (no al navegador) i que desa el progrés i els resultats a un Google Sheet | Ningú directament — el fan servir per sota `microbitada.html` i `marcador.html` |

Tot això es publica automàticament com una pàgina web normal, sense necessitat de cap servidor propi: qualsevol canvi que es "puja" a GitHub (ho expliquem a la secció 4) es veu reflectit a la web pública **microbitada.cat** al cap d'uns segons o minuts.

---

## 2. Mapa complet del repositori

```
mentoria-apps/
├── index.html                          → pàgina d'inici (menú principal)
├── CNAME                               → configura el domini microbitada.cat (no s'ha de tocar)
├── .gitignore                          → llista de fitxers que Git ha d'ignorar sempre
├── assets/
│   └── logos/                          → logos que surten al peu de totes les pàgines
├── peupagina/                          → (recursos addicionals del peu de pàgina)
└── microbitada26/
    ├── microbitada.html                → el joc (alumnat)
    ├── marcador.html                   → el marcador en directe
    ├── apps-script/
    │   └── Code.gs                      → backend: es copia dins l'editor d'Apps Script de Google
    ├── imatges/
    │   ├── README.md                   → explica la nomenclatura de les imatges (veure secció 6)
    │   └── P1.jpg, R1_1.jpg, F1.jpg...  → totes les imatges que es veuen durant el joc
    └── documentacion/
        ├── analisis-codigo-microbitada.md      → com funciona el codi per dins, decisions preses
        └── notas-despliegue-apps-script.md     → com desplegar canvis a Code.gs sense errors
```

**Regla pràctica:** si el que vols canviar és un text, un color o com es veu una pantalla → toca `index.html`, `microbitada.html` o `marcador.html`. Si el que vols canviar és com es desen les dades al Google Sheet → toca `Code.gs` (i després cal "redesplegar-lo", secció 7). Si el que vols canviar és una imatge d'un repte → puja-la a `microbitada26/imatges/` amb el nom correcte (secció 6).

---

## 3. Com funciona tot plegat, per sota (arquitectura, resum)

No cal entendre-ho per fer servir el projecte, però ajuda a l'hora de diagnosticar problemes:

1. **La web és "estàtica"**: `index.html`, `microbitada.html` i `marcador.html` són només HTML+CSS+JavaScript que s'executen sencers dins el navegador de qui els visita. No hi ha cap servidor propi nostre que calgui engegar ni mantenir.
2. **Publicació automàtica (GitHub Pages)**: GitHub ofereix, gratuïtament, publicar el contingut d'un repositori com una pàgina web. El fitxer `CNAME` és el que li diu a GitHub "aquesta web s'ha de veure a microbitada.cat" en comptes de l'adreça llarga per defecte. Cada cop que es "puja" un canvi (secció 5), GitHub Pages el publica sol, sense cap pas manual addicional.
3. **Les dades (progrés i resultats) viuen a un Google Sheet**, no al repositori. `microbitada.html` i `marcador.html` parlen amb un petit programa (`Code.gs`) que Google executa per nosaltres cada cop que se li fa una petició, i que llegeix/escriu al Sheet. Aquest programa té dues "pestanyes" amb què treballa:
   - **"Estat en viu"**: una fila per cada partida que està en marxa ara mateix (la llegeix `marcador.html` cada pocs segons).
   - **"Sessions finalitzades"**: l'historial de totes les partides ja acabades, amb els temps de cada repte.

En resum: **el repositori de GitHub controla com es veu i es comporta la web; el Google Sheet + Code.gs controlen on es desen les dades de joc.** Són dues coses separades que cal actualitzar per canals diferents (secció 5 per a la web, secció 7 per al backend).

---

## 4. Conceptes bàsics de Git i GitHub (si no els has fet servir mai)

**Git** és un programa que guarda un historial complet de tots els canvis fets als fitxers del projecte, com si cada canvi fos una "fotografia" que es pot consultar més endavant. **GitHub** és la pàgina web on es guarda una còpia d'aquest historial perquè tothom hi pugui accedir i, en el nostre cas, perquè es publiqui com a pàgina web (secció 3).

Uns quants termes que trobaràs sovint:

- **Repositori (o "repo")**: la carpeta del projecte sencera, amb tot l'historial de canvis inclòs. El nostre es diu `mentoria-apps` i, al Mac, normalment el trobarás a `Desktop/mentoria-apps`.
- **Commit**: una "fotografia" d'un o més canvis, acompanyada sempre d'un missatge curt que explica què s'ha fet i per què (per exemple: *"Corregeix el color del botó d'inici"*). Cada commit queda guardat per sempre a l'historial.
- **Push** ("empènyer"): enviar els commits que has fet al teu ordinador cap a GitHub, perquè quedin desats online i, en el nostre cas, es publiquin a la web. **Mentre no facis `push`, els teus canvis només existeixen al teu ordinador.**
- **Pull** ("estirar"): baixar al teu ordinador els canvis que hi ha a GitHub però que encara no tens localment (per exemple, si algú altre ha fet un `push`).
- **Branch "main"**: la línia principal de l'historial. En aquest projecte només fem servir aquesta, no cal preocupar-se per "branques" diferents.
- **`git status`**: pregunta "què he canviat que encara no he desat en un commit?". És el primer que val la pena mirar sempre.
- **`git log`**: mostra l'historial de commits, del més recent al més antic. També el pots consultar còmodament des de la pestanya "Commits" a la pàgina del repositori a github.com.

**Res es perd mai per accident**: com que cada commit queda guardat a l'historial, sempre es pot tornar a una versió anterior d'un fitxer si cal. Si mai dubtes si un canvi és "perillós", el pots fer i, si no funciona, es pot desfer consultant l'historial.

---

## 5. Com fer i publicar un canvi, pas a pas

Aquests passos es fan des del **Terminal** del Mac (l'aplicació que permet escriure ordres en comptes de fer clic amb el ratolí). Si mai l'has obert: és dins `Aplicacions > Utilitats > Terminal`, o cercant "Terminal" amb Spotlight (⌘+Espai).

1. **Entra a la carpeta del projecte** (només cal fer-ho un cop cada vegada que obris el Terminal):
   ```
   cd ~/Desktop/mentoria-apps
   ```
   (Si la carpeta és en un altre lloc, canvia el camí per l'adequat.)

2. **Edita el fitxer que calgui** amb qualsevol editor de text (per exemple, obrint-lo amb doble clic, editant-lo, i desant amb ⌘+S). També pots demanar a Claude que faci el canvi directament per tu.

3. **Comprova què ha canviat:**
   ```
   git status
   ```
   Et llistarà els fitxers que has modificat, en vermell si encara no estan "preparats" per al commit.

4. **Prepara els canvis per al commit** (indica quins fitxers vols incloure-hi):
   ```
   git add nom-del-fitxer.html
   ```
   O, si vols afegir-los tots els que has canviat:
   ```
   git add .
   ```

5. **Crea el commit, amb un missatge curt que expliqui el canvi:**
   ```
   git commit -m "Explica aquí, en poques paraules, què has canviat"
   ```

6. **Publica el canvi a GitHub (i, per tant, a la web):**
   ```
   git push
   ```
   Al cap d'uns segons o minuts (normalment menys d'un minut), el canvi ja es veu a **microbitada.cat**.

**Nota important:** quan treballem amb Claude en aquest projecte, Claude pot editar els fitxers directament al teu Mac (passos 2-5), però **el `git push` final sempre l'has de fer tu des del Terminal** — la connexió de xarxa des d'on treballa Claude no arriba a GitHub per motius de seguretat de la xarxa de l'escola/institut.

---

## 6. Nomenclatura de les imatges dels reptes

Totes les imatges que es veuen durant el joc viuen a `microbitada26/imatges/` i han de seguir aquest patró de noms perquè el codi les trobi automàticament (definit a `GAME_FLOW` i `INTRO_IMAGES` dins `microbitada.html`):

| Prefix | Quan es veu | Exemple |
|---|---|---|
| `P1`, `P2`, `P3` | Abans de prémer el botó START, amb el cronòmetre encara aturat | `P1.jpg` |
| `R{n}_{i}` | Imatges de pistes del repte número `n` (1 a 5), abans d'arribar al seu candau; `i` és l'ordre dins d'aquell repte | `R1_1.jpg`, `R1_2.jpg`, `R2_3.jpg` |
| `F1` | Es mostra quan el grup resol el repte 5 i acaba la gimcana amb èxit | `F1.jpg` |
| `F0` | Es mostra quan el grup acaba prement el botó d'emergència "Acaba la micro:bitada!" abans de resoldre el repte 5 | `F0.jpg` |
| `_N2` (sufix, opcional) | Variant de qualsevol de les anteriors per al **Nivell 2** de dificultat. Si no existeix, el joc mostra automàticament la imatge normal (Nivell 1) | `R1_2_N2.jpg`, `P1_N2.jpg` |

No cal tocar cap línia de codi per afegir o canviar imatges: només cal pujar el fitxer amb el nom correcte a la carpeta `imatges/` (secció 5) i el joc el troba sol. Consulta també `microbitada26/imatges/README.md` per a més detalls.

---

## 7. El backend (`Code.gs`): com desplegar-hi canvis

`Code.gs` **no viu a GitHub de la mateixa manera que la resta**: és un programa que s'executa dins Google (Apps Script), lligat directament al Google Sheet de respostes. Editar aquest fitxer al repositori (i fer `git push`) **no actualitza per si sol** el que Google executa de debò — cal enganxar el codi actualitzat dins l'editor d'Apps Script i tornar-lo a desplegar.

Resum ràpid dels passos (el detall complet, amb els errors típics que ens hem trobat i com evitar-los, és a [`microbitada26/documentacion/notas-despliegue-apps-script.md`](microbitada26/documentacion/notas-despliegue-apps-script.md)):

1. Obre el Google Sheet de respostes i vés a `Extensions > Apps Script`.
2. Esborra tot el contingut de `Code.gs` que hi hagi i enganxa-hi el contingut actualitzat del fitxer del repositori.
3. A dalt a la dreta: `Implementar > Gestiona les implementacions`.
4. Clica el llapis (editar) de la implementació existent.
5. **Molt important:** canvia el desplegable "Versió" a **"Nova versió"** (si no, Google seguirà executant el codi antic per sempre, encara que el codi que es vegi a l'editor sigui el nou).
6. Clica `Implementar`.

La URL del programa (la que fan servir `microbitada.html` i `marcador.html` per parlar-hi) **no canvia** en fer aquest procés, això que no cal tocar res més als altres fitxers.

---

## 8. On trobar més documentació

- [`microbitada26/documentacion/analisis-codigo-microbitada.md`](microbitada26/documentacion/analisis-codigo-microbitada.md): explicació detallada de com funciona el codi per dins, bugs que s'han anat trobant i resolent, i decisions de disseny preses al llarg del projecte.
- [`microbitada26/documentacion/notas-despliegue-apps-script.md`](microbitada26/documentacion/notas-despliegue-apps-script.md): checklist detallada per desplegar canvis a `Code.gs` sense repetir errors ja coneguts.
- [`microbitada26/imatges/README.md`](microbitada26/imatges/README.md): nomenclatura de les imatges (resumida també a la secció 6 d'aquest document).
- Dins de cada fitxer de codi (`index.html`, `microbitada.html`, `marcador.html`, `Code.gs`) hi ha comentaris que identifiquen cada secció, perquè sigui més fàcil orientar-s'hi encara que no s'hagi programat mai. Busca els blocs que comencen amb `<!-- ... -->` (HTML), `/* ... */` (CSS) o `// ...` (JavaScript i Apps Script).

---

## 9. Llicència i autoria

Micro:bitada Penedès 2026 és un projecte desenvolupat pel grup de treball i mentors del Baix Penedès i actualitzat pels mentors i mentores del ST Penedès. Està sota la llicència [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca). Es pot copiar, distribuir i adaptar l'obra sempre que se'n reconegui l'autoria, no se'n faci un ús comercial, i les obres derivades es distribueixin sota la mateixa llicència.
