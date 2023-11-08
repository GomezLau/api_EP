var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");
const authRoutes = require("../routes/authRoutes");

router.get("/", (req, res) => {
  //console.log("Esto es un mensaje para ver en consola");

  models.materia
    .findAll({
      attributes: ["id", "nombre","id_carrera"],
      include:[
        {as:'Carrera-relacionada', model:models.carrera, attributes: ["id","nombre"]},
      ]
    })
    .then(materias => {
      //Log exitoso cuando se obtienen las materias
      logsUtils.guardarLog("Consulta exitosa a la lista de materias");
      res.send(materias);
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al consultar las materias: ${error.message}`);
      console.error("Error al consultar las materias:", error);
      res.sendStatus(500);
    });
});

router.post("/", (req, res) => {


  models.materia
    .create({ nombre: req.body.nombre, id_carrera: req.body.id_carrera })
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
      attributes: ["id", "nombre", "id_carrera"],
      where: { id }
    })
    .then(materia => (materia ? onSuccess(materia) : onNotFound()))
    .catch(() => onError());
};

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

router.put("/:id", (req, res) => {
  const onSuccess = materia =>
  materia
      .update({ nombre: req.body.nombre, id_carrera:req.body.id_carrera }, { fields: ["nombre", "id_carrera"] })
      .then(() => res.sendStatus(200))
      .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          logsUtils.guardarLog(`Error de validacion al actualizar`),
          res.status(400).send('Bad request: existe otra materia con el mismo nombre')
        }
        else {
          logsUtils.guardarLog(`Error al intentar actualizar la base de datos: ${error}`)
          console.log(`Error al intentar actualizar la base de datos: ${error}`)
          res.sendStatus(500)
        }
      });
      findMateria(req.params.id, {
    onSuccess:() => logsUtils.guardarLog(`Materia actualziada correctamente`),
    onNotFound: () => {
      logsUtils.guardarLog(`Materia no encontrada`);
      res.sendStatus(404)
    },
    onError: () => {
      logsUtils.guardarLog(`Error al buscar la materia`);
      res.sendStatus(500)
    }
  });
});

router.delete("/:id", (req, res) => {
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