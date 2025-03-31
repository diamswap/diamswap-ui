import React, { useState } from "react";
import {
  Box,
  Paper,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import {
  Aurora,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from "diamnet-sdk";
import { Buffer } from "buffer";

if (!window.Buffer) {
  window.Buffer = Buffer;
}
export default function LiquidityPoolWithdrawUI() {
  // Example default secret key (test only!)
  const [secret, setSecret] = useState(
    "SB4EHJXQGD3TDDJJ3MQKL5LZ2JOZSIKTBITFG6VHQ4XPVI42PCBZWBLU"
  );
  // Liquidity pool ID (hex string) you want to withdraw from
  const [liquidityPoolId, setLiquidityPoolId] = useState(
    "440027a4a8ce095f9f2c606dde7fd789fd7c2f7e5c1f1f681aef818bef417cac"
  );
  // Number of liquidity pool shares to withdraw
  const [withdrawShares, setWithdrawShares] = useState("3");
  // Minimum amounts of each asset you'd like to receive
  const [minAmountA, setMinAmountA] = useState("1");
  const [minAmountB, setMinAmountB] = useState("1");

  const [transactionHash, setTransactionHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handler for withdrawing from the pool
  const handleWithdraw = async () => {
    setError("");
    setTransactionHash("");
    setLoading(true);

    try {
      // Connect to Diamnet testnet
      const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
      const keypair = Keypair.fromSecret(secret);
      const publicKey = keypair.publicKey();

      // Load the account
      const account = await server.loadAccount(publicKey);

      // Convert liquidityPoolId (hex) to Buffer
      const liquidityPoolIdBuffer = Buffer.from(liquidityPoolId, "hex");

      // Build the transaction to withdraw liquidity
      const withdrawTx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: "Diamante Testnet 2024",
      })
        .addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: liquidityPoolIdBuffer,
            amount: withdrawShares,   // # of pool shares to redeem
            minAmountA: minAmountA,   // Minimum amount of asset A
            minAmountB: minAmountB,   // Minimum amount of asset B
          })
        )
        .setTimeout(30)
        .build();

      // Sign the transaction
      withdrawTx.sign(keypair);

      // Submit to the Diamnet network
      const result = await server.submitTransaction(withdrawTx);
      setTransactionHash(result.hash);
    } catch (err) {
      console.error("Liquidity withdraw error:", err);
      // Try to show a more specific error if available
      if (err.response?.data?.extras?.result_codes) {
        setError(
          `Withdraw failed: ${JSON.stringify(
            err.response.data.extras.result_codes
          )}`
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 600,
        margin: "2rem auto",
        padding: 3,
        backgroundColor: "#121212", // Dark background
        color: "#fff",
        borderRadius: 2,
        border: "1px solid gray",
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Liquidity Pool Withdraw
      </Typography>
      <Divider sx={{ marginBottom: 2, borderColor: "#444" }} />
      <Stack spacing={2}>
        {/* Secret key */}
        <TextField
          label="Secret Key"
          variant="outlined"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#aaa" } }}
          inputProps={{ style: { color: "#fff" } }}
        />
        {/* Liquidity Pool ID */}
        <TextField
          label="Liquidity Pool ID (Hex)"
          variant="outlined"
          value={liquidityPoolId}
          onChange={(e) => setLiquidityPoolId(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#aaa" } }}
          inputProps={{ style: { color: "#fff" } }}
        />
        {/* Withdraw shares */}
        <TextField
          label="Pool Shares to Withdraw"
          variant="outlined"
          value={withdrawShares}
          onChange={(e) => setWithdrawShares(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#aaa" } }}
          inputProps={{ style: { color: "#fff" } }}
        />
        {/* Minimum amounts */}
        <Typography variant="subtitle1">Minimum Amounts to Receive</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Min Amount A"
            variant="outlined"
            type="number"
            value={minAmountA}
            onChange={(e) => setMinAmountA(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "#aaa" } }}
            inputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            label="Min Amount B"
            variant="outlined"
            type="number"
            value={minAmountB}
            onChange={(e) => setMinAmountB(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "#aaa" } }}
            inputProps={{ style: { color: "#fff" } }}
          />
        </Stack>
        {/* Withdraw button */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleWithdraw}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Withdraw"}
        </Button>

        {/* Transaction hash on success */}
        {transactionHash && (
          <Typography variant="body1" sx={{ color: "#4caf50" }}>
            Transaction successful: {transactionHash}
          </Typography>
        )}
        {/* Error message */}
        {error && (
          <Typography variant="body1" sx={{ color: "#f44336" }}>
            Error: {error}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}