// // src/components/BuyOfferPage.jsx
// import React, { useState, useEffect } from "react";
// import { Container, Box, Typography, TextField, CircularProgress } from "@mui/material";
// import { 
//   TransactionBuilder, 
//   Operation, 
//   BASE_FEE, 
//   Networks, 
//   Asset, 
//   Keypair 
// } from "diamnet-sdk";
// import TransactionModal from "../../comman/TransactionModal";
// import CustomButton from "../../comman/CustomButton";

// const NETWORK_PASSPHRASE = "Diamante Testnet 2024";

// // For this demo, we generate a new issuer keypair to define the custom asset
// const [issuerKeypair] = [Keypair.random()];
// // Create the custom asset "TradeToken" using the issuer's public key.
// const customAsset = new Asset("TradeToken", issuerKeypair.publicKey());

// // Helper function to fund buyer account using Friendbot (ignores already funded error)
// const fundBuyerAccount = async (publicKey, server) => {
//   try {
//     const response = await fetch(`https://friendbot.diamcircle.io?addr=${publicKey}`);
//     if (!response.ok) {
//       if (response.status === 400) {
//         const errorData = await response.json();
//         if (errorData?.detail && errorData.detail.includes("createAccountAlreadyExist")) {
//           console.log("Buyer account already funded. Proceeding...");
//           return;
//         } else {
//           throw new Error(`Friendbot error: ${errorData.detail || response.statusText}`);
//         }
//       } else {
//         throw new Error(`Funding buyer failed: ${response.statusText}`);
//       }
//     } else {
//       console.log(`Buyer account ${publicKey} funded successfully.`);
//     }
//     const account = await server.loadAccount(publicKey);
//     console.log("Buyer account balances:", account.balances);
//   } catch (error) {
//     console.error("Error funding buyer account:", error);
//     throw error;
//   }
// };

// const BuyOfferPage = () => {
//   // Offer details state
//   const [buyAmount, setBuyAmount] = useState("");
//   const [price, setPrice] = useState("");
//   // Transaction flow state
//   const [txStatus, setTxStatus] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Diamnet SDK and server
//   const [sdk, setSdk] = useState(null);
//   const [server, setServer] = useState(null);

//   // TransactionModal state
//   const [modalOpen, setModalOpen] = useState(false);
//   const [transactionStatus, setTransactionStatus] = useState(""); // "pending", "success", "error"
//   const [transactionMessage, setTransactionMessage] = useState("");
//   const [transactionHash, setTransactionHash] = useState("");

//   // Load Diamnet SDK and server on mount
//   useEffect(() => {
//     (async () => {
//       try {
//         const DiamSdkModule = await import("diamnet-sdk");
//         const sdkModule = DiamSdkModule.default || DiamSdkModule;
//         setSdk(sdkModule);
//         const srv = new sdkModule.Aurora.Server("https://diamtestnet.diamcircle.io/");
//         setServer(srv);
//         console.log("Diamnet SDK and server loaded successfully.");
//       } catch (error) {
//         console.error("Error loading Diamnet SDK:", error);
//       }
//     })();
//   }, []);

//   // Utility: Get connected wallet public key from localStorage
//   const getWalletPublicKey = () => {
//     const key = localStorage.getItem("diamPublicKey");
//     console.log("Retrieved wallet public key:", key);
//     return key;
//   };

//   // Input handlers
//   const handleBuyAmountChange = (e) =>
//     setBuyAmount(e.target.value.replace(/[^0-9.]/g, ""));
//   const handlePriceChange = (e) =>
//     setPrice(e.target.value.replace(/[^0-9.]/g, ""));

//   /**
//    * Establish a trustline for the custom asset ("TradeToken") on the buyer's account.
//    */
//   const establishTradeTokenTrustline = async () => {
//     if (!sdk || !server) throw new Error("Diamnet SDK or server not loaded.");
//     const publicKey = getWalletPublicKey();
//     if (!publicKey) throw new Error("Wallet not connected. Please connect your wallet.");

//     const account = await server.loadAccount(publicKey);
//     // Use the custom asset "TradeToken"
//     const transaction = new TransactionBuilder(account, {
//       fee: BASE_FEE,
//       networkPassphrase: Networks.TESTNET,
//     })
//       .addOperation(
//         Operation.changeTrust({
//           asset: customAsset,
//           limit: "1000000",
//         })
//       )
//       .setTimeout(30)
//       .build();

