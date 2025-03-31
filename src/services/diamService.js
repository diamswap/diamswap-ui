// src/services/diamService.js
import diamnetSdk, { getLiquidityPoolId, LiquidityPoolAsset, TransactionBuilder } from "diamnet-sdk";
import { Buffer } from "buffer";
import { PinataSDK } from "pinata-web3";
import { Blob } from "blob-polyfill";

export const initDiamnet = () => {
  
  const DiamSdkModule =  import("diamnet-sdk");
  const diamnetSdk = DiamSdkModule.default || DiamSdkModule;
  const server = new diamnetSdk.Aurora.Server(
    "https://diamtestnet.diamcircle.io/"
  );;
  return { server };
};

export const createLiquidityPoolFromAssets = async ({
  server,
  userKeypair,
  assetA,
  assetB,
  feeParameter,
}) => {
  try {
    const lpAsset = new LiquidityPoolAsset(assetA, assetB, feeParameter);
    const liquidityPoolId = getLiquidityPoolId("constant_product", lpAsset).toString("hex");
    const userAccount = await server.loadAccount(userKeypair.publicKey());
    const tx = new TransactionBuilder(userAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.changeTrust({ asset: lpAsset }))
      .setTimeout(30)
      .build();

    tx.sign(userKeypair);
    const response = await server.submitTransaction(tx);

    return {
      success: true,
      liquidityPoolId,
      transactionHash: response.hash,
    };
  } catch (error) {
    console.error("Error creating liquidity pool:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
