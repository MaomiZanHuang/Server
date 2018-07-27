const {Controller} = require('egg');
const moment = require('moment');

/**
 ctx.session来存储数据信息
 */
class UserController extends Controller {
  // 登录，无需验证码，直接登录
  async login() {
  }

  // 退出
  async logout() {

  }

  // 更新资料
  async update() {

  }

  // 更新登录密码
  async changePwd() {

  }

  // 更新支付密码
  async changePayPwd() {

  }
}

module.exports = UserController;