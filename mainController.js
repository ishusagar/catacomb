'use strict';

var cs142App = angular.module('cs142App', ['ngResource', 'ngRoute', 'ngMaterial', 'ngMessages', 'mentio']);


cs142App
.config(['$routeProvider',
	function ($routeProvider) {
		$routeProvider
		.when('/login-register', {
			templateUrl: 'components/login-register/login-registerTemplate.html',
			controller: 'LoginRegisterController'
		})
		.when('/users', {
			templateUrl: 'components/user-list/user-listTemplate.html',
			controller: 'UserListController'
		})
		.when('/users/:userId', {
			templateUrl: 'components/user-detail/user-detailTemplate.html',
			controller: 'UserDetailController'
		})
		.when('/photos/:userId', {
			templateUrl: 'components/user-photos/user-photosTemplate.html',
			controller: 'UserPhotosController'
		})
		.when('/favorites', {
			templateUrl: 'components/favorites/favoritesTemplate.html',
			controller: 'FavoritesController'
		})
		.otherwise({
			redirectTo: '/users'
		});
	}])
.config(['$resourceProvider', function($resourceProvider) {
  // Don't strip trailing slashes from calculated URLs
  $resourceProvider.defaults.stripTrailingSlashes = false;
}])

.controller('MainController', ['$resource','$scope', '$rootScope', '$location', '$http',
	function ($resource, $scope, $rootScope, $location, $http) {
		$scope.main = {};
		$scope.main.title = undefined;
		$scope.main.login_name = undefined;
		$scope.main.loginNameList = [];
		$scope.main.getFullName = function(user) {
			return user.first_name + " " + user.last_name;
		};
		$scope.main.logout = function() {
			$resource("/admin/logout").save(function() {
				$scope.main.login_name = undefined;
				$location.path("/login-register");
			}, function(err) {
				console.error("Logout error: ", err);
			});
		}; 
		$scope.main.goToFavorites = function() {
			$location.path("/favorites");
		};

		// If user is logged out, redirect to login page. 
		$rootScope.$on("$routeChangeStart", function(event, next, current) {
			$scope.main.letUserChooseFile = false;
			// A. If it was a browser refresh, check for existing session on server
			if (!current) {
				$http.post("admin/isLoggedIn", {}).then(function successCallback(user) {
					if (user.data) {
						$scope.main.login_name = user.data.login_name;
						$scope.main.user_id    = user.data.user_id;
						$scope.main.user_full_name = user.data.user_full_name;
						$rootScope.$broadcast('userLoggedIn');
						if (next.templateUrl === "components/login-register/login-registerTemplate.html") {
							$location.path("/users/" + $scope.main.user_id);
						}
					} else {
						$location.path("/login-register");
					}
				}, function failureCallback(err) {
					console.log("Something went wrong requesting if user had a session:", err);
					return true;
				});
			// B. Else if no login name local variable, redirect to login (server will prevent local var hacking)
		} else if ($scope.main.login_name === undefined && 
			next.templateUrl !== "components/login-register/login-registerTemplate.html") {
			$location.path("/login-register");
			// C. Prevent logged in user from visiting login page
		} else if ($scope.main.login_name !== undefined && 
			next.templateUrl === "components/login-register/login-registerTemplate.html") {
			$location.path("/users/" + $scope.main.user_id);
		} 
	});

		var selectedPhotoFile;   // Holds the last file selected by the user
		// Called on file selection - we simply save a reference to the file in selectedPhotoFile
		$scope.inputFileNameChanged = function (element) {
			selectedPhotoFile = element.files[0];
		};

		// Has the user selected a file?
		$scope.inputFileNameSelected = function () {
			return !!selectedPhotoFile;
		};

		// Upload the photo file selected by the user using a post request to the URL /photos/new
		$scope.uploadPhoto = function () {
			if (!$scope.main.letUserChooseFile) { // display "Choose File" button if needed
				$scope.main.letUserChooseFile = true;
			return;
		}	
		if (!$scope.inputFileNameSelected()) {
			console.error("uploadPhoto called will no selected file");
			return;
		}
	    // Create a DOM form and add the file to it under the name uploadedphoto
	    var domForm = new FormData();
	    domForm.append('uploadedphoto', selectedPhotoFile);

	    // Using $http to POST the form
	    $http.post('/photos/new', domForm, {
	    	transformRequest: angular.identity,
	    	headers: {'Content-Type': undefined}
	    }).then(function successCallback(response){
	    	$scope.main.letUserChooseFile = false;
	    }, function errorCallback(response){
	    	console.error('ERROR uploading photo', response);
	    });
	  };
	}]) // end MainController

// descriptor of a single user
.directive("singleUserDetail", function() {
	return {
		templateUrl: "/directives/single-user-detailTemplate.html"
	};

});
