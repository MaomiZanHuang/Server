const sequelizeConfig = require('./config.sequelize');
const emailConfig = require('./config.email');

module.exports = appInfo => {
  const config = exports = {};
  config.keys = 'QX';

  config.middleware = [];
  config.sequelize = sequelizeConfig;
  config.email = emailConfig;
  return config;
};