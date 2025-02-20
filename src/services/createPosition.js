import Web3 from "web3";
import BigNumber from "bignumber.js";
import nftPositionManagerABI from "../ABI/nftPositionManagerABI.json";
import erc20ABI from "../ABI/ercABI.json";

const ETH_NODE_URL = "https://evm-rpc.testnet-1.nibiru.fi";
const nftPositionManagerAddress = "0xF293E305d3aa515d531f87c79Cbe7db9DfE96810";

if (!ETH_NODE_URL) {
  throw new Error("Missing ETH_NODE_URL in environment variables.");
}

const web3 = new Web3(new Web3.providers.HttpProvider(ETH_NODE_URL));
const nftPositionManager = new web3.eth.Contract(
  nftPositionManagerABI,
  nftPositionManagerAddress
);

const approveToken = async (tokenAddress, spender, amount, recipient) => {
  console.log("Approve Token Parameters:", {
    tokenAddress,
    spender,
    amount,
    recipient,
  });

  if (!tokenAddress || !tokenAddress.startsWith("0x")) {
    throw new Error("Invalid token address.");
  }
  if (!spender || !spender.startsWith("0x")) {
    throw new Error("Invalid spender address.");
  }
  if (!recipient || !recipient.startsWith("0x")) {
    throw new Error("Invalid recipient address.");
  }

  const web3 = window.ethereum
    ? new Web3(window.ethereum)
    : new Web3(new Web3.providers.HttpProvider(ETH_NODE_URL));
  const tokenContract = new web3.eth.Contract(erc20ABI, tokenAddress);

  const tx = tokenContract.methods.approve(spender, amount);

  let gas;
  try {
    gas = await tx.estimateGas({ from: recipient });
  } catch (error) {
    console.error("Gas estimation failed for approval:", error);
    throw new Error("Failed to estimate gas for token approval.");
  }

  const gasPrice = await web3.eth.getGasPrice();
  const data = tx.encodeABI();

  const txHash = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        to: tokenAddress,
        from: recipient,
        gas: web3.utils.toHex(gas),
        gasPrice: web3.utils.toHex(gasPrice),
        data,
      },
    ],
  });

  return txHash;
};

const calculateTick = (price) => {
  const tickSpacing = 60;
  const tick = Math.floor(Math.log(price) / Math.log(1.0001));
  return Math.floor(tick / tickSpacing) * tickSpacing;
};

const mintPosition = async ({
  token0,
  token1,
  fee,
  priceLower,
  priceUpper,
  amount0Desired,
  amount1Desired,
  recipient,
}) => {
  console.log("Mint Position Inputs:", {
    token0,
    token1,
    fee,
    priceLower,
    priceUpper,
    amount0Desired,
    amount1Desired,
    recipient,
  });

  if (!token0 || !token0.startsWith("0x")) {
    throw new Error("Invalid token0 address.");
  }
  if (!token1 || !token1.startsWith("0x")) {
    throw new Error("Invalid token1 address.");
  }
  if (!recipient || !recipient.startsWith("0x")) {
    throw new Error("Invalid recipient address.");
  }

  const two = new BigNumber(2);
  const sqrtPriceLower = new BigNumber(priceLower)
    .sqrt()
    .multipliedBy(two.exponentiatedBy(96))
    .integerValue(BigNumber.ROUND_FLOOR)
    .toFixed();
  const sqrtPriceUpper = new BigNumber(priceUpper)
    .sqrt()
    .multipliedBy(two.exponentiatedBy(96))
    .integerValue(BigNumber.ROUND_FLOOR)
    .toFixed();

  const mintTx = nftPositionManager.methods.mint({
    token0,
    token1,
    fee,
    tickLower: calculateTick(priceLower),
    tickUpper: calculateTick(priceUpper),
    amount0Desired,
    amount1Desired,
    amount0Min: "0",
    amount1Min: "0",
    recipient,
    deadline: Math.floor(Date.now() / 1000) + 600,
  });

  const gas = await mintTx.estimateGas({ from: recipient });
  const gasPrice = await web3.eth.getGasPrice();
  const data = mintTx.encodeABI();

  try {
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: recipient,
          to: nftPositionManagerAddress,
          gas: web3.utils.toHex(gas),
          gasPrice: web3.utils.toHex(gasPrice),
          data,
        },
      ],
    });

    console.log("Transaction Hash:", txHash);
    return txHash;
  } catch (error) {
    console.error("Error in mintPosition:", error.message, error.stack);
    throw error;
  }
};

