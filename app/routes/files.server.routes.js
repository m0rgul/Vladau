var files = require('../../app/controllers/files.server.controller'),
    login = require('../../app/controllers/login.server.controller'),
    multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});

var uploadImage = multer({storage: storage});

module.exports = function (app) {
    app.route('/files')
        .get(login.isAuthenticated, files.getFilesList)
        .post(login.isAuthenticated, login.isAdmin, uploadImage.single('file'), files.uploadFile)
        .delete(login.isAuthenticated, login.isAdmin, files.deleteFile);
    app.route('/download/:fileName/:originalName').get(login.isAuthenticated, files.downloadFile);
};