app.controller('OrderController', function($scope, $timeout, ApiService, UserService) {
    $scope.orders = [];
    $scope.searchId = '';
    $scope.filterStatus = '';
    $scope.isAdmin = UserService.isAdmin();
    $scope.alert = null;
    $scope.expandedOrder = null;
    $scope.returnForm = {};
    $scope.statusOptions = ['CREATED', 'PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'FAILED', 'CANCELLED'];
    $scope.newStatus = {};

    function showAlert(type, message) {
        $scope.alert = { type: type, message: message };
        $timeout(function() { $scope.alert = null; }, 5000);
    }

    $scope.loadOrders = function() {
        if ($scope.filterStatus) {
            ApiService.getOrdersByStatus($scope.filterStatus).then(function(res) {
                $scope.orders = filterByUser(res.data);
            });
        } else if ($scope.isAdmin) {
            ApiService.getAllOrders().then(function(res) { $scope.orders = res.data; });
        } else {
            ApiService.getOrdersByUser(UserService.getUserId()).then(function(res) {
                $scope.orders = res.data;
            });
        }
    };

    function filterByUser(orders) {
        if ($scope.isAdmin) return orders;
        var uid = UserService.getUserId();
        return orders.filter(function(o) { return o.userId === uid; });
    }

    $scope.searchOrder = function() {
        if (!$scope.searchId) { $scope.loadOrders(); return; }
        ApiService.getOrder($scope.searchId).then(function(res) {
            $scope.orders = [res.data];
        }, function(err) {
            showAlert('danger', err.data.message || 'Order not found.');
            $scope.orders = [];
        });
    };

    $scope.toggleDetail = function(order) {
        $scope.expandedOrder = ($scope.expandedOrder === order.orderId) ? null : order.orderId;
    };

    $scope.cancelOrder = function(orderId) {
        ApiService.cancelOrder(orderId).then(function() {
            showAlert('success', 'Order ' + orderId + ' cancelled. Stock restored.');
            $scope.loadOrders();
        }, function(err) {
            showAlert('danger', err.data.message || 'Cannot cancel order.');
        });
    };

    $scope.updateStatus = function(orderId) {
        var status = $scope.newStatus[orderId];
        if (!status) { showAlert('danger', 'Please select a status.'); return; }
        ApiService.updateOrderStatus(orderId, status).then(function() {
            showAlert('success', 'Order ' + orderId + ' status updated to ' + status);
            $scope.loadOrders();
        }, function(err) {
            showAlert('danger', err.data.message || 'Status update failed.');
        });
    };

    $scope.returnItems = function(orderId) {
        var form = $scope.returnForm[orderId];
        if (!form || !form.productId || !form.quantity || form.quantity < 1) {
            showAlert('danger', 'Please provide product ID and quantity.');
            return;
        }
        ApiService.returnItems(orderId, form.productId, form.quantity).then(function() {
            showAlert('success', 'Return processed successfully.');
            $scope.returnForm[orderId] = {};
            $scope.loadOrders();
        }, function(err) {
            showAlert('danger', err.data.message || 'Return failed.');
        });
    };

    $scope.getStatusBadgeClass = function(status) {
        return 'badge-status-' + status;
    };

    $scope.resetFilters = function() {
        $scope.searchId = '';
        $scope.filterStatus = '';
        $scope.loadOrders();
    };

    $scope.loadOrders();
});
