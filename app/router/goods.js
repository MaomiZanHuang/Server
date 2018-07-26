/**
 * 商品的一些接口
 */
module.exports = ({router, controller}) => {
  router.get('/goods/get/:id', controller.goods.get);
};