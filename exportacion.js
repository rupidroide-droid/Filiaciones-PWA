
/*
 * FILIACIONES - EXPORTACIÓN WORD
 * Beta 0.9.9
 *
 * Dos formatos:
 * 1. Ficha de filiación
 * 2. Texto para diligencia
 *
 * Genera DOCX sin bibliotecas externas.
 * Solo pruebas con datos ficticios.
 */
"use strict";

window.Exportacion = (() => {

  const encoder = new TextEncoder();

  const etiquetas = {
    nombre: "Nombre y apellidos",
    tipoDocumento: "Tipo de documento",
    numeroDocumento: "Número de documento",
    fechaNacimiento: "Fecha de nacimiento",
    municipioNacimiento: "Municipio de nacimiento",
    provinciaNacimiento: "Provincia de nacimiento",
    paisNacimiento: "País de nacimiento",
    nombrePadre: "Nombre del padre",
    nombreMadre: "Nombre de la madre",
    nacionalidad: "Nacionalidad",
    domicilio: "Domicilio",
    telefono: "Teléfono",
    correoElectronico: "Correo electrónico",
    observaciones: "Observaciones",
    matricula: "Matrícula",
    marca: "Marca",
    modelo: "Modelo",
    color: "Color",
    bastidor: "Bastidor",
    titular: "Titular (texto libre)",
    conductor: "Conductor (texto libre)",
    descripcion: "Descripción",
    marcaModelo: "Marca y modelo",
    numeroSerie: "Número de serie",
    personaRelacionada: "Persona relacionada"
  };

  const camposPersona = [
    "nombre",
    "tipoDocumento",
    "numeroDocumento",
    "fechaNacimiento",
    "municipioNacimiento",
    "provinciaNacimiento",
    "paisNacimiento",
    "nombrePadre",
    "nombreMadre",
    "nacionalidad",
    "domicilio",
    "telefono",
    "correoElectronico",
    "observaciones"
  ];

  const camposVehiculo = [
    "matricula",
    "marca",
    "modelo",
    "color",
    "bastidor",
    "titular",
    "conductor",
    "observaciones"
  ];

  const camposObjeto = [
    "descripcion",
    "marcaModelo",
    "numeroSerie",
    "personaRelacionada",
    "observaciones"
  ];

  function valor(v) {
    return v == null ? "" : String(v).trim();
  }

  function fecha(v) {
    const s = valor(v);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
  }

  function escapar(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function listas(a) {
    return {
      personas: Array.isArray(a.personas) ? a.personas : [],
      vehiculos: Array.isArray(a.vehiculos) ? a.vehiculos : [],
      objetos: Array.isArray(a.objetos) ? a.objetos : []
    };
  }

  function relaciones(vehiculo, personas) {
    const resultado = [];

    for (const vinculo of
      (Array.isArray(vehiculo.vinculos)
        ? vehiculo.vinculos : [])) {

      const indice = personas.findIndex(
        p => p.idPersona === vinculo.personaId
      );

      if (indice < 0) continue;

      const persona = personas[indice];
      const nombre = valor(persona.nombre) ||
        `Persona ${indice + 1}`;

      const rol = valor(vinculo.rol) ||
        "Relación sin especificar";

      resultado.push(`${nombre} (${rol})`);
    }

    return resultado;
  }

  function linea(campo, dato) {
    const v = campo.includes("Nacimiento") &&
      campo.startsWith("fecha")
      ? fecha(dato)
      : valor(dato);

    if (!v) return null;

    return `${etiquetas[campo] || campo}: ${v}`;
  }

  function bloqueCampos(registro, campos) {
    return campos
      .map(c => linea(c, registro[c]))
      .filter(Boolean);
  }

  function textoActuacion(a) {
    return textoDiligencia(a);
  }

  function fichaCompacta(a) {
    const {personas, vehiculos, objetos} = listas(a);
    const p = [];

    p.push({
      tipo: "titulo",
      texto: "FICHA DE FILIACIÓN Y ACTUACIÓN"
    });

    p.push({
      tipo: "subtitulo",
      texto: "DATOS GENERALES"
    });

    if (valor(a.referencia)) {
      p.push({
        tipo: "campo",
        texto: `Referencia de actuación: ${valor(a.referencia)}`
      });
    }

    if (valor(a.numeroAtestado)) {
      p.push({
        tipo: "campo",
        texto: `Número de atestado: ${valor(a.numeroAtestado)}`
      });
    }

    if (valor(a.fecha)) {
      p.push({
        tipo: "campo",
        texto: `Fecha: ${fecha(a.fecha)}`
      });
    }

    if (valor(a.hora)) {
      p.push({
        tipo: "campo",
        texto: `Hora: ${valor(a.hora)}`
      });
    }

    if (valor(a.lugar)) {
      p.push({
        tipo: "campo",
        texto: `Lugar: ${valor(a.lugar)}`
      });
    }

    if (valor(a.agentes)) {
      p.push({
        tipo: "campo",
        texto: `Agentes intervinientes: ${valor(a.agentes)}`
      });
    }

    personas.forEach((persona, i) => {
      p.push({
        tipo: "subtitulo",
        texto: `PERSONA ${i + 1}`
      });

      for (const texto of bloqueCampos(
        persona, camposPersona
      )) {
        p.push({tipo: "campo", texto});
      }

      const asociados = [];

      vehiculos.forEach((vehiculo, j) => {
        const vinculos = Array.isArray(vehiculo.vinculos)
          ? vehiculo.vinculos : [];

        for (const vinculo of vinculos) {
          if (vinculo.personaId !== persona.idPersona) {
            continue;
          }

          const identificacion =
            valor(vehiculo.matricula) ||
            `Vehículo ${j + 1}`;

          asociados.push(
            `${identificacion}: ${valor(vinculo.rol) || "Sin especificar"}`
          );
        }
      });

      if (asociados.length) {
        p.push({
          tipo: "campo",
          texto: "Vehículos vinculados: " +
            asociados.join("; ")
        });
      }
    });

    vehiculos.forEach((vehiculo, i) => {
      p.push({
        tipo: "subtitulo",
        texto: `VEHÍCULO ${i + 1}`
      });

      for (const texto of bloqueCampos(
        vehiculo, camposVehiculo
      )) {
        p.push({tipo: "campo", texto});
      }

      const vinculos = relaciones(vehiculo, personas);

      if (vinculos.length) {
        p.push({
          tipo: "campo",
          texto: "Personas vinculadas: " +
            vinculos.join("; ")
        });
      }
    });

    objetos.forEach((objeto, i) => {
      p.push({
        tipo: "subtitulo",
        texto: `OBJETO ${i + 1}`
      });

      for (const texto of bloqueCampos(
        objeto, camposObjeto
      )) {
        p.push({tipo: "campo", texto});
      }
    });

    return p;
  }

  function textoDiligencia(a) {
    const {personas, vehiculos, objetos} = listas(a);
    const p = [];

    p.push({
      tipo: "titulo",
      texto: "TEXTO PARA DILIGENCIA"
    });

    const identificadores = [];

    if (valor(a.referencia)) {
      identificadores.push(
        `Referencia de actuación: ${valor(a.referencia)}`
      );
    }

    if (valor(a.numeroAtestado)) {
      identificadores.push(
        `Número de atestado: ${valor(a.numeroAtestado)}`
      );
    }

    for (const texto of identificadores) {
      p.push({tipo: "campo", texto});
    }

    const lugar = valor(a.lugar);
    const hora = valor(a.hora);
    const dia = fecha(a.fecha);

    const circunstancias = [];

    if (lugar) circunstancias.push(`En ${lugar}`);
    if (hora) circunstancias.push(`siendo las ${hora} horas`);
    if (dia) circunstancias.push(`del día ${dia}`);

    if (circunstancias.length) {
      p.push({
        tipo: "parrafo",
        texto: circunstancias.join(", ") + "."
      });
    }

    if (valor(a.agentes)) {
      p.push({
        tipo: "parrafo",
        texto: `Agentes intervinientes: ${valor(a.agentes)}.`
      });
    }

    personas.forEach((persona, i) => {
      const datos = bloqueCampos(
        persona, camposPersona
      );

      if (!datos.length) return;

      p.push({
        tipo: "parrafo",
        texto: `Persona ${i + 1}. ` +
          datos.join("; ") + "."
      });
    });

    vehiculos.forEach((vehiculo, i) => {
      const datos = bloqueCampos(
        vehiculo, camposVehiculo
      );

      const vinculos = relaciones(
        vehiculo, personas
      );

      if (vinculos.length) {
        datos.push(
          "Personas vinculadas: " +
          vinculos.join("; ")
        );
      }

      if (!datos.length) return;

      p.push({
        tipo: "parrafo",
        texto: `Vehículo ${i + 1}. ` +
          datos.join("; ") + "."
      });
    });

    objetos.forEach((objeto, i) => {
      const datos = bloqueCampos(
        objeto, camposObjeto
      );

      if (!datos.length) return;

      p.push({
        tipo: "parrafo",
        texto: `Objeto ${i + 1}. ` +
          datos.join("; ") + "."
      });
    });

    return p;
  }

  function parrafoXML(item) {
    const tipo = item.tipo || "parrafo";

    const estilo = {
      titulo: "TituloFicha",
      subtitulo: "SeccionFicha",
      campo: "CampoFicha",
      parrafo: "TextoFicha"
    }[tipo] || "TextoFicha";

    return (
      `<w:p>` +
      `<w:pPr><w:pStyle w:val="${estilo}"/></w:pPr>` +
      `<w:r><w:t xml:space="preserve">` +
      escapar(item.texto) +
      `</w:t></w:r>` +
      `</w:p>`
    );
  }

  function documentoXML(parrafos) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' +
      parrafos.map(parrafoXML).join("") +
      '<w:sectPr>' +
      '<w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>' +
      '</w:sectPr>' +
      '</w:body></w:document>'
    );
  }

  function estilosXML() {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">' +
      '<w:name w:val="Normal"/>' +
      '<w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/></w:rPr>' +
      '</w:style>' +
      '<w:style w:type="paragraph" w:styleId="TituloFicha">' +
      '<w:name w:val="Título ficha"/>' +
      '<w:pPr><w:spacing w:after="240"/><w:keepNext/></w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="30"/></w:rPr>' +
      '</w:style>' +
      '<w:style w:type="paragraph" w:styleId="SeccionFicha">' +
      '<w:name w:val="Sección ficha"/>' +
      '<w:pPr><w:spacing w:before="220" w:after="100"/><w:keepNext/></w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="23"/></w:rPr>' +
      '</w:style>' +
      '<w:style w:type="paragraph" w:styleId="CampoFicha">' +
      '<w:name w:val="Campo ficha"/>' +
      '<w:pPr><w:spacing w:after="55"/></w:pPr>' +
      '<w:rPr><w:sz w:val="20"/></w:rPr>' +
      '</w:style>' +
      '<w:style w:type="paragraph" w:styleId="TextoFicha">' +
      '<w:name w:val="Texto ficha"/>' +
      '<w:pPr><w:spacing w:after="180"/><w:jc w:val="both"/></w:pPr>' +
      '<w:rPr><w:sz w:val="22"/></w:rPr>' +
      '</w:style>' +
      '</w:styles>'
    );
  }

  function crc32(datos) {
    let crc = 0xFFFFFFFF;

    for (const byte of datos) {
      crc ^= byte;

      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^
          ((crc & 1) ? 0xEDB88320 : 0);
      }
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
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

  function unir(partes) {
    const total = partes.reduce(
      (n, p) => n + p.length, 0
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
        ...u32(0),
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

    return unir([...locales, directorio, final]);
  }

  function crearDocx(parrafos) {
    const tipos =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '</Types>';

    const relacionesRaiz =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>';

    const relacionesWord =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>';

    return crearZIP([
      ["[Content_Types].xml", tipos],
      ["_rels/.rels", relacionesRaiz],
      ["word/document.xml", documentoXML(parrafos)],
      ["word/styles.xml", estilosXML()],
      ["word/_rels/document.xml.rels", relacionesWord]
    ]);
  }

  function nombreSeguro(s) {
    return valor(s)
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 60) || "Sin_referencia";
  }

  async function compartir(archivo) {
    if (
      navigator.canShare &&
      navigator.share &&
      navigator.canShare({files: [archivo]})
    ) {
      await navigator.share({
        files: [archivo],
        title: archivo.name
      });
      return;
    }

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = archivo.name;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function exportar(a, formato = "ficha") {
    if (!a || typeof a !== "object") {
      throw Error("No hay actuación para exportar.");
    }

    if (!valor(a.referencia)) {
      throw Error("Falta la referencia de actuación.");
    }

    if (!["ficha", "diligencia"].includes(formato)) {
      throw Error("Formato de exportación desconocido.");
    }

    const contenido = formato === "ficha"
      ? fichaCompacta(a)
      : textoDiligencia(a);

    const datos = crearDocx(contenido);

    const nombre = (
      formato === "ficha"
        ? "Ficha_"
        : "Diligencia_"
    ) + nombreSeguro(a.referencia) + ".docx";

    const archivo = new File(
      [datos],
      nombre,
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    );

    await compartir(archivo);
  }

  return {
    exportar,
    fichaCompacta,
    textoDiligencia,
    textoActuacion
  };

})();
