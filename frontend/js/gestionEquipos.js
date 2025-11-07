// js/gestionEquipos.js
$(document).ready(function () {
  const API_BASE = "http://localhost:3001/api/telefonos";
  let equipoSeleccionadoId = null;

  // Mostrar la vista de "Gestión de Equipos"
  $('[data-section="gestion-equipos"]').on("click", function () {
    $("#content-area").children().hide();
    $("#vista-gestion-equipos").show();
  });

  // Cargar la lista de equipos al filtrar por tipo
  $('#btnFiltrarEquipos').on("click", function () {
    const tipoEquipo = $('#tipoEquipo').val();

    if (tipoEquipo) {
      cargarEquipos(tipoEquipo);
    } else {
      alert("Por favor selecciona un tipo de equipo.");
    }
  });

  // Cargar equipos por tipo
  function cargarEquipos(tipo) {
    $("#equiposTable").html("<p>⏳ Cargando equipos...</p>");

    fetch(`${API_BASE}/${tipo}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          $("#equiposTable").html(`<p style="color:red;">❌ ${data.error}</p>`);
          return;
        }
        renderTablaEquipos(data.equipos);
      })
      .catch(err => {
        $("#equiposTable").html(`<p style="color:red;">Error al cargar los equipos: ${err}</p>`);
      });
  }

  // Renderizar tabla
  function renderTablaEquipos(equipos) {
    let tablaHTML = `
      <table border="1" cellpadding="6" style="border-collapse:collapse; width:100%;">
        <thead>
          <tr>
            <th style="background:#e6f0ff;">Serie</th>
            <th style="background:#fff1d6;">Estatus</th>
            <th style="background:#e6f0ff;">Asignado a</th>
            <th style="background:#fff1d6;">Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    equipos.forEach(equipo => {
      tablaHTML += `
        <tr>
          <td>${equipo.serie}</td>
          <td>${equipo.estatus}</td>
          <td>${equipo.asignado_a || "No asignado"}</td>
          <td>
            <button class="btnVerDetalles" data-id="${equipo.id}">Ver detalles</button>
          </td>
        </tr>
      `;
    });

    tablaHTML += "</tbody></table>";
    $("#equiposTable").html(tablaHTML);
  }

  // Mostrar detalles del equipo
  $(document).on("click", ".btnVerDetalles", function () {
    const equipoId = $(this).data("id");
    mostrarDetallesEquipo(equipoId);
  });

  function mostrarDetallesEquipo(equipoId) {
    equipoSeleccionadoId = equipoId;
    $("#equiposTable").hide();
    $("#detallesEquipo").show();

    fetch(`${API_BASE}/detalles/${equipoId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          $("#detallesEquipo").html(`<p style="color:red;">❌ ${data.error}</p>`);
          return;
        }

        const equipo = data.equipo;
        $('#detallesNombre').text(`Serie: ${equipo.serie}`);
        $('#detallesEstatus').text(`Estatus: ${equipo.estatus}`);
        $('#detallesAsignadoA').text(`Asignado a: ${equipo.asignado_a || "No asignado"}`);

        let comentariosHTML = equipo.comentarios.map(c => `<li>${c}</li>`).join('');
        $('#comentariosList').html(comentariosHTML);
      })
      .catch(err => {
        $("#detallesEquipo").html(`<p style="color:red;">Error al cargar los detalles: ${err}</p>`);
      });
  }

  // Agregar comentario
  $('#btnAgregarComentario').on("click", function () {
    const nuevoComentario = $('#nuevoComentario').val();

    if (nuevoComentario) {
      alert(`Comentario agregado: ${nuevoComentario}`);
      $('#nuevoComentario').val('');
      mostrarDetallesEquipo(equipoSeleccionadoId);
    } else {
      alert("Por favor ingresa un comentario.");
    }
  });
});
