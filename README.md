# Invitacion Boda

Invitación web con confirmación personal

- Apertura con sobre y lacre, música y cuenta regresiva
- Personalizada
- Ceremonia, recepción e itinerario con mapas
- Confirmación de asistencia con enlace personal por familia
- Fotos de los invitados: las suben desde la página y llegan a una carpeta de Google Drive

Hecha con HTML, CSS y JavaScript, publicada con GitHub Pages.

## Cómo se conecta

```
Página (GitHub Pages) ──fetch──► Apps Script (URL /exec en js/config.js) ──► Google Sheet + Drive
```

El Apps Script vive dentro de la hoja (Extensiones → Apps Script). `apps-script/Code.gs` es una copia
de ese código: si se cambia aquí, hay que pegarlo allá y publicar una versión nueva.

Pestañas que usa el script: `Invitaciones` (lista escrita a mano), `Lista web` (una fila por familia),
`Respuestas web` (historial de confirmaciones) y `Fotos web` (registro de fotos subidas).
No hay que cambiarles el nombre.

## Actualizar el Apps Script

1. Copiar todo `apps-script/Code.gs` y pegarlo en el editor de Apps Script de la hoja. Guardar.
2. En la hoja, recargar y usar el menú **Boda S&H → Preparar carpeta de fotos** (la primera vez Google
   pide permiso para usar Drive).
3. **Implementar → Gestionar implementaciones → ✏️ editar → Versión: Nueva versión → Implementar.**
   Así la URL `/exec` no cambia. (Con "Nueva implementación" sale otra URL y habría que cambiar
   `js/config.js`).

## Fotos de los invitados

- La sección aparece sola desde la fecha `fotosDesde` de `js/config.js`.
- Con `?fotos` en la URL se ve antes y salta el sobre: sirve para probarla y para el QR de las mesas
  (`https://hector99-rod.github.io/invitation/?fotos`).
- Cada foto se achica en el teléfono (máx. 2560 px, sin datos de GPS) antes de subirla.
