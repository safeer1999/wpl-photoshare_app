import React, { useState, useContext } from 'react';
import { useNavigate } from "react-router-dom";

import { Link, Typography } from "@mui/material";
import UserLoggedIn from '../../photoShare';
import './styles.css';



function LoginRegister() {
  const [currentUser, setCurrentUser] = useContext(UserLoggedIn);
  const [login_name, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage,setErrorMessage] = useState(null);

  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form from reloading the page

    // Create a POST request
    const response = await fetch('/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login_name, password }),
    });

    if (response.ok) {
      console.log('Login successful',currentUser);
      const data = await response.json();
      const user_id = data._id;
      navigate("/users/:"+user_id);

      setCurrentUser(data);
      setErrorMessage(null);

    } else {
      console.log('Login failed');
      setErrorMessage(<Typography>Incorrect username or password</Typography>);
      setLoginName('');
      setPassword('');
    }
  };

  return (
      <form className="form-container" onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={login_name}
            onChange={(e) => setLoginName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {errorMessage}
        <button type="submit">Login</button>
      <Link href="#/register">Click Here to Register</Link>
      </form>
  );
}

export default LoginRegister;
