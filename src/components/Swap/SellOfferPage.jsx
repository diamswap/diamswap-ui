// src/components/SellOfferPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Asset,
  Aurora,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from "diamnet-sdk";
import {
  Container,
  Box,
  Typography,
  TextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Fade,
} from "@mui/material";
import { FaChevronDown } from "react-icons/fa";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { MdExpandMore } from "react-icons/md";

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const issuerKeypair = Keypair.random();

export default function SellOfferPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // state
  const [assetCodes, setAssetCodes] = useState([]);
  const [assetCode, setAssetCode] = useState("");
  const [balances, setBalances] = useState({ native: "0", custom: "0" });
  const [sellAmount, setSellAmount] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [txState, setTxState] = useState("");
  const [txMsg, setTxMsg] = useState("");
  const [txHash, setTxHash] = useState("");

  const walletKey = localStorage.getItem("diamPublicKey") || "";

  // custom asset object
  const customAsset = useMemo(
    () => (assetCode ? new Asset(assetCode, issuerKeypair.publicKey()) : null),
    [assetCode]
  );

  // fetch asset codes
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
            pools
              .flatMap((p) => p.reserves)
              .filter((r) => r.asset !== "native")
              .map((r) => r.asset.split(":")[0])
          )
        );
        setAssetCodes(codes);
        if (codes.length) setAssetCode(codes[0]);
      } catch (e) {
        console.error("Asset codes fetch error:", e);
      }
    })();
  }, []);

  // fetch pool price
  useEffect(() => {
    if (!assetCode) return setPrice("");
    (async () => {
      try {
        const resp = await fetch(
          "https://diamtestnet.diamcircle.io/liquidity_pools?limit=200"
        );
        const json = await resp.json();
        const pool = (json._embedded?.records || []).find(
          (p) =>
            p.reserves.some((r) => r.asset === "native") &&
            p.reserves.some((r) => r.asset.startsWith(assetCode + ":"))
        );
        if (!pool) return setPrice("");
        const diamRes = parseFloat(
          pool.reserves.find((r) => r.asset === "native").amount
        );
        const tokRes = parseFloat(
          pool.reserves.find((r) => r.asset.startsWith(assetCode + ":")).amount
        );
        setPrice((tokRes / diamRes).toFixed(6));
      } catch {
        setPrice("");
      }
    })();
  }, [assetCode]);

  // fetch balances
  const refreshBalances = useCallback(async () => {
    if (!walletKey) return;
    try {
      const acct = await server.loadAccount(walletKey);
      const nativeBal =
        acct.balances.find((b) => b.asset_type === "native")?.balance || "0";
      const customBal =
        assetCode === ""
          ? "0"
          : acct.balances.find((b) => b.asset_code === assetCode)?.balance || "0";
      setBalances({ native: nativeBal, custom: customBal });
    } catch {
      console.warn("Failed to load balances");
    }
  }, [walletKey, assetCode]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  const nativeBalance = useMemo(() => parseFloat(balances.native), [balances]);

  // projected receive in custom asset
  const projectedReceive = useMemo(() => {
    const amt = parseFloat(sellAmount) || 0;
    const pr = parseFloat(price) || 0;
    return (amt * pr).toFixed(4);
  }, [sellAmount, price]);

  // helpers
  const friendbotFund = async (pk) => {
    const r = await fetch(`${friendbotUrl}${pk}`);
    if (!r.ok && r.status !== 400) throw new Error(r.statusText);
  };

  const establishTrust = async () => {
    const acct = await server.loadAccount(walletKey);
    const tx = new TransactionBuilder(acct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(Operation.changeTrust({ asset: customAsset, limit: "1000000" }))
      .setTimeout(30)
      .build();
    await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
    await server.submitTransaction(tx);
  };

  const createPassive = async () => {
    const acct = await server.loadAccount(walletKey);
    const tx = new TransactionBuilder(acct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.createPassiveSellOffer({
          selling: Asset.native(),
          buying: customAsset,
          amount: sellAmount,
          price,
        })
      )
      .setTimeout(30)
      .build();
    const res = await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
    return res.hash || res.message?.data?.hash;
  };

  // full flow without minting
  const handleSubmit = async () => {
    setLoading(true);
    setModalOpen(true);
    setTxState("pending");
    try {
      setTxMsg("Funding issuer...");
      await friendbotFund(issuerKeypair.publicKey());
      setTxMsg("Funding your DIAM...");
      await friendbotFund(walletKey);
      setTxMsg("Establishing trustline...");
      await establishTrust();
      setTxMsg("Creating passive sell offer...");
      const h = await createPassive();
      setTxHash(h);
      setTxState("success");
      setTxMsg("Passive sell offer created!");
    } catch (e) {
      setTxState("error");
      setTxMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    walletKey && sellAmount && price && parseFloat(sellAmount) <= nativeBalance;

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Accordion sx={{ mb: 2, bgcolor: "rgba(0,206,229,0.06)" }}>
        <AccordionSummary expandIcon={<MdExpandMore />}>
          <Typography variant="subtitle1">What is Passive Sell Offer?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Create a non-crossing sell order to swap DIAM for another asset at the current rate.
          </Typography>
          <Typography variant="body2">
            DIAM will be locked until matched or cancelled.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Fade in>
        <Box sx={{ p: 4, bgcolor: "rgba(0,206,229,0.06)", borderRadius: 2, border: "1px solid #FFFFFF4D" }}>
          <Typography variant="h5" align="center" gutterBottom>
            Sell Offer (DIAM → {assetCode || "Token"})
          </Typography>

          <Stack direction={isMobile ? "column" : "row"} spacing={2} sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Your DIAM balance:</strong> {balances.native}
            </Typography>
         
          </Stack>

          <Alert severity="info" sx={{ mb: 3 }}>
            Passive sell offers lock DIAM at a set price until execution or cancellation.
          </Alert>

          <TextField
            label="Sell Amount"
            placeholder="e.g., 50"
            helperText="Amount of DIAM to sell"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">DIAM</InputAdornment>,
              sx: { color: "#fff", "& fieldset": { borderColor: "#FFFFFF4D" } },
            }}
          />

          <Autocomplete
            options={assetCodes}
            value={assetCode}
            onChange={(_, v) => setAssetCode(v || "")}
            fullWidth
            disableClearable
            popupIcon={<FaChevronDown style={{ color: "#fff" }} />}
            sx={{ mb: 2 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Asset"
                helperText="Token you will receive"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  sx: { color: "#fff", "& fieldset": { borderColor: "#FFFFFF4D" } },
                }}
              />
            )}
          />

          <Tooltip title="Live pool rate">
            <TextField
              label="Pool Price"
              value={price}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">1 DIAM =</InputAdornment>,
                endAdornment: <InputAdornment position="end">{assetCode}</InputAdornment>,
                sx: { color: "#fff", "& fieldset": { borderColor: "#FFFFFF4D" } },
              }}
              helperText="Tokens per DIAM"
              FormHelperTextProps={{ sx: { color: "#aaa" } }}
              fullWidth
              sx={{ mb: 3 }}
            />
          </Tooltip>

          {sellAmount && price && (
            <Typography variant="body2" sx={{ mb: 3 }}>
              You will receive approximately: <strong>{projectedReceive} {assetCode}</strong>
              {parseFloat(sellAmount) > nativeBalance && (
                <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                  Insufficient DIAM balance
                </Typography>
              )}
            </Typography>
          )}

          <CustomButton
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Create Passive Sell Offer"}
          </CustomButton>
        </Box>
      </Fade>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={txState}
        message={txMsg}
        transactionHash={txHash}
      />
    </Container>
  );
}
