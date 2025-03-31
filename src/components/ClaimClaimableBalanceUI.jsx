// src/components/ClaimClaimableBalanceUI.jsx

import React, { useState } from "react";
import {
  Paper,
  TextField,
  Typography,
  Button,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Aurora,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Networks,
} from "diamnet-sdk";
import TransactionModal from "../comman/TransactionModal";

export default function ClaimClaimableBalanceUI() {
  // Form fields for the source account and balance ID
  const [sourceSecret, setSourceSecret] = useState("");
  const [balanceId, setBalanceId] = useState("");

  // UI and transaction state
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");

  // Adjust network settings as needed.
  // Ensure that the network you're using supports claimable balance operations.
  const networkPassphrase = "Diamante Testnet 2024"; // Or use Networks.TESTNET if appropriate
  const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

  const handleClaimBalance = async () => {
    setError("");
    setTxHash("");
    setTransactionMessage("");
    setTransactionStatus("");
    setLoading(true);
    setModalOpen(true);

    try {
      // Load the source account
      const sourceKeypair = Keypair.fromSecret(sourceSecret);
      const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

      // Build the Claim Claimable Balance operation.
      // If the network does not support this operation, you will receive op_does_not_exist.
      const claimOp = Operation.claimClaimableBalance({ balanceId });
      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(claimOp)
        .setTimeout(30)
        .build();

      tx.sign(sourceKeypair);

      // Submit the transaction.
      const resp = await server.submitTransaction(tx);
      setTxHash(resp.hash);
      setTransactionStatus("success");
      setTransactionMessage("Claim successful!");
    } catch (err) {
      console.error("Claim error:", err);
      setTransactionStatus("error");
      if (err.response && err.response.data && err.response.data.extras) {
        setTransactionMessage(JSON.stringify(err.response.data.extras.result_codes));
      } else {
        setTransactionMessage(err.message || "An error occurred");
      }
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      sx={{
        maxWidth: 600,
        margin: "2rem auto",
        p: 3,
        backgroundColor: "#121212",
        color: "#fff",
        borderRadius: 2,
        border: "1px solid gray",
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Claim Claimable Balance
      </Typography>
      <Divider sx={{ mb: 2, borderColor: "#444" }} />

      <Stack spacing={2}>
        <TextField
          label="Source Secret Key"
          variant="outlined"
          value={sourceSecret}
          onChange={(e) => setSourceSecret(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#ccc" } }}
          inputProps={{ style: { color: "#fff" } }}
        />

        <TextField
          label="Claimable Balance ID"
          variant="outlined"
          value={balanceId}
          onChange={(e) => setBalanceId(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#ccc" } }}
          inputProps={{ style: { color: "#fff" } }}
          helperText="Find your BalanceID at https://diamtestnet.diamcircle.io/claimable_balances"
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleClaimBalance}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Claim Balance"}
        </Button>

        {txHash && (
          <Typography sx={{ color: "#4caf50" }}>
            Success! Tx Hash: {txHash}
          </Typography>
        )}
        {transactionMessage && (
          <Typography
            sx={{
              color: transactionStatus === "error" ? "#f44336" : "#4caf50",
            }}
          >
            {transactionMessage}
          </Typography>
        )}
        {error && (
          <Typography sx={{ color: "#f44336" }}>
            Error: {error}
          </Typography>
        )}
      </Stack>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={txHash}
      />
    </Paper>
  );
}
