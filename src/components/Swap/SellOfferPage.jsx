// src/components/SellOfferPage.jsx
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { FaChevronDown } from "react-icons/fa6";

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const issuerKeypair = Keypair.random();

export default function SellOfferPage() {
  // State
  const [sellAmount, setSellAmount] = useState("");
  const [assetCodes, setAssetCodes] = useState([]);
  const [assetCode, setAssetCode] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [txState, setTxState] = useState("");
  const [txMsg, setTxMsg] = useState("");
  const [txHash, setTxHash] = useState("");

  const walletKey = localStorage.getItem("diamPublicKey") || "";

  // Build the Asset object for the token
  const customAsset = assetCode
    ? new Asset(assetCode, issuerKeypair.publicKey())
    : null;

  // Fetch all non-native codes from existing pools
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

  // Whenever you pick a token, pull its current pool ratio to native
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
          pool.reserves.find((r) =>
            r.asset.startsWith(assetCode + ":")
          ).amount
        );
        setPrice((tokRes / diamRes).toFixed(6));
      } catch (e) {
        console.warn("Live price fetch failed:", e);
        setPrice("");
      }
    })();
  }, [assetCode]);

  // helper: fund an account via friendbot
  const friendbotFund = async (pk) => {
    const r = await fetch(`${friendbotUrl}${pk}`);
    if (!r.ok && r.status !== 400) throw new Error(r.statusText);
  };

  // helper: create trustline for the newly minted token
  const establishTrust = async () => {
    if (!walletKey) throw new Error("Connect your DIAM wallet first");
    const acct = await server.loadAccount(walletKey);
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
    await server.submitTransaction(tx);
  };

  // helper: mint some of the token to the user's account
  const mintToUser = async () => {
    const issAcct = await server.loadAccount(issuerKeypair.publicKey());
    const tx = new TransactionBuilder(issAcct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: walletKey,
          asset: customAsset,
          amount: "1000",
        })
      )
      .setTimeout(30)
      .build();
    tx.sign(issuerKeypair);
    await server.submitTransaction(tx);
  };

  // **NEW**: create a *passive* sell offer
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
          price: price,
        })
      )
      .setTimeout(30)
      .build();
    const res = await window.diam.sign(tx.toXDR(), true, NETWORK_PASSPHRASE);
    return res.hash || res.message?.data?.hash || null;
  };

  // full flow
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setModalOpen(true);
      setTxState("pending");
      setTxMsg("Funding issuer...");
      await friendbotFund(issuerKeypair.publicKey());
      setTxMsg("Funding your wallet...");
      await friendbotFund(walletKey);
      setTxMsg("Establishing trustline...");
      await establishTrust();
      setTxMsg("Minting tokens to you...");
      await mintToUser();
      setTxMsg("Creating passive sell offer...");
      const h = await createPassive();
      setTxHash(h);
      setTxState("success");
      setTxMsg("Passive sell offer created!");
    } catch (e) {
      console.error(e);
      setTxState("error");
      setTxMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Box
        sx={{
          backgroundColor: "rgba(0,206,229,0.06)",
          m: "2rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          p: "2rem",
          color: "#FFFFFF",
          position: "relative",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Create Passive Sell Offer
        </Typography>

        <TextField
          label="Sell Amount (DIAM)"
          value={sellAmount}
          onChange={(e) =>
            setSellAmount(e.target.value.replace(/[^0-9.]/g, ""))
          }
          fullWidth
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              "& fieldset": { borderColor: "#FFFFFF4D" },
            },
          }}
        />

        <Autocomplete
          options={assetCodes}
          value={assetCode}
          onChange={(_, v) => setAssetCode(v || "")}
          fullWidth
          disableClearable
          popupIcon={<FaChevronDown style={{ color: "#fff", fontSize: 20 }} />}
          sx={{ mb: 2 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Asset"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": { borderColor: "#FFFFFF4D" },
                },
              }}
            />
          )}
        />

        <TextField
          label={`Price (${assetCode}/DIAM)`}
          value={price}
          InputProps={{
            readOnly: true,
            sx: {
              color: "#fff",
              "& fieldset": { borderColor: "#FFFFFF4D" },
            },
          }}
          helperText="Live pool price"
          FormHelperTextProps={{ sx: { color: "#aaa" } }}
          fullWidth
          sx={{ mb: 4 }}
        />

        <CustomButton
          variant="contained"
          fullWidth
          disabled={loading || !walletKey}
          onClick={handleSubmit}
        >
          {loading ? "Processing..." : "Create Passive Sell Offer"}
        </CustomButton>
      </Box>

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
