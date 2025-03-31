import React, { useState } from "react";
import {
  Aurora,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  getLiquidityPoolId,
} from "diamnet-sdk";
import { Buffer } from "buffer";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

// Adjust the import paths if needed
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { createPatchedAsset, createPatchedLiquidityPoolAsset } from "../patchAssets";

// Polyfill Buffer if needed
if (!window.Buffer) {
  window.Buffer = Buffer;
}

// Network & server configuration
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// For demo, generate ephemeral keypairs for issuer & distributor
const issuerKeypair = Keypair.random();
const distributorKeypair = Keypair.random();

// 1) Create the custom asset using createPatchedAsset:
const customAsset = createPatchedAsset("TradeToken", issuerKeypair.publicKey());

// 2) Create a LiquidityPoolAsset from native + custom asset
const lpAsset = createPatchedLiquidityPoolAsset(
  createPatchedAsset("native"),
  customAsset,
  30
);

// 3) Compute the Liquidity Pool ID (as a hex string)
const computedPoolIdHex = getLiquidityPoolId("constant_product", {
  assetA: lpAsset.assetA,
  assetB: lpAsset.assetB,
  fee: 30,
}).toString("hex");

// Helper: Create a valid liquidity pool share asset object for trustline purposes
const createLiquidityPoolShareAssetForTrust = (poolIdHex) => {
  return {
    getAssetType: () => "liquidity_pool_shares",
    liquidityPoolId: poolIdHex,
  };
};

// Helper: log message to both console and state
const logMessage = (prevLogs, msg) => {
  console.log(msg);
  return [...prevLogs, msg];
};

