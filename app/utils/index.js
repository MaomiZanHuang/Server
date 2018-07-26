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

module.exports = {
  fillNum,
  getUid
};