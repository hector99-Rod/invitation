# Invitacion Boda

Invitación web con confirmación personal

- Apertura con sobre y lacre, música y cuenta regresiva
- Personalizada
- Ceremonia, recepción e itinerario con mapas
- Confirmación de asistencia con enlace personal por familia
- Fotos de los invitados: las suben desde la página y llegan a una carpeta de Google Drive
- Pide tu canción: los invitados piden canciones para la fiesta (pestaña `Canciones`)

Hecha con HTML, CSS y JavaScript, publicada con GitHub Pages.

## Cómo se conecta

```
Página (GitHub Pages) ──fetch──► Apps Script (URL /exec en js/config.js) ──► Google Sheet + Drive
```

El Apps Script vive dentro de la hoja (Extensiones → Apps Script). `apps-script/Code.gs` es una copia
de ese código: si se cambia aquí, hay que pegarlo allá y publicar una versión nueva.

Cada familia tiene un **ID fijo** (sale de su nombre y de una clave secreta guardada en el script, no en
GitHub): si se borra `Lista web` y se vuelve a armar con el menú 1, cada familia recibe el mismo enlace.
Si se borra el contenido de una pestaña, sus encabezados se reponen solos.

Pestañas que usa el script: `Invitaciones` (lista escrita a mano), `Lista web` (una fila por familia),
`Respuestas web` (historial de confirmaciones), `Fotos web` (registro de fotos subidas) y
`Canciones` (pedidos de canciones, con la familia y el lado cuando vienen de un enlace personal).
No hay que cambiarles el nombre.

## Actualizar el Apps Script

1. Copiar todo `apps-script/Code.gs` y pegarlo en el editor de Apps Script de la hoja. Guardar.
2. En la hoja, recargar y usar el menú **Boda S&H → Preparar carpeta de fotos** (la primera vez Google
   pide permiso para usar Drive).
3. **Implementar → Gestionar implementaciones → ✏️ editar → Versión: Nueva versión → Implementar.**
   Así la URL `/exec` no cambia. (Con "Nueva implementación" sale otra URL y habría que cambiar
   `js/config.js`).

## WhatsApp para más familiares (en la misma `Lista web`)

Al final de `Lista web` están **Otros familiares (nombre y teléfono)** y **WhatsApp otros familiares**.
En la primera se escribe, por ejemplo, `Ana 70123456, Luis 69998877`; en la segunda aparece `Ana · Luis`,
cada nombre como enlace de WhatsApp con un mensaje para esa persona y el mismo enlace de su familia.
La invitación sigue a nombre del jefe de familia y se confirma una sola vez. Al cambiar los cupos, o con
el menú 2, los mensajes se actualizan.

## Fotos de los invitados

- La sección aparece en todos los enlaces (`mostrarFotos: true` en `js/config.js`).
- En los enlaces personales (`?id=...`) no se pide nombre: las fotos quedan a nombre de la invitación
  del Excel. En el enlace general el nombre es opcional.
- Con `?fotos` en la URL se salta el sobre y va directo a las fotos: sirve para el QR de las mesas
  (`https://hector99-rod.github.io/invitation/?fotos`).

## Caché

GitHub Pages deja que los teléfonos guarden CSS y JS por 10 minutos. Por eso `index.html` los pide con
`?v=11`: al cambiar `css/estilo.css` o `js/*.js`, suban ese número para que nadie vea una mezcla vieja.
- Cada foto se achica en el teléfono (máx. 2560 px, sin datos de GPS) antes de subirla.
