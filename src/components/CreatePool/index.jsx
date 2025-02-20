import React, { useState } from "react";
import Web3 from "web3";
import {
  Box,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { AiOutlinePlusCircle } from "react-icons/ai";
import poolFactoryABI from "../../../swifyFactoryABI.json";
import { useAccount } from "wagmi";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";

const factoryAddress = "0x54fD6917a072e456898B47e8d1C298328F891bC3";

const feeTiers = [
  { value: 500, label: "0.05%" },
  { value: 3000, label: "0.3%" },
  { value: 10000, label: "1%" },
];

const CreatePool = () => {
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [fee, setFee] = useState(500); // Default fee
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("pending"); 
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const { isConnected } = useAccount();

  const handleCreatePool = async () => {
    try {
      setLoading(true);
      setModalOpen(true);
      setTransactionStatus("pending");
      setTransactionMessage("Processing...");

      if (!Web3.utils.isAddress(tokenA) || !Web3.utils.isAddress(tokenB)) {
        setTransactionStatus("error");
        setTransactionMessage("Invalid token addresses.");
        setLoading(false);
        return;
      }
      if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
        setTransactionStatus("error");
        setTransactionMessage("Token A and Token B cannot be the same.");
        setLoading(false);
        return;
      }

      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const userAccount = accounts[0];

      const factoryContract = new web3.eth.Contract(
        poolFactoryABI,
        factoryAddress
      );

      const poolAddress = await factoryContract.methods
        .getPool(tokenA, tokenB, fee)
        .call();
      if (poolAddress !== "0x0000000000000000000000000000000000000000") {
        setTransactionStatus("error");
        setTransactionMessage("Pool already exists.");
        setLoading(false);
        return;
      }

      factoryContract.methods
        .createPool(tokenA, tokenB, fee)
        .send({ from: userAccount })
        .on("transactionHash", (hash) => {
          setTransactionHash(hash);
          setTransactionMessage("Transaction sent, waiting for confirmation...");
        })
        .on("receipt", (receipt) => {
          setTransactionStatus("success");
          setTransactionMessage("Transaction successful!");
          setTransactionHash(receipt.transactionHash);
          setLoading(false);
        })
        .on("error", (error) => {
          setTransactionStatus("error");
          setTransactionMessage("Transaction failed: " + error.message);
          setLoading(false);
        });
    } catch (error) {
      setTransactionStatus("error");
      setTransactionMessage("Transaction failed: " + error.message);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: "40px" }}>
      <Box
        sx={{
          backgroundColor: "rgba(0, 206, 229, 0.06)",
          margin: "2rem auto",
          borderRadius: "16px",
          border: "1px solid #FFFFFF4D",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          position: "relative",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 4 }}>
          Create Liquidity Pool
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Token A:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={tokenA}
            onChange={(e) => setTokenA(e.target.value)}
            placeholder="Enter Token A Address or Select"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <AiOutlinePlusCircle
                    size={24}
                    color="#007bff"
                    style={{ cursor: "pointer" }}
                  />
                </InputAdornment>
              ),
              style: {
                color: "#fff",
                backgroundColor: "transparent",
                borderRadius: "16px",
                border: "1px solid #FFFFFF4D",
              },
            }}
          />
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Token B:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={tokenB}
            onChange={(e) => setTokenB(e.target.value)}
            placeholder="Enter Token B Address or Select"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <AiOutlinePlusCircle
                    size={24}
                    color="#007bff"
                    style={{ cursor: "pointer" }}
                  />
                </InputAdornment>
              ),
              style: {
                color: "#fff",
                backgroundColor: "transparent",
                borderRadius: "16px",
                border: "1px solid #FFFFFF4D",
              },
            }}
          />
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Fee Tier:
          </Typography>
          <Select
            fullWidth
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            sx={{
              color: "#fff",
              backgroundColor: "transparent",
              borderRadius: "16px",
              border: "1px solid #FFFFFF4D",
              ".MuiSelect-icon": { color: "#fff" },
            }}
          >
            {feeTiers.map((tier) => (
              <MenuItem key={tier.value} value={tier.value}>
                {tier.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <CustomButton
          variant="contained"
          fullWidth
          onClick={isConnected ? handleCreatePool : null}
          disabled={loading || !isConnected}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: "#fff" }} />
          ) : isConnected ? (
            "Create Pool"
          ) : (
            "Connect Your Wallet"
          )}
        </CustomButton>
      </Box>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />
    </Container>
  );
};

export default CreatePool;
