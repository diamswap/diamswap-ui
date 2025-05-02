// src/comman/TransactionModal.jsx
import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import { Copy as CopyIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#121212',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  textAlign: 'center',
  border: "1px solid gray",

  width: 400,
};

export default function TransactionModal({
  open,
  onClose,
  status,
  message,
  transactionHash,
}) {
  // truncate to first 8 & last 8 characters
  const truncated = transactionHash
    ? `${transactionHash.slice(0, 8)}...${transactionHash.slice(-8)}`
    : '';

  const handleCopy = () => {
    if (!transactionHash) return;
    navigator.clipboard.writeText(transactionHash);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        {status === 'pending' ? (
          <>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>{message}</Typography>
          </>
        ) : status === 'success' ? (
          <>
            <Typography variant="h5" gutterBottom>
             Pool ID
            </Typography>
            {transactionHash && (
              <Box
                sx={{
                  mt: 2,
                  px: 2,
                  py: 1,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {truncated}
                </Typography>
                <IconButton size="small" onClick={handleCopy}>
                  <CopyIcon size={16} />
                </IconButton>
              </Box>
            )}
          </>
        ) : (
          <Typography variant="h6" color="error">
            {message}
          </Typography>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 1 }}>
          {status === 'success' && transactionHash && (
            <Button
              component={Link}
              to="/pools/view-position"
              state={{ poolId: transactionHash }}
              variant="contained"
            >
              View Pools
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={status === 'pending'}
          >
            {status === 'pending' ? 'Please wait…' : 'Close'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
