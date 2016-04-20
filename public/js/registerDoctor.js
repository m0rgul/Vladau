var app = angular.module('doctorRegister', []);
(function () {
    app.controller('registerController', function ($scope, $http) {
        $scope.doc = {};
        $scope.phoneRegex = "^\\s*(?:\\+?(\\d{1,3}))?[-. (]*(\\d{3})[-. )]*(\\d{3})[-. ]*(\\d{4})(?: *x(\\d+))?\\s*$";
        $scope.fullNameRegex = "^[a-zA-Z][0-9a-zA-Z .,'-]*$";

        $scope.submitRegister = function () {
            var newDoc = {
                fullName: $scope.doc.fullName,
                address: $scope.doc.address,
                phoneNo: $scope.doc.phoneNo,
                email: $scope.doc.email,
                username: $scope.doc.username,
                password: forge_sha256($scope.doc.password)
            };

            $http.post('/doctors', angular.toJson([newDoc]))
                .success(function (data) {
                    if (data.success) {
                        $scope.doc = {};
                        $scope.registerForm.$setPristine();
                        cancelRegister();
                    }
                    else
                        alert(data.msg);
                })
                .error(function (err) {
                    console.log(err);
                    alert(err);
                    $scope.doc = {};
                    $scope.registerForm.$setPristine();
                });
        };

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

        $scope.$watch('doc.email', function (newValue, oldValue) {
            if (newValue && newValue.length > 0) {
                var field = {email: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        return;
                    }
                    if (res) {
                        $scope.registerForm.email.$setValidity('unique', true);
                    }
                    else {
                        $scope.registerForm.email.$setValidity('unique', false);
                    }
                });
            }
        }, true);

        $scope.$watch('doc.username', function (newValue, oldValue) {
            if (newValue && newValue != '' && newValue.length >= 6) {
                var field = {username: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        return;
                    }
                    if (res) {
                        $scope.registerForm.username.$setValidity('unique', true);
                    }
                    else {
                        $scope.registerForm.username.$setValidity('unique', false);
                    }
                });
            } else
                $scope.registerForm.username.$setValidity('unique', true);
        }, true);

        $scope.$watchGroup(['doc.password', 'doc.password2'], function (newValues, oldValues) {
            if (newValues[0] && newValues[0].length)
                $scope.registerForm.password.$setValidity('valid', isPassValid(newValues[0]));
            if (newValues[0] && newValues[0].length && newValues[1] && newValues[1].length) {
                $scope.registerForm.password2.$setValidity('match', newValues[0] === newValues[1]);
            }
        }, true);
    });
})();

/*
 *   jQuery stuff here
 */
function openRegister() {
    jQuery('#loginForm').fadeOut(function () {
        jQuery('#registerForm').fadeIn();
    });
}

function cancelRegister() {
    jQuery('#registerForm').fadeOut(function () {
        jQuery('#loginForm').fadeIn();
    });
}


jQuery('#loginForm').submit(function (e) {
    e.preventDefault();
    jQuery('#loginBtn').prop("disabled", true);
    var values = {};
    $.each($('#loginForm').serializeArray(), function (i, field) {
        values[field.name] = field.value;
    });
    values.password = forge_sha256(values.password);

    jQuery.ajax({
        url: '/login',
        method: 'POST',
        data: values,
        success: function (data) {
            console.log(data);
            if (data.success)
                jQuery('#loginError').html(data.msg).addClass('successMsg').fadeIn(function () {
                    jQuery(this).delay(1500).fadeOut(function () {
                        location.reload();
                    });
                });

            else {
                jQuery('#loginError').html(data.msg).addClass('errorMsg').fadeIn(function () {
                    jQuery(this).delay(1500).fadeOut();
                    jQuery('#loginBtn').removeAttr('disabled');
                });
            }
        },
        error: function (err) {
            jQuery('#loginError').html(err.toString()).addClass('errorMsg').fadeIn(function () {
                jQuery(this).delay(1500).fadeOut();
                jQuery('#loginBtn').removeAttr('disabled');
            });
        }
    })
});
