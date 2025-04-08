import React, { useEffect, useState } from "react";
import { Aurora } from "diamnet-sdk";
import {
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";

// Configure the Diamnet server (Testnet in this example)
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

const WalletPoolsPage = ({
}) => {
  const walletId = localStorage.getItem("diamPublicKey");

  const [lpBalances, setLpBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPools = async () => {
    setLoading(true);
    setError("");
    try {
      // Load the account details using the provided wallet ID
      const account = await server.loadAccount(walletId);
      // Filter the balances for liquidity pool shares
      const pools = account.balances.filter(
        (balance) => balance.asset_type === "liquidity_pool_shares"
      );
      setLpBalances(pools);
    } catch (err) {
      setError("Error loading account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletId) {
      fetchPools();
    }
  }, [walletId]);

  return (
    <Box
      sx={{
        // Optional: dark background for the entire page
        minHeight: "100vh",
        backgroundColor: "#0A1B1F",
        color: "#fff",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #0E2429 0%, #0A1B1F 100%)",
            borderRadius: "24px",
            p: { xs: 3, sm: 5 },
            mb: 4,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
            Liquidity Pools Overview
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Explore the liquidity pool shares held in this wallet.
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 2, wordBreak: "break-all", opacity: 0.7 }}
          >
            Wallet ID: {walletId}
          </Typography>
        </Box>

        {/* Refresh Button + Title Row */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Your Liquidity Pools
          </Typography>
          <Button
            variant="contained"
            onClick={fetchPools}
            disabled={loading}
            sx={{
              backgroundColor: "#00CEE5",
              color: "#0A1B1F",
              "&:hover": {
                backgroundColor: "#00AEC5",
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Refresh"}
          </Button>
        </Box>

        {/* Error Message */}
        {error && (
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : lpBalances.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No liquidity pool shares found for this wallet.
          </Typography>
        ) : (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {lpBalances.map((lp, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    minHeight: 180,
                    backgroundColor: "#1B2730",
                    borderRadius: "16px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    transition: "transform 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
                    },
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      component="div"
                      gutterBottom
                      sx={{ fontWeight: "bold", color: "#00CEE5" }}
                    >
                      Pool ID
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ wordBreak: "break-all", mb: 2, opacity: 0.9 }}
                    >
                      {lp.liquidity_pool_id}
                    </Typography>

                    <Typography
                      variant="h6"
                      component="div"
                      gutterBottom
                      sx={{ fontWeight: "bold", color: "#00CEE5" }}
                    >
                      Balance
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {lp.balance}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default WalletPoolsPage;
