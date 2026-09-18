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
 */

const SHEET_RESPOSTES = "Respostes al formulari 1"; // nom exacte de la pestanya on cauen les respostes del Form actual
const SHEET_ESTAT = "Estat en viu";

// GET amb ?action=progress|finish : el joc avisa d'un canvi d'estat.
// GET sense "action" : el marcador demana l'estat actual de tots els grups.
// (Fem servir GET per a tot, també per als events del joc, perquè els POST a un
// Apps Script Web App no sempre porten la capçalera CORS que el navegador exigeix
// per poder-ne llegir la resposta, encara que el POST s'executi bé al servidor.)
function doGet(e) {
  const params = e.parameter;
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
 * Afegeix la fila final a la mateixa pestanya on abans queien les respostes del Form,
 * amb el mateix format (Marca de temps, Escola, Grup, Temps, Temps repte 1..5),
 * perquè tot el que ja tinguis fet amb aquestes dades (taules dinàmiques, etc.) segueixi funcionant.
 */
function registrarRespostaFinal(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RESPOSTES);
  if (!sheet) return;

  // Assegura que existeixen les capçaleres afegides amb el temps (compatibilitat amb l'historial existent)
  if (sheet.getRange(1, 9).getValue() !== "Temps repte 5") {
    sheet.getRange(1, 9).setValue("Temps repte 5");
  }
  if (sheet.getRange(1, 10).getValue() !== "Número de grup") {
    sheet.getRange(1, 10).setValue("Número de grup");
  }
  // Mateix motiu que a "Estat en viu": Temps i Temps repte 1-5 (columnes D-I)
  // són text "mm:ss", no hores reals.
  sheet.getRange("D:I").setNumberFormat("@");

  const tr = body.tempsReptes || [];
  sheet.appendRow([
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
  ]);
}
