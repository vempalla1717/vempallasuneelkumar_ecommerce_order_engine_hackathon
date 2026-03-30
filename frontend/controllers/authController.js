app.controller('AuthController', function($scope, $location, $timeout, ApiService, UserService) {
    $scope.isSignUp = false;
    $scope.loginForm = {};
    $scope.signupForm = {};
    $scope.alert = null;
    $scope.loading = false;
    $scope.generatedUserId = null;

    if (UserService.isLoggedIn()) {
        $location.path('/products');
    }

    function showAlert(type, message) {
        $scope.alert = { type: type, message: message };
        if (type !== 'success' || !$scope.generatedUserId) {
            $timeout(function() { $scope.alert = null; }, 6000);
        }
    }

    $scope.toggleMode = function() {
        $scope.isSignUp = !$scope.isSignUp;
        $scope.alert = null;
        $scope.generatedUserId = null;
    };

    $scope.signin = function() {
        if (!$scope.loginForm.userId || !$scope.loginForm.password) {
            showAlert('danger', 'Please enter User ID and Password.');
            return;
        }
        $scope.loading = true;
        ApiService.signin($scope.loginForm.userId, $scope.loginForm.password)
            .then(function(res) {
                UserService.login(res.data);
                $location.path('/products');
            }, function(err) {
                showAlert('danger', err.data.message || 'Login failed. Please check your credentials.');
                $scope.loading = false;
            });
    };

    $scope.signup = function() {
        if (!$scope.signupForm.firstName || !$scope.signupForm.lastName ||
            !$scope.signupForm.userName || !$scope.signupForm.password) {
            showAlert('danger', 'Please fill all fields.');
            return;
        }
        if ($scope.signupForm.password.length < 4) {
            showAlert('danger', 'Password must be at least 4 characters.');
            return;
        }
        $scope.loading = true;
        var savedUserName = $scope.signupForm.userName;
        ApiService.signup($scope.signupForm).then(function(res) {
            showAlert('success', 'Account created successfully! Please sign in with your username and password.');
            $scope.isSignUp = false;
            $scope.loginForm.userId = savedUserName;
            $scope.signupForm = {};
            $scope.loading = false;
        }, function(err) {
            showAlert('danger', err.data.message || 'Signup failed.');
            $scope.loading = false;
        });
    };
});
