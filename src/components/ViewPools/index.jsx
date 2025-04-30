// src/components/ViewPosition/index.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Button,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import {
  Aurora,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  Asset,
  LiquidityPoolAsset,
} from "diamnet-sdk";
import { Buffer } from "buffer";
import LiquidityActionModal from "../LiquidityActionModal";
import ClaimFeesModal from "../ClaimFeesModal";
import TransactionModal from "../../comman/TransactionModal";
import {
  IoAddCircleOutline,
  IoRemoveCircleOutline,
  IoCashOutline,
} from "react-icons/io5";

if (!window.Buffer) window.Buffer = Buffer;

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// Helpers
const codeOf = (asset) => (asset === "native" ? "DIAM" : (asset || "").split(":")[0]);

// Price range placeholders
const FULL_MIN = { n: 1, d: 10000000 };
const FULL_MAX = { n: 1000000000, d: 1 };

export default function ViewPosition() {
  const walletId = localStorage.getItem("diamPublicKey");

  // All pools
  const [allPools, setAllPools] = useState([]);
  // User's share balances
  const [userShares, setUserShares] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState(""); // "deposit" | "withdraw"
  const [selectedPool, setSelectedPool] = useState(null);

  const [claimOpen, setClaimOpen] = useState(false);

  // Tx state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txMessage, setTxMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // 1) Fetch ALL pools
  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://diamtestnet.diamcircle.io/liquidity_pools?limit=200");
      const j = await res.json();
      setAllPools(j._embedded?.records || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2) Fetch user's LP-share balances
  const fetchUserShares = useCallback(async () => {
    if (!walletId) return;
    try {
      const acct = await server.loadAccount(walletId);
      const map = {};
      acct.balances
        .filter((b) => b.asset_type === "liquidity_pool_shares")
        .forEach((b) => (map[b.liquidity_pool_id] = parseFloat(b.balance)));
      setUserShares(map);
    } catch (e) {
      console.error("Error loading user shares:", e);
    }
  }, [walletId]);

  useEffect(() => {
    fetchPools();
    fetchUserShares();
  }, [fetchPools, fetchUserShares]);

  // Open deposit/withdraw modal
  const openModal = (pool, mode) => {
    setSelectedPool(pool);
    setActionMode(mode);
    setModalOpen(true);
  };

  // Open claim-fees modal
  const openClaim = (pool) => {
    setSelectedPool(pool);
    setClaimOpen(true);
  };

  // Handle deposit or withdraw
  const handleLiquidityAction = async (
    poolId,
    amtA,
    amtB,
    minPrice,
    maxPrice
  ) => {
    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage(`${actionMode.charAt(0).toUpperCase() + actionMode.slice(1)} in progress…`);
    setTxHash("");

    try {
      // build buffer & tx builder
      const poolIdBuf = new Uint8Array(Buffer.from(poolId, "hex"));
      const acct = await server.loadAccount(walletId);
      const txb = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      // build LP‐share asset for trustline
      const [r0, r1] = selectedPool.reserves;
      const assetA = r0.asset === "native"
        ? Asset.native()
        : new Asset(...r0.asset.split(":"));
      const assetB = r1.asset === "native"
        ? Asset.native()
        : new Asset(...r1.asset.split(":"));
      const feeBp = selectedPool.fee_bp ?? 30;
      const lpAsset = new LiquidityPoolAsset(assetA, assetB, feeBp);

      // 1️⃣ ensure trustline
      txb.addOperation(
        Operation.changeTrust({ asset: lpAsset })
      );

      // 2️⃣ deposit or withdraw
      if (actionMode === "deposit") {
        txb.addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: poolIdBuf,
            maxAmountA: amtA,
            maxAmountB: amtB,
            minPrice,
            maxPrice,
          })
        );
      } else {
        txb.addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: poolIdBuf,
            amount: amtA,
            minAmountA: amtB,
            minAmountB: "0.0000001",
          })
        );
      }

      const tx = txb.setTimeout(100).build();
      await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
      const resp = await server.submitTransaction(tx);

      setTxStatus("success");
      setTxMessage("Transaction successful!");
      setTxHash(resp.hash);
      fetchUserShares();
    } catch (e) {
      setTxStatus("error");
      const code = e.extras?.result_codes?.operations?.[0];
      setTxMessage(code === "op_underfunded" ? "Insufficient balance" : e.message);
    } finally {
      setModalOpen(false);
    }
  };

  // Handle claim fees (withdraw+redeposit)
  const handleConfirmClaim = async (poolIdStr) => {
    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage("Claim in progress…");
    setTxHash("");

    try {
      const poolRec = await server.liquidityPools().liquidityPoolId(poolIdStr).call();
      const [ra, rb] = poolRec.reserves;
      const reserveA = parseFloat(ra.amount);
      const reserveB = parseFloat(rb.amount);
      const total = parseFloat(poolRec.total_shares);
      const shareAmt = userShares[poolIdStr] || 0;
      const ratio = shareAmt / total;
      const pA = (reserveA * ratio).toFixed(7);
      const pB = (reserveB * ratio).toFixed(7);

      const acct = await server.loadAccount(walletId);
      const txb = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      const poolIdBuf = new Uint8Array(Buffer.from(poolIdStr, "hex"));

      // 1️⃣ withdraw all shares
      txb.addOperation(
        Operation.liquidityPoolWithdraw({
          liquidityPoolId: poolIdBuf,
          amount: shareAmt.toString(),
          minAmountA: "0",
          minAmountB: "0",
        })
      );
      // 2️⃣ redeposit principal
      txb.addOperation(
        Operation.liquidityPoolDeposit({
          liquidityPoolId: poolIdBuf,
          maxAmountA: pA,
          maxAmountB: pB,
          minPrice: FULL_MIN,
          maxPrice: FULL_MAX,
        })
      );

      const tx = txb.setTimeout(100).build();
      await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
      const resp = await server.submitTransaction(tx);

      setTxStatus("success");
      setTxMessage("Fees claimed successfully!");
      setTxHash(resp.hash);
      fetchUserShares();
    } catch (e) {
      setTxStatus("error");
      setTxMessage(e.message);
    } finally {
      setClaimOpen(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0A1B1F", color: "#fff", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h4">All Liquidity Pools</Typography>
          <Button variant="outlined" onClick={fetchPools} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Refresh"}
          </Button>
        </Box>

        {error && <Typography color="error">{error}</Typography>}

        {loading ? (
          <Box textAlign="center" mt={6}>
            <CircularProgress size={48} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ bgcolor: "#14232E", borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#0E2429" }}>
                  {[
                    "#",
                    "Pool ID",
                    "Tokens",
                    "Reserves",
                    "Total LP",
                    "Your Pool Shares",
                    "%",
                    "Actions",
                  ].map((h, i) => (
                    <TableCell
                      key={h}
                      align={i === 0 || i === 7 ? "center" : "left"}
                      sx={{ color: "#fff", fontWeight: "bold", borderBottom: "none" }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allPools.map((p, idx) => {
                  const [r0, r1] = p.reserves || [];
                  const aA = codeOf(r0?.asset);
                  const aB = codeOf(r1?.asset);
                  const resA = parseFloat(r0?.amount || 0).toFixed(6);
                  const resB = parseFloat(r1?.amount || 0).toFixed(6);
                  const total = parseFloat(p.total_shares || 0).toFixed(6);
                  const yours = (userShares[p.id] || 0).toFixed(6);
                  const pct = total > 0 ? ((yours / total) * 100).toFixed(2) : "0.00";

                  return (
                    <TableRow
                      key={p.id}
                      sx={{
                        "&:nth-of-type(odd)": { bgcolor: "#0F1A20" },
                        "&:hover": { bgcolor: "#1A2A34" },
                      }}
                    >
                      <TableCell align="center" sx={{ color: "#ccc" }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ wordBreak: "break-all", color: "#fff" }}>
                        {p.id.slice(0, 6)}…{p.id.slice(-6)}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>{aA}/{aB}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        {resA} {aA} | {resB} {aB}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>{total}</TableCell>
                      <TableCell sx={{ color: "#fff" }}>{yours}</TableCell>
                      <TableCell align="center" sx={{ color: "#fff" }}>{pct}%</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" sx={{ color: "#4caf50" }} onClick={() => openModal(p, "deposit")}>
                          <IoAddCircleOutline />
                        </IconButton>
                        <IconButton size="small" sx={{ color: "#f44336" }} onClick={() => openModal(p, "withdraw")}>
                          <IoRemoveCircleOutline />
                        </IconButton>
                        <IconButton size="small" sx={{ color: "#FFC107" }} onClick={() => openClaim(p)}>
                          <IoCashOutline />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <LiquidityActionModal
          open={modalOpen}
          mode={actionMode}
          poolId={selectedPool?.id}
          available={(userShares[selectedPool?.id] || 0).toString()}
          onClose={() => setModalOpen(false)}
          onAction={handleLiquidityAction}
        />

        <ClaimFeesModal
          open={claimOpen}
          poolId={selectedPool?.id}
          onClose={() => setClaimOpen(false)}
          onConfirm={() => handleConfirmClaim(selectedPool?.id)}
        />

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
}
