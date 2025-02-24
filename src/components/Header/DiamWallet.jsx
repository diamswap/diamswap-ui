import React, { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Modal,
  Box,
  IconButton
} from "@mui/material";
import { AiOutlineClose } from "react-icons/ai"; // <-- Import close icon from react-icons

const DiamWalletConnect = () => {
  const [publicKey, setPublicKey] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // On mount, retrieve the stored public key (if any)
  useEffect(() => {
    const storedKey = localStorage.getItem("diamPublicKey");
    if (storedKey) {
      setPublicKey(storedKey);
    }
  }, []);

  // Helper to shorten the wallet address
  const shortenAddress = (address) => {
    if (!address) return "";
    return address.slice(0, 4) + "..." + address.slice(-4);
  };

  // Attempt to connect to DIAM Wallet
  const connectToDiamWallet = async () => {
    if (!window.diam) {
      setError("DIAM Wallet is not installed or not available.");
      return;
    }
    try {
      const connectionResult = await window.diam.connect();
      console.log("Connection Result:", connectionResult);

      const publicKeyData = connectionResult?.message?.data?.[0];
      if (publicKeyData && publicKeyData.diamPublicKey) {
        const walletKey = publicKeyData.diamPublicKey;
        setPublicKey(walletKey);
        localStorage.setItem("diamPublicKey", walletKey);
      } else {
        setError("DIAM PublicKey not found in the connection result.");
      }
    } catch (err) {
      setError(`Error connecting to the DIAM Wallet: ${err}`);
      console.error("Error:", err);
    }
  };

  // Handle button click:
  // - If not connected, connect first, then open modal on success
  // - If already connected, just open modal
  const handleButtonClick = async () => {
    setError(null);

    if (!publicKey) {
      await connectToDiamWallet();
      // Check if we got a publicKey after connecting
      if (publicKey || localStorage.getItem("diamPublicKey")) {
        setIsModalOpen(true);
      }
    } else {
      // Already connected
      setIsModalOpen(true);
    }
  };

  // Disconnect from wallet
  const handleDisconnect = () => {
    setPublicKey(null);
    localStorage.removeItem("diamPublicKey");
    setIsModalOpen(false);
    setError(null);
  };

  // Modal box style
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
  };

  return (
    <Box>
      {/* Button shows "Connect" or shortened address */}
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

      {/* Error display */}
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      {/* Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box sx={{ ...modalStyle, position: "relative", p:5 }}>
          {/* Close Icon in the top-right corner using react-icons */}
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

          {/* Full wallet address if connected */}
          {publicKey && (
            <Typography
              variant="body2"
              sx={{ wordBreak: "break-all", mb: 3, mt: 2 }}
            >
              <strong>Wallet Address:</strong> {publicKey}
            </Typography>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {publicKey && (
              <Button
                onClick={handleDisconnect}
                variant="outlined"
                sx={{
                  textTransform: "none",
                  borderColor: "#fff",
                  color: "black",
                  borderRadius: "14px",
                  backgroundColor:"white",
                  mt:4
                }}
              >
                Disconnect
              </Button>
            )}
          
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default DiamWalletConnect;
