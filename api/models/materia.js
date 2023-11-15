'use strict';
module.exports = (sequelize, DataTypes) => {
  const materia = sequelize.define('materia', {
    nombre: DataTypes.STRING,
    idCarrera: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'carrera', 
        key: 'id'
      }
    },
    idDocente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'docente', 
        key: 'id'
      }
    }
  }, {});
  materia.associate = function(models) {
    materia.belongsTo(models.carrera,// modelo al que pertenece
    {
      as : 'Carrera',  // nombre de mi relacion
      foreignKey: 'idCarrera'     // campo con el que voy a igualar
    });

    materia.belongsTo(models.docente,// modelo al que pertenece
    {
      as : 'Docente',  // nombre de mi relacion
      foreignKey: 'idDocente'     // campo con el que voy a igualar
    });

    

  };
  return materia;
};