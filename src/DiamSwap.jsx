


// src/components/CreatePoolDEX.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { PinataSDK } from "pinata-web3";
import { Blob } from "blob-polyfill";
import TransactionModal from "./comman/TransactionModal";
import CustomButton from "./comman/CustomButton";
import { Buffer } from "buffer";

if (!window.Buffer) {
  window.Buffer = Buffer;
}

const CreatePoolDEX = () => {
  const [tokenA, setTokenA] = useState("native");
  const [tokenB, setTokenB] = useState("");
  const [sdk, setSdk] = useState(null);
  const [server, setServer] = useState(null);
  const [data, setData] = useState({});
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");

  // Helper to add logs to state (displayed in UI)
  const addLog = (message) => {
    setLogs((prev) => [...prev, message]);
  };

  // Initialize SDK, server, and generate keypairs
  useEffect(() => {
    (async () => {
      try {
        const DiamSdkModule = await import("diamnet-sdk");
        const diamnetSdk = DiamSdkModule.default || DiamSdkModule;
        setSdk(diamnetSdk);

        // Create server instance
        const srv = new diamnetSdk.Aurora.Server(
          "https://diamtestnet.diamcircle.io/"
        );
        setServer(srv);

        // Create 3 random keypairs
        const nftIssuer = diamnetSdk.Keypair.random();
        const distributor = diamnetSdk.Keypair.random();
        const buyer = diamnetSdk.Keypair.random();

        // Create a default custom asset
        const customAsset = new diamnetSdk.Asset(
          "TradeToken",
          nftIssuer.publicKey()
        );

        setData({
          nftIssuerKeypair: nftIssuer,
          distributorKeypair: distributor,
          buyerKeypair: buyer,
          customAsset,
          lpAsset: null,
          liquidityPoolId: null,
          liquidityPoolIdBuffer: null,
          distributorNFT: null,
          distributorNFTName: null,
        });

        addLog("Initialized SDK and keypairs.");
        addLog("NFT Issuer: " + nftIssuer.publicKey());
        addLog("Distributor: " + distributor.publicKey());
        addLog("Buyer: " + buyer.publicKey());
      } catch (error) {
        addLog("Error initializing Diamnet SDK: " + error.toString());
      }
    })();
  }, []);

  // Once sdk and customAsset are ready, update tokenB to match customAsset
  useEffect(() => {
    if (sdk && data.customAsset) {
      // Use the same format as expected: "CODE:ISSUER"
      setTokenB(`${data.customAsset.getCode()}:${data.customAsset.getIssuer()}`);
    }
  }, [sdk, data.customAsset]);

  // Helper: parse user input for token
  const parseTokenInput = (input) => {
    const val = input.trim().toLowerCase();
    if (val === "native" || val === "xlm") {
      return sdk.Asset.native();
    }
    const [code, issuer] = input.split(":");
    if (!code || !issuer) {
      throw new Error('Invalid token format: use "native" or "CODE:ISSUER".');
    }
    return new sdk.Asset(code, issuer);
  };

  // Combined DEX operation workflow
  const handleCreatePoolAndRun = async () => {
    if (!server || !sdk || !data.nftIssuerKeypair) {
      addLog("SDK or keypairs not ready yet.");
      return;
    }

    setRunning(true);
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("");

    try {
      const {
        TransactionBuilder,
        BASE_FEE,
        Networks,
        Operation,
        LiquidityPoolAsset,
        getLiquidityPoolId,
        Asset,
      } = sdk;

      // 2.1 Friendbot: fund all accounts
      const fundAccount = async (kp) => {
        const resp = await fetch(
          `https://friendbot.diamcircle.io?addr=${kp.publicKey()}`
        );
        if (resp.ok) {
          addLog(`Account ${kp.publicKey()} funded.`);
        } else {
          addLog(`Friendbot failed for ${kp.publicKey()}`);
        }
      };
      await fundAccount(data.nftIssuerKeypair);
      await fundAccount(data.distributorKeypair);
      await fundAccount(data.buyerKeypair);

      // 2.2 Let user pick tokenA and tokenB from the UI
      const assetA = parseTokenInput(tokenA);
      const assetB = parseTokenInput(tokenB);
      addLog(
        `Parsed token A = ${assetA.getCode()} / ${assetA.getIssuer() || "native"}`
      );
      addLog(
        `Parsed token B = ${assetB.getCode()} / ${assetB.getIssuer() || "native"}`
      );

      // 2.3 Establish trustlines for the custom asset (distributor, buyer)
      const establishTrustline = async (kp, asset) => {
        const acct = await server.loadAccount(kp.publicKey());
        const tx = new TransactionBuilder(acct, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(Operation.changeTrust({ asset }))
          .setTimeout(30)
          .build();
        tx.sign(kp);
        const response = await server.submitTransaction(tx);
        addLog(`Trustline established for ${kp.publicKey()}: ${response.hash}`);
      };
      // Use assetB (which now should be equal to data.customAsset) for trustlines
      await establishTrustline(data.distributorKeypair, assetB);
      await establishTrustline(data.buyerKeypair, assetB);

      // 2.4 Issue asset from nftIssuer to distributor (payment of the custom asset)
      let acct = await server.loadAccount(data.nftIssuerKeypair.publicKey());
      let tx = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: data.distributorKeypair.publicKey(),
            asset: data.customAsset,
            amount: "100", // Adjust the amount as needed
          })
        )
        .setTimeout(30)
        .build();
      tx.sign(data.nftIssuerKeypair);
      let response = await server.submitTransaction(tx);
      addLog("Asset issued successfully: " + response.hash);

      // 2.5 Create Liquidity Pool (LP asset) for assetA + assetB using a default valid fee (e.g. 30)
      const defaultFee = 30;
      const lpAsset = new LiquidityPoolAsset(assetA, assetB, defaultFee);
      const liquidityPoolId = getLiquidityPoolId("constant_product", lpAsset).toString("hex");
      addLog("Liquidity Pool ID: " + liquidityPoolId);

      // Store lpAsset and liquidity pool details in state for later use in deposit/withdraw
      setData((prev) => ({
        ...prev,
        lpAsset,
        liquidityPoolId,
        liquidityPoolIdBuffer: new Uint8Array(Buffer.from(liquidityPoolId, "hex")),
      }));

      // Distributor must trust the LP asset
      acct = await server.loadAccount(data.distributorKeypair.publicKey());
      tx = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.changeTrust({ asset: lpAsset }))
        .setTimeout(30)
        .build();
      tx.sign(data.distributorKeypair);
      response = await server.submitTransaction(tx);
      addLog(`Trustline established for LP asset: ${response.hash}`);

      // 2.6 Upload Metadata to IPFS & store it on chain
      const pinata = new PinataSDK({
        pinataJwt:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNTc5OGJmMS00OThhLTRkZTgtODc1MS1hMDA1OWRiNWM5ZDciLCJlbWFpbCI6Im5pc2hnYWJhLmFpQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI2YTkxOGU2NmFjMGVkNTM4Yzk2YSIsInNjb3BlZEtleVNlY3JldCI6IjRlYzdkYjEyMGYzOTNjOGQ0ZmQ0MGRmNTU4YmMwNzEzMGExMGQ0NTQwYTMzYzVhYTFjMTIzNTVhNTQ4ZDgzYWYiLCJleHAiOjE3Njk0NjQ4NTN9.DYTlB2r8rPbpWzaWPGiaYyj9KJZwxEVV4LwYSreL9Uk",
        pinataGateway: "https://gateway.pinata.cloud",
      });
      const metadata = {
        name: `Position NFT for Pool ${liquidityPoolId}`,
        description: "This NFT represents a position in a liquidity pool.",
        poolId: liquidityPoolId,
        userPublicKey: data.distributorKeypair.publicKey(),
        positionDetails: {
          maxAmountA: "10",
          maxAmountB: "20",
          minPrice: { n: 1, d: 2 },
          maxPrice: { n: 2, d: 1 },
        },
        timestamp: new Date().toISOString(),
      };
      const metadataJSON = JSON.stringify(metadata);
      const blob = new Blob([metadataJSON], { type: "application/json" });
      const upload = await pinata.upload.file(blob, {
        fileName: `metadata_${Date.now()}.json`,
      });
      addLog("Metadata uploaded: " + JSON.stringify(upload));
      const metadataURI = upload.IpfsHash;
      addLog("Metadata URI: " + metadataURI);

      // Create NFT asset
      const distributorNFTName = `NFT${data.distributorKeypair.publicKey().slice(-4)}`;
      const distributorNFT = new Asset(
        distributorNFTName,
        data.nftIssuerKeypair.publicKey()
      );

      // Store IPFS hash on chain with manageData
      acct = await server.loadAccount(data.distributorKeypair.publicKey());
      tx = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.manageData({
            name: distributorNFTName.slice(0, 64),
            value: metadataURI,
          })
        )
        .setTimeout(30)
        .build();
      tx.sign(data.distributorKeypair);
      response = await server.submitTransaction(tx);
      addLog(`Metadata stored on-chain with key ${distributorNFTName.slice(0, 64)}: ${response.hash}`);

      // 2.7 Trustline for the NFT
      acct = await server.loadAccount(data.distributorKeypair.publicKey());
      tx = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.changeTrust({ asset: distributorNFT }))
        .setTimeout(30)
        .build();
      tx.sign(data.distributorKeypair);
      response = await server.submitTransaction(tx);
      addLog("Trustline established for distributor NFT: " + response.hash);

      // 2.8 Deposit Liquidity & Issue NFT
      const liquidityPoolIdBuffer = new Uint8Array(Buffer.from(liquidityPoolId, "hex"));
      // Also update state so liquidityPoolDeposit/Withdraw can use it
      setData((prev) => ({ ...prev, liquidityPoolIdBuffer }));
      acct = await server.loadAccount(data.distributorKeypair.publicKey());
      tx = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: liquidityPoolIdBuffer,
            maxAmountA: "10",
            maxAmountB: "20",
            minPrice: { n: 1, d: 2 },
            maxPrice: { n: 2, d: 1 },
          })
        )
        .addOperation(
          Operation.payment({
            destination: data.distributorKeypair.publicKey(),
            asset: distributorNFT,
            amount: "1",
          })
        )
        .setTimeout(30)
        .build();
      tx.sign(data.distributorKeypair);
      response = await server.submitTransaction(tx);
      addLog("Liquidity deposited & NFT issued: " + response.hash);

      // 2.9 Query Pool Details
      let poolResp = await server.liquidityPools()
        .liquidityPoolId(liquidityPoolId)
        .call();
      addLog("Liquidity Pool Details: " + JSON.stringify(poolResp));

      // 2.10 Perform Swap
      acct = await server.loadAccount(data.buyerKeypair.publicKey());
      tx = new TransactionBuilder(acct, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.pathPaymentStrictSend({
            sendAsset: Asset.native(),
            sendAmount: "10",
            destination: data.distributorKeypair.publicKey(),
            destAsset: assetB,
            destMin: "5",
            path: [],
          })
        )
        .setTimeout(30)
        .build();
      tx.sign(data.buyerKeypair);
      response = await server.submitTransaction(tx);
      addLog("Swap executed successfully: " + response.hash);

      addLog("All operations completed successfully.");
      setTransactionStatus("success");
      setTransactionMessage("All DEX operations done!");
    } catch (error) {
      console.error("Error in handleCreatePoolAndRun:", error);
      addLog("Error: " + error.toString());
      setTransactionStatus("error");
      setTransactionMessage(error.message || "Something went wrong");
    }
    setRunning(false);
  };

  // Additional functions to deposit and withdraw liquidity from the pool
  const liquidityPoolDeposit = async () => {
    if (!sdk || !server || !data.distributorKeypair || !data.lpAsset || !data.liquidityPoolIdBuffer) {
      addLog("Liquidity pool deposit prerequisites not met.");
      return;
    }
    try {
      const { TransactionBuilder, BASE_FEE, Networks, Operation } = sdk;
      // Establish trustline for LP asset (if not already done)
      // Here we assume establishTrustline is the same helper as before:
      const establishTrustline = async (kp, asset) => {
        const acct = await server.loadAccount(kp.publicKey());
        const tx = new TransactionBuilder(acct, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(Operation.changeTrust({ asset }))
          .setTimeout(30)
          .build();
        tx.sign(kp);
        const resp = await server.submitTransaction(tx);
        addLog(`Trustline established for ${kp.publicKey()} (LP asset): ${resp.hash}`);
      };
      await establishTrustline(data.distributorKeypair, data.lpAsset);

      const distributorAccount = await server.loadAccount(data.distributorKeypair.publicKey());
      const transaction = new TransactionBuilder(distributorAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: data.liquidityPoolIdBuffer,
            maxAmountA: "50",  // Maximum customAsset to deposit
            maxAmountB: "100", // Maximum XLM to deposit
            minPrice: { numerator: 1, denominator: 2 },
            maxPrice: { numerator: 2, denominator: 1 },
          })
        )
        .setTimeout(100)
        .build();

      transaction.sign(data.distributorKeypair);
      const response = await server.submitTransaction(transaction);
      addLog(`✅ Liquidity deposited (Tx: ${response.hash})`);
    } catch (error) {
      addLog(`❌ Liquidity pool deposit error: ${error?.response?.data || error}`);
    }
  };

  const liquidityPoolWithdraw = async () => {
    if (!sdk || !server || !data.distributorKeypair || !data.liquidityPoolIdBuffer) {
      addLog("Liquidity pool withdrawal prerequisites not met.");
      return;
    }
    try {
      const { TransactionBuilder, BASE_FEE, Networks, Operation } = sdk;
      const distributorAccount = await server.loadAccount(data.distributorKeypair.publicKey());
      const transaction = new TransactionBuilder(distributorAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: data.liquidityPoolIdBuffer,
            amount: "10",   // Number of pool shares to burn
            minAmountA: "1", // Minimum TradeToken to receive
            minAmountB: "1", // Minimum XLM to receive
          })
        )
        .setTimeout(100)
        .build();

      transaction.sign(data.distributorKeypair);
      const response = await server.submitTransaction(transaction);
      addLog(`✅ Liquidity withdrawn (Tx: ${response.hash})`);
    } catch (error) {
      addLog(`❌ Liquidity pool withdrawal error: ${error?.response?.data || error}`);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px" }}>
      <Box
        sx={{
          backgroundColor: "rgba(0, 206, 229, 0.06)",
          margin: "2rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          position: "relative",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Create Liquidity Pool & Run DEX
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{ mb: 1 }}>Token A:</Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={tokenA}
            onChange={(e) => setTokenA(e.target.value)}
            placeholder='e.g. "native" or "MYTOKEN:GA..."'
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <AiOutlinePlusCircle size={24} color="#007bff" />
                </InputAdornment>
              ),
              style: {
                color: "#fff",
                backgroundColor: "transparent",
                borderRadius: "16px",
                border: "1px solid #FFFFFF4D",
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{ mb: 1 }}>Token B:</Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={tokenB}
            onChange={(e) => setTokenB(e.target.value)}
            placeholder='e.g. "native" or "TradeToken:GA..."'
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <AiOutlinePlusCircle size={24} color="#007bff" />
                </InputAdornment>
              ),
              style: {
                color: "#fff",
                backgroundColor: "transparent",
                borderRadius: "16px",
                border: "1px solid #FFFFFF4D",
              },
            }}
          />
        </Box>

        <CustomButton
          variant="contained"
          fullWidth
          onClick={handleCreatePoolAndRun}
          disabled={running}
        >
          {running ? <CircularProgress size={24} /> : "Run Full DEX Workflow"}
        </CustomButton>

        {/* Buttons for deposit and withdrawal */}
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <CustomButton
            variant="contained"
            fullWidth
            onClick={liquidityPoolDeposit}
            disabled={running}
          >
            Deposit Liquidity
          </CustomButton>
          <CustomButton
            variant="contained"
            fullWidth
            onClick={liquidityPoolWithdraw}
            disabled={running}
          >
            Withdraw Liquidity
          </CustomButton>
        </Box>
      </Box>

      {/* Render Logs */}
      <Box
        sx={{
          marginTop: "1rem",
          maxHeight: "200px",
          overflowY: "auto",
          backgroundColor: "#333",
          padding: "1rem",
          borderRadius: "8px",
        }}
      >
        {logs.map((log, index) => (
          <Typography key={index} variant="body2" sx={{ color: "#fff" }}>
            {log}
          </Typography>
        ))}
      </Box>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash=""
      />
    </Container>
  );
};

export default CreatePoolDEX;
