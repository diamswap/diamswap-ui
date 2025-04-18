// src/components/DiamWalletConnect.jsx

import React, { useState, useEffect } from "react";
import { Button, Typography, Modal, Box, IconButton } from "@mui/material";
import { AiOutlineClose } from "react-icons/ai";
import { Aurora } from "diamnet-sdk";
import CustomButton from "../../comman/CustomButton";

const DiamWalletConnect = () => {
  const [publicKey, setPublicKey] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [loadingAccountData, setLoadingAccountData] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem("diamPublicKey");
    if (storedKey) {
      setPublicKey(storedKey);
    }
  }, []);

  const shortenAddress = (address) => {
    if (!address) return "";
    return address.slice(0, 4) + "..." + address.slice(-4);
  };

  const connectToDiamWallet = async () => {
    if (!window.diam) {
      setError("DIAM Wallet is not installed or not available.");
      return;
    }
  
    try {
      const connectionResult = await window.diam.connect();
      console.log("Connection Result:", connectionResult);
  
      // Grab the first element in message.data[]
      const publicKeyData = connectionResult?.message?.data?.[0] || {};
  
      // Try both possible field names
      const walletKey =
        publicKeyData.publicKey || publicKeyData.diamPublicKey;
  
      if (walletKey) {
        setPublicKey(walletKey);
        localStorage.setItem("diamPublicKey", walletKey);
      } else {
        setError("DIAM publicKey not found in the connection result.");
        console.error("Unexpected data format:", publicKeyData);
      }
    } catch (err) {
      setError(`Error connecting to the DIAM Wallet: ${err.message || err}`);
      console.error("Error connecting to DIAM Wallet:", err);
    }
  };
  
  const handleButtonClick = async () => {
    setError(null);
    if (!publicKey) {
      await connectToDiamWallet();
    }
    if (publicKey || localStorage.getItem("diamPublicKey")) {
      setIsModalOpen(true);
    }
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    localStorage.removeItem("diamPublicKey");
    setIsModalOpen(false);
    setError(null);
    setAccountData(null);
  };

  // Define modal styling
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 440,
    bgcolor: "#001518",
    color: "#fff",
    border: "2px solid gray",
    borderRadius: "16px",
    boxShadow: 24,
    p: 3,
    maxHeight: "80vh",
    overflowY: "auto",
  };

  // Fetch account data from Diamnet using the Aurora server.
  const fetchAccountData = async () => {
    if (!publicKey) return;
    setLoadingAccountData(true);
    try {
      const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
      const data = await server.accounts().accountId(publicKey).call();
      setAccountData(data);
    } catch (err) {
      console.error("Failed to fetch account data:", err);
      setError("Failed to fetch account data.");
    } finally {
      setLoadingAccountData(false);
    }
  };

  // Extract native balance from accountData (if available)
  const getNativeBalance = () => {
    if (accountData && accountData.balances) {
      const nativeBalance = accountData.balances.find(
        (bal) => bal.asset_type === "native"
      );
      return nativeBalance ? nativeBalance.balance : "0";
    }
    return "N/A";
  };

  // Fetch account data when modal opens and publicKey exists.
  useEffect(() => {
    if (isModalOpen && publicKey) {
      fetchAccountData();
    }
  }, [isModalOpen, publicKey]);

  return (
    <Box>
      <Button
        onClick={handleButtonClick}
        variant="contained"
        sx={{
          backgroundColor: "#fff",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "14px",
          color: "#000",
          width: "auto",
          px: 6,
        }}
      >
        {publicKey ? shortenAddress(publicKey) : "Connect"}
      </Button>

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={modalStyle}>
          <IconButton
            onClick={() => setIsModalOpen(false)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
            }}
          >
            <AiOutlineClose size={20} />
          </IconButton>
          {publicKey && (
            <Typography variant="body2" sx={{ wordBreak: "break-all", mb: 3, mt: 2 }}>
              <strong>Wallet Address:</strong> {publicKey}
            </Typography>
          )}
      
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Account Balance</Typography>
            {loadingAccountData ? (
              <Typography>Loading balance...</Typography>
            ) : (
              <Typography variant="body2">
                Native (DIAM): {getNativeBalance()}
              </Typography>
            )}
          </Box>
          <Box sx={{ mb: 2 }}>
            <CustomButton
              onClick={handleDisconnect}
              variant="outlined"
              sx={{
                textTransform: "none",
                borderColor: "#fff",
                color: "#fff",
                borderRadius: "14px",
                backgroundColor: "transparent",
              }}
            >
              Disconnect
            </CustomButton>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default DiamWalletConnect;
