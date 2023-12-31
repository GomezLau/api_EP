var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");
const authMiddleware = require("../utils/authMiddleware");

/**
 * @swagger
 * /al:
 *   get:
 *     summary: Obtener lista de alumnos paginada
 *     tags: [Alumnos]
 *     description: Devuelve una lista paginada de alumnos.
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
 *         description: Lista de alumnos obtenida con éxito
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               pageSize: 10
 *               totalAlumnos: 50
 *               alumnos:
 *                 - id: 1
 *                   nombre: "Nombre"
 *                   apellido: "Apellido"
 *                   edad: 25
 *                   idCarrera: 1
 *                   CarreraRelacionada:
 *                     id: 1
 *                     nombre: "NombreCarrera"
 *                 # ... Otros alumnos
 *       500:
 *         description: Error interno del servidor
 */
router.get("/", (req, res) => {

  //PAGINACION
  const page = parseInt(req.query.page) || 1; // Número de página solicitada (por defecto: 1)
  const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de la página solicitada (por defecto: 10)
  const offset = (page - 1) * pageSize; // Calcular el índice de inicio para la paginación

  models.alumno
    .findAndCountAll({
      attributes: ["id", "nombre","apellido","edad","idCarrera"],
      include:[
        {as:'CarreraRelacionada', model:models.carrera, attributes: ["id","nombre"]}
      ],
      limit: pageSize, // Limitar la cantidad de resultados por página
      offset: offset // Saltar los resultados anteriores a la página actual
    })
    .then(alumnos => {
      //Log exitoso cuando se obtienen los docentes
      logsUtils.guardarLog("Consulta exitosa a la lista de alumnos");
      res.json({
        page: page,
        pageSize: pageSize,
        totalAlumnos: alumnos.count,
        alumnos: alumnos.rows
      });
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al consultar las alumnos: ${error.message}`);
      console.error("Error al consultar las alumnos:", error);
      res.sendStatus(500);
    });
});

/**
 * @swagger
 * /al:
 *   post:
 *     summary: Crear un nuevo alumno
 *     description: Crea un nuevo alumno con la información proporcionada.
 *     tags:
 *       - Alumnos
 *     security:
 *       - jwt: []
 *     requestBody:
 *       description: Datos del nuevo alumno
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
 *               edad:
 *                 type: integer
 *               idCarrera:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Alumno creado con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *       400:
 *         description: Bad request, alumno duplicado o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post("/",authMiddleware.verifyAdmin, (req, res) => {
  models.alumno
    .create({ nombre: req.body.nombre, apellido: req.body.apellido , edad: req.body.edad , idCarrera: req.body.idCarrera })
    .then(alumno => {
      logsUtils.guardarLog("Post exitoso en la lista de alumnos");
      res.status(201).send({ id: alumno.id })
    })
    .catch(error => {
      if (error == "SequelizeUniqueConstraintError: Validation error") {
        logsUtils.guardarLog(`Error en POST, alumno duplicado: ${error.message}`);
        res.status(400).send('Bad request: existe otro alumno con el mismo nombre')
      }
      else {
        console.log(`Error al intentar insertar en la base de datos: ${error}`)
        logsUtils.guardarLog(`Error en POST, error al insertar: ${error.message}`);
        res.sendStatus(500)
      }
    });
});

/**
 * @swagger
 * /al/{id}:
 *   get:
 *     summary: Obtener un alumno por ID
 *     description: Obtiene los detalles de un alumno utilizando su ID.
 *     tags:
 *       - Alumnos
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del alumno a buscar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alumno encontrado con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "NombreAlumno"
 *               apellido: "ApellidoAlumno"
 *               edad: 25
 *               idCarrera: 1
 *               CarreraRelacionada:
 *                 id: 1
 *                 nombre: "NombreCarrera"
 *       404:
 *         description: Alumno no encontrado
 *       500:
 *         description: Error interno del servidor
 */
const findAlumno = (id, { onSuccess, onNotFound, onError }) => {
  models.alumno
    .findOne({
      attributes: ["id", "nombre","apellido","edad","idCarrera"],
      include:[{as:'CarreraRelacionada', model:models.carrera, attributes: ["id","nombre"]}],
      where: { id }
    })
    .then(alumno => (alumno ? onSuccess(alumno) : onNotFound()))
    .catch(() => onError());
};

/**
 * @swagger
 * /al/{id}:
 *   get:
 *     summary: Obtener un alumno por ID
 *     description: Obtiene los detalles de un alumno utilizando su ID.
 *     tags:
 *       - Alumnos
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del alumno a buscar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alumno encontrado con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "NombreAlumno"
 *               apellido: "ApellidoAlumno"
 *               edad: 25
 *               idCarrera: 1
 *               CarreraRelacionada:
 *                 id: 1
 *                 nombre: "NombreCarrera"
 *       404:
 *         description: Alumno no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get("/:id", (req, res) => {
  findAlumno(req.params.id, {
    onSuccess: alumno => {
      res.send(alumno), 
      logsUtils.guardarLog(`Busqueda de alumno exitosa`);
    },
    onNotFound: () => {
      res.sendStatus(404), 
      logsUtils.guardarLog(`No se encontro al alumno`);
    },
    onError: () => {
      res.sendStatus(500), 
      logsUtils.guardarLog(`Error al buscar al alumno`);
    }
  });
});

/**
 * @swagger
 * /al/{id}:
 *   put:
 *     summary: Actualizar información de un alumno por ID
 *     description: Actualiza la información de un alumno utilizando su ID.
 *     tags:
 *       - Alumnos
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del alumno a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       description: Datos actualizados del alumno
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
 *               edad:
 *                 type: integer
 *               idCarrera:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Alumno actualizado con éxito
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               nombre: "NombreActualizado"
 *               apellido: "ApellidoActualizado"
 *               edad: 26
 *               idCarrera: 2
 *       404:
 *         description: Alumno no encontrado
 *       500:
 *         description: Error interno del servidor
 *     security:
 *       - jwt: []
 */
router.put("/:id", authMiddleware.verifyAdmin, (req, res) => {
  
  //Guardo el ID y los datos para la actualizacion
  const alumnoId = req.params.id;
  const updatedAlumno = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    edad: req.body.edad,
    idCarrera: req.body.idCarrera
  };

  //Busco al alumno por ID (Pk=Primary Key)
  models.alumno.findByPk(alumnoId)
    .then(alumno => {
      if (!alumno) {
        logsUtils.guardarLog(`Alumno no encontrado`);
        return res.sendStatus(404);
      }

      //Si encuentro al alumno usa el metodo update para actualizar al alumno con los datos de updatedAlumno
      return alumno
        .update(updatedAlumno, { fields: ["nombre", "apellido", "edad", "idCarrera"] })
        .then(updatedAlumno => {
          logsUtils.guardarLog(`Alumno actualizado correctamente`);
          res.status(200).json(updatedAlumno);
        })
        .catch(error => {
          logsUtils.guardarLog(`Error al intentar actualizar la base de datos: ${error}`);
          console.error(`Error al intentar actualizar la base de datos: ${error}`);
          res.sendStatus(500);
        });
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al buscar al alumno: ${error}`);
      console.error(`Error al buscar al alumno: ${error}`);
      res.sendStatus(500);
    });
});

/**
 * @swagger
 * /al/{id}:
 *   delete:
 *     summary: Eliminar un alumno por ID
 *     description: Elimina un alumno utilizando su ID.
 *     tags:
 *       - Alumnos
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID del alumno a eliminar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alumno eliminado con éxito
 *       404:
 *         description: Alumno no encontrado
 *       500:
 *         description: Error interno del servidor
 *     security:
 *       - jwt: []
 */
router.delete("/:id",authMiddleware.verifyAdmin, (req, res) => {
  findUser(req.params.id,{
    onSuccess: alumno => {
      alumno
            .destroy()
            .then(() => {
              logsUtils.guardarLog(`Alumno eliminado con exito`);
              res.sendStatus(200)
            })
            .catch(error => {
              logsUtils.guardarLog(`Error al intentar eliminar al alumno`);
              console.error("Error al intentar eliminar la alumno: ${error}");
              res.sendStatus(500);
            });
          },    
          onNotFound: () => {
            logsUtils.guardarLog(`Error: alumno no encontrado`);
            res.sendStatus(404)
          },
          onError: () => {
            logsUtils.guardarLog(`Error al eliminar la alumno`);
            res.sendStatus(500)
          }
  }); 
});

module.exports = router;