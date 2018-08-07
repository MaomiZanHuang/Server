const JWT = require('jwt-simple');

const SECRET_KEY = 'zanhuang';

// 数字补0
const fillNum = n => n > 9
  ? n + ''
  : '0' + n;

// 获取当前时间戳的unix,格式yyyyMMdd_8位时间戳
const getUid = () => {
  let d = new Date;
  let year = d.getFullYear();
  let month = fillNum(d.getMonth() + 1);
  let day = fillNum(d.getDate());
  return year + month + day + '_' + ((+d) + '').slice(-8);
}

// 创建加密的jwt数据
const createJWT = (user, role, expire) => {
  return JWT.encode({user, role, expire}, SECRET_KEY);
};

// 解密jwt数据返回
const parseJWT = sign => {
  return JWT.decode(sign, SECRET_KEY);
};

// 获取所有接口参数映射表
const getApiParamsAlias = () => {
  const alias = {
    qq: 'qq',
    need_num_0: 'amt',
    ksid: 'ksid'
  };
  return alias;
};

module.exports = {
  fillNum,
  getUid,
  createJWT,
  parseJWT,
  getApiParamsAlias
};