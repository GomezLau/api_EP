const fs = require("fs");
const path = require("path");


// la funcion toma un mensaje como entrada, agrega la fecha y hora actual del mensaje y los guarda en logs.txt
//AGREGAR "guardarLog" en cada log que se desea guardar en el archivo.

function guardarLog(mensaje) {
  const fecha = new Date().toISOString();
  const log = `${fecha}: ${mensaje}\n`;

  const rutaArchivo = path.join(__dirname, "logs", "logs.txt");

  fs.appendFile(rutaArchivo, log, (err) => {
    if (err) {
      console.error("Error al guardar el log:", err);
    } else {
      console.log("Log guardado correctamente.");
    }
  });
}

module.exports = {
  guardarLog,
  
  // Otras funciones y middlewares necesarios
};