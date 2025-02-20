// StakingComingSoon.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/system';

// Define keyframes for the fade in and fade out effect
const fadeInOut = keyframes`
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
`;

// Styled Box component for container
const ComingSoonContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
}));

// Styled Typography component for text animation
const AnimatedText = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',

  animation: `${fadeInOut} 3s infinite`,
}));

const Transactions = () => {
  return (
    <ComingSoonContainer>
      <AnimatedText>Transactions Coming Soon</AnimatedText>
    </ComingSoonContainer>
  );
};

export default Transactions;
