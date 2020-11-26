'use strict';

catacomb.controller('FavoritesController', ['$scope', '$resource', '$mdDialog',
	function ($scope, $resource, $mdDialog) {

		// retrieve user favorites (if any)
		function getFavoritePhotos() {
			$resource("/favorites/photos").query({}, function success(favorites) {
				$scope.favorites = favorites;
			}, function(err) {
				console.error("Couldn't get favorites: ", err); 
			});
		}

		// Load model for the first time
		getFavoritePhotos();

		// Loads  photos in lightbox
		$scope.goToPhoto = function(favorite, event) {
			$mdDialog.show({
				parent: angular.element(document.body),
				targetEvent: event,
				template:
				'<md-dialog>' +
				'<img class="user-img" ng-src="/images/{{favorite.file_name}}">' +
				'<div>{{favorite.date_time | date}}</div>' +
				'<md-button class="md-raised md-primary" ng-click="closeDialog()">Exit</md-button>' +
				'</md-dialog>',
				clickOutsideToClose: true,
				locals: {
					favorite: favorite
				},
				controller: DialogController
			});
			function DialogController($scope, $mdDialog, favorite) {
				$scope.favorite = favorite;
				$scope.closeDialog = function() {
					$mdDialog.cancel();
				};
			}
	  }; // close goToPhoto

	  $scope.removePhoto = function(favorite) {
	  	// send delete request
	  	$resource("/favorites/" + favorite._id).remove({}, function success() {
	  		getFavoritePhotos(); // refresh page
	  	}, function failure(err) {
	  		console.error("something went wrong deleting a favorited photo:", err);
	  	});
	  	// once deleted, refresh page
	  };
	}]);

