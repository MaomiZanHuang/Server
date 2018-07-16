'use strict';

module.exports = app => {
  const { INTEGER, STRING } = app.Sequelize;
  const Notice = app.model.define('Notice', {
    id: {
      type: INTEGER,
      primaryKey: true
    },
    title: {
      type: STRING
    },
    content: {
      type: STRING
    },
    create_time: {
      type: STRING
    },
    operator: {
      type: STRING
    }
  }, {
    freezeTableName: true,
    tableName: 'notice',
    timestamps: false
  });
  return Notice;
}