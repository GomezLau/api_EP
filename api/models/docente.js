'use strict';
module.exports = (sequelize, DataTypes) => {
  const docente = sequelize.define('docente', {
    nombre: DataTypes.STRING,
    apellido: DataTypes.STRING,
    idMateria: DataTypes.INTEGER,
    idCarrera: DataTypes.INTEGER
  }, {});
  docente.associate = function(models) {
    // associations can be defined here
  };
  return docente;
};