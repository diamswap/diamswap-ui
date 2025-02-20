import React, { useEffect } from "react";
import { Box, Button, useMediaQuery } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useLocation, useNavigate } from "react-router-dom";
import SwapInterface from "./Swap";
import LimitPage from "./Limit";
import SendPage from "./Send";
import BuyPage from "./Buy";
import Liquidity from "./Liquidity";

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Update the active tab based on URL
  useEffect(() => {
    switch (location.pathname) {
      case "/swap":
        setActiveTab("Swap");
        break;
      case "/limit":
        setActiveTab("Limit");
        break;
      case "/send":
        setActiveTab("Send");
        break;
      case "/buy":
        setActiveTab("Buy");
        break;
      default:
        setActiveTab("Swap");
        break;
    }
  }, [location, setActiveTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "Swap":
        return <SwapInterface />;
      case "Limit":
        return <LimitPage />;
      case "Send":
        return <SendPage />;
      case "Buy":
        return <BuyPage />;
      default:
        return <SwapInterface />;
    }
  };

  return (
    <Box sx={{ padding: isMobile && "1rem" }}>
      {/* Navigation Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginBottom: "1rem",
          mt: 2,
        }}
      >
        {["Swap", "Limit", "Send", "Buy"].map((tab) => (
          <Button
            key={tab}
            onClick={() => navigate(`/${tab.toLowerCase()}`)}
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
      <Liquidity />
    </Box>
  );
};

export default TabNavigation;
