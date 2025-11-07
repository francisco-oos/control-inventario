export const parseCSVFile = (filePath, columnaSeleccionada) => {
  return new Promise((resolve, reject) => {
    const seriesCSV = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const serie = row[columnaSeleccionada]?.trim();
        if (serie) seriesCSV.push(serie);
      })
      .on('end', () => resolve(seriesCSV))
      .on('error', (err) => reject(err));
  });
};
