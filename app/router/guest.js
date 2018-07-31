/**
 * 访客模式下一些接口
 */
module.exports = ({router, controller}) => {
  /** 商品分类 */
  router.get('/guest/goods_cata', controller.guest.getGoodsCata);
  /** 获取首页其它数据，不包括分类 */
  router.get('/guest/getHomePageData', controller.guest.getHomePageData);
  
  router.post('/guest/getOrder', controller.order.getOrderByVisitor);
};