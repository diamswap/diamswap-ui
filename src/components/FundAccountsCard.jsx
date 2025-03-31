import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Keypair } from "diamnet-sdk";
import CustomButton from "../comman/CustomButton";
import TransactionModal from "../comman/TransactionModal";

const FundAccounts = () => {
  const [nftIssuerKeypair, setNftIssuerKeypair] = useState(null);
  const [distributorKeypair, setDistributorKeypair] = useState(null);
  const [buyerKeypair, setBuyerKeypair] = useState(null);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Transaction modal info
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");

  // 1. Generate random keypairs on mount
  useEffect(() => {
    try {
      const nftIssuer = Keypair.random();
      const distributor = Keypair.random();
      const buyer = Keypair.random();

      setNftIssuerKeypair(nftIssuer);
      setDistributorKeypair(distributor);
      setBuyerKeypair(buyer);

      console.log("NFT Issuer:", nftIssuer.publicKey());
      console.log("Distributor:", distributor.publicKey());
      console.log("Buyer:", buyer.publicKey());
    } catch (error) {
      console.error("Error generating keypairs:", error);
    }
  }, []);

  // 2. Fund Accounts using Friendbot
  const handleFundAccounts = async () => {
    if (!nftIssuerKeypair || !distributorKeypair || !buyerKeypair) {
      console.error("Keypairs not ready");
      return;
    }

    setLoading(true);
    setModalOpen(true);

    try {
      // Helper function to fund one account
      const fundAccount = async (kp) => {
        const response = await fetch(`https://friendbot.diamcircle.io?addr=${kp.publicKey()}`);
        if (response.ok) {
          return `Account ${kp.publicKey()} funded successfully.`;
        } else {
          return `Funding failed for ${kp.publicKey()}.`;
        }
      };

      // Fund each account in sequence
      const results = [];
      results.push(await fundAccount(nftIssuerKeypair));
      results.push(await fundAccount(distributorKeypair));
      results.push(await fundAccount(buyerKeypair));

      // Combine the results into one message
      setTransactionStatus("success");
      setTransactionMessage(results.join("\n"));
    } catch (error) {
      console.error("Error funding accounts:", error);
      setTransactionStatus("error");
      setTransactionMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px" }}>
      <Box
        sx={{
          backgroundColor: "rgba(0, 206, 229, 0.06)",
          margin: "2rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          position: "relative",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 2 }}>
          Fund Accounts
        </Typography>

        {/* 
          Added some descriptive text here so users understand 
          what will happen when they click the button.
        */}
        <Typography variant="body2" align="center" sx={{ mb: 4, opacity: 0.9 }}>
          Click the button below to create three random testnet accounts
          (NFT Issuer, Distributor, and Buyer) and fund them with XLM
          on the Diamnet test network.
        </Typography>

        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleFundAccounts}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Fund Accounts"}
        </CustomButton>
      </Box>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash=""
      />
    </Container>
  );
};

export default FundAccounts;
