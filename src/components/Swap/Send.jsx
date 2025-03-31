// import React, { useState, useEffect } from "react";
// import { Box, Typography, Button, TextField, Container } from "@mui/material";
// import { TransactionBuilder, Operation, BASE_FEE, Networks } from "diamnet-sdk";
// import TransactionModal from "../../comman/TransactionModal";
// import CustomButton from "../../comman/CustomButton";

// const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
// const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

// const SellOfferPage = () => {
//   const [sellAmount, setSellAmount] = useState("");
//   const [price, setPrice] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [txStatus, setTxStatus] = useState("");

//   // DiamNet references
//   const [sdk, setSdk] = useState(null);
//   const [server, setServer] = useState(null);

//   // TransactionModal state
//   const [modalOpen, setModalOpen] = useState(false);
//   const [transactionStatus, setTransactionStatus] = useState(""); // "pending", "success", "error"
//   const [transactionMessage, setTransactionMessage] = useState("");
//   const [transactionHash, setTransactionHash] = useState("");

//   // Load Diamnet SDK on mount
//   useEffect(() => {
//     (async () => {
//       try {
//         const DiamSdkModule = await import("diamnet-sdk");
//         const sdkModule = DiamSdkModule.default || DiamSdkModule;
//         setSdk(sdkModule);
//         const srv = new sdkModule.Aurora.Server(
//           "https://diamtestnet.diamcircle.io/"
//         );
//         setServer(srv);
//       } catch (error) {
//         console.error("Error loading Diamnet SDK:", error);
//       }
//     })();
//   }, []);

//   // Utility: Get connected wallet public key from localStorage
//   const getWalletPublicKey = () => localStorage.getItem("diamPublicKey");

//   // Input field handlers
//   const handleSellAmountChange = (e) =>
//     setSellAmount(e.target.value.replace(/[^0-9.]/g, ""));
//   const handlePriceChange = (e) =>
//     setPrice(e.target.value.replace(/[^0-9.]/g, ""));

//   /**
//    * Attempt to fund the issuer account with Friendbot.
//    * If the account already exists, ignore the error and proceed.
//    */
//   const fundIssuerAccount = async () => {
//     try {
//       const response = await fetch(
//         `https://friendbot.diamcircle.io?addr=${USDC_ISSUER}`
//       );
//       if (!response.ok) {
//         // If the server returned 400, check if it's createAccountAlreadyExist
//         if (response.status === 400) {
//           const errorData = await response.json();
//           if (errorData?.detail?.includes("createAccountAlreadyExist")) {
//             console.log("Issuer account already exists. Proceeding...");
//             return;
//           } else {
//             throw new Error(
//               `Friendbot error: ${errorData.detail || response.statusText}`
//             );
//           }
//         } else {
//           throw new Error(`Funding issuer failed: ${response.statusText}`);
//         }
//       }
//       console.log(`Issuer account ${USDC_ISSUER} funded successfully.`);
//       setTxStatus("Issuer account funded.");
//     } catch (error) {
//       console.error("Error funding issuer account:", error);
//       throw error;
//     }
//   };

//   /**
//    * Establish a trustline for USDC on the user's account.
//    */
//   const establishUSDCTrustline = async () => {
//     if (!sdk || !server) throw new Error("Diamnet SDK or server not loaded.");
//     const publicKey = getWalletPublicKey();
//     if (!publicKey)
//       throw new Error("Wallet not connected. Please connect your wallet.");

//     const sellerAccount = await server.loadAccount(publicKey);
//     const usdcAsset = new sdk.Asset("USDC", USDC_ISSUER);

//     const transaction = new TransactionBuilder(sellerAccount, {
//       fee: BASE_FEE,
//       networkPassphrase: Networks.TESTNET,
//     })
//       .addOperation(
//         Operation.changeTrust({
//           asset: usdcAsset,
//           limit: "1000000",
//         })
//       )
//       .setTimeout(30)
//       .build();

//     const xdr = transaction.toXDR();
//     console.log("Trustline XDR:", xdr);

//     if (!window.diam || typeof window.diam.sign !== "function") {
//       throw new Error("Wallet extension signing not available.");
//     }

