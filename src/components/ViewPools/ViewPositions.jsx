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

const FULL_RANGE_MIN = "0";
const FULL_RANGE_MAX = "1000000000";
const FULL_MIN = { numerator: 0, denominator: 1 };
const FULL_MAX = { numerator: 1_000_000_000, denominator: 1 };
const codeOf = (asset) =>
  asset === "native" ? "DIAM" : (asset || "").split(":")[0];

// ---------------------------------------------------------------
export default function ViewPosition() {
  const walletId = localStorage.getItem("diamPublicKey");

  const [lpBalances, setLpBalances] = useState([]);
  const [poolMeta, setPoolMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // modal / tx dialogs
  const [modalOpen, setModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState(""); // deposit | withdraw
  const [selected, setSelected] = useState(null);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txMessage, setTxMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // ---------- fetchers ----------
  const fetchPools = useCallback(async () => {
    if (!walletId) return;
    setLoading(true);
    setError("");
    try {
      const acct = await server.loadAccount(walletId);
      setLpBalances(
        acct.balances.filter((b) => b.asset_type === "liquidity_pool_shares")
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  const fetchPoolMeta = useCallback(async () => {
    if (!walletId) return;
    try {
      const r = await fetch(
        `https://diamtestnet.diamcircle.io/liquidity_pools/?${walletId}=&limit=200`
      );
      const j = await r.json();
      const map = {};
      j._embedded?.records.forEach((rec) => {
        map[rec.id] = rec;
      });
      setPoolMeta(map);
    } catch (e) {
      console.error(e);
    }
  }, [walletId]);

  useEffect(() => {
    fetchPools();
    fetchPoolMeta();
  }, [fetchPools, fetchPoolMeta]);

  const openModal = (pool, mode) => {
    setSelected(pool);
    setActionMode(mode);
    setModalOpen(true);
  };

  // ---------- submit tx ----------
  async function handleLiquidityAction(poolId, amtA, amtB, minPrice, maxPrice) {
    console.log("minPrice", minPrice)
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
        // -------- withdraw: compute minAmountA/B with 0.5 % slippage --------
        const pool = await server
          .liquidityPools()
          .liquidityPoolId(poolId)
          .call();
        const [r0, r1] = pool.reserves;
        const reserveA = parseFloat(r0.amount);
        const reserveB = parseFloat(r1.amount);
        const total = parseFloat(pool.total_shares);
        const share = parseFloat(amtA) / total;
        const expA = reserveA * share;
        const expB = reserveB * share;
        const SLIP = 0.005;
        const minA = (expA * (1 - SLIP)).toFixed(7);
        const minB = (expB * (1 - SLIP)).toFixed(7);

        txb.addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: poolIdBuf,
            amount: amtA,
            minAmountA: minA,
            minAmountB: minB,
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
    } catch (e) {
      setTxStatus("error");
      setTxMessage(e.message || "Transaction failed");
    }
  }

  // ---------- UI ----------
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0A1B1F", color: "#fff", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h4">Your Liquidity Pools</Typography>
          <Button variant="outlined" onClick={fetchPools} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Refresh"}
          </Button>
        </Box>

        {error && <Typography color="error">{error}</Typography>}

        {loading ? (
          <Box textAlign="center" mt={6}>
            <CircularProgress size={48} />
          </Box>
        ) : lpBalances.length === 0 ? (
          <Typography mt={4}>No liquidity‑pool shares found.</Typography>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ bgcolor: "#14232E", borderRadius: 2, boxShadow: 3 }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#0E2429" }}>
                  {[
                    "#",
                    "Pool ID",
                    "Tokens",
                    "Reserves",
                    "Total LP",
                    "Balance",
                    "%",
                    "Actions",
                  ].map((h, i) => (
                    <TableCell
                      key={h}
                      align={i === 0 || i === 7 ? "center" : "left"}
                      sx={{
                        color: "#fff",
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
                  const aA = codeOf(r0?.asset);
                  const aB = codeOf(r1?.asset);
                  const resA = parseFloat(r0?.amount || 0).toFixed(6);
                  const resB = parseFloat(r1?.amount || 0).toFixed(6);
                  const total = parseFloat(meta.total_shares || 0).toFixed(6);
                  const yours = parseFloat(lp.balance).toFixed(6);
                  const pct =
                    total > 0 ? ((yours / total) * 100).toFixed(2) : "0.00";

                  return (
                    <TableRow
                      key={lp.liquidity_pool_id}
                      sx={{
                        "&:nth-of-type(odd)": { bgcolor: "#0F1A20" },
                        "&:hover": { bgcolor: "#1A2A34" },
                      }}
                    >
                      <TableCell align="center" sx={{ color: "#ccc" }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ wordBreak: "break-all" }}>
                        {lp.liquidity_pool_id.slice(0, 6)}…
                        {lp.liquidity_pool_id.slice(-6)}
                      </TableCell>
                      <TableCell>
                        {aA}/{aB}
                      </TableCell>
                      <TableCell>
                        {resA} {aA} | {resB} {aB}
                      </TableCell>
                      <TableCell>{total}</TableCell>
                      <TableCell>{yours}</TableCell>
                      <TableCell align="center">{pct}%</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          sx={{ color: "#4caf50" }}
                          onClick={() => openModal(lp, "deposit")}
                        >
                          <IoAddCircleOutline />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#f44336" }}
                          onClick={() => openModal(lp, "withdraw")}
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

        {/* modals */}
        <LiquidityActionModal
          open={modalOpen}
          mode={actionMode}
          poolId={selected?.liquidity_pool_id}
          available={selected?.balance}
          reserves={
            poolMeta[selected?.liquidity_pool_id]?.reserves
              ? {
                  r0: {
                    amount:
                      poolMeta[selected.liquidity_pool_id].reserves[0].amount,
                    code: codeOf(
                      poolMeta[selected.liquidity_pool_id].reserves[0].asset
                    ),
                  },
                  r1: {
                    amount:
                      poolMeta[selected.liquidity_pool_id].reserves[1].amount,
                    code: codeOf(
                      poolMeta[selected.liquidity_pool_id].reserves[1].asset
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