//     const xdr = transaction.toXDR();
//     console.log("TradeToken Trustline XDR:", xdr);

//     if (!window.diam || typeof window.diam.sign !== "function") {
//       throw new Error("Wallet extension signing not available.");
//     }

//     const result = await window.diam.sign(xdr, true, NETWORK_PASSPHRASE);
//     console.log("Trustline sign response:", result);

//     let finalHash = result.hash;
//     if (!finalHash && result.message?.data?.hash) {
//       finalHash = result.message.data.hash;
//       console.log("Extracted nested trustline hash:", finalHash);
//     }
//     return finalHash || null;
//   };

//   /**
//    * Create a Buy Offer Transaction.
//    * For a buy offer, the buyer sells native asset (XLM) to buy the custom asset ("TradeToken").
//    */
//   const createBuyOffer = async () => {
//     if (!buyAmount || !price) throw new Error("Buy amount/price is empty.");
//     if (!sdk || !server) throw new Error("Diamnet SDK or server not loaded.");

//     const publicKey = getWalletPublicKey();
//     if (!publicKey) throw new Error("Wallet not connected. Please connect your wallet.");

//     const account = await server.loadAccount(publicKey);
//     // Use the custom asset "TradeToken" for buying
//     const transaction = new TransactionBuilder(account, {
//       fee: BASE_FEE,
//       networkPassphrase: Networks.TESTNET,
//     })
//       .addOperation(
//         Operation.manageBuyOffer({
//           selling: Asset.native(),       // Selling XLM
//           buying: customAsset,           // Buying TradeToken
//           buyAmount: buyAmount,
//           price: price,
//           offerId: "0",
//         })
//       )
//       .setTimeout(30)
//       .build();

//     const xdr = transaction.toXDR();
//     console.log("Buy Offer XDR:", xdr);

//     if (!window.diam || typeof window.diam.sign !== "function") {
//       throw new Error("Wallet extension signing not available.");
//     }

//     const result = await window.diam.sign(xdr, true, NETWORK_PASSPHRASE);
//     console.log("Buy Offer sign response:", result);

//     let finalHash = result.hash;
//     if (!finalHash && result.message?.data?.hash) {
//       finalHash = result.message.data.hash;
//       console.log("Extracted nested buy offer hash:", finalHash);
//     }
//     return finalHash || null;
//   };

//   /**
//    * Single flow: Fund buyer account (if needed), establish TradeToken trustline,
//    * then create the buy offer.
//    */
//   const handleSingleClick = async () => {
//     setLoading(true);
//     setTxStatus("Starting buy offer flow...");
//     setModalOpen(true);
//     setTransactionStatus("pending");
//     setTransactionMessage("Processing buy offer...");

//     try {
//       const publicKey = getWalletPublicKey();
//       if (!publicKey) throw new Error("Wallet not connected. Please connect your wallet.");

//       // 0) Fund the buyer account if needed.
//       setTransactionMessage("Funding buyer account...");
//       await fundBuyerAccount(publicKey, server);

//       // 1) Establish trustline for TradeToken
//       setTransactionMessage("Establishing TradeToken trustline...");
//       await establishTradeTokenTrustline();

//       // 2) Create Buy Offer
//       setTransactionMessage("Creating buy offer...");
//       const hash = await createBuyOffer();
//       console.log("Buy offer final hash:", hash);

//       const finalHash = hash || "N/A";
//       setTxStatus(`Transaction successful! Hash: ${finalHash}`);
//       setTransactionStatus("success");
//       setTransactionMessage("Buy offer created successfully!");
//       setTransactionHash(finalHash);
//     } catch (error) {
//       console.error("Buy offer flow error:", error);
//       setTxStatus(`Error: ${error.message || error}`);
//       setTransactionStatus("error");
//       setTransactionMessage(`Error in buy offer flow: ${error.message || error}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Container maxWidth="sm" sx={{ marginTop: "40px" }}>
//       <Box
//         sx={{
//           backgroundColor: "rgba(0,206,229,0.06)",
//           margin: "2rem auto",
//           borderRadius: "16px",
//           border: "1px solid #FFFFFF4D",
//           padding: "2rem",
//           color: "#FFFFFF",
//           boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
//           position: "relative",
//         }}
//       >
//         <Typography variant="h5" align="center" sx={{ mb: 4 }}>
//           Manage Offers (Buy)
//         </Typography>

