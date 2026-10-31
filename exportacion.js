
/*
 * FILIACIONES - EXPORTACIÓN
 * Beta 0.9.10
 *
 * 1. Ficha Word (.docx)
 * 2. Intercambio cifrado para Gestor Policial
 *
 * No genera diligencias.
 * No asigna palabras clave policiales.
 *
 * PROTOTIPO: SOLO DATOS FICTICIOS.
 */
"use strict";

window.Exportacion = (() => {

  const encoder = new TextEncoder();

  const MIME_DOCX =
    "application/vnd.openxmlformats-officedocument." +
    "wordprocessingml.document";

  const CAMPOS = {
    personas: [
      ["nombre", "Nombre y apellidos"],
      ["tipoDocumento", "Tipo de documento"],
      ["numeroDocumento", "Número de documento"],
      ["fechaNacimiento", "Fecha de nacimiento"],
      ["municipioNacimiento", "Municipio de nacimiento"],
      ["provinciaNacimiento", "Provincia de nacimiento"],
      ["paisNacimiento", "País de nacimiento"],
      ["nombrePadre", "Nombre del padre"],
      ["nombreMadre", "Nombre de la madre"],
      ["nacionalidad", "Nacionalidad"],
      ["domicilio", "Domicilio"],
      ["telefono", "Teléfono"],
      ["correoElectronico", "Correo electrónico"],
      ["observaciones", "Observaciones"]
    ],
    vehiculos: [
      ["matricula", "Matrícula"],
      ["marca", "Marca"],
      ["modelo", "Modelo"],
      ["color", "Color"],
      ["bastidor", "Bastidor"],
      ["titular", "Titular (texto libre)"],
      ["conductor", "Conductor (texto libre)"],
      ["observaciones", "Observaciones"]
    ],
    objetos: [
      ["descripcion", "Descripción"],
      ["marcaModelo", "Marca y modelo"],
      ["numeroSerie", "Número de serie"],
      ["personaRelacionada", "Persona relacionada"],
      ["observaciones", "Observaciones"]
    ]
  };

  function valor(dato) {
    return dato == null
      ? ""
      : String(dato).trim();
  }

  function fecha(dato) {
    const texto = valor(dato);

    const partes =
      /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

    return partes
      ? partes[3] + "/" +
        partes[2] + "/" +
        partes[1]
      : texto;
  }

  function xml(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function nombreSeguro(texto) {
    return valor(texto)
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 60) ||
      "Sin_referencia";
  }

  function listas(actuacion) {
    return {
      personas: Array.isArray(actuacion.personas)
        ? actuacion.personas
        : [],
      vehiculos: Array.isArray(actuacion.vehiculos)
        ? actuacion.vehiculos
        : [],
      objetos: Array.isArray(actuacion.objetos)
        ? actuacion.objetos
        : []
    };
  }

  function personasVinculadas(vehiculo, personas) {
    const resultado = [];

    const vinculos =
      Array.isArray(vehiculo.vinculos)
        ? vehiculo.vinculos
        : [];

    for (const vinculo of vinculos) {
      const indice = personas.findIndex(
        persona =>
          persona.idPersona === vinculo.personaId
      );

      if (indice < 0) continue;

      const persona = personas[indice];

      const nombre =
        valor(persona.nombre) ||
        "Persona " + (indice + 1);

      const funcion =
        valor(vinculo.rol) ||
        "Sin especificar";

      resultado.push(
        nombre + " (" + funcion + ")"
      );
    }

    return resultado;
  }

  function vehiculosVinculados(persona, vehiculos) {
    const resultado = [];

    vehiculos.forEach((vehiculo, indice) => {
      const vinculos =
        Array.isArray(vehiculo.vinculos)
          ? vehiculo.vinculos
          : [];

      for (const vinculo of vinculos) {
        if (
          vinculo.personaId !==
          persona.idPersona
        ) {
          continue;
        }

        const identificacion =
          valor(vehiculo.matricula) ||
          "Vehículo " + (indice + 1);

        resultado.push(
          identificacion +
          " (" +
          (valor(vinculo.rol) ||
            "Sin especificar") +
          ")"
        );
      }
    });

    return resultado;
  }

  function campoDocumento(nombre, dato, etiqueta) {
    let contenido = valor(dato);

    if (nombre === "fechaNacimiento") {
      contenido = fecha(dato);
    }

    if (!contenido) return null;

    return {
      tipo: "campo",
      texto: etiqueta + ": " + contenido
    };
  }

  function fichaCompacta(actuacion) {
    const {
      personas,
      vehiculos,
      objetos
    } = listas(actuacion);

    const parrafos = [];

    parrafos.push({
      tipo: "titulo",
      texto: "FICHA DE FILIACIÓN Y ACTUACIÓN"
    });

    parrafos.push({
      tipo: "seccion",
      texto: "DATOS GENERALES"
    });

    const generales = [
      [
        "referencia",
        "Referencia de actuación"
      ],
      [
        "numeroAtestado",
        "Número de atestado"
      ],
      ["fecha", "Fecha"],
      ["hora", "Hora"],
      ["lugar", "Lugar"],
      [
        "agentes",
        "Agentes intervinientes"
      ]
    ];

    for (const [nombre, etiqueta] of generales) {
      const dato =
        nombre === "fecha"
          ? fecha(actuacion[nombre])
          : actuacion[nombre];

      const campo =
        campoDocumento(nombre, dato, etiqueta);

      if (campo) parrafos.push(campo);
    }

    personas.forEach((persona, indice) => {
      parrafos.push({
        tipo: "seccion",
        texto: "PERSONA " + (indice + 1)
      });

      for (
        const [nombre, etiqueta]
        of CAMPOS.personas
      ) {
        const campo = campoDocumento(
          nombre,
          persona[nombre],
          etiqueta
        );

        if (campo) parrafos.push(campo);
      }

      const vinculados =
        vehiculosVinculados(persona, vehiculos);

      if (vinculados.length) {
        parrafos.push({
          tipo: "campo",
          texto:
            "Vehículos vinculados: " +
            vinculados.join("; ")
        });
      }
    });

    vehiculos.forEach((vehiculo, indice) => {
      parrafos.push({
        tipo: "seccion",
        texto: "VEHÍCULO " + (indice + 1)
      });

      for (
        const [nombre, etiqueta]
        of CAMPOS.vehiculos
      ) {
        const campo = campoDocumento(
          nombre,
          vehiculo[nombre],
          etiqueta
        );

        if (campo) parrafos.push(campo);
      }

      const vinculados =
        personasVinculadas(vehiculo, personas);

      if (vinculados.length) {
        parrafos.push({
          tipo: "campo",
          texto:
            "Personas vinculadas: " +
            vinculados.join("; ")
        });
      }
    });

    objetos.forEach((objeto, indice) => {
      parrafos.push({
        tipo: "seccion",
        texto: "OBJETO " + (indice + 1)
      });

      for (
        const [nombre, etiqueta]
        of CAMPOS.objetos
      ) {
        const campo = campoDocumento(
          nombre,
          objeto[nombre],
          etiqueta
        );

        if (campo) parrafos.push(campo);
      }
    });

    return parrafos;
  }

  function parrafoXML(parrafo) {
    const estilos = {
      titulo: "TituloFicha",
      seccion: "SeccionFicha",
      campo: "CampoFicha"
    };

    const estilo =
      estilos[parrafo.tipo] ||
      "CampoFicha";

    return (
      "<w:p>" +
      "<w:pPr>" +
      '<w:pStyle w:val="' +
      estilo +
      '"/>' +
      "</w:pPr>" +
      "<w:r>" +
      '<w:t xml:space="preserve">' +
      xml(parrafo.texto) +
      "</w:t>" +
      "</w:r>" +
      "</w:p>"
    );
  }

  function documentoXML(parrafos) {
    return (
      '<?xml version="1.0" encoding="UTF-8" ' +
      'standalone="yes"?>' +
      '<w:document xmlns:w="' +
      'http://schemas.openxmlformats.org/' +
      'wordprocessingml/2006/main">' +
      "<w:body>" +
      parrafos.map(parrafoXML).join("") +
      "<w:sectPr>" +
      '<w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1134" ' +
      'w:right="1134" w:bottom="1134" ' +
      'w:left="1134"/>' +
      "</w:sectPr>" +
      "</w:body></w:document>"
    );
  }

  function estilosXML() {
    return (
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<w:styles xmlns:w="' +
      'http://schemas.openxmlformats.org/' +
      'wordprocessingml/2006/main">' +

      '<w:style w:type="paragraph" ' +
      'w:default="1" w:styleId="Normal">' +
      '<w:name w:val="Normal"/>' +
      '<w:rPr>' +
      '<w:rFonts w:ascii="Aptos" ' +
      'w:hAnsi="Aptos"/>' +
      '<w:sz w:val="21"/>' +
      '</w:rPr></w:style>' +

      '<w:style w:type="paragraph" ' +
      'w:styleId="TituloFicha">' +
      '<w:name w:val="Título ficha"/>' +
      '<w:pPr><w:spacing w:after="240"/>' +
      '<w:keepNext/></w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="30"/>' +
      '</w:rPr></w:style>' +

      '<w:style w:type="paragraph" ' +
      'w:styleId="SeccionFicha">' +
      '<w:name w:val="Sección ficha"/>' +
      '<w:pPr><w:spacing w:before="220" ' +
      'w:after="100"/><w:keepNext/>' +
      '</w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="23"/>' +
      '</w:rPr></w:style>' +

      '<w:style w:type="paragraph" ' +
      'w:styleId="CampoFicha">' +
      '<w:name w:val="Campo ficha"/>' +
      '<w:pPr><w:spacing w:after="55"/>' +
      '</w:pPr>' +
      '<w:rPr><w:sz w:val="20"/>' +
      '</w:rPr></w:style>' +

      "</w:styles>"
    );
  }

  function crc32(datos) {
    let crc = 0xFFFFFFFF;

    for (const byte of datos) {
      crc ^= byte;

      for (let i = 0; i < 8; i++) {
        crc = (crc >>> 1) ^
          ((crc & 1) ? 0xEDB88320 : 0);
      }
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function u16(n) {
    return [
      n & 255,
      (n >>> 8) & 255
    ];
  }

  function u32(n) {
    return [
      n & 255,
      (n >>> 8) & 255,
      (n >>> 16) & 255,
      (n >>> 24) & 255
    ];
  }

  function unir(partes) {
    const total = partes.reduce(
      (n, parte) => n + parte.length,
      0
    );

    const salida = new Uint8Array(total);
    let posicion = 0;

    for (const parte of partes) {
      salida.set(parte, posicion);
      posicion += parte.length;
    }

    return salida;
  }

  function crearZIP(archivos) {
    const locales = [];
    const centrales = [];

    let desplazamiento = 0;

    for (const [nombre, contenido] of archivos) {
      const n = encoder.encode(nombre);
      const d = encoder.encode(contenido);
      const crc = crc32(d);

      const local = Uint8Array.from([
        ...u32(0x04034b50),
        ...u16(20),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u32(crc),
        ...u32(d.length),
        ...u32(d.length),
        ...u16(n.length),
        ...u16(0)
      ]);

      locales.push(local, n, d);

      const central = Uint8Array.from([
        ...u32(0x02014b50),
        ...u16(20),
        ...u16(20),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u32(crc),
        ...u32(d.length),
        ...u32(d.length),
        ...u16(n.length),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u32(desplazamiento)
      ]);

      centrales.push(central, n);

      desplazamiento +=
        local.length + n.length + d.length;
    }

    const directorio = unir(centrales);

    const final = Uint8Array.from([
      ...u32(0x06054b50),
      ...u16(0),
      ...u16(0),
      ...u16(archivos.length),
      ...u16(archivos.length),
      ...u32(directorio.length),
      ...u32(desplazamiento),
      ...u16(0)
    ]);

    return unir([
      ...locales,
      directorio,
      final
    ]);
  }

  function crearDocx(parrafos) {
    const tipos =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="' +
      'http://schemas.openxmlformats.org/' +
      'package/2006/content-types">' +
      '<Default Extension="rels" ' +
      'ContentType="application/vnd.openxmlformats-' +
      'package.relationships+xml"/>' +
      '<Default Extension="xml" ' +
      'ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ' +
      'ContentType="application/vnd.openxmlformats-' +
      'officedocument.wordprocessingml.document.' +
      'main+xml"/>' +
      '<Override PartName="/word/styles.xml" ' +
      'ContentType="application/vnd.openxmlformats-' +
      'officedocument.wordprocessingml.styles+xml"/>' +
      '</Types>';

    const raiz =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="' +
      'http://schemas.openxmlformats.org/' +
      'package/2006/relationships">' +
      '<Relationship Id="rId1" Type="' +
      'http://schemas.openxmlformats.org/' +
      'officeDocument/2006/relationships/' +
      'officeDocument" Target="word/document.xml"/>' +
      '</Relationships>';

    const word =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="' +
      'http://schemas.openxmlformats.org/' +
      'package/2006/relationships">' +
      '<Relationship Id="rId1" Type="' +
      'http://schemas.openxmlformats.org/' +
      'officeDocument/2006/relationships/styles" ' +
      'Target="styles.xml"/>' +
      '</Relationships>';

    return crearZIP([
      ["[Content_Types].xml", tipos],
      ["_rels/.rels", raiz],
      [
        "word/document.xml",
        documentoXML(parrafos)
      ],
      ["word/styles.xml", estilosXML()],
      [
        "word/_rels/document.xml.rels",
        word
      ]
    ]);
  }

  async function compartir(archivo) {
    if (
      navigator.canShare &&
      navigator.share &&
      navigator.canShare({
        files: [archivo]
      })
    ) {
      await navigator.share({
        files: [archivo],
        title: archivo.name
      });

      return;
    }

    const url =
      URL.createObjectURL(archivo);

    const enlace =
      document.createElement("a");

    enlace.href = url;
    enlace.download = archivo.name;

    document.body.append(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      60000
    );
  }

  function comprobarActuacion(actuacion) {
    if (
      !actuacion ||
      typeof actuacion !== "object" ||
      Array.isArray(actuacion)
    ) {
      throw Error(
        "No hay una actuación válida."
      );
    }

    if (!valor(actuacion.referencia)) {
      throw Error(
        "La actuación necesita una referencia."
      );
    }
  }

  async function exportarFicha(actuacion) {
    comprobarActuacion(actuacion);

    const parrafos =
      fichaCompacta(actuacion);

    const datos = crearDocx(parrafos);

    const nombre =
      "Ficha_" +
      nombreSeguro(actuacion.referencia) +
      ".docx";

    const archivo = new File(
      [datos],
      nombre,
      {type: MIME_DOCX}
    );

    await compartir(archivo);
  }

  function aBase64(datos) {
    let binario = "";

    for (const byte of datos) {
      binario += String.fromCharCode(byte);
    }

    return btoa(binario);
  }

  function prepararIntercambio(actuacion) {
    comprobarActuacion(actuacion);

    const copia = structuredClone(actuacion);

    const {
      personas,
      vehiculos,
      objetos
    } = listas(copia);

    copia.personas = personas;
    copia.vehiculos = vehiculos;
    copia.objetos = objetos;

    return {
      formato: "filiaciones-gestor-policial",
      versionFormato: 1,
      fechaExportacion:
        new Date().toISOString(),
      origen: "Filiaciones PWA",
      destinoPrevisto: "Gestor Policial",
      actuacion: copia
    };
  }

  async function cifrarIntercambio(datos, clave) {
    if (
      !crypto?.subtle ||
      !crypto.getRandomValues
    ) {
      throw Error(
        "Este dispositivo no permite " +
        "realizar la exportación cifrada."
      );
    }

    const sal = crypto.getRandomValues(
      new Uint8Array(16)
    );

    const iv = crypto.getRandomValues(
      new Uint8Array(12)
    );

    const material =
      await crypto.subtle.importKey(
        "raw",
        encoder.encode(clave),
        "PBKDF2",
        false,
        ["deriveKey"]
      );

    const iteraciones = 310000;

    const claveAES =
      await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: sal,
          iterations: iteraciones,
          hash: "SHA-256"
        },
        material,
        {
          name: "AES-GCM",
          length: 256
        },
        false,
        ["encrypt"]
      );

    const texto = encoder.encode(
      JSON.stringify(datos)
    );

    const cifrado =
      await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv
        },
        claveAES,
        texto
      );

    return {
      formato:
        "filiaciones-intercambio-cifrado",
      version: 1,
      cifrado: "AES-256-GCM",
      derivacion: "PBKDF2-SHA256",
      iteraciones,
      sal: aBase64(sal),
      iv: aBase64(iv),
      datos: aBase64(
        new Uint8Array(cifrado)
      )
    };
  }

  async function exportarGestorPolicial(
    actuacion
  ) {
    comprobarActuacion(actuacion);

    const primera = prompt(
      "Contraseña para el archivo de " +
      "intercambio cifrado.\n\n" +
      "Debe tener al menos 12 caracteres.\n" +
      "No tiene que ser la contraseña " +
      "de Filiaciones."
    );

    if (primera === null) return;

    if (primera.length < 12) {
      throw Error(
        "La contraseña debe tener " +
        "al menos 12 caracteres."
      );
    }

    const segunda = prompt(
      "Repite la contraseña del " +
      "archivo de intercambio."
    );

    if (segunda === null) return;

    if (primera !== segunda) {
      throw Error(
        "Las contraseñas no coinciden."
      );
    }

    const intercambio =
      prepararIntercambio(actuacion);

    const protegido =
      await cifrarIntercambio(
        intercambio,
        primera
      );

    const contenido =
      JSON.stringify(protegido, null, 2);

    const nombre =
      "GestorPolicial_" +
      nombreSeguro(actuacion.referencia) +
      ".gpenc";

    const archivo = new File(
      [contenido],
      nombre,
      {
        type: "application/octet-stream"
      }
    );

    await compartir(archivo);
  }

  /*
   * Compatibilidad con app.js Beta 0.9.9.
   *
   * exportar(a, "ficha") mantiene Word.
   * exportar(a, "diligencia") ya no genera
   * una diligencia: genera intercambio.
   *
   * En el siguiente paso cambiaremos
   * el texto del botón en app.js.
   */
  async function exportar(
    actuacion,
    formato = "ficha"
  ) {
    if (formato === "ficha") {
      return exportarFicha(actuacion);
    }

    if (
      formato === "gestor" ||
      formato === "diligencia"
    ) {
      return exportarGestorPolicial(
        actuacion
      );
    }

    throw Error(
      "Formato de exportación desconocido."
    );
  }

  return {
    exportar,
    exportarFicha,
    exportarGestorPolicial,
    fichaCompacta,
    prepararIntercambio
  };

})();