const LiquidityPage = () => {
  // --------------------------
  // State variables
  // --------------------------
  const [logs, setLogs] = useState([]);
  const [lpIdInput, setLpIdInput] = useState("");
  const [depositCustom, setDepositCustom] = useState("");
  const [depositXLM, setDepositXLM] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");
  const [minCustom, setMinCustom] = useState("");
  const [minXLM, setMinXLM] = useState("");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // Transaction Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(""); // "pending", "success", "error"
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const walletPublicKey = localStorage.getItem("diamPublicKey") || "";

  // --------------------------
  // Helper functions
  // --------------------------
  const fundAccount = async (keypair) => {
    try {
      const response = await fetch(`${friendbotUrl}${keypair.publicKey()}`);
      if (response.ok) {
        setLogs((prev) =>
          logMessage(prev, `✅ Funded: ${keypair.publicKey()}`)
        );
      } else {
        setLogs((prev) =>
          logMessage(
            prev,
            `❌ Funding failed for ${keypair.publicKey()} - ${response.statusText}`
          )
        );
      }
    } catch (error) {
      setLogs((prev) =>
        logMessage(prev, `❌ Error funding ${keypair.publicKey()}: ${error}`)
      );
    }
  };

  // Liquidity Pool Deposit function
  const liquidityPoolDeposit = async () => {
    try {
      setTransactionMessage("Depositing into liquidity pool...");
      const walletPK = localStorage.getItem("diamPublicKey");
      if (!walletPK) {
        throw new Error("No DIAM wallet connected. Please connect your wallet.");
      }
      // Use the provided LP ID or fallback to the computed one.
      const lpIdHex = lpIdInput.trim() || computedPoolIdHex;
      const liquidityPoolIdBuffer = new Uint8Array(
        Buffer.from(lpIdHex, "hex")
      );

      const account = await server.loadAccount(walletPK);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: liquidityPoolIdBuffer,
            maxAmountA: depositCustom,
            maxAmountB: depositXLM,
            minPrice: { numerator: 1, denominator: 2 },
            maxPrice: { numerator: 2, denominator: 1 },
          })
        )
        .setTimeout(100)
        .build();

      if (!window.diam || typeof window.diam.sign !== "function") {
        throw new Error("DIAM Wallet extension not available for signing.");
      }

      const signResponse = await window.diam.sign(
        tx.toXDR(),
        true,
        NETWORK_PASSPHRASE
      );
      setLogs((prev) =>
        logMessage(prev, "Deposit sign response: " + JSON.stringify(signResponse))
      );
      const signedTxXDR = signResponse.xdr || signResponse;
      const response = await server.submitTransaction(signedTxXDR);
      setLogs((prev) =>
        logMessage(prev, `✅ Liquidity deposited (Tx: ${response.hash})`)
      );
      return response.hash;
    } catch (error) {
      setLogs((prev) =>
        logMessage(
          prev,
          `❌ Liquidity pool deposit error: ${error?.response?.data || error}`
        )
      );
      throw error;
    }
  };

  // Liquidity Pool Withdraw function
  const liquidityPoolWithdraw = async () => {
    try {
      setTransactionMessage("Withdrawing from liquidity pool...");
      const walletPK = localStorage.getItem("diamPublicKey");
      if (!walletPK) {
        throw new Error("No DIAM wallet connected. Please connect your wallet.");
      }
      const lpIdHex = lpIdInput.trim() || computedPoolIdHex;
      const liquidityPoolIdBuffer = new Uint8Array(
        Buffer.from(lpIdHex, "hex")
      );
      const account = await server.loadAccount(walletPK);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: liquidityPoolIdBuffer,
            amount: withdrawShares,
            minAmountA: minCustom,
            minAmountB: minXLM,
          })
        )
        .setTimeout(100)
        .build();

      if (!window.diam || typeof window.diam.sign !== "function") {
        throw new Error("DIAM Wallet extension not available for signing.");
      }

      const signResponse = await window.diam.sign(
        tx.toXDR(),
        true,
        NETWORK_PASSPHRASE
      );
      setLogs((prev) =>
        logMessage(prev, "Withdraw sign response: " + JSON.stringify(signResponse))
      );
      const signedTxXDR = signResponse.xdr || signResponse;
      const response = await server.submitTransaction(signedTxXDR);
      setLogs((prev) =>
        logMessage(prev, `✅ Liquidity withdrawn (Tx: ${response.hash})`)
      );
      return response.hash;
    } catch (error) {
      setLogs((prev) =>
        logMessage(
          prev,
          `❌ Liquidity pool withdrawal error: ${error?.response?.data || error}`
        )
      );
      throw error;
    }
  };

  // --------------------------
  // Handlers
  // --------------------------
  const handleDepositClick = async () => {
    setLoading(true);
    setTxStatus("Starting liquidity deposit...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing liquidity deposit...");

    try {
      // Fund ephemeral distributor (demo)
      setTransactionMessage("Funding distributor account...");
      await fundAccount(distributorKeypair);

      // Load user account from DIAM
      let userAccount = await server.loadAccount(walletPublicKey);

      // 1. Establish trustline for the custom asset (TradeToken)
      setTransactionMessage("Establishing trustline for TradeToken on your wallet...");
      const trustCustomTx = new TransactionBuilder(userAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.changeTrust({ asset: customAsset }))
        .setTimeout(30)
        .build();
      const trustCustomSignResponse = await window.diam.sign(
        trustCustomTx.toXDR(),
        true,
        NETWORK_PASSPHRASE
      );
      const trustCustomXDR = trustCustomSignResponse.xdr || trustCustomSignResponse;
      await server.submitTransaction(trustCustomXDR);
      setLogs((prev) =>
        logMessage(prev, "✅ Trustline established for TradeToken")
      );

      // Reload account to update its sequence number
      userAccount = await server.loadAccount(walletPublicKey);

      // 2. Establish liquidity pool trustline (for liquidity pool shares)
      // Create a patched asset with the required getAssetType method.
      const lpAssetForTrust = createLiquidityPoolShareAssetForTrust(computedPoolIdHex);
      setTransactionMessage("Establishing liquidity pool trustline on your wallet...");
      const trustLpTx = new TransactionBuilder(userAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.changeTrust({ asset: lpAssetForTrust }))
        .setTimeout(30)
        .build();
      const trustLpSignResponse = await window.diam.sign(
        trustLpTx.toXDR(),
        true,
        NETWORK_PASSPHRASE
      );
      const trustLpXDR = trustLpSignResponse.xdr || trustLpSignResponse;
      await server.submitTransaction(trustLpXDR);
      setLogs((prev) =>
        logMessage(prev, "✅ Liquidity pool trustline established")
      );

      // 3. Deposit liquidity into the pool
      const depositHash = await liquidityPoolDeposit();
      setTxStatus(`Deposit successful! Tx Hash: ${depositHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Liquidity deposited successfully!");
      setTransactionHash(depositHash);
    } catch (error) {
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Liquidity deposit error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = async () => {
    setLoading(true);
    setTxStatus("Starting liquidity withdrawal...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing liquidity withdrawal...");

    try {
      // Fund ephemeral distributor (demo)
      setTransactionMessage("Funding distributor account...");
      await fundAccount(distributorKeypair);

      // Withdraw liquidity from the pool
      const withdrawHash = await liquidityPoolWithdraw();
      setTxStatus(`Withdrawal successful! Tx Hash: ${withdrawHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Liquidity withdrawn successfully!");
      setTransactionHash(withdrawHash);
    } catch (error) {
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(
        `Liquidity withdrawal error: ${error.message || error}`
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Render UI
  // --------------------------
  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px" }}>
      {/* Wallet Connection UI */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        {!localStorage.getItem("diamPublicKey") ? (
          <Button
            variant="contained"
            onClick={() => {
              if (!window.diam || typeof window.diam.connect !== "function") {
                alert("DIAM Wallet extension not installed.");
                return;
              }
              window.diam
                .connect()
                .then((res) => {
                  const pk = res?.message?.data?.[0]?.diamPublicKey;
                  if (pk) {
                    localStorage.setItem("diamPublicKey", pk);
                    setTxStatus(`Connected: ${pk.slice(0, 6)}...${pk.slice(-6)}`);
                  } else {
                    alert("Could not retrieve DIAM public key from extension.");
                  }
                })
                .catch((err) => {
                  alert("Error connecting DIAM wallet: " + err);
                });
            }}
          >
            Connect DIAM Wallet
          </Button>
        ) : (
          <Typography variant="body2" sx={{ color: "lightgreen" }}>
            Connected: {localStorage.getItem("diamPublicKey").slice(0, 6)}...
            {localStorage.getItem("diamPublicKey").slice(-6)}
          </Typography>
        )}
      </Box>

      <Typography variant="h4" align="center" sx={{ mb: 4 }}>
        Liquidity Pool
      </Typography>

      {/* Show computed Pool ID */}
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Typography variant="subtitle1">
          Computed Liquidity Pool ID: {computedPoolIdHex}
        </Typography>
      </Box>

      {/* (Optional) Manually override pool ID */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Liquidity Pool ID (hex)"
          value={lpIdInput}
          onChange={(e) => setLpIdInput(e.target.value)}
          placeholder="Enter liquidity pool ID in hex (optional)"
          InputProps={{
            style: { color: "#fff", border: "1px solid #FFFFFF4D" },
          }}
        />
      </Box>

      {/* Deposit Section */}
      <Box
        sx={{
          backgroundColor: "rgba(0,206,229,0.06)",
          margin: "1rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
          Deposit Liquidity
        </Typography>
        <TextField
          label="TradeToken Amount (Deposit)"
          fullWidth
          variant="outlined"
          value={depositCustom}
          onChange={(e) =>
            setDepositCustom(e.target.value.replace(/[^0-9.]/g, ""))
          }
          sx={{ mb: 2, input: { color: "#fff" } }}
        />
        <TextField
          label="DIAM (XLM) Amount (Deposit)"
          fullWidth
          variant="outlined"
          value={depositXLM}
          onChange={(e) => setDepositXLM(e.target.value.replace(/[^0-9.]/g, ""))}
          sx={{ mb: 2, input: { color: "#fff" } }}
        />
        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleDepositClick}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Deposit Liquidity"}
        </CustomButton>
      </Box>

      {/* Withdraw Section */}
      <Box
        sx={{
          backgroundColor: "rgba(0,206,229,0.06)",
          margin: "1rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          mt: 3,
        }}
      >
        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
          Withdraw Liquidity
        </Typography>
        <TextField
          label="Pool Shares to Burn"
          fullWidth
          variant="outlined"
          value={withdrawShares}
          onChange={(e) =>
            setWithdrawShares(e.target.value.replace(/[^0-9.]/g, ""))
          }
          sx={{ mb: 2, input: { color: "#fff" } }}
        />
        <TextField
          label="Minimum TradeToken to Receive"
          fullWidth
          variant="outlined"
          value={minCustom}
          onChange={(e) => setMinCustom(e.target.value.replace(/[^0-9.]/g, ""))}
          sx={{ mb: 2, input: { color: "#fff" } }}
        />
        <TextField
          label="Minimum DIAM (XLM) to Receive"
          fullWidth
          variant="outlined"
          value={minXLM}
          onChange={(e) => setMinXLM(e.target.value.replace(/[^0-9.]/g, ""))}
          sx={{ mb: 2, input: { color: "#fff" } }}
        />
        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleWithdrawClick}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Withdraw Liquidity"}
        </CustomButton>
      </Box>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />

      {/* Logs Display */}
      <Box
        sx={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#111",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "0.8rem",
        }}
      >
        <Typography variant="caption">
          Logs:
          <br />
          {logs.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </Typography>
      </Box>
    </Container>
  );
};

export default LiquidityPage;
