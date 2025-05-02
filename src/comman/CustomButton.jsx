import React from 'react';
import { Button } from '@mui/material';

const CustomButton = ({
  variant = "contained",
  fullWidth = true,
  color = "#ccc",
  hoverColor = "#fff",
  textColor = "#000",
  disabledBg = "#000",
  disabledTextColor = "#888",
  borderRadius = 8,
  py = 1.5,
  onClick,
  children,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      fullWidth={fullWidth}
      sx={{
        bgcolor: color,
        color: textColor,
        py: py,
        borderRadius: borderRadius,
        "&:hover": {
          bgcolor: hoverColor,
        },
        // Disabled state styling
        "&.Mui-disabled": {
          bgcolor: disabledBg,
          color: disabledTextColor,
        },
      }}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
};

export default CustomButton;
