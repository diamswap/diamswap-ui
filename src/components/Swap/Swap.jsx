import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Avatar,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import swap from "../../assets/swap.png";
import { VscSettings } from "react-icons/vsc";
import { CiClock2 } from "react-icons/ci";
import { IoIosArrowDown } from "react-icons/io";
import { useTheme } from "@emotion/react";
import { useAccount } from "wagmi";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import Web3 from "web3";
import swapRouterABI from "../../ABI/swapRouterABI.json";

const IconButton = styled("button")({
  background: "none",
  border: "none",
  padding: "8px",
  borderRadius: "50%",
  cursor: "pointer",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});

const SwapInput = styled(TextField)({
  "& .MuiInputBase-input": {
    color: "white",
    fontSize: "22px",
    padding: "12px 0",
  },
  "& .MuiInput-underline:before": {
    borderBottomColor: "rgba(0, 206, 229, 0.06)",
  },
  "& .MuiInput-underline:hover:before": {
    borderBottomColor: "rgba(0, 206, 229, 0.06)",
  },
});


const ExchangeRateBox = styled(Box)({
  marginTop: "10px",
  textAlign: "center",
  color: "gray",
  fontSize: "14px",
});

export default function SwapInterface({ width }) {
  const { isConnected } = useAccount();
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [web3, setWeb3] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [swapDirection, setSwapDirection] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Custom token and router addresses
  const swapRouterAddress = "0x9bF756b29d65Fd10Ea0bd826CB4315ccaFbB4542";
  const tokenIn = "0x3948cE36B1725a858752E62A6cB19bed716690F0"; // Token to swap from
  const tokenOut = "0x95a2071966414aD466E70600B4D03F6B8c810088"; // Token to swap to

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      // Get connected account
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts) => {
          setUserAddress(accounts[0]);
        });
    } else {
      alert("Please install MetaMask to use this feature.");
    }
  }, []);

  const handlePayAmountChange = (value) => {
    setPayAmount(value);

    // Mock exchange rate
    const exchangeRate = swapDirection ? 0.99 : 1.01;
    const calculatedReceiveAmount = (parseFloat(value) * exchangeRate).toFixed(
      6
    );

    setReceiveAmount(
      isNaN(calculatedReceiveAmount) ? "0" : calculatedReceiveAmount
    );
  };

  const handleReceiveAmountChange = (value) => {
    setReceiveAmount(value);

    // Mock reverse exchange rate
    const exchangeRate = swapDirection ? 1 / 0.99 : 1 / 1.01;
    const calculatedPayAmount = (parseFloat(value) * exchangeRate).toFixed(6);

    setPayAmount(isNaN(calculatedPayAmount) ? "0" : calculatedPayAmount);
  };

  const handleSwapDirection = () => {
    setSwapDirection(!swapDirection);
    setPayAmount("");
    setReceiveAmount("");
  };

  const handleSwap = async () => {
    try {
      setLoading(true);
      setModalOpen(true);
      setTransactionStatus("pending");
      setTransactionMessage("Processing your transaction...");

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

      const tokenContract = new web3.eth.Contract(
        erc20ABI,
        swapDirection ? tokenIn : tokenOut
      );
      const amountInWei = web3.utils.toWei(payAmount, "ether");

      // Step 1: Approve
      const gasEstimateApprove = await tokenContract.methods
        .approve(swapRouterAddress, amountInWei)
        .estimateGas({ from: userAddress });

      const approvalTx = await tokenContract.methods
        .approve(swapRouterAddress, amountInWei)
        .send({ from: userAddress, gas: gasEstimateApprove });

      console.log("Approval successful:", approvalTx.transactionHash);

      // Step 2: Swap
      const swapRouter = new web3.eth.Contract(
        swapRouterABI,
        swapRouterAddress
      );
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10-minute deadline
      const params = {
        tokenIn: swapDirection ? tokenIn : tokenOut,
        tokenOut: swapDirection ? tokenOut : tokenIn,
        fee: 3000,
        recipient: userAddress,
        deadline,
        amountIn: amountInWei,
        amountOutMinimum: 0, // No slippage protection for now
        sqrtPriceLimitX96: 0,
      };

      const gasEstimateSwap = await swapRouter.methods
        .exactInputSingle(params)
        .estimateGas({ from: userAddress });

      const swapTx = await swapRouter.methods
        .exactInputSingle(params)
        .send({ from: userAddress, gas: gasEstimateSwap + 50000 });

      console.log("Swap successful:", swapTx.transactionHash);
      setTransactionHash(swapTx.transactionHash);
      setTransactionStatus("success");
      setTransactionMessage("Your transaction was successful.");
    } catch (error) {
      console.error("Swap failed:", error);
      setTransactionStatus("error");
      setLoading(false);
      setTransactionMessage("Transaction failed. Check console for details.");
    }
  };

  return (
    <Box>
      <Box
        sx={{
          width: width || (isMobile ? "100%" : "500px"),
          backgroundColor: "rgba(0, 206, 229, 0.06)",
          margin: "2rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Swap</Typography>
            <Box>
              <IconButton>
                <CiClock2 size={20} />
              </IconButton>
              <IconButton>
                <VscSettings size={20} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Typography variant="caption" sx={{ color: "gray" }}>
              Available Balance:{" "}
              {swapDirection ? "USDT Balance" : "DAI Balance"}{" "}
              <span style={{ color: "#fff" }}>MAX</span>
            </Typography>
          </Box>

          <Box sx={{ position: "relative" }}>
            {/* Pay Section */}
            <Typography sx={{ color: "gray", textAlign: "left" }}>
              Pay
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <SwapInput
                variant="standard"
                placeholder="0"
                value={payAmount}
                onChange={(e) => handlePayAmountChange(e.target.value)}
                fullWidth
              />
              <Button
                sx={{
                  marginLeft: "10px",
                  display: "flex",
                  alignItems: "center",
                  background: "#000",
                  padding: "8px 16px",
                  borderRadius: "20px",
                }}
              >
                <Avatar
                  sx={{ width: 24, height: 24, marginRight: "8px" }}
                  src={
                    swapDirection
                      ? "https://cryptologos.cc/logos/tether-usdt-logo.png?v=023"
                      : "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png?v=023"
                  }
                />
                {swapDirection ? "USDT" : "DAI"} <IoIosArrowDown />
              </Button>
            </Box>

            {/* Swap Icon Button centered between Pay and Receive */}
            <Box
              sx={{
                position: "absolute",
                top: "60%",
                left: "40%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                cursor: "pointer",
              }}
            >
              <IconButton onClick={handleSwapDirection}>
                <img src={swap} style={{ height: "2.5rem" }} alt="Swap" />
              </IconButton>
            </Box>

            {/* Receive Section */}
            <Typography sx={{ color: "gray", textAlign: "left" }}>
              Receive
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <SwapInput
                variant="standard"
                placeholder="0"
                value={receiveAmount}
                onChange={(e) => handleReceiveAmountChange(e.target.value)}
                fullWidth
              />
              <Button
                sx={{
                  marginLeft: "10px",
                  display: "flex",
                  alignItems: "center",
                  background: "#000",
                  padding: "8px 16px",
                  borderRadius: "20px",
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    marginRight: "8px",
                    backgroundColor: "#000",
                  }}
                  src={
                    swapDirection
                      ? "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png?v=023"
                      : "https://cryptologos.cc/logos/tether-usdt-logo.png?v=023"
                  }
                />
                {swapDirection ? "DAI" : "USDT"} <IoIosArrowDown />
              </Button>
            </Box>
          </Box>

          <ExchangeRateBox>
            {swapDirection
              ? `1 DAI = 0.99 USDT ($1.00)`
              : `1 USDT = 1.01 DAI ($1.00)`}
          </ExchangeRateBox>


          <CustomButton onClick={handleSwap}>
            {isConnected ? "Swap" : "Connect Wallet"}
          </CustomButton>
        </Stack>

        <TransactionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          status={transactionStatus}
          message={transactionMessage}
          transactionHash={transactionHash}
        />
      </Box>
    </Box>
  );
}

// import React, { useState, useEffect } from "react";
// import Web3 from "web3";
// import swapRouterABI from "../../ABI/swapRouterABI.json"; // Replace with your actual path to the ABI
// import {
//   Box,
//   Button,
//   Typography,
//   TextField,
//   Avatar,
//   IconButton,
//   Modal,
//   CircularProgress,
// } from "@mui/material";
// import { IoIosArrowDown } from "react-icons/io";
// import { IoMdSwap } from "react-icons/io";
// import TransactionModal from "../../comman/TransactionModal";
// import { styled } from "@mui/material/styles";

// const SwapInput = styled(TextField)({
//   "& .MuiInputBase-input": {
//     color: "white",
//     fontSize: "22px",
//     padding: "12px 0",
//   },
//   "& .MuiInput-underline:before": {
//     borderBottomColor: "rgba(0, 206, 229, 0.06)",
//   },
//   "& .MuiInput-underline:hover:before": {
//     borderBottomColor: "rgba(0, 206, 229, 0.06)",
//   },
// });

// const SwapComponent = () => {
//   const [web3, setWeb3] = useState(null);
//   const [userAddress, setUserAddress] = useState("");
//   const [amountIn, setAmountIn] = useState("0.1"); // Default amount to swap
//   const [transactionHash, setTransactionHash] = useState("");
//   const [swapDirection, setSwapDirection] = useState(true); // true for tokenIn -> tokenOut, false for reverse
//   const [modalOpen, setModalOpen] = useState(false);
//   const [transactionStatus, setTransactionStatus] = useState("");
//   const [transactionMessage, setTransactionMessage] = useState("");

//   const swapRouterAddress = "0x9bF756b29d65Fd10Ea0bd826CB4315ccaFbB4542";
//   const tokenIn = "0x3948cE36B1725a858752E62A6cB19bed716690F0"; // Token to swap from
//   const tokenOut = "0x95a2071966414aD466E70600B4D03F6B8c810088"; // Token to swap to

//   useEffect(() => {
//     if (window.ethereum) {
//       const web3Instance = new Web3(window.ethereum);
//       setWeb3(web3Instance);

//       // Get connected account
//       window.ethereum
//         .request({ method: "eth_requestAccounts" })
//         .then((accounts) => {
//           setUserAddress(accounts[0]);
//         });
//     } else {
//       alert("Please install MetaMask to use this feature.");
//     }
//   }, []);

//   const handleSwap = async () => {
//     try {
//       setModalOpen(true);
//       setTransactionStatus("processing");
//       setTransactionMessage("Processing your transaction...");

//       const erc20ABI = [
//         {
//           constant: false,
//           inputs: [
//             { name: "spender", type: "address" },
//             { name: "amount", type: "uint256" },
//           ],
//           name: "approve",
//           outputs: [{ name: "", type: "bool" }],
//           type: "function",
//         },
//       ];

//       const tokenContract = new web3.eth.Contract(
//         erc20ABI,
//         swapDirection ? tokenIn : tokenOut
//       );
//       const amountInWei = web3.utils.toWei(amountIn, "ether");

//       // Step 1: Approve
//       const gasEstimateApprove = await tokenContract.methods
//         .approve(swapRouterAddress, amountInWei)
//         .estimateGas({ from: userAddress });

//       const approvalTx = await tokenContract.methods
//         .approve(swapRouterAddress, amountInWei)
//         .send({ from: userAddress, gas: gasEstimateApprove });

//       console.log("Approval successful:", approvalTx.transactionHash);

//       // Step 2: Swap
//       const swapRouter = new web3.eth.Contract(
//         swapRouterABI,
//         swapRouterAddress
//       );
//       const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10-minute deadline
//       const params = {
//         tokenIn: swapDirection ? tokenIn : tokenOut,
//         tokenOut: swapDirection ? tokenOut : tokenIn,
//         fee: 3000,
//         recipient: userAddress,
//         deadline,
//         amountIn: amountInWei,
//         amountOutMinimum: 0, // No slippage protection for now
//         sqrtPriceLimitX96: 0,
//       };

//       const gasEstimateSwap = await swapRouter.methods
//         .exactInputSingle(params)
//         .estimateGas({ from: userAddress });

//       const swapTx = await swapRouter.methods
//         .exactInputSingle(params)
//         .send({ from: userAddress, gas: gasEstimateSwap + 50000 });

//       console.log("Swap successful:", swapTx.transactionHash);
//       setTransactionHash(swapTx.transactionHash);
//       setTransactionStatus("success");
//       setTransactionMessage("Your transaction was successful.");
//     } catch (error) {
//       console.error("Swap failed:", error);
//       setTransactionStatus("failed");
//       setTransactionMessage("Transaction failed. Check console for details.");
//     }
//   };

//   const handleSwapDirection = () => {
//     setSwapDirection(!swapDirection);
//   };

//   return (
//     <Box
//       sx={{
//         backgroundColor: "transparent",
//         width:"500px",
//         margin: "2rem auto",
//         borderRadius: "16px",
//         border: "1px solid #FFFFFF4D",
//         padding: "2rem",
//         color: "#FFFFFF",
//         boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
//         position: "relative",
//         overflow: "hidden",
//       }}
//     >
//       <Typography
//         variant="h6"
//         sx={{ fontWeight: "bold", marginBottom: "20px", textAlign: "center" }}
//       >
//         Swap Tokens
//       </Typography>

//       {/* Token In Section */}
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           gap: 2,
//           backgroundColor: "black",
//         }}
//       >
//         <SwapInput
//           fullWidth
//           variant="standard"
//           value={amountIn}
//           onChange={(e) => setAmountIn(e.target.value)}
//         />
//         <Button
//           sx={{
//             marginLeft: "10px",
//             display: "flex",
//             alignItems: "center",
//             background: "#e3e3e3",
//             padding: "8px 16px",
//             borderRadius: "20px",
//           }}
//         >
//           <Avatar
//             sx={{ width: 24, height: 24, marginRight: "8px" }}
//             src={swapDirection ? "/tokenInIcon.png" : "/tokenOutIcon.png"}
//           />
//           {swapDirection ? "USDT" : "DAI"} <IoIosArrowDown />
//         </Button>
//       </Box>

//       {/* Swap Icon/Button */}
//       <Box
//         sx={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           margin: "20px 0",
//         }}
//       >
//         <IconButton
//           sx={{
//             background: "#f3f3f3",
//             borderRadius: "50%",
//             width: "40px",
//             height: "40px",
//             boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
//           }}
//           onClick={handleSwapDirection}
//         >
//           <IoMdSwap size={24} />
//         </IconButton>
//       </Box>

//       {/* Token Out Section */}
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           gap: 2,
//           backgroundColor: "black",
//         }}
//       >
//         <SwapInput fullWidth variant="standard" disabled value="~" />

//       </Box>

//       {/* Combined Action Button */}
//       <Button
//         fullWidth
//         sx={{
//           background: "#fff",
//           color: "#fff",
//           fontWeight: "bold",
//           padding: "10px",
//           borderRadius: "10px",
//           "&:hover": { background: "#1976d2" },
//         }}
//         onClick={handleSwap}
//       >
//         Approve and Swap
//       </Button>

//     </Box>
//   );
// };

// export default SwapComponent;
