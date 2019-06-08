'use strict';
module.exports = app => {
  const { STRING } = app.Sequelize;
  const User = app.model.define('QQUser', {
    open_id: {
      type: STRING,
      primaryKey: true
    },
    user: {
      type: STRING
    }
    
  }, {
    freezeTableName: true,
    tableName: 'qq_user',
    timestamps: false
  });
  return User;
}