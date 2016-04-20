var config = require('./config'),
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    logger = require('morgan');

module.exports = function () {
    var app = express();
    app.use(logger('dev'));

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    app.use(session({
        saveUninitialized: true,
        resave: true,
        secret: 'SuperFabSecretCookie'
    }));

    app.set('views', './app/views');
    app.set('view engine', 'ejs');


    app.use(express.static('./public'));

    require('../app/routes/index.server.routes.js')(app);
    require('../app/routes/admin.server.routes.js')(app);
    require('../app/routes/login.server.routes.js')(app);
    require('../app/routes/users.server.routes.js')(app);
    require('../app/routes/doctors.server.routes.js')(app);
    require('../app/routes/patients.server.routes.js')(app);
    require('../app/routes/files.server.routes.js')(app);
    require('../app/routes/passRecovery.server.routes.js')(app);

    mySqlConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'medical'
    };

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

    return app;
};