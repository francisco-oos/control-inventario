//server.js
import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";

// Importamos las rutas que hemos creado
import nodosRoutes from "./routes/nodosRoutes.js";
import comentariosRoutes from "./routes/comentariosRoutes.js";
import tecnologiasRoutes from './routes/tecnologiasRoutes.js';
import equiposRoutes from './routes/equiposRoutes.js';
import chipsRoutes from './routes/chipsRoutes.js';
import comentariosRoutes from '../controllers/comentariosController.js';

// Inicializamos la aplicación Express
const app = express();

// Configuramos el puerto
const PORT = process.env.PORT || 3001;

// Middleware para parsing JSON
app.use(bodyParser.json());

// Configuración de multer para la carga de archivos
const upload = multer({ dest: "uploads/" });

// Middleware de archivo (por ejemplo, CSV)
app.use(upload.single('file'));

// Rutas importadas
app.use("/api/nodos", nodosRoutes);
app.use("/api/tecnologias", tecnologiasRoutes);
app.use("/api/equipos", equiposRoutes);
app.use("/api/comentarios", comentariosRoutes);

// Ruta raíz simple (opcional)
app.get("/", (req, res) => {
  res.send("Bienvenido a la API de Gestión de Nodos y Equipos.");
});

// Manejo de errores 404 (cuando no se encuentra una ruta)
app.use((req, res, next) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Iniciamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
