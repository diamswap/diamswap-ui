// // src/pages/CreatePoolPage.jsx
// import React, { useState, useEffect } from "react";
// import {
//   Container,
//   Box,
//   Typography,
//   TextField,
//   InputAdornment,
//   CircularProgress,
//   Autocomplete,
// } from "@mui/material";
// import { AiOutlinePlusCircle } from "react-icons/ai";
// import CustomButton from "../../comman/CustomButton";
// import { Buffer } from "buffer";
// import TransactionModal from "../../comman/TransactionModal";

// if (!window.Buffer) {
//   window.Buffer = Buffer;
// }

// const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
// const FRIENDBOT_URL = "https://friendbot.diamcircle.io?addr=";

// const CreatePoolPage = () => {
//   // UI state
//   const [tokenA, setTokenA] = useState("native");
//   const [tokenB, setTokenB] = useState("");
//   const [assetCodes, setAssetCodes] = useState([]);
//   const [assetCode, setAssetCode] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [logs, setLogs] = useState([]);
//   const [poolDetails, setPoolDetails] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [transactionStatus, setTransactionStatus] = useState("");
//   const [transactionMessage, setTransactionMessage] = useState("");
//   const [transactionHash, setTransactionHash] = useState("");

//   const walletPublicKey = localStorage.getItem("diamPublicKey") || "";
//   if (!walletPublicKey)
//     console.warn("No wallet public key found in localStorage.");

//   const [sdk, setSdk] = useState(null);
//   const [server, setServer] = useState(null);
//   const [issuerKeypair, setIssuerKeypair] = useState(null);

//   const addLog = (msg) => {
//     console.log(msg);
//     setLogs((prev) => [...prev, msg]);
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const DiamSdkModule = await import("diamnet-sdk");
//         const diamnetSdk = DiamSdkModule.default || DiamSdkModule;
//         setSdk(diamnetSdk);
//         const srv = new diamnetSdk.Aurora.Server(
//           "https://diamtestnet.diamcircle.io/"
//         );
//         setServer(srv);
//         const issuer = diamnetSdk.Keypair.random();
//         setIssuerKeypair(issuer);
//         addLog("Diamnet SDK loaded.");
//         addLog("Ephemeral Issuer: " + issuer.publicKey());
//       } catch (error) {
//         addLog("Error loading Diamnet SDK: " + error.toString());
//       }
//     })();
//   }, []);

//   useEffect(() => {
//     (async () => {
//       try {
//         const resp = await fetch(
//           "https://diamtestnet.diamcircle.io/liquidity_pools?limit=200"
//         );
//         const json = await resp.json();
//         const pools = json._embedded?.records || json.records || [];
//         const codes = Array.from(
//           new Set(
//             pools.flatMap((p) =>
//               p.reserves
//                 .filter((r) => r.asset !== "native")
//                 .map((r) => r.asset.split(":")[0])
//             )
//           )
//         );
//         setAssetCodes(codes);
//       } catch (e) {
//         addLog("Error fetching asset codes: " + e.toString());
//       }
//     })();
//   }, []);

//   // Auto-fill Token B when SDK and issuer are available
//   useEffect(() => {
//     if (sdk && issuerKeypair) {
//       try {
//         const customAsset = new sdk.Asset(assetCode, issuerKeypair.publicKey());
//         setTokenB(`${customAsset.getCode()}:${customAsset.getIssuer()}`);
//         addLog(
//           "Token B auto-filled as custom asset: " +
//             customAsset.getCode() +
//             " / " +
//             customAsset.getIssuer()
//         );
//       } catch (error) {
//         addLog("Error auto-filling Token B: " + error.toString());
//       }
//     }
//   }, [sdk, issuerKeypair]);

//   const parseTokenInput = (input) => {
//     const val = input.trim().toLowerCase();
//     if (val === "native" || val === "xlm") return sdk.Asset.native();
//     const [code, issuer] = input.split(":");
//     if (!code || !issuer)
//       throw new Error('Invalid token format: use "native" or "CODE:ISSUER".');
//     return new sdk.Asset(code, issuer);
//   };

//   // Helper: fund an account using Friendbot
//   const friendbotFund = async (publicKey) => {
//     try {
//       const resp = await fetch(`${FRIENDBOT_URL}${publicKey}`);
//       if (resp.ok) {
//         addLog(`Account ${publicKey} funded successfully.`);
//       } else {
//         if (resp.status === 400) {
//           const errorData = await resp.json();
//           if (
//             errorData.detail &&
//             errorData.detail.includes("createAccountAlreadyExist")
//           ) {
//             addLog(`Account ${publicKey} already exists. Moving on...`);
//             return;
//           }
//         }
//         addLog(Error `funding account ${publicKey}: ${resp.statusText}`);
//       }
//     } catch (error) {
//       addLog("Friendbot error: " + error.toString());
//     }
//   };

