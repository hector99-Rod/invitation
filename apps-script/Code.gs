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
 *       - Ver resumen: totales de confirmados, personas y pendientes.
 *       - Preparar carpeta de fotos: crea la carpeta de Drive donde llegan las
 *          fotos de los invitados (y pide el permiso de Drive la primera vez).
 *   - Otros familiares (en la misma "Lista web", columnas M y N): en "Otros
 *     familiares" se escribe "Ana 70123456, Luis 69998877" y en la columna de al
 *     lado aparece cada nombre como enlace de WhatsApp, con un mensaje para esa
 *     persona y el MISMO enlace de su familia. La invitación sigue a nombre del
 *     jefe de familia y se confirma una sola vez.
 *   - Recibe las confirmaciones de la página y las guarda en "Lista web"
 *     (estado actual de cada familia) y en "Respuestas web" (historial).
 *   - Recibe las fotos de los invitados, las guarda en la carpeta de Drive y
 *     anota cada una en "Fotos web".
 *   - Recibe los pedidos de canciones y los anota en "Canciones" (con la familia
 *     y el lado, para armar la playlist).
 */

const AJUSTES = {
  HOJA_ORIGEN: 'Invitaciones',
  HOJA_LISTA: 'Lista web',
  HOJA_RESPUESTAS: 'Respuestas web',
  HOJA_FOTOS: 'Fotos web',
  HOJA_CANCIONES: 'Canciones',
  CARPETA_FOTOS: 'Boda S&H · Fotos de invitados',
  MAX_FOTO_MB: 15,
  // Cambia esto por la dirección de la página publicada en GitHub Pages:
  URL_PAGINA: 'https://hector99-rod.github.io/invitation/',
  CUPOS_SIN_ENLACE: 6,
  CODIGO_PAIS: '591',
  // Fecha límite para confirmar (sale en los mensajes de WhatsApp). Vacía = no se menciona.
  // Al cambiarla, usen el menú 2 para rehacer los enlaces de WhatsApp.
  FECHA_LIMITE: '12 de diciembre'
};

// Las columnas nuevas van SIEMPRE al final: así las versiones anteriores del
// script (que escriben en Estado…Última respuesta) nunca se desalinean.
const ENCABEZADOS = ['ID', 'Lado', 'Invitación (jefe de familia)', 'Cupos', 'Teléfono (WhatsApp)',
  'Enlace personal', 'Enviar por WhatsApp', 'Estado', 'Asistentes', 'Nombres', 'Mensaje', 'Última respuesta',
  'Otros familiares (nombre y teléfono)', 'WhatsApp otros familiares'];
const COL = { ID: 1, LADO: 2, INVITACION: 3, CUPOS: 4, TELEFONO: 5, ENLACE: 6, WHATSAPP: 7,
  ESTADO: 8, ASISTENTES: 9, NOMBRES: 10, MENSAJE: 11, FECHA: 12, OTROS: 13, WA_OTROS: 14 };
const ENC_RESPUESTAS = ['Fecha', 'ID', 'Invitación', 'Asiste', 'Personas', 'Nombres', 'Mensaje'];
const ENC_FOTOS = ['Fecha', 'Autor', 'Archivo', 'Enlace', 'KB', 'Nombre original', 'Fecha en el teléfono'];
const ENC_CANCIONES = ['Fecha', 'ID', 'Invitación', 'Lado', 'Canción', 'Artista'];

/* ---------------- Menú ---------------- */

function onOpen() {
  const ss = SpreadsheetApp.getActive();
  // Si borraron el contenido de alguna pestaña, se reponen sus encabezados
  try { revisarHojas_(ss); } catch (err) { /* nada que revisar aún */ }
  // Una sola vez: los IDs pasan a ser fijos (y se rehacen los enlaces)
  try { if (fijarIds_(ss)) generarEnlaces(); } catch (err) { /* se reintenta al usar el menú */ }
  SpreadsheetApp.getUi().createMenu('Boda S&H')
    .addItem('1 · Preparar lista web', 'prepararListaWeb')
    .addItem('2 · Generar enlaces y mensajes de WhatsApp', 'generarEnlaces')
    .addSeparator()
    .addItem('Ver resumen de confirmaciones', 'verResumen')
    .addItem('Reabrir confirmación de las filas seleccionadas', 'reabrirSeleccion')
    .addSeparator()
    .addItem('Preparar carpeta de fotos', 'prepararCarpetaFotos')
    .addToUi();
}

