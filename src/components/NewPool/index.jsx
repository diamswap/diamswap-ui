import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import TokenPairSelection from "./TokenPairSelection";
import PriceRange from "./PriceRange";
import DepositTokens from "./DepositTokens";
import { approveToken, mintPosition } from "../../services/createPosition";
import { useAccount } from "wagmi";
import Web3 from "web3";
import TransactionModal from "../../comman/TransactionModal";

const steps = [
  { label: "Step 1", description: "Select token pair and fees" },
  { label: "Step 2", description: "Set price range" },
  { label: "Step 3", description: "Enter deposit amounts" },
];

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  paddingTop: theme.spacing(4),
}));

const StepperWrapper = styled(Box)(({ theme }) => ({
  width: "280px",
  flexShrink: 0,
  border: "1px solid #33373a",
  background: "rgba(0, 206, 229, 0.06)",
  height: "100%",
  padding: "1.5rem",
  borderRadius: 8,
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  maxWidth: "600px",
  background: "rgba(0, 206, 229, 0.06)",
}));

const NewPosition = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedToken1, setSelectedToken1] = useState(null);
  const [selectedToken2, setSelectedToken2] = useState(null);
  const [fee, setFee] = useState(3000);
  const [priceRange, setPriceRange] = useState({ lower: 0.95, upper: 1.05 });
  const [amounts, setAmounts] = useState({ token1: "0.1", token2: "0.1" });
  const [transactionHash, setTransactionHash] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("pending"); // "pending", "success", "error"
  const [modalMessage, setModalMessage] = useState("");
  const { address } = useAccount();
  const nftPositionManagerAddress =
    "0xF293E305d3aa515d531f87c79Cbe7db9DfE96810";

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("Starting handleSubmit...");

      if (!window.ethereum) {
        throw new Error("MetaMask is not detected. Please install it.");
      }

      console.log("Selected Token 1:", selectedToken1);
      console.log("Selected Token 2:", selectedToken2);
      console.log("Wallet Address:", address);

      if (
        !selectedToken1 ||
        !selectedToken1.address ||
        !selectedToken1.address.startsWith("0x")
      ) {
        throw new Error("Invalid or missing Token 1 address.");
      }

      if (
        !selectedToken2 ||
        !selectedToken2.address ||
        !selectedToken2.address.startsWith("0x")
      ) {
        throw new Error("Invalid or missing Token 2 address.");
      }

      if (!address || !address.startsWith("0x")) {
        throw new Error("Invalid wallet address. Please connect your wallet.");
      }

      const token0 = selectedToken1.address;
      const token1 = selectedToken2.address;

      const token0Decimals = selectedToken1.decimals || 18;
      const token1Decimals = selectedToken2.decimals || 18;

      console.log("Token Decimals:", { token0Decimals, token1Decimals });

      if (!amounts.token1 || isNaN(parseFloat(amounts.token1))) {
        throw new Error("Invalid amount for Token 1.");
      }

      if (!amounts.token2 || isNaN(parseFloat(amounts.token2))) {
        throw new Error("Invalid amount for Token 2.");
      }

      const amount0Desired = (
        parseFloat(amounts.token1) *
        10 ** token0Decimals
      ).toString();

      const amount1Desired = (
        parseFloat(amounts.token2) *
        10 ** token1Decimals
      ).toString();

      console.log("Amounts Desired:", { amount0Desired, amount1Desired });

      setModalOpen(true);
      setTransactionStatus("pending");
      setModalMessage("Approving tokens and processing transaction...");

      console.log("Approving Token 1...");
      await approveToken(
        token0,
        nftPositionManagerAddress,
        amount0Desired,
        address
      );

      console.log("Approving Token 2...");
      await approveToken(
        token1,
        nftPositionManagerAddress,
        amount1Desired,
        address
      );

      console.log("Minting Position...");
      const txHash = await mintPosition({
        token0,
        token1,
        fee,
        priceLower: priceRange.lower,
        priceUpper: priceRange.upper,
        amount0Desired,
        amount1Desired,
        recipient: address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      });

      console.log("Transaction Hash:", txHash);

      setTransactionHash(txHash);
      setTransactionStatus("success");
      setModalMessage("Transaction completed successfully.");
    } catch (error) {
      console.error("Error during handleSubmit:", error.message, error.stack);
      setTransactionStatus("error");
      setModalMessage(error.message || "Transaction failed.");
    }
  };

  return (
    <>
    <Box textAlign={'left'} ml={5} > 
   <Typography variant="h4" component="h1" >
    New Position
  </Typography>
   </Box>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        padding: "2rem",
        justifyContent: "space-between",
        alignItems: "center",
        
      }}
    >
 
      <ContentWrapper columnGap={10}>
    
        <StepperWrapper>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle2">{step.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </StepperWrapper>

        <MainContent>
          {activeStep === 0 && (
            <TokenPairSelection
              handleNext={handleNext}
              setSelectedToken1={setSelectedToken1}
              setSelectedToken2={setSelectedToken2}
              selectedToken1={selectedToken1}
              selectedToken2={selectedToken2}
            />
          )}
          {activeStep === 1 && (
            <PriceRange
              handleNext={handleNext}
              handleBack={handleBack}
              selectedToken1={selectedToken1}
              selectedToken2={selectedToken2}
              setPriceRange={setPriceRange}
              priceRange={priceRange}
            />
          )}
          {activeStep === 2 && (
            <DepositTokens
              handleNext={handleNext}
              selectedToken1={selectedToken1}
              selectedToken2={selectedToken2}
              setAmounts={setAmounts}
              amounts={amounts}
              handleSubmit={handleSubmit}
            />
          )}
        </MainContent>
      </ContentWrapper>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={modalMessage}
        transactionHash={transactionHash}
      />
    </Box>
    </>
  );
};

export default NewPosition;
