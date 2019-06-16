'use strict';
module.exports = app => {
  const { INTEGER, STRING } = app.Sequelize;
  const Feedback = app.model.define('Feedback', {
    id: {
      type: INTEGER,
      primaryKey: true
    },
    user: {
      type: STRING
    },
    content: {
      type: STRING
    },
    response: {
      type: STRING
    },
    create_time: {
      type: STRING
    }
    
  }, {
    freezeTableName: true,
    tableName: 'feedback',
    timestamps: false
  });
  return Feedback;
}