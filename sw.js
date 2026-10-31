
/*
 * FILIACIONES
 * Service Worker
 * Beta 0.9.10
 *
 * Gestiona la caché de los archivos
 * necesarios para el funcionamiento
 * sin conexión.
 *
 * No modifica ni elimina actuaciones
 * del almacenamiento cifrado.
 */

"use strict";

const CACHE = "filiaciones-app-v0910";

const ARCHIVOS = [
  "./",
  "./index.html",

  "./almacenamiento.js",

  "./exportacion.js?v=0910",
  "./app.js?v=0910",

  "./seguridad.js?v=071",

  "./copias.js?v=080",
  "./boton-copias.js?v=081",

  "./restauracion.js?v=095",
  "./pantalla-restauracion.js?v=094"
];

/*
 * INSTALACIÓN
 *
 * Guarda los archivos de la aplicación
 * para que puedan utilizarse sin conexión.
 */

self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

/*
 * ACTIVACIÓN
 *
 * Elimina únicamente las cachés antiguas
 * cuyo nombre comience por
 * "filiaciones-app-".
 *
 * No accede a IndexedDB ni a los datos
 * cifrados de las actuaciones.
 */

self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(nombres => {
        return Promise.all(
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
        );
      })
      .then(() => self.clients.claim())
  );
});

/*
 * PETICIONES
 *
 * Navegación:
 * intenta primero la red.
 * Si no hay conexión, utiliza
 * la página almacenada.
 *
 * Archivos estáticos:
 * utiliza primero la caché.
 */

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

            evento.waitUntil(
              caches.open(CACHE)
                .then(cache =>
                  cache.put(
                    "./index.html",
                    copia
                  )
                )
            );
          }

          return respuesta;
        })
        .catch(async () => {
          const cache =
            await caches.open(CACHE);

          return (
            await cache.match(
              "./index.html"
            )
          ) || Response.error();
        })
    );

    return;
  }

  evento.respondWith(
    caches.match(peticion)
      .then(respuestaGuardada => {
        if (respuestaGuardada) {
          return respuestaGuardada;
        }

        return fetch(peticion);
      })
  );
});
