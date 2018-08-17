const Controller = require('egg').Controller;
const _ = require('lodash/object');
const request = require('request-promise');
const {MD5} = require('../utils/index');
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
    const API = 'http://www.tzytlc.com/ajax.php?act=getshuoshuo&uin=' + qq + '&page=' + page + '&hashalt=' + (+new Date);
    try {
      const res = await request.get({url: API, json: true});
      res.status = res.code === 0 ? 1 : 0;
      if (res && res.data) {
        var data = res.data.map(r => _.pick(r, ['tid', 'content']));
        res.data = data;
      }
      return this.ctx.body = res;
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
    const dev_server_secret = '7a736e14f6470dbf';
    const {order, app, ad, user, device, chn, points, time, sig, adid, pkg} = this.ctx.query;
    
    this.ctx.logger.debug(`-----------${now}-----------`);
    this.ctx.logger.debug(JSON.stringify(this.ctx.query));
    this.ctx.logger.debug('---------【waps_pay】--------------');

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
    const encryption_key = '7a736e14f6470dbf';
    const {adv_id, app_id, key, udid, bill, points, ad_name, status, activate_time, order_id, random_code, wapskey} = this.ctx.query;
    var time = encodeURIComponent(activate_time).replace('%20', '+');
    
    this.ctx.logger.debug(`-----------${now}-----------`);
    this.ctx.logger.debug(JSON.stringify(this.ctx.query));
    this.ctx.logger.debug('---------【waps_pay】--------------');
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
    const key = '7a736e14f6470dbf';
    const ALLOW_IPS = ['219.234.85.205'];
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    var status = 1;
    var remark = '';
    const {ip} = this.ctx;
    if (ALLOW_IPS.indexOf(ip) < 0) {
      this.ctx.logger.warn(`[${now}][$ip] 试图发送回调请求被拦截！` )
      return this.ctx.body = `403 Forbidden | Your ip [${ip}] is not allowed to access.`;
    }

    this.ctx.logger.debug(`-----------${now}-----------`);
    this.ctx.logger.debug(JSON.stringify(this.ctx.query));
    this.ctx.logger.debug('---------【waps_pay】--------------');
    
    // 仅允许万普的网关通知
    const {order_id, app_id, user_id, pay_type, result_code, result_string, trade_id, amount, pay_time, sign} = this.ctx.query;
    const params = [order_id, user_id, amount, key].join();
    /**
    if (MD5(params).toUpperCase() !== sign) {
      return this.ctx.body = {
        status: 0,
        msg: '签名错误！'
      };
    }
    */
    if (result_code == 0) {
      const matchOrder = await this.app.model.Order.findOne({
        where: {
          order_id
        }
      });
      if (matchOrder) {
        const goods_spec_id = matchOrder.goods_id;
        const goods_spec = await this.app.model.GoodsSpec.findOne({where: {id: goods_spec_id}});
        console.log(goods_spec_id);
        console.log(goods_spec);
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
            this.service.chargePoints(user_id, points, '积分充值+' + points + '积分');
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