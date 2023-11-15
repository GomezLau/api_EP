const express = require("express");
const router = express.Router();
const logsUtils = require("../utils/logsUtils");
var fs = require('fs');

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Obtener registros de logs paginados
 *     description: Retorna registros de logs paginados.
 *     tags:
 *       - Logs
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Número de página solicitada (por defecto 1)
 *         required: false
 *         schema:
 *           type: integer
 *       - name: pageSize
 *         in: query
 *         description: Tamaño de la página solicitada (por defecto 10)
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registros de logs paginados
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               pageSize: 10
 *               totalLogs: 100
 *               logs: ["log1", "log2", ...]
 *       500:
 *         description: Error interno del servidor
 */
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