var app = angular.module('homepageApp');
(function () {
    app.controller('usersCtrl', function ($scope, NgTableParams, usersService, $uibModal) {
        $scope.roles =
            [{
                id: '0',
                title: "Nu"
            },
                {
                    id: '1',
                    title: "Da"
                }];

        function getRoles() {
            return $scope.roles;
        }

        $scope.cols = [
            {field: "id", title: "Index", filter: {id: "number"}, show: true},
            {field: "username", title: "Nume Utilizator", filter: {username: "text"}, show: true},
            {field: "email", title: "Email Utilizator", filter: {email: "text"}, show: true},
            {
                field: "userControl",
                title: "Manager Conturi Utilizatori?",
                filter: {userControl: "select"},
                filterData: getRoles,
                show: true
            },
            {
                field: "doctorControl",
                title: "Manager Conturi Doctori?",
                filter: {doctorControl: "select"},
                filterData: getRoles,
                show: true
            }
        ];

        $scope.tableParams = new NgTableParams({
            page: 1,
            count: 10
        }, {
            counts: [10, 20, 25, 50],
            getData: function (params) {
                return usersService.query({
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
                            email: item.email,
                            userControl: item.userControl == 1 ? 'Da' : 'Nu',
                            doctorControl: item.doctorControl == 1 ? 'Da' : 'Nu'
                        };
                        items.push(newItem);
                    });
                    params.total(totalItems);
                    jQuery(window).trigger('resize');
                    return items;
                });
            }
        });

        $scope.newUserPU = function newUserPU() {
            $scope.openModal(null);
        };

        $scope.openModal = function openModal(item) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'users.html',
                controller: 'userCrudController',
                backdrop: false,
                size: 'lg',
                resolve: {
                    user: function () {
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
            });
        };
    });


    app.controller('userCrudController', function ($scope, $uibModalInstance, user, $http) {
        $scope.user = {
            id: user.id ? user.id : '',
            username: user.username ? user.username : "",
            email: user.email ? user.email : "",
            userControl: user.userControl,
            doctorControl: user.doctorControl,
            edit: user.edit
        };

        console.log($scope.user);

        if ($scope.user.edit)
            $scope.user.action = 'Editare informatii utilizator';
        else
            $scope.user.action = 'Adaugare utilizator';

        $scope.ok = function () {
            var user = {
                id: $scope.user.id ? $scope.user.id : '',
                username: $scope.user.username,
                email: $scope.user.email,
                userControl: $scope.user.userControl,
                doctorControl: $scope.user.doctorControl
            };

            createUpdateUser(user, function (error, response) {
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
            if ($scope.user.id == '' || $scope.user.id == undefined || $scope.user.id == 0)
                return;
            deleteUser($scope.user, function (error, response) {
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

        var createUpdateUser = function createUpdateUser(user, callback) {
            var method = $scope.user.edit ? 'PUT' : 'POST';
            console.log('edit: ' + $scope.user.edit);
            console.log('method: ' + method);
            $http({
                method: method,
                url: '/users',
                data: angular.toJson([user])
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

        var deleteUser = function deleteUser(user, callback) {
            console.log(user);
            console.log(angular.toJson([{'id': user.id}]));
            $http({
                method: 'DELETE',
                url: '/users',
                data: angular.toJson([{'id': user.id}]),
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

        $scope.phoneRegex = "^\\s*(?:\\+?(\\d{1,3}))?[-. (]*(\\d{3})[-. )]*(\\d{3})[-. ]*(\\d{4})(?: *x(\\d+))?\\s*$";
        $scope.fullNameRegex = "^[a-zA-Z][0-9a-zA-Z .,'-]*$";

        $scope.$watch('user.username', function (newValue, oldValue) {
            if (newValue && newValue != '' && newValue.length >= 6 && !$scope.user.edit) {
                var field = {username: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        return;
                    }
                    if (res) {
                        $scope.userForm.username.$setValidity('unique', true);
                    }
                    else {
                        $scope.userForm.username.$setValidity('unique', false);
                    }
                });
            } else
                $scope.userForm.username.$setValidity('unique', true);
        }, true);

        $scope.$watch('user.email', function (newValue, oldValue) {
            if (newValue && newValue.length > 0 && !$scope.user.edit) {
                var field = {email: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        $scope.userForm.email.$setValidity('unique', false);
                        return;
                    }
                    if (res) {
                        $scope.userForm.email.$setValidity('unique', true);
                    }
                    else {
                        $scope.userForm.email.$setValidity('unique', false);
                    }
                });
            }
        }, true);

        var isFieldValid = function isFieldValid(field, callback) {
            $http.post('/users/checkField', field)
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
    });

    app.factory("usersService", ["$resource", function ($resource) {
        return $resource("/users", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);
})();