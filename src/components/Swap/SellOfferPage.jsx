// src/components/SellOfferPage.jsx
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
import { Container, Box, Typography, TextField, Button } from "@mui/material";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const issuerKeypair = Keypair.random();

const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// Friendbot for testnet
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";

const SellOfferPage = () => {
  // ----------------------------------------------------------------
  // State variables
  // ----------------------------------------------------------------
  const [sellAmount, setSellAmount] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // We'll create a custom asset: "TradeToken" with ephemeral issuer
  const assetCode = "TradeToken";
  const [transactionStatus, setTransactionStatus] = useState(""); // pending, success, error
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Grab the localStorage public key for the user’s DIAM wallet
  const [walletPublicKey, setWalletPublicKey] = useState(
    () => localStorage.getItem("diamPublicKey") || ""
  );

  // The custom asset
  const customAsset = new Asset(assetCode, issuerKeypair.publicKey());

  // Input handlers
  const handleSellAmountChange = (e) =>
    setSellAmount(e.target.value.replace(/[^0-9.]/g, ""));
  const handlePriceChange = (e) =>
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));

  // ----------------------------------------------------------------
  // Helper: fund an account with friendbot (if needed)
  // ----------------------------------------------------------------
  const friendbotFund = async (publicKey) => {
    try {
      const resp = await fetch(`${friendbotUrl}${publicKey}`);
      if (!resp.ok) {
        if (resp.status === 400) {
          // Possibly "createAccountAlreadyExist"
          const errorData = await resp.json();
          if (errorData?.detail?.includes("createAccountAlreadyExist")) {
            console.log("Account already exists, skipping friendbot.");
            return;
          } else {
            throw new Error(
              `Friendbot error: ${errorData.detail || resp.statusText}`
            );
          }
        } else {
          throw new Error(`Friendbot error: ${resp.statusText}`);
        }
      }
      console.log(`Friendbot funded account: ${publicKey}`);
    } catch (error) {
      console.error("Error friendbot funding:", error);
      throw error;
    }
  };

  // ----------------------------------------------------------------
  // 1) Fund the ephemeral issuer (so it can create the asset)
  // ----------------------------------------------------------------
  const fundIssuerIfNeeded = async () => {
    await friendbotFund(issuerKeypair.publicKey());
  };

  // ----------------------------------------------------------------
  // 2) Issue the asset from ephemeral issuer → user’s wallet
  //    (But first, user must trust the asset)
  // ----------------------------------------------------------------
  const establishUserTrustline = async () => {
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected (no public key in localStorage).");
    }
    // Load user’s account from the Aurora server
    const userAccount = await server.loadAccount(walletPublicKey);

    // Build a transaction to trust the new asset
    const trustTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.changeTrust({
          asset: customAsset,
          limit: "1000000", // e.g., allow up to 1M tokens
        })
      )
      .setTimeout(30)
      .build();

    console.log("Trustline XDR:", trustTx.toXDR());

    // Sign using the DIAM extension
    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const trustResult = await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Trustline sign response:", trustResult);
  };

  const issueAssetToUser = async () => {
    const issuerAcct = await server.loadAccount(issuerKeypair.publicKey());

    const paymentTx = new TransactionBuilder(issuerAcct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: walletPublicKey,
          asset: customAsset,
          amount: "1000", // for example, give user 1000 tokens
        })
      )
      .setTimeout(30)
      .build();

    // The ephemeral issuer is a normal Keypair, so we sign locally
    paymentTx.sign(issuerKeypair);

    const payResult = await server.submitTransaction(paymentTx);
    console.log("Issue asset -> user response:", payResult.hash);
  };

  // ----------------------------------------------------------------
  // 3) Create Sell Offer (user sells DIAM, buys custom asset)
  // ----------------------------------------------------------------
  const createSellOffer = async () => {
    const userAccount = await server.loadAccount(walletPublicKey);

    // Build the transaction for manageSellOffer
    const offerTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.manageSellOffer({
          selling: Asset.native(),   // DIAM
          buying: customAsset,       // The ephemeral asset
          amount: sellAmount,
          price: price,
          offerId: "0",
        })
      )
      .setTimeout(30)
      .build();

    console.log("Sell Offer XDR:", offerTx.toXDR());

    // Ask DIAM extension to sign
    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const signResult = await window.diam.sign(offerTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Sell Offer sign response:", signResult);

    // Attempt to parse final hash
    let finalHash = signResult.hash;
    if (!finalHash && signResult.message?.data?.hash) {
      finalHash = signResult.message.data.hash;
      console.log("Extracted nested hash from result:", finalHash);
    }
    return finalHash || null;
  };

  // ----------------------------------------------------------------
  // Full flow triggered by “Create Sell Offer” button
  // ----------------------------------------------------------------
  const handleCreateSellOffer = async () => {
    try {
      setLoading(true);
      setTxStatus("Starting sell offer flow...");
      setModalOpen(true);
      setTransactionStatus("pending");
      setTransactionMessage("Processing sell offer...");

      // 0) Ensure we have a connected wallet
      if (!walletPublicKey) {
        throw new Error("No DIAM wallet connected. Please connect your wallet first.");
      }

      // 1) Fund ephemeral issuer (so it can create asset)
      setTransactionMessage("Funding ephemeral issuer...");
      await fundIssuerIfNeeded();

      // 2) Fund the user’s wallet if needed
      setTransactionMessage("Funding user’s wallet (if needed)...");
      await friendbotFund(walletPublicKey);

      // 3) User trusts the ephemeral asset
      setTransactionMessage("Establishing user trustline...");
      await establishUserTrustline();

      // 4) Ephemeral issuer sends tokens to user
      setTransactionMessage("Issuing ephemeral asset to user...");
      await issueAssetToUser();

      // 5) User creates the sell offer (DIAM -> ephemeral asset)
      setTransactionMessage("Creating sell offer...");
      const sellHash = await createSellOffer();
      console.log("Sell offer final hash:", sellHash);

      // Done
      setTxStatus(`Transaction successful! Hash: ${sellHash || "N/A"}`);
      setTransactionStatus("success");
      setTransactionMessage("Sell offer created successfully!");
      setTransactionHash(sellHash || "");
    } catch (error) {
      console.error("Flow error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Error in sell offer flow: ${error.message || error}`);
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
          Create Sell Offer
        </Typography>

        <TextField
          label="Sell Amount (DIAM)"
          value={sellAmount}
          onChange={handleSellAmountChange}
          fullWidth
          variant="outlined"
          sx={{
            marginBottom: "1rem",
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        <TextField
          label={`Price (${assetCode} per DIAM)`}
          value={price}
          onChange={handlePriceChange}
          fullWidth
          variant="outlined"
          sx={{
            marginBottom: "1rem",
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        <CustomButton
          variant="contained"
          fullWidth
          disabled={loading || !walletPublicKey}
          onClick={handleCreateSellOffer}
        >
          {loading ? "Processing..." : "Create Sell Offer"}
        </CustomButton>

 
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

export default SellOfferPage;
