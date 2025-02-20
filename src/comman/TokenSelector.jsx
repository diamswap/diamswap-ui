import React, { useState, useEffect } from "react";
import {
  Box,
  Modal,
  Typography,
  Stack,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  InputAdornment,
  TextField,
} from "@mui/material";
import { FiX } from "react-icons/fi";
import { IoIosSearch } from "react-icons/io";

const TokenSelectorModal = ({ open, onClose, onSelectToken }) => {
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch token list from Uniswap API
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch("https://tokens.uniswap.org/");
        const data = await response.json();
        setTokens(data.tokens);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch tokens:", err);
        setError("Unable to fetch token list");
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          }}
        >
          <Typography sx={{ fontSize: 16, color: "white" }}>
            Select a token
          </Typography>
          <FiX
            size={20}
            style={{ color: "white", cursor: "pointer" }}
            onClick={onClose}
          />
        </Box>

        {loading && <Typography color="white">Loading tokens...</Typography>}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && (
          <Stack spacing={1}>
            <TextField
              placeholder="Token name or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IoIosSearch style={{ color: "gray" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiInputBase-root": {
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                },
              }}
            />
            <List>
              {filteredTokens.map((token) => (
                <ListItemButton
                  key={token.address}
                  onClick={() => {
                    onSelectToken(token);
                    onClose();
                  }}
                  sx={{
                    borderRadius: "12px",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "white" }}>
                    <Avatar src={token.logoURI} sx={{ width: 29, height: 29 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={token.symbol}
                    secondary={token.name}
                    primaryTypographyProps={{ color: "white", fontSize: 14 }}
                    secondaryTypographyProps={{ color: "gray", fontSize: 12 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Stack>
        )}
      </Box>
    </Modal>
  );
};

export default TokenSelectorModal;
