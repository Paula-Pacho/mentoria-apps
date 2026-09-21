/**
 * Apps Script vinculat al full de càlcul de les respostes de la micro:bitada.
 *
 * Com instal·lar-lo:
 * 1. Obre el Google Sheet de respostes ("Micro_bitada (respostes)").
 * 2. Extensions > Apps Script.
 * 3. Esborra el contingut de Code.gs que hi hagi per defecte i enganxa-hi tot aquest fitxer.
 * 4. A dalt a la dreta, "Implementar" > "Nova implementació".
 * 5. Selecciona el tipus "Aplicació web".
 * 6. "Executa com": Jo (el teu compte).
 * 7. "Qui té accés": Qualsevol.
 * 8. "Implementar". La primera vegada et demanarà autoritzar permisos: accepta't a tu mateix/a.
 * 9. Copia la URL que et doni (acaba en /exec) i passa-la a Claude.
 *
 * Si tornes a editar aquest fitxer més endavant, cal fer "Implementar" >
 * "Gestiona les implementacions" > llapis (editar) > "Nova versió" > "Implementar",
 * si no els canvis no es veuran reflectits a la URL ja publicada.
 *
 * NOMÉS LA PRIMERA VEGADA que enganxis aquesta versió del codi (la que té
 * la neteja automàtica d'"Estat en viu"), cal fer un pas addicional un sol
 * cop: obre el desplegable de funcions (a dalt, al costat del botó
 * "Executar" ▶), tria "installarTriggerNeteja" i prem "Executar". Això
 * registra la neteja horària; no cal tornar a fer-ho en futures edicions.
 */

const SHEET_RESPOSTES = "Sessions finalitzades"; // pestanya on queden totes les partides acabades (abans "Respostes al formulari 1")
const SHEET_RESPOSTES_NOM_ANTIC = "Respostes al formulari 1"; // nom antic, per migrar automàticament fulls existents
const SHEET_ESTAT = "Estat en viu";
const HORES_CADUCITAT = 4; // hores sense actualitzar-se a partir de les quals una sessió es considera abandonada

// GET amb ?action=progress|finish : el joc avisa d'un canvi d'estat.
// GET sense "action" : el marcador demana l'estat actual de tots els grups.
// (Fem servir GET per a tot, també per als events del joc, perquè els POST a un
// Apps Script Web App no sempre porten la capçalera CORS que el navegador exigeix
// per poder-ne llegir la resposta, encara que el POST s'executi bé al servidor.)
function doGet(e) {
  // e pot ser undefined si aquesta funció es prova manualment des de l'editor
  // (botó "Executar" amb doGet seleccionat): aleshores no hi ha cap petició
  // HTTP real i Apps Script no passa cap event. Ho protegim perquè aquesta
  // prova manual no aparegui com un error a "Execucions".
  const params = (e && e.parameter) || {};
  if (params.action === "progress" || params.action === "finish") {
    return gestionarEvent(params);
  }
  return llegirEstat();
}

// Es manté per compatibilitat, encara que el joc ja no l'utilitza.
function doPost(e) {
  try {
    return gestionarEvent(JSON.parse(e.postData.contents));
  } catch (err) {
    return respondreJSON({ ok: false, error: String(err) });
  }
}

function gestionarEvent(dadesOriginals) {
  try {
    const dades = Object.assign({}, dadesOriginals, {
      tempsReptes: typeof dadesOriginals.tempsReptes === "string"
        ? dadesOriginals.tempsReptes.split(",")
        : (dadesOriginals.tempsReptes || [])
    });

    if (dades.action === "progress") {
      registrarProgres(dades);
    } else if (dades.action === "finish") {
      registrarProgres(Object.assign({}, dades, { estat: "Acabat" }));
      registrarRespostaFinal(dades);
    } else {
      return respondreJSON({ ok: false, error: "acció desconeguda: " + dades.action });
    }
    return respondreJSON({ ok: true });
  } catch (err) {
    return respondreJSON({ ok: false, error: String(err) });
  }
}

