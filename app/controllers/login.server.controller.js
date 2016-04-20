var mysql = require('mysql');
var bcrypt = require('bcryptjs');

exports.loginDoctor = function (req, res) {
    var connection = mysql.createConnection(mySqlConfig);
    var username = req.body.username;
    var password = req.body.password;

    var query = "SELECT * FROM `doctors` WHERE `username` = '" + username + "'";
    console.log(query);

    connection.query(query, function (err, response) {
        if (err)
            return res.send('Error: ' + JSON.stringify(err));

        if (response && response.length > 0) {
            if (response.length > 1)
                return res.json({success: false, msg: 'DB Error. More than 1 user found with this username!'});

            else {
                var resp = response[0];
                var dbPass = resp.password;
                //password = mysql.escape(password);

                console.log('db pass: ' + dbPass);
                console.log('user pass: ' + password);
                if (bcrypt.compareSync(password, dbPass)) {
                    var user = {
                        id_doctor: resp.id
                    };
                    req.session.user = user;
                    return res.json({success: true, msg: 'Autentificare reusita.'});
                } else {
                    return res.json({success: false, msg: 'Nume utilizator sau parola gresite.'});
                }
            }
        } else {
            return res.json({success: false, msg: 'Nu am gasit utilizatorul.'});
        }
    });
};

exports.loginAdmin = function (req, res) {
    var connection = mysql.createConnection(mySqlConfig);
    var username = req.body.username;
    var password = req.body.password;

    console.log('login pass: ' + password);

    var query = "SELECT * FROM `users` WHERE `username` = '" + username + "'";

    connection.query(query, function (err, response) {
        if (err)
            return res.send('Error: ' + JSON.stringify(err));

        if (response && response.length > 0) {
            if (response.length > 1)
                return res.json({success: false, msg: 'DB Error. More than 1 user found with this username!'});

            else {
                var resp = response[0];
                var dbPass = resp.password;
                if (bcrypt.compareSync(password, dbPass)) {
                    var user = {
                        id_admin: resp.id,
                        userControl: resp.userControl == 1,
                        doctorControl: resp.doctorControl == 1
                    };
                    req.session.user = user;
                    return res.json({success: true, msg: 'Autentificare reusita.'});
                } else {
                    return res.json({success: false, msg: 'Nume utilizator sau parola gresite.'});
                }
            }
        } else
            return res.json({success: false, msg: 'Utilizatorul nu a fost gasit.'});
    });
};

exports.logout = function (req, res) {
    var user = req.session.user;
    if (user && user.id_admin) {
        //admin
        req.session.destroy();
        return res.redirect('/admin');
    } else if (user && user.id_doctor) {
        //doctor
        req.session.destroy();
        return res.redirect('/');
    } else {
        req.session.destroy();
        return res.redirect('/');
    }
};

exports.isAuthenticated = function (req, res, next) {
    var session = req.session;
    if (!session.user) {
        return res.sendStatus(403);
    }
    next();
};

exports.isAdmin = function (req, res, next) {
    var session = req.session;
    if (!session.user.id_admin)
        return res.sendStatus(403);
    next();
};

exports.hasUserControl = function (req, res, next) {
    var user = req.session.user;
    if (!user.userControl)
        return res.sendStatus(403);
    next();
};

exports.hasDoctorControl = function (req, res, next) {
    var user = req.session.user;
    if (!user.doctorControl)
        return res.sendStatus(403);
    next();
};