var doctors = require('../../app/controllers/doctors.server.controller'),
    login = require('../../app/controllers/login.server.controller');

module.exports = function (app) {
    app.route('/doctors')
        .get(login.isAuthenticated, doctors.getDoctorList)
        .post(doctors.createDoctor)
        .put(login.isAuthenticated, doctors.updateDoctor)
        .delete(login.isAuthenticated, login.isAdmin, login.hasDoctorControl, doctors.deleteDoctor);

    app.route('/doctors/checkField').post(doctors.checkField);
    app.route('/doctors/currentDoctor').get(doctors.getCurrentDoctor);
};