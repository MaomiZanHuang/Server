'use strict';
module.exports = app => {
  const { INTEGER, STRING, FLOAT } = app.Sequelize;
  const UserBalance = app.model.define('UserBalance', {
    id: {
      type: INTEGER,
      primaryKey: true
    },
    user: {
      type: STRING
    },
    balance: {
      type: FLOAT
    },
    points: {
      type: FLOAT
    },
    remark: {
      type: STRING
    }
    
  }, {
    freezeTableName: true,
    tableName: 'user_balance',
    timestamps: false
  });
  return UserBalance;
}