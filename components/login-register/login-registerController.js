'use strict';

catacomb.controller('LoginRegisterController', ['$scope', '$routeParams', '$resource', '$location', '$rootScope',
	function ($scope, $routeParams, $resource, $location, $rootScope) {
		$scope.title = "Welcome to CataComb🌵 !";	
		$scope.main.title = "";
		$scope.showRegistration = false;
		$scope.isRegistration   = function() {
			$scope.showRegistration = true;
			return $scope.showRegistration;
		};
		$scope.userSchema = {
			login_name: "",
			password:  "",
			password_confirm:  "",
	    first_name: "",  // First name of the user.
	    last_name:  "",   // Last name of the user.
	    location:   "",    // Location  of the user.
	    description: "", // A brief user description
	    occupation:  ""  // Occupation of the user.
	  };

	  function allPropsAreDefined(userSchema) {
	  	var allPropsDefined = true;
	  	Object.keys(userSchema).forEach(function(key) {
	  		if (userSchema[key] === undefined) {
	  			allPropsDefined = false;
	  		}
	  	});
	  	return !!allPropsDefined;
	  }

	  $scope.submitForm = function() {
			// handle new user registration
			if ($scope.showRegistration) {
				// validate submit data, send error title if needed
				if (!allPropsAreDefined($scope.userSchema)) {
					$scope.title = "Whoops, be sure you fill all the forms, with no red warming messages.";
					return;
				}
				if ($scope.userSchema.password !== $scope.userSchema.password_confirm) {
					$scope.title = "Make sure your passwords match, buddy.";
					return;
				}
				// if all data entereted correctly (passwords match), send post reqeust with user object
				$resource("/users").save({user: $scope.userSchema}, function(response) {
					// log user in
					$resource('/admin/login/')
					.save({login_name: $scope.userSchema.login_name}, function(user){
						$scope.main.login_name = user.login_name;
						$scope.main.user_id    = user._id;
						$rootScope.$broadcast('userLoggedIn');
						$location.path("/users/" + user._id); 
					}, function(err) {
						$scope.title = "We could not find that login name in the database.";
					});
				}, function(err) {
					$scope.title = err.data;
				});

			// user tries to login directly (no registration)
		} else if ($scope.userSchema.login_name) {
			$resource('/admin/login/')
			.save({login_name: $scope.userSchema.login_name}, function(user){
				$scope.main.login_name = user.login_name;
				$scope.main.user_id    = user._id;
				$rootScope.$broadcast('userLoggedIn');
				$location.path("/users/" + user._id); 
			}, function(err) {
				$scope.title = "We could not find that login name in the database.";
			});

		} else {
			$scope.title = "Login name isn't valid, dude.";
		}

	};
}]);
