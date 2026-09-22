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

const SHEET_RESPOSTES = "Sessions finalitzades"; // pestanya on queden totes les partides acabades
const SHEET_ESTAT = "Estat en viu";
const SHEET_SESSIONS = "Sessions actives"; // pestanya amb els codis de sessió que genera el/la docent
const HORES_CADUCITAT = 4; // hores sense actualitzar-se a partir de les quals una sessió es considera abandonada
const HORES_CADUCITAT_CODI = 12; // hores a partir de les quals un codi de sessió es descarta si no s'ha fet servir

// GET amb ?action=progress|finish : el joc avisa d'un canvi d'estat.
// GET amb ?action=crearSessio : la pàgina Docents genera un codi de sessió nou.
// GET amb ?action=validarCodi : el joc comprova un codi de sessió i en recupera l'escola/comarca/curs.
// GET amb ?action=resum : la pàgina de resum públic demana les estadístiques agregades.
// GET sense "action" : el marcador demana l'estat actual de tots els grups.
// (Fem servir GET per a tot, també per als events del joc, perquè els POST a un
// Apps Script Web App no sempre porten la capçalera CORS que el navegador exigeix
// per poder-ne llegir la resposta, encara que el POST s'executi bé al servidor.)
// ================================================================
// PUNT D'ENTRADA DE TOTES LES PETICIONS
// Google crida sempre doGet(): el joc (microbitada.html), el marcador
// (marcador.html) i la pàgina Docents (docents.html) li parlen per GET
// (mai per POST, veure comentari més amunt). Segons el paràmetre "action"
// que porti, es reparteix cap a la funció que toqui.
// ================================================================
function doGet(e) {
  // e pot ser undefined si aquesta funció es prova manualment des de l'editor
  // (botó "Executar" amb doGet seleccionat): aleshores no hi ha cap petició
  // HTTP real i Apps Script no passa cap event. Ho protegim perquè aquesta
  // prova manual no aparegui com un error a "Execucions".
  const params = (e && e.parameter) || {};
  if (params.action === "progress" || params.action === "finish") {
    return gestionarEvent(params);
  }
  if (params.action === "crearSessio") {
    return crearSessio(params);
  }
  if (params.action === "validarCodi") {
    return validarCodi(params);
  }
  if (params.action === "resum") {
    return obtenirResum();
  }
  if (params.action === "debugTemps") {
    return debugTemps();
  }
  return llegirEstat();
}

// ================================================================
// GESTIÓ D'EVENTS DEL JOC ("progress" quan s'avança de repte, "finish"
// quan s'acaba la partida)
// ================================================================
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
      // La partida s'acaba (repte 5 superat o botó "Acaba la micro:bitada!"):
      // el resultat final queda escrit a "Sessions finalitzades" i la fila
      // d'aquesta sessió desapareix d'"Estat en viu", perquè aquesta pestanya
      // només mostri partides realment en curs.
      registrarRespostaFinal(dades);
      eliminarDeEstatEnViu(dades.sessionId);
    } else {
      return respondreJSON({ ok: false, error: "acció desconeguda: " + dades.action });
    }
    return respondreJSON({ ok: true });
  } catch (err) {
    return respondreJSON({ ok: false, error: String(err) });
  }
}

// ================================================================
// RESPOSTA AL MARCADOR: retorna l'estat de tots els grups en curs
// (tot el contingut, ara mateix, del full "Estat en viu")
// ================================================================
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

// ================================================================
// FULL "Estat en viu" (una fila per cada partida EN CURS ara mateix)
// ================================================================
function obtenirOCrearFullEstat() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ESTAT);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ESTAT);
    sheet.appendRow(["sessionId", "escola", "grup", "retoActual", "totalReptes", "tempsTotal", "estat", "actualitzat", "numGrup", "nivell", "comarca", "curs", "codi"]);
  } else {
    // Compatibilitat amb fulls "Estat en viu" creats abans d'afegir aquestes columnes
    if (sheet.getRange(1, 9).getValue() !== "numGrup") {
      sheet.getRange(1, 9).setValue("numGrup");
    }
    if (sheet.getRange(1, 10).getValue() !== "nivell") {
      sheet.getRange(1, 10).setValue("nivell");
    }
    if (sheet.getRange(1, 11).getValue() !== "comarca") {
      sheet.getRange(1, 11).setValue("comarca");
    }
    if (sheet.getRange(1, 12).getValue() !== "curs") {
      sheet.getRange(1, 12).setValue("curs");
    }
    if (sheet.getRange(1, 13).getValue() !== "codi") {
      sheet.getRange(1, 13).setValue("codi");
    }
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
  marcarIniciSessioSiCal(body.codi);
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
    body.numGrup || "",
    body.nivell || "",
    body.comarca || "",
    body.curs || "",
    body.codi || ""
  ];
  if (indexFila === -1) {
    sheet.appendRow(valorsFila);
  } else {
    sheet.getRange(indexFila, 1, 1, valorsFila.length).setValues([valorsFila]);
  }
}

