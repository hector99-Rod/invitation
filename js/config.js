/* Ajustes de la invitación. Es el único archivo que hace falta tocar. */
window.BODA = {
  // URL de la aplicación web de Google Apps Script (Implementar → Aplicación web).
  // Mientras esté vacía, el formulario de confirmación muestra un aviso.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbwUnYjBYiSuJENXCHI2mFYEJ4tWz2F9zMWtC_24Uq_bfaKEnYYNgs1abQVPNqtnqRFH/exec",

  // Fecha y hora de la ceremonia (hora de Bolivia, UTC-4).
  fecha: "2027-01-02T14:00:00-04:00",

  // Fecha límite para confirmar (texto libre). Déjala vacía para no mostrarla.
  fechaLimite: "12 de diciembre",

  // ¿Se puede confirmar sin enlace personal (por ejemplo, desde el QR impreso)?
  // true: pide el nombre y deja registrar hasta "cuposSinEnlace" personas.
  // false: solo se confirma con el enlace personal de cada familia.
  permitirSinEnlace: true,
  cuposSinEnlace: 6,

  // Fotos de los invitados: true muestra "Comparte sus fotos" en todos los enlaces
  // (personales y generales). Con ?fotos en la URL se salta el sobre y va directo
  // a las fotos (para el QR de las mesas).
  mostrarFotos: true,

  // Canciones: true muestra "Pide tu canción" (se guardan en la pestaña "Canciones").
  pedirCanciones: true,

  // Invitaciones solo para adultos: huella SHA-256 del ID de cada enlace personal
  // (no el ID en sí, para que esos enlaces no queden a la vista en el código).
  // Al abrir uno de esos enlaces, el saludo muestra la nota de abajo.
  soloAdultos: [
    "088a741501b027a1e1df182d2f0d8485c8204a620fc483c24417411b2d6c76b3",
    "c601766d45914d0d26158659692f3036d0efbf81c919455a4f1dd35c59129ecc"
  ],
  notaSoloAdultos: "Con mucho cariño, esta invitación es para ustedes dos: queremos regalarles un día libre para celebrar con nosotros. Sus hijos siempre están en nuestro corazón, aunque esta vez la fiesta sea solo para ustedes.",

  // Canción de fondo: sube el archivo a la carpeta "musica" con este nombre.
  musica: "musica/cancion.mp3",

  // Lugares. Si el pin del mapa no cae exacto, reemplaza "busqueda" por el
  // nombre que Google Maps reconozca, o pega en "enlace" el link de compartir.
  lugares: {
    iglesia: {
      busqueda: "Parroquia María Madre, Bolognia, La Paz, Bolivia",
      enlace: ""
    },
    thaya: {
      busqueda: "Espacio de Eventos Thaya, Av. Los Sargentos, Bajo Llojeta, La Paz, Bolivia",
      enlace: ""
    }
  }
};
