app.controller('ProductController', function($scope, $rootScope, $timeout, ApiService, UserService) {
    $scope.products = [];
    $scope.categories = [];
    $scope.newProduct = {};
    $scope.stockUpdate = {};
    $scope.searchText = '';
    $scope.selectedCategory = '';
    $scope.showAdmin = false;
    $scope.alert = null;

    function showAlert(type, message) {
        $scope.alert = { type: type, message: message };
        $timeout(function() { $scope.alert = null; }, 4000);
    }

    $scope.loadProducts = function() {
        ApiService.getProducts().then(function(res) {
            $scope.products = res.data;
            var cats = {};
            res.data.forEach(function(p) { if (p.category) cats[p.category] = true; });
            $scope.categories = Object.keys(cats).sort();
        });
    };

    $scope.filteredProducts = function() {
        return $scope.products.filter(function(p) {
            var matchSearch = !$scope.searchText ||
                p.name.toLowerCase().indexOf($scope.searchText.toLowerCase()) !== -1 ||
                p.productId.toLowerCase().indexOf($scope.searchText.toLowerCase()) !== -1 ||
                (p.description && p.description.toLowerCase().indexOf($scope.searchText.toLowerCase()) !== -1);
            var matchCat = !$scope.selectedCategory || p.category === $scope.selectedCategory;
            return matchSearch && matchCat;
        });
    };

    $scope.getDiscount = function(p) {
        if (!p.actualPrice || p.actualPrice <= p.price) return 0;
        return Math.round((1 - p.price / p.actualPrice) * 100);
    };

    $scope.getStockClass = function(p) {
        var avail = p.stock - (p.reservedStock || 0);
        if (avail <= 0) return 'stock-out';
        if (avail <= p.lowStockThreshold) return 'stock-low';
        return 'stock-ok';
    };

    $scope.addToCart = function(productId, qty) {
        var userId = UserService.getUserId();
        if (!userId) {
            showAlert('danger', 'Please login first.');
            return;
        }
        ApiService.addToCart(userId, productId, parseInt(qty) || 1).then(function() {
            showAlert('success', 'Added to cart!');
            $rootScope.$broadcast('cart:updated');
        }, function(err) {
            showAlert('danger', err.data.message || 'Failed to add to cart.');
        });
    };

    $scope.addProduct = function() {
        if (!$scope.newProduct.name || !$scope.newProduct.price || $scope.newProduct.stock === undefined) {
            showAlert('danger', 'Please fill all required fields.');
            return;
        }
        ApiService.addProduct($scope.newProduct).then(function(res) {
            showAlert('success', 'Product "' + res.data.name + '" added!');
            $scope.newProduct = {};
            $scope.loadProducts();
        }, function(err) {
            showAlert('danger', err.data.message || 'Failed to add product.');
        });
    };

    $scope.updateStock = function() {
        if (!$scope.stockUpdate.productId || $scope.stockUpdate.stock === undefined) {
            showAlert('danger', 'Please provide Product ID and new stock.');
            return;
        }
        ApiService.updateStock($scope.stockUpdate.productId, $scope.stockUpdate.stock).then(function(res) {
            showAlert('success', 'Stock updated for ' + res.data.productId);
            $scope.stockUpdate = {};
            $scope.loadProducts();
        }, function(err) {
            showAlert('danger', err.data.message || 'Failed to update stock.');
        });
    };

    $scope.loadProducts();
});
