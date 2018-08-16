/**
 * 商品接口
 */
module.exports = ({middleware, router, controller}) => {
  // 卡密网创建订单
  router.post('/pay/getCardOrder', controller.pay.getCardOrder);
  // 查询订单状态，卡密
  router.get('/pay/card_pay/:id', controller.pay.queryCardOrder);
  router.post('/pay/create', middleware.jwt(), controller.pay.create);
  // 查询订单状态，原生
  router.get('/pay/app_pay/:id', middleware.jwt(), controller.pay.queryAppOrder);
};