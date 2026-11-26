(function () {
  "use strict";

  var C = window.BODA || {};
  var params = new URLSearchParams(location.search);
  var ID = (params.get("id") || "").trim();
  var DEMO = params.has("demo");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ---------- Cielo estrellado con estrellas fugaces ---------- */
  var cv = $("#estrellas");
  var ctx = cv.getContext("2d");
  var W = 0, H = 0, estrellas = [], fugaz = null, ultimaFugaz = 0;

  function medir() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round((W * H) / 2600);
    estrellas = [];
    for (var i = 0; i < n; i++) {
      var grande = Math.random() < 0.08;
      estrellas.push({
        x: Math.random() * W, y: Math.random() * H,
        r: grande ? 1 + Math.random() * 1.2 : 0.3 + Math.random() * 0.8,
        f: Math.random() * Math.PI * 2, v: 0.4 + Math.random() * 1.4,
        oro: Math.random() < 0.35
      });
    }
    if (reduce) dibujar(0);
  }

  function dibujar(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < estrellas.length; i++) {
      var s = estrellas[i];
      ctx.globalAlpha = reduce ? 0.7 : 0.35 + 0.65 * Math.abs(Math.sin(s.f + t * 0.0009 * s.v));
      ctx.fillStyle = s.oro ? "#F4DE9E" : "#FFFFFF";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
    }
    if (!reduce) {
      if (!fugaz && t - ultimaFugaz > 6000 + Math.random() * 7000) {
        fugaz = { x: W * (0.3 + Math.random() * 0.7), y: H * Math.random() * 0.45, vx: -(5 + Math.random() * 3), vy: 2 + Math.random() * 1.5, vida: 0 };
        ultimaFugaz = t;
      }
      if (fugaz) {
        var L = 16, x2 = fugaz.x - fugaz.vx * L, y2 = fugaz.y - fugaz.vy * L;
        var g = ctx.createLinearGradient(fugaz.x, fugaz.y, x2, y2);
        g.addColorStop(0, "rgba(255,241,200,1)"); g.addColorStop(1, "rgba(255,241,200,0)");
        ctx.globalAlpha = Math.max(0, 1 - fugaz.vida / 55);
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(fugaz.x, fugaz.y); ctx.lineTo(x2, y2); ctx.stroke();
        fugaz.x += fugaz.vx; fugaz.y += fugaz.vy; fugaz.vida++;
        if (fugaz.vida > 55) fugaz = null;
      }
    }
    ctx.globalAlpha = 1;
  }

  function animar(t) {
    if (!document.hidden) dibujar(t);
    requestAnimationFrame(animar);
  }
  medir();
  window.addEventListener("resize", medir);
  if (!reduce) requestAnimationFrame(animar);

  /* ---------- Música ---------- */
  var audio = $("#audio");
  var botonMusica = $("#musica");

  function subirVolumen() {
    if (reduce) { audio.volume = 0.6; return; }
    audio.volume = 0;
    var v = 0;
    var t = setInterval(function () {
      v = Math.min(0.6, v + 0.04);
      audio.volume = v;
      if (v >= 0.6) clearInterval(t);
    }, 120);
  }

  function iniciarMusica() {
    if (!C.musica) return;
    audio.src = C.musica;
    var p = audio.play();
    if (p && p.then) {
      p.then(function () {
        botonMusica.hidden = false;
        botonMusica.classList.remove("pausado");
        subirVolumen();
      }).catch(function (e) {
        if (e && e.name === "NotAllowedError") {
          botonMusica.hidden = false;
          botonMusica.classList.add("pausado");
          botonMusica.setAttribute("aria-label", "Reproducir la música");
        }
      });
    }
  }
  audio.addEventListener("error", function () { botonMusica.hidden = true; });
  botonMusica.addEventListener("click", function () {
    if (audio.paused) {
      audio.play();
      botonMusica.classList.remove("pausado");
      botonMusica.setAttribute("aria-label", "Pausar la música");
    } else {
      audio.pause();
      botonMusica.classList.add("pausado");
      botonMusica.setAttribute("aria-label", "Reproducir la música");
    }
  });

  /* ---------- Portada: abrir el sobre ---------- */
  var body = document.body;
  function abrir() {
    if (body.classList.contains("abriendo")) return;
    body.classList.add("abriendo");
    iniciarMusica();
    setTimeout(function () {
      body.classList.remove("cerrado");
      var p = $("#portada");
      if (p) p.remove();
      window.scrollTo(0, 0);
    }, reduce ? 50 : 2650);
  }
  $("#abrir").addEventListener("click", function (e) { e.stopPropagation(); abrir(); });
  $("#portada").addEventListener("click", abrir);

  /* ---------- Aparición al hacer scroll ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visto"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    $$(".rv").forEach(function (el) { io.observe(el); });
  } else {
    $$(".rv").forEach(function (el) { el.classList.add("visto"); });
  }

  /* ---------- Cuenta regresiva ---------- */
  var objetivo = new Date(C.fecha || "2027-01-02T14:00:00-04:00").getTime();
  var celdas = {};
  $$("#cuenta .num").forEach(function (el) { celdas[el.getAttribute("data-u")] = el; });
  function dos(n) { return n < 10 ? "0" + n : String(n); }
  function tic() {
    var ms = Math.max(0, objetivo - Date.now());
    var d = Math.floor(ms / 864e5); ms -= d * 864e5;
    var h = Math.floor(ms / 36e5); ms -= h * 36e5;
    var m = Math.floor(ms / 6e4); ms -= m * 6e4;
    var s = Math.floor(ms / 1e3);
    celdas.d.textContent = d; celdas.h.textContent = dos(h); celdas.m.textContent = dos(m); celdas.s.textContent = dos(s);
    if (objetivo - Date.now() <= 0) $("#t-cuenta").textContent = "¡Llegó el día!";
  }
  tic();
  setInterval(tic, 1000);

  /* ---------- Mapas, enlaces y calendario ---------- */
  function lugar(k) { return (C.lugares || {})[k] || { busqueda: "" }; }
  $$(".mapa").forEach(function (m) {
    var L = lugar(m.getAttribute("data-lugar"));
    m.querySelector("iframe").src = "https://www.google.com/maps?q=" + encodeURIComponent(L.busqueda) + "&z=15&output=embed";
  });
  $$("[data-maps]").forEach(function (a) {
    var L = lugar(a.getAttribute("data-maps"));
    a.href = L.enlace || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(L.busqueda);
  });
  $$("[data-waze]").forEach(function (a) {
    var L = lugar(a.getAttribute("data-waze"));
    a.href = "https://waze.com/ul?q=" + encodeURIComponent(L.busqueda) + "&navigate=yes";
  });
  var paginaBase = location.origin + location.pathname;
  var cal = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent("Boda de Shana y Héctor") +
    "&dates=20270102T180000Z/20270103T033000Z" +
    "&details=" + encodeURIComponent("14:00 Ceremonia religiosa · Parroquia María Madre, Bolognia\n15:00 Recepción · Espacio de Eventos Thaya, Bajo Llojeta\n16:30 Ceremonia civil\n\nInvitación: " + paginaBase) +
    "&location=" + encodeURIComponent(lugar("iglesia").busqueda);
  $("#agendar").href = cal;

  /* ---------- Confirmación de asistencia ---------- */
  var form = $("#rsvp-form");
  var estado = $("#rsvp-estado");
  var cupos = C.cuposSinEnlace || 6;
  var cantidad = 1;
  var invitacion = null;

  function lugares(n) { return n === 1 ? "1 lugar" : n + " lugares"; }
  function personas(n) { return n === 1 ? "1 persona" : n + " personas"; }

  function fijarCantidad(n) {
    cantidad = Math.max(1, Math.min(cupos, n));
    $("#cantidad").textContent = cantidad;
    $("#menos").disabled = cantidad <= 1;
    $("#mas").disabled = cantidad >= cupos;
  }
  $("#menos").addEventListener("click", function () { fijarCantidad(cantidad - 1); });
  $("#mas").addEventListener("click", function () { fijarCantidad(cantidad + 1); });

  function alCambiarAsistencia() {
    var asiste = form.querySelector('input[name="asiste"]:checked').value === "si";
    $("#campo-cantidad").hidden = !asiste;
    $("#campo-nombres").hidden = !asiste;
  }
  $$('input[name="asiste"]').forEach(function (r) { r.addEventListener("change", alCambiarAsistencia); });

  function mostrarError(t) { estado.textContent = t; estado.classList.add("error"); }

  function conTiempo(promesa, ms) {
    return Promise.race([promesa, new Promise(function (_, no) { setTimeout(function () { no(new Error("tiempo")); }, ms); })]);
  }
  function consultar(id) {
    return conTiempo(fetch(C.appsScriptUrl + "?id=" + encodeURIComponent(id)).then(function (r) { return r.json(); }), 12000);
  }
  function enviar(datos, ms) {
    return conTiempo(fetch(C.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos)
    }).then(function (r) { return r.json(); }), ms || 20000);
  }

  function modoGeneral(aviso) {
    invitacion = null;
    cupos = C.cuposSinEnlace || 6;
    $("#campo-nombre").hidden = false;
    $("#rsvp-familia").hidden = true;
    $("#ayuda-cupos").textContent = "";
    if (aviso) { $("#rsvp-previo").textContent = aviso; $("#rsvp-previo").hidden = false; }
    fijarCantidad(1);
    $("#rsvp-cargando").hidden = true;
    form.hidden = false;
  }

  function modoFamilia(d) {
    invitacion = d;
    cupos = Math.max(1, parseInt(d.cupos, 10) || 1);
    $("#rsvp-nombre").textContent = d.invitacion;
    $("#rsvp-cupos").textContent = lugares(cupos) + " reservados";
    $("#rsvp-familia").hidden = false;
    $("#campo-nombre").hidden = true;
    $("#ayuda-cupos").textContent = "de " + lugares(cupos) + " reservados para ustedes";
    fijarCantidad(cupos);
    // Personalización de la portada (si el sobre sigue en pantalla: si el invitado
    // ya lo abrió, la portada fue eliminada y no hay que tocarla) y del saludo
    if ($("#portada-familia")) {
      $("#portada-familia").textContent = d.invitacion;
      $("#portada-para").hidden = false;
    }
    // Fotos y canciones se guardan a nombre de la invitación (sin pedir ni mostrar el nombre)
    $("#campo-autor").hidden = true;
    $("#reservado-familia").textContent = d.invitacion;
    $("#reservado-cupos").textContent = lugares(cupos);
    marcarSoloAdultos(ID);
    $("#reservado").hidden = false;
    $("#rsvp-cargando").hidden = true;
    // Cada enlace personal se responde una sola vez
    if (yaRespondio(d.estado)) mostrarRespondido(d);
    else form.hidden = false;
  }

  // Invitaciones solo para adultos: compara la huella SHA-256 del ID con config.soloAdultos
  function marcarSoloAdultos(id) {
    var huellas = C.soloAdultos || [];
    if (!id || !huellas.length || !C.notaSoloAdultos || !window.crypto || !crypto.subtle) return;
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(id)).then(function (b) {
      var hex = Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      if (huellas.indexOf(hex) === -1) return;
      $("#reservado-nota").textContent = C.notaSoloAdultos;
      $("#reservado-nota").hidden = false;
    }).catch(function () { /* sin la nota: el resto de la invitación sigue igual */ });
  }

  function yaRespondio(e) { return e === "Confirmado" || e === "No asistirá"; }

  function mostrarRespondido(d) {
    var asistio = d.estado === "Confirmado";
    var n = parseInt(d.asistentes, 10) || 1;
    $("#gracias-titulo").textContent = asistio ? "¡Gracias!" : "Gracias por avisarnos";
    $("#gracias-texto").textContent = asistio
      ? "Ya recibimos su confirmación para " + personas(n) + ". Nos vemos el sábado 2 de enero."
      : "Ya nos avisaron que no podrán acompañarnos. Les extrañaremos mucho.";
    $("#gracias-nota").hidden = false;
    $("#reservado-boton").textContent = "Ver mi confirmación";
    form.hidden = true;
    $("#rsvp-gracias").hidden = false;
  }

  function soloConEnlace() {
    $("#rsvp-cargando").textContent = "Para confirmar, use el enlace personal que le enviamos por WhatsApp.";
    $("#rsvp-cargando").hidden = false;
  }

  if (C.fechaLimite) {
    $("#rsvp-limite").textContent = "Les pedimos confirmar antes del " + C.fechaLimite + ".";
    $("#rsvp-limite").hidden = false;
  }

  var sinEnlace = C.permitirSinEnlace === false ? soloConEnlace : modoGeneral;

  if (ID && DEMO && !C.appsScriptUrl) {
    // Vista de prueba: ?id=prueba&demo=1 (agrega &confirmado=1 para ver el enlace ya usado)
    modoFamilia(params.has("confirmado")
      ? { invitacion: "Familia de prueba", cupos: 4, estado: "Confirmado", asistentes: 3 }
      : { invitacion: "Familia de prueba", cupos: 4, estado: "Pendiente" });
  } else if (ID && C.appsScriptUrl) {
    // Si la primera consulta falla (red lenta o Apps Script "despertando"), se reintenta una vez.
    consultar(ID).catch(function () { return consultar(ID); }).then(function (d) {
      if (d && d.ok) modoFamilia(d);
      else if (C.permitirSinEnlace === false) soloConEnlace();
      else modoGeneral("No encontramos su enlace personal. Pueden confirmar escribiendo su nombre.");
    }).catch(function () {
      $("#rsvp-cargando").textContent = "No pudimos cargar su invitación. Revise su conexión y vuelva a abrir el enlace.";
    });
  } else {
    sinEnlace();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    estado.classList.remove("error");
    var asiste = form.querySelector('input[name="asiste"]:checked').value === "si";
    var datos = {
      id: invitacion ? ID : "",
      nombre: $("#f-nombre").value.trim(),
      asiste: asiste,
      asistentes: asiste ? cantidad : 0,
      nombres: asiste ? $("#f-nombres").value.trim() : "",
      mensaje: $("#f-mensaje").value.trim()
    };
    if (!invitacion && !datos.nombre) {
      mostrarError("Por favor, escriba su nombre.");
      $("#f-nombre").focus();
      return;
    }
    if (!C.appsScriptUrl && !DEMO) {
      mostrarError("El registro de confirmaciones se activará muy pronto. Gracias por su paciencia.");
      return;
    }
    var boton = $("#enviar");
    boton.disabled = true;
    estado.textContent = "Enviando…";
    var envio = (!C.appsScriptUrl && DEMO) ? Promise.resolve({ ok: true }) : enviar(datos);
    envio.then(function (r) {
      if (r && r.error === "ya_respondio") { estado.textContent = ""; mostrarRespondido(r); return; }
      if (!r || !r.ok) throw new Error((r && r.error) || "error");
      estado.textContent = "";
      $("#gracias-titulo").textContent = asiste ? "¡Gracias!" : "Gracias por avisarnos";
      $("#gracias-texto").textContent = asiste
        ? "Registramos " + personas(datos.asistentes) + ". Nos vemos el sábado 2 de enero."
        : "Les extrañaremos mucho. Gracias por acompañarnos con su cariño.";
      if (invitacion) {
        $("#gracias-nota").hidden = false;
        $("#reservado-boton").textContent = "Ver mi confirmación";
      }
      form.hidden = true;
      $("#rsvp-gracias").hidden = false;
    }).catch(function () {
      mostrarError("No pudimos enviar su confirmación. Revise su conexión e inténtelo de nuevo.");
    }).then(function () {
      boton.disabled = false;
    });
  });

  /* ---------- Canciones pedidas ---------- */
  if (C.pedirCanciones !== false) iniciarCanciones();

  function iniciarCanciones() {
    var formC = $("#cancion-form"), botonC = $("#cancion-enviar"), estadoC = $("#cancion-estado");
    var campoC = $("#f-cancion"), campoA = $("#f-artista"), pedidas = $("#canciones-pedidas");
    $("#canciones").hidden = false;

    function error(texto) { estadoC.textContent = texto; estadoC.classList.add("error"); }

    formC.addEventListener("submit", function (e) {
      e.preventDefault();
      estadoC.classList.remove("error");
      var cancion = campoC.value.trim(), artista = campoA.value.trim();
      if (!cancion) { error("Escriban el nombre de la canción."); campoC.focus(); return; }
      if (!C.appsScriptUrl) { error("Muy pronto podrán pedir canciones."); return; }
      botonC.disabled = true;
      estadoC.textContent = "Enviando…";
      // "familia" y no "id": ver guardarCancion_ en Code.gs
      enviar({ tipo: "cancion", familia: invitacion ? ID : "", cancion: cancion, artista: artista }).then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.error) || "error");
        var li = document.createElement("li");
        li.textContent = artista ? cancion + " · " + artista : cancion;
        pedidas.appendChild(li);
        campoC.value = "";
        campoA.value = "";
        estadoC.textContent = "¡Anotada! Pueden pedir otra cuando quieran.";
      }).catch(function (err) {
        console.warn("No se pudo pedir la canción:", err.message);
        error(err.message === "tiempo" || err instanceof TypeError
          ? "No pudimos enviarla. Revisen su conexión e inténtenlo de nuevo."
          : "No pudimos anotarla. Inténtenlo de nuevo en unos minutos.");
      }).then(function () {
        botonC.disabled = false;
      });
    });
  }

  /* ---------- Fotos de los invitados ---------- */
  var VER_FOTOS = params.has("fotos");
  if (VER_FOTOS || C.mostrarFotos !== false) iniciarFotos();

  function iniciarFotos() {
    var MAX_LADO = 2560;            // px del lado mayor tras achicar
    var CALIDAD = 0.88;             // calidad JPEG (0 a 1)
    var MAX_ORIGINAL = 15 * 1024 * 1024; // si no se puede achicar, se envía tal cual hasta 15 MB
    var MAX_COLA = 30;              // fotos por tanda (cuida la memoria del teléfono)
    var seccion = $("#fotos"), formF = $("#fotos-form"), input = $("#f-fotos");
    var lista = $("#fotos-lista"), botonF = $("#fotos-enviar"), estadoF = $("#fotos-estado");
    var cola = [];                  // { file, li, url, estado: "espera" | "subiendo" | "listo" | "error" }
    var subiendo = false;

    seccion.hidden = false;
    if (VER_FOTOS) {
      // Desde el QR de las mesas: sin sobre ni música, directo a las fotos.
      body.classList.remove("cerrado");
      var p = $("#portada");
      if (p) p.remove();
      seccion.classList.add("visto");
      // "instant": sin esto, el scroll suave del CSS recorre toda la invitación (varios segundos).
      var ir = function () { seccion.scrollIntoView({ behavior: "instant", block: "start" }); };
      if (document.readyState === "complete") ir(); else window.addEventListener("load", ir);
    }

    function fotos(n) { return n === 1 ? "1 foto" : n + " fotos"; }
    function porSubir() { return cola.filter(function (i) { return i.estado === "espera" || i.estado === "error"; }); }
    function pintar(item) { item.li.className = "foto " + item.estado; }
    function actualizar() {
      var n = porSubir().length;
      formF.classList.toggle("ocupado", subiendo);
      botonF.disabled = subiendo || n === 0;
      botonF.textContent = n ? "Subir " + fotos(n) : "Subir fotos";
    }

    input.addEventListener("change", function () {
      var omitidas = 0;
      Array.prototype.forEach.call(input.files, function (file) {
        if (file.type && file.type.indexOf("image/") !== 0) return;
        if (porSubir().length >= MAX_COLA) { omitidas++; return; }
        var li = document.createElement("li");
        var img = document.createElement("img");
        img.alt = "";
        img.decoding = "async";
        img.src = URL.createObjectURL(file);
        var quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "foto-quitar";
        quitar.textContent = "×";
        quitar.setAttribute("aria-label", "Quitar " + file.name);
        li.appendChild(img);
        li.appendChild(quitar);
        var item = { file: file, li: li, url: img.src, estado: "espera" };
        quitar.addEventListener("click", function () {
          if (subiendo) return;
          cola.splice(cola.indexOf(item), 1);
          li.remove();
          URL.revokeObjectURL(item.url);
          actualizar();
        });
        cola.push(item);
        pintar(item);
        lista.appendChild(li);
      });
      input.value = ""; // permite volver a elegir las mismas fotos
      estadoF.classList.remove("error");
      estadoF.textContent = omitidas ? "Pueden subir hasta " + MAX_COLA + " fotos por vez; después elijan las demás." : "";
      actualizar();
    });

    // Achica la foto en el navegador: menos megas, subida más rápida y sin datos de GPS.
    function achicar(file) {
      return new Promise(function (ok, no) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, MAX_LADO / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement("canvas");
          c.width = Math.round(img.naturalWidth * k);
          c.height = Math.round(img.naturalHeight * k);
          var g = c.getContext("2d");
          g.fillStyle = "#fff"; // las PNG transparentes no quedan negras
          g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) { if (b) ok(b); else no(new Error("toBlob")); }, "image/jpeg", CALIDAD);
        };
        img.onerror = function () { URL.revokeObjectURL(url); no(new Error("formato")); };
        img.src = url;
      });
    }

    function aBase64(blob) {
      return new Promise(function (ok, no) {
        var r = new FileReader();
        r.onload = function () { ok(String(r.result).split(",")[1]); };
        r.onerror = function () { no(r.error); };
        r.readAsDataURL(blob);
      });
    }

    async function subirUna(item, autor) {
      var blob;
      try {
        blob = await achicar(item.file);
        if (blob.size > item.file.size && item.file.type === "image/jpeg") blob = item.file;
      } catch (err) {
        // Un formato que este navegador no sabe abrir (p. ej. HEIC en Android): va tal cual.
        if (item.file.size > MAX_ORIGINAL) throw err;
        blob = item.file;
      }
      var r = await enviar({
        tipo: "foto",
        archivo: await aBase64(blob),
        autor: autor,
        original: item.file.name,
        modificada: new Date(item.file.lastModified || Date.now()).toISOString()
      }, 120000);
      if (!r || !r.ok) throw new Error((r && r.error) || "error");
    }

    formF.addEventListener("submit", async function (e) {
      e.preventDefault();
      var tanda = porSubir();
      if (subiendo || !tanda.length) return;
      estadoF.classList.remove("error");
      if (!C.appsScriptUrl) {
        estadoF.textContent = "La subida de fotos se activará muy pronto.";
        estadoF.classList.add("error");
        return;
      }
      subiendo = true;
      actualizar();
      // Enlace personal: el nombre viene del Excel. Enlace general: el que escriban (opcional).
      var autor = invitacion ? invitacion.invitacion : $("#f-autor").value.trim();
      var bien = 0, porConexion = false;
      // Una por una: así el progreso es claro y una foto fallida no frena a las demás.
      for (var i = 0; i < tanda.length; i++) {
        var item = tanda[i];
        estadoF.textContent = "Subiendo " + (i + 1) + " de " + tanda.length + "…";
        item.estado = "subiendo";
        pintar(item);
        try {
          await subirUna(item, autor);
          item.estado = "listo";
          bien++;
        } catch (err) {
          item.estado = "error";
          // "tiempo" = el servidor no respondió; TypeError = sin internet.
          // Cualquier otro error lo reportó el servidor (p. ej. falta un permiso).
          if (err.message === "tiempo" || err instanceof TypeError) porConexion = true;
          console.warn("No se pudo subir " + item.file.name + ":", err.message);
        }
        pintar(item);
      }
      subiendo = false;
      actualizar();
      var mal = tanda.length - bien;
      if (mal) {
        estadoF.textContent = (bien ? "Recibimos " + fotos(bien) + ". " : "") +
          (mal === 1 ? "1 foto no se pudo subir" : mal + " fotos no se pudieron subir") +
          " (marcadas con !). " + (porConexion
            ? "Revisen su conexión y toquen «Subir» de nuevo."
            : "Inténtenlo de nuevo en unos minutos.");
        estadoF.classList.add("error");
      } else {
        estadoF.textContent = "¡Gracias! Recibimos " + fotos(bien) + ". Pueden elegir más cuando quieran.";
      }
    });

    window.addEventListener("beforeunload", function (e) {
      if (subiendo) { e.preventDefault(); e.returnValue = ""; }
    });
  }
})();
