import db from "../database";  // Asume que tienes una conexión a la base de datos

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);  // `this` es el objeto que contiene la ID del último insertado o el número de filas afectadas
    });
  });
};

export default { query, run };
