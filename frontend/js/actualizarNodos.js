// js/actualizarNodos.js
$(document).ready(function () {
  // Vista previa del CSV antes de enviar
  $("#form-csv").on("submit", function (e) {
    e.preventDefault();
    const file = $("#csvFile")[0].files[0];
    if (!file) return alert("Selecciona un archivo CSV.");

    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      const rows = text.split("\n").map(r => r.trim()).filter(r => r);
      const headers = rows[0].split(",");

      $("#tabla-preview thead").html(
        "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>"
      );

      const body = rows.slice(1).map(row => {
        const cols = row.split(",");
        return "<tr>" + cols.map(c => `<td>${c}</td>`).join("") + "</tr>";
      }).join("");

      $("#tabla-preview tbody").html(body);
      $("#csv-preview").show();
    };
    reader.readAsText(file);
  });

  // Enviar el CSV al backend
  $("#btn-enviar-csv").on("click", async function () {
    const file = $("#csvFile")[0].files[0];
    if (!file) return alert("Selecciona un archivo CSV antes de enviar.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3001/api/mantenimiento/cargar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      alert(data.message || "Archivo procesado correctamente.");
    } catch (err) {
      console.error("Error al enviar CSV:", err);
      alert("Error al enviar el archivo.");
    }
  });
});
