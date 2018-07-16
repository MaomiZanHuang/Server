'use strict';

module.exports = app => {
  const { INTEGER, STRING } = app.Sequelize;
  const GoodsCata = app.model.define('GoodsCata', {
    id: {
      type: INTEGER,
      primaryKey: true
    },
    cata_id: {
      type: INTEGER
    },
    title: {
      type: STRING
    },
    logo: {
      type: STRING
    },
    detail: {
      type: STRING
    },
    online: {
      type: INTEGER
    },
    sort_index: {
      type: INTEGER
    }
  }, {
    freezeTableName: true,
    tableName: 'goods_cata',
    timestamps: false
  });
  return GoodsCata;
}