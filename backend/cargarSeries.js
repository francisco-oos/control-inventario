// cargarSeries.js
import fs from 'fs';
import csv from 'csv-parser';
import db from './database.js';
import path from 'path';

const CSV_FILE_PATH = path.join(
  'C:', 'Users', 'Control de Material', 'Documents',
  'BASE DE DATOS', 'SynologyDrive', 'control-inventario', 'base_series.csv'
);

function cargarSeries() {
  const seriesPorInsertar = [];
  const seriesVistasCSV = new Set();  // Para detectar duplicados dentro del CSV
  const duplicadosEnCSV = [];         // Para almacenar los duplicados internos

  console.log("📥 Leyendo archivo:", CSV_FILE_PATH);

  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      const { serie, tecnologia_id } = row;

      if (!serie || !tecnologia_id) {
        console.warn(` Fila incompleta: serie=${serie}, tecnologia_id=${tecnologia_id}`);
        return;
      }

      const serieTrim = serie.trim();

      if (seriesVistasCSV.has(serieTrim)) {
        duplicadosEnCSV.push(serieTrim); // duplicado dentro del CSV
        return;
      }

      seriesVistasCSV.add(serieTrim);
      seriesPorInsertar.push([serieTrim, Number(tecnologia_id)]);
    })
    .on('end', async () => {
      console.log(` Se han filtrado ${seriesPorInsertar.length} registros únicos del CSV.`);
      if (duplicadosEnCSV.length > 0) {
        console.log(` Detectados ${duplicadosEnCSV.length} duplicados dentro del CSV (primeras 20):`);
        console.log(duplicadosEnCSV.slice(0, 20).join(', '));
      }
      await insertarSeries(seriesPorInsertar);
    })
    .on('error', (error) => {
      console.error(' Error al leer el archivo CSV:', error.message);
    });
}

function insertarSeries(series) {
  return new Promise((resolve) => {
    const seriesDuplicadasEnDB = [];
    const seriesNuevas = [];

    db.serialize(() => {
      db.run("BEGIN TRANSACTION;");

      const checkQuery = "SELECT serie FROM nodos WHERE serie = ?";
      const insertQuery = "INSERT INTO nodos (serie, tecnologia_id) VALUES (?, ?)";
      const checkStmt = db.prepare(checkQuery);
      const insertStmt = db.prepare(insertQuery);

      let procesadas = 0;

      series.forEach(([serie, tecnologia_id]) => {
        checkStmt.get(serie, (err, row) => {
          if (err) {
            console.error(" Error al verificar duplicado:", err.message);
            procesadas++;
            return;
          }

          if (row) {
            seriesDuplicadasEnDB.push(serie);
          } else {
            seriesNuevas.push([serie, tecnologia_id]);
            insertStmt.run(serie, tecnologia_id, (err) => {
              if (err) {
                console.error(" Error al insertar serie:", serie, err.message);
              }
            });
          }

          procesadas++;

          if (procesadas === series.length) {
            insertStmt.finalize(() => {
              db.run("COMMIT;", (err) => {
                if (err) console.error(" Error al finalizar la transacción:", err.message);

                console.log("\n RESUMEN DE IMPORTACIÓN:");
                console.log(`    Nuevas insertadas: ${seriesNuevas.length}`);
                console.log(`     Duplicadas en la DB ignoradas: ${seriesDuplicadasEnDB.length}`);

                if (seriesDuplicadasEnDB.length > 0) {
                  console.log("\n Listado de series duplicadas en DB (primeras 20):");
                  console.log(seriesDuplicadasEnDB.slice(0, 20).join(', '));
                  if (seriesDuplicadasEnDB.length > 20) {
                    console.log(`... (${seriesDuplicadasEnDB.length - 20} más)`);
                  }
                }

                checkStmt.finalize();
                db.close(() => {
                  console.log("\n Conexión cerrada.");
                  resolve();
                });
              });
            });
          }
        });
      });
    });
  });
}

cargarSeries();
