
/* Filiaciones Beta 0.7 - solo archivos de la aplicación, nunca actuaciones */
const CACHE = 'filiaciones-app-v07';
const ARCHIVOS = ['./', './index.html', './app.js?v=061', './almacenamiento.js', './seguridad.js?v=070'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('filiaciones-app-') && k !== CACHE)
          .map(k => caches.delete(k))
      )
    ),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (
    req.method !== 'GET' ||
    new URL(req.url).origin !== self.location.origin
  ) return;

  const url = new URL(req.url);
  const ruta = url.pathname;
  const esNavegacion = req.mode === 'navigate';
  const esArchivo = /\/(?:index\.html|app\.js|almacenamiento\.js|seguridad\.js)$/.test(ruta);

  if (!esNavegacion && !esArchivo) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if (esNavegacion) {
      try {
        const respuesta = await fetch(req);
        return respuesta.ok
          ? respuesta
          : (await cache.match('./index.html')) || respuesta;
      } catch {
        return (await cache.match('./index.html')) || Response.error();
      }
    }

    const guardada = await cache.match(req);
    if (guardada) return guardada;

    return fetch(req);
  })());
});
