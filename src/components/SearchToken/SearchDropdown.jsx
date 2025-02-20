import React from "react";
import { Box, Typography, List, ListItem } from "@mui/material";
import { Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const listItemStyles = {
  display: "flex",
  alignItems: "center",
  padding: "8px 16px",
  gap: "12px",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#3A3A4C",
  },
};

const iconBoxStyles = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  backgroundColor: "#555",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const SearchDropdown = ({
  tokens,
  recentSearches,
  clearSearchInput,
  setRecentSearches,
}) => {
  const navigate = useNavigate();

  const handleNavigation = (token) => {
    clearSearchInput();
    navigate(`/explore/tokens/${token.name}`, { state: { token } });
    setRecentSearches((prev) => {
      const newSearches = [token, ...prev];
      return newSearches.slice(0, 5);
    });
  };

  return (
    <Box
      sx={{
        backgroundColor: "#000",
        borderRadius: "12px",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
        overflow: "hidden",
        color: "white",
      }}
    >
      {/* Recent Searches Section */}
      {recentSearches.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justify: "center",
            padding: "8px 16px",
            gap: "12px",
            fontSize: "14px",
            alignItems: "center",
          }}
        >
          <Clock size={20} color="#fafafa" />
          Recent searches
        </Box>
      )}
      <List>
        {recentSearches.slice(0, 2).map((search, index) => (
          <ListItem
            key={index}
            sx={listItemStyles}
            onClick={() => handleNavigation(search)}
          >
            <Box sx={iconBoxStyles}>
              <img
                src={search.image}
                alt={search.name}
                style={{ width: "24px", height: "24px", borderRadius: "50%" }}
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: "white",
                }}
              >
                {search.name}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#AAAAAA" }}>
                {search.symbol.toUpperCase()}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color:
                    search.price_change_percentage_24h > 0 ? "green" : "red",
                }}
              >
                {search.price_change_percentage_24h
                  ? `${search.price_change_percentage_24h.toFixed(2)}%`
                  : "-"}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Tokens Section */}
      <Box
        sx={{
          display: "flex",
          justify: "center",
          padding: "8px 16px",
          gap: "12px",
          fontSize: "14px",
          alignItems: "center",
        }}
      >
        <TrendingUp size={20} color="#fafafa" />
        Tokens
      </Box>
      <List>
        {tokens.slice(0, 5).map((token, index) => (
          <ListItem
            key={index}
            sx={listItemStyles}
            onClick={() => handleNavigation(token)}
          >
            <Box sx={iconBoxStyles}>
              <img
                src={token.image}
                alt={token.name}
                style={{ width: "24px", height: "24px", borderRadius: "50%" }}
              />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: "white",
                }}
              >
                {token.name}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#AAAAAA" }}>
                {token.symbol.toUpperCase()}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color:
                    token.price_change_percentage_24h > 0 ? "green" : "red",
                }}
              >
                {token.price_change_percentage_24h
                  ? `${token.price_change_percentage_24h.toFixed(2)}%`
                  : "-"}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SearchDropdown;
