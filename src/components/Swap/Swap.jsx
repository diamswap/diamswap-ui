// src/components/SwapPage.jsx
import React, { useState, useEffect } from "react";
import {
  Asset,
  Aurora,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  LiquidityPoolAsset,
} from "diamnet-sdk";
import { Buffer } from "buffer";
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  IconButton,
  useMediaQuery,
  ListItemIcon,
  Avatar,
  Popover,
  Button,
  Tooltip,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { PinataSDK } from "pinata-web3";
import { IoCloseCircleOutline, IoSearch } from "react-icons/io5";
import swap from "../../assets/swap.png";
import {
  MdInfoOutline,
  MdOutlineSettingsInputComponent,
  MdSettingsInputComponent,
} from "react-icons/md";

// Polyfill Buffer for browser support
if (!window.Buffer) {
  window.Buffer = Buffer;
}

// ---------------------------------------------
// Configuration & Setup
// ---------------------------------------------
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const walletPublicKey = localStorage.getItem("diamPublicKey") || "";
const realIssuerPubKey =
  "GBCELHKB7SGUWXYW5S3NGYITDBUXBLV26UT2XAGETMLBWUFFBMI4U2GA";

// ---------------------------------------------
// Helper Functions (dynamic token extraction)
// ---------------------------------------------
function extractTokenCode(assetStr) {
  if (assetStr === "native") return "DIAM";
  const parts = assetStr.split(":");
  return parts[0] || assetStr;
}

function getAvailableTokens(liquidityPools) {
  const tokenSet = new Set();
  liquidityPools.forEach((pool) =>
    pool.reserves.forEach((reserve) =>
      tokenSet.add(extractTokenCode(reserve.asset))
    )
  );
  return Array.from(tokenSet);
}

/**
 * Find the best constant‐product pool for a given pair,
 * ignoring pools with zero reserves and favoring the deepest one.
 */
function getPoolForPair(fromToken, toToken, liquidityPools) {
  const candidates = liquidityPools.filter((pool) => {
    const fromRes = pool.reserves.find(
      (r) => extractTokenCode(r.asset) === fromToken
    );
    const toRes = pool.reserves.find(
      (r) => extractTokenCode(r.asset) === toToken
    );
    return (
      fromRes &&
      toRes &&
      parseFloat(fromRes.amount) > 0 &&
      parseFloat(toRes.amount) > 0
    );
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const aFrom = parseFloat(
      a.reserves.find((r) => extractTokenCode(r.asset) === fromToken).amount
    );
    const aTo = parseFloat(
      a.reserves.find((r) => extractTokenCode(r.asset) === toToken).amount
    );
    const bFrom = parseFloat(
      b.reserves.find((r) => extractTokenCode(r.asset) === fromToken).amount
    );
    const bTo = parseFloat(
      b.reserves.find((r) => extractTokenCode(r.asset) === toToken).amount
    );
    return bFrom * bTo - aFrom * aTo;
  });

  return candidates[0];
}

// ---------------------------------------------
// Original Helper Functions (unchanged)
// ---------------------------------------------
async function updateTransactionHistory(transactionData) {
  try {
    console.log("updateTransactionHistory: pinning data", transactionData);
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({ pinataContent: transactionData }),
      }
    );
    const result = await response.json();
    console.log("Pinned transaction data result:", result);
    const history = JSON.parse(localStorage.getItem("txHistory") || "[]");
    history.push({ ...transactionData, ipfsHash: result.IpfsHash });
    localStorage.setItem("txHistory", JSON.stringify(history));
    return result;
  } catch (error) {
    console.error("Error pinning transaction data:", error);
  }
}

const friendbotFund = async (publicKey) => {
  try {
    console.log(`Calling friendbot for ${publicKey}`);
    const resp = await fetch(`${friendbotUrl}${publicKey}`);
    if (!resp.ok) {
      if (resp.status === 400) {
        const errData = await resp.json();
        if (
          errData?.detail &&
          errData.detail.includes("createAccountAlreadyExist")
        ) {
          console.log("Account already exists. Proceeding...");
          return;
        } else {
          throw new Error(errData.detail || resp.statusText);
        }
      } else {
        throw new Error(resp.statusText);
      }
    }
    console.log(`Friendbot funded account: ${publicKey}`);
  } catch (error) {
    console.error("Friendbot funding error:", error);
    throw error;
  }
};

