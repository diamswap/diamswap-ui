import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import NonfungiblePositionManagerABI from '../../contractABI.json';
import SwapRouterABI from '../../swapABI.json';

const positionManagerAddress = "0x017c909FF57dD4b32EBf6112f7359471b4c8EeA2";
const swapRouterAddress = "0x2AeD17bd0E9584da9baf85e8fB911e8Fe1984542";

const Testing = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [positionManager, setPositionManager] = useState(null);
  const [swapRouter, setSwapRouter] = useState(null);

  // States for Create Position form
  const [createPosParams, setCreatePosParams] = useState({
    token0Address: "0x71c743e58cCf50a3472da4565116AEd7182153db", // USDC
    token1Address: "0x92592E7014BdE02f1B2d74592bd1B690b1C45B61", // WETH
    fee: "3000",
    amount0: "0.1",
    amount1: "0.5",
  });

  // States for Add Liquidity form
  const [addLiquidityParams, setAddLiquidityParams] = useState({
    tokenId: '',
    amount0Desired: '500',
    amount1Desired: '0.25'
  });

  // States for Decrease Liquidity form
  const [decreaseLiquidityParams, setDecreaseLiquidityParams] = useState({
    tokenId: '',
    liquidity: '',
    amount0Min: '0',
    amount1Min: '0'
  });

  // States for Swap
  const [swapParams, setSwapParams] = useState({
    tokenIn: '0xA0b86991C6218B36C1d19D4a2e9Eb0cE3606EB48',  // USDC
    tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    fee: '3000', // Fee tier for the pool
    amountIn: '100', // 100 USDC
    amountOutMinimum: '0'
  });

  // States for Claim Fees
  const [claimFeesParams, setClaimFeesParams] = useState({
    tokenId: '',
    amount0Max: '1000000000',
    amount1Max: '1000000000'
  });

  // States for Read Positions
  const [positionsAddress, setPositionsAddress] = useState('');
  const [positionsResult, setPositionsResult] = useState(null);

  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    async function initWeb3() {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const _web3 = new Web3(window.ethereum);
        const _accounts = await _web3.eth.getAccounts();

        const _positionManager = new _web3.eth.Contract(
          NonfungiblePositionManagerABI,
          positionManagerAddress
        );
        const _swapRouter = new _web3.eth.Contract(
          SwapRouterABI,
          swapRouterAddress
        );

        setWeb3(_web3);
        setAccounts(_accounts);
        setPositionManager(_positionManager);
        setSwapRouter(_swapRouter);
      } else {
        console.error('No Ethereum provider found. Install MetaMask.');
      }
    }
    initWeb3();
  }, []);

  const network = 'mainnet';
  const etherscanBase = network === 'mainnet'
    ? 'https://etherscan.io'
    : `https://${network}.etherscan.io`;

  // CREATE POSITION
  const createPosition = async () => {
    try {
      const { token0Address, token1Address, fee, amount0, amount1 } = createPosParams;
      const tickLower = -887220;
      const tickUpper = 887220;

      // Convert amounts
      const amount0Desired = Web3.utils.toWei(amount0, 'mwei');  // USDC (6 decimals)
      const amount1Desired = Web3.utils.toWei(amount1, 'ether'); // WETH (18 decimals)

      const amount0Min = 0;
      const amount1Min = 0;
      const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

      const tx = await positionManager.methods.mint({
        token0: token0Address,
        token1: token1Address,
        fee: parseInt(fee),
        tickLower,
        tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        recipient: accounts[0],
        deadline
      }).send({ from: accounts[0] });

      console.log("Creating position with params:", tx);
      await positionManager.methods.mint(tx)
        .send({ from: accounts[0], gas: 900000 }); // Adjust gas as needed

      console.log("Position created successfully!");

      setReceipt(tx);
      setPositionsResult(null);
    } catch (err) {
      setReceipt({ error: err.message });
      setPositionsResult(null);
    }
  };

  // ADD LIQUIDITY
  const addLiquidity = async () => {
    try {
      const { tokenId, amount0Desired, amount1Desired } = addLiquidityParams;
      const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

      // Convert amounts to Wei
      const amount0 = Web3.utils.toWei(amount0Desired, "mwei"); // USDC (6 decimals)
      const amount1 = Web3.utils.toWei(amount1Desired, "ether"); // WETH (18 decimals)

      console.log("Increasing liquidity...");

      // Call increaseLiquidity function
      const tx = await positionManager.methods
        .increaseLiquidity({
          tokenId,
          amount0Desired: amount0,
          amount1Desired: amount1,
          amount0Min: 0,
          amount1Min: 0,
          deadline,
        })
        .send({ from: accounts[0], gas: 1500000 });

      console.log("Liquidity increased successfully!", tx);

      setReceipt(tx);
    } catch (err) {
      console.error("Error increasing liquidity:", err.message);
      setReceipt({ error: err.message });
    }
  };

  // DECREASE LIQUIDITY
  const decreaseLiquidity = async () => {
    try {
      const { tokenId, liquidity, amount0Min, amount1Min } = decreaseLiquidityParams;
      const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

      const tx = await positionManager.methods.decreaseLiquidity({
        tokenId,
        liquidity,
        amount0Min,
        amount1Min,
        deadline
      }).send({ from: accounts[0] });

      setReceipt(tx);
      setPositionsResult(null);
    } catch (err) {
      setReceipt({ error: err.message });
      setPositionsResult(null);
    }
  };

  // SWAP
  const performSwap = async () => {
    try {
      const { tokenIn, tokenOut, fee, amountIn, amountOutMinimum } = swapParams;
      const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

      // Convert amounts for USDC/WETH scenario. Adjust if different tokens:
      // If tokenIn is USDC (6 decimals):
      const amountInWei = Web3.utils.toWei(amountIn, 'mwei');
      const amountOutMinWei = Web3.utils.toWei(amountOutMinimum, 'ether');

      const params = {
        tokenIn,
        tokenOut,
        fee: parseInt(fee),
        recipient: accounts[0],
        deadline,
        amountIn: amountInWei,
        amountOutMinimum: amountOutMinWei,
        sqrtPriceLimitX96: 0
      };

      const tx = await swapRouter.methods.exactInputSingle(params).send({ from: accounts[0] });

      setReceipt(tx);
      setPositionsResult(null);
    } catch (err) {
      setReceipt({ error: err.message });
      setPositionsResult(null);
    }
  };

  // CLAIM FEES
  const claimFees = async () => {
    try {
      const { tokenId, amount0Max, amount1Max } = claimFeesParams;

      const tx = await positionManager.methods.collect({
        tokenId,
        recipient: accounts[0],
        amount0Max,
        amount1Max
      }).send({ from: accounts[0] });

      setReceipt(tx);
      setPositionsResult(null);
    } catch (err) {
      setReceipt({ error: err.message });
      setPositionsResult(null);
    }
  };

  // READ ALL POSITIONS
  const getAllPositionsForUser = async () => {
    try {
      const userAddress = positionsAddress;
      const balance = await positionManager.methods.balanceOf(userAddress).call();
      const positions = [];

      for (let i = 0; i < balance; i++) {
        const tokenId = await positionManager.methods.tokenOfOwnerByIndex(userAddress, i).call();
        const position = await positionManager.methods.positions(tokenId).call();
        positions.push({ tokenId, position });
      }

      setPositionsResult(positions);
      setReceipt(null);
    } catch (err) {
      setPositionsResult([{ error: err.message }]);
      setReceipt(null);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#FFF', backgroundColor: '#0F111A', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px' }}>Uniswap V3 with Web3.js</h1>

      {/* CREATE POSITION */}
      <h2>Create Position</h2>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Token0 (USDC): </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={createPosParams.token0Address}
          onChange={(e) => setCreatePosParams({...createPosParams, token0Address: e.target.value})}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Token1 (WETH): </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={createPosParams.token1Address}
          onChange={(e) => setCreatePosParams({...createPosParams, token1Address: e.target.value})}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Fee: </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={createPosParams.fee}
          onChange={(e) => setCreatePosParams({...createPosParams, fee: e.target.value})}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Amount0 (USDC): </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={createPosParams.amount0}
          onChange={(e) => setCreatePosParams({...createPosParams, amount0: e.target.value})}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Amount1 (WETH): </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={createPosParams.amount1}
          onChange={(e) => setCreatePosParams({...createPosParams, amount1: e.target.value})}
        />
      </div>
      <button
        onClick={createPosition}
        style={{
          backgroundColor: '#4C57FF',
          color: '#FFF',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Create Position
      </button>

      {/* ADD LIQUIDITY */}
      <h2 style={{ marginTop: '30px' }}>Add Liquidity</h2>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Token ID: </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={addLiquidityParams.tokenId}
          onChange={(e) => setAddLiquidityParams({...addLiquidityParams, tokenId: e.target.value})}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Amount0 Desired (USDC): </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={addLiquidityParams.amount0Desired}
          onChange={(e) => setAddLiquidityParams({...addLiquidityParams, amount0Desired: e.target.value})}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Amount1 Desired (WETH): </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={addLiquidityParams.amount1Desired}
          onChange={(e) => setAddLiquidityParams({...addLiquidityParams, amount1Desired: e.target.value})}
        />
      </div>
      <button
        onClick={addLiquidity}
        style={{
          backgroundColor: '#4C57FF',
          color: '#FFF',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Add Liquidity
      </button>

      {/* DECREASE LIQUIDITY */}
      <h2 style={{ marginTop: '30px' }}>Decrease Liquidity</h2>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Token ID: </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={decreaseLiquidityParams.tokenId}
          onChange={(e) => setDecreaseLiquidityParams({ ...decreaseLiquidityParams, tokenId: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Liquidity: </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          placeholder="Units of liquidity"
          value={decreaseLiquidityParams.liquidity}
          onChange={(e) => setDecreaseLiquidityParams({ ...decreaseLiquidityParams, liquidity: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Amount0Min: </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={decreaseLiquidityParams.amount0Min}
          onChange={(e) => setDecreaseLiquidityParams({ ...decreaseLiquidityParams, amount0Min: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Amount1Min: </label>
        <input
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333' }}
          value={decreaseLiquidityParams.amount1Min}
          onChange={(e) => setDecreaseLiquidityParams({ ...decreaseLiquidityParams, amount1Min: e.target.value })}
        />
      </div>
      <button
        onClick={decreaseLiquidity}
        style={{
          backgroundColor: '#4C57FF',
          color: '#FFF',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Decrease Liquidity
      </button>

      {/* SWAP */}
      <h2 style={{ marginTop: '30px' }}>Swap</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>Token In: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={swapParams.tokenIn}
          onChange={(e) => setSwapParams({ ...swapParams, tokenIn: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Token Out: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={swapParams.tokenOut}
          onChange={(e) => setSwapParams({ ...swapParams, tokenOut: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Fee: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={swapParams.fee}
          onChange={(e) => setSwapParams({ ...swapParams, fee: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Amount In: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={swapParams.amountIn}
          onChange={(e) => setSwapParams({ ...swapParams, amountIn: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Amount Out Minimum: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={swapParams.amountOutMinimum}
          onChange={(e) => setSwapParams({ ...swapParams, amountOutMinimum: e.target.value })}
        />
      </div>
      <button
        onClick={performSwap}
        style={{
          backgroundColor: '#4C57FF',
          color: '#FFF',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Perform Swap
      </button>

      {/* CLAIM FEES */}
      <h2 style={{ marginTop: '30px' }}>Claim Fees</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>Token ID: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={claimFeesParams.tokenId}
          onChange={(e) => setClaimFeesParams({ ...claimFeesParams, tokenId: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Amount0Max: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={claimFeesParams.amount0Max}
          onChange={(e) => setClaimFeesParams({ ...claimFeesParams, amount0Max: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Amount1Max: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={claimFeesParams.amount1Max}
          onChange={(e) => setClaimFeesParams({ ...claimFeesParams, amount1Max: e.target.value })}
        />
      </div>
      <button
        onClick={claimFees}
        style={{
          backgroundColor: '#4C57FF',
          color: '#FFF',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Claim Fees
      </button>

      {/* READ ALL POSITIONS */}
      <h2 style={{ marginTop: '30px' }}>Read All Positions for User</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>User Address: </label>
        <input
          style={{ width: '100%', padding: '8px', marginBottom: '5px', borderRadius: '4px', border: '1px solid #333' }}
          value={positionsAddress}
          onChange={(e) => setPositionsAddress(e.target.value)}
        />
      </div>
      <button
        onClick={getAllPositionsForUser}
        style={{
          backgroundColor: '#4C57FF',
          color: '#FFF',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Get Positions
      </button>

      <h2 style={{ marginTop: '30px' }}>Result</h2>
      <div style={{ background: '#1A1C27', padding: '20px', borderRadius: '8px', overflowX: 'auto' }}>
        {positionsResult ? (
          // Display positions result if available
          <div style={{ color: '#B3B3B3', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(positionsResult, null, 2)}
          </div>
        ) : receipt ? (
          receipt.error ? (
            <div style={{ color: '#FF4C4C' }}>Error: {receipt.error}</div>
          ) : (
            <div style={{ color: '#B3B3B3' }}>
              <div><strong>Transaction Successful!</strong></div>
              <div style={{ marginTop: '10px' }}>
                <strong>Transaction Hash:</strong>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  background: '#2B2D3F',
                  padding: '5px',
                  borderRadius: '4px',
                  marginTop: '5px'
                }}>
                  {receipt.transactionHash}
                </div>
                <a
                  href={`${etherscanBase}/tx/${receipt.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4C57FF', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}
                >
                  View on Etherscan
                </a>
              </div>

              <div style={{ marginTop: '20px' }}>
                <strong>Block Number:</strong> {receipt.blockNumber}
              </div>
              <div style={{ marginTop: '10px' }}>
                <strong>Gas Used:</strong> {receipt.gasUsed}
              </div>
            </div>
          )
        ) : (
          <div style={{ color: '#AAA' }}>No transaction or data yet.</div>
        )}
      </div>
    </div>
  );
};

export default Testing;