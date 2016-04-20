var admin = require('../../app/controllers/admin.server.controller');

module.exports = function (app) {
    app.route('/admin')
        .get(admin.render);
    app.route('/admin/login')
        .get(admin.renderLogin);
};