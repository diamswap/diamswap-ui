// src/components/SwapPage.jsx
import React, { useState, useEffect } from "react";
import {
  Asset,
  Aurora,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from "diamnet-sdk";
import { Buffer } from "buffer";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
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
import { useTheme } from "@mui/material/styles";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { IoCloseCircleOutline, IoSearch } from "react-icons/io5";
import swap from "../../assets/swap.png";
import { MdInfoOutline } from "react-icons/md";

// -----------------------------------------------------------------------------
// Polyfill & global mutable state
// -----------------------------------------------------------------------------
if (!window.Buffer) window.Buffer = Buffer;

// issuer table built at runtime from liquidity‑pools
let tokenIssuers = {};

// -----------------------------------------------------------------------------
// Helper utilities
// -----------------------------------------------------------------------------
const extractTokenCode = (a) => (a === "native" ? "DIAM" : a.split(":")[0]);

const DEFAULT_ISSUER =
  "GBCELHKB7SGUWXYW5S3NGYITDBUXBLV26UT2XAGETMLBWUFFBMI4U2GA";

const buildAsset = (code, issuerOverride = null, dynamicIssuer = null) => {
  if (code === "DIAM") return Asset.native();
  const issuer = issuerOverride || tokenIssuers[code] || dynamicIssuer || DEFAULT_ISSUER;
  return new Asset(code, issuer);
};

const getAvailableTokens = (pools) => {
  const s = new Set();
  pools.forEach((p) =>
    p.reserves.forEach((r) => s.add(extractTokenCode(r.asset)))
  );
  return [...s];
};

const getPoolForPair = (from, to, pools) => {
  const c = pools.filter((p) => {
    const fr = p.reserves.find((r) => extractTokenCode(r.asset) === from);
    const tr = p.reserves.find((r) => extractTokenCode(r.asset) === to);
    return (
      fr &&
      tr &&
      parseFloat(fr.amount) > 0 &&
      parseFloat(tr.amount) > 0
    );
  });
  if (!c.length) return null;
  c.sort((a, b) => {
    const af = parseFloat(
      a.reserves.find((r) => extractTokenCode(r.asset) === from).amount
    );
    const at = parseFloat(
      a.reserves.find((r) => extractTokenCode(r.asset) === to).amount
    );
    const bf = parseFloat(
      b.reserves.find((r) => extractTokenCode(r.asset) === from).amount
    );
    const bt = parseFloat(
      b.reserves.find((r) => extractTokenCode(r.asset) === to).amount
    );
    return bf * bt - af * at;
  });
  return c[0];
};

// -----------------------------------------------------------------------------
// Network config
// -----------------------------------------------------------------------------
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const walletPublicKey = localStorage.getItem("diamPublicKey") || "";

// -----------------------------------------------------------------------------
// Horizon / IPFS helpers
// -----------------------------------------------------------------------------
async function updateTransactionHistory(entry) {
  try {
    const r = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({ pinataContent: entry }),
      }
    );
    const res = await r.json();
    const hist = JSON.parse(localStorage.getItem("txHistory") || "[]");
    hist.push({ ...entry, ipfsHash: res.IpfsHash });
    localStorage.setItem("txHistory", JSON.stringify(hist));
  } catch (e) {
    console.error("Pinata error", e);
  }
}

const friendbotFund = async (pk) => {
  const r = await fetch(`${friendbotUrl}${pk}`);
  if (!r.ok && r.status !== 400) throw new Error(r.statusText);
};

const establishUserTrustline = async (asset, pk) => {
  if (asset.isNative()) return;
  const acct = await server.loadAccount(pk);
  const tx = new TransactionBuilder(acct, {
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
  await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
  await server.submitTransaction(tx);
};

function getDynamicTradeTokenIssuer(acct, thresh = 1) {
  if (!acct?.balances) return null;
  const q = acct.balances.filter(
    (b) => b.asset_code === "TradeToken" && parseFloat(b.balance) > thresh
  );
  if (!q.length) return null;
  q.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
  return q[0].asset_issuer;
}

const strictSendSwap = async (pk, sendAsset, destAsset, amt, destMin) => {
  const acct = await server.loadAccount(pk);
  const tx = new TransactionBuilder(acct, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset,
        sendAmount: amt,
        destination: pk,
        destAsset,
        destMin,
        path: [],
      })
    )
    .setTimeout(300)
    .build();
  const res = await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
  return res.hash || res.message?.data?.hash || null;
};

