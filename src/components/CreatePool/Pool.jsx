// src/pages/CreatePoolPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Stack,
  IconButton,
  Grid,
  Card,
} from "@mui/material";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { FiArrowLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Buffer } from "buffer";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "./TransactionModal";

if (!window.Buffer) {
  window.Buffer = Buffer;
}

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const FRIENDBOT_URL = "https://friendbot.diamcircle.io?addr=";

const feeTiers = [
  { tier: "0.3%", description: "Standard fee (0.3%)", tvl: "Medium TVL", select: "Select" },
  { tier: "1%",   description: "High fee (1%)",       tvl: "High TVL",   select: "Select" },
];

export default function CreatePoolPage() {
  // ─── State ─────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [tokenA, setTokenA] = useState("native");
  const [assetCode, setAssetCode] = useState("");
  const [tokenB, setTokenB] = useState("");             // CODE:ISSUER
  const [assetCodes, setAssetCodes] = useState([]);
  const [pools, setPools] = useState([]);               // store fetched pools
  const [selectedFeeTier, setSelectedFeeTier] = useState("0.3%");
  const [isExpanded, setIsExpanded] = useState(false);
  const [ethAmount, setEthAmount] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [poolDetails, setPoolDetails] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("pending");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  const [tokenBalances, setTokenBalances] = useState([]);

  const walletPublicKey = localStorage.getItem("diamPublicKey") || "";
  if (!walletPublicKey) console.warn("No wallet public key found.");

  const [sdk, setSdk] = useState(null);
  const [server, setServer] = useState(null);
  const [issuerKeypair, setIssuerKeypair] = useState(null);

  const addLog = (msg) => {
    console.log(msg);
    setLogs((prev) => [...prev, msg]);
  };

  // ─── 1️⃣ Load SDK + server + issuer ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const DiamSdkModule = await import("diamnet-sdk");
        const diamnetSdk = DiamSdkModule.default || DiamSdkModule;
        setSdk(diamnetSdk);
        setServer(new diamnetSdk.Aurora.Server("https://diamtestnet.diamcircle.io/"));
        const issuer = diamnetSdk.Keypair.random();
        setIssuerKeypair(issuer);
        addLog("SDK loaded. Issuer: " + issuer.publicKey());
      } catch (e) {
        addLog("SDK load error: " + e);
      }
    })();
  }, []);

  // ─── 2️⃣ Fetch your wallet balances ─────────────────────────────────
  useEffect(() => {
    if (!walletPublicKey) return;
    (async () => {
      try {
        const res = await fetch(`https://diamtestnet.diamcircle.io/accounts/${walletPublicKey}`);
        const data = await res.json();
        setTokenBalances(data.balances || []);
      } catch (err) {
        console.error("Error fetching balances:", err);
        addLog("Error fetching balances: " + err);
      }
    })();
  }, [walletPublicKey]);

  // ─── 3️⃣ Fetch existing pool asset codes & store pools ────────────────
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch("https://diamtestnet.diamcircle.io/liquidity_pools?limit=200");
        const json = await resp.json();
        const records = json._embedded?.records || json.records || [];
        setPools(records);
        const codes = Array.from(
          new Set(
            records.flatMap((p) =>
              p.reserves
                .filter((r) => r.asset !== "native")
                .map((r) => r.asset.split(":")[0])
            )
          )
        );
        setAssetCodes(codes);
      } catch (e) {
        addLog("Asset codes fetch error: " + e);
      }
    })();
  }, []);

  // ─── 4️⃣ When user picks assetCode, find real issuer ────────────────
  useEffect(() => {
    if (!assetCode) return;
    const entry = tokenBalances.find(
      (b) => b.asset_code === assetCode && b.asset_type !== "native"
    );
    if (entry) {
      setTokenB(`${assetCode}:${entry.asset_issuer}`);
      addLog(`Token B set to ${assetCode}:${entry.asset_issuer}`);
    }
  }, [assetCode, tokenBalances]);

  // ─── ⚡ Auto-fill Token B amount from on-chain pool price ────────────
  useEffect(() => {
    if (
      tokenA.toLowerCase() === "native" &&
      tokenB &&
      ethAmount &&
      pools.length
    ) {
      const [code, issuer] = tokenB.split(":");
      const pool = pools.find((p) => {
        const hasNative = p.reserves.some((r) => r.asset === "native");
        const hasPair = p.reserves.some((r) => r.asset === `${code}:${issuer}`);
        return hasNative && hasPair;
      });
      if (!pool) return;
      const nativeRes = pool.reserves.find((r) => r.asset === "native");
      const tokenRes = pool.reserves.find((r) => r.asset === `${code}:${issuer}`);
      const nativeBal = parseFloat(nativeRes.amount);
      const tokenBal = parseFloat(tokenRes.amount);
      if (!nativeBal || !tokenBal) return;
      const livePrice = tokenBal / nativeBal;
      setUsdtAmount((parseFloat(ethAmount) * livePrice).toFixed(6));
    }
  }, [ethAmount, tokenB, tokenA, pools]);

  const handleToggleExpand = () => setIsExpanded((x) => !x);

  // ─── Custom parseTokenInput ─────────────────────────────────────────
  const parseTokenInput = (input) => {
    const val = input.trim();
    if (/^(native|xlm)$/i.test(val)) return sdk.Asset.native();
    const [code, issuer] = val.split(":");
    if (!code || !issuer || code.length > 12) throw new Error("MISSING_TOKENS");
    return new sdk.Asset(code, issuer);
  };

  const friendbotFund = async (pk) => {
    try {
      const resp = await fetch(`${FRIENDBOT_URL}${pk}`);
      if (resp.ok) addLog("Funded: " + pk);
      else {
        const err = await resp.text();
        addLog("Fund error: " + err);
      }
    } catch (e) {
      addLog("Friendbot error: " + e);
    }
  };

  // ─── Full fixed handleCreatePool ────────────────────────────────────
