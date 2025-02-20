import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  useTheme,
  useMediaQuery,
  Avatar,
} from "@mui/material";
import { FaExchangeAlt } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaPlus } from "react-icons/fa6";
import { FaCopy, FaExternalLinkAlt } from "react-icons/fa";
import TableComp from "../../comman/TableComp";
import { useNavigate } from "react-router-dom";
import SwapInterface from "../../components/Swap/Swap";
import LimitPage from "../../components/Swap/Limit";
import SendPage from "../../components/Swap/Send";
import BuyPage from "../../components/Swap/Buy";
import { IoMdClose } from "react-icons/io";

// Mock graph data
const graphData = {
  "1H": [
    { time: "8:30 PM", value: 2 },
    { time: "9:00 PM", value: 3 },
    { time: "9:30 PM", value: 4 },
  ],
  "1D": [
    { time: "2:30 AM", value: 1 },
    { time: "8:30 AM", value: 12 },
    { time: "11:30 AM", value: 6 },
    { time: "2:30 PM", value: 5 },
    { time: "6:30 PM", value: 9 },
  ],
  "1W": [
    { time: "Mon", value: 20 },
    { time: "Tue", value: 15 },
    { time: "Wed", value: 25 },
    { time: "Thu", value: 30 },
    { time: "Fri", value: 22 },
    { time: "Sat", value: 19 },
    { time: "Sun", value: 24 },
  ],
  "1M": [
    { time: "Nov 1", value: 40 },
    { time: "Nov 8", value: 120 },
    { time: "Nov 15", value: 180 },
    { time: "Nov 22", value: 150 },
    { time: "Nov 29", value: 90 },
  ],
  "1Y": [
    { time: "Jan", value: 400 },
    { time: "Feb", value: 300 },
    { time: "Mar", value: 500 },
    { time: "Apr", value: 450 },
    { time: "May", value: 600 },
    { time: "Jun", value: 550 },
    { time: "Jul", value: 700 },
    { time: "Aug", value: 650 },
    { time: "Sep", value: 800 },
    { time: "Oct", value: 750 },
    { time: "Nov", value: 900 },
    { time: "Dec", value: 850 },
  ],
};
// Mock transaction data
const transactionData = [
  {
    time: "1h ago",
    type: "Buy WISE",
    usd: "$116.06",
    wise: "501.25",
    eth: "0.03145",
  },
  {
    time: "2h ago",
    type: "Sell WISE",
    usd: "$2,213.44",
    wise: "9,624",
    eth: "0.60023",
  },
  {
    time: "4h ago",
    type: "Sell WISE",
    usd: "$392.06",
    wise: "1,700.04",
    eth: "0.10603",
  },
  {
    time: "7h ago",
    type: "Sell WISE",
    usd: "$202.84",
    wise: "880.858",
    eth: "0.05494",
  },
  {
    time: "8h ago",
    type: "Sell WISE",
    usd: "$100.38",
    wise: "436.271",
    eth: "0.02721",
  },
  {
    time: "9h ago",
    type: "Buy WISE",
    usd: "$36.94",
    wise: "159.373",
    eth: "0.01",
  },
  {
    time: "10h ago",
    type: "Sell WISE",
    usd: "$1,071.07",
    wise: "4,679.77",
    eth: "0.29188",
  },
];

const headers = [
  { field: "time", label: "Time", sortable: true },
  { field: "type", label: "Type", sortable: true },
  { field: "usd", label: "USD", sortable: true },
  { field: "wise", label: "WISE", sortable: true },
  { field: "eth", label: "ETH", sortable: true },
];

const links = [
  {
    icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",

    label: "USDC / ETH",
    iconColor: "#005cc5",
    address: "0x88e6...5640",
    explorerLink: "https://evm-explorer.nibiru.fi/address/0x88e6...5640",
  },
  {
    icon: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    label: "USDT",
    iconColor: "#005cc5",
    address: "0xA0b8...eB48",
    explorerLink: "https://evm-explorer.nibiru.fi/address/0xA0b8...eB48",
  },
  {
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    label: "ETH",
    iconColor: "#6f42c1",
    address: "",
    explorerLink: "",
  },
];

