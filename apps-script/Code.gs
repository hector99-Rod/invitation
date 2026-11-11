/**
 * Boda Shana & Héctor — confirmaciones de la invitación web.
 *
 * Dónde va: en la hoja "Invitados" → Extensiones → Apps Script.
 * Qué hace:
 *   - Menú "Boda S&H" en la hoja:
 *       1. Preparar lista web: copia las invitaciones de la pestaña "Invitaciones"
 *          (columna A = lado de Shana, columna C = lado de Héctor) a una pestaña
 *          nueva "Lista web", con un ID único y cupos sugeridos para revisar.
 *       2. Generar enlaces: crea el enlace personal de cada familia y un enlace
 *          de WhatsApp con el mensaje listo para enviar.
 *       3. Ver resumen: totales de confirmados, personas y pendientes.
 *   - Recibe las confirmaciones de la página y las guarda en "Lista web"
 *     (estado actual de cada familia) y en "Respuestas web" (historial).
 */

const AJUSTES = {
  HOJA_ORIGEN: 'Invitaciones',
  HOJA_LISTA: 'Lista web',
  HOJA_RESPUESTAS: 'Respuestas web',
  // Cambia esto por la dirección de la página publicada en GitHub Pages:
  URL_PAGINA: 'https://hector99-rod.github.io/invitation/',
  CUPOS_SIN_ENLACE: 6,
  CODIGO_PAIS: '591'
};

const ENCABEZADOS = ['ID', 'Lado', 'Invitación (jefe de familia)', 'Cupos', 'Teléfono (WhatsApp)',
  'Enlace personal', 'Enviar por WhatsApp', 'Estado', 'Asistentes', 'Nombres', 'Mensaje', 'Última respuesta'];
const COL = { ID: 1, LADO: 2, INVITACION: 3, CUPOS: 4, TELEFONO: 5, ENLACE: 6, WHATSAPP: 7,
  ESTADO: 8, ASISTENTES: 9, NOMBRES: 10, MENSAJE: 11, FECHA: 12 };

