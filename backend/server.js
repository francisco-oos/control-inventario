// server.js
// --------------------------------------------------
// Servidor principal Express para manejar la API REST.
// Provee endpoints para tecnologías y nodos.
// --------------------------------------------------

import express from "express";
import cors from "cors";
import db from "./database.js";

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
// INICIO DEL SERVIDOR
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});
