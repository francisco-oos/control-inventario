// cargarEstatus.js
// ----------------------------------------------------------
// Permite subir un CSV para actualizar el estatus de los nodos.
// Interfaz limpia, con vista previa simple y selección clara de columnas.
// ----------------------------------------------------------

$(document).ready(function () {
  let archivoSeleccionado = null;
  let columnasDetectadas = [];

  // --------------------------------------------------------
  // Render de vista principal
  // --------------------------------------------------------
  $('[data-section="estatus"]').on("click", function () {
    $("#vista-estatus").html(`
      <h2>Actualizar Estatus de Nodos</h2>

      <form id="form-csv" enctype="multipart/form-data">
        <label for="estatusSelect">Selecciona estatus a aplicar:</label><br>
        <select id="estatusSelect" name="estatus" required>
          <option value="">-- Selecciona un estatus --</option>
          <option value="Operativo">Operativo</option>
          <option value="Dañado">Dañado</option>
          <option value="Mantenimiento">Mantenimiento</option>
          <option value="Para garantía">Para garantía</option>
          <option value="En garantía">En garantía</option>
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
  // Guardar el archivo seleccionado
  // --------------------------------------------------------
  $(document).on("change", "#csvFile", function (e) {
    archivoSeleccionado = e.target.files[0];
    $("#preview").empty();
    $("#resultado-carga").empty();
  });

  // --------------------------------------------------------
  // Previsualizar CSV
  // --------------------------------------------------------
  $(document).on("click", "#btnPrevisualizar", function () {
    if (!archivoSeleccionado) {
      alert("Selecciona un archivo CSV primero.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const texto = e.target.result.trim();
      const filas = texto.split(/\r?\n/).map(f => f.split(","));
      const headers = filas[0].map(h => h.trim());
      columnasDetectadas = headers;

      // Detección automática
      const idxSerie = headers.findIndex(h => /serie/i.test(h));
      const idxFecha = headers.findIndex(h => /fecha/i.test(h));

      // Dropdowns de selección
      const opciones = headers.map(h => `<option value="${h}">${h}</option>`).join("");

      let html = `
        <h3>📋 Vista previa del archivo</h3>
        <p>Selecciona qué columna corresponde a los números de serie y (opcionalmente) cuál contiene la fecha.</p>
        <div style="margin-top:15px;">
          <label><strong>Columna de Serie:</strong></label><br>
          <select id="columnaSerie" required>
            <option value="">-- Selecciona columna --</option>
            ${opciones}
          </select><br><br>

          <label><strong>Columna de Fecha (opcional):</strong></label><br>
          <select id="columnaFecha">
            <option value="">-- Usar fecha actual --</option>
            ${opciones}
          </select>
        </div>

        <div id="miniPreview" style="margin-top:25px;"></div>
      `;

      $("#preview").html(html);

      // Asignar valores detectados automáticamente
      if (idxSerie >= 0) $("#columnaSerie").val(headers[idxSerie]);
      if (idxFecha >= 0) $("#columnaFecha").val(headers[idxFecha]);

      // Mostrar vista previa inicial de columnas seleccionadas
      renderMiniPreview(filas, $("#columnaSerie").val(), $("#columnaFecha").val());

      // Actualizar mini vista al cambiar selects
      $("#columnaSerie, #columnaFecha").on("change", function () {
        renderMiniPreview(filas, $("#columnaSerie").val(), $("#columnaFecha").val());
      });
    };

    reader.readAsText(archivoSeleccionado);
  });

// --------------------------------------------------------
// Render simple de vista previa mejorada
// --------------------------------------------------------
function renderMiniPreview(filas, colSerie, colFecha) {
  if (!colSerie) {
    $("#miniPreview").html("<p style='color:gray;'>Selecciona una columna de serie para ver la vista previa.</p>");
    return;
  }

  const headers = filas[0].map(h => h.trim());
  const normalizedHeaders = headers.map(h => h.toLowerCase());

  const idxSerie = normalizedHeaders.indexOf(colSerie.trim().toLowerCase());
  const idxFecha = colFecha ? normalizedHeaders.indexOf(colFecha.trim().toLowerCase()) : -1;

  if (idxSerie < 0) {
    $("#miniPreview").html("<p style='color:red;'>❌ La columna de serie seleccionada no existe.</p>");
    return;
  }

  let tabla = `
    <table border="1" cellpadding="6" style="border-collapse:collapse; margin-top:10px;">
      <thead>
        <tr>
          <th style="background:#e6f0ff;">Serie</th>
          <th style="background:#fff1d6;">Fecha aplicada</th>
        </tr>
      </thead>
      <tbody>
  `;

  filas.slice(1, 6).forEach(fila => {
    const serie = (fila[idxSerie] || "").trim();
    let fecha = "";

    if (idxFecha >= 0 && (fila[idxFecha] || "").trim() !== "") {
      fecha = fila[idxFecha].trim();
    } else {
      // Usar fecha actual si no hay valor en CSV o no se seleccionó columna
      const hoy = new Date();
      fecha = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
    }

    tabla += "<tr>";
    tabla += `<td>${serie}</td>`;
    tabla += `<td>${fecha}</td>`;
    tabla += "</tr>";
  });

  tabla += "</tbody></table>";

  $("#miniPreview").html(tabla);
}


  // --------------------------------------------------------
  // Envío al backend
  // --------------------------------------------------------
  $(document).on("submit", "#form-csv", function (e) {
    e.preventDefault();

    const estatus = $("#estatusSelect").val();
    const colSerie = $("#columnaSerie").val();
    const colFecha = $("#columnaFecha").val() || "";

    if (!estatus) return alert("Selecciona un estatus para aplicar.");
    if (!archivoSeleccionado) return alert("Selecciona un archivo CSV primero.");
    if (!colSerie) return alert("Selecciona la columna de números de serie.");

    const formData = new FormData();
    formData.append("file", archivoSeleccionado);
    formData.append("columna", colSerie);
    formData.append("columnaFecha", colFecha);
    formData.append("estatus", estatus);

    $("#resultado-carga").html("<p>⏳ Subiendo y procesando archivo...</p>");

    fetch("http://localhost:3001/api/estatus/actualizar", {
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
      })
      .catch(err => {
        $("#resultado-carga").html(`<p style="color:red;">Error al conectar con el servidor: ${err}</p>`);
      });
  });
});
