// config.js
// Ruta de base de datos configurable sin exponer rutas locales de equipos.
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configured = (process.env.CONTROL_INVENTARIO_DB_PATH || "").trim();

// Por defecto usa una base local junto al backend.
// En producción puede apuntar a NAS/Synology mediante CONTROL_INVENTARIO_DB_PATH.
export const DB_PATH = configured || path.join(__dirname, "control_inventario.db");
