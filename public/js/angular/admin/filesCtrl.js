var app = angular.module('homepageApp');
(function () {
    app.controller('filesCtrl', function ($scope, NgTableParams, patientFiles, $uibModal) {
        $scope.isUploading = false;
        $scope.tableParams = new NgTableParams({
            page: 1,
            count: 10
        }, {
            counts: [10, 20, 25, 50],
            getData: function (params) {
                return patientFiles.query({
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
                            title: item.title,
                            url: item.url,
                            comments: item.comments,
                            patient: item.patient,
                            doctor: item.doctor,
                            date: item.date
                        };
                        items.push(newItem);
                    });
                    params.total(totalItems);
                    jQuery(window).trigger('resize');
                    return items;
                });
            }
        });

        $scope.newFilePU = function newDocPU() {
            $scope.openModal(null);
        };

        $scope.openModal = function openModal(item) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'file.html',
                controller: 'fileController',
                backdrop: false,
                size: 'lg',
                resolve: {
                    file: function () {
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
                if (result)
                    $scope.tableParams.reload();
            }, function () {
            });
        };
    });

    app.controller('fileController', function ($scope, $uibModalInstance, $http, Upload, patientsService, file) {
        console.log(file);

        $scope.fileProgress = 0;

        $scope.patientsList = {
            options: [],
            selectedOption: null
        };


        $scope.file = {
            id: file.id ? file.id : 0,
            title: file.title,
            edit: file.edit,
            doctor: file.doctor,
            patient: file.patient,
            comments: file.comments,
            url: file.url ? file.url : ''
        };

        patientsService.query({
            action: "view"
        }).$promise.then(function (data) {
            angular.forEach(data.records, function (item) {
                var newItem = {
                    id: item.id,
                    fullName: item.fullName + ' (Dr. ' + item.doctor + ')',
                    doctor: item.doctor
                };
                $scope.patientsList.options.push(newItem);
                if ($scope.file.doctor == newItem.doctor && $scope.file.patient == item.fullName)
                    $scope.patientsList.selectedOption = newItem;
            });
        });

        $scope.cancel = function () {
            if (Upload.isUploadInProgress())
                $scope.uploadFile.upload.abort();

            $uibModalInstance.dismiss('cancel');
        };

        //file upload
        $scope.uploadFile = function (file) {
            if (!file) {
                updateFileDetails();
                return;
            }
            $scope.isUploading = true;
            this.upload = Upload.upload({
                url: '/files',
                data: {
                    file: file,
                    id: $scope.file.id ? $scope.file.id : 0,
                    title: $scope.file.title,
                    id_patient: $scope.patientsList.selectedOption.id,
                    comments: $scope.file.comments
                }
            }).then(function (resp) {
                $scope.isUploading = false;
                if (resp.data.success) {
                    $uibModalInstance.close(true);
                }
            }, function (err) {
                console.log('Error status: ' + err.status);
            }, function (evt) {
                $scope.fileProgress = parseInt(100.0 * evt.loaded / evt.total);
            });
        };

        var updateFileDetails = function updateFileDetails() {
            var data = {
                id: $scope.file.id,
                title: $scope.file.title,
                id_patient: $scope.patientsList.selectedOption.id,
                comments: $scope.file.comments
            };

            $http.post('/files', angular.toJson(data))
                .success(function (data) {
                    if (data.success) {
                        $scope.file = {};
                        $scope.fileForm.$setPristine();
                        $uibModalInstance.close(true);
                    }
                    else
                        alert(data.msg);
                })
                .error(function (err) {
                    console.log(err);
                    alert(err);
                    $scope.file = {};
                    $scope.fileForm.$setPristine();
                });
        };
    });

    app.factory("patientFiles", ["$resource", function ($resource) {
        return $resource("/files", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);

    app.factory("patientsService", ["$resource", function ($resource) {
        return $resource("/patients", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);
})();