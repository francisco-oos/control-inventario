// server.js
// --------------------------------------------------
// Servidor principal Express para manejar la API REST.
// --------------------------------------------------
import express from "express";
import cors from "cors";
import db from "./database.js";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
const upload = multer({ dest: "uploads/" });
const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());
// Función para agregar un comentario con fecha
const agregarComentario = (tipo, id, comentario, db) => {
  const fecha = new Date().toLocaleDateString();  // Fecha actual en formato "dd/mm/yyyy"
  const query = `UPDATE ${tipo} 
                 SET comentario = COALESCE(comentario, '') || '\n' || ? || ' ' || ? 
                 WHERE id = ?`;

  db.run(query, [fecha, comentario, id], function(err) {
    if (err) {
      console.error("Error al agregar comentario:", err.message);
    } else {
      console.log(`Comentario agregado al ${tipo} con ID ${id}`);
    }
  });
};
// --------------------------------------------------
// Ruta raíz para confirmar que el servidor está en funcionamiento
// --------------------------------------------------
app.get("/", (req, res) => {
  res.send("Servidor en funcionamiento. Accede a /api/nodos para los nodos y /api/tecnologias para las tecnologías.");
});

// --------------------------------------------------
// ENDPOINT: Obtener todas las tecnologías
// --------------------------------------------------
app.get("/api/tecnologias", (req, res) => {
  db.all("SELECT * FROM tecnologias", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// --------------------------------------------------
// ENDPOINT: Crear una nueva tecnología
// --------------------------------------------------
app.post("/api/tecnologias", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta el nombre" });

  db.run("INSERT INTO tecnologias (nombre) VALUES (?)", [nombre], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nombre });
  });
});

// --------------------------------------------------
// ENDPOINT: Obtener todos los nodos
// --------------------------------------------------
/*app.get("/api/nodos", (req, res) => {
  const query = `
    SELECT n.id, n.serie, n.estatus, n.fecha_actualizacion, t.nombre AS tecnologia
    FROM nodos n
    LEFT JOIN tecnologias t ON n.tecnologia_id = t.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});*/
