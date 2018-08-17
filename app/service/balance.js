const {Service} = require('egg');
const moment = require('moment');

class BalanceService extends Service {
  async chargePoints(user, points, remark) {
    points = parseInt(points);
    const matchUser = this.app.model.User.findOne({
      where: {user}
    });
    if (!matchUser) {
      return {
        status: 0,
        msg: '账户不存在！'
      }
    }

    const matchBalance = await this.app.model.UserBalance.findOne({
      where: {user}
    });

    let user_points = matchBalance.points;
    console.log(user_points, points);
    let user_points_update = user_points + points;
    
    // 记录到balance_changelog里
    this.app.model.BalanceChangelog.create({
      user,
      type: 'points',
      change_amt: points,
      before_balance: user_points,
      balance: user_points_update,
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      remark
    });

    this.app.model.UserBalance.update({
      points: user_points_update
    }, {
      where: {user}
    });
    
    return {status: 1, msg: '充值成功！', points: user_points_update};
  }
}

module.exports = BalanceService;