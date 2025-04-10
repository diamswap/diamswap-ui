// src/components/SwapPage.jsx
import React, { useState, useEffect } from "react";
import {
  Asset,
  Aurora,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  LiquidityPoolAsset,
} from "diamnet-sdk";
import { Buffer } from "buffer";
import {
  Container,
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
// Using PinataSDK from pinata-web3 is not needed here as we call the REST API directly.
import { PinataSDK } from "pinata-web3";

// Polyfill Buffer if needed
if (!window.Buffer) {
  window.Buffer = Buffer;
}

// ---------------------------------------------
// Configuration & Setup
// ---------------------------------------------
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// Hard-coded issuer public key (fallback) for TradeToken.
const realIssuerPubKey =
  "GBPTZYVUREREXTENTMWDB2PHJSSXLX4VHDPMA5O56MDNNJTA752EKS7X";
// Pre-create the fallback tradeToken asset.
const fallbackTradeToken = new Asset("TradeToken", realIssuerPubKey);


// ---------------------------------------------
// Helper: Update Transaction History via Pinata REST API and Local Storage
// ---------------------------------------------
async function updateTransactionHistory(transactionData) {
  const PINATA_JWT =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNTc5OGJmMS00OThhLTRkZTgtODc1MS1hMDA1OWRiNWM5ZDciLCJlbWFpbCI6Im5pc2hnYWJhLmFpQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI2YTkxOGU2NmFjMGVkNTM4Yzk2YSIsInNjb3BlZEtleVNlY3JldCI6IjRlYzdkYjEyMGYzOTNjOGQ0ZmQ0MGRmNTU4YmMwNzEzMGExMGQ0NTQwYTMzYzVhYTFjMTIzNTVhNTQ4ZDgzYWYiLCJleHAiOjE3Njk0NjQ4NTN9.DYTlB2r8rPbpWzaWPGiaYyj9KJZwxEVV4LwYSreL9Uk";
  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({ pinataContent: transactionData }),
    });
    const result = await response.json();
    console.log("Pinned transaction data to IPFS:", result);
    const history = JSON.parse(localStorage.getItem("txHistory") || "[]");
    history.push({ ...transactionData, ipfsHash: result.IpfsHash });
    localStorage.setItem("txHistory", JSON.stringify(history));
    return result;
  } catch (error) {
    console.error("Error pinning transaction data to Pinata:", error);
  }
}

// ---------------------------------------------
// Diamnet Transaction Functions
// ---------------------------------------------
const friendbotFund = async (publicKey) => {
  try {
    const resp = await fetch(`${friendbotUrl}${publicKey}`);
    if (!resp.ok) {
      if (resp.status === 400) {
        const errData = await resp.json();
        if (errData?.detail && errData.detail.includes("createAccountAlreadyExist")) {
          console.log("Account already exists. Proceeding without error...");
          return;
        } else {
          throw new Error(errData.detail || resp.statusText);
        }
      } else {
        throw new Error(resp.statusText);
      }
    }
    console.log(`Friendbot funded account: ${publicKey}`);
  } catch (error) {
    console.error("Friendbot funding error:", error);
    throw error;
  }
};


const establishUserTrustline = async (asset, walletPublicKey) => {
  if (!walletPublicKey) {
    throw new Error("Wallet not connected. Please connect your wallet.");
  }
  const userAccount = await server.loadAccount(walletPublicKey);
  const trustTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset,
        limit: "1000000",
      })
    )
    .setTimeout(300)
    .build();

  console.log("User Trustline Transaction XDR:", trustTx.toXDR());
  const trustResult = await window.diam.sign(
    trustTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  console.log("User Trustline sign response:", trustResult);

  const response = await server.submitTransaction(trustTx);
  console.log("Trustline established. Tx Hash:", response.hash);
  return response.hash;
};