// ENDPOINT: Obtener nodos con paginación y filtro seguro
app.get("/api/nodos", (req, res) => {
  const { page = 1, limit = 100, serie = "", tecnologia = "" } = req.query;
  const offset = (page - 1) * limit;

  const filtros = [];
  const paramsFiltro = [];

  if (serie) {
    filtros.push("n.serie LIKE ?");
    paramsFiltro.push(`%${serie}%`);
  }

  if (tecnologia) {
    filtros.push("t.nombre LIKE ?");
    paramsFiltro.push(`%${tecnologia}%`);
  }
  const whereSQL = filtros.length > 0 ? "WHERE " + filtros.join(" AND ") : "";
  // Query para obtener los nodos
  const query = `
    SELECT n.id, n.serie, n.estatus, n.fecha_actualizacion, t.nombre AS tecnologia
    FROM nodos n
    LEFT JOIN tecnologias t ON n.tecnologia_id = t.id
    ${whereSQL}
    ORDER BY n.id
    LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `;

  db.all(query, paramsFiltro, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Query para obtener total de nodos filtrados
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM nodos n
      LEFT JOIN tecnologias t ON n.tecnologia_id = t.id
      ${whereSQL}
    `;
    db.get(countQuery, paramsFiltro, (err2, count) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({
        total: count.total,
        page: Number(page),
        limit: Number(limit),
        data: rows
      });
    });
  });
});
// --------------------------------------------------
// ENDPOINT: Actualizar el estatus de un nodo
// --------------------------------------------------
app.put("/api/nodos/:id/estatus", (req, res) => {
  const { id } = req.params;
  const { estatus } = req.body;

  // Solo permitir los estatus válidos
  const estatusValidos = ["Operativo","Dañado","Mantenimiento","Para garantía","En garantía"];
  if (!estatusValidos.includes(estatus)) {
    return res.status(400).json({ error: "Estatus inválido" });
  }
  // Actualizar el nodo y su fecha
  const query = `
    UPDATE nodos
    SET estatus = ?, fecha_actualizacion = datetime('now','localtime')
    WHERE id = ?
  `;
  db.run(query, [estatus, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Nodo no encontrado" });

    // Traer el nodo actualizado para devolverlo al frontend
    const queryNodo = `
      SELECT id, serie, estatus, fecha_actualizacion
      FROM nodos
      WHERE id = ?
    `;
    db.get(queryNodo, [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(row); // Devuelve id, estatus y fecha_actualizacion
    });
  });
});
// --------------------------------------------------
// ENDPOINT: Actualizar nodos a mantenimiento mediante CSV (robusto)
// --------------------------------------------------
app.post("/api/mantenimiento/actualizar", upload.single("file"), (req, res) => {
  const filePath = req.file?.path;
  const columnaSeleccionada = (req.body.columna || "SERIE").trim().toLowerCase();

  if (!filePath) return res.status(400).json({ error: "No se envió ningún archivo" });

  const seriesCSV = [];
  let columnasCSV = [];
  let columnaExiste = false;
  let procesado = false;

  try {
    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase(), // normaliza encabezados
        })
      )
      .on("headers", (headers) => {
        columnasCSV = headers;
        columnaExiste = headers.includes(columnaSeleccionada);

        if (!columnaExiste) {
          procesado = true;
          fs.unlinkSync(filePath);
          return res.status(400).json({
            error: `La columna "${columnaSeleccionada}" no existe en el CSV.`,
            columnasDisponibles: headers,
          });
        }
      })
      .on("data", (row) => {
        if (!columnaExiste) return;
        const valor = row[columnaSeleccionada];
        if (valor && valor.trim() !== "") {
          seriesCSV.push(valor.trim());
        }
      })
      .on("end", () => {
        if (procesado) return; // ya se devolvió respuesta por columna inexistente

        if (seriesCSV.length === 0) {
          fs.unlinkSync(filePath);
          return res.status(400).json({
            error: "El CSV no contiene valores válidos en la columna seleccionada.",
          });
        }
        let nuevos = 0;
        let yaMantenimiento = 0;
        const noEncontrados = [];
        const procesarSiguiente = (i = 0) => {
          if (i >= seriesCSV.length) {
            fs.unlinkSync(filePath);
            return res.json({ 
              resultado: "Procesamiento completado",
              totales: {
                leidos: seriesCSV.length,
                nuevos,
                yaMantenimiento,
                noEncontrados: noEncontrados.length,
              },
              detalles: { noEncontrados }
            });
          }
          const serie = seriesCSV[i];
          db.get("SELECT * FROM nodos WHERE serie = ?", [serie], (err, nodo) => {
            if (err) return res.status(500).json({ error: err.message });

            if (!nodo) {
              noEncontrados.push(serie);
              return procesarSiguiente(i + 1);
            }
            if (nodo.estatus === "Mantenimiento") {
              yaMantenimiento++;
              return procesarSiguiente(i + 1);
            }
            db.run(
              "UPDATE nodos SET estatus = 'Mantenimiento', fecha_actualizacion = datetime('now','localtime') WHERE serie = ?",
              [serie],
              (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                nuevos++;
                procesarSiguiente(i + 1);
              }
            );
          });
        };

        procesarSiguiente();
      })
      .on("error", (err) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ error: "Error al leer el archivo CSV", detalle: err.message });
      });
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(500).json({ error: "Error inesperado", detalle: error.message });
  }
});
// ENDPOINT: Obtener nodos con paginación y filtro seguro
app.get("/api/nodos", (req, res) => {
  const { page = 1, limit = 100, serie = "", tecnologia = "", estatus = "", fechaInicio, fechaFin } = req.query;
  const offset = (page - 1) * limit;

  const filtros = [];
  const paramsFiltro = [];

  if (serie) {
    filtros.push("n.serie LIKE ?");
    paramsFiltro.push(`%${serie}%`);
  }

  if (tecnologia) {
    filtros.push("t.nombre LIKE ?");
    paramsFiltro.push(`%${tecnologia}%`);
  }

  if (estatus) {
    filtros.push("n.estatus = ?");
    paramsFiltro.push(estatus);
  }

  if (fechaInicio) {
    filtros.push("date(n.fecha_actualizacion) >= date(?)");
    paramsFiltro.push(fechaInicio);
  }

  if (fechaFin) {
    filtros.push("date(n.fecha_actualizacion) <= date(?)");
    paramsFiltro.push(fechaFin);
  }
  const whereSQL = filtros.length > 0 ? "WHERE " + filtros.join(" AND ") : "";
  const query = `
    SELECT n.id, n.serie, n.estatus, n.fecha_actualizacion, t.nombre AS tecnologia
    FROM nodos n
    LEFT JOIN tecnologias t ON n.tecnologia_id = t.id
    ${whereSQL}
    ORDER BY n.id
    LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `;
  db.all(query, paramsFiltro, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM nodos n
      LEFT JOIN tecnologias t ON n.tecnologia_id = t.id
      ${whereSQL}
    `;
    db.get(countQuery, paramsFiltro, (err2, count) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({
        total: count.total,
        page: Number(page),
        limit: Number(limit),
        data: rows
      });
    });
  });
});
// --------------------------------------------------
// 📤 ENDPOINT: Actualizar estatus masivo (CSV) para cualquier tipo de equipo
// --------------------------------------------------
app.post("/api/estatus/actualizar", upload.single("file"), (req, res) => {
  const filePath = req.file?.path;
  const tipo = (req.body.tipo || "").trim().toLowerCase();
  const asignaciones = req.body.asignaciones ? JSON.parse(req.body.asignaciones) : {};
  const columnaPrincipal = Object.values(asignaciones).find(v => v && v.trim()) || "serie";
  const columnaFecha = (req.body.columnaFecha || "").trim().toLowerCase();

  let estatusNuevo = (req.body.estatus || "").trim();
  estatusNuevo = estatusNuevo.charAt(0).toUpperCase() + estatusNuevo.slice(1).toLowerCase();

  // 🔧 Estatus válidos por tipo
  const estatusPorTipo = {
    nodos: ["Operativo", "Dañado", "Mantenimiento", "Para garantía", "En garantía"],
    telefonos_celulares: ["Activo", "En reparación", "Extraviado", "Asignado", "Disponible"],
    chips_telefono: ["Activo", "Suspendido", "Sin saldo", "Extraviado", "En uso"],
    radios_handy: ["Operativo", "En mantenimiento", "Extraviado", "Asignado", "Para revisión"]
  };

  // 🧠 Validaciones iniciales
  if (!estatusPorTipo[tipo]) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(400).json({ error: `Tipo de equipo no válido: ${tipo}` });
  }

  if (!estatusPorTipo[tipo].includes(estatusNuevo)) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(400).json({ error: `Estatus inválido: ${estatusNuevo}` });
  }

  if (!filePath) return res.status(400).json({ error: "No se envió ningún archivo" });

  // --------------------------------------------------
  // 🧩 Lectura y mapeo flexible del CSV
  // --------------------------------------------------
  const registros = [];
  fs.createReadStream(filePath)
    .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
    .on("data", (row) => {
      // Buscar el valor de la columna principal (serie, imei, número_telefono, etc.)
      const col = columnaPrincipal.toLowerCase();
      const valor = row[col]?.trim();
      const fecha = columnaFecha && row[columnaFecha]?.trim() ? row[columnaFecha].trim() : null;
      if (valor) registros.push({ valor, fecha });
    })
    .on("end", () => {
      if (registros.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "El CSV no contiene valores válidos en la columna seleccionada." });
      }

      let actualizados = 0, yaConEstatus = 0, noEncontrados = [];
      const tabla = tipo;
      let campoClave = "serie";

      // 🧭 Determinar campo clave real según tipo y asignación
      const camposPorTipo = {
        nodos: "serie",
        telefonos_celulares: "imei",
        chips_telefono: "numero_telefono",
        radios_handy: "numero_serie"
      };
      campoClave = Object.keys(asignaciones).find(k => asignaciones[k]) || camposPorTipo[tipo] || "serie";

      const procesarSiguiente = (i = 0) => {
        if (i >= registros.length) {
          fs.unlinkSync(filePath);
          return res.json({
            resultado: "✅ Procesamiento completado",
            totales: { leidos: registros.length, actualizados, yaConEstatus, noEncontrados: noEncontrados.length },
            detalles: { noEncontrados }
          });
        }

        const { valor, fecha } = registros[i];
        const querySelect = `SELECT * FROM ${tabla} WHERE ${campoClave} = ?`;

        db.get(querySelect, [valor], (err, registro) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!registro) { noEncontrados.push(valor); return procesarSiguiente(i + 1); }

          if (registro.estatus?.toLowerCase() === estatusNuevo.toLowerCase()) {
            yaConEstatus++;
            return procesarSiguiente(i + 1);
          }

          const usarFecha = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
            ? `'${fecha} 00:00:00'`
            : "datetime('now','localtime')";

          const queryUpdate = `
            UPDATE ${tabla}
            SET estatus = ?, fecha_actualizacion = ${usarFecha}
            WHERE ${campoClave} = ?
          `;
          db.run(queryUpdate, [estatusNuevo, valor], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            actualizados++;
            procesarSiguiente(i + 1);
          });
        });
      };

      procesarSiguiente();
    })
    .on("error", (err) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ error: "Error al leer el archivo CSV", detalle: err.message });
    });
});



