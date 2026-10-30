
/* Filiaciones Beta 0.7 - seguridad de sesión */
"use strict";

(() => {
  let bloqueoEnCurso = false;

  function bloquearPorSeguridad() {
    if (bloqueoEnCurso) return;

    if (
      typeof Almacenamiento === "undefined" ||
      !Almacenamiento.desbloqueado()
    ) return;

    bloqueoEnCurso = true;

    try {
      // Elimina la referencia a la clave criptográfica.
      Almacenamiento.bloquear();

      // Oculta los datos visibles inmediatamente.
      const principal = document.querySelector("main");

      if (principal) {
        principal.replaceChildren();

        const mensaje = document.createElement("p");
        mensaje.textContent =
          "Sesión bloqueada por seguridad.";

        principal.appendChild(mensaje);
      }

      // Regresa a la pantalla de acceso.
      if (typeof acceso === "function") {
        acceso();
      }
    } finally {
      bloqueoEnCurso = false;
    }
  }

  // Bloqueo al abandonar la aplicación.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      bloquearPorSeguridad();
    }
  });

  // Protección adicional al salir de la página.
  window.addEventListener("pagehide", bloquearPorSeguridad);
})();
