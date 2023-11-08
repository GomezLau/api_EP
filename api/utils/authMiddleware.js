const jwt = require("jsonwebtoken");
var models = require("../models");

const secretKey = '12345';

function generateToken(user) {
  return jwt.sign({ user }, 'secretKey', { expiresIn: '1h' }); 
}

function authenticateToken(req, res, next) {
  

  const token = req.headers.authorization;

  if (!token) {
    return res.sendStatus(401); // No autorizado
  }

  jwt.verify(token, 'secretKey', (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next(); // Continúa con la siguiente función de middleware
  });
}

function authenticateCredentials(username, password) {
  
  const foundUser = models.user.findOne({
    where: {
      name: username,
      password: password,
    },
  })
  return foundUser !== null;
    
}



module.exports = {
  generateToken,
  authenticateToken,
  authenticateCredentials
};