'use strict';
module.exports = (sequelize, DataTypes) => {
  const carrera = sequelize.define('carrera', {
    nombre: DataTypes.STRING,
    materias: DataTypes.INTEGER,
    años: DataTypes.INTEGER
  }, {});
  carrera.associate = function(models) {
  	//asociacion a carrera (pertenece a:)
 /* 	carrera.hasMany(models.alumno,// modelo al que pertenece
    {
      as : 'Alumnos-Relacionados',  // nombre de mi relacion
      foreignKey: 'id'     // campo con el que voy a igualar
    })

    carrera.hasMany(models.materia, // Modelo 
    {
      as : 'Materias-Relacionadas',              // Nombre de la Relacion
      foreignKey: 'id_carrera'     // campo con el que voy a igualar
    })
*/
  };
  return carrera;
};