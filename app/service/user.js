const {Service} = require('egg');

class UserService extends Service {
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
}

module.exports = UserService;