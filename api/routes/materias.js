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