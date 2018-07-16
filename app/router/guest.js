/**
 * 访客模式下一些接口
 */
module.exports = ({router, controller}) => {
  /** 获取商品分类 */
  router.get('/guest/goods_cata', controller.guest.getGoodsCata);
  
  /** 当日销量排行前5的商品 */
  router.get('/guest/top5_hot_goods', controller.guest.getTop5HotGoods);

  /** 最近5条公告 */
  router.get('/guest/latest_5notice', controller.guest.getLatest5Notices);
};