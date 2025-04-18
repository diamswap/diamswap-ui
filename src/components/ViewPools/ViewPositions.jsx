// // src/components/LiquidityPage.jsx
// import React, { useState, useEffect } from "react";
// import {
//   Container,
//   Box,
//   Typography,
//   CircularProgress,
//   Button,
//   Paper,
//   Table,
//   TableHead,
//   TableRow,
//   TableCell,
//   TableBody,
// } from "@mui/material";
// import { Aurora, TransactionBuilder, Operation, BASE_FEE } from "diamnet-sdk";
// import { Buffer } from "buffer";
// import LiquidityActionModal from "../LiquidityActionModal";
// import TransactionModal from "../../comman/TransactionModal";

// if (!window.Buffer) {
//   window.Buffer = Buffer;
// }

// const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
// const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// const WalletPoolsPage = () => {
//   const walletId = localStorage.getItem("diamPublicKey");
//   const [lpBalances, setLpBalances] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // LiquidityActionModal state
//   const [modalOpen, setModalOpen] = useState(false);
//   const [actionMode, setActionMode] = useState(""); // "deposit" or "withdraw"
//   const [selectedPool, setSelectedPool] = useState(null); // now store full pool object

//   // TransactionModal state
//   const [txModalOpen, setTxModalOpen] = useState(false);
//   const [txStatus, setTxStatus] = useState(""); // "pending", "success", "error"
//   const [txMessage, setTxMessage] = useState("");
//   const [txHash, setTxHash] = useState("");

//   // Fetch liquidity pool shares from Diamnet
//   const fetchPools = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const account = await server.loadAccount(walletId);
//       const pools = account.balances.filter(
//         (bal) => bal.asset_type === "liquidity_pool_shares"
//       );
//       setLpBalances(pools);
//     } catch (err) {
//       setError("Error loading account: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (walletId) {
//       fetchPools();
//     }
//   }, [walletId]);

//   // Open LiquidityActionModal for a given pool & mode.
//   // Now we pass the pool object.
//   const openLiquidityModal = (pool, mode) => {
//     setSelectedPool(pool);
//     setActionMode(mode);
//     setModalOpen(true);
//   };

//   // Called from LiquidityActionModal when user confirms deposit/withdraw.
//   // After a successful liquidity action, we also re-fetch the pool balances.
//   const handleLiquidityAction = async (poolId, amt1, amt2) => {
//     setTxModalOpen(true);
//     setTxStatus("pending");
//     setTxMessage(`${actionMode} in progress...`);
//     setTxHash("");

//     try {
//       const liquidityPoolIdBuffer = new Uint8Array(Buffer.from(poolId, "hex"));
//       if (!walletId) throw new Error("No DIAM wallet connected.");
//       const account = await server.loadAccount(walletId);
//       let tx;
//       if (actionMode === "deposit") {
//         tx = new TransactionBuilder(account, {
//           fee: BASE_FEE,
//           networkPassphrase: NETWORK_PASSPHRASE,
//         })
//           .addOperation(
//             Operation.liquidityPoolDeposit({
//               liquidityPoolId: liquidityPoolIdBuffer,
//               maxAmountA: amt1, // Deposit TradeToken amount
//               maxAmountB: amt2, // Deposit DIAM amount
//               minPrice: { n: 1, d: 2 },
//               maxPrice: { n: 2, d: 1 },
//             })
//           )
//           .setTimeout(100)
//           .build();
//       } else if (actionMode === "withdraw") {
//         tx = new TransactionBuilder(account, {
//           fee: BASE_FEE,
//           networkPassphrase: NETWORK_PASSPHRASE,
//         })
//           .addOperation(
//             Operation.liquidityPoolWithdraw({
//               liquidityPoolId: liquidityPoolIdBuffer,
//               amount: amt1,       // pool shares to burn
//               minAmountA: amt2,   // min TradeToken to receive
//               minAmountB: "0.0000001",
//             })
//           )
//           .setTimeout(100)
//           .build();
//       } else {
//         throw new Error("Unknown liquidity action mode");
//       }