// ---------------------------------------------
// Dynamic TradeToken Issuer Helper
// ---------------------------------------------
function getDynamicTradeTokenIssuer(accountData, threshold = 1) {
  if (!accountData || !accountData.balances) return null;
  // Filter for balances with asset_code "TradeToken" and a balance greater than threshold.
  const activeTokens = accountData.balances.filter((balance) => {
    return (
      balance.asset_code === "TradeToken" &&
      parseFloat(balance.balance) > threshold
    );
  });
  if (activeTokens.length === 0) return null;
  // Sort by descending balance to take the highest available
  activeTokens.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
  return activeTokens[0].asset_issuer;
}

const getAssetObject = (assetName, dynamicIssuer = null) => {
  if (assetName === "DIAM") {
    return Asset.native();
  } else if (assetName === "TradeToken") {
    if (dynamicIssuer) {
      return new Asset("TradeToken", dynamicIssuer);
    } else {
      return;
    }
  }
  throw new Error(`Unknown asset: ${assetName}`);
};

const doStrictSendSwap = async (
  walletPublicKey,
  fromAsset,
  toAsset,
  sendAmount,
  destMin,
  dynamicIssuer = null
) => {
  const userAccount = await server.loadAccount(walletPublicKey);
  const swapTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: getAssetObject(fromAsset, dynamicIssuer),
        sendAmount,
        destination: walletPublicKey,
        destAsset: getAssetObject(toAsset, dynamicIssuer),
        destMin,
        path: [],
      })
    )
    .setTimeout(300)
    .build();

  console.log("Strict Send Swap Transaction XDR:", swapTx.toXDR());
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }

  const signResult = await window.diam.sign(
    swapTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  console.log("Strict Send Swap sign response:", signResult);

  if (
    signResult &&
    signResult.message &&
    signResult.message.extras &&
    signResult.message.extras.result_codes &&
    Array.isArray(signResult.message.extras.result_codes.operations) &&
    signResult.message.extras.result_codes.operations.includes("op_too_few_offers")
  ) {
    console.warn("Received 'op_too_few_offers', insufficient liquidity. Returning dummy hash.");
    return "N/A";
  }

  let finalHash = signResult.hash;
  if (!finalHash && signResult.message?.data?.hash) {
    finalHash = signResult.message.data.hash;
    console.log("Extracted nested strict send swap hash:", finalHash);
  }
  return finalHash || null;
};

const doStrictReceiveSwap = async (
  walletPublicKey,
  fromAsset,
  toAsset,
  sendMax,
  destAmount,
  dynamicIssuer = null
) => {
  const userAccount = await server.loadAccount(walletPublicKey);
  const swapTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: getAssetObject(fromAsset, dynamicIssuer),
        sendMax,
        destination: walletPublicKey,
        destAsset: getAssetObject(toAsset, dynamicIssuer),
        destAmount,
        path: [],
      })
    )
    .setTimeout(300)
    .build();

  console.log("Strict Receive Swap Transaction XDR:", swapTx.toXDR());
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }

  const signResult = await window.diam.sign(
    swapTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  console.log("Strict Receive Swap sign response:", signResult);

  let finalHash = signResult.hash;
  if (!finalHash && signResult.message?.data?.hash) {
    finalHash = signResult.message.data.hash;
    console.log("Extracted nested strict receive swap hash:", finalHash);
  }
  return finalHash || null;
};

