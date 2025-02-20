import { Box, Typography } from "@mui/material";
import React from "react";

export default function Liquidity() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: "1rem",
        alignItems: "center",
        marginTop: "2rem",
        zIndex: 1,
        position: "relative",
        flexDirection: { xs: "column", sm: "row" },
      }}
    >
      <Box
        sx={{
          backgroundColor: "rgba(0, 206, 229, 0.06)",
          color: "#FFFFFF",
          padding: "1.3rem",
          borderRadius: "14px",
          fontWeight: 600,
          textTransform: "none",
          border: "1px solid #FFFFFF4D",
          width: "100%",
          maxWidth: { sm: "250px" }, 
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "#AAAAAA", fontSize: "1rem", fontWeight: 700 }}
        >
          Provide Liquidity
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#AAAAAA", fontSize: "0.8rem" }}
        >
          Earn pool fees & Extra Rewards
        </Typography>
      </Box>
      <Box
        sx={{
          backgroundColor: "rgba(0, 206, 229, 0.06)",
          color: "#FFFFFF",
          padding: "1.3rem",
          borderRadius: "14px",
          fontWeight: 600,
          textTransform: "none",
          border: "1px solid #FFFFFF4D",
          width: "100%",
          maxWidth: { sm: "250px" }, 
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "#AAAAAA", fontSize: "1rem", fontWeight: 700 }}
        >
          Staking
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#AAAAAA", fontSize: "0.8rem" }}
        >
          Stake assets and earn rewards
        </Typography>
      </Box>
    </Box>
  );
}