// ENDPOINT: Agregar un comentario a un chip de teléfono
app.post("/api/chips/:id/comentario", (req, res) => {
  const { id } = req.params;  // ID del chip
  const { comentario } = req.body;  // El comentario a agregar
  
  if (!comentario) {
    return res.status(400).json({ error: "Comentario es requerido" });
  }
  agregarComentario('chips', id, comentario, db);
  res.json({ message: `Comentario agregado al chip con ID ${id}` });
});
app.get("/api/equipos/:tipo/:id/comentarios", (req, res) => {
  const { tipo, id } = req.params;

  const tiposValidos = ["chips", "telefonos", "radios"];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: "Tipo de equipo inválido." });
  }

  const query = `SELECT comentario FROM ${tipo} WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: `${tipo} no encontrado.` });
    
    res.json({ comentarios: row.comentario });
  });
});

// --------------------------------------------------
// 📱 Relación de equipos asignados a personal
// --------------------------------------------------
app.get("/api/equipos", (req, res) => {
  const query = `
    SELECT 
      e.id AS entrega_id,
      e.nombre_personal, e.fecha_entrega, e.fecha_recepcion,
      t.id AS telefono_id, t.marca, t.imei, t.numero_serie AS telefono_serie, t.estatus AS telefono_estatus,
      c.id AS chip_id, c.numero_telefono, c.estatus AS chip_estatus,
      r.id AS radio_id, r.numero_serie AS radio_serie, r.estatus AS radio_estatus
    FROM entregas_personal e
    LEFT JOIN telefonos_celulares t ON e.id_numero_tablet = t.id
    LEFT JOIN chips_telefono c ON e.id_numero_chip = c.id
    LEFT JOIN radios_handy r ON e.id_numero_hand = r.id
    WHERE e.fecha_recepcion IS NULL OR e.fecha_recepcion >= CURRENT_DATE
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// Endpoint: Asignar/modificar chip a un teléfono
app.put("/api/telefonos/:id/asignar-chip", (req, res) => {
  const { id } = req.params;
  const { id_chip } = req.body;  // El ID del chip que se desea asignar al teléfono

  const query = `
    UPDATE telefonos_celulares
    SET id_chip = ?
    WHERE id = ?
  `;
  db.run(query, [id_chip, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `Chip asignado correctamente al teléfono con ID ${id}` });
  });
});

