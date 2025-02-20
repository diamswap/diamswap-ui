// DepositTokens.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
} from "@mui/material";
import { FaEthereum } from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { MdEdit } from "react-icons/md";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useAccount } from "wagmi";

const data = [
  { value: 4000 },
  { value: 3800 },
  { value: 4200 },
  { value: 3900 },
  { value: 3700 },
  { value: 3873.79 },
];

const DepositTokens = ({
  handleNext,
  selectedToken1,
  selectedToken2,
  amounts,
  setAmounts,
  handleSubmit
}) => {
  const [ethAmount, setEthAmount] = useState(amounts.token1);
  const [usdtAmount, setUsdtAmount] = useState(amounts.token2);
  const { isConnected } = useAccount();




  const handleProceed = async () => {
    try {
      console.log("Starting handleProceed...");
      await handleSubmit();
    } catch (error) {
      console.error("Error during handleProceed:", error.message, error.stack);
    }
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
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            component="img"
            src={selectedToken1?.logoURI}
            alt={selectedToken1?.name}
            sx={{ width: 24, height: 24 }}
          />
          <Typography variant="h6">
            {selectedToken1?.symbol} / {selectedToken2?.symbol}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            v3
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            0.05%
          </Typography>
        </Box>
        <Button startIcon={<MdEdit />} size="small">
          Edit
        </Button>
      </Box>

      {/* Chart Section */}
      {/* <Box sx={{ height: 100, mb: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4CAF50"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box> */}

      {/* Price Range */}
      {/* <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Min
          </Typography>
          <Typography>
            3,873.79 {selectedToken1?.symbol} / {selectedToken2?.symbol}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Max
          </Typography>
          <Typography>
            ∞ {selectedToken1?.symbol} / {selectedToken2?.symbol}
          </Typography>
        </Box>
        <Button startIcon={<MdEdit />} size="small">
          Edit
        </Button>
      </Box> */}

      {/* Deposit Form */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Deposit tokens
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Specify the token amounts for your liquidity contribution.
      </Typography>

      {/* ETH Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          // InputProps={{
          //   startAdornment: (
          //     <Box sx={{ mr: 1 }}>
          //       {/* <Avatar
          //         src={selectedToken1?.logoURI}
          //         sx={{ width: 20, height: 20 }}
          //       /> */}
          //       Token0
          //     </Box>
          //   ),
          //   endAdornment: (
          //     <Typography variant="body2" color="text.secondary">
          //       {selectedToken1?.symbol}
          //     </Typography>
          //   ),
          // }}
          sx={{ mb: 1 , border:"1px solid gray", borderRadius:2}}
       
        />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            ${(parseFloat(ethAmount) * 0.00).toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            0 {selectedToken1?.symbol}Max
          </Typography>
        </Box>
      </Box>

      {/* USDT Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          value={usdtAmount}
          placeholder="Enter Amount"
          onChange={(e) => setUsdtAmount(e.target.value)}
          // InputProps={{
          //   startAdornment: (
          //     <Box sx={{ mr: 1 }}>
          //       {/* <Avatar
          //         src={selectedToken2?.logoURI}
          //         sx={{ width: 20, height: 20 }}
          //       /> */}
          //       Token1
          //     </Box>
          //   ),
          //   endAdornment: (
          //     <Typography variant="body2" color="text.secondary">
          //       {selectedToken2?.symbol}
          //     </Typography>
          //   ),
          // }}
          sx={{ mb: 1 , border:"1px solid gray", borderRadius:2}}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            ${usdtAmount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            0 {selectedToken2?.symbol} Max
          </Typography>
        </Box>
      </Box>

      {/* Submit Button */}
      <Button
        fullWidth
        variant="contained"
        onClick={handleProceed}
        sx={{
          bgcolor: isConnected ? "#D3D3D3" : "black",
          color: "#fff",
          py: 1.5,
          textTransform: "none",
          borderRadius:8,
          "&:hover": { bgcolor: isConnected ? "#333" : "#fba3ff" },
        }}
      >
        {isConnected ? "Enter an amount" : "Connect Wallet"}
      </Button>
    </Box>
  );
};

export default DepositTokens;
