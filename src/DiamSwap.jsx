import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Buffer } from "buffer";

// Polyfill Buffer if needed
if (!window.Buffer) {
  window.Buffer = Buffer;
}

// Create a dark theme using Material‑UI theming
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#121212", paper: "#1d1d1d" },
    text: { primary: "#ffffff", secondary: "#b0b0b0" },
    primary: { main: "#90caf9" },
    secondary: { main: "#f48fb1" },
  },
});

const CreateSendDemo = () => {
  // Global states for basic operations
  const [diamSdk, setDiamSdk] = useState(null);
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  // Keypairs for sender and receiver (for basic payments, offers, liquidity pool)
  const [senderKeypair, setSenderKeypair] = useState(null);
  const [receiverKeypair, setReceiverKeypair] = useState(null);

  // Payment state
  const [amount, setAmount] = useState("10");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Manage offers state
  const [offerStatus, setOfferStatus] = useState("");

  // Liquidity pool state
  const [poolIdHex, setPoolIdHex] = useState("");

  // --- DEX Flow States ---
  const [issuerKeypair, setIssuerKeypair] = useState(null);
  const [distributorKeypair, setDistributorKeypair] = useState(null);
  const [buyerKeypair, setBuyerKeypair] = useState(null);
  const [customAsset, setCustomAsset] = useState(null);

  // Diamante Friendbot URL for testnet
  const FRIEND_BOT_URL = "https://friendbot.diamcircle.io";

  // 1. Load Diamante SDK and initialize server
  useEffect(() => {
    import("diamnet-sdk")
      .then((sdkModule) => {
        const loadedSdk = sdkModule.default || sdkModule;
        setDiamSdk(loadedSdk);
        const srv = new loadedSdk.Aurora.Server("https://diamtestnet.diamcircle.io/");
        setServer(srv);
        setLog((prev) => prev + "Diamante SDK loaded and server initialized.\n");
      })
      .catch((err) => {
        console.error("Error loading diamnet-sdk:", err);
        setLog((prev) => prev + "Error loading diamnet-sdk: " + err.toString() + "\n");
      });
  }, []);

  // 2. Create two accounts for basic operations
  const createTwoAccounts = async () => {
    if (!diamSdk || !server) {
      setLog("SDK or server not ready.\n");
      return;
    }
    setLoading(true);
    setLog("");
    try {
      const sender = diamSdk.Keypair.random();
      const receiver = diamSdk.Keypair.random();
      setSenderKeypair(sender);
      setReceiverKeypair(receiver);
      setLog((prev) => prev + `Sender: ${sender.publicKey()}\n`);
      setLog((prev) => prev + `Receiver: ${receiver.publicKey()}\n`);

      const fundAccount = async (kp) => {
        const url = `${FRIEND_BOT_URL}?addr=${encodeURIComponent(kp.publicKey())}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`Friendbot failed for ${kp.publicKey()}`);
        }
        setLog((prev) => prev + `Funded: ${kp.publicKey()}\n`);
      };

      await fundAccount(sender);
      await fundAccount(receiver);
      setLog((prev) => prev + "Both accounts funded successfully.\n");
    } catch (error) {
      console.error("Error creating accounts:", error);
      setLog((prev) => prev + "Error creating accounts: " + error.message + "\n");
    } finally {
      setLoading(false);
    }
  };

  // 3. Send Payment (DIAM)
  const sendPayment = async () => {
    if (!diamSdk || !server || !senderKeypair || !receiverKeypair) {
      setPaymentStatus("Accounts or SDK not ready.");
      return;
    }
    setPaymentStatus("Preparing payment...");
    try {
      const senderAccount = await server.loadAccount(senderKeypair.publicKey());
      setPaymentStatus("Building transaction...");
      let transaction = new diamSdk.TransactionBuilder(senderAccount, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.payment({
            destination: receiverKeypair.publicKey(),
            asset: diamSdk.Asset.native(),
            amount: amount,
          })
        )
        .addMemo(diamSdk.Memo.text("Demo Payment"))
        .setTimeout(120)
        .build();
      transaction.sign(senderKeypair);
      setPaymentStatus("Submitting transaction...");
      const txResult = await server.submitTransaction(transaction);
      console.log("Payment transaction result:", txResult);
      setPaymentStatus(`Payment successful! Tx hash: ${txResult.hash}`);
    } catch (err) {
      console.error("Error sending payment:", err);
      setPaymentStatus("Error: " + err.message);
    }
  };

  // 4. Fetch Receiver Payments
  const fetchReceiverPayments = async () => {
    if (!diamSdk || !server || !receiverKeypair) return;
    setLoadingPayments(true);
    try {
      const resp = await server
        .payments()
        .forAccount(receiverKeypair.publicKey())
        .call();
      setPayments(resp.records);
    } catch (err) {
      console.error("Error fetching receiver payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  // 5. Manage Offers Section (for basic operations)
  const usdcAsset =
    diamSdk &&
    new diamSdk.Asset(
      "USDC",
      "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
    );
  const catAsset =
    diamSdk &&
    new diamSdk.Asset(
      "CAT",
      "GBHHU65KNWOSXH3HWPADXMONMIVDH4V4PRXSNBWFKVCEW27HEESJXZIH"
    );

  const establishTrustline = async (kp, asset) => {
    const acct = await server.loadAccount(kp.publicKey());
    const tx = new diamSdk.TransactionBuilder(acct, {
      fee: diamSdk.BASE_FEE,
      networkPassphrase: diamSdk.Networks.TESTNET,
    })
      .addOperation(diamSdk.Operation.changeTrust({ asset }))
      .setTimeout(30)
      .build();
    tx.sign(kp);
    const resp = await server.submitTransaction(tx);
    setLog((prev) => prev + `Trustline established for ${kp.publicKey()}: ${resp.hash}\n`);
  };

  const handleManageBuyOffer = async () => {
    if (!diamSdk || !server || !senderKeypair || !usdcAsset) {
      setOfferStatus("SDK, server, account, or USDC asset not ready.");
      return;
    }
    setOfferStatus("Establishing trustline for USDC...");
    try {
      await establishTrustline(senderKeypair, usdcAsset);
      setOfferStatus("Building manage buy offer transaction...");
      const account = await server.loadAccount(senderKeypair.publicKey());
      const transaction = new diamSdk.TransactionBuilder(account, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.manageBuyOffer({
            selling: diamSdk.Asset.native(),
            buying: usdcAsset,
            buyAmount: "100",
            price: "10",
            offerId: "0",
            source: senderKeypair.publicKey(),
          })
        )
        .setTimeout(30)
        .build();
      transaction.sign(senderKeypair);
      const res = await server.submitTransaction(transaction);
      console.log("Manage Buy Offer response:", res);
      setOfferStatus(`Manage Buy Offer successful! Tx hash: ${res.hash}`);
    } catch (err) {
      console.error("Error with manage buy offer:", err);
      setOfferStatus("Error: " + err.message);
    }
  };

  const handleManageSellOffer = async () => {
    if (!diamSdk || !server || !senderKeypair || !usdcAsset) {
      setOfferStatus("SDK, server, account, or USDC asset not ready.");
      return;
    }
    setOfferStatus("Establishing trustline for USDC...");
    try {
      await establishTrustline(senderKeypair, usdcAsset);
      setOfferStatus("Building manage sell offer transaction...");
      const account = await server.loadAccount(senderKeypair.publicKey());
      const transaction = new diamSdk.TransactionBuilder(account, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.manageSellOffer({
            selling: diamSdk.Asset.native(),
            buying: usdcAsset,
            amount: "1000",
            price: "0.1",
            offerId: "0",
            source: senderKeypair.publicKey(),
          })
        )
        .setTimeout(30)
        .build();
      transaction.sign(senderKeypair);
      const res = await server.submitTransaction(transaction);
      console.log("Manage Sell Offer response:", res);
      setOfferStatus(`Manage Sell Offer successful! Tx hash: ${res.hash}`);
    } catch (err) {
      console.error("Error with manage sell offer:", err);
      setOfferStatus("Error: " + err.message);
    }
  };

  const handlePassiveSellOffer = async () => {
    if (!diamSdk || !server || !senderKeypair || !catAsset) {
      setOfferStatus("SDK, server, account, or CAT asset not ready.");
      return;
    }
    setOfferStatus("Establishing trustline for CAT...");
    try {
      await establishTrustline(senderKeypair, catAsset);
      setOfferStatus("Building passive sell offer transaction...");
      const account = await server.loadAccount(senderKeypair.publicKey());
      const transaction = new diamSdk.TransactionBuilder(account, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.createPassiveSellOffer({
            selling: diamSdk.Asset.native(),
            buying: catAsset,
            amount: "1",
            price: "1",
            source: senderKeypair.publicKey(),
          })
        )
        .setTimeout(30)
        .build();
      transaction.sign(senderKeypair);
      const res = await server.submitTransaction(transaction);
      console.log("Passive Sell Offer response:", res);
      setOfferStatus(`Passive Sell Offer successful! Tx hash: ${res.hash}`);
    } catch (err) {
      console.error("Error with passive sell offer:", err);
      setOfferStatus("Error: " + err.message);
    }
  };

  // --- DEX Flow Operations ---
  // These use separate keypairs for issuer, distributor, and buyer.
  const initDEXFlow = async () => {
    if (!diamSdk || !server) {
      setDexLog("SDK or server not ready for DEX flow.\n");
      return;
    }
    setDexLog("");
    try {
      // Generate keypairs
      const issuer = diamSdk.Keypair.random();
      const distributor = diamSdk.Keypair.random();
      const buyer = diamSdk.Keypair.random();
      setIssuerKeypair(issuer);
      setDistributorKeypair(distributor);
      setBuyerKeypair(buyer);

      setDexLog((prev) => prev + `Issuer: ${issuer.publicKey()}\n`);
      setDexLog((prev) => prev + `Distributor: ${distributor.publicKey()}\n`);
      setDexLog((prev) => prev + `Buyer: ${buyer.publicKey()}\n`);

      // Fund accounts via Friendbot
      const fund = async (kp) => {
        const url = `${FRIEND_BOT_URL}?addr=${encodeURIComponent(kp.publicKey())}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Funding failed for ${kp.publicKey()}`);
        setDexLog((prev) => prev + `Funded: ${kp.publicKey()}\n`);
      };

      await fund(issuer);
      await fund(distributor);
      await fund(buyer);

      // Set up custom asset "TradeToken" issued by the issuer.
      const custom = new diamSdk.Asset("TradeToken", issuer.publicKey());
      setCustomAsset(custom);
      setDexLog((prev) => prev + "Custom asset (TradeToken) created.\n");

      // Establish trustlines for distributor and buyer to the custom asset.
      await establishTrustline(distributor, custom);
      await establishTrustline(buyer, custom);
      setDexLog((prev) => prev + "Trustlines for custom asset established for distributor and buyer.\n");
    } catch (error) {
      console.error("Error initializing DEX flow:", error);
      setDexLog((prev) => prev + "Error initializing DEX flow: " + error.message + "\n");
    }
  };

  const [dexLog, setDexLog] = useState("");

  const issueAsset = async () => {
    if (!diamSdk || !server || !issuerKeypair || !customAsset || !distributorKeypair) {
      setOfferStatus("DEX flow not fully initialized.");
      return;
    }
    try {
      const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
      const tx = new diamSdk.TransactionBuilder(issuerAccount, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.payment({
            destination: distributorKeypair.publicKey(),
            asset: customAsset,
            amount: "500",
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(issuerKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Asset issued to distributor. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error issuing asset:", error);
      setDexLog((prev) => prev + "Error issuing asset: " + error.message + "\n");
    }
  };

  const createSellOffer = async () => {
    if (!diamSdk || !server || !distributorKeypair || !customAsset) {
      setOfferStatus("DEX flow not fully initialized for sell offer.");
      return;
    }
    try {
      const account = await server.loadAccount(distributorKeypair.publicKey());
      const tx = new diamSdk.TransactionBuilder(account, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.manageSellOffer({
            selling: customAsset,
            buying: diamSdk.Asset.native(),
            amount: "100",
            price: "0.5",
            offerId: "0",
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(distributorKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Sell offer created. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error creating sell offer:", error);
      setDexLog((prev) => prev + "Error creating sell offer: " + error.message + "\n");
    }
  };

  const createBuyOffer = async () => {
    if (!diamSdk || !server || !buyerKeypair || !customAsset) {
      setOfferStatus("DEX flow not fully initialized for buy offer.");
      return;
    }
    try {
      const account = await server.loadAccount(buyerKeypair.publicKey());
      const tx = new diamSdk.TransactionBuilder(account, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.manageBuyOffer({
            selling: diamSdk.Asset.native(),
            buying: customAsset,
            buyAmount: "10",
            price: "0.5",
            offerId: "0",
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(buyerKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Buy offer created. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error creating buy offer:", error);
      setDexLog((prev) => prev + "Error creating buy offer: " + error.message + "\n");
    }
  };

  const pathPaymentStrictSend = async () => {
    if (!diamSdk || !server || !buyerKeypair || !customAsset || !distributorKeypair) {
      setDexLog((prev) => prev + "DEX flow not fully initialized for path payment strict send.\n");
      return;
    }
    try {
      const account = await server.loadAccount(buyerKeypair.publicKey());
      const tx = new diamSdk.TransactionBuilder(account, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.pathPaymentStrictSend({
            sendAsset: diamSdk.Asset.native(),
            sendAmount: "10",
            destination: distributorKeypair.publicKey(),
            destAsset: customAsset,
            destMin: "5",
            path: [diamSdk.Asset.native(), customAsset],
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(buyerKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Path Payment Strict Send executed. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error during path payment strict send:", error);
      setDexLog((prev) => prev + "Error during path payment strict send: " + error.message + "\n");
    }
  };

  const pathPaymentStrictReceive = async () => {
    if (!diamSdk || !server || !buyerKeypair || !customAsset || !distributorKeypair) {
      setDexLog((prev) => prev + "DEX flow not fully initialized for path payment strict receive.\n");
      return;
    }
    try {
      const account = await server.loadAccount(buyerKeypair.publicKey());
      const tx = new diamSdk.TransactionBuilder(account, {
        fee: diamSdk.BASE_FEE,
        networkPassphrase: diamSdk.Networks.TESTNET,
      })
        .addOperation(
          diamSdk.Operation.pathPaymentStrictReceive({
            sendAsset: diamSdk.Asset.native(),
            sendMax: "15",
            destination: distributorKeypair.publicKey(),
            destAsset: customAsset,
            destAmount: "10",
            path: [diamSdk.Asset.native(), customAsset],
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(buyerKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Path Payment Strict Receive executed. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error during path payment strict receive:", error);
      setDexLog((prev) => prev + "Error during path payment strict receive: " + error.message + "\n");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="md" sx={{ marginTop: "2rem", paddingBottom: "2rem" }}>
        {/* BASIC OPERATIONS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            1. Create Two Accounts (Sender & Receiver)
          </Typography>
          <Button variant="contained" onClick={createTwoAccounts} disabled={loading}>
            {loading ? "Processing..." : "Create Accounts"}
          </Button>
          <Box sx={{ marginTop: "1rem" }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", color: "white" }}>
              {log}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            2. Send Payment (DIAM)
          </Typography>
          {senderKeypair && receiverKeypair ? (
            <>
              <Typography variant="body2" sx={{ marginBottom: "0.5rem" }} color="white">
                <strong>Sender:</strong> {senderKeypair.publicKey()}
              </Typography>
              <Typography variant="body2" sx={{ marginBottom: "1rem" }} color="white">
                <strong>Receiver:</strong> {receiverKeypair.publicKey()}
              </Typography>
              <TextField
                label="Amount to Send"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ marginBottom: "1rem" }}
                InputLabelProps={{ style: { color: "white" } }}
                inputProps={{ style: { color: "white" } }}
              />
              <Button variant="contained" onClick={sendPayment}>
                Send Payment
              </Button>
              {paymentStatus && (
                <Typography variant="body2" sx={{ marginTop: "0.5rem" }} color="white">
                  {paymentStatus}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="error">
              Please create two accounts first.
            </Typography>
          )}
        </Box>

        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            3. Receiver’s Payments
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchReceiverPayments}
            disabled={loadingPayments}
            sx={{ marginBottom: "1rem", color: "white", borderColor: "white" }}
          >
            {loadingPayments ? "Loading..." : "Refresh Receiver Payments"}
          </Button>
          <List>
            {payments.map((payment, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`Payment: ${payment.amount} ${
                    payment.asset_type === "native"
                      ? "DIAM"
                      : `${payment.asset_code}:${payment.asset_issuer}`
                  }`}
                  secondary={`From: ${payment.from}`}
                  primaryTypographyProps={{ style: { color: "white" } }}
                  secondaryTypographyProps={{ style: { color: "white" } }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* MANAGE OFFERS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            4. Manage Offers
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: "1rem" }} color="white">
            We are using USDC as the counter asset for manage buy/sell offers, and CAT for passive sell offers.
          </Typography>
          <Box sx={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <Button variant="contained" onClick={handleManageBuyOffer}>
              Manage Buy Offer
            </Button>
            <Button variant="contained" onClick={handleManageSellOffer}>
              Manage Sell Offer
            </Button>
            <Button variant="contained" onClick={handlePassiveSellOffer}>
              Create Passive Sell Offer
            </Button>
          </Box>
          {offerStatus && (
            <Typography variant="body2" sx={{ marginTop: "0.5rem" }} color="white">
              {offerStatus}
            </Typography>
          )}
          <Box sx={{ marginTop: "1rem" }}>
            <Button variant="outlined" onClick={allowTrustForMyToken}>
              Allow Trust for MYTOKEN
            </Button>
          </Box>
        </Box>

        {/* LIQUIDITY POOL OPERATIONS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            5. Liquidity Pool Operations
          </Typography>
          <Box sx={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <Button variant="contained" onClick={addLiquidity}>
              Deposit Liquidity
            </Button>
            <Button variant="contained" onClick={withdrawLiquidity} disabled={!poolIdHex}>
              Withdraw Liquidity
            </Button>
          </Box>
          <Typography variant="body2" color="white">
            {poolIdHex
              ? `Current Liquidity Pool ID: ${poolIdHex}`
              : "No liquidity pool created yet."}
          </Typography>
        </Box>

        {/* DEX FLOW OPERATIONS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            6. DEX Flow Operations
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Button variant="contained" onClick={initDEXFlow}>
              Initialize DEX Flow
            </Button>
            <Button variant="contained" onClick={issueAsset}>
              Issue Asset (TradeToken)
            </Button>
            <Button variant="contained" onClick={createSellOffer}>
              Create Sell Offer (Distributor)
            </Button>
            <Button variant="contained" onClick={createBuyOffer}>
              Create Buy Offer (Buyer)
            </Button>
            <Button variant="contained" onClick={pathPaymentStrictSend}>
              Path Payment Strict Send
            </Button>
            <Button variant="contained" onClick={pathPaymentStrictReceive}>
              Path Payment Strict Receive
            </Button>
          </Box>
          <Box sx={{ marginTop: "1rem" }}>
            <Typography variant="body2" color="white">
              {dexLog || "DEX flow operations log will appear here."}
            </Typography>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

// --- DEX Flow Functions ---
const CreateSendDemoWrapper = () => {
  // We'll store DEX flow related global states in this wrapper and pass them down
  const [issuerKeypair, setIssuerKeypair] = useState(null);
  const [distributorKeypair, setDistributorKeypair] = useState(null);
  const [buyerKeypair, setBuyerKeypair] = useState(null);
  const [customAsset, setCustomAsset] = useState(null);
  const [dexLog, setDexLog] = useState("");

  // We'll use a ref to store these so that our inner functions can access them.
  // For simplicity, we attach these to the window object.
  useEffect(() => {
    window.demoIssuer = issuerKeypair;
    window.demoDistributor = distributorKeypair;
    window.demoBuyer = buyerKeypair;
    window.demoCustomAsset = customAsset;
    window.demoDexLog = setDexLog; // so inner functions can log
  }, [issuerKeypair, distributorKeypair, buyerKeypair, customAsset]);

  // Function to initialize DEX Flow
  const initDEXFlow = async () => {
    if (!window.demoServer || !window.demoDiamSdk) {
      setDexLog("DEX SDK or server not ready.");
      return;
    }
    const DiamSdk = window.demoDiamSdk;
    const server = window.demoServer;
    try {
      const issuer = DiamSdk.Keypair.random();
      const distributor = DiamSdk.Keypair.random();
      const buyer = DiamSdk.Keypair.random();
      setIssuerKeypair(issuer);
      setDistributorKeypair(distributor);
      setBuyerKeypair(buyer);
      setDexLog((prev) => prev + `Issuer: ${issuer.publicKey()}\n`);
      setDexLog((prev) => prev + `Distributor: ${distributor.publicKey()}\n`);
      setDexLog((prev) => prev + `Buyer: ${buyer.publicKey()}\n`);

      const fund = async (kp) => {
        const url = `${"https://friendbot.diamcircle.io"}?addr=${encodeURIComponent(kp.publicKey())}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Funding failed for ${kp.publicKey()}`);
        setDexLog((prev) => prev + `Funded: ${kp.publicKey()}\n`);
      };

      await fund(issuer);
      await fund(distributor);
      await fund(buyer);

      const custom = new DiamSdk.Asset("TradeToken", issuer.publicKey());
      setCustomAsset(custom);
      setDexLog((prev) => prev + "Custom asset (TradeToken) created.\n");

      // Establish trustlines for distributor and buyer for the custom asset.
      await establishTrustline(distributor, custom);
      await establishTrustline(buyer, custom);
      setDexLog((prev) => prev + "Trustlines for custom asset established for distributor and buyer.\n");
    } catch (error) {
      console.error("Error initializing DEX flow:", error);
      setDexLog((prev) => prev + "Error initializing DEX flow: " + error.message + "\n");
    }
  };

  // Issue Asset: Issuer sends 500 TradeToken to distributor.
  const issueAsset = async () => {
    const DiamSdk = window.demoDiamSdk;
    const server = window.demoServer;
    if (!issuerKeypair || !customAsset || !distributorKeypair) {
      setDexLog((prev) => prev + "DEX flow not fully initialized for issuing asset.\n");
      return;
    }
    try {
      const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
      const tx = new DiamSdk.TransactionBuilder(issuerAccount, {
        fee: DiamSdk.BASE_FEE,
        networkPassphrase: DiamSdk.Networks.TESTNET,
      })
        .addOperation(
          DiamSdk.Operation.payment({
            destination: distributorKeypair.publicKey(),
            asset: customAsset,
            amount: "500",
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(issuerKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Asset issued to distributor. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error issuing asset:", error);
      setDexLog((prev) => prev + "Error issuing asset: " + error.message + "\n");
    }
  };

  // Create Sell Offer: Distributor creates a sell offer for TradeToken.
  const createSellOffer = async () => {
    const DiamSdk = window.demoDiamSdk;
    const server = window.demoServer;
    if (!distributorKeypair || !customAsset) {
      setDexLog((prev) => prev + "DEX flow not fully initialized for sell offer.\n");
      return;
    }
    try {
      const account = await server.loadAccount(distributorKeypair.publicKey());
      const tx = new DiamSdk.TransactionBuilder(account, {
        fee: DiamSdk.BASE_FEE,
        networkPassphrase: DiamSdk.Networks.TESTNET,
      })
        .addOperation(
          DiamSdk.Operation.manageSellOffer({
            selling: customAsset,
            buying: DiamSdk.Asset.native(),
            amount: "100",
            price: "0.5",
            offerId: "0",
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(distributorKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Sell offer created. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error creating sell offer:", error);
      setDexLog((prev) => prev + "Error creating sell offer: " + error.message + "\n");
    }
  };

  // Create Buy Offer: Buyer creates a buy offer for TradeToken.
  const createBuyOffer = async () => {
    const DiamSdk = window.demoDiamSdk;
    const server = window.demoServer;
    if (!buyerKeypair || !customAsset) {
      setDexLog((prev) => prev + "DEX flow not fully initialized for buy offer.\n");
      return;
    }
    try {
      const account = await server.loadAccount(buyerKeypair.publicKey());
      const tx = new DiamSdk.TransactionBuilder(account, {
        fee: DiamSdk.BASE_FEE,
        networkPassphrase: DiamSdk.Networks.TESTNET,
      })
        .addOperation(
          DiamSdk.Operation.manageBuyOffer({
            selling: DiamSdk.Asset.native(),
            buying: customAsset,
            buyAmount: "10",
            price: "0.5",
            offerId: "0",
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(buyerKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Buy offer created. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error creating buy offer:", error);
      setDexLog((prev) => prev + "Error creating buy offer: " + error.message + "\n");
    }
  };

  // Path Payment Strict Send: Buyer sends native DIAM, receiving TradeToken.
  const pathPaymentStrictSend = async () => {
    const DiamSdk = window.demoDiamSdk;
    const server = window.demoServer;
    if (!buyerKeypair || !customAsset || !distributorKeypair) {
      setDexLog((prev) => prev + "DEX flow not fully initialized for path payment strict send.\n");
      return;
    }
    try {
      const account = await server.loadAccount(buyerKeypair.publicKey());
      const tx = new DiamSdk.TransactionBuilder(account, {
        fee: DiamSdk.BASE_FEE,
        networkPassphrase: DiamSdk.Networks.TESTNET,
      })
        .addOperation(
          DiamSdk.Operation.pathPaymentStrictSend({
            sendAsset: DiamSdk.Asset.native(),
            sendAmount: "10",
            destination: distributorKeypair.publicKey(),
            destAsset: customAsset,
            destMin: "5",
            path: [DiamSdk.Asset.native(), customAsset],
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(buyerKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Path Payment Strict Send executed. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error during path payment strict send:", error);
      setDexLog((prev) => prev + "Error during path payment strict send: " + error.message + "\n");
    }
  };

  // Path Payment Strict Receive: Buyer sends up to sendMax DIAM to receive a fixed amount of TradeToken.
  const pathPaymentStrictReceive = async () => {
    const DiamSdk = window.demoDiamSdk;
    const server = window.demoServer;
    if (!buyerKeypair || !customAsset || !distributorKeypair) {
      setDexLog((prev) => prev + "DEX flow not fully initialized for path payment strict receive.\n");
      return;
    }
    try {
      const account = await server.loadAccount(buyerKeypair.publicKey());
      const tx = new DiamSdk.TransactionBuilder(account, {
        fee: DiamSdk.BASE_FEE,
        networkPassphrase: DiamSdk.Networks.TESTNET,
      })
        .addOperation(
          DiamSdk.Operation.pathPaymentStrictReceive({
            sendAsset: DiamSdk.Asset.native(),
            sendMax: "15",
            destination: distributorKeypair.publicKey(),
            destAsset: customAsset,
            destAmount: "10",
            path: [DiamSdk.Asset.native(), customAsset],
          })
        )
        .setTimeout(100)
        .build();
      tx.sign(buyerKeypair);
      const res = await server.submitTransaction(tx);
      setDexLog((prev) => prev + `Path Payment Strict Receive executed. Tx hash: ${res.hash}\n`);
    } catch (error) {
      console.error("Error during path payment strict receive:", error);
      setDexLog((prev) => prev + "Error during path payment strict receive: " + error.message + "\n");
    }
  };

  // Expose DEX flow functions to window for our UI buttons
  window.demoDiamSdk = diamSdk;
  window.demoServer = server;
  window.demoSender = senderKeypair;

  return (
    <ThemeProvider theme={darkTheme}>
      <Container maxWidth="md" sx={{ marginTop: "2rem", paddingBottom: "2rem" }}>
        {/* BASIC OPERATIONS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            1. Create Two Accounts (Sender & Receiver)
          </Typography>
          <Button variant="contained" onClick={createTwoAccounts} disabled={loading}>
            {loading ? "Processing..." : "Create Accounts"}
          </Button>
          <Box sx={{ marginTop: "1rem" }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", color: "white" }}>
              {log}
            </Typography>
          </Box>
        </Box>

        {/* SEND PAYMENT SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            2. Send Payment (DIAM)
          </Typography>
          {senderKeypair && receiverKeypair ? (
            <>
              <Typography variant="body2" sx={{ marginBottom: "0.5rem" }} color="white">
                <strong>Sender:</strong> {senderKeypair.publicKey()}
              </Typography>
              <Typography variant="body2" sx={{ marginBottom: "1rem" }} color="white">
                <strong>Receiver:</strong> {receiverKeypair.publicKey()}
              </Typography>
              <TextField
                label="Amount to Send"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ marginBottom: "1rem" }}
                InputLabelProps={{ style: { color: "white" } }}
                inputProps={{ style: { color: "white" } }}
              />
              <Button variant="contained" onClick={sendPayment}>
                Send Payment
              </Button>
              {paymentStatus && (
                <Typography variant="body2" sx={{ marginTop: "0.5rem" }} color="white">
                  {paymentStatus}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="error">
              Please create two accounts first.
            </Typography>
          )}
        </Box>

        {/* RECEIVER PAYMENTS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            3. Receiver’s Payments
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchReceiverPayments}
            disabled={loadingPayments}
            sx={{ marginBottom: "1rem", color: "white", borderColor: "white" }}
          >
            {loadingPayments ? "Loading..." : "Refresh Receiver Payments"}
          </Button>
          <List>
            {payments.map((payment, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`Payment: ${payment.amount} ${
                    payment.asset_type === "native"
                      ? "DIAM"
                      : `${payment.asset_code}:${payment.asset_issuer}`
                  }`}
                  secondary={`From: ${payment.from}`}
                  primaryTypographyProps={{ style: { color: "white" } }}
                  secondaryTypographyProps={{ style: { color: "white" } }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* MANAGE OFFERS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            4. Manage Offers
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: "1rem" }} color="white">
            We are using USDC as the counter asset for manage buy/sell offers, and CAT for passive sell offers.
          </Typography>
          <Box sx={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <Button variant="contained" onClick={handleManageBuyOffer}>
              Manage Buy Offer
            </Button>
            <Button variant="contained" onClick={handleManageSellOffer}>
              Manage Sell Offer
            </Button>
            <Button variant="contained" onClick={handlePassiveSellOffer}>
              Create Passive Sell Offer
            </Button>
          </Box>
          {offerStatus && (
            <Typography variant="body2" sx={{ marginTop: "0.5rem" }} color="white">
              {offerStatus}
            </Typography>
          )}
          <Box sx={{ marginTop: "1rem" }}>
            <Button variant="outlined" onClick={allowTrustForMyToken}>
              Allow Trust for MYTOKEN
            </Button>
          </Box>
        </Box>

        {/* LIQUIDITY POOL OPERATIONS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            5. Liquidity Pool Operations
          </Typography>
          <Box sx={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <Button variant="contained" onClick={addLiquidity}>
              Deposit Liquidity
            </Button>
            <Button variant="contained" onClick={withdrawLiquidity} disabled={!poolIdHex}>
              Withdraw Liquidity
            </Button>
          </Box>
          <Typography variant="body2" color="white">
            {poolIdHex
              ? `Current Liquidity Pool ID: ${poolIdHex}`
              : "No liquidity pool created yet."}
          </Typography>
        </Box>

        {/* DEX FLOW OPERATIONS SECTION */}
        <Box sx={{ backgroundColor: "black", padding: "1.5rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <Typography variant="h5" gutterBottom color="white">
            6. DEX Flow Operations
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Button variant="contained" onClick={initDEXFlow}>
              Initialize DEX Flow
            </Button>
            <Button variant="contained" onClick={issueAsset}>
              Issue Asset (TradeToken)
            </Button>
            <Button variant="contained" onClick={createSellOffer}>
              Create Sell Offer (Distributor)
            </Button>
            <Button variant="contained" onClick={createBuyOffer}>
              Create Buy Offer (Buyer)
            </Button>
            <Button variant="contained" onClick={pathPaymentStrictSend}>
              Path Payment Strict Send
            </Button>
            <Button variant="contained" onClick={pathPaymentStrictReceive}>
              Path Payment Strict Receive
            </Button>
          </Box>
          <Box sx={{ marginTop: "1rem" }}>
            <Typography variant="body2" color="white">
              {dexLog || "DEX flow log will appear here."}
            </Typography>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};


// DEX Flow functions defined in the global scope for simplicity.
// In a production app, these would be passed via context or props.
const initDEXFlow = async () => {
  if (!window.demoServer || !window.demoDiamSdk) {
    window.demoDexLog((prev) => prev + "DEX SDK or server not ready.\n");
    return;
  }
  const DiamSdk = window.demoDiamSdk;
  const server = window.demoServer;
  try {
    const issuer = DiamSdk.Keypair.random();
    const distributor = DiamSdk.Keypair.random();
    const buyer = DiamSdk.Keypair.random();
    // Set global DEX flow keypairs
    window.demoIssuer = issuer;
    window.demoDistributor = distributor;
    window.demoBuyer = buyer;
    window.demoDexLog((prev) => prev + `Issuer: ${issuer.publicKey()}\n`);
    window.demoDexLog((prev) => prev + `Distributor: ${distributor.publicKey()}\n`);
    window.demoDexLog((prev) => prev + `Buyer: ${buyer.publicKey()}\n`);

    const fund = async (kp) => {
      const url = `${"https://friendbot.diamcircle.io"}?addr=${encodeURIComponent(kp.publicKey())}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Funding failed for ${kp.publicKey()}`);
      window.demoDexLog((prev) => prev + `Funded: ${kp.publicKey()}\n`);
    };

    await fund(issuer);
    await fund(distributor);
    await fund(buyer);

    const custom = new DiamSdk.Asset("TradeToken", issuer.publicKey());
    window.demoCustomAsset = custom;
    window.demoDexLog((prev) => prev + "Custom asset (TradeToken) created.\n");

    // Establish trustlines for distributor and buyer to the custom asset.
    await establishTrustline(distributor, custom);
    await establishTrustline(buyer, custom);
    window.demoDexLog((prev) => prev + "Trustlines for custom asset established for distributor and buyer.\n");
  } catch (error) {
    console.error("Error initializing DEX flow:", error);
    window.demoDexLog((prev) => prev + "Error initializing DEX flow: " + error.message + "\n");
  }
};

const issueAsset = async () => {
  const DiamSdk = window.demoDiamSdk;
  const server = window.demoServer;
  const issuer = window.demoIssuer;
  const distributor = window.demoDistributor;
  const custom = window.demoCustomAsset;
  if (!issuer || !custom || !distributor) {
    window.demoDexLog((prev) => prev + "DEX flow not fully initialized for issuing asset.\n");
    return;
  }
  try {
    const issuerAccount = await server.loadAccount(issuer.publicKey());
    const tx = new DiamSdk.TransactionBuilder(issuerAccount, {
      fee: DiamSdk.BASE_FEE,
      networkPassphrase: DiamSdk.Networks.TESTNET,
    })
      .addOperation(
        DiamSdk.Operation.payment({
          destination: distributor.publicKey(),
          asset: custom,
          amount: "500",
        })
      )
      .setTimeout(100)
      .build();
    tx.sign(issuer);
    const res = await server.submitTransaction(tx);
    window.demoDexLog((prev) => prev + `Asset issued to distributor. Tx hash: ${res.hash}\n`);
  } catch (error) {
    console.error("Error issuing asset:", error);
    window.demoDexLog((prev) => prev + "Error issuing asset: " + error.message + "\n");
  }
};

const createSellOffer = async () => {
  const DiamSdk = window.demoDiamSdk;
  const server = window.demoServer;
  const distributor = window.demoDistributor;
  const custom = window.demoCustomAsset;
  if (!distributor || !custom) {
    window.demoDexLog((prev) => prev + "DEX flow not fully initialized for sell offer.\n");
    return;
  }
  try {
    const account = await server.loadAccount(distributor.publicKey());
    const tx = new DiamSdk.TransactionBuilder(account, {
      fee: DiamSdk.BASE_FEE,
      networkPassphrase: DiamSdk.Networks.TESTNET,
    })
      .addOperation(
        DiamSdk.Operation.manageSellOffer({
          selling: custom,
          buying: DiamSdk.Asset.native(),
          amount: "100",
          price: "0.5",
          offerId: "0",
        })
      )
      .setTimeout(100)
      .build();
    tx.sign(distributor);
    const res = await server.submitTransaction(tx);
    window.demoDexLog((prev) => prev + `Sell offer created. Tx hash: ${res.hash}\n`);
  } catch (error) {
    console.error("Error creating sell offer:", error);
    window.demoDexLog((prev) => prev + "Error creating sell offer: " + error.message + "\n");
  }
};

const createBuyOffer = async () => {
  const DiamSdk = window.demoDiamSdk;
  const server = window.demoServer;
  const buyer = window.demoBuyer;
  const custom = window.demoCustomAsset;
  if (!buyer || !custom) {
    window.demoDexLog((prev) => prev + "DEX flow not fully initialized for buy offer.\n");
    return;
  }
  try {
    const account = await server.loadAccount(buyer.publicKey());
    const tx = new DiamSdk.TransactionBuilder(account, {
      fee: DiamSdk.BASE_FEE,
      networkPassphrase: DiamSdk.Networks.TESTNET,
    })
      .addOperation(
        DiamSdk.Operation.manageBuyOffer({
          selling: DiamSdk.Asset.native(),
          buying: custom,
          buyAmount: "10",
          price: "0.5",
          offerId: "0",
        })
      )
      .setTimeout(100)
      .build();
    tx.sign(buyer);
    const res = await server.submitTransaction(tx);
    window.demoDexLog((prev) => prev + `Buy offer created. Tx hash: ${res.hash}\n`);
  } catch (error) {
    console.error("Error creating buy offer:", error);
    window.demoDexLog((prev) => prev + "Error creating buy offer: " + error.message + "\n");
  }
};

const pathPaymentStrictSend = async () => {
  const DiamSdk = window.demoDiamSdk;
  const server = window.demoServer;
  const buyer = window.demoBuyer;
  const custom = window.demoCustomAsset;
  const distributor = window.demoDistributor;
  if (!buyer || !custom || !distributor) {
    window.demoDexLog((prev) => prev + "DEX flow not fully initialized for path payment strict send.\n");
    return;
  }
  try {
    const account = await server.loadAccount(buyer.publicKey());
    const tx = new DiamSdk.TransactionBuilder(account, {
      fee: DiamSdk.BASE_FEE,
      networkPassphrase: DiamSdk.Networks.TESTNET,
    })
      .addOperation(
        DiamSdk.Operation.pathPaymentStrictSend({
          sendAsset: DiamSdk.Asset.native(),
          sendAmount: "10",
          destination: distributor.publicKey(),
          destAsset: custom,
          destMin: "5",
          path: [DiamSdk.Asset.native(), custom],
        })
      )
      .setTimeout(100)
      .build();
    tx.sign(buyer);
    const res = await server.submitTransaction(tx);
    window.demoDexLog((prev) => prev + `Path Payment Strict Send executed. Tx hash: ${res.hash}\n`);
  } catch (error) {
    console.error("Error during path payment strict send:", error);
    window.demoDexLog((prev) => prev + "Error during path payment strict send: " + error.message + "\n");
  }
};

const pathPaymentStrictReceive = async () => {
  const DiamSdk = window.demoDiamSdk;
  const server = window.demoServer;
  const buyer = window.demoBuyer;
  const custom = window.demoCustomAsset;
  const distributor = window.demoDistributor;
  if (!buyer || !custom || !distributor) {
    window.demoDexLog((prev) => prev + "DEX flow not fully initialized for path payment strict receive.\n");
    return;
  }
  try {
    const account = await server.loadAccount(buyer.publicKey());
    const tx = new DiamSdk.TransactionBuilder(account, {
      fee: DiamSdk.BASE_FEE,
      networkPassphrase: DiamSdk.Networks.TESTNET,
    })
      .addOperation(
        DiamSdk.Operation.pathPaymentStrictReceive({
          sendAsset: DiamSdk.Asset.native(),
          sendMax: "15",
          destination: distributor.publicKey(),
          destAsset: custom,
          destAmount: "10",
          path: [DiamSdk.Asset.native(), custom],
        })
      )
      .setTimeout(100)
      .build();
    tx.sign(buyer);
    const res = await server.submitTransaction(tx);
    window.demoDexLog((prev) => prev + `Path Payment Strict Receive executed. Tx hash: ${res.hash}\n`);
  } catch (error) {
    console.error("Error during path payment strict receive:", error);
    window.demoDexLog((prev) => prev + "Error during path payment strict receive: " + error.message + "\n");
  }
};

export default CreateSendDemoWrapper;
