
/*
 * FILIACIONES BETA 0.9.7
 * Formulario de actuaciones y exportación a Word.
 * SOLO DATOS FICTICIOS.
 */
"use strict";

let actuacion = null;
let estadoGuardado = "";
let cambiosPendientes = false;

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
    ["titular", "Titular"],
    ["conductor", "Conductor"],
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

function principal() {
  return document.querySelector("main");
}

function limpiar() {
  principal().replaceChildren();
}

function titulo(texto) {
  const h = document.createElement("h2");
  h.textContent = texto;
  principal().appendChild(h);
}

function aviso(texto, destino = principal()) {
  const p = document.createElement("p");
  p.textContent = texto;
  destino.appendChild(p);
  return p;
}

function boton(texto, funcion, destino = principal()) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = texto;
  b.addEventListener("click", funcion);
  destino.appendChild(b);
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
  const dos = n => String(n).padStart(2, "0");

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

function normalizar(registro) {
  const obj = structuredClone(registro);

  for (const tipo of Object.keys(esquemas)) {
    if (!Array.isArray(obj[tipo])) {
      obj[tipo] = [];
    }
  }

  return obj;
}

function comprobarAcceso() {
  if (!Almacenamiento.desbloqueado()) {
    actuacion = null;
    cambiosPendientes = false;
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

function comprobarCambios() {
  leer();
  cambiosPendientes =
    instantanea() !== estadoGuardado;
  return cambiosPendientes;
}

function confirmarSalida() {
  if (!actuacion) return true;

  if (!comprobarCambios()) {
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
    "display:block;margin:12px 0;font-weight:600";

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

  e.value = valor == null ? "" : String(valor);
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
  });

  l.appendChild(e);
  return l;
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
        const indice = Number(e.dataset.indice);
        const registro = actuacion[tipo]?.[indice];

        if (registro) {
          registro[nombre] = e.value;
        }
      }
    });
}

function nuevaActuacion() {
  if (!comprobarAcceso()) return;

  actuacion = {
    ...fechaHoraLocal(),
    referencia: "",
    lugar: "",
    agentes: "",
    personas: [],
    vehiculos: [],
    objetos: []
  };

  marcarGuardado();
  dibujar();
}

