// src/components/LiquidityActionModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Divider,
} from "@mui/material";
import { IoCloseCircleOutline } from "react-icons/io5";
import CustomButton from "../comman/CustomButton";

const LiquidityActionModal = ({
  open,
  mode,
  poolId,
  available,
  onClose,
  onAction,
}) => {
  // For "deposit" mode: field1 = TradeToken Amount, field2 = DIAM Amount.
  // For "withdraw" mode: field1 = Pool Shares to Burn, field2 = Min TradeToken to Receive.
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onAction(poolId, field1, field2);
    } catch (error) {
      console.error("Liquidity action error:", error);
    } finally {
      setLoading(false);
      onClose();
      setField1("");
      setField2("");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Box
        sx={{
          position: "relative",
          backgroundColor: "#0A1B1F",
          padding: "3rem",
          borderRadius: "16px",
          width: "650px",
          maxWidth: "90vw",
          color: "#fff",
          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {mode === "deposit" ? "Deposit Liquidity" : "Withdraw Liquidity"}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: "#fff", p: 0.5 }}>
            <IoCloseCircleOutline size={28} />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ mb: 2, mt: 2 }}>
          <strong>Pool ID:</strong> {poolId}
        </Typography>

        {mode === "deposit" ? (
          <>
            <TextField
              label="TradeToken Amount (Deposit)"
              placeholder="e.g. 50.0"
              fullWidth
              variant="outlined"
              helperText="Enter the amount of TradeTokens to deposit."
              sx={{
                mb: 2,
                input: { color: "#fff" },
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1B2730",
                  borderRadius: "8px",
                },
                "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.7)" },
              }}
              value={field1}
              onChange={(e) =>
                setField1(e.target.value.replace(/[^0-9.]/g, ""))
              }
            />
            <TextField
              label="DIAM Amount (Deposit)"
              placeholder="e.g. 100.0"
              fullWidth
              variant="outlined"
              helperText="Enter the DIAM amount to deposit."
              sx={{
                mb: 2,
                input: { color: "#fff" },
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1B2730",
                  borderRadius: "8px",
                },
                "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.7)" },
              }}
              value={field2}
              onChange={(e) =>
                setField2(e.target.value.replace(/[^0-9.]/g, ""))
              }
            />
          </>
        ) : (
          <>
            <Box
              sx={{
                mb: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2">
                <strong>Available Shares:</strong> {available}
              </Typography>
              <Button
                variant="text"
                onClick={() => setField1(available)}
                sx={{
                  color: "#00CEE5",
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                Max
              </Button>
            </Box>
            <TextField
              label="Pool Shares to Burn"
              placeholder="e.g. 0.5"
              fullWidth
              variant="outlined"
              helperText="Enter the number of pool shares you want to burn."
              sx={{
                mb: 2,
                input: { color: "#fff" },
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1B2730",
                  borderRadius: "8px",
                },
                "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.7)" },
              }}
              value={field1}
              onChange={(e) =>
                setField1(e.target.value.replace(/[^0-9.]/g, ""))
              }
            />
            <TextField
              label="Min TradeToken to Receive"
              placeholder="e.g. 10.0"
              fullWidth
              variant="outlined"
              helperText="Enter the minimum number of TradeTokens you expect to receive."
              sx={{
                mb: 2,
                input: { color: "#fff" },
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#1B2730",
                  borderRadius: "8px",
                },
                "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.7)" },
              }}
              value={field2}
              onChange={(e) =>
                setField2(e.target.value.replace(/[^0-9.]/g, ""))
              }
            />
          </>
        )}

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CustomButton
            onClick={handleConfirm}
            disabled={loading}
       
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Confirm"
            )}
          </CustomButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default LiquidityActionModal;
