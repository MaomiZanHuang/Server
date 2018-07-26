// 生成订单规则
// uid_yyyyMMdd_时间戳后8位一定是唯一的
const {getUid} = require('../utils');

const {Service} = require('egg');

class OrderService extends Service {
  async create(data) {
    const Order = this.app.model.Order;
    return Order.create(data);
  }
  async getOne(id) {
    return await this.app.model.Order.findOne({ where: { order_id: id } });
  }
}

module.exports = OrderService;