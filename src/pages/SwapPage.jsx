// src/pages/SwapPage.jsx
import React, { useState } from "react";
import {
  Asset,
  Aurora,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from "diamnet-sdk";

const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";

const SwapPage = () => {
  const [logs, setLogs] = useState([]);

  // In a real app, you would use the connected wallet's account instead of generating a new keypair.
  const dummyBuyerKeypair = Keypair.random();

  const logMessage = (msg) => setLogs((prev) => [...prev, msg]);

  const performSwap = async () => {
    try {
      // Example swap operation using pathPaymentStrictSend:
      const buyerAccount = await server.loadAccount(dummyBuyerKeypair.publicKey());
      const transaction = new TransactionBuilder(buyerAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.pathPaymentStrictSend({
            sendAsset: Asset.native(),
            sendAmount: "10",
            destination: "GDUMMYDESTINATIONADDRESS", // Replace with an actual destination
            destAsset: new Asset("TradeToken", "GISSUERADDRESS"), // Replace with your asset details
            destMin: "5",
            path: [Asset.native(), new Asset("TradeToken", "GISSUERADDRESS")],
          })
        )
        .setTimeout(100)
        .build();

      transaction.sign(dummyBuyerKeypair);
      const response = await server.submitTransaction(transaction);
      logMessage(`✅ Swap executed (Tx: ${response.hash})`);
    } catch (error) {
      logMessage(`❌ Swap error: ${error?.response?.data || error}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Swap Tokens</h2>
      <button onClick={performSwap}>Perform Swap</button>
      <div>
        {logs.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
    </div>
  );
};

export default SwapPage;