//       if (!window.diam || typeof window.diam.sign !== "function") {
//         throw new Error("DIAM Wallet extension not available for signing.");
//       }
//       const signResult = await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
//       const response = await server.submitTransaction(tx);

//       setTxStatus("success");
//       setTxMessage("Transaction successful!");
//       setTxHash(response.hash);
//       console.log(`${actionMode} transaction submitted. Hash:`, response.hash);

//       // Refresh the pool balances
//       fetchPools();
//     } catch (error) {
//       setTxStatus("error");
//       setTxMessage(error.message || "Transaction Error");
//       setTxHash("");
//       console.error("Liquidity action error:", error);
//     }
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: "100vh",
//         backgroundColor: "#0A1B1F",
//         color: "#fff",
//         py: 4,
//       }}
//     >
//       <Container maxWidth="lg">
//         {/* Hero Section */}
//         <Box
//           sx={{
//             background: "linear-gradient(135deg, #0E2429 0%, #0A1B1F 100%)",
//             borderRadius: "24px",
//             p: { xs: 3, sm: 5 },
//             mb: 4,
//             boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
//           }}
//         >
//           <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
//             Liquidity Pools Overview
//           </Typography>
//           <Typography variant="body1" sx={{ opacity: 0.9 }}>
//             Explore the liquidity pool shares held in this wallet.
//           </Typography>
//           <Typography
//             variant="body2"
//             sx={{ mt: 2, wordBreak: "break-all", opacity: 0.7 }}
//           >
//             Wallet ID: {walletId}
//           </Typography>
//         </Box>

//         {/* Refresh + Title Row */}
//         <Box
//           sx={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             mb: 3,
//           }}
//         >
//           <Typography variant="h5" sx={{ fontWeight: "bold" }}>
//             Your Liquidity Pools
//           </Typography>
//           <Button
//             variant="contained"
//             onClick={fetchPools}
//             disabled={loading}
//             sx={{
//               backgroundColor: "#00CEE5",
//               color: "#0A1B1F",
//               "&:hover": { backgroundColor: "#00AEC5" },
//             }}
//           >
//             {loading ? <CircularProgress size={24} color="inherit" /> : "Refresh"}
//           </Button>
//         </Box>

//         {error && (
//           <Typography variant="body1" color="error" sx={{ mb: 2 }}>
//             {error}
//           </Typography>
//         )}

//         {/* Pools Table */}
//         {loading ? (
//           <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
//             <CircularProgress />
//           </Box>
//         ) : lpBalances.length === 0 ? (
//           <Typography variant="body1" sx={{ mt: 2 }}>
//             No liquidity pool shares found for this wallet.
//           </Typography>
//         ) : (
//           <Paper
//             sx={{
//               backgroundColor: "#1B2730",
//               borderRadius: "16px",
//               p: 2,
//               overflow: "auto",
//             }}
//           >
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell sx={{ color: "#fff" }}>Pool ID</TableCell>
//                   <TableCell sx={{ color: "#fff" }}>Balance</TableCell>
//                   <TableCell sx={{ color: "#fff", textAlign: "center" }}>
//                     Actions
//                   </TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {lpBalances.map((lp, index) => (
//                   <TableRow key={index}>
//                     <TableCell sx={{ color: "#fff", wordBreak: "break-all" }}>
//                       {lp.liquidity_pool_id}
//                     </TableCell>
//                     <TableCell sx={{ color: "#fff" }}>
//                       {lp.balance}
//                     </TableCell>
//                     <TableCell sx={{ color: "#fff", textAlign: "center" }}>
//                       <Button
//                         variant="outlined"
//                         sx={{
//                           mr: 1,
//                           borderColor: "#00CEE5",
//                           color: "#00CEE5",
//                           "&:hover": {
//                             borderColor: "#00AEC5",
//                             backgroundColor: "#00AEC51a",
//                           },
//                         }}
//                         onClick={() => openLiquidityModal(lp, "deposit")}
//                       >
//                         Deposit
//                       </Button>
//                       <Button
//                         variant="outlined"
//                         sx={{
//                           borderColor: "#00CEE5",
//                           color: "#00CEE5",
//                           "&:hover": {
//                             borderColor: "#00AEC5",
//                             backgroundColor: "#00AEC51a",
//                           },
//                         }}
//                         onClick={() => openLiquidityModal(lp, "withdraw")}
//                       >
//                         Withdraw
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </Paper>
//         )}