/**
 * Elimina d'"Estat en viu" la fila d'aquesta sessió (si hi és). Es fa servir
 * quan una partida acaba, perquè aquesta pestanya només reflecteixi partides
 * realment en curs; el resultat final ja ha quedat escrit a
 * "Sessions finalitzades" abans de cridar aquesta funció.
 */
function eliminarDeEstatEnViu(sessionId) {
  const sheet = obtenirOCrearFullEstat();
  const dades = sheet.getDataRange().getValues();
  for (let i = 1; i < dades.length; i++) {
    if (dades[i][0] === sessionId) {
      sheet.deleteRow(i + 1); // +1: dades[0] és la capçalera (fila 1 del full)
      break;
    }
  }
}

// ================================================================
// FULL "Sessions actives": codis de sessió tipus Kahoot que genera el/la
// docent des de la pàgina Docents, perquè l'alumnat els introdueixi en
// lloc d'escriure el nom de l'escola a mà (evita duplicats quan juguen
// diversos grups de la mateixa escola alhora).
// ================================================================
function obtenirOCrearFullSessions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SESSIONS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SESSIONS);
    sheet.appendRow(["codi", "escola", "comarca", "curs", "creat", "duradaMinuts", "iniciat"]);
  } else {
    // Compatibilitat amb fulls "Sessions actives" creats abans d'afegir
    // aquestes columnes (durada prevista de l'activitat i moment en què
    // comença realment, quan el primer grup arriba al Repte 1).
    if (sheet.getRange(1, 6).getValue() !== "duradaMinuts") {
      sheet.getRange(1, 6).setValue("duradaMinuts");
    }
    if (sheet.getRange(1, 7).getValue() !== "iniciat") {
      sheet.getRange(1, 7).setValue("iniciat");
    }
  }
  return sheet;
}

/**
 * Genera un codi de 4 caràcters (sense 0/O/1/I, que es poden confondre) que
 * encara no existeixi a "Sessions actives", i el desa amb les dades que ha
 * introduït el/la docent (escola, comarca, curs).
 */
function crearSessio(params) {
  try {
    if (!params.escola) {
      return respondreJSON({ ok: false, error: "Falta el nom de l'escola" });
    }
    const sheet = obtenirOCrearFullSessions();
    const existents = sheet.getDataRange().getValues().slice(1).map(function (fila) { return fila[0]; });
    let codi;
    do {
      codi = generarCodiSessio();
    } while (existents.indexOf(codi) !== -1);

    const duradaMinuts = params.duradaMinuts ? Number(params.duradaMinuts) : "";
    sheet.appendRow([codi, params.escola, params.comarca || "", params.curs || "", new Date(), duradaMinuts, ""]);
    return respondreJSON({ ok: true, codi: codi });
  } catch (err) {
    return respondreJSON({ ok: false, error: String(err) });
  }
}

function generarCodiSessio() {
  const caracters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sense 0/O/1/I
  let codi = "";
  for (let i = 0; i < 4; i++) {
    codi += caracters.charAt(Math.floor(Math.random() * caracters.length));
  }
  return codi;
}

/**
 * Comprova un codi de sessió (introduït per l'alumnat a microbitada.html) i,
 * si existeix, retorna l'escola/comarca/curs que hi va associar el/la docent.
 */
function validarCodi(params) {
  try {
    const codi = String(params.codi || "").trim().toUpperCase();
    if (!codi) {
      return respondreJSON({ ok: false, error: "Falta el codi" });
    }
    const sheet = obtenirOCrearFullSessions();
    const dades = sheet.getDataRange().getValues();
    for (let i = 1; i < dades.length; i++) {
      if (String(dades[i][0]).toUpperCase() === codi) {
        return respondreJSON({
          ok: true,
          escola: dades[i][1],
          comarca: dades[i][2],
          curs: dades[i][3],
          duradaMinuts: dades[i][5] || "",
          iniciat: dades[i][6] ? new Date(dades[i][6]).toISOString() : ""
        });
      }
    }
    return respondreJSON({ ok: false, error: "Codi no trobat. Comprova que el/la docent l'hagi generat avui." });
  } catch (err) {
    return respondreJSON({ ok: false, error: String(err) });
  }
}

/**
 * Marca el moment en què comença realment l'activitat per a un codi de
 * sessió: la primera vegada que arriba un event 'progress' (el primer grup
 * que comença el Repte 1), s'escriu la data actual a la columna "iniciat"
 * de "Sessions actives". Si ja hi havia una data (altres grups ja havien
 * començat abans), no es toca.
 */
