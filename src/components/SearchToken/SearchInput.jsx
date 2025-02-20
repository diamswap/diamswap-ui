import React from "react";
import { Box, TextField, InputAdornment } from "@mui/material";
import { FaSearch } from "react-icons/fa";

const SearchInput = ({onFocus, onBlur, searchQuery, setSearchQuery}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(0, 206, 229, 0.06)",
        borderRadius: "12px",
        padding: "0.5rem 1rem",
        width: "100%",
        maxWidth: "400px",
        border: "1px solid rgba(0, 206, 229, 0.2)"
      }}
    >
      <FaSearch style={{ color: "#A9A9A9", marginRight: "0.5rem" }} />
      <input
        type="text"
        placeholder="Search tokens"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          width: "100%",
          fontSize: "14px",
          color: "#555555",
        }}
      />
      <span style={{ color: "#A9A9A9", fontSize: "14px", marginLeft: "0.5rem" }}>
        /
      </span>
    </Box>
  );
};

export default SearchInput;
