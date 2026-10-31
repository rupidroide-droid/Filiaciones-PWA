
/*
 * FILIACIONES BETA 0.9.7
 * Exportación local a Word DOCX.
 * SOLO DATOS FICTICIOS.
 */
"use strict";

window.Exportacion = (() => {
  const encoder = new TextEncoder();

  function xml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function dato(valor) {
    return String(valor ?? "").trim();
  }

  function frase(partes) {
    return partes.filter(Boolean).join(", ");
  }

  function fechaEspanola(fecha) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dato(fecha));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : dato(fecha);
  }

  function textoActuacion(a) {
    const parrafos = [];
    const lugar = dato(a.lugar);
    const fecha = fechaEspanola(a.fecha);
    const hora = dato(a.hora);
    const referencia = dato(a.referencia);

    parrafos.push(
      "ACTUACIÓN" +
      (referencia ? " NÚMERO " + referencia : "")
    );

    const inicio = [
      lugar ? "En " + lugar : "",
      hora ? "siendo las " + hora + " horas" : "",
      fecha ? "del día " + fecha : ""
    ].filter(Boolean).join(", ");

    if (inicio) {
      parrafos.push(inicio + ".");
    }

    if (dato(a.agentes)) {
      parrafos.push(
        "Agentes intervinientes: " +
        dato(a.agentes) + "."
      );
    }

    const personas = Array.isArray(a.personas)
      ? a.personas : [];

    personas.forEach((p, i) => {
      const partes = [];

      if (dato(p.nombre)) {
        partes.push("nombre y apellidos: " + dato(p.nombre));
      }
      if (dato(p.tipoDocumento) || dato(p.numeroDocumento)) {
        partes.push(
          "documento: " +
          frase([dato(p.tipoDocumento), dato(p.numeroDocumento)])
        );
      }
      if (dato(p.fechaNacimiento)) {
        partes.push(
          "fecha de nacimiento: " +
          fechaEspanola(p.fechaNacimiento)
        );
      }
      for (const [clave, etiqueta] of [
        ["municipioNacimiento", "municipio de nacimiento"],
        ["provinciaNacimiento", "provincia de nacimiento"],
        ["paisNacimiento", "país de nacimiento"],
        ["nombrePadre", "nombre del padre"],
        ["nombreMadre", "nombre de la madre"],
        ["nacionalidad", "nacionalidad"],
        ["domicilio", "domicilio"],
        ["telefono", "teléfono"],
        ["correoElectronico", "correo electrónico"],
        ["observaciones", "observaciones"]
      ]) {
        if (dato(p[clave])) {
          partes.push(etiqueta + ": " + dato(p[clave]));
        }
      }

      parrafos.push(
        "En relación con la persona " + (i + 1) +
        ", se hacen constar los siguientes datos: " +
        (partes.length ? partes.join("; ") : "sin datos cumplimentados") +
        "."
      );
    });

    const vehiculos = Array.isArray(a.vehiculos)
      ? a.vehiculos : [];

    vehiculos.forEach((v, i) => {
      const partes = [];

      for (const [clave, etiqueta] of [
        ["matricula", "matrícula"],
        ["marca", "marca"],
        ["modelo", "modelo"],
        ["color", "color"],
        ["bastidor", "bastidor VIN"],
        ["titular", "titular"],
        ["conductor", "conductor"],
        ["observaciones", "observaciones"]
      ]) {
        if (dato(v[clave])) {
          partes.push(etiqueta + ": " + dato(v[clave]));
        }
      }

      parrafos.push(
        "En relación con el vehículo " + (i + 1) +
        ", se hacen constar los siguientes datos: " +
        (partes.length ? partes.join("; ") : "sin datos cumplimentados") +
        "."
      );
    });

    const objetos = Array.isArray(a.objetos)
      ? a.objetos : [];

    objetos.forEach((o, i) => {
      const partes = [];

      for (const [clave, etiqueta] of [
        ["descripcion", "descripción"],
        ["marcaModelo", "marca y modelo"],
        ["numeroSerie", "número de serie"],
        ["personaRelacionada", "persona relacionada"],
        ["observaciones", "observaciones"]
      ]) {
        if (dato(o[clave])) {
          partes.push(etiqueta + ": " + dato(o[clave]));
        }
      }

      parrafos.push(
        "En relación con el objeto " + (i + 1) +
        ", se hacen constar los siguientes datos: " +
        (partes.length ? partes.join("; ") : "sin datos cumplimentados") +
        "."
      );
    });

    return parrafos;
  }

  function crc32(bytes) {
    let crc = 0xffffffff;

    for (const b of bytes) {
      crc ^= b;
      for (let i = 0; i < 8; i++) {
        crc = (crc >>> 1) ^
          ((crc & 1) ? 0xedb88320 : 0);
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  function u16(n) {
    return [n & 255, (n >>> 8) & 255];
  }

  function u32(n) {
    return [
      n & 255,
      (n >>> 8) & 255,
      (n >>> 16) & 255,
      (n >>> 24) & 255
    ];
  }

  function zip(archivos) {
    const partes = [];
    const central = [];
    let offset = 0;

    for (const [nombre, contenido] of archivos) {
      const name = encoder.encode(nombre);
      const data = encoder.encode(contenido);
      const crc = crc32(data);
      const size = data.length;

      const local = new Uint8Array([
        ...u32(0x04034b50),
        ...u16(20), ...u16(0x0800),
        ...u16(0), ...u16(0), ...u16(0),
        ...u32(crc), ...u32(size), ...u32(size),
        ...u16(name.length), ...u16(0),
        ...name
      ]);

      partes.push(local, data);

      central.push(new Uint8Array([
        ...u32(0x02014b50),
        ...u16(20), ...u16(20),
        ...u16(0x0800), ...u16(0),
        ...u16(0), ...u16(0),
        ...u32(crc), ...u32(size), ...u32(size),
        ...u16(name.length), ...u16(0),
        ...u16(0), ...u16(0), ...u16(0),
        ...u32(0), ...u32(offset),
        ...name
      ]));

      offset += local.length + size;
    }

    const centralSize = central.reduce(
      (n, p) => n + p.length, 0
    );

    const final = new Uint8Array([
      ...u32(0x06054b50),
      ...u16(0), ...u16(0),
      ...u16(archivos.length),
      ...u16(archivos.length),
      ...u32(centralSize),
      ...u32(offset),
      ...u16(0)
    ]);

    return new Blob(
      [...partes, ...central, final],
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    );
  }

  function crearDocx(parrafos) {
    const cuerpo = parrafos.map((p, i) => {
      const negrita = i === 0
        ? "<w:rPr><w:b/></w:rPr>" : "";

      return `<w:p><w:pPr><w:spacing w:after="180"/></w:pPr><w:r>${negrita}<w:t xml:space="preserve">${xml(p)}</w:t></w:r></w:p>`;
    }).join("");

    const documento =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' + cuerpo +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417"/>' +
      '</w:sectPr></w:body></w:document>';

    return zip([
      ["[Content_Types].xml",
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>'],
      ["_rels/.rels",
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>'],
      ["word/document.xml", documento]
    ]);
  }

  function nombreArchivo(referencia) {
    const limpio = dato(referencia)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);

    return "Filiacion_" +
      (limpio || "actuacion") + ".docx";
  }

  async function exportar(actuacion) {
    if (!actuacion || typeof actuacion !== "object") {
      throw Error("No hay actuación para exportar.");
    }

    const archivo = new File(
      [crearDocx(textoActuacion(actuacion))],
      nombreArchivo(actuacion.referencia),
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    );

    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo] });
      return;
    }

    const url = URL.createObjectURL(archivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = archivo.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  return { exportar, textoActuacion };
})();
