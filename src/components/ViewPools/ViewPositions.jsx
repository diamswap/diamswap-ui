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
import { Aurora, TransactionBuilder, Operation, BASE_FEE } from "diamnet-sdk";
import { Buffer } from "buffer";
import LiquidityActionModal from "../LiquidityActionModal";
import TransactionModal from "../../comman/TransactionModal";
import { IoAddCircleOutline, IoRemoveCircleOutline } from "react-icons/io5";

if (!window.Buffer) window.Buffer = Buffer;
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

function extractTokenCode(assetStr) {
  if (!assetStr) return "";
  return assetStr === "native" ? "DIAM" : assetStr.split(":")[0];
}

export default function ViewPosition() {
  const walletId = localStorage.getItem("diamPublicKey");
  const [lpBalances, setLpBalances] = useState([]);
  const [poolMeta, setPoolMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState("");
  const [selectedPool, setSelectedPool] = useState(null);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txMessage, setTxMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const acct = await server.loadAccount(walletId);
      setLpBalances(
        acct.balances.filter((b) => b.asset_type === "liquidity_pool_shares")
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  const fetchPoolMetadata = useCallback(async () => {
    try {
      const res = await fetch(
        `https://diamtestnet.diamcircle.io/liquidity_pools/?${walletId}=&limit=200`
      );
      const json = await res.json();
      const map = {};
      json._embedded?.records.forEach((rec) => {
        map[rec.id] = rec;
      });
      setPoolMeta(map);
    } catch (err) {
      console.error(err);
    }
  }, [walletId]);

  useEffect(() => {
    if (walletId) {
      fetchPools();
      fetchPoolMetadata();
    }
  }, [walletId, fetchPools, fetchPoolMetadata]);

  function openLiquidityModal(pool, mode) {
    setSelectedPool(pool);
    setActionMode(mode);
    setModalOpen(true);
  }

  async function handleLiquidityAction(
    poolId,
    amtA,
    amtB,
    minPrice,
    maxPrice
  ) {
    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage(`${actionMode} in progress…`);
    setTxHash("");

    try {
      const poolIdBuf = new Uint8Array(Buffer.from(poolId, "hex"));
      const account = await server.loadAccount(walletId);
      const txb = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (actionMode === "deposit") {
        // ——— ADD LIQUIDITY ———
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
        // ——— REMOVE LIQUIDITY ———
        // fetch live reserves so we can compute expected amounts + slippage floor
        const pool = await server
          .liquidityPools()
          .liquidityPoolId(poolId)
          .call();
        const [r0, r1] = pool.reserves;
        const reserveA = parseFloat(r0.amount);
        const reserveB = parseFloat(r1.amount);
        const totalShares = parseFloat(pool.total_shares);
        const shareFraction = parseFloat(amtA) / totalShares;

        // expected pro‐rata withdraw
        const expectedA = shareFraction * reserveA;
        const expectedB = shareFraction * reserveB;

        // apply slippage tolerance (e.g. 0.5%)
        const SLIPPAGE_TOLERANCE = 0.005;
        const minAmountA = (expectedA * (1 - SLIPPAGE_TOLERANCE)).toFixed(
          7
        );
        const minAmountB = (expectedB * (1 - SLIPPAGE_TOLERANCE)).toFixed(
          7
        );

        txb.addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: poolIdBuf,
            amount: amtA,
            minAmountA,
            minAmountB,
          })
        );
      }

      const tx = txb.setTimeout(100).build();
      await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
      const resp = await server.submitTransaction(tx);

      setTxStatus("success");
      setTxMessage("Transaction successful!");
      setTxHash(resp.hash);
      fetchPools();
    } catch (err) {
      setTxStatus("error");
      setTxMessage(err.message || "Transaction failed");
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0A1B1F", color: "#FFF", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h4" gutterBottom>
            Your Liquidity Pools
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchPools}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            {loading ? <CircularProgress size={20} /> : "Refresh Pools"}
          </Button>
        </Box>

        {error && <Typography color="error">{error}</Typography>}

        {loading ? (
          <Box textAlign="center" mt={6}>
            <CircularProgress size={48} />
          </Box>
        ) : lpBalances.length === 0 ? (
          <Typography mt={4}>No liquidity pool shares found.</Typography>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: "#14232E",
              borderRadius: 2,
              boxShadow: 3,
              overflow: "hidden",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#0E2429" }}>
                  {[
                    "#",
                    "Pool ID",
                    "Tokens",
                    "Reserves",
                    "Total LP",
                    "Balance",
                    "%",
                    "Actions",
                  ].map((h, i) => (
                    <TableCell
                      key={i}
                      align={i === 0 || i === 6 ? "center" : "left"}
                      sx={{
                        color: "#FFF",
                        fontWeight: "bold",
                        borderBottom: "none",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lpBalances.map((lp, idx) => {
                  const meta = poolMeta[lp.liquidity_pool_id] || {};
                  const [r0, r1] = meta.reserves || [];
                  const aA = extractTokenCode(r0?.asset);
                  const aB = extractTokenCode(r1?.asset);
                  const resA = parseFloat(r0?.amount || 0).toFixed(6);
                  const resB = parseFloat(r1?.amount || 0).toFixed(6);
                  const total = parseFloat(meta.total_shares || 0).toFixed(6);
                  const yours = parseFloat(lp.balance).toFixed(6);
                  const pct =
                    total > 0 ? ((yours / total) * 100).toFixed(2) : "0.00";

                  return (
                    <TableRow
                      key={lp.liquidity_pool_shares}
                      sx={{
                        "&:nth-of-type(odd)": { bgcolor: "#0F1A20" },
                        "&:hover": { bgcolor: "#1A2A34" },
                      }}
                    >
                      <TableCell align="center" sx={{ color: "#CCC" }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell
                        sx={{ color: "#FFF", wordBreak: "break-all" }}
                      >
                        {lp.liquidity_pool_id.slice(0, 6)}…
                        {lp.liquidity_pool_id.slice(-6)}
                      </TableCell>
                      <TableCell sx={{ color: "#FFF" }}>
                        {aA} / {aB}
                      </TableCell>
                      <TableCell sx={{ color: "#FFF" }}>
                        {resA} {aA} | {resB} {aB}
                      </TableCell>
                      <TableCell sx={{ color: "#FFF" }}>{total}</TableCell>
                      <TableCell sx={{ color: "#FFF" }}>{yours}</TableCell>
                      <TableCell align="center" sx={{ color: "#FFF" }}>
                        {pct}%
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => openLiquidityModal(lp, "deposit")}
                          sx={{ color: "#4caf50" }}
                        >
                          <IoAddCircleOutline />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openLiquidityModal(lp, "withdraw")}
                          sx={{ color: "#f44336" }}
                        >
                          <IoRemoveCircleOutline />
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
          poolId={selectedPool?.liquidity_pool_id}
          available={selectedPool?.balance}
          reserves={
            poolMeta[selectedPool?.liquidity_pool_id]?.reserves
              ? {
                  r0: {
                    amount:
                      poolMeta[selectedPool.liquidity_pool_id].reserves[0]
                        .amount,
                    code: extractTokenCode(
                      poolMeta[selectedPool.liquidity_pool_id].reserves[0]
                        .asset
                    ),
                  },
                  r1: {
                    amount:
                      poolMeta[selectedPool.liquidity_pool_id].reserves[1]
                        .amount,
                    code: extractTokenCode(
                      poolMeta[selectedPool.liquidity_pool_id].reserves[1]
                        .asset
                    ),
                  },
                }
              : undefined
          }
          onClose={() => setModalOpen(false)}
          onAction={handleLiquidityAction}
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
