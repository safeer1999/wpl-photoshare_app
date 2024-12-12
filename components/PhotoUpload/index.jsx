import axios from 'axios';
import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";

import UserLoggedIn from '../../photoShare';
import "./styles.css";

function TopBar() {
  const [currentUser, setCurrentUser] = useContext(UserLoggedIn);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [logoutButton, setLogoutButton] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const navigate = useNavigate();
  const uploadInputRef = useRef(null);  // Added useRef for file input

  async function handleLogout() {
    const response = await fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentUser }),
    });

    if (response.ok) {
      console.log(await response.text());
    }

    navigate("/");
    setCurrentUser({});
    setLogoutButton(null);
    setWelcomeMessage("");
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
      } catch (error) {
        console.log(`POST ERR: ${error}`);
        setUploadStatus("Failed to upload photo.");
      }
    }
  };

  useEffect(() => {
    if (Object.keys(currentUser).length !== 0) {
      setWelcomeMessage("Hi " + currentUser.first_name);
      setLogoutButton(<button onClick={handleLogout}>Logout</button>);
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
      let userRecord = await axios.get('/user/' + id);
      return userRecord.data;
    }

    if (url_items.length > 2) {
      const user_id = url_items[2].slice(1);
      getUser(user_id).then((res) => {
        const user = res;
        const name = user.first_name + ' ' + user.last_name;

        if (url_items[1] === "users") {
          setTopbarDesc(`Details of ${name}`);
        }

        if (url_items[1] === "photos") {
          setTopbarDesc(`Photos of ${name}`);
        }
      });
    } else {
      setTopbarDesc("Home");
    }
  }, [url_items]);

  return (
    <AppBar className="topbar-appBar" position="absolute">
      <Toolbar className="toolbar">
        <Typography variant="h5" color="inherit">
          Safeer Ahmed Varikodan
        </Typography>
        <div className="topbar-rightpane">
          <Typography variant="h5" color="inherit" className="topbar-details">
            {welcomeMessage}
          </Typography>
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
            </>
          )}
          {logoutButton}
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
