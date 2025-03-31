// PoolDetails.jsx
import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const PoolDetails = ({ details }) => {
  if (!details) return null;
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Liquidity Pool Details
        </Typography>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
          {JSON.stringify(details, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export default PoolDetails;
