import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import factoryABI from "../../../swifyFactoryABI.json";
import Web3 from "web3";

const PoolList = () => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const factoryAddress = "0x75FC67473A91335B5b8F8821277262a13B38c9b3";

  const fetchPools = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress);

      const latestBlock = await web3.eth.getBlockNumber();
      const batchSize = 10000;
      let fromBlock = 10592642;
      let pools = [];

      while (fromBlock <= latestBlock) {
        const toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);

        const events = await factoryContract.getPastEvents("PoolCreated", {
          fromBlock,
          toBlock,
        });

        const batchPools = events.map((event) => ({
          token0: event.returnValues?.token0,
          token1: event.returnValues?.token1,
          fee: parseFloat(event.returnValues?.fee), // Numeric fee
          poolAddress: event.returnValues?.pool,
        }));

        pools = pools.concat(batchPools);

        fromBlock = toBlock + 1;
      }

      return pools;
    } catch (error) {
      console.error("Error fetching pools:", error);
      return [];
    }
  };

  useEffect(() => {
    const getPools = async () => {
      const poolData = await fetchPools();
      setPools(poolData);
      setLoading(false);
    };

    getPools();
  }, []);

  const handleRedirect = (address) => {
    window.open(`https://evm-explorer.nibiru.fi/address/${address}`, "_blank");
  };

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "transparent",
        margin: "2rem auto",
        padding: "2rem",
        color: "#FFFFFF",
      }}
    >
      {/* Title */}
      <Typography
        variant="h4"
        sx={{
          marginBottom: "30px",
          fontWeight: "bold",
          color: "#E0E0E0",
        }}
      >
         Pool Fees Distribution
      </Typography>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              padding: isMobile ? "1px" : "20px",
              backgroundColor: "transparent",
            }}
          >
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={pools.map((pool, index) => ({
                  name: `Pool ${index + 1}`,
                  Fee: pool.fee,
                  SecondaryFee: pool.fee * 0.9, // Mock second line data
                }))}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a4a77" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0a4a77" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorSecondary"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FF69B4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FF69B4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {/* <CartesianGrid strokeDasharray="3 3" stroke="#444" /> */}
                <XAxis dataKey="name" stroke="#ddd" />
                <YAxis stroke="#ddd" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="Fee"
                  stroke="#0a4a77"
                  fillOpacity={1}
                  fill="url(#colorFee)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
          {/* Table Section */}

          {/* Graph Section */}

          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "#E0E0E0",
                marginBottom: 4,

                mt: 4,
              }}
            >
               Liquidity Pools
            </Typography>

            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: "transparent",
                borderRadius: "12px",
                marginBottom: "30px",
                border: "1px solid #FFFFFF4D",
                color: "#FFFFFF",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Pool Address
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Token 0
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Token 1
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Fee
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pools.map((pool, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ color: "#ddd" }}>
                        {pool.poolAddress}
                      </TableCell>
                      <TableCell
                        sx={{ color: "#ddd", cursor: "pointer" }}
                        onClick={() => handleRedirect(pool.token0)}
                      >
                        {pool.token0}
                      </TableCell>
                      <TableCell
                        sx={{ color: "#ddd", cursor: "pointer" }}
                        onClick={() => handleRedirect(pool.token1)}
                      >
                        {pool.token1}
                      </TableCell>
                      <TableCell sx={{ color: "#ddd" }}>{pool.fee}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PoolList;