//     const result = await window.diam.sign(xdr, true, NETWORK_PASSPHRASE);
//     console.log("Trustline sign response:", result);

//     // Attempt to extract hash from top-level or nested fields
//     let finalHash = result.hash;
//     if (!finalHash && result.message?.data?.hash) {
//       finalHash = result.message.data.hash;
//       console.log("Extracted nested hash from result:", finalHash);
//     }

//     return finalHash || null; // might be used in final message
//   };

//   /**
//    * Create a Sell Offer for DIAM → USDC
//    */
//   const createSellOffer = async () => {
//     if (!sellAmount || !price) throw new Error("Sell amount/price is empty.");
//     if (!sdk || !server) throw new Error("Diamnet SDK or server not loaded.");

//     const publicKey = getWalletPublicKey();
//     if (!publicKey)
//       throw new Error("Wallet not connected. Please connect your wallet.");

//     const sellerAccount = await server.loadAccount(publicKey);
//     const usdcAsset = new sdk.Asset("USDC", USDC_ISSUER);

//     const transaction = new TransactionBuilder(sellerAccount, {
//       fee: BASE_FEE,
//       networkPassphrase: Networks.TESTNET,
//     })
//       .addOperation(
//         Operation.manageSellOffer({
//           selling: sdk.Asset.native(), // Selling DIAM (native)
//           buying: usdcAsset, // Buying USDC
//           amount: sellAmount,
//           price: price,
//           offerId: "0",
//         })
//       )
//       .setTimeout(30)
//       .build();

//     const xdr = transaction.toXDR();
//     console.log("Sell Offer XDR:", xdr);

//     if (!window.diam || typeof window.diam.sign !== "function") {
//       throw new Error("Wallet extension signing not available.");
//     }

//     const result = await window.diam.sign(xdr, true, NETWORK_PASSPHRASE);
//     console.log("Sell Offer sign response:", result);

//     // Attempt to extract hash from top-level or nested fields
//     let finalHash = result.hash;
//     if (!finalHash && result.message?.data?.hash) {
//       finalHash = result.message.data.hash;
//       console.log("Extracted nested hash from result:", finalHash);
//     }

//     return finalHash || null;
//   };

//   /**
//    * Single flow: Fund Issuer -> Establish Trustline -> Create Sell Offer
//    */
//   const handleSingleClick = async () => {
//     setLoading(true);
//     setTxStatus("Starting sell offer flow...");
//     setModalOpen(true);
//     setTransactionStatus("pending");
//     setTransactionMessage("Processing sell offer...");

//     try {
//       // 1) Fund the USDC issuer
//       setTransactionMessage("Funding USDC issuer...");
//       await fundIssuerAccount();

//       // 2) Establish trustline
//       setTransactionMessage("Establishing USDC trustline...");
//       const trustHash = await establishUSDCTrustline();
//       console.log("Trustline final hash:", trustHash);

//       // 3) Create Sell Offer
//       setTransactionMessage("Creating sell offer...");
//       const sellHash = await createSellOffer();
//       console.log("Sell offer final hash:", sellHash);

//       // All done
//       const finalHash = sellHash || trustHash || "N/A";
//       setTxStatus(`Transaction successful! Hash: ${finalHash}`);
//       setTransactionStatus("success");
//       setTransactionMessage("Sell offer created successfully!");
//       setTransactionHash(finalHash);
//     } catch (error) {
//       console.error("Flow error:", error);
//       setTxStatus(`Error: ${error.message || error}`);
//       setTransactionStatus("error");
//       setTransactionMessage(
//         `Error in sell offer flow: ${error.message || error}`
//       );
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
//         <Typography
//           variant="h5"
//           gutterBottom
//           sx={{ fontWeight: "bold", marginBottom: "1.5rem" }}
//         >
//           Create Sell Offer
//         </Typography>

//         {/* Sell Amount */}
//         <TextField
//           label="Sell Amount (DIAM)"
//           value={sellAmount}
//           onChange={handleSellAmountChange}
//           fullWidth
//           variant="outlined"
//           sx={{
//             marginBottom: "1rem",
//             border: "1px solid #FFFFFF4D",

