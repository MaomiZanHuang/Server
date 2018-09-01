const Controller = require('egg').Controller;
const _ = require('lodash/object');
const request = require('request-promise');
const {getShuoshuoSession, MD5} = require('../utils/index');
const moment = require('moment');

class GuestController extends Controller {
  // 获取商品分类数据
  async getGoodsCata() {
    const goods_cata = await this.service.guest.getGoodsCata();
    const goods_item = await this.service.guest.getGoodsItem();
    const [group_goods_specs] = await this.service.guest.getGoodsSpecsGroupByGoodsId();

    const goods_cata_ids = [];
    goods_cata.forEach((cata, idx) => {
      goods_cata_ids.push(cata.cata_id);
      goods_cata[idx].dataValues.children = [];
    });

    goods_item.forEach(item => {
      let idx = goods_cata_ids.indexOf(item.cata_id);
      // 商品规格
      let {min_rmb, min_points, goods_id} = group_goods_specs.filter(spec => spec.goods_id == item.goods_id)[0] || {};
      if (idx + 1) {
        goods_cata[idx].dataValues.children.push(Object.assign(_.omit(item.dataValues, ['api_host', 'api_method', 'api_fixed_params', 'api_extra_params']),
          { min_points: min_points, min_price: min_rmb, specs:  '' } ));
      }
    });
    return this.ctx.body = goods_cata;
  }
  // 首页分类
  async getHomePageData() {

    const top5_hot_goods = await this.service.guest.getTop5HotGoods();
    const latest_5notices = await this.service.guest.getLatest5Notices();
    const adv = await this.service.guest.getHomePageAdv();

    const [group_goods_specs] = await this.service.guest.getGoodsSpecsGroupByGoodsId();
    const goods_item_ids = top5_hot_goods.map(x => x.goods_id);

    top5_hot_goods.forEach((item, idx) => {
      // 商品规格
      let {min_rmb, min_points, goods_id} = group_goods_specs.filter(spec => spec.goods_id == item.goods_id)[0] || {};
      top5_hot_goods[idx].dataValues = { ..._.omit(item.dataValues, ['api_host', 'api_method', 'api_fixed_params', 'api_extra_params']), min_points, min_rmb };
    });


    this.ctx.body = ({
      adv,
      home_page_goods: top5_hot_goods,
      notices: latest_5notices
    });
  }

  // 获取说说
  async getShuoshuo() {
    var {qq, page} = this.ctx.query;
    if (!(/^\d{5,10}$/.test(qq))) {
      return this.ctx.body = {
        status: 0,
        msg: 'qq号不正确！'
      }
    }
    if (isNaN(page)) {
      page = 0
    }
    var form = {
      uin: qq,
      page
    };
    var UA = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 UBrowser/6.2.4094.1 Safari/537.36';
    var Cookie = await getShuoshuoSession();

    var options= {
      method:'post',
      uri: 'http://95.95jw.cn/index.php?m=home&c=jiuwuxiaohun&a=qq_shuoshuo_lists&goods_type=141&jwxh_token=4504e6ac',
      qs: form,
      headers:{
        Cookie,
        Host: '95.95jw.cn',
        Origin: 'http://95.95jw.cn',
        Referer: 'http://95.95jw.cn/index.php?m=Home&c=Goods&a=detail&id=11165&goods_type=141',
        'User-Agent': UA
      },
      json: true
    };

    try {
      const res = await request(options);
      if (typeof res !== 'object') {
        // 登录已经失效了，登录获取新的SESSION
        getShuoshuoSession(1);
        return this.ctx.body = {
          status: 0,
          msg: '获取失败！请点击重新获取！'
        };
      };
      if (res && res.total) {
        var data = res.msglist.map(r => _.pick(r, ['tid', 'content']));
        res.data = data;
        return this.ctx.body = {
          data,
          status: 1
        };
      }
      return this.ctx.body = {
        status: 0,
        msg: '获取说说失败！可能未开放空间权限！'
      };
    } catch(err) {
      console.log(err);
      return this.ctx.body = {
        status: 0,
        msg: '系统获取说说失败，请联系客服！'
      }
    }
  }

  // 获取充值选项goods_id为0的那个，amt字段对应的是card_id
  async getChargeOptions() {
    const options = await this.app.model.GoodsSpec.findAll({
      where: {
        goods_id: 0
      }
    });
    return this.ctx.body = options.map(({id, title, amt, rmb, points}) => {
      return {
        id,
        title,
        card: amt,
        price: rmb,
        points
      };
    });
  }
  // 有米广告回调
  async youmi_adv_cb() {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const dev_server_secret = 'f0c1be5ce6616a2f';
    const {order, app, ad, user, device, chn, points, time, sig, adid, pkg} = this.ctx.query;
    
    this.ctx.logger.info(`-----------${now}-----------`);
    this.ctx.logger.info(JSON.stringify(this.ctx.query));
    this.ctx.logger.info('---------【waps_pay】--------------');

    // 检验签名是否正确
    if (sig !== MD5([dev_server_secret, order, app, user, chn, ad, points].join('||')).slice(12, 20)) {
      return this.ctx.body = {
        status: 0,
        msg: '签名不正确！'
      };
    }
    
    // 然后赠送积分，记录到changelog里
    this.service.balance.chargePoints(user, points, 'youmi广告任务+' + points + '积分');

    return this.ctx.body = {
      status: 1,
      msg: '充值成功！'
    }
  }

