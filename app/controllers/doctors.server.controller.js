var CRUD = require('../modules/mysql_crud.js');
var fieldNames = ['username', 'password', 'email', 'fullName', 'phoneNo', 'address'];
var mysql = require('mysql'),
    bCrypt = require('bcryptjs'),
    forge = require('node-forge'),
    nodemailer = require('nodemailer'),
    smtpTransport = require("nodemailer-smtp-transport"),
    async = require('async');

exports.checkField = function (req, res) {
    var filters = req.body;
    if (Object.keys(filters).length > 0) {
        var filterArray = [];
        for (var key in filters) {
            if (key && filters[key]) {
                filterString = "`" + key + "`" + ' = ' + "'" + filters[key] + "'";
                filterArray.push(filterString);
            }
        }

        if (filterArray.length > 0)
            filterString = " WHERE " + filterArray.join(" AND ");
        else
            filterString = "";
    }
    var query = "SELECT * FROM `doctors`";
    if (filterString != "") {
        query += filterString + " ORDER BY id ASC";
        var connection = mysql.createConnection(mySqlConfig);


        connection.query(query, function (err, result) {
            if (err) {
                return res.send(err);
            }
            if (result && result.length > 0) {
                return res.json(false);
            } else {
                return res.json(true);
            }
        });

    }
};

exports.getDoctorList = function (req, res) {
    var tablecrud = new CRUD('doctors', fieldNames);

    var filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
    var page = req.query.page ? parseInt(req.query.page) : 0;
    var perPage = req.query.perPage ? parseInt(req.query.perPage) : 0;
    tablecrud.getList(filters, sort, page, perPage, function (err, result) {
        if (err) {
            response = {'success': false, 'error': err};
        } else {
            response = result;
        }
        return res.json(response);
    });
};

exports.createDoctor = function (req, res) {
    var tablecrud = new CRUD('doctors', fieldNames);
    var users = req.body;
    users.forEach(function (user) {
        if (user.password && user.password != '') {
            user.password = bCrypt.hashSync(user.password, 10);
        } else {
            user.passwordUnencrypted = randomPassword();
            var md = forge.md.sha256.create();
            var encryptedPass = md.update(user.passwordUnencrypted).digest().toHex();
            user.password = encryptedPass;
            user.password = bCrypt.hashSync(user.password, 10);
        }
    });

    tablecrud.insertUpdateRecord(users, function (err, result) {
        if (err) {
            console.log(err);
            return res.json(err);
        } else {
            var smtpTrans = nodemailer.createTransport(smtpTransport({
                host: "smtp1.servage.net",
                secureConnection: false,
                port: 2525,
                auth: {
                    user: "johnny@bluemind-software.ro",
                    pass: "bmspass1"
                }
            }));

            var websiteUrl = 'http://' + req.headers.host;

            //send emails
            async.each(users, function (user, callback) {
                var mailOptions = {
                    to: user.email,
                    from: 'johnny@bluemind-software.ro',
                    subject: 'Inregistrare',
                    html: '<h2>Buna ziua, <b>' + user.fullName.split(' ')[0] + '</b>!</h2><br/>' +
                    '&nbsp;Ati fost inregistrat(a) cu success pe <a href="' + websiteUrl + '">site-ul nostru</a> cu numele de utilizator <b>' + user.username + '</b>.<br/>'
                };
                if (user.passwordUnencrypted) {
                    //send password too
                    mailOptions.html += '&nbsp;Parola dvs. este: <b>' + user.passwordUnencrypted + '</b>. <br/>Parola poate fi schimbata oricand se doreste din panoul de control.<br/>';
                }

                mailOptions.html += 'Pentru orice nelamuriri, va rugam sa ne contactati.<br/><br/>Va dorim o zi buna in continuare!<br/>Echipa Ceva';
                smtpTrans.sendMail(mailOptions, function (err) {
                    if (err)
                        return callback(err);
                    console.log('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    callback(null, 'done');
                });
            }, function (err) {
                // if any of the file processing produced an error, err would equal that error
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                    return res.json(result);
                }
            });
        }
    });
};

exports.updateDoctor = function (req, res) {
    var tablecrud = new CRUD('doctors', fieldNames);
    var users = req.body;
    users.forEach(function (user) {
        if (user.password && user.password != '') {
            user.password = bCrypt.hashSync(user.password, 10);
        } else {
            delete user.password;
        }
    });

    tablecrud.insertUpdateRecord(users, function (err, result) {
        if (err) {
            console.log(err);
            return res.json(err);
        } else {
            console.log(result);
            return res.json(result);
        }
    });
};

exports.deleteDoctor = function (req, res) {
    var tablecrud = new CRUD('doctors', fieldNames);
    var users = req.body;
    tablecrud.deleteRecords(users, function (err, result) {
        if (err) {
            console.log(err);
            return res.json(err);
        } else {
            console.log(result);
            return res.json(result);
        }
    });
};

exports.getCurrentDoctor = function (req, res) {
    var id_doctor = req.session.user.id_doctor;
    var filters = {
        id: id_doctor
    };

    var sort = {
        fullname: 'asc'
    };

    var tablecrud = new CRUD('doctors', fieldNames);
    tablecrud.getList(filters, sort, 0, 0, function (err, response) {
        if (err)
            return res.json([]);
        else {
            var doc = response.records[0];

            var doctor = {
                id: doc.id,
                fullName: doc.fullName,
                address: doc.address,
                email: doc.email,
                phoneNo: doc.phoneNo
            };
            return res.json(doctor);
        }
    });
};
var randomPassword = function () {
    var length = 10;
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
    }
    return pass;
};