// ─── Full updated handleCreatePool ────────────────────────────────────
const handleCreatePool = async () => {
  if (!server || !sdk || !issuerKeypair || !walletPublicKey) return;
  setLoading(true);
  setModalOpen(true);
  setTransactionStatus("pending");
  setTransactionMessage("Starting liquidity pool creation...");

  try {
    const {
      TransactionBuilder,
      BASE_FEE,
      Operation,
      LiquidityPoolAsset,
      getLiquidityPoolId,
    } = sdk;

    // 🍭 Fund only your wallet for fees
    await friendbotFund(walletPublicKey);

    // parse assets
    let assetA, assetB;
    try {
      assetA = parseTokenInput(tokenA);
      assetB = parseTokenInput(tokenB);
    } catch (_) {
      setTransactionStatus("error");
      setTransactionMessage("You must have both tokens to create a pool.");
      addLog("Error: Missing tokens for liquidity pool creation.");
      setLoading(false);
      return;
    }

    // 🏦 Re-fetch balances and check
    const balResp = await fetch(
      `https://diamtestnet.diamcircle.io/accounts/${walletPublicKey}`
    );
    const balances = (await balResp.json()).balances || [];
    const hasAssetA = balances.some(b =>
      assetA.isNative()
        ? b.asset_type === "native"
        : b.asset_code === assetA.getCode() && b.asset_issuer === assetA.getIssuer()
    );
    const hasAssetB = balances.some(b =>
      assetB.isNative()
        ? b.asset_type === "native"
        : b.asset_code === assetB.getCode() && b.asset_issuer === assetB.getIssuer()
    );
    if (!hasAssetA || !hasAssetB) {
      setTransactionStatus("error");
      setTransactionMessage("You must have both tokens to create a pool.");
      addLog("Error: Missing tokens for liquidity pool creation.");
      setLoading(false);
      return;
    }

    // 🔗 Build trustline for Token B
    let trustTx = new TransactionBuilder(
      await server.loadAccount(walletPublicKey),
      { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(Operation.changeTrust({ asset: assetB }))
      .setTimeout(30)
      .build();
    await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
    await server.submitTransaction(trustTx);

    // 🏗️ Build LP asset
    const feeNum = parseFloat(selectedFeeTier) * 100;
    const lpAsset = new LiquidityPoolAsset(assetA, assetB, feeNum);
    lpAsset.type = "liquidity_pool_constant_product";
    lpAsset.assetType = "liquidity_pool_constant_product";
    let poolId;
    try {
      poolId = getLiquidityPoolId("constant_product", { assetA, assetB, fee: feeNum })
        .toString("hex");
      lpAsset.liquidityPoolId = poolId;
    } catch (e) {
      addLog("getLiquidityPoolId error: " + e);
      poolId = "N/A";
    }

    // 🔗 Trustline LP shares
    let lpTrust = new TransactionBuilder(
      await server.loadAccount(walletPublicKey),
      { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(Operation.changeTrust({ asset: lpAsset }))
      .setTimeout(30)
      .build();
    await window.diam.sign(lpTrust.toXDR(), true, NETWORK_PASSPHRASE);
    await server.submitTransaction(lpTrust);

    // ─── compute exact deposit‐price bounds to avoid op_bad_price ───────
    const ratio  = parseFloat(usdtAmount) / parseFloat(ethAmount);
    const scaledN = Math.floor(ratio * 1e7);
    const scaledD = 10000000;                 // <<< changed here from 10_000_000

    // 💧 Deposit liquidity
    let depositTx = new TransactionBuilder(
      await server.loadAccount(walletPublicKey),
      { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(
        Operation.liquidityPoolDeposit({
          liquidityPoolId: new Uint8Array(Buffer.from(poolId, "hex")),
          maxAmountA: ethAmount || "10",
          maxAmountB: usdtAmount || "20",
          minPrice: { n: scaledN, d: scaledD },
          maxPrice: { n: scaledN, d: scaledD },
        })
      )
      .setTimeout(30)
      .build();
    await window.diam.sign(depositTx.toXDR(), true, NETWORK_PASSPHRASE);
    await server.submitTransaction(depositTx);

    // ✅ Done
    setPoolDetails({ lpAsset, liquidityPoolId: poolId });
    setTransactionStatus("success");
    setTransactionMessage(`Pool created! ID: ${poolId}`);
    setTransactionHash(poolId);
  } catch (e) {
    setTransactionStatus("error");
    setTransactionMessage(e.toString());
    addLog("Error creating pool: " + e);
  } finally {
    setLoading(false);
  }
};



  // ─── Render ────────────────────────────────────────────────────────
  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          backgroundColor: "rgba(0,206,229,0.06)",
          p: 4,
          borderRadius: 3,
          border: "1px solid #FFFFFF4D",
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Create Liquidity Pool
        </Typography>

        {/* Pair/Fee or Deposit */}
        {step === 0 ? (
          <>
            {/* Pair + Fee */}
            <Typography variant="h6" sx={{ mb: 1, color: "#fff" }}>
              Select pair
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
              Choose the tokens you want to provide liquidity for.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Token A"
                value={tokenA}
                onChange={(e) => setTokenA(e.target.value)}
                variant="outlined"
                InputLabelProps={{ sx: { color: "#888" } }}
                InputProps={{
                  sx: {
                    bgcolor: "#1a1a1a",
                    borderRadius: 2,
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#333" },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#555",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00d4ff",
                    },
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <AiOutlinePlusCircle color="#888" />
                    </InputAdornment>
                  ),
                }}
              />
              <Autocomplete
                options={assetCodes}
                value={assetCode}
                onChange={(_, v) => setAssetCode(v || "")}
                disableClearable
                popupIcon={<FiChevronDown style={{ color: "white" }} />}
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    bgcolor: "#1a1a1a",
                    borderRadius: 2,
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#333" },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#555",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00d4ff",
                    },
                  },
                  input: { color: "#fff" },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Token"
                    variant="outlined"
                    InputProps={{ ...params.InputProps, sx: { color: "#fff" } }}
                  />
                )}
              />
            </Stack>
            <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>
              Fee tier
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
              The amount earned providing liquidity. Choose what suits your strategy.
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                bgcolor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="#fff">
                  {selectedFeeTier} fee tier
                </Typography>
                <Typography variant="caption" color="#aaa">
                  The % you will earn in fees
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleToggleExpand}>
                {isExpanded ? <FiChevronUp color="#fff" /> : <FiChevronDown color="#fff" />}
              </IconButton>
            </Box>
            {isExpanded && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {feeTiers.map((fee) => (
                  <Grid item xs={6} key={fee.tier}>
                    <Card
                      onClick={() => setSelectedFeeTier(fee.tier)}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        borderRadius: 2,
                        bgcolor:
                          selectedFeeTier === fee.tier ? "#0d0d0d" : "#1a1a1a",
                        border:
                          selectedFeeTier === fee.tier
                            ? "2px solid #00d4ff"
                            : "1px solid #333",
                      }}
                    >
                      <Typography variant="subtitle2" color="#fff">
                        {fee.tier}
                      </Typography>
                      <Typography variant="body2" color="#aaa" sx={{ mt: 1 }}>
                        {fee.description}
                      </Typography>
                      <Typography variant="caption" color="#aaa" sx={{ display: "block", mt: 1 }}>
                        {fee.tvl}
                      </Typography>
                      <Typography variant="caption" color="#aaa">
                        {fee.select}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            <CustomButton fullWidth variant="contained" disabled={!assetCode} onClick={() => setStep(1)}>
              Continue
            </CustomButton>
          </>
        ) : (
          <>
            {/* Deposit */}
            <IconButton onClick={() => setStep(0)} sx={{ mb: 2 }}>
              <FiArrowLeft color="#fff" />
            </IconButton>
            <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>
              Deposit tokens
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Token A amount"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                sx={{ mb: 1, border: "1px solid gray", borderRadius: 2 }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Token B amount"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
                sx={{ mb: 1, border: "1px solid gray", borderRadius: 2 }}
              />
            </Box>
            <CustomButton fullWidth variant="contained" disabled={!ethAmount || !usdtAmount} onClick={handleCreatePool}>
              {loading ? <CircularProgress size={24} /> : "Create Pool"}
            </CustomButton>
          </>
        )}
      </Box>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />
    </Container>
  );
}
