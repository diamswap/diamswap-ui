// src/components/LiquidityPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { Aurora, TransactionBuilder, Operation, BASE_FEE } from "diamnet-sdk";
import { Buffer } from "buffer";
import LiquidityActionModal from "../LiquidityActionModal";
import TransactionModal from "../../comman/TransactionModal";

if (!window.Buffer) {
  window.Buffer = Buffer;
}

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

const WalletPoolsPage = () => {
  const walletId = localStorage.getItem("diamPublicKey");
  const [lpBalances, setLpBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // LiquidityActionModal state
  const [modalOpen, setModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState(""); // "deposit" or "withdraw"
  const [selectedPool, setSelectedPool] = useState(null); // now store full pool object

  // TransactionModal state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState(""); // "pending", "success", "error"
  const [txMessage, setTxMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // Fetch liquidity pool shares from Diamnet
  const fetchPools = async () => {
    setLoading(true);
    setError("");
    try {
      const account = await server.loadAccount(walletId);
      const pools = account.balances.filter(
        (bal) => bal.asset_type === "liquidity_pool_shares"
      );
      setLpBalances(pools);
    } catch (err) {
      setError("Error loading account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletId) {
      fetchPools();
    }
  }, [walletId]);

  // Open LiquidityActionModal for a given pool & mode.
  // Now we pass the pool object.
  const openLiquidityModal = (pool, mode) => {
    setSelectedPool(pool);
    setActionMode(mode);
    setModalOpen(true);
  };

  // Called from LiquidityActionModal when user confirms deposit/withdraw.
  // After a successful liquidity action, we also re-fetch the pool balances.
  const handleLiquidityAction = async (poolId, amt1, amt2) => {
    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage(`${actionMode} in progress...`);
    setTxHash("");

    try {
      const liquidityPoolIdBuffer = new Uint8Array(Buffer.from(poolId, "hex"));
      if (!walletId) throw new Error("No DIAM wallet connected.");
      const account = await server.loadAccount(walletId);
      let tx;
      if (actionMode === "deposit") {
        tx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            Operation.liquidityPoolDeposit({
              liquidityPoolId: liquidityPoolIdBuffer,
              maxAmountA: amt1, // Deposit TradeToken amount
              maxAmountB: amt2, // Deposit DIAM amount
              minPrice: { n: 1, d: 2 },
              maxPrice: { n: 2, d: 1 },
            })
          )
          .setTimeout(100)
          .build();
      } else if (actionMode === "withdraw") {
        tx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            Operation.liquidityPoolWithdraw({
              liquidityPoolId: liquidityPoolIdBuffer,
              amount: amt1,       // pool shares to burn
              minAmountA: amt2,   // min TradeToken to receive
              minAmountB: "0.0000001",
            })
          )
          .setTimeout(100)
          .build();
      } else {
        throw new Error("Unknown liquidity action mode");
      }

      if (!window.diam || typeof window.diam.sign !== "function") {
        throw new Error("DIAM Wallet extension not available for signing.");
      }
      const signResult = await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
      const response = await server.submitTransaction(tx);

      setTxStatus("success");
      setTxMessage("Transaction successful!");
      setTxHash(response.hash);
      console.log(`${actionMode} transaction submitted. Hash:`, response.hash);

      // Refresh the pool balances
      fetchPools();
    } catch (error) {
      setTxStatus("error");
      setTxMessage(error.message || "Transaction Error");
      setTxHash("");
      console.error("Liquidity action error:", error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#0A1B1F",
        color: "#fff",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #0E2429 0%, #0A1B1F 100%)",
            borderRadius: "24px",
            p: { xs: 3, sm: 5 },
            mb: 4,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
            Liquidity Pools Overview
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Explore the liquidity pool shares held in this wallet.
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 2, wordBreak: "break-all", opacity: 0.7 }}
          >
            Wallet ID: {walletId}
          </Typography>
        </Box>

        {/* Refresh + Title Row */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Your Liquidity Pools
          </Typography>
          <Button
            variant="contained"
            onClick={fetchPools}
            disabled={loading}
            sx={{
              backgroundColor: "#00CEE5",
              color: "#0A1B1F",
              "&:hover": { backgroundColor: "#00AEC5" },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Refresh"}
          </Button>
        </Box>

        {error && (
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Pools Table */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : lpBalances.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No liquidity pool shares found for this wallet.
          </Typography>
        ) : (
          <Paper
            sx={{
              backgroundColor: "#1B2730",
              borderRadius: "16px",
              p: 2,
              overflow: "auto",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#fff" }}>Pool ID</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Balance</TableCell>
                  <TableCell sx={{ color: "#fff", textAlign: "center" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lpBalances.map((lp, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ color: "#fff", wordBreak: "break-all" }}>
                      {lp.liquidity_pool_id}
                    </TableCell>
                    <TableCell sx={{ color: "#fff" }}>
                      {lp.balance}
                    </TableCell>
                    <TableCell sx={{ color: "#fff", textAlign: "center" }}>
                      <Button
                        variant="outlined"
                        sx={{
                          mr: 1,
                          borderColor: "#00CEE5",
                          color: "#00CEE5",
                          "&:hover": {
                            borderColor: "#00AEC5",
                            backgroundColor: "#00AEC51a",
                          },
                        }}
                        onClick={() => openLiquidityModal(lp, "deposit")}
                      >
                        Deposit
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{
                          borderColor: "#00CEE5",
                          color: "#00CEE5",
                          "&:hover": {
                            borderColor: "#00AEC5",
                            backgroundColor: "#00AEC51a",
                          },
                        }}
                        onClick={() => openLiquidityModal(lp, "withdraw")}
                      >
                        Withdraw
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Liquidity Action Modal */}
        <LiquidityActionModal
          open={modalOpen}
          mode={actionMode}
          poolId={selectedPool ? selectedPool.liquidity_pool_id : ""}
          available={selectedPool ? selectedPool.balance : ""}
          onClose={() => setModalOpen(false)}
          onAction={handleLiquidityAction}
        />

        {/* Transaction Modal */}
        <TransactionModal
          open={txModalOpen}
          onClose={() => setTxModalOpen(false)}
          status={txStatus}
          message={txMessage}
          transactionHash={txHash}
        />
      </Container>
    </Box>
  );
};

export default WalletPoolsPage;
