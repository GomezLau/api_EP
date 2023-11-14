var express = require("express");
var router = express.Router();
var models = require("../models");
const logsUtils = require("../utils/logsUtils");
const authMiddleware = require("../utils/authMiddleware");
const bcrypt = require('bcrypt');

router.get("/", (req, res) => {
  console.log("Esto es un mensaje para ver en consola");
  models.user
    .findAll({
      attributes: ["id", "name","password"],
    })
    .then(users => {
      logsUtils.guardarLog(`Usuario consultado con exito`);
      res.send(users)
    })
    .catch(() => res.sendStatus(500));
});

router.post("/", async (req, res) => {

  const saltRounds = 10; // Número de rondas de trabajo
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  
  models.user
    .create({ name: req.body.name, password: hashedPassword })
    .then(user => {
      logsUtils.guardarLog(`Usuario Registrado con exito`);
      res.status(201).send({ id: user.id })
    })
    .catch(error => {
      if (error == "SequelizeUniqueConstraintError: Validation error") {
        logsUtils.guardarLog(`Error el usuario ya existe`);
        res.status(400).send('Bad request: existe otro usuario con el mismo nombre')
      }
      else {
        logsUtils.guardarLog(`Error al acceder a la base de datos`);
        console.log(`Error al intentar insertar en la base de datos: ${error}`)
        res.sendStatus(500)
      }
    });
});

const findUser = (id, { onSuccess, onNotFound, onError }) => {
  models.user
    .findOne({
      attributes: ["id", "name", "password"],
      where: { id }
    })
    .then(user => (user ? onSuccess(user) : onNotFound()))
    .catch(() => onError());
};

router.get("/:id", (req, res) => {
  findUser(req.params.id, {
    onSuccess: user => {
      logsUtils.guardarLog(`Usuario encontrado con exito`);
      res.send(user)
    },
    onNotFound: () => {
      logsUtils.guardarLog(`Usuario no encontrado `);
      res.sendStatus(404)
    },
    onError: () => {
      logsUtils.guardarLog(`Error al buscar el usuario`);
      res.sendStatus(500)
    }
  });
});

router.put("/:id", async(req, res) => {

  const saltRounds = 10; // Número de rondas de trabajo
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

  const onSuccess = user =>
  user
      .update({ name: req.body.name, password:hashedPassword }, { fields: ["name", "password"] })
      .then(() => res.sendStatus(200))
      .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          logsUtils.guardarLog(`Error: Ya existe un usuario con el mismo nombre`);
          res.status(400).send('Bad request: existe otro usuario con el mismo nombre')
        }
        else {
          logsUtils.guardarLog(`Error al actualizar la base de datos`);
          console.log(`Error al intentar actualizar la base de datos: ${error}`)
          res.sendStatus(500)
        }
      });
      findUser(req.params.id, {
    onSuccess: () => logsUtils.guardarLog(`Usuario actualizado con exito`),
    onNotFound: () => {
      logsUtils.guardarLog(`Usuario no encontrado`);
      res.sendStatus(404)
    },
    onError: () => {
      logsUtils.guardarLog(`Error al buscar el usuario`);
      res.sendStatus(500)
    }
  });
});

router.delete("/:id",authMiddleware.verifyAdmin, (req, res) => {
  findUser(req.params.id,{
    onSuccess: user => {
        user
            .destroy()
            .then(() => {
              logsUtils.guardarLog(`Usuario eliminado con exito`);
              res.sendStatus(200)
            })
            .catch(error => {
              logsUtils.guardarLog(`Error al intentar eliminar el usuario`);
              console.error("Error al intentar eliminar el usuario: ${error}");
              res.sendStatus(500);
            });
    },    
    onNotFound: () => {
      logsUtils.guardarLog(`Error: Usuario no encontrado`);
      res.sendStatus(404)
    },
    onError: () => {
      logsUtils.guardarLog(`Error al eliminar el usuario`);
      res.sendStatus(500)
    }
  }); 
});


module.exports = router;