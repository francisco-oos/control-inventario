import db from '../database.js';

export const addComentarioChip = (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;

  if (!comentario) {
    return res.status(400).json({ error: 'Comentario es requerido' });
  }

  const query = `
    UPDATE chips_telefono
    SET comentario = COALESCE(comentario, '') || '\n' || ? || ' ' || ? 
    WHERE id = ?
  `;
  db.run(query, [new Date().toLocaleDateString(), comentario, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `Comentario agregado al chip con ID ${id}` });
  });
};
