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
    },
    api_extra_params: {
      type: INTEGER
    },
    api_fixed_params: {
      type: STRING
    },
    api_host: {
      type: STRING
    },
    api_method: {
      type: STRING
    },
    callback: {
      type: STRING
    },
    // 分为QQ, QQ_SHUO, KS, KS_GQ...根据前端的所有分类来
    business_cata: {
      type: STRING 
    }
  }, {
    freezeTableName: true,
    tableName: 'goods_item',
    timestamps: false
  });

  
  return GoodsItem;
}