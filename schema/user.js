"use strict";

const mongoose = require("mongoose");

/**
 * Define the Mongoose Schema for a Comment.
 */
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  location: String,
  description: String,
  occupation: String,
  login_name: String,
  // password: String,
  password_digest: String,
  salt: String,
});

/**
 * Create a Mongoose Model for a User using the userSchema.
 */
const User = mongoose.model("User", userSchema);

/**
 * Make this available to our application.
 */
module.exports = User;
