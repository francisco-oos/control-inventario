// init_db.js
// ----------------------------------------------
// Script para inicializar la base de datos y crear tablas base
// ----------------------------------------------

import { dbPromise } from "./db.js";

const db = await dbPromise;

// Crear tablas
await db.exec(`
CREATE TABLE IF NOT EXISTS tecnologias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS nodos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serie TEXT UNIQUE NOT NULL,
  tecnologia_id INTEGER,
  estatus TEXT DEFAULT 'Operativo',
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id)
);
`);

console.log(" Base de datos inicializada correctamente");
process.exit(0);
