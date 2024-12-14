import axios from 'axios';
import React, {
  useState,
  useEffect,
  useContext } from "react";
import { useNavigate } from "react-router-dom";
import { 
List,
Typography,
ListItem,
Divider,
Link,
Paper, 
Checkbox} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { MentionsInput, Mention } from 'react-mentions';

import UserLoggedIn from '../../photoShare';
import MentionComment from './mention_comments';
import "./styles.css";

import PropTypes from 'prop-types';

function formatDateTime(dateString) {
  // Parse the date string into a Date object
  const date = new Date(dateString);

  // Check if the date is valid
  if (Number.isNaN(date)) {
    return "Invalid date";
  }

  // Get day, month name, and year
  const day = date.getDate();
  const monthName = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  // Format time as HH:MM (24-hour format)
  const time = date.toLocaleTimeString('default', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Combine into desired format
  return `${day} ${monthName} ${year}, ${time}`;
}



function AddComment({handleSetComments,photoId}) {
  // State to hold the input value
  const [comment, setComment] = useState('');
  const [userList, setUserList] = useState([]);

  // Handle input change
  const handleInputChange = (event) => {
    setComment(event.target.value);
  };

  // Handle button click
  const handleButtonClick = async () => {
    console.log('Comment:', comment); // Logs the comment to the console
    setComment(''); // Clears the input after clicking
    const timestamp = new Date();

    const response = await fetch('/commentsOfPhoto/:'+photoId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment, timestamp }),
    });

    if (response.ok) {
      console.log("added comment successfully");
      const updatedCommentsJSON = await response.json();
      handleSetComments(updatedCommentsJSON);

    }

    else {
      console.log("failed to add comment");
      const error_message = await response.text();
      alert(error_message);
    }

  };

  useEffect( () => {
    axios.get("/user/list")
    .then((res) => {
      console.log(" User lists fetched from server\n", res.data);
      setUserList(res.data.map((x) => {
        return {
          id: x._id,
          display: x.first_name + ' ' + x.last_name,
        }
      }));
    })
    .catch((error) => {
      console.log(error);
    });
  }, []);

  return (
    <div>
      {/* <input
        type="text"
        placeholder="Add a comment..."
        value={comment}
        onChange={handleInputChange}
      /> */}
      <MentionsInput value={comment} onChange={handleInputChange} placeholder='Add a comment...'>
        <Mention trigger="@" data={userList}/>
      </MentionsInput>
      <button onClick={handleButtonClick}>Comment</button>
    </div>
  );
}

function Comment({ comment, photoId, handleCommentDelete }) {

  const [currentUser] = useContext(UserLoggedIn); 
  
  if (comment===null) {
    return "";
  }

  const handleDeleteClick = async () => {

    try {

      const response = await fetch(`/comments/${comment._id}`, {

        method: "DELETE",

      });



      if (response.ok) {

        handleCommentDelete(comment._id);

        console.log("Comment deleted successfully");

      } else {

        const error_message = await response.text();

        alert(`Failed to delete comment: ${error_message}`);

      }

    } catch (error) {

      console.error("Error deleting comment:", error);

    }

  };

  return (
    <>
      <ListItem>
        <div className="comment-container">
          <p>{comment.comment+"\n"}</p>
          <p className="text-align-right">
            <Link href={"#/users/:"+comment.user._id}>{comment.user.first_name + ' ' + comment.user.last_name}</Link>
            &nbsp;commented on&nbsp;
            {formatDateTime(comment.date_time)}
          </p>
          {currentUser._id === comment.user._id && (
          <button className="delete-button delete-comment-button" onClick={handleDeleteClick}><DeleteIcon /></button>
          )}
          </div>

      </ListItem>
      <Divider />
    </>
  );
}

function PhotoDescription({photo, handlePhotoDelete}) {


  const [currentUser] = useContext(UserLoggedIn); 

  // const comments = photo.comments;
  const [comments, setComments] = useState(photo.comments);

  function handleSetComments(data) {
    setComments(comments.concat([data]));
  }

  const handleCommentDelete = (commentId) => {

    setComments(comments.filter((comment) => comment._id !== commentId));

  };



  const handleDeletePhoto = async () => {

    try {

      const response = await fetch(`/photos/${photo._id}`, {

        method: "DELETE",

      });



      if (response.ok) {

        handlePhotoDelete(photo._id);

        console.log("Photo deleted successfully");

      } else {

        const error_message = await response.text();

        alert(`Failed to delete photo: ${error_message}`);

      }

    } catch (error) {

      console.error("Error deleting photo:", error);

    }

  };

  const checkEmptyComments = () => {

    if (comments.length > 0) {

      return comments.map((comment) => (

        <Comment

          key={comment._id}

          comment={comment}

          photoId={photo._id}

          handleCommentDelete={handleCommentDelete}

        />

      ));

    } else {

      return (

        <Typography className="no-comments" variant="h5">

          No comments

        </Typography>

      );

    }

  };


  return (
    <Paper className="photo-container">
      <div>
        <img
            key={photo._id}
            src={"../images/"+photo.file_name}
            alt={"photo of "+photo.user_id}
            height={250}
            width={300}/>
        <Typography variant="body1">
            Uploaded on {formatDateTime(photo.date_time)}
        </Typography>
        {currentUser._id === photo.user_id && (
        <button className="delete-button delete-photo-button" onClick={handleDeletePhoto}><DeleteIcon /></button>
      )}
      </div>
      <div className="photo-details">
        <List>
          {checkEmptyComments()}
        </List>
        <AddComment handleSetComments={handleSetComments} photoId={photo._id} />
      </div>
      <div>
        <Checkbox />
      </div>
    </Paper>
  );
}

function UserPhotos({userId, fetchPhoto,handleSetFetchPhoto}) {

  const [currentUser, ] = useContext(UserLoggedIn);
  const [photos, setPhotos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    
    if (Object.keys(currentUser).length==0) {
      navigate("/");
    }
  }, [currentUser]);

  useEffect( () => {
    axios.get("/photosOfUser/"+userId.slice(1))
    .then((res) => {
      console.log(`Photos of ${userId} fetched from server\n`, res.data);
      setPhotos(res.data);
      handleSetFetchPhoto(false);
    })
    .catch((error) => {
      console.log(error);
    });
  }, [userId, fetchPhoto]);

  const handlePhotoDelete = (photoId) => {

    setPhotos(photos.filter((photo) => photo._id !== photoId));

  };

  return (
    <div className="photo-disp">
      {photos.map((photo) => 
        <PhotoDescription 
          key={photo._id} 
          photo={photo} 
          handlePhotoDelete={handlePhotoDelete}/>)}
    </div>
  );
}

AddComment.propTypes = {
  handleSetComments: PropTypes.func.isRequired, // `handleSetComments` is a function and required
  photoId: PropTypes.string.isRequired, // `photoId` is a string and required
};

Comment.propTypes = {
  comment: PropTypes.any,
};

PhotoDescription.propTypes = {
  photo: PropTypes.any,
};

UserPhotos.propTypes = {
  userId: PropTypes.any,
  fetchPhoto: PropTypes.any,
  handleSetFetchPhoto: PropTypes.any,
};

export default UserPhotos;
