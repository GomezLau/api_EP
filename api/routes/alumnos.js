var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");
const authMiddleware = require("../utils/authMiddleware");

router.get("/", (req, res) => {

  //PAGINACION
  const page = parseInt(req.query.page) || 1; // Número de página solicitada (por defecto: 1)
  const pageSize = parseInt(req.query.pageSize) || 10; // Tamaño de la página solicitada (por defecto: 10)
  const offset = (page - 1) * pageSize; // Calcular el índice de inicio para la paginación

  models.alumno
    .findAndCountAll({
      attributes: ["id", "nombre","apellido","edad","idCarrera"],
      include:[
        {as:'Carrera-Relacionada', model:models.carrera, attributes: ["id","nombre"]}
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

router.post("/",authMiddleware.authenticateToken, (req, res) => {
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

const findAlumno = (id, { onSuccess, onNotFound, onError }) => {
  models.alumno
    .findOne({
      attributes: ["id", "nombre","apellido","edad","idCarrera"],
      include:[{as:'Carrera-Relacionada', model:models.carrera, attributes: ["id","nombre"]}],
      where: { id }
    })
    .then(alumno => (alumno ? onSuccess(alumno) : onNotFound()))
    .catch(() => onError());
};

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

router.put("/:id", authMiddleware.authenticateToken, (req, res) => {
  
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

router.delete("/:id",authMiddleware.authenticateToken, (req, res) => {
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