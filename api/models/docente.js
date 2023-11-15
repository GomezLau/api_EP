'use strict';
module.exports = (sequelize, DataTypes) => {
  const docente = sequelize.define('docente', {
    nombre: DataTypes.STRING,
    apellido: DataTypes.STRING,
  }, {});
  docente.associate = function(models) {
    // associations can be defined here
    docente.hasMany(models.materia, // Modelo 
    {
      as : 'MateriasRelacionadas',              // Nombre de la Relacion
      foreignKey: 'idDocente'     // campo con el que voy a igualar
    })

    docente.belongsToMany(models.carrera, {
      through: 'materia', // Nombre de la tabla intermedia
      as: 'Carrera',
      foreignKey: 'idCarrera', // Campo en la tabla intermedia que hace referencia a la carrera
      otherKey: 'idDocente' // Campo en la tabla intermedia que hace referencia al docente
    });
  };
  return docente;
};