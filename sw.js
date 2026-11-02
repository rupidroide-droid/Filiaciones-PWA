
/*
 * FILIACIONES PWA
 * Service Worker - Beta 0.9.11
 *
 * Actualización de recursos offline.
 * No elimina actuaciones ni bases de datos.
 */

const CACHE = "filiaciones-app-v0912";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./almacenamiento.js",
  "./exportacion.js?v=0911",
  "./app.js?v=0911",
  "./seguridad.js?v=071",
  "./copias.js?v=080",
  "./boton-copias.js?v=081",
  "./restauracion.js?v=095",
  "./pantalla-restauracion.js?v=094"
];

self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(nombres =>
        Promise.all(
          nombres
            .filter(nombre =>
              nombre.startsWith(
                "filiaciones-app-"
              ) &&
              nombre !== CACHE
            )
            .map(nombre =>
              caches.delete(nombre)
            )
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", evento => {
  const peticion = evento.request;

  if (peticion.method !== "GET") {
    return;
  }

  const url = new URL(peticion.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (peticion.mode === "navigate") {
    evento.respondWith(
      fetch(peticion)
        .then(respuesta => {
          if (respuesta.ok) {
            const copia = respuesta.clone();

            caches.open(CACHE)
              .then(cache =>
                cache.put(
                  "./index.html",
                  copia
                )
              );
          }

          return respuesta;
        })
        .catch(() =>
          caches.match("./index.html")
        )
    );

    return;
  }

  evento.respondWith(
    caches.match(peticion)
      .then(guardado => {
        if (guardado) {
          return guardado;
        }

        return fetch(peticion)
          .then(respuesta => {
            if (
              respuesta.ok &&
              respuesta.type === "basic"
            ) {
              const copia = respuesta.clone();

              caches.open(CACHE)
                .then(cache =>
                  cache.put(
                    peticion,
                    copia
                  )
                );
            }

            return respuesta;
          });
      })
  );
});
