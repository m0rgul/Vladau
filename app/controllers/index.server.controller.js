exports.render = function (req, res) {
    console.log(req.session.user);
    if (!req.session.user || !req.session.user.id_doctor) {
        req.session.destroy();
        res.redirect('/login');
    }

    else
        res.render('doctorHome.ejs', {user: req.session.user});
};

exports.renderLogin = function (req, res) {
    if (req.session.user && req.session.user.id_doctor && req.session.user.id_doctor > 0)
        res.redirect('/');
    else
        res.render('index.ejs');
};