import React from "react";
import { Select, MenuItem, Box } from "@mui/material";
import { Check } from 'lucide-react';

const Dropdown = ({ value, onChange, items, renderValue }) => (
  <Select
    value={value}
    onChange={onChange}
    size="small"
    displayEmpty
    renderValue={renderValue}
    sx={{
      color: "white",
      backgroundColor: "transparent",
      border: "1px solid white",
      borderRadius: "0.65rem",
      "& .MuiSvgIcon-root": {
        color: "white",
      },
      "& .MuiOutlinedInput-notchedOutline": {
        border: "none",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        border: "none",
      },
    }}
    MenuProps={{
      anchorOrigin: {
        vertical: "bottom",
        horizontal: "right",
      },
      transformOrigin: {
        vertical: "top",
        horizontal: "right",
      },
      PaperProps: {
        sx: {
          marginTop: "0.5rem",
          backgroundColor: "#000",
          color: "white",
          width: "180px",
          borderRadius: "0.65rem",
        },
      },
    }}
  >
    {items.map((item) => (
      <MenuItem
        key={item.value}
        value={item.value}
        sx={{
          display: "flex",
          gap: "1rem",
          justifyContent: "space-between",
          "&.Mui-selected": {
            backgroundColor: "transparent",
          },
          "&.Mui-selected:hover": {
            backgroundColor: "#3A3A4C",
          },
          "&:hover": { backgroundColor: "#3A3A4C" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {item.icon && item.icon}
          {item.label}
        </Box>
        {value === item.value && <Check color="#1ec23a" strokeWidth={1.25} />}
      </MenuItem>
    ))}
  </Select>
);

export default Dropdown;
