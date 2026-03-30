app.controller('AdminController', function($scope, $timeout, ApiService) {
    $scope.failureMode = false;
    $scope.alert = null;
    $scope.simForm = { productId: '', quantity: 5, users: 3 };
    $scope.simResults = null;
    $scope.simulating = false;
    $scope.lowStockProducts = [];
    $scope.events = [];

    function showAlert(type, message) {
        $scope.alert = { type: type, message: message };
        $timeout(function() { $scope.alert = null; }, 4000);
    }

    $scope.loadFailureMode = function() {
        ApiService.getFailureMode().then(function(res) {
            $scope.failureMode = res.data.failureMode;
        });
    };

    $scope.toggleFailureMode = function() {
        var newMode = !$scope.failureMode;
        ApiService.setFailureMode(newMode).then(function(res) {
            $scope.failureMode = newMode;
            showAlert(newMode ? 'warning' : 'success', res.data.message);
        });
    };

    $scope.simulateConcurrency = function() {
        if (!$scope.simForm.productId) {
            showAlert('danger', 'Please enter a Product ID.');
            return;
        }
        $scope.simulating = true;
        $scope.simResults = null;
        ApiService.simulateConcurrency($scope.simForm.productId, $scope.simForm.quantity, $scope.simForm.users)
            .then(function(res) {
                $scope.simResults = res.data;
                $scope.simulating = false;
            }, function(err) {
                showAlert('danger', err.data.message || 'Simulation failed.');
                $scope.simulating = false;
            });
    };

    $scope.processEvents = function() {
        ApiService.processEvents().then(function() {
            showAlert('success', 'Events processed successfully.');
            $scope.loadEvents();
        });
    };

    $scope.loadEvents = function() {
        ApiService.getEvents().then(function(res) { $scope.events = res.data; });
    };

    $scope.loadLowStock = function() {
        ApiService.getLowStock().then(function(res) { $scope.lowStockProducts = res.data; });
    };

    // Init
    $scope.loadFailureMode();
    $scope.loadEvents();
    $scope.loadLowStock();
});
