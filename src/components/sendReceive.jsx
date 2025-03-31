import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Aurora,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
  Asset,
  Memo,
  NotFoundError,
} from "diamnet-sdk";

// Helper TabPanel component for tabbed UI
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function App() {
  const [tabValue, setTabValue] = useState(0);
    const [secret, setSecret] = useState(
    "SD75G4MIKTXGW4KHJCCJ2TVLNIRVN2W5PDIU6A6645XIBZ4EUHKVAQND"
  );
  const [destination, setDestination] = useState(
    "GC4ZJJRESNHECNST6HA5HUBYAUUGETMKGESJMEKYQLYBCQXTLYNVCUY7"
  );
  const [amount, setAmount] = useState("10");
  const [memo, setMemo] = useState("Test Transaction");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState("");
  const [sendError, setSendError] = useState("");

  // State for Payment History (simulate incoming payments)
  const [payments, setPayments] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Utility function to ensure the destination account exists.
  // If not, it calls Friendbot (for testnet) to fund and create it.
  const ensureDestinationAccount = async (server, destination) => {
    try {
      await server.loadAccount(destination);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Destination account does not exist; use Friendbot to fund it.
        const friendbotUrl = `https://friendbot.diamtestnet.diamcircle.io/?addr=${destination}`;
        const response = await fetch(friendbotUrl);
        if (!response.ok) {
          throw new Error("Failed to fund destination account via Friendbot");
        }
        // Wait briefly to let the network update.
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return true;
      } else {
        throw error;
      }
    }
  };

  // Handler for sending a payment.
  const handleSendPayment = async () => {
    setSendError("");
    setSendResult("");
    setSending(true);
    try {
      const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
      const sourceKeys = Keypair.fromSecret(secret);

      // Ensure the destination account exists, or create it via Friendbot.
      await ensureDestinationAccount(server, destination);

      // Load the source account.
      const sourceAccount = await server.loadAccount(sourceKeys.publicKey());

      // Build the transaction.
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: "Diamante Testnet 2024",
      })
        .addOperation(
          Operation.payment({
            destination: destination,
            asset: Asset.native(),
            amount: amount,
          })
        )
        .addMemo(Memo.text(memo))
        .setTimeout(180)
        .build();

      // Sign and submit the transaction.
      transaction.sign(sourceKeys);
      const result = await server.submitTransaction(transaction);
      setSendResult(result.hash);
    } catch (err) {
      console.error("Payment error:", err);
      setSendError(err.message || "Payment failed");
    } finally {
      setSending(false);
    }
  };

  // Simulate receiving payments.
  // In production, you would subscribe to the payments stream using:
  // server.payments().forAccount(accountId).stream({...})
  useEffect(() => {
    const interval = setInterval(() => {
      const newPayment = {
        id: Date.now(),
        from: "GC...SENDER",
        amount: (Math.random() * 10).toFixed(2),
        asset: "DIAM",
        memo: "Received Payment",
      };
      setPayments((prev) => [newPayment, ...prev]);
    }, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        sx={{
          p: 3,
          backgroundColor: "#121212",
          color: "#fff",
          borderRadius: 2,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          textColor="inherit"
          indicatorColor="primary"
        >
          <Tab label="Send Payment" />
          <Tab label="Payment History" />
        </Tabs>
        <Divider sx={{ my: 2, borderColor: "#444" }} />
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" align="center" gutterBottom>
            Send Payment
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Secret Key"
              variant="outlined"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "#aaa" } }}
              inputProps={{ style: { color: "#fff" } }}
            />
            <TextField
              label="Destination Account"
              variant="outlined"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "#aaa" } }}
              inputProps={{ style: { color: "#fff" } }}
            />
            <TextField
              label="Amount"
              variant="outlined"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "#aaa" } }}
              inputProps={{ style: { color: "#fff" } }}
            />
            <TextField
              label="Memo (optional)"
              variant="outlined"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "#aaa" } }}
              inputProps={{ style: { color: "#fff" } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendPayment}
              disabled={sending}
            >
              {sending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Send Payment"
              )}
            </Button>
            {sendResult && (
              <Typography variant="body1" sx={{ color: "#4caf50" }}>
                Payment successful: {sendResult}
              </Typography>
            )}
            {sendError && (
              <Typography variant="body1" sx={{ color: "#f44336" }}>
                Error: {sendError}
              </Typography>
            )}
          </Stack>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" align="center" gutterBottom>
            Payment History
          </Typography>
          {payments.length === 0 ? (
            <Typography variant="body1" align="center">
              No payments received yet.
            </Typography>
          ) : (
            <List>
              {payments.map((payment) => (
                <ListItem key={payment.id} divider>
                  <ListItemText
                    primary={`From: ${payment.from} | ${payment.amount} ${payment.asset}`}
                    secondary={payment.memo}
                    primaryTypographyProps={{ style: { color: "#fff" } }}
                    secondaryTypographyProps={{ style: { color: "#aaa" } }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
}