function marcarIniciSessioSiCal(codi) {
  if (!codi) return;
  try {
    const sheet = obtenirOCrearFullSessions();
    const dades = sheet.getDataRange().getValues();
    for (let i = 1; i < dades.length; i++) {
      if (String(dades[i][0]).toUpperCase() === String(codi).toUpperCase()) {
        if (!dades[i][6]) {
          sheet.getRange(i + 1, 7).setValue(new Date());
        }
        return;
      }
    }
  } catch (err) {
    // Si falla (p. ex. codi no trobat per algun motiu estrany), no volem
    // que això trenqui el registre normal del progrés del grup.
  }
}

/**
 * Neteja "Sessions actives": descarta els codis que porten més de
 * HORES_CADUCITAT_CODI hores generats (sessions d'altres dies).
 */
function netejarCodisCaducats() {
  const sheet = obtenirOCrearFullSessions();
  const valors = sheet.getDataRange().getValues();
  if (valors.length < 2) return;

  const ara = new Date();
  const limitMs = HORES_CADUCITAT_CODI * 60 * 60 * 1000;
  for (let i = valors.length - 1; i >= 1; i--) {
    const creat = valors[i][4] instanceof Date ? valors[i][4] : new Date(valors[i][4]);
    if (isNaN(creat.getTime()) || (ara - creat) < limitMs) continue;
    sheet.deleteRow(i + 1);
  }
}

// ================================================================
// FULL "Sessions finalitzades" (l'historial de totes les partides ja
// ACABADES, amb el temps de cada repte)
// ================================================================
/**
 * Retorna el full "Sessions finalitzades", creant-lo amb les capçaleres
 * correctes si encara no existeix.
 */
function obtenirFullRespostes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_RESPOSTES);
  if (sheet) return sheet;

  sheet = ss.insertSheet(SHEET_RESPOSTES);
  sheet.appendRow([
    "Marca de temps", "Escola", "Grup", "Temps total",
    "Temps repte 1", "Temps repte 2", "Temps repte 3", "Temps repte 4", "Temps repte 5",
    "Número de grup", "Nivell", "Comarca", "Curs"
  ]);
  return sheet;
}

/**
 * Afegeix la fila final a "Sessions finalitzades" amb el resultat de la partida
 * (Marca de temps, Escola, Grup, Temps, Temps repte 1..5, Número de grup, Nivell,
 * Comarca, Curs).
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
  if (sheet.getRange(1, 11).getValue() !== "Nivell") {
    sheet.getRange(1, 11).setValue("Nivell");
  }
  if (sheet.getRange(1, 12).getValue() !== "Comarca") {
    sheet.getRange(1, 12).setValue("Comarca");
  }
  if (sheet.getRange(1, 13).getValue() !== "Curs") {
    sheet.getRange(1, 13).setValue("Curs");
  }
  // Temps i Temps repte 1-5 (columnes D-I) són text "mm:ss", no hores reals.
  // Formatem cada columna per separat (no "D:I" de cop): en aquest full
  // -vinculat en origen a un Google Form- un rang que abasta MÉS D'UNA
  // columna sencera és exactament el que provoca l'error "Fes una selecció
  // dins d'una sola columna per dur a terme accions al nivell de columna."
  // Una columna cada vegada ("F:F", igual que fem a "Estat en viu", que mai
  // ha donat aquest error) no té aquesta restricció.
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
    body.numGrup || "",
    body.nivell || "",
    body.comarca || "",
    body.curs || ""
  ];
  // NO fem servir sheet.appendRow() aquí: aquesta pestanya prové d'un Google
  // Form i els fulls vinculats a un Form restringeixen accions "a nivell de
  // columna"; appendRow() hi topa quan la fila té més columnes que el Form
  // original (li vam afegir "Temps repte 1-5" i "Número de grup" nosaltres
  // més tard). Escrivint directament sobre un rang explícit evitem el conflicte.
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, novaFila.length).setValues([novaFila]);
}

// ================================================================
// RESUM PÚBLIC: estadístiques agregades de totes les "Sessions
// finalitzades", per a la pàgina pública de resum (resum.html).
// ================================================================
/**
 * TEMPORAL: endpoint de diagnostic per al bug del "Temps mitja" en blanc.
 * Es traura un cop localitzada la causa real. No modifica cap dada.
 */
function debugTemps() {
  try {
    const sheet = obtenirFullRespostes();
    const valors = sheet.getDataRange().getValues();
    const capçaleres = valors.shift();
    const idx = {};
    capçaleres.forEach(function (h, i) { idx[h] = i; });
    const mostra = valors.slice(0, 5).map(function (fila) {
      const raw = fila[idx["Temps"]];
      return {
        raw: String(raw),
        tipus: typeof raw,
        esData: raw instanceof Date,
        parsejat: mmssASegons(raw)
      };
    });
    return respondreJSON({ ok: true, capçaleres: capçaleres, indexTemps: idx["Temps"], mostra: mostra });
  } catch (err) {
    return respondreJSON({ ok: false, error: String(err) });
  }
}

