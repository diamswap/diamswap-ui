import React from 'react';

import {
  Avatar,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const ButtonConnect = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {

        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
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
                    <Typography color='#000'>Connect</Typography>
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button">
                    Wrong network
                  </button>
                );
              }
              return (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={openAccountModal}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "transparent",
                      border: "2px solid #453c4d",
                      color: "#D9D9D9",
                      borderRadius: "14px",
                      width: isMobile ? "100%" : "10rem",
                      fontSize: isMobile ? "12px" : "16px",
                      height: isMobile ? "2.5rem" : "3rem",
                      padding: "0 10px",
                    }}
                  >
                    {/* Avatar and Account Name */}
                    {account.ensAvatar ? (
                      <Avatar
                        src={account.ensAvatar}
                        alt="Avatar"
                        sx={{
                          width: "1.8rem",
                          height: "1.8rem",
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: "1.8rem",
                          height: "1.8rem",
                          bgcolor: "#F5C6D4", 
                        }}
                      >
                        🐷
                        
                      </Avatar>
                    )}
                    <Typography
                      style={{
                        fontSize: "1rem",
                        fontWeight: "500",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {account.displayName}
                    </Typography>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
