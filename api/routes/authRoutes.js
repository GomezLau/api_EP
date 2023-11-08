const express = require("express");
const router = express.Router();
const authMiddleware = require("../utils/authMiddleware");



router.post("/login", async(req, res) => {
  // Verificar credenciales de usuario, conseguir el usuario de la db
  const { username, password } = req.body;
  var credenciales = await authMiddleware.authenticateCredentials(username, password);
  if(credenciales) {
        console.log("entre")
        const token = authMiddleware.generateToken({ id: 4, username });
        res.json({ token });
      }else{
        res.status(401).json({mensaje: "Credenciales incorrectas"});
      }
})
    


router.get("/public", (req, res) => {
  res.send("Publico")
})

router.get("/secure-route", authMiddleware.authenticateToken, (req, res) => {
  // Esta ruta está protegida y solo es accesible para usuarios autenticados
  res.json({ mensaje: "Ruta segura: Solo accesible para usuarios autenticados" });
});




module.exports = router;