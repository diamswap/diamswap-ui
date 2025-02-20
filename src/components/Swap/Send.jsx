import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Avatar,
  TextField,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import { IoIosArrowDown } from "react-icons/io";
import { metadata } from "../../metadata/tokens";
import TokenSelectorModal from "../../comman/TokenSelector";

const SendPage = ({ width }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [amount, setAmount] = useState(""); // Default empty amount
  const [recipient, setRecipient] = useState("");
  const [selectedToken, setSelectedToken] = useState(metadata?.tokens[0]);
  const [isTokenModalOpen, setTokenModalOpen] = useState(false);
  const handleAmountChange = (event) => {
    setAmount(event.target.value.replace(/[^0-9.]/g, ""));
  };

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
    setTokenModalOpen(false);
  };

  const handleRecipientChange = (event) => {
    setRecipient(event.target.value);
  };

  return (
    <Box
      sx={{
        width: width || (isMobile ? "100%" : "500px"),
        backgroundColor: "rgba(0, 206, 229, 0.06)",
        margin: "2rem auto",
        borderRadius: "16px",
        border: "1px solid #FFFFFF4D",
        padding: "2rem",
        color: "#FFFFFF",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        position: "relative",
      }}
    >
      {/* Title */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, marginBottom: "1rem", color: "#AAAAAA" }}
      >
        You're sending
      </Typography>

      {/* Amount Input */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          padding: "0 1rem",
        }}
      >
        <TextField
          placeholder="0"
          value={`$ ${amount}`}
          onChange={handleAmountChange}
          InputProps={{
            disableUnderline: true,
            style: {
              fontSize: "3rem",
              fontWeight: 700,
              color: "#FFFFFF",
              textAlign: "center",
            },
            endAdornment: (
              <InputAdornment position="end">
                <Typography
                  variant="h5"
                  sx={{ color: "#AAAAAA", fontWeight: 600 }}
                >
                  {selectedToken.symbol}
                </Typography>
              </InputAdornment>
            ),
          }}
          variant="standard"
          fullWidth
          sx={{
            "& .MuiInputBase-input": {
              textAlign: "center",
            },
          }}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          color: "#AAAAAA",
          marginBottom: "1rem",
        }}
      >
        Balance: {selectedToken?.symbol}
      </Typography>

      {/* Token Selector */}
      <Box
        onClick={() => setTokenModalOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          textTransform: "none",
          marginBottom: "1rem",
          borderColor: "#333",
          borderRadius: 2,
          color: "#FFFFFF",
          backgroundColor: "#000",
        }}
      >
        <Box display={"flex"}>
          <Avatar
            src={selectedToken.icon}
            sx={{ width: 24, height: 24, marginRight: "8px" }}
          />
          {selectedToken.symbol}
        </Box>
        <IoIosArrowDown />
      </Box>

      {/* Recipient Input */}
      <Typography sx={{ fontSize: 12, textAlign: "left" }}> To</Typography>
      <TextField
        placeholder="Wallet address or ENS name"
        fullWidth
        value={recipient}
        onChange={handleRecipientChange}
        variant="outlined"
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#000",
            color: "#FFFFFF",
            borderRadius: "12px",
          },
          marginBottom: "1rem",
        }}
        InputProps={{
          style: { color: "#FFFFFF" },
        }}
      />

      {/* Send Button */}
      <Button
        variant="contained"
        fullWidth
        sx={{
          backgroundColor: amount && recipient ? "#1976d2" : "#333",
          color: amount && recipient ? "#fff" : "#999",
          padding: "12px",
          borderRadius: 16,
          textTransform: "none",
          fontWeight: 600,
          "&:hover": {
            backgroundColor: amount && recipient ? "#115293" : "#333",
          },
        }}
        disabled={!amount || !recipient}
      >
        Send
      </Button>

      <TokenSelectorModal
        open={isTokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        tokens={metadata?.tokens}
        onSelectToken={handleTokenSelect}
      />
    </Box>
  );
};

export default SendPage;
