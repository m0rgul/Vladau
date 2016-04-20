var patients = require('../../app/controllers/patients.server.controller'),
    login = require('../../app/controllers/login.server.controller');

module.exports = function (app) {
    app.route('/patients')
        .get(login.isAuthenticated, patients.getPatientsList)
        .post(login.isAuthenticated, login.isAdmin, patients.createUpdatePatients)
        .delete(login.isAuthenticated, login.isAdmin, patients.deletePatients);
    app.route('/patients/currentDoctor').get(login.isAuthenticated, patients.getPatientsForCurrentDoc);
    app.route('/patients/match').post(login.isAuthenticated, login.isAdmin, patients.checkPatientDoctor);
};