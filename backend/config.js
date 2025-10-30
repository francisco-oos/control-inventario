// config.js
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base de datos directamente en SynologyDrive
export const DB_PATH = path.join(
  "C:",
  "Users",
  "Control de Material",
  "Documents",
  "BASE DE DATOS",
  "SynologyDrive",
  "control-inventario",
  "control_inventario.db"
);
