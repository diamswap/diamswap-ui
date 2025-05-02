// src/pages/CreatePoolPage.jsx
import React, { useState, useEffect, useRef } from "react";
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

if (!window.Buffer) window.Buffer = Buffer;

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const FRIENDBOT_URL = "https://friendbot.diamcircle.io?addr=";
const feeTiers = [
  { tier: "0.3%", description: "Standard fee (0.3%)", tvl: "Medium TVL" },
  { tier: "1%", description: "High fee (1%)", tvl: "High TVL" },
];
// Avoid op_bad_price by allowing full price range
const FULL_MIN = { n: 1, d: 10_000_000 };
const FULL_MAX = { n: 1_000_000_000, d: 1 };

export default function CreatePoolPage() {
  // ─── State ─────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [tokenA, setTokenA] = useState("native");
  const [assetCode, setAssetCode] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [assetCodes, setAssetCodes] = useState([]);
  const [pools, setPools] = useState([]);
  const [selectedFeeTier, setSelectedFeeTier] = useState("0.3%");
  const [isExpanded, setIsExpanded] = useState(false);
  const [ethAmount, setEthAmount] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [livePrice, setLivePrice] = useState("0.000000");
  const lastEdited = useRef("A"); // track which field was last typed

  const [loading, setLoading] = useState(false);
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
  };

  // ─── 1️⃣ Load SDK + Server ─────────────────────────
  useEffect(() => {
    (async () => {
      const Diam = await import("diamnet-sdk");
      const DiamSdk = Diam.default || Diam;
      setSdk(DiamSdk);
      setServer(new DiamSdk.Aurora.Server("https://diamtestnet.diamcircle.io/"));
      const issuer = DiamSdk.Keypair.random();
      setIssuerKeypair(issuer);
      addLog("SDK loaded. Issuer: " + issuer.publicKey());
    })();
  }, []);

  // ─── 2️⃣ Fetch balances ─────────────────────────────
  useEffect(() => {
    if (!walletPublicKey) return;
    fetch(`https://diamtestnet.diamcircle.io/accounts/${walletPublicKey}`)
      .then((r) => r.json())
      .then((d) => setTokenBalances(d.balances || []))
      .catch((e) => addLog("Balances error: " + e));
  }, [walletPublicKey]);

  // ─── 3️⃣ Fetch pools & asset codes ─────────────────
  useEffect(() => {
    fetch("https://diamtestnet.diamcircle.io/liquidity_pools?limit=200")
      .then((r) => r.json())
      .then((json) => {
        const recs = json._embedded?.records || json.records || [];
        setPools(recs);
        const codes = Array.from(
          new Set(
            recs.flatMap((p) =>
              p.reserves
                .filter((r) => r.asset !== "native")
                .map((r) => r.asset.split(":")[0])
            )
          )
        );
        setAssetCodes(codes);
      })
      .catch((e) => addLog("Pools error: " + e));
  }, []);

  // ─── 4️⃣ Resolve B issuer once code picked ─────────
  useEffect(() => {
    if (!assetCode) return;
    const entry = tokenBalances.find(
      (b) => b.asset_code === assetCode && b.asset_type !== "native"
    );
    if (entry) {
      setTokenB(`${assetCode}:${entry.asset_issuer}`);
    }
  }, [assetCode, tokenBalances]);

  // ─── 5️⃣ Compute livePrice + auto-fill ──────────────
  // useEffect(() => {
  //   if (!pools.length || !tokenA || !tokenB) return;

  //   // parse asset
  //   const parse = (t) =>
  //     t === "native"
  //       ? { code: "native", issuer: null }
  //       : { code: t.split(":")[0], issuer: t.split(":")[1] };
  //   const { code: A, issuer: iA } = parse(tokenA);
  //   const { code: B, issuer: iB } = parse(tokenB);

  //   // find that pool
  //   const pool = pools.find((p) => {
  //     const has = (c, i) =>
  //       c === "native"
  //         ? p.reserves.some((r) => r.asset === "native")
  //         : p.reserves.some((r) => r.asset === `${c}:${i}`);
  //     return has(A, iA) && has(B, iB);
  //   });
  //   if (!pool) {
  //     setLivePrice("0.000000");
  //     return;
  //   }

  //   // read reserves
  //   const amtA = parseFloat(
  //     A === "native"
  //       ? pool.reserves.find((r) => r.asset === "native").amount
  //       : pool.reserves.find((r) => r.asset === `${A}:${iA}`).amount
  //   );
  //   const amtB = parseFloat(
  //     B === "native"
  //       ? pool.reserves.find((r) => r.asset === "native").amount
  //       : pool.reserves.find((r) => r.asset === `${B}:${iB}`).amount
  //   );
  //   if (!amtA) {
  //     setLivePrice("0.000000");
  //     return;
  //   }

  //   const price = amtB / amtA;
  //   setLivePrice(price.toFixed(6));

  //   // auto-fill the opposite field
  //   if (lastEdited.current === "A" && ethAmount) {
  //     setUsdtAmount((parseFloat(ethAmount) * price).toFixed(6));
  //   }
  //   if (lastEdited.current === "B" && usdtAmount) {
  //     setEthAmount((parseFloat(usdtAmount) / price).toFixed(6));
  //   }
  // }, [ethAmount, usdtAmount, tokenA, tokenB, pools]);

  // ─── Helpers ───────────────────────────────────────
  const parseTokenInput = (input) => {
    const val = input.trim();
    if (/^(native|xlm)$/i.test(val)) return sdk.Asset.native();
    const [code, issuer] = val.split(":");
    if (!code || !issuer || code.length > 12) throw new Error("MISSING_TOKENS");
    return new sdk.Asset(code, issuer);
  };
  const friendbotFund = async (pk) => {
    const resp = await fetch(`${FRIENDBOT_URL}${pk}`);
    if (!resp.ok && resp.status !== 400) throw new Error(resp.statusText);
  };

  // ─── Create pool ───────────────────────────────────
  const handleCreatePool = async () => {
    if (!server || !sdk || !issuerKeypair || !walletPublicKey) return;
    setLoading(true);
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Starting liquidity pool creation...");

    try {
      const { TransactionBuilder, BASE_FEE, Operation, LiquidityPoolAsset, getLiquidityPoolId } =
        sdk;
      await friendbotFund(walletPublicKey);

      // parse assets
      let assetObjA = parseTokenInput(tokenA);
      let assetObjB = parseTokenInput(tokenB);

      // re-fetch balances
      const balResp = await fetch(
        `https://diamtestnet.diamcircle.io/accounts/${walletPublicKey}`
      );
      const balances = (await balResp.json()).balances || [];
      const hasA = balances.some((b) =>
        assetObjA.isNative()
          ? b.asset_type === "native"
          : b.asset_code === assetObjA.getCode() && b.asset_issuer === assetObjA.getIssuer()
      );
      const hasB = balances.some((b) =>
        assetObjB.isNative()
          ? b.asset_type === "native"
          : b.asset_code === assetObjB.getCode() && b.asset_issuer === assetObjB.getIssuer()
      );
      if (!hasA || !hasB) {
        throw new Error("You must hold both assets to create a pool.");
      }

      // trustline B
      let tx1 = new TransactionBuilder(await server.loadAccount(walletPublicKey), {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.changeTrust({ asset: assetObjB }))
        .setTimeout(30)
        .build();
      await window.diam.sign(tx1.toXDR(), true, NETWORK_PASSPHRASE);
      await server.submitTransaction(tx1);

      // LP Asset
      const feeNum = parseFloat(selectedFeeTier) * 100;
      const lpAsset = new LiquidityPoolAsset(assetObjA, assetObjB, feeNum);
      lpAsset.type = "liquidity_pool_constant_product";
      lpAsset.assetType = "liquidity_pool_constant_product";
      const poolId = getLiquidityPoolId("constant_product", {
        assetA: assetObjA,
        assetB: assetObjB,
        fee: feeNum,
      })
        .toString("hex");
      lpAsset.liquidityPoolId = poolId;

      // trustline LP
      let tx2 = new TransactionBuilder(await server.loadAccount(walletPublicKey), {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.changeTrust({ asset: lpAsset }))
        .setTimeout(30)
        .build();
      await window.diam.sign(tx2.toXDR(), true, NETWORK_PASSPHRASE);
      await server.submitTransaction(tx2);

      // deposit
      let tx3 = new TransactionBuilder(await server.loadAccount(walletPublicKey), {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: new Uint8Array(Buffer.from(poolId, "hex")),
            maxAmountA: ethAmount || "0",
            maxAmountB: usdtAmount || "0",
            minPrice: FULL_MIN,
            maxPrice: FULL_MAX,
          })
        )
        .setTimeout(30)
        .build();
      await window.diam.sign(tx3.toXDR(), true, NETWORK_PASSPHRASE);
      await server.submitTransaction(tx3);

      setTransactionStatus("success");
      setTransactionMessage(`Pool created! ID: ${poolId}`);
      setTransactionHash(poolId);
    } catch (e) {
      setTransactionStatus("error");
      setTransactionMessage(e.message || e.toString());
      addLog("Creation error: " + e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────
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

        {step === 0 ? (
          <>
            {/* PAIR + FEE */}
            <Typography variant="h6" sx={{ mb: 1, color: "#fff" }}>
              Select pair
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
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Token B"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      sx: { color: "#fff" },
                    }}
                  />
                )}
              />
            </Stack>
            <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>
              Fee tier
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
              The % you will earn in fees
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                bgcolor: "#1a1a1a",
                mb: 3,
                borderRadius: 2,
                border: "1px solid #333",
              }}
            >
              <Typography variant="subtitle2" color="#fff">
                {selectedFeeTier}
              </Typography>
              <IconButton size="small" onClick={() => setIsExpanded((x) => !x)}>
                {isExpanded ? <FiChevronUp color="#fff" /> : <FiChevronDown color="#fff" />}
              </IconButton>
            </Box>
            {isExpanded && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {feeTiers.map((f) => (
                  <Grid item xs={6} key={f.tier}>
                    <Card
                      onClick={() => setSelectedFeeTier(f.tier)}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        borderRadius: 2,
                        border:
                          selectedFeeTier === f.tier ? "2px solid #00d4ff" : "1px solid #333",
                        bgcolor: selectedFeeTier === f.tier ? "#0d0d0d" : "#1a1a1a",
                      }}
                    >
                      <Typography color="#fff">{f.tier}</Typography>
                      <Typography variant="body2" color="#aaa">
                        {f.description}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            <CustomButton
              fullWidth
              variant="contained"
              disabled={!assetCode}
              onClick={() => setStep(1)}
            >
              Continue
            </CustomButton>
          </>
        ) : (
          <>
          {/* DEPOSIT */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton onClick={() => setStep(0)} sx={{ color: "#fff" }}>
              <FiArrowLeft />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1, color: "#fff" }}>
              Deposit tokens
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Specify the amounts of each token you’d like to deposit into the pool.
          </Typography>
        
          <Stack spacing={3}>
            {/* DIAM amount field */}
            <TextField
              variant="filled"
              label="DIAM Amount"
              placeholder="0.0"
              value={ethAmount}
              onChange={e => {
                lastEdited.current = "A";
                setEthAmount(e.target.value.replace(/[^0-9.]/g, ""));
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end">DIAM</InputAdornment>,
              }}
              sx={{
                bgcolor: "#1a1a1a",
                borderRadius: 1,
                "& .MuiFilledInput-root": { borderRadius: 4 },
              }}
            />
        
            {/* Token B amount field (code only, not full issuer) */}
            {tokenB && (
              <TextField
                variant="filled"
                label={`${tokenB.split(":")[0]} Amount`}
                placeholder="0.0"
                value={usdtAmount}
                onChange={e => {
                  lastEdited.current = "B";
                  setUsdtAmount(e.target.value.replace(/[^0-9.]/g, ""));
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {tokenB.split(":")[0]}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  bgcolor: "#1a1a1a",
                  borderRadius: 1,
                  "& .MuiFilledInput-root": { borderRadius: 4 },
                }}
              />
            )}
        
            {/* Create Pool button */}
            <Box textAlign="center" mt={2}>
              <CustomButton
                fullWidth
                variant="contained"
                disabled={!ethAmount || !usdtAmount}
                onClick={handleCreatePool}
              >
                {loading ? <CircularProgress size={24} /> : "Create Pool"}
              </CustomButton>
            </Box>
          </Stack>
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
