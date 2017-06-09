"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

 var mongoose   = require('mongoose');
 var async      = require('async');
 var session    = require('express-session');
 var bodyParser = require('body-parser');
 var fs         = require("fs");
 var multer     = require('multer');
 var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');


// Load the Mongoose schema for User, Photo, and SchemaInfo
var User        = require('./schema/user.js');
var Photo       = require('./schema/photo.js');
var SchemaInfo  = require('./schema/schemaInfo.js');

var express     = require('express');
var app         = express();



mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
	response.send('Simple web server of files from ' + __dirname);
});

// Functions
function notLoggedIn(request, response) {
	if (!request.session.login_name) {
		response.status(401).end();
		return true;
	}
	return false;
}

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
 app.get('/test/:p1', function (request, response) {
 	if(notLoggedIn(request, response)) {
 		return;
 	}  
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
        	if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
              }
              if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
              }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
          });
      } else if (param === 'counts') {
      	var collections = [
      	{name: 'user', collection: User},
      	{name: 'photo', collection: Photo},
      	{name: 'schemaInfo', collection: SchemaInfo}
      	];
      	async.each(collections, function (col, done_callback) {
      		col.collection.count({}, function (err, count) {
      			col.count = count;
      			done_callback(err);
      		});
      	}, function (err) {
      		if (err) {
      			response.status(500).send(JSON.stringify(err));
      		} else {
      			var obj = {};
      			for (var i = 0; i < collections.length; i++) {
      				obj[collections[i].name] = collections[i].count;
      			}
      			response.end(JSON.stringify(obj));

      		}
      	});
      } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
      }
    });

/*
 * URL /user/list - Return all the User object.
 */
 app.get('/user/list', function (request, response) {
 	if(notLoggedIn(request, response)) {
 		return;
 	}  
 	User.find({}, function(err, users) {
 		if (err) {
 			console.error('Doing /user/list error:', err);
 			response.status(500).send(JSON.stringify(err));
 			return;
 		}
 		if (users.length === 0) {
 			response.status(500).send('Found none of the users');
 			return;
 		}
 		var userModelRaw = JSON.parse(JSON.stringify(users));
 		// _id, first_name, last_name
 		var userModel = userModelRaw.map(function(user) {
 			return {_id: user._id, first_name: user.first_name, last_name: user.last_name, login_name: user.login_name};
 		});
 		response.status(200).end(JSON.stringify(userModel));
 		return;

 	});
 });

