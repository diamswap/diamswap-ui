import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { IoIosSearch } from "react-icons/io";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NavLink } from "react-router-dom";

// Sample data for charts
const tvlData = [
  { date: "7th July 2024", value1: 35, value2: 30 },
  { date: "12th July 2024", value1: 38, value2: 35 },
  { date: "16th July 2024", value1: 45, value2: 40 },
  { date: "27th July 2024", value1: 42, value2: 38 },
  { date: "1st August 2024", value1: 48, value2: 45 },
  { date: "8 August 2024", value1: 55, value2: 50 },
];

const volumeData = [
  { date: "7th July 2024", value1: 40, value2: 35 },
  { date: "12th July 2024", value1: 35, value2: 30 },
  { date: "16th July 2024", value1: 50, value2: 45 },
  { date: "27th July 2024", value1: 45, value2: 40 },
  { date: "1st August 2024", value1: 52, value2: 48 },
  { date: "8 August 2024", value1: 58, value2: 52 },
];

const poolsData = Array(8).fill({
  pair: "xcvDOT-xcDOT",
  apy: "0.30%",
  transactions: "342.6K",
  tvl: "$123.45k",
  volume: "0.00%",
  apr: "0.00%",
  balance: "-",
});

// Styled components
const DarkTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#132F4C",
    borderRadius: "8px",
    "& fieldset": {
      borderColor: "#D3D3D35E",
    },
    "&:hover fieldset": {
      borderColor: "#2977C9",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#B2BAC2",
  },
}));

const StyledTableCell = styled(TableCell)({
  color: "white",
  borderBottom: "1px solid #D3D3D35E",
  padding: "16px 8px",
});

const ChartCard = ({ title, data, id }) => (
  <Box sx={{ bgcolor: "tra", pb: 3, pt: 3, borderRadius: 2 }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Box sx={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient1-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D3D3D35E" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#D3D3D35E" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id={`gradient2-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00AAFF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00AAFF" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="#B2BAC2"
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis stroke="#B2BAC2" axisLine={false} tickLine={false} dx={-10} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A2027",
              border: "none",
              borderRadius: "8px",
              color: "white",
            }}
          />
          <Area
            type="monotone"
            dataKey="value1"
            stroke="#0066FF"
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient1-${id})`}
          />
          <Area
            type="monotone"
            dataKey="value2"
            stroke="#00AAFF"
            strokeWidth={2}
            fillOpacity={0.5}
            fill={`url(#gradient2-${id})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
    <Typography variant="caption" color="text.secondary">
      Updated at 12:00pm
    </Typography>
  </Box>
);

export default function LiquidityPools() {
  const [activeTab, setActiveTab] = useState("pools");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Box sx={{ minHeight: "100vh", color: "white", py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant={isMobile ? "h6" : "h4"} gutterBottom>
              Liquidity Pools
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provide liquidity, earn yield.
            </Typography>
          </Box>
          <Button
            variant="contained"
            sx={{ bgcolor: "#fff", "&:hover": { bgcolor: "#1976d2" } }}
            component={NavLink}
            to="/pools/positions/create"
          >
            Create New Position +
          </Button>
        </Box>

        {/* Stats */}
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography variant="h5">
            TVL
            <Typography component="span" color="primary" sx={{ ml: 1 }}>
              $1,038,542,755.09
            </Typography>
          </Typography>
          <Typography variant="h5">
            24H Volume
            <Typography component="span" color="primary" sx={{ ml: 1 }}>
              $1,038,542,755.09
            </Typography>
          </Typography>
        </Box>

        {/* Charts */}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ChartCard title="Total Value Locked" data={tvlData} id="tvl" />
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartCard title="Trading Volume" data={volumeData} id="volume" />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ borderBottom: 1, borderColor: "#D3D3D35E" }}
        >
          {["Tokens", "Pools", "Transactions"].map((tab) => (
            <Button
              key={tab}
              sx={{
                color:
                  activeTab === tab.toLowerCase()
                    ? "primary.main"
                    : "text.secondary",
                borderBottom: activeTab === tab.toLowerCase() ? 2 : 0,
                borderColor: "primary.main",
                borderRadius: 0,
                px: 2,
                py: 1,
                "&:hover": { backgroundColor: "transparent" },
              }}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </Button>
          ))}
        </Stack>

        {/* Search */}
        <DarkTextField
          fullWidth
          placeholder="Search Pools and Tokens"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IoIosSearch />
              </InputAdornment>
            ),
          }}
        />

        {/* Pools Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>POOL</StyledTableCell>
                <StyledTableCell>APY</StyledTableCell>
                <StyledTableCell>TRANSACTIONS</StyledTableCell>
                <StyledTableCell>TVL</StyledTableCell>
                <StyledTableCell>TOTAL VOLUME(24H)</StyledTableCell>
                <StyledTableCell>TOTAL APR(24H)</StyledTableCell>
                <StyledTableCell>BALANCE</StyledTableCell>
                <StyledTableCell align="right"></StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {poolsData.map((pool, index) => (
                <TableRow
                  key={index}
                  sx={{ "&:hover": { bgcolor: "#132F4C" } }}
                >
                  <StyledTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ display: "flex", mr: 1 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: "#fff",
                            mr: -1,
                          }}
                        />
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: "#1976d2",
                          }}
                        />
                      </Box>
                      {pool.pair}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>{pool.apy}</StyledTableCell>
                  <StyledTableCell>{pool.transactions}</StyledTableCell>
                  <StyledTableCell>{pool.tvl}</StyledTableCell>
                  <StyledTableCell>{pool.volume}</StyledTableCell>
                  <StyledTableCell>{pool.apr}</StyledTableCell>
                  <StyledTableCell>{pool.balance}</StyledTableCell>
                  <StyledTableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: "rgba(6, 156, 254, 0.20)",
                        color: "#D3D3D3",
                        borderRadius: 8,

                        fontSize: 12,
                        "&:hover": { bgcolor: "#1976d2" },
                      }}
                    >
                      Deposit
                    </Button>
                  </StyledTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
}
