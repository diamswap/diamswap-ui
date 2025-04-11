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
import { PinataSDK } from "pinata-web3";

// Polyfill Buffer for browser support
if (!window.Buffer) {
  window.Buffer = Buffer;
}
const PINATA_JWT_1 = import.meta.env.VITE_PINATA_JWT;
console.log("PINATA_JWT_1", PINATA_JWT_1)

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "https://gateway.pinata.cloud";

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// Fallback issuer for TradeToken
const realIssuerPubKey = "GBPTZYVUREREXTENTMWDB2PHJSSXLX4VHDPMA5O56MDNNJTA752EKS7X";
const fallbackTradeToken = new Asset("TradeToken", realIssuerPubKey);

// Initialize PinataSDK for transaction history pinning.

// Update transaction history via Pinata REST API and save to localStorage.
async function updateTransactionHistory(transactionData) {
  const PINATA_JWT = PINATA_JWT_1;
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
    console.log("Pinned transaction data:", result);
    const history = JSON.parse(localStorage.getItem("txHistory") || "[]");
    history.push({ ...transactionData, ipfsHash: result.IpfsHash });
    localStorage.setItem("txHistory", JSON.stringify(history));
    return result;
  } catch (error) {
    console.error("Error pinning transaction data:", error);
  }
}

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
  console.log("Trustline XDR:", trustTx.toXDR());
  const trustResult = await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
  console.log("Trustline sign response:", trustResult);
  const response = await server.submitTransaction(trustTx);
  console.log("Trustline established. Tx Hash:", response.hash);
  return response.hash;
};

/**
 * Determines the dynamic TradeToken issuer from the account balances.
 * It returns the issuer of the TradeToken holding that has a balance greater than
 * the given threshold and buying_liabilities >= 0.001.
 */
function getDynamicTradeTokenIssuer(accountData, threshold = 1) {
  console.log("Determining dynamic TradeToken issuer...");
  if (!accountData || !accountData.balances) return null;
  const qualifyingTokens = accountData.balances.filter((bal) => {
    if (bal.asset_code === "TradeToken") {
      const balance = parseFloat(bal.balance);
      const buyingLiabilities = parseFloat(bal.buying_liabilities || "0");
      console.log(`Issuer: ${bal.asset_issuer} | Balance: ${balance} | BuyingLiabilities: ${buyingLiabilities}`);
      return balance > threshold && buyingLiabilities >= 0.001;
    }
    return false;
  });
  console.log("Qualifying tokens:", qualifyingTokens);
  if (qualifyingTokens.length === 0) return null;
  qualifyingTokens.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
  console.log("Sorted tokens:", qualifyingTokens);
  const selectedIssuer = qualifyingTokens[0].asset_issuer;
  console.log("Dynamic TradeToken issuer selected:", selectedIssuer);
  return selectedIssuer;
}

/**
 * Returns an Asset instance for the given asset name.
 * For TradeToken, it uses the dynamic issuer if provided.
 */
const getAssetObject = (assetName, dynamicIssuer = null) => {
  if (assetName === "DIAM") {
    return Asset.native();
  } else if (assetName === "TradeToken") {
    return dynamicIssuer ? new Asset("TradeToken", dynamicIssuer) : fallbackTradeToken;
  }
  throw new Error(`Unknown asset: ${assetName}`);
};

/**
 * Swap Transaction Functions: Strict Send and Strict Receive Swap.
 */
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
  console.log("Strict Send Swap XDR:", swapTx.toXDR());
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }
  const signResult = await window.diam.sign(swapTx.toXDR(), true, NETWORK_PASSPHRASE);
  console.log("Strict Send Swap sign response:", signResult);
  if (
    signResult &&
    signResult.message &&
    signResult.message.extras &&
    signResult.message.extras.result_codes &&
    Array.isArray(signResult.message.extras.result_codes.operations) &&
    signResult.message.extras.result_codes.operations.includes("op_too_few_offers")
  ) {
    console.warn("Received 'op_too_few_offers', insufficient liquidity.");
    return "N/A";
  }
  let finalHash = signResult.hash;
  if (!finalHash && signResult.message?.data?.hash) {
    finalHash = signResult.message.data.hash;
    console.log("Extracted strict send swap hash:", finalHash);
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
  console.log("Strict Receive Swap XDR:", swapTx.toXDR());
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }
  const signResult = await window.diam.sign(swapTx.toXDR(), true, NETWORK_PASSPHRASE);
  console.log("Strict Receive Swap sign response:", signResult);
  let finalHash = signResult.hash;
  if (!finalHash && signResult.message?.data?.hash) {
    finalHash = signResult.message.data.hash;
    console.log("Extracted strict receive swap hash:", finalHash);
  }
  return finalHash || null;
};

/**
 * ---------------------------------------------
 * SwapPage Component
 * ---------------------------------------------
 */
export default function SwapPage() {
  // On mount, optionally fund the issuer (not implemented here)
  useEffect(() => {
    async function fundIssuer() {
      try {
        // issuer funding logic (if necessary)
      } catch (e) {
        console.error("Failed to fund issuer:", e);
      }
    }
    fundIssuer();
  }, []);

  // Component state for user inputs and transaction handling.
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

  // State for the dynamic TradeToken issuer.
  const [dynamicIssuer, setDynamicIssuer] = useState(null);

  // Calculated estimated received value.
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

  // Load account data and determine dynamic TradeToken issuer.
  useEffect(() => {
    async function loadAccountData() {
      if (!walletPublicKey) return;
      try {
        const account = await server.accounts().accountId(walletPublicKey).call();
        const issuer = getDynamicTradeTokenIssuer(account, 1);
        console.log("Dynamic TradeToken issuer:", issuer);
        setDynamicIssuer(issuer);
      } catch (error) {
        console.error("Error loading account data:", error);
      }
    }
    loadAccountData();
  }, [walletPublicKey]);

  // Swap flow for Strict Send Swap.
  const handleStrictSendSwapClick = async () => {
    setLoading(true);
    setTxStatus("Starting strict send swap flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict send swap...");
    try {
      // Establish trustline if the swap involves TradeToken.
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        await establishUserTrustline(getAssetObject("TradeToken", dynamicIssuer), walletPublicKey);
      }
      // Build transaction parameters.
      const slippageTolerance = 0.95;
      const safeSendAmount =
        sendAmount && parseFloat(sendAmount) > 0
          ? parseFloat(sendAmount).toFixed(7)
          : "1.0000000";
      const computedEstimated = estimatedReceived ? parseFloat(estimatedReceived) : 0;
      const safeDestMin =
        computedEstimated > 0 ? (computedEstimated * slippageTolerance).toFixed(7) : "0.0100000";

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
      console.error("Strict send swap error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Error in strict send swap: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  // Swap flow for Strict Receive Swap.
  const handleStrictReceiveSwapClick = async () => {
    setLoading(true);
    setTxStatus("Starting strict receive swap flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict receive swap...");
    try {
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        await establishUserTrustline(getAssetObject("TradeToken", dynamicIssuer), walletPublicKey);
      }
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
      console.error("Strict receive swap error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Error in strict receive swap: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px", marginBottom: "40px" }}>
      {/* Swap Form */}
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
                onChange={(e) => setFromAsset(e.target.value)}
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
                onChange={(e) => setToAsset(e.target.value)}
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
            onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ""))}
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
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
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
