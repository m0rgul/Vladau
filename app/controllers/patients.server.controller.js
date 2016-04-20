var CRUD = require('../modules/mysql_crud.js'),
    mysql = require('mysql');

var fieldNames = ['id_doctor', 'fullName', 'address', 'phoneNo', 'email'];

exports.getPatientsForCurrentDoc = function (req, res) {
    var id_doctor = req.session.user.id_doctor;
    var reqFilters = req.query.filters ? JSON.parse(req.query.filters) : {};
    var filters = {
        id_doctor: id_doctor
    };


    if (reqFilters && Object.keys(reqFilters).length > 0)
        for (var key in reqFilters)
            filters[key] = reqFilters[key];


    var sort = {
        fullname: 'asc'
    };

    var tablecrud = new CRUD('patients', fieldNames);
    tablecrud.getList(filters, sort, 0, 0, function (err, response) {
        console.log(JSON.stringify(response));
        if (err)
            return res.json([]);
        else
            return res.json(response.records);
    });
};

exports.getPatientsList = function (req, res) {
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

    var query = "SELECT p.*, d.fullName AS doctor FROM `patients` AS p JOIN doctors AS d ON p.id_doctor = d.id";
    if (filterString != "")
        query += filterString + " ";
    if (Object.keys(sort).length > 0) {
        query += " ORDER BY ";
        for (var key in sort) {
            query += key + " " + sort[key];
        }
    } else
        query += " ORDER BY id ASC";

    var totalRecs = 0;
    connection.query(query, function (err, rows) {
        if (err)
            return res.json(err);
        totalRecs = rows.length;
    });

    if (page && perPage) {
        var offset = (page - 1) * perPage;
        query += " LIMIT " + offset + "," + perPage;
    }
    console.log('q: ' + query);
    connection.query(query, function (err, rows) {
        if (err)
            return res.json({'success': false, 'error': err});

        if (rows && rows.length > 0)
            return res.json({total: totalRecs, records: rows});
        else
            return res.json({total: 0, records: []});
    });
};

exports.checkPatientDoctor = function (req, res) {
    var connection = mysql.createConnection(mySqlConfig);

    var filters = req.body ? req.body : {};

    console.log(filters);
    console.log(req.body);

    var filterString = "";

    if (Object.keys(filters).length > 0) {
        var filterArray = [];
        for (var key in filters) {
            if (key && filters[key]) {
                filterString = key + ' = ' + "'" + filters[key] + "'";
                filterArray.push(filterString);
            }
        }

        if (filterArray.length > 0)
            filterString = " WHERE " + filterArray.join(" AND ");
        else
            filterString = "";
    }

    var query = "SELECT p.*, d.fullName AS doctor FROM `patients` AS p JOIN doctors AS d ON p.id_doctor = d.id";
    if (filterString != "")
        query += filterString;
    else
        return res.json({error: "No filters!"});

    var totalRecs = 0;
    connection.query(query, function (err, rows) {
        if (err)
            return res.json(err);
        totalRecs = rows.length;
        if (totalRecs > 0)
            return res.json(false);
        else
            return res.json(true);
    });

};

exports.createUpdatePatients = function (req, res) {
    var tablecrud = new CRUD('patients', fieldNames);
    var patients = req.body;
    tablecrud.insertUpdateRecord(patients, function (err, result) {
        if (err) {
            console.log(err);
            return res.json(err);
        } else {
            console.log(result);
            return res.json(result);
        }
    });
};

exports.deletePatients = function (req, res) {
    var tablecrud = new CRUD('patients', fieldNames);
    var patients = req.body;
    tablecrud.deleteRecords(patients, function (err, result) {
        if (err) {
            console.log(err);
            return res.json(err);
        } else {
            console.log(result);
            return res.json(result);
        }
    });
};