const getAllPositions = async (userAddress) => {
  if (!userAddress || !userAddress.startsWith("0x")) {
    throw new Error("Invalid user address.");
  }

  console.log("Fetching positions for user:", userAddress);

  try {
    const balance = await nftPositionManager.methods
      .balanceOf(userAddress)
      .call();
    console.log("Number of positions:", balance);

    const positions = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = await nftPositionManager.methods
        .tokenOfOwnerByIndex(userAddress, i)
        .call();
      console.log("Token ID:", tokenId);

      const positionData = await nftPositionManager.methods
        .positions(tokenId)
        .call();

      // Fetch symbols for token0 and token1 if needed
      const token0Symbol = await getTokenSymbol(positionData.token0);
      const token1Symbol = await getTokenSymbol(positionData.token1);

      positions.push({
        tokenId,
        token0: positionData.token0,
        token1: positionData.token1,
        token0Symbol: token0Symbol || "Unknown",
        token1Symbol: token1Symbol || "Unknown",
        fee: positionData.fee,
        tickLower: positionData.tickLower,
        tickUpper: positionData.tickUpper,
        liquidity: positionData.liquidity,
        feeGrowthInside0LastX128: positionData.feeGrowthInside0LastX128,
        feeGrowthInside1LastX128: positionData.feeGrowthInside1LastX128,
        tokensOwed0: positionData.tokensOwed0,
        tokensOwed1: positionData.tokensOwed1,
      });
    }

    console.log("All Positions:", positions);
    return positions;
  } catch (error) {
    console.error("Error fetching positions:", error.message);
    throw error;
  }
};

// Helper to fetch token symbol
const getTokenSymbol = async (tokenAddress) => {
  if (!tokenAddress || !tokenAddress.startsWith("0x")) return null;
  try {
    const tokenContract = new web3.eth.Contract(erc20ABI, tokenAddress);
    return await tokenContract.methods.symbol().call();
  } catch (error) {
    console.error("Error fetching token symbol:", error.message);
    return null;
  }
};




const increaseLiquidity = async ({
  tokenId,
  amount0Desired,
  amount1Desired,
  amount0Min,
  amount1Min,
  recipient,
  deadline,
}) => {
  try {
    const tx = await nftPositionManager.methods
      .increaseLiquidity({
        tokenId,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        recipient,
        deadline,
      })
      .send({ from: recipient });

    console.log("Liquidity increased successfully:", tx.transactionHash);
    return tx.transactionHash;
  } catch (error) {
    console.error("Error increasing liquidity:", error.message);
    throw error;
  }
};



const decreaseLiquidity = async ({
  tokenId,
  liquidity,
  amount0Min,
  amount1Min,
  recipient,
  deadline,
}) => {
  try {
    const tx = await nftPositionManager.methods
      .decreaseLiquidity({
        tokenId,
        liquidity,
        amount0Min,
        amount1Min,
        recipient,
        deadline,
      })
      .send({ from: recipient });

    console.log("Liquidity decreased successfully:", tx.transactionHash);
    return tx.transactionHash;
  } catch (error) {
    console.error("Error decreasing liquidity:", error.message);
    throw error;
  }
};



export { approveToken, mintPosition, getAllPositions, getTokenSymbol , increaseLiquidity, decreaseLiquidity};
