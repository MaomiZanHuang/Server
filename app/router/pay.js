/**
 * 商品接口
 */
module.exports = ({middleware, router, controller}) => {
  // 卡密网创建订单
  router.post('/pay/getCardOrder', controller.pay.getCardOrder);
  // 查询订单状态
  router.get('/pay/:id', controller.pay.queryCardOrder);
};