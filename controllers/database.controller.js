// controllers/database.controller.js
const catalogController = require('./database/catalog.controller');
const quoteController = require('./database/quote.controller');
const systemController = require('./database/system.controller');
const queryController = require('./database/query.controller');

module.exports = {
    ...catalogController,
    ...quoteController,
    ...systemController,
    ...queryController
};