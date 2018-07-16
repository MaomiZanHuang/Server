const Controller = require('egg').Controller;

class GuestController extends Controller {
  // 首页分类
  async getGoodsCata() {
    const users = await this.app.model.GoodsCata.findAll();
    this.ctx.body = JSON.stringify(users);
  }
  
  // 日销量前5商品
  async getTop5HotGoods() {
    const top5HotGoods = await this.app.model.Goods.findAll({limit: 5});
    this.ctx.body = JSON.stringify(top5HotGoods);
  }

  // 公告前5条
  async getLatest5Notices() {
    const latest5Notices = await this.app.model.Notice.findAll({limit: 5});
    this.ctx.body = JSON.stringify(latest5Notices);
  }
}

module.exports = GuestController;