//   // Main flow: create pool
//   const handleCreatePool = async () => {
//     if (!server || !sdk || !issuerKeypair || !walletPublicKey) {
//       addLog("Required parameters not ready (server, sdk, issuer, wallet).");
//       return;
//     }
//     setLoading(true);
//     // Show modal
//     setModalOpen(true);
//     setTransactionStatus("pending");
//     setTransactionMessage("Starting liquidity pool creation...");

//     try {
//       const {
//         TransactionBuilder,
//         BASE_FEE,
//         Networks,
//         Operation,
//         LiquidityPoolAsset,
//         getLiquidityPoolId,
//       } = sdk;
//       setTransactionStatus("pending");
//       setTransactionMessage("=== Starting pool creation flow ===");

//       addLog("=== Starting pool creation flow ===");
//       addLog("Wallet Public Key: " + walletPublicKey);

//       addLog("Fund: Starting friendbot funding for ephemeral issuer...");
//       await friendbotFund(issuerKeypair.publicKey());
//       addLog("Fund: Completed friendbot funding for ephemeral issuer.");
//       addLog("Fund: Starting friendbot funding for connected wallet...");
//       await friendbotFund(walletPublicKey);
//       addLog("Fund: Completed friendbot funding for connected wallet.");

//       addLog("Parsing Token A from input: " + tokenA);
//       const assetA = parseTokenInput(tokenA);
//       addLog(
//         "Parsed Token A: " +
//           assetA.getCode() +
//           " / " +
//           (assetA.getIssuer() || "native")
//       );

//       addLog("Creating custom asset for Token B...");
//       const customAsset = new sdk.Asset(assetCodes, issuerKeypair.publicKey());
//       const assetB = customAsset;
//       addLog(
//         "Parsed Token B (custom): " +
//           assetB.getCode() +
//           " / " +
//           assetB.getIssuer()
//       );

//       if (typeof assetA.getAssetType === "function" && !assetA.type) {
//         assetA.type = assetA.getAssetType();
//         addLog("Asset A type assigned: " + assetA.type);
//       }
//       if (typeof assetB.getAssetType === "function" && !assetB.type) {
//         assetB.type = assetB.getAssetType();
//         addLog("Asset B type assigned: " + assetB.type);
//       }
//       addLog("Final Asset A type: " + (assetA.type || "undefined"));
//       addLog("Final Asset B type: " + (assetB.type || "undefined"));

//       // 1. Establish trustline for custom asset on user's account
//       addLog("Loading user account for custom asset trustline...");
//       let userAccount = await server.loadAccount(walletPublicKey);
//       addLog("User account loaded for trustline.");
//       addLog("Building trustline transaction for custom asset...");
//       let trustTx = new TransactionBuilder(userAccount, {
//         fee: BASE_FEE,
//         networkPassphrase: NETWORK_PASSPHRASE,
//       })
//         .addOperation(Operation.changeTrust({ asset: assetB }))
//         .setTimeout(30)
//         .build();
//       addLog("Trustline transaction built.");
//       const trustXDR = trustTx.toXDR();
//       addLog("Trustline XDR: " + trustXDR);
//       addLog("Requesting DIAM wallet to sign trustline transaction...");
//       const signedTrustTx = await window.diam.sign(
//         trustXDR,
//         true,
//         NETWORK_PASSPHRASE
//       );
//       addLog("Trustline transaction signed.");
//       addLog("Submitting trustline transaction...");
//       try {
//         const trustResponse = await server.submitTransaction(signedTrustTx);
//         addLog(
//           "Custom asset trustline established. Tx Hash: " + trustResponse.hash
//         );
//       } catch (error) {
//         if (
//           error
//             .toString()
//             .includes("Cannot read properties of undefined (reading 'type')")
//         ) {
//           addLog(
//             "Warning: Trustline submission error (missing 'type'); assuming trustline is already established."
//           );
//         } else {
//           throw error;
//         }
//       }

//       // 2. Clear the auth_required flag on the issuer account so that trustlines auto-authorize
//       addLog("Loading issuer account for options update...");
//       const issuerAccountForOptions = await server.loadAccount(
//         issuerKeypair.publicKey()
//       );
//       addLog("Building setOptions transaction to clear auth_required flag...");
//       const optionsTx = new TransactionBuilder(issuerAccountForOptions, {
//         fee: BASE_FEE,
//         networkPassphrase: NETWORK_PASSPHRASE,
//       })
//         .addOperation(
//           Operation.setOptions({
//             clearFlags: sdk.AuthRequiredFlag, // Ensure this constant matches your SDK's naming
//           })
//         )
//         .setTimeout(30)
//         .build();
//       optionsTx.sign(issuerKeypair);
//       const optionsResponse = await server.submitTransaction(optionsTx);
//       addLog(
//         "Issuer account updated: auth_required flag cleared. Tx Hash: " +
//           optionsResponse.hash
//       );

