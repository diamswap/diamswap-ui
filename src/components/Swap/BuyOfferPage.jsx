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
const assetCode = "TradeToken";
const customAsset = new Asset(assetCode, issuerKeypair.publicKey());

// DiamNet Aurora server
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
// Friendbot for testnet
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";

const BuyOfferPage = () => {
  // -------------------------------------------------------
  // State
  // -------------------------------------------------------
  const [buyAmount, setBuyAmount] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // TransactionModal states
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(""); // pending, success, error
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // The user’s connected DIAM wallet from localStorage
  const [walletPublicKey, setWalletPublicKey] = useState(
    () => localStorage.getItem("diamPublicKey") || ""
  );

  // -------------------------------------------------------
  // Input handlers
  // -------------------------------------------------------
  const handleBuyAmountChange = (e) =>
    setBuyAmount(e.target.value.replace(/[^0-9.]/g, ""));
  const handlePriceChange = (e) =>
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));

  // -------------------------------------------------------
  // Helper: friendbot-fund an account if needed
  // -------------------------------------------------------
  const friendbotFund = async (publicKey) => {
    try {
      const resp = await fetch(`${friendbotUrl}${publicKey}`);
      if (!resp.ok) {
        if (resp.status === 400) {
          const errorData = await resp.json();
          if (
            errorData?.detail &&
            errorData.detail.includes("createAccountAlreadyExist")
          ) {
            console.log("Account already exists. Skipping friendbot...");
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

  // -------------------------------------------------------
  // 1) Fund the ephemeral issuer (so it can create the asset)
  // -------------------------------------------------------
  const fundIssuerIfNeeded = async () => {
    await friendbotFund(issuerKeypair.publicKey());
  };

  // -------------------------------------------------------
  // 2) Fund user’s wallet if needed
  // -------------------------------------------------------
  const fundUserIfNeeded = async () => {
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected. Please connect your wallet first.");
    }
    await friendbotFund(walletPublicKey);
  };

  // -------------------------------------------------------
  // 3) Have user trust "TradeToken"
  // -------------------------------------------------------
  const establishUserTrustline = async () => {
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected. Please connect your wallet first.");
    }
    const userAccount = await server.loadAccount(walletPublicKey);

    const trustTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.changeTrust({
          asset: customAsset,
          limit: "1000000",
        })
      )
      .setTimeout(30)
      .build();

    console.log("TradeToken Trustline XDR:", trustTx.toXDR());

    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const trustResult = await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Trustline sign response:", trustResult);
  };

  // -------------------------------------------------------
  // 4) Optionally: ephemeral issuer can send user some tokens
  //    (not strictly required for a "buy" offer, but you might want it)
  // -------------------------------------------------------
  const issueAssetToUser = async () => {
    console.log("Issuing ephemeral asset to user...");
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    const paymentTx = new TransactionBuilder(issuerAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: walletPublicKey,
          asset: customAsset,
          amount: "1000", // example
        })
      )
      .setTimeout(30)
      .build();

    // ephemeral issuer signs locally
    paymentTx.sign(issuerKeypair);

    const payResult = await server.submitTransaction(paymentTx);
    console.log("Issue ephemeral asset -> user result:", payResult.hash);
  };

  // -------------------------------------------------------
  // 5) Create a Buy Offer (user sells DIAM, buys "TradeToken")
  // -------------------------------------------------------
  const createBuyOffer = async () => {
    if (!buyAmount || !price) {
      throw new Error("Buy amount/price is empty.");
    }
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected. Please connect your wallet first.");
    }

    const userAccount = await server.loadAccount(walletPublicKey);

    const offerTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.manageBuyOffer({
          selling: Asset.native(),   // user sells DIAM
          buying: customAsset,       // user buys ephemeral asset
          buyAmount: buyAmount,
          price: price,
          offerId: "0",
        })
      )
      .setTimeout(30)
      .build();

    console.log("Buy Offer XDR:", offerTx.toXDR());

    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const signResult = await window.diam.sign(offerTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Buy Offer sign response:", signResult);

    let finalHash = signResult.hash;
    if (!finalHash && signResult.message?.data?.hash) {
      finalHash = signResult.message.data.hash;
      console.log("Extracted nested buy offer hash:", finalHash);
    }
    return finalHash || null;
  };

  // -------------------------------------------------------
  // The single flow triggered by the "Submit Offer" button
  // -------------------------------------------------------
  const handleBuyFlow = async () => {
    setLoading(true);
    setTxStatus("Starting buy offer flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing buy offer...");

    try {
      // 1) Fund ephemeral issuer if needed
      setTransactionMessage("Funding ephemeral issuer...");
      await fundIssuerIfNeeded();

      // 2) Fund user’s wallet if needed
      setTransactionMessage("Funding user’s wallet...");
      await fundUserIfNeeded();

      // 3) User trusts ephemeral asset
      setTransactionMessage("Establishing user trustline...");
      await establishUserTrustline();

      // 4) Optionally: ephemeral issuer sends user some tokens
      // (Not strictly required for a buy offer, but included if you want user to hold them)
      setTransactionMessage("Issuing ephemeral asset to user...");
      await issueAssetToUser();

      // 5) Create Buy Offer
      setTransactionMessage("Creating buy offer...");
      const buyHash = await createBuyOffer();
      console.log("Buy offer final hash:", buyHash);

      setTxStatus(`Transaction successful! Hash: ${buyHash || "N/A"}`);
      setTransactionStatus("success");
      setTransactionMessage("Buy offer created successfully!");
      setTransactionHash(buyHash || "");
    } catch (error) {
      console.error("Buy offer flow error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Error in buy offer flow: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
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
          Buy Offer (DIAM → TradeToken)
        </Typography>

        <TextField
          label="Buy Amount (DIAM)"
          placeholder="0"
          fullWidth
          variant="outlined"
          value={buyAmount}
          onChange={handleBuyAmountChange}
          sx={{
            marginBottom: "1rem",
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        <TextField
          label={`Price (${assetCode} per DIAM)`}
          placeholder="0.1"
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

        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleBuyFlow}
          disabled={loading || !walletPublicKey}
        >
          {loading ? "Processing..." : "Create Buy Offer"}
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

export default BuyOfferPage;