/* ---------------- Menú ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Boda S&H')
    .addItem('1 · Preparar lista web', 'prepararListaWeb')
    .addItem('2 · Generar enlaces y mensajes de WhatsApp', 'generarEnlaces')
    .addSeparator()
    .addItem('Ver resumen de confirmaciones', 'verResumen')
    .addToUi();
}

function prepararListaWeb() {
  const ss = SpreadsheetApp.getActive();
  const origen = ss.getSheetByName(AJUSTES.HOJA_ORIGEN);
  if (!origen) throw new Error('No encuentro la pestaña "' + AJUSTES.HOJA_ORIGEN + '".');
  const lista = hojaLista_(ss);

  const ultima = lista.getLastRow();
  const yaEstan = new Set(ultima > 1
    ? lista.getRange(2, COL.INVITACION, ultima - 1, 1).getValues().flat().map(normalizar_)
    : []);

  const datos = origen.getDataRange().getValues();
  const lados = [
    { col: 0, nombre: String(datos[0][0] || 'Novia').trim() },
    { col: 2, nombre: String(datos[0][2] || 'Novio').trim() }
  ];
  const nuevas = [];
  for (let r = 1; r < datos.length; r++) {
    lados.forEach(function (lado) {
      const nombre = String(datos[r][lado.col] || '').trim();
      if (!nombre || yaEstan.has(normalizar_(nombre))) return;
      yaEstan.add(normalizar_(nombre));
      nuevas.push([nuevoId_(), lado.nombre, nombre, cuposSugeridos_(nombre), '', '', '', 'Pendiente', '', '', '', '']);
    });
  }
  if (nuevas.length) {
    const desde = lista.getLastRow() + 1;
    lista.getRange(desde, 1, nuevas.length, ENCABEZADOS.length).setValues(nuevas);
    // Resalta los cupos "y familia" para que los revisen
    nuevas.forEach(function (fila, i) {
      if (/familia/i.test(fila[2])) lista.getRange(desde + i, COL.CUPOS).setBackground('#FFF2CC');
    });
  }
  generarEnlaces();
  ss.toast(nuevas.length + ' invitaciones agregadas. Revisen la columna "Cupos" (en amarillo las "y familia").', 'Boda S&H', 10);
}

function generarEnlaces() {
  const ss = SpreadsheetApp.getActive();
  const lista = hojaLista_(ss);
  const n = lista.getLastRow() - 1;
  if (n < 1) return;
  const rango = lista.getRange(2, 1, n, ENCABEZADOS.length);
  const filas = rango.getValues();
  const enlaces = [];
  filas.forEach(function (f) {
    let id = String(f[COL.ID - 1]).trim();
    if (!id && String(f[COL.INVITACION - 1]).trim()) id = nuevoId_();
    if (!id) { enlaces.push([f[COL.ID - 1], f[COL.ENLACE - 1], f[COL.WHATSAPP - 1]]); return; }
    const enlace = AJUSTES.URL_PAGINA + '?id=' + id;
    const cupos = parseInt(f[COL.CUPOS - 1], 10) || 1;
    const mensaje = 'Hola, ' + f[COL.INVITACION - 1] + '. Con mucho cariño les compartimos la invitación a nuestra boda, ' +
      'el sábado 2 de enero de 2027. Hemos reservado ' + (cupos === 1 ? '1 lugar' : cupos + ' lugares') +
      ' para ustedes. Por favor, confirmen su asistencia aquí: ' + enlace + '  Con cariño, Shana y Héctor';
    const tel = telefono_(f[COL.TELEFONO - 1]);
    const wa = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(mensaje);
    enlaces.push([id, enlace, wa]);
  });
  lista.getRange(2, COL.ID, n, 1).setValues(enlaces.map(function (e) { return [e[0]]; }));
  lista.getRange(2, COL.ENLACE, n, 2).setValues(enlaces.map(function (e) { return [e[1], e[2]]; }));
}

function verResumen() {
  const lista = hojaLista_(SpreadsheetApp.getActive());
  const n = lista.getLastRow() - 1;
  if (n < 1) { SpreadsheetApp.getUi().alert('La lista web está vacía.'); return; }
  const filas = lista.getRange(2, 1, n, ENCABEZADOS.length).getValues().filter(function (f) { return f[COL.ID - 1]; });
  let cupos = 0, conf = 0, personas = 0, no = 0, pend = 0;
  filas.forEach(function (f) {
    cupos += parseInt(f[COL.CUPOS - 1], 10) || 0;
    if (f[COL.ESTADO - 1] === 'Confirmado') { conf++; personas += parseInt(f[COL.ASISTENTES - 1], 10) || 0; }
    else if (f[COL.ESTADO - 1] === 'No asistirá') no++;
    else pend++;
  });
  const sinEnlace = hojaRespuestas_(SpreadsheetApp.getActive()).getDataRange().getValues()
    .filter(function (r) { return r[1] === '(sin enlace)' && r[3] === 'Sí'; })
    .reduce(function (s, r) { return s + (parseInt(r[4], 10) || 0); }, 0);
  SpreadsheetApp.getUi().alert(
    'Invitaciones: ' + filas.length + '\n' +
    'Cupos reservados: ' + cupos + '\n\n' +
    'Confirmadas: ' + conf + ' (' + personas + ' personas)\n' +
    'No asistirán: ' + no + '\n' +
    'Pendientes: ' + pend + '\n\n' +
    'Confirmaciones sin enlace personal: ' + sinEnlace + ' personas (ver "Respuestas web")');
}

/* ---------------- Página web ---------------- */

