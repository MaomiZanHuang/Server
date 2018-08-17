'use strict';

exports.sequelize = {
  enable: true,
  package: 'egg-sequelize'
};

exports.security = {
  enable: false
};

exports.email = {
  enable: true,
  package: 'egg-email'
};

exports.logger = {
  level: 'DEBUG',
};