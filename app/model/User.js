'use strict';
module.exports = app => {
  const { INTEGER, STRING } = app.Sequelize;
  const User = app.model.define('User', {
    id: {
      type: INTEGER,
      primaryKey: true
    },
    user: {
      type: STRING
    },
    qq: {
      type: STRING
    },
    mobile: {
      type: STRING
    },
    email: {
      type: STRING
    },
    login_pwd: {
      type: STRING
    },
    pay_pwd: {
      type: STRING
    },
    last_checkin_time: {
      type: STRING
    },
    reg_time: {
      type: STRING
    }
    
  }, {
    freezeTableName: true,
    tableName: 'user_user',
    timestamps: false
  });
  return User;
}