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
app.get("/api/nodos", (req, res) => {
  const query = `
    SELECT n.id, n.serie, n.estatus, n.fecha_actualizacion, t.nombre AS tecnologia
    FROM nodos n
    LEFT JOIN tecnologias t ON n.tecnologia_id = t.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --------------------------------------------------
// INICIO DEL SERVIDOR
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});
