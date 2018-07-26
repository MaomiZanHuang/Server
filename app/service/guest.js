const {Service} = require('egg');

class GuestService extends Service {
  // 商品分类
  async getGoodsCata() {
    const catas = this.ctx.model.GoodsCata.findAll({ where: { online: 1} });
    return await catas;
  }

  async getGoodsItem() {
    const items = this.ctx.model.GoodsItem.findAll({ where: { online: 1 } });
    return await items;
  }

  // 根据商品Id分类获取显示最低价格
  async getGoodsSpecsGroupByGoodsId() {
    const specs = await this.app.model.query('select min(rmb) as min_rmb, min(points) as min_points, goods_id from goods_spec group by goods_id');
    return specs;
  }

  // 日销量前5商品
  async getTop5HotGoods() {
    return await this.ctx.model.GoodsItem.findAll({ limit: 5 });
  }

  // 公告前5条
  async getLatest5Notices() {
    return await this.ctx.model.Notice.findAll({
      limit: 5,
      order: [['create_time', 'DESC']]
    });
  }

  // 获取首页广告
  async getHomePageAdv() {
    return {
      // #表示不跳转
      href: '#',
      pic: 'https://cdn.520cy.cn/images/appbazaar.png',
      alt: '千寻软件市场'
    };
  }
}

module.exports = GuestService;