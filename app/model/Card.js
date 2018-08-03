'use strict';
module.exports = app => {
  const { INTEGER, STRING, FLOAT } = app.Sequelize;
  const Card = app.model.define('Card', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    card_no: {
      type: STRING
    },
    price: {
      type: FLOAT
    },
    points: {
      type: INTEGER
    },
    gen_time: {
      type: STRING
    },
    activate_time: {
      type: STRING
    },
    charge_user: {
      type: STRING
    }
  }, {
    freezeTableName: true,
    tableName: 'card',
    timestamps: false
  });
  return Card;
}