"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');

// create (single) @mention schema
var mentionSchema = new mongoose.Schema({
	photo_id: mongoose.Schema.Types.ObjectId, // Photo Id comment was posted to
	photo_file_name: String,
	photo_owner_id: mongoose.Schema.Types.ObjectId,
	comment_body: String, // Text of the comment
	comment_author_full_name: String, // First and Last name of comment creator
	comment_author_id: mongoose.Schema.Types.ObjectId // Id of comment creator
});

// create user schema
var userSchema = new mongoose.Schema({
		login_name: String, // Login name of the user.
		password:   String, // Password to login (4-20 characters).
    first_name: String, // First name of the user.
    last_name:  String, // Last name of the user.
    location:   String, // Location  of the user.
    description:String, // A brief user description
    occupation: String,  // Occupation of the user.
    mentions: [mentionSchema], // See mentionSchema
    favorites: [mongoose.Schema.Types.ObjectId] // photo_ids of favorite photos
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