// -----------------------------------------------------------------------------
// Token select modal
// -----------------------------------------------------------------------------
function TokenSelectModal({ open, onClose, tokens, onSelectToken, title }) {
  const [q, setQ] = useState("");
  const list = tokens.filter((t) =>
    t.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Box
        sx={{
          bgcolor: "#000",
          p: 2,
          borderRadius: 1,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>{title}</DialogTitle>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 8, right: 8, color: "#aaa" }}
        >
          <IoCloseCircleOutline />
        </IconButton>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search token"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              sx: { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 },
              endAdornment: (
                <InputAdornment position="end">
                  <IoSearch style={{ color: "#888" }} />
                </InputAdornment>
              ),
            }}
          />
          <List sx={{ mt: 1 }}>
            {list.map((t) => (
              <ListItemButton
                key={t}
                onClick={() => {
                  onSelectToken(t);
                  onClose();
                }}
              >
                <ListItemIcon>
                  <Avatar sx={{ width: 24, height: 24 }} />
                </ListItemIcon>
                <ListItemText primary={t.toUpperCase()} />
              </ListItemButton>
            ))}
            {!list.length && (
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

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
export default function SwapPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [userAcct, setUserAcct] = useState(null);
  const [fromCode, setFromCode] = useState("DIAM");
  const [toCode, setToCode] = useState("TradeToken");
  const [sendAmt, setSendAmt] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [txState, setTxState] = useState("");
  const [txMsg, setTxMsg] = useState("");
  const [hash, setHash] = useState("");
  const [dynIssuer, setDynIssuer] = useState(null);
  const [pools, setPools] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [tokenModal, setTokenModal] = useState(false);
  const [side, setSide] = useState("from");
  const [slippage, setSlippage] = useState(5);
  const [slipEl, setSlipEl] = useState(null);

  // --------------------------- load pools + account --------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          "https://diamtestnet.diamcircle.io/liquidity_pools/?limit=100"
        );
        const data = await res.json();
        const recs = data._embedded.records;
        setPools(recs);
        setTokens(getAvailableTokens(recs));
        // build issuer table: pick deepest reserve per code
        const tmp = {};
        recs.forEach((p) =>
          p.reserves.forEach((r) => {
            if (r.asset === "native") return;
            const [c, i] = r.asset.split(":");
            const amt = parseFloat(r.amount);
            if (!tmp[c] || amt > tmp[c].amt) tmp[c] = { issuer: i, amt };
          })
        );
        tokenIssuers = Object.fromEntries(
          Object.entries(tmp).map(([c, { issuer }]) => [c, issuer])
        );
      } catch (e) {
        console.error(e);
      }
      if (walletPublicKey) {
        try {
          const acct = await server.accounts().accountId(walletPublicKey).call();
          setUserAcct(acct);
          setDynIssuer(getDynamicTradeTokenIssuer(acct, 1));
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, []);

  // ------------------------------ derived values ----------------------------
  const pool = getPoolForPair(fromCode, toCode, pools);
  const estimatedReceived = (() => {
    if (!sendAmt || !pool) return "";
    const inRes = parseFloat(
      pool.reserves.find((r) => extractTokenCode(r.asset) === fromCode).amount
    );
    const outRes = parseFloat(
      pool.reserves.find((r) => extractTokenCode(r.asset) === toCode).amount
    );
    const feeRate = pool.fee_bp / 10000;
    const effective = parseFloat(sendAmt) * (1 - feeRate);
    const dy = (outRes * effective) / (inRes + effective);
    return dy.toFixed(4);
  })();
  const ratio =
    !sendAmt || !estimatedReceived
      ? "NaN"
      : (parseFloat(estimatedReceived) / parseFloat(sendAmt)).toFixed(4);

  // ------------------------------ UI helpers --------------------------------
  const openTokenModal = (s) => {
    setSide(s);
    setTokenModal(true);
  };
  const selectToken = (code) => {
    side === "from" ? setFromCode(code) : setToCode(code);
  };

  const sufficientBalance = (code, amt) => {
    if (!userAcct || !amt) return false;
    const b = userAcct.balances.find((bal) =>
      code === "DIAM" ? bal.asset_type === "native" : bal.asset_code === code
    );
    return b && parseFloat(b.balance) >= parseFloat(amt);
  };

  const handleSwap = async () => {
    if (!sufficientBalance(fromCode, sendAmt)) {
      setStatus(`Insufficient ${fromCode}`);
      setTxState("error");
      return;
    }
    if (!pool) {
      setStatus("No liquidity pool found for this pair");
      setTxState("error");
      return;
    }

    setLoading(true);
    setModalOpen(true);
    setTxState("pending");
    setTxMsg("Preparing transaction…");

    // issuer addresses straight from the chosen pool
    const issuerFrom =
      fromCode === "DIAM"
        ? null
        : pool.reserves.find((r) => extractTokenCode(r.asset) === fromCode).asset.split(":"            )[1];
    const issuerTo =
      toCode === "DIAM"
        ? null
        : pool.reserves.find((r) => extractTokenCode(r.asset) === toCode).asset.split(":"            )[1];

    const sendAsset = buildAsset(fromCode, issuerFrom, dynIssuer);
    const destAsset = buildAsset(toCode, issuerTo, dynIssuer);

    try {
      await establishUserTrustline(destAsset, walletPublicKey);
      await friendbotFund(walletPublicKey);

      const amtStr = parseFloat(sendAmt).toFixed(7);
      const quote = await server
        .strictSendPaths(sendAsset, amtStr, [destAsset])
        .limit(1)
        .call();
      if (!quote.records.length) throw new Error("No price path");
      const onChainEst = parseFloat(quote.records[0].destination_amount);
      const destMin = (onChainEst * (1 - slippage / 100)).toFixed(7);

      setTxMsg("Signing & submitting…");
      const h = await strictSendSwap(
        walletPublicKey,
        sendAsset,
        destAsset,
        amtStr,
        destMin
      );

      setHash(h);
      setStatus("Swap successful");
      setTxState("success");
      await updateTransactionHistory({
        txHash: h,
        fromCode,
        toCode,
        sendAmt,
        received: onChainEst.toFixed(4),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
      setStatus(e.message);
      setTxState("error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
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
        {/* Slippage control */}
        <Box
          sx={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Tooltip title="Your transaction will revert if price moves beyond this slippage">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography sx={{ color: "white", fontWeight: 500 }}>Max slippage</Typography>
              <IconButton size="small" sx={{ color: "white", p: 0.5 }}>
                <MdInfoOutline />
              </IconButton>
            </Box>
          </Tooltip>
          <Button
            size="small"
            variant="contained"
            onClick={(e) => setSlipEl(e.currentTarget)}
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              color: "#FFF",
              textTransform: "none",
              borderRadius: "19px",
              px: 1.5,
            }}
          >
            Auto
          </Button>
          <Typography sx={{ color: "#FFF", fontWeight: 500 }}>
            {slippage.toFixed(2)}%
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
              value={sendAmt}
              onChange={(e) =>
                setSendAmt(e.target.value.replace(/[^0-9.]/g, ""))
              }
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: "1.25rem", color: "#fff", width: 100 },
              }}
            />
            <Box
              onClick={() => openTokenModal("from")}
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
                {fromCode}
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
            sx={{ position: "absolute", top: "42%", left: "50%", transform: "translate(-50%,-50%)" }}
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
              onClick={() => openTokenModal("to")}
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
                {toCode}
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
            1 {fromCode} = {ratio} {toCode}
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

          {status && (
            <Typography
              mt={2}
              textAlign="center"
              color={
                txState === "success"
                  ? "success.main"
                  : txState === "error"
                  ? "error.main"
                  : "#fff"
              }
            >
              {status}
            </Typography>
          )}
        </CardContent>
      </Card>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={txState}
        message={txMsg}
        transactionHash={hash}
      />

      <TokenSelectModal
        open={tokenModal}
        onClose={() => setTokenModal(false)}
        tokens={tokens}
        onSelectToken={selectToken}
        title="Select a token"
      />

      {/* Slippage popover */}
      <Popover
        open={Boolean(slipEl)}
        anchorEl={slipEl}
        onClose={() => setSlipEl(null)}
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
            value={slippage}
            onChange={(e) =>
              setSlippage(Math.max(0, parseFloat(e.target.value)))}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">%</InputAdornment>
              ),
            }}
          />
        </Box>
      </Popover>
    </Box>
  );
}
