const {Controller} = require('egg');
const {getUid} = require('../utils/index.js');
const moment = require('moment');
const request = require('request-promise');

class OrderController extends Controller {
  // 分页查询用户订单
  async getUserOrder() {
    const PAGE_SIZE = 10;
    let user = this.ctx.user.user;
    let {filter, page, page_size} = this.ctx.request.body;
    let order_status = filter === 'success'
      ? { $in: [3] }
      : { $notIn: [3] };
    if (!page_size || page_size && page_size > PAGE_SIZE) {
      page_size = PAGE_SIZE
    }
    const result = await this.app.model.Order.findAll({
      where: {
        user,
        status: order_status
      },
      limit: page_size,
      offset: page_size * page,
      'order': [
        ['create_time', 'DESC']
      ]
    });
    return this.ctx.body = result;
  }
  // 创建订单
  async create() {
    // 商品的价格和规格存入到订单表中
    const user = this.ctx.user.user;
    const { goods_id, spec_id, amt, concat, remark } = this.ctx.request.body;

    // 针对免费业务限制每天下单量
    if (/^10/.test(goods_id)) {
      const matchFreeGoods = await this.app.model.Order.findOne({
        where: {
          user,
          goods_id,
          create_time: {
            '$gte': moment().format('YYYY-MM-DD')
          }
        }
      });
      if (matchFreeGoods) {
        return this.ctx.body = {
          status: 0,
          msg: '免费分类商品一天只能购买一次！'
        };
      }
    }
    try {
      if (!/^\d{1,2}$/.test(amt) && amt > 0) {
        throw new Error('Error: Invalid amt');
      }
      
      JSON.parse(concat);
    } catch(err) {
      return this.ctx.body = {
        status: 0,
        msg: '请求数据不正确！'
      };
    }
    
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
        goods_logo: goods.logo,
        // 下单人id
        user,
        // 规格
        spec_amt: spec.amt,
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

  // 游客模式下查询订单
  async getOrderByVisitor() {
    const {keywords} = this.ctx.request.body;
    if (keywords.trim() === '') {
      return this.ctx.body = {
        status: 0,
        msg: '请先输入QQ/邮箱/订单后再查询！'
      };
    }
    const res = await this.service.order.getOrderByVisitor(keywords);
    return this.ctx.body = res;
  }
  /**
   取消订单
   注意校验是不是本人产生的订单，如果不是，则无法取消
   */

  async cancel() {
    // 注意验证用户的Id和订单关联性
    const order_id = this.ctx.params.id;
    const user = this.ctx.user.user;

    try {
      const r = await this.app.model.Order.update({
        status: 0
      }, {
        where: { order_id, user }
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
  
  /**
   * 通过积分支付订单
   * 步骤:1.校验支付密码，2校验订单金额和积分余额是否够 3扣积分，刷单，调整订单状态
   */
  async payByPoints() {
    const {pay_pwd, order_id} = this.ctx.request.body;
    const user = this.ctx.user.user;
    const isPayPwdMatch = await this.service.user.checkPayPwd(user, pay_pwd);
    if (!isPayPwdMatch) {
      return this.ctx.body = {
        status: 0,
        msg: '支付密码错误！'
      };
    }
    
    const checkAndPay = await this.service.order.checkAndPay(order_id, user);
    if (!checkAndPay.status) {
      return this.ctx.body = {
        status: 0,
        msg: checkAndPay.msg
      };
    }
    // 下单成功之后更新订单状态


    this.ctx.body = {
      status: 1,
      msg: '付款成功，服务器正在加速为您刷单！'
    };
  }

  // 找回积分
  async findPoints() {
    const order_id = this.ctx.query.id;
    const user = this.ctx.user.user;
    var rs = await request.get('http://www.cardbuy.net/Ajax/GetCardList/' + order_id + '?_=' + (+new Date));
    try {
      rs = JSON.parse(rs);
    } catch(err) {
      rs = {
        status: 0,
        msg: '查询失败'
      };
    }
    if (!rs.status) {
      return this.ctx.body = rs;
    }
    // 找到卡号进行充值
    var card = rs.msg.match(/[A-z|0-9|-]+/)[0];
    return this.ctx.body = {
      status: 1,
      card
    };
  }
}

module.exports = OrderController;