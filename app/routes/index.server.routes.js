var index = require('../../app/controllers/index.server.controller');

module.exports = function (app) {
    app.route('/')
        .get(index.render);
    app.route('/login').get(index.renderLogin);
};