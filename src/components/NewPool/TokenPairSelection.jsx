import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  IconButton,
} from "@mui/material";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const TokenPairSelection = ({
  handleNext,
  setSelectedToken1,
  setSelectedToken2,
}) => {
  const [token0Address, setToken0Address] = useState("");
  const [token1Address, setToken1Address] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFeeTier, setSelectedFeeTier] = useState("0.05%");

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const feeTiers = [
    {
      tier: "0.01%",
      description: "Best for very stable pairs.",
      tvl: "$7.0M TVL",
      select: "6.486%",
    },
    {
      tier: "0.05%",
      description: "Best for stable pairs.",
      tvl: "$30.5M TVL",
      select: "28.075%",
    },
    {
      tier: "0.3%",
      description: "Best for most pairs.",
      tvl: "$70.4M TVL",
      select: "64.813%",
    },
    {
      tier: "1%",
      description: "Best for exotic pairs.",
      tvl: "$680.9K TVL",
      select: "0.627%",
    },
  ];

  const handleContinue = () => {
    // Set token details in the parent component
    setSelectedToken1({ address: token0Address });
    setSelectedToken2({ address: token1Address });

    // Proceed to the next step
    handleNext();
  };

  return (
    <Box
      sx={{
        backgroundColor: "naviblue",
        borderRadius: "12px",
        p: 4,
        maxWidth: "600px",
        mx: "auto",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        border: "1px solid #33373a",
        height: "100%",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Enter Token Addresses
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Enter the token addresses you want to provide liquidity for. Ensure they
        are valid ERC-20 token addresses.
      </Typography>

      <TextField
        fullWidth
        placeholder="Enter valid Erc20 token address"
        variant="outlined"
        value={token0Address}
        onChange={(e) => setToken0Address(e.target.value)}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: "1px solid #33373a",
        }}
      />
      <TextField
        fullWidth
        placeholder="Enter valid Erc20 token address"
        variant="outlined"
        value={token1Address}
        onChange={(e) => setToken1Address(e.target.value)}
        sx={{
          mb: 4,
          border: "1px solid #33373a",
          borderRadius: 2,
        }}
      />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Fee tier
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The amount earned providing liquidity. Choose an amount that suits your
        risk tolerance and strategy.
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          border: "1px solid gray",
          borderRadius: 4,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle2">
            {selectedFeeTier} fee tier
          </Typography>
          <Typography variant="caption" color="text.secondary">
            The % you will earn in fees
          </Typography>
        </Box>
        <IconButton onClick={handleToggleExpand}>
          {isExpanded ? (
            <FiChevronUp color="white" />
          ) : (
            <FiChevronDown color="white" />
          )}
        </IconButton>
      </Box>

      {isExpanded && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {feeTiers.map((fee) => (
            <Grid item xs={6} key={fee.tier}>
              <Card
                sx={{
                  border:
                    selectedFeeTier === fee.tier
                      ? "2px solid #1976d2"
                      : "1px solid #E0E0E0",
                  borderRadius: "12px",
                  p: 2,
                  cursor: "pointer",
                  backgroundColor:
                    selectedFeeTier === fee.tier ? "#000" : "transparent",
                }}
                onClick={() => setSelectedFeeTier(fee.tier)}
              >
                <Typography variant="subtitle2">{fee.tier}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {fee.description}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  {fee.tvl}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fee.select} select
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Button
        variant="contained"
        fullWidth
        size="large"
        sx={{
          backgroundColor: token0Address && token1Address ? "#D3D3D3" : "black",
          color: "#fff",
          textTransform: "none",
          p: 1.5,
          borderRadius: 8,
          fontWeight: 600,
        }}
        onClick={handleContinue}
        disabled={!token0Address || !token1Address}
      >
        Continue
      </Button>
    </Box>
  );
};

export default TokenPairSelection;
