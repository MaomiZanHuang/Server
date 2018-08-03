/**
 * 商品接口
 */
module.exports = ({middleware, router, controller}) => {
  /** 获取商品分类 */
  router.post('/pay/getCardOrder', controller.pay.getCardOrder);
  router.get('/pay/:id', controller.pay.queryCardOrder);
};