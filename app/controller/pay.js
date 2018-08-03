const {Controller} = require('egg');
const {createJWT} = require('../utils/index.js');
const moment = require('moment');
const _ = require('lodash/object');
const request = require('request-promise');

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
    if (qr_img.match(/(data\S+)"/)) {
      qr = qr_img.match(/data=(\S+)?"/)[1];
    }

    return this.ctx.body = {
      status: 1,
      order_no,
      action,
      input,
      qr,
      qr_img: 'http://www.cardbuy.net/Gateway/QrCode?data=' + qr
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
}

module.exports = PayController;