import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import { increaseLiquidity } from "../../services/increaseLiquidity";
import TransactionModal from "../../comman/TransactionModal";

const tokenLogos = {
  WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  "1INCH": "https://cryptologos.cc/logos/1inch-1inch-logo.png",
};

const AddLiquidity = () => {
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

  const [amount0Desired, setAmount0Desired] = useState("");
  const [amount1Desired, setAmount1Desired] = useState("");
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const handleAddLiquidity = async () => {
    setTransactionStatus("pending");
    setOpenModal(true);

    try {
      const deadline = Math.floor(Date.now() / 1000) + 600; // 10 min from now
      const txHash = await increaseLiquidity({
        tokenId: position.tokenId,
        token0: position.token0,
        token1: position.token1,
        amount0Desired,
        amount1Desired,
        amount0Min: "0",
        amount1Min: "0",
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
      mt={4}
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
        Add Liquidity
      </Typography>
      <Typography variant="body2" color="#a0aec0" mb={4}>
        Provide liquidity to the {position.token0Symbol} /{" "}
        {position.token1Symbol} pool.
      </Typography>

      {/* Token Input Section */}
      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            padding: "16px",
            borderRadius: "12px",
            backgroundColor: "#060d26",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Box display="flex" alignItems="center" gap="10px">
              <img
                src={tokenLogos[position.token0Symbol]}
                alt={position.token0Symbol}
                style={{ width: "24px", height: "24px" }}
              />
              <Typography variant="subtitle1" color="#a0aec0">
                Deposit {position.token0Symbol}
              </Typography>
            </Box>
            <Typography variant="caption" color="#6b7280">
              Balance: 0 Max
            </Typography>
          </Box>
          <TextField
            placeholder="0.0"
            type="number"
            value={amount0Desired}
            onChange={(e) => setAmount0Desired(e.target.value)}
            fullWidth
            sx={{
              input: {
                color: "white",
                fontWeight: "500",
              },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
              },
            }}
          />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            padding: "16px",
            borderRadius: "12px",
            backgroundColor: "#060d26",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Box display="flex" alignItems="center" gap="10px">
              <img
                src={tokenLogos[position.token1Symbol]}
                alt={position.token1Symbol}
                style={{ width: "24px", height: "24px" }}
              />
              <Typography variant="subtitle1" color="#a0aec0">
                Deposit {position.token1Symbol}
              </Typography>
            </Box>
            <Typography variant="caption" color="#6b7280">
              Balance: 0 Max
            </Typography>
          </Box>
          <TextField
            placeholder="0.0"
            type="number"
            value={amount1Desired}
            onChange={(e) => setAmount1Desired(e.target.value)}
            fullWidth
            sx={{
              input: {
                color: "white",
                fontWeight: "500",
              },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
              },
            }}
          />
        </Paper>

        {/* Preview Section */}
        <Paper
          elevation={0}
          sx={{
            padding: "16px",
            borderRadius: "12px",
            backgroundColor: "#060d26",
          }}
        >
          <Typography variant="subtitle2" color="#a0aec0" mb={1}>
            Pool Share Estimate
          </Typography>
          <Divider sx={{ borderColor: "#2d2f36", mb: 2 }} />
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" color="#a0aec0">
              {position.token0Symbol}
            </Typography>
            <Typography variant="body2" color="#f0f0f0">
              {amount0Desired || "0.0"}
            </Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={1}
          >
            <Typography variant="body2" color="#a0aec0">
              {position.token1Symbol}
            </Typography>
            <Typography variant="body2" color="#f0f0f0">
              {amount1Desired || "0.0"}
            </Typography>
          </Box>
        </Paper>

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          disabled={!amount0Desired || !amount1Desired}
          sx={{
            backgroundColor: "#4a90e2",
            padding: "14px",
            borderRadius: "8px",
            fontWeight: "bold",
            color: "white",
            "&:hover": {
              backgroundColor: "#357ABD",
            },
          }}
          onClick={handleAddLiquidity}
        >
          Add Liquidity
        </Button>
      </Stack>

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

export default AddLiquidity;
