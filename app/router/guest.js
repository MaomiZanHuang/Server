/**
 * 访客模式下一些接口
 */
module.exports = ({middleware, router, controller}) => {
  /** 商品分类 */
  router.get('/guest/goods_cata', controller.guest.getGoodsCata);
  /** 获取首页其它数据，不包括分类 */
  router.get('/guest/getHomePageData', controller.guest.getHomePageData);
  
  router.post('/guest/getOrder', controller.order.getOrderByVisitor);

  router.get('/guest/getShuoshuo', middleware.jwt(), controller.guest.getShuoshuo);

  // 充值选项
  router.get('/guest/charge_options', controller.guest.getChargeOptions);

  // 有米和万普广告任务回调地址
  router.get('/guest/youmi_adv_cb', controller.guest.youmi_adv_cb);
  router.get('/guest/waps_adv_cb', controller.guest.waps_adv_cb);
  router.get('/guest/waps_pay_cb', controller.guest.waps_pay_cb);
};