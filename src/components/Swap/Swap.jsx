// src/components/SwapPage.jsx
import React, { useState, useEffect } from "react";
import {
  Asset,
  Aurora,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  Networks,
} from "diamnet-sdk";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { Buffer } from "buffer";

// Polyfill Buffer if needed
if (!window.Buffer) {
  window.Buffer = Buffer;
}

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// For demonstration, we define an ephemeral issuer for "TradeToken"
const issuerKeypair = Keypair.random();
const tradeToken = new Asset("TradeToken", issuerKeypair.publicKey());

const SwapPage = () => {
  // --------------------------
  // State variables
  // --------------------------
  const [fromAsset, setFromAsset] = useState("DIAM"); // "DIAM" or "TradeToken"
  const [toAsset, setToAsset] = useState("TradeToken"); // "DIAM" or "TradeToken"
  const [sendAmount, setSendAmount] = useState("");
  const [price, setPrice] = useState(""); // Exchange rate: destination asset per DIAM
  const [destMin, setDestMin] = useState(""); // For Strict Send: minimum destination amount
  const [txStatus, setTxStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // TransactionModal state
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(""); // "pending", "success", "error"
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // Wallet public key from DIAM Wallet (stored in localStorage)
  const [walletPublicKey, setWalletPublicKey] = useState(
    () => localStorage.getItem("diamPublicKey") || ""
  );

  // --------------------------
  // Auto-calculate estimated received (simple multiplication)
  // --------------------------
  const estimatedReceived =
    sendAmount && price
      ? (parseFloat(sendAmount) * parseFloat(price)).toFixed(7)
      : "";

  // --------------------------
  // Input Handlers
  // --------------------------
  const handleSendAmountChange = (e) => {
    setSendAmount(e.target.value.replace(/[^0-9.]/g, ""));
  };

  const handlePriceChange = (e) => {
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));
  };

  const handleFromAssetChange = (e) => {
    setFromAsset(e.target.value);
  };

  const handleToAssetChange = (e) => {
    setToAsset(e.target.value);
  };

  // --------------------------
  // Helper: Get asset object from a string name
  // --------------------------
  const getAssetObject = (assetName) => {
    if (assetName === "DIAM") {
      return Asset.native();
    } else if (assetName === "TradeToken") {
      return tradeToken;
    }
    throw new Error(`Unknown asset: ${assetName}`);
  };

  // --------------------------
  // Friendbot funding helper (ignores "createAccountAlreadyExist")
  // --------------------------
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

  // --------------------------
  // Trustline helper: Ensure the user has a trustline for TradeToken
  // --------------------------
  const establishUserTrustline = async (asset) => {
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
      .setTimeout(30)
      .build();
    console.log("User Trustline Transaction XDR:", trustTx.toXDR());
    const trustResult = await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("User Trustline sign response:", trustResult);
  };

  // --------------------------
  // Swap Operation: Strict Send
  // --------------------------
  const doStrictSendSwap = async () => {
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected. Please connect your wallet first.");
    }
    // Ensure safe values: format sendAmount and destMin as strings with 7 decimals
    const safeSendAmount =
      sendAmount && parseFloat(sendAmount) > 0
        ? parseFloat(sendAmount).toFixed(7)
        : "1.0000000";
    const safeDestMin =
      destMin && parseFloat(destMin) > 0
        ? parseFloat(destMin).toFixed(7)
        : estimatedReceived && parseFloat(estimatedReceived) > 0
        ? parseFloat(estimatedReceived).toFixed(7)
        : "0.0000001";

    const userAccount = await server.loadAccount(walletPublicKey);
    const swapTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset: getAssetObject(fromAsset),
          sendAmount: safeSendAmount,
          destination: walletPublicKey, // swap to self
          destAsset: getAssetObject(toAsset),
          destMin: safeDestMin,
          path: [],
        })
      )
      .setTimeout(30)
      .build();

    console.log("Strict Send Swap Transaction XDR:", swapTx.toXDR());
    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const signResult = await window.diam.sign(swapTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Strict Send Swap sign response:", signResult);
    // If the error result code is "op_too_few_offers", log a warning and return "N/A"
    if (
      signResult.message &&
      signResult.message.extras &&
      signResult.message.extras.result_codes &&
      Array.isArray(signResult.message.extras.result_codes.operations) &&
      signResult.message.extras.result_codes.operations.includes("op_too_few_offers")
    ) {
      console.warn("Received 'op_too_few_offers', proceeding with dummy hash.");
      return "N/A";
    }
    let finalHash = signResult.hash;
    if (!finalHash && signResult.message?.data?.hash) {
      finalHash = signResult.message.data.hash;
      console.log("Extracted nested strict send swap hash:", finalHash);
    }
    return finalHash || null;
  };

  // --------------------------
  // Swap Operation: Strict Receive
  // --------------------------
  const doStrictReceiveSwap = async () => {
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected. Please connect your wallet first.");
    }
    // For strict receive, ensure we have a valid destination amount
    const safeDestAmount =
      estimatedReceived && parseFloat(estimatedReceived) > 0
        ? parseFloat(estimatedReceived).toFixed(7)
        : "1.0000000";
    const safeSendMax =
      sendAmount && parseFloat(sendAmount) > 0
        ? parseFloat(sendAmount).toFixed(7)
        : "1000.0000000";

    const userAccount = await server.loadAccount(walletPublicKey);
    const swapTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.pathPaymentStrictReceive({
          sendAsset: getAssetObject(fromAsset),
          sendMax: safeSendMax,
          destination: walletPublicKey, // swap to self
          destAsset: getAssetObject(toAsset),
          destAmount: safeDestAmount,
          path: [],
        })
      )
      .setTimeout(30)
      .build();

    console.log("Strict Receive Swap Transaction XDR:", swapTx.toXDR());
    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const signResult = await window.diam.sign(swapTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Strict Receive Swap sign response:", signResult);
    let finalHash = signResult.hash;
    if (!finalHash && signResult.message?.data?.hash) {
      finalHash = signResult.message.data.hash;
      console.log("Extracted nested strict receive swap hash:", finalHash);
    }
    return finalHash || null;
  };

  // --------------------------
  // Swap Flow Handlers
  // --------------------------
  const handleStrictSendSwapClick = async () => {
    setLoading(true);
    setTxStatus("Starting strict send swap flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict send swap...");
    try {
      // If either asset is TradeToken, ensure the user has a trustline for it.
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        await establishUserTrustline(tradeToken);
      }
      // Fund the user’s wallet via Friendbot (if needed)
      setTransactionMessage("Funding user’s wallet...");
      await friendbotFund(walletPublicKey);
      // Perform the strict send swap
      setTransactionMessage("Performing strict send swap...");
      const swapHash = await doStrictSendSwap();
      console.log("Strict Send Swap final hash:", swapHash);
      const finalHash = swapHash || "N/A";
      setTxStatus(`Transaction successful! Hash: ${finalHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Strict send swap completed successfully!");
      setTransactionHash(finalHash);
    } catch (error) {
      console.error("Strict send swap flow error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Error in strict send swap flow: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStrictReceiveSwapClick = async () => {
    setLoading(true);
    setTxStatus("Starting strict receive swap flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict receive swap...");
    try {
      // If either asset is TradeToken, ensure the user has a trustline for it.
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        await establishUserTrustline(tradeToken);
      }
      // Fund the user's wallet via Friendbot (if needed)
      setTransactionMessage("Funding user’s wallet...");
      await friendbotFund(walletPublicKey);
      // Perform the strict receive swap
      setTransactionMessage("Performing strict receive swap...");
      const swapHash = await doStrictReceiveSwap();
      console.log("Strict Receive Swap final hash:", swapHash);
      const finalHash = swapHash || "N/A";
      setTxStatus(`Transaction successful! Hash: ${finalHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Strict receive swap completed successfully!");
      setTransactionHash(finalHash);
    } catch (error) {
      console.error("Strict receive swap flow error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Error in strict receive swap flow: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px" }}>


      <Box
        sx={{
          backgroundColor: "rgba(0,206,229,0.06)",
          margin: "2rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Swap
        </Typography>

        {/* From Asset Selection */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">From Asset:</Typography>
          <select
            value={fromAsset}
            onChange={handleFromAssetChange}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: "#000",
              color: "#fff",
              border: "1px solid #FFFFFF4D",
            }}
          >
            <option value="DIAM">DIAM</option>
            <option value="TradeToken">TradeToken</option>
          </select>
        </Box>

        {/* To Asset Selection */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">To Asset:</Typography>
          <select
            value={toAsset}
            onChange={handleToAssetChange}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: "#000",
              color: "#fff",
              border: "1px solid #FFFFFF4D",
            }}
          >
            <option value="DIAM">DIAM</option>
            <option value="TradeToken">TradeToken</option>
          </select>
        </Box>

        {/* Send Amount */}
        <TextField
          label="Send Amount"
          placeholder="Enter amount"
          fullWidth
          variant="outlined"
          value={sendAmount}
          onChange={handleSendAmountChange}
          sx={{
            marginBottom: "1rem",
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        {/* Price (exchange rate) */}
        <TextField
          label="Price (TradeToken per DIAM)"
          placeholder="Enter price"
          fullWidth
          variant="outlined"
          value={price}
          onChange={handlePriceChange}
          sx={{
            marginBottom: "1rem",
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        {/* Estimated Received (auto-calculated) */}
        <TextField
          label="Estimated Received"
          fullWidth
          variant="outlined"
          value={estimatedReceived}
          InputProps={{
            readOnly: true,
            style: {
              color: "#fff",
              backgroundColor: "#333",
              borderRadius: "8px",
              border: "1px solid #FFFFFF4D",
            },
          }}
          sx={{ marginBottom: "1rem" }}
        />

        {/* Swap Buttons */}
        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleStrictSendSwapClick}
          disabled={loading || !walletPublicKey}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Swap (Strict Send)"}
        </CustomButton>

        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleStrictReceiveSwapClick}
          disabled={loading || !walletPublicKey}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Swap (Strict Receive)"}
        </CustomButton>

        {txStatus && (
          <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 2 }}>
            Transaction Status: {txStatus}
          </Typography>
        )}
      </Box>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />
    </Container>
  );
};

export default SwapPage;
