import React, {
  createContext,
  useState } from "react";
import ReactDOM from "react-dom/client";
import { Grid, Paper } from "@mui/material";
import { HashRouter, Route, Routes, useParams } from "react-router-dom";

import "./styles/main.css";
import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";
import RegisterForm from "./components/LoginRegister/register";
import FavouritePhotos from "./components/Favourites";

import PropTypes from 'prop-types';

const UserLoggedIn = createContext(null);


function UserDetailRoute() {
  const {userId} = useParams();
  console.log("UserDetailRoute: userId is:", userId);
  return <UserDetail userId={userId} />;
}


function UserPhotosRoute({fetchPhoto,handleSetFetchPhoto}) {
  const {userId} = useParams();
  return <UserPhotos userId={userId} fetchPhoto={fetchPhoto} handleSetFetchPhoto={handleSetFetchPhoto} />;
}



function PhotoShare() {

  const [user, setUser] = useState({});
  const [fetchPhoto, setFetchPhoto] = useState(false);

  function handleSetFetchPhoto(status) {
    setFetchPhoto(status);
  }

  return (
    <HashRouter>
      <UserLoggedIn.Provider value={[user, setUser]}>
        <div>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TopBar handleSetFetchPhoto={handleSetFetchPhoto} />
          </Grid>
          <div className="main-topbar-buffer" />
          <Grid item sm={3}>
            <Paper className="main-grid-item">
              <UserList />
            </Paper>
          </Grid>
          <Grid item sm={9}>
            <Paper className="main-grid-item">
                <Routes>
                  <Route
                    path="/"
                    element={(
                      <LoginRegister />
                    )}
                  />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/users/:userId" element={<UserDetailRoute />} />
                  <Route path="/photos/:userId" element={<UserPhotosRoute fetchPhoto={fetchPhoto} />} />
                  <Route path="/users" element={<UserList />} />
                  <Route path="/favourites" element={<FavouritePhotos />} />
                </Routes>    
            </Paper>
          </Grid>
        </Grid>
        </div> 
      </UserLoggedIn.Provider>
    </HashRouter>
  );
}


const root = ReactDOM.createRoot(document.getElementById("photoshareapp"));
root.render(<PhotoShare />);

UserPhotosRoute.propTypes = {
  fetchPhoto: PropTypes.any,
  handleSetFetchPhoto: PropTypes.any,
};

export default UserLoggedIn;