/*
 * URL /user/:id - Return the information for User (id)
 */
 app.get('/user/:id', function (request, response) {
 	if(notLoggedIn(request, response)) {
 		return;
 	}  
 	var user_id = request.params.id;
 	// retrieve single user
 	User.findOne({_id: user_id}, function (err, user) { 
 		if (user === undefined) {
      // Query didn't return an error but didn't find the SchemaInfo object - This
      // is also an internal error return.
      response.status(400).send('Missing User');
      return;
    }
    if (err) {
      // Query returned an error. Error (500) error code.
      console.error('Doing /user/:id error:', err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    
	  // We got the object: keep needed props and return it in JSON format.
	  var finishedUser = {
	  	_id: user._id,
	  	first_name: user.first_name,
	  	last_name:  user.last_name,
	  	location:   user.location,
	  	description:user.description,
	  	occupation: user.occupation
	  };
	  response.status(200).end(JSON.stringify(finishedUser)); 
	});
 });


/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
 app.get('/photosOfUser/:id', function (request, response) {
 	if(notLoggedIn(request, response)) {
 		return;
 	}  
 	var id = request.params.id;
 	Photo.find({user_id: id}, function(err, photos) {
 		if (err) {
 			console.error("Error loading photos: ", err);
 			response.status(400).send('Photos not loaded');
 			return;
 		}
 		var photosModel = JSON.parse(JSON.stringify(photos));
 		var newPhotosModel = [];
 		// >>>For each photo, compile comments in proper format<<
 		async.each(photosModel, function (photoObj, finishedAPhotoCallback) {
 			var newPhotoObj = {
 				_id: photoObj._id, 
 				user_id: photoObj.user_id, 
 				file_name: photoObj.file_name, 
 				date_time: photoObj.date_time
 				// 'comments' added later
 			};
 			// >>>For each comment, fetch user object, photo_id<<<
 			var newComments = [];
 			async.each(photoObj.comments, function(comment, finishedACommentCallback) {
 				// handle a single comment
 				var newComment = {
 					comment: comment.comment,
 					date_time: comment.date_time
 				};
 				// 1. retrieve single user 
 				User.findOne({_id: comment.user_id}, function (err, user) { 
 					if (err) {
 						console.error('Commenter retrieval error:', err);
 						response.status(500).send(JSON.stringify(err));
 						return;
 					}
 					if (user.length === 0) {
 						response.status(400).send('Missing User');
 						return;
 					}
			    // all good, store user
			    var newUser = {
			    	first_name: user.first_name, 
			    	last_name: user.last_name, 
			    	_id: user._id
			    };
			    newComment.user = newUser;
			    newComments.push(newComment);
			    finishedACommentCallback();
			  });
 				
 			}, function (err) {
 				// now we finished handling ALL comments
 				if (err) {
 					console.error("Error processing all comments");
 					response.status(500).send(JSON.stringify(err));
 				} else {
 					newPhotoObj.comments = newComments;
 					newPhotosModel.push(newPhotoObj); 
 					finishedAPhotoCallback();
 				}
 			});
 		}, function (err) { // done with all photos
 			if (err) {
 				response.status(500).send(JSON.stringify(err));
 			} else {
 				response.status(200).end(JSON.stringify(newPhotosModel)); 
 			}
 		}); 
 	});
 }); 

 // Checks if a user is currently logged in via session, returns login_name if so
 app.post('/admin/isLoggedIn', function(request, response) {
 	if(request.session.login_name) {
 		response.status(200).send({
      login_name: request.session.login_name, 
      user_id: request.session.user_id,
      user_full_name: request.session.user_full_name
    });
 		return;
 	} else {
 		response.status(200).send(null);
 	}

 });

 app.post('/admin/login', function (request, response) {
 	var login_name = request.body.login_name;
  // verify user is in the database
  User.findOne({login_name: login_name}, function (err, user) { 
  	if (err) {
  		console.error('Login name retrieval error:', err);
  		response.status(500).send(JSON.stringify(err));
  		return;
  	}
  	if (user === null) {
  		console.error('Login name does not exist: ', login_name);
  		response.status(400).send('Login name does not exist.');
  		return;
  	}
    // login_name is valid, log user in
    request.session.login_name = login_name;
    request.session.user_id    = user._id;
    request.session.user_full_name = user.first_name + " " + user.last_name;
    response.status(200).send(JSON.stringify(user));
  }); 
  
});

 app.post('/admin/logout', function (request, response) {
 	if(notLoggedIn(request, response)) {
 		return;
 	}
 	request.session.destroy(function(err) {
 		if (err) {
 			console.error("Error destroying session:", err);
 			response.status(500).end();
 		} else {
 			response.status(200).send();
 		}
 	});
 });

 app.post("/commentsOfPhoto/:photo_id", function(request, response) {
  if(notLoggedIn(request, response)) {
    return;
  }  
  if (request.body.comment === "") {
   response.status(400).end();
 }
 Photo.findOne({_id: request.params.photo_id}, function (err, photo) {
 		// check for errors
 		if (photo === undefined) {
      // Query didn't return an error but didn't find the SchemaInfo object - This
      // is also an internal error return.
      response.status(400).send('Photo id not found in db');
      return;
    }
    if (err) {
      // Query returned an error. Error (500) error code.
      console.error('Error retrieving photo:', err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
		// All good, update photo object
		var newComment = {
			comment:   request.body.comment,
			date_time: new Date(), 
			user_id:   request.session.user_id
		};
		photo.comments.push(newComment);
		photo.save();
		response.send();
	});
});

 app.post("/photos/new", function(request, response) {
  if(notLoggedIn(request, response)) {
    return;
  }  
  processFormBody(request, response, function (err) {
   if (err || !request.file) {
    console.error(err ? "Error processing photo:" : "No file:", err);
    response.status(500).end("Error processing photo/no file");
    return;
  }
    // error check file itself
    if (request.file.fieldname !== 'uploadedphoto') {
    	console.error("Incorrect fieldname");
    	response.status(400).end();
    	return;
    }
    var itsNotJPEG = (request.file.mimetype !== "image/jpeg");
    var itsNotPNG  = (request.file.mimetype !== "image/png" );
    if (itsNotPNG && itsNotJPEG) {
    	console.error("File not a jpeg or png:", request.file.mimetype);
    	response.status(400).end("File not a jpeg or png");
    	return;
    }
    if (request.file.size <= 0) {
    	console.error("Buffer has zero or negative size:", request.file.size);
    	response.status(500).end("Buffer has zero or negative size");
    	return;
    }
    // file name unique by adding a unique prefix with a timestamp.
    var timestamp = new Date().valueOf();
    var filename = 'U' +  String(timestamp) + request.file.originalname;

    fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
    	// TO DO: ERROR HANDLING (err)
      // File written into your images directory under the name filename      
 			// Add photo to db
 			Photo.create({
 				user_id: request.session.user_id, 
 				file_name: filename, 
 				date_time: new Date()
 			}, function (err, photoObj) {
 				if (err) {
 					console.error('Error create user', err);
 				} else { 
 					photoObj.save();
 					response.status(200).send();
 				}
 			}); 
 		}); // end writeFile 
  });
});

 // Register a new user
 app.post("/users", function(request, response) {
 	// validate that all properties exist
 	var userObjToReg = request.body.user;
  delete userObjToReg.password_confirm; // no longer needed
 	var allPropsDefined = true;
 	Object.keys(userObjToReg).forEach(function(key) {
 		if (userObjToReg[key] === undefined) {
 			allPropsDefined = false;
 		}
 	});
 	if (!allPropsDefined) {
 		console.error("Not all properties defined in user object.");
 		response.status(400).end("Not all properties defined in user object.");
 		return;
 	}

 	// Check if login_name already exists in db
 	User.findOne({login_name: userObjToReg.login_name}, function (err, user) { 
 		if (err) {
			// Query returned an error. Error (500) error code.
			console.error('Error checking if user existed in db:', err);
			response.status(500).end("Whoops! Our database slipped up. Please try again. Should work now...");
			return;
		}
   if (user !== null) {
    console.error("Existing User found in db with same login_name:", user);
    response.status(400).end("That user name is already taken, sorry.");
    return;
  }
  if (user === null) {
      // Query didn't find the SchemaInfo object - all clear to add to db
      User.create(userObjToReg, function(err, userObj) {
       if (err) {
        console.error('Error creating user', err);
        response.status(500).send("Error creating user in database. Please submit again.");
      } else { 
					// save user
					userObj.save();
					response.status(200).send();
				}
			});
      return;
    } 
  });
 });

 // *** MENTIONS ***

 // Store new user mention in a comment
 app.post("/mentions", function(request, response) {
  if(notLoggedIn(request, response)) {
    return;
  }  
  var mentions = request.body.mentions;
  // store each mention in its respective user object
  async.each(mentions, function forEachMention(mention, finishedMention) {
    // retrieve mentioned user, remove unneeded mentionedLoginName, save mention
    User.findOne({login_name: mention.mentionedLoginName}, function(err, user) {
      if (user === null) { // Query didn't return an error but didn't find the SchemaInfo object
        response.status(400).send('Missing mentioned User login_name');
      return;
    } 
      if (err) { // Query returned an error. Error (500) error code.
        console.error('Error trying to find mentioned user:', err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      // user retrieved succefully, save mention
      delete mention.mentionedLoginName;
      user.mentions.push(mention);
      user.save();
      finishedMention();
    });
  }, function finishedAllMentions(err) {
    if (err) {
      console.error("Error processing mentions: ", err);
      response.status(500).end("Error processing mentions: ");
    } else {
      response.status(200).end();
    }
  });
}); 

 // Returns array of objects containing photos w/ comments mentioning the user (if any)
 app.get("/mentions/:user_id", function(request, response) {
  if(notLoggedIn(request, response)) {
    return;
  }  
  User.findOne({_id: request.params.user_id}, function(err, user) {
    if (user === null) { // Query didn't return an error but didn't find the SchemaInfo object
      response.status(400).send('Missing User _id');
    return;
  } 
    if (err) { // Query returned an error. Error (500) error code.
      console.error('Error trying to find users mentions:', err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    // user retrieved succefully, send mention
    response.status(200).send(JSON.stringify(user.mentions));
  });
});

 // *** FAVORITE PHOTOS ***

 // Returns photo objects of user favorite photos used to generate actual thumbnails
 app.get("/favorites/photos", function(request, response) {
  if(notLoggedIn(request, response)) {
    return;
  }
  // load user list
  User.findOne({_id: request.session.user_id}, function(err, user) {
    if (user === null) { // Query didn't return an error but didn't find the SchemaInfo object
      response.status(400).send('Missing User _id');
    return;
  } 
    if (err) { // Query returned an error. Error (500) error code.
      console.error('Error trying to find users favorites:', err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    // user retrieved succefully
    // retrieve photo object for each favorite (photo id)
    var favPhotoObjArr = [];
    async.each(user.favorites, function (photo_id, finishedAPhotoCallback) {
      // using photo_id, retrieve the respective photoObj from db
      Photo.findOne({_id: photo_id}, function(err, photoObj) {
        // error check
        if (!photoObj) {
          // Query didn't return an error but didn't find the SchemaInfo object - This
          // is also an internal error return.
          response.status(400).send('Photo id not found in db');
          return;
        }
        if (err) {
          // Query returned an error. Error (500) error code.
          console.error('Error retrieving photo:', err);
          response.status(500).send(JSON.stringify(err));
          return;
        }
        // photoObj good, store (lite version) in array
        var newPhotoObj = {
          _id: photoObj._id, 
          user_id: photoObj.user_id, 
          file_name: photoObj.file_name, 
          date_time: photoObj.date_time
        };
        favPhotoObjArr.push(newPhotoObj);
        finishedAPhotoCallback();
      }); // Photo.findOne END
    }, function doneWithAllPhotos(err) {     
      if (err) {
        console.error("Error getting all fav photos: ", err);
        response.status(500).send(JSON.stringify(err));
      } else {
        // send photos
        response.status(200).send(JSON.stringify(favPhotoObjArr));
      }
    });
  });
});

 // Returns array  listing photo ids of user's favorites
 app.get("/favorites", function(request, response) {
  if(notLoggedIn(request, response)) {
    return;
  }  
  User.findOne({_id: request.session.user_id}, function(err, user) {
    if (user === null) { // Query didn't return an error but didn't find the SchemaInfo object
      response.status(400).send('Missing User _id');
    return;
  } 
    if (err) { // Query returned an error. Error (500) error code.
      console.error('Error trying to find users favorites:', err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    // user retrieved succefully, send favorites
    response.status(200).send(JSON.stringify(user.favorites));
  });
});

 // Post a new favorite photo by storing photo_id
 app.post("/favorites", function(request, response) {
  if(notLoggedIn(request, response)) {
    return;
  }  
  var newFavPhotoId = request.body.photo_id;
  User.findOne({_id: request.session.user_id}, function(err, user) {
    if (user === null) { // Query didn't return an error but didn't find the SchemaInfo object
      response.status(400).send('Missing User id in db');
    return;
  } 
    if (err) { // Query returned an error. Error (500) error code.
      console.error('Error trying to find users favorites:', err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    // user retrieved succefully!
    // check if a duplicate
    if (user.favorites.indexOf(newFavPhotoId) !== -1) {
      console.error("That photo is already in favorites", newFavPhotoId);
      response.status(400).end("That photo is already in favorites");
      return;
    }
    user.favorites.push(newFavPhotoId);
    user.save();
    response.status(200).end();
  });
});

 // Delete an existing favorite photo
 app.delete("/favorites/:photo_id", function(request, response) {
  if(notLoggedIn(request, response)) {
    return;
  }  
  User.findOne({_id: request.session.user_id}, function(err, user) {
    if (user === null) { // Query didn't return an error but didn't find the SchemaInfo object
      response.status(400).send('Missing User id in db');
    return;
  } 
    if (err) { // Query returned an error. Error (500) error code.
      console.error('Error trying to find users favorites:', err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    // user retrieved succefully, delete favorite
    var indexToDel = user.favorites.indexOf(request.params.photo_id);
    if (indexToDel >= 0) {
      user.favorites.splice(indexToDel, 1);
      user.save();
      response.status(200).end();
    } else {
      console.error("That favorite photo_id didn't exist in their favorites");
      response.status(400).end("That favorite photo_id didn't exist in their favorites");
    }
  });
});

 // Initiate server listening on port 3000
 var server = app.listen(3000, function () {
 	var port = server.address().port;
 	console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
 });
