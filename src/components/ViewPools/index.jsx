// src/components/ViewPools/index.jsx
import React, { useState, useEffect } from "react";
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
  TablePagination,
  TextField,
  Tooltip,
} from "@mui/material";
import { Aurora, TransactionBuilder, Operation, BASE_FEE } from "diamnet-sdk";
import { Buffer } from "buffer";
import LiquidityActionModal from "../LiquidityActionModal";
import TransactionModal from "../../comman/TransactionModal";

if (!window.Buffer) window.Buffer = Buffer;

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

function extractTokenCode(assetStr) {
  if (!assetStr) return "";
  return assetStr === "native" ? "DIAM" : assetStr.split(":")[0];
}

export default function ViewPools() {
  const walletId = localStorage.getItem("diamPublicKey");

  // --- data states ---
  const [allPools, setAllPools] = useState([]);      // all pools fetched
  const [userShares, setUserShares] = useState({});  // your LP shares map
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- pagination & filter ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterText, setFilterText] = useState("");

  // --- modal states ---
  const [modalOpen, setModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState("");
  const [selectedPool, setSelectedPool] = useState(null);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txMessage, setTxMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // 1) fetch all pools
  useEffect(() => {
    setLoading(true);
    fetch("https://diamtestnet.diamcircle.io/liquidity_pools?limit=200")
      .then((r) => r.json())
      .then((json) => {
        setAllPools(json._embedded?.records || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 2) fetch your wallet's LP balances once
  useEffect(() => {
    if (!walletId) return;
    server
      .loadAccount(walletId)
      .then((acct) => {
        const map = {};
        acct.balances
          .filter((b) => b.asset_type === "liquidity_pool_shares")
          .forEach((b) => {
            map[b.liquidity_pool_id] = parseFloat(b.balance);
          });
        setUserShares(map);
      })
      .catch((e) => console.error(e));
  }, [walletId]);

  // open action modal
  function openLiquidityModal(pool, mode) {
    setSelectedPool(pool);
    setActionMode(mode);
    setModalOpen(true);
  }

  // perform deposit/withdraw
  async function handleLiquidityAction(pool, amtA, amtB) {
    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage(`${actionMode} in progress...`);
    setTxHash("");
    try {
      const poolIdBuf = new Uint8Array(Buffer.from(pool.id, "hex"));
      const acct = await server.loadAccount(walletId);
      const txb = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      if (actionMode === "deposit") {
        txb.addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: poolIdBuf,
            maxAmountA: amtA,
            maxAmountB: amtB,
            minPrice: { n: 1, d: 2 },
            maxPrice: { n: 2, d: 1 },
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
      // refresh your LP share balance for this pool
      const refreshed = await server.loadAccount(walletId);
      const map2 = {};
      refreshed.balances
        .filter((b) => b.asset_type === "liquidity_pool_shares")
        .forEach((b) => {
          map2[b.liquidity_pool_id] = parseFloat(b.balance);
        });
      setUserShares(map2);
    } catch (e) {
      setTxStatus("error");
      setTxMessage(e.message || "Transaction failed");
    }
  }

  // filter + paginate
  const filtered = allPools.filter((p) => {
    const [r0, r1] = p.reserves;
    const pair = `${extractTokenCode(r0.asset)}/${extractTokenCode(r1.asset)}`;
    return pair.toLowerCase().includes(filterText.toLowerCase());
  });
  const paged = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0A1B1F", color: "#FFF", py: 4 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h4">Liquidity Pools</Typography>
          <TextField
            placeholder="Filter pairs…"
            size="small"
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setPage(0);
            }}
            sx={{
              backgroundColor: "#14232E",
              input: { color: "#FFF" },
              width: 200,
            }}
          />
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Reload All"}
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Box textAlign="center" mt={6}>
            <CircularProgress size={48} />
          </Box>
        ) : (
          <Paper sx={{ overflow: "hidden", borderRadius: 2 }}>
            <TableContainer sx={{ maxHeight: 600, bgcolor: "#14232E" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#0E2429" }}>
                    {[
                      "#",
                      "Pool ID",
                      "Tokens",
                      "Reserves",
                      "Total LP",
                      "Participants",
                      "Your Bal.",
                      "Your %",
                    ].map((h, i) => (
                      <TableCell
                        key={i}
                        align={i === 0 || i === 7 ? "center" : "left"}
                        sx={{
                          color: "#FFF",
                          fontWeight: "bold",
                          borderBottom: "none",
                          py: 1.5,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((p, idx) => {
                    const [r0, r1] = p.reserves;
                    const aA = extractTokenCode(r0.asset);
                    const aB = extractTokenCode(r1.asset);
                    const resA = parseFloat(r0.amount).toFixed(4);
                    const resB = parseFloat(r1.amount).toFixed(4);
                    const total = parseFloat(p.total_shares).toFixed(4);
                    const yours = (userShares[p.id] || 0).toFixed(4);
                    const pct =
                      p.total_shares > 0
                        ? ((yours / parseFloat(p.total_shares)) * 100).toFixed(
                            2
                          )
                        : "0.00";

                    return (
                      <TableRow
                        key={p.id}
                        sx={{
                          "&:nth-of-type(odd)": { bgcolor: "#0F1A20" },
                          "&:hover": { bgcolor: "#1A2A34" },
                        }}
                      >
                        <TableCell align="center" sx={{ color: "#CCC" }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell
                          sx={{ color: "#FFF", wordBreak: "break-all" }}
                        >
                          <Tooltip title={p.id}>
                            <span>
                              {p.id.slice(0, 3)}…{p.id.slice(-3)}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ color: "#FFF" }}>
                          {aA} / {aB}
                        </TableCell>
                        <TableCell sx={{ color: "#FFF", whiteSpace: "nowrap" }}>
                          {`${resA} ${aA} | ${resB} ${aB}`}
                        </TableCell>
                        <TableCell sx={{ color: "#FFF" }}>{total}</TableCell>
                        <TableCell sx={{ color: "#FFF" }}>
                          {p.total_trustlines}
                        </TableCell>
                        <TableCell sx={{ color: "#FFF" }}>{yours}</TableCell>
                        <TableCell align="center" sx={{ color: "#FFF" }}>
                          {pct}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                bgcolor: "#0E2429",
                ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows":
                  { color: "#FFF" },
              }}
            />
          </Paper>
        )}

        <LiquidityActionModal
          open={modalOpen}
          mode={actionMode}
          poolId={selectedPool?.id || ""}
          available={userShares[selectedPool?.id] || 0}
          onClose={() => setModalOpen(false)}
          onAction={(amtA, amtB) => handleLiquidityAction(selectedPool, amtA, amtB)}
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
