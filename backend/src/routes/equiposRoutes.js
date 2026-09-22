import express from "express";
import { obtenerEquipos, asignarChip, actualizarEstatusEquipo } from "../controllers/equiposController.js";

const router = express.Router();

router.get("/", obtenerEquipos);
router.put("/:id/asignar-chip", asignarChip);
router.put("/:tipo/:id/estatus", actualizarEstatusEquipo);

export default router;
