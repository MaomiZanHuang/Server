const {Controller} = require('egg');
const {createJWT} = require('../utils/index.js');
const moment = require('moment');
const _ = require('lodash/object');
const request = require('request-promise');
const {getUid} = require('../utils/index.js');

// 发卡网的一些支付订单数据,
// 查询订单数据也可以根据卡密网站订单查询数据来，或者是自己先创建一个订单，这样没什么必要吧
class PayController extends Controller {
  async getCardOrder() {
    const {type, price, goodid, contact} = this.ctx.request.body;
    var UA = this.ctx.request.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36';
    var USER_ID = '10556';
    var CATA_ID = '348';
    var TYPE_PIDS = {
      wx: 170,
      qq: 99,
      zfb: 167
    };

    var pid = TYPE_PIDS[type] || 170;
    const FAKA_API = 'http://www.xsfaka.com/pay/order';
    var form = {
      userid: USER_ID,
      token: '10a10ab2c429b7bf2935d63e25b43e62',
      cardNoLength: 0,
      cardPwdLength: 0,
      is_discount: 0,
      coupon_ctype: 0,
      coupon_value: 0,
      sms_price: 0,
      paymoney: price,
      danjia: price,
      cateid: CATA_ID,
      goodid: goodid,
      quantity: 1,
      kucun: 1,
      contact: contact,
      feePayer: 1,
      fee_rate: 0.02,
      min_fee: 0.01,
      pid
    };
    var options= {
      method:'post',
      uri: FAKA_API,
      qs: form,
      headers:{
        Host: 'www.xsfaka.com',
        Origin: 'http://www.xsfaka.com',
        Referer: 'http://www.xsfaka.com/linkshop/130252B1',
        'User-Agent': UA
      },
      json: true
    };
    const res = await request(options);
    if (!res.match(/value="(\S+)"/i)) {
      return this.ctx.body = {
        status: 0,
        msg: res
      };
    }
    var order_no = res.match(/value="(\S+)"/)[1];
    
    
    var FAKA_API2 = 'http://www.xsfaka.com/index/pay/payment';
    var options2 = {
      method:'post',
      uri: FAKA_API2,
      qs: {
        'trade_no': order_no,
        'agree_on': 'on'
      },
      headers:{
        Host: 'www.xsfaka.com',
        Origin: 'http://www.xsfaka.com',
        Referer: 'http://www.xsfaka.com/linkshop/130252B1',
        'User-Agent': UA
      },
      json: true
    }
    const res2 = await request(options2);
    
    var qr = res2.match(/text:\s\"(\S+)\"/i);
    if (!qr) {
      return this.ctx.body = {
        status: 0,
        msg: '获取二维码失败'
      };
    }
    qr = qr[1];
    var QR_SERVER2 = 'http://qr.liantu.com/api.php?text=';
    var QR_SERVER1 = 'https://www.kuaizhan.com/common/encode-png?large=true&data=';
    return this.ctx.body = {
      status: 1,
      order_no,
      qr: QR_SERVER1 + qr,
      qr2: QR_SERVER2 + qr,
      qrText: qr,
      msg: '创建订单成功，请及时支付！'
    };
  }


  async queryCardOrder() {
    var order_no = this.ctx.params.order_no;
    // 先获取token
    var tokenHost = 'http://www.xsfaka.com/orderquery?orderid='+order_no+'&querytype=2';
		var tokenRes = await request({
      method: 'GET',
      uri: tokenHost
    });

		var token = tokenRes.match(/token:\'(\S+)\'/);
		if (!token) {
      return this.ctx.body = {
        status: 0,
        msg: 'token获取失败！'
      };
    }
    token = token[1];

    var options= {
      method:'GET',
      uri: 'http://www.xsfaka.com/checkgoods?t='+new Date+'&orderid='+order_no+'&token='+token,
      headers:{
        Referer: 'http://www.xsfaka.com/orderquery?orderid='+order_no+'&querytype=2'
      },
      json: true
    };
    const res = await request(options);
    var card = '';
    if (res.msg.match(/[A-z|-\d]{2,}/)) {
      card = res.msg.match(/[A-z|-\d]{2,}/)[0];
    }
    return this.ctx.body = {
      status: res.status,
      msg: res.msg,
      card,
    }
  }

  // 创建支付订单
  async create() {
    const order_id = getUid();
    const {id} = this.ctx.request.body;
    
    const user = this.ctx.user.user;
    const goods_spec = await this.app.model.GoodsSpec.findOne({
      where: {
        id
      }
    });
    if (!goods_spec) {
      return this.ctx.body = {
        status: 0,
        msg: '创建失败！充值参数不合法！'
      };
    }

    var {rmb, points} = goods_spec;
    const price = parseFloat(rmb);
    points = parseInt(points);

    try {
      const r = await this.service.order.create({
        id: null,
        order_id,
        goods_id: id,
        goods_name: '积分充值',
        goods_logo: 'https://ss0.baidu.com/73t1bjeh1BF3odCf/it/u=3983270426,2948054057&fm=85&s=C086FF12185147ED44ACE94B03003062',
        // 下单人id
        user,
        // 规格
        spec_amt: points,
        spec: points + '积分',
        // 价格
        price,
        // 数量
        amt: 1,
        // 总额
        total_fee: price,
        // 创建时间
        create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        // 支付时间
        pay_time: null,
        // 发货时间,自动发货时间与支付时间一致
        operation_time: null,
        // 发货人，自动发货是SYSTEM
        operator: null,
        // 0逻辑删除 1创建订单2支付3发货
        status: 1,
        pay_fee: null,
        // 支付方式POINTS,RMB
        pay_way: 'ALIPAY',
        // QQ/WECHAT/ALIPAY
        pay_type: 'charge',
        // 下单数据，JSON,常用包括qq,kuaishou之类的
        concat: null,
        // 留言备注
        remark: '充值' + points + '积分'
      });
      this.ctx.body = {
        status: 1,
        order: r,
        msg: '订单创建成功！'
      };
    } catch(err) {
      this.ctx.body = {
        status: 0,
        msg: '订单创建失败！'
      };
    }
  }

  // 查询APP下单
  async queryAppOrder() {
    const pay_id = this.ctx.params.id;
    const {user} = this.ctx.user;
    const order = await this.app.model.Order.findOne({
      where: {order_id: pay_id}
    });
    if (order.status !== 3) {
      return this.ctx.body = {
        status: 0,
        msg: '未支付'
      };
    } else {
      const matchBalance = await this.app.model.UserBalance.findOne({
        where: {user}
      });
      if (!matchBalance) {
        return this.ctx.body = {
          status: 1,
          msg: '已支付，但账户异常！',
          points: 0
        };
      }
      return this.ctx.body = {
        status: 1,
        msg: '已支付',
        points: matchBalance.points
      }
    }
  }
}

module.exports = PayController;