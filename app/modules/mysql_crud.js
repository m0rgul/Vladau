module.exports = CRUD;

function CRUD(table, fieldNames) {
    that = this;
    that.table = table;
    that.fieldNames = fieldNames;


    that.mysql = require('mysql');
    that.connection = that.mysql.createConnection(mySqlConfig);
}

CRUD.prototype.getList = function getList(filters, sort, page, perPage, callback) {
    var filterString = "";

    if (Object.keys(filters).length > 0) {
        var filterArray = [];
        for (var key in filters) {
            if (key && filters[key]) {
                filterString = "`" + key + "`" + ' LIKE ' + "'%" + filters[key] + "%'";
                filterArray.push(filterString);
            }
        }

        if (filterArray.length > 0)
            filterString = " WHERE " + filterArray.join(" AND ");
        else
            filterString = "";
    }

    var query = "SELECT * FROM " + this.table;
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

    that.connection.query(query, function (err, rows) {
        if (err)
            return callback(err);
        totalRecs = rows.length;
    });

    if (page && perPage) {
        var offset = (page - 1) * perPage;
        query += " LIMIT " + offset + "," + perPage;
    }

    console.log('query: ' + query);

    that.connection.query(query, function (err, rows) {
        if (err)
            return callback(err);

        if (rows && rows.length > 0)
            return callback(null, {total: totalRecs, records: rows});
        else
            return callback(null, {total: 0, records: []});
    });
};


CRUD.prototype.insertUpdateRecord = function insertUpdateRecord(request_body, callback) {
    var fieldData = {};
    var lastId = 0;

    request_body.forEach (function (element) {
        var id = 0;
        var query = "";
        if (element['id'] !== undefined) {
            id = parseInt(element['id']);
            if (isNaN(id))
                id = 0;
        }
        that.fieldNames.forEach(function (fName) {
            if (element.hasOwnProperty(fName))
                fieldData[fName] = element[fName];
        });

        console.log(fieldData);

        if (id == '' || id == '0' || id == 0) {
            query = "INSERT INTO " + that.table + " SET ?";
            query = that.mysql.format(query, fieldData);
        } else {
            query = "UPDATE " + "`" + that.table + "`" + " SET ";
            for (var propName in fieldData) {
                query += "`" + propName + "`" + "=" + "'" + fieldData[propName] + "'" + ", ";
            }
            query = query.substr(0, query.length - 2);
            query += " WHERE `id`=" + id;

        }

        that.connection.query(query, function (err, result) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            else {
                lastId = result.insertId;
                var resp = {
                    "success": true,
                    "msg": "The modifications have been successfully applied."
                };
                return callback(null, resp);
            }
        });
    });
};

CRUD.prototype.deleteRecords = function deleteRecords(request_body, callback) {
    console.log(request_body);
    var query = "";
    if (request_body.length < 1) {
        return callback({error: 'No objects'});
    } else if (request_body.length == 1) {
        query = "DELETE FROM " + that.table + " WHERE id = " + request_body[0]['id'];
    } else {
        query = "DELETE FROM " + that.table + " WHERE ";
        for (var i = 0; i < request_body.length; i++) {
            query = query +
                "id = " + request_body[i]['id'];
            if (i < request_body.length - 1) {
                query = query + " OR ";
            }
        }
    }
    console.log('q: ' + query);
    that.connection.query(query, function (err, result) {
        if (err)
            return callback(err);
        var resp = {
            "success": true,
            "msg": "The modifications have been successfully applied, deleted " + result.affectedRows + ' rows'
        };
        return callback(null, resp);
    });
};

/*
 SELECT p.*, d.fullName AS doctorName, CONCAT (p.fullNAME, ' ( Dr. ', d.fullName, ')') AS patientName FROM `patients` AS p
 JOIN doctors AS d ON p.id_doctor = d.id
 WHERE 1


 SELECT f.*, p.fullName AS patientName, d.fullName AS doctorName, CONCAT (p.fullNAME, ' ( Dr. ', d.fullName, ')') AS patientFullName FROM `files` AS f
 JOIN `patients` AS p ON f.id_patient = p.id
 JOIN doctors AS d ON p.id_doctor = d.id
 WHERE 1
 */

