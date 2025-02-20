// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   Switch,
//   Divider,
//   CircularProgress,
// } from "@mui/material";
// import Web3 from "web3";
// import BigNumber from "bignumber.js";
// import nftPositionManagerABI from "../../ABI/nftPositionManagerABI.json"; // Replace with your ABI file
// import { useAccount } from "wagmi"; // Ensure wagmi is installed and configured

// const CollectFees = ({ position }) => {
//   console.log("position", position);
//   const { address, isConnected } = useAccount();

//   const [uncollectedFees, setUncollectedFees] = useState({});
//   const [totalFees, setTotalFees] = useState("0.00");
//   const [collectAsWETH, setCollectAsWETH] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");

//   const nftPositionManagerAddress =
//     "0xF293E305d3aa515d531f87c79Cbe7db9DfE96810"; // Replace with your contract address

//   // Fetch uncollected fees dynamically
//   const fetchUncollectedFees = async (address) => {
//     try {
//       const web3 = new Web3("https://evm-rpc.testnet-1.nibiru.fi"); // Replace with your RPC
//       const nftPositionManager = new web3.eth.Contract(
//         nftPositionManagerABI,
//         nftPositionManagerAddress
//       );

//       // Replace with your smart contract's method to fetch fees
//       const result = await nftPositionManager.methods
//         .getUncollectedFees(address)
//         .call();

//       // Parse the result and update state
//       const USDC = Web3.utils.fromWei(result[0], "ether");
//       const WETH = Web3.utils.fromWei(result[1], "ether");

//       setUncollectedFees({ USDC, WETH });
//       setTotalFees((parseFloat(USDC) + parseFloat(WETH)).toFixed(2));
//     } catch (err) {
//       console.error("Error fetching uncollected fees:", err);
//       setError("Failed to fetch uncollected fees.");
//     }
//   };

//   // Fetch fees when the component mounts or when the wallet address changes
//   useEffect(() => {
//     if (isConnected && address) {
//       fetchUncollectedFees(address);
//     }
//   }, [isConnected, address]);

//   const handleToggle = () => setCollectAsWETH((prev) => !prev);

//   const handleCollectFees = async () => {
//     setIsLoading(true);
//     setError("");

//     try {
//       if (!address) {
//         throw new Error("Please connect your wallet to proceed.");
//       }

//       const web3 = new Web3(window.ethereum);
//       const nftPositionManager = new web3.eth.Contract(
//         nftPositionManagerABI,
//         nftPositionManagerAddress
//       );

//       const amount0Max = new BigNumber(2).pow(128).minus(1).toFixed();
//       const amount1Max = new BigNumber(2).pow(128).minus(1).toFixed();

//       const tx = await nftPositionManager.methods
//         .collect({
//           tokenId: 1, // Replace with your logic for tokenId
//           recipient: address,
//           amount0Max,
//           amount1Max,
//         })
//         .send({ from: address });

//       console.log("Transaction successful:", tx);
//     } catch (err) {
//       console.error("Error collecting fees:", err);
//       setError("Failed to collect fees.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Box
//       sx={{
//         maxWidth: 420,
//         margin: "auto",
//         padding: 3,
//         borderRadius: 8,
//         boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
//         textAlign: "center",
//       }}
//     >
//       {/* Wallet Connection Section */}

