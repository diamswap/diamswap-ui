import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Slider,
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import TransactionModal from "../../comman/TransactionModal";
import { decreaseLiquidity } from "../../services/increaseLiquidity";

const tokenLogos = {
  WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  "1INCH": "https://cryptologos.cc/logos/1inch-1inch-logo.png",
};

const DecreaseLiquidity = () => {
  const location = useLocation();
  const position = location.state?.position;

  if (!position) {
    return (
      <Box textAlign="center" marginTop="20px">
        <Typography variant="h6" color="error">
          No position data available. Please navigate properly.
        </Typography>
      </Box>
    );
  }

  const [liquidityPercentage, setLiquidityPercentage] = useState(50); // Default 50%
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const handleDecreaseLiquidity = async () => {
    setTransactionStatus("pending");
    setOpenModal(true);

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600; // 10 min from now
      const liquidityToRemove = (position.liquidity * liquidityPercentage) / 100;

      const txHash = await decreaseLiquidity({
        tokenId: position.tokenId,
        liquidityToRemove: liquidityToRemove.toString(),
        amount0Min: "0", // Adjust if needed
        amount1Min: "0", // Adjust if needed
        deadline,
      });

      setTransactionStatus("success");
      setTransactionHash(txHash);
    } catch (error) {
      setTransactionStatus("error");
      console.error(error.message);
    }
  };

  return (
    <Box
      maxWidth="500px"
      margin="0 auto"
      padding="20px"
      sx={{
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
        border: "1px solid #2d2f36",
        textAlign: "center",
        color: "white",
      }}
    >
      {/* Header Section */}
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Decrease Liquidity
      </Typography>
      <Typography variant="body2" color="#a0aec0" mb={4}>
        Use the slider below to adjust the percentage of liquidity you want to remove from the {position.token0Symbol}/{position.token1Symbol} pool.
      </Typography>

      {/* Liquidity Adjustment Slider */}
      <Paper
        elevation={0}
        sx={{
          padding: "16px",
          borderRadius: "12px",
          backgroundColor: "#060d26",
        }}
      >
        <Typography variant="subtitle1" color="#a0aec0" mb={2}>
          Select Liquidity to Remove
        </Typography>
        <Slider
          value={liquidityPercentage}
          onChange={(e, value) => setLiquidityPercentage(value)}
          aria-label="Liquidity Percentage"
          valueLabelDisplay="auto"
          step={1}
          min={1}
          max={100}
          sx={{
            color: "#4a90e2",
          }}
        />
        <Typography variant="body2" color="#f0f0f0">
          {liquidityPercentage}% of your liquidity
        </Typography>
      </Paper>

      {/* Token Preview Section */}
      <Paper
        elevation={0}
        sx={{
          padding: "16px",
          borderRadius: "12px",
          backgroundColor: "#060d26",
          mt: 3,
        }}
      >
        <Typography variant="subtitle2" color="#a0aec0" mb={1}>
          Token Withdraw Estimate
        </Typography>
        <Divider sx={{ borderColor: "#2d2f36", mb: 2 }} />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap="8px">
            <img
              src={tokenLogos[position.token0Symbol]}
              alt={position.token0Symbol}
              style={{ width: "24px", height: "24px" }}
            />
            <Typography variant="body2" color="#a0aec0">
              {position.token0Symbol}
            </Typography>
          </Box>
          <Typography variant="body2" color="#f0f0f0">
            {((position.amount0 / 100) * liquidityPercentage).toFixed(4)}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Box display="flex" alignItems="center" gap="8px">
            <img
              src={tokenLogos[position.token1Symbol]}
              alt={position.token1Symbol}
              style={{ width: "24px", height: "24px" }}
            />
            <Typography variant="body2" color="#a0aec0">
              {position.token1Symbol}
            </Typography>
          </Box>
          <Typography variant="body2" color="#f0f0f0">
            {((position.amount1 / 100) * liquidityPercentage).toFixed(4)}
          </Typography>
        </Box>
      </Paper>

      {/* Action Button */}
      <Button
        variant="contained"
        fullWidth
        sx={{
          backgroundColor: "#e74c3c",
          padding: "14px",
          borderRadius: "8px",
          fontWeight: "bold",
          color: "white",
          mt: 3,
          "&:hover": {
            backgroundColor: "#c0392b",
          },
        }}
        onClick={handleDecreaseLiquidity}
      >
        Decrease Liquidity
      </Button>

      {/* Transaction Modal */}
      <TransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        status={transactionStatus}
        transactionHash={transactionHash}
      />
    </Box>
  );
};

export default DecreaseLiquidity;