//             borderRadius: "8px",
//             input: { color: "#fff" },
//           }}
//         />

//         {/* Price */}
//         <TextField
//           label="Price (USDC per DIAM)"
//           value={price}
//           onChange={handlePriceChange}
//           fullWidth
//           variant="outlined"
//           sx={{
//             marginBottom: "1rem",
//             border: "1px solid #FFFFFF4D",

//             borderRadius: "8px",
//             input: { color: "#fff" },
//           }}
//         />

//         {/* Single Button: runs the entire flow */}
//         <CustomButton
//           variant="contained"
//           fullWidth
//           onClick={handleSingleClick}
//           disabled={loading}
//         >
//           {loading ? "Processing..." : "Create Sell Offer"}
//         </CustomButton>

//         {/* Transaction Modal */}
//         <TransactionModal
//           open={modalOpen}
//           onClose={() => setModalOpen(false)}
//           status={transactionStatus}
//           message={transactionMessage}
//           transactionHash={transactionHash}
//         />
//       </Box>
//     </Container>
//   );
// };

// export default SellOfferPage;















// src/components/SellOfferPage.jsx
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

// Our ephemeral issuer for the custom asset
const issuerKeypair = Keypair.random();

// DiamNet Aurora server
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// Friendbot for testnet
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";

const SellOfferPage = () => {
  // ----------------------------------------------------------------
  // State variables
  // ----------------------------------------------------------------
  const [sellAmount, setSellAmount] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // We'll create a custom asset: "TradeToken" with ephemeral issuer
  const assetCode = "TradeToken";
  const [transactionStatus, setTransactionStatus] = useState(""); // pending, success, error
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Grab the localStorage public key for the user’s DIAM wallet
  const [walletPublicKey, setWalletPublicKey] = useState(
    () => localStorage.getItem("diamPublicKey") || ""
  );

  // The custom asset
  const customAsset = new Asset(assetCode, issuerKeypair.publicKey());

  // Input handlers
  const handleSellAmountChange = (e) =>
    setSellAmount(e.target.value.replace(/[^0-9.]/g, ""));
  const handlePriceChange = (e) =>
    setPrice(e.target.value.replace(/[^0-9.]/g, ""));

  // ----------------------------------------------------------------
  // Helper: fund an account with friendbot (if needed)
  // ----------------------------------------------------------------
  const friendbotFund = async (publicKey) => {
    try {
      const resp = await fetch(`${friendbotUrl}${publicKey}`);
      if (!resp.ok) {
        if (resp.status === 400) {
          // Possibly "createAccountAlreadyExist"
          const errorData = await resp.json();
          if (errorData?.detail?.includes("createAccountAlreadyExist")) {
            console.log("Account already exists, skipping friendbot.");
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

  // ----------------------------------------------------------------
  // 1) Fund the ephemeral issuer (so it can create the asset)
  // ----------------------------------------------------------------
  const fundIssuerIfNeeded = async () => {
    await friendbotFund(issuerKeypair.publicKey());
  };

  // ----------------------------------------------------------------
  // 2) Issue the asset from ephemeral issuer → user’s wallet
  //    (But first, user must trust the asset)
  // ----------------------------------------------------------------
  const establishUserTrustline = async () => {
    if (!walletPublicKey) {
      throw new Error("No DIAM wallet connected (no public key in localStorage).");
    }
    // Load user’s account from the Aurora server
    const userAccount = await server.loadAccount(walletPublicKey);

    // Build a transaction to trust the new asset
    const trustTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.changeTrust({
          asset: customAsset,
          limit: "1000000", // e.g., allow up to 1M tokens
        })
      )
      .setTimeout(30)
      .build();

    console.log("Trustline XDR:", trustTx.toXDR());

    // Sign using the DIAM extension
    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const trustResult = await window.diam.sign(trustTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Trustline sign response:", trustResult);
  };

  const issueAssetToUser = async () => {
    // Now ephemeral issuer sends tokens to user
    console.log("Issuing asset to user’s wallet...");
    const issuerAcct = await server.loadAccount(issuerKeypair.publicKey());

    const paymentTx = new TransactionBuilder(issuerAcct, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: walletPublicKey,
          asset: customAsset,
          amount: "1000", // for example, give user 1000 tokens
        })
      )
      .setTimeout(30)
      .build();

    // The ephemeral issuer is a normal Keypair, so we sign locally
    paymentTx.sign(issuerKeypair);

    const payResult = await server.submitTransaction(paymentTx);
    console.log("Issue asset -> user response:", payResult.hash);
  };

  // ----------------------------------------------------------------
  // 3) Create Sell Offer (user sells DIAM, buys custom asset)
  // ----------------------------------------------------------------
  const createSellOffer = async () => {
    console.log("Creating sell offer... (User sells DIAM -> buys custom asset)");

    // Load user’s account from the Aurora server
    const userAccount = await server.loadAccount(walletPublicKey);

    // Build the transaction for manageSellOffer
    const offerTx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.manageSellOffer({
          selling: Asset.native(),   // DIAM
          buying: customAsset,       // The ephemeral asset
          amount: sellAmount,
          price: price,
          offerId: "0",
        })
      )
      .setTimeout(30)
      .build();

    console.log("Sell Offer XDR:", offerTx.toXDR());

    // Ask DIAM extension to sign
    if (!window.diam || typeof window.diam.sign !== "function") {
      throw new Error("DIAM Wallet extension not available for signing.");
    }
    const signResult = await window.diam.sign(offerTx.toXDR(), true, NETWORK_PASSPHRASE);
    console.log("Sell Offer sign response:", signResult);

    // Attempt to parse final hash
    let finalHash = signResult.hash;
    if (!finalHash && signResult.message?.data?.hash) {
      finalHash = signResult.message.data.hash;
      console.log("Extracted nested hash from result:", finalHash);
    }
    return finalHash || null;
  };

  // ----------------------------------------------------------------
  // Full flow triggered by “Create Sell Offer” button
  // ----------------------------------------------------------------
  const handleCreateSellOffer = async () => {
    try {
      setLoading(true);
      setTxStatus("Starting sell offer flow...");
      setModalOpen(true);
      setTransactionStatus("pending");
      setTransactionMessage("Processing sell offer...");

      // 0) Ensure we have a connected wallet
      if (!walletPublicKey) {
        throw new Error("No DIAM wallet connected. Please connect your wallet first.");
      }

      // 1) Fund ephemeral issuer (so it can create asset)
      setTransactionMessage("Funding ephemeral issuer...");
      await fundIssuerIfNeeded();

      // 2) Fund the user’s wallet if needed
      setTransactionMessage("Funding user’s wallet (if needed)...");
      await friendbotFund(walletPublicKey);

      // 3) User trusts the ephemeral asset
      setTransactionMessage("Establishing user trustline...");
      await establishUserTrustline();

      // 4) Ephemeral issuer sends tokens to user
      setTransactionMessage("Issuing ephemeral asset to user...");
      await issueAssetToUser();

      // 5) User creates the sell offer (DIAM -> ephemeral asset)
      setTransactionMessage("Creating sell offer...");
      const sellHash = await createSellOffer();
      console.log("Sell offer final hash:", sellHash);

      // Done
      setTxStatus(`Transaction successful! Hash: ${sellHash || "N/A"}`);
      setTransactionStatus("success");
      setTransactionMessage("Sell offer created successfully!");
      setTransactionHash(sellHash || "");
    } catch (error) {
      console.error("Flow error:", error);
      setTxStatus(`Error: ${error.message || error}`);
      setTransactionStatus("error");
      setTransactionMessage(`Error in sell offer flow: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

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
          Create Sell Offer
        </Typography>

        <TextField
          label="Sell Amount (DIAM)"
          value={sellAmount}
          onChange={handleSellAmountChange}
          fullWidth
          variant="outlined"
          sx={{
            marginBottom: "1rem",
            border: "1px solid #FFFFFF4D",
            borderRadius: "8px",
            input: { color: "#fff" },
          }}
        />

        <TextField
          label={`Price (${assetCode} per DIAM)`}
          value={price}
          onChange={handlePriceChange}
          fullWidth
          variant="outlined"
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
          disabled={loading || !walletPublicKey}
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
