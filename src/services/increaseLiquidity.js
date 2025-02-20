import { ethers } from "ethers";
import nftPositionManagerABI from "../ABI/nftPositionManagerABI.json";

const nftPositionManagerAddress = "0xF293E305d3aa515d531f87c79Cbe7db9DfE96810"; // Replace with the correct address


export const increaseLiquidity = async ({
    tokenId,
    token0,
    token1,
    amount0Desired,
    amount1Desired,
    amount0Min,
    amount1Min,
    deadline,
  }) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userEOA = await signer.getAddress();
  
      const nftPositionManager = new ethers.Contract(
        nftPositionManagerAddress,
        nftPositionManagerABI,
        signer
      );
  
      // Convert amounts to BigNumber
      const parsedAmount0Desired = ethers.utils.parseUnits(amount0Desired, 18);
      const parsedAmount1Desired = ethers.utils.parseUnits(amount1Desired, 18);
      const parsedAmount0Min = ethers.utils.parseUnits(amount0Min, 18);
      const parsedAmount1Min = ethers.utils.parseUnits(amount1Min, 18);
  
      // Ensure token0 < token1 based on address
      if (token0.toLowerCase() > token1.toLowerCase()) {
        [token0, token1] = [token1, token0];
      }
  
      // Approve tokens
      const approveToken = async (tokenAddress, spender, amount) => {
        const erc20ABI = [
          {
            constant: false,
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            type: "function",
          },
        ];
  
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
  
        const tx = await tokenContract.approve(spender, amount);
        await tx.wait();
        console.log(`Approval successful for ${tokenAddress}`);
      };
  
      await approveToken(token0, nftPositionManagerAddress, parsedAmount0Desired);
      await approveToken(token1, nftPositionManagerAddress, parsedAmount1Desired);
  
      // Call increaseLiquidity
      const tx = await nftPositionManager.increaseLiquidity({
        tokenId,
        amount0Desired: parsedAmount0Desired,
        amount1Desired: parsedAmount1Desired,
        amount0Min: parsedAmount0Min,
        amount1Min: parsedAmount1Min,
        deadline,
      });
  
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.transactionHash);
  
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error increasing liquidity:", error.message);
      throw error;
    }
  };
  
  export const decreaseLiquidity = async ({
    tokenId,
    liquidityToRemove,
    amount0Min,
    amount1Min,
    deadline,
  }) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      const nftPositionManager = new ethers.Contract(
        nftPositionManagerAddress,
        nftPositionManagerABI,
        signer
      );
  
      // Convert values to BigNumber
      const parsedLiquidity = ethers.BigNumber.from(liquidityToRemove);
      const parsedAmount0Min = ethers.BigNumber.from(amount0Min);
      const parsedAmount1Min = ethers.BigNumber.from(amount1Min);
  
      // Call decreaseLiquidity
      const tx = await nftPositionManager.decreaseLiquidity({
        tokenId,
        liquidity: parsedLiquidity,
        amount0Min: parsedAmount0Min,
        amount1Min: parsedAmount1Min,
        deadline,
      });
  
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.transactionHash);
  
      return receipt.transactionHash;
    } catch (error) {
      console.error("Error decreasing liquidity:", error.message);
      throw error;
    }
  };
  