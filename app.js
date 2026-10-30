
/* Filiaciones Beta 0.6.1 — prototipo, solo datos ficticios */
"use strict";

let actuacion = null;

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

function principal() {
  return document.querySelector("main");
}

function limpiar() {
  principal().replaceChildren();
}

function titulo(t) {
  const h = document.createElement("h2");
  h.textContent = t;
  principal().appendChild(h);
}

function aviso(t) {
  const p = document.createElement("p");
  p.textContent = t;
  principal().appendChild(p);
}

function boton(t, fn, destino = principal()) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = t;
  b.addEventListener("click", fn);
  destino.appendChild(b);
  return b;
}

function error(e) {
  alert("No se pudo completar: " + (e.message || e));
}

function fechaHoraLocal() {
  const d = new Date();
  const dos = n => String(n).padStart(2, "0");
  return {
    fecha: `${d.getFullYear()}-${dos(d.getMonth()+1)}-${dos(d.getDate())}`,
    hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`
  };
}

function campo(etiqueta, nombre, valor = "", tipo = "", indice = 0) {
  const l = document.createElement("label");
  l.style.cssText = "display:block;margin:12px 0;font-weight:600";
  l.textContent = etiqueta;

  const e = document.createElement("input");
  e.type = (nombre === "fecha" || nombre === "fechaNacimiento") ? "date" :
    nombre === "hora" ? "time" :
    nombre === "correoElectronico" ? "email" :
    nombre === "telefono" ? "tel" : "text";

  e.value = valor == null ? "" : String(valor);
  e.dataset.campo = nombre;

  if (tipo) {
    e.dataset.tipo = tipo;
    e.dataset.indice = String(indice);
  }

  e.style.cssText = "display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:6px;font-size:16px";
  l.appendChild(e);
  return l;
}

function leer() {
  if (!actuacion) return;
  principal().querySelectorAll("[data-campo]").forEach(e => {
    const tipo = e.dataset.tipo;
    const nombre = e.dataset.campo;
    if (!tipo) {
      actuacion[nombre] = e.value;
    } else {
      const registro = actuacion[tipo]?.[Number(e.dataset.indice)];
      if (registro) registro[nombre] = e.value;
    }
  });
}

function nuevaActuacion() {
  actuacion = {
    ...fechaHoraLocal(),
    referencia: "",
    lugar: "",
    agentes: "",
    personas: [],
    vehiculos: [],
    objetos: []
  };
  dibujar();
}

function dibujar() {
  if (!actuacion) return;
  limpiar();
  titulo("Actuación");

  for (const [n, t] of [
    ["referencia", "Referencia"],
    ["fecha", "Fecha"],
    ["hora", "Hora"],
    ["lugar", "Lugar"],
    ["agentes", "Agentes intervinientes"]
  ]) {
    principal().appendChild(campo(t, n, actuacion[n]));
  }

  for (const [tipo, singular] of [
    ["personas", "persona"],
    ["vehiculos", "vehículo"],
    ["objetos", "objeto"]
  ]) {
    actuacion[tipo].forEach((registro, indice) => {
      const s = document.createElement("section");
      s.style.cssText = "padding:15px;margin:15px 0;background:white;color:#17233b;border-radius:12px";

      const h = document.createElement("h3");
      h.textContent = `${singular.toUpperCase()} ${indice+1}`;
      s.appendChild(h);

      for (const [nombre, etiqueta] of esquemas[tipo]) {
        s.appendChild(campo(etiqueta, nombre, registro[nombre], tipo, indice));
      }

      boton(`Eliminar ${singular} ${indice+1}`, () => {
        if (!confirm(`¿Eliminar ${singular} ${indice+1}?`)) return;
        leer();
        actuacion[tipo].splice(indice, 1);
        dibujar();
      }, s);

      principal().appendChild(s);
    });

    boton(`+ Añadir ${singular}`, () => {
      leer();
      const nuevo = {};
      for (const [nombre] of esquemas[tipo]) {
        nuevo[nombre] = "";
      }
      actuacion[tipo].push(nuevo);
      dibujar();
    });
  }

  boton("Ver resumen", resumen);

  // El guardado se incorpora cada vez que se dibuja el formulario.
  if (Almacenamiento.desbloqueado()) {
    controles();
  }

  aviso("PROTOTIPO: solo datos ficticios. No apto aún para información policial real.");
}

function resumen() {
  leer();
  let p = document.getElementById("resumen");

  if (!p) {
    p = document.createElement("pre");
    p.id = "resumen";
    p.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere;background:white;color:#17233b;padding:12px";
    principal().appendChild(p);
  }

  p.textContent = JSON.stringify(actuacion, null, 2);
  p.scrollIntoView({ behavior: "smooth", block: "start" });
}

function controles() {
  boton("Guardar actuación cifrada", async () => {
    try {
      leer();
      const id = await Almacenamiento.guardar(actuacion);
      alert("Actuación de prueba guardada. ID: " + id);
    } catch(e) {
      error(e);
    }
  });

  boton("Consultar actuaciones guardadas", consultar);
  boton("Bloquear aplicación", bloquear);
}

function bloquear() {
  actuacion = null;
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
    p.placeholder = existe ? "Contraseña general" :
      "Nueva contraseña (mínimo 12 caracteres)";
    p.style.cssText = "display:block;width:100%;box-sizing:border-box;padding:12px;margin:12px 0;font-size:16px";
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

    boton(existe ? "Desbloquear" : "Crear contraseña", async () => {
      try {
        if (existe) {
          await Almacenamiento.desbloquear(p.value);
        } else {
          if (p.value !== confirmar.value) {
            throw Error("Las contraseñas no coinciden");
          }
          await Almacenamiento.configurar(p.value);
        }

        p.value = "";
        if (confirmar) confirmar.value = "";
        menu();
      } catch(e) {
        error(e);
      }
    });

    aviso("Versión de pruebas. No introduzcas datos reales.");
  } catch(e) {
    error(e);
  }
}

function menu() {
  if (!Almacenamiento.desbloqueado()) return acceso();

  actuacion = null;
  limpiar();
  titulo("Filiaciones — acceso desbloqueado");

  boton("Nueva actuación", nuevaActuacion);
  boton("Consultar actuaciones guardadas", consultar);
  boton("Bloquear aplicación", bloquear);

  aviso("Prototipo: no verificado para información policial real.");
}

async function consultar() {
  if (!Almacenamiento.desbloqueado()) return acceso();

  actuacion = null;
  limpiar();
  titulo("Actuaciones guardadas");

  try {
    const lista = await Almacenamiento.listar();

    if (!lista.length) aviso("No hay actuaciones guardadas.");

    for (const registro of lista) {
      const s = document.createElement("section");
      s.style.cssText = "padding:12px;margin:10px 0;border:1px solid #888;border-radius:8px";

      const p = document.createElement("p");
      p.textContent = `Referencia: ${registro.referencia || "(sin referencia)"} — ${registro.fecha || ""}`;
      s.appendChild(p);

      boton("Abrir", () => {
        actuacion = registro;
        dibujar();
      }, s);

      boton("Eliminar", async () => {
        if (!confirm("¿Eliminar definitivamente esta actuación de prueba?")) return;
        try {
          await Almacenamiento.eliminar(registro.id);
          consultar();
        } catch(e) {
          error(e);
        }
      }, s);

      principal().appendChild(s);
    }
  } catch(e) {
    error(e);
  }

  boton("Volver al menú", menu);
  boton("Bloquear aplicación", bloquear);
}

window.mostrar = function(nombre) {
  if (!Almacenamiento.desbloqueado()) return acceso();

  if (nombre === "Nueva actuación") {
    nuevaActuacion();
  } else if (nombre === "Consultar actuaciones") {
    consultar();
  } else {
    alert(nombre + ": módulo pendiente.");
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", acceso);
} else {
  acceso();
}
