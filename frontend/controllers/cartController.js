app.controller('CartController', function($scope, $rootScope, $timeout, ApiService, UserService) {
    $scope.cartItems = [];
    $scope.addItem = {};
    $scope.couponCode = '';
    $scope.discountPreview = null;
    $scope.alert = null;
    $scope.placing = false;
    $scope.showCheckout = false;
    $scope.paymentMode = 'UPI';

    function showAlert(type, message) {
        $scope.alert = { type: type, message: message };
        $timeout(function() { $scope.alert = null; }, 6000);
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getUserId() { return UserService.getUserId(); }

    $scope.getCurrentUser = function() { return UserService.getFirstName(); };

    $scope.loadCart = function() {
        var uid = getUserId();
        if (!uid) return;
        ApiService.getCart(uid).then(function(res) {
            $scope.cartItems = res.data;
            $scope.discountPreview = null;
            $rootScope.$broadcast('cart:updated');
        });
    };

    $scope.addToCart = function() {
        if (!$scope.addItem.productId || !$scope.addItem.quantity || $scope.addItem.quantity < 1) {
            showAlert('danger', 'Please provide Product ID and valid quantity.');
            return;
        }
        ApiService.addToCart(getUserId(), $scope.addItem.productId, $scope.addItem.quantity)
            .then(function() {
                showAlert('success', 'Item added to cart!');
                $scope.addItem = {};
                $scope.loadCart();
            }, function(err) {
                showAlert('danger', err.data.message || 'Failed to add to cart.');
            });
    };

    $scope.removeItem = function(productId) {
        ApiService.removeFromCart(getUserId(), productId).then(function() {
            showAlert('success', 'Item removed.');
            $scope.loadCart();
        }, function(err) { showAlert('danger', err.data.message); });
    };

    $scope.increaseQty = function(item) {
        ApiService.updateCartQty(getUserId(), item.product.productId, item.quantity + 1)
            .then(function() { $scope.loadCart(); },
            function(err) { showAlert('danger', err.data.message); });
    };

    $scope.decreaseQty = function(item) {
        if (item.quantity <= 1) { $scope.removeItem(item.product.productId); return; }
        ApiService.updateCartQty(getUserId(), item.product.productId, item.quantity - 1)
            .then(function() { $scope.loadCart(); },
            function(err) { showAlert('danger', err.data.message); });
    };

    $scope.clearCart = function() {
        ApiService.clearCart(getUserId()).then(function() {
            showAlert('success', 'Cart cleared.');
            $scope.showCheckout = false;
            $scope.loadCart();
        });
    };

    $scope.getCartTotal = function() {
        var total = 0;
        angular.forEach($scope.cartItems, function(item) {
            total += item.product.price * item.quantity;
        });
        return total;
    };

    $scope.proceedToCheckout = function() {
        $scope.showCheckout = true;
        $scope.previewDiscount();
    };

    $scope.previewDiscount = function() {
        ApiService.previewDiscount(getUserId(), $scope.couponCode).then(function(res) {
            $scope.discountPreview = res.data;
        }, function(err) {
            showAlert('danger', err.data.message || 'Invalid coupon.');
        });
    };

    $scope.placeOrder = function() {
        if ($scope.cartItems.length === 0) { showAlert('danger', 'Cart is empty!'); return; }
        if (!$scope.paymentMode) { showAlert('danger', 'Please select a payment mode.'); return; }
        $scope.placing = true;
        ApiService.placeOrder(getUserId(), $scope.couponCode, generateUUID(), $scope.paymentMode)
            .then(function(res) {
                showAlert('success', 'Order placed successfully! Order ID: ' + res.data.orderId +
                    ' | Payment: ' + res.data.paymentMode + ' | Total: Rs.' + res.data.totalAmount.toFixed(2));
                $scope.couponCode = '';
                $scope.discountPreview = null;
                $scope.showCheckout = false;
                $scope.loadCart();
                $scope.placing = false;
            }, function(err) {
                showAlert('danger', err.data.message || 'Order failed.');
                $scope.loadCart();
                $scope.placing = false;
            });
    };

    $scope.loadCart();
});
