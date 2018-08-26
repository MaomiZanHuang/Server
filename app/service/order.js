// 生成订单规则
// uid_yyyyMMdd_时间戳后8位一定是唯一的
const moment = require('moment');

const {Service} = require('egg');
const request = require('request-promise');

class OrderService extends Service {
  async create(data) {
    const Order = this.app.model.Order;
    return await Order.create(data);
  }
  async getOne(id) {
    return await this.app.model.Order.findOne({ where: { order_id: id } });
  }

  // 访客模式下订单查询接口
  async getOrderByVisitor(keywords) {
    const {where, col} = this.app.model;
    const res = await this.app.model.Order.findAll({
      where: {
        $or: [
          where(col('user'), { $like: keywords }),
          where(col('order_id'), { $like: keywords }),
          where(col('concat'), { $like: keywords })
        ]
      },
      limit: 3
    });
    return res;
  }
  
  // 检查用户和订单积分余额是否足够，足够就直接扣除，不足够不扣除
  async checkAndPay(order_id, user) {
    const pay_time =  moment().format('YYYY-MM-DD HH:mm:ss');
    const order = await this.app.model.Order.findOne({
      where: {
        order_id
      }
    });

    if (!order || order && order.status !== 1) {
      return {
        status: 0,
        msg: '无效订单或订单状态不正确！'
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
    const order_goods = await this.app.model.GoodsItem.findOne({
      where: {
        goods_id: order.goods_id,
        online: 1
      }
    });
    if (!order_goods) {
      return {
        status: 0,
        msg: '商品已下架，无法刷单！'
      }
    }


    var {api_method, api_host, api_fixed_params, api_extra_params} = order_goods;
    var concat;
    try {
      api_extra_params = JSON.parse(api_extra_params);
      api_fixed_params = JSON.parse(api_fixed_params)
      concat = JSON.parse(order.concat);
    } catch(err) {
      console.log(err);
      return {
        status: 0,
        msg: '无效的订单:JSON解析错误！'
      }
    }
    concat = Object.assign({
      amt: order.amt * order.spec_amt,
      // 针对卡商网的订单号SerialNumber
      order_id,
      // 针对卡商网的签名
      sign: 1
    }, concat);

    // 字段里值就是别名
    Object.keys(api_extra_params).forEach(key => {
      api_extra_params[key] = concat[api_extra_params[key]];
    });

    var params = Object.assign(api_fixed_params, api_extra_params);
    if (params.Sign) {
      var crypto=require('crypto');
      var md5=crypto.createHash("md5");
      var signKeys = ['SerialNumber', 'CustomerID', 'ProductID', 'TargetAccount', 'BuyAmount', 'key'];
      md5.update(signKeys.map(k => params[k]).join(''));
      params.Sign = md5.digest('hex');
    }
    var result;
    const MAIL_OPTIONS = {
      from: 'telanx1993@aliyun.com',
      to: '1241818518@qq.com',
      subject: '主题',
      html: '内容'
    };
    try {
      result = await this.invokeAPI(api_method || 'GET', api_host, params);
    } catch(err) {
      console.log(err);
    }
    if (!result.status) {
      this.app.email.sendMail(Object.assign(MAIL_OPTIONS, {
        to: '851656783@qq.com',
        subject: '【拇指赞】下单失败',
        html: `${api_method} ${api_host} <br> params: <br/>` + JSON.stringify(params) + '<br/> --------------------------<br/>错误原因:' + result.msg
      }), error => {
        if (error) {
            console.log('error:', error);
        }
        this.app.email.close();
      });
      return {
        status: 0,
        msg: '下单失败:' + result.msg
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
      before_balance: user_balance.points,
      balance,
      time: pay_time,
      remark: '购买商品' 
    });

    // 更新订单表
    this.activeOrder(order_id, 'points', total_fee, total_fee, 'system');

    return {
      status: 1,
      msg: '扣款成功！'
    };
  }

  // 发货处理
  async activeOrder(order_id, pay_way, total_fee, pay_fee, operator) {
    return await this.app.model.Order.update({
      pay_way,
      total_fee,
      pay_fee,
      status: 3,
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
  async invokeAPI(method, host, params) {
    method = method.toLowerCase();
    if (['get', 'post', 'put', 'delete', 'options'].indexOf(method) < 0) {
      return {
        status: 0,
        msg: '请求方式不正确'
      };
    }
    try {
      var res = await request[method](host, { form: params });
      this.ctx.logger.info(params);
      this.ctx.logger.info(res);
      if (params.Sign) {
        res = JSON.parse(res);
        if (res && res.Success) {
          this.ctx.logger.info('卡商网下单成功！');
          return {
            status: 1,
            msg: res.Info,
            OrderId: res.OrderId
          };
        } else {
          this.ctx.logger.info('卡商网下单失败!');
          return {
            status: 0,
            msg: res.Info
          }
        }
      } else {
        try {
          res = JSON.parse(res);
          this.ctx.logger.info('社区下单成功！');
          return {
            status: res.status,
            msg: res.info
          }; 
        } catch(err) {
          this.ctx.logger.info('社区下单失败！');
          var error_node = res.match(/<p class="error">(\S+)?<\/p>/);
          var err = error_node && error_node[1];
          if (error_node)
          return {
            status: 0,
            msg: err
          };
        }
        return {
          status: 0,
          msg: '商品接口错误，请联系客服~'
        };
      }
    } catch(err) {
      console.log(err);
      this.app.email.sendMail(Object.assign(MAIL_OPTIONS, {
        subject: '【拇指赞】网络请求系统错误',
        html: `${method} ${host} <br> params: <br/>` + JSON.stringify(params) + '<br/> 错误原因:' + JSON.stringify(err)
      }), error => {
        if (error) {
            console.log('error:', error);
        }
        this.app.email.close();
      });
      return {
        status: 0,
        err: '系统出错了,请联系客服处理！'
      };
    }
  }
}

module.exports = OrderService;