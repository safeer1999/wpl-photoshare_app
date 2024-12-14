import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { Modal, Box, Typography, IconButton } from '@mui/material';
// import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

import UserLoggedIn from '../../photoShare';
import './styles.css';

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


const FavouritePhotos = () => {
  const [currentUser, ] = useContext(UserLoggedIn);

  const [open, setOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState({});
  const [photos, setPhotos] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (Object.keys(currentUser).length==0) {
      navigate("/");
    }
  }, [currentUser]);

  useEffect( () => {
    axios.get("/favoritePhotos/")
    .then((res) => {
      console.log(`Favorite photos of fetched from server\n`, res.data);
      setPhotos(res.data);
      // handleSetFetchPhoto(false);
    })
    .catch((error) => {
      console.log(error);
    });
  }, []);
  
  const handleOpen = (photo) => {
    setSelectedPhoto(photo);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPhoto({});
  };

  async function removeFavorites(photo_id) {
    try {
      const response = await axios.post(`/photoFavorites/${photo_id}`,{
        favorite: 0
      });
      console.log(`Photo ${photo_id} removed from favorites:`, response.data);
    } catch (error) {
      console.error(`Error while removing photo ${photo_id} from favorite:`, error);
    }

    axios.get("/favoritePhotos/")
    .then((res) => {
      console.log(`Favorite photos of fetched from server\n`, res.data);
      setPhotos(res.data);
    })
    .catch((error) => {
      console.log(error);
    });
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Favourite Photos
      </Typography>
      <div className="thumbnail-list">
        {photos.map((photo) => (
          <div className='thumbnail-container' key={photo._id}>
            <img
            src={`/images/${photo.file_name}`}
            alt="Mentioned"
            onClick={() => handleOpen(photo)}
            />
            <IconButton key={photo._id} className='favorite-delete-button' onClick={() => removeFavorites(photo._id)}>
              <DeleteIcon />
            </IconButton>
          </div>
        ))}
      </div>

      {/* Modal Component */}
      <Modal
        open={open}
        onClose={handleClose} // Close modal when clicking outside
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box className="modal-box">
          <div>
            <img
                key={selectedPhoto._id}
                src={"../images/"+selectedPhoto.file_name}
                alt={"photo of "+selectedPhoto.user_id}
                height={250}
                width={300}/>
            <Typography variant="body1">
                Uploaded on {formatDateTime(selectedPhoto.date_time)}
            </Typography>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default FavouritePhotos;
