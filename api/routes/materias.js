var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");
const authMiddleware = require("../utils/authMiddleware");

/**
 * @swagger
 * /mat:
 *   get:
 *     summary: Obtener lista de materias paginadas
 *     description: Retorna una lista paginada de materias.
 *     tags:
 *       - Materias
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
 *         description: Lista de materias paginadas
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               pageSize: 10
 *               totalMaterias: 100
 *               materias: [{ id: 1, nombre: "Materia1", idCarrera: 1, idDocente: 1, Carrera: { id: 1, nombre: "Carrera1" }, Docente: { id: 1, nombre: "Docente1", apellido: "Apellido1" } }, ...]
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", (req, res) => {
  
  //PAGINACION
  const page = parseInt(req.query.page) || 1; // Número de página solicitada (por defecto: 1)
  const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de la página solicitada (por defecto: 10)
  const offset = (page - 1) * pageSize; // Calcular el índice de inicio para la paginación
  
  models.materia
    .findAndCountAll({
      attributes: ["id", "nombre","idCarrera", "idDocente"],
      include:[
        {as:'Carrera', model:models.carrera, attributes: ["id","nombre"]},
        {as:'Docente', model:models.docente, attributes: ["id","nombre","apellido"]}
      ],
      limit: pageSize, // Limitar la cantidad de resultados por página
      offset: offset // Saltar los resultados anteriores a la página actual
    })
    .then(materias => {
      //Log exitoso cuando se obtienen las materias
      logsUtils.guardarLog("Consulta exitosa a la lista de materias");
      //res.send(materias);
      res.json({
        page: page,
        pageSize: pageSize,
        totalMaterias: materias.count,
        materias: materias.rows
      });
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al consultar las materias: ${error.message}`);
      console.error("Error al consultar las materias:", error);
      res.sendStatus(500);
    });
});

/**
 * @swagger
 * /mat:
 *   post:
 *     summary: Crear una nueva materia
 *     description: Crea una nueva materia con la información proporcionada.
 *     tags:
 *       - Materias
 *     security:
 *       - jwt: []
 *     requestBody:
 *       description: Datos de la materia a crear
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               idCarrera:
 *                 type: integer
 *               idDocente:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Materia creada con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *       400:
 *         description: Bad request, materia duplicada o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post("/",authMiddleware.verifyAdmin, (req, res) => {
  models.materia
    .create({ nombre: req.body.nombre, idCarrera: req.body.idCarrera, idDocente: req.body.idDocente })
    .then(materia => {
      logsUtils.guardarLog("Post exitoso en la lista de materias");
      res.status(201).send({ id: materia.id })
    })
    .catch(error => {
      if (error == "SequelizeUniqueConstraintError: Validation error") {
        logsUtils.guardarLog(`Error en POST, materia duplicada: ${error.message}`);
        res.status(400).send('Bad request: existe otra materia con el mismo nombre')
      }
      else {
        console.log(`Error al intentar insertar en la base de datos: ${error}`)
        logsUtils.guardarLog(`Error en POST, error al insertar: ${error.message}`);
        res.sendStatus(500)
      }
    });
});

const findMateria = (id, { onSuccess, onNotFound, onError }) => {
  models.materia
    .findOne({
      attributes: ["id", "nombre", "idCarrera", "idDocente"],
      where: { id }
    })
    .then(materia => (materia ? onSuccess(materia) : onNotFound()))
    .catch(() => onError());
};

/**
 * @swagger
 * /mat/{id}:
 *   get:
 *     summary: Obtener información de una materia por su ID
 *     description: Obtiene información detallada de una materia utilizando su ID.
 *     tags:
 *       - Materias
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la materia a obtener
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Materia encontrada con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "Nombre de la materia"
 *               idCarrera: 2
 *               idDocente: 3
 *       404:
 *         description: Materia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:id", (req, res) => {
  findMateria(req.params.id, {
    onSuccess: materia => {
      res.send(materia), 
      logsUtils.guardarLog(`Busqueda de materia exitosa`);
    },
    onNotFound: () => {
      res.sendStatus(404), 
      logsUtils.guardarLog(`No se encontro la materia`);
    },
    onError: () => {
      res.sendStatus(500), 
      logsUtils.guardarLog(`Error al buscar la materia`);
    }
  });
});

/**
 * @swagger
 * /mat/{id}:
 *   put:
 *     summary: Actualizar información de una materia por su ID
 *     description: Actualiza la información de una materia utilizando su ID.
 *     tags:
 *       - Materias
 *     security:
 *      - jwt: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la materia a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *         description: Nuevos datos de la materia
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nombre:
 *                   type: string
 *                 idCarrera:
 *                   type: integer
 *                 idDocente:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Materia actualizada con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "Nuevo nombre de la materia"
 *               idCarrera: 2
 *               idDocente: 3
 *       404:
 *         description: Materia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put("/:id",authMiddleware.verifyAdmin, (req, res) => {
  //Guardo el ID y los datos para la actualizacion
  const materiaId = req.params.id;
  const updatedMateria = {
    nombre: req.body.nombre,
    idCarrera: req.body.idCarrera,
    idDocente: req.body.idDocente
  };

  //Busco la materia por ID (Pk=Primary Key)
  models.materia.findByPk(materiaId)
    .then(materia => {
      if (!materia) {
        logsUtils.guardarLog(`Materia no encontrada`);
        return res.sendStatus(404);
      }

      //Si encuentro la materia usa el metodo update para actualizar la materia con los datos de updatedMateria
      return materia
        .update(updatedMateria, { fields: ["nombre", "idCarrera", "idDocente"] })
        .then(updatedMateria => {
          logsUtils.guardarLog(`Materia actualizada correctamente`);
          res.status(200).json(updatedMateria);
        })
        .catch(error => {
          logsUtils.guardarLog(`Error al intentar actualizar la base de datos: ${error}`);
          console.error(`Error al intentar actualizar la base de datos: ${error}`);
          res.sendStatus(500);
        });
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al buscar la materia: ${error}`);
      console.error(`Error al buscar la materia: ${error}`);
      res.sendStatus(500);
    });
});

/**
 * @swagger
 * /mat/{id}:
 *   delete:
 *     summary: Eliminar una materia por su ID
 *     description: Elimina una materia utilizando su ID.
 *     tags:
 *       - Materias
 *     security:
 *       - jwt: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la materia a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Materia eliminada con éxito
 *       404:
 *         description: Materia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete("/:id",authMiddleware.verifyAdmin, (req, res) => {
  findMateria(req.params.id,{
    onSuccess: materia => {
      materia
      .destroy()
      .then(() => {
        logsUtils.guardarLog(`Materia eliminada con exito`);
        res.sendStatus(200)
      })
      .catch(error => {
        logsUtils.guardarLog(`Error al intentar eliminar la materia`);
        console.error("Error al intentar eliminar la materia: ${error}");
        res.sendStatus(500);
      });
    },    
    onNotFound: () => {
      logsUtils.guardarLog(`Error: Materia no encontrada`);
      res.sendStatus(404)
    },
    onError: () => {
      logsUtils.guardarLog(`Error al eliminar la materia`);
      res.sendStatus(500)
    }
  }); 
});

module.exports = router;