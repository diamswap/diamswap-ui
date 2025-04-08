import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Header";
import Pools from "./pages/Pools";
import ExplorePage from "./pages/Explore";
import PoolsOverview from "./pages/Pools/PoolsOverview";
import PoolDetail from "./pages/Pools/pool-detail";
import TabNavigation from "./components/Swap";
import Staking from "./pages/Staking";
import CreatePool from "./components/CreatePool";
import ViewPosition from "./components/ViewPosition";
import TokenExplorer from "./components/TokenExplorer";
import NewPosition from "./components/NewPool";
import Transactions from "./components/Transactions";
import Home from "./components/Home";
import Explore from "./components/Explore/Explore";
import Etherrum from "./pages/Pools/Etherrum";
import Positions from "./components/ViewPosition/YourPositions";
import PositionDetail from "./components/ViewPosition/PositionDetail";
import LiquidityManagement from "./components/LiquidityManagement";
import DecreaseLiquidity from "./components/LiquidityManagement/DecreaseLiquidity";
import PoolList from "./components/ViewPosition";
import DiamanteDashboard from "./components/DiamanteDashboard";

const App = () => {
  const [activeTab, setActiveTab] = useState("Swap");
  const [activeExploreTab, setActiveExploreTab] = useState("Swap");

  return (
    <>
      <Navbar setActiveTab={setActiveTab} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/swap" element={<TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />} />
        <Route path="/limit" element={<TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />} />
        <Route path="/send" element={<TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />} />
        <Route path="/buy" element={<TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />} />
        <Route path="/explore/tokens/:id" element={<Explore activeTab={activeExploreTab} setActiveTab={setActiveExploreTab} />} />
        <Route path="/explore/Etherrum" element={<Etherrum />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/pools" element={<Pools />} />
        <Route path="/profile" element={<DiamanteDashboard />} />

        <Route path="/staking" element={<Staking />} />
        <Route path="/pool/:poolId" element={<PoolDetail />} />
        <Route path="/pools/create" element={<CreatePool />} />
        <Route path="/pools/positions/create" element={<NewPosition />} />
        <Route path="/position/:id" element={<PositionDetail />} />
        <Route path="/position/view" element={<Positions />} />
        <Route path="/pools/view" element={<PoolList />} />
        <Route path="/explore/pools" element={<PoolsOverview />} />
        <Route path="/explore/tokens" element={<TokenExplorer />} />
        <Route path="/explore/transactions" element={<Transactions />} />
        <Route path="/increase-liquidity/:tokenId" element={<LiquidityManagement />} />
        <Route path="/decrease-liquidity/:tokenId" element={<DecreaseLiquidity />} />
      </Routes>
    </>
  );
};

export default App;










// // import React, { useState } from "react";
// // import {
// //   Asset,
// //   Aurora,
// //   Keypair,
// //   Operation,
// //   TransactionBuilder,
// //   BASE_FEE,
// //   LiquidityPoolAsset,
// //   getLiquidityPoolId,
// // } from "diamnet-sdk";
// // import { Buffer } from "buffer";

// // // Polyfill Buffer if needed
// // if (!window.Buffer) {
// //   window.Buffer = Buffer;
// // }

// // // Use the Diamante Testnet settings
// // const NETWORK_PASSPHRASE = "Diamante Testnet 2024";

// // // For the testnet friendbot
// // const friendbotUrl = "https://friendbot.diamcircle.io?addr=";

// // // DiamNet Aurora server for Diamante testnet
// // const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// // // A small helper for logging
// // const logMessage = (prevLogs, msg) => [...prevLogs, msg];

// // const DexFlow = () => {
// //   // --------------------------------------------------------------------------
// //   // State variables
// //   // --------------------------------------------------------------------------
// //   const [logs, setLogs] = useState([]);

// //   // Generate keypairs for issuer, distributor, and buyer
// //   const [issuerKeypair] = useState(() => Keypair.random());
// //   const [distributorKeypair] = useState(() => Keypair.random());
// //   const [buyerKeypair] = useState(() => Keypair.random());

// //   // Create your custom asset (TradeToken)
// //   const customAsset = new Asset("TradeToken", issuerKeypair.publicKey());

// //   const lpAsset = new LiquidityPoolAsset(Asset.native(), customAsset, 30);
// //   const liquidityPoolIdHex = getLiquidityPoolId("constant_product", lpAsset).toString("hex");
// //   const liquidityPoolIdBuffer = Buffer.from(liquidityPoolIdHex, "hex");

// //   // --------------------------------------------------------------------------
// //   // Helper functions
// //   // --------------------------------------------------------------------------
// //   const fundAccount = async (keypair) => {
// //     try {
// //       const response = await fetch(`${friendbotUrl}${keypair.publicKey()}`);
// //       if (response.ok) {
// //         setLogs((prev) => logMessage(prev, `✅ Funded: ${keypair.publicKey()}`));
// //       } else {
// //         setLogs((prev) =>
// //           logMessage(
// //             prev,
// //             `❌ Funding failed: ${keypair.publicKey()} - ${response.statusText}`
// //           )
// //         );
// //       }
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(prev, `❌ Error funding: ${keypair.publicKey()} - ${error}`)
// //       );
// //     }
// //   };

// //   /**
// //    * Establish a trustline for a given asset.
// //    */
// //   const establishTrustline = async (keypair, asset) => {
// //     try {
// //       const account = await server.loadAccount(keypair.publicKey());
// //       const transaction = new TransactionBuilder(account, {
// //         fee: BASE_FEE,
// //         networkPassphrase: NETWORK_PASSPHRASE,
// //       })
// //         .addOperation(
// //           Operation.changeTrust({
// //             asset,
// //             limit: "1000",
// //           })
// //         )
// //         .setTimeout(100)
// //         .build();

// //       transaction.sign(keypair);
// //       const response = await server.submitTransaction(transaction);
// //       setLogs((prev) =>
// //         logMessage(
// //           prev,
// //           `✅ Trustline established for ${keypair.publicKey()} (Asset: ${asset.getCode() || "PoolShare"}) | Tx: ${response.hash}`
// //         )
// //       );
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(
// //           prev,
// //           `❌ Trustline error for ${keypair.publicKey()}: ${error?.response?.data || error}`
// //         )
// //       );
// //     }
// //   };



  

// //   // For convenience, establish trustline for the custom asset
// //   const establishCustomAssetTrustline = async (kp) => {
// //     await establishTrustline(kp, customAsset);
// //   };

// //   /**
// //    * Issue the custom asset from issuer to distributor.
// //    */
// //   const issueAsset = async () => {
// //     try {
// //       const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
// //       const transaction = new TransactionBuilder(issuerAccount, {
// //         fee: BASE_FEE,
// //         networkPassphrase: NETWORK_PASSPHRASE,
// //       })
// //         .addOperation(
// //           Operation.payment({
// //             destination: distributorKeypair.publicKey(),
// //             asset: customAsset,
// //             amount: "500",
// //           })
// //         )
// //         .setTimeout(100)
// //         .build();

// //       transaction.sign(issuerKeypair);
// //       const response = await server.submitTransaction(transaction);
// //       setLogs((prev) =>
// //         logMessage(prev, `✅ Asset issued to distributor (Tx: ${response.hash})`)
// //       );
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(prev, `❌ Error issuing asset: ${error?.response?.data || error}`)
// //       );
// //     }
// //   };

// //   /**
// //    * Create a sell offer (distributor sells customAsset for XLM)
// //    */
// //   const createSellOffer = async () => {
// //     try {
// //       const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
// //       const transaction = new TransactionBuilder(distributorAccount, {
// //         fee: BASE_FEE,
// //         networkPassphrase: NETWORK_PASSPHRASE,
// //       })
// //         .addOperation(
// //           Operation.manageSellOffer({
// //             selling: customAsset,
// //             buying: Asset.native(),
// //             amount: "100",
// //             price: "0.5",
// //             offerId: "0",
// //           })
// //         )
// //         .setTimeout(100)
// //         .build();

// //       transaction.sign(distributorKeypair);
// //       const response = await server.submitTransaction(transaction);
// //       setLogs((prev) =>
// //         logMessage(prev, `✅ Sell offer created (Tx: ${response.hash})`)
// //       );
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(prev, `❌ Error creating sell offer: ${error?.response?.data || error}`)
// //       );
// //     }
// //   };

// //   /**
// //    * Create a buy offer (buyer buys customAsset with XLM)
// //    */
// //   const createBuyOffer = async () => {
// //     try {
// //       // Buyer must be funded and trust the custom asset first
// //       await fundAccount(buyerKeypair);
// //       await establishCustomAssetTrustline(buyerKeypair);

// //       const buyerAccount = await server.loadAccount(buyerKeypair.publicKey());
// //       const transaction = new TransactionBuilder(buyerAccount, {
// //         fee: BASE_FEE,
// //         networkPassphrase: NETWORK_PASSPHRASE,
// //       })
// //         .addOperation(
// //           Operation.manageBuyOffer({
// //             selling: Asset.native(),
// //             buying: customAsset,
// //             buyAmount: "10",
// //             price: "0.5",
// //             offerId: "0",
// //           })
// //         )
// //         .setTimeout(100)
// //         .build();

// //       transaction.sign(buyerKeypair);
// //       const response = await server.submitTransaction(transaction);
      
// //       setLogs((prev) =>
// //         logMessage(prev, `✅ Buy offer created (Tx: ${response.hash})`)
// //       );
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(prev, `❌ Error creating buy offer: ${error?.response?.data || error}`)
// //       );
// //     }
// //   };

// //   /**
// //    * Liquidity Pool Deposit:
// //    * - First, ensure the distributor trusts the liquidity pool share asset.
// //    * - Then, deposit customAsset and XLM into the pool.
// //    */
// //   const liquidityPoolDeposit = async () => {
// //     try {
// //       await establishTrustline(distributorKeypair, lpAsset);

// //       // Perform deposit operation using the derived pool ID (as Buffer)
// //       const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
// //       const transaction = new TransactionBuilder(distributorAccount, {
// //         fee: BASE_FEE,
// //         networkPassphrase: NETWORK_PASSPHRASE,
// //       })
// //         .addOperation(
// //           Operation.liquidityPoolDeposit({
// //             liquidityPoolId: liquidityPoolIdBuffer,
// //             maxAmountA: "50",  // Maximum customAsset to deposit
// //             maxAmountB: "100", // Maximum XLM to deposit
// //             minPrice: { numerator: 1, denominator: 2 }, // For example, 0.5
// //             maxPrice: { numerator: 2, denominator: 1 }, // For example, 2.0
// //           })
// //         )
// //         .setTimeout(100)
// //         .build();

// //       transaction.sign(distributorKeypair);
// //       const response = await server.submitTransaction(transaction);
// //       setLogs((prev) =>
// //         logMessage(prev, `✅ Liquidity deposited (Tx: ${response.hash})`)
// //       );
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(prev, `❌ Liquidity pool deposit error: ${error?.response?.data || error}`)
// //       );
// //     }
// //   };

// //   /**
// //    * Liquidity Pool Withdraw:
// //    * - Withdraw pool shares back into underlying assets.
// //    */
// //   const liquidityPoolWithdraw = async () => {
// //     try {
// //       const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
// //       const transaction = new TransactionBuilder(distributorAccount, {
// //         fee: BASE_FEE,
// //         networkPassphrase: NETWORK_PASSPHRASE,
// //       })
// //         .addOperation(
// //           Operation.liquidityPoolWithdraw({
// //             liquidityPoolId: liquidityPoolIdBuffer,
// //             amount: "10",   // Number of pool shares to burn
// //             minAmountA: "1", // Minimum TradeToken to receive
// //             minAmountB: "1", // Minimum XLM to receive
// //           })
// //         )
// //         .setTimeout(100)
// //         .build();

// //       transaction.sign(distributorKeypair);
// //       const response = await server.submitTransaction(transaction);
// //       setLogs((prev) =>
// //         logMessage(prev, `✅ Liquidity withdrawn (Tx: ${response.hash})`)
// //       );
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(prev, `❌ Liquidity pool withdrawal error: ${error?.response?.data || error}`)
// //       );
// //     }
// //   };

// //   /**
// //    * Path Payment Strict Send
// //    */
// //   const pathPaymentStrictSend = async () => {
// //     try {
// //       const buyerAccount = await server.loadAccount(buyerKeypair.publicKey());
// //       const transaction = new TransactionBuilder(buyerAccount, {
// //         fee: BASE_FEE,
// //         networkPassphrase: NETWORK_PASSPHRASE,
// //       })
// //         .addOperation(
// //           Operation.pathPaymentStrictSend({
// //             sendAsset: Asset.native(),
// //             sendAmount: "10",
// //             destination: distributorKeypair.publicKey(),
// //             destAsset: customAsset,
// //             destMin: "5",
// //             path: [Asset.native(), customAsset],
// //           })
// //         )
// //         .setTimeout(100)
// //         .build();

// //       transaction.sign(buyerKeypair);
// //       const response = await server.submitTransaction(transaction);
// //       setLogs((prev) =>
// //         logMessage(prev, `✅ Path Payment Strict Send executed (Tx: ${response.hash})`)
// //       );
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(prev, `❌ Error in Path Payment (strict send): ${error?.response?.data || error}`)
// //       );
// //     }
// //   };

// //   /**
// //    * Path Payment Strict Receive
// //    */
// //   const pathPaymentStrictReceive = async () => {
// //     try {
// //       const buyerAccount = await server.loadAccount(buyerKeypair.publicKey());
// //       const transaction = new TransactionBuilder(buyerAccount, {
// //         fee: BASE_FEE,
// //         networkPassphrase: NETWORK_PASSPHRASE,
// //       })
// //         .addOperation(
// //           Operation.pathPaymentStrictReceive({
// //             sendAsset: Asset.native(),
// //             sendMax: "15",
// //             destination: distributorKeypair.publicKey(),
// //             destAsset: customAsset,
// //             destAmount: "10",
// //             path: [Asset.native(), customAsset],
// //           })
// //         )
// //         .setTimeout(100)
// //         .build();

// //       transaction.sign(buyerKeypair);
// //       const response = await server.submitTransaction(transaction);
// //       setLogs((prev) =>
// //         logMessage(prev, `✅ Path Payment Strict Receive executed (Tx: ${response.hash})`)
// //       );
// //     } catch (error) {
// //       setLogs((prev) =>
// //         logMessage(prev, `❌ Error in Path Payment (strict receive): ${error?.response?.data || error}`)
// //       );
// //     }
// //   };

// //   // --------------------------------------------------------------------------
// //   // Buttons / UI
// //   // --------------------------------------------------------------------------
// //   return (
// //     <div style={{ margin: "20px" }}>
// //       <h2>DiamNet DEX Flow Demo</h2>

// //       {/* Display the generated public keys */}
// //       <div>
// //         <p><strong>Issuer Public Key:</strong> {issuerKeypair.publicKey()}</p>
// //         <p><strong>Distributor Public Key:</strong> {distributorKeypair.publicKey()}</p>
// //         <p><strong>Buyer Public Key:</strong> {buyerKeypair.publicKey()}</p>
// //       </div>

// //       <hr />

// //       {/* Button set to run each operation */}
// //       <div style={{ marginBottom: "1em" }}>
// //         <button onClick={() => fundAccount(issuerKeypair)}>Fund Issuer</button>
// //         <button onClick={() => fundAccount(distributorKeypair)}>Fund Distributor</button>
// //         <button onClick={() => establishCustomAssetTrustline(distributorKeypair)}>
// //           Trustline (Distributor → TradeToken)
// //         </button>
// //       </div>

// //       <div style={{ marginBottom: "1em" }}>
// //         <button onClick={issueAsset}>Issue Asset</button>
// //         <button onClick={createSellOffer}>Create Sell Offer</button>
// //         <button onClick={createBuyOffer}>Create Buy Offer</button>
// //       </div>

// //       <div style={{ marginBottom: "1em" }}>
// //         <button onClick={liquidityPoolDeposit}>Liquidity Pool Deposit</button>
// //         <button onClick={liquidityPoolWithdraw}>Liquidity Pool Withdraw</button>
// //       </div>

// //       <div style={{ marginBottom: "1em" }}>
// //         <button onClick={pathPaymentStrictSend}>Path Payment Strict Send</button>
// //         <button onClick={pathPaymentStrictReceive}>Path Payment Strict Receive</button>
// //       </div>

// //       {/* Display logs */}
// //       <hr />
// //       <h3>Logs</h3>
// //       <div
// //         style={{
// //           border: "1px solid #ccc",
// //           padding: "10px",
// //           height: "200px",
// //           overflowY: "auto",
// //           background: "black",
// //           color: "white",
// //         }}
// //       >
// //         {logs.map((msg, i) => (
// //           <div key={i}>{msg}</div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // };

// // export default DexFlow;










































































