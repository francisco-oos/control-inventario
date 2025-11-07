// vistas/AgregarEquipo.js
// --------------------------------------------------
// Vista para agregar registros manualmente a la base de datos
// (Teléfonos, Chips, Radios o Nodos)
// --------------------------------------------------

function AgregarEquipo() {
  const contenedor = document.createElement("div");
  contenedor.classList.add("p-4");

  // Título
  const titulo = document.createElement("h2");
  titulo.textContent = "Agregar Equipo Manualmente";
  titulo.classList.add("text-xl", "mb-4");
  contenedor.appendChild(titulo);

  // Selector de tipo de equipo
  const selector = document.createElement("select");
  selector.classList.add("mb-3", "p-2");
  selector.innerHTML = `
    <option value="">-- Selecciona tipo --</option>
    <option value="telefono">Teléfono</option>
    <option value="chip">Chip</option>
    <option value="radio">Radio</option>
    <option value="nodo">Nodo</option>
  `;
  contenedor.appendChild(selector);

  // Formulario dinámico
  const form = document.createElement("form");
  form.classList.add("flex", "flex-col", "gap-2");
  contenedor.appendChild(form);

  // Mensaje de resultado
  const mensaje = document.createElement("div");
  mensaje.classList.add("mt-3");
  contenedor.appendChild(mensaje);

  // Generar campos según tipo
  selector.addEventListener("change", () => {
    form.innerHTML = ""; // limpiar
    const tipo = selector.value;
    if (!tipo) return;

    let campos = [];

    if (tipo === "telefono") {
      campos = [
        { label: "IMEI", name: "imei" },
        { label: "Número de Serie", name: "numero_serie" },
        { label: "Marca", name: "marca" },
        { label: "Estatus", name: "estatus" },
      ];
    } else if (tipo === "chip") {
      campos = [
        { label: "Número", name: "numero" },
        { label: "ICC", name: "icc" },
        { label: "Compañía", name: "compania" },
        { label: "Estatus", name: "estatus" },
      ];
    } else if (tipo === "radio") {
      campos = [
        { label: "Serie", name: "serie" },
        { label: "Modelo", name: "modelo" },
        { label: "Marca", name: "marca" },
        { label: "Estatus", name: "estatus" },
      ];
    } else if (tipo === "nodo") {
      campos = [
        { label: "ID Nodo", name: "id_nodo" },
        { label: "Ubicación", name: "ubicacion" },
        { label: "Responsable", name: "responsable" },
        { label: "Estatus", name: "estatus" },
      ];
    }

    campos.forEach(({ label, name }) => {
      const input = document.createElement("input");
      input.placeholder = label;
      input.name = name;
      input.classList.add("border", "p-2", "rounded");
      form.appendChild(input);
    });

    const btn = document.createElement("button");
    btn.textContent = "Agregar";
    btn.type = "submit";
    btn.classList.add("bg-blue-600", "text-white", "p-2", "rounded", "mt-2");
    form.appendChild(btn);
  });

  // Enviar datos
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tipo = selector.value;
    if (!tipo) return alert("Selecciona un tipo");

    const datos = Object.fromEntries(new FormData(form));

    let endpoint = "";
    switch (tipo) {
      case "telefono": endpoint = "/api/telefonos/agregar"; break;
      case "chip": endpoint = "/api/chips/agregar"; break;
      case "radio": endpoint = "/api/radios/agregar"; break;
      case "nodo": endpoint = "/api/nodos/agregar"; break;
      default: return;
    }

    try {
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const data = await res.json();
      mensaje.textContent = data.mensaje || data.error || "Error desconocido";
      mensaje.className = data.error ? "text-red-600" : "text-green-600";

      // ✅ Limpiar formulario si todo salió bien
      if (!data.error) form.reset();
    } catch (err) {
      mensaje.textContent = "Error de conexión con el servidor.";
      mensaje.className = "text-red-600";
    }
  });

  return contenedor;
}
