'use strict';
module.exports = (sequelize, DataTypes) => {
  const alumno = sequelize.define('alumno', {
    nombre: DataTypes.STRING,
    apellido: DataTypes.STRING,
    edad: DataTypes.INTEGER,
    idCarrera: DataTypes.INTEGER
  }, {});
  alumno.associate = function(models) {
    // Asociaciones aca
    alumno.belongsTo(models.carrera,  // Modelo al que pertenece (relacxiona con el ID)
    {
      as: 'Carrera-Relacionada',                 // nombre de mi relacion
      foreignKey: 'idCarrera'       // campo con el que voy a igualar 
    })
  };


  return alumno;
};