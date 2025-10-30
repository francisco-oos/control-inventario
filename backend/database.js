// database.js
// --------------------------------------------------
// Conecta con la base de datos SQLite ubicada en SynologyDrive.
// Si el archivo no existe, se creará automáticamente.
// --------------------------------------------------

import sqlite3 from "sqlite3";
import { DB_PATH } from "./config.js";

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error al conectar con la base de datos:", err.message);
  } else {
    console.log("✅ Conectado a la base de datos en:", DB_PATH);
  }
});

// Creación inicial de tablas (si no existen)
db.serialize(() => {
  // Tabla de tecnologías
  db.run(`
    CREATE TABLE IF NOT EXISTS tecnologias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL
    )
  `);

  // Tabla de nodos (equipos o materiales)
  db.run(`
    CREATE TABLE IF NOT EXISTS nodos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serie TEXT UNIQUE NOT NULL,
      tecnologia_id INTEGER,
      estatus TEXT DEFAULT 'Operativo',
      fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tecnologia_id) REFERENCES tecnologias(id)
    )
  `);
});

export default db;
