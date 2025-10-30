// app.js
// --------------------------------------------------
// Carga y muestra las tecnologías desde la API
// --------------------------------------------------

const API_URL = "http://localhost:3001/api/tecnologias";

async function cargarTecnologias() {
  try {
    const res = await fetch(API_URL);
    const tecnologias = await res.json();

    const tbody = document.getElementById("tbody-tecnologias");
    tbody.innerHTML = "";

    tecnologias.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.id}</td>
        <td>${t.nombre}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al cargar tecnologías:", err);
  }
}

document.addEventListener("DOMContentLoaded", cargarTecnologias);
