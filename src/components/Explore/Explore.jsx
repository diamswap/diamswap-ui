import React, { useState } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";
import { useLocation } from "react-router-dom";
import { RiBarChart2Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { GrLineChart } from "react-icons/gr";
import SwapInterface from "../Swap/Swap";
import LimitPage from "../Swap/Limit";
import SendPage from "../Swap/Send";
import BuyPage from "../Swap/Buy";
import Info from "./Info";
import ChartComp from "../../comman/ChartComp";
import Stats from "./Stats";
import TableTab from "../../comman/TableTab";
import TableComp from "../../comman/TableComp";
import Dropdown from "../../comman/Dropdown";

const Transactions = () => (
  <Typography variant="h6" color="white" textAlign="center">
    Transactions Content Comming Soon!
  </Typography>
);

const Explore = ({ activeTab, setActiveTab }) => {
  const location = useLocation();
  const tokenName = location.state.token.name;
  const symbol = location.state.token.symbol;
  const tabs = ["Pools", "Transactions"];
  const [chartType, setChartType] = useState("Line");
  const [itemType, setItemType] = useState("Price");
  const [sortField, setSortField] = useState("tvl");
  const [sortOrder, setSortOrder] = useState("desc");
  
  const chartItems = [
    { value: "Line", label: "Line Chart", icon: <GrLineChart /> },
    { value: "Bar", label: "Bar Chart", icon: <RiBarChart2Line /> },
  ];
  const dropItems = [
    { value: "Price", label: "Price" },
    { value: "Volume", label: "Volume" },
    { value: "TVL", label: "TVL" },
  ];

  const navigate = useNavigate();

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleRowClick = (poolId) => {
    navigate(`/pool/${poolId}`); // Navigate to the pool details page
  };

  const tvl = "1.2B";
  const marketCap = "2.5B";
  const fdv = "3.1B";
  const oneDayVolume = "500M";

  const renderContent = () => {
    switch (activeTab) {
      case "Swap":
        return <SwapInterface width="400px"/>;
      case "Limit":
        return <LimitPage width="400px"/>;
      case "Send":
        return <SendPage width="400px"/>;
      case "Buy":
        return <BuyPage width="400px"/>;
      default:
        return <SwapInterface width="400px"/>;
    }
  };

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };
  const handleItemTypeChange = (event) => {
    setItemType(event.target.value);
  };

  const poolHeaders = [
    { field: "id", label: "#", sortable: false },
    { field: "pair", label: "Pool", sortable: false },
    { field: "tvl", label: "TVL", sortable: true },
    { field: "apr", label: "APR", sortable: false },
    { field: "oneDayVol", label: "1D vol", sortable: false },
    { field: "thirtyDayVol", label: "30D vol", sortable: false },
    { field: "oneDayVolPerTVL", label: "1D vol/TVL", sortable: false },
  ];

  const poolsData = [
    {
      id: 1,
      pair: "WISE/ETH",
      tvl: 225.0,
      apr: "0.008%",
      oneDayVol: "$15.5K",
      thirtyDayVol: "$1.3M",
      oneDayVolPerTVL: "<0.01",
    },
    {
      id: 2,
      pair: "WBTC/ETH",
      tvl: 172.8,
      apr: "3.616%",
      oneDayVol: "$5.7M",
      thirtyDayVol: "$469.8M",
      oneDayVolPerTVL: "0.03",
    },
    {
      id: 3,
      pair: "ETH/USDT",
      tvl: 151.4,
      apr: "20.829%",
      oneDayVol: "$28.8M",
      thirtyDayVol: "$2.6B",
      oneDayVolPerTVL: "0.19",
    },
    {
      id: 4,
      pair: "USDC/ETH",
      tvl: 120.6,
      apr: "12.056%",
      oneDayVol: "$79.6M",
      thirtyDayVol: "$9.7B",
      oneDayVolPerTVL: "0.66",
    },
    {
      id: 5,
      pair: "ETH/USDT",
      tvl: 90.5,
      apr: "5.606%",
      oneDayVol: "$4.6M",
      thirtyDayVol: "$266.9M",
      oneDayVolPerTVL: "0.05",
    },
  ];

  const components = {
    transactions: <Transactions />,
    pools: (
      <TableComp
        headers={poolHeaders}
        data={poolsData}
        sortField={sortField}
        sortOrder={sortOrder}
        handleSort={handleSort}
        handleRowClick={handleRowClick}
      />
    ),
  };

  return (
    <Box
      sx={{
        margin: "auto",
        display: "flex",
        maxWidth: "1400px",
        padding: "2rem",
        width: "100%",
        gap: "4rem",
      }}
    >
      <Box display="flex" flexDirection="column" gap="1rem" width="60%">
        <Typography variant="h3">{tokenName} {symbol.toUpperCase()}</Typography>
        <ChartComp chartType={chartType} />
        {/* drop down */}
        <Box
          sx={{
            backgroundColor: "transparent",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Dropdown
            value={itemType}
            onChange={handleItemTypeChange}
            items={dropItems}
            renderValue={(selected) =>
              selected === "Price"
                ? "Price"
                : selected === "Volume"
                ? "Volume"
                : "TVL"
            }
          />

          <Dropdown
            value={chartType}
            onChange={handleChartTypeChange}
            items={chartItems}
            renderValue={(selected) =>
              selected === "Line" ? (
                <GrLineChart />
              ) : selected === "Bar" ? (
                <RiBarChart2Line />
              ) : null
            }
          />
        </Box>
        <Typography variant="h3">Stats</Typography>
        <Stats
          tvl={tvl}
          marketCap={marketCap}
          fdv={fdv}
          oneDayVolume={oneDayVolume}
        />
        <TableTab tabs={tabs} components={components} />
      </Box>
      <Box sx={{width: "400px"}}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "1rem",
            
          }}
        >
          {["Swap", "Limit", "Send", "Buy"].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              sx={{
                backgroundColor: activeTab === tab ? "#fff" : "#000",
                color: activeTab === tab ? "#000" : "#fff",
                height: 30,
                width: 60,
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
        <Info />
      </Box>
    </Box>
  );
};

export default Explore;
