/**
 * Created by LV7 on 2/3/2016.
 */
var app = angular.module('passReset', []);

(function () {
    app.controller('passResetCtrl', function ($scope, $http) {
        $scope.user = {};
        $scope.user.level = document.getElementById('level').value;

        $scope.$watchGroup(['password', 'password2'], function (newValues, oldValues) {
            console.log('newVals: ' + newValues);
            if (newValues[0] && newValues[0] != '')
                $scope.passRecoveryForm.password.$setValidity('valid', isPassValid(newValues[0]));
            if (newValues[0] != '' && newValues[1] != '') {
                $scope.passRecoveryForm.password2.$setValidity('match', newValues[0] === newValues[1]);
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

        $scope.resetPassword = function () {
            var url = window.location.href;
            $http.post(url, {password: forge_sha256($scope.password)})
                .success(function (data) {
                    console.log(data);
                    if (data.success) {
                        if ($scope.user.level == 'user')
                            window.location.href = '/admin';
                        else
                            window.location.href = "/";
                    }
                    else
                        alert(data.msg);
                })
                .error(function (err) {
                    console.log(err);
                });
        };
    });
})();