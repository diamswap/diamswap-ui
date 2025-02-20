import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { IoIosArrowDown } from "react-icons/io";
import { AiOutlineArrowDown } from "react-icons/ai";
import TokenSelectorModal from "../../comman/TokenSelector";
import { metadata } from "../../metadata/tokens";

const LimitPage = ({width}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [marketValue, setMarketValue] = useState(0.64904); // Default Market Value
  const [priceAdjustment, setPriceAdjustment] = useState("Market");
  const [limitPrice, setLimitPrice] = useState(marketValue);
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(true);

  const [selectedSellToken, setSelectedSellToken] = useState(metadata.tokens[0]);
  const [selectedBuyToken, setSelectedBuyToken] = useState(metadata.tokens[1]);
  const [isTokenModalOpen, setTokenModalOpen] = useState(false);
  const [currentTokenSelection, setCurrentTokenSelection] = useState("");

  const handlePriceChange = (value) => {
    setLimitPrice(value);
    updateBuyAmount(value, sellAmount);
  };

  const handleSellChange = (value) => {
    setSellAmount(value);
    updateBuyAmount(limitPrice, value);
  };

  const updateBuyAmount = (price, sell) => {
    if (price && sell) {
      setBuyAmount((parseFloat(sell) * parseFloat(price)).toFixed(5));
      setIsConfirmDisabled(false);
    } else {
      setBuyAmount("");
      setIsConfirmDisabled(true);
    }
  };

  const handlePriceAdjustment = (adjustment) => {
    let adjustedPrice = marketValue;

    switch (adjustment) {
      case "Market":
        adjustedPrice = marketValue;
        break;
      case "+1%":
        adjustedPrice = marketValue * 1.01;
        break;
      case "+5%":
        adjustedPrice = marketValue * 1.05;
        break;
      case "+10%":
        adjustedPrice = marketValue * 1.10;
        break;
      default:
        break;
    }

    setPriceAdjustment(adjustment);
    setLimitPrice(adjustedPrice.toFixed(5)); // Update Limit Price
  };

  const handleTokenSelect = (token) => {
    if (currentTokenSelection === "sell") {
      setSelectedSellToken(token);
    } else {
      setSelectedBuyToken(token);
    }
    setTokenModalOpen(false);
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
      {/* Limit Price Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem",
          borderRadius: "12px",
          backgroundColor: "#000",
          marginBottom: "1rem",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: "14px",
              marginBottom: "0.25rem",
            }}
          >
            When 1{" "}
            <Avatar
              src={selectedSellToken.icon}
              sx={{
                width: 18,
                height: 18,
                display: "inline-block",
                verticalAlign: "middle",
                margin: "0 5px",
              }}
            />{" "}
            {selectedSellToken.symbol} is worth
          </Typography>
          <TextField
            placeholder="0.00"
            value={limitPrice}
            onChange={(e) => handlePriceChange(e.target.value)}
            sx={{
              "& .MuiInputBase-input": {
                fontWeight: 600,
                fontSize: "20px",
              },
              border: "none",
            }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
            }}
          />
        </Box>
        <Box>
          <Avatar
            src={selectedBuyToken.icon}
            sx={{ width: 24, height: 24 }}
          />
        </Box>
      </Box>

      {/* Price Adjustment Buttons */}
      <Box
        sx={{
          display: "flex",
          gap: "8px",
          marginBottom: "1.5rem",
        }}
      >
        {["Market", "+1%", "+5%", "+10%"].map((value) => (
          <Button
            key={value}
            onClick={() => handlePriceAdjustment(value)}
            sx={{
              backgroundColor:
                priceAdjustment === value ? "#fff" : "#000",
              color: priceAdjustment === value ? "#000" : "#6B7280",
              fontSize: "10px",
              borderRadius: 12,
              textTransform: "none",
            }}
          >
            {value}
          </Button>
        ))}
      </Box>

      {/* Sell and Buy Inputs */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Sell */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
          }}
        >
          <TextField
            placeholder="Sell"
            value={sellAmount}
            onChange={(e) => handleSellChange(e.target.value)}
            variant="standard"
            sx={{
              "& .MuiInputBase-input": {
                fontWeight: 600,
                fontSize: "18px",
              },
              flex: 1,
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />
          <Button
            onClick={() => {
              setCurrentTokenSelection("sell");
              setTokenModalOpen(true);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textTransform: "none",
              fontSize: "14px",
            }}
          >
            <Avatar
              src={selectedSellToken.icon}
              sx={{ width: 18, height: 18 }}
            />
            {selectedSellToken.symbol} <IoIosArrowDown />
          </Button>
        </Box>

        <Box sx={{ textAlign: "center", color: "#9CA3AF" }}>
          <AiOutlineArrowDown size={24} />
        </Box>

        {/* Buy */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
          }}
        >
          <TextField
            placeholder="Buy"
            value={buyAmount}
            variant="standard"
            sx={{
              "& .MuiInputBase-input": {
                fontWeight: 600,
                fontSize: "18px",
              },
              flex: 1,
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />
          <Button
            onClick={() => {
              setCurrentTokenSelection("buy");
              setTokenModalOpen(true);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textTransform: "none",
              fontSize: "14px",
            }}
          >
            <Avatar
              src={selectedBuyToken.icon}
              sx={{ width: 18, height: 18 }}
            />
            {selectedBuyToken.symbol} <IoIosArrowDown />
          </Button>
        </Box>
      </Box>

      {/* Confirm Button */}
      <Button
        variant="contained"
        fullWidth
        disabled={isConfirmDisabled}
        sx={{
          backgroundColor: isConfirmDisabled ? "#E5E7EB" : "#3B82F6",
          color: isConfirmDisabled ? "#9CA3AF" : "#fff",
          fontWeight: 600,
          borderRadius: "12px",
          padding: "12px",
          textTransform: "none",
          "&:hover": {
            backgroundColor: isConfirmDisabled ? "#E5E7EB" : "#2563EB",
          },
        }}
      >
        Confirm
      </Button>

      {/* Disclaimer */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "1rem",
        }}
      >
        <Typography
          variant="body2"
          sx={{ marginLeft: "8px", fontSize: "12px", textAlign: "center" }}
        >
          Limits may not execute exactly when tokens reach the specified price.{" "}
          <a href="#" style={{ color: "#3B82F6" }}>
            Learn more
          </a>
        </Typography>
      </Box>

      {/* Token Selector Modal */}
      <TokenSelectorModal
        open={isTokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        tokens={metadata?.tokens}
        onSelectToken={handleTokenSelect}
      />
    </Box>
  );
};

export default LimitPage;
