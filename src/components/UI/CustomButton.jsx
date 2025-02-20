import React from 'react';
import { Button } from '@mui/material';

const CustomButton = ({ text, onClick }) => (
  <Button
    sx={{
      borderRadius: '12px',
      textTransform: 'none',
      fontWeight: 600,
      padding: '1rem 2rem',
      fontSize: '1rem',
      color:'white'
    }}
    onClick={onClick}
  >
    {text}
  </Button>
);

export default CustomButton;