function ficha(tipo, registro, indice) {
  const singular = nombres[tipo];

  const d = document.createElement("details");

  d.style.cssText = [
    "background:white",
    "border:1px solid #dce2eb",
    "border-radius:12px",
    "padding:14px",
    "margin:12px 0",
    "color:#17253c"
  ].join(";");

  const encabezado = document.createElement("summary");

  encabezado.textContent =
    singular + " " + (indice + 1);

  encabezado.style.cssText =
    "font-weight:700;cursor:pointer;padding:8px 0";

  d.appendChild(encabezado);

  for (const [nombre, etiqueta] of esquemas[tipo]) {
    d.appendChild(
      campo(
        etiqueta,
        nombre,
        registro[nombre],
        tipo,
        indice
      )
    );
  }

  boton(
    "Eliminar " + singular.toLowerCase() +
    " " + (indice + 1),
    () => {
      leer();

      if (!confirm(
        "¿Eliminar " +
        singular.toLowerCase() +
        " " + (indice + 1) +
        " de esta actuación?\n\n" +
        "El cambio se guardará cuando pulses " +
        "Guardar actuación cifrada."
      )) {
        return;
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
  const singular = nombres[tipo];

  const s = document.createElement("section");

  s.style.cssText =
    "margin:20px 0;padding:12px 0;" +
    "border-top:1px solid #cbd5e1";

  const h = document.createElement("h3");

  h.textContent =
    tipo.charAt(0).toUpperCase() +
    tipo.slice(1) +
    " (" + actuacion[tipo].length + ")";

  s.appendChild(h);

  actuacion[tipo].forEach((registro, indice) => {
    s.appendChild(ficha(tipo, registro, indice));
  });

  boton(
    "+ Añadir " + singular.toLowerCase(),
    () => {
      leer();

      const nuevo = {};

      for (const [nombre] of esquemas[tipo]) {
        nuevo[nombre] = "";
      }

      actuacion[tipo].push(nuevo);
      cambiosPendientes = true;
      dibujar();

      const fichas = principal().querySelectorAll(
        "details"
      );

      const ultima = Array.from(fichas)
        .filter(d =>
          d.closest("section")?.dataset.tipo === tipo
        )
        .at(-1);

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

  s.dataset.tipo = tipo;
  principal().appendChild(s);
}

function dibujar() {
  if (!comprobarAcceso() || !actuacion) return;

  limpiar();
  titulo("Ficha de actuación");

  aviso(
    actuacion.id
      ? "Actuación guardada. Puedes modificarla."
      : "Nueva actuación. Pendiente de guardar."
  );

  for (const [nombre, etiqueta] of [
    ["referencia", "Referencia"],
    ["fecha", "Fecha"],
    ["hora", "Hora"],
    ["lugar", "Lugar"],
    ["agentes", "Agentes intervinientes"]
  ]) {
    principal().appendChild(
      campo(etiqueta, nombre, actuacion[nombre])
    );
  }

  seccion("personas");
  seccion("vehiculos");
  seccion("objetos");

  boton("Guardar actuación cifrada", guardarActual);

  boton("Exportar a Word (.docx)", exportarWord);

  boton("Ver resumen", resumen);

  boton("Volver al menú", () => {
    if (confirmarSalida()) {
      menu();
    }
  });

  boton("Bloquear aplicación", () => {
    if (confirmarSalida()) {
      bloquear();
    }
  });

  aviso(
    "PROTOTIPO: solo datos ficticios. " +
    "No apto para información policial real."
  );
}

async function exportarWord() {
  if (!comprobarAcceso() || !actuacion) return;

  try {
    if (!window.Exportacion?.exportar) {
      throw Error(
        "El módulo de exportación no está cargado."
      );
    }

    leer();

    if (!actuacion.referencia.trim()) {
      throw Error(
        "Introduce una referencia para exportar."
      );
    }

    if (comprobarCambios()) {
      const continuar = confirm(
        "Hay cambios sin guardar.\n\n" +
        "El documento incluirá los datos actuales " +
        "del formulario, aunque todavía no se hayan " +
        "guardado en la actuación cifrada.\n\n" +
        "¿Quieres continuar?"
      );

      if (!continuar) return;
    }

    await window.Exportacion.exportar(
      structuredClone(actuacion)
    );

  } catch (e) {
    if (e?.name === "AbortError") return;
    error(e);
  }
}

async function guardarActual() {
  if (!comprobarAcceso() || !actuacion) return;

  try {
    leer();

    if (!actuacion.referencia.trim()) {
      throw Error(
        "Introduce una referencia para la actuación"
      );
    }

    const id = await Almacenamiento.guardar(actuacion);

    marcarGuardado();

    alert(
      "Actuación guardada correctamente.\n\n" +
      "Referencia: " + actuacion.referencia +
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

  let p = document.getElementById("resumen");

  if (!p) {
    p = document.createElement("pre");
    p.id = "resumen";

    p.style.cssText = [
      "white-space:pre-wrap",
      "overflow-wrap:anywhere",
      "background:white",
      "color:#17253c",
      "padding:12px",
      "border-radius:8px"
    ].join(";");

    principal().appendChild(p);
  }

  p.textContent = JSON.stringify(actuacion, null, 2);

  p.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function bloquear() {
  actuacion = null;
  cambiosPendientes = false;
  estadoGuardado = "";

  Almacenamiento.bloquear();
  acceso();
}

async function acceso() {
  limpiar();
  titulo("Acceso a Filiaciones");

  try {
    const existe = await Almacenamiento.existe();

    const p = document.createElement("input");

    p.type = "password";
    p.autocomplete = "off";

    p.placeholder = existe
      ? "Contraseña general"
      : "Nueva contraseña (mínimo 12 caracteres)";

    p.style.cssText =
      "display:block;width:100%;" +
      "box-sizing:border-box;padding:12px;" +
      "margin:12px 0;font-size:16px";

    principal().appendChild(p);

    let confirmar = null;

    if (!existe) {
      confirmar = document.createElement("input");
      confirmar.type = "password";
      confirmar.autocomplete = "off";
      confirmar.placeholder = "Repite la contraseña";
      confirmar.style.cssText = p.style.cssText;
      principal().appendChild(confirmar);
    }

    boton(
      existe ? "Desbloquear" : "Crear contraseña",
      async () => {
        try {
          if (existe) {
            await Almacenamiento.desbloquear(p.value);
          } else {
            if (p.value !== confirmar.value) {
              throw Error(
                "Las contraseñas no coinciden"
              );
            }

            await Almacenamiento.configurar(p.value);
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

  limpiar();
  titulo("Filiaciones — acceso desbloqueado");

  boton("Nueva actuación", nuevaActuacion);

  boton(
    "Consultar actuaciones guardadas",
    consultar
  );

  boton("Bloquear aplicación", bloquear);

  aviso(
    "Prototipo: no verificado para " +
    "información policial real."
  );
}

async function consultar() {
  if (!comprobarAcceso()) return;

  actuacion = null;
  cambiosPendientes = false;

  limpiar();
  titulo("Actuaciones guardadas");

  try {
    const lista = await Almacenamiento.listar();

    if (!Almacenamiento.desbloqueado()) {
      return acceso();
    }

    if (!lista.length) {
      aviso("No hay actuaciones guardadas.");
    }

    for (const registro of lista) {
      const s = document.createElement("section");

      s.style.cssText = [
        "padding:12px",
        "margin:10px 0",
        "border:1px solid #888",
        "border-radius:8px"
      ].join(";");

      const p = document.createElement("p");

      p.textContent =
        "Referencia: " +
        (registro.referencia || "(sin referencia)") +
        " — " +
        (registro.fecha || "");

      s.appendChild(p);

      boton("Abrir y editar", () => {
        actuacion = normalizar(registro);
        marcarGuardado();
        dibujar();
      }, s);

      boton("Eliminar", async () => {
        if (!confirm(
          "¿Eliminar definitivamente esta " +
          "actuación de prueba?\n\n" +
          "Esta operación no se puede deshacer " +
          "sin una copia de seguridad."
        )) {
          return;
        }

        try {
          await Almacenamiento.eliminar(registro.id);
          await consultar();
        } catch (e) {
          error(e);
        }
      }, s);

      principal().appendChild(s);
    }

  } catch (e) {
    error(e);
  }

  boton("Volver al menú", menu);
  boton("Bloquear aplicación", bloquear);
}

window.mostrar = function(nombre) {
  if (!Almacenamiento.desbloqueado()) {
    return acceso();
  }

  if (actuacion && !confirmarSalida()) {
    return;
  }

  if (nombre === "Nueva actuación") {
    nuevaActuacion();
  } else if (nombre === "Consultar actuaciones") {
    consultar();
  } else {
    alert(nombre + ": módulo pendiente.");
  }
};

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    acceso
  );
} else {
  acceso();
}
