var passRecover = require('../../app/controllers/passRecovery.server.controller');

module.exports = function (app) {
    app.route('/forgot/:level').get(passRecover.render);
    app.route('/recoveryToken').post(passRecover.generateRecoveryToken);
    app.route('/reset/:token/:level')
        .get(passRecover.recoverPassword)
        .post(passRecover.resetPassword);
};