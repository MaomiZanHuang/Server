module.exports = ({router, controller}) => {
  router.get('/card/query', controller.card.queryCards);
};