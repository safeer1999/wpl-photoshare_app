import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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

function MentionsThumbnails({ photoIds }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch photos from the server
    const fetchPhotos = async () => {
      try {
        const response = await axios.get('/photos/', {
          params: {photoIds},
        });

        setPhotos(response.data);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setError('Failed to load photos.');
      }
    };

    if (photoIds && photoIds.length > 0) {
      fetchPhotos();
    }
    else {
        setPhotos([]);
    }

  }, [photoIds]);


  return (
    <div>
      <h3>Mentions</h3>
      {error && <p className="error-message">{error}</p>}
      <div className="mentions-container">
        {photos.map((photo) => (
          <div key={photo._id} className="mention-thumbnail">
            <Link className='image-link' to={`/photos/:${photo.user_id}#${photo._id}`}>
                <img
                src={`/images/${photo.file_name}`}
                alt="Mentioned"
                />
            </Link>
            <UserLink userId={photo.user_id} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MentionsThumbnails;