var app = angular.module('homepageApp');
(function () {
    app.controller('doctorsCtrl', function ($scope, NgTableParams, $uibModal, doctorsService) {
        $scope.cols = [
            {field: "id", title: "Index", filter: {id: "number"}, show: true},
            {field: "username", title: "Nume Utilizator", filter: {username: "text"}, show: true},
            {field: "fullName", title: "Nume Doctor", filter: {fullName: "text"}, show: true},
            {field: "address", title: "Adresa Doctor", filter: {address: "text"}, show: true},
            {field: "phoneNo", title: "Telefon Doctor", filter: {phoneNo: "text"}, show: true},
            {field: "email", title: "Email Doctor", filter: {email: "text"}, show: true}
        ];

        $scope.tableParams = new NgTableParams({
            page: 1,
            count: 10
        }, {
            counts: [10, 20, 25, 50],
            getData: function (params) {
                return doctorsService.query({
                    page: params.page(),
                    perPage: params.count(),
                    filters: params.filter(),
                    sort: params.sorting()
                }).$promise.then(function (data) {
                    var totalItems = parseInt(data.total);
                    var items = [];
                    angular.forEach(data.records, function (item) {
                        var newItem = {
                            id: item.id,
                            username: item.username,
                            fullName: item.fullName,
                            email: item.email,
                            address: item.address,
                            phoneNo: item.phoneNo
                        };
                        items.push(newItem);
                    });
                    params.total(totalItems);
                    jQuery(window).trigger('resize');
                    return items;
                });
            }
        });

        $scope.newDocPU = function newDocPU() {
            $scope.openModal(null);
        };

        $scope.openModal = function openModal(item) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'doctors.html',
                controller: 'userDocController',
                backdrop: false,
                size: 'lg',
                resolve: {
                    doc: function () {
                        if (item) {
                            item.edit = true;
                            return item;
                        } else return {
                            edit: false
                        }
                    }
                }
            });

            modalInstance.result.then(function (result) {
                $scope.result = result;
                console.log(result);
                $scope.tableParams.reload();
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
        };
    });

    app.controller('userDocController', function ($scope, $uibModalInstance, doc, $http) {
        console.log(doc);
        $scope.doc = {
            id: doc.id ? doc.id : '',
            username: doc.username ? doc.username : "",
            fullName: doc.fullName ? doc.fullName : "",
            email: doc.email ? doc.email : "",
            originalEmail: doc.email ? doc.email : "",
            address: doc.address ? doc.address : "",
            phoneNo: doc.phoneNo ? doc.phoneNo : "",
            edit: doc.edit
        };

        if ($scope.doc.edit)
            $scope.doc.action = 'Editare informatii doctor';
        else
            $scope.doc.action = 'Adaugare doctor';


        $scope.ok = function () {
            var doc = {
                id: $scope.doc.id ? $scope.doc.id : '',
                username: $scope.doc.username,
                fullName: $scope.doc.fullName,
                email: $scope.doc.email,
                address: $scope.doc.address,
                phoneNo: $scope.doc.phoneNo
            };

            createUpdateDoctor(doc, function (error, response) {
                if (error) {
                    $scope.result = error;
                    return false;
                } else {
                    $scope.result = response.msg;
                    $uibModalInstance.close($scope.result);
                }
            });
        };

        $scope.delete = function () {
            if ($scope.doc.id == '' || $scope.doc.id == undefined || $scope.doc.id == 0)
                return;
            deleteDoctor($scope.doc, function (error, response) {
                if (error) {
                    $scope.result = error;
                    return false;
                } else {
                    $scope.result = response.msg;
                    $uibModalInstance.close($scope.result);
                }
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        var createUpdateDoctor = function createUpdateDoctor(doc, callback) {
            var method = $scope.doc.edit ? 'PUT' : 'POST';
            $http({
                method: method,
                url: '/doctors',
                data: angular.toJson([doc])
            }).then(function successCallback(response) {
                if (response && response.data.success) {
                    console.log(response);
                    callback(null, response.data);
                } else {
                    callback(response.data.msg);
                }
            }, function errorCallback(error) {
                callback(error);
            });
        };

        var deleteDoctor = function deleteDoctor(doc, callback) {
            $http({
                method: 'DELETE',
                url: '/doctors',
                data: angular.toJson([{'id': doc.id}]),
                headers: {'Content-Type': 'application/json;charset=utf-8'}
            }).then(function successCallback(response) {
                console.log(response.data);
                if (response && response.data.success) {
                    callback(null, response.data);
                } else {
                    callback(response.data.msg);
                }
            }, function errorCallback(error) {
                callback(error);
            });
        };

        /*
         * Validation
         */

        $scope.phoneRegex = /^[\+]?[(]?[0-9]{4}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3}$/;
        $scope.fullNameRegex = /^[a-zA-Z][0-9a-zA-Z .,'-]*$/;
        $scope.addressRegex = /^[a-zA-Z.#\s\d\/]*\d[a-zA-Z.#\s\d\/]*$/;

        var isFieldValid = function isFieldValid(field, callback) {
            $http.post('/doctors/checkField', field)
                .success(function (data) {
                    if (data)
                        callback(null, true);
                    else
                        callback(null, false);
                })
                .error(function (error) {
                    callback(error);
                });
        };

        $scope.$watch('doc.email', function (newValue, oldValue) {
            if ($scope.doc.edit && newValue == $scope.doc.originalEmail) {
                $scope.doctorForm.email.$setValidity('unique', true);
                return;
            }
            if (newValue && newValue.length > 0) {
                if ($scope.doc.edit && newValue == oldValue) {
                    $scope.doctorForm.email.$setValidity('unique', true);
                    return;
                }
                var field = {email: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        return;
                    }
                    if (res) {
                        $scope.doctorForm.email.$setValidity('unique', true);
                    }
                    else {
                        $scope.doctorForm.email.$setValidity('unique', false);
                    }
                });
            }
        }, true);

        $scope.$watch('doc.username', function (newValue, oldValue) {
            if ($scope.doc.edit)
                return;
            if (newValue && newValue != '' && newValue.length >= 6) {
                var field = {username: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        return;
                    }
                    if (res) {
                        $scope.doctorForm.username.$setValidity('unique', true);
                    }
                    else {
                        $scope.doctorForm.username.$setValidity('unique', false);
                    }
                });
            } else if ($scope.doctorForm.username)
                $scope.doctorForm.username.$setValidity('unique', true);
        }, true);
    });

    app.factory("doctorsService", ["$resource", function ($resource) {
        return $resource("/doctors", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);
})();