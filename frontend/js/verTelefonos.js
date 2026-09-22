// js/verTelefonos.js
// ------------------------------------------------------
// Vista: Ver Teléfonos
// ------------------------------------------------------

$(document).ready(function() {
  const tabla = $("#tablaTelefonos tbody");
  const buscarInput = $("#buscarTelefono");
  const filtroEstatus = $("#filtroEstatusTelefono");
  const btnBuscar = $("#btnBuscarTelefonos");

  // 🔹 Función para cargar los teléfonos desde el backend
  async function cargarTelefonos() {
    tabla.html(`<tr><td colspan="7">Cargando...</td></tr>`);

    const params = new URLSearchParams();
    if (filtroEstatus.val()) params.append("estatus", filtroEstatus.val());
    if (buscarInput.val()) params.append("buscar", buscarInput.val());

    try {
      const res = await fetch(`http://localhost:3001/api/telefonos?${params.toString()}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        tabla.html(`<tr><td colspan="7">No hay registros</td></tr>`);
        return;
      }

      tabla.html(
        data.map(t => `
          <tr>
            <td>${t.marca || "-"}</td>
            <td>${t.imei || "-"}</td>
            <td>${t.numero_serie || "-"}</td>
            <td>${t.numero_economico || "-"}</td>
            <td>${t.estatus || "-"}</td>
            <td>${(t.fecha_actualizacion || "").split("T")[0] || "-"}</td>
            <td>${t.comentario || "-"}</td>
          </tr>
        `).join("")
      );
    } catch (error) {
      tabla.html(`<tr><td colspan="7">Error: ${error.message}</td></tr>`);
    }
  }

  // 🔹 Eventos
  btnBuscar.on("click", cargarTelefonos);

  // Cuando se muestre la vista
  $(document).on("mostrarVista", function(event, vistaId) {
    if (vistaId === "vista-ver-telefonos") {
      cargarTelefonos();
    }
  });
});
