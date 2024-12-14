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
Checkbox,
FormControlLabel,
} from "@mui/material";
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
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

function extractMentions(comment) {
  // Regular expression to match the template @[display](id)
  const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;

  // Array to store the extracted IDs
  const ids = [];

  // Replace function to modify the string and collect IDs
  const modifiedComment = comment.replace(mentionRegex, (match, id) => {
    ids.push(id); // Collect the ID
    return match.split('(')[0]; // Remove the `(id)` part
  });

  return [modifiedComment, ids];
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
    
    let [processedComment,mentionedIds] = extractMentions(comment);

    const response = await fetch('/commentsOfPhoto/:'+photoId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment:processedComment, timestamp:timestamp }),
    });

    
    const mention_reponse = await fetch('/mentionsOfPhoto/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({photo_id: photoId,user_ids: mentionedIds})
    });

    if (response.ok && mention_reponse.ok) {
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
        <Mention
          trigger="@"
          data={userList}
          // markup='@[__display__]'
        />
      </MentionsInput>
      <button onClick={handleButtonClick}>Comment</button>
    </div>
  );
}

function Comment({ comment }) {

  if (comment===null) {
    return "";
  }

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
        </div>

      </ListItem>
      <Divider />
    </>
  );
}

function PhotoDescription({photo, checkLoggedIn}) {

  // const comments = photo.comments;
  const [comments, setComments] = useState(photo.comments);
  const [markFavorite, setMarkFavorite] = useState(null);
  const [isFavorite, setIsFavorite] = useState(photo.favorite === 1);

  async function handleFavoriteToggle() {
    if (isFavorite) {return;}
    
    setIsFavorite(true);
      try {
        const response = await axios.post(`/photoFavorites/${photo._id}`,{
          favorite: 1
        });
        console.log('Photo marked as favorite:', response.data);
      } catch (error) {
        console.error('Error marking photo as favorite:', error);
      }
  };

  useEffect(() => {

    console.log("This is inside favorite button",isFavorite)
    
    if (checkLoggedIn) {
      setMarkFavorite(
        <div>
          {/* <FormControlLabel
            control={
              <Checkbox
                checked={isFavorite}
                onChange={handleFavoriteToggle}
                color="primary"
              />
            }
          /> */}
          <IconButton onClick={handleFavoriteToggle} >
            <FavoriteIcon color={isFavorite ? "error" : "primary"} />
          </IconButton>
        </div>
      )
    }
    else {
      setMarkFavorite(null);
    }
  }, [checkLoggedIn,isFavorite]);

  function handleSetComments(data) {
    setComments(comments.concat([data]));
  }

  function checkEmptyComments() {
    if (comments.length>0) {
      return comments.map((comment) => <Comment key={comment._id} comment={comment} />);
    }
    else {
      return (
          <Typography className="no-comments" variant="h5">
            No comments
          </Typography>
      );
    }
  }


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
      </div>
      <div className="photo-details">
        <List>
          {checkEmptyComments()}
        </List>
        <AddComment handleSetComments={handleSetComments} photoId={photo._id} />
      </div>
      {markFavorite}
    </Paper>
  );
}

function UserPhotos({userId, fetchPhoto,handleSetFetchPhoto}) {

  const [currentUser, ] = useContext(UserLoggedIn);
  const [photos, setPhotos] = useState([]);
  const [checkLoggedIn, setCheckLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    
    if (Object.keys(currentUser).length==0) {
      navigate("/");
    }
  }, [currentUser]);

  useEffect(() => {
    setCheckLoggedIn(userId.slice(1) === currentUser._id);
  }, [userId]);

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

  return (
    <div className="photo-disp">
      {photos.map((photo) => <PhotoDescription id={photo._id} key={photo._id} photo={photo} checkLoggedIn={checkLoggedIn} />)}
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
