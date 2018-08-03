/**
 * 商品接口
 */
module.exports = ({middleware, router, controller}) => {
  /** 获取商品分类 */
  router.post('/order/create', controller.order.create);
  router.get('/order/get/:id', controller.order.get);
  router.get('/order/cancel/:id', controller.order.cancel);
  router.post('/order/payByPoints/:id', middleware.jwt, controller.order.payByPoints);
};