import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Menu,
  MenuItem,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { IoIosArrowDown } from "react-icons/io";
import { BsPlus, BsThreeDotsVertical } from "react-icons/bs";
import { FaFilter, FaSlidersH } from "react-icons/fa";
import { useAccount } from "wagmi"; // For wallet connection
import { getAllPositions } from "../../services/createPosition";
import { useNavigate } from "react-router-dom";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Status");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        const data = await getAllPositions(address); // Fetch positions
        setPositions(data);
      } catch (error) {
        console.error("Error fetching positions:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchPositions();
    }
  }, [address]);

  const handleCardClick = (position) => {
    navigate(`/position/${position.tokenId}`, { state: { position } });
  };




  const handleNewPosition = () => {
    navigate( "/pools/positions/create");
  };
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
        <Typography variant="h6" mt={2}>
          Loading positions...
        </Typography>
      </Box>
    );
  }

  if (!positions || positions.length === 0) {
    return <Typography>No positions found.</Typography>;
  }

  const topPools = [
    { pair: "WBTC / ETH", apr: "2.61% APR", fee: "0.3%" },
    { pair: "USDC / ETH", apr: "51.81% APR", fee: "0.05%" },
    { pair: "WBTC / ETH", apr: "12.75% APR", fee: "0.05%" },
    { pair: "ETH / USDT", apr: "87.71% APR", fee: "0.3%" },
    { pair: "WBTC / cbBTC", apr: "4.81% APR", fee: "0.01%" },
    { pair: "DAI / USDC", apr: "0.29% APR", fee: "0.01%" },
  ];

  const getTokenLogo = (symbol) => {
    const logos = {
      WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
      "1INCH": "https://cryptologos.cc/logos/1inch-1inch-logo.png",
      DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png",
      USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    };

    return logos[symbol] || "https://via.placeholder.com/32";
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      width={"100%"}
      padding="20px"
    >
      {/* Left Section */}
      <Box width="65%">
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" fontWeight="bold">
            Your positions
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleNewPosition}
              startIcon={<BsPlus />}
              sx={{
                backgroundColor: "black",
                color: "white",
                "&:hover": { backgroundColor: "#333" },
                textTransform: "none",
              }}
            >
              New
            </Button>
            <Button
              startIcon={<FaFilter />}
              onClick={handleMenuClick}
              sx={{
                textTransform: "none",
                color: "white",
                border: "1px solid #ddd",
                padding: "5px 15px",
                borderRadius: "5px",
              }}
            >
              {activeFilter}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => setActiveFilter("Status")}>
                Status
              </MenuItem>
              <MenuItem onClick={() => setActiveFilter("Protocol")}>
                Protocol
              </MenuItem>
            </Menu>
            <IconButton>
              <FaSlidersH size={18} />
            </IconButton>
          </Stack>
        </Box>

        {/* Position Cards */}
        {positions.map((position, index) => (
          <Paper
            elevation={2}
            key={index}
            sx={{ p: 3, borderRadius: 5, mb: 3, cursor:'pointer' }}
            onClick={() => handleCardClick(position)}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <img
                  src={getTokenLogo(position.token0Symbol)}
                  alt={position.token0Symbol}
                  style={{ width: 30, height: 30 }}
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {position.token0Symbol} / {position.token1Symbol}
                  </Typography>
                  <Typography variant="caption" color="gray">
                    {position.status || "Active"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography color="gray" fontSize={14}>
                  Position
                </Typography>
                <Typography fontWeight="bold">
                  ${position.value || "0.00"}
                </Typography>
              </Box>
              <Box>
                <Typography color="gray" fontSize={14}>
                  Fees
                </Typography>
                <Typography fontWeight="bold">
                  {position.fee || "Unavailable"}
                </Typography>
              </Box>
              <Box>
                <Typography color="gray" fontSize={14}>
                  APR
                </Typography>
                <Typography fontWeight="bold">{position.apr || "-"}</Typography>
              </Box>
              <Box>
                <Typography color="gray" fontSize={14}>
                  Range
                </Typography>
                <Typography fontWeight="bold">
                  {position.range || "Full range"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      {/* Right Section */}
      <Box width="30%">
        {/* Top Pools */}
        <Box>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Top pools by TVL
          </Typography>

          <Typography fontSize={9} mb={2}>
            This pools data is dummy.
          </Typography>
          {topPools.map((pool, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p={2}
              border="1px solid gray"
              borderRadius={3}
              mb={2}
            >
              <Stack>
                <Typography fontWeight="bold">{pool.pair}</Typography>
                <Typography fontSize={12} color="gray">
                  v3 · {pool.fee}
                </Typography>
              </Stack>
              <Typography fontWeight="bold">{pool.apr}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Positions;
