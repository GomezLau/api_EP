var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");
const authMiddleware = require("../utils/authMiddleware");

/**
 * @swagger
 * /car:
 *   get:
 *     summary: Obtener lista de carreras con paginación
 *     description: Obtiene una lista de carreras con opciones de paginación.
 *     tags:
 *       - Carreras
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
 *         description: Lista de carreras obtenida con éxito
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               pageSize: 10
 *               totalCarreras: 20
 *               carreras:
 *                 - id: 1
 *                   nombre: "NombreCarrera1"
 *                   años: 4
 *                   MateriasRelacionadas:
 *                     - idCarrera: 1
 *                       nombre: "Materia1"
 *                   Docentes:
 *                     - id: 1
 *                       nombre: "NombreDocente1"
 *                       apellido: "ApellidoDocente1"
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", (req, res) => {
  
  //PAGINACION
  const page = parseInt(req.query.page) || 1; // Número de página solicitada (por defecto: 1)
  const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de la página solicitada (por defecto: 10)
  const offset = (page - 1) * pageSize; // Calcular el índice de inicio para la paginación

  models.carrera
    .findAndCountAll({
      attributes: ["id", "nombre", "años"],
      include:[
        {
          as:'MateriasRelacionadas', 
          model:models.materia, 
          attributes: ["idCarrera","nombre"],
          foreignKey: 'idCarrera'
        },
        {
          as:'Docentes',
          model:models.docente,
          attributes: ["id","nombre","apellido"],
          //foreignKey:'idCarrera',
          //otherKey:'idDocente'
        }
      ],
      limit: pageSize, // Limitar la cantidad de resultados por página
      offset: offset // Saltar los resultados anteriores a la página actual     
    })
    .then(carreras => {
      //Log exitoso cuando se obtienen los docentes
      logsUtils.guardarLog("Consulta exitosa a la lista de carreras");
      res.json({
        page: page,
        pageSize: pageSize,
        totalCarreras: carreras.count,
        carreras: carreras.rows
      });
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al consultar las carreras: ${error.message}`);
      console.error("Error al consultar las carreras:", error);
      res.sendStatus(500);
    });
});

/**
 * @swagger
 * /car:
 *   post:
 *     summary: Crear una nueva carrera
 *     description: Crea una nueva carrera con la información proporcionada.
 *     tags:
 *       - Carreras
 *     security:
 *       - jwt: []
 *     requestBody:
 *       description: Datos de la nueva carrera
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               años:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Carrera creada con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *       400:
 *         description: Bad request, carrera duplicada o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post("/", authMiddleware.verifyAdmin, (req, res) => {
  models.carrera
    .create({ nombre: req.body.nombre, años: req.body.años })
    .then(carrera => {
      logsUtils.guardarLog("Post exitoso en la lista de carreras");
      res.status(201).send({ id: carrera.id })
    })
    .catch(error => {
      if (error == "SequelizeUniqueConstraintError: Validation error") {
        logsUtils.guardarLog(`Error en POST, carrera duplicada: ${error.message}`);
        res.status(400).send('Bad request: existe otra carrera con el mismo nombre')
      }
      else {
        console.log(`Error al intentar insertar en la base de datos: ${error}`)
        logsUtils.guardarLog(`Error en POST, error al insertar: ${error.message}`);
        res.sendStatus(500)
      }
    });
});

const findCarrera = (id, { onSuccess, onNotFound, onError }) => {
  models.carrera
    .findOne({
      attributes: ["id", "nombre", "años"],
      where: { id }
    })
    .then(carrera => (carrera ? onSuccess(carrera) : onNotFound()))
    .catch(() => onError());
};

/**
 * @swagger
 * /car/{id}:
 *   get:
 *     summary: Obtener detalles de una carrera por ID
 *     description: Obtiene detalles de una carrera específica según su ID.
 *     tags:
 *       - Carreras
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID de la carrera a obtener
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles de la carrera obtenidos con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "NombreCarrera1"
 *               años: 4
 *               MateriasRelacionadas:
 *                 - idCarrera: 1
 *                   nombre: "Materia1"
 *               Docentes:
 *                 - id: 1
 *                   nombre: "NombreDocente1"
 *                   apellido: "ApellidoDocente1"
 *       404:
 *         description: Carrera no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:id", (req, res) => {
  findCarrera(req.params.id, {
    onSuccess: carrera => {
      res.send(carrera), 
      logsUtils.guardarLog(`Busqueda de carrera exitosa`);
    },
    onNotFound: () => {
      res.sendStatus(404), 
      logsUtils.guardarLog(`No se encontro la carrera`);
    },
    onError: () => {
      res.sendStatus(500), 
      logsUtils.guardarLog(`Error al buscar la carrera`);
    }
  });
});

/**
 * @swagger
 * /car/{id}:
 *   put:
 *     summary: Actualizar una carrera por ID
 *     description: Actualiza una carrera específica según su ID.
 *     tags:
 *       - Carreras
 *     security:
 *       - jwt: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID de la carrera a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       description: Datos actualizados de la carrera
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               años:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Carrera actualizada con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "NuevoNombreCarrera"
 *               años: 5
 *       404:
 *         description: Carrera no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put("/:id",authMiddleware.verifyAdmin, (req, res) => {
  
  //Guardo el ID y los datos para la actualizacion
  const carreraId = req.params.id;
  const updatedCarrera = {
    nombre: req.body.nombre,
    años: req.body.años,
  };

  //Busco la carrera por ID (Pk=Primary Key)
  models.carrera.findByPk(carreraId)
    .then(carrera => {
      if (!carrera) {
        logsUtils.guardarLog(`Carrera no encontrada`);
        return res.sendStatus(404);
      }

      //Si encuentro la carrera usa el metodo update para actualizar la carrera con los datos de updatedCarrera
      return carrera
        .update(updatedCarrera, { fields: ["nombre", "años"] })
        .then(updatedCarrera => {
          logsUtils.guardarLog(`Carrera actualizada correctamente`);
          res.status(200).json(updatedCarrera);
        })
        .catch(error => {
          logsUtils.guardarLog(`Error al intentar actualizar la base de datos: ${error}`);
          console.error(`Error al intentar actualizar la base de datos: ${error}`);
          res.sendStatus(500);
        });
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al buscar al carrera: ${error}`);
      console.error(`Error al buscar al carrera: ${error}`);
      res.sendStatus(500);
    });
});

/**
 * @swagger
 * /car/{id}:
 *   delete:
 *     summary: Eliminar una carrera por ID
 *     description: Elimina una carrera específica según su ID.
 *     tags:
 *       - Carreras
 *     security:
 *       - jwt: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID de la carrera a eliminar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Carrera eliminada con éxito
 *       404:
 *         description: Carrera no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete("/:id",authMiddleware.verifyAdmin, (req, res) => {
  findCarrera(req.params.id,{
    onSuccess: carrera => {
      carrera
      .destroy()
      .then(() => {
        logsUtils.guardarLog(`Carrera eliminada con exito`);
        res.sendStatus(200)
      })
      .catch(error => {
        logsUtils.guardarLog(`Error al intentar eliminar la carrera`);
        console.error("Error al intentar eliminar la carrera: ${error}");
        res.sendStatus(500);
      });
    },    
    onNotFound: () => {
      logsUtils.guardarLog(`Error: carrera no encontrada`);
      res.sendStatus(404)
    },
    onError: () => {
      logsUtils.guardarLog(`Error al eliminar la carrera`);
      res.sendStatus(500)
    }
  }); 
});

module.exports = router;
