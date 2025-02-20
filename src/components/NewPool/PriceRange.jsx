// PriceRange.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { MdEdit, MdZoomIn, MdZoomOut } from "react-icons/md";
import { IoMdAdd, IoMdRemove } from "react-icons/io";


const PriceRange = ({
  handleNext,
  handleBack,
  selectedToken1,
  selectedToken2,
  priceRange,
  setPriceRange,
}) => {
  const [rangeType, setRangeType] = useState("full");
  const [minPrice, setMinPrice] = useState(priceRange.lower); // Use default lower price from props
  const [maxPrice, setMaxPrice] = useState(priceRange.upper); // Use default upper price from props
  const [initialPrice, setInitialPrice] = useState("1"); // Set initial price to a sensible default
  const [selectedToggle, setSelectedToggle] = useState(selectedToken1?.symbol);

  const handleRangeChange = (event, newValue) => {
    setRangeType(newValue);
  };

  const handleToggle = (event, newValue) => {
    if (newValue !== null) {
      setSelectedToggle(newValue);
    }
  };

  const handleContinue = () => {
    // Update the price range in the parent component
    setPriceRange({ lower: minPrice, upper: maxPrice });
    handleNext();
  };

  return (
    <Box
      maxWidth="sm"
      sx={{
        backgroundColor: "transparent",
        borderRadius: "12px",
        p: 4,
        mx: "auto",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        border: "1px solid #33373a",
        height: "100%",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            component="img"
            src={selectedToken1?.logoURI}
            alt={selectedToken1?.name}
            sx={{ width: 24, height: 24 }}
          />
          <Typography variant="h6" fontWeight={600}>
            {selectedToken1?.symbol} / {selectedToken2?.symbol}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.2,
              borderRadius: 1,
              backgroundColor: "transparent",
              border: "1px solid gray",
            }}
          >
            v3 0.01%
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleBack}>
          <MdEdit color="white" />
        </IconButton>
      </Box>

      {/* Toggle Section */}
      <ToggleButtonGroup
        value={selectedToggle}
        exclusive
        onChange={handleToggle}
        sx={{
          mb: 3,
          borderRadius: 2,
          backgroundColor: "transparent",
          border: "1px solid gray",
          color: "white",

          "& .MuiToggleButton-root": {
            borderRadius: 2,
            fontWeight: 600,
            textTransform: "none",
            px: 2,
            py: 0.5,
            color: "white",

            "&.Mui-selected": {
              backgroundColor: "#D3D3D3",
              color: "white",
              "&:hover": { backgroundColor: "#e0e0e0" },
            },
          },
        }}
      >
        <ToggleButton value={selectedToken1?.symbol}>
          {selectedToken1?.symbol}
        </ToggleButton>
        <ToggleButton value={selectedToken2?.symbol}>
          {selectedToken2?.symbol}
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Initial Price Section */}
      <Typography variant="subtitle1" fontWeight={600} mb={1}>
        Initial price
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Set the starting exchange rate between the two tokens you are providing.
      </Typography>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TextField
          value={initialPrice}
          onChange={(e) => setInitialPrice(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: 1,
            backgroundColor: "transparent",
            border: "1px solid gray",
            width: "80%",
          }}
        />
        <Typography variant="body2" fontSize={10} color="text.secondary">
          {selectedToken2?.symbol} per {selectedToken1?.symbol}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Current price: 1 {selectedToken1?.symbol} = {initialPrice}{" "}
        {selectedToken2?.symbol} ($11.00)
      </Typography>

      {/* Set Price Range */}
      <Typography variant="subtitle1" fontWeight={600} mb={1}>
        Set price range
      </Typography>
      <Tabs
        value={rangeType}
        onChange={handleRangeChange}
        sx={{ mb: 2 }}
        TabIndicatorProps={{ sx: { display: "none" } }}
      >
        <Tab
          label="Full range"
          value="full"
          sx={{
            flex: 1,
            fontWeight: rangeType === "full" ? 600 : 400,
            textTransform: "none",
            borderRadius: 8,
            backgroundColor: rangeType === "full" ? "black" : "",
            color: rangeType === "full" ? "white" : "",
          }}
        />
        <Tab
          label="Custom range"
          value="custom"
          sx={{
            flex: 1,
            fontWeight: rangeType === "custom" ? 600 : 400,
            textTransform: "none",
            borderRadius: 8,
            backgroundColor: rangeType === "custom" ? "black" : "",
            color: rangeType === "custom" ? "white" : "",
          }}
        />
      </Tabs>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Providing full range liquidity ensures continuous market participation
        across all possible prices, offering simplicity but with potential for
        higher impermanent loss.
      </Typography>

      {/* Price Inputs */}
      <Box display="flex" justifyContent="space-between" gap={2} mt={1}>
        {/* Min Price */}
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Min price
          </Typography>
          <TextField
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            InputProps={{
              endAdornment: (
                <Typography
                  variant="caption"
                  fontSize={8}
                  color="text.secondary"
                >
                  {selectedToken2?.symbol} per {selectedToken1?.symbol}
                </Typography>
              ),
            }}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "transparent",
              border: "1px solid gray",
              borderRadius: 1,
            }}
          />
        </Box>

        {/* Max Price */}
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Max price
          </Typography>
          <TextField
            fullWidth
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            InputProps={{
              endAdornment: (
                <Typography
                  variant="caption"
                  fontSize={8}
                  color="text.secondary"
                >
                  {selectedToken2?.symbol} per {selectedToken1?.symbol}
                </Typography>
              ),
            }}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: "transparent",
              border: "1px solid gray",
              borderRadius: 1,
            }}
          />
        </Box>
      </Box>

      {/* Continue Button */}
      <Box mt={4}>
        <Button
          variant="contained"
          fullWidth
          sx={{
            bgcolor: "#D3D3D3",
            color: "#fff",
            py: 1.5,
            borderRadius:8,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#333",
            },
          }}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default PriceRange;