export default function PoolDetails() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [timePeriod, setTimePeriod] = useState("1M");
  const [activeTab, setActiveTab] = useState("Swap");
  const [showTabNavigation, setShowTabNavigation] = useState(false);

  const handleTimePeriodChange = (event, newTimePeriod) => {
    if (newTimePeriod) setTimePeriod(newTimePeriod);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Swap":
        return <SwapInterface width="450px" />;
      case "Limit":
        return <LimitPage width="450px" />;
      case "Send":
        return <SendPage width="450px" />;
      case "Buy":
        return <BuyPage width="450px" />;
      default:
        return <SwapInterface width="450px" />;
    }
  };

  return (
    <Box sx={{ m: 2, mt: 4, p: 2 }}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Explore › Pools <span>›</span> WISE / ETH <span>0x4585...20c0</span>
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h4" fontWeight={600}>
            WISE / ETH{" "}
            <span style={{ fontSize: "1rem", fontWeight: "normal" }}>
              v2 0.3%
            </span>
          </Typography>
        </Stack>
        <Typography variant="h5" fontWeight={600} mt={2}>
          $17,694.08{" "}
          <span style={{ fontSize: "1rem", fontWeight: "normal" }}>
            Past day
          </span>
        </Typography>
      </Box>

      <Grid container spacing={3} gap={5}>
        <Grid item xs={12} md={7.5}>
          <Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={graphData[timePeriod]}>
                <XAxis dataKey="time" stroke="#B2BAC2" />
                <YAxis
                  stroke="#B2BAC2"
                  tickFormatter={(value) => `$${value}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    borderRadius: "8px",
                    color: "white",
                  }}
                />
                <Bar dataKey="value" fill="#033f6b" />
              </BarChart>
            </ResponsiveContainer>

            <Box sx={{ display: "flex", justifyContent: "left", mt: 2, ml: 4 }}>
              <ToggleButtonGroup
                value={timePeriod}
                exclusive
                onChange={handleTimePeriodChange}
                aria-label="time period"
                sx={{
                  border: "1px solid #E5E5E5",
                  borderRadius: "25px",
                  backgroundColor: "#000",
                  padding: "4px",
                }}
              >
                {["1H", "1D", "1W", "1M", "1Y"].map((period) => (
                  <ToggleButton
                    key={period}
                    value={period}
                    aria-label={period}
                    sx={{
                      backgroundColor:
                        timePeriod === period ? "#F0F1F6" : "transparent",
                      color: timePeriod === period ? "black" : "#6E6E6E",
                      fontWeight: "bold",
                      borderRadius: "20px",
                      textTransform: "none",
                      px: 2,
                      py: 0.5,
                      "&:hover": {
                        backgroundColor: "black",
                        borderRadius: "20px",
                      },
                      border: "none",
                    }}
                  >
                    {period}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box mt={5}>
              <Typography variant="h4" mb={2}>
                Transactions
              </Typography>
              <TableComp
                headers={headers}
                data={transactionData}
                sortField={null}
                sortOrder={null}
                handleSort={() => {}}
                handleRowClick={() => {}}
              />
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box>
            <Stack direction="row" spacing={2} mt={4} mb={2} justifyContent={"space-around"}>
              {/* Swap Button */}
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#000",
                  color: "white",
                  textTransform: "none",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  px: 3,
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  "&:hover": {
                    backgroundColor: "black",
                  },
                }}
                onClick={() => {
                  setShowTabNavigation(!showTabNavigation);
                }}
              >
                {showTabNavigation ? (
                  <>
                    <IoMdClose style={{ fontSize: "18px" }} />
                    Close
                  </>
                ) : (
                  <>
                    <FaExchangeAlt style={{ fontSize: "18px" }} />
                    Swap
                  </>
                )}
              </Button>

              {/* Add Liquidity Button */}
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#000",
                  color: "white",
                  textTransform: "none",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  px: 4,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  "&:hover": {
                    backgroundColor: "black",
                  },
                }}
                onClick={() => {
                  navigate("/pools/positions/create");
                }}
              >
                <FaPlus style={{ fontSize: "18px" }} />
                Add liquidity
              </Button>
            </Stack>
            {showTabNavigation && (
              <Box sx={{ width: "450px" }}>
                <Box
                  sx={{
                    display: "flex",
                    width: "450px" ,
                    gap: "16px",
                    margin: "1rem",
                  }}
                >
                  {["Swap", "Limit", "Send", "Buy"].map((tab) => (
                    <Button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      sx={{
                        backgroundColor:
                          activeTab === tab ? "#fff" : "#000",
                        color: activeTab === tab ? "#fff" : "#888",
                        height: 30,
                        width: 90,
                        textTransform: "none",
                        borderRadius: "24px",
                      }}
                    >
                      {tab}
                    </Button>
                  ))}
                </Box>

                {/* Render Active Component */}
                {renderContent()}
              </Box>
            )}
            <Paper
              elevation={3}
              sx={{
                padding: 2.5,
                borderRadius: 2,
                width:"450px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Stats
              </Typography>

              {/* Pool Balances */}
              <Typography variant="body2" gutterBottom sx={{ marginBottom: 1 }}>
                Pool balances
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                justifyContent={"space-between "}
                mb={2}
              >
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ marginRight: 1 }}
                >
                  334.85 <span style={{ fontSize: "0.8rem" }}>WBTC</span>
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  38.1K <span style={{ fontSize: "0.8rem" }}>ETH</span>
                </Typography>
              </Box>
              {/* Bar */}
              <Box
                sx={{
                  width: "100%",
                  height: 10,
                  borderRadius: 5,
                  background:
                    "linear-gradient(90deg, #FFC107 40%, #007BFF 60%)",
                  mb: 2,
                }}
              ></Box>

              <Box mb={2}>
                <Typography> TVL: </Typography>
                <Typography variant="h3" fontSize={30}>
                  $172.1M
                  <span style={{ color: "red", fontSize: "14px" }}>
                    ▼ 0.74%
                  </span>
                </Typography>{" "}
              </Box>

              <Box mb={2}>
                <Typography> 24H Volume: </Typography>
                <Typography variant="h3" fontSize={30}>
                  $4.1M
                  <span style={{ color: "red", fontSize: "14px" }}>
                    ▼ 35.41%
                  </span>
                </Typography>{" "}
              </Box>

              {/* 24H Fees */}
              <Box mb={2}>
                <Typography> 24H Fees:</Typography>
                <Typography variant="h3" fontSize={30}>
                  $12.3K
                </Typography>
              </Box>
            </Paper>

            <Box
              sx={{
                borderRadius: 2,
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                p: 2,
                width: "450px" 
              }}
            >
              <Typography variant="h6" gutterBottom>
                Links
              </Typography>
              {links.map((link, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  {/* Icon + Label */}
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      src={link?.icon}
                      style={{
                        width: "20px",
                        height: "20px",
                        marginRight: "0.4rem",
                      }}
                    />
                    <Typography variant="body1">{link.label}</Typography>
                  </Box>

                  {/* Address */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {link.address && (
                      <Typography
                        variant="body2"
                        sx={{
                          padding: "5px 10px",
                          borderRadius: "8px",
                          fontFamily: "monospace",
                        }}
                      >
                        {link.address}
                      </Typography>
                    )}

                    {/* Copy Icon */}
                    {link.address && (
                      <FaCopy
                        style={{
                          color: "#888",
                          cursor: "pointer",
                        }}
                        onClick={() => handleCopy(link.address)}
                      />
                    )}

                    {/* External Link */}
                    {link.explorerLink && (
                      <a
                        href={link.explorerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaExternalLinkAlt
                          style={{ color: "#888", cursor: "pointer" }}
                        />
                      </a>
                    )}
                  </Box>
                </Box>
              ))}
              <Divider sx={{ backgroundColor: "#ddd" }} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
