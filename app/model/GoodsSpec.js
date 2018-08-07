'use strict';

module.exports = app => {
  const { INTEGER, STRING, FLOAT } = app.Sequelize;
  const GoodsSpec = app.model.define('GoodsSpec', {
    id: {
      type: INTEGER,
      auto_incement: true,
      primaryKey: true
    },
    goods_id: {
      type: STRING
    },
    amt: {
      type: INTEGER
    },
    title: {
      type: STRING
    },
    rmb: {
      type: FLOAT
    },
    points: {
      type: FLOAT
    }
  }, {
    freezeTableName: true,
    tableName: 'goods_spec',
    timestamps: false
  });

  return GoodsSpec;
}