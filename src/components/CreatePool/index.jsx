
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
import CustomButton from "../../comman/CustomButton";
import { Buffer } from "buffer";
import TransactionModal from "../../comman/TransactionModal";
import { FaChevronDown } from "react-icons/fa";

if (!window.Buffer) {
  window.Buffer = Buffer;
}

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const FRIENDBOT_URL = "https://friendbot.diamcircle.io?addr=";

const feeTiers = [
  {
    tier: "0.3%",
    description: "Standard fee (0.3%)",
    tvl: "Medium TVL",
    select: "Select",
  },
  {
    tier: "1%",
    description: "High fee (1%)",
    tvl: "High TVL",
    select: "Select",
  },
];

const CreatePoolPage = () => {
  // UI state
  const [step, setStep] = useState(0);
  const [tokenA, setTokenA] = useState("native");
  const [tokenB, setTokenB] = useState("");
  const [assetCodes, setAssetCodes] = useState([]);
  const [assetCode, setAssetCode] = useState("");
  const [selectedFeeTier, setSelectedFeeTier] = useState("0.3%");
  const [isExpanded, setIsExpanded] = useState(false);
  const [ethAmount, setEthAmount] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [poolDetails, setPoolDetails] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  const walletPublicKey = localStorage.getItem("diamPublicKey") || "";
  if (!walletPublicKey) console.warn("No wallet public key found.");

  const [sdk, setSdk] = useState(null);
  const [server, setServer] = useState(null);
  const [issuerKeypair, setIssuerKeypair] = useState(null);

  const addLog = (msg) => {
    console.log(msg);
    setLogs((prev) => [...prev, msg]);
  };

  useEffect(() => {
    (async () => {
      try {
        const DiamSdkModule = await import("diamnet-sdk");
        const diamnetSdk = DiamSdkModule.default || DiamSdkModule;
        setSdk(diamnetSdk);
        setServer(
          new diamnetSdk.Aurora.Server("https://diamtestnet.diamcircle.io/")
        );
        const issuer = diamnetSdk.Keypair.random();
        setIssuerKeypair(issuer);
        addLog("SDK loaded. Issuer: " + issuer.publicKey());
      } catch (e) {
        addLog("SDK load error: " + e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          "https://diamtestnet.diamcircle.io/liquidity_pools?limit=200"
        );
        const json = await resp.json();
        const pools = json._embedded?.records || json.records || [];
        const codes = Array.from(
          new Set(
            pools.flatMap((p) =>
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

  useEffect(() => {
    if (sdk && issuerKeypair && assetCode) {
      const customAsset = new sdk.Asset(assetCode, issuerKeypair.publicKey());
      setTokenB(`${customAsset.getCode()}:${customAsset.getIssuer()}`);
      addLog("Token B auto-filled: " + customAsset.getCode());
    }
  }, [sdk, issuerKeypair, assetCode]);

  const handleToggleExpand = () => setIsExpanded((x) => !x);

  const parseTokenInput = (input) => {
    const val = input.trim().toLowerCase();
    if (val === "native" || val === "xlm") return sdk.Asset.native();
    const [code, issuer] = input.split(":");
    return new sdk.Asset(code, issuer);
  };

  const friendbotFund = async (pk) => {
    try {
      const resp = await fetch(FRIENDBOT_URL + pk);
      if (resp.ok) addLog("Funded: " + pk);
      else {
        const err = await resp.text();
        addLog("Fund error: " + err);
      }
    } catch (e) {
      addLog("Friendbot error: " + e);
    }
  };

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

      // fund accounts
      await friendbotFund(issuerKeypair.publicKey());
      await friendbotFund(walletPublicKey);

      // parse assets
      const assetA = parseTokenInput(tokenA);
      const assetB = new sdk.Asset(assetCode, issuerKeypair.publicKey());

      // trustline assetB
      let userAcc = await server.loadAccount(walletPublicKey);
      let trustTx = new TransactionBuilder(userAcc, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.changeTrust({ asset: assetB }))
        .setTimeout(30)
        .build();
      await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
      await server.submitTransaction(trustTx);

      // issue assetB
      let issAcc = await server.loadAccount(issuerKeypair.publicKey());
      let payTx = new TransactionBuilder(issAcc, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination: walletPublicKey,
            asset: assetB,
            amount: "100",
          })
        )
        .setTimeout(30)
        .build();
      payTx.sign(issuerKeypair);
      await server.submitTransaction(payTx);

      // LP asset
      const feeNum = parseFloat(selectedFeeTier) * 100;
      const lpAsset = new LiquidityPoolAsset(assetA, assetB, feeNum);
      lpAsset.type = "liquidity_pool_constant_product";
      lpAsset.assetType = "liquidity_pool_constant_product";
      let poolId;
      try {
        poolId = getLiquidityPoolId("constant_product", {
          assetA,
          assetB,
          fee: feeNum,
        }).toString("hex");
        lpAsset.liquidityPoolId = poolId;
      } catch (e) {
        addLog("getLiquidityPoolId error: " + e);
        poolId = "N/A";
      }

      // trustline LP
      userAcc = await server.loadAccount(walletPublicKey);
      let lpTrust = new TransactionBuilder(userAcc, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.changeTrust({ asset: lpAsset }))
        .setTimeout(30)
        .build();
      await window.diam.sign(lpTrust.toXDR(), true, NETWORK_PASSPHRASE);
      await server.submitTransaction(lpTrust);

      // deposit
      userAcc = await server.loadAccount(walletPublicKey);
      let depositTx = new TransactionBuilder(userAcc, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: new Uint8Array(Buffer.from(poolId, "hex")),
            maxAmountA: ethAmount || "10",
            maxAmountB: usdtAmount || "20",
            minPrice: { n: 1, d: 2 },
            maxPrice: { n: 2, d: 1 },
          })
        )
        .setTimeout(30)
        .build();
      await window.diam.sign(depositTx.toXDR(), true, NETWORK_PASSPHRASE);
      await server.submitTransaction(depositTx);

      setPoolDetails({ lpAsset, liquidityPoolId: poolId });
      setTransactionStatus("success");
      setTransactionMessage(`Pool created! ID: ${poolId}`);
      setTransactionHash(poolId);
    } catch (e) {
      setTransactionStatus("error");
      setTransactionMessage(e.toString());
      addLog("Error creating pool: " + e);
    }
    setLoading(false);
  };

  const PairFeePanel = (
    <>
      {/* SELECT PAIR */}
      <Typography variant="h6" sx={{ mb: 1, color: "#fff" }}>
        Select pair
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
        Choose the tokens you want to provide liquidity for. You can select tokens on all supported networks.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Token A"
          value={tokenA}
          onChange={e => setTokenA(e.target.value)}
          variant="outlined"
          InputLabelProps={{ sx: { color: "#888" } }}
          InputProps={{
            sx: {
              bgcolor: "#1a1a1a",
              borderRadius: 2,
              color: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#333" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00d4ff" },
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
                    popupIcon={<FiChevronDown style={{color:"white", fontSize:"20px"}} /> }
          fullWidth
          sx={{
            "& .MuiInputBase-root": {
              bgcolor: "#1a1a1a",
              borderRadius: 2,
              color: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#333" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00d4ff" },
            },
            input: { color: "#fff" } 
          }}
          renderInput={params => (
            <TextField
              {...params}
              label="Select Token"
              variant="outlined"
              InputProps={{ ...params.InputProps, sx: { color: "#fff" } }}
            />
          )}
        />
      </Stack>
  
      {/* FEE TIER */}
      <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>
        Fee tier
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
        The amount earned providing liquidity. Choose an amount that suits your risk tolerance and strategy.
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
          {isExpanded ? (
            <FiChevronUp color="#fff" />
          ) : (
            <FiChevronDown color="#fff" />
          )}
        </IconButton>
      </Box>
      {isExpanded && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {feeTiers.map(fee => (
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
                <Typography
                  variant="body2"
                  color="#aaa"
                  sx={{ mt: 1 }}
                >
                  {fee.description}
                </Typography>
                <Typography
                  variant="caption"
                  color="#aaa"
                  sx={{ display: "block", mt: 1 }}
                >
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
      <CustomButton
        fullWidth
        variant="contained"
       
        disabled={!assetCode}
        onClick={() => setStep(1)}
      >
        Continue
      </CustomButton>
    </>
  );
  

  const DepositPanel = (
    <>
      <IconButton onClick={() => setStep(0)} sx={{ mb: 2 }}>
        <FiArrowLeft color="#fff" />
      </IconButton>
      <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>
        Deposit tokens
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "#b3b3b3" }}>
        Specify the token amounts for your liquidity contribution.
      </Typography>

      {/* ETH Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          sx={{ mb: 1, border: "1px solid gray", borderRadius: 2 }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            ${(parseFloat(ethAmount) * 0).toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            0 XLM Max
          </Typography>
        </Box>
      </Box>
      {/* USDT Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          value={usdtAmount}
          onChange={(e) => setUsdtAmount(e.target.value)}
          sx={{ mb: 1, border: "1px solid gray", borderRadius: 2 }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            ${usdtAmount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            0 {assetCode.toUpperCase()} Max
          </Typography>
        </Box>
      </Box>
      <CustomButton
        fullWidth
        variant="contained"
        disabled={!ethAmount || !usdtAmount}
        onClick={handleCreatePool}
      >
        {loading ? <CircularProgress size={24} /> : "Create Pool"}
      </CustomButton>
    </>
  );

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
        {step === 0 ? PairFeePanel : DepositPanel}
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
};

export default CreatePoolPage;
