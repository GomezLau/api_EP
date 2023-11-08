var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");

router.get("/", (req, res) => {
  //console.log("Esto es un mensaje para ver en consola");
  models.carrera
    .findAll({
      attributes: ["id", "nombre"],
      include:[
        {as:'Alumnos-Relacionados', model:models.alumno, attributes: ["id","nombre","apellido"]}
      ]      
    })
    .then(carreras => {
      //Log exitoso cuando se obtienen los docentes
      logsUtils.guardarLog("Consulta exitosa a la lista de carreras");
      res.send(carreras);
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al consultar las carreras: ${error.message}`);
      console.error("Error al consultar las carreras:", error);
      res.sendStatus(500);
    });
});

router.post("/", (req, res) => {
  models.carrera
    .create({ nombre: req.body.nombre })
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
      attributes: ["id", "nombre"],
      where: { id }
    })
    .then(carrera => (carrera ? onSuccess(carrera) : onNotFound()))
    .catch(() => onError());
};

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

router.put("/:id", (req, res) => {
  const onSuccess = carrera =>
    carrera
      .update({ nombre: req.body.nombre }, { fields: ["nombre"] })
      .then(() => res.sendStatus(200))
      .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          logsUtils.guardarLog(`Error de validacion al actualizar`),
          res.status(400).send('Bad request: existe otra carrera con el mismo nombre')
        }
        else {
          logsUtils.guardarLog(`Error al intentar actualizar la base de datos: ${error}`)
          console.log(`Error al intentar actualizar la base de datos: ${error}`)
          res.sendStatus(500)
        }
      });
      findCarrera(req.params.id, {
        onSuccess:() => logsUtils.guardarLog(`Carrera actualziada correctamente`),
        onNotFound: () => {
          logsUtils.guardarLog(`Carrera no encontrada`);
          res.sendStatus(404)
        },
        onError: () => {
          logsUtils.guardarLog(`Error al buscar la Carrera`);
          res.sendStatus(500)
        }
  });
});

router.delete("/:id", (req, res) => {
  findCarrera(req.params.id,{
    onSuccess: carrera => {
      carrera
      .destroy()
      .then(() => {
        logsUtils.guardarLog(`carrera eliminada con exito`);
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