  // 万普广告回调
  async waps_adv_cb() {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const encryption_key = 'f0c1be5ce6616a2f';
    const {adv_id, app_id, key, udid, bill, points, ad_name, status, activate_time, order_id, random_code, wapskey} = this.ctx.query;
    var time = encodeURIComponent(activate_time).replace('%20', '+');
    
    this.ctx.logger.info(`-----------${now}-----------`);
    this.ctx.logger.info(JSON.stringify(this.ctx.query));
    this.ctx.logger.info('---------【waps_pay】--------------');
    //验证签名
    const all_parames = [adv_id, app_id, key, udid, bill, points, time, order_id, encryption_key].join('');
    if (MD5(all_parames).toUpperCase() !== wapskey) {
      return this.ctx.body = {
        "message": "无效数据",
        "success": false
      };
    }

    // 进行积分充值,异步任务
    this.service.balance.chargePoints(key, points, 'waps广告任务+' + points + '积分');

    return this.ctx.body = {
      "message": "成功接收",
      "success": true
    };
  }

  // 万普支付宝回调
  async waps_pay_cb() {
    const MAIL_OPTIONS = {
      from: 'telanx1993@aliyun.com',
      to: '1241818518@qq.com',
      subject: '主题',
      html: '内容'
    };
    const app_id1 = 'bb56be4486b5fbb12556756323b3c96b';
    const app_key1 = 'F327D9263A67FFD3396A04CC7BA492CD';
    const app_id2 = '4523db3cffd6867c23c9b707fc783238';
    const app_key2 = '9A6008D76D613E5B986050C6591E3F31';
    const app_key = {
      [app_id1]: app_key1,
      [app_id2]: app_key2
    };
    const ALLOW_IPS = ['219.234.85.205'];
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    var status = 1;
    var remark = '';
    var points = 0;
    const {ip} = this.ctx;
    if (ALLOW_IPS.indexOf(ip) < 0) {
      this.app.email.sendMail(Object.assign(MAIL_OPTIONS, {
        subject: '【拇指赞】非法万普网关回调',
        html: `IP地址: ${ip} <br/>请求参数:<br/>` + JSON.stringify(this.ctx.query)
      }), error => {
        if (error) {
            console.log('error:', error);
        }
        this.app.email.close();
      });

      this.ctx.logger.warn(`[${now}][$ip] 试图发送回调请求被拦截！` );
      return this.ctx.body = `403 Forbidden | Your ip [${ip}] is not allowed to access.`;
    }

    this.ctx.logger.info(`-----------${now}-----------`);
    this.ctx.logger.info(JSON.stringify(this.ctx.query));
    this.ctx.logger.info('---------【waps_pay】--------------');
    
    // 仅允许万普的网关通知
    const {order_id, app_id, user_id, pay_type, result_code, result_string, trade_id, amount, pay_time, sign} = this.ctx.query;
    const key = app_key[app_id];
    const params = [order_id, user_id, amount, key].join('');

    if (MD5(params).toUpperCase() !== sign) {
      this.app.email.sendMail(Object.assign(MAIL_OPTIONS, {
        subject: '【拇指赞】万普网关签名错误',
        html: `请求参数:<br/>` + JSON.stringify(this.ctx.query) + `<br/>sign:${sign}<br/>MD5(order_id+user_id+amount+key):` + MD5(params).toUpperCase()
      }), error => {
        if (error) {
            console.log('error:', error);
        }
        this.app.email.close();
      });

      return this.ctx.body = {
        status: 0,
        msg: '签名错误！'
      };
    }
    if (result_code == 0) {
      const matchOrder = await this.app.model.Order.findOne({
        where: {
          order_id
        }
      });
      if (matchOrder) {
        const goods_spec_id = matchOrder.goods_id;
        const goods_spec = await this.app.model.GoodsSpec.findOne({where: {id: goods_spec_id}});
        if (!goods_spec) {
          status = 2;
          remark = '非法goods_id';
        } else {
          if (parseFloat(goods_spec.rmb) != parseFloat(amount)) {
            // 金额不对
            status = 2;
            remark = '支付金额与订单金额不一致';
          } else {
            status = 3;
            points = goods_spec.points;
            this.service.balance.chargePoints(user_id, points, '积分充值+' + points + '积分');
          }
        }
        // 更新订单信息
        this.app.model.Order.update({
          pay_time,
          status,
          remark,
          pay_fee: amount,
          operator: 'SYSTEM'
        }, {where: {order_id}});
      }
    }
    return this.ctx.body = 'success';
  }
}

module.exports = GuestController;