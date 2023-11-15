'use strict';
module.exports = (sequelize, DataTypes) => {
  const carrera = sequelize.define('carrera', {
    nombre: DataTypes.STRING,
    años: DataTypes.INTEGER
  }, {});
  carrera.associate = function(models) {
  	//asociacion a carrera (pertenece a:)
    carrera.hasMany(models.materia, // Modelo 
    {
      as : 'MateriasRelacionadas',              // Nombre de la Relacion
      foreignKey: 'idCarrera'     // campo con el que voy a igualar
    })

    carrera.belongsToMany(models.docente, {
      through: 'materia', // Nombre de la tabla intermedia
      as: 'Docentes',
      foreignKey: 'idCarrera', // Campo en la tabla intermedia que hace referencia a la carrera
      otherKey: 'idDocente' // Campo en la tabla intermedia que hace referencia al docente
    });

  };
  return carrera;
};