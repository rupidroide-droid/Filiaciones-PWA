
/* Filiaciones Beta 0.8 - control de copias */
"use strict";

(() => {
  function actualizarBoton() {
    const existente =
      document.getElementById("boton-copia-segura");

    const desbloqueada =
      typeof Almacenamiento !== "undefined" &&
      Almacenamiento.desbloqueado();

    if (!desbloqueada) {
      if (existente) existente.remove();
      return;
    }

    if (existente) return;

    const boton = document.createElement("button");
    boton.id = "boton-copia-segura";
    boton.type = "button";
    boton.textContent = "Crear copia de seguridad cifrada";

    boton.addEventListener("click", async () => {
      if (!Almacenamiento.desbloqueado()) return;

      try {
        const cantidad = await Copias.exportar();

        alert(
          "Se ha solicitado la descarga de una copia con " +
          cantidad + " actuaciones cifradas. " +
          "Comprueba que el archivo se haya guardado."
        );
      } catch (error) {
        alert("Error: " + error.message);
      }
    });

    const principal = document.querySelector("main");
    if (principal) principal.appendChild(boton);
  }

  document.addEventListener(
    "DOMContentLoaded",
    actualizarBoton
  );

  document.addEventListener(
    "visibilitychange",
    actualizarBoton
  );

  // Revisa los cambios de pantalla y de sesión.
  const observador = new MutationObserver(() => {
    actualizarBoton();
  });

  function iniciar() {
    if (document.body) {
      observador.observe(document.body, {
        childList: true,
        subtree: true
      });
      actualizarBoton();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