// ---------------------------------------------
// Component: SwapPage
// ---------------------------------------------
export default function SwapPage() {
  // Optionally, fund the issuer account if needed.
  useEffect(() => {
    async function fundIssuer() {
      try {
        // Uncomment and add issuer funding if required.
        // await friendbotFund(issuerPublicKey);
      } catch (e) {
        console.error("Failed to fund issuer:", e);
      }
    }
    fundIssuer();
  }, []);

  // Component state.
  const [fromAsset, setFromAsset] = useState("DIAM");
  const [toAsset, setToAsset] = useState("TradeToken");
  const [sendAmount, setSendAmount] = useState("");
  const [price, setPrice] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [walletPublicKey] = useState(() => localStorage.getItem("diamPublicKey") || "");
  
  // This state will store the dynamic issuer (if found from account balances).
  const [dynamicIssuer, setDynamicIssuer] = useState(null);

  const estimatedReceived =
    sendAmount && price
      ? (parseFloat(sendAmount) * parseFloat(price)).toFixed(7)
      : "";

  // Input handlers.
  const handleSendAmountChange = (e) =>
    setSendAmount(e.target.value.replace(/[^0-9.]/g, ""));
  const handlePriceChange = (e) =>
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));
  const handleFromAssetChange = (e) => setFromAsset(e.target.value);
  const handleToAssetChange = (e) => setToAsset(e.target.value);

  // ---------------------------------------------
  // useEffect: Fetch account details and dynamically determine TradeToken issuer
  // ---------------------------------------------
  useEffect(() => {
    // Only run if a walletPublicKey is available.
    if (!walletPublicKey) return;
    async function loadAccountData() {
      try {
        // Fetch account data from Diamtestnet.
        const account = await server.accounts().accountId(walletPublicKey).call();
        console.log("Loaded account data:", account);
        // Use helper function to get TradeToken issuer with balance > 1.
        const issuer = getDynamicTradeTokenIssuer(account, 1);
        if (issuer) {
          console.log("Dynamic TradeToken issuer found:", issuer);
          setDynamicIssuer(issuer);
        } else {
          console.log("No TradeToken with balance > 1 found; falling back.");
          setDynamicIssuer(null);
        }
      } catch (error) {
        console.error("Error loading account data:", error);
      }
    }
    loadAccountData();
  }, [walletPublicKey]);

  // Swap Flow: Strict Send Swap.
  const handleStrictSendSwapClick = async () => {
    setLoading(true);
    setTxStatus("Starting strict send swap flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict send swap...");

    try {
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        // Use the dynamic issuer if available.
        await establishUserTrustline(
          getAssetObject("TradeToken", dynamicIssuer),
          walletPublicKey
        );
      }
      setTransactionMessage("Funding wallet via Friendbot...");
      await friendbotFund(walletPublicKey);

      const slippageTolerance = 0.95;
      const safeSendAmount =
        sendAmount && parseFloat(sendAmount) > 0
          ? parseFloat(sendAmount).toFixed(7)
          : "1.0000000";
      const computedEstimated = estimatedReceived ? parseFloat(estimatedReceived) : 0;
      const safeDestMin =
        computedEstimated > 0
          ? (computedEstimated * slippageTolerance).toFixed(7)
          : "0.0100000";

      const swapHash = await doStrictSendSwap(
        walletPublicKey,
        fromAsset,
        toAsset,
        safeSendAmount,
        safeDestMin,
        dynamicIssuer
      );
      console.log("Strict Send Swap final hash:", swapHash);

      const finalHash = swapHash || "N/A";
      setTxStatus(`Transaction successful! Hash: ${finalHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Strict send swap completed successfully!");
      setTransactionHash(finalHash);

      // Build transaction history data.
      const transactionData = {
        txHash: finalHash,
        fromAsset,
        toAsset,
        sendAmount,
        price,
        estimatedReceived,
        timestamp: new Date().toISOString(),
      };

      await updateTransactionHistory(transactionData);
    } catch (error) {
      console.error("Strict send swap flow error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(
        `Error in strict send swap flow: ${error.message || error}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Swap Flow: Strict Receive Swap.
  const handleStrictReceiveSwapClick = async () => {
    setLoading(true);
    setTxStatus("Starting strict receive swap flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict receive swap...");

    try {
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        await establishUserTrustline(
          getAssetObject("TradeToken", dynamicIssuer),
          walletPublicKey
        );
      }
      setTransactionMessage("Funding wallet via Friendbot...");
      await friendbotFund(walletPublicKey);

      const safeDestAmount =
        estimatedReceived && parseFloat(estimatedReceived) > 0
          ? parseFloat(estimatedReceived).toFixed(7)
          : "1.0000000";
      const safeSendMax =
        sendAmount && parseFloat(sendAmount) > 0
          ? parseFloat(sendAmount).toFixed(7)
          : "1000.0000000";

      const swapHash = await doStrictReceiveSwap(
        walletPublicKey,
        fromAsset,
        toAsset,
        safeSendMax,
        safeDestAmount,
        dynamicIssuer
      );
      console.log("Strict Receive Swap final hash:", swapHash);

      const finalHash = swapHash || "N/A";
      setTxStatus(`Transaction successful! Hash: ${finalHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Strict receive swap completed successfully!");
      setTransactionHash(finalHash);

      const transactionData = {
        txHash: finalHash,
        fromAsset,
        toAsset,
        sendAmount,
        price,
        estimatedReceived,
        timestamp: new Date().toISOString(),
      };

      await updateTransactionHistory(transactionData);
    } catch (error) {
      console.error("Strict receive swap flow error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(
        `Error in strict receive swap flow: ${error.message || error}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px", marginBottom: "40px" }}>
      <Card
        sx={{
          backgroundColor: "rgba(0, 206, 229, 0.06)",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          mb: 4,
        }}
      >
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth variant="filled" sx={{ mb: 2 }}>
              <InputLabel sx={{ color: "#ffffffcc" }}>From Asset</InputLabel>
              <Select
                value={fromAsset}
                onChange={handleFromAssetChange}
                sx={{
                  color: "#fff",
                  backgroundColor: "#000000",
                  borderRadius: 1,
                  "& .MuiSvgIcon-root": { color: "#fff" },
                }}
              >
                <MenuItem value="DIAM">DIAM</MenuItem>
                <MenuItem value="TradeToken">TradeToken</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth variant="filled">
              <InputLabel sx={{ color: "#ffffffcc" }}>To Asset</InputLabel>
              <Select
                value={toAsset}
                onChange={handleToAssetChange}
                sx={{
                  color: "#fff",
                  backgroundColor: "#000000",
                  borderRadius: 1,
                  "& .MuiSvgIcon-root": { color: "#fff" },
                }}
              >
                <MenuItem value="DIAM">DIAM</MenuItem>
                <MenuItem value="TradeToken">TradeToken</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Send Amount"
            placeholder="Enter amount"
            fullWidth
            variant="filled"
            value={sendAmount}
            onChange={handleSendAmountChange}
            sx={{
              mb: 2,
              input: { color: "#fff" },
              label: { color: "#ffffffcc" },
              backgroundColor: "#000000",
              borderRadius: 1,
            }}
          />

          <TextField
            label="Price (TradeToken per DIAM)"
            placeholder="Enter price"
            fullWidth
            variant="filled"
            value={price}
            onChange={handlePriceChange}
            sx={{
              mb: 2,
              input: { color: "#fff" },
              label: { color: "#ffffffcc" },
              backgroundColor: "#000000",
              borderRadius: 1,
            }}
          />

          <TextField
            label="Estimated Received"
            fullWidth
            variant="filled"
            value={estimatedReceived}
            InputProps={{ readOnly: true, style: { color: "#fff" } }}
            InputLabelProps={{ style: { color: "#ffffffcc" } }}
            sx={{
              mb: 2,
              backgroundColor: "#333",
              borderRadius: 1,
            }}
          />
        </CardContent>

        <CardActions sx={{ flexDirection: "column", gap: 2, mb: 2, px: 2 }}>
          <CustomButton
            variant="contained"
            fullWidth
            onClick={handleStrictSendSwapClick}
            disabled={loading || !walletPublicKey}
          >
            {loading ? <CircularProgress size={24} /> : "Swap (Strict Send)"}
          </CustomButton>

          <CustomButton
            variant="contained"
            fullWidth
            onClick={handleStrictReceiveSwapClick}
            disabled={loading || !walletPublicKey}
          >
            {loading ? <CircularProgress size={24} /> : "Swap (Strict Receive)"}
          </CustomButton>
        </CardActions>

        {txStatus && (
          <Typography
            variant="caption"
            sx={{ display: "block", textAlign: "center", mb: 2, color: "#fff" }}
          >
            Transaction Status: {txStatus}
          </Typography>
        )}
      </Card>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />
    </Container>
  );
}
