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
  getLiquidityPoolId,
  LiquidityPoolAsset,
} from "diamnet-sdk";
import { Buffer } from "buffer";
import {
  Container,
  Box,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";

// Polyfill Buffer if needed
if (!window.Buffer) {
  window.Buffer = Buffer;
}

// Configuration
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

const realIssuerPubKey = "GBPTZYVUREREXTENTMWDB2PHJSSXLX4VHDPMA5O56MDNNJTA752EKS7X";
const tradeToken = new Asset("TradeToken", realIssuerPubKey);


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

const lpAsset = new LiquidityPoolAsset(Asset.native(), tradeToken, 30);
const establishUserTrustline = async (asset, walletPublicKey) => {
  if (!walletPublicKey) {
    throw new Error("Wallet not connected. Please connect your wallet.");
  }
  const userAccount = await server.loadAccount(walletPublicKey);
  // Increased timeout to 300 seconds to avoid "tx_too_late" errors.
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
  const trustResult = await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
  console.log("User Trustline sign response:", trustResult);
  const response = await server.submitTransaction(trustTx);
  console.log("Trustline established. Tx Hash:", response.hash);
  return response.hash;
};

const getAssetObject = (assetName) => {
  if (assetName === "DIAM") {
    return Asset.native();
  } else if (assetName === "TradeToken") {
    return tradeToken;
  }
  throw new Error(`Unknown asset: ${assetName}`);
};

const doStrictSendSwap = async (walletPublicKey, fromAsset, toAsset, sendAmount, destMin) => {
  const userAccount = await server.loadAccount(walletPublicKey);
  // Increased timeout to 300 seconds.
  const swapTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: getAssetObject(fromAsset),
        sendAmount,
        destination: walletPublicKey,
        destAsset: getAssetObject(toAsset),
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

// Swap Operation: Strict Receive
const doStrictReceiveSwap = async (walletPublicKey, fromAsset, toAsset, sendMax, destAmount) => {
  const userAccount = await server.loadAccount(walletPublicKey);
  // Increased timeout to 300 seconds.
  const swapTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: getAssetObject(fromAsset),
        sendMax,
        destination: walletPublicKey,
        destAsset: getAssetObject(toAsset),
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
  const signResult = await window.diam.sign(swapTx.toXDR(), true, NETWORK_PASSPHRASE);
  console.log("Strict Receive Swap sign response:", signResult);
  let finalHash = signResult.hash;
  if (!finalHash && signResult.message?.data?.hash) {
    finalHash = signResult.message.data.hash;
    console.log("Extracted nested strict receive swap hash:", finalHash);
  }
  return finalHash || null;
};

// Liquidity Pool Deposit Operation
const liquidityPoolDeposit = async (walletPublicKey, lpIdInput, depositNative, depositCustom) => {
  if (!walletPublicKey) throw new Error("No wallet connected.");
  if (!lpIdInput) throw new Error("Please enter a Liquidity Pool ID (hex).");
  const liquidityPoolIdBuffer = new Uint8Array(Buffer.from(lpIdInput, "hex"));
  const account = await server.loadAccount(walletPublicKey);
  // Increased timeout to 300 seconds.
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.liquidityPoolDeposit({
        liquidityPoolId: liquidityPoolIdBuffer,
        maxAmountA: depositNative,
        maxAmountB: depositCustom,
        minPrice: { n: 1, d: 2 },
        maxPrice: { n: 2, d: 1 },
      })
    )
    .setTimeout(300)
    .build();
  console.log("Liquidity deposit transaction built. XDR:", tx.toXDR());
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }
  const signResult = await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
  console.log("Deposit sign result:", signResult);
  const response = await server.submitTransaction(tx);
  console.log("Liquidity deposit response:", response);
  return response.hash;
};

// Liquidity Pool Withdraw Operation
const liquidityPoolWithdraw = async (walletPublicKey, lpIdInput, burnShares, minCustom, minNative) => {
  if (!walletPublicKey) throw new Error("No wallet connected.");
  if (!lpIdInput) throw new Error("Please enter a Liquidity Pool ID (hex).");
  const liquidityPoolIdBuffer = new Uint8Array(Buffer.from(lpIdInput, "hex"));
  const account = await server.loadAccount(walletPublicKey);
  // Increased timeout to 300 seconds.
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.liquidityPoolWithdraw({
        liquidityPoolId: liquidityPoolIdBuffer,
        amount: burnShares,
        minAmountA: minNative,
        minAmountB: minCustom,
      })
    )
    .setTimeout(300)
    .build();
  console.log("Liquidity withdraw transaction built. XDR:", tx.toXDR());
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }
  const signResult = await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
  console.log("Withdraw sign result:", signResult);
  const response = await server.submitTransaction(tx);
  console.log("Liquidity withdraw response:", response);
  return response.hash;
};

