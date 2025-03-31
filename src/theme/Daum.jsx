import React, { useState, useEffect } from "react";
import { Button, Typography, Box } from "@mui/material";
import { Buffer } from "buffer";
import { PinataSDK } from "pinata-web3";
import { Blob } from "blob-polyfill";

const DiamSwap = () => {
    const [logs, setLogs] = useState([]);
    const [running, setRunning] = useState(false);
    const [sdk, setSdk] = useState(null);
    const [server, setServer] = useState(null);
    // We'll store our keypairs, asset, etc. in the data state object.
    const [data, setData] = useState({});

    const addLog = (message) => {
        setLogs((prev) => [...prev, message]);
    };

    // On mount, import diamnet-sdk and initialize keypairs and server
    useEffect(() => {
        async function init() {
            try {
                const DiamSdkModule = await import("diamnet-sdk");
                const diamnetSdk = DiamSdkModule.default || DiamSdkModule;
                setSdk(diamnetSdk);
                const srv = new diamnetSdk.Aurora.Server("https://diamtestnet.diamcircle.io/");
                setServer(srv);
                const nftIssuer = diamnetSdk.Keypair.random();
                const distributor = diamnetSdk.Keypair.random();
                const buyer = diamnetSdk.Keypair.random();
                const customAsset = new diamnetSdk.Asset("TradeToken", nftIssuer.publicKey());
                setData({
                    nftIssuerKeypair: nftIssuer,
                    distributorKeypair: distributor,
                    buyerKeypair: buyer,
                    customAsset: customAsset,
                    feeParameter: 30,
                    lpAsset: null,
                    liquidityPoolId: null,
                    distributorNFT: null,
                    distributorNFTName: null,
                });
                addLog("Initialized SDK and keypairs.");
                addLog("NFT Issuer Public Key: " + nftIssuer.publicKey());
                addLog("Distributor Public Key: " + distributor.publicKey());
                addLog("Buyer Public Key: " + buyer.publicKey());
            } catch (error) {
                addLog("Error initializing diamnet-sdk: " + error.toString());
            }
        }
        init();
    }, []);

    // Run all DEX operations as one workflow
    const runDEXOperations = async () => {
        if (!server || !sdk || !data.nftIssuerKeypair) return;
        setRunning(true);
        try {
            const { TransactionBuilder, BASE_FEE, Networks, Operation, Asset, LiquidityPoolAsset, getLiquidityPoolId } = sdk;

            // 1. Fund Accounts
            const fundAccount = async (kp) => {
                const response = await fetch(`https://friendbot.diamcircle.io?addr=${kp.publicKey()}`);
                if (response.ok) {
                    addLog(`Account ${kp.publicKey()} funded.`);
                }
            };
            await fundAccount(data.nftIssuerKeypair);
            await fundAccount(data.distributorKeypair);
            await fundAccount(data.buyerKeypair);

            // 2. Establish Trustlines for customAsset (for distributor and buyer)
            const establishTrustline = async (kp, asset) => {
                const account = await server.loadAccount(kp.publicKey());
                const tx = new TransactionBuilder(account, {
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
            await establishTrustline(data.distributorKeypair, data.customAsset);
            await establishTrustline(data.buyerKeypair, data.customAsset);

            // 3. Issue Asset from NFT issuer to distributor
            let account = await server.loadAccount(data.nftIssuerKeypair.publicKey());
            let tx = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(
                    Operation.payment({
                        destination: data.distributorKeypair.publicKey(),
                        asset: data.customAsset,
                        amount: "100",
                    })
                )
                .setTimeout(30)
                .build();
            tx.sign(data.nftIssuerKeypair);
            let response = await server.submitTransaction(tx);
            addLog("Asset issued successfully: " + response.hash);

            // 4. Calculate Liquidity Pool and establish trustline for LP asset
            const lpAsset = new LiquidityPoolAsset(Asset.native(), data.customAsset, data.feeParameter);
            const liquidityPoolId = getLiquidityPoolId("constant_product", lpAsset).toString("hex");
            setData(prev => ({ ...prev, lpAsset, liquidityPoolId }));
            addLog("Liquidity Pool ID: " + liquidityPoolId);
            account = await server.loadAccount(data.distributorKeypair.publicKey());
            tx = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(Operation.changeTrust({ asset: lpAsset }))
                .setTimeout(30)
                .build();
            tx.sign(data.distributorKeypair);
            response = await server.submitTransaction(tx);
            addLog(`Trustline established for LP asset for distributor: ${response.hash}`);

            // 5. Upload Metadata to IPFS and store it on-chain
            const pinata = new PinataSDK({
                pinataJwt: process.env.REACT_APP_PINATA_JWT,
                pinataGateway: process.env.REACT_APP_GATEWAY_URL,
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
            const upload = await pinata.upload.file(blob, { fileName: `metadata_${Date.now()}.json` });
            addLog("Metadata uploaded to IPFS: " + JSON.stringify(upload));
            const metadataURI = upload.IpfsHash;
            addLog("Metadata URI: " + metadataURI);
            // Create distributor NFT asset and store metadata on-chain
            const distributorNFTName = `NFT${data.distributorKeypair.publicKey().slice(-4)}`;
            const distributorNFT = new Asset(distributorNFTName, data.nftIssuerKeypair.publicKey());
            // Save distributor NFT asset in state
            setData(prev => ({ ...prev, distributorNFT, distributorNFTName }));
            account = await server.loadAccount(data.distributorKeypair.publicKey());
            tx = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(Operation.manageData({ name: distributorNFTName.slice(0, 64), value: metadataURI }))
                .setTimeout(30)
                .build();
            tx.sign(data.distributorKeypair);
            response = await server.submitTransaction(tx);
            addLog(`Metadata stored on-chain with key ${distributorNFTName.slice(0, 64)}: ${response.hash}`);

            // *** NEW STEP: Establish Trustline for distributor NFT ***
            account = await server.loadAccount(data.distributorKeypair.publicKey());
            tx = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(Operation.changeTrust({ asset: distributorNFT }))
                .setTimeout(30)
                .build();
            tx.sign(data.distributorKeypair);
            response = await server.submitTransaction(tx);
            addLog(`Trustline established for distributor NFT: ${response.hash}`);

            // 6. Deposit Liquidity and Issue NFT
            const liquidityPoolIdBuffer = new Uint8Array(Buffer.from(liquidityPoolId, "hex"));
            account = await server.loadAccount(data.distributorKeypair.publicKey());
            tx = new TransactionBuilder(account, {
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
            addLog("Liquidity provided and NFT issued: " + response.hash);

            // 7. Query Liquidity Pool Details
            response = await server.liquidityPools().liquidityPoolId(liquidityPoolId).call();
            addLog("Liquidity Pool Details: " + JSON.stringify(response));

            // 8. Perform Swap: buyer swaps 10 native for custom asset (min 5)
            account = await server.loadAccount(data.buyerKeypair.publicKey());
            tx = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(
                    Operation.pathPaymentStrictSend({
                        sendAsset: Asset.native(),
                        sendAmount: "10",
                        destination: data.distributorKeypair.publicKey(),
                        destAsset: data.customAsset,
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
        } catch (error) {
            if (error.response && error.response.data) {
                addLog("Error: " + JSON.stringify(error.response.data));
            } else {
                addLog("Error: " + error.toString());
            }
        }
        setRunning(false);
    };

    return (
        <Box sx={{ mt: 4 ,padding: "20px", borderRadius: "10px" }}>
            <Button variant="contained" onClick={runDEXOperations} disabled={running}>
                {running ? "Running..." : "Run DEX Operations"}
            </Button>
            <Box
                sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: "black",
                    maxHeight: "400px",
                    overflowY: "auto",
                }}
            >
                {logs.map((log, index) => (
                    <Typography key={index} variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {log}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

export default DiamSwap;
