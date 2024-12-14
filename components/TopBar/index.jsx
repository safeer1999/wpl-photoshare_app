import axios from 'axios';
import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";

import UserLoggedIn from '../../photoShare';
import "./styles.css";

import PropTypes from 'prop-types';

function TopBar({handleSetFetchPhoto}) {

  const [currentUser, setCurrentUser] = useContext(UserLoggedIn);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [logoutButton, setLogoutButton] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const uploadInputRef = useRef(null);  // Added useRef for file input
  let navigate = useNavigate();

  async function handleLogout() {

    const response = await fetch('/admin/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      console.log(await response.text());
    }


    navigate("/");
    setCurrentUser({});
    setLogoutButton(null);
    setWelcomeMessage("");
  }

  async function handleDeleteUser() {

    if (!currentUser || !currentUser._id) {

      alert("No user logged in to delete.");

      return;

    }



    const confirmDelete = window.confirm(

      "Are you sure you want to delete your account? This action cannot be undone."

    );

    if (!confirmDelete) {

      return;

    }



    try {

      const response = await fetch(`/user/${currentUser._id}`, {

        method: 'DELETE',

      });



      if (response.ok) {

        alert("User account deleted successfully.");

        navigate("/");
        setCurrentUser({});
        setLogoutButton(null);
        setWelcomeMessage("");

      } else {

        const error_message = await response.text();

        alert(`Failed to delete user account: ${error_message}`);

      }

    } catch (error) {

      console.error("Error deleting user account:", error);

      alert("An error occurred while deleting the account.");

    }

  }

  const handleUploadButtonClicked = async (e) => {
    e.preventDefault();
    if (uploadInputRef.current.files.length > 0) {
      const domForm = new FormData();
      domForm.append('uploadedphoto', uploadInputRef.current.files[0]);

      try {
        const response = await axios.post('/photos/new', domForm);
        console.log(response);
        setUploadStatus("Photo uploaded successfully!");
        handleSetFetchPhoto(true);
      } catch (error) {
        console.log(`POST ERR: ${error}`);
        setUploadStatus("Failed to upload photo.");
      }
    }
  };


  useEffect(() => {
    if (Object.keys(currentUser).length!==0) {
      setWelcomeMessage("Hi " + currentUser.first_name);
      setLogoutButton(<button onClick={handleLogout}>Logout</button>);
    }

    else {
      setWelcomeMessage("Please Login");
    }

  }, [currentUser]);
  
  const [topbarDesc, setTopbarDesc] = useState("");
  const [version, setVersion] = useState("");

  const url = useLocation();
  const url_items = url.pathname.split('/');

  useEffect(() => {
    axios.get("/test/info")
      .then((res) => {
        console.log(res.data);
        setVersion(`Version: ${res.data.__v}`);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {

    async function getUser(id) {
      let userRecord = await axios.get('/user/'+id);
      return userRecord.data;
    }


    if (url_items.length>2) {
      var user_id = url_items[2].slice(1);
      getUser(user_id).then((res) => {
        var user = res;
        var name = user.first_name + ' ' + user.last_name;
        
        if (url_items[1]==="users") {
          setTopbarDesc(`Details of ${name}`);
        }
    
        if (url_items[1]==="photos") {
          setTopbarDesc(`Photos of ${name}`);
        }
      });

    }
  
    else {
      setTopbarDesc("Home");
    }
  }, [url_items]);
  

  return (
    <AppBar className="topbar-appBar" position="absolute">
      <Toolbar className="toolbar">
        <Typography variant="h5" color="inherit">
          {welcomeMessage}
        </Typography>
          <div className="topbar-rightpane">
            
            <Typography variant="h4" color="inherit" className="topbar-details">
                {version}
            </Typography>
            
            <Typography variant="h5" color="inherit" className="topbar-details">
              {topbarDesc}
            </Typography>

            {Object.keys(currentUser).length !== 0 && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  ref={uploadInputRef}
                  style={{ display: 'none' }}
                  id="upload-input"
                />
                <label htmlFor="upload-input">
                  <Button variant="contained" component="span" color="primary">
                    Add Photo
                  </Button>
                </label>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleUploadButtonClicked}
                >
                  Upload
                </Button>
                {uploadStatus && (
                  <Typography variant="body2" color="inherit">
                    {uploadStatus}
                  </Typography>
                )}
                <Button variant="contained" color="error" onClick={handleDeleteUser}>
                  Delete Account
                  </Button>
              </>
            )}
            {logoutButton}
          </div>
      </Toolbar>
    </AppBar>
  );
}

TopBar.propTypes = {
  handleSetFetchPhoto: PropTypes.any,
};

export default TopBar;
