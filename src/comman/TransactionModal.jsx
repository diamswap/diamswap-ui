// src/components/TransactionModal.js
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import { MdCheckCircle, MdError } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { AiOutlineCopy } from "react-icons/ai";

const TransactionModal = ({
  open,
  onClose,
  status, // "pending", "success", "error"
  message,
  transactionHash,
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopy = () => {
    if (transactionHash) {
      navigator.clipboard.writeText(transactionHash);
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <CircularProgress size={50} sx={{ color: "#8e44ad" }} />;
      case "success":
        return <MdCheckCircle size={50} color="#4caf50" />;
      case "error":
        return <MdError size={50} color="#e74c3c" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "pending":
        return "Transaction Processing";
      case "success":
        return "Transaction Successful";
      case "error":
        return "Transaction Declined";
      default:
        return "Transaction Status";
    }
  };

  console.log("TransactionModal props:", { status, message, transactionHash });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          style: {
            backgroundColor: "#000",
            borderRadius: "8px",
            padding: "30px",
            color: "#fff",
            textAlign: "center",
            minWidth: "500px",
            position: "relative",
            border: "1px solid gray",
          },
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: "10px",
            right: "10px",
            color: "#fff",
          }}
        >
          <IoClose size={24} />
        </IconButton>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            width: "500px",
          }}
        >
          <Box>{getStatusIcon()}</Box>
          <Typography variant="h6" sx={{ marginTop: "20px", fontWeight: "bold", fontSize: "20px" }}>
            {getStatusMessage()}
          </Typography>
          <Typography sx={{ marginTop: "10px", fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>
            {message}
          </Typography>
          {transactionHash && status === "success" && (
            <Box
              sx={{
                marginTop: "20px",
                fontSize: "14px",
                wordBreak: "break-word",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Typography>Transaction Hash:</Typography>
              {transactionHash ? (
                <a
                  href={`https://testnetexplorer.diamante.io/about-tx-hash/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  {`https://testnetexplorer.diamante.io/about-tx-hash/${transactionHash}`}
                </a>
              ) : (
                "No transaction hash available"
              )}
              <IconButton onClick={handleCopy} sx={{ color: "#64b5f6", padding: 0 }}>
                <AiOutlineCopy size={18} />
              </IconButton>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: "100%" }}>
          Transaction hash copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default TransactionModal;