//         {/* Offer Input Fields */}
//         <TextField
//           label="Buy Amount (DIAM)"
//           placeholder="Enter amount"
//           fullWidth
//           variant="outlined"
//           value={buyAmount}
//           onChange={handleBuyAmountChange}
//           InputProps={{
//             style: {
//               color: "#fff",
//               backgroundColor: "#000",
//               borderRadius: "12px",
//               border: "1px solid #FFFFFF4D",
//             },
//           }}
//           sx={{ mb: 2 }}
//         />
//         <TextField
//           label="Price (TradeToken per DIAM)"
//           placeholder="Enter price"
//           fullWidth
//           variant="outlined"
//           value={price}
//           onChange={handlePriceChange}
//           InputProps={{
//             style: {
//               color: "#fff",
//               backgroundColor: "#000",
//               borderRadius: "12px",
//               border: "1px solid #FFFFFF4D",
//             },
//           }}
//           sx={{ mb: 2 }}
//         />

//         {/* Label for Buy Offer */}
//         <Box sx={{ mb: 3 }}>
//           <Typography variant="subtitle1" align="center">
//             Offer Type: Buy Offer
//           </Typography>
//         </Box>

//         <CustomButton variant="contained" fullWidth onClick={handleSingleClick}>
//           {loading ? <CircularProgress size={24} /> : "Submit Offer"}
//         </CustomButton>

//         {txStatus && (
//           <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 2 }}>
//             Transaction Status: {txStatus}
//           </Typography>
//         )}
//       </Box>

//       <TransactionModal
//         open={modalOpen}
//         onClose={() => setModalOpen(false)}
//         status={transactionStatus}
//         message={transactionMessage}
//         transactionHash={transactionHash}
//       />
//     </Container>
//   );
// };

// export default BuyOfferPage;

























// src/components/BuyOfferPage.jsx
import React, { useState, useEffect } from "react";
import {
  Asset,
  Aurora,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  Networks,
} from "diamnet-sdk";
import { Container, Box, Typography, TextField, Button } from "@mui/material";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";

// We'll create an ephemeral issuer for "TradeToken"
const issuerKeypair = Keypair.random();
const assetCode = "TradeToken";
const customAsset = new Asset(assetCode, issuerKeypair.publicKey());

// DiamNet Aurora server
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
// Friendbot for testnet
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";

