'use strict';

module.exports = app => {
  app.config.proxy = true;
  app.beforeStart(async function() {
    await app.model.sync();
  });
};