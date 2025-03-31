// src/components/CreateClaimableBalanceUI.jsx

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
  Asset,
  Claimant,
} from "diamnet-sdk";
import TransactionModal from "../comman/TransactionModal"; // Adjust path if needed

/**
 * CreateClaimableBalanceUI:
 * - Automatically funds your source account via Friendbot (on Diamante Testnet).
 * - Creates an unconditional claimable balance of a chosen asset/amount.
 * - Displays transaction status in a modal.
 */
export default function CreateClaimableBalanceUI() {
  // Default form fields
  // Use your own secret key as needed; the below is just an example.
  const [secret, setSecret] = useState(
    "SCYER7WUB3HQ3NK3YULVGVBP3FF6CGHUTPJ2YBI7LFGTP4XQZRPTENPO"
  );
  const [destination, setDestination] = useState(
    "GAZAQBSUPBH6D35CFDUB3I42EAAGP6PFNSI25SRZ7ML32ESCD2VORHKY"
  );
  const [assetCode, setAssetCode] = useState("native"); // "native" for DIAM
  const [issuer, setIssuer] = useState("");             // Only needed if assetCode != "native"
  const [amount, setAmount] = useState("5");

  // UI & Transaction state
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // Diamante testnet details (adjust if needed).
  const networkPassphrase = "Diamante Testnet 2024";
  const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

  /**
   * Friendbot funding: ensures your account is topped up with DIAM
   * on the Diamante testnet. If friendbot is unavailable or returns
   * an error, you'll see a warning in the console.
   */
  const friendbotFund = async (publicKey) => {
    try {
      const resp = await fetch(
        `https://friendbot.diamcircle.io?addr=${publicKey}`
      );
      if (!resp.ok) {
        console.warn("Friendbot funding failed for", publicKey);
      } else {
        console.log("Friendbot success for", publicKey);
      }
    } catch (err) {
      console.warn("Friendbot error:", err);
    }
  };

  const handleCreateClaimableBalance = async () => {
    // Reset UI state
    setLoading(true);
    setTransactionStatus("");
    setTransactionMessage("");
    setTransactionHash("");
    setModalOpen(true);

    try {
      // 1) Load the source account
      const sourceKeypair = Keypair.fromSecret(secret);
      const sourcePublicKey = sourceKeypair.publicKey();

      // 2) Attempt to fund your account with friendbot (Diamante testnet)
      await friendbotFund(sourcePublicKey);

      // 3) Reload the account from Aurora
      const sourceAccount = await server.loadAccount(sourcePublicKey);

      // 4) Determine which asset to lock
      let claimAsset;
      if (assetCode.toLowerCase() === "native") {
        claimAsset = Asset.native();
      } else {
        if (!issuer) {
          throw new Error("Please specify an issuer for the custom asset.");
        }
        claimAsset = new Asset(assetCode, issuer);
      }

      // 5) Create an unconditional claimant for the destination
      const claimant = new Claimant(
        destination,
        Claimant.predicateUnconditional()
      );

      // 6) Build the CreateClaimableBalance operation
      const createCBOp = Operation.createClaimableBalance({
        asset: claimAsset,
        amount,
        claimants: [claimant],
      });

      // 7) Build and sign the transaction
      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(createCBOp)
        .setTimeout(30)
        .build();

      tx.sign(sourceKeypair);

      // 8) Submit the transaction
      const resp = await server.submitTransaction(tx);
      setTransactionHash(resp.hash);
      setTransactionStatus("success");
      setTransactionMessage("Claimable balance created successfully!");
    } catch (err) {
      console.error("CreateClaimableBalance error:", err);
      setTransactionStatus("error");
      if (err.response && err.response.data && err.response.data.extras) {
        setTransactionMessage(JSON.stringify(err.response.data.extras.result_codes));
      } else {
        setTransactionMessage(err.message || "An error occurred");
      }
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
        backgroundColor: "#1e1e1e",
        color: "#fff",
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        Create Claimable Balance
      </Typography>
      <Divider sx={{ mb: 2, borderColor: "#444" }} />

      <Stack spacing={2}>
        <TextField
          label="Source Secret Key"
          variant="outlined"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#ccc" } }}
          inputProps={{ style: { color: "#fff" } }}
        />

        <TextField
          label="Destination Public Key"
          variant="outlined"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#ccc" } }}
          inputProps={{ style: { color: "#fff" } }}
          helperText='Your DIAM Testnet wallet address (or other account).'
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Asset Code"
            variant="outlined"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "#ccc" } }}
            inputProps={{ style: { color: "#fff" } }}
            helperText='"native" for DIAM, or e.g. "MYCOIN"'
          />
          <TextField
            label="Issuer (if not native)"
            variant="outlined"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "#ccc" } }}
            inputProps={{ style: { color: "#fff" } }}
            helperText='e.g. "GA123...". Leave blank if native.'
          />
        </Stack>

        <TextField
          label="Amount to Lock"
          variant="outlined"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#ccc" } }}
          inputProps={{ style: { color: "#fff" } }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateClaimableBalance}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Create Claimable Balance"}
        </Button>

        {transactionHash && (
          <Typography sx={{ color: "#4caf50" }}>
            Tx Hash: {transactionHash}
          </Typography>
        )}
        {transactionMessage && (
          <Typography
            sx={{ color: transactionStatus === "error" ? "#f44336" : "#4caf50" }}
          >
            {transactionMessage}
          </Typography>
        )}
      </Stack>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />
    </Paper>
  );
}
