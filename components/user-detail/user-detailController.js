'use strict';

catacomb.controller('UserDetailController', ['$scope', '$routeParams', '$resource', '$location',
	function ($scope, $routeParams, $resource, $location) {
		var userId = $routeParams.userId;
		var usersResObj = $resource("/user/:id");
		$scope.user = usersResObj.get({id: userId}, function(user) {
			$scope.main.title = $scope.main.getFullName($scope.user);
		});
		// retrieve user mentions (if any)
		$resource("/mentions/" + userId).query({}, function success(mentions) {
			$scope.mentions = mentions;
		}, function(err) {
			console.error("Couldn't get mentions: ", err);
		});
		
		$scope.$on('userLoggedIn', function() {
			console.log("userLoggedIn, refreshing model");
			$scope.user = usersResObj.get({id: userId}, function(user) {
				$scope.main.title = $scope.main.getFullName($scope.user);
				// retrieve user mentions (if any)
				$resource("/mentions/" + userId).query({}, function success(mentions) {
					$scope.mentions = mentions;
				}, function(err) {
					console.error("Couldn't get mentions: ", err);
				}); 
			});
		});

		// Loads users photos who owns the clicked photo, scrolls to clicked photo
		$scope.goToPhoto = function(mention) {
			$scope.main.scrollToPhotoId = mention.photo_id;
			$location.path("/photos/" + mention.photo_owner_id);
		};

	}]);
