const {Controller} = require('egg');
const {createJWT} = require('../utils/index.js');
const moment = require('moment');

// 认证信息采用无状态的JWT
class UserController extends Controller {
  async login() {
    const {user, pwd} = this.ctx.request.body;
    const checkPwd = await this.service.user.checkLoginPwd(user, pwd);
    if (this.ctx.session.tryLogin > 10) {
      return this.ctx.body = {
        status: 0,
        msg: '错误次数超限，请稍后重试！'
      };
    }
    if (!checkPwd) {
      this.ctx.session.tryLogin  = (this.ctx.session.tryLogin || 0) + 1;
      return this.ctx.body = {
        status: 0,
        msg: '账号或密码不正确！'
      }
    }

    // 获取用户积分
    const getPoints = await this.app.model.UserBalance.findOne({
      where: {
        user
      }
    });

    // 登录成功返回加密的jwt,有效期30天
    const points = getPoints.points || 0;
    const role = 'user_user';
    const expire = moment().add('days', 30).valueOf();

    return this.ctx.body = {
      status: 1,
      msg: '登录成功',
      user: {
        user,
        points,
        expire,
        role
      },
      token: createJWT(user, role, expire)
    };
  }

  async reg() {
    const {user, pwd, qq, imei} = this.ctx.request.body;
    if (user.trim().lenght < 4 || user.trim().length > 12) {
      return this.ctx.body = {
        status: 0,
        msg: '账号4~12位数字或字母！'
      }
    }
    if (pwd.trim() === '') {
      return this.ctx.body = {
        status: 0,
        msg: '密码不能为空'
      };
    }
    if (this.ctx.session.tryReg >= 1) {
      return this.ctx.body = {
        status: 0,
        msg: '一个小时内只能注册一次！'
      };
    }

    const checkUser = await this.service.user.checkUserExist(user);
    if (checkUser) {
      return this.ctx.body = {
        status: 0,
        msg: '该账号已注册！'
      };
    }
    
    // 生成加密的jwt
    const points = 0;
    const role = 'user_user';
    const expire = moment().add(30, 'days').valueOf();
    try {
      await this.service.user.reg(user, pwd, qq);
    } catch(err) {
      console.log(err);
      return this.ctx.body = {
        status: 0,
        msg: '注册失败！'
      };
    }

    this.ctx.session.tryReg = (this.ctx.session.tryReg || 0) + 1;
    return this.ctx.body = {
      status: 1,
      msg: '注册成功！',
      user: {
        user,
        points,
        role,
        expire
      },
      token: createJWT(user, role, expire)
    };
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

  // 提交用户反馈信息
  async feedback() {
    const feedback = this.ctx.request.body.content || '';
    if (feedback.trim().length < 5 || feedback.trim().length > 100) {
      return this.ctx.body = {
        status: 0,
        msg: '内容无效或过长，提交失败！'
      };
    }
    const user = 'telanx';
    this.app.model.Feedback.create({
      user,
      content: feedback,
      create_time: moment().format('YYYY-MM-DD HH:mm:ss')
    });
    return this.ctx.body = {
      status: 1,
      msg: '感谢您的反馈和建议！'
    }
  }

  // 获取用户基本信息
  async getUserInfo() {
    const user = 'telanx';
    const userInfo = await this.app.model.User.findOne({
      where: {user},
      fields: ['qq', 'email', 'mobile', 'create_time']
    })
    return this.ctx.body = userInfo;
  }
  // 更新用户基本信息
  async updateInfo() {
    const user = 'telanx';
    const {qq, email, mobile} = this.ctx.request.body;
    const qqRegExp = /^\d{4,10}$/;
    const emailRegExp = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
    const mobileRegExp = /^1\d{10}$/;
    if (!qqRegExp.test(qq)) {
      return this.ctx.body = {
        status: 0,
        msg: 'qq不正确！'+qq
      };
    }

    if (!emailRegExp.test(email)) {
      return this.ctx.body = {
        status: 0,
        msg: '邮箱不正确！'
      };
    }

    if (!mobileRegExp.test(mobile)) {
      return this.ctx.body = {
        status: 0,
        msg: '手机号不正确！'
      };
    }

    const updateInfo = await this.app.model.User.update({qq, email, mobile}, {
      where: {user}
    });

    if (!updateInfo) {
      return this.ctx.body = {
        status: 0,
        msg: '更新失败！'
      }
    }
    return this.ctx.body = {
      status: 1,
      msg: '更新成功！'
    };
  }

  async updateLoginPwd() {
    const {pwd0, pwd1, pwd2} = this.ctx.request.body;
    const user = 'telanx';
    if (pwd1 !== pwd2) {
      return this.ctx.body = {
        status: 0,
        msg: '两次新密码输入不一致！'
      }
    }
    if (pwd0.trim() === '' || pwd1.trim() === '' || pwd2.trim() === '') {
      return this.ctx.body = {
        status: 0,
        msg: '密码不能为空'
      }
    }
    // 校验登录密码
    const checkLoginPwd = await this.service.user.checkLoginPwd(user, pwd0);
    if (!checkLoginPwd) {
      return this.ctx.body = {
        status: 0,
        msg: '原登录密码不正确！'
      }
    }
    const updateUser = await this.app.model.User.update({
      login_pwd: pwd1
    }, {
      where: {user}
    });
    if (!updateUser) {
      return this.ctx.body = {
        status: 0,
        msg: '更新失败！'
      }
    }
    return this.ctx.body = {
      status: 1,
      msg: '更新成功！'
    }
  }

  async updatePayPwd() {
    const {pwd0, pwd2} = this.ctx.request.body;
    const user = 'telanx';
    
    if (pwd0.trim() === '' || pwd2.trim() === '') {
      return this.ctx.body = {
        status: 0,
        msg: '密码不能为空'
      }
    }
    // 校验登录密码
    const checkPayPwd = await this.service.user.checkPayPwd(user, pwd0);
    if (!checkPayPwd) {
      return this.ctx.body = {
        status: 0,
        msg: '原支付密码不正确！'
      }
    }
    const updateUser = await this.app.model.User.update({
      pay_pwd: pwd2
    }, {
      where: {user}
    });
    if (!updateUser) {
      return this.ctx.body = {
        status: 0,
        msg: '更新失败！'
      }
    }
    return this.ctx.body = {
      status: 1,
      msg: '更新成功！'
    }
  }
}

module.exports = UserController;