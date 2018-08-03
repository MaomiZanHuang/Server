const {Controller} = require('egg');
const {createJWT} = require('../utils/index.js');
const moment = require('moment');
const _ = require('lodash/object');

// 认证信息采用无状态的JWT
class CardController extends Controller {
  // 批量新增卡密
  async addCards() {
    // card用;号分隔开
    const {cards, price, points} = this.ctx.request.body;
    const gen_time = moment().format('YYYY-MM-DD HH:mm:ss');
    const cs = cards.split(';').map(card_no => {
      return {
        card_no,
        price,
        points,
        gen_time
      };
    });
    const res = await this.app.model.Card.bulkCreate(cs)
    return this.ctx.body = res;
  }

  // 分页按条件查询卡密
  async queryCards() {
    const cards = await this.app.model.Card.findAll();
    return this.ctx.body = cards;
  }

}

module.exports = CardController;