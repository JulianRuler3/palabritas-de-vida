(function () {
  var FRASES = window.FRASES || [];
  var tarjeta = document.getElementById("tarjeta");
  var fraseEl = document.getElementById("frase");
  var pistaEl = document.getElementById("pista");
  var citaEl = document.getElementById("cita");
  var fechaEl = document.getElementById("fecha");
  var CLAVE = "frase-del-dia";
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Una vez al día: el bloqueo dura hasta que cambia la fecha ----------
  function ahora() { return new Date(); }

  function hoy() {
    var d = ahora();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch (e) {} }

  function pintarFecha() {
    try {
      fechaEl.textContent = ahora().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    } catch (e) { fechaEl.textContent = ""; }
  }

  // Separa la cita final: "(Juan 3, 16)" o " - San Agustín"
  function separar(texto) {
    var m = texto.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    if (m && m[1]) return { frase: m[1], cita: m[2] };
    var k = texto.lastIndexOf(" - ");
    if (k > 0) return { frase: texto.slice(0, k), cita: texto.slice(k + 3) };
    return { frase: texto, cita: "" };
  }

  function mostrarUsada(texto) {
    var p = separar(texto);
    fraseEl.textContent = p.frase;
    fraseEl.hidden = false;
    fraseEl.classList.toggle("larga", p.frase.length > 110);
    fraseEl.classList.toggle("muy-larga", p.frase.length > 200);
    citaEl.textContent = p.cita;
    citaEl.hidden = !p.cita;
    pistaEl.textContent = "Vuelve mañana para otra";
    tarjeta.disabled = true;
    tarjeta.classList.add("usada");
  }
  function mostrarDisponible() {
    fraseEl.hidden = true;
    fraseEl.textContent = "";
    citaEl.hidden = true;
    citaEl.textContent = "";
    pistaEl.textContent = FRASES.length ? "Ver la frase de hoy" : "Aún no hay frases";
    tarjeta.disabled = !FRASES.length;
    tarjeta.classList.remove("usada", "revelando", "soplando");
  }
  function comprobar() {
    pintarFecha();
    var g = leer();
    if (g && g.fecha === hoy()) mostrarUsada(g.texto);
    else mostrarDisponible();
  }

  tarjeta.addEventListener("click", function () {
    var g = leer();
    if (!FRASES.length || (g && g.fecha === hoy())) return;
    // Totalmente al azar: puede salir cualquiera, también la de ayer
    var texto = FRASES[Math.floor(Math.random() * FRASES.length)];
    guardar({ fecha: hoy(), texto: texto });

    if (reducido) { mostrarUsada(texto); return; }

    // 1) Viento recio  2) desciende la lengua de fuego  3) aparece la frase
    tarjeta.disabled = true;
    tarjeta.classList.add("soplando");
    if (cielo) cielo.rafaga();
    setTimeout(function () {
      tarjeta.classList.add("revelando");
      mostrarUsada(texto);
    }, 420);
    setTimeout(function () { tarjeta.classList.remove("soplando", "revelando"); }, 2200);
  });

  // Si la app sigue abierta a medianoche, se desbloquea sola
  function programarMedianoche() {
    var a = new Date();
    var m = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1, 0, 0, 1);
    setTimeout(function () { comprobar(); programarMedianoche(); }, m - a);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) comprobar(); });

  // ---------- Partículas: polvo de luz que sube (claro) / brasas (oscuro) ----------
  var cielo = (function () {
    var c = document.getElementById("cielo");
    var ctx = c.getContext && c.getContext("2d");
    if (!ctx) return null;
    var w, h, dpr, pts = [], color = "", oscuro = false, vivo = true, viento = 0;
    var mq = window.matchMedia("(prefers-color-scheme: dark)");

    function leerColor() {
      color = getComputedStyle(document.documentElement).getPropertyValue("--mote").trim();
      oscuro = mq.matches;
    }
    function crear(enFondo) {
      return {
        x: Math.random() * w,
        y: enFondo ? (oscuro ? -10 - Math.random() * 40 : h + Math.random() * 40) : Math.random() * h,
        r: oscuro ? 0.5 + Math.random() * 1.3 : 0.6 + Math.random() * 1.8,
        v: 0.15 + Math.random() * 0.45,
        f: Math.random() * Math.PI * 2,
        a: 0.25 + Math.random() * 0.6
      };
    }
    function montar() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, (w * h) / 14000));
      pts = []; for (var i = 0; i < n; i++) pts.push(crear(false));
    }
    function pintar(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      viento *= 0.965;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        // claro: la luz sube; oscuro: la luz desciende despacio
        p.y += oscuro ? p.v * 0.45 : -p.v * 0.8;
        p.x += Math.sin(t / 1800 + p.f) * 0.25 + viento * (0.6 + p.v);
        if (p.y < -60 || p.y > h + 60 || p.x > w + 20) { pts[i] = crear(true); continue; }
        var parpadeo = oscuro ? 0.7 + 0.3 * Math.sin(t / 1400 + p.f * 3) : 1;
        // claro: se apagan al subir; oscuro: más vivas arriba, se apagan al bajar
        var alto = oscuro ? Math.max(0, Math.min(1, 1.1 - p.y / h)) : Math.max(0, Math.min(1, p.y / h + 0.15));
        ctx.globalAlpha = p.a * parpadeo * alto;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function bucle(t) { if (!vivo) return; pintar(t); requestAnimationFrame(bucle); }

    leerColor(); montar();
    window.addEventListener("resize", montar);
    if (mq.addEventListener) mq.addEventListener("change", function () { leerColor(); montar(); });

    if (reducido) { pintar(0); return { rafaga: function () {} }; }
    document.addEventListener("visibilitychange", function () {
      vivo = !document.hidden; if (vivo) requestAnimationFrame(bucle);
    });
    requestAnimationFrame(bucle);
    return { rafaga: function () { viento = 9; } };
  })();

  comprobar();
  programarMedianoche();

  // ---------- Instalable y sin conexión ----------
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
