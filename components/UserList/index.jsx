import axios from 'axios';
import React, { useState, useEffect, useContext } from "react";
import PropTypes from 'prop-types';

import {
  Divider,
  List,
  ListItem,
  Typography,
  Link
} from "@mui/material";


import UserLoggedIn from '../../photoShare';
import "./styles.css";

function UserListItem({user}) {
  return (
    <>
      <ListItem>
        <Link 
          href={"#/users/:"+user._id}
          variant='body1'
          underline="none"
          color="inherit"
          className="user-details-link" >
            {user.first_name + ' ' + user.last_name}
        </Link>
      </ListItem>
      <Divider />
    </>
  );
}


function UserList() {

  const [currentUser,] = useContext(UserLoggedIn);
  const [userList, setUserList] = useState([]);
  const [disp, setDisp] = useState(
    <Typography>Please login to view User List</Typography>
  );

  useEffect(() => {

    console.log("check how many times this effect is called",currentUser);
    if (Object.keys(currentUser).length!==0) {
      setDisp(
        <List component="nav">
        {userList.map((user) => <UserListItem key={user.id} user={user} />)}
        </List>
      );
    }

    else {
      setDisp(
        <Typography>Please login to view User List</Typography>
      );
    }

  }, [currentUser,userList]);

  useEffect( () => {
    axios.get("/user/list")
    .then((res) => {
      console.log(" User lists fetched from server\n", res.data);
      setUserList(res.data);
    })
    .catch((error) => {
      console.log(error);
    });
  }, [currentUser]);


  return (
    <div>
      <Typography variant="h5">
        User List
      </Typography>
      <Divider />
      <Divider />
      {disp}
    </div>
  );
}


UserListItem.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    // Add other properties of `user` here if needed, e.g.,
    // name: PropTypes.string,
    // email: PropTypes.string,
  }).isRequired,
};

export default UserList;
