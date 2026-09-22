import express from "express";
import { obtenerNodos, actualizarEstatusNodo, actualizarNodosCSV } from "../controllers/nodosController.js";

const router = express.Router();

router.get("/", obtenerNodos);
router.put("/:id/estatus", actualizarEstatusNodo);
router.post("/mantenimiento/actualizar", actualizarNodosCSV);

export default router;
