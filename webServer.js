/**
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code (see portno below)
 * port. It also establishes a connection to the MongoDB named 'project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch
 * any file accessible to the current user in the current directory or any of
 * its children.
 *
 * This webServer exports the following URLs:
 * /            - Returns a text status message. Good for testing web server
 *                running.
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns the population counts of the project6 collections in the
 *                database. Format is a JSON object with properties being the
 *                collection name and the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the
 * database:
 * /user/list         - Returns an array containing all the User objects from
 *                      the database (JSON format).
 * /user/:id          - Returns the User object with the _id of id (JSON
 *                      format).
 * /photosOfUser/:id  - Returns an array with all the photos of the User (id).
 *                      Each photo should have all the Comments on the Photo
 *                      (JSON format).
 */

// import session from "express-session";
// import bodyParser from "body-parser";
// import multer from "multer";
// import fs from "fs";
// import mongoose from "mongoose";
// import express from "express";
// import bluebird from "bluebird";

// import User from "./schema/user.js";
// import Photo from "./schema/photo.js";
// import SchemaInfo from "./schema/schemaInfo.js";

// import { makePasswordEntry, doesPasswordMatch } from "./password.js";

const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const express = require("express");
const bluebird = require("bluebird");
const process = require('process');

const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");

const { makePasswordEntry, doesPasswordMatch } = require("./password.js");

const app = express();

const processFormBody = multer({ storage: multer.memoryStorage() }).single("uploadedphoto");


mongoose.set("strictQuery", false);
mongoose.Promise = bluebird; 
mongoose.connect("mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.static(process.cwd()));
app.use(session({ secret: "secretKey", resave: false, saveUninitialized: false }));
app.use(bodyParser.json());

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + process.cwd());
});

app.get("/test/:p1", async function (request, response) {
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    try {
      const info = await SchemaInfo.find({});
      if (info.length === 0) {
        return response.status(500).send("Missing SchemaInfo");
      }
      console.log("SchemaInfo", info[0]);
      return response.json(info[0]);
    } catch (err) {
      console.error("Error in /test/info:", err);
      return response.status(500).json(err);
    }
  } else if (param === "counts") {
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];

    try {
      await Promise.all(
        collections.map(async (col) => {
          col.count = await col.collection.countDocuments({});
          return col;
        })
      );

      const obj = {};
      for (let i = 0; i < collections.length; i++) {
        obj[collections[i].name] = collections[i].count;
      }
      return response.end(JSON.stringify(obj));
    } catch (err) {
      return response.status(500).send(JSON.stringify(err));
    }
  } else {
    return response.status(400).send("Bad param " + param);
  }
});

app.post("/admin/login", async (req, res) => {
  console.log("This is the received data from login:POST", req.body);

  const { login_name, password } = req.body;
  console.log("post login", req.body);
  const user_data = await User.findOne({ login_name: login_name });

  if (user_data) {
    const passwordMatched = doesPasswordMatch(user_data.password_digest, user_data.salt, password);
    if (passwordMatched) {
      const user = {
        username: login_name,
        user_id: user_data._id,
      };
      req.session.user = user;

      res.status(200).json({
        login_name: user_data.login_name,
        _id: user_data._id,
        first_name: user_data.first_name,
        last_name: user_data.last_name,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Incorrect username or password",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Incorrect username or password",
    });
  }
});

app.post('/admin/logout', async (req, res) => {

  if (!req.session.user) {
    res.status(400).send("Not Logged In");
    return;
  }

  console.log("This is the recieved data from logout:POST", req.body);
  
  const user_data = await User.find({login_name: req.session.user.username});
  if (user_data.length>0) {
    req.session.user = null;
  
    // Send a response
    res.status(200).send("Logged out");
  }

  else {
    res.status(404).json({
      success: false,
      message: "Username logged in",
    });
  }

});

// Route to handle file upload and photo creation
app.post('/photos/new', (req, res) => {
  // Only allow authenticated users to upload photos
  if (!req.session.user) {
    return res.status(401).send("User not authenticated");
  }

  processFormBody(req, res, async function (err) {
    if (err || !req.file) {
      console.error("File upload error:", err);
      return res.status(400).send("Error uploading file or no file provided");
    }

    // Create a unique filename using a timestamp and the original file name
    const timestamp = new Date().valueOf();
    const filename = 'U' + String(timestamp) + req.file.originalname;

    // Write the file to the 'images' directory
    fs.writeFile("./images/" + filename, req.file.buffer, async function (err) {
      if (err) {
        console.error("Error writing file:", err);
        return res.status(500).send("Error saving file");
      }

      // Create a new Photo object and save it to the database
      const newPhoto = new Photo({
        file_name: filename,
        date_time: new Date(),
        user_id: req.session.user.user_id,
        comments: [],
      });

      try {
        const savedPhoto = await newPhoto.save();
        console.log("Photo uploaded successfully:", savedPhoto);
        res.status(200).send("Photo uploaded successfully");
      } catch (error) {
        console.error("Error saving photo to database:", error);
        res.status(500).send("Error saving photo to database");
      }
    });
  });
});

async function processMentions(commentId) {
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new Error("Invalid commentId.");
  }

  try {
    // Step 1: Find the comment and retrieve all mentions
    const photo = await Photo.findOne({ "comments._id": commentId }, { "comments.$": 1 });
    if (!photo) {
      throw new Error("Photo with the specified commentId not found.");
    }

    const comment = photo.comments[0];
    if (!comment || !comment.mentions) {
      console.log("No mentions found in the comment.");
      return;
    }

    // Extract mentionedUser IDs and mention._ids
    const mentions = comment.mentions.map((mention) => ({
      mentionedUser: mention.mentionedUser,
      mentionId: mention._id,
    }));

    // Step 2: Push each mention._id into User.mentions for the corresponding mentionedUser
    const updatePromises = mentions.map(({ mentionedUser, mentionId }) =>
      User.findByIdAndUpdate(
        mentionedUser,
        { $push: { mentions: mentionId } }, // Push mention._id into User.mentions
        { new: true } // Return the updated document
      )
    );

    const updatedUsers = await Promise.all(updatePromises);
    console.log("Updated Users:", updatedUsers);
  } catch (error) {
    console.error("Error processing mentions:", error);
    throw error;
  }
}

