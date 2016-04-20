var CRUD = require('../modules/mysql_crud.js'),
    bCrypt = require('bcryptjs'),
    forge = require('node-forge'),
    mysql = require('mysql'),
    nodemailer = require('nodemailer'),
    smtpTransport = require("nodemailer-smtp-transport"),
    async = require('async');
var fieldNames = ['username', 'email', 'password', 'userControl', 'doctorControl'];

exports.actions = function (req, res) {
    var action = req.query.action;

    var response;
    switch (action) {
        case 'view':
            getUserList(req, function (err, result) {
                if (err) {
                    response = {'success': false, 'error': err};
                } else {
                    response = result;
                }
                return res.json(response);
            });
            break;

        case "create":
        case 'update':
            createUpdateUser(req, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.json(err);
                } else {
                    console.log(result);
                    return res.json(result);
                }
            });
            break;

        case "destroy":
            deleteUsers(req, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.json(err);
                } else {
                    console.log(result);
                    return res.json(result);
                }
            });
            break;

        default:
            res.json({'success': false, 'error': 'No method specified.'});
            break;
    }
};

exports.getUsersList = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
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

exports.createUsers = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
    var users = req.body;

    users.forEach(function (user) {
        if (user.password && user.password != '') {
            user.password = bCrypt.hashSync(user.password, 10);
        } else {
            console.log('no pass. generating one.');
            user.unencryptedPassword = randomPassword();
            var md = forge.md.sha256.create();
            var encryptedPass = md.update(user.unencryptedPassword).digest().toHex();
            user.password = bCrypt.hashSync(encryptedPass, 10);
        }
    });

    tablecrud.insertUpdateRecord(users, function (err, response) {
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

            var websiteUrl = 'http://' + req.headers.host + '/admin';

            //send emails
            async.each(users, function (user, callback) {
                var mailOptions = {
                    to: user.email,
                    from: 'johnny@bluemind-software.ro',
                    subject: 'Inregistrare',
                    html: '<h2>Buna ziua, <b>' + user.username + '</b>!</h2><br/>' +
                    'Ati fost inregistrat(a) cu success pe <a href="' + websiteUrl + '">site-ul nostru</a> cu numele de utilizator <b>' + user.username + '</b>.<br/>'
                };
                if (user.unencryptedPassword) {
                    //send password too
                    mailOptions.html += 'Parola dvs. este: <b>' + user.unencryptedPassword + '</b>. <br/>Parola poate fi schimbata oricand se doreste din panoul de control.<br/>';
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
                    console.log(response);
                    return res.json(response);
                }
            });
        }
    });
};

exports.updateUsers = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
    var users = req.body;

    users.forEach(function (user) {
        if (user.password && user.password != '')
            user.password = bCrypt.hashSync(user.password, 10);
    });

    tablecrud.insertUpdateRecord(users, function (err, response) {
        if (err) {
            console.log(err);
            return res.json(err);
        } else {
            console.log(result);
            return res.json(response);
        }
    });
};

exports.deleteUsers = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
    var users = req.body;
    console.log(users);
    if (users)
        tablecrud.deleteRecords(users, function (err, result) {
            if (err) {
                console.log(err);
                return res.json(err);
            } else {
                console.log(result);
                return res.json(result);
            }
        });
    else {
        console.log('no data');
        return res.json({});
    }
};

exports.changeUserPassword = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
    var user = req.body;
    user.id = req.session.user.id_admin;
    user.password = bCrypt.hashSync(user.password, 10);

    tablecrud.insertUpdateRecord([user], function (err, response) {
        if (err) {
            console.log(err);
            return res.json(err);
        } else {
            console.log(result);
            return res.json(response);
        }
    });
};

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
    var query = "SELECT * FROM `users`";
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