/**
 * Crea (o encuentra) la carpeta de Drive para las fotos. Ejecútenla una vez desde
 * el menú: así Google les pide el permiso de Drive antes de publicar la nueva versión.
 */
function prepararCarpetaFotos() {
  const carpeta = carpetaFotos_();
  hojaFotos_(SpreadsheetApp.getActive());
  SpreadsheetApp.getUi().alert('Las fotos de los invitados llegarán a esta carpeta de Drive:\n\n' +
    carpeta.getName() + '\n' + carpeta.getUrl());
}

/**
 * Cada enlace personal solo se puede responder una vez. Si una familia necesita
 * cambiar su respuesta, seleccionen su fila en "Lista web" y usen esta opción.
 */
function reabrirSeleccion() {
  const ss = SpreadsheetApp.getActive();
  const hoja = ss.getActiveSheet();
  if (hoja.getName() !== AJUSTES.HOJA_LISTA) {
    SpreadsheetApp.getUi().alert('Primero seleccionen una o más filas en la pestaña "' + AJUSTES.HOJA_LISTA + '".');
    return;
  }
  const rango = hoja.getActiveRange();
  const desde = Math.max(2, rango.getRow());
  const hasta = rango.getLastRow();
  if (hasta < desde) return;
  const n = hasta - desde + 1;
  hoja.getRange(desde, COL.ESTADO, n, 1).setValue('Pendiente');
  hoja.getRange(desde, COL.ASISTENTES, n, 1).clearContent();
  ss.toast(n + (n === 1 ? ' invitación reabierta.' : ' invitaciones reabiertas.') + ' Ya pueden volver a responder con su enlace.', 'Boda S&H', 6);
}

