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
    var hot_goods_ids = await this.ctx.model.Config.findOne({
      attributes: ['v'],
      where: {
        k: 'hot_goods'
      }
    });

    try {
      hot_goods_ids = JSON.parse(hot_goods_ids.dataValues.v);
    } catch(err) {
      hot_goods_ids = [2003, 3003, 3002, 3001, 4001];
    }

    var res = await this.ctx.model.GoodsItem.findAll({ where: {
      goods_id: {
        $in: hot_goods_ids
      }
    }});

    res = res.sort((prev, next) => {
      var prev_idx = hot_goods_ids.indexOf(parseInt(prev.dataValues.goods_id));
      var next_idx = hot_goods_ids.indexOf(parseInt(next.dataValues.goods_id));
      return prev_idx > next_idx;
    });

    return res;
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
      // pic: 'https://cdn.520cy.cn/images/appbazaar.png',
      pic: '//ugc.qpic.cn/gbar_pic/2wF3sr2LiaVtQE337kOWdsAKFuc2y57haIiborP8yNQ2ypXric7RS0rOg/0',
      alt: '千寻软件市场'
    };
  }
}

module.exports = GuestService;