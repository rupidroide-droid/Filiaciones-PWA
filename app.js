/* Filiaciones Beta 0.2 — Formularios de prueba */
"use strict";
let actuacion = null;

function campo(etiqueta, clave, tipo = "text") {
  return '<label style="display:block;margin:12px 0">' +
    etiqueta + '<input type="' + tipo + '" data-campo="' + clave +
    '" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px;border:1px solid #bbb;border-radius:8px"></label>';
}

function nuevaActuacion() {
  actuacion = { personas: [], vehiculos: [], objetos: [] };
  document.querySelector("main").innerHTML =
    '<h2>Nueva actuación</h2>' +
    campo("Referencia", "referencia") +
    campo("Fecha", "fecha", "date") +
    campo("Hora", "hora", "time") +
    campo("Lugar", "lugar") +
    campo("Agentes intervinientes", "agentes") +
    '<button onclick="agregarPersona()">+ Añadir persona</button>' +
    '<button onclick="agregarVehiculo()">+ Añadir vehículo</button>' +
    '<button onclick="agregarObjeto()">+ Añadir objeto</button>' +
    '<button onclick="resumen()">Ver resumen</button>' +
    '<p>Beta de prueba: los datos no se guardan.</p>';
}

function agregarPersona() {
  let n = ++actuacion.personas.length;
  agregarBloque("Persona " + n, [
    ["Nombre y apellidos", "nombre"],
    ["DNI / NIE / Pasaporte", "documento"],
    ["Fecha de nacimiento", "nacimiento"],
    ["Nacionalidad", "nacionalidad"],
    ["Domicilio", "domicilio"],
    ["Teléfono", "telefono"],
    ["Observaciones", "observaciones"]
  ], "persona" + n);
}

function agregarVehiculo() {
  let n = ++actuacion.vehiculos.length;
  agregarBloque("Vehículo " + n, [
    ["Matrícula", "matricula"],
    ["Marca", "marca"],
    ["Modelo", "modelo"],
    ["Color", "color"],
    ["Número de bastidor", "bastidor"],
    ["Titular", "titular"],
    ["Conductor", "conductor"],
    ["Observaciones", "observaciones"]
  ], "vehiculo" + n);
}

function agregarObjeto() {
  let n = ++actuacion.objetos.length;
  agregarBloque("Objeto " + n, [
    ["Descripción", "descripcion"],
    ["Marca / Modelo", "marca"],
    ["Número de serie", "serie"],
    ["Persona relacionada", "persona"],
    ["Observaciones", "observaciones"]
  ], "objeto" + n);
}

function agregarBloque(titulo, campos, prefijo) {
  let bloque = document.createElement("section");
  bloque.style.cssText = "padding:15px;margin:15px 0;background:white;border-radius:12px";
  bloque.innerHTML = "<h3>" + titulo + "</h3>" +
    campos.map(c => campo(c[0], prefijo + "_" + c[1])).join("");
  document.querySelector("main").appendChild(bloque);
}

function resumen() {
  alert("Personas: " + actuacion.personas.length +
    "\nVehículos: " + actuacion.vehiculos.length +
    "\nObjetos: " + actuacion.objetos.length +
    "\nTodavía no existe almacenamiento.");
}

document.addEventListener("DOMContentLoaded", () => {
  window.mostrar = function(nombre) {
    if (nombre === "Nueva actuación") nuevaActuacion();
    else alert(nombre + ": módulo pendiente.");
  };
});
