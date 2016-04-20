var app = angular.module('doctorHomeApp', ['ngResource', 'ngAnimate', 'ui.bootstrap']);
(function () {
    app.controller('doctorHomeCtrl', function ($scope, patientInfo, patientFiles, $uibModal, doctorInfo) {
        $scope.patientList = [];
        $scope.patientFiles = [];
        var idPatient = 0;

        patientInfo.query({
            sort: {
                fullName: 'asc'
            }
        }).$promise.then(function (result) {
            if (!result) {
                console.log('Error!');
                return;
            }
            $scope.patientList = result;
        });

        $scope.clearSearch = function (type) {
            if (type == 'file')
                $scope.fileSearch = '';
            if (type == 'patient')
                $scope.patientSearch = '';
        };

        $scope.getPatientFiles = function (patientId) {
            if (patientId > 0) {
                idPatient = patientId;
                patientFiles.query({
                    action: "view",
                    filters: {
                        id_patient: idPatient
                    },
                    sort: {
                        date_time: 'asc'
                    }

                }).$promise.then(function (result) {
                    if (!result) {
                        console.log('Error!');
                        return;
                    }
                    $scope.patientFiles = result.records;
                });
            }
        };

        $scope.userSettings = function () {
            doctorInfo.query({}).$promise.then(function (result) {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'userSettings.html',
                    controller: 'userSettingsController',
                    backdrop: false,
                    size: 'lg',
                    resolve: {
                        doc: function () {
                            return result;
                        }
                    }
                });

                modalInstance.result.then(function (result) {
                    $scope.result = result;
                });
            });


        };

        $scope.$watch('patientSearch', function (newValue, oldValue) {
            patientInfo.query({
                sort: {
                    fullName: 'asc'
                },
                filters: {
                    fullName: newValue
                }
            }).$promise.then(function (result) {
                if (!result) {
                    console.log('Error!');
                    return;
                }
                if (result.length > 0)
                    $scope.patientList = result;
            });
        }, true);

        $scope.$watch('fileSearch', function (newValue, oldValue) {
            if (idPatient > 0) {
                patientFiles.query({
                    action: "view",
                    filters: {
                        id_patient: idPatient,
                        title: newValue
                    },
                    sort: {
                        date_time: 'asc'
                    }

                }).$promise.then(function (result) {
                    if (!result) {
                        console.log('shit!');
                        return;
                    }
                    $scope.patientFiles = result.records;
                });
            }
        }, true);
    });

    app.controller('userSettingsController', function ($scope, $uibModalInstance, doc, $http) {
        $scope.doc = angular.copy(doc);

        $scope.phoneRegex = "^\\s*(?:\\+?(\\d{1,3}))?[-. (]*(\\d{3})[-. )]*(\\d{3})[-. ]*(\\d{4})(?: *x(\\d+))?\\s*$";
        $scope.fullNameRegex = "^[a-zA-Z][0-9a-zA-Z .,'-]*$";

        $scope.ok = function () {
            var newDoc = {
                id: $scope.doc.id,
                fullName: $scope.doc.fullName,
                address: $scope.doc.address,
                phoneNo: $scope.doc.phoneNo,
                email: $scope.doc.email,
                username: $scope.doc.username,
                password: $scope.doc.password && $scope.doc.password.length > 0 ? forge_sha256($scope.doc.password) : ''
            };

            $http.put('/doctors', angular.toJson([newDoc]))
                .success(function (data) {
                    if (data.success) {
                        $scope.doc = {};
                        $scope.docSettings.$setPristine();
                        $uibModalInstance.close(data);
                    }
                    else
                        alert(data.msg);
                })
                .error(function (err) {
                    console.log(err);
                    alert(err);
                    $scope.doc = {};
                    $scope.docSettings.$setPristine();
                });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.$watch('doc.email', function (newValue, oldValue) {
            console.log(newValue);
            if (newValue == doc.email) {
                console.log('same email');
                $scope.docSettings.email.$setValidity('unique', true);
                return;
            }

            if (newValue && newValue.length > 0) {
                var field = {email: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        return;
                    }
                    if (res) {
                        $scope.docSettings.email.$setValidity('unique', true);
                    }
                    else {
                        $scope.docSettings.email.$setValidity('unique', false);
                    }
                });
            }
        }, true);

        $scope.$watchGroup(['doc.password', 'doc.password2'], function (newValues, oldValues) {
            if (newValues[0] && newValues[0].length)
                $scope.docSettings.password.$setValidity('valid', isPassValid(newValues[0]));
            if (newValues[0] && newValues[0].length && newValues[1] && newValues[1].length) {
                $scope.docSettings.password2.$setValidity('match', newValues[0] === newValues[1]);
            }
        }, true);

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

        var isPassValid = function isPassValid(pass) {
            var validated = true;
            if (!/\d/.test(pass))
                return validated = false;
            if (!/[a-z]/.test(pass))
                return validated = false;
            if (!/[A-Z]/.test(pass))
                return validated = false;
            if (/[^0-9a-zA-Z]/.test(pass))
                return validated = false;
            return validated;
        };

    });

    app.factory("doctorInfo", ["$resource", function ($resource) {
        return $resource("/doctors/currentDoctor", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);

    app.factory("patientInfo", ["$resource", function ($resource) {
        return $resource("/patients/currentDoctor", {}, {
            query: {
                method: "GET",
                isArray: true
            }
        });
    }]);

    app.factory("patientFiles", ["$resource", function ($resource) {
        return $resource("/files", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);
})();