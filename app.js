
/*
 * FILIACIONES BETA 0.9.11
 *
 * Recogida local de datos.
 * Personas, vehículos y objetos.
 * Vinculaciones múltiples.
 *
 * Exportaciones:
 * - Ficha Word
 * - Intercambio cifrado para Gestor Policial
 *
 * PROTOTIPO: SOLO DATOS FICTICIOS.
 */
"use strict";

let actuacion = null;
let estadoGuardado = "";
let cambiosPendientes = false;
let archivoGestorPreparado = null;

const esquemas = {
  personas: [
    ["nombre", "Nombre y apellidos"],
    ["tipoDocumento", "Tipo de documento"],
    ["numeroDocumento", "Número de documento"],
    ["fechaNacimiento", "Fecha de nacimiento"],
    ["municipioNacimiento", "Municipio de nacimiento"],
    ["provinciaNacimiento", "Provincia de nacimiento"],
    ["paisNacimiento", "País de nacimiento"],
    ["nombrePadre", "Nombre de pila del padre"],
    ["nombreMadre", "Nombre de pila de la madre"],
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
    ["bastidor", "Bastidor VIN"],
    ["titular", "Titular (texto libre anterior)"],
    ["conductor", "Conductor (texto libre anterior)"],
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

const nombres = {
  personas: "Persona",
  vehiculos: "Vehículo",
  objetos: "Objeto"
};

const roles = [
  "Conductor",
  "Propietario",
  "Titular",
  "Ocupante",
  "Acompañante",
  "Otra"
];

function principal() {
  return document.querySelector("main");
}

function limpiar() {
  principal().replaceChildren();
}

function titulo(texto) {
  const h = document.createElement("h2");
  h.textContent = texto;
  principal().append(h);
}

function aviso(texto, destino = principal()) {
  const p = document.createElement("p");
  p.textContent = texto;
  destino.append(p);
  return p;
}

function boton(
  texto,
  funcion,
  destino = principal()
) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = texto;
  b.addEventListener("click", funcion);
  destino.append(b);
  return b;
}

function error(e) {
  alert(
    "No se pudo completar: " +
    (e?.message || String(e))
  );
}

function fechaHoraLocal() {
  const d = new Date();
  const dos = n =>
    String(n).padStart(2, "0");

  return {
    fecha:
      d.getFullYear() + "-" +
      dos(d.getMonth() + 1) + "-" +
      dos(d.getDate()),
    hora:
      dos(d.getHours()) + ":" +
      dos(d.getMinutes())
  };
}

function identificador() {
  return crypto.randomUUID();
}

function descartarArchivoPreparado() {
  archivoGestorPreparado = null;
}

function normalizar(registro) {
  const obj = structuredClone(registro);

  for (const tipo of Object.keys(esquemas)) {
    if (!Array.isArray(obj[tipo])) {
      obj[tipo] = [];
    }
  }

  const usados = new Set();

  for (const persona of obj.personas) {
    if (
      !persona.idPersona ||
      usados.has(persona.idPersona)
    ) {
      persona.idPersona = identificador();
    }

    usados.add(persona.idPersona);
  }

  for (const vehiculo of obj.vehiculos) {
    if (!Array.isArray(vehiculo.vinculos)) {
      vehiculo.vinculos = [];
    }

    vehiculo.vinculos =
      vehiculo.vinculos.filter(
        relacion =>
          relacion &&
          usados.has(relacion.personaId) &&
          typeof relacion.rol === "string"
      );
  }

  return obj;
}

function comprobarAcceso() {
  if (!Almacenamiento.desbloqueado()) {
    actuacion = null;
    cambiosPendientes = false;
    descartarArchivoPreparado();
    acceso();
    return false;
  }

  return true;
}

function instantanea() {
  return JSON.stringify(actuacion);
}

function marcarGuardado() {
  estadoGuardado = instantanea();
  cambiosPendientes = false;
}

function leer() {
  if (!actuacion) return;

  principal()
    .querySelectorAll("[data-campo]")
    .forEach(e => {
      const tipo = e.dataset.tipo;
      const nombre = e.dataset.campo;

      if (!tipo) {
        actuacion[nombre] = e.value;
      } else {
        const registro =
          actuacion[tipo]?.[
            Number(e.dataset.indice)
          ];

        if (registro) {
          registro[nombre] = e.value;
        }
      }
    });
}

function comprobarCambios() {
  leer();

  cambiosPendientes =
    instantanea() !== estadoGuardado;

  return cambiosPendientes;
}

function confirmarSalida() {
  if (!actuacion || !comprobarCambios()) {
    return true;
  }

  return confirm(
    "Hay cambios sin guardar.\n\n" +
    "Si sales, se perderán esos cambios.\n\n" +
    "¿Quieres salir sin guardar?"
  );
}

function campo(
  etiqueta,
  nombre,
  valor = "",
  tipo = "",
  indice = 0
) {
  const l = document.createElement("label");

  l.style.cssText =
    "display:block;margin:12px 0;" +
    "font-weight:600";

  l.textContent = etiqueta;

  const e = document.createElement("input");

  e.type =
    nombre === "fecha" ||
    nombre === "fechaNacimiento"
      ? "date"
      : nombre === "hora"
        ? "time"
        : nombre === "correoElectronico"
          ? "email"
          : nombre === "telefono"
            ? "tel"
            : "text";

  e.value =
    valor == null ? "" : String(valor);

  e.dataset.campo = nombre;

  if (tipo) {
    e.dataset.tipo = tipo;
    e.dataset.indice = String(indice);
  }

  e.style.cssText = [
    "display:block",
    "width:100%",
    "box-sizing:border-box",
    "padding:12px",
    "margin-top:6px",
    "font-size:16px",
    "border:1px solid #cbd5e1",
    "border-radius:8px",
    "background:white",
    "color:#17253c"
  ].join(";");

  e.addEventListener("input", () => {
    cambiosPendientes = true;
    descartarArchivoPreparado();
  });

  l.append(e);
  return l;
}

function nuevaActuacion() {
  if (!comprobarAcceso()) return;

  descartarArchivoPreparado();

  actuacion = {
    ...fechaHoraLocal(),
    referencia: "",
    numeroAtestado: "",
    lugar: "",
    agentes: "",
    personas: [],
    vehiculos: [],
    objetos: []
  };

  marcarGuardado();
  dibujar();
}

function selector(opciones, valor) {
  const s = document.createElement("select");

  s.style.cssText = [
    "display:block",
    "width:100%",
    "padding:12px",
    "margin:6px 0 12px",
    "font-size:16px"
  ].join(";");

  for (const [id, nombre] of opciones) {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = nombre;
    s.append(o);
  }

  s.value = valor;
  return s;
}

function abrirVehiculo(indice) {
  const seccion = principal().querySelector(
    'section[data-tipo="vehiculos"]'
  );

  const ficha = seccion
    ?.querySelectorAll("details")[indice];

  if (ficha) {
    ficha.open = true;
    ficha.scrollIntoView({
      block: "start"
    });
  }
}

function vinculaciones(
  vehiculo,
  indice,
  destino
) {
  const caja = document.createElement("div");

  caja.style.cssText =
    "border-top:1px solid #ddd;" +
    "margin-top:14px;padding-top:12px";

  const h = document.createElement("h4");
  h.textContent = "Personas vinculadas";
  caja.append(h);

  if (!actuacion.personas.length) {
    aviso(
      "Añade primero una persona para vincularla.",
      caja
    );
  }

  vehiculo.vinculos.forEach((relacion, j) => {
    const persona = actuacion.personas.find(
      p => p.idPersona === relacion.personaId
    );

    if (!persona) return;

    const fila = document.createElement("div");

    fila.style.cssText =
      "border:1px solid #ddd;" +
      "border-radius:8px;" +
      "padding:10px;margin:8px 0";

    aviso(
      (
        persona.nombre ||
        "Persona " +
        (actuacion.personas.indexOf(persona) + 1)
      ) +
      " — " +
      relacion.rol,
      fila
    );

    boton(
      "Quitar vinculación",
      () => {
        leer();
        descartarArchivoPreparado();
        vehiculo.vinculos.splice(j, 1);
        cambiosPendientes = true;
        dibujar();
        abrirVehiculo(indice);
      },
      fila
    );

    caja.append(fila);
  });

  if (actuacion.personas.length) {
    const disponibles =
      actuacion.personas.map(
        (persona, i) => [
          persona.idPersona,
          (i + 1) + ". " +
          (persona.nombre || "Sin nombre")
        ]
      );

    const selectorPersona = selector(
      disponibles,
      disponibles[0][0]
    );

    const selectorRol = selector(
      roles.map(rol => [rol, rol]),
      roles[0]
    );

    caja.append(
      selectorPersona,
      selectorRol
    );

    boton(
      "+ Vincular persona",
      () => {
        leer();

        const existe = vehiculo.vinculos.some(
          relacion =>
            relacion.personaId ===
              selectorPersona.value &&
            relacion.rol === selectorRol.value
        );

        if (existe) {
          alert(
            "Esta vinculación ya existe."
          );
          return;
        }

        descartarArchivoPreparado();

        vehiculo.vinculos.push({
          personaId: selectorPersona.value,
          rol: selectorRol.value
        });

        cambiosPendientes = true;
        dibujar();
        abrirVehiculo(indice);
      },
      caja
    );
  }

  destino.append(caja);
}

function ficha(tipo, registro, indice) {
  const d = document.createElement("details");

  d.style.cssText = [
    "background:white",
    "border:1px solid #dce2eb",
    "border-radius:12px",
    "padding:14px",
    "margin:12px 0",
    "color:#17253c"
  ].join(";");

  const encabezado =
    document.createElement("summary");

  encabezado.textContent =
    nombres[tipo] + " " + (indice + 1);

  encabezado.style.cssText =
    "font-weight:700;" +
    "cursor:pointer;" +
    "padding:8px 0";

  d.append(encabezado);

  for (
    const [nombre, etiqueta]
    of esquemas[tipo]
  ) {
    d.append(
      campo(
        etiqueta,
        nombre,
        registro[nombre],
        tipo,
        indice
      )
    );
  }

  if (tipo === "vehiculos") {
    vinculaciones(
      registro,
      indice,
      d
    );
  }

  boton(
    "Eliminar " +
    nombres[tipo].toLowerCase() +
    " " + (indice + 1),
    () => {
      leer();

      const afectados =
        tipo === "personas"
          ? actuacion.vehiculos.reduce(
              (total, vehiculo) =>
                total +
                vehiculo.vinculos.filter(
                  relacion =>
                    relacion.personaId ===
                    registro.idPersona
                ).length,
              0
            )
          : 0;

      const mensaje =
        "¿Eliminar " +
        nombres[tipo].toLowerCase() +
        " " + (indice + 1) +
        " de esta actuación?" +
        (
          afectados
            ? "\n\nTambién se eliminarán " +
              afectados +
              " vinculaciones con vehículos."
            : ""
        ) +
        "\n\nEl cambio se guardará cuando " +
        "pulses Guardar actuación cifrada.";

      if (!confirm(mensaje)) return;

      descartarArchivoPreparado();

      if (tipo === "personas") {
        for (
          const vehiculo
          of actuacion.vehiculos
        ) {
          vehiculo.vinculos =
            vehiculo.vinculos.filter(
              relacion =>
                relacion.personaId !==
                registro.idPersona
            );
        }
      }

      actuacion[tipo].splice(indice, 1);
      cambiosPendientes = true;
      dibujar();
    },
    d
  );

  return d;
}

function seccion(tipo) {
  const s = document.createElement("section");
  s.dataset.tipo = tipo;

  s.style.cssText =
    "margin:20px 0;" +
    "padding:12px 0;" +
    "border-top:1px solid #cbd5e1";

  const h = document.createElement("h3");

  h.textContent =
    tipo.charAt(0).toUpperCase() +
    tipo.slice(1) +
    " (" +
    actuacion[tipo].length +
    ")";

  s.append(h);

  actuacion[tipo].forEach(
    (registro, indice) => {
      s.append(
        ficha(tipo, registro, indice)
      );
    }
  );

  boton(
    "+ Añadir " +
    nombres[tipo].toLowerCase(),
    () => {
      leer();
      descartarArchivoPreparado();

      const nuevo = {};

      for (
        const [nombre]
        of esquemas[tipo]
      ) {
        nuevo[nombre] = "";
      }

      if (tipo === "personas") {
        nuevo.idPersona = identificador();
      }

      if (tipo === "vehiculos") {
        nuevo.vinculos = [];
      }

      actuacion[tipo].push(nuevo);
      cambiosPendientes = true;
      dibujar();

      const seccionActual =
        principal().querySelector(
          'section[data-tipo="' +
          tipo +
          '"]'
        );

      const ultima = Array.from(
        seccionActual.querySelectorAll(
          "details"
        )
      ).at(-1);

      if (ultima) {
        ultima.open = true;
        ultima.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    },
    s
  );

  principal().append(s);
}

function dibujar() {
  if (
    !comprobarAcceso() ||
    !actuacion
  ) {
    return;
  }

  limpiar();
  titulo("Ficha de actuación");

  aviso(
    actuacion.id
      ? "Actuación guardada. Puedes modificarla."
      : "Nueva actuación. Pendiente de guardar."
  );

  for (
    const [nombre, etiqueta]
    of [
      [
        "referencia",
        "Referencia de actuación"
      ],
      [
        "numeroAtestado",
        "Número de atestado (si existe)"
      ],
      ["fecha", "Fecha"],
      ["hora", "Hora"],
      ["lugar", "Lugar"],
      [
        "agentes",
        "Agentes intervinientes"
      ]
    ]
  ) {
    principal().append(
      campo(
        etiqueta,
        nombre,
        actuacion[nombre]
      )
    );
  }

  seccion("personas");
  seccion("vehiculos");
  seccion("objetos");

  boton(
    "Guardar actuación cifrada",
    guardarActual
  );

  boton(
    "Exportar ficha de filiación Word (.docx)",
    () => exportarFichaWord()
  );

  boton(
    "Exportar para Gestor Policial (cifrado)",
    mostrarFormularioExportacion
  );

  boton(
    "Ver resumen",
    resumen
  );

  boton(
    "Volver al menú",
    () => {
      if (confirmarSalida()) {
        descartarArchivoPreparado();
        menu();
      }
    }
  );

  boton(
    "Bloquear aplicación",
    () => {
      if (confirmarSalida()) {
        bloquear();
      }
    }
  );

  aviso(
    "PROTOTIPO: solo datos ficticios. " +
    "La importación en Gestor Policial " +
    "todavía no está implementada."
  );
}

function validarExportacion() {
  if (
    !comprobarAcceso() ||
    !actuacion
  ) {
    return false;
  }

  leer();

  if (
    !String(
      actuacion.referencia || ""
    ).trim()
  ) {
    alert(
      "Introduce una referencia " +
      "para exportar."
    );
    return false;
  }

  if (
    comprobarCambios() &&
    !confirm(
      "Hay cambios sin guardar.\n\n" +
      "La exportación incluirá los datos " +
      "actuales, aunque no estén guardados.\n\n" +
      "¿Continuar?"
    )
  ) {
    return false;
  }

  return true;
}

async function exportarFichaWord() {
  if (!validarExportacion()) {
    return;
  }

  try {
    if (
      !window.Exportacion?.exportarFicha
    ) {
      throw Error(
        "El módulo de exportación " +
        "no está actualizado."
      );
    }

    await window.Exportacion.exportarFicha(
      structuredClone(actuacion)
    );

  } catch (e) {
    if (
      e?.name !== "AbortError"
    ) {
      error(e);
    }
  }
}

function mostrarFormularioExportacion() {
  if (!validarExportacion()) {
    return;
  }

  descartarArchivoPreparado();

  const anterior =
    document.getElementById(
      "formulario-exportacion-gestor"
    );

  if (anterior) {
    anterior.remove();
  }

  const caja =
    document.createElement("section");

  caja.id =
    "formulario-exportacion-gestor";

  caja.style.cssText = [
    "background:#ffffff",
    "color:#17253c",
    "border:2px solid #244e79",
    "border-radius:12px",
    "padding:16px",
    "margin:18px 0"
  ].join(";");

  const h =
    document.createElement("h3");

  h.textContent =
    "Exportación cifrada para Gestor Policial";

  caja.append(h);

  aviso(
    "Introduce una contraseña independiente " +
    "de la contraseña de Filiaciones. " +
    "El archivo se cifrará antes de compartirlo.",
    caja
  );

  function campoClave(etiqueta) {
    const l =
      document.createElement("label");

    l.textContent = etiqueta;

    l.style.cssText =
      "display:block;" +
      "font-weight:600;" +
      "margin:14px 0";

    const entrada =
      document.createElement("input");

    entrada.type = "password";
    entrada.autocomplete = "off";
    entrada.spellcheck = false;

    entrada.style.cssText = [
      "display:block",
      "width:100%",
      "padding:12px",
      "margin-top:6px",
      "font-size:16px",
      "border:1px solid #cbd5e1",
      "border-radius:8px"
    ].join(";");

    l.append(entrada);
    caja.append(l);

    return entrada;
  }

  const primera =
    campoClave(
      "Contraseña de exportación"
    );

  const segunda =
    campoClave(
      "Repetir contraseña"
    );

  const estado =
    document.createElement("p");

  estado.setAttribute(
    "role",
    "status"
  );

  caja.append(estado);

  const preparar = boton(
    "1. Preparar archivo cifrado",
    async () => {
      const clave = primera.value;
      const repetida = segunda.value;

      if (clave.length < 12) {
        estado.textContent =
          "La contraseña debe tener " +
          "al menos 12 caracteres.";
        return;
      }

      if (clave !== repetida) {
        estado.textContent =
          "Las contraseñas no coinciden.";
        return;
      }

      if (!window.Exportacion
        ?.prepararArchivoGestor) {
        estado.textContent =
          "El módulo de exportación " +
          "no está actualizado.";
        return;
      }

      preparar.disabled = true;
      estado.textContent =
        "Cifrando archivo. Espera...";

      const copia =
        structuredClone(actuacion);

      const huella =
        JSON.stringify(actuacion);

      try {
        descartarArchivoPreparado();

        const archivo =
          await window.Exportacion
            .prepararArchivoGestor(
              copia,
              clave
            );

        if (
          !Almacenamiento.desbloqueado() ||
          !actuacion ||
          JSON.stringify(actuacion) !== huella
        ) {
          throw Error(
            "La actuación ha cambiado " +
            "durante la preparación. " +
            "Vuelve a generar el archivo."
          );
        }

        archivoGestorPreparado = archivo;

        primera.value = "";
        segunda.value = "";

        estado.textContent =
          "Archivo cifrado preparado: " +
          archivo.name +
          ". Ahora pulsa el botón 2 " +
          "para guardarlo.";

        botonGuardar.disabled = false;

      } catch (e) {
        descartarArchivoPreparado();

        estado.textContent =
          "Error al cifrar: " +
          (e?.message || String(e));

      } finally {
        preparar.disabled = false;
      }
    },
    caja
  );

  const botonGuardar = boton(
    "2. Guardar archivo cifrado en el iPhone",
    () => {
      if (!archivoGestorPreparado) {
        estado.textContent =
          "Primero debes preparar " +
          "el archivo cifrado.";
        return;
      }

      if (
        !window.Exportacion
          ?.compartirArchivoPreparado
      ) {
        estado.textContent =
          "El módulo de exportación " +
          "no está actualizado.";
        return;
      }

      /*
       * IMPORTANTE:
       * Se llama directamente desde
       * la pulsación del botón.
       * No hay await previo.
       */
      let resultado;

      try {
        resultado =
          window.Exportacion
            .compartirArchivoPreparado(
              archivoGestorPreparado
            );
      } catch (e) {
        estado.textContent =
          "Error al guardar: " +
          (e?.message || String(e));
        return;
      }

      Promise.resolve(resultado)
        .then(() => {
          estado.textContent =
            "Operación de entrega " +
            "del archivo completada.";
        })
        .catch(e => {
          if (
            e?.name === "AbortError"
          ) {
            estado.textContent =
              "Se canceló la operación. " +
              "Puedes volver a pulsar " +
              "Guardar archivo.";
          } else {
            estado.textContent =
              "Error al compartir: " +
              (e?.message || String(e));
          }
        });
    },
    caja
  );

  botonGuardar.disabled = true;

  boton(
    "Cancelar exportación",
    () => {
      primera.value = "";
      segunda.value = "";
      descartarArchivoPreparado();
      caja.remove();
    },
    caja
  );

  const referencia =
    Array.from(
      principal().querySelectorAll(
        "button"
      )
    ).find(
      b => b.textContent ===
        "Exportar para Gestor Policial (cifrado)"
    );

  if (referencia) {
    referencia.after(caja);
  } else {
    principal().append(caja);
  }

  caja.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

async function guardarActual() {
  if (
    !comprobarAcceso() ||
    !actuacion
  ) {
    return;
  }

  try {
    leer();

    if (
      !String(
        actuacion.referencia || ""
      ).trim()
    ) {
      throw Error(
        "Introduce una referencia " +
        "para la actuación."
      );
    }

    const id =
      await Almacenamiento.guardar(
        actuacion
      );

    descartarArchivoPreparado();
    marcarGuardado();

    alert(
      "Actuación guardada correctamente.\n\n" +
      "Referencia: " +
      actuacion.referencia +
      "\nID: " + id
    );

    dibujar();

  } catch (e) {
    error(e);
  }
}

function resumen() {
  if (!actuacion) return;

  leer();

  let p =
    document.getElementById(
      "resumen"
    );

  if (!p) {
    p =
      document.createElement("pre");

    p.id = "resumen";

    p.style.cssText = [
      "white-space:pre-wrap",
      "overflow-wrap:anywhere",
      "background:white",
      "color:#17253c",
      "padding:12px",
      "border-radius:8px"
    ].join(";");

    principal().append(p);
  }

  p.textContent = JSON.stringify(
    actuacion,
    null,
    2
  );

  p.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function bloquear() {
  actuacion = null;
  cambiosPendientes = false;
  estadoGuardado = "";

  descartarArchivoPreparado();

  Almacenamiento.bloquear();
  acceso();
}

async function acceso() {
  limpiar();
  titulo("Acceso a Filiaciones");

  try {
    const existe =
      await Almacenamiento.existe();

    const p =
      document.createElement("input");

    p.type = "password";
    p.autocomplete = "off";

    p.placeholder = existe
      ? "Contraseña general"
      : "Nueva contraseña (mínimo 12 caracteres)";

    p.style.cssText =
      "display:block;" +
      "width:100%;" +
      "box-sizing:border-box;" +
      "padding:12px;" +
      "margin:12px 0;" +
      "font-size:16px";

    principal().append(p);

    let confirmar = null;

    if (!existe) {
      confirmar =
        document.createElement("input");

      confirmar.type = "password";
      confirmar.autocomplete = "off";
      confirmar.placeholder =
        "Repite la contraseña";

      confirmar.style.cssText =
        p.style.cssText;

      principal().append(confirmar);
    }

    boton(
      existe
        ? "Desbloquear"
        : "Crear contraseña",
      async () => {
        try {
          if (existe) {
            await Almacenamiento.desbloquear(
              p.value
            );
          } else {
            if (
              p.value !==
              confirmar.value
            ) {
              throw Error(
                "Las contraseñas no coinciden."
              );
            }

            await Almacenamiento.configurar(
              p.value
            );
          }

          p.value = "";

          if (confirmar) {
            confirmar.value = "";
          }

          menu();

        } catch (e) {
          error(e);
        }
      }
    );

    aviso(
      "Versión de pruebas. " +
      "No introduzcas datos reales."
    );

  } catch (e) {
    error(e);
  }
}

function menu() {
  if (!Almacenamiento.desbloqueado()) {
    return acceso();
  }

  actuacion = null;
  cambiosPendientes = false;
  estadoGuardado = "";

  descartarArchivoPreparado();

  limpiar();

  titulo(
    "Filiaciones — acceso desbloqueado"
  );

  boton(
    "Nueva actuación",
    nuevaActuacion
  );

  boton(
    "Consultar actuaciones guardadas",
    consultar
  );

  boton(
    "Bloquear aplicación",
    bloquear
  );

  aviso(
    "Prototipo: no verificado para " +
    "información policial real."
  );
}

async function consultar() {
  if (!comprobarAcceso()) return;

  actuacion = null;
  cambiosPendientes = false;

  descartarArchivoPreparado();

  limpiar();
  titulo("Actuaciones guardadas");

  try {
    const lista =
      await Almacenamiento.listar();

    if (!Almacenamiento.desbloqueado()) {
      return acceso();
    }

    if (!lista.length) {
      aviso(
        "No hay actuaciones guardadas."
      );
    }

    for (const registro of lista) {
      const s =
        document.createElement("section");

      s.style.cssText =
        "padding:12px;" +
        "margin:10px 0;" +
        "border:1px solid #888;" +
        "border-radius:8px";

      aviso(
        "Referencia: " +
        (
          registro.referencia ||
          "(sin referencia)"
        ) +
        " — " +
        (registro.fecha || ""),
        s
      );

      boton(
        "Abrir y editar",
        () => {
          descartarArchivoPreparado();
          actuacion = normalizar(registro);
          marcarGuardado();
          dibujar();
        },
        s
      );

      boton(
        "Eliminar",
        async () => {
          if (
            !confirm(
              "¿Eliminar definitivamente " +
              "esta actuación de prueba?\n\n" +
              "Esta operación no se puede " +
              "deshacer sin una copia " +
              "de seguridad."
            )
          ) {
            return;
          }

          try {
            await Almacenamiento.eliminar(
              registro.id
            );

            await consultar();

          } catch (e) {
            error(e);
          }
        },
        s
      );

      principal().append(s);
    }

  } catch (e) {
    error(e);
  }

  boton(
    "Volver al menú",
    menu
  );

  boton(
    "Bloquear aplicación",
    bloquear
  );
}

window.mostrar = function(nombre) {
  if (!Almacenamiento.desbloqueado()) {
    return acceso();
  }

  if (
    actuacion &&
    !confirmarSalida()
  ) {
    return;
  }

  descartarArchivoPreparado();

  if (
    nombre === "Nueva actuación"
  ) {
    nuevaActuacion();

  } else if (
    nombre === "Consultar actuaciones"
  ) {
    consultar();

  } else {
    alert(
      nombre +
      ": módulo pendiente."
    );
  }
};

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    acceso
  );
} else {
  acceso();
}
