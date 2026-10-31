
"use strict";

/*
 * FILIACIONES - PANTALLA DE RESTAURACIÓN
 * Beta 0.9.4
 *
 * Observador controlado.
 * Diagnóstico visible.
 * Importación con confirmación.
 */

(() => {
  let panel = null;
  let preparado = false;
  let ocupado = false;
  let programado = false;

  function elemento(tipo, texto = "") {
    const el = document.createElement(tipo);
    if (texto) el.textContent = texto;
    return el;
  }

  function desbloqueada() {
    return (
      typeof Almacenamiento !== "undefined" &&
      Almacenamiento.desbloqueado()
    );
  }

  function descartar() {
    preparado = false;

    if (typeof Restauracion !== "undefined") {
      Restauracion.descartar();
    }
  }

  function crearPantalla() {
    const seccion = elemento("section");
    seccion.id = "panel-restauracion";

    seccion.style.cssText = `
      padding:16px;
      margin:16px 0;
      border:1px solid #999;
      border-radius:12px;
      background:#f7f7f7;
      color:#222;
    `;

    const titulo = elemento(
      "h2",
      "Restaurar actuaciones"
    );

    const descripcion = elemento(
      "p",
      "Selecciona una copia cifrada. " +
      "Las actuaciones existentes no se sobrescribirán."
    );

    const archivo = elemento("input");
    archivo.type = "file";
    archivo.accept = ".json,application/json";
    archivo.style.width = "100%";

    const password = elemento("input");
    password.type = "password";
    password.placeholder = "Contraseña de la copia";
    password.autocomplete = "off";
    password.style.cssText = `
      width:100%;
      box-sizing:border-box;
      padding:12px;
      margin:12px 0;
    `;

    const analizar = elemento(
      "button",
      "Analizar copia"
    );

    const importar = elemento(
      "button",
      "Confirmar importación"
    );

    const cancelar = elemento(
      "button",
      "Cancelar restauración"
    );

    importar.disabled = true;

    for (const boton of [
      analizar,
      importar,
      cancelar
    ]) {
      boton.type = "button";
      boton.style.cssText = `
        display:block;
        width:100%;
        padding:12px;
        margin:8px 0;
        border-radius:8px;
      `;
    }

    const estado = elemento("p");
    estado.setAttribute("role", "status");
    estado.setAttribute("aria-live", "polite");
    estado.style.cssText = `
      font-weight:600;
      white-space:pre-wrap;
    `;

    const listado = elemento("ul");

    function mensaje(texto) {
      estado.textContent = texto;
    }

    function reiniciar() {
      descartar();
      importar.disabled = true;
      listado.replaceChildren();
    }

    archivo.addEventListener("change", () => {
      reiniciar();

      if (archivo.files.length) {
        mensaje(
          "Archivo seleccionado. " +
          "Introduce la contraseña y pulsa Analizar copia."
        );
      } else {
        mensaje("No hay archivo seleccionado.");
      }
    });

    analizar.addEventListener("click", async () => {
      if (ocupado) return;

      reiniciar();

      if (!desbloqueada()) {
        mensaje("Error: aplicación bloqueada.");
        return;
      }

      if (!archivo.files.length) {
        mensaje("Error: selecciona una copia JSON.");
        return;
      }

      if (!password.value) {
        mensaje("Error: introduce la contraseña.");
        return;
      }

      ocupado = true;
      analizar.disabled = true;
      mensaje("Analizando copia cifrada...");

      try {
        if (typeof Restauracion === "undefined") {
          throw Error(
            "El módulo de restauración no está cargado"
          );
        }

        const resultado = await Restauracion.preparar(
          archivo.files[0],
          password.value
        );

        if (!desbloqueada()) {
          throw Error(
            "La aplicación se ha bloqueado durante el análisis"
          );
        }

        let nuevas = 0;
        let duplicadas = 0;

        for (const item of resultado) {
          const li = elemento("li");

          li.textContent =
            item.referencia +
            (item.duplicada
              ? " — Ya existe"
              : " — Nueva");

          listado.appendChild(li);

          if (item.duplicada) {
            duplicadas++;
          } else {
            nuevas++;
          }
        }

        preparado = nuevas > 0;
        importar.disabled = !preparado;

        mensaje(
          "Análisis completado.\n" +
          "Nuevas: " + nuevas + ".\n" +
          "Duplicadas: " + duplicadas + "."
        );

        if (!preparado) {
          mensaje(
            estado.textContent +
            "\nNo hay actuaciones nuevas para importar."
          );
        }

      } catch (error) {
        reiniciar();

        mensaje(
          "Error al analizar:\n" +
          (error?.message || String(error))
        );

      } finally {
        password.value = "";
        ocupado = false;
        analizar.disabled = false;
      }
    });

    importar.addEventListener("click", async () => {
      if (!preparado || ocupado) return;

      if (!desbloqueada()) {
        reiniciar();
        mensaje("Desbloquea Filiaciones nuevamente.");
        return;
      }

      const confirmado = window.confirm(
        "¿Confirmas la incorporación de las " +
        "actuaciones nuevas?\n\n" +
        "Las existentes no se sobrescribirán."
      );

      if (!confirmado) return;

      ocupado = true;
      importar.disabled = true;
      analizar.disabled = true;

      mensaje("Importando actuaciones...");

      try {
        const resultado =
          await Restauracion.importar(true);

        preparado = false;
        listado.replaceChildren();
        archivo.value = "";

        mensaje(
          "Importación finalizada.\n" +
          "Importadas: " + resultado.importadas + ".\n" +
          "Duplicadas: " + resultado.duplicadas + ".\n" +
          "Errores: " + resultado.errores + ".\n" +
          "Consulta las actuaciones guardadas."
        );

      } catch (error) {
        reiniciar();

        mensaje(
          "Error de importación:\n" +
          (error?.message || String(error))
        );

      } finally {
        ocupado = false;
        analizar.disabled = false;
      }
    });

    cancelar.addEventListener("click", () => {
      if (ocupado) {
        mensaje(
          "Espera a que termine la operación."
        );
        return;
      }

      reiniciar();
      archivo.value = "";
      password.value = "";

      mensaje("Restauración cancelada.");
    });

    seccion.append(
      titulo,
      descripcion,
      archivo,
      password,
      analizar,
      importar,
      cancelar,
      estado,
      listado
    );

    return seccion;
  }

  function actualizar() {
    programado = false;

    const main = document.querySelector("main");

    if (!main) return;

    if (!desbloqueada()) {
      descartar();

      if (panel?.isConnected) {
        panel.remove();
      }

      panel = null;
      return;
    }

    if (
      !panel ||
      !panel.isConnected ||
      !main.contains(panel)
    ) {
      descartar();
      panel = crearPantalla();
      main.appendChild(panel);
    }
  }

  function programarActualizacion() {
    if (programado) return;

    programado = true;

    queueMicrotask(actualizar);
  }

  function iniciar() {
    const main = document.querySelector("main");

    if (!main) return;

    const observador = new MutationObserver(
      mutaciones => {
        const cambioEstructural = mutaciones.some(
          m => Array.from(m.addedNodes)
            .concat(Array.from(m.removedNodes))
            .some(n =>
              n === panel ||
              n.nodeType === Node.ELEMENT_NODE &&
              (
                n.matches?.("main") ||
                n.contains?.(panel)
              )
            )
        );

        if (
          cambioEstructural ||
          !panel ||
          !panel.isConnected
        ) {
          programarActualizacion();
        }
      }
    );

    observador.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    actualizar();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciar
    );
  } else {
    iniciar();
  }
})();