//       {/* Uncollected Fees Section */}
//       <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
//         Uncollected Fees
//       </Typography>
//       <Typography variant="h4" sx={{ fontWeight: "bold", color: "#333" }}>
//         ${totalFees}
//       </Typography>
//       <Box
//         sx={{
//           borderRadius: 8,
//           padding: 2,
//           mt: 2,
//           boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
//         }}
//       >
//         <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
//           <Typography>USDC</Typography>
//           <Typography>
//             {uncollectedFees.USDC} ($
//             {(parseFloat(uncollectedFees.USDC) * 1).toFixed(2)})
//           </Typography>
//         </Box>
//         <Divider />
//         <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
//           <Typography>WETH</Typography>
//           <Typography>
//             {uncollectedFees.WETH} ($
//             {(parseFloat(uncollectedFees.WETH) * 1).toFixed(2)})
//           </Typography>
//         </Box>
//       </Box>
//       <Box
//         sx={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           mt: 2,
//         }}
//       >
//         <Typography>Collect as WETH</Typography>
//         <Switch checked={collectAsWETH} onChange={handleToggle} />
//       </Box>
//       <Button
//         onClick={handleCollectFees}
//         disabled={!isConnected || isLoading}
//         fullWidth
//         sx={{
//           mt: 3,
//           background: "linear-gradient(90deg, #4A90E2, #2172E5)",
//           color: "#FFFFFF",
//           fontWeight: "bold",
//         }}
//       >
//         {isLoading ? (
//           <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
//         ) : (
//           "Collect Fees"
//         )}
//       </Button>
//       {error && (
//         <Typography
//           variant="body2"
//           sx={{
//             marginTop: 2,
//             color: "#FF4D4F",
//           }}
//         >
//           Error: {error}
//         </Typography>
//       )}
//     </Box>
//   );
// };

// export default CollectFees;



import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import Web3 from "web3";
import { useAccount } from "wagmi";
import nftPositionManagerABI from "../../ABI/nftPositionManagerABI.json";
import BigNumber from "bignumber.js";
import TransactionModal from "../../comman/TransactionModal";

const CollectFees = ({ position }) => {
  const { address, isConnected } = useAccount();
  const [collectAsWETH, setCollectAsWETH] = useState(false); // Toggle state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false); // Control modal visibility
  const [transactionStatus, setTransactionStatus] = useState("pending"); // "pending", "success", "error"
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // Uncollected fees derived from position data
  const token0Fees = Web3.utils.fromWei(position.tokensOwed0, "ether");
  const token1Fees = Web3.utils.fromWei(position.tokensOwed1, "ether");

  const handleCollectFees = async () => {
    setIsLoading(true);
    setError("");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Collecting fees, please wait...");

    try {
      if (!address) {
        throw new Error("Please connect your wallet to proceed.");
      }

      const web3 = new Web3(window.ethereum);
      const nftPositionManagerAddress =
        "0xF293E305d3aa515d531f87c79Cbe7db9DfE96810";
      const nftPositionManager = new web3.eth.Contract(
        nftPositionManagerABI,
        nftPositionManagerAddress
      );

      const amount0Max = new BigNumber(2).pow(128).minus(1).toFixed();
      const amount1Max = new BigNumber(2).pow(128).minus(1).toFixed();
      const recipient = collectAsWETH ? nftPositionManagerAddress : address;

      const tx = await nftPositionManager.methods
        .collect({
          tokenId: position.tokenId,
          recipient,
          amount0Max,
          amount1Max,
        })
        .send({ from: address });

      setTransactionHash(tx.transactionHash);
      setTransactionStatus("success");
      setTransactionMessage("Transaction completed successfully!");
    } catch (err) {
      console.error("Error collecting fees:", err);
      setTransactionStatus("error");
      setTransactionMessage(err.message || "An error occurred during the transaction.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={handleCloseModal}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />

      <Box
        sx={{
          maxWidth: 420,
          margin: "auto",
          padding: 3,
          borderRadius: 8,
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          Uncollected Fees for Position #{position.tokenId}
        </Typography>
        <Box
          sx={{
            borderRadius: 8,
            padding: 2,
            mt: 2,
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography>{position.token0Symbol}</Typography>
            <Typography>
              {token0Fees} {position.token0Symbol}
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography>{position.token1Symbol}</Typography>
            <Typography>
              {token1Fees} {position.token1Symbol}
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={handleCollectFees}
          disabled={!isConnected || isLoading}
          fullWidth
           color="primary"
             variant="contained"
          sx={{
            mt: 3,
   borderRadius:8,
            color: "#FFFFFF",
            fontWeight: "bold",
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
          ) : (
            "Collect Fees"
          )}
        </Button>
        {error && (
          <Typography
            variant="body2"
            sx={{
              marginTop: 2,
              color: "#FF4D4F",
            }}
          >
            Error: {error}
          </Typography>
        )}
      </Box>
    </>
  );
};

export default CollectFees;
