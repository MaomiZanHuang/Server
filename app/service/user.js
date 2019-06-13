const {Service} = require('egg');
const moment = require('moment');

class UserService extends Service {
  // 检查登录密码是否匹配
  async checkLoginPwd(user, pwd) {
    const macthUser = await this.app.model.User.findOne({
      where: {
        user,
        login_pwd: pwd
      }
    });
    return macthUser;
  }

  // 检查是否存在qq_user
  async checkQQUser(open_id) {
    const macthQQUser = await this.app.model.QQUser.findOne({
      where: {
        open_id
      }
    });

    if (!macthQQUser) {
      return void(0);
    }
    var user = macthQQUser.user;
    const macthUser = await this.app.model.User.findOne({
      where: {
        user
      }
    });
    return macthUser;
  }

  // 注册时检查用户名是否存在
  async checkUserExist(user) {
    const macthUser = await this.app.model.User.findOne({
      where: {
        user
      }
    });
    return !!macthUser;
  }

  // 添加新账户
  async reg(user, login_pwd, qq, ip) {
    // 创建初始余额账户
    this.app.model.UserBalance.create({
      user,
      balance: 0,
      points: 0,
      remark: '新开户'
    });
    return await this.app.model.User.create({
      user,
      login_pwd,
      qq,
      pay_pwd: 123456,
      reg_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      last_login_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      reg_platform: ip
    });
  }
  // 设置支付密码
  async setPayPwd(user, payPwd) {
    return await this.app.model.User.update({
      pay_pwd: payPwd
    }, {
      where: { user }
    });
  }

  // 检查支付密码是否匹配
  async checkPayPwd(user, payPwd) {
    const macthUser = await this.app.model.User.findOne({
      where: {
        user,
        pay_pwd: payPwd
      }
    });
    return !!macthUser;
  }

  // 获取广告积分
  async getAdPoints(user) {
    const points = await this.app.model.BalanceChangelog.sum('change_amt', {
      where: {
        user,
        remark: { $like: '%广告%' }
      }
    });
    return points;
  }
}

module.exports = UserService;