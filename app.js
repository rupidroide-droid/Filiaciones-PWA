/* Filiaciones Beta 0.4 — formularios de prueba, sin persistencia */
"use strict";

let actuacion = null;
const esquemas = {
  personas: [
    ["nombre", "Nombre y apellidos"],
    ["tipoDocumento", "Tipo de documento"],
    ["numeroDocumento", "Número de documento"],
    ["fechaNacimiento", "Fecha de nacimiento"],
    ["nacionalidad", "Nacionalidad"],
    ["domicilio", "Domicilio"],
    ["telefono", "Teléfono"],
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

function fechaHoraLocal() {
  const d = new Date();
  const dos = n => String(n).padStart(2, "0");
  return {
    fecha: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`,
    hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`
  };
}

function nuevaActuacion() {
  const ahora = fechaHoraLocal();
  actuacion = {
    referencia: "",
    fecha: ahora.fecha,
    hora: ahora.hora,
    lugar: "",
    agentes: "",
    personas: [],
    vehiculos: [],
    objetos: []
  };
  dibujar();
}

function leer() {
  if (!actuacion) return;
  document.querySelectorAll("[data-campo]").forEach(el => {
    const tipo = el.dataset.tipo;
    const campo = el.dataset.campo;
    if (!tipo) {
      actuacion[campo] = el.value;
    } else {
      const indice = Number(el.dataset.indice);
      if (actuacion[tipo] && actuacion[tipo][indice]) {
        actuacion[tipo][indice][campo] = el.value;
      }
    }
  });
}

function campo(etiqueta, nombre, valor, tipo = "", indice = 0) {
  const contenedor = document.createElement("label");
  contenedor.style.cssText = "display:block;margin:12px 0;font-weight:600";
  contenedor.textContent = etiqueta;
  const entrada = document.createElement("input");
  entrada.type = "text";
  entrada.value = valor || "";
  entrada.dataset.campo = nombre;
  if (tipo) {
    entrada.dataset.tipo = tipo;
    entrada.dataset.indice = String(indice);
  }
  entrada.style.cssText = "display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:6px;font-size:16px";
  contenedor.appendChild(entrada);
  return contenedor;
}

function boton(texto, accion) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = texto;
  b.addEventListener("click", accion);
  return b;
}

function dibujar() {
  const principal = document.querySelector("main");
  if (!principal || !actuacion) return;
  principal.replaceChildren();
  const titulo = document.createElement("h2");
  titulo.textContent = "Actuación";
  principal.appendChild(titulo);
  for (const [nombre, etiqueta] of [
    ["referencia", "Referencia"],
    ["fecha", "Fecha"],
    ["hora", "Hora"],
    ["lugar", "Lugar"],
    ["agentes", "Agentes intervinientes"]
  ]) principal.appendChild(campo(etiqueta, nombre, actuacion[nombre]));

  for (const [tipo, singular] of [
    ["personas", "persona"],
    ["vehiculos", "vehículo"],
    ["objetos", "objeto"]
  ]) {
    actuacion[tipo].forEach((registro, indice) => {
      const seccion = document.createElement("section");
      seccion.style.cssText = "padding:15px;margin:15px 0;background:white;color:#17233b;border-radius:12px";
      const encabezado = document.createElement("h3");
      encabezado.textContent = `${singular.toUpperCase()} ${indice + 1}`;
      seccion.appendChild(encabezado);
      for (const [nombre, etiqueta] of esquemas[tipo]) {
        seccion.appendChild(campo(etiqueta, nombre, registro[nombre], tipo, indice));
      }
      seccion.appendChild(boton(`Eliminar ${singular} ${indice + 1}`, () => {
        if (!confirm(`¿Eliminar ${singular} ${indice + 1} de esta actuación?`)) return;
        leer();
        actuacion[tipo].splice(indice, 1);
        dibujar();
      }));
      principal.appendChild(seccion);
    });
    principal.appendChild(boton(`+ Añadir ${singular}`, () => {
      leer();
      const nuevo = {};
      for (const [nombre] of esquemas[tipo]) nuevo[nombre] = "";
      actuacion[tipo].push(nuevo);
      dibujar();
    }));
  }

  principal.appendChild(boton("Ver resumen", resumen));
  const aviso = document.createElement("p");
  aviso.textContent = "Beta de prueba: no hay almacenamiento ni cifrado. Utiliza solo datos ficticios.";
  principal.appendChild(aviso);
}

function resumen() {
  leer();
  const principal = document.querySelector("main");
  let bloque = document.getElementById("resumen");
  if (!bloque) {
    bloque = document.createElement("pre");
    bloque.id = "resumen";
    bloque.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere;background:white;color:#17233b;padding:12px";
    principal.appendChild(bloque);
  }
  bloque.textContent = JSON.stringify(actuacion, null, 2);
  bloque.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.mostrar = function (nombre) {
  if (nombre === "Nueva actuación") nuevaActuacion();
  else alert(`${nombre}: módulo pendiente.`);
};
