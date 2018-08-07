const {Controller} = require('egg');
const {getUid} = require('../utils/index.js');
const moment = require('moment');
const _ = require('lodash/object');

class GoodsController extends Controller {
  // 查询商品
  async get() {
    const goods_id = this.ctx.params.id;
    try {
      const goods = await this.service.goods.getOne(goods_id);
      // 过滤到账号密码等关键信息
      goods.dataValues = _.omit(goods.dataValues, ['api_host', 'api_method', 'api_fixed_params']);
      this.ctx.body = goods;
    } catch(err) {
      this.ctx.body = err;
    }
  }
  // 取消订单
  async cancel() {
    // 注意验证用户的Id和订单关联性
    const order_id = this.ctx.params.id;

    try {
      const r = await this.app.model.Order.update({
        status: 0
      }, {
        where: { order_id }
      });
      this.ctx.body = r;
      console.log(r);
    } catch(err) {
      console.log(err);
      this.ctx.body = err;
    }
  }
  // 激活订单
  async active() {

  }
  // 发货自己找一个发货的英文看下即可
}

module.exports = GoodsController;