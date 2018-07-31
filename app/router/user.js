/**
 * 用户的一些接口
 */
module.exports = ({router, controller}) => {
  // 获取用户基本信息
  router.get('/user/info', controller.user.getUserInfo);
  // 更新基本信息
  router.post('/user/update_info', controller.user.updateInfo);
  // 用户登录
  router.post('/user/login', controller.user.login);
  // 用户注册
  router.post('/user/reg', controller.user.reg);

  router.post('/user/update_loginpwd', controller.user.updateLoginPwd);
  router.post('/user/update_paypwd', controller.user.updatePayPwd)
  // 用户反馈记录
  router.post('/user/feedback', controller.user.feedback);
};