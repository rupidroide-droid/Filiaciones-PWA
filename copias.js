
/* Filiaciones Beta 0.8 - copia cifrada local */
"use strict";

const Copias = (() => {
  const DB = "filiaciones-cifradas-v1";

  function leerBase() {
    return new Promise((resolve, reject) => {
      const solicitud = indexedDB.open(DB);

      solicitud.onsuccess = () => {
        const db = solicitud.result;

        if (
          !db.objectStoreNames.contains("registros") ||
          !db.objectStoreNames.contains("config")
        ) {
          db.close();
          reject(new Error("Base de datos no válida"));
          return;
        }

        const tx = db.transaction(
          ["registros", "config"],
          "readonly"
        );

        const registros = tx.objectStore("registros").getAll();
        const config = tx.objectStore("config").get("principal");

        tx.oncomplete = () => {
          db.close();
          resolve({
            registros: registros.result,
            config: config.result
          });
        };

        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };

      solicitud.onerror = () => reject(solicitud.error);
    });
  }

  async function exportar() {
    if (
      typeof Almacenamiento === "undefined" ||
      !Almacenamiento.desbloqueado()
    ) {
      throw new Error("Desbloquea Filiaciones primero");
    }

    const datos = await leerBase();

    if (!datos.config) {
      throw new Error("No existe configuración de cifrado");
    }

    for (const r of datos.registros) {
      if (
        typeof r.id !== "string" ||
        typeof r.iv !== "string" ||
        typeof r.contenido !== "string"
      ) {
        throw new Error("Registro cifrado no válido");
      }
    }

    const copia = {
      formato: "FILIACIONES_BACKUP_V1",
      fecha: new Date().toISOString(),
      cifrado: "AES-256-GCM",
      registros: datos.registros,
      config: datos.config
    };

    const contenido = JSON.stringify(copia);
    const blob = new Blob(
      [contenido],
      { type: "application/json" }
    );

    const fecha = new Date().toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");

    const nombre = `Filiaciones-copia-${fecha}.json`;

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombre;
    enlace.style.display = "none";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    return datos.registros.length;
  }

  return { exportar };
})();
