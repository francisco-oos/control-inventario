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
CREATE TABLE IF NOT EXISTS chips_telefono (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_telefono TEXT UNIQUE NOT NULL,
  fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
  comentario TEXT,
  estatus TEXT DEFAULT 'Operativo'
);

CREATE TABLE IF NOT EXISTS telefonos_celulares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marca TEXT,
  imei TEXT UNIQUE NOT NULL,
  numero_serie TEXT UNIQUE NOT NULL,
  numero_economico TEXT,
  fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
  estatus TEXT DEFAULT 'Operativo',
  comentario TEXT
);

CREATE TABLE IF NOT EXISTS radios_handy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_serie TEXT UNIQUE NOT NULL,
  fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
  estatus TEXT DEFAULT 'Operativo',
  comentario TEXT
);

CREATE TABLE IF NOT EXISTS entregas_personal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_personal TEXT NOT NULL,
  id_numero_tablet INTEGER,
  id_numero_chip INTEGER,
  id_numero_hand INTEGER,
  fecha_entrega TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_recepcion TEXT,
  cargador_radio BOOLEAN DEFAULT FALSE,
  cargador_telefono BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (id_numero_tablet) REFERENCES telefonos_celulares(id),
  FOREIGN KEY (id_numero_chip) REFERENCES chips_telefono(id),
  FOREIGN KEY (id_numero_hand) REFERENCES radios_handy(id)
);
`);

console.log(" Base de datos inicializada correctamente");
process.exit(0);
