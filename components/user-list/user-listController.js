'use strict';

cs142App.controller('UserListController', ['$scope', '$resource', '$location',
	function ($scope, $resource, $location) {
		if ($location.path() === "/users") {
			$scope.main.title = 'Users';
		}
		
		var userListResObj = $resource("/user/list");
		$scope.$on("userLoggedIn", function() {
			userListResObj.query({}, function(userList) {
				$scope.userListModel = userList;
				userList.forEach(function(userObj) {
					$scope.main.loginNameList.push({label: userObj.login_name});
				});
			}, function(err) {
				console.log("Error attempting to retrieve user list:", err);
			});
		});
	}]);