// Endpoint: Actualizar el estatus de un equipo (nodo, teléfono, chip, radio)
app.put("/api/equipos/:tipo/:id/estatus", (req, res) => {
  const { tipo, id } = req.params;
  const { estatus } = req.body;
  // Validar tipo de dispositivo
  const tiposValidos = ["telefonos_celulares", "chips_telefono", "radios_handy", "nodos"];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: "Tipo de equipo inválido." });
  }

  // Estatus válidos para cada tipo de equipo
  const estatusValidos = {
    nodos: ["Operativo", "Dañado", "Mantenimiento", "Para garantía", "En garantía"],
    telefonos_celulares: ["En campo", "Resguardo", "Mantenimiento", "Baja", "Dañado"],
    chips_telefono: ["Activo", "Inactivo", "Asignado", "Disponible"],
    radios_handy: ["Operativo", "Dañado", "En reparación", "Baja"]
  };
  // Validar estatus
  if (!estatusValidos[tipo].includes(estatus)) {
    return res.status(400).json({ error: "Estatus inválido." });
  }
  // Query para actualizar el estatus del equipo
  const query = `UPDATE ${tipo} SET estatus = ?, fecha_actualizacion = datetime('now','localtime') WHERE id = ?;`;
  db.run(query, [estatus, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ error: `${tipo} no encontrado.` });
    }

    // Responder con el estatus actualizado
    res.json({
      message: `Estatus actualizado a "${estatus}" para el equipo ${tipo} con ID ${id}`
    });
  });
});
// --------------------------------------------------
// 📥 Obtener lista de teléfonos celulares
// --------------------------------------------------
app.get("/api/telefonos/telefonos_celulares", (req, res) => {
const { estatus, buscar } = req.query;
  let query = "SELECT * FROM telefonos_celulares";
  const params = [];

  if (estatus) {
    query += " WHERE estatus = ?";
    params.push(estatus);
  }

  if (buscar) {
    if (params.length > 0) query += " AND";
    else query += " WHERE";
    query += " (imei LIKE ? OR numero_serie LIKE ? OR marca LIKE ?)";
    params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
  }

  query += " ORDER BY fecha_actualizacion DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/telefonos/radios_handy", (req, res) => {
const { estatus, buscar } = req.query;
  let query = "SELECT * FROM radios_handy";
  const params = [];

  if (estatus) {
    query += " WHERE estatus = ?";
    params.push(estatus);
  }

  if (buscar) {
    if (params.length > 0) query += " AND";
    else query += " WHERE";
    query += " (imei LIKE ? OR numero_serie LIKE ? OR marca LIKE ?)";
    params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
  }

  query += " ORDER BY fecha_actualizacion DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// --------------------------------------------------
// 📥 Obtener lista de teléfonos celulares
// --------------------------------------------------
app.get("/api/telefonos", (req, res) => {
  const { estatus, buscar } = req.query;
  let query = "SELECT * FROM telefonos_celulares";
  const params = [];

  if (estatus) {
    query += " WHERE estatus = ?";
    params.push(estatus);
  }

  if (buscar) {
    if (params.length > 0) query += " AND";
    else query += " WHERE";
    query += " (imei LIKE ? OR numero_serie LIKE ? OR marca LIKE ?)";
    params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
  }

  query += " ORDER BY fecha_actualizacion DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// --------------------------------------------------
// 📱 Agregar teléfono
// --------------------------------------------------
app.post("/api/telefonos/agregar", express.json(), (req, res) => {
  const { imei, numero_serie, marca, estatus = "Disponible" } = req.body;
  if (!imei && !numero_serie) return res.status(400).json({ error: "Falta IMEI o serie." });

  const fecha = new Date().toISOString().slice(0, 19).replace("T", " ");
  db.run(
    "INSERT INTO telefonos_celulares (imei, numero_serie, marca, estatus, fecha_actualizacion) VALUES (?, ?, ?, ?, ?)",
    [imei, numero_serie, marca || "Desconocida", estatus, fecha],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: "Teléfono agregado correctamente.", id: this.lastID });
    }
  );
});

// --------------------------------------------------
// 💾 Agregar chip
// --------------------------------------------------
app.post("/api/chips/agregar", express.json(), (req, res) => {
  const { numero, icc, compania, estatus = "Disponible" } = req.body;
  if (!numero && !icc) return res.status(400).json({ error: "Falta número o ICC." });

  const fecha = new Date().toISOString().slice(0, 19).replace("T", " ");
  db.run(
    "INSERT INTO chips_telefono (numero, icc, compania, estatus, fecha_actualizacion) VALUES (?, ?, ?, ?, ?)",
    [numero, icc, compania || "Desconocida", estatus, fecha],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: "Chip agregado correctamente.", id: this.lastID });
    }
  );
});

