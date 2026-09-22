// ===============================
// dataHandler.js
// Manejo de tecnologías
// ===============================
const API_TECNOLOGIAS = "http://localhost:3001/api/tecnologias";

async function cargarTecnologias() {
  try {
    const res = await fetch(API_TECNOLOGIAS);
    const tecnologias = await res.json();
    const container = document.getElementById("tabla-tecnologias");

    container.innerHTML = `
      <table border="1" width="100%" cellpadding="5" style="background:white;">
        <thead><tr><th>ID</th><th>Nombre</th></tr></thead>
        <tbody>${tecnologias.map(t => `
          <tr><td>${t.id}</td><td>${t.nombre}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("Error al cargar tecnologías:", err);
  }
}
