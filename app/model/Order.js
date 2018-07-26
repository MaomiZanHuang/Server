'use strict';

module.exports = app => {
  const { INTEGER, STRING, FLOAT } = app.Sequelize;
  const Order = app.model.define('Order', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 单号
    order_id: {
      type: STRING,
      distinct: true
    },
    // 下单商品Id
    goods_id: {
      type: STRING
    },
    goods_name: {
      type: STRING
    },
    // 下单人id
    user: {
      type: STRING
    },
    // 规格
    spec: {
      type: STRING
    },
    // 价格
    price: {
      type: STRING
    },
    // 数量
    amt: {
      type: INTEGER
    },
    // 总额
    total_fee: {
      type: FLOAT
    },
    // 创建时间
    create_time: {
      type: STRING
    },
    // 支付时间
    pay_time: {
      type: STRING
    },
    // 发货时间,自动发货时间与支付时间一致
    operation_time: {
      type: STRING
    },
    // 发货人，自动发货是SYSTEM
    operator: {
      type: STRING
    },
    // 0逻辑删除 1创建订单2支付3发货
    status: {
      type: INTEGER
    },
    pay_fee: {
      type: FLOAT
    },
    // 支付方式POINTS,RMB
    pay_way: {
     type: STRING
    },
    // QQ/WECHAT/ALIPAY
    pay_type: {
      type: STRING
    },
    // 下单数据，JSON,常用包括qq,kuaishou之类的
    concat: {
      type: STRING
    },
    // 留言备注
    remark: {
      type: STRING
    }
  }, {
    freezeTableName: true,
    tableName: 'orderlist',
    timestamps: false
  });
  return Order;
}