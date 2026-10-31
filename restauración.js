
"use strict";

/*
 * FILIACIONES - RESTAURACIÓN SEGURA
 * Beta 0.9.2
 *
 * Descifra copias, detecta duplicados
 * y exige confirmación para importar.
 */

const Restauracion = (() => {
  const FORMATO = "FILIACIONES_BACKUP_V1";
  const LIMITE = 10 * 1024 * 1024;
  const MAX_REGISTROS = 500;

  let pendientes = [];
  let preparada = false;

  const decodificar = texto =>
    Uint8Array.from(
      atob(texto),
      c => c.charCodeAt(0)
    );

  function limpiar() {
    pendientes = [];
    preparada = false;
  }

  function exigirDesbloqueo() {
    if (
      typeof Almacenamiento === "undefined" ||
      !Almacenamiento.desbloqueado()
    ) {
      limpiar();
      throw Error("Desbloquea Filiaciones primero");
    }
  }

  function comprobarCifrado(obj) {
    if (
      !obj ||
      typeof obj.iv !== "string" ||
      typeof obj.contenido !== "string" ||
      decodificar(obj.iv).length !== 12 ||
      decodificar(obj.contenido).length < 16
    ) {
      throw Error("Datos cifrados no válidos");
    }
  }

  async function derivar(password, salt) {
    const bytes = decodificar(salt);

    if (bytes.length !== 16) {
      throw Error("Salt de copia no válido");
    }

    const material = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: bytes,
        iterations: 310000,
        hash: "SHA-256"
      },
      material,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      ["decrypt"]
    );
  }

  async function descifrar(registro, clave) {
    comprobarCifrado(registro);

    const texto = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decodificar(registro.iv)
      },
      clave,
      decodificar(registro.contenido)
    );

    return JSON.parse(
      new TextDecoder().decode(texto)
    );
  }

  function referencia(obj) {
    const valor =
      obj.referencia ||
      obj.nombre ||
      obj.titulo ||
      obj.numero ||
      obj.id;

    return String(valor).slice(0, 150);
  }

  async function preparar(archivo, password) {
    limpiar();
    exigirDesbloqueo();

    if (!archivo) {
      throw Error("Selecciona un archivo JSON");
    }

    if (archivo.size > LIMITE) {
      throw Error("La copia supera 10 MB");
    }

    if (!password) {
      throw Error("Introduce la contraseña de la copia");
    }

    let copia;

    try {
      copia = JSON.parse(await archivo.text());
    } catch {
      throw Error("No se puede leer el archivo JSON");
    }

    if (
      !copia ||
      copia.formato !== FORMATO ||
      !Array.isArray(copia.registros) ||
      copia.registros.length > MAX_REGISTROS ||
      typeof copia.config?.salt !== "string" ||
      !copia.config?.test
    ) {
      throw Error("Formato de copia incompatible");
    }

    let clave;

    try {
      clave = await derivar(
        password,
        copia.config.salt
      );

      const prueba = await descifrar(
        copia.config.test,
        clave
      );

      if (
        prueba?.verificacion !== "FILIACIONES_V1"
      ) {
        throw Error("Verificación incorrecta");
      }
    } catch {
      throw Error(
        "Contraseña incorrecta o copia dañada"
      );
    }

    const actuales = await Almacenamiento.listar();
    const idsActuales = new Set(
      actuales.map(a => a.id)
    );

    const idsCopia = new Set();
    const recuperadas = [];

    for (const registro of copia.registros) {
      exigirDesbloqueo();

      const datos = await descifrar(
        registro,
        clave
      );

      if (
        !datos ||
        typeof datos !== "object" ||
        Array.isArray(datos) ||
        typeof datos.id !== "string" ||
        !datos.id.trim() ||
        datos.id !== registro.id
      ) {
        throw Error(
          "La copia contiene una actuación no válida"
        );
      }

      if (idsCopia.has(datos.id)) {
        throw Error(
          "La copia contiene identificadores repetidos"
        );
      }

      idsCopia.add(datos.id);

      recuperadas.push({
        datos,
        duplicada: idsActuales.has(datos.id)
      });
    }

    exigirDesbloqueo();

    pendientes = recuperadas;
    preparada = true;

    return resumen();
  }

  function resumen() {
    exigirDesbloqueo();

    if (!preparada) {
      throw Error("No hay copia preparada");
    }

    return pendientes.map(item => ({
      id: item.datos.id,
      referencia: referencia(item.datos),
      duplicada: item.duplicada
    }));
  }

  async function importar(confirmado) {
    exigirDesbloqueo();

    if (!preparada || confirmado !== true) {
      throw Error(
        "Debes analizar y confirmar la importación"
      );
    }

    const resultado = {
      importadas: 0,
      duplicadas: 0,
      errores: 0
    };

    try {
      for (const item of pendientes) {
        exigirDesbloqueo();

        if (item.duplicada) {
          resultado.duplicadas++;
          continue;
        }

        try {
          await Almacenamiento.importarSeguro(
            item.datos
          );

          resultado.importadas++;
        } catch (error) {
          if (
            error?.name === "ConstraintError" ||
            String(error?.message || "")
              .includes("ya existe")
          ) {
            resultado.duplicadas++;
          } else {
            resultado.errores++;
          }
        }
      }

      return resultado;
    } finally {
      limpiar();
    }
  }

  function descartar() {
    limpiar();
  }

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) limpiar();
    }
  );

  window.addEventListener(
    "pagehide",
    limpiar
  );

  return {
    preparar,
    resumen,
    importar,
    descartar
  };
})();
