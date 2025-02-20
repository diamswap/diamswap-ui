import React from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Divider,
  CircularProgress,
  Button,
  Grid,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import CollectFees from "../CollectFees";

// Helper function to get token logo
const getTokenLogo = (symbol) => {
  const logos = {
    WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    "1INCH": "https://cryptologos.cc/logos/1inch-1inch-logo.png",
    DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png",
    USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  };

  return logos[symbol] || "https://via.placeholder.com/32";
};

const PositionDetail = () => {
  const location = useLocation();
  const position = location.state?.position; // Access position data passed through state
  const navigate = useNavigate();

  // Loading state if position data isn't available
  if (!position) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleAddLiquidity = () => {
    if (position?.tokenId) {
      navigate(`/increase-liquidity/${position.tokenId}`, {
        state: { position },
      });
    } else {
      console.error("Position ID is not available.");
    }
  };

  const handleDecreaseLiquidity = () => {
    if (position?.tokenId) {
      navigate(`/decrease-liquidity/${position.tokenId}`, {
        state: { position },
      });
    } else {
      console.error("Position ID is not available.");
    }
  };

  return (
    <Box padding="40px" maxWidth="80%" margin="0 auto">
      <Box sx={{ display: "flex", justifyContent: "space-around" , mb:4, alignItems:"center", textAlign:"center"}}>
        <Typography fontSize={14} color="gray" >
          Your positions &gt; {position.token0Symbol} / {position.token1Symbol}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AiOutlinePlus size={18} />}
          color="primary"
          onClick={handleAddLiquidity}
          sx={{color:"white", textTransform:"none"}}
        >
          Add Liquidity
        </Button>

        <Button
          variant="contained"
          startIcon={<AiOutlineMinus size={18} />}
          color="primary"
          onClick={handleDecreaseLiquidity}
          sx={{color:"white", textTransform:"none"}}
        >
          Remove Liquidity
        </Button>
      </Box>



      <Grid container spacing={3}>
      <Grid item  xs={12} sm={6} md={6}>
  {/* Position Header */}
  <Box display="flex" alignItems="center" mb={4}>
        <img
          src={getTokenLogo(position.token0Symbol)}
          alt={position.token0Symbol}
          style={{ width: 40, height: 40, marginRight: 10 }}
        />
        <img
          src={getTokenLogo(position.token1Symbol)}
          alt={position.token1Symbol}
          style={{ width: 40, height: 40, marginRight: 10 }}
        />
        <Typography variant="h4" fontWeight="bold">
          {position.token0Symbol} / {position.token1Symbol}
        </Typography>
      </Box>

      {/* Current Position Value */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 5, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="subtitle1" color="gray">
            Current position value
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            ${position.value || "0.00"}
          </Typography>
        </Box>
        <Divider />

        {/* Pool Tokens Section */}
        <Box mt={3}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Your total pool tokens:
          </Typography>
          <Stack spacing={2}>
            {/* Token 0 */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <img
                  src={getTokenLogo(position.token0Symbol)}
                  alt={position.token0Symbol}
                  style={{ width: 32, height: 32 }}
                />
                <Typography>{position.token0Symbol}</Typography>
              </Stack>
              <Typography fontWeight="bold">
                {position.tokensOwed0 || "0.00"}
              </Typography>
            </Box>

            {/* Token 1 */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <img
                  src={getTokenLogo(position.token1Symbol)}
                  alt={position.token1Symbol}
                  style={{ width: 32, height: 32 }}
                />
                <Typography>{position.token1Symbol}</Typography>
              </Stack>
              <Typography fontWeight="bold">
                {position.tokensOwed1 || "0.00"}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      {/* Share of Pool */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 5, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Share of pool
        </Typography>
        <Typography variant="h6" fontWeight="bold" color="primary">
          {position.poolShare || "0.00"}%
        </Typography>
      </Paper>

      {/* Fee Earned */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 5 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Fees earned
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography>{position.token0Symbol}:</Typography>
          <Typography fontWeight="bold">
            {position.feesToken0 || "0.00"}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography>{position.token1Symbol}:</Typography>
          <Typography fontWeight="bold">
            {position.feesToken1 || "0.00"}
          </Typography>
        </Box>
      </Paper>
      </Grid>
      <Grid  item  xs={12} sm={6} md={6}>

        <CollectFees position={position}/>

      </Grid>
    </Grid>
  
    </Box>
  );
};

export default PositionDetail;