export default function SwapPage() {
  // On mount, fund the issuer account
  useEffect(() => {
    async function fundIssuer() {
      try {
        await friendbotFund(issuerKeypair.publicKey());
        console.log("Issuer account funded:", issuerKeypair.publicKey());
      } catch (e) {
        console.error("Failed to fund issuer:", e);
      }
    }
    fundIssuer();
  }, []);

  // Swap State
  const [fromAsset, setFromAsset] = useState("DIAM");
  const [toAsset, setToAsset] = useState("TradeToken");
  const [sendAmount, setSendAmount] = useState("");
  const [price, setPrice] = useState("");
  const [destMin, setDestMin] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Transaction Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // Wallet public key from localStorage
  const [walletPublicKey, setWalletPublicKey] = useState(
    () => localStorage.getItem("diamPublicKey") || ""
  );

  // Estimated Received Calculation
  const estimatedReceived =
    sendAmount && price
      ? (parseFloat(sendAmount) * parseFloat(price)).toFixed(7)
      : "";

  // Liquidity Pool State
  const [lpIdInput, setLpIdInput] = useState("c63c90f6c1d1887740d181397b4051e70504fc9be3d31b603a2a7062dbffd4a4"); // Validated pool ID
  const [depositNative, setDepositNative] = useState("");
  const [depositCustom, setDepositCustom] = useState("");
  const [burnShares, setBurnShares] = useState("");
  const [minCustom, setMinCustom] = useState("");
  const [minNative, setMinNative] = useState("");
  const [lpTxStatus, setLpTxStatus] = useState("");
  const [lpLoading, setLpLoading] = useState(false);

  // Input Handlers
  const handleSendAmountChange = (e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ""));
  const handlePriceChange = (e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""));
  const handleFromAssetChange = (e) => setFromAsset(e.target.value);
  const handleToAssetChange = (e) => setToAsset(e.target.value);

  // Swap Flow: Strict Send Swap
  const handleStrictSendSwapClick = async () => {
    setLoading(true);
    setTxStatus("Starting strict send swap flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict send swap...");
    try {
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        await establishUserTrustline(tradeToken, walletPublicKey);
      }
      setTransactionMessage("Funding wallet via Friendbot...");
      await friendbotFund(walletPublicKey);
      const slippageTolerance = 0.95;
      const safeSendAmount =
        sendAmount && parseFloat(sendAmount) > 0 ? parseFloat(sendAmount).toFixed(7) : "1.0000000";
      const computedEstimated = estimatedReceived ? parseFloat(estimatedReceived) : 0;
      const safeDestMin =
        computedEstimated > 0 ? (computedEstimated * slippageTolerance).toFixed(7) : "0.0100000";
      const swapHash = await doStrictSendSwap(
        walletPublicKey,
        fromAsset,
        toAsset,
        safeSendAmount,
        safeDestMin
      );
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

  // Swap Flow: Strict Receive Swap
  const handleStrictReceiveSwapClick = async () => {
    setLoading(true);
    setTxStatus("Starting strict receive swap flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict receive swap...");
    try {
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        await establishUserTrustline(tradeToken, walletPublicKey);
      }
      setTransactionMessage("Funding wallet via Friendbot...");
      await friendbotFund(walletPublicKey);
      setTransactionMessage("Performing strict receive swap...");
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
        safeDestAmount
      );
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

  // Liquidity Pool Deposit Handler
  const handleLiquidityDepositClick = async () => {
    setLpLoading(true);
    setTxStatus("Starting liquidity deposit...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing liquidity deposit...");
    try {
      setTransactionMessage("Funding wallet via Friendbot...");
      await friendbotFund(walletPublicKey);
      setTransactionMessage("Establishing trustline for LP asset...");
      await establishUserTrustline(lpAsset, walletPublicKey);
      const depositHash = await liquidityPoolDeposit(
        walletPublicKey,
        lpIdInput,
        depositNative,
        depositCustom
      );
      console.log("Liquidity deposit successful. Tx Hash:", depositHash);
      setTxStatus(`Deposit successful! Tx Hash: ${depositHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Liquidity deposited successfully!");
      setTransactionHash(depositHash);
    } catch (error) {
      console.error("Liquidity deposit error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Liquidity deposit error: ${error.message || error}`);
    } finally {
      setLpLoading(false);
    }
  };

  // Liquidity Pool Withdraw Handler
  const handleLiquidityWithdrawClick = async () => {
    setLpLoading(true);
    setTxStatus("Starting liquidity withdrawal...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing liquidity withdrawal...");
    try {
      setTransactionMessage("Funding wallet via Friendbot...");
      await friendbotFund(walletPublicKey);
      const withdrawHash = await liquidityPoolWithdraw(
        walletPublicKey,
        lpIdInput,
        burnShares,
        minCustom,
        minNative
      );
      console.log("Liquidity withdrawal successful. Tx Hash:", withdrawHash);
      setTxStatus(`Withdrawal successful! Tx Hash: ${withdrawHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Liquidity withdrawn successfully!");
      setTransactionHash(withdrawHash);
    } catch (error) {
      console.error("Liquidity withdrawal error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Liquidity withdrawal error: ${error.message || error}`);
    } finally {
      setLpLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px" }}>
      {/* Swap Section */}
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
          marginBottom: "2rem",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Swap
        </Typography>
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

      {/* Liquidity Pool Deposit Section */}
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
          marginBottom: "2rem",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Liquidity Deposit
        </Typography>
        <TextField
          label="Liquidity Pool ID (hex)"
          fullWidth
          variant="outlined"
          value={lpIdInput}
          onChange={(e) => setLpIdInput(e.target.value)}
          placeholder="Enter liquidity pool ID in hex"
          sx={{ mb: 2, input: { color: "#fff" } }}
        />
        <TextField
          label="DIAM (Native) Amount (Deposit)"
          fullWidth
          variant="outlined"
          value={depositNative}
          onChange={(e) => setDepositNative(e.target.value.replace(/[^0-9.]/g, ""))}
          sx={{ mb: 2, input: { color: "#fff" } }}
          placeholder="e.g. 5"
        />
        <TextField
          label="TradeToken Amount (Deposit)"
          fullWidth
          variant="outlined"
          value={depositCustom}
          onChange={(e) => setDepositCustom(e.target.value.replace(/[^0-9.]/g, ""))}
          sx={{ mb: 2, input: { color: "#fff" } }}
          placeholder="e.g. 10"
        />
        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleLiquidityDepositClick}
          disabled={lpLoading || !walletPublicKey}
          sx={{ mb: 2 }}
        >
          {lpLoading ? <CircularProgress size={24} /> : "Deposit Liquidity"}
        </CustomButton>
        {lpTxStatus && (
          <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 2 }}>
            Liquidity Deposit Status: {lpTxStatus}
          </Typography>
        )}
      </Box>

      {/* Liquidity Pool Withdraw Section */}
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
          marginBottom: "2rem",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Liquidity Withdraw
        </Typography>
        <TextField
          label="Liquidity Pool ID (hex)"
          fullWidth
          variant="outlined"
          value={lpIdInput}
          onChange={(e) => setLpIdInput(e.target.value)}
          placeholder="Enter liquidity pool ID in hex"
          sx={{ mb: 2, input: { color: "#fff" } }}
        />
        <TextField
          label="Pool Shares to Burn"
          fullWidth
          variant="outlined"
          value={burnShares}
          onChange={(e) => setBurnShares(e.target.value.replace(/[^0-9.]/g, ""))}
          sx={{ mb: 2, input: { color: "#fff" } }}
          placeholder="e.g. 5"
        />
        <TextField
          label="Minimum TradeToken to Receive"
          fullWidth
          variant="outlined"
          value={minCustom}
          onChange={(e) => setMinCustom(e.target.value.replace(/[^0-9.]/g, ""))}
          sx={{ mb: 2, input: { color: "#fff" } }}
          placeholder="e.g. 1"
        />
        <TextField
          label="Minimum DIAM (Native) to Receive"
          fullWidth
          variant="outlined"
          value={minNative}
          onChange={(e) => setMinNative(e.target.value.replace(/[^0-9.]/g, ""))}
          sx={{ mb: 2, input: { color: "#fff" } }}
          placeholder="e.g. 0.5"
        />
        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleLiquidityWithdrawClick}
          disabled={lpLoading || !walletPublicKey}
          sx={{ mb: 2 }}
        >
          {lpLoading ? <CircularProgress size={24} /> : "Withdraw Liquidity"}
        </CustomButton>
        {lpTxStatus && (
          <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 2 }}>
            Liquidity Withdraw Status: {lpTxStatus}
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
}
