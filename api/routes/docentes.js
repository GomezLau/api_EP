var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");
const authMiddleware = require("../utils/authMiddleware");

/**
 * @swagger
 * /doc:
 *   get:
 *     summary: Obtener lista de docentes
 *     description: Obtiene una lista paginada de docentes.
 *     tags:
 *       - Docentes
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Número de página solicitada
 *         required: false
 *         schema:
 *           type: integer
 *       - name: pageSize
 *         in: query
 *         description: Tamaño de la página solicitada
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de docentes obtenida con éxito
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               pageSize: 10
 *               totalDocentes: 20
 *               docentes:
 *                 - id: 1
 *                   nombre: "NombreDocente1"
 *                   apellido: "ApellidoDocente1"
 *                   MateriasRelacionadas:
 *                     - idDocente: 1
 *                       nombre: "Materia1"
 *                 - id: 2
 *                   nombre: "NombreDocente2"
 *                   apellido: "ApellidoDocente2"
 *                   MateriasRelacionadas:
 *                     - idDocente: 2
 *                       nombre: "Materia2"
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", (req, res) => {
  
  //PAGINACION
  const page = parseInt(req.query.page) || 1; // Número de página solicitada (por defecto: 1)
  const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de la página solicitada (por defecto: 10)
  const offset = (page - 1) * pageSize; // Calcular el índice de inicio para la paginación
  

  models.docente
    .findAndCountAll({
      attributes: ["id", "nombre","apellido"],
      include:[
        {
          as:'MateriasRelacionadas', 
          model:models.materia, 
          attributes: ["idDocente","nombre"]
        }
      ],
      limit: pageSize, // Limitar la cantidad de resultados por página
      offset: offset // Saltar los resultados anteriores a la página actual
    })
    .then(docentes => {
      //Log exitoso cuando se obtienen los docentes
      logsUtils.guardarLog("Consulta exitosa a la lista de docentes");
      res.json({
        page: page,
        pageSize: pageSize,
        totalDocentes: docentes.count,
        docentes: docentes.rows
      });
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al consultar los docentes: ${error.message}`);
      console.error("Error al consultar los docentes:", error);
      res.sendStatus(500);
    });
});

/**
 * @swagger
 * /doc:
 *   post:
 *     summary: Crear un nuevo docente
 *     description: Crea un nuevo docente con la información proporcionada.
 *     tags:
 *       - Docentes
 *     security:
 *       - jwt: []
 *     requestBody:
 *       description: Datos del docente a crear
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *     responses:
 *       201:
 *         description: Docente creado con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *       400:
 *         description: Bad request, docente duplicado o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post("/",authMiddleware.verifyAdmin, (req, res) => {
  models.docente
    .create({ nombre: req.body.nombre, apellido: req.body.apellido  })
    .then(docente => {
      logsUtils.guardarLog("Post exitoso en la lista de docentes");
      res.status(201).send({ id: docente.id })
    })
    .catch(error => {
      if (error == "SequelizeUniqueConstraintError: Validation error") {
        logsUtils.guardarLog(`Error en POST, docente duplicado: ${error.message}`);
        res.status(400).send('Bad request: existe otro docente con el mismo nombre')
      }
      else {
        console.log(`Error al intentar insertar en la base de datos: ${error}`)
        logsUtils.guardarLog(`Error en POST, error al insertar: ${error.message}`);
        res.sendStatus(500)
      }
    });
});

const findDocente = (id, { onSuccess, onNotFound, onError }) => {
  models.docente
    .findOne({
      attributes: ["id", "nombre","apellido"],
      where: { id }
    })
    .then(docente => (docente ? onSuccess(docente) : onNotFound()))
    .catch(() => onError());
};

/**
 * @swagger
 * /doc/{id}:
 *   get:
 *     summary: Obtener un docente por ID
 *     description: Obtiene información detallada de un docente según su ID.
 *     tags:
 *       - Docentes
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del docente a obtener
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Docente obtenido con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "NombreDocente"
 *               apellido: "ApellidoDocente"
 *               MateriasRelacionadas:
 *                 - idDocente: 1
 *                   nombre: "Materia1"
 *       404:
 *         description: Docente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:id", (req, res) => {
  findDocente(req.params.id, {
    onSuccess: docente => {
      res.send(docente), 
      logsUtils.guardarLog(`Busqueda de docente exitosa`);
    },
    onNotFound: () => {
      res.sendStatus(404), 
      logsUtils.guardarLog(`No se encontro al docente`);
    },
    onError: () => {
      res.sendStatus(500), 
      logsUtils.guardarLog(`Error al buscar al docente`);
    }
  });
});

/**
 * @swagger
 * /doc/{id}:
 *   put:
 *     summary: Actualizar un docente por ID
 *     description: Actualiza la información de un docente según su ID.
 *     tags:
 *       - Docentes
 *     security:
 *       - jwt: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del docente a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       description: Nuevos datos del docente
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *     responses:
 *       200:
 *         description: Docente actualizado con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "NuevoNombre"
 *               apellido: "NuevoApellido"
 *       404:
 *         description: Docente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put("/:id",authMiddleware.verifyAdmin, (req, res) => {

  //Guardo el ID y los datos para la actualizacion
  const docenteId = req.params.id;
  const updatedDocente = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
  };


  //Busco al docente por ID (Pk=Primary Key)
  models.docente.findByPk(docenteId)
    .then(docente => {
      if (!docente) {
        logsUtils.guardarLog(`docente no encontrado`);
        return res.sendStatus(404);
      }

      //Si encuentro al docente usa el metodo update para actualizar al docente con los datos de updatedDocente
      return docente
        .update(updatedDocente, { fields: ["nombre", "apellido"] })
        .then(updatedDocente => {
          logsUtils.guardarLog(`Docente actualizado correctamente`);
          res.status(200).json(updatedDocente);
        })
        .catch(error => {
          logsUtils.guardarLog(`Error al intentar actualizar la base de datos: ${error}`);
          console.error(`Error al intentar actualizar la base de datos: ${error}`);
          res.sendStatus(500);
        });
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al buscar al docente: ${error}`);
      console.error(`Error al buscar al docente: ${error}`);
      res.sendStatus(500);
    });
});

/**
 * @swagger
 * /doc/{id}:
 *   delete:
 *     summary: Eliminar un docente por ID
 *     description: Elimina a un docente según su ID.
 *     tags:
 *       - Docentes
 *     security:
 *       - jwt: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del docente a eliminar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Docente eliminado con éxito
 *       404:
 *         description: Docente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete("/:id",authMiddleware.verifyAdmin, (req, res) => {
  findDocente(req.params.id,{
    onSuccess: docente => {
      docente
      .destroy()
      .then(() => {
        logsUtils.guardarLog(`Docente eliminado con exito`);
        res.sendStatus(200)
      })
      .catch(error => {
        logsUtils.guardarLog(`Error al intentar eliminar al docente`);
        console.error("Error al intentar eliminar al docente: ${error}");
        res.sendStatus(500);
      });
    },    
    onNotFound: () => {
      logsUtils.guardarLog(`Error: docente no encontrado`);
      res.sendStatus(404)
    },
    onError: () => {
      logsUtils.guardarLog(`Error al eliminar al docente`);
      res.sendStatus(500)
    }
  }); 
});

module.exports = router;