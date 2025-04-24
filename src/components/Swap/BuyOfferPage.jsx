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

// extractTokenCode unchanged
const extractTokenCode = (a) => (a === "native" ? "DIAM" : a.split(":")[0]);

// find the best pool for a pair (unchanged)
const getPoolForPair = (from, to, pools) => {
  const candidates = pools.filter((p) => {
    const fr = p.reserves.find((r) => extractTokenCode(r.asset) === from);
    const tr = p.reserves.find((r) => extractTokenCode(r.asset) === to);
    return fr && tr && parseFloat(fr.amount) > 0 && parseFloat(tr.amount) > 0;
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const [aFr, aTr] = [
      parseFloat(
        a.reserves.find((r) => extractTokenCode(r.asset) === from).amount
      ),
      parseFloat(
        a.reserves.find((r) => extractTokenCode(r.asset) === to).amount
      ),
    ];
    const [bFr, bTr] = [
      parseFloat(
        b.reserves.find((r) => extractTokenCode(r.asset) === from).amount
      ),
      parseFloat(
        b.reserves.find((r) => extractTokenCode(r.asset) === to).amount
      ),
    ];
    return bFr * bTr - aFr * aTr;
  });
  return candidates[0];
};

function OpenOffers({ offers, onRefresh, loading }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          Your open buy offers
        </Typography>
        <IconButton size="small" onClick={onRefresh} disabled={loading}>
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
              <TableCell sx={{ color: "#A0A0A0" }}>Amount (wanted)</TableCell>
              <TableCell sx={{ color: "#A0A0A0" }}>Filled</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((o) => {
              const wanted = o.buy_amount ?? "—";
              const filled =
                o.original_amount != null && o.amount != null
                  ? (
                      parseFloat(o.original_amount) - parseFloat(o.amount)
                    ).toFixed(7)
                  : "—";
              return (
                <TableRow key={o.id}>
                  <TableCell>
                    {o.price_r.n}/{o.price_r.d}
                  </TableCell>
                  <TableCell>{wanted}</TableCell>
                  <TableCell>{filled}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

export default function BuyOfferPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

  const [pools, setPools] = useState([]);
  const [offers, setOffers] = useState([]);
  const [offersBusy, setOffersBusy] = useState(false);

  const walletPublicKey = localStorage.getItem("diamPublicKey") || "";

  // fetch pools → assetCodes
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          "https://diamtestnet.diamcircle.io/liquidity_pools?limit=200"
        );
        const json = await resp.json();
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
        setAssetCodes(["DIAM", ...codes]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // live‐price effect: guard against missing reserves
  useEffect(() => {
    if (!pools.length) return;
    const pool = getPoolForPair("DIAM", assetCode, pools);
    if (!pool || !pool.reserves) {
      setPrice("");
      return;
    }
    const nativeReserve = pool.reserves.find((r) => r.asset === "native");
    const customReserve = pool.reserves.find(
      (r) => extractTokenCode(r.asset) === assetCode
    );
    if (!nativeReserve || !customReserve) {
      setPrice("");
      return;
    }
    const nativeAmt = parseFloat(nativeReserve.amount);
    const customAmt = parseFloat(customReserve.amount);
    setPrice((nativeAmt / customAmt).toFixed(6));
  }, [pools, assetCode]);

  // refresh balances
  const refreshBalances = useCallback(async () => {
    if (!walletPublicKey) return;
    try {
      const acct = await server.loadAccount(walletPublicKey);
      const nativeBal =
        acct.balances.find((b) => b.asset_type === "native")?.balance || "0";
      const customBal =
        assetCode === "DIAM"
          ? "0"
          : acct.balances.find((b) => b.asset_code === assetCode)
              ?.balance || "0";
      setBalances({ native: nativeBal, custom: customBal });
    } catch (err) {
      console.error(err);
    }
  }, [walletPublicKey, assetCode]);

  // refresh your open buy offers
  const refreshOffers = useCallback(async () => {
    if (!walletPublicKey) return;
    setOffersBusy(true);
    try {
      const res = await server.offers().forAccount(walletPublicKey).limit(50).call();
      setOffers(
        res.records.filter(
          (o) =>
            o.buying.asset_code === assetCode &&
            o.selling.asset_type === "native"
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setOffersBusy(false);
    }
  }, [walletPublicKey, assetCode]);

  useEffect(() => {
    refreshBalances();
    refreshOffers();
  }, [refreshBalances, refreshOffers]);

  // friendbot helpers, trustline, issue, and createBuyOffer unchanged...
  const friendbotFund = async (pk) => { /* … */ };
  const fundIssuerIfNeeded = () => friendbotFund(issuerKeypair.publicKey());
  const fundUserIfNeeded = () => friendbotFund(walletPublicKey);
  const customAsset =
    assetCode === "DIAM"
      ? Asset.native()
      : new Asset(assetCode, issuerKeypair.publicKey());
  const establishUserTrustline = async () => { /* … */ };
  const issueAssetToUser = async () => { /* … */ };
  const createBuyOffer = async () => { /* … */ };

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

  // ──────────────────────────────────────────────────────────────────────
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

        <Alert severity="info" sx={{ mb: 2 }}>
          Placing a <strong>buy offer</strong> locks DIAM in the order-book.
          Your balance won’t change until someone matches the order or you
          cancel it.
        </Alert>

        <Autocomplete
          options={assetCodes}
          value={assetCode}
          onChange={(_, v) => setAssetCode(v || "DIAM")}
          fullWidth
          disableClearable
          popupIcon={<FaChevronDown style={{ color: "#fff" }} />}
          sx={{ mb: 2, input: { color: "#fff" } }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Token"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                sx: { color: "#fff", border: "1px solid gray", borderRadius: 1 },
              }}
            />
          )}
        />

        <TextField
          label={`Buy Amount (${assetCode})`}
          value={buyAmount}
          onChange={(e) => setBuyAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          fullWidth
          variant="outlined"
          sx={{ mb: 2, input: { color: "#fff" } }}
        />

        <TextField
          label="Price"
          placeholder="0.1"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
          fullWidth
          variant="outlined"
          sx={{ mb: 3, input: { color: "#fff" } }}
        />

        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleBuyFlow}
          disabled={loading || !walletPublicKey}
        >
          {loading ? <CircularProgress size={24} /> : "Submit Buy Offer"}
        </CustomButton>

        {/* show your open offers */}
        <OpenOffers
          offers={offers}
          onRefresh={refreshOffers}
          loading={offersBusy}
        />
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
