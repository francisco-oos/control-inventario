import express from "express";
import { obtenerTecnologias, crearTecnologia } from "../controllers/tecnologiasController.js";

const router = express.Router();

router.get("/", obtenerTecnologias);
router.post("/", crearTecnologia);

export default router;
