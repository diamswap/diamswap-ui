// src/components/LiquidityPoolDepositUI.jsx

import React, { useState } from "react";
import {
  Paper,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  Divider,
} from "@mui/material";
import {
  Asset,
  Aurora,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
  LiquidityPoolAsset,
  getLiquidityPoolId,
} from "diamnet-sdk";

export default function LiquidityPoolDepositUI() {
  const [userSecret, setUserSecret] = useState(
    "SB4EHJXQGD3TDDJJ3MQKL5LZ2JOZSIKTBITFG6VHQ4XPVI42PCBZWBLU"
  );
  const [issuerSecret, setIssuerSecret] = useState(
    "SB4EHJXQGD3TDDJJ3MQKL5LZ2JOZSIKTBITFG6VHQ4XPVI42PCBZWBLU"
  );

  const [diamDeposit, setDiamDeposit] = useState("10");
  const [tradeTokenDeposit, setTradeTokenDeposit] = useState("20");
  const [minPriceN, setMinPriceN] = useState("1");
  const [minPriceD, setMinPriceD] = useState("2");
  const [maxPriceN, setMaxPriceN] = useState("2");
  const [maxPriceD, setMaxPriceD] = useState("1");

  const [txHash, setTxHash] = useState("");
  const [poolId, setPoolId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const networkPassphrase = "Diamante Testnet 2024";
  const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

  const tradeToken = new Asset(
    "TradeToken",
    "GDMWE3SS63SCADICWTQ4GLL5QYCJ6DJLIH32APMRGIOC5O2IAH72VOUM"
  );

  const friendbotFund = async (publicKey) => {
    try {
      const resp = await fetch(
        `https://friendbot.diamcircle.io?addr=${publicKey}`
      );
      if (!resp.ok) {
        console.warn(`Friendbot 400 for ${publicKey}`);
      }
    } catch (err) {
      console.warn("Friendbot error:", err);
    }
  };

  const handleDeposit = async () => {
    setError("");
    setTxHash("");
    setPoolId("");
    setLoading(true);

    try {
      // 2) Load keypairs
      const userKeypair = Keypair.fromSecret(userSecret);
      const userPublicKey = userKeypair.publicKey();

      const issuerKeypair = Keypair.fromSecret(issuerSecret);
      const issuerPublicKey = issuerKeypair.publicKey();

      // 3) Attempt friendbot (if your network supports it)
      await friendbotFund(userPublicKey);

      // 4) Make sure user has a trustline for "TradeToken"
      let userAccount = await server.loadAccount(userPublicKey);
      let tx = new TransactionBuilder(userAccount, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(Operation.changeTrust({ asset: tradeToken }))
        .setTimeout(30)
        .build();
      tx.sign(userKeypair);
      await server.submitTransaction(tx);

      const issuerAccount = await server.loadAccount(issuerPublicKey);
      tx = new TransactionBuilder(issuerAccount, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: userPublicKey,
            asset: tradeToken,
            amount: tradeTokenDeposit, 
          })
        )
        .setTimeout(30)
        .build();
      tx.sign(issuerKeypair);
      await server.submitTransaction(tx);

      // 6) Now trust the LP share
      userAccount = await server.loadAccount(userPublicKey);
      const lpAsset = new LiquidityPoolAsset(Asset.native(), tradeToken, 30);
      const lpIdBuffer = getLiquidityPoolId("constant_product", lpAsset);
      const lpIdHex = lpIdBuffer.toString("hex");
      setPoolId(lpIdHex);

      tx = new TransactionBuilder(userAccount, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(Operation.changeTrust({ asset: lpAsset }))
        .setTimeout(30)
        .build();
      tx.sign(userKeypair);
      await server.submitTransaction(tx);

      userAccount = await server.loadAccount(userPublicKey);
      tx = new TransactionBuilder(userAccount, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: lpIdBuffer,
            maxAmountA: diamDeposit,     // "10"
            maxAmountB: tradeTokenDeposit, // "20"
            minPrice: { n: Number(minPriceN), d: Number(minPriceD) },
            maxPrice: { n: Number(maxPriceN), d: Number(maxPriceD) },
          })
        )
        .setTimeout(30)
        .build();
      tx.sign(userKeypair);

      const depositResp = await server.submitTransaction(tx);
      setTxHash(depositResp.hash);
    } catch (err) {
      console.error("Deposit flow error:", err);
      setError(err?.response?.data?.extras?.result_codes ?? err.message);
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
        p: 3,
        backgroundColor: "#121212",
        color: "#fff",
        borderRadius: 2,
        border: "1px solid gray",
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Liquidity Pool Deposit (with "TradeToken")
      </Typography>
      <Divider sx={{ mb: 2, borderColor: "#444" }} />

      <Stack spacing={2}>
        <TextField
          label="User Secret (Depositor)"
          variant="outlined"
          value={userSecret}
          onChange={(e) => setUserSecret(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#aaa" } }}
          inputProps={{ style: { color: "#fff" } }}
        />
        <TextField
          label="Issuer Secret (to send you TradeToken)"
          variant="outlined"
          value={issuerSecret}
          onChange={(e) => setIssuerSecret(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#aaa" } }}
          inputProps={{ style: { color: "#fff" } }}
        />

        <TextField
          label="Native (DIAM) Deposit Amount"
          variant="outlined"
          value={diamDeposit}
          onChange={(e) => setDiamDeposit(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#aaa" } }}
          inputProps={{ style: { color: "#fff" } }}
        />
        <TextField
          label='"TradeToken" Deposit Amount'
          variant="outlined"
          value={tradeTokenDeposit}
          onChange={(e) => setTradeTokenDeposit(e.target.value)}
          fullWidth
          InputLabelProps={{ style: { color: "#aaa" } }}
          inputProps={{ style: { color: "#fff" } }}
        />

        <Typography variant="subtitle1">Price Ratio (Min)</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Numerator"
            variant="outlined"
            type="number"
            value={minPriceN}
            onChange={(e) => setMinPriceN(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "#aaa" } }}
            inputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            label="Denominator"
            variant="outlined"
            type="number"
            value={minPriceD}
            onChange={(e) => setMinPriceD(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "#aaa" } }}
            inputProps={{ style: { color: "#fff" } }}
          />
        </Stack>

        <Typography variant="subtitle1">Price Ratio (Max)</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Numerator"
            variant="outlined"
            type="number"
            value={maxPriceN}
            onChange={(e) => setMaxPriceN(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "#aaa" } }}
            inputProps={{ style: { color: "#fff" } }}
          />
          <TextField
            label="Denominator"
            variant="outlined"
            type="number"
            value={maxPriceD}
            onChange={(e) => setMaxPriceD(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { color: "#aaa" } }}
            inputProps={{ style: { color: "#fff" } }}
          />
        </Stack>

        <Button
          variant="contained"
          color="primary"
          onClick={handleDeposit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Deposit Liquidity"}
        </Button>

        {txHash && (
          <Typography sx={{ color: "#4caf50" }}>
            Deposit successful! Tx Hash: {txHash}
          </Typography>
        )}
        {poolId && (
          <Typography sx={{ fontSize: "0.9rem" }}>
            Liquidity Pool ID: {poolId}
          </Typography>
        )}
        {error && (
          <Typography sx={{ color: "#f44336" }}>
            Error: {JSON.stringify(error)}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
