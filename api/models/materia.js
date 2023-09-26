'use strict';
module.exports = (sequelize, DataTypes) => {
  const materia = sequelize.define('materia', {
    nombre: DataTypes.STRING,
    id_carrera: DataTypes.INTEGER
  }, {});
  materia.associate = function(models) {
    materia.belongsTo(models.carrera,// modelo al que pertenece
    {
      as : 'carrera-a-la-que-pertenece',  // nombre de mi relacion
      foreignKey: 'id_carrera'     // campo con el que voy a igualar
    })

    materia.hasMany(models.docente),
    {
      as: 'docente',
      foreignKey: 'id'
    }
  };
  return materia;
};