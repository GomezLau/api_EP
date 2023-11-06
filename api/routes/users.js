var express = require("express");
var router = express.Router();
var models = require("../models");

router.get("/", (req, res) => {
  console.log("Esto es un mensaje para ver en consola");
  models.user
    .findAll({
      attributes: ["id", "name","password"],
    })
    .then(users => res.send(users))
    .catch(() => res.sendStatus(500));
});

router.post("/", (req, res) => {
  models.user
    .create({ name: req.body.name, password: req.body.password })
    .then(user => res.status(201).send({ id: user.id }))
    .catch(error => {
      if (error == "SequelizeUniqueConstraintError: Validation error") {
        res.status(400).send('Bad request: existe otro usuario con el mismo nombre')
      }
      else {
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
    onSuccess: user => res.send(user),
    onNotFound: () => res.sendStatus(404),
    onError: () => res.sendStatus(500)
  });
});

router.put("/:id", (req, res) => {
  const onSuccess = user =>
  user
      .update({ name: req.body.name, password:req.body.password }, { fields: ["name", "password"] })
      .then(() => res.sendStatus(200))
      .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          res.status(400).send('Bad request: existe otro usuario con el mismo nombre')
        }
        else {
          console.log(`Error al intentar actualizar la base de datos: ${error}`)
          res.sendStatus(500)
        }
      });
      findUser(req.params.id, {
    onSuccess,
    onNotFound: () => res.sendStatus(404),
    onError: () => res.sendStatus(500)
  });
});

router.delete("/:id", (req, res) => {
  findUser(req.params.id,{
    onSuccess: user => {
        user
            .destroy()
            .then(() => res.sendStatus(200))
            .catch(error => {
                console.error("Error al intentar eliminar el usuario: ${error}");
                res.sendStatus(500);
            });
    },    
    onNotFound: () => res.sendStatus(404),
    onError: () => res.sendStatus(500)
  }); 
});


module.exports = router;