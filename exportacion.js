
"use strict";

/*
 * FILIACIONES - EXPORTACIÓN
 * Beta 0.9.11
 * PROTOTIPO: solo datos ficticios.
 */

window.Exportacion = (() => {
  const enc = new TextEncoder();

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

  const valor = x =>
    x == null ? "" : String(x).trim();

  const fecha = x => {
    const v = valor(x);
    const m =
      /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);

    return m
      ? `${m[3]}/${m[2]}/${m[1]}`
      : v;
  };

  const xml = x => String(x)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const nombreSeguro = x =>
    valor(x)
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 60) ||
    "Sin_referencia";

  function validar(a) {
    if (
      !a ||
      typeof a !== "object" ||
      Array.isArray(a) ||
      !valor(a.referencia)
    ) {
      throw Error(
        "La actuación necesita una referencia válida."
      );
    }
  }

  function listas(a) {
    return {
      personas: Array.isArray(a.personas)
        ? a.personas : [],
      vehiculos: Array.isArray(a.vehiculos)
        ? a.vehiculos : [],
      objetos: Array.isArray(a.objetos)
        ? a.objetos : []
    };
  }

  function fichaCompacta(a) {
    validar(a);

    const {
      personas,
      vehiculos,
      objetos
    } = listas(a);

    const p = [
      {
        tipo: "titulo",
        texto: "FICHA DE FILIACIÓN Y ACTUACIÓN"
      },
      {
        tipo: "seccion",
        texto: "DATOS GENERALES"
      }
    ];

    const poner = (etiqueta, v) => {
      if (valor(v)) {
        p.push({
          tipo: "campo",
          texto: `${etiqueta}: ${valor(v)}`
        });
      }
    };

    [
      ["Referencia de actuación", a.referencia],
      ["Número de atestado", a.numeroAtestado],
      ["Fecha", fecha(a.fecha)],
      ["Hora", a.hora],
      ["Lugar", a.lugar],
      ["Agentes intervinientes", a.agentes]
    ].forEach(([e, v]) => poner(e, v));

    personas.forEach((persona, i) => {
      p.push({
        tipo: "seccion",
        texto: `PERSONA ${i + 1}`
      });

      CAMPOS.personas.forEach(([k, e]) => {
        poner(
          e,
          k === "fechaNacimiento"
            ? fecha(persona[k])
            : persona[k]
        );
      });

      const relaciones = [];

      vehiculos.forEach((v, j) => {
        const vinculos =
          Array.isArray(v.vinculos)
            ? v.vinculos : [];

        vinculos.forEach(r => {
          if (
            r.personaId === persona.idPersona
          ) {
            const identificacion =
              valor(v.matricula) ||
              `Vehículo ${j + 1}`;

            relaciones.push(
              `${identificacion} (` +
              `${valor(r.rol) || "Sin especificar"})`
            );
          }
        });
      });

      poner(
        "Vehículos vinculados",
        relaciones.join("; ")
      );
    });

    vehiculos.forEach((v, i) => {
      p.push({
        tipo: "seccion",
        texto: `VEHÍCULO ${i + 1}`
      });

      CAMPOS.vehiculos.forEach(([k, e]) => {
        poner(e, v[k]);
      });

      const vinculos =
        Array.isArray(v.vinculos)
          ? v.vinculos : [];

      const relaciones = vinculos
        .map(r => {
          const j = personas.findIndex(
            x => x.idPersona === r.personaId
          );

          if (j < 0) return null;

          const nombre =
            valor(personas[j].nombre) ||
            `Persona ${j + 1}`;

          return (
            `${nombre} (` +
            `${valor(r.rol) || "Sin especificar"})`
          );
        })
        .filter(Boolean);

      poner(
        "Personas vinculadas",
        relaciones.join("; ")
      );
    });

    objetos.forEach((o, i) => {
      p.push({
        tipo: "seccion",
        texto: `OBJETO ${i + 1}`
      });

      CAMPOS.objetos.forEach(([k, e]) => {
        poner(e, o[k]);
      });
    });

    return p;
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

  function juntar(partes) {
    const a = new Uint8Array(
      partes.reduce(
        (n, x) => n + x.length,
        0
      )
    );

    let i = 0;

    for (const x of partes) {
      a.set(x, i);
      i += x.length;
    }

    return a;
  }

  function crc32(a) {
    let c = 0xffffffff;

    for (const b of a) {
      c ^= b;

      for (let i = 0; i < 8; i++) {
        c = (c >>> 1) ^
          ((c & 1) ? 0xedb88320 : 0);
      }
    }

    return (c ^ 0xffffffff) >>> 0;
  }

  function zip(archivos) {
    const locales = [];
    const centrales = [];
    let desplazamiento = 0;

    for (const [nombre, contenido] of archivos) {
      const n = enc.encode(nombre);
      const d = enc.encode(contenido);
      const crc = crc32(d);

      const l = Uint8Array.from([
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

      locales.push(l, n, d);

      const c = Uint8Array.from([
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

      centrales.push(c, n);

      desplazamiento +=
        l.length + n.length + d.length;
    }

    const dir = juntar(centrales);

    return juntar([
      ...locales,
      dir,
      Uint8Array.from([
        ...u32(0x06054b50),
        ...u16(0),
        ...u16(0),
        ...u16(archivos.length),
        ...u16(archivos.length),
        ...u32(dir.length),
        ...u32(desplazamiento),
        ...u16(0)
      ])
    ]);
  }

  function docx(p) {
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
      'officeDocument" ' +
      'Target="word/document.xml"/>' +
      '</Relationships>';

    const relaciones =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="' +
      'http://schemas.openxmlformats.org/' +
      'package/2006/relationships">' +
      '<Relationship Id="rId1" Type="' +
      'http://schemas.openxmlformats.org/' +
      'officeDocument/2006/relationships/styles" ' +
      'Target="styles.xml"/>' +
      '</Relationships>';

    const estilos =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<w:styles xmlns:w="' +
      'http://schemas.openxmlformats.org/' +
      'wordprocessingml/2006/main">' +
      '<w:style w:type="paragraph" ' +
      'w:default="1" w:styleId="Normal">' +
      '<w:name w:val="Normal"/>' +
      '<w:rPr><w:rFonts w:ascii="Aptos" ' +
      'w:hAnsi="Aptos"/>' +
      '<w:sz w:val="21"/></w:rPr></w:style>' +
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
      'w:after="100"/><w:keepNext/></w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="23"/>' +
      '</w:rPr></w:style>' +
      '<w:style w:type="paragraph" ' +
      'w:styleId="CampoFicha">' +
      '<w:name w:val="Campo ficha"/>' +
      '<w:pPr><w:spacing w:after="55"/>' +
      '</w:pPr><w:rPr><w:sz w:val="20"/>' +
      '</w:rPr></w:style>' +
      '</w:styles>';

    const cuerpo = p.map(x => {
      const estilo =
        x.tipo === "titulo"
          ? "TituloFicha"
          : x.tipo === "seccion"
            ? "SeccionFicha"
            : "CampoFicha";

      return (
        '<w:p><w:pPr><w:pStyle w:val="' +
        estilo +
        '"/></w:pPr><w:r><w:t ' +
        'xml:space="preserve">' +
        xml(x.texto) +
        '</w:t></w:r></w:p>'
      );
    }).join("");

    const documento =
      '<?xml version="1.0" encoding="UTF-8" ' +
      'standalone="yes"?>' +
      '<w:document xmlns:w="' +
      'http://schemas.openxmlformats.org/' +
      'wordprocessingml/2006/main">' +
      '<w:body>' +
      cuerpo +
      '<w:sectPr>' +
      '<w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1134" ' +
      'w:right="1134" w:bottom="1134" ' +
      'w:left="1134"/>' +
      '</w:sectPr></w:body></w:document>';

    return zip([
      ["[Content_Types].xml", tipos],
      ["_rels/.rels", raiz],
      ["word/document.xml", documento],
      ["word/styles.xml", estilos],
      [
        "word/_rels/document.xml.rels",
        relaciones
      ]
    ]);
  }

  function entregar(archivo) {
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [archivo]
      })
    ) {
      return navigator.share({
        files: [archivo],
        title: archivo.name
      });
    }

    const url = URL.createObjectURL(archivo);
    const a = document.createElement("a");

    a.href = url;
    a.download = archivo.name;

    document.body.append(a);
    a.click();
    a.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      60000
    );

    return Promise.resolve();
  }

  async function exportarFicha(a) {
    validar(a);

    const archivo = new File(
      [docx(fichaCompacta(a))],
      `Ficha_${nombreSeguro(a.referencia)}.docx`,
      {type: MIME_DOCX}
    );

    return entregar(archivo);
  }

  function prepararIntercambio(a) {
    validar(a);

    const copia = structuredClone(a);
    const l = listas(copia);

    copia.personas = l.personas;
    copia.vehiculos = l.vehiculos;
    copia.objetos = l.objetos;

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

  function base64(a) {
    let s = "";

    for (const b of a) {
      s += String.fromCharCode(b);
    }

    return btoa(s);
  }

  async function prepararArchivoGestor(
    a,
    clave
  ) {
    validar(a);

    if (
      typeof clave !== "string" ||
      clave.length < 12
    ) {
      throw Error(
        "La contraseña debe tener " +
        "al menos 12 caracteres."
      );
    }

    if (
      !globalThis.crypto ||
      !crypto.subtle ||
      !crypto.getRandomValues
    ) {
      throw Error(
        "El cifrado no está disponible " +
        "en este contexto."
      );
    }

    const sal = crypto.getRandomValues(
      new Uint8Array(16)
    );

    const iv = crypto.getRandomValues(
      new Uint8Array(12)
    );

    const iteraciones = 310000;

    const material =
      await crypto.subtle.importKey(
        "raw",
        enc.encode(clave),
        "PBKDF2",
        false,
        ["deriveKey"]
      );

    const llave =
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

    const datos = enc.encode(
      JSON.stringify(
        prepararIntercambio(a)
      )
    );

    const cifrado = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv
        },
        llave,
        datos
      )
    );

    const contenedor = {
      formato:
        "filiaciones-intercambio-cifrado",
      version: 1,
      cifrado: "AES-256-GCM",
      derivacion: "PBKDF2-SHA256",
      iteraciones,
      sal: base64(sal),
      iv: base64(iv),
      datos: base64(cifrado)
    };

    return new File(
      [
        JSON.stringify(
          contenedor,
          null,
          2
        )
      ],
      `GestorPolicial_${
        nombreSeguro(a.referencia)
      }.gpenc`,
      {
        type: "application/octet-stream"
      }
    );
  }

  function compartirArchivoPreparado(archivo) {
    if (
      !(archivo instanceof File) ||
      !archivo.name.endsWith(".gpenc")
    ) {
      throw Error(
        "Archivo de intercambio no válido."
      );
    }

    return entregar(archivo);
  }

  async function exportar(
    a,
    formato = "ficha"
  ) {
    if (formato === "ficha") {
      return exportarFicha(a);
    }

    if (
      formato === "gestor" ||
      formato === "diligencia"
    ) {
      throw Error(
        "Para el intercambio cifrado " +
        "utiliza el formulario de exportación " +
        "de la Beta 0.9.11."
      );
    }

    throw Error(
      "Formato desconocido."
    );
  }

  return {
    exportar,
    exportarFicha,
    prepararArchivoGestor,
    compartirArchivoPreparado,
    prepararIntercambio,
    fichaCompacta
  };
})();
