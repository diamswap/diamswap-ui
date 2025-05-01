// src/components/ClaimFeesModal.jsx

import React, { useState } from "react";
import { Modal, Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { IoCloseCircleOutline } from "react-icons/io5";
import CustomButton from "../comman/CustomButton";

/**
 * ClaimFeesModal
 *
 * Props:
 *  - open: boolean
 *  - poolId: string
 *  - claimableFees: { feeA: string, feeB: string, codeA: string, codeB: string } | null
 *  - onClose: () => void
 *  - onConfirm: (poolId: string) => Promise<void>
 */
export default function ClaimFeesModal({
  open,
  poolId,
  claimableFees,
  onClose,
  onConfirm,
}) {

  console.log("claimableFees",claimableFees)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      await onConfirm(poolId);
      onClose();
    } catch (e) {
      setError(e.message || "Claim failed");
    } finally {
      setLoading(false);
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
          bgcolor: "#0A1B1F",
          color: "#fff",
          p: 4,
          borderRadius: 2,
          width: 400,
          maxWidth: "90vw",
          textAlign: "center",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 600 }}>Claim Fees</Typography>
          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <IoCloseCircleOutline />
          </IconButton>
        </Box>

        {/* Pool ID */}
        <Typography sx={{ mb: 2, fontSize: 14, wordBreak: "break-all" }}>
          <strong>Pool ID:</strong> {poolId}
        </Typography>

        {/* Claimable fees breakdown */}
        {claimableFees ? (
          <Box sx={{ mb: 3, textAlign: "left" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 1 }}>
              You will claim:
            </Typography>
            <Typography sx={{ fontSize: 16 }}>
              • {claimableFees.feeA} {claimableFees.codeA}
            </Typography>
            <Typography sx={{ fontSize: 16 }}>
              • {claimableFees.feeB} {claimableFees.codeB}
            </Typography>
          </Box>
        ) : (
          <Typography sx={{ mb: 3, fontSize: 16 }}>
            Calculating claimable fees…
          </Typography>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Confirm Button */}
        <CustomButton
          onClick={handleConfirm}
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Confirm Claim"}
        </CustomButton>
      </Box>
    </Modal>
  );
}
