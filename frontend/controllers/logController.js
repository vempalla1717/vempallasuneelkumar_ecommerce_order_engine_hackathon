app.controller('LogController', function($scope, ApiService) {
    $scope.auditLogs = [];
    $scope.events = [];
    $scope.activeTab = 'audit';
    $scope.logFilter = { user: '', entity: '' };

    $scope.loadAuditLogs = function() {
        if ($scope.logFilter.user) {
            ApiService.getLogsByUser($scope.logFilter.user).then(function(res) { $scope.auditLogs = res.data; });
        } else if ($scope.logFilter.entity) {
            ApiService.getLogsByEntity($scope.logFilter.entity).then(function(res) { $scope.auditLogs = res.data; });
        } else {
            ApiService.getAllLogs().then(function(res) { $scope.auditLogs = res.data; });
        }
    };

    $scope.loadEvents = function() {
        ApiService.getEvents().then(function(res) { $scope.events = res.data; });
    };

    $scope.setTab = function(tab) {
        $scope.activeTab = tab;
        if (tab === 'audit') $scope.loadAuditLogs();
        else $scope.loadEvents();
    };

    $scope.resetLogFilter = function() {
        $scope.logFilter = { user: '', entity: '' };
        $scope.loadAuditLogs();
    };

    $scope.getEventStatusClass = function(event) {
        if (event.failed) return 'text-danger';
        if (event.processed) return 'text-success';
        return 'text-warning';
    };

    $scope.getEventStatusLabel = function(event) {
        if (event.failed) return 'Failed';
        if (event.processed) return 'Processed';
        return 'Pending';
    };

    $scope.loadAuditLogs();
});