function llegirEstat() {
  const sheet = obtenirOCrearFullEstat();
  const valors = sheet.getDataRange().getValues();
  const capçaleres = valors.shift();
  const files = valors.map(function (fila) {
    const obj = {};
    capçaleres.forEach(function (h, i) { obj[h] = fila[i]; });
    return obj;
  });
  return respondreJSON({ ok: true, grups: files });
}

function respondreJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function obtenirOCrearFullEstat() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ESTAT);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ESTAT);
    sheet.appendRow(["sessionId", "escola", "grup", "retoActual", "totalReptes", "tempsTotal", "estat", "actualitzat", "numGrup"]);
  } else if (sheet.getRange(1, 9).getValue() !== "numGrup") {
    // Compatibilitat amb fulls "Estat en viu" creats abans d'afegir aquesta columna
    sheet.getRange(1, 9).setValue("numGrup");
  }
  // tempsTotal (columna F) és un text "mm:ss" de temps transcorregut, no una
  // hora real. Sense forçar format de text, el Sheet l'interpreta com a hora
  // i el fa malbé (surt com "1899-12-30T...Z" en llegir-lo per JSON).
  sheet.getRange("F:F").setNumberFormat("@");
  return sheet;
}

/**
 * Insereix o actualitza (per sessionId) la fila d'aquest grup a "Estat en viu".
 * Com que és una única fila per partida en curs, el marcador sempre pot llegir
 * "quin és l'estat actual de cada grup" sense haver de buscar entre un historial.
 */
function registrarProgres(body) {
  const sheet = obtenirOCrearFullEstat();
  const dades = sheet.getDataRange().getValues();
  let indexFila = -1;
  for (let i = 1; i < dades.length; i++) {
    if (dades[i][0] === body.sessionId) { indexFila = i + 1; break; }
  }
  const valorsFila = [
    body.sessionId,
    body.escola,
    body.grup,
    body.retoActual,
    body.totalReptes,
    body.tempsTotal,
    body.estat || "en joc",
    new Date(),
    body.numGrup || ""
  ];
  if (indexFila === -1) {
    sheet.appendRow(valorsFila);
  } else {
    sheet.getRange(indexFila, 1, 1, valorsFila.length).setValues([valorsFila]);
  }
}

/**
 * Retorna el full "Sessions finalitzades", creant-lo o migrant-lo si cal:
 * - Si ja existeix amb el nom nou, el fa servir directament.
 * - Si encara existeix amb el nom antic ("Respostes al formulari 1"), el
 *   renombra (no en creem un de nou, per no perdre l'historial que ja hi hagi).
 * - Si no existeix cap dels dos (full nou, sense Form), el crea amb les
 *   capçaleres correctes.
 */
function obtenirFullRespostes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_RESPOSTES);
  if (sheet) return sheet;

  const fullAntic = ss.getSheetByName(SHEET_RESPOSTES_NOM_ANTIC);
  if (fullAntic) {
    fullAntic.setName(SHEET_RESPOSTES);
    return fullAntic;
  }

  sheet = ss.insertSheet(SHEET_RESPOSTES);
  sheet.appendRow([
    "Marca de temps", "Escola", "Grup", "Temps total",
    "Temps repte 1", "Temps repte 2", "Temps repte 3", "Temps repte 4", "Temps repte 5",
    "Número de grup"
  ]);
  return sheet;
}

/**
 * Afegeix la fila final a la mateixa pestanya on abans queien les respostes del Form,
 * amb el mateix format (Marca de temps, Escola, Grup, Temps, Temps repte 1..5),
 * perquè tot el que ja tinguis fet amb aquestes dades (taules dinàmiques, etc.) segueixi funcionant.
 */
