import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  InputAdornment,
} from "@mui/material";
import { IoIosSearch } from "react-icons/io";
import usdtImage from "../../assets/USDT.png"; // Example token images
import ethImage from "../../assets/ETH.png";
import usdcImage from "../../assets/USDC.png";
import bnbImage from "../../assets/BNB.png";
import opImage from "../../assets/OPT.png";

const tokenData = [
  { name: "USDC", balance: "$0.00", icon: usdcImage },
  { name: "ETHEREUM", balance: "$0.00", icon: ethImage },
  { name: "BNB", balance: "$0.00", icon: bnbImage },
  { name: "OPTIMISM", balance: "$0.00", icon: opImage },
  { name: "USDT", balance: "$0.00", icon: usdtImage },
];

const CustomTokenDropdown = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTokens, setFilteredTokens] = useState(tokenData);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = tokenData.filter((token) =>
      token.name.toLowerCase().includes(query)
    );
    setFilteredTokens(filtered);
  };

  return (
    <Box
      sx={{
        width: "400px",
        backgroundColor: "rgba(0, 206, 229, 0.06)",
        borderRadius: "16px",
        padding: "1.5rem",
        border: "1px solid #FFFFFF4D",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Search Field */}
      <TextField
        placeholder="Token name or address"
        value={searchQuery}
        onChange={handleSearch}
        fullWidth
        variant="outlined"
        InputProps={{
          style: {
            backgroundColor: "#121212",
            color: "#FFFFFF",
            borderRadius: "8px",
          },
          startAdornment: (
            <InputAdornment position="start">
              <IoIosSearch />
            </InputAdornment>
          ),
        }}
        sx={{
          marginBottom: "1rem",
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#FFFFFF4D",
            },
            "&:hover fieldset": {
              borderColor: "#D3D3D3",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#D3D3D3",
            },
          },
        }}
      />

      {/* Token List */}
      <List sx={{ maxHeight: "300px", overflowY: "auto" }}>
        {filteredTokens.map((token, index) => (
          <ListItem
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: index % 2 === 0 ? "#121212" : "transparent",
              borderRadius: "8px",
              marginBottom: "0.5rem",
              "&:hover": {
                backgroundColor: "#1E1E1E",
              },
            }}
          >
            <ListItemAvatar>
              <Avatar
                src={token.icon}
                alt={token.name}
                sx={{ width: 40, height: 40 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography sx={{ color: "#FFFFFF", fontWeight: 600 }}>
                  {token.name}
                </Typography>
              }
              secondary={
                <Typography sx={{ color: "#AAAAAA", fontSize: "0.8rem" }}>
                  {token.balance}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default CustomTokenDropdown;