function prepararListaWeb() {
  const ss = SpreadsheetApp.getActive();
  const origen = ss.getSheetByName(AJUSTES.HOJA_ORIGEN);
  if (!origen) throw new Error('No encuentro la pestaña "' + AJUSTES.HOJA_ORIGEN + '".');
  const lista = revisarLista_(ss); // antes de contar filas: así las familias empiezan en la fila 2

  const ultima = lista.getLastRow();
  const yaEstan = new Set(ultima > 1
    ? lista.getRange(2, COL.INVITACION, ultima - 1, 1).getValues().flat().map(normalizar_)
    : []);
  const usados = new Set(ultima > 1
    ? lista.getRange(2, COL.ID, ultima - 1, 1).getValues().flat().map(String)
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
      const id = idPara_(nombre, usados);
      usados.add(id);
      nuevas.push([id, lado.nombre, nombre, cuposSugeridos_(nombre), '', '', '', 'Pendiente', '', '', '', '', '', '']);
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
  fijarIds_(ss);
  const lista = revisarLista_(ss);
  const n = lista.getLastRow() - 1;
  if (n < 1) return;
  const rango = lista.getRange(2, 1, n, ENCABEZADOS.length);
  const filas = rango.getValues();
  const usados = new Set(filas.map(function (f) { return String(f[COL.ID - 1]).trim(); }).filter(String));
  const enlaces = [];
  filas.forEach(function (f) {
    let id = String(f[COL.ID - 1]).trim();
    if (!id && String(f[COL.INVITACION - 1]).trim()) {
      id = idPara_(f[COL.INVITACION - 1], usados);
      usados.add(id);
    }
    if (!id) { enlaces.push([f[COL.ID - 1], f[COL.ENLACE - 1], f[COL.WHATSAPP - 1]]); return; }
    const enlace = AJUSTES.URL_PAGINA + '?id=' + id;
    const cupos = parseInt(f[COL.CUPOS - 1], 10) || 1;
    const mensaje = 'Hola, ' + f[COL.INVITACION - 1] + '. Con mucho cariño les compartimos la invitación a nuestra boda, ' +
      'el sábado 2 de enero de 2027. Hemos reservado ' + (cupos === 1 ? '1 lugar' : cupos + ' lugares') +
      ' para ustedes. Por favor, confirmen su asistencia' + hastaFecha_() + ' aquí: ' + enlace + '  Con cariño, Shana y Héctor';
    const tel = telefono_(f[COL.TELEFONO - 1]);
    const wa = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(mensaje);
    enlaces.push([id, enlace, wa]);
  });
  lista.getRange(2, COL.ID, n, 1).setValues(enlaces.map(function (e) { return [e[0]]; }));
  lista.getRange(2, COL.ENLACE, n, 2).setValues(enlaces.map(function (e) { return [e[1], e[2]]; }));
  // Los mensajes de "Otros familiares" usan estos enlaces y cupos: se rehacen también
  completarFamiliares_(lista, 2, lista.getLastRow());
}

/* ---------------- Otros familiares: la misma invitación a varios WhatsApp ---------------- */

/** Al escribir en "Lista web" (invitación, cupos u otros familiares), se arman sus enlaces. */
function onEdit(e) {
  const rango = e && e.range;
  if (!rango || rango.getSheet().getName() !== AJUSTES.HOJA_LISTA) return;
  if (rango.getLastColumn() < COL.INVITACION || rango.getColumn() > COL.OTROS) return;
  const desde = Math.max(2, rango.getRow());
  const hasta = rango.getLastRow();
  if (hasta >= desde) completarFamiliares_(rango.getSheet(), desde, hasta);
}

/** En cada fila, convierte "Ana 70123456, Luis 69998877" en "Ana · Luis", cada nombre con su enlace de WhatsApp. */
function completarFamiliares_(hoja, desde, hasta) {
  if (hasta < desde) return;
  const n = hasta - desde + 1;
  const filas = hoja.getRange(desde, 1, n, COL.OTROS).getValues();
  const salida = filas.map(function (f) {
    const id = String(f[COL.ID - 1]).trim();
    const personas = familiaresDe_(f[COL.OTROS - 1]);
    const constructor = SpreadsheetApp.newRichTextValue();
    if (!id || !personas.length) return [constructor.setText('').build()];
    const enlace = AJUSTES.URL_PAGINA + '?id=' + id;
    const cupos = parseInt(f[COL.CUPOS - 1], 10) || 1;
    const SEP = '  ·  ';
    const etiquetas = personas.map(function (p) { return p.nombre || p.telefono; });
    constructor.setText(etiquetas.join(SEP));
    let inicio = 0;
    personas.forEach(function (p, i) {
      const fin = inicio + etiquetas[i].length;
      const mensaje = mensajeFamiliar_(p.nombre, String(f[COL.INVITACION - 1]).trim(), cupos, enlace);
      constructor.setLinkUrl(inicio, fin, 'https://wa.me/' + telefono_(p.telefono) + '?text=' + encodeURIComponent(mensaje));
      inicio = fin + SEP.length;
    });
    return [constructor.build()];
  });
  hoja.getRange(desde, COL.WA_OTROS, n, 1).setRichTextValues(salida);
}

/** "Ana 70123456, Luis +591 6999 8877; Rosa" → [{nombre:'Ana', telefono:'70123456'}, …] */
function familiaresDe_(texto) {
  return String(texto || '').split(/[,;\n\/]+/).map(function (parte) {
    const telefono = (parte.match(/\+?\d[\d\s.\-]{5,}\d/) || [''])[0];
    const nombre = parte.replace(telefono, ' ').replace(/[:()\-–]+/g, ' ').replace(/\s+/g, ' ').trim();
    return { nombre: nombre, telefono: telefono.trim() };
  }).filter(function (p) { return p.nombre || p.telefono; });
}

function mensajeFamiliar_(nombre, invitacion, cupos, enlace) {
  return 'Hola' + (nombre ? ', ' + nombre : '') + '. Con mucho cariño te compartimos la invitación a nuestra boda ' +
    'para ' + invitacion + ', el sábado 2 de enero de 2027.' +
    (cupos > 1 ? ' Hemos reservado ' + cupos + ' lugares para la familia.' : '') +
    ' Para confirmar' + hastaFecha_() + ', basta con que uno de ustedes responda por todos aquí: ' + enlace + '  Con cariño, Shana y Héctor';
}

/** " hasta el 12 de diciembre" (o nada si no hay fecha límite). */
function hastaFecha_() {
  return AJUSTES.FECHA_LIMITE ? ' hasta el ' + AJUSTES.FECHA_LIMITE : '';
}

function verResumen() {
  const lista = revisarLista_(SpreadsheetApp.getActive());
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
  const fotos = Math.max(0, hojaFotos_(SpreadsheetApp.getActive()).getLastRow() - 1);
  const canciones = Math.max(0, hojaCanciones_(SpreadsheetApp.getActive()).getLastRow() - 1);
  SpreadsheetApp.getUi().alert(
    'Invitaciones: ' + filas.length + '\n' +
    'Cupos reservados: ' + cupos + '\n\n' +
    'Confirmadas: ' + conf + ' (' + personas + ' personas)\n' +
    'No asistirán: ' + no + '\n' +
    'Pendientes: ' + pend + '\n\n' +
    'Confirmaciones sin enlace personal: ' + sinEnlace + ' personas (ver "Respuestas web")\n\n' +
    'Fotos recibidas: ' + fotos + ' (ver "' + AJUSTES.HOJA_FOTOS + '")\n' +
    'Canciones pedidas: ' + canciones + ' (ver "' + AJUSTES.HOJA_CANCIONES + '")');
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
  let d;
  try {
    d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'json_invalido' });
  }
  // Las fotos no tocan "Lista web": no esperan el candado, así varios invitados
  // pueden subir al mismo tiempo sin hacer fila.
  if (d.tipo === 'foto') return guardarFoto_(d);
  if (d.tipo === 'cancion') return guardarCancion_(d);

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const asiste = d.asiste === true || d.asiste === 'si';
    const ahora = new Date();
    const ss = SpreadsheetApp.getActive();
    let id = String(d.id || '').trim();
    let invitacion, asistentes;

    if (id) {
      const f = buscar_(id);
      if (!f) return json_({ ok: false, error: 'no_encontrado' });
      if (f.estado === 'Confirmado' || f.estado === 'No asistirá') {
        return json_({ ok: false, error: 'ya_respondio', estado: f.estado, asistentes: f.asistentes });
      }
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

/* ---------------- Fotos de los invitados ---------------- */

/**
 * Recibe { tipo: 'foto', archivo: <base64>, autor, original, modificada }.
 * El formato se deduce de los primeros bytes del archivo (no de lo que diga el
 * navegador), así solo se aceptan imágenes de verdad.
 */
function guardarFoto_(d) {
  try {
    const bytes = Utilities.base64Decode(String(d.archivo || ''));
    if (!bytes.length) return json_({ ok: false, error: 'archivo_vacio' });
    if (bytes.length > AJUSTES.MAX_FOTO_MB * 1024 * 1024) return json_({ ok: false, error: 'muy_grande' });
    const tipo = tipoImagen_(bytes);
    if (!tipo) return json_({ ok: false, error: 'no_es_imagen' });

    const ahora = new Date();
    const autor = limpiar_(d.autor).slice(0, 80);
    const nombre = Utilities.formatDate(ahora, 'America/La_Paz', 'yyyyMMdd-HHmmss') + '_' +
      (slug_(autor) || 'invitado') + '_' + nuevoId_() + '.' + tipo.ext;
    const archivo = carpetaFotos_().createFile(Utilities.newBlob(bytes, tipo.mime, nombre));
    hojaFotos_(SpreadsheetApp.getActive()).appendRow([
      ahora, autor, nombre, archivo.getUrl(), Math.round(bytes.length / 1024),
      limpiar_(d.original).slice(0, 120), limpiar_(d.modificada).slice(0, 40)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Reconoce JPEG, PNG, WebP y HEIC/HEIF por su "firma" (magic bytes). */
function tipoImagen_(b) {
  if (b.length < 12) return null;
  const u = function (i) { return (b[i] + 256) % 256; };  // Apps Script da bytes con signo (-128..127)
  const txt = function (i, n) { let s = ''; for (let k = i; k < i + n; k++) s += String.fromCharCode(u(k)); return s; };
  if (u(0) === 0xFF && u(1) === 0xD8 && u(2) === 0xFF) return { mime: 'image/jpeg', ext: 'jpg' };
  if (u(0) === 0x89 && txt(1, 3) === 'PNG') return { mime: 'image/png', ext: 'png' };
  if (txt(0, 4) === 'RIFF' && txt(8, 4) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  if (txt(4, 4) === 'ftyp' && /^(heic|heix|hevc|mif1|msf1)$/.test(txt(8, 4))) return { mime: 'image/heic', ext: 'heic' };
  return null;
}

function carpetaFotos_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_FOTOS_ID');
  if (id) {
    try {
      const c = DriveApp.getFolderById(id);
      if (!c.isTrashed()) return c;
    } catch (err) { /* la carpeta ya no existe: se crea otra */ }
  }
  const carpeta = DriveApp.createFolder(AJUSTES.CARPETA_FOTOS);
  props.setProperty('CARPETA_FOTOS_ID', carpeta.getId());
  return carpeta;
}

function hojaFotos_(ss) {
  return hoja_(ss, AJUSTES.HOJA_FOTOS, ENC_FOTOS);
}

/* ---------------- Canciones pedidas ---------------- */

/**
 * Recibe { tipo: 'cancion', cancion, artista, familia: <ID del enlace personal o ''> }.
 * Usa "familia" y no "id" a propósito: si esta página llegara a publicarse antes
 * que este script, la versión vieja de doPost no la confundiría con una confirmación.
 */
function guardarCancion_(d) {
  try {
    const cancion = limpiar_(d.cancion).slice(0, 120);
    if (!cancion) return json_({ ok: false, error: 'falta_cancion' });
    const artista = limpiar_(d.artista).slice(0, 80);
    const id = String(d.familia || '').trim();
    const f = id ? buscar_(id) : null;
    hojaCanciones_(SpreadsheetApp.getActive()).appendRow([
      new Date(), f ? id : '(sin enlace)', f ? f.invitacion : '', f ? f.lado : '', cancion, artista
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function hojaCanciones_(ss) {
  return hoja_(ss, AJUSTES.HOJA_CANCIONES, ENC_CANCIONES);
}

/* ---------------- Ayudantes ---------------- */

/**
 * Devuelve la pestaña (la crea si no existe). Si está vacía —nueva o porque
 * borraron todo su contenido— le pone los encabezados antes de usarla.
 * (Esta revisión es rápida: solo cuenta filas; la revisión completa es revisarHojas_.)
 */
function hoja_(ss, nombre, encabezados) {
  const h = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  if (h.getLastRow() === 0 && asegurarEncabezados_(h, encabezados) && nombre === AJUSTES.HOJA_LISTA) formatoLista_(h);
  return h;
}

function hojaLista_(ss) {
  return hoja_(ss, AJUSTES.HOJA_LISTA, ENCABEZADOS);
}

function hojaRespuestas_(ss) {
  return hoja_(ss, AJUSTES.HOJA_RESPUESTAS, ENC_RESPUESTAS);
}

/** Revisión completa de "Lista web" (lee la fila 1). La usan los menús. */
function revisarLista_(ss) {
  const h = hojaLista_(ss);
  if (asegurarEncabezados_(h, ENCABEZADOS)) formatoLista_(h);
  return h;
}

/** Al abrir la hoja: revisa los encabezados de todas las pestañas que existen. */
function revisarHojas_(ss) {
  [[AJUSTES.HOJA_LISTA, ENCABEZADOS], [AJUSTES.HOJA_RESPUESTAS, ENC_RESPUESTAS],
    [AJUSTES.HOJA_FOTOS, ENC_FOTOS], [AJUSTES.HOJA_CANCIONES, ENC_CANCIONES]].forEach(function (p) {
    const h = ss.getSheetByName(p[0]);
    if (h && asegurarEncabezados_(h, p[1]) && p[0] === AJUSTES.HOJA_LISTA) formatoLista_(h);
  });
}

/**
 * Deja la fila 1 con los encabezados. Devuelve true si tuvo que cambiar algo.
 *  - Fila 1 vacía o con encabezados sueltos/incompletos → se completan.
 *  - Fila 1 con datos (p. ej. una familia, porque borraron todo y se volvió a
 *    llenar) → se inserta una fila arriba para los encabezados; no se pierde nada.
 */
function asegurarEncabezados_(h, encabezados) {
  const n = encabezados.length;
  const fila1 = h.getLastRow() > 0 ? h.getRange(1, 1, 1, n).getValues()[0] : encabezados.map(function () { return ''; });
  const texto = fila1.map(function (v) { return String(v).trim(); });
  if (texto.every(function (t, i) { return t === encabezados[i]; })) return false;

  const soloEncabezados = texto.every(function (t, i) { return t === '' || t === encabezados[i]; });
  if (!soloEncabezados) {
    h.insertRowBefore(1);
    // La fila de datos que bajó pudo quedar con el formato de encabezado o con
    // títulos sueltos (p. ej. en M y N): se limpia
    const bajada = h.getRange(2, 1, 1, n);
    bajada.getValues()[0].forEach(function (v, i) {
      if (String(v).trim() === encabezados[i]) h.getRange(2, i + 1).clearContent();
    });
    bajada.setFontWeight('normal').setBackground(null).setFontColor(null);
  }
  h.getRange(1, 1, 1, n).setValues([encabezados])
    .setFontWeight('bold').setBackground('#0A1530').setFontColor('#E9C97C');
  h.setFrozenRows(1);
  return true;
}

function formatoLista_(h) {
  h.setColumnWidth(COL.INVITACION, 280);
  h.setColumnWidth(COL.ENLACE, 260);
  h.setColumnWidth(COL.WHATSAPP, 200);
  h.setColumnWidth(COL.OTROS, 300);
  h.setColumnWidth(COL.WA_OTROS, 240);
  h.getRange('D:D').setHorizontalAlignment('center');
  h.getRange('I:I').setHorizontalAlignment('center');
  h.getRange(1, COL.OTROS).setNote('Escriban nombre y teléfono separados por comas. Ej.: Ana 70123456, Luis 69998877');
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
        lado: String(filas[i][COL.LADO - 1] || ''),
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

/**
 * ID FIJO de una familia: sale de su nombre + una clave secreta que se crea una
 * sola vez y queda guardada en el script (no en GitHub, así nadie puede adivinar
 * los enlaces). Si borran "Lista web" y la vuelven a armar, cada familia recibe
 * el MISMO ID, y sus enlaces ya enviados siguen funcionando.
 */
function idPara_(invitacion, usados) {
  const props = PropertiesService.getScriptProperties();
  let clave = props.getProperty('CLAVE_IDS');
  if (!clave) {
    clave = Utilities.getUuid();
    props.setProperty('CLAVE_IDS', clave);
  }
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789';
  for (let intento = 0; intento < 50; intento++) {
    const texto = clave + '|' + normalizar_(invitacion) + (intento ? '|' + intento : '');
    const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8);
    let id = '';
    for (let i = 0; i < 7; i++) id += letras.charAt(((bytes[i] % letras.length) + letras.length) % letras.length);
    if (!usados || !usados.has(id)) return id;
  }
  return nuevoId_();
}

/**
 * Una sola vez: cambia los IDs existentes por IDs fijos y lo anota para no
 * repetirlo nunca. Solo lo hace si ninguna familia respondió todavía (si ya hay
 * respuestas, los enlaces están en uso y no se tocan).
 */
function fijarIds_(ss) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('IDS_FIJOS') === 'si') return false;
  const lista = ss.getSheetByName(AJUSTES.HOJA_LISTA);
  let cambio = false;
  if (lista && lista.getLastRow() > 1) {
    revisarLista_(ss);
    const n = lista.getLastRow() - 1;
    const filas = lista.getRange(2, 1, n, ENCABEZADOS.length).getValues();
    const respondio = filas.some(function (f) { return f[COL.ESTADO - 1] === 'Confirmado' || f[COL.ESTADO - 1] === 'No asistirá'; });
    if (!respondio) {
      const usados = new Set();
      lista.getRange(2, COL.ID, n, 1).setValues(filas.map(function (f) {
        const invitacion = String(f[COL.INVITACION - 1]).trim();
        if (!invitacion) return [f[COL.ID - 1]];
        const id = idPara_(invitacion, usados);
        usados.add(id);
        return [id];
      }));
      cambio = true;
    }
  }
  props.setProperty('IDS_FIJOS', 'si');
  return cambio;
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

function slug_(s) {
  return normalizar_(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
}

function limpiar_(v) {
  let s = String(v == null ? '' : v).trim().slice(0, 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
