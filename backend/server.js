// server.js
// --------------------------------------------------
// Servidor principal Express para manejar la API REST.
// Provee endpoints para tecnologías y nodos.
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
// ENDPOINT: Actualizar nodos a mantenimiento mediante CSV
// --------------------------------------------------
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

app.post("/api/estatus/actualizar", upload.single("file"), (req, res) => {
  const filePath = req.file?.path;
  const columnaSerie = (req.body.columna || "serie").trim().toLowerCase();
  const columnaFecha = (req.body.columnaFecha || "").trim().toLowerCase();
  const estatusNuevo = (req.body.estatus || "").trim();

  const estatusValidos = ["Operativo", "Dañado", "Mantenimiento", "Para garantía", "En garantía"];
  if (!estatusNuevo || !estatusValidos.includes(estatusNuevo)) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(400).json({ error: `Estatus inválido o no proporcionado: ${estatusNuevo}` });
  }

  if (!filePath) return res.status(400).json({ error: "No se envió ningún archivo" });

  const registros = [];

  fs.createReadStream(filePath)
    .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
    .on("data", (row) => {
      const serie = row[columnaSerie]?.trim();
      const fecha = columnaFecha && row[columnaFecha]?.trim() ? row[columnaFecha].trim() : null;
      if (serie) registros.push({ serie, fecha });
    })
    .on("end", () => {
      if (registros.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "El CSV no contiene series válidas." });
      }

      let actualizados = 0;
      let yaConEstatus = 0;
      const noEncontrados = [];

      const procesarSiguiente = (i = 0) => {
        if (i >= registros.length) {
          fs.unlinkSync(filePath);
          return res.json({
            resultado: "Procesamiento completado",
            totales: {
              leidos: registros.length,
              actualizados,
              yaConEstatus,
              noEncontrados: noEncontrados.length
            },
            detalles: { noEncontrados }
          });
        }

        const { serie, fecha } = registros[i];

        db.get("SELECT * FROM nodos WHERE serie = ?", [serie], (err, nodo) => {
          if (err) return res.status(500).json({ error: err.message });

          if (!nodo) {
            noEncontrados.push(serie);
            return procesarSiguiente(i + 1);
          }

          if (nodo.estatus === estatusNuevo) {
            yaConEstatus++;
            return procesarSiguiente(i + 1);
          }

          const usarFecha = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
            ? `${fecha} 00:00:00`
            : null;

          const query = `
            UPDATE nodos
            SET estatus = ?, 
                fecha_actualizacion = ${usarFecha ? `'${usarFecha}'` : "datetime('now','localtime')"}
            WHERE serie = ?
          `;

          db.run(query, [estatusNuevo, serie], (err2) => {
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

// --------------------------------------------------
// INICIO DEL SERVIDOR
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});