// --------------------------------------------------
// 📡 Agregar radio
// --------------------------------------------------
app.post("/api/radios/agregar", express.json(), (req, res) => {
  const { serie, modelo, marca, estatus = "Disponible" } = req.body;
  if (!serie) return res.status(400).json({ error: "Falta número de serie." });

  const fecha = new Date().toISOString().slice(0, 19).replace("T", " ");
  db.run(
    "INSERT INTO radios (serie, modelo, marca, estatus, fecha_actualizacion) VALUES (?, ?, ?, ?, ?)",
    [serie, modelo || "Desconocido", marca || "Desconocida", estatus, fecha],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: "Radio agregado correctamente.", id: this.lastID });
    }
  );
});

// --------------------------------------------------
// 🧩 Agregar nodo
// --------------------------------------------------
app.post("/api/nodos/agregar", express.json(), (req, res) => {
  const { id_nodo, ubicacion, responsable, estatus = "Activo" } = req.body;
  if (!id_nodo) return res.status(400).json({ error: "Falta ID de nodo." });

  const fecha = new Date().toISOString().slice(0, 19).replace("T", " ");
  db.run(
    "INSERT INTO nodos (id_nodo, ubicacion, responsable, estatus, fecha_actualizacion) VALUES (?, ?, ?, ?, ?)",
    [id_nodo, ubicacion || "Desconocida", responsable || "N/A", estatus, fecha],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: "Nodo agregado correctamente.", id: this.lastID });
    }
  );
});

app.use(cors({
  origin: 'http://localhost:3001',  // Asegúrate de que esta URL coincida con la de tu frontend
}));


// --------------------------------------------------
// INICIO DEL SERVIDOR
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});
