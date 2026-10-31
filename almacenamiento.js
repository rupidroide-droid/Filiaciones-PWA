
"use strict";

/*
 * FILIACIONES - ALMACENAMIENTO CIFRADO
 * Beta 0.9.1
 *
 * IndexedDB + AES-256-GCM
 * PBKDF2 SHA-256, 310000 iteraciones
 *
 * Incluye importación sin sobrescritura.
 */

const Almacenamiento = (() => {
  const DB = "filiaciones-cifradas-v1";
  const STORE = "registros";
  const META = "config";

  let clave = null;

  function abrir() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(DB, 1);

      r.onupgradeneeded = () => {
        const db = r.result;

        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, {
            keyPath: "id"
          });
        }

        if (!db.objectStoreNames.contains(META)) {
          db.createObjectStore(META, {
            keyPath: "id"
          });
        }
      };

      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  async function operacion(store, mode, fn) {
    const db = await abrir();

    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));

        let resultado;

        req.onsuccess = () => {
          resultado = req.result;
        };

        req.onerror = () => {
          reject(req.error);
        };

        tx.oncomplete = () => {
          resolve(resultado);
        };

        tx.onerror = () => {
          reject(tx.error);
        };

        tx.onabort = () => {
          reject(tx.error || new Error(
            "Operación cancelada"
          ));
        };
      });
    } finally {
      db.close();
    }
  }

  const leer = (store, id) =>
    operacion(
      store,
      "readonly",
      s => s.get(id)
    );

  const escribir = (store, obj) =>
    operacion(
      store,
      "readwrite",
      s => s.put(obj)
    );

  const bytes = n =>
    crypto.getRandomValues(new Uint8Array(n));

  const b64 = a =>
    btoa(String.fromCharCode(...a));

  const unb64 = s =>
    Uint8Array.from(
      atob(s),
      c => c.charCodeAt(0)
    );

  async function derivar(pass, salt) {
    const material = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(pass),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 310000,
        hash: "SHA-256"
      },
      material,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function cifrar(obj, k) {
    const iv = bytes(12);

    const data = new TextEncoder().encode(
      JSON.stringify(obj)
    );

    const ct = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      k,
      data
    );

    return {
      iv: b64(iv),
      contenido: b64(new Uint8Array(ct))
    };
  }

  async function descifrar(obj, k) {
    const pt = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: unb64(obj.iv)
      },
      k,
      unb64(obj.contenido)
    );

    return JSON.parse(
      new TextDecoder().decode(pt)
    );
  }

  async function existe() {
    return !!(await leer(META, "principal"));
  }

  async function configurar(pass) {
    if (await existe()) {
      throw Error("Contraseña ya configurada");
    }

    if (pass.length < 12) {
      throw Error("Mínimo 12 caracteres");
    }

    const salt = bytes(16);
    const k = await derivar(pass, salt);

    const test = await cifrar(
      { verificacion: "FILIACIONES_V1" },
      k
    );

    await escribir(META, {
      id: "principal",
      salt: b64(salt),
      test
    });

    clave = k;
  }

  async function desbloquear(pass) {
    const config = await leer(
      META,
      "principal"
    );

    if (!config) {
      throw Error("Configura primero la contraseña");
    }

    const k = await derivar(
      pass,
      unb64(config.salt)
    );

    try {
      const v = await descifrar(
        config.test,
        k
      );

      if (
        v.verificacion !== "FILIACIONES_V1"
      ) {
        throw Error("Verificación incorrecta");
      }
    } catch {
      throw Error(
        "Contraseña incorrecta o datos dañados"
      );
    }

    clave = k;
  }

  function bloquear() {
    clave = null;
  }

  function desbloqueado() {
    return !!clave;
  }

  async function guardar(obj) {
    if (!clave) {
      throw Error("Aplicación bloqueada");
    }

    if (!obj.id) {
      obj.id = crypto.randomUUID();
    }

    const cifrado = await cifrar(
      obj,
      clave
    );

    await escribir(STORE, {
      id: obj.id,
      ...cifrado
    });

    return obj.id;
  }

  async function listar() {
    if (!clave) {
      throw Error("Aplicación bloqueada");
    }

    const registros = await operacion(
      STORE,
      "readonly",
      s => s.getAll()
    );

    const salida = [];

    for (const r of registros) {
      salida.push(
        await descifrar(r, clave)
      );
    }

    return salida;
  }

  async function eliminar(id) {
    if (!clave) {
      throw Error("Aplicación bloqueada");
    }

    return operacion(
      STORE,
      "readwrite",
      s => s.delete(id)
    );
  }

  /*
   * Importa una actuación ya descifrada.
   *
   * Usa add() en vez de put().
   * Si existe el mismo ID, IndexedDB
   * rechaza la inserción.
   *
   * No modifica registros existentes.
   */
  async function importarSeguro(obj) {
    if (!clave) {
      throw Error("Aplicación bloqueada");
    }

    if (
      !obj ||
      typeof obj !== "object" ||
      Array.isArray(obj) ||
      typeof obj.id !== "string" ||
      !obj.id.trim()
    ) {
      throw Error(
        "Actuación recuperada no válida"
      );
    }

    const cifrado = await cifrar(
      obj,
      clave
    );

    try {
      await operacion(
        STORE,
        "readwrite",
        s => s.add({
          id: obj.id,
          ...cifrado
        })
      );
    } catch (error) {
      if (
        error?.name === "ConstraintError"
      ) {
        throw Error(
          "La actuación ya existe. No se ha sobrescrito."
        );
      }

      throw error;
    }

    return obj.id;
  }

  return {
    existe,
    configurar,
    desbloquear,
    bloquear,
    desbloqueado,
    guardar,
    listar,
    eliminar,
    importarSeguro
  };
})();
