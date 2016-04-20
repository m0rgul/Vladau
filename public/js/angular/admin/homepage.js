var app = angular.module('homepageApp', ['ngTable', 'ngResource', 'ui.bootstrap', 'ngRoute', 'ngFileUpload']);
(function () {
    app.config(function ($routeProvider) {
        $routeProvider
            .when('/users', {
                templateUrl: 'js/angular/admin/templates/users.html',
                controller: 'usersCtrl'

            })
            .when('/doctors', {
                templateUrl: 'js/angular/admin/templates/doctors.html',
                controller: 'doctorsCtrl'
            })
            .when('/patients', {
                templateUrl: 'js/angular/admin/templates/patients.html',
                controller: 'patientsCtrl'
            })
            .when('/files', {
                templateUrl: 'js/angular/admin/templates/files.html',
                controller: 'filesCtrl'
            })
            .when('/settings',{
                templateUrl: 'js/angular/admin/templates/accountSettings.html',
                controller: 'accountCtrl'
            })
            .otherwise({
                redirectTo: '/files'
            });
    });
})();