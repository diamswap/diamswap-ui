import { Button, Typography } from "@mui/material";
import React, { useState } from "react";

const DiamWalletConnect = () => {
  const [publicKey, setPublicKey] = useState(null);
  const [error, setError] = useState(null);
  const [signedMessage, setSignedMessage] = useState(null);

  const connectToDiamWallet = async () => {
    // Wait for 1 second before checking for the extension
    setTimeout(async () => {
      if (window.diam) {
        try {
          // Attempt to connect to DIAM Wallet
          const connectionResult = await window.diam.connect();
          console.log("Connection Result:", connectionResult);

          const publicKeyData = connectionResult?.message?.data?.[0];
          console.log("publicKeyData", publicKeyData);
          if (publicKeyData && publicKeyData.diamPublicKey) {
            setPublicKey(publicKeyData.diamPublicKey);
            console.log(`Public Key: ${publicKeyData.diamPublicKey}`);
          } else {
            setError("DIAM PublicKey not found in the connection result.");
          }

          const messageToSign =
            "AAAAAgAAAADD9u0l8B7fMgvRITQuplXFfTskVrNgTgyBN1heDfkLEAAAAGQApCseAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAADId5UakWjIgj3XsdYXl/8mJKTpUSUIu8F3IcB7cKoQ1wAAAAAAAAAAAExLQAAAAAAAAAAA";
          const signResult = await window.diam.sign(
            messageToSign,
            true,
            "Diamante Testnet 2024"
          );
          setSignedMessage(signResult);
          console.log("Signed message:", signResult);
        } catch (error) {
          setError(
            `Error connecting to the DIAM Wallet or signing the message: ${error}`
          );
          console.error("Error:", error);
        }
      } else {
        setError("DIAM Wallet is not installed or not available.");
      }
    }, 1000); // Delay of 1 second
  };

  return (
    <div>
      <Button
        onClick={connectToDiamWallet}
        variant="contained"
        fullWidth
        sx={{
          backgroundColor: "#fff",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "14px",
          color: "#000",
          width: "150px",
        }}
      >
        <Typography color="#000">Connect</Typography>
      </Button>
    </div>
  );
};

export default DiamWalletConnect;
