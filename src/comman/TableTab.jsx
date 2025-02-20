import React, { useState, useEffect } from "react";
import { Stack, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const TableTab = ({ tabs, components }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab = tabs.find((tab) =>
    location.pathname.includes(tab.toLowerCase())
  )?.toLowerCase() || tabs[0].toLowerCase();

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    const tabPath = `/explore/${tab.toLowerCase()}`;
    navigate(tabPath); // Update the path
    setActiveTab(tab.toLowerCase());
  };

  useEffect(() => {
    const currentTab = tabs.find((tab) =>
      location.pathname.includes(tab.toLowerCase())
    )?.toLowerCase();
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [location.pathname, tabs]);

  const getComponent = () => {
    switch (activeTab) {
      case "tokens":
        return components.tokens;
      case "pools":
        return components.pools;
      case "transactions":
        return components.transactions;
      default:
        return null;
    }
  };

  return (
    <Stack spacing={4}>
      {/* Tabs */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ borderBottom: 1, borderColor: "#D3D3D35E" }}
      >
        {tabs.map((tab) => (
          <Button
            key={tab}
            sx={{
              color:
                activeTab === tab.toLowerCase() ? "primary.main" : "text.secondary",
              borderBottom: activeTab === tab.toLowerCase() ? 2 : 0,
              borderColor: "primary.main",
              borderRadius: 0,
              px: 2,
              py: 1,
              "&:hover": { backgroundColor: "transparent" },
            }}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </Button>
        ))}
      </Stack>

      {/* Component */}
      {getComponent()}
    </Stack>
  );
};

export default TableTab;
