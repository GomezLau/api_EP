var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");

router.get("/", (req, res) => {
  //console.log("Esto es un mensaje para ver en consola");
  models.alumno
    .findAll({
      attributes: ["id", "nombre","apellido","edad","idCarrera"],
      include:[
        {as:'Carrera-Relacionada', model:models.carrera, attributes: ["id","nombre"]}
      ]
    })
    .then(alumnos => {
      //Log exitoso cuando se obtienen los docentes
      logsUtils.guardarLog("Consulta exitosa a la lista de alumnos");
      res.send(alumnos);
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al consultar las alumnos: ${error.message}`);
      console.error("Error al consultar las alumnos:", error);
      res.sendStatus(500);
    });
});

router.post("/", (req, res) => {
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

router.put("/:id", (req, res) => {
  const onSuccess = alumno =>
  alumno
      .update({ nombre: req.body.nombre, apellido: req.body.apellido, edad: req.body.edad, idCarrera:req.body.idCarrera }, { fields: ["nombre", "apellido", "edad", "idCarrera"] })
      .then(() => res.sendStatus(200))
      .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          logsUtils.guardarLog(`Error de validacion al actualizar`),
          res.status(400).send('Bad request: existe otro alumno con el mismo nombre')
        }
        else {
          logsUtils.guardarLog(`Error al intentar actualizar la base de datos: ${error}`)
          console.log(`Error al intentar actualizar la base de datos: ${error}`)
          res.sendStatus(500)
        }
      });
      findAlumno(req.params.id, {
        onSuccess:() => logsUtils.guardarLog(`Alumno actualizado correctamente`),
        onNotFound: () => {
          logsUtils.guardarLog(`Alumno no encontrado`);
          res.sendStatus(404)
        },
        onError: () => {
          logsUtils.guardarLog(`Error al buscar al alumno`);
          res.sendStatus(500)
        }
  });
});

router.delete("/:id", (req, res) => {
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