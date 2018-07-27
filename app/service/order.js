// 生成订单规则
// uid_yyyyMMdd_时间戳后8位一定是唯一的
const moment = require('moment');

const {Service} = require('egg');

class OrderService extends Service {
  async create(data) {
    const Order = this.app.model.Order;
    return Order.create(data);
  }
  async getOne(id) {
    return await this.app.model.Order.findOne({ where: { order_id: id } });
  }
  
  // 检查用户和订单积分余额是否足够，足够就直接扣除，不足够不扣除
  async checkAndPay(order_id, user) {
    const pay_time =  moment().format('YYYY-MM-DD HH:mm:ss');
    const order = await this.app.model.Order.findOne({
      where: {
        order_id
      }
    });

    if (!order) {
      return {
        status: 0,
        msg: '无效订单！'
      }
    }

    const price = JSON.parse(order.price);
    const total_fee = price.points * order.amt;
    
    const user_balance = await this.app.model.UserBalance.findOne({
      where: { user }
    });

    if (!(user_balance && user_balance.points > total_fee)) {
      return {
        status: 0,
        msg: '账户余额不足！'
      };
    }

    // 调用刷单接口进行刷单，刷单成功就扣除积分
    const result = await this.invokeAPI();
    if (!result) {
      return {
        status: 0,
        msg: '服务器繁忙！刷单失败！'
      }
    }


    // 更新账户余额，并记录到change表里
    const balance = user_balance.points - total_fee;
    const deduct = await this.app.model.UserBalance.update({
      points: balance
    }, {
      where: { user }
    });

    if (!deduct[0]) {
      return {
        status: 0,
        msg: '扣款失败！'
      }
    }

    // 插入到balance_changelog表里
    this.app.model.BalanceChangelog.create({
      user,
      type: 'points',
      change_amt: total_fee,
      balance,
      time: pay_time,
      remark: '购买商品' 
    });

    // 更新订单表
    this.activeOrder(order_id, 'points', total_fee, total_fee, 'system');

    return {
      status: 1,
      msg: '扣款成功！'
    }
  }

  // 发货处理
  async activeOrder(order_id, pay_way, total_fee, pay_fee, operator) {
    return await this.app.model.Order.update({
      pay_way,
      total_fee,
      pay_fee,
      pay_time:  moment().format('YYYY-MM-DD HH:mm:ss'),
      operator,
      operation_time: moment().format('YYYY-MM-DD HH:mm:ss')
    }, {
      where: {
        order_id
      }
    })
  }

  // 调用接口发货
  async invokeAPI(type) {
    // 根据分类调用不同接口，固定写死就行，暂时不需要配置在数据库里
  }
}

module.exports = OrderService;