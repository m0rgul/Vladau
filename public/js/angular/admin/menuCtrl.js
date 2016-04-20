var app = angular.module('homepageApp');
(function () {
    app.controller("menuCtrl", function ($scope, $location) {
        $scope.menuClass = function (page) {
            var current = $location.path().substring(1);
            return page === current ? "active" : "";
        };
    });
})();