const establishUserTrustline = async (asset, walletPublicKey) => {
  if (!walletPublicKey) {
    throw new Error("Wallet not connected. Please connect your wallet.");
  }
  const userAccount = await server.loadAccount(walletPublicKey);
  console.log(
    "Establishing trustline on account:",
    walletPublicKey,
    "asset:",
    asset
  );
  const trustTx = new TransactionBuilder(userAccount, {
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
  console.log("Trustline XDR:", trustTx.toXDR());
  const trustResult = await window.diam.sign(
    trustTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  console.log("Trustline sign response:", trustResult);
  const response = await server.submitTransaction(trustTx);
  console.log("Trustline established. Tx Hash:", response.hash);
  return response.hash;
};

// Replace your broken version with this one:

// 1) restore the original signature (no toAsset/fromAsset parameters):
function getDynamicTradeTokenIssuer(accountData, threshold = 1) {
  console.log("Determining dynamic TradeToken issuer…");
  if (!accountData || !accountData.balances) return null;
  const qualifying = accountData.balances.filter((bal) => {
    return (
      bal.asset_code === "TradeToken" &&
      parseFloat(bal.balance) > threshold &&
      parseFloat(bal.buying_liabilities || "0") <= 0
    );
  });
  if (!qualifying.length) return null;
  // pick the one with the largest balance
  qualifying.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
  console.log("Selected dynamic issuer:", qualifying[0].asset_issuer);
  return qualifying[0].asset_issuer;
}

// 1) After fetching pools:

// 2) Then replace your getAssetObject with:

const getAssetObject = (assetName, dynamicIssuer = null) => {
  if (assetName === "DIAM") {
    return Asset.native();
  }
  const issuer = dynamicIssuer || tokenIssuers[assetName] || realIssuerPubKey;
  if (!issuer) {
    throw new Error(`Unknown asset: ${assetName}`);
  }
  return new Asset(assetName, issuer);
};

const doStrictSendSwap = async (
  walletPublicKey,
  fromAsset,
  toAsset,
  sendAmount,
  destMin,
  dynamicIssuer = null
) => {
  console.log("doStrictSendSwap params:", {
    walletPublicKey,
    fromAsset,
    toAsset,
    sendAmount,
    destMin,
    dynamicIssuer,
  });
  const userAccount = await server.loadAccount(walletPublicKey);
  const swapTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: getAssetObject(fromAsset, dynamicIssuer, toAsset),
        sendAmount,
        destination: walletPublicKey,
        destAsset: getAssetObject(toAsset, dynamicIssuer, toAsset),
        destMin,
        path: [],
      })
    )
    .setTimeout(300)
    .build();
  console.log("Swap XDR:", swapTx.toXDR());
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }
  const signResult = await window.diam.sign(
    swapTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  console.log("Swap sign response:", signResult);
  if (
    signResult?.message?.extras?.result_codes?.operations?.includes(
      "op_too_few_offers"
    )
  ) {
    console.warn("insufficient liquidity (op_too_few_offers). Returning N/A");
    return "N/A";
  }
  console.log(
    "Swap completed, result hash:",
    signResult.hash || signResult.message?.data?.hash
  );
  return signResult.hash || signResult.message?.data?.hash || null;
};

const doStrictReceiveSwap = async (
  walletPublicKey,
  fromAsset,
  toAsset,
  sendMax,
  destAmount,
  dynamicIssuer = null
) => {
  console.log("doStrictReceiveSwap params:", {
    walletPublicKey,
    fromAsset,
    toAsset,
    sendMax,
    destAmount,
    dynamicIssuer,
  });
  const userAccount = await server.loadAccount(walletPublicKey);
  const swapTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: getAssetObject(fromAsset, dynamicIssuer, toAsset, fromAsset),
        sendMax,
        destination: walletPublicKey,
        destAsset: getAssetObject(toAsset, dynamicIssuer, toAsset, fromAsset),
        destAmount,
        path: [],
      })
    )
    .setTimeout(300)
    .build();
  console.log("Receive swap XDR:", swapTx.toXDR());
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }
  const signResult = await window.diam.sign(
    swapTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  console.log("Receive swap sign response:", signResult);
  return signResult.hash || signResult.message?.data?.hash || null;
};

