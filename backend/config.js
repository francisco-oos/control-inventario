// config.js
// --------------------------------------------------
// Este archivo define la ruta de la base de datos.
// Si cambias de PC, solo modifica esta ruta.
// --------------------------------------------------

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta absoluta a la base de datos en SynologyDrive
export const DB_PATH = path.join(
  //COMPUTADORA MISAEL 

/* "C:",
  "Users",
  "Control de Material",
  "Documents",
  "BASE DE DATOS",
  "SynologyDrive",
  "control-inventario",
  "control_inventario.db"
*/
//COMPUTADORA EDUARDO
"C:",
"Users",
"Control de Material",
"Documents",
"dev-Francisco",
"SynologyDrive",
"SynologyDrive",
"control_inventario.db"
);
