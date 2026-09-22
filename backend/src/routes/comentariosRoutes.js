import express from "express";
import { agregarComentario, obtenerComentarios } from "../controllers/comentariosController.js";

const router = express.Router();

router.post("/:id/comentario", agregarComentario);
router.get("/:tipo/:id/comentarios", obtenerComentarios);

export default router;