// ---------------------------------------------
// Token selector modal
// ---------------------------------------------
function TokenSelectModal({
  open,
  onClose,
  tokens,
  onSelectToken,
  title = "Select a token",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredTokens = tokens.filter((tk) =>
    tk.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Box
        sx={{
          backgroundColor: "#000",
          p: 2,
          borderRadius: 1,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <DialogTitle sx={{ color: "#fff", position: "relative" }}>
          {title}
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", top: 8, right: 8, color: "#aaa" }}
          >
            <IoCloseCircleOutline />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            placeholder="Search token"
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              sx: {
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 1,
              },
              endAdornment: (
                <InputAdornment position="end">
                  <IoSearch style={{ color: "#888" }} />
                </InputAdornment>
              ),
            }}
          />
          <List sx={{ mt: 1 }}>
            {filteredTokens.map((tk) => (
              <ListItemButton
                key={tk}
                onClick={() => {
                  onSelectToken(tk);
                  onClose();
                }}
              >
                <ListItemIcon>
                  <Avatar sx={{ width: 24, height: 24 }} />
                </ListItemIcon>
                <ListItemText primary={tk.toUpperCase()} />
              </ListItemButton>
            ))}
            {filteredTokens.length === 0 && (
              <Typography sx={{ textAlign: "center", mt: 2, color: "#aaa" }}>
                No matching tokens
              </Typography>
            )}
          </List>
        </DialogContent>
      </Box>
    </Dialog>
  );
}

// ---------------------------------------------
// SwapPage Component
// ---------------------------------------------
export default function SwapPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [userAccountData, setUserAccountData] = useState(null);
  const [fromAsset, setFromAsset] = useState("DIAM");
  const [toAsset, setToAsset] = useState("TradeToken");
  const [sendAmount, setSendAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [dynamicIssuer, setDynamicIssuer] = useState(null);
  const [liquidityPools, setLiquidityPools] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useState(false);
  const [activeSide, setActiveSide] = useState("from");

  // ** New state for slippage control **
  const [slippageTolerance, setSlippageTolerance] = useState(5); // in %
  const [slippageAnchorEl, setSlippageAnchorEl] = useState(null);
  const slippageOpen = Boolean(slippageAnchorEl);
  const handleSlippageClick = (e) => setSlippageAnchorEl(e.currentTarget);
  const handleSlippageClose = () => setSlippageAnchorEl(null);

  useEffect(() => {
    async function init() {
      try {
        console.log("Fetching liquidity pools...");
        const resp = await fetch(
          "https://diamtestnet.diamcircle.io/liquidity_pools/?limit=100"
        );
        const data = await resp.json();
        console.log("Liquidity pools fetched:", data._embedded.records.length);
        setLiquidityPools(data._embedded.records);
        setAvailableTokens(getAvailableTokens(data._embedded.records));
      } catch (e) {
        console.error("Error fetching pools:", e);
      }
      if (walletPublicKey) {
        try {
          console.log("Loading user account data for", walletPublicKey);
          const acct = await server
            .accounts()
            .accountId(walletPublicKey)
            .call();
          console.log("User account data:", acct);
          setUserAccountData(acct);
          const issuer = getDynamicTradeTokenIssuer(
            acct,
            1,
            toAsset,
            fromAsset
          );
          setDynamicIssuer(issuer);
        } catch (err) {
          console.error("Error loading account:", err);
        }
      }
    }
    init();
  }, []);

  const checkSufficientBalance = (token, amount) => {
    if (!userAccountData || !amount) return false;
    const entry = userAccountData.balances.find((b) =>
      token === "DIAM" ? b.asset_type === "native" : b.asset_code === token
    );
    return entry && parseFloat(entry.balance) >= parseFloat(amount);
  };

  const calcEstimatedReceived = () => {
    if (!sendAmount) return "";
    const pool = getPoolForPair(fromAsset, toAsset, liquidityPools);
    if (!pool) return "";

    const inReserve = parseFloat(
      pool.reserves.find((r) => extractTokenCode(r.asset) === fromAsset)
        ?.amount || 0
    );
    const outReserve = parseFloat(
      pool.reserves.find((r) => extractTokenCode(r.asset) === toAsset)
        ?.amount || 0
    );
    if (!inReserve || !outReserve) return "";

    const feeRate = pool.fee_bp / 10000;
    const effectiveSend = parseFloat(sendAmount) * (1 - feeRate);
    const dy = (outReserve * effectiveSend) / (inReserve + effectiveSend);

    console.log(
      `UI estimate → feeRate=${feeRate}, effectiveSend=${effectiveSend}, dy=${dy}`
    );
    return dy.toFixed(4);
  };

  const estimatedReceived = calcEstimatedReceived();

  const ratioValue = (() => {
    if (!sendAmount || !estimatedReceived) return "NaN";
    const s = parseFloat(sendAmount),
      r = parseFloat(estimatedReceived);
    return s > 0 && r > 0 ? (r / s).toFixed(4) : "NaN";
  })();

  const openSelectTokenModal = (side) => {
    setActiveSide(side);
    setSelectTokenModalOpen(true);
  };
  const handleSelectToken = (tk) => {
    activeSide === "from" ? setFromAsset(tk) : setToAsset(tk);
  };

  const handleSwap = async () => {
    console.log("handleSwap started:", {
      fromAsset,
      toAsset,
      sendAmount,
      slippageTolerance,
    });

    // ── 1) Pre‑flight checks ─────────────────────────────────────────────────────
    if (!availableTokens.includes(fromAsset)) {
      const msg = `Error: Asset ${fromAsset} not available.`;
      console.error(msg);
      setTxStatus(msg);
      setTransactionStatus("error");
      return;
    }
    if (!checkSufficientBalance(fromAsset, sendAmount)) {
      const msg = `Error: Insufficient ${fromAsset}.`;
      console.error(msg);
      setTxStatus(msg);
      setTransactionStatus("error");
      return;
    }
    const estUI = parseFloat(estimatedReceived);
    if (isNaN(estUI) || estUI <= 0) {
      const msg = "Error: Cannot compute estimated receive amount.";
      console.error(msg);
      setTxStatus(msg);
      setTransactionStatus("error");
      return;
    }

    // ── 2) UI state & optional trustline/fund ─────────────────────────────────
    setLoading(true);
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Preparing swap…");

    try {
      if (fromAsset || toAsset) {
        setTransactionMessage("Establishing trustline…");
        await establishUserTrustline(
          getAssetObject(toAsset, dynamicIssuer, toAsset, fromAsset),
          walletPublicKey
        );
      }

      setTransactionMessage("Funding via Friendbot…");
      await friendbotFund(walletPublicKey);

      // ── 3) Build send amount ────────────────────────────────────────────────
      const sendAmtStr = parseFloat(sendAmount).toFixed(7);

      // ── 4) Query Horizon’s strict‑send paths correctly ───────────────────────
      setTransactionMessage("Querying on‑chain path…");
      const pathResp = await server
        .strictSendPaths(
          getAssetObject(fromAsset, dynamicIssuer, toAsset, fromAsset), // sourceAsset
          sendAmtStr, // sourceAmount
          [getAssetObject(toAsset, dynamicIssuer, toAsset, fromAsset)] // destinationAssets
        )
        .limit(1) // ← only pull the best path
        .call(); // execute the request

      if (!pathResp.records.length) {
        throw new Error("No available path for this swap");
      }

      const onChainEst = parseFloat(pathResp.records[0].destination_amount);
      console.log("on‑chain quote:", onChainEst);

      // ── 5) Apply slippage tolerance (percent) ───────────────────────────────
      const slippageFactor = 1 - slippageTolerance / 100;
      const rawDestMin = onChainEst * slippageFactor;
      const destMinStr = rawDestMin.toFixed(7);

      console.log({
        sendAmtStr,
        onChainEst,
        slippageTolerance,
        slippageFactor,
        rawDestMin,
        destMinStr,
      });

      // ── 6) Execute the swap with guaranteed‑correct destMin ─────────────────
      setTransactionMessage("Executing swap…");
      const swapHash = await doStrictSendSwap(
        walletPublicKey,
        fromAsset,
        toAsset,
        sendAmtStr,
        destMinStr,
        dynamicIssuer
      );

      console.log("Swap hash returned:", swapHash);
      setTxStatus(`Success! Hash: ${swapHash || "N/A"}`);
      setTransactionStatus("success");
      setTransactionMessage("Swap completed.");
      setTransactionHash(swapHash || "");

      // ── 7) Record history ─────────────────────────────────────────────────
      await updateTransactionHistory({
        txHash: swapHash,
        fromAsset,
        toAsset,
        sendAmount,
        estimatedReceived: onChainEst.toFixed(4),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Swap error:", err);
      const msg = err.message.includes("Unknown asset")
        ? `Error: Asset ${fromAsset} not in wallet.`
        : err.message;
      setTxStatus(msg);
      setTransactionStatus("error");
      setTransactionMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#000", minHeight: "100vh" }}>
      <Card
        sx={{
          width: isMobile ? "100%" : 500,
          bgcolor: "rgba(0,206,229,0.1)",
          mx: "auto",
          my: 4,
          borderRadius: 2,
          border: "1px solid #4d4d4d",
          p: 3,
          position: "relative",
        }}
      >
        {/* Slippage Control at top-right */}
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Tooltip title="Your transaction will revert if price moves beyond this slippage">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography sx={{ color: "white", fontWeight: 500 }}>
                Max slippage
              </Typography>
              <IconButton size="small" sx={{ color: "white", p: 0.5 }}>
                <MdInfoOutline />
              </IconButton>
            </Box>
          </Tooltip>

          <Button
            size="small"
            variant="contained"
            onClick={handleSlippageClick}
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              color: "#FFF",
              textTransform: "none",
              borderRadius: "19px",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              px: 1.5,
            }}
          >
            Auto
          </Button>

          <Typography sx={{ color: "#FFF", fontWeight: 500 }}>
            {slippageTolerance.toFixed(2)}%
          </Typography>
        </Box>

        <CardContent>
          <Typography variant="subtitle2" mb={1}>
            Pay
          </Typography>
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.05)",
              borderRadius: 1,
              p: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TextField
              variant="standard"
              placeholder="0"
              value={sendAmount}
              onChange={(e) =>
                setSendAmount(e.target.value.replace(/[^0-9.]/g, ""))
              }
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: "1.25rem", color: "#fff", width: 100 },
              }}
            />
            <Box
              onClick={() => openSelectTokenModal("from")}
              sx={{
                bgcolor: "#142c41",
                borderRadius: 1,
                px: 2,
                py: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography fontWeight="bold" mr={1}>
                {fromAsset}
              </Typography>
              <Box
                component="svg"
                width={12}
                height={12}
                dangerouslySetInnerHTML={{
                  __html: "<path d='M3 4l3 3 3-3' fill='%23fff' />",
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              position: "absolute",
              top: "42%",
              left: "50%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <IconButton>
              <img src={swap} alt="swap" style={{ height: 40 }} />
            </IconButton>
          </Box>

          <Typography variant="subtitle2" mb={1}>
            Receive
          </Typography>
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.05)",
              borderRadius: 1,
              p: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TextField
              variant="standard"
              placeholder="0"
              value={estimatedReceived}
              InputProps={{
                readOnly: true,
                disableUnderline: true,
                sx: { fontSize: "1.25rem", color: "#fff", width: 100 },
              }}
            />
            <Box
              onClick={() => openSelectTokenModal("to")}
              sx={{
                bgcolor: "#142c41",
                borderRadius: 1,
                px: 2,
                py: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography fontWeight="bold" mr={1}>
                {toAsset}
              </Typography>
              <Box
                component="svg"
                width={12}
                height={12}
                dangerouslySetInnerHTML={{
                  __html: "<path d='M3 4l3 3 3-3' fill='%23fff' />",
                }}
              />
            </Box>
          </Box>

          <Typography variant="body2" color="#ccc" mb={3}>
            1 {fromAsset} = {ratioValue} {toAsset}
          </Typography>

          <Box textAlign="center">
            <CustomButton
              variant="contained"
              onClick={handleSwap}
              disabled={loading || !walletPublicKey}
            >
              {loading ? <CircularProgress size={24} /> : "Swap"}
            </CustomButton>
          </Box>

          {txStatus && (
            <Typography
              mt={2}
              textAlign="center"
              color={
                transactionStatus === "success"
                  ? "success.main"
                  : transactionStatus === "error"
                  ? "error.main"
                  : "#fff"
              }
            >
              {txStatus}
            </Typography>
          )}
        </CardContent>
      </Card>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />

      <TokenSelectModal
        open={selectTokenModalOpen}
        onClose={() => setSelectTokenModalOpen(false)}
        tokens={availableTokens}
        onSelectToken={handleSelectToken}
      />

      {/* Slippage Popover */}
      <Popover
        open={slippageOpen}
        anchorEl={slippageAnchorEl}
        onClose={handleSlippageClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 2, width: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            Max slippage
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            value={slippageTolerance}
            onChange={(e) =>
              setSlippageTolerance(Math.max(0, parseFloat(e.target.value)))
            }
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Box>
      </Popover>
    </Box>
  );
}
