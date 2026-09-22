// database.js
// --------------------------------------------------
// Conecta con la base de datos SQLite ubicada en SynologyDrive.
// Si el archivo no existe, se creará automáticamente.
// Además, verifica y actualiza la estructura de tablas (por ejemplo,
// agrega la columna 'estatus' si no existe en 'nodos').
// --------------------------------------------------

import sqlite3 from "sqlite3";
import { DB_PATH } from "./config.js";

// Conexión a la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(" Error al conectar con la base de datos:", err.message);
  } else {
    console.log(" Conectado a la base de datos en:", DB_PATH);
    inicializarTablas();
  }
});

// --------------------------------------------------
// Inicialización de tablas y verificación de estructura
// --------------------------------------------------
function inicializarTablas() {
  db.serialize(() => {
    // Crear tabla de tecnologías
    db.run(`
      CREATE TABLE IF NOT EXISTS tecnologias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL
      )
    `);

    // Crear tabla de nodos
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

    // Verificar si la columna 'estatus' existe y crearla si no
    verificarColumnaEstatus();
  });

  // Insertar tecnologías base (solo si no existen)
  insertarTecnologiasBase();
}

// --------------------------------------------------
// Función que agrega la columna 'estatus' si no existe
// --------------------------------------------------
function verificarColumnaEstatus() {
  db.all("PRAGMA table_info(nodos);", (err, columns) => {
    if (err) {
      console.error("❌ Error al obtener columnas de 'nodos':", err.message);
      return;
    }

    const existeEstatus = columns.some((col) => col.name === "estatus");
    if (!existeEstatus) {
      console.log("🛠️ Agregando columna 'estatus' a la tabla 'nodos'...");
      db.run(
        "ALTER TABLE nodos ADD COLUMN estatus TEXT DEFAULT 'Operativo';",
        (err) => {
          if (err) {
            console.error("❌ Error al agregar columna 'estatus':", err.message);
          } else {
            console.log("✅ Columna 'estatus' agregada correctamente.");
          }
        }
      );
    }
  });
}

// --------------------------------------------------
// Inserta las tecnologías base si no están presentes
// --------------------------------------------------
function insertarTecnologiasBase() {
  const tecnologias = [
    "INOVA ANALOGICO", // Tecnología ID 1
    "SERCEL AFU",      // Tecnología ID 2
    "SERCEL DFU"       // Tecnología ID 3
  ];

  tecnologias.forEach((nombre) => {
    db.run(
      "INSERT OR IGNORE INTO tecnologias (nombre) VALUES (?)",
      [nombre],
      (err) => {
        if (err) {
          console.error("❌ Error al insertar tecnología:", err.message);
        }
      }
    );
  });
}

export default db;
