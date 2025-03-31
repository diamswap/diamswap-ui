// src/pages/LiquidityPage.jsx
import React, { useState } from "react";
import {
  Asset,
  Aurora,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  LiquidityPoolAsset,
  getLiquidityPoolId,
} from "diamnet-sdk";
import { Buffer } from "buffer";

if (!window.Buffer) {
  window.Buffer = Buffer;
}

const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";

const LiquidityPage = () => {
  const [logs, setLogs] = useState([]);

  // For demo, use a dummy account (in production, use the connected wallet account)
  const dummyDistributorKeypair = Keypair.random();

  // Define your custom asset (for example, TradeToken issued by a known issuer)
  const customAsset = new Asset("TradeToken", dummyDistributorKeypair.publicKey());

  // Set up the liquidity pool asset (native asset and TradeToken with fee 30)
  const lpAsset = new LiquidityPoolAsset(Asset.native(), customAsset, 30);
  const liquidityPoolIdHex = getLiquidityPoolId("constant_product", lpAsset).toString("hex");
  const liquidityPoolIdBuffer = Buffer.from(liquidityPoolIdHex, "hex");

  const logMessage = (msg) => setLogs((prev) => [...prev, msg]);

  const depositLiquidity = async () => {
    try {
      // First, establish trustline for the pool share asset (lpAsset) – omitted for brevity.
      const distributorAccount = await server.loadAccount(dummyDistributorKeypair.publicKey());
      const transaction = new TransactionBuilder(distributorAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: liquidityPoolIdBuffer,
            maxAmountA: "50", // maximum amount of TradeToken to deposit
            maxAmountB: "100", // maximum amount of native asset (DIAM) to deposit
            minPrice: { numerator: 1, denominator: 2 },
            maxPrice: { numerator: 2, denominator: 1 },
          })
        )
        .setTimeout(100)
        .build();

      transaction.sign(dummyDistributorKeypair);
      const response = await server.submitTransaction(transaction);
      logMessage(`✅ Liquidity deposited (Tx: ${response.hash})`);
    } catch (error) {
      logMessage(`❌ Deposit error: ${error?.response?.data || error}`);
    }
  };

  const withdrawLiquidity = async () => {
    try {
      const distributorAccount = await server.loadAccount(dummyDistributorKeypair.publicKey());
      const transaction = new TransactionBuilder(distributorAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.liquidityPoolWithdraw({
            liquidityPoolId: liquidityPoolIdBuffer,
            amount: "10", // pool shares to burn
            minAmountA: "1",
            minAmountB: "1",
          })
        )
        .setTimeout(100)
        .build();

      transaction.sign(dummyDistributorKeypair);
      const response = await server.submitTransaction(transaction);
      logMessage(`✅ Liquidity withdrawn (Tx: ${response.hash})`);
    } catch (error) {
      logMessage(`❌ Withdraw error: ${error?.response?.data || error}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Liquidity Pool</h2>
      <button onClick={depositLiquidity}>Deposit Liquidity</button>
      <button onClick={withdrawLiquidity}>Withdraw Liquidity</button>
      <div>
        {logs.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
    </div>
  );
};

export default LiquidityPage;