function doGet(e) {
  const id = String((e && e.parameter && e.parameter.id) || '').trim();
  if (!id) return json_({ ok: false, error: 'sin_id' });
  const f = buscar_(id);
  if (!f) return json_({ ok: false, error: 'no_encontrado' });
  return json_({ ok: true, invitacion: f.invitacion, cupos: f.cupos, estado: f.estado, asistentes: f.asistentes });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const asiste = d.asiste === true || d.asiste === 'si';
    const ahora = new Date();
    const ss = SpreadsheetApp.getActive();
    let id = String(d.id || '').trim();
    let invitacion, asistentes;

    if (id) {
      const f = buscar_(id);
      if (!f) return json_({ ok: false, error: 'no_encontrado' });
      invitacion = f.invitacion;
      asistentes = asiste ? Math.max(1, Math.min(f.cupos || 1, parseInt(d.asistentes, 10) || 1)) : 0;
      f.hoja.getRange(f.fila, COL.ESTADO, 1, 5).setValues([[
        asiste ? 'Confirmado' : 'No asistirá', asistentes, limpiar_(d.nombres), limpiar_(d.mensaje), ahora
      ]]);
    } else {
      invitacion = limpiar_(d.nombre);
      if (!invitacion) return json_({ ok: false, error: 'falta_nombre' });
      asistentes = asiste ? Math.max(1, Math.min(AJUSTES.CUPOS_SIN_ENLACE, parseInt(d.asistentes, 10) || 1)) : 0;
      id = '(sin enlace)';
    }
    hojaRespuestas_(ss).appendRow([ahora, id, invitacion, asiste ? 'Sí' : 'No', asistentes, limpiar_(d.nombres), limpiar_(d.mensaje)]);
    return json_({ ok: true, asistentes: asistentes });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- Ayudantes ---------------- */

function hojaLista_(ss) {
  let h = ss.getSheetByName(AJUSTES.HOJA_LISTA);
  if (!h) {
    h = ss.insertSheet(AJUSTES.HOJA_LISTA);
    h.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS])
      .setFontWeight('bold').setBackground('#0A1530').setFontColor('#E9C97C');
    h.setFrozenRows(1);
    h.setColumnWidth(COL.INVITACION, 280);
    h.setColumnWidth(COL.ENLACE, 260);
    h.setColumnWidth(COL.WHATSAPP, 200);
    h.getRange('D:D').setHorizontalAlignment('center');
    h.getRange('I:I').setHorizontalAlignment('center');
  }
  return h;
}

function hojaRespuestas_(ss) {
  let h = ss.getSheetByName(AJUSTES.HOJA_RESPUESTAS);
  if (!h) {
    h = ss.insertSheet(AJUSTES.HOJA_RESPUESTAS);
    h.getRange(1, 1, 1, 7).setValues([['Fecha', 'ID', 'Invitación', 'Asiste', 'Personas', 'Nombres', 'Mensaje']])
      .setFontWeight('bold').setBackground('#0A1530').setFontColor('#E9C97C');
    h.setFrozenRows(1);
  }
  return h;
}

function buscar_(id) {
  const h = hojaLista_(SpreadsheetApp.getActive());
  const n = h.getLastRow() - 1;
  if (n < 1) return null;
  const filas = h.getRange(2, 1, n, ENCABEZADOS.length).getValues();
  for (let i = 0; i < filas.length; i++) {
    if (String(filas[i][COL.ID - 1]).trim() === id) {
      return {
        hoja: h, fila: i + 2,
        invitacion: String(filas[i][COL.INVITACION - 1]),
        cupos: parseInt(filas[i][COL.CUPOS - 1], 10) || 1,
        estado: String(filas[i][COL.ESTADO - 1] || 'Pendiente'),
        asistentes: parseInt(filas[i][COL.ASISTENTES - 1], 10) || 0
      };
    }
  }
  return null;
}

function cuposSugeridos_(nombre) {
  if (/familia/i.test(nombre)) return 4;
  if (/\sy\s/i.test(nombre)) return 2;
  return 1;
}

function nuevoId_() {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 7; i++) id += letras.charAt(Math.floor(Math.random() * letras.length));
  return id;
}

function telefono_(v) {
  let t = String(v || '').replace(/\D/g, '');
  if (t.length === 8) t = AJUSTES.CODIGO_PAIS + t;
  return t;
}

function normalizar_(s) {
  return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
}

function limpiar_(v) {
  let s = String(v == null ? '' : v).trim().slice(0, 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
