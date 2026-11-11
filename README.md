# Invitación web · Shana & Héctor

Página de la boda (sábado 2 de enero de 2027, La Paz) con confirmación de asistencia por familia.

- `index.html`, `css/`, `js/`, `img/`: la página.
- `js/config.js`: único archivo de ajustes (URL del Apps Script, fecha límite, música, lugares).
- `musica/cancion.mp3`: canción de fondo (agregar el archivo).
- `apps-script/Code.gs`: código para la hoja de Google "Invitados".

## Enlaces personales

Cada familia recibe un enlace `https://hector99-rod.github.io/invitation/?id=XXXXXXX`. La página muestra su nombre y
los cupos reservados, y solo deja confirmar hasta ese número. Sin `?id=` la página funciona igual y pide
el nombre (máximo 6 personas). Para probar sin la hoja: `?id=prueba&demo=1`.

## Conectar la hoja de Google

1. Abrir la hoja "Invitados" → Extensiones → Apps Script.
2. Borrar el contenido de `Código.gs`, pegar `apps-script/Code.gs` (la dirección de la página ya está puesta).
3. Guardar, recargar la hoja y usar el menú **Boda S&H → 1 · Preparar lista web** (pedirá permisos la primera vez).
4. Revisar la pestaña "Lista web": cupos y teléfonos. Luego **2 · Generar enlaces y mensajes de WhatsApp**.
5. En Apps Script: Implementar → Nueva implementación → Aplicación web → Ejecutar como: yo; Quién tiene acceso: cualquier persona.
6. Copiar la URL que termina en `/exec` y pegarla en `appsScriptUrl` de `js/config.js`.

Si cambian el código del Apps Script, hay que crear una nueva versión en Implementar → Gestionar implementaciones.
