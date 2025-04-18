// src/components/BuyOfferPage.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link,
  IconButton,
} from "@mui/material";
import { FaChevronDown, FaSyncAlt } from "react-icons/fa";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const issuerKeypair = Keypair.random();
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";

/* --------------------------------- */
/* Helper = tiny open‑offers table    */
/* --------------------------------- */
const OpenOffers = ({ offers, onRefresh, loading }) => (
  <Box sx={{ mt: 3 }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
        Your open buy offers
      </Typography>
      <IconButton
        size="small"
        onClick={onRefresh}
        disabled={loading}
        title="Refresh offers"
      >
        <FaSyncAlt size={14} />
      </IconButton>
    </Stack>

    {offers.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        None
      </Typography>
    ) : (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "#A0A0A0" }}>Price</TableCell>
            <TableCell sx={{ color: "#A0A0A0" }}>
              Amount&nbsp;(wanted)
            </TableCell>
            <TableCell sx={{ color: "#A0A0A0" }}>Filled</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {offers.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                {o.price_r.n}/{o.price_r.d}
              </TableCell>
              <TableCell>{o.amount}</TableCell>
              <TableCell>
                {(parseFloat(o.original_amount) - parseFloat(o.amount)).toFixed(
                  7
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Box>
);

const BuyOfferPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* ---------------- state ---------------- */
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

  /* -------------- helpers --------------- */
  const customAsset =
    assetCode === "DIAM"
      ? Asset.native()
      : new Asset(assetCode, issuerKeypair.publicKey());

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

  /* --------------- effects -------------- */
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

  useEffect(() => {
    refreshBalances();
    refreshOffers();
  }, [refreshBalances, refreshOffers]);

  /* ---------- friendbot utils ----------- */
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

  /* ---------- trust‑line & issue -------- */
  const establishUserTrustline = async () => {
    if (assetCode === "DIAM") return;

    const acct = await server.loadAccount(walletPublicKey);
    const tx = new TransactionBuilder(acct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.changeTrust({
          asset: customAsset,
          limit: "1000000",
        })
      )
      .setTimeout(30)
      .build();

    await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
  };

  const issueAssetToUser = async () => {
    if (assetCode === "DIAM") return;

    const issuerAcct = await server.loadAccount(issuerKeypair.publicKey());
    const tx = new TransactionBuilder(issuerAcct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: walletPublicKey,
          asset: customAsset,
          amount: "1000",
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(issuerKeypair);
    await server.submitTransaction(tx);
  };

  /* -------------- place offer ----------- */
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

  /* -------------- full flow ------------- */
  const handleBuyFlow = async () => {
    setLoading(true);
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Submitting…");

    try {
      await fundIssuerIfNeeded();
      await fundUserIfNeeded();
      await establishUserTrustline();
      await issueAssetToUser();
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

  /* ================= UI ================= */
  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
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
        <br />
        {/* ----------- explanation banner ----------- */}
        <Alert severity="info" sx={{ mb: 2 }}>
          Placing a <strong>buy offer</strong> locks DIAM in the order‑book.
          Your balance won’t change until someone matches the order or you
          cancel it.
        </Alert>
        <br />

        <Autocomplete
          options={assetCodes}
          value={assetCode}
          onChange={(_, v) => setAssetCode(v || "DIAM")}
          fullWidth
          disableClearable
          popupIcon={<FaChevronDown style={{color:"white"}} fontSize={18} />}
          sx={{ mb: 2, input: { color: "#fff",  } }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Token"
              variant="outlined"
              InputProps={{ ...params.InputProps, sx: { color: "#fff", border:"1px solid gray",borderRadius:"8px" } ,  }}
            />
          )}
        />

        <TextField
          label={`Buy Amount (${assetCode})`}
          value={buyAmount}
          onChange={(e) => setBuyAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          fullWidth
          variant="outlined"
          sx={{ mb: 2, input: { color: "#fff" , border:"1px solid gray",borderRadius:"8px"} }}
        />

        <TextField
          label="Price"
          placeholder="0.1"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
          fullWidth
          variant="outlined"
          sx={{ mb: 3, input: { color: "#fff", border:"1px solid gray",borderRadius:"8px" } }}
        />

        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleBuyFlow}
          disabled={loading || !walletPublicKey}
        >
          {loading ? <CircularProgress size={24} /> : "Submit Buy Offer"}
        </CustomButton>
      </Box>

      {/* ------------- modal ------------- */}
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

export default BuyOfferPage;
