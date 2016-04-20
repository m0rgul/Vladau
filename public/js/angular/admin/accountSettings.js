/**
 * Created by LV7 on 2/4/2016.
 */

var app = angular.module('homepageApp');
(function () {
    app.controller('accountCtrl', function ($scope, $http) {
        $scope.changePass = function () {
            $http.post('/users?action=update', [{password: forge_sha256($scope.password)}])
                .success(function (data) {
                    console.log(data);
                })
                .error(function (err) {
                    console.log(err);
                });
        };

        $scope.$watchGroup(['password', 'password2'], function (newValues, oldValues) {
            console.log('newVals: ' + newValues);
            if (newValues[0] && newValues[0] != '')
                $scope.userAccountSettings.password.$setValidity('valid', isPassValid(newValues[0]));
            if (newValues[0] != '' && newValues[1] != '') {
                $scope.userAccountSettings.password2.$setValidity('match', newValues[0] === newValues[1]);
            }
        }, true);

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
})();
