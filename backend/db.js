// db.js
// ----------------------------------------------
// Este módulo maneja la conexión a la base de datos SQLite
// ----------------------------------------------

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { DB_PATH } from "./config.js";

// Función para abrir la conexión a la base de datos
export const dbPromise = open({
  filename: DB_PATH,
  driver: sqlite3.Database,
});
