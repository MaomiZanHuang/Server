/**
 * 用户的一些接口
 */
module.exports = ({middleware, router, controller}) => {
  // 获取用户基本信息
  router.get('/user/info',  middleware.jwt(), controller.user.getUserInfo);
  // 更新基本信息
  router.post('/user/update_info', middleware.jwt(), controller.user.updateInfo);
  // 用户登录
  router.post('/user/login', controller.user.login);
  // 用户注册
  router.post('/user/reg', controller.user.reg);

  router.post('/user/update_loginpwd', middleware.jwt(), controller.user.updateLoginPwd);
  router.post('/user/update_paypwd', middleware.jwt(), controller.user.updatePayPwd)
  // 用户反馈记录
  router.post('/user/feedback', middleware.jwt(), controller.user.feedback);

  // 用户签到送积分
  router.get('/user/checkin', middleware.jwt(), controller.user.checkin);

  // 卡密充值积分
  router.post('/user/chargeByCard', middleware.jwt(), controller.user.chargeByCard);
};