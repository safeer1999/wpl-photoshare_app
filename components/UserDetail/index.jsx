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

function Mentions({ userIds }) {
  const [users, setUsers] = useState([]);

  // Fetch the user list when the component mounts
  useEffect(() => {
    axios
      .get('/user/list')
      .then((response) => {
        const allUsers = response.data;
        // Filter users based on the input userIds
        const filteredUsers = allUsers.filter((user) => userIds.includes(user._id));
        setUsers(filteredUsers);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
      });
  }, [userIds]);

  return (
    <div>
      <h2>User List</h2>
      <ul>
        {users.map((user) => (
          <li key={user._id}>
            <Link href={`#/users/:${user._id}`}>
              {user.first_name} {user.last_name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}



function UserDetail({userId}) {
  const [currentUser, ] = useContext(UserLoggedIn);
  const [user, setUser] = useState({});
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

          <Mentions userIds={user.mentions} />
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
    </>
  );
}

UserDetail.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserDetail;
