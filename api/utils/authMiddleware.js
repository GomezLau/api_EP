const jwt = require("jsonwebtoken");
const logsUtils = require("../utils/logsUtils");
require('dotenv').config();

function verifyAdmin(req, res, next){
  const decodedToken = jwt.verify(req.headers.authorization, process.env.SECRET)



  if (decodedToken.id == 5){
      console.log("Credenciales de administrador verificadas correctamente");
      logsUtils.guardarLog(`Credenciales de administrador verificadas correctamente`);
      next();
  } else {
      console.log("Credenciales invalidas");
      logsUtils.guardarLog(`Error en las credenciales`);
      return res.status(401); 
  }
}




module.exports = {
  verifyAdmin
};