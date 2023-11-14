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
  

  models.docente
    .findAndCountAll({
      attributes: ["id", "nombre","apellido","idMateria","idCarrera"],
      include:[
        {as:'Materia', model:models.materia, attributes: ["id","nombre"]}
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

router.post("/",authMiddleware.verifyAdmin, (req, res) => {
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

router.put("/:id",authMiddleware.verifyAdmin, (req, res) => {

  //Guardo el ID y los datos para la actualizacion
  const docenteId = req.params.id;
  const updatedDocente = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    idMateria: req.body.idMateria,
    idCarrera: req.body.idCarrera
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
        .update(updatedDocente, { fields: ["nombre", "apellido", "idMateri", "idCarrera"] })
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
      logsUtils.guardarLog(`Error al buscar al alumno: ${error}`);
      console.error(`Error al buscar al alumno: ${error}`);
      res.sendStatus(500);
    });
});


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