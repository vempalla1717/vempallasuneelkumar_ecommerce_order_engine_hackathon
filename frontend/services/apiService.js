app.factory('ApiService', function($http) {
    var base = 'http://localhost:8080/api';

    return {
        // Auth
        signup: function(data) { return $http.post(base + '/auth/signup', data); },
        signin: function(userName, password) {
            return $http.post(base + '/auth/signin', { userName: userName, password: password });
        },

        // Products
        getProducts: function() { return $http.get(base + '/products'); },
        getProduct: function(id) { return $http.get(base + '/products/' + id); },
        addProduct: function(data) { return $http.post(base + '/products', data); },
        updateStock: function(id, stock) { return $http.put(base + '/products/' + id + '/stock', { stock: stock }); },
        getLowStock: function() { return $http.get(base + '/products/low-stock'); },
        getOutOfStock: function() { return $http.get(base + '/products/out-of-stock'); },

        // Cart
        getCart: function(userId) { return $http.get(base + '/cart/' + userId); },
        addToCart: function(userId, productId, quantity) {
            return $http.post(base + '/cart/' + userId + '/add', { productId: productId, quantity: quantity });
        },
        removeFromCart: function(userId, productId) {
            return $http.delete(base + '/cart/' + userId + '/remove/' + productId);
        },
        updateCartQty: function(userId, productId, qty) {
            return $http.put(base + '/cart/' + userId + '/update', { productId: productId, quantity: qty });
        },
        clearCart: function(userId) { return $http.delete(base + '/cart/' + userId + '/clear'); },
        previewDiscount: function(userId, couponCode) {
            var url = base + '/cart/' + userId + '/preview';
            if (couponCode) url += '?couponCode=' + couponCode;
            return $http.get(url);
        },

        // Orders
        placeOrder: function(userId, couponCode, idempotencyKey, paymentMode) {
            return $http.post(base + '/orders/place', {
                userId: userId, couponCode: couponCode || '', idempotencyKey: idempotencyKey,
                paymentMode: paymentMode || 'COD'
            });
        },
        getAllOrders: function() { return $http.get(base + '/orders'); },
        getOrder: function(orderId) { return $http.get(base + '/orders/' + orderId); },
        getOrdersByUser: function(userId) { return $http.get(base + '/orders/user/' + userId); },
        getOrdersByStatus: function(status) { return $http.get(base + '/orders/status/' + status); },
        updateOrderStatus: function(orderId, status) {
            return $http.put(base + '/orders/' + orderId + '/status', { status: status });
        },
        cancelOrder: function(orderId) { return $http.post(base + '/orders/' + orderId + '/cancel'); },
        returnItems: function(orderId, productId, qty) {
            return $http.post(base + '/orders/' + orderId + '/return', { productId: productId, quantity: qty });
        },

        // Logs
        getAllLogs: function() { return $http.get(base + '/logs'); },
        getLogsByUser: function(userId) { return $http.get(base + '/logs/user/' + userId); },
        getLogsByEntity: function(entityType) { return $http.get(base + '/logs/entity/' + entityType); },

        // Admin
        getFailureMode: function() { return $http.get(base + '/admin/failure-mode'); },
        setFailureMode: function(enabled) { return $http.post(base + '/admin/failure-mode', { enabled: enabled }); },
        getEvents: function() { return $http.get(base + '/admin/events'); },
        processEvents: function() { return $http.post(base + '/admin/events/process'); },
        simulateConcurrency: function(productId, quantity, users) {
            return $http.post(base + '/admin/simulate-concurrency', {
                productId: productId, quantity: quantity, users: users
            });
        }
    };
});
