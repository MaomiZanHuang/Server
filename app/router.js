const routes = require('./router/index');

module.exports = app => {
  // 加载路由
  Object.keys(routes).forEach(k => {
    let router = routes[k];
    typeof router === 'function' && router(app);
  });
}