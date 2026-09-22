// js/verMantenimiento.js
$(document).ready(function () {

  async function cargarMantenimiento(fechaInicio, fechaFin) {
    let url = "http://localhost:3001/api/nodos?estatus=Mantenimiento&limit=1000";
    if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
    if (fechaFin) url += `&fechaFin=${fechaFin}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const tbody = $("#tabla-mantenimiento tbody");
      tbody.empty();

      const hoy = new Date();

      data.data.forEach(nodo => {
        const fechaIngreso = new Date(nodo.fecha_actualizacion);
        const diffTime = Math.abs(hoy - fechaIngreso);
        const diasMantenimiento = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        tbody.append(`
          <tr>
            <td>${nodo.serie}</td>
            <td>${nodo.tecnologia}</td>
            <td>${nodo.fecha_actualizacion}</td>
            <td>${diasMantenimiento}</td>
          </tr>
        `);
      });
    } catch (err) {
      console.error("Error cargando mantenimiento:", err);
      alert("Error al cargar nodos en mantenimiento.");
    }
  }

  // Filtrar por fechas
  $("#btn-filtrar-mantenimiento").on("click", function () {
    const inicio = $("#fecha-inicio").val();
    const fin = $("#fecha-fin").val();
    cargarMantenimiento(inicio, fin);
  });

  // Carga inicial sin filtros
  cargarMantenimiento();
});
