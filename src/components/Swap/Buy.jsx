import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Avatar,
  Stack,
  TextField,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { IoIosArrowDown } from "react-icons/io";

import { metadata } from "../../metadata/tokens";
import TokenSelectorModal from "../../comman/TokenSelector";
import CountrySelectorModal from "../../comman/CountrySelectorModal";

const countries = [
  {
    code: "🇺🇸",
    name: "United States",
    icon: "https://flagcdn.com/w320/us.png",
  },
  { code: "🇮🇳", name: "India", icon: "https://flagcdn.com/w320/in.png" },
  {
    code: "🇬🇧",
    name: "United Kingdom",
    icon: "https://flagcdn.com/w320/gb.png",
  },
  { code: "🇦🇺", name: "Australia", icon: "https://flagcdn.com/w320/au.png" },
  { code: "🇨🇦", name: "Canada", icon: "https://flagcdn.com/w320/ca.png" },
  { code: "🇩🇪", name: "Germany", icon: "https://flagcdn.com/w320/de.png" },
  { code: "🇫🇷", name: "France", icon: "https://flagcdn.com/w320/fr.png" },
  { code: "🇯🇵", name: "Japan", icon: "https://flagcdn.com/w320/jp.png" },
  { code: "🇨🇳", name: "China", icon: "https://flagcdn.com/w320/cn.png" },
  { code: "🇧🇷", name: "Brazil", icon: "https://flagcdn.com/w320/br.png" },
  { code: "🇷🇺", name: "Russia", icon: "https://flagcdn.com/w320/ru.png" },
  { code: "🇿🇦", name: "South Africa", icon: "https://flagcdn.com/w320/za.png" },
  { code: "🇲🇽", name: "Mexico", icon: "https://flagcdn.com/w320/mx.png" },
  { code: "🇮🇹", name: "Italy", icon: "https://flagcdn.com/w320/it.png" },
  { code: "🇰🇷", name: "South Korea", icon: "https://flagcdn.com/w320/kr.png" },
  { code: "🇸🇦", name: "Saudi Arabia", icon: "https://flagcdn.com/w320/sa.png" },
  { code: "🇦🇷", name: "Argentina", icon: "https://flagcdn.com/w320/ar.png" },
  { code: "🇪🇸", name: "Spain", icon: "https://flagcdn.com/w320/es.png" },
  { code: "🇹🇷", name: "Turkey", icon: "https://flagcdn.com/w320/tr.png" },
  { code: "🇳🇬", name: "Nigeria", icon: "https://flagcdn.com/w320/ng.png" },
  { code: "🇮🇩", name: "Indonesia", icon: "https://flagcdn.com/w320/id.png" },
  { code: "🇵🇭", name: "Philippines", icon: "https://flagcdn.com/w320/ph.png" },
  { code: "🇹🇭", name: "Thailand", icon: "https://flagcdn.com/w320/th.png" },
  { code: "🇵🇰", name: "Pakistan", icon: "https://flagcdn.com/w320/pk.png" },
  { code: "🇻🇳", name: "Vietnam", icon: "https://flagcdn.com/w320/vn.png" },
  { code: "🇲🇾", name: "Malaysia", icon: "https://flagcdn.com/w320/my.png" },
  { code: "🇸🇬", name: "Singapore", icon: "https://flagcdn.com/w320/sg.png" },
  { code: "🇰🇪", name: "Kenya", icon: "https://flagcdn.com/w320/ke.png" },
  { code: "🇺🇬", name: "Uganda", icon: "https://flagcdn.com/w320/ug.png" },
  { code: "🇳🇿", name: "New Zealand", icon: "https://flagcdn.com/w320/nz.png" },
];

const BuyPage = ({ width }) => {
  const [amount, setAmount] = useState(0);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isTokenModalOpen, setTokenModalOpen] = useState(false);
  const [isCountryModalOpen, setCountryModalOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const quickAmounts = [100, 300, 1000];

  const handleAmountChange = (value) => setAmount(value);

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
    setTokenModalOpen(false);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setCountryModalOpen(false);
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
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <Typography sx={{ fontWeight: 600 }}>You're buying</Typography>
        <Button
          onClick={() => setCountryModalOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#000",
            borderRadius: 8,
          }}
        >
          <Avatar src={selectedCountry.icon} sx={{ width: 20, height: 20 }} />
          <IoIosArrowDown />
        </Button>
      </Box>

      {/* Amount */}
      <Typography
        variant="h2"
        sx={{
          fontWeight: 700,
          marginBottom: "1rem",
        }}
      >
        ${amount.toFixed(2)}
      </Typography>

      {/* Token Selector */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          onClick={() => setTokenModalOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            textTransform: "none",
            marginBottom: "1rem",
            cursor: "pointer",
            backgroundColor: "#000",
            borderRadius: 8,
          }}
        >
          {selectedToken ? (
            <>
              <Avatar
                src={selectedToken.icon}
                sx={{ width: 24, height: 24, marginRight: "8px" }}
              />
              {selectedToken.symbol}
            </>
          ) : (
            "Select token"
          )}
          <IoIosArrowDown />
        </Box>
      </Box>

      {/* Quick Amount Buttons */}
      <Stack direction="row" spacing={2} sx={{ marginBottom: "1rem" }}>
        {quickAmounts.map((value) => (
          <Button
            key={value}
            variant="contained"
            onClick={() => handleAmountChange(value)}
            sx={{
              backgroundColor: amount === value ? "#1976d2" : "black",
              color: "white",
              textTransform: "none",
              borderRadius: "20px",
              "&:hover": {
                backgroundColor: amount === value ? "#115293" : "gray",
              },
            }}
          >
            ${value}
          </Button>
        ))}
      </Stack>

      {/* Custom Amount Input */}
      <TextField
        placeholder="Enter an amount"
        fullWidth
        variant="outlined"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#000",
            color: "white",
          },
          marginBottom: "1rem",
        }}
      />

      {/* Continue Button */}
      <Button
        variant="contained"
        fullWidth
        disabled={!selectedToken || amount === 0}
        sx={{
          backgroundColor: selectedToken ? "#fff" : "#000",
          color: "white",
          padding: "12px",
          borderRadius: 16,
          textTransform: "none",
          fontWeight: 600,
        }}
        onClick={() => alert("Continue transaction")}
      >
        Continue
      </Button>

      {/* Modals */}
      <TokenSelectorModal
        open={isTokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        tokens={metadata?.tokens}
        onSelectToken={handleTokenSelect}
      />
      <CountrySelectorModal
        open={isCountryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        countries={countries}
        onSelect={handleCountrySelect}
      />
    </Box>
  );
};

export default BuyPage;