//         {/* Liquidity Action Modal */}
//         <LiquidityActionModal
//           open={modalOpen}
//           mode={actionMode}
//           poolId={selectedPool ? selectedPool.liquidity_pool_id : ""}
//           available={selectedPool ? selectedPool.balance : ""}
//           onClose={() => setModalOpen(false)}
//           onAction={handleLiquidityAction}
//         />

//         {/* Transaction Modal */}
//         <TransactionModal
//           open={txModalOpen}
//           onClose={() => setTxModalOpen(false)}
//           status={txStatus}
//           message={txMessage}
//           transactionHash={txHash}
//         />
//       </Container>
//     </Box>
//   );
// };

// export default WalletPoolsPage;








































// src/components/ViewPools/index.jsx
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

  async function handleLiquidityAction(poolId, amtA, amtB) {
    setTxModalOpen(true);
    setTxStatus("pending");
    setTxMessage(`${actionMode} in progress...`);
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
      fetchPools();
    } catch (err) {
      setTxStatus("error");
      setTxMessage(err.message || "Transaction failed");
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0A1B1F", color: "#FFF", py: 4 }}>
      <Container maxWidth="lg">
        {/* Updated Title */}
      <Box sx={{display:"flex", justifyContent:"space-between"}}>
      <Typography variant="h4" gutterBottom>
        Yours Liquidity Pools
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
                  {["#", "Pool ID", "Tokens", "Reserves Tokens with Prices", "Total LP", "Balance", "Balance %", ].map(
                    (h, i) => (
                      <TableCell
                        key={i}
                        align={i === 0 || i === 7 ? "center" : "left"}
                        sx={{
                          color: "#FFF",
                          fontWeight: "bold",
                          borderBottom: "none",
                        }}
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {lpBalances.map((lp, idx) => {
                  const meta = poolMeta[lp.liquidity_pool_id] || {};
                  const [r0, r1] = meta.reserves || [];
                  const aA = extractTokenCode(r0?.asset);
                  const aB = extractTokenCode(r1?.asset);
                  const resA = parseFloat(r0?.amount || 0).toFixed(4);
                  const resB = parseFloat(r1?.amount || 0).toFixed(4);
                  const total = parseFloat(meta.total_shares || 0).toFixed(4);
                  const yours = parseFloat(lp.balance).toFixed(4);
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
                      <TableCell sx={{ color: "#FFF", wordBreak: "break-all" }}>
                        {lp.liquidity_pool_id.slice(0, 3)}…
                        {lp.liquidity_pool_id.slice(-3)}
                      </TableCell>
                      <TableCell sx={{ color: "#FFF" }}>
                        {aA} / {aB}
                      </TableCell>
                      <TableCell sx={{ color: "#FFF" }}>
                        {resA} {aA} <Box component="span" mx={1}>|</Box> {resB} {aB}
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
                          <IoAddCircleOutline size={24} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openLiquidityModal(lp, "withdraw")}
                          sx={{ color: "#f44336" }}
                        >
                          <IoRemoveCircleOutline size={24} />
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
          poolId={selectedPool?.liquidity_pool_id || ""}
          available={selectedPool?.balance || ""}
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
