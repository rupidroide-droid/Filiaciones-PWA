
/*
 * Filiaciones Beta 0.9.3
 * Caché de aplicación con restauración.
 *
 * Las actuaciones no se guardan en
 * Cache Storage, sino en IndexedDB.
 */

const CACHE = "filiaciones-app-v093";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./app.js?v=061",
  "./almacenamiento.js",
  "./seguridad.js?v=071",
  "./copias.js?v=080",
  "./boton-copias.js?v=081",
  "./restauracion.js?v=092",
  "./pantalla-restauracion.js?v=093"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(
              key =>
                key.startsWith("filiaciones-app-") &&
                key !== CACHE
            )
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const esNavegacion =
    req.mode === "navigate";

  const esArchivo =
    /\/(?:index\.html|app\.js|almacenamiento\.js|seguridad\.js|copias\.js|boton-copias\.js|restauracion\.js|pantalla-restauracion\.js)$/.test(
      url.pathname
    );

  if (!esNavegacion && !esArchivo) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if (esNavegacion) {
      try {
        const respuesta = await fetch(req);

        if (respuesta.ok) {
          return respuesta;
        }

        return (
          (await cache.match("./index.html")) ||
          respuesta
        );
      } catch {
        return (
          (await cache.match("./index.html")) ||
          Response.error()
        );
      }
    }

    const guardada = await cache.match(req);

    if (guardada) {
      return guardada;
    }

    return fetch(req);
  })());
});
