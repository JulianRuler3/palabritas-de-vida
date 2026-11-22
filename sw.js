// Sube este número cada vez que cambies algo (frases, estilos…) para que se actualice
const VERSION = "v8";
const CACHE = "frase-del-dia-" + VERSION;
const ARCHIVOS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/frases.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/logo-sion.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero la caché (funciona sin conexión); si no está, la red
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request))
  );
});
