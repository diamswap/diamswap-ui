import React from "react";
import {
  Box,
  Modal,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from "@mui/material";
import { IoMdClose } from "react-icons/io";


const CountrySelectorModal = ({ open, onClose, countries, onSelect }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#000",
          padding: "16px",
          borderRadius: "8px",
          width: "350px",
          maxHeight: "70vh",
          overflowY: "auto",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          position: "relative",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            borderBottom:"1px solid gray"
          }}
        >
          <Typography  sx={{ fontWeight: 600, fontSize:16 }}>
            Select your region
          </Typography>
          <IoMdClose style={{ cursor: "pointer" }} onClick={onClose} />
        </Box>
        <List>
          {countries.map((country) => (
            <ListItemButton
              key={country.name}
              onClick={() => {
                onSelect(country);
                onClose();
              }}
            >
              <ListItemAvatar>
                <Avatar src={country?.icon} style={{width:30, height:30}}/>
              </ListItemAvatar>
              <ListItemText primary={country.name} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Modal>
  );
};

export default CountrySelectorModal;
