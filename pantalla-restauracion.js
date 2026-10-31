
"use strict";

/*
 * FILIACIONES - PANTALLA DE RESTAURACIÓN
 * Beta 0.9.3
 */

(() => {
  let panel = null;
  let preparado = false;

  function crearElemento(tipo, texto) {
    const el = document.createElement(tipo);
    if (texto) el.textContent = texto;
    return el;
  }

  function crearPantalla() {
    if (panel) return panel;

    panel = crearElemento("section");
    panel.id = "panel-restauracion";
    panel.style.cssText = `
      padding:16px;
      margin:16px 0;
      border:1px solid #999;
      border-radius:12px;
      background:#f7f7f7;
      color:#222;
    `;

    const titulo = crearElemento(
      "h2",
      "Restaurar actuaciones"
    );

    const explicacion = crearElemento(
      "p",
      "Selecciona una copia cifrada. " +
      "Las actuaciones existentes no se sobrescribirán."
    );

    const archivo = crearElemento("input");
    archivo.type = "file";
    archivo.accept = ".json,application/json";
    archivo.style.width = "100%";

    const password = crearElemento("input");
    password.type = "password";
    password.placeholder = "Contraseña de la copia";
    password.autocomplete = "off";
    password.style.cssText = `
      width:100%;
      box-sizing:border-box;
      padding:12px;
      margin:12px 0;
    `;

    const analizar = crearElemento(
      "button",
      "Analizar copia"
    );

    const importar = crearElemento(
      "button",
      "Confirmar importación"
    );

    importar.disabled = true;

    const cancelar = crearElemento(
      "button",
      "Cancelar restauración"
    );

    const estado = crearElemento("p");
    estado.setAttribute("role", "status");

    const listado = crearElemento("ul");

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

    function limpiar() {
      preparado = false;
      importar.disabled = true;
      archivo.value = "";
      password.value = "";
      listado.replaceChildren();

      if (typeof Restauracion !== "undefined") {
        Restauracion.descartar();
      }
    }

    analizar.onclick = async () => {
      limpiarResultado();

      try {
        if (!Almacenamiento.desbloqueado()) {
          throw Error("Desbloquea Filiaciones");
        }

        if (!archivo.files.length) {
          throw Error("Selecciona el JSON");
        }

        analizar.disabled = true;
        estado.textContent = "Analizando copia...";

        const resultado = await Restauracion.preparar(
          archivo.files[0],
          password.value
        );

        password.value = "";

        let nuevas = 0;
        let duplicadas = 0;

        for (const item of resultado) {
          const li = crearElemento("li");

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

        estado.textContent =
          `Nuevas: ${nuevas}. ` +
          `Duplicadas: ${duplicadas}.`;

        preparado = nuevas > 0;
        importar.disabled = !preparado;

      } catch (error) {
        estado.textContent =
          "Error: " + error.message;

        Restauracion.descartar();
      } finally {
        password.value = "";
        analizar.disabled = false;
      }
    };

    function limpiarResultado() {
      preparado = false;
      importar.disabled = true;
      listado.replaceChildren();
      estado.textContent = "";
      Restauracion.descartar();
    }

    importar.onclick = async () => {
      if (!preparado) return;

      const aceptado = window.confirm(
        "¿Confirmas que deseas incorporar " +
        "las actuaciones nuevas? " +
        "No se sobrescribirán las existentes."
      );

      if (!aceptado) return;

      importar.disabled = true;

      try {
        const resultado =
          await Restauracion.importar(true);

        estado.textContent =
          `Importadas: ${resultado.importadas}. ` +
          `Duplicadas: ${resultado.duplicadas}. ` +
          `Errores: ${resultado.errores}. ` +
          "Vuelve a consultar las actuaciones.";

        preparado = false;
        listado.replaceChildren();
        archivo.value = "";

      } catch (error) {
        estado.textContent =
          "Error: " + error.message;
      }
    };

    cancelar.onclick = () => {
      limpiar();
      estado.textContent =
        "Restauración cancelada.";
    };

    panel.append(
      titulo,
      explicacion,
      archivo,
      password,
      analizar,
      importar,
      cancelar,
      estado,
      listado
    );

    return panel;
  }

  function actualizar() {
    const main = document.querySelector("main");

    if (!main) return;

    const desbloqueada =
      typeof Almacenamiento !== "undefined" &&
      Almacenamiento.desbloqueado();

    const existente = document.getElementById(
      "panel-restauracion"
    );

    if (!desbloqueada) {
      if (existente) existente.remove();

      if (
        typeof Restauracion !== "undefined"
      ) {
        Restauracion.descartar();
      }

      preparado = false;
      panel = null;
      return;
    }

    if (!existente) {
      panel = null;
      main.appendChild(crearPantalla());
    }
  }

  const observador = new MutationObserver(
    actualizar
  );

  function iniciar() {
    if (!document.body) return;

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