app.post('/commentsOfPhoto/:photo_id', async (req, res) => {

  if (!req.session.user) {
    res.status(400).send("Not Logged In");
    return;
  }

  if (req.body.comment==="") {
    res.status(400).send("Empty comment");
    return;
  }

  console.log("This is the recieved data from commentsOfPhoto:POST", req.body);

  const photoId = req.params.photo_id.replace(/^:|:$/g, '');
  const photos = await Photo.findById(photoId);
  console.log("Fetched photos",photos);
  console.log("Logged in user",req.session.user);

  const commentedUser = await User.findById(req.session.user.user_id);

  const commentId = new mongoose.Types.ObjectId();
  
  const newComment = {
    _id : commentId,
    user_id : req.session.user.user_id,
    date_time : Date(),
    comment : req.body.comment,
    mentions : req.body.mentions,
  };

  const resNewComment = {
    _id : commentId,
    user : commentedUser,
    date_time : Date(req.body.timestamp),
    comment : req.body.comment,

  };

  await Photo.updateOne(
    {_id:photoId},
    { $push: { comments : newComment } });
  
  
  // const updatedComments = await Photo.findById(photoId.slice(1),{comments: 1});

  processMentions(commentId);
  
  res.status(200).json(resNewComment);

});

app.post('/mentionsOfPhoto/', async (req, res) => {

  if (!req.session.user) {
    res.status(400).send("Not Logged In");
    return;
  }

  console.log("This is the recieved data from mentionsOfPhoto:POST");

  const mentionedUsers = req.body.user_ids;
  console.log("Logged in user",req.session.user);
  const mentionedOn = req.body.photo_id;

  mentionedUsers.forEach(async function(user){
    console.log(user);
    await User.updateOne(
      {_id:user},
      { $push: { mentions : mentionedOn } });
  });

  res.status(200).send("Successfully Added Mentions");

});

