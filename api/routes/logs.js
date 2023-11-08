const express = require("express");
const router = express.Router();
const logsUtils = require("../utils/logsUtils");
var fs = require('fs');

router.get("/", (req, res) => {               
    //Convierte STRING -> INTEGER, sino toma los valores por defecto: Pagina 1 - Tamaño 10 (10 losg por pagina)
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10; // Número de logs por página
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const rutaArchivo = "D:/UNAHUR/REPO GIT/api_EP/api_EP/api/utils/logs/logs.txt"
    
    //Los logs se leen desde el archivo logs.txt
  fs.readFile(rutaArchivo, "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de logs:", err);
      logsUtils.guardarLog('Ocurrio un error al leer el archivo logs.txt : ${error.message}')
      res.status(500).send("Error interno del servidor");
      return;
    }

    const logs = data.split("\n").filter(log => log.trim() !== "");
    const paginatedLogs = logs.slice(startIndex, endIndex);

    res.json({
      page: page,
      pageSize: pageSize,
      totalLogs: logs.length,
      logs: paginatedLogs
    });
    logsUtils.guardarLog('Lectura exitosa')
  });
});

module.exports = router;