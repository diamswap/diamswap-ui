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
const codeOf = (asset) =>
  asset === "native" ? "DIAM" : (asset || "").split(":")[0];
// Price range placeholders
const FULL_MIN = { n: 1, d: 10000000 };
const FULL_MAX = { n: 1000000000, d: 1 };

export default function ViewPosition() {
  const walletId = localStorage.getItem("diamPublicKey");
  const [claimableFees, setClaimableFees] = useState(null);
  // State
  const [lpBalances, setLpBalances] = useState([]);
  const [poolMeta, setPoolMeta] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState(""); // "deposit" | "withdraw"
  const [selected, setSelected] = useState(null);

  const [claimOpen, setClaimOpen] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txMessage, setTxMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // Fetch LP balances
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

  // Fetch pool metadata
  // Fetch pool metadata
  const fetchPoolMeta = useCallback(async () => {
    if (!walletId) return;
    try {
      // ✅ Use account_id to filter by your wallet
      const res = await fetch(
        `https://diamtestnet.diamcircle.io/liquidity_pools?account_id=${walletId}&limit=200`
      );
      const j = await res.json();
      const map = {};
      j._embedded?.records.forEach((rec) => {
        map[rec.id] = rec;
      });
      setPoolMeta(map);
    } catch (e) {
      console.error("Failed to load pool metadata", e);
    }
  }, [walletId]);


  useEffect(() => {
    fetchPools();
    fetchPoolMeta();
  }, [fetchPools, fetchPoolMeta]);

  // Open deposit/withdraw modal
  const openModal = (pool, mode) => {
    setSelected(pool);
    setActionMode(mode);
    setModalOpen(true);
  };



  const ASSET_DECIMALS = {
    native: 7,    // DIAM has 7 decimal places
  };
  
  function getDecimals(asset) {
    if (asset === "native") return ASSET_DECIMALS.native;
    const symbol = asset.split(":")[0];
    return ASSET_DECIMALS[symbol] ?? ASSET_DECIMALS.native;
  }
  
  // 2️⃣ Compute “claimable fees” from on-chain reserves + user LP balance
  const fetchClaimableFees = useCallback(
    (pool) => {
      // reset if no data
      if (!walletId || !pool || !poolMeta) {
        setClaimableFees(null);
        return;
      }
  
      const { liquidity_pool_id: poolId, balance: userBal } = pool;
      const meta = poolMeta[poolId];
      if (!meta || !Array.isArray(meta.reserves) || meta.reserves.length < 2) {
        setClaimableFees(null);
        return;
      }
  
      const [r0meta, r1meta] = meta.reserves;
      const r0 = Number(r0meta.amount);
      const r1 = Number(r1meta.amount);
      const totalShares = Number(meta.total_shares);
      const userShares  = Number(userBal);
  
      // derive decimals and codes
      const dec0 = getDecimals(r0meta.asset);
      const dec1 = getDecimals(r1meta.asset);
      const codeA = codeOf(r0meta.asset);
      const codeB = codeOf(r1meta.asset);
  
      // no shares or no deposits => zero fees
      if (!totalShares || !userShares) {
        setClaimableFees({
          feeA: "0".padEnd(dec0 + 1, "0"),
          feeB: "0".padEnd(dec1 + 1, "0"),
          codeA,
          codeB,
        });
        return;
      }
  
      // principal = your pro-rata share of reserves
      const principalA = (r0 * userShares) / totalShares;
      const principalB = (r1 * userShares) / totalShares;
      // fees = leftover
      const feeA = r0 - principalA;
      const feeB = r1 - principalB;
  
      setClaimableFees({
        feeA: feeA.toFixed(dec0),
        feeB: feeB.toFixed(dec1),
        codeA,
        codeB,
      });
    },
    [walletId, poolMeta]
  );
  
  // 3️⃣ When user clicks “claim”, compute fees and open the modal
  const openClaim = (pool) => {
    if (!pool) return;
    setSelected(pool);
    fetchClaimableFees(pool);
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
    if (!poolId) {
      setError("No pool selected");
      return;
    }

    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage(
      `${actionMode.charAt(0).toUpperCase() + actionMode.slice(1)} in progress…`
    );
    setTxHash("");

    try {
      const poolIdBuf = new Uint8Array(Buffer.from(poolId, "hex"));
      const account = await server.loadAccount(walletId);
      const txb = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (actionMode === "deposit") {
        // Add liquidity
        txb.addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: poolIdBuf,
            maxAmountA: amtA,
            maxAmountB: amtB,
            minPrice,
            maxPrice,
          })
        );
      } else if (actionMode === "withdraw") {
        // Remove liquidity: burn amtA shares
        const poolRec = await server
          .liquidityPools()
          .liquidityPoolId(poolId)
          .call();
        const [r0, r1] = poolRec.reserves;
        const reserveA = parseFloat(r0.amount);
        const reserveB = parseFloat(r1.amount);
        const totalShares = parseFloat(poolRec.total_shares);
        const shareAmt = parseFloat(amtA);
        const shareRatio = shareAmt / totalShares;
        // Expected principal amounts
        const expA = reserveA * shareRatio;
        const expB = reserveB * shareRatio;
        // 0.5% slippage tolerance
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
      // parse result_codes if available
      const code = e.extras?.result_codes?.operations?.[0];
      let msg = e.message;
      if (code === "op_underfunded") msg = "Insufficient balance";
      setTxMessage(msg || "Transaction failed");
    } finally {
      setModalOpen(false);
    }
  };

  // Handle claim fees by withdraw+redeposit principal
  const handleConfirmClaim = async (poolIdStr) => {
    if (!poolIdStr || !selected) {
      setTxModalOpen(true);
      setTxStatus("error");
      setTxMessage("Invalid pool selection");
      return;
    }

    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage("Claim in progress…");
    setTxHash("");

    try {
      const poolRec = await server
        .liquidityPools()
        .liquidityPoolId(poolIdStr)
        .call();
      const [r0, r1] = poolRec.reserves;
      const reserveA = parseFloat(r0.amount);
      const reserveB = parseFloat(r1.amount);
      const totalShares = parseFloat(poolRec.total_shares);
      const shareAmt = parseFloat(selected.balance);
      const shareRatio = shareAmt / totalShares;
      const principalA = (reserveA * shareRatio).toFixed(7);
      const principalB = (reserveB * shareRatio).toFixed(7);

      const account = await server.loadAccount(walletId);
      const txb = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const poolIdBuf = new Uint8Array(Buffer.from(poolIdStr, "hex"));
      // 1) withdraw full share (principal + fees)
      txb.addOperation(
        Operation.liquidityPoolWithdraw({
          liquidityPoolId: poolIdBuf,
          amount: selected.balance,
          minAmountA: "0",
          minAmountB: "0",
        })
      );
      // 2) redeposit principal only
      txb.addOperation(
        Operation.liquidityPoolDeposit({
          liquidityPoolId: poolIdBuf,
          maxAmountA: principalA,
          maxAmountB: principalB,
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
      fetchPools();
     await fetchPoolMeta();
     fetchClaimableFees(selected);
    } catch (e) {
      setTxStatus("error");
      setTxMessage(e.message || "Claim failed");
    } finally {
      setClaimOpen(false);
    }
  };

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
          <Typography mt={4}>No liquidity-pool shares found.</Typography>
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
                    "Total LP",
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
                        {resA} {aA} | {resB} {aB}
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
                          {" "}
                          <IoAddCircleOutline />{" "}
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#f44336" }}
                          onClick={() => openModal(lp, "withdraw")}
                        >
                          <IoRemoveCircleOutline />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: "#FFC107" }}
                          onClick={() => openClaim(lp)}
                        >
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

        <ClaimFeesModal
          open={claimOpen}
          poolId={selected?.liquidity_pool_id}
          onConfirm={handleConfirmClaim}
                    claimableFees={claimableFees}    // ← pass it here
          onClose={() => {
            setClaimOpen(false);
            setClaimableFees(null);         // clear when closing
          }}

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
