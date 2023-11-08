var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");

router.get("/", (req, res) => {
  //console.log("Esto es un mensaje para ver en consola");
  models.docente
    .findAll({
      attributes: ["id", "nombre","apellido","idMateria","idCarrera"],
      include:[
        {as:'Materia', model:models.materia, attributes: ["id","nombre"]}
      ]
    })
    .then(docentes => {
      //Log exitoso cuando se obtienen los docentes
      logsUtils.guardarLog("Consulta exitosa a la lista de docentes");
      res.send(docentes);
    })
    .catch(error => {
      logsUtils.guardarLog(`Error al consultar los docentes: ${error.message}`);
      console.error("Error al consultar los docentes:", error);
      res.sendStatus(500);
    });
});

router.post("/", (req, res) => {
  models.docente
    .create({ nombre: req.body.nombre, apellido: req.body.apellido , idMateria: req.body.idMateria , idCarrera: req.body.idCarrera })
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
      attributes: ["id", "nombre","apellido","idMateria","idCarrera"],
      where: { id }
    })
    .then(docente => (docente ? onSuccess(docente) : onNotFound()))
    .catch(() => onError());
};

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

router.put("/:id", (req, res) => {
  const onSuccess = docente =>
    docente
      .update({ nombre: req.body.nombre, apellido: req.body.apellido, idMateria: req.body.idMateria, idCarrera:req.body.idCarrera }, { fields: ["nombre", "apellido", "idMateria", "idCarrera"] })
      .then(() => res.sendStatus(200))
      .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          logsUtils.guardarLog(`Error de validacion al actualizar`),
          res.status(400).send('Bad request: existe otro docente con el mismo nombre')
        }
        else {
          logsUtils.guardarLog(`Error al intentar actualizar la base de datos: ${error}`)
          console.log(`Error al intentar actualizar la base de datos: ${error}`)
          res.sendStatus(500)
        }
      });
      findDocente(req.params.id, {
        onSuccess:() => logsUtils.guardarLog(`Docente actualziado correctamente`),
        onNotFound: () => {
          logsUtils.guardarLog(`Docente no encontrada`);
          res.sendStatus(404)
        },
        onError: () => {
          logsUtils.guardarLog(`Error al buscar al docente`);
          res.sendStatus(500)
        }
  });
});

router.delete("/:id", (req, res) => {
  findDocente(req.params.id,{
    onSuccess: docente => {
      docente
      .destroy()
      .then(() => {
        logsUtils.guardarLog(`docente eliminado con exito`);
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