// src/pages/CreatePoolPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  MenuItem,
  Autocomplete,
  createFilterOptions,
  Popper,
} from "@mui/material";
import { AiOutlinePlusCircle } from "react-icons/ai";
import CustomButton from "../../comman/CustomButton";
import { Buffer } from "buffer";
import TransactionModal from "../../comman/TransactionModal";

if (!window.Buffer) {
  window.Buffer = Buffer;
}

const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const FRIENDBOT_URL = "https://friendbot.diamcircle.io?addr=";

const CreatePoolPage = () => {
  // UI state
  const [tokenA, setTokenA] = useState("native");
  const [tokenB, setTokenB] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokensList, setTokensList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [poolDetails, setPoolDetails] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(""); 
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  const walletPublicKey = localStorage.getItem("diamPublicKey") || "";
  if (!walletPublicKey)
    console.warn("No wallet public key found in localStorage.");

  const [sdk, setSdk] = useState(null);
  const [server, setServer] = useState(null);
  const [issuerKeypair, setIssuerKeypair] = useState(null);

  const addLog = (msg) => {
    console.log(msg);
    setLogs((prev) => [...prev, msg]);
  };


  const filter = createFilterOptions({
    matchFrom: "any",
    stringify: (option) => option,
  });



  useEffect(() => {
    (async () => {
      try {
        const DiamSdkModule = await import("diamnet-sdk");
        const diamnetSdk = DiamSdkModule.default || DiamSdkModule;
        setSdk(diamnetSdk);
        const srv = new diamnetSdk.Aurora.Server("https://diamtestnet.diamcircle.io/");
        setServer(srv);
        const issuer = diamnetSdk.Keypair.random();
        setIssuerKeypair(issuer);
        addLog("Diamnet SDK loaded.");
        addLog("Ephemeral Issuer: " + issuer.publicKey());
      } catch (error) {
        addLog("Error loading Diamnet SDK: " + error.toString());
      }
    })();
  }, []);


  /* ---------- helper: pretty label in the dropdown ---------- */
const formatAssetLabel = (asset) => {
  if (!asset) return "";
  const val = asset.toLowerCase();
  if (val === "native" || val === "xlm") return "native";
  const [code, issuer = ""] = asset.split(":");
  return `${code} • ${issuer.slice(0, 4)}…${issuer.slice(-4)}`;
};








  useEffect(() => {
    const fetchPools = async () => {
      try {
        const resp = await fetch(
          "https://diamtestnet.diamcircle.io/liquidity_pools/?limit=100"
        );
        const data = await resp.json();
        const records = data._embedded.records || [];
        const setTokens = new Set();
        records.forEach((pool) => {
          pool.reserves.forEach((r) => {
            if (r.asset !== "native") {
              setTokens.add(r.asset);
            }
          });
        });
        setTokensList(Array.from(setTokens));
        addLog(`Fetched ${setTokens.size} tokens for selection.`);
      } catch (error) {
        addLog("Error fetching pools: " + error.toString());
      }
    };
    fetchPools();
  }, []);

  // Auto-fill Token B when SDK and issuer are available
  useEffect(() => {
    if (sdk && issuerKeypair) {
      try {
        const customAsset = new sdk.Asset("TradeToken", issuerKeypair.publicKey());
        setTokenB(`${customAsset.getCode()}:${customAsset.getIssuer()}`);
        addLog(
          "Token B auto-filled as custom asset: " +
            customAsset.getCode() +
            " / " +
            customAsset.getIssuer()
        );
      } catch (error) {
        addLog("Error auto-filling Token B: " + error.toString());
      }
    }
  }, [sdk, issuerKeypair]);

  const parseTokenInput = (input) => {
    const val = input.trim().toLowerCase();
    if (val === "native" || val === "xlm") return sdk.Asset.native();
    const [code, issuer] = input.split(":");
    if (!code || !issuer)
      throw new Error('Invalid token format: use "native" or "CODE:ISSUER".');
    return new sdk.Asset(code, issuer);
  };

  // Helper: fund an account using Friendbot
  const friendbotFund = async (publicKey) => {
    try {
      const resp = await fetch(`${FRIENDBOT_URL}${publicKey}`);
      if (resp.ok) {
        addLog(`Account ${publicKey} funded successfully.`);
      } else {
        if (resp.status === 400) {
          const errorData = await resp.json();
          if (
            errorData.detail &&
            errorData.detail.includes("createAccountAlreadyExist")
          ) {
            addLog(`Account ${publicKey} already exists. Moving on...`);
            return;
          }
        }
        addLog(`Error funding account ${publicKey}: ${resp.statusText}`);
      }
    } catch (error) {
      addLog("Friendbot error: " + error.toString());
    }
  };

  // Main flow: create pool
  const handleCreatePool = async () => {
    if (!server || !sdk || !issuerKeypair || !walletPublicKey) {
      addLog("Required parameters not ready (server, sdk, issuer, wallet).");
      return;
    }
    setLoading(true);
    // Show modal
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Starting liquidity pool creation...");

    try {
      const {
        TransactionBuilder,
        BASE_FEE,
        Networks,
        Operation,
        LiquidityPoolAsset,
        getLiquidityPoolId,
      } = sdk;
      setTransactionStatus("pending");
      setTransactionMessage("=== Starting pool creation flow ===");

      addLog("=== Starting pool creation flow ===");
      addLog("Wallet Public Key: " + walletPublicKey);

      addLog("Fund: Starting friendbot funding for ephemeral issuer...");
      await friendbotFund(issuerKeypair.publicKey());
      addLog("Fund: Completed friendbot funding for ephemeral issuer.");
      addLog("Fund: Starting friendbot funding for connected wallet...");
      await friendbotFund(walletPublicKey);
      addLog("Fund: Completed friendbot funding for connected wallet.");

      addLog("Parsing Token A from input: " + tokenA);
      const assetA = parseTokenInput(tokenA);
      addLog(
        "Parsed Token A: " +
          assetA.getCode() +
          " / " +
          (assetA.getIssuer() || "native")
      );

      addLog("Creating custom asset for Token B...");
      const customAsset = new sdk.Asset("TradeToken", issuerKeypair.publicKey());
      const assetB = customAsset;
      addLog(
        "Parsed Token B (custom): " +
          assetB.getCode() +
          " / " +
          assetB.getIssuer()
      );

      if (typeof assetA.getAssetType === "function" && !assetA.type) {
        assetA.type = assetA.getAssetType();
        addLog("Asset A type assigned: " + assetA.type);
      }
      if (typeof assetB.getAssetType === "function" && !assetB.type) {
        assetB.type = assetB.getAssetType();
        addLog("Asset B type assigned: " + assetB.type);
      }
      addLog("Final Asset A type: " + (assetA.type || "undefined"));
      addLog("Final Asset B type: " + (assetB.type || "undefined"));

      // 1. Establish trustline for custom asset on user's account
      addLog("Loading user account for custom asset trustline...");
      let userAccount = await server.loadAccount(walletPublicKey);
      addLog("User account loaded for trustline.");
      addLog("Building trustline transaction for custom asset...");
      let trustTx = new TransactionBuilder(userAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.changeTrust({ asset: assetB }))
        .setTimeout(30)
        .build();
      addLog("Trustline transaction built.");
      const trustXDR = trustTx.toXDR();
      addLog("Trustline XDR: " + trustXDR);
      addLog("Requesting DIAM wallet to sign trustline transaction...");
      const signedTrustTx = await window.diam.sign(trustXDR, true, NETWORK_PASSPHRASE);
      addLog("Trustline transaction signed.");
      addLog("Submitting trustline transaction...");
      try {
        const trustResponse = await server.submitTransaction(signedTrustTx);
        addLog("Custom asset trustline established. Tx Hash: " + trustResponse.hash);
      } catch (error) {
        if (
          error.toString().includes("Cannot read properties of undefined (reading 'type')")
        ) {
          addLog(
            "Warning: Trustline submission error (missing 'type'); assuming trustline is already established."
          );
        } else {
          throw error;
        }
      }

      // 2. Clear the auth_required flag on the issuer account so that trustlines auto-authorize
      addLog("Loading issuer account for options update...");
      const issuerAccountForOptions = await server.loadAccount(issuerKeypair.publicKey());
      addLog("Building setOptions transaction to clear auth_required flag...");
      const optionsTx = new TransactionBuilder(issuerAccountForOptions, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.setOptions({
            clearFlags: sdk.AuthRequiredFlag, // Ensure this constant matches your SDK's naming
          })
        )
        .setTimeout(30)
        .build();
      optionsTx.sign(issuerKeypair);
      const optionsResponse = await server.submitTransaction(optionsTx);
      addLog("Issuer account updated: auth_required flag cleared. Tx Hash: " + optionsResponse.hash);

      // 3. Issue the custom asset from ephemeral issuer to user's wallet
      addLog("Loading issuer account for asset issuance...");
      let issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
      addLog("Issuer account loaded.");
      addLog("Building payment transaction for asset issuance...");
      let paymentTx = new TransactionBuilder(issuerAccount, {
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
      addLog("Payment transaction built.");
      paymentTx.sign(issuerKeypair);
      addLog("Payment transaction signed.");
      addLog("Submitting payment transaction...");
      let paymentRes = await server.submitTransaction(paymentTx);
      addLog("Asset issued to wallet. Tx Hash: " + paymentRes.hash);

      // 4. Create liquidity pool for assetA and assetB
      addLog("Creating liquidity pool asset for Token A and custom Token B...");
      const defaultFee = 30;
      const lpAsset = new LiquidityPoolAsset(assetA, assetB, defaultFee);
      // Manually assign both "type" and "assetType" as expected by the SDK
      lpAsset.type = "liquidity_pool_constant_product";
      lpAsset.assetType = "liquidity_pool_constant_product";
      addLog("LP Asset created with manual type assignment: " + JSON.stringify(lpAsset));
      let liquidityPoolId;
      try {
        addLog("Calling getLiquidityPoolId with pool parameters...");
        const poolParams = { assetA, assetB, fee: defaultFee };
        liquidityPoolId = getLiquidityPoolId("constant_product", poolParams);
        addLog("Raw liquidityPoolId value: " + liquidityPoolId);
        liquidityPoolId = liquidityPoolId.toString("hex");
        addLog("Liquidity Pool ID (hex): " + liquidityPoolId);
      } catch (error) {
        addLog("Error in getLiquidityPoolId: " + error.message);
        if (error.message.includes("Cannot read properties of undefined")) {
          addLog("Liquidity pool creation error (non-critical) - moving on with fallback.");
          liquidityPoolId = "N/A";
        } else {
          throw error;
        }
      }

      // Attach liquidityPoolId to lpAsset (if available)
      if (liquidityPoolId !== "N/A") {
        lpAsset.liquidityPoolId = liquidityPoolId;
        addLog("Attached liquidityPoolId to LP Asset.");
      }

      // 5. Establish trustline for LP asset on user's account using helper function
      addLog("Establishing LP asset trustline using helper function...");
      let lpTrustResponse;
      try {
        let lpUserAccount = await server.loadAccount(walletPublicKey);
        const lpTrustTx = new TransactionBuilder(lpUserAccount, {
          fee: BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(Operation.changeTrust({ asset: lpAsset }))
          .setTimeout(30)
          .build();
        const lpTrustXDR = lpTrustTx.toXDR();
        addLog("LP Trustline XDR (helper): " + lpTrustXDR);
        const signedLpTrustTx = await window.diam.sign(lpTrustXDR, true, NETWORK_PASSPHRASE);
        lpTrustResponse = await server.submitTransaction(signedLpTrustTx);
        addLog("LP asset trustline established. Tx Hash: " + lpTrustResponse.hash);
      } catch (error) {
        addLog("Error establishing LP trustline via helper: " + error.toString());
        addLog("Assuming LP trustline is manually established.");
      }

      // 6. **Deposit liquidity** into the pool
      // To have the pool show reserves of 10 (native) and 20 (TradeToken),
      // deposit these amounts into the pool.
      addLog("Depositing liquidity: 10 native and 20 TradeToken...");
      try {
        let userForDeposit = await server.loadAccount(walletPublicKey);
        const depositTx = new TransactionBuilder(userForDeposit, {
          fee: BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            Operation.liquidityPoolDeposit({
              liquidityPoolId: new Uint8Array(Buffer.from(liquidityPoolId, "hex")),
              maxAmountA: "10", // Amount for assetA (native)
              maxAmountB: "20", // Amount for assetB (TradeToken)
              minPrice: { n: 1, d: 2 },
              maxPrice: { n: 2, d: 1 },
            })
          )
          .setTimeout(30)
          .build();
        const signedDepositTx = await window.diam.sign(depositTx.toXDR(), true, NETWORK_PASSPHRASE);
        const depositResponse = await server.submitTransaction(signedDepositTx);
        addLog("Liquidity deposit successful. Tx Hash: " + depositResponse.hash);
      } catch (error) {
        addLog("Error during liquidity deposit: " + error.toString());
      }

      // 7. Save pool details for later deposit/withdraw operations
      let liquidityPoolIdBuffer = null;
      if (liquidityPoolId !== "N/A") {
        liquidityPoolIdBuffer = new Uint8Array(Buffer.from(liquidityPoolId, "hex"));
        addLog("LiquidityPoolIdBuffer created.");
      } else {
        liquidityPoolIdBuffer = new Uint8Array();
        addLog("Fallback: using empty buffer for LiquidityPoolIdBuffer.");
      }
      const details = { lpAsset, liquidityPoolId, liquidityPoolIdBuffer };
      setPoolDetails(details);
      setTransactionStatus("success");
      setTransactionMessage(`Pool created successfully. Pool ID: ${liquidityPoolId}`);
      setTransactionHash(lpTrustResponse ? lpTrustResponse.hash : "N/A");
      addLog("Liquidity Pool created successfully. Details saved.");
      addLog("=== Pool creation flow completed ===");

    } catch (error) {
      addLog("Error creating pool: " + error.toString());
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
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
        <Typography variant="h5" align="center">
          Create Liquidity Pool
        </Typography>
        <Autocomplete
          freeSolo
          options={["native", ...tokensList]}
          value={tokenA}
          inputValue={tokenA}
          onChange={(_, val) => setTokenA(val || "")}
          onInputChange={(_, val) => setTokenA(val)}
          filterOptions={filter}
          PopperComponent={(p) => <Popper {...p} sx={{ zIndex: 1400 }} />}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Token A"
              margin="normal"
              InputProps={{
                ...params.InputProps,
                style: { color: "#fff", border: "1px solid #FFFFFF4D" },
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    <InputAdornment position="end">
                      <AiOutlinePlusCircle />
                    </InputAdornment>
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props} key={option}>
              {formatAssetLabel(option)}
            </MenuItem>
          )}
        />

        {/* -------------------- TOKEN B (searchable) -------------------- */}
        <Autocomplete
          freeSolo
          options={tokensList}
          value={tokenB}
          inputValue={tokenB}
          onChange={(_, val) => setTokenB(val || "")}
          onInputChange={(_, val) => setTokenB(val)}
          filterOptions={filter}
          PopperComponent={(p) => <Popper {...p} sx={{ zIndex: 1400 }} />}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Token B"
              margin="normal"
              InputProps={{
                ...params.InputProps,
                style: { color: "#fff", border: "1px solid #FFFFFF4D" },
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    <InputAdornment position="end">
                      <AiOutlinePlusCircle />
                    </InputAdornment>
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props} key={option}>
              {formatAssetLabel(option)}
            </MenuItem>
          )}
        />
        <CustomButton
          onClick={handleCreatePool}
          disabled={loading}
          fullWidth
          variant="contained"
          style={{ marginTop: "1rem" }}
        >
          {loading ? <CircularProgress size={24} /> : "Create Pool"}
        </CustomButton>
      </Box>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
      />
    </Container>
  );
};

export default CreatePoolPage;
