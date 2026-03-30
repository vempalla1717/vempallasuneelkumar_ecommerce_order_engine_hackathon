var app = angular.module('ecommerceApp', ['ngRoute', 'ngAnimate']);

app.config(function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');
    $routeProvider
        .when('/login', { templateUrl: 'views/login.html', controller: 'AuthController' })
        .when('/products', { templateUrl: 'views/products.html', controller: 'ProductController' })
        .when('/cart', { templateUrl: 'views/cart.html', controller: 'CartController' })
        .when('/orders', { templateUrl: 'views/orders.html', controller: 'OrderController' })
        .when('/logs', { templateUrl: 'views/logs.html', controller: 'LogController' })
        .when('/admin', { templateUrl: 'views/admin.html', controller: 'AdminController' })
        .otherwise({ redirectTo: '/login' });
});

app.run(function($rootScope, $location, UserService) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        var path = next && next.$$route ? next.$$route.originalPath : '';
        if (path !== '/login' && !UserService.isLoggedIn()) {
            event.preventDefault();
            $location.path('/login');
        }
    });
});

app.factory('UserService', function() {
    var currentUser = null;

    try {
        currentUser = JSON.parse(sessionStorage.getItem('ecom_user'));
    } catch(e) {
        currentUser = null;
    }

    return {
        login: function(userData) {
            currentUser = userData;
            sessionStorage.setItem('ecom_user', JSON.stringify(userData));
        },
        logout: function() {
            currentUser = null;
            sessionStorage.removeItem('ecom_user');
        },
        isLoggedIn: function() {
            return currentUser !== null;
        },
        getUser: function() {
            return currentUser;
        },
        getUserId: function() {
            return currentUser ? currentUser.userId : null;
        },
        getFirstName: function() {
            return currentUser ? currentUser.firstName : '';
        },
        getRole: function() {
            return currentUser ? currentUser.role : 'user';
        },
        isAdmin: function() {
            return currentUser && currentUser.role === 'admin';
        }
    };
});

app.controller('MainController', function($scope, $location, $http, UserService) {
    $scope.isLoggedIn = function() {
        return UserService.isLoggedIn();
    };

    $scope.getFirstName = function() {
        return UserService.getFirstName();
    };

    $scope.getUserId = function() {
        return UserService.getUserId();
    };

    $scope.isAdmin = function() {
        return UserService.isAdmin();
    };

    $scope.isActive = function(path) {
        return $location.path() === path;
    };

    $scope.cartCount = 0;

    $scope.refreshCartCount = function() {
        var uid = UserService.getUserId();
        if (uid) {
            $http.get('http://localhost:8080/api/cart/' + uid).then(function(res) {
                $scope.cartCount = res.data.length;
            });
        }
    };

    $scope.$on('cart:updated', function() {
        $scope.refreshCartCount();
    });

    $scope.$on('$routeChangeSuccess', function() {
        if (UserService.isLoggedIn()) {
            $scope.refreshCartCount();
        }
    });

    $scope.logout = function() {
        UserService.logout();
        $scope.cartCount = 0;
        $location.path('/login');
    };
});

app.filter('inr', function() {
    return function(input) {
        if (input === null || input === undefined) return '0';
        return parseFloat(input).toLocaleString('en-IN');
    };
});
