
/*
 * Filiaciones Beta 0.9
 * Restauración segura de copias cifradas.
 * Primera fase: verificación y preparación.
 */
"use strict";

const Restauracion = (() => {
  const FORMATO = "FILIACIONES_BACKUP_V1";
  let pendientes = [];

  function decodificar(texto) {
    return Uint8Array.from(
      atob(texto),
      caracter => caracter.charCodeAt(0)
    );
  }

  async function derivar(password, salt) {
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
        salt: decodificar(salt),
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
    const datos = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decodificar(registro.iv)
      },
      clave,
      decodificar(registro.contenido)
    );

    return JSON.parse(
      new TextDecoder().decode(datos)
    );
  }

  async function preparar(archivo, password) {
    pendientes = [];

    if (!Almacenamiento.desbloqueado()) {
      throw Error("Desbloquea Filiaciones primero");
    }

    if (!archivo) {
      throw Error("Selecciona una copia JSON");
    }

    if (archivo.size > 10 * 1024 * 1024) {
      throw Error("Archivo demasiado grande");
    }

    const copia = JSON.parse(await archivo.text());

    if (
      copia.formato !== FORMATO ||
      !Array.isArray(copia.registros) ||
      typeof copia.config?.salt !== "string" ||
      !copia.config?.test
    ) {
      throw Error("Copia no válida");
    }

    const clave = await derivar(
      password,
      copia.config.salt
    );

    const prueba = await descifrar(
      copia.config.test,
      clave
    );

    if (prueba.verificacion !== "FILIACIONES_V1") {
      throw Error("Contraseña incorrecta");
    }

    const resultados = [];

    for (const registro of copia.registros) {
      const datos = await descifrar(registro, clave);

      if (!datos || typeof datos !== "object" ||
          !datos.id || datos.id !== registro.id) {
        throw Error("Registro incompatible");
      }

      resultados.push(datos);
    }

    pendientes = resultados;

    return resultados.map(actuacion => ({
      id: actuacion.id,
      referencia:
        actuacion.referencia ||
        actuacion.nombre ||
        actuacion.titulo ||
        actuacion.id
    }));
  }

  function obtenerPendientes() {
    return pendientes.map(actuacion => ({
      id: actuacion.id,
      referencia:
        actuacion.referencia ||
        actuacion.nombre ||
        actuacion.titulo ||
        actuacion.id
    }));
  }

  function descartar() {
    pendientes = [];
  }

  return {
    preparar,
    obtenerPendientes,
    descartar
  };
})();
