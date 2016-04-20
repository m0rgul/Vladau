/**
 * Created by LV7 on 2/3/2016.
 */
var app = angular.module('forgotPass', []);

(function () {
    app.controller('forgotPassCtrl', function ($scope, $http) {
        $scope.user = {};
        $scope.user.level = document.getElementById('level').value;

        console.log($scope.user);

        $scope.submitRegister = function () {
            var user = {
                email: $scope.user.email,
                level: $scope.user.level
            };

            $http.post('/recoveryToken', user)
                .success(function (data) {
                    console.log(data);
                })
                .error(function (err) {
                    console.log(err);
                });
        };
    });
})();