import React, { useState } from "react";
import { Box, Button, Typography, Select, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChartComp from "../../comman/ChartComp";
import TableComp from "../../comman/TableComp";
import TabNavigation from "../../components/Swap";

const transactionsHeaders = [
  { field: "time", label: "Time", sortable: false },
  { field: "type", label: "Type", sortable: false },
  { field: "usd", label: "USD", sortable: false },
  { field: "wbtc", label: "WBTC", sortable: false },
  { field: "lbtc", label: "LBTC", sortable: false },
];

const transactionsData = [
  {
    time: "1h ago",
    type: "Buy WBTC",
    usd: "$116.06",
    wbtc: "501.25",
    lbtc: "0.03145",
  },
  {
    time: "2h ago",
    type: "Sell WBTC",
    usd: "$2,213.44",
    wbtc: "9,624",
    lbtc: "0.60023",
  },
  // Add more transaction data as needed
];

export default function Etherrum() {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState("Price");
  const [activeTab, setActiveTab] = useState("Swap");
  const [isTabNavigationOpen, setIsTabNavigationOpen] = useState(false);

  const handleSwapClick = () => {
    setIsTabNavigationOpen(!isTabNavigationOpen);
  };

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  const handleAddLiquidityClick = () => {
    navigate("/pools/positions/create");
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: "4rem",
        padding: "2rem",
        width: "100%",
      }}
    >
      <Box display="flex" flexDirection="column" gap="1rem" width="60%">
        <Typography variant="h4">Tether USD USDT</Typography>
        <ChartComp chartType={chartType} />
        {/* drop down */}
        <Box
          sx={{
            backgroundColor: "transparent",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Select
            value={chartType}
            onChange={handleChartTypeChange}
            size="small"
            displayEmpty
            renderValue={(selected) => {
              if (selected === "Line") {
                return "Volume";
              } else if (selected === "Bar") {
                return "Price";
              } else {
                return null;
              }
            }}
            sx={{
              color: "white",
              backgroundColor: "transparent",
              border: "1px solid white",
              borderRadius: "0.65rem",
              "& .MuiSvgIcon-root": {
                color: "white",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
            MenuProps={{
              anchorOrigin: {
                vertical: "bottom",
                horizontal: "right",
              },
              transformOrigin: {
                vertical: "top",
                horizontal: "right",
              },
              PaperProps: {
                sx: {
                  backgroundColor: "#121212",
                  color: "white",
                  width: "auto",
                },
              },
            }}
          >
            <MenuItem
              value="Line"
              sx={{
                display: "flex",
                gap: "1rem",
                "&:hover": { backgroundColor: "transparent" },
              }}
            >
              Volume
            </MenuItem>
            <MenuItem
              value="Bar"
              sx={{
                display: "flex",
                gap: "1rem",
                "&:hover": { backgroundColor: "transparent" },
              }}
            >
              Price
            </MenuItem>
          </Select>
        </Box>
        <Typography variant="h4">Transactions</Typography>
        <TableComp
          headers={transactionsHeaders}
          data={transactionsData}
          sortField={null}
          sortOrder={null}
          handleSort={() => {}}
          handleRowClick={() => {}}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: "0.65rem" }}
            onClick={handleSwapClick}
          >
            {isTabNavigationOpen ? "Close" : "Swap"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: "0.65rem" }}
            onClick={handleAddLiquidityClick}
          >
            Add Liquidity
          </Button>
        </Box>
        {isTabNavigationOpen ? (
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : (
          <Typography>Dummy Stats data will be shown here</Typography>
        )}
      </Box>
    </Box>
  );
}
