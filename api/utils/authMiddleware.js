const jwt = require("jsonwebtoken");
var models = require("../models");

const secretKey = "12345";


function generateToken(req,user) {
  
  return jwt.sign({ user }, secretKey, { expiresIn: '1h' }); 
}

function authenticateToken(req, res, next) {
  
  const token = req.headers.authorization;

  if (!token) {
    return res.sendStatus(401); // No autorizado
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next(); // Continúa con la siguiente función
  });
}

// Autenticar Credenciales -> "admin" "passw"
async function authenticateCredentials(nombre, password) {
  if(nombre== undefined || password== undefined){
    return false
  }
  const user = await models.user.findOne({
    where: {
      name: nombre,
      password: password
    },
  });
  console.log("authenticateCredentials")
  return user !== null;

}




module.exports = {
  generateToken,
  authenticateToken,
  authenticateCredentials
};