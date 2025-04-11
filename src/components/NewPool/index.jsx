




import React, { useState } from "react";
import {
  Asset,
  Aurora,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  LiquidityPoolAsset,
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
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";

// Polyfill Buffer if needed
if (!window.Buffer) {
  window.Buffer = Buffer;
}

// Network & server configuration
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

const customAsset = new Asset(
  "TradeToken",
  "GA4YYAEUKT2C323PT35G363ABZH5WPG3O2N24XTHLKSGMHOBMN2SNQHQ"
);

const distributorKeypair = Keypair.random();
const lpAsset = new LiquidityPoolAsset(Asset.native(), customAsset, 30);

// Helper for logging messages
const logMessage = (prevLogs, msg) => {
  console.log(msg);
  return [...prevLogs, msg];
};

// Helper: Create trustline for a given asset using the connected wallet.
const createTrustlineForConnectedWallet = async (asset) => {
  const walletPK = localStorage.getItem("diamPublicKey");
  if (!walletPK) {
    throw new Error("No DIAM wallet connected. Please connect your wallet.");
  }
  try {
    const account = await server.loadAccount(walletPK);
    const tx = new TransactionBuilder(account, {
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

    const xdr = tx.toXDR();
    console.log("Trustline XDR for connected wallet:", xdr);

    // Use the DIAM Wallet extension to sign the transaction
    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const signResult = await window.diam.sign(xdr, true, NETWORK_PASSPHRASE);
    console.log("Trustline sign result for connected wallet:", signResult);

    // Submit the transaction
    const response = await server.submitTransaction(tx);
    console.log("Trustline established. Tx Hash:", response.hash);
    return response.hash;
  } catch (error) {
    console.error("Error creating trustline for connected wallet:", error);
    throw error;
  }
};

const LiquidityPage = () => {

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

  // --------------------------
  // Helper Functions
  // --------------------------
  // Friendbot funding helper
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
        logMessage(prev, `❌ Error funding ${keypair.publicKey()} - ${error}`)
      );
    }
  };


 

  const handleDepositClick = async () => {
    setLoading(true);
    setTxStatus("Starting liquidity deposit...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing liquidity deposit...");
    try {
      console.log("Starting liquidity deposit process.");
  
      // 1. Fund distributor account (if needed)
      setTransactionMessage("Funding distributor account...");
      console.log("Funding distributor account for:", distributorKeypair.publicKey());
      await fundAccount(distributorKeypair);
      console.log("Distributor account funded.");
  
      // 2. Establish trustline for the custom asset (TradeToken)
      setTransactionMessage("Creating trustline for custom asset on your wallet...");
      console.log("Creating trustline for custom asset:", customAsset);
      const trustlineCustomTxHash = await createTrustlineForConnectedWallet(customAsset);
      console.log("Custom asset trustline established with Tx Hash:", trustlineCustomTxHash);
  
      // 3. Establish trustline for the LP asset
      setTransactionMessage("Creating trustline for LP asset on your wallet...");
      console.log("Creating trustline for LP asset:", lpAsset);
      const trustlineLPHash = await createTrustlineForConnectedWallet(lpAsset);
      console.log("LP asset trustline established with Tx Hash:", trustlineLPHash);
  
      // 4. Proceed with liquidity deposit
      setTransactionMessage("Depositing into liquidity pool...");
      console.log("Depositing liquidity with parameters:",
        { lpIdInput, depositCustom, depositXLM }
      );
      const depositHash = await liquidityPoolDeposit();
      console.log("Liquidity deposit successful with Tx Hash:", depositHash);
      setTxStatus(`Deposit successful! Tx Hash: ${depositHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Liquidity deposited successfully!");
      setTransactionHash(depositHash);
    } catch (error) {
      console.error("Error during liquidity deposit:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Liquidity deposit error: ${error.message || error}`);
    } finally {
      console.log("Liquidity deposit process complete.");
      setLoading(false);
    }
  };
  
  const liquidityPoolDeposit = async () => {
    try {
      console.log("Starting liquidityPoolDeposit function.");
      setTransactionMessage("Depositing into liquidity pool...");
      const walletPK = localStorage.getItem("diamPublicKey");
      if (!walletPK) {
        throw new Error("No DIAM wallet connected. Please connect your wallet.");
      }
      if (!lpIdInput) {
        throw new Error("Please enter a Liquidity Pool ID (hex).");
      }
      // Convert LP ID (hex string) to Uint8Array
      const liquidityPoolIdBuffer = new Uint8Array(Buffer.from(lpIdInput, "hex"));
      console.log("Converted Liquidity Pool ID:", liquidityPoolIdBuffer);
  
      const account = await server.loadAccount(walletPK);
      console.log("Loaded account for deposit:", account.accountId());
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: liquidityPoolIdBuffer,
            maxAmountA: depositCustom,
            maxAmountB: depositXLM,
            minPrice: { n: 1, d: 2 },
            maxPrice: { n: 2, d: 1 },
          })
        )
        .setTimeout(100)
        .build();
      console.log("Liquidity deposit transaction built. XDR:", tx.toXDR());
  
      if (!window.diam || typeof window.diam.sign !== "function") {
        throw new Error("DIAM Wallet extension not available for signing.");
      }
      console.log("Requesting signature for liquidity deposit transaction.");
      const signResult = await window.diam.sign(
        tx.toXDR(),
        true,
        NETWORK_PASSPHRASE
      );
      console.log("Deposit sign result:", signResult);
  
      const response = await server.submitTransaction(tx);
      console.log("Liquidity deposit transaction submitted. Response:", response);
      setTransactionMessage("Liquidity deposited successfully!");
      return response.hash;
    } catch (error) {
      console.error("Error in liquidityPoolDeposit:", error);
      throw error;
    }
  };

  

  // Liquidity Pool Withdraw
  const liquidityPoolWithdraw = async () => {
    try {
      setTransactionMessage("Withdrawing from liquidity pool...");
      const walletPK = localStorage.getItem("diamPublicKey");
      if (!walletPK) {
        throw new Error("No DIAM wallet connected. Please connect your wallet.");
      }
      if (!lpIdInput) {
        throw new Error("Please enter a Liquidity Pool ID (hex).");
      }

      const liquidityPoolIdBuffer = new Uint8Array(
        Buffer.from(lpIdInput, "hex")
      );
      const account = await server.loadAccount(walletPK);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: liquidityPoolIdBuffer,
            amount: withdrawShares, // pool shares to burn
            minAmountA: minCustom,
            minAmountB: minXLM,
          })
        )
        .setTimeout(100)
        .build();

      if (!window.diam || typeof window.diam.sign !== "function") {
        throw new Error("DIAM Wallet extension not available for signing.");
      }

      const signResult = await window.diam.sign(
        tx.toXDR(),
        true,
        NETWORK_PASSPHRASE
      );
      setLogs((prev) =>
        logMessage(prev, "Withdraw sign response: " + JSON.stringify(signResult))
      );

      const response = await server.submitTransaction(tx);
      setLogs((prev) =>
        logMessage(prev, `✅ Liquidity withdrawn (Tx: ${response.hash})`)
      );
      return response.hash;
    } catch (error) {
      setLogs((prev) =>
        logMessage(
          prev,
          `❌ Liquidity pool withdrawal error: ${
            error?.response?.data || error
          }`
        )
      );
      throw error;
    }
  };

  // --------------------------
  // Click Handlers
  // --------------------------

  
  const handleWithdrawClick = async () => {
    setLoading(true);
    setTxStatus("Starting liquidity withdrawal...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing liquidity withdrawal...");
    try {
      // (Optional demo) Fund distributor account
      setTransactionMessage("Funding distributor account...");
      await fundAccount(distributorKeypair);

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
   
      <Typography variant="h4" align="center" sx={{ mb: 4 }}>
        Liquidity Pool
      </Typography>

      {/* Liquidity Pool ID */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Liquidity Pool ID (hex)"
          value={lpIdInput}
          onChange={(e) => setLpIdInput(e.target.value)}
          placeholder="Enter liquidity pool ID in hex"
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
          position: "relative",
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
          position: "relative",
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
