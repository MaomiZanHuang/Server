'use strict';
module.exports = app => {
  const { INTEGER, STRING } = app.Sequelize;
  const Config = app.model.define('Config', {
    id: {
      type: INTEGER,
      primaryKey: true
    },
    key: {
      type: STRING
    },
    v: {
      type: STRING
    }
    
  }, {
    freezeTableName: true,
    tableName: 'config',
    timestamps: false
  });
  return Config;
}