const Controller = require('egg').Controller;

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
        goods_cata[idx].dataValues.children.push(Object.assign(item.dataValues,
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
      top5_hot_goods[idx].dataValues = { ...top5_hot_goods[idx].dataValues, min_points, min_rmb };
    });


    this.ctx.body = ({
      adv,
      home_page_goods: top5_hot_goods,
      notices: latest_5notices
    });
  }
  
  
}

module.exports = GuestController;