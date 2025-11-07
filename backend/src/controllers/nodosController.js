import dbService from "../services/dbService.js";
import { parseCSVFile } from "../services/fileService.js";

export const obtenerNodos = (req, res) => {
  const { page = 1, limit = 100, serie = "", tecnologia = "", estatus = "", fechaInicio, fechaFin } = req.query;
  const offset = (page - 1) * limit;

  const filtros = [];
  const paramsFiltro = [];

  if (serie) {
    filtros.push("n.serie LIKE ?");
    paramsFiltro.push(`%${serie}%`);
  }

  if (tecnologia) {
    filtros.push("t.nombre LIKE ?");
    paramsFiltro.push(`%${tecnologia}%`);
  }

  if (estatus) {
    filtros.push("n.estatus = ?");
    paramsFiltro.push(estatus);
  }

  if (fechaInicio) {
    filtros.push("date(n.fecha_actualizacion) >= date(?)");
    paramsFiltro.push(fechaInicio);
  }

  if (fechaFin) {
    filtros.push("date(n.fecha_actualizacion) <= date(?)");
    paramsFiltro.push(fechaFin);
  }

  const whereSQL = filtros.length > 0 ? "WHERE " + filtros.join(" AND ") : "";
  const query = `
    SELECT n.id, n.serie, n.estatus, n.fecha_actualizacion, t.nombre AS tecnologia
    FROM nodos n
    LEFT JOIN tecnologias t ON n.tecnologia_id = t.id
    ${whereSQL}
    ORDER BY n.id
    LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `;
  dbService.query(query, paramsFiltro)
    .then(rows => {
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM nodos n
        LEFT JOIN tecnologias t ON n.tecnologia_id = t.id
        ${whereSQL}
      `;
      dbService.query(countQuery, paramsFiltro)
        .then(count => {
          res.json({
            total: count.total,
            page: Number(page),
            limit: Number(limit),
            data: rows
          });
        })
        .catch(err => res.status(500).json({ error: err.message }));
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

export const actualizarEstatusNodo = (req, res) => {
  const { id } = req.params;
  const { estatus } = req.body;
  const estatusValidos = ["Operativo", "Dañado", "Mantenimiento", "Para garantía", "En garantía"];
  
  if (!estatusValidos.includes(estatus)) {
    return res.status(400).json({ error: "Estatus inválido" });
  }

  const query = `
    UPDATE nodos
    SET estatus = ?, fecha_actualizacion = datetime('now','localtime')
    WHERE id = ?
  `;
  dbService.run(query, [estatus, id])
    .then(() => {
      const queryNodo = `
        SELECT id, serie, estatus, fecha_actualizacion
        FROM nodos
        WHERE id = ?
      `;
      dbService.query(queryNodo, [id])
        .then(row => res.json(row))
        .catch(err => res.status(500).json({ error: err.message }));
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

export const actualizarNodosCSV = (req, res) => {
  const filePath = req.file?.path;
  const columnaSeleccionada = (req.body.columna || "SERIE").trim().toLowerCase();

  if (!filePath) return res.status(400).json({ error: "No se envió ningún archivo" });

  parseCSVFile(filePath, columnaSeleccionada)
    .then(seriesCSV => {
      let nuevos = 0;
      let yaMantenimiento = 0;
      let noEncontrados = [];

      const procesarSiguiente = (i = 0) => {
        if (i >= seriesCSV.length) {
          fs.unlinkSync(filePath);
          return res.json({
            resultado: "Procesamiento completado",
            totales: { leidos: seriesCSV.length, nuevos, yaMantenimiento, noEncontrados: noEncontrados.length },
            detalles: { noEncontrados }
          });
        }

        const serie = seriesCSV[i];
        dbService.query("SELECT * FROM nodos WHERE serie = ?", [serie])
          .then(nodo => {
            if (!nodo) {
              noEncontrados.push(serie);
              return procesarSiguiente(i + 1);
            }

            if (nodo.estatus === "Mantenimiento") {
              yaMantenimiento++;
              return procesarSiguiente(i + 1);
            }

            const query = `
              UPDATE nodos
              SET estatus = 'Mantenimiento', fecha_actualizacion = datetime('now','localtime')
              WHERE serie = ?
            `;
            dbService.run(query, [serie])
              .then(() => {
                nuevos++;
                procesarSiguiente(i + 1);
              })
              .catch(err => res.status(500).json({ error: err.message }));
          })
          .catch(err => res.status(500).json({ error: err.message }));
      };

      procesarSiguiente();
    })
    .catch(err => res.status(500).json({ error: err.message }));
};
