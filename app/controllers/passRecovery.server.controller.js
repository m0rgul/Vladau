var async = require('async'),
    mysql = require('mysql'),
    crypto = require('crypto'),
    dateFormat = require('dateformat'),
    bCrypt = require('bcryptjs'),
    nodemailer = require('nodemailer'),
    smtpTransport = require("nodemailer-smtp-transport");

exports.render = function (req, res) {
    var level = req.params.level;
    res.render('forgotPass', {user: {level: level}});
};

exports.generateRecoveryToken = function (req, res) {
    var connection = mysql.createConnection(mySqlConfig);

    var email = req.body.email;
    var level = req.body.level;
    var db = level == 'user' ? 'users' : 'doctors';

    async.waterfall(
        [
            generateToken = function (callback) {
                crypto.randomBytes(20, function (err, buf) {
                    console.log('err: ' + JSON.stringify(err));
                    if (err)
                        return callback(err);
                    var token = buf.toString('hex');
                    console.log('token: ' + token);
                    callback(null, token);
                });
            },
            getUserFromDB = function (token, callback) {
                var query = "SELECT * FROM ?? WHERE ?? = ?";
                var inserts = [db, 'email', email];
                query = mysql.format(query, inserts);
                console.log(query);
                connection.query(query, function (err, rows) {
                    if (err)
                        return callback(err);
                    if (rows && rows.length == 1) {
                        user = rows[0];
                        callback(null, token, user);
                    }
                    else
                        return callback({msg: "Email not found in data base."});
                });

            },
            writeTokenToDB = function (token, user, callback) {
                var tokenExpires = dateFormat(Date.now() + (3600 * 1000), "yyyy-mm-dd HH:MM:ss");
                var id = user.id;
                var query = "UPDATE ?? SET ? WHERE `id` = " + id;
                query = mysql.format(query, [db, {resetPasswordToken: token, resetPasswordExpires: tokenExpires}]);
                console.log('q: ' + query);
                connection.query(query, function (err, result) {
                    if (err)
                        return callback(err);
                    if (result.affectedRows > 0)
                        callback(null, token, user);
                    else
                        return callback({msg: 'Something went wrong somewhere...over the rainbow...'});
                });
            },
            sendEmail = function (token, user, callback) {
                var smtpTrans = nodemailer.createTransport(smtpTransport({
                    host: "smtp1.servage.net",
                    secureConnection: false,
                    port: 2525,
                    auth: {
                        user: "johnny@bluemind-software.ro",
                        pass: "bmspass1"
                    }
                }));

                var link = 'http://' + req.headers.host + '/reset/' + token + '/' + level;

                var mailOptions = {
                    to: user.email,
                    from: 'johnny@bluemind-software.ro',
                    subject: 'Resetare Parola',
                    html: '<h2>Buna ziua, ' + user.fullName.split(' ')[0] + '</h2><br/>' +
                    'Va trimitem acest email pentru ca dvs. (sau altcineva) a cerut resetarea parolei contului.<br/>' +
                    'Pentru resetare, va rugam sa accesati acest <a href="' + link + '">link</a>. Link-ul este valabil timp de o ora de la momentul cererii schimbarii de parola.<br/>' +
                    'Daca nu s-a cerut schimbarea parolei, ignorati acest email si parola va ramane neschimbata. <br/><br/>' +
                    'Pentru orice alte informatii, nu ezitati sa ne contactati.<br/><br/>O zi buna, <br/>Echipa Tralalalala'
                };

                console.log(JSON.stringify(mailOptions));
                smtpTrans.sendMail(mailOptions, function (err) {
                    if (err)
                        return callback(err);
                    console.log('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    callback(null, 'done');
                });
                /*var message = 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                 'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                 'http://' + req.headers.host + '/reset/' + token + '/' + level + '\n\n' +
                 'If you did not request this, please ignore this email and your password will remain unchanged.\n';
                 callback(null, message);*/
            }
        ],
        function (err) {
            console.log(err);
            if (err)
                return res.json({succes: false, msg: err});

            return res.send('ok');
        }
    );
};

exports.recoverPassword = function (req, res) {
    var token = req.params.token;
    var level = req.params.level;
    var db = level == 'user' ? 'users' : 'doctors';

    var connection = mysql.createConnection(mySqlConfig);

    var query = "SELECT * FROM `" + db + "` WHERE `resetPasswordToken` = '" + token + "' AND `resetPasswordExpires` > '" + dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss") + "'";

    connection.query(query, function (err, result) {
        if (err)
            return res.send(err);
        if (result.length > 0)
            return res.render('passRecover', {user: {level: level}});
        else
            return res.redirect('/forgot/' + level);
    });
};

exports.resetPassword = function (req, res) {
    var newPass = bCrypt.hashSync(req.body.password, 10);
    var token = req.params.token;
    var level = req.params.level;
    var db = level == 'user' ? 'users' : 'doctors';

    var connection = mysql.createConnection(mySqlConfig);

    async.waterfall([
        getUser = function (callback) {
            var query = "SELECT * FROM `" + db + "` WHERE `resetPasswordToken` = '" + token + "' AND `resetPasswordExpires` > '" + dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss") + "'";

            connection.query(query, function (err, result) {
                if (err)
                    return callback(err);
                if (result.length > 0) {
                    var user = result[0];
                    callback(null, user);
                }
                else
                    return callback({msg: 'Password reset token is invalid or has expired.'});
            });
        },
        updatePassword = function (user, callback) {
            var query = "UPDATE ?? SET ? WHERE `id` = " + user.id;
            query = mysql.format(query, [db, {resetPasswordToken: '', resetPasswordExpires: '', password: newPass}]);
            console.log('q: ' + query);
            connection.query(query, function (err, result) {
                console.log('update err: ' + JSON.stringify(err));
                console.log('update result: ' + JSON.stringify(result));
                if (err)
                    return callback(err);
                if (result.affectedRows > 0)
                    callback(null, user);
                else
                    return callback({msg: 'Something went wrong somewhere...over the rainbow...'});
            });
        },
        sendEmail = function (user, callback) {
            var message = 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n';
            callback(null, message);
        }
    ], function (err, message) {
        if (err)
            return res.json({success: false, msg: err});
        return res.json({success: true, msg: message});
    });
};