app.post("/photoFavorites/:photo_id", async (req, res) => {
  const { photo_id } = req.params;
  const { favorite } = req.body; // Retrieve the 'favorite' value from the request body
  
  if (!req.session.user) {
    res.status(400).send("Not Logged In");
    return;
  }
  const {user_id} = req.session.user;

  if (typeof favorite !== "number" || (favorite !== 0 && favorite !== 1)) {
    return res.status(400).json({ message: "Invalid favorite value. Must be 0 or 1." });
  }

  try {

    let update;

    if (favorite === 1) {
      // Add the user_id to the 'favorite' array
      update = { $addToSet: { favorite: user_id } }; // Ensures no duplicates
    } else if (favorite === 0) {
      // Remove the user_id from the 'favorite' array
      update = { $pull: { favorite: user_id } };
    } else {
      throw new Error("Invalid favorite value. Must be 0 or 1.");
    }

    // Find the photo by ID and update its 'favorite' attribute
    const photo = await Photo.findByIdAndUpdate(photo_id, update, { new: true });


    if (!photo) {
      return res.status(404).json({ message: "Photo not found." });
    }

    res.status(200).json({ message: "Photo favorite status updated.", photo });
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


app.post('/user', async (req, res) => {
  try {
      const { first_name, last_name, location, description, occupation, login_name, password } = req.body;

      // Validate required fields
      if (!login_name || !password) {
          return res.status(400).json({ message: 'Username and password are required.' });
      }

      const user_exist = await User.findOne({login_name: login_name});
      if (user_exist) {
        return res.status(400).json({message: "username already exists"});
      }

      // Create a new user instance
      const {hash, salt} = makePasswordEntry(password);
      const password_digest = hash;
      const newUser = new User({
          first_name,
          last_name,
          location,
          description,
          occupation,
          login_name,
          password_digest,
          salt
      });

      // Save the user to the database
      await newUser.save();
      
      res.status(200).json({ message: 'User registered successfully!',login_name:login_name });
  } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'An error occurred while registering the user.' });
  }
});



