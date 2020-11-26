'use strict';

catacomb.controller('UserPhotosController', ['$scope', '$routeParams', '$resource', '$location', '$anchorScroll',
	function($scope, $routeParams, $resource, $location, $anchorScroll) {  

    // mentio
    $scope.people = $scope.main.loginNameList;
    var selectedMentionsArray = [];
    $scope.storeSelectedMention = function(item) {
    	selectedMentionsArray.push(item.label);
    	return "@" + item.label;
    };

    // get user information
    var userId = $routeParams.userId;
    var UserResObj = $resource("/user/:id");
    $scope.user = UserResObj.get({id: userId}, function(user) {
    	$scope.main.title = "Files of " + $scope.main.getFullName($scope.user);
    }); 

    var PhotosResObj = $resource("/photosOfUser/:id");  

    // *** FUNCTIONS *** 
    // get user's photos function (called after favorite list loads)
    function getUserPhotos() {
    	PhotosResObj.query({id: userId}, function success(userPhotos) {
    		$scope.userPhotos = userPhotos;
    		if ($scope.main.scrollToPhotoId) {
    			$location.hash($scope.main.scrollToPhotoId);
    			$scope.main.scrollToPhotoId = undefined;
    			$anchorScroll();
    		}
    	}, function failure(err) {
    		console.error("Error getting photos of user: ", err);
    	});
    }

    // Get logged in user's favorites, use to set whether a photo can be added to favorites
    function loadUserFavoritesList(loadPhotosToo) {
    	$resource("/favorites").query({}, function success(favorites) {
    		$scope.favorites = favorites;
        // now load all the photos
        if (loadPhotosToo) {
        	getUserPhotos();
        } 
    }, function(err) {
     console.error("Couldn't get favorites list: ", err); 
 });
    }

    // *** FUNCTION CALL ***
    var loadPhotos = true;
    loadUserFavoritesList(loadPhotos);

    // Set favorite button text based on whether it's already been favorited
    var canFavoriteText = "Add to favorites";
    var alreadyFavoritedText = "(favorited)";
    $scope.setFavoriteButtonText = function(photo) {
    	return ($scope.favorites.indexOf(photo._id) === -1) ? canFavoriteText : alreadyFavoritedText;
    };

    // Save photo id to user favorites in db
    $scope.addToFavorites = function(photo) {
    	if ($scope.favorites.indexOf(photo._id) !== -1) {
    		return;
    	}
    	$resource("/favorites").save({photo_id: photo._id}, function success() {
    		loadUserFavoritesList();
    	}, function	failure(err) {
    		console.error("Failed to save favorite: ", err);
    	});
    };

    // submit comments to db
    $scope.submitComment = function(comment_submission, photo) {
    	if (comment_submission) {
    		// sanity check: login_name still in comment body
    		selectedMentionsArray = selectedMentionsArray.filter(function(login_name) {
    			return comment_submission.includes("@" + login_name);
    		});
    		$resource('/commentsOfPhoto/' + photo._id).save({comment: comment_submission}, function(){
    			// refresh page with new comment, scroll to current photo
    			PhotosResObj.query({id: userId}, function success(userPhotos) {
                    $scope.userPhotos = userPhotos;
                    $location.hash(photo._id);
                    $anchorScroll();
                }, function failure(err) {
                    console.err("Failure to reload page after adding new comment:", err);
                });
    			
    			// update users in db who were mentioned in comments (if any)
    			if (selectedMentionsArray.length) {
    				var mentionObjectsArray = [];
    				selectedMentionsArray.forEach(function(mentionedLoginName) {
    					mentionObjectsArray.push({ 
    						mentionedLoginName: mentionedLoginName, // temp: not saved to db
    						photo_id: photo._id,
    						photo_file_name: photo.file_name,
    						photo_owner_id: photo.user_id,
    						comment_body: comment_submission,
    						comment_author_full_name: $scope.main.user_full_name,
    						comment_author_id: $scope.main.user_id // author is current user
    					});
    					comment_submission = undefined; // clear text in comment input
    				});
    				$resource("/mentions").save({mentions: mentionObjectsArray}, function() {
    					// success, mentions saved to db
    				}, function(err) {
    					console.error("Mention not saved. Error: ", err);
    				});
    			}
    		}, function(err) {
    			console.error("Error posting comment.", err);
    		});
    	} 
    };
}]);
