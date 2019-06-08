const {Controller} = require('egg');
const {createJWT} = require('../utils/index.js');
const moment = require('moment');
const _ = require('lodash/object');

// 认证信息采用无状态的JWT
class UserController extends Controller {
  async login() {
    var {user, pwd, open_id} = this.ctx.request.body;
    
    if (this.ctx.session.tryLogin > 10) {
      return this.ctx.body = {
        status: 0,
        msg: '错误次数超限，请稍后重试！'
      };
    }

    var matchUser;
    // 仅对绑定了账号密码的进行验证
    console.log(open_id);
    if (typeof open_id !== 'undefined') {
      matchUser = await this.service.user.checkQQUser(open_id);
      if (!matchUser) {
        return this.ctx.body = {
          status: 0,
          newuser: 1,
          msg: '未绑定账号'
        };
      } else {
        user = matchUser.user;
      }
    } else {
      matchUser = await this.service.user.checkLoginPwd(user, pwd);
    }
    if (!matchUser) {
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
    const {qq} = matchUser;
    const points = getPoints.points || 0;
    const role = 'user_user';
    const expire = moment().add(30, 'days').valueOf();

    return this.ctx.body = {
      status: 1,
      msg: '登录成功',
      user: {
        user,
        qq,
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
        qq,
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

  // 提交用户反馈信息
  async feedback() {
    const feedback = this.ctx.request.body.content || '';
    if (feedback.trim().length < 5 || feedback.trim().length > 100) {
      return this.ctx.body = {
        status: 0,
        msg: '内容无效或过长，提交失败！'
      };
    }
    const user = this.ctx.user.user;
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
    const user = this.ctx.user.user;
    const userInfo = await this.app.model.User.findOne({
      where: {user}
    })
    return this.ctx.body = _.pick(userInfo, ['email', 'qq', 'reg_time', 'mobile']);
  }
  async getUserPoints() {
    const user = this.ctx.user.user;
    const balance = await this.app.model.UserBalance.findOne({
      where: {user}
    });
    return this.ctx.body = _.pick(balance, ['user', 'points']);
  }
  // 更新用户基本信息
  async updateInfo() {
    const user = this.ctx.user.user;
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
    const user = this.ctx.user.user;
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
    const user = this.ctx.user.user;
    
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

  // 签到送积分
  async checkin() {
    // 每天签到积分+1
    const EXTRA_POINTS = 1;
    const user = this.ctx.user.user;
    // 每天只能签到一次
    const matchUser = await this.app.model.User.findOne({
      where: {user}
    });
    if (matchUser.last_checkin_time
      && moment(matchUser.last_checkin_time).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        return this.ctx.body = {
          status: 0,
          msg: '您当日已签到了！'
        }
      }

    // 记录上次签到时间
    this.app.model.User.update({
      last_checkin_time: moment().format('YYYY-MM-DD HH:mm:ss')
    }, { where: {user}});
    
    // 积分加1并记录到balance_changelog表
    const user_balance = await this.app.model.UserBalance.findOne({
      where: { user }
    });

    if (!user_balance) {
      return this.ctx.body = {
        status: 0,
        points: 0,
        msg: '签到失败！账户异常！'
      };
    }

    this.app.model.UserBalance.update({
      points: user_balance.points + EXTRA_POINTS
    }, { where: {user}});
    this.app.model.BalanceChangelog.create({
      user,
      type: 'points',
      change_amt: EXTRA_POINTS,
      before_balance: user_balance.points,
      balance: user_balance.points + EXTRA_POINTS,
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      remark: '签到积分+' + EXTRA_POINTS 
    });

    return this.ctx.body = {
      status: 1,
      msg: '签到成功！积分+' + EXTRA_POINTS,
      points: user_balance.points + EXTRA_POINTS
    };
  }

  // 分享送积分
  async share() {
    // 每天签到积分+1
    const EXTRA_POINTS = 1;
    const user = this.ctx.user.user;
    // 每天只能签到一次
    const matchUser = await this.app.model.User.findOne({
      where: {user}
    });
    if (matchUser.last_share_time
      && moment(matchUser.last_share_time).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        return this.ctx.body = {
          status: 0,
          msg: '您当日已分享过了！'
        }
      }

    // 记录上次签到时间
    this.app.model.User.update({
      last_share_time: moment().format('YYYY-MM-DD HH:mm:ss')
    }, { where: {user}});
    
    // 积分加1并记录到balance_changelog表
    const user_balance = await this.app.model.UserBalance.findOne({
      where: { user }
    });

    if (!user_balance) {
      return this.ctx.body = {
        status: 0,
        points: 0,
        msg: '分享获取积分失败！账户异常！'
      };
    }

    this.app.model.UserBalance.update({
      points: user_balance.points + EXTRA_POINTS
    }, { where: {user}});
    this.app.model.BalanceChangelog.create({
      user,
      type: 'points',
      change_amt: EXTRA_POINTS,
      before_balance: user_balance.points,
      balance: user_balance.points + EXTRA_POINTS,
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      remark: '分享积分+' + EXTRA_POINTS 
    });

    return this.ctx.body = {
      status: 1,
      msg: '分享成功！积分+' + EXTRA_POINTS,
      points: user_balance.points + EXTRA_POINTS
    };
  }


  // 卡密充值
  async chargeByCard() {
    const {card} = this.ctx.request.body;
    const user = this.ctx.user.user;
    // 查询卡密是否正确且未被绑定
    const matchCard = await this.app.model.Card.findOne({
      where: {
        card_no: card,
        charge_user: null,
        activate_time: null
      }
    });

    if (!matchCard) {
      return this.ctx.body = {
        status: 0,
        msg: '无效的卡密'
      }
    }

    const matchUser = await this.app.model.User.findOne({
      where: {user}
    });

    if (!matchUser) {
      return this.ctx.body = {
        status: 0,
        msg: '账户异常，充值失败！'
      }
    }

    const {price, points} = matchCard;
    const chargeResult = await this.service.balance.chargePoints(user, points, '卡密' + price + '充值积分' + points);
    if (chargeResult.status) {
      // 充值之后更改卡密状态
      this.app.model.Card.update({
        charge_user: user,
        activate_time: moment().format('YYYY-MM-DD HH:mm:ss')
      }, {
        where: {card_no: card}
      });
    }

    return this.ctx.body = chargeResult;
  }

  // 用户账单
  async getUserBill() {
    const PAGE_SIZE = 10;
    let user = this.ctx.user.user;
    let {page, page_size} = this.ctx.request.body;
    
    if (!page_size || page_size && page_size > PAGE_SIZE) {
      page_size = PAGE_SIZE
    }
    const result = await this.app.model.BalanceChangelog.findAll({
      where: {
        user
      },
      limit: page_size,
      offset: page_size * page,
      'order': [
        ['time', 'DESC']
      ]
    });
    return this.ctx.body = result.map(r => {
      let f = r.balance > r.before_balance;
      var q = {
        time: moment(r.time).format('YYYY-MM-DD'),
        type: f ? '收入' : '支出',
        change_amt_str: (f ? '+' : '-') + r.change_amt,
        income: !!f
      };
      return Object.assign(r.dataValues, q);
    });
  }

  // 绑定快捷登录
  async bindOpneId() {
    const {open_id} = this.ctx.request.body;
    const user = this.ctx.user.user;
    var matchOpenId = await this.app.model.QQUser.findOne({
      where: {
        open_id
      }
    });
    if (matchOpenId) {
      return this.ctx.body = {
        status: 0,
        msg: '您当前授权QQ已绑定过账号！'
      };
    }
    var res = await this.app.model.QQUser.create({
      open_id,
      user
    });

    if (res) {
      return this.ctx.body = {
        status: 1,
        msg: '绑定成功！'
      };
    } else {
      return this.ctx.body = {
        status: 0,
        msg: '绑定失败！您当前授权QQ可能已经绑定了其它账号！'
      };
    }
  }
}

module.exports = UserController;