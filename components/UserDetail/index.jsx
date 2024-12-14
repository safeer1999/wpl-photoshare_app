import axios from 'axios';
import React, {
  useState,
  useEffect,
  useContext } from "react";
import { useNavigate } from "react-router-dom";
  import { 
  Typography,
  Link,
  Divider
} from "@mui/material";
import PropTypes from 'prop-types';


import UserLoggedIn from '../../photoShare';
import "./styles.css";
import MentionsThumbnails from './mentionsThumbnail';


function UserDetail({userId}) {
  const [currentUser, ] = useContext(UserLoggedIn);
  const [user, setUser] = useState({});
  const [favoritesButton, setFavoritesButton] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (Object.keys(currentUser).length==0) {
      navigate("/");
    }
  }, [currentUser]);

  useEffect( () => {
    axios.get("/user/"+userId.slice(1))
    .then((res) => {
      console.log(`User details of ${userId} fetched from server\n`, res.data);
      setUser(res.data);
      console.log("why are the ids not matching?",userId, currentUser._id);
      if (userId.slice(1) === currentUser._id) {
        setFavoritesButton(
          <div>
            <Link 
              href="#/favourites/"
              variant='body1'
              underline="none"
              color="inherit"
              className="switch-to-photos-link" >
                Switch to Favorites
            </Link>
          </div>
        );
      }
      else {
        setFavoritesButton(null);
      }
    })
    .catch((error) => {
      console.log(error);
    });
  }, [userId]);

    return (
    <>
      <div>
          <Typography variant="body1">
            Name: {user.first_name + ' ' + user.last_name}
          </Typography>
          
          <Typography variant="body1">
            Location: {user.location}
          </Typography>
          
          <Typography variant="body1">
            Description: {user.description}
          </Typography>

          <Typography variant="body1">
          Occupation: {user.occupation}
          </Typography>

          <MentionsThumbnails photoIds={user.mentions} />
      </div>
      <Divider />
      <br />
      <div>
        <Link 
          href={"#/photos/:"+user._id}
          variant='body1'
          underline="none"
          color="inherit"
          className="switch-to-photos-link" >
            Switch to Photos
        </Link>
      </div>
      {favoritesButton}
    </>
  );
}

UserDetail.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserDetail;
