import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  List,
  Card,
  CardContent,
  Tabs,
  Tab,
  Avatar,
  Grid,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
  Table,
  TableHead,
  TableBody,
} from "@mui/material";
import { Aurora } from "diamnet-sdk";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

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

const gradientText = {
  backgroundImage:
    "linear-gradient(270deg, rgb(15, 186, 209) 0%, rgb(255, 255, 255) 48.7783%, rgb(15, 186, 209) 100%)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

export default function DiamanteDashboard() {
  const accountId = localStorage.getItem("diamPublicKey");
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState(null);
  const [claimableBalances, setClaimableBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [operations, setOperations] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showFullAccountData, setShowFullAccountData] = useState(false);

  // NEW: We'll store all "ops per transaction" in a dictionary, keyed by tx.id
  const [txOps, setTxOps] = useState({});

  const server = useMemo(
    () => new Aurora.Server("https://diamtestnet.diamcircle.io/"),
    []
  );

  // Helper function to truncate a hash string: first 4 and last 4 characters.
  const truncateHash = (hash) => {
    if (!hash || hash.length < 8) return hash;
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Account Info
        const account = await server.accounts().accountId(accountId).call();
        setAccountData(account);

        // 2. Claimable Balances
        const cbResponse = await server
          .claimableBalances()
          .claimant(accountId)
          .call();
        setClaimableBalances(cbResponse.records);

        // 3. Transactions
        const txResponse = await server
          .transactions()
          .forAccount(accountId)
          .call();
        setTransactions(txResponse.records);

        // 4. Operations
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

  // ❗️ NEW: When transactions change, fetch operations for each transaction so we can see "Type/To/Amount"
  useEffect(() => {
    async function loadTxOps() {
      if (!transactions || transactions.length === 0) return;
      for (const tx of transactions) {
        try {
          // For each transaction, fetch its operations
          const opsResp = await server
            .operations()
            .forTransaction(tx.hash)
            .call();
          setTxOps((prev) => ({ ...prev, [tx.id]: opsResp.records }));
        } catch (error) {
          console.error("Error fetching ops for tx:", tx.hash, error);
        }
      }
    }
    loadTxOps();
  }, [transactions, server]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const toggleAccountDetails = () => {
    setShowFullAccountData(!showFullAccountData);
  };

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
            color: "rgba(15, 186, 209, 0.7)",
          }}
        />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
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
                  {accountId?.charAt(0) || "?"}
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
                <Typography
                  component="a"
                  href={`https://testnetexplorer.diamante.io/about-account/${accountId}`}
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
            <Box
              sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}
            >
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
            </Box>
          ) : (
            <Typography>No claimable balances found.</Typography>
          )}
        </TabPanel>

        {/* TRANSACTIONS TAB UPDATED */}
        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Transactions
          </Typography>

          <TabPanel value={selectedTab} index={2}>
            {transactions.length === 0 ? (
              <Typography>No transactions found.</Typography>
            ) : (
              // Create a table with columns: From, Hash, Type, To, Amount
              <Table sx={{ mt: 1, border: "1px solid #333" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#fff" }}>From</TableCell>
                    <TableCell sx={{ color: "#fff" }}>Hash</TableCell>
                    <TableCell sx={{ color: "#fff" }}>Type</TableCell>
                    <TableCell sx={{ color: "#fff" }}>To</TableCell>
                    <TableCell sx={{ color: "#fff" }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => {
                    const opsForThisTx = txOps[tx.id] || [];

                    // If no operations, show a single row.
                    if (opsForThisTx.length === 0) {
                      return (
                        <TableRow key={tx.id}>
                          {/* FROM */}
                          <TableCell sx={{ color: "#fff" }}>
                            {tx.source_account}
                          </TableCell>

                          {/* HASH */}
                          <TableCell sx={{ color: "#fff" }}>
                            <Typography
                              component="a"
                              href={`https://testnetexplorer.diamante.io/about-tx-hash/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                ...gradientText,
                                textDecoration: "underline",
                              }}
                            >
                              {truncateHash(tx.hash)}
                            </Typography>
                          </TableCell>

                          {/* TYPE / TO / AMOUNT */}
                          <TableCell sx={{ color: "#fff" }} colSpan={3}>
                            No operations found
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Otherwise, create one table row per operation in this transaction.
                    return opsForThisTx.map((op) => {
                      const { type, id: opId } = op;
                      let from = tx.source_account;
                      let to = "";
                      let amount = "";

                      switch (op.type) {
                        case "create_account":
                          to = op.account;
                          amount = op.starting_balance;
                          break;
                        case "payment":
                          to = op.to;
                          amount = op.amount;
                          break;
                        case "manage_sell_offer":
                          to = "Orderbook";
                          amount = op.amount || "N/A";
                          break;
                        case "change_trust":
                          to = "-";
                          amount = "N/A";
                          break;
                        default:
                          to = "-";
                          amount = "N/A";
                          break;
                      }

                      return (
                        <TableRow key={opId}>
                          {/* FROM */}
                          <TableCell sx={{ color: "#fff" }}>
                            {" "}
                            {truncateHash(from)}
                          </TableCell>

                          {/* HASH */}
                          <TableCell sx={{ color: "#fff" }}>
                            <Typography
                              component="a"
                              href={`https://testnetexplorer.diamante.io/about-tx-hash/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                ...gradientText,
                                textDecoration: "underline",
                              }}
                            >
                              {truncateHash(tx.hash)}
                            </Typography>
                          </TableCell>

                          {/* TYPE */}
                          <TableCell sx={{ color: "#fff" }}>{type}</TableCell>

                          {/* TO */}
                          <TableCell sx={{ color: "#fff" }}>
                            {truncateHash(to)}
                          </TableCell>

                          {/* AMOUNT */}
                          <TableCell sx={{ color: "#fff" }}>{amount}</TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            )}
          </TabPanel>
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Operations
          </Typography>
          {operations.length > 0 ? (
            <Box
              sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}
            >
              {operations.map((op) => (
                <Card
                  key={op.id}
                  sx={{
                    backgroundColor: "transparent",
                    borderRadius: 2,
                    border: "1px solid #333",
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
            </Box>
          ) : (
            <Typography>No operations found.</Typography>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
}