//       // 3. Issue the custom asset from ephemeral issuer to user's wallet
//       addLog("Loading issuer account for asset issuance...");
//       let issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
//       addLog("Issuer account loaded.");
//       addLog("Building payment transaction for asset issuance...");
//       let paymentTx = new TransactionBuilder(issuerAccount, {
//         fee: BASE_FEE,
//         networkPassphrase: NETWORK_PASSPHRASE,
//       })
//         .addOperation(
//           Operation.payment({
//             destination: walletPublicKey,
//             asset: assetB,
//             amount: "100",
//           })
//         )
//         .setTimeout(30)
//         .build();
//       addLog("Payment transaction built.");
//       paymentTx.sign(issuerKeypair);
//       addLog("Payment transaction signed.");
//       addLog("Submitting payment transaction...");
//       let paymentRes = await server.submitTransaction(paymentTx);
//       addLog("Asset issued to wallet. Tx Hash: " + paymentRes.hash);

//       // 4. Create liquidity pool for assetA and assetB
//       addLog("Creating liquidity pool asset for Token A and custom Token B...");
//       const defaultFee = 30;
//       const lpAsset = new LiquidityPoolAsset(assetA, assetB, defaultFee);
//       // Manually assign both "type" and "assetType" as expected by the SDK
//       lpAsset.type = "liquidity_pool_constant_product";
//       lpAsset.assetType = "liquidity_pool_constant_product";
//       addLog(
//         "LP Asset created with manual type assignment: " +
//           JSON.stringify(lpAsset)
//       );
//       let liquidityPoolId;
//       try {
//         addLog("Calling getLiquidityPoolId with pool parameters...");
//         const poolParams = { assetA, assetB, fee: defaultFee };
//         liquidityPoolId = getLiquidityPoolId("constant_product", poolParams);
//         addLog("Raw liquidityPoolId value: " + liquidityPoolId);
//         liquidityPoolId = liquidityPoolId.toString("hex");
//         addLog("Liquidity Pool ID (hex): " + liquidityPoolId);
//       } catch (error) {
//         addLog("Error in getLiquidityPoolId: " + error.message);
//         if (error.message.includes("Cannot read properties of undefined")) {
//           addLog(
//             "Liquidity pool creation error (non-critical) - moving on with fallback."
//           );
//           liquidityPoolId = "N/A";
//         } else {
//           throw error;
//         }
//       }

//       // Attach liquidityPoolId to lpAsset (if available)
//       if (liquidityPoolId !== "N/A") {
//         lpAsset.liquidityPoolId = liquidityPoolId;
//         addLog("Attached liquidityPoolId to LP Asset.");
//       }

//       // 5. Establish trustline for LP asset on user's account using helper function
//       addLog("Establishing LP asset trustline using helper function...");
//       let lpTrustResponse;
//       try {
//         let lpUserAccount = await server.loadAccount(walletPublicKey);
//         const lpTrustTx = new TransactionBuilder(lpUserAccount, {
//           fee: BASE_FEE,
//           networkPassphrase: NETWORK_PASSPHRASE,
//         })
//           .addOperation(Operation.changeTrust({ asset: lpAsset }))
//           .setTimeout(30)
//           .build();
//         const lpTrustXDR = lpTrustTx.toXDR();
//         addLog("LP Trustline XDR (helper): " + lpTrustXDR);
//         const signedLpTrustTx = await window.diam.sign(
//           lpTrustXDR,
//           true,
//           NETWORK_PASSPHRASE
//         );
//         lpTrustResponse = await server.submitTransaction(signedLpTrustTx);
//         addLog(
//           "LP asset trustline established. Tx Hash: " + lpTrustResponse.hash
//         );
//       } catch (error) {
//         addLog(
//           "Error establishing LP trustline via helper: " + error.toString()
//         );
//         addLog("Assuming LP trustline is manually established.");
//       }

