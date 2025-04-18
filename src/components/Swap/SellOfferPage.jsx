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
} from "@mui/material";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { FaChevronDown } from "react-icons/fa6";

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const issuerKeypair = Keypair.random();
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";

const SellOfferPage = () => {
  // ----------------------------------------------------------------
  // State variables
  // ----------------------------------------------------------------
  const [sellAmount, setSellAmount] = useState("");
  const [assetCodes, setAssetCodes] = useState([]);
  const [assetCode, setAssetCode] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const walletPublicKey = localStorage.getItem("diamPublicKey") || "";

  // Derived custom asset instance
  const customAsset = assetCode
    ? new Asset(assetCode, issuerKeypair.publicKey())
    : null;

  // ----------------------------------------------------------------
  // Fetch available asset codes from liquidity pools
  // ----------------------------------------------------------------
  useEffect(() => {
    const fetchAssetCodes = async () => {
      try {
        const resp = await fetch(
          "https://diamtestnet.diamcircle.io/liquidity_pools?limit=200"
        );
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        const json = await resp.json();
        const records = json._embedded?.records || json.records || [];
  
        const codes = Array.from(
          new Set(
            records.flatMap((pool) =>
              pool.reserves
                .filter((r) => r.asset !== "native")
                .map((r) => r.asset.split(":")[0])
            )
          )
        );
  
        setAssetCodes(codes);
        if (codes.length) setAssetCode(codes[0]);
      } catch (error) {
        console.error("Error fetching asset codes:", error);
      }
    };
    fetchAssetCodes();
  }, []);
  
  const handleSellAmountChange = (e) =>
    setSellAmount(e.target.value.replace(/[^0-9.]/g, ""));
  const handlePriceChange = (e) =>
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));

  // ----------------------------------------------------------------
  // Friendbot funding, trustline, issuance, and offer creation
  // ----------------------------------------------------------------
  const friendbotFund = async (publicKey) => {
    try {
      const resp = await fetch(`${friendbotUrl}${publicKey}`);
      if (!resp.ok) {
        if (resp.status === 400) {
          const errorData = await resp.json();
          if (!errorData?.detail?.includes("createAccountAlreadyExist")) {
            throw new Error(
              `Friendbot error: ${errorData.detail || resp.statusText}`
            );
          }
        } else {
          throw new Error(`Friendbot error: ${resp.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error friendbot funding:", error);
      throw error;
    }
  };

  const fundIssuerIfNeeded = async () => {
    await friendbotFund(issuerKeypair.publicKey());
  };

  const establishUserTrustline = async () => {
    if (!walletPublicKey) {
      throw new Error(
        "No DIAM wallet connected (no public key in localStorage)."
      );
    }
    const userAccount = await server.loadAccount(walletPublicKey);
    const trustTx = new TransactionBuilder(userAccount, {
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

    if (!window.diam?.sign) {
      throw new Error("DIAM Wallet extension not available.");
    }
    await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
  };

  const issueAssetToUser = async () => {
    const issuerAcct = await server.loadAccount(
      issuerKeypair.publicKey()
    );
    const paymentTx = new TransactionBuilder(issuerAcct, {
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

    paymentTx.sign(issuerKeypair);
    await server.submitTransaction(paymentTx);
  };

  const createSellOffer = async () => {
    const userAccount = await server.loadAccount(walletPublicKey);
    const offerTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.manageSellOffer({
          selling: Asset.native(),
          buying: customAsset,
          amount: sellAmount,
          price: price,
          offerId: "0",
        })
      )
      .setTimeout(30)
      .build();

    if (!window.diam?.sign) {
      throw new Error("DIAM Wallet extension not available.");
    }
    const signResult = await window.diam.sign(
      offerTx.toXDR(),
      true,
      NETWORK_PASSPHRASE
    );
    return (
      signResult.hash ||
      signResult.message?.data?.hash ||
      null
    );
  };

  // Full flow
  const handleCreateSellOffer = async () => {
    try {
      setLoading(true);
      setModalOpen(true);
      setTransactionStatus("pending");
      setTransactionMessage("Starting sell offer flow...");

      if (!walletPublicKey) {
        throw new Error("Please connect your DIAM wallet first.");
      }

      setTransactionMessage("Funding ephemeral issuer...");
      await fundIssuerIfNeeded();

      setTransactionMessage("Funding user’s wallet (if needed)...");
      await friendbotFund(walletPublicKey);

      setTransactionMessage("Establishing trustline...");
      await establishUserTrustline();

      setTransactionMessage("Issuing asset to user...");
      await issueAssetToUser();

      setTransactionMessage("Creating sell offer...");
      const hash = await createSellOffer();

      setTransactionStatus("success");
      setTransactionMessage("Sell offer created successfully!");
      setTransactionHash(hash || "");
    } catch (error) {
      console.error("Flow error:", error);
      setTransactionStatus("error");
      setTransactionMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render
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
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Create Sell Offer
        </Typography>

        <TextField
          label="Sell Amount (DIAM)"
          value={sellAmount}
          onChange={handleSellAmountChange}
          fullWidth
          variant="outlined"
          sx={{
            mb: 2,
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        {/* Improved searchable dropdown */}
        <Autocomplete
          options={assetCodes}
          value={assetCode}
          onChange={(e, newVal) => setAssetCode(newVal || '')}
          fullWidth
          disableClearable
          popupIcon={<FaChevronDown style={{ color: '#fff', fontSize:20 }} />}
          PopperProps={{ style: { zIndex: 1400 } }}
          sx={{ mb: 2 }}
          renderInput={params => (
            <TextField
              {...params}
              label="Select Asset"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: '#FFFFFF4D' },
                  '&:hover fieldset': { borderColor: '#fff' },
                },
                '& .MuiInputLabel-root': { color: '#fff' },
              }}
            />
          )}
          componentsProps={{
            paper: {
              sx: {
                backgroundColor: 'rgba(0,0,0,0.9)',
                color: '#fff',
              },
            },
            listbox: {
              sx: {
                backgroundColor: 'rgba(0,0,0,0.9)',
                '& .MuiAutocomplete-option': { color: '#fff' },
              },
            },
          }}
        />

        <TextField
          label={`Price (${assetCode} per DIAM)`}
          value={price}
          onChange={handlePriceChange}
          fullWidth
          variant="outlined"
          sx={{
            mb: 3,
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        <CustomButton
          variant="contained"
          fullWidth
          disabled={loading || !walletPublicKey || !assetCode}
          onClick={handleCreateSellOffer}
        >
          {loading ? "Processing..." : "Create Sell Offer"}
        </CustomButton>
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

export default SellOfferPage;
