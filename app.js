/* Filiaciones Beta 0.3 - pruebas con datos ficticios */
"use strict";
let actuacion = null;
const campos = {
 personas:["Nombre y apellidos","Tipo de documento","Número de documento","Fecha de nacimiento","Nacionalidad","Domicilio","Teléfono","Observaciones"],
 vehiculos:["Matrícula","Marca","Modelo","Color","Bastidor VIN","Titular","Conductor","Observaciones"],
 objetos:["Descripción","Marca y modelo","Número de serie","Persona relacionada","Observaciones"]
};
function nuevaActuacion(){
 actuacion={referencia:"",fecha:"",hora:"",lugar:"",agentes:"",personas:[],vehiculos:[],objetos:[]};
 dibujar();
}
function leer(){
 if(!actuacion)return;
 document.querySelectorAll("[data-dato]").forEach(e=>{
  const p=e.dataset.dato.split(":");
  if(p.length===1)actuacion[p[0]]=e.value;
  else actuacion[p[0]][Number(p[1])][p[2]]=e.value;
 });
}
function entrada(titulo,clave,valor=""){
 const l=document.createElement("label");
 l.style.cssText="display:block;margin:12px 0";
 l.textContent=titulo;
 const i=document.createElement("input");
 i.value=valor;
 i.dataset.dato=clave;
 i.style.cssText="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px";
 l.appendChild(i);
 return l;
}
function boton(texto,accion){
 const b=document.createElement("button");
 b.textContent=texto;
 b.onclick=accion;
 return b;
}
function dibujar(){
 const m=document.querySelector("main");
 m.replaceChildren();
 const h=document.createElement("h2");
 h.textContent="Actuación";
 m.appendChild(h);
 for(const c of ["referencia","fecha","hora","lugar","agentes"])
  m.appendChild(entrada(c.toUpperCase(),c,actuacion[c]));
 for(const tipo of ["personas","vehiculos","objetos"]){
  actuacion[tipo].forEach((item,n)=>{
   const s=document.createElement("section");
   s.style.cssText="padding:15px;margin:15px 0;background:white;border-radius:12px";
   const t=document.createElement("h3");
   t.textContent=tipo.toUpperCase()+" "+(n+1);
   s.appendChild(t);
   campos[tipo].forEach((nombre,k)=>{
    s.appendChild(entrada(nombre,tipo+":"+n+":"+k,item[k]||""));
   });
   m.appendChild(s);
  });
 }
 for(const [tipo,nombre] of [["personas","persona"],["vehiculos","vehículo"],["objetos","objeto"]])
  m.appendChild(boton("+ Añadir "+nombre,()=>{
   leer();
   actuacion[tipo].push({});
   dibujar();
  }));
 m.appendChild(boton("Ver resumen",resumen));
 const aviso=document.createElement("p");
 aviso.textContent="Beta de prueba: no se guardan los datos. No introduzcas datos reales.";
 m.appendChild(aviso);
}
function resumen(){
 leer();
 const anterior=document.getElementById("resumen");
 if(anterior)anterior.remove();
 const p=document.createElement("pre");
 p.id="resumen";
 p.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:12px";
 p.textContent=JSON.stringify(actuacion,null,2);
 document.querySelector("main").appendChild(p);
}
window.mostrar=function(nombre){
 if(nombre==="Nueva actuación")nuevaActuacion();
 else alert(nombre+": módulo pendiente.");
};
