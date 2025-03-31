import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Avatar,
  Card,
  CardContent,
  Grid,
  Collapse,
  IconButton,
} from "@mui/material";
import { Aurora } from "diamnet-sdk";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

// A simple helper to reuse the gradient style in multiple places:
const gradientText = {
  backgroundImage:
    "linear-gradient(270deg, rgb(15, 186, 209) 0%, rgb(255, 255, 255) 48.7783%, rgb(15, 186, 209) 100%)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

// Simple TabPanel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const DiamanteDashboard = ({
}) => {
  const accountId = localStorage.getItem("diamPublicKey");
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState(null);
  const [claimableBalances, setClaimableBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [operations, setOperations] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showFullAccountData, setShowFullAccountData] = useState(false);

  // Memoize the server instance so it is not re-created on each render.
  const server = useMemo(
    () => new Aurora.Server("https://diamtestnet.diamcircle.io/"),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch account information
        const account = await server.accounts().accountId(accountId).call();
        setAccountData(account);

        // Fetch claimable balances
        const cbResponse = await server
          .claimableBalances()
          .claimant(accountId)
          .call();
        setClaimableBalances(cbResponse.records);

        // Fetch transactions
        const txResponse = await server
          .transactions()
          .forAccount(accountId)
          .call();
        setTransactions(txResponse.records);

        // Fetch operations
        const opResponse = await server
          .operations()
          .forAccount(accountId)
          .call();
        setOperations(opResponse.records);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchData();
    }
  }, [accountId, server]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const toggleAccountDetails = () => {
    setShowFullAccountData(!showFullAccountData);
  };

  // Helper functions
  const getNativeBalance = () => {
    if (accountData && accountData.balances) {
      const native = accountData.balances.find(
        (bal) => bal.asset_type === "native"
      );
      return native ? native.balance : "0";
    }
    return "N/A";
  };

  const getAccountSequence = () => {
    return accountData?.sequence || "N/A";
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress
          sx={{
            // Use a single color for the spinner or keep the default
            color: "rgba(15, 186, 209, 0.7)",
          }}
        />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
      {/* Main Paper Container */}
      <Paper
        elevation={4}
        sx={{
          backgroundColor: "transparent",
          color: "#fff",
          p: 3,
          borderRadius: 2,
        }}
      >
        {/* Account Info Card */}
        <Card
          sx={{
            backgroundColor: "transparent",
            mb: 3,
            borderRadius: 2,
            border: "1px solid #333",
          }}
        >
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Avatar sx={{ width: 64, height: 64, bgcolor: "#333" }}>
                  {accountId.charAt(0)}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", wordBreak: "break-all" }}
                >
                  {accountId}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Native Balance:</strong> {getNativeBalance()} DIAM
                </Typography>
                <Typography variant="body2">
                  <strong>Sequence:</strong> {getAccountSequence()}
                </Typography>
                {/* Explorer Link with gradient text */}
                <Typography
                  component="a"
                  href={`https://explorer.diamante.io/about-account/${accountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    ...gradientText,
                    textDecoration: "underline",
                    display: "inline-block",
                    mt: 1,
                  }}
                >
                  View on Explorer
                </Typography>
              </Grid>
              <Grid item>
                <IconButton
                  onClick={toggleAccountDetails}
                  sx={{ color: "#fff" }}
                >
                  {showFullAccountData ? <FiChevronUp /> : <FiChevronDown />}
                </IconButton>
              </Grid>
            </Grid>
            <Collapse in={showFullAccountData} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  backgroundColor: "#001518",
                  p: 2,
                  borderRadius: 1,
                  mt: 2,
                }}
              >
                <Typography sx={{ mb: 1 }}>
                  <strong>Account ID:</strong> {accountData.id}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Sequence:</strong> {accountData.sequence}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Subentry Count:</strong> {accountData.subentry_count}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Native Balance:</strong> {getNativeBalance()} DIAM
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        <Divider sx={{ mb: 2, borderColor: "#444" }} />

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          indicatorColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="Account Info" />
          <Tab label="Claimable Balances" />
          <Tab label="Transactions" />
          <Tab label="Operations" />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={selectedTab} index={0}>
          <Card
            sx={{
              backgroundColor: "transparent",
              borderRadius: 2,
              border: "1px solid #333",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Info
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Account ID:</strong> {accountData.id}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Sequence:</strong> {accountData.sequence}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Subentry Count:</strong> {accountData.subentry_count}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Native Balance:</strong> {getNativeBalance()} DIAM
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Claimable Balances
          </Typography>
          {claimableBalances.length > 0 ? (
            <List sx={{ mt: 1 }}>
              {claimableBalances.map((balance) => (
                <Card
                  key={balance.id}
                  sx={{
                    backgroundColor: "transparent",
                    borderRadius: 2,
                    border: "1px solid #333",
                  }}
                >
                  <CardContent>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Balance ID: {balance.id}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Amount: {balance.amount} | Asset:{" "}
                      {balance.asset_code || "native"}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </List>
          ) : (
            <Typography>No claimable balances found.</Typography>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Transactions
          </Typography>
          {transactions.length > 0 ? (
            <List sx={{ mt: 1 }}>
              {transactions.map((tx) => (
                <Card
                  key={tx.id}
                  sx={{
                    backgroundColor: "transparent",
                    borderRadius: 2,
                    border: "1px solid #333",
                  }}
                >
                  <CardContent>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Tx Hash:{" "}
                      <Typography
                        component="a"
                        href={`https://explorer.diamante.io/transactions/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          ...gradientText,
                          textDecoration: "underline",
                        }}
                      >
                        {tx.hash}
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </List>
          ) : (
            <Typography>No transactions found.</Typography>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Operations
          </Typography>
          {operations.length > 0 ? (
            <List sx={{ mt: 1 }}>
              {operations.map((op) => (
                <Card
                  key={op.id}
                  sx={{
                    backgroundColor: "transparent",
                    borderRadius: 2,
                    border: "1px solid #333",
                    mb: 2,
                  }}
                >
                  <CardContent>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Type: {op.type}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      ID: {op.id} | Created: {op.created_at}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </List>
          ) : (
            <Typography>No operations found.</Typography>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default DiamanteDashboard;
