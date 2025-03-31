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
    setTransactionMessage("Collecting fees, please wait...");
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
          disabled={isLoading}
          fullWidth
          color="primary"
          variant="contained"
          sx={{
            mt: 3,
            borderRadius: 8,
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
