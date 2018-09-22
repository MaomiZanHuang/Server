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
    var TYPE_PIDS = {
      wx: 85,
      qq: 86,
      zfb: 2
    };
    var pid = TYPE_PIDS[type] || 2;
    const FAKA_API = 'http://www.cardbuy.net/Gateway/RequestTo';
    var form = { userid: '2Evp', kucun: 3, price, isapi: 0, cateid: 37489, goodid, quantity: 1, contact, pid,  cardquantity: 1 };
    form = {
      ...form,
      gameid: '',
      bill: '',
      apiurl: '',
      email: '',
      couponcode: '', 
      'cardvalue[]': '',
      'cardnum[]': '',
      'cardpwd[]': ''
    };
    var options= {
      method:'post',
      uri: FAKA_API,
      qs: form,
      headers:{
        Host: 'www.cardbuy.net',
        Origin: 'http://www.cardbuy.net',
        Referer: 'http://www.cardbuy.net/list/2Evpu',
        'User-Agent': UA
      },
      json: true
    };
    const res = await request(options);
    if (!res.match(/<form(\s|\S)+?<\/form>/)) {
      return this.ctx.body = {
        status: 0,
        msg: res
      };
    }
    var form_node = res.match(/<form(\s|\S)+?<\/form>/)[0];
    var order_no = form_node.match(/<strong>(\d+)<\/strong>/)[1];
    var action = 'http://www.cardbuy.net' + form_node.match(/action="(\S+)"/)[1];
    var input = form_node.match(/<input(\s|\S)+?\/>/)[0];
    var qr_img = form_node.match(/<img(\s|\S)+?\/>/)[0];
    var qr = '';
    if (qr_img.match(/src="(\S+)?"/)) {
      qr_img = qr_img.match(/src="(\S+)?"/)[1]
    }
    if (qr_img.match(/qq.com/)) {
      qr_img = 'http://www.cardbuy.net' + qr_img;
    }
    if (qr_img.match(/weixin\S+/)) {
      qr = qr_img.match(/weixin\S+/)[0];
    }

    return this.ctx.body = {
      status: 1,
      order_no,
      action,
      input,
      qr,
      qr_img
    };
  }
  async queryCardOrder() {
    const pay_id = this.ctx.params.id;
    var options= {
      method:'get',
      uri: 'http://www.cardbuy.net/Ajax/GetCardList/' + pay_id,
      qs: {
        _: +new Date
      },
      headers:{
        Host: 'www.cardbuy.net',
        Origin: 'http://www.cardbuy.net',
        Referer: 'http://www.cardbuy.net/list/2Evpu'
      },
      json: true
    };
    const res = await request(options);
    var card = '';
    if (res.msg.match(/[A-z|-\d]+/)) {
      card = res.msg.match(/[A-z|-\d]+/)[0];
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
      console.log(err);
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