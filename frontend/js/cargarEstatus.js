// cargarEstatus.js
$(document).ready(function () {
  let archivoSeleccionado = null;
  let columnasDetectadas = [];
  let asignacionesCampos = {}; // guardará el mapeo {campoSistema: columnaCSV}

  // --------------------------------------------------------
  // Mapa de estatus por tipo de equipo
  // --------------------------------------------------------
  const estatusPorTipo = {
    nodos: [
      "Operativo",
      "Dañado",
      "En mantenimiento",
      "Campo",
      "En garantía",
      "Disponible",
      "Para baja"
    ],
    telefonos_celulares: [
      "Activo",
      "En reparación",
      "Extraviado",
      "Asignado",
      "Disponible"
    ],
    chips_telefono: [
      "Activo",
      "Suspendido",
      "Sin saldo",
      "Extraviado",
      "En uso"
    ],
    radios_handy: [
      "Operativo",
      "En mantenimiento",
      "Extraviado",
      "Asignado",
      "Para revisión"
    ]
  };

  // --------------------------------------------------------
  // Render de vista principal
  // --------------------------------------------------------
  $('[data-section="estatus"]').on("click", function () {
    $("#vista-estatus").html(`
      <h2>Actualizar Estatus de Equipos</h2>

      <form id="form-csv" enctype="multipart/form-data">
        <label for="tipoSelect">Selecciona el tipo de equipo:</label><br>
        <select id="tipoSelect" name="tipo" required>
          <option value="">-- Selecciona un tipo de equipo --</option>
          <option value="nodos">Nodos</option>
          <option value="telefonos_celulares">Teléfonos Celulares</option>
          <option value="chips_telefono">Chips Teléfono</option>
          <option value="radios_handy">Radios Handy</option>
        </select><br><br>

        <label for="estatusSelect">Selecciona el estatus a aplicar:</label><br>
        <select id="estatusSelect" name="estatus" required>
          <option value="">-- Selecciona un estatus --</option>
        </select><br><br>

        <label for="csvFile">Seleccionar archivo CSV:</label><br>
        <input type="file" id="csvFile" name="file" accept=".csv" required><br><br>

        <button type="button" id="btnPrevisualizar">Previsualizar archivo</button>
        <button type="submit">Subir y actualizar</button>
      </form>

      <div id="preview" style="margin-top:30px;"></div>
      <div id="resultado-carga" style="margin-top:30px;"></div>
    `);
  });

  // --------------------------------------------------------
  // Cambiar dinámicamente los estatus según el tipo elegido
  // --------------------------------------------------------
  $(document).on("change", "#tipoSelect", function () {
    const tipo = $(this).val();
    const $estatus = $("#estatusSelect");
    $estatus.empty();
    $estatus.append(`<option value="">-- Selecciona un estatus --</option>`);

    if (estatusPorTipo[tipo]) {
      estatusPorTipo[tipo].forEach(e => {
        $estatus.append(`<option value="${e}">${e}</option>`);
      });
    }
  });

  // --------------------------------------------------------
  // Guardar el archivo seleccionado
  // --------------------------------------------------------
  $(document).on("change", "#csvFile", function (e) {
    archivoSeleccionado = e.target.files[0];
    $("#preview").empty();
    $("#resultado-carga").empty();
  });

  // --------------------------------------------------------
  // Previsualizar CSV con asignación dinámica de columnas
  // --------------------------------------------------------
  $(document).on("click", "#btnPrevisualizar", function () {
    if (!archivoSeleccionado) {
      alert("Selecciona un archivo CSV primero.");
      return;
    }

    const tipo = $("#tipoSelect").val();
    if (!tipo) {
      alert("Selecciona un tipo de equipo antes de previsualizar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const texto = e.target.result.trim();
      const filas = texto.split(/\r?\n/).map(f => f.split(","));
      const headers = filas[0].map(h => h.trim());
      columnasDetectadas = headers;

      // Mapa de campos esperados por tipo
      const camposPorTipo = {
        nodos: ["serie"],
        telefonos_celulares: ["imei", "numero_serie", "numero_economico"],
        chips_telefono: ["numero_telefono"],
        radios_handy: ["numero_serie"]
      };

      const camposEsperados = camposPorTipo[tipo] || [];
      const opciones = headers.map(h => `<option value="${h}">${h}</option>`).join("");

      // Construir formulario dinámico para asignar campos
      let asignacionesHTML = "";
      camposEsperados.forEach(campo => {
        asignacionesHTML += `
          <label><strong>${campo}:</strong></label><br>
          <select class="mapCampo" data-campo="${campo}">
            <option value="">-- Selecciona columna --</option>
            ${opciones}
          </select><br><br>
        `;
      });

      let html = `
        <h3>📋 Vista previa del archivo</h3>
        <p>Asigna las columnas del CSV a los campos del sistema (${tipo}).</p>
        <div style="margin-top:15px;">${asignacionesHTML}</div>
        <div id="miniPreview" style="margin-top:25px;"></div>
      `;

      $("#preview").html(html);

      // Detección automática de campos
      $(".mapCampo").each(function () {
        const campo = $(this).data("campo");
        const auto = headers.find(h => h.toLowerCase().includes(campo.toLowerCase()));
        if (auto) $(this).val(auto);
        asignacionesCampos[campo] = auto || "";
      });

      // Actualizar asignaciones al cambiar
      $(".mapCampo").on("change", function () {
        const campo = $(this).data("campo");
        asignacionesCampos[campo] = $(this).val();
      });

      renderTablaCompleta(filas);
    };

    reader.readAsText(archivoSeleccionado);
  });

  // --------------------------------------------------------
  // Render completo de tabla de previsualización
  // --------------------------------------------------------
  function renderTablaCompleta(filas) {
    const headers = filas[0].map(h => h.trim());
    let tabla = `
      <table border="1" cellpadding="6" style="border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
    `;
    filas.slice(1, 6).forEach(fila => {
      tabla += "<tr>" + fila.map(v => `<td>${v}</td>`).join("") + "</tr>";
    });
    tabla += "</tbody></table>";
    $("#miniPreview").html(tabla);
  }

// Envío al backend (Node.js / Express)
$(document).on("submit", "#form-csv", function (e) {
  e.preventDefault();

  const tipo = $("#tipoSelect").val();
  const estatus = $("#estatusSelect").val();

  if (!tipo) return alert("Selecciona un tipo de equipo.");
  if (!estatus) return alert("Selecciona un estatus para aplicar.");
  if (!archivoSeleccionado) return alert("Selecciona un archivo CSV primero.");

  const asignacionesValidas = Object.values(asignacionesCampos).some(v => v !== "");
  if (!asignacionesValidas) {
    alert("Debes asignar al menos una columna del CSV.");
    return;
  }

  const formData = new FormData();
  formData.append("file", archivoSeleccionado);
  formData.append("tipo", tipo);
  formData.append("estatus", estatus);
  formData.append("asignaciones", JSON.stringify(asignacionesCampos));

  $("#resultado-carga").html("<p>⏳ Subiendo y procesando archivo...</p>");

  fetch(`${API_BASE}/estatus/actualizar`, {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        $("#resultado-carga").html(`<p style="color:red;">❌ ${data.error}</p>`);
        return;
      }

      const t = data.totales || {};
      const d = data.detalles || {};

      $("#resultado-carga").html(`
        <h3>✅ Resultado del procesamiento</h3>
        <p><strong>Estatus aplicado:</strong> ${estatus}</p>
        <p><strong>Series leídas:</strong> ${t.leidos ?? 0}</p>
        <p><strong>Actualizados:</strong> ${t.actualizados ?? 0}</p>
        <p><strong>Ya tenían el estatus:</strong> ${t.yaConEstatus ?? 0}</p>
        <p><strong>No encontrados:</strong> ${t.noEncontrados ?? 0}</p>
        ${
          d.noEncontrados?.length
            ? `<details><summary>Ver series no encontradas</summary><pre>${d.noEncontrados.join("\n")}</pre></details>`
            : ""
        }
      `);

      // 🔧 Mantener el archivo en memoria y limpiar input sin perder referencia
      const oldFile = archivoSeleccionado;
      $("#csvFile").val(""); // Limpia visualmente el input
      archivoSeleccionado = oldFile; // Lo conserva para reenviar si se requiere
    })
    .catch(err => {
      $("#resultado-carga").html(`<p style="color:red;">Error al conectar con el servidor: ${err}</p>`);
    });
});
});
