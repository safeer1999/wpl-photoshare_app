import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';

import PropTypes from 'prop-types';

function UserLink({ userId }) {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      // Fetch user details using the userId
      const fetchUser = async () => {
        try {
          const response = await axios.get(`/user/${userId}`);
          setUser(response.data);
        } catch (err) {
          console.error('Error fetching user details:', err);
          setError('Failed to load user details.');
        }
      };
  
      if (userId) {
        fetchUser();
      }
    }, [userId]);
  
    if (error) {
      return <p style={{ color: 'red' }}>{error}</p>;
    }
  
    if (!user) {
      return <p>Loading...</p>;
    }
  
    return (
      <Link to={`/users/:${userId}`}>
        {user.first_name} {user.last_name}
      </Link>
    );
  }

function MentionsThumbnails({ mentionIds }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [mentionsList, setMentionsList] = useState(null);

  useEffect(() => {
    // Function to fetch photos from the server
    const fetchPhotos = async () => {
      try {
        const response = await axios.get('/mentions/', {
          params: {mentionIds},
        });

        setPhotos(response.data);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setError('Failed to load photos.');
      }
    };

    if (mentionIds && mentionIds.length > 0) {
      fetchPhotos();
    }
    else {
        setPhotos([]);
    }

  }, [mentionIds]);

  useEffect(() => {

    if (photos.length===0) {
      setMentionsList(<Typography>No mentions yet!</Typography>);
    }
    else {
      setMentionsList(
        photos.map((photo) => (
          <div key={photo._id} className="mention-thumbnail">
            <Typography>
              Mentioned at:{' '}
              <UserLink userId={photo.user_id} />
              &apos;s photo:{' '}
              <Link className='image-link' to={`/photos/:${photo.user_id}#${photo._id}`}>
                  <img
                  src={`/images/${photo.file_name}`}
                  alt="Mentioned"
                  />
              </Link>
            </Typography>
          </div>
        ))
      );
    }
  },[photos]);


  return (
    <div className='mentions-overall'>
      <Typography className='mentions-heading' variant='h6'>Mentions</Typography>
      {error && <p className="error-message">{error}</p>}
      <div className="mentions-container">
        {mentionsList}
      </div>
    </div>
  );
}

UserLink.propTypes = {
  userId: PropTypes.string.isRequired, // userId must be a non-empty string and is required
};

MentionsThumbnails.propTypes = {
  mentionIds: PropTypes.arrayOf(PropTypes.string).isRequired, // photoIds must be an array of strings
};

MentionsThumbnails.defaultProps = {
  mentionIds: [], // Default empty array for photoIds if not provided
};

export default MentionsThumbnails;