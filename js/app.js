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
  function enviar(datos) {
    return conTiempo(fetch(C.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos)
    }).then(function (r) { return r.json(); }), 20000);
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
    fijarCantidad(d.asistentes ? parseInt(d.asistentes, 10) : cupos);
    if (d.estado === "Confirmado" || d.estado === "No asistirá") {
      $("#rsvp-previo").textContent = d.estado === "Confirmado"
        ? "Ya recibimos su confirmación para " + personas(parseInt(d.asistentes, 10) || 1) + ". Si necesitan cambiarla, envíen el formulario de nuevo."
        : "Nos avisaron que no podrán asistir. Si sus planes cambian, pueden responder de nuevo.";
      $("#rsvp-previo").hidden = false;
      if (d.estado === "No asistirá") { form.querySelector('input[value="no"]').checked = true; alCambiarAsistencia(); }
    }
    // Personalización de la portada y del saludo
    $("#portada-familia").textContent = d.invitacion;
    $("#portada-para").hidden = false;
    $("#reservado-familia").textContent = d.invitacion;
    $("#reservado-cupos").textContent = lugares(cupos);
    $("#reservado").hidden = false;
    $("#rsvp-cargando").hidden = true;
    form.hidden = false;
  }

  if (C.fechaLimite) {
    $("#rsvp-limite").textContent = "Les pedimos confirmar antes del " + C.fechaLimite + ".";
    $("#rsvp-limite").hidden = false;
  }

  if (ID && DEMO && !C.appsScriptUrl) {
    modoFamilia({ invitacion: "Familia de prueba", cupos: 4, estado: "Pendiente" });
  } else if (ID && C.appsScriptUrl) {
    consultar(ID).then(function (d) {
      if (d && d.ok) modoFamilia(d);
      else modoGeneral("No encontramos su enlace personal. Pueden confirmar escribiendo su nombre.");
    }).catch(function () {
      modoGeneral();
    });
  } else {
    modoGeneral();
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
      if (!r || !r.ok) throw new Error((r && r.error) || "error");
      estado.textContent = "";
      $("#gracias-titulo").textContent = asiste ? "¡Gracias!" : "Gracias por avisarnos";
      $("#gracias-texto").textContent = asiste
        ? "Registramos " + personas(datos.asistentes) + ". Nos vemos el sábado 2 de enero."
        : "Les extrañaremos mucho. Gracias por acompañarnos con su cariño.";
      form.hidden = true;
      $("#rsvp-gracias").hidden = false;
      try { localStorage.setItem("rsvp-" + (ID || "general"), JSON.stringify({ asiste: asiste, n: datos.asistentes })); } catch (err) { /* sin almacenamiento */ }
    }).catch(function () {
      mostrarError("No pudimos enviar su confirmación. Revise su conexión e inténtelo de nuevo.");
    }).then(function () {
      boton.disabled = false;
    });
  });

  $("#cambiar").addEventListener("click", function () {
    $("#rsvp-gracias").hidden = true;
    form.hidden = false;
  });
})();