const BuyOfferPage = () => {
  // -------------------------------------------------------
  // State
  // -------------------------------------------------------
  const [buyAmount, setBuyAmount] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // TransactionModal states
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(""); // pending, success, error
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // The user’s connected DIAM wallet from localStorage
  const [walletPublicKey, setWalletPublicKey] = useState(
    () => localStorage.getItem("diamPublicKey") || ""
  );

  // -------------------------------------------------------
  // Input handlers
  // -------------------------------------------------------
  const handleBuyAmountChange = (e) =>
    setBuyAmount(e.target.value.replace(/[^0-9.]/g, ""));
  const handlePriceChange = (e) =>
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));

  // -------------------------------------------------------
  // Helper: friendbot-fund an account if needed
  // -------------------------------------------------------
  const friendbotFund = async (publicKey) => {
    try {
      const resp = await fetch(`${friendbotUrl}${publicKey}`);
      if (!resp.ok) {
        if (resp.status === 400) {
          const errorData = await resp.json();
          if (
            errorData?.detail &&
            errorData.detail.includes("createAccountAlreadyExist")
          ) {
            console.log("Account already exists. Skipping friendbot...");
            return;
          } else {
            throw new Error(
              `Friendbot error: ${errorData.detail || resp.statusText}`
            );
          }
        } else {
          throw new Error(`Friendbot error: ${resp.statusText}`);
        }
      }
      console.log(`Friendbot funded account: ${publicKey}`);
    } catch (error) {
      console.error("Error friendbot funding:", error);
      throw error;
    }
  };

  // -------------------------------------------------------
  // 1) Fund the ephemeral issuer (so it can create the asset)
  // -------------------------------------------------------
  const fundIssuerIfNeeded = async () => {
    await friendbotFund(issuerKeypair.publicKey());
  };

  // -------------------------------------------------------
  // 2) Fund user’s wallet if needed
  // -------------------------------------------------------
  const fundUserIfNeeded = async () => {
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected. Please connect your wallet first.");
    }
    await friendbotFund(walletPublicKey);
  };

  // -------------------------------------------------------
  // 3) Have user trust "TradeToken"
  // -------------------------------------------------------
  const establishUserTrustline = async () => {
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected. Please connect your wallet first.");
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

    console.log("TradeToken Trustline XDR:", trustTx.toXDR());

    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const trustResult = await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Trustline sign response:", trustResult);
  };

  // -------------------------------------------------------
  // 4) Optionally: ephemeral issuer can send user some tokens
  //    (not strictly required for a "buy" offer, but you might want it)
  // -------------------------------------------------------
  const issueAssetToUser = async () => {
    console.log("Issuing ephemeral asset to user...");
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    const paymentTx = new TransactionBuilder(issuerAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: walletPublicKey,
          asset: customAsset,
          amount: "1000", // example
        })
      )
      .setTimeout(30)
      .build();

    // ephemeral issuer signs locally
    paymentTx.sign(issuerKeypair);

    const payResult = await server.submitTransaction(paymentTx);
    console.log("Issue ephemeral asset -> user result:", payResult.hash);
  };

  // -------------------------------------------------------
  // 5) Create a Buy Offer (user sells DIAM, buys "TradeToken")
  // -------------------------------------------------------
  const createBuyOffer = async () => {
    if (!buyAmount || !price) {
      throw new Error("Buy amount/price is empty.");
    }
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected. Please connect your wallet first.");
    }

    const userAccount = await server.loadAccount(walletPublicKey);

    const offerTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.manageBuyOffer({
          selling: Asset.native(),   // user sells DIAM
          buying: customAsset,       // user buys ephemeral asset
          buyAmount: buyAmount,
          price: price,
          offerId: "0",
        })
      )
      .setTimeout(30)
      .build();

    console.log("Buy Offer XDR:", offerTx.toXDR());

    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const signResult = await window.diam.sign(offerTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Buy Offer sign response:", signResult);

    let finalHash = signResult.hash;
    if (!finalHash && signResult.message?.data?.hash) {
      finalHash = signResult.message.data.hash;
      console.log("Extracted nested buy offer hash:", finalHash);
    }
    return finalHash || null;
  };

  // -------------------------------------------------------
  // The single flow triggered by the "Submit Offer" button
  // -------------------------------------------------------
  const handleBuyFlow = async () => {
    setLoading(true);
    setTxStatus("Starting buy offer flow...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing buy offer...");

    try {
      // 1) Fund ephemeral issuer if needed
      setTransactionMessage("Funding ephemeral issuer...");
      await fundIssuerIfNeeded();

      // 2) Fund user’s wallet if needed
      setTransactionMessage("Funding user’s wallet...");
      await fundUserIfNeeded();

      // 3) User trusts ephemeral asset
      setTransactionMessage("Establishing user trustline...");
      await establishUserTrustline();

      // 4) Optionally: ephemeral issuer sends user some tokens
      // (Not strictly required for a buy offer, but included if you want user to hold them)
      setTransactionMessage("Issuing ephemeral asset to user...");
      await issueAssetToUser();

      // 5) Create Buy Offer
      setTransactionMessage("Creating buy offer...");
      const buyHash = await createBuyOffer();
      console.log("Buy offer final hash:", buyHash);

      setTxStatus(`Transaction successful! Hash: ${buyHash || "N/A"}`);
      setTransactionStatus("success");
      setTransactionMessage("Buy offer created successfully!");
      setTransactionHash(buyHash || "");
    } catch (error) {
      console.error("Buy offer flow error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Error in buy offer flow: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px" }}>
  

      <Box
        sx={{
          backgroundColor: "rgba(0,206,229,0.06)",
          margin: "2rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Buy Offer (DIAM → TradeToken)
        </Typography>

        <TextField
          label="Buy Amount (DIAM)"
          placeholder="0"
          fullWidth
          variant="outlined"
          value={buyAmount}
          onChange={handleBuyAmountChange}
          sx={{
            marginBottom: "1rem",
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        <TextField
          label={`Price (${assetCode} per DIAM)`}
          placeholder="0.1"
          fullWidth
          variant="outlined"
          value={price}
          onChange={handlePriceChange}
          sx={{
            marginBottom: "1rem",
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleBuyFlow}
          disabled={loading || !walletPublicKey}
        >
          {loading ? "Processing..." : "Create Buy Offer"}
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

export default BuyOfferPage;
