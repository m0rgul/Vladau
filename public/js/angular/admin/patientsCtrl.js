var app = angular.module('homepageApp');
(function () {
    app.controller('patientsCtrl', function ($scope, NgTableParams, patientInfo, $uibModal) {
        $scope.cols = [
            {field: "id", title: "Index", filter: {"p.id": "number"}, sortable: "id", show: true},
            {
                field: "fullName",
                title: "Nume Pacient",
                filter: {"p.fullName": "text"},
                sortable: "p.fullName",
                show: true
            },
            {field: "doctor", title: "Doctor Pacient", filter: {"d.fullname": "text"}, show: true},
            {field: "address", title: "Adresa Pacient", filter: {"p.address": "text"}, show: true},
            {field: "phoneNo", title: "Telefon Pacient", filter: {"p.phoneNo": "text"}, show: true},
            {field: "email", title: "Email Pacient", filter: {"p.email": "text"}, show: true}
        ];

        $scope.tableParams = new NgTableParams({
            page: 1,
            count: 10
        }, {
            counts: [10, 20, 25, 50],
            getData: function (params) {
                return patientInfo.query({
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
                            fullName: item.fullName,
                            email: item.email,
                            address: item.address,
                            phoneNo: item.phoneNo,
                            doctor: 'Dr. ' + item.doctor,
                            id_doctor: item.id_doctor
                        };
                        items.push(newItem);
                    });
                    params.total(totalItems);
                    jQuery(window).trigger('resize');
                    return items;
                });
            }
        });

        $scope.newPatientPU = function newDocPU() {
            $scope.openModal(null);
        };

        $scope.openModal = function openModal(item) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'patients.html',
                controller: 'userPatientController',
                backdrop: false,
                size: 'lg',
                resolve: {
                    patient: function () {
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
                $scope.tableParams.reload();
            }, function () {
            });
        };
    });

    app.controller('userPatientController', function ($scope, $uibModalInstance, patient, $http, doctorsService, patientDoctorMatch) {
        console.log(patient);
        $scope.patient = {
            id: patient.id ? patient.id : '',
            doctor: patient.id_doctor ? patient.id_doctor : "",
            fullName: patient.fullName ? patient.fullName : "",
            email: patient.email ? patient.email : "",
            address: patient.address ? patient.address : "",
            phoneNo: patient.phoneNo ? patient.phoneNo : "",
            edit: patient.edit
        };

        $scope.doctorList = {
            options: [],
            selectedOption: null
        };

        doctorsService.query({}).$promise.then(function (data) {
            angular.forEach(data.records, function (item) {
                var newItem = {
                    id: item.id,
                    fullName: item.fullName
                };
                $scope.doctorList.options.push(newItem);
                if ($scope.patient.doctor == newItem.id)
                    $scope.doctorList.selectedOption = newItem;
            });
        });

        if ($scope.patient.edit)
            $scope.patient.action = 'Editare informatii pacient';
        else
            $scope.patient.action = 'Adaugare pacient';


        $scope.ok = function () {
            var patient = {
                id: $scope.patient.id ? $scope.patient.id : '',
                id_doctor: $scope.doctorList.selectedOption.id,
                fullName: $scope.patient.fullName,
                email: $scope.patient.email,
                address: $scope.patient.address,
                phoneNo: $scope.patient.phoneNo
            };

            $scope.createUpdatePatient(patient, function (error, response) {
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

        $scope.createUpdatePatient = function (patient, callback) {
            $http({
                method: 'POST',
                url: '/patients',
                data: angular.toJson([patient])
            }).then(function successCallback(response) {
                if (response && response.data.success) {
                    callback(null, response.data);
                } else {
                    callback(response.data.msg);
                }
            }, function errorCallback(error) {
                callback(error);
            });
        };

        $scope.deletePatient = function (patient, callback) {
            $http({
                method: 'DELETE',
                url: '/patients',
                data: angular.toJson([{'id': patient.id}]),
                headers: {'Content-Type': 'application/json;charset=utf-8'}
            }).then(function successCallback(response) {
                if (response && response.data.success) {
                    callback(null, response.data);
                } else {
                    callback(response.data.msg);
                }
            }, function errorCallback(error) {
                callback(error);
            });
        };

        $scope.phoneRegex = /^[\+]?[(]?[0-9]{4}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3}$/;
        $scope.fullNameRegex = /^[a-zA-Z][0-9a-zA-Z .,'-]*$/;
        $scope.addressRegex = /^[a-zA-Z.#\s\d\/]*\d[a-zA-Z.#\s\d\/]*$/;

        $scope.$watchGroup(['patient.fullName', 'doctorList.selectedOption.id'], function (newValues, oldValues) {
            if (newValues[0] && newValues[1] && patient.id_doctor != newValues[1]) {
                console.log(patient.id_doctor);
                var filters = {
                    'p.fullName': newValues[0],
                    'p.id_doctor': newValues[1]
                };
                $http.post('/patients/match', filters)
                    .success(function (data) {
                        console.log(data);
                        $scope.patientForm.patientDoctor.$setValidity('exists', data);
                    })
                    .error(function (error) {
                        console.log(error);
                    });
            }
        });

    });

    app.factory("patientInfo", ["$resource", function ($resource) {
        return $resource("/patients", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);

    app.factory("patientDoctorMatch", ["$resource", function ($resource) {
        return $resource("/patients/match", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);

    app.factory("doctorsService", ["$resource", function ($resource) {
        return $resource("/doctors", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);
})();