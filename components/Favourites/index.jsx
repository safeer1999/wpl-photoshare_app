import React, { useState, useEffect } from 'react';
import { Modal, Box, Button, Typography } from '@mui/material';
import './styles.css';

const FavouritePhotos = ({fetchPhoto,handleSetFetchPhoto}) => {
  const [open, setOpen] = useState(false);
  const [selectedButton, setSelectedButton] = useState(null);
  const [photos, setPhotos] = useState([]);

  useEffect( () => {
    axios.get("/favoritePhotos/")
    .then((res) => {
      console.log(`Favorite photos of fetched from server\n`, res.data);
      setPhotos(res.data);
      handleSetFetchPhoto(false);
    })
    .catch((error) => {
      console.log(error);
    });
  }, [fetchPhoto]);
  
  const handleOpen = (buttonIndex) => {
    setSelectedButton(buttonIndex);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedButton(null);
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Favourite Photos
      </Typography>
      <div className="thumbnail-container">
        {[1, 2, 3, 4].map((num) => (
          <Button
            key={num}
            variant="contained"
            color="primary"
            className="favourite-button"
            onClick={() => handleOpen(num)}
          >
            Photo {num}
          </Button>
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
          <Typography id="modal-title" variant="h6" component="h2">
            Favourite Photo {selectedButton}
          </Typography>
          <Typography id="modal-description" sx={{ mt: 2 }}>
            Details about Favourite Photo {selectedButton}.
          </Typography>
        </Box>
      </Modal>
    </div>
  );
};

export default FavouritePhotos;
