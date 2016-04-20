var CRUD = require('../modules/mysql_crud.js'),
    fs = require('fs'),
    mysql = require('mysql');
var fieldNames = ['id_patient', 'title', 'url', 'comments'];

exports.getFilesList = function (req, res) {
    var connection = mysql.createConnection(mySqlConfig);
    var filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
    var page = req.query.page ? parseInt(req.query.page) : 0;
    var perPage = req.query.perPage ? parseInt(req.query.perPage) : 0;

    var filterString = "";

    if (Object.keys(filters).length > 0) {
        var filterArray = [];
        for (var key in filters) {
            if (key && filters[key]) {
                filterString = key + ' LIKE ' + "'%" + filters[key] + "%'";
                filterArray.push(filterString);
            }
        }

        if (filterArray.length > 0)
            filterString = " WHERE " + filterArray.join(" AND ");
        else
            filterString = "";
    }
    var query = "SELECT f.*, p.fullName AS patientName, d.fullName AS doctorName FROM `files` AS f " +
        "JOIN `patients` AS p ON f.id_patient = p.id " +
        "JOIN `doctors` AS d ON p.id_doctor = d.id";

    if (filterString != "")
        query += filterString + " ";
    if (Object.keys(sort).length > 0) {
        query += " ORDER BY ";
        for (var key in sort) {
            query += mysql.escape(key) + " " + mysql.escape(sort[key]);
        }
    } else
        query += " ORDER BY id ASC";

    var totalRecs = 0;

    console.log(query);

    connection.query(query, function (err, rows) {
        if (err) {
            console.log(err);
            return res.json(err);
        }
        totalRecs = rows.length;
    });

    if (page && perPage) {
        var offset = (page - 1) * perPage;
        query += " LIMIT " + offset + "," + perPage;
    }

    connection.query(query, function (err, rows) {
        if (err) {
            return res.json(err);
        }
        if (rows && rows.length > 0) {
            var files = [];
            rows.forEach(function (file) {
                console.log(file);
                var id = file.id;
                var fileName = id + ".dcm";
                var originalName = file.original_name ? file.original_name : fileName;
                if (fs.existsSync('./public/patientFiles/' + fileName))
                    files.push({
                        id: file.id,
                        title: file.title,
                        url: '/download/' + fileName + "/" + originalName,
                        patient: file.patientName,
                        doctor: file.doctorName,
                        comments: file.comments,
                        date: file.date_time
                    });
            });
            var result = {total: totalRecs, records: files};
            return res.json(result);
        } else {
            return res.json({total: 0, records: []});
        }
    });
};

exports.uploadFile = function (req, res) {
    console.log(req.file);

    var fileId = req.body.id ? req.body.id : 0;
    var id_patient = req.body.id_patient;
    var title = req.body.title;
    var comments = req.body.comments ? req.body.comments : "";
    var idFile = 0;


    var connection = mysql.createConnection(mySqlConfig);

    var file = {
        id_patient: id_patient,
        title: title,
        comments: comments
    };

    console.log(file);
    console.log(fileId);

    if (req.file)
        file.original_name = req.file.originalname;

    var query = '';

    if (fileId <= 0) {
        query = "INSERT INTO `files` SET ?";
        query = mysql.format(query, file);
    }
    else {
        query = "UPDATE `files` SET ? WHERE `id`=?";
        query = mysql.format(query, [file, fileId]);
    }

    console.log(query);

    connection.query(query, function (err, result) {
        if (err) {
            return res.json(err);
        }
        else {
            console.log(result);
            idFile = result.insertId;
            var resp = {"success": true, "msg": "The modifications have been successfully applied."};

            if (req.file) {
                /* Move file */
                var sourceFile = "./" + req.file.path.replace("\\", "/");

                var is = fs.createReadStream(sourceFile);
                var type = ".dcm";


                var destination = "./public/patientFiles";

                if (!fs.existsSync(destination)) {
                    fs.mkdirSync(destination);
                }
                var file = fileId > 0 ? fileId + type : idFile + type;

                if (fs.existsSync(destination + "/" + file))
                    fs.unlinkSync(destination + "/" + file);

                var os = fs.createWriteStream(destination + "/" + file);

                is.pipe(os);
                is.on('end', function () {
                    fs.unlinkSync(sourceFile);
                });
            }
            return res.json(resp);
        }
    });
};

exports.downloadFile = function (req, res) {
    var fileName = req.params.fileName;
    var originalName = req.params.originalName;
    var filePath = './public/patientFiles/' + fileName;

    res.download(filePath, originalName);
};

exports.deleteFile = function (req, res) {
    var tablecrud = new CRUD('files', fieldNames);
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

