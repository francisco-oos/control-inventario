// ===============================
// nodosHandler.js
// Manejo de Nodos (filtros, paginación, actualización)
// ===============================
const API_NODOS = "http://localhost:3001/api/nodos";

let currentPage = 1;
const limit = 100;
let currentSerie = "";
let currentTecnologia = "";

async function cargarNodos() {
  try {
    const url = `${API_NODOS}?page=${currentPage}&limit=${limit}&serie=${encodeURIComponent(currentSerie)}&tecnologia=${encodeURIComponent(currentTecnologia)}`;
    const res = await fetch(url);
    const result = await res.json();
    const nodos = result.data;
    const container = document.getElementById("tabla-nodos");

    container.innerHTML = `
      <div style="margin-bottom:10px;">
        <input id="filtro-serie" placeholder="Filtrar por serie" style="padding:5px;">
        <input id="filtro-tecnologia" placeholder="Filtrar por tecnología" style="padding:5px;">
        <button id="btn-filtrar">Filtrar</button>
        <button id="btn-anterior">Anterior</button>
        <button id="btn-siguiente">Siguiente</button>
        <span id="pagina-actual"></span>
      </div>
      <table border="1" width="100%" cellpadding="5" style="background:white;">
        <thead>
          <tr>
            <th>ID</th><th>Serie</th><th>Tecnología</th>
            <th>Estatus</th><th>Fecha actualización</th><th>Actualizar</th>
          </tr>
        </thead>
        <tbody id="tbody-nodos">
          ${nodos.map(n => {
            const clase = n.estatus === "Operativo" ? "background:#d1ffd1;" : "background:#ffd1d1;";
            const opciones = ["Operativo","Dañado","Mantenimiento","Para garantía","En garantía"]
              .map(e => `<option ${e===n.estatus?'selected':''}>${e}</option>`).join('');
            return `
              <tr style="${clase}">
                <td>${n.id}</td>
                <td>${n.serie}</td>
                <td>${n.tecnologia}</td>
                <td class="estatus-celda">${n.estatus}</td>
                <td>${n.fecha_actualizacion}</td>
                <td><select data-id="${n.id}">${opciones}</select></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    document.getElementById("pagina-actual").textContent =
      `Página ${currentPage} de ${Math.ceil(result.total / limit)}`;

    document.getElementById("btn-filtrar").onclick = aplicarFiltros;
    document.getElementById("btn-anterior").onclick = paginaAnterior;
    document.getElementById("btn-siguiente").onclick = paginaSiguiente;

    document.querySelectorAll('#tbody-nodos select').forEach(sel => {
      sel.addEventListener('change', async () => {
        await actualizarEstatus(sel.dataset.id, sel.value, sel.closest('tr'));
      });
    });

  } catch (err) {
    console.error("Error al cargar nodos:", err);
  }
}

async function actualizarEstatus(id, nuevoEstatus, fila) {
  try {
    const res = await fetch(`${API_NODOS}/${id}/estatus`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatus: nuevoEstatus }),
    });
    const data = await res.json();

    if (res.ok) {
      fila.querySelector(".estatus-celda").textContent = data.estatus;
      fila.cells[4].textContent = data.fecha_actualizacion;
      fila.style.background = data.estatus === "Operativo" ? "#d1ffd1" : "#ffd1d1";
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error al conectar con el servidor");
  }
}

function paginaSiguiente() { currentPage++; cargarNodos(); }
function paginaAnterior() { if (currentPage > 1) { currentPage--; cargarNodos(); } }
function aplicarFiltros() {
  currentSerie = document.getElementById("filtro-serie").value.trim();
  currentTecnologia = document.getElementById("filtro-tecnologia").value.trim();
  currentPage = 1;
  cargarNodos();
}