function registrarRespostaFinal(body) {
  const sheet = obtenirFullRespostes();

  // Assegura que existeixen les capçaleres afegides amb el temps (compatibilitat amb l'historial existent)
  if (sheet.getRange(1, 9).getValue() !== "Temps repte 5") {
    sheet.getRange(1, 9).setValue("Temps repte 5");
  }
  if (sheet.getRange(1, 10).getValue() !== "Número de grup") {
    sheet.getRange(1, 10).setValue("Número de grup");
  }
  // Mateix motiu que a "Estat en viu": Temps i Temps repte 1-5 (columnes D-I)
  // són text "mm:ss", no hores reals. Formatem cada columna per separat (no
  // "D:I" de cop): en aquest full -vinculat a un Google Form- un rang que
  // abasta MÉS D'UNA columna sencera és exactament el que provoca l'error
  // "Fes una selecció dins d'una sola columna per dur a terme accions al
  // nivell de columna." Una columna cada vegada ("F:F", igual que fem a
  // "Estat en viu", que mai ha donat aquest error) no té aquesta restricció.
  ["D:D", "E:E", "F:F", "G:G", "H:H", "I:I"].forEach(function (col) {
    sheet.getRange(col).setNumberFormat("@");
  });

  const tr = body.tempsReptes || [];
  const novaFila = [
    new Date(),
    body.escola,
    body.grup,
    body.tempsTotal,
    tr[0] || "",
    tr[1] || "",
    tr[2] || "",
    tr[3] || "",
    tr[4] || "",
    body.numGrup || ""
  ];
  // NO fem servir sheet.appendRow() aquí: aquesta pestanya prové d'un Google
  // Form (abans es deia "Respostes al formulari 1") i els fulls vinculats a
  // un Form restringeixen accions "a nivell de columna"; appendRow() hi
  // topa quan la fila té més columnes que el Form original (li vam afegir
  // "Temps repte 1-5" i "Número de grup" nosaltres més tard). Escrivint
  // directament sobre un rang explícit evitem el conflicte.
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, novaFila.length).setValues([novaFila]);
}

/**
 * Neteja "Estat en viu": qualsevol sessió que no estigui ja "Acabat" i porti
 * més de HORES_CADUCITAT hores sense actualitzar-se es considera abandonada
 * (el dispositiu es va tancar, es va perdre la connexió, etc. abans de
 * prémer el botó de finalitzar). La marquem com a "Acabat", la traslladem a
 * "Sessions finalitzades" i l'eliminem d'"Estat en viu", perquè el marcador
 * només mostri partides realment actives.
 *
 * Pensada per executar-se automàticament cada hora (veure installarTriggerNeteja).
 * No fa res si no hi ha cap sessió caducada.
 */
function netejarSessionsCaducades() {
  const sheet = obtenirOCrearFullEstat();
  const valors = sheet.getDataRange().getValues();
  if (valors.length < 2) return; // només capçalera, no hi ha files

  const capçaleres = valors[0];
  const ara = new Date();
  const limitMs = HORES_CADUCITAT * 60 * 60 * 1000;

  // Recorrem de baix a dalt perquè deleteRow desplaça la resta de files cap amunt.
  for (let i = valors.length - 1; i >= 1; i--) {
    const fila = valors[i];
    const obj = {};
    capçaleres.forEach(function (h, j) { obj[h] = fila[j]; });

    if (obj.estat === "Acabat") continue;

    const actualitzat = obj.actualitzat instanceof Date ? obj.actualitzat : new Date(obj.actualitzat);
    if (isNaN(actualitzat.getTime()) || (ara - actualitzat) < limitMs) continue;

    registrarRespostaFinal({
      escola: obj.escola,
      grup: obj.grup,
      tempsTotal: obj.tempsTotal,
      tempsReptes: ["", "", "", "", ""], // no sabem el detall per repte d'una sessió abandonada
      numGrup: obj.numGrup
    });

    sheet.deleteRow(i + 1); // +1: valors[0] és la capçalera (fila 1 del full)
  }
}

/**
 * Registra el trigger horari que crida netejarSessionsCaducades(). Cal
 * executar aquesta funció UN SOL COP a mà des de l'editor d'Apps Script
 * (desplegable de funcions > installarTriggerNeteja > Executar) — no es fa
 * sola en enganxar el codi. Si es torna a executar per error, no duplica el
 * trigger: primer esborra els que ja existien per aquesta funció.
 */
function installarTriggerNeteja() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "netejarSessionsCaducades") {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger("netejarSessionsCaducades").timeBased().everyHours(1).create();
}
