var users = require('../../app/controllers/users.server.controller'),
    login = require('../../app/controllers/login.server.controller');

module.exports = function (app) {
    app.route('/users')
        .get(login.isAuthenticated, login.isAdmin, login.hasUserControl, users.getUsersList)
        .post(login.isAuthenticated, login.isAdmin, login.hasUserControl, users.createUsers)
        .put(login.isAuthenticated, login.isAdmin, login.hasUserControl, users.updateUsers)
        .delete(login.isAuthenticated, login.isAdmin, login.hasUserControl, users.deleteUsers);
    app.route('/users/changePassword').post(login.isAuthenticated, login.isAdmin, login.hasUserControl, users.changeUserPassword);
    app.route('/users/checkField').post(login.isAuthenticated, login.isAdmin, login.hasUserControl, users.checkField)
};