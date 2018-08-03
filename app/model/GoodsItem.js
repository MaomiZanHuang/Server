'use strict';

module.exports = app => {
  const { INTEGER, STRING, JSON } = app.Sequelize;
  const GoodsItem = app.model.define('GoodsItem', {
    id: {
      type: INTEGER,
      auto_incement: true,
      primaryKey: true
    },
    cata_id: {
      type: INTEGER
    },
    goods_id: {
      type: STRING
    },
    title: {
      type: STRING
    },
    logo: {
      type: STRING
    },
    pics: {
      type: STRING
    },
    detail: {
      type: STRING
    },
    sort_index: {
      type: INTEGER
    },
    online: {
      type: INTEGER
    }
  }, {
    freezeTableName: true,
    tableName: 'goods_item',
    timestamps: false
  });

  
  return GoodsItem;
}