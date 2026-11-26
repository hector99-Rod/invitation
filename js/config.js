/* Ajustes de la invitación. Es el único archivo que hace falta tocar. */
window.BODA = {
  // URL de la aplicación web de Google Apps Script (Implementar → Aplicación web).
  // Mientras esté vacía, el formulario de confirmación muestra un aviso.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbwUnYjBYiSuJENXCHI2mFYEJ4tWz2F9zMWtC_24Uq_bfaKEnYYNgs1abQVPNqtnqRFH/exec",

  // Fecha y hora de la ceremonia (hora de Bolivia, UTC-4).
  fecha: "2027-01-02T14:00:00-04:00",

  // Fecha límite para confirmar (texto libre). Déjala vacía para no mostrarla.
  fechaLimite: "",

  // ¿Se puede confirmar sin enlace personal (por ejemplo, desde el QR impreso)?
  // true: pide el nombre y deja registrar hasta "cuposSinEnlace" personas.
  // false: solo se confirma con el enlace personal de cada familia.
  permitirSinEnlace: true,
  cuposSinEnlace: 6,

  // Fotos de los invitados: la sección "Comparte sus fotos" aparece desde esta
  // fecha. Para verla antes (o para el QR de las mesas) agreguen ?fotos a la URL.
  fotosDesde: "2027-01-02T00:00:00-04:00",

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