/**
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", function (request, response) {

  if (!request.session.user) {
    console.log("inside")
    response.status(401).send("Not Logged In");
    return;
  }
  
  let userNames = [];
  User.find().select("first_name last_name")
  .then((result) => {
    userNames = result;
    response.status(200).send(userNames);
  });
  // response.status(200).send(models.userListModel());
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get("/user/:id", async (request, response) => {

  if (!request.session.user) {
    response.status(401).send("Not Logged In");
    return;
  }

  const id = request.params.id;
  try {
    const user = await User.findById(id, '_id first_name last_name location description occupation mentions');
    if (!user) {
      response.status(400).send("User not found");
      return;
    }
    response.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    response.status(400).send("Invalid ID format");
  }
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", async function (request, response) {

  if (!request.session.user) {
    response.status(401).send("Not Logged In");
    return;
  }

  const id = request.params.id;
  // const photos = models.photoOfUserModel(id);
  try {
    const photos = await Photo.find({user_id: id})
    .select('_id user_id comments file_name date_time favorite')
    .populate({
      path: 'comments.user_id',
      select: '_id first_name last_name',
      model: 'User'
    });

    if (photos.length === 0) {
      console.log("Photos for user with _id:" + id + " not found.");
      response.status(400).send("Not found");
      return;
    }

    var photosWithUsers = photos.map(photo => ({
      _id: photo._id,
      user_id: photo.user_id,
      file_name: photo.file_name,
      date_time: photo.date_time,
      favorite: photo.favorite,
      comments: photo.comments.map(comment => ({
        comment: comment.comment,
        date_time: comment.date_time,
        _id: comment._id,
        user: comment.user_id,
      }))
    }));


    response.status(200).send(photosWithUsers);
  }
  catch(error) {
    console.error("Error fetching photos for user:", error);
    response.status(400).send("Invalid user ID format");
  }
});

app.get("/favoritePhotos/", async function (request, response) {

  if (!request.session.user) {
    response.status(401).send("Not Logged In");
    return;
  }

  try {
    const photos = await Photo.find({favorite: request.session.user.user_id})
    .select('_id user_id file_name date_time');

    if (photos.length === 0) {
      console.log("Photos for logged in user not found.");
      response.status(200).send([]);
      return;
    }

    var photosWithUsers = photos.map(photo => ({
      _id: photo._id,
      user_id: photo.user_id,
      file_name: photo.file_name,
      date_time: photo.date_time,
    }));


    response.status(200).send(photosWithUsers);
  }
  catch(error) {
    console.error("Error fetching photos for user:", error);
    response.status(400).send("Invalid user ID format");
  }
});

app.get("/photos", async (req, res) => {
  
  if (!req.session.user) {
    res.status(401).send("Not Logged In");
    return;
  }

  try {
    // Get the list of photo IDs from the request body
    const photoIds = req.query.photoIds;

  if (!photoIds || photoIds.length === 0) {
    return res.status(400).json({ message: "Invalid photoIds array in query parameters." });
  }

    // Convert string IDs to ObjectIds
    const objectIds = photoIds.map((id) => new mongoose.Types.ObjectId(id));

    // Fetch matching photos from the database excluding 'comments'
    const photos = await Photo.find({ _id: { $in: objectIds } }).select("-comments");

    res.status(200).json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/mentions/", async (req, res) => {
  if (!req.session.user) {
    res.status(401).send("Not Logged In");
    return;
  }
  
  const { mentionIds } = req.query;

  if (!mentionIds || !Array.isArray(mentionIds)) {
    return res.status(400).json({ message: "mentionIds parameter must be a list of IDs." });
  }

  try {
    // Validate and convert mentionIds to ObjectId
    const validMentionIds = mentionIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

      console.log("Checking for valid mentions ids", validMentionIds);

    if (validMentionIds.length === 0) {
      return res.status(400).json({ message: "No valid mention IDs provided." });
    }

    // Find photos where comments.mentions contains any of the mentionIds, excluding 'comments'
    const photos = await Photo.find(
      { "comments.mentions._id": { $in: validMentionIds } },
      { comments: 0 } // Exclude the 'comments' attribute
    );

    if (!photos || photos.length === 0) {
      return res.status(404).json({ message: "No photos found for the given mention IDs." });
    }

    console.log("How many photos were found", photos);

    res.status(200).json(photos);
  } catch (error) {
    console.error("Error retrieving photos by mentions:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// DELETE a photo owned by the user
app.delete('/photos/:photo_id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("User not authenticated");
  }

  const photoId = req.params.photo_id;

  try {
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).send("Photo not found");
    }

    // Check if the user owns the photo
    if (!photo.user_id.equals(req.session.user.user_id)) {
      return res.status(403).send("User does not own this photo");
    }

    // Delete the photo
    await Photo.deleteOne({ _id: photoId });
    res.status(200).send("Photo deleted successfully");
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).send("Error deleting photo");
  }
});

async function deleteMentionsFromComment(commentId) {
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new Error("Invalid commentId.");
  }

  try {
    // Step 1: Find the comment and retrieve all mentions
    const photo = await Photo.findOne({ "comments._id": commentId }, { "comments.$": 1 });
    if (!photo) {
      throw new Error("Photo with the specified commentId not found.");
    }

    const comment = photo.comments[0];
    if (!comment || !comment.mentions) {
      console.log("No mentions found in the comment.");
      return;
    }

    // Extract all mention._ids and mentionedUser IDs
    const mentions = comment.mentions.map((mention) => ({
      mentionedUser: mention.mentionedUser,
      mentionId: mention._id,
    }));

    // Step 2: Remove all mention._ids from User.mentions
    const updatePromises = mentions.map(({ mentionedUser, mentionId }) =>
      User.findByIdAndUpdate(
        mentionedUser,
        { $pull: { mentions: mentionId } }, // Remove mention._id from User.mentions
        { new: true } // Return the updated document
      )
    );

    const updatedUsers = await Promise.all(updatePromises);
    console.log("Updated Users after deletion:", updatedUsers);
  } catch (error) {
    console.error("Error deleting mentions:", error);
    throw error;
  }
}

// DELETE a comment made by the user
app.delete('/comments/:comment_id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("User not authenticated");
  }

  const commentId = req.params.comment_id;

  deleteMentionsFromComment(commentId);

  try {
    // Find the photo containing the comment
    const photo = await Photo.findOne({ "comments._id": commentId });

    if (!photo) {
      return res.status(404).send("Comment not found");
    }

    // Find the comment in the photo
    const comment = photo.comments.id(commentId);

    // Check if the user owns the comment
    if (!comment.user_id.equals(req.session.user.user_id)) {
      return res.status(403).send("User does not own this comment");
    }

    // Use $pull to remove the comment from the database
    await Photo.updateOne(
      { _id: photo._id },
      { $pull: { comments: { _id: commentId } } }
    );

    res.status(200).send("Comment deleted successfully");
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).send("Error deleting comment");
  }
});


// DELETE a user account, including their photos and comments
app.delete('/user/:user_id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("User not authenticated");
  }

  const userId = req.params.user_id;

  // Check if the user is deleting their own account
  if (!userId === req.session.user.user_id) {
    return res.status(403).send("User can only delete their own account");
  }

  try {
    // Delete all photos owned by the user
    await Photo.deleteMany({ user_id: userId });

    // Delete all comments made by the user in photos
    await Photo.updateMany(
      { "comments.user_id": userId },
      { $pull: { comments: { user_id: userId } } }
    );

    // Delete the user account
    await User.deleteOne({ _id: userId });

    // Log the user out
    req.session.user = null;

    res.status(200).send("User account deleted successfully");
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).send("Error deleting user account");
  }
});


const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" + port + " exporting the directory " + process.cwd()
  );
});
