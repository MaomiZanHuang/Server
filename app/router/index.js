/**
  1.获取业务分类排序sort_index
  /api/fetch/goodsCata/[online]
  2.获取日销量前5商品
  /api/fetch/todayHotGoods
  3.根据时间当月，最近一周，所有事件过滤查询销量排行商品
  /api/hotGoods/
  4.登录注册
  5.订单查询
  6.获取用户订单分页
  7.新增反馈建议
  8.更新用户资料，更新密码，支付密码
  /user/login
  /user/logout
  /user/reg
  /user/update
  /user/charge
  /user/resetPwd/loginpwd
  /user/resetPwd/paypwd
  以下是下单、充值的接口
 */

module.exports = require('require-directory')(module);