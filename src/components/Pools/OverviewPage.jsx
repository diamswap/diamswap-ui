import React from "react";
import { Box, Typography, Button } from "@mui/material";
import walletIcon from "../../assets/wallet.png";
import { NavLink } from "react-router-dom";
import { GoArrowUpRight } from "react-icons/go";

const OverviewPage = ({ onNewPosition }) => {
  return (
    <Box
      sx={{
        px: 4,
        position: "relative",
        backgroundColor: "transparent",
        color: "#FFFFFF",
        borderRadius: "16px",
      }}
    >
      {/* "New Position" Button */}
      <Box
        sx={{
          position: "absolute",
          right: "1.5rem",
          zIndex: 2,
          mb: 2,
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#D3D3D3",
            padding: "0.6rem 1.5rem",
            borderRadius: 8,
            fontSize: "0.9rem",
            fontWeight: 600,
            textTransform: "none",
            color: "#000",
          }}
          component={NavLink}
          to="/pools/positions/create"
        >
          New Position +
        </Button>
      </Box>

      {/* Content */}
      <Typography
        variant="h4"
        align="left"
        sx={{ marginBottom: "2rem", zIndex: 1, position: "relative" }}
      >
        Position
      </Typography>
      <Box
        sx={{
          backgroundColor: "transparent",
          borderRadius: "16px",
          padding: "2rem",
          textAlign: "center",
          border: "1px solid #FFFFFF4D",
          zIndex: 1,
          position: "relative",
        }}
      >
        {/* Wallet Icon */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <img
            src={walletIcon}
            alt="Wallet Icon"
            style={{ width: "48px", height: "48px" }}
          />
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: "#AAAAAA",
            fontSize: "1rem",
            mb: 3,
          }}
        >
          Your active V3 liquidity positions will appear here.
        </Typography>
      </Box>

      {/* Footer Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "2rem",
          gap: "1rem",
          zIndex: 1,
          position: "relative",
        }}
      >
        <Box
          sx={{
            backgroundColor: "rgba(0, 206, 229, 0.06)",
            color: "#FFFFFF",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            width: "48%",
            border: "1px solid #FFFFFF4D",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#AAAAAA", fontSize: "0.7rem", fontWeight: 700 }}
          >
            Learn about providing Liquidity
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#AAAAAA", fontSize: "0.7rem" }}
          >
            Earn pool fees & Extra Rewards
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: "rgba(0, 206, 229, 0.06)",
            color: "#FFFFFF",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            width: "48%",
            border: "1px solid #FFFFFF4D",
          }}
          component={NavLink}
          to="/explore/pools"
        >
          <Typography
            variant="body2"
            sx={{ color: "#AAAAAA", fontSize: "0.7rem", fontWeight: 700 }}
          >
            Top Pools <GoArrowUpRight />
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#AAAAAA", fontSize: "0.7rem" }}
          >
            Stake assets and earn rewards
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default OverviewPage;
