// controllers/comentariosController.js

export const getComentarios = (req, res) => {
  // Lógica para obtener los comentarios
  res.json([{ id: 1, comentario: 'Este es un comentario de prueba' }]);
};

export const createComentario = (req, res) => {
  // Lógica para crear un nuevo comentario
  const nuevoComentario = req.body;
  res.status(201).json({ message: 'Comentario creado', comentario: nuevoComentario });
};