function obtenirResum() {
  try {
    const sheet = obtenirFullRespostes();
    const valors = sheet.getDataRange().getValues();
    const capçaleres = valors.shift();
    const idx = {};
    capçaleres.forEach(function (h, i) { idx[h] = i; });

    const escoles = {};
    const perCurs = {};
    const perComarca = {};
    let totalGrups = 0;
    let totalReptesResolts = 0;
    let sumaSegons = 0;
    let sessionsAmbTemps = 0;

    valors.forEach(function (fila) {
      const escola = fila[idx["Escola"]];
      if (!escola) return;

      totalGrups++;
      escoles[escola] = true;

      const curs = fila[idx["Curs"]] || "Sense especificar";
      perCurs[curs] = (perCurs[curs] || 0) + 1;

      const comarca = fila[idx["Comarca"]] || "Sense especificar";
      perComarca[comarca] = (perComarca[comarca] || 0) + 1;

      for (let n = 1; n <= 5; n++) {
        if (fila[idx["Temps repte " + n]]) totalReptesResolts++;
      }

      const segons = mmssASegons(fila[idx["Temps"]]);
      if (segons !== null) {
        sumaSegons += segons;
        sessionsAmbTemps++;
      }
    });

    return respondreJSON({
      ok: true,
      totalEscoles: Object.keys(escoles).length,
      totalGrups: totalGrups,
      perCurs: perCurs,
      perComarca: perComarca,
      totalReptesResolts: totalReptesResolts,
      totalReptesPossibles: totalGrups * 5,
      mitjanaTempsSegons: sessionsAmbTemps ? Math.round(sumaSegons / sessionsAmbTemps) : null
    });
  } catch (err) {
    return respondreJSON({ ok: false, error: String(err) });
  }
}

// Converteix un text "mm:ss" a segons totals. Retorna null si no es pot llegir.
function mmssASegons(text) {
  if (!text) return null;
  const parts = String(text).split(":");
  if (parts.length !== 2) return null;
  const min = parseInt(parts[0], 10);
  const seg = parseInt(parts[1], 10);
  if (isNaN(min) || isNaN(seg)) return null;
  return min * 60 + seg;
}

// ================================================================
// MANTENIMENT AUTOMÀTIC: neteja de sessions abandonades (dispositiu
// tancat sense prémer cap botó de final), de codis de sessió caducats,
// i el trigger horari que ho executa tot plegat
// ================================================================
/**
 * Neteja "Estat en viu": qualsevol sessió que porti més de HORES_CADUCITAT
 * hores sense actualitzar-se es considera abandonada (el dispositiu es va
 * tancar, es va perdre la connexió, etc. abans de prémer el botó de
 * finalitzar). La traslladem a "Sessions finalitzades" i l'eliminem
 * d'"Estat en viu", perquè el marcador només mostri partides realment actives.
 * De passada, neteja també els codis de sessió caducats (netejarCodisCaducats).
 *
 * Pensada per executar-se automàticament cada hora (veure installarTriggerNeteja).
 * No fa res si no hi ha cap sessió ni codi caducat.
 */
function netejarSessionsCaducades() {
  const sheet = obtenirOCrearFullEstat();
  const valors = sheet.getDataRange().getValues();
  if (valors.length < 2) {
    netejarCodisCaducats();
    return;
  }

  const capçaleres = valors[0];
  const ara = new Date();
  const limitMs = HORES_CADUCITAT * 60 * 60 * 1000;

  // Recorrem de baix a dalt perquè deleteRow desplaça la resta de files cap amunt.
  for (let i = valors.length - 1; i >= 1; i--) {
    const fila = valors[i];
    const obj = {};
    capçaleres.forEach(function (h, j) { obj[h] = fila[j]; });

    const actualitzat = obj.actualitzat instanceof Date ? obj.actualitzat : new Date(obj.actualitzat);
    if (isNaN(actualitzat.getTime()) || (ara - actualitzat) < limitMs) continue;

    registrarRespostaFinal({
      escola: obj.escola,
      grup: obj.grup,
      tempsTotal: obj.tempsTotal,
      tempsReptes: ["", "", "", "", ""], // no sabem el detall per repte d'una sessió abandonada
      numGrup: obj.numGrup,
      nivell: obj.nivell,
      comarca: obj.comarca,
      curs: obj.curs
    });

    sheet.deleteRow(i + 1); // +1: valors[0] és la capçalera (fila 1 del full)
  }

  netejarCodisCaducats();
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
