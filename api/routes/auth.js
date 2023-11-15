const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
//const User = require("../models/user");
const bcrypt = require('bcrypt');
var models = require("../models");
const logsUtils = require("../utils/logsUtils");
require('dotenv').config();


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     description: Verifica las credenciales del usuario y genera un token de acceso.
 *     tags:
 *      - Login
 *     requestBody:
 *       description: Datos de inicio de sesión del usuario
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/securitySchemes/jwt'
 *             example:
 *               token: "token_de_acceso"
 *       401:
 *         description: Credenciales inválidas
 *     security:
 *       - jwt: []
 */
router.post("/login", async(req, res) => {
  // Verificar credenciales de usuario, conseguir el usuario de la db
    const { name, password } = req.body;
  
    const user = await models.user.findOne({
        where: {
            name: name
        }
    });

    if(!user){
        return res.status(401).json({
            error: 'invalid user'
        });
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);
    /*
    console.log('Contraseña proporcionada:', password);
    console.log('Contraseña almacenada en la base de datos:', user.password);
    console.log('Comparación de contraseñas:', passwordCorrect);
    */
    if(!passwordCorrect){
        return res.status(401).json({
            error: 'invalid password'
        });
    }

    const userForToken = {
        id: user.id,
        username: user.name
    };

    const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: '1h' })

    const decodedToken = jwt.verify(token, process.env.SECRET)

    logsUtils.guardarLog("Login succesfull")

    res.send({
        id: user.id,
        username: user.name,
        token,
        decodedToken
    });

});



module.exports = router;