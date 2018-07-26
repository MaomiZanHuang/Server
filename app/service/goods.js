const {Service} = require('egg');

class GoodsService extends Service {
  // 商品分类
  async getOne(goods_id) {
    const goods = await this.ctx.model.GoodsItem.findOne({ where: { goods_id } });
    // 获取该商品下的规格分类
    const specs = await this.ctx.model.GoodsSpec.findAll({ where: { goods_id } });
    goods.dataValues.specs = specs;
    return goods;
  }
}

module.exports = GoodsService;