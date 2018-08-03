'use strict';
module.exports = app => {
  const { INTEGER, STRING, FLOAT } = app.Sequelize;
  const BalanceChangelog = app.model.define('BalanceChangelog', {
    id: {
      type: INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user: {
      type: STRING
    },
    type: {
      type: STRING
    },
    change_amt: {
      type: FLOAT
    },
    before_balance: {
      type: FLOAT
    },
    balance: {
      type: FLOAT
    },
    time: {
      type: STRING
    },
    remark: {
      type: STRING
    }
    
  }, {
    freezeTableName: true,
    tableName: 'balance_changelog',
    timestamps: false
  });
  return BalanceChangelog;
}