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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Stack,
  Fade,
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
const codeOf = (asset) => (asset === "native" ? "DIAM" : asset.split(":")[0]);
const FULL_MIN = { n: 1, d: 10000000 };
const FULL_MAX = { n: 1000000000, d: 1 };

export default function ViewPosition() {
  const walletId = localStorage.getItem("diamPublicKey");

  // All pools & user shares
  const [allPools, setAllPools] = useState([]);
  const [userShares, setUserShares] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState(""); // "deposit" | "withdraw"
  const [selectedPool, setSelectedPool] = useState(null);

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimableFees, setClaimableFees] = useState(null);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txMessage, setTxMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // 1) Fetch ALL pools
  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        "https://diamtestnet.diamcircle.io/liquidity_pools?limit=200"
      );
      const json = await res.json();
      setAllPools(json._embedded?.records || []);
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

  // Compute claimable fees
  const computeFees = useCallback(
    (pool) => {
      if (!pool || !userShares[pool.id]) {
        setClaimableFees(null);
        return;
      }
      const shareAmt = userShares[pool.id];
      const { reserves, total_shares: totalSharesStr } = pool;
      const totalShares = parseFloat(totalSharesStr);
      if (!totalShares || !shareAmt) {
        setClaimableFees({
          feeA: "0.0000000",
          feeB: "0.0000000",
          codeA: codeOf(reserves[0].asset),
          codeB: codeOf(reserves[1].asset),
        });
        return;
      }
      const [r0, r1] = reserves;
      const a0 = parseFloat(r0.amount),
        a1 = parseFloat(r1.amount);
      const princ0 = (a0 * shareAmt) / totalShares;
      const princ1 = (a1 * shareAmt) / totalShares;
      const fee0 = (a0 - princ0).toFixed(7),
        fee1 = (a1 - princ1).toFixed(7);
      setClaimableFees({
        feeA: fee0,
        feeB: fee1,
        codeA: codeOf(r0.asset),
        codeB: codeOf(r1.asset),
      });
    },
    [userShares]
  );

  // Open deposit/withdraw modal
  const openActionModal = (pool, mode) => {
    setSelectedPool(pool);
    setActionMode(mode);
    setActionModalOpen(true);
  };

  // Open claim-fees modal
  const openClaimModal = (pool) => {
    setSelectedPool(pool);
    computeFees(pool);
    setClaimModalOpen(true);
  };

  // Handle deposit/withdraw
  const handleLiquidityAction = async (poolId, amtA, amtB, minP, maxP) => {
    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage(
      `${actionMode.charAt(0).toUpperCase() + actionMode.slice(1)} in progress…`
    );
    setTxHash("");

    try {
      const acct = await server.loadAccount(walletId);
      const txb = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      // Ensure trustline for LP shares
      const lpPool = allPools.find((p) => p.id === poolId);
      const [r0, r1] = lpPool.reserves;
      const assetA =
        r0.asset === "native"
          ? Asset.native()
          : new Asset(...r0.asset.split(":"));
      const assetB =
        r1.asset === "native"
          ? Asset.native()
          : new Asset(...r1.asset.split(":"));
      const lpAsset = new LiquidityPoolAsset(assetA, assetB, lpPool.fee_bp);

      txb.addOperation(Operation.changeTrust({ asset: lpAsset }));

      const poolIdBuf = new Uint8Array(Buffer.from(poolId, "hex"));
      if (actionMode === "deposit") {
        txb.addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: poolIdBuf,
            maxAmountA: amtA,
            maxAmountB: amtB,
            minPrice: minP,
            maxPrice: maxP,
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
      setActionModalOpen(false);
    }
  };

  // Handle claim fees (withdraw + redeposit principal)
  const handleConfirmClaim = async (poolId) => {
    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage("Claim in progress…");
    setTxHash("");

    try {
      const poolRec = await server
        .liquidityPools()
        .liquidityPoolId(poolId)
        .call();
      const [ra, rb] = poolRec.reserves;
      const reserveA = parseFloat(ra.amount);
      const reserveB = parseFloat(rb.amount);
      const total = parseFloat(poolRec.total_shares);
      const shareAmt = userShares[poolId] || 0;
      const ratio = shareAmt / total;
      const pA = (reserveA * ratio).toFixed(7);
      const pB = (reserveB * ratio).toFixed(7);

      const acct = await server.loadAccount(walletId);
      const txb = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      const poolIdBuf = new Uint8Array(Buffer.from(poolId, "hex"));

      txb.addOperation(
        Operation.liquidityPoolWithdraw({
          liquidityPoolId: poolIdBuf,
          amount: shareAmt.toString(),
          minAmountA: "0",
          minAmountB: "0",
        })
      );
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
      computeFees(selectedPool);
    } catch (e) {
      setTxStatus("error");
      setTxMessage(e.message);
    } finally {
      setClaimModalOpen(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0A1B1F", color: "#fff", py: 4 }}>
      <Container maxWidth="lg">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">All Liquidity Pools</Typography>
          <Button variant="outlined" onClick={fetchPools} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Refresh"}
          </Button>
        </Stack>

        {error && <Typography color="error">{error}</Typography>}

        {loading ? (
          <Box textAlign="center" mt={6}>
            <CircularProgress size={48} />
          </Box>
        ) : (
          <Fade in>
            <TableContainer
              component={Paper}
              sx={{ bgcolor: "#14232E", borderRadius: 2 }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#0E2429" }}>
                    {[
                      "#",
                      "Pool ID",
                      "Tokens",
                      "Reserves",
                      "Total LP",
                      "Your Shares",
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
                  {allPools.map((p, idx) => {
                    const [r0, r1] = p.reserves || [];
                    const aA = codeOf(r0?.asset);
                    const aB = codeOf(r1?.asset);
                    const resA = parseFloat(r0?.amount || 0).toFixed(6);
                    const resB = parseFloat(r1?.amount || 0).toFixed(6);
                    const total = parseFloat(p.total_shares || 0).toFixed(6);
                    const yours = (userShares[p.id] || 0).toFixed(6);
                    const pct =
                      total > 0 ? ((yours / total) * 100).toFixed(2) : "0.00";

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
                        <TableCell
                          sx={{ wordBreak: "break-all", color: "#fff" }}
                        >
                          {p.id.slice(0, 6)}…{p.id.slice(-6)}
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          {aA}/{aB}
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          {resA} {aA} | {resB} {aB}
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>{total}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{yours}</TableCell>
                        <TableCell align="center" sx={{ color: "#fff" }}>
                          {pct}%
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Deposit">
                            <IconButton
                              size="small"
                              sx={{ color: "#4caf50" }}
                              onClick={() => openActionModal(p, "deposit")}
                            >
                              <IoAddCircleOutline />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Withdraw">
                            <IconButton
                              size="small"
                              sx={{ color: "#f44336" }}
                              onClick={() => openActionModal(p, "withdraw")}
                            >
                              <IoRemoveCircleOutline />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Claim Fees">
                            <IconButton
                              size="small"
                              sx={{ color: "#FFC107" }}
                              onClick={() => openClaimModal(p)}
                            >
                              <IoCashOutline />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Fade>
        )}

        {/* Deposit / Withdraw Modal */}
        <LiquidityActionModal
          open={actionModalOpen}
          mode={actionMode}
          poolId={selectedPool?.id}
          available={(userShares[selectedPool?.id] || 0).toString()}
          onClose={() => setActionModalOpen(false)}
          onAction={handleLiquidityAction}
        />

        {/* Claim Fees Modal */}
        <ClaimFeesModal
          open={claimModalOpen}
          poolId={selectedPool?.id}
          claimableFees={claimableFees}
          onConfirm={() => handleConfirmClaim(selectedPool?.id)}
          onClose={() => setClaimModalOpen(false)}
        />

        {/* Transaction Status Modal */}
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
