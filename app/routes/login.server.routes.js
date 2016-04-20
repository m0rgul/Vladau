var login = require('../../app/controllers/login.server.controller');

module.exports = function (app) {
    app.route('/login').post(login.loginDoctor);
    app.route('/admin/login').post(login.loginAdmin);

    app.route('/logout').get(login.logout).post(login.logout);
};