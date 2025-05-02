// src/components/BuyOfferPage.jsx
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
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Fade,
} from "@mui/material";
import { FaChevronDown, FaSyncAlt } from "react-icons/fa";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { MdExpandMore } from "react-icons/md";

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const issuerKeypair = Keypair.random();
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";


export default function BuyOfferPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // state
  const [assetCodes, setAssetCodes] = useState([]);
  const [assetCode, setAssetCode] = useState("DIAM");
  const [balances, setBalances] = useState({ native: "0", custom: "0" });
  const [buyAmount, setBuyAmount] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [offers, setOffers] = useState([]);
  const [offersBusy, setOffersBusy] = useState(false);

  const walletPublicKey = localStorage.getItem("diamPublicKey") || "";
  const nativeBalance = useMemo(() => parseFloat(balances.native), [balances]);

  // calculate projected DIAM cost
  const projectedCost = useMemo(() => {
    const amt = parseFloat(buyAmount) || 0;
    const pr = parseFloat(price) || 0;
    return (amt * pr).toFixed(4);
  }, [buyAmount, price]);

  // dynamic asset
  const customAsset =
    assetCode === "DIAM"
      ? Asset.native()
      : new Asset(assetCode, issuerKeypair.publicKey());

  // fetch balances
  const refreshBalances = useCallback(async () => {
    if (!walletPublicKey) return;
    try {
      const account = await server.loadAccount(walletPublicKey);
      const nativeBal =
        account.balances.find((b) => b.asset_type === "native")?.balance || "0";
      const customBal =
        assetCode === "DIAM"
          ? "0"
          : account.balances.find((b) => b.asset_code === assetCode)?.balance ||
            "0";
      setBalances({ native: nativeBal, custom: customBal });
    } catch (err) {
      console.error("Error fetching balances:", err);
    }
  }, [walletPublicKey, assetCode]);

  // fetch offers
  const refreshOffers = useCallback(async () => {
    if (!walletPublicKey) return;
    setOffersBusy(true);
    try {
      const res = await server
        .offers()
        .forAccount(walletPublicKey)
        .limit(50)
        .call();
      setOffers(
        res.records.filter(
          (o) =>
            o.buying.asset_code === assetCode &&
            o.selling.asset_type === "native"
        )
      );
    } catch (e) {
      console.error("Error loading offers:", e);
    } finally {
      setOffersBusy(false);
    }
  }, [walletPublicKey, assetCode]);

  // initial load asset codes
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
                .filter((rs) => rs.asset !== "native")
                .map((rs) => rs.asset.split(":")[0])
            )
          )
        );
        setAssetCodes(["DIAM", ...codes]);
      } catch (err) {
        console.error("Error fetching asset codes:", err);
      }
    })();
  }, []);

  // refresh on dependency change
  useEffect(() => {
    refreshBalances();
    refreshOffers();
  }, [refreshBalances, refreshOffers]);

  // friendbot utils
  const friendbotFund = async (pk) => {
    const r = await fetch(`${friendbotUrl}${pk}`);
    if (!r.ok) {
      const err = await r.json();
      if (r.status === 400 && err.detail?.includes("createAccountAlreadyExist"))
        return;
      throw new Error(err.detail || r.statusText);
    }
  };
  const fundIssuerIfNeeded = () => friendbotFund(issuerKeypair.publicKey());
  const fundUserIfNeeded = () => friendbotFund(walletPublicKey);

  // trustline
  const establishUserTrustline = async () => {
    if (assetCode === "DIAM") return;
    const acct = await server.loadAccount(walletPublicKey);
    const tx = new TransactionBuilder(acct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.changeTrust({ asset: customAsset, limit: "1000000" })
      )
      .setTimeout(30)
      .build();
    await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
  };

  // create buy offer
  const createBuyOffer = async () => {
    if (!buyAmount || !price) throw new Error("Enter amount & price");
    const acct = await server.loadAccount(walletPublicKey);
    const tx = new TransactionBuilder(acct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.manageBuyOffer({
          selling: Asset.native(),
          buying: customAsset,
          buyAmount,
          price,
          offerId: "0",
        })
      )
      .setTimeout(30)
      .build();
    const res = await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
    return res.hash || res.message?.data?.hash;
  };

  // full flow (no minting)
  const handleBuyFlow = async () => {
    setLoading(true);
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Submitting…");
    try {
      await fundIssuerIfNeeded();
      await fundUserIfNeeded();
      await establishUserTrustline();
      const hash = await createBuyOffer();
      setTransactionStatus("success");
      setTransactionMessage("Offer submitted!");
      setTransactionHash(hash);
      await refreshBalances();
      await refreshOffers();
    } catch (err) {
      setTransactionStatus("error");
      setTransactionMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // validation state
  const canSubmit =
    walletPublicKey &&
    buyAmount &&
    price &&
    parseFloat(projectedCost) <= nativeBalance;

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      {/* Explanation Accordion */}
      <Accordion sx={{ mb: 2, bgcolor: "rgba(0,206,229,0.06)" }}>
        <AccordionSummary expandIcon={<MdExpandMore />}>
          <Typography variant="subtitle1">What are Manage Offers?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Manage offer operations let you buy or sell assets at your specified
            rate.
          </Typography>
          <ul>
            <li>
              <strong>Buy Offer</strong>: Lock DIAM to purchase another asset.
            </li>
            <li>
              <strong>Sell Offer</strong>: Offer your asset for DIAM or another
              asset.
            </li>
            <li>
              <strong>Passive Sell Offer</strong>: Place a non-crossing sell
              order.
            </li>
          </ul>
          <Typography variant="body2">
            Fill out the form below and see a live estimate of DIAM locked.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Fade in>
        <Box
          sx={{
            p: 4,
            bgcolor: "rgba(0,206,229,0.06)",
            borderRadius: 2,
            border: "1px solid #FFFFFF4D",
          }}
        >
          <Typography variant="h5" align="center" gutterBottom>
            Buy Offer (DIAM → {assetCode})
          </Typography>

          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              <strong>Your DIAM balance:</strong> {balances.native}
            </Typography>
          
          </Stack>

          <Alert severity="info" sx={{ mb: 3 }}>
            Placing a <strong>buy offer</strong> locks your DIAM until someone
            matches or you cancel.
          </Alert>

          <Autocomplete
            options={assetCodes}
            value={assetCode}
            onChange={(_, v) => setAssetCode(v || "DIAM")}
            fullWidth
            disableClearable
            popupIcon={
              <FaChevronDown fontSize={18} style={{ color: "#fff" }} />
            }
            sx={{ mb: 2 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Token"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    color: "#fff",
                    border: "1px solid gray",
                    borderRadius: 1,
                  },
                }}
              />
            )}
          />

          <Tooltip title="Amount of asset you wish to acquire">
            <TextField
              label="Amount to Buy"
              placeholder="e.g., 100"
              helperText="Enter the exact quantity you wish to purchase"
              value={buyAmount}
              onChange={(e) =>
                setBuyAmount(e.target.value.replace(/[^0-9.]/g, ""))
              }
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{assetCode}</InputAdornment>
                ),
                sx: {
                  color: "#fff",
                  border: "1px solid gray",
                  borderRadius: 1,
                },
              }}
            />
          </Tooltip>

          <Tooltip title="Rate in DIAM per asset unit">
            <TextField
              label="Price"
              placeholder={`Price in DIAM per ${assetCode}`}
              helperText="DIAM per unit of chosen asset"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">DIAM/</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">{assetCode}</InputAdornment>
                ),
                sx: {
                  color: "#fff",
                  border: "1px solid gray",
                  borderRadius: 1,
                },
              }}
            />
          </Tooltip>

          {buyAmount && price && (
            <Typography variant="body2" sx={{ mb: 3 }}>
              Projected lock: <strong>{projectedCost} DIAM</strong>
              {parseFloat(projectedCost) > nativeBalance && (
                <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                  Insufficient DIAM balance
                </Typography>
              )}
            </Typography>
          )}

          <CustomButton
            variant="contained"
            fullWidth
            onClick={handleBuyFlow}
            disabled={!canSubmit || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Submit Buy Offer"}
          </CustomButton>
        </Box>
      </Fade>


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
