const {parseJWT} = require('../utils/index');

module.exports = () => {
  return async (ctx, next) => {
    if (ctx.request.header['jwt']) {
      let token = ctx.request.header['jwt'];
      try {
        const user = parseJWT(token);
        ctx.user = user;
      } catch(err) {
        console.log(err);
        ctx.status = 403;
        ctx.body = {
          status: 0,
          msg: 'token失效！请重新登录!'
        };
        return false;
      }
      await next();
    } else {
      ctx.status = 403;
      ctx.body = '<h1>403 Forbidden</h1>';
    }
  }
}