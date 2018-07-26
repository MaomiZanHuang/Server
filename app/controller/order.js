const {Controller} = require('egg');
const {getUid} = require('../utils/index.js');
const moment = require('moment');

class OrderController extends Controller {
  // 创建订单
  async create() {
    // 商品的价格和规格存入到订单表中
    const { goods_id, spec_id, amt, concat, remark } = this.ctx.request.body;
    const user = 'telanx';
    // 查找商品和规格
    const goods = await this.app.model.GoodsItem.findOne({
      where: { goods_id }
    });
    const spec = await this.app.model.GoodsSpec.findOne({
      where: { id: spec_id }
    });

    const goods_name = goods.title;
    
    const price = JSON.stringify({
      rmb: spec.rmb,
      points: spec.points
    });

    // 根据goods_id和spec_id去获取价格和其它各种名称
    if (!(goods_id && spec_id)) {
      return this.ctx.body = {
        status: 0,
        msg: '系统出错了！'
      };
    }
    try {
      const r = await this.service.order.create({
        id: null,
        order_id: getUid(),
        goods_id,
        goods_name,
        // 下单人id
        user,
        // 规格
        spec_id,
        spec: spec.title,
        // 价格
        price,
        // 数量
        amt,
        // 总额
        total_fee: null,
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
        pay_way: null,
        // QQ/WECHAT/ALIPAY
        pay_type: null,
        // 下单数据，JSON,常用包括qq,kuaishou之类的
        concat,
        // 留言备注
        remark
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
  // 查询订单
  async get() {
    const order_id = this.ctx.params.id;
    try {
      const order = await this.service.order.getOne(order_id);

      this.ctx.body = order || {};
    } catch(err) {
      this.ctx.body = err;
    }
  }
  /**
   取消订单
   注意校验是不是本人产生的订单，如果不是，则无法取消
   */

  async cancel() {
    // 注意验证用户的Id和订单关联性
    const order_id = this.ctx.params.id;

    try {
      const r = await this.app.model.Order.update({
        status: 0
      }, {
        where: { order_id }
      });
      this.ctx.body = r[0]
        ? { status: 1, msg: '已成功取消订单' }
        : { status: 0, msg: '取消订单失败！' };
    } catch(err) {
      this.ctx.body = {
        status: 0,
        msg: '系统错误,请稍后重试！'
      };
    }
  }
  // 激活订单
  async active() {

  }
  // 发货自己找一个发货的英文看下即可
}

module.exports = OrderController;