//       // 6. **Deposit liquidity** into the pool
//       // To have the pool show reserves of 10 (native) and 20 (TradeToken),
//       // deposit these amounts into the pool.
//       addLog("Depositing liquidity: 10 native and 20 TradeToken...");
//       try {
//         let userForDeposit = await server.loadAccount(walletPublicKey);
//         const depositTx = new TransactionBuilder(userForDeposit, {
//           fee: BASE_FEE,
//           networkPassphrase: NETWORK_PASSPHRASE,
//         })
//           .addOperation(
//             Operation.liquidityPoolDeposit({
//               liquidityPoolId: new Uint8Array(
//                 Buffer.from(liquidityPoolId, "hex")
//               ),
//               maxAmountA: "10", // Amount for assetA (native)
//               maxAmountB: "20", // Amount for assetB (TradeToken)
//               minPrice: { n: 1, d: 2 },
//               maxPrice: { n: 2, d: 1 },
//             })
//           )
//           .setTimeout(30)
//           .build();
//         const signedDepositTx = await window.diam.sign(
//           depositTx.toXDR(),
//           true,
//           NETWORK_PASSPHRASE
//         );
//         const depositResponse = await server.submitTransaction(signedDepositTx);
//         addLog(
//           "Liquidity deposit successful. Tx Hash: " + depositResponse.hash
//         );
//       } catch (error) {
//         addLog("Error during liquidity deposit: " + error.toString());
//       }

//       // 7. Save pool details for later deposit/withdraw operations
//       let liquidityPoolIdBuffer = null;
//       if (liquidityPoolId !== "N/A") {
//         liquidityPoolIdBuffer = new Uint8Array(
//           Buffer.from(liquidityPoolId, "hex")
//         );
//         addLog("LiquidityPoolIdBuffer created.");
//       } else {
//         liquidityPoolIdBuffer = new Uint8Array();
//         addLog("Fallback: using empty buffer for LiquidityPoolIdBuffer.");
//       }
//       const details = { lpAsset, liquidityPoolId, liquidityPoolIdBuffer };
//       setPoolDetails(details);
//       setTransactionStatus("success");
//       setTransactionMessage(
//         `Pool created successfully. Pool ID: ${liquidityPoolId}`
//       );
//       setTransactionHash(lpTrustResponse ? lpTrustResponse.hash : "N/A");
//       addLog("Liquidity Pool created successfully. Details saved.");
//       addLog("=== Pool creation flow completed ===");
//     } catch (error) {
//       addLog("Error creating pool: " + error.toString());
//     }
//     setLoading(false);
//   };

//   return (
//     <Container maxWidth="sm" sx={{ mt: 4 }}>
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
//         <Typography variant="h5" align="center">
//           Create Liquidity Pool
//         </Typography>
//         <TextField
//           fullWidth
//           label="Token A"
//           value={tokenA}
//           onChange={(e) => setTokenA(e.target.value)}
//           margin="normal"
//           InputProps={{
//             style: {
//               color: "#fff",
//               border: "1px solid #FFFFFF4D",
//             },
//             endAdornment: (
//               <InputAdornment position="end">
//                 <AiOutlinePlusCircle />
//               </InputAdornment>
//             ),
//           }}
//         />

//         <Autocomplete
//           options={assetCodes}
//           value={assetCode}
//           onChange={(_, val) => setAssetCode(val || "BIDEN")}
//           fullWidth
//           disableClearable
//           sx={{ mt: 2, mb: 2, input: { color: "#fff" } }}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               label="Select Token B Code"
//               variant="outlined"
//               InputProps={{
//                 ...params.InputProps,
//                 style: { color: "#fff", border: "1px solid #FFFFFF4D" },
//               }}
//             />
//           )}
//         />

//         <TextField
//           fullWidth
//           label="Token B"
//           value={tokenB}
//           onChange={(e) => setTokenB(e.target.value)}
//           margin="normal"
//           InputProps={{
//             style: {
//               color: "#fff",
//               border: "1px solid #FFFFFF4D",
//             },
//             endAdornment: (
//               <InputAdornment position="end">
//                 <AiOutlinePlusCircle />
//               </InputAdornment>
//             ),
//           }}
//         />

//         <CustomButton
//           onClick={handleCreatePool}
//           disabled={loading}
//           fullWidth
//           variant="contained"
//           style={{ marginTop: "1rem" }}
//         >
//           {loading ? <CircularProgress size={24} /> : "Create Pool"}
//         </CustomButton>
//       </Box>

//       <TransactionModal
//         open={modalOpen}
//         onClose={() => setModalOpen(false)}
//         status={transactionStatus}
//         message={transactionMessage}
//       />
//     </Container>
//   );
// };

// export default CreatePoolPage;

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
  const [step, setStep] = useState(0); // 0 = select fee, 1 = deposit
  const [tokenA, setTokenA] = useState("native");
  const [tokenB, setTokenB] = useState("");
  const [assetCodes, setAssetCodes] = useState([]);
  const [assetCode, setAssetCode] = useState("");
  const [selectedFeeTier, setSelectedFeeTier] = useState("0.05%");
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
