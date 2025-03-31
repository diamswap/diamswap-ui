import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import swap from "../../assets/swap.png";
import { VscSettings } from "react-icons/vsc";
import { CiClock2 } from "react-icons/ci";
import { IoIosArrowDown } from "react-icons/io";
import { useTheme } from "@emotion/react";
import { metadata } from "../../metadata/tokens";
import TokenSelectorModal from "../../comman/TokenSelector";
import CustomButton from "../../comman/CustomButton";

// Styled IconButton component to replace MUI's IconButton
const IconButton = styled("button")({
  background: "none",
  border: "none",
  padding: "8px",
  borderRadius: "50%",
  cursor: "pointer",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});

// Styled components
const DarkCard = styled("div")({
  background: "#000",
  borderRadius: "16px",
  color: "white",
  padding: "24px",
  width: "100%",
  maxWidth: "480px",
});

const ActionCard = styled("div")({
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: "12px",
  color: "white",
  padding: "25px",
  cursor: "pointer",
  "&:hover": {
    background: "rgba(255, 255, 255, 0.1)",
  },
});

const TokenButton = styled(Button)({
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  color: "white",
  padding: "8px 20px",
  borderRadius: "20px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});

const SwapInput = styled(TextField)({
  "& .MuiInputBase-input": {
    color: "white",
    fontSize: "22px",
    padding: "12px 0",
  },
  "& .MuiInput-underline:before": {
    borderBottomColor: "rgba(0, 206, 229, 0.06)",
  },
  "& .MuiInput-underline:hover:before": {
    borderBottomColor: "rgba(0, 206, 229, 0.06)",
  },
});

const TokenSearchInput = styled(TextField)({
  "& .MuiInputBase-root": {
    color: "white",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "28px",
    padding: "0px 16px",
    fontSize: 12,
  },
});

export default function SwapInterface() {
  const [isTokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectedPayToken, setSelectedPayToken] = useState(metadata.tokens[0]); 
  const [selectedReceiveToken, setSelectedReceiveToken] = useState(
    metadata.tokens[1]
  ); // Default token for receiving
  const [payAmount, setPayAmount] = useState("0");
  const [receiveAmount, setReceiveAmount] = useState("0");
  const [activeInput, setActiveInput] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTokens, setFilteredTokens] = useState(metadata.tokens);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleTokenSelect = (token) => {
    if (activeInput === "pay") {
      if (token.symbol === selectedReceiveToken.symbol) {
        setSelectedPayToken(selectedReceiveToken);
        setSelectedReceiveToken(selectedPayToken);
      } else {
        setSelectedPayToken(token);
      }
    } else {
      if (token.symbol === selectedPayToken.symbol) {
        setSelectedPayToken(selectedReceiveToken);
        setSelectedReceiveToken(selectedPayToken);
      } else {
        setSelectedReceiveToken(token);
      }
    }
    setTokenModalOpen(false);
    setSearchQuery(""); // Reset search when modal closes
  };

  useEffect(() => {
    const filtered = metadata.tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTokens(filtered);
  }, [searchQuery]);

  const handleSwapTokens = () => {
    setSelectedPayToken(selectedReceiveToken);
    setSelectedReceiveToken(selectedPayToken);
    setPayAmount(receiveAmount);
    setReceiveAmount(payAmount);
  };

  const getExchangeRate = () => {
    if (Number(payAmount) === 0) return "";
    return `1 ${selectedPayToken.symbol} = ${(
      Number(receiveAmount) / Number(payAmount)
    ).toFixed(4)} ${selectedReceiveToken.symbol}`;
  };

  return (
    <Box>
      <Box
        sx={{
          width: isMobile ? "100%" : "500px",
          backgroundColor: "transparent",
          margin: "2rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Typography variant="caption" sx={{ color: "gray" }}>
              Available Balance: {selectedPayToken.balance || 0}{" "}
              <span style={{ color: "#fff" }}>MAX</span>
            </Typography>
          </Box>

          <Box sx={{ position: "relative" }}>
            {/* Pay Section */}
            <Typography sx={{ color: "gray", textAlign: "left" }}>
              Pay
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <SwapInput
                variant="standard"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                fullWidth
              />
              <TokenButton
                onClick={() => {
                  setActiveInput("pay");
                  setTokenModalOpen(true);
                }}
                endIcon={<IoIosArrowDown />}
              >
                <Box sx={{ mr: 1 }}>
                  <Avatar
                    src={selectedPayToken.icon}
                    sx={{ width: 24, height: 24 }}
                  />
                </Box>
                {selectedPayToken.symbol}
              </TokenButton>
            </Box>

            {/* Swap Icon Button */}
            <Box
              sx={{
                position: "absolute",
                top: "60%",
                left: "40%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                cursor: "pointer",
              }}
            >
              <IconButton onClick={handleSwapTokens}>
                <img src={swap} style={{ height: "2.5rem" }} alt="Swap" />
              </IconButton>
            </Box>

            {/* Receive Section */}
            <Typography sx={{ color: "gray", textAlign: "left" }}>
              Receive
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <SwapInput
                variant="standard"
                value={receiveAmount}
                onChange={(e) => setReceiveAmount(e.target.value)}
                fullWidth
              />
              <TokenButton
                onClick={() => {
                  setActiveInput("receive");
                  setTokenModalOpen(true);
                }}
                endIcon={<IoIosArrowDown />}
              >
                <Box sx={{ mr: 1 }}>
                  <Avatar
                    src={selectedReceiveToken.icon}
                    sx={{ width: 24, height: 24 }}
                  />
                </Box>
                {selectedReceiveToken.symbol}
              </TokenButton>
            </Box>
          </Box>

          <Typography
            variant="caption"
            sx={{ color: "gray", textAlign: "left" }}
          >
            {getExchangeRate()}
          </Typography>

          <CustomButton>Swap</CustomButton>
        </Stack>

        <TokenSelectorModal
          open={isTokenModalOpen}
          onClose={() => setTokenModalOpen(false)}
          tokens={filteredTokens}
          onSelectToken={handleTokenSelect}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Box>
    </Box>
  );
}
