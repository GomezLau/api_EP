const express = require("express");
const router = express.Router();
const logUtils = require("../utils/logsUtils");

router.get("/logs", (req, res) => {               
    //Convierte STRING -> INTEGER, sino toma los valores por defecto: Pagina 1 - Tamaño 10 (10 losg por pagina)
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10; // Número de logs por página
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    
    //Los logs se leen desde el archivo logs.txt
  fs.readFile("logs.txt", "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de logs:", err);
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
  });
});

module.exports = router;