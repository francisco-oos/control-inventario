// app_nodos.js
// --------------------------------------------------
// Script para manejar la visualización y actualización
// de nodos desde la API.
// - Trae nodos con paginación y filtro por serie o tecnología.
// - Permite actualizar estatus manualmente.
// - Actualiza fecha de última modificación automáticamente.
// - Optimizado para grandes cantidades de nodos (119k+)
// --------------------------------------------------

const API_URL = "http://localhost:3001/api/nodos";

// Lista de estatus válidos según la base principal
const ESTATUS_VALIDOS = [
  "Operativo",
  "Dañado",
  "Mantenimiento",
  "Para garantía",
  "En garantía"
];

// Estado actual de la paginación y filtros
let currentPage = 1;
const limit = 100;
let currentSerie = "";
let currentTecnologia = "";

// --------------------------------------------------
// Función: cargarNodos
// Trae los nodos desde la API y los renderiza en la tabla
// --------------------------------------------------
async function cargarNodos() {
  try {
    const url = `${API_URL}?page=${currentPage}&limit=${limit}&serie=${encodeURIComponent(currentSerie)}&tecnologia=${encodeURIComponent(currentTecnologia)}`;
    const res = await fetch(url);
    const result = await res.json();

    const nodos = result.data;
    const tbody = document.getElementById("tbody-nodos");
    tbody.innerHTML = "";

    nodos.forEach(n => {
      const tr = document.createElement("tr");

      // Definir clase de color según estatus
      const clase = n.estatus === "Operativo" ? "estatus-operativo" : "estatus-fuera";

      // Crear select para actualizar estatus
      const select = document.createElement("select");
      ESTATUS_VALIDOS.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e;
        opt.textContent = e;
        if (e === n.estatus) opt.selected = true;
        select.appendChild(opt);
      });

      // Evento al cambiar estatus
      select.addEventListener("change", async () => {
        await actualizarEstatus(n.id, select.value, tr);
      });

      // Construir fila de tabla
      tr.innerHTML = `
        <td>${n.id}</td>
        <td>${n.serie}</td>
        <td>${n.tecnologia}</td>
        <td class="${clase} estatus-celda">${n.estatus}</td>
        <td>${n.fecha_actualizacion}</td>
      `;

      // Columna con select
      const tdSelect = document.createElement("td");
      tdSelect.appendChild(select);
      tr.appendChild(tdSelect);

      tbody.appendChild(tr);
    });

    // Actualizar controles de paginación
    document.getElementById("pagina-actual").textContent = `Página ${currentPage} de ${Math.ceil(result.total / limit)}`;
  } catch (err) {
    console.error("Error al cargar nodos:", err);
  }
}

// --------------------------------------------------
// Función: actualizarEstatus
// Envía la solicitud para actualizar el estatus de un nodo
// y actualiza la celda de estatus y la fecha en tiempo real
// --------------------------------------------------
async function actualizarEstatus(id, nuevoEstatus, fila) {
  if (!id) {
    alert("❌ Nodo sin ID válido.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${id}/estatus`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatus: nuevoEstatus }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Respuesta no JSON:", text);
      alert("❌ Error: respuesta no es JSON. Revisa la consola.");
      return;
    }

    if (res.ok) {
      const tdEstatus = fila.querySelector(".estatus-celda");
      tdEstatus.textContent = data.estatus;
      tdEstatus.className = data.estatus === "Operativo"
        ? "estatus-celda estatus-operativo"
        : "estatus-celda estatus-fuera";
      fila.cells[4].textContent = data.fecha_actualizacion;
    } else {
      alert(`❌ Error: ${data.error}`);
    }

  } catch (err) {
    console.error(err);
    alert("❌ Error al conectar con el servidor");
  }
}



// --------------------------------------------------
// Funciones de paginación
// --------------------------------------------------
function paginaSiguiente() {
  currentPage++;
  cargarNodos();
}

function paginaAnterior() {
  if (currentPage > 1) {
    currentPage--;
    cargarNodos();
  }
}

// --------------------------------------------------
// Función de filtro por serie o tecnología
// --------------------------------------------------
function aplicarFiltros() {
  currentSerie = document.getElementById("filtro-serie").value.trim();
  currentTecnologia = document.getElementById("filtro-tecnologia").value.trim();
  currentPage = 1; // Reiniciar a la primera página
  cargarNodos();
}

// --------------------------------------------------
// Inicialización al cargar el DOM
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  cargarNodos();

  document.getElementById("btn-anterior").addEventListener("click", paginaAnterior);
  document.getElementById("btn-siguiente").addEventListener("click", paginaSiguiente);
  document.getElementById("btn-filtrar").addEventListener("click", aplicarFiltros);
});
