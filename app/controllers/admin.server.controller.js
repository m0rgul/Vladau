exports.render = function (req, res) {
    if (!req.session.user || !req.session.user.id_admin) {
        req.session.destroy();
        res.redirect('/admin/login');
    }
    else
        res.render('adminHome.ejs', {user: req.session.user});
};

exports.renderLogin = function (req, res) {
    if (req.session.user && req.session.user.id_admin && req.session.user.id_admin > 0)
        res.redirect('/admin');
    else
        res.render('admin.